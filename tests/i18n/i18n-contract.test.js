'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { runa11yCoreOnHtml } = require('../helpers/runa11yCoreOnHtml');

const VALID_OUTCOMES = new Set([
    'pass',
    'fail',
    'cantTell',
    'notApplicable'
]);

test('i18n contract: all rule results expose localized text and i18n metadata', () => {
    const html = `
    <!doctype html>
    <html>
      <body>
        <img src="x">
        <input type="image">
        <a href="https://example.com" target="_blank">Link</a>
        <svg role="img"></svg>
      </body>
    </html>
  `;

    const result = runa11yCoreOnHtml(html, {
        engineOptions: { locale: 'fr' }
    });

    assert.ok(Array.isArray(result.checksResults), 'checks array exists');
    assert.ok(result.checksResults.length > 0, 'at least one rule executed');

    for (const rule of result.checksResults) {
        // --- rule-level contract ---
        assert.ok(rule.ruleId, 'ruleId exists');
        assert.ok(VALID_OUTCOMES.has(rule.outcome), 'valid outcome');

        assert.strictEqual(typeof rule.title, 'string', 'title is string');
        assert.strictEqual(typeof rule.description, 'string', 'description is string');

        // i18n object may be null, but must be present
        assert.ok(
            rule.i18n === null || typeof rule.i18n === 'object',
            'rule.i18n is object or null'
        );

        // --- occurrences contract ---
        assert.ok(Array.isArray(rule.occurrences), 'occurrences array');

        for (const occ of rule.occurrences) {
            assert.strictEqual(typeof occ.summary, 'string', 'summary is string');
            assert.strictEqual(typeof occ.hint, 'string', 'hint is string');

            assert.ok(
                occ.i18n === null || typeof occ.i18n === 'object',
                'occurrence.i18n is object or null'
            );

            if (occ.i18n) {
                assert.strictEqual(typeof occ.i18n.summaryKey, 'string');
                assert.strictEqual(typeof occ.i18n.hintKey, 'string');
            }
        }
    }
});

test('result schema is stable', () => {
    const result = runa11yCoreOnHtml('<img src="x">');
    assert.deepStrictEqual(
        Object.keys(result).sort(),
        ['checksResults', 'contextSelector', 'engine', 'perfStats', 'rulesResults', 'timestamp', 'title', 'url']
    );
});

test('manual checks never return fail', () => {
    const result = runa11yCoreOnHtml('<img alt="">');
    const manualRules = result.checksResults.filter(r => r.type === 'manual');
    for (const r of manualRules) {
        assert.notStrictEqual(r.outcome, 'fail');
    }
});

