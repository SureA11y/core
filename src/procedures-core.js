/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * How a person assesses a criterion by hand (docs/PROCEDURES.md), from the
 * procedures' dictionaries alone: no file system, so it runs wherever an app
 * does, in Node or in a browser bundle. src/procedures.js reads the
 * dictionaries from disk and calls this module: there is one implementation.
 *
 * For a WCAG criterion, or for the best practices, it gives each facet: its
 * label and automation, the core rules that claim it, its general procedure
 * and the tools that needs, and the variants under it, the steps a finding
 * of one of its rules shows (howToCheck). The structure is
 * src/procedures/registry.js and src/coverage/wcag-facets.js; the rules it
 * names are read from src/procedures/rules.json, which
 * scripts/generate-procedures.js makes from them.
 *
 * `dictionaries` is either an object keyed by locale ({ en, fr }) or a
 * function from a locale to its dictionary (or null), the dictionaries
 * published as @surea11y/core/procedures/<locale>. English is the fallback
 * for every key a locale lacks, and says how many steps a procedure has.
 */

const { PROCEDURES, TOOLS } = require('./procedures/registry.js');
const { FACETS } = require('./coverage/wcag-facets.js');
const RULES = require('./procedures/rules.json');

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
  const dicts = chainOf(locales)
    .map((l) => dictionaryFor(dictionaries, l))
    .filter(Boolean);
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
  return { text, procedure };
}

const byId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function variantsOf(entry, read) {
  const out = [];
  for (const ruleId of Object.keys((entry && entry.variants) || {})) {
    const rule = RULES[ruleId];
    for (const reasonCode of entry.variants[ruleId]) {
      const how =
        rule && rule.prefix ? read.procedure(`${rule.prefix}_review_${reasonCode}_`) : null;
      if (how) out.push({ ruleId, reasonCode, ...how });
    }
  }
  return out;
}

function facetOf(facet, entry, stem, rules, read) {
  const coveredBy = entry && typeof entry.coveredBy === 'string' ? entry.coveredBy : null;
  const procedure = coveredBy ? null : read.procedure(stem);
  const tools = procedure && entry && Array.isArray(entry.tools) ? entry.tools : [];
  const out = { id: facet.id, label: facet.label, automation: facet.automation };
  if (facet.macro) out.macro = true;
  out.rules = rules;
  out.tools = tools
    .filter((id) => TOOLS.includes(id))
    .map((id) => ({ id, label: read.text(`tool_${id}`) || id }));
  out.procedure = procedure;
  // A technology facet a broader facet's procedure assesses: that facet's id.
  if (coveredBy) out.coveredBy = coveredBy;
  out.variants = variantsOf(entry, read);
  return out;
}

// Every facet has a procedure, its own or the one of the facet it is
// covered by.
function isComplete(facets) {
  const has = new Set(facets.filter((f) => f.procedure !== null).map((f) => f.id));
  return facets.length > 0 && facets.every((f) => has.has(f.id) || has.has(f.coveredBy));
}

function wcagCriterion(criterion, read) {
  if (!hasOwn(FACETS, criterion)) return null;
  const info = FACETS[criterion];
  const registry = PROCEDURES.wcag[criterion] || {};
  const ruleIds = Object.keys(RULES).sort(byId);
  const facets = (info.facets || []).map((facet) =>
    facetOf(
      facet,
      registry[facet.id],
      `wcag_${criterion}_${facet.id}_`,
      ruleIds.filter((r) => (RULES[r].facets[criterion] || []).includes(facet.id)),
      read
    )
  );
  return {
    standard: 'wcag',
    id: criterion,
    title: info.title,
    level: info.level,
    complete: isComplete(facets),
    rules: ruleIds.filter((r) => RULES[r].criteria.includes(criterion)),
    facets
  };
}

function bestPractices(read) {
  const facets = Object.entries(PROCEDURES['best-practice']).map(([id, entry]) =>
    facetOf(
      { id, label: entry.label, automation: entry.automation },
      entry,
      `best-practice_${id}_`,
      Object.keys(entry.variants || {}).sort(byId),
      read
    )
  );
  return {
    standard: 'best-practice',
    id: 'best-practice',
    title: 'Best practices',
    level: null,
    complete: isComplete(facets),
    rules: [...new Set(facets.flatMap((f) => f.rules))].sort(byId),
    facets
  };
}

/**
 * How a person assesses a requirement by hand: a WCAG 2.2 criterion
 * ('1.4.13'), or 'best-practice' for what no criterion requires, with each
 * of its facets, in `options.locale` (a tag, or a list of tags, most wanted
 * first; English is the fallback for every text a locale lacks). null for a
 * requirement core doesn't know. See docs/PROCEDURES.md for the shape.
 */
function proceduresFrom(dictionaries, requirement, options) {
  if (typeof requirement !== 'string' || !requirement.trim()) return null;
  const id = requirement.trim();
  const locale = options && typeof options === 'object' ? options.locale : null;
  const read = reader(dictionaries, locale);
  return id === 'best-practice' ? bestPractices(read) : wcagCriterion(id, read);
}

module.exports = { proceduresFrom };
