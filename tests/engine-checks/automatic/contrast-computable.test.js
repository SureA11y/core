'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { createDom, runa11yCoreOnDom } = require('../../helpers/runa11yCoreOnHtml');

const { assertRule } = require('../../helpers/assertRule');

const RULE_ID = 'contrast-computable';

/**
 * JSDOM caveat:
 * Your helpers.isDomVisibleEligible() uses geometry signals (getClientRects / getBoundingClientRect).
 * In JSDOM these are often empty/zero, which would make otherwise-visible text ineligible and
 * produce flaky notApplicable results.
 *
 * To make checks deterministic, we patch geometry APIs to return non-zero values.
 */
function patchGeometry(dom) {
  const { window } = dom;
  const proto = window.Element && window.Element.prototype;
  if (!proto) return;
  if (proto.__a11ycorePatchedGeometry) return;
  proto.__a11ycorePatchedGeometry = true;

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
  if (window.__a11ycorePatchedComputedStyle) return;
  window.__a11ycorePatchedComputedStyle = true;

  window.getComputedStyle = function patchedGetComputedStyle(el) {
    const cs = orig.call(window, el);

    // Provide deterministic defaults for JSDOM empty-string computed values.
    return new Proxy(cs, {
      get(target, prop) {
        const v = target[prop];

        // JSDOM often returns "" for many properties; normalize key ones.
        if (v == null || v === '') {
          if (prop === 'opacity') return '1';
          if (prop === 'display') return 'block';
          if (prop === 'visibility') return 'visible';
          if (prop === 'contentVisibility') return 'visible';

          // Defaults used by computability blocker checks
          if (prop === 'backgroundImage') return 'none';
          if (prop === 'mixBlendMode') return 'normal';
          if (prop === 'filter') return 'none';
          if (prop === 'backdropFilter') return 'none';
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
      // Run only the rule under test to keep results stable.
      rules: [RULE_ID],
      ...engineOptions
    }
  });
}

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: no visible eligible text => notApplicable`, () => {
  const html = `
<!doctype html>
<html><head><style>
  html, body { background: #fff; }
</style></head>
<body>
  <!-- whitespace only -->
  <div>    </div>
</body></html>`;

  const result = run(html);

  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: solid CSS colors and opaque root => pass`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p style="color: rgb(17, 17, 17); background-color: rgb(255, 255, 255); opacity: 1">Hello</p>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].i18n.summaryKey, 'contrastComputable_pass_allComputable');
  assert.ok(
    Number(rule.occurrences[0].data.details.eligibleTextCount) >= 1,
    'Expected eligibleTextCount >= 1'
  );
});

test(`${RULE_ID}: background gradient blocker => cantTell with reasonCode BACKGROUND_IMAGE_OR_GRADIENT`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p style="color: rgb(17, 17, 17); background-image: linear-gradient(rgb(255, 255, 255), rgb(0, 0, 0)); opacity: 1">Hello</p>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.data.details.reasonCode, 'BACKGROUND_IMAGE_OR_GRADIENT');
  assert.strictEqual(occ.i18n.summaryKey, 'contrastComputable_cantTell_bgGradient');
});

test(`${RULE_ID}: background-image blocker => cantTell with reasonCode BACKGROUND_IMAGE_OR_GRADIENT`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p style="color: rgb(17, 17, 17); background-image: url('jar.src'); opacity: 1">Hello</p>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.data.details.reasonCode, 'BACKGROUND_IMAGE_OR_GRADIENT');
  assert.strictEqual(occ.i18n.summaryKey, 'contrastComputable_cantTell_bgImage');
});

test(`${RULE_ID}: background-image on an OUTER ancestor is occluded by a closer, fully-opaque solid background => pass (computable)`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-image: url('hero.jpg'); background-color: rgb(255, 0, 0); opacity: 1">
  <div style="background-color: rgb(255, 255, 255); opacity: 1">
    <p id="occluded" style="color: rgb(0, 0, 0); opacity: 1">Sits on a fully opaque white div; the body's background-image behind it is irrelevant.</p>
  </div>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].i18n.summaryKey, 'contrastComputable_pass_allComputable');
});

