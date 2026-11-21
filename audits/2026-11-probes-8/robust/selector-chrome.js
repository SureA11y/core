'use strict';
// Chromium: every occurrence's selector, followed through shadowHostSelectors, finds exactly one element, and it is
// the element the occurrence's html snippet shows. Pages: shadow-heavy random trees, gen.js pages, weird ids.
// node selector-chrome.js <shadow|gen|mut> from to
const fs = require('fs');
const C = require('./chrome-lib.js');
const G = require('./gen.js');
const [mode, from, to] = [process.argv[2], +process.argv[3], +process.argv[4]];
const FIX = '/home/user/core-r8/tests/fixtures';
const fixtures = fs.readdirSync(FIX).filter((f) => f.endsWith('.html')).sort();
const IDS = ['a', 'a:b', '1x', 'a b', '__proto__', 'x"y', 'é', '😀', 'a.b', '', 'dup', 'dup', '-', 'constructor'];
function shadowPage(seed) {
  const R = G.rng(seed);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const leaf = () => pick(['<button></button>', '<img src="x.png">', '<a href="#"></a>', '<input>', '<div role="button" tabindex="0"></div>', '<span style="color:#aaa">low</span>', '<h2></h2>', '<button>ok</button>', '<select></select>', '<label>L<input></label>', '<div role="img"></div>', '<iframe></iframe>', '<li>x</li>']);
  function tree(d) {
    let s = '';
    const n = 1 + Math.floor(R() * 4);
    for (let i = 0; i < n; i++) {
      const r = R();
      const id = R() < 0.3 ? ` id="${pick(IDS).replace(/"/g, '&quot;')}"` : '';
      const cls = R() < 0.3 ? ` class="${pick(['c', 'c d', 'x', '1', 'a:b'])}"` : '';
      if (d < 6 && r < 0.35) {
        const tag = pick(['div', 'section', 'x-card', 'my-el', 'span', 'li']);
        s += `<${tag}${id}${cls}><template shadowrootmode="${R() < 0.9 ? 'open' : 'closed'}">${tree(d + 1)}${R() < 0.5 ? '<slot></slot>' : ''}${R() < 0.3 ? tree(d + 1) : ''}</template>${R() < 0.5 ? tree(d + 1) : ''}</${tag}>`;
      } else if (d < 6 && r < 0.6) {
        const tag = pick(['div', 'ul', 'nav', 'p', 'span', 'section']);
        s += `<${tag}${id}${cls}>${tree(d + 1)}</${tag}>`;
      } else s += leaf().replace(/^<(\w+)/, `<$1${id}${cls}`);
    }
    return s;
  }
  return `<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main>${tree(0)}${tree(0)}</main></body></html>`;
}
function pageFor(i) {
  if (mode === 'shadow') return shadowPage(i + 777);
  if (mode === 'gen') return G.make(i + 9000, { budget: 150, maxDepth: 7 });
  return G.mutate(fs.readFileSync(`${FIX}/${fixtures[i % fixtures.length]}`, 'utf8'), i * 131 + 3);
}
(async () => {
  const b = await C.launch();
  let occ = 0, bad = 0, pages = 0;
  const fails = {};
  for (let i = from; i < to; i++) {
    const ctx = await b.newContext();
    const p = await ctx.newPage();
    try {
      await p.setContent(pageFor(i), { timeout: 15000 });
      await p.evaluate(C.BUNDLE);
      const res = await p.evaluate(() => {
        const r = window.a11ycore.runa11yCoreInPage(null, null, {}, null);
        const out = { occ: 0, bad: [] };
        const short = (h) => String(h || '').replace(/\s+/g, ' ').slice(0, 50);
        for (const c of r.checksResults) {
          for (const o of c.occurrences) {
            if (!o.selector) continue;
            out.occ++;
            let root = document, n = -1, el = null, err = null;
            try {
              for (const h of o.shadowHostSelectors || []) {
                const hs = root.querySelectorAll(h);
                if (hs.length !== 1) { err = 'host ' + h + ' matched ' + hs.length; root = null; break; }
                root = hs[0].shadowRoot;
                if (!root) { err = 'host has no open shadow root'; break; }
              }
              if (root) { const all = root.querySelectorAll(o.selector); n = all.length; el = all[0]; }
            } catch (e) { err = e.message; }
            let ok = !err && n === 1;
            if (ok && o.html) {
              const oh = /^(html|body|head)$/.test(el.localName) ? el.outerHTML.slice(0, el.outerHTML.indexOf('>') + 1) : el.outerHTML;
              ok = short(oh) === short(o.html) || short(o.html).startsWith(short(oh).slice(0, 30)) || short(oh).startsWith(short(o.html).slice(0, 30));
              if (!ok) err = 'wrong element';
            }
            if (!ok) out.bad.push({ rule: c.ruleId, sel: o.selector.slice(0, 160), hosts: o.shadowHostSelectors, n, err, html: short(o.html), got: el ? short(el.outerHTML) : null });
          }
        }
        return out;
      });
      pages++; occ += res.occ; bad += res.bad.length;
      for (const x of res.bad) { const k = x.rule + ' ' + (x.err || 'n=' + x.n).replace(/\d+/g, 'N').slice(0, 60); (fails[k] = fails[k] || []).push({ i, ...x }); }
    } catch (e) { console.log('THROW', i, String(e.message).slice(0, 200)); }
    await ctx.close();
  }
  console.log(JSON.stringify({ mode, from, to, pages, occurrences: occ, bad }));
  for (const [k, v] of Object.entries(fails)) { console.log(v.length, k); for (const x of v.slice(0, 3)) console.log('   ', JSON.stringify(x).slice(0, 500)); }
  await b.close();
})();
