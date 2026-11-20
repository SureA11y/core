'use strict';

// The languages a standard's procedures can be read in (docs/PROCEDURES.md,
// "Their languages"): WCAG's and the best practices' in each locale core
// ships, a pack's standard's in those it declares (docs/PACKS.md,
// "Languages"), and for each whether nothing is left in another language.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { definePack, languagesOf, ruleMappedStandard } = require('../../src/pack.js');
const { listProcedures, procedureLanguages } = require('../../src/index.js');
const { procedureLanguagesFrom } = require('../../src/procedures-core.js');
const EN = require('../../src/i18n/procedures/en.json');
const FR_CORE = require('../../src/i18n/procedures/fr.json');

const SHIPPED = fs
  .readdirSync(path.join(__dirname, '..', '..', 'src', 'i18n', 'procedures'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.slice(0, -'.json'.length));

const std = ruleMappedStandard({
  standard: 'Std L',
  tag: 'stdl',
  versions: [
    { version: '1.0', wcagVersion: '2.2' },
    { version: '2.0', wcagVersion: '2.2' }
  ],
  requirements: {
    '1.0': { 'R-1.4.3': { title: 'Contrast', wcagSc: ['1.4.3'] } },
    '2.0': { 'R-1.4.3': { title: 'Contrast', wcagSc: ['1.4.3'] } }
  },
  ruleMap: {
    '1.0': { 'contrast-minimum': { requirements: ['R-1.4.3'] } },
    '2.0': { 'contrast-minimum': { requirements: ['R-1.4.3'] } }
  }
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
  'Forms in a document format count too.': 'Les formulaires en document comptent aussi.',
  'Each form can be had as a text document': 'Chaque formulaire existe en document texte',
  'Find each form on the page.': 'Repérez chaque formulaire de la page.',
  'Look next to it for a link to a text version.':
    'Cherchez à côté un lien vers une version texte.',
  'Every form has a text version.': 'Chaque formulaire a une version texte.',
  'A form has no text version, which fails {{requirement}}.':
    'Un formulaire n’a pas de version texte, ce qui ne respecte pas {{requirement}}.',
  Contrast: 'Contraste',
  'Forms and colour': 'Formulaires et couleur',
  'A draft for comment.': 'Un projet soumis à commentaires.'
};

// Version 2.0 adds a requirement FR doesn't translate.
const NEW = { title: 'Captions on every video', wcag: '1.2.2' };

function packWith(extra = {}, dictionaries) {
  return definePack({
    name: 'stdl-pack',
    version: '1.0.0',
    namespace: 'stdl',
    core: '*',
    ...(dictionaries ? { dictionaries } : {}),
    standard: {
      key: 'stdl',
      standard: 'Std L',
      versions: ['1.0', '2.0'],
      ruleTag: 'stdl',
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate,
      profiles: {
        'stdl-1': { version: '1.0', tags: ['stdl'], mappedRules: true, wcagVersion: '2.2' }
      },
      procedures: {
        '1.0': { 'R-1.4.3': { title: 'Contrast', wcag: '1.4.3' }, 'R-9': OWN },
        '2.0': { 'R-1.4.3': { title: 'Contrast', wcag: '1.4.3' }, 'R-9': OWN, 'R-1.2.2': NEW }
      },
      groups: {
        '1.0': [{ id: 'g', title: 'Forms and colour', requirements: ['R-9', 'R-1.4.3'] }]
      },
      notes: { '1.0': ['A draft for comment.'], '2.0': ['A draft for comment.'] },
      ...extra
    }
  });
}

const legacy = packWith();
const translated = packWith({ translations: { fr: FR } });
const locales = (list) => list.map((l) => l.locale);
const entry = (list, locale) => list.find((l) => l.locale === locale);

// What procedureLanguages says of a standard is what listProcedures does:
// each language returned is the one it reads in, and a complete one marks
// nothing in another.
function agrees(languages, options) {
  for (const { locale, complete } of languages) {
    const listing = listProcedures({ ...options, locale });
    assert.equal(listing.locale, locale, `${options.standard || 'wcag'} in ${locale}`);
    if (!complete) continue;
    const other = [];
    const mark = (where, lang) => lang !== undefined && lang !== locale && other.push(where);
    mark('notes', listing.notesLang);
    for (const r of listing.requirements) {
      mark(`${r.id} title`, r.titleLang);
      mark(`${r.id} note`, r.noteLang);
      for (const f of r.facets) {
        mark(`${r.id} ${f.id}`, f.lang);
        mark(`${r.id} ${f.id} procedure`, f.procedureLang);
      }
    }
    const walk = (groups) =>
      groups.forEach((g) => {
        mark(`group ${g.id}`, g.titleLang);
        walk(g.groups);
      });
    walk(listing.groups);
    assert.deepEqual(other, [], `${locale} is complete`);
  }
}

test('WCAG and the best practices read in each locale core ships, English first', () => {
  const expected = ['en'].concat(SHIPPED.filter((l) => l !== 'en').sort());
  for (const standard of [undefined, 'wcag', 'best-practice']) {
    const languages = procedureLanguages({ standard });
    assert.deepEqual(locales(languages), expected);
    assert.ok(languages.every((l) => l.complete && l.missing === 0));
    agrees(languages, { standard });
  }
  assert.equal(procedureLanguages({ version: '9.9' }), null);
  assert.equal(procedureLanguages({ standard: 'nope' }), null);
});

test('the dictionaries given are the locales there are, read from them', () => {
  assert.deepEqual(locales(procedureLanguagesFrom({ en: EN, fr: FR_CORE }, {})), ['en', 'fr']);
  // A function's dictionaries can't be listed: options.locales names them.
  const fn = (l) => ({ en: EN, fr: FR_CORE })[l] || null;
  assert.deepEqual(locales(procedureLanguagesFrom(fn, {})), ['en']);
  assert.deepEqual(locales(procedureLanguagesFrom(fn, { locales: ['fr', 'de'] })), ['en', 'fr']);
  // A locale that lacks keys is offered, and says how many.
  const partial = { ...FR_CORE };
  delete partial.render_title_list;
  delete partial['wcag_1.4.3_title'];
  const fr = entry(procedureLanguagesFrom({ en: EN, fr: partial }, {}), 'fr');
  assert.deepEqual(fr, { locale: 'fr', complete: false, missing: 2 });
});

test('an earlier WCAG version is complete only with its own titles translated', () => {
  // 2.1's "Parsing" for 4.1.1 is its own title, and stays English.
  const languages = procedureLanguages({ version: '2.1' });
  assert.deepEqual(entry(languages, 'en'), { locale: 'en', complete: true, missing: 0 });
  assert.deepEqual(entry(languages, 'fr'), { locale: 'fr', complete: false, missing: 1 });
  agrees(languages, { version: '2.1' });
});

test('a standard that declares its languages reads in those alone', () => {
  const options = { standard: 'stdl', packs: [translated], version: '1.0' };
  const languages = procedureLanguages(options);
  assert.deepEqual(locales(languages), languagesOf(translated.standard));
  assert.deepEqual(locales(languages), ['en', 'fr']);
  assert.deepEqual(languages, [
    { locale: 'en', complete: true, missing: 0 },
    { locale: 'fr', complete: true, missing: 0 }
  ]);
  agrees(languages, options);
  // Core's text in that locale counts too: a key core's French lacks.
  const core = { ...FR_CORE };
  delete core['wcag_1.4.3_contrast-minimum-text_step1'];
  assert.deepEqual(entry(procedureLanguagesFrom({ en: EN, fr: core }, options), 'fr'), {
    locale: 'fr',
    complete: false,
    missing: 1
  });
  // A text it doesn't translate is counted, a facet's as a whole.
  const partial = { ...FR };
  delete partial['Every form has a text version.'];
  delete partial['A draft for comment.'];
  const pack = packWith({ translations: { fr: partial } });
  const fr = entry(procedureLanguages({ ...options, packs: [pack] }), 'fr');
  assert.deepEqual(fr, { locale: 'fr', complete: false, missing: 6 });
  agrees(procedureLanguages({ ...options, packs: [pack] }), { ...options, packs: [pack] });
});

test('a standard written in French puts French first', () => {
  const french = packWith({
    lang: 'fr',
    procedures: { '1.0': { 'R-1.4.3': { title: 'Contraste', wcag: '1.4.3' } } },
    groups: undefined,
    notes: undefined,
    composites: undefined,
    translations: { en: { Contraste: 'Contrast' } }
  });
  const options = { standard: 'stdl', packs: [french], version: '1.0' };
  const languages = procedureLanguages(options);
  assert.deepEqual(languages, [
    { locale: 'fr', complete: true, missing: 0 },
    { locale: 'en', complete: true, missing: 0 }
  ]);
  agrees(languages, options);
});

test('a language core doesn’t ship is complete only where the pack gives core’s text too', () => {
  const CA = Object.fromEntries(Object.keys(FR).map((k) => [k, `[ca] ${FR[k]}`]));
  const options = { standard: 'stdl', version: '1.0' };
  const bare = packWith({ translations: { ca: CA } });
  const ca = entry(procedureLanguages({ ...options, packs: [bare] }), 'ca');
  assert.equal(ca.complete, false);
  assert.ok(ca.missing > 0);
  agrees(procedureLanguages({ ...options, packs: [bare] }), { ...options, packs: [bare] });

  // The core keys a page of the standard reads: 1.4.3's procedures and the
  // steps its rules' findings show, the tools' names and the page's words.
  const core = Object.fromEntries(
    Object.keys(EN)
      .filter((k) => /^(wcag_1\.4\.3_|contrast(Minimum|Computable)_review_|tool_|render_)/.test(k))
      .map((k) => [k, `[ca] ${EN[k]}`])
  );
  const full = packWith({ translations: { ca: CA } }, { ca: core });
  const languages = procedureLanguages({ ...options, packs: [full] });
  assert.deepEqual(entry(languages, 'ca'), { locale: 'ca', complete: true, missing: 0 });
  agrees(languages, { ...options, packs: [full] });

  // Each core key it leaves out is one text in English.
  const lacking = { ...core };
  delete lacking['wcag_1.4.3_contrast-minimum-text_step1'];
  delete lacking.render_title_list;
  const some = packWith({ translations: { ca: CA } }, { ca: lacking });
  assert.deepEqual(entry(procedureLanguages({ ...options, packs: [some] }), 'ca'), {
    locale: 'ca',
    complete: false,
    missing: 2
  });
});

test('a standard that declares no languages is English, and core’s follow the locale', () => {
  const options = { standard: 'stdl', packs: [legacy], version: '1.0' };
  const languages = procedureLanguages(options);
  assert.deepEqual(locales(languages), ['en'].concat(SHIPPED.filter((l) => l !== 'en').sort()));
  assert.deepEqual(entry(languages, 'en'), { locale: 'en', complete: true, missing: 0 });
  // Its own texts stay English: two titles, a note, a facet's five texts, a
  // group's title and the notes.
  for (const l of languages.filter((x) => x.locale !== 'en')) {
    assert.deepEqual(l, { locale: l.locale, complete: false, missing: 10 });
  }
  agrees(languages, options);
});

test('completeness is for the version asked, the latest by default', () => {
  const options = { standard: 'stdl', packs: [translated] };
  const v1 = entry(procedureLanguages({ ...options, version: '1.0' }), 'fr');
  assert.equal(v1.complete, true);
  // 2.0's new requirement has no French title.
  const v2 = entry(procedureLanguages({ ...options, version: '2.0' }), 'fr');
  assert.deepEqual(v2, { locale: 'fr', complete: false, missing: 1 });
  assert.deepEqual(entry(procedureLanguages(options), 'fr'), v2);
  agrees(procedureLanguages(options), options);
  assert.equal(procedureLanguages({ ...options, version: '3.0' }), null);
});
