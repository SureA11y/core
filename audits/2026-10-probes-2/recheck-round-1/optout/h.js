const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
function scan(html, ctx = null, eo = {}, runOnly = null, url = 'https://example.test/') {
  const dom = new JSDOM(html, { url, contentType: 'text/html', pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  return core.runa11yCoreInPage(url, ctx, eo, runOnly);
}
function out(r, id) { const x = r.checksResults.find(c => c.id === id || c.ruleId === id); return x ? x.outcome : 'MISSING'; }
function tryit(label, f) { const w=[]; const ow=console.warn; console.warn=(...a)=>w.push(a.join(' ').slice(0,160)); try { const v=f(); console.log(label, '=>', v, w.length? 'WARN:'+JSON.stringify(w):''); } catch(e){ console.log(label, '=> THROW', e.code||'', e.message.slice(0,160), w.length? 'WARN:'+JSON.stringify(w):''); } finally {console.warn=ow;} }
module.exports = { scan, out, tryit, core };
