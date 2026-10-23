// FZ-P2 recheck: a top-level element of a shadow root gets a bare selector that the root resolves to a deeper, earlier match.
const { createDom, runa11yCoreOnDom } = require('/home/user/core/src/testing.js'); console.warn = () => {};
const dom = createDom('<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><x-card id="h"></x-card></main></body></html>');
const root = dom.window.document.getElementById('h').attachShadow({ mode: 'open' });
root.innerHTML = '<div><img src="deep.png" alt="Deep photo"></div><img src="top.png">';
const r = runa11yCoreOnDom(dom, { entryPointParity: false, runOnly: ['img-alt-present'] });
for (const o of r.checksResults[0].occurrences) { const el = root.querySelector(o.selector); console.log('reported', o.selector, 'hosts', o.shadowHostSelectors, '-> root.querySelector gives', el && el.outerHTML); }
