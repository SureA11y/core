/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * How a person assesses a criterion by hand (docs/PROCEDURES.md), from the
 * procedures' dictionaries alone: no file system, so it runs wherever an app
 * does, in Node or in a browser bundle. src/procedures.js reads the
 * dictionaries from disk and calls this module: there is one implementation.
 *
 * For a WCAG criterion, or for the best practices, it gives each facet: its
 * label and automation, the core rules that claim it, its general procedure
 * and the tools that needs, and the variants under it, the steps a finding
 * of one of its rules shows (howToCheck). The structure is
 * src/procedures/registry.js and src/coverage/wcag-facets.js; the rules it
 * names are read from src/procedures/rules.json, which
 * scripts/generate-procedures.js makes from them.
 *
 * `dictionaries` is either an object keyed by locale ({ en, fr }) or a
 * function from a locale to its dictionary (or null), the dictionaries
 * published as @surea11y/core/procedures/<locale>. English is the fallback
 * for every key a locale lacks, and says how many steps a procedure has.
 */

const { PROCEDURES, TOOLS } = require('./procedures/registry.js');
const { FACETS } = require('./coverage/wcag-facets.js');
const { WCAG_PRINCIPLES, WCAG_GUIDELINES } = require('./coverage/wcag-guidelines.js');
const { WCAG_VERSIONS, wcagCriteria } = require('./wcag.js');
const RULES = require('./procedures/rules.json');
const {
  codesUnder,
  claimsOf,
  ownRulesOf,
  prefixOfKey,
  withPackReview
} = require('./pack-review.js');

const { reader } = require('./procedures-text.js');
const { dictionaryFor } = require('./procedures-text.js');
const { languagesOf, localeFor, translator } = require('./pack-languages.js');

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';
const same = (read) => read;

const byId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function variantsOf(entry, read) {
  const out = [];
  for (const ruleId of Object.keys((entry && entry.variants) || {})) {
    const rule = RULES[ruleId];
    for (const reasonCode of entry.variants[ruleId]) {
      const how =
        rule && rule.prefix ? read.procedure(`${rule.prefix}_review_${reasonCode}_`) : null;
      if (how) out.push({ ruleId, reasonCode, ...how });
    }
  }
  return out;
}

// The packs' own rules and variants, each with its prefix and the pack it
// is in, in the packs' order.
function packRulesOf(packs) {
  const out = [];
  for (const pack of Array.isArray(packs) ? packs : []) {
    for (const rule of ownRulesOf(pack)) {
      const meta = isObject(rule.meta) ? rule.meta : {};
      out.push({
        pack,
        rule,
        prefix: prefixOfKey(isObject(meta.i18n) ? meta.i18n.titleKey : null)
      });
    }
  }
  return out;
}

// The pack rules that claim a facet (of a WCAG criterion, or with
// requirement, of a requirement of `pack`'s standard), and the variants
// their codes filed under it give: exactly the howToCheck of their findings.
function packClaims(packRules, key, facetId, requirement, read, pack) {
  const rules = [];
  const variants = [];
  for (const { pack: own, rule, prefix } of packRules) {
    if (requirement && own !== pack) continue;
    const claimed = claimsOf(rule).some(
      (c) => c.key === key && c.facet === facetId && c.requirement === requirement
    );
    if (!claimed) continue;
    rules.push(rule.id);
    if (!prefix) continue;
    for (const reasonCode of codesUnder(rule, key, facetId, requirement)) {
      const how = read.procedure(`${prefix}_review_${reasonCode}_`);
      if (how) variants.push({ ruleId: rule.id, reasonCode, ...how });
    }
  }
  return { rules, variants };
}

// A general procedure names the requirement it is read under where its text
// says {{requirement}}: 'WCAG 1.4.3' read as the criterion, 'EN 301 549
// 9.1.4.3' read as a pack's requirement that restates it.
function naming(procedure, requirement) {
  if (!procedure || !requirement) return procedure;
  const fill = (text) => text.split('{{requirement}}').join(requirement);
  return {
    steps: procedure.steps.map(fill),
    passWhen: fill(procedure.passWhen),
    failWhen: fill(procedure.failWhen)
  };
}

// A criterion's title in the locale read, where `title` is the one the
// dictionaries translate (wcag-facets.js's, WCAG 2.2's): an earlier
// version's own title, such as 2.1's "Parsing" for 4.1.1, stays English.
function criterionTitle(criterion, title, read) {
  const info = FACETS[criterion];
  return (info && title === info.title && read.text(`wcag_${criterion}_title`)) || title;
}

