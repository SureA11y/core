'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { createDom, runa11yCoreOnDom } = require('../../helpers/runa11yCoreOnHtml');
const { runDomRulesInPage } = require('../../../src/index.js');

const { assertRule } = require('../../helpers/assertRule');

const RULE_ID = 'contrast-minimum';

/**
 * JSDOM caveats (learned from contrast-computable checks):
 * - Geometry APIs often return empty/zero (can affect visibility checks if geometry is used).
 * - getComputedStyle may return "" for properties we rely on (opacity/display/visibility, etc).
 *
 * These patches make checks deterministic across environments.
 */
function patchGeometry(dom) {
  const { window } = dom;
  const proto = window.Element && window.Element.prototype;
  if (!proto) return;

  // Always return at least one rect
  if (typeof proto.getClientRects !== 'function') {
    proto.getClientRects = function getClientRects() {
      return [{ x: 0, y: 0, width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10 }];
    };
  } else {
    const orig = proto.getClientRects;
    proto.getClientRects = function patchedGetClientRects() {
      try {
        const r = orig.call(this);
        if (r && r.length) return r;
      } catch {}
      return [{ x: 0, y: 0, width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10 }];
    };
  }

  // Always return non-zero bbox
  if (typeof proto.getBoundingClientRect !== 'function') {
    proto.getBoundingClientRect = function getBoundingClientRect() {
      return { x: 0, y: 0, width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10 };
    };
  } else {
    const orig = proto.getBoundingClientRect;
    proto.getBoundingClientRect = function patchedGetBoundingClientRect() {
      try {
        const r = orig.call(this);
        if (r && r.width > 0 && r.height > 0) return r;
      } catch {}
      return { x: 0, y: 0, width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10 };
    };
  }
}

function patchComputedStyleDefaults(dom) {
  const { window } = dom;
  const orig = window.getComputedStyle;
  if (typeof orig !== 'function') return;

  window.getComputedStyle = function patchedGetComputedStyle(el) {
    const cs = orig.call(window, el);

    // Provide deterministic defaults for JSDOM empty-string computed values.
    return new Proxy(cs, {
      get(target, prop) {
        const v = target[prop];

        if (v == null || v === '') {
          // Visibility eligibility defaults
          if (prop === 'opacity') return '1';
          if (prop === 'display') return 'block';
          if (prop === 'visibility') return 'visible';
          if (prop === 'contentVisibility') return 'visible';

          // Computability blocker defaults
          if (prop === 'backgroundImage') return 'none';
          if (prop === 'mixBlendMode') return 'normal';
          if (prop === 'filter') return 'none';
          if (prop === 'backdropFilter') return 'none';

          // Typography defaults (rule reads fontSize/fontWeight)
          if (prop === 'fontSize') return '16px';
          if (prop === 'fontWeight') return '400';
          if (prop === 'color') return 'rgb(0, 0, 0)';
          if (prop === 'backgroundColor') return 'rgba(0, 0, 0, 0)';
        }

        return v;
      }
    });
  };
}

function run(html, engineOptions = {}) {
  const dom = createDom(html);
  patchGeometry(dom);
  patchComputedStyleDefaults(dom);

  return runa11yCoreOnDom(dom, {
    engineOptions: {
      rules: [RULE_ID],
      ...engineOptions
    }
  });
}

// Every scenario above runs through runa11yCoreOnDom (toString-embedded),
// which Node's --experimental-test-coverage can't attribute back to this
// file (see tests/node-runtime-parity.test.js's header comment). This
// rule's own analysis logic (computability gating, ratio/threshold
// computation, pass/fail occurrence building) needs the same
// patchGeometry/patchComputedStyleDefaults patches the generic parity
// harness doesn't apply (it loads every rule's fixture through a plain,
// unpatched JSDOM) -- so, like target-size-minimum, none of it ran through
// the real entry point before this. Reusing the same patches with
// runDomRulesInPage directly here, same pattern as target-size-minimum.test.js.
function runNode(html, engineOptions = {}) {
  const dom = createDom(html);
  patchGeometry(dom);
  patchComputedStyleDefaults(dom);

  return runDomRulesInPage(
    'https://example.test/',
    null,
    { rules: [RULE_ID], ...engineOptions },
    null
  );
}

function ruleFrom(result) {
  return result.checksResults.find((r) => r.ruleId === RULE_ID);
}

