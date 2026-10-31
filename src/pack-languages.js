/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The languages of a pack's standard (docs/PACKS.md, "Languages"): the one
 * its own text is written in, `standard.lang` ('en' where it gives none),
 * and those `standard.translations` gives it in, keyed by the text they
 * translate: { fr: { 'Check that…': 'Vérifiez que…' } }.
 *
 * A standard is read in one language: the first of those asked for that it
 * has ('fr-CA' tries fr-ca, then fr), or else its own. Its text and core's
 * that it uses (the procedures of the WCAG criteria it restates) are both
 * read in it, so a page of the standard is in one language throughout.
 *
 * Keyed by its text, a translation follows it: a text the versions share is
 * translated once, and one whose source changes is no longer translated,
 * rather than translated as it was.
 *
 * No file system and no engine: src/procedures-core.js reads a standard
 * with it in Node and in a browser bundle, and src/pack.js checks a pack
 * with it.
 */

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';

// A language tag, as a locale file is named: 'fr', 'pt-BR', 'zh-Hant'.
const TAG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$/;

// The language the standard's own text is in, lower case.
const sourceOf = (st) => (isObject(st) && isText(st.lang) ? st.lang.trim().toLowerCase() : 'en');

// The standard's translations, by lower-case locale: { locale: { text: text } }.
function translationsOf(st) {
  const out = {};
  if (!isObject(st) || !isObject(st.translations)) return out;
  for (const [tag, dict] of Object.entries(st.translations)) {
    if (TAG.test(tag) && isObject(dict)) out[tag.toLowerCase()] = dict;
  }
  return out;
}

/** The languages the standard has: its own first, then its translations'. */
function languagesOf(st) {
  const source = sourceOf(st);
  return [source].concat(Object.keys(translationsOf(st)).filter((l) => l !== source));
}

// The tags asked for, each followed by its base language: 'fr-CA' asks for
// fr-ca, then fr.
function asked(locales) {
  const out = [];
  for (const locale of Array.isArray(locales) ? locales : [locales]) {
    const tag = typeof locale === 'string' ? locale.trim().toLowerCase() : '';
    if (!tag) continue;
    for (const t of [tag, tag.split('-')[0]]) if (!out.includes(t)) out.push(t);
  }
  return out;
}

/**
 * The language a standard is read in, asked for `locales` (a tag or a list,
 * most wanted first): the first it has, or else its own.
 */
function localeFor(st, locales) {
  const has = languagesOf(st);
  return asked(locales).find((l) => has.includes(l)) || sourceOf(st);
}

/**
 * The standard's text in `locale`: text(source) gives { text, lang }, the
 * translation where the locale has one, else the source in its own
 * language. A list of texts (a facet's) is translated as a whole or not at
 * all, so a person never meets one step in another language.
 */
function translator(st, locale) {
  const source = sourceOf(st);
  const lang = typeof locale === 'string' && locale ? locale.toLowerCase() : source;
  const dict = lang === source ? null : translationsOf(st)[lang] || null;
  const one = (text) =>
    dict && typeof text === 'string' && hasOwn(dict, text) && isText(dict[text])
      ? dict[text]
      : null;
  return {
    locale: dict ? lang : source,
    source,
    text(text) {
      const t = one(text);
      return t === null ? { text, lang: source } : { text: t, lang };
    },
    // [texts] as a whole: { texts, lang }.
    all(texts) {
      const list = texts.map(one);
      return list.every((t) => t !== null)
        ? { texts: list, lang }
        : { texts: texts.slice(), lang: source };
    }
  };
}

// A requirement's texts: its title and note, and its own facets' or its
// replacements' labels and procedures.
function requirementTexts(entry) {
  const out = [];
  if (!isObject(entry)) return out;
  for (const v of [entry.title, entry.note]) if (isText(v)) out.push(v);
  const procedure = (p) => {
    if (!isObject(p)) return;
    for (const s of Array.isArray(p.steps) ? p.steps : []) if (isText(s)) out.push(s);
    for (const v of [p.passWhen, p.failWhen]) if (isText(v)) out.push(v);
  };
  for (const f of Array.isArray(entry.facets) ? entry.facets : []) {
    if (!isObject(f)) continue;
    if (isText(f.label)) out.push(f.label);
    procedure(f);
  }
  if (isObject(entry.replace)) Object.values(entry.replace).forEach(procedure);
  return out;
}

/**
 * Every text of the standard a translation can give, once each: its
 * requirements' (titles, notes, own facets, replacements), its groups'
 * titles, its notes, and its rollups' titles, in every version.
 */
function textsOf(st) {
  const out = new Set();
  if (!isObject(st)) return [];
  const add = (v) => {
    if (isText(v)) out.add(v);
  };
  for (const requirements of Object.values(isObject(st.procedures) ? st.procedures : {})) {
    for (const entry of Object.values(isObject(requirements) ? requirements : {})) {
      requirementTexts(entry).forEach(add);
    }
  }
  const walk = (groups) => {
    for (const g of Array.isArray(groups) ? groups : []) {
      if (!isObject(g)) continue;
      add(g.title);
      walk(g.groups);
    }
  };
  Object.values(isObject(st.groups) ? st.groups : {}).forEach(walk);
  for (const list of Object.values(isObject(st.notes) ? st.notes : {})) {
    (Array.isArray(list) ? list : []).forEach(add);
  }
  for (const title of rollupTitles(st)) add(title);
  return [...out];
}

