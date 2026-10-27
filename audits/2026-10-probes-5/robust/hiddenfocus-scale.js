// css-hidden-focus with many fields that reference hidden messages (jsdom): which part makes it super-linear?
const { curve, page } = require('./sp.js');
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const R = ['css-hidden-focus', 'invalid-field-error-message'];
const NS = (process.argv[2] || '250,500,1000').split(',').map(Number);
const V = {
  'inputs + hidden spans (no refs)': n => page(rep(n, i => `<input aria-label="f${i}"><span hidden>E${i}</span>`)),
  'inputs describedby hidden span': n => page(rep(n, i => `<input aria-label="f${i}" aria-describedby="e${i}"><span id="e${i}" hidden>E${i}</span>`)),
  'inputs errormessage hidden span': n => page(rep(n, i => `<input aria-label="f${i}" aria-invalid="true" aria-errormessage="e${i}"><span id="e${i}" hidden>E${i}</span>`)),
  'inputs + label for + visible spans': n => page(rep(n, i => `<label for="f${i}">F${i}</label><input id="f${i}"><span>E${i}</span>`)),
  'inputs only': n => page(rep(n, i => `<input aria-label="f${i}">`)),
};
for (const [k, mk] of Object.entries(V)) if (!process.argv[3] || k.includes(process.argv[3])) curve(k, mk, NS, R);
