/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The laws a pack's standard is assessed under (standard.laws), and the law
 * each profile serves (profiles[name].law): what each law is, whom it
 * applies to, its exemptions, since when, who enforces it, and its official
 * texts. Facts to show, never logic: core never decides whom a law applies
 * to. A requirement only some laws ask for says which
 * (standard.procedures[version][id].laws). Translated by id in
 * standard.lawTexts: { fr: { 'laws.<id>.name': '…', 'laws.<id>.exemptions':
 * ['…'] } }. Experimental (src/experimental.js).
 *
 * No file system and no engine, so it runs in a browser bundle too.
 */

const { isUnsafeKey, TAG } = require('./texts-by-id.js');

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

// A law's id, as core's ids are: lowercase letters and digits, joined by
// '-' or '.'.
const LAW_ID = /^[a-z0-9]+([.-][a-z0-9]+)*$/;
// Where a law applies: an ISO 3166 country ('FR'), a subdivision ('DE-BY'),
// or a region such as 'EU'.
const JURISDICTION = /^[A-Z]{2}(-[A-Z0-9]{1,8})?$/;
const LAW_KEYS = [
  'name',
  'jurisdiction',
  'appliesTo',
  'exemptions',
  'since',
  'enforcement',
  'sources'
];
// The fields a translation can give, and whether each is a list.
const TEXT_FIELDS = { name: false, appliesTo: false, exemptions: true, enforcement: true };

