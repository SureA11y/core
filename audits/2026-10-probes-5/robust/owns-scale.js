// aria-required-parent with many aria-owns relations (jsdom): curve and variants.
const { curve, page } = require('./sp.js');
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const R = ['aria-required-parent', 'aria-required-children', 'aria-owns-valid'];
const NS = (process.argv[2] || '100,200,400,800').split(',').map(Number);
curve('n lists each owning its item', n => page(rep(n, i => `<div role="list" aria-owns="it${i}"></div>`) + rep(n, i => `<div role="listitem" id="it${i}">x</div>`)), NS, R);
curve('ARIA 1.0 comboboxes owning listboxes', n => page(rep(n, i => `<div role="combobox" aria-expanded="true" aria-owns="lb${i}"><input aria-label="c${i}"></div><ul role="listbox" id="lb${i}"><li role="option">a</li><li role="option">b</li></ul>`)), NS, R);
curve('n listitems in plain lists (control, no owns)', n => page(rep(n, i => `<div role="list"><div role="listitem">x</div></div>`)), NS, R);
curve('n unrelated aria-owns + n listitems in lists', n => page(rep(n, i => `<div aria-owns="z${i}"></div><span id="z${i}">z</span>`) + rep(n, i => `<div role="list"><div role="listitem">x</div></div>`)), NS, R);
