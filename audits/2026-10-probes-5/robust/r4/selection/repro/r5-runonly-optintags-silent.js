// runOnly.optInTags is accepted as a known key, then silently dropped: { optInTags: ['sample'] }
// runs a full scan without the opt-in rules and with no warning (an unknown key alone throws).
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
const pack = require('/home/user/core/tests/fixtures/packs/sample.js');
const dom = new JSDOM('<!doctype html><html lang="en"><head><title>t</title></head><body><p>x</p></body></html>', { url: 'https://example.test/' });
global.window = dom.window; global.document = dom.window.document;
const { warn } = console; const warned = []; console.warn = (m) => warned.push(m);
const r = core.runDomRulesInPage('https://example.test/', null, { packs: [pack] }, { optInTags: ['sample'] });
console.warn = warn;
console.log('checks:', r.checksResults.length, 'sample rules run:', r.checksResults.filter((c) => c.ruleId.startsWith('sample-')).length, 'warnings:', warned);
try { core.runDomRulesInPage('https://example.test/', null, { packs: [pack] }, { optInTag: ['sample'] }); } catch (e) { console.log('typo key alone:', e.code, e.message); }
