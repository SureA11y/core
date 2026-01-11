'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { runa11yCoreOnHtml, createDom, runa11yCoreOnDom } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

test('form-control-explicit-label: unlabeled input => fail with occurrence', () => {
  const html = `
    <!doctype html>
    <html><body>
      <input type="text" id="a">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html);
  const rule = assertRule(result, 'a11yCore-form-control-explicit-label', 'fail', { minOccurrences: 1 });

  const occ = rule.occurrences[0];
  assert.ok(occ.selector, 'occ.selector should exist');
  assert.ok(occ.html && occ.html.includes('<input'), 'occ.html should include <input');
});

test('form-control-explicit-label: label[for] => pass', () => {
  const html = `
    <!doctype html>
    <html><body>
      <label for="x">Email</label>
      <input type="text" id="x">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-form-control-explicit-label', 'pass', { maxOccurrences: 0 });
});

test('form-control-explicit-label: wrapping label => pass', () => {
  const html = `
    <!doctype html>
    <html><body>
      <label>Username <input type="text"></label>
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-form-control-explicit-label', 'pass', { maxOccurrences: 0 });
});

test('form-control-explicit-label: aria-label alone is not an explicit label => fail', () => {
  const html = `
    <!doctype html>
    <html><body>
      <input type="text" aria-label="Name">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-form-control-explicit-label', 'fail', { minOccurrences: 1 });
});

test('form-control-explicit-label: detects missing explicit label inside open shadow dom when enabled', () => {
  const dom = createDom(`<!doctype html><html><body><div id="host"></div></body></html>`);

  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML = `
    <label for="in">Inside</label>
    <input id="in" type="text">
    <input id="no" type="text">
  `;

  const result = runa11yCoreOnDom(dom, { engineOptions: { includeShadowDom: true } });
  // Should fail because #no has no label association.
  assertRule(result, 'a11yCore-form-control-explicit-label', 'fail', { minOccurrences: 1 });
});
