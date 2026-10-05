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

test('shadow dom contract: an occurrence in a shadow tree says how to reach it from the document', () => {
  const dom = createDom(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
      '<a href="/x"><img src="a.png"></a><div class="card"></div><div class="card"></div>' +
      '</main></body></html>'
  );
  const { document } = dom.window;
  for (const host of document.querySelectorAll('.card')) {
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = '<a href="/y"><img src="b.png"></a><x-inner></x-inner>';
    root.querySelector('x-inner').attachShadow({ mode: 'open' }).innerHTML =
      '<p><a href="/z"><img src="c.png"></a></p>';
  }
  const result = runa11yCoreOnDom(dom, { runOnly: ['img-alt-present'], entryPointParity: false });
  const occurrences = result.checksResults[0].occurrences;
  assert.equal(occurrences.length, 5);

  const resolve = (o) => {
    let root = document;
    for (const s of o.shadowHostSelectors || []) root = root.querySelector(s).shadowRoot;
    return root.querySelector(o.selector);
  };
  const srcs = occurrences.map((o) => resolve(o).getAttribute('src'));
  assert.deepEqual(srcs.sort(), ['a.png', 'b.png', 'b.png', 'c.png', 'c.png']);
  assert.equal(new Set(occurrences.map((o) => resolve(o))).size, 5, 'each its own element');

  const light = occurrences.find((o) => !o.shadowHostSelectors);
  assert.ok(Array.isArray(light.structuralPath), 'the document element keeps its path');
  for (const o of occurrences.filter((x) => x.shadowHostSelectors)) {
    assert.equal(o.structuralPath, null, 'no path from documentElement to shadow content');
  }
});
