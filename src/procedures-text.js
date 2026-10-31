/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Reading the procedures' dictionaries (@surea11y/core/procedures/<locale>):
 * a locale chain ('fr-CA' reads fr-ca, then fr, then English) and the text
 * of a key or a procedure from the first dictionary of the chain that has
 * it. src/procedures-core.js reads the procedures with it and
 * src/procedures-render.js the words of a page; neither needs a file system.
 *
 * `dictionaries` is either an object keyed by locale ({ en, fr }) or a
 * function from a locale to its dictionary (or null).
 */

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

// 'fr-CA' reads fr-ca, then fr; English last.
function chainOf(locales) {
  const chain = [];
  const add = (locale) => {
    const tag = typeof locale === 'string' ? locale.trim().toLowerCase() : '';
    if (!tag || tag === 'en' || tag.startsWith('en-')) return;
    const base = tag.split('-')[0];
    for (const t of base === tag ? [tag] : [tag, base]) if (!chain.includes(t)) chain.push(t);
  };
  if (Array.isArray(locales)) locales.forEach(add);
  else add(locales);
  chain.push('en');
  return chain;
}

function dictionaryFor(dictionaries, locale) {
  let dict = null;
  if (typeof dictionaries === 'function') dict = dictionaries(locale);
  else if (dictionaries && typeof dictionaries === 'object') {
    if (hasOwn(dictionaries, locale)) dict = dictionaries[locale];
    else {
      for (const key of Object.keys(dictionaries)) {
        if (key.toLowerCase() === locale) {
          dict = dictionaries[key];
          break;
        }
      }
    }
  }
  return dict && typeof dict === 'object' ? dict : null;
}

// The text of the dictionaries for a locale chain: a key's, from the first
// that has it, and a procedure's, { steps, passWhen, failWhen } or null.
function reader(dictionaries, locales) {
  const found = chainOf(locales)
    .map((l) => [l, dictionaryFor(dictionaries, l)])
    .filter(([, d]) => d);
  const dicts = found.map(([, d]) => d);
  const tags = found.map(([l]) => l);
  const text = (key) => {
    for (const d of dicts) if (typeof d[key] === 'string') return d[key];
    return null;
  };
  const procedure = (stem) => {
    const hasSteps = (d) => typeof d[`${stem}step1`] === 'string';
    const last = dicts[dicts.length - 1]; // English, when it was given
    const counter = last && hasSteps(last) ? last : dicts.find(hasSteps);
    if (!counter) return null;
    const steps = [];
    for (let n = 1; typeof counter[`${stem}step${n}`] === 'string'; n++) {
      steps.push(text(`${stem}step${n}`));
    }
    const passWhen = text(`${stem}pass`);
    const failWhen = text(`${stem}fail`);
    return passWhen === null || failWhen === null ? null : { steps, passWhen, failWhen };
  };
  // The locale of the dictionary a key's text comes from ('fr', or 'en'
  // where only English has it); null where none has it. A page marks text
  // in another language than its own with it.
  const localeOf = (key) => {
    for (let i = 0; i < dicts.length; i++) {
      if (typeof dicts[i][key] === 'string') return tags[i];
    }
    return null;
  };
  return { text, procedure, localeOf, locale: tags[0] || 'en' };
}

module.exports = { chainOf, dictionaryFor, reader };
