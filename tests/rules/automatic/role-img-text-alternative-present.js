'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-role-img-text-alternative-present';

function hasOccurrenceForId(rule, id) {
    return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

function getOccById(rule, id) {
    return (rule.occurrences || []).find((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)) || null;
}

function getReasonCode(rule, id) {
    const occ = getOccById(rule, id);
    return occ && occ.data && occ.data.details ? occ.data.details.reasonCode : null;
}

test(`${RULE_ID}: notApplicable when no [role="img"]`, () => {
    const html = `<!doctype html><html><body><p>No role img</p></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: case-insensitive role selector ([role="img" i]) works`, () => {
    const html = `<!doctype html><html><body>
    <div id="ok" role="IMG" aria-label="Logo"></div>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when role="img" has no aria-label/aria-labelledby (even if text content exists)`, () => {
    const html = `<!doctype html><html><body>
    <div id="no_mech" role="img">notifications</div>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'no_mech'));
    assert.strictEqual(getReasonCode(rule, 'no_mech'), 'missingTextAlternative');
});

test(`${RULE_ID}: fail when role="img" relies on title only (rule requires aria-label/labelledby)`, () => {
    const html = `<!doctype html><html><body>
    <div id="title_only" role="img" title="Logo"></div>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'title_only'));
    assert.strictEqual(getReasonCode(rule, 'title_only'), 'missingTextAlternative');
});

test(`${RULE_ID}: pass when aria-label is non-empty`, () => {
    const html = `<!doctype html><html><body>
    <span id="ok1" role="img" aria-label="Important notifications"></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-label is empty string`, () => {
    const html = `<!doctype html><html><body>
    <span id="empty_label" role="img" aria-label=""></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'empty_label'));
    assert.strictEqual(getReasonCode(rule, 'empty_label'), 'emptyAriaLabel');
});

test(`${RULE_ID}: fail when aria-label is whitespace-only`, () => {
    const html = `<!doctype html><html><body>
    <span id="ws_label" role="img" aria-label="   \n\t  "></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'ws_label'));
    assert.strictEqual(getReasonCode(rule, 'ws_label'), 'emptyAriaLabel');
});

test(`${RULE_ID}: pass when aria-labelledby points to element with non-empty text`, () => {
    const html = `<!doctype html><html><body>
    <span id="lbl" >Notification icon</span>
    <span id="ok2" role="img" aria-labelledby="lbl"></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-labelledby has multiple ids and at least one contributes non-empty text`, () => {
    const html = `<!doctype html><html><body>
    <span id="a"></span>
    <span id="b">Bell icon</span>
    <span id="ok3" role="img" aria-labelledby="a b"></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-labelledby attribute is present but empty`, () => {
    const html = `<!doctype html><html><body>
    <span id="empty_lb" role="img" aria-labelledby=""></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'empty_lb'));
    assert.strictEqual(getReasonCode(rule, 'empty_lb'), 'emptyAriaLabelledby');
});

test(`${RULE_ID}: fail with reasonCode=nameNotResolved when aria-labelledby points to missing id`, () => {
    const html = `<!doctype html><html><body>
    <span id="missing_ref" role="img" aria-labelledby="doesNotExist"></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'missing_ref'));
    assert.strictEqual(getReasonCode(rule, 'missing_ref'), 'nameNotResolved');
});

