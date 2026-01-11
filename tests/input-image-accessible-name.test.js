'use strict';

const test = require('node:test');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

test('input-image-accessible-name: no image inputs => notApplicable', () => {
  const html = `<!doctype html><html><body><input type="text" /></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-input-image-accessible-name', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test('input-image-accessible-name: missing name => fail', () => {
  const html = `<!doctype html><html><body><input type="image" src="x.png"></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-input-image-accessible-name', 'fail', {
    minOccurrences: 1
  });
});

test('input-image-accessible-name: alt provided => pass', () => {
  const html = `<!doctype html><html><body><input type="image" src="x.png" alt="Search"></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-input-image-accessible-name', 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});
