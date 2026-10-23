const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
function setup(html, url='https://example.test/') {
  const dom = new JSDOM(html, { url, contentType: 'text/html', pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  return dom;
}
function run(html, ctx=null, eo={}, ro=null, which='inpage') {
  setup(html);
  const fn = which==='inpage' ? core.runa11yCoreInPage : core.runDomRulesInPage;
  return fn('https://example.test/', ctx, eo, ro);
}
function both(html, ctx=null, eo={}, ro=null) {
  const a = run(html, ctx, eo, ro, 'inpage'); const b = run(html, ctx, eo, ro, 'node');
  return [a,b];
}
const ids = r => r.checksResults.map(c=>c.ruleId);
const sum = r => r.checksResults.filter(c=>c.outcome!=='notApplicable').map(c=>c.ruleId+':'+c.outcome+':'+c.occurrences.length);
module.exports = { core, setup, run, both, ids, sum };
