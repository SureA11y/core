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

function run(html, engineOptions = {}, entryPointParity = true) {
  const dom = createDom(html);
  patchGeometry(dom);
  patchComputedStyleDefaults(dom);

  return runa11yCoreOnDom(dom, {
    engineOptions: {
      // Run only the rule under test to keep results stable.
      rules: [RULE_ID],
      ...engineOptions
    },
    entryPointParity
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

test(`${RULE_ID}: text whose color exactly matches its background is not visible => notApplicable, not pass or cantTell`, () => {
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

test(`${RULE_ID}: text matching the page color over an ancestor gradient => cantTell, not invisible`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255)">
<head></head>
<body style="background-color: rgb(255, 255, 255)">
  <div style="background: linear-gradient(rgb(0, 0, 0), rgb(51, 51, 51))">
    <p id="white_on_gradient" style="color: rgb(255, 255, 255)">Hello</p>
  </div>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'BACKGROUND_IMAGE_OR_GRADIENT');
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

test(`${RULE_ID}: backdrop-filter on an OUTER ancestor is occluded by a closer, fully-opaque solid background => pass (computable)`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="backdrop-filter: blur(10px); opacity: 1">
  <div style="background-color: rgb(255, 255, 255); opacity: 1">
    <p id="occluded" style="color: rgb(0, 0, 0); opacity: 1">Sits on a fully opaque white div; the body's backdrop-filter behind it is irrelevant.</p>
  </div>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].i18n.summaryKey, 'contrastComputable_pass_allComputable');
});

test(`${RULE_ID}: backdrop-filter blocker with NO opaque intervening layer still blocks => cantTell (regression guard)`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="backdrop-filter: blur(10px); opacity: 1">
  <p id="not_occluded" style="color: rgb(0, 0, 0); opacity: 1">Sits directly under the body's backdrop-filter, no opaque layer in between.</p>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(
    rule.occurrences[0].data.details.reasonCode,
    'BACKGROUND_FILTER_OR_BACKDROP_FILTER'
  );
  assert.ok(hasOccurrenceForId(rule, 'not_occluded'));
});

test(`${RULE_ID}: an opaque intervening layer does NOT occlude an OUTER ancestor's plain \`filter\` (compositing-group operation, unlike backdrop-filter) => cantTell`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="filter: blur(10px); opacity: 1">
  <div style="background-color: rgb(255, 255, 255); opacity: 1">
    <p id="opaque_then_filter" style="color: rgb(0, 0, 0); opacity: 1">Opaque white div, but wrapped in an ancestor with plain filter.</p>
  </div>
</body></html>`;

  const result = run(html);

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(
    rule.occurrences[0].data.details.reasonCode,
    'BACKGROUND_FILTER_OR_BACKDROP_FILTER'
  );
  assert.strictEqual(rule.occurrences[0].data.details.blockerProperty, 'filter');
  assert.ok(hasOccurrenceForId(rule, 'opaque_then_filter'));
});

test(`${RULE_ID}: an opaque intervening layer does NOT occlude an OUTER ancestor's opacity<1 (compositing-group operation, not paint), but the whole chain still resolves`, () => {
  // An opaque paint layer between el and an outer opacity ancestor does
  // NOT shield against that ancestor's opacity the way it shields against
  // a background-image (opacity is a compositing-group operation on the
  // ancestor's whole subtree, not a paint occlusion) -- but the group
  // still composites onto a flat, fully-resolvable backdrop here, so it's
  // computable regardless, just via the full ancestor chain rather than
  // being shielded early.
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

  const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].i18n.summaryKey, 'contrastComputable_pass_allComputable');
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

