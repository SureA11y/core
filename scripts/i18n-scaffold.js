'use strict';

const fs = require('node:fs');
const path = require('node:path');
const prettier = require('prettier');

const ROOT_DIR = path.join(__dirname, '..');
const I18N_DIR = path.join(ROOT_DIR, 'src', 'i18n');

const LOCALE_RE = /^[a-z]{2,3}(-[A-Za-z0-9]+)*$/;

function generateScaffoldSource(enDict) {
  const entries = Object.keys(enDict).map(
    (key) => `${JSON.stringify(key)}: ${JSON.stringify(enDict[key])},`
  );
  return `'use strict';\n\nmodule.exports = {\n${entries.map((l) => `  ${l}`).join('\n')}\n};\n`;
}

async function formatWithPrettier(source, filepath) {
  const config = (await prettier.resolveConfig(filepath)) || {};
  return prettier.format(source, { ...config, filepath, parser: 'babel' });
}

async function scaffoldLocale(locale, { i18nDir = I18N_DIR, force = false } = {}) {
  if (!locale || !LOCALE_RE.test(locale)) {
    throw new Error(
      `"${locale}" doesn't look like a locale code (expected something like "de", "es", "pt-BR").`
    );
  }
  if (locale === 'en') {
    throw new Error('en.js is the canonical source locale; nothing to scaffold.');
  }

  const enPath = path.join(i18nDir, 'en.js');
  delete require.cache[require.resolve(enPath)];
  const enDict = require(enPath);

  const outPath = path.join(i18nDir, `${locale}.js`);
  if (fs.existsSync(outPath) && !force) {
    throw new Error(
      `${path.relative(ROOT_DIR, outPath)} already exists (pass --force to overwrite).`
    );
  }

  const raw = generateScaffoldSource(enDict);
  const formatted = await formatWithPrettier(raw, outPath);
  fs.mkdirSync(i18nDir, { recursive: true });
  fs.writeFileSync(outPath, formatted, 'utf8');

  return { outPath, keyCount: Object.keys(enDict).length };
}

async function main() {
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
    const { outPath, keyCount } = await scaffoldLocale(locale, { force });
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

module.exports = { generateScaffoldSource, scaffoldLocale };

if (require.main === module) {
  main();
}
