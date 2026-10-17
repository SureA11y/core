'use strict';

/**
 * EN 301 549 built into core is deprecated, for removal in 2.0.0, in favour
 * of @surea11y/pack-en301549. Until then both work, one per scan:
 *
 * - a scan that uses the built-in (an en301549-* profile, or
 *   engineOptions.mappings naming it) runs as before and warns, once per
 *   process;
 * - a scan given a pack whose standard has the key en301549 uses the pack's
 *   entry instead of the built-in, and doesn't warn;
 * - loading @surea11y/core/en301549 warns, once per process.
 *
 * The pack is stood in for by tests/fixtures/packs/en301549-stand-in.js,
 * whose entries carry `fromPack: true`.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { preparePacks, definePack, wcagTags } = require('../src/pack.js');
const { standardsData } = require('../src/coverage/standards.js');
const standIn = require('./fixtures/packs/en301549-stand-in.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<img src="a.png"></main></body></html>';

const SLOT = Symbol.for('surea11y.deprecatedStandardsWarned');

// The scans' warnings about deprecation, from a fresh record.
function deprecationWarnings(fn) {
  delete globalThis[SLOT];
  const original = console.warn;
  const warnings = [];
  console.warn = (msg) => warnings.push(String(msg));
  try {
    return { value: fn(), warnings: warnings.filter((w) => /deprecated/.test(w)) };
  } finally {
    console.warn = original;
  }
}

const scan = (engineOptions) => runa11yCoreOnHtml(HTML, { engineOptions });
const en = (result) =>
  result.checksResults
    .find((c) => c.ruleId === 'img-alt-present')
    .meta.normativeMappings.filter((m) => m.standard === 'EN 301 549');

test('the registry marks the built-in EN 301 549 deprecated, naming its pack and removal', () => {
  const entry = standardsData().find((s) => s.key === 'en301549');
  assert.deepEqual(entry.deprecated, { replacedBy: '@surea11y/pack-en301549', removal: '2.0.0' });
});

test('without the pack, the built-in works as before and warns once per process', () => {
  const { value, warnings } = deprecationWarnings(() => [
    scan({ profile: 'en301549-v4.1.1' }),
    scan({ mappings: 'en301549' }),
    scan({ profile: 'en301549-v3.2.1' })
  ]);
  assert.equal(value[0].engine.profile, 'en301549-v4.1.1');
  assert.deepEqual(value[0].engine.mappings, ['en301549:V4.1.1']);
  assert.deepEqual(
    en(value[1]).map((m) => `${m.version} ${m.requirement}`),
    ['V3.2.1 9.1.1.1', 'V4.1.1 9.1.1.1']
  );
  assert.equal(warnings.length, 1, warnings.join('\n'));
  assert.match(warnings[0], /EN 301 549 built into core is deprecated and goes in 2\.0\.0/);
  assert.match(warnings[0], /@surea11y\/pack-en301549/);
});

test('a scan that names no EN 301 549 does not warn', () => {
  const { warnings } = deprecationWarnings(() => [
    scan({}),
    scan({ profile: 'wcag22-aa' }),
    scan({ profile: 'section508' })
  ]);
  assert.deepEqual(warnings, []);
});

test("given the pack, a scan uses the pack's entries instead of the built-in, and doesn't warn", () => {
  const { value, warnings } = deprecationWarnings(() => [
    scan({ packs: [standIn], profile: 'en301549-v4.1.1' }),
    scan({ packs: [standIn], mappings: 'en301549' })
  ]);
  assert.deepEqual(warnings, []);
  for (const result of value) {
    assert.deepEqual(result.engine.packs, ['en301549-stand-in@1.0.0']);
    assert.equal(result.skippedPacks, undefined);
    assert.ok(en(result).length > 0);
    assert.ok(
      en(result).every((m) => m.fromPack === true),
      JSON.stringify(en(result))
    );
  }
  assert.equal(value[0].engine.profile, 'en301549-v4.1.1');
  // A WCAG rollup names the pack's clause too.
  const rollup = value[1].rulesResults.find((r) => r.ruleId.startsWith('wcag-1.1.1-'));
  const clauses = rollup.meta.normativeMappings.filter((m) => m.standard === 'EN 301 549');
  assert.ok(clauses.length > 0 && clauses.every((m) => m.fromPack === true));
});

test('a pack named "EN 301 549" under another key is still refused', () => {
  const other = definePack({
    name: 'other-en',
    version: '1.0.0',
    namespace: 'otheren',
    core: '*',
    standard: {
      key: 'otheren',
      standard: 'EN 301 549',
      versions: ['1'],
      profiles: { 'otheren-1': { version: '1', tags: wcagTags('2.2') } },
      mappingsFor: () => []
    }
  });
  assert.match(preparePacks([other]).skipped[0].reason, /named "EN 301 549", as one of core's is/);
  assert.deepEqual(preparePacks([standIn]).skipped, []);
});

test('loading @surea11y/core/en301549 warns once per process', () => {
  const entry = path.join(__dirname, '..', 'src', 'en301549.js');
  const script = `
    const warnings = [];
    console.warn = (m) => warnings.push(String(m));
    require(${JSON.stringify(entry)});
    delete require.cache[require.resolve(${JSON.stringify(entry)})];
    const { en301549ClausesForSc } = require(${JSON.stringify(entry)});
    process.stdout.write(JSON.stringify({ warnings, clauses: en301549ClausesForSc('1.1.1').length }));
  `;
  const run = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const { warnings, clauses } = JSON.parse(run.stdout);
  assert.equal(clauses, 2);
  assert.equal(warnings.length, 1, warnings.join('\n'));
  assert.match(warnings[0], /@surea11y\/core\/en301549 is deprecated and goes in 2\.0\.0/);
  assert.match(warnings[0], /@surea11y\/pack-en301549\/public/);
});
