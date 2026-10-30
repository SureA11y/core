'use strict';

/**
 * src/procedures: how a person assesses each criterion by hand, the one
 * source of the steps an undecided finding shows (docs/OUTPUT_SCHEMA.md,
 * "How to check"). The registry files each reason code a core rule can
 * report as cantTell under one facet; the text is in
 * src/i18n/procedures/<locale>.json; the review dictionaries are made from
 * them.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  reviewDictionaries,
  variants,
  prefixOf,
  rulesIndex,
  PROCEDURES_DIR,
  REVIEW_DIR,
  RULES_FILE
} = require('../scripts/generate-procedures.js');
const { PROCEDURES, TOOLS } = require('../src/procedures/registry.js');
const { proceduresFor, howToCheckFor } = require('../src/index.js');
const { proceduresFrom } = require('../src/procedures-core.js');
const { FACETS } = require('../src/coverage/wcag-facets.js');

const ROOT = path.join(__dirname, '..');
const RULE_FILES = ['automatic', 'manual']
  .flatMap((d) =>
    fs.readdirSync(path.join(ROOT, 'src/checks', d)).map((f) => path.join(ROOT, 'src/checks', d, f))
  )
  .concat([path.join(ROOT, 'src/checks/manual-review.js')])
  .filter((f) => f.endsWith('.js'));
const RULES = new Map(RULE_FILES.map((file) => [require(file).id, file]));

const read = (dir, locale) => JSON.parse(fs.readFileSync(path.join(dir, `${locale}.json`), 'utf8'));
const LOCALES = fs
  .readdirSync(PROCEDURES_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.slice(0, -'.json'.length));

const ALL = variants();
const stemOf = (v) => `${prefixOf(v.ruleId)}_review_${v.code}_`;

test('the review dictionaries are made from the procedures (npm run procedures)', () => {
  const want = reviewDictionaries();
  assert.deepEqual(Object.keys(want).sort(), ['de', 'en', 'es', 'fr', 'ja']);
  for (const [locale, text] of Object.entries(want)) {
    assert.equal(
      fs.readFileSync(path.join(REVIEW_DIR, `${locale}.json`), 'utf8'),
      text,
      `src/i18n/review/${locale}.json is stale: run npm run procedures`
    );
  }
});

test('src/procedures/rules.json is made from the rules (npm run procedures)', () => {
  assert.equal(fs.readFileSync(RULES_FILE, 'utf8'), rulesIndex());
});

test('each reason code is under one facet, and is one its rule gives', () => {
  assert.ok(ALL.length > 240, `only ${ALL.length} variants`);
  const seen = new Map();
  for (const v of ALL) {
    const at = `${v.ruleId} ${v.code}`;
    assert.ok(!seen.has(at), `${at} is under ${seen.get(at)} and ${v.facet}`);
    seen.set(at, v.facet);
    const file = RULES.get(v.ruleId);
    assert.ok(file, `${v.ruleId} is not a core rule`);
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(
      src.includes(`'${v.code}'`) || src.includes('`' + v.code + '`'),
      `${at}: "${v.code}" is not a reason code of the rule`
    );
  }
});

test('every reason code a rule header lists as cantTell has steps', () => {
  const have = new Set(ALL.map((v) => `${v.ruleId} ${v.code}`));
  const missing = [];
  let codes = 0;
  for (const [id, file] of RULES) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/^ \* {3}- `([A-Za-z0-9_]+)` \(([^)]*)\)/gm)) {
      if (!/cantTell/.test(m[2])) continue;
      codes += 1;
      if (!have.has(`${id} ${m[1]}`)) missing.push(`${id} ${m[1]}`);
    }
  }
  assert.ok(codes > 150, `only ${codes} cantTell codes found`);
  assert.deepEqual(missing, []);
});

test('a criterion’s facets are the registry’s, and its variants’ rules test it', () => {
  for (const [criterion, facets] of Object.entries(PROCEDURES.wcag)) {
    assert.ok(FACETS[criterion], `${criterion} is not a WCAG criterion`);
    const ids = (FACETS[criterion].facets || []).map((f) => f.id);
    for (const facet of Object.keys(facets)) {
      assert.ok(ids.includes(facet), `${criterion} has no facet ${facet} in wcag-facets.js`);
    }
  }
  for (const v of ALL.filter((x) => x.group === 'wcag')) {
    const { meta } = require(RULES.get(v.ruleId));
    const claimed = Array.isArray(meta.wcagSc) ? meta.wcagSc : [];
    // manual-review asks for a keyboard walk-through and claims no criterion.
    assert.ok(
      claimed.includes(v.criterion) || claimed.length === 0,
      `${v.ruleId} ${v.code} is under ${v.criterion}, which the rule doesn't test`
    );
    assert.ok(!meta.tags.includes('best-practice'), `${v.ruleId} is a best practice`);
  }
});

test('best practices are apart from the criteria, each facet with its label', () => {
  for (const [facet, entry] of Object.entries(PROCEDURES['best-practice'])) {
    assert.ok(typeof entry.label === 'string' && entry.label.trim(), `${facet} has no label`);
    assert.ok(['full', 'partial', 'manual'].includes(entry.automation), `${facet} automation`);
  }
  for (const v of ALL.filter((x) => x.group === 'best-practice')) {
    const { meta } = require(RULES.get(v.ruleId));
    assert.ok(meta.tags.includes('best-practice'), `${v.ruleId} is not a best practice`);
    assert.deepEqual(meta.wcagSc, [], `${v.ruleId} claims a criterion`);
  }
  assert.deepEqual(Object.keys(PROCEDURES), ['wcag', 'best-practice']);
});

test('every variant has 1 to 6 steps, a pass and a fail, in English', () => {
  const en = read(PROCEDURES_DIR, 'en');
  for (const v of ALL) {
    const stem = stemOf(v);
    let n = 0;
    while (typeof en[`${stem}step${n + 1}`] === 'string') n++;
    assert.ok(n >= 1 && n <= 6, `${stem}: ${n} steps`);
    for (const key of [`${stem}pass`, `${stem}fail`]) {
      assert.ok(typeof en[key] === 'string' && en[key].trim(), `${key} missing`);
    }
  }
});

// A facet's general procedure: `<group>_<criterion>_<facet>_`, or, for a
// best practice, which has no criterion, `best-practice_<facet>_`.
const PROCEDURE_STEMS = [
  ...Object.entries(PROCEDURES.wcag).flatMap(([criterion, facets]) =>
    Object.keys(facets).map((facet) => `wcag_${criterion}_${facet}_`)
  ),
  ...Object.keys(PROCEDURES['best-practice']).map((facet) => `best-practice_${facet}_`)
];
const isTextOf = (stem, key) =>
  key.startsWith(stem) && /^(step\d+|pass|fail)$/.test(key.slice(stem.length));

test('the text has no key the registry doesn’t list', () => {
  const stems = [...new Set(ALL.map(stemOf)), ...PROCEDURE_STEMS];
  const tools = new Set(TOOLS.map((t) => `tool_${t}`));
  const en = read(PROCEDURES_DIR, 'en');
  const orphans = Object.keys(en).filter(
    (key) => !tools.has(key) && !stems.some((stem) => isTextOf(stem, key))
  );
  assert.deepEqual(orphans, []);
  for (const t of tools) assert.ok(typeof en[t] === 'string' && en[t].trim(), `${t} missing`);
});

// The variants' text came with its translations and keeps them; a general
// procedure is written in English first, and a locale without it reads it
// in English.
test('every locale has every variant’s text, and no key English lacks', () => {
  const en = read(PROCEDURES_DIR, 'en');
  const stems = [...new Set(ALL.map(stemOf))];
  const variantKeys = Object.keys(en)
    .filter((key) => stems.some((stem) => isTextOf(stem, key)))
    .sort();
  for (const l of LOCALES) {
    const keys = Object.keys(read(PROCEDURES_DIR, l));
    assert.deepEqual(
      keys.filter((key) => stems.some((stem) => isTextOf(stem, key))).sort(),
      variantKeys,
      l
    );
    assert.deepEqual(
      keys.filter((key) => !(key in en)),
      [],
      `${l} has keys English doesn’t`
    );
  }
});

test('a facet covered by another names one of its criterion with a procedure of its own', () => {
  const en = read(PROCEDURES_DIR, 'en');
  let covered = 0;
  for (const [criterion, facets] of Object.entries(PROCEDURES.wcag)) {
    for (const [facet, entry] of Object.entries(facets)) {
      if (entry.coveredBy === undefined) continue;
      covered += 1;
      const at = `${criterion} ${facet}`;
      const target = facets[entry.coveredBy];
      assert.ok(
        target && target.coveredBy === undefined,
        `${at}: ${entry.coveredBy} can't cover it`
      );
      assert.ok(
        typeof en[`wcag_${criterion}_${entry.coveredBy}_step1`] === 'string',
        `${at}: ${entry.coveredBy} has no procedure`
      );
      assert.equal(entry.tools, undefined, `${at}: tools of its own`);
      assert.equal(
        en[`wcag_${criterion}_${facet}_step1`],
        undefined,
        `${at}: a procedure of its own`
      );
    }
  }
  const r = proceduresFor('1.1.1');
  for (const f of r.facets.filter((x) => x.coveredBy)) {
    assert.equal(f.procedure, null);
    assert.ok(r.facets.find((x) => x.id === f.coveredBy).procedure, f.id);
  }
  assert.ok(covered === 0 || r.facets.some((f) => f.coveredBy));
});

test('a facet with a general procedure has 1 to 8 steps and names its tools', () => {
  const en = read(PROCEDURES_DIR, 'en');
  const entries = [
    ...Object.entries(PROCEDURES.wcag).flatMap(([criterion, facets]) =>
      Object.entries(facets).map(([facet, entry]) => [`wcag_${criterion}_${facet}_`, entry])
    ),
    ...Object.entries(PROCEDURES['best-practice']).map(([facet, entry]) => [
      `best-practice_${facet}_`,
      entry
    ])
  ];
  let procedures = 0;
  for (const [stem, entry] of entries) {
    const has = typeof en[`${stem}step1`] === 'string';
    if (!has) {
      assert.equal(entry.tools, undefined, `${stem}: tools without a procedure`);
      continue;
    }
    procedures += 1;
    let n = 0;
    while (typeof en[`${stem}step${n + 1}`] === 'string') n++;
    assert.ok(n >= 1 && n <= 8, `${stem}: ${n} steps`);
    for (const key of [`${stem}pass`, `${stem}fail`]) {
      assert.ok(typeof en[key] === 'string' && en[key].trim(), `${key} missing`);
    }
    assert.match(
      en[`${stem}fail`],
      /\bfails WCAG \d|best practice/,
      `${stem}fail names no criterion`
    );
    assert.ok(Array.isArray(entry.tools), `${stem}: no tools`);
    for (const tool of entry.tools) assert.ok(TOOLS.includes(tool), `${stem}: tool ${tool}`);
  }
  assert.ok(procedures >= 10, `only ${procedures} procedures`);
});

// The sample criteria (one manual only, one partly automated, one only a
// person can judge) have every facet written; the rest follow.
test('1.4.13, 1.4.12 and 2.4.3 have a procedure for every facet', () => {
  for (const criterion of ['1.4.13', '1.4.12', '2.4.3']) {
    const ids = FACETS[criterion].facets.map((f) => f.id);
    assert.deepEqual(Object.keys(PROCEDURES.wcag[criterion]), ids, criterion);
    const r = proceduresFor(criterion);
    assert.equal(r.complete, true, criterion);
    assert.deepEqual(
      r.facets.map((f) => f.id),
      ids
    );
  }
});

test('no core rule keeps its steps in meta.review: they are in src/procedures', () => {
  const kept = [...RULES].filter(([, file]) => require(file).meta.review !== undefined);
  assert.deepEqual(
    kept.map(([id]) => id),
    []
  );
});

// The API by criterion (docs/PROCEDURES.md).

test('proceduresFor gives a criterion’s facets, rules, procedures and tools', () => {
  const r = proceduresFor('1.4.12');
  assert.deepEqual(
    { standard: r.standard, id: r.id, title: r.title, level: r.level, complete: r.complete },
    { standard: 'wcag', id: '1.4.12', title: 'Text Spacing', level: 'AA', complete: true }
  );
  assert.deepEqual(r.rules, ['avoid-inline-spacing', 'text-spacing-content-loss']);
  const loss = r.facets.find((f) => f.id === 'text-spacing-content-loss');
  assert.equal(loss.automation, 'partial');
  assert.deepEqual(loss.rules, ['text-spacing-content-loss']);
  assert.deepEqual(
    loss.tools.map((t) => t.id),
    ['devtools', 'keyboard']
  );
  assert.equal(loss.tools[0].label, "The browser's developer tools");
  assert.match(loss.procedure.steps[0], /Styles pane/);
  assert.match(loss.procedure.failWhen, /fails WCAG 1\.4\.12/);
  assert.equal(loss.variants.length, 8);
  const manual = r.facets.find((f) => f.id === 'text-spacing-other-states');
  assert.deepEqual(manual.rules, []);
  assert.deepEqual(manual.variants, []);

  // A criterion without procedures (here, read without them): its facets,
  // and their variants.
  const en = read(PROCEDURES_DIR, 'en');
  const variantsOnly = Object.fromEntries(
    Object.entries(en).filter(([key]) => !key.startsWith('wcag_'))
  );
  const partial = proceduresFrom({ en: variantsOnly }, '1.4.3');
  assert.equal(partial.complete, false);
  assert.ok(partial.facets.every((f) => f.procedure === null && f.tools.length === 0));
  assert.ok(partial.facets.some((f) => f.variants.length > 0));

  assert.equal(proceduresFor('9.9.9'), null);
  assert.equal(proceduresFor(''), null);
  const bp = proceduresFor('best-practice');
  assert.equal(bp.standard, 'best-practice');
  assert.equal(bp.level, null);
  assert.ok(bp.rules.includes('heading-order'));
});

test('a variant read by criterion is exactly the finding’s howToCheck, in every locale', () => {
  let n = 0;
  for (const locale of ['en', 'de', 'es', 'fr', 'ja', 'fr-CA', 'pt']) {
    const requirements = [...Object.keys(PROCEDURES.wcag), 'best-practice'];
    for (const requirement of requirements) {
      for (const facet of proceduresFor(requirement, { locale }).facets) {
        for (const v of facet.variants) {
          const { steps, passWhen, failWhen } = v;
          assert.deepEqual(
            { steps, passWhen, failWhen },
            howToCheckFor(v.ruleId, v.reasonCode, locale),
            `${v.ruleId} ${v.reasonCode} ${locale}`
          );
          n++;
        }
      }
    }
  }
  assert.equal(n, ALL.length * 7);
});

test('a locale without a procedure reads it in English; one with it, its own', () => {
  const en = proceduresFor('1.4.13').facets[0].procedure;
  assert.deepEqual(proceduresFor('1.4.13', { locale: 'ja' }).facets[0].procedure, en);
  const dicts = {
    en: read(PROCEDURES_DIR, 'en'),
    fr: { 'wcag_1.4.13_hover-focus-content-dismissible_step1': 'Survolez la page.' }
  };
  const fr = proceduresFrom(dicts, '1.4.13', { locale: 'fr-CA' }).facets[0].procedure;
  assert.equal(fr.steps[0], 'Survolez la page.');
  assert.equal(fr.steps[1], en.steps[1]);
  assert.equal(fr.steps.length, en.steps.length);
});

test('proceduresFrom gives what proceduresFor gives, from the dictionaries passed', () => {
  const dicts = Object.fromEntries(LOCALES.map((l) => [l, read(PROCEDURES_DIR, l)]));
  for (const requirement of ['1.4.12', '2.4.3', '4.1.2', 'best-practice']) {
    for (const locale of ['en', 'fr', ['de', 'es']]) {
      assert.deepEqual(
        proceduresFrom(dicts, requirement, { locale }),
        proceduresFor(requirement, { locale })
      );
      assert.deepEqual(
        proceduresFrom((l) => dicts[l], requirement, { locale }),
        proceduresFor(requirement, { locale })
      );
    }
  }
});
