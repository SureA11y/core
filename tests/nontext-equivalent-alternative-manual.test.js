'use strict';

const test = require('node:test');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

test('nontext-equivalent-alternative-manual: nothing to review => notApplicable', () => {
  const html = `<!doctype html><html><body><p>Text</p></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-nontext-equivalent-alternative-manual', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test('nontext-equivalent-alternative-manual: img with alt => cantTell', () => {
  const html = `<!doctype html><html><body><img src="x.png" alt="A cat"></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-nontext-equivalent-alternative-manual', 'cantTell', {
    minOccurrences: 1
  });
});

test('nontext-equivalent-alternative-manual: svg with title => cantTell', () => {
  const html = `<!doctype html><html><body><svg role="img"><title>Logo</title></svg></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-nontext-equivalent-alternative-manual', 'cantTell', {
    minOccurrences: 1
  });
});
