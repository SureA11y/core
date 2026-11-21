'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'embed-text-alternative-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no <embed>`, () => {
  const html = `<!doctype html><html><body><p>No embeds</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-label provides a name`, () => {
  const html = `<!doctype html><html><body>
    <embed id="ok" src="x.svg" aria-label="Report">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when applicable <embed> has no accessible name`, () => {
  const html = `<!doctype html><html><body>
    <embed id="bad" src="x.svg">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'bad'));
});

test(`${RULE_ID}: notApplicable when only ineligible embeds exist (aria-hidden and not tabbable)`, () => {
  const html = `<!doctype html><html><body>
    <embed id="ah" src="x.svg" aria-hidden="true">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-hidden but tabbable (tabindex=0) is applicable and fails if unnamed`, () => {
  const html = `<!doctype html><html><body>
    <embed id="focus_ah" src="x.svg" aria-hidden="true" tabindex="0">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'focus_ah'));
});

test(`${RULE_ID}: inert subtree is ineligible and does not cause pass (=> notApplicable when only inert embeds)`, () => {
  const html = `<!doctype html><html><body>
    <div inert>
      <embed id="inert_embed" src="x.svg">
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: role=presentation not focusable is excluded and does not cause pass (=> notApplicable when only those)`, () => {
  const html = `<!doctype html><html><body>
    <embed id="pres_nf" src="x.svg" role="presentation">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/embed-text-alternative-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'embed-text-alternative-present-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  // Expected fails for the crafted fixture.
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 6, maxOccurrences: 6 });

  const expectedFailIds = [
    'embed_case_01',
    'embed_case_06',
    'embed_case_08',
    'embed_case_09',
    'embed_case_10',
    'embed_case_15'
  ];

  const expectedNoOccIds = [
    'embed_case_02',
    'embed_case_03',
    'embed_case_04',
    'embed_case_05',
    'embed_case_07',
    'embed_case_11',
    'embed_case_12',
    'embed_case_13',
    'embed_case_14',
    'embed_case_16',
    'embed_case_17',
    'embed_case_18'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }

  // Verify escaped <embed> in summaries
  for (const occ of rule.occurrences) {
    assert.ok(
      typeof occ.summary === 'string' && occ.summary.includes('<embed>'),
      'Expected <embed> in occurrence.summary'
    );
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const html = `<!doctype html><html><body><embed src="x.svg"></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<embed> doit fournir un équivalent textuel');
  assert.strictEqual(
    rule.description,
    'Vérifie que les éléments <embed> fournissent un équivalent textuel via un nom accessible.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Cet élément <embed> n’a pas d’équivalent textuel.');
  assert.strictEqual(
    occ.hint,
    'Nommez-le avec aria-label ou aria-labelledby. Un attribut title fonctionne aussi, mais de façon moins fiable.'
  );
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><embed src="x.svg"></body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<embed> must provide a text alternative');
  assert.strictEqual(
    rule.description,
    'Checks that <embed> elements provide a text alternative via an accessible name.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'This <embed> has no text alternative.');
  assert.strictEqual(
    occ.hint,
    'Name it with aria-label or aria-labelledby. A title attribute also works, but less reliably.'
  );
});

test(`${RULE_ID}: i18n unknown locale falls back to English`, () => {
  const html = `<!doctype html><html><body><embed src="x.svg"></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'zz' }
  });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<embed> must provide a text alternative');
  assert.strictEqual(
    rule.description,
    'Checks that <embed> elements provide a text alternative via an accessible name.'
  );
});

test(`${RULE_ID}: the role attribute is a fallback list: role="foo presentation" is excluded when not focusable (#91)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html><body><embed src="x.svg" role="foo presentation"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an upper-case role resolves too: role="NONE" is excluded when not focusable (#91)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html><body><embed src="x.svg" role="NONE"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a fail says an alt on the <embed> is not read`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><embed src="chart.svg" alt="Sales chart 2024" type="image/svg+xml"></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.i18n.hintKey, 'embed_textAltPresent_hint_fail_alt');
  assert.strictEqual(
    occ.hint,
    'Its alt="Sales chart 2024" is not read: an <embed> has no alt attribute. Move the text to aria-label.'
  );
  assert.strictEqual(occ.data.details.nameCause.cause, 'altOnEmbed');
});

// ACT 8fc3b6's applicability, applied to <embed> as to <object>: a resource
// that is not an image, audio or video (a page, a PDF, text), or Flash, which
// no current browser runs, renders no non-text content of its own.
test(`${RULE_ID}: notApplicable for an embedded PDF, HTML page or Flash file, as for the same <object>`, () => {
  for (const embed of [
    '<embed src="doc.pdf" type="application/pdf">',
    '<embed src="page.html" type="text/html">',
    '<embed src="page.html">',
    '<embed src="old.swf">',
    '<embed src="old.swf?v=2" type="application/x-shockwave-flash">'
  ]) {
    const result = runa11yCoreOnHtml(`<!doctype html><html><body>${embed}</body></html>`, {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: still fails an embed whose type names an image or video, or that markup does not classify`, () => {
  for (const embed of [
    '<embed id="e" src="chart.svg" type="image/svg+xml">',
    '<embed id="e" src="clip.mp4">',
    '<embed id="e" src="doc.pdf" type="video/mp4">',
    '<embed id="e" src="/media/stream">'
  ]) {
    const result = runa11yCoreOnHtml(`<!doctype html><html><body>${embed}</body></html>`, {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  }
});
