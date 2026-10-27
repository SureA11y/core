'use strict';
// Times one rule on an HTML snippet in jsdom (in-page entry point).
// usage: node timesnip.js <ruleId> '<html>' [indexJsPath]
const path = require('node:path');
const { JSDOM } = require('jsdom');
const [ruleId, html, idx] = process.argv.slice(2);
const core = require(idx || path.resolve(__dirname, '../../../src/index.js'));
console.warn = () => {};
const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document;
const t0 = performance.now();
const r = core.runa11yCoreInPage('https://example.test/', null, { optInRules: 'all' }, { includeRuleIds: [ruleId] });
const c = r.checksResults.find((x) => x.ruleId === ruleId);
console.log(Math.round(performance.now() - t0) + 'ms', c && c.outcome, c && (c.error || ''));
