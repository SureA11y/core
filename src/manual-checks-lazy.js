/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * What a scan leaves to a person, for the HTML report (src/report.js): the
 * facets of the standard scanned that no rule decides in full, each with its
 * procedure (docs/PROCEDURES.md), grouped by requirement. The procedures are
 * read from core's dictionaries on disk (src/procedures.js), so, as
 * src/how-to-check-lazy.js does, the module is loaded through Node's own
 * require, which a bundler doesn't follow: in a browser (surea11y.report.js)
 * there are none, and the report has no such section.
 */

const LEFT_TO_A_PERSON = ['manual', 'partial'];

let proceduresModule;
function procedures() {
  if (proceduresModule === undefined) {
    proceduresModule = null;
    try {
      if (typeof module === 'object' && module && typeof module.require === 'function') {
        const id = './procedures.js';
        proceduresModule = module.require(id);
      }
    } catch {
      proceduresModule = null;
    }
  }
  return proceduresModule;
}

// The language a text of core's procedures dictionaries is read in, for
// `locale`: textLang(key, text) gives the locale whose dictionary gives
// that text under that key, or 'en' where English does or none gives it. A
// text can read the same in two languages ("Orientation"), so the text
// alone can't tell.
function textLangs(locale) {
  let read = null;
  try {
    // Paths in variables, as above, so a bundler doesn't follow them.
    const textId = './procedures-text.js';
    const dir = './i18n/procedures/';
    const { reader } = module.require(textId);
    read = reader((l) => {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(l)) return null;
      try {
        return module.require(dir + l + '.json');
      } catch {
        return null;
      }
    }, locale);
  } catch {
    read = null;
  }
  return (key, text) =>
    (read && (text === undefined || read.text(key) === text) && read.localeOf(key)) || 'en';
}

// The standard scanned: a pack's, where the scan ran one of its profiles
// and the pack gives procedures; WCAG at the scan's version otherwise.
function scopeOf(result, packs, levels) {
  const engine = (result && result.engine) || {};
  for (const pack of Array.isArray(packs) ? packs : []) {
    const st = pack && pack.standard;
    const profile = st && st.profiles && engine.profile ? st.profiles[engine.profile] : null;
    if (profile && st.procedures) {
      return { standard: st.key, name: st.standard, version: profile.version };
    }
  }
  const version = typeof engine.wcagVersion === 'string' ? engine.wcagVersion : '2.2';
  return { standard: 'wcag', name: 'WCAG', version, levels };
}

/**
 * The facets left to a person, by requirement, in `locale`, or null where
 * the procedures can't be read here (a browser bundle, or a standard core
 * has none for). Each text says the language it is in (`lang`, `titleLang`,
 * `labelLang`, `procedureLang`), so the report marks what isn't in its own:
 * a text a locale lacks, or a pack's standard read in another language than
 * the report's (docs/PACKS.md, "Languages"). A pack's titles are left to
 * the standard's report.titleLang where its standard declares no language.
 */
function leftToAPerson(result, { packs, locale, levels } = {}) {
  const mod = procedures();
  if (!mod) return null;
  const scope = scopeOf(result, packs, levels);
  const list = mod.listProcedures({
    standard: scope.standard,
    version: scope.version,
    ...(scope.levels ? { levels: scope.levels } : {}),
    automation: LEFT_TO_A_PERSON,
    packs,
    locale
  });
  if (!list) return null;
  // Core's text is read in the list's locale: the one asked for, or the one
  // a pack's standard is read in.
  const textLang = textLangs(list.locale || locale);
  const facetsIn = (r) => r.facets.filter((f) => !f.coveredBy && f.procedure);
  const wcag = scope.standard === 'wcag';
  const requirements = list.requirements
    .map((r) => {
      const criterion = wcag ? r.id : r.wcag || null;
      return {
        id: r.id,
        title: r.title,
        titleLang: wcag ? textLang(`wcag_${r.id}_title`, r.title) : r.titleLang || null,
        level: r.level,
        wcag: r.wcag || null,
        facets: facetsIn(r).map((f) => ({
          id: f.id,
          label: f.label,
          // A pack's own facet is in its standard's language, English where
          // it declares none; a replaced one keeps core's label.
          labelLang: criterion
            ? textLang(`wcag_${criterion}_${f.id}_label`, f.label)
            : f.lang || 'en',
          automation: f.automation,
          procedure: f.procedure,
          procedureLang:
            criterion && !f.procedureFrom
              ? textLang(`wcag_${criterion}_${f.id}_step1`)
              : f.procedureLang || f.lang || 'en',
          tools: f.tools.map((t) => ({
            label: t.label,
            lang: textLang(`tool_${t.id}`, t.label)
          }))
        }))
      };
    })
    .filter((r) => r.facets.length);
  return {
    standard: scope.standard,
    name: scope.name,
    version: list.version,
    levels: scope.levels || null,
    requirements
  };
}

module.exports = { leftToAPerson };
