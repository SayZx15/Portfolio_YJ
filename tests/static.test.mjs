import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { staticHandler } from '../server/static.mjs';
async function request(handler,url,method='GET') {
  const res={headers:{},status:200,body:'',writeHead(status,headers){this.status=status;this.headers=headers;},end(body=''){this.body=body;}};
  await handler({url,method},res);return res;
}
test('Static server serves public assets but excludes secrets, backend and traversal',async t=>{
  const root=await mkdtemp(join(tmpdir(),'portfolio-static-'));t.after(()=>rm(root,{recursive:true,force:true}));
  await mkdir(join(root,'public'));await mkdir(join(root,'server'));await writeFile(join(root,'index.html'),'portfolio');await writeFile(join(root,'public','cv.html'),'CV');await writeFile(join(root,'.env'),'secret');await writeFile(join(root,'server','secret.js'),'secret');
  const handler=staticHandler(root);
  assert.equal((await request(handler,'/')).body.toString(),'portfolio');
  assert.equal((await request(handler,'/public/cv.html?lang=en')).body.toString(),'CV');
  for(const url of ['/.env','/server/secret.js','/public/../.env','/public/%2e%2e/.env','/public/%00cv.html','/package.json'])assert.equal((await request(handler,url)).status,404,url);
  assert.equal((await request(handler,'/%ZZ')).status,400);
  assert.equal((await request(handler,'/','POST')).status,405);
  const head=await request(handler,'/','HEAD');assert.equal(head.status,200);assert.equal(head.body,'');assert.equal(head.headers['Content-Length'],9);
  await symlink(join(root,'server','secret.js'),join(root,'public','unsafe.js'));
  assert.equal((await request(handler,'/public/unsafe.js')).status,404);
});
