/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Regenerates the IANA language subtag list inside src/core/dom-helpers.js.
 *
 * Usage:
 *   node scripts/generate-language-subtags.js
 *   node scripts/generate-language-subtags.js --check
 *
 * language-subtag-registry is a devDependency and the list is committed, so
 * the engine keeps zero runtime dependencies. Only primary language subtags
 * are emitted: region, script and variant subtags are validated by shape.
 */

const fs = require('node:fs');
const path = require('node:path');
const registry = require('language-subtag-registry/data/json/registry.json');

const TARGET = path.join(__dirname, '..', 'src', 'core', 'dom-helpers.js');
const BEGIN = '  // <generated:language-subtags>';
const END = '  // </generated:language-subtags>';

function main() {
  const subtags = registry
    .filter((r) => r.Type === 'language' && r.Subtag)
    .map((r) => r.Subtag.toLowerCase())
    .sort();
  const unique = [...new Set(subtags)];

  // Stored space-joined and split once at first use: a literal array of this
  // many strings would add far more to the bundle than the string does.
  const replacement = [BEGIN, `  const LANGUAGE_SUBTAGS = '${unique.join(' ')}';`, END].join('\n');

  const source = fs.readFileSync(TARGET, 'utf8');
  const start = source.indexOf(BEGIN);
  const stop = source.indexOf(END);
  if (start === -1 || stop === -1) throw new Error('Markers not found in ' + TARGET);
  const next = source.slice(0, start) + replacement + source.slice(stop + END.length);

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
    `Wrote ${unique.length} language subtag(s) into ${path.relative(process.cwd(), TARGET)}`
  );
}

main();
