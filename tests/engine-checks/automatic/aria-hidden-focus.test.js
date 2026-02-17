'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

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
