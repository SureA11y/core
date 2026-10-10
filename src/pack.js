/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Packs: rules, variants of core's rules, a standard and dictionaries that
 * come from outside core, passed to a scan as engineOptions.packs. A pack is a
 * plain object (definePack documents and checks its shape); a scan with packs
 * runs on an engine of its own, over core's catalog with the packs' added,
 * prepared by the same steps the build uses (src/core/prepare-catalog.js) and
 * kept for the next scan with the same packs.
 *
 *   const { definePack } = require('@surea11y/core/pack');
 *   module.exports = definePack({
 *     name: '@acme/a11y-rules',
 *     version: '1.2.0',
 *     namespace: 'acme',          // every rule id starts with 'acme-'
 *     core: '^1.11.0',            // the core versions it works with
 *     rules: [...],               // rule modules, as core's (a `from` makes a variant)
 *     standard: {...},            // a registry entry (src/coverage/standards.js)
 *     dictionaries: { en: {...}, fr: {...} }
 *   });
 */

const core = require('./core.js');
const { version: CORE_VERSION } = require('../package.json');
const { NORMATIVE_STANDARDS, createRegistry } = require('./coverage/standards.js');
const {
  prepareStandards,
  prepareRules,
  prepareComposites,
  prepareProfiles,
  optInOwnership,
  catalogHelpUrl,
  catalogData,
  toCheckDefs,
  validateCompositeMembers,
  mergeDictionaries
} = require('./core/prepare-catalog.js');
const { ruleMappedStandard } = require('./profile-kit.js');
const { wcagTags, WCAG_CRITERIA } = require('./wcag.js');

const PACK_KEYS = [
  'name',
  'version',
  'namespace',
  'core',
  'title',
  'description',
  'rules',
  'variants',
  'overrides',
  'standard',
  'profiles',
  'rollups',
  'probes',
  'dictionaries'
];

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// What a pack's names and ids may be. Ids are core's shape: lowercase letters
// and digits in parts joined by "-", dots allowed within a part (sample-1.0);
// a rollup id may keep the capitals of its requirement's number (S1, A.1).
const ID = /^[a-z0-9]+(\.[a-z0-9]+)*(-[a-z0-9]+(\.[a-z0-9]+)*)*$/;
const ROLLUP_ID = /^[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(-[A-Za-z0-9]+(\.[A-Za-z0-9]+)*)*$/;
// npm's rules for a package name: lowercase, a scope or none, no spaces.
const PACKAGE_NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
// A whole version, as npm writes one: 1.0.0, 1.0.0-rc.1, 1.0.0+build.5.
const WHOLE_VERSION =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
const WCAG_SC = new Set(WCAG_CRITERIA.map((c) => c.sc));

// --- core versions ------------------------------------------------------------

// Versions and ranges as npm reads them (node-semver, without its loose or
// includePrerelease options), so a pack's `core` means what it means in its
// package.json. One difference: an empty range, or an empty alternative of
// one ("^1.0.0 ||"), which npm reads as any version, is no range here.
const NUMERIC = '0|[1-9]\\d*';
const PRE_ID = `(?:${NUMERIC}|\\d*[A-Za-z-][0-9A-Za-z-]*)`;
const PRERELEASE = `(?:-(${PRE_ID}(?:\\.${PRE_ID})*))`;
const BUILD = '(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)';
const VERSION = new RegExp(`^v?(${NUMERIC})\\.(${NUMERIC})\\.(${NUMERIC})${PRERELEASE}?${BUILD}?$`);
const X_ID = `(?:x|X|\\*|${NUMERIC})`;
const PARTIAL = new RegExp(
  `^[v=]*(${X_ID})(?:\\.(${X_ID})(?:\\.(${X_ID})${PRERELEASE}?${BUILD}?)?)?$`
);
const WHOLE = /^v?\d/;
const BUILD_ANYWHERE = new RegExp(BUILD, 'g');
const OPERATORS = ['<=', '>=', '<', '>', '=', '~>', '~', '^'];

// [major, minor, patch, prerelease ids], or null.
function parseVersion(v) {
  const m = VERSION.exec(String(v).trim());
  if (!m) return null;
  const nums = [m[1], m[2], m[3]].map(Number);
  if (nums.some((n) => n > Number.MAX_SAFE_INTEGER)) return null;
  return [...nums, m[4] ? m[4].split('.') : []];
}

function comparePrerelease(a, b) {
  if (!a.length || !b.length) return a.length ? -1 : b.length ? 1 : 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i >= a.length) return -1;
    if (i >= b.length) return 1;
    const x = a[i];
    const y = b[i];
    if (x === y) continue;
    const xn = /^\d+$/.test(x);
    const yn = /^\d+$/.test(y);
    if (xn && yn) return Number(x) < Number(y) ? -1 : 1;
    if (xn !== yn) return xn ? -1 : 1;
    return x < y ? -1 : 1;
  }
  return 0;
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  return comparePrerelease(a[3], b[3]);
}

const isX = (id) => id === undefined || id === 'x' || id === 'X' || id === '*';
const ANY = { any: true };
const NOTHING = { op: '<', v: [0, 0, 0, ['0']] };
const at = (op, M, m, p, pre = []) => ({ op, v: [Number(M), Number(m), Number(p), pre] });
const preOf = (s) => (s ? s.split('.') : []);

