'use strict';

// A pack's standard in several languages (docs/PACKS.md, "Languages"): its
// own text written in standard.lang, translated in standard.translations,
// keyed by the text. A standard that declares them is read in one language,
// its own text and core's alike; one that declares none, as it always was.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const {
  checkPack,
  definePack,
  packTranslationCoverage,
  ruleMappedStandard
} = require('../../src/pack.js');
const {
  listProcedures,
  procedureChecklist,
  proceduresFor,
  renderProcedures
} = require('../../src/index.js');
const { renderHtmlReport } = require('../../src/report.js');
const { runa11yCoreOnHtml } = require('../../src/testing.js');
const EN = require('../../src/i18n/procedures/en.json');

const requirements = { '1.0': { 'R-1.4.3': { title: 'Contrast', wcagSc: ['1.4.3'] } } };
const ruleMap = { '1.0': { 'contrast-minimum': { requirements: ['R-1.4.3'] } } };
const std = ruleMappedStandard({
  standard: 'Std L',
  tag: 'stdl',
  versions: [{ version: '1.0', wcagVersion: '2.2' }],
  requirements,
  ruleMap
});

const OWN = {
  title: 'A text version of every form',
  note: 'Forms in a document format count too.',
  facets: [
    {
      id: 'text-version',
      label: 'Each form can be had as a text document',
      automation: 'manual',
      steps: ['Find each form on the page.', 'Look next to it for a link to a text version.'],
      passWhen: 'Every form has a text version.',
      failWhen: 'A form has no text version, which fails {{requirement}}.'
    }
  ]
};

const FR = {
  'A text version of every form': 'Une version texte de chaque formulaire',
  'Each form can be had as a text document': 'Chaque formulaire existe en document texte',
  'Find each form on the page.': 'Repérez chaque formulaire de la page.',
  'Look next to it for a link to a text version.':
    'Cherchez à côté un lien vers une version texte.',
  'Every form has a text version.': 'Chaque formulaire a une version texte.',
  'A form has no text version, which fails {{requirement}}.':
    'Un formulaire n’a pas de version texte, ce qui ne respecte pas {{requirement}}.',
  Contrast: 'Contraste',
  'Forms and colour': 'Formulaires et couleur'
};

function packWith(extra = {}) {
  return {
    name: 'stdl-pack',
    version: '1.0.0',
    namespace: 'stdl',
    core: '*',
    standard: {
      key: 'stdl',
      standard: 'Std L',
      versions: ['1.0'],
      ruleTag: 'stdl',
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate,
      profiles: {
        'stdl-1': { version: '1.0', tags: ['stdl'], mappedRules: true, wcagVersion: '2.2' }
      },
      procedures: { '1.0': { 'R-1.4.3': { title: 'Contrast', wcag: '1.4.3' }, 'R-9': OWN } },
      groups: { '1.0': [{ id: 'g', title: 'Forms and colour', requirements: ['R-9', 'R-1.4.3'] }] },
      notes: { '1.0': ['A draft for comment.'] },
      ...extra
    }
  };
}

const legacy = definePack(packWith());
const translated = definePack(packWith({ translations: { fr: FR } }));
const list = (pack, locale) => listProcedures({ standard: 'stdl', packs: [pack], locale });
const own = (l) => l.requirements.find((r) => r.id === 'R-9');
const restating = (l) => l.requirements.find((r) => r.id === 'R-1.4.3');
const contrastText = (l) =>
  restating(l).facets.find((f) => f.id === 'contrast-minimum-text').procedure.steps[0];

test('a standard that declares no language reads as it always did, and says its text is English', () => {
  const fr = list(legacy, 'fr');
  assert.equal(fr.locale, 'fr');
  assert.equal(own(fr).title, OWN.title);
  assert.equal(own(fr).facets[0].label, OWN.facets[0].label);
  // Its own text is as written, in English, which it says in another locale.
  assert.equal(own(fr).facets[0].lang, 'en');
  assert.equal(own(fr).titleLang, 'en');
  assert.equal(fr.notesLang, fr.notes ? 'en' : undefined);
  // In English, nothing to say.
  const en = list(legacy, 'en');
  assert.equal(own(en).facets[0].lang, undefined);
  assert.equal(own(en).titleLang, undefined);
  assert.equal(en.notesLang, undefined);
  // Core's procedures follow the locale asked for.
  assert.equal(contrastText(fr), contrastText(list(translated, 'fr')));
  assert.notEqual(contrastText(fr), contrastText(list(legacy, 'en')));
});