test(`${RULE_ID}: no visible eligible text => notApplicable`, () => {
  const html = `
<!doctype html>
<html><head><style>
  html, body { background: #fff; }
</style></head>
<body>
  <div>    </div>
</body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: text whose color exactly matches its background is not visible => notApplicable (ACT afw4f7's own inapplicable example)`, () => {
  const html = `
<!doctype html>
<html><head><style>
  html, body { background: #fff; }
</style></head>
<body>
  <p style="color: white; background: white;">Hidden text</p>
</body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a low but non-matching contrast still fails (the same-color exemption doesn't swallow a real near-invisible defect)`, () => {
  const html = `
<!doctype html>
<html><head><style>
  html, body { background: #fff; }
</style></head>
<body>
  <p id="a" style="color: #fefefe; background: #ffffff;">Barely different</p>
</body></html>`;

  const result = run(html);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(rule.occurrences.some((o) => typeof o.html === 'string' && o.html.includes('id="a"')));
});

test(`${RULE_ID}: text made only of punctuation/symbol characters is out of scope => notApplicable (ACT afw4f7's own passed example: "does not express anything in human language")`, () => {
  const html = `
<!doctype html>
<html><head><style>
  html, body { background: #fff; }
</style></head>
<body>
  <p style="color: #000; background: #666;">----=====++++++++___________***********%%%%%%%%%%%±±±±@@@@@@@@</p>
</body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: digits-only text still counts as human-language content and is still checked`, () => {
  const html = `
<!doctype html>
<html><head><style>
  html, body { background: #fff; }
</style></head>
<body>
  <p id="a" style="color: #000; background: #666;">42</p>
</body></html>`;

  const result = run(html);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(rule.occurrences.some((o) => typeof o.html === 'string' && o.html.includes('id="a"')));
});

test(`${RULE_ID}: eligible text exists but none computable => notApplicable (noComputableText)`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <!-- This creates a computability blocker (background-image). -->
  <p style="color: rgb(17, 17, 17); background-image: linear-gradient(#fff, #000); opacity: 1">Hello</p>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'notApplicable', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.strictEqual(
    rule.occurrences[0].i18n.summaryKey,
    'contrastMinimum_notApplicable_noComputableText'
  );
  assert.ok(Number(rule.occurrences[0].data.details.eligibleTextCount) >= 1);
  assert.strictEqual(Number(rule.occurrences[0].data.details.computableTextCount), 0);
});

test(`${RULE_ID}: strictConformance + root not opaque => notApplicable (noComputableText)`, () => {
  const html = `
<!doctype html>
<html><head><style>
  html, body { background: transparent; }
</style></head>
<body>
  <p style="color: #767676">Hello</p>
</body></html>`;

  const result = run(html, {
    contrast: { mode: 'strictConformance', rootCanvasFallback: '#ffffff' }
  });

  const rule = assertRule(result, RULE_ID, 'notApplicable', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.strictEqual(
    rule.occurrences[0].i18n.summaryKey,
    'contrastMinimum_notApplicable_noComputableText'
  );
  assert.ok(Number(rule.occurrences[0].data.details.eligibleTextCount) >= 1);
  assert.strictEqual(Number(rule.occurrences[0].data.details.computableTextCount), 0);
});

test(`${RULE_ID}: auditorAssist + root not opaque => pass using rootCanvasFallback`, () => {
  const html = `
<!doctype html>
<html><head><style>
  html, body { background: transparent; }
</style></head>
<body>
  <p style="color: #767676">Hello</p>
</body></html>`;

  const result = run(html, { contrast: { mode: 'auditorAssist', rootCanvasFallback: '#ffffff' } });

  assertRule(result, RULE_ID, 'pass', { minOccurrences: 1 });
});

test(`${RULE_ID}: computable normal text meets 4.5:1 => pass`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p style="color: rgb(17, 17, 17); background-color: rgb(255, 255, 255); font-size: 16px; font-weight: 400; opacity: 1">
    Hello
  </p>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].i18n.summaryKey, 'contrastMinimum_pass_allAboveThreshold');

  assert.ok(Number(rule.occurrences[0].data.details.eligibleTextCount) >= 1);
  assert.ok(Number(rule.occurrences[0].data.details.computableTextCount) >= 1);
});

