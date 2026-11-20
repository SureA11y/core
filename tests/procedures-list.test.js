'use strict';

// Listing the procedures (docs/PROCEDURES.md): every requirement of a
// standard in its order and groups, a checklist of what a person does once
// each, filters, and the requirements related across WCAG and the packs'
// standards.

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  listProcedures,
  procedureChecklist,
  proceduresFor,
  relatedRequirements
} = require('../src/index.js');
const {
  listProceduresFrom,
  procedureChecklistFrom,
  proceduresFrom: proceduresFromDicts
} = require('../src/procedures-core.js');
const { checkPack, definePack } = require('../src/pack.js');
const { wcagCriteria } = require('../src/wcag.js');

const en = require('../src/i18n/procedures/en.json');
const fr = require('../src/i18n/procedures/fr.json');

const OWN_FACET = {
  id: 'text-version',
  label: 'Each form can be had as a text document',
  tools: ['keyboard'],
  steps: ['Find each form on the page.', 'Look next to it for a link to a text version.'],
  passWhen: 'Every form has a text version.',
  failWhen: 'A form has no text version, which fails {{requirement}}.'
};

function packWith(standard) {
  return {
    name: 'stdl-pack',
    version: '1.0.0',
    namespace: 'stdl',
    core: '*',
    standard: {
      key: 'stdl',
      standard: 'Std L',
      versions: ['1.0', '2.0'],
      ruleTag: 'stdl',
      mappingsFor: () => [],
      ...standard
    }
  };
}

const PROCEDURES = {
  '1.0': { 1: { wcag: '1.1.1' } },
  '2.0': {
    '1.10': { title: 'Contrast of large text', wcag: '1.4.3' },
    1.9: { title: 'Contrast', wcag: '1.4.3' },
    2: { title: 'Text alternatives', wcag: '1.1.1' },
    3: { title: 'A text version of every form', relatesTo: ['1.3.1', '4.1.2'], facets: [OWN_FACET] }
  }
};
const GROUPS = {
  '2.0': [
    {
      id: 'A',
      title: 'Seeing',
      requirements: ['2'],
      groups: [{ id: 'A.1', title: 'Colour', requirements: ['1.9', '1.10'] }]
    },
    { id: 'B', title: 'Forms', requirements: ['3'] }
  ]
};

const pack = definePack(packWith({ procedures: PROCEDURES, groups: GROUPS }));

test('WCAG is listed in a version, at levels, in order, as proceduresFor reads each', () => {
  const list = listProcedures();
  assert.equal(list.standard, 'wcag');
  assert.equal(list.version, '2.2');
  assert.deepEqual(
    list.requirements.map((r) => r.id),
    wcagCriteria('2.2').map((c) => c.sc)
  );
  for (const r of list.requirements) assert.deepEqual(r, proceduresFor(r.id));
  const aa = listProcedures({ levels: ['A', 'AA'] });
  assert.deepEqual(
    aa.requirements.map((r) => r.id),
    wcagCriteria('2.2', { levels: ['A', 'AA'] }).map((c) => c.sc)
  );
  // 4.1.1 is a Level A criterion titled "Parsing" in 2.0 and 2.1, not in 2.2.
  const parsing = listProcedures({ version: '2.0', levels: 'A' }).requirements.find(
    (r) => r.id === '4.1.1'
  );
  assert.deepEqual([parsing.title, parsing.level], ['Parsing', 'A']);
  assert.equal(listProcedures({ version: '2.1' }).requirements.length, wcagCriteria('2.1').length);
  assert.equal(listProcedures({ version: '3.0' }), null);
  assert.throws(() => listProcedures({ levels: ['AAAA'] }), /unknown WCAG level/);
  // In a locale.
  assert.deepEqual(
    listProcedures({ locale: 'fr' }).requirements[0],
    proceduresFor('1.1.1', { locale: 'fr' })
  );
});

