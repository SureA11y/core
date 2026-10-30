'use strict';

/**
 * What a person is told today about every undecided finding of a core rule
 * (or an in-repo profile's), so that moving the steps (into src/procedures)
 * can be shown to change none of it: for every rule, every reason code it gives steps for or lists
 * as cantTell, and every locale, a digest of what howToCheckFor returns;
 * a digest of every rule's steps by reason code; and a digest of each review
 * dictionary file, byte for byte.
 *
 * tests/snapshots/how-to-check.json holds the record, made once, before the
 * move. A difference is a bug in the code that gives the steps, never a
 * reason to record again: the recorder writes only when there is no record.
 *
 *   node tests/helpers/howToCheckSnapshot.js
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const RECORD = path.join(ROOT, 'tests', 'snapshots', 'how-to-check.json');

// The five dictionaries, a regional tag that falls back to its base, and a
// locale core has no dictionary for, which falls back to English.
const LOCALES = ['en', 'de', 'es', 'fr', 'ja', 'fr-CA', 'pt'];
const DICTIONARY_LOCALES = ['de', 'en', 'es', 'fr', 'ja'];

const digest = (value) =>
  crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);

// Core's rules and an in-repo profile's (profiles/<key>/rules).
function ruleFiles() {
  const { ruleTypeDirs } = require(path.join(ROOT, 'scripts', 'lib', 'rule-dirs.js'));
  return ['automatic', 'manual']
    .flatMap((type) => ruleTypeDirs(type))
    .flatMap((dir) => fs.readdirSync(dir).map((f) => path.join(dir, f)))
    .concat([path.join(ROOT, 'src/checks/manual-review.js')])
    .filter((f) => f.endsWith('.js'))
    .sort();
}

// The codes a rule's header lists as cantTell, as tests/how-to-check.test.js
// reads them.
function headerCantTellCodes(src) {
  const codes = [];
  for (const m of src.matchAll(/^ \* {3}- `([A-Za-z0-9_]+)` \(([^)]*)\)/gm)) {
    if (/cantTell/.test(m[2])) codes.push(m[1]);
  }
  return codes;
}

// A rule's steps by reason code, codes in order and each entry's fields in
// order, so that where the steps are kept doesn't change the digest.
function canonical(review) {
  const out = {};
  for (const code of Object.keys(review).sort()) {
    const { steps, passWhen, failWhen } = review[code];
    out[code] = { steps, passWhen, failWhen };
  }
  return out;
}

// A rule's steps by reason code, as its meta.review gave them before the
// move and src/procedures gives them since (English), or null where it has
// none.
function reviewOf(mod) {
  if (mod.meta && mod.meta.review !== undefined) return mod.meta.review;
  const procedures = path.join(ROOT, 'scripts', 'generate-procedures.js');
  if (!fs.existsSync(procedures)) return null;
  const { variants, prefixOf, PROCEDURES_DIR } = require(procedures);
  const en = JSON.parse(fs.readFileSync(path.join(PROCEDURES_DIR, 'en.json'), 'utf8'));
  const review = {};
  for (const v of variants().filter((x) => x.ruleId === mod.id)) {
    const stem = `${prefixOf(v.ruleId)}_review_${v.code}_`;
    const steps = [];
    for (let n = 1; typeof en[`${stem}step${n}`] === 'string'; n++)
      steps.push(en[`${stem}step${n}`]);
    review[v.code] = { steps, passWhen: en[`${stem}pass`], failWhen: en[`${stem}fail`] };
  }
  return Object.keys(review).length ? review : null;
}

function compute() {
  const { howToCheckFor } = require(path.join(ROOT, 'src/index.js'));
  const steps = {};
  const reviews = {};
  for (const file of ruleFiles()) {
    const mod = require(file);
    const review = reviewOf(mod);
    const codes = [
      ...new Set([
        ...Object.keys(review || {}),
        ...headerCantTellCodes(fs.readFileSync(file, 'utf8')),
        ...(Array.isArray(mod.meta.reasonCodes) ? mod.meta.reasonCodes : [])
      ])
    ].sort();
    reviews[mod.id] = review === null ? null : digest(canonical(review));
    for (const code of codes) {
      const byLocale = {};
      for (const locale of LOCALES) byLocale[locale] = digest(howToCheckFor(mod.id, code, locale));
      steps[`${mod.id} ${code}`] = byLocale;
    }
  }
  const dictionaries = {};
  for (const locale of DICTIONARY_LOCALES) {
    const bytes = fs.readFileSync(path.join(ROOT, 'src/i18n/review', `${locale}.json`));
    dictionaries[locale] = crypto.createHash('sha256').update(bytes).digest('hex');
  }
  return { locales: LOCALES, steps, reviews, dictionaries };
}

module.exports = { compute, RECORD };

if (require.main === module) {
  if (fs.existsSync(RECORD)) {
    console.error(`${path.relative(ROOT, RECORD)} exists: it is never recorded again.`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(RECORD), { recursive: true });
  fs.writeFileSync(RECORD, JSON.stringify(compute(), null, 2) + '\n');
  console.log(`Wrote ${path.relative(ROOT, RECORD)}`);
}
