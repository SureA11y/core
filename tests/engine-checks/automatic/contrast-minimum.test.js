'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { createDom, runa11yCoreOnDom } = require('../../helpers/runa11yCoreOnHtml');
const { runDomRulesInPage } = require('../../../src/index.js');
const { runa11yCoreOnHtml } = require('../../../src/testing.js');
const { definePack } = require('../../../src/pack.js');

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

test(`${RULE_ID}: strictConformance + root not opaque => measured on the page's white canvas`, () => {
  const html = `
<!doctype html>
<html><head><style>
  html, body { background: transparent; }
</style></head>
<body>
  <p style="color: #767676">Hello</p>
  <p id="faint" style="color: #bbbbbb">Faint</p>
</body></html>`;

  const rule = assertRule(run(html, { contrast: { mode: 'strictConformance' } }), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const det = rule.occurrences[0].data.details;
  assert.match(rule.occurrences[0].html, /id="faint"/);
  assert.strictEqual(det.reasonCode, 'BELOW_THRESHOLD');
  assert.strictEqual(det.colors.backgroundHex, '#ffffff');
  assert.strictEqual(Number(det.metrics.ratio.toFixed(2)), 1.92);
  // The canvas follows from the page: no assumption, and no scheme named
  // for a page that declares none.
  assert.strictEqual(det.assumptionsApplied, null);
  assert.strictEqual(det.colorScheme, undefined);
  assert.strictEqual(det.colorSchemesChecked, undefined);
});

test(`${RULE_ID}: root not opaque, the text's colour in the page's dark scheme unknown => notApplicable (noComputableText)`, () => {
  const html = `<!doctype html><html><head><meta name="color-scheme" content="dark">
    <style>p { color: #767676 } @media (prefers-color-scheme: dark) { p { color: #ffffff } }</style>
    </head><body>
    <p>Hello</p>
  </body></html>`;
  const rule = assertRule(run(html), RULE_ID, 'notApplicable', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.strictEqual(
    rule.occurrences[0].i18n.summaryKey,
    'contrastMinimum_notApplicable_noComputableText'
  );
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

// The fallback stands for the canvas, under the page: a translucent body is
// drawn over it. Black text on 80% black over white is on #333, 1.66:1; the
// fallback drawn on top measured it on plain white and passed it (#221).
test(`${RULE_ID}: auditorAssist draws a translucent root background over the fallback`, () => {
  const html = `
<!doctype html>
<html><head></head>
<body style="background: rgba(0, 0, 0, 0.8)">
  <p style="color: #000000">Hello</p>
</body></html>`;

  const result = run(html, { contrast: { mode: 'auditorAssist', rootCanvasFallback: '#ffffff' } });

  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  const details = result.checksResults.find((r) => r.ruleId === RULE_ID).occurrences[0].data
    .details;
  assert.strictEqual(details.colors.backgroundHex, '#333333');
  assert.ok(details.metrics.ratio < 1.7, String(details.metrics.ratio));
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

test(`${RULE_ID}: ANCESTOR opacity < 1 over a flat resolvable backdrop is computable (and here fails)`, () => {
  // Group opacity over a flat, fully-resolvable backdrop is computable
  // (see contrast-computable) -- black text at 50% group opacity over
  // white resolves to a flat gray, ~4:1, below the AA threshold.
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
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'BELOW_THRESHOLD');
  assert.strictEqual(rule.occurrences[0].i18n.params.ratio, '3.95');
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
    'blocker_ancestor_opacity', // group opacity over a flat backdrop is computable
    'eligible_inert_fail',
    'eligible_aria_hidden_fail',
    'eligible_aria_hidden_tabbable_fail',
    'eligible_aria_hidden_prog_focus_fail',
    'eligible_offscreen_fail',
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
    'excluded_zero_size_text', // font-size 0 draws nothing
    'whitespace_only',
    'blocker_gradient_bg', // not computable => notApplicable-territory, no occurrence here
    'blocker_image_bg',
    'blocker_mix_blend_mode',
    'blocker_filter',
    'blocker_backdrop_filter',
    'own_opacity_own_background', // own opacity over its own background: 5.74:1 (#95)
    'own_opacity_unresolvable', // not computable (contrast-computable reports it)
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
    'blocker_ancestor_opacity', // group opacity over a flat backdrop is computable
    'eligible_inert_fail',
    'eligible_aria_hidden_fail',
    'eligible_aria_hidden_tabbable_fail',
    'eligible_aria_hidden_prog_focus_fail',
    'eligible_offscreen_fail',
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
    'excluded_zero_size_text', // font-size 0 draws nothing
    'blocker_gradient_bg',
    'blocker_image_bg',
    'blocker_mix_blend_mode',
    'blocker_filter',
    'blocker_backdrop_filter',
    'own_opacity_own_background', // own opacity over its own background: 5.74:1 (#95)
    'own_opacity_unresolvable', // not computable (contrast-computable reports it)
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

test(`${RULE_ID}: a <label for> naming a disabled control is exempt too => notApplicable`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <label for="n" style="color:#888; background: white;">My name</label>
  <input id="n" type="text" disabled />
</body></html>`;
  assertRule(run(html), RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// An element's own opacity fades its own background and its text together,
// as one group (CSS Color 4): the text is painted over the element's
// background first, then both are faded over the page (#95).
for (const [style, want, ratio] of [
  ['color:#fff; background-color:#000; opacity:0.6', 'pass', null], // 5.74:1
  ['color:#fff; background-color:#000; opacity:0.3', 'fail', '2.10'],
  ['color:#fff; background-color:rgba(0,0,0,0.5); opacity:0.6', 'fail', '2.10']
]) {
  test(`${RULE_ID}: own opacity over its own background (${style}) is measured as one group (#95)`, () => {
    const html = `<!doctype html><html style="background-color:#fff"><body style="background-color:#fff">
      <p id="badge" style="${style}">New badge</p>
    </body></html>`;
    const rule = assertRule(run(html), RULE_ID, want);
    if (ratio) assert.strictEqual(rule.occurrences[0].i18n.params.ratio, ratio);
  });
}

test(`${RULE_ID}: own opacity over its own background, inside an opacity ancestor, composes both groups (#95)`, () => {
  const html = `<!doctype html><html style="background-color:#fff"><body style="background-color:#fff">
    <div style="opacity:0.8"><p style="color:#fff; background-color:#000; opacity:0.6">Nested badge</p></div>
  </body></html>`;
  const rule = assertRule(run(html), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].i18n.params.ratio, '3.69');
});

// The text a form field shows is measured, though it isn't a text node: its
// current value, typed or set (#103). Chromium cases, with placeholders,
// are in contrast-form-fields-chromium.test.js.
test(`${RULE_ID}: the value of a text field is measured (#103)`, () => {
  const page = (
    field
  ) => `<!doctype html><html style="background-color:#fff"><body style="background-color:#fff">
    ${field}
  </body></html>`;
  assertRule(
    run(page('<input aria-label="f" value="Typed value" style="color:#ccc">')),
    RULE_ID,
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assertRule(
    run(page('<input type="email" aria-label="f" value="a@b.co" style="color:#333">')),
    RULE_ID,
    'pass'
  );

  // Typed: the value property, with no value attribute.
  const dom = createDom(page('<input id="f" aria-label="f" style="color:#ccc">'));
  patchGeometry(dom);
  patchComputedStyleDefaults(dom);
  dom.window.document.getElementById('f').value = 'Typed value';
  const typed = runa11yCoreOnDom(dom, { engineOptions: { rules: [RULE_ID] } });
  assertRule(typed, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  // A textarea is measured once, by its current value.
  const area = createDom(
    page('<textarea id="f" aria-label="f" style="color:#ccc">Start</textarea>')
  );
  patchGeometry(area);
  patchComputedStyleDefaults(area);
  assertRule(runa11yCoreOnDom(area, { engineOptions: { rules: [RULE_ID] } }), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  area.window.document.getElementById('f').value = '';
  assertRule(
    runa11yCoreOnDom(area, { engineOptions: { rules: [RULE_ID] } }),
    RULE_ID,
    'notApplicable'
  );

  for (const field of [
    '<input disabled aria-label="f" value="Typed value" style="color:#ccc">',
    '<input type="checkbox" aria-label="f" value="Typed value" style="color:#ccc">',
    '<input type="hidden" value="Typed value">',
    '<input aria-label="f" value="---" style="color:#ccc">'
  ]) {
    assertRule(run(page(field)), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: without a layout a placeholder is not measured, as its style can't be read (#103)`, () => {
  // jsdom computes no ::placeholder style.
  const dom =
    createDom(`<!doctype html><html style="background-color:#fff"><body style="background-color:#fff">
    <input aria-label="f" placeholder="Search" style="color:#ccc">
  </body></html>`);
  assertRule(
    runa11yCoreOnDom(dom, { engineOptions: { rules: [RULE_ID] } }),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: text is measured in the -webkit-text-fill-color it is painted in (#112)`, () => {
  const page = (style) =>
    `<!doctype html><html style="background-color:#fff"><body style="background-color:#fff"><p style="${style}">Readable sample text</p></body></html>`;
  // A dark fill over a light color is dark text.
  assertRule(run(page('color:#eee; -webkit-text-fill-color:#000')), RULE_ID, 'pass');
  // A light fill over a dark or transparent color is light text.
  for (const style of [
    'color:#000; -webkit-text-fill-color:#ccc',
    'color:transparent; -webkit-text-fill-color:#ccc'
  ]) {
    const rule = assertRule(run(page(style)), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.strictEqual(Number(rule.occurrences[0].data.details.metrics.ratio.toFixed(2)), 1.61);
  }
});

// A page drawn in a dark color scheme is measured on the dark canvas, in
// either contrast mode (#170). jsdom resolves no Canvas colour and lays
// nothing out, so the engine takes Chromium's (#121212), and the text the
// scheme colours its CanvasText (#ffffff); nothing is left in the page.
test('contrast-minimum: a page drawn in dark is measured on the dark canvas, in jsdom', () => {
  for (const head of [
    '<style>html{color-scheme:dark}</style>',
    '<meta name="color-scheme" content="dark">',
    '<style>html{color-scheme:only dark}</style>'
  ]) {
    for (const mode of ['strictConformance', 'auditorAssist']) {
      const html = `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body><main><p id="light" style="color:#bbb">Opening hours</p><p id="dark" style="color:#333">Closed today</p><p id="own">Plain text</p></main></body></html>`;
      const dom = createDom(html);
      const r = runa11yCoreOnDom(dom, {
        runOnly: ['contrast-minimum'],
        engineOptions: { contrast: { mode }, visibilityMode: 'styleOnly' }
      }).checksResults[0];
      assert.strictEqual(dom.window.document.querySelectorAll('div').length, 0);
      assert.strictEqual(r.outcome, 'fail', `${head} ${mode}`);
      assert.deepStrictEqual(
        r.occurrences.map((o) => [
          /id="(\w+)"/.exec(o.html)[1],
          o.data.details.colors.backgroundHex,
          Number(o.data.details.metrics.ratio.toFixed(2)),
          o.data.details.assumptionsApplied,
          o.data.details.colorScheme
        ]),
        [['dark', '#121212', 1.48, null, undefined]],
        `${head} ${mode}`
      );
    }
  }
  // A page that declares no scheme, or only light, is drawn on white.
  for (const head of ['', '<meta name="color-scheme" content="only light">']) {
    const r = runa11yCoreOnDom(
      createDom(
        `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body><main><p id="light" style="color:#bbb">Opening hours</p></main></body></html>`
      ),
      { runOnly: ['contrast-minimum'], engineOptions: { visibilityMode: 'styleOnly' } }
    ).checksResults[0];
    assert.strictEqual(r.occurrences[0].data.details.colors.backgroundHex, '#ffffff', head);
  }
});

// A canvas the scan names stands for the page's, in every scheme: one
// measurement, recorded as the assumption it is.
test('contrast-minimum: a canvas the scan names is measured in place of the page canvas', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title><meta name="color-scheme" content="light dark"></head><body><main><p id="light" style="color:#bbb">Opening hours</p></main></body></html>';
  const r = runa11yCoreOnDom(createDom(html), {
    runOnly: ['contrast-minimum'],
    engineOptions: { contrast: { rootCanvasFallback: '#000000' }, visibilityMode: 'styleOnly' }
  }).checksResults[0];
  assert.strictEqual(r.outcome, 'pass');
  const black = runa11yCoreOnDom(createDom(html.replace('#bbb', '#333')), {
    runOnly: ['contrast-minimum'],
    engineOptions: { contrast: { rootCanvasFallback: '#000000' }, visibilityMode: 'styleOnly' }
  }).checksResults[0];
  assert.strictEqual(black.outcome, 'fail');
  const det = black.occurrences[0].data.details;
  assert.strictEqual(det.colors.backgroundHex, '#000000');
  assert.deepStrictEqual(det.assumptionsApplied, ['ROOT_CANVAS_FALLBACK']);
  assert.strictEqual(det.assumedRootCanvasColor, '#000000');
  assert.strictEqual(det.colorScheme, undefined);
  assert.strictEqual(det.colorSchemesChecked, undefined);
});

test(`${RULE_ID}: a lone character standing in for its control's name is asked about, not failed (ACT afw4f7 Passed Example 7)`, () => {
  const html = `
<!doctype html>
<html><head><style>
  html, body { background: #fff; }
</style></head>
<body>
  <button id="a" style="color: #666; background-color: #000" aria-label="Close">X</button>
</body></html>`;

  const result = run(html);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.data.details.reasonCode, 'SYMBOLIC_CHARACTER_BELOW_THRESHOLD');
  assert.strictEqual(occ.uncertainty.code, 'judgement-required');
});

test(`${RULE_ID}: a character the control's name contains, or one with no author name, still fails`, () => {
  const html = `
<!doctype html>
<html><head><style>
  html, body { background: #fff; }
</style></head>
<body>
  <button style="color: #666; background-color: #000" aria-label="Option A">A</button>
  <button style="color: #666; background-color: #000">X</button>
</body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
});

// Every color reaches about 4.58:1 against white or black, above the AA
// ratios, so the color alone never rules them out: text on a background
// that can't be worked out stays contrast-computable's to ask about.
test(`${RULE_ID}: no color rules out the AA ratio, so text on an unknown background is not failed`, () => {
  const html = `<!doctype html><html><body style="background:#fff">
    <div style="background-image:linear-gradient(90deg, #fff, #000)">
      <p style="color:#777777">Gray text on a gradient</p>
    </div>
  </body></html>`;
  const rule = run(html).checksResults.find((r) => r.ruleId === RULE_ID);
  assert.strictEqual(rule.outcome, 'notApplicable');
});

// contrast-computable doesn't ask about text drawn by a shadow whose best
// colour is below WCAG's AA ratio, since this rule fails it. A variant
// whose ratio that colour reaches can't decide it either, so it asks.

const ratioVariant = (config) =>
  definePack({
    name: 'ratios',
    version: '1.0.0',
    namespace: 'ratios',
    core: '*',
    rules: [
      {
        id: 'ratios-contrast',
        from: 'contrast-minimum',
        config,
        meta: {
          title: 'Contrast',
          tags: ['ratios'],
          i18n: { titleKey: 'ratiosContrast_title', descriptionKey: 'ratiosContrast_description' }
        }
      }
    ]
  });
const shadowPage = (shadow) =>
  '<!doctype html><html lang="en" style="background:#fff"><head><title>t</title></head>' +
  `<body style="background:#fff"><main><h2 style="font-size:32px;color:#fff;text-shadow:1px 1px 0 ${shadow}">Shadowed heading</h2></main></body></html>`;
const shadowScan = (shadow, config) => {
  const result = config
    ? runa11yCoreOnHtml(shadowPage(shadow), {
        runOnly: ['ratios-contrast', 'contrast-computable'],
        engineOptions: { packs: [ratioVariant(config)] }
      })
    : runa11yCoreOnHtml(shadowPage(shadow), { runOnly: [RULE_ID, 'contrast-computable'] });
  const by = Object.fromEntries(result.checksResults.map((c) => [c.ruleId, c]));
  return { rule: by[config ? 'ratios-contrast' : RULE_ID], computable: by['contrast-computable'] };
};

test(`${RULE_ID}: at a variant's lower ratio, shadow-drawn text its best colour reaches is asked about (TEXT_SHADOW)`, () => {
  // #999 on white: 2.85:1, below WCAG's 3:1 for large text, above 2.5:1.
  const { rule, computable } = shadowScan('#999', { largeTextRatio: 2.5 });
  assert.strictEqual(computable.outcome, 'pass');
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 1);
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.occurrenceOutcome, 'cantTell');
  assert.strictEqual(occ.data.details.reasonCode, 'TEXT_SHADOW');
  assert.strictEqual(occ.data.details.drawnBy, 'textShadow');
  assert.strictEqual(occ.data.details.metrics.threshold, 2.5);
  assert.strictEqual(occ.i18n.summaryKey, 'ratiosContrast_cantTell_textShadow');
  assert.strictEqual(occ.i18n.hintKey, 'ratiosContrast_hint_cantTell_outline');
});

test(`${RULE_ID}: at WCAG's ratios, or below a variant's, shadow-drawn text still fails and is asked about by no one`, () => {
  for (const [shadow, config] of [
    ['#999', null],
    ['#999', { largeTextRatio: 3 }],
    ['#ccc', { largeTextRatio: 2.5 }]
  ]) {
    const { rule, computable } = shadowScan(shadow, config);
    assert.strictEqual(computable.outcome, 'pass', shadow);
    assert.strictEqual(rule.outcome, 'fail', shadow);
    assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'BELOW_THRESHOLD');
  }
  // Above WCAG's AA ratio contrast-computable asks, and the variant leaves it.
  const asked = shadowScan('#000', { largeTextRatio: 2.5 });
  assert.strictEqual(asked.computable.outcome, 'cantTell');
  assert.strictEqual(asked.rule.outcome, 'notApplicable');
});

// A page that supports light and dark (#219 follow-up): text on its canvas
// is measured in the scheme the scan sees (light, under jsdom) and in the
// other where its colours can't change with the scheme.
test('contrast-minimum: text on the canvas of a page with two color schemes is measured in each', () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title>
    <style>:root{color-scheme:light dark} #themed{color:#bbb} @media (prefers-color-scheme: dark){#themed{color:#eee}}</style>
    </head><body><main>
    <p id="grey" style="color:#333">Fails on the dark canvas only</p>
    <p id="faint" style="color:#bbb">Fails on white only</p>
    <p id="mid" style="color:#777">Fails on both</p>
    <p id="plain">The scheme's own text colour</p>
    <p id="themed">Coloured by a prefers-color-scheme rule</p>
    </main></body></html>`;
  const rule = assertRule(run(html), RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  const by = (id) => rule.occurrences.find((o) => o.html.includes(`id="${id}"`));
  const row = (id) => {
    const d = by(id).data.details;
    return [
      Number(d.metrics.ratio.toFixed(2)),
      d.colors.backgroundHex,
      d.colorScheme,
      d.colorSchemesChecked,
      by(id).i18n.hintKey
    ];
  };
  assert.deepStrictEqual(row('grey'), [
    1.48,
    '#121212',
    'dark',
    undefined,
    'contrast_hint_colorScheme_dark'
  ]);
  assert.match(by('grey').hint, /dark color scheme/);
  assert.deepStrictEqual(row('faint'), [
    1.92,
    '#ffffff',
    'light',
    undefined,
    'contrast_hint_colorScheme_light'
  ]);
  // Failing in both, it is reported as the page is drawn, naming no scheme.
  assert.deepStrictEqual(row('mid'), [
    4.48,
    '#ffffff',
    undefined,
    undefined,
    'contrastMinimum_hint_fail'
  ]);
  // Measured in light only: the dark rule's colour isn't what jsdom sees.
  assert.deepStrictEqual(row('themed'), [
    1.92,
    '#ffffff',
    undefined,
    ['light'],
    'contrastMinimum_hint_fail'
  ]);
  assert.strictEqual(by('plain'), undefined);

  // Passing in every scheme measured, the pass says which were.
  const pass = assertRule(
    run(
      html
        .replace(/<p id="(grey|faint|mid)"[^]*?<\/p>/g, '')
        .replace('#themed{color:#bbb}', '#themed{color:#111}')
    ),
    RULE_ID,
    'pass',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.deepStrictEqual(pass.occurrences[0].data.details.colorSchemesChecked, ['light']);
  // A page with one scheme names none.
  const one = assertRule(
    run(
      html
        .replace('color-scheme:light dark', 'color-scheme:light')
        .replace(/<p id="(grey|faint|mid)"[^]*?<\/p>/g, '')
        .replace('#themed{color:#bbb}', '#themed{color:#111}')
    ),
    RULE_ID,
    'pass',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.strictEqual(one.occurrences[0].data.details.colorSchemesChecked, undefined);
});

// jsdom computes the -webkit-text-fill-color of light-dark() text as
// transparent; the text was dropped from the scan. It is measured in the
// colour light-dark() gives the scheme the page is drawn in.
test('contrast-minimum: light-dark() text is measured in the scheme the page is drawn in, in jsdom', () => {
  const page = (head, style) =>
    `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body><main><p id="ld" style="${style}">Opening hours</p></main></body></html>`;
  const scan = (html) =>
    runa11yCoreOnDom(createDom(html), {
      runOnly: ['contrast-minimum'],
      engineOptions: { visibilityMode: 'styleOnly' }
    }).checksResults[0];
  const row = (r) =>
    r.occurrences.map((o) => [
      o.data.details.reasonCode,
      o.data.details.colors && o.data.details.colors.foregroundHex,
      o.data.details.colors && o.data.details.colors.backgroundHex,
      o.data.details.colorSchemesChecked
    ]);
  // Light: its first colour, on white.
  assert.deepStrictEqual(row(scan(page('', 'color:light-dark(#bbbbbb, #000000)'))), [
    ['BELOW_THRESHOLD', '#bbbbbb', '#ffffff', undefined]
  ]);
  // Dark only: its second, on the dark canvas.
  assert.deepStrictEqual(
    row(
      scan(page('<meta name="color-scheme" content="dark">', 'color:light-dark(#000000, #333333)'))
    ),
    [['BELOW_THRESHOLD', '#333333', '#121212', undefined]]
  );
  // Light and dark: measured in light, which jsdom draws, and not in dark,
  // where light-dark() picks another colour.
  assert.deepStrictEqual(
    row(
      scan(
        page('<style>:root{color-scheme:light dark}</style>', 'color:light-dark(#bbbbbb, #333333)')
      )
    ),
    [['BELOW_THRESHOLD', '#bbbbbb', '#ffffff', ['light']]]
  );
});

// A page drawn only in dark (#219 follow-up): jsdom computes the light
// scheme's colours, so text the scheme colours read as black wherever it
// was. It takes the dark scheme's CanvasText and LinkText (Chromium's),
// over an opaque background too.
test('contrast-minimum: text the dark scheme colours is measured in its colours, in jsdom', () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title><meta name="color-scheme" content="dark"></head><body><main>
    <div style="background:#000000"><p id="onblack">Plain text on black</p><p id="link">Read <a href="/x">the guide</a> first.</p><p id="sys" style="color:CanvasText">CanvasText on black</p></div>
    <div style="background:#eeeeee"><p id="onwhite">Plain text on light grey</p></div>
    </main></body></html>`;
  const r = runa11yCoreOnDom(createDom(html), {
    runOnly: ['contrast-minimum'],
    engineOptions: { visibilityMode: 'styleOnly' }
  }).checksResults[0];
  assert.strictEqual(r.outcome, 'fail');
  assert.deepStrictEqual(
    r.occurrences.map((o) => [
      /id="(\w+)"/.exec(o.html)[1],
      o.data.details.colors.foregroundHex,
      o.data.details.colors.backgroundHex
    ]),
    [['onwhite', '#ffffff', '#eeeeee']]
  );
  // The same page in light: black text on black is drawn invisibly and
  // left out; the light link colour fails on it.
  const light = runa11yCoreOnDom(createDom(html.replace('content="dark"', 'content="light"')), {
    runOnly: ['contrast-minimum'],
    engineOptions: { visibilityMode: 'styleOnly' }
  }).checksResults[0];
  assert.deepStrictEqual(light.occurrences.map((o) => o.data.details.colors.foregroundHex).sort(), [
    '#0000ee'
  ]);
});