// The comparators one partial version with an operator stands for, or null.
function desugar(op, text) {
  const m = PARTIAL.exec(text);
  if (!m) return null;
  const [, M, mi, p, pr] = m;
  const xM = isX(M);
  const xm = xM || isX(mi);
  const xp = xm || isX(p);
  const up = (n) => Number(n) + 1;
  if (op === '^') {
    if (xM) return [ANY];
    if (xm) return [at('>=', M, 0, 0), at('<', up(M), 0, 0, ['0'])];
    if (xp) {
      return M === '0'
        ? [at('>=', M, mi, 0), at('<', M, up(mi), 0, ['0'])]
        : [at('>=', M, mi, 0), at('<', up(M), 0, 0, ['0'])];
    }
    const low = at('>=', M, mi, p, preOf(pr));
    if (M !== '0') return [low, at('<', up(M), 0, 0, ['0'])];
    if (mi !== '0') return [low, at('<', M, up(mi), 0, ['0'])];
    return [low, at('<', M, mi, up(p), ['0'])];
  }
  if (op === '~' || op === '~>') {
    if (xM) return [ANY];
    if (xm) return [at('>=', M, 0, 0), at('<', up(M), 0, 0, ['0'])];
    if (xp) return [at('>=', M, mi, 0), at('<', M, up(mi), 0, ['0'])];
    return [at('>=', M, mi, p, preOf(pr)), at('<', M, up(mi), 0, ['0'])];
  }
  // An x-range, alone or after <, <=, >, >= or =. A number after an x
  // (1.x.0, *.1) is none, as npm reads it.
  if ((isX(M) && !isX(mi)) || (isX(mi) && p !== undefined && !isX(p))) return null;
  let gtlt = op === '=' && xp ? '' : op;
  if (xM) return gtlt === '>' || gtlt === '<' ? [NOTHING] : [ANY];
  if (gtlt && xp) {
    let [vM, vm] = [Number(M), xm ? 0 : Number(mi)];
    let pre = [];
    if (gtlt === '>') {
      gtlt = '>=';
      if (xm) [vM, vm] = [vM + 1, 0];
      else vm += 1;
    } else if (gtlt === '<=') {
      gtlt = '<';
      if (xm) [vM, vm] = [vM + 1, 0];
      else vm += 1;
    }
    if (gtlt === '<') pre = ['0'];
    return [at(gtlt, vM, vm, 0, pre)];
  }
  if (xm) return [at('>=', M, 0, 0), at('<', up(M), 0, 0, ['0'])];
  if (xp) return [at('>=', M, mi, 0), at('<', M, up(mi), 0, ['0'])];
  // A whole version is kept as written, so only a "v" may lead it.
  if (!WHOLE.test(text)) return null;
  return [at(gtlt || '=', M, mi, p, preOf(pr))];
}

// The comparators of one alternative ("1.0.0 - 2.x", ">= 1.2 <2"), or null.
function parseAlternative(text) {
  const hyphen = /^(\S+)\s+-\s+(\S+)$/.exec(text);
  if (hyphen) {
    const from = PARTIAL.exec(hyphen[1]);
    const to = PARTIAL.exec(hyphen[2]);
    if (from && to) {
      const out = [];
      const [, fM, fm, fp, fpr] = from;
      if (!isX(fM)) {
        if (isX(fm)) out.push(at('>=', fM, 0, 0));
        else if (isX(fp)) out.push(at('>=', fM, fm, 0));
        else if (WHOLE.test(hyphen[1])) out.push(at('>=', fM, fm, fp, preOf(fpr)));
        else return null;
      }
      const [, tM, tm, tp, tpr] = to;
      if (!isX(tM)) {
        if (isX(tm)) out.push(at('<', Number(tM) + 1, 0, 0, ['0']));
        else if (isX(tp)) out.push(at('<', tM, Number(tm) + 1, 0, ['0']));
        else if (WHOLE.test(hyphen[2])) out.push(at('<=', tM, tm, tp, preOf(tpr)));
        else return null;
      }
      return out.length ? out : [ANY];
    }
  }
  // An operator may stand apart from its version (">= 1.2.3", "^ 1.2").
  const words = text.split(/\s+/);
  const out = [];
  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    if (OPERATORS.includes(word) && i + 1 < words.length) word += words[++i];
    const op = OPERATORS.find((o) => word.startsWith(o)) || '';
    const comparators = desugar(op, word.slice(op.length));
    if (!comparators) return null;
    out.push(...comparators);
  }
  return out;
}

function holds(c, v) {
  if (c.any) return true;
  const d = compareVersions(v, c.v);
  switch (c.op) {
    case '>=':
      return d >= 0;
    case '>':
      return d > 0;
    case '<=':
      return d <= 0;
    case '<':
      return d < 0;
    default:
      return d === 0;
  }
}

// Whether `version` is in `range`, as npm decides: alternatives joined by
// ||, each an x-range (1.x, 1.2, *), a caret or tilde range, a hyphen range
// (1.0.0 - 2.x) or comparisons (>=, >, <=, <, =) separated by spaces, all of
// which must hold. A prerelease version is in an alternative only when one of
// its comparators names a prerelease of the same version. Null for a range it
// can't read, or a version that isn't one.
function satisfiesRange(version, range) {
  const v = parseVersion(version);
  if (!v || typeof range !== 'string' || !range.trim()) return null;
  const alternatives = [];
  for (const alt of range.split('||')) {
    // Build metadata is dropped wherever it is, as npm drops it.
    const text = alt.replace(BUILD_ANYWHERE, '').trim();
    if (!text) return null;
    const comparators = parseAlternative(text);
    if (!comparators) return null;
    alternatives.push(comparators);
  }
  // An alternative that allows any version (*, x, >=0.0.0) makes the whole
  // range any version, as npm reads it: a prerelease then matches none.
  const isAny = (c) => c.any || (c.op === '>=' && !c.v[0] && !c.v[1] && !c.v[2] && !c.v[3].length);
  if (alternatives.length > 1 && alternatives.some((set) => set.every(isAny))) {
    return !v[3].length;
  }
  return alternatives.some((set) => {
    if (!set.every((c) => holds(c, v))) return false;
    if (!v[3].length) return true;
    return set.some(
      (c) => !c.any && c.v[3].length && c.v[0] === v[0] && c.v[1] === v[1] && c.v[2] === v[2]
    );
  });
}

// --- a pack's shape -------------------------------------------------------------

// What is wrong with a profile's exclude: { rules: [ruleId], criteria: [sc] },
// either list optional.
function excludeProblems(exclude, where) {
  if (exclude === undefined) return [];
  if (!isObject(exclude)) return [`${where}.exclude must be { rules: [...], criteria: [...] }`];
  const problems = [];
  for (const key of Object.keys(exclude)) {
    const list = exclude[key];
    if (key !== 'rules' && key !== 'criteria') {
      problems.push(`${where}.exclude takes rules and criteria, not ${key}`);
    } else if (!Array.isArray(list) || !list.every((x) => typeof x === 'string')) {
      problems.push(
        `${where}.exclude.${key} must be a list of ${key === 'rules' ? 'rule ids' : 'criteria'}`
      );
    }
  }
  return problems;
}

