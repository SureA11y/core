'use strict';

/**
 * The criteria of the checks a scan selects (docs/DESIGN_CHALLENGES.md, Decided).
 * A scan that named checks rather than criteria ran them and reported no
 * criterion: includeRuleIds ['link-name-present'] failed the check and left
 * rulesResults empty. The rollup of each criterion a check named on its own
 * belongs to is now reported, with the verdict rollups already give: a failing
 * check fails it, and the checks the scan did not select leave it cantTell
 * (notSelectedChild). A scan that selects its criteria gets what it got before.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const core = require('../src/index.js');
const { definePack } = require('../src/pack.js');
const { renderHtmlReport } = require('../src/report.js');
const { renderJunitReport } = require('../src/junit.js');

const UNNAMED_LINK =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><a href="/x"></a></main></body></html>';
const NAMED_LINK =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><a href="/x">Home</a></main></body></html>';
const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<img src="a.png"><a href="/x"></a><div id="a"></div><div id="a"></div>' +
  '<p style="color:#767676;background:#fff">Grey text</p></main></body></html>';

const R111 = 'wcag-1.1.1-non-text-content';
const R146 = 'wcag-1.4.6-contrast-enhanced';
const R244 = 'wcag-2.4.4-link-purpose-in-context';
const R249 = 'wcag-2.4.9-link-purpose-link-only';
const R411 = 'wcag-4.1.1-parsing';
const R412 = 'wcag-4.1.2-name';
const R258 = 'wcag-2.5.8-target-size-minimum';

function quietly(fn) {
  const { warn, info } = console;
  console.warn = () => {};
  console.info = () => {};
  try {
    return fn();
  } finally {
    console.warn = warn;
    console.info = info;
  }
}

const scan = (html, runOnly, engineOptions = {}) =>
  quietly(() => runa11yCoreOnHtml(html, { engineOptions, runOnly }));
const ids = (result) => result.rulesResults.map((r) => r.ruleId);
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id) || null;
const notSelected = (r) =>
  r.data.details.contributors.filter((c) => c.notSelected).map((c) => c.testId);
const listed = (runOnly, engineOptions) =>
  quietly(() => core.getRulesForRunOnly(runOnly, engineOptions)).map((x) => x.id);

test('a scan of named checks reports the criteria they belong to', () => {
  const result = scan(UNNAMED_LINK, { includeRuleIds: ['link-name-present'] });
  assert.deepEqual(ids(result), [R244, R249, R412]);
  for (const id of [R244, R249, R412]) {
    const r = rollup(result, id);
    assert.equal(r.outcome, 'fail');
    assert.equal(r.data.details.reasonCode, 'composite.rollup.fail.anyFail');
  }
  const check = result.checksResults.find((c) => c.ruleId === 'link-name-present');
  assert.equal(check.outcome, 'fail');
  assert.deepEqual(check.rollupIds, [R244, R249, R412]);
});

test('a passing check alone leaves its criterion partly checked', () => {
  const result = scan(NAMED_LINK, { includeRuleIds: ['link-name-present'] });
  const r = rollup(result, R244);
  assert.equal(r.outcome, 'cantTell');
  assert.equal(r.data.details.reasonCode, 'composite.rollup.cantTell.notSelectedChild');
  // The rules it did not select are missing, as before, and say why.
  const missing = r.data.details.contributors.filter((c) => c.outcome === 'missing');
  assert.ok(missing.length > 0);
  assert.ok(missing.every((c) => c.notSelected === true));
  assert.equal(r.data.details.metrics.missingCount, missing.length);
  assert.equal('notSelectedCount' in r.data.details.metrics, false);
});

test('the checks named in engineOptions.rules count as named', () => {
  const result = scan(UNNAMED_LINK, null, { rules: { include: 'link-name-present' } });
  assert.deepEqual(ids(result), [R244, R249, R412]);
});

test('a scan of named checks at level AA leaves out their AAA criteria', () => {
  const result = scan(UNNAMED_LINK, { includeRuleIds: ['link-name-present'] }, { wcagLevel: 'AA' });
  assert.deepEqual(ids(result), [R244, R412]);
});

test('a criterion tag reports its own criterion, not the other criteria of its checks', () => {
  const result = scan(UNNAMED_LINK, { tags: ['wcag244'] });
  assert.deepEqual(ids(result), [R244]);
  assert.equal(rollup(result, R244).outcome, 'fail');
});

test('a scan that selects its criteria gets only those, and none partly checked', () => {
  const cases = [
    [null, {}],
    [{ wcag: { version: '2.2', level: 'AA' } }, {}],
    [{ wcag: { version: '2.1', level: 'A' }, bestPractices: true }, {}],
    [{ tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, {}],
    [{ includeRuleIds: [R244] }, {}],
    [{ bestPractices: true }, {}],
    [null, { profile: 'wcag22-aa' }],
    [null, { profile: 'en301549-v3.2.1' }],
    [null, { profile: 'section508' }],
    [{ bestPractices: true }, { profile: 'en301549-v4.1.1' }],
    [{ wcag: { version: '2.2', level: 'AA' }, excludeRuleIds: ['link-name-present'] }, {}]
  ];
  for (const [runOnly, engineOptions] of cases) {
    const result = scan(PAGE, runOnly, engineOptions);
    const label = JSON.stringify([runOnly, engineOptions]);
    for (const r of result.rulesResults) {
      assert.notEqual(
        r.data.details.reasonCode,
        'composite.rollup.cantTell.notSelectedChild',
        label
      );
      assert.deepEqual(notSelected(r), [], label);
    }
    assert.deepEqual(listed(runOnly, engineOptions), ids(result), label);
  }
  // A named rollup is the only one, though its rules belong to others too.
  assert.deepEqual(ids(scan(PAGE, { includeRuleIds: [R244] })), [R244]);
  // A full scan reports every rollup of the catalog.
  assert.deepEqual(
    ids(scan(PAGE, null)),
    core.getRulesCatalog().map((x) => x.id)
  );
  // A WCAG target leaves out what its version removed and its level excludes.
  const target = ids(scan(PAGE, { wcag: { version: '2.2', level: 'AA' } }));
  assert.equal(target.includes(R411), false);
  assert.equal(target.includes(R146), false);
});

test("a criterion outside the run's WCAG version is not added", () => {
  assert.deepEqual(ids(scan(PAGE, { includeRuleIds: ['duplicate-id'] })), []);
  const under21 = scan(PAGE, { includeRuleIds: ['duplicate-id'] }, { wcagVersion: '2.1' });
  assert.deepEqual(ids(under21), [R411]);
  // The 2023 errata count 4.1.1 as satisfied for HTML, so the duplicate is asked about.
  assert.equal(rollup(under21, R411).outcome, 'cantTell');
  assert.deepEqual(ids(scan(PAGE, { includeRuleIds: ['target-size-minimum'] })), [R258]);
  assert.deepEqual(
    ids(scan(PAGE, { includeRuleIds: ['target-size-minimum'] }, { wcagVersion: '2.1' })),
    []
  );
});

test("a criterion above the selection's level is not added", () => {
  const runOnly = {
    includeRuleIds: ['contrast-enhanced', 'img-alt-present'],
    tags: ['wcag2a'],
    includeMode: 'or'
  };
  const result = scan(PAGE, runOnly);
  assert.ok(ids(result).includes(R111));
  assert.equal(ids(result).includes(R146), false);
  assert.ok(result.checksResults.some((c) => c.ruleId === 'contrast-enhanced'));
  assert.ok(ids(scan(PAGE, { includeRuleIds: ['contrast-enhanced'] })).includes(R146));
});

test("the selection's excludes apply to the criteria it adds", () => {
  const withRule = scan(PAGE, {
    includeRuleIds: ['img-alt-present', 'link-name-present'],
    excludeRuleIds: [R412]
  });
  assert.deepEqual(ids(withRule), [R111]);
  // A rule the caller excluded was not selected: the criterion is partly checked.
  const excluded = scan(NAMED_LINK, {
    includeRuleIds: ['link-name-present'],
    excludeRuleIds: ['link-name-quality']
  });
  assert.ok(notSelected(rollup(excluded, R244)).includes('link-name-quality'));
});

test('a custom rule named on its own adds the criteria it maps to', () => {
  const custom = {
    id: 'org-chart-alt',
    meta: { title: 'Charts are described', wcagSc: ['1.1.1'], tags: ['org'] },
    runInPage:
      "function (ctx) { return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [] }; }"
  };
  const engineOptions = { customRules: [custom] };
  for (const runOnly of [{ includeRuleIds: ['org-chart-alt'] }, { tags: ['org'] }]) {
    const result = scan(PAGE, runOnly, engineOptions);
    assert.deepEqual(ids(result), [R111]);
    const r = rollup(result, R111);
    assert.equal(r.outcome, 'fail');
    assert.deepEqual(r.data.details.customChecksIds, ['org-chart-alt']);
    assert.deepEqual(listed(runOnly, engineOptions), [R111]);
  }
});

// Only WCAG's own tags name criteria; a custom tag that merely starts with
// "wcag" names the rule, as any other custom tag does.
test('a custom tag starting with "wcag" adds the criteria its rule maps to', () => {
  const custom = {
    id: 'org-chart-alt',
    meta: { title: 'Charts are described', wcagSc: ['1.1.1'], tags: ['wcagteam'] },
    runInPage:
      "function (ctx) { return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [] }; }"
  };
  const engineOptions = { customRules: [custom] };
  const runOnly = { tags: ['wcagteam'] };
  const result = scan(PAGE, runOnly, engineOptions);
  assert.deepEqual(ids(result), [R111]);
  assert.equal(rollup(result, R111).outcome, 'fail');
  assert.deepEqual(result.checksResults.find((c) => c.ruleId === 'org-chart-alt').rollupIds, [
    R111
  ]);
  assert.deepEqual(listed(runOnly, engineOptions), [R111]);
});

// An organisation's checklist whose profile names rules rather than WCAG
// tags, with a stricter variant of a core rule and an exclusion.
const city = () =>
  definePack({
    name: '@city/web-policy',
    title: 'City web policy',
    version: '2026.1.0',
    namespace: 'city',
    core: '*',
    variants: [
      {
        id: 'city-contrast-enhanced',
        from: 'contrast-minimum',
        config: { normalTextRatio: 7, largeTextRatio: 4.5 },
        meta: {
          title: 'Text contrast is at least 7:1',
          tags: ['wcag2aaa', 'wcag146'],
          wcagSc: ['1.4.6'],
          i18n: {
            titleKey: 'cityContrastEnhanced_title',
            descriptionKey: 'cityContrastEnhanced_description'
          }
        }
      }
    ],
    dictionaries: {
      en: {
        cityContrastEnhanced_title: 'Text contrast is at least 7:1',
        cityContrastEnhanced_description: 'Checks text against 7:1.'
      }
    },
    profiles: {
      'city-quick': {
        tags: [],
        rules: ['img-alt-present', 'city-contrast-enhanced'],
        exclude: { rules: ['area-alt-present'] }
      },
      'city-21': { tags: [], rules: ['img-alt-present'], wcagVersion: '2.1' }
    },
    rollups: [{ id: 'city-images', title: 'Images', checksIds: ['img-alt-present'] }]
  });

function scanWithPack(engineOptions, runOnly = null) {
  const dom = new JSDOM(PAGE, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    return quietly(() =>
      core.runDomRulesInPage('https://example.test/', null, engineOptions, runOnly)
    );
  } finally {
    dom.window.close();
  }
}

test('a checklist profile that names rules gets their criteria, and its own items', () => {
  const pack = city();
  const engineOptions = { packs: [pack], profile: 'city-quick' };
  const result = scanWithPack(engineOptions);
  assert.equal(result.engine.profile, 'city-quick');
  assert.deepEqual(ids(result), [R111, R146, 'city-images']);
  assert.deepEqual(listed(null, engineOptions), ids(result));
  // The variant counts in its criterion's rollup.
  const contrast = rollup(result, R146);
  assert.ok(contrast.data.details.checksIds.includes('city-contrast-enhanced'));
  assert.equal(contrast.outcome, 'fail');
  // A rule the profile excludes narrows the criterion: missing, not "not selected".
  const images = rollup(result, R111);
  const area = images.data.details.contributors.find((c) => c.testId === 'area-alt-present');
  assert.equal(area.outcome, 'missing');
  assert.equal(area.notSelected, undefined);
  assert.ok(notSelected(images).length > 0);
});

test("a checklist profile's WCAG version gates the criteria it adds", () => {
  const result = scanWithPack({ packs: [city()], profile: 'city-21' });
  assert.equal(result.engine.wcagVersion, '2.1');
  assert.deepEqual(ids(result), [R111, 'city-images']);
});

test('a pack rule named by id in a WCAG scan adds no checklist item', () => {
  const engineOptions = { packs: [city()] };
  const result = scanWithPack(engineOptions, { includeRuleIds: ['img-alt-present'] });
  assert.deepEqual(ids(result), [R111]);
  assert.deepEqual(listed({ includeRuleIds: ['img-alt-present'] }, engineOptions), [R111]);
});

test('JUnit reads a partly checked criterion as cantTell', () => {
  const xml = renderJunitReport(scan(NAMED_LINK, { includeRuleIds: ['link-name-present'] }));
  const suite = xml.slice(xml.indexOf('WCAG 2.4.4'));
  assert.match(
    suite.slice(0, suite.indexOf('</properties>')),
    /criterionOutcome" value="cantTell"/
  );
});

test('the HTML report says a criterion was checked in part', () => {
  const partly = renderHtmlReport(scan(NAMED_LINK, { includeRuleIds: ['link-name-present'] }));
  assert.match(partly, /Partly checked: 1 of 2 checks was not selected for this scan/);
  const whole = renderHtmlReport(scan(NAMED_LINK, { wcag: { version: '2.2', level: 'AA' } }));
  assert.doesNotMatch(whole, /not selected for this scan/);
  // Its rules all ran, and check only part of what 2.4.4 asks.
  assert.match(whole, /Partly checked: its checks cover only part of this criterion/);
});

// --- engineOptions.wcagLevel ----------------------------------------------------

// A scan meant as WCAG 2.2 AA that names contrast-computable, which checks
// 1.4.3 (AA) and 1.4.6 (AAA), can't give its level in the selection without
// changing what runs. engineOptions.wcagLevel gives it, and gates what is
// reported only.
const CONTRAST =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<p style="color:#777;background:#fff">Grey text</p></main></body></html>';
const R143 = 'wcag-1.4.3-contrast-minimum';
const contrastIds = (result) => ids(result).filter((id) => id === R143 || id === R146);

function warnings(fn) {
  const { warn, info } = console;
  const warned = [];
  console.warn = (m) => warned.push(String(m));
  console.info = () => {};
  try {
    return { value: fn(), warned };
  } finally {
    console.warn = warn;
    console.info = info;
  }
}

test('wcagLevel leaves out the criteria above it that a named check belongs to', () => {
  const runOnly = { includeRuleIds: ['contrast-computable'] };
  const aa = scan(CONTRAST, runOnly, { wcagLevel: 'AA' });
  assert.deepEqual(ids(aa), [R143]);
  assert.equal(
    rollup(aa, R143).data.details.reasonCode,
    'composite.rollup.cantTell.notSelectedChild'
  );
  assert.equal(aa.engine.wcagLevel, 'AA');
  assert.deepEqual(contrastIds(scan(CONTRAST, runOnly, { wcagLevel: 'aaa' })), [R143, R146]);
  assert.equal(scan(CONTRAST, runOnly, { wcagLevel: 'aaa' }).engine.wcagLevel, 'AAA');
  const none = scan(CONTRAST, runOnly);
  assert.deepEqual(contrastIds(none), [R143, R146]);
  assert.equal('wcagLevel' in none.engine, false);
});

test('wcagLevel gates reporting, never what runs', () => {
  const runOnly = { includeRuleIds: ['region', 'contrast-enhanced', 'contrast-computable'] };
  const result = scan(CONTRAST, runOnly, { wcagLevel: 'AA' });
  assert.deepEqual(result.checksResults.map((c) => c.ruleId).sort(), [
    'contrast-computable',
    'contrast-enhanced',
    'region'
  ]);
  assert.deepEqual(contrastIds(result), [R143]);
  // A full scan at AA runs every rule and reports no AAA criterion.
  const full = scan(CONTRAST, null, { wcagLevel: 'AA' });
  assert.equal(full.checksResults.length, scan(CONTRAST, null).checksResults.length);
  assert.ok(full.checksResults.some((c) => c.ruleId === 'contrast-enhanced'));
  assert.equal(ids(full).includes(R146), false);
  assert.ok(ids(scan(CONTRAST, null)).includes(R146));
});

test('wcagLevel wins over the level the selection implies', () => {
  const target = { wcag: { version: '2.2', level: 'AAA' } };
  assert.equal(ids(scan(CONTRAST, target, { wcagLevel: 'AA' })).includes(R146), false);
  // The result records the level the criteria were gated by, whichever gave it.
  assert.equal(scan(CONTRAST, target, { wcagLevel: 'AA' }).engine.wcagLevel, 'AA');
  assert.equal(scan(CONTRAST, target).engine.wcagLevel, 'AAA');
  const tags = {
    tags: ['wcag2a', 'wcag2aa'],
    includeRuleIds: ['contrast-enhanced'],
    includeMode: 'or'
  };
  assert.equal(ids(scan(CONTRAST, tags)).includes(R146), false);
  assert.ok(ids(scan(CONTRAST, tags, { wcagLevel: 'AAA' })).includes(R146));
  // A conflict is not warned about, as for wcagVersion.
  const { warned } = warnings(() =>
    runa11yCoreOnHtml(CONTRAST, { engineOptions: { wcagLevel: 'AA' }, runOnly: target })
  );
  assert.deepEqual(warned, []);
});

test('a rollup named by id is reported whatever wcagLevel says', () => {
  const named = scan(CONTRAST, { includeRuleIds: [R146] }, { wcagLevel: 'AA' });
  assert.deepEqual(ids(named), [R146]);
  // A level the selection's own tags imply still gates it, as before.
  const byTags = scan(CONTRAST, { includeRuleIds: [R146], tags: ['wcag2a', 'wcag2aa'] });
  assert.deepEqual(ids(byTags), []);
  assert.deepEqual(ids(scan(CONTRAST, { includeRuleIds: [R146], tags: ['wcag2aaa'] })), [R146]);
});

test('getRulesForRunOnly honors wcagLevel, with and without packs', () => {
  for (const [runOnly, engineOptions] of [
    [{ includeRuleIds: ['contrast-computable'] }, { wcagLevel: 'AA' }],
    [null, { wcagLevel: 'A' }],
    [{ includeRuleIds: [R146] }, { wcagLevel: 'AA' }],
    [null, { packs: [city()], profile: 'city-quick', wcagLevel: 'AA' }]
  ]) {
    const result = scan(CONTRAST, runOnly, engineOptions);
    assert.deepEqual(listed(runOnly, engineOptions), ids(result), JSON.stringify(runOnly));
  }
  const checklist = scan(CONTRAST, null, {
    packs: [city()],
    profile: 'city-quick',
    wcagLevel: 'AA'
  });
  assert.deepEqual(ids(checklist), [R111, 'city-images']);
});

test('an invalid wcagLevel is ignored with a warning, and throws under strictOptions', () => {
  for (const value of ['AA+', 'level AA', 2, '']) {
    const { value: result, warned } = warnings(() =>
      runa11yCoreOnHtml(CONTRAST, {
        engineOptions: { wcagLevel: value },
        runOnly: { includeRuleIds: ['contrast-computable'] }
      })
    );
    assert.deepEqual(contrastIds(result), [R143, R146], String(value));
    assert.equal('wcagLevel' in result.engine, false);
    assert.ok(
      warned.some((m) => m.startsWith('[surea11y] engineOptions.wcagLevel: ignoring')),
      String(value)
    );
    assert.throws(
      () =>
        runa11yCoreOnHtml(CONTRAST, {
          engineOptions: { wcagLevel: value, strictOptions: true },
          entryPointParity: false
        }),
      (err) => err.code === 'INVALID_ENGINE_OPTIONS' && /wcagLevel/.test(err.message)
    );
  }
});

// The catalog functions take a scan's options, but didn't check them:
// getRulesForRunOnly with wcagLevel: 'AA+' listed every level, where a scan
// throws under strictOptions and warns otherwise.
test('the catalog functions check their options as a scan does', () => {
  const runOnly = { includeRuleIds: ['contrast-computable'] };
  const CATALOG = {
    getRulesForRunOnly: (eo) => core.getRulesForRunOnly(runOnly, eo),
    getChecksForRunOnly: (eo) => core.getChecksForRunOnly(runOnly, eo),
    getTestsForRunOnly: (eo) => core.getTestsForRunOnly(runOnly, eo),
    getRulesCatalog: (eo) => core.getRulesCatalog(eo),
    getChecksCatalog: (eo) => core.getChecksCatalog(eo),
    getCheckDefById: (eo) => core.getCheckDefById('contrast-computable', eo),
    getCompositeRuleById: (eo) => core.getCompositeRuleById(R143, eo)
  };
  const scanWarnings = (engineOptions) =>
    warnings(() => runa11yCoreOnHtml(CONTRAST, { engineOptions, runOnly, entryPointParity: false }))
      .warned;
  for (const bad of [{ wcagLevel: 'AA+' }, { wcagVersion: '3.0' }, { wcagLevle: 'AA' }]) {
    const said = scanWarnings(bad);
    assert.equal(said.length, 1, JSON.stringify(bad));
    for (const [name, list] of Object.entries(CATALOG)) {
      const label = `${name} ${JSON.stringify(bad)}`;
      assert.deepEqual(warnings(() => list(bad)).warned, said, label);
      assert.throws(
        () => list({ ...bad, strictOptions: true }),
        (err) => err.code === 'INVALID_ENGINE_OPTIONS',
        label
      );
    }
  }
  for (const [name, list] of Object.entries(CATALOG)) {
    assert.deepEqual(warnings(() => list({ wcagLevel: 'AA', strictOptions: true })).warned, []);
    assert.deepEqual(warnings(() => list(undefined)).warned, [], name);
  }
  // The level is read as not given, as in the scan.
  assert.deepEqual(
    quietly(() => core.getRulesForRunOnly(runOnly, { wcagLevel: 'AA+' })).map((r) => r.id),
    ids(scan(CONTRAST, runOnly, { wcagLevel: 'AA+' }))
  );
  // With packs, the pack's engine checks them.
  assert.throws(
    () => core.getRulesForRunOnly(null, { packs: [city()], wcagLevel: 'AA+', strictOptions: true }),
    (err) => err.code === 'INVALID_ENGINE_OPTIONS'
  );
});
