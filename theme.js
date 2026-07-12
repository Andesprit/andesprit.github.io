const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const themeColor = document.querySelector('meta[name="theme-color"]');
const favicon = document.querySelector('link[rel="icon"]');
const isSpanish = root.lang === 'es';

function setTheme(theme, persist) {
  const isDark = theme === 'dark';
  root.dataset.theme = theme;
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.setAttribute('aria-label', isSpanish
    ? (isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro')
    : (isDark ? 'Switch to light mode' : 'Switch to dark mode'));
  themeColor.content = isDark ? '#071f18' : '#f1f3e9';
  favicon.href = isDark
    ? '/assets/andesprit-mark-dark.svg'
    : '/assets/andesprit-mark-light.svg';
  if (persist) {
    try { localStorage.setItem('theme', theme); } catch (error) {}
  }
}

themeToggle.addEventListener('click', () => {
  setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
});

setTheme(root.dataset.theme, false);
