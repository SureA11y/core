'use strict';

/**
 * The moves src/baseline-moves.json lists for this minor release, with the
 * real table: a baseline the last release wrote still matches each moved
 * finding under its new code. Skipped once the release freeze drops a move.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { matchBaseline, migrateBaselineEntries } = require('../src/baseline.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const MOVES = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'src', 'baseline-moves.json'), 'utf8')
).moves;
const listed = (ruleId, from, to) =>
  MOVES.some((m) => m.ruleId === ruleId && m.from === from && m.to.includes(to));

const MARQUEE = '<marquee onmouseover="this.stop()" onmouseout="this.start()">News</marquee>';

test(
  'a 1.17 baseline with leanFail still matches a hover-only marquee (MARQUEE_STOPS_ONLY_ON_HOVER)',
  {
    skip:
      !listed(
        'deprecated-elements-not-used',
        'MARQUEE_PAUSE_MECHANISM_UNKNOWN',
        'MARQUEE_STOPS_ONLY_ON_HOVER'
      ) && 'move dropped by the release freeze'
  },
  () => {
    const result = runa11yCoreOnHtml(
      `<!doctype html><html lang="en"><head><title>News</title></head><body>${MARQUEE}</body></html>`,
      { runOnly: ['deprecated-elements-not-used'] }
    );
    const occurrence = result.checksResults.find((c) => c.ruleId === 'deprecated-elements-not-used')
      .occurrences[0];
    assert.equal(occurrence.data.details.reasonCode, 'MARQUEE_STOPS_ONLY_ON_HOVER');
    // What buildBaselineEntries(result, { leanFail: true }) wrote in 1.17.
    const entries = [
      {
        ruleId: 'deprecated-elements-not-used',
        reasonCode: 'MARQUEE_PAUSE_MECHANISM_UNKNOWN',
        selector: 'html > body > marquee',
        html: MARQUEE,
        lean: 'fail'
      }
    ];
    const match = matchBaseline(result, entries, { leanFail: true });
    assert.equal(match.leanFail.newCount, 0);
    assert.equal(match.leanFail.staleCount, 0);
    assert.equal(
      migrateBaselineEntries({ entries }, result)[0].reasonCode,
      'MARQUEE_STOPS_ONLY_ON_HOVER'
    );
  }
);

test(
  'an entry under titleReview follows a placeholder title to placeholderTitle',
  {
    skip:
      !listed('page-title-patterns', 'titleReview', 'placeholderTitle') &&
      'move dropped by the release freeze'
  },
  () => {
    const result = runa11yCoreOnHtml(
      '<!doctype html><html lang="en"><head><title>undefined</title></head><body><p>Hi</p></body></html>',
      { runOnly: ['page-title-patterns'] }
    );
    const occurrence = result.checksResults.find((c) => c.ruleId === 'page-title-patterns')
      .occurrences[0];
    assert.equal(occurrence.data.details.reasonCode, 'placeholderTitle');
    // 1.17 gave the finding no lean, so a leanFail baseline did not hold it;
    // the move keeps its identity for anything that keyed on the old code.
    const entries = [
      {
        ruleId: 'page-title-patterns',
        reasonCode: 'titleReview',
        selector: occurrence.selector,
        html: occurrence.html,
        lean: 'fail'
      }
    ];
    const match = matchBaseline(result, entries, { leanFail: true });
    assert.equal(match.leanFail.newCount, 0);
    assert.equal(match.leanFail.staleCount, 0);
    assert.equal(migrateBaselineEntries({ entries }, result)[0].reasonCode, 'placeholderTitle');
  }
);
