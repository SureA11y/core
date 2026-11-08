/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * A standard as data (format "surea11y-standard/1"): its versions, and per
 * version its groups, requirements, tests and rule map, in JSON with no
 * functions, so any tool can read it and a pack can be built from it.
 * schemas/standard.schema.json describes the same shape; checkStandardData
 * checks it and its cross-references, and standardFromData turns it into
 * the registry entry a pack's `standard` is. Experimental
 * (src/experimental.js, docs/API_STABILITY.md).
 *
 *   {
 *     format: 'surea11y-standard/1',
 *     key: 'city', standard: 'City Standard', lang: 'en',
 *     versions: [{ version: '1.0', wcagVersion: '2.2', published, basedOn }],
 *     options: { applicability: 'wcag', wcagCorrespondence: true, ruleMapped: true },
 *     data: { '1.0': { groups, requirements, tests, ruleMap } },
 *     profiles: { 'city-1.0': { version: '1.0', tags: ['city'], mappedRules: true } }
 *   }
 *
 * requirements, tests and ruleMap are ruleMappedStandard's tables for the
 * version (src/profile-kit.js); groups is standard.groups' shape for it
 * (docs/PACKS.md). basedOn, on a version, requirement or test, names what it
 * is based on in another standard: [{ standard, version, id }].
 */

const { ruleMappedStandard } = require('./profile-kit.js');

const FORMAT = 'surea11y-standard/1';
const STANDARD_DATA = Symbol.for('surea11y.standardData');

const TOP_KEYS = ['format', 'key', 'standard', 'lang', 'versions', 'options', 'data', 'profiles'];
const VERSION_KEYS = ['version', 'wcagVersion', 'published', 'basedOn'];
const OPTION_KEYS = ['applicability', 'wcagCorrespondence', 'ruleMapped'];
const DATA_KEYS = ['groups', 'requirements', 'tests', 'ruleMap'];
const REQUIREMENT_KEYS = ['title', 'wcagSc', 'tests', 'partial', 'scope', 'basedOn'];
const TEST_KEYS = ['title', 'requirements', 'wcagSc', 'scope', 'basedOn'];
const GROUP_KEYS = ['id', 'title', 'requirements', 'groups'];
const BASED_ON_KEYS = ['standard', 'version', 'id'];
const SCOPES = ['page', 'site'];

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';

// Where a value holds something JSON can't: a function, a symbol, undefined
// in a list, a number that isn't finite. Data must survive JSON.
function notJson(value, at, out) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return out;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) out.push(`${at}: ${value} is not a JSON number`);
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => notJson(v, `${at}[${i}]`, out));
    return out;
  }
  if (isObject(value)) {
    if (
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null
    ) {
      out.push(`${at}: must be a plain object`);
      return out;
    }
    for (const [k, v] of Object.entries(value)) notJson(v, `${at}.${k}`, out);
    return out;
  }
  out.push(`${at}: a ${typeof value} is not data`);
  return out;
}

function unknownKeys(obj, keys, at, out) {
  for (const k of Object.keys(obj)) if (!keys.includes(k)) out.push(`${at}: no field "${k}"`);
}

function basedOnProblems(list, at, out) {
  if (list === undefined) return;
  if (!Array.isArray(list) || !list.length) {
    out.push(`${at}.basedOn must be a non-empty list of { standard, version, id }`);
    return;
  }
  list.forEach((b, i) => {
    const where = `${at}.basedOn[${i}]`;
    if (!isObject(b)) return out.push(`${where} must be { standard, version, id }`);
    unknownKeys(b, BASED_ON_KEYS, where, out);
    if (!isText(b.standard)) out.push(`${where}.standard must be a standard's key`);
    for (const k of ['version', 'id']) {
      if (b[k] !== undefined && !isText(b[k])) out.push(`${where}.${k} must be a non-empty string`);
    }
  });
}

function stringList(list, at, out, { empty = true } = {}) {
  if (!Array.isArray(list) || (!empty && !list.length) || !list.every(isText)) {
    out.push(`${at} must be a ${empty ? '' : 'non-empty '}list of strings`);
    return false;
  }
  if (new Set(list).size !== list.length) out.push(`${at} lists one twice`);
  return true;
}

