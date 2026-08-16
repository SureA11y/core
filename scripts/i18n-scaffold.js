'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.join(__dirname, '..');
const I18N_DIR = path.join(ROOT_DIR, 'src', 'i18n');

const LOCALE_RE = /^[a-z]{2,3}(-[A-Za-z0-9]+)*$/;

function localePath(locale, i18nDir = I18N_DIR) {
  return path.join(i18nDir, `${locale}.json`);
}

function listLocales(i18nDir = I18N_DIR) {
  return fs
    .readdirSync(i18nDir)
    .filter((f) => f.endsWith('.json') && f !== 'en.json')
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

function loadDict(filepath) {
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

// Plain two-space JSON with no blank lines: what every editor's format-on-save
// produces, so a contributor's tooling cannot fight `i18n:check`.
function serializeLocale(dict) {
  return `${JSON.stringify(dict, null, 2)}\n`;
}

function writeLocaleFile(outPath, dict) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, serializeLocale(dict), 'utf8');
}

function scaffoldLocale(locale, { i18nDir = I18N_DIR, force = false } = {}) {
  if (!locale || !LOCALE_RE.test(locale)) {
    throw new Error(
      `"${locale}" doesn't look like a locale code (expected something like "de", "es", "pt-BR").`
    );
  }
  if (locale === 'en') {
    throw new Error('en.json is the canonical source locale; nothing to scaffold.');
  }

  const enDict = loadDict(localePath('en', i18nDir));

  const outPath = localePath(locale, i18nDir);
  if (fs.existsSync(outPath) && !force) {
    throw new Error(
      `${path.relative(ROOT_DIR, outPath)} already exists — use \`npm run i18n:sync\` to bring it up to date without losing translations.`
    );
  }

  writeLocaleFile(outPath, enDict);

  return { outPath, keyCount: Object.keys(enDict).length };
}

function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const locale = args.find((a) => !a.startsWith('--'));

  if (!locale) {
    console.error('Usage: node scripts/i18n-scaffold.js <locale> [--force]');
    console.error('Example: node scripts/i18n-scaffold.js pt-BR');
    process.exitCode = 2;
    return;
  }

  try {
    const { outPath, keyCount } = scaffoldLocale(locale, { force });
    console.log(
      `[i18n-scaffold] wrote ${path.relative(ROOT_DIR, outPath)} (${keyCount} keys, seeded with the English text as a placeholder).`
    );
    console.log(
      '[i18n-scaffold] translate the values in that file, then run `npm run i18n:report` to check progress.'
    );
  } catch (e) {
    console.error(`[i18n-scaffold] ${e.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  I18N_DIR,
  LOCALE_RE,
  localePath,
  listLocales,
  loadDict,
  serializeLocale,
  writeLocaleFile,
  scaffoldLocale
};

if (require.main === module) {
  main();
}
