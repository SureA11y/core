// contrast-computable on nested lists (::marker per item) under jsdom: depth and width curves.
const { curve, page } = require('./sp.js');
const R = ['contrast-computable', 'contrast-minimum'];
const mode = process.argv[2] || 'depth';
if (mode === 'depth') curve('ul>li depth', n => page('<ul><li>'.repeat(n) + 'x' + '</li></ul>'.repeat(n)), [25, 50, 100, 200], R);
if (mode === 'depthtext') curve('ul>li depth, text in each li', n => page('<ul><li>item '.repeat(n) + 'x' + '</li></ul>'.repeat(n)), [25, 50, 100, 200], R);
if (mode === 'width') curve('ul with N li', n => page('<ul>' + '<li>item</li>'.repeat(n) + '</ul>'), [500, 1000, 2000, 4000], R);
if (mode === 'ol') curve('ol depth', n => page('<ol><li>'.repeat(n) + 'x' + '</li></ol>'.repeat(n)), [25, 50, 100], R);
if (mode === 'div') curve('div depth (control)', n => page('<div>'.repeat(n) + 'x' + '</div>'.repeat(n)), [25, 50, 100, 200], R);
if (mode === 'section') curve('section+h2 depth', n => page('<section><h2>h</h2>'.repeat(n) + 'x' + '</section>'.repeat(n)), [25, 50, 100, 200], R);
if (mode === 'divtext') curve('div depth, text at every level', n => page('<div>t '.repeat(n) + 'x' + '</div>'.repeat(n)), [25, 50, 100, 200, 400], R);
