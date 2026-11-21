const { JSDOM } = require("/home/user/core-r9/node_modules/jsdom");
const { runDomRulesInPage } = require("/home/user/core-r9");
const dom = new JSDOM('<img src="logo.png"><a href="/x">click here</a>', { url: "https://example.com/", pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document;
const result = runDomRulesInPage("https://example.com/", null, {}, null);
console.log(JSON.stringify(result.engine.locale), result.engine.tag, result.engine.schemaVersion);
for (const r of result.checksResults.filter(r => r.outcome === "fail" || r.ruleId==='link-name-quality')) console.log(r.ruleId, r.outcome, r.severity, r.confidence, JSON.stringify(r.occurrences.map(o=>({s:o.selector,sum:o.summary,h:o.hint}))));
