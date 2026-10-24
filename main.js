/* Custom cursor. Coordinates use math axes: origin at screen center, y goes up, 1 unit = 40px. */
(function () {
  if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var root = document.documentElement, $ = function (q) { return document.querySelector(q); };
  var ax = $('.cur-ax'), ay = $('.cur-ay'), xy = $('.cur-xy'), hl = $('.cur-svg .hl'), vl = $('.cur-svg .vl'), pt = $('.cur-svg .pt');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var x = -100, y = -100, rx = -100, ry = -100, seen = false;
  function fmt(v) { var r = Math.round(v * 10) / 10; return (r < 0 ? '−' : '') + Math.abs(r).toFixed(1); }
  function at(el, a, b, c, d) { el.setAttribute('x1', a); el.setAttribute('y1', b); el.setAttribute('x2', c); el.setAttribute('y2', d); }
  function put(el, t) { if (el.textContent !== t) el.textContent = t; }
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!seen) { seen = true; rx = x; ry = y; root.classList.add('has-cur'); }
    root.classList.remove('cur-off');
  }, { passive: true });
  document.addEventListener('pointerleave', function () { root.classList.add('cur-off'); });
  window.addEventListener('blur', function () { root.classList.add('cur-off'); });
  var last = performance.now();
  (function loop(now) {
    now = now || performance.now();
    var k = still ? 1 : 1 - Math.pow(0.8, Math.min(6, (now - last) / 16.7)); /* same trailing speed at any frame rate */
    last = now;
    rx += (x - rx) * k; ry += (y - ry) * k;
    var W = window.innerWidth, H = window.innerHeight, X = (x - W / 2) / 40, Y = (H / 2 - y) / 40;
    at(hl, 0, y, W, y); at(vl, x, 0, x, H);
    pt.setAttribute('cx', x); pt.setAttribute('cy', y);
    ax.style.left = x + 'px'; ay.style.top = y + 'px';
    put(ax, 'x = ' + fmt(X)); put(ay, 'y = ' + fmt(Y));
    var th = Math.atan2(Y, X) * 180 / Math.PI; if (th < 0) th += 360;
    put(xy, 'r ' + fmt(Math.sqrt(X * X + Y * Y)) + ' · θ ' + Math.round(th) + '°');
    var flip = x > W - 160;
    xy.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)' + (flip ? ' translateX(calc(-100% - 36px))' : '');
    requestAnimationFrame(loop);
  })();
})();

