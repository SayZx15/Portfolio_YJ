import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { generateCv } from './generate-cv.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const output = resolve(root, 'dist');
await generateCv();
await rm(output, {recursive:true, force:true});
await mkdir(output, {recursive:true});
await cp(resolve(root,'public'), resolve(output,'public'), {recursive:true});
// This project uses four plain modules, no imports from packages. Inline them
// in the static export so index.html also works by double-clicking the file.
const modules = await Promise.all(['config.js','content.js','visuals.js','app.js'].map(file=>readFile(resolve(root,'src',file),'utf8')));
const script = modules.map(code=>code.replace(/^import .+;\r?\n/gm,'').replace(/^export /gm,'')).join('\n');
const css = await readFile(resolve(root,'src/styles.css'),'utf8');
const template = await readFile(resolve(root,'index.html'),'utf8');
const html = template.replace('<link rel="stylesheet" href="./src/styles.css" />',()=>`<style>${css}</style>`).replace('<script type="module" src="./src/app.js"></script>',()=>`<script type="module">${script.replace(/<\/script/gi,'<\\/script')}</script>`);
await writeFile(resolve(output,'index.html'),html);
await writeFile(resolve(output,'.nojekyll'),'');
console.log('Static portfolio built in dist/ (standalone HTML, no backend or secrets).');
