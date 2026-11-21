'use strict';

/**
 * The integrator's API: round 9 findings that needed a decision (A9-*).
 * Regional locales, baseline keys without HTML, run filters given twice and
 * engine options at the wrong level.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../src/testing.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"><button></button></main></body></html>';

const checkOf = (result, ruleId) => result.checksResults.find((c) => c.ruleId === ruleId);

test("a regional locale's missing strings come from its base language, then English (A9-4)", () => {
  const german = runa11yCoreOnHtml(PAGE, { engineOptions: { locale: 'de' } });
  const run = (locale, messages) =>
    runa11yCoreOnHtml(PAGE, { engineOptions: { locale, messages } });

  // The caller's regional string, then the built-in base language.
  const at = run('de-AT', { 'de-AT': { img_altPresent_title: 'AT Titel' } });
  assert.equal(checkOf(at, 'img-alt-present').title, 'AT Titel');
  assert.equal(
    checkOf(at, 'button-name-present').title,
    checkOf(german, 'button-name-present').title
  );
  assert.equal(
    checkOf(at, 'img-alt-present').occurrences[0].summary,
    checkOf(german, 'img-alt-present').occurrences[0].summary
  );
  assert.deepEqual(at.engine.locale, { requested: 'de-AT', resolved: 'de-AT', reason: 'ok' });

  // The caller's base language comes before the built-in one, in any case.
  const both = run('DE-at', {
    'de-AT': { img_altPresent_title: 'AT Titel' },
    De: { buttonNamePresent_title: 'Eigener Knopf' }
  });
  assert.equal(checkOf(both, 'img-alt-present').title, 'AT Titel');
  assert.equal(checkOf(both, 'button-name-present').title, 'Eigener Knopf');

  // A language with no built-in dictionary: the caller's regional, then the
  // caller's base language, then English.
  const english = runa11yCoreOnHtml(PAGE);
  const br = run('pt-BR', {
    'pt-BR': { img_altPresent_title: 'BR' },
    pt: { buttonNamePresent_title: 'Botão' }
  });
  assert.equal(checkOf(br, 'img-alt-present').title, 'BR');
  assert.equal(checkOf(br, 'button-name-present').title, 'Botão');
  assert.equal(
    checkOf(br, 'img-alt-present').occurrences[0].summary,
    checkOf(english, 'img-alt-present').occurrences[0].summary
  );
});

test('a baseline key without markup names the finding by its selector (A9-10)', () => {
  const { buildBaselineEntries, matchBaseline, computeBaselineKey } = require('../src/baseline.js');
  const { renderSarifReport } = require('../src/sarif.js');
  const page = (body) =>
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
  const scan = (html, includeHtml) =>
    runa11yCoreOnHtml(html, { engineOptions: { output: { includeHtml } } });
  const before = page('<main><h1>x</h1><img src="old.png"></main><footer>f</footer>');
  const after = page('<main><h1>x</h1></main><footer><img src="new.png"></footer>');

  // Without markup, the image fixed in main and the one added in the footer
  // are two findings: one new, one entry stale.
  const entries = buildBaselineEntries(scan(before, false));
  assert.deepEqual(
    entries.filter((e) => e.ruleId === 'img-alt-present').map((e) => [e.selector, e.html]),
    [['html > body > main > img', '']]
  );
  const match = matchBaseline(scan(after, false), entries);
  assert.equal(match.newCount, 1);
  assert.equal(match.staleCount, 1);
  assert.equal(match.newOccurrences[0].selector, 'html > body > footer > img');
  // The same scan again is all known.
  assert.equal(matchBaseline(scan(before, false), entries).newCount, 0);

  // SARIF reads the same key: it reports the new finding rather than
  // leaving it out as known, with a fingerprint of its own.
  const sarif = JSON.parse(renderSarifReport(scan(after, false), { baselineEntries: entries }));
  assert.ok(sarif.runs[0].results.some((r) => r.ruleId === 'img-alt-present'));
  const fingerprint = (result) =>
    JSON.parse(renderSarifReport(result)).runs[0].results.find(
      (r) => r.ruleId === 'img-alt-present'
    ).partialFingerprints['surea11y/violation/v2'];
  assert.notEqual(fingerprint(scan(after, false)), fingerprint(scan(before, false)));

  // With markup, the selector is not read: the key is what it was.
  assert.equal(
    computeBaselineKey('r', 'C', '<img>', [], 'html > body > img'),
    computeBaselineKey('r', 'C', '<img>')
  );
  assert.equal(
    fingerprint(scan(after, true)),
    fingerprint(scan(page('<img src="new.png">'), true))
  );
});
