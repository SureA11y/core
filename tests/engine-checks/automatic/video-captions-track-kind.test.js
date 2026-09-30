'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'video-captions-track-kind';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const video = (...tracks) =>
  `<video controls>${tracks.map((t) => `<track src="t.vtt" ${t}>`).join('')}</video>`;

test(`${RULE_ID}: a captions track passes, alone or beside subtitles`, () => {
  for (const html of [
    page(video('kind="captions"')),
    page(video('kind="subtitles" srclang="fr"', 'kind=" Captions "'))
  ]) {
    assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a video with no subtitles or captions track is not applicable`, () => {
  for (const html of [
    page('<video controls></video>'),
    page(video('kind="chapters"', 'kind="descriptions"', 'kind="metadata"')),
    page('<p>No video</p>')
  ]) {
    assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: subtitles only in the page language fail, and a track without kind counts as subtitles`, () => {
  for (const [html, kinds] of [
    [page(video('kind="subtitles" srclang="en"')), ['subtitles']],
    [page(video('srclang="en-GB"')), ['subtitles']],
    [page(video('kind="" srclang="en"', 'kind="chapters"')), ['subtitles']]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'noCaptionsKind');
    assert.deepEqual(occ.data.details.kinds, kinds);
    assert.equal(occ.i18n.summaryKey, 'videoCaptionsTrackKind_summary_fail');
    assert.equal(occ.summary, 'This video has text tracks, but none with kind="captions".');
  }
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(video('kind="subtitles"')));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/video-captions-track-kind-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'video-captions-track-kind-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  const ids = (tier) =>
    rule.occurrences
      .filter((o) => o.occurrenceOutcome === tier)
      .map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids('fail'), ['vct_case_01', 'vct_case_02', 'vct_case_07']);
  assert.deepEqual(ids('cantTell'), ['vct_case_08']);
});

// A subtitles track in another language (or with no srclang) may be a
// translation, which is not a caption track: RGAA 4.3.2 then does not apply.
test(`${RULE_ID}: subtitles in another language, or without srclang, are asked about`, () => {
  const fr = (body) =>
    `<!doctype html><html lang="fr"><head><title>t</title></head><body>${body}</body></html>`;
  for (const html of [
    fr(video('kind="subtitles" srclang="en"')),
    fr(video('kind="subtitles"')),
    `<!doctype html><html><head><title>t</title></head><body>${video('kind="subtitles" srclang="en"')}</body></html>`
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'subtitlesMayBeTranslation');
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
  // The video's own lang counts, not only the page's.
  const scoped = fr(`<div lang="en">${video('kind="subtitles" srclang="en"')}</div>`);
  assertRule(runa11yCoreOnHtml(scoped, RUN), RULE_ID, 'fail');
});

test(`${RULE_ID}: a captions track with no src does not count as captions`, () => {
  const fr = `<!doctype html><html lang="fr"><head><title>t</title></head><body><video controls><track kind="subtitles" srclang="fr" src="fr.vtt"><track kind="captions" src=""></video></body></html>`;
  assertRule(runa11yCoreOnHtml(fr, RUN), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  const alone = page('<video controls><track kind="captions" src=""></video>');
  assertRule(runa11yCoreOnHtml(alone, RUN), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: under the rgaa-4.1.2 profile: translation cantTell, same-language subtitles fail (4.3.2)`, () => {
  const fr = (body) =>
    `<!doctype html><html lang="fr"><head><title>t</title></head><body>${body}</body></html>`;
  const run = (html) => runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } });
  const asked = assertRule(run(fr(video('kind="subtitles" srclang="en"'))), RULE_ID, 'cantTell');
  const tests = asked.meta.normativeMappings
    .filter((m) => m.standard === 'RGAA')
    .map((m) => m.requirement);
  assert.deepEqual(tests, ['4.3.2']);
  assertRule(run(fr(video('kind="subtitles" srclang="fr"'))), RULE_ID, 'fail');
  // Opt-in: a WCAG profile does not run it.
  const wcag = runa11yCoreOnHtml(fr(video('kind="subtitles" srclang="fr"')), {
    engineOptions: { profile: 'wcag22-aa' }
  });
  assert.ok(!wcag.checksResults.some((r) => r.ruleId === RULE_ID));
});
