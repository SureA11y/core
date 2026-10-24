'use strict';

/**
 * Every rule documents the reason codes it can give, in its header's
 * @reason-codes: one item per code, with its outcome, what it means and the
 * standards it rests on (docs/RULE_AUTHORING.md). The documented codes must
 * be exactly the rule's codes in the finding-ids inventory, so a code can be
 * neither missing nor stale.
 *
 * Rules written before the tag existed are listed in
 * scripts/data/reason-codes-pending.json until they are documented. The list
 * can only shrink: a rule on it that has the tag must leave it, and any rule
 * not on it, a new one included, must have the tag.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { readRuleProse } = require('../src/rule-docs.js');
const { ruleDirs, ruleSources } = require('../scripts/lib/rule-dirs');

const ROOT = path.join(__dirname, '..');
// How a basis item applies, in a parenthesis after it.
const QUALIFIERS = 'MUST, SHOULD, MAY, not settled, best practice, or exception: <which>';
const QUALIFIER = /^(MUST|SHOULD|MAY|not settled|best practice|exception: .+)$/;
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const inventory = Object.assign(
  {},
  ...ruleSources().map((src) => read(path.join(src.dataDir, 'finding-ids.json')).reasonCodes)
);
const pending = new Set(read(path.join(ROOT, 'scripts/data/reason-codes-pending.json')).rules);
const prose = new Map(ruleDirs().flatMap((dir) => [...readRuleProse(dir)]));

test('every rule in the inventory has a header that can be read', () => {
  const ruleIds = ruleSources().flatMap(
    (src) => read(path.join(src.dataDir, 'finding-ids.json')).ruleIds
  );
  assert.deepEqual(
    ruleIds.filter((id) => !prose.has(id)),
    [],
    'these rules did not load, or have no header'
  );
});

test('every rule not on the pending list documents its reason codes', () => {
  const missing = [...prose.keys()].filter((id) => !pending.has(id) && !prose.get(id).reasonCodes);
  assert.deepEqual(missing, [], 'add @reason-codes to these rules (docs/RULE_AUTHORING.md)');
});

test('a rule on the pending list that is documented leaves it', () => {
  const done = [...pending].filter((id) => prose.has(id) && prose.get(id).reasonCodes);
  assert.deepEqual(done, [], 'remove these rules from scripts/data/reason-codes-pending.json');
  const unknown = [...pending].filter((id) => !prose.has(id));
  assert.deepEqual(unknown, [], 'these pending rules no longer exist');
});

test('documented reason codes are exactly the codes each rule gives', () => {
  for (const [id, p] of prose) {
    if (!p.reasonCodes) continue;
    const bad = p.reasonCodes.filter((c) => c.error).map((c) => c.error);
    assert.deepEqual(
      bad,
      [],
      `${id}: items that don't read as "- \`CODE\` (outcome): meaning. Basis: ..."`
    );
    const documented = p.reasonCodes.map((c) => c.code).sort();
    assert.deepEqual(documented, [...new Set(documented)], `${id}: a code is documented twice`);
    assert.deepEqual(
      documented,
      [...(inventory[id] || [])].sort(),
      `${id}: @reason-codes and the finding-ids inventory differ`
    );
    for (const c of p.reasonCodes) {
      assert.ok(c.meaning, `${id} ${c.code}: says nothing about what it means`);
      assert.ok(c.basis.length, `${id} ${c.code}: names no basis`);
      for (const b of c.basis) {
        const q = /\(([^)]*)\)$/.exec(b);
        if (q)
          assert.ok(
            QUALIFIER.test(q[1]),
            `${id} ${c.code}: "${b}" qualifies its basis with "${q[1]}"; use ${QUALIFIERS}`
          );
      }
    }
  }
});