test(`${RULE_ID}: computable normal text below 4.5:1 => fail (BELOW_THRESHOLD)`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <!-- #999 on white is comfortably below 4.5:1 -->
  <p id="t" style="color: rgb(153, 153, 153); background-color: rgb(255, 255, 255); font-size: 16px; font-weight: 400; opacity: 1">
    Hello
  </p>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 50 });
  const occ = rule.occurrences[0];

  // Regression guard: failing occurrences must include HTML snippet (via helpers.reportOccurrence)
  assert.ok(
    typeof occ.html === 'string' && occ.html.length > 0,
    'expected occ.html to be populated'
  );
  assert.match(occ.html, /<p\b/i, 'expected snippet to contain the failing <p>');
  assert.match(occ.html, /id\s*=\s*["']t["']/i, 'expected snippet to include the element id');

  assert.ok(
    typeof occ.selector === 'string' && occ.selector.length > 0,
    'expected occ.selector to be populated'
  );
  assert.strictEqual(occ.selector, '#t');

  assert.strictEqual(occ.i18n.summaryKey, 'contrastMinimum_fail_belowThreshold');
  assert.strictEqual(occ.data.details.reasonCode, 'BELOW_THRESHOLD');

  // Regression guard: node metadata belongs under data.details.node (matching
  // contrast-enhanced.js and every other rule's "extra diagnostic data lives
  // under data.details" convention), not as a non-standard top-level occ.node
  // -- contrast-minimum.js was the sole outlier before this was fixed.
  assert.strictEqual(occ.node, undefined, 'occ.node should not exist as a top-level field');
  assert.deepStrictEqual(occ.data.details.node, { selector: '#t', tagName: 'p' });

  // Threshold for normal text at AA is 4.5
  assert.strictEqual(occ.i18n.params.threshold, '4.5');

  // Basic presence/sanity of useful params
  assert.ok(typeof occ.i18n.params.ratio === 'string' && occ.i18n.params.ratio.length > 0);
  assert.ok(
    typeof occ.i18n.params.foreground === 'string' && occ.i18n.params.foreground.startsWith('rgba(')
  );
  assert.ok(
    typeof occ.i18n.params.background === 'string' && occ.i18n.params.background.startsWith('rgba(')
  );
});

test(`${RULE_ID}: large text uses 3:1 threshold (passes when <4.5 but >=3) => pass`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <!-- #888 on white is typically <4.5 but >=3 -->
  <p style="color: rgb(136, 136, 136); background-color: rgb(255, 255, 255); font-size: 24px; font-weight: 400; opacity: 1">
    Large text
  </p>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].i18n.summaryKey, 'contrastMinimum_pass_allAboveThreshold');
});

test(`${RULE_ID}: large text below 3:1 => fail`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <!-- #aaa on white is low contrast; use large text threshold (3:1) and ensure it fails -->
  <p id="lt" style="color: rgb(170, 170, 170); background-color: rgb(255, 255, 255); font-size: 24px; font-weight: 400; opacity: 1">
    Large text
  </p>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 50 });
  const occ = rule.occurrences[0];

  assert.ok(
    typeof occ.html === 'string' && occ.html.length > 0,
    'expected occ.html to be populated'
  );
  assert.match(occ.html, /<p\b/i, 'expected snippet to contain the failing <p>');
  assert.match(occ.html, /id\s*=\s*["']lt["']/i, 'expected snippet to include the element id');

  assert.ok(
    typeof occ.selector === 'string' && occ.selector.length > 0,
    'expected occ.selector to be populated'
  );
  assert.match(occ.selector, /#lt\b/);

  assert.strictEqual(occ.i18n.summaryKey, 'contrastMinimum_fail_belowThreshold');
  assert.strictEqual(occ.data.details.reasonCode, 'BELOW_THRESHOLD');

  // Threshold for large text at AA is 3
  assert.strictEqual(occ.i18n.params.threshold, '3');
  assert.strictEqual(occ.i18n.params.isLargeText, true);
});

test(`${RULE_ID}: dedup failures per element (multiple text nodes in same element) => 1 occurrence`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p id="t" style="color: rgb(153, 153, 153); background-color: rgb(255, 255, 255); font-size: 16px; font-weight: 400; opacity: 1">
    Hello<!--split-->World
  </p>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 50 });
  assert.strictEqual(rule.occurrences.length, 1);
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'BELOW_THRESHOLD');
});

