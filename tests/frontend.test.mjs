// Exercises the exported scripts and event handlers without a browser.
// This checks behaviour and markup contracts, not layout or native DOM behaviour.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';
import { projects } from '../src/content.js';
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
const addedIds = ['wifi-scanner','pokemon-gan','network-chess','ultrasonic-scanner','ticket-to-ride','routine-manager','unix-shell','video-pulse','multicycle-processor','crane-game-simulator','mywidget','oop-arena','stm32-interfaces'];
const labIds = ['oop-arena','stm32-interfaces'];
const cardIds = markup => [...markup.matchAll(/data-project="([^"]+)"/g)].map(match => match[1]);

function boot(lang='fr') {
  const elements = new Map(), listeners = new Map(), preferences = new Map([['jy-lang',lang]]);
  const makeElement = (dataset={}) => ({
    innerHTML:'', textContent:'', content:'', hidden:true, dataset, attributes:{}, events:{},
    classList:{add(){},remove(){}},
    addEventListener(name,fn){this.events[name]=fn;},
    setAttribute(key,value){this.attributes[key]=value;},
    getAttribute(key){return this.attributes[key];},
    focus(){}, showModal(){this.open=true;}, close(){this.open=false;this.events.close?.();},
    closest(selector){return selector==='button, a'?this:null;}, matches(){return false;},
  });
  const element = selector => {
    if (selector==='#contact-form') return null;
    if (!elements.has(selector)) elements.set(selector,makeElement());
    return elements.get(selector);
  };
  const filters = ['all','signal','embedded','software','lab'].map(value=>makeElement({filter:value}));
  const document = {
    documentElement:{dataset:{},lang:''},body:makeElement(),
    querySelector:element,querySelectorAll:selector=>selector==='[data-filter]'?filters:[],
    addEventListener(name,fn){listeners.set(name,fn);},
  };
  assert.ok(script,'The export must contain its executable script');
  const context = createContext({document,window:{scrollTo(){}},scrollY:0,
    localStorage:{getItem:key=>preferences.get(key),setItem:(key,value)=>preferences.set(key,value)},
    matchMedia:()=>({addEventListener(){}}),setTimeout,clearTimeout,Date,console});
  runInContext(script,context,{timeout:1000});
  return {context,document,elements,filters,preferences,
    markup:()=>element('#app').innerHTML,
    async click(dataset){const target=makeElement(dataset);await listeners.get('click')({target});return target;},
    evaluate:code=>runInContext(code,context,{timeout:1000}),
  };
}

