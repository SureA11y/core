'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const {
    createDom,
    runa11yCoreOnDom
} = require('../../helpers/runa11yCoreOnHtml');

const { assertRule } = require('../../helpers/assertRule');

const RULE_ID = 'contrast-enhanced';

/**
 * JSDOM caveats (carried over from other contrast rule checks):
 * - Geometry APIs often return empty/zero (affects visibility checks if geometry is used).
 * - getComputedStyle may return "" for properties we rely on.
 */
function patchGeometry(dom) {
    const { window } = dom;
    const proto = window.Element && window.Element.prototype;
    if (!proto) return;

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

                    // Typography defaults
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

test(`${RULE_ID}: eligible text exists but none computable => notApplicable (noComputableText)`, () => {
    const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <!-- Computability blocker: background-image -->
  <p style="color: rgb(17, 17, 17); background-image: linear-gradient(#fff, #000); opacity: 1">Hello</p>
</body></html>`;

    const result = run(html);

    const rule = assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 1, maxOccurrences: 1 });
    assert.strictEqual(
        rule.occurrences[0].i18n.summaryKey,
        'contrastEnhanced_notApplicable_noComputableText'
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
  <p style="color: #595959">Hello</p>
</body></html>`;

    const result = run(html, { contrast: { mode: 'strictConformance', rootCanvasFallback: '#ffffff' } });

    const rule = assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 1, maxOccurrences: 1 });
    assert.strictEqual(rule.occurrences[0].i18n.summaryKey, 'contrastEnhanced_notApplicable_noComputableText');
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
  <p style="color: #595959">Hello</p>
</body></html>`;

    const result = run(html, { contrast: { mode: 'auditorAssist', rootCanvasFallback: '#ffffff' } });

    assertRule(result, RULE_ID, 'pass', { minOccurrences: 1 });
});


test(`${RULE_ID}: computable normal text meets 7:1 => pass`, () => {
    const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <!-- Near-black on white is well above 7:1 -->
  <p style="color: rgb(17, 17, 17); background-color: rgb(255, 255, 255); font-size: 16px; font-weight: 400; opacity: 1">
    Hello
  </p>
</body></html>`;

    const result = run(html);

    const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
    assert.strictEqual(rule.occurrences[0].i18n.summaryKey, 'contrastEnhanced_pass_allAboveThreshold');
    assert.ok(Number(rule.occurrences[0].data.details.eligibleTextCount) >= 1);
    assert.ok(Number(rule.occurrences[0].data.details.computableTextCount) >= 1);
});

test(`${RULE_ID}: computable normal text below 7:1 => fail (BELOW_THRESHOLD)`, () => {
    const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <!-- #777 on white is below 7:1 (but often above 4.5:1). -->
  <p id="t" style="color: rgb(119, 119, 119); background-color: rgb(255, 255, 255); font-size: 16px; font-weight: 400; opacity: 1">
    Hello
  </p>
</body></html>`;

    const result = run(html);

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 50 });
    const occ = rule.occurrences[0];

    // Regression guard: failing occurrences must include HTML snippet + selector (via helpers.reportOccurrence)
    assert.ok(typeof occ.html === 'string' && occ.html.length > 0, 'expected occ.html to be populated');
    assert.match(occ.html, /<p\b/i, 'expected snippet to contain the failing <p>');
    assert.match(occ.html, /id\s*=\s*["']t["']/i, 'expected snippet to include the element id');

    assert.ok(typeof occ.selector === 'string' && occ.selector.length > 0, 'expected occ.selector to be populated');
    assert.match(occ.selector, /#t\b/);

    assert.strictEqual(occ.i18n.summaryKey, 'contrastEnhanced_fail_belowThreshold');
    assert.strictEqual(occ.data.details.reasonCode, 'BELOW_THRESHOLD');

    // Threshold for normal text at AAA is 7
    assert.strictEqual(occ.i18n.params.threshold, '7');

    assert.ok(typeof occ.i18n.params.ratio === 'string' && occ.i18n.params.ratio.length > 0);
    assert.ok(typeof occ.i18n.params.foreground === 'string' && occ.i18n.params.foreground.startsWith('rgba('));
    assert.ok(typeof occ.i18n.params.background === 'string' && occ.i18n.params.background.startsWith('rgba('));
});

test(`${RULE_ID}: large text uses 4.5:1 threshold (passes when <7 but >=4.5) => pass`, () => {
    const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <!-- #666 on white is usually <7 but >=4.5 -->
  <p style="color: rgb(102, 102, 102); background-color: rgb(255, 255, 255); font-size: 24px; font-weight: 400; opacity: 1">
    Large text
  </p>
</body></html>`;

    const result = run(html);

    const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
    assert.strictEqual(rule.occurrences[0].i18n.summaryKey, 'contrastEnhanced_pass_allAboveThreshold');
});

