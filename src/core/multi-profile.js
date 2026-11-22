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
    .map((p) => lowerAscii(p.trim()));
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
// Profile names match case in ASCII only, as the selection matches rule ids,
// tags and profiles (asciiLowerChar in scripts/build-core.js): a full Unicode
// fold reads the Kelvin sign (U+212A) as "k" (round 8, NW-11).
function lowerAscii(value) {
  return String(value).replace(/[A-Z]/g, (c) => c.toLowerCase());
}

function runProfiles(engineOptions, run) {
  // output.maxOccurrencesPerRule applies to the result as a whole, once its
  // outcomes, rollups and profiles' verdicts are decided.
  // Without the option the result is returned as it is. A real promise (an
  // asynchronous scan) is told apart by its tag, not by a then method: a
  // page may put then on Object.prototype, and every plain result then has
  // one.
  const result = runProfilesUncapped(engineOptions, run);
  const out = engineOptions && engineOptions.output;
  if (!out || typeof out !== 'object' || out.maxOccurrencesPerRule === undefined) return result;
  return Object.prototype.toString.call(result) === '[object Promise]'
    ? result.then((x) => capOccurrences(x, engineOptions))
    : capOccurrences(result, engineOptions);
}

/**
 * output.maxOccurrencesPerRule: at most that many occurrences of each check
 * result, the rest counted, not listed. Applied after everything is decided
 * (outcomes, rollups, a scan of several profiles' verdicts), so no outcome,
 * rollup or count changes. The occurrences kept are the failing ones first,
 * then the undecided that lean fail, then the other undecided, then the
 * rest, each in the order the rule gave them, and they stay in that order.
 * A capped result says what it left out: occurrencesOmitted (how many),
 * occurrencesOmittedByOutcome (by tier) and occurrencesOmittedLeaningFail
 * (the undecided ones that lean fail) on each check result that lost any,
 * and engine.occurrenceCap for the scan. Any value but a whole number of 1
 * or more leaves the result as it is (enforceEngineOptions says so).
 */
