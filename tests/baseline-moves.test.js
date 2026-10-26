'use strict';

/**
 * src/baseline-moves.json: the findings a minor release gave a new
 * reason code while they stayed the same findings. A baseline written before
 * the release keeps matching them (docs/BASELINE.md, "Upgrading").
 *
 * The table is checked against the inventories: each move starts from a code
 * the last release gave (or DEFAULT, for a rule that gave none) and ends at
 * codes the rule gives now, and a move whose old code the rule still gives is
 * marked as a split. A move from before the last release is gone, as the
 * release freeze drops it.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { matchBaseline, migrateBaselineEntries } = require('../src/baseline.js');
const { renderJunitReport } = require('../src/junit.js');
const { renderSarifReport } = require('../src/sarif.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const MOVES = require('../src/baseline-moves.json').moves;
const readData = (name) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'scripts', 'data', name), 'utf8'));
const RELEASED = readData('released-finding-ids.json');
const CURRENT = readData('finding-ids.json');

const minorOf = (v) => String(v).split('.').slice(0, 2).map(Number);

test('each move starts from a code the last release gave and ends at codes the rule gives now', () => {
  for (const move of MOVES) {
    const label = `${move.ruleId}/${move.from}`;
    assert.ok(CURRENT.ruleIds.includes(move.ruleId), `${label}: no such rule`);
    const before = RELEASED.reasonCodes[move.ruleId] || [];
    assert.ok(
      move.from === 'DEFAULT' || before.includes(move.from),
      `${label}: ${RELEASED.version} did not give ${move.from}`
    );
    const now = CURRENT.reasonCodes[move.ruleId] || [];
    assert.ok(Array.isArray(move.to) && move.to.length, `${label}: moves to no code`);
    for (const to of move.to) {
      assert.ok(now.includes(to), `${label}: the rule does not give ${to}`);
      assert.notEqual(to, move.from, `${label}: moves to itself`);
    }
    assert.equal(
      move.stillGiven === true,
      now.includes(move.from),
      `${label}: stillGiven must say whether the rule still gives ${move.from}`
    );
  }
});

test('no move is listed twice, and none is from before the last release', () => {
  const seen = new Set();
  for (const move of MOVES) {
    const key = `${move.ruleId}/${move.from}`;
    assert.ok(!seen.has(key), `${key} is listed twice`);
    seen.add(key);
    const [major, minor] = minorOf(move.since);
    const [relMajor, relMinor] = minorOf(RELEASED.version);
    assert.ok(
      major > relMajor || (major === relMajor && minor >= relMinor),
      `${key} moved in ${move.since}, before ${RELEASED.version}: the release freeze drops it`
    );
  }
});

// What a baseline written by 1.13 holds for these elements.
const BEFORE = {
  img: { ruleId: 'img-alt-present', reasonCode: 'DEFAULT', html: '<img src="a.png">' },
  list: {
    ruleId: 'list-children-valid',
    reasonCode: 'LIST_INVALID_CHILD',
    html: '<ul id="l"><li role="presentation">A</li></ul>'
  }
};
const PAGE =
  '<!doctype html><html lang="en"><head><title>T</title></head><body><main>' +
  '<img src="a.png"><ul id="l"><li role="presentation">A</li></ul>' +
  '</main></body></html>';

function scan() {
  return runa11yCoreOnHtml(PAGE, { runOnly: ['img-alt-present', 'list-children-valid'] });
}

const codeOf = (result, ruleId) =>
  result.checksResults.find((c) => c.ruleId === ruleId).occurrences[0].data.details.reasonCode;

test('a baseline from before the move matches the findings under their new codes', () => {
  const result = scan();
  assert.equal(codeOf(result, 'img-alt-present'), 'TEXT_ALTERNATIVE_MISSING');
  assert.equal(codeOf(result, 'list-children-valid'), 'LIST_ITEM_ROLE_OVERRIDDEN');

  const match = matchBaseline(result, [
    { ...BEFORE.img, selector: 'img' },
    { ...BEFORE.list, selector: '#l' }
  ]);
  assert.equal(match.totalFail, 2);
  assert.equal(match.knownCount, 2);
  assert.equal(match.newCount, 0);
  assert.equal(match.staleCount, 0);
});

test('an old entry for other markup does not match through a move', () => {
  const match = matchBaseline(scan(), [
    { ...BEFORE.img, html: '<img src="b.png">', selector: 'img' }
  ]);
  assert.equal(match.newCount, 2);
  assert.equal(match.staleCount, 1);
});

test('an old code matches only the codes its finding moved to, in its own rule', () => {
  const result = scan();
  // LIST_INVALID_CHILD did not move to TEXT_ALTERNATIVE_MISSING, nor img-alt-present's DEFAULT in another rule.
  const match = matchBaseline(result, [
    { ruleId: 'img-alt-present', reasonCode: 'LIST_INVALID_CHILD', html: BEFORE.img.html },
    { ruleId: 'list-children-valid', reasonCode: 'DEFAULT', html: BEFORE.list.html }
  ]);
  assert.equal(match.knownCount, 0);
  assert.equal(match.staleCount, 2);
});

test('an entry naming a finding exactly is not taken by one that only matches through a move', () => {
  // Two findings with the same markup: one kept the old code, one moved. One
  // entry under each code: both are known whichever comes first.
  const occurrence = (code) => ({
    selector: 'ul',
    html: '<ul><li role="none">A</li></ul>',
    summary: 's',
    data: { details: { reasonCode: code } }
  });
  const result = {
    url: 'https://example.test/',
    checksResults: [
      {
        ruleId: 'list-children-valid',
        outcome: 'fail',
        occurrences: [occurrence('LIST_ITEM_ROLE_OVERRIDDEN'), occurrence('LIST_INVALID_CHILD')]
      }
    ],
    rulesResults: []
  };
  const html = '<ul><li role="none">A</li></ul>';
  const match = matchBaseline(result, [
    { ruleId: 'list-children-valid', reasonCode: 'LIST_INVALID_CHILD', html },
    { ruleId: 'list-children-valid', reasonCode: 'LIST_INVALID_CHILD', html }
  ]);
  assert.equal(match.knownCount, 2);
  const one = matchBaseline(result, [
    { ruleId: 'list-children-valid', reasonCode: 'LIST_INVALID_CHILD', html }
  ]);
  assert.equal(one.knownCount, 1);
  assert.deepEqual(
    one.newOccurrences.map((o) => o.reasonCode),
    ['LIST_ITEM_ROLE_OVERRIDDEN'],
    'the exact match is kept; the moved finding is the new one'
  );
});

test('JUnit and SARIF leave out a finding an old entry knows under its new code', () => {
  const result = scan();
  const baselineEntries = [BEFORE.img, BEFORE.list];
  const xml = renderJunitReport(result, { baselineEntries });
  assert.ok(!xml.includes('<failure'), xml);
  assert.match(xml, /2 known failures|1 known failure/);
  const sarif = JSON.parse(renderSarifReport(result, { baselineEntries }));
  assert.equal(sarif.runs[0].results.filter((r) => r.level === 'error').length, 0);
});

test('migrateBaselineEntries gives an old entry the code its finding has now', () => {
  const result = scan();
  const migrated = migrateBaselineEntries(
    { version: 1, entries: [BEFORE.img, BEFORE.list, { ...BEFORE.img, html: '<img src="gone">' }] },
    result
  );
  assert.deepEqual(
    migrated.map((e) => e.reasonCode),
    ['TEXT_ALTERNATIVE_MISSING', 'LIST_ITEM_ROLE_OVERRIDDEN', 'DEFAULT']
  );
  assert.equal(BEFORE.img.reasonCode, 'DEFAULT', 'the entries given are not changed');
  // Matched without the table now, as a baseline written today would be.
  const match = matchBaseline(result, migrated);
  assert.equal(match.knownCount, 2);
  assert.equal(match.staleCount, 1);
});

test('migrateBaselineEntries without a result rewrites only a move it can tell', () => {
  const migrated = migrateBaselineEntries([BEFORE.img, BEFORE.list]);
  // img-alt-present's DEFAULT has one new code; LIST_INVALID_CHILD is a split.
  assert.deepEqual(
    migrated.map((e) => e.reasonCode),
    ['TEXT_ALTERNATIVE_MISSING', 'LIST_INVALID_CHILD']
  );
  assert.deepEqual(migrateBaselineEntries(null), []);
});
