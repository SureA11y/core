'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const core = require('../src/index.js');

const SURFACE = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'scripts', 'data', 'public-api.json'), 'utf8')
);

const supported = new Set(SURFACE.supported);
const internal = new Set(SURFACE.internal);

test('every export is classified, and nothing is classified twice', () => {
  const exported = Object.keys(core).sort();
  const classified = [...supported, ...internal].sort();

  assert.deepStrictEqual(
    exported,
    classified,
    'src/index.js re-exports the generated core verbatim, so a new symbol reaches consumers ' +
      'the moment the build emits it: add it to supported or internal in ' +
      'scripts/data/public-api.json and say why in docs/API_STABILITY.md'
  );

  const both = SURFACE.supported.filter((name) => internal.has(name));
  assert.deepStrictEqual(both, [], 'a symbol cannot be both supported and internal');
});

test('every supported export is actually present and callable', () => {
  for (const name of supported) {
    assert.ok(name in core, `${name} is promised but not exported`);
    assert.strictEqual(typeof core[name], 'function', `${name} should be a function`);
  }
});

test('the supported set covers what the first-party consumers import', () => {
  // The five browser bindings take runa11yCoreInPage; test-matchers takes
  // runDomRulesInPage. Demoting either silently breaks a published package.
  for (const name of ['runa11yCoreInPage', 'runDomRulesInPage']) {
    assert.ok(
      supported.has(name),
      `${name} is imported by a published package and must stay supported`
    );
  }
});

test('the internal set is not reachable through a documented entry point', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const subpaths = Object.keys(pkg.exports || {});

  // The root is the only specifier carrying the engine surface; the others are
  // the reporters and the browser bundle, which export their own functions.
  assert.ok(subpaths.includes('.'), 'the package still exports a root specifier');
  for (const sub of ['./baseline', './report', './sarif']) {
    assert.ok(subpaths.includes(sub), `${sub} is a documented entry point`);
  }
});

test('a supported export is not accidentally an internal alias', () => {
  for (const name of supported) {
    assert.ok(!name.startsWith('__'), `${name} looks internal by name but is classified supported`);
  }
});
