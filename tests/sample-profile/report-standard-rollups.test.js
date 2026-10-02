'use strict';

/**
 * The HTML report and the standards registry: a registered standard's own
 * rollups get a section of their own, with the note the standard's entry
 * names (report.noteKey) in the scan's language, and never land in the WCAG
 * table. Run against the engine copy with the sample profile
 * (tests/helpers/sampleEngine.js).
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { requireSample } = require('../helpers/sampleEngine');

const { runa11yCoreOnHtml } = requireSample('tests/helpers/runDomRulesOnHtml.js');
const { renderHtmlReport } = requireSample('src/report.js');

const PAGE =
  '<html lang="en"><head><title>Report</title></head><body><main>' +
  '<img src="a.png"><h1>Quarterly results</h1><h3>Sales by region</h3></main></body></html>';

test("the HTML report gives a registered standard's rollups their own section", () => {
  const html = renderHtmlReport(
    runa11yCoreOnHtml(PAGE, { engineOptions: { profile: 'sample-1.0' } })
  );
  assert.match(html, /<h2>Sample Standard rollup<\/h2>/);
  assert.match(html, /Sample Standard S1<br><span class="note">S1<\/span>/);
  assert.match(html, /One row per Sample Standard requirement/);
  assert.doesNotMatch(html, /WCAG S1/);
  // No titleLang, so the titles take the page's language.
  assert.doesNotMatch(html, /<td lang=/);
});

test("the section's note follows the scan's language", () => {
  const result = runa11yCoreOnHtml(PAGE, {
    engineOptions: { profile: 'sample-1.0', locale: 'fr' }
  });
  assert.match(renderHtmlReport(result), /Une ligne par exigence de la Sample Standard/);
});

test('a run that does not ask for the standard has no section for it', () => {
  const html = renderHtmlReport(runa11yCoreOnHtml(PAGE));
  assert.doesNotMatch(html, /Sample Standard rollup/);
});