test(`${RULE_ID}: fail with reasonCode=nameNotResolved when aria-labelledby points to existing but empty text`, () => {
    const html = `<!doctype html><html><body>
    <span id="emptyText"></span>
    <span id="empty_ref_text" role="img" aria-labelledby="emptyText"></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'empty_ref_text'));
    assert.strictEqual(getReasonCode(rule, 'empty_ref_text'), 'nameNotResolved');
});

test(`${RULE_ID}: if both aria-label and aria-labelledby exist, aria-label alone should still pass this rule`, () => {
    // Your rule’s "expected mechanism" is OR. Helper name resolution uses proper ARIA precedence,
    // but as long as helper resolves a non-empty name, this should pass.
    const html = `<!doctype html><html><body>
    <span id="lbl2">Labelledby text</span>
    <span id="ok4" role="img" aria-label="Aria label text" aria-labelledby="lbl2"></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

/* ---------------- Eligibility / acc-tree edge cases ---------------- */

test(`${RULE_ID}: notApplicable when only aria-hidden=true role=img exists (not focusable)`, () => {
    const html = `<!doctype html><html><body>
    <span id="ah" role="img" aria-hidden="true"></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-hidden=true but tabindex=0 stays applicable and fails if no label mechanism`, () => {
    const html = `<!doctype html><html><body>
    <span id="ah_focus" role="img" aria-hidden="true" tabindex="0"></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'ah_focus'));
    assert.strictEqual(getReasonCode(rule, 'ah_focus'), 'missingTextAlternative');
});

test(`${RULE_ID}: aria-hidden=true with tabindex=-1 is ineligible => notApplicable when only that exists`, () => {
    const html = `<!doctype html><html><body>
    <span id="ah_prog" role="img" aria-hidden="true" tabindex="-1"></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: inert subtree makes node ineligible => notApplicable when only inert role=img exists`, () => {
    const html = `<!doctype html><html><body>
    <div inert>
      <span id="inert_img" role="img"></span>
    </div>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: hidden attribute makes node ineligible => notApplicable when only hidden role=img exists`, () => {
    const html = `<!doctype html><html><body>
    <span id="hidden_attr" role="img" hidden></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: display:none makes node ineligible => notApplicable when only display:none role=img exists`, () => {
    const html = `<!doctype html><html><body>
    <span id="disp_none" role="img" style="display:none"></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: visibility:hidden makes node ineligible => notApplicable when only visibility:hidden role=img exists`, () => {
    const html = `<!doctype html><html><body>
    <span id="vis_hidden" role="img" style="visibility:hidden"></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

/* ---------------- Your exact example ---------------- */

test(`${RULE_ID}: Angular mat-icon example fails (role=img, aria-hidden=false, no aria-label/labelledby)`, () => {
    const html = `<!doctype html><html><body>
<mat-icon id="matIcon" role="img" aria-hidden="false" matbadgedescription="Number of important notifications"
  class="mat-icon material-icons"> notifications
  <span id="mat-badge-content-0" aria-hidden="true" class="mat-badge-content">0</span>
</mat-icon>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'matIcon'));
    assert.strictEqual(getReasonCode(rule, 'matIcon'), 'missingTextAlternative');
});

/* ---------------- i18n tests (enable once you add strings to dictionaries) ---------------- */

// If you haven’t added these keys to en/fr dictionaries yet, keep these skipped.
// Once added, flip test.skip -> test and assert exact stable strings.

test.skip(`${RULE_ID}: i18n (en) title/description/occ strings are stable`, () => {
    const html = `<!doctype html><html><body><span id="x" role="img"></span></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { locale: 'en' } });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

    // TODO: replace with exact expected strings once you add them to en.js
    assert.ok(typeof rule.title === 'string' && rule.title.length > 0);
    assert.ok(typeof rule.description === 'string' && rule.description.length > 0);

    const occ = rule.occurrences[0];
    assert.ok(typeof occ.summary === 'string' && occ.summary.length > 0);
    assert.ok(typeof occ.hint === 'string' && occ.hint.length > 0);

    assert.ok(occ.i18n && typeof occ.i18n.summaryKey === 'string');
    assert.ok(occ.i18n && typeof occ.i18n.hintKey === 'string');
});

test.skip(`${RULE_ID}: i18n (fr) falls back/uses fr strings once defined`, () => {
    const html = `<!doctype html><html><body><span id="x" role="img"></span></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { locale: 'fr' } });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

    // TODO: assert exact FR translations once added
    assert.ok(typeof rule.title === 'string' && rule.title.length > 0);
    assert.ok(typeof rule.description === 'string' && rule.description.length > 0);
});

test(`${RULE_ID}: notApplicable when only <img role="img"> exists (excluded by rule)`, () => {
    const html = `<!doctype html><html><body>
    <img id="native_img" role="img" src="x.png">
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass unaffected for non-img role="img" with aria-label`, () => {
    const html = `<!doctype html><html><body>
    <img id="native_img" role="img" src="x.png">
    <span id="icon" role="img" aria-label="Notifications"></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail still occurs for non-img role="img" missing aria-label/labelledby even if <img role=img> is present`, () => {
    const html = `<!doctype html><html><body>
    <img id="native_img" role="img" src="x.png">
    <span id="bad" role="img"></span>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'bad'));
    assert.ok(!hasOccurrenceForId(rule, 'native_img'));
});
