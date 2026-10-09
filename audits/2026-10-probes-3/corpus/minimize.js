'use strict';
// Shrinks a fuzz case to a small repro that still makes <ruleId> error.
// usage: node minimize.js <seed> <ruleId> [errorSubstring]
// Prints the minimised HTML (and the shadow-root content if one is needed).
const path = require('node:path');
const ROOT = path.resolve(__dirname, '../../..');
const { createDom, runa11yCoreOnDom } = require(path.join(ROOT, 'src/testing.js'));
const { JSDOM } = require('jsdom');
const Module = require('node:module');

console.warn = () => {};
const [seedArg, ruleId, needle] = process.argv.slice(2);

// reuse the generator by loading fuzz.js's gen() through a tiny shim
const fs = require('node:fs');
const src = fs.readFileSync(path.join(__dirname, 'fuzz.js'), 'utf8').split('// Silence the engine')[0];
const m = new Module(path.join(__dirname, 'fuzz-gen.js'));
m.paths = Module._nodeModulePaths(__dirname);
m.filename = path.join(__dirname, 'fuzz.js');
process.argv[2] = '1';
m._compile(src + '\nmodule.exports = { gen };', m.filename);
const { gen } = m.exports;

function fails(doc) {
  const dom = createDom(doc.html);
  const els = Array.from(dom.window.document.body ? dom.window.document.body.querySelectorAll('*') : []);
  for (const [idx, inner] of doc.shadows) {
    if (!els.length) break;
    try { els[idx % els.length].attachShadow({ mode: 'open' }).innerHTML = inner; } catch {}
  }
  let res;
  const t0 = performance.now();
  try {
    res = runa11yCoreOnDom(dom, { engineOptions: { optInRules: 'all' }, runOnly: ruleId === 'THROW' ? null : { includeRuleIds: [ruleId] }, entryPointParity: false });
  } catch (e) {
    try { dom.window.close(); } catch {}
    return ruleId === 'THROW' && (!needle || String(e).includes(needle));
  }
  try { dom.window.close(); } catch {}
  // SLOW_MS=n: keep a candidate while the rule alone takes longer than n ms
  if (process.env.SLOW_MS) return performance.now() - t0 > Number(process.env.SLOW_MS);
  const c = res.checksResults.find((x) => x.ruleId === ruleId);
  return !!(c && c.error && (!needle || c.error.includes(needle)));
}

function shrinkHtml(html, keep) {
  // element-level then attribute-level greedy removal on the parsed tree
  const dom = new JSDOM(html);
  let tries = 0;
  const keep0 = keep;
  keep = (h) => { if (++tries > 4000) return false; return keep0(h); };
  let changed = true;
  const ser = () => '<!doctype html>' + dom.window.document.documentElement.outerHTML;
  while (changed) {
    changed = false;
    const all = Array.from(dom.window.document.querySelectorAll('body *, head *'));
    for (const el of all) {
      if (!el.isConnected) continue;
      const parent = el.parentNode;
      const next = el.nextSibling;
      // try removing whole element
      parent.removeChild(el);
      if (keep(ser())) { changed = true; continue; }
      parent.insertBefore(el, next);
      // try unwrapping (keep children)
      const kids = Array.from(el.childNodes);
      if (kids.length) {
        for (const k of kids) parent.insertBefore(k, el);
        parent.removeChild(el);
        if (keep(ser())) { changed = true; continue; }
        parent.insertBefore(el, kids[0]);
        for (const k of kids) el.appendChild(k);
      }
    }
    for (const el of Array.from(dom.window.document.querySelectorAll('*'))) {
      for (const a of Array.from(el.attributes)) {
        el.removeAttribute(a.name);
        if (keep(ser())) { changed = true; continue; }
        el.setAttribute(a.name, a.value);
      }
    }
    const walker = dom.window.document.createTreeWalker(dom.window.document, 4);
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    for (const t of texts) {
      const v = t.data;
      if (!v) continue;
      t.data = '';
      if (keep(ser())) { changed = true; continue; }
      t.data = v;
    }
  }
  return ser();
}

const doc = gen(Number(seedArg));
if (!fails(doc)) {
  console.log('does not reproduce');
  process.exit(1);
}
// drop shadow roots that are not needed
let shadows = doc.shadows.slice();
for (let i = shadows.length - 1; i >= 0; i--) {
  const t = shadows.filter((_, j) => j !== i);
  if (fails({ html: doc.html, shadows: t })) shadows = t;
}
let html;
if (!shadows.length) {
  html = shrinkHtml(doc.html, (h) => fails({ html: h, shadows: [] }));
  console.log(html);
} else {
  // shadow case: shrink each shadow inner with host fixed by index as generated
  html = doc.html;
  console.log('HOST DOC (not shrunk):', html.length, 'chars; shadows needed:', shadows.length);
  for (let i = 0; i < shadows.length; i++) {
    const inner = shrinkHtml(`<!doctype html><html><body>${shadows[i][1]}</body></html>`, (h) => {
      const body = new JSDOM(h).window.document.body.innerHTML;
      const s = shadows.slice();
      s[i] = [shadows[i][0], body];
      return fails({ html, shadows: s });
    });
    console.log('SHADOW', i, new JSDOM(inner).window.document.body.innerHTML);
  }
}
