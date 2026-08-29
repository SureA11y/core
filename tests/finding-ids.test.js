'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { getChecksCatalog } = require('../src/index.js');
const { computeBaselineKey } = require('../src/baseline');

const ROOT = path.join(__dirname, '..');
const INVENTORY = path.join(ROOT, 'scripts', 'data', 'finding-ids.json');
const GENERATOR = path.join(ROOT, 'scripts', 'generate-finding-ids.js');

const committed = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));

// The generator writes in place, so the file is restored afterwards: a failing
// run must not leave the working tree holding a regenerated inventory.
function regenerate() {
  const before = fs.readFileSync(INVENTORY, 'utf8');
  try {
    execFileSync(process.execPath, [GENERATOR], { cwd: ROOT, stdio: 'pipe' });
    return JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  } finally {
    fs.writeFileSync(INVENTORY, before, 'utf8');
  }
}

test('the committed inventory matches a fresh generation', () => {
  assert.deepStrictEqual(
    regenerate(),
    committed,
    'scripts/data/finding-ids.json is stale -- run npm run finding-ids'
  );
});

test('every catalog rule id is in the inventory', () => {
  const catalog = getChecksCatalog()
    .map((r) => r.ruleId)
    .sort();

  assert.deepStrictEqual(catalog, committed.ruleIds);
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
