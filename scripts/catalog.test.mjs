import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalog, validateCatalog, publishedProjects } from './catalog.mjs';
test('approved catalog passes validation',()=>assert.equal(validateCatalog(catalog),catalog));
for(const [name,mutate] of [
 ['missing canonical URL',p=>delete p.urls.canonical],
 ['unknown status',p=>p.status='launched-for-everyone'],
 ['missing Spanish',p=>p.es.description=''],
 ['license without source',p=>p.source.visibility='private'],
 ['missing license evidence',p=>p.source.licenseEvidence=null],
 ['missing review date',p=>p.reviewed=''],
 ['fork in showcase',p=>p.source.fork=true],
 ['Atelier support package in showcase',p=>{p.category='supporting-package';p.parent='flow-atelier';}],
 ['missing private project webpage',p=>{p.source={visibility:'private',license:null};p.urls={canonical:'https://example.org'};}]
]) test(`rejects ${name}`,()=>{const data=structuredClone(catalog);mutate(data.projects[0]);assert.throws(()=>validateCatalog(data));});
test('drafts and templates are excluded from all outputs',()=>{const data=structuredClone(catalog);data.projects[0].publication='draft';data.projects[1].publication='template';const ids=publishedProjects(data).map(p=>p.id);assert.ok(!ids.includes('flow-atelier'));assert.ok(!ids.includes('quire-writer'));});
test('downloads are not application source',()=>{for(const id of ['dictaria','jetbreak']){const p=catalog.projects.find(p=>p.id===id);assert.equal(p.source.visibility,'private');assert.ok(!p.urls.source);assert.ok(p.urls.downloads);}});
test('Web Editor qualifies through its public webpage with private source',()=>{const p=catalog.projects.find(p=>p.id==='web-editor');assert.equal(p.name,'Web Editor');assert.equal(p.category,'web-app');assert.equal(p.urls.page,'https://webeditor.andesprit.com/');assert.equal(p.source.visibility,'private');assert.ok(p.personal&&p.studio);});