// What is wrong with a pack's shape, as messages; none for a pack that can be
// prepared. Whether its rules, standard and dictionaries hold together with
// core's is found by preparing it (preparePacks).
function checkPack(pack) {
  return packProblems(pack, true);
}

// withCoreVersion: whether this core's version must be in the pack's range.
// definePack leaves that to the scan, which skips the pack: a range that
// leaves out the core a host installed is no mistake in the pack, and must
// not stop the host from loading it.
function packProblems(pack, withCoreVersion) {
  if (typeof pack === 'string') {
    return [
      `"${pack}" is a pack's name: in Node, pass the pack itself; names are for a page where packScript registered it`
    ];
  }
  if (!isObject(pack)) return ['a pack must be an object'];
  const problems = [];
  for (const key of Object.keys(pack)) {
    if (!PACK_KEYS.includes(key)) problems.push(`it has no field "${key}"`);
  }
  if (typeof pack.name !== 'string' || !pack.name.trim()) {
    problems.push('name must be a non-empty string');
  } else if (pack.name.length > 214 || !PACKAGE_NAME.test(pack.name)) {
    problems.push(`name "${pack.name}" must be a package name, such as "@acme/a11y-pack"`);
  }
  if (typeof pack.version !== 'string' || !WHOLE_VERSION.test(pack.version)) {
    problems.push('version must be a version, such as "1.0.0"');
  }
  const ns = pack.namespace;
  if (typeof ns !== 'string' || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(ns)) {
    problems.push('namespace must be lowercase letters, digits and "-", starting with a letter');
  } else if (/^wcag/.test(ns) || ns === core.ENGINE_TAG) {
    problems.push(`namespace "${ns}" is core's`);
  } else {
    // A pack's ids start with its namespace and "-", so one that starts core's
    // rule ids could take an id core has, or adds later.
    const clash = coreRuleEntries()
      .map((e) => e.mod.id)
      .find((id) => id.startsWith(ns + '-'));
    if (clash) problems.push(`namespace "${ns}" starts core's rule ids, such as ${clash}`);
  }
  const fits = satisfiesRange(CORE_VERSION, pack.core);
  if (fits === null) {
    problems.push('core must be a range of core versions, such as "^1.11.0"');
  } else if (!fits && withCoreVersion) {
    problems.push(`it supports core ${pack.core}, and this is core ${CORE_VERSION}`);
  }
  // Core rules the pack's rules replace, by id (decision: explicit, never
  // inferred from a shared id).
  const overrides = Array.isArray(pack.overrides) ? pack.overrides : [];
  if (pack.overrides !== undefined && !Array.isArray(pack.overrides)) {
    problems.push('overrides must be an array of core rule ids');
  }
  const own = new Set(
    (Array.isArray(pack.rules) ? pack.rules : []).filter(isObject).map((r) => r.id)
  );
  for (const id of overrides) {
    if (typeof id !== 'string' || !id.trim()) problems.push('overrides must hold rule ids');
    else if (!own.has(id)) problems.push(`overrides names ${id}, but rules has no rule ${id}`);
  }
  const seenIds = new Set();
  for (const field of ['rules', 'variants']) {
    if (pack[field] === undefined) continue;
    if (!Array.isArray(pack[field])) {
      problems.push(`${field} must be an array`);
      continue;
    }
    pack[field].forEach((rule, i) => {
      const where = `${field}[${i}]`;
      if (!isObject(rule)) return problems.push(`${where} must be a rule module`);
      if (typeof rule.id !== 'string' || !rule.id.trim()) {
        return problems.push(`${where} has no id`);
      }
      const overriding = field === 'rules' && overrides.includes(rule.id);
      if (overriding && typeof rule.runInPage !== 'function') {
        problems.push(`${where}: ${rule.id} replaces a core rule, so it needs runInPage(ctx)`);
      }
      if (typeof ns === 'string' && !overriding && !rule.id.startsWith(ns + '-')) {
        problems.push(
          `${where}: rule id "${rule.id}" must start with "${ns}-" (or be listed in overrides, to replace the core rule ${rule.id})`
        );
      } else if (!overriding && (!ID.test(rule.id) || rule.id === ns)) {
        problems.push(
          `${where}: rule id "${rule.id}" must be lowercase letters and digits joined by "-", such as "${ns}-link-text"`
        );
      }
      if (seenIds.has(rule.id)) problems.push(`${where}: ${rule.id} is defined twice`);
      seenIds.add(rule.id);
      if (rule.meta !== undefined && !isObject(rule.meta)) {
        problems.push(`${where}: ${rule.id}'s meta must be an object`);
      } else if (rule.meta && rule.meta.wcagSc !== undefined) {
        const sc = rule.meta.wcagSc;
        const unknown = Array.isArray(sc) ? sc.filter((x) => !WCAG_SC.has(x)) : [sc];
        if (unknown.length) {
          problems.push(
            `${where}: ${rule.id}'s wcagSc names no WCAG criterion: ${unknown.map((x) => JSON.stringify(x)).join(', ')}`
          );
        }
      }
      if (typeof rule.from !== 'string' && typeof rule.runInPage !== 'function') {
        problems.push(`${where}: ${rule.id} needs runInPage(ctx), or from for a variant`);
      }
      problems.push(...pageCodeProblems(rule, where));
    });
  }
  if (pack.standard !== undefined && !isObject(pack.standard)) {
    problems.push('standard must be a registry entry (an object)');
  } else if (pack.standard !== undefined && typeof ns === 'string') {
    const st = pack.standard;
    // The fields the registry reads (src/coverage/standards.js).
    if (typeof st.standard !== 'string' || !st.standard.trim()) {
      problems.push('standard.standard must be its name, a non-empty string');
    }
    if (
      !Array.isArray(st.versions) ||
      !st.versions.length ||
      !st.versions.every((v) => typeof v === 'string' && v)
    ) {
      problems.push("standard.versions must be a list of the standard's versions");
    }
    if (st.profiles !== undefined && !isObject(st.profiles)) {
      problems.push('standard.profiles must be { name: { version, tags } }');
    }
    if (typeof st.mappingsFor !== 'function') {
      problems.push('standard.mappingsFor must be a function (ruleMappedStandard makes one)');
    }
    if (
      typeof st.key !== 'string' ||
      (st.key !== ns && !st.key.startsWith(ns + '-')) ||
      !ID.test(st.key)
    ) {
      problems.push(`standard.key must be the namespace "${ns}", or start with "${ns}-"`);
    }
    if (st.ruleTag !== undefined && st.ruleTag !== ns) {
      problems.push(`standard.ruleTag must be the namespace "${ns}"`);
    }
    const versions = Array.isArray(st.versions) ? st.versions : [];
    for (const [name, profile] of Object.entries(isObject(st.profiles) ? st.profiles : {})) {
      if (!name.startsWith(ns + '-') || !ID.test(name)) {
        problems.push(`standard.profiles: profile name "${name}" must start with "${ns}-"`);
      }
      if (!isObject(profile)) continue;
      // A version the standard lacks maps no rule and makes no rollup.
      if (profile.version !== undefined && !versions.includes(profile.version)) {
        problems.push(
          `standard.profiles.${name}: version ${JSON.stringify(profile.version)} is not one of the standard's versions (${versions.map((v) => JSON.stringify(v)).join(', ')})`
        );
      }
      problems.push(...excludeProblems(profile.exclude, `standard.profiles.${name}`));
    }
    if (typeof st.composites === 'function') {
      let rollups = [];
      try {
        rollups = st.composites();
      } catch (e) {
        problems.push(`standard.composites() throws: ${e && e.message ? e.message : e}`);
      }
      for (const r of Array.isArray(rollups) ? rollups : []) {
        const id = isObject(r) ? r.id : undefined;
        if (typeof id !== 'string' || !id.startsWith(ns + '-') || !ROLLUP_ID.test(id)) {
          problems.push(
            `standard.composites(): rollup id ${JSON.stringify(id)} must start with "${ns}-"`
          );
        }
      }
    }
  }
  if (pack.title !== undefined && (typeof pack.title !== 'string' || !pack.title.trim())) {
    problems.push('title must be a non-empty string');
  }
  if ((pack.profiles !== undefined || pack.rollups !== undefined) && pack.standard !== undefined) {
    problems.push(
      'give profiles and rollups in standard, or a standard as profiles and rollups, not both'
    );
  }
  if (pack.profiles !== undefined) {
    if (!isObject(pack.profiles)) problems.push('profiles must be { name: { tags, exclude } }');
    else {
      for (const [name, profile] of Object.entries(pack.profiles)) {
        if (typeof ns === 'string' && (!name.startsWith(ns + '-') || !ID.test(name))) {
          problems.push(`profiles: profile name "${name}" must start with "${ns}-"`);
        }
        if (
          !isObject(profile) ||
          !Array.isArray(profile.tags) ||
          !profile.tags.every((t) => typeof t === 'string')
        ) {
          problems.push(`profiles.${name} must have tags, a list of rule tags`);
        } else if (
          profile.rules !== undefined &&
          (!Array.isArray(profile.rules) || !profile.rules.every((id) => typeof id === 'string'))
        ) {
          problems.push(`profiles.${name}.rules must be a list of rule ids`);
        } else if (profile.severity !== undefined && !isObject(profile.severity)) {
          problems.push(`profiles.${name}.severity must be { ruleId: severity }`);
        } else {
          problems.push(...excludeProblems(profile.exclude, `profiles.${name}`));
        }
      }
    }
  }
  if (pack.rollups !== undefined) {
    if (!Array.isArray(pack.rollups)) problems.push('rollups must be an array');
    else {
      const seen = new Set();
      pack.rollups.forEach((r, i) => {
        const where = `rollups[${i}]`;
        if (!isObject(r) || typeof r.id !== 'string') return problems.push(`${where} has no id`);
        if (typeof ns === 'string' && !r.id.startsWith(ns + '-')) {
          problems.push(`${where}: rollup id "${r.id}" must start with "${ns}-"`);
        } else if (!ROLLUP_ID.test(r.id) || r.id === ns) {
          problems.push(
            `${where}: rollup id "${r.id}" must be letters and digits joined by "-", such as "${ns}-images"`
          );
        }
        if (seen.has(r.id)) problems.push(`${where}: ${r.id} is listed twice`);
        seen.add(r.id);
        if (typeof r.title !== 'string' || !r.title.trim())
          problems.push(`${where}: ${r.id} has no title`);
        if (
          !Array.isArray(r.checksIds) ||
          !r.checksIds.length ||
          !r.checksIds.every((id) => typeof id === 'string')
        ) {
          problems.push(`${where}: ${r.id} needs checksIds, the rules it groups`);
        }
      });
    }
  }
  // The probes its rules read from engineOptions.probes, documented for the
  // host that supplies them: { 'crawl.skipLinks': { description, readBy } }.
  if (pack.probes !== undefined) {
    if (!isObject(pack.probes)) problems.push('probes must be { path: { description, readBy } }');
    else {
      const ids = new Set(
        []
          .concat(Array.isArray(pack.rules) ? pack.rules : [])
          .concat(Array.isArray(pack.variants) ? pack.variants : [])
          .filter(isObject)
          .map((r) => r.id)
      );
      for (const [path, probe] of Object.entries(pack.probes)) {
        if (!/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)*$/.test(path)) {
          problems.push(`probes: "${path}" is not a path, such as "crawl.pageTitles"`);
        } else if (
          !isObject(probe) ||
          typeof probe.description !== 'string' ||
          !probe.description.trim()
        ) {
          problems.push(`probes.${path} must have a description`);
        } else {
          if (probe.readBy !== undefined && !Array.isArray(probe.readBy)) {
            problems.push(`probes.${path}.readBy must be a list of the pack's rule ids`);
          }
          for (const id of Array.isArray(probe.readBy) ? probe.readBy : []) {
            if (!ids.has(id))
              problems.push(`probes.${path}: readBy names ${id}, which is no rule of the pack`);
          }
        }
      }
    }
  }
  if (pack.dictionaries !== undefined) {
    if (!isObject(pack.dictionaries))
      problems.push('dictionaries must be { locale: { key: text } }');
    else {
      for (const [locale, dict] of Object.entries(pack.dictionaries)) {
        // A language and any subtags after it: fr, de-AT, zh-Hant-TW.
        if (!/^[a-z]{2,3}(-[A-Za-z0-9]{1,8})*$/.test(locale)) {
          problems.push(`dictionaries: "${locale}" is not a locale`);
        } else if (!isObject(dict) || Object.values(dict).some((t) => typeof t !== 'string')) {
          problems.push(`dictionaries.${locale} must map keys to strings`);
        }
      }
    }
  }
  return problems;
}

