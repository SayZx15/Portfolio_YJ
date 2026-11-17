import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

export function validateMessage(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const { name, email, message, website = '' } = input;
  if (![name, email, message, website].every(value => typeof value === 'string')) return null;
  const clean = { name: name.trim(), email: email.trim(), message: message.trim(), website: website.trim() };
  if (clean.name.length < 2 || clean.name.length > 100 || /[\r\n\x00-\x1f\x7f]/.test(clean.name)) return null;
  if (clean.email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(clean.email) || /[\x00-\x1f\x7f]/.test(clean.email)) return null;
  if (clean.message.length < 10 || clean.message.length > 3000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(clean.message) || clean.website.length > 500) return null;
  return clean;
}

export function createLimiter({ limit = 5, windowMs = 15 * 60 * 1000, maxEntries = 10000, now = Date.now } = {}) {
  const clients = new Map();
  return function allow(key) {
    const time = now();
    for (const [ip, record] of clients) if (record.until <= time) clients.delete(ip);
    let entry = clients.get(key);
    if (!entry) {
      if (clients.size >= maxEntries) return false;
      entry = { count: 0, until: time + windowMs };
      clients.set(key, entry);
    }
    entry.count += 1;
    return entry.count <= limit;
  };
}

function readJson(req, maxBytes = 16384) {
  return new Promise((resolve, reject) => {
    let size = 0, settled = false;
    const chunks = [];
    req.on('data', chunk => {
      if (settled) return;
      size += chunk.length;
      if (size > maxBytes) { settled = true; chunks.length = 0; reject({ status: 413 }); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject({ status: 400 }); }
    });
    req.on('error', () => { if (!settled) { settled = true; reject({ status: 400 }); } });
    req.on('aborted', () => { if (!settled) { settled = true; reject({ status: 400 }); } });
  });
}

export function createApi({
  allowedOrigins = [], apiKey = '', from = '', to = '',
  fetchImpl = globalThis.fetch, limiter = createLimiter(),
} = {}) {
  const origins = new Set(allowedOrigins);
  return async function api(req, res) {
    const origin = req.headers.origin;
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'Origin');
    const json = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(body));
    };
    let path;
    try { path = new URL(req.url, 'http://localhost').pathname; } catch { return json(400, { ok: false, error: 'Invalid URL' }); }
    if (path === '/api/health' && req.method === 'GET') return json(200, { ok: true });
    if (path !== '/api/contact') return json(404, { ok: false, error: 'Not found' });
    if (!origin || !origins.has(origin)) return json(403, { ok: false, error: 'Origin not allowed' });
    res.setHeader('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' });
      return res.end();
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST, OPTIONS'); return json(405, { ok: false, error: 'Method not allowed' }); }
    // Do not trust visitor-supplied forwarding headers. This is per socket IP.
    if (!limiter(req.socket.remoteAddress || 'unknown')) { res.setHeader('Retry-After', '900'); return json(429, { ok: false, error: 'Too many requests' }); }
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return json(415, { ok: false, error: 'JSON required' });
    let input;
    try { input = await readJson(req); } catch (error) { return json(error.status || 400, { ok: false, error: 'Invalid request body' }); }
    const data = validateMessage(input);
    if (!data) return json(400, { ok: false, error: 'Invalid contact details' });
    if (data.website) return json(200, { ok: true }); // Silent honeypot; no provider call.
    if (!apiKey || !from || !to) return json(503, { ok: false, error: 'Email delivery not configured' });
    try {
      const response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ from, to: [to], reply_to: data.email, subject: `Portfolio — ${data.name}`, text: `Message de ${data.name} (${data.email})\n\n${data.message}` }),
      });
      if (!response.ok) return json(502, { ok: false, error: 'Email provider unavailable' });
      const result = await response.json();
      if (!result.id) return json(502, { ok: false, error: 'Email delivery not confirmed' });
      return json(200, { ok: true });
    } catch { return json(502, { ok: false, error: 'Email provider unavailable' }); }
  };
}

export function apiFromEnv(env = process.env) {
  return createApi({ allowedOrigins: (env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(value => value.trim()).filter(Boolean), apiKey: env.RESEND_API_KEY, from: env.CONTACT_FROM, to: env.CONTACT_TO });
}
export function apiServer(handler) {
  const server = createServer(handler);
  server.requestTimeout = 20000;
  server.headersTimeout = 10000;
  server.maxHeadersCount = 50;
  return server;
}
