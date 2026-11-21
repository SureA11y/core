// runOnly { type, values: Set } — the docs and types accept a Set of names.
const { JSDOM } = require('/home/user/core-r8/node_modules/jsdom');
const core = require('/home/user/core-r8/src/index.js');
const dom = new JSDOM('<html lang="en"><head><title>t</title></head><body><main><img src="a"><button></button></main></body></html>');
global.window = dom.window; global.document = dom.window.document;
console.warn = (...a) => console.log('  warn:', String(a[0]).slice(0, 140));
for (const ro of [
  { type: 'tag', values: ['wcag2a'] },
  { type: 'tag', values: new Set(['wcag2a']) },
  { type: 'rule', values: new Set(['img-alt-present']) },
  { type: 'rule', values: new Set(['no-such-rule']) },
  { type: 'rule', values: new Set() },
]) {
  const show = JSON.stringify(ro, (k, v) => v instanceof Set ? 'Set(' + [...v] + ')' : v);
  let line;
  try { const r = core.runDomRulesInPage(null, null, { strictOptions: true }, ro); line = 'ran ' + r.checksResults.length + ' rules'; } catch (e) { line = 'THROW ' + e.code + ' ' + e.message.slice(0, 100); }
  let cat; try { cat = core.getChecksForRunOnly(ro).length; } catch (e) { cat = 'THROW'; }
  console.log(show.padEnd(50), line, '| getChecksForRunOnly', cat);
}