(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.innerWidth < 720;

  /* Subjects in learning order. status: 'open' = in progress now, 'tbd' = coming later.
     Colors are deliberately unpredictable: a shuffled mix of neon and bright hues, with every neighbor
     far apart on the color wheel so each stop is a surprise. tone: 'neon' = full strength, 'bright' = a touch softer.
     Calculus 3 keeps its sky blue (#A9DCFF). */
  var SUBJECTS = [
    { id: 'intro', name: 'OpenCurve', group: '', status: 'intro', hue: 225, label: 'Torus knot (2, 3)', form: 'knot' },
    { id: 'pre-algebra', name: 'Pre-Algebra', desc: 'Numbers, ratios, and your first variables.', group: 'Foundations', status: 'tbd', hue: 355, tone: 'neon', label: 'The number line, wound into a spiral', form: 'stairs' },
    { id: 'algebra-1', name: 'Algebra 1', desc: 'Solve for x. Lines, slopes, and equations.', group: 'High school', status: 'open', hue: 160, tone: 'bright', label: 'Hyperboloid  x² + z² − y²/14 = c', form: 'hyperboloid' },
    { id: 'geometry', name: 'Geometry', desc: 'Shapes, angles, and why proofs work.', group: 'High school', status: 'tbd', hue: 40, tone: 'neon', label: 'Geodesic sphere', form: 'solids' },
    { id: 'algebra-2', name: 'Algebra 2', desc: 'Polynomials, exponents, and the functions behind them.', group: 'High school', status: 'open', hue: 210, tone: 'neon', label: 'The parabola y = x², spun into a dish', form: 'saddle' },
    { id: 'trigonometry', name: 'Trigonometry', desc: 'Triangles and circles, told through sine and cosine.', group: 'High school', status: 'tbd', hue: 95, tone: 'neon', label: 'Sine wrapped on a circle  y = sin 5θ', form: 'helix' },
    { id: 'pre-calculus', name: 'Pre-Calculus', desc: 'Functions in depth. Everything calculus will ask of you.', group: 'High school', status: 'open', hue: 300, tone: 'neon', label: 'Ripple  z = cos(r) / r', form: 'ripple' },
    { id: 'statistics', name: 'Statistics', desc: 'Reading data, spotting patterns, measuring spread.', group: 'High school', status: 'tbd', hue: 15, tone: 'neon', label: 'Bivariate normal distribution', form: 'bell' },
    { id: 'probability', name: 'Probability', desc: 'How likely is it? Chance, counted carefully.', group: 'College', status: 'tbd', hue: 120, tone: 'neon', label: 'Branching random walks', form: 'walks' },
    { id: 'calculus-1', name: 'Calculus 1', desc: 'Limits and derivatives. The math of change.', group: 'College', status: 'tbd', hue: 260, tone: 'neon', label: 'Tangent lines of y = x², swept into a surface', form: 'tangents' },
    { id: 'calculus-2', name: 'Calculus 2', desc: 'Integrals and series. Adding up the infinite.', group: 'College', status: 'tbd', hue: 320, tone: 'neon', label: 'Double cone  x² + z² = y²', form: 'revolve' },
    { id: 'linear-algebra', name: 'Linear Algebra', desc: 'Vectors and matrices. How space stretches and turns.', group: 'College', status: 'tbd', hue: 45, tone: 'neon', label: 'Planes under a shear', form: 'lattice' },
    { id: 'calculus-3', name: 'Calculus 3', desc: 'Calculus in three dimensions.', group: 'College', status: 'tbd', hue: 205, tone: 'bright', label: 'z = sin x · cos y', form: 'wave', fixed: '#A9DCFF' },
    { id: 'differential-equations', name: 'Differential Equations', desc: 'Equations that describe motion, growth, and decay.', group: 'College', status: 'tbd', hue: 130, tone: 'neon', label: 'Lorenz system', form: 'lorenz' },
    { id: 'discrete-math', name: 'Discrete Math', desc: 'Logic, counting, and graphs. The math of computers.', group: 'College', status: 'tbd', hue: 275, tone: 'neon', light: 0.9, label: 'Sierpinski pyramid: one shape, split into four, forever', form: 'graph' },
    { id: 'number-theory', name: 'Number Theory', desc: 'Primes, divisibility, and the patterns hiding in integers.', group: 'Advanced', status: 'tbd', hue: 342, tone: 'neon', label: 'Times tables on a clock  n → kn (mod 120)', form: 'primes' },
    { id: 'real-analysis', name: 'Real Analysis', desc: 'Why calculus works, proven from the ground up.', group: 'Advanced', status: 'tbd', hue: 185, tone: 'neon', label: 'A sequence converging to its limit', form: 'converge' },
    { id: 'abstract-algebra', name: 'Abstract Algebra', desc: 'Symmetry and structure: groups, rings, fields.', group: 'Advanced', status: 'tbd', hue: 28, tone: 'neon', label: 'Symmetry group of the hexagon', form: 'dihedral' },
    { id: 'complex-analysis', name: 'Complex Analysis', desc: 'Calculus with imaginary numbers.', group: 'Advanced', status: 'tbd', hue: 235, tone: 'neon', label: 'Conformal map  w = z²', form: 'conformal' },
    { id: 'topology', name: 'Topology', desc: 'Shapes that stretch but never tear.', group: 'Advanced', status: 'tbd', hue: 110, tone: 'bright', label: 'Möbius strip: one side, one edge', form: 'mobius' }
  ];
  var LAST = SUBJECTS.length - 1;
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* Build tabs and chapters from the list */
  var ixList = document.getElementById('ixList'), main = document.getElementById('chapters');
  var CALC1 = SUBJECTS.map(function (x) { return x.id; }).indexOf('calculus-1');
  SUBJECTS.forEach(function (s, i) {
    if (i === 0) return;
    var li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.dataset.go = i;
    var n = document.createElement('span'); n.className = 'n'; n.textContent = pad(i);
    var nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = s.name;
    var ds = document.createElement('span'); ds.className = 'ds'; ds.textContent = s.desc || '';
    b.appendChild(n); b.appendChild(nm); b.appendChild(ds);
    var later = i > CALC1;
    var tg = document.createElement('span'); tg.className = 'tg'; if (later) tg.textContent = 'Soon'; b.appendChild(tg);   /* everything after Calculus 1 is still coming */
    li.style.setProperty('--i', i); li.appendChild(b); ixList.appendChild(li);

    var sec = document.createElement('section');
    sec.className = 'chapter'; sec.id = s.id;
    var inner = document.createElement('div'); inner.className = 'chapter-inner';
    var h = document.createElement('h2'); h.textContent = s.name;
    var row = document.createElement('div'); row.className = 'row';
    var p = document.createElement('p'); p.className = 'sub'; p.textContent = s.desc || '';
    row.appendChild(p);
    if (!later) {
      var a = document.createElement('a'); a.className = 'cta'; a.href = '#' + s.id; a.textContent = 'View topics';
      row.appendChild(a);
    } else {
      var sn = document.createElement('span'); sn.className = 'cta soon'; sn.textContent = 'Soon';
      row.appendChild(sn);
    }
    inner.appendChild(h); inner.appendChild(row);
    var nx = SUBJECTS[i + 1] || SUBJECTS[1];
    if (nx) {
      var nu = document.createElement('a'); nu.className = 'next'; nu.href = '#' + (SUBJECTS[i + 1] ? nx.id : 'loop');
      nu.innerHTML = '<span class="next-k">Next up</span><span class="next-n"></span><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 2v11M3 8.5 8 13.5 13 8.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      nu.querySelector('.next-n').textContent = nx.name;
      nu.setAttribute('aria-label', 'Next up: ' + nx.name);
      inner.appendChild(nu);
    }
    sec.appendChild(inner); main.appendChild(sec);
  });
  /* Loop: a copy of Pre-Algebra after Topology. Landing on it jumps you back to the real Pre-Algebra, so the subjects never end. */
  var loopSec = document.getElementById('pre-algebra').cloneNode(true);
  loopSec.id = 'loop'; loopSec.setAttribute('aria-hidden', 'true'); loopSec.inert = true;
  main.appendChild(loopSec);
  /* Intro beats sit between the cover and Pre-Algebra. They are chapters you scroll through, but the camera
     doesn't travel during them: the cover knot opens up and changes shape in place instead. */
  var BEATS = [
    { id: 'center', label: 'Torus knot (2, 3)' },
    { id: 'loosen', label: 'The knot, loosening' },
    { id: 'ring', label: 'Unwound into a ring' },
    { id: 'flat', label: 'The ring, lying flat' },
    { id: 'unroll', label: 'The ring, unrolling' },
    { id: 'sheet', label: 'One open sheet' },
    { id: 'idea', label: 'The sheet, twisted' },
    { id: 'open', label: 'A folded sheet, opening' },
    { id: 'look', label: 'A rolling wave  z = sin(x − t)' },
    { id: 'project', label: 'A long, slow wave' },
    { id: 'coil', label: 'The sheet, starting to coil' },
    { id: 'begin', label: 'The number line, wound into a spiral' }
  ];
  BEATS.forEach(function (b, i) { b.beat = i + 1; });
  var K = BEATS.length;
  SUBJECTS.forEach(function (s, i) { s.t = i; });   /* t = how far the camera has traveled to reach it */
  BEATS.forEach(function (b) { b.t = 0; });
  var LOOP = { id: 'loop', form: SUBJECTS[1].form, t: LAST + 1, copyOf: SUBJECTS[1] };
  var STATIONS = [SUBJECTS[0]].concat(BEATS, SUBJECTS.slice(1), [LOOP]), SL = STATIONS.length - 1;
  /* chapter number -> what the HUD should show: subject index (0 = cover/intro) and whether it's a beat */
  function info(c) {
    if (c >= SL) return { n: 1 };
    if (c === 0) return { n: 0 };
    if (c <= K) return { n: 0, beat: BEATS[c - 1] };
    return { n: c - K };
  }
  var tabs = Array.prototype.slice.call(ixList.querySelectorAll('button'));
  var picker = document.getElementById('picker'), menu = document.getElementById('menu'), pickerLabel = document.getElementById('pickerLabel'), pickerNum = document.getElementById('pickerNum'), pickerBar = document.getElementById('pickerBar');
  function openMenu() {
    menu.hidden = false; picker.setAttribute('aria-expanded', 'true'); document.documentElement.classList.add('menu-open');
    var cur = ixList.querySelector('[aria-current="true"]') || tabs[0];
    tabs.forEach(function (b) { b.style.setProperty('--c', SUBJECTS[+b.dataset.go].css); b.parentNode.style.setProperty('--c', SUBJECTS[+b.dataset.go].css); });
    ixShow(+cur.dataset.go); cur.focus({ preventScroll: true });
  }
  function closeMenu(returnFocus) {
    menu.hidden = true; picker.setAttribute('aria-expanded', 'false'); document.documentElement.classList.remove('menu-open');
    if (returnFocus) picker.focus();
  }
  picker.addEventListener('click', function () { if (menu.hidden) openMenu(); else closeMenu(true); });
  document.getElementById('menuClose').addEventListener('click', function () { closeMenu(true); });
  menu.addEventListener('click', function (e) { if (e.target === menu) closeMenu(true); });
  document.addEventListener('keydown', function (e) {
    if (menu.hidden) return;
    if (e.key === 'Escape') { closeMenu(true); return; }
    if (e.key === 'Tab') { /* keep focus inside the open menu */
      var f = menu.querySelectorAll('button, a[href]'), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  function ixShow(i) {}
  tabs.forEach(function (b) {
    var show = function () { ixShow(+b.dataset.go); };
    b.addEventListener('mouseenter', show); b.addEventListener('focus', show);
    b.addEventListener('click', function () {
      closeMenu(false);
      var el = document.getElementById(SUBJECTS[+b.dataset.go].id);
      if (stepReady) { pending = 0; glideTo(el, performance.now()); } else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  var eqEl = document.getElementById('eq'), countEl = document.getElementById('count');
  function goTo(i) {
    i = Math.max(0, Math.min(SL, i));
    main.children[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }
  /* Where we are, measured from each chapter's real top (chapters can differ in height) */
  function docTop(el) { return el.getBoundingClientRect().top + window.scrollY; }   /* where an element starts on the page, measured from the very top */
  function chapterPos() {
    var secs = main.children, y = window.scrollY, n = secs.length;   /* every position is the element's true place on the page, so no wrapper or offset can throw the camera off */
    for (var i = 0; i < n - 1; i++) {
      var a = docTop(secs[i]), b = docTop(secs[i + 1]);
      if (y < b) return i + Math.max(0, Math.min(1, (y - a) / ((b - a) || 1)));
    }
    return n - 1;
  }
  function currentIndex() { return Math.round(chapterPos()); }
  var beatSecs = Array.prototype.slice.call(main.querySelectorAll('.beat'));
  function syncMark() {
    var cp = chapterPos(), cur = main.children[Math.round(cp)];
    document.documentElement.classList.toggle('on-cover', cp < 0.5);
    beatSecs.forEach(function (sec) { sec.classList.toggle('on', sec === cur); });   /* the intro's words fade up when their screen arrives */
  }
  window.addEventListener('scroll', syncMark, { passive: true });
  syncMark();
  var stepReady = false;   /* once the 3D scene is up, ↑ ↓ go through the one-step-at-a-time system further down */
  document.getElementById('prev').addEventListener('click', function () { if (!stepReady) goTo(currentIndex() - 1); });
  document.getElementById('next').addEventListener('click', function () { if (!stepReady) goTo(currentIndex() + 1); });

  if (typeof THREE === 'undefined') { if (window.ssReady) ssReady(); return; }

  /* Same brightness for every hue, so warm colors (yellow, orange) don't flood the screen */
  function evenOut(c, target) {
    var L = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    if (L > target) c.multiplyScalar(target / L);
  }
  /* Soft pastel light per subject */
  SUBJECTS.forEach(function (s, i) {
    var core = new THREE.Color(), deep = new THREE.Color(), sky = new THREE.Color();
    if (s.id === 'intro') { core.set('#E4E8F0'); deep.set('#23283A'); sky.set('#1E2436'); }
    else if (s.fixed) { core.set(s.fixed); deep.set('#0B2E52'); sky.set('#0C2A4A'); }
    else {
      var neon = s.tone === 'neon';
      core.setHSL(s.hue / 360, neon ? 0.82 : 0.68, s.light || (neon ? 0.6 : 0.68)); /* light: optional per-subject lift for colors that read dark, like purple */
      deep.setHSL(s.hue / 360, neon ? 0.8 : 0.62, s.light ? 0.45 : 0.14);
      sky.setHSL(s.hue / 360, 0.5, 0.09); evenOut(sky, 0.06);
    }
    if (i <= 5) evenOut(sky.set('#0B0C12'), 0.012); /* first six stations: plain dark sky, no colored glow */
    s.core = core; s.deep = deep; s.sky = sky; s.css = '#' + core.getHexString();
    if (i > 0 && tabs[i - 1]) tabs[i - 1].style.setProperty('--c', s.css);
  });
  BEATS.forEach(function (b) { b.core = SUBJECTS[0].core; b.deep = SUBJECTS[0].deep; b.sky = SUBJECTS[0].sky; b.css = SUBJECTS[0].css; });
  LOOP.core = SUBJECTS[1].core; LOOP.deep = SUBJECTS[1].deep; LOOP.sky = SUBJECTS[1].sky; LOOP.css = SUBJECTS[1].css;

  var GAP = 60;
  var renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  var scene = new THREE.Scene();
  var fogColor = new THREE.Color('#04050A');
  scene.fog = new THREE.FogExp2(fogColor, 0.022);
  renderer.setClearColor(fogColor, 1);
  var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 500);

  var composer = null, bloom = null;
  try {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloom = new THREE.UnrealBloomPass(new THREE.Vector2(1, 1), 1.05, 0.75, 0.06);
    composer.addPass(bloom);
  } catch (e) { composer = null; }

  var skyU = { uHorizon: { value: SUBJECTS[0].sky.clone() } };
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: skyU,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uHorizon; varying vec3 vP; void main(){ float h = vP.y; float band = exp(-pow((h + 0.01) * 8.0, 2.0)); vec3 c = uHorizon * band * 0.7; c += uHorizon * 0.08 * (1.0 - smoothstep(-0.05, 0.5, h)); gl_FragColor = vec4(c, 1.0); }'
  })));

  var gridU = { uTint: { value: new THREE.Color('#B4BCCD') } }; /* floor grid: one fixed soft gray on every subject */
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 2400), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: gridU, extensions: { derivatives: true },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform vec3 uTint; varying vec3 vW; float line(float v, float s){ float g = abs(fract(v / s - 0.5) - 0.5) / fwidth(v / s); return 1.0 - min(g, 1.0); } void main(){ float d = length(vW.xz - cameraPosition.xz); float fade = exp(-d * 0.03); float g = max(line(vW.x, 4.0), line(vW.z, 4.0)); gl_FragColor = vec4(uTint * g * 0.44, g * fade * 0.66); }'
  }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -3, -GAP * (LAST + 1) / 2);
  scene.add(ground);

  /* ---------- line builders ---------- */
  var q = small ? 0.6 : 1;
  var V = function (x, y, z) { return new THREE.Vector3(x, y, z); };
  function seg(out, a, b) { out.push(a.x, a.y, a.z, b.x, b.y, b.z); }
  function isoLines(fn, nu, nv, stepsU, stepsV) {
    var out = [], a = new THREE.Vector3(), b = new THREE.Vector3(), i, j;
    for (j = 0; j <= nv; j++) for (i = 0; i < stepsU; i++) { fn(i / stepsU, j / nv, a); fn((i + 1) / stepsU, j / nv, b); seg(out, a, b); }
    for (i = 0; i < nu; i++) for (j = 0; j < stepsV; j++) { fn(i / nu, j / stepsV, a); fn(i / nu, (j + 1) / stepsV, b); seg(out, a, b); }
    return out;
  }
  function edgesOf(geo, out, offset) {
    var e = new THREE.EdgesGeometry(geo).attributes.position.array;
    for (var i = 0; i < e.length; i += 3) out.push(e[i] + (offset ? offset.x : 0), e[i + 1] + (offset ? offset.y : 0), e[i + 2] + (offset ? offset.z : 0));
  }
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function polyline(out, pts) { for (var i = 1; i < pts.length; i++) seg(out, pts[i - 1], pts[i]); }

  var BUILD = {
    knot: function () {
      return isoLines(function (u, v, t) {
        var s = u * Math.PI * 2;
        function c(x) { var r = 2 + Math.cos(3 * x); return V(r * Math.cos(2 * x), Math.sin(3 * x) * 1.2, r * Math.sin(2 * x)); }
        var p = c(s), T = c(s + 0.001).sub(p).normalize(), N = V(0, 1, 0).cross(T).normalize(), B = T.clone().cross(N), a = v * Math.PI * 2;
        t.copy(p).addScaledVector(N, Math.cos(a) * 0.55).addScaledVector(B, Math.sin(a) * 0.55).multiplyScalar(3.4);
      }, Math.round(160 * q), 10, Math.round(360 * q), 18);
    },
    stairs: function () {
      /* The number line, wound into a spiral ramp: going around climbs through the numbers.
         Negatives coil below zero, positives above; the spokes are the whole numbers */
      return isoLines(function (u, v, t) {
        var th = (u - 0.5) * Math.PI * 2 * 2.5, r = 2.2 + v * 6;
        t.set(r * Math.cos(th), th * 1.15, r * Math.sin(th));
      }, Math.round(60 * q), Math.round(10 * q), 320, 40);
    },
    hyperboloid: function () {
      return isoLines(function (u, v, t) {
        var a = u * Math.PI * 2, y = (v - 0.5) * 13, r = 4.2 * Math.sqrt(1 + (y * y) / 14);
        t.set(r * Math.cos(a), y, r * Math.sin(a));
      }, Math.round(72 * q), Math.round(28 * q), 160, 60);
    },
    solids: function () {
      var out = [];
      edgesOf(new THREE.IcosahedronGeometry(7.5, small ? 2 : 3), out);
      return out;
    },
    saddle: function () {
      /* The parabola y = x², spun around its axis into a dish (a paraboloid) */
      return isoLines(function (u, v, t) {
        var a = u * Math.PI * 2, r = v * 7.5;
        t.set(r * Math.cos(a), r * r * 0.17, r * Math.sin(a));
      }, Math.round(56 * q), Math.round(26 * q), 160, 60);
    },
    helix: function () {
      /* A ribbon ring that rises and falls 5 times as it goes around: y = sin 5θ */
      return isoLines(function (u, v, t) {
        var a = u * Math.PI * 2, r = 8 + (v - 0.5) * 5, y = 2.8 * Math.sin(5 * a) + (v - 0.5) * 1.2 * Math.cos(5 * a);
        t.set(r * Math.cos(a), y, r * Math.sin(a));
      }, Math.round(150 * q), 14, 400, 30);
    },
    ripple: function () {
      return isoLines(function (u, v, t) {
        var r = 0.4 + v * 14, a = u * Math.PI * 2;
        t.set(r * Math.cos(a), 4.2 * Math.sin(r * 0.9) / (r * 0.35 + 1), r * Math.sin(a));
      }, Math.round(72 * q), Math.round(36 * q), 160, 60);
    },
    bell: function () {
      return isoLines(function (u, v, t) {
        var x = (u - 0.5) * 24, z = (v - 0.5) * 24;
        t.set(x, 9 * Math.exp(-(x * x + z * z) / 40) - 2, z);
      }, Math.round(40 * q), Math.round(40 * q), 100, 100);
    },
    walks: function () {
      /* Branching random walks: every path wanders forward, then splits in two, again and again.
         Each wobble is random; the overall spread stays inside a soft cone so the whole tree fits on screen. */
      var out = [], depth = small ? 6 : 7, len = 26, stepX = 0.11;
      function grow(p, vy, vz, level) {
        var pts = [p.clone()];
        for (var s = 0; s < len; s++) {
          vy = vy * 0.94 + (rnd() - 0.5) * 0.035; vz = vz * 0.94 + (rnd() - 0.5) * 0.035;
          p = p.clone(); p.x += stepX; p.y += vy; p.z += vz;
          var env = 0.35 + (p.x + 10) * 0.32, r = Math.sqrt(p.y * p.y + p.z * p.z);
          if (r > env) { p.y *= env / r; p.z *= env / r; vy *= 0.5; vz *= 0.5; }
          pts.push(p);
        }
        polyline(out, pts);
        if (level < depth) {
          var a = rnd() * Math.PI * 2, kick = 0.13;
          grow(p, vy + Math.cos(a) * kick, vz + Math.sin(a) * kick, level + 1);
          grow(p, vy - Math.cos(a) * kick, vz - Math.sin(a) * kick, level + 1);
        }
      }
      for (var k = 0; k < 3; k++) grow(V(-10, 0, 0), (rnd() - 0.5) * 0.1, (rnd() - 0.5) * 0.1, 1);
      return out;
    },
    tangents: function () {
      /* Every tangent line of y = x², each slid back a step, so together they weave one smooth surface */
      return isoLines(function (u, v, t) {
        var a = (u - 0.5) * 6, s = (v - 0.5) * 5;
        t.set((a + s) * 1.4, (a * a + 2 * a * s) * 0.32, a * 2.2);
      }, Math.round(46 * q), Math.round(26 * q), 120, 120);
    },
    revolve: function () {
      /* Double cone: two cones tip to tip, the surface conic sections are cut from */
      return isoLines(function (u, v, t) {
        var a = u * Math.PI * 2, y = (v - 0.5) * 15;
        t.set(Math.abs(y) * Math.cos(a), y, Math.abs(y) * Math.sin(a));
      }, Math.round(56 * q), Math.round(30 * q), 160, 60);
    },
    wave: function () {
      return isoLines(function (u, v, t) {
        var x = (u - 0.5) * 26, z = (v - 0.5) * 26;
        t.set(x, 2.6 * Math.sin(x * 0.35) * Math.cos(z * 0.35), z);
      }, Math.round(44 * q), Math.round(44 * q), 120, 120);
    },
    lattice: function () {
      var out = [];
      for (var L = 0; L < 4; L++) {
        var k = L / 3, M = new THREE.Matrix3().set(1, 0.5 * k, 0, 0.18 * k, 1, 0.3 * k, 0, 0.12 * k, 1);
        out = out.concat(isoLines(function (u, v, t) {
          t.set((u - 0.5) * 22, -2 + L * 2.6, (v - 0.5) * 22).applyMatrix3(M);
        }, Math.round(22 * q), Math.round(22 * q), 60, 60));
      }
      return out;
    },
    lorenz: function () {
      var out = [], x = 0.1, y = 0, z = 0, dt = 0.006, steps = Math.round(9000 * q), s = 0.42, prev = null;
      for (var i = 0; i < steps; i++) {
        var dx = 10 * (y - x), dy = x * (28 - z) - y, dz = x * y - (8 / 3) * z;
        x += dx * dt; y += dy * dt; z += dz * dt;
        if (i < 200) continue;
        var p = V(x * s, (z - 25) * s, y * s);
        if (prev) seg(out, prev, p);
        prev = p;
      }
      return out;
    },
    graph: function () {
      /* Sierpinski pyramid: a tetrahedron split into 4 half-size copies, again and again (recursion).
         Its layers match Pascal's triangle with the odd numbers kept, a counting pattern from discrete math */
      var out = [], depth = small ? 3 : 4, S = 9;
      var top = V(0, S * 0.82, 0), b1 = V(S, -S * 0.4, 0), b2 = V(-S / 2, -S * 0.4, S * 0.866), b3 = V(-S / 2, -S * 0.4, -S * 0.866);
      function mid(p, q) { return p.clone().add(q).multiplyScalar(0.5); }
      function tet(a, b, c, d, n) {
        if (n === 0) { seg(out, a, b); seg(out, a, c); seg(out, a, d); seg(out, b, c); seg(out, c, d); seg(out, d, b); return; }
        var ab = mid(a, b), ac = mid(a, c), ad = mid(a, d), bc = mid(b, c), cd = mid(c, d), db = mid(d, b);
        tet(a, ab, ac, ad, n - 1); tet(ab, b, bc, db, n - 1); tet(ac, bc, c, cd, n - 1); tet(ad, db, cd, d, n - 1);
      }
      tet(top, b1, b2, b3, depth);
      return out;
    },
    primes: function () {
      /* Times tables on a clock: 120 points on a circle, each n joined to k·n (mod 120).
         Three stacked layers use k = 2, 3, 5 — the chords draw a cardioid, a nephroid, and a four-petal curve */
      var out = [], N = small ? 90 : 120, R = 8, ks = [2, 3, 5];
      ks.forEach(function (k, li) {
        var y = (li - 1) * 6;
        function P(n) { var a = (n % N) / N * Math.PI * 2; return V(R * Math.cos(a), y, R * Math.sin(a)); }
        var ring = []; for (var i = 0; i <= 96; i++) { var t = i / 96 * Math.PI * 2; ring.push(V(R * Math.cos(t), y, R * Math.sin(t))); }
        polyline(out, ring);
        for (var n = 1; n < N; n++) seg(out, P(n), P(k * n));
      });
      return out;
    },
    converge: function () {
      var out = [];
      for (var s = 0; s < 6; s++) {
        var pts = [], off = (s / 6) * Math.PI * 2;
        for (var i = 0; i <= 500; i++) {
          var t = i / 500 * 24, r = 9 * Math.exp(-t * 0.14);
          pts.push(V(r * Math.cos(t + off), -3 + 12 * Math.exp(-t * 0.1), r * Math.sin(t + off)));
        }
        polyline(out, pts);
      }
      return out;
    },
    dihedral: function () {
      var out = [], K = 12, R = 8;
      for (var k = 0; k < K; k++) {
        var c = (k / K) * Math.PI * 2, center = V(R * Math.cos(c), 3, R * Math.sin(c)), pts = [];
        for (var j = 0; j <= 6; j++) {
          var a = (j / 6) * Math.PI * 2 + k * (Math.PI / 6) * 0.5;
          var local = V(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 0).applyAxisAngle(V(0, 1, 0), -c + Math.PI / 2);
          pts.push(center.clone().add(local));
        }
        polyline(out, pts);
      }
      return out;
    },
    conformal: function () {
      return isoLines(function (u, v, t) {
        var x = (u - 0.5) * 2 * 3.4, y = (v - 0.5) * 2 * 3.4, wr = x * x - y * y, wi = 2 * x * y;
        t.set(wr * 0.75, Math.sqrt(x * x + y * y) * 1.1 - 2, wi * 0.75);
      }, Math.round(30 * q), Math.round(30 * q), 120, 120);
    },
    mobius: function () {
      return isoLines(function (u, v, t) {
        var a = u * Math.PI * 2, w = (v - 0.5) * 5, R = 7;
        t.set((R + w * Math.cos(a / 2)) * Math.cos(a), w * Math.sin(a / 2) + 3, (R + w * Math.cos(a / 2)) * Math.sin(a));
      }, Math.round(120 * q), 12, 300, 40);
    }
  };
  var PLACE = {
    knot: [7, 6.5, 0, 0.35, 0, 0.1], stairs: [14.5, 4.2, -6, 0.3, 0, 0.12], hyperboloid: [12.5, 4.6, -4, 0.15, 0, 0.08],
    solids: [11.5, 4.5, -4, 0.3, 0, 0.2], saddle: [10, 3.4, -6, 0.38, 0, 0.22], helix: [13.5, 6, -6, 0.55, 0, -0.1],
    ripple: [12.5, 4, -6, 0.3, 0, -0.1], bell: [11.5, 3.8, -4, 0.15, 0.4, 0], walks: [10.5, 4, -6, 0.15, 0.55, 0],
    tangents: [10.5, 4, -6, 0.3, 0.55, 0], revolve: [13.5, 4.6, -4, 0.1, 0, 0.1], wave: [9.5, 4, -8, 0.1, 0.5, 0],
    lattice: [11.5, 5.5, -10, 0.5, 0.5, 0], lorenz: [13.5, 4.5, -8, 0.2, 0, 0], graph: [16, 5.4, -6, 0.15, 0.4, 0],
    primes: [13.5, 5, -6, 0.68, 0, 0.22], converge: [9.5, 3.4, -3, 0.2, 0, 0.1], dihedral: [12.5, 5, -6, 0.3, 0, 0.08],
    conformal: [12, 5, -8, 0.2, -0.4, 0], mobius: [9.5, 5.2, -5, 0.4, 0, 0.12]
  };

  var LIFT = { lattice: 2.5 }; /* per-model height nudge */
  var TUNE = { primes: 0.838, saddle: 0.918, ripple: 1.14, stairs: 1.232, tangents: 0.902, walks: 1.505, conformal: 1.904, lattice: 1.03, dihedral: 0.896, hyperboloid: 0.952, helix: 1.008, revolve: 1.064, converge: 0.952, mobius: 0.8, lorenz: 1.254, solids: 1.12, bell: 1.12, graph: 0.95 };
  var ANCHOR = small ? V(6.5, 5.5, -4) : V(8.5, 4.2, -4), SIZE = small ? 20 : 25;
  function linesMesh(pts, s, opacity) {
    var geo = new THREE.BufferGeometry(), pos = new Float32Array(pts), col = new Float32Array(pts.length);
    var minY = Infinity, maxY = -Infinity;
    for (var i = 1; i < pts.length; i += 3) { if (pts[i] < minY) minY = pts[i]; if (pts[i] > maxY) maxY = pts[i]; }
    var tmp = new THREE.Color();
    for (var k = 0; k < pts.length; k += 3) {
      var c = (pts[k + 1] - minY) / ((maxY - minY) || 1);
      tmp.copy(s.deep).lerp(s.core, 0.25 + 0.75 * c);
      col[k] = tmp.r; col[k + 1] = tmp.g; col[k + 2] = tmp.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  }

  var forms = STATIONS.map(function (s, i) {
    if (s.beat) return null;   /* beats have no model of their own; the intro curve below plays across them */
    var m = linesMesh(BUILD[s.form](), s, 0.75), pl = PLACE[s.form];
    /* Even sizing, hand placement: every model is scaled to a matching size (so none look tiny or huge),
       but sits at its own hand-picked spot instead of all being centered on one point */
    if (s.id !== 'intro') {
      var g = m.geometry, box = new THREE.Box3(), c = new THREE.Vector3(), sz = new THREE.Vector3();
      g.computeBoundingBox(); box.copy(g.boundingBox); box.getCenter(c); box.getSize(sz);
      var k = Math.min(SIZE / Math.max(sz.x, sz.z), (SIZE * 0.62) / sz.y) * (TUNE[s.form] || 1);
      g.translate(-c.x, -c.y, -c.z); g.scale(k, k, k);
      m.userData.c = c.clone(); m.userData.k = k;
    }
    m.position.set(pl[0], pl[1] + (LIFT[s.form] || 0), pl[2] - s.t * GAP);
    m.rotation.set(pl[3], pl[4], pl[5]);
    m.userData.ry = pl[4];
    scene.add(m);
    return m;
  });

  /* ---------- Intro surface ----------
     After the cover, the cover's own knot carries the intro. It glides to the middle of the screen, relaxes into a
     ring and flattens into a flat grid, then keeps reshaping in the usual right-hand spot (a twist, a curved sheet with
     an accordion fold, a rolling wave) and finally winds into Pre-Algebra's spiral. It is always the same grid of
     lines, so every change is a smooth morph, never a cut. That grid matches Pre-Algebra's model line for line, so the
     last step simply becomes it. */
  var PRE = forms[K + 1], PLS = PLACE[SUBJECTS[1].form], PLK = PLACE.knot;
  var B_LOOK = 9;   /* the screen where the model tilts with the mouse */
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeIO(v) { return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; }   /* slow start, slow finish */
  function lerp(a, b, w) { return a + (b - a) * w; }
  var UP = new THREE.Vector3(0, 1, 0), T = new THREE.Vector3(), kN = new THREE.Vector3(), kB = new THREE.Vector3(), kP0 = new THREE.Vector3(), kP1 = new THREE.Vector3();

  /* the shapes, each a grid surface: u runs along it, v across it. Each is a recipe plus a few numbers (p). Between two
     steps that use the same recipe the numbers ease, so the shape bends (unwinds, unrolls, coils) instead of sliding
     point to point */
  function knotAt(L, u, v, t, o) {   /* the cover's tube, built the same way as the cover model. a: how knotted (1 = torus knot, 0 = ring), m: how many times it winds */
    function c(x, out) { var r = 2 + L.a * Math.cos(3 * x); return out.set(r * Math.cos(L.m * x), L.a * 1.2 * Math.sin(3 * x), r * Math.sin(L.m * x)); }
    var x = u * Math.PI * 2; c(x, kP0); c(x + 0.001, kP1); T.copy(kP1).sub(kP0).normalize();
    kN.copy(UP).cross(T).normalize(); kB.copy(T).cross(kN); var a = v * Math.PI * 2 + Math.PI;   /* tube seam on the inside, so it can split there and open flat */
    return o.copy(kP0).addScaledVector(kN, Math.cos(a) * 0.55).addScaledVector(kB, Math.sin(a) * 0.55).multiplyScalar(3.4);
  }
  function rollAt(R, u, v, t, o) {   /* a flat ring that unrolls. phi: how far around it still curls (2π = closed ring, 0 = open sheet) */
    var phi = Math.max(1e-4, R.phi), q = 1 - phi / (Math.PI * 2), L = lerp(42.73, 30, q), wd = lerp(5, 8, q);
    var Rc = L / phi, th0 = Math.PI * (1 + 0.5 * q), th = th0 + (u - 0.5) * phi, r = Rc + (v - 0.5) * wd, sc = Math.sin(phi / 2) / (phi / 2);
    var y = q * (0.5 * Math.sin(u * Math.PI * 3 + t * 0.5) * (0.7 + 0.3 * Math.cos(v * Math.PI * 2 + t * 0.3)) + 1.1 * (1 - Math.pow(2 * u - 1, 2)));   /* a soft arch and a slow ripple, so the open sheet looks like cloth, not a board */
    return o.set(r * Math.cos(th) - Rc * sc * Math.cos(th0), y, r * Math.sin(th) - Rc * sc * Math.sin(th0));   /* kept centered while it unrolls */
  }
  var WIND = 5 * Math.PI;   /* Pre-Algebra's spiral: two and a half turns */
  /* the long wave under 04 (a few slow waves layered at different speeds, with a soft lean across its width) */
  function bandWave(p, u, v, t, o) {   /* a long, slow wave across the full width of the screen: a few gentle waves layered at different speeds, with a soft twist across its width, so it drifts like cloth instead of sliding */
      var x = (u - 0.5) * 56, c = v - 0.5, wd = 3.4 * (1 + 0.2 * Math.sin(0.09 * x + 0.22 * t));
      var y = 0.6 * Math.sin(0.14 * x - 0.42 * t) + 0.28 * Math.sin(0.31 * x + 0.27 * t + 1.3) + 0.12 * Math.sin(0.6 * x - 0.5 * t);
      y += c * wd * 0.45 * Math.sin(0.11 * x - 0.3 * t + 0.8);   /* the band leans one way, then the other, along its length */
      return o.set(x, y, -c * wd + 0.9 * Math.cos(0.1 * x + 0.24 * t) + 0.3 * Math.sin(0.27 * x - 0.33 * t));
    }
  var PK = PRE ? PRE.userData.k : 1, bandP = new THREE.Vector3();
  /* one strip, three looks: long and rippling (04), starting to coil, then exactly Pre-Algebra's spiral (05).
     s: how wound (0 flat, 1 the spiral). L, w: its length and width while flat. wv: how much it ripples like the 04 wave.
     Because every step uses this one recipe, going from 04 to 05 eases these numbers: the ripples settle, the strip
     pulls in, and its ends curl round into the spiral, instead of points sliding across to a different shape */
  function windAt(S, u, v, t, o) {
    var s = Math.max(1e-4, S.s), span = WIND * s, Rc = lerp(S.L, 5.2 * WIND, s) / span, th0 = -0.5 * Math.PI * (1 - s), th = th0 + (u - 0.5) * span;
    var r = Rc + S.w * (v - 0.5);
    o.set(r * Math.cos(th) - (Rc - 5.2) * Math.cos(th0), 1.15 * (u - 0.5) * span, r * Math.sin(th) - (Rc - 5.2) * Math.sin(th0));
    if (PRE) o.sub(PRE.userData.c).multiplyScalar(PRE.userData.k);
    if (S.wv > 1e-4) { bandWave(null, u, v, t, bandP); o.lerp(bandP, S.wv); }
    return o;
  }
  function Sh(f, p) { return { f: f, p: p || {} }; }
  var SHAPE = {
    knot: Sh(knotAt, { a: 1, m: 2 }),
    loose: Sh(knotAt, { a: 0.42, m: 2 }),
    ring: Sh(knotAt, { a: 0, m: 1 }),
    flat: Sh(rollAt, { phi: Math.PI * 2 }),
    half: Sh(rollAt, { phi: Math.PI * 0.9 }),
    sheet: Sh(rollAt, { phi: 0 }),
    twist: Sh(function (p, u, v, t, o) { var th = (u - 0.5) * Math.PI * 1.4 + Math.sin(t * 0.35) * 0.6, w = -(v - 0.5) * 7; return o.set((u - 0.5) * 26, w * Math.sin(th), w * Math.cos(th)); }),
    fold: Sh(function (p, u, v, t, o) {   /* the sheet folded like an accordion (six panels), slowly opening flat and folding back */
      var n = 6, w = 6, a = 0.1 + 0.55 * (0.5 - 0.5 * Math.cos(t * 0.45)), q = u * n, k = Math.min(n - 1, Math.floor(q)), f = q - k;
      return o.set((q - n / 2) * w * Math.cos(a), w * Math.sin(a) * (k % 2 ? 1 - f : f) - 2, -(v - 0.5) * 11);
    }),
    band: Sh(windAt, { s: 0, L: 56 / PK, w: 3.4 / PK, wv: 1 }),   /* the long wave under 04: the same strip that coils into the spiral, laid out long and rippling */
    wave: Sh(function (p, u, v, t, o) { var x = (u - 0.5) * 28, z = -(v - 0.5) * 9; return o.set(x, 2.2 * Math.sin(0.45 * x - 1.2 * t) * (0.6 + 0.4 * Math.cos(0.5 * z + 0.5 * t)), z); }),
    coil: Sh(windAt, { s: 0.42, L: 30, w: 6, wv: 0 }),
    spiral: Sh(windAt, { s: 1, L: 30, w: 6, wv: 0 })
  };
  function shapeAt(S, u, v, t, o) { return S.f(S.p, u, v, t, o); }
  var W = '#E4E8F0', RIGHT = [12.5, 4.6, -6], MID = [3, 6.2, -8], BAND = [1, -0.35, 1];
  var KEYS = [
    /* 0 · cover: exactly the cover knot */
    { s: SHAPE.knot, pos: [PLK[0], PLK[1], PLK[2]], rot: [PLK[3], PLK[4], PLK[5]], col: W, alpha: 1 },
    /* 1 · model only: the knot glides to the middle; every word has faded away */
    { s: SHAPE.knot, pos: [2.8, 5.8, -6], rot: [0.34, 0.3, 0.08], col: W, alpha: 1 },
    /* 2-3 · model only: the knot loosens, then unwinds into a plain ring, a little at a time along its length */
    { s: SHAPE.loose, stagger: true, pos: [2.9, 6.1, -7], rot: [0.5, 0.24, 0.04], col: W, alpha: 1 },
    { s: SHAPE.ring, stagger: true, pos: MID, rot: [0.62, 0.18, 0], col: W, alpha: 1 },
    /* 4-6 · model only: the tube splits along its inside and lies flat as a wide ring, which unrolls into an open sheet */
    { s: SHAPE.flat, stagger: true, pos: MID, rot: [0.58, 0.1, 0], col: W, alpha: 1 },
    { s: SHAPE.half, pos: [3, 5.8, -9.5], rot: [0.46, 0, 0], col: W, alpha: 1 },
    { s: SHAPE.sheet, pos: [3, 4.4, -10], rot: [0.95, -0.14, 0.05], col: W, alpha: 1 },
    /* 7 · the sheet slides to the usual right-hand spot and twists */
    { s: SHAPE.twist, pos: RIGHT, rot: [0.25, -0.35, 0.08], col: W, alpha: 1 },
    /* 8 · the sheet folds up like an accordion and slowly opens out again, like a topic being opened */
    { s: SHAPE.fold, pos: [16, 5.6, -8], rot: [0.32, -0.45, 0], col: W, alpha: 1 },
    /* 9 · a rolling wave (tilts with the mouse) */
    { s: SHAPE.wave, pos: RIGHT, rot: [0.35, -0.3, 0], col: W, alpha: 1 },
    /* 10 · words centered: the wave stretches into a long band that flows across the whole screen beneath them */
    { s: SHAPE.band, pos: BAND, rot: [0.18, 0, 0], col: W, alpha: 0.85 },
    /* 11 · model only: from the middle, the strip slowly starts to coil (white) */
    { s: SHAPE.coil, order: { wv: [0, 0.45], L: [0, 0.6], w: [0.1, 0.7], s: [0.35, 1] }, lean: 0.55, pos: [5, 6.6, -12], rot: [lerp(0.5, PLS[3], 0.6), lerp(-0.1, PLS[4], 0.6), lerp(0, PLS[5], 0.6)], col: W, alpha: 0.9 },
    /* 12 · and finishes as Pre-Algebra's spiral, still white; it turns red only once we arrive at Pre-Algebra */
    { s: SHAPE.spiral, pos: [7, PLS[1], PLS[2]], rot: [PLS[3], PLS[4], PLS[5]], col: W, alpha: 1 }
  ];
  KEYS.push(Object.assign({}, KEYS[K], { pos: [PLS[0], PLS[1], PLS[2] - GAP] }));   /* rides along as the camera travels to Pre-Algebra */
  KEYS.forEach(function (k) { k.c = new THREE.Color(k.col); k.d = SUBJECTS[0].deep.clone(); });   /* every intro step is white; color starts at Pre-Algebra */

  var SU = 320, SV = 40, NU = 60, NV = 10;   /* the same grid as Pre-Algebra's model */
  var segs = (NV + 1) * SU + NU * SV, sArr = new Float32Array(segs * 6), sCol = new Float32Array(segs * 6), sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sArr, 3)); sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
  var sMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  var surf = new THREE.LineSegments(sGeo, sMat); surf.frustumCulled = false; surf.visible = false; scene.add(surf);
  var bA = new THREE.Vector3(), bB = new THREE.Vector3(), mix = { A: null, B: null, w: 0, t: 0, stag: false }, mixP = {};
  /* staggered timing: on the unwinding steps, each part of the shape moves a little after the part before it, starting
     where the ends meet, so it unwinds and unrolls like something real instead of all at once */
  function stagW(w, u) { if (!mix.stag) return w; var d = 0.5 - 0.5 * Math.cos(u * Math.PI * 2); return easeIO(clamp01(w * 1.6 - d * 0.6)); }
  function blendAt(u, v, o) {   /* the in-between shape at this scroll position */
    var w = stagW(mix.w, u);
    if (mix.A.f === mix.B.f) { for (var n in mix.A.p) { var wn = mix.pt && mix.pt[n] ? easeIO(clamp01((mix.w - mix.pt[n][0]) / (mix.pt[n][1] - mix.pt[n][0]))) : w; mixP[n] = lerp(mix.A.p[n], mix.B.p[n], wn); } return mix.A.f(mixP, u, v, mix.t, o); }   /* same recipe: ease its numbers (some later than others, if the step says so), so it bends instead of tearing */   /* same recipe: ease its numbers, so it bends instead of tearing */
    shapeAt(mix.A, u, v, mix.t, bA); shapeAt(mix.B, u, v, mix.t, bB); return o.copy(bA).lerp(bB, w);
  }
  var gP = []; for (var gi = 0; gi < (SU + 1) * (NV + 1); gi++) gP.push(new THREE.Vector3());
  var cP = new THREE.Vector3(), cQ = new THREE.Vector3(), deepC = new THREE.Color(), coreC = new THREE.Color(), tmpC = new THREE.Color(), redC = new THREE.Color();
  function drawSurface(p, t, cam) {
    var k0 = Math.min(KEYS.length - 2, Math.floor(p)), w = ease(Math.min(1, p - k0)), A = KEYS[k0], B = KEYS[k0 + 1];
    var alpha = lerp(A.alpha, B.alpha, w);
    if (alpha < 0.004) return 0;
    mix.t = t; mix.A = A.s; mix.B = B.s; mix.stag = !!B.stagger; mix.pt = B.order || null; mix.w = B.stagger || B.order ? Math.min(1, p - k0) : w;
    var i, j, k = 0, minY = Infinity, maxY = -Infinity;
    for (j = 0; j <= NV; j++) for (i = 0; i <= SU; i++) { var P = gP[j * (SU + 1) + i]; blendAt(i / SU, j / NV, P); if (P.y < minY) minY = P.y; if (P.y > maxY) maxY = P.y; }
    coreC.copy(A.c).lerp(B.c, w); deepC.copy(A.d).lerp(B.d, w);
    function col(y) {   /* darker low down, brighter up top, like the subject models */
      var h = (y - minY) / ((maxY - minY) || 1), c = 0.25 + 0.75 * h; tmpC.copy(deepC).lerp(coreC, c);
      if (redF > 0) { var r = clamp01((easeIO(redF) * 1.3 - h) / 0.3); if (r > 0) tmpC.lerp(redC.copy(SUBJECTS[1].deep).lerp(SUBJECTS[1].core, c), r * r * (3 - 2 * r)); }   /* soft edge between white and red */
      return tmpC;
    }
    function seg(P, Q, u1, u2) { sArr[k] = P.x; sArr[k + 1] = P.y; sArr[k + 2] = P.z; sArr[k + 3] = Q.x; sArr[k + 4] = Q.y; sArr[k + 5] = Q.z; var c1 = col(P.y); sCol[k] = c1.r; sCol[k + 1] = c1.g; sCol[k + 2] = c1.b; var c2 = col(Q.y); sCol[k + 3] = c2.r; sCol[k + 4] = c2.g; sCol[k + 5] = c2.b; k += 6; }
    for (j = 0; j <= NV; j++) for (i = 0; i < SU; i++) seg(gP[j * (SU + 1) + i], gP[j * (SU + 1) + i + 1], i / SU, (i + 1) / SU);
    for (i = 0; i < NU; i++) { blendAt(i / NU, 0, cP); for (j = 1; j <= SV; j++) { blendAt(i / NU, j / SV, cQ); seg(cP, cQ, i / NU, i / NU); cP.copy(cQ); } }
    sGeo.attributes.position.needsUpdate = sGeo.attributes.color.needsUpdate = true;
    var PA = A.pos, PB = B.pos, wp = w;
    if (cam > K) { PA = KEYS[K].pos; PB = KEYS[K + 1].pos; wp = clamp01((cam - K) / (HANDOFF - K)); }   /* lands exactly on Pre-Algebra's model at the hand-over point */   /* the hand-off rides with the camera (and drifts into Pre-Algebra's spot), at the camera's even pace */
    surf.position.set(lerp(PA[0], PB[0], wp), lerp(PA[1], PB[1], wp), lerp(PA[2], PB[2], wp));
    var tilt = Math.max(0, 1 - Math.abs(p - B_LOOK) * 1.5), mid = Math.max(0, 1 - Math.abs(p - 1) * 1.2);
    surf.rotation.set(lerp(A.rot[0], B.rot[0], w) + my * 0.3 * tilt + (B.lean ? B.lean * Math.sin(Math.PI * w) : 0),   /* lean: tips the model toward you mid-move, so it never passes edge-on */
      lerp(A.rot[1], B.rot[1], w) + (reduce ? 0 : Math.sin(t * 0.25) * 0.12 + Math.sin(t * 0.3) * 0.5 * mid) + mx * 0.6 * tilt,   /* same gentle sway as every model; the centered knot turns a little more */
      lerp(A.rot[2], B.rot[2], w));
    return alpha;
  }

  var prelude = document.getElementById('prelude'), preQuote = document.querySelector('.pre-quote'), preIntro = document.querySelector('.pre-intro'), preP = 0, preReady = 0, preVeil = document.getElementById('preVeil'), huds = Array.prototype.slice.call(document.querySelectorAll('.hud'));
  var words = null, wordEls = [], titleTravel = false, handAt = -1, titleFs = 1, cloneEls = Array.prototype.slice.call(document.querySelectorAll('.pre-title > span'));   /* where each title word rests on the cover (page coordinates, no transform) */
  function measureTitle() {
    wordEls = Array.prototype.slice.call(coverIn.children); titleFs = parseFloat(getComputedStyle(coverIn).fontSize) || 1;
    words = wordEls.map(function (w) { var tr = w.style.transform; w.style.transform = ''; var r = w.getBoundingClientRect(); w.style.transform = tr; return { left: r.left, top: r.top + window.scrollY, w: r.width, h: r.height }; });
  }
  var coverIn = document.querySelector('#intro h1')   /* only the title moves, so the scroll hint below keeps its place on the bottom line */, coverCue = document.querySelector('#intro .scroll-cue');
  /* One screen per scroll, everywhere: a wheel flick, a trackpad swipe, Space / Page Down / the arrow keys, the ↑ ↓ buttons and
     the "scroll" hints all move exactly one screen, and the next one only goes once the model has caught up (camera arrived,
     shape finished changing). Scrolling fast can't leave the model behind; it just plays each step in turn. A scroll that comes
     a little early isn't thrown away: it waits (only the latest one) and plays as soon as the model is ready. */
  var lastWheelT = -1e9, stepLock = 0, stepGoal = -1, pending = 0, pendingT = 0;
  function stops() { return Array.prototype.slice.call(document.querySelectorAll('.prelude')).concat(Array.prototype.slice.call(main.children)); }
  function modelSettled(now) {
    if (stepGoal >= 0 && Math.abs(window.scrollY - stepGoal) > 2 && now < stepLock + 2500) return false;   /* the page is still gliding to the last step */
    var camOk = Math.abs(scrollTarget - scrollF) < 0.12;
    var shapeOk = scrollF > K + 0.5 || Math.abs(scrollF - morphF) < 0.2;
    var preOk = window.scrollY >= docTop(main) - 2 || Math.abs(2 * clamp01(window.scrollY / (docTop(main) || 1)) - preP) < 0.08;
    return camOk && shapeOk && preOk;
  }
  function glideTo(el, now) {   /* every move goes through here, so the "wait for the model" rule always knows where we're headed */
    stepLock = now + 700;   /* at least this long between steps, even when the model is quick */
    stepGoal = Math.round(docTop(el));
    window.scrollTo({ top: stepGoal, behavior: reduce ? 'auto' : 'smooth' });
  }
  function step(dir, now) {
    var list = stops(), y = window.scrollY, idx = 0, best = Infinity;
    list.forEach(function (el, i) { var d = Math.abs(docTop(el) - y); if (d < best) { best = d; idx = i; } });
    var next = Math.max(0, Math.min(list.length - 1, idx + dir));
    if (next !== idx || best > 2) glideTo(list[next], now);   /* (if the page was left between two screens, this also tidies it onto one) */
  }
  function request(dir, wait) {   /* wait = false: if the model isn't ready, drop it (held-down keys repeat on their own) */
    var now = performance.now();
    if (now >= stepLock && modelSettled(now)) { pending = 0; step(dir, now); }
    else if (wait) { pending = dir; pendingT = now; }
  }
  setInterval(function () {   /* the waiting scroll plays once the model is ready (and is forgotten if that takes too long) */
    if (!pending) return;
    var now = performance.now();
    if (now - pendingT > 4000 || !menu.hidden) { pending = 0; return; }
    if (now >= stepLock && modelSettled(now)) { var d = pending; pending = 0; step(d, now); }
  }, 50);
  window.addEventListener('wheel', function (e) {
    if (!window.ssLoaded) { e.preventDefault(); return; }   /* nothing moves while the loader is up */
    if (e.ctrlKey || !menu.hidden || Math.abs(e.deltaY) < 1 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;   /* zooming, the open index, sideways swipes: leave alone */
    e.preventDefault();
    var t = e.timeStamp || performance.now(), fresh = t - lastWheelT > 220; lastWheelT = t;   /* the swipe's own time, so a stutter on the page can't split one swipe into several */
    if (fresh) request(e.deltaY > 0 ? 1 : -1, true);
  }, { passive: false });
  var navKeys = { ' ': 1, PageDown: 1, ArrowDown: 1, PageUp: -1, ArrowUp: -1 };
  document.addEventListener('keydown', function (e) {
    if (!window.ssLoaded) { e.preventDefault(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!menu.hidden) {   /* the open Index scrolls itself; the page behind it never moves (and doesn't jump once it closes) */
      var mk = navKeys[e.key] || (e.key === 'Home' || e.key === 'End' ? 1 : 0);
      if (!mk || (e.key === ' ' && e.target && e.target.tagName === 'BUTTON')) return;   /* Space on a subject still picks it */
      e.preventDefault();
      if (e.key === 'Home') menu.scrollTop = 0; else if (e.key === 'End') menu.scrollTop = menu.scrollHeight;
      else menu.scrollBy({ top: (e.key === ' ' && e.shiftKey ? -1 : mk) * (/^Page| /.test(e.key) ? menu.clientHeight * 0.8 : 80), behavior: reduce ? 'auto' : 'smooth' });
      return;
    }
    var tg = e.target, tag = tg && tg.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (tg && tg.isContentEditable)) return;
    if (e.key === 'Home' || e.key === 'End') {   /* top of the site / the last subject (not the hidden copy of Pre-Algebra that makes the loop) */
      e.preventDefault(); pending = 0;
      glideTo(e.key === 'Home' ? stops()[0] : document.getElementById(SUBJECTS[LAST].id), performance.now()); return;
    }
    var d = navKeys[e.key]; if (!d) return;
    if (e.key === ' ' && tag === 'A') return;   /* Space on a link: leave it to the browser */
    if (e.key === ' ' && e.shiftKey) d = -1;
    e.preventDefault();   /* the page never scrolls on its own: no half-way stops, no outrunning the model, and Space on a focused button scrolls instead of pressing it */
    request(d, !e.repeat);
  });
  document.addEventListener('keyup', function (e) { if (e.key === ' ' && menu.hidden && e.target && e.target.tagName === 'BUTTON') e.preventDefault(); });   /* a button is "pressed" when Space comes back up: stop that */
  document.getElementById('prev').addEventListener('click', function () { request(-1, true); });
  document.getElementById('next').addEventListener('click', function () { request(1, true); });
  stepReady = true;
  Array.prototype.forEach.call(document.querySelectorAll('.scroll-cue'), function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); request(1, true); });   /* one screen, like a scroll (no skipped screen, no #hash in the address) */
  });
  measureTitle(); window.addEventListener('resize', measureTitle); if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureTitle);
  var looped = false;   /* true while the camera finishes gliding in after the Topology -> Pre-Algebra jump */
  var redF = 0;   /* how red the spiral is: rises from the bottom on screen 05 (about 2.5 s), drains back from the top if you scroll back */
  var lastMs = 0, morphF = 0, HANDOFF = K + 0.995;   /* the scroll point where the intro spiral hands over to Pre-Algebra's model */

  var D = small ? 600 : 1400, dpos = new Float32Array(D * 3);
  for (var d = 0; d < D; d++) {
    dpos[d * 3] = (rnd() - 0.5) * 90;
    dpos[d * 3 + 1] = -3 + rnd() * 24;
    dpos[d * 3 + 2] = 20 - rnd() * (GAP * (LAST + 1) + 60);
  }
  var dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  var dustMat = new THREE.PointsMaterial({ color: SUBJECTS[0].core.clone(), size: 0.05, transparent: true, opacity: 0.5, depthWrite: false });
  scene.add(new THREE.Points(dgeo, dustMat));

  function ease(t) { return t * t * (3 - 2 * t); }
  var scrollF = 0, scrollTarget = 0, mx = 0, my = 0, tmx = 0, tmy = 0;
  function readScroll() {
    scrollTarget = chapterPos();
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('pointermove', function (e) {
    tmx = (e.clientX / window.innerWidth) * 2 - 1;
    tmy = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (composer) { composer.setSize(w, h); bloom.resolution.set(w, h); }
    readScroll();
  }
  window.addEventListener('resize', resize);
  resize();

  var shown = -1;
  function frame(ms) {
    var t = reduce ? 0 : ms / 1000;
    var dt = Math.min(0.1, Math.max(0, (ms - lastMs) / 1000)); lastMs = ms;
    scrollF += (scrollTarget - scrollF) * (reduce ? 1 : 1 - Math.exp(-dt * 3.7));   /* glide toward where you scrolled, the same speed on any screen */
    if (scrollTarget > SL - 0.002 && scrollF > SL - 0.2) { /* arrived at the copy: jump back to the real Pre-Algebra */
      var h = document.documentElement, sb = h.style.scrollBehavior;
      h.style.scrollBehavior = 'auto';
      window.scrollTo(0, docTop(main.children[K + 1]));
      stepGoal = Math.round(docTop(main.children[K + 1]));   /* so the next scroll isn't held back waiting for the old goal */
      h.style.scrollBehavior = sb;
      scrollTarget = K + 1; scrollF -= SL - (K + 1); /* keep the camera's leftover glide so the jump can't be seen */
      redF = 1; looped = true;   /* coming round from Topology: Pre-Algebra is already red, and the intro stays out of it */
    }
    mx += (tmx - mx) * 0.045; my += (tmy - my) * 0.045;
    var base = Math.min(SL - 1, Math.floor(scrollF)), f = ease(Math.min(1, scrollF - base));
    var u = Math.max(0, scrollF - K);   /* camera travel: none during the intro beats */
    var zc = -u * GAP;
    if (looped && (scrollF >= K + 0.995 || scrollTarget < K + 0.5)) looped = false;   /* the loop's glide has landed (or you scrolled away) */
    var A = STATIONS[base], B = STATIONS[base + 1];
    if (looped && base === K) A = SUBJECTS[LAST];   /* still gliding in from the loop: the colors keep blending from Topology, as they did before the jump */

    skyU.uHorizon.value.copy(A.sky).lerp(B.sky, f);
    dustMat.color.copy(A.core).lerp(B.core, f);

    var sway = reduce ? 0 : Math.sin(t * 0.13) * 0.8;
    camera.position.set((small ? 4 : -2) + mx * 2.2 + sway, 2.6 - my * 1.2, zc + (small ? 38 : 22));
    camera.lookAt(small ? 6 : 3, 4.5, zc - 2);

    var redT = scrollF > K - 0.12 ? 1 : 0;   /* on screen 05 (or past it) the spiral is red; back before it, white */
    redF = reduce ? redT : redF + Math.max(-dt / 2.6, Math.min(dt / 2.6, redT - redF));   /* moves toward that at one steady pace, either way, so it can reverse mid-fade */
    /* the white-to-red intro spiral stays up until it has arrived AND finished turning red; then Pre-Algebra's own (identical) model takes over */
    var swapped = looped || (scrollF >= HANDOFF && (redF >= 1 || scrollF > K + 1.3));   /* after a loop jump the real Pre-Algebra model shows straight away; the intro spiral never appears */
    /* cover -> intro: the cover knot and the intro's knot are the same shape in the same spot. As the knot starts gliding to the
       middle they move together and slowly blend from one to the other, so the hand-over can't be seen */
    var cx = reduce ? (scrollF > 0.05 ? 1 : 0) : ease(clamp01((morphF - 0.02) / 0.5));
    /* pre-cover: until you scroll down from it, only its words show; the scene and bars fade in on the way to the cover */
    /* pre-cover progress, in screens (0 = quote, 1 = "Introducing", 2 = cover). It trails the scroll on purpose, so every step plays out slowly */
    var moT = docTop(main) || 1, sy = window.scrollY, preTarget = 2 * clamp01(sy / moT), preCue = prelude.querySelector('.scroll-cue');
    if (!frame.preInit) { frame.preInit = true; preP = preTarget; }   /* opening the page partway down (a link to a subject) starts there, without replaying the intro */
    preP += (preTarget - preP) * (reduce ? 1 : 1 - Math.exp(-dt * 2));
    if (Math.abs(preTarget - preP) < 0.0005 || (preTarget === 2 && preP > 1.95)) preP = preTarget;   /* the last sliver of the glide is under a pixel, so finish it */
    if (document.documentElement.classList.contains('pre-ready')) preReady = reduce ? 1 : Math.min(1, preReady + dt / 1.6);
    var sh = ease(clamp01((preP - 1.35) / 0.6));   /* the scene and bars stay hidden until the words start settling into the cover */
    if (sh !== frame.sh) {
      frame.sh = sh; preVeil.style.opacity = String(Math.min(0.995, 1 - sh));   /* never fully opaque: a completely hidden canvas can stop being drawn in some browsers */ preVeil.style.display = sh >= 1 ? 'none' : '';
      huds.forEach(function (h) { h.style.opacity = sh < 1 ? sh.toFixed(3) : ''; h.style.visibility = sh < 0.02 ? 'hidden' : ''; });
    }
    /* the words on the pre-cover screens */
    var qo = ease(preReady) * (1 - ease(clamp01(preP / 0.35)));   /* the quote: fades in on load, out as you scroll */
    var wi = ease(clamp01((preP - 0.45) / 0.4)), io = wi * (1 - ease(clamp01((preP - 1.0) / 0.3)));   /* "Introducing" and the title come in together; "Introducing" leaves first */
    var fxKey = qo.toFixed(3) + io.toFixed(3);
    if (fxKey !== frame.fx) {
      frame.fx = fxKey;
      preQuote.style.opacity = qo.toFixed(3); preQuote.style.filter = qo < 0.99 ? 'blur(' + ((1 - qo) * 8).toFixed(2) + 'px)' : ''; preQuote.style.top = Math.round((window.innerHeight - preQuote.offsetHeight) / 2) + 'px'; var qd = Math.round((1 - qo) * (preP > 0.01 ? -40 : 24)); preQuote.style.transform = qd ? 'translateY(' + qd + 'px)' : '';
      preIntro.style.opacity = io.toFixed(3); preIntro.style.filter = io < 0.99 ? 'blur(' + ((1 - io) * 6).toFixed(2) + 'px)' : '';
      preQuote.style.visibility = qo < 0.002 ? 'hidden' : ''; preIntro.style.visibility = io < 0.002 ? 'hidden' : '';
    }
    var co = 1 - clamp01((preP - 1.5) / 0.3);   /* the pre-cover scroll hint stays on the bottom line until the cover's own takes over */
    if (co !== frame.co) { frame.co = co; preCue.style.opacity = co < 1 ? String(0.45 * co) : ''; preCue.style.visibility = co < 0.01 ? 'hidden' : ''; }
    if (words && (sy < moT - 0.5 || preP < 1.999)) {   /* "Open" and "Curve": side by side under "Introducing", then into the one-line cover title */
      var vw = window.innerWidth, vh = window.innerHeight, gap = titleFs * 0.01, w0 = words[0], w1 = words[1], tot = w0.w + gap + w1.w;
      var sA = Math.min(0.34, vw * 0.56 / tot);   /* the title on the "Introducing" screen, as a share of its cover size (about 20% smaller than before) */
      var ax = Math.round((vw - tot * sA) / 2), ay = Math.round(vh * 0.5 - w0.h * sA * 0.3);   /* held perfectly still, on whole pixels */
      preIntro.style.top = (ay - 34) + 'px';   /* "Introducing" sits just above the words */
      var A = [{ x: ax, y: ay, s: sA }, { x: ax + (w0.w + gap) * sA, y: ay, s: sA }];
      var kr = clamp01(preP - 1), kk = easeIO(kr), rest = Math.max(moT, sy);
      cloneEls.forEach(function (el, i) {
        /* "Curve" drops to its line a little before it slides left, so the two words never run into each other */
        var kx = i ? easeIO(clamp01((kr - 0.25) / 0.75)) : kk, ky = i ? easeIO(clamp01(kr / 0.75)) : kk;
        var x = lerp(A[i].x, words[i].left, kx), y = lerp(A[i].y, words[i].top - rest, ky), sc = lerp(A[i].s, 1, kk);
        el.style.transform = 'translate(' + x.toFixed(3) + 'px,' + y.toFixed(3) + 'px) scale(' + sc.toFixed(5) + ')';
        el.style.opacity = preP < 1 ? wi.toFixed(3) : String(1 - ease(clamp01(scrollF / 0.55))); el.style.filter = preP < 1 && wi < 0.99 ? 'blur(' + ((1 - wi) * 8).toFixed(2) + 'px)' : '';
        el.style.visibility = 'visible';
      });
      if (!titleTravel) { wordEls.forEach(function (el) { el.style.visibility = 'hidden'; }); titleTravel = true; handAt = -1; }   /* the real title waits on the cover, hidden, until the copy lands on it */
    } else if (titleTravel) { wordEls.forEach(function (el) { el.style.visibility = ''; }); titleTravel = false; handAt = t; frame.ce = -1; }   /* landed: the real title appears underneath... */
    if (handAt >= 0) {   /* ...and the copy on top fades away over a third of a second, so even a half-pixel difference between them can't be seen */
      var hh = reduce ? 1 : clamp01((t - handAt) / 0.35), cf = 1 - ease(clamp01(scrollF / 0.55));
      cloneEls.forEach(function (el) { el.style.opacity = String((1 - hh) * cf); });
      if (hh >= 1) { cloneEls.forEach(function (el) { el.style.visibility = ''; el.style.opacity = ''; }); handAt = -1; }
    }
    var ce = ease(clamp01(scrollF / 0.55));   /* the cover title drifts up, fades and softens as you scroll away */
    if (ce !== frame.ce) {
      frame.ce = ce;
      coverIn.style.transition = ce > 0 ? 'none' : ''; coverIn.style.opacity = ce > 0 ? String(1 - ce) : ''; if (!titleTravel) coverIn.style.transform = ce > 0 ? 'translateY(' + (-ce * 56).toFixed(1) + 'px)' : ''; coverIn.style.filter = ce > 0.01 ? 'blur(' + (ce * 8).toFixed(2) + 'px)' : '';
      coverCue.style.opacity = ce > 0 ? String(0.45 * (1 - ce)) : '';
    }
    forms.forEach(function (m, i) {
      if (!m) return;
      var near = i === 0 ? 0 :   /* the cover knot: blended into the intro knot below */
        i === K + 1 && !swapped ? 9 : Math.abs(u - STATIONS[i].t);   /* Pre-Algebra's model takes over only once the camera has arrived; until then the intro spiral (identical to it) is shown */
      m.visible = near < 0.8;
      if (!m.visible) return;
      m.rotation.y = m.userData.ry + (reduce ? 0 : Math.sin(t * 0.25) * 0.12); /* gentle sway, not a full spin, so each model keeps the angle it was framed at */
      var fade = Math.min(1, Math.max(0, (near - 0.3) / 0.5));
      m.material.opacity = 0.8 * (1 - fade * fade * (3 - 2 * fade));
      if (i === 0) { m.visible = cx < 0.999; m.material.opacity = 0.8 * (1 - cx); }
    });

    /* intro models: each draws itself in, moves while you're on its screen, and erases as you leave */
    surf.visible = false;
    /* the intro surface follows the scroll more slowly than the camera, so its changes unfold gently */
    /* (once the camera starts traveling to Pre-Algebra it catches up, so the spiral is finished by the time we arrive) */
    morphF += (scrollF - morphF) * (reduce ? 1 : 1 - Math.exp(-dt * (scrollF > K ? 5 : 1.05)));
    var sOp = 0.8 * cx, cov = forms[0];
    if (sOp > 0.002 && !swapped) {
      var pp = scrollF > K ? Math.min(K, morphF) : Math.min(K + 1, morphF), al = drawSurface(pp, t, scrollF);
      sMat.opacity = sOp * al; surf.visible = sMat.opacity > 0.002;
      if (cov.visible) { cov.position.copy(surf.position); cov.rotation.copy(surf.rotation); }   /* the cover knot rides along while it fades */
    } else if (cov.visible) { cov.position.set(PLK[0], PLK[1], PLK[2]); cov.rotation.set(PLK[3], cov.rotation.y, PLK[5]); }   /* back on the cover: exactly where it always sits */

    pickerBar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, (scrollF > SL - 1 ? 1 : scrollF - K) / LAST)).toFixed(4) + ')';
    var cc = Math.round(scrollF), cur = info(cc), key = cur.beat ? 'b' + cur.beat.beat : cur.n;
    if (key !== shown) {
      shown = key;
      var ch = cur.n;
      eqEl.textContent = cur.beat ? cur.beat.label : SUBJECTS[ch].label;
      countEl.textContent = (ch ? pad(ch) : '—') + ' / ' + pad(LAST);   /* the cover and intro aren't subjects, so no "00" */
      document.documentElement.style.setProperty('--accent', SUBJECTS[ch].css);
      pickerLabel.textContent = cur.beat ? 'Intro' : ch === 0 ? 'Index' : SUBJECTS[ch].name;
      pickerNum.textContent = ch ? pad(ch) : ''; pickerNum.style.display = ch ? '' : 'none';
      tabs.forEach(function (b) { b.setAttribute('aria-current', String(ch > 0 && +b.dataset.go === ch)); });
    }

    if (composer) composer.render(); else renderer.render(scene, camera);
    if (!frame.drawn) { frame.drawn = true; if (window.ssReady) ssReady(); }
    if (!reduce) requestAnimationFrame(frame);
  }
  if (reduce) {
    frame(0);
    window.addEventListener('scroll', function () { requestAnimationFrame(frame); }, { passive: true });
  } else requestAnimationFrame(frame);
})();
