'use strict';
// The standalone bundle in a page (jsdom, scripts on): a locale without its
// side file, with it, with a side file for another locale, and the Node
// side-file export used as engineOptions.messages.
const fs = require('fs');
const h = require('./h.js');
const bundle = fs.readFileSync(h.ROOT + '/surea11y.browser.js', 'utf8');
const de = fs.readFileSync(h.ROOT + '/surea11y.i18n.de.js', 'utf8');
const ja = fs.readFileSync(h.ROOT + '/surea11y.i18n.ja.js', 'utf8');
function page(scripts) {
  const dom = new h.JSDOM('<!doctype html><html lang="en"><head><title>t</title></head><body><img src="a.png"></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://e.test/' });
  for (const s of scripts) dom.window.eval(s);
  return dom.window;
}
const run = (w, eo) => w.eval(`(function(){ const r = a11ycore.runa11yCoreInPage(null, null, ${JSON.stringify(eo)}, ['img-alt-present']); return JSON.stringify({ locale: r.engine.locale, title: r.checksResults[0].title, version: r.engine.version }); })()`);
console.log('de, no side file     ', run(page([bundle]), { locale: 'de' }));
console.log('de, de side file     ', run(page([bundle, de]), { locale: 'de' }));
console.log('de-CH, de side file  ', run(page([bundle, de]), { locale: 'de-CH' }));
console.log('de, ja side file     ', run(page([bundle, ja]), { locale: 'de' }));
console.log('side file before bundle:', (() => { try { const w = page([de, bundle]); return run(w, { locale: 'de' }); } catch (e) { return 'THROWS ' + e.message.slice(0, 120); } })());
const node = require(h.ROOT + '/surea11y.i18n.de.js');
console.log('Node require side file keys:', Object.keys(node), node.locale, Object.keys(node.messages || {}).length);
console.log('messages from Node export ', run(page([bundle]), { locale: 'de', messages: { de: node.messages } }));
process.exit(0);
