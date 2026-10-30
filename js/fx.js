// Couche « eye candy » : séquence de démarrage, curseur, boutons magnétiques, titres décodés,
// compteurs, parallaxe du hero et rail de projets. Tout est décoratif : le site reste complet sans ce module.

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

/* ── Titres décodés ────────────────────────────────────────── */
// Le premier mot (bloc blanc) et le kicker défilent en glyphes aléatoires avant de se fixer.
// Largeur verrouillée pendant l'effet : aucun reflow, aucun décalage de mise en page.
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/<>_=+';

function scramble(el, duration = 750) {
  const final = el.textContent;
  const box = el.getBoundingClientRect();
  el.style.inlineSize = `${box.width}px`;
  el.style.overflow = 'hidden';
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
    else {
      el.textContent = final;
      el.style.inlineSize = '';
      el.style.overflow = '';
    }
  }
  requestAnimationFrame(step);
}

if (!reducedMotion) {
  const heads = document.querySelectorAll('.sec-head');
  heads.forEach((head) => {
    const title = head.querySelector('.sec-head__title');
    const kicker = head.querySelector('.kicker');
    // Texte d'origine conservé : le HUD le lit pendant que l'effet tourne
    if (kicker) kicker.dataset.text = kicker.textContent;
    // Le titre complet reste lisible par les lecteurs d'écran pendant l'effet
    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
  });
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      io.unobserve(entry.target);
      const word = entry.target.querySelector('.sec-head__title span');
      const kicker = entry.target.querySelector('.kicker');
      if (word) scramble(word, 800);
      if (kicker) scramble(kicker, 600);
    }
  }, { rootMargin: '0px 0px -25% 0px' });
  heads.forEach((h) => io.observe(h));
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

/* ── Rail de projets : hauteur proportionnelle au nombre de cartes visibles ── */
const rail = document.querySelector('.rail');
const railCount = document.querySelector('[data-rail-count]');
if (rail) {
  const update = () => {
    const n = rail.querySelectorAll('.project:not([hidden])').length;
    rail.style.setProperty('--n', n);
    if (railCount) railCount.textContent = String(n).padStart(2, '0');
  };
  new MutationObserver(update).observe(rail, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  update();
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

  const interactive = 'a, button, [role="button"], label, .project';
  document.addEventListener('pointerover', (e) => {
    const target = e.target.closest(interactive);
    cursor.classList.toggle('is-hover', Boolean(target));
    label.textContent = target?.classList.contains('project') && !e.target.closest('a') ? 'Voir' : '';
  });

  (function loop() {
    rx += (x - rx) * 0.18;
    ry += (y - ry) * 0.18;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    requestAnimationFrame(loop);
  })();

  // Boutons magnétiques : ils se laissent attirer de quelques pixels vers le pointeur
  document.querySelectorAll('.btn, .menu-btn, .theme-btn, .chip-link, .filter, .brand__mark').forEach((el) => {
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