test(`${RULE_ID}: background-image blocker with NO opaque intervening layer still blocks => cantTell (regression guard)`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-image: url('hero.jpg'); background-color: rgb(255, 0, 0); opacity: 1">
  <p id="not_occluded" style="color: rgb(0, 0, 0); opacity: 1">Sits directly on the body's background-image, no opaque layer in between.</p>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'BACKGROUND_IMAGE_OR_GRADIENT');
  assert.ok(hasOccurrenceForId(rule, 'not_occluded'));
});

test(`${RULE_ID}: a SEMI-TRANSPARENT intervening background does NOT occlude an outer background-image => cantTell`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-image: url('hero.jpg'); background-color: rgb(255, 0, 0); opacity: 1">
  <div style="background-color: rgba(255, 255, 255, 0.5); opacity: 1">
    <p id="semi_transparent" style="color: rgb(0, 0, 0); opacity: 1">Sits on a semi-transparent (not fully opaque) div over an image.</p>
  </div>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'BACKGROUND_IMAGE_OR_GRADIENT');
  assert.ok(hasOccurrenceForId(rule, 'semi_transparent'));
});

test(`${RULE_ID}: an opaque intervening layer does NOT occlude an OUTER ancestor's opacity<1 (compositing-group operation, not paint) => cantTell ANCESTOR_OPACITY`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <div style="opacity: 0.5;">
    <div style="background-color: rgb(255, 255, 255); opacity: 1">
      <p id="opaque_then_opacity" style="color: rgb(0, 0, 0); opacity: 1">Opaque white div, but wrapped in an ancestor with opacity 0.5.</p>
    </div>
  </div>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'ANCESTOR_OPACITY');
  assert.ok(hasOccurrenceForId(rule, 'opaque_then_opacity'));
});

test(`${RULE_ID}: an opaque intervening layer does NOT occlude an OUTER ancestor's mix-blend-mode (compositing-group operation, not paint) => cantTell MIX_BLEND_MODE`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <div style="mix-blend-mode: multiply;">
    <div style="background-color: rgb(255, 255, 255); opacity: 1">
      <p id="opaque_then_blend" style="color: rgb(0, 0, 0); opacity: 1">Opaque white div, wrapped in a mix-blend-mode ancestor.</p>
    </div>
  </div>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'MIX_BLEND_MODE');
  assert.ok(hasOccurrenceForId(rule, 'opaque_then_blend'));
});

test(`${RULE_ID}: the element's OWN background-image still blocks even when checked for opaque-occlusion (occlusion only applies to farther-out ancestors)`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p id="own_bg_image" style="color: rgb(0, 0, 0); background-image: url('own.jpg'); opacity: 1">Has its own background-image directly.</p>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'BACKGROUND_IMAGE_OR_GRADIENT');
  assert.ok(hasOccurrenceForId(rule, 'own_bg_image'));
});

test(`${RULE_ID}: mix-blend-mode blocker => cantTell with reasonCode MIX_BLEND_MODE`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <div style="mix-blend-mode: multiply; opacity: 1">
    <span style="color: rgb(17, 17, 17); opacity: 1">Hello</span>
  </div>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.data.details.reasonCode, 'MIX_BLEND_MODE');
  assert.strictEqual(occ.i18n.summaryKey, 'contrastComputable_cantTell_mixBlendMode');
});

test(`${RULE_ID}: filter/backdrop-filter blocker => cantTell with reasonCode BACKGROUND_FILTER_OR_BACKDROP_FILTER`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <div style="filter: blur(1px); opacity: 1">
    <p style="color: rgb(17, 17, 17); opacity: 1">Hello</p>
  </div>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.data.details.reasonCode, 'BACKGROUND_FILTER_OR_BACKDROP_FILTER');
  assert.strictEqual(occ.i18n.summaryKey, 'contrastComputable_cantTell_filter');
});

