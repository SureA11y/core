/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

// A scan of several profiles at once: engineOptions.profile as a list
// (docs/MULTI_PROFILE_SCANS.md). Each profile is scanned as it would be on
// its own, on the same page, and the results are merged into one that reads
// as a scan of one profile with the rules of all: a check's outcome is the
// worst its profiles give it, and each finding says what each profile makes
// of it (`verdicts`). A single name, or a list of one, scans as before.
//
// Each function is self-contained but for the others in this file: they are
// inlined together into the generated core.js and the in-page runner.

/**
 * The profiles a list asks for, in order, each once; null for an option
 * that is no list of two or more (a string, a list of one, anything else),
 * which a scan reads as it always has.
 */
function profileListOf(profile) {
  if (!Array.isArray(profile)) return null;
  const out = [];
  for (const p of profile) {
    if (typeof p !== 'string') continue;
    const name = p.trim();
    if (name && !out.includes(name)) out.push(name);
  }
  return out.length > 1 ? out : null;
}

/**
 * Runs `run(engineOptions)` once per profile `engineOptions.profile` lists,
 * one after another, and merges the results (mergeProfileResults). Any other
 * profile option is a single scan: a list of one is its one name.
 */
function runProfiles(engineOptions, run) {
  const thenable = (v) => !!v && typeof v.then === 'function';
  const asked =
    engineOptions && typeof engineOptions === 'object' ? engineOptions.profile : undefined;
  if (Array.isArray(asked)) {
    const names = asked.filter((p) => typeof p === 'string' && p.trim()).map((p) => p.trim());
    const unique = names.filter((p, i) => names.indexOf(p) === i);
    if (unique.length <= 1) {
      return run(
        Object.assign({}, engineOptions, { profile: unique.length ? unique[0] : undefined })
      );
    }
    const runs = [];
    const step = (i) => {
      if (i >= unique.length) return mergeProfileResults(runs, unique);
      const result = run(Object.assign({}, engineOptions, { profile: unique[i] }));
      if (thenable(result)) {
        return result.then((r) => {
          runs.push({ profile: unique[i], result: r });
          return step(i + 1);
        });
      }
      runs.push({ profile: unique[i], result });
      return step(i + 1);
    };
    return step(0);
  }
  return run(engineOptions);
}

/**
 * One result from the scans of several profiles, `runs` ([{ profile,
 * result }], in the order asked). A profile its scan didn't apply (no such
 * profile, its pack skipped) is listed in engine.profilesNotRun and judges
 * nothing. Of the others:
 *
 * - checksResults: each rule once. Its `verdicts` are each profile's outcome
 *   for it, and its `outcome` the worst of them (fail, cantTell, pass,
 *   notApplicable). Each finding is listed once, with `verdicts` saying
 *   what each profile that ran the rule makes of it: its tier, or what a
 *   standard's rollups make of it by its reason code (a WCAG cantTell that
 *   a standard fails), or notApplicable where a standard doesn't count it.
 * - rulesResults: every profile's rollups, each once; one two profiles give
 *   with different outcomes is the worst, and each names the profiles that
 *   give it (`profiles`).
 * - profiles: per profile, its standard and version and the outcome of each
 *   of its rollups.
 * - engine.profile is the first profile that ran, so code that reads one
 *   name keeps working; engine.profiles lists them all.
 */
