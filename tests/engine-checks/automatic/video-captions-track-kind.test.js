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

test(`${RULE_ID}: subtitles only fail, and a track without kind counts as subtitles`, () => {
  for (const [html, kinds] of [
    [page(video('kind="subtitles"')), ['subtitles']],
    [page(video('')), ['subtitles']],
    [page(video('kind=""', 'kind="chapters"')), ['subtitles']]
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
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['vct_case_01', 'vct_case_02']);
});