function facetOf(facet, entry, stem, rules, read, requirement) {
  const coveredBy = entry && typeof entry.coveredBy === 'string' ? entry.coveredBy : null;
  const procedure = coveredBy ? null : naming(read.procedure(stem), requirement);
  const tools = procedure && entry && Array.isArray(entry.tools) ? entry.tools : [];
  const label = read.text(`${stem}label`) || facet.label;
  const out = { id: facet.id, label, automation: facet.automation };
  if (facet.macro) out.macro = true;
  out.rules = rules;
  out.tools = tools
    .filter((id) => TOOLS.includes(id))
    .map((id) => ({ id, label: read.text(`tool_${id}`) || id }));
  out.procedure = procedure;
  // A technology facet a broader facet's procedure assesses: that facet's id.
  if (coveredBy) out.coveredBy = coveredBy;
  out.variants = variantsOf(entry, read);
  return out;
}

// Every facet has a procedure, its own or the one of the facet it is
// covered by.
function isComplete(facets) {
  const has = new Set(facets.filter((f) => f.procedure !== null).map((f) => f.id));
  return facets.length > 0 && facets.every((f) => has.has(f.id) || has.has(f.coveredBy));
}

// A WCAG criterion's facets, with the packs' rules that claim them after
// core's, and their variants after core's; its general procedures name
// `requirement`, the criterion itself by default.
function wcagCriterion(criterion, read, packRules, requirement) {
  if (!hasOwn(FACETS, criterion)) return null;
  const info = FACETS[criterion];
  const registry = PROCEDURES.wcag[criterion] || {};
  const ruleIds = Object.keys(RULES).sort(byId);
  const facets = (info.facets || []).map((facet) => {
    const out = facetOf(
      facet,
      registry[facet.id],
      `wcag_${criterion}_${facet.id}_`,
      ruleIds.filter((r) => (RULES[r].facets[criterion] || []).includes(facet.id)),
      read,
      requirement || `WCAG ${criterion}`
    );
    const pack = packClaims(packRules, criterion, facet.id, false, read);
    out.rules = out.rules.concat(pack.rules.filter((r) => !out.rules.includes(r)));
    out.variants = out.variants.concat(pack.variants);
    return out;
  });
  const rules = ruleIds.filter((r) => RULES[r].criteria.includes(criterion));
  for (const { rule } of packRules) {
    const sc = isObject(rule.meta) ? rule.meta.wcagSc : null;
    if (Array.isArray(sc) && sc.includes(criterion) && !rules.includes(rule.id))
      rules.push(rule.id);
  }
  return {
    standard: 'wcag',
    id: criterion,
    title: criterionTitle(criterion, info.title, read),
    level: info.level,
    complete: isComplete(facets),
    rules,
    facets
  };
}

function bestPractices(read) {
  const facets = Object.entries(PROCEDURES['best-practice']).map(([id, entry]) =>
    facetOf(
      { id, label: entry.label, automation: entry.automation },
      entry,
      `best-practice_${id}_`,
      Object.keys(entry.variants || {}).sort(byId),
      read
    )
  );
  return {
    standard: 'best-practice',
    id: 'best-practice',
    // The page's name for them (render_*) is theirs too.
    title: read.text('render_standard_bestPractice') || 'Best practices',
    level: null,
    complete: isComplete(facets),
    rules: [...new Set(facets.flatMap((f) => f.rules))].sort(byId),
    facets
  };
}

// A pack's own facet: its procedure is in English, and no core rule claims
// it; the pack's rules that claim it (meta.coverage.facetsByRequirement) are
// its rules, and their codes filed under it its variants.
function packFacet(f, read, claims, requirement, tr) {
  // Its label and procedure, translated as a whole or not at all.
  const { texts, lang } = tr.all([f.label, ...f.steps, f.passWhen, f.failWhen]);
  const steps = texts.slice(1, -2);
  const procedure = naming(
    { steps, passWhen: texts[texts.length - 2], failWhen: texts[texts.length - 1] },
    requirement
  );
  return {
    id: f.id,
    label: texts[0],
    ...(tr.declared ? { lang } : {}),
    automation: f.automation || 'manual',
    rules: claims.rules,
    tools: (Array.isArray(f.tools) ? f.tools : [])
      .filter((id) => TOOLS.includes(id))
      .map((id) => ({ id, label: read.text(`tool_${id}`) || id })),
    procedure,
    variants: claims.variants
  };
}

// A WCAG facet whose general procedure a pack's requirement replaces
// (standard.procedures, replace): the pack's, in English, with its tools, or
// the facet's where it names none, and procedureFrom the pack's name. Its
// rules and variants stay: a finding still shows its own steps.
function replaced(facet, own, read, pack, requirement, tr) {
  const tools = Array.isArray(own.tools)
    ? own.tools
        .filter((id) => TOOLS.includes(id))
        .map((id) => ({ id, label: read.text(`tool_${id}`) || id }))
    : facet.tools;
  const { variants, ...rest } = facet;
  const { texts, lang } = tr.all([...own.steps, own.passWhen, own.failWhen]);
  return {
    ...rest,
    tools,
    procedure: naming(
      {
        steps: texts.slice(0, -2),
        passWhen: texts[texts.length - 2],
        failWhen: texts[texts.length - 1]
      },
      requirement
    ),
    ...(tr.declared ? { procedureLang: lang } : {}),
    procedureFrom: pack.name,
    variants
  };
}