// A pack, checked: returns it, or throws a TypeError listing what is wrong.
function definePack(pack) {
  const problems = packProblems(pack, false);
  if (problems.length) {
    const name = isObject(pack) && typeof pack.name === 'string' ? pack.name : 'pack';
    throw new TypeError(`${name}: ${problems.join('; ')}`);
  }
  return deepFreeze(pack);
}

// A scan keeps the engine it prepared for the same pack objects, so a pack
// must not change once made: definePack freezes it, with the lists and
// objects it holds (its functions excepted), and a change then throws in
// strict code instead of going unseen.
function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (d && 'value' in d) deepFreeze(d.value, seen);
  }
  return Object.freeze(value);
}

const describePack = (pack) => `${pack.name}@${pack.version}`;

// What each pack brings, for a tool that lets its users choose packs: its
// identity, the ids of its rules, variants and overrides, its standard or
// checklist with their profiles and rollups, its locales and the probes its
// rules read. A pack that is not valid is described by its problems.
function describePacks(packs) {
  return (Array.isArray(packs) ? packs : [packs]).map((pack) => {
    const problems = checkPack(pack);
    if (problems.length) {
      return { name: isObject(pack) && typeof pack.name === 'string' ? pack.name : null, problems };
    }
    const ids = (list) => (list || []).map((r) => r.id);
    const overrides = (pack.overrides || []).slice();
    const standard = standardOf(pack);
    return {
      name: pack.name,
      version: pack.version,
      namespace: pack.namespace,
      core: pack.core,
      ...(pack.title ? { title: pack.title } : {}),
      ...(pack.description ? { description: pack.description } : {}),
      rules: ids((pack.rules || []).filter((r) => typeof r.from !== 'string')).filter(
        (id) => !overrides.includes(id)
      ),
      variants: ids((pack.rules || []).filter((r) => typeof r.from === 'string')).concat(
        ids(pack.variants)
      ),
      overrides,
      standard: standard
        ? {
            key: standard.key,
            standard: standard.standard,
            versions: standard.versions.slice(),
            profiles: Object.keys(standard.profiles || {}),
            rollups:
              typeof standard.composites === 'function'
                ? standard.composites().map((c) => c.id)
                : []
          }
        : null,
      locales: Object.keys(pack.dictionaries || {}).sort(),
      probes: Object.entries(pack.probes || {}).map(([path, p]) => ({
        path,
        description: p.description,
        readBy: Array.isArray(p.readBy) ? p.readBy.slice() : []
      }))
    };
  });
}

