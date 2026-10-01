'use strict';

/**
 * The HTML report and the standards registry: a registered standard's own
 * rollups get a section of their own, whatever the standard. The rollups of
 * the RGAA profile serve as sample data.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { renderHtmlReport } = require('../src/report.js');

const PAGE =
  '<html lang="en"><head><title>Report</title></head><body><main>' +
  '<img src="a.png"><h1>Quarterly results</h1><h3>Sales by region</h3></main></body></html>';

function scan(engineOptions) {
  return runa11yCoreOnHtml(PAGE, { engineOptions });
}

const rgaaRollups = (result) => result.rulesResults.filter((r) => r.meta.standard === 'RGAA');

// The report finds a standard's own rollups through the registry, so another
// registered standard gets a section of its own and never lands in the WCAG
// table. The fake standard here borrows the RGAA rollups and renames them.
test("the HTML report gives any registered standard's rollups their own section", () => {
  const { NORMATIVE_STANDARDS } = require('../src/coverage/standards.js');
  const result = scan({ profile: 'rgaa-4.1.2' });
  for (const r of rgaaRollups(result)) {
    r.meta.standard = 'ACME';
    r.data.details.criterion = `A${r.data.details.criterion}`;
    for (const m of r.meta.normativeMappings) if (m.standard === 'RGAA') m.standard = 'ACME';
  }
  NORMATIVE_STANDARDS.push({
    key: 'acme',
    standard: 'ACME',
    versions: ['4.1.2'],
    mappingsFor: () => []
  });
  let html;
  try {
    html = renderHtmlReport(result);
  } finally {
    NORMATIVE_STANDARDS.pop();
  }
  assert.match(html, /<h2>ACME rollup<\/h2>/);
  assert.match(html, /ACME A9\.1<br><span class="note">9\.1\.1<\/span>/);
  assert.doesNotMatch(html, /WCAG A9\.1/);
  assert.doesNotMatch(html, /RGAA rollup/);
  // No titleLang, so the titles take the page's language.
  assert.doesNotMatch(html, /<td lang="fr">/);
});
