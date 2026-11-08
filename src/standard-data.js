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
const { standardLawProblems } = require('./laws.js');

const FORMAT = 'surea11y-standard/1';
const STANDARD_DATA = Symbol.for('surea11y.standardData');

const TOP_KEYS = [
  'format',
  'key',
  'standard',
  'lang',
  'versions',
  'options',
  'data',
  'profiles',
  'laws',
  'texts'
];
const VERSION_KEYS = ['version', 'wcagVersion', 'published', 'basedOn'];
const OPTION_KEYS = ['applicability', 'wcagCorrespondence', 'ruleMapped'];
const DATA_KEYS = ['groups', 'requirements', 'tests', 'ruleMap', 'notes', 'review', 'texts'];
const REQUIREMENT_KEYS = [
  'title',
  'wcagSc',
  'tests',
  'partial',
  'scope',
  'basedOn',
  'note',
  'procedure',
  'replace',
  'laws'
];
const TEST_KEYS = ['title', 'requirements', 'wcagSc', 'scope', 'basedOn', 'procedure'];
const PROCEDURE_KEYS = ['steps', 'passWhen', 'failWhen', 'tools', 'automation'];
const AUTOMATION = ['full', 'partial', 'manual'];
// A language tag, as a locale file is named: 'fr', 'pt-BR'.
const TAG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$/;
// A facet id, as core's procedures take it (a test's or a requirement's id,
// lower case).
const FACET_ID = /^[a-z0-9]+(\.[a-z0-9]+)*(-[a-z0-9]+(\.[a-z0-9]+)*)*$/;
const GROUP_KEYS = ['id', 'title', 'requirements', 'groups'];
const BASED_ON_KEYS = ['standard', 'version', 'id'];
const SCOPES = ['page', 'site'];

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// Keys that would reach Object.prototype through an assignment: data can
// carry them (JSON keeps "__proto__" as a key), so nothing written by key
// takes them.
const isUnsafeKey = (k) => k === '__proto__' || k === 'constructor' || k === 'prototype';
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
    for (const [k, v] of Object.entries(value)) {
      if (isUnsafeKey(k)) out.push(`${at}: a key named "${k}" is not allowed`);
      else notJson(v, `${at}.${k}`, out);
    }
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

// A procedure (a requirement's, a test's or a replacement's): 1 to 8 steps,
// passWhen and failWhen, tools and automation where given. `own` says
// whether it may give automation (a replacement takes the facet's).
function procedureProblems(p, at, out, own = true) {
  if (!isObject(p)) return out.push(`${at} must be { steps, passWhen, failWhen }`);
  unknownKeys(p, own ? PROCEDURE_KEYS : PROCEDURE_KEYS.filter((k) => k !== 'automation'), at, out);
  if (
    !Array.isArray(p.steps) ||
    p.steps.length < 1 ||
    p.steps.length > 8 ||
    !p.steps.every(isText)
  ) {
    out.push(`${at}.steps must list 1 to 8 steps, each a non-empty string`);
  }
  for (const k of ['passWhen', 'failWhen'])
    if (!isText(p[k])) out.push(`${at}.${k} must be a non-empty string`);
  if (p.tools !== undefined && !(Array.isArray(p.tools) && p.tools.every(isText))) {
    out.push(`${at}.tools must be a list of tools`);
  }
  if (p.automation !== undefined && !AUTOMATION.includes(p.automation)) {
    out.push(`${at}.automation must be one of ${AUTOMATION.join(', ')}`);
  }
}

const placeholdersOf = (text) => (String(text).match(/\{\{\w+\}\}/g) || []).sort().join(' ');