function isDate(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

function isHttpsUrl(v) {
  if (typeof v !== 'string' || !/^https:\/\//i.test(v)) return false;
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
}

/** What is wrong with one law, as messages starting with `at`. */
function lawProblems(law, at) {
  const out = [];
  if (!isObject(law)) return [`${at} must be { name, jurisdiction, … }`];
  for (const k of Object.keys(law)) if (!LAW_KEYS.includes(k)) out.push(`${at}: no field "${k}"`);
  if (!isText(law.name)) out.push(`${at}.name must be a non-empty string`);
  if (typeof law.jurisdiction !== 'string' || !JURISDICTION.test(law.jurisdiction)) {
    out.push(`${at}.jurisdiction must be a country or region code, such as 'FR', 'DE-BY' or 'EU'`);
  }
  if (law.appliesTo !== undefined && !isText(law.appliesTo)) {
    out.push(`${at}.appliesTo must be a non-empty string`);
  }
  for (const k of ['exemptions', 'enforcement']) {
    if (law[k] !== undefined && !(Array.isArray(law[k]) && law[k].length && law[k].every(isText))) {
      out.push(`${at}.${k} must be a non-empty list of texts`);
    }
  }
  if (law.since !== undefined && !isDate(law.since)) {
    out.push(`${at}.since must be a date, as YYYY-MM-DD`);
  }
  if (law.sources !== undefined) {
    if (!Array.isArray(law.sources) || !law.sources.length) {
      out.push(`${at}.sources must be a non-empty list of { title, url }`);
    } else {
      law.sources.forEach((s, i) => {
        const sAt = `${at}.sources[${i}]`;
        if (!isObject(s)) return out.push(`${sAt} must be { title, url }`);
        for (const k of Object.keys(s))
          if (k !== 'title' && k !== 'url') out.push(`${sAt}: no field "${k}"`);
        if (!isText(s.title)) out.push(`${sAt}.title must be a non-empty string`);
        if (!isHttpsUrl(s.url)) out.push(`${sAt}.url must be an https:// address`);
      });
    }
  }
  return out;
}

/**
 * What is wrong with a standard's laws, the laws its profiles and its
 * requirements name, and their translations (lawTexts), as messages.
 */
function standardLawProblems(st) {
  const out = [];
  if (!isObject(st)) return out;
  const laws = st.laws;
  if (laws !== undefined) {
    if (!isObject(laws)) out.push('standard.laws must be { id: { name, jurisdiction, … } }');
    else
      for (const [id, law] of Object.entries(laws)) {
        if (isUnsafeKey(id) || !LAW_ID.test(id)) {
          out.push(
            `standard.laws: "${id}" must be lowercase letters and digits, joined by '-' or '.'`
          );
          continue;
        }
        out.push(...lawProblems(law, `standard.laws.${id}`));
      }
  }
  const known = (id) =>
    isObject(laws) && typeof id === 'string' && !isUnsafeKey(id) && hasOwn(laws, id);
  for (const [name, p] of Object.entries(isObject(st.profiles) ? st.profiles : {})) {
    if (isObject(p) && p.law !== undefined && !known(p.law)) {
      out.push(
        `standard.profiles.${name}.law names no law of the standard: ${JSON.stringify(p.law)}`
      );
    }
  }
  for (const [version, entries] of Object.entries(isObject(st.procedures) ? st.procedures : {})) {
    for (const [id, entry] of Object.entries(isObject(entries) ? entries : {})) {
      if (!isObject(entry) || entry.laws === undefined) continue;
      const at = `standard.procedures.${version}.${id}.laws`;
      if (!Array.isArray(entry.laws) || !entry.laws.length) {
        out.push(`${at} must be a non-empty list of the standard's laws`);
        continue;
      }
      for (const l of entry.laws)
        if (!known(l)) out.push(`${at} names no law of the standard: ${JSON.stringify(l)}`);
    }
  }
  out.push(...lawTextsProblems(st));
  return out;
}

// What is wrong with standard.lawTexts: a locale that is no tag or is the
// standard's own, a key that is no text of a law, a list of another length.
function lawTextsProblems(st) {
  if (st.lawTexts === undefined) return [];
  if (!isObject(st.lawTexts)) return ["standard.lawTexts must be { locale: { key: 'text' } }"];
  const out = [];
  const source =
    typeof st.lang === 'string' && TAG.test(st.lang.trim()) ? st.lang.trim().toLowerCase() : 'en';
  for (const [tag, dict] of Object.entries(st.lawTexts)) {
    const at = `standard.lawTexts.${tag}`;
    if (!TAG.test(tag)) {
      out.push(`standard.lawTexts: "${tag}" is not a language tag`);
      continue;
    }
    if (tag.toLowerCase() === source) {
      out.push(`${at}: the standard is written in ${source}, so it needs no translation into it`);
      continue;
    }
    if (!isObject(dict)) {
      out.push(`${at} must map keys to their translation`);
      continue;
    }
    for (const [key, value] of Object.entries(dict)) {
      const m = /^laws\.([^.]+(?:\.[^.]+)*?)\.(name|appliesTo|exemptions|enforcement)$/.exec(key);
      const law =
        m && isObject(st.laws) && !isUnsafeKey(m[1]) && hasOwn(st.laws, m[1])
          ? st.laws[m[1]]
          : null;
      if (!law || law[m[2]] === undefined) {
        out.push(`${at}: ${key} is no text of the standard's laws`);
        continue;
      }
      const src = law[m[2]];
      if (TEXT_FIELDS[m[2]]) {
        if (!Array.isArray(value) || value.length !== src.length || !value.every(isText)) {
          out.push(
            `${at}: ${key} must be a list of ${src.length} ${src.length === 1 ? 'text' : 'texts'}, as the source is`
          );
        }
      } else if (!isText(value)) {
        out.push(`${at}: ${key} must be a non-empty string`);
      }
    }
  }
  return out;
}

// 'fr-CA' reads fr-ca, then fr.
function chain(locale) {
  const tag = typeof locale === 'string' ? locale.trim().toLowerCase() : '';
  if (!tag) return [];
  const base = tag.split('-')[0];
  return base === tag ? [tag] : [tag, base];
}

/**
 * A law in `locale`: { id, name, jurisdiction, appliesTo, exemptions, since,
 * enforcement, sources, lang }, each text translated where standard.lawTexts
 * gives it for the locale (or its base language), else as written, `lang`
 * the language it is in when all its texts are; `langs` says which field is
 * in which, where they differ. null for a law the standard doesn't have.
 */
function lawOf(st, id, locale) {
  if (!isObject(st) || !isObject(st.laws) || isUnsafeKey(id) || !hasOwn(st.laws, id)) return null;
  const law = st.laws[id];
  if (!isObject(law)) return null;
  const source =
    typeof st.lang === 'string' && TAG.test(st.lang.trim()) ? st.lang.trim().toLowerCase() : 'en';
  const dicts = isObject(st.lawTexts) ? st.lawTexts : {};
  const lower = {};
  for (const [tag, d] of Object.entries(dicts))
    if (TAG.test(tag) && isObject(d)) lower[tag.toLowerCase()] = d;
  const out = { id, ...JSON.parse(JSON.stringify(law)) };
  const langs = {};
  for (const [field, list] of Object.entries(TEXT_FIELDS)) {
    if (law[field] === undefined) continue;
    langs[field] = source;
    for (const tag of chain(locale)) {
      if (tag === source) break;
      const d = lower[tag];
      const v = d && hasOwn(d, `laws.${id}.${field}`) ? d[`laws.${id}.${field}`] : undefined;
      const ok = list
        ? Array.isArray(v) && v.length === law[field].length && v.every(isText)
        : isText(v);
      if (ok) {
        out[field] = list ? v.slice() : v;
        langs[field] = tag;
        break;
      }
    }
  }
  const used = [...new Set(Object.values(langs))];
  out.lang = used.length === 1 ? used[0] : source;
  if (used.length > 1) out.langs = langs;
  return out;
}

/**
 * Whether a requirement of standard.procedures applies under a profile's
 * law: one that names no laws applies under every profile; one that names
 * some, under a profile whose law is one of them.
 */
function appliesUnder(entry, law) {
  if (!isObject(entry) || !Array.isArray(entry.laws)) return true;
  return typeof law === 'string' && entry.laws.includes(law);
}

module.exports = {
  lawOf,
  lawProblems,
  standardLawProblems,
  appliesUnder,
  isHttpsUrl,
  LAW_ID,
  JURISDICTION
};
