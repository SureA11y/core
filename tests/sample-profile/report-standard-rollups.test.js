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

// A result carries the standards it names (result.standards), so core's
// reporters, where the sample standard is not registered, render it as the
// reporters of the engine that produced it do.
test('a result renders the same where its standard is not registered', () => {
  const result = runa11yCoreOnHtml(PAGE, {
    engineOptions: { profile: 'sample-1.0', locale: 'fr', timestamp: '2026-10-08T00:00:00.000Z' }
  });
  assert.deepEqual(result.standards, [
    {
      key: 'sample',
      standard: 'Sample Standard',
      note: result.standards[0].note
    }
  ]);
  assert.match(result.standards[0].note, /Une ligne par exigence de la Sample Standard/);
  for (const [file, render] of [
    ['report.js', 'renderHtmlReport'],
    ['sarif.js', 'renderSarifReport'],
    ['junit.js', 'renderJunitReport']
  ]) {
    const here = require(`../../src/${file}`)[render];
    const there = requireSample(`src/${file}`)[render];
    assert.equal(here(result), there(result), file);
  }
});

// A result whose standards list is missing or damaged: a standard the
// rollups and rules still name is shown under its own name, never as a WCAG
// criterion, and the report says the list could not be read.
test("a result's standards are read from its rollups when its list is unusable", () => {
  const result = runa11yCoreOnHtml(PAGE, {
    engineOptions: { profile: 'sample-1.0', timestamp: '2026-10-08T00:00:00.000Z' }
  });
  const intact = require('../../src/report.js').renderHtmlReport(result);
  assert.doesNotMatch(intact, /list of standards is missing/);
  const { standards, ...rest } = result;
  const damaged = {
    deleted: rest,
    object: { ...rest, standards: {} },
    empty: { ...rest, standards: [] },
    unnamed: { ...rest, standards: [{ key: 'sample' }] },
    renamed: { ...rest, standards: [{ key: 'sample', standard: 'Renamed' }] },
    wcag: { ...rest, standards: [{ key: 'sample', standard: 'WCAG' }] }
  };
  for (const [label, r] of Object.entries(damaged)) {
    const html = require('../../src/report.js').renderHtmlReport(r);
    assert.doesNotMatch(html, /WCAG S\d/, label);
    assert.match(html, /<h2>Sample Standard rollup<\/h2>/, label);
    assert.match(html, /list of standards is missing or could not be read/, label);
    const sarif = JSON.parse(require('../../src/sarif.js').renderSarifReport(r));
    const tags = sarif.runs[0].tool.driver.rules.flatMap((x) => x.properties.tags);
    assert.ok(
      tags.some((t) => /^sample-standard-S\d$/.test(t)),
      label
    );
    assert.match(
      require('../../src/junit.js').renderJunitReport(r),
      /Sample Standard|sample-standard/,
      label
    );
  }
  assert.ok(standards.length);
});

// A rollup in the WCAG table is labelled by its own standard when it has
// no WCAG entry.
test('a rollup without a WCAG entry is never labelled as a WCAG criterion', () => {
  const result = runa11yCoreOnHtml(PAGE, { engineOptions: { profile: 'sample-1.0' } });
  const rulesResults = result.rulesResults.map((r) =>
    r.meta && r.meta.standard ? { ...r, meta: { ...r.meta, standard: undefined } } : r
  );
  const html = require('../../src/report.js').renderHtmlReport({ ...result, rulesResults });
  assert.doesNotMatch(html, /WCAG S\d/);
  assert.match(html, /Sample Standard S1/);
});

// A standard only a custom rule names is no registered one: it is left out
// as before, and the list is not taken for damaged.
test('a standard only a custom rule names adds no section and no note', () => {
  const result = runa11yCoreOnHtml(PAGE, {
    engineOptions: {
      customRules: [
        {
          id: 'acme-x',
          meta: {
            title: 'X',
            normativeMappings: [{ standard: 'Acme Policy', version: '1', requirement: 'A1' }]
          },
          runInPage: () => ({ outcome: 'pass', occurrences: [] })
        }
      ]
    }
  });
  const html = require('../../src/report.js').renderHtmlReport(result);
  assert.doesNotMatch(html, /Acme Policy rollup|list of standards is missing/);
  const sarif = require('../../src/sarif.js').renderSarifReport(result);
  assert.doesNotMatch(sarif, /acme-policy-A1/);
});