// The texts of a version that a translation can give, by their key in the
// data: { key: text | [texts] } (docs/PACKS.md, "Texts").
function sourceTexts(d) {
  const out = {};
  const procedure = (stem, p) => {
    if (!isObject(p)) return;
    if (Array.isArray(p.steps)) out[`${stem}.steps`] = p.steps;
    for (const k of ['passWhen', 'failWhen']) if (isText(p[k])) out[`${stem}.${k}`] = p[k];
  };
  for (const [id, r] of Object.entries(isObject(d.requirements) ? d.requirements : {})) {
    if (!isObject(r)) continue;
    if (isText(r.title)) out[`requirements.${id}.title`] = r.title;
    if (isText(r.note)) out[`requirements.${id}.note`] = r.note;
    procedure(`requirements.${id}.procedure`, r.procedure);
    for (const [f, p] of Object.entries(isObject(r.replace) ? r.replace : {})) {
      procedure(`requirements.${id}.replace.${f}`, p);
    }
  }
  for (const [id, t] of Object.entries(isObject(d.tests) ? d.tests : {})) {
    if (!isObject(t)) continue;
    if (isText(t.title)) out[`tests.${id}.title`] = t.title;
    procedure(`tests.${id}.procedure`, t.procedure);
  }
  const walk = (groups) => {
    for (const g of Array.isArray(groups) ? groups : []) {
      if (!isObject(g)) continue;
      if (isText(g.title)) out[`groups.${g.id}.title`] = g.title;
      walk(g.groups);
    }
  };
  walk(d.groups);
  if (Array.isArray(d.notes)) out.notes = d.notes;
  for (const [rule, byCode] of Object.entries(isObject(d.review) ? d.review : {})) {
    for (const [code, e] of Object.entries(isObject(byCode) ? byCode : {})) {
      procedure(`review.${rule}.${code}`, e);
    }
  }
  return out;
}

