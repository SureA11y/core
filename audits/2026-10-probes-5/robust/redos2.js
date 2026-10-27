// Curves for the two long-value slow paths found by speed-recheck fz6: link text of dots, long href.
const { curve, page } = require('./sp.js');
const m = process.argv[2];
if (!m || m === 'link') {
  curve('link a+dots+x', n => page(`<a href=/x>a${'.'.repeat(n)}x</a>`), [5000, 10000, 20000, 40000], ['link-name-quality']);
  curve('link a+dots (trailing)', n => page(`<a href=/x>a${'.'.repeat(n)}</a>`), [10000, 40000], ['link-name-quality']);
  curve('link a+spaces+x', n => page(`<a href=/x>a${' '.repeat(n)}x</a>`), [10000, 40000], ['link-name-quality']);
  curve('link a+"!?"+x', n => page(`<a href=/x>a${'!?'.repeat(n / 2)}x</a>`), [10000, 40000], ['link-name-quality']);
  curve('link words', n => page(`<a href=/x>${'read more '.repeat(n / 10)}</a>`), [10000, 40000], ['link-name-quality']);
  curve('link a+dashes+x', n => page(`<a href=/x>a${'-'.repeat(n)}x</a>`), [10000, 40000], ['link-name-quality']);
  curve('aria-label dots link', n => page(`<a href=/x aria-label="a${'.'.repeat(n)}x">go</a>`), [10000, 40000], ['link-name-quality']);
  curve('button dots', n => page(`<button>a${'.'.repeat(n)}x</button>`), [10000, 40000], null, { top: 3 });
}
if (!m || m === 'href') {
  curve('href #aaaa', n => page(`<a href="#${'a'.repeat(n)}">go</a>`), [10000, 20000, 40000, 80000], ['css-hidden-focus', 'identical-links-same-purpose']);
  curve('href javascript:spaces', n => page(`<a href="javascript:${' '.repeat(n)}void(0)">x</a>`), [10000, 20000, 40000, 80000], ['css-hidden-focus', 'identical-links-same-purpose']);
}
