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
  PROCEDURES_DIR,
  REVIEW_DIR
} = require('../scripts/generate-procedures.js');
const { PROCEDURES } = require('../src/procedures/registry.js');
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

test('the text has no key the registry doesn’t list, and every locale has every key', () => {
  const stems = new Set(ALL.map(stemOf));
  const en = read(PROCEDURES_DIR, 'en');
  const orphans = Object.keys(en).filter(
    (key) =>
      ![...stems].some(
        (stem) => key.startsWith(stem) && /^(step\d+|pass|fail)$/.test(key.slice(stem.length))
      )
  );
  assert.deepEqual(orphans, []);
  const keys = Object.keys(en).sort();
  for (const l of LOCALES) assert.deepEqual(Object.keys(read(PROCEDURES_DIR, l)).sort(), keys, l);
});

test('no core rule keeps its steps in meta.review: they are in src/procedures', () => {
  const kept = [...RULES].filter(([, file]) => require(file).meta.review !== undefined);
  assert.deepEqual(
    kept.map(([id]) => id),
    []
  );
});