test(`${RULE_ID}: text-shadow blocker => cantTell with reasonCode TEXT_SHADOW (ACT afw4f7's own passed example: a shadow may rescue otherwise-low contrast)`, () => {
  // entryPointParity: false -- jsdom's cssstyle has a confirmed bug where
  // reading a computed text-shadow value a SECOND time on the same
  // element (regardless of caller) returns a different, wrong result; the
  // dual-entry-point replay this harness normally does for every test
  // would spuriously fail on that jsdom bug alone, not a real divergence
  // between the two entry points (both run the exact same generated
  // logic -- see docs/DESIGN_CHALLENGES.md). Same category of exception
  // as iframe-focusable-content's own runtime-focus-redirect tests.
  const html = `
<!doctype html>
<html style="background-color: rgb(115, 115, 115); opacity: 1">
<head></head>
<body style="background-color: rgb(115, 115, 115); opacity: 1">
  <p style="color: rgb(0, 0, 0); text-shadow: white 0 0 3px; opacity: 1">Hello</p>
</body></html>`;

  const result = run(html, {}, false);

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.data.details.reasonCode, 'TEXT_SHADOW');
  assert.strictEqual(occ.i18n.summaryKey, 'contrastComputable_cantTell_textShadow');
});

test(`${RULE_ID}: no text-shadow declared at all => still pass (regression guard: jsdom's computed default for text-shadow is a fully-transparent color string, not the literal "none", and must not be mistaken for a real shadow)`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p style="color: rgb(17, 17, 17); opacity: 1">Hello</p>
</body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: an explicit text-shadow: none => still pass, not treated as a blocker`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p style="color: rgb(17, 17, 17); text-shadow: none; opacity: 1">Hello</p>
</body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
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

test(`${RULE_ID}: strictConformance + root not opaque => pass, measured on the page's canvas`, () => {
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

  const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
  // The page's canvas, which its color scheme gives it, is no assumption;
  // the white the scan names is.
  assert.deepStrictEqual(rule.occurrences[0].data.details.assumptionsApplied, [
    'ROOT_CANVAS_FALLBACK'
  ]);
  const own = assertRule(run(html), RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
  assert.deepStrictEqual(own.occurrences[0].data.details.assumptionsApplied, []);
});

