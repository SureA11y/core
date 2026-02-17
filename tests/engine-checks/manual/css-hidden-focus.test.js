'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-css-hidden-focus';

function hasOccurrenceForId(rule, id) {
    return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no focusable candidates exist`, () => {
    const html = `<!doctype html><html><body><p>Just text</p></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when focusable element is hidden via opacity:0`, () => {
    const html = `<!doctype html><html><body>
      <button id="op0" style="opacity:0">Hidden</button>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'op0'));
    assert.ok(rule.occurrences[0].summary.includes('opacityZero'));
});

test(`${RULE_ID}: cantTell when focusable element is off-screen (absolute left:-9999px)`, () => {
    const html = `<!doctype html><html><body>
      <a id="off" href="#x" style="position:absolute; left:-9999px; top:0">Off</a>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'off'));
    assert.ok(rule.occurrences[0].summary.includes('offscreen'));
});

test(`${RULE_ID}: cantTell when focusable element is clipped (clip rect(0,0,0,0))`, () => {
    const html = `<!doctype html><html><body>
      <button id="clip" style="position:absolute; clip: rect(0,0,0,0);">Clip</button>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'clip'));
    assert.ok(rule.occurrences[0].summary.includes('clipped'));
});

test(`${RULE_ID}: excludes display:none elements (notApplicable when only display:none focusables exist)`, () => {
    const html = `<!doctype html><html><body>
      <button id="dn" style="display:none">DN</button>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
    const html = `<!doctype html><html><body>
      <button id="i18n_en" style="opacity:0">Hidden</button>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

    assert.strictEqual(rule.title, 'Focusable elements must not be visually hidden');
    assert.strictEqual(
        rule.description,
        'Checks that keyboard-focusable elements are not visually hidden by CSS techniques that can leave them in the tab order.'
    );

    const occ = rule.occurrences[0];
    assert.ok(occ.summary.includes('Focusable button is visually hidden'));
    assert.strictEqual(
        occ.hint,
        'Make the element visible when it can receive keyboard focus, or remove it from the tab order until it is visible.'
    );
});

test(`${RULE_ID}: i18n (fr) localized`, () => {
    const html = `<!doctype html><html><body>
      <button id="i18n_fr" style="opacity:0">Hidden</button>
    </body></html>`;

    const result = runa11yCoreOnHtml(html, {
        runOnly: [RULE_ID],
        engineOptions: { locale: 'fr' }
    });

    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

    assert.strictEqual(rule.title, 'Les éléments focalisables ne doivent pas être masqués visuellement');
    assert.strictEqual(
        rule.description,
        'Vérifie que les éléments focalisables au clavier ne sont pas masqués visuellement par des techniques CSS pouvant les laisser dans l’ordre de tabulation.'
    );

    const occ = rule.occurrences[0];
    assert.ok(occ.summary.includes('L’élément focalisable button est masqué visuellement'));
    assert.strictEqual(
        occ.hint,
        'Rendez l’élément visible lorsqu’il peut recevoir le focus clavier, ou retirez-le de l’ordre de tabulation tant qu’il n’est pas visible.'
    );
});

test(`${RULE_ID}: i18n unknown locale falls back to English`, () => {
    const html = `<!doctype html><html><body>
      <button id="i18n_zz" style="opacity:0">Hidden</button>
    </body></html>`;

    const result = runa11yCoreOnHtml(html, {
        runOnly: [RULE_ID],
        engineOptions: { locale: 'zz' }
    });

    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

    assert.strictEqual(rule.title, 'Focusable elements must not be visually hidden');
});