// A pack's own profiles and rollups (a checklist, say), as a standard: named
// by the pack's title, keyed and tagged by its namespace, at the pack's
// version. Its rollups carry that tag, so only its profiles produce them, and
// they show as a standard's own: their section of the HTML report, and
// result.standards. Each rule an item groups has an entry for that item, as
// a standard's rules have one for each requirement they check, so SARIF tags
// it and JUnit lists the item among its criterion's properties. A rollup
// names the item it is, and has no entry for another.
function checklistStandard(pack) {
  const key = pack.namespace;
  const name = pack.title || pack.name;
  const version = pack.version;
  const items = pack.rollups || [];
  return {
    key,
    standard: name,
    versions: [version],
    profiles: Object.fromEntries(
      Object.entries(pack.profiles || {}).map(([profile, p]) => [
        profile,
        {
          version,
          tags: p.tags.concat(p.tags.includes(key) ? [] : [key]),
          ...(p.rules ? { rules: p.rules.slice() } : {}),
          ...(p.exclude ? { exclude: p.exclude } : {}),
          ...(p.severity ? { severity: p.severity } : {})
        }
      ])
    ),
    ruleTag: key,
    mappingsFor: ({ id, checksIds }) =>
      checksIds
        ? []
        : items
            .filter((r) => r.checksIds.includes(id))
            .map((r) => ({
              standard: name,
              version,
              requirement: r.id,
              title: r.title,
              wcagSc: []
            })),
    composites: () =>
      items.map((r) => ({
        id: r.id,
        checksIds: r.checksIds.slice(),
        meta: {
          title: r.title,
          description: typeof r.description === 'string' ? r.description : '',
          wcagSc: [],
          level: null,
          standard: name,
          version,
          criterion: r.id,
          tags: [key],
          standardMappings: [
            { standard: name, version, requirement: r.id, title: r.title, wcagSc: [] }
          ]
        }
      }))
  };
}

// The standard a pack brings: its own, or the one its profiles and rollups make.
const standardOf = (pack) =>
  pack.standard || (pack.profiles || pack.rollups ? checklistStandard(pack) : null);

// --- an engine with packs ---------------------------------------------------------

// Core's rule modules, as the build prepared them (src/core.js lists them).
let coreEntries = null;
function coreRuleEntries() {
  if (!coreEntries) {
    coreEntries = core.__internal.ruleModules.map((spec) => {
      const mod = require(spec);
      return { file: spec, mod: mod && mod.default && mod.default.id ? mod.default : mod };
    });
  }
  return coreEntries;
}

