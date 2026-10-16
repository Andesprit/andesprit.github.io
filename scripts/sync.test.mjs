import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cpSync,existsSync,mkdtempSync,mkdirSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(new URL('../',import.meta.url).pathname);
test('unpublishing removes generated cards and portfolio routes while preserving owner-authored work',()=>{
 const temp=mkdtempSync(resolve(tmpdir(),'presence-publication-'));
 try{
  const site=resolve(temp,'site'),portfolio=resolve(temp,'portfolio');mkdirSync(site);
  for(const dir of ['scripts','data','agents','web-development','es'])cpSync(resolve(root,dir),resolve(site,dir),{recursive:true});
  cpSync(resolve(root,'index.html'),resolve(site,'index.html'));symlinkSync(resolve(root,'assets'),resolve(site,'assets'));
  const run=(name,args=[])=>execFileSync(process.execPath,[resolve(site,'scripts',name),...args],{cwd:site});
  run('build.mjs');run('sync-presence.mjs',['--portfolio',portfolio]);
  assert.ok(readFileSync(resolve(site,'index.html'),'utf8').includes('data-project="flow-atelier"'));
  assert.ok(existsSync(resolve(portfolio,'src/content/projects/flow-atelier.md')));
  const authored=resolve(portfolio,'src/content/projects/authored.md');writeFileSync(authored,'Owner-authored draft');
  const filename=resolve(site,'data/projects.json'),data=JSON.parse(readFileSync(filename));data.projects.find(p=>p.id==='flow-atelier').publication='draft';writeFileSync(filename,JSON.stringify(data));
  run('build.mjs');run('sync-presence.mjs',['--portfolio',portfolio]);
  for(const path of ['index.html','es/index.html'])assert.equal(readFileSync(resolve(site,path),'utf8').includes('data-project="flow-atelier"'),false);
  assert.equal(existsSync(resolve(portfolio,'src/content/projects/flow-atelier.md')),false);
  assert.equal(readFileSync(authored,'utf8'),'Owner-authored draft');
  assert.equal(JSON.parse(readFileSync(resolve(portfolio,'src/content/data/canonical-projects.json'))).projects.some(p=>p.id==='flow-atelier'),false);
 }finally{rmSync(temp,{recursive:true,force:true});}
});

test('profile sync retains linked catalog thumbnails, table content and publication boundaries',()=>{
 const temp=mkdtempSync(resolve(tmpdir(),'presence-profile-images-'));
 try{
  const site=resolve(temp,'site'),personal=resolve(temp,'personal'),organization=resolve(temp,'organization');
  mkdirSync(site);mkdirSync(personal);mkdirSync(resolve(organization,'profile'),{recursive:true});
  for(const dir of ['scripts','data'])cpSync(resolve(root,dir),resolve(site,dir),{recursive:true});
  const publications='## Publications and Lectures\n\nOwner-approved publication copy.\n\n| Name | Description | Topics |\n| --- | --- | --- |\n| First lecture | Keep first description. | `First` |\n| Second lecture | Keep second description. | `Second` |\n| Third lecture | Keep third description. | `Third` |\n| Building Deep Research Agents with Nvidia GPUs | Keep fourth description. | `Fourth` |\n';
  const personalPath=resolve(personal,'readme.md'),organizationPath=resolve(organization,'profile/README.md');
  writeFileSync(personalPath,'# Owner introduction\n\n## End-To-End Products\n\nApproved products introduction.\n\nOld table.\n\n## Open-Source Products and Public Tools\n\nOld table.\n\n## Toy Projects\n\nApproved toys introduction.\n\nOld table.\n\n'+publications);
  const services='## Services\n\nOwner-approved service copy.\n\nOwner footer.\n';
  writeFileSync(organizationPath,'# Studio introduction\n\n## Products\n\nOld table.\n\n## Open Source and Public Code\n\nOld table.\n\n'+services);
  const filename=resolve(site,'data/projects.json'),data=JSON.parse(readFileSync(filename));
  data.projects.push({...data.projects[0],id:'profile-draft',name:'Unpublished profile draft',publication:'draft'});
  writeFileSync(filename,JSON.stringify(data));
  const run=()=>execFileSync(process.execPath,[resolve(site,'scripts/sync-presence.mjs'),'--personal',personal,'--organization',organization],{cwd:site});
  run();
  const ids='dictaria smart-nutrition study-buddy book-advisor fairsplit day-conductor smart-pomodoro chord-changes web-editor jetbreak flow-atelier quire-writer annolabel audio-whisperer simple-backtest open-portfolio guille-plugins self-hosted-research scraping-pipeline scraping-properties'.split(' ');
  const decode=value=>value.replace(/&(amp|lt|gt|quot|#39|#124);/g,(_,entity)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'",'#124':'|'}[entity]));
  const before=[];
  for(const [path,expectedIds,columns] of [[personalPath,ids,3],[organizationPath,ids.slice(0,16),2]]){
   const text=readFileSync(path,'utf8');before.push(text);
   const rows=text.split('\n').filter(line=>line.startsWith('| <a'));
   assert.equal(rows.length,expectedIds.length);
   for(const [index,row] of rows.entries()){
    const p=data.projects.find(p=>p.id===expectedIds[index]),cells=row.split('|').slice(1,-1).map(cell=>cell.trim());
    assert.equal(cells.length,columns);
    const attributes=Object.fromEntries([...cells[0].matchAll(/(\w+)="([^"]*)"/g)].map(([,key,value])=>[key,decode(value)]));
    assert.equal(attributes.href,p.urls.canonical);
    assert.equal(attributes.src,new URL(p.visual.path,'https://andesprit.com/').href);
    assert.equal(attributes.width,'200');
    assert.equal(Object.hasOwn(attributes,'height'),false);
    assert.equal(attributes.alt,p.visual.en);
    assert.ok(cells[0].endsWith(`</a><br>[${p.name}](${p.urls.canonical})`));
    assert.ok(cells[1].includes(p.en.description));
    if(columns===3)for(const tag of p.tags)assert.ok(cells[2].includes('`'+tag+'`'));
   }
   assert.equal(text.includes('Unpublished profile draft'),false);
   assert.equal(text.includes('Model Studio'),false);
  }
  assert.ok(before[0].startsWith('# Owner introduction\n\n'));
  assert.equal(before[0].slice(before[0].indexOf('## Publications and Lectures')),publications);
  assert.equal(before[1].slice(before[1].indexOf('## Services')),services);
  run();
  assert.equal(readFileSync(personalPath,'utf8'),before[0]);
  assert.equal(readFileSync(organizationPath,'utf8'),before[1]);
  const toy=data.projects.find(p=>p.id==='guille-plugins');
  toy.visual.en='An "illustration" & <workflow> | developer\'s view.';
  writeFileSync(filename,JSON.stringify(data));run();
  const escapedRow=readFileSync(personalPath,'utf8').split('\n').find(line=>line.includes('[guille-plugins]'));
  assert.ok(escapedRow.includes('alt="An &quot;illustration&quot; &amp; &lt;workflow&gt; &#124; developer&#39;s view."'));
  assert.equal(escapedRow.split('|').slice(1,-1).length,3);
  delete toy.visual;toy.featured=false;
  data.projects.find(p=>p.id==='flow-atelier').publication='draft';
  writeFileSync(filename,JSON.stringify(data));run();
  assert.ok(readFileSync(personalPath,'utf8').includes('| [guille-plugins]('));
  for(const path of [personalPath,organizationPath])assert.equal(readFileSync(path,'utf8').includes('[Flow Atelier]'),false);
 }finally{rmSync(temp,{recursive:true,force:true});}
});
