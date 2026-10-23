'use strict';
// node worker.js <mode> <startSeed> <count> <outfile>
// mode: gen | mutate
const fs = require('fs');
const path = require('path');
const { gen, rng } = require('./gen.js');
const { runCase } = require('./check.js');
const origWarn = console.warn;
console.warn = () => {};
console.error = () => {};

const [mode, start, count, out] = [process.argv[2], +process.argv[3], +process.argv[4], process.argv[5]];
const LOCALES = ['en', 'de', 'es', 'fr', 'ja'];
const FIX_DIR = '/home/user/core/tests/fixtures';
const fixtures = fs.readdirSync(FIX_DIR).filter((f) => f.endsWith('.html')).sort();
const { JSDOM } = require('/home/user/core/node_modules/jsdom');

function mutate(seed) {
  const r = rng(seed);
  const name = fixtures[seed % fixtures.length];
  const html = fs.readFileSync(path.join(FIX_DIR, name), 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const els = [...doc.querySelectorAll('*')];
  const nMut = 1 + r.int(12);
  const log = [];
  for (let i = 0; i < nMut && els.length; i++) {
    const el = r.pick(els);
    const attrs = [...el.attributes];
    const op = r.int(5);
    try {
      if (op === 0 && attrs.length) { const a = r.pick(attrs); el.removeAttribute(a.name); log.push(`drop ${a.name}`); }
      else if (op === 1 && attrs.length) { const a = r.pick(attrs); const t = r.pick(els); t.setAttribute(a.name, a.value); log.push(`dup ${a.name}`); }
      else if (op === 2 && attrs.length) { const a = r.pick(attrs); const t = r.pick(els); const ta = [...t.attributes]; if (ta.length) { const b = r.pick(ta); el.setAttribute(b.name, b.value); t.setAttribute(a.name, a.value); log.push(`swap ${a.name}<->${b.name}`); } }
      else if (op === 3) { const t = r.pick(els); if (!t.contains(el) && el !== doc.documentElement && el !== doc.body && el !== doc.head) { t.appendChild(el); log.push('move'); } }
      else if (attrs.length) { const a = r.pick(attrs); el.setAttribute(a.name, r.pick(['', ' ', '__proto__', 'x'.repeat(3000), a.value + ' ' + a.value, '-1', 'true'])); log.push(`val ${a.name}`); }
    } catch (e) {}
  }
  return { html: '<!doctype html>' + doc.documentElement.outerHTML, shadows: [], fixture: name, log };
}

const fd = fs.openSync(out, 'a');
for (let s = start; s < start + count; s++) {
  const r = rng(s * 7919 + 13);
  const c = mode === 'mutate' ? mutate(s) : gen(s);
  c.engineOptions = { locale: LOCALES[s % LOCALES.length] };
  if (r.chance(0.2)) c.engineOptions.includeHiddenElements = true;
  if (r.chance(0.1)) c.engineOptions.includeShadowDom = false;
  fs.writeFileSync(out + '.cur', String(s));
  let res;
  try {
    res = runCase(c, { determinism: true, parity: s % 10 === 0, profile: true });
  } catch (e) {
    res = { issues: [{ kind: 'harnessThrow', msg: String(e.stack).slice(0, 600) }], ms: 0 };
  }
  // per-rule slow
  const slowRules = [];
  if (res.ruleTimings) for (const [k, v] of Object.entries(res.ruleTimings)) if (typeof v === 'number' && v > 1000) slowRules.push([k, Math.round(v)]);
  const rec = { mode, seed: s, ms: Math.round(res.ms), len: c.html.length, locale: c.engineOptions.locale, opts: c.engineOptions, issues: res.issues, slowRules, fixture: c.fixture, top: res.ruleTimings ? Object.entries(res.ruleTimings).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => [k, Math.round(v)]) : null };
  fs.writeSync(fd, JSON.stringify(rec) + '\n');
}
fs.closeSync(fd);
