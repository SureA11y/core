'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'embedded-refresh-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body, head = '') {
  return `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body><main>${body}</main></body></html>`;
}

test(`${RULE_ID}: each element 13.1.1 lists as a refresh method is asked about`, () => {
  for (const [body, element] of [
    ['<object id="a" data="scores.html"></object>', 'object'],
    ['<object id="a" data="map.svg"></object>', 'object'],
    ['<object id="a" type="image/svg+xml" data="map"></object>', 'object'],
    ['<embed id="a" src="ticker.html">', 'embed'],
    ['<embed id="a" src="clip.mp4">', 'embed'],
    ['<canvas id="a" width="100" height="50"></canvas>', 'canvas'],
    ['<svg id="a" viewBox="0 0 10 10"><script>void 0</script></svg>', 'svg']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.match(occ.html, /id="a"/, body);
    assert.equal(occ.data.details.reasonCode, 'POSSIBLE_REFRESH_SOURCE');
    assert.equal(occ.data.details.element, element);
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: still images and script-free svg are not applicable`, () => {
  for (const body of [
    '<object data="chart.png"></object>',
    '<object type="image/jpeg" data="photo"></object>',
    '<embed src="banner.gif">',
    '<embed type="image/webp" src="x">',
    '<svg viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4"/></svg>',
    '<svg viewBox="0 0 10 10"><circle r="4"><animate attributeName="r" values="4;2;4" dur="1s" repeatCount="indefinite"/></circle></svg>',
    '<p>No embedded content.</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: hidden elements are asked about, since they can still reload`, () => {
  const body =
    '<div hidden><canvas id="a"></canvas></div><div style="display:none"><embed id="b" src="t.html"></div>';
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 2,
    maxOccurrences: 2
  });
  assert.match(rule.occurrences[0].html, /id="a"/);
  assert.match(rule.occurrences[1].html, /id="b"/);
});

test(`${RULE_ID}: the fallback inside an <object> already asked about is not asked about again`, () => {
  const body = '<object id="a" data="scores.html"><embed id="b" src="scores.html"></object>';
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.match(rule.occurrences[0].html, /^<object id="a"/);
});

test(`${RULE_ID}: excludeSelectors apply`, () => {
  const body = '<div class="ad"><canvas></canvas></div>';
  assertRule(
    runa11yCoreOnHtml(page(body), { ...RUN, engineOptions: { excludeSelectors: ['.ad'] } }),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: opt-in, so a default run and a WCAG profile do not include it`, () => {
  const html = page('<canvas></canvas>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
  for (const engineOptions of [
    { profile: 'rgaa-4.1.2' },
    { tags: { include: 'rgaa' } },
    { rules: { include: 'rgaa-4.1.2-13.1' } }
  ]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the map links it to 13.1.1`, () => {
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['13.1.1']);
});

// A meta refresh of twenty hours passes 13.1.1, but a canvas on the same page
// may refresh itself, so the criterion asks instead of passing.
test(`${RULE_ID}: RGAA 13.1 asks when a passing meta refresh sits next to a canvas`, () => {
  const head = '<meta http-equiv="refresh" content="72000">';
  const outcome = (body) => {
    const result = runa11yCoreOnHtml(page(body, head), {
      engineOptions: { profile: 'rgaa-4.1.2' }
    });
    return (result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-13.1') || {}).outcome;
  };
  assert.equal(outcome('<p>Scores</p>'), 'pass');
  assert.equal(outcome('<canvas></canvas>'), 'cantTell');
});

test(`${RULE_ID}: i18n default is English, French under the fr locale`, () => {
  const html = page('<canvas></canvas>');
  const en = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell');
  assert.equal(
    en.title,
    'Embedded content that may refresh itself lets the user control the refresh'
  );
  const fr = assertRule(
    runa11yCoreOnHtml(html, { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    fr.title,
    'Les contenus intégrés qui peuvent se rafraîchir laissent l’utilisateur contrôler le rafraîchissement'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 4, maxOccurrences: 4 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['err_case_01', 'err_case_02', 'err_case_03', 'err_case_04']);
});
