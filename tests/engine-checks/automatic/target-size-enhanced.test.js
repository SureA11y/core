'use strict';

// target-size-enhanced (WCAG 2.5.5) is target-size-minimum run at 44px with
// no spacing exception (a variant, src/core/rule-variants.js). These tests
// cover what differs from 2.5.8; the measuring is target-size-minimum's, and
// tested there.

const test = require('node:test');
const assert = require('node:assert');

const { createDom, runa11yCoreOnDom } = require('../../helpers/runa11yCoreOnHtml');
const { assertRule } = require('../../helpers/assertRule');
const { patchTargetSizeEnv } = require('../../helpers/patchTargetSizeEnv');

const RULE_ID = 'target-size-enhanced';

// patchTargetSizeEnv lays elements out from data-rect="x,y,w,h", in a
// 1000x800 viewport.
function run(html, engineOptions = {}, rules = [RULE_ID]) {
  const dom = createDom(html);
  patchTargetSizeEnv(dom);
  return runa11yCoreOnDom(dom, { engineOptions: { rules, ...engineOptions } });
}

test(`${RULE_ID}: a target of 44 by 44 passes`, () => {
  const html = `<!doctype html><html><body>
    <button id="big" data-rect="10,10,44,44">Big</button>
  </body></html>`;
  assertRule(run(html), RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a target under 44 fails however far it is from others, where 2.5.8 passes it`, () => {
  // 30 by 30 and alone: 2.5.8's 24 is met, and 2.5.5 has no spacing exception.
  const html = `<!doctype html><html><body>
    <button id="lone" data-rect="100,100,30,30">Lone</button>
  </body></html>`;
  const result = run(html, {}, [RULE_ID, 'target-size-minimum']);
  assertRule(result, 'target-size-minimum', 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.data.details.reasonCode, 'undersized');
  assert.deepStrictEqual(occ.data.details.metrics, {
    widthPx: 30,
    heightPx: 30,
    squarePx: 30,
    minSizePx: 44,
    decidedBy: null
  });
  assert.strictEqual(occ.data.details.conflictWith, null);
  assert.strictEqual(occ.i18n.summaryKey, 'targetSizeEnhanced_summary_fail');
  assert.strictEqual(occ.i18n.hintKey, 'targetSizeEnhanced_hint_fail_size');
  assert.strictEqual(occ.summary, 'Target is 30×30 CSS px at a 1000px-wide viewport, under 44×44.');
  assert.strictEqual(occ.hint, 'Make the target at least 44×44 CSS px.');
});

test(`${RULE_ID}: a small target far from others fails too, which target-size-minimum leaves unmeasured`, () => {
  const html = `<!doctype html><html><body>
    <button id="a" data-rect="10,10,10,10">A</button>
    <button id="b" data-rect="400,300,10,10">B</button>
  </body></html>`;
  const result = run(html, {}, [RULE_ID, 'target-size-minimum']);
  assertRule(result, 'target-size-minimum', 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
});

test(`${RULE_ID}: a link in a sentence is exempt (inline)`, () => {
  const html = `<!doctype html><html><body>
    <p>Read <a id="lnk" href="#" style="display:inline" data-rect="10,10,30,16">more</a> here.</p>
  </body></html>`;
  assertRule(run(html), RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an unstyled native checkbox is exempt (user-agent sizing)`, () => {
  const html = `<!doctype html><html><body>
    <label><input type="checkbox" id="cb" data-rect="0,0,13,13"> Option</label>
  </body></html>`;
  assertRule(run(html), RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a small target in an SVG is asked about, even alone (essential)`, () => {
  const html = `<!doctype html><html><body>
    <svg><button id="pin" data-rect="10,10,10,10">Pin</button></svg>
  </body></html>`;
  const rule = assertRule(run(html), RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.data.details.reasonCode, 'undersized-plausibly-essential');
  assert.strictEqual(
    occ.summary,
    'Target is 10×10 CSS px at a 1000px-wide viewport, under 44×44, but may be exempt as part of an essential graphic or image-map region.'
  );
});

test(`${RULE_ID}: links side by side between separators are asked about (inline)`, () => {
  const html = `<!doctype html><html><body>
      <p><a id="a" href="#a" style="display:inline" data-rect="10,10,10,10">Edit</a> · <a id="b" href="#b" style="display:inline" data-rect="25,10,10,10">Delete</a></p>
  </body></html>`;
  const rule = assertRule(run(html), RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  for (const occ of rule.occurrences) {
    assert.strictEqual(occ.data.details.reasonCode, 'undersized-inline-link-run');
    assert.strictEqual(occ.i18n.summaryKey, 'targetSizeEnhanced_summary_cantTell_inlineLinkRun');
    assert.ok(occ.data.details.conflictWith, 'names the link beside it');
  }
});

test(`${RULE_ID}: the smallest target of 44 or more is the margin, against 44`, () => {
  const html = `<!doctype html><html><body>
    <button id="close" data-rect="10,10,46,46">Close</button>
    <button id="far" data-rect="300,300,60,60">Far</button>
  </body></html>`;
  const rule = assertRule(run(html), RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  assert.strictEqual(rule.margin.threshold, 44);
  assert.strictEqual(rule.margin.value, 46);
  assert.strictEqual(rule.margin.headroom, 2);
  assert.strictEqual(rule.margin.selector, '#close');
});

test(`${RULE_ID}: its messages are translated`, () => {
  const html = `<!doctype html><html><body>
    <button id="lone" data-rect="100,100,30,30">Lone</button>
  </body></html>`;
  const rule = assertRule(run(html, { locale: 'fr' }), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.strictEqual(rule.occurrences[0].hint, 'Donnez à la cible au moins 44×44 px CSS.');
});

test(`${RULE_ID}: run with target-size-minimum, which reads the same regions, each judges at its own size`, () => {
  // A 30 by 30 button fits 2.5.8's 24, so the small one 20px from its
  // centre is no conflict for it there (only the small one fails), while
  // neither fits 2.5.5's 44. The two rules share their measurements in one
  // scan (helpers.runMemo); whether a region fits is kept by size, so the
  // 44 test doesn't answer the 24 one.
  const html = `<!doctype html><html><body>
    <button id="a" data-rect="100,100,30,30">A</button>
    <button id="b" data-rect="130,110,10,10">B</button>
  </body></html>`;
  const result = run(html, {}, [RULE_ID, 'target-size-minimum']);
  const minimum = assertRule(result, 'target-size-minimum', 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.match(minimum.occurrences[0].html, /id="b"/);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
});
