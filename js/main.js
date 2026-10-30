// Enzo Bouarab — portfolio
// Amélioration progressive : sans ce script, la page reste entièrement lisible et navigable.
// Le mouvement de défilement est 100 % CSS (scroll-driven animations) ; ce module ne gère que
// les interactions : menu, View Transitions, filtres, inclinaison 3D et formulaire.

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

// Active les états « avant entrée » du CSS : sans JS, rien n'est jamais masqué
root.classList.add('js');

/**
 * Exécute `update` dans une View Transition nommée (data-vt sur <html> choisit la chorégraphie CSS).
 * Repli : mise à jour directe si l'API est absente ou si l'utilisateur limite les animations.
 */
function transition(kind, update) {
  if (!document.startViewTransition || reducedMotion.matches) {
    update();
    return Promise.resolve();
  }
  root.dataset.vt = kind;
  const vt = document.startViewTransition(update);
  return vt.finished.finally(() => delete root.dataset.vt);
}

/* ── Menu plein écran ─────────────────────────────────────── */
const menu = document.getElementById('menu');
const openBtn = document.querySelector('[data-menu-open]');

function openMenu() {
  if (menu.open) return;
  transition('menu-open', () => menu.showModal());
}

function closeMenu(then) {
  if (!menu.open) return;
  transition('menu-close', () => {
    menu.close();
    then?.();
  });
}

// Les boutons portent command/commandfor (Invoker Commands) : sans JS, le navigateur ouvre/ferme
// le dialog nativement. Ici on annule cette action par défaut pour l'animer via View Transition.
openBtn.addEventListener('click', (event) => {
  event.preventDefault();
  openMenu();
});
menu.querySelector('[data-menu-close]').addEventListener('click', (event) => {
  event.preventDefault();
  closeMenu();
});

// Échap : on intercepte pour animer la fermeture au lieu de la couper net
menu.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeMenu();
});

/* ── Navigation interne (ancres) ──────────────────────────── */
function goTo(hash) {
  const target = document.querySelector(hash);
  if (!target) return;
  target.scrollIntoView({ behavior: 'instant', block: 'start' });
  history.pushState(null, '', hash);
  // Place le focus clavier dans la section atteinte sans re-scroller
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
  const hash = link.getAttribute('href');
  if (hash === '#' || !document.querySelector(hash)) return;

  event.preventDefault();
  if (menu.open) {
    closeMenu(() => goTo(hash));
  } else {
    transition('jump', () => goTo(hash));
  }
});

/* ── Thème clair / sombre ─────────────────────────────────── */
// Le thème initial est posé par le script inline du <head> (avant peinture, sans flash).
const themeBtn = document.querySelector('[data-theme-toggle]');
const themeLabel = document.querySelector('[data-theme-label]');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const THEME_COLORS = { dark: '#050a1c', light: '#f4f7fc' };

function applyTheme(theme) {
  root.dataset.theme = theme;
  themeLabel.textContent = theme === 'dark' ? 'Mode clair' : 'Mode sombre';
  themeMeta?.setAttribute('content', THEME_COLORS[theme]);
}

applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');

themeBtn.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  // Le cercle de la View Transition part du centre du bouton
  const box = themeBtn.getBoundingClientRect();
  root.style.setProperty('--vt-x', `${box.left + box.width / 2}px`);
  root.style.setProperty('--vt-y', `${box.top + box.height / 2}px`);
  transition('theme', () => applyTheme(next));
  try { localStorage.setItem('theme', next); } catch {}
});

// Sans choix mémorisé, on suit les changements de préférence système en direct
matchMedia('(prefers-color-scheme: light)').addEventListener('change', (event) => {
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch {}
  if (!saved) applyTheme(event.matches ? 'light' : 'dark');
});

/* ── HUD éphémère ─────────────────────────────────────────── */
// Petite capsule flottante qui annonce la section atteinte, puis s'efface.
const hud = document.querySelector('[data-hud]');
const hudNum = hud.querySelector('.hud__num');
const hudLabel = hud.querySelector('.hud__label');
let hudTimer = 0;
let lastHud = '';

function showHud(section) {
  const num = section.querySelector('.sec-head__num')?.textContent;
  const kicker = section.querySelector('.kicker');
  const label = (kicker?.dataset.text ?? kicker?.textContent)?.replace(/^\/\/\s*/, '');
  if (!num || num === lastHud) return;
  lastHud = num;
  hudNum.textContent = num;
  hudLabel.textContent = label;
  hud.classList.add('is-visible');
  clearTimeout(hudTimer);
  hudTimer = setTimeout(() => hud.classList.remove('is-visible'), 2600);
}

