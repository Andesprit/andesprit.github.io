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

  cards.forEach((card, i) => {
    card.dataset.carouselIndex = i;
  });

  function cloneCard(card, i) {
    const clone = card.cloneNode(true);
    clone.removeAttribute('id');
    clone.dataset.carouselIndex = i;
    clone.dataset.carouselClone = '';
    clone.setAttribute('aria-hidden', 'true');
    clone.tabIndex = -1;
    return clone;
  }

  const leadingCards = cards.map(cloneCard);
  const trailingCards = cards.map(cloneCard);
  track.prepend(...leadingCards);
  track.append(...trailingCards);
  const allCards = [...leadingCards, ...cards, ...trailingCards];
  let initialized = false;

  function cardPosition(card) {
    return card.offsetLeft - allCards[0].offsetLeft;
  }

  function loopWidth() {
    return cardPosition(trailingCards[0]) - cardPosition(cards[0]);
  }

  function wrapIndex(i) {
    return (i % cards.length + cards.length) % cards.length;
  }

  function jumpTo(left) {
    track.classList.add('is-jumping');
    track.scrollLeft = left;
    requestAnimationFrame(() => track.classList.remove('is-jumping'));
  }

  function goTo(i) {
    const index = wrapIndex(i);
    const candidates = [leadingCards[index], cards[index], trailingCards[index]];
    const card = candidates.reduce((closest, candidate) => (
      Math.abs(cardPosition(candidate) - track.scrollLeft)
        < Math.abs(cardPosition(closest) - track.scrollLeft)
        ? candidate
        : closest
    ));
    track.scrollLeft = cardPosition(card);
  }

  function nearest() {
    let best = allCards[0];
    allCards.forEach((card) => {
      if (Math.abs(cardPosition(card) - track.scrollLeft)
        < Math.abs(cardPosition(best) - track.scrollLeft)) best = card;
    });
    return Number(best.dataset.carouselIndex);
  }

  function normalizeLoop() {
    if (!initialized) return;
    const start = cardPosition(cards[0]);
    const width = loopWidth();
    const edgeTolerance = 16;
    let left = track.scrollLeft;
    if (left < start - edgeTolerance) left += width;
    else if (left >= start + width - edgeTolerance) left -= width;
    else return;
    jumpTo(left);
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
    if (!initialized) return;
    const active = nearest();
    ticks.forEach((tick, i) => tick.setAttribute('aria-current', String(i === active)));
    readout.textContent = String(active + 1).padStart(2, '0');
    steps.forEach((step) => step.removeAttribute('aria-disabled'));
  }

  steps.forEach((step) => {
    step.addEventListener('click', () => goTo(nearest() + Number(step.dataset.dir)));
  });

  let dragPointer = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartScroll = 0;
  let dragStartTime = 0;
  let dragMoved = false;
  let suppressClick = false;
  let clickResetTimer = 0;

  function finishDrag(event) {
    if (dragPointer !== event.pointerId) return;
    dragPointer = null;
    track.classList.remove('is-dragging');
    if (track.hasPointerCapture?.(event.pointerId)) track.releasePointerCapture(event.pointerId);
    const held = performance.now() - dragStartTime >= 450;
    if (dragMoved || held) {
      suppressClick = true;
      clearTimeout(clickResetTimer);
      clickResetTimer = setTimeout(() => { suppressClick = false; });
    }
    if (dragMoved) requestAnimationFrame(() => goTo(nearest()));
  }

  track.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    dragPointer = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartScroll = track.scrollLeft;
    dragStartTime = performance.now();
    dragMoved = false;
    track.setPointerCapture?.(event.pointerId);
  });

  track.addEventListener('pointermove', (event) => {
    if (dragPointer !== event.pointerId) return;
    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;
    if (!dragMoved && Math.abs(deltaX) < 6) return;
    if (!dragMoved && Math.abs(deltaY) > Math.abs(deltaX)) return;
    dragMoved = true;
    track.classList.add('is-dragging');
    event.preventDefault();
    track.scrollLeft = dragStartScroll - deltaX;
  });

  track.addEventListener('pointerup', finishDrag);
  track.addEventListener('pointercancel', finishDrag);
  track.addEventListener('lostpointercapture', finishDrag);
  track.addEventListener('dragstart', (event) => event.preventDefault());
  track.addEventListener('click', (event) => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  let settleTimer = 0;
  track.addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(paint);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(normalizeLoop, 120);
  }, { passive: true });

  addEventListener('resize', () => {
    if (!initialized) return;
    const active = nearest();
    requestAnimationFrame(() => {
      jumpTo(cardPosition(cards[active]));
      paint();
    });
  }, { passive: true });

  function initialize() {
    initialized = true;
    jumpTo(cardPosition(cards[0]));
    paint();
    setTimeout(normalizeLoop, 160);
  }

  if (document.readyState === 'complete') initialize();
  else addEventListener('load', initialize, { once: true });
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
