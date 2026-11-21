'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'video-poster-text-alternative-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
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

test(`${RULE_ID}: asked about when poster exists and only between-tag fallback text is provided (not exposed to AT)`, () => {
  const html = `<!doctype html><html><body>
    <video id="v2" poster="p.png">A short demo video.</video>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  // Between-tag <video> fallback content is only rendered by browsers that
  // don't support <video>; it is not reliably exposed to assistive
  // technologies in practice, so it must not satisfy this check.
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: asked about, leaning fail, when applicable <video poster> has no accessible name`, () => {
  const html = `<!doctype html><html><body>
    <video id="v3" poster="p.png"></video>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'v3'));
  // A video is time-based media: its text alternative only has to identify
  // it (WCAG 1.1.1), so a poster video with no name is asked about, leaning
  // fail, not failed (round 10, C10-7).
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.data.details.reasonCode, 'TEXT_ALTERNATIVE_MISSING');
  assert.strictEqual(occ.lean.toward, 'fail');
  assert.strictEqual(occ.lean.i18n.whyKey, 'videoPoster_textAltPresent_lean_why_noName');
  assert.strictEqual(occ.uncertainty.code, 'equivalence-unknown');
});

test(`${RULE_ID}: a video without a poster is still not judged`, () => {
  const html = `<!doctype html><html><body><h2>Product tour</h2><video src="tour.mp4" controls></video></body></html>`;
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: notApplicable when only ineligible videos exist (aria-hidden and not tabbable)`, () => {
  const html = `<!doctype html><html><body>
    <video id="ah" poster="p.png" aria-hidden="true"></video>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-hidden but tabbable (tabindex=0) is applicable and asked about if unnamed`, () => {
  const html = `<!doctype html><html><body>
    <video id="focus_ah" poster="p.png" aria-hidden="true" tabindex="0"></video>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'focus_ah'));
});

test(`${RULE_ID}: role=presentation not focusable is excluded and does not cause pass (=> notApplicable when only those)`, () => {
  const html = `<!doctype html><html><body>
    <video id="pres_nf" poster="p.png" role="presentation"></video>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: role=presentation but focusable is NOT excluded and asked about if unnamed`, () => {
  const html = `<!doctype html><html><body>
    <video id="pres_focus" poster="p.png" role="presentation" tabindex="0"></video>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
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
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'video-poster-text-alternative-present-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  // video_case_03 is asked about: between-tag <video> fallback text is not a
  // valid text-alternative mechanism (not exposed to AT in browsers that
  // support <video>).
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 5, maxOccurrences: 5 });

  const expectedAskedIds = [
    'video_case_01',
    'video_case_03',
    'video_case_05',
    'video_case_07',
    'video_case_12' // IDREF-referenced aria-hidden video is eligible but unnamed
  ];
  const expectedNoOccIds = [
    'video_case_02',
    'video_case_04',
    'video_case_06',
    'video_case_08',
    'video_case_09',
    'video_case_10', // aria-labelledby provides name
    'video_case_11' // title attribute provides name
  ];

  for (const id of expectedAskedIds)
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  for (const id of expectedNoOccIds)
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);

  for (const occ of rule.occurrences) {
    assert.ok(
      typeof occ.summary === 'string' && occ.summary.includes('<video>'),
      'Expected <video> in occurrence.summary'
    );
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const html = `<!doctype html><html><body><video poster="p.png"></video></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { locale: 'fr' } });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.strictEqual(rule.title, 'L’image poster de <video> doit avoir un équivalent textuel');
  assert.strictEqual(
    rule.description,
    'Vérifie que les éléments <video> avec une image poster fournissent un équivalent textuel (nom accessible).'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(
    occ.summary,
    'Cette <video> a une image d’affiche mais aucun nom qui l’identifie.'
  );
  assert.strictEqual(
    occ.hint,
    'L’équivalent textuel d’une vidéo n’a qu’à l’identifier. Vérifiez que quelque chose de lié à la vidéo dit ce qu’elle est ; sinon, nommez-la avec aria-label ou aria-labelledby. Un attribut title fonctionne aussi, mais de façon moins fiable.'
  );
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><video poster="p.png"></video></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<video> poster must have a text alternative');
  assert.strictEqual(
    rule.description,
    'Checks that <video> elements with a poster image provide a text alternative (accessible name).'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(
    occ.summary,
    'This <video> has a poster image but no name that identifies it.'
  );
  assert.strictEqual(
    occ.hint,
    "A video's text alternative only has to identify it. Check that something tied to the video says what it is; if nothing does, name it with aria-label or aria-labelledby. A title attribute also works, but less reliably."
  );
});

test(`${RULE_ID}: i18n unknown locale falls back to English`, () => {
  const html = `<!doctype html><html><body><video poster="p.png"></video></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { locale: 'zz' } });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, '<video> poster must have a text alternative');
});

test(`${RULE_ID}: an unnamed video alone in a captioned <figure> is asked about`, () => {
  const html = `<!doctype html><html><body>
    <figure><video poster="p.png"></video><figcaption>Our 2025 product launch</figcaption></figure>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.data.details.reasonCode, 'VIDEO_POSTER_FIGCAPTION_REVIEW');
  assert.strictEqual(occ.data.details.figcaption, 'Our 2025 product launch');
  assert.strictEqual(occ.uncertainty.code, 'equivalence-unknown');
});

test(`${RULE_ID}: a captioned figure with more than the video, or an empty caption, is asked about as any unnamed video`, () => {
  for (const figure of [
    '<figure><video poster="p.png"></video><p>Watch it</p><figcaption>Launch</figcaption></figure>',
    '<figure><video poster="p.png"></video><figcaption> </figcaption></figure>'
  ]) {
    const result = runa11yCoreOnHtml(`<!doctype html><html><body>${figure}</body></html>`, {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  }
});

test(`${RULE_ID}: role presentation is read from a fallback list, in any case (#91)`, () => {
  const html = `<!doctype html><html><body>
    <video poster="p.png" role="foo presentation"></video>
    <video poster="q.png" role="NONE"></video>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: the finding says an alt on the <video> does nothing`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><video poster="p.png" src="v.mp4" alt="Intro video"></video></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.i18n.hintKey, 'videoPoster_textAltPresent_hint_cantTell_alt');
  assert.strictEqual(
    occ.hint,
    'Its alt="Intro video" does nothing: a <video> has no alt attribute. Use aria-label="Intro video" instead.'
  );
});
