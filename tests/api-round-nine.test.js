'use strict';

/**
 * The integrator's API: what the ninth stress test found (round 9, A9-*).
 * Locale keys in the caller's messages, the HTML report's links, the
 * catalog's rollups, packs the scan can't prepare, reporter options, the
 * procedures' filters, standard data and baseline keys.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../src/testing.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"><button></button></main></body></html>';

const titleOf = (result, ruleId) => result.checksResults.find((c) => c.ruleId === ruleId).title;

test('a messages key differing in case from the locale is used, over the built-in dictionary (A9-3)', () => {
  const { getCheckDefById } = require('../src/index.js');
  const german = getCheckDefById('button-name-present', { locale: 'de' }).title;
  assert.notEqual(german, getCheckDefById('button-name-present').title);
  for (const [locale, key] of [
    ['de', 'DE'],
    ['DE', 'De'],
    ['De', 'de']
  ]) {
    const result = runa11yCoreOnHtml(PAGE, {
      engineOptions: { locale, messages: { [key]: { img_altPresent_title: 'Eigener Text' } } }
    });
    assert.equal(titleOf(result, 'img-alt-present'), 'Eigener Text', `${locale} / ${key}`);
    assert.equal(titleOf(result, 'button-name-present'), german, `${locale} / ${key}`);
    assert.equal(result.engine.locale.reason, 'ok', `${locale} / ${key}`);
  }
  // The English fallback reads the caller's English in any case too.
  const result = runa11yCoreOnHtml(PAGE, {
    engineOptions: {
      locale: 'fr',
      messages: { EN: { acme_title: 'Acme' } },
      customRules: [
        {
          id: 'acme-x',
          meta: { title: 't', i18n: { titleKey: 'acme_title' } },
          runInPage: "() => ({ outcome: 'pass', occurrences: [] })"
        }
      ]
    }
  });
  assert.equal(titleOf(result, 'acme-x'), 'Acme');
});

test("the HTML report's Understanding link names the criterion in the report's language (A9-6)", () => {
  const { renderHtmlReport } = require('../src/report.js');
  const links = (locale, engineOptions = {}) =>
    renderHtmlReport(
      runa11yCoreOnHtml(PAGE, {
        engineOptions: { locale, ...engineOptions },
        entryPointParity: false
      })
    ).match(/<p class="card-help">.*?<\/p>/g) || [];
  const of = (list, sc) => list.find((l) => l.includes(`>${sc} `) || l.includes(` ${sc} `));
  assert.match(of(links('de'), '1.1.1'), />1\.1\.1 Nicht-Text-Inhalt verstehen</);
  assert.match(of(links('fr'), '1.1.1'), />Comprendre 1\.1\.1 Contenu non textuel</);
  assert.match(of(links('en'), '1.1.1'), />Understanding 1\.1\.1 Non-text Content</);
  // A title the dictionaries don't translate (WCAG 2.1's "Parsing") stays
  // English, marked as such.
  const parsing = links('de', {
    wcagVersion: '2.1',
    customRules: [
      {
        id: 'acme-parse',
        meta: { title: 't', wcagSc: ['4.1.1'] },
        runInPage: "() => ({ outcome: 'fail', occurrences: [{ selector: 'img' }] })"
      }
    ]
  });
  assert.match(of(parsing, '4.1.1'), />4\.1\.1 <span lang="en">Parsing<\/span> verstehen</);
});

test('a rollup catalog entry has its title and description in the locale, as a rule entry has (A9-7)', () => {
  const core = require('../src/index.js');
  const id = 'wcag-1.1.1-non-text-content';
  const german = runa11yCoreOnHtml(PAGE, {
    engineOptions: { locale: 'de' },
    entryPointParity: false
  }).rulesResults.find((r) => r.ruleId === id);
  const entries = [
    core.getRulesCatalog({ locale: 'de' }).find((e) => e.id === id),
    core.getCompositeRuleById(id, { locale: 'de' }),
    core.getRulesForRunOnly(['img-alt-present'], { locale: 'de' }).find((e) => e.id === id)
  ];
  for (const entry of entries) {
    assert.equal(entry.title, german.title);
    assert.equal(entry.description, german.description);
    assert.equal(entry.meta.title, german.title);
    assert.deepEqual(entry.i18n, german.i18n);
  }
  assert.notEqual(german.title, core.getCompositeRuleById(id).title);
  assert.equal(core.getCompositeRuleById(id).title, core.getCompositeRuleById(id).meta.title);
  for (const entry of core.getRulesCatalog({ optInRules: 'all' })) {
    assert.equal(typeof entry.title, 'string', entry.id);
    assert.ok(entry.title, entry.id);
  }
});

test('the reporters read null options as none, and warn about a misspelt one (A9-11)', () => {
  const { renderSarifReport } = require('../src/sarif.js');
  const { renderJunitReport } = require('../src/junit.js');
  const { renderEarlReport } = require('../src/earl.js');
  const { renderHtmlReport } = require('../src/report.js');
  const { buildBaselineEntries } = require('../src/baseline.js');
  const result = runa11yCoreOnHtml(PAGE, { entryPointParity: false });
  const saved = console.warn;
  const warnings = [];
  console.warn = (...a) => warnings.push(a.map(String).join(' '));
  try {
    assert.equal(renderSarifReport(result, null), renderSarifReport(result));
    assert.equal(renderJunitReport(result, null), renderJunitReport(result));
    assert.deepEqual(renderEarlReport(result, null), renderEarlReport(result));
    assert.equal(
      renderHtmlReport({ ...result, timestamp: '2026-01-01T00:00:00Z' }, null),
      renderHtmlReport({ ...result, timestamp: '2026-01-01T00:00:00Z' })
    );
    assert.deepEqual(warnings, []);

    const entries = buildBaselineEntries(result);
    renderSarifReport(result, { baseline: entries });
    renderJunitReport(result, { cantTelAs: 'failure' });
    renderEarlReport(result, { mod: 'earl:automatic' });
    renderHtmlReport(result, { titel: 'Scan' });
    assert.deepEqual(warnings, [
      '[surea11y] renderSarifReport: unknown option "baseline" (did you mean "baselineEntries"?); ignored.',
      '[surea11y] renderJunitReport: unknown option "cantTelAs" (did you mean "cantTellAs"?); ignored.',
      '[surea11y] renderEarlReport: unknown option "mod" (did you mean "mode"?); ignored.',
      '[surea11y] renderHtmlReport: unknown option "titel" (did you mean "title"?); ignored.'
    ]);
    // An option of another reporter is not taken for a misspelling.
    warnings.length = 0;
    renderSarifReport(result, { cantTellAs: 'failure', name: 'x', toolVersion: '1.0.0' });
    assert.deepEqual(warnings, []);
  } finally {
    console.warn = saved;
  }
});

test('the procedures refuse an unknown tool or automation level, and read a numeric version (A9-12)', () => {
  const core = require('../src/index.js');
  const { listProceduresFrom } = require('../src/procedures-core.js');
  const en = require('../src/i18n/procedures/en.json');
  for (const list of [core.listProcedures, core.procedureChecklist]) {
    assert.throws(() => list({ tools: ['screenreader'] }), /unknown tool screenreader; one of/);
    assert.throws(() => list({ tools: 'screen-reader, zoom' }), /unknown tool screen-reader, zoom/);
    assert.throws(() => list({ automation: 'manuel' }), /unknown automation level manuel; one of/);
    assert.throws(() => list({ levels: ['AAAA'] }), /unknown WCAG level AAAA/);
    assert.equal(list({ version: 2.1 }).version, '2.1');
    assert.equal(list({ version: 2 }).version, '2.0');
    assert.deepEqual(list({ version: 2.1, levels: 'A' }), list({ version: '2.1', levels: 'A' }));
  }
  assert.ok(
    core.listProcedures({ tools: 'screen-reader', automation: ['manual'] }).requirements.length
  );
  assert.throws(() => listProceduresFrom({ en }, { tools: 'mouse' }), /unknown tool mouse/);
});

test('checkPack and definePack report what a scan could not prepare (A9-9)', () => {
  const { checkPack, definePack } = require('../src/pack.js');
  const base = () => ({
    name: 'zz-pack',
    version: '1.0.0',
    namespace: 'zz',
    core: '*',
    title: 'ZZ',
    profiles: { 'zz-p': { tags: [], rules: ['img-alt-present'] } },
    rollups: [{ id: 'zz-r', title: 'R', checksIds: ['img-alt-present'] }]
  });
  const variant = (from) => ({
    name: 'zz-pack',
    version: '1.0.0',
    namespace: 'zz',
    core: '*',
    variants: [{ id: 'zz-v', from, config: {}, meta: { title: 'V', wcagSc: ['1.4.3'] } }]
  });
  const refused = [
    [variant('no-such-rule'), /from names no-such-rule, which is no rule/],
    [variant('img-alt-present'), /img-alt-present declares no settings/],
    [(p) => (p.profiles['zz-p'].rules = ['img-alt-presnt']), /rules names img-alt-presnt/],
    [
      (p) => (p.profiles['zz-p'].severity = { 'nope-rule': 'critical' }),
      /severity names nope-rule/
    ],
    [
      (p) => (p.profiles['zz-p'].severity = { 'img-alt-present': 'urgent' }),
      /severity of img-alt-present must be one of/
    ],
    [
      (p) => (p.profiles['zz-p'].exclude = { rules: ['nope-rule'] }),
      /exclude.rules names nope-rule/
    ],
    [(p) => (p.rollups[0].checksIds = ['nope-rule']), /references unknown testId: nope-rule/]
  ];
  for (const [change, reason] of refused) {
    let pack = base();
    if (typeof change === 'function') change(pack);
    else pack = change;
    assert.match(checkPack(pack).join('\n'), reason);
    assert.throws(() => definePack(pack), reason);
    // As a scan finds it.
    const result = runa11yCoreOnHtml(PAGE, {
      engineOptions: { packs: [pack] },
      entryPointParity: false
    });
    assert.match(result.skippedPacks[0].reason, reason);
  }
  // A profile key it has no field for, and a tag no rule carries, are
  // reported; the pack still loads.
  const odd = base();
  odd.profiles['zz-p'].rule = ['region'];
  odd.profiles['zz-p'].tags = ['wcag2zz', 'wcag22a'];
  assert.deepEqual(checkPack(odd), [
    'profiles.zz-p has no field "rule"; a profile takes tags, rules, exclude, severity, wcagVersion, keepsParsing',
    'profiles.zz-p: no rule carries the tag wcag2zz, so it selects nothing'
  ]);
  assert.doesNotThrow(() => definePack(odd));
  assert.deepEqual(checkPack(base()), []);
});
