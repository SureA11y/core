/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Regenerates the IANA language subtag list inside src/core/dom-helpers.js,
 * and the list of three-letter ISO 639 codes the registry leaves out.
 *
 * Usage:
 *   node scripts/generate-language-subtags.js
 *   node scripts/generate-language-subtags.js --check
 *
 * language-subtag-registry is a devDependency and the list is committed, so
 * the engine keeps zero runtime dependencies. Only primary language subtags
 * are emitted: region, script and variant subtags are validated by shape.
 * The registry lists a three-letter code only for a language with no
 * two-letter one, so the ISO 639-2 codes (terminology and bibliographic) and
 * ISO 639-3 codes of the languages that have one (eng, fra, fre, hbs…) come
 * from the iso-639-2 and iso-639-3 devDependencies, for the rules and
 * standards that accept any ISO 639 code (isIso639LanguageCode).
 * Output is run through Prettier before it is written or compared, as
 * generate-aria-tables.js does, so `--check` measures the data and not the
 * line wrapping.
 */

const fs = require('node:fs');
const path = require('node:path');
const prettier = require('prettier');
const registry = require('language-subtag-registry/data/json/registry.json');

const TARGET = path.join(__dirname, '..', 'src', 'core', 'dom-helpers.js');
const BEGIN = '  // <generated:language-subtags>';
const END = '  // </generated:language-subtags>';
const ISO_BEGIN = '  // <generated:iso-639-alpha3>';
const ISO_END = '  // </generated:iso-639-alpha3>';

// Replaces what lies between two markers, both kept.
function between(source, begin, end, replacement) {
  const start = source.indexOf(begin);
  const stop = source.indexOf(end);
  if (start === -1 || stop === -1) throw new Error('Markers not found in ' + TARGET);
  return (
    source.slice(0, start) + [begin, replacement, end].join('\n') + source.slice(stop + end.length)
  );
}

async function main() {
  const subtags = registry
    .filter((r) => r.Type === 'language' && r.Subtag)
    .map((r) => r.Subtag.toLowerCase())
    .sort();
  const unique = [...new Set(subtags)];

  // The ISO packages are ES modules only, so they are imported, not required.
  const { iso6392BTo1, iso6392TTo1 } = await import('iso-639-2');
  const { iso6393 } = await import('iso-639-3');
  const alpha3 = [
    ...new Set([
      ...Object.keys(iso6392BTo1),
      ...Object.keys(iso6392TTo1),
      ...iso6393.filter((l) => l.iso6391).map((l) => l.iso6393)
    ])
  ]
    .map((c) => c.toLowerCase())
    .sort();

  // Stored space-joined and split once at first use: a literal array of this
  // many strings would add far more to the bundle than the string does.
  const source = fs.readFileSync(TARGET, 'utf8');
  let replaced = between(source, BEGIN, END, `  const LANGUAGE_SUBTAGS = '${unique.join(' ')}';`);
  replaced = between(
    replaced,
    ISO_BEGIN,
    ISO_END,
    `  const ISO_639_ALPHA3_WITH_ALPHA2 = '${alpha3.join(' ')}';`
  );
  const options = (await prettier.resolveConfig(TARGET)) || {};
  const next = await prettier.format(replaced, { ...options, filepath: TARGET });

  if (process.argv.includes('--check')) {
    if (next !== source) {
      console.error('Language subtags are stale. Run: node scripts/generate-language-subtags.js');
      process.exit(1);
    }
    console.log('Language subtags are up to date.');
    return;
  }
  fs.writeFileSync(TARGET, next);
  console.log(
    `Wrote ${unique.length} language subtag(s) and ${alpha3.length} ISO 639 code(s) into ${path.relative(process.cwd(), TARGET)}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
