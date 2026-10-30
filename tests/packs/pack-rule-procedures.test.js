'use strict';

// A pack's own rules in the procedures read by criterion (docs/PROCEDURES.md,
// "A pack's rules"): a rule that claims a facet (meta.coverage.facetsBySc,
// or facetsByRequirement for its pack's own requirements) is in that facet's
// rules, and the reason codes of its meta.review filed under the facet are
// its variants, each exactly that finding's howToCheck. A pack's dictionary
// may translate the steps, English staying the fallback.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const main = require('../../src/index.js');
const { checkPack, definePack, ruleMappedStandard } = require('../../src/pack.js');
const { proceduresFrom } = require('../../src/procedures-core.js');
const { applyHowToCheck } = require('../../src/how-to-check-core.js');

const { proceduresFor, howToCheckFor } = main;

const steps = (word) => ({
  steps: [`Find the ${word} the report names.`, `Read the ${word}.`],
  passWhen: `The ${word} is fine.`,
  failWhen: `The ${word} is not, which fails WCAG.`
});

// Asks about every link on the page: one facet, every code under it.
const linkRule = (review = { VAGUE: steps('link'), SHORT: steps('short link') }) => ({
  id: 'acme-link-words',
  meta: {
    title: 'Link words',
    i18n: { titleKey: 'acmeLinkWords_title', descriptionKey: 'acmeLinkWords_description' },
    wcagSc: ['2.4.4'],
    coverage: { facetsBySc: { '2.4.4': ['link-text-descriptive-evidence'] } },
    reasonCodes: Object.keys(review),
    review
  },
  runInPage(ctx) {
    return {
      outcome: 'cantTell',
      occurrences: Object.keys(review).map((code) => ({
        __node: ctx.document.body,
        data: { details: { reasonCode: code } }
      }))
    };
  }
});

// Claims a facet under two criteria, and one other: each code names where
// it goes.
const keyRule = (review) => ({
  id: 'acme-keys',
  meta: {
    title: 'Keys',
    i18n: { titleKey: 'acmeKeys_title', descriptionKey: 'acmeKeys_description' },
    wcagSc: ['2.1.1', '2.1.3'],
    coverage: {
      facetsBySc: {
        '2.1.1': ['click-handler-keyboard-operable', 'server-side-image-map-absent'],
        '2.1.3': ['click-handler-keyboard-operable']
      }
    },
    review
  },
  runInPage: () => ({ outcome: 'pass', occurrences: [] })
});

const KEY_REVIEW = {
  CLICK: { ...steps('control'), facet: 'click-handler-keyboard-operable', criterion: '2.1.1' },
  CLICK_ALL: { ...steps('widget'), facet: 'click-handler-keyboard-operable', criterion: '2.1.3' },
  MAP: { ...steps('image map'), facet: 'server-side-image-map-absent' }
};

const pack = (over = {}) =>
  definePack({
    name: '@acme/words',
    version: '1.0.0',
    namespace: 'acme',
    core: '*',
    rules: [linkRule(), keyRule(KEY_REVIEW)].concat(over.rules || []),
    ...(over.variants ? { variants: over.variants } : {}),
    ...(over.overrides ? { overrides: over.overrides } : {}),
    ...(over.dictionaries ? { dictionaries: over.dictionaries } : {})
  });

const facetOf = (procedures, id) => procedures.facets.find((f) => f.id === id);
const packVariants = (facet) => facet.variants.filter((v) => v.ruleId.startsWith('acme-'));

test('a rule that claims one facet is in its rules, with every code as a variant', () => {
  const p = pack();
  const r = proceduresFor('2.4.4', { packs: [p] });
  const core = proceduresFor('2.4.4');
  const facet = facetOf(r, 'link-text-descriptive-evidence');
  assert.ok(facet.rules.includes('acme-link-words'));
  assert.deepEqual(
    packVariants(facet).map((v) => v.reasonCode),
    ['VAGUE', 'SHORT']
  );
  for (const v of packVariants(facet)) {
    assert.deepEqual(
      { steps: v.steps, passWhen: v.passWhen, failWhen: v.failWhen },
      howToCheckFor('acme-link-words', v.reasonCode, 'en', { packs: [p] })
    );
  }
  // Core's rules and variants come first, as they are.
  const coreFacet = facetOf(core, 'link-text-descriptive-evidence');
  assert.deepEqual(facet.rules.slice(0, coreFacet.rules.length), coreFacet.rules);
  assert.deepEqual(facet.variants.slice(0, coreFacet.variants.length), coreFacet.variants);
  // The criterion's rules: its wcagSc.
  assert.deepEqual(r.rules, core.rules.concat('acme-link-words'));
  // Facets it doesn't claim are as core has them.
  assert.deepEqual(facetOf(r, 'link-name-present'), facetOf(core, 'link-name-present'));
});