// The titles of the standard's rollups: what a scan's results name its
// requirements by.
function rollupTitles(st) {
  if (typeof st.composites !== 'function') return [];
  let rollups;
  try {
    rollups = st.composites();
  } catch {
    return [];
  }
  return (Array.isArray(rollups) ? rollups : [])
    .map((r) => (isObject(r) && isObject(r.meta) ? r.meta.title : null))
    .filter(isText);
}

const placeholders = (text) => (text.match(/\{\{\w+\}\}/g) || []).sort().join(' ');

/** What is wrong with a standard's lang and translations, as messages. */
function languageProblems(st) {
  const problems = [];
  if (!isObject(st)) return problems;
  if (st.lang !== undefined && (typeof st.lang !== 'string' || !TAG.test(st.lang))) {
    problems.push("standard.lang must be a language tag, such as 'en' or 'fr'");
  }
  if (st.translations === undefined) return problems;
  if (!isObject(st.translations)) {
    return problems.concat(["standard.translations must be { locale: { 'source text': 'text' } }"]);
  }
  const source = sourceOf(st);
  const texts = new Set(textsOf(st));
  for (const [tag, dict] of Object.entries(st.translations)) {
    const at = `standard.translations.${tag}`;
    if (!TAG.test(tag)) {
      problems.push(`standard.translations: "${tag}" is not a language tag`);
      continue;
    }
    if (tag.toLowerCase() === source) {
      problems.push(
        `${at}: the standard is written in ${source}, so it needs no translation into it`
      );
      continue;
    }
    if (!isObject(dict)) {
      problems.push(`${at} must map the standard's texts to their translation`);
      continue;
    }
    for (const [text, translation] of Object.entries(dict)) {
      const short = JSON.stringify(text.length > 60 ? `${text.slice(0, 57)}...` : text);
      if (!texts.has(text)) {
        problems.push(
          `${at}: ${short} is no text of the standard (was it changed? translate the new text)`
        );
      } else if (!isText(translation)) {
        problems.push(`${at}: ${short} must be translated as a non-empty string`);
      } else if (placeholders(translation) !== placeholders(text)) {
        problems.push(`${at}: ${short} must keep the same {{placeholders}}`);
      }
    }
  }
  return problems;
}

/**
 * How far each translation of a pack's standard covers its texts: [{ locale,
 * total, translated, missing: [text] }], in the order of
 * standard.translations. Empty for a pack with no standard or none.
 */
function packTranslationCoverage(pack) {
  const st = isObject(pack) && isObject(pack.standard) ? pack.standard : null;
  if (!st) return [];
  const texts = textsOf(st);
  return Object.entries(translationsOf(st))
    .filter(([locale]) => locale !== sourceOf(st))
    .map(([locale, dict]) => {
      const missing = texts.filter((t) => !(hasOwn(dict, t) && isText(dict[t])));
      return { locale, total: texts.length, translated: texts.length - missing.length, missing };
    });
}

// A short name for a text that stays the same while the text does: its
// FNV-1a hash, in hex.
function hashOf(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/**
 * A standard whose translations give its rollups' titles, for a scan: each
 * such rollup is named by a key core makes (`<namespace>_title_<hash>`),
 * and `dictionaries` holds the title under it, in each translation and, in
 * English, the fallback every other locale reads, as the standard's English
 * translation or else as written. { standard, dictionaries }; the standard
 * as given, and none, where no title has a translation.
 */
function withTitleKeys(st, namespace) {
  const none = { standard: st, dictionaries: {} };
  const dicts = translationsOf(st);
  if (!Object.keys(dicts).length || typeof st.composites !== 'function') return none;
  const source = sourceOf(st);
  const keyOf = (title) => `${namespace}_title_${hashOf(title)}`;
  const translated = (title) =>
    Object.entries(dicts).filter(([, d]) => hasOwn(d, title) && isText(d[title]));
  const dictionaries = {};
  for (const title of rollupTitles(st)) {
    const found = translated(title);
    if (!found.length) continue;
    const key = keyOf(title);
    (dictionaries.en = dictionaries.en || {})[key] = title;
    if (source !== 'en') (dictionaries[source] = dictionaries[source] || {})[key] = title;
    for (const [locale, d] of found)
      (dictionaries[locale] = dictionaries[locale] || {})[key] = d[title];
  }
  if (!dictionaries.en) return none;
  const composites = () =>
    st.composites().map((r) => {
      const title = isObject(r) && isObject(r.meta) ? r.meta.title : null;
      if (!isText(title) || r.meta.titleKey !== undefined || !translated(title).length) return r;
      return { ...r, meta: { ...r.meta, titleKey: keyOf(title) } };
    });
  return { standard: { ...st, composites }, dictionaries };
}

module.exports = {
  languageProblems,
  languagesOf,
  localeFor,
  packTranslationCoverage,
  sourceOf,
  textsOf,
  translationsOf,
  translator,
  withTitleKeys
};
