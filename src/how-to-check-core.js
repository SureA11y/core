/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * How a person answers an undecided finding (docs/OUTPUT_SCHEMA.md, "How to
 * check"), from the review dictionaries alone: no file system, no rule
 * modules, so it runs wherever the result is, in Node or in a browser bundle
 * (a Cypress spec).
 *
 * The review dictionaries (src/i18n/review/<locale>.json, published as
 * @surea11y/core/review/<locale>) hold every core rule's steps under
 * `<prefix>_review_<CODE>_step<n>`, `_pass` and `_fail`, where `<prefix>` is
 * the rule's i18n.titleKey without `_title` and `<CODE>` the reason code; the
 * English one is each rule's meta.review word for word. Every check in a
 * result carries its i18n.titleKey and every occurrence its reason code, so
 * that is all a result needs. src/how-to-check.js reads the dictionaries from
 * disk and calls this module: there is one implementation.
 *
 * `dictionaries` is either an object keyed by locale ({ en, fr }) or a
 * function from a locale to its dictionary (or null). English is the
 * fallback for every key a locale lacks, and says how many steps a code has.
 */

const { occurrenceOutcome } = require('./occurrence-outcome.js');

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

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

/**
 * The steps for one finding: { steps, passWhen, failWhen }, or null when the
 * dictionaries have none for that rule prefix and reason code. `locales` is a
 * locale ('fr-CA') or a list of them, most wanted first. With
 * `options.packs`, a pack rule's prefix reads its meta.review, in English.
 */
function howToCheckFrom(dictionaries, prefix, code, locales, options) {
  if (typeof prefix !== 'string' || !prefix || typeof code !== 'string' || !code) return null;
  const packs = options && typeof options === 'object' ? options.packs : null;
  const source = packs ? withPackReview(dictionaries, packs) : dictionaries;
  return stepsFrom(source, prefix, code, locales);
}

function stepsFrom(dictionaries, prefix, code, locales) {
  if (typeof prefix !== 'string' || !prefix || typeof code !== 'string' || !code) return null;
  const dicts = chainOf(locales)
    .map((l) => dictionaryFor(dictionaries, l))
    .filter(Boolean);
  const key = `${prefix}_review_${code}_`;
  const tr = (suffix) => {
    for (const d of dicts) if (typeof d[key + suffix] === 'string') return d[key + suffix];
    return null;
  };
  // English says how many steps there are; without it, the first locale
  // that has the code does.
  const hasCode = (d) => !!d && typeof d[key + 'step1'] === 'string';
  const last = dicts[dicts.length - 1]; // English, when it was given
  const counter = hasCode(last) ? last : dicts.find(hasCode);
  if (!counter) return null;
  const steps = [];
  for (let n = 1; typeof counter[`${key}step${n}`] === 'string'; n++) steps.push(tr(`step${n}`));
  const passWhen = tr('pass');
  const failWhen = tr('fail');
  if (passWhen === null || failWhen === null) return null;
  return { steps, passWhen, failWhen };
}

function isUndecided(check, occ) {
  return occurrenceOutcome(check, occ) === 'cantTell';
}

const prefixOfKey = (key) =>
  typeof key === 'string' && key.endsWith('_title') && key.length > '_title'.length
    ? key.slice(0, -'_title'.length)
    : null;

// The prefixes a check's steps are read under: its own, then, for a variant
// (variantOf), its base rule's, whose steps it shares where it has none of
// its own.
function prefixesOf(check) {
  const i18n = check.i18n && typeof check.i18n === 'object' ? check.i18n : {};
  const own = prefixOfKey(i18n.titleKey);
  const base = typeof check.variantOf === 'string' ? prefixOfKey(i18n.variantOfTitleKey) : null;
  return [own, base].filter((p, i, all) => p && all.indexOf(p) === i);
}

const isText = (v) => typeof v === 'string' && v.trim() !== '';
function wellFormedReview(entry) {
  return (
    !!entry &&
    typeof entry === 'object' &&
    Array.isArray(entry.steps) &&
    entry.steps.length > 0 &&
    entry.steps.every(isText) &&
    isText(entry.passWhen) &&
    isText(entry.failWhen)
  );
}

/**
 * The English review dictionary of packs' rules: each pack rule's and
 * variant's meta.review, under the keys core's dictionaries use. A pack's
 * steps are in English: a scan in another locale shows them in English. A
 * rule that overrides a core rule gives none, as a custom one doesn't.
 */
function packReviewDictionary(packs) {
  const dict = {};
  for (const pack of Array.isArray(packs) ? packs : []) {
    if (!pack || typeof pack !== 'object') continue;
    const overrides = Array.isArray(pack.overrides) ? pack.overrides : [];
    const rules = [].concat(
      Array.isArray(pack.rules) ? pack.rules : [],
      Array.isArray(pack.variants) ? pack.variants : []
    );
    for (const rule of rules) {
      if (!rule || typeof rule !== 'object' || overrides.includes(rule.id)) continue;
      const meta = rule.meta && typeof rule.meta === 'object' ? rule.meta : {};
      const prefix = prefixOfKey(meta.i18n && meta.i18n.titleKey);
      const review = meta.review;
      if (!prefix || !review || typeof review !== 'object' || Array.isArray(review)) continue;
      for (const code of Object.keys(review)) {
        const entry = review[code];
        if (!/^[A-Za-z0-9_]+$/.test(code) || !wellFormedReview(entry)) continue;
        const key = `${prefix}_review_${code}_`;
        entry.steps.forEach((step, i) => (dict[`${key}step${i + 1}`] = step));
        dict[`${key}pass`] = entry.passWhen;
        dict[`${key}fail`] = entry.failWhen;
      }
    }
  }
  return dict;
}

// The dictionaries with the packs' steps added to English, where core's
// English has no such key.
function withPackReview(dictionaries, packs) {
  const extra = packReviewDictionary(packs);
  if (!Object.keys(extra).length) return dictionaries;
  let en;
  return (locale) => {
    if (locale !== 'en') return dictionaryFor(dictionaries, locale);
    if (!en) en = { ...extra, ...(dictionaryFor(dictionaries, 'en') || {}) };
    return en;
  };
}

// engine.locale says which dictionary the scan used: { requested, resolved,
// reason }, or a plain tag in a result written by hand.
function engineLocaleOf(result) {
  const locale = result.engine && result.engine.locale;
  if (typeof locale === 'string') return locale;
  return locale && typeof locale === 'object' && typeof locale.resolved === 'string'
    ? locale.resolved
    : null;
}

// A custom rule's finding has no steps, nor has a custom or pack rule's that
// replaced a core rule of the same id (overriddenBuiltinIds), though it may
// share the core rule's titleKey.
function isCustom(result, check) {
  const ids = (list, of) => Array.isArray(list) && list.some((entry) => of(entry) === check.ruleId);
  return (
    ids(result.overriddenBuiltinIds, (id) => id) ||
    ids(check.engineOptions && check.engineOptions.customRules, (rule) => rule && rule.id)
  );
}

// options.locale, when given, is the locale (or list of locales, most wanted
// first) to give the steps in, in place of the scan's; the steps a finding
// already has are then given again in it, where the dictionaries have them.
function addToResult(result, dictionaries, wanted) {
  if (!result || typeof result !== 'object' || !Array.isArray(result.checksResults)) return result;
  const engineLocale = engineLocaleOf(result);
  const checksResults = result.checksResults.map((check) => {
    if (!check || !Array.isArray(check.occurrences) || !check.occurrences.length) return check;
    if (isCustom(result, check)) return check;
    const prefixes = prefixesOf(check);
    if (!prefixes.length) return check;
    const locale = wanted || (check.engineOptions && check.engineOptions.locale) || engineLocale;
    let changed = false;
    const occurrences = check.occurrences.map((occ) => {
      if (!occ || typeof occ !== 'object' || !isUndecided(check, occ)) return occ;
      if (occ.howToCheck && !wanted) return occ;
      const code = occ.data && occ.data.details && occ.data.details.reasonCode;
      let how = null;
      for (const prefix of prefixes) {
        how = stepsFrom(dictionaries, prefix, code, locale);
        if (how) break;
      }
      if (!how) return occ;
      changed = true;
      return { ...occ, howToCheck: how };
    });
    return changed ? { ...check, occurrences } : check;
  });
  return { ...result, checksResults };
}

// A cross-frame result is a tree: { topFrame, frames: [{ ..., topFrame, frames }] }.
// A binding's frames(true) lists each frame as a scan result of its own, or
// as { url, error } where it could not scan one: a result gains its steps,
// an error is left as it is.
function addToTree(node, dictionaries, wanted) {
  if (!node || typeof node !== 'object') return node;
  if (!node.topFrame && Array.isArray(node.checksResults)) {
    return addToResult(node, dictionaries, wanted);
  }
  const out = { ...node };
  if (node.topFrame) out.topFrame = addToResult(node.topFrame, dictionaries, wanted);
  if (Array.isArray(node.frames)) {
    out.frames = node.frames.map((n) => addToTree(n, dictionaries, wanted));
  }
  return out;
}

// options.locale as addToResult reads it: a tag, or a list of tags, or null
// for the scan's own.
function wantedLocale(options) {
  const locale = options && typeof options === 'object' ? options.locale : null;
  if (typeof locale === 'string') return locale.trim() || null;
  if (Array.isArray(locale)) {
    const tags = locale.filter((l) => typeof l === 'string' && l.trim()).map((l) => l.trim());
    return tags.length ? tags : null;
  }
  return null;
}

/**
 * A copy of a scan result, a cross-frame result or a binding's frames result
 * in which each undecided finding of a core rule carries howToCheck, in the
 * scan's locale, from the dictionaries given; a variant's finding without
 * steps of its own gets its base rule's. With `options.packs`, the packs the
 * scan ran, their rules' and variants' meta.review give theirs, in English.
 * Findings that already have one, and decided ones, are left as they are.
 * With `options.locale` (a tag, or a list of tags, most wanted first), the
 * steps are in that locale instead of the scan's, and a finding that already
 * has steps is given them again in it, as a report in another language
 * needs; English stays the fallback for every step a locale lacks.
 */
function applyHowToCheck(result, dictionaries, options) {
  const packs = options && typeof options === 'object' ? options.packs : null;
  const dicts = withPackReview(dictionaries, packs);
  const wanted = wantedLocale(options);
  if (result && typeof result === 'object' && 'topFrame' in result) {
    return addToTree(result, dicts, wanted);
  }
  return addToResult(result, dicts, wanted);
}

module.exports = { applyHowToCheck, howToCheckFrom };