test('a rule that claims several facets files each code where its entry says', () => {
  const p = pack();
  const under = (sc, facet) =>
    packVariants(facetOf(proceduresFor(sc, { packs: [p] }), facet)).map((v) => v.reasonCode);
  assert.deepEqual(under('2.1.1', 'click-handler-keyboard-operable'), ['CLICK']);
  assert.deepEqual(under('2.1.3', 'click-handler-keyboard-operable'), ['CLICK_ALL']);
  assert.deepEqual(under('2.1.1', 'server-side-image-map-absent'), ['MAP']);
  for (const [sc, facet] of [
    ['2.1.1', 'click-handler-keyboard-operable'],
    ['2.1.3', 'click-handler-keyboard-operable'],
    ['2.1.1', 'server-side-image-map-absent']
  ]) {
    assert.ok(facetOf(proceduresFor(sc, { packs: [p] }), facet).rules.includes('acme-keys'));
  }
  // Naming no facet, its codes are under none, though it is in the rules of
  // each facet it claims: as before facet existed, and definePack takes it.
  const plain = Object.fromEntries(
    Object.entries(KEY_REVIEW).map(([code, e]) => [
      code,
      { steps: e.steps, passWhen: e.passWhen, failWhen: e.failWhen }
    ])
  );
  const unnamed = definePack({
    name: '@acme/keys',
    version: '1.0.0',
    namespace: 'acme',
    core: '*',
    rules: [keyRule(plain)]
  });
  const facet = facetOf(
    proceduresFor('2.1.1', { packs: [unnamed] }),
    'click-handler-keyboard-operable'
  );
  assert.ok(facet.rules.includes('acme-keys'));
  assert.deepEqual(packVariants(facet), []);
});

test('a variant of a core rule lists only the steps it gives; an override is core’s', () => {
  const p = pack({
    variants: [
      {
        id: 'acme-name',
        from: 'link-name-present',
        meta: {
          title: 'Link names',
          i18n: { titleKey: 'acmeName_title', descriptionKey: 'acmeName_description' },
          wcagSc: ['2.4.4'],
          coverage: { facetsBySc: { '2.4.4': ['link-name-present'] } },
          review: { OWN_CODE: steps('name') }
        }
      }
    ]
  });
  const facet = facetOf(proceduresFor('2.4.4', { packs: [p] }), 'link-name-present');
  assert.ok(facet.rules.includes('acme-name'));
  assert.deepEqual(
    packVariants(facet).map((v) => [v.ruleId, v.reasonCode]),
    [['acme-name', 'OWN_CODE']]
  );

  const coreRule = 'link-name-present';
  const override = definePack({
    name: '@acme/override',
    version: '1.0.0',
    namespace: 'acme',
    core: '*',
    overrides: [coreRule],
    rules: [
      {
        id: coreRule,
        meta: {
          coverage: { facetsBySc: { '2.4.4': ['link-text-descriptive-evidence'] } },
          i18n: { titleKey: 'acmeOverride_title' },
          review: { X: steps('link') }
        },
        runInPage: () => ({ outcome: 'pass', occurrences: [] })
      }
    ]
  });
  assert.deepEqual(proceduresFor('2.4.4', { packs: [override] }), proceduresFor('2.4.4'));
});

