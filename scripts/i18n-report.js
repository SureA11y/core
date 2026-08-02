'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.join(__dirname, '..');
const I18N_DIR = path.join(ROOT_DIR, 'src', 'i18n');

function loadLocaleDict(i18nDir, name) {
  const abs = path.join(i18nDir, `${name}.js`);
  delete require.cache[require.resolve(abs)];
  return require(abs);
}

function listLocaleNames(i18nDir) {
  return fs
    .readdirSync(i18nDir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => f.replace(/\.js$/, ''));
}

// Coverage is a heuristic: a key is counted as "translated" when its value
// differs from the English source. A locale seeded by i18n-scaffold.js starts
// with every value identical to English, so this reports 0% until real
// translations replace the placeholders. A handful of strings may legitimately
// stay identical across languages (e.g. a bare "ARIA"), so this slightly
// undercounts in practice — treat it as a progress signal, not a precise metric.
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

function generateReport(i18nDir = I18N_DIR) {
  const enDict = loadLocaleDict(i18nDir, 'en');
  const locales = listLocaleNames(i18nDir).filter((name) => name !== 'en');

  return locales.map((locale) => ({
    locale,
    ...computeLocaleReport(enDict, loadLocaleDict(i18nDir, locale))
  }));
}

function main() {
  const rows = generateReport();

  if (rows.length === 0) {
    console.log('[i18n-report] no non-English locale files found in src/i18n/.');
    return;
  }

  console.log('locale  translated/total  coverage  missing  orphaned');
  for (const row of rows) {
    console.log(
      `${row.locale.padEnd(7)} ${`${row.translated}/${row.total}`.padEnd(17)} ${`${row.percent}%`.padEnd(9)} ${String(row.missing).padEnd(8)} ${row.orphaned.length}`
    );
    if (row.missing > 0) {
      console.log(
        `  missing: run \`npm run build && npm test\` to see which keys still fall back to English.`
      );
    }
    if (row.orphaned.length > 0) {
      console.log(
        `  orphaned keys (not in en.js, likely a typo or a stale key): ${row.orphaned.join(', ')}`
      );
    }
  }
}

module.exports = { computeLocaleReport, generateReport };

if (require.main === module) {
  main();
}