test(`${RULE_ID}: the text's color in the page's dark scheme unknown => COLOR_SCHEME_NOT_RENDERED`, () => {
  // jsdom applies no prefers-color-scheme rule; the page is drawn only in
  // dark, where the rule makes the text white.
  const html = `<!doctype html><html><head><meta name="color-scheme" content="dark">
    <style>#pick { color: #000000 } @media (prefers-color-scheme: dark) { #pick { color: #ffffff } }</style>
    </head><body>
    <p id="pick">Picked by the scheme</p>
    <p id="own" style="color:#bbbbbb">Its own color</p>
  </body></html>`;
  const rule = assertRule(run(html), RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.ok(occ.html.includes('id="pick"'));
  assert.strictEqual(occ.data.details.reasonCode, 'COLOR_SCHEME_NOT_RENDERED');
  assert.strictEqual(occ.data.details.blockerValue, 'dark');
  assert.strictEqual(occ.i18n.summaryKey, 'contrastComputable_cantTell_colorScheme');
  // No lean: the color it would lean by is the one that can't be read.
  assert.strictEqual(occ.lean, undefined);
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

test(`${RULE_ID}: ANCESTOR opacity < 1 over a flat resolvable backdrop is computable (pass)`, () => {
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

  // The subtree's own content (text over its own background) resolves to
  // full opacity before the ancestor's opacity is applied, then that flat
  // result is scaled and blended against the (also flat) root -- no
  // per-pixel rendering needed, so this is computable, not blocked.
  const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.i18n.summaryKey, 'contrastComputable_pass_allComputable');
  assert.ok(Number(occ.data.details.eligibleTextCount) >= 1);
});

test(`${RULE_ID}: ANCESTOR opacity < 1 stays a blocker when a gradient sits further out, beyond the opacity ancestor itself`, () => {
  const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-image: linear-gradient(red, blue);">
  <div style="opacity: 0.5;">
    <p id="anc_op_gradient" style="color: rgb(0, 0, 0);">
      Ancestor opacity, gradient further out
    </p>
  </div>
</body></html>`;

  const result = run(html);

  // The opacity ancestor itself has no background image or gradient, but
  // resolveGroupOpacityColors still walks the whole chain to a fully
  // opaque result -- finding the gradient on <body>, further out, falls
  // back to the existing ANCESTOR_OPACITY blocker rather than asserting a
  // confident ratio it cannot actually compute.
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.data.details.reasonCode, 'ANCESTOR_OPACITY');
  assert.ok(hasOccurrenceForId(rule, 'anc_op_gradient'));
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

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 21, maxOccurrences: 21 });

  const expectedReasonCodeById = {
    blocker_gradient_bg: 'BACKGROUND_IMAGE_OR_GRADIENT',
    blocker_image_bg: 'BACKGROUND_IMAGE_OR_GRADIENT',
    blocker_mix_blend_mode: 'MIX_BLEND_MODE',
    blocker_filter: 'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
    blocker_backdrop_filter: 'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
    // ancestor opacity resolves cleanly on its own (see the "pass" test
    // above), but stays a blocker when something further out -- here a
    // gradient behind the opacity ancestor -- is itself unresolvable.
    blocker_ancestor_opacity_unresolvable: 'ANCESTOR_OPACITY',
    // the same for the text element's own opacity over its own background (#95)
    own_opacity_unresolvable: 'ELEMENT_OPACITY',
    gradient_unread_stop: 'BACKGROUND_IMAGE_OR_GRADIENT',
    layer_repeat_space: 'BACKGROUND_IMAGE_OR_GRADIENT',
    layer_fixed: 'BACKGROUND_IMAGE_OR_GRADIENT',
    // Without a layout nothing shows the text inside the opaque header.
    drop_shadow_opaque: 'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
    drop_shadow_overflow: 'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
    unreachable_any_background: 'BACKGROUND_IMAGE_OR_GRADIENT',
    opacity_lean_fail: 'ANCESTOR_OPACITY',
    select_option_lean_fail: 'SELECT_OPTION_COLOR'
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

  // Layers that are all none, a gradient of one color, and an underline
  // layer are no image: measured, not asked about.
  for (const id of ['background_image_none_layers', 'solid_gradient_bg', 'underline_layer_bg']) {
    assert.ok(
      !(rule.occurrences || []).some(
        (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
      ),
      `id="${id}" is measured`
    );
  }

  // Faded text below the AA ratio before the fading leans fail; black or
  // white text under the same blockers has no lean.
  const byId = (id) =>
    (rule.occurrences || []).find(
      (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
    );
  assert.equal(byId('opacity_lean_fail').lean.toward, 'fail');
  assert.equal(byId('opacity_lean_fail').lean.i18n.whyKey, 'contrastComputable_lean_why_opacity');
  assert.equal(byId('select_option_lean_fail').lean.toward, 'fail');
  for (const id of [
    'blocker_ancestor_opacity_unresolvable',
    'own_opacity_unresolvable',
    'blocker_gradient_bg'
  ]) {
    assert.equal(byId(id).lean, undefined, `id="${id}" has no lean`);
  }

  // The gradient/image blockers, and the ancestor- and own-opacity-plus-
  // gradient cases, are set on the ANCESTOR <section>, so each section's
  // own case-title paragraph is also blocked (6 extra anonymous
  // occurrences), for 15 + 6 = 21 total.
  assert.strictEqual(rule.occurrences.length, 21);
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

// ---- Leans ----

const leanOf = (rule, id) => {
  const occ = rule.occurrences.find(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
  assert.ok(occ, `an occurrence for id="${id}"`);
  return occ.lean;
};

test(`${RULE_ID}: a page with no opaque background is not asked about, in either color scheme`, () => {
  for (const head of ['', '<meta name="color-scheme" content="light dark">']) {
    const html = `<!doctype html><html><head>${head}</head><body>
      <p id="light" style="color:#bbbbbb">Light gray</p>
      <p id="dark" style="color:#000000">Black</p>
    </body></html>`;
    assertRule(run(html), RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
  }
});

test(`${RULE_ID}: an option of its own colors leans by its ratio in the open list`, () => {
  const html = `<!doctype html><html><body style="background:#fff">
    <select>
      <option>One</option>
      <option id="faint" style="color:#bbbbbb; background:#ffffff">Two</option>
      <option id="strong" style="color:#000000; background:#ffffff">Three</option>
      <option id="mid" style="color:#767676; background:#ffffff">Four</option>
    </select>
  </body></html>`;
  const rule = assertRule(run(html), RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  const faint = leanOf(rule, 'faint');
  assert.strictEqual(faint.toward, 'fail');
  assert.strictEqual(faint.i18n.whyKey, 'contrastComputable_lean_why_selectOption_fail');
  assert.strictEqual(faint.i18n.cautionKey, 'contrastComputable_lean_caution_selectOption');
  assert.strictEqual(leanOf(rule, 'strong').toward, 'pass');
  assert.strictEqual(
    leanOf(rule, 'strong').i18n.whyKey,
    'contrastComputable_lean_why_selectOption_pass'
  );
  assert.strictEqual(leanOf(rule, 'mid'), undefined);
});

test(`${RULE_ID}: own opacity over a background image leans fail only where the unfaded colors already fail`, () => {
  const html = `<!doctype html><html><body style="background:#fff">
    <div style="background-image:linear-gradient(red, blue)">
      <p id="faint" style="color:#bbbbbb; background-color:#ffffff; opacity:0.6">Faint badge</p>
      <p id="strong" style="color:#000000; background-color:#ffffff; opacity:0.6">Strong badge</p>
    </div>
  </body></html>`;
  const rule = run(html).checksResults.find((r) => r.ruleId === RULE_ID);
  const faint = rule.occurrences.find((o) => o.html.includes('id="faint"'));
  assert.strictEqual(faint.data.details.reasonCode, 'ELEMENT_OPACITY');
  assert.strictEqual(faint.lean.toward, 'fail');
  assert.strictEqual(faint.lean.i18n.whyKey, 'contrastComputable_lean_why_opacity');
  const strong = rule.occurrences.find((o) => o.html.includes('id="strong"'));
  assert.strictEqual(strong.data.details.reasonCode, 'ELEMENT_OPACITY');
  assert.strictEqual(strong.lean, undefined);
});

// Text whose colors in the page's scheme jsdom can't read is asked about,
// over an opaque background too: a prefers-color-scheme rule jsdom doesn't
// apply, or, on a page drawn in dark, a control the browser paints in its
// own colors.
test(`${RULE_ID}: colors an emulator can't read in the page's scheme are asked about (COLOR_SCHEME_NOT_RENDERED)`, () => {
  const light = `<!doctype html><html><head><style>
    #ruled { color: #000000 }
    @media (prefers-color-scheme: light) { #ruled { color: #999999 } }
    @media (prefers-color-scheme: dark) and (min-width: 1px) { #darkonly { color: #ffffff } }
    </style></head><body style="background:#ffffff">
    <p id="ruled">A light rule jsdom doesn't apply</p>
    <p id="darkonly">A dark rule, which doesn't apply in light</p>
  </body></html>`;
  const rule = assertRule(run(light), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.match(rule.occurrences[0].html, /id="ruled"/);
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'COLOR_SCHEME_NOT_RENDERED');
  assert.strictEqual(rule.occurrences[0].data.details.blockerValue, 'light');

  const dark = `<!doctype html><html><head><meta name="color-scheme" content="dark"></head><body style="background:#222222">
    <p id="plain">The scheme's own color</p>
    <button id="btn">The browser's button colors</button>
  </body></html>`;
  const darkRule = assertRule(run(dark), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.match(darkRule.occurrences[0].html, /id="btn"/);
  assert.strictEqual(darkRule.occurrences[0].data.details.blockerValue, 'dark');
  // The same page in light is measured as jsdom computes it.
  assertRule(run(dark.replace('content="dark"', 'content="light"')), RULE_ID, 'pass', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
});
