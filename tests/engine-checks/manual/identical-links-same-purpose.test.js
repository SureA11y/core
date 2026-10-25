'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'identical-links-same-purpose';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when there are no links`, () => {
  const html = `<!doctype html><html><body><p>No links here.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when same-name links share the same destination`, () => {
  const html = `<!doctype html><html><body><a href="/contact">Contact us</a><a href="/contact">Contact us</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when same-name links lead to different destinations`, () => {
  const html = `<!doctype html><html><body><a href="/a">Read more</a><a href="/b">Read more</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'SAME_NAME_DIFFERENT_DESTINATION');
});

test(`${RULE_ID}: a link is grouped by its content, not by a title its content supersedes`, () => {
  const html = `<!doctype html><html><body>
    <a href="/a" title="Read more">Annual report 2025</a>
    <a href="/b" title="Read more">Budget 2026</a>
  </body></html>`;
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: links with no accessible name are not grouped`, () => {
  const html = `<!doctype html><html><body>
    <a href="/a"><span aria-hidden="true">Next</span></a>
    <a href="/b"><span aria-hidden="true">Next</span></a>
  </body></html>`;
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: cantTell for role="link" elements whose destination comes from an onclick location assignment (ACT fd3a94/b20e66's own failed example shape)`, () => {
  const html = `<!doctype html><html><body>
    <span role="link" tabindex="0" onclick="location='/about/contact.html'">Contact us</span>
    <span role="link" tabindex="0" onclick="location='/admissions/contact.html'">Contact us</span>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'SAME_NAME_DIFFERENT_DESTINATION');
});

test(`${RULE_ID}: a link role in a fallback list or upper case (role="foo link", role="LINK") is a link, a link token after a real role is not`, () => {
  const html = `<!doctype html><html><body>
    <span role="foo link" tabindex="0" onclick="location='/about/contact.html'">Contact us</span>
    <span role="LINK" tabindex="0" onclick="location='/admissions/contact.html'">Contact us</span>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });

  const buttonFirst = `<!doctype html><html><body>
    <span role="button link" tabindex="0" onclick="location='/about/contact.html'">Contact us</span>
    <a href="/contact">Contact us</a>
  </body></html>`;
  assertRule(runa11yCoreOnHtml(buttonFirst, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: pass for role="link" elements whose onclick location assignment resolves to the same destination`, () => {
  const html = `<!doctype html><html><body>
    <span role="link" tabindex="0" onclick="location='/contact.html'">Contact us</span>
    <span role="link" tabindex="0" onclick="location.href='/contact.html'">Contact us</span>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a role="link" element with no href and no recognizable onclick location is simply not resolved (not counted, not flagged)`, () => {
  const html = `<!doctype html><html><body>
    <span role="link" tabindex="0" onclick="doSomethingElse()">Contact us</span>
    <a href="/contact">Contact us</a>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><a href="/a">Read more</a><a href="/b">Read more</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'Links with the same accessible name should lead to the same destination'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/identical-links-same-purpose-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'identical-links-same-purpose-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });

  const expectedFlaggedIds = ['ilsp_case_01', 'ilsp_case_02'];
  const expectedNoOccIds = [
    'ilsp_case_03',
    'ilsp_case_04',
    'ilsp_case_05',
    'ilsp_case_06',
    'ilsp_case_07'
  ];

  for (const id of expectedFlaggedIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: notApplicable when no two links share a name, since there is nothing to compare (ACT b20e66)`, () => {
  const html = `<!doctype html><html><body><a href="/a">Pricing</a><a href="/b">Contact</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// Leans.
test(`${RULE_ID}: tracking-parameter variants lean pass, a generic name to different pages leans fail`, () => {
  const leans = (body) =>
    assertRule(
      runa11yCoreOnHtml(`<!doctype html><html lang="en"><body>${body}</body></html>`, {
        runOnly: [RULE_ID],
        url: 'https://example.test/'
      }),
      RULE_ID,
      'cantTell',
      { minOccurrences: 2 }
    ).occurrences.map((o) => (o.lean ? [o.lean.toward, o.lean.i18n.whyKey] : null));

  assert.deepEqual(
    leans(
      '<a href="https://example.test/pricing/">Pricing</a><a href="http://example.test/pricing/index.html?utm_source=nav">Pricing</a>'
    ),
    [
      ['pass', 'identicalLinksSamePurpose_lean_why_samePage'],
      ['pass', 'identicalLinksSamePurpose_lean_why_samePage']
    ]
  );
  assert.deepEqual(leans('<a href="/news/1">Read more</a><a href="/news/2">Read more</a>'), [
    ['fail', 'identicalLinksSamePurpose_lean_why_genericName'],
    ['fail', 'identicalLinksSamePurpose_lean_why_genericName']
  ]);
  // A specific name over different pages, or one page's different parts:
  // no lean.
  assert.deepEqual(leans('<a href="/a">Contact us</a><a href="/b">Contact us</a>'), [null, null]);
  assert.deepEqual(leans('<a href="/p#reviews">More</a><a href="/p#specs">More</a>'), [null, null]);
});
