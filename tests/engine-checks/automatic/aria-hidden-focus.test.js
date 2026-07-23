'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-aria-hidden-focus';

function hasOccurrenceForId(rule, id) {
    return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no aria-hidden="true" elements`, () => {
    const html = `<!doctype html><html><body>
      <div><a href="#x">Link</a></div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-hidden subtree exists but contains no focusable content`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_root" aria-hidden="true">
        <p>Just text</p>
        <span>More text</span>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-hidden element itself is focusable (tabindex=0)`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_focus" aria-hidden="true" tabindex="0">Focusable hidden</div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'ah_focus'));
    assert.strictEqual(rule.occurrences[0].summary, 'aria-hidden div is focusable (1 focusable element(s)).');
});

test(`${RULE_ID}: fail when aria-hidden native control itself is focusable (button)`, () => {
    const html = `<!doctype html><html><body>
      <button id="ah_btn" aria-hidden="true">Hidden button</button>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'ah_btn'));
    assert.strictEqual(rule.occurrences[0].summary, 'aria-hidden button is focusable (1 focusable element(s)).');
});

test(`${RULE_ID}: fail when aria-hidden subtree contains focusable descendant (link)`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_root2" aria-hidden="true">
        <a id="focus_link" href="#x">Focusable link</a>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'ah_root2'));
    assert.strictEqual(rule.occurrences[0].summary, 'aria-hidden div contains 1 focusable element(s).');
});

test(`${RULE_ID}: fail when a slotted focusable element's aria-hidden ancestor only exists across a shadow-DOM slot boundary`, () => {
    // Regression for composedParent's assignedSlot-vs-parentNode ordering
    // bug (found while root-causing the aria-required-parent Spectrum Web
    // Components false positive, 2026-07-22): closestAriaHiddenTrue walks
    // ancestors via composedParent, which previously checked parentNode
    // before assignedSlot — parentNode is always truthy for a normally-
    // connected slotted element, so the assignedSlot branch never fired,
    // silently missing any aria-hidden ancestor that only exists inside the
    // shadow tree a light-DOM element is distributed into. This is a real
    // false NEGATIVE (a genuinely hidden-but-focusable element going
    // unflagged), the opposite direction from the aria-required-parent bug.
    const dom = createDom(`<!doctype html><html><body>
      <div id="host"><button id="a" slot="x">Btn</button></div>
    </body></html>`);
    const host = dom.window.document.getElementById('host');
    host.attachShadow({ mode: 'open' }).innerHTML = `<div id="ah_shadow_root" aria-hidden="true"><slot name="x"></slot></div>`;

    const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], engineOptions: { includeShadowDom: true } });
    // The rule reports against the aria-hidden root (not the offending
    // descendant) — same convention as the "focusable descendant (link)"
    // test above — with the offender summarized in data.details.offenders.
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'ah_shadow_root'));
    assert.strictEqual(rule.occurrences[0].data.details.offenders[0].tag, 'button');
});

test(`${RULE_ID}: pass when the only "focusable" content has an explicit negative tabindex (found on a real site — Wikipedia's sticky header)`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_neg_desc" aria-hidden="true">
        <button tabindex="-1">Not tabbable</button>
        <a href="#x" tabindex="-1">Not tabbable link</a>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the aria-hidden root itself has an explicit negative tabindex`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_neg_self" aria-hidden="true" tabindex="-1">Root has negative tabindex</div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-hidden element is focusable AND contains focusable descendants`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_root_mix" aria-hidden="true" tabindex="0">
        <a id="focus_link2" href="#x">Focusable link</a>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'ah_root_mix'));
    assert.strictEqual(
        rule.occurrences[0].summary,
        'aria-hidden div is focusable and contains 1 focusable descendant(s) (2 focusable element(s) total).'
    );
});

test(`${RULE_ID}: excludes display:none focusable candidates (pass when only display:none focusables exist)`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_root3" aria-hidden="true">
        <a id="hidden_link" href="#x" style="display:none">Hidden link</a>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: excludes visibility:hidden focusable candidates (pass when only visibility:hidden focusables exist)`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_root4" aria-hidden="true">
        <a id="vh_link" href="#x" style="visibility:hidden">Hidden link</a>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: excludes candidates that are opacity:0 AND visibility:hidden together (pass — visibility:hidden wins; found on a real site, Getty's global nav dropdowns)`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_root_op_vh" aria-hidden="true">
        <a id="op_vh_link" href="#x" style="opacity:0;visibility:hidden">Hidden link</a>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: excludes a candidate whose closer ancestor is opacity:0 but a FARTHER ancestor is display:none — the closer, filterable opacity:0 must not mask the farther, unconditional display:none (found on a real site, BuzzFeed's carousel slides)`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_outer_display_none" style="display:none">
        <div id="ah_root_deep" aria-hidden="true">
          <div style="opacity:0">
            <a href="#x">Nested link</a>
          </div>
        </div>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: does NOT exclude opacity:0 focusable candidates (fail when opacity:0 link exists)`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_root5" aria-hidden="true">
        <a id="op_link" href="#x" style="opacity:0">Invisible but focusable link</a>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'ah_root5'));
    assert.strictEqual(rule.occurrences[0].summary, 'aria-hidden div contains 1 focusable element(s).');
});

test(`${RULE_ID}: inert subtree is not focusable => pass when only inert focusables exist`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_root6" aria-hidden="true" inert>
        <a id="inert_link" href="#x">Link</a>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: contenteditable="false" does NOT trigger a fail (explicit non-editing host is not focus-enabling)`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_ce_false" aria-hidden="true">
        <div contenteditable="false">Not editable</div>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: contenteditable (empty attr = true) triggers a fail`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_ce_empty" aria-hidden="true">
        <div contenteditable>Editable</div>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'ah_ce_empty'));
});

test(`${RULE_ID}: iframe under aria-hidden triggers a fail`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_iframe" aria-hidden="true">
        <iframe title="f" src="about:blank"></iframe>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'ah_iframe'));
});

test(`${RULE_ID}: audio[controls] under aria-hidden triggers a fail`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_audio" aria-hidden="true">
        <audio controls src="a.mp3"></audio>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'ah_audio'));
});

test(`${RULE_ID}: audio WITHOUT controls under aria-hidden does not trigger a fail`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_audio_nc" aria-hidden="true">
        <audio src="a.mp3"></audio>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: video[controls] under aria-hidden triggers a fail`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_video" aria-hidden="true">
        <video controls src="v.mp4"></video>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'ah_video'));
});

