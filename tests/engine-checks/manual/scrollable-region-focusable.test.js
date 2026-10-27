'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'scrollable-region-focusable';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when there is no scrollable-overflow candidate`, () => {
  const html = `<!doctype html><html><body><div>plain content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when a scrollable region has no focusable content and is not itself focusable`, () => {
  const html = `<!doctype html><html><head><style>.s{overflow-y:auto;height:100px;}</style></head><body><div class="s">long content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'SCROLLABLE_OVERFLOW_NOT_FOCUSABLE');
});

test(`${RULE_ID}: notApplicable when the scrollable region itself has tabindex="0"`, () => {
  const html = `<!doctype html><html><head><style>.s{overflow-y:auto;height:100px;}</style></head><body><div class="s" tabindex="0">long content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the scrollable region contains a focusable descendant`, () => {
  const html = `<!doctype html><html><head><style>.s{overflow-y:auto;height:100px;}</style></head><body><div class="s">text <a href="#">link</a></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a textarea or an editable region Tab reaches, or a disabled textarea, is not asked about; tabindex="-1" is`, () => {
  // Browsers give a textarea overflow: auto; jsdom doesn't, so it is set here.
  const outcome = (body) =>
    runa11yCoreOnHtml(
      `<!doctype html><html><head><style>.s{overflow-y:auto;height:100px;}</style></head><body>${body}</body></html>`,
      { runOnly: [RULE_ID] }
    ).checksResults.find((c) => c.ruleId === RULE_ID).outcome;
  assert.equal(outcome('<label>Comment <textarea class="s"></textarea></label>'), 'notApplicable');
  assert.equal(
    outcome('<label>Comment <textarea class="s" disabled></textarea></label>'),
    'notApplicable'
  );
  assert.equal(outcome('<div class="s" contenteditable="true">Notes</div>'), 'notApplicable');
  assert.equal(outcome('<div class="s" tabindex="-1">long content</div>'), 'cantTell');
});

// A details' <summary> and media with controls are tab stops too; a
// <details> with no <summary> of its own, or media without controls, is not.
test(`${RULE_ID}: a summary or media with controls lets a region off; media without controls does not`, () => {
  const box = (inner) =>
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main><div style="overflow-y:auto;height:50px">${inner}<p>text</p></div></main></body></html>`;
  const outcome = (inner) =>
    runa11yCoreOnHtml(box(inner), { runOnly: [RULE_ID] }).checksResults[0].outcome;
  assert.strictEqual(outcome('<details><summary>More</summary>x</details>'), 'notApplicable');
  assert.strictEqual(outcome('<video controls src="a.mp4"></video>'), 'notApplicable');
  assert.strictEqual(outcome('<audio controls src="a.mp3"></audio>'), 'notApplicable');
  assert.strictEqual(outcome('<video src="a.mp4"></video>'), 'cantTell');
  assert.strictEqual(outcome('<details><summary hidden>More</summary>x</details>'), 'cantTell');
});

test(`${RULE_ID}: only a descendant in the tab order lets a region off (ACT 0ssw9k)`, () => {
  const outcome = (inner) =>
    runa11yCoreOnHtml(
      `<!doctype html><html><head><style>.s{overflow-y:auto;height:100px;}</style></head><body><div class="s">Long text. ${inner}</div></body></html>`,
      { runOnly: [RULE_ID] }
    ).checksResults.find((c) => c.ruleId === RULE_ID).outcome;
  // Not in the tab order: still asked about.
  assert.equal(outcome('<span tabindex="-1">note</span>'), 'cantTell');
  assert.equal(outcome('<button disabled>Go</button>'), 'cantTell');
  assert.equal(outcome('<fieldset disabled><input type="text"></fieldset>'), 'cantTell');
  assert.equal(outcome('<input type="hidden" name="t" value="1">'), 'cantTell');
  assert.equal(outcome('<a href="#" style="display:none">more</a>'), 'cantTell');
  assert.equal(outcome('<div inert><a href="#">more</a></div>'), 'cantTell');
  assert.equal(outcome('<a href="#" tabindex="-1">more</a>'), 'cantTell');
  // In the tab order: not asked about, as before.
  assert.equal(outcome('<a href="#">more</a>'), 'notApplicable');
  assert.equal(outcome('<span tabindex="0">note</span>'), 'notApplicable');
  assert.equal(outcome('<button>Go</button>'), 'notApplicable');
  assert.equal(outcome('<input type="text">'), 'notApplicable');
  assert.equal(outcome('<div contenteditable="true">x</div>'), 'notApplicable');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><head><style>.s{overflow-y:auto;height:100px;}</style></head><body><div class="s">long content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'Scrollable regions with no focusable content should be keyboard-focusable'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/scrollable-region-focusable-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'scrollable-region-focusable-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 5, maxOccurrences: 5 });

  const expectedFlaggedIds = [
    'srf_case_01',
    'srf_case_02',
    'srf_case_06',
    'srf_case_07',
    'srf_case_08'
  ];
  const expectedNoOccIds = ['srf_case_03', 'srf_case_04', 'srf_case_05'];

  for (const id of expectedFlaggedIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
