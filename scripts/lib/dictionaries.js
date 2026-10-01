'use strict';

/**
 * Where the dictionaries live: core's under src/i18n/, and each profile's
 * under the `i18nDir` its entry in profiles/index.js gives
 * (profiles/<name>/i18n/). Each folder holds one <locale>.json per locale,
 * en.json being the source the others are synced against. A profile's
 * dictionary holds the keys of its own rules and messages, and nothing else.
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

// Every dictionary folder that exists, core's first.
function i18nDirs() {
  return [CORE_I18N_DIR]
    .concat(PROFILES.map((p) => p.i18nDir).filter(Boolean))
    .filter((dir) => fs.existsSync(dir));
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

module.exports = { CORE_I18N_DIR, isLocaleFileName, i18nDirs, loadDictionaries };
