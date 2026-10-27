// A custom rule that throws a value whose toString throws, or returns an
// object whose `outcome` getter throws: is it contained to its own result?
const { JSDOM } = require('../../../node_modules/jsdom');
const main = require('../../../src/index.js');
const dom = new JSDOM('<!doctype html><html lang=en><head><title>t</title></head><body><button></button></body></html>', { url: 'https://e.test/' });
global.window = dom.window; global.document = dom.window.document;
const CASES = [
  ['throwsNonError', () => { throw { toString() { throw new Error('nested'); } }; }],
  ['outcomeGetter', () => ({ get outcome() { throw new Error('getter'); } })],
  ['proxyResult', () => new Proxy({}, { get() { throw new Error('proxy'); } })],
];
for (const [n, fn] of CASES) {
  for (const [entry, run] of [['runDomRulesInPage', main.runDomRulesInPage], ['runa11yCoreInPage', main.runa11yCoreInPage]]) {
    try {
      const r = run('https://e.test/', null, { customRules: [{ id: 'x-' + n.toLowerCase(), meta: { title: 'x' }, runInPage: fn }] });
      const c = r.checksResults.find((x) => x.ruleId.startsWith('x-'));
      console.log(entry, n, '->', c && c.outcome, c && c.error);
    } catch (e) { console.log(entry, n, '-> SCAN THREW:', e.message); }
  }
}
