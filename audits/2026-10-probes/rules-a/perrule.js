const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
const n = +process.argv[2]; const kind = process.argv[3] || 'spans';
const ids = core.getChecksCatalog().map(x => x.id || x.ruleId).filter(id => !process.argv[4] || process.argv[4].split(',').includes(id));
const body = kind === 'spans' ? '<span>a</span>'.repeat(n) : kind === 'links' ? '<a href="/">l</a> '.repeat(n) : kind === 'divs' ? '<div>a</div>'.repeat(n) : '<p>' + 'word <b>b</b> '.repeat(n) + '</p>';
const html = `<!doctype html><html lang=en><head><title>S</title></head><body><main><h1>x</h1>${body}</main></body></html>`;
for (const id of ids) {
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  const t = Date.now();
  core.runDomRulesInPage('https://example.test/', null, {}, [id]);
  const ms = Date.now() - t;
  if (ms > 300) console.log(id, ms);
  dom.window.close();
}
console.log('done');
