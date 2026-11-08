/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * A standard's translations by id (standard.texts, src/pack-languages.js):
 * read here, with nothing else, so the code that reads a standard's own
 * steps for a finding (src/pack-review.js) can use them in a browser bundle
 * without the rest of the languages' code. Experimental
 * (src/experimental.js).
 */

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// A language tag, as a locale file is named: 'fr', 'pt-BR', 'zh-Hant'.
const TAG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$/;

// Keys that would reach Object.prototype through an assignment: data can
// carry them (JSON keeps "__proto__" as a key), so nothing written by key
// takes them.
const isUnsafeKey = (k) => k === '__proto__' || k === 'constructor' || k === 'prototype';

// The standard's translations by id, by lower-case locale and version, each
// list flattened to one key per text ('…steps.0'): { locale: { version: {
// key: text } } }.
// Read once for a standard whose texts are frozen, as definePack leaves
// them: every lookup of a translation reads this. Texts that can still
// change are read each time.
const READ = new WeakMap();

function idTextsOf(st) {
  if (!isObject(st) || !isObject(st.texts)) return {};
  const frozen = Object.isFrozen(st.texts);
  if (frozen && READ.has(st.texts)) return READ.get(st.texts);
  const out = flatten(st.texts);
  if (frozen) READ.set(st.texts, Object.freeze(out));
  return out;
}

function flatten(texts) {
  const out = {};
  for (const [tag, byVersion] of Object.entries(texts)) {
    if (!TAG.test(tag) || !isObject(byVersion)) continue;
    const locale = (out[tag.toLowerCase()] = {});
    for (const [version, dict] of Object.entries(byVersion)) {
      if (!isObject(dict) || isUnsafeKey(version)) continue;
      const flat = (locale[version] = {});
      for (const [key, value] of Object.entries(dict)) {
        if (isUnsafeKey(key)) continue;
        if (Array.isArray(value)) value.forEach((v, i) => (flat[`${key}.${i}`] = v));
        else flat[key] = value;
      }
    }
  }
  return out;
}

module.exports = { idTextsOf, isUnsafeKey, TAG };
