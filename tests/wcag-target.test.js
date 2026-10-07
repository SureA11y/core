'use strict';

/**
 * runOnly.wcag: a WCAG version and level, { version, level }, selects the
 * rules for that version's criteria at that level and below, by each
 * criterion's level in that version (src/coverage/wcag-criteria.js). See
 * docs/ENGINE_OPTIONS.md, "Selecting by WCAG target".
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../src/core');
const { wcagCriteria, wcagTags } = require('../src/wcag');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const VERSIONS = ['2.0', '2.1', '2.2'];
const LEVELS = ['A', 'AA', 'AAA'];
const upTo = (level) => LEVELS.slice(0, LEVELS.indexOf(level) + 1);

const ids = (runOnly, engineOptions) =>
  core
    .getChecksForRunOnly(runOnly, engineOptions)
    .map((e) => e.ruleId)
    .sort();

// The criteria a rule names: its criterion tags, and its wcagSc.
function criteriaOf(def) {
  const out = new Set((def.wcagSc || []).map(String));
  for (const t of def.tags || []) {
    const m = /^wcag(\d)(\d)(\d{1,2})$/.exec(t);
    if (m) out.add(`${m[1]}.${m[2]}.${m[3]}`);
  }
  return [...out];
}

function quietly(fn) {
  const { info, warn } = console;
  const logged = { info: [], warn: [] };
  console.info = (m) => logged.info.push(String(m));
  console.warn = (m) => logged.warn.push(String(m));
  try {
    return { value: fn(), ...logged };
  } finally {
    console.info = info;
    console.warn = warn;
  }
}

function throws(fn) {
  try {
    fn();
  } catch (e) {
    return { code: e.code, message: e.message };
  }
  return null;
}

test('each version and level selects the rules for its criteria', () => {
  for (const version of VERSIONS) {
    for (const level of LEVELS) {
      const inTarget = new Set(wcagCriteria(version, { levels: upTo(level) }).map((c) => c.sc));
      const expected = core.CHECK_DEFS.filter((d) => criteriaOf(d).some((sc) => inTarget.has(sc)))
        .map((d) => d.ruleId)
        .sort();
      const actual = ids({ wcag: { version, level } });
      assert.ok(actual.length > 0, `${version} ${level}`);
      assert.deepEqual(actual, expected, `${version} ${level}`);
    }
  }
});

test('a target selects what its version tags select, less the criteria its version removed', () => {
  for (const version of VERSIONS) {
    for (const level of LEVELS) {
      const { value: byTags } = quietly(() => ids({ tags: wcagTags(version, upTo(level)) }));
      const removed = (id) =>
        version === '2.2' &&
        criteriaOf(core.CHECK_DEFS.find((d) => d.ruleId === id)).every((sc) => sc === '4.1.1');
      assert.deepEqual(
        ids({ wcag: { version, level } }),
        byTags.filter((id) => !removed(id)),
        `${version} ${level}`
      );
    }
  }
});

test('4.1.1 Parsing is part of 2.0 and 2.1, and not of 2.2', () => {
  assert.ok(ids({ wcag: { version: '2.0', level: 'A' } }).includes('duplicate-id'));
  assert.ok(ids({ wcag: { version: '2.1', level: 'AA' } }).includes('duplicate-id'));
  assert.ok(!ids({ wcag: { version: '2.2', level: 'AAA' } }).includes('duplicate-id'));
});

test('2.4.7 Focus Visible is Level AA in every version', () => {
  for (const version of VERSIONS) {
    assert.ok(!ids({ wcag: { version, level: 'A' } }).includes('css-hidden-focus'), version);
    assert.ok(ids({ wcag: { version, level: 'AA' } }).includes('css-hidden-focus'), version);
  }
});

test('a criterion introduced in a later version is not part of an earlier one', () => {
  assert.ok(!ids({ wcag: { version: '2.1', level: 'AAA' } }).includes('target-size-minimum'));
  assert.ok(ids({ wcag: { version: '2.2', level: 'AA' } }).includes('target-size-minimum'));
  assert.ok(!ids({ wcag: { version: '2.0', level: 'AAA' } }).includes('label-in-name'));
  assert.ok(ids({ wcag: { version: '2.1', level: 'A' } }).includes('label-in-name'));
});

test('a rule that names no criterion is not selected by a target', () => {
  const target = ids({ wcag: { version: '2.2', level: 'AAA' } });
  for (const def of core.CHECK_DEFS.filter((d) => !criteriaOf(d).length)) {
    assert.ok(!target.includes(def.ruleId), def.ruleId);
  }
});

test('the level is matched case-insensitively', () => {
  assert.deepEqual(
    ids({ wcag: { version: '2.2', level: 'aa' } }),
    ids({ wcag: { version: '2.2', level: 'AA' } })
  );
});

test('with tags or rule ids, a target selects the union; excludes apply after', () => {
  const target = ids({ wcag: { version: '2.1', level: 'AA' } });
  const bestPractice = ids({ tags: ['best-practice'] });
  assert.ok(bestPractice.length > 0);

  const union = ids({ wcag: { version: '2.1', level: 'AA' }, tags: ['best-practice'] });
  assert.deepEqual(union, [...new Set([...target, ...bestPractice])].sort());

  assert.deepEqual(
    ids({ wcag: { version: '2.1', level: 'AA' }, includeRuleIds: ['region'] }),
    [...new Set([...target, 'region'])].sort()
  );
  assert.ok(
    ids({ wcag: { version: '2.0', level: 'A' }, includeRuleIds: ['target-size-minimum'] }).includes(
      'target-size-minimum'
    )
  );

  assert.deepEqual(
    ids({
      wcag: { version: '2.1', level: 'AA' },
      tags: ['best-practice'],
      excludeRuleIds: ['region']
    }),
    union.filter((id) => id !== 'region')
  );
  const excluded = ids({ wcag: { version: '2.1', level: 'AA' }, excludeTags: ['wcag2aa'] });
  for (const def of core.CHECK_DEFS.filter((d) => (d.tags || []).includes('wcag2aa'))) {
    assert.ok(!excluded.includes(def.ruleId), def.ruleId);
  }
  assert.ok(excluded.length > 0);
});

test('a target is an include: it selects instead of a profile', () => {
  const { value, warn } = quietly(() =>
    ids({ wcag: { version: '2.0', level: 'A' } }, { profile: 'wcag22-aa' })
  );
  assert.deepEqual(value, ids({ wcag: { version: '2.0', level: 'A' } }));
  assert.equal(warn.length, 0);
});

test('an invalid target throws INVALID_RUN_ONLY', () => {
  const cases = [
    [
      { version: '3.0', level: 'AA' },
      'runOnly.wcag.version must be "2.0", "2.1" or "2.2", not "3.0".'
    ],
    [{ version: 2.2, level: 'AA' }, 'runOnly.wcag.version must be "2.0", "2.1" or "2.2", not 2.2.'],
    [{ level: 'AA' }, 'runOnly.wcag.version must be "2.0", "2.1" or "2.2", and is missing.'],
    [
      { version: '2.2', level: 'AAAA' },
      'runOnly.wcag.level must be "A", "AA" or "AAA", not "AAAA".'
    ],
    [{ version: '2.2' }, 'runOnly.wcag.level must be "A", "AA" or "AAA", and is missing.'],
    ['2.2', 'runOnly.wcag must be an object { version, level }, not "2.2".'],
    [['2.2', 'AA'], 'runOnly.wcag must be an object { version, level }, not ["2.2","AA"].']
  ];
  for (const [wcag, message] of cases) {
    assert.deepEqual(
      throws(() => ids({ wcag })),
      { code: 'INVALID_RUN_ONLY', message }
    );
    assert.deepEqual(
      throws(() => runa11yCoreOnHtml('<p>x</p>', { runOnly: { wcag } })),
      { code: 'INVALID_RUN_ONLY', message }
    );
  }
});

test('a profile names its WCAG target', () => {
  assert.deepEqual(core.getProfileWcagTarget('wcag22-aa'), { version: '2.2', level: 'AA' });
  assert.deepEqual(core.getProfileWcagTarget('section508'), { version: '2.0', level: 'AA' });
  assert.deepEqual(core.getProfileWcagTarget('en301549-v4.1.1'), { version: '2.2', level: 'AA' });
  assert.deepEqual(core.getProfileWcagTarget('en301549-v3.2.1'), { version: '2.1', level: 'AA' });
  assert.equal(core.getProfileWcagTarget('nope'), null);
  // Its tags still select as before.
  assert.deepEqual(
    quietly(() => ids(null, { profile: 'wcag22-aa' })).value,
    quietly(() => ids({ tags: wcagTags('2.2', ['A', 'AA']) })).value
  );
});

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<img src="a.png"><div id="x"></div><div id="x"></div><a href="/x">x</a></main></body></html>';

test('a scan with a target reports its version, and its rollups are the target’s', () => {
  const r22 = runa11yCoreOnHtml(HTML, { runOnly: { wcag: { version: '2.2', level: 'AA' } } });
  assert.equal(r22.engine.wcagVersion, '2.2');
  const rollups22 = r22.rulesResults.map((r) => r.ruleId);
  assert.ok(rollups22.includes('wcag-2.5.3-label-in-name'));
  assert.ok(!rollups22.some((id) => id.startsWith('wcag-4.1.1')));
  assert.ok(!r22.checksResults.some((r) => r.ruleId === 'duplicate-id'));

  const r21 = runa11yCoreOnHtml(HTML, { runOnly: { wcag: { version: '2.1', level: 'A' } } });
  assert.equal(r21.engine.wcagVersion, '2.1');
  const rollups21 = r21.rulesResults.map((r) => r.ruleId);
  assert.ok(rollups21.some((id) => id.startsWith('wcag-4.1.1')));
  assert.ok(!rollups21.includes('wcag-1.4.3-contrast-minimum'));
  assert.equal(r21.checksResults.find((r) => r.ruleId === 'duplicate-id').outcome, 'fail');

  const r20 = runa11yCoreOnHtml(HTML, { runOnly: { wcag: { version: '2.0', level: 'AA' } } });
  assert.ok(!r20.rulesResults.some((r) => r.ruleId === 'wcag-2.5.3-label-in-name'));
});

test('an explicit wcagVersion still wins over the target’s version', () => {
  const r = runa11yCoreOnHtml(HTML, {
    runOnly: { wcag: { version: '2.1', level: 'A' } },
    engineOptions: { wcagVersion: '2.2' }
  });
  assert.equal(r.engine.wcagVersion, '2.2');
});

// The nine WCAG version/level tags are known, whether or not a rule carries one.

const NOTE_22A =
  '[surea11y] runOnly.tags: no rules for WCAG 2.2 Level A ("wcag22a"); its criteria need manual review.';

test('a WCAG tag no rule carries, beside others, is noted, not warned about', () => {
  const { value, info, warn } = quietly(() =>
    ids({ tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'] })
  );
  assert.ok(value.length > 0);
  assert.deepEqual(warn, []);
  assert.ok(info.length > 0);
  for (const line of info) assert.equal(line, NOTE_22A);

  const two = quietly(() => ids({ tags: ['wcag2a', 'wcag22a', 'wcag22aaa'] }));
  assert.equal(
    two.info[0],
    '[surea11y] runOnly.tags: no rules for WCAG 2.2 Level A ("wcag22a") or WCAG 2.2 Level AAA ("wcag22aaa"); their criteria need manual review.'
  );

  const shorthand = quietly(() => ids(['wcag2a', 'wcag22a']));
  assert.deepEqual(shorthand.value, quietly(() => ids({ tags: ['wcag2a'] })).value);
  assert.equal(shorthand.info[0], NOTE_22A);

  const scan = quietly(() => runa11yCoreOnHtml(HTML, { runOnly: { tags: ['wcag2a', 'wcag22a'] } }));
  assert.ok(scan.info.includes(NOTE_22A));
  assert.deepEqual(scan.warn, []);
});

test('engineOptions.logUntestedWcag: false leaves the note out', () => {
  const { info, warn } = quietly(() =>
    ids({ tags: ['wcag2a', 'wcag22a'] }, { logUntestedWcag: false })
  );
  assert.deepEqual(info, []);
  assert.deepEqual(warn, []);
});

test('a WCAG tag no rule carries, on its own, throws and says why', () => {
  assert.deepEqual(
    throws(() => ids({ tags: ['wcag22a'] })),
    {
      code: 'INVALID_RUN_ONLY',
      message:
        'runOnly.tags: no rules for WCAG 2.2 Level A ("wcag22a"), so no rule would run; its criteria need manual review.'
    }
  );
  assert.deepEqual(
    throws(() => ids(['wcag22a', 'wcag21aaa'])),
    {
      code: 'INVALID_RUN_ONLY',
      message:
        'runOnly.tags: no rules for WCAG 2.2 Level A ("wcag22a") or WCAG 2.1 Level AAA ("wcag21aaa"), so no rule would run; their criteria need manual review.'
    }
  );
  assert.deepEqual(
    throws(() => ids(null, { tags: { include: 'wcag22a' } })),
    {
      code: 'INVALID_RUN_ONLY',
      message:
        'engineOptions.tags.include: no rules for WCAG 2.2 Level A ("wcag22a"), so no rule would run; its criteria need manual review.'
    }
  );
  assert.deepEqual(
    throws(() => ids({ tags: ['wcag22a', 'wcga2aa'] })),
    {
      code: 'INVALID_RUN_ONLY',
      message:
        'runOnly.tags: no tag named "wcga2aa", and no rules for WCAG 2.2 Level A ("wcag22a"), so no rule would run; its criteria need manual review.'
    }
  );
});

test('beside a target, a WCAG tag no rule carries is only noted', () => {
  const { value, info } = quietly(() =>
    ids({ wcag: { version: '2.2', level: 'A' }, tags: ['wcag22a'] })
  );
  assert.deepEqual(value, ids({ wcag: { version: '2.2', level: 'A' } }));
  assert.equal(info[0], NOTE_22A);
  // A typo there is still an error.
  assert.equal(
    throws(() => ids({ wcag: { version: '2.2', level: 'A' }, tags: ['wcga2aa'] })).message,
    'runOnly.tags: no tag named "wcga2aa".'
  );
});

test('an exclude of a WCAG tag no rule carries says nothing', () => {
  const { info, warn } = quietly(() => ids({ tags: ['wcag2a'], excludeTags: ['wcag22a'] }));
  assert.deepEqual(info, []);
  assert.deepEqual(warn, []);
});

test('an unknown tag is handled as before', () => {
  assert.deepEqual(
    throws(() => ids({ tags: ['wcga2aa'] })),
    {
      code: 'INVALID_RUN_ONLY',
      message: 'runOnly.tags: no tag named "wcga2aa".'
    }
  );
  assert.deepEqual(
    throws(() => ids(['wcga2aa'])),
    {
      code: 'INVALID_RUN_ONLY',
      message: 'runOnly: no rule or tag named "wcga2aa".'
    }
  );
  const { info, warn } = quietly(() => ids({ tags: ['wcag2a', 'wcga2aa'] }));
  assert.deepEqual(info, []);
  assert.ok(warn.length > 0);
  for (const line of warn)
    assert.equal(line, '[surea11y] runOnly.tags: no tag named "wcga2aa"; ignored.');
});

// runOnly.bestPractices: the rules that name no WCAG criterion.

test('the best-practice rules are exactly the rules that name no criterion', () => {
  for (const def of core.CHECK_DEFS) {
    assert.equal(
      (def.tags || []).includes('best-practice'),
      criteriaOf(def).length === 0,
      def.ruleId
    );
  }
});

test('bestPractices: true selects the best-practice rules', () => {
  const bestPractices = ids({ bestPractices: true });
  assert.ok(bestPractices.length > 0);
  assert.deepEqual(bestPractices, ids({ tags: ['best-practice'] }));
  for (const id of bestPractices) {
    assert.equal(criteriaOf(core.CHECK_DEFS.find((d) => d.ruleId === id)).length, 0, id);
  }
});

test('with a target, bestPractices adds the best-practice rules to it', () => {
  for (const version of VERSIONS) {
    for (const level of LEVELS) {
      assert.deepEqual(
        ids({ wcag: { version, level }, bestPractices: true }),
        [
          ...new Set([...ids({ wcag: { version, level } }), ...ids({ bestPractices: true })])
        ].sort(),
        `${version} ${level}`
      );
    }
  }
  // A 2.2 AAA target and the best practices run every rule but those of
  // 4.1.1, which 2.2 removed.
  assert.deepEqual(
    ids({ wcag: { version: '2.2', level: 'AAA' }, bestPractices: true }),
    core.CHECK_DEFS.map((d) => d.ruleId)
      .filter((id) => id !== 'duplicate-id')
      .sort()
  );
});

test('bestPractices combines with tags and rule ids, and excludes apply after', () => {
  assert.deepEqual(
    ids({ bestPractices: true, includeRuleIds: ['target-size-minimum'] }),
    [...ids({ bestPractices: true }), 'target-size-minimum'].sort()
  );
  assert.deepEqual(
    ids({ wcag: { version: '2.1', level: 'AA' }, bestPractices: true, excludeRuleIds: ['region'] }),
    ids({ wcag: { version: '2.1', level: 'AA' }, bestPractices: true }).filter(
      (id) => id !== 'region'
    )
  );
  assert.deepEqual(ids({ bestPractices: true, excludeTags: ['best-practice'] }), []);
});

test('bestPractices: false adds nothing', () => {
  assert.deepEqual(
    ids({ wcag: { version: '2.2', level: 'AA' }, bestPractices: false }),
    ids({ wcag: { version: '2.2', level: 'AA' } })
  );
  assert.deepEqual(ids({ tags: ['wcag2a'], bestPractices: false }), ids({ tags: ['wcag2a'] }));
  // On its own, as an empty runOnly, it selects every rule.
  assert.deepEqual(ids({ bestPractices: false }), ids(null));
});

test('bestPractices must be true or false', () => {
  for (const [value, shown] of [
    ['yes', '"yes"'],
    [1, '1'],
    [null, 'null']
  ]) {
    assert.deepEqual(
      throws(() => ids({ bestPractices: value })),
      {
        code: 'INVALID_RUN_ONLY',
        message: `runOnly.bestPractices must be true or false, not ${shown}.`
      }
    );
  }
});

test('bestPractices adds to a profile, which still applies', () => {
  assert.deepEqual(
    ids({ bestPractices: true }, { profile: 'wcag22-aa' }),
    [...new Set([...ids(null, { profile: 'wcag22-aa' }), ...ids({ bestPractices: true })])].sort()
  );
  const { value, warn } = quietly(() =>
    runa11yCoreOnHtml(HTML, {
      runOnly: { bestPractices: true },
      engineOptions: { profile: 'wcag22-aa' }
    })
  );
  assert.equal(value.engine.profile, 'wcag22-aa');
  assert.deepEqual(warn, []);
});

test('beside bestPractices, a WCAG tag no rule carries is only noted', () => {
  const { value, info } = quietly(() => ids({ bestPractices: true, tags: ['wcag22a'] }));
  assert.deepEqual(value, ids({ bestPractices: true }));
  assert.equal(info[0], NOTE_22A);
});

test('a scan with a target and the best practices runs both, and the target’s rollups', () => {
  const r = runa11yCoreOnHtml(HTML, {
    runOnly: { wcag: { version: '2.2', level: 'AA' }, bestPractices: true }
  });
  const ran = r.checksResults.map((x) => x.ruleId).sort();
  assert.deepEqual(ran, ids({ wcag: { version: '2.2', level: 'AA' }, bestPractices: true }));
  assert.ok(ran.includes('region'));
  assert.equal(r.engine.wcagVersion, '2.2');
  assert.ok(r.rulesResults.some((x) => x.ruleId === 'wcag-2.5.3-label-in-name'));

  const bp = runa11yCoreOnHtml(HTML, { runOnly: { bestPractices: true } });
  assert.deepEqual(bp.checksResults.map((x) => x.ruleId).sort(), ids({ bestPractices: true }));
});
