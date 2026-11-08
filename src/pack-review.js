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
 * facet under several) names. *
 * A pack's standard may give its own steps for core rules' codes
 * (standard.review), in English; its dictionaries may translate each entry
 * under `<standard key>_standardReview_<rule id>_<CODE>_step<n>`, `_pass`
 * and `_fail` (standardReviewStem), read as a whole or not at all. A version
 * may give steps of its own (standard.reviewByVersion), replacing the
 * standard's for the same rule and code under its profiles, and
 * standard.texts may translate them by id in that version
 * (`review.<rule>.<CODE>.steps`, `.passWhen`, `.failWhen`), read first.
 * Experimental (src/experimental.js).
 */

// Self-contained too: no file system and no engine.
const { idTextsOf, isUnsafeKey } = require('./texts-by-id.js');

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

// A pack's dictionaries for the locales core's procedures have none for:
// { locale: [dict] }, in the packs' order. Such a dictionary may give core's
// procedures in that locale, under core's keys, as it may give core's
// messages (docs/PACKS.md, "Languages").
function packLocaleDictionaries(packs) {
  const out = {};
  for (const pack of Array.isArray(packs) ? packs : []) {
    if (!isObject(pack) || !isObject(pack.dictionaries)) continue;
    for (const [tag, dict] of Object.entries(pack.dictionaries)) {
      const locale = tag.toLowerCase();
      if (locale === 'en' || !isObject(dict)) continue;
      (out[locale] = out[locale] || []).push(dict);
    }
  }
  return out;
}

/**
 * The dictionaries with the packs' steps added, each locale's to that
 * locale's, where core's has no such key; a locale only a pack has steps in
 * is added too. For a locale core has no dictionary for, a pack's
 * dictionary may also give core's procedures, the keys English has. Without
 * packs that give either, the dictionaries as given.
 */
function withPackReview(dictionaries, packs) {
  const extra = packReviewDictionaries(packs);
  const locales = packLocaleDictionaries(packs);
  if (!Object.keys(extra.en).length && !Object.keys(locales).length) return dictionaries;
  const merged = new Map();
  return (locale) => {
    if (!merged.has(locale)) {
      let own = dictionaryFor(dictionaries, locale);
      if (!own && hasOwn(locales, locale)) {
        // Core's keys only: a pack's messages are no procedures.
        const english = dictionaryFor(dictionaries, 'en') || {};
        own = {};
        for (const dict of locales[locale]) {
          for (const [key, text] of Object.entries(dict)) {
            if (hasOwn(english, key) && !hasOwn(own, key) && isText(text)) own[key] = text;
          }
        }
        if (!Object.keys(own).length) own = null;
      }
      const added = hasOwn(extra, locale) ? extra[locale] : null;
      merged.set(locale, added ? { ...added, ...(own || {}) } : own);
    }
    return merged.get(locale);
  };
}

/**
 * The key stem of a standard's own steps for a core rule's code, in a pack's
 * dictionaries: `<standard key>_standardReview_<rule id>_<CODE>_`, followed
 * by `step<n>`, `pass` or `fail`. A rule's steps are keyed
 * `<prefix>_review_<CODE>_`, and neither a standard's key nor a core rule's
 * id holds `_`, so the two never share a key.
 */
const standardReviewStem = (key, ruleId, code) => `${key}_standardReview_${ruleId}_${code}_`;

// The keys an entry of standard.review is translated under, in order: its
// steps', then pass and fail.
function standardReviewKeys(key, ruleId, code, entry) {
  const stem = standardReviewStem(key, ruleId, code);
  return [...entry.steps.map((_, i) => `${stem}step${i + 1}`), `${stem}pass`, `${stem}fail`];
}

/**
 * An entry of standard.review in the first of `locales` (lower case, most
 * wanted first) whose dictionary of the pack translates all of it: its
 * steps, passWhen and failWhen, as a whole, so a person never reads one
 * step in another language. The English entry where none does.
 */
function translatedStandardReview(source, ruleId, code, entry, locales) {
  const keys = isText(source.key) ? standardReviewKeys(source.key, ruleId, code, entry) : null;
  // By id first (standard.texts, in the profile's version): the whole entry
  // in a locale, or none of it.
  const ids = source.texts || null;
  const stem = `review.${ruleId}.${code}`;
  const idKeys = [
    ...entry.steps.map((_, i) => `${stem}.steps.${i}`),
    `${stem}.passWhen`,
    `${stem}.failWhen`
  ];
  for (const locale of locales) {
    if (locale === 'en' || locale === source.lang) break;
    const byVersion = ids && isObject(ids[locale]) ? ids[locale][source.version] : null;
    if (isObject(byVersion) && idKeys.every((k) => hasOwn(byVersion, k) && isText(byVersion[k]))) {
      const texts = idKeys.map((k) => byVersion[k]);
      return {
        steps: texts.slice(0, -2),
        passWhen: texts[texts.length - 2],
        failWhen: texts[texts.length - 1]
      };
    }
    if (!keys) continue;
    const dict = dictionaryFor(source.dictionaries, locale);
    if (!dict || !keys.every((k) => hasOwn(dict, k) && isText(dict[k]))) continue;
    const texts = keys.map((k) => dict[k]);
    return {
      steps: texts.slice(0, -2),
      passWhen: texts[texts.length - 2],
      failWhen: texts[texts.length - 1]
    };
  }
  return { steps: [...entry.steps], passWhen: entry.passWhen, failWhen: entry.failWhen };
}

