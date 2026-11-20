'use strict';
// Page generators of a given element count n.
const wrap = (body, head = '') => `<!DOCTYPE html><html lang="en"><head><title>Perf</title>${head}</head><body><header><nav><a href="#main">Skip</a></nav></header><main id="main"><h1>Perf</h1>${body}</main><footer>f</footer></body></html>`;
const kinds = {
  // realistic mixed content, ~n elements
  mixed(n) {
    let s = '';
    const blocks = Math.ceil(n / 20);
    for (let i = 0; i < blocks; i++) {
      s += `<section aria-labelledby="h${i}"><h2 id="h${i}">Section ${i}</h2><p style="color:#${i % 2 ? '555' : '999'}">Text <a href="/p${i}">link ${i}</a> and <strong>bold</strong> <em>more</em>.</p>` +
        `<ul><li><a href="#x${i}">Item</a></li><li><button type="button">Btn ${i}</button></li></ul>` +
        `<img src="i${i}.png" alt="${i % 3 ? 'pic ' + i : ''}"><label for="f${i}">Field</label><input id="f${i}" type="text" autocomplete="name">` +
        `<div role="button" tabindex="0" aria-pressed="false">Tog</div></section>`;
    }
    return wrap(s);
  },
  deep(n) { return wrap('<div>'.repeat(n) + '<a href="#">deep link</a><span>text</span>' + '</div>'.repeat(n)); },
  table(n) {
    const cols = 20, rows = Math.ceil(n / (cols + 1));
    let s = '<table><caption>T</caption><thead><tr>' + Array.from({ length: cols }, (_, c) => `<th scope="col" id="c${c}">C${c}</th>`).join('') + '</tr></thead><tbody>';
    for (let r = 0; r < rows; r++) s += '<tr>' + Array.from({ length: cols }, (_, c) => `<td headers="c${c}">${r}.${c}</td>`).join('') + '</tr>';
    return wrap(s + '</tbody></table>');
  },
  links(n) { let s = '<p>'; for (let i = 0; i < n; i++) s += `<a href="/l${i % 50}">${i % 7 ? 'Read more' : 'Link ' + i}</a> `; return wrap(s + '</p>'); },
  forms(n) {
    let s = '<form>'; const k = Math.ceil(n / 3);
    for (let i = 0; i < k; i++) s += `<div><label for="i${i}">L${i % 10}</label><input id="i${i}" name="n${i % 20}" type="${['text', 'radio', 'checkbox', 'email'][i % 4]}" ${i % 5 ? '' : 'aria-describedby="d' + i + '"'}><span id="d${i}">d</span></div>`;
    return wrap(s + '</form>');
  },
  images(n) { let s = ''; for (let i = 0; i < n; i++) s += `<img src="/img${i}.png" alt="${['', 'photo', 'image.png', 'Pic ' + i][i % 4]}">`; return wrap(s); },
  longtext(n) { let s = ''; for (let i = 0; i < Math.ceil(n / 2); i++) s += `<p>${'Lorem ipsum dolor sit amet. '.repeat(40)}<span>x</span></p>`; return wrap(s); },
  ids(n) { let s = ''; for (let i = 0; i < n; i++) s += `<span id="s${i}" aria-labelledby="s${(i + 1) % n}" aria-describedby="s${(i * 7) % n}">t</span>`; return wrap(s); },
  sheets(n) {
    let head = ''; const k = Math.ceil(n / 50);
    for (let i = 0; i < k; i++) head += `<style>.c${i} a{color:#${i % 2 ? '777' : '333'}} .c${i}:focus{outline:none} @media (max-width:${300 + i}px){.c${i}{display:none}} .c${i}::before{content:"x"}</style>`;
    let s = ''; for (let i = 0; i < n; i++) s += `<div class="c${i % k}"><a href="#">a</a></div>`;
    return wrap(s, head);
  },
  aria(n) {
    let s = ''; const k = Math.ceil(n / 6);
    for (let i = 0; i < k; i++) s += `<div role="tablist"><div role="tab" aria-selected="true" aria-controls="p${i}" id="t${i}">T</div></div><div role="tabpanel" id="p${i}" aria-labelledby="t${i}"><ul role="menu"><li role="menuitem">m</li></ul></div>`;
    return wrap(s);
  },
  shadow(n) {
    let s = ''; for (let i = 0; i < Math.ceil(n / 4); i++) s += `<div><template shadowrootmode="open"><button><slot></slot></button><span>x</span></template>Click ${i}</div>`;
    return wrap(s);
  }
};
module.exports = { kinds, wrap };
