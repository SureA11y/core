'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const {
  createDom,
  runa11yCoreOnDom,
  runa11yCoreOnHtml
} = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'css-hidden-focus';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
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

test(`${RULE_ID}: cantTell via off-screen text-indent technique`, () => {
  const html = `<!doctype html><html><body>
      <a id="ti" href="#x" style="text-indent:-9999px; display:block; overflow:hidden;">Off via text-indent</a>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ti'));
  assert.ok(rule.occurrences[0].summary.includes('offscreen'));
});

test(`${RULE_ID}: cantTell when multiple visibility hints apply (opacity:0 + offscreen)`, () => {
  const html = `<!doctype html><html><body>
      <a id="multi" href="#x" style="opacity:0; position:absolute; left:-9999px; top:0;">Multi</a>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(
    rule.occurrences[0].data.details.metrics.visibilityHints.join(','),
    'opacityZero,offscreen'
  );
});

test(`${RULE_ID}: redirecting hidden focus target remains cantTell and reports runtime redirect details`, () => {
  const dom = createDom(`<!doctype html><html><body>
      <button id="sentinel" style="opacity:0">Sentinel</button>
      <button id="target">Target</button>
    </body></html>`);
  dom.window.document.getElementById('sentinel').addEventListener('focus', () => {
    dom.window.setTimeout(() => {
      dom.window.document.getElementById('target').focus();
    }, 0);
  });
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  const occ = rule.occurrences.find(
    (o) => typeof o.html === 'string' && o.html.includes('id="sentinel"')
  );
  assert.ok(occ, 'expected occurrence for sentinel');
  assert.strictEqual(occ.data.details.reasonCode, 'cssHiddenTabbable_runtimeRedirect_needsReview');
  assert.strictEqual(occ.data.details.runtimeProbe.redirected, true);
});

test(`${RULE_ID}: excludes candidates that are opacity:0 AND visibility:hidden together (notApplicable — visibility:hidden wins; found on a real site, Getty's global nav dropdowns)`, () => {
  const html = `<!doctype html><html><body>
      <button id="op_vh" style="opacity:0;visibility:hidden">OpVH</button>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fully visible tabbable button is not flagged`, () => {
  const html = `<!doctype html><html><body>
      <button id="visible">Visible</button>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: tabindex="-1" (focusable but not tabbable) is not flagged even when hidden`, () => {
  const html = `<!doctype html><html><body>
      <div id="progfocus" tabindex="-1" style="opacity:0">Programmatic focus only</div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/css-hidden-focus-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'css-hidden-focus-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 9, maxOccurrences: 9 });

  const expectedHintsById = {
    case_opacity_zero: ['opacityZero'],
    case_offscreen: ['offscreen'],
    case_text_indent_offscreen: ['offscreen'],
    case_clipped: ['clipped'],
    case_zero_size_overflow_hidden: ['zeroSizeOverflowHidden'],
    case_multi_hint: ['opacityZero', 'offscreen'],
    case_input_offscreen: ['offscreen'],
    case_select_opacity_zero: ['opacityZero'],
    case_textarea_clipped: ['clipped']
  };

  for (const [id, hints] of Object.entries(expectedHintsById)) {
    const occ = rule.occurrences.find(
      (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
    );
    assert.ok(occ, `Expected occurrence for id="${id}"`);
    assert.deepStrictEqual(
      occ.data.details.metrics.visibilityHints,
      hints,
      `Expected hints for id="${id}"`
    );
  }

  const expectedNoOccIds = [
    'case_visible_button',
    'case_display_none',
    'case_visibility_hidden',
    'case_opacity_and_visibility_hidden',
    'case_hidden_attr',
    'case_tabindex_neg1'
  ];

  for (const id of expectedNoOccIds) {
    assert.ok(
      !rule.occurrences.some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)),
      `Did not expect occurrence for id="${id}"`
    );
  }
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

  assert.strictEqual(
    rule.title,
    'Les éléments focalisables ne doivent pas être masqués visuellement'
  );
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
