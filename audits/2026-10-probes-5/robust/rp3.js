// RP-3 recheck: does every reporter carry the shadow host chain of a finding in an open shadow root?
const { createDom, runa11yCoreOnDom } = require('/home/user/core/src/testing.js');
const L = require('./r4/reporters/lib.js');
console.warn = () => {};
const dom = createDom('<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="light.png"><div id="host2"></div><div id="host3"></div></main></body></html>');
const d = dom.window.document;
d.getElementById('host2').attachShadow({ mode: 'open' }).innerHTML = '<img src="shadow.png">';
const inner = d.getElementById('host3').attachShadow({ mode: 'open' }); inner.innerHTML = '<x-deep id="h4"></x-deep>';
inner.getElementById('h4').attachShadow({ mode: 'open' }).innerHTML = '<img src="deeper.png">';
const r = JSON.parse(JSON.stringify(runa11yCoreOnDom(dom, { entryPointParity: false, runOnly: ['img-alt-present'] })));
console.log('occurrences:', r.checksResults[0].occurrences.map(o => o.selector + ' hosts=' + JSON.stringify(o.shadowHostSelectors)));
const outs = { html: L.renderHtmlReport(r), sarif: L.renderSarifReport(r), junit: L.renderJunitReport(r), earl: JSON.stringify(L.renderEarlReport(r)), baseline: JSON.stringify(L.B.buildBaselineEntries(r)) };
for (const [k, v] of Object.entries(outs)) console.log(k, 'host2:', (v.match(/host2/g) || []).length, 'host3+h4:', /host3/.test(v) && /h4/.test(v));