test('a translated standard reads in the locale asked for, its text and core’s', () => {
  const fr = list(translated, 'fr-CA');
  assert.equal(fr.locale, 'fr');
  const r = own(fr);
  assert.equal(r.title, 'Une version texte de chaque formulaire');
  assert.equal(r.titleLang, 'fr');
  const f = r.facets[0];
  assert.equal(f.label, 'Chaque formulaire existe en document texte');
  assert.equal(f.lang, 'fr');
  assert.deepEqual(f.procedure.steps, [
    'Repérez chaque formulaire de la page.',
    'Cherchez à côté un lien vers une version texte.'
  ]);
  // {{requirement}} is filled in, translated or not.
  assert.equal(
    f.procedure.failWhen,
    'Un formulaire n’a pas de version texte, ce qui ne respecte pas Std L R-9.'
  );
  assert.equal(restating(fr).title, 'Contraste');
  assert.deepEqual(
    fr.groups.map((g) => [g.title, g.titleLang]),
    [['Formulaires et couleur', 'fr']]
  );
  // What it doesn't translate stays as written, and says so.
  assert.equal(r.note, OWN.note);
  assert.equal(r.noteLang, 'en');
  assert.deepEqual(fr.notes, ['A draft for comment.']);
  assert.equal(fr.notesLang, 'en');
  // proceduresFor reads one requirement the same way.
  const one = proceduresFor('R-9', { packs: [translated], standard: 'stdl', locale: 'fr' });
  assert.deepEqual(one.facets[0], f);
});

test('a locale the standard lacks reads it in its own language, core’s text too', () => {
  const es = list(translated, 'es');
  assert.equal(es.locale, 'en');
  assert.equal(own(es).title, OWN.title);
  assert.equal(own(es).facets[0].lang, 'en');
  assert.equal(contrastText(es), contrastText(list(legacy, 'en')));
});

test('a standard written in French reads in French where it has no translation', () => {
  const french = definePack(
    packWith({
      lang: 'fr',
      procedures: { '1.0': { 'R-1.4.3': { title: 'Contraste', wcag: '1.4.3' } } },
      groups: undefined,
      notes: undefined,
      translations: { en: { Contraste: 'Contrast' } }
    })
  );
  const es = list(french, 'es');
  assert.equal(es.locale, 'fr');
  assert.equal(restating(es).title, 'Contraste');
  assert.equal(restating(es).titleLang, 'fr');
  assert.equal(contrastText(es), contrastText(list(legacy, 'fr')));
  const en = list(french, ['es', 'en']);
  assert.equal(en.locale, 'en');
  assert.equal(restating(en).title, 'Contrast');
});

test('a facet is translated as a whole or not at all', () => {
  const partial = { ...FR };
  delete partial['Every form has a text version.'];
  const pack = definePack(packWith({ translations: { fr: partial } }));
  const f = own(list(pack, 'fr')).facets[0];
  assert.equal(f.label, OWN.facets[0].label);
  assert.deepEqual(f.procedure.steps, OWN.facets[0].steps);
  assert.equal(f.lang, 'en');
  // The title is translated on its own.
  assert.equal(own(list(pack, 'fr')).title, 'Une version texte de chaque formulaire');
});

test('a checklist item carries the language of a pack’s own facet', () => {
  const items = procedureChecklist({ standard: 'stdl', packs: [translated], locale: 'fr' }).items;
  const item = items.find((i) => i.key === 'R-9/text-version');
  assert.equal(item.lang, 'fr');
  assert.equal(item.label, 'Chaque formulaire existe en document texte');
});

test('definePack refuses a translation of no text, one that loses a placeholder, and a bad lang', () => {
  const stale = checkPack(packWith({ translations: { fr: { 'Old text.': 'Ancien texte.' } } }));
  assert.ok(
    stale.some((p) => /"Old text\." is no text of the standard/.test(p)),
    stale
  );
  const lost = checkPack(
    packWith({
      translations: {
        fr: { 'A form has no text version, which fails {{requirement}}.': 'Un formulaire…' }
      }
    })
  );
  assert.ok(
    lost.some((p) => /same \{\{placeholders\}\}/.test(p)),
    lost
  );
  assert.ok(checkPack(packWith({ lang: 'French' })).some((p) => /standard\.lang/.test(p)));
  assert.ok(
    checkPack(packWith({ translations: { en: { Contrast: 'Contrast' } } })).some((p) =>
      /needs no translation into it/.test(p)
    )
  );
  assert.ok(checkPack(packWith({ translations: { fr: { Contrast: '' } } })).length);
  assert.deepEqual(checkPack(packWith({ translations: { fr: FR } })), []);
});

