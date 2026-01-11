'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { runa11yCoreOnHtml, createDom, runa11yCoreOnDom } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

test('form-control-accessible-name: unlabeled input => fail with occurrence', () => {
  const html = `
    <!doctype html>
    <html><body>
      <input type="text" id="a">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html);
  const rule = assertRule(result, 'a11yCore-form-control-accessible-name', 'fail', { minOccurrences: 1 });

  const occ = rule.occurrences[0];
  assert.ok(occ.selector, 'occ.selector should exist');
  assert.ok(occ.html && occ.html.includes('<input'), 'occ.html should include <input');
});

test('form-control-accessible-name: aria-label => pass', () => {
  const html = `
    <!doctype html>
    <html><body>
      <input type="text" aria-label="Name">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-form-control-accessible-name', 'pass', { maxOccurrences: 0 });
});

test('form-control-accessible-name: label[for] => pass', () => {
  const html = `
    <!doctype html>
    <html><body>
      <label for="x">Email</label>
      <input type="text" id="x">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-form-control-accessible-name', 'pass', { maxOccurrences: 0 });
});

test('form-control-accessible-name: hidden and submit are ignored => notApplicable', () => {
  const html = `
    <!doctype html>
    <html><body>
      <input type="hidden" id="h">
      <input type="submit" value="Send">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-form-control-accessible-name', 'notApplicable', { maxOccurrences: 0 });
});

test('form-control-accessible-name: detects missing name inside open shadow dom when enabled', () => {
  const dom = createDom(`<!doctype html><html><body><div id="host"></div></body></html>`);

  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML = `<input type="text">`; // no name

  const result = runa11yCoreOnDom(dom, { engineOptions: { includeShadowDom: true } });
  assertRule(result, 'a11yCore-form-control-accessible-name', 'fail', { minOccurrences: 1 });
});
