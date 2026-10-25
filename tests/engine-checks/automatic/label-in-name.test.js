'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const {
  runa11yCoreOnHtml,
  createDom,
  runa11yCoreOnDom
} = require('../../helpers/runa11yCoreOnHtml');
const { assertRule } = require('../../helpers/assertRule');

const RULE_ID = 'label-in-name';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

function findRuleResultDeep(root, ruleId) {
  const seen = new Set();

  function visit(node) {
    if (!node || (typeof node !== 'object' && typeof node !== 'function')) return null;
    if (seen.has(node)) return null;
    seen.add(node);

    // Match common shapes
    if (node.ruleId === ruleId || node.id === ruleId) return node;

    // Arrays: visit each item
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = visit(item);
        if (found) return found;
      }
      return null;
    }

    // Objects: visit properties
    for (const key of Object.keys(node)) {
      const found = visit(node[key]);
      if (found) return found;
    }
    return null;
  }

  return visit(root);
}

function getOccurrences(ruleRes) {
  if (!ruleRes) return [];
  if (Array.isArray(ruleRes.occurrences)) return ruleRes.occurrences;
  if (Array.isArray(ruleRes.nodes)) return ruleRes.nodes;

  // Sometimes occurrences are nested
  if (ruleRes.data && Array.isArray(ruleRes.data.occurrences)) return ruleRes.data.occurrences;
  return [];
}

