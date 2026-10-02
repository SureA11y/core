'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { getChecksCatalog } = require('../src/index.js');
const { computeBaselineKey } = require('../src/baseline');
const { ruleSources } = require('../scripts/lib/rule-dirs');

const ROOT = path.join(__dirname, '..');
const GENERATOR = path.join(ROOT, 'scripts', 'generate-finding-ids.js');

// Core's inventory and each profile's, which the generator writes together.
const INVENTORIES = ruleSources().map((src) => path.join(src.dataDir, 'finding-ids.json'));

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const committedEach = INVENTORIES.map(read);

// Every source's inventory as one: the identities the engine has published.
function merge(inventories) {
  return {
    ruleIds: inventories.flatMap((inv) => inv.ruleIds).sort(),
    reasonCodes: Object.assign({}, ...inventories.map((inv) => inv.reasonCodes))
  };
}
const committed = merge(committedEach);

// The generator writes in place, so the files are restored afterwards: a
// failing run must not leave the working tree holding a regenerated inventory.
function regenerateEach() {
  const before = INVENTORIES.map((file) => fs.readFileSync(file, 'utf8'));
  try {
    execFileSync(process.execPath, [GENERATOR], { cwd: ROOT, stdio: 'pipe' });
    return INVENTORIES.map(read);
  } finally {
    INVENTORIES.forEach((file, i) => fs.writeFileSync(file, before[i], 'utf8'));
  }
}
const regenerate = () => merge(regenerateEach());

test('each committed inventory matches a fresh generation', () => {
  const fresh = regenerateEach();
  INVENTORIES.forEach((file, i) => {
    assert.deepStrictEqual(
      fresh[i],
      committedEach[i],
      `${path.relative(ROOT, file)} is stale -- run npm run finding-ids`
    );
  });
});

test('every catalog rule id is in exactly one inventory', () => {
  const catalog = getChecksCatalog()
    .map((r) => r.ruleId)
    .sort();

  assert.deepStrictEqual(committed.ruleIds, catalog);
});

test('a rule id disappears only through a deprecation entry', () => {
  const live = new Set(getChecksCatalog().map((r) => r.ruleId));
  const deprecatedReplacements = new Set(
    getChecksCatalog()
      .filter((r) => r.deprecated && r.deprecation && r.deprecation.replacedBy)
      .map((r) => r.deprecation.replacedBy)
  );

  const gone = committed.ruleIds.filter((id) => !live.has(id) && !deprecatedReplacements.has(id));

  assert.deepStrictEqual(
    gone,
    [],
    'a published rule id was removed or renamed: keep it and mark it deprecated with replacedBy, ' +
      'or accept a major bump -- see docs/API_STABILITY.md'
  );
});

test('a shipped reason code is never dropped from a rule', () => {
  const fresh = regenerate().reasonCodes;
  const lost = [];

  for (const [ruleId, codes] of Object.entries(committed.reasonCodes)) {
    const now = new Set(fresh[ruleId] || []);
    for (const code of codes) {
      if (!now.has(code)) lost.push(`${ruleId}/${code}`);
    }
  }

  assert.deepStrictEqual(
    lost,
    [],
    'a reason code went away, which breaks every stored baseline entry and Code Scanning ' +
      'alert keyed on it -- see docs/API_STABILITY.md'
  );
});

test('the fingerprint is built from inventoried identities only', () => {
  const ruleId = committed.ruleIds[0];
  const code = committed.reasonCodes[ruleId] ? committed.reasonCodes[ruleId][0] : 'DEFAULT';
  const parts = computeBaselineKey(ruleId, code, '<img src="x.png">').split('\u0000');

  assert.deepStrictEqual(parts, [ruleId, code, '<img src="x.png">']);
  assert.ok(committed.ruleIds.includes(parts[0]), 'the rule id is inventoried');
});
