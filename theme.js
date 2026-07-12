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

const progress = document.querySelector('.scroll-progress');
let progressFrame = 0;

function paintScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - innerHeight;
  const value = scrollable > 0 ? Math.min(scrollY / scrollable, 1) : 0;
  root.style.setProperty('--scroll-progress', value);
  progressFrame = 0;
}

if (progress) {
  paintScrollProgress();
  addEventListener('scroll', () => {
    if (!progressFrame) progressFrame = requestAnimationFrame(paintScrollProgress);
  }, { passive: true });
  addEventListener('resize', paintScrollProgress, { passive: true });
}

const precisePointer = matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

if (precisePointer.matches && !reducedMotion.matches) {
  document.querySelectorAll('.product-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      card.style.setProperty('--card-x', `${event.clientX - bounds.left}px`);
      card.style.setProperty('--card-y', `${event.clientY - bounds.top}px`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--card-x', '50%');
      card.style.setProperty('--card-y', '50%');
    });
  });
}
