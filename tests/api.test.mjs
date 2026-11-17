import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createApi, createLimiter, validateMessage } from '../server/app.mjs';
const origin = 'https://johan.example';
const message = {name:'Camille Martin',email:'camille@example.com',message:'Bonjour Johan, parlons de votre recherche de stage.',website:''};
const provider = [];
function api(overrides={}) {
  return createApi({allowedOrigins:[origin],apiKey:'test-key',from:'portfolio@example.com',to:'owner@example.com',fetchImpl:async (url, options)=>{provider.push({url,options});return {ok:true,json:async()=>({id:'email-test'})};},...overrides});
}
async function request(handler, {method='POST',path='/api/contact',body=message,raw,headers={},ip='127.0.0.1'}={}) {
  const req=new EventEmitter();
  Object.assign(req,{method,url:path,headers:{origin,'content-type':'application/json',...headers},socket:{remoteAddress:ip}});
  const res={headers:{},status:200,body:'',setHeader(key,value){this.headers[key.toLowerCase()]=value;},writeHead(code,values={}){this.status=code;for(const [k,v]of Object.entries(values))this.setHeader(k,v);},end(value=''){this.body=value;}};
  const pending=handler(req,res);
  queueMicrotask(()=>{req.emit('data',Buffer.from(raw ?? JSON.stringify(body)));req.emit('end');});
  await pending;
  return {...res,json:res.body?JSON.parse(res.body):null};
}
test('Validates and trims Unicode names and messages',()=>{assert.deepEqual(validateMessage({...message,name:'  Léa 林  '}),{...message,name:'Léa 林'});});
test('Rejects malformed email, header injection, whitespace, null and oversized values',()=>{
  for(const body of [null,[],{...message,name:' \n '},{...message,name:'Johan\r\nBcc: victim@example.com'},{...message,email:'one@example.com, two@example.com'},{...message,email:'bad@@mail.test'},{...message,message:'x'.repeat(3001)},{...message,message:'          '},{...message,website:42}]) assert.equal(validateMessage(body),null);
});
test('Sends text to fixed owner with visitor as reply-to, never accepts visitor recipient',async()=>{
  const response=await request(api(),{body:{...message,to:'attacker@example.com'}});
  assert.equal(response.status,200);assert.deepEqual(response.json,{ok:true});
  const sent=JSON.parse(provider.at(-1).options.body);
  assert.deepEqual(sent.to,['owner@example.com']);assert.equal(sent.reply_to,message.email);assert.equal(sent.html,undefined);
  assert.ok(sent.text.includes(message.message));assert.equal(response.headers['access-control-allow-origin'],origin);
});
test('Rejects unknown and missing browser origins before sending',async()=>{
  const handler=api();const before=provider.length;
  for(const bad of [undefined,'null','https://attacker.example',`${origin}.evil.test`])assert.equal((await request(handler,{headers:{origin:bad}})).status,403);
  assert.equal(provider.length,before);
});
test('Preflight works only for configured origin',async()=>{const r=await request(api(),{method:'OPTIONS'});assert.equal(r.status,204);assert.equal(r.headers['access-control-allow-methods'],'POST, OPTIONS');});
test('Wrong method and unknown endpoint return correct status',async()=>{assert.equal((await request(api(),{method:'GET'})).status,405);assert.equal((await request(api(),{path:'/api/missing'})).status,404);});
test('Malformed JSON, incorrect media type and oversized bodies are rejected',async()=>{
  assert.equal((await request(api(),{raw:'{"broken"'})).status,400);
  assert.equal((await request(api(),{headers:{'content-type':'text/plain'}})).status,415);
  assert.equal((await request(api(),{raw:'a'.repeat(17000)})).status,413);
});
test('Invalid contact data does not reach the mail provider',async()=>{let calls=0;const r=await request(api({fetchImpl:async()=>{calls++;}}),{body:{...message,email:'no'}});assert.equal(r.status,400);assert.equal(calls,0);});
test('Honeypot reports success without sending',async()=>{const before=provider.length;const r=await request(api(),{body:{...message,website:'https://spam.test'}});assert.equal(r.status,200);assert.equal(provider.length,before);});
test('Unconfigured delivery is explicit, not fake success',async()=>{assert.equal((await request(api({apiKey:''}))).status,503);});
test('Provider errors and unconfirmed results never report success or expose secrets',async()=>{
  for(const fetchImpl of [async()=>({ok:false}),async()=>({ok:true,json:async()=>({})}),async()=>{throw new Error('sensitive secret');}]){const r=await request(api({fetchImpl}));assert.equal(r.status,502);assert.ok(!r.body.includes('sensitive'));}
});
test('Rate limit blocks sixth request and ignores spoofed forwarding headers',async()=>{
  const handler=api();for(let i=0;i<5;i++)assert.equal((await request(handler,{headers:{'x-forwarded-for':`1.2.3.${i}`}})).status,200);
  const r=await request(handler,{headers:{'x-forwarded-for':'8.8.8.8'}});assert.equal(r.status,429);assert.equal(r.headers['retry-after'],'900');
});
test('Rate limit expires and keeps client keys independent',()=>{let time=0;const limiter=createLimiter({limit:1,windowMs:10,now:()=>time});assert.equal(limiter('a'),true);assert.equal(limiter('a'),false);assert.equal(limiter('b'),true);time=11;assert.equal(limiter('a'),true);});
test('Rate limiter bounds memory without evicting active clients',()=>{const limiter=createLimiter({maxEntries:1});assert.equal(limiter('a'),true);assert.equal(limiter('b'),false);});
test('Health endpoint reveals no delivery credentials',async()=>{const r=await request(api(),{method:'GET',path:'/api/health',headers:{origin:undefined}});assert.equal(r.status,200);assert.deepEqual(r.json,{ok:true});});
