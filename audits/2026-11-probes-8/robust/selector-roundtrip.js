'use strict';
// Invariant: an occurrence's selector (with shadowHostSelectors) resolves to an element whose snippet is o.html.
// node selector-roundtrip.js <gen|mut|fix|weird> from to
const fs = require('fs');
const L = require('./lib.js');
const G = require('./gen.js');
console.warn = () => {};
const [mode, from, to] = [process.argv[2], +process.argv[3], +process.argv[4]];
const FIX = '/home/user/core-r8/tests/fixtures';
const fixtures = fs.readdirSync(FIX).filter((f) => f.endsWith('.html')).sort();
const WEIRD_IDS = ['a:b', '1abc', '-1', '--x', 'a.b', 'a b', 'a"b', "a'b", 'a\\b', 'a\nb', 'a#b', 'a[b]', 'é', '日本', '😀', 'a>b', 'a,b', '*', ' ', 'a\u0000b', '__proto__', 'constructor', ' lead', 'trail ', 'x'.repeat(300), '', '#', '.', '0', 'a\tb', 'a}b{', 'a/*b*/'];
function pageFor(i) {
  if (mode === 'gen') return G.make(i + 5000, { budget: 150, maxDepth: 6 });
  if (mode === 'fix') return fs.readFileSync(`${FIX}/${fixtures[i % fixtures.length]}`, 'utf8');
  if (mode === 'mut') return G.mutate(fs.readFileSync(`${FIX}/${fixtures[i % fixtures.length]}`, 'utf8'), i * 31 + 7);
  // weird: buttons/images with odd ids, classes, names, aria-labels, test ids
  const id = WEIRD_IDS[i % WEIRD_IDS.length];
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const attrs = ['id', 'class', 'name', 'aria-label', 'data-testid', 'data-test-id', 'data-cy', 'title'];
  let body = '';
  for (const a of attrs) body += `<button ${a}="${esc(id)}"></button><img ${a}="${esc(id)}" src="x.png"><div role="button" ${a}="${esc(id)}"></div><a ${a}="${esc(id)}" href="#"></a>`;
  body += `<div id="h"><template shadowrootmode="open"><button id="${esc(id)}"></button><img id="${esc(id)}" src="y"></template></div>`;
  return `<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main>${body}${body}</main></body></html>`;
}
let occ = 0, bad = 0, pages = 0;
const fails = {};
for (let i = from; i < to; i++) {
  const html = pageFor(i);
  let r, dom;
  try { ({ r, dom } = L.scanJsdom(html)); } catch (e) { console.log('THROW', i, e.message); continue; }
  pages++;
  const doc = dom.window.document;
  for (const c of r.checksResults) {
    for (const o of c.occurrences) {
      if (!o.selector || o.selector === 'html' && /FAIL_WITHOUT|page/i.test(o.summary)) continue;
      occ++;
      let root = doc, el = null, err = null;
      try {
        for (const h of o.shadowHostSelectors || []) { const host = root.querySelector(h); root = host && host.shadowRoot; if (!root) break; }
        el = root ? root.querySelector(o.selector) : null;
      } catch (e) { err = e.message; }
      let ok = !!el;
      if (el && o.html) {
        const oh = el.localName === 'html' || el.localName === 'body' || el.localName === 'head' ? el.outerHTML.slice(0, el.outerHTML.indexOf('>') + 1) : el.outerHTML;
        ok = oh.slice(0, 200) === o.html.slice(0, 200) || o.html.startsWith(oh.slice(0, 60)) || oh.startsWith(o.html.slice(0, 60));
      }
      if (!ok) {
        bad++;
        const key = c.ruleId + (err ? ' (invalid selector)' : el ? ' (wrong element)' : ' (no match)');
        (fails[key] = fails[key] || []).push({ i, sel: o.selector.slice(0, 150), hosts: o.shadowHostSelectors, html: (o.html || '').slice(0, 120), got: el ? el.outerHTML.slice(0, 120) : null, err });
      }
    }
  }
  try { dom.window.close(); } catch {}
}
console.log(JSON.stringify({ mode, pages, occurrences: occ, bad }));
for (const [k, v] of Object.entries(fails)) { console.log(v.length, k); for (const x of v.slice(0, 3)) console.log('   ', JSON.stringify(x)); }
