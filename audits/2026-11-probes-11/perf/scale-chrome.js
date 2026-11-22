'use strict';
// Scaling in Chromium. usage: node scale-chrome.js <shape> <n1,n2,..> [builds=r11] ; env REPS (3), RUNONLY
const http = require('node:http'); const fs = require('node:fs');
const { chromium } = require('/home/user/core-r11/node_modules/playwright');
const { words: wd, img } = require('./pages');
const w = (i) => wd(i, 2);
const IMG = img(1, 40, 30);
const S = {
  elements: (n) => `<div>${Array.from({ length: n / 2 }, (_, i) => `<div class=r${i % 9}><span>${w(i)}</span></div>`).join('')}</div>`,
  links: (n) => `<nav aria-label=All><ul>${Array.from({ length: n }, (_, i) => `<li><a href="/p/${i}">${w(i)} ${i}</a></li>`).join('')}</ul></nav>`,
  inlinelinks: (n) => Array.from({ length: n / 4 }, (_, i) => `<p>${w(i)} <a href="/a${i}">one</a> text <a href="/b${i}">two</a> and <a href="/c${i}">three</a>, <a href="/d${i}">four</a>.</p>`).join(''),
  fields: (n) => `<form>${Array.from({ length: n }, (_, i) => `<div><label for=f${i}>Field ${i}</label><input id=f${i} name=f${i} type=${['text', 'email', 'checkbox', 'radio'][i % 4]}></div>`).join('')}<button>Send</button></form>`,
  radios: (n) => `<form>${Array.from({ length: n }, (_, i) => `<label><input type=radio name=g${i % 50} value=${i}> ${w(i)}</label>`).join('')}</form>`,
  cells: (n) => `<table><caption>D</caption><thead><tr>${Array.from({ length: 8 }, (_, c) => `<th scope=col>H${c}</th>`).join('')}</tr></thead><tbody>${Array.from({ length: n / 8 }, (_, r) => `<tr><th scope=row>R${r}</th>${Array.from({ length: 7 }, (_, c) => `<td>${r * c}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
  images: (n) => `<ul>${Array.from({ length: n }, (_, i) => `<li><img src="${IMG}" alt="Photo ${i}" width=40 height=30></li>`).join('')}</ul>`,
  svgicons: (n) => Array.from({ length: n }, (_, i) => `<button aria-label="b${i}"><svg aria-hidden=true viewBox="0 0 10 10" width=16 height=16><path d="M0 0L10 10"/></svg></button>`).join(''),
  shadow: (n) => Array.from({ length: n }, (_, i) => `<x-card><template shadowrootmode=open><style>:host{display:block} button{color:#333}</style><div><slot name=t></slot><button>Buy</button><a href="/p/${i}"><slot></slot></a></div></template><span slot=t>${w(i)}</span>Details ${i}</x-card>`).join(''),
  depth: (n) => `<div id=root></div><script>{let p=document.getElementById('root');for(let i=0;i<${n};i++){const d=document.createElement(i%2?'div':'span');p.appendChild(d);p=d;}p.innerHTML='<a href="#">deep</a> text';}</script>`,
  rules: (n) => `<style>${Array.from({ length: n }, (_, i) => `.c${i} > span:hover, .c${i}:focus-within { color: #${(i % 4096).toString(16).padStart(3, '0')}; padding: ${i % 7}px } .c${i} a:focus{outline:none}`).join('\n')}</style>` + Array.from({ length: 1000 }, (_, i) => `<div class=c${i}><span>t${i}</span><a href=#>l</a></div>`).join(''),
  rulesmix: (n) => `<style>${Array.from({ length: n }, (_, i) => `.c${i} > span:hover, .c${i}:focus-within { color: #${(i % 4096).toString(16).padStart(3, '0')}; padding: ${i % 7}px }` + (i % 100 === 0 ? ` .c${i} a:focus{outline:none}` : '')).join('\n')}</style>` + Array.from({ length: 1000 }, (_, i) => `<div class=c${i}><span>t${i}</span><a href=#>l</a></div>`).join(''),
  focusrules: (n) => `<style>${Array.from({ length: n }, (_, i) => `.x${i}:focus{outline:none}`).join('\n')}</style>` + Array.from({ length: 200 }, (_, i) => `<div><a href=#>l${i}</a></div>`).join(''),
  wrap10: (n) => Array.from({ length: n }, (_, i) => '<div>'.repeat(10) + `<p>${w(i)}</p>` + '</div>'.repeat(10)).join(''),
  wrapdeep: (n) => '<div>'.repeat(n / 20) + Array.from({ length: 1000 }, (_, i) => `<p>${w(i)}</p>`).join('') + '</div>'.repeat(n / 20),
  sheets: (n) => Array.from({ length: n }, (_, i) => `<style>.s${i}{color:#333} .s${i}:focus{outline:2px solid}</style>`).join('') + Array.from({ length: 1000 }, (_, i) => `<div class=s${i}><a href=#>l${i}</a></div>`).join(''),
  textnodes: (n) => `<p id=tp></p><script>{const p=document.getElementById('tp');for(let i=0;i<${n};i++)p.appendChild(document.createTextNode('word'+i+' '));}</script>`,
  spans: (n) => `<p>${Array.from({ length: n }, (_, i) => `<span>${w(i)}</span> `).join('')}</p>`,
  ariaids: (n) => Array.from({ length: n / 2 }, (_, i) => `<span id=l${i}>Label ${i}</span><span id=d${i}>Desc ${i}</span><button aria-labelledby=l${i} aria-describedby="d${i} l${(i + 1) % (n / 2)}">x</button>`).join(''),
  dupids: (n) => Array.from({ length: n }, (_, i) => `<div id=d${i % (n / 2)}><span id=s${i}>x</span><label for=s${i}>l</label></div>`).join(''),
  headings: (n) => Array.from({ length: n }, (_, i) => `<section aria-labelledby=s${i}><h${(i % 5) + 2} id=s${i}>${w(i)} ${i}</h${(i % 5) + 2}><p>body</p></section>`).join(''),
  iframes: (n) => Array.from({ length: n }, (_, i) => `<iframe title=f${i} width=100 height=50 srcdoc="<p>x</p>"></iframe>`).join(''),
  lists: (n) => Array.from({ length: n / 10 }, (_, i) => `<ul>${Array.from({ length: 10 }, (_, j) => `<li>${w(i + j)}</li>`).join('')}</ul>`).join(''),
  ariawidgets: (n) => `<div role=tree aria-label=t>${Array.from({ length: n }, (_, i) => `<div role=treeitem aria-level=1 aria-selected=false tabindex=-1 aria-expanded=false>${w(i)}</div>`).join('')}</div>`,
  options: (n) => `<label>Pick <select>${Array.from({ length: n }, (_, i) => `<option value=${i}>${w(i)} ${i}</option>`).join('')}</select></label>`,
  paragraphs: (n) => Array.from({ length: n }, (_, i) => `<p>${wd(i, 30)}</p>`).join('')
};
module.exports = { S };
if (require.main !== module) return;
const [shape, sizes, builds = 'r11'] = process.argv.slice(2);
const BUILDS = builds.split(','); const REPS = Number(process.env.REPS || 3);
const bundles = Object.fromEntries(BUILDS.map((b) => [b, fs.readFileSync(`/home/user/core-${b}/surea11y.browser.js`)]));
const ns = sizes.split(',').map(Number);
const page = (n) => `<!doctype html><html lang=en><head><meta charset=utf-8><title>Scale ${shape}</title></head><body><header><a href=#main>Skip</a></header><main id=main><h1>Scale</h1>${S[shape](n)}</main></body></html>`;
const srv = http.createServer((req, res) => { const u = req.url; let m; if ((m = u.match(/^\/bundle\/(\w+)\.js$/))) { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(bundles[m[1]]); } res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(page(Number(u.slice(1)))); });
(async () => {
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  for (const n of ns) for (const b of BUILDS) {
    const runs = [];
    for (let rep = 0; rep < REPS; rep++) {
      const p = await ctx.newPage();
      await p.goto(`${base}/${n}`, { timeout: 120000 });
      await p.addScriptTag({ url: `${base}/bundle/${b}.js` });
      runs.push(await p.evaluate(async (ro) => {
        const els = document.getElementsByTagName('*').length;
        const t = performance.now();
        const r = await window.a11ycore.runa11yCoreInPage(null, null, { perfStats: true, profileRules: true }, ro ? ro.split(',') : null);
        const ps = r.perfStats || {};
        return { els, total: performance.now() - t, warm: ps.warmUpMs || 0, rt: ps.ruleTimings || {} };
      }, process.env.RUNONLY || null));
      await p.close();
    }
    runs.sort((a, c) => a.total - c.total);
    const m = runs[runs.length >> 1];
    const rules = Object.keys(m.rt);
    const medr = Object.fromEntries(rules.map((k) => [k, runs.map((r) => r.rt[k] || 0).sort((a, c) => a - c)[runs.length >> 1]]));
    const top = Object.entries(medr).sort((a, c) => c[1] - a[1]).slice(0, Number(process.env.TOP || 6)).map(([k, v]) => `${k}=${Math.round(v)}`);
    console.log(`${shape} n=${n} ${b} els=${m.els} total=${Math.round(m.total)} warm=${Math.round(m.warm)} top: ${top.join(' ')}`);
    if (process.env.JSON) fs.appendFileSync(process.env.JSON, JSON.stringify({ shape, n, b, total: m.total, warm: m.warm, rt: medr }) + '\n');
  }
  await browser.close(); srv.close();
})();
