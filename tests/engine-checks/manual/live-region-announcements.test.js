'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

// The page as it is when scanned. What the live-region hook records while
// the page runs is tested in core/live-region-hook.test.js and in Chromium.
const RULE_ID = 'live-region-announcements';

function run(body, engineOptions) {
  return runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><body><main>${body}</main></body></html>`,
    { runOnly: [RULE_ID], engineOptions }
  );
}

function details(rule) {
  return rule.occurrences.map((o) => [o.selector, o.data.details]);
}

test(`${RULE_ID}: notApplicable without a drawn live region`, () => {
  assertRule(
    run(
      '<p>Text</p><div role="region" aria-label="x"></div><div role="status" aria-live="off"></div><div hidden><div role="alert"></div></div><div style="display:none"><output></output></div><div role="timer"></div><div role="marquee"></div>'
    ),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: pass for live regions assistive technology can reach`, () => {
  assertRule(
    run(
      '<div role="status"></div><div role="alert">Error</div><div role="log"></div><div aria-live="polite"></div><div aria-live="assertive" class="sr-only"></div><output>3</output><div role="timer" aria-live="polite"></div><div role="status" aria-busy="false"></div>'
    ),
    RULE_ID,
    'pass',
    { maxOccurrences: 0 }
  );
});

test(`${RULE_ID}: a live region inside or on aria-hidden is asked about`, () => {
  const rule = assertRule(
    run(
      '<div aria-hidden="true"><div id="a" role="status"></div></div><div id="b" aria-live="assertive" aria-hidden="true"></div>'
    ),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(details(rule), [
    ['#a', { reasonCode: 'LIVE_REGION_HIDDEN', politeness: 'polite', hiddenBy: 'aria-hidden' }],
    ['#b', { reasonCode: 'LIVE_REGION_HIDDEN', politeness: 'assertive', hiddenBy: 'aria-hidden' }]
  ]);
  assert.equal(rule.occurrences[0].uncertainty, undefined, 'a manual rule carries no uncertainty');
  assert.equal(
    rule.occurrences[0].i18n.summaryKey,
    'liveRegionAnnouncements_summary_cantTell_ariaHidden'
  );
});

test(`${RULE_ID}: a live region in inert content is asked about`, () => {
  const rule = assertRule(run('<div inert><output id="o"></output></div>'), RULE_ID, 'cantTell');
  assert.deepEqual(details(rule), [
    ['#o', { reasonCode: 'LIVE_REGION_HIDDEN', politeness: 'polite', hiddenBy: 'inert' }]
  ]);
});

test(`${RULE_ID}: a live region left busy is asked about`, () => {
  const rule = assertRule(
    run('<div id="l" role="log" aria-busy="true"></div>'),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(details(rule), [
    ['#l', { reasonCode: 'LIVE_REGION_BUSY', politeness: 'polite' }]
  ]);
});

test(`${RULE_ID}: aria-live decides over the role, either way`, () => {
  const rule = assertRule(
    run(
      '<div aria-hidden="true"><div role="alert" aria-live="off"></div><div id="p" role="note" aria-live="polite"></div></div>'
    ),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(details(rule), [
    ['#p', { reasonCode: 'LIVE_REGION_HIDDEN', politeness: 'polite', hiddenBy: 'aria-hidden' }]
  ]);
});

test(`${RULE_ID}: the scenario fixture`, () => {
  const html = fs.readFileSync(
    path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`),
    'utf8'
  );
  const r = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(r, RULE_ID, 'cantTell');
  assert.deepEqual(
    rule.occurrences.map((o) => o.selector),
    ['#lra_case_05', '#lra_case_06', '#lra_case_07']
  );
});
