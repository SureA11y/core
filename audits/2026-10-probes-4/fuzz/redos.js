'use strict';
// Long adversarial strings in every text-bearing slot; flag per-rule time growth (n vs 4n).
const { createDom, runa11yCoreOnDom } = require('/home/user/core/src/testing.js');
console.warn = () => {};
const PAYLOADS = {
  spaces: (n) => 'a' + ' '.repeat(n) + '!',
  words: (n) => 'word '.repeat(n / 5),
  dots: (n) => 'a.'.repeat(n / 2) + '!',
  dashes: (n) => '-'.repeat(n) + 'x',
  digits: (n) => 'IMG_' + '1'.repeat(n) + '.jpgx',
  url: (n) => 'http://' + 'a/'.repeat(n / 2) + ' x',
  braces: (n) => '{{'.repeat(n / 2),
  mixed: (n) => 'Aa1-_. '.repeat(n / 7) + '\u0000',
  colon: (n) => 'a:'.repeat(n / 2) + '(',
  unicode: (n) => 'é́'.repeat(n / 2) + '!',
  ctrlKeys: (n) => 'Ctrl+'.repeat(n / 5) + ' ',
  tokens: (n) => 'section-a '.repeat(n / 10) + 'email x'
};
const SLOTS = {
  alt: (p) => `<img src="a.png" alt="${p}">`,
  ariaLabel: (p) => `<button aria-label="${p}">Go</button>`,
  linkText: (p) => `<a href="/x">${p}</a>`,
  title: (p) => `<iframe title="${p}"></iframe><abbr title="${p}">x</abbr>`,
  placeholder: (p) => `<input placeholder="${p}">`,
  label: (p) => `<label for="i">${p}</label><input id="i" aria-label="${p}x">`,
  heading: (p) => `<h2>${p}</h2><p><b style="font-size:30px">${p}</b></p>`,
  lang: (p) => `<p lang="${p}">x</p>`,
  autocomplete: (p) => `<input autocomplete="${p}" aria-label="n">`,
  style: (p) => `<p style="color:${p};letter-spacing:${p}">x</p>`,
  accesskey: (p) => `<button accesskey="${p}">a</button><button accesskey="${p}">b</button>`,
  keyshortcuts: (p) => `<button aria-keyshortcuts="${p}">a</button>`,
  srcset: (p) => `<img alt="x" srcset="${p}" src="${p}">`,
  role: (p) => `<div role="${p}">x</div>`,
  idref: (p) => `<div aria-labelledby="${p}" role="dialog">x</div>`,
  pageTitle: null,
  metaViewport: (p) => `<meta name="viewport" content="${p}">`,
  metaRefresh: (p) => `<meta http-equiv="refresh" content="${p}">`,
  roledesc: (p) => `<button aria-roledescription="${p}">a</button>`,
  valuetext: (p) => `<div role="slider" aria-valuenow="5" aria-valuetext="${p}" aria-label="${p}">x</div>`
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function run(body, title) {
  const dom = createDom(`<!doctype html><html lang="en"><head><title>${title}</title>${body.startsWith('<meta') ? body : ''}</head><body><main>${body.startsWith('<meta') ? '' : body}</main></body></html>`);
  const eo = { perfStats: true, profileRules: true };
  const t = Date.now();
  const r = runa11yCoreOnDom(dom, { engineOptions: eo, entryPointParity: false });
  const tot = Date.now() - t;
  const errs = r.checksResults.filter((c) => c.error).map((c) => c.ruleId + ':' + String(c.error).slice(0, 100));
  dom.window.close();
  return { tot, rt: r.perfStats.ruleTimings, errs };
}
const N = +(process.argv[2] || 5000);
for (const [sn, slot] of Object.entries(SLOTS)) {
  for (const [pn, pay] of Object.entries(PAYLOADS)) {
    const mk = (n) => (slot ? [slot(esc(pay(n))), 't'] : ['<p>x</p>', esc(pay(n))]);
    const a = run(...mk(N));
    const b = run(...mk(N * 4));
    const flags = [];
    for (const k of Object.keys(b.rt)) {
      const x = a.rt[k], y = b.rt[k];
      if (y > 100 && y / Math.max(x, 1) > 8) flags.push(`${k} ${x.toFixed(0)}->${y.toFixed(0)}ms`);
    }
    const errs = [...new Set([...a.errs, ...b.errs])];
    if (flags.length || errs.length || b.tot > 5000) console.log(`${sn}/${pn}: total ${a.tot}->${b.tot}ms ${flags.join('; ')} ${errs.length ? 'ERR ' + errs.join(' ; ') : ''}`);
  }
}
console.log('redos done');