// A requirement's title where its entry in standard.procedures gives none:
// the one the standard's rollups (standard.composites()) name it by, in
// their meta.standardMappings, for this standard, version and requirement.
// null where none does (no rule checks it, or the standard writes no
// rollups), or where two name it differently. Read once per standard.
const MAPPED_TITLES = new WeakMap();
function mappedTitle(st, version, id) {
  let titles = MAPPED_TITLES.get(st);
  if (!titles) {
    titles = new Map();
    let rollups;
    try {
      rollups = typeof st.composites === 'function' ? st.composites() : [];
    } catch {
      rollups = [];
    }
    for (const r of Array.isArray(rollups) ? rollups : []) {
      const mappings = isObject(r) && isObject(r.meta) ? r.meta.standardMappings : null;
      for (const m of Array.isArray(mappings) ? mappings : []) {
        if (!isObject(m) || m.standard !== st.standard) continue;
        if (typeof m.version !== 'string' || typeof m.requirement !== 'string') continue;
        if (typeof m.title !== 'string' || !m.title.trim()) continue;
        const key = `${m.version}\u0000${m.requirement}`;
        titles.set(key, titles.has(key) && titles.get(key) !== m.title ? null : m.title);
      }
    }
    MAPPED_TITLES.set(st, titles);
  }
  return titles.get(`${version}\u0000${id}`) || null;
}

// A requirement's title: its entry's, or else the one its rollups give.
const titleOf = (st, version, id, entry) =>
  typeof entry.title === 'string' ? entry.title : mappedTitle(st, version, id);

// How a pack's standard is read, asked for `locales`. Where it declares its
// languages (standard.lang or standard.translations), in one language, the
// first of `locales` it has or else its own: its text, translated or as
// written, and core's it uses, read in that locale. Where it declares none,
// as it always was: its text as written, in English, and core's in
// `locales`. { read, tr, locale }, once per standard; `wrap` takes each
// reader made (procedureLanguagesFrom notes what they read).
function readingFor(dictionaries, packs, locales, wrap = same) {
  const cache = new Map();
  return (st) => {
    if (!cache.has(st)) {
      const declared = st.lang !== undefined || st.translations !== undefined;
      const locale = declared ? localeFor(st, locales) : null;
      cache.set(st, {
        read: wrap(reader(withPackReview(dictionaries, packs), declared ? locale : locales)),
        tr: { ...translator(st, locale), declared },
        locale
      });
    }
    return cache.get(st);
  };
}

// A requirement of a pack's standard (standard.procedures, by version): the
// first pack whose standard is `standard` (its key or name; any, when
// none is given) and has the requirement, in `version` or else the latest
// of its versions that has it.
function packRequirement(packs, id, standard, version, readingOf, packRules) {
  for (const pack of Array.isArray(packs) ? packs : []) {
    const st = isObject(pack) && isObject(pack.standard) ? pack.standard : null;
    if (!st || !isObject(st.procedures)) continue;
    if (standard && standard !== st.key && standard !== st.standard) continue;
    const { read, tr } = readingOf(st);
    const versions = (Array.isArray(st.versions) ? st.versions : []).slice().reverse();
    const v = version || versions.find((x) => isObject(st.procedures[x]) && st.procedures[x][id]);
    const entry = v && isObject(st.procedures[v]) ? st.procedures[v][id] : null;
    if (!isObject(entry)) continue;
    // Its title, and what the standard's procedures say of it, in the
    // standard's language or translated.
    const title = titleOf(st, v, id, entry);
    const t = typeof title === 'string' ? tr.text(title) : null;
    const n = typeof entry.note === 'string' && entry.note.trim() ? tr.text(entry.note) : null;
    const head = {
      standard: st.standard,
      id,
      version: v,
      title: t ? t.text : title,
      ...(t && tr.declared ? { titleLang: t.lang } : {}),
      level: null,
      ...(n ? { note: n.text.trim(), ...(tr.declared ? { noteLang: n.lang } : {}) } : {})
    };
    // A requirement with only a note, such as a void clause: nothing to assess.
    if (typeof entry.wcag !== 'string' && !Array.isArray(entry.facets)) {
      return head.note ? { ...head, complete: true, rules: [], facets: [] } : null;
    }
    // What its procedures say it fails: the standard's name and the
    // requirement ('EN 301 549 9.1.4.3').
    const label = `${st.standard} ${id}`;
    if (typeof entry.wcag === 'string') {
      const criterion = wcagCriterion(entry.wcag, read, packRules, label);
      if (!criterion) return null;
      const replace = isObject(entry.replace) ? entry.replace : {};
      const facets = criterion.facets.map((f) =>
        hasOwn(replace, f.id) && !f.coveredBy
          ? replaced(f, replace[f.id], read, pack, label, tr)
          : f
      );
      return {
        ...head,
        wcag: entry.wcag,
        complete: isComplete(facets),
        rules: criterion.rules,
        facets
      };
    }
    const facets = (Array.isArray(entry.facets) ? entry.facets : []).map((f) =>
      packFacet(f, read, packClaims(packRules, id, f.id, true, read, pack), label, tr)
    );
    const rules = [];
    for (const f of facets) for (const r of f.rules) if (!rules.includes(r)) rules.push(r);
    // The WCAG criteria it relates to without restating any.
    const relatesTo = Array.isArray(entry.relatesTo) ? { relatesTo: entry.relatesTo.slice() } : {};
    return { ...head, ...relatesTo, complete: facets.length > 0, rules, facets };
  }
  return null;
}

