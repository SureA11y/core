/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * A standard built on others: deriveStandard(bases, own) resolves the data of
 * a standard whose versions, requirements and tests say what they are based
 * on (`basedOn`) in one or more base standards, into complete standard data
 * (src/standard-data.js). Experimental (src/experimental.js).
 *
 * The rules (packs-roadmap's design, §5):
 *
 * 1. Fields. A derived requirement or test takes the fields of the entry it
 *    is based on (its first `basedOn`), and its own fields replace them. An
 *    entry with only `basedOn` is the base's as it is.
 * 2. Only what is declared exists. A base entry no derived entry is based on
 *    is not in the derived standard. A derived requirement based on a base
 *    requirement with tests also has those tests, each based on the base's
 *    test, unless it lists tests of its own.
 * 3. The rule map flows through provenance. A base row naming base id X
 *    applies, in the derived version, to every derived entry based on X; a
 *    derived requirement based on X that has tests of its own (X split into
 *    tests) takes it on those tests. Routes, asks and outsideCorrespondence
 *    are carried the same way. A unit with no derived counterpart is left
 *    out; a row left with nothing is dropped. The derived standard's own row
 *    for a rule replaces the inherited one whole, and null drops it.
 * 4. Several bases. A version's `basedOn` names its bases ({ standard,
 *    version }); an entry's `basedOn` names the standard and id, and the
 *    version when it isn't the one its version names. A rule inherited from
 *    two bases is an error the derived standard resolves with its own row.
 * 5. Validation. A `basedOn` naming a standard, version or id the bases
 *    don't have is an error, so a change in a base can't drift in silently.
 *
 * 6. Review and texts. A version's review (a standard's own steps for core's
 *    codes) comes from its bases', the derived standard's own entry for a
 *    rule and code replacing theirs (null drops it); two bases giving the
 *    same rule and code differently is an error it resolves with its own.
 *    A derived entry takes its base's translations (texts) under its own id
 *    where its source text is the base's, and its own translations replace
 *    them; a text it rewords is not translated by the base.
 *
 * Groups, notes and profiles are the derived standard's own.
 */

const { checkStandardData, sourceTexts } = require('./standard-data.js');

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const listOf = (v) => (Array.isArray(v) ? v : []);
const copy = (v) => JSON.parse(JSON.stringify(v));

// Keys that would reach Object.prototype through an assignment: data can
// carry them (JSON keeps "__proto__" as a key), so nothing written by key
// takes them.
const isUnsafeKey = (k) => k === '__proto__' || k === 'constructor' || k === 'prototype';

// The base standard's tables for a version, or null.
function baseTables(bases, key, version) {
  const base = bases.get(key);
  return base && isObject(base.data) && isObject(base.data[version]) ? base.data[version] : null;
}

// Where a value holds a key no data may have (isUnsafeKey), as messages.
function unsafeKeysIn(value, at, out = []) {
  if (Array.isArray(value)) value.forEach((v, i) => unsafeKeysIn(v, `${at}[${i}]`, out));
  else if (isObject(value)) {
    for (const [k, v] of Object.entries(value)) {
      if (isUnsafeKey(k)) out.push(`${at}: a key named "${k}" is not allowed`);
      else unsafeKeysIn(v, `${at}.${k}`, out);
    }
  }
  return out;
}

/**
 * The complete data of a standard built on `bases` (a list of standard data,
 * each by its key) from its own data. Throws a TypeError naming each
 * problem: of a base, of the own data, or of the derivation.
 */
