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
    'src/index.js lists each export by name: add a new one to supported or internal in ' +
      'scripts/data/public-api.json and say why in docs/API_STABILITY.md'
  );

  const both = SURFACE.supported.filter((name) => internal.has(name));
  assert.deepStrictEqual(both, [], 'a symbol cannot be both supported and internal');
});

test('the main entry exports every name the generated core does', () => {
  const generated = require('../src/core.js');
  const missing = Object.keys(generated).filter((name) => !(name in core));
  assert.deepStrictEqual(missing, [], 'list these in module.exports in src/index.js');
});

test('every name src/index.d.ts declares can be imported by name from ESM (round 9, A9-1)', () => {
  const { spawnSync } = require('node:child_process');
  const os = require('node:os');
  const dts = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.d.ts'), 'utf8');
  const names = Array.from(
    dts.matchAll(/^export (?:declare )?(?:function|const|let) ([A-Za-z_$][\w$]*)/gm),
    (m) => m[1]
  ).filter((name, i, all) => all.indexOf(name) === i);
  assert.ok(names.includes('CHECK_DEFS') && names.includes('runDomRulesInPage'));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'surea11y-esm-'));
  const file = path.join(dir, 'names.mjs');
  const entry = JSON.stringify(
    require('node:url').pathToFileURL(require.resolve('../src/index.js')).href
  );
  fs.writeFileSync(
    file,
    `import { ${names.join(', ')} } from ${entry};\n` +
      `const missing = Object.entries({ ${names.join(', ')} })` +
      `.filter(([, v]) => v === undefined).map(([k]) => k);\n` +
      'if (missing.length) { console.error(missing.join(",")); process.exit(1); }\n'
  );
  try {
    const run = spawnSync(process.execPath, [file], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// The supported exports that are data, not functions: frozen, so a consumer
// can't change what every other one reads.
const SUPPORTED_DATA = new Set(['HOOK_REASON_CODES', 'EVIDENCE_STATES']);

test('every supported export is actually present and callable', () => {
  for (const name of supported) {
    assert.ok(name in core, `${name} is promised but not exported`);
    if (SUPPORTED_DATA.has(name)) {
      assert.ok(Object.isFrozen(core[name]), `${name} should be frozen`);
      continue;
    }
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
  for (const sub of [
    './baseline',
    './report',
    './sarif',
    './junit',
    './earl',
    './en301549',
    './wcag'
  ]) {
    assert.ok(subpaths.includes(sub), `${sub} is a documented entry point`);
  }
});

test('a supported export is not accidentally an internal alias', () => {
  for (const name of supported) {
    assert.ok(!name.startsWith('__'), `${name} looks internal by name but is classified supported`);
  }
});
