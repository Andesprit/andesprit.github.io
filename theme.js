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
  const container = track.querySelector('.carousel-container');
  const cards = Array.from(container.children);
  const readout = carousel.querySelector('.cord-index');
  const steps = carousel.querySelectorAll('.cord-step');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let embla;

  const ticks = cards.map((card, i) => {
    const tick = document.createElement('button');
    tick.type = 'button';
    tick.className = 'cord-tick';
    tick.setAttribute('aria-label', card.querySelector('h3').textContent);
    tick.addEventListener('click', () => embla?.scrollTo(i, reduceMotion));
    const item = document.createElement('li');
    item.append(tick);
    carousel.querySelector('.cord-ticks').append(item);
    return tick;
  });

  function paint(api) {
    const active = api.selectedScrollSnap();
    ticks.forEach((tick, i) => tick.setAttribute('aria-current', String(i === active)));
    readout.textContent = String(active + 1).padStart(2, '0');
  }

  if (typeof EmblaCarousel !== 'function') return;

  // Embla v8 vanilla API and loop options:
  // https://www.embla-carousel.com/docs/v8/get-started/cdn
  // https://www.embla-carousel.com/docs/v8/api/options
  embla = EmblaCarousel(track, {
    align: 'start',
    containScroll: false,
    dragFree: !reduceMotion,
    dragThreshold: 8,
    duration: 28,
    loop: true,
    slidesToScroll: 1,
  });

  track.classList.add('is-enhanced');
  embla.on('select', paint);
  embla.on('reInit', paint);
  embla.on('pointerDown', () => track.classList.add('is-dragging'));
  embla.on('pointerUp', () => track.classList.remove('is-dragging'));
  paint(embla);

  // Anchor links to a card (the Products menu) only scroll the page,
  // so bring the linked card to the front of the rail as well.
  function showLinkedCard() {
    const linked = cards.findIndex((card) => card.id && `#${card.id}` === location.hash);
    if (linked >= 0) embla.scrollTo(linked, true);
  }
  addEventListener('hashchange', showLinkedCard);
  showLinkedCard();

  steps.forEach((step) => {
    step.removeAttribute('aria-disabled');
    step.addEventListener('click', () => {
      if (Number(step.dataset.dir) < 0) embla.scrollPrev(reduceMotion);
      else embla.scrollNext(reduceMotion);
    });
  });

  track.addEventListener('keydown', (event) => {
    if (event.target !== track) return;
    if (event.key === 'ArrowLeft') embla.scrollPrev(reduceMotion);
    else if (event.key === 'ArrowRight') embla.scrollNext(reduceMotion);
    else return;
    event.preventDefault();
  });

  let held = false;
  let holdTimer = 0;
  let holdResetTimer = 0;

  function finishPress() {
    clearTimeout(holdTimer);
    clearTimeout(holdResetTimer);
    holdResetTimer = setTimeout(() => { held = false; });
  }

  track.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    held = false;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => { held = true; }, 450);
  }, { passive: true });
  track.addEventListener('pointerup', finishPress, { passive: true });
  track.addEventListener('pointercancel', finishPress, { passive: true });
  track.addEventListener('click', (event) => {
    if (!held) return;
    held = false;
    event.preventDefault();
    event.stopPropagation();
  }, true);
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