for (const lang of ['fr','en']) {
  test(`Export renders all 18 selected works in ${lang.toUpperCase()} with valid anchors and labels`,()=>{
    const page=boot(lang), output=page.markup();
    assert.equal(page.document.documentElement.lang,lang);
    assert.equal(cardIds(output).length,18);
    for(const id of addedIds) assert.ok(cardIds(output).includes(id),`${id} is included`);
    assert.ok(output.includes(lang==='fr'?'Du signal':'From signals'));
    assert.ok(output.includes(`./public/cv.html?lang=${lang}`));
    const ids=[...output.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
    assert.equal(new Set(ids).size,ids.length,'IDs, including SVG resources, must be unique');
    for(const [,anchor]of output.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(anchor),`Anchor ${anchor} exists`);
    for(const [,target]of output.matchAll(/\bfor="([^"]+)"/g))assert.ok(ids.includes(target),`Form field ${target} exists`);
    assert.ok(output.includes(lang==='fr'?'16 projets · 2 TP':'16 projects · 2 labs'));
    for(const id of ['crane-game-simulator','mywidget']) {
      const card=output.match(new RegExp(`<article[^>]+aria-labelledby="project-title-${id}"[\\s\\S]*?<\\/article>`))?.[0];
      assert.ok(card,`${id} has a project card`);
      assert.ok(card.includes(lang==='fr'?'En cours de développement':'Work in progress'));
      assert.ok(card.includes(lang==='fr'?'Projet personnel':'Personal project'));
    }
    assert.match(output,/<div id="more-projects"[^>]+hidden>/);
  });
  test(`All detail dialogs open with translated text and matching illustrations (${lang})`,async()=>{
    const page=boot(lang);
    for(const project of projects){
      await page.click({project:project.id});
      const details=page.elements.get('.dialog-content').innerHTML;
      assert.ok(details.includes(project[lang].title.replaceAll('&','&amp;').replaceAll("'",'&#39;')),project.id);
      assert.match(details,/id="dialog-title"/);
      assert.ok(!details.includes('undefined'));
      assert.equal(page.elements.get('#project-dialog').open,true);
      if(project.kind==='lab')assert.ok(details.includes(lang==='fr'?'Travaux pratiques':'Practical lab'));
      if(['crane-game-simulator','mywidget'].includes(project.id))assert.ok(details.includes(lang==='fr'?'En cours de développement':'Work in progress'));
      if(project[lang].note)assert.ok(details.includes(lang==='fr'?'À propos de cette réalisation':'About this work'));
      await page.click({action:'close-dialog'});
      assert.equal(page.elements.get('#project-dialog').open,false);
    }
  });
}

test('The two selected practical labs are separated from the 16 projects',()=>{
  const page=boot();
  const markup=page.markup();
  const [main,labs]=markup.split('<section class="catalog-labs"');
  for(const id of labIds){assert.ok(!cardIds(main).includes(id));assert.ok(cardIds(labs).includes(id));}
  assert.deepEqual([...page.evaluate("selectedProjects('lab').map(p=>p.id)")],labIds);
});
test('Lab filter displays only the two labs and updates pressed state and count',async()=>{
  const page=boot();await page.click({filter:'lab'});
  const output=page.elements.get('#project-catalog').innerHTML;
  assert.deepEqual(cardIds(output),labIds);
  assert.ok(!output.includes('class="catalog-main"'));
  assert.equal(page.elements.get('.project-counter').textContent,'2 TP');
  for(const button of page.filters)assert.equal(button.attributes['aria-pressed'],String(button.dataset.filter==='lab'));
});
test('Domain filters keep lab identification and include the expected projects',async()=>{
  const page=boot();
  await page.click({filter:'software'});
  assert.deepEqual(cardIds(page.elements.get('#project-catalog').innerHTML),['network-chess','raytracing','ticket-to-ride','routine-manager','unix-shell','crane-game-simulator','mywidget','oop-arena']);
  assert.equal(page.elements.get('.project-counter').textContent,'7 projets · 1 TP');
  await page.click({filter:'signal'});
  assert.deepEqual(cardIds(page.elements.get('#project-catalog').innerHTML),['radar','pokemon-gan','video-pulse']);
  assert.equal(page.elements.get('.project-counter').textContent,'3 projets');
  await page.click({filter:'embedded'});
  assert.deepEqual(cardIds(page.elements.get('#project-catalog').innerHTML),['greenhouse','wifi-scanner','ultrasonic-scanner','processor','multicycle-processor','rfid','stm32-interfaces']);
});
test('Expand and collapse show all projects without losing the practical-lab section',async()=>{
  const page=boot();
  const expand=await page.click({action:'toggle-projects'});
  assert.equal(page.elements.get('#more-projects').hidden,false);
  assert.equal(expand.attributes['aria-expanded'],'true');
  assert.equal(page.elements.get('.project-progress').textContent,'16 projets affichés sur 16');
  const collapse=await page.click({action:'toggle-projects'});
  assert.equal(page.elements.get('#more-projects').hidden,true);
  assert.equal(collapse.attributes['aria-expanded'],'false');
  assert.equal(page.elements.get('.project-progress').textContent,'5 projets affichés sur 16');
  await page.click({filter:'signal'});await page.click({filter:'all'});
  assert.match(page.elements.get('#project-catalog').innerHTML,/<div id="more-projects"[^>]+hidden>/);
});
test('Changing language preserves the active filter and translates lab headings',async()=>{
  const page=boot();await page.click({filter:'lab'});await page.click({action:'language'});
  assert.equal(page.document.documentElement.lang,'en');
  assert.deepEqual(cardIds(page.markup()),labIds);
  assert.ok(page.markup().includes('Practical labs'));
  assert.ok(page.markup().includes('2 labs'));
  assert.equal(page.preferences.get('jy-lang'),'en');
});
test('Only verified project links are displayed, and GAN credits refer to NVIDIA',async()=>{
  const page=boot();await page.click({project:'wifi-scanner'});
  assert.ok(page.elements.get('.dialog-content').innerHTML.includes('href="https://github.com/SayZx15/WiFiScanner"'));
  await page.click({project:'pokemon-gan'});
  const gan=page.elements.get('.dialog-content').innerHTML;
  assert.ok(gan.includes('https://github.com/NVlabs/stylegan2-ada-pytorch'));
  assert.ok(!gan.includes('Voir le code sur GitHub'));
  await page.click({project:'network-chess'});
  assert.ok(!page.elements.get('.dialog-content').innerHTML.includes('href="https://github.com/'));
});
test('The printable CV retains its concise four-project selection per language',async()=>{
  const cv=await readFile(new URL('../dist/public/cv.html',import.meta.url),'utf8');
  assert.equal((cv.match(/class="project"/g)||[]).length,8);
  assert.deepEqual(projects.filter(p=>p.includeInCv).map(p=>p.id),['greenhouse','raytracing','processor','rfid']);
  assert.ok(!cv.includes('Arène de combat'));
  assert.ok(!cv.includes('StyleGAN2-ADA'));
});
