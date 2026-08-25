'use strict';

/**
 * The exports map is a public contract: a consumer can only reach the paths it
 * names. The browser bundle and the locale side files are both reached by path
 * rather than by require()ing a module -- a binding reads them as text and
 * evaluates them inside the page -- so a missing entry does not fail loudly at
 * build time, it fails at scan time in someone else's project.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const ROOT_DIR = path.join(__dirname, '..', '..');
const pkg = require(path.join(ROOT_DIR, 'package.json'));

// Resolve the way a consumer does: by package name, through the exports map.
const CONSUMER_DIR = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'surea11y-exports-'));
const scopeDir = path.join(CONSUMER_DIR, 'node_modules', '@surea11y');
fs.mkdirSync(scopeDir, { recursive: true });
fs.symlinkSync(ROOT_DIR, path.join(scopeDir, 'core'), 'dir');
const consumerRequire = createRequire(path.join(CONSUMER_DIR, 'index.js'));

const SHIPPED_LOCALES = fs
  .readdirSync(ROOT_DIR)
  .filter((f) => /^surea11y\.i18n\..+\.js$/.test(f))
  .map((f) => f.replace(/^surea11y\.i18n\.|\.js$/g, ''));

test('the browser bundle is reachable by path', () => {
  const resolved = consumerRequire.resolve('@surea11y/core/browser');
  assert.equal(path.basename(resolved), 'surea11y.browser.js');
  assert.ok(fs.readFileSync(resolved, 'utf8').includes('a11ycore'));
});

test('every shipped locale side file is reachable by path', () => {
  assert.ok(SHIPPED_LOCALES.length > 0, 'expected at least one locale side file');

  for (const locale of SHIPPED_LOCALES) {
    const resolved = consumerRequire.resolve(`@surea11y/core/i18n/${locale}`);
    assert.equal(path.basename(resolved), `surea11y.i18n.${locale}.js`);
  }
});

test('a locale this build does not ship fails to resolve rather than resolving to nothing', () => {
  // Bindings branch on this: an unresolvable locale means fall back to English,
  // not carry on with an empty dictionary.
  assert.throws(() => consumerRequire.resolve('@surea11y/core/i18n/qqq'), {
    code: 'MODULE_NOT_FOUND'
  });
});

test('every locale side file the exports map can reach is also published', () => {
  const patterns = Object.keys(pkg.exports);
  assert.ok(patterns.includes('./i18n/*'), 'exports map should expose the locale side files');
  assert.ok(
    pkg.files.some((f) => f.startsWith('surea11y.i18n.')),
    'files should publish the locale side files the exports map points at'
  );
});