// The groups of a version: ids unique, each with a title and requirements
// or groups, every requirement one the version has, in one group at most.
function groupsProblems(groups, requirements, at, out) {
  if (groups === undefined) return;
  if (!Array.isArray(groups)) return out.push(`${at} must be a list of groups`);
  const ids = new Set();
  const placed = new Map();
  const walk = (list, where) =>
    list.forEach((g, i) => {
      const gAt = `${where}[${i}]`;
      if (!isObject(g)) return out.push(`${gAt} must be { id, title, requirements, groups }`);
      unknownKeys(g, GROUP_KEYS, gAt, out);
      if (!isText(g.id)) out.push(`${gAt}.id must be a non-empty string`);
      else if (ids.has(g.id)) out.push(`${gAt}: group ${g.id} is given twice`);
      else ids.add(g.id);
      if (!isText(g.title)) out.push(`${gAt}.title must be a non-empty string`);
      if (g.requirements === undefined && g.groups === undefined) {
        out.push(`${gAt} must have requirements, groups or both`);
      }
      if (g.requirements !== undefined && stringList(g.requirements, `${gAt}.requirements`, out)) {
        for (const id of g.requirements) {
          if (!Object.prototype.hasOwnProperty.call(requirements, id)) {
            out.push(`${gAt}: no requirement ${id}`);
          } else if (placed.has(id)) {
            out.push(`${gAt}: requirement ${id} is already in group ${placed.get(id)}`);
          } else placed.set(id, g.id);
        }
      }
      if (g.groups !== undefined) {
        if (!Array.isArray(g.groups)) out.push(`${gAt}.groups must be a list of groups`);
        else walk(g.groups, `${gAt}.groups`);
      }
    });
  walk(groups, at);
}

/**
 * The problems with a standard's data: its shape, as the schema gives it, and
 * what the schema can't say (a version's data for a version not listed, a
 * group naming a requirement the version lacks, a test naming one). What
 * needs the rules (a rule the rule map names, a criterion WCAG lacks) is
 * checked when the pack is defined, by the entry's validate. [] when sound.
 */
function checkStandardData(data) {
  const out = [];
  if (!isObject(data)) return ["a standard's data must be an object"];
  notJson(data, 'data', out);
  if (out.length) return out;
  unknownKeys(data, TOP_KEYS, 'data', out);
  if (data.format !== FORMAT) out.push(`format must be "${FORMAT}"`);
  if (!isText(data.key) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.key)) {
    out.push('key must be lowercase letters and digits, joined by "-"');
  }
  if (!isText(data.standard)) out.push("standard must be the standard's name");
  if (data.lang !== undefined && !isText(data.lang)) out.push('lang must be a language tag');
  if (data.options !== undefined) {
    if (!isObject(data.options)) out.push('options must be an object');
    else {
      unknownKeys(data.options, OPTION_KEYS, 'options', out);
      const { applicability, wcagCorrespondence, ruleMapped } = data.options;
      if (applicability !== undefined && applicability !== 'wcag') {
        out.push("options.applicability can only be 'wcag'");
      }
      for (const [k, v] of Object.entries({ wcagCorrespondence, ruleMapped })) {
        if (v !== undefined && typeof v !== 'boolean')
          out.push(`options.${k} must be true or false`);
      }
    }
  }
  const versions = Array.isArray(data.versions) ? data.versions : null;
  if (!versions || !versions.length) {
    out.push('versions must be a non-empty list of { version, wcagVersion }');
    return out;
  }
  const listed = [];
  versions.forEach((v, i) => {
    const at = `versions[${i}]`;
    if (!isObject(v)) return out.push(`${at} must be { version, wcagVersion }`);
    unknownKeys(v, VERSION_KEYS, at, out);
    if (!isText(v.version)) out.push(`${at}.version must be a non-empty string`);
    else if (listed.includes(v.version)) out.push(`${at}: version ${v.version} is given twice`);
    else listed.push(v.version);
    if (!isText(v.wcagVersion))
      out.push(`${at}.wcagVersion must be the WCAG version it is built on`);
    if (v.published !== undefined && !isText(v.published))
      out.push(`${at}.published must be a date`);
    basedOnProblems(v.basedOn, at, out);
  });
  if (!isObject(data.data)) {
    out.push("data must hold each version's tables: { [version]: { requirements, ruleMap } }");
    return out;
  }
  for (const version of Object.keys(data.data)) {
    if (!listed.includes(version)) out.push(`data.${version}: versions does not list ${version}`);
  }
  let withTests = 0;
  for (const version of listed) {
    const at = `data.${version}`;
    const d = data.data[version];
    if (!isObject(d)) {
      out.push(`${at} must be { groups, requirements, tests, ruleMap }`);
      continue;
    }
    unknownKeys(d, DATA_KEYS, at, out);
    const requirements = isObject(d.requirements) ? d.requirements : null;
    if (!requirements) out.push(`${at}.requirements must be an object of requirements`);
    const tests = d.tests === undefined ? {} : isObject(d.tests) ? d.tests : null;
    if (!tests) out.push(`${at}.tests must be an object of tests`);
    if (tests && Object.keys(tests).length) withTests++;
    if (!isObject(d.ruleMap)) out.push(`${at}.ruleMap must be an object of rule rows`);
    for (const [id, req] of Object.entries(requirements || {})) {
      const rAt = `${at}.requirements.${id}`;
      if (!isObject(req)) {
        out.push(`${rAt} must be { title, wcagSc }`);
        continue;
      }
      unknownKeys(req, REQUIREMENT_KEYS, rAt, out);
      if (!isText(req.title)) out.push(`${rAt}.title must be a non-empty string`);
      if (req.wcagSc !== undefined) stringList(req.wcagSc, `${rAt}.wcagSc`, out);
      if (req.tests !== undefined) stringList(req.tests, `${rAt}.tests`, out);
      if (req.partial !== undefined && typeof req.partial !== 'boolean') {
        out.push(`${rAt}.partial must be true or false`);
      }
      if (req.scope !== undefined && !SCOPES.includes(req.scope)) {
        out.push(`${rAt}.scope must be ${SCOPES.map((s) => `"${s}"`).join(' or ')}`);
      }
      basedOnProblems(req.basedOn, rAt, out);
    }
    for (const [id, t] of Object.entries(tests || {})) {
      const tAt = `${at}.tests.${id}`;
      if (!isObject(t)) {
        out.push(`${tAt} must be { title, requirements }`);
        continue;
      }
      unknownKeys(t, TEST_KEYS, tAt, out);
      if (!isText(t.title)) out.push(`${tAt}.title must be a non-empty string`);
      if (
        stringList(t.requirements, `${tAt}.requirements`, out, { empty: false }) &&
        requirements
      ) {
        for (const r of t.requirements) {
          if (!Object.prototype.hasOwnProperty.call(requirements, r)) {
            out.push(`${tAt}: no requirement ${r}`);
          }
        }
      }
      if (t.wcagSc !== undefined) stringList(t.wcagSc, `${tAt}.wcagSc`, out);
      if (t.scope !== undefined && !SCOPES.includes(t.scope)) {
        out.push(`${tAt}.scope must be ${SCOPES.map((s) => `"${s}"`).join(' or ')}`);
      }
      basedOnProblems(t.basedOn, tAt, out);
    }
    if (requirements) groupsProblems(d.groups, requirements, `${at}.groups`, out);
  }
  if (withTests && withTests !== listed.length) {
    out.push('a standard with tests has them in every version');
  }
  if (data.profiles !== undefined) {
    if (!isObject(data.profiles)) out.push('profiles must be an object of profiles');
    else
      for (const [name, p] of Object.entries(data.profiles)) {
        if (!isObject(p)) out.push(`profiles.${name} must be { version, tags }`);
        else if (!listed.includes(p.version)) {
          out.push(
            `profiles.${name}: version ${JSON.stringify(p.version)} is not one of the versions`
          );
        }
      }
  }
  return out;
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