test('WCAG’s criteria are grouped under their principles and guidelines', () => {
  const { groups, requirements } = listProcedures({ version: '2.0' });
  assert.deepEqual(
    groups.map((g) => [g.id, g.title]),
    [
      ['1', 'Perceivable'],
      ['2', 'Operable'],
      ['3', 'Understandable'],
      ['4', 'Robust']
    ]
  );
  const keyboard = groups[1].groups.find((g) => g.id === '2.1');
  assert.deepEqual(keyboard, {
    id: '2.1',
    title: 'Keyboard Accessible',
    requirements: ['2.1.1', '2.1.2', '2.1.3'],
    groups: []
  });
  // 2.0 has no 2.5: an empty guideline is left out.
  assert.ok(!groups[1].groups.some((g) => g.id === '2.5'));
  // Every criterion listed is in exactly one guideline.
  const placed = groups.flatMap((p) => p.groups.flatMap((g) => g.requirements));
  assert.deepEqual(
    placed,
    requirements.map((r) => r.id)
  );
  for (const version of ['2.1', '2.2']) {
    const list = listProcedures({ version });
    assert.deepEqual(
      list.groups.flatMap((p) => p.groups.flatMap((g) => g.requirements)),
      list.requirements.map((r) => r.id),
      version
    );
  }
});

test('the best practices are a list of one', () => {
  const list = listProcedures({ standard: 'best-practice' });
  assert.equal(list.version, null);
  assert.deepEqual(list.requirements, [proceduresFor('best-practice')]);
  assert.deepEqual(list.groups, []);
});

test('filters keep the facets that match, and the requirements left with any', () => {
  const sr = listProcedures({ tools: 'screen-reader' });
  assert.ok(sr.requirements.length > 0);
  for (const r of sr.requirements) {
    for (const f of r.facets) {
      const tools = (f.coveredBy ? r.facets.find((x) => x.id === f.coveredBy) : f).tools;
      assert.ok(
        tools.some((t) => t.id === 'screen-reader'),
        `${r.id} ${f.id}`
      );
    }
  }
  // complete stays the requirement's own.
  assert.equal(sr.requirements[0].complete, proceduresFor(sr.requirements[0].id).complete);

  const manual = listProcedures({ automation: ['manual'] });
  // A facet kept for a manual technology facet it covers may be another kind.
  for (const r of manual.requirements) {
    for (const f of r.facets) {
      const covers = r.facets.some((x) => x.coveredBy === f.id && x.automation === 'manual');
      assert.ok(f.automation === 'manual' || covers, `${r.id} ${f.id}`);
    }
  }

  // A rule's facets, each technology facet with the one it is covered by.
  const alt = listProcedures({ rules: 'img-alt-present' });
  assert.deepEqual(
    alt.requirements.map((r) => r.id),
    ['1.1.1']
  );
  const ids = alt.requirements[0].facets.map((f) => f.id);
  const tech = alt.requirements[0].facets.filter((f) => f.coveredBy);
  assert.ok(tech.length > 0);
  for (const f of tech) assert.ok(ids.includes(f.coveredBy));
  // Groups list only what is left.
  assert.deepEqual(
    alt.groups.map((g) => g.groups.map((x) => x.requirements)),
    [[['1.1.1']]]
  );
  assert.deepEqual(listProcedures({ rules: 'no-such-rule' }).requirements, []);
});

test('a checklist has each general procedure once, with the facets it covers', () => {
  const list = listProcedures({ levels: ['A', 'AA'] });
  const checklist = procedureChecklist({ levels: ['A', 'AA'] });
  assert.deepEqual([checklist.standard, checklist.version], ['wcag', '2.2']);
  assert.deepEqual(checklist.groups, list.groups);
  const expected = list.requirements.flatMap((r) =>
    r.facets.filter((f) => !f.coveredBy && f.procedure).map((f) => `${r.id}/${f.id}`)
  );
  assert.deepEqual(
    checklist.items.map((i) => i.key),
    expected
  );
  const mechanism = checklist.items.find((i) => i.key === '1.1.1/text-alternative-mechanism');
  const r111 = proceduresFor('1.1.1');
  assert.deepEqual(
    mechanism.covers,
    r111.facets.filter((f) => f.coveredBy === mechanism.facet).map((f) => f.id)
  );
  assert.ok(mechanism.rules.includes('img-alt-present'));
  assert.deepEqual(mechanism.requirements, ['1.1.1']);
  assert.equal(mechanism.wcag, '1.1.1');
  assert.deepEqual(
    mechanism.procedure,
    r111.facets.find((f) => f.id === mechanism.facet).procedure
  );
});

