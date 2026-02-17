'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { runa11yCoreOnHtml } = require('../helpers/runa11yCoreOnHtml');

test('i18n: locale switch applies translations when keys exist', () => {
    const html = `
    <!doctype html>
    <html>
      <head><title>i18n test</title></head>
      <body>
        <img src="x.png">
        <input type="image">
        <svg role="img"></svg>
      </body>
    </html>
  `;

    const en = runa11yCoreOnHtml(html, {
        engineOptions: { locale: 'en' }
    });

    const fr = runa11yCoreOnHtml(html, {
        engineOptions: { locale: 'fr' }
    });

    assert.ok(Array.isArray(en.checksResults), 'EN checks array exists');
    assert.ok(Array.isArray(fr.checksResults), 'FR checks array exists');
    assert.strictEqual(
        en.checksResults.length,
        fr.checksResults.length,
        'EN and FR return same number of checks'
    );

    const enById = new Map(en.checksResults.map(r => [r.ruleId, r]));
    const frById = new Map(fr.checksResults.map(r => [r.ruleId, r]));

    for (const [ruleId, frRule] of frById.entries()) {
        const enRule = enById.get(ruleId);
        assert.ok(enRule, `Rule ${ruleId} exists in EN results`);

        // ---- Rule-level localization ----
        if (frRule.i18n) {
            if (frRule.i18n.titleKey) {
                assert.strictEqual(
                    typeof frRule.title,
                    'string',
                    `FR title resolved for ${ruleId}`
                );
                assert.ok(
                    frRule.title.length > 0,
                    `FR title non-empty for ${ruleId}`
                );
            }

            if (frRule.i18n.descriptionKey) {
                assert.strictEqual(
                    typeof frRule.description,
                    'string',
                    `FR description resolved for ${ruleId}`
                );
                assert.ok(
                    frRule.description.length > 0,
                    `FR description non-empty for ${ruleId}`
                );
            }
        }

        // ---- Occurrence-level localization ----
        const frOccs = Array.isArray(frRule.occurrences) ? frRule.occurrences : [];
        const enOccs = Array.isArray(enRule.occurrences) ? enRule.occurrences : [];

        assert.strictEqual(
            frOccs.length,
            enOccs.length,
            `Same number of occurrences for ${ruleId}`
        );

        for (let i = 0; i < frOccs.length; i++) {
            const frOcc = frOccs[i];
            const enOcc = enOccs[i];

            if (frOcc.i18n) {
                if (frOcc.i18n.summaryKey) {
                    assert.strictEqual(
                        typeof frOcc.summary,
                        'string',
                        `FR summary resolved for ${ruleId} occurrence ${i}`
                    );
                }

                if (frOcc.i18n.hintKey) {
                    assert.strictEqual(
                        typeof frOcc.hint,
                        'string',
                        `FR hint resolved for ${ruleId} occurrence ${i}`
                    );
                }
            }
        }
    }
});
