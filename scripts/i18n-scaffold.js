'use strict';

const fs = require('node:fs');
const path = require('node:path');
const prettier = require('prettier');

const ROOT_DIR = path.join(__dirname, '..');
const I18N_DIR = path.join(ROOT_DIR, 'src', 'i18n');

const LOCALE_RE = /^[a-z]{2,3}(-[A-Za-z0-9]+)*$/;
const SPDX_HEADER = '/* SPDX-License-Identifier: MPL-2.0 */';

// Matches a top-level key line in a locale file: bare identifier, or quoted
// when the key is not a valid identifier.
const KEY_LINE_RE = /^ {2}(?:([A-Za-z0-9_$]+)|'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"):/;

function loadDict(filepath) {
  delete require.cache[require.resolve(filepath)];
  return require(filepath);
}

// The section comments and blank lines between keys are the only structure a
// locale file has, so they are parsed out and re-emitted rather than dropped.
function parseLocaleFile(source) {
  const entries = [];
  let comments = [];
  let blankBefore = false;
  let inBlockComment = false;

  for (const line of source.split('\n')) {
    const trimmed = line.trim();

    if (inBlockComment) {
      comments.push(line);
      if (trimmed.endsWith('*/')) inBlockComment = false;
      continue;
    }

    if (trimmed === '') {
      if (comments.length === 0) blankBefore = true;
      continue;
    }

    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      comments.push(line);
      if (trimmed.startsWith('/*') && !trimmed.endsWith('*/')) inBlockComment = true;
      continue;
    }

    const m = KEY_LINE_RE.exec(line);
    if (m) entries.push({ key: m[1] ?? m[2] ?? m[3], blankBefore, comments });

    comments = [];
    blankBefore = false;
  }

  return entries;
}

function readLayout(filepath) {
  return parseLocaleFile(fs.readFileSync(filepath, 'utf8'));
}

// Key order and grouping follow en.js so a diff between two locales shows only
// the values; comments stay in the locale's own language.
function mergeLayout(enLayout, localeLayout) {
  const own = new Map(localeLayout.map((e) => [e.key, e]));
  return enLayout.map((e) => (own.has(e.key) ? { ...e, comments: own.get(e.key).comments } : e));
}

// The dictionary decides which keys are written and in what order; the layout
// only supplies grouping, so a key it does not cover is still emitted.
function serializeLocaleSource(dict, layout = []) {
  const grouping = new Map(layout.map((e) => [e.key, e]));
  const lines = [];

  for (const key of Object.keys(dict)) {
    const { blankBefore = false, comments = [] } = grouping.get(key) || {};
    if (blankBefore && lines.length > 0) lines.push('');
    for (const comment of comments) lines.push(comment);
    lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(dict[key])},`);
  }

  return `${SPDX_HEADER}\n\n'use strict';\n\nmodule.exports = {\n${lines.join('\n')}\n};\n`;
}

async function formatWithPrettier(source, filepath) {
  const config = (await prettier.resolveConfig(filepath)) || {};
  return prettier.format(source, { ...config, filepath, parser: 'babel' });
}

async function writeLocaleFile(outPath, dict, layout) {
  const formatted = await formatWithPrettier(serializeLocaleSource(dict, layout), outPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, formatted, 'utf8');
  return formatted;
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
  const enDict = loadDict(enPath);

  const outPath = path.join(i18nDir, `${locale}.js`);
  if (fs.existsSync(outPath) && !force) {
    throw new Error(
      `${path.relative(ROOT_DIR, outPath)} already exists — use \`npm run i18n:sync\` to bring it up to date without losing translations.`
    );
  }

  await writeLocaleFile(outPath, enDict, readLayout(enPath));

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

module.exports = {
  I18N_DIR,
  LOCALE_RE,
  loadDict,
  parseLocaleFile,
  readLayout,
  mergeLayout,
  serializeLocaleSource,
  formatWithPrettier,
  writeLocaleFile,
  scaffoldLocale
};

if (require.main === module) {
  main();
}
