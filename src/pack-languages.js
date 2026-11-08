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
 * A standard may also give its translations by what each text is, per
 * version, in `standard.texts`: { fr: { '4.1.2': { 'requirements.1.1.title':
 * '…', 'requirements.1.1.facets.1.1.1.steps': ['…', '…'] } } }. A text with
 * one is read from it first, and from `standard.translations` otherwise, so
 * two texts worded alike can be translated apart, and a version can word an
 * id its own way. Experimental (src/experimental.js). The keys
 * (textKeysOf):
 *   requirements.<id>.title, requirements.<id>.note,
 *   requirements.<id>.facets.<facet>.label | steps | passWhen | failWhen,
 *   requirements.<id>.replace.<facet>.steps | passWhen | failWhen,
 *   groups.<id>.title, notes,
 *   review.<rule>.<CODE>.steps | passWhen | failWhen
 * A list of texts (steps, notes) is given as a list, in the source's order.
 *
 * No file system and no engine: src/procedures-core.js reads a standard
 * with it in Node and in a browser bundle, and src/pack.js checks a pack
 * with it.
 */

const { idTextsOf, isUnsafeKey } = require('./texts-by-id.js');

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';

// A language tag, as a locale file is named: 'fr', 'pt-BR', 'zh-Hant'.
const TAG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$/;

// The language the standard's own text is in, lower case: a language tag,
// or 'en' where it gives none (definePack refuses anything else, and a tag
// can't name a property of Object.prototype).
const sourceOf = (st) =>
  isObject(st) && typeof st.lang === 'string' && TAG.test(st.lang.trim())
    ? st.lang.trim().toLowerCase()
    : 'en';

// The standard's translations, by lower-case locale: { locale: { text: text } }.
function translationsOf(st) {
  const out = {};
  if (!isObject(st) || !isObject(st.translations)) return out;
  for (const [tag, dict] of Object.entries(st.translations)) {
    if (TAG.test(tag) && isObject(dict)) out[tag.toLowerCase()] = dict;
  }
  return out;
}

/** Whether a standard declares its languages: lang, translations or texts. */
const declaresLanguages = (st) =>
  isObject(st) &&
  (st.lang !== undefined || st.translations !== undefined || st.texts !== undefined);

