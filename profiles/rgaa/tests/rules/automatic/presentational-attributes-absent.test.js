'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'presentational-attributes-absent';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

function attributesOf(rule, id) {
  const occ = rule.occurrences.find((o) => o.html.includes(`id="${id}"`));
  return occ ? occ.data.details.attributes : null;
}

test(`${RULE_ID}: a page without them passes`, () => {
  const html = page('<p class="intro">Text</p><img src="a.png" alt="" width="10" height="10">');
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: one occurrence per element, naming every attribute it carries`, () => {
  const html = page(
    '<table id="t" border="1" cellspacing="0" bgcolor="#fff"><tr><td>a</td></tr></table>'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details.attributes, ['bgcolor', 'border', 'cellspacing']);
  assert.equal(occ.data.details.reasonCode, 'presentationalAttribute');
  assert.equal(occ.i18n.summaryKey, 'presentationalAttributesAbsent_summary_fail');
  assert.deepEqual(occ.i18n.params, {
    element: 'table',
    attributes: 'bgcolor, border, cellspacing'
  });
  assert.equal(
    occ.summary,
    '<table> carries presentational attributes: bgcolor, border, cellspacing.'
  );
});

test(`${RULE_ID}: every attribute RGAA lists is caught`, () => {
  const always = [
    'align',
    'alink',
    'background',
    'basefont',
    'bgcolor',
    'border',
    'cellpadding',
    'cellspacing',
    'char',
    'charoff',
    'clear',
    'color',
    'compact',
    'frameborder',
    'hspace',
    'link',
    'marginheight',
    'marginwidth',
    'text',
    'valign',
    'vlink',
    'vspace'
  ];
  const html = page(`<div id="d" ${always.map((a) => `${a}="1"`).join(' ')}>x</div>`);
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', { minOccurrences: 1 });
  assert.deepEqual(attributesOf(rule, 'd'), always);
});

test(`${RULE_ID}: size is allowed on <select> only, width and height on the elements RGAA exempts`, () => {
  const html = page(
    '<select id="s" size="3" aria-label="x"><option>a</option></select>' +
      '<input id="i" size="10" aria-label="y">' +
      '<img id="img" src="a.png" alt="" width="1" height="1">' +
      '<canvas id="c" width="1" height="1"></canvas>' +
      '<iframe id="f" title="f" src="about:blank" width="1" height="1"></iframe>' +
      '<video id="v" width="1"></video>'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', { minOccurrences: 3 });
  assert.equal(attributesOf(rule, 's'), null);
  assert.equal(attributesOf(rule, 'img'), null);
  assert.equal(attributesOf(rule, 'c'), null);
  assert.deepEqual(attributesOf(rule, 'i'), ['size']);
  assert.deepEqual(attributesOf(rule, 'f'), ['width', 'height']);
  assert.deepEqual(attributesOf(rule, 'v'), ['width']);
});

test(`${RULE_ID}: SVG and MathML content is not checked`, () => {
  const html = page(
    '<svg width="10" height="10" aria-hidden="true"><rect width="5" height="5" color="red" /></svg>' +
      '<math><mspace width="1em" /></math>'
  );
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: hidden content is part of the generated source and is checked`, () => {
  const html = page(
    '<div hidden><p id="h1" align="center">x</p></div>' +
      '<p id="h2" style="display:none" align="center">y</p>' +
      '<p id="b" basefont="3">z</p>' +
      '<template><p align="center">t</p></template>'
  );
  for (const opts of [RUN, { ...RUN, engineOptions: { includeHiddenElements: true } }]) {
    const rule = assertRule(runa11yCoreOnHtml(html, opts), RULE_ID, 'fail', {
      minOccurrences: 3,
      maxOccurrences: 3
    });
    assert.deepEqual(attributesOf(rule, 'h1'), ['align']);
    assert.deepEqual(attributesOf(rule, 'h2'), ['align']);
    assert.deepEqual(attributesOf(rule, 'b'), ['basefont']);
  }
  assertRule(
    runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } }),
    RULE_ID,
    'fail',
    {
      minOccurrences: 3,
      maxOccurrences: 3
    }
  );
});

test(`${RULE_ID}: excludeSelectors still apply to hidden content`, () => {
  const html = page('<div id="skip" hidden><p align="center">x</p></div>');
  assertRule(runa11yCoreOnHtml(html, { ...RUN, excludeSelectors: ['#skip'] }), RULE_ID, 'pass');
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page('<p align="center">x</p>'));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/presentational-attributes-absent-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'presentational-attributes-absent-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 8, maxOccurrences: 8 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, [
    'pat_case_01',
    'pat_case_02',
    'pat_case_03',
    'pat_case_04',
    'pat_case_05',
    'pat_case_09',
    'pat_case_10',
    'pat_case_11'
  ]);
});
