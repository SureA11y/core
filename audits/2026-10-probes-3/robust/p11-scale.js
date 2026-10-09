// Scale in Chromium: HEAD bundle vs the published 1.10.0 bundle on the same
// generated pages. Pages that need more than the parser gives (deep nesting,
// nested shadow roots) are built by a script in the page.
// usage: node p11-scale.js [caseName] [--only-head]
const h = require('./harness');
const path = require('path');
const OLD = process.env.OLD_BUNDLE || path.join(process.env.SCRATCH || '', 'pkg110/package/surea11y.browser.js');
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const wrap = (body, script = '') => `<!doctype html><html lang="en"><head><title>scale</title></head><body><main><h1>H</h1>${body}</main><script>${script}</script></body></html>`;
const CASES = {
  flatDivs50k: () => wrap(rep(50000, (i) => `<div>item ${i}</div>`)),
  flatDivs200k: () => wrap(rep(200000, (i) => `<div>i${i}</div>`)),
  mixed20k: () => wrap(rep(20000, (i) => `<p>Para ${i} <a href="/p${i}">more</a> <button>B${i % 7}</button> <img src="x${i % 50}.png" alt="${i % 3 ? 'photo' : ''}"></p>`)),
  // deep5000 removed: Chromium itself does not finish laying out 600+ levels of alternating div/span (p15c); see p15 for plain deep chains.
  deepInButton3000: () => wrap('<button id="b"></button>', `let n=document.getElementById('b');for(let i=0;i<3000;i++){const d=document.createElement('span');n.appendChild(d);n=d}n.textContent='deep name'`),
  nestedShadow2000: () => wrap('<div id="root"></div>', `let host=document.getElementById('root');for(let i=0;i<2000;i++){const r=host.attachShadow({mode:'open'});const d=document.createElement('div');r.appendChild(d);host=d}host.innerHTML='<button></button><img src=q>'`),
  buttonOverNestedShadow2000: () => wrap('<button id="b"><span id="root"></span></button>', `let host=document.getElementById('root');for(let i=0;i<2000;i++){const r=host.attachShadow({mode:'open'});const d=document.createElement('span');r.appendChild(d);host=d}host.innerHTML='<img alt="Deep">'`),
  shadowIconButtons5000: () => wrap(rep(5000, (i) => `<button><x-ic></x-ic></button>`), `customElements.define('x-ic',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<svg aria-hidden=true><path d=M0/></svg><span class=l>Label</span><img alt="">'}})`),
  linksOverBigShadow1000: () => wrap(rep(1000, (i) => `<a href="/c${i}"><x-card></x-card></a>`), `customElements.define('x-card',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<div>'+'<span>w</span>'.repeat(400)+'</div>'}})`),
  iframes500: () => wrap(rep(500, (i) => `<iframe title="f${i}" srcdoc="<button></button><p>f${i}</p>"></iframe>`)),
  table300x100: () => wrap('<table><thead><tr>' + rep(100, (c) => `<th>C${c}</th>`) + '</tr></thead><tbody>' + rep(300, (r) => '<tr>' + rep(100, (c) => `<td>${r}.${c}</td>`) + '</tr>') + '</tbody></table>'),
  text10MB: () => wrap('<p id="p"></p>', `document.getElementById('p').textContent='lorem ipsum '.repeat(870000)`),
  svg50k: () => wrap('<svg width="1000" height="1000" role="img" aria-label="chart">' + rep(50000, (i) => `<rect x="${i % 1000}" y="${(i / 1000) | 0}" width="1" height="1" fill="#${(i % 4096).toString(16).padStart(3, '0')}"/>`) + '</svg>'),
  ids20kAria: () => wrap(rep(20000, (i) => `<span id="l${i}">L${i}</span><input aria-labelledby="l${i} l${(i + 1) % 20000}" aria-describedby="l${(i * 7) % 20000}">`)),
  headings20k: () => wrap(rep(20000, (i) => `<h${(i % 6) + 1}>Heading ${i}</h${(i % 6) + 1}>`)),
  slots5000: () => wrap(rep(5000, (i) => `<x-s><span slot="a">A${i}</span>B</x-s>`), `customElements.define('x-s',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<button><slot name=a></slot></button><slot>fb</slot>'}})`),
  contrast40k: () => wrap(rep(40000, (i) => `<p style="color:#${i % 2 ? '777' : '333'};background:#fff">t${i}</p>`)),
};
(async () => {
  const only = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2].split(',') : null;
  const reps = Number(process.env.REPS || 1);
  const onlyHead = process.argv.includes('--only-head');
  for (const [name, gen] of Object.entries(CASES)) {
    if (only && !only.includes(name)) continue;
    const html = gen();
    const row = { name, htmlMB: +(html.length / 1e6).toFixed(1) };
    for (let rep = 0; rep < reps; rep++) for (const [label0, bundle] of onlyHead ? [['head', h.BUNDLE]] : [['head', h.BUNDLE], ['v1.10.0', OLD]]) {
      const label = reps > 1 ? label0 + '#' + rep : label0;
      const r = await h.runChromium(html, { perfStats: true, profileRules: true }, { bundle, timeoutMs: 300000 });
      if (r.err) { row[label] = (r.hung ? 'HANG ' : 'ERR ') + r.err.slice(0, 160); continue; }
      const rt = (r.r.perfStats && r.r.perfStats.ruleTimings) || {};
      const top = Object.entries(rt).map(([k, v]) => [k, typeof v === 'number' ? v : (v && (v.ms || v.total || v.totalMs)) || 0]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => k + '=' + Math.round(v));
      const errs = r.r.checksResults.filter((c) => c.error).map((c) => c.ruleId + ':' + String(c.error).slice(0, 60));
      row[label] = { ms: Math.round(r.ms), top, errs: errs.slice(0, 4), nErr: errs.length };
    }
    console.log(JSON.stringify(row));
  }
  await h.closeBrowser();
})();
