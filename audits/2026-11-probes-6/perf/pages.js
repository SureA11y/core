// The pages the performance pass scans: core's composite fixture page, a
// page shaped like a real one (header, nav, articles with images, forms, a
// data table, a footer; about 6,000 elements), and a deep page.
const fs = require('fs');
const fixture = fs.readFileSync('/home/user/core/tests/fixtures/index.html', 'utf8');
function realistic() {
  const art = (i) => `<article><h2>Story ${i}</h2><p>By <a href="/a${i}">Author ${i}</a>, <time>2026-11-${(i % 28) + 1}</time></p><img src="data:," alt="Photo ${i}" width="300" height="200"><p>${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(4)}<a href="/s${i}">Read more</a></p><ul>${Array.from({ length: 5 }, (_, j) => `<li><a href="/t${i}-${j}">Tag ${j}</a></li>`).join('')}</ul></article>`;
  const table = `<table><caption>Prices</caption><tr><th>Item</th><th>Price</th></tr>${Array.from({ length: 40 }, (_, r) => `<tr><td>Item ${r}</td><td>${r}.00</td></tr>`).join('')}</table>`;
  const form = `<form><label>Name <input name="n"></label><label>Email <input type="email" name="e"></label><select aria-label="Topic"><option>A</option><option>B</option></select><textarea aria-label="Message"></textarea><button>Send</button></form>`;
  const nav = `<nav aria-label="Main"><ul>${Array.from({ length: 30 }, (_, i) => `<li><a href="/n${i}">Section ${i}</a></li>`).join('')}</ul></nav>`;
  return `<!doctype html><html lang="en"><head><title>News</title><style>body{font:16px/1.5 sans-serif;margin:0} header,footer{background:#222;color:#fff;padding:1em} main{max-width:900px;margin:auto} img{max-width:100%;height:auto}</style></head><body><a href="#m" class="skip">Skip to content</a><header><h1>The News</h1>${nav}</header><main id="m">${Array.from({ length: 120 }, (_, i) => art(i)).join('')}${table}${form}</main><footer><p>Footer</p>${nav.replace('Main', 'Footer')}</footer></body></html>`;
}
const deep = (() => { let s = ''; for (let i = 0; i < 100; i++) s += '<div>'.repeat(60) + `<p>Item ${i}</p>` + '</div>'.repeat(60); return `<!doctype html><html lang="en"><head><title>Deep</title></head><body><main><h1>Deep</h1>${s}</main></body></html>`; })();
module.exports = { fixture, realistic: realistic(), deep };
