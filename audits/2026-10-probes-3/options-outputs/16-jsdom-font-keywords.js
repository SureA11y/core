'use strict';
// jsdom leaves font-size keywords (medium, xx-large) and relative units (em,
// %) uncomputed; the contrast message then says "font size: 0px", and large
// text given by keyword is held to the normal-text threshold.
const h = require('./h.js');
const { main } = h.load();
for (const fs of ['', 'medium', 'xx-large', '2em', '200%', 'larger', '32px', 'calc(16px * 2)']) {
  h.setDom(`<!doctype html><html lang="en"><head><title>t</title></head><body style="background:#fff"><p style="color:#888;${fs ? 'font-size:' + fs : ''}">Some grey text</p></body></html>`);
  const cs = window.getComputedStyle(document.querySelector('p')).fontSize;
  const r = main.runDomRulesInPage('https://e.test/', null, {}, ['contrast-minimum']);
  const c = r.checksResults[0];
  console.log(`font-size ${JSON.stringify(fs || '(default)').padEnd(18)} jsdom computes ${JSON.stringify(cs).padEnd(18)} -> ${c.outcome} ${c.occurrences[0] ? (c.occurrences[0].summary.match(/font size: [^,]*/) || [''])[0] + ' | ' + (c.occurrences[0].summary.match(/Expected[^.]*\.\d:1 \([^)]*\)/) || [''])[0] : ''}`);
}
process.exit(0);
