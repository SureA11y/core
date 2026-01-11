'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

test('manual-review: cantTell with one occurrence bound to html by default', () => {
    const html = `
    <!doctype html>
    <html><body>
      <p>Some content</p>
    </body></html>
  `;

    const result = runa11yCoreOnHtml(html);

    const rule = assertRule(result, 'manual-review', 'cantTell', {
        minOccurrences: 1,
        maxOccurrences: 1
    });

    const occ = rule.occurrences[0];
    assert.strictEqual(occ.selector, 'html');
    assert.ok(
        typeof occ.summary === 'string' &&
        occ.summary.toLowerCase().includes('manual review'),
        'summary should mention manual review'
    );
});

test('manual-review: uses contextSelector when provided', () => {
    const html = `
    <!doctype html>
    <html><body>
      <div id="main">
        <p>Inside main</p>
      </div>
    </body></html>
  `;

    const result = runa11yCoreOnHtml(html, { contextSelector: '#main' });

    const rule = assertRule(result, 'manual-review', 'cantTell', {
        minOccurrences: 1,
        maxOccurrences: 1
    });

    const occ = rule.occurrences[0];
    assert.strictEqual(occ.selector, '#main');
});