/**
 * The steps a pack's standard gives for core rules' codes, in its own words
 * (standard.review: { ruleId: { CODE: { steps, passWhen, failWhen } } }), by
 * each of its profiles, lower case: a Map of profile -> { review, key,
 * dictionaries }, review being { ruleId: { CODE: entry } } with only the
 * well-formed entries, in English, key the standard's and dictionaries the
 * pack's, which may translate them (standardReviewStem). The first pack to
 * name a profile gives it, as it does the profile.
 */
function standardReviewsOf(packs) {
  const out = new Map();
  for (const pack of Array.isArray(packs) ? packs : []) {
    const st = isObject(pack) && isObject(pack.standard) ? pack.standard : null;
    if (!st || !isObject(st.profiles)) continue;
    if (!isObject(st.review) && !isObject(st.reviewByVersion)) continue;
    for (const [profile, p] of Object.entries(st.profiles)) {
      const version = isObject(p) && typeof p.version === 'string' ? p.version : null;
      const review = reviewForVersion(st, version);
      if (!Object.keys(review).length) continue;
      const key = profile.toLowerCase();
      if (out.has(key)) continue;
      out.set(key, {
        review,
        key: typeof st.key === 'string' ? st.key : null,
        dictionaries: isObject(pack.dictionaries) ? pack.dictionaries : null,
        version,
        lang: typeof st.lang === 'string' ? st.lang.trim().toLowerCase() : 'en',
        texts: idTextsOf(st)
      });
    }
  }
  return out;
}

/**
 * A standard's own steps for core's codes in a version: standard.review,
 * with the version's entries in standard.reviewByVersion replacing those of
 * the same rule and code. Only well-formed entries: { ruleId: { CODE: entry } }.
 */
function reviewForVersion(st, version) {
  const review = {};
  const take = (table) => {
    for (const [ruleId, byCode] of Object.entries(isObject(table) ? table : {})) {
      if (!isObject(byCode)) continue;
      for (const [code, entry] of Object.entries(byCode)) {
        if (isUnsafeKey(ruleId) || !CODE.test(code) || !wellFormedReview(entry)) continue;
        (review[ruleId] = review[ruleId] || {})[code] = entry;
      }
    }
  };
  take(st.review);
  if (version && isObject(st.reviewByVersion)) take(st.reviewByVersion[version]);
  return review;
}

// 'fr-CA' reads fr-ca, then fr; English last.
function localeChain(locale) {
  const tag = typeof locale === 'string' ? locale.trim().toLowerCase() : '';
  if (!tag || tag === 'en' || tag.startsWith('en-')) return [];
  const base = tag.split('-')[0];
  return base === tag ? [tag] : [tag, base];
}

function chainOf(locales) {
  const chain = [];
  const add = (l) => {
    for (const tag of localeChain(l)) if (!chain.includes(tag)) chain.push(tag);
  };
  if (Array.isArray(locales)) locales.forEach(add);
  else add(locales);
  chain.push('en');
  return chain;
}

// A standard's own steps for a finding of a core rule: those of the
// standard of every profile that asks about it, where each of them gives
// steps for the rule's code; null where any asking profile has none, such
// as a WCAG profile, whose question core's steps answer. They are in the
// first of `locales` the standard's pack translates the whole entry into
// (standardReviewStem), and in English otherwise.
function standardSteps(reviews, profiles, ruleIds, code, locales) {
  if (!reviews.size || !profiles.length || typeof code !== 'string') return null;
  let found = null;
  for (const profile of profiles) {
    const source = reviews.get(profile);
    let hit = null;
    for (const id of ruleIds) {
      const byCode = source && source.review[id];
      if (byCode && Object.prototype.hasOwnProperty.call(byCode, code)) {
        hit = { source, ruleId: id, entry: byCode[code] };
        break;
      }
    }
    if (!hit) return null;
    if (!found) found = hit;
  }
  return found
    ? translatedStandardReview(found.source, found.ruleId, code, found.entry, chainOf(locales))
    : null;
}

module.exports = {
  reviewForVersion,
  chainOf,
  claimsOf,
  codesUnder,
  ownRulesOf,
  packReviewDictionaries,
  prefixOfKey,
  reviewOf,
  standardReviewKeys,
  standardReviewStem,
  standardReviewsOf,
  standardSteps,
  translatedStandardReview,
  withPackReview
};