function mergeProfileResults(runs, asked) {
  const RANK = { fail: 4, cantTell: 3, pass: 2, notApplicable: 1 };
  const rank = (o) => RANK[o] || 0;
  const worst = (list) => {
    let out = null;
    for (const o of list) if (o && rank(o) > rank(out)) out = o;
    return out;
  };
  const isTier = (o) => o === 'fail' || o === 'cantTell';
  const reasonCodeOf = (o) =>
    o && o.data && o.data.details && typeof o.data.details.reasonCode === 'string'
      ? o.data.details.reasonCode
      : '';
  const keyOf = (o) =>
    JSON.stringify([
      (o && o.frameUrl) || '',
      (o && o.selector) || '',
      (o && o.structuralPath) || '',
      reasonCodeOf(o),
      (o && o.html) || ''
    ]);
  const normalizedOf = (o) => (o === 'notApplicable' ? 'inapplicable' : o);

  const ran = [];
  const notRun = [];
  for (const r of runs) {
    const applied = r.result && r.result.engine ? r.result.engine.profile : undefined;
    if (r.result && typeof r.result === 'object' && applied === r.profile) ran.push(r);
    else {
      const skipped =
        r.result && Array.isArray(r.result.skippedPacks) && r.result.skippedPacks.length;
      notRun.push({ profile: r.profile, reason: skipped ? 'pack-skipped' : 'unknown-profile' });
    }
  }
  const first = (ran[0] || runs[0] || {}).result;
  if (!first || typeof first !== 'object') return first;
  if (!ran.length) {
    return Object.assign({}, first, {
      engine: Object.assign({}, first.engine, { profiles: [], profilesNotRun: notRun })
    });
  }

  // What a profile's rollups make of each finding of a check: by reason code
  // where a rollup judges the check by its findings (a contributor's
  // findingOutcomes), else the finding's tier. null where no rollup of the
  // profile names the check.
  function verdictsByRollups(result, check) {
    const occurrences = Array.isArray(check.occurrences) ? check.occurrences : [];
    const tier = (o) => (o && o.occurrenceOutcome) || check.outcome;
    let seen = false;
    const out = occurrences.map(() => []);
    for (const rollup of Array.isArray(result.rulesResults) ? result.rulesResults : []) {
      const details = rollup && rollup.data && rollup.data.details;
      const contributors =
        details && Array.isArray(details.contributors) ? details.contributors : [];
      const c = contributors.find((x) => x && x.testId === check.ruleId);
      if (!c) continue;
      seen = true;
      occurrences.forEach((o, i) => {
        if (c.byReasonCode && Array.isArray(c.findingOutcomes)) {
          out[i].push(c.findingOutcomes[i] || 'notApplicable');
        } else out[i].push(tier(o));
      });
    }
    if (!seen) return occurrences.map((o) => tier(o));
    return out.map((list) => worst(list) || 'notApplicable');
  }

  const checks = new Map(); // ruleId -> merged check
  const occurrenceMaps = new Map(); // ruleId -> Map(key -> merged occurrence)
  for (const r of ran) {
    for (const check of Array.isArray(r.result.checksResults) ? r.result.checksResults : []) {
      if (!check || !check.ruleId) continue;
      let merged = checks.get(check.ruleId);
      if (!merged) {
        merged = Object.assign({}, check, { verdicts: {}, occurrences: [] });
        checks.set(check.ruleId, merged);
        occurrenceMaps.set(check.ruleId, new Map());
      }
      const occurrences = Array.isArray(check.occurrences) ? check.occurrences : [];
      const verdicts = isTier(check.outcome) ? verdictsByRollups(r.result, check) : [];
      const byKey = occurrenceMaps.get(check.ruleId);
      occurrences.forEach((o, i) => {
        const key = keyOf(o);
        let m = byKey.get(key);
        if (!m) {
          m = Object.assign({}, o, { verdicts: {} });
          byKey.set(key, m);
          merged.occurrences.push(m);
        }
        m.verdicts[r.profile] = verdicts[i] || check.outcome;
      });
      // A check whose findings the profile counts nowhere found nothing it
      // is about: a pass there, as its rollups read it.
      merged.verdicts[r.profile] =
        isTier(check.outcome) && occurrences.length
          ? worst(verdicts.filter((v) => v !== 'notApplicable')) || 'pass'
          : check.outcome;
    }
  }
  const checksResults = [];
  for (const merged of checks.values()) {
    const outcome = worst(Object.values(merged.verdicts)) || merged.outcome;
    for (const m of merged.occurrences) {
      const tier = worst(Object.values(m.verdicts));
      if (isTier(tier) && (m.occurrenceOutcome || tier !== outcome)) m.occurrenceOutcome = tier;
    }
    checksResults.push(
      Object.assign(merged, { outcome, outcomeNormalized: normalizedOf(outcome) })
    );
  }

  const rollups = new Map();
  const profiles = {};
  for (const r of ran) {
    const outcomes = {};
    for (const rollup of Array.isArray(r.result.rulesResults) ? r.result.rulesResults : []) {
      if (!rollup || !rollup.ruleId) continue;
      outcomes[rollup.ruleId] = rollup.outcome;
      const had = rollups.get(rollup.ruleId);
      if (!had) rollups.set(rollup.ruleId, Object.assign({}, rollup, { profiles: [r.profile] }));
      else {
        had.profiles.push(r.profile);
        if (rank(rollup.outcome) > rank(had.outcome)) {
          rollups.set(rollup.ruleId, Object.assign({}, rollup, { profiles: had.profiles }));
        }
      }
    }
    const standards = Array.isArray(r.result.standards) ? r.result.standards : [];
    const engine = r.result.engine || {};
    profiles[r.profile] = Object.assign(
      { wcagVersion: engine.wcagVersion },
      standards.length ? { standards: standards.map((s) => s.key || s.standard) } : {},
      { rulesResults: outcomes }
    );
  }

  const unionBy = (lists, keyFn) => {
    const out = [];
    const seen = new Set();
    for (const list of lists) {
      for (const x of Array.isArray(list) ? list : []) {
        const k = keyFn(x);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(x);
      }
    }
    return out;
  };
  const results = ran.map((r) => r.result);
  const packs = unionBy(
    results.map((x) => x.engine && x.engine.packs),
    (x) => x
  ).sort();
  const skippedPacks = unionBy(
    runs.map((r) => r.result && r.result.skippedPacks),
    (x) => (x && x.name) || JSON.stringify(x)
  );
  const standards = unionBy(
    results.map((x) => x.standards),
    (x) => (x && (x.key || x.standard)) || JSON.stringify(x)
  );
  const overridden = unionBy(
    results.map((x) => x.overriddenBuiltinIds),
    (x) => x
  ).sort();

  const engine = Object.assign({}, first.engine, {
    profile: ran[0].profile,
    profiles: ran.map((r) => r.profile),
    ...(notRun.length ? { profilesNotRun: notRun } : {}),
    ...(packs.length ? { packs } : {})
  });
  void asked;
  const out = Object.assign({}, first, {
    engine,
    checksResults,
    rulesResults: Array.from(rollups.values()),
    profiles
  });
  if (standards.length) out.standards = standards;
  if (overridden.length || Array.isArray(first.overriddenBuiltinIds))
    out.overriddenBuiltinIds = overridden;
  if (skippedPacks.length) out.skippedPacks = skippedPacks;
  return out;
}

module.exports = { profileListOf, runProfiles, mergeProfileResults };
