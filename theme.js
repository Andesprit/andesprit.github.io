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

document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const track = carousel.querySelector('.carousel-track');
  const cards = Array.from(track.children);
  const readout = carousel.querySelector('.cord-index');
  const steps = carousel.querySelectorAll('.cord-step');

  function goTo(i) {
    const card = cards[Math.max(0, Math.min(i, cards.length - 1))];
    track.scrollLeft = card.offsetLeft - cards[0].offsetLeft;
  }

  function nearest() {
    const x = track.scrollLeft + cards[0].offsetLeft;
    let best = 0;
    cards.forEach((card, i) => {
      if (Math.abs(card.offsetLeft - x) < Math.abs(cards[best].offsetLeft - x)) best = i;
    });
    return best;
  }

  const ticks = cards.map((card, i) => {
    const tick = document.createElement('button');
    tick.type = 'button';
    tick.className = 'cord-tick';
    tick.setAttribute('aria-label', card.querySelector('h3').textContent);
    tick.addEventListener('click', () => goTo(i));
    const item = document.createElement('li');
    item.append(tick);
    carousel.querySelector('.cord-ticks').append(item);
    return tick;
  });

  let frame = 0;

  function paint() {
    frame = 0;
    const atStart = track.scrollLeft <= 1;
    const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
    // At the end the trailing cards are all on screen, so report the last one
    // rather than the leftmost — otherwise the readout never reaches 08 / 08.
    const active = atEnd ? cards.length - 1 : nearest();
    ticks.forEach((tick, i) => tick.setAttribute('aria-current', String(i === active)));
    readout.textContent = String(active + 1).padStart(2, '0');
    steps.forEach((step) => {
      step.setAttribute('aria-disabled', String(Number(step.dataset.dir) < 0 ? atStart : atEnd));
    });
  }

  steps.forEach((step) => {
    step.addEventListener('click', () => goTo(nearest() + Number(step.dataset.dir)));
  });

  track.addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(paint);
  }, { passive: true });
  addEventListener('resize', paint, { passive: true });
  paint();
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
