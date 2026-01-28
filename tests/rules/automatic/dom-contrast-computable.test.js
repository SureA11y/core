'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
    createDom,
    runa11yCoreOnDom
} = require('../../helpers/runa11yCoreOnHtml');

const { assertRule } = require('../../helpers/assertRule');

const RULE_ID = 'a11ycore-contrast-computable';

/**
 * JSDOM caveat:
 * Your helpers.isDomVisibleEligible() uses geometry signals (getClientRects / getBoundingClientRect).
 * In JSDOM these are often empty/zero, which would make otherwise-visible text ineligible and
 * produce flaky notApplicable results.
 *
 * To make tests deterministic, we patch geometry APIs to return non-zero values.
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
    assert.strictEqual(rule.occurrences[0].i18n.summaryKey, 'a11ycore_contrastComputable_pass_allComputable');
    assert.ok(
        Number(rule.occurrences[0].data.details.eligibleTextCount) >= 1,
        'Expected eligibleTextCount >= 1'
    );
});

test(`${RULE_ID}: background-image/gradient blocker => cantTell with reasonCode BACKGROUND_IMAGE_OR_GRADIENT`, () => {
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
    assert.strictEqual(occ.i18n.summaryKey, 'a11ycore_contrastComputable_cantTell_bgImageOrGradient');
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
    assert.strictEqual(occ.i18n.summaryKey, 'a11ycore_contrastComputable_cantTell_mixBlendMode');
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
    assert.strictEqual(occ.i18n.summaryKey, 'a11ycore_contrastComputable_cantTell_filter');
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

    const result = run(html, { profile: 'strictConformance' });

    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
    const occ = rule.occurrences[0];
    assert.strictEqual(occ.data.details.reasonCode, 'BACKGROUND_NOT_OPAQUE_AT_ROOT');
    assert.strictEqual(occ.i18n.summaryKey, 'a11ycore_contrastComputable_cantTell_rootNotOpaque');
});

test(`${RULE_ID}: referenceEngineCompat + root not opaque (JSDOM) => cantTell (documented limitation)`, () => {
    const html = `
<!doctype html>
<html style="background-color: rgba(0, 0, 0, 0); opacity: 1">
<head></head>
<body style="background-color: rgba(0, 0, 0, 0); opacity: 1">
  <p style="color: rgb(17, 17, 17); opacity: 1">Hello</p>
</body></html>`;

    const result = run(html, { profile: 'referenceEngineCompat', rootCanvasFallback: '#ffffff' });

    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 50 });
    const occ = rule.occurrences[0];
    assert.ok(occ && occ.data && occ.data.details && typeof occ.data.details.reasonCode === 'string' && occ.data.details.reasonCode,
        'Expected a reasonCode for cantTell');});

test(`${RULE_ID}: dedup occurrences per element (multiple text nodes in same element) => 1 occurrence`, () => {
    const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p id="t" style="color: rgb(17, 17, 17); background-image: linear-gradient(rgb(255, 255, 255), rgb(0, 0, 0)); opacity: 1">
    Hello<!--split-->World
  </p>
</body></html>`;

    const result = run(html);

    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.strictEqual(rule.occurrences.length, 1);
    assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'BACKGROUND_IMAGE_OR_GRADIENT');
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
