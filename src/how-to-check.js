/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * How a person answers an undecided finding: the steps a core rule gives for
 * each reason code that can be cantTell (its meta.review), in a locale.
 *
 * The steps are kept out of the in-page engine, which is injected into every
 * page and frame a scan opens and has no use for them. A result gains them
 * here, in Node, after the scan: runDomRulesInPage does it for its own
 * results, and a binding that runs runa11yCoreInPage in a page calls
 * addHowToCheck on what comes back. See docs/OUTPUT_SCHEMA.md, "How to check".
 */

const fs = require('node:fs');
const path = require('node:path');

const CHECKS_DIR = path.join(__dirname, 'checks');
const REVIEW_DIR = path.join(__dirname, 'i18n', 'review');

let rules = null; // ruleId -> { prefix, review }
function ruleReviews() {
  if (rules) return rules;
  rules = new Map();
  const files = [path.join(CHECKS_DIR, 'manual-review.js')];
  for (const dir of ['automatic', 'manual']) {
    for (const f of fs.readdirSync(path.join(CHECKS_DIR, dir)).sort()) {
      if (f.endsWith('.js')) files.push(path.join(CHECKS_DIR, dir, f));
    }
  }
  for (const file of files) {
    let mod;
    try {
      mod = require(file);
    } catch {
      continue;
    }
    const meta = mod && mod.meta;
    if (!mod.id || !meta || !meta.review) continue;
    const titleKey = meta.i18n && typeof meta.i18n.titleKey === 'string' ? meta.i18n.titleKey : '';
    rules.set(mod.id, { prefix: titleKey.replace(/_title$/, ''), review: meta.review });
  }
  return rules;
}

const dictionaries = new Map(); // locale -> { key: text } | null
function dictionary(locale) {
  if (!dictionaries.has(locale)) {
    let dict;
    try {
      dict = JSON.parse(fs.readFileSync(path.join(REVIEW_DIR, `${locale}.json`), 'utf8'));
    } catch {
      dict = null;
    }
    dictionaries.set(locale, dict);
  }
  return dictionaries.get(locale);
}

// 'fr-CA' reads fr-CA, then fr; English is the rule's own text.
function localeChain(locale) {
  const tag = typeof locale === 'string' ? locale.trim().toLowerCase() : '';
  if (!tag || tag === 'en' || tag.startsWith('en-')) return [];
  const base = tag.split('-')[0];
  return base === tag ? [tag] : [tag, base];
}

/**
 * The steps for one finding: { steps, passWhen, failWhen } in the locale
 * (English where it has no translation), or null when the rule gives none
 * for that reason code.
 */
function howToCheckFor(ruleId, reasonCode, locale) {
  const rule = ruleReviews().get(ruleId);
  const entry =
    rule && reasonCode && Object.prototype.hasOwnProperty.call(rule.review, reasonCode)
      ? rule.review[reasonCode]
      : null;
  if (!entry || !Array.isArray(entry.steps) || !entry.steps.length) return null;
  const dicts = localeChain(locale).map(dictionary).filter(Boolean);
  const key = `${rule.prefix}_review_${reasonCode}_`;
  const tr = (suffix, text) => {
    for (const d of dicts) if (typeof d[key + suffix] === 'string') return d[key + suffix];
    return text;
  };
  return {
    steps: entry.steps.map((s, i) => tr(`step${i + 1}`, s)),
    passWhen: tr('pass', entry.passWhen),
    failWhen: tr('fail', entry.failWhen)
  };
}

function isUndecided(check, occ) {
  const tier =
    occ && (occ.occurrenceOutcome === 'fail' || occ.occurrenceOutcome === 'cantTell')
      ? occ.occurrenceOutcome
      : check.outcome;
  return tier === 'cantTell';
}

function addToResult(result) {
  if (!result || typeof result !== 'object' || !Array.isArray(result.checksResults)) return result;
  const checksResults = result.checksResults.map((check) => {
    if (!check || !Array.isArray(check.occurrences) || !check.occurrences.length) return check;
    const locale =
      (check.engineOptions && check.engineOptions.locale) ||
      (result.engine && result.engine.locale);
    let changed = false;
    const occurrences = check.occurrences.map((occ) => {
      if (!occ || typeof occ !== 'object' || occ.howToCheck || !isUndecided(check, occ)) return occ;
      const code = occ.data && occ.data.details && occ.data.details.reasonCode;
      const how = howToCheckFor(check.ruleId, code, locale);
      if (!how) return occ;
      changed = true;
      return { ...occ, howToCheck: how };
    });
    return changed ? { ...check, occurrences } : check;
  });
  return { ...result, checksResults };
}

// A cross-frame result is a tree: { topFrame, frames: [{ ..., topFrame, frames }] }.
function addToTree(node) {
  if (!node || typeof node !== 'object') return node;
  const out = { ...node };
  if (node.topFrame) out.topFrame = addToResult(node.topFrame);
  if (Array.isArray(node.frames)) out.frames = node.frames.map(addToTree);
  return out;
}

/**
 * A copy of a scan result (or a cross-frame result) in which each undecided
 * finding of a core rule carries howToCheck, in the scan's locale. Findings
 * that already have one, and decided ones, are left as they are.
 */
function addHowToCheck(result) {
  if (result && typeof result === 'object' && 'topFrame' in result) return addToTree(result);
  return addToResult(result);
}

module.exports = { addHowToCheck, howToCheckFor };