/**
 * How a person assesses a requirement by hand: a WCAG 2.2 criterion
 * ('1.4.13'), 'best-practice' for what no criterion requires, or, with
 * `options.packs`, a requirement of a pack's standard ('9.1.4.3', with
 * `options.standard` its key or name and `options.version` one of its
 * versions, the latest by default), with each of its facets, in
 * `options.locale` (a tag, or a list of tags, most wanted first; English is
 * the fallback for every text a locale lacks, and a pack's own text is in
 * English). null for a requirement none of them knows. See
 * docs/PROCEDURES.md for the shape.
 */
function proceduresFrom(dictionaries, requirement, options) {
  if (typeof requirement !== 'string' || !requirement.trim()) return null;
  const id = requirement.trim();
  const opts = isObject(options) ? options : {};
  // A pack rule's steps read as its findings' howToCheck does.
  const read = reader(withPackReview(dictionaries, opts.packs), opts.locale);
  const packRules = packRulesOf(opts.packs);
  const standard = typeof opts.standard === 'string' && opts.standard ? opts.standard : null;
  const core = !standard || standard === 'wcag' || standard === 'WCAG';
  if (core || standard === 'best-practice') {
    const found = id === 'best-practice' ? bestPractices(read) : wcagCriterion(id, read, packRules);
    if (found || standard) return found;
  }
  const version = typeof opts.version === 'string' && opts.version ? opts.version : null;
  const readingOf = readingFor(dictionaries, opts.packs, opts.locale);
  return packRequirement(opts.packs, id, standard, version, readingOf, packRules);
}

// Requirement ids in a standard's order: their dot-separated parts compared
// as numbers where both are ('1.10' after '1.9'), as text otherwise.
function compareIds(a, b) {
  const pa = String(a).split('.');
  const pb = String(b).split('.');
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if (pa[i] === undefined) return -1;
    if (pb[i] === undefined) return 1;
    const na = /^\d+$/.test(pa[i]) ? Number(pa[i]) : NaN;
    const nb = /^\d+$/.test(pb[i]) ? Number(pb[i]) : NaN;
    const d = !isNaN(na) && !isNaN(nb) ? na - nb : byId(pa[i], pb[i]);
    if (d) return d;
  }
  return 0;
}

const listOf = (v) =>
  (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]).filter(
    (x) => typeof x === 'string' && x
  );

// The packs' standards that give procedures: [{ pack, st }], those whose key
// or name is `standard` when it is given.
function packStandards(packs, standard) {
  const out = [];
  for (const pack of Array.isArray(packs) ? packs : []) {
    const st = isObject(pack) && isObject(pack.standard) ? pack.standard : null;
    if (!st || !isObject(st.procedures)) continue;
    if (standard && standard !== st.key && standard !== st.standard) continue;
    out.push({ pack, st });
  }
  return out;
}

// The latest of a standard's versions that gives procedures, or `version`
// where it does; null otherwise.
function versionOf(st, version) {
  const has = (v) => isObject(st.procedures[v]);
  if (version) return has(version) ? version : null;
  const versions = (Array.isArray(st.versions) ? st.versions : []).slice().reverse();
  return versions.find(has) || null;
}

// WCAG's principles and guidelines, each with the criteria of `ids` under
// it, in order, titled in the locale read; a guideline or principle with
// none is left out.
function wcagGroups(ids, read) {
  const out = [];
  for (const principle of Object.keys(WCAG_PRINCIPLES)) {
    const guidelines = Object.keys(WCAG_GUIDELINES)
      .filter((g) => g.split('.')[0] === principle)
      .map((g) => ({
        id: g,
        title: read.text(`wcag_guideline_${g}`) || WCAG_GUIDELINES[g],
        requirements: ids.filter((id) => id.split('.').slice(0, 2).join('.') === g),
        groups: []
      }))
      .filter((g) => g.requirements.length);
    if (guidelines.length) {
      out.push({
        id: principle,
        title: read.text(`wcag_principle_${principle}`) || WCAG_PRINCIPLES[principle],
        requirements: [],
        groups: guidelines
      });
    }
  }
  return out;
}