// What is wrong with a version's translations (texts), against its source
// texts: a locale that is no tag or is the standard's own, a key that is no
// text of the version, a list of another length, an empty text, or other
// {{placeholders}}.
function textsProblems(d, lang, at, out) {
  if (d.texts === undefined) return;
  if (!isObject(d.texts)) return out.push(`${at}.texts must be { locale: { key: text } }`);
  const source = sourceTexts(d);
  for (const [tag, dict] of Object.entries(d.texts)) {
    const lAt = `${at}.texts.${tag}`;
    if (!TAG.test(tag)) {
      out.push(`${at}.texts: "${tag}" is not a language tag`);
      continue;
    }
    if (tag.toLowerCase() === lang) {
      out.push(`${lAt}: the standard is written in ${lang}, so it needs no translation into it`);
      continue;
    }
    if (!isObject(dict)) {
      out.push(`${lAt} must map keys to their translation`);
      continue;
    }
    for (const [key, value] of Object.entries(dict)) {
      const kAt = `${lAt}: ${key}`;
      if (!Object.prototype.hasOwnProperty.call(source, key)) {
        out.push(`${kAt} is no text of the version`);
        continue;
      }
      const src = source[key];
      if (Array.isArray(src)) {
        if (!Array.isArray(value) || value.length !== src.length) {
          out.push(
            `${kAt} must be a list of ${src.length} ${src.length === 1 ? 'text' : 'texts'}, as the source is`
          );
          continue;
        }
        value.forEach((v, i) => {
          if (!isText(v)) out.push(`${kAt}[${i}] must be a non-empty string`);
          else if (placeholdersOf(v) !== placeholdersOf(src[i])) {
            out.push(`${kAt}[${i}] must keep the same {{placeholders}}`);
          }
        });
      } else if (!isText(value)) {
        out.push(`${kAt} must be a non-empty string`);
      } else if (placeholdersOf(value) !== placeholdersOf(src)) {
        out.push(`${kAt} must keep the same {{placeholders}}`);
      }
    }
  }
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
      if (req.note !== undefined && !isText(req.note))
        out.push(`${rAt}.note must be a non-empty string`);
      if (req.procedure !== undefined) {
        procedureProblems(req.procedure, `${rAt}.procedure`, out);
        if (!FACET_ID.test(id.toLowerCase()))
          out.push(`${rAt}: its id can't name a facet of its procedure`);
      }
      if (req.replace !== undefined) {
        if (!isObject(req.replace)) out.push(`${rAt}.replace must be { facet: procedure }`);
        else
          for (const [f, p] of Object.entries(req.replace)) {
            procedureProblems(p, `${rAt}.replace.${f}`, out, false);
          }
      }
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
      if (t.procedure !== undefined) {
        procedureProblems(t.procedure, `${tAt}.procedure`, out);
        if (!FACET_ID.test(id.toLowerCase()))
          out.push(`${tAt}: its id can't name a facet of its procedure`);
      }
    }
    if (requirements) groupsProblems(d.groups, requirements, `${at}.groups`, out);
    if (
      d.notes !== undefined &&
      !(Array.isArray(d.notes) && d.notes.length && d.notes.every(isText))
    ) {
      out.push(`${at}.notes must be a non-empty list of texts`);
    }
    if (d.review !== undefined) {
      if (!isObject(d.review))
        out.push(`${at}.review must be { rule: { CODE: { steps, passWhen, failWhen } } }`);
      else
        for (const [rule, byCode] of Object.entries(d.review)) {
          if (!isObject(byCode)) {
            out.push(`${at}.review.${rule} must be { CODE: { steps, passWhen, failWhen } }`);
            continue;
          }
          for (const [code, e] of Object.entries(byCode)) {
            procedureProblems(e, `${at}.review.${rule}.${code}`, out, false);
          }
        }
    }
    textsProblems(d, isText(data.lang) ? data.lang.toLowerCase() : 'en', at, out);
  }
  if (withTests && withTests !== listed.length) {
    out.push('a standard with tests has them in every version');
  }
  // Laws (and their translations, the top-level texts), the law of each
  // profile and the laws a requirement is asked for under, checked as core
  // checks a standard's (src/laws.js).
  if (data.laws !== undefined || data.texts !== undefined || hasLawRefs(data)) {
    const procedures = {};
    for (const v of listed) {
      const reqs =
        isObject(data.data) && isObject(data.data[v]) && isObject(data.data[v].requirements)
          ? data.data[v].requirements
          : {};
      procedures[v] = Object.fromEntries(
        Object.entries(reqs)
          .filter(([, r]) => isObject(r) && r.laws !== undefined)
          .map(([id, r]) => [id, { laws: r.laws }])
      );
    }
    out.push(
      ...standardLawProblems({
        lang: data.lang,
        laws: data.laws,
        lawTexts: data.texts,
        profiles: data.profiles,
        procedures
      }).map((p) =>
        p
          .replace(/^standard\.lawTexts/, 'texts')
          .replace(/^standard\.procedures\.([^.]+)\./, 'data.$1.requirements.')
          .replace(/^standard\./, '')
      )
    );
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

const ID_ORDER = new Intl.Collator('en', { numeric: true });
const byNumber = (a, b) => ID_ORDER.compare(String(a), String(b));
const facetIdOf = (id) => String(id).toLowerCase();

// A facet of core's procedures from a procedure in the data.
function facetOf(id, label, p, mapped) {
  return {
    id: facetIdOf(id),
    label,
    automation: p.automation || 'manual',
    ...(Array.isArray(p.tools) ? { tools: p.tools.slice() } : {}),
    steps: p.steps.slice(),
    passWhen: p.passWhen,
    failWhen: p.failWhen,
    ...(mapped ? { mappedRequirements: [String(id)] } : {})
  };
}

/**
 * Core's procedures for the data (standard.procedures, docs/PACKS.md), by
 * version, or null where nothing in it gives one. A requirement with a
 * procedure of its own is one facet; one that restates a WCAG criterion
 * (options.applicability 'wcag', one criterion) takes its procedures, with
 * its replacements; one with tests that give procedures has a facet per
 * test, each naming the test as what the mapping sends rules to; one with
 * only a note is listed with it. Requirements in number order.
 */
function proceduresOf(data, options) {
  let any = false;
  const out = {};
  for (const { version } of data.versions) {
    const d = data.data[version];
    const tests = d.tests || {};
    const own = {};
    for (const id of Object.keys(d.requirements).sort(byNumber)) {
      const r = d.requirements[id];
      const sc = Array.isArray(r.wcagSc) ? r.wcagSc : [];
      const head = {
        title: r.title,
        ...(r.note ? { note: r.note } : {}),
        ...(Array.isArray(r.laws) ? { laws: r.laws.slice() } : {})
      };
      const restates = options.applicability === 'wcag' && sc.length === 1;
      if (r.procedure) {
        any = true;
        own[id] = {
          ...head,
          ...(sc.length ? { relatesTo: sc.slice() } : {}),
          facets: [facetOf(id, r.title, r.procedure, false)]
        };
        continue;
      }
      if (restates) {
        own[id] = {
          ...head,
          wcag: sc[0],
          ...(isObject(r.replace) ? { replace: copy(r.replace) } : {})
        };
        continue;
      }
      const facets = (
        Array.isArray(r.tests)
          ? r.tests
          : Object.keys(tests)
              .filter((t) => (tests[t].requirements || []).includes(id))
              .sort(byNumber)
      )
        .filter((t) => tests[t] && tests[t].procedure)
        .map((t) => facetOf(t, tests[t].title, tests[t].procedure, true));
      if (facets.length) {
        any = true;
        own[id] = { ...head, ...(sc.length ? { relatesTo: sc.slice() } : {}), facets };
      } else if (r.note) {
        any = true;
        own[id] = head;
      }
    }
    out[version] = own;
  }
  return any || options.applicability === 'wcag' ? out : null;
}

const copy = (v) => JSON.parse(JSON.stringify(v));

/**
 * The data's translations (texts, by version and locale, keyed as the data
 * names its texts) as core reads them (standard.texts: { locale: { version:
 * { key } } }, src/pack-languages.js): a test's title and procedure become
 * those of its facet in each requirement it belongs to, a requirement's
 * procedure that of its own facet, whose label is its title.
 */
function engineTexts(data) {
  const out = {};
  for (const { version } of data.versions) {
    const d = data.data[version];
    if (!isObject(d.texts)) continue;
    const tests = d.tests || {};
    const reqsOf = (t) =>
      Object.keys(d.requirements).filter((r) =>
        (Array.isArray(d.requirements[r].tests)
          ? d.requirements[r].tests
          : (tests[t] && tests[t].requirements) || []
        ).includes(t)
      );
    for (const [locale, dict] of Object.entries(d.texts)) {
      if (isUnsafeKey(locale) || isUnsafeKey(version)) continue;
      const target = ((out[locale] = out[locale] || {})[version] = {});
      for (const [key, value] of Object.entries(dict)) {
        if (isUnsafeKey(key)) continue;
        let m;
        if ((m = /^requirements\.(.+?)\.procedure\.(steps|passWhen|failWhen)$/.exec(key))) {
          target[`requirements.${m[1]}.facets.${facetIdOf(m[1])}.${m[2]}`] = value;
        } else if ((m = /^tests\.(.+?)\.title$/.exec(key))) {
          for (const r of reqsOf(m[1]))
            target[`requirements.${r}.facets.${facetIdOf(m[1])}.label`] = value;
        } else if ((m = /^tests\.(.+?)\.procedure\.(steps|passWhen|failWhen)$/.exec(key))) {
          for (const r of reqsOf(m[1]))
            target[`requirements.${r}.facets.${facetIdOf(m[1])}.${m[2]}`] = value;
        } else {
          target[key] = value;
          // A requirement's own facet is labelled with its title.
          if (
            (m = /^requirements\.(.+?)\.title$/.exec(key)) &&
            d.requirements[m[1]] &&
            d.requirements[m[1]].procedure
          ) {
            target[`requirements.${m[1]}.facets.${facetIdOf(m[1])}.label`] = value;
          }
        }
      }
    }
  }
  return out;
}

// Whether a profile or a requirement names a law.
function hasLawRefs(data) {
  if (
    isObject(data.profiles) &&
    Object.values(data.profiles).some((p) => isObject(p) && p.law !== undefined)
  ) {
    return true;
  }
  return Object.values(isObject(data.data) ? data.data : {}).some(
    (d) =>
      isObject(d) &&
      isObject(d.requirements) &&
      Object.values(d.requirements).some((r) => isObject(r) && r.laws !== undefined)
  );
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
  const built = proceduresOf(frozen, options);
  const procedures = extras.procedures !== undefined ? extras.procedures : built || kit.procedures;
  const groups = Object.fromEntries(
    frozen.versions
      .filter(({ version }) => Array.isArray(frozen.data[version].groups))
      .map(({ version }) => [version, frozen.data[version].groups])
  );
  const byVersion = (field) =>
    Object.fromEntries(
      frozen.versions
        .filter(({ version }) => frozen.data[version][field] !== undefined)
        .map(({ version }) => [version, frozen.data[version][field]])
    );
  const notes = byVersion('notes');
  const review = byVersion('review');
  const texts = engineTexts(frozen);
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
    ...(procedures && Object.keys(notes).length ? { notes } : {}),
    ...(Object.keys(review).length ? { reviewByVersion: review } : {}),
    ...(frozen.lang ? { lang: frozen.lang } : {}),
    ...(Object.keys(texts).length ? { texts } : {}),
    ...(isObject(frozen.laws) ? { laws: frozen.laws } : {}),
    ...(isObject(frozen.texts) ? { lawTexts: frozen.texts } : {}),
    ...extras
  };
  Object.defineProperty(entry, STANDARD_DATA, { value: frozen, enumerable: false });
  return entry;
}

// The data a pack's standard was built from, or null.
function standardDataOf(standard) {
  return (standard && standard[STANDARD_DATA]) || null;
}

module.exports = { FORMAT, checkStandardData, standardFromData, standardDataOf, sourceTexts };
