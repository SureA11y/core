/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Placeholders in the steps for an undecided finding (docs/OUTPUT_SCHEMA.md,
 * "How to check"): a step, a passWhen or a failWhen may name what the
 * finding found, so the person reads the case in front of them ("Open the
 * popup of this element, whose aria-haspopup is menu") instead of every
 * case the code covers.
 *
 *   {{name|text}}
 *
 * is the finding's value for `name`, or `text` where the finding has none:
 * a howToCheck read for a code alone (howToCheckFor), a procedures page, a
 * finding of an older engine. So every placeholder gives the text it reads
 * as without a value, and that text reads as the step did before it had
 * placeholders. A step without placeholders is shown as it is.
 *
 * A finding's values are its i18n.params, the values its summary is written
 * with, and the fields of its data.details: a string, a number or a boolean,
 * or a list of them, which reads as "a, b, c". They come from the page, so
 * each is one line of at most 120 characters, and a reporter escapes it as it
 * escapes all text (the HTML report does).
 *
 * Plain data and string functions only: it runs wherever the steps are
 * added, in Node or in a browser bundle (src/how-to-check-core.js).
 */

const PLACEHOLDER = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*(?:\|([^{}]*))?\}\}/g;
const MAX_VALUE_LENGTH = 120;

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// A value as a placeholder shows it: one line, at most MAX_VALUE_LENGTH
// characters; null for a value that is not a string, a number, a boolean, or
// a list of them, or that is empty.
function valueText(value) {
  let text;
  if (typeof value === 'string') text = value;
  else if (typeof value === 'number') text = Number.isFinite(value) ? String(value) : '';
  else if (typeof value === 'boolean') text = String(value);
  else if (Array.isArray(value)) {
    const items = value.map(valueText).filter((v) => v !== null);
    if (items.length !== value.length) return null;
    text = items.join(', ');
  } else return null;
  text = text.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH - 1)}…` : text;
}

/**
 * The values a finding gives its placeholders: { name: text }, from its
 * data.details and its i18n.params, which win where both have a name.
 */
function placeholderValues(occurrence) {
  const out = {};
  if (!isObject(occurrence)) return out;
  const details = isObject(occurrence.data) ? occurrence.data.details : null;
  const params = isObject(occurrence.i18n) ? occurrence.i18n.params : null;
  for (const source of [details, params]) {
    if (!isObject(source)) continue;
    for (const key of Object.keys(source)) {
      if (key === 'reasonCode') continue;
      const text = valueText(source[key]);
      if (text !== null) out[key] = text;
    }
  }
  return out;
}

/** The text with each placeholder filled: its value, or its own text. */
function fillPlaceholders(text, values) {
  if (typeof text !== 'string' || text.indexOf('{{') === -1) return text;
  const vals = isObject(values) ? values : {};
  return text
    .replace(PLACEHOLDER, (_, name, fallback) =>
      hasOwn(vals, name) ? vals[name] : fallback === undefined ? '' : fallback.trim()
    )
    .replace(/[ \t]{2,}/g, ' ');
}

/** { steps, passWhen, failWhen } with each text filled from `values`. */
function fillHowToCheck(how, values) {
  if (!isObject(how)) return how;
  const fill = (t) => fillPlaceholders(t, values);
  return {
    ...how,
    steps: Array.isArray(how.steps) ? how.steps.map(fill) : how.steps,
    passWhen: fill(how.passWhen),
    failWhen: fill(how.failWhen)
  };
}

/** The names a text's placeholders read, in order, each once. */
function placeholderNames(text) {
  const names = [];
  if (typeof text !== 'string') return names;
  for (const m of text.matchAll(PLACEHOLDER)) if (!names.includes(m[1])) names.push(m[1]);
  return names;
}

/**
 * What is wrong with a text's placeholders: one without the text it reads
 * as without a value ({{name}}), and braces that are no placeholder
 * ({{name, {name}}, a name that is not letters, digits and _).
 */
function placeholderProblems(text) {
  if (typeof text !== 'string' || (text.indexOf('{') === -1 && text.indexOf('}') === -1)) {
    return [];
  }
  const problems = [];
  for (const m of text.matchAll(PLACEHOLDER)) {
    if (m[2] === undefined || !m[2].trim()) {
      problems.push(`{{${m[1]}}} needs the text it reads as without a value: {{${m[1]}|…}}`);
    }
  }
  if (/[{}]/.test(text.replace(PLACEHOLDER, ''))) {
    problems.push('a brace outside a placeholder: write {{name|text}}');
  }
  return problems;
}

module.exports = {
  fillHowToCheck,
  fillPlaceholders,
  placeholderNames,
  placeholderProblems,
  placeholderValues,
  MAX_VALUE_LENGTH
};
