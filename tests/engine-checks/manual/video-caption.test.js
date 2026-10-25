'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'video-caption';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when there is no <video>`, () => {
  const html = `<!doctype html><html><body><p>No video here.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// A captions track says captions exist, not that they are complete (F8).
test(`${RULE_ID}: a video with a captions track is asked whether its captions are complete`, () => {
  const html = `<!doctype html><html><body><video src="x.mp4"><track kind="captions" src="cap.vtt"></video></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'CAPTIONS_REVIEW');
});

test(`${RULE_ID}: cantTell when the video has no captions/subtitles track`, () => {
  const html = `<!doctype html><html><body><video src="x.mp4"></video></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'CAPTIONS_TRACK_NOT_DETECTED');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><video src="x.mp4"></video></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Prerecorded video should provide a captions track');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/video-caption-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'video-caption-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 5, maxOccurrences: 5 });

  const expectedFlaggedIds = ['vc_case_01', 'vc_case_02', 'vc_case_03', 'vc_case_04', 'vc_case_05'];

  for (const id of expectedFlaggedIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
});

// Only kind="captions" is captions: a subtitles track may translate the
// dialogue without speaker and sound information.
test(`${RULE_ID}: a subtitles-only video is asked about with its own reason`, () => {
  for (const track of [
    '<track kind="subtitles" srclang="en" src="en.vtt">',
    '<track srclang="en" src="en.vtt">'
  ]) {
    const html = `<!doctype html><html><body><video id="v" controls src="a.mp4">${track}</video></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'SUBTITLES_TRACK_ONLY', track);
  }
});

test(`${RULE_ID}: a captions track next to a subtitles track turns the question to the captions`, () => {
  const html = `<!doctype html><html><body><video src="a.mp4"><track kind="subtitles" src="en.vtt"><track kind="captions" src="fr.vtt"></video></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'CAPTIONS_REVIEW');
});

test(`${RULE_ID}: a subtitles-only video is cantTell under wcag22-aa`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><video controls src="a.mp4"><track kind="subtitles" srclang="en" src="en.vtt"></video></body></html>`;
  const result = runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aa' } });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});