test(`${RULE_ID}: boundary just above 4.5:1 (rgb(118,118,118) on white, normal text) => pass`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p style="color: rgb(118, 118, 118); background-color: rgb(255, 255, 255); font-size: 16px; font-weight: 400; opacity: 1">
    Boundary pass
  </p>
</body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: boundary just below 4.5:1 (rgb(119,119,119) on white, normal text) => fail`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p id="bnd" style="color: rgb(119, 119, 119); background-color: rgb(255, 255, 255); font-size: 16px; font-weight: 400; opacity: 1">
    Boundary fail
  </p>
</body></html>`;

  const result = run(html);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].i18n.params.threshold, '4.5');
});

test(`${RULE_ID}: boundary just above 3:1 for large text (rgb(148,148,148) @ 24px) => pass`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p style="color: rgb(148, 148, 148); background-color: rgb(255, 255, 255); font-size: 24px; font-weight: 400; opacity: 1">
    Boundary pass large
  </p>
</body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: boundary just below 3:1 for large text (rgb(149,149,149) @ 24px) => fail`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p id="bndl" style="color: rgb(149, 149, 149); background-color: rgb(255, 255, 255); font-size: 24px; font-weight: 400; opacity: 1">
    Boundary fail large
  </p>
</body></html>`;

  const result = run(html);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].i18n.params.threshold, '3');
});

test(`${RULE_ID}: bold-large threshold boundary (18.6667px + weight 700) uses large-text 3:1 threshold`, () => {
  const passHtml = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p style="color: rgb(148, 148, 148); background-color: rgb(255, 255, 255); font-size: 18.6667px; font-weight: 700; opacity: 1">
    Bold large pass
  </p>
</body></html>`;
  assertRule(run(passHtml), RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });

  const failHtml = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p id="boldbnd" style="color: rgb(149, 149, 149); background-color: rgb(255, 255, 255); font-size: 18.6667px; font-weight: 700; opacity: 1">
    Bold large fail
  </p>
</body></html>`;
  const rule = assertRule(run(failHtml), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].i18n.params.threshold, '3');
  assert.strictEqual(rule.occurrences[0].i18n.params.isLargeText, true);
});

