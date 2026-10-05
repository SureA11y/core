const { JSDOM } = require('/home/user/core/node_modules/jsdom');
function setup(html){
  const dom = new JSDOM(html || `<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>Hi</h1><div id="a" onclick="x()">a</div><div class="skip" onclick="y()">b</div><img src="x.png"></main></body></html>`, { url: 'https://example.test/', pretendToBeVisual: true });
  const w = dom.window;
  global.window = w; global.document = w.document;
  for (const k of ['Node','Element','HTMLElement','getComputedStyle','NodeFilter','ShadowRoot','DocumentFragment','CSS','HTMLInputElement','navigator','location']) { try { if (!(k in global)) global[k] = w[k]; else global[k]=w[k]; } catch(e){} }
  return w;
}
const core = require('/home/user/core/src/index.js');
function run(eo, runOnly, ctxSel, html){
  setup(html);
  const warns=[]; const ow=console.warn; console.warn=(...a)=>warns.push(a.join(' '));
  let res, err;
  try { res = core.runDomRulesInPage('https://example.test/', ctxSel||null, eo, runOnly); } catch(e){ err=e; }
  console.warn=ow;
  return { res, err, warns };
}
function pick(res, id){ return res && res.checksResults.find(r=>r.ruleId===id); }
module.exports = { setup, core, run, pick };