// meta.wcagSc names the WCAG criteria a pack's rule checks, as a custom
// rule's does: the criteria normativeMappings doesn't already give become
// WCAG entries (the same rule as withWcagScMappings in resolveCustomRules,
// src/core/dom-runner.js). A built-in rule states them in normativeMappings.
function withWcagSc(mod) {
  const meta = mod && mod.meta;
  if (!meta || !Array.isArray(meta.wcagSc)) return mod;
  if (meta.normativeMappings != null && !Array.isArray(meta.normativeMappings)) return mod;
  const given = meta.normativeMappings || [];
  const have = new Set(
    given
      .filter((m) => m && String(m.standard || '').toUpperCase() === 'WCAG')
      .map((m) => String(m.requirement || '').trim())
  );
  const added = [];
  for (const v of meta.wcagSc) {
    const sc = String(v).trim();
    if (sc && !have.has(sc)) {
      have.add(sc);
      added.push({ standard: 'WCAG', requirement: sc });
    }
  }
  return added.length ? { ...mod, meta: { ...meta, normativeMappings: given.concat(added) } } : mod;
}

// An override as it is prepared: its module, with the meta it doesn't give
// taken from the core rule it replaces, so a drop-in fix runs where that rule
// would and says what it says. Related fields go together: its texts (title,
// description, i18n), its mapping (wcagSc, normativeMappings, coverage) and
// its tags are the core rule's only when it gives none of them; any other
// field is the core rule's when it doesn't give it.
const OVERRIDE_GROUPS = [
  ['title', 'description', 'i18n'],
  ['wcagSc', 'normativeMappings', 'coverage'],
  ['tags']
];
function overrideOf(coreMod, mod) {
  const own = mod.meta || {};
  const meta = { ...(coreMod.meta || {}), ...own };
  for (const group of OVERRIDE_GROUPS) {
    if (!group.some((f) => own[f] !== undefined)) continue;
    for (const f of group) if (own[f] === undefined) delete meta[f];
  }
  return { ...mod, meta };
}

// The WCAG rollups with the packs' rules where their mappings put them, as a
// custom rule counts (rollupMembers in src/core/dom-runner.js): a rule joins
// the rollup of each criterion it maps to, and an override leaves the
// rollups of criteria it no longer maps to. A WCAG rollup left with no rule
// goes; a standard's own rollups keep their lists. `rules` are the prepared
// pack rules that count: overrides, and rules without a standard's opt-in
// tag (those check what WCAG doesn't, so they never decide a WCAG verdict).
function withPackRules(composites, rules) {
  if (!rules.length) return composites;
  return composites
    .map((c) => {
      const criteria = (c.meta && !c.meta.standard && c.meta.wcagSc) || null;
      if (!criteria) return c;
      let ids = c.checksIds.slice();
      for (const r of rules) {
        const maps = (r.meta.wcagSc || []).some((sc) => criteria.includes(sc));
        if (ids.includes(r.ruleId) && !maps) ids = ids.filter((id) => id !== r.ruleId);
        else if (!ids.includes(r.ruleId) && maps) ids.push(r.ruleId);
      }
      return { ...c, checksIds: ids };
    })
    .filter((c) => c.checksIds.length);
}

// The catalog of core with the given packs, prepared as the build prepares
// core's. Throws when they do not hold together: an id or key two of them
// define, a variant of a rule that is not there, a standard whose tables do
// not match the rules.
function prepareCatalog(packs) {
  const built = core.__internal.catalog;
  // The reporters tell standards apart by name, so a pack's (its standard's,
  // or its checklist's title) is not one another standard of the scan has:
  // WCAG, a built-in one, or another pack's.
  const names = new Map([['WCAG', 'core']]);
  for (const s of NORMATIVE_STANDARDS) names.set(s.standard, 'core');
  for (const p of packs) {
    const st = standardOf(p);
    if (!st) continue;
    const owner = names.get(st.standard);
    if (owner) {
      throw new Error(
        `${p.name}: its standard is named "${st.standard}", as ${owner === 'core' ? "one of core's is" : owner + "'s is"}: give it a name of its own (a checklist takes its pack's title)`
      );
    }
    names.set(st.standard, p.name);
  }
  const registry = createRegistry(
    NORMATIVE_STANDARDS.concat(packs.map(standardOf).filter(Boolean))
  );
  // A rule a pack lists in `overrides` takes the core rule's place: the meta
  // fields it doesn't give are the core rule's, so it runs where that rule
  // would, until its own meta says otherwise.
  const coreById = new Map(coreRuleEntries().map((e) => [e.mod.id, e.mod]));
  const overridden = new Map();
  for (const p of packs) {
    for (const id of p.overrides || []) {
      if (!coreById.has(id)) throw new Error(`${p.name} overrides ${id}, which is no core rule`);
      if (overridden.has(id)) {
        throw new Error(`${overridden.get(id)} and ${p.name} both override ${id}`);
      }
      overridden.set(id, p.name);
    }
  }
  // An override is core's rule in its place: like core's own, it is never
  // the pack's opt-in rule, whatever tags it carries.
  const packEntries = packs.flatMap((p) =>
    (p.rules || []).concat(p.variants || []).map((mod) => {
      const override = (p.overrides || []).includes(mod.id);
      return {
        file: `${p.name}: ${mod.id}`,
        mod: withWcagSc(override ? overrideOf(coreById.get(mod.id), mod) : mod),
        core: override
      };
    })
  );
  const packRuleIds = new Set(packEntries.map((e) => e.mod.id));
  const coreKept = coreRuleEntries()
    .filter((e) => !overridden.has(e.mod.id))
    .map((e) => ({ ...e, core: true }));
  const mods = prepareRules(coreKept.concat(packEntries), {
    registry,
    engineTag: core.ENGINE_TAG
  });

  const standards = prepareStandards(registry);
  const ruleOptIn = optInOwnership(mods, [], standards);
  const composites = withPackRules(
    prepareComposites(
      built.composites.filter((c) => !(c.meta && c.meta.standard)),
      { registry }
    ),
    mods.filter(
      (m) => overridden.has(m.ruleId) || (packRuleIds.has(m.ruleId) && !ruleOptIn[m.ruleId])
    )
  );
  // A pack's rule links what it says; core's link its catalog section.
  const checkDefs = toCheckDefs(mods, {
    helpUrl: (id, meta) =>
      packRuleIds.has(id) ? meta.helpUrl : catalogHelpUrl(id, meta, CORE_VERSION)
  });
  validateCompositeMembers(checkDefs, composites);

  // Each rule's code: core's as built, a pack rule's own, a variant's base's.
  const modById = new Map(packEntries.map((e) => [e.mod.id, e.mod]));
  const implOf = (id) => {
    if (built.impls[id] && !packRuleIds.has(id)) return built.impls[id];
    const mod = modById.get(id);
    return {
      run: mod.runInPage,
      applicability: typeof mod.applicability === 'function' ? mod.applicability : null
    };
  };
  const impls = Object.fromEntries(
    mods.map((m) => [m.ruleId, implOf(m.variant ? m.variant.of : m.ruleId)])
  );
  // The rules that run a pack's own code, not core's: a scan runs them
  // after core's, with read-only helpers.
  const builtImpls = new Set(Object.values(built.impls));
  const packCodeRuleIds = mods
    .filter((m) => !builtImpls.has(impls[m.ruleId]))
    .map((m) => m.ruleId)
    .sort();

  // Core's dictionaries, then each pack's in order; a key two define throws.
  const i18n = mergeDictionaries(
    Object.entries(built.i18n)
      .map(([locale, dict]) => ({ locale, label: `core ${locale}`, dict }))
      .concat(
        packs.flatMap((p) =>
          Object.entries(p.dictionaries || {}).map(([locale, dict]) => ({
            locale,
            label: `${p.name} ${locale}`,
            dict
          }))
        )
      )
  );
  // A locale a pack has no dictionary for shows its messages in English, by
  // the pack's choice: they don't count as missing from that locale.
  const i18nLeftOut = JSON.parse(JSON.stringify(built.i18nLeftOut || {}));
  for (const p of packs) {
    const own = p.dictionaries || {};
    const english = Object.keys(own.en || {});
    for (const locale of Object.keys(i18n)) {
      if (locale === 'en' || own[locale] || !english.length) continue;
      const left = (i18nLeftOut[locale] = i18nLeftOut[locale] || {});
      for (const key of english) left[key] = true;
    }
  }
  const knownLocales = Array.from(new Set(built.knownLocales.concat(Object.keys(i18n)))).sort();

  return {
    checkDefs,
    composites,
    impls,
    // The packs it has: a scan on it says so, as its result can't be read
    // back from core's catalog alone.
    packs: packs.map(describePack),
    packCodeRuleIds,
    ...catalogData({
      standards,
      profiles: prepareProfiles(mods, composites, { registry }),
      optInOwned: optInOwnership(mods, composites, standards),
      i18n,
      i18nLeftOut,
      knownLocales
    })
  };
}

