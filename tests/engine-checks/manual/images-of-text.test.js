'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'images-of-text';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

const page = (body) => `<!doctype html><html lang="en"><body>${body}</body></html>`;

test(`${RULE_ID}: notApplicable on a page with no image markup shows to hold text`, () => {
  const result = runa11yCoreOnHtml(page('<img src="photo.jpg" alt="A beach at sunset">'), {
    runOnly: [RULE_ID]
  });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: asks about an input type="image" (ACT 0va7u6, Failed Example 2)`, () => {
  const result = runa11yCoreOnHtml(page('<input type="IMAGE" src="button.jpg" alt="Press me">'), {
    runOnly: [RULE_ID]
  });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'IMAGE_BUTTON_TEXT_REVIEW');
});

test(`${RULE_ID}: asks about an img showing an SVG data URL with <text> (Failed Example 5)`, () => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg'><text x='0' y='15'>WCAG Rocks</text></svg>`;
  for (const src of [
    `data:image/svg+xml;utf8,${svg}`,
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  ]) {
    const result = runa11yCoreOnHtml(page(`<img alt="WCAG Rocks" src="${src}">`), {
      runOnly: [RULE_ID]
    });
    const rule = assertRule(result, RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'SVG_IMAGE_TEXT_REVIEW');
  }
});

test(`${RULE_ID}: an inline svg with <text> is real text, and is not asked about`, () => {
  const result = runa11yCoreOnHtml(
    page(`<svg xmlns="http://www.w3.org/2000/svg"><text x="20" y="35">My cat</text></svg>`),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/images-of-text-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'images-of-text-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  for (const id of ['iot_case_01', 'iot_case_02', 'iot_case_03']) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of ['iot_case_04', 'iot_case_05', 'iot_case_06', 'iot_case_07', 'iot_case_08']) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: i18n default is English, and French is translated`, () => {
  const html = page('<input type="image" src="b.png" alt="Go">');
  const en = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell');
  assert.match(en.occurrences[0].summary, /drawn as an image/);
  const fr = assertRule(
    runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.match(fr.occurrences[0].summary, /dessiné sous forme d’image/);
});
