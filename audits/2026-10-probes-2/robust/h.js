const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
function scan(html, opts = {}) {
  const dom = new JSDOM(html, { url: 'https://example.test/', contentType: opts.contentType || 'text/html', pretendToBeVisual: true, runScripts: opts.runScripts });
  global.window = dom.window; global.document = dom.window.document;
  if (opts.before) opts.before(dom.window);
  const t = Date.now();
  let r, err;
  try { r = (opts.inPage ? core.runa11yCoreInPage : core.runDomRulesInPage)('https://example.test/', opts.ctx || null, opts.engineOptions || {}, opts.runOnly || null); } catch (e) { err = e; }
  const ms = Date.now() - t;
  return { r, err, ms, dom };
}
function errs(r) { if (!r) return []; return (r.checksResults || []).filter(c => c.error || (c.reason && /error|threw/i.test(JSON.stringify(c.reason)))).map(c => c.ruleId + ': ' + JSON.stringify(c.error || c.reason).slice(0, 300)); }
function summary(r) { const o = {}; for (const c of r.checksResults) o[c.ruleId] = c.outcome + ':' + (c.occurrences || []).length; return o; }
module.exports = { scan, errs, summary, core };