function capOccurrences(result, engineOptions) {
  const output =
    engineOptions && typeof engineOptions === 'object' ? engineOptions.output : undefined;
  const max = output && typeof output === 'object' ? output.maxOccurrencesPerRule : undefined;
  if (typeof max !== 'number' || !Number.isInteger(max) || max < 1) return result;
  if (!result || typeof result !== 'object' || !Array.isArray(result.checksResults)) return result;
  const tierOf = (check, o) => {
    const own = o && typeof o === 'object' ? o.occurrenceOutcome || o.outcome : undefined;
    if (own === 'fail' || own === 'cantTell' || own === 'pass') return own;
    return check.outcome === 'fail' || check.outcome === 'cantTell' || check.outcome === 'pass'
      ? check.outcome
      : 'notApplicable';
  };
  const rankOf = (check, o) => {
    const tier = tierOf(check, o);
    if (tier === 'fail') return 0;
    if (tier === 'cantTell') return o && o.lean && o.lean.toward === 'fail' ? 1 : 2;
    return 3;
  };
  const keptByRule = new Map();
  let omittedTotal = 0;
  const checksResults = result.checksResults.map((check) => {
    const list = check && Array.isArray(check.occurrences) ? check.occurrences : null;
    if (!list || list.length <= max) return check;
    const kept = list
      .map((o, i) => i)
      .sort((a, b) => rankOf(check, list[a]) - rankOf(check, list[b]) || a - b)
      .slice(0, max)
      .sort((a, b) => a - b);
    const byOutcome = {};
    let leaningFail = 0;
    const keep = new Set(kept);
    list.forEach((o, i) => {
      if (keep.has(i)) return;
      const tier = tierOf(check, o);
      byOutcome[tier] = (byOutcome[tier] || 0) + 1;
      if (rankOf(check, o) === 1) leaningFail += 1;
    });
    const omitted = list.length - kept.length;
    omittedTotal += omitted;
    keptByRule.set(check.ruleId, { kept, total: list.length });
    // The undecided ones that lean fail, which a lean-fail gate counts, are
    // counted apart from the other undecided ones.
    return Object.assign(
      {},
      check,
      {
        occurrences: kept.map((i) => list[i]),
        occurrencesOmitted: omitted,
        occurrencesOmittedByOutcome: byOutcome
      },
      leaningFail ? { occurrencesOmittedLeaningFail: leaningFail } : {}
    );
  });
  if (!omittedTotal) return result;
  // A rollup's record of what it made of each finding follows the findings
  // kept, as it is in the order of the check's occurrences.
  const rulesResults = Array.isArray(result.rulesResults)
    ? result.rulesResults.map((rollup) => {
        const details = rollup && rollup.data && rollup.data.details;
        const contributors = details && Array.isArray(details.contributors) && details.contributors;
        if (!contributors) return rollup;
        let touched = false;
        const next = contributors.map((c) => {
          const cap = c && keptByRule.get(c.testId);
          if (!cap || !Array.isArray(c.findingOutcomes) || c.findingOutcomes.length !== cap.total)
            return c;
          touched = true;
          return Object.assign({}, c, {
            findingOutcomes: cap.kept.map((i) => c.findingOutcomes[i])
          });
        });
        if (!touched) return rollup;
        return Object.assign({}, rollup, {
          data: Object.assign({}, rollup.data, {
            details: Object.assign({}, details, { contributors: next })
          })
        });
      })
    : result.rulesResults;
  const out = Object.assign({}, result, {
    engine: Object.assign({}, result.engine, {
      occurrenceCap: {
        maxOccurrencesPerRule: max,
        occurrencesOmitted: omittedTotal,
        rulesCapped: keptByRule.size
      }
    }),
    checksResults,
    rulesResults
  });
  // A mark the merge of several profiles reads stays with the result.
  if (result.__profileNotApplied) {
    try {
      Object.defineProperty(out, '__profileNotApplied', {
        value: result.__profileNotApplied,
        configurable: true
      });
    } catch {
      // nothing to keep
    }
  }
  return out;
}

