'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml');
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
  <button aria-label="Save changes"><span aria-hidden="true">icon</span> Save</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'label-in-name', 'pass', { minOccurrences: 0, maxOccurrences: 0 });
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

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 8, maxOccurrences: 8 });

  const expectedFailIds = [
    'lin_case_02',
    'lin_case_04',
    'lin_case_06',
    'lin_case_14',
    'lin_case_15',
    'lin_case_18',
    'lin_case_23',
    'lin_case_26'
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
    'lin_case_25'
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
