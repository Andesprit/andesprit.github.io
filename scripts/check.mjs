import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {catalog,validateCatalog,publishedProjects,action,escape} from './catalog.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
validateCatalog(catalog);
const finders={'tools/index.html':'en','es/herramientas/index.html':'es'};
const pages=['index.html','es/index.html','agents/index.html','web-development/index.html','es/agentes/index.html','es/desarrollo-web/index.html',...Object.keys(finders)];
const failures=[];
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
console.log(`Canonical catalog valid; six original pages and both tool finders checked for links, anchors, menu completeness, finder inventory/actions and EN/ES parity.`);