function runProfilesUncapped(engineOptions, run) {
  const thenable = (v) => !!v && typeof v.then === 'function';
  // A frame's scan that starts with no time budget left (frame-scan.js) is
  // asked to start no rule (__budgetSpent, set by the engine only, not
  // enumerable): each profile's scan is asked the same, so it lists its
  // selection in notRun. The scan's budget (__scanTimeBudgetMs), which the
  // warnings give, goes with it. Read only as the options' own, never from
  // Object.prototype (round 12, A12-2).
  const flagOf = (from, key) =>
    from &&
    typeof from === 'object' &&
    Object.prototype.hasOwnProperty.call(from, key) &&
    !Object.prototype.propertyIsEnumerable.call(from, key)
      ? from[key]
      : undefined;
  const carryBudgetSpent = (from, to) => {
    if (flagOf(from, '__budgetSpent') === true) {
      Object.defineProperty(to, '__budgetSpent', { value: true });
    }
    const scanBudget = flagOf(from, '__scanTimeBudgetMs');
    if (
      typeof scanBudget === 'number' &&
      !Object.prototype.hasOwnProperty.call(to, '__scanTimeBudgetMs')
    ) {
      Object.defineProperty(to, '__scanTimeBudgetMs', { value: scanBudget });
    }
    return to;
  };
  const allowFail = policyAllowsFail(engineOptions);
  const asked =
    engineOptions && typeof engineOptions === 'object' ? engineOptions.profile : undefined;
  if (Array.isArray(asked)) {
    // Names are matched without case, as a single profile's are: one asked
    // twice in two cases runs once.
    const unique = profileNamesOf(asked);
    // By index: filter() skips an empty slot ([, 'wcag22-aa']), which was
    // then dropped without a word, as a blank name was.
    let ignored = 0;
    for (let i = 0; i < asked.length; i++) {
      const p = asked[i];
      if (typeof p !== 'string' || !p.trim()) ignored++;
    }
    if (ignored) {
      try {
        console.warn(
          '[surea11y] engineOptions.profile: ignoring ' +
            ignored +
            ' item(s) that are not a profile name (a string that is not blank).'
        );
      } catch {
        // no console
      }
    }
    if (unique.length <= 1) {
      return withOwnVerdicts(
        run(
          carryBudgetSpent(
            engineOptions,
            Object.assign({}, engineOptions, { profile: unique.length ? unique[0] : undefined })
          )
        ),
        allowFail
      );
    }
    const runs = [];
    // engineOptions.timeBudgetMs is the whole scan's: each profile after the
    // first gets what is left of it, and one that would start with none left
    // is not run (engine.profilesNotRun, reason timeBudget).
    const budget =
      engineOptions &&
      typeof engineOptions.timeBudgetMs === 'number' &&
      Number.isFinite(engineOptions.timeBudgetMs) &&
      engineOptions.timeBudgetMs > 0
        ? engineOptions.timeBudgetMs
        : null;
    const clock = () => {
      try {
        if (typeof performance !== 'undefined' && performance && performance.now) {
          return performance.now();
        }
      } catch {
        // no performance clock
      }
      return Date.now();
    };
    const started = budget === null ? 0 : clock();
    const spentOnArrival = flagOf(engineOptions, '__budgetSpent') === true;
    // The scan's budget: this one's, or, in a frame, the whole scan's.
    const scanBudget =
      typeof flagOf(engineOptions, '__scanTimeBudgetMs') === 'number'
        ? flagOf(engineOptions, '__scanTimeBudgetMs')
        : budget;
    // What a later profile's scan is given: what is left, and the scan's
    // budget for its warnings.
    const withScanBudget = (options) => {
      if (
        scanBudget !== null &&
        !Object.prototype.hasOwnProperty.call(options, '__scanTimeBudgetMs')
      ) {
        Object.defineProperty(options, '__scanTimeBudgetMs', { value: scanBudget });
      }
      return options;
    };
    const step = (i) => {
      if (i >= unique.length) {
        const merged = mergeProfileResults(runs, unique, allowFail);
        // The budget the scan was given, not what was left of it for the
        // profile that ran out.
        if (merged && merged.engine && merged.engine.incomplete) {
          merged.engine.incomplete.timeBudgetMs = scanBudget;
        }
        return merged;
      }
      const left = budget === null ? null : budget - (clock() - started);
      // A frame's scan reached with no budget left (spentOnArrival) starts
      // its first profile only, as a scan whose first profile used it all
      // does: the others are not run, not run with nothing started (round
      // 12, A12-4).
      if (i > 0 && ((left !== null && left <= 0) || spentOnArrival)) {
        // Not run, but its rules are listed in notRun, as a profile's scan
        // that ran out lists those it did not start: its scan is asked to
        // start none (__budgetSpent), which only works out its selection.
        const dryOptions = withScanBudget(
          carryBudgetSpent(engineOptions, Object.assign({}, engineOptions, { profile: unique[i] }))
        );
        if (!spentOnArrival) Object.defineProperty(dryOptions, '__budgetSpent', { value: true });
        // Its warning names the profile, not a frame.
        Object.defineProperty(dryOptions, '__budgetSpentAt', { value: 'profile' });
        const skippedOf = (dry) => {
          const skipped = {};
          Object.defineProperty(skipped, '__profileNotApplied', { value: 'timeBudget' });
          const applied = dry && dry.engine ? dry.engine.profile : undefined;
          const ids =
            typeof applied === 'string' &&
            lowerAscii(applied) === lowerAscii(unique[i]) &&
            Array.isArray(dry.notRun)
              ? dry.notRun.filter((n) => n && n.ruleId).map((n) => n.ruleId)
              : [];
          Object.defineProperty(skipped, '__rulesNotRun', { value: ids });
          runs.push({ profile: unique[i], result: skipped });
          return step(i + 1);
        };
        const dry = run(dryOptions);
        return thenable(dry) ? dry.then(skippedOf) : skippedOf(dry);
      }
      const result = run(
        withScanBudget(
          carryBudgetSpent(
            engineOptions,
            Object.assign(
              {},
              engineOptions,
              { profile: unique[i] },
              left !== null && i > 0 ? { timeBudgetMs: left } : {}
            )
          )
        )
      );
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
  return withOwnVerdicts(run(engineOptions), allowFail);
}

/**
 * Whether the scan's policy lets a check fail: a caller's policy or policy
 * contract whose allowedOutcomes leave out 'fail' makes every fail
 * cantTell (policyOutcome keeps it), and a standard's verdict, which comes
 * after that step, must not undo it. Core's own contracts all allow it.
 */
function policyAllowsFail(engineOptions) {
  try {
    const eo = engineOptions && typeof engineOptions === 'object' ? engineOptions : {};
    for (const source of [eo.policy, eo.policyContract]) {
      if (source && typeof source === 'object' && Array.isArray(source.allowedOutcomes)) {
        return source.allowedOutcomes.includes('fail');
      }
    }
  } catch {
    // unreadable options: the scan's own reading decides
  }
  return true;
}

// A check made to fail by a standard's verdict, held to a policy that
// doesn't allow fail: cantTell, as the policy step makes a rule's own fail,
// with policyOutcome saying what was found.
function capToPolicy(check, allowFail) {
  if (allowFail || !check || check.outcome !== 'fail') return check;
  check.policyOutcome = 'fail';
  check.outcome = 'cantTell';
  check.outcomeNormalized = 'cantTell';
  if (Array.isArray(check.occurrences)) {
    check.occurrences = check.occurrences.map((o) =>
      o && typeof o === 'object' && o.occurrenceOutcome === 'fail'
        ? Object.assign({}, o, { occurrenceOutcome: 'cantTell' })
        : o
    );
  }
  return check;
}

/**
 * A scan of one profile gives a finding the verdict the profile's own
 * rollups give it, as a scan of several does (mergeProfileResults): where a
 * rollup judges a check by its findings' reason codes (a pack's standard,
 * such as WAI-ARIA's), a finding it settles as a failure fails, and so does
 * its check, so SARIF, JUnit and baselines gate on it. A check no rollup
 * judges that way keeps its outcome. A promise gets the same once it settles.
 */
function withOwnVerdicts(result, allowFail = true) {
  // A result first: a page may add then to Object.prototype, which makes
  // any object look like a promise.
  if (result && !Array.isArray(result.checksResults) && typeof result.then === 'function') {
    return result.then((r) => withOwnVerdicts(r, allowFail));
  }
  if (!result || !Array.isArray(result.checksResults)) return result;
  const rollups = Array.isArray(result.rulesResults) ? result.rulesResults : [];
  for (const check of result.checksResults) {
    const occurrences = check && Array.isArray(check.occurrences) ? check.occurrences : [];
    if (!occurrences.length || check.outcome === 'fail') continue;
    const fails = occurrences.map(() => false);
    for (const rollup of rollups) {
      const details = rollup && rollup.data && rollup.data.details;
      const contributors =
        details && Array.isArray(details.contributors) ? details.contributors : [];
      const c = contributors.find((x) => x && x.testId === check.ruleId);
      if (!c || !c.byReasonCode || !Array.isArray(c.findingOutcomes)) continue;
      occurrences.forEach((o, i) => {
        if (c.findingOutcomes[i] === 'fail') fails[i] = true;
      });
    }
    if (!fails.some(Boolean)) continue;
    check.occurrences = occurrences.map((o, i) =>
      fails[i] && o && typeof o === 'object'
        ? Object.assign({}, o, { occurrenceOutcome: 'fail' })
        : o
    );
    check.outcome = 'fail';
    check.outcomeNormalized = 'fail';
    capToPolicy(check, allowFail);
  }
  return result;
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
  const name = typeof profile === 'string' ? lowerAscii(profile.trim()) : '';
  if (!name) return false;
  if (Array.isArray(declared) && declared.includes(name)) return true;
  const starts = (prefix) => !!prefix && (name === prefix || name.indexOf(prefix + '-') === 0);
  for (const packName of Array.isArray(packNames) ? packNames : []) {
    if (typeof packName !== 'string') continue;
    let id = lowerAscii(packName.trim());
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
function mergeProfileResults(runs, asked, allowFail = true) {
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
      typeof applied === 'string' && lowerAscii(applied) === lowerAscii(String(r.profile));
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
              : why === 'timeBudget'
                ? 'timeBudget'
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
      // A check whose findings the profile counts nowhere keeps the outcome
      // its scan of that profile gave, as a scan of the profile alone
      // reports it (round 8, PK-1: it read as a pass, and SARIF, JUnit and
      // baselines dropped a failure the profile alone reports).
      merged.verdicts[r.profile] =
        isTier(check.outcome) && occurrences.length
          ? worst(verdicts.filter((v) => v !== 'notApplicable')) || check.outcome
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
      capToPolicy(
        Object.assign(merged, { outcome, outcomeNormalized: normalizedOf(outcome) }),
        allowFail
      )
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
      engine.law ? { law: engine.law } : {},
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
  // The law of the scan where every profile serves the same one; otherwise
  // none, as the first profile's would speak for the others. Each profile's
  // own is in profiles[name].law.
  const laws = engines.map((e) => (e.law && typeof e.law.id === 'string' ? e.law.id : null));
  const oneLaw = laws.length && laws[0] !== null && laws.every((id) => id === laws[0]);
  const engine = Object.assign({}, first.engine, {
    ...(wcagVersion ? { wcagVersion } : {}),
    ...(wcagLevel ? { wcagLevel } : {}),
    ...(mappings.length ? { mappings } : {}),
    profile: ran[0].profile,
    profiles: ran.map((r) => r.profile),
    ...(notRun.length ? { profilesNotRun: notRun } : {}),
    ...(packs.length ? { packs } : {})
  });
  if (!oneLaw) delete engine.law;
  // The rules a profile's scan did not start, and the profiles not started,
  // for the time budget: the merged scan is incomplete.
  // A profile the budget left unstarted lists every rule of its selection.
  const rulesNotRun = [];
  for (const r of runs) {
    if (ran.includes(r)) {
      for (const n of Array.isArray(r.result.notRun) ? r.result.notRun : []) {
        if (n && n.ruleId) rulesNotRun.push(Object.assign({}, n, { profile: r.profile }));
      }
    } else if (r.result && Array.isArray(r.result.__rulesNotRun)) {
      for (const ruleId of r.result.__rulesNotRun) {
        rulesNotRun.push({ ruleId, reason: 'timeBudget', profile: r.profile });
      }
    }
  }
  const budgetProfiles = notRun.filter((n) => n.reason === 'timeBudget');
  const incomplete = engines.find((e) => e.incomplete);
  if (incomplete || budgetProfiles.length) {
    engine.incomplete = Object.assign(
      { reason: 'timeBudget' },
      incomplete ? incomplete.incomplete : {},
      { rulesNotRun: rulesNotRun.length },
      budgetProfiles.length ? { profilesNotRun: budgetProfiles.length } : {}
    );
  } else delete engine.incomplete;
  void asked;
  const out = Object.assign({}, first, {
    engine,
    checksResults,
    rulesResults: [...rollups.values()],
    profiles
  });
  if (standards.length) out.standards = standards;
  if (overridden.length || Array.isArray(first.overriddenBuiltinIds))
    out.overriddenBuiltinIds = overridden;
  if (skippedPacks.length) out.skippedPacks = skippedPacks;
  if (rulesNotRun.length) out.notRun = rulesNotRun;
  else delete out.notRun;
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
  runProfilesUncapped,
  capOccurrences,
  withOwnVerdicts,
  lowerAscii,
  policyAllowsFail,
  capToPolicy,
  mergeProfileResults,
  noteProfileNotApplied
};
