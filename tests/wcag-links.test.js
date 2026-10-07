'use strict';

/**
 * WCAG criterion links (#144). 133 of 134 rules had no help link and 3 of
 * 116 WCAG mappings linked their criterion, so no reporter could say where
 * to read how to fix a finding. Each criterion now has its W3C id, every
 * 2.1 and 2.2 mapping links its criterion and Understanding document, and
 * the reporters fall back to that document.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { WCAG_CRITERIA, wcagLinks } = require('../src/coverage/wcag-criteria.js');
const { getChecksCatalog } = require('../src/index.js');
const { helpLinkOf } = require('../src/scan-result.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderHtmlReport } = require('../src/report.js');
const { renderJunitReport } = require('../src/junit.js');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');

test('every criterion has a distinct W3C id', () => {
  const ids = WCAG_CRITERIA.map((c) => c.id);
  assert.equal(ids.length, 87);
  assert.ok(ids.every((id) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)));
  assert.equal(new Set(ids).size, ids.length);
  const byNumber = Object.fromEntries(WCAG_CRITERIA.map((c) => [c.sc, c.id]));
  // A few W3C names a title would not give.
  assert.equal(byNumber['1.1.1'], 'non-text-content');
  assert.equal(byNumber['1.3.5'], 'identify-input-purpose');
  assert.equal(byNumber['2.4.11'], 'focus-not-obscured-minimum');
  assert.equal(byNumber['2.5.5'], 'target-size-enhanced');
  assert.equal(byNumber['2.5.8'], 'target-size-minimum');
  assert.equal(byNumber['4.1.1'], 'parsing');
});

test('wcagLinks gives a version its own pages, and nothing it lacks', () => {
  assert.deepEqual(wcagLinks('1.4.3', '2.2'), {
    url: 'https://www.w3.org/TR/WCAG22/#contrast-minimum',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html'
  });
  assert.equal(wcagLinks('2.5.5', '2.1').url, 'https://www.w3.org/TR/WCAG21/#target-size');
  assert.equal(
    wcagLinks('4.1.1', '2.1').understandingUrl,
    'https://www.w3.org/WAI/WCAG21/Understanding/parsing.html'
  );
  assert.equal(wcagLinks('2.5.8', '2.1'), null, '2.1 has no 2.5.8');
  assert.equal(wcagLinks('1.1.1', '2.0'), null, "2.0's anchors are of another kind");
  assert.equal(wcagLinks('9.9.9', '2.2'), null);
});

test('every WCAG mapping of a built-in rule links its criterion and Understanding document', () => {
  let count = 0;
  for (const rule of getChecksCatalog()) {
    for (const m of rule.normativeMappings || []) {
      if (m.standard !== 'WCAG' || m.type) continue;
      count += 1;
      const expected = wcagLinks(m.requirement, m.version);
      assert.ok(expected, `${rule.ruleId} ${m.requirement} ${m.version}`);
      assert.equal(m.url, expected.url, rule.ruleId);
      assert.equal(m.understandingUrl, expected.understandingUrl, rule.ruleId);
    }
  }
  assert.ok(count >= 116, String(count));
});

test("helpLinkOf: the rule's own link first, then its criterion's Understanding document", () => {
  const meta = (helpUrl, normativeMappings) => ({ meta: { helpUrl, normativeMappings } });
  const mapping = {
    standard: 'WCAG',
    version: '2.2',
    requirement: '1.1.1',
    title: 'Non-text Content'
  };
  assert.deepEqual(helpLinkOf(meta('https://a.test/rule', [mapping])), {
    url: 'https://a.test/rule',
    kind: 'rule'
  });
  assert.deepEqual(helpLinkOf(meta('', [mapping])), {
    url: 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html',
    kind: 'understanding',
    sc: '1.1.1',
    title: 'Non-text Content'
  });
  // An Understanding entry or another standard is not the criterion.
  assert.equal(
    helpLinkOf(meta('', [{ standard: 'EN 301 549', version: 'V4.1.1', requirement: '9.1.1.1' }])),
    null
  );
  assert.equal(helpLinkOf(meta('javascript:x', [])), null);
});

test('the reporters link the Understanding document of a rule without its own help', () => {
  const result = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>',
    { url: 'https://example.test/', runOnly: ['img-alt-present', 'region'] }
  );
  const rules = Object.fromEntries(
    JSON.parse(renderSarifReport(result)).runs[0].tool.driver.rules.map((r) => [r.id, r])
  );
  const understanding = 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html';
  assert.equal(rules['img-alt-present'].helpUri, understanding);
  assert.equal('helpUri' in rules.region, false, 'a rule mapped to no criterion has none yet');
  assert.match(
    renderJunitReport(result),
    new RegExp(`help: ${understanding.replace(/\./g, '\\.')}`)
  );
  assert.match(
    renderHtmlReport(result),
    /<a href="https:\/\/www\.w3\.org\/WAI\/WCAG22\/Understanding\/non-text-content\.html">Understanding 1\.1\.1 Non-text Content<\/a>/
  );
});
