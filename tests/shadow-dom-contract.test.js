'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { createDom, runa11yCoreOnDom } = require('./helpers/runa11yCoreOnHtml');

test('shadow dom contract: enabling includeShadowDom does not crash any rule', () => {
    const dom = createDom(`
    <!doctype html>
    <html><body>
      <div id="host"></div>
    </body></html>
  `);

    const host = dom.window.document.getElementById('host');
    host.attachShadow({ mode: 'open' }).innerHTML = `
    <img src="cat.png">
    <img src="decorative.png" alt="">
    <a href="https://example.test" target="_blank">Link</a>
    <input type="text">
  `;

    const result = runa11yCoreOnDom(dom, {
        engineOptions: { includeShadowDom: true }
    });

    // Contract: no rule should throw at runtime when Shadow DOM scanning is enabled.
    for (const r of result.checksResults) {
        assert.ok(!r.error, `Rule ${r.ruleId} threw with includeShadowDom enabled: ${r.error}`);
    }
});