'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'media-transcript-adjacent';
const WCAG_RULE = 'media-alternative-transcript-evidence';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };
const WCAG_ROLLUP = 'wcag-1.2.1-audio-only-video-only-prerecorded';

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);
const check = (result, id) => result.checksResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: a link to a transcript right after the audio passes`, () => {
  const html = page('<audio controls src="a.mp3"></audio><a href="/t">Transcription</a>');
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: a button before, or a transcript block after, passes`, () => {
  for (const body of [
    '<button type="button">Show transcript</button><video controls></video>',
    '<input type="button" value="Transcript"><video controls></video>',
    '<span role="button" tabindex="0">Transcript</span><video controls></video>',
    '<video controls></video><details><summary>Transcript</summary><p>Hello.</p></details>',
    '<video controls></video>\n  <!-- note -->\n  <script>1</script>\n  <p><a href="/t">Voir la transcription</a></p>',
    '<video controls></video><a href="/t">文字起こし</a>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: media with no adjacent transcript is asked about`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<video controls src="v.mp4"></video>'), RUN),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details, { reasonCode: 'noAdjacentTranscript', element: 'video' });
  assert.equal(occ.i18n.summaryKey, 'mediaTranscriptAdjacent_summary_cantTell');
  assert.deepEqual(occ.i18n.params, { element: 'video' });
  assert.equal(
    occ.summary,
    'No transcript, or link or button to one, is right before or after this <video>.'
  );
});

test(`${RULE_ID}: a transcript referenced by aria-describedby but not adjacent is asked about`, () => {
  const html = page(
    '<video controls aria-describedby="tr"></video><p>Intro</p><footer><div id="tr">Transcription : bonjour</div></footer>'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'describedTranscriptNotAdjacent');
  assert.equal(
    rule.occurrences[0].i18n.summaryKey,
    'mediaTranscriptAdjacent_summary_cantTell_described'
  );
});

test(`${RULE_ID}: text in between, a hidden neighbour or a neighbour without the word breaks adjacency`, () => {
  for (const body of [
    '<audio controls></audio><p>25 minutes.</p><a href="/t">Transcript</a>',
    '<audio controls></audio> Listen now <a href="/t">Transcript</a>',
    '<video controls></video><a href="/t" style="display:none">Transcript</a>',
    '<video controls></video><a href="/t">Read more</a>',
    '<div><video controls></video></div><a href="/t">Transcript</a>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
  }
});

test(`${RULE_ID}: an audio without controls is still checked; author-hidden media is not`, () => {
  assertRule(
    runa11yCoreOnHtml(page('<audio autoplay loop src="m.mp3"></audio>'), RUN),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1 }
  );
  for (const body of [
    '<div style="display:none"><video controls></video></div>',
    '<audio hidden autoplay src="m.mp3"></audio>',
    '<audio aria-hidden="true" autoplay src="m.mp3"></audio>',
    '<p>No media</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: each media element is judged on its own neighbours`, () => {
  const html = page(
    '<section><video id="a" controls></video><a href="/t">Transcript</a></section><section><video id="b" controls></video></section>'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.match(rule.occurrences[0].html, /id="b"/);
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<video controls></video>'), {
      ...RUN,
      engineOptions: { locale: 'fr' }
    }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Aucune transcription textuelle, ni lien ou bouton vers une transcription, ne se trouve juste avant ou juste après cet élément <video>.'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('<video controls></video>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(!check(result, RULE_ID), JSON.stringify(engineOptions));
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 4.1 rollup id run it`, () => {
  const html = page('<video controls></video>');
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-4.1' } } }
  ]) {
    const rule = check(runa11yCoreOnHtml(html, opts), RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'cantTell');
  }
});

// WCAG 1.2.1 accepts a transcript associated from anywhere; RGAA 4.1 accepts
// only an adjacent one.
test(`${RULE_ID}: a distant aria-describedby transcript satisfies WCAG 1.2.1, RGAA 4.1 asks`, () => {
  const html = page(
    '<video controls aria-describedby="tr"></video><p>Intro</p><footer><div id="tr">Transcription : bonjour</div></footer>'
  );
  const result = runa11yCoreOnHtml(html, RGAA);
  assert.equal(check(result, WCAG_RULE).outcome, 'notApplicable');
  assert.equal(rollup(result, WCAG_ROLLUP).outcome, 'notApplicable');
  const rgaa = rollup(result, 'rgaa-4.1.2-4.1');
  assert.equal(rgaa.outcome, 'cantTell');
  assert.deepEqual(rgaa.data.details.checksIds, [RULE_ID]);
});

// The other direction: WCAG cannot verify an external transcript link, while
// RGAA 4.1 asks only for the adjacent link.
test(`${RULE_ID}: an adjacent link to an external transcript passes RGAA 4.1, WCAG 1.2.1 asks`, () => {
  const html = page('<audio controls src="a.mp3"></audio><a href="/t">Transcription</a>');
  const result = runa11yCoreOnHtml(html, RGAA);
  assert.equal(rollup(result, WCAG_ROLLUP).outcome, 'cantTell');
  assert.equal(rollup(result, 'rgaa-4.1.2-4.1').outcome, 'pass');
});

test(`${RULE_ID}: WCAG 1.2.1 and RGAA 4.1 agree on media with no transcript at all`, () => {
  const result = runa11yCoreOnHtml(page('<video controls src="v.mp4"></video>'), RGAA);
  assert.equal(rollup(result, WCAG_ROLLUP).outcome, 'cantTell');
  assert.equal(rollup(result, 'rgaa-4.1.2-4.1').outcome, 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 5, maxOccurrences: 5 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, [
    'mta_case_01',
    'mta_case_02',
    'mta_case_03',
    'mta_case_04',
    'mta_case_05'
  ]);
});
