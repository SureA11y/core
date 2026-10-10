'use strict';

// German css-hidden-focus names the element as other German messages do,
// "Das fokussierbare Element <a>", not the tag as a noun ("Das fokussierbare a").

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../src/testing.js');

test('German css-hidden-focus names the element', () => {
  const result = runa11yCoreOnHtml(
    '<!doctype html><html lang="de"><head><title>t</title></head><body><main><a href="/x" style="opacity:0">x</a></main></body></html>',
    { runOnly: ['css-hidden-focus'], engineOptions: { locale: 'de' } }
  );
  assert.match(
    result.checksResults[0].occurrences[0].summary,
    /^Das fokussierbare Element <a> ist visuell verborgen\./
  );
});
