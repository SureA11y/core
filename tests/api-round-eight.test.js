'use strict';

/**
 * The integrator's API: what the eighth stress test found (round 8, PK-*,
 * RO-*, NW-*). Selection lists given as a Set, criteria WCAG 2.2 removed,
 * the caller's English messages, the catalog under strictOptions, reporter
 * switches, standard data, profile lists, timestamps and page values quoted
 * whole.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const core = require('../src/index.js');
const { runa11yCoreOnHtml } = require('../src/testing.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a"><button></button></main></body></html>';

// Runs `fn` with window/document set to a page of `html`, console.warn
// collected rather than printed.
function withPage(html, fn) {
  const dom = new JSDOM(html);
  const saved = { window: global.window, document: global.document, warn: console.warn };
  const warnings = [];
  global.window = dom.window;
  global.document = dom.window.document;
  console.warn = (...a) => warnings.push(a.map(String).join(' '));
  try {
    return fn(warnings, dom.window);
  } finally {
    global.window = saved.window;
    global.document = saved.document;
    console.warn = saved.warn;
  }
}

test('runOnly { type, values } reads a Set of names as its list (PK-2)', () => {
  withPage(HTML, () => {
    const ids = (ro) =>
      core.runDomRulesInPage(null, null, {}, ro).checksResults.map((c) => c.ruleId);
    assert.deepEqual(ids({ type: 'rule', values: new Set(['img-alt-present']) }), [
      'img-alt-present'
    ]);
    assert.deepEqual(
      ids({ type: 'tag', values: new Set(['wcag2a']) }).sort(),
      ids({ type: 'tag', values: ['wcag2a'] }).sort()
    );
    assert.deepEqual(ids({ includeRuleIds: new Set(['img-alt-present']) }), ['img-alt-present']);
    assert.throws(
      () =>
        core.runDomRulesInPage(null, null, {}, { type: 'rule', values: new Set(['no-such-rule']) }),
      { code: 'INVALID_RUN_ONLY' }
    );
    assert.deepEqual(
      core
        .getChecksForRunOnly({ type: 'rule', values: new Set(['img-alt-present']) })
        .map((d) => d.ruleId),
      ['img-alt-present']
    );
  });
});

test('a custom or pack rule mapped only to 4.1.1 does not fail a WCAG 2.2 scan (PK-3)', () => {
  const { definePack } = require('../src/pack.js');
  const page = '<html lang="en"><head><title>t</title></head><body><p>x</p></body></html>';
  const meta = {
    title: 'Parsing check',
    description: 'd',
    tags: ['wcag2a', 'wcag411'],
    wcagSc: ['4.1.1']
  };
  const run = () => ({ outcome: 'fail', occurrences: [{ selector: 'p' }] });
  const pack = definePack({
    name: 'acme-pack',
    version: '1.0.0',
    namespace: 'acme',
    core: '*',
    rules: [{ id: 'acme-parse', meta, runInPage: run }]
  });
  for (const [id, eo] of [
    ['org-parse', { customRules: [{ id: 'org-parse', meta, runInPage: run }] }],
    ['acme-parse', { packs: [pack] }]
  ]) {
    const r = runa11yCoreOnHtml(page, { engineOptions: { ...eo, profile: 'wcag22-aa' } });
    const c = r.checksResults.find((x) => x.ruleId === id);
    assert.equal(c.outcome, 'cantTell', id);
    assert.deepEqual(c.wcagVersionScope.removedSc, ['4.1.1'], id);
    const rollup = r.rulesResults.find((x) => x.ruleId === 'wcag-4.1.1-parsing');
    assert.equal(rollup.outcome, 'cantTell', id);
  }
  // Beside a criterion 2.2 keeps, the fail stands.
  const both = { ...meta, tags: ['wcag2a', 'wcag411', 'wcag111'], wcagSc: ['4.1.1', '1.1.1'] };
  const r = runa11yCoreOnHtml(page, {
    engineOptions: { customRules: [{ id: 'org-both', meta: both, runInPage: run }] },
    runOnly: ['org-both']
  });
  assert.equal(r.checksResults[0].outcome, 'fail');
});

test("the caller's messages.en is the English fallback (PK-4)", () => {
  const page = '<html lang="en"><head><title>t</title></head><body><p id="a">x</p></body></html>';
  const rule = {
    id: 'org-i',
    meta: {
      title: 'Org title',
      description: 'd',
      tags: ['wcag2a', 'wcag111'],
      wcagSc: ['1.1.1'],
      i18n: { titleKey: 'org_i_title' }
    },
    runInPage:
      "function(ctx){ return { outcome: 'fail', occurrences: [{ selector: '#a', i18n: { summaryKey: 'org_i_summary', params: { n: 3 } } }] }; }"
  };
  const messages = { en: { org_i_summary: 'English summary {{n}}', org_i_title: 'English title' } };
  for (const locale of ['en', 'de', 'fr-CA', 'ko']) {
    const r = runa11yCoreOnHtml(page, {
      engineOptions: { customRules: [rule], messages, locale },
      runOnly: ['org-i']
    });
    assert.equal(r.checksResults[0].title, 'English title', locale);
    assert.equal(r.checksResults[0].occurrences[0].summary, 'English summary 3', locale);
  }
  // A built-in string overridden in English applies under a locale that
  // fell back to English.
  const r = runa11yCoreOnHtml(HTML, {
    engineOptions: { locale: 'ko', messages: { en: { img_altPresent_title: 'Own title' } } },
    runOnly: ['img-alt-present']
  });
  assert.equal(r.engine.locale.resolved, 'en');
  assert.equal(r.checksResults[0].title, 'Own title');
});

test('the catalog functions refuse under strictOptions what the scan refuses (PK-5)', () => {
  const S = (o) => ({ strictOptions: true, ...o });
  const refused = [
    S({ mappings: ['nope'] }),
    S({ optInRules: ['nope'] }),
    S({ policyContract: 'nope' }),
    S({ rules: { 'no-such-rule': { x: 1 } } }),
    S({ contrast: { rootCanvasFallback: 'inherit' } }),
    S({ contrast: { rootCanvasFallback: 'transparent' } }),
    S({ profile: 'nope' })
  ];
  const fns = {
    getChecksCatalog: (eo) => core.getChecksCatalog(eo),
    getRulesCatalog: (eo) => core.getRulesCatalog(eo),
    getCheckDefById: (eo) => core.getCheckDefById('img-alt-present', eo),
    getCompositeRuleById: (eo) => core.getCompositeRuleById('wcag-1.1.1', eo),
    getChecksForRunOnly: (eo) => core.getChecksForRunOnly(null, eo),
    getRulesForRunOnly: (eo) => core.getRulesForRunOnly(null, eo),
    getTestsForRunOnly: (eo) => core.getTestsForRunOnly(null, eo)
  };
  for (const eo of refused) {
    for (const [name, fn] of Object.entries(fns)) {
      assert.throws(
        () => fn(eo),
        { code: 'INVALID_ENGINE_OPTIONS' },
        name + ' ' + JSON.stringify(eo)
      );
    }
  }
  // Valid values still pass.
  for (const eo of [
    S({ mappings: ['en301549'], optInRules: ['all'], policyContract: 'generic' }),
    S({ rules: { 'IMG-ALT-PRESENT': { excludeSelectors: ['main'] } } }),
    S({ contrast: { rootCanvasFallback: 'black' } }),
    S({ contrast: { rootCanvasFallback: '#000' } })
  ]) {
    for (const fn of Object.values(fns)) fn(eo);
  }
  // Selectors are tested against the page's document, where there is one.
  withPage(HTML, () => {
    for (const eo of [
      S({ excludeSelectors: ['main['] }),
      S({ rules: { 'img-alt-present': { excludeSelectors: ['[[['] } } })
    ]) {
      for (const [name, fn] of Object.entries(fns)) {
        assert.throws(
          () => fn(eo),
          { code: 'INVALID_ENGINE_OPTIONS' },
          name + ' ' + JSON.stringify(eo)
        );
      }
    }
  });
});

test('reporter switches are true or false, as the others are (PK-8)', () => {
  const { renderJunitReport } = require('../src/junit.js');
  const { renderHtmlReport } = require('../src/report.js');
  const r = runa11yCoreOnHtml(HTML, { runOnly: ['img-alt-present', 'button-name-present'] });
  for (const v of ['true', 1, 'yes']) {
    assert.throws(() => renderJunitReport(r, { includeNotApplicable: v }), TypeError, String(v));
  }
  for (const v of ['false', 'no', 0]) {
    assert.throws(() => renderHtmlReport(r, { manualChecks: v }), TypeError, String(v));
  }
  renderJunitReport(r, { includeNotApplicable: true });
  renderHtmlReport(r, { manualChecks: false });
});

test('standard data that holds itself or nests too deep is a problem, not a RangeError (PK-9)', () => {
  const { checkStandardData, standardFromData } = require('../src/pack.js');
  const cyclic = { format: 'surea11y-standard/1', key: 'x' };
  cyclic.self = cyclic;
  const deep = { format: 'surea11y-standard/1', key: 'x' };
  let c = deep;
  for (let i = 0; i < 20000; i++) c = c.a = {};
  for (const data of [cyclic, deep]) {
    const problems = checkStandardData(data);
    assert.ok(problems.length > 0);
    assert.throws(() => standardFromData(data), TypeError);
  }
  assert.match(checkStandardData(cyclic)[0], /holds itself/);
});
