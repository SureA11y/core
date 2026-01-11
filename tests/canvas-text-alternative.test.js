'use strict';

const test = require('node:test');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

test('canvas-text-alternative: no canvas => notApplicable', () => {
  const html = `<!doctype html><html><body><p>Hi</p></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-canvas-text-alternative', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test('canvas-text-alternative: empty canvas without name => fail', () => {
  const html = `<!doctype html><html><body><canvas></canvas></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-canvas-text-alternative', 'fail', {
    minOccurrences: 1
  });
});

test('canvas-text-alternative: canvas with fallback text => pass', () => {
  const html = `<!doctype html><html><body><canvas>Fallback text</canvas></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-canvas-text-alternative', 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});
