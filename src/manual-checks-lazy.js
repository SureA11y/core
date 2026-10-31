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
 * has none for). A text only English has is marked with lang 'en': the
 * same reading in English gives the same text.
 */
function leftToAPerson(result, { packs, locale, levels } = {}) {
  const mod = procedures();
  if (!mod) return null;
  const scope = scopeOf(result, packs, levels);
  const read = (l) =>
    mod.listProcedures({
      standard: scope.standard,
      version: scope.version,
      ...(scope.levels ? { levels: scope.levels } : {}),
      automation: LEFT_TO_A_PERSON,
      packs,
      locale: l
    });
  const list = read(locale);
  if (!list) return null;
  const english = locale && locale !== 'en' ? read('en') : list;
  const facetsIn = (r) => r.facets.filter((f) => !f.coveredBy && f.procedure);
  const enFacet = (r, f) => {
    const er = english.requirements.find((x) => x.id === r.id);
    return er ? er.facets.find((x) => x.id === f.id) : null;
  };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const requirements = list.requirements
    .map((r) => ({
      id: r.id,
      title: r.title,
      level: r.level,
      wcag: r.wcag || null,
      facets: facetsIn(r).map((f) => {
        const en = enFacet(r, f);
        return {
          id: f.id,
          label: f.label,
          automation: f.automation,
          procedure: f.procedure,
          procedureLang: en && same(en.procedure, f.procedure) ? 'en' : null,
          tools: f.tools.map((t) => {
            const enTool = en ? en.tools.find((x) => x.id === t.id) : null;
            return { label: t.label, lang: enTool && enTool.label === t.label ? 'en' : null };
          })
        };
      })
    }))
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
