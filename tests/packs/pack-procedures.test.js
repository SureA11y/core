'use strict';

// A pack's standard says how a person assesses each of its requirements by
// hand (standard.procedures, docs/PROCEDURES.md): a requirement that
// restates a WCAG criterion takes its procedures ({ wcag }), one of its own
// gives its facets, in English. proceduresFor and proceduresFrom read them
// with the packs.

const test = require('node:test');
const assert = require('node:assert/strict');

const { checkPack, definePack, ruleMappedStandard } = require('../../src/pack.js');
const { proceduresFor } = require('../../src/index.js');
const { proceduresFrom } = require('../../src/procedures-core.js');

const requirements = {
  '1.0': { 'R-1.4.3': { title: 'Contrast', wcagSc: ['1.4.3'] } },
  '2.0': { 'R-1.4.3': { title: 'Contrast of text', wcagSc: ['1.4.3'] } }
};
const ruleMap = {
  '1.0': { 'contrast-minimum': { requirements: ['R-1.4.3'] } },
  '2.0': { 'contrast-minimum': { requirements: ['R-1.4.3'] } }
};

const OWN = {
  title: 'A text version of every form',
  facets: [
    {
      id: 'text-version',
      label: 'Each form can be had as a text document',
      tools: ['keyboard'],
      steps: ['Find each form on the page.', 'Look next to it for a link to a text version.'],
      passWhen: 'Every form has a text version.',
      failWhen: 'A form has no text version, which fails requirement R-9.'
    }
  ]
};

function packWith(procedures) {
  const std = ruleMappedStandard({
    standard: 'Std P',
    tag: 'stdp',
    versions: [
      { version: '1.0', wcagVersion: '2.2' },
      { version: '2.0', wcagVersion: '2.2' }
    ],
    requirements,
    ruleMap
  });
  return {
    name: 'stdp-pack',
    version: '1.0.0',
    namespace: 'stdp',
    core: '*',
    standard: {
      key: 'stdp',
      standard: 'Std P',
      versions: ['1.0', '2.0'],
      ruleTag: 'stdp',
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate,
      procedures
    }
  };
}

const pack = definePack(
  packWith({
    '1.0': { 'R-1.4.3': { title: 'Contrast', wcag: '1.4.3' } },
    '2.0': { 'R-1.4.3': { title: 'Contrast of text', wcag: '1.4.3' }, 'R-9': OWN }
  })
);

test('a requirement that restates a criterion takes its procedures', () => {
  const r = proceduresFor('R-1.4.3', { packs: [pack], standard: 'stdp' });
  const wcag = proceduresFor('1.4.3');
  assert.deepEqual(
    {
      standard: r.standard,
      id: r.id,
      version: r.version,
      title: r.title,
      level: r.level,
      wcag: r.wcag
    },
    {
      standard: 'Std P',
      id: 'R-1.4.3',
      version: '2.0',
      title: 'Contrast of text',
      level: null,
      wcag: '1.4.3'
    }
  );
  assert.deepEqual(r.facets, wcag.facets);
  assert.deepEqual(r.rules, wcag.rules);
  assert.equal(r.complete, true);
  // An earlier version, by name.
  assert.equal(
    proceduresFor('R-1.4.3', { packs: [pack], standard: 'Std P', version: '1.0' }).title,
    'Contrast'
  );
  // In another locale, the criterion's procedures in it.
  assert.deepEqual(
    proceduresFor('R-1.4.3', { packs: [pack], locale: 'fr' }).facets,
    proceduresFor('1.4.3', { locale: 'fr' }).facets
  );
});

test('a requirement of its own gives its facets, in English', () => {
  const r = proceduresFor('R-9', { packs: [pack], locale: 'de' });
  assert.equal(r.title, 'A text version of every form');
  assert.equal(r.complete, true);
  assert.deepEqual(r.rules, []);
  assert.deepEqual(r.facets, [
    {
      id: 'text-version',
      label: 'Each form can be had as a text document',
      automation: 'manual',
      rules: [],
      tools: [{ id: 'keyboard', label: 'A keyboard' }],
      procedure: {
        steps: ['Find each form on the page.', 'Look next to it for a link to a text version.'],
        passWhen: 'Every form has a text version.',
        failWhen: 'A form has no text version, which fails requirement R-9.'
      },
      variants: []
    }
  ]);
  // Not in 1.0.
  assert.equal(proceduresFor('R-9', { packs: [pack], version: '1.0' }), null);
});

test('WCAG comes first, a standard by name reads only its packs, and none without packs', () => {
  assert.equal(proceduresFor('1.4.3', { packs: [pack] }).standard, 'wcag');
  assert.equal(proceduresFor('1.4.3', { packs: [pack], standard: 'stdp' }), null);
  assert.equal(proceduresFor('R-1.4.3'), null);
  assert.equal(proceduresFor('R-1.4.3', { packs: [pack], standard: 'other' }), null);
  assert.equal(proceduresFor('1.4.3', { standard: 'wcag' }).id, '1.4.3');
});

test('proceduresFrom reads a pack’s procedures as proceduresFor does', () => {
  const en = require('../../src/i18n/procedures/en.json');
  for (const [id, opts] of [
    ['R-1.4.3', { packs: [pack] }],
    ['R-9', { packs: [pack], standard: 'stdp' }]
  ]) {
    assert.deepEqual(proceduresFrom({ en }, id, opts), proceduresFor(id, opts));
  }
});

test('checkPack refuses procedures it can’t read', () => {
  const problems = (procedures) => checkPack(packWith(procedures));
  assert.deepEqual(problems({ '1.0': { 'R-1.4.3': { wcag: '1.4.3' } } }), []);
  assert.match(problems('x').join('\n'), /standard\.procedures must be/);
  assert.match(
    problems({ '3.0': { 'R-1.4.3': { wcag: '1.4.3' } } }).join('\n'),
    /"3\.0" is not one of the standard's versions/
  );
  assert.match(
    problems({ '1.0': { 'R-1.4.3': { wcag: '9.9.9' } } }).join('\n'),
    /wcag names no WCAG criterion/
  );
  assert.match(
    problems({ '1.0': { 'R-1.4.3': { wcag: '1.4.3', facets: [] } } }).join('\n'),
    /either wcag or facets/
  );
  const bad = { ...OWN.facets[0], tools: ['telescope'], steps: [], automation: 'some' };
  const found = problems({ '1.0': { 'R-9': { facets: [bad] } } }).join('\n');
  assert.match(found, /tools must list tools of/);
  assert.match(found, /steps must list 1 to 8 steps/);
  assert.match(found, /automation must be one of/);
  assert.throws(() => definePack(packWith({ '1.0': 'x' })), /standard\.procedures/);
});

test('ruleMappedStandard gives procedures for a standard that restates WCAG', () => {
  const kit = (applicability) =>
    ruleMappedStandard({
      standard: 'Std P',
      tag: 'stdp',
      versions: [{ version: '1.0', wcagVersion: '2.2' }],
      requirements: { '1.0': requirements['1.0'] },
      ruleMap: { '1.0': ruleMap['1.0'] },
      ...(applicability ? { applicability } : {})
    });
  assert.deepEqual(kit('wcag').procedures, {
    '1.0': { 'R-1.4.3': { title: 'Contrast', wcag: '1.4.3' } }
  });
  assert.equal(kit().procedures, undefined);
});
