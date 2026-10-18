/* Scalar Space — static math lesson site.
 * Reads topics from data/catalog.json and data/<course>/<topic>.json.
 * No build step: edit the JSON, push to GitHub, GitHub Pages serves it.
 */
(function () {
  'use strict';

  // ----- Settings -----
  const REPO = 'xuunh/ScalarSpace';
  const BRANCH = 'main';
  const GH = 'https://github.com/' + REPO;

  // ----- Small helpers -----
  const $ = (sel, root) => (root || document).querySelector(sel);

  /** Build an element: h('div', {class: 'x'}, child, 'text', ...) */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }

  function tex(src, display) {
    const span = h('span');
    try {
      katex.render(src, span, { displayMode: !!display, throwOnError: false });
    } catch (e) {
      span.textContent = src;
    }
    return span;
  }

  function fmt(v) {
    if (!Number.isFinite(v)) return '?';
    const r = Math.round(v * 100) / 100;
    return String(Object.is(r, -0) ? 0 : r);
  }

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage off */ } },
  };

  // ----- Safe math expressions -----
  // Allowed: numbers, x, the topic's slider names, + - * / ^ ( ) and these functions.
  const FUNCS = {
    sqrt: 'Math.sqrt', abs: 'Math.abs', log: 'Math.log', ln: 'Math.log', exp: 'Math.exp',
    sin: 'Math.sin', cos: 'Math.cos', tan: 'Math.tan', pi: 'Math.PI', e: 'Math.E',
  };
  function compile(expr, names) {
    if (!/^[0-9A-Za-z_+\-*/^().,\s]*$/.test(expr)) throw new Error('Bad character in "' + expr + '"');
    const js = expr
      .replace(/[A-Za-z_][A-Za-z0-9_]*/g, (id) => {
        if (id === 'x') return 'x';
        if (names.includes(id)) return 'p.' + id;
        if (FUNCS[id]) return FUNCS[id];
        throw new Error('Unknown name "' + id + '" in "' + expr + '"');
      })
      .replace(/\^/g, '**');
    // eslint-disable-next-line no-new-func
    return new Function('x', 'p', '"use strict"; return (' + js + ');');
  }

  /** Fill a live-equation template: {m} value, {+b} "+ 3"/"- 3", {-h} "- 2"/"+ 2", {=expr} computed. */
  function fillLive(tpl, vals, names) {
    return tpl.replace(/\{([+\-=*]?)([^{}]+)\}/g, (m, sign, body) => {
      if (sign === '=') {
        try { return fmt(compile(body, names)(0, vals)); } catch (e) { return m; }
      }
      if (!names.includes(body)) return m;
      const v = vals[body];
      if (sign === '+') return v < 0 ? '- ' + fmt(-v) : '+ ' + fmt(v);
      if (sign === '-') return v < 0 ? '+ ' + fmt(-v) : '- ' + fmt(v);
      if (sign === '*') return v === 1 ? '' : v === -1 ? '-' : fmt(v);
      return fmt(v);
    });
  }

  // ----- Graph -----
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / p;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
  }

  class Graph {
    constructor(canvas, readout, spec) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.readout = readout;
      this.names = Object.keys(spec.params || {});
      this.curves = (spec.curves || []).map((c) => ({ ...c, f: compile(c.expr, this.names) }));
      this.marks = (spec.marks || []).map((m) => ({
        ...m,
        fx: m.x != null ? compile(String(m.x), this.names) : null,
        fy: m.y != null ? compile(String(m.y), this.names) : null,
      }));
      this.home = Object.assign({ xmin: -10, xmax: 10, ymin: -10, ymax: 10 }, spec.window);
      this.view = { ...this.home };
      this.vals = {};
      this.hoverX = null;

      new ResizeObserver(() => this.resize()).observe(canvas);
      this.bindPointer();
    }

    setVals(vals) { this.vals = vals; this.draw(); }
    reset() { this.view = { ...this.home }; this.draw(); }
    zoom(f) {
      const v = this.view;
      const cx = (v.xmin + v.xmax) / 2, cy = (v.ymin + v.ymax) / 2;
      const hx = (v.xmax - v.xmin) / 2 * f, hy = (v.ymax - v.ymin) / 2 * f;
      this.view = { xmin: cx - hx, xmax: cx + hx, ymin: cy - hy, ymax: cy + hy };
      this.draw();
    }

    resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = this.canvas.clientWidth, hgt = this.canvas.clientHeight;
      if (!w || !hgt) return;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(hgt * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.W = w; this.H = hgt;
      this.draw();
    }

    // Same scale on both axes, so a slope of 1 really looks like 45°.
    frame() {
      const v = this.view, W = this.W, H = this.H;
      const s = Math.min(W / (v.xmax - v.xmin), H / (v.ymax - v.ymin));
      const cx = (v.xmin + v.xmax) / 2, cy = (v.ymin + v.ymax) / 2;
      return {
        s,
        xmin: cx - W / 2 / s, xmax: cx + W / 2 / s,
        ymin: cy - H / 2 / s, ymax: cy + H / 2 / s,
        px: (x) => W / 2 + (x - cx) * s,
        py: (y) => H / 2 - (y - cy) * s,
        ux: (px) => cx + (px - W / 2) / s,
      };
    }

    bindPointer() {
      let drag = null;
      const c = this.canvas;
      c.addEventListener('pointerdown', (e) => {
        drag = { x: e.clientX, y: e.clientY, view: { ...this.view } };
        c.setPointerCapture(e.pointerId);
      });
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        if (drag) {
          const s = this.frame().s;
          const dx = (e.clientX - drag.x) / s, dy = (e.clientY - drag.y) / s;
          const v = drag.view;
          this.view = { xmin: v.xmin - dx, xmax: v.xmax - dx, ymin: v.ymin + dy, ymax: v.ymax + dy };
        }
        this.hoverX = this.frame().ux(e.clientX - r.left);
        this.draw();
      });
      const end = () => { drag = null; };
      c.addEventListener('pointerup', end);
      c.addEventListener('pointercancel', end);
      c.addEventListener('pointerleave', () => { if (!drag) { this.hoverX = null; this.draw(); } });
    }

    draw() {
      if (!this.W) return;
      const ctx = this.ctx, W = this.W, H = this.H, F = this.frame();
      const col = {
        bg: cssVar('--surface'), grid: cssVar('--grid'), axis: cssVar('--axis'),
        text: cssVar('--muted'), hot: cssVar('--hot'),
        curves: ['--c1', '--c2', '--c3', '--c4'].map(cssVar),
      };

      ctx.fillStyle = col.bg;
      ctx.fillRect(0, 0, W, H);

      // Grid + tick labels
      const step = niceStep(60 / F.s);
      ctx.lineWidth = 1;
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.strokeStyle = col.grid;
      ctx.beginPath();
      for (let x = Math.ceil(F.xmin / step) * step; x <= F.xmax; x += step) {
        const p = Math.round(F.px(x)) + 0.5; ctx.moveTo(p, 0); ctx.lineTo(p, H);
      }
      for (let y = Math.ceil(F.ymin / step) * step; y <= F.ymax; y += step) {
        const p = Math.round(F.py(y)) + 0.5; ctx.moveTo(0, p); ctx.lineTo(W, p);
      }
      ctx.stroke();

      // Axes
      ctx.strokeStyle = col.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const ax = F.px(0), ay = F.py(0);
      if (ax >= 0 && ax <= W) { ctx.moveTo(ax, 0); ctx.lineTo(ax, H); }
      if (ay >= 0 && ay <= H) { ctx.moveTo(0, ay); ctx.lineTo(W, ay); }
      ctx.stroke();

      ctx.fillStyle = col.text;
      const labY = Math.min(Math.max(ay + 14, 14), H - 4);
      const labX = Math.min(Math.max(ax + 5, 4), W - 30);
      ctx.textAlign = 'center';
      for (let x = Math.ceil(F.xmin / step) * step; x <= F.xmax; x += step) {
        if (Math.abs(x) < step / 2) continue;
        ctx.fillText(fmt(x), F.px(x), labY);
      }
      ctx.textAlign = 'left';
      for (let y = Math.ceil(F.ymin / step) * step; y <= F.ymax; y += step) {
        if (Math.abs(y) < step / 2) continue;
        ctx.fillText(fmt(y), labX, F.py(y) + 4);
      }

      // Lines from marks (asymptotes, axis of symmetry) go under the curves
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 1.5;
      for (const m of this.marks) {
        if (m.type !== 'vline' && m.type !== 'hline') continue;
        ctx.strokeStyle = col.hot;
        ctx.fillStyle = col.hot;
        ctx.beginPath();
        if (m.type === 'vline') {
          const p = F.px(m.fx(0, this.vals));
          if (!Number.isFinite(p)) continue;
          ctx.moveTo(p, 0); ctx.lineTo(p, H);
          ctx.stroke();
          if (m.label) { ctx.textAlign = 'left'; ctx.fillText(m.label, p + 6, 16); }
        } else {
          const p = F.py(m.fy(0, this.vals));
          if (!Number.isFinite(p)) continue;
          ctx.moveTo(0, p); ctx.lineTo(W, p);
          ctx.stroke();
          if (m.label) { ctx.textAlign = 'right'; ctx.fillText(m.label, W - 8, p - 6); }
        }
      }
      ctx.setLineDash([]);

      // Curves
      const clampY = (p) => Math.max(-5 * H, Math.min(6 * H, p));
      this.curves.forEach((c, i) => {
        ctx.strokeStyle = col.curves[i % col.curves.length];
        ctx.globalAlpha = c.faint ? 0.35 : 1;
        ctx.lineWidth = c.faint ? 1.5 : 3;
        ctx.setLineDash(c.dashed ? [8, 6] : []);
        ctx.beginPath();
        let prev = null;
        for (let px = 0; px <= W; px += 1) {
          const y = c.f(F.ux(px), this.vals);
          if (!Number.isFinite(y)) { prev = null; continue; }
          const py = clampY(F.py(y));
          if (prev === null || Math.abs(py - prev) > H * 1.5) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
          prev = py;
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);

      // Points
      ctx.font = '600 12px Inter, system-ui, sans-serif';
      const placed = [];
      const hits = (r) => placed.some((q) => r.x < q.x + q.w && q.x < r.x + r.w && r.y < q.y + q.h && q.y < r.y + r.h);
      for (const m of this.marks) {
        if (m.type !== 'point') continue;
        const x = m.fx(0, this.vals), y = m.fy(0, this.vals);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        const px = F.px(x), py = F.py(y);
        if (px < -10 || px > W + 10 || py < -10 || py > H + 10) continue;
        ctx.fillStyle = col.bg;
        ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col.hot;
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
        const text = (m.label ? m.label + ' ' : '') + '(' + fmt(x) + ', ' + fmt(y) + ')';
        const tw = ctx.measureText(text).width;
        const right = px > W - tw - 20;
        const tx = right ? px - 10 - tw : px + 10;
        // Try above, then below, then skip the text if it would overlap another label.
        let ty = null;
        for (const cand of [py - 10, py + 22, py - 26]) {
          const box = { x: tx - 2, y: cand - 12, w: tw + 4, h: 16 };
          if (!hits(box)) { ty = cand; placed.push(box); break; }
        }
        if (ty === null) continue;
        ctx.textAlign = 'left';
        ctx.lineWidth = 4;
        ctx.strokeStyle = col.bg;
        ctx.strokeText(text, tx, ty);
        ctx.fillStyle = col.text;
        ctx.fillText(text, tx, ty);
      }

      // Hover readout on the first curve
      if (this.hoverX != null && this.curves.length) {
        const x = this.hoverX, y = this.curves[0].f(x, this.vals);
        if (Number.isFinite(y)) {
          ctx.fillStyle = col.curves[0];
          ctx.beginPath(); ctx.arc(F.px(x), F.py(y), 4.5, 0, Math.PI * 2); ctx.fill();
          this.readout.textContent = 'x = ' + fmt(x) + '   y = ' + fmt(y);
        } else {
          this.readout.textContent = 'x = ' + fmt(x) + '   y: undefined';
        }
        this.readout.classList.add('on');
      } else {
        this.readout.classList.remove('on');
      }
    }
  }

  // ----- Data -----
  let topics = [];     // [{ path, course, data }]
  let byId = {};
  let graph = null;

  async function loadAll() {
    const res = await fetch('data/catalog.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('Could not load data/catalog.json');
    const cat = await res.json();
    const jobs = [];
    for (const course of cat.courses) {
      for (const path of course.topics) {
        jobs.push(
          fetch('data/' + path, { cache: 'no-cache' })
            .then((r) => { if (!r.ok) throw new Error(path); return r.json(); })
            .then((data) => ({ path, course: course.name, data }))
            .catch((e) => { console.error('Topic failed to load:', path, e); return null; })
        );
      }
    }
    topics = (await Promise.all(jobs)).filter(Boolean);
    byId = Object.fromEntries(topics.map((t) => [t.data.id, t]));
  }

  // ----- Sidebar -----
  function matches(t, q) {
    if (!q) return true;
    const d = t.data;
    return [d.title, d.unit, d.course, d.summary].join(' ').toLowerCase().includes(q);
  }

  function renderSidebar(q) {
    const nav = $('#sidebar');
    nav.replaceChildren();
    const current = location.hash.replace(/^#\/?/, '');
    let shown = 0;
    let lastCourse = null, lastUnit = null;
    for (const t of topics) {
      if (!matches(t, q)) continue;
      shown++;
      if (t.course !== lastCourse) {
        nav.append(h('div', { class: 'side-course' }, t.course));
        lastCourse = t.course; lastUnit = null;
      }
      if (t.data.unit !== lastUnit) {
        nav.append(h('div', { class: 'side-unit' }, t.data.unit));
        lastUnit = t.data.unit;
      }
      nav.append(h('a', {
        class: 'side-link' + (t.data.id === current ? ' active' : ''),
        href: '#/' + t.data.id,
      }, t.data.title));
    }
    if (!shown) nav.append(h('div', { class: 'side-empty' }, 'No topics match.'));
  }

  // ----- Pages -----
  function renderHome(q) {
    document.title = 'Scalar Space — math you can see';
    const main = $('#main');
    const blocks = [];
    const courses = [...new Set(topics.map((t) => t.course))];
    for (const c of courses) {
      const list = topics.filter((t) => t.course === c && matches(t, q));
      if (!list.length) continue;
      blocks.push(h('section', { class: 'course-block' },
        h('h2', {}, c),
        h('div', { class: 'cards' }, list.map((t) =>
          h('a', { class: 'card', href: '#/' + t.data.id },
            h('div', { class: 'unit' }, t.data.unit),
            h('h3', {}, t.data.title),
            h('div', { class: 'card-formula' }, tex(t.data.formula, false))
          )))
      ));
    }
    main.replaceChildren(
      h('section', { class: 'hero' },
        h('h1', {}, 'Math you can ', h('span', {}, 'see'), '.'),
        h('p', {}, 'Every topic has the equation, what each part means in plain words, and a graph you can drag. Free and open source.')
      ),
      ...(blocks.length ? blocks : [h('p', { class: 'loading' }, 'No topics match your search.')]),
      h('p', { class: 'footer-note' },
        'Want to add a topic or fix something? ',
        h('a', { href: GH + '/blob/' + BRANCH + '/CONTRIBUTING.md', target: '_blank', rel: 'noopener' }, 'See how to contribute'),
        '.')
    );
  }

  function renderTopic(t) {
    const d = t.data;
    document.title = d.title + ' — Scalar Space';
    const main = $('#main');
    const spec = d.graph || {};
    const names = Object.keys(spec.params || {});
    const vals = Object.fromEntries(names.map((n) => [n, Number(spec.params[n].value)]));

    // Actions
    const copyBtn = h('button', { class: 'btn primary', type: 'button' }, 'Copy link for students');
    copyBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(location.href); copyBtn.textContent = 'Copied!'; }
      catch (e) { copyBtn.textContent = location.href; }
      setTimeout(() => { copyBtn.textContent = 'Copy link for students'; }, 1800);
    });
    const actions = h('div', { class: 'topic-actions' },
      copyBtn,
      h('a', { class: 'btn', href: GH + '/blob/' + BRANCH + '/data/' + t.path, target: '_blank', rel: 'noopener' }, 'View source on GitHub'),
      h('a', {
        class: 'btn',
        href: GH + '/issues/new?title=' + encodeURIComponent('Fix: ' + d.title) +
          '&body=' + encodeURIComponent('Topic: data/' + t.path + '\n\nWhat should change?\n'),
        target: '_blank', rel: 'noopener',
      }, 'Suggest a fix')
    );

    // Visual: graph + sliders
    let visual = null;
    if (spec.curves && spec.curves.length) {
      const canvas = h('canvas', { 'aria-label': 'Interactive graph of ' + d.title, role: 'img' });
      const readout = h('div', { class: 'readout' });
      const live = h('div', { class: 'live' });
      const legend = h('div', { class: 'legend' }, spec.curves.map((c, i) =>
        h('span', {}, h('i', {
          class: c.dashed ? 'dashed' : '',
          style: 'background: var(--c' + ((i % 4) + 1) + '); color: var(--c' + ((i % 4) + 1) + ');' + (c.faint ? 'opacity:.4' : ''),
        }), c.label || c.expr)
      ));
      const updateLive = () => {
        if (!spec.live) return;
        // Each part split by \\qquad goes on its own line so it fits the panel.
        live.replaceChildren(...fillLive(spec.live, vals, names).split('\\qquad').map((part) => tex(part.trim(), true)));
      };

      const sliders = names.map((n) => {
        const p = spec.params[n];
        const out = h('output', {}, fmt(vals[n]));
        const input = h('input', {
          type: 'range', min: p.min, max: p.max, step: p.step || 0.1, value: vals[n],
          'aria-label': p.label || n,
        });
        input.addEventListener('input', () => {
          vals[n] = Number(input.value);
          out.textContent = fmt(vals[n]);
          updateLive();
          graph.setVals(vals);
        });
        return h('div', { class: 'slider' },
          h('label', {}, h('span', {}, tex(p.tex || n, false), ' ', h('span', { class: 'name' }, p.label && p.label !== n ? p.label : '')), out),
          input);
      });

      const resetBtn = h('button', { class: 'btn', type: 'button' }, 'Reset view');
      const zin = h('button', { class: 'btn', type: 'button', 'aria-label': 'Zoom in' }, '+');
      const zout = h('button', { class: 'btn', type: 'button', 'aria-label': 'Zoom out' }, '−');

      visual = h('section', { class: 'visual' },
        h('div', { class: 'panel graph-wrap' }, canvas, readout, legend),
        h('div', { class: 'panel controls' },
          h('h2', {}, h('span', { class: 'tag' }, 'Try it'), 'Drag the sliders'),
          live,
          ...sliders,
          h('div', { class: 'row' }, zin, zout, resetBtn),
          d.watchFor && d.watchFor.length
            ? h('div', {}, h('h2', {}, 'Watch for'), h('ul', { class: 'watch' }, d.watchFor.map((w) => h('li', {}, w))))
            : null
        )
      );

      // Graph is created after it's in the page so it can measure itself.
      queueMicrotask(() => {
        try {
          graph = new Graph(canvas, readout, spec);
          graph.setVals(vals);
          resetBtn.addEventListener('click', () => graph.reset());
          zin.addEventListener('click', () => graph.zoom(0.8));
          zout.addEventListener('click', () => graph.zoom(1.25));
        } catch (e) {
          console.error(e);
          canvas.replaceWith(h('p', { class: 'error', style: 'padding:20px' }, 'Graph error: ' + e.message));
        }
      });
      updateLive();
    }

    // Example: reveal one step at a time
    let example = null;
    if (d.example) {
      const ex = d.example;
      const list = h('ol', { class: 'steps' });
      const ans = h('div');
      let shown = 0;
      const nextBtn = h('button', { class: 'btn primary', type: 'button' }, 'Show first step');
      const allBtn = h('button', { class: 'btn', type: 'button' }, 'Show all');
      const resetBtn = h('button', { class: 'btn', type: 'button' }, 'Start over');
      const sync = () => {
        list.replaceChildren(...ex.steps.slice(0, shown).map((s) => h('li', {}, s)));
        const done = shown > ex.steps.length - 1;
        ans.replaceChildren(done ? h('div', { class: 'answer' }, h('span', { class: 'lbl' }, 'Answer:'), ex.answer) : '');
        nextBtn.textContent = shown === 0 ? 'Show first step' : 'Next step';
        nextBtn.hidden = done;
        allBtn.hidden = done;
        resetBtn.hidden = shown === 0;
      };
      nextBtn.addEventListener('click', () => { shown++; sync(); });
      allBtn.addEventListener('click', () => { shown = ex.steps.length; sync(); });
      resetBtn.addEventListener('click', () => { shown = 0; sync(); });
      sync();
      example = h('section', { class: 'panel' },
        h('h2', {}, h('span', { class: 'tag' }, 'Example'), 'Worked example'),
        h('p', { class: 'problem' }, ex.problem),
        list, ans,
        h('div', { class: 'row', style: 'margin-top:12px' }, nextBtn, allBtn, resetBtn));
    }

    // Practice: hide the answer until asked
    let practice = null;
    if (d.practice) {
      const ans = h('div');
      const btn = h('button', { class: 'btn primary', type: 'button' }, 'Show answer');
      btn.addEventListener('click', () => {
        const open = !ans.firstChild;
        ans.replaceChildren(open ? h('div', { class: 'answer' }, h('span', { class: 'lbl' }, 'Answer:'), d.practice.answer) : '');
        btn.textContent = open ? 'Hide answer' : 'Show answer';
      });
      practice = h('section', { class: 'panel' },
        h('h2', {}, h('span', { class: 'tag' }, 'You try'), 'Practice'),
        h('p', { class: 'problem' }, d.practice.problem),
        h('div', { class: 'row' }, btn), ans);
    }

    main.replaceChildren(
      h('article', { class: 'topic' },
        h('div', { class: 'crumbs' }, d.course + ' · ' + d.unit),
        h('h1', {}, d.title),
        d.summary ? h('p', { class: 'summary' }, d.summary) : null,
        actions,
        h('div', { class: 'formula-hero' }, tex(d.formula, true)),
        visual,
        h('div', { class: 'learn' },
          d.explanation ? h('section', { class: 'panel' },
            h('h2', {}, 'In plain words'),
            h('ul', { class: 'points' }, d.explanation.map((x) => h('li', {}, x)))) : null,
          d.symbols ? h('section', { class: 'panel' },
            h('h2', {}, 'What each part means'),
            h('table', { class: 'symbols' }, h('tbody', {}, d.symbols.map((s) =>
              h('tr', {}, h('td', {}, tex(s.symbol, false)), h('td', {}, s.meaning)))))) : null,
          example,
          practice
        )
      )
    );
  }

  function renderNotFound(id) {
    document.title = 'Not found — Scalar Space';
    $('#main').replaceChildren(
      h('h1', {}, 'Topic not found'),
      h('p', {}, 'No topic called "' + id + '". '), h('a', { href: '#/' }, 'Back to all topics'));
  }

  // ----- Router -----
  function route() {
    graph = null;
    document.body.classList.remove('nav-open');
    const id = location.hash.replace(/^#\/?/, '');
    const q = $('#search').value.trim().toLowerCase();
    renderSidebar(q);
    if (!id) renderHome(q);
    else if (byId[id]) renderTopic(byId[id]);
    else renderNotFound(id);
    window.scrollTo(0, 0);
  }

  // ----- Chrome: theme, teaching mode, mobile menu, search -----
  function setupChrome() {
    $('#githubLink').href = GH;

    const saved = store.get('theme');
    if (saved) document.documentElement.dataset.theme = saved;
    $('#themeBtn').addEventListener('click', () => {
      const dark = document.documentElement.dataset.theme
        ? document.documentElement.dataset.theme === 'dark'
        : matchMedia('(prefers-color-scheme: dark)').matches;
      const next = dark ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      store.set('theme', next);
      if (graph) graph.draw();
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => graph && graph.draw());

    const focusBtn = $('#focusBtn');
    focusBtn.addEventListener('click', () => {
      const on = document.body.classList.toggle('focus');
      focusBtn.setAttribute('aria-pressed', String(on));
    });

    $('#menuBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    $('#scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));

    const search = $('#search');
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      renderSidebar(q);
      if (!location.hash.replace(/^#\/?/, '')) renderHome(q);
    });
    search.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const q = search.value.trim().toLowerCase();
      const first = topics.find((t) => matches(t, q));
      if (first) { location.hash = '#/' + first.data.id; search.blur(); }
    });
  }

  // ----- Start -----
  async function start() {
    setupChrome();
    try {
      await loadAll();
    } catch (e) {
      $('#main').replaceChildren(h('p', { class: 'error' }, 'Could not load topics. ' + e.message));
      return;
    }
    window.addEventListener('hashchange', route);
    route();
  }

  start();
})();
