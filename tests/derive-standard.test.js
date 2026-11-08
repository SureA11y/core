'use strict';

/**
 * deriveStandard (src/derive-standard.js): a standard built on others, as
 * RAWeb is on RGAA and EN 301 549, and BITV-Test on EN 301 549 split into
 * steps. Two small bases stand in for them: a one-level one ("en") and one
 * with tests ("rg").
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { deriveStandard } = require('../src/derive-standard.js');
const { checkStandardData, standardFromData, standardDataOf } = require('../src/standard-data.js');
const { definePack } = require('../src/pack.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const copy = (v) => JSON.parse(JSON.stringify(v));

// One level: clauses, as EN 301 549.
const en = {
  format: 'surea11y-standard/1',
  key: 'en',
  standard: 'EN-like',
  versions: [{ version: 'V3', wcagVersion: '2.1' }],
  data: {
    V3: {
      requirements: {
        '9.1.1.1': { title: 'Non-text content', wcagSc: ['1.1.1'] },
        '9.1.4.3': { title: 'Contrast (minimum)', wcagSc: ['1.4.3'] },
        '9.2.4.2': { title: 'Page titled', wcagSc: ['2.4.2'] }
      },
      ruleMap: {
        'img-alt-present': { requirements: ['9.1.1.1'] },
        'input-image-alt-present': { requirements: ['9.1.1.1'] },
        'contrast-minimum': { requirements: ['9.1.4.3'] },
        'page-title-present': { requirements: ['9.2.4.2'] }
      }
    }
  }
};

// Two levels: criteria with tests, as RGAA.
const rg = {
  format: 'surea11y-standard/1',
  key: 'rg',
  standard: 'RG-like',
  lang: 'fr',
  versions: [{ version: '4', wcagVersion: '2.1' }],
  options: { wcagCorrespondence: true },
  data: {
    4: {
      requirements: {
        1.1: { title: 'Images', wcagSc: ['1.1.1'], tests: ['1.1.1', '1.1.2'], partial: true },
        3.2: { title: 'Contraste', wcagSc: ['1.4.3'], tests: ['3.2.1'] }
      },
      tests: {
        '1.1.1': { title: 'Une <img> a un alt', requirements: ['1.1'] },
        '1.1.2': { title: 'Un bouton image a un alt', requirements: ['1.1'] },
        '3.2.1': { title: 'Texte normal', requirements: ['3.2'] }
      },
      ruleMap: {
        'img-alt-present': { requirements: ['1.1.1'] },
        'input-image-alt-present': { requirements: ['1.1.2'] },
        'img-alt-quality': { requirements: [], asks: ['1.1.1'] },
        'contrast-minimum': {
          requirements: ['3.2.1'],
          reasonCodes: { X: { requirements: ['3.2.1'], outcome: 'cantTell' } }
        }
      }
    }
  }
};

// RAWeb-like: on both. Two RG criteria kept as they are, one of its own on
// an EN clause; 3.2 is left out.
const lux = {
  format: 'surea11y-standard/1',
  key: 'lux',
  standard: 'LUX-like',
  versions: [
    {
      version: '1',
      wcagVersion: '2.1',
      basedOn: [
        { standard: 'rg', version: '4' },
        { standard: 'en', version: 'V3' }
      ]
    }
  ],
  data: {
    1: {
      requirements: {
        1.1: { basedOn: [{ standard: 'rg', id: '1.1' }] },
        14.1: { title: 'La page a un titre', basedOn: [{ standard: 'en', id: '9.2.4.2' }] }
      },
      // img-alt-present and input-image-alt-present come from both bases.
      ruleMap: {
        'img-alt-present': { requirements: ['1.1.1'] },
        'input-image-alt-present': { requirements: ['1.1.2'] }
      }
    }
  }
};

// BITV-like: on EN, 9.1.1.1 split into two steps.
const bitv = {
  format: 'surea11y-standard/1',
  key: 'bitv',
  standard: 'BITV-like',
  versions: [{ version: '1', wcagVersion: '2.1', basedOn: [{ standard: 'en', version: 'V3' }] }],
  data: {
    1: {
      requirements: {
        '9.1.1.1': {
          basedOn: [{ standard: 'en', id: '9.1.1.1' }],
          tests: ['9.1.1.1a', '9.1.1.1b']
        },
        '9.1.4.3': { basedOn: [{ standard: 'en', id: '9.1.4.3' }] }
      },
      tests: {
        '9.1.1.1a': { title: 'Alternativtexte für Bedienelemente', requirements: ['9.1.1.1'] },
        '9.1.1.1b': { title: 'Alternativtexte für Grafiken', requirements: ['9.1.1.1'] }
      },
      ruleMap: {
        // Narrowed: an image button is a control.
        'input-image-alt-present': { requirements: ['9.1.1.1a'] },
        // Dropped.
        'contrast-minimum': null
      }
    }
  }
};

test('a derived requirement takes its base fields, and its own replace them', () => {
  const d = deriveStandard([rg, en], lux);
  assert.deepEqual(checkStandardData(d), []);
  const req = d.data[1].requirements;
  assert.equal(req['1.1'].title, 'Images');
  assert.equal(req['1.1'].partial, true);
  assert.deepEqual(req['1.1'].wcagSc, ['1.1.1']);
  assert.equal(req['14.1'].title, 'La page a un titre');
  assert.deepEqual(req['14.1'].wcagSc, ['2.4.2']);
  // Its basedOn stays: it is the provenance.
  assert.deepEqual(req['14.1'].basedOn, [{ standard: 'en', id: '9.2.4.2' }]);
});

test("only what is declared exists, and a base requirement's tests come with it", () => {
  const d = deriveStandard([rg, en], lux);
  assert.deepEqual(Object.keys(d.data[1].requirements).sort(), ['1.1', '14.1']);
  assert.deepEqual(d.data[1].requirements['1.1'].tests, ['1.1.1', '1.1.2']);
  assert.deepEqual(d.data[1].tests['1.1.1'], {
    title: 'Une <img> a un alt',
    requirements: ['1.1'],
    basedOn: [{ standard: 'rg', id: '1.1.1' }]
  });
  assert.equal(d.data[1].tests['3.2.1'], undefined);
});

test('the rule map flows through provenance, and a row left with nothing is dropped', () => {
  const d = deriveStandard([rg, en], lux);
  const map = d.data[1].ruleMap;
  // From RG: asks carried; from EN: page-title on 14.1.
  assert.deepEqual(map['img-alt-quality'], { requirements: [], asks: ['1.1.1'] });
  assert.deepEqual(map['page-title-present'], { requirements: ['14.1'] });
  // contrast-minimum checks 3.2.1 (RG) and 9.1.4.3 (EN), neither kept: dropped.
  assert.equal(map['contrast-minimum'], undefined);
  // The derived standard's own rows.
  assert.deepEqual(map['img-alt-present'], { requirements: ['1.1.1'] });
});

test('a rule from two bases needs a row of its own', () => {
  const noOwn = copy(lux);
  delete noOwn.data[1].ruleMap['img-alt-present'];
  // Only a conflict when both rows reach this standard: here EN's 9.1.1.1 is kept too.
  assert.doesNotThrow(() => deriveStandard([rg, en], noOwn));
  noOwn.data[1].requirements['1.9'] = { basedOn: [{ standard: 'en', id: '9.1.1.1' }] };
  assert.throws(
    () => deriveStandard([rg, en], noOwn),
    /img-alt-present comes from both rg and en; give the rule a row of its own/
  );
});

test('a requirement split into tests takes its base rows on them; own rows replace, null drops', () => {
  const d = deriveStandard([en], bitv);
  const map = d.data[1].ruleMap;
  assert.deepEqual(map['img-alt-present'], { requirements: ['9.1.1.1a', '9.1.1.1b'] });
  assert.deepEqual(map['input-image-alt-present'], { requirements: ['9.1.1.1a'] });
  assert.equal(map['contrast-minimum'], undefined);
  assert.equal(d.data[1].requirements['9.1.1.1'].title, 'Non-text content');
  // 9.1.4.3 is kept, though no rule checks it now.
  assert.ok(d.data[1].requirements['9.1.4.3']);
});

test('routes are carried through provenance', () => {
  const kept = copy(lux);
  kept.data[1].requirements['3.2'] = { basedOn: [{ standard: 'rg', id: '3.2' }] };
  kept.data[1].ruleMap['contrast-minimum'] = undefined;
  delete kept.data[1].ruleMap['contrast-minimum'];
  const own = copy(kept);
  // EN's contrast row would conflict with RG's: resolve it with RG's shape.
  own.data[1].ruleMap['contrast-minimum'] = {
    requirements: ['3.2.1'],
    reasonCodes: { X: { requirements: ['3.2.1'], outcome: 'cantTell' } }
  };
  const d = deriveStandard([rg, en], own);
  assert.deepEqual(d.data[1].ruleMap['contrast-minimum'].reasonCodes, {
    X: { requirements: ['3.2.1'], outcome: 'cantTell' }
  });
});

test('a basedOn the bases cannot answer is an error, naming it', () => {
  const problems = (change, bases = [rg, en]) => {
    const d = copy(lux);
    change(d);
    try {
      deriveStandard(bases, d);
      return '';
    } catch (e) {
      return e.message;
    }
  };
  assert.match(
    problems((d) => (d.data[1].requirements['1.1'].basedOn = [{ standard: 'rg', id: '9.9' }])),
    /rg 4 has no requirement or test 9\.9/
  );
  assert.match(
    problems((d) => (d.versions[0].basedOn[0].version = '5')),
    /based on rg 5, which that base doesn't have/
  );
  assert.match(
    problems((d) => d.versions[0].basedOn.push({ standard: 'xx', version: '1' })),
    /xx, which is not among the bases/
  );
  assert.match(
    problems(
      (d) => (d.data[1].requirements['1.1'].basedOn = [{ standard: 'rg', id: '1.1' }]),
      [en]
    ),
    /rg, which is not among the bases/
  );
  assert.throws(() => deriveStandard([], lux), /bases must be a non-empty list/);
  assert.throws(() => deriveStandard([{ ...rg, format: 'x' }], lux), /bases\[0\]: format/);
});

test("a derived standard's results name what each requirement and test is based on", () => {
  const data = deriveStandard([en], bitv);
  data.profiles = { 'bitv-1': { version: '1', tags: ['wcag2a', 'bitv'], mappedRules: true } };
  const pack = definePack({
    name: 'bitv-like',
    version: '1.0.0',
    namespace: 'bitv',
    core: '*',
    standard: standardFromData(data)
  });
  assert.ok(standardDataOf(pack.standard));
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
    '<input type="image" src="b.png"></main></body></html>';
  const result = runa11yCoreOnHtml(html, { engineOptions: { packs: [pack], profile: 'bitv-1' } });
  const nonText = result.rulesResults.find((r) => r.ruleId === 'bitv-1-9.1.1.1');
  assert.equal(nonText.outcome, 'fail');
  const entries = nonText.meta.normativeMappings.filter((m) => m.standard === 'BITV-like');
  assert.deepEqual(
    entries.map((m) => [m.requirement, m.criterion]),
    [['9.1.1.1a', '9.1.1.1']]
  );
  // The step is the derived standard's own; its requirement names its base.
  const rollup = pack.standard.composites().find((c) => c.id === 'bitv-1-9.1.1.1');
  assert.ok(rollup);
  const kit = pack.standard.mappingsFor({ id: 'page-title-present' });
  assert.deepEqual(kit, []);
  const req = standardDataOf(pack.standard).data[1].requirements['9.1.1.1'];
  assert.deepEqual(req.basedOn, [{ standard: 'en', id: '9.1.1.1' }]);
});

test("a result entry carries its requirement's provenance", () => {
  const data = deriveStandard([rg, en], lux);
  const entry = standardFromData(data);
  const titled = entry.mappingsFor({ id: 'page-title-present', wcagSc: ['2.4.2'] });
  assert.deepEqual(titled, [
    {
      standard: 'LUX-like',
      version: '1',
      requirement: '14.1',
      title: 'La page a un titre',
      wcagSc: ['2.4.2'],
      basedOn: [{ standard: 'en', id: '9.2.4.2' }]
    }
  ]);
  const img = entry.mappingsFor({ id: 'img-alt-present', wcagSc: ['1.1.1'] });
  assert.deepEqual(img[0].basedOn, [{ standard: 'rg', id: '1.1.1' }]);
  assert.equal(img[0].criterion, '1.1');
});
