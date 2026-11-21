// packScript's "<!--" ... "<script" refusal: "<!-->" and "<!--->" close the escape at once in HTML's script data states.
// Does packScript refuse code that the HTML tokenizer would end fine? And does an inlined script with it really end at </script>?
const { definePack, packScript } = require('/home/user/core-r8/src/pack.js');
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const mk = (note) => definePack({ name: 'p', version: '1.0.0', namespace: 'pc', core: '*', rules: [{ id: 'pc-rule', meta: { title: 'T', description: 'd', tags: ['pc'] }, runInPage: new Function(`return { outcome: 'pass', note: ${JSON.stringify(note)} };`) }] });
for (const note of ['<!--> <script>', '<!---> <script>', '<!-- --> <script>', '<!-- <script>', '<!-- <script></script> x']) {
  let refused = null, s;
  try { s = packScript([mk(note)]); } catch (e) { refused = e.message.slice(0, 60); }
  // ground truth: inline a script holding the note then a marker element; is the marker parsed as an element?
  const dom = new JSDOM(`<!doctype html><body><script>var x = ${JSON.stringify(note).replace(/\\u003c/g, '<')};</script><p id="after">after</p></body>`);
  const ends = !!dom.window.document.getElementById('after');
  console.log(JSON.stringify(note).padEnd(30), 'packScript:', refused ? 'REFUSED' : 'taken', '| HTML ends the script element:', ends);
}
