'use strict';

/**
 * The translations of the procedures that are to be checked again
 * (src/procedures-to-review.json): by locale, each key with the English the
 * translation was made from, recorded when the English changes and removed
 * once the translation is updated.
 *
 * - problemsOf(record, dictionaries): what is wrong with the record, as
 *   text: an unknown locale, a key the English or the locale lacks, or an
 *   entry whose English is unchanged, which is to be removed.
 * - pendingOf(record, dictionaries): each entry, with the English it was
 *   made from (was), the English now (now) and the translation (translation).
 *
 * dictionaries is { locale: { key: text } }, English (en) included.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const RECORD_FILE = path.join(ROOT, 'src', 'procedures-to-review.json');
const PROCEDURES_DIR = path.join(ROOT, 'src', 'i18n', 'procedures');

const isText = (v) => typeof v === 'string' && v.length > 0;
const entriesOf = (record) => Object.entries(record || {}).filter(([k]) => k !== '$comment');

function problemsOf(record, dictionaries) {
  const problems = [];
  const en = dictionaries.en || {};
  for (const [locale, entries] of entriesOf(record)) {
    const dict = dictionaries[locale];
    if (locale === 'en' || !dict) {
      problems.push(`${locale}: not a language the procedures are translated into`);
      continue;
    }
    if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
      problems.push(`${locale}: is to map keys to the English they were translated from`);
      continue;
    }
    for (const [key, was] of Object.entries(entries)) {
      if (!isText(was)) problems.push(`${locale} ${key}: the English it was made from is missing`);
      else if (!Object.hasOwn(en, key)) problems.push(`${locale} ${key}: no longer in English`);
      else if (!Object.hasOwn(dict, key)) problems.push(`${locale} ${key}: not translated`);
      else if (en[key] === was) {
        problems.push(`${locale} ${key}: the English is unchanged, so the entry is to be removed`);
      }
    }
  }
  return problems;
}

function pendingOf(record, dictionaries) {
  const en = dictionaries.en || {};
  return entriesOf(record).flatMap(([locale, entries]) =>
    Object.entries(entries || {}).map(([key, was]) => ({
      locale,
      key,
      was,
      now: en[key],
      translation: (dictionaries[locale] || {})[key]
    }))
  );
}

// The record and the procedures' dictionaries on disk.
function readRecord() {
  return JSON.parse(fs.readFileSync(RECORD_FILE, 'utf8'));
}
function readDictionaries() {
  return Object.fromEntries(
    fs
      .readdirSync(PROCEDURES_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => [
        f.slice(0, -'.json'.length),
        JSON.parse(fs.readFileSync(path.join(PROCEDURES_DIR, f), 'utf8'))
      ])
  );
}

module.exports = { problemsOf, pendingOf, readRecord, readDictionaries, RECORD_FILE };