/* ── Section active dans la navigation rapide ─────────────── */
const navLinks = new Map(
  [...document.querySelectorAll('.quicknav a, .menu__list a')].map((a) => [a, a.getAttribute('href').slice(1)])
);

const spy = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      showHud(entry.target);
      for (const [link, id] of navLinks) {
        if (id === entry.target.id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    }
  },
  { rootMargin: '-45% 0px -50% 0px' }
);
document.querySelectorAll('main > section[id]').forEach((section) => spy.observe(section));

/* ── Entrée des en-têtes de section ───────────────────────── */
const headObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      headObserver.unobserve(entry.target);
    }
  },
  { rootMargin: '0px 0px -8% 0px' }
);
document.querySelectorAll('.sec-head').forEach((head) => headObserver.observe(head));

/* ── Horloge du menu ──────────────────────────────────────── */
const dateFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const clockDate = menu.querySelector('[data-clock-date]');
const clockTime = menu.querySelector('[data-clock-time]');

function tick() {
  const now = new Date();
  clockDate.textContent = dateFmt.format(now);
  clockTime.textContent = timeFmt.format(now);
}
tick();
setInterval(tick, 15_000);

/* ── Inclinaison 3D au pointeur ───────────────────────────── */
function bindTilt(card) {
  const max = 6;
  let frame = 0;

  card.addEventListener('pointermove', (event) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width;
      const y = (event.clientY - box.top) / box.height;
      card.classList.add('is-tilting');
      card.style.setProperty('--ry', `${(x - 0.5) * max * 2}deg`);
      card.style.setProperty('--rx', `${(0.5 - y) * max * 2}deg`);
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
    });
  });

  card.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frame);
    card.classList.remove('is-tilting');
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  });
}

if (finePointer.matches && !reducedMotion.matches) {
  document.querySelectorAll('.tilt').forEach(bindTilt);
}

/* ── Formulaire de contact ────────────────────────────────── */
// Avec un identifiant Formspree (attribut data-formspree), le message part directement.
// Sans identifiant, on ouvre la messagerie du visiteur avec un e-mail pré-rempli :
// les messages ne peuvent arriver qu'à l'adresse indiquée dans l'attribut action.
const form = document.querySelector('[data-contact-form]');
const formStatus = form.querySelector('[data-form-status]');
const formspreeId = form.dataset.formspree?.trim();

function openMailDraft() {
  const data = new FormData(form);
  const subject = data.get('subject') || `Contact depuis le portfolio — ${data.get('name')}`;
  const body = [
    data.get('message'),
    '',
    `— ${data.get('name')}${data.get('company') ? `, ${data.get('company')}` : ''}`,
    data.get('email'),
  ].join('\n');
  location.href = `${form.action}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function setStatus(state, message) {
  formStatus.dataset.state = state;
  formStatus.textContent = message;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const fields = [...form.querySelectorAll('input, textarea')];
  fields.forEach((field) => {
    const invalid = !field.checkValidity();
    field.setAttribute('aria-invalid', String(invalid));
    const err = field.parentElement.querySelector('.field__err');
    if (err) {
      err.id ||= `${field.id}-err`;
      if (invalid) field.setAttribute('aria-describedby', err.id);
      else field.removeAttribute('aria-describedby');
    }
  });

  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    setStatus('error', 'Merci de compléter les champs signalés.');
    form.querySelector(':invalid')?.focus();
    return;
  }

  if (!formspreeId) {
    openMailDraft();
    setStatus('ok', 'Votre messagerie s\'ouvre avec le message prêt à envoyer.');
    return;
  }

  form.setAttribute('aria-busy', 'true');
  setStatus('pending', 'Envoi en cours…');

  try {
    const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(String(response.status));
    form.reset();
    form.classList.remove('was-validated');
    setStatus('ok', 'Message envoyé — je vous réponds sous 24 h. Merci !');
  } catch {
    setStatus('error', "L'envoi a échoué. Réessayez ou écrivez-moi directement par e-mail.");
  } finally {
    form.removeAttribute('aria-busy');
  }
});

/* ── Divers ───────────────────────────────────────────────── */
document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
