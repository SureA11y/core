'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { runa11yCoreOnHtml, createDom, runa11yCoreOnDom } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

test('img-alt-empty: empty alt => cantTell with 1+ occurrences', () => {
  const html = `
    <!doctype html>
    <html><body>
      <img src="decorative.png" alt="">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html);

  const rule = assertRule(result, 'a11yCore-img-alt-empty', 'cantTell', {
    minOccurrences: 1
  });

  const occ = rule.occurrences[0];
  assert.ok(occ.selector, 'occ.selector should exist');
  assert.ok(occ.html && occ.html.includes('alt=""'), 'occ.html should include alt=""');
});

test('img-alt-empty: whitespace-only alt => cantTell with 1+ occurrences', () => {
  const html = `
    <!doctype html>
    <html><body>
      <img src="decorative.png" alt="   ">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html);

  const rule = assertRule(result, 'a11yCore-img-alt-empty', 'cantTell', {
    minOccurrences: 1
  });

  const occ = rule.occurrences[0];
  assert.ok(occ.selector, 'occ.selector should exist');
  assert.ok(occ.html && occ.html.includes('alt="'), 'occ.html should include alt="');
});

test('img-alt-empty: non-empty alt => pass with 0 occurrences', () => {
  const html = `
    <!doctype html>
    <html><body>
      <img src="cat.png" alt="A cat">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-img-alt-empty', 'pass', { maxOccurrences: 0 });
});

test('img-alt-empty: empty alt inside open shadow dom => cantTell with 1+ occurrences when enabled', () => {
  const dom = createDom(`
    <!doctype html>
    <html><body>
      <div id="host"></div>
    </body></html>
  `);

  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML = `<img src="decorative.png" alt="">`;

  const result = runa11yCoreOnDom(dom, {
    engineOptions: { includeShadowDom: true }
  });

  assertRule(result, 'a11yCore-img-alt-empty', 'cantTell', {
    minOccurrences: 1
  });
});