/**
 * The registry entry for a standard's data: what a pack's `standard` is,
 * with mappingsFor, composites and validate from ruleMappedStandard, the
 * profiles, and procedures and groups where the standard restates WCAG
 * (options.applicability 'wcag'). `extras` adds or replaces fields the data
 * doesn't give yet (report, review, translations, notes, a mappingsFor of
 * the pack's own). Throws a TypeError naming each problem of the data.
 */
function standardFromData(data, extras = {}) {
  const problems = checkStandardData(data);
  if (problems.length) {
    throw new TypeError(
      `${(isObject(data) && data.key) || 'standard data'}: ${problems.join('; ')}`
    );
  }
  if (!isObject(extras)) throw new TypeError('standardFromData: extras must be an object');
  const frozen = deepFreeze(JSON.parse(JSON.stringify(data)));
  const options = frozen.options || {};
  const pick = (field) =>
    Object.fromEntries(
      frozen.versions.map(({ version }) => [version, frozen.data[version][field] || {}])
    );
  const hasTests = frozen.versions.some(
    ({ version }) => Object.keys(frozen.data[version].tests || {}).length
  );
  const kit = ruleMappedStandard({
    standard: frozen.standard,
    tag: frozen.key,
    versions: frozen.versions.map(({ version, wcagVersion }) => ({ version, wcagVersion })),
    requirements: pick('requirements'),
    ...(hasTests ? { tests: pick('tests') } : {}),
    ruleMap: pick('ruleMap'),
    ...(options.applicability ? { applicability: options.applicability } : {}),
    ...(options.wcagCorrespondence ? { wcagCorrespondence: true } : {})
  });
  const procedures = extras.procedures !== undefined ? extras.procedures : kit.procedures;
  const groups = Object.fromEntries(
    frozen.versions
      .filter(({ version }) => Array.isArray(frozen.data[version].groups))
      .map(({ version }) => [version, frozen.data[version].groups])
  );
  const entry = {
    key: frozen.key,
    standard: frozen.standard,
    versions: frozen.versions.map((v) => v.version),
    profiles: frozen.profiles || {},
    ruleTag: frozen.key,
    ...(options.ruleMapped === false ? {} : { ruleMapped: true }),
    mappingsFor: kit.mappingsFor,
    composites: kit.composites,
    validate: kit.validate,
    ...(procedures ? { procedures } : {}),
    ...(procedures && Object.keys(groups).length ? { groups } : {}),
    ...(frozen.lang ? { lang: frozen.lang } : {}),
    ...extras
  };
  Object.defineProperty(entry, STANDARD_DATA, { value: frozen, enumerable: false });
  return entry;
}

// The data a pack's standard was built from, or null.
function standardDataOf(standard) {
  return (standard && standard[STANDARD_DATA]) || null;
}

module.exports = { FORMAT, checkStandardData, standardFromData, standardDataOf };