test(`${RULE_ID}: 14pt bold text is recognized as large text (pt->px conversion, not just an exact px literal) => pass`, () => {
  // Regression test for a floating-point precision bug: 14pt converts to
  // 18.666666666666664px, which is LESS than a hardcoded "18.6667px"
  // threshold literal, so text specified in pt (the common real-world
  // case, unlike the boundary test above which uses an exact px literal)
  // was incorrectly falling through to the 4.5:1 normal-text threshold.
  // #000 on #666 is ~3.66:1 -- below 4.5:1, but above the large-text 3:1.
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p style="color: #000; font-size: 14pt; font-weight: 700; background: #666;">
    Some text in English
  </p>
</body></html>`;
  const rule = assertRule(run(html), RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].i18n.summaryKey, 'contrastMinimum_pass_allAboveThreshold');
});

test(`${RULE_ID}: text forming the accessible name of a disabled widget via a <label> is exempt (WCAG 1.4.3 Incidental exception) => pass`, () => {
  const nativeLabelHtml = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <label style="color:#888; background: white;">
    My name
    <input type="text" disabled />
  </label>
</body></html>`;
  assertRule(run(nativeLabelHtml), RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });

  const ariaLabelledbyHtml = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <label id="my_pets_name" style="color:#888; background: white;">
    My pet's name
  </label>
  <div
    role="textbox"
    aria-labelledby="my_pets_name"
    aria-disabled="true"
    style="height:20px; width:100px; border:1px solid black;"
  >
    test
  </div>
</body></html>`;
  assertRule(run(ariaLabelledbyHtml), RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: ANCESTOR opacity < 1 gates to notApplicable instead of a confidently wrong ratio`, () => {
  // The ancestor-opacity computability blocker (see contrast-computable) means
  // this rule must NOT compute a ratio for this element; overall outcome stays
  // notApplicable because nothing else in this page is computable.
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <div style="opacity: 0.5; background-color: rgb(255, 255, 255);">
    <p style="color: rgb(0, 0, 0); background-color: rgb(255, 255, 255); opacity: 1;">
      Ancestor opacity text
    </p>
  </div>
</body></html>`;

  const result = run(html);
  const rule = assertRule(result, RULE_ID, 'notApplicable', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.strictEqual(
    rule.occurrences[0].i18n.summaryKey,
    'contrastMinimum_notApplicable_noComputableText'
  );
  assert.strictEqual(Number(rule.occurrences[0].data.details.computableTextCount), 0);
});

test(`${RULE_ID}: element's OWN opacity < 1 is NOT a computability blocker; ratio is computed (and here fails)`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p id="ownop" style="color: rgb(0, 0, 0); background-color: rgb(255, 255, 255); opacity: 0.5;">
    Own opacity text
  </p>
</body></html>`;

  const result = run(html);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'BELOW_THRESHOLD');
  assert.strictEqual(rule.occurrences[0].i18n.params.ratio, '3.95');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/contrast-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'contrast-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 14, maxOccurrences: 14 });

  const expectedFailIds = [
    'aa_fail_light_gray_on_white',
    'large_text_light_gray_on_white',
    'bold_large_text_light_gray_on_white',
    'fg_alpha_black_50_on_white',
    'own_opacity_still_computable',
    'excluded_inert_fail',
    'excluded_aria_hidden_fail',
    'eligible_aria_hidden_tabbable_fail',
    'excluded_aria_hidden_prog_focus',
    'eligible_offscreen_fail',
    'eligible_zero_size_text',
    'eligible_enabled_button_fail',
    // <input type="submit"|"button">'s visible label comes from the
    // value attribute, not a DOM text node, and must still be evaluated
    // (see contrast-helpers.js's getTextScan).
    'eligible_submit_input_fail',
    'eligible_button_input_fail'
  ];

  const expectedNoOccIds = [
    'pass_black_on_white',
    'aa_pass_aaa_fail_gray_on_white', // passes AA (fails AAA only)
    'bg_alpha_white_50_black_text',
    'bg_alpha_80_over_gray_black_text',
    'excluded_hidden_attr_fail',
    'excluded_display_none_fail',
    'excluded_visibility_hidden_fail',
    'excluded_visibility_collapse_fail',
    'excluded_details_closed_fail',
    'excluded_template_fail',
    'excluded_sr_only_clip_fail', // never visually presented; no contrast requirement
    'whitespace_only',
    'blocker_gradient_bg', // not computable => notApplicable-territory, no occurrence here
    'blocker_image_bg',
    'blocker_mix_blend_mode',
    'blocker_filter',
    'blocker_backdrop_filter',
    'blocker_ancestor_opacity',
    'excluded_disabled_button_fail', // inactive UI component (WCAG 1.4.3/1.4.6 Incidental exception)
    'excluded_disabled_button_nested_fail',
    'excluded_disabled_fieldset_fail',
    'excluded_aria_disabled_fail',
    'excluded_disabled_submit_input_fail' // same inactive-UI-component exception, on a value-text input
  ];

  for (const id of expectedFailIds) {
    assert.ok(
      rule.occurrences.some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)),
      `Expected occurrence for id="${id}"`
    );
  }

  for (const id of expectedNoOccIds) {
    assert.ok(
      !rule.occurrences.some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)),
      `Did not expect occurrence for id="${id}"`
    );
  }
});

test(`${RULE_ID} (node runtime): fixture coverage (tests/fixtures/contrast-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'contrast-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runNode(html);
  const rule = ruleFrom(result);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'fail');
  assert.strictEqual(rule.occurrences.length, 14);

  const expectedFailIds = [
    'aa_fail_light_gray_on_white',
    'large_text_light_gray_on_white',
    'bold_large_text_light_gray_on_white',
    'fg_alpha_black_50_on_white',
    'own_opacity_still_computable',
    'excluded_inert_fail',
    'excluded_aria_hidden_fail',
    'eligible_aria_hidden_tabbable_fail',
    'excluded_aria_hidden_prog_focus',
    'eligible_offscreen_fail',
    'eligible_zero_size_text',
    'eligible_enabled_button_fail',
    'eligible_submit_input_fail',
    'eligible_button_input_fail'
  ];
  const expectedNoOccIds = [
    'pass_black_on_white',
    'aa_pass_aaa_fail_gray_on_white',
    'bg_alpha_white_50_black_text',
    'bg_alpha_80_over_gray_black_text',
    'excluded_sr_only_clip_fail',
    'blocker_gradient_bg',
    'blocker_image_bg',
    'blocker_mix_blend_mode',
    'blocker_filter',
    'blocker_backdrop_filter',
    'blocker_ancestor_opacity',
    'excluded_disabled_button_fail',
    'excluded_disabled_submit_input_fail'
  ];

  for (const id of expectedFailIds) {
    assert.ok(
      rule.occurrences.some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)),
      `Expected occurrence for id="${id}"`
    );
  }
  for (const id of expectedNoOccIds) {
    assert.ok(
      !rule.occurrences.some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)),
      `Did not expect occurrence for id="${id}"`
    );
  }
});