// A pack's groups for a version (standard.groups), with only the
// requirements of `ids` in each; a group left with none, and no group under
// it with any, is left out.
function packGroups(groups, ids, tr) {
  const out = [];
  for (const g of Array.isArray(groups) ? groups : []) {
    if (!isObject(g)) continue;
    const requirements = listOf(g.requirements).filter((id) => ids.includes(id));
    const inner = packGroups(g.groups, ids, tr);
    if (!requirements.length && !inner.length) continue;
    const t = tr.text(g.title);
    out.push({
      id: String(g.id),
      title: t.text,
      ...(tr.declared ? { titleLang: t.lang } : {}),
      requirements,
      groups: inner
    });
  }
  return out;
}

// The filters a list or checklist takes: tools, automation and rules, each
// one value or a list of them, null where not given.
function filtersOf(opts) {
  const f = {};
  for (const key of ['tools', 'automation', 'rules']) {
    const values = listOf(opts[key]);
    f[key] = opts[key] === undefined ? null : values;
  }
  return f;
}

const filtering = (f) => f.tools !== null || f.automation !== null || f.rules !== null;

// A requirement with only the facets that match every filter given (any of
// its values): a technology facet by its coveredBy facet's tools, and
// keeping that facet, whose procedure assesses it. null where none match.
function filtered(requirement, f) {
  if (!filtering(f)) return requirement;
  const facets = new Map(requirement.facets.map((x) => [x.id, x]));
  const toolsOf = (x) =>
    (x.coveredBy && facets.has(x.coveredBy) ? facets.get(x.coveredBy) : x).tools.map((t) => t.id);
  const matches = (x) =>
    (f.tools === null || toolsOf(x).some((t) => f.tools.includes(t))) &&
    (f.automation === null || f.automation.includes(x.automation)) &&
    (f.rules === null || x.rules.some((r) => f.rules.includes(r)));
  const keep = new Set();
  for (const x of requirement.facets) {
    if (!matches(x)) continue;
    keep.add(x.id);
    if (x.coveredBy) keep.add(x.coveredBy);
  }
  if (!keep.size) return null;
  return { ...requirement, facets: requirement.facets.filter((x) => keep.has(x.id)) };
}

// Every requirement of a standard, in its order, and its groups: the shared
// work of listProceduresFrom, procedureChecklistFrom and
// procedureLanguagesFrom, whose `wrap` takes each reader made. null for a
// standard or version none of them has.
function listing(dictionaries, options, wrap = same) {
  const opts = isObject(options) ? options : {};
  const read = wrap(reader(withPackReview(dictionaries, opts.packs), opts.locale));
  const packRules = packRulesOf(opts.packs);
  const standard = typeof opts.standard === 'string' && opts.standard ? opts.standard : 'wcag';
  const asked = typeof opts.version === 'string' && opts.version ? opts.version : null;
  const f = filtersOf(opts);
  const keep = (list) => list.map((r) => filtered(r, f)).filter(Boolean);
  // What shaped the list, so a page made from it can say so: the locale its
  // text was read in, the WCAG levels asked for and the filters.
  const shaped = (levels) => ({
    locale: read.locale,
    scope: { levels: levels || null, tools: f.tools, automation: f.automation, rules: f.rules }
  });

  if (standard === 'wcag' || standard === 'WCAG') {
    const version = asked || WCAG_VERSIONS[WCAG_VERSIONS.length - 1];
    if (!WCAG_VERSIONS.includes(version)) return null;
    const levels = opts.levels === undefined ? undefined : listOf(opts.levels);
    const requirements = keep(
      wcagCriteria(version, { levels })
        .map((c) => {
          const r = wcagCriterion(c.sc, read, packRules);
          return r && { ...r, title: criterionTitle(c.sc, c.title, read), level: c.level };
        })
        .filter(Boolean)
    );
    const ids = requirements.map((r) => r.id);
    return {
      head: { standard: 'wcag', version, ...shaped(levels) },
      requirements,
      groups: wcagGroups(ids, read),
      read
    };
  }
  if (standard === 'best-practice') {
    const requirements = keep([bestPractices(read)]);
    return {
      head: { standard: 'best-practice', version: null, ...shaped() },
      requirements,
      groups: [],
      read
    };
  }
  const [found] = packStandards(opts.packs, standard);
  if (!found) return null;
  const { pack, st } = found;
  const version = versionOf(st, asked);
  if (!version) return null;
  // The standard in its one language, where it declares its languages.
  const reading = readingFor(dictionaries, opts.packs, opts.locale, wrap)(st);
  const requirements = keep(
    Object.keys(st.procedures[version])
      .sort(compareIds)
      .map((id) => packRequirement([pack], id, st.key, version, () => reading, packRules))
      .filter(Boolean)
  );
  const ids = requirements.map((r) => r.id);
  const groups = isObject(st.groups) ? packGroups(st.groups[version], ids, reading.tr) : [];
  // What the standard says of itself for the version, for a page's header
  // (standard.notes): its status, say, or how its results read. Translated
  // as a whole or not at all.
  const given = (isObject(st.notes) && Array.isArray(st.notes[version]) ? st.notes[version] : [])
    .filter((n) => typeof n === 'string' && n.trim())
    .map((n) => n.trim());
  const notes = given.length ? reading.tr.all(given) : null;
  const head = {
    standard: st.standard,
    key: st.key,
    version,
    ...(notes ? { notes: notes.texts } : {}),
    ...(notes && reading.tr.declared ? { notesLang: notes.lang } : {}),
    ...shaped()
  };
  // A standard read in one language says which.
  if (reading.locale) head.locale = reading.locale;
  return { head, requirements, groups, read: reading.read };
}

