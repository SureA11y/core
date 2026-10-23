const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
const { summarize } = require('./h.js');
function jscan(body, { rules, opts = {}, full = false } = {}) {
  const html = body.startsWith('<!doctype') ? body : `<!doctype html><html lang="en"><head><title>t</title><style>body{margin:0;font:16px Arial, sans-serif}</style></head><body>${body}</body></html>`;
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  try {
    const res = core.runDomRulesInPage('https://example.test/', null, Object.assign({ rules: rules ? { include: rules } : undefined }, opts), null);
    return full ? res : summarize(res, rules);
  } finally { dom.window.close(); }
}
module.exports = { jscan };
