/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * How much of a translation dictionary differs from the English source.
 *
 * Shared by the engine's getLocaleCoverage() (the dictionaries the package
 * ships) and scripts/i18n-report.js (a dictionary folder on disk), so the two
 * count the same way.
 *
 * A key counts as translated when its value differs from English. A locale
 * scaffolded by scripts/i18n-scaffold.js starts with every value equal to
 * English, so it reads 0% until real translations replace them. A string that
 * is rightly the same in a language ("Element" in German) counts as
 * translated when src/i18n-same-as-english.json lists it with the English
 * text it was checked against; if the English has changed since, it counts
 * as untranslated again.
 *
 * @param {Record<string, string>} sourceDict the English dictionary
 * @param {Record<string, string>} localeDict the dictionary to measure
 * @param {Record<string, true>} [excluded] keys left out of this locale on
 *   purpose (a profile that offers no file for it): shown in English by
 *   choice, so counted neither as keys nor as missing
 * @param {Record<string, string>} [sameAsEnglish] keys this locale rightly
 *   leaves as in English, each with the English text it was checked against
 *   (sameAsEnglishFor(locale))
 * @returns {{ total: number, translated: number, missing: number,
 *   orphaned: string[], percent: number }}
 */
function computeLocaleReport(sourceDict, localeDict, excluded, sameAsEnglish) {
  const skip = excluded || {};
  const same = sameAsEnglish || {};
  const sourceKeys = Object.keys(sourceDict).filter((key) => !skip[key]);
  let translated = 0;
  let missing = 0;
  for (const key of sourceKeys) {
    if (!Object.prototype.hasOwnProperty.call(localeDict, key)) {
      missing += 1;
      continue;
    }
    if (localeDict[key] !== sourceDict[key]) translated += 1;
    else if (Object.prototype.hasOwnProperty.call(same, key) && same[key] === sourceDict[key]) {
      translated += 1;
    }
  }
  const orphaned = Object.keys(localeDict).filter(
    (key) => !Object.prototype.hasOwnProperty.call(sourceDict, key)
  );
  const total = sourceKeys.length;
  const percent = total === 0 ? 0 : Math.round((translated / total) * 1000) / 10;
  return { total, translated, missing, orphaned, percent };
}

const SAME_AS_ENGLISH = require('./i18n-same-as-english.json');

// The strings a locale rightly leaves as in English, as { key: englishText }.
function sameAsEnglishFor(locale) {
  const entries = locale !== '$comment' && SAME_AS_ENGLISH[locale];
  return entries && typeof entries === 'object' ? { ...entries } : {};
}

module.exports = { computeLocaleReport, sameAsEnglishFor };