test('a pack’s standard is listed in its order and groups', () => {
  const list = listProcedures({ packs: [pack], standard: 'stdl' });
  assert.deepEqual([list.standard, list.key, list.version], ['Std L', 'stdl', '2.0']);
  assert.deepEqual(
    list.requirements.map((r) => r.id),
    ['1.9', '1.10', '2', '3']
  );
  for (const r of list.requirements) {
    assert.deepEqual(r, proceduresFor(r.id, { packs: [pack], standard: 'stdl' }));
  }
  assert.deepEqual(list.requirements[3].relatesTo, ['1.3.1', '4.1.2']);
  assert.deepEqual(list.groups, [
    {
      id: 'A',
      title: 'Seeing',
      requirements: ['2'],
      groups: [{ id: 'A.1', title: 'Colour', requirements: ['1.9', '1.10'], groups: [] }]
    },
    { id: 'B', title: 'Forms', requirements: ['3'], groups: [] }
  ]);
  // By name, an earlier version, which has no groups.
  const old = listProcedures({ packs: [pack], standard: 'Std L', version: '1.0' });
  assert.deepEqual(
    old.requirements.map((r) => r.id),
    ['1']
  );
  assert.deepEqual(old.groups, []);
  // A filter prunes the groups too.
  assert.deepEqual(listProcedures({ packs: [pack], standard: 'stdl', tools: 'keyboard' }).groups, [
    { id: 'B', title: 'Forms', requirements: ['3'], groups: [] }
  ]);
  assert.equal(listProcedures({ packs: [pack], standard: 'other' }), null);
  assert.equal(listProcedures({ packs: [pack], standard: 'stdl', version: '9.0' }), null);
});

test('a checklist of a pack’s standard has a criterion’s procedure once, naming each requirement', () => {
  const { items } = procedureChecklist({ packs: [pack], standard: 'stdl' });
  const contrast = items.find((i) => i.key === '1.4.3/contrast-minimum-text');
  assert.deepEqual(contrast.requirements, ['1.9', '1.10']);
  assert.match(contrast.procedure.failWhen, /fails Std L 1\.9, 1\.10\.$/);
  const own = items.find((i) => i.key === '3/text-version');
  assert.equal(own.wcag, null);
  assert.equal(own.procedure.failWhen, 'A form has no text version, which fails Std L 3.');
  // One requirement: its own name, as proceduresFor reads it.
  const alt = items.find((i) => i.key === '1.1.1/text-alternative-mechanism');
  assert.deepEqual(alt.requirements, ['2']);
  assert.match(alt.procedure.failWhen, /fails Std L 2\.$/);
});

test('related requirements go both ways', () => {
  assert.deepEqual(relatedRequirements('1.4.3', { packs: [pack] }), [
    {
      standard: 'Std L',
      key: 'stdl',
      id: '1.9',
      version: '2.0',
      title: 'Contrast',
      relation: 'restates'
    },
    {
      standard: 'Std L',
      key: 'stdl',
      id: '1.10',
      version: '2.0',
      title: 'Contrast of large text',
      relation: 'restates'
    }
  ]);
  assert.deepEqual(
    relatedRequirements('4.1.2', { packs: [pack] }).map((r) => [r.id, r.relation]),
    [['3', 'relatesTo']]
  );
  assert.deepEqual(
    relatedRequirements('3', { packs: [pack], standard: 'stdl' }).map((r) => [
      r.id,
      r.relation,
      r.level
    ]),
    [
      ['1.3.1', 'relatesTo', 'A'],
      ['4.1.2', 'relatesTo', 'A']
    ]
  );
  assert.deepEqual(relatedRequirements('1', { packs: [pack], standard: 'stdl', version: '1.0' }), [
    { standard: 'wcag', id: '1.1.1', title: 'Non-text Content', level: 'A', relation: 'restates' }
  ]);
  assert.deepEqual(relatedRequirements('1.4.3'), []);
  assert.deepEqual(relatedRequirements('9.9.9', { packs: [pack] }), []);
  assert.deepEqual(relatedRequirements('', { packs: [pack] }), []);
});

test('a pack that gives no procedures breaks nothing', () => {
  const bare = definePack(packWith({}));
  assert.equal(listProcedures({ packs: [bare], standard: 'stdl' }), null);
  assert.equal(procedureChecklist({ packs: [bare], standard: 'stdl' }), null);
  assert.deepEqual(relatedRequirements('1.4.3', { packs: [bare] }), []);
  assert.deepEqual(relatedRequirements('1', { packs: [bare], standard: 'stdl' }), []);
  assert.deepEqual(listProcedures({ packs: [bare] }), listProcedures());
  assert.deepEqual(procedureChecklist({ packs: [bare] }), procedureChecklist());
});

