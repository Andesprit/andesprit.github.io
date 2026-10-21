import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
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
function menu(items,lang){const home=lang==='es'?'/es/':'/';return items.map(p=>`<li><a href="${p.source.visibility==='public'?e(p.urls.canonical):home+'#'+anchor(p)}">${e(p.name)}${p.source.visibility==='public'?' <span aria-hidden="true">↗</span>':''}</a></li>`).join('');}
function gamesMenu(lang){const title=lang==='es'?'Juegos':'Games';return `<li class="nav-menu"><button class="nav-menu-toggle" type="button" aria-expanded="false" aria-controls="games-menu" aria-haspopup="true">${title}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div class="nav-dropdown nav-dropdown-products" id="games-menu"><p class="nav-dropdown-label">${title}</p><ul class="nav-dropdown-list">${menu(games,lang)}</ul></div></li>`;}
function gameSection(template,lang){
 const title=lang==='es'?'Juegos':'Games';
 return template.replace(/\s*<p class="catalog-finder">[\s\S]*?<\/p>/,'').replace('id="products"','id="games"').replaceAll('products-h','games-h')
  .replace(/(<p class="catalog-note">)[^<]+/,(_,start)=>start+`${games.length} ${lang==='es'?(games.length===1?'juego':'juegos'):(games.length===1?'game':'games')}`)
  .replace(/(<h2 class="section-title" id="games-h">)[^<]+/,(_,start)=>start+title)
  .replace(/(<p class="section-copy">)[^<]+/,(_,start)=>start+(lang==='es'?'Juegos creados por Andesprit. Cada página presenta las pruebas y descargas actuales.':'Games built by Andesprit. Each project page describes current playtesting and downloads.'))
  .replace('aria-label="Products"',`aria-label="${title}"`).replace('aria-label="Productos"',`aria-label="${title}"`)
  .replace(/(<div class="carousel-container">)[\s\S]*?(\n        <\/div>\n      <\/div>)/,(_,start,end)=>start+'\n'+games.map(p=>card(p,lang)).join('\n')+end)
  .replace(/(<span class="cord-index">01<\/span> \/ )\d+/,(_,start)=>start+String(games.length).padStart(2,'0'))
  .replaceAll('Previous product','Previous game').replaceAll('Next product','Next game')
  .replaceAll('Producto anterior','Juego anterior').replaceAll('Siguiente producto','Siguiente juego');
}
const finderPath={en:'/tools/',es:'/es/herramientas/'};
const finderMenuLink=lang=>`<a class="nav-dropdown-finder" href="${finderPath[lang]}"><strong>${lang==='es'?'Busca por tarea o nombre':'Search by task or name'}</strong><small>${lang==='es'?`Las ${projects.length} herramientas, descritas`:`All ${projects.length} tools, described`}</small></a>`;
const finderIntro=lang=>`<p class="catalog-finder"><a href="${finderPath[lang]}">${lang==='es'?`¿No sabes el nombre? Busca entre las ${projects.length} herramientas por tarea →`:`Not sure of the name? Search all ${projects.length} tools by task →`}</a></p>`;
const shell={};
const paths=['index.html','es/index.html','agents/index.html','web-development/index.html','es/agentes/index.html','es/desarrollo-web/index.html'];
for(const path of paths){
 const lang=path.startsWith('es/')?'es':'en';
 let html=readFileSync(resolve(root,path),'utf8');
 if(html.includes('id="games-menu"'))html=html.replace(/<li class="nav-menu">\s*<button[^>]*aria-controls="games-menu"[\s\S]*?<\/div>\s*<\/li>/,gamesMenu(lang));
 else html=html.replace(/(<li class="nav-menu">\s*<button[^>]*aria-controls="open-source-menu")/,gamesMenu(lang)+'\n      $1');
 for(const [id,items]of [['products-menu',apps],['open-source-menu',tools]])html=html.replace(new RegExp(`(id="${id}">)[\\s\\S]*?(</div>)`),(_,start,end)=>start+(id==='products-menu'?finderMenuLink(lang)+'<p class="nav-dropdown-label">'+(lang==='es'?'Productos':'Products'):'<p class="nav-dropdown-label">'+(lang==='es'?'Código público':'Public Code'))+'</p><ul class="nav-dropdown-list">'+menu(items,lang)+'</ul>'+end);
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
  html=html.replace(/(<section[^>]*id="products"[\s\S]*?<\/header>)(?:\s*<p class="catalog-finder">[\s\S]*?<\/p>)?/,(_,start)=>start+'\n      '+finderIntro(lang));
  html=html.replace('Any chatbot, agent or automation your business needs, built on large language models and engineered to the highest standards — evaluated, monitored and production-ready.','Document-aware chatbots, agents and workflow integrations, with scope, evaluations and operational handoff agreed for each project.');
  html=html.replace('Cualquier chatbot, agente o automatización que tu negocio necesite, construido sobre grandes modelos de lenguaje y con los más altos estándares de ingeniería — evaluado, monitoreado y listo para producción.','Chatbots documentales, agentes e integraciones de procesos, con alcance, evaluaciones y entrega operativa acordados para cada proyecto.');
  html=html.replace('Custom chatbots, LLM agents and process automations built on large language models to the highest standards: evaluated, monitored and production-ready.','Custom chatbots, agents and workflow integrations with project-specific scope and evaluations.');
  html=html.replace('Chatbots, agentes LLM y automatizaciones de procesos a la medida, construidos sobre grandes modelos de lenguaje con los más altos estándares: evaluados, monitoreados y listos para producción.','Chatbots, agentes e integraciones de procesos con alcance y evaluaciones acordados para cada proyecto.');
 }
 html=html.replace(/ We reply within one business day\./g,'').replace(/ Respondemos en un día hábil\./g,'').replace('Message sent. We will reply within one business day.','Message submitted.').replace('Mensaje enviado. Te responderemos en un día hábil.','Mensaje enviado.');
 if(path.includes('agents/')||path.includes('agentes/'))html=html.replace('These are starting points, not fixed packages.','These are conceptual illustrations and starting points, not client case studies or fixed packages.').replace('Son puntos de partida, no paquetes cerrados.','Son ilustraciones conceptuales y puntos de partida, no casos de clientes ni paquetes fijos.');
 if(path.includes('web-development/')||path.includes('desarrollo-web/'))html=html.replace('A good website is not a skin placed over the same template.','Five conceptual scopes. Illustrations show possible projects, not delivered client work.').replace('Un buen sitio no es una capa visual sobre la misma plantilla.','Cinco alcances conceptuales. Las ilustraciones muestran posibles proyectos, no trabajos entregados a clientes.');
 writeFileSync(resolve(root,path),html);
 if(path==='agents/index.html'||path==='es/agentes/index.html')shell[lang]=html;
}
// Task finder: one described entry per studio project, searchable by finder.js; complete without JavaScript.
const searchText=(p,lang)=>[p.name,...p.aliases,p[lang].description,p[lang].limitation,labels[lang][p.category],...(lang==='en'?p.tags:[])].join(' ').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().match(/[a-z0-9]+/g).join(' ');
function finderEntry(p,lang){
 const a=action(p,lang),oss=p.source.visibility==='public';
 const meta=[labels[lang][p.category],labels[lang][p.status],oss&&sourceLabel(p,lang)].filter(Boolean).join(' · ');
 const description=[p[lang].description,p.platforms.map(x=>x[lang]).join('; '),p[lang].limitation].filter(Boolean).join(' ');
 return `        <li class="finder-entry" data-project="${p.id}" data-search="${e(searchText(p,lang))}">\n          <p class="catalog-meta">${e(meta)}</p>\n          <h2>${e(p.name)}</h2>\n          <p>${e(description)}</p>\n          <p class="finder-action"><a href="${e(a.url)}" aria-label="${e(a.label+': '+p.name)}">${e(a.label)} <span aria-hidden="true">↗</span></a> <span class="finder-host">${e(new URL(a.url).hostname)}</span></p>\n        </li>`;
}
const finderCopy={
 en:{title:'Find a tool by task or name | Andesprit',description:`Search ${projects.length} Andesprit apps, games and public projects by the work you want to do, then open the app, downloads or source.`,eyebrow:'Studio tools',h1:'Find a tool',lead:`All ${projects.length} apps, games and public projects by Andesprit, each with what it does and where it opens. Search by the work you want to do, or browse the list.`,label:'Search by task or name',examples:'Examples: shared expenses, record my screen, study questions, workflow automation.',clear:'Clear',all:'Show all tools',services:'Explore custom services',contact:'Describe what you need',empty:'Search looks for these words in tool names and descriptions. Try fewer or different words, browse every tool, or ask us about custom work.',home:'/'},
 es:{title:'Encuentra una herramienta por tarea o nombre | Andesprit',description:`Busca entre ${projects.length} aplicaciones, juegos y proyectos públicos de Andesprit según la tarea, y abre la aplicación, las descargas o el código.`,eyebrow:'Herramientas del estudio',h1:'Encuentra una herramienta',lead:`Las ${projects.length} aplicaciones, juegos y proyectos públicos de Andesprit, con lo que hace cada uno y dónde se abre. Busca según la tarea o recorre la lista.`,label:'Busca por tarea o nombre',examples:'Ejemplos: gastos compartidos, grabar pantalla, preguntas de estudio, automatizar flujos.',clear:'Borrar',all:'Ver todas las herramientas',services:'Ver servicios a medida',contact:'Cuéntanos qué necesitas',empty:'La búsqueda revisa estas palabras en los nombres y descripciones. Prueba con menos palabras u otras, recorre todas las herramientas o pregúntanos por un desarrollo a medida.',home:'/es/'}};
