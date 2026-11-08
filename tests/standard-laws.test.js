'use strict';

/**
 * The laws a standard is assessed under (standard.laws, experimental): what
 * checkPack and checkStandardData accept, lawOf in a language, the law in
 * results and the report, listProcedures by profile, describePacks, standard
 * data and derivation.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const Ajv = require('ajv');

const {
  definePack,
  ruleMappedStandard,
  checkPack,
  describePacks,
  lawOf
} = require('../src/pack.js');
const { listProcedures } = require('../src/index.js');
const { renderHtmlReport } = require('../src/report.js');
const { checkStandardData, standardFromData } = require('../src/standard-data.js');
const { deriveStandard } = require('../src/derive-standard.js');
const { experimentalUses } = require('../src/experimental.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const copy = (v) => JSON.parse(JSON.stringify(v));
const TILDE = `~${require('../package.json').version.split('.').slice(0, 2).join('.')}.0`;
const validateSchema = new Ajv({ allErrors: true }).compile(
  require('../src/schemas/standard.schema.json')
);

const LAWS = {
  'city-public': {
    name: 'City Public Act',
    jurisdiction: 'FR',
    appliesTo: 'Public bodies',
    exemptions: ['Archives', 'Third-party content'],
    since: '2005-02-11',
    enforcement: ['The regulator'],
    sources: [{ title: 'Official journal', url: 'https://example.org/act' }]
  },
  'city-private': { name: 'City Private Act', jurisdiction: 'EU' }
};

const facet = (id) => ({
  id,
  label: 'Check it',
  steps: ['Look at the page.'],
  passWhen: 'It is fine.',
  failWhen: 'It is not.'
});

function cityPack(fields = {}, profileFields = {}) {
  const std = ruleMappedStandard({
    standard: 'City',
    tag: 'city',
    versions: [{ version: '1', wcagVersion: '2.2' }],
    requirements: {
      1: { A: { title: 'Images', wcagSc: ['1.1.1'] }, B: { title: 'Forms', wcagSc: [] } }
    },
    ruleMap: { 1: { 'img-alt-present': { requirements: ['A'] } } }
  });
  return {
    name: 'city',
    version: '1.0.0',
    namespace: 'city',
    core: TILDE,
    standard: {
      key: 'city',
      standard: 'City',
      versions: ['1'],
      lang: 'en',
      profiles: {
        'city-1': { version: '1', tags: ['city'], mappedRules: true, law: 'city-public' },
        'city-1-private': { version: '1', tags: ['city'], mappedRules: true, law: 'city-private' },
        ...profileFields
      },
      ruleTag: 'city',
      ruleMapped: true,
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate,
      laws: LAWS,
      procedures: {
        1: {
          A: { title: 'Images', facets: [facet('a1')] },
          B: { title: 'Forms', facets: [facet('b1')], laws: ['city-public'] }
        }
      },
      ...fields
    }
  };
}

const problems = (fields, profileFields) =>
  checkPack(cityPack(fields, profileFields)).filter((p) => /law/i.test(p));

test('a sound set of laws gives no problems, and the pack uses the experimental API', () => {
  assert.deepEqual(problems(), []);
  assert.ok(experimentalUses(definePack(cityPack())).some((e) => e.id === 'standard laws'));
});

test('checkPack reports what is wrong with a law, a reference to one and its translations', () => {
  const bad = (law) =>
    problems({ laws: { ...LAWS, 'city-public': { ...LAWS['city-public'], ...law } } });
  assert.match(bad({ name: '' }).join('\n'), /city-public\.name must be a non-empty string/);
  assert.match(bad({ jurisdiction: 'France' }).join('\n'), /jurisdiction must be a country/);
  assert.match(bad({ since: '2005-02-30' }).join('\n'), /since must be a date/);
  assert.match(bad({ exemptions: [] }).join('\n'), /exemptions must be a non-empty list/);
  assert.match(bad({ extra: 1 }).join('\n'), /no field "extra"/);
  for (const url of ['http://example.org', 'javascript:alert(1)', 'https//x', 'ftp://x']) {
    assert.match(
      bad({ sources: [{ title: 'T', url }] }).join('\n'),
      /sources\[0\]\.url must be an https:\/\/ address/,
      url
    );
  }
  assert.match(
    problems({ laws: { 'City Law': LAWS['city-private'] } }).join('\n'),
    /"City Law" must be/
  );
  assert.match(
    problems({}, { 'city-x': { version: '1', tags: ['city'], law: 'nope' } }).join('\n'),
    /profiles\.city-x\.law names no law of the standard: "nope"/
  );
  const procedures = copy(cityPack().standard.procedures);
  procedures[1].B.laws = ['nope'];
  assert.match(problems({ procedures }).join('\n'), /procedures\.1\.B\.laws names no law/);
  procedures[1].B.laws = [];
  assert.match(problems({ procedures }).join('\n'), /must be a non-empty list/);
  const texts = (dict) => problems({ lawTexts: dict }).join('\n');
  assert.match(
    texts({ fr: { 'laws.city-public.title': 'x' } }),
    /is no text of the standard's laws/
  );
  assert.match(texts({ fr: { 'laws.nope.name': 'x' } }), /is no text of the standard's laws/);
  assert.match(texts({ fr: { 'laws.city-public.exemptions': ['un'] } }), /list of 2 texts/);
  assert.match(texts({ en: { 'laws.city-public.name': 'x' } }), /needs no translation into it/);
  assert.match(texts({ 'not a tag': {} }), /is not a language tag/);
  assert.equal(texts({ fr: { 'laws.city-public.name': 'Loi publique' } }), '');
});

test('a key that would reach Object.prototype names no law', () => {
  const laws = JSON.parse('{"__proto__":{"name":"x","jurisdiction":"FR"}}');
  assert.match(problems({ laws }).join('\n'), /"__proto__" must be/);
  assert.equal(lawOf({ laws: LAWS }, '__proto__'), null);
  assert.equal(lawOf({ laws: LAWS }, 'constructor'), null);
  assert.equal(lawOf({ laws: LAWS }, 'toString'), null);
  assert.equal(Object.prototype.hasOwnProperty.call(Object.prototype, 'name'), false);
});

test('lawOf reads a law in a language, its base language, or as written', () => {
  const st = cityPack({
    lawTexts: {
      fr: {
        'laws.city-public.name': 'Loi publique',
        'laws.city-public.exemptions': ['Archives', 'Contenus tiers']
      }
    }
  }).standard;
  const en = lawOf(st, 'city-public', 'en');
  assert.equal(en.name, 'City Public Act');
  assert.equal(en.lang, 'en');
  assert.equal(en.id, 'city-public');
  assert.deepEqual(en.sources, LAWS['city-public'].sources);
  const fr = lawOf(st, 'city-public', 'fr-CA');
  assert.equal(fr.name, 'Loi publique');
  assert.deepEqual(fr.exemptions, ['Archives', 'Contenus tiers']);
  // appliesTo and enforcement are untranslated: the law says which is which.
  assert.equal(fr.appliesTo, 'Public bodies');
  assert.equal(fr.lang, 'en');
  assert.deepEqual(fr.langs, { name: 'fr', appliesTo: 'en', exemptions: 'fr', enforcement: 'en' });
  // Its result is a copy: changing it changes no standard.
  fr.exemptions.push('x');
  assert.equal(lawOf(st, 'city-public', 'fr').exemptions.length, 2);
  assert.equal(lawOf(st, 'nope', 'fr'), null);
  assert.equal(lawOf(null, 'city-public'), null);
});

test("results name the profile's law, and so does each profile of a scan of several", () => {
  const pack = definePack(cityPack());
  const html =
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="a.png"></body></html>';
  const one = runa11yCoreOnHtml(html, { engineOptions: { packs: [pack], profile: 'city-1' } });
  assert.deepEqual(one.engine.law, {
    id: 'city-public',
    name: 'City Public Act',
    jurisdiction: 'FR',
    lang: 'en'
  });
  const wcag = runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aa' } });
  assert.equal(wcag.engine.law, undefined);
  const both = runa11yCoreOnHtml(html, {
    engineOptions: { packs: [pack], profile: ['city-1', 'city-1-private', 'wcag22-aa'] }
  });
  assert.equal(both.profiles['city-1'].law.id, 'city-public');
  assert.equal(both.profiles['city-1-private'].law.id, 'city-private');
  assert.equal(both.profiles['wcag22-aa'].law, undefined);
  // The report shows it beside the profile, in the law's language.
  const report = renderHtmlReport(one);
  assert.match(report, /<b><span>City Public Act \(FR\)<\/span><\/b>law/);
  // In a report in another language, it is marked as English; a scan of
  // several profiles names each one's law once.
  const fr = renderHtmlReport(
    runa11yCoreOnHtml(html, {
      engineOptions: { packs: [pack], profile: ['city-1', 'city-1-private'], locale: 'fr' }
    })
  );
  assert.match(
    fr,
    /<b><span lang="en">City Public Act \(FR\)<\/span> \+ <span lang="en">City Private Act \(EU\)<\/span><\/b>loi/
  );
  assert.doesNotMatch(renderHtmlReport(wcag), /City Public Act/);
});

test('the report escapes a law it shows', () => {
  const laws = { ...LAWS, 'city-public': { ...LAWS['city-public'], name: '<script>x</script>' } };
  const pack = definePack(cityPack({ laws }));
  const html = '<!doctype html><html lang="en"><head><title>T</title></head><body></body></html>';
  const result = runa11yCoreOnHtml(html, { engineOptions: { packs: [pack], profile: 'city-1' } });
  const report = renderHtmlReport(result);
  assert.doesNotMatch(report, /<script>x<\/script>/);
  assert.match(report, /&lt;script&gt;x&lt;\/script&gt;/);
});

test("listProcedures by profile lists what the profile's law asks for, and names the law", () => {
  const pack = definePack(
    cityPack({ lawTexts: { fr: { 'laws.city-public.name': 'Loi publique' } } })
  );
  const ids = (list) => list.requirements.map((r) => r.id);
  const all = listProcedures({ packs: [pack], standard: 'city' });
  assert.deepEqual(ids(all), ['A', 'B']);
  assert.equal(all.law, undefined);
  const pub = listProcedures({ packs: [pack], profile: 'city-1' });
  assert.deepEqual(ids(pub), ['A', 'B']);
  assert.equal(pub.profile, 'city-1');
  assert.equal(pub.version, '1');
  assert.equal(pub.law.name, 'City Public Act');
  const priv = listProcedures({ packs: [pack], profile: 'City-1-Private' });
  assert.deepEqual(ids(priv), ['A']);
  assert.equal(priv.law.id, 'city-private');
  // The standard's groups keep only what is listed.
  assert.equal(listProcedures({ packs: [pack], profile: 'nope' }), null);
  assert.equal(listProcedures({ packs: [pack], profile: 'city-1', standard: 'other' }), null);
  assert.equal(
    listProcedures({ packs: [pack], profile: 'city-1', standard: 'city' }).profile,
    'city-1'
  );
});

test('describePacks lists the laws with the profiles that serve each', () => {
  const [d] = describePacks([definePack(cityPack())]);
  assert.deepEqual(
    d.standard.laws.map((l) => [l.id, l.name, l.profiles]),
    [
      ['city-public', 'City Public Act', ['city-1']],
      ['city-private', 'City Private Act', ['city-1-private']]
    ]
  );
  const none = cityPack({ laws: undefined });
  for (const p of Object.values(none.standard.profiles)) delete p.law;
  delete none.standard.procedures[1].B.laws;
  assert.equal(describePacks([definePack(none)])[0].standard.laws, undefined);
});

// The same standard, as data.
const PROCEDURE = { steps: ['Look at the page.'], passWhen: 'It is fine.', failWhen: 'It is not.' };
function cityData() {
  return {
    format: 'surea11y-standard/1',
    key: 'city',
    standard: 'City',
    lang: 'en',
    versions: [{ version: '1', wcagVersion: '2.2' }],
    laws: copy(LAWS),
    texts: { fr: { 'laws.city-public.name': 'Loi publique' } },
    data: {
      1: {
        requirements: {
          A: { title: 'Images', wcagSc: ['1.1.1'], procedure: copy(PROCEDURE) },
          B: { title: 'Forms', laws: ['city-public'], procedure: copy(PROCEDURE) }
        },
        ruleMap: { 'img-alt-present': { requirements: ['A'] } }
      }
    },
    profiles: {
      'city-1': { version: '1', tags: ['city'], mappedRules: true, law: 'city-public' },
      'city-1-private': { version: '1', tags: ['city'], mappedRules: true, law: 'city-private' }
    }
  };
}
const asData = cityData;

test('standard data carries laws, their texts, a profile law and requirement laws', () => {
  const data = asData();
  assert.equal(validateSchema(data), true, JSON.stringify(validateSchema.errors));
  assert.deepEqual(checkStandardData(data), []);
  const st = standardFromData(data);
  assert.deepEqual(Object.keys(st.laws), ['city-public', 'city-private']);
  assert.equal(st.lawTexts.fr['laws.city-public.name'], 'Loi publique');
  assert.deepEqual(st.procedures[1].B.laws, ['city-public']);
  assert.equal(st.procedures[1].A.laws, undefined);
  const pack = definePack({
    name: 'city',
    version: '1.0.0',
    namespace: 'city',
    core: TILDE,
    standard: st
  });
  assert.deepEqual(checkPack(pack), []);
  assert.deepEqual(
    listProcedures({ packs: [pack], profile: 'city-1-private' }).requirements.map((r) => r.id),
    ['A']
  );
  // The law is read in the language the list is: a standard written in
  // English with no French texts is listed in English, law and all.
  const fr = listProcedures({ packs: [pack], profile: 'city-1', locale: 'fr' });
  assert.equal(fr.locale, 'en');
  assert.equal(fr.law.name, 'City Public Act');
  assert.equal(lawOf(st, 'city-public', 'fr').name, 'Loi publique');
});

test("checkStandardData and the schema refuse a wrong law, in the data's own terms", () => {
  const bad = asData();
  bad.laws['city-public'].sources[0].url = 'http://example.org';
  bad.profiles['city-1'].law = 'nope';
  bad.data[1].requirements.B.laws = ['other'];
  bad.texts.fr['laws.city-public.title'] = 'x';
  const out = checkStandardData(bad).join('\n');
  assert.match(out, /^laws\.city-public\.sources\[0\]\.url must be an https/m);
  assert.match(out, /^profiles\.city-1\.law names no law/m);
  assert.match(out, /^data\.1\.requirements\.B\.laws names no law/m);
  assert.match(out, /^texts\.fr: laws\.city-public\.title is no text/m);
  assert.throws(() => standardFromData(bad), /https/);
  assert.equal(validateSchema(bad), false);
  // A profile naming a law in data with no laws at all.
  const none = asData();
  delete none.laws;
  delete none.texts;
  delete none.data[1].requirements.B.laws;
  assert.match(checkStandardData(none).join('\n'), /profiles\.city-1\.law names no law/);
});

test('a derived standard names its own laws: none come from its base', () => {
  const own = {
    format: 'surea11y-standard/1',
    key: 'town',
    standard: 'Town',
    lang: 'en',
    versions: [{ version: '1', wcagVersion: '2.2', basedOn: [{ standard: 'city', version: '1' }] }],
    data: {
      1: {
        requirements: {
          A: { basedOn: [{ standard: 'city', id: 'A' }] },
          B: { basedOn: [{ standard: 'city', id: 'B' }] }
        },
        ruleMap: {}
      }
    },
    profiles: { 'town-1': { version: '1', tags: ['town'], mappedRules: true } }
  };
  const derived = deriveStandard([asData()], own);
  assert.equal(derived.laws, undefined);
  assert.equal(derived.texts, undefined);
  assert.equal(derived.data[1].requirements.B.laws, undefined);
  assert.equal(derived.data[1].requirements.B.title, 'Forms');
  assert.deepEqual(checkStandardData(derived), []);
  // Its own laws, as any standard's.
  const withLaws = copy(own);
  withLaws.laws = { 'town-act': { name: 'Town Act', jurisdiction: 'DE-BY' } };
  withLaws.profiles['town-1'].law = 'town-act';
  withLaws.data[1].requirements.B.laws = ['town-act'];
  const mine = deriveStandard([asData()], withLaws);
  assert.deepEqual(Object.keys(mine.laws), ['town-act']);
  assert.deepEqual(mine.data[1].requirements.B.laws, ['town-act']);
  assert.deepEqual(checkStandardData(mine), []);
});
