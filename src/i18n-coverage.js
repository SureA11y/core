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
 * English, so it reads 0% until real translations replace them. A few strings
 * may rightly stay the same in another language (a bare "ARIA"), so this
 * slightly undercounts: a progress signal, not an exact measure.
 *
 * @param {Record<string, string>} sourceDict the English dictionary
 * @param {Record<string, string>} localeDict the dictionary to measure
 * @param {Record<string, true>} [excluded] keys left out of this locale on
 *   purpose (a profile that offers no file for it): shown in English by
 *   choice, so counted neither as keys nor as missing
 * @returns {{ total: number, translated: number, missing: number,
 *   orphaned: string[], percent: number }}
 */
function computeLocaleReport(sourceDict, localeDict, excluded) {
  const skip = excluded || {};
  const sourceKeys = Object.keys(sourceDict).filter((key) => !skip[key]);
  let translated = 0;
  let missing = 0;
  for (const key of sourceKeys) {
    if (!Object.prototype.hasOwnProperty.call(localeDict, key)) {
      missing += 1;
      continue;
    }
    if (localeDict[key] !== sourceDict[key]) translated += 1;
  }
  const orphaned = Object.keys(localeDict).filter(
    (key) => !Object.prototype.hasOwnProperty.call(sourceDict, key)
  );
  const total = sourceKeys.length;
  const percent = total === 0 ? 0 : Math.round((translated / total) * 1000) / 10;
  return { total, translated, missing, orphaned, percent };
}

module.exports = { computeLocaleReport };
