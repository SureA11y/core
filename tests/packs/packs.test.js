'use strict';

/**
 * engineOptions.packs (src/pack.js): what a pack must be, what a scan does
 * with packs that are wrong on their own or together, that the same packs
 * are prepared once, and that a scan without packs is core's, unchanged.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const main = require('../../src/index.js');
const core = require('../../src/core.js');
const { definePack, checkPack, preparePacks, satisfiesRange } = require('../../src/pack.js');
const { version } = require('../../package.json');

const PAGE =
  '<!doctype html><html><head><title>t</title></head><body><main>' +
  '<p style="color:#767676;background:#fff">Grey text</p></main></body></html>';

function scan(run, engineOptions) {
  const dom = new JSDOM(PAGE, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    return run('https://example.test/', null, {
      timestamp: '2026-10-08T00:00:00.000Z',
      ...engineOptions
    });
  } finally {
    dom.window.close();
  }
}

// A company's house rules: one rule of its own and a stricter variant of a
// core rule, with English and French messages.
const acme = () =>
  definePack({
    name: '@acme/a11y-rules',
    version: '1.2.0',
    namespace: 'acme',
    core: `^${version}`,
    rules: [
      {
        id: 'acme-lang-present',
        meta: {
          title: 'The page states its language',
          tags: ['acme'],
          i18n: { titleKey: 'acmeLangPresent_title', descriptionKey: 'acmeLangPresent_description' }
        },
        runInPage(ctx) {
          const lang = ctx.document.documentElement.getAttribute('lang');
          return lang
            ? { outcome: 'pass' }
            : { outcome: 'fail', occurrences: [{ __node: ctx.document.documentElement }] };
        }
      }
    ],
    variants: [
      {
        id: 'acme-contrast-enhanced',
        from: 'contrast-minimum',
        config: { normalTextRatio: 7, largeTextRatio: 4.5 },
        meta: {
          title: 'Text contrast is at least 7:1',
          tags: ['acme'],
          i18n: {
            titleKey: 'acmeContrastEnhanced_title',
            descriptionKey: 'acmeContrastEnhanced_description'
          }
        }
      }
    ],
    dictionaries: {
      en: {
        acmeLangPresent_title: 'The page states its language',
        acmeLangPresent_description: 'Checks the lang attribute of the html element.'
      },
      fr: { acmeLangPresent_title: 'La page indique sa langue' }
    }
  });

const outcomeOf = (result, id) => {
  const r = result.checksResults.find((c) => c.ruleId === id);
  return r ? r.outcome : null;
};

test('a pack adds its rules and variants to a scan, which names it', () => {
  const pack = acme();
  const result = scan(main.runDomRulesInPage, { packs: [pack] });
  assert.deepEqual(result.engine.packs, ['@acme/a11y-rules@1.2.0']);
  assert.equal(outcomeOf(result, 'acme-lang-present'), 'fail');
  // #767676 on white is 4.54:1: core's rule passes, the 7:1 variant fails.
  assert.equal(outcomeOf(result, 'contrast-minimum'), 'pass');
  assert.equal(outcomeOf(result, 'acme-contrast-enhanced'), 'fail');
  assert.equal(result.skippedPacks, undefined);
  const fr = scan(main.runDomRulesInPage, { packs: [pack], locale: 'fr' });
  assert.equal(
    fr.checksResults.find((c) => c.ruleId === 'acme-lang-present').title,
    'La page indique sa langue'
  );
});

test('a scan without packs is the one core runs, unchanged', () => {
  for (const options of [{}, { packs: [] }, { mappings: ['en301549'] }]) {
    const expected = scan(core.runDomRulesInPage, options);
    assert.deepEqual(scan(main.runDomRulesInPage, options), expected, JSON.stringify(options));
    assert.equal(expected.engine.packs, undefined);
  }
  assert.deepEqual(main.getChecksCatalog(), core.getChecksCatalog());
  assert.deepEqual(main.getRulesCatalog(), core.getRulesCatalog());
});

test('the same pack objects are prepared once', () => {
  const pack = acme();
  assert.equal(preparePacks([pack]), preparePacks([pack]));
  assert.notEqual(preparePacks([pack]), preparePacks([acme()]));
});

test('what makes a pack invalid is named', () => {
  const ok = { name: 'p', version: '1.0.0', namespace: 'q', core: '*' };
  assert.deepEqual(checkPack(ok), []);
  const problems = (over) => checkPack({ ...ok, ...over }).join(' | ');
  assert.match(problems({ rules: [{ id: 'other-x', runInPage() {} }] }), /must start with "q-"/);
  assert.match(
    problems({ core: '^99.0.0' }),
    new RegExp(`supports core \\^99\\.0\\.0, and this is core ${version}`)
  );
  assert.match(problems({ core: 'soon' }), /core must be a range/);
  assert.match(problems({ namespace: 'wcag-x' }), /is core's/);
  assert.match(problems({ rule: [] }), /no field "rule"/);
  assert.match(problems({ rules: [{ id: 'q-x' }] }), /needs runInPage/);
  assert.match(problems({ dictionaries: { english: {} } }), /"english" is not a locale/);
  assert.throws(() => definePack({ ...ok, version: 'one' }), TypeError);
});

test('an invalid pack is skipped and listed, or throws under strictOptions', () => {
  const bad = { name: 'bad', version: '1.0.0', namespace: 'bad', core: '^99.0.0' };
  const warn = console.warn;
  const warnings = [];
  console.warn = (m) => warnings.push(String(m));
  try {
    const result = scan(main.runDomRulesInPage, { packs: [acme(), bad] });
    assert.deepEqual(result.engine.packs, ['@acme/a11y-rules@1.2.0']);
    assert.equal(result.skippedPacks.length, 1);
    assert.equal(result.skippedPacks[0].name, 'bad');
    assert.match(result.skippedPacks[0].reason, /supports core/);
    assert.ok(warnings.some((w) => /engineOptions\.packs: bad skipped/.test(w)));
  } finally {
    console.warn = warn;
  }
  assert.throws(
    () => scan(main.runDomRulesInPage, { packs: [bad], strictOptions: true }),
    /engineOptions\.packs: bad: .*supports core/
  );
});

test('a pack whose rules clash with core is skipped; packs that clash with each other throw', () => {
  const base = { version: '1.0.0', core: '*' };
  const warn = console.warn;
  console.warn = () => {};
  try {
    const clash = {
      ...base,
      name: 'clash',
      namespace: 'clash',
      dictionaries: { en: { contrastMinimum_title: 'Mine' } }
    };
    const result = scan(main.runDomRulesInPage, { packs: [clash] });
    assert.match(
      result.skippedPacks[0].reason,
      /i18n key "contrastMinimum_title" is defined in both/
    );
  } finally {
    console.warn = warn;
  }
  const one = {
    ...base,
    name: 'one',
    namespace: 'one',
    dictionaries: { en: { shared_title: 'A' } }
  };
  const two = {
    ...base,
    name: 'two',
    namespace: 'two',
    dictionaries: { en: { shared_title: 'B' } }
  };
  assert.throws(
    () => scan(main.runDomRulesInPage, { packs: [one, two] }),
    /one@1\.0\.0, two@1\.0\.0 do not hold together: .*shared_title/
  );
  assert.throws(
    () => scan(main.runDomRulesInPage, { packs: [one, { ...one }] }),
    /one is passed twice/
  );
});

test('runa11yCoreInPage has no packs: it warns, or throws under strictOptions', () => {
  const warn = console.warn;
  const warnings = [];
  console.warn = (m) => warnings.push(String(m));
  try {
    const result = scan(main.runa11yCoreInPage, { packs: [acme()] });
    assert.equal(outcomeOf(result, 'acme-lang-present'), null);
    assert.ok(warnings.some((w) => /run packs through runDomRulesInPage/.test(w)));
  } finally {
    console.warn = warn;
  }
  assert.throws(
    () => scan(main.runa11yCoreInPage, { packs: [acme()], strictOptions: true }),
    /engineOptions\.packs: .*\(strictOptions\)/
  );
});

test('satisfiesRange reads the usual ranges', () => {
  const cases = [
    ['1.11.0', '^1.10.0', true],
    ['2.0.0', '^1.10.0', false],
    ['0.3.1', '^0.3.0', true],
    ['0.4.0', '^0.3.0', false],
    ['1.10.5', '~1.10.0', true],
    ['1.11.0', '~1.10.0', false],
    ['1.10.0', '>=1.10.0 <2.0.0', true],
    ['2.0.0', '>=1.10.0 <2.0.0', false],
    ['3.0.0', '^1.0.0 || ^3.0.0', true],
    ['1.0.0', '*', true],
    ['1.0.0', '1.0.0', true],
    ['1.0.1', '1.0.0', false]
  ];
  for (const [v, range, expected] of cases)
    assert.equal(satisfiesRange(v, range), expected, `${v} ${range}`);
  assert.equal(satisfiesRange('1.0.0', 'latest'), null);
});

// The forms npm reads that were misread (#23): x-ranges and partial
// versions, a space after an operator, hyphen ranges, upper-case X, and
// npm's prerelease rule.
test('satisfiesRange reads every form npm reads, as npm does', () => {
  const cases = [
    ['1.10.0', '1.x', true],
    ['1.10.0', '1.X', true],
    ['2.0.0', '1.x', false],
    ['1.10.0', '^1', true],
    ['1.10.5', '~1.10', true],
    ['1.11.0', '~1.10', false],
    ['1.10.0', '>=2', false],
    ['1.10.0', '<2', true],
    ['1.10.0', '>= 1.0.0', true],
    ['1.10.0', '1.0.0 - 2.0.0', true],
    ['1.0.0', '1.0.0 - 2.0.0', true],
    ['2.0.1', '1.0.0 - 2.0.0', false],
    ['2.5.0', '1 - 2', true],
    // A prerelease is in a range only when the range names a prerelease of
    // the same version.
    ['1.11.0-rc.1', '^1.11.0', false],
    ['1.11.0-rc.1', '^1.10.0', false],
    ['1.11.0-rc.2', '^1.11.0-rc.1', true],
    ['1.11.0-rc.1', '>=1.11.0-rc.1 <2.0.0', true]
  ];
  for (const [v, range, expected] of cases)
    assert.equal(satisfiesRange(v, range), expected, `${v} ${range}`);
  // Not ranges: what npm doesn't read, and an empty range or alternative
  // (or one with only build metadata), which npm reads as any version.
  for (const range of [
    '',
    '||',
    '^1.10.0 ||',
    '|| ^1.10.0',
    '+10',
    '1.x.0',
    '*.1',
    '==1.2.3',
    '1 2 3 -'
  ])
    assert.equal(satisfiesRange('1.10.0', range), null, JSON.stringify(range));
});

// npm's own reader is the reference: the same answer for every version and
// range of a grid of the forms npm documents, combined.
test('satisfiesRange agrees with npm semver', () => {
  const semver = require('semver');
  const versions = [];
  for (const M of ['0', '1', '2']) {
    for (const m of ['0', '1', '10']) {
      for (const p of ['0', '3']) {
        versions.push(`${M}.${m}.${p}`);
        for (const pre of ['0', 'rc.1', 'beta', 'alpha.10']) versions.push(`${M}.${m}.${p}-${pre}`);
      }
    }
  }
  versions.push('1.10.0+build.5', 'v1.2.3');
  const ids = ['0', '1', '10', 'x', '*'];
  const partials = ['1.2.3-beta', '1.0.0-0', '0.0.1-rc.1', '1.10.0-rc.1', 'v1.2.3', '1.2.3+b'];
  for (const M of ids) {
    partials.push(M);
    for (const m of ids) {
      partials.push(`${M}.${m}`);
      for (const p of ['0', 'x']) partials.push(`${M}.${m}.${p}`);
    }
  }
  const simple = [];
  for (const op of ['', '=', '<', '<=', '>', '>=', '^', '~', '~>']) {
    for (const p of partials) simple.push(op + p, ...(op ? [`${op} ${p}`] : []));
  }
  const ranges = new Set(simple);
  for (let i = 0; i < 300; i++) {
    const a = simple[(i * 7919) % simple.length];
    const b = simple[(i * 104729) % simple.length];
    ranges.add(`${a} ${b}`);
    ranges.add(`${a} || ${b}`);
    ranges.add(`${partials[(i * 31) % partials.length]} - ${partials[(i * 17) % partials.length]}`);
  }
  for (const a of ['*', 'x', '>=0.0.0', 'x - x', '<0.0.0-0']) ranges.add(`${a} || 1.0.0-rc.1`);
  const mismatches = [];
  for (const range of ranges) {
    const valid = semver.validRange(range) !== null;
    for (const v of versions) {
      const npm = valid ? semver.satisfies(v, range) : null;
      const ours = satisfiesRange(v, range);
      if (npm !== ours) mismatches.push(`${v} ${JSON.stringify(range)}: npm ${npm}, here ${ours}`);
    }
  }
  assert.deepEqual(mismatches.slice(0, 10), []);
});

// --- overrides -----------------------------------------------------------------

const IMG_PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<img src="a.png"></main></body></html>';

function scanImg(engineOptions) {
  const dom = new JSDOM(IMG_PAGE, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    return main.runDomRulesInPage('https://example.test/', null, engineOptions);
  } finally {
    dom.window.close();
  }
}

// A pack that replaces core's img-alt-present with a rule that always passes.
const fix = (meta, name = 'fix') =>
  definePack({
    name,
    version: '1.0.0',
    namespace: name,
    core: '*',
    overrides: ['img-alt-present'],
    rules: [{ id: 'img-alt-present', meta, runInPage: () => ({ outcome: 'pass' }) }]
  });

const rollupsWith = (result, id) =>
  result.rulesResults.filter((r) => r.data.details.checksIds.includes(id)).map((r) => r.ruleId);

test('a pack override replaces a core rule where it ran, with its texts and mapping', () => {
  const core = scanImg({ profile: 'wcag22-aa' });
  assert.equal(outcomeOf(core, 'img-alt-present'), 'fail');
  const result = scanImg({ profile: 'wcag22-aa', packs: [fix()] });
  assert.equal(outcomeOf(result, 'img-alt-present'), 'pass');
  assert.deepEqual(result.overriddenBuiltinIds, ['img-alt-present']);
  assert.deepEqual(rollupsWith(result, 'img-alt-present'), rollupsWith(core, 'img-alt-present'));
  const def = main.getCheckDefById('img-alt-present', { packs: [fix()] });
  assert.equal(def.title, main.getCheckDefById('img-alt-present').title);
  assert.deepEqual(def.tags, main.getCheckDefById('img-alt-present').tags);
});

test("an override's own title, or own mapping, replaces the core rule's as a whole", () => {
  const titled = main.getCheckDefById('img-alt-present', {
    packs: [fix({ title: 'Images carry a text alternative' })]
  });
  assert.equal(titled.title, 'Images carry a text alternative');
  assert.deepEqual(titled.wcagSc, ['1.1.1']);
  const moved = scanImg({ packs: [fix({ wcagSc: ['1.3.1'], tags: ['wcag2a', 'wcag131'] })] });
  assert.deepEqual(rollupsWith(moved, 'img-alt-present'), ['wcag-1.3.1-info-and-relationships']);
});

test('a pack rule with wcagSc maps to those criteria', () => {
  const pack = definePack({
    name: 'mapped',
    version: '1.0.0',
    namespace: 'mapped',
    core: '*',
    rules: [
      {
        id: 'mapped-lang',
        meta: { title: 'Language', tags: ['wcag2a', 'wcag311'], wcagSc: ['3.1.1'] },
        runInPage: () => ({ outcome: 'pass' })
      }
    ]
  });
  assert.deepEqual(rollupsWith(scanImg({ packs: [pack] }), 'mapped-lang'), [
    'wcag-3.1.1-language-of-page'
  ]);
});

test('an override is declared, of a core rule, by one pack', () => {
  const base = { name: 'p', version: '1.0.0', namespace: 'q', core: '*' };
  const rule = { id: 'img-alt-present', runInPage: () => ({ outcome: 'pass' }) };
  assert.match(checkPack({ ...base, rules: [rule] }).join(), /or be listed in overrides/);
  assert.match(
    checkPack({ ...base, overrides: ['img-alt-present'] }).join(),
    /rules has no rule img-alt-present/
  );
  const warn = console.warn;
  console.warn = () => {};
  try {
    const notCore = {
      ...base,
      overrides: ['q-mine'],
      rules: [{ id: 'q-mine', runInPage: () => ({ outcome: 'pass' }) }]
    };
    assert.match(
      scanImg({ packs: [notCore] }).skippedPacks[0].reason,
      /q-mine, which is no core rule/
    );
  } finally {
    console.warn = warn;
  }
  assert.throws(
    () => scanImg({ packs: [fix(undefined, 'one'), fix(undefined, 'two')] }),
    /one and two both override img-alt-present/
  );
});

// --- a checklist: profiles and rollups without a standard ------------------------

const { wcagTags } = require('../../src/pack.js');
const { renderHtmlReport } = require('../../src/report.js');

// A city's web policy: WCAG 2.2 AA less target size, and two checklist items.
const city = () =>
  definePack({
    name: '@city/web-policy',
    title: 'City web policy',
    version: '2026.1.0',
    namespace: 'city',
    core: '*',
    profiles: {
      'city-2026': { tags: wcagTags('2.2'), exclude: { rules: ['target-size-minimum'] } }
    },
    rollups: [
      { id: 'city-images', title: 'Images', checksIds: ['img-alt-present'] },
      { id: 'city-page', title: 'Page basics', checksIds: ['page-title-present'] }
    ]
  });

test("a checklist's profile runs its selection and its items as a standard's rollups", () => {
  const result = scanImg({
    packs: [city()],
    profile: 'city-2026',
    timestamp: '2026-10-09T00:00:00.000Z'
  });
  assert.equal(result.engine.profile, 'city-2026');
  assert.equal(outcomeOf(result, 'target-size-minimum'), null);
  const items = result.rulesResults.filter((r) => r.meta && r.meta.standard === 'City web policy');
  assert.deepEqual(
    items.map((r) => [r.ruleId, r.outcome]),
    [
      ['city-images', 'fail'],
      ['city-page', 'pass']
    ]
  );
  assert.deepEqual(result.standards, [{ key: 'city', standard: 'City web policy' }]);
  assert.match(renderHtmlReport(result), /<h2>City web policy rollup<\/h2>/);
  // Without its profile, the checklist's items are not produced.
  const plain = scanImg({ packs: [city()] });
  assert.ok(!plain.rulesResults.some((r) => r.ruleId.startsWith('city-')));
});

// SARIF tags a rule with the items it belongs to, and JUnit lists them
// among its criterion's properties; without the profile, nothing changes.
test("a checklist's items reach SARIF and JUnit", () => {
  const { renderSarifReport } = require('../../src/sarif.js');
  const { renderJunitReport } = require('../../src/junit.js');
  const result = scanImg({ packs: [city()], profile: 'city-2026' });
  const mappings = (id) =>
    result.checksResults
      .find((c) => c.ruleId === id)
      .meta.normativeMappings.filter((m) => m.standard === 'City web policy')
      .map((m) => m.requirement);
  assert.deepEqual(mappings('img-alt-present'), ['city-images']);
  assert.deepEqual(mappings('page-title-present'), ['city-page']);
  const rules = JSON.parse(renderSarifReport(result)).runs[0].tool.driver.rules;
  const tagsOf = (id) => rules.find((r) => r.id === id).properties.tags;
  assert.ok(tagsOf('img-alt-present').includes('city-images'));
  assert.ok(tagsOf('page-title-present').includes('city-page'));
  const junit = renderJunitReport(result);
  assert.match(junit, /<property name="city" value="city-images"\/>/);
  assert.match(junit, /<property name="city" value="city-page"\/>/);
  // A rollup has no entry for an item it isn't.
  for (const r of result.rulesResults) {
    const own = (r.meta.normativeMappings || []).filter((m) => m.standard === 'City web policy');
    assert.deepEqual(
      own.map((m) => m.requirement),
      r.ruleId.startsWith('city-') ? [r.ruleId] : [],
      r.ruleId
    );
  }
  const plain = scanImg({ packs: [city()] });
  assert.doesNotMatch(renderSarifReport(plain), /city-images/);
  assert.doesNotMatch(renderJunitReport(plain), /city-images/);
});

test('a checklist is checked like a standard', () => {
  const base = { name: 'c', version: '1.0.0', namespace: 'c', core: '*' };
  assert.match(checkPack({ ...base, profiles: {}, standard: { key: 'c' } }).join(), /not both/);
  assert.match(
    checkPack({
      ...base,
      rollups: [{ id: 'x', title: 'X', checksIds: ['img-alt-present'] }]
    }).join(),
    /rollup id "x" must start with "c-"/
  );
  assert.match(
    checkPack({ ...base, rollups: [{ id: 'c-x', title: 'X' }] }).join(),
    /needs checksIds/
  );
  assert.match(checkPack({ ...base, profiles: { 'c-1': {} } }).join(), /must have tags/);
});

// A profile's rules list: core rules it runs by id besides its tags' selection,
// or, with no tags, exactly those (and the checklist's own, by its tag).
const shop = (profiles) =>
  definePack({
    name: '@shop/policy',
    title: 'Shop policy',
    version: '1.0.0',
    namespace: 'shop',
    core: '*',
    rules: [
      {
        id: 'shop-always',
        meta: { title: 'Always passes', tags: ['shop'] },
        runInPage: () => ({ outcome: 'pass' })
      }
    ],
    profiles
  });

test("a profile's rules list adds rules by id, and with no tags runs exactly them", () => {
  const ran = (result) => result.checksResults.map((c) => c.ruleId).sort();
  const listed = scanImg({
    packs: [shop({ 'shop-quick': { tags: [], rules: ['img-alt-present', 'region'] } })],
    profile: 'shop-quick'
  });
  assert.equal(listed.engine.profile, 'shop-quick');
  assert.deepEqual(ran(listed), ['img-alt-present', 'region', 'shop-always']);
  assert.equal(outcomeOf(listed, 'img-alt-present'), 'fail');

  const added = scanImg({
    packs: [
      shop({
        'shop-full': {
          tags: wcagTags('2.2'),
          rules: ['region'],
          exclude: { rules: ['contrast-minimum'] }
        }
      })
    ],
    profile: 'shop-full'
  });
  const ids = ran(added);
  for (const id of ['img-alt-present', 'region', 'shop-always', 'page-title-present']) {
    assert.ok(ids.includes(id), id);
  }
  assert.ok(!ids.includes('contrast-minimum'));
  // Without the list, the best-practice rule is not part of a WCAG profile.
  const plain = scanImg({
    packs: [shop({ 'shop-wcag': { tags: wcagTags('2.2') } })],
    profile: 'shop-wcag'
  });
  assert.ok(!ran(plain).includes('region'));
});

test("a profile's rules list must name rules, and can't exclude one it names", () => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    for (const [profile, reason] of [
      [{ tags: [], rules: ['no-such-rule'] }, /shop-1: rules names no-such-rule, which is no rule/],
      [
        { tags: [], rules: ['region'], exclude: { rules: ['region'] } },
        /shop-1: excludes region, which its own rules list names/
      ]
    ]) {
      const result = scanImg({ packs: [shop({ 'shop-1': profile })] });
      assert.match(result.skippedPacks[0].reason, reason);
    }
  } finally {
    console.warn = warn;
  }
  assert.match(
    checkPack({
      name: 'shop',
      version: '1.0.0',
      namespace: 'shop',
      core: '*',
      profiles: { 'shop-1': { tags: [], rules: 'region' } }
    }).join(),
    /profiles\.shop-1\.rules must be a list of rule ids/
  );
});

// --- severity per profile ----------------------------------------------------------

test("a profile's severity replaces the rule's, which the result keeps", () => {
  const strict = definePack({
    name: '@city/strict',
    version: '1.0.0',
    namespace: 'strict',
    core: '*',
    profiles: {
      'strict-1': { tags: wcagTags('2.2'), severity: { 'img-alt-present': 'critical' } }
    },
    rollups: [{ id: 'strict-images', title: 'Images', checksIds: ['img-alt-present'] }]
  });
  const result = scanImg({ packs: [strict], profile: 'strict-1' });
  const check = result.checksResults.find((c) => c.ruleId === 'img-alt-present');
  assert.equal(check.severity, 'critical');
  assert.equal(check.ruleSeverity, 'serious');
  for (const id of ['strict-images', 'wcag-1.1.1-non-text-content']) {
    assert.equal(result.rulesResults.find((r) => r.ruleId === id).severity, 'critical', id);
  }
  // Under another selection the rule's own severity stands, and nothing is added.
  const plain = scanImg({ packs: [strict] }).checksResults.find(
    (c) => c.ruleId === 'img-alt-present'
  );
  assert.equal(plain.severity, 'serious');
  assert.ok(!('ruleSeverity' in plain));
});

test('a profile severity for an unknown rule or level skips the pack', () => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    for (const [severity, reason] of [
      [{ 'no-such-rule': 'critical' }, /severity names no-such-rule, which is no rule/],
      [{ 'img-alt-present': 'urgent' }, /severity of img-alt-present must be one of/]
    ]) {
      const pack = {
        name: 'sev',
        version: '1.0.0',
        namespace: 'sev',
        core: '*',
        profiles: { 'sev-1': { tags: ['wcag2a'], severity } }
      };
      assert.match(scanImg({ packs: [pack] }).skippedPacks[0].reason, reason);
    }
  } finally {
    console.warn = warn;
  }
});

// --- describing packs ----------------------------------------------------------------

const { describePacks } = require('../../src/pack.js');

test('describePacks says what each pack brings, and what is wrong with one that is invalid', () => {
  const sample = require('../fixtures/packs/sample.js');
  const [described, bad] = describePacks([sample, { name: 'bad' }]);
  assert.deepEqual(described.rules, ['sample-statement-link', 'sample-title-length']);
  assert.deepEqual(described.variants, ['sample-contrast-enhanced']);
  assert.deepEqual(described.standard.profiles, ['sample-1.0', 'sample-2.0']);
  assert.ok(described.standard.rollups.includes('sample-1.0-S1'));
  assert.deepEqual(described.locales, ['en', 'fr']);
  assert.equal(bad.name, 'bad');
  assert.ok(bad.problems.length > 0);
  const [checklist] = describePacks([city()]);
  assert.deepEqual(checklist.standard, {
    key: 'city',
    standard: 'City web policy',
    versions: ['2026.1.0'],
    profiles: ['city-2026'],
    rollups: ['city-images', 'city-page']
  });
});

test('a pack documents the probes its rules read', () => {
  const pack = {
    name: 'crawl',
    version: '1.0.0',
    namespace: 'crawl',
    core: '*',
    rules: [{ id: 'crawl-titles', runInPage: () => ({ outcome: 'pass' }) }],
    probes: {
      'crawl.pageTitles': { description: 'The titles of the site pages', readBy: ['crawl-titles'] }
    }
  };
  assert.deepEqual(describePacks([pack])[0].probes, [
    {
      path: 'crawl.pageTitles',
      description: 'The titles of the site pages',
      readBy: ['crawl-titles']
    }
  ]);
  const problems = (probes) => checkPack({ ...pack, probes }).join(' | ');
  assert.match(problems({ 'crawl pages': { description: 'x' } }), /is not a path/);
  assert.match(problems({ 'crawl.pages': {} }), /must have a description/);
  assert.match(
    problems({ 'crawl.pages': { description: 'x', readBy: ['nope'] } }),
    /no rule of the pack/
  );
});

// --- a namespace named like a core tag ----------------------------------------

// A checklist whose namespace is also a tag core's rules carry: its tag makes
// its own rule and item opt-in, and core's rules with that tag stay core's.
const named = (ns) =>
  definePack({
    name: `@named/${ns}`,
    title: 'Named',
    version: '1.0.0',
    namespace: ns,
    core: '*',
    rules: [
      {
        id: `${ns}-own`,
        meta: { title: 'Own rule', tags: [ns] },
        runInPage: () => ({ outcome: 'pass' })
      }
    ],
    profiles: { [`${ns}-p`]: { tags: ['wcag2a'] } },
    rollups: [{ id: `${ns}-item`, title: 'Item', checksIds: [`${ns}-own`] }]
  });

const ids = (result) => result.checksResults.map((c) => c.ruleId).sort();

test("a namespace named like a core tag leaves core's rules with that tag alone", () => {
  const plain = ids(scanImg({}));
  const wcag2a = ids(
    (() => {
      const dom = new JSDOM(IMG_PAGE, { url: 'https://example.test/', pretendToBeVisual: true });
      global.window = dom.window;
      global.document = dom.window.document;
      try {
        return main.runDomRulesInPage('https://example.test/', null, {}, { tags: ['wcag2a'] });
      } finally {
        dom.window.close();
      }
    })()
  );
  for (const ns of ['best-practice', 'landmarks', 'tables', 'forms']) {
    const pack = named(ns);
    assert.ok(
      plain.some((id) =>
        core.getChecksCatalog().find((d) => d.ruleId === id && (d.tags || []).includes(ns))
      ),
      ns
    );
    // A default scan runs every core rule, and not the pack's opt-in rule.
    const result = scanImg({ packs: [pack] });
    assert.deepEqual(result.skippedPacks || [], [], ns);
    assert.deepEqual(ids(result), plain, ns);
    // Its profile runs its own rule and item, beside its tags' selection:
    // not core's rules that carry the same tag.
    const profiled = scanImg({ packs: [pack], profile: `${ns}-p` });
    assert.deepEqual(ids(profiled), wcag2a.concat(`${ns}-own`).sort(), ns);
    assert.equal(profiled.rulesResults.find((r) => r.ruleId === `${ns}-item`).outcome, 'pass', ns);
    // optInRules unlocks the pack's rule only.
    assert.deepEqual(
      ids(scanImg({ packs: [pack], optInRules: [ns] })),
      plain.concat(`${ns}-own`).sort(),
      ns
    );
  }
});

test("a caller's runOnly can't name a profile's own tag", () => {
  const dom = new JSDOM(IMG_PAGE, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  const warn = console.warn;
  console.warn = () => {};
  try {
    const result = main.runDomRulesInPage(
      'https://example.test/',
      null,
      { packs: [named('acme')] },
      { tags: ['wcag2a'], ownTags: ['acme'] }
    );
    assert.ok(!ids(result).includes('acme-own'));
  } finally {
    console.warn = warn;
    dom.window.close();
  }
});

test("an override carrying the pack's tag runs where the core rule ran", () => {
  const pack = definePack({
    name: 'tagfix',
    version: '1.0.0',
    namespace: 'tagfix',
    core: '*',
    overrides: ['img-alt-present'],
    rules: [
      {
        id: 'img-alt-present',
        meta: { tags: ['tagfix'] },
        runInPage: () => ({ outcome: 'pass' })
      }
    ],
    profiles: { 'tagfix-p': { tags: ['wcag2a'] } }
  });
  assert.equal(outcomeOf(scanImg({ packs: [pack] }), 'img-alt-present'), 'pass');
});

test("a namespace that starts core's rule ids is refused", () => {
  const base = { name: 'p', version: '1.0.0', core: '*' };
  for (const ns of ['img', 'aria', 'aria-hidden', 'link', 'contrast']) {
    assert.match(
      checkPack({ ...base, namespace: ns }).join(),
      new RegExp(`namespace "${ns}" starts core's rule ids, such as ${ns}-`)
    );
  }
  for (const ns of ['best-practice', 'forms', 'images', 'acme']) {
    assert.deepEqual(checkPack({ ...base, namespace: ns }), [], ns);
  }
});

// --- what a pack's names and ids may be ---------------------------------------

test("a pack's name, version and ids have core's shape", () => {
  const base = { name: 'q', version: '1.0.0', namespace: 'q', core: '*' };
  const problems = (over) => checkPack({ ...base, ...over }).join(' | ');
  const rule = (id, meta) => ({
    id,
    ...(meta === undefined ? {} : { meta }),
    runInPage: () => ({ outcome: 'pass' })
  });
  for (const name of ['My Pack', 'a@1.0.0', 'Acme', 'x\nwindow.y=1;//', '@scope', ' q']) {
    assert.match(problems({ name }), /must be a package name/, JSON.stringify(name));
  }
  for (const name of ['q', '@acme/a11y-pack', 'city-web.rules']) {
    assert.equal(problems({ name }), '', name);
  }
  for (const version of ['1.0.0garbage', '1.0.0\nx', '1.0', '01.0.0', '1.0.0-']) {
    assert.match(problems({ version }), /version must be a version/, JSON.stringify(version));
  }
  for (const version of ['1.0.0', '1.0.0-rc.1', '1.0.0+build.5', '2026.1.0']) {
    assert.equal(problems({ version }), '', version);
  }
  for (const id of ['q-', 'q- x y', 'q-A', 'q-a\u0000b', 'q-a‮b', 'q-<img>', 'q--a']) {
    assert.match(
      problems({ rules: [rule(id)] }),
      /rule id .* must be lowercase letters and digits/,
      JSON.stringify(id)
    );
  }
  assert.match(problems({ rules: [rule('q-a'), rule('q-a')] }), /q-a is defined twice/);
  assert.match(problems({ rules: [rule('q-a', 'x')] }), /q-a's meta must be an object/);
  assert.match(
    problems({ rules: [rule('q-a', { wcagSc: ['9.9.9', '1.1.1'] })] }),
    /q-a's wcagSc names no WCAG criterion: "9\.9\.9"/
  );
  assert.equal(problems({ rules: [rule('q-a', { wcagSc: ['1.1.1', '4.1.1', '2.5.8'] })] }), '');
});

test("a pack's profiles, standard and rollups are named under its namespace", () => {
  const base = { name: 'q', version: '1.0.0', namespace: 'q', core: '*' };
  const problems = (over) => checkPack({ ...base, ...over }).join(' | ');
  assert.match(
    problems({ profiles: { 'zzz-1': { tags: [] } } }),
    /profile name "zzz-1" must start with "q-"/
  );
  assert.match(
    problems({ rollups: [{ id: 'q-a b', title: 'X', checksIds: ['region'] }] }),
    /rollup id "q-a b" must be letters and digits/
  );
  assert.equal(problems({ rollups: [{ id: 'q-1.0-S1', title: 'X', checksIds: ['region'] }] }), '');
  const standard = (over) => ({
    key: 'q',
    standard: 'Q',
    versions: ['1'],
    profiles: { 'q-1': { version: '1', tags: ['q'] } },
    ruleTag: 'q',
    mappingsFor: () => [],
    composites: () => [{ id: 'q-1-a', checksIds: ['region'], meta: {} }],
    ...over
  });
  assert.equal(problems({ standard: standard() }), '');
  assert.match(
    problems({ standard: standard({ key: 'other' }) }),
    /standard\.key must be the namespace "q"/
  );
  assert.match(problems({ standard: standard({ key: 'constructor' }) }), /standard\.key must be/);
  assert.match(
    problems({ standard: standard({ ruleTag: 'best-practice' }) }),
    /ruleTag must be the namespace/
  );
  assert.match(
    problems({ standard: standard({ profiles: { 'a11y-strict': { version: '1', tags: [] } } }) }),
    /profile name "a11y-strict" must start with "q-"/
  );
  assert.match(
    problems({
      standard: standard({ composites: () => [{ id: 'zz-1.0-1', checksIds: ['region'] }] })
    }),
    /rollup id "zz-1\.0-1" must start with "q-"/
  );
  assert.match(
    problems({
      standard: standard({
        composites: () => {
          throw new Error('broken');
        }
      })
    }),
    /standard\.composites\(\) throws: broken/
  );
});

test('of two packs whose namespaces overlap, the first by name runs and the other is skipped', () => {
  const pack = (name, namespace) =>
    definePack({
      name,
      version: '1.0.0',
      namespace,
      core: '*',
      rules: [
        { id: `${namespace}-x-own`, meta: { title: 'Own' }, runInPage: () => ({ outcome: 'pass' }) }
      ]
    });
  const warn = console.warn;
  console.warn = () => {};
  try {
    for (const [a, b] of [
      [pack('b-pack', 'shared'), pack('a-pack', 'shared')],
      [pack('a-pack', 'nest'), pack('b-pack', 'nest-x')],
      [pack('a-pack', 'nest-x'), pack('b-pack', 'nest')]
    ]) {
      const result = scanImg({ packs: [a, b] });
      const [first, second] = [a, b].sort((x, y) => (x.name < y.name ? -1 : 1));
      assert.deepEqual(result.engine.packs, [`${first.name}@1.0.0`]);
      assert.equal(result.skippedPacks.length, 1);
      assert.equal(result.skippedPacks[0].name, second.name);
      assert.match(
        result.skippedPacks[0].reason,
        new RegExp(`overlaps "${first.namespace}", ${first.name}'s`)
      );
      // Fresh objects: the same ones would reuse the engine prepared above.
      const again = [a, b].map((p) => definePack({ ...p }));
      assert.throws(() => scanImg({ packs: again, strictOptions: true }), /overlaps/);
    }
    // Namespaces that only share a start are apart.
    const apart = scanImg({ packs: [pack('a-pack', 'city'), pack('b-pack', 'cityx')] });
    assert.equal(apart.engine.packs.length, 2);
  } finally {
    console.warn = warn;
  }
});

// --- the engine kept for the same packs -----------------------------------------

test('a strict call throws for a pack an earlier call skipped, from the kept engine too', () => {
  const { packScript } = require('../../src/pack.js');
  const bad = { name: 'late', version: '1.0.0', namespace: 'late', core: '^99.0.0' };
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert.equal(scanImg({ packs: [bad] }).skippedPacks[0].name, 'late');
    assert.throws(
      () => scanImg({ packs: [bad], strictOptions: true }),
      /engineOptions\.packs: late: it supports core \^99\.0\.0/
    );
    assert.throws(() => packScript([bad]), /late: it supports core \^99\.0\.0/);
  } finally {
    console.warn = warn;
  }
});

test('only pack objects find a kept engine: a string or a number is no pack', () => {
  const pack = named('kept');
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert.deepEqual(scanImg({ packs: [pack] }).engine.packs, ['@named/kept@1.0.0']);
    // Ids are given in order, so the pack above has a small one: no string
    // or number may name it.
    for (const entry of ['1', '2', '3', 1, 2, 3]) {
      const result = scanImg({ packs: [entry] });
      assert.deepEqual(result.engine.packs || [], [], JSON.stringify(entry));
      assert.equal(result.skippedPacks.length, 1, JSON.stringify(entry));
      assert.throws(() => scanImg({ packs: [entry], strictOptions: true }), /engineOptions\.packs/);
    }
  } finally {
    console.warn = warn;
  }
});

test('definePack freezes a pack, so a change after a scan throws instead of going unseen', () => {
  const pack = named('frozen');
  for (const part of [
    pack,
    pack.rules,
    pack.rules[0],
    pack.rules[0].meta,
    pack.profiles,
    pack.rollups[0]
  ]) {
    assert.ok(Object.isFrozen(part));
  }
  assert.equal(typeof pack.rules[0].runInPage, 'function');
  const before = scanImg({ packs: [pack], profile: 'frozen-p' });
  assert.throws(() => {
    pack.rules.push({ id: 'frozen-more', runInPage: () => ({ outcome: 'fail' }) });
  }, TypeError);
  assert.throws(() => {
    pack.version = '9.9.9';
  }, TypeError);
  assert.throws(() => {
    pack.rules[0].runInPage = () => ({ outcome: 'fail' });
  }, TypeError);
  const after = scanImg({ packs: [pack], profile: 'frozen-p' });
  assert.deepEqual(ids(after), ids(before));
  assert.deepEqual(after.engine.packs, ['@named/frozen@1.0.0']);
});

// --- @surea11y/core/testing runs a pack as a page has it -------------------------

const OUTSIDE = ['click here', 'read more'];

test('a pack rule reading a variable from outside its function fails its test, as in a page', () => {
  const { runa11yCoreOnHtml } = require('../../src/testing.js');
  const pack = (runInPage) =>
    definePack({
      name: 'scoped',
      version: '1.0.0',
      namespace: 'scoped',
      core: '*',
      rules: [{ id: 'scoped-link-text', meta: { title: 'Link text' }, runInPage }]
    });
  const html =
    '<!doctype html><html lang="en"><title>t</title><main><a href="/a">read more</a></main></html>';
  const options = (p) => ({ engineOptions: { packs: [p], optInRules: ['scoped'] } });
  // Self-contained: the same in the page and in Node.
  const inside = pack((ctx) => {
    const GENERIC = ['click here', 'read more'];
    const a = ctx.document.querySelector('a');
    return { outcome: GENERIC.includes(a.textContent.trim()) ? 'fail' : 'pass' };
  });
  const result = runa11yCoreOnHtml(html, options(inside));
  assert.equal(outcomeOf(result, 'scoped-link-text'), 'fail');
  // Reading OUTSIDE: it passes in Node only, and the test says why.
  const outside = pack((ctx) => {
    const a = ctx.document.querySelector('a');
    return { outcome: OUTSIDE.includes(a.textContent.trim()) ? 'fail' : 'pass' };
  });
  assert.throws(
    () => runa11yCoreOnHtml(html, options(outside)),
    /scoped-link-text reads OUTSIDE from outside its function: a page gets the rule's code alone/
  );
});