/**
 * Every requirement of a standard, as proceduresFrom gives each, in the
 * standard's order, and the groups it puts them in (docs/PROCEDURES.md):
 * WCAG's criteria (options.standard 'wcag', the default) in options.version
 * (the latest by default) at options.levels (all by default), under their
 * principles and guidelines; the best practices; or, with options.packs, a
 * pack's standard by key or name, in options.version (the latest that gives
 * procedures by default), under the groups it gives. options.tools,
 * options.automation and options.rules keep only the facets that match, and
 * the requirements left with any. null for a standard or version none of
 * them has.
 */
function listProceduresFrom(dictionaries, options) {
  const found = listing(dictionaries, options);
  if (!found) return null;
  return { ...found.head, requirements: found.requirements, groups: found.groups };
}

/**
 * What a person does to assess a standard by hand, once each: one item per
 * general procedure of the requirements listProceduresFrom gives (a facet
 * with coveredBy is not one: it is listed in `covers` of the facet that
 * assesses it), with the requirements it serves. Facets of the same WCAG
 * criterion that several of a pack's requirements restate are one item, and
 * its text names each of them.
 */
function procedureChecklistFrom(dictionaries, options) {
  const found = listing(dictionaries, options);
  if (!found) return null;
  const { head, requirements, groups, read } = found;
  const items = new Map();
  for (const r of requirements) {
    const criterion = r.standard === 'wcag' ? r.id : r.wcag || null;
    for (const facet of r.facets) {
      if (facet.coveredBy || !facet.procedure) continue;
      // Core's procedure for a WCAG facet is the same whichever requirement
      // reads it; a pack's own or replaced one belongs to its requirement.
      const own = !criterion || facet.procedureFrom;
      const key = own ? `${r.id}/${facet.id}` : `${criterion}/${facet.id}`;
      const covered = r.facets.filter((x) => x.coveredBy === facet.id);
      let item = items.get(key);
      if (!item) {
        item = {
          key,
          facet: facet.id,
          label: facet.label,
          automation: facet.automation,
          wcag: criterion,
          requirements: [],
          covers: [],
          rules: [],
          tools: facet.tools,
          procedure: facet.procedure
        };
        if (facet.procedureFrom) item.procedureFrom = facet.procedureFrom;
        // The language of a pack's own text, where its standard declares it.
        if (facet.lang) item.lang = facet.lang;
        if (facet.procedureLang) item.procedureLang = facet.procedureLang;
        items.set(key, item);
      }
      if (!item.requirements.includes(r.id)) item.requirements.push(r.id);
      for (const x of covered) if (!item.covers.includes(x.id)) item.covers.push(x.id);
      for (const id of [facet, ...covered].flatMap((x) => x.rules)) {
        if (!item.rules.includes(id)) item.rules.push(id);
      }
    }
  }
  // An item several requirements share names them all.
  for (const item of items.values()) {
    if (item.requirements.length < 2 || item.procedureFrom || !item.wcag) continue;
    const name = `${head.standard} ${item.requirements.join(', ')}`;
    item.procedure = naming(read.procedure(`wcag_${item.wcag}_${item.facet}_`), name);
  }
  return { ...head, items: [...items.values()], groups };
}

// A reader that notes each key whose text it gives, with itself, so the
// locale that text comes from can be asked of it after.
function noting(read, seen) {
  const note = (key) => seen.push([read, key]);
  return {
    ...read,
    text(key) {
      note(key);
      return read.text(key);
    },
    procedure(stem) {
      const p = read.procedure(stem);
      if (p) {
        p.steps.forEach((_, i) => note(`${stem}step${i + 1}`));
        note(`${stem}pass`);
        note(`${stem}fail`);
      }
      return p;
    }
  };
}

