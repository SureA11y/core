'use strict';

const test = require('node:test');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

test('img-alt-functional-name: no image-only controls => notApplicable', () => {
  const html = `<!doctype html><html><body><a href="/x">Text</a></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-img-alt-functional-name', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test('img-alt-functional-name: image-only link with empty alt => fail', () => {
  const html = `<!doctype html><html><body><a href="/x"><img src="x.png" alt=""></a></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-img-alt-functional-name', 'fail', {
    minOccurrences: 1
  });
});

test('img-alt-functional-name: image-only link with non-empty alt => pass', () => {
  const html = `<!doctype html><html><body><a href="/x"><img src="x.png" alt="Next page"></a></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-img-alt-functional-name', 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});
