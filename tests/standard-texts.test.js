'use strict';

/**
 * A standard's texts by id (src/pack-languages.js, src/pack-review.js,
 * src/standard-data.js, src/derive-standard.js): translations keyed by what
 * each text is, per version, read before the English-keyed ones; a
 * standard's own review steps per version; texts in the data format, built
 * into core's procedures; and inherited by a derived standard where its
 * source is the base's.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const Ajv = require('ajv');

const {
  definePack,
  ruleMappedStandard,
  checkPack,
  packTranslationCoverage
} = require('../src/pack.js');
const {
  listProcedures,
  proceduresFor,
  procedureLanguages,
  howToCheckFor
} = require('../src/index.js');
const { checkStandardData, standardFromData } = require('../src/standard-data.js');
const { deriveStandard } = require('../src/derive-standard.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const copy = (v) => JSON.parse(JSON.stringify(v));
const validateSchema = new Ajv({ allErrors: true }).compile(
  require('../src/schemas/standard.schema.json')
);

// A standard written by hand, in English, two requirements worded alike.
function cityPack(standardFields = {}) {
  const std = ruleMappedStandard({
    standard: 'City',
    tag: 'city',
    versions: [{ version: '1', wcagVersion: '2.2' }],
    requirements: {
      1: { A: { title: 'Images', wcagSc: ['1.1.1'] }, B: { title: 'Forms', wcagSc: [] } }
    },
    ruleMap: { 1: { 'img-alt-present': { requirements: ['A'] } } }
  });
  const facet = (id) => ({
    id,
    label: 'Check it',
    steps: ['Look at the page.'],
    passWhen: 'It is fine.',
    failWhen: 'It is not, which fails {{requirement}}.'
  });
  return {
    name: 'city',
    version: '1.0.0',
    namespace: 'city',
    core: '*',
    standard: {
      key: 'city',
      standard: 'City',
      versions: ['1'],
      lang: 'en',
      profiles: { 'city-1': { version: '1', tags: ['city'], mappedRules: true } },
      ruleTag: 'city',
      ruleMapped: true,
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate,
      procedures: {
        1: {
          A: { title: 'Images', facets: [facet('a1')] },
          B: { title: 'Forms', facets: [facet('b1')] }
        }
      },
      groups: { 1: [{ id: 'g', title: 'All', requirements: ['A', 'B'] }] },
      ...standardFields
    }
  };
}

const FR = {
  'requirements.A.title': 'Images',
  'requirements.B.title': 'Formulaires',
  'requirements.A.facets.a1.label': 'Vérifiez les images',
  'requirements.A.facets.a1.steps': ['Regardez les images.'],
  'requirements.A.facets.a1.passWhen': 'Elles vont bien.',
  'requirements.A.facets.a1.failWhen': 'Non, ce qui enfreint {{requirement}}.',
  'requirements.B.facets.b1.label': 'Vérifiez les formulaires',
  'requirements.B.facets.b1.steps': ['Regardez les formulaires.'],
  'requirements.B.facets.b1.passWhen': 'Ils vont bien.',
  'requirements.B.facets.b1.failWhen': 'Non, ce qui enfreint {{requirement}}.',
  'groups.g.title': 'Tout'
};

test('texts worded alike in the source are translated apart, by id', () => {
  const pack = definePack(cityPack({ texts: { fr: { 1: FR } } }));
  const read = (id) => proceduresFor(id, { packs: [pack], standard: 'city', locale: 'fr' });
  assert.equal(read('A').facets[0].label, 'Vérifiez les images');
  assert.equal(read('B').facets[0].label, 'Vérifiez les formulaires');
  assert.equal(read('B').title, 'Formulaires');
  assert.equal(read('A').facets[0].procedure.failWhen, 'Non, ce qui enfreint City A.');
  const list = listProcedures({ packs: [pack], standard: 'city', locale: 'fr' });
  assert.deepEqual(
    list.groups.map((g) => g.title),
    ['Tout']
  );
});

test('a text without its key falls back to the English-keyed translation, a list as a whole', () => {
  const partial = copy(FR);
  delete partial['requirements.B.facets.b1.passWhen'];
  const pack = definePack(
    cityPack({ texts: { fr: { 1: partial } }, translations: { fr: { 'It is fine.': 'Ça va.' } } })
  );
  const b = proceduresFor('B', { packs: [pack], standard: 'city', locale: 'fr' });
  // passWhen comes from the English-keyed translation; the rest by id.
  assert.equal(b.facets[0].procedure.passWhen, 'Ça va.');
  assert.equal(b.facets[0].label, 'Vérifiez les formulaires');
  // Without either, the facet stays in English, whole.
  // (definePack froze the first: a fresh copy.)
  const less = copy(partial);
  delete less['requirements.A.facets.a1.steps'];
  const english = definePack(cityPack({ texts: { fr: { 1: less } } }));
  const a = proceduresFor('A', { packs: [english], standard: 'city', locale: 'fr' });
  assert.equal(a.facets[0].label, 'Check it');
  assert.deepEqual(a.facets[0].procedure.steps, ['Look at the page.']);
});

test('coverage and completeness count texts by id', () => {
  const pack = definePack(cityPack({ texts: { fr: { 1: FR } } }));
  const [fr] = packTranslationCoverage(pack);
  assert.equal(fr.locale, 'fr');
  assert.equal(fr.translated, fr.total);
  assert.deepEqual(
    procedureLanguages({ packs: [pack], standard: 'city' }).map((l) => [l.locale, l.complete]),
    [
      ['en', true],
      ['fr', true]
    ]
  );
  const less = copy(FR);
  delete less['groups.g.title'];
  const [partial] = packTranslationCoverage(definePack(cityPack({ texts: { fr: { 1: less } } })));
  assert.deepEqual(partial.missing, ['All']);
});

test('each mistake in standard.texts is named', () => {
  const problems = (texts) => checkPack(cityPack({ texts })).join('\n');
  assert.match(
    problems({ fr: { 1: { 'requirements.Z.title': 'x' } } }),
    /requirements\.Z\.title is no text/
  );
  assert.match(
    problems({ fr: { 1: { 'requirements.A.facets.a1.steps': ['a', 'b'] } } }),
    /must have 1 text, as the source has/
  );
  assert.match(problems({ fr: { 2: {} } }), /the standard has no version 2/);
  assert.match(problems({ en: {} }), /written in en, so it needs no translation into it/);
  assert.match(
    problems({ fr: { 1: { 'requirements.A.facets.a1.failWhen': 'Non.' } } }),
    /must keep the same \{\{placeholders\}\}/
  );
  assert.match(
    problems({ fr: { 1: { 'requirements.A.facets.a1.steps': 'Une.' } } }),
    /is a list in the source/
  );
});

test("a scan in the locale names a requirement's result by its title translated by id", () => {
  const pack = definePack(cityPack({ texts: { fr: { 1: FR } } }));
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
  const result = runa11yCoreOnHtml(html, {
    engineOptions: { packs: [pack], profile: 'city-1', locale: 'fr' }
  });
  const a = result.rulesResults.find((r) => r.ruleId === 'city-1-A');
  assert.equal(a.title, 'Images');
  assert.equal(a.outcome, 'fail');
});

test("a standard's own review steps can differ by version, each translated by id", () => {
  const versions = [
    { version: '1', wcagVersion: '2.2' },
    { version: '2', wcagVersion: '2.2' }
  ];
  const req = { A: { title: 'Attr', wcagSc: ['4.1.2'] } };
  const row = { 'aria-valid-attr-value': { requirements: ['A'] } };
  const std = ruleMappedStandard({
    standard: 'City',
    tag: 'city',
    versions,
    requirements: { 1: req, 2: req },
    ruleMap: { 1: row, 2: row }
  });
  const entry = (n) => ({
    steps: [`Open the popup (v${n}).`],
    passWhen: `It is a menu (v${n}).`,
    failWhen: `It is not, which fails City ${n === 1 ? 'A' : 'A.1'}.`
  });
  const stem = 'review.aria-valid-attr-value.ARIA_HASPOPUP_ROLE_MISMATCH';
  const pack = definePack({
    name: 'city',
    version: '1.0.0',
    namespace: 'city',
    core: '*',
    standard: {
      key: 'city',
      standard: 'City',
      versions: ['1', '2'],
      lang: 'en',
      profiles: {
        'city-1': { version: '1', tags: ['city'], mappedRules: true },
        'city-2': { version: '2', tags: ['city'], mappedRules: true }
      },
      ruleTag: 'city',
      ruleMapped: true,
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate,
      review: { 'aria-valid-attr-value': { ARIA_HASPOPUP_ROLE_MISMATCH: entry(1) } },
      reviewByVersion: {
        2: { 'aria-valid-attr-value': { ARIA_HASPOPUP_ROLE_MISMATCH: entry(2) } }
      },
      texts: {
        fr: {
          2: {
            [`${stem}.steps`]: ['Ouvrez (v2).'],
            [`${stem}.passWhen`]: 'Menu (v2).',
            [`${stem}.failWhen`]: 'Non, City A.1 (v2).'
          }
        }
      }
    }
  });
  const steps = (profile, locale) =>
    howToCheckFor('aria-valid-attr-value', 'ARIA_HASPOPUP_ROLE_MISMATCH', locale, {
      packs: [pack],
      profile
    });
  assert.equal(steps('city-1', 'en').failWhen, 'It is not, which fails City A.');
  assert.equal(steps('city-2', 'en').failWhen, 'It is not, which fails City A.1.');
  assert.deepEqual(steps('city-2', 'fr').steps, ['Ouvrez (v2).']);
  // Version 1 has no French: its English, whole.
  assert.deepEqual(steps('city-1', 'fr').steps, ['Open the popup (v1).']);
  assert.match(
    checkPack({ ...pack, standard: { ...pack.standard, reviewByVersion: { 9: {} } } }).join('\n'),
    /reviewByVersion: the standard has no version 9/
  );
});

// The same, as data: tests with procedures, a requirement's own, one with a
// note, notes, review and translations.
const data = {
  format: 'surea11y-standard/1',
  key: 'rg',
  standard: 'RG',
  lang: 'fr',
  versions: [{ version: '4', wcagVersion: '2.1' }],
  data: {
    4: {
      groups: [{ id: '1', title: 'Images', requirements: ['1.1', '1.2', '1.3'] }],
      requirements: {
        1.1: { title: 'Images porteuses', wcagSc: ['1.1.1'], tests: ['1.1.1'] },
        1.2: {
          title: 'Images décoratives',
          wcagSc: ['1.1.1'],
          procedure: {
            steps: ['Repérer les images décoratives.'],
            passWhen: 'Elles sont ignorées.',
            failWhen: 'Non, ce qui invalide {{requirement}}.',
            automation: 'partial',
            tools: ['devtools']
          }
        },
        1.3: { title: 'Légendes', wcagSc: [], note: 'Aucune règle.' }
      },
      tests: {
        '1.1.1': {
          title: 'Une <img> a un alt',
          requirements: ['1.1'],
          procedure: {
            steps: ['Retrouver les images.', 'Vérifier le alt.'],
            passWhen: 'Si oui, validé.',
            failWhen: 'Sinon, {{requirement}} est invalidé.'
          }
        }
      },
      ruleMap: { 'img-alt-present': { requirements: ['1.1.1'] } },
      notes: ['Ces procédures suivent la méthodologie.'],
      texts: {
        en: {
          'requirements.1.1.title': 'Informative images',
          'tests.1.1.1.title': 'An <img> has alt',
          'tests.1.1.1.procedure.steps': ['Find the images.', 'Check the alt.'],
          'tests.1.1.1.procedure.passWhen': 'If so, passed.',
          'tests.1.1.1.procedure.failWhen': 'If not, {{requirement}} fails.',
          'requirements.1.2.title': 'Decorative images',
          'requirements.1.2.procedure.steps': ['Find the decorative images.'],
          'requirements.1.2.procedure.passWhen': 'They are ignored.',
          'requirements.1.2.procedure.failWhen': 'No, which fails {{requirement}}.',
          'groups.1.title': 'Images',
          notes: ['These procedures follow the methodology.']
        }
      }
    }
  },
  profiles: { 'rg-4': { version: '4', tags: ['rg'], mappedRules: true } }
};

test('texts in the data pass the checker and the schema, and their mistakes are named', () => {
  assert.deepEqual(checkStandardData(data), []);
  assert.equal(validateSchema(data), true, JSON.stringify(validateSchema.errors));
  const problems = (change) => {
    const d = copy(data);
    change(d.data[4]);
    return checkStandardData(d).join('\n');
  };
  assert.match(
    problems((d) => (d.texts.en['tests.9.title'] = 'x')),
    /tests\.9\.title is no text of the version/
  );
  assert.match(
    problems((d) => (d.texts.en['tests.1.1.1.procedure.steps'] = ['one'])),
    /must be a list of 2 texts, as the source is/
  );
  assert.match(
    problems((d) => (d.texts.fr = {})),
    /written in fr, so it needs no translation into it/
  );
  assert.match(
    problems((d) => (d.texts['not a tag'] = {})),
    /"not a tag" is not a language tag/
  );
  assert.match(
    problems((d) => (d.tests['1.1.1'].procedure.steps = [])),
    /steps must list 1 to 8 steps/
  );
  assert.match(
    problems((d) => (d.requirements['1.2'].procedure.automation = 'some')),
    /automation must be one of/
  );
  for (const change of [
    (d) => (d.tests['1.1.1'].procedure.steps = []),
    (d) => (d.requirements['1.2'].procedure.automation = 'some'),
    (d) => (d.notes = [])
  ]) {
    const d = copy(data);
    change(d.data[4]);
    assert.equal(validateSchema(d), false);
  }
});

test("data's procedures, groups, notes and texts become core's", () => {
  const pack = definePack({
    name: 'rg-pack',
    version: '1.0.0',
    namespace: 'rg',
    core: '*',
    standard: standardFromData(data)
  });
  const fr = proceduresFor('1.1', { packs: [pack], standard: 'rg', locale: 'fr' });
  assert.equal(fr.title, 'Images porteuses');
  assert.equal(fr.facets[0].id, '1.1.1');
  assert.equal(fr.facets[0].label, 'Une <img> a un alt');
  assert.equal(fr.facets[0].procedure.failWhen, 'Sinon, RG 1.1 est invalidé.');
  // The core rule the mapping sends to the test is listed under its facet.
  assert.ok(fr.facets[0].rules.includes('img-alt-present'));
  const en = proceduresFor('1.1', { packs: [pack], standard: 'rg', locale: 'en' });
  assert.equal(en.title, 'Informative images');
  assert.equal(en.facets[0].label, 'An <img> has alt');
  assert.deepEqual(en.facets[0].procedure.steps, ['Find the images.', 'Check the alt.']);
  const own = proceduresFor('1.2', { packs: [pack], standard: 'rg', locale: 'en' });
  assert.equal(own.facets[0].label, 'Decorative images');
  assert.equal(own.facets[0].automation, 'partial');
  assert.equal(
    proceduresFor('1.3', { packs: [pack], standard: 'rg', locale: 'fr' }).note,
    'Aucune règle.'
  );
  const list = listProcedures({ packs: [pack], standard: 'rg', locale: 'en' });
  assert.deepEqual(list.notes, ['These procedures follow the methodology.']);
  assert.deepEqual(
    list.groups.map((g) => [g.title, g.requirements]),
    [['Images', ['1.1', '1.2', '1.3']]]
  );
});

test('a derived standard takes its base texts where its source is the base, and not where it rewords', () => {
  const own = {
    format: 'surea11y-standard/1',
    key: 'lux',
    standard: 'LUX',
    lang: 'fr',
    versions: [{ version: '1', wcagVersion: '2.1', basedOn: [{ standard: 'rg', version: '4' }] }],
    data: {
      1: {
        requirements: {
          1.1: { basedOn: [{ standard: 'rg', id: '1.1' }] },
          // Reworded: its English title is not the base's.
          1.2: { title: 'Images de décoration', basedOn: [{ standard: 'rg', id: '1.2' }] }
        },
        ruleMap: {},
        texts: { en: { 'requirements.1.2.title': 'Decoration images' } }
      }
    }
  };
  const d = deriveStandard([data], own);
  assert.deepEqual(checkStandardData(d), []);
  const en = d.data[1].texts.en;
  assert.equal(en['requirements.1.1.title'], 'Informative images');
  assert.equal(en['tests.1.1.1.title'], 'An <img> has alt');
  assert.deepEqual(en['tests.1.1.1.procedure.steps'], ['Find the images.', 'Check the alt.']);
  // Its procedure is the base's, so its translation comes too.
  assert.deepEqual(en['requirements.1.2.procedure.steps'], ['Find the decorative images.']);
  // Its own title, its own translation.
  assert.equal(en['requirements.1.2.title'], 'Decoration images');
  // Groups and notes are its own: none inherited.
  assert.equal(en['groups.1.title'], undefined);
  assert.equal(en.notes, undefined);
});

test("a derived standard takes its bases' review, its own replacing it, and two bases disagreeing is an error", () => {
  const entry = (s) => ({ steps: [`Step ${s}.`], passWhen: `Pass ${s}.`, failWhen: `Fail ${s}.` });
  const base = (key, s) => ({
    format: 'surea11y-standard/1',
    key,
    standard: key.toUpperCase(),
    versions: [{ version: '1', wcagVersion: '2.2' }],
    data: {
      1: {
        requirements: { A: { title: 'Attr', wcagSc: ['4.1.2'] } },
        ruleMap: {},
        review: { 'aria-valid-attr-value': { ARIA_HASPOPUP_ROLE_MISMATCH: entry(s) } },
        texts: {
          fr: { 'review.aria-valid-attr-value.ARIA_HASPOPUP_ROLE_MISMATCH.steps': [`Étape ${s}.`] }
        }
      }
    }
  });
  const own = (bases, extra = {}) => ({
    format: 'surea11y-standard/1',
    key: 'der',
    standard: 'DER',
    versions: [
      {
        version: '1',
        wcagVersion: '2.2',
        basedOn: bases.map((b) => ({ standard: b, version: '1' }))
      }
    ],
    data: {
      1: {
        requirements: { A: { basedOn: [{ standard: bases[0], id: 'A' }] } },
        ruleMap: {},
        ...extra
      }
    }
  });
  const one = deriveStandard([base('aa', 1)], own(['aa']));
  assert.deepEqual(one.data[1].review, {
    'aria-valid-attr-value': { ARIA_HASPOPUP_ROLE_MISMATCH: entry(1) }
  });
  assert.deepEqual(
    one.data[1].texts.fr['review.aria-valid-attr-value.ARIA_HASPOPUP_ROLE_MISMATCH.steps'],
    ['Étape 1.']
  );
  assert.throws(
    () => deriveStandard([base('aa', 1), base('bb', 2)], own(['aa', 'bb'])),
    /ARIA_HASPOPUP_ROLE_MISMATCH comes from both aa and bb; give it a review of its own/
  );
  const resolved = deriveStandard(
    [base('aa', 1), base('bb', 2)],
    own(['aa', 'bb'], {
      review: { 'aria-valid-attr-value': { ARIA_HASPOPUP_ROLE_MISMATCH: entry(3) } }
    })
  );
  assert.deepEqual(
    resolved.data[1].review['aria-valid-attr-value'].ARIA_HASPOPUP_ROLE_MISMATCH,
    entry(3)
  );
  // Its own steps differ from the bases': their translations don't come.
  assert.equal(resolved.data[1].texts, undefined);
  const dropped = deriveStandard(
    [base('aa', 1)],
    own(['aa'], { review: { 'aria-valid-attr-value': { ARIA_HASPOPUP_ROLE_MISMATCH: null } } })
  );
  assert.equal(dropped.data[1].review, undefined);
});
