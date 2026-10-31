'use strict';

// The HTML report's "What's left for a person" (docs/REPORT.md): for the
// standard scanned, the checks no rule decides in full, by requirement, with
// their steps and the requirement's outcome in the scan.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const { renderHtmlReport } = require('../src/report.js');
const { listProcedures } = require('../src/index.js');
const { definePack, ruleMappedStandard } = require('../src/pack.js');
const { runa11yCoreOnHtml } = require('../src/testing.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>Shop</title></head><body><main>' +
  '<h1>Shop</h1><img src="logo.png"><p style="color:#aaa;background:#fff">Grey text</p>' +
  '</main></body></html>';

const doc = (html) => new JSDOM(html).window.document;
const scan = (engineOptions = {}) => runa11yCoreOnHtml(PAGE, { engineOptions });

test('the report lists what the scan leaves to a person, by criterion', () => {
  const result = scan({ profile: 'wcag22-aa' });
  const d = doc(renderHtmlReport(result));
  const heading = d.getElementById('manual-checks-heading');
  assert.equal(heading.textContent, "What's left for a person");
  const left = listProcedures({
    version: '2.2',
    levels: ['A', 'AA'],
    automation: ['manual', 'partial']
  });
  const expected = left.requirements
    .map((r) => [r.id, r.facets.filter((f) => !f.coveredBy && f.procedure).length])
    .filter(([, n]) => n);
  const rows = [...d.querySelectorAll('details.manual-req')];
  assert.deepEqual(
    rows.map((row) => [
      row.querySelector('summary .sc-cell').textContent,
      row.querySelectorAll('.manual-facet').length
    ]),
    expected
  );
  const total = expected.reduce((n, [, c]) => n + c, 0);
  const intro = heading.nextElementSibling.textContent;
  assert.match(
    intro,
    new RegExp(`${total} checks for ${expected.length} requirements of WCAG 2\\.2 \\(A, AA\\)`)
  );
  // Closed until asked for.
  assert.ok(rows.every((row) => !row.open));
  // Each facet: its label, steps, and what passes and fails.
  const facet = rows[0].querySelector('.manual-facet');
  assert.ok(facet.querySelector('ol li'));
  assert.match(facet.textContent, /Passes when:/);
  assert.match(facet.textContent, /which fails WCAG 1\.1\.1/);
});

test('each criterion shows its outcome in the scan', () => {
  const result = scan({ profile: 'wcag22-aa' });
  const d = doc(renderHtmlReport(result));
  const row = (sc) =>
    [...d.querySelectorAll('details.manual-req')].find(
      (r) => r.querySelector('.sc-cell').textContent === sc
    );
  // The image with no alt fails 1.1.1.
  assert.match(row('1.1.1').querySelector('summary').textContent, /Scan: Fail/);
  // A criterion no rule tests says so.
  const untested = [...d.querySelectorAll('details.manual-req summary')].find((s) =>
    /No rule tests it/.test(s.textContent)
  );
  assert.ok(untested);
});

test('its levels are the ones the scan reported', () => {
  const aaa = doc(renderHtmlReport(scan()));
  assert.match(
    aaa.getElementById('manual-checks-heading').nextElementSibling.textContent,
    /WCAG 2\.2 \(A, AA, AAA\)/
  );
  const aa = doc(renderHtmlReport(scan({ profile: 'wcag22-aa' })));
  assert.match(
    aa.getElementById('manual-checks-heading').nextElementSibling.textContent,
    /\(A, AA\)/
  );
});

test('manualChecks: false leaves it out', () => {
  const html = renderHtmlReport(scan(), { manualChecks: false });
  assert.ok(!html.includes('manual-checks-heading'));
});

test('in another language, its words are the report’s, and English text says so', () => {
  const d = doc(renderHtmlReport(scan({ locale: 'fr', profile: 'wcag22-aa' })));
  assert.equal(
    d.getElementById('manual-checks-heading').textContent,
    'Ce qui reste à vérifier par une personne'
  );
  const facet = d.querySelector('.manual-facet');
  assert.equal(facet.querySelector('.manual-label strong').getAttribute('lang'), 'en');
  assert.equal(facet.querySelector('ol').getAttribute('lang'), 'en');
  assert.match(
    facet.querySelector('.manual-meta').textContent,
    /Outils : Les outils de développement/
  );
  // In English, nothing needs marking.
  const en = doc(renderHtmlReport(scan({ profile: 'wcag22-aa' })));
  assert.equal(en.querySelector('.manual-list [lang]'), null);
});

test('a pack’s standard, where the scan ran its profile', () => {
  const requirements = { '1.0': { 'R-1.4.3': { title: 'Contrast', wcagSc: ['1.4.3'] } } };
  const ruleMap = { '1.0': { 'contrast-minimum': { requirements: ['R-1.4.3'] } } };
  const std = ruleMappedStandard({
    standard: 'Std M',
    tag: 'stdm',
    versions: [{ version: '1.0', wcagVersion: '2.2' }],
    requirements,
    ruleMap,
    applicability: 'wcag'
  });
  const pack = definePack({
    name: 'stdm-pack',
    version: '1.0.0',
    namespace: 'stdm',
    core: '*',
    standard: {
      key: 'stdm',
      standard: 'Std M',
      versions: ['1.0'],
      ruleTag: 'stdm',
      ruleMapped: true,
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate,
      procedures: std.procedures,
      profiles: {
        'stdm-1.0': { version: '1.0', tags: ['stdm'], mappedRules: true, wcagVersion: '2.2' }
      }
    }
  });
  const result = scan({ packs: [pack], profile: 'stdm-1.0' });
  const d = doc(renderHtmlReport(result, { packs: [pack] }));
  assert.match(
    d.getElementById('manual-checks-heading').nextElementSibling.textContent,
    /of Std M 1\.0\./
  );
  const rows = [...d.querySelectorAll('details.manual-req summary')];
  assert.equal(rows.length, 1);
  assert.match(rows[0].textContent, /^R-1\.4\.3 Contrast Scan: Fail/);
  // Without the packs, the report can't read the pack's standard: WCAG's.
  const wcag = doc(renderHtmlReport(result));
  assert.match(
    wcag.getElementById('manual-checks-heading').nextElementSibling.textContent,
    /of WCAG 2\.2/
  );
});

test('the browser report carries no procedures', () => {
  const bundle = fs.readFileSync(path.join(__dirname, '..', 'surea11y.report.js'), 'utf8');
  assert.ok(!bundle.includes('wcag_1.1.1_text-alternative-mechanism_step1'));
  assert.ok(!bundle.includes('listProceduresFrom'));
});

test('core’s rules find nothing failing on a report with it, in jsdom', () => {
  for (const locale of ['en', 'ja']) {
    const report = renderHtmlReport(scan({ locale, profile: 'wcag22-aa' }));
    const r = runa11yCoreOnHtml(report, { engineOptions: { profile: 'wcag22-aa' } });
    assert.deepEqual(
      r.checksResults.filter((c) => c.outcome === 'fail').map((c) => c.ruleId),
      [],
      locale
    );
  }
});

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  chromium = null;
}
function findExecutable() {
  if (!chromium) return null;
  const candidates = [];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  if (process.env.CHROMIUM_EXECUTABLE_PATH) candidates.push(process.env.CHROMIUM_EXECUTABLE_PATH);
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}
const executablePath = findExecutable();
const skip = !chromium
  ? 'playwright not installed'
  : !executablePath
    ? 'no Chromium build found (set CHROMIUM_EXECUTABLE_PATH)'
    : false;

test(
  'core’s rules find nothing failing on it in Chromium, opened, light and dark',
  { skip },
  async (t) => {
    const { addBundle } = require('./helpers/browserBundle');
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const report = renderHtmlReport(scan({ profile: 'wcag22-aa' }));
    for (const colorScheme of ['light', 'dark']) {
      await t.test(colorScheme, async () => {
        const page = await browser.newPage({ colorScheme });
        try {
          await page.setContent(report);
          await page.evaluate(() => {
            for (const d of document.querySelectorAll('details.manual-req')) d.open = true;
          });
          await addBundle(page);
          const result = await page.evaluate(() =>
            window.a11ycore.runa11yCoreInPage(
              '#manual-checks-heading ~ .manual-list',
              null,
              { profile: 'wcag22-aa' },
              null
            )
          );
          const fails = result.checksResults
            .filter((c) => c.outcome === 'fail')
            .map((c) => `${c.ruleId}: ${c.occurrences.map((o) => o.selector).join(', ')}`);
          assert.deepEqual(fails, []);
        } finally {
          await page.close();
        }
      });
    }
  }
);
