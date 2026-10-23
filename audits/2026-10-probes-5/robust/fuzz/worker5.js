'use strict';
// node worker5.js <mode> <startSeed> <count> <outfile>   (mode: gen | mutate)
const fs = require('fs');
const path = require('path');
const { gen, rng } = require('./gen5.js');
const { runCase5 } = require('./check5.js');
console.warn = () => {}; console.error = () => {}; console.info = () => {};
const [mode, start, count, out] = [process.argv[2], +process.argv[3], +process.argv[4], process.argv[5]];
const LOCALES = ['en', 'de', 'es', 'fr', 'ja'];
const FIX_DIR = '/home/user/core/tests/fixtures';
const fixtures = fs.readdirSync(FIX_DIR).filter((f) => f.endsWith('.html')).sort();
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const PROTO = ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf'];
function mutate(seed) {
  const r = rng(seed);
  const name = fixtures[seed % fixtures.length];
  const dom = new JSDOM(fs.readFileSync(path.join(FIX_DIR, name), 'utf8'));
  const doc = dom.window.document;
  const els = [...doc.querySelectorAll('*')];
  for (let i = 0, n = 1 + r.int(12); i < n && els.length; i++) {
    const el = r.pick(els); const attrs = [...el.attributes]; const op = r.int(6);
    try {
      if (op === 0 && attrs.length) el.removeAttribute(r.pick(attrs).name);
      else if (op === 1 && attrs.length) { const a = r.pick(attrs); r.pick(els).setAttribute(a.name, a.value); }
      else if (op === 2) { const t = r.pick(els); if (!t.contains(el) && el !== doc.documentElement && el !== doc.body && el !== doc.head) t.appendChild(el); }
      else if (op === 3) el.setAttribute(r.pick(['id', 'lang', 'role', 'aria-owns', 'aria-controls', 'for', 'aria-errormessage', 'aria-live', 'aria-labelledby', 'headers', 'autocomplete']), r.pick(PROTO));
      else if (attrs.length) { const a = r.pick(attrs); el.setAttribute(a.name, r.pick(['', ' ', '__proto__', 'constructor', 'x'.repeat(3000), a.value + ' ' + a.value, '-1', 'true'])); }
    } catch (e) {}
  }
  return { html: '<!doctype html>' + doc.documentElement.outerHTML, shadows: [], fixture: name };
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
  try { res = runCase5(c, s); } catch (e) { res = { issues: [{ kind: 'harnessThrow', msg: String(e.stack).slice(0, 600) }], ms: 0 }; }
  const slowRules = [];
  if (res.ruleTimings) for (const [k, v] of Object.entries(res.ruleTimings)) if (typeof v === 'number' && v > 1000) slowRules.push([k, Math.round(v)]);
  fs.writeSync(fd, JSON.stringify({ mode, seed: s, ms: Math.round(res.ms), len: c.html.length, opts: c.engineOptions, issues: res.issues, slowRules, fixture: c.fixture }) + '\n');
}
fs.closeSync(fd);
process.exit(0);
