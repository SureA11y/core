'use strict';

// Messages write decimals as their language does: "2,85:1" in French,
// German and Spanish, "2.85:1" in English and Japanese, whatever the region. The machine-readable
// fields keep plain numbers (round 12, K12-5).

const test = require('node:test');
const assert = require('node:assert');

const { formatLocaleDecimal, localizeNumberParams } = require('../../src/core/number-format.js');
const { runa11yCoreOnHtml } = require('../../src/testing.js');

test('formatLocaleDecimal writes the decimal separator of the locale', () => {
  for (const locale of ['fr', 'fr-CA', 'de', 'de-AT', 'es']) {
    assert.strictEqual(formatLocaleDecimal('1.36', locale), '1,36', locale);
    assert.strictEqual(formatLocaleDecimal(4.5, locale), '4,5', locale);
    assert.strictEqual(formatLocaleDecimal('4.50', locale), '4,50', locale);
    assert.strictEqual(formatLocaleDecimal('-0.5', locale), '-0,5', locale);
  }
  for (const locale of ['en', 'en-GB', 'ja', 'not a locale']) {
    assert.strictEqual(formatLocaleDecimal('1.36', locale), '1.36', locale);
    assert.strictEqual(formatLocaleDecimal(4.5, locale), 4.5, locale);
  }
});

test('formatLocaleDecimal leaves what is not a plain decimal as it is', () => {
  for (const value of ['3', 3, '2.2.1', '0.5px', '1e-7', 1e-7, 'rgba(0, 0, 0, 0.5)', '', null]) {
    assert.strictEqual(formatLocaleDecimal(value, 'fr'), value, String(value));
  }
  assert.strictEqual(formatLocaleDecimal(Infinity, 'fr'), Infinity);
});

test('localizeNumberParams changes ratios, thresholds and pixel sizes only, on a copy', () => {
  const params = {
    ratio: '2.85',
    bestRatio: 3.5,
    threshold: '4.5',
    ownThreshold: 4.5,
    fontSizePx: '18.67',
    fadedOpacity: '0.5',
    backgroundAlpha: '0.5',
    value: '1.5',
    count: 3
  };
  const out = localizeNumberParams(params, 'de');
  assert.deepStrictEqual(out, {
    ratio: '2,85',
    bestRatio: '3,5',
    threshold: '4,5',
    ownThreshold: '4,5',
    fontSizePx: '18,67',
    fadedOpacity: '0.5',
    backgroundAlpha: '0.5',
    value: '1.5',
    count: 3
  });
  assert.strictEqual(params.ratio, '2.85');
  assert.strictEqual(localizeNumberParams(params, 'en'), params);
  assert.strictEqual(localizeNumberParams(params, 'ja'), params);
});

const LOW_CONTRAST = `<!doctype html><html lang="en"><head><title>t</title></head><body style="background:#fff"><main><p style="color:#999;background:#fff;font-size:16px">Hello there</p></main></body></html>`;

for (const [locale, ratio, threshold] of [
  ['en', '2.85:1', '4.5:1'],
  ['ja', '2.85:1', '4.5:1'],
  ['fr', '2,85:1', '4,5:1'],
  ['de', '2,85:1', '4,5:1'],
  ['es', '2,85:1', '4,5:1'],
  // The language of the text written decides, not the region: en-ZA reads
  // English, which writes a point, though South Africa writes a comma;
  // es-419 reads Spanish, as its dictionaries' own "4,5:1" does.
  ['en-ZA', '2.85:1', '4.5:1'],
  ['fr-CA', '2,85:1', '4,5:1'],
  ['de-AT', '2,85:1', '4,5:1'],
  ['es-419', '2,85:1', '4,5:1']
]) {
  test(`a contrast finding writes its ratios as ${locale} does, and keeps plain numbers in its data`, () => {
    const result = runa11yCoreOnHtml(LOW_CONTRAST, {
      runOnly: ['contrast-minimum'],
      engineOptions: { locale }
    });
    const rule = result.checksResults.find((r) => r.ruleId === 'contrast-minimum');
    assert.strictEqual(rule.outcome, 'fail');
    const o = rule.occurrences[0];
    assert.ok(o.summary.includes(ratio), o.summary);
    assert.ok(o.summary.includes(threshold), o.summary);
    assert.ok(o.hint.includes(threshold), o.hint);
    assert.strictEqual(o.i18n.params.ratio, '2.85');
    assert.strictEqual(o.i18n.params.threshold, '4.5');
    assert.strictEqual(typeof o.data.details.metrics.ratio, 'number');
    assert.strictEqual(o.data.details.metrics.threshold, 4.5);
  });
}