test('a pack’s dictionary translates its steps, as the finding shows them', () => {
  const p = pack({
    dictionaries: {
      en: {},
      fr: {
        acmeLinkWords_review_VAGUE_step1: 'Trouver le lien.',
        acmeLinkWords_review_VAGUE_pass: 'Le lien convient.',
        acmeLinkWords_review_VAGUE_fail: 'Le lien ne convient pas.'
      }
    }
  });
  const vague = (locale) =>
    packVariants(
      facetOf(proceduresFor('2.4.4', { packs: [p], locale }), 'link-text-descriptive-evidence')
    ).find((v) => v.reasonCode === 'VAGUE');
  const fr = vague('fr-CA');
  // English says how many steps; a step French lacks is in English.
  assert.deepEqual(fr.steps, ['Trouver le lien.', 'Read the link.']);
  assert.equal(fr.passWhen, 'Le lien convient.');
  assert.deepEqual(
    { steps: fr.steps, passWhen: fr.passWhen, failWhen: fr.failWhen },
    howToCheckFor('acme-link-words', 'VAGUE', 'fr-CA', { packs: [p] })
  );
  // A locale the pack has no dictionary for: English.
  assert.equal(vague('de').passWhen, 'The link is fine.');

  // A scan in French shows them; applyHowToCheck gives them again in French.
  const dom = new JSDOM('<!doctype html><html lang="fr"><body><a href="/">x</a></body></html>', {
    url: 'https://example.test/',
    pretendToBeVisual: true
  });
  global.window = dom.window;
  global.document = dom.window.document;
  let result;
  try {
    result = main.runDomRulesInPage(null, null, { packs: [p], locale: 'fr' }, ['acme-link-words']);
  } finally {
    dom.window.close();
  }
  const occ = result.checksResults
    .find((c) => c.ruleId === 'acme-link-words')
    .occurrences.find((o) => o.data.details.reasonCode === 'VAGUE');
  assert.equal(occ.howToCheck.passWhen, 'Le lien convient.');
  const review = { en: require('../../src/i18n/review/en.json') };
  const again = applyHowToCheck(result, review, { packs: [p], locale: 'en' });
  assert.equal(
    again.checksResults
      .find((c) => c.ruleId === 'acme-link-words')
      .occurrences.find((o) => o.data.details.reasonCode === 'VAGUE').howToCheck.passWhen,
    'The link is fine.'
  );
});

test('proceduresFrom gives what proceduresFor gives, with the packs', () => {
  const p = pack({ dictionaries: { fr: { acmeLinkWords_review_SHORT_pass: 'Court.' } } });
  const dicts = Object.fromEntries(
    ['en', 'fr'].map((l) => [l, require(`../../src/i18n/procedures/${l}.json`)])
  );
  for (const id of ['2.4.4', '2.1.1', '2.1.3']) {
    for (const locale of ['en', 'fr']) {
      assert.deepEqual(
        proceduresFrom(dicts, id, { packs: [p], locale }),
        proceduresFor(id, { packs: [p], locale })
      );
    }
  }
});

// A standard with a requirement of its own, and a rule claiming its facet.
const OWN = {
  title: 'A text version of every form',
  facets: [
    {
      id: 'text-version',
      label: 'Each form can be had as a text document',
      steps: ['Find each form on the page.'],
      passWhen: 'Every form has a text version.',
      failWhen: 'A form has no text version, which fails requirement R-9.'
    },
    {
      id: 'text-version-current',
      label: 'The text version says what the form does',
      steps: ['Open the text version.'],
      passWhen: 'It matches the form.',
      failWhen: 'It does not, which fails requirement R-9.'
    }
  ]
};
function standardPack(facetsByRequirement, review = { NO_TEXT: steps('form') }) {
  const std = ruleMappedStandard({
    standard: 'Std P',
    tag: 'stdp',
    versions: [{ version: '1.0', wcagVersion: '2.2' }],
    requirements: { '1.0': { 'R-9': { title: OWN.title, wcagSc: [] } } },
    ruleMap: { '1.0': { 'stdp-text-version': { requirements: ['R-9'] } } }
  });
  return {
    name: 'stdp-pack',
    version: '1.0.0',
    namespace: 'stdp',
    core: '*',
    rules: [
      {
        id: 'stdp-text-version',
        meta: {
          title: 'Text version',
          i18n: {
            titleKey: 'stdpTextVersion_title',
            descriptionKey: 'stdpTextVersion_description'
          },
          tags: ['stdp'],
          wcagSc: [],
          coverage: { facetsBySc: {}, facetsByRequirement },
          review
        },
        runInPage: () => ({ outcome: 'pass', occurrences: [] })
      }
    ],
    standard: {
      key: 'stdp',
      standard: 'Std P',
      versions: ['1.0'],
      ruleTag: 'stdp',
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate,
      procedures: { '1.0': { 'R-9': OWN } }
    }
  };
}

test('a pack’s own requirement lists the rules that claim its facets', () => {
  const p = definePack(standardPack({ 'R-9': ['text-version'] }));
  const r = proceduresFor('R-9', { packs: [p], standard: 'stdp' });
  assert.deepEqual(r.rules, ['stdp-text-version']);
  assert.deepEqual(r.facets[0].rules, ['stdp-text-version']);
  assert.deepEqual(r.facets[0].variants, [
    { ruleId: 'stdp-text-version', reasonCode: 'NO_TEXT', ...steps('form') }
  ]);
  assert.deepEqual(r.facets[1].rules, []);
  assert.deepEqual(r.facets[1].variants, []);
});

