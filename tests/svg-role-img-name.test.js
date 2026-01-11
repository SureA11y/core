'use strict';

const test = require('node:test');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

test('svg-role-img-name: no applicable svg => notApplicable', () => {
  const html = `<!doctype html><html><body><svg></svg></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-svg-role-img-name', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test('svg-role-img-name: role=img without name => fail', () => {
  const html = `<!doctype html><html><body><svg role="img"></svg></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-svg-role-img-name', 'fail', {
    minOccurrences: 1
  });
});

test('svg-role-img-name: role=img with <title> => pass', () => {
  const html = `<!doctype html><html><body><svg role="img"><title>Company logo</title></svg></body></html>`;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11yCore-svg-role-img-name', 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});