test('label-in-name: no applicable elements => notApplicable', () => {
  const html = `
<!doctype html><html><body>
  <button>Save</button>
  <a href="/x">Link</a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'label-in-name', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('label-in-name: visible label contained in accessible name => pass', () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="Save changes">Save</button>
  <a href="/x" aria-labelledby="l1"><span id="l1">Download</span></a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'label-in-name', 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('label-in-name: visible label not contained in accessible name => fail', () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="Submit form">Save</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'label-in-name', 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  const ruleRes = findRuleResultDeep(result, 'label-in-name');
  assert.ok(ruleRes, 'Expected rule result for label-in-name');

  const occArr = getOccurrences(ruleRes);
  assert.ok(occArr.length > 0, 'Expected at least one occurrence');

  const occ = occArr[0];
  assert.ok(occ.data && occ.data.details);
  assert.strictEqual(occ.data.details.reasonCode, 'VISIBLE_LABEL_NOT_IN_ACCESSIBLE_NAME');
  assert.strictEqual(occ.data.details.labelSource, 'self');
});

test('label-in-name: control not visually rendered => notApplicable (element skipped)', () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="Submit form" style="display:none">Save</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'label-in-name', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('label-in-name: aria-hidden decorative icon glyph does not count as visible label text => notApplicable', () => {
  // Regression for a Material Icons ligature-font false positive: an
  // aria-hidden icon
  // (<mat-icon aria-hidden="true">format_color_fill</mat-icon>) was being
  // treated as "visible label text" that must be included
  // in the aria-label, purely because the previous implementation collected
  // text via raw container.textContent (which ignores aria-hidden and CSS
  // visibility entirely) instead of the intended TreeWalker-based, filtered
  // collection, itself caused by a free-var bug (a bare `NodeFilter`
  // reference that silently threw and fell back to textContent on every
  // call). Both are fixed together; this only has content inside the
  // aria-hidden icon, so nothing counts as a visible label at all.
  const html = `
<!doctype html><html><body>
  <button aria-label="Select a theme"><span aria-hidden="true">format_color_fill</span></button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'label-in-name', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('label-in-name: real visible text alongside an aria-hidden icon is still compared correctly => pass', () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="Save changes"><span class="material-icons" aria-hidden="true">save_alt</span> Save</button>
  <button aria-label="Next page">Next <span aria-hidden="true">→</span></button>
  <button aria-label="Edit item"><i class="icon icon-pencil" aria-hidden="true">pencil</i> Edit</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'label-in-name', 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: words hidden with aria-hidden are still on screen, so part of the visible label (ACT 2ee8b8 Failed Example 16) => fail`, () => {
  const html = `
<!doctype html><html><body>
  <a id="a" aria-label="Download specification" href="#">Download <span aria-hidden="true">gizmo</span> specification</a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: parenthesised text in the visible label is dropped before comparing`, () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="Search by date">Search by date (YYYY-MM-DD)</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: punctuation and emoji on either side do not affect the comparison`, () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="&#128161; Submit &#128161;">&gt;&gt;&gt; ** Submit ** &lt;&lt;&lt;</button>
  <button aria-label="Next">Next&hellip;</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// Accented letters stay whole: NFKD used to split "Déposer" at its combining
// accent into "de" + "poser". Accents are not folded either: only punctuation
// and capitals are excused.
test(`${RULE_ID}: accented words are compared whole, without folding accents`, () => {
  const pass = `<!doctype html><html><body>
    <button aria-label="Déposer une annonce">Déposer</button>
    <button aria-label="Ouvrir la fenêtre">fenêtre</button>
    <button aria-label="De\u0301poser">D\u00e9poser</button>
  </body></html>`;
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(pass, { runOnly: [RULE_ID], engineOptions });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }

  for (const [label, name] of [
    ['Déposer', 'Deposer une annonce'],
    ['poser', 'Déposer une annonce'],
    ['Déposer', 'De poser'],
    ['tre', 'Ouvrir la fenêtre']
  ]) {
    const html = `<!doctype html><html><body><button id="b" aria-label="${name}">${label}</button></body></html>`;
    for (const engineOptions of [{}]) {
      const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
      const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
      assert.ok(hasOccurrenceForId(rule, 'b'), `${label} / ${name}`);
    }
  }
});

test(`${RULE_ID}: a label word that merely prefixes a name word does not satisfy the rule`, () => {
  const html = `
<!doctype html><html><body>
  <a id="italy" href="#" aria-label="Discover Italy">Discover It</a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'italy'));
});

test(`${RULE_ID}: a single-character label is compared as a whole word`, () => {
  const html = `
<!doctype html><html><body>
  <a id="one" href="#" aria-label="1a">1</a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: the label's words must be adjacent in the name, not merely present`, () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="save all files">save files</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: a possible abbreviation is cantTell rather than a failure`, () => {
  const html = `
<!doctype html><html><body>
  <a href="#" aria-label="University Avenue">University Ave.</a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  // One tier: the result's outcome is the occurrence's, and the
  // occurrence carries no tier of its own (OUTPUT_SCHEMA.md).
  assert.ok(!('outcome' in rule.occurrences[0]));
  assert.ok(!('occurrenceOutcome' in rule.occurrences[0]));
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'POSSIBLE_ABBREVIATION');
});

test(`${RULE_ID}: a fail beside a cantTell marks each occurrence's tier in occurrenceOutcome`, () => {
  const html = `
<!doctype html><html><body>
  <a id="abbr" href="#" aria-label="University Avenue">University Ave.</a>
  <a id="wrong" href="#" aria-label="Checkout">Basket</a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const tiers = rule.occurrences.map((o) => [o.data.details.reasonCode, o.occurrenceOutcome]);
  assert.ok(tiers.some(([code, tier]) => code === 'POSSIBLE_ABBREVIATION' && tier === 'cantTell'));
  assert.ok(tiers.some(([code, tier]) => code !== 'POSSIBLE_ABBREVIATION' && tier === 'fail'));
  assert.ok(rule.occurrences.every((o) => !('outcome' in o)));
});

test(`${RULE_ID}: a hyphenation difference is cantTell rather than a failure`, () => {
  const html = `
<!doctype html><html><body>
  <a href="#" aria-label="non-standard">nonstandard</a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'HYPHENATION_DIFFERS');
});

test(`${RULE_ID}: a single symbolic character unrelated to the accessible name is cantTell rather than a failure (ACT 2ee8b8: "X" meaning "close")`, () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="close">X</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'POSSIBLE_SYMBOLIC_CHARACTER');
});

test(`${RULE_ID}: a single character that also appears in the accessible name still fails outright (real word-boundary mismatch, not a symbol)`, () => {
  const html = `
<!doctype html><html><body>
  <a id="one" href="#" aria-label="1a">1</a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(
    rule.occurrences[0].data.details.reasonCode,
    'VISIBLE_LABEL_NOT_IN_ACCESSIBLE_NAME'
  );
});

test(`${RULE_ID}: visible text rendered through a known icon font is cantTell rather than a failure (ACT 2ee8b8: "search" rendered as a magnifying glass by Material Icons)`, () => {
  const html = `
<!doctype html><html><head>
  <style>button { font-family: 'Material Icons'; }</style>
</head><body>
  <button aria-label="Find">search</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'POSSIBLE_ICON_FONT_GLYPH');
});

