'use strict';

/**
 * The checks of runOnly.bestPractices beside engineOptions.profile, shared
 * by the tests of core's profiles and of the sample profile: the profile is
 * applied, the best-practice rules are added to its rules, the rule listing
 * agrees with the scan, no rollup counts the added rules, excludes apply
 * after, and bestPractices: false changes nothing.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body>' +
  '<div><h3>Heading</h3><img src="a.png"><div id="x"></div><div id="x"></div>' +
  '<a href="/a">Read more</a><input type="text"><div role="banner"><p>Nested</p></div></div>' +
  '</body></html>';

const sorted = (list) => [...list].sort();
const ruleIds = (result) => sorted(result.checksResults.map((r) => r.ruleId));

// A rollup's outcome and what it counted, to compare two scans' rollups.
const rollups = (result) =>
  result.rulesResults.map((r) => [
    r.ruleId,
    r.outcome,
    JSON.stringify(
      ((r.data && r.data.details && r.data.details.contributors) || []).map((c) => [
        c.testId,
        c.outcome
      ])
    )
  ]);

function quietly(fn) {
  const { warn, info } = console;
  const warnings = [];
  console.warn = (m) => warnings.push(String(m));
  console.info = () => {};
  try {
    return { value: fn(), warnings };
  } finally {
    console.warn = warn;
    console.info = info;
  }
}

function checkBestPracticesWithProfile({ core, runOnHtml, profiles }) {
  const bestPractices = sorted(
    core.CHECK_DEFS.filter((d) => (d.tags || []).includes('best-practice')).map((d) => d.ruleId)
  );

  for (const profile of profiles) {
    const scan = (runOnly, extra = {}) =>
      quietly(() =>
        runOnHtml(HTML, { engineOptions: { profile, ...extra }, ...(runOnly ? { runOnly } : {}) })
      );
    const alone = scan(null).value;
    const withBp = scan({ bestPractices: true });

    test(`${profile} with bestPractices: the profile is applied`, () => {
      assert.equal(withBp.value.engine.profile, profile);
      assert.deepEqual(
        withBp.warnings.filter((w) => w.includes('engineOptions.profile')),
        []
      );
      assert.deepEqual(withBp.value.engine.mappings, alone.engine.mappings);
      assert.deepEqual(withBp.value.engine.profileExcludes, alone.engine.profileExcludes);
    });

    test(`${profile} with bestPractices: runs the profile's rules and the best-practice rules`, () => {
      const excluded = new Set(
        (alone.engine.profileExcludes && alone.engine.profileExcludes.rules) || []
      );
      assert.deepEqual(
        ruleIds(withBp.value),
        sorted(new Set([...ruleIds(alone), ...bestPractices.filter((id) => !excluded.has(id))]))
      );
      assert.ok(
        bestPractices.some((id) => !ruleIds(alone).includes(id)),
        'something is added'
      );
    });

    test(`${profile} with bestPractices: getChecksForRunOnly lists the rules the scan runs`, () => {
      const listed = quietly(() =>
        core.getChecksForRunOnly({ bestPractices: true }, { profile })
      ).value.map((r) => r.ruleId);
      assert.deepEqual(sorted(listed), ruleIds(withBp.value));
    });

    test(`${profile} with bestPractices: the rollups are the profile's, and count no added rule`, () => {
      assert.deepEqual(rollups(withBp.value), rollups(alone));
    });

    test(`${profile} with bestPractices: excludes apply after`, () => {
      const lessRegion = scan({ bestPractices: true, excludeRuleIds: ['region'] }).value;
      assert.deepEqual(
        ruleIds(lessRegion),
        ruleIds(withBp.value).filter((id) => id !== 'region')
      );
      const lessBp = scan({ bestPractices: true, excludeTags: ['best-practice'] }).value;
      assert.deepEqual(
        ruleIds(lessBp),
        ruleIds(alone).filter((id) => !bestPractices.includes(id))
      );
      assert.equal(lessBp.engine.profile, profile);
    });

    test(`${profile} with bestPractices: false changes nothing`, () => {
      const off = scan({ bestPractices: false });
      assert.equal(off.value.engine.profile, profile);
      assert.deepEqual(ruleIds(off.value), ruleIds(alone));
      assert.deepEqual(rollups(off.value), rollups(alone));
    });
  }
}

module.exports = { checkBestPracticesWithProfile };
