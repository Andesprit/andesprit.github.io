import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {catalog,validateCatalog,publishedProjects,action,escape} from './catalog.mjs';
import {guidePath,tasks} from './task-guide.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
validateCatalog(catalog);
const finders={'tools/index.html':'en','es/herramientas/index.html':'es'};
const guides={'task-guide/index.html':'en','es/guia-de-tareas/index.html':'es'};
const pages=['index.html','es/index.html','agents/index.html','web-development/index.html','es/agentes/index.html','es/desarrollo-web/index.html',...Object.keys(finders),...Object.keys(guides)];
const failures=[];
const webpWidth=file=>{const b=readFileSync(file);if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return NaN;const chunk=b.toString('ascii',12,16);return chunk==='VP8 '?b.readUInt16LE(26)&0x3fff:chunk==='VP8X'?1+b.readUIntLE(24,3):NaN};
for(const name of pages){
 const page=resolve(root,name),html=readFileSync(page,'utf8');
 if((html.match(/<h1[ >]/g)||[]).length!==1)failures.push(`Expected one H1: ${name}`);
 if(/WhisperPal|#smartpomodoro|#dayconductor|#smartnutrition|one business day|un día hábil|highest standards|open source, by default/i.test(html))failures.push(`Stale navigation or claims: ${name}`);
 for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const value=match[1];if(!value.startsWith('/')&&!value.startsWith('#'))continue;
  const [urlPath,hash]=value.split('#');
  const path=urlPath.split('?')[0];
  const target=path?resolve(root,'.'+path+(path.endsWith('/')?'index.html':'')):page;
  if(!existsSync(target)){failures.push(`Missing ${value} from ${name}`);continue;}
  if(hash&&!readFileSync(target,'utf8').includes(`id="${hash}"`))failures.push(`Missing anchor ${value} from ${name}`);
 }
 for(const match of html.matchAll(/srcset="([^"]+)"/g))for(const candidate of match[1].split(',')){
  const [url,descriptor]=candidate.trim().split(/\s+/),file=resolve(root,'.'+url);
  if(!existsSync(file)){failures.push(`Missing ${url} from ${name}`);continue;}
  if(descriptor?.endsWith('w')&&webpWidth(file)!==Number(descriptor.slice(0,-1)))failures.push(`Wrong width descriptor ${url} ${descriptor} in ${name}`);
 }
 for(const menu of ['products-menu','games-menu','open-source-menu']){
  const menuHTML=html.match(new RegExp(`id="${menu}"[\\s\\S]*?</div>`))?.[0]||'';
  const count=(menuHTML.match(/<li>/g)||[]).length;
  const expectedMenu=publishedProjects().filter(p=>p.studio&&(menu==='games-menu'?p.category==='game':p.category!=='game'&&p.source.visibility===(menu==='products-menu'?'private':'public')));
  if(count!==expectedMenu.length)failures.push(`Incomplete canonical ${menu}: ${name}`);
 }
}
for(const name of pages){
 const lang=name.startsWith('es/')?'es':'en',html=readFileSync(resolve(root,name),'utf8');
 if(!html.match(/id="products-menu">[\s\S]*?<\/div>/)?.[0].includes(`class="nav-dropdown-finder" href="${lang==='es'?'/es/herramientas/':'/tools/'}"`))failures.push(`Missing finder link in Products menu: ${name}`);
}
for(const path of ['index.html','es/index.html'])if(!readFileSync(resolve(root,path),'utf8').match(/<section[^>]*id="products"[\s\S]*?<\/section>/)?.[0].includes('class="catalog-finder"'))failures.push('Missing finder link in products section: '+path);
for(const [path,lang] of Object.entries(finders)){
 const html=readFileSync(resolve(root,path),'utf8'),other=lang==='es'?'/tools/':'/es/herramientas/';
 if(!html.includes(`<html lang="${lang}">`)||!html.includes(`class="lang-switch" href="${other}"`))failures.push('Wrong finder language or switch: '+path);
 if(/location\.replace/.test(html))failures.push('Finder must not redirect: '+path);
 const entries=[...html.matchAll(/<li class="finder-entry" data-project="([^"]+)" data-search="[^"]+">([\s\S]*?)<\/li>/g)];
 const studio=publishedProjects().filter(p=>p.studio);
 if(JSON.stringify(entries.map(x=>x[1]).sort())!==JSON.stringify(studio.map(p=>p.id).sort()))failures.push('Incorrect finder inventory: '+path);
 for(const [,id,body] of entries){
  const p=studio.find(p=>p.id===id),a=action(p,lang);
  if(!body.includes(`<a href="${escape(a.url)}" aria-label="${escape(a.label+': '+p.name)}">${escape(a.label)} `))failures.push(`Wrong finder action for ${id}: ${path}`);
  for(const text of [p[lang].description,p[lang].limitation].filter(Boolean))if(!body.includes(escape(text)))failures.push(`Missing localized finder copy for ${id}: ${path}`);
 }
}
for(const name of pages){
 const lang=name.startsWith('es/')?'es':'en',html=readFileSync(resolve(root,name),'utf8');
 if(!html.match(/id="services-menu">[\s\S]*?<\/div>/)?.[0].includes(`class="nav-dropdown-finder" href="${guidePath[lang]}"`))failures.push(`Missing task guide link in Services menu: ${name}`);
}
for(const path of ['index.html','es/index.html'])if(!readFileSync(resolve(root,path),'utf8').match(/<section[^>]*id="services"[\s\S]*?<\/section>/)?.[0].includes(`class="catalog-finder services-guide"><a href="${guidePath[path.startsWith('es/')?'es':'en']}"`))failures.push('Missing task guide link in services section: '+path);
for(const [path,lang] of Object.entries(finders))if(!readFileSync(resolve(root,path),'utf8').includes(`<p class="finder-guide"><a href="${guidePath[lang]}">`))failures.push('Missing task guide bridge: '+path);
// Task guide: every option must resolve to a studio project action or a whitelisted, anchored service case.
const interests=lang=>Object.keys(JSON.parse(readFileSync(resolve(root,lang==='es'?'es/index.html':'index.html'),'utf8').match(/interests: (\{[\s\S]*?\})/)[1]));
for(const [path,lang] of Object.entries(guides)){
 const html=readFileSync(resolve(root,path),'utf8'),other=lang==='es'?'en':'es';
 if(!html.includes(`<html lang="${lang}">`)||!html.includes(`class="lang-switch" href="${guidePath[other]}"`))failures.push('Wrong guide language or switch: '+path);
 if(/location\.replace/.test(html))failures.push('Guide must not redirect: '+path);
 const studio=publishedProjects().filter(p=>p.studio),whitelist=interests(lang);
 for(const task of tasks){
  const block=html.match(new RegExp(`<section class="guide-task" id="${task.id}"[\\s\\S]*?</section>`))?.[0]||'';
  if(!block)failures.push(`Missing guide task ${task.id}: ${path}`);
  if((block.match(/<li class="guide-option"/g)||[]).length!==task.options.length)failures.push(`Wrong option count for ${task.id}: ${path}`);
  for(const option of task.options){
   if(option.project){
    const p=studio.find(p=>p.id===option.project);
    if(!p){failures.push(`Unknown guide project ${option.project}`);continue;}
    const a=action(p,lang);
    if(!block.includes(`<a href="${escape(a.url)}" aria-label="${escape(a.label+': '+p.name)}">`))failures.push(`Wrong guide action for ${p.id}: ${path}`);
    for(const text of [p[lang].description,p[lang].limitation].filter(Boolean))if(!block.includes(escape(text)))failures.push(`Missing guide copy for ${p.id}: ${path}`);
    continue;
   }
   const service=option.service,page=(lang==='es'?'es/':'')+(service.startsWith('agents')?(lang==='es'?'agentes':'agents'):(lang==='es'?'desarrollo-web':'web-development'))+'/index.html';
   if(!whitelist.includes(service))failures.push(`Guide interest ${service} is not in the contact whitelist: ${path}`);
   const card=readFileSync(resolve(root,page),'utf8').match(new RegExp(`<li class="use-case reveal" id="case-${service}">[\\s\\S]*?</li>\\s*(?=<li class="use-case|</ol>)`))?.[0]||'';
   const [,title,description]=card.match(/<h3>([^<]+)<\/h3><p>([^<]+)<\/p>/)||[];
   if(!card.includes(`interest=${service}#contact`)||!block.includes(`<h3>${title}</h3>`)||!block.includes(`<p>${description}</p>`))failures.push(`Guide case ${service} does not match ${page}: ${path}`);
   if(!block.includes(`href="/${page.replace('index.html','')}#case-${service}"`)||!block.includes(`href="${lang==='es'?'/es/':'/'}?interest=${service}#contact"`))failures.push(`Wrong guide links for ${service}: ${path}`);
  }
 }
}
const ids=path=>[...readFileSync(resolve(root,path),'utf8').matchAll(/data-project="([^"]+)"/g)].map(x=>x[1]).sort();
const expected=publishedProjects().filter(p=>p.studio).map(p=>p.id).sort();
for(const path of ['index.html','es/index.html'])if(JSON.stringify(ids(path))!==JSON.stringify(expected))failures.push('Incorrect project inventory: '+path);
for(const path of ['index.html','es/index.html']){
 const html=readFileSync(resolve(root,path),'utf8');
 for(const [section,predicate] of [['products',p=>p.category!=='game'&&p.source.visibility==='private'],['games',p=>p.category==='game'],['open-source',p=>p.category!=='game'&&p.source.visibility==='public']]){
  const block=html.match(new RegExp(`<section[^>]*id="${section}"[\\s\\S]*?</section>`))?.[0]||'';
  const actual=[...block.matchAll(/data-project="([^"]+)"/g)].map(x=>x[1]).sort();
  const wanted=publishedProjects().filter(p=>p.studio&&predicate(p)).map(p=>p.id).sort();
  if(JSON.stringify(actual)!==JSON.stringify(wanted))failures.push(`Wrong ${section} grouping: ${path}`);
 }
}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`Canonical catalog valid; six original pages, both tool finders and both task guides checked for links, anchors, menu completeness, finder inventory/actions and EN/ES parity.`);
