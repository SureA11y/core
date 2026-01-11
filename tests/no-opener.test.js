'use strict';

const test = require('node:test');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

test('links-target-blank-noopener: missing rel => fail with 1+ occurrences', () => {
  const html = `
    <!doctype html>
    <html><body>
      <a href="/ok" target="_blank" rel="noopener">Good</a>
      <a href="/bad" target="_blank">Bad</a>
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html);

  assertRule(result, 'a11yCore-links-target-blank-noopener', 'fail', {
    minOccurrences: 1
  });
});

test('links-target-blank-noopener: all links compliant => pass', () => {
  const html = `
    <!doctype html>
    <html><body>
      <a href="/ok1" target="_blank" rel="noopener">Good</a>
      <a href="/ok2" target="_blank" rel="noreferrer">Good</a>
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html);

  assertRule(result, 'a11yCore-links-target-blank-noopener', 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