test(`${RULE_ID}: strictConformance + root not opaque => cantTell with reasonCode BACKGROUND_NOT_OPAQUE_AT_ROOT`, () => {
  const html = `
<!doctype html>
<html><head><style>
  /* Force transparent root */
  html, body { background: transparent; }
</style></head>
<body>
  <p style="color:#111">Hello</p>
</body></html>`;

  const result = run(html, {
    contrast: { mode: 'strictConformance', rootCanvasFallback: '#ffffff' }
  });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.data.details.reasonCode, 'BACKGROUND_NOT_OPAQUE_AT_ROOT');
  assert.strictEqual(occ.i18n.summaryKey, 'contrastComputable_cantTell_rootNotOpaque');
});

test(`${RULE_ID}: auditorAssist + root not opaque => pass (rootCanvasFallback applied)`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgba(0, 0, 0, 0); opacity: 1">
<head></head>
<body style="background-color: rgba(0, 0, 0, 0); opacity: 1">
  <p style="color: rgb(17, 17, 17); opacity: 1">Hello</p>
</body></html>`;

  const result = run(html, { contrast: { mode: 'auditorAssist', rootCanvasFallback: '#ffffff' } });

  const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.i18n.summaryKey, 'contrastComputable_pass_allComputable');
  assert.ok(Number(occ.data.details.eligibleTextCount) >= 1);
});

test(`${RULE_ID}: ANCESTOR opacity < 1 blocker => cantTell with reasonCode ANCESTOR_OPACITY`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <div style="opacity: 0.5; background-color: rgb(255, 255, 255);">
    <p id="anc_op" style="color: rgb(0, 0, 0); background-color: rgb(255, 255, 255); opacity: 1;">
      Ancestor opacity text
    </p>
  </div>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.data.details.reasonCode, 'ANCESTOR_OPACITY');
  assert.strictEqual(occ.i18n.summaryKey, 'contrastComputable_cantTell_notComputable');
  assert.ok(hasOccurrenceForId(rule, 'anc_op'));
});

test(`${RULE_ID}: element's OWN opacity < 1 (no ancestor blocker) => pass (still computable)`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p id="own_op" style="color: rgb(0, 0, 0); background-color: rgb(255, 255, 255); opacity: 0.5;">
    Own opacity text
  </p>
</body></html>`;

  const result = run(html);

  // Own opacity is folded into the foreground via the per-element opacity
  // product; it must NOT be treated as a computability blocker.
  const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].i18n.summaryKey, 'contrastComputable_pass_allComputable');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/contrast-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'contrast-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 8, maxOccurrences: 8 });

  const expectedReasonCodeById = {
    blocker_gradient_bg: 'BACKGROUND_IMAGE_OR_GRADIENT',
    blocker_image_bg: 'BACKGROUND_IMAGE_OR_GRADIENT',
    blocker_mix_blend_mode: 'MIX_BLEND_MODE',
    blocker_filter: 'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
    blocker_backdrop_filter: 'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
    blocker_ancestor_opacity: 'ANCESTOR_OPACITY'
  };

  for (const [id, reasonCode] of Object.entries(expectedReasonCodeById)) {
    const occ = (rule.occurrences || []).find(
      (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
    );
    assert.ok(occ, `Expected occurrence for id="${id}"`);
    assert.strictEqual(
      occ.data.details.reasonCode,
      reasonCode,
      `Expected reasonCode for id="${id}"`
    );
  }

  // The gradient/image blockers are set on the ANCESTOR <section>, so the
  // sibling ".label" paragraph in each of those two sections is also
  // blocked (2 extra anonymous occurrences), for 6 + 2 = 8 total.
  assert.strictEqual(rule.occurrences.length, 8);
});

// Optional: determinism smoke check (run twice, compare results)
/*
test(`${RULE_ID}: determinism (same input => same output)`, () => {
  const html = `
<!doctype html>
<html><head><style>
  html, body { background: #fff; }
</style></head>
<body>
  <p style="color:#111; background-color:#fff">Hello</p>
</body></html>`;

  const r1 = run(html);
  const r2 = run(html);
  assert.deepStrictEqual(r2, r1);
});
*/
