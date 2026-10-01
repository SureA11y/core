'use strict';

/**
 * Where the dictionaries live: core's under src/i18n/, and each profile's
 * under the `i18nDir` its entry in profiles/index.js gives
 * (profiles/<name>/i18n/). Each folder holds one <locale>.json per locale,
 * en.json being the source the others are synced against. A profile's
 * dictionary holds the keys of its own rules and messages, and nothing else.
 *
 * A profile chooses its languages: the locale files in its folder are the
 * list. It has en.json, and any others it translates; core's locales it has
 * no file for show its messages in English, as the engine does for any key a
 * locale lacks.
 *
 * The engine sees one dictionary per locale: core's entries, then each
 * profile's in registry order. A key defined in two folders is an error, so a
 * profile can never change one of core's messages.
 */

const fs = require('fs');
const path = require('path');

const PROFILES = require('../../profiles');

const ROOT_DIR = path.join(__dirname, '..', '..');
const CORE_I18N_DIR = path.join(ROOT_DIR, 'src', 'i18n');

// en.json, fr.json, pt-BR.json...
function isLocaleFileName(name) {
  return typeof name === 'string' && /^[a-z]{2}(-[A-Za-z0-9]+)?\.json$/.test(name);
}

// Every dictionary folder that exists, core's first: [{ key, dir }], key
// 'core' or the profile's.
function i18nSources() {
  return [{ key: 'core', dir: CORE_I18N_DIR }]
    .concat(PROFILES.filter((p) => p.i18nDir).map((p) => ({ key: p.standard.key, dir: p.i18nDir })))
    .filter(({ dir }) => fs.existsSync(dir));
}

// Every dictionary folder that exists, core's first.
function i18nDirs() {
  return i18nSources().map(({ dir }) => dir);
}

// The locales a dictionary folder has, en first, then the rest sorted.
function localesOf(dir) {
  const locales = fs
    .readdirSync(dir)
    .filter(isLocaleFileName)
    .map((file) => file.replace(/\.json$/, ''))
    .filter((locale) => locale !== 'en')
    .sort();
  return ['en', ...locales];
}

// { locale: dict } for every locale file in every folder, merged in folder
// order. Throws on a key two folders define, or on a file that is not a JSON
// object. `en` is always present.
function loadDictionaries(dirs = i18nDirs()) {
  const out = {};
  const owner = {};
  for (const dir of dirs) {
    for (const file of fs.readdirSync(dir).filter(isLocaleFileName).sort()) {
      const locale = file.replace(/\.json$/, '');
      const abs = path.join(dir, file);
      const dict = JSON.parse(fs.readFileSync(abs, 'utf8'));
      if (!dict || typeof dict !== 'object' || Array.isArray(dict)) {
        throw new Error(`${path.relative(ROOT_DIR, abs)} must hold a JSON object`);
      }
      const merged = (out[locale] = out[locale] || {});
      const seen = (owner[locale] = owner[locale] || {});
      for (const [key, value] of Object.entries(dict)) {
        if (key in merged) {
          throw new Error(
            `i18n key "${key}" is defined in both ${seen[key]} and ${path.relative(ROOT_DIR, abs)}`
          );
        }
        merged[key] = value;
        seen[key] = path.relative(ROOT_DIR, abs);
      }
    }
  }
  if (!out.en) out.en = {};
  return out;
}

// For each locale some folder has, the English keys of the profiles' folders
// that do not have it: { locale: [key...] }, a locale listed only when it
// leaves keys out. Those messages show in English in that locale by the
// profile's choice, so the engine does not count them as missing from its
// dictionary. Core's keys (the first folder's) are never left out: a locale
// core lacks is a partial dictionary.
function keysLeftOut(dirs = i18nDirs()) {
  const perDir = dirs.map((dir) => ({ dir, locales: localesOf(dir) }));
  const locales = new Set(perDir.flatMap((d) => d.locales).filter((l) => l !== 'en'));
  const out = {};
  for (const locale of [...locales].sort()) {
    const keys = perDir
      .slice(1)
      .filter((d) => !d.locales.includes(locale))
      .flatMap((d) => Object.keys(loadDictionaries([d.dir]).en));
    if (keys.length) out[locale] = keys.sort();
  }
  return out;
}

module.exports = {
  CORE_I18N_DIR,
  isLocaleFileName,
  i18nSources,
  i18nDirs,
  localesOf,
  loadDictionaries,
  keysLeftOut
};
