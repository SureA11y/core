const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
function scan(html, eo = {}, runOnly = null, entry = 'node') {
  const dom = new JSDOM(html || '<html lang="en"><head><title>t</title></head><body><main><p class="x">hi</p><img src="a.png"></main></body></html>', { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  const warns = []; const ow = console.warn; console.warn = (...a) => warns.push(a.join(' '));
  let res, err;
  try { res = (entry === 'inpage' ? core.runa11yCoreInPage : core.runDomRulesInPage)('https://example.test/', null, eo, runOnly); } catch (e) { err = e; }
  console.warn = ow;
  return { res, err, warns };
}
function cr(res, id) { return res && res.checksResults.find((r) => r.id === id || r.ruleId === id); }
module.exports = { scan, cr, core };