test('the browser forms give what the Node ones do', () => {
  for (const options of [
    { levels: ['A'] },
    { standard: 'best-practice', locale: 'fr' },
    { packs: [pack], standard: 'stdl', tools: ['keyboard', 'devtools'] }
  ]) {
    assert.deepEqual(listProceduresFrom({ en, fr }, options), listProcedures(options));
    assert.deepEqual(procedureChecklistFrom({ en, fr }, options), procedureChecklist(options));
  }
});

test('checkPack refuses groups and relatesTo it can’t read', () => {
  const problems = (standard) => checkPack(packWith(standard)).join('\n');
  assert.equal(problems({ procedures: PROCEDURES, groups: GROUPS }), '');
  assert.match(problems({ groups: GROUPS }), /standard\.groups needs standard\.procedures/);
  assert.match(problems({ procedures: PROCEDURES, groups: [] }), /standard\.groups must be/);
  assert.match(
    problems({ procedures: PROCEDURES, groups: { '3.0': [] } }),
    /"3\.0" is not one of the standard's versions/
  );
  const found = problems({
    procedures: PROCEDURES,
    groups: {
      '2.0': [
        { id: 'A', title: '', requirements: ['2', '7'] },
        { id: 'A', title: 'Again', requirements: ['2'], groups: 'x' }
      ]
    }
  });
  assert.match(found, /title must be a non-empty string/);
  assert.match(found, /"7" is no requirement of standard\.procedures\.2\.0/);
  assert.match(found, /id must be a non-empty string, unique in the version/);
  assert.match(found, /"2" is in another group already/);
  assert.match(found, /groups must list groups/);
  const relates = (entry) => problems({ procedures: { '1.0': { 1: entry } } });
  assert.match(relates({ wcag: '1.1.1', relatesTo: ['1.3.1'] }), /relatesTo goes with facets/);
  assert.match(
    relates({ facets: [OWN_FACET], relatesTo: ['9.9.9'] }),
    /relatesTo must list WCAG criteria/
  );
  assert.match(
    relates({ facets: [OWN_FACET], relatesTo: '1.3.1' }),
    /relatesTo must list WCAG criteria/
  );
});

// Every text a procedure gives says its language where it isn't the locale
// the procedure was read in (docs/PROCEDURES.md, "The shape"), so a tool
// that shows it marks each part as WCAG 3.1.2 asks: procedureLang, else
// lang, else the locale read, is a facet's procedure's.
const procedureLangOf = (r, f) => f.procedureLang || f.lang || r.locale;
// The language fields of a requirement, its facets, tools and variants.
function langsOf(r) {
  const out = [];
  if (r.titleLang) out.push(['title', r.titleLang]);
  for (const f of r.facets) {
    if (f.lang) out.push([`${f.id} label`, f.lang]);
    if (f.procedureLang) out.push([`${f.id} procedure`, f.procedureLang]);
    for (const t of f.tools) if (t.lang) out.push([`${f.id} tool ${t.id}`, t.lang]);
    for (const v of f.variants) if (v.lang) out.push([`${f.id} ${v.reasonCode}`, v.lang]);
  }
  return out;
}

test('a requirement says the locale it was read in, and nothing more where all is in it', () => {
  for (const locale of ['en', 'fr', 'de', 'es', 'ja']) {
    const r = proceduresFor('1.4.3', { locale });
    assert.equal(r.locale, locale);
    assert.deepEqual(langsOf(r), [], locale);
    assert.ok(
      r.facets.some((f) => f.variants.length && f.tools.length),
      'has variants and tools'
    );
  }
  // A locale core has no procedures in is read in English, and says so.
  const pt = proceduresFor('1.4.3', { locale: 'pt-BR' });
  assert.equal(pt.locale, 'en');
  assert.deepEqual(langsOf(pt), []);
  assert.equal(proceduresFor('best-practice', { locale: 'fr' }).locale, 'fr');
  assert.equal(proceduresFor('best-practice', { locale: 'fr' }).titleLang, undefined);
});