test(`${RULE_ID} (node runtime): auditorAssist + root not opaque => pass using rootCanvasFallback`, () => {
  const html = `
<!doctype html>
<html><head><style>
  html, body { background: transparent; }
</style></head>
<body>
  <p style="color: #767676">Hello</p>
</body></html>`;

  const result = runNode(html, {
    contrast: { mode: 'auditorAssist', rootCanvasFallback: '#ffffff' }
  });
  const rule = ruleFrom(result);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'pass');
  assert.ok(rule.occurrences.length >= 1);
  assert.strictEqual(rule.occurrences[0].i18n.summaryKey, 'contrastMinimum_pass_allAboveThreshold');
});

test(`${RULE_ID} (node runtime): no visible eligible text => notApplicable`, () => {
  const html = `
<!doctype html>
<html><head><style>
  html, body { background: #fff; }
</style></head>
<body>
  <div>    </div>
</body></html>`;

  const result = runNode(html);
  const rule = ruleFrom(result);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});

// Optional determinism smoke check (same input => same output)
/*
test(`${RULE_ID}: determinism (same input => same output)`, () => {
    const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p style="color: rgb(17, 17, 17); background-color: rgb(255, 255, 255); font-size: 16px; font-weight: 400; opacity: 1">
    Hello
  </p>
</body></html>`;

    const r1 = run(html);
    const r2 = run(html);
    assert.deepStrictEqual(r2, r1);
});
*/

// A TreeWalker stops at a shadow boundary and querySelectorAll does not cross
// one, so text inside a component was never examined at all -- reported as
// notApplicable rather than as an unresolvable contrast.
const LOW_CONTRAST = '<p style="color:#aaa;background:#fff">low contrast text</p>';

function contrastIn(build, engineOptions = {}) {
  const dom = createDom(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><div id="h"></div></body></html>'
  );
  build(dom.window.document.getElementById('h'));
  const rule = runa11yCoreOnDom(dom, { engineOptions }).checksResults.find(
    (r) => r.ruleId === 'contrast-minimum'
  );
  return { outcome: rule.outcome, count: (rule.occurrences || []).length };
}

test('contrast-minimum: text inside an open shadow root is checked', () => {
  assert.deepStrictEqual(
    contrastIn((host) => {
      host.attachShadow({ mode: 'open' }).innerHTML = LOW_CONTRAST;
    }),
    { outcome: 'fail', count: 1 }
  );
});

test('contrast-minimum: nested shadow roots are reached', () => {
  assert.deepStrictEqual(
    contrastIn((host) => {
      const inner = host.attachShadow({ mode: 'open' });
      inner.innerHTML = '<div id="h2"></div>';
      inner.getElementById('h2').attachShadow({ mode: 'open' }).innerHTML = LOW_CONTRAST;
    }),
    { outcome: 'fail', count: 1 }
  );
});

test('contrast-minimum: includeShadowDom false still skips shadow content', () => {
  assert.deepStrictEqual(
    contrastIn(
      (host) => {
        host.attachShadow({ mode: 'open' }).innerHTML = LOW_CONTRAST;
      },
      { includeShadowDom: false }
    ),
    { outcome: 'notApplicable', count: 0 }
  );
});

test('contrast-minimum: a closed shadow root stays unreachable', () => {
  assert.deepStrictEqual(
    contrastIn((host) => {
      host.attachShadow({ mode: 'closed' }).innerHTML = LOW_CONTRAST;
    }),
    { outcome: 'notApplicable', count: 0 }
  );
});

test('contrast-minimum: text is counted once, not once per root', () => {
  assert.deepStrictEqual(
    contrastIn((host) => {
      host.attachShadow({ mode: 'open' }).innerHTML = LOW_CONTRAST;
      host.insertAdjacentHTML('afterend', LOW_CONTRAST);
    }),
    { outcome: 'fail', count: 2 },
    'one occurrence per text node, shadow plus light'
  );

  assert.deepStrictEqual(
    contrastIn((host) => {
      host.attachShadow({ mode: 'open' }).innerHTML = '<slot></slot>';
      host.innerHTML = LOW_CONTRAST;
    }),
    { outcome: 'fail', count: 1 },
    'slotted content lives in the light tree and is walked once'
  );
});
