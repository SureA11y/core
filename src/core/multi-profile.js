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
 * The profile names a list asks a scan of several to run, in order, each
 * once: trimmed and matched without case, as a single profile's are, and
 * whatever is not a name left out.
 */
function profileNamesOf(asked) {
  const names = (Array.isArray(asked) ? asked : [])
    .filter((p) => typeof p === 'string' && p.trim())
    .map((p) => p.trim().toLowerCase());
  return names.filter((p, i) => names.indexOf(p) === i);
}

/**
 * The options of each scan runProfiles runs for these: one per profile a
 * list names (profileNamesOf), or, for any other profile option, the options
 * as they are. A list of no name is a scan without a profile.
 */
function profileOptionsOf(engineOptions) {
  const asked =
    engineOptions && typeof engineOptions === 'object' ? engineOptions.profile : undefined;
  if (!Array.isArray(asked)) return [engineOptions];
  const unique = profileNamesOf(asked);
  if (!unique.length) return [Object.assign({}, engineOptions, { profile: undefined })];
  return unique.map((p) => Object.assign({}, engineOptions, { profile: p }));
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
    // Names are matched without case, as a single profile's are: one asked
    // twice in two cases runs once.
    const unique = profileNamesOf(asked);
    const ignored = asked.filter((p) => typeof p !== 'string');
    if (ignored.length) {
      try {
        console.warn(
          '[surea11y] engineOptions.profile: ignoring ' +
            ignored.length +
            ' item(s) that are not a profile name (a string).'
        );
      } catch {
        // no console
      }
    }
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
 * Whether a profile name a scan has no profile of may be one of the packs it
 * skipped (`packNames`, as name@version), for a scan of several to say
 * pack-skipped rather than unknown-profile: a name the packs are known to
 * declare (`declared`, lowercase), or one that starts with a namespace such
 * a pack's name suggests (its scope, or its package name with or without
 * "pack"), since every profile of a pack starts with its namespace and "-".
 */
function mayBeSkippedPackProfile(profile, packNames, declared) {
  const name = typeof profile === 'string' ? profile.trim().toLowerCase() : '';
  if (!name) return false;
  if (Array.isArray(declared) && declared.includes(name)) return true;
  const starts = (prefix) => !!prefix && (name === prefix || name.indexOf(prefix + '-') === 0);
  for (const packName of Array.isArray(packNames) ? packNames : []) {
    if (typeof packName !== 'string') continue;
    let id = packName.trim().toLowerCase();
    const at = id.lastIndexOf('@');
    if (at > 0) id = id.slice(0, at);
    const slash = id.indexOf('/');
    const scope = id[0] === '@' && slash > 0 ? id.slice(1, slash) : '';
    const base = slash >= 0 ? id.slice(slash + 1) : id;
    const bare = base.replace(/^pack-/, '').replace(/-pack$/, '');
    if ([scope, base, bare, bare.split('-')[0]].some(starts)) return true;
  }
  return false;
}

/**
 * Marks a scan's result with why its profile was not applied, when it
 * wasn't (resolveEffectiveRunOnly's profileNotApplied: 'unknown' or
 * 'overridden', or 'pack-skipped' for a name a skipped pack may have), for
 * mergeProfileResults to say. Not enumerable, so it never
 * reaches a result's JSON.
 */
function noteProfileNotApplied(result, reason) {
  if (!reason) return result;
  const mark = (r) => {
    if (r && typeof r === 'object') {
      try {
        Object.defineProperty(r, '__profileNotApplied', { value: reason, configurable: true });
      } catch {
        // frozen: the merge says unknown-profile
      }
    }
    return r;
  };
  return result && typeof result.then === 'function' ? result.then(mark) : mark(result);
}