// The locales the dictionaries hold, lower case: those of options.locales
// where it is given (a function's dictionaries can't be listed), the keys
// of an object's otherwise; and those the packs' dictionaries give.
function dictionaryLocales(dictionaries, opts) {
  const out = [];
  const add = (tag) => {
    const l = typeof tag === 'string' ? tag.trim().toLowerCase() : '';
    if (l && !out.includes(l)) out.push(l);
  };
  if (opts.locales !== undefined) listOf(opts.locales).forEach(add);
  else if (isObject(dictionaries)) Object.keys(dictionaries).forEach(add);
  for (const pack of Array.isArray(opts.packs) ? opts.packs : []) {
    if (isObject(pack) && isObject(pack.dictionaries)) Object.keys(pack.dictionaries).forEach(add);
  }
  return out;
}

// A pack's standard's own texts for a version, as they are shown, each
// unit in one language or the other as a whole: its requirements' titles
// and notes, its own facets and replacements, its groups' titles, its notes
// and the titles of its rollups for the version. `title` marks the titles,
// which report.titleLang says the language of where it declares none.
function ownUnits(st, version) {
  const units = [];
  const add = (texts, title) => {
    if (texts.length && texts.every(isText)) units.push({ texts, title });
  };
  const procedure = (p) =>
    isObject(p) ? [...(Array.isArray(p.steps) ? p.steps : []), p.passWhen, p.failWhen] : [];
  const entries = st.procedures[version];
  for (const id of Object.keys(entries)) {
    const entry = entries[id];
    if (!isObject(entry)) continue;
    const title = titleOf(st, version, id, entry);
    if (isText(title)) add([title], true);
    if (isText(entry.note)) add([entry.note], false);
    if (typeof entry.wcag === 'string') {
      for (const own of Object.values(isObject(entry.replace) ? entry.replace : {})) {
        add(procedure(own), false);
      }
    } else {
      for (const f of Array.isArray(entry.facets) ? entry.facets : []) {
        if (isObject(f)) add([f.label, ...procedure(f)], false);
      }
    }
  }
  const walk = (groups) => {
    for (const g of Array.isArray(groups) ? groups : []) {
      if (!isObject(g)) continue;
      add([g.title], true);
      walk(g.groups);
    }
  };
  walk(isObject(st.groups) ? st.groups[version] : null);
  const notes = (isObject(st.notes) && Array.isArray(st.notes[version]) ? st.notes[version] : [])
    .filter(isText)
    .map((n) => n.trim());
  add(notes, false);
  let rollups;
  try {
    rollups = typeof st.composites === 'function' ? st.composites() : [];
  } catch {
    rollups = [];
  }
  for (const r of Array.isArray(rollups) ? rollups : []) {
    const meta = isObject(r) && isObject(r.meta) ? r.meta : null;
    if (!meta || !isText(meta.title)) continue;
    const versions = (Array.isArray(meta.standardMappings) ? meta.standardMappings : [])
      .filter((m) => isObject(m) && m.standard === st.standard && typeof m.version === 'string')
      .map((m) => m.version);
    if (!versions.length || versions.includes(version)) add([meta.title], true);
  }
  return units;
}

// The own texts of a pack's standard shown in another language than
// `locale`, for a version.
function ownMissing(st, version, locale) {
  const declared = st.lang !== undefined || st.translations !== undefined;
  const tr = translator(st, locale);
  const titleLang =
    isObject(st.report) && isText(st.report.titleLang)
      ? st.report.titleLang.trim().toLowerCase()
      : 'en';
  const missing = new Set();
  for (const { texts, title } of ownUnits(st, version)) {
    const lang = declared ? tr.all(texts).lang : title ? titleLang : 'en';
    if (lang !== locale) texts.forEach((t) => missing.add(t));
  }
  return missing.size;
}

/**
 * The languages a standard's procedures can be read in, its own first
 * (docs/PROCEDURES.md#their-languages): [{ locale, complete, missing }],
 * exactly the locales listProceduresFrom honours for it, so asked for one
 * it gives that `locale`. complete where everything of the standard and
 * version is in that locale: core's procedures and tools' names, the page's
 * words (render_*) and a pack's standard's own text; missing counts the
 * texts that would be shown in another language. WCAG and the best
 * practices, and a pack's standard that declares no languages, can be read
 * in each locale the dictionaries hold (options.locales, where they are a
 * function); a pack's standard that declares its languages in those, as
 * docs/PACKS.md, "Languages", says. Takes listProceduresFrom's standard,
 * version and packs; null for a standard or version none of them has.
 */
