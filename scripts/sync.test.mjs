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
