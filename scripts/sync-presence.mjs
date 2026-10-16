import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishedProjects, labels, sourceLabel, action, escape } from './catalog.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),targets={};
for(let i=0;i<args.length;i+=2) targets[args[i]]=resolve(args[i+1]);
const projects=publishedProjects();
const write=(path,text)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,text);};
const webSourceLinks=p=>['website','documentation','demo'].includes(p.access)&&p.urls.source?` [${action(p,'en').label}](${action(p,'en').url}). [Public source](${p.urls.source}).${p.urls.package?' [PyPI package]('+p.urls.package+').':''}${p.source.licenseEvidence?' [License]('+p.source.licenseEvidence+').':''}`:'';
const thumbnail=p=>p.visual?`<a href="${escape(p.urls.canonical)}"><img src="${escape(new URL(p.visual.path,'https://andesprit.com/').href)}" width="200" alt="${escape(p.visual.en).replaceAll('|','&#124;')}"></a><br>`:'';
const row=(p,topics=false)=>`| ${thumbnail(p)}[${p.name}](${p.urls.canonical}) | ${p.en.description} ${sourceLabel(p,'en')}.${p.platforms.length?' '+p.platforms.map(x=>x.en).join('; ')+'.':''}${p.urls.downloads?' [Desktop downloads]('+p.urls.downloads+').':''}${p.attribution?' '+p.attribution.en:''}${p.en.limitation?' '+p.en.limitation:''}${webSourceLinks(p)} |${topics?' '+p.tags.map(x=>'`'+x+'`').join(', ')+' |':''}`;
const table=(items,topics=false)=>`| ${topics?'Name | Description | Topics':'Project | What it does'} |\n| ${topics?'--- | --- | ---':'--- | ---'} |\n${items.map(p=>row(p,topics)).join('\n')}\n`;
const sectionFor=p=>p.category==='game'?'games':'projects';
const games=projects.filter(p=>p.category==='game');
const apps=projects.filter(p=>p.studio&&p.category!=='game'&&p.source.visibility==='private');
const tools=projects.filter(p=>p.studio&&p.category!=='game'&&p.source.visibility==='public');
if(targets['--personal']){
 const path=resolve(targets['--personal'],'readme.md');
 let text=readFileSync(path,'utf8');
 text=text.replace(/(## End-To-End Products\n\n[^\n]*\n\n)[\s\S]*?(?=## Open-Source)/,(_,intro)=>intro+table(apps,true)+'\n## Games\n\nGames I build, with current project pages and downloads.\n\n'+table(games.filter(p=>p.personal),true)+'\n');
 text=text.replace(/## Open-Source Products[\s\S]*?(?=## Toy Projects)/,`## Open-Source Products and Public Tools\n\nOpen-source products carry a verified license. Other public repositories are labeled with their source availability.\n\n${table(tools,true)}\n`);
 text=text.replace(/(## Toy Projects\n\n[^\n]*\n\n)[\s\S]*?(?=## Publications and Lectures)/,(_,intro)=>intro+table(projects.filter(p=>!p.studio),true)+'\n');
 text=text.replace('https://github.com/LGuillermoAngaritaG/NOVEL_METHOD_FOR_VORTEX_ROPE_CHARACTERIZATION','https://ojs.unipamplona.edu.co/index.php/rcta/article/view/158');
 if(!text.includes('Building Deep Research Agents with Nvidia GPUs'))text+='| [Building Deep Research Agents with Nvidia GPUs](https://career.softserveinc.com/apply/ai-week/) | AI Week talk, 25 September 2025. | `AI Agents`, `Research Automation`, `Nvidia GPUs` |\n';
 write(path,text);
}
if(targets['--organization']){
 const path=resolve(targets['--organization'],'profile/README.md');
 let text=readFileSync(path,'utf8');
 text=text.replace(/Smart tools for (?:any job\. AI for any business\.|doing your job\. AI for improving any business\.)/,'Smart tools, AI systems and software from the Andes.');
 text=text.replace(/Andesprit is (?:an independent|a) software studio from the Andes\.[^\n]+/,'Andesprit is an independent software studio from the Andes. We build productivity tools, games and open-source software, and create custom chatbots, LLM agents, automations and webpages around defined business workflows.');
 text=text.replace(/(## Products\n\n)[\s\S]*?(?=## Open Source)/,(_,intro)=>intro+table(apps).replace('| Project |','| Product |')+'\n## Games\n\n'+table(games.filter(p=>p.studio)).replace('| Project |','| Game |')+'\n');
 text=text.replace(/## Open Source[\s\S]*?(?=## Services)/,`## Open Source and Public Code\n\n${table(tools)}\n`);
 text=text.replace(/(?:any chatbot, agent or automation your business needs, built on large language models: evaluated, monitored and production-ready|production-ready AI systems built around your tools, processes and data)\./,'document-aware chatbots, agents and workflow integrations, with scope, evaluations and operational handoff agreed for each project.');
 text=text.replace(/(?:webpages tailored to your business, from a single landing page for a local shop to a full platform for a large enterprise\. Fast, findable and built to convert|fast, findable websites and platforms designed and developed end to end)\./,'websites and connected applications tailored to your content, users and integrations, with scope and acceptance checks agreed before implementation.');
 write(path,text);
}
if(targets['--portfolio']){
 const portfolio=targets['--portfolio'],personal=projects.filter(p=>p.personal);
 const manifest=resolve(portfolio,'src/content/data/generated-stories.json');
 const previous=existsSync(manifest)?JSON.parse(readFileSync(manifest,'utf8')):[];
 const entries=personal.map(p=>`${sectionFor(p)}/${p.id}`);
 for(const entry of previous){
  const normalized=entry.includes('/')?entry:`projects/${entry}`;
  if(entries.includes(normalized)||! /^(?:projects|games)\/[a-z0-9-]+$/.test(normalized))continue;
  const path=resolve(portfolio,`src/content/${normalized}.md`);
  if(existsSync(path)&&readFileSync(path,'utf8').includes('Generated from Andesprit catalog'))rmSync(path);
 }
 write(manifest,JSON.stringify(entries,null,2)+'\n');
 write(resolve(portfolio,'src/content/data/canonical-projects.json'),JSON.stringify({schemaVersion:1,generatedFrom:'Andesprit/andesprit.github.io:data/projects.json',reviewed:'2026-10-11',projects:personal.map(p=>({...p,typeLabel:labels.en[p.category],statusLabel:labels.en[p.status],sourceLabel:sourceLabel(p,'en'),action:action(p,'en')}))},null,2)+'\n');
 for(const p of personal){
  const fields={publication:'published',title:p.name,date:p.reviewed,link:p.urls.canonical,tags:p.tags,category:p.category,source_visibility:p.source.visibility,license:p.source.license,status:p.status,description:p.en.description,skip:false,display_order:personal.indexOf(p)};
  if(p.visual){fields.image='projects/'+p.visual.path.split('/').pop();fields.image_alt=p.visual.en;if(p.visual.fit)fields.image_fit=p.visual.fit;mkdirSync(resolve(portfolio,'static/projects'),{recursive:true});copyFileSync(resolve(root,p.visual.path),resolve(portfolio,'static/projects',p.visual.path.split('/').pop()));}
  const a=action(p,'en');
  const links=[`[${a.label}](${a.url})`];
  if(p.urls.page&&p.urls.page!==a.url)links.push(`[Project website](${p.urls.page})`);
  if(p.urls.package&&p.urls.package!==a.url)links.push(`[PyPI package](${p.urls.package})`);
  if(p.urls.source&&p.urls.source!==a.url)links.push(`[Public source](${p.urls.source})`);
  if(p.urls.downloads&&p.urls.downloads!==a.url)links.push(`[Desktop downloads](${p.urls.downloads})`);
  const body=[p.en.description,links.join(' · '),`## Scope and ownership\n\n${p.caseStudy?.en?.built||p.en.description}\n\n${p.caseStudy?.en?.role||'Maintainer: '+p.maintainer+'.'}${p.attribution?' '+p.attribution.en+'\n\n[Upstream project]('+p.attribution.url+').':''}`,p.caseStudy?.en?.decision?`## An engineering decision\n\n${p.caseStudy.en.decision}`:'',`## Access and source\n\n${labels.en[p.category]}. ${sourceLabel(p,'en')}.${p.source.licenseEvidence?'\n\n[License]('+p.source.licenseEvidence+').\n\n':''}${p.platforms.length?' '+p.platforms.map(x=>x.en).join('; ')+'.':''}${labels.en[p.status]?' '+labels.en[p.status]+'.':''}`,p.caseStudy?.en?.limitation||p.en.limitation?`## Current scope\n\n${p.caseStudy?.en?.limitation||p.en.limitation}`:'',p.visual?`*${p.visual.en}*`:'',`Public evidence reviewed: ${p.reviewed}.\n\n[Canonical project](${p.urls.canonical}).`].filter(Boolean).join('\n\n');
  write(resolve(portfolio,`src/content/${sectionFor(p)}/${p.id}.md`),`---\n${Object.entries(fields).map(([k,v])=>k+': '+JSON.stringify(v)).join('\n')}\n---\n\n<!-- Generated from Andesprit catalog; use scripts/sync-presence.mjs. -->\n\n${body}\n`);
 }
}
if(targets['--portfolio']) {
 const portfolio=targets['--portfolio'],prettier=resolve(portfolio,'node_modules/.bin/prettier');
 if(existsSync(prettier))execFileSync(prettier,['--write','src/content/data/canonical-projects.json','src/content/data/generated-stories.json',...projects.filter(p=>p.personal).map(p=>'src/content/'+sectionFor(p)+'/'+p.id+'.md')],{cwd:portfolio,stdio:'ignore'});
}
console.log('Synchronized canonical project content into requested local portfolio and original-format profile tables.');
