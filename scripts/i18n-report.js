'use strict';

const fs = require('node:fs');

const { i18nSources, loadDictionaries } = require('./lib/dictionaries');

function listLocaleNames(i18nDir) {
  return fs
    .readdirSync(i18nDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}

// Coverage is a heuristic: a key is counted as "translated" when its value
// differs from the English source. A locale seeded by i18n-scaffold.js starts
// with every value identical to English, so this reports 0% until real
// translations replace the placeholders. A handful of strings may legitimately
// stay identical across languages (e.g. a bare "ARIA"), so this slightly
// undercounts in practice, so treat it as a progress signal, not a precise metric.
function computeLocaleReport(enDict, localeDict) {
  const enKeys = Object.keys(enDict);
  const localeKeySet = new Set(Object.keys(localeDict));

  let translated = 0;
  let missing = 0;

  for (const key of enKeys) {
    if (!localeKeySet.has(key)) {
      missing += 1;
      continue;
    }
    if (localeDict[key] !== enDict[key]) {
      translated += 1;
    }
  }

  const orphaned = Object.keys(localeDict).filter((key) => !(key in enDict));

  const total = enKeys.length;
  const percent = total === 0 ? 0 : Math.round((translated / total) * 1000) / 10;

  return { total, translated, missing, orphaned, percent };
}

// One row per locale a dictionary folder has, against that folder's en.json.
function reportFor(i18nDir) {
  const dicts = loadDictionaries([i18nDir]);
  const locales = listLocaleNames(i18nDir).filter((name) => name !== 'en');

  return locales.map((locale) => ({
    locale,
    ...computeLocaleReport(dicts.en, dicts[locale] || {})
  }));
}

// One folder's rows, or by default every folder's (scripts/lib/dictionaries.js),
// each row naming its folder's source: 'core' or the profile's key. A profile
// is reported for the languages it has; the ones it has no file for show its
// messages in English, by choice, and are not counted as untranslated.
function generateReport(i18nDir) {
  if (i18nDir) return reportFor(i18nDir);
  return i18nSources().flatMap(({ key, dir }) =>
    reportFor(dir).map((row) => ({ source: key, ...row }))
  );
}

function main() {
  const rows = generateReport();

  if (rows.length === 0) {
    console.log('[i18n-report] no non-English locale files found in src/i18n/.');
    return;
  }

  console.log('source  locale  translated/total  coverage  missing  orphaned');
  for (const row of rows) {
    console.log(
      `${row.source.padEnd(7)} ${row.locale.padEnd(7)} ${`${row.translated}/${row.total}`.padEnd(17)} ${`${row.percent}%`.padEnd(9)} ${String(row.missing).padEnd(8)} ${row.orphaned.length}`
    );
    if (row.missing > 0) {
      console.log(
        `  missing: run \`npm run build && npm test\` to see which keys still fall back to English.`
      );
    }
    if (row.orphaned.length > 0) {
      console.log(
        `  orphaned keys (not in en.json, likely a typo or a stale key): ${row.orphaned.join(', ')}`
      );
    }
  }
}

module.exports = { computeLocaleReport, generateReport };

if (require.main === module) {
  main();
}
