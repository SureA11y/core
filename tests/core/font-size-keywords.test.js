'use strict';

// jsdom keeps a computed font size as written: a keyword (xx-large) or a
// calc(). The contrast rules read them as a browser would, so large text is
// held to 3:1 and its message gives its size.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../helpers/runa11yCoreOnHtml');

// #888 on white is 3.54:1: enough for large text, not for normal text.
function scan(fontSize) {
  return runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main><p style="color:#888;background:#fff;font-size:${fontSize}">Some text here</p></main></body></html>`,
    { runOnly: ['contrast-minimum'] }
  ).checksResults[0];
}

test('a font-size keyword or calc() is read as a browser reads it', () => {
  for (const size of [
    'xx-large',
    'x-large',
    'calc(16px * 2)',
    'calc(32px)',
    'calc((10px + 6px) * 2)',
    'calc(1.5rem)',
    '32px'
  ]) {
    assert.equal(scan(size).outcome, 'pass', size);
  }
  for (const size of ['medium', 'large', 'calc(16px)', 'calc(32px / 2)']) {
    const check = scan(size);
    assert.equal(check.outcome, 'fail', size);
    assert.doesNotMatch(check.occurrences[0].summary, /font size: 0px/, size);
  }
});