test('a text a locale lacks says it is in English', () => {
  // A French that has only the title and one facet's label and first step.
  const criterion = proceduresFor('1.4.12');
  const [first, second] = criterion.facets.filter((f) => f.procedure);
  const stem = `wcag_1.4.12_${first.id}_`;
  const dicts = {
    en,
    fr: {
      'wcag_1.4.12_title': 'Espacement du texte',
      [`${stem}label`]: 'Libellé',
      [`${stem}step1`]: 'Première étape.'
    }
  };
  const r = proceduresFromDicts(dicts, '1.4.12', { locale: 'fr' });
  assert.equal(r.locale, 'fr');
  assert.equal(r.title, 'Espacement du texte');
  assert.equal(r.titleLang, undefined, 'the title is in French');
  const a = r.facets.find((f) => f.id === first.id);
  const b = r.facets.find((f) => f.id === second.id);
  // Its label is French; its procedure goes by its first step's.
  assert.equal(a.lang, undefined);
  assert.equal(a.procedureLang, undefined);
  assert.equal(procedureLangOf(r, a), 'fr');
  // All English: the label says it, and the procedure with it.
  assert.equal(b.lang, 'en');
  assert.equal(b.procedureLang, undefined);
  assert.equal(procedureLangOf(r, b), 'en');
  for (const f of r.facets) {
    for (const t of f.tools) assert.equal(t.lang, 'en', `${f.id} ${t.id}`);
    for (const v of f.variants) assert.equal(v.lang, 'en', `${f.id} ${v.reasonCode}`);
  }
  // A label in the locale, its procedure not: procedureLang says the procedure's.
  const onlyLabel = proceduresFromDicts({ en, fr: { [`${stem}label`]: 'Libellé' } }, '1.4.12', {
    locale: 'fr'
  }).facets.find((f) => f.id === first.id);
  assert.deepEqual([onlyLabel.lang, onlyLabel.procedureLang], [undefined, 'en']);
  // Its label English, its procedure not: lang says the label's, procedureLang the procedure's.
  const onlyStep = proceduresFromDicts(
    { en, fr: { [`${stem}step1`]: 'Première étape.' } },
    '1.4.12',
    { locale: 'fr' }
  ).facets.find((f) => f.id === first.id);
  assert.deepEqual([onlyStep.lang, onlyStep.procedureLang], ['en', 'fr']);
});

test('an earlier WCAG’s own title, in a list in another locale, says it is in English', () => {
  const list = listProcedures({ version: '2.1', locale: 'fr' });
  const parsing = list.requirements.find((r) => r.id === '4.1.1');
  assert.deepEqual([parsing.title, parsing.titleLang, parsing.locale], ['Parsing', 'en', 'fr']);
  for (const r of list.requirements.filter((x) => x.id !== '4.1.1')) {
    assert.equal(r.titleLang, undefined, r.id);
  }
  const groups = (gs) => gs.flatMap((g) => [g, ...groups(g.groups)]);
  assert.deepEqual(
    groups(list.groups).filter((g) => g.titleLang),
    [],
    'WCAG’s principles and guidelines are all in French'
  );
  assert.equal(
    listProcedures({ version: '2.1' }).requirements.find((r) => r.id === '4.1.1').titleLang,
    undefined,
    'in English, nothing to say'
  );
});

test('a pack’s standard that declares no language says its own text is in English', () => {
  const list = listProcedures({ packs: [pack], standard: 'stdl', locale: 'fr' });
  const own = list.requirements.find((r) => r.id === '3');
  assert.equal(own.locale, 'fr');
  assert.equal(own.titleLang, 'en');
  assert.equal(own.facets[0].lang, 'en');
  assert.equal(procedureLangOf(own, own.facets[0]), 'en');
  assert.equal(own.facets[0].tools[0].lang, undefined, 'core’s tool, in French');
  // One that restates a criterion: its title is the pack's, its facets core's.
  const restated = list.requirements.find((r) => r.id === '2');
  assert.equal(restated.titleLang, 'en');
  for (const f of restated.facets) assert.equal(f.lang, undefined, f.id);
  assert.deepEqual(
    list.groups.map((g) => [g.id, g.titleLang]),
    [
      ['A', 'en'],
      ['B', 'en']
    ]
  );
  // In English, nothing to say.
  const english = listProcedures({ packs: [pack], standard: 'stdl' });
  for (const r of english.requirements) assert.deepEqual(langsOf(r), [], r.id);
  assert.ok(english.groups.every((g) => g.titleLang === undefined));
});
