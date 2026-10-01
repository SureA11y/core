'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'no-autoplay-audio';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when there is no autoplaying media`, () => {
  const html = `<!doctype html><html><body><audio src="x.mp3"></audio></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when audio autoplays unmuted with no controls`, () => {
  const html = `<!doctype html><html><body><audio autoplay src="x.mp3"></audio></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'AUTOPLAY_NO_CONTROLS_MECHANISM');
});

test(`${RULE_ID}: notApplicable when autoplaying audio is muted`, () => {
  const html = `<!doctype html><html><body><audio autoplay muted src="x.mp3"></audio></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when autoplaying audio has controls`, () => {
  const html = `<!doctype html><html><body><audio autoplay controls src="x.mp3"></audio></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><video autoplay src="x.mp4"></video></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'Autoplaying audio should provide a pause/stop or volume-control mechanism'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/no-autoplay-audio-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'no-autoplay-audio-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 6, maxOccurrences: 6 });

  const expectedFlaggedIds = [
    'naa_case_01',
    'naa_case_02',
    'naa_case_06',
    'naa_case_07',
    'naa_case_08',
    'naa_case_09'
  ];
  const expectedNoOccIds = [
    'naa_case_03',
    'naa_case_04',
    'naa_case_05',
    'naa_case_10',
    'naa_case_11'
  ];

  for (const id of expectedFlaggedIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  // The <object> of case 08 is reported with its fallback <embed> inside.
  assert.ok(rule.occurrences.every((o) => !o.html.startsWith('<embed id="naa_case_08_fallback"')));
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

// Hidden media still plays, so the hidden-content filter does not apply
// (in a real browser an <audio> without controls is always display:none;
// tests/engine-checks/manual/media-rules-chromium.test.js checks that case).
test(`${RULE_ID}: autoplaying audio in a hidden container is still flagged`, () => {
  for (const wrapper of [
    '<div style="display:none">',
    '<div hidden>',
    '<div aria-hidden="true">'
  ]) {
    const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>${wrapper}<audio id="a" autoplay loop src="m.mp3"></audio></div></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'a'), wrapper);
  }
});

test(`${RULE_ID}: excludeSelectors and the scan scope still apply`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><div id="out" style="display:none"><audio autoplay src="m.mp3"></audio></div><main id="in"><p>x</p></main></body></html>`;
  assertRule(
    runa11yCoreOnHtml(html, { runOnly: [RULE_ID], excludeSelectors: ['#out'] }),
    RULE_ID,
    'notApplicable'
  );
  assertRule(
    runa11yCoreOnHtml(html, { runOnly: [RULE_ID], contextSelector: '#in' }),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: hidden autoplaying audio is cantTell under wcag22-aa`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><div style="display:none"><audio autoplay loop src="m.mp3"></audio></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aa' } });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

// RGAA 4.10.1 lists <object>, <embed> and <bgsound> as sound sources too,
// and WCAG 1.4.2 covers any audio that plays on its own.
test(`${RULE_ID}: <embed>, <object> and <bgsound> that may play sound are asked about`, () => {
  const page = (body) =>
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
  for (const body of [
    '<embed id="a" src="welcome.mp3">',
    '<embed id="a" src="/media/loop.ogg?v=2">',
    '<embed id="a" type="audio/mpeg" src="stream">',
    '<object id="a" data="intro.mp4"></object>',
    '<object id="a" type="video/webm" data="clip"></object>',
    '<object id="a" type="application/x-shockwave-flash" data="player.swf"></object>',
    '<bgsound id="a" src="tune.mid">',
    '<div hidden><embed id="a" src="welcome.wav"></div>'
  ]) {
    for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
      const result = runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID], engineOptions });
      const rule = assertRule(result, RULE_ID, 'cantTell', {
        minOccurrences: 1,
        maxOccurrences: 1
      });
      assert.ok(hasOccurrenceForId(rule, 'a'), body);
      assert.equal(rule.occurrences[0].data.details.reasonCode, 'EMBEDDED_SOUND_SOURCE');
      assert.equal(
        rule.occurrences[0].summary,
        'This element may play sound as soon as the page loads.'
      );
    }
  }
});

test(`${RULE_ID}: an <embed> or <object> with no sound, or set not to start, is left out`, () => {
  const page = (body) =>
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
  for (const body of [
    '<embed src="chart.png">',
    '<embed src="report.pdf" type="application/pdf">',
    '<embed type="image/svg+xml" src="song.mp3">',
    '<object data="page.html"></object>',
    '<embed src="welcome.mp3" autostart="false">',
    '<embed src="welcome.mp3" autoplay="false">',
    '<object data="intro.mp4"><param name="autoplay" value="false"></object>',
    '<object data="intro.mp4"><param name="autostart" value="0"></object>',
    '<object type="application/x-shockwave-flash" data="p.swf"><param name="play" value="false"></object>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: the fallback inside an <object> already asked about is not asked about again`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><object id="a" data="intro.mp4"><embed id="b" src="intro.mp4"></object></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});
