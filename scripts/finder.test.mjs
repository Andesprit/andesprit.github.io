// Runs the real finder.js against the built finder pages with a tiny stub DOM and checks what a visitor sees.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root=new URL('../',import.meta.url);
const script=readFileSync(new URL('finder.js',root),'utf8');
function finder(page,lang){
 const html=readFileSync(new URL(page,root),'utf8');
 const items=[...html.matchAll(/<li class="finder-entry" (data-[^>]+)>/g)].map(([,attrs])=>({hidden:false,dataset:Object.fromEntries([...attrs.matchAll(/data-([a-z]+)="([^"]*)"/g)].map(m=>m.slice(1)))}));
 const on={},el=extra=>({hidden:true,textContent:'',value:'',addEventListener:(type,fn)=>{on[type]=fn},focus(){},...extra});
 const nodes={'finder-q':el(),'finder-list':el({children:items}),'finder-status':el(),'finder-empty':el(),'finder-all':el({addEventListener(){}})};
 const location=new URL('https://andesprit.com/'+page.replace('index.html',''));
 runInNewContext(script,{URL,location,history:{replaceState:(s,t,url)=>{location.href=String(url)}},addEventListener(){},
  document:{documentElement:{lang},getElementById:id=>nodes[id],querySelector:s=>s==='.lang-switch'?{pathname:'/',href:''}:el()}});
 return query=>{nodes['finder-q'].value=query;on.input();return {ids:items.filter(i=>!i.hidden).map(i=>i.dataset.project).sort(),status:nodes['finder-status'].textContent};};
}
const sets={
 source:['annolabel','audio-whisperer','flow-atelier','open-portfolio','quire-writer','simple-backtest'],
 downloads:['dictaria','jetbreak','quire-writer'],
};
const cases={
 en:{page:'tools/index.html',expect:[['source',sets.source],['source code',sets.source],['open source',sets.source],['view source',sets.source],['downloads',sets.downloads],['download',sets.downloads],['sources',sets.source],
  ['Linux downloads',['quire-writer']],['Windows downloads',sets.downloads],['Windows source',['annolabel','flow-atelier','quire-writer']],
  ['shared expenses',['fairsplit']],['record my screen',['web-editor']],['study questions',['study-buddy']],['workflow automation',['flow-atelier']]]},
 es:{page:'es/herramientas/index.html',expect:[['código',sets.source],['ver código',sets.source],['código fuente',sets.source],['código abierto',sets.source],['descargas',sets.downloads],['descarga',sets.downloads],['descargar',sets.downloads],['descargar para Windows',sets.downloads],
  ['descargas Linux',['quire-writer']],['descargas Windows',sets.downloads],['código Windows',['annolabel','flow-atelier','quire-writer']],
  ['gastos compartidos',['fairsplit']],['grabar pantalla',['web-editor']],['preguntas de estudio',['study-buddy']]]},
};
for(const [lang,{page,expect}] of Object.entries(cases)){
 const search=finder(page,lang);
 for(const [query,ids] of expect)test(`${lang} "${query}" shows exactly the expected tools`,()=>assert.deepEqual(search(query).ids,ids));
 test(`${lang} platform notes keep their counts`,()=>assert.deepEqual(['Windows','Linux','macOS','Chromium'].map(q=>search(q).ids.length),[5,3,4,1]));
}
test('the access tie-break does not hide a purpose match without access words',()=>assert.ok(finder(cases.es.page,'es')('descansar').ids.includes('smart-pomodoro')));
