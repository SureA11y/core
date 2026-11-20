'use strict';

/**
 * src/procedures-to-review.json lists the translations of the procedures to
 * check again because their English changed after they were made, each with
 * the English it was made from. This keeps the list honest: every entry
 * names a locale and a key both the English and the locale have, and English
 * that has changed since, so an entry whose translation was updated without
 * removing it, or whose key is gone, fails here.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  problemsOf,
  pendingOf,
  readRecord,
  readDictionaries
} = require('../../scripts/lib/procedures-review');

test('every entry is a translation whose English changed after it was made', () => {
  assert.deepEqual(problemsOf(readRecord(), readDictionaries()), []);
});

const dictionaries = {
  en: { a_step1: 'Press Tab.', a_step2: 'Look at the focus.' },
  fr: { a_step1: 'Appuyer sur Tab.', a_step2: 'Regarder le focus.' }
};

test('an entry gives the English it was made from, the English now and the translation', () => {
  const record = { $comment: 'x', fr: { a_step1: 'Press the Tab key.' } };
  assert.deepEqual(problemsOf(record, dictionaries), []);
  assert.deepEqual(pendingOf(record, dictionaries), [
    {
      locale: 'fr',
      key: 'a_step1',
      was: 'Press the Tab key.',
      now: 'Press Tab.',
      translation: 'Appuyer sur Tab.'
    }
  ]);
});

test('a wrong entry is named', () => {
  assert.deepEqual(problemsOf({ de: { a_step1: 'x' } }, dictionaries), [
    'de: not a language the procedures are translated into'
  ]);
  assert.deepEqual(problemsOf({ en: {} }, dictionaries), [
    'en: not a language the procedures are translated into'
  ]);
  assert.deepEqual(problemsOf({ fr: ['a_step1'] }, dictionaries), [
    'fr: is to map keys to the English they were translated from'
  ]);
  assert.deepEqual(
    problemsOf({ fr: { a_step1: 'Press Tab.', a_step3: 'Old.', a_step2: '' } }, dictionaries),
    [
      'fr a_step1: the English is unchanged, so the entry is to be removed',
      'fr a_step3: no longer in English',
      'fr a_step2: the English it was made from is missing'
    ]
  );
  assert.deepEqual(problemsOf({ fr: { b_step1: 'Old.' } }, { en: { b_step1: 'New.' }, fr: {} }), [
    'fr b_step1: not translated'
  ]);
});
