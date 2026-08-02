'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { createDom, runa11yCoreOnDom } = require('../../helpers/runa11yCoreOnHtml');
const { assertRule } = require('../../helpers/assertRule');
const { patchTargetSizeEnv } = require('../../helpers/patchTargetSizeEnv');

const RULE_ID = 'target-size-minimum';

// Deterministic geometry/hit-testing patch (data-rect="x,y,w,h") -- shared
// with tests/target-size-minimum-node-runtime-parity.test.js, see
// tests/helpers/patchTargetSizeEnv.js.

function run(html, engineOptions = {}) {
  const dom = createDom(html);
  patchTargetSizeEnv(dom);

  return runa11yCoreOnDom(dom, {
    engineOptions: {
      rules: [RULE_ID],
      ...engineOptions
    }
  });
}

test(`${RULE_ID}: no candidates => notApplicable`, () => {
  const html = `<!doctype html><html><body><div>no targets</div></body></html>`;
  const result = run(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: only suppressed candidates => notApplicable`, () => {
  const html = `<!doctype html><html><body>
    <button style="display:none" data-rect="10,10,10,10">X</button>
    <button hidden data-rect="10,40,10,10">Y</button>
<details>
  <summary style="display:none" data-rect="10,70,20,20">S</summary>
  <button data-rect="40,70,10,10">inside</button>
</details>
    <div inert><button data-rect="10,110,10,10">inert</button></div>
    <button style="pointer-events:none" data-rect="10,140,10,10">pe-none</button>
    <button data-no-rects="1" data-rect="10,170,10,10">no rects</button>
  </body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: one >= 24x24 => pass`, () => {
  const html = `<!doctype html><html><body>
    <button id="b" data-rect="10,10,30,30">Big</button>
  </body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: undersized but spaced => pass (spacing exception)`, () => {
  const html = `<!doctype html><html><body>
    <button id="small" data-rect="200,10,10,10">Small</button>
    <!-- another target far away -->
    <button id="far" data-rect="400,200,10,10">Far</button>
  </body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: two undersized targets too close => fail (2 occurrences)`, () => {
  const html = `<!doctype html><html><body>
    <button id="a" data-rect="10,80,10,10">A</button>
    <button id="b" data-rect="25,80,10,10">B</button>
  </body></html>`;

  const result = run(html);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });

  // Deterministic i18n keys
  for (const occ of rule.occurrences) {
    assert.strictEqual(occ.i18n.summaryKey, 'targetSizeMinimum_summary_fail');
    assert.strictEqual(occ.i18n.hintKey, 'targetSizeMinimum_hint_fail');
    assert.ok(occ.data && occ.data.details && occ.data.details.measured);
    assert.ok(occ.data.details.measured.width < 24 || occ.data.details.measured.height < 24);
    assert.strictEqual(occ.data.details.reasonCode, 'undersized-and-too-close');
  }
});

test(`${RULE_ID}: aria-hidden target still evaluated`, () => {
  const html = `<!doctype html><html><body>
    <button id="a" aria-hidden="true" data-rect="10,120,10,10">AH</button>
    <button id="b" data-rect="25,120,10,10">N</button>
  </body></html>`;

  const result = run(html);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  // both should be reported (they are both pointer-reachable)
  assert.ok(rule.occurrences.some((o) => /#a\b/.test(o.selector)));
  assert.ok(rule.occurrences.some((o) => /#b\b/.test(o.selector)));
});

test(`${RULE_ID}: opacity:0 still evaluated`, () => {
  const html = `<!doctype html><html><body>
    <button id="a" style="opacity:0" data-rect="10,160,10,10">O0</button>
    <button id="b" data-rect="25,160,10,10">N</button>
  </body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
});

test(`${RULE_ID}: pointer-events none excluded`, () => {
  const html = `<!doctype html><html><body>
    <button id="pe" style="pointer-events:none" data-rect="10,200,10,10">PE</button>
    <button id="near" data-rect="25,200,10,10">N</button>
  </body></html>`;

  const result = run(html);
  // Only #near is applicable; it is undersized but now has no conflicting target => passes by spacing exception.
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: occluded small target fails (covered by another target)`, () => {
  const html = `<!doctype html><html><body>
    <button id="small" data-rect="10,520,10,10">S</button>
    <button id="cover" data-rect="5,515,40,40">Cover</button>
  </body></html>`;

  const result = run(html);
  // Both are candidates; small is undersized and too close (circle perimeter will hit cover).
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(rule.occurrences.some((o) => /#small\b/.test(o.selector)));
});

test(`${RULE_ID}: inline text link in <p> => pass (inline-text exception)`, () => {
  const html = `<!doctype html><html><body>
    <p>Read <a id="lnk" href="#" style="display:inline" data-rect="10,10,10,10">more</a> here.</p>
  </body></html>`;
  const result = run(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: inline text link close to small button => pass (inline link doesn't invalidate spacing)`, () => {
  const html = `<!doctype html><html><body>
    <p>Go <a id="lnk" href="#" style="display:inline" data-rect="10,10,10,10">here</a>.</p>
    <button id="btn" data-rect="25,10,10,10">B</button>
  </body></html>`;
  const result = run(html);
  // Only remaining undersized target is the button, and the inline link shouldn't count as conflict.
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: inline-block link in <p> => pass (inline-text exception)`, () => {
  const html = `<!doctype html><html><body>
    <p>
      <a id="chip" href="#" style="display:inline-block" data-rect="10,10,10,10">Chip</a>
    </p>
  </body></html>`;
  const result = run(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: inline link not in text container => evaluated normally`, () => {
  const html = `<!doctype html><html><body>
    <div>
      <a id="lnk" href="#" style="display:inline" data-rect="10,10,10,10">Link</a>
    </div>
    <button id="b" data-rect="25,10,10,10">B</button>
  </body></html>`;
  const result = run(html);
  // Both are small and close => fail 2 occurrences
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
});

test(`${RULE_ID}: undersized targets within 24px by geometry => fail (distance check)`, () => {
  const html = `<!doctype html><html><body>
    <button id="a" data-rect="100,100,10,10">A</button>
    <button id="b" data-rect="120,100,10,10">B</button>
  </body></html>`;
  const result = run(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
});

test(`${RULE_ID}: conflict inside svg => cantTell (essential/equivalent uncertainty)`, () => {
  const html = `<!doctype html><html><body>
    <svg>
      <button id="a" data-rect="10,10,10,10">A</button>
      <button id="b" data-rect="25,10,10,10">B</button>
    </svg>
  </body></html>`;
  const result = run(html);
  // Fixed 2026-07-31: this uncertain-tier finding used to be recorded only
  // as a page-level boolean with no occurrence at all — unrecoverable from
  // the result the moment it was combined with a real page. Now it's a
  // real occurrence, same as a fail-tier finding would be. Both A and B
  // reciprocally conflict and are each inside the <svg>, so both occur.
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  for (const occ of rule.occurrences) {
    assert.strictEqual(occ.data.details.reasonCode, 'undersized-plausibly-essential');
  }
});

test(`${RULE_ID}: undersized target flush against an adequately-sized neighbor => fail (widened geometry check)`, () => {
  // Regression guard for the fix that widened the pure-geometry spacing
  // check to compare against ANY nearby target (not just other undersized
  // ones). #big is >=24x24, so an "undersized-only" comparison would have
  // missed this conflict; centers are 22.36px apart (< MIN 24), so the
  // deterministic distance check must catch it directly (hitCount: 0).
  const html = `<!doctype html><html><body>
    <button id="small" data-rect="10,10,10,10">Small</button>
    <button id="big" data-rect="20,10,30,30">Big</button>
  </body></html>`;
  const result = run(html);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.match(occ.selector, /#small\b/);
  assert.strictEqual(occ.data.details.reasonCode, 'undersized-and-too-close');
  assert.strictEqual(occ.data.details.conflictHitCount, 0);
  assert.match(occ.data.details.conflictWith, /#big\b/);
});

test(`${RULE_ID}: ambiguous near-threshold perimeter sampling => cantTell (not a hard fail)`, () => {
  // Empirically verified: centers are ~26.9px apart (just outside the pure
  // geometry MIN=24 distance check), but the 24x24 sampling circle around
  // #small's center clips the corner of #big for 3 of 16 perimeter
  // samples. That lands in the ambiguous band (>= HIT_THRESHOLD-1 but
  // < CONFIDENT_THRESHOLD), so the rule must defer to manual review
  // instead of committing to pass or fail.
  const html = `<!doctype html><html><body>
    <button id="small" data-rect="10,10,10,10">Small</button>
    <button id="big" data-rect="25,10,30,30">Big</button>
  </body></html>`;
  const result = run(html);
  // Fixed 2026-07-31: same gap as the svg case above — this ambiguous-tier
  // finding used to have no occurrence at all, just a boolean flag.
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'undersized-ambiguous-spacing');
});

test(`${RULE_ID}: a page with both a confident fail AND an uncertain/essential-exempt conflict reports BOTH under a 'fail' outcome, not just the confident one (fixed 2026-07-31 — see helpers.resolveTieredOutcome)`, () => {
  const html = `<!doctype html><html><body>
    <button id="a" data-rect="10,80,10,10">A</button>
    <button id="b" data-rect="25,80,10,10">B</button>
    <svg>
      <button id="c" data-rect="10,10,10,10">C</button>
      <button id="d" data-rect="25,10,10,10">D</button>
    </svg>
  </body></html>`;
  const result = run(html);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  const reasonCodes = rule.occurrences.map((o) => o.data.details.reasonCode).sort();
  assert.deepStrictEqual(reasonCodes, [
    'undersized-and-too-close', 'undersized-and-too-close',
    'undersized-plausibly-essential', 'undersized-plausibly-essential'
  ]);
});

test(`${RULE_ID}: nested interactive controls (small control inside its own wrapping link) => pass`, () => {
  // A small <button> inside a wrapping <a href>, nothing else on the page.
  // Before the fix, the pure-geometry pass flagged the button as "too
  // close" to its own ancestor; the perimeter-sampling fallback had the
  // same one-directional isSameOrInside gap for the reverse (ancestor-hit)
  // case. Both must now recognize ancestor/descendant as one region, not
  // two independent targets.
  const html = `<!doctype html><html><body>
    <a href="/card" id="outerLink" data-rect="0,0,300,80">
      <button id="innerBtn" data-rect="270,10,10,10">X</button>
    </a>
  </body></html>`;
  const result = run(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: nested interactive controls, BOTH undersized => pass (pure-geometry pass would otherwise catch it too)`, () => {
  const html = `<!doctype html><html><body>
    <a href="/x" id="outerLink2" data-rect="0,0,20,20">
      <button id="innerBtn2" data-rect="4,4,10,10">X</button>
    </a>
  </body></html>`;
  const result = run(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: User Agent Control exception — unstyled native checkbox/radio pair in a typical list => pass`, () => {
  // Ordinary, unstyled checkboxes (appearance still "auto") in a normal
  // compact list layout. Size is browser-default, not the author's choice
  // — the size requirement doesn't apply at all, regardless of spacing.
  const html = `<!doctype html><html><body>
    <label><input type="checkbox" id="cb1" data-rect="0,0,13,13"> Option A</label>
    <label><input type="checkbox" id="cb2" data-rect="0,20,13,13"> Option B</label>
  </body></html>`;
  const result = run(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: User Agent Control exception does NOT apply once the author resets appearance:none`, () => {
  // Same shape as the pass case above, but the author has taken over
  // styling (appearance:none) — evaluated normally, and fails like any
  // other undersized-and-close pair.
  const html = `<!doctype html><html><body>
    <input type="checkbox" id="cb3" style="appearance:none" data-rect="0,0,10,10">
    <input type="checkbox" id="cb4" style="appearance:none" data-rect="15,0,10,10">
  </body></html>`;
  const result = run(html);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(rule.occurrences.some((o) => /#cb3\b/.test(o.selector)));
  assert.ok(rule.occurrences.some((o) => /#cb4\b/.test(o.selector)));
});

test(`${RULE_ID}: User Agent Control exception is scoped to checkbox/radio only (not e.g. a small unstyled <select>)`, () => {
  const html = `<!doctype html><html><body>
    <select id="sel1" data-rect="0,0,10,10"></select>
    <select id="sel2" data-rect="15,0,10,10"></select>
  </body></html>`;
  const result = run(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/target-size-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'target-size-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = run(html);

  // 16, not 13: fixed 2026-07-31 — canttell_svg_a/canttell_svg_b are
  // cantTell-tier (essential/equivalent uncertainty) occurrences that used
  // to be silently discarded whenever the overall outcome was 'fail'
  // (see helpers.resolveTieredOutcome's header comment); they're now
  // correctly merged into the result alongside the confident fails. Plus 1
  // more for canttell_ambiguous_spacing_target (ambiguous-tier perimeter
  // sampling), same merging.
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 16, maxOccurrences: 16 });

  function hasOccurrenceForId(id) {
    return rule.occurrences.some((o) => typeof o.selector === 'string' && new RegExp(`#${id}\\b`).test(o.selector));
  }

  const expectedFailIds = [
    'fail_close_a',
    'fail_close_b',
    'fail_aria_hidden',
    'near_aria_hidden',
    'fail_opacity0',
    'near_opacity0',
    'fail_occluded_small',
    'fail_inline_not_text_container',
    'fail_near_inline_not_text_container',
    'fail_geo_a',
    'fail_geo_b',
    'fail_styled_checkbox_1',
    'fail_styled_checkbox_2',
    'canttell_svg_a', // essential/equivalent uncertainty inside svg — now merged into the 'fail' result (fixed 2026-07-31)
    'canttell_svg_b',
    'canttell_ambiguous_spacing_target' // ambiguous-tier perimeter sampling — same merging
  ];

  const expectedNoOccIds = [
    'pass_big',
    'pass_spaced_small',
    'excluded_pointer_events',
    'near_pointer_events', // sole remaining target after excluding pe-none => passes by spacing exception
    'excluded_display_none',
    'excluded_visibility_hidden',
    'excluded_content_visibility_hidden',
    'excluded_hidden_attr',
    'details_summary',
    'excluded_details_content',
    'excluded_inert',
    'excluded_no_rects',
    'occluder_big', // not undersized, not iterated
    'pass_inline_link',
    'pass_inline_block_link',
    'pass_inline_close_link',
    'pass_button_near_inline_link',
    'excluded_disabled',
    'excluded_aria_disabled',
    'pass_lone_small',
    'pass_nested_outer_link', // ancestor/descendant relationship excluded from spacing conflicts
    'pass_nested_inner_button',
    'pass_ua_checkbox_1', // User Agent Control exception: unstyled native checkbox/radio
    'pass_ua_checkbox_2',
    'ambiguous_spacing_neighbor' // undersized itself, but isolated -- its own perimeter sampling finds nothing nearby
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(id), `Expected occurrence for id="${id}"`);
  }

  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(id), `Did not expect occurrence for id="${id}"`);
  }

  const ambiguousOcc = rule.occurrences.find((o) => typeof o.selector === 'string' && /#canttell_ambiguous_spacing_target\b/.test(o.selector));
  assert.ok(ambiguousOcc, 'expected an occurrence for canttell_ambiguous_spacing_target');
  assert.strictEqual(ambiguousOcc.data.details.reasonCode, 'undersized-ambiguous-spacing');
  assert.strictEqual(ambiguousOcc.data.details.conflictHitCount, 3);
});

// This rule's geometry (getBoundingClientRect/elementFromPoint) only becomes
// deterministic in jsdom via patchTargetSizeEnv above, which the generic
// tests/node-runtime-parity.test.js harness doesn't apply (it loads every
// rule's fixture through a plain, unpatched JSDOM) -- so that harness alone
// can't exercise this rule's real measurement/spacing logic through the
// Node/require entry point. Doing it here, once, with the same patching the
// rest of this file already relies on.
test(`${RULE_ID}: runDomRulesInPage (Node/require entry point) agrees with runa11yCoreInPage on the full fixture`, () => {
  const { runDomRulesInPage } = require('../../../src/index.js');

  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'target-size-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  const viaInPage = run(html);

  const dom = createDom(html);
  patchTargetSizeEnv(dom);
  const viaNodeRuntime = runDomRulesInPage('https://example.test/', null, { rules: [RULE_ID] }, null);

  const inPageCheck = viaInPage.checksResults.find((r) => r.ruleId === RULE_ID);
  const nodeCheck = viaNodeRuntime.checksResults.find((r) => r.ruleId === RULE_ID);

  assert.ok(inPageCheck && nodeCheck, 'expected a checksResults entry from both entry points');
  assert.strictEqual(nodeCheck.outcome, inPageCheck.outcome);
  assert.strictEqual(nodeCheck.occurrences.length, inPageCheck.occurrences.length);
});
