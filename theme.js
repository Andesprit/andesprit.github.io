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

const navMenus = document.querySelectorAll('.nav-menu');

function setNavMenu(menu, open) {
  menu.classList.toggle('open', open);
  menu.querySelector('.nav-menu-toggle').setAttribute('aria-expanded', String(open));
}

function closeNavMenus(except) {
  navMenus.forEach((menu) => {
    if (menu !== except) setNavMenu(menu, false);
  });
}

navMenus.forEach((menu) => {
  const toggle = menu.querySelector('.nav-menu-toggle');
  const dropdown = menu.querySelector('.nav-dropdown');

  toggle.addEventListener('click', () => {
    const willOpen = !menu.classList.contains('open');
    closeNavMenus(menu);
    setNavMenu(menu, willOpen);
  });

  dropdown.addEventListener('click', (event) => {
    if (event.target.closest('a')) setNavMenu(menu, false);
  });

  menu.addEventListener('focusout', () => {
    setTimeout(() => {
      if (!menu.contains(document.activeElement)) setNavMenu(menu, false);
    });
  });
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.nav-menu')) closeNavMenus();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openMenu = document.querySelector('.nav-menu.open');
  if (openMenu) {
    setNavMenu(openMenu, false);
    openMenu.querySelector('.nav-menu-toggle').focus();
  }
});

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
