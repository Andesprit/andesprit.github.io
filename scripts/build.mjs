import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {publishedProjects,escape as e,labels,sourceLabel,action} from './catalog.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const projects=publishedProjects().filter(p=>p.studio);
const originalOrder=['dictaria','smart-nutrition','study-buddy','book-advisor','fairsplit','day-conductor','smart-pomodoro','chord-changes','web-editor'];
const games=projects.filter(p=>p.category==='game');
const apps=projects.filter(p=>p.category!=='game'&&p.source.visibility==='private').sort((a,b)=>originalOrder.indexOf(a.id)-originalOrder.indexOf(b.id));
const tools=projects.filter(p=>p.category!=='game'&&p.source.visibility==='public');
const anchor=p=>p.id==='fairsplit'?'fair-split':p.id;
function card(p,lang){
 const oss=p.source.visibility==='public',a=action(p,lang),visual=p.visual;
 if(!visual)throw new Error('Missing reviewed project illustration: '+p.id);
 const {width,height}=visual, imagePath=visual.path, alt=visual[lang];
 const meta=oss?sourceLabel(p,lang):[labels[lang][p.category],labels[lang][p.status]].filter(Boolean).join(' · ');
 const description=[p[lang].description,p.platforms.map(x=>x[lang]).join('; '),p[lang].limitation].filter(Boolean).join(' ');
 return `        <a class="catalog-entry${oss?' oss-entry':''} reveal" id="${anchor(p)}" data-project="${p.id}" href="${e(a.url)}" aria-label="${e(a.label+' '+p.name)}">\n          <figure class="catalog-shot"><img src="/${e(imagePath)}" width="${width}" height="${height}"${visual?.fit==='contain'?' style="object-fit:contain;transform:none"':''} alt="${e(alt)}" loading="lazy"></figure>\n          <div class="catalog-copy">\n            <p class="catalog-meta">${e(meta)}</p>\n            <h3>${e(p.name)}</h3>\n            <p>${e(description)}</p>\n          </div>\n        </a>`;
}
function menu(items,lang){const home=lang==='es'?'/es/':'/';return items.map(p=>`<li><a href="${p.source.visibility==='public'?e(p.urls.source):home+'#'+anchor(p)}">${e(p.name)}${p.source.visibility==='public'?' <span aria-hidden="true">↗</span>':''}</a></li>`).join('');}
function gamesMenu(lang){const title=lang==='es'?'Juegos':'Games';return `<li class="nav-menu"><button class="nav-menu-toggle" type="button" aria-expanded="false" aria-controls="games-menu" aria-haspopup="true">${title}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div class="nav-dropdown nav-dropdown-products" id="games-menu"><p class="nav-dropdown-label">${title}</p><ul class="nav-dropdown-list">${menu(games,lang)}</ul></div></li>`;}
function gameSection(template,lang){
 const title=lang==='es'?'Juegos':'Games';
 return template.replace('id="products"','id="games"').replaceAll('products-h','games-h')
  .replace(/(<p class="catalog-note">)[^<]+/,(_,start)=>start+`${games.length} ${lang==='es'?(games.length===1?'juego':'juegos'):(games.length===1?'game':'games')}`)
  .replace(/(<h2 class="section-title" id="games-h">)[^<]+/,(_,start)=>start+title)
  .replace(/(<p class="section-copy">)[^<]+/,(_,start)=>start+(lang==='es'?'Juegos creados por Andesprit. Cada página presenta las pruebas y descargas actuales.':'Games built by Andesprit. Each project page describes current playtesting and downloads.'))
  .replace('aria-label="Products"',`aria-label="${title}"`).replace('aria-label="Productos"',`aria-label="${title}"`)
  .replace(/(<div class="carousel-container">)[\s\S]*?(\n        <\/div>\n      <\/div>)/,(_,start,end)=>start+'\n'+games.map(p=>card(p,lang)).join('\n')+end)
  .replace(/(<span class="cord-index">01<\/span> \/ )\d+/,(_,start)=>start+String(games.length).padStart(2,'0'))
  .replaceAll('Previous product','Previous game').replaceAll('Next product','Next game')
  .replaceAll('Producto anterior','Juego anterior').replaceAll('Siguiente producto','Siguiente juego');
}
const paths=['index.html','es/index.html','agents/index.html','web-development/index.html','es/agentes/index.html','es/desarrollo-web/index.html'];
for(const path of paths){
 const lang=path.startsWith('es/')?'es':'en';
 let html=readFileSync(resolve(root,path),'utf8');
 if(html.includes('id="games-menu"'))html=html.replace(/<li class="nav-menu">\s*<button[^>]*aria-controls="games-menu"[\s\S]*?<\/div>\s*<\/li>/,gamesMenu(lang));
 else html=html.replace(/(<li class="nav-menu">\s*<button[^>]*aria-controls="open-source-menu")/,gamesMenu(lang)+'\n      $1');
 for(const [id,items]of [['products-menu',apps],['open-source-menu',tools]])html=html.replace(new RegExp(`(id="${id}"><p class="nav-dropdown-label">)[\\s\\S]*?(</div>)`),(_,start,end)=>start+(id==='products-menu'?(lang==='es'?'Productos':'Products'):(lang==='es'?'Código público':'Public Code'))+'</p><ul class="nav-dropdown-list">'+menu(items,lang)+'</ul>'+end);
 html=html.replace(/(aria-controls="open-source-menu" aria-haspopup="true">)[^<]+/g,(_,start)=>start+(lang==='es'?'Código público':'Public Code'));
 if(path==='index.html'||path==='es/index.html'){
  html=html.replace(/\s*<section[^>]*id="games"[\s\S]*?<\/section>/,'');
  const productTemplate=html.match(/<section[^>]*id="products"[\s\S]*?<\/section>/)?.[0];
  if(!productTemplate)throw new Error('Missing original product section: '+path);
  for(const [id,items]of [['products',apps],['open-source',tools]]){
   const expression=new RegExp(`(<section[^>]*id="${id}"[\\s\\S]*?<div class="carousel-container">)[\\s\\S]*?(\\n        </div>\\n      </div>)`);
   html=html.replace(expression,(_,start,end)=>start+'\n'+items.map(p=>card(p,lang)).join('\n')+end);
  }
  html=html.replace(/<p class="catalog-note">(?:Eight focused products|Ocho productos enfocados|\d+ (?:focused products|productos enfocados))<\/p>/,`<p class="catalog-note">${apps.length} ${lang==='es'?'productos enfocados':'focused products'}</p>`);
  html=html.replace(/<p class="catalog-note">(?:Four projects, built in public|Cuatro proyectos construidos en público|\d+ (?:projects, built in public|proyectos construidos en público))<\/p>/,`<p class="catalog-note">${tools.length} ${lang==='es'?'proyectos construidos en público':'projects, built in public'}</p>`);
  html=html.replace(/(<h2 class="section-title" id="products-h">)[^<]+/,(_,start)=>start+(lang==='es'?'Software útil para el trabajo diario.':'Useful software for everyday work.'));
  html=html.replace(/(<h2 class="section-title" id="oss-h">)[^<]+/,(_,start)=>start+(lang==='es'?'Código abierto y herramientas públicas.':'Open source and public tools.'));
  html=html.replace(/<p class="section-copy">(?:Free tools[^<]*|Herramientas libres[^<]*|Public tools[^<]*|Herramientas públicas[^<]*)<\/p>/,`<p class="section-copy">${lang==='es'?'Herramientas públicas para explorar e inspeccionar. Cada proyecto indica su licencia.':'Public tools to explore and inspect. Each project lists its license.'}</p>`);
  let carousel=0;html=html.replace(/(<span class="cord-index">01<\/span> \/ )\d+/g,(_,start)=>start+String((carousel++===0?apps:tools).length).padStart(2,'0'));
  html=html.replace(/(<section[^>]*id="open-source")/,gameSection(productTemplate,lang)+'\n\n  $1');
  html=html.replace('Any chatbot, agent or automation your business needs, built on large language models and engineered to the highest standards — evaluated, monitored and production-ready.','Document-aware chatbots, agents and workflow integrations, with scope, evaluations and operational handoff agreed for each project.');
  html=html.replace('Cualquier chatbot, agente o automatización que tu negocio necesite, construido sobre grandes modelos de lenguaje y con los más altos estándares de ingeniería — evaluado, monitoreado y listo para producción.','Chatbots documentales, agentes e integraciones de procesos, con alcance, evaluaciones y entrega operativa acordados para cada proyecto.');
  html=html.replace('Custom chatbots, LLM agents and process automations built on large language models to the highest standards: evaluated, monitored and production-ready.','Custom chatbots, agents and workflow integrations with project-specific scope and evaluations.');
  html=html.replace('Chatbots, agentes LLM y automatizaciones de procesos a la medida, construidos sobre grandes modelos de lenguaje con los más altos estándares: evaluados, monitoreados y listos para producción.','Chatbots, agentes e integraciones de procesos con alcance y evaluaciones acordados para cada proyecto.');
 }
 html=html.replace(/ We reply within one business day\./g,'').replace(/ Respondemos en un día hábil\./g,'').replace('Message sent. We will reply within one business day.','Message submitted.').replace('Mensaje enviado. Te responderemos en un día hábil.','Mensaje enviado.');
 if(path.includes('agents/')||path.includes('agentes/'))html=html.replace('These are starting points, not fixed packages.','These are conceptual illustrations and starting points, not client case studies or fixed packages.').replace('Son puntos de partida, no paquetes cerrados.','Son ilustraciones conceptuales y puntos de partida, no casos de clientes ni paquetes fijos.');
 if(path.includes('web-development/')||path.includes('desarrollo-web/'))html=html.replace('A good website is not a skin placed over the same template.','Five conceptual scopes. Illustrations show possible projects, not delivered client work.').replace('Un buen sitio no es una capa visual sobre la misma plantilla.','Cinco alcances conceptuales. Las ilustraciones muestran posibles proyectos, no trabajos entregados a clientes.');
 writeFileSync(resolve(root,path),html);
}
const routes=['/','/es/','/agents/','/web-development/','/es/agentes/','/es/desarrollo-web/'];
writeFileSync(resolve(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(path=>`<url><loc>https://andesprit.com${path}</loc></url>`).join('')}</urlset>\n`);
console.log(`Updated original six pages: ${apps.length} products, ${games.length} games and ${tools.length} public-source projects in each language.`);