test(`${RULE_ID}: disabled form control exception (pass even though disabled button matches focusable selector)`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_disabled_btn" aria-hidden="true">
        <button disabled>Disabled</button>
      </div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-hidden-focus-all-scenarios.html)`, () => {
    const fixturePath = path.join(__dirname, '../..', 'fixtures', 'aria-hidden-focus-all-scenarios.html');
    const html = fs.readFileSync(fixturePath, 'utf8');

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 16, maxOccurrences: 16 });

    const expectedFailIds = [
        'case_link_href',
        'case_button',
        'case_input',
        'case_select',
        'case_textarea',
        'case_summary',
        'case_tabindex',
        'case_contenteditable_true',
        'case_contenteditable_empty',
        'case_iframe',
        'case_audio_controls',
        'case_video_controls',
        'case_area_href',
        'case_opacity_zero',
        'case_self_focusable',
        'case_self_and_descendant'
    ];

    const expectedNoOccIds = [
        'case_non_focusable_content',
        'case_contenteditable_false',
        'case_audio_no_controls',
        'case_video_no_controls',
        'case_inert',
        'case_disabled_button',
        'case_disabled_input',
        'case_display_none',
        'case_visibility_hidden',
        'case_opacity_and_visibility_hidden',
        'case_opacity_close_display_none_far',
        'case_tabindex_negative_descendant',
        'case_tabindex_negative_self'
    ];

    for (const id of expectedFailIds) {
        assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
    }

    for (const id of expectedNoOccIds) {
        assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
    }
});

test(`${RULE_ID}: i18n default is English (title/description/occurrence strings)`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_i18n_en" aria-hidden="true"><a href="#x">Link</a></div>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

    assert.strictEqual(rule.title, 'ARIA hidden elements must not be focusable');
    assert.strictEqual(
        rule.description,
        'Checks that aria-hidden="true" elements are not focusable and do not contain focusable descendants.'
    );

    const occ = rule.occurrences[0];
    assert.strictEqual(occ.summary, 'aria-hidden div contains 1 focusable element(s).');
    assert.strictEqual(
        occ.hint,
        'Remove focusability from descendants or remove aria-hidden; ensure focus and accessibility trees stay aligned.'
    );
});

test(`${RULE_ID}: i18n (fr) rule title/description/occurrence strings are localized`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_i18n_fr" aria-hidden="true"><a href="#x">Link</a></div>
    </body></html>`;

    const result = runa11yCoreOnHtml(html, {
        runOnly: [RULE_ID],
        engineOptions: { locale: 'fr' }
    });

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

    assert.strictEqual(rule.title, 'Les éléments aria-hidden ne doivent pas être focalisables');
    assert.strictEqual(
        rule.description,
        'Vérifie que les éléments avec aria-hidden="true" ne sont pas focalisables et ne contiennent pas d’éléments focalisables.'
    );

    const occ = rule.occurrences[0];
    assert.strictEqual(occ.summary, 'L’élément aria-hidden div contient 1 élément(s) focalisable(s).');
    assert.strictEqual(
        occ.hint,
        'Supprimez la focalisation des descendants ou retirez aria-hidden ; assurez la cohérence entre l’ordre de focus et l’arbre d’accessibilité.'
    );
});

test(`${RULE_ID}: i18n unknown locale falls back to English`, () => {
    const html = `<!doctype html><html><body>
      <div id="ah_i18n_zz" aria-hidden="true"><a href="#x">Link</a></div>
    </body></html>`;

    const result = runa11yCoreOnHtml(html, {
        runOnly: [RULE_ID],
        engineOptions: { locale: 'zz' }
    });

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

    assert.strictEqual(rule.title, 'ARIA hidden elements must not be focusable');
    assert.strictEqual(
        rule.description,
        'Checks that aria-hidden="true" elements are not focusable and do not contain focusable descendants.'
    );
});