function deriveStandard(bases, own) {
  if (!Array.isArray(bases) || !bases.length) {
    throw new TypeError('deriveStandard: bases must be a non-empty list of standard data');
  }
  const problems = [];
  const byKey = new Map();
  bases.forEach((b, i) => {
    const p = checkStandardData(b);
    if (p.length) problems.push(...p.map((x) => `bases[${i}]: ${x}`));
    else if (byKey.has(b.key)) problems.push(`bases[${i}]: ${b.key} is given twice`);
    else byKey.set(b.key, b);
  });
  if (!isObject(own)) problems.push('own data must be an object');
  else problems.push(...unsafeKeysIn(own, 'own'));
  if (problems.length) throw new TypeError(`deriveStandard: ${problems.join('; ')}`);

  const out = copy(own);
  out.data = isObject(out.data) ? out.data : {};
  const versions = Array.isArray(out.versions) ? out.versions : [];

  for (const v of versions) {
    if (!isObject(v) || typeof v.version !== 'string') continue;
    const version = v.version;
    const at = `data.${version}`;
    const mine = isObject(out.data[version]) ? out.data[version] : (out.data[version] = {});
    // The base versions this version is built on: { standard: version }.
    const baseVersion = {};
    for (const b of listOf(v.basedOn)) {
      if (!isObject(b) || typeof b.standard !== 'string') continue;
      if (!byKey.has(b.standard)) {
        problems.push(
          `versions: ${version} is based on ${b.standard}, which is not among the bases`
        );
        continue;
      }
      if (typeof b.version !== 'string' || !baseTables(byKey, b.standard, b.version)) {
        problems.push(
          `versions: ${version} is based on ${b.standard} ${b.version}, which that base doesn't have`
        );
        continue;
      }
      baseVersion[b.standard] = b.version;
    }

    // Where a provenance points: the base tables and the entry in them.
    const resolve = (b, where) => {
      if (!isObject(b) || typeof b.standard !== 'string' || typeof b.id !== 'string') {
        problems.push(`${where}: basedOn needs a standard and an id`);
        return null;
      }
      const bv = typeof b.version === 'string' ? b.version : baseVersion[b.standard];
      if (!bv) {
        problems.push(
          `${where}: no version of ${b.standard} to take ${b.id} from (name it, or base the version on ${b.standard})`
        );
        return null;
      }
      const tables = baseTables(byKey, b.standard, bv);
      if (!tables) {
        problems.push(`${where}: ${b.standard} ${bv} is not among the bases`);
        return null;
      }
      const req = isObject(tables.requirements) && tables.requirements[b.id];
      const test = isObject(tables.tests) && tables.tests[b.id];
      if (!req && !test) {
        problems.push(`${where}: ${b.standard} ${bv} has no requirement or test ${b.id}`);
        return null;
      }
      return {
        standard: b.standard,
        version: bv,
        id: b.id,
        kind: req ? 'requirement' : 'test',
        entry: req || test,
        tables
      };
    };

    const requirements = isObject(mine.requirements) ? mine.requirements : (mine.requirements = {});
    const tests = isObject(mine.tests) ? mine.tests : {};
    // Each derived unit's resolved provenance.
    const prov = new Map();

    // Rule 1 and 2: requirements take their base's fields; a base
    // requirement's tests come with it unless the requirement lists its own.
    for (const [id, req] of Object.entries(requirements)) {
      if (!isObject(req) || req.basedOn === undefined) continue;
      const resolved = listOf(req.basedOn).map((b, i) =>
        resolve(b, `${at}.requirements.${id}.basedOn[${i}]`)
      );
      if (resolved.some((r) => !r)) continue;
      prov.set(id, resolved);
      const first = resolved[0];
      // A test's own requirements are the base's structure, not a field, and
      // a base's laws are its own: a derived standard names its laws itself.
      const {
        tests: baseTests,
        basedOn: _ignored,
        requirements: _of,
        laws: _laws,
        ...fields
      } = copy(first.entry);
      requirements[id] = { ...fields, ...req };
      if (first.kind !== 'requirement' || req.tests !== undefined || !Array.isArray(baseTests))
        continue;
      requirements[id].tests = baseTests.slice();
      for (const t of baseTests) {
        if (tests[t] !== undefined) continue;
        tests[t] = {
          requirements: [id],
          basedOn: [
            {
              standard: first.standard,
              ...(first.version !== baseVersion[first.standard] ? { version: first.version } : {}),
              id: t
            }
          ]
        };
      }
    }
    // Tests take their base's fields; their requirements are the derived ones.
    for (const [id, test] of Object.entries(tests)) {
      if (!isObject(test) || test.basedOn === undefined) continue;
      const resolved = listOf(test.basedOn).map((b, i) =>
        resolve(b, `${at}.tests.${id}.basedOn[${i}]`)
      );
      if (resolved.some((r) => !r)) continue;
      prov.set(id, resolved);
      const { requirements: _base, basedOn: _ignored, ...fields } = copy(resolved[0].entry);
      tests[id] = { ...fields, ...test };
    }
    if (Object.keys(tests).length) mine.tests = tests;

    // Rule 3: the derived units for a base unit. A derived requirement based
    // on it that has tests of its own, none of them based on anything,
    // stands for it through those tests.
    // Built once per version: for each base unit (standard, version, id),
    // the derived units it stands for.
    const forBase = new Map();
    const baseKey = (standard, version, id) => `${standard}\u0000${version}\u0000${id}`;
    for (const [unit, sources] of prov) {
      const req = requirements[unit];
      const ownTests =
        req && Array.isArray(req.tests) && req.tests.every((t) => !prov.has(t)) ? req.tests : [];
      const stands = ownTests.length ? ownTests : [unit];
      for (const src of sources) {
        const k = baseKey(src.standard, src.version, src.id);
        if (!forBase.has(k)) forBase.set(k, new Set());
        for (const u of stands) forBase.get(k).add(u);
      }
    }
    const counterparts = (standard, version, id) => [
      ...(forBase.get(baseKey(standard, version, id)) || [])
    ];
    const mapUnits = (list, standard, version) => [
      ...new Set(listOf(list).flatMap((u) => counterparts(standard, version, u)))
    ];

    const ownRows = isObject(mine.ruleMap) ? mine.ruleMap : {};
    const inherited = {};
    const from = {};
    for (const [standard, version] of Object.entries(baseVersion)) {
      const tables = baseTables(byKey, standard, version);
      for (const [ruleId, row] of Object.entries(isObject(tables.ruleMap) ? tables.ruleMap : {})) {
        if (!isObject(row)) continue;
        const mapped = { requirements: mapUnits(row.requirements, standard, version) };
        const asks = mapUnits(row.asks, standard, version);
        if (asks.length) mapped.asks = asks;
        for (const field of ['reasonCodes']) {
          if (!isObject(row[field])) continue;
          mapped[field] = Object.fromEntries(
            Object.entries(row[field]).map(([code, r]) => [
              code,
              {
                ...r,
                ...(r && r.requirements !== undefined
                  ? { requirements: mapUnits(r.requirements, standard, version) }
                  : {})
              }
            ])
          );
        }
        if (Array.isArray(row.findings)) {
          mapped.findings = row.findings.map((f) => ({
            ...f,
            ...(f && f.requirements !== undefined
              ? { requirements: mapUnits(f.requirements, standard, version) }
              : {})
          }));
        }
        if (isObject(row.outsideCorrespondence)) {
          const outside = {};
          for (const [u, reason] of Object.entries(row.outsideCorrespondence)) {
            for (const d of counterparts(standard, version, u)) outside[d] = reason;
          }
          if (Object.keys(outside).length) mapped.outsideCorrespondence = outside;
        }
        if (typeof row.note === 'string') mapped.note = row.note;
        const reaches = [
          ...mapped.requirements,
          ...listOf(mapped.asks),
          ...Object.values(mapped.reasonCodes || {}).flatMap((r) => listOf(r && r.requirements)),
          ...listOf(mapped.findings).flatMap((f) => listOf(f && f.requirements))
        ];
        if (!reaches.length) continue;
        if (inherited[ruleId] && !Object.prototype.hasOwnProperty.call(ownRows, ruleId)) {
          problems.push(
            `${at}.ruleMap: ${ruleId} comes from both ${from[ruleId]} and ${standard}; give the rule a row of its own`
          );
          continue;
        }
        inherited[ruleId] = mapped;
        from[ruleId] = standard;
      }
    }
    const ruleMap = {};
    for (const [ruleId, row] of Object.entries({ ...inherited, ...ownRows })) {
      if (row === null) continue;
      ruleMap[ruleId] = Object.prototype.hasOwnProperty.call(ownRows, ruleId)
        ? ownRows[ruleId]
        : row;
    }
    mine.ruleMap = Object.fromEntries(
      Object.entries(ruleMap).sort(([a], [b]) => a.localeCompare(b))
    );

    // Rule 6: review from the bases, own entries replacing them.
    const ownReview = isObject(mine.review) ? mine.review : {};
    const review = {};
    const reviewFrom = {};
    for (const [standard, version] of Object.entries(baseVersion)) {
      const tables = baseTables(byKey, standard, version);
      for (const [rule, byCode] of Object.entries(isObject(tables.review) ? tables.review : {})) {
        for (const [code, entry] of Object.entries(isObject(byCode) ? byCode : {})) {
          if (isUnsafeKey(rule) || isUnsafeKey(code)) continue;
          const mineGives =
            isObject(ownReview[rule]) &&
            Object.prototype.hasOwnProperty.call(ownReview[rule], code);
          const seen = review[rule] && review[rule][code];
          if (seen && JSON.stringify(seen) !== JSON.stringify(entry) && !mineGives) {
            problems.push(
              `${at}.review: ${rule} ${code} comes from both ${reviewFrom[`${rule} ${code}`]} and ${standard}; give it a review of its own`
            );
            continue;
          }
          (review[rule] = review[rule] || {})[code] = copy(entry);
          reviewFrom[`${rule} ${code}`] = standard;
        }
      }
    }
    for (const [rule, byCode] of Object.entries(ownReview)) {
      for (const [code, entry] of Object.entries(isObject(byCode) ? byCode : {})) {
        if (isUnsafeKey(rule) || isUnsafeKey(code)) continue;
        if (entry === null) {
          if (review[rule]) delete review[rule][code];
        } else (review[rule] = review[rule] || {})[code] = entry;
      }
    }
    for (const rule of Object.keys(review))
      if (!Object.keys(review[rule]).length) delete review[rule];
    if (Object.keys(review).length) mine.review = review;
    else delete mine.review;

    // Rule 6: translations through provenance, where the source is the base's.
    const mineSource = sourceTexts(mine);
    const texts = isObject(mine.texts) ? copy(mine.texts) : {};
    // Each base's source texts, read once.
    const sourceOfBase = new Map();
    const baseSourceOf = (baseD) => {
      if (!sourceOfBase.has(baseD)) sourceOfBase.set(baseD, sourceTexts(baseD));
      return sourceOfBase.get(baseD);
    };
    const inherit = (baseD, baseKey, key) => {
      const baseSource = baseSourceOf(baseD);
      if (!Object.prototype.hasOwnProperty.call(mineSource, key)) return;
      if (JSON.stringify(baseSource[baseKey]) !== JSON.stringify(mineSource[key])) return;
      for (const [locale, dict] of Object.entries(isObject(baseD.texts) ? baseD.texts : {})) {
        if (!isObject(dict) || !Object.prototype.hasOwnProperty.call(dict, baseKey)) continue;
        if (isUnsafeKey(locale) || isUnsafeKey(key)) continue;
        const target = (texts[locale] = texts[locale] || {});
        if (!Object.prototype.hasOwnProperty.call(target, key)) target[key] = copy(dict[baseKey]);
      }
    };
    const prefixOf = (kind, id) => `${kind === 'test' ? 'tests' : 'requirements'}.${id}`;
    for (const [unit, sources] of prov) {
      const s0 = sources[0];
      const kind = Object.prototype.hasOwnProperty.call(tests, unit) ? 'test' : 'requirement';
      for (const suffix of [
        'title',
        'note',
        'procedure.steps',
        'procedure.passWhen',
        'procedure.failWhen'
      ]) {
        inherit(
          s0.tables,
          `${prefixOf(s0.kind, s0.id)}.${suffix}`,
          `${prefixOf(kind, unit)}.${suffix}`
        );
      }
    }
    for (const [standard, version] of Object.entries(baseVersion)) {
      const tables = baseTables(byKey, standard, version);
      for (const [rule, byCode] of Object.entries(isObject(mine.review) ? mine.review : {})) {
        for (const code of Object.keys(byCode)) {
          for (const f of ['steps', 'passWhen', 'failWhen']) {
            inherit(tables, `review.${rule}.${code}.${f}`, `review.${rule}.${code}.${f}`);
          }
        }
      }
    }
    for (const l of Object.keys(texts)) if (!Object.keys(texts[l]).length) delete texts[l];
    if (Object.keys(texts).length) mine.texts = texts;
  }

  if (problems.length) throw new TypeError(`deriveStandard: ${problems.join('; ')}`);
  const final = checkStandardData(out);
  if (final.length) throw new TypeError(`deriveStandard: ${final.join('; ')}`);
  return out;
}

module.exports = { deriveStandard };
