'use strict';

const test = require('node:test');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

test('img-alt-attr-present: no images => notApplicable', () => {
  const html = `<!doctype html><html><body><p>Hello</p></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-img-alt-attr-present', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test('img-alt-attr-present: missing alt => fail', () => {
  const html = `<!doctype html><html><body><img src="x.png"></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-img-alt-attr-present', 'fail', {
    minOccurrences: 1
  });
});

test('img-alt-attr-present: alt present (including empty) => pass', () => {
  const html = `<!doctype html><html><body><img src="x.png" alt=""></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-img-alt-attr-present', 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});
