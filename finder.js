// Task finder on /tools/ and /es/herramientas/. The described list is complete without this script;
// it only reveals the search form and filters entries by the words in their generated data-search text.
const form = document.querySelector('.finder-search');
const input = document.getElementById('finder-q');
const list = document.getElementById('finder-list');
const statusLine = document.getElementById('finder-status');
const empty = document.getElementById('finder-empty');
const entries = Array.from(list.children).map((item) => ({ item, words: item.dataset.search.split(' '), platform: (item.dataset.platform || '').split(' ').filter(Boolean) }));
const spanish = document.documentElement.lang === 'es';
const stopWords = new Set(spanish
  ? ['a', 'al', 'de', 'del', 'el', 'la', 'las', 'lo', 'los', 'un', 'una', 'y', 'o', 'para', 'por', 'mi', 'mis', 'en', 'con', 'que', 'quiero', 'como']
  : ['a', 'an', 'the', 'to', 'of', 'for', 'and', 'or', 'my', 'i', 'in', 'on', 'with', 'want', 'how', 'me']);

const normalize = (text) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const tokens = (query) => (normalize(query).match(/[a-z0-9]+/g) || []).filter((word) => !stopWords.has(word));
// A query word matches a catalog word that shares its first five letters (grabar/graba,
// recording/record) or that contains it (split in fairsplit). No synonyms or AI.
const matches = (token, words) => words.some((word) => word.startsWith(token.slice(0, 5)) || (token.length >= 4 && word.includes(token)));
// Platform notes (Windows, macOS, Chromium...) match only when the whole query word starts a note word,
// so a shared five-letter stem such as compartidos/compatibilidad does not count.
const hit = (token, entry) => matches(token, entry.words) || entry.platform.some((word) => word.startsWith(token));

function render() {
  const query = input.value.trim();
  const words = tokens(query);
  const scores = entries.map((entry) => words.filter((token) => hit(token, entry)).length);
  // Show only the entries that match the most query words, so a full match hides weaker partial ones.
  const best = words.length ? Math.max(...scores) : 0;
  let shown = 0;
  entries.forEach(({ item }, i) => {
    item.hidden = words.length > 0 && (best === 0 || scores[i] < best);
    if (!item.hidden) shown++;
  });
  empty.hidden = !words.length || best > 0;
  const total = entries.length;
  if (!words.length) statusLine.textContent = spanish ? `Mostrando las ${total} herramientas.` : `Showing all ${total} tools.`;
  else if (!best) statusLine.textContent = spanish ? `Ninguna herramienta coincide con «${query}».` : `No tool matches “${query}”.`;
  else if (best < words.length) statusLine.textContent = spanish
    ? `Ninguna herramienta coincide con todas las palabras; ${shown === 1 ? 'mostramos la más cercana' : `mostramos las ${shown} más cercanas`}.`
    : `No tool matches every word; showing the closest ${shown === 1 ? 'one' : shown}.`;
  else statusLine.textContent = spanish
    ? `${shown} de ${total} herramientas ${shown === 1 ? 'coincide' : 'coinciden'} con «${query}».`
    : `${shown} of ${total} tools ${shown === 1 ? 'matches' : 'match'} “${query}”.`;

  // Keep the query in the address so Back from a result restores it.
  const url = new URL(location.href);
  if (query) url.searchParams.set('q', query);
  else url.searchParams.delete('q');
  history.replaceState(history.state, '', url);
  syncLanguageLink();
}

// Carry the current query and fragment to the other language's finder.
const languageLink = document.querySelector('.lang-switch');
const languagePath = languageLink.pathname;
function syncLanguageLink() {
  languageLink.href = languagePath + location.search + location.hash;
}

function showAll() {
  input.value = '';
  render();
  input.focus();
}

form.hidden = false;
input.value = new URL(location.href).searchParams.get('q') || '';
input.addEventListener('input', render);
form.addEventListener('submit', (event) => event.preventDefault());
form.addEventListener('reset', (event) => {
  event.preventDefault();
  showAll();
});
document.getElementById('finder-all').addEventListener('click', showAll);
addEventListener('pageshow', render);
addEventListener('hashchange', syncLanguageLink);
render();
