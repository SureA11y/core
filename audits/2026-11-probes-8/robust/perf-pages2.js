'use strict';
// Page generators aimed at rules changed since round 7.
const { wrap } = require('./perf-pages.js');
const kinds = {
  // a product grid: realistic e-commerce page, n ~ elements
  grid(n) {
    let s = '<ul class="grid">';
    for (let i = 0; i < Math.ceil(n / 12); i++) s += `<li class="card"><article aria-labelledby="t${i}"><a href="/p/${i}"><img src="/i${i}.jpg" alt="Product ${i}"></a><h3 id="t${i}">Product ${i}</h3><p class="price"><b>$${i}.99</b></p><button aria-label="Add Product ${i} to cart">Add</button><button aria-pressed="false" aria-label="Favourite">♥</button></article></li>`;
    return wrap(s + '</ul>', '<style>.grid{display:grid;grid-template-columns:repeat(4,1fr)} header{position:sticky;top:0;background:#fff;height:60px} .cookie{position:fixed;bottom:0;height:40px;width:100%;background:#eee}</style>').replace('</body>', '<div class="cookie"><button>OK</button></div></body>');
  },
  // repeated cards that reuse an id and refer to it
  dupcards(n) {
    let s = '';
    for (let i = 0; i < Math.ceil(n / 3); i++) s += `<div class="card"><h3 id="title">Card ${i}</h3><a href="/p${i}" aria-labelledby="title">Open</a></div>`;
    return wrap(s);
  },
  // sticky header + fixed footer + many focusables (focus-not-obscured)
  sticky(n) {
    let s = '';
    for (let i = 0; i < Math.ceil(n / 3); i++) s += `<p>Row ${i} <a href="/r${i}">link</a> <input aria-label="f${i}"></p>`;
    return wrap(s, '<style>header{position:sticky;top:0;background:#fff;height:80px;z-index:2} .bar{position:fixed;bottom:0;left:0;right:0;height:60px;background:#333} .side{position:fixed;right:0;top:100px;width:50px;height:300px;background:#ccc}</style>').replace('</body>', '<div class="bar"><button>Chat</button></div><div class="side"><a href="/s">S</a></div></body>');
  },
  // lists in many contexts (listitem-parent-valid)
  lists(n) {
    let s = '';
    for (let i = 0; i < Math.ceil(n / 6); i++) s += [`<ul><li>a</li><li>b</li></ul>`, `<ul role="list"><li>a</li><li>b</li></ul>`, `<ul role="group"><li>a</li></ul>`, `<div role="list"><div role="listitem">x</div></div>`, `<ol role="navigation"><li>n</li></ol>`, `<menu><li>m</li></menu>`][i % 6];
    return wrap(s);
  },
  // bold leading paragraphs and short bold paragraphs (p-as-heading)
  bold(n) {
    let s = '';
    for (let i = 0; i < Math.ceil(n / 3); i++) s += i % 3 ? `<p><b>Short heading ${i}</b></p><p>Body text ${i} with some words in it.</p>` : `<p style="font-weight:700;font-size:20px">Section ${i}</p>`;
    return wrap(s);
  },
  // aria attributes with values and id references (aria-valid-attr-value)
  ariavals(n) {
    let s = '';
    for (let i = 0; i < Math.ceil(n / 4); i++) s += `<div role="combobox" aria-expanded="false" aria-controls="lb${i} missing${i}" aria-activedescendant="o${i}" tabindex="0" aria-label="c"></div><ul role="listbox" id="lb${i}"><li role="option" id="o${i}" aria-selected="true" aria-setsize="${i}" aria-posinset="1">o</li></ul><span aria-describedby="lb${i} o${i}" aria-flowto="o${i}">x</span>`;
    return wrap(s);
  },
  // shadow roots whose top-level children share tags (selector naming)
  shadowsib(n) {
    let s = '';
    for (let i = 0; i < Math.ceil(n / 6); i++) s += `<x-card><template shadowrootmode="open"><button></button><button></button><img src="a"><img src="b"><a href="#"></a></template></x-card>`;
    return wrap(s);
  },
  // wide content and overflow (reflow)
  wide(n) {
    let s = '';
    for (let i = 0; i < Math.ceil(n / 4); i++) s += `<div style="overflow-x:auto"><table><tr><td style="min-width:400px">a</td><td style="min-width:400px">b</td><td style="min-width:400px">c</td></tr></table></div><pre>${'code '.repeat(60)}</pre>`;
    return wrap(s);
  },
  // inline links in text (target size)
  inline(n) {
    let s = '';
    for (let i = 0; i < Math.ceil(n / 4); i++) s += `<p>Some text <a href="/a${i}">a</a> | <a href="/b${i}">b</a> more <button style="width:16px;height:16px;padding:0"></button></p>`;
    return wrap(s);
  },
  // contrast with clipping ancestors
  clipped(n) {
    let s = '';
    for (let i = 0; i < Math.ceil(n / 5); i++) s += `<div style="overflow:hidden;height:40px"><div style="overflow:auto;max-height:30px"><p style="color:#888">Clipped text ${i}</p><span style="color:#777">more ${i}</span></div></div>`;
    return wrap(s);
  }
};
module.exports = { kinds };
// image gallery variants for text-spacing growth
kinds.gallery = (n) => { let s = '<ul style="display:flex;flex-wrap:wrap;list-style:none">'; for (let i = 0; i < n; i++) s += `<li><img src="/g${i}.png" alt="Photo ${i}" width="80" height="60"></li>`; return require('./perf-pages.js').wrap(s + '</ul>'); };
kinds.inlineimgs = (n) => { let s = '<p>'; for (let i = 0; i < n; i++) s += `<img src="/g${i}.png" alt="Photo ${i}" width="80" height="60">`; return require('./perf-pages.js').wrap(s + '</p>'); };
kinds.inlinespans = (n) => { let s = '<p>'; for (let i = 0; i < n; i++) s += `<span>Word${i}</span> `; return require('./perf-pages.js').wrap(s + '</p>'); };
kinds.blockps = (n) => { let s = ''; for (let i = 0; i < n; i++) s += `<p>Para ${i} with a few words</p>`; return require('./perf-pages.js').wrap(s); };