test('packTranslationCoverage says what each translation leaves out', () => {
  const [fr] = packTranslationCoverage(translated);
  assert.equal(fr.locale, 'fr');
  assert.deepEqual(fr.missing.sort(), [OWN.note, 'A draft for comment.'].sort());
  assert.equal(fr.translated, fr.total - 2);
  assert.deepEqual(packTranslationCoverage(legacy), []);
});

test('a page of the standard marks only what is in another language', () => {
  const marks = (input) =>
    [
      ...new JSDOM(
        renderProcedures(input, { packs: [translated] })
      ).window.document.querySelectorAll('main [lang], header [lang]')
    ].map((e) => [e.getAttribute('lang'), e.textContent.trim()]);
  for (const input of [
    list(translated, 'fr'),
    procedureChecklist({ standard: 'stdl', packs: [translated], locale: 'fr' })
  ]) {
    const d = new JSDOM(renderProcedures(input, { packs: [translated] })).window.document;
    assert.equal(d.documentElement.lang, 'fr');
    const found = marks(input);
    assert.ok(found.length > 0);
    assert.ok(
      found.every(
        ([lang, text]) => lang === 'en' && [OWN.note, 'A draft for comment.'].includes(text)
      ),
      JSON.stringify(found)
    );
  }
  // Asked for a locale the standard lacks, the page is in its own language.
  const es = new JSDOM(renderProcedures(list(translated, 'es'), { packs: [translated] })).window
    .document;
  assert.equal(es.documentElement.lang, 'en');
  assert.equal(es.querySelector('main [lang]'), null);
});

const PAGE =
  '<!doctype html><html lang="en"><head><title>T</title></head><body><main>' +
  '<p style="color:#aaa;background:#fff">Grey</p></main></body></html>';
const scan = (pack, locale) =>
  runa11yCoreOnHtml(PAGE, { engineOptions: { packs: [pack], profile: 'stdl-1', locale } });
const rollup = (result) => result.rulesResults.find((r) => r.ruleId.startsWith('stdl-'));

test('a scan names the standard’s rollups by their translated titles', () => {
  const fr = scan(translated, 'fr');
  assert.equal(rollup(fr).title, 'Contraste');
  assert.deepEqual(fr.standards, [{ key: 'stdl', standard: 'Std L' }]);
  assert.equal(fr.engine.locale.reason, 'ok');
  const es = scan(translated, 'es');
  assert.equal(rollup(es).title, 'Contrast');
  assert.equal(es.standards[0].titleLang, 'en');
  assert.equal(rollup(scan(translated, 'en')).title, 'Contrast');
  // Without translations, nothing changes.
  assert.equal(rollup(scan(legacy, 'fr')).title, 'Contrast');
  assert.deepEqual(scan(legacy, 'fr').standards, [{ key: 'stdl', standard: 'Std L' }]);
});

test('the report marks a standard’s checks read in another language than its own', () => {
  const french = definePack(packWith({ translations: { fr: FR }, lang: 'en' }));
  // A Spanish report of a standard with no Spanish: its checks are English.
  const d = new JSDOM(renderHtmlReport(scan(french, 'es'), { packs: [french] })).window.document;
  const facet = [...d.querySelectorAll('.manual-facet')].find((x) =>
    x.textContent.includes(OWN.facets[0].label)
  );
  assert.ok(facet);
  assert.equal(facet.querySelector('.manual-label strong').getAttribute('lang'), 'en');
  assert.equal(facet.querySelector('ol').getAttribute('lang'), 'en');
  // A French one: French throughout, nothing marked in the facet.
  const fr = new JSDOM(renderHtmlReport(scan(french, 'fr'), { packs: [french] })).window.document;
  const frFacet = [...fr.querySelectorAll('.manual-facet')].find((x) =>
    x.textContent.includes('Chaque formulaire existe en document texte')
  );
  assert.ok(frFacet);
  assert.equal(frFacet.querySelector('[lang]'), null);
});

test('a pack may give core’s procedures in a locale core doesn’t ship', () => {
  const key = Object.keys(EN).find((k) => /^wcag_1\.4\.3_contrast-minimum-text_step1$/.test(k));
  assert.ok(key);
  const pack = definePack({
    ...packWith({ translations: { ca: { Contrast: 'Contrast mínim' } } }),
    dictionaries: { ca: { [key]: 'Recorreu la pàgina.' } }
  });
  const ca = list(pack, 'ca');
  assert.equal(ca.locale, 'ca');
  assert.equal(restating(ca).title, 'Contrast mínim');
  assert.equal(contrastText(ca), 'Recorreu la pàgina.');
});
