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

// The standard a profile of the scan judged by: a pack's, where the
// profile is one of its profiles and the pack gives procedures; WCAG at the
// profile's version otherwise.
function scopeOf(result, packs, levels, profileId) {
  const engine = (result && result.engine) || {};
  for (const pack of Array.isArray(packs) ? packs : []) {
    const st = pack && pack.standard;
    const profile = st && st.profiles && profileId ? st.profiles[profileId] : null;
    if (profile && st.procedures) {
      return { standard: st.key, name: st.standard, version: profile.version };
    }
  }
  const own =
    result &&
    result.profiles &&
    profileId &&
    Object.prototype.hasOwnProperty.call(result.profiles, profileId)
      ? result.profiles[profileId]
      : null;
  // A profile that targets no WCAG level (WAI-ARIA's) is read at the
  // version the scan reports, not core's default it carries.
  const version =
    own && typeof own.wcagVersion === 'string' && own.wcagLevel
      ? own.wcagVersion
      : typeof engine.wcagVersion === 'string'
        ? engine.wcagVersion
        : '2.2';
  return { standard: 'wcag', name: 'WCAG', version, levels };
}

// The standards scanned, one per standard and version: that of each profile
// of a scan of several (engine.profiles), in its order, or of its one.
function scopesOf(result, packs, levels) {
  const engine = (result && result.engine) || {};
  const ids =
    Array.isArray(engine.profiles) && engine.profiles.length ? engine.profiles : [engine.profile];
  const scopes = [];
  for (const id of ids) {
    const scope = scopeOf(result, packs, levels, id);
    if (!scopes.some((s) => s.standard === scope.standard && s.version === scope.version)) {
      scopes.push(scope);
    }
  }
  // A standard's versions together, in its own order, as the report's
  // rollup tables give them.
  const order = scopes.map((s) => s.standard).filter((k, i, all) => all.indexOf(k) === i);
  const versionsOf = (key) => {
    const pack = (Array.isArray(packs) ? packs : []).find(
      (p) => p && p.standard && p.standard.key === key
    );
    return pack && Array.isArray(pack.standard.versions) ? pack.standard.versions : [];
  };
  const at = (s) => {
    const known = versionsOf(s.standard);
    return known.includes(s.version) ? known.indexOf(s.version) : known.length;
  };
  return scopes.sort(
    (a, b) =>
      order.indexOf(a.standard) - order.indexOf(b.standard) ||
      at(a) - at(b) ||
      String(a.version).localeCompare(String(b.version), undefined, { numeric: true })
  );
}

/**
 * The facets left to a person, by requirement, in `locale`, for each
 * standard and version the scan judged the page by (one per profile of a
 * scan of several, where their standards or versions differ): a list, with
 * none for a standard whose procedures can't be read here (a browser
 * bundle, or a standard core has none for). Each text says the language it
 * is in (`lang`, `titleLang`, `labelLang`, `procedureLang`), so the report
 * marks what isn't in its own: a text a locale lacks, or a pack's standard
 * read in another language than the report's (docs/PACKS.md, "Languages").
 * A pack's titles are left to the standard's report.titleLang where its
 * standard declares no language.
 */
function leftToAPerson(result, { packs, locale, levels } = {}) {
  if (!procedures()) return [];
  return scopesOf(result, packs, levels)
    .map((scope) => leftFor(scope, { packs, locale }))
    .filter(Boolean);
}

// One standard's and version's, or null.
function leftFor(scope, { packs, locale }) {
  const mod = procedures();
  if (!mod) return null;
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
