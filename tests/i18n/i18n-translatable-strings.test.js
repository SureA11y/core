'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const I18N_DIR = path.join(__dirname, '..', '..', 'src', 'i18n');

const enDict = JSON.parse(fs.readFileSync(path.join(I18N_DIR, 'en.json'), 'utf8'));

const PLACEHOLDER_SOURCE = '\\{\\{[#^/]?\\s*[\\w.]+\\s*\\}\\}';

function withoutPlaceholders(value) {
  return value.replace(new RegExp(PLACEHOLDER_SOURCE, 'g'), '');
}

function hasPlaceholder(value) {
  return new RegExp(PLACEHOLDER_SOURCE).test(value);
}

// A value made only of placeholders is a passthrough: the text a reader sees
// arrives as an interpolated parameter, which no locale can translate.
test('no dictionary value is nothing but placeholders', () => {
  const passthrough = Object.entries(enDict)
    .filter(([, value]) => value.trim() !== '' && withoutPlaceholders(value).trim() === '')
    .map(([key]) => key);

  assert.deepEqual(
    passthrough,
    [],
    `these keys resolve to interpolated text no translator can reach: ${passthrough.join(', ')}`
  );
});

test('no dictionary value carries a placeholder as its only translatable content', () => {
  const wordless = Object.entries(enDict)
    .filter(
      ([, value]) => hasPlaceholder(value) && !/[A-Za-z]{2,}/.test(withoutPlaceholders(value))
    )
    .map(([key]) => key);

  assert.deepEqual(wordless, [], `keys with no translatable words: ${wordless.join(', ')}`);
});

test('every value is a non-empty string', () => {
  const bad = Object.entries(enDict)
    .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
    .map(([key]) => key);

  assert.deepEqual(bad, [], `keys with an empty or non-string value: ${bad.join(', ')}`);
});
