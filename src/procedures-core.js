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

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

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

function facetOf(facet, entry, stem, rules, read, requirement) {
  const coveredBy = entry && typeof entry.coveredBy === 'string' ? entry.coveredBy : null;
  const procedure = coveredBy ? null : naming(read.procedure(stem), requirement);
  const tools = procedure && entry && Array.isArray(entry.tools) ? entry.tools : [];
  const out = { id: facet.id, label: facet.label, automation: facet.automation };
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
    title: info.title,
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
    title: 'Best practices',
    level: null,
    complete: isComplete(facets),
    rules: [...new Set(facets.flatMap((f) => f.rules))].sort(byId),
    facets
  };
}

// A pack's own facet: its procedure is in English, and no core rule claims
// it; the pack's rules that claim it (meta.coverage.facetsByRequirement) are
// its rules, and their codes filed under it its variants.
function packFacet(f, read, claims, requirement) {
  const procedure = naming(
    { steps: f.steps.slice(), passWhen: f.passWhen, failWhen: f.failWhen },
    requirement
  );
  return {
    id: f.id,
    label: f.label,
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
function replaced(facet, own, read, pack, requirement) {
  const tools = Array.isArray(own.tools)
    ? own.tools
        .filter((id) => TOOLS.includes(id))
        .map((id) => ({ id, label: read.text(`tool_${id}`) || id }))
    : facet.tools;
  const { variants, ...rest } = facet;
  return {
    ...rest,
    tools,
    procedure: naming(
      { steps: own.steps.slice(), passWhen: own.passWhen, failWhen: own.failWhen },
      requirement
    ),
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

// A requirement of a pack's standard (standard.procedures, by version): the
// first pack whose standard is `standard` (its key or name; any, when
// none is given) and has the requirement, in `version` or else the latest
// of its versions that has it.
function packRequirement(packs, id, standard, version, read, packRules) {
  for (const pack of Array.isArray(packs) ? packs : []) {
    const st = isObject(pack) && isObject(pack.standard) ? pack.standard : null;
    if (!st || !isObject(st.procedures)) continue;
    if (standard && standard !== st.key && standard !== st.standard) continue;
    const versions = (Array.isArray(st.versions) ? st.versions : []).slice().reverse();
    const v = version || versions.find((x) => isObject(st.procedures[x]) && st.procedures[x][id]);
    const entry = v && isObject(st.procedures[v]) ? st.procedures[v][id] : null;
    if (!isObject(entry)) continue;
    const head = {
      standard: st.standard,
      id,
      version: v,
      title: titleOf(st, v, id, entry),
      level: null
    };
    // What its procedures say it fails: the standard's name and the
    // requirement ('EN 301 549 9.1.4.3').
    const label = `${st.standard} ${id}`;
    if (typeof entry.wcag === 'string') {
      const criterion = wcagCriterion(entry.wcag, read, packRules, label);
      if (!criterion) return null;
      const replace = isObject(entry.replace) ? entry.replace : {};
      const facets = criterion.facets.map((f) =>
        hasOwn(replace, f.id) && !f.coveredBy ? replaced(f, replace[f.id], read, pack, label) : f
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
      packFacet(f, read, packClaims(packRules, id, f.id, true, read, pack), label)
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
  return packRequirement(opts.packs, id, standard, version, read, packRules);
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
// it, in order; a guideline or principle with none is left out.
function wcagGroups(ids) {
  const out = [];
  for (const principle of Object.keys(WCAG_PRINCIPLES)) {
    const guidelines = Object.keys(WCAG_GUIDELINES)
      .filter((g) => g.split('.')[0] === principle)
      .map((g) => ({
        id: g,
        title: WCAG_GUIDELINES[g],
        requirements: ids.filter((id) => id.split('.').slice(0, 2).join('.') === g),
        groups: []
      }))
      .filter((g) => g.requirements.length);
    if (guidelines.length) {
      out.push({
        id: principle,
        title: WCAG_PRINCIPLES[principle],
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
function packGroups(groups, ids) {
  const out = [];
  for (const g of Array.isArray(groups) ? groups : []) {
    if (!isObject(g)) continue;
    const requirements = listOf(g.requirements).filter((id) => ids.includes(id));
    const inner = packGroups(g.groups, ids);
    if (!requirements.length && !inner.length) continue;
    out.push({ id: String(g.id), title: g.title, requirements, groups: inner });
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
// work of listProceduresFrom and procedureChecklistFrom. null for a standard
// or version none of them has.
function listing(dictionaries, options) {
  const opts = isObject(options) ? options : {};
  const read = reader(withPackReview(dictionaries, opts.packs), opts.locale);
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
          return r && { ...r, title: c.title, level: c.level };
        })
        .filter(Boolean)
    );
    const ids = requirements.map((r) => r.id);
    return {
      head: { standard: 'wcag', version, ...shaped(levels) },
      requirements,
      groups: wcagGroups(ids),
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
  const requirements = keep(
    Object.keys(st.procedures[version])
      .sort(compareIds)
      .map((id) => packRequirement([pack], id, st.key, version, read, packRules))
      .filter(Boolean)
  );
  const ids = requirements.map((r) => r.id);
  const groups = isObject(st.groups) ? packGroups(st.groups[version], ids) : [];
  // What the standard says of itself for the version, for a page's header
  // (standard.notes, in English): its status, say, or how its results read.
  const notes = (isObject(st.notes) && Array.isArray(st.notes[version]) ? st.notes[version] : [])
    .filter((n) => typeof n === 'string' && n.trim())
    .map((n) => n.trim());
  return {
    head: {
      standard: st.standard,
      key: st.key,
      version,
      ...(notes.length ? { notes } : {}),
      ...shaped()
    },
    requirements,
    groups,
    read
  };
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
  proceduresFrom,
  relatedRequirements,
  renderProceduresFrom
};
