'use strict';
// Scan time vs page size for realistic page shapes, Chromium, with per-rule timings.
// usage: node perf-scale.js <shape> <n1,n2,n3> [core dir]
const { serve, launch, addBundle } = require('./lib');

const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'kappa', 'sigma', 'theta'];
const w = (i) => words[i % 8] + ' ' + words[(i * 7) % 8];
const shapes = {
  // a data table, N rows x 8 cols
  table: (n) => `<table><caption>Data</caption><thead><tr>${Array.from({ length: 8 }, (_, c) => `<th scope=col>H${c}</th>`).join('')}</tr></thead><tbody>${Array.from({ length: n }, (_, r) => `<tr><th scope=row>R${r}</th>${Array.from({ length: 7 }, (_, c) => `<td>${r * c}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
  // broken / not-yet-loaded images (lazy-load placeholders without src)
  lazyimgs: (n) => `<ul class=products>${Array.from({ length: n }, (_, i) => `<li><img data-src="/i/${i}.jpg" alt="Product ${i}" width=200 height=200><a href="/p/${i}">${w(i)}</a></li>`).join('')}</ul>`,
  // web components: declarative open shadow roots
  shadow: (n) => Array.from({ length: n }, (_, i) => `<x-card><template shadowrootmode=open><style>:host{display:block} button{color:#333}</style><div class=c><slot name=t></slot><button part=b>Buy</button><a href="/p/${i}"><slot></slot></a></div></template><span slot=t>${w(i)}</span>Details ${i}</x-card>`).join(''),
  // nested components
  nestedShadow: (n) => Array.from({ length: n / 4 }, (_, i) => `<x-a><template shadowrootmode=open><x-b><template shadowrootmode=open><x-c><template shadowrootmode=open><button>in ${i}</button><slot></slot></template><slot></slot></x-c></template><slot></slot></x-b></template><a href=#>l${i}</a></x-a>`).join(''),
  // a long list of links
  links: (n) => `<nav aria-label="All"><ul>${Array.from({ length: n }, (_, i) => `<li><a href="/p/${i}">${w(i)} ${i}</a></li>`).join('')}</ul></nav>`,
  // product cards (img, heading, price, button, link)
  cards: (n) => `<div class=grid>${Array.from({ length: n }, (_, i) => `<article class=card><img src="${process.env.IMGSRC || "/i/" + i + ".png"}" alt="Product ${i}"><h3 id=h${i}>${w(i)}</h3><p class=price>$${i}.99</p><button aria-describedby=h${i}>Add to cart</button><a href="/p/${i}">Details<span class=sr>${w(i)}</span></a></article>`).join('')}</div>`,
  // a long form
  form: (n) => `<form>${Array.from({ length: n }, (_, i) => `<div class=row><label for=f${i}>Field ${i}</label><input id=f${i} name=f${i} autocomplete=off aria-describedby=d${i}><span id=d${i}>hint ${i}</span></div>`).join('')}<button>Send</button></form>`,
  // many paragraphs of text with inline links
  article: (n) => Array.from({ length: n }, (_, i) => `<p>${w(i)} text ${i} with <a href="#x${i}">inline link</a> and <em>emphasis</em> more words here.</p>`).join(''),
  // many style rules
  styles: (n) => `<style>${Array.from({ length: n }, (_, i) => `.c${i} > span:hover, .c${i}:focus-within { color: #${(i % 4096).toString(16).padStart(3, '0')}; padding: ${i % 7}px }`).join('\n')}</style>` + Array.from({ length: 2000 }, (_, i) => `<div class=c${i}><span>t${i}</span><a href=#>l</a></div>`).join(''),
  // many separate stylesheets
  sheets: (n) => Array.from({ length: n }, (_, i) => `<style>.s${i}{color:#333} .s${i}:focus{outline:2px solid}</style>`).join('') + Array.from({ length: 2000 }, (_, i) => `<div class=s${i % n}><a href=#>l${i}</a></div>`).join(''),
  // headings and sections
  headings: (n) => Array.from({ length: n }, (_, i) => `<section aria-labelledby=s${i}><h${(i % 5) + 2} id=s${i}>${w(i)} ${i}</h${(i % 5) + 2}><p>body</p></section>`).join(''),
  // listbox/tree style ARIA widgets
  aria: (n) => `<div role=tree aria-label=t>${Array.from({ length: n }, (_, i) => `<div role=treeitem aria-level=1 aria-selected=false tabindex=-1 aria-expanded=false>${w(i)}</div>`).join('')}</div>`,
  // select options
  select: (n) => `<label>Pick <select>${Array.from({ length: n }, (_, i) => `<option value=${i}>${w(i)} ${i}</option>`).join('')}</select></label>`,
  // many ids (and duplicates)
  ids: (n) => Array.from({ length: n }, (_, i) => `<div id=d${i % (n / 2)}><span id=s${i}>x</span><label for=s${i}>l</label></div>`).join(''),
  // deep but realistic nesting: n/50 groups of 50-level nested divs
  nest: (n) => Array.from({ length: n / 50 }, (_, i) => '<div>'.repeat(50) + `<a href=#>${i}</a>` + '</div>'.repeat(50)).join(''),
  // text nodes: many spans in one paragraph
  spans: (n) => `<p>${Array.from({ length: n }, (_, i) => `<span>${w(i)}</span> `).join('')}</p>`,
  // SVG icons
  svg: (n) => Array.from({ length: n }, (_, i) => `<button aria-label="b${i}"><svg aria-hidden=true viewBox="0 0 10 10"><path d="M0 0L10 10"/></svg></button>`).join(''),
  // many iframes
  iframes: (n) => Array.from({ length: n }, (_, i) => `<iframe title=f${i} srcdoc="<p>x</p>"></iframe>`).join('')
};

const [shape, sizes, core] = process.argv.slice(2);
if (core) process.env.CORE = core;
(async () => {
  const pages = {};
  const ns = sizes.split(',').map(Number);
  for (const n of ns) pages['/' + n] = { body: `<!doctype html><html lang=en><head><meta charset=utf-8><title>Perf ${shape}</title></head><body><header><a href=#main>Skip</a></header><main id=main><h1>Perf</h1>${shapes[shape](n)}</main></body></html>` };
  const { serve: srv } = require('./lib');
  const s = await srv(pages);
  const { browser, context } = await launch();
  for (const n of ns) {
    const page = await context.newPage();
    await page.goto(s.base + '/' + n);
    await addBundle(page, s.base);
    if (process.env.RUNONLY) await page.evaluate((r) => { window.__RUNONLY = r.split(','); }, process.env.RUNONLY);
    const r = await page.evaluate(async () => {
      const els = document.getElementsByTagName('*').length;
      const t = performance.now();
      const r = await window.a11ycore.runa11yCoreInPage(null, null, { perfStats: true, profileRules: true }, window.__RUNONLY || null);
      const total = performance.now() - t;
      const rt = (r.perfStats && r.perfStats.ruleTimings) || (r.engine && r.engine.perfStats && r.engine.perfStats.ruleTimings) || {};
      const top = Object.entries(rt).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k}=${Math.round(v)}`);
      const heap = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : 0;
      return { els, total: Math.round(total), warm: r.perfStats && Math.round(r.perfStats.warmUpMs), top, heap };
    });
    console.log(`${shape} n=${n} els=${r.els} total=${r.total}ms warm=${r.warm} heap=${r.heap}MB top: ${r.top.join(' ')}`);
    await page.close();
  }
  await browser.close();
  s.close();
})();