function finderPage(lang){
 const c=finderCopy[lang],other=lang==='es'?'en':'es',url=`https://andesprit.com${finderPath[lang]}`;
 const nav=shell[lang].match(/<nav class="nav"[\s\S]*?<\/nav>/)[0]
  .replace(/(class="lang-switch" href=")[^"]*/,(_,start)=>start+finderPath[other])
  .replace(/(class="nav-cta" href=")[^"]*/,(_,start)=>start+c.home+'#contact')
  .replace(/(<a class="nav-dropdown-finder" href="[^"]*")/,'$1 aria-current="page"');
 const footer=shell[lang].match(/<footer>[\s\S]*?<\/footer>/)[0];
 return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${e(c.title)}</title>
<meta name="description" content="${e(c.description)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="https://andesprit.com${finderPath.en}">
<link rel="alternate" hreflang="es" href="https://andesprit.com${finderPath.es}">
<link rel="alternate" hreflang="x-default" href="https://andesprit.com${finderPath.en}">
<link rel="icon" type="image/svg+xml" href="/assets/andesprit-mark-light.svg">
<meta name="theme-color" content="#f1f3e9">
<script>
(function () {
  var theme = 'light';
  try {
    var saved = localStorage.getItem('theme');
    theme = saved === 'light' || saved === 'dark' ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (error) {}
  document.documentElement.dataset.theme = theme;
})();
</script>
<script src="/theme.js" defer></script>
<script src="/finder.js" defer></script>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Andesprit">
<meta property="og:title" content="${e(c.title)}">
<meta property="og:description" content="${e(c.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://andesprit.com/og.png">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<a class="skip-link" href="#main">${lang==='es'?'Saltar al contenido':'Skip to content'}</a>

${nav}

<main id="main" class="finder">
  <div class="wrap finder-inner">
    <p class="eyebrow">${e(c.eyebrow)}</p>
    <h1 class="section-title">${e(c.h1)}</h1>
    <p class="section-copy">${e(c.lead)}</p>
    <form class="finder-search" role="search" hidden>
      <label for="finder-q">${e(c.label)}</label>
      <div class="finder-row"><input id="finder-q" name="q" type="search" maxlength="120" autocomplete="off" spellcheck="false" aria-describedby="finder-examples"><button class="finder-button" type="reset">${e(c.clear)}</button></div>
      <p class="finder-examples" id="finder-examples">${e(c.examples)}</p>
    </form>
    <p class="finder-status" id="finder-status" role="status" aria-live="polite"></p>
    <div class="finder-empty" id="finder-empty" hidden>
      <p>${e(c.empty)}</p>
      <p class="finder-recover"><button class="finder-button" type="button" id="finder-all">${e(c.all)}</button><a href="${c.home}#services">${e(c.services)}</a><a href="${c.home}#contact">${e(c.contact)}</a></p>
    </div>
    <ol class="finder-list" id="finder-list">
${projects.map(p=>finderEntry(p,lang)).join('\n')}
    </ol>
  </div>
</main>

${footer}
</body>
</html>
`;
}
for(const lang of ['en','es']){const dir=resolve(root,finderPath[lang].slice(1));mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,'index.html'),finderPage(lang));}
const routes=['/','/es/','/agents/','/web-development/','/es/agentes/','/es/desarrollo-web/',finderPath.en,finderPath.es];
writeFileSync(resolve(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(path=>`<url><loc>https://andesprit.com${path}</loc></url>`).join('')}</urlset>\n`);
console.log(`Updated original six pages: ${apps.length} products, ${games.length} games and ${tools.length} public-source projects in each language; wrote both ${projects.length}-entry tool finders.`);
