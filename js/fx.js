// Couche « eye candy » : séquence de démarrage, curseur, boutons magnétiques, titres décodés,
// compteurs et parallaxe du hero. Tout est décoratif : le site reste complet sans ce module.

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ── Océan WebGL : chargé après la première peinture pour ne pas peser sur le LCP ── */
const oceanCanvas = document.querySelector('[data-ocean]');
if (oceanCanvas) {
  const boot = () => import('./ocean.js').then((m) => m.startOcean(oceanCanvas));
  if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 1200 });
  else setTimeout(boot, 300);
}

/* ── Séquence de démarrage ─────────────────────────────────── */
// La chorégraphie est en CSS ; ici on permet seulement de la passer, puis on retire l'overlay.
const bootEl = document.querySelector('[data-boot]');
if (bootEl && root.classList.contains('is-booting')) {
  const finish = () => {
    
    root.classList.add('booted');
    bootEl.remove();
    removeEventListener('keydown', skip);
  };
  const skip = () => bootEl.classList.add('is-skipping');
  bootEl.addEventListener('animationend', (e) => { if (e.target === bootEl) finish(); });
  bootEl.addEventListener('click', skip);
  addEventListener('keydown', skip);
} else {
  bootEl?.remove();
}

/* ── Kickers décodés ──────────────────────────────────────── */
// Le petit libellé monospace au-dessus de chaque titre défile en glyphes aléatoires avant de se fixer,
// pendant que le titre fait son entrée (CSS). En monospace, la largeur ne bouge pas : aucun reflow.
// Le grand mot du bloc blanc n'est jamais brouillé : il doit rester net pendant son volet.
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/<>_=+';

function scramble(el, duration = 650) {
  const final = el.dataset.text ?? el.textContent;
  const start = performance.now();

  function step(now) {
    const progress = Math.min(1, (now - start) / duration);
    const settled = Math.floor(progress * final.length);
    let out = '';
    for (let i = 0; i < final.length; i++) {
      const c = final[i];
      out += i < settled || c === ' ' || c === '/' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = final;
  }
  requestAnimationFrame(step);
}

if (!reducedMotion) {
  const kickers = document.querySelectorAll('.sec-head .kicker');
  // Texte d'origine conservé : le HUD et les lecteurs d'écran le lisent pendant l'effet
  kickers.forEach((kicker) => {
    kicker.dataset.text = kicker.textContent;
    kicker.setAttribute('aria-label', kicker.textContent);
  });
  // Même seuil que l'entrée des en-têtes (main.js) : les deux effets démarrent ensemble
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      io.unobserve(entry.target);
      scramble(entry.target.querySelector('.kicker'));
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.sec-head').forEach((h) => io.observe(h));
}

/* ── Compteurs du hero ─────────────────────────────────────── */
const counters = document.querySelectorAll('[data-count]');
if (!reducedMotion) {
  const delay = root.classList.contains('is-booting') ? 1900 : 500;
  setTimeout(() => {
    counters.forEach((el) => {
      const target = Number(el.dataset.count);
      const pad = Number(el.dataset.pad || 0);
      const start = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - start) / 1400);
        const eased = 1 - Math.pow(1 - k, 4);
        el.textContent = String(Math.round(target * eased)).padStart(pad, '0');
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, delay);
}

/* ── Curseur, boutons magnétiques et parallaxe : pointeur fin uniquement ── */
if (finePointer && !reducedMotion) {
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span class="cursor__ring"><span class="cursor__label"></span></span><span class="cursor__dot"></span>';
  document.body.append(cursor);
  root.classList.add('has-cursor');

  const ring = cursor.querySelector('.cursor__ring');
  const dot = cursor.querySelector('.cursor__dot');
  const label = cursor.querySelector('.cursor__label');
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;

  addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    cursor.classList.add('is-active');
  }, { passive: true });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
  addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  addEventListener('pointerup', () => cursor.classList.remove('is-down'));

  const interactive = 'a, button, [role="button"], label';
  document.addEventListener('pointerover', (e) => {
    const target = e.target.closest(interactive);
    cursor.classList.toggle('is-hover', Boolean(target));
    label.textContent = '';
  });

  (function loop() {
    rx += (x - rx) * 0.18;
    ry += (y - ry) * 0.18;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    requestAnimationFrame(loop);
  })();

  // Boutons magnétiques : ils se laissent attirer de quelques pixels vers le pointeur
  document.querySelectorAll('.btn, .menu-btn, .theme-btn, .chip-link, .brand__mark').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const b = el.getBoundingClientRect();
      const dx = (e.clientX - (b.left + b.width / 2)) * 0.25;
      const dy = (e.clientY - (b.top + b.height / 2)) * 0.35;
      el.style.translate = `${dx}px ${dy}px`;
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });

  // Parallaxe du hero : le nom et la découpe bleue glissent en sens opposés
  const hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', (e) => {
    const b = hero.getBoundingClientRect();
    hero.style.setProperty('--px', ((e.clientX - b.left) / b.width - 0.5).toFixed(3));
    hero.style.setProperty('--py', ((e.clientY - b.top) / b.height - 0.5).toFixed(3));
  });
}
