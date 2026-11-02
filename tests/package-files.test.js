'use strict';

/**
 * Every module the package's entry points load is published: listed in
 * package.json's `files`. A module left out loads from the repository, so
 * the tests pass, and fails with MODULE_NOT_FOUND for everyone who installs
 * the package (src/core/evidence-state.js was nearly shipped that way).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const pkg = require('../package.json');

// A `files` entry as a pattern, as npm reads it: `**/` any directories,
// none included, `**` any path, `*` any name.
function patternOf(entry) {
  const source = entry
    .split('**/')
    .map((part) => part.replace(/\*\*/g, '\u0000'))
    .join('\u0001')
    .split('\u0000')
    .map((part) =>
      part
        .split('*')
        .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
        .join('[^/]*')
    )
    .join('.*')
    .split('\u0001')
    .join('(?:.*/)?');
  return new RegExp(`^${source}$`);
}
const published = pkg.files.map(patternOf);
// npm publishes package.json whatever `files` says.
const isPublished = (rel) => rel === 'package.json' || published.some((re) => re.test(rel));

// The entry points' own files: each `exports` target that Node loads.
function entryFiles() {
  const out = new Set();
  const visit = (target) => {
    if (typeof target === 'string') {
      if (target.endsWith('.js') && !target.includes('*')) out.add(target);
    } else if (target && typeof target === 'object') {
      for (const [condition, value] of Object.entries(target)) {
        if (condition !== 'types' && condition !== 'import') visit(value);
      }
    }
  };
  visit(pkg.exports);
  out.add(pkg.main);
  return [...out];
}

test("every module the package's entry points load is in package.json's files", () => {
  const entries = entryFiles();
  assert.ok(entries.includes('src/index.js'));
  for (const entry of entries) require(path.join(ROOT, entry));
  const loaded = Object.keys(require.cache)
    .filter(
      (file) =>
        file.startsWith(ROOT + path.sep) && !file.includes(`${path.sep}node_modules${path.sep}`)
    )
    .map((file) => path.relative(ROOT, file).split(path.sep).join('/'))
    .filter((rel) => !rel.startsWith('tests/'));
  assert.ok(loaded.includes('src/core/evidence-state.js'));
  const missing = loaded.filter((rel) => !isPublished(rel)).sort();
  assert.deepEqual(missing, [], 'loaded by an entry point but not published');
});
