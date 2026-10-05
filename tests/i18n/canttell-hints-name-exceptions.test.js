'use strict';

/**
 * A cantTell finding asks a person to judge something the engine can't, so
 * its hint has to say what makes the finding fine. Without that, a
 * reviewer reading only the hint "fixes" markup that was correct. Each case
 * below names the exception or condition a rule's cantTell depends on, and
 * checks the English hint still mentions it, and that every locale carries
 * its own translation of it.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const I18N = path.join(__dirname, '../../src/i18n');
const en = require(path.join(I18N, 'en.json'));
const locales = fs
  .readdirSync(I18N)
  .filter((f) => f.endsWith('.json') && f !== 'en.json')
  .map((f) => [f.replace('.json', ''), require(path.join(I18N, f))]);

const CASES = [
  // ACT 4b1c6c: different resources can still be equivalent.
  ['identicalIframesSamePurpose_hint_cantTell', /equivalent content/],
  // ACT b20e66: links judged by purpose, not by identical URLs.
  [
    'identicalLinksSamePurpose_hint_cantTell',
    /different addresses when they serve the same purpose/
  ],
  // The rule sees only inline handlers; one added from script counts.
  ['mouseOnlyEventHandlers_hint_cantTell', /added from script counts/],
  // WCAG 1.2.2: no captions for a media alternative for text.
  ['videoCaption_hint_cantTell', /media alternative for text/],
  ['videoCaption_hint_cantTell_subtitlesOnly', /media alternative for text/],
  // WCAG 1.2.1: no transcript for a media alternative for text.
  ['mediaTranscriptPresent_hint_cantTell_missing', /alternative for text on the page/],
  ['mediaTranscriptPresent_hint_cantTell_unverified', /alternative for text on the page/],
  // The keyboard review says what to check, not "see guidance".
  ['manualReview_hint_cantTell', /reached and used with the keyboard/],
  // The text-alternative signals (img-, area-, input-image-alt-quality): each can be right when it is what the image shows.
  ['textAlternative_hint_cantTellFileName', /file name is itself what the image shows/],
  ['textAlternative_hint_cantTellUrl', /address is itself what the image shows/],
  ['textAlternative_hint_cantTellPlaceholder', /all the image conveys/],
  ['textAlternative_hint_cantTellRedundantPrefix', /unless the kind of image matters/],
  ['textAlternative_hint_cantTellTooLong', /image holds that much text itself/]
];

for (const [key, mustMention] of CASES) {
  test(`${key} names the case that makes the finding fine`, () => {
    assert.match(en[key], mustMention);
    for (const [locale, dict] of locales) {
      assert.ok(dict[key], `${locale} has ${key}`);
      assert.notEqual(dict[key], en[key], `${locale} translates ${key}`);
    }
  });
}

test('no hint just points to guidance', () => {
  for (const [key, value] of Object.entries(en)) {
    if (/_hint_/.test(key)) assert.notEqual(value, 'See guidance for this rule.', key);
  }
});
