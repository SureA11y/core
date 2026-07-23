'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-video-poster-text-alternative-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no <video poster>`, () => {
  const html = `<!doctype html><html><body><video></video></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when poster exists and accessible name is provided`, () => {
  const html = `<!doctype html><html><body>
    <video id="v1" poster="p.png" aria-label="Product demo"></video>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when poster exists and only between-tag fallback text is provided (not exposed to AT)`, () => {
  const html = `<!doctype html><html><body>
    <video id="v2" poster="p.png">A short demo video.</video>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  // Between-tag <video> fallback content is only rendered by browsers that
  // don't support <video>; it is not reliably exposed to assistive
  // technologies in practice, so it must not satisfy this check.
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: fail when applicable <video poster> has no accessible name and no fallback text`, () => {
  const html = `<!doctype html><html><body>
    <video id="v3" poster="p.png"></video>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'v3'));
});

test(`${RULE_ID}: notApplicable when only ineligible videos exist (aria-hidden and not tabbable)`, () => {
  const html = `<!doctype html><html><body>
    <video id="ah" poster="p.png" aria-hidden="true"></video>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-hidden but tabbable (tabindex=0) is applicable and fails if unnamed`, () => {
  const html = `<!doctype html><html><body>
    <video id="focus_ah" poster="p.png" aria-hidden="true" tabindex="0"></video>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'focus_ah'));
});

test(`${RULE_ID}: role=presentation not focusable is excluded and does not cause pass (=> notApplicable when only those)`, () => {
  const html = `<!doctype html><html><body>
    <video id="pres_nf" poster="p.png" role="presentation"></video>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: role=presentation but focusable is NOT excluded and fails if unnamed`, () => {
  const html = `<!doctype html><html><body>
    <video id="pres_focus" poster="p.png" role="presentation" tabindex="0"></video>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'pres_focus'));
});

test(`${RULE_ID}: inert subtree is ineligible and does not cause pass (=> notApplicable when only inert videos)`, () => {
  const html = `<!doctype html><html><body>
    <div inert>
      <video id="inert_v" poster="p.png"></video>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/video-poster-text-alternative-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'video-poster-text-alternative-present-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  // video_case_03 now correctly fails: between-tag <video> fallback text is
  // not a valid text-alternative mechanism (not exposed to AT in browsers
  // that support <video>).
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 5, maxOccurrences: 5 });

  const expectedFailIds = [
    'video_case_01',
    'video_case_03',
    'video_case_05',
    'video_case_07',
    'video_case_12'  // IDREF-referenced aria-hidden video is eligible but unnamed
  ];
  const expectedNoOccIds = [
    'video_case_02',
    'video_case_04',
    'video_case_06',
    'video_case_08',
    'video_case_09',
    'video_case_10',  // aria-labelledby provides name
    'video_case_11'   // title attribute provides name
  ];

  for (const id of expectedFailIds) assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  for (const id of expectedNoOccIds) assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);

  for (const occ of rule.occurrences) {
    assert.ok(typeof occ.summary === 'string' && occ.summary.includes('<video>'), 'Expected <video> in occurrence.summary');
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const html = `<!doctype html><html><body><video poster="p.png"></video></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { locale: 'fr' } });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, 'L’image poster de <video> doit avoir une alternative textuelle');
  assert.strictEqual(
    rule.description,
    'Vérifie que les éléments <video> avec une image poster fournissent une alternative textuelle (nom accessible).'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Alternative textuelle manquante pour l’image poster de <video>.');
  assert.strictEqual(
    occ.hint,
    'Fournissez un nom accessible (par ex. aria-label/aria-labelledby) pour l’image poster.'
  );
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><video poster="p.png"></video></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<video> poster must have a text alternative');
  assert.strictEqual(
    rule.description,
    'Checks that <video> elements with a poster image provide a text alternative (accessible name).'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Missing text alternative for <video> poster.');
  assert.strictEqual(
    occ.hint,
    'Provide an accessible name (e.g., aria-label/aria-labelledby) for the poster image.'
  );
});

test(`${RULE_ID}: i18n unknown locale falls back to English`, () => {
  const html = `<!doctype html><html><body><video poster="p.png"></video></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { locale: 'zz' } });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, '<video> poster must have a text alternative');
});
