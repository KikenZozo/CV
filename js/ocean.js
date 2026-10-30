// Océan « Dark Hour » — fond WebGL plein écran.
// Une lune géante se reflète sur une mer nocturne ; en défilant, la caméra plonge sous la surface
// (caustiques et rais de lumière). Le pointeur crée des ondes, le mode clair bascule vers l'aube.
// Repli : sans WebGL, le canvas est retiré et le décor CSS reste visible.

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2  u_res;
uniform float u_time;
uniform float u_sink;   // 0 = au-dessus de la surface, 1 = immergé
uniform float u_depth;  // progression dans la page
uniform float u_light;  // 0 = nuit, 1 = aube
uniform vec2  u_mouse;  // 0..1, y vers le haut

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_time;

  vec3 skyTop = mix(vec3(0.010, 0.018, 0.065), vec3(0.78, 0.85, 0.97), u_light);
  vec3 skyHor = mix(vec3(0.050, 0.120, 0.420), vec3(0.99, 0.92, 0.88), u_light);
  vec3 sea    = mix(vec3(0.008, 0.030, 0.120), vec3(0.50, 0.66, 0.88), u_light);
  vec3 glow   = mix(vec3(0.450, 0.950, 1.000), vec3(1.00, 0.97, 0.90), u_light);
  vec3 deep   = mix(vec3(0.004, 0.010, 0.040), vec3(0.66, 0.77, 0.93), u_light);

  // ── Au-dessus de la surface ─────────────────────────────
  float hz = mix(0.36, 1.25, u_sink);
  // en portrait (mobile), la lune glisse au bord droit pour ne pas passer derrière le texte
  float portrait = step(aspect, 1.0);
  vec2 moon = vec2(aspect * mix(0.66, 0.95, portrait) + (u_mouse.x - 0.5) * 0.04,
                   hz + mix(0.43, 0.5, portrait) + (u_mouse.y - 0.5) * 0.02);
  vec3 above;

  if (uv.y > hz) {
    float h = clamp((uv.y - hz) / (1.0 - hz + 0.001), 0.0, 1.0);
    above = mix(skyHor, skyTop, pow(h, 0.55));

    // étoiles (nuit uniquement)
    vec2 sp = floor(p * 180.0);
    float star = step(0.9975, hash(sp)) * (0.5 + 0.5 * sin(t * 2.0 + hash(sp + 3.1) * 40.0));
    above += vec3(star) * (1.0 - u_light) * h;

    // lune : disque, cratères en fbm, double halo
    float d = length(p - moon);
    float r = 0.17;
    float disk = smoothstep(r, r - 0.004, d);
    float craters = fbm((p - moon) * 9.0) * 0.35 + fbm((p - moon) * 26.0) * 0.15;
    vec3 moonCol = mix(vec3(0.86, 0.97, 1.0), vec3(1.0, 0.98, 0.94), u_light) * (0.95 + craters * 0.45);
    above = mix(above, moonCol, disk);
    above += glow * (exp(-max(d - r, 0.0) * 4.0) * 0.55 + exp(-max(d - r, 0.0) * 16.0) * 0.5) * (1.0 - disk);
  } else {
    // mer : profondeur pseudo-perspective, houle en fbm, colonne de reflets de lune
    float dy = hz - uv.y;
    float z = 0.55 / (dy + 0.012);
    vec2 wp = vec2((p.x - moon.x) * z * 0.6, z + t * 0.32);
    float w = fbm(wp * vec2(1.3, 2.8));
    float spread = 0.06 + dy * 0.9;
    float column = exp(-pow((p.x - moon.x + (w - 0.5) * 0.12 * (dy * 4.0 + 0.2)) / spread, 2.0));
    float glint = smoothstep(0.58, 0.92, noise(vec2(wp.x * 7.0, wp.y * 12.0 - t * 0.6)));
    above = mix(skyHor * 0.45, sea, smoothstep(0.0, 0.35, dy));
    above += sea * (w - 0.5) * 0.5;
    above += glow * column * (0.25 + glint * 1.4) * mix(0.85, 0.45, portrait);
    above += skyHor * exp(-dy * 40.0) * 0.55;

    // ondes autour du pointeur
    vec2 m = vec2(u_mouse.x * aspect, u_mouse.y);
    float md = length((p - m) * vec2(1.0, 2.4));
    above += glow * sin(md * 70.0 - t * 5.0) * exp(-md * 7.0) * 0.05;
  }

  // ── Sous la surface ─────────────────────────────────────
  // caustiques douces : larges nappes de lumière plutôt que filaments
  vec2 cp = p * 1.4 + vec2(0.0, t * 0.03);
  float n1 = fbm(cp + t * 0.06);
  float n2 = fbm(cp * 1.3 - t * 0.05 + 4.0);
  float caustic = pow(max(1.0 - abs(n1 - n2) * 2.2, 0.0), 3.0);
  float rays = pow(noise(vec2(p.x * 3.5 + uv.y * 1.2 - t * 0.05, t * 0.08)), 3.0) * uv.y * uv.y;
  vec3 under = mix(deep, sea * 1.5, pow(uv.y, 1.4));
  under += glow * caustic * 0.07 * (0.25 + uv.y);
  under += glow * rays * 0.22;
  under *= 1.0 - u_depth * 0.45 * (1.0 - u_light);

  vec3 col = mix(above, under, smoothstep(0.45, 0.95, u_sink));

  // vignette + tramage anti-banding
  col *= 1.0 - 0.38 * length(uv - vec2(0.5, 0.55)) * (1.0 - u_light * 0.6);
  col += (hash(gl_FragCoord.xy + t) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

export function startOcean(canvas) {
  // failIfMajorPerformanceCaveat : refuse le rendu logiciel (pas de GPU) qui saturerait le processeur
  // ?ocean=force contourne ces garde-fous (tests sur machine sans GPU)
  const force = new URLSearchParams(location.search).get('ocean') === 'force';
  const gl = canvas.getContext('webgl', {
    antialias: false, alpha: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: !force,
  });
  if (!gl) { canvas.remove(); return; }
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '';
  if (!force && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) { canvas.remove(); return; }

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (err) {
    console.warn('Océan WebGL désactivé :', err.message);
    canvas.remove();
    return;
  }

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = Object.fromEntries(
    ['u_res', 'u_time', 'u_sink', 'u_depth', 'u_light', 'u_mouse'].map((n) => [n, gl.getUniformLocation(program, n)])
  );

  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Le fond est flou par nature : on le rend à résolution réduite, puis le navigateur l'étire.
  // La résolution s'adapte ensuite au temps de rendu mesuré (voir budget()).
  let scale = matchMedia('(pointer: coarse)').matches ? 0.35 : 0.5;

  const state = { sink: 0, depth: 0, light: root.dataset.theme === 'light' ? 1 : 0, mx: 0.5, my: 0.5, tx: 0.5, ty: 0.5 };

  function resize() {
    canvas.width = Math.max(1, Math.round(innerWidth * scale));
    canvas.height = Math.max(1, Math.round(innerHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  addEventListener('resize', resize, { passive: true });

  addEventListener('pointermove', (e) => {
    state.tx = e.clientX / innerWidth;
    state.ty = 1 - e.clientY / innerHeight;
  }, { passive: true });

  let running = true;
  let frozen = false;
  let frame = 0;
  const t0 = performance.now();

  // Budget de rendu : si les images dépassent ~24 ms en moyenne, on baisse la résolution ;
  // au plancher, on fige la scène (une image fixe au défilement) plutôt que de ramer.
  let last = 0, slow = 0, samples = 0;
  function budget(now) {
    if (last) {
      const dt = now - last;
      samples += 1;
      slow = slow * 0.9 + (dt > 24 ? 1 : 0) * 0.1;
      if (!force && samples > 30 && slow > 0.6) {
        samples = 0;
        slow = 0;
        if (scale > 0.2) { scale = Math.max(0.2, scale * 0.7); resize(); }
        else { freeze(); }
      }
    }
    last = now;
  }

  function freeze() {
    running = false;
    frozen = true;
    cancelAnimationFrame(frame);
    const once = () => requestAnimationFrame(draw);
    addEventListener('scroll', once, { passive: true });
    new MutationObserver(once).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  function draw(now) {
    if (running) budget(now);
    const max = Math.max(1, root.scrollHeight - innerHeight);
    const sinkTarget = Math.min(1, scrollY / (innerHeight * 0.95));
    const lightTarget = root.dataset.theme === 'light' ? 1 : 0;
    // Lissage : la caméra « glisse » au lieu de suivre la molette au pixel près (immédiat en mouvement réduit)
    const k = reduced.matches ? 1 : 0.08;
    state.sink += (sinkTarget - state.sink) * k;
    state.depth += (scrollY / max - state.depth) * k;
    state.light += (lightTarget - state.light) * (reduced.matches ? 1 : 0.06);
    state.mx += (state.tx - state.mx) * (reduced.matches ? 0 : 0.05);
    state.my += (state.ty - state.my) * (reduced.matches ? 0 : 0.05);

    gl.uniform2f(u.u_res, canvas.width, canvas.height);
    gl.uniform1f(u.u_time, reduced.matches ? 12 : (now - t0) / 1000);
    gl.uniform1f(u.u_sink, state.sink);
    gl.uniform1f(u.u_depth, state.depth);
    gl.uniform1f(u.u_light, state.light);
    gl.uniform2f(u.u_mouse, state.mx, state.my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!canvas.classList.contains('is-live')) {
      canvas.classList.add('is-live');
      // Une classe plutôt qu'un sélecteur :has() à la racine, réévalué à chaque mutation du DOM
      root.classList.add('ocean-live');
    }
    if (running) frame = requestAnimationFrame(draw);
  }

  // Pause quand l'onglet est masqué ; en mouvement réduit, on ne redessine qu'au défilement
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden && !reduced.matches && !frozen;
    cancelAnimationFrame(frame);
    if (running) frame = requestAnimationFrame(draw);
  });
  if (reduced.matches) {
    running = false;
    const once = () => requestAnimationFrame(draw);
    addEventListener('scroll', once, { passive: true });
    new MutationObserver(once).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  canvas.addEventListener('webglcontextlost', () => { running = false; canvas.remove(); });
  frame = requestAnimationFrame(draw);
}