/**
 * One result from the scans of several profiles, `runs` ([{ profile,
 * result }], in the order asked). A profile its scan didn't apply (no such
 * profile, its pack skipped, a runOnly that selects the rules instead) is
 * listed in engine.profilesNotRun and judges nothing. Of the others:
 *
 * - checksResults: each rule once. Its `verdicts` are each profile's outcome
 *   for it, and its `outcome` the worst of them (fail, cantTell, pass,
 *   notApplicable); `checkOutcome` is the rule's own, before any standard
 *   judged its findings by reason code, which its WCAG criteria read. Each finding is listed once, with `verdicts` saying
 *   what each profile that ran the rule makes of it: its tier, or what a
 *   standard's rollups make of it by its reason code (a WCAG cantTell that
 *   a standard fails), or notApplicable where a standard doesn't count it.
 *   Its `severity` is the highest a profile that fails or asks about it
 *   gives it (the highest of all where none does), in any order of the
 *   profiles, with the rule's own as `ruleSeverity` where that differs.
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
  const SEVERITY_ORDER = ['minor', 'moderate', 'serious', 'critical'];
  const highestSeverity = (list) => {
    let best = null;
    for (const s of list) {
      if (SEVERITY_ORDER.indexOf(s) > SEVERITY_ORDER.indexOf(best)) best = s;
    }
    return best;
  };
  const worst = (list) => {
    let out = null;
    for (const o of list) if (o && rank(o) > rank(out)) out = o;
    return out;
  };
  const isTier = (o) => o === 'fail' || o === 'cantTell';
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
  const unionList = (a, b) =>
    unionBy([a, b], (x) => (typeof x === 'string' ? x : JSON.stringify(x)));
  const reasonCodeOf = (o) =>
    o && o.data && o.data.details && typeof o.data.details.reasonCode === 'string'
      ? o.data.details.reasonCode
      : '';
  // An element's finding, as each profile's scan of the same page finds it:
  // where it is and why. Two findings of one rule on one element for the
  // same reason (two attributes it doesn't allow) differ by what else they
  // say, and else by their order, which each scan of the page shares.
  const baseKeyOf = (o) =>
    JSON.stringify([
      (o && o.frameUrl) || '',
      (o && o.selector) || '',
      (o && o.structuralPath) || '',
      reasonCodeOf(o),
      (o && o.html) || '',
      (o && o.summary) || '',
      (o && o.data && o.data.details && JSON.stringify(o.data.details)) || ''
    ]);
  const normalizedOf = (o) => (o === 'notApplicable' ? 'inapplicable' : o);

  const ran = [];
  const notRun = [];
  for (const r of runs) {
    const applied = r.result && r.result.engine ? r.result.engine.profile : undefined;
    const same =
      typeof applied === 'string' && applied.toLowerCase() === String(r.profile).toLowerCase();
    if (r.result && typeof r.result === 'object' && same) ran.push(r);
    else {
      // A name no profile has is unknown-profile, unless the scan marked it
      // as one a pack it skipped may have: a list with a typo beside a
      // skipped pack's profile names the typo as such.
      const why = r.result && r.result.__profileNotApplied;
      notRun.push({
        profile: r.profile,
        reason:
          why === 'overridden'
            ? 'overridden-by-selection'
            : why === 'pack-skipped'
              ? 'pack-skipped'
              : 'unknown-profile'
      });
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
  // The WCAG version the result reports, the highest of the profiles'.
  const WCAG_ORDER = ['2.0', '2.1', '2.2'];
  let reportedWcag;
  const targetingRuns = ran.filter((r) => r.result.engine && r.result.engine.wcagLevel);
  for (const r of targetingRuns.length ? targetingRuns : ran) {
    const v = r.result.engine && r.result.engine.wcagVersion;
    if (WCAG_ORDER.indexOf(v) > WCAG_ORDER.indexOf(reportedWcag)) reportedWcag = v;
  }
  // Which occurrences took what a question needs from a scan of the WCAG
  // version reported: that scan's text wins, in any order of the profiles.
  const textOfReported = new WeakSet();
  for (const r of ran) {
    for (const check of Array.isArray(r.result.checksResults) ? r.result.checksResults : []) {
      if (!check || !check.ruleId) continue;
      let merged = checks.get(check.ruleId);
      if (!merged) {
        merged = Object.assign({}, check, {
          verdicts: {},
          occurrences: [],
          ownOutcomes: [],
          severities: {}
        });
        checks.set(check.ruleId, merged);
        occurrenceMaps.set(check.ruleId, new Map());
      }
      const occurrences = Array.isArray(check.occurrences) ? check.occurrences : [];
      merged.ownOutcomes.push({
        outcome: check.outcome,
        wcagVersion: r.result.engine ? r.result.engine.wcagVersion : undefined
      });
      // The severity this profile gives the rule (a profile's own, or the
      // rule's), and the rule's own.
      merged.severities[r.profile] = check.severity;
      if (check.ruleSeverity && !merged.ownSeverity) merged.ownSeverity = check.ruleSeverity;
      const verdicts = isTier(check.outcome) ? verdictsByRollups(r.result, check) : [];
      const byKey = occurrenceMaps.get(check.ruleId);
      const seenHere = new Map(); // base key -> how many so far in this scan
      occurrences.forEach((o, i) => {
        const base = baseKeyOf(o);
        const nth = seenHere.get(base) || 0;
        seenHere.set(base, nth + 1);
        const key = base + '#' + nth;
        const ofReported = !!r.result.engine && r.result.engine.wcagVersion === reportedWcag;
        let m = byKey.get(key);
        if (!m) {
          m = Object.assign({}, o, { verdicts: {} });
          byKey.set(key, m);
          merged.occurrences.push(m);
          if (ofReported) textOfReported.add(m);
        } else {
          // What a question needs to be answered, from whichever profile
          // asks it, a scan of the WCAG version reported first ("WCAG 2.2
          // removed the criterion", not 2.0's errata): the same whatever
          // order the profiles were listed in.
          const replace = ofReported && !textOfReported.has(m);
          for (const field of ['uncertainty', 'lean', 'howToCheck', 'hint']) {
            if (o[field] === undefined) continue;
            if (m[field] === undefined || replace) m[field] = o[field];
          }
          if (ofReported) textOfReported.add(m);
        }
        m.verdicts[r.profile] = verdicts[i] || check.outcome;
      });
      if (merged !== check) {
        // What each profile's scan says of the rule, all of it: the
        // rollups it feeds and the requirements it maps to, whichever
        // profile was listed first.
        if (Array.isArray(check.rollupIds)) {
          merged.rollupIds = unionList(merged.rollupIds, check.rollupIds);
        }
        const mappings =
          check.meta && Array.isArray(check.meta.normativeMappings)
            ? check.meta.normativeMappings
            : null;
        if (mappings) {
          const had =
            merged.meta && Array.isArray(merged.meta.normativeMappings)
              ? merged.meta.normativeMappings
              : [];
          merged.meta = Object.assign({}, merged.meta, {
            normativeMappings: unionBy([had, mappings], (x) => JSON.stringify(x))
          });
        }
      }
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
    // The rule's own outcome, as its scans report it before any standard
    // judges its findings: what a WCAG criterion it maps reads (EARL). Only
    // the scans of the WCAG version the result reports count: a rule judged
    // by an earlier version (4.1.1 Parsing, which WCAG 2.2 drops) under a
    // standard that keeps it is not a failure of the WCAG reported.
    const ofReported = merged.ownOutcomes.filter((o) => o.wcagVersion === reportedWcag);
    merged.checkOutcome =
      worst((ofReported.length ? ofReported : merged.ownOutcomes).map((o) => o.outcome)) ||
      merged.outcome;
    delete merged.ownOutcomes;
    // The severity is the highest any profile that fails or asks about the
    // rule gives it, whatever order the profiles were listed in, so a gate
    // on severity reads the same; with none, the highest of all. The rule's
    // own stays as ruleSeverity where that differs.
    const severities = merged.severities;
    delete merged.severities;
    const own = merged.ownSeverity || merged.ruleSeverity || merged.severity;
    delete merged.ownSeverity;
    const judging = Object.keys(severities).filter((p) => isTier(merged.verdicts[p]));
    const severity = highestSeverity(
      (judging.length ? judging : Object.keys(severities)).map((p) => severities[p])
    );
    if (severity) {
      merged.severity = severity;
      if (own && own !== severity) merged.ruleSeverity = own;
      else delete merged.ruleSeverity;
    }
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
    // wcagLevel only for a profile that targets WCAG: one that doesn't
    // (WAI-ARIA's) carries core's default version, which judges nothing.
    profiles[r.profile] = Object.assign(
      { wcagVersion: engine.wcagVersion },
      engine.wcagLevel ? { wcagLevel: engine.wcagLevel } : {},
      standards.length ? { standards: standards.map((s) => s.key || s.standard) } : {},
      { rulesResults: outcomes },
      // Each profile's own timings, where they were asked for: the result's
      // perfStats are the first profile's.
      r.result.perfStats ? { perfStats: r.result.perfStats } : {}
    );
  }

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

  // The WCAG the scan was judged by: the highest version and level of its
  // profiles', whichever was listed first; the standards' mappings of each.
  const VERSIONS = ['2.0', '2.1', '2.2'];
  const LEVELS = ['A', 'AA', 'AAA'];
  const highest = (values, order) => {
    let out;
    for (const v of values)
      if (order.includes(v) && (out === undefined || order.indexOf(v) > order.indexOf(out)))
        out = v;
    return out;
  };
  const engines = results.map((x) => x.engine || {});
  // A profile with no WCAG target of its own (a standard that maps no WCAG
  // level, as WAI-ARIA's) carries core's default version: the version is
  // that of the profiles that target WCAG, where any does.
  const targeting = engines.filter((e) => e.wcagLevel);
  const wcagVersion = highest(
    (targeting.length ? targeting : engines).map((e) => e.wcagVersion),
    VERSIONS
  );
  const wcagLevel = highest(
    engines.map((e) => e.wcagLevel),
    LEVELS
  );
  const mappings = unionBy(
    engines.map((e) => e.mappings),
    (x) => (typeof x === 'string' ? x : JSON.stringify(x))
  );
  const engine = Object.assign({}, first.engine, {
    ...(wcagVersion ? { wcagVersion } : {}),
    ...(wcagLevel ? { wcagLevel } : {}),
    ...(mappings.length ? { mappings } : {}),
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
  // A custom rule skipped is one no profile ran: one profile's selection
  // can leave out a rule another runs.
  const skippedLists = ran.map((r) =>
    Array.isArray(r.result.skippedCustomRules) ? r.result.skippedCustomRules : []
  );
  if (skippedLists.length && skippedLists.some((list) => list.length)) {
    const idOf = (x) => (x && typeof x.id === 'string' ? x.id : JSON.stringify(x));
    out.skippedCustomRules = skippedLists[0].filter((entry) =>
      skippedLists.every((list) => list.some((x) => idOf(x) === idOf(entry)))
    );
  }
  return out;
}

module.exports = {
  profileNamesOf,
  profileOptionsOf,
  mayBeSkippedPackProfile,
  runProfiles,
  mergeProfileResults,
  noteProfileNotApplied
};
