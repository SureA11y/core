'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('../helpers/runa11yCoreOnHtml');

const I18N_DIR = path.join(__dirname, '..', '..', 'src', 'i18n');
const LOCALES = fs
  .readdirSync(I18N_DIR)
  .filter((f) => f.endsWith('.js') && f !== 'en.js')
  .map((f) => f.replace(/\.js$/, ''));

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

for (const locale of LOCALES) {
  test(`i18n: locale switch applies translations when keys exist (${locale})`, () => {
    const en = runa11yCoreOnHtml(html, {
      engineOptions: { locale: 'en' }
    });

    const translated = runa11yCoreOnHtml(html, {
      engineOptions: { locale }
    });

    assert.ok(Array.isArray(en.checksResults), 'EN checks array exists');
    assert.ok(Array.isArray(translated.checksResults), `${locale} checks array exists`);
    assert.strictEqual(
      en.checksResults.length,
      translated.checksResults.length,
      `EN and ${locale} return same number of checks`
    );

    const enById = new Map(en.checksResults.map((r) => [r.ruleId, r]));
    const translatedById = new Map(translated.checksResults.map((r) => [r.ruleId, r]));

    for (const [ruleId, translatedRule] of translatedById.entries()) {
      const enRule = enById.get(ruleId);
      assert.ok(enRule, `Rule ${ruleId} exists in EN results`);

      // ---- Rule-level localization ----
      if (translatedRule.i18n) {
        if (translatedRule.i18n.titleKey) {
          assert.strictEqual(
            typeof translatedRule.title,
            'string',
            `${locale} title resolved for ${ruleId}`
          );
          assert.ok(translatedRule.title.length > 0, `${locale} title non-empty for ${ruleId}`);
        }

        if (translatedRule.i18n.descriptionKey) {
          assert.strictEqual(
            typeof translatedRule.description,
            'string',
            `${locale} description resolved for ${ruleId}`
          );
          assert.ok(
            translatedRule.description.length > 0,
            `${locale} description non-empty for ${ruleId}`
          );
        }
      }

      // ---- Occurrence-level localization ----
      const translatedOccs = Array.isArray(translatedRule.occurrences)
        ? translatedRule.occurrences
        : [];
      const enOccs = Array.isArray(enRule.occurrences) ? enRule.occurrences : [];

      assert.strictEqual(
        translatedOccs.length,
        enOccs.length,
        `Same number of occurrences for ${ruleId}`
      );

      for (let i = 0; i < translatedOccs.length; i++) {
        const translatedOcc = translatedOccs[i];

        if (translatedOcc.i18n) {
          if (translatedOcc.i18n.summaryKey) {
            assert.strictEqual(
              typeof translatedOcc.summary,
              'string',
              `${locale} summary resolved for ${ruleId} occurrence ${i}`
            );
          }

          if (translatedOcc.i18n.hintKey) {
            assert.strictEqual(
              typeof translatedOcc.hint,
              'string',
              `${locale} hint resolved for ${ruleId} occurrence ${i}`
            );
          }
        }
      }
    }
  });
}
