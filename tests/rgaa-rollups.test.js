'use strict';

/**
 * RGAA's per-criterion rollups: generated from the mapping table, produced
 * only when a run asks for RGAA, and the only rollup some RGAA findings have
 * (heading order, doctype), which a consumer reading rulesResults alone would
 * otherwise miss. Each rule result names the rollups that group it.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../src/core.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { renderHtmlReport } = require('../src/report.js');

const PAGE =
  '<html lang="en"><head><title>Report</title></head><body><main>' +
  '<img src="a.png"><h1>Quarterly results</h1><h3>Sales by region</h3></main></body></html>';

function scan(engineOptions, runOnly) {
  return runa11yCoreOnHtml(PAGE, { engineOptions, ...(runOnly ? { runOnly } : {}) });
}

const rgaaRollups = (result) => result.rulesResults.filter((r) => r.meta.standard === 'RGAA');
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test('a default run, a WCAG profile and an EN 301 549 profile produce no RGAA rollup', () => {
  for (const options of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    assert.deepEqual(rgaaRollups(scan(options)), [], JSON.stringify(options));
  }
});

test('the RGAA profile produces one rollup per criterion a rule is linked to', () => {
  const result = scan({ profile: 'rgaa-4.1.2' });
  const catalog = core
    .getRulesCatalog({ profile: 'rgaa-4.1.2' })
    .filter((c) => c.meta.standard === 'RGAA');
  assert.ok(catalog.length > 40);
  assert.deepEqual(
    rgaaRollups(result)
      .map((r) => r.ruleId)
      .sort(),
    catalog.map((c) => c.id).sort()
  );
  // The WCAG rollups are still there.
  assert.ok(result.rulesResults.some((r) => r.ruleId === 'wcag-1.1.1-non-text-content'));
});

test("an RGAA rollup names its standard, version and criterion, with RGAA's wording as title", () => {
  const headings = rollup(scan({ profile: 'rgaa-4.1.2' }), 'rgaa-4.1.2-9.1');
  assert.equal(headings.meta.standard, 'RGAA');
  assert.equal(headings.data.details.standard, 'RGAA');
  assert.equal(headings.data.details.version, '4.1.2');
  assert.equal(headings.data.details.criterion, '9.1');
  assert.match(headings.title, /^Dans chaque page web, l’information est-elle structurée/);
});

test('findings with no WCAG rollup get one: heading order and the missing doctype', () => {
  const result = scan({ profile: 'rgaa-4.1.2' });
  const headings = rollup(result, 'rgaa-4.1.2-9.1');
  assert.equal(headings.outcome, 'cantTell');
  assert.ok(headings.data.details.checksIds.includes('heading-order'));
  // Named only for the rule that decided, as for WCAG rollups.
  assert.deepEqual(
    headings.meta.normativeMappings.filter((m) => m.standard === 'RGAA').map((m) => m.requirement),
    ['9.1.1']
  );
  assert.equal(rollup(result, 'rgaa-4.1.2-8.1').outcome, 'fail');
});

test('each rule result lists the rollups that group it; an empty list means none', () => {
  const plain = scan({});
  const byId = (result, id) => result.checksResults.find((r) => r.ruleId === id);
  assert.deepEqual(byId(plain, 'img-alt-present').rollupIds, ['wcag-1.1.1-non-text-content']);
  assert.deepEqual(byId(plain, 'heading-order').rollupIds, []);
  for (const r of plain.checksResults) assert.ok(Array.isArray(r.rollupIds), r.ruleId);

  const rgaa = scan({ profile: 'rgaa-4.1.2' });
  assert.deepEqual(byId(rgaa, 'heading-order').rollupIds, ['rgaa-4.1.2-9.1']);
  assert.deepEqual(byId(rgaa, 'img-alt-present').rollupIds, [
    'wcag-1.1.1-non-text-content',
    'rgaa-4.1.2-1.1',
    'rgaa-4.1.2-1.2'
  ]);
});

test('excludes apply to RGAA rollups like to any rollup', () => {
  const result = scan({ profile: 'rgaa-4.1.2' }, { excludeRuleIds: ['rgaa-4.1.2-9.1'] });
  assert.equal(rollup(result, 'rgaa-4.1.2-9.1'), undefined);
  assert.ok(rollup(result, 'rgaa-4.1.2-8.1'));
});

test('the catalog lists RGAA rollups only when the options ask for RGAA', () => {
  const rgaaIn = (list) => list.filter((c) => c.meta && c.meta.standard === 'RGAA').length;
  assert.equal(rgaaIn(core.getRulesCatalog()), 0);
  assert.equal(rgaaIn(core.getRulesCatalog({ profile: 'wcag22-aa' })), 0);
  assert.ok(rgaaIn(core.getRulesCatalog({ profile: 'rgaa-4.1.2' })) > 40);
  assert.ok(core.getCompositeRuleById('rgaa-4.1.2-9.1'));
});

test('the HTML report shows RGAA rollups in their own section, only when there are some', () => {
  const withRgaa = renderHtmlReport(scan({ profile: 'rgaa-4.1.2' }));
  assert.match(withRgaa, /<h2>RGAA rollup<\/h2>/);
  assert.match(withRgaa, /RGAA 9\.1<br><span class="note">9\.1\.1<\/span>/);
  assert.match(withRgaa, /<td lang="fr">Dans chaque page web/);
  assert.match(withRgaa, /not yet been reviewed by an RGAA auditor/);
  assert.doesNotMatch(renderHtmlReport(scan({})), /RGAA rollup/);
});

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

// RGAA 13.1.1 accepts a refresh of 20 hours or more, and without a URL it is
// no redirect for 13.1.2. The AAA rule fails any positive delay, so it is not
// linked to 13.1 and the profile does not run it.
test('a refresh of 20 hours or more passes RGAA 13.1', () => {
  const page =
    '<!doctype html><html lang="en"><head><title>t</title><meta http-equiv="refresh" content="86400"></head>' +
    '<body><main><p>x</p></main></body></html>';
  const result = runa11yCoreOnHtml(page, { engineOptions: { profile: 'rgaa-4.1.2' } });
  assert.equal(rollup(result, 'rgaa-4.1.2-13.1').outcome, 'pass');
  assert.ok(!result.checksResults.some((r) => r.ruleId === 'meta-refresh-no-exceptions'));
});