test('definePack checks where codes are filed', () => {
  const problems = (rule) =>
    checkPack({ name: '@acme/p', version: '1.0.0', namespace: 'acme', core: '*', rules: [rule] });
  assert.deepEqual(problems(keyRule(KEY_REVIEW)), []);
  const withEntry = (code, entry) =>
    problems(keyRule({ ...KEY_REVIEW, [code]: { ...steps('x'), ...entry } })).join('\n');
  assert.match(
    withEntry('MAP', { facet: 'link-name-present' }),
    /MAP\.facet "link-name-present" is not a facet acme-keys claims/
  );
  assert.match(
    withEntry('CLICK', { facet: 'click-handler-keyboard-operable' }),
    /CLICK\.criterion must say which of "2\.1\.1", "2\.1\.3"/
  );
  assert.match(
    withEntry('CLICK', { facet: 'click-handler-keyboard-operable', criterion: '1.1.1' }),
    /CLICK\.criterion "1\.1\.1": acme-keys claims click-handler-keyboard-operable under "2\.1\.1", "2\.1\.3"/
  );
  assert.match(withEntry('MAP', { criterion: '2.1.1' }), /MAP\.criterion needs the facet/);
  assert.match(withEntry('OTHER', {}), /OTHER needs facet: acme-keys claims several facets/);
  // One facet: facet may be left out, or name it.
  assert.deepEqual(problems(linkRule({ A: steps('a') })), []);
  assert.deepEqual(
    problems(linkRule({ A: { ...steps('a'), facet: 'link-text-descriptive-evidence' } })),
    []
  );
});

test('definePack checks facetsByRequirement', () => {
  assert.deepEqual(checkPack(standardPack({ 'R-9': ['text-version'] })), []);
  assert.match(
    checkPack(standardPack({ 'R-9': ['nothing'] })).join('\n'),
    /facetsByRequirement\["R-9"\]: "nothing" is not one of its facets/
  );
  assert.match(
    checkPack(standardPack({ 'R-1': ['text-version'] })).join('\n'),
    /"R-1" is no requirement with facets of its own/
  );
  assert.match(
    checkPack(standardPack({ 'R-9': [] })).join('\n'),
    /facetsByRequirement\["R-9"\] must list facet ids/
  );
  const noStandard = { ...standardPack({ 'R-9': ['text-version'] }) };
  delete noStandard.standard;
  assert.match(checkPack(noStandard).join('\n'), /needs the pack's standard/);
  // Facets of two kinds: the requirement's facet is one a code can name.
  const both = standardPack(
    { 'R-9': ['text-version', 'text-version-current'] },
    {
      NO_TEXT: { ...steps('form'), facet: 'text-version' },
      OLD: { ...steps('text'), facet: 'text-version-current' }
    }
  );
  assert.deepEqual(checkPack(both), []);
  const r = proceduresFor('R-9', { packs: [definePack(both)] });
  assert.deepEqual(
    r.facets.map((f) => f.variants.map((v) => v.reasonCode)),
    [['NO_TEXT'], ['OLD']]
  );
});

test('definePack checks a dictionary’s translated steps', () => {
  const problems = (dictionaries) =>
    checkPack({
      name: '@acme/p',
      version: '1.0.0',
      namespace: 'acme',
      core: '*',
      rules: [linkRule()],
      dictionaries
    }).join('\n');
  assert.equal(
    problems({
      fr: { acmeLinkWords_review_VAGUE_step2: 'x', acmeLinkWords_review_VAGUE_fail: 'y' }
    }),
    ''
  );
  assert.match(
    problems({ en: { acmeLinkWords_review_VAGUE_step1: 'x' } }),
    /English steps are its meta\.review/
  );
  assert.match(
    problems({ fr: { acmeLinkWords_review_NOPE_pass: 'x' } }),
    /meta\.review has no "NOPE"/
  );
  assert.match(
    problems({ fr: { acmeLinkWords_review_VAGUE_step3: 'x' } }),
    /meta\.review\.VAGUE has no step 3/
  );
  assert.match(
    problems({ fr: { acmeLinkWords_review_VAGUE_hint: 'x' } }),
    /ends in _step<n>, _pass or _fail/
  );
  // Other keys are the pack's messages, as before.
  assert.equal(problems({ fr: { acmeLinkWords_title: 'Mots des liens' } }), '');
});