/** The languages the standard has: its own first, then its translations'. */
function languagesOf(st) {
  const source = sourceOf(st);
  const out = [source];
  for (const l of [...Object.keys(translationsOf(st)), ...Object.keys(idTextsOf(st))]) {
    if (!out.includes(l)) out.push(l);
  }
  return out;
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
 * The standard's text in `locale`: text(source, key, version) gives { text,
 * lang }, the translation where the locale has one (by `key` in `version`,
 * from standard.texts, else by the text, from standard.translations), else
 * the source in its own language. all(texts, keys, version) translates a
 * list (a facet's) as a whole or not at all, so a person never meets one
 * step in another language; `keys` gives each text's key, in order.
 */
function translator(st, locale) {
  const source = sourceOf(st);
  const lang = typeof locale === 'string' && locale ? locale.toLowerCase() : source;
  const dict = lang === source ? null : translationsOf(st)[lang] || null;
  const byId = lang === source ? null : idTextsOf(st)[lang] || null;
  const one = (text, key, version) => {
    if (typeof text !== 'string') return null;
    const ids =
      byId && typeof version === 'string' && isObject(byId[version]) ? byId[version] : null;
    if (ids && typeof key === 'string' && hasOwn(ids, key) && isText(ids[key])) return ids[key];
    return dict && hasOwn(dict, text) && isText(dict[text]) ? dict[text] : null;
  };
  return {
    locale: dict || byId ? lang : source,
    source,
    text(text, key, version) {
      const t = one(text, key, version);
      return t === null ? { text, lang: source } : { text: t, lang };
    },
    // [texts] as a whole: { texts, lang }.
    all(texts, keys, version) {
      const list = texts.map((t, i) => one(t, Array.isArray(keys) ? keys[i] : undefined, version));
      return list.every((t) => t !== null)
        ? { texts: list, lang }
        : { texts: texts.slice(), lang: source };
    }
  };
}

// The key of each text of a procedure (a facet's or a replacement's), in
// the order all() reads them: its label where it has one, its steps, then
// passWhen and failWhen.
function procedureKeys(stem, procedure, withLabel) {
  const steps = isObject(procedure) && Array.isArray(procedure.steps) ? procedure.steps : [];
  return [
    ...(withLabel ? [`${stem}.label`] : []),
    ...steps.map((_, i) => `${stem}.steps.${i}`),
    `${stem}.passWhen`,
    `${stem}.failWhen`
  ];
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
 * Every text of the standard a translation can give, with where it is:
 * [{ version, key, text }], its requirements' (titles, notes, own facets,
 * replacements), its groups' titles, its notes, and its rollups' titles,
 * in every version (the keys of standard.texts, above).
 */
function unitsOf(st) {
  const units = [];
  if (!isObject(st)) return units;
  const add = (version, key, text) => {
    if (isText(text)) units.push({ version, key, text });
  };
  const procedure = (version, stem, p, withLabel) => {
    if (!isObject(p)) return;
    const keys = procedureKeys(stem, p, withLabel);
    const texts = [
      ...(withLabel ? [p.label] : []),
      ...(Array.isArray(p.steps) ? p.steps : []),
      p.passWhen,
      p.failWhen
    ];
    texts.forEach((t, i) => add(version, keys[i], t));
  };
  for (const [version, requirements] of Object.entries(
    isObject(st.procedures) ? st.procedures : {}
  )) {
    for (const [id, entry] of Object.entries(isObject(requirements) ? requirements : {})) {
      if (!isObject(entry)) continue;
      add(version, `requirements.${id}.title`, entry.title);
      add(version, `requirements.${id}.note`, entry.note);
      for (const f of Array.isArray(entry.facets) ? entry.facets : []) {
        if (isObject(f)) procedure(version, `requirements.${id}.facets.${f.id}`, f, true);
      }
      for (const [fid, own] of Object.entries(isObject(entry.replace) ? entry.replace : {})) {
        procedure(version, `requirements.${id}.replace.${fid}`, own, false);
      }
    }
  }
  const walk = (version, groups) => {
    for (const g of Array.isArray(groups) ? groups : []) {
      if (!isObject(g)) continue;
      add(version, `groups.${g.id}.title`, g.title);
      walk(version, g.groups);
    }
  };
  for (const [version, groups] of Object.entries(isObject(st.groups) ? st.groups : {})) {
    walk(version, groups);
  }
  for (const [version, list] of Object.entries(isObject(st.notes) ? st.notes : {})) {
    (Array.isArray(list) ? list : []).forEach((n, i) => add(version, `notes.${i}`, n));
  }
  for (const r of rollupsOf(st)) {
    const meta = r.meta;
    if (typeof meta.version === 'string' && typeof meta.criterion === 'string') {
      add(meta.version, `requirements.${meta.criterion}.title`, meta.title);
    }
  }
  // The standard's own steps for core's codes, in each version: its review,
  // with the version's own replacing the same rule and code.
  for (const version of Array.isArray(st.versions) ? st.versions : []) {
    const review = {};
    for (const table of [
      st.review,
      isObject(st.reviewByVersion) ? st.reviewByVersion[version] : null
    ]) {
      for (const [ruleId, byCode] of Object.entries(isObject(table) ? table : {})) {
        for (const [code, entry] of Object.entries(isObject(byCode) ? byCode : {})) {
          if (isUnsafeKey(ruleId) || isUnsafeKey(code)) continue;
          if (isObject(entry)) (review[ruleId] = review[ruleId] || {})[code] = entry;
        }
      }
    }
    for (const [ruleId, byCode] of Object.entries(review)) {
      for (const [code, entry] of Object.entries(byCode)) {
        procedure(version, `review.${ruleId}.${code}`, entry, false);
      }
    }
  }
  return units;
}

// The standard's rollups with a meta, or [] where it gives none.
function rollupsOf(st) {
  if (typeof st.composites !== 'function') return [];
  let rollups;
  try {
    rollups = st.composites();
  } catch {
    return [];
  }
  return (Array.isArray(rollups) ? rollups : []).filter((r) => isObject(r) && isObject(r.meta));
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
  problems.push(...idTextProblems(st));
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

// What is wrong with standard.texts: a locale that is no tag or is the
// standard's own, a version it doesn't have, a key that names no text of
// it, a list where the source has one text or one where it has a list, a
// list of another length, an empty text, or other {{placeholders}}.
function idTextProblems(st) {
  if (st.texts === undefined) return [];
  if (!isObject(st.texts)) {
    return ["standard.texts must be { locale: { version: { key: 'text' } } }"];
  }
  const problems = [];
  const source = sourceOf(st);
  const versions = Array.isArray(st.versions) ? st.versions : [];
  // The source texts by version and key; a list's by its key and index.
  const known = {};
  const lists = {};
  for (const u of unitsOf(st)) {
    if (isUnsafeKey(u.version) || isUnsafeKey(u.key)) continue;
    (known[u.version] = known[u.version] || {})[u.key] = u.text;
    const m = /^(.*)\.(\d+)$/.exec(u.key);
    if (m && !isUnsafeKey(m[1])) {
      const byKey = (lists[u.version] = lists[u.version] || {});
      byKey[m[1]] = Math.max(byKey[m[1]] || 0, Number(m[2]) + 1);
    }
  }
  for (const [tag, byVersion] of Object.entries(st.texts)) {
    const at = `standard.texts.${tag}`;
    if (!TAG.test(tag)) {
      problems.push(`standard.texts: "${tag}" is not a language tag`);
      continue;
    }
    if (tag.toLowerCase() === source) {
      problems.push(
        `${at}: the standard is written in ${source}, so it needs no translation into it`
      );
      continue;
    }
    if (!isObject(byVersion)) {
      problems.push(`${at} must be { version: { key: 'text' } }`);
      continue;
    }
    for (const [version, dict] of Object.entries(byVersion)) {
      const vAt = `${at}.${version}`;
      if (isUnsafeKey(version)) {
        problems.push(`${at}: a key named "${version}" is not allowed`);
        continue;
      }
      if (!versions.includes(version)) {
        problems.push(`${vAt}: the standard has no version ${version}`);
        continue;
      }
      if (!isObject(dict)) {
        problems.push(`${vAt} must map keys to their translation`);
        continue;
      }
      const texts = known[version] || {};
      const listed = lists[version] || {};
      for (const [key, value] of Object.entries(dict)) {
        const kAt = `${vAt}: ${key}`;
        if (isUnsafeKey(key)) {
          problems.push(`${vAt}: a key named "${key}" is not allowed`);
          continue;
        }
        if (Array.isArray(value)) {
          if (!hasOwn(listed, key)) {
            problems.push(`${kAt} is no list of texts of the standard`);
            continue;
          }
          if (value.length !== listed[key]) {
            problems.push(
              `${kAt} must have ${listed[key]} ${listed[key] === 1 ? 'text' : 'texts'}, as the source has`
            );
            continue;
          }
          value.forEach((v, i) => {
            const src = texts[`${key}.${i}`];
            if (!isText(v)) problems.push(`${kAt}[${i}] must be a non-empty string`);
            else if (placeholders(v) !== placeholders(src)) {
              problems.push(`${kAt}[${i}] must keep the same {{placeholders}}`);
            }
          });
          continue;
        }
        if (!hasOwn(texts, key)) {
          problems.push(
            hasOwn(listed, key)
              ? `${kAt} is a list in the source: give a list`
              : `${kAt} is no text of the standard`
          );
        } else if (!isText(value)) {
          problems.push(`${kAt} must be a non-empty string`);
        } else if (placeholders(value) !== placeholders(texts[key])) {
          problems.push(`${kAt} must keep the same {{placeholders}}`);
        }
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
  // By id: each text where it is, translated by its key or by its text.
  if (st.texts !== undefined) {
    const units = unitsOf(st);
    const english = translationsOf(st);
    const ids = idTextsOf(st);
    const source = sourceOf(st);
    return languagesOf(st)
      .filter((locale) => locale !== source)
      .map((locale) => {
        const dict = english[locale] || {};
        const byId = ids[locale] || {};
        const missing = [];
        for (const u of units) {
          const v = isObject(byId[u.version]) ? byId[u.version] : {};
          const ok =
            (hasOwn(v, u.key) && isText(v[u.key])) ||
            (hasOwn(dict, u.text) && isText(dict[u.text]));
          if (!ok && !missing.includes(u.text)) missing.push(u.text);
        }
        return {
          locale,
          total: units.length,
          translated: units.length - units.filter((u) => missing.includes(u.text)).length,
          missing
        };
      });
  }
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
  const ids = idTextsOf(st);
  if (
    (!Object.keys(dicts).length && !Object.keys(ids).length) ||
    typeof st.composites !== 'function'
  ) {
    return none;
  }
  const source = sourceOf(st);
  // A rollup's title in each locale that translates it: by its
  // requirement's key in its version, else by its text.
  const translated = (meta) => {
    const key = `requirements.${meta.criterion}.title`;
    const out = [];
    for (const locale of new Set([...Object.keys(dicts), ...Object.keys(ids)])) {
      const v =
        ids[locale] && isObject(ids[locale][meta.version]) ? ids[locale][meta.version] : null;
      if (v && hasOwn(v, key) && isText(v[key])) out.push([locale, v[key]]);
      else if (
        dicts[locale] &&
        hasOwn(dicts[locale], meta.title) &&
        isText(dicts[locale][meta.title])
      ) {
        out.push([locale, dicts[locale][meta.title]]);
      }
    }
    return out;
  };
  // Keyed by the title, and, where the standard translates by id, by its
  // version and requirement too: two titles worded alike may differ there.
  const keyOf = (meta) =>
    `${namespace}_title_${hashOf(Object.keys(ids).length ? `${meta.version}\u0000${meta.criterion}\u0000${meta.title}` : meta.title)}`;
  const dictionaries = {};
  const keyed = new Map();
  for (const r of rollupsOf(st)) {
    const meta = r.meta;
    if (!isText(meta.title)) continue;
    const found = translated(meta);
    if (!found.length) continue;
    const key = keyOf(meta);
    // A rollup that names its own titleKey keeps it.
    if (meta.titleKey === undefined) keyed.set(r.id, key);
    if (isUnsafeKey(source)) continue;
    (dictionaries.en = dictionaries.en || {})[key] = meta.title;
    if (source !== 'en') (dictionaries[source] = dictionaries[source] || {})[key] = meta.title;
    for (const [locale, text] of found) {
      if (isUnsafeKey(locale)) continue;
      (dictionaries[locale] = dictionaries[locale] || {})[key] = text;
    }
  }
  if (!dictionaries.en) return none;
  const composites = () =>
    st
      .composites()
      .map((r) =>
        isObject(r) && keyed.has(r.id)
          ? { ...r, meta: { ...r.meta, titleKey: keyed.get(r.id) } }
          : r
      );
  return { standard: { ...st, composites }, dictionaries };
}

module.exports = {
  declaresLanguages,
  idTextsOf,
  procedureKeys,
  unitsOf,
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
