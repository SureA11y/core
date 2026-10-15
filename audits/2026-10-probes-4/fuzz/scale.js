'use strict';
// Per-rule scaling: time each pattern at n, 2n, 4n; flag rules whose time ratio t(4n)/t(n) suggests super-linear growth.
const { createDom, runa11yCoreOnDom } = require('/home/user/core/src/testing.js');
console.warn = () => {};
const PATTERNS = {
  flatDivs: (n) => '<div>x</div>'.repeat(n),
  dupIds: (n) => '<span id="d">x</span>'.repeat(n),
  labelledbyChain: (n) => Array.from({ length: n }, (_, i) => `<span id="l${i}" aria-labelledby="l${(i + 1) % n} l${(i + 2) % n}">t${i}</span>`).join('') + Array.from({ length: n }, (_, i) => `<button aria-labelledby="l${i}"></button>`).join(''),
  ownsCycle: (n) => Array.from({ length: n }, (_, i) => `<div role="list" id="o${i}" aria-owns="o${(i + 1) % n}"><div role="listitem">x</div></div>`).join(''),
  manyLabelsSameFor: (n) => '<label for="f">L</label>'.repeat(n) + '<input id="f">',
  inputsWithLabels: (n) => Array.from({ length: n }, (_, i) => `<label for="i${i}">Name ${i}</label><input id="i${i}">`).join(''),
  bigTable: (n) => { const c = Math.ceil(Math.sqrt(n)); let s = '<table><tr>' + Array.from({ length: c }, (_, j) => `<th id="h${j}">H${j}</th>`).join('') + '</tr>'; for (let i = 0; i < c; i++) s += '<tr>' + Array.from({ length: c }, (_, j) => `<td headers="h${j}">${i}</td>`).join('') + '</tr>'; return s + '</table>'; },
  tableSpans: (n) => { let s = '<table>'; for (let i = 0; i < n / 4; i++) s += `<tr><th rowspan="65534" colspan="1000">a</th><td>b</td><td>c</td></tr>`; return s + '</table>'; },
  links: (n) => Array.from({ length: n }, (_, i) => `<a href="/p${i % 7}">Read more</a>`).join(''),
  headings: (n) => Array.from({ length: n }, (_, i) => `<h${1 + (i % 6)}>Heading ${i % 5}</h${1 + (i % 6)}>`).join(''),
  landmarks: (n) => Array.from({ length: n }, (_, i) => `<nav aria-label="n"><a href="#">x</a></nav><main>m</main><header>h</header>`).join(''),
  accesskeys: (n) => Array.from({ length: n }, (_, i) => `<button accesskey="a">b${i}</button>`).join(''),
  radios: (n) => Array.from({ length: n }, (_, i) => `<input type="radio" name="g" id="r${i}"><label for="r${i}">r</label>`).join(''),
  shadowHosts: null, // built via DOM below
  nestedLists: (n) => '<ul>' + Array.from({ length: n }, () => '<li>a<ul><li>b</li></ul></li>').join('') + '</ul>',
  inlineStyles: (n) => Array.from({ length: n }, (_, i) => `<p style="color:#${(i * 9973 % 0xffffff).toString(16).padStart(6, '0')};background:#fff;letter-spacing:0.01em !important">t</p>`).join(''),
  langs: (n) => Array.from({ length: n }, (_, i) => `<span lang="${['en', 'xx', 'fr', 'zz-QQ'][i % 4]}">t</span>`).join(''),
  activedescendant: (n) => `<div role="listbox" tabindex="0" aria-activedescendant="opt${n - 1}">` + Array.from({ length: n }, (_, i) => `<div role="option" id="opt${i}">o${i}</div>`).join('') + '</div>',
  describedbyAll: (n) => Array.from({ length: n }, (_, i) => `<input aria-label="x" aria-describedby="${Array.from({ length: 5 }, (_, k) => 'd' + ((i + k) % n)).join(' ')}"><span id="d${i}">d</span>`).join(''),
  wideText: (n) => '<p>' + 'word '.repeat(n * 50) + '</p>',
  svgs: (n) => Array.from({ length: n }, () => '<svg role="img"><title>t</title><circle r="1"/></svg>').join(''),
  iframes: (n) => Array.from({ length: n }, (_, i) => `<iframe title="t" srcdoc="<p>x</p>"></iframe>`).join(''),
  deepChain: (n) => '<div>'.repeat(n / 10) + 'x' + '</div>'.repeat(n / 10)
};

function shadow(dom, n) {
  const d = dom.window.document;
  for (let i = 0; i < n; i++) {
    const h = d.createElement('x-c');
    d.body.appendChild(h);
    const r = h.attachShadow({ mode: 'open' });
    r.innerHTML = '<button></button><img src=x><span id="s">t</span>';
  }
}

function time(html, n, isShadow) {
  const dom = createDom(`<!doctype html><html lang="en"><head><title>t</title></head><body><main>${html}</main></body></html>`);
  if (isShadow) shadow(dom, n);
  const engineOptions = { perfStats: true, profileRules: true };
  dom.window.__a11ycoreEngineOptions = engineOptions;
  const t = Date.now();
  const r = runa11yCoreOnDom(dom, { engineOptions, entryPointParity: false });
  const total = Date.now() - t;
  dom.window.close();
  return { total, rules: r.perfStats.ruleTimings, warm: r.perfStats.warmUpMs };
}

const base = +(process.argv[2] || 250);
const only = process.argv[3] ? process.argv[3].split(',') : Object.keys(PATTERNS);
for (const name of only) {
  const sizes = [base, base * 2, base * 4];
  const res = sizes.map((n) => time(PATTERNS[name] ? PATTERNS[name](n) : '', n, name === 'shadowHosts'));
  const flags = [];
  for (const k of Object.keys(res[2].rules)) {
    const a = res[0].rules[k], c = res[2].rules[k];
    if (c > 150 && c / Math.max(a, 1) > 7) flags.push(`${k}: ${a.toFixed(0)}->${res[1].rules[k].toFixed(0)}->${c.toFixed(0)}ms (x${(c / Math.max(a, 1)).toFixed(1)})`);
  }
  const topRules = Object.entries(res[2].rules).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}=${v.toFixed(0)}`);
  console.log(`${name}: total ${res.map((r) => r.total).join('/')}ms warm ${res.map((r) => (r.warm || 0).toFixed(0)).join('/')} top@4n ${topRules.join(' ')}`);
  for (const f of flags) console.log('   SUPERLINEAR ' + f);
}