// The engines of the last sets of packs used, by the identity of their pack
// objects: a crawl that passes the same packs to every scan prepares them once.
const ENGINE_CACHE_SIZE = 16;
const engines = new Map();
const objectIds = new WeakMap();
let nextObjectId = 1;
const idOf = (o) => {
  if (!objectIds.has(o)) objectIds.set(o, nextObjectId++);
  return objectIds.get(o);
};

// The engine for a list of packs: { runtime, packs, skipped }. A pack that is
// invalid on its own, or does not hold together with core, is skipped and
// listed with the reason (thrown under strictOptions). Packs that do not hold
// together with each other, or a name passed twice, throw: any way of
// choosing between them would depend on the order they were passed in.
function preparePacks(list, { strict = false } = {}) {
  // Kept by the identity of the pack objects only: anything else in the list
  // is no pack, and is checked afresh every time, so the string "3" never
  // finds the engine of the pack that happened to get id 3.
  const key = list.every(isObject) ? list.map(idOf).join(',') : null;
  const cached = key === null ? null : engines.get(key);
  if (cached) {
    // A strict call throws for a pack the earlier call skipped, as it would
    // have on its own.
    if (strict && cached.skipped.length) {
      const { name, reason } = cached.skipped[0];
      throw new TypeError(`engineOptions.packs: ${name || 'a pack'}: ${reason}`);
    }
    engines.delete(key);
    engines.set(key, cached);
    return cached;
  }

  const valid = [];
  const skipped = [];
  for (const pack of list) {
    let problems = checkPack(pack);
    if (!problems.length) {
      try {
        prepareCatalog([pack]);
      } catch (e) {
        problems = [e && e.message ? e.message : String(e)];
      }
    }
    if (!problems.length) {
      valid.push(pack);
      continue;
    }
    const name = isObject(pack) && typeof pack.name === 'string' ? pack.name : null;
    const reason = problems.join('; ');
    if (strict) throw new TypeError(`engineOptions.packs: ${name || 'a pack'}: ${reason}`);
    skipped.push({ name, reason });
  }
  valid.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const twice = valid.find((p, i) => i > 0 && valid[i - 1].name === p.name);
  if (twice) throw new Error(`engineOptions.packs: ${twice.name} is passed twice`);
  // Two packs own their namespaces apart: one that is another's, or starts
  // with it and "-", could take that pack's ids. The first by name is kept.
  for (let i = 0; i < valid.length; i++) {
    const ns = valid[i].namespace;
    const owner = valid
      .slice(0, i)
      .find(
        (p) =>
          p.namespace === ns || ns.startsWith(p.namespace + '-') || p.namespace.startsWith(ns + '-')
      );
    if (!owner) continue;
    const reason = `its namespace "${ns}" overlaps "${owner.namespace}", ${owner.name}'s`;
    if (strict) throw new TypeError(`engineOptions.packs: ${valid[i].name}: ${reason}`);
    skipped.push({ name: valid[i].name, reason });
    valid.splice(i--, 1);
  }
  let catalog;
  try {
    catalog = prepareCatalog(valid);
  } catch (e) {
    throw new Error(
      `engineOptions.packs: ${valid.map(describePack).join(', ')} do not hold together: ${e && e.message ? e.message : e}`,
      { cause: e }
    );
  }
  // Skipped packs in name order, as the packs that run are, so the order
  // they were passed in doesn't change the result.
  const byName = (a, b) => {
    const x = String(a.name == null ? '' : a.name);
    const y = String(b.name == null ? '' : b.name);
    return x < y ? -1 : x > y ? 1 : a.reason < b.reason ? -1 : a.reason > b.reason ? 1 : 0;
  };
  const engine = {
    runtime: core.__internal.createRuntime(catalog),
    catalog,
    packs: valid.map(describePack),
    // The core rules the packs replace, by id.
    overrides: valid.flatMap((p) => p.overrides || []).sort(),
    skipped: skipped.slice().sort(byName)
  };
  if (key !== null) {
    engines.set(key, engine);
    if (engines.size > ENGINE_CACHE_SIZE) engines.delete(engines.keys().next().value);
  }
  return engine;
}