function procedureLanguagesFrom(dictionaries, options) {
  const opts = isObject(options) ? options : {};
  const base = {
    standard: typeof opts.standard === 'string' && opts.standard ? opts.standard : 'wcag',
    version: opts.version,
    packs: opts.packs
  };
  const english = listing(dictionaries, { ...base, locale: 'en' });
  if (!english) return null;
  const { head } = english;
  const core = head.standard === 'wcag' || head.standard === 'best-practice';
  const [match] = core ? [] : packStandards(opts.packs, base.standard);
  const st = match ? match.st : null;
  const declared = !!st && (st.lang !== undefined || st.translations !== undefined);
  // Its own language first: the standard's, or English.
  const own = declared ? languagesOf(st)[0] : 'en';
  const candidates = declared ? languagesOf(st) : dictionaryLocales(dictionaries, opts);
  const locales = [own].concat(candidates.filter((l) => l !== own).sort(byId));
  const renderKeys = Object.keys(dictionaryFor(dictionaries, 'en') || {}).filter((k) =>
    k.startsWith('render_')
  );
  const out = [];
  for (const locale of locales) {
    const seen = [];
    const found = listing(dictionaries, { ...base, locale }, (read) => noting(read, seen));
    // Only a locale it is read in: one asked for that it would read in
    // another is no choice.
    if (!found || found.head.locale !== locale) continue;
    const missing = new Set();
    const langOf = (read, key) => read.localeOf(key) || 'en';
    for (const [read, key] of seen) if (langOf(read, key) !== locale) missing.add(key);
    for (const key of renderKeys) if (langOf(found.read, key) !== locale) missing.add(key);
    let count = missing.size;
    // An earlier WCAG version's own title, such as 2.1's "Parsing" for
    // 4.1.1, stays English.
    if (head.standard === 'wcag' && locale !== 'en') {
      count += wcagCriteria(head.version).filter(
        (c) => hasOwn(FACETS, c.sc) && FACETS[c.sc].title !== c.title
      ).length;
    }
    if (st) count += ownMissing(st, head.version, locale);
    out.push({ locale, complete: count === 0, missing: count });
  }
  return out;
}

/**
 * The requirements related to one, across WCAG and the packs' standards
 * (docs/PROCEDURES.md): for a WCAG criterion, each requirement of a pack's
 * standard that restates it (relation 'restates') or relates to it
 * ('relatesTo'), in the latest version of each standard that gives
 * procedures, or options.version with options.standard; for a pack's
 * requirement (options.standard, options.version), the WCAG criteria it
 * restates or relates to. Empty where there are none.
 */
function relatedRequirements(requirement, options) {
  if (typeof requirement !== 'string' || !requirement.trim()) return [];
  const id = requirement.trim();
  const opts = isObject(options) ? options : {};
  const standard = typeof opts.standard === 'string' && opts.standard ? opts.standard : null;
  const asked = typeof opts.version === 'string' && opts.version ? opts.version : null;
  const relationOf = (entry, sc) =>
    entry.wcag === sc ? 'restates' : listOf(entry.relatesTo).includes(sc) ? 'relatesTo' : null;

  if (!standard || standard === 'wcag' || standard === 'WCAG') {
    if (!hasOwn(FACETS, id)) return [];
    const out = [];
    for (const { st } of packStandards(opts.packs, null)) {
      const version = versionOf(st, null);
      if (!version) continue;
      const entries = st.procedures[version];
      for (const rid of Object.keys(entries).sort(compareIds)) {
        const entry = entries[rid];
        const relation = isObject(entry) ? relationOf(entry, id) : null;
        if (!relation) continue;
        out.push({
          standard: st.standard,
          key: st.key,
          id: rid,
          version,
          title: titleOf(st, version, rid, entry),
          relation
        });
      }
    }
    return out;
  }
  for (const { st } of packStandards(opts.packs, standard)) {
    const versions = (Array.isArray(st.versions) ? st.versions : []).slice().reverse();
    const version =
      asked || versions.find((v) => isObject(st.procedures[v]) && isObject(st.procedures[v][id]));
    const entry = version && isObject(st.procedures[version]) ? st.procedures[version][id] : null;
    if (!isObject(entry)) continue;
    const criteria = typeof entry.wcag === 'string' ? [entry.wcag] : listOf(entry.relatesTo);
    return criteria
      .filter((sc) => hasOwn(FACETS, sc))
      .map((sc) => ({
        standard: 'wcag',
        id: sc,
        title: FACETS[sc].title,
        level: FACETS[sc].level,
        relation: relationOf(entry, sc)
      }));
  }
  return [];
}

// Procedures as a document, HTML or Markdown (src/procedures-render.js).
const { renderProceduresFrom } = require('./procedures-render.js');

module.exports = {
  listProceduresFrom,
  procedureChecklistFrom,
  procedureLanguagesFrom,
  proceduresFrom,
  relatedRequirements,
  renderProceduresFrom
};
