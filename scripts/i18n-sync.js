'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  I18N_DIR,
  loadDict,
  readLayout,
  mergeLayout,
  serializeLocaleSource,
  formatWithPrettier
} = require('./i18n-scaffold.js');

function listLocales(i18nDir) {
  return fs
    .readdirSync(i18nDir)
    .filter((f) => f.endsWith('.js') && f !== 'en.js')
    .map((f) => f.replace(/\.js$/, ''))
    .sort();
}

// Existing values are carried over untouched; a key new to English is seeded
// with the English text, which is what i18n-report counts as untranslated.
function syncDict(enDict, localeDict) {
  const dict = {};
  const added = [];

  for (const key of Object.keys(enDict)) {
    if (key in localeDict) {
      dict[key] = localeDict[key];
    } else {
      dict[key] = enDict[key];
      added.push(key);
    }
  }

  const removed = Object.keys(localeDict).filter((key) => !(key in enDict));
  const untranslated = Object.keys(dict).filter((key) => dict[key] === enDict[key]);

  return { dict, added, removed, untranslated };
}

async function syncLocale(locale, { i18nDir = I18N_DIR, check = false } = {}) {
  const enPath = path.join(i18nDir, 'en.js');
  const filePath = path.join(i18nDir, `${locale}.js`);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `src/i18n/${locale}.js does not exist — run \`npm run i18n:new ${locale}\` to create it.`
    );
  }

  const result = syncDict(loadDict(enPath), loadDict(filePath));
  const layout = mergeLayout(readLayout(enPath), readLayout(filePath));
  const source = await formatWithPrettier(serializeLocaleSource(result.dict, layout), filePath);
  const changed = source !== fs.readFileSync(filePath, 'utf8');

  if (changed && !check) fs.writeFileSync(filePath, source, 'utf8');

  return { locale, filePath, changed, ...result };
}

async function syncAll({ i18nDir = I18N_DIR, locales, check = false } = {}) {
  const targets = locales && locales.length ? locales : listLocales(i18nDir);
  const results = [];

  for (const locale of targets) {
    results.push(await syncLocale(locale, { i18nDir, check }));
  }

  return results;
}

function describe(result, check) {
  const changes = [];
  if (result.added.length) changes.push(`${result.added.length} added`);
  if (result.removed.length) changes.push(`${result.removed.length} removed`);
  if (result.changed && !changes.length) changes.push('reordered');

  const status = result.changed ? (check ? 'needs sync' : 'updated') : 'unchanged';
  const detail = changes.length ? ` (${changes.join(', ')})` : '';
  return `${result.locale.padEnd(6)} ${status}${detail}, ${result.untranslated.length} untranslated`;
}

async function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const locales = args.filter((a) => !a.startsWith('--'));

  try {
    const results = await syncAll({ locales, check });

    if (!results.length) {
      console.log('[i18n-sync] no non-English locale files found in src/i18n/.');
      return;
    }

    for (const result of results) {
      console.log(`[i18n-sync] ${describe(result, check)}`);
      for (const key of result.removed) {
        console.log(`  removed (no longer in en.js): ${key}`);
      }
    }

    const stale = results.filter((r) => r.changed);
    if (check && stale.length) {
      console.error(
        `[i18n-sync] ${stale.map((r) => r.locale).join(', ')} out of sync with en.js — run \`npm run i18n:sync\`.`
      );
      process.exitCode = 1;
      return;
    }

    const untranslated = results.reduce((n, r) => n + r.untranslated.length, 0);
    if (untranslated > 0 && !check) {
      console.log(
        `[i18n-sync] ${untranslated} value(s) still carry the English text; run \`npm run i18n:report\` for per-locale coverage.`
      );
    }
  } catch (e) {
    console.error(`[i18n-sync] ${e.message}`);
    process.exitCode = 1;
  }
}

module.exports = { listLocales, syncDict, syncLocale, syncAll };

if (require.main === module) {
  main();
}
