(function () {
  'use strict';

  var STORAGE_KEY  = '_formspree_key';
  var MODAL_ID     = 'fs-modal';
  var BTN_ID       = 'fs-config-btn';
  var NAV_WRAP_ID  = 'fs-nav-wrap';
  var STYLES_ID    = 'fs-styles';
  var _autoTimer   = null;   /* minuteur : auto-enregistrement dès la saisie d'une clé valide */

  function getKey() {
    try { return localStorage.getItem(STORAGE_KEY) || ''; }
    catch (e) { return ''; }
  }

  function setKey(k) {
    try { localStorage.setItem(STORAGE_KEY, k); }
    catch (e) {}
  }

  function patchFetch(key) {
    if (!key || window._fsPatchedKey === key) return;
    var native = window._fsNativeFetch || window.fetch;
    window._fsNativeFetch = native;
    window.fetch = function (url, opts) {
      if (typeof url === 'string' && url.indexOf('formspree.io/f/') !== -1) {
        url = 'https://formspree.io/f/' + key;
      }
      return native.call(this, url, opts);
    };
    window._fsPatchedKey = key;
  }

  var existingKey = getKey();
  if (existingKey) patchFetch(existingKey);

  function injectStyles() {
    if (document.getElementById(STYLES_ID)) return;
    var s = document.createElement('style');
    s.id  = STYLES_ID;
    s.textContent = [

      '#' + NAV_WRAP_ID + ' {',
      '  display: flex; align-items: center;',
      '  margin-left: .4rem;',
      '}',

      '#' + BTN_ID + ' {',
      '  display: inline-flex; align-items: center; gap: .4rem;',
      '  padding: .38rem .85rem;',
      '  border-radius: 100px;',
      '  border: 1px solid rgba(59,130,246,.4);',
      '  background: rgba(59,130,246,.12);',
      '  color: var(--clr-accent3, #93c5fd);',
      '  font-family: "IBM Plex Mono", monospace;',
      '  font-size: .9rem; font-weight: 500;',
      '  cursor: pointer; white-space: nowrap;',
      '  transition: background .25s, border-color .25s, color .25s, box-shadow .25s;',
      '  user-select: none;',
      '}',
      '#' + BTN_ID + ':hover {',
      '  background: rgba(59,130,246,.25);',
      '  border-color: #60a5fa; color: #bfdbfe;',
      '  box-shadow: 0 0 16px rgba(59,130,246,.3);',
      '}',
      '#' + BTN_ID + ':focus-visible {',
      '  outline: 2px solid rgba(96,165,250,.8); outline-offset: 2px;',
      '}',
      '#' + BTN_ID + '.fs-key-ok {',
      '  background: rgba(52,211,153,.12);',
      '  border-color: rgba(52,211,153,.4);',
      '  color: #6ee7b7;',
      '}',
      '#' + BTN_ID + '.fs-key-ok:hover {',
      '  background: rgba(52,211,153,.22);',
      '  border-color: #34d399; color: #a7f3d0;',
      '  box-shadow: 0 0 16px rgba(52,211,153,.25);',
      '}',
      '[data-theme="light"] #' + BTN_ID + ' {',
      '  background: rgba(59,130,246,.1);',
      '  border-color: rgba(59,130,246,.35); color: #2563eb;',
      '}',
      '[data-theme="light"] #' + BTN_ID + ':hover {',
      '  background: rgba(59,130,246,.2);',
      '  border-color: #3b82f6; color: #1d4ed8;',
      '}',
      '[data-theme="light"] #' + BTN_ID + '.fs-key-ok {',
      '  background: rgba(5,150,105,.1);',
      '  border-color: rgba(5,150,105,.4); color: #059669;',
      '}',

      '@media print {',
      '  #' + MODAL_ID + ', #' + NAV_WRAP_ID + ' { display: none !important; }',
      '}',

      '@keyframes fsOverlayIn { from { opacity:0; } to { opacity:1; } }',
      '@keyframes fsCardIn {',
      '  from { opacity:0; transform: translateY(20px) scale(.97); }',
      '  to   { opacity:1; transform: translateY(0)    scale(1);   }',
      '}',
      '@keyframes fsDotPulse {',
      '  0%,100% { opacity:1; transform:scale(1); }',
      '  50%      { opacity:.4; transform:scale(.65); }',
      '}',

      '#' + MODAL_ID + ' {',
      '  display: none;',
      '  position: fixed; inset: 0; z-index: 10000;',
      '  background: rgba(2,6,18,.78);',
      '  backdrop-filter: blur(10px);',
      '  -webkit-backdrop-filter: blur(10px);',
      '  align-items: center; justify-content: center;',
      '  padding: 1rem;',
      '  animation: fsOverlayIn .22s ease;',
      '}',
      '#' + MODAL_ID + '.fs-open { display: flex; }',

      '.fs-card {',
      '  background: var(--clr-bg2, #0b1628);',
      '  border: 1px solid rgba(96,165,250,.28);',
      '  border-radius: 20px;',
      '  padding: 2.4rem;',
      '  width: 100%; max-width: 460px;',
      '  box-shadow: 0 32px 80px rgba(0,0,0,.65), 0 0 60px rgba(59,130,246,.1);',
      '  animation: fsCardIn .3s cubic-bezier(.4,0,.2,1);',
      '}',
      '[data-theme="light"] .fs-card {',
      '  background: #ffffff;',
      '  border-color: rgba(59,130,246,.22);',
      '  box-shadow: 0 24px 60px rgba(0,0,0,.14);',
      '}',

      '.fs-card-header {',
      '  display: flex; align-items: flex-start;',
      '  justify-content: space-between; gap: .75rem;',
      '  margin-bottom: 1.5rem;',
      '}',
      '.fs-card-icon {',
      '  width: 46px; height: 46px; border-radius: 13px;',
      '  background: rgba(59,130,246,.14);',
      '  border: 1px solid rgba(59,130,246,.3);',
      '  display: flex; align-items: center; justify-content: center;',
      '  font-size: 1.2rem; color: #60a5fa; flex-shrink: 0;',
      '}',
      '.fs-card-meta { flex: 1; }',
      '.fs-card-title {',
      '  font-family: "Syne", sans-serif;',
      '  font-weight: 800; font-size: 1.2rem;',
      '  color: var(--clr-heading, #f0f6ff);',
      '  margin: 0 0 .22rem; line-height: 1.2;',
      '}',
      '.fs-card-sub {',
      '  font-family: "IBM Plex Mono", monospace;',
      '  font-size: .8rem;',
      '  color: var(--clr-text-soft, #94a3b8);',
      '  margin: 0;',
      '}',
      '.fs-close-btn {',
      '  width: 32px; height: 32px; border-radius: 50%;',
      '  border: 1px solid rgba(255,255,255,.1);',
      '  background: rgba(255,255,255,.05);',
      '  color: var(--clr-text-soft, #94a3b8);',
      '  cursor: pointer; font-size: .9rem;',
      '  display: flex; align-items: center; justify-content: center;',
      '  transition: background .2s, color .2s, border-color .2s;',
      '  flex-shrink: 0; margin-top: .1rem;',
      '}',
      '.fs-close-btn:hover {',
      '  background: rgba(248,113,113,.15);',
      '  color: #f87171; border-color: rgba(248,113,113,.35);',
      '}',
      '.fs-close-btn:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; }',

      '.fs-status {',
      '  display: flex; align-items: center; gap: .6rem;',
      '  background: rgba(251,191,36,.07);',
      '  border: 1px solid rgba(251,191,36,.25);',
      '  border-radius: 10px; padding: .7rem 1rem;',
      '  margin-bottom: 1.4rem;',
      '  font-family: "IBM Plex Mono", monospace;',
      '  font-size: .82rem; color: #fcd34d;',
      '  transition: background .3s, border-color .3s, color .3s;',
      '}',
      '.fs-status.fs-status-ok {',
      '  background: rgba(52,211,153,.08);',
      '  border-color: rgba(52,211,153,.25);',
      '  color: #6ee7b7;',
      '}',
      '.fs-status-dot {',
      '  width: 7px; height: 7px; border-radius: 50%;',
      '  background: currentColor; flex-shrink: 0;',
      '  animation: fsDotPulse 1.8s ease infinite;',
      '}',

      '.fs-field-label {',
      '  display: block;',
      '  font-family: "IBM Plex Mono", monospace;',
      '  font-size: .78rem; letter-spacing: .08em;',
      '  text-transform: uppercase;',
      '  color: var(--clr-text-soft, #94a3b8);',
      '  margin-bottom: .5rem;',
      '}',
      '.fs-hint {',
      '  font-family: "DM Sans", sans-serif;',
      '  font-size: .9rem;',
      '  color: var(--clr-text-faint, #475569);',
      '  line-height: 1.55; margin-bottom: .9rem;',
      '}',
      '.fs-hint strong { color: var(--clr-accent2, #60a5fa); }',
      '.fs-hint code {',
      '  font-family: "IBM Plex Mono", monospace;',
      '  background: rgba(59,130,246,.1);',
      '  padding: 1px 6px; border-radius: 4px; font-size: .85em;',
      '}',
      '.fs-input-wrap { position: relative; margin-bottom: .5rem; }',
      '.fs-prefix {',
      '  position: absolute; left: 13px; top: 50%;',
      '  transform: translateY(-50%);',
      '  font-family: "IBM Plex Mono", monospace;',
      '  font-size: .9rem; color: var(--clr-accent, #3b82f6);',
      '  pointer-events: none; user-select: none;',
      '}',
      '.fs-input {',
      '  width: 100%; box-sizing: border-box;',
      '  padding: .78rem .9rem .78rem 2.5rem;',
      '  background: var(--clr-surface, rgba(255,255,255,.04));',
      '  border: 1px solid var(--clr-border, rgba(96,165,250,.18));',
      '  border-radius: 10px;',
      '  color: var(--clr-text, #e2e8f0);',
      '  font-family: "IBM Plex Mono", monospace;',
      '  font-size: 1.05rem; outline: none;',
      '  transition: border-color .2s, background .2s, box-shadow .2s;',
      '}',
      '.fs-input::placeholder { color: var(--clr-text-faint, #334155); }',
      '.fs-input:focus {',
      '  border-color: var(--clr-accent, #3b82f6);',
      '  background: rgba(59,130,246,.06);',
      '  box-shadow: 0 0 0 3px rgba(59,130,246,.15);',
      '}',
      '.fs-input.fs-invalid {',
      '  border-color: var(--clr-danger, #f87171);',
      '  box-shadow: 0 0 0 3px rgba(248,113,113,.15);',
      '}',

      '.fs-feedback {',
      '  min-height: 1.3rem;',
      '  font-family: "IBM Plex Mono", monospace;',
      '  font-size: .82rem; margin-bottom: .85rem;',
      '  line-height: 1.4; transition: color .2s;',
      '}',

      '.fs-save-btn {',
      '  width: 100%; padding: .92rem 1.5rem;',
      '  background: linear-gradient(135deg, var(--clr-accent, #3b82f6), var(--clr-teal, #0ea5e9));',
      '  border: none; border-radius: 13px; color: #fff;',
      '  font-family: "Syne", sans-serif;',
      '  font-weight: 700; font-size: 1.05rem; cursor: pointer;',
      '  display: inline-flex; align-items: center;',
      '  justify-content: center; gap: .5rem;',
      '  transition: opacity .2s, transform .2s, box-shadow .2s;',
      '  box-shadow: 0 4px 20px rgba(59,130,246,.3);',
      '}',
      '.fs-save-btn:hover {',
      '  opacity: .88; transform: translateY(-2px);',
      '  box-shadow: 0 8px 30px rgba(59,130,246,.45);',
      '}',
      '.fs-save-btn:active { transform: translateY(0); opacity: 1; }',
      '.fs-save-btn:focus-visible {',
      '  outline: 3px solid #93c5fd; outline-offset: 3px;',
      '}',

      '.fs-card-footer {',
      '  margin-top: 1.1rem;',
      '  font-family: "IBM Plex Mono", monospace;',
      '  font-size: .76rem;',
      '  color: var(--clr-text-faint, #475569);',
      '  text-align: center; line-height: 1.7;',
      '}',
      '.fs-card-footer kbd {',
      '  display: inline-block;',
      '  background: rgba(255,255,255,.06);',
      '  border: 1px solid rgba(255,255,255,.12);',
      '  border-radius: 4px; padding: 0 5px;',
      '  font-family: inherit; font-size: .9em;',
      '  color: var(--clr-text-soft, #94a3b8);',
      '}',
      '[data-theme="light"] .fs-card-footer kbd {',
      '  background: rgba(0,0,0,.05);',
      '  border-color: rgba(0,0,0,.15);',
      '}',

      '@media (max-width: 480px) {',
      '  .fs-card { padding: 1.6rem 1.3rem; }',
      '  .fs-card-title { font-size: 1.05rem; }',
      '}'

    ].join('\n');

    document.head.appendChild(s);
  }

  function injectNavButton() {
    if (document.getElementById(NAV_WRAP_ID)) return;

    var navContent = document.getElementById('navContent');
    if (!navContent) return;

    var wrap = document.createElement('div');
    wrap.id  = NAV_WRAP_ID;

    var btn      = document.createElement('button');
    btn.id       = BTN_ID;
    btn.type     = 'button';
    btn.setAttribute('aria-label', 'Configurer la clé Formspree pour le formulaire de contact');
    btn.setAttribute('title',      'Config Formspree  ·  Ctrl + Shift + F');
    btn.innerHTML =
      '<i class="fas fa-paper-plane" aria-hidden="true"></i>' +
      '<span>Formspree</span>';

    btn.addEventListener('click', openModal);
    wrap.appendChild(btn);

    var themeWrap = navContent.querySelector('.ms-lg-3');
    if (themeWrap) {
      navContent.insertBefore(wrap, themeWrap);
    } else {
      navContent.appendChild(wrap);
    }

    refreshBtnState();
  }

  function injectModal() {
    if (document.getElementById(MODAL_ID)) return;

    var overlay = document.createElement('div');
    overlay.id  = MODAL_ID;
    overlay.setAttribute('role',            'dialog');
    overlay.setAttribute('aria-modal',      'true');
    overlay.setAttribute('aria-labelledby', 'fs-title');

    overlay.innerHTML =
      '<div class="fs-card" role="document">' +

        '<div class="fs-card-header">' +
          '<div class="fs-card-icon" aria-hidden="true">' +
            '<i class="fas fa-paper-plane"></i>' +
          '</div>' +
          '<div class="fs-card-meta">' +
            '<p class="fs-card-title" id="fs-title">Clé Formspree</p>' +
            '<p class="fs-card-sub">formspree.io · formulaire de contact</p>' +
          '</div>' +
          '<button class="fs-close-btn" id="fs-close" aria-label="Fermer">' +
            '<i class="fas fa-times" aria-hidden="true"></i>' +
          '</button>' +
        '</div>' +

        '<div class="fs-status fs-status-none" id="fs-status">' +
          '<span class="fs-status-dot" aria-hidden="true"></span>' +
          '<span id="fs-status-txt">Aucune clé configurée — formulaire inactif</span>' +
        '</div>' +

        '<label class="fs-field-label" for="fs-input">Identifiant Formspree</label>' +
        '<p class="fs-hint">' +
          'Copiez la clé depuis votre dashboard :<br>' +
          '<strong>formspree.io/f/<code id="fs-preview">xxxxxxxx</code></strong>' +
        '</p>' +
        '<div class="fs-input-wrap">' +
          '<span class="fs-prefix" aria-hidden="true">f/</span>' +
          '<input' +
          '  id="fs-input" class="fs-input" type="text"' +
          '  placeholder="xabcd1234" maxlength="20"' +
          '  autocomplete="off" autocorrect="off" spellcheck="false"' +
          '  aria-describedby="fs-fb"' +
          '/>' +
        '</div>' +
        '<div class="fs-feedback" id="fs-fb" role="status" aria-live="polite"></div>' +

        '<button class="fs-save-btn" id="fs-save" type="button">' +
          '<i class="fas fa-check" aria-hidden="true"></i>' +
          'Enregistrer et activer' +
        '</button>' +

        '<p class="fs-card-footer">' +
          'Sauvegardée en <kbd>localStorage</kbd> · active dès ce rechargement<br>' +
          'Rouvrir à tout moment : <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd>' +
        '</p>' +

      '</div>';

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    document.getElementById('fs-close').addEventListener('click', closeModal);
    document.getElementById('fs-save').addEventListener('click', saveKey);

    var input = document.getElementById('fs-input');

    input.addEventListener('input', function () {
      var v = input.value.trim();
      document.getElementById('fs-preview').textContent = v || 'xxxxxxxx';
      input.classList.remove('fs-invalid');
      setFeedback('', '');

      if (_autoTimer) { clearTimeout(_autoTimer); _autoTimer = null; }
      if (/^[A-Za-z0-9]{8,}$/.test(v)) {
        _autoTimer = setTimeout(function () { saveKey(true); }, 700);
      }
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') saveKey();
    });
  }

  function openModal() {
    var overlay = document.getElementById(MODAL_ID);
    if (!overlay) return;

    var saved = getKey();
    var input = document.getElementById('fs-input');
    if (input) {
      input.value = saved;
      document.getElementById('fs-preview').textContent = saved || 'xxxxxxxx';
    }

    setFeedback('', '');
    refreshStatusBand();
    overlay.classList.add('fs-open');
    document.body.style.overflow = 'hidden';

    setTimeout(function () {
      var inp = document.getElementById('fs-input');
      if (inp) { inp.focus(); if (saved) inp.select(); }
    }, 60);
  }

  function closeModal() {
    var overlay = document.getElementById(MODAL_ID);
    if (!overlay) return;
    overlay.classList.remove('fs-open');
    document.body.style.overflow = '';
    var btn = document.getElementById(BTN_ID);
    if (btn) btn.focus();
  }

  function saveKey(auto) {
    if (_autoTimer) { clearTimeout(_autoTimer); _autoTimer = null; }

    var input = document.getElementById('fs-input');
    var key   = input ? input.value.trim() : '';

    if (!key) {
      if (auto) return;                    /* mode auto : on ignore silencieusement */
      if (input) input.classList.add('fs-invalid');
      setFeedback('⚠ Saisissez une clé avant d\'enregistrer.', 'danger');
      if (input) input.focus();
      return;
    }
    if (key.length < 6) {
      if (auto) return;                    /* mode auto : on attend une clé complète */
      if (input) input.classList.add('fs-invalid');
      setFeedback('⚠ Clé trop courte — vérifiez sur formspree.io.', 'danger');
      if (input) input.focus();
      return;
    }

    setKey(key);
    patchFetch(key);
    if (input) input.classList.remove('fs-invalid');
    refreshStatusBand();
    refreshBtnState();
    setFeedback('✓ Clé active — le formulaire de contact est opérationnel.', 'success');

    setTimeout(closeModal, auto ? 850 : 1200);
  }

  function setFeedback(msg, type) {
    var el = document.getElementById('fs-fb');
    if (!el) return;
    el.textContent  = msg;
    el.style.color  = type === 'success' ? 'var(--clr-success, #34d399)'
                    : type === 'danger'  ? 'var(--clr-danger,  #f87171)'
                    :                      'transparent';
  }

  function refreshStatusBand() {
    var row  = document.getElementById('fs-status');
    var text = document.getElementById('fs-status-txt');
    if (!row || !text) return;
    var key = getKey();
    if (key) {
      row.classList.add('fs-status-ok');
      text.textContent = 'Clé active : f/' + key;
    } else {
      row.classList.remove('fs-status-ok');
      text.textContent = 'Aucune clé configurée — formulaire inactif';
    }
  }

  function refreshBtnState() {
    var btn = document.getElementById(BTN_ID);
    if (!btn) return;
    if (getKey()) btn.classList.add('fs-key-ok');
    else          btn.classList.remove('fs-key-ok');
  }

  function setupKeyboard() {
    document.addEventListener('keydown', function (e) {

      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        var overlay = document.getElementById(MODAL_ID);
        if (overlay && overlay.classList.contains('fs-open')) closeModal();
        else openModal();
        return;
      }

      if (e.key === 'Escape') {
        var overlay = document.getElementById(MODAL_ID);
        if (overlay && overlay.classList.contains('fs-open')) closeModal();
      }
    });
  }

  function setupFocusTrap() {
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var overlay = document.getElementById(MODAL_ID);
      if (!overlay || !overlay.classList.contains('fs-open')) return;

      var focusable = overlay.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      var first = focusable[0];
      var last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });
  }

  function init() {
    injectStyles();
    injectNavButton();
    injectModal();
    setupKeyboard();
    setupFocusTrap();

    if (!getKey()) {
      setTimeout(openModal, 900);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
