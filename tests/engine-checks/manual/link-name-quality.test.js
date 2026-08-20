'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'link-name-quality';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when there are no links with a name`, () => {
  const html = `<!doctype html><html><body><a href="/x"></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when the link text is a known generic phrase`, () => {
  const html = `<!doctype html><html><body><a href="/x">Click here</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'GENERIC_LINK_TEXT');
  assert.equal(rule.occurrences[0].data.details.normalizedName, 'click here');
});

test(`${RULE_ID}: normalizes whitespace, case, and trailing punctuation before matching`, () => {
  const html = `<!doctype html><html><body><a href="/x">  MORE.  </a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: notApplicable when the generic phrase is only a substring of a longer, specific name`, () => {
  const html = `<!doctype html><html><body><a href="/x">Read more about our privacy policy</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the link text is specific and descriptive`, () => {
  const html = `<!doctype html><html><body><a href="/x">Download the 2026 pricing guide</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when the generic name comes from a wrapped img alt (name-from-content)`, () => {
  const html = `<!doctype html><html><body><a href="/x"><img alt="here" src="x.png"></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><a href="/x">Click here</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Link text should be descriptive, not generic');
});

test(`${RULE_ID}: cantTell when a bare format name has no adjacent context`, () => {
  const html = `<!doctype html><html><body>
    <ul>
      <li><a href="/book.html">HTML</a></li>
      <li><a href="/book.epub">EPUB</a></li>
    </ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'AMBIGUOUS_FORMAT_NAME');
});

test(`${RULE_ID}: not flagged when an outer list item names the subject of a nested format-name list`, () => {
  const html = `<!doctype html><html><body>
    <ul>
      <li>
        Ulysses
        <ul>
          <li><a href="/book.html">HTML</a></li>
          <li><a href="/book.epub">EPUB</a></li>
        </ul>
      </li>
    </ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: not flagged when a preceding table header names the row subject`, () => {
  const html = `<!doctype html><html><body>
    <table>
      <tr><th colspan="2">Ulysses</th></tr>
      <tr><td><a href="/book.html">HTML</a></td><td><a href="/book.epub">EPUB</a></td></tr>
    </table>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a table header present in the link's own row does not excuse a generic-phrase link elsewhere in that row`, () => {
  const html = `<!doctype html><html><body>
    <table>
      <tr><th colspan="3">Books</th></tr>
      <tr><td>Ulysses</td><td><a href="/x">Download</a></td><td>1.61MB</td></tr>
    </table>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'GENERIC_LINK_TEXT');
});

test(`${RULE_ID}: not flagged when the enclosing paragraph names the subject before a generic phrase`, () => {
  const html = `<!doctype html><html><body>
    <p>Download the 2026 pricing guide in <a href="/x">HTML</a></p>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: not flagged when aria-describedby resolves to real text`, () => {
  const html = `<!doctype html><html><body>
    <h2 id="rule">Button has accessible name</h2>
    <a href="/x" aria-describedby="rule">More</a>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/link-name-quality-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'link-name-quality-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 4, maxOccurrences: 4 });

  const expectedFlaggedIds = ['lnq_case_01', 'lnq_case_02', 'lnq_case_03', 'lnq_case_04'];
  const expectedNoOccIds = ['lnq_case_05', 'lnq_case_06', 'lnq_case_07'];

  for (const id of expectedFlaggedIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