test(`${RULE_ID}: a real mismatch alongside an uncertain one still fails the rule`, () => {
  const html = `
<!doctype html><html><body>
  <a href="#" aria-label="University Avenue">University Ave.</a>
  <button aria-label="Submit form">Save</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const codes = rule.occurrences.map((o) => o.data.details.reasonCode).sort();
  assert.deepStrictEqual(codes, ['POSSIBLE_ABBREVIATION', 'VISIBLE_LABEL_NOT_IN_ACCESSIBLE_NAME']);
});

// AccName 1.2 skips an aria-labelledby that yields no text and an aria-label
// that is empty once trimmed, so the name comes from the content: the control
// is not named by either attribute and the rule does not apply to it. The
// dangling reference itself is aria-valid-attr-value's to report.
test(`${RULE_ID}: aria-label or aria-labelledby that names nothing leaves the control out of scope`, () => {
  for (const body of [
    '<button aria-labelledby="missing">Save</button>',
    '<a href="#" aria-labelledby="missing">Read the report</a>',
    '<button aria-labelledby="empty">Save</button><span id="empty"></span>',
    '<button aria-label="  ">Save</button>',
    '<button aria-labelledby="missing" title="Close">Save</button>'
  ]) {
    const html = `<!doctype html><html><body>${body}</body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: an aria-labelledby that resolves to text is still compared`, () => {
  const html = `<!doctype html><html><body>
    <button aria-labelledby="missing name">Save</button><span id="name" hidden>Submit form</span>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/label-in-name-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'label-in-name-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 9, maxOccurrences: 9 });

  const expectedFailIds = [
    'lin_case_02',
    'lin_case_04',
    'lin_case_06',
    'lin_case_14',
    'lin_case_15',
    'lin_case_18',
    'lin_case_23',
    'lin_case_26',
    'lin_case_27'
  ];

  const expectedNoOccIds = [
    'lin_case_01',
    'lin_case_03',
    'lin_case_05',
    'lin_case_07',
    'lin_case_08',
    'lin_case_09',
    'lin_case_10',
    'lin_case_11',
    'lin_case_12',
    'lin_case_13',
    'lin_case_16',
    'lin_case_17',
    'lin_case_19',
    'lin_case_20',
    'lin_case_21',
    'lin_case_22',
    'lin_case_24',
    'lin_case_25',
    'lin_case_28'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: the chosen option of a <select> is not its visible label`, () => {
  const html = `<!doctype html><html><body>
    <select id="s" aria-label="Country"><option>Spain</option></select>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: the text typed in a <textarea> is not its visible label`, () => {
  const html = `<!doctype html><html><body>
    <textarea id="t" aria-label="Comments">Great service</textarea>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a <select> whose visible <label> is missing from its aria-label still fails`, () => {
  const html = `<!doctype html><html><body>
    <label for="s">Shipping country</label>
    <select id="s" aria-label="Destination"><option>Spain</option></select>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

// The options of a <select> and the text of a <textarea> are the field's
// value, not label text, also inside the <label> (#114).
for (const [description, markup] of [
  [
    'a <select> in its label',
    '<label>Quantity <select aria-label="Quantity"><option>1</option><option>2</option></select></label>'
  ],
  [
    'a <textarea> in its label',
    '<label>Comments <textarea aria-label="Comments">Hello there</textarea></label>'
  ],
  [
    'a <select> with an <optgroup> in its label',
    '<label>Car <select aria-label="Car"><optgroup label="Swedish"><option>Volvo</option></optgroup></select></label>'
  ],
  [
    'an input whose label also holds a <select>',
    '<label>Size <input aria-label="Size"> <select aria-label="Unit"><option>cm</option><option>in</option></select></label>'
  ]
]) {
  test(`${RULE_ID}: the options or text of a field are not label text: ${description}`, () => {
    const html = `<!doctype html><html><body>${markup}</body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  });
}

test(`${RULE_ID}: a <select> in its label still fails when its name leaves the label out`, () => {
  const html = `<!doctype html><html><body><label>Quantity <select aria-label="Qty"><option>1</option><option>2</option></select></label></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.visibleLabel, 'Quantity');
});

test(`${RULE_ID}: a link listed in its own aria-labelledby keeps its text in the name`, () => {
  // accname 1.2 step 2B: the link's own aria-labelledby is not followed again
  // when the traversal reaches it, so it contributes its content, as in
  // Chrome: "Read more Pricing".
  const html = `<a id="r1" href="/p" aria-labelledby="r1 t1">Read more</a> <span id="t1">Pricing</span>`;
  const res = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(res, RULE_ID, 'pass');
});

test(`${RULE_ID}: the role attribute is a fallback list: role="foo button" is a button (#91)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html><body><div role="foo button" tabindex="0" aria-label="Send now">Cancel</div></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: an upper-case role resolves too: role="BUTTON" is a button (#91)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html><body><div role="BUTTON" tabindex="0" aria-label="Send now">Cancel</div></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

// The visible label is the element's visible inner text (ACT 2ee8b8): inline
// elements add no space, a block or <br> starts a new line, and text nobody
// can see is not part of it (#93).
for (const [markup, want] of [
  ['<button aria-label="Download the report"><b>Down</b>load</button>', 'pass'],
  ['<a href="/d" aria-label="Download the report"><b>Down</b>load</a>', 'pass'],
  ['<button aria-label="Submit form"><span>S</span>ubmit</button>', 'pass'],
  [
    '<button aria-label="Download the report"><span style="display:inline-block">Down</span>load</button>',
    'pass'
  ],
  ['<button aria-label="Download the report"><b>Down</b> load</button>', 'fail'],
  ['<button aria-label="Download the report"><div>Down</div>load</button>', 'fail'],
  ['<button aria-label="Download the report">Down<br>load</button>', 'fail'],
  [
    '<button aria-label="Download the report" style="display:flex"><span>Down</span><span>load</span></button>',
    'fail'
  ]
]) {
  test(`${RULE_ID}: ${want} for ${markup} (#93)`, () => {
    const result = runa11yCoreOnHtml(`<!doctype html><html><body>${markup}</body></html>`, {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, want);
  });
}

for (const [label, style] of [
  [
    'a screen-reader-only class',
    'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0'
  ],
  ['clip-path', 'position:absolute;clip-path:inset(50%)'],
  ['opacity 0', 'opacity:0']
]) {
  test(`${RULE_ID}: text hidden by ${label} is not part of the visible label (#93)`, () => {
    const result = runa11yCoreOnHtml(
      `<!doctype html><html><head><style>.hide{${style}}</style></head><body>
        <button aria-label="Close dialog"><span class="hide">Dismiss</span>Close</button>
      </body></html>`,
      { runOnly: [RULE_ID] }
    );
    assertRule(result, RULE_ID, 'pass');
  });
}

// A soft hyphen or zero-width space renders as nothing inside a word, and
// an apostrophe inside a word is part of its spelling: neither splits the
// word (#153). A different word still fails.
test('label-in-name: invisible characters and apostrophes do not split words', () => {
  const outcome = (label, name) =>
    runa11yCoreOnHtml(
      `<!doctype html><html lang="en"><head><title>t</title></head><body><main><button aria-label="${name}">${label}</button></main></body></html>`,
      { runOnly: ['label-in-name'] }
    ).checksResults.find((r) => r.ruleId === 'label-in-name').outcome;
  assert.strictEqual(outcome('Down&shy;load', 'Download'), 'pass');
  assert.strictEqual(outcome('Down&#8203;load', 'Download'), 'pass');
  assert.strictEqual(outcome('Don’t save', 'Dont save'), 'pass');
  assert.strictEqual(outcome("Don't save", 'Don’t save'), 'pass');
  assert.strictEqual(outcome('Don’t save', 'Do not save'), 'fail');
  assert.strictEqual(outcome('Download', 'Down load'), 'fail');
});

// A button-type <input> shows its value as its label (#155). Without a
// value it shows the browser's own default, which can't be known.
test('label-in-name: a button-type input is labelled by its value', () => {
  const outcome = (input) =>
    runa11yCoreOnHtml(
      `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${input}</main></body></html>`,
      { runOnly: ['label-in-name'] }
    ).checksResults.find((r) => r.ruleId === 'label-in-name');
  const failed = outcome('<input type="submit" value="Go" aria-label="Search site">');
  assert.strictEqual(failed.outcome, 'fail');
  assert.strictEqual(failed.occurrences[0].data.details.labelSource, 'value');
  assert.strictEqual(
    outcome('<input type="submit" value="Search" aria-label="Search site">').outcome,
    'pass'
  );
  assert.strictEqual(
    outcome('<input type="button" value="Reset form" aria-label="Clear">').outcome,
    'fail'
  );
  assert.strictEqual(
    outcome('<input type="submit" aria-label="Search site">').outcome,
    'notApplicable'
  );
});

// A <td> in a grid or treegrid is a gridcell (HTML-AAM), a control whose
// name can come from its content, so it is judged as role="gridcell" is.
test(`${RULE_ID}: a <td> in a grid is a gridcell, judged as role="gridcell" is`, () => {
  for (const role of ['grid', 'treegrid']) {
    const html = `<!doctype html><html><body><table role="${role}" aria-label="g"><tr><td id="c" tabindex="0" aria-label="Remove row">Delete</td></tr></table></body></html>`;
    const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.ok(hasOccurrenceForId(rule, 'c'), role);
  }
});

test(`${RULE_ID}: a <td> in a grid whose name contains its text passes`, () => {
  const html = `<!doctype html><html><body><table role="grid" aria-label="g"><tr><td tabindex="0" aria-label="Delete row 3">Delete</td></tr></table></body></html>`;
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: a <td> in a table is a cell, not a control, and stays out of scope`, () => {
  const html = `<!doctype html><html><body><table><tr><th>A</th></tr><tr><td aria-label="Remove row">Delete</td></tr></table></body></html>`;
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

function leans(body) {
  const result = runa11yCoreOnHtml(`<!doctype html><html><body>${body}</body></html>`, {
    runOnly: [RULE_ID]
  });
  return assertRule(result, RULE_ID, 'cantTell').occurrences.map((o) => [
    o.data.details.reasonCode,
    o.lean ? o.lean.toward : null,
    o.lean ? o.lean.i18n.whyKey : null
  ]);
}

test(`${RULE_ID}: a hyphenation difference leans pass`, () => {
  assert.deepEqual(leans('<button aria-label="Email us">E-mail us</button>'), [
    ['HYPHENATION_DIFFERS', 'pass', 'labelInName_lean_why_hyphenation']
  ]);
});

test(`${RULE_ID}: an abbreviation of three letters or more leans pass; a shorter one has no lean`, () => {
  assert.deepEqual(leans('<a href="#" aria-label="University Avenue">University Ave.</a>'), [
    ['POSSIBLE_ABBREVIATION', 'pass', 'labelInName_lean_why_abbreviation']
  ]);
  assert.deepEqual(leans('<a href="#" aria-label="Main Street">Main St.</a>'), [
    ['POSSIBLE_ABBREVIATION', null, null]
  ]);
});

test(`${RULE_ID}: a lone "X" leans pass, a lone digit leans fail, another letter has no lean`, () => {
  assert.deepEqual(
    leans(
      '<button aria-label="Close">X</button><button aria-label="Next page">2</button><button aria-label="Profile">J</button>'
    ),
    [
      ['POSSIBLE_SYMBOLIC_CHARACTER', 'pass', 'labelInName_lean_why_symbol'],
      ['POSSIBLE_SYMBOLIC_CHARACTER', 'fail', 'labelInName_lean_why_digit'],
      ['POSSIBLE_SYMBOLIC_CHARACTER', null, null]
    ]
  );
});

test(`${RULE_ID}: an icon font ligature leans pass only when the page has loaded the font`, () => {
  const html = `<!doctype html><html><head><style>button { font-family: 'Material Icons'; }</style></head><body><button aria-label="Find">search</button></body></html>`;
  // No font set to read: no lean.
  assert.deepEqual(
    assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell').occurrences[0]
      .lean,
    undefined
  );
  const leanWith = (status) => {
    const dom = createDom(html);
    Object.defineProperty(dom.window.document, 'fonts', {
      configurable: true,
      value: [{ family: '"Material Icons"', status }]
    });
    return assertRule(runa11yCoreOnDom(dom, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell')
      .occurrences[0].lean;
  };
  const lean = leanWith('loaded');
  assert.equal(lean.toward, 'pass');
  assert.equal(lean.i18n.whyKey, 'labelInName_lean_why_iconFont');
  assert.equal(leanWith('error'), undefined);
});
