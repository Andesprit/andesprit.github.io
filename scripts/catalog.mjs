import { readFileSync } from 'node:fs';
export const catalog = JSON.parse(readFileSync(new URL('../data/projects.json', import.meta.url), 'utf8'));
const statuses = new Set(['unspecified', 'public-beta', 'playtest', 'prototype', 'available', 'preview', 'in-development', 'paused', 'archived']);
const categories = new Set(['web-app', 'desktop-app', 'developer-tool', 'game', 'research', 'template', 'supporting-package', 'contribution']);
export function validateCatalog(data) {
  const ids = new Set();
  const requireText = (value, label) => { if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing ${label}`); };
  const https = (value, label) => { requireText(value, label); if (new URL(value).protocol !== 'https:') throw new Error(`Expected HTTPS for ${label}`); };
  for (const p of data.projects) {
    requireText(p.id, 'project ID');
    if (!/^[a-z0-9-]+$/.test(p.id) || ids.has(p.id)) throw new Error(`Invalid or duplicate ID: ${p.id}`);
    ids.add(p.id);
    requireText(p.name, `${p.id} name`);
    if (!Array.isArray(p.tags) || p.tags.length < 2 || new Set(p.tags).size !== p.tags.length) throw new Error(`Distinct topic tags required: ${p.id}`);
    requireText(p.owner, `${p.id} owner`);
    requireText(p.maintainer, `${p.id} maintainer`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.reviewed)) throw new Error(`Missing review date: ${p.id}`);
    if (!categories.has(p.category)) throw new Error(`Unknown category: ${p.id}`);
    if (!statuses.has(p.status)) throw new Error(`Unknown status: ${p.id}`);
    if (!['published', 'draft', 'template'].includes(p.publication)) throw new Error(`Unknown publication: ${p.id}`);
    if (!['website', 'source', 'downloads', 'documentation'].includes(p.access)) throw new Error(`Unknown access: ${p.id}`);
    https(p.urls.canonical, `${p.id} canonical URL`);
    Object.entries(p.urls).forEach(([key, value]) => https(value, `${p.id} ${key}`));
    if (!['public','private','unspecified'].includes(p.source.visibility)) throw new Error(`Unknown source visibility: ${p.id}`);
    if (p.source.visibility === 'public' && !p.urls.source) throw new Error(`Public source URL required: ${p.id}`);
    if (p.source.visibility !== 'public' && (p.urls.source || p.source.license)) throw new Error(`Unavailable source/license: ${p.id}`);
    if (p.source.license) https(p.source.licenseEvidence, `${p.id} license evidence`);
    if (p.publication === 'published' && p.source.visibility !== 'public' && !p.urls.page) throw new Error(`Public webpage required: ${p.id}`);
    if (p.publication === 'published' && (p.source.fork === true || p.parent === 'flow-atelier' || p.category === 'supporting-package')) throw new Error(`Excluded showcase entry: ${p.id}`);
    if (p.access === 'downloads' && !p.urls.downloads) throw new Error(`Downloads URL required: ${p.id}`);
    const destination = { website: 'page', source: 'source', downloads: 'downloads', documentation: 'docs' }[p.access];
    if (!p.urls[destination]) throw new Error(`Access destination required: ${p.id}`);
    if (p.visual && (!Number.isInteger(p.visual.width) || p.visual.width < 1 || !Number.isInteger(p.visual.height) || p.visual.height < 1)) throw new Error(`Visual dimensions required: ${p.id}`);
    for (const lang of ['en','es']) {
      requireText(p[lang]?.description, `${p.id} ${lang} description`);
      for (const platform of p.platforms) requireText(platform[lang], `${p.id} ${lang} platform`);
      if (p.featured) {
        for (const key of ['problem','role','built','decision','evidence','limitation']) requireText(p.caseStudy?.[lang]?.[key], `${p.id} ${lang} case study ${key}`);
        requireText(p.visual?.[lang], `${p.id} ${lang} visual description`);
      }
    }
  }
  for (const p of data.projects) if (p.parent && !ids.has(p.parent)) throw new Error(`Unknown parent: ${p.id}`);
  return data;
}
export const publishedProjects = (data = catalog) => validateCatalog(data).projects.filter(p => p.publication === 'published');
export const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export const labels = {
  en: { 'web-app':'Web app', 'desktop-app':'Desktop app', 'developer-tool':'Developer tool', game:'Game', research:'Research & experiments', template:'Template', 'supporting-package':'Workflow package', contribution:'Contribution', unspecified:'', 'public-beta':'Public beta', playtest:'Early playtesting', prototype:'Prototype', available:'Available', preview:'Preview', 'in-development':'In development', paused:'Paused', archived:'Archived', website:'Visit project', source:'View source', downloads:'Get downloads', documentation:'Read documentation' },
  es: { 'web-app':'Aplicación web', 'desktop-app':'Aplicación de escritorio', 'developer-tool':'Herramienta para desarrolladores', game:'Juego', research:'Investigación y experimentos', template:'Plantilla', 'supporting-package':'Paquete de flujos', contribution:'Contribución', unspecified:'', 'public-beta':'Beta pública', playtest:'Pruebas tempranas', prototype:'Prototipo', available:'Disponible', preview:'Versión preliminar', 'in-development':'En desarrollo', paused:'En pausa', archived:'Archivado', website:'Visitar proyecto', source:'Ver código', downloads:'Ver descargas', documentation:'Leer documentación' }
};
export function sourceLabel(p, lang) {
  if(p.source.visibility === 'public') return p.source.license ? `${lang === 'es' ? 'Código abierto' : 'Open source'} · ${p.source.license}` : (lang === 'es' ? 'Código público · licencia no especificada' : 'Public source · license unspecified');
  return lang === 'es' ? 'Código privado' : 'Private source';
}
export function action(p, lang) {
  return { label: labels[lang][p.access], url: p.access === 'downloads' ? p.urls.downloads : p.access === 'source' ? p.urls.source : p.access === 'documentation' ? p.urls.docs : p.urls.page };
}
