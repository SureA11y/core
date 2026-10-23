'use strict';
// Generic DOM-level delta minimiser. minimize(html, pred) -> smallest html with pred(html) true.
const { JSDOM } = require('/home/user/core/node_modules/jsdom');

function serialize(doc) {
  return '<!doctype html>' + doc.documentElement.outerHTML;
}

function minimize(html, pred, { log = false, maxRounds = 20 } = {}) {
  if (!pred(html)) throw new Error('predicate false on input');
  let cur = html;
  for (let round = 0; round < maxRounds; round++) {
    let changed = false;
    // Pass 1: remove elements (largest first), then unwrap
    for (const op of ['remove', 'unwrap', 'attr', 'text']) {
      let i = 0;
      for (;;) {
        const dom = new JSDOM(cur);
        const doc = dom.window.document;
        let cands;
        if (op === 'attr') {
          cands = [];
          for (const el of doc.querySelectorAll('*')) for (const a of el.attributes) cands.push([el, a.name]);
        } else if (op === 'text') {
          cands = [];
          const w = doc.createTreeWalker(doc.documentElement, 4);
          let n;
          while ((n = w.nextNode())) if (n.data.length > 1) cands.push(n);
        } else {
          cands = [...doc.querySelectorAll('body *, head *')];
        }
        if (i >= cands.length) break;
        const c = cands[i];
        if (op === 'remove') c.remove();
        else if (op === 'unwrap') c.replaceWith(...c.childNodes);
        else if (op === 'attr') c[0].removeAttribute(c[1]);
        else c.data = c.data.length > 40 ? c.data.slice(0, Math.floor(c.data.length / 2)) : c.data.slice(0, 1);
        const next = serialize(doc);
        let ok = false;
        try { ok = next !== cur && pred(next); } catch (e) { ok = false; }
        if (ok) {
          cur = next;
          changed = true;
          if (log) process.stderr.write(`${op} -> ${cur.length}\n`);
        } else i++;
      }
    }
    if (!changed) break;
  }
  return cur;
}

module.exports = { minimize };
