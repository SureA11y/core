const { JSDOM } = require('jsdom');
const { runDomRulesInPage } = require('@surea11y/core');
const dom = new JSDOM('<html><head><title>Example</title></head><body><img src="logo.png"><button></button></body></html>', { url: 'https://example.test/', pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document;
const r = runDomRulesInPage('https://example.test/', null, {}, { includeRuleIds: ['img-alt-present', 'button-name-present'] });
console.log(JSON.stringify(r.engine));
for (const c of r.checksResults) console.log(c.ruleId, c.outcome, c.severity, c.confidence, c.type, JSON.stringify(c.occurrences.map(o=>({s:o.selector,h:o.html,p:o.structuralPath,sum:o.summary,hint:o.hint,d:o.data}))));
for (const x of r.rulesResults) console.log(x.ruleId, x.outcome, x.severity, x.title, x.data.details.reasonCode, JSON.stringify(x.data.details.metrics), x.data.details.checksIds.slice(0,3), JSON.stringify(x.data.details.contributors.slice(0,1)));
