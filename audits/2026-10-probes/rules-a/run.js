const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
function runJsdom(html, opts={}) {
  const dom = new JSDOM(html, { url: 'https://example.test/', contentType: opts.contentType||'text/html', pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  if (opts.mutate) opts.mutate(dom.window);
  const r = core.runDomRulesInPage('https://example.test/', null, opts.engineOptions||{}, opts.runOnly||null);
  return { r, dom };
}
module.exports = { runJsdom, core };
if (require.main === module) {
  const { r } = runJsdom('<!doctype html><html lang="en"><head><title>x</title></head><body><main><h1>Hi</h1><img src=a.png></main></body></html>');
  console.log(Object.keys(r));
  console.log(JSON.stringify(r, null, 1).slice(0, 3000));
}
