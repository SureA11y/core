const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
const pack = require('/home/user/core/src/pack.js');
const HTML = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>h</h1><img src="a.png"><a href="#">x</a><button></button><p style="color:#777;background:#fff">low</p></main></body></html>`;
function setup(html = HTML) {
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  return dom;
}
let warns = [];
const ow = console.warn, oi = console.info;
function capture(fn) {
  warns = [];
  console.warn = (...a) => warns.push(a.join(' ').slice(0, 300));
  console.info = () => {};
  try { return { ok: true, v: fn(), warns }; }
  catch (e) { return { ok: false, err: e, code: e && e.code, msg: String(e && e.message).slice(0, 400), stack: e && e.stack && e.stack.split('\n').slice(0, 4).join('\n'), warns }; }
  finally { console.warn = ow; console.info = oi; }
}
function scan(eo, runOnly = null, html) { setup(html); return capture(() => core.runDomRulesInPage(null, null, eo, runOnly)); }
function scanIP(eo, runOnly = null, html) { setup(html); return capture(() => core.runa11yCoreInPage(null, null, eo, runOnly)); }
function brief(r) {
  if (!r.ok) return { THROW: r.code || 'NOCODE', msg: r.msg, warns: r.warns.slice(0, 3) };
  const v = r.v; return { checks: v.checksResults && v.checksResults.length, warns: r.warns.slice(0, 4) };
}
module.exports = { core, pack, setup, capture, scan, scanIP, brief, HTML };
