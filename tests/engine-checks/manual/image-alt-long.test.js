'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'image-alt-long';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const LONG = 'x'.repeat(81);
const FLAGGED = `<img src="a.png" alt="${LONG}">`;

test(`${RULE_ID}: an alt over 80 characters is flagged with its length`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page(FLAGGED), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details, {
    reasonCode: 'longAlternative',
    length: 81,
    maxLength: 80,
    sources: [{ source: 'alt', length: 81 }]
  });
  assert.deepEqual(occ.i18n.params, { length: '81' });
  assert.equal(occ.summary, "This image's text alternative is 81 characters long.");
});

test(`${RULE_ID}: exactly 80 characters, spaces collapsed, is not flagged`, () => {
  const alt = `  ${'x'.repeat(40)}   ${'y'.repeat(39)} `;
  assertRule(
    runa11yCoreOnHtml(page(`<img src="a.png" alt="${alt}">`), RUN),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: image buttons, image map areas and role="img" are checked`, () => {
  for (const body of [
    `<input type="image" src="go.png" alt="${LONG}">`,
    `<map name="m"><area href="/" alt="${LONG}" shape="rect" coords="0,0,1,1"></map><img usemap="#m" src="m.png" alt="Map">`,
    `<span role="img" aria-label="${LONG}">*</span>`
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
  }
});

test(`${RULE_ID}: short or empty alternatives are not flagged`, () => {
  const html = page('<img src="a.png" alt="Logo"><img src="b.png" alt=""><img src="c.png">');
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(FLAGGED));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/image-alt-long-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'image-alt-long-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 4, maxOccurrences: 4 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]).sort();
  assert.deepEqual(ids, ['ial_case_01', 'ial_case_02', 'ial_case_05', 'ial_case_06']);
});

// RGAA 1.3.9 asks the question of every text alternative, whatever its
// source and whatever the kind of image.
test(`${RULE_ID}: every alternative source and image type is measured`, () => {
  for (const [body, source] of [
    [`<svg role="img" aria-label="${LONG}"><rect width="1" height="1"/></svg>`, 'aria-label'],
    [`<svg><title>${LONG}</title><rect width="1" height="1"/></svg>`, '<title>'],
    [`<span id="d">${LONG}</span><img src="a.png" alt="" aria-labelledby="d">`, 'aria-labelledby'],
    [`<img src="a.png" title="${LONG}">`, 'title'],
    [`<canvas aria-label="${LONG}"></canvas>`, 'aria-label'],
    [`<object data="a.svg" type="image/svg+xml" title="${LONG}"></object>`, 'title'],
    [`<embed src="a.svg" type="image/svg+xml" aria-label="${LONG}">`, 'aria-label'],
    [`<div role="img presentation" aria-label="${LONG}"></div>`, 'aria-label']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(
      rule.occurrences[0].data.details.sources.map((x) => x.source),
      [source],
      body
    );
  }
});

test(`${RULE_ID}: a long aria-label on an element that is not an image is not measured`, () => {
  const html = page(
    `<button aria-label="${LONG}">Go</button><input type="text" role="combobox" aria-label="${LONG}">`
  );
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: under the rgaa-4.1.2 profile, a long svg label is asked about (1.3.9)`, () => {
  const html = page(
    `<svg role="img" aria-label="${'y'.repeat(120)}"><rect width="1" height="1"/></svg>`
  );
  const rule = assertRule(
    runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } }),
    RULE_ID,
    'cantTell'
  );
  const tests = rule.meta.normativeMappings
    .filter((m) => m.standard === 'RGAA')
    .map((m) => m.requirement);
  assert.deepEqual(tests, ['1.3.9']);
  const wcag = runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aa' } });
  assert.ok(!wcag.checksResults.some((r) => r.ruleId === RULE_ID));
});
