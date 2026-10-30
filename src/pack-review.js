/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * A pack rule's steps and the facets they test, read from the packs alone:
 * no file system, so it runs wherever the result is, in Node or in a browser
 * bundle. src/how-to-check-core.js reads the steps from here for a finding's
 * howToCheck, src/procedures-core.js reads them and the facets for the
 * procedures, and src/pack.js checks a pack against the same reading, so the
 * three never disagree.
 *
 * A rule's steps are its meta.review, in English, under the keys core's
 * review dictionaries use (`<prefix>_review_<CODE>_step<n>`, `_pass`,
 * `_fail`); a pack's dictionary for another locale may translate them under
 * the same keys. A rule claims facets in meta.coverage: a WCAG criterion's
 * in facetsBySc, a requirement of its pack's own standard's in
 * facetsByRequirement. Its codes go under the one facet it claims, or under
 * the one meta.review[code].facet (and .criterion, where it claims that
 * facet under several) names.
 */

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';

const CODE = /^[A-Za-z0-9_]+$/;

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

const prefixOfKey = (key) =>
  typeof key === 'string' && key.endsWith('_title') && key.length > '_title'.length
    ? key.slice(0, -'_title'.length)
    : null;

function wellFormedReview(entry) {
  return (
    isObject(entry) &&
    Array.isArray(entry.steps) &&
    entry.steps.length > 0 &&
    entry.steps.every(isText) &&
    isText(entry.passWhen) &&
    isText(entry.failWhen)
  );
}

// A pack's rules and variants that give their own steps and claims: not an
// override, which runs as the core rule it replaces and shows no steps.
function ownRulesOf(pack) {
  if (!isObject(pack)) return [];
  const overrides = Array.isArray(pack.overrides) ? pack.overrides : [];
  return []
    .concat(
      Array.isArray(pack.rules) ? pack.rules : [],
      Array.isArray(pack.variants) ? pack.variants : []
    )
    .filter(
      (rule) => isObject(rule) && typeof rule.id === 'string' && !overrides.includes(rule.id)
    );
}

const metaOf = (rule) => (isObject(rule.meta) ? rule.meta : {});

// A rule's prefix, the start of its keys: its meta.i18n.titleKey without
// `_title`.
const prefixOf = (rule) => {
  const meta = metaOf(rule);
  return prefixOfKey(meta.i18n && meta.i18n.titleKey);
};

// A rule's well-formed meta.review entries, by reason code.
function reviewOf(rule) {
  const review = metaOf(rule).review;
  if (!isObject(review)) return {};
  const out = {};
  for (const code of Object.keys(review)) {
    if (CODE.test(code) && wellFormedReview(review[code])) out[code] = review[code];
  }
  return out;
}

/**
 * The facets a rule claims, each once: [{ key, facet, requirement }], where
 * key is a WCAG criterion (facetsBySc) or, with requirement true, a
 * requirement of its pack's standard (facetsByRequirement).
 */
function claimsOf(rule) {
  const coverage = metaOf(rule).coverage;
  if (!isObject(coverage)) return [];
  const out = [];
  const seen = new Set();
  const add = (map, requirement) => {
    if (!isObject(map)) return;
    for (const [key, facets] of Object.entries(map)) {
      for (const facet of Array.isArray(facets) ? facets : []) {
        if (typeof facet !== 'string' || !facet) continue;
        const id = `${requirement ? 'r' : 'c'} ${key} ${facet}`;
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({ key, facet, requirement });
      }
    }
  };
  add(coverage.facetsBySc, false);
  add(coverage.facetsByRequirement, true);
  return out;
}

/**
 * The reason codes of a rule's meta.review filed under one facet it claims
 * (key, facet, requirement as claimsOf gives them): all of them where it
 * claims only that facet; otherwise those whose entry names the facet, and,
 * where it claims that facet under several criteria or requirements, names
 * the key as its criterion. A code a rule claiming several facets doesn't
 * file is under none.
 */
function codesUnder(rule, key, facet, requirement) {
  const claims = claimsOf(rule);
  const here = claims.find(
    (c) => c.key === key && c.facet === facet && c.requirement === requirement
  );
  if (!here) return [];
  const sameFacet = claims.filter((c) => c.facet === facet);
  const review = reviewOf(rule);
  return Object.keys(review).filter((code) => {
    const entry = review[code];
    if (entry.facet === undefined) {
      if (claims.length !== 1) return false;
    } else if (entry.facet !== facet) return false;
    if (entry.criterion === undefined) return sameFacet.length === 1;
    return entry.criterion === key;
  });
}

/**
 * The review dictionaries of packs' rules, by lowercased locale: English is
 * each pack rule's and variant's meta.review, under the keys core's
 * dictionaries use; another locale holds the keys of those a pack's
 * dictionary for it translates. A rule that overrides a core rule gives
 * none, as a custom one doesn't.
 */
function packReviewDictionaries(packs) {
  const out = { en: {} };
  for (const pack of Array.isArray(packs) ? packs : []) {
    const stems = new Set();
    for (const rule of ownRulesOf(pack)) {
      const prefix = prefixOf(rule);
      if (!prefix) continue;
      const review = reviewOf(rule);
      for (const code of Object.keys(review)) {
        const entry = review[code];
        const key = `${prefix}_review_${code}_`;
        stems.add(key);
        entry.steps.forEach((step, i) => (out.en[`${key}step${i + 1}`] = step));
        out.en[`${key}pass`] = entry.passWhen;
        out.en[`${key}fail`] = entry.failWhen;
      }
    }
    if (!stems.size || !isObject(pack.dictionaries)) continue;
    for (const [tag, dict] of Object.entries(pack.dictionaries)) {
      const locale = tag.toLowerCase();
      if (locale === 'en' || !isObject(dict)) continue;
      for (const [key, text] of Object.entries(dict)) {
        if (typeof text !== 'string' || !hasOwn(out.en, key)) continue;
        const at = key.indexOf('_review_');
        const rest = key.slice(at + '_review_'.length);
        if (!stems.has(key.slice(0, at + '_review_'.length + rest.lastIndexOf('_') + 1))) {
          continue;
        }
        (out[locale] = out[locale] || {})[key] = text;
      }
    }
  }
  return out;
}

/**
 * The dictionaries with the packs' steps added, each locale's to that
 * locale's, where core's has no such key; a locale only a pack has steps in
 * is added too. Without packs that give steps, the dictionaries as given.
 */
function withPackReview(dictionaries, packs) {
  const extra = packReviewDictionaries(packs);
  if (!Object.keys(extra.en).length) return dictionaries;
  const merged = new Map();
  return (locale) => {
    if (!merged.has(locale)) {
      const own = dictionaryFor(dictionaries, locale);
      const added = hasOwn(extra, locale) ? extra[locale] : null;
      merged.set(locale, added ? { ...added, ...(own || {}) } : own);
    }
    return merged.get(locale);
  };
}

module.exports = {
  claimsOf,
  codesUnder,
  ownRulesOf,
  packReviewDictionaries,
  prefixOfKey,
  reviewOf,
  withPackReview
};