test(`${RULE_ID}: large text below 4.5:1 => fail`, () => {
    const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <!-- #888 on white is typically below 4.5 -->
  <p id="lt" style="color: rgb(136, 136, 136); background-color: rgb(255, 255, 255); font-size: 24px; font-weight: 400; opacity: 1">
    Large text
  </p>
</body></html>`;

    const result = run(html);

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 50 });
    const occ = rule.occurrences[0];

    // Regression guard: failing occurrences must include HTML snippet + selector (via helpers.reportOccurrence)
    assert.ok(typeof occ.html === 'string' && occ.html.length > 0, 'expected occ.html to be populated');
    assert.match(occ.html, /<p\b/i, 'expected snippet to contain the failing <p>');
    assert.match(occ.html, /id\s*=\s*["']lt["']/i, 'expected snippet to include the element id');

    assert.ok(typeof occ.selector === 'string' && occ.selector.length > 0, 'expected occ.selector to be populated');
    assert.match(occ.selector, /#lt\b/);

    assert.strictEqual(occ.i18n.summaryKey, 'contrastEnhanced_fail_belowThreshold');
    assert.strictEqual(occ.data.details.reasonCode, 'BELOW_THRESHOLD');

    // Threshold for large text at AAA is 4.5
    assert.strictEqual(occ.i18n.params.threshold, '4.5');
    assert.strictEqual(occ.i18n.params.isLargeText, true);
});

test(`${RULE_ID}: dedup failures per element (multiple text nodes in same element) => 1 occurrence`, () => {
    const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p id="t" style="color: rgb(119, 119, 119); background-color: rgb(255, 255, 255); font-size: 16px; font-weight: 400; opacity: 1">
    Hello<!--split-->World
  </p>
</body></html>`;

    const result = run(html);

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 50 });
    assert.strictEqual(rule.occurrences.length, 1);
    assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'BELOW_THRESHOLD');
});

test(`${RULE_ID}: boundary just above 7:1 (rgb(89,89,89) on white, normal text) => pass`, () => {
    const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p style="color: rgb(89, 89, 89); background-color: rgb(255, 255, 255); font-size: 16px; font-weight: 400; opacity: 1">
    Boundary pass
  </p>
</body></html>`;

    const result = run(html);
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: boundary just below 7:1 (rgb(90,90,90) on white, normal text) => fail`, () => {
    const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p id="bnd" style="color: rgb(90, 90, 90); background-color: rgb(255, 255, 255); font-size: 16px; font-weight: 400; opacity: 1">
    Boundary fail
  </p>
</body></html>`;

    const result = run(html);
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.strictEqual(rule.occurrences[0].i18n.params.threshold, '7');
});

test(`${RULE_ID}: boundary just above 4.5:1 for large text (rgb(118,118,118) @ 24px) => pass`, () => {
    const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p style="color: rgb(118, 118, 118); background-color: rgb(255, 255, 255); font-size: 24px; font-weight: 400; opacity: 1">
    Boundary pass large
  </p>
</body></html>`;

    const result = run(html);
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: boundary just below 4.5:1 for large text (rgb(119,119,119) @ 24px) => fail`, () => {
    const html = `
<!doctype html>
<html style="background-color: rgb(255, 255, 255); opacity: 1">
<head></head>
<body style="background-color: rgb(255, 255, 255); opacity: 1">
  <p id="bndl" style="color: rgb(119, 119, 119); background-color: rgb(255, 255, 255); font-size: 24px; font-weight: 400; opacity: 1">
    Boundary fail large
  </p>
</body></html>`;

    const result = run(html);
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.strictEqual(rule.occurrences[0].i18n.params.threshold, '4.5');
});

test(`${RULE_ID}: ANCESTOR opacity < 1 gates to notApplicable instead of a confidently wrong ratio`, () => {
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
    const rule = assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 1, maxOccurrences: 1 });
    assert.strictEqual(
        rule.occurrences[0].i18n.summaryKey,
        'contrastEnhanced_notApplicable_noComputableText'
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
        'aa_pass_aaa_fail_gray_on_white', // passes AA, fails AAA
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
        'eligible_sr_only_fail',
        'eligible_zero_size_text',
        'eligible_enabled_button_fail'
    ];

    const expectedNoOccIds = [
        'pass_black_on_white',
        'bg_alpha_white_50_black_text',
        'bg_alpha_80_over_gray_black_text',
        'excluded_hidden_attr_fail',
        'excluded_display_none_fail',
        'excluded_visibility_hidden_fail',
        'excluded_visibility_collapse_fail',
        'excluded_details_closed_fail',
        'excluded_template_fail',
        'whitespace_only',
        'blocker_gradient_bg',
        'blocker_image_bg',
        'blocker_mix_blend_mode',
        'blocker_filter',
        'blocker_backdrop_filter',
        'blocker_ancestor_opacity',
        'excluded_disabled_button_fail', // inactive UI component (WCAG 1.4.3/1.4.6 Incidental exception)
        'excluded_disabled_button_nested_fail',
        'excluded_disabled_fieldset_fail',
        'excluded_aria_disabled_fail'
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

// Optional determinism smoke check
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