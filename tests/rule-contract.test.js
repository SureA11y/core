'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');

test('checks: no runtime errors on a minimal page', () => {
    const html = `<!doctype html><html><body></body></html>`;
    const result = runa11yCoreOnHtml(html);

    // If your runner returns checks even when not applicable,
    // this guarantees none of them crashed.
    for (const r of result.checksResults) {
        assert.ok(!r.error, `Rule ${r.ruleId} threw: ${r.error}`);
    }
});
