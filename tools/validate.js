#!/usr/bin/env node
// Checks every topic file before it goes live.
// Run: node tools/validate.js
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');
const errors = [];
const fail = (where, msg) => errors.push(where + ': ' + msg);

const FUNCS = ['sqrt', 'abs', 'log', 'ln', 'exp', 'sin', 'cos', 'tan', 'pi', 'e'];
function checkExpr(where, expr, names) {
  if (typeof expr !== 'string' && typeof expr !== 'number') return fail(where, 'expression must be text');
  expr = String(expr);
  if (!/^[0-9A-Za-z_+\-*/^().,\s]*$/.test(expr)) return fail(where, 'bad character in "' + expr + '"');
  const ids = expr.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
  for (const id of ids) {
    if (id !== 'x' && !names.includes(id) && !FUNCS.includes(id)) fail(where, 'unknown name "' + id + '" in "' + expr + '"');
  }
  try {
    const js = expr.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (id) =>
      id === 'x' ? 'x' : names.includes(id) ? 'p.' + id : 'Math.' + (id === 'ln' ? 'log' : id === 'pi' ? 'PI' : id === 'e' ? 'E' : id)
    ).replace(/\^/g, '**');
    new Function('x', 'p', 'return (' + js + ');'); // eslint-disable-line no-new-func
  } catch (e) {
    fail(where, 'expression "' + expr + '" has a typo (' + e.message + ')');
  }
}

let catalog;
try {
  catalog = JSON.parse(fs.readFileSync(path.join(dataDir, 'catalog.json'), 'utf8'));
} catch (e) {
  console.error('data/catalog.json: ' + e.message);
  process.exit(1);
}

const listed = new Set();
const ids = new Set();
for (const course of catalog.courses || []) {
  for (const rel of course.topics || []) {
    listed.add(rel);
    const where = 'data/' + rel;
    let t;
    try {
      t = JSON.parse(fs.readFileSync(path.join(dataDir, rel), 'utf8'));
    } catch (e) {
      fail(where, e.code === 'ENOENT' ? 'listed in catalog.json but the file is missing' : 'not valid JSON (' + e.message + ')');
      continue;
    }
    for (const key of ['id', 'course', 'unit', 'title', 'formula']) {
      if (!t[key]) fail(where, 'missing "' + key + '"');
    }
    if (t.id && t.id !== path.basename(rel, '.json')) fail(where, '"id" should match the file name ("' + path.basename(rel, '.json') + '")');
    if (t.id && ids.has(t.id)) fail(where, 'duplicate id "' + t.id + '"');
    ids.add(t.id);
    if (t.course && t.course !== course.name) fail(where, 'course is "' + t.course + '" but it is listed under "' + course.name + '"');

    const g = t.graph;
    if (g) {
      const names = Object.keys(g.params || {});
      for (const [n, p] of Object.entries(g.params || {})) {
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(n) || n === 'x') fail(where, 'bad slider name "' + n + '"');
        for (const k of ['min', 'max', 'value']) if (typeof p[k] !== 'number') fail(where, 'slider "' + n + '" needs a number for "' + k + '"');
        if (p.value < p.min || p.value > p.max) fail(where, 'slider "' + n + '" starts outside its min/max');
      }
      if (!Array.isArray(g.curves) || !g.curves.length) fail(where, 'graph needs at least one curve');
      (g.curves || []).forEach((c, i) => checkExpr(where + ' curve ' + (i + 1), c.expr, names));
      (g.marks || []).forEach((m, i) => {
        const w = where + ' mark ' + (i + 1);
        if (!['point', 'vline', 'hline'].includes(m.type)) fail(w, 'type must be point, vline or hline');
        if (m.type !== 'hline') checkExpr(w, m.x, names);
        if (m.type !== 'vline') checkExpr(w, m.y, names);
      });
    }
    if (t.example && (!Array.isArray(t.example.steps) || !t.example.answer)) fail(where, 'example needs "steps" (a list) and "answer"');
    if (t.practice && (!t.practice.problem || !t.practice.answer)) fail(where, 'practice needs "problem" and "answer"');
  }
}

// Topic files that exist but were never added to the catalog
for (const dir of fs.readdirSync(dataDir, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  for (const f of fs.readdirSync(path.join(dataDir, dir.name))) {
    const rel = dir.name + '/' + f;
    if (f.endsWith('.json') && !listed.has(rel)) fail('data/' + rel, 'file exists but is not listed in data/catalog.json');
  }
}

if (errors.length) {
  console.error('Found ' + errors.length + ' problem(s):\n  - ' + errors.join('\n  - '));
  process.exit(1);
}
console.log('All ' + listed.size + ' topics look good.');
