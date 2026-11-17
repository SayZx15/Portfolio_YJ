import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, sep, extname, relative } from 'node:path';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
export function staticHandler(root) {
  return async (req, res) => {
    const finish = (code, text) => { res.writeHead(code, {'Content-Type':'text/plain; charset=utf-8'}); res.end(text); };
    if (!['GET','HEAD'].includes(req.method)) return finish(405, 'Method not allowed');
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { return finish(400, 'Bad request'); }
    if (pathname === '/') pathname = '/index.html';
    // Only public files are served, never .env, tests, backend or source archives.
    if (pathname !== '/index.html' && !/^\/(src|public)\/[a-zA-Z0-9_./-]+$/.test(pathname)) return finish(404, 'Not found');
    if (pathname.split('/').some(part=>part.startsWith('.')) || !types[extname(pathname)]) return finish(404, 'Not found');
    try {
      const base = await realpath(root);
      const file = await realpath(resolve(root, `.${pathname}`));
      if (!file.startsWith(base + sep) || !(await stat(file)).isFile()) return finish(404, 'Not found');
      const actual = relative(base, file).split(sep).join('/');
      if (actual !== 'index.html' && !/^(src|public)\//.test(actual)) return finish(404, 'Not found');
      if (actual.split('/').some(part => part.startsWith('.')) || !types[extname(file)]) return finish(404, 'Not found');
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': types[extname(file)], 'Content-Length': body.length, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch { finish(404, 'Not found'); }
  };
}