// --- packs in a page ------------------------------------------------------------------

// A function's source as an expression: a method written as `runInPage(ctx)
// { ... }` is not one on its own, so it is read back from an object literal.
// Each way of reading the source back is tried, and the first that parses
// and gives a function is kept: a regular expression can't tell an arrow
// function's parameters (ctx, o = String(1)) from a method's. A bound or
// built-in function has no source to read back: null.
function functionExpression(fn) {
  const src = Function.prototype.toString.call(fn);
  for (const expr of [`(${src})`, `({ ${src} })[${JSON.stringify(fn.name)}]`]) {
    if (parses(`(${expr});`)) return expr;
  }
  return null;
}

// Whether text parses as a script: compiled, never run.
function parses(text) {
  try {
    new (require('node:vm').Script)(text);
    return true;
  } catch {
    return false;
  }
}

// What a page can't be given of a rule's code: a function with no source
// (bound, built in), or one that does not read back.
function pageCodeProblems(rule, where) {
  const problems = [];
  for (const field of ['runInPage', 'applicability']) {
    if (typeof rule[field] !== 'function') continue;
    if (functionExpression(rule[field]) === null) {
      problems.push(
        `${where}: ${rule.id}'s ${field} has no source a page can be given (a bound or built-in function?): write it as a function of its own`
      );
    }
  }
  return problems;
}

// JSON as script text: "<" escaped so no "</script" can end an inline script,
// and U+2028 and U+2029, which end a line comment, escaped too.
const scriptJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

// A script that registers the packs in a page, after core's browser bundle or
// before a page.evaluate(runa11yCoreInPage, ...): runa11yCoreInPage then runs
// on their catalog when engineOptions.packs names them as name@version
// (engine.packs of a scan in Node lists the names). The catalog is prepared
// here, in Node; the page gets it as data and the packs' rules' code as
// functions written into the script, never as strings to evaluate, so it runs
// under a Content Security Policy that forbids eval. A rule's code must
// therefore be self-contained, as core's rules are. A pack that is not valid
// throws.
function packScript(packs) {
  const engine = preparePacks(Array.isArray(packs) ? packs : [packs], { strict: true });
  const { catalog } = engine;
  const built = core.__internal.catalog;
  const impls = Object.entries(catalog.impls).map(([id, impl]) => {
    const coreId = Object.keys(built.impls).find((k) => built.impls[k] === impl);
    const code = (fn) => {
      const expr = functionExpression(fn);
      // A script can be inlined in a <script> element (buildBrowserBundle), which
      // the first "</script" in it ends, whatever follows running as markup.
      if (/<\/script/i.test(expr)) {
        throw new Error(
          `${id}'s code contains "</script", which ends an inline <script> element: write it as '<' + '/script'`
        );
      }
      return expr;
    };
    const value = coreId
      ? JSON.stringify(coreId)
      : `{ run: ${code(impl.run)}, applicability: ${
          impl.applicability ? code(impl.applicability) : 'null'
        } }`;
    return `    ${JSON.stringify(id)}: ${value}`;
  });
  // The page has core's dictionaries; the packs' messages are added to them.
  const i18n = {};
  for (const p of Array.isArray(packs) ? packs : [packs]) {
    for (const [locale, dict] of Object.entries(p.dictionaries || {})) {
      i18n[locale] = Object.assign(i18n[locale] || {}, dict);
    }
  }
  const data = { ...catalog, i18n };
  delete data.impls;
  const key = engine.packs.slice().sort().join(',');
  const script = [
    // The names as data: written as text, a line break in one would end the
    // comment and the rest would run.
    `// Packs for @surea11y/core in a page: ${scriptJson(engine.packs)}.`,
    '// Generated by packScript (@surea11y/core/pack); name them in engineOptions.packs.',
    '(function (global) {',
    "  'use strict';",
    // Under a symbol, which no page markup or named access can produce, on
    // an object of its own: a page's global of any name can't take it over.
    "  const KEY = Symbol.for('surea11y.packs');",
    '  let registry = global[KEY];',
    "  if (!registry || typeof registry !== 'object') {",
    '    registry = Object.create(null);',
    '    try {',
    '      Object.defineProperty(global, KEY, { value: registry, configurable: true });',
    '    } catch (e) {',
    '      return;',
    '    }',
    '  }',
    `  const data = ${scriptJson(data)};`,
    // The core it was prepared with: a page running another refuses it.
    `  data.core = ${scriptJson(CORE_VERSION)};`,
    `  data.packs = ${scriptJson(engine.packs)};`,
    `  data.overrides = ${scriptJson(engine.overrides)};`,
    '  data.impls = {',
    impls.join(',\n'),
    '  };',
    `  registry[${scriptJson(key)}] = data;`,
    "})(typeof globalThis !== 'undefined' ? globalThis : this);",
    ''
  ].join('\n');
  // What is written must parse: a page that can't run it loses every pack in it.
  try {
    new (require('node:vm').Script)(script);
  } catch (e) {
    throw new Error(`packScript wrote a script that does not parse: ${e && e.message}`, {
      cause: e
    });
  }
  return script;
}

// Core's browser bundle with the packs registered after it: one file to inject
// into a page, for a product that ships its own bundle.
function buildBrowserBundle({ packs = [] } = {}) {
  const fs = require('fs');
  const bundle = fs.readFileSync(require.resolve('@surea11y/core/browser'), 'utf8');
  return packs.length ? `${bundle}\n${packScript(packs)}` : bundle;
}

module.exports = {
  definePack,
  checkPack,
  describePacks,
  packScript,
  buildBrowserBundle,
  preparePacks,
  satisfiesRange,
  ruleMappedStandard,
  wcagTags
};
