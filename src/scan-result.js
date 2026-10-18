/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

const { wcagLinks, WCAG_VERSIONS, WCAG_CRITERIA } = require('./coverage/wcag-criteria.js');
const { NORMATIVE_STANDARDS } = require('./coverage/standards.js');
const { COMPLETE_APPLICABILITY } = require('./coverage/complete-applicability.js');
const { POLICY_CONTRACTS } = require('./policy/contracts.js');

/**
 * What the reporters (/report, /sarif, /junit, /earl, /baseline) accept as a
 * scan result. Each of them reads checksResults and treats a missing one as
 * empty, so a value of another shape, such as the { topFrame, frames } tree
 * runa11yCoreAcrossFrames returns, an array of results or a string, rendered
 * as a clean scan with nothing found: a CI gate passed on a page full of
 * violations. So did a missing result, as when a scan that broke returned
 * undefined. A reporter now takes only an object with a checksResults
 * array; other fields (url, engine, rulesResults) may be missing, and
 * render as unknown.
 */

function isCrossFrameResult(value) {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !Array.isArray(value.checksResults) &&
    !!value.topFrame &&
    typeof value.topFrame === 'object' &&
    Array.isArray(value.frames)
  );
}

function describe(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  if (typeof value !== 'object')
    return typeof value === 'undefined' ? 'undefined' : 'a ' + typeof value;
  return 'an object without a checksResults array';
}

// Throws a TypeError naming the caller unless `value` is one scan result.
function assertScanResult(value, caller) {
  if (isCrossFrameResult(value)) {
    throw new TypeError(
      caller +
        ' takes one scan result, and got a cross-frame result ({ topFrame, frames }). ' +
        'Pass result.topFrame, and each entry of result.frames (its topFrame, then its own frames) in a call of its own.'
    );
  }
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    !Array.isArray(value.checksResults)
  ) {
    throw new TypeError(
      caller +
        ' takes one scan result (an object with a checksResults array), and got ' +
        describe(value) +
        '.'
    );
  }
  return value;
}

// Every frame of a cross-frame result, the top frame first, then depth
// first: { frame, result }, or { frame, error } for a frame that did not
// answer. `frame` says which one it is: `path`, the selectors of the
// <iframe>/<frame> elements leading to it from the top document ([] for
// the top frame), its `title` and its `url`. A plain scan result is one
// frame.
function flattenCrossFrameResult(value) {
  if (!isCrossFrameResult(value)) {
    return value && typeof value === 'object' && Array.isArray(value.checksResults)
      ? [{ frame: { path: [], title: null, url: value.url || null }, result: value }]
      : [];
  }
  const out = [];
  const walk = (node, path) => {
    if (!node || typeof node !== 'object') return;
    const frame = {
      path,
      title: typeof node.title === 'string' ? node.title : null,
      url:
        typeof node.url === 'string'
          ? node.url
          : node.topFrame && typeof node.topFrame.url === 'string'
            ? node.topFrame.url
            : null
    };
    if (node.topFrame && typeof node.topFrame === 'object')
      out.push({ frame, result: node.topFrame });
    // A frame scanned on its own, as the browser bindings' frames(true) lists them.
    else if (Array.isArray(node.checksResults)) out.push({ frame, result: node });
    else out.push({ frame, error: typeof node.error === 'string' ? node.error : 'not scanned' });
    for (const child of Array.isArray(node.frames) ? node.frames : []) {
      const step =
        child && typeof child.selector === 'string' && child.selector ? child.selector : 'iframe';
      walk(child, path.concat(step));
    }
  };
  walk(value, []);
  return out;
}

// A result scanned with output.detail: 'findings' keeps only the rule,
// outcome and type of a pass or notApplicable (engine.outputDetail). Their
// title, description and meta are the catalog's, the same on every page:
// for a reporter they are read back from it, for the result's locale,
// mappings and profile, so a compact result reports as a full one would.
// The engine keeps whole what that can't fill in (a scan with packs, a
// custom rule, a rule the caller's messages reword); a rule the catalog
// doesn't have, in a result made before it did, is named by its id. Any
// other result is returned as it is.
function expandCompactResult(result) {
  if (!result || !result.engine || result.engine.outputDetail !== 'findings') return result;
  // Required here, not at the top: the package's entry requires this file.
  const { getCheckDefById } = require('./index.js');
  const options = {
    locale: result.engine.locale && result.engine.locale.resolved,
    mappings: result.engine.mappings || [],
    ...(result.engine.profile ? { profile: result.engine.profile } : {})
  };
  const checksResults = result.checksResults.map((c) => {
    if (!c || c.meta) return c;
    const def = getCheckDefById(c.ruleId, options);
    const base = { occurrences: [], ...c };
    if (!def) return { ...base, title: c.ruleId, meta: { ruleId: c.ruleId } };
    return {
      ...base,
      title: def.title,
      description: def.description,
      i18n: def.i18n,
      meta: {
        ruleId: def.ruleId,
        helpUrl: def.helpUrl,
        tags: def.tags,
        normativeMappings: def.normativeMappings,
        standard: def.standard,
        category: def.category
      }
    };
  });
  return { ...result, checksResults };
}

// A value as text, or '' when it has none: null, undefined, or a value
// whose toString throws, which no stored result should stop a report on.
function textOf(value) {
  if (value == null) return '';
  try {
    return String(value);
  } catch {
    return '';
  }
}

// A result's checks and rollups as a reporter reads them. A stored result
// may have been written by another tool or edited by hand: a rule id that
// is not a string (a number) is read as its text, and normativeMappings or
// rulesResults that is not a list (an object, a string) as none, as
// standardsOf and wcagScopeOf already read them. A check or rollup that is
// not an object is left for each reporter to skip. Any other value is
// returned as it is.
function coercedResult(result) {
  if (!result || typeof result !== 'object' || !Array.isArray(result.checksResults)) return result;
  const entry = (e) => {
    if (!e || typeof e !== 'object' || Array.isArray(e)) return e;
    let read = e;
    if (e.ruleId != null && typeof e.ruleId !== 'string')
      read = { ...read, ruleId: textOf(e.ruleId) };
    const meta = e.meta;
    if (
      meta &&
      typeof meta === 'object' &&
      meta.normativeMappings != null &&
      !Array.isArray(meta.normativeMappings)
    )
      read = { ...read, meta: { ...meta, normativeMappings: [] } };
    return read;
  };
  const read = { ...result, checksResults: result.checksResults.map(entry).map(tieredCheck) };
  if (Array.isArray(result.rulesResults)) read.rulesResults = result.rulesResults.map(entry);
  else if (result.rulesResults != null) read.rulesResults = [];
  // A rollup rolled up from a check read otherwise is rolled up again.
  const changed = new Map();
  read.checksResults.forEach((check, i) => {
    const given = result.checksResults[i];
    if (check !== given && check.outcome !== given.outcome)
      changed.set(check.ruleId, check.outcome);
  });
  if (changed.size && read.rulesResults) {
    read.rulesResults = read.rulesResults.map((rollup) => {
      const details = rollup && rollup.data && rollup.data.details;
      const contributors = details && Array.isArray(details.contributors) && details.contributors;
      if (!contributors || !contributors.some((c) => c && changed.has(c.testId))) return rollup;
      return rolledUp(
        rollup,
        contributors.map((c) => {
          if (!c || !changed.has(c.testId)) return c;
          const now = changed.get(c.testId);
          // A rule judged by its findings' reason codes keeps that judgement:
          // only a check now pass or notApplicable replaces it, and a check
          // lowered to cantTell lowers a fail.
          if (!c.byReasonCode) return { ...c, outcome: now };
          const outcome =
            now === 'pass' || now === 'notApplicable'
              ? now
              : now === 'cantTell' && c.outcome === 'fail'
                ? 'cantTell'
                : c.outcome;
          return { ...c, outcome, checkOutcome: now };
        })
      );
    });
  }
  return read;
}

// The policy a check was run under, as far as reading it back needs: the
// outcomes it allows, and whether a manual rule's fail is coerced. The
// check carries the engineOptions it ran with (policyContract, policy),
// read as the engine resolves them (src/policy/resolvePolicy.js), but
// quietly: a value it doesn't know was warned about when it ran.
function policyOf(check) {
  const options =
    check.engineOptions && typeof check.engineOptions === 'object' ? check.engineOptions : {};
  const contract =
    typeof options.policyContract === 'string' &&
    Object.prototype.hasOwnProperty.call(POLICY_CONTRACTS, options.policyContract)
      ? POLICY_CONTRACTS[options.policyContract]
      : POLICY_CONTRACTS.a11y;
  const given =
    options.policyContract && typeof options.policyContract === 'object'
      ? options.policyContract
      : {};
  const overrides = options.policy && typeof options.policy === 'object' ? options.policy : {};
  const outcomesIn = (list) => {
    const known = Array.isArray(list) ? list.filter((o) => OUTCOMES.includes(o)) : [];
    return known.length ? known : null;
  };
  const allowedOutcomes =
    outcomesIn(overrides.allowedOutcomes) ||
    (Array.isArray(given.allowedOutcomes) ? given.allowedOutcomes : contract.allowedOutcomes);
  const flag = [overrides.coerceManualFailToCantTell, given.coerceManualFailToCantTell].find(
    (v) => typeof v === 'boolean'
  );
  return {
    allowedOutcomes,
    coerceManualFail: typeof flag === 'boolean' ? flag : !!contract.coerceManualFailToCantTell
  };
}

const OUTCOMES = ['fail', 'pass', 'cantTell', 'notApplicable'];

// An occurrence's tier as the reporters read it: occurrenceOutcome, or the
// outcome an older label-in-name wrote; undefined for none.
function tierOf(occurrence) {
  if (!occurrence || typeof occurrence !== 'object') return undefined;
  for (const tier of [occurrence.occurrenceOutcome, occurrence.outcome]) {
    if (tier === 'fail' || tier === 'cantTell') return tier;
  }
  return undefined;
}

// A check read by the rule the engine applies as it writes one
// (normalizeRuleResult in scripts/build-core.js), so a result stored
// before the engine did reads as it would now. Its outcome agrees with
// its occurrences' tiers: a fail-tier occurrence makes it fail, and a fail
// whose occurrences are all cantTell-tier is cantTell. A fail its policy
// doesn't allow is cantTell, with the fail kept in policyOutcome, and a
// manual rule's is cantTell, as the policy coerces it; either way the
// fail-tier occurrences become cantTell with it. Otherwise SARIF and JUnit,
// reading the tiers, failed what EARL and the baseline, reading the
// outcome, did not, and it could not be baselined. Any other check is
// returned as it is.
function tieredCheck(check) {
  if (!check || typeof check !== 'object' || !Array.isArray(check.occurrences)) return check;
  const tiers = check.occurrences.map(tierOf);
  let outcome = check.outcome;
  if ((outcome === 'cantTell' || outcome === 'pass') && tiers.includes('fail')) outcome = 'fail';
  else if (outcome === 'fail' && tiers.length && tiers.every((t) => t === 'cantTell'))
    outcome = 'cantTell';
  let policyOutcome = check.policyOutcome;
  let demoted = false;
  if (outcome === 'fail') {
    const policy = policyOf(check);
    if (!policy.allowedOutcomes.includes('fail') || check.policyOutcome === 'fail') {
      policyOutcome = 'fail';
      outcome = 'cantTell';
      demoted = true;
    } else if (policy.coerceManualFail && check.type === 'manual') {
      outcome = 'cantTell';
      demoted = true;
    }
  }
  if (outcome === check.outcome && !(demoted && tiers.includes('fail'))) return check;
  const read = { ...check, outcome };
  if ('outcomeNormalized' in check)
    read.outcomeNormalized = outcome === 'notApplicable' ? 'inapplicable' : outcome;
  if (policyOutcome !== undefined) read.policyOutcome = policyOutcome;
  if (demoted)
    read.occurrences = check.occurrences.map((o) =>
      tierOf(o) === 'fail' ? { ...o, occurrenceOutcome: 'cantTell' } : o
    );
  return read;
}

// A rollup with its contributors' outcomes read again, rolled up by the
// engine's precedence (docs/OUTPUT_SCHEMA.md): any fail, then any cantTell
// or missing rule, then all notApplicable, else pass; an outcome its policy
// doesn't allow is cantTell, with it kept in policyOutcome, as for a check.
function rolledUp(rollup, contributors) {
  const count = (outcome) => contributors.filter((c) => c && c.outcome === outcome).length;
  const metrics = {
    failCount: count('fail'),
    cantTellCount: count('cantTell'),
    notApplicableCount: count('notApplicable'),
    passCount: count('pass'),
    missingCount: count('missing')
  };
  const details = rollup.data.details;
  const total = Array.isArray(details.checksIds) ? details.checksIds.length : contributors.length;
  let outcome = 'pass';
  let reasonCode = 'composite.rollup.pass.otherwise';
  if (metrics.failCount) {
    outcome = 'fail';
    reasonCode = 'composite.rollup.fail.anyFail';
  } else if (metrics.cantTellCount) {
    outcome = 'cantTell';
    reasonCode = 'composite.rollup.cantTell.anyCantTell';
  } else if (metrics.missingCount) {
    outcome = 'cantTell';
    reasonCode = contributors.some((c) => c && c.notSelected)
      ? 'composite.rollup.cantTell.notSelectedChild'
      : 'composite.rollup.cantTell.missingChild';
  } else if (total && metrics.notApplicableCount === total) {
    // As the engine does: a WCAG criterion is notApplicable only when its
    // rules find every case it applies to (coverage/complete-applicability.js).
    const meta = rollup.meta || {};
    const sc = meta.standard
      ? []
      : (Array.isArray(meta.normativeMappings) ? meta.normativeMappings : [])
          .filter((m) => m && m.standard === 'WCAG')
          .map((m) => String(m.requirement));
    if (sc.every((n) => Object.prototype.hasOwnProperty.call(COMPLETE_APPLICABILITY, n))) {
      outcome = 'notApplicable';
      reasonCode = 'composite.rollup.notApplicable.allInapplicable';
    } else {
      outcome = 'cantTell';
      reasonCode = 'composite.rollup.cantTell.partialCoverage';
    }
  } else if (!total) {
    outcome = 'cantTell';
    reasonCode = 'composite.rollup.cantTell.emptyComposite';
  }
  const read = { ...rollup, outcome };
  delete read.policyOutcome;
  if (!policyOf(rollup).allowedOutcomes.includes(outcome)) {
    read.outcome = 'cantTell';
    read.policyOutcome = outcome;
  }
  if ('outcomeNormalized' in rollup)
    read.outcomeNormalized = read.outcome === 'notApplicable' ? 'inapplicable' : read.outcome;
  read.data = {
    ...rollup.data,
    details: { ...details, reasonCode, contributors, metrics: { ...details.metrics, ...metrics } }
  };
  if (rollup.i18nParams && typeof rollup.i18nParams === 'object')
    read.i18nParams = { ...rollup.i18nParams, reasonCode };
  return read;
}

// What a reporter that takes frames reads: every frame of one scan result
// or of a cross-frame result, a compact one read back in full. Throws a
// TypeError naming the caller for anything else, as assertScanResult does.
function framesOf(value, caller) {
  const frames = isCrossFrameResult(value)
    ? flattenCrossFrameResult(value)
    : flattenCrossFrameResult(assertScanResult(value, caller));
  return frames.map((f) =>
    f.result ? { ...f, result: expandCompactResult(coercedResult(f.result)) } : f
  );
}

// A frame's path as one line, for a reader: "#ads > iframe → iframe".
function framePathText(path) {
  return Array.isArray(path) ? path.join(' \u2192 ') : '';
}

// Where an occurrence or a margin is, as one line: its selector, preceded by
// the selectors of the shadow hosts that lead to it, outermost first, joined
// with " >>> " as shadow-piercing selectors write it ("x-card >>> button").
// A selector alone would name another element where two components hold the
// same markup. '' when there is no selector.
function locationText(item) {
  const selector = item && typeof item.selector === 'string' ? item.selector : '';
  if (!selector) return '';
  const hosts =
    item && Array.isArray(item.shadowHostSelectors)
      ? item.shadowHostSelectors.filter((s) => typeof s === 'string' && s)
      : [];
  return hosts.length ? [...hosts, selector].join(' >>> ') : selector;
}

// The message of a rule that did not complete: it threw, or returned
// nothing usable. The engine reports one as cantTell with no occurrences and
// its error (docs/OUTPUT_SCHEMA.md); every other cantTell names what it
// could not decide, and a fail always names what failed. Null otherwise.
function ruleErrorOf(check) {
  if (!check || check.outcome !== 'cantTell') return null;
  if (Array.isArray(check.occurrences) && check.occurrences.length) return null;
  return typeof check.error === 'string' && check.error.trim() ? check.error.trim() : null;
}

// A rule's help link, for a reporter to show: its own meta.helpUrl, or
// else the Understanding document of the first WCAG criterion it maps to,
// which explains the criterion and the techniques that meet it. Only an
// absolute http(s) URL is ever given, so no other scheme (javascript:, a
// relative path that would resolve against the report) is linked. Null
// when there is none: { url, kind: 'rule' } or { url, kind:
// 'understanding', sc, title }.
function helpLinkOf(check) {
  const meta = check && check.meta;
  const own = meta && typeof meta.helpUrl === 'string' ? meta.helpUrl.trim() : '';
  if (/^https?:\/\/[^\s]+$/i.test(own)) return { url: own, kind: 'rule' };
  const mappings = (meta && Array.isArray(meta.normativeMappings) && meta.normativeMappings) || [];
  for (const m of mappings) {
    if (!m || m.type || (m.standard != null && m.standard !== 'WCAG') || !m.requirement) continue;
    const given = typeof m.understandingUrl === 'string' ? m.understandingUrl.trim() : '';
    const links = wcagLinks(m.requirement, m.version || '2.2');
    const url = /^https?:\/\/[^\s]+$/i.test(given) ? given : links && links.understandingUrl;
    if (url) {
      return { url, kind: 'understanding', sc: String(m.requirement), title: m.title || '' };
    }
  }
  return null;
}

function helpUrlOf(check) {
  const link = helpLinkOf(check);
  return link ? link.url : null;
}

// The standards a result names besides WCAG, as a reporter shows them, in
// registry order: [{ key, standard, titleLang?, note? }]. A result carries
// them (result.standards), so it renders without the registry that produced
// it. A result made before it did, or naming none, is read against the
// built-in registry, with each note translated by `tr(key)` when given.
function standardsOf(result, tr) {
  return standardsInfoOf(result, tr).standards;
}

// standardsOf, and whether the result's own list could not be relied on:
// { standards, unreadable }. A standard a rollup's meta.standard or a
// built-in or pack rule's mappings name that the list lacks (it is missing,
// damaged, or names the standard otherwise) is added after it under its own
// name, keyed by that name, so its entries are never taken for WCAG ones or
// dropped. A standard only a custom rule names is no registered one, and is
// left out as before.
function standardsInfoOf(result, tr) {
  const given = result ? result.standards : undefined;
  const usable = (s) =>
    s && typeof s.key === 'string' && typeof s.standard === 'string' && s.standard !== 'WCAG';
  let listed;
  let unreadable;
  if (Array.isArray(given)) {
    // A standard listed twice is shown once.
    const seenNames = new Set();
    listed = given.filter(usable).filter((s) => {
      if (seenNames.has(s.standard)) return false;
      seenNames.add(s.standard);
      return true;
    });
    unreadable = !given.length || given.filter(usable).length !== given.length;
  } else {
    unreadable = given !== undefined;
    listed = NORMATIVE_STANDARDS.map((s) => {
      const report = s.report || {};
      const note = report.noteKey && tr ? tr(report.noteKey) : '';
      return {
        key: s.key,
        standard: s.standard,
        ...(report.titleLang ? { titleLang: report.titleLang } : {}),
        ...(note ? { note } : {})
      };
    });
  }
  const names = new Set(listed.map((s) => s.standard));
  const keys = new Set(listed.map((s) => s.key).concat('wcag'));
  const added = [];
  const add = (name) => {
    if (typeof name !== 'string' || !name || name === 'WCAG' || names.has(name)) return;
    names.add(name);
    const base = keyOfName(name);
    let key = base;
    for (let n = 2; keys.has(key); n++) key = `${base}-${n}`;
    keys.add(key);
    added.push({ key, standard: name });
  };
  const checks = Array.isArray(result && result.checksResults) ? result.checksResults : [];
  const rollups = Array.isArray(result && result.rulesResults) ? result.rulesResults : [];
  // The custom rules, by the ids each result's options echo.
  const custom = new Set();
  for (const r of checks.concat(rollups)) {
    const list = r && r.engineOptions && r.engineOptions.customRules;
    for (const c of Array.isArray(list) ? list : []) if (c && c.id) custom.add(String(c.id).trim());
  }
  const isRollup = new Set(rollups);
  for (const r of checks.concat(rollups)) {
    const meta = r && r.meta;
    if (!meta || typeof meta !== 'object' || custom.has(r.ruleId)) continue;
    if (isRollup.has(r)) add(meta.standard);
    for (const m of Array.isArray(meta.normativeMappings) ? meta.normativeMappings : []) {
      if (m && typeof m === 'object' && m.requirement) add(m.standard);
    }
  }
  return { standards: listed.concat(added), unreadable: unreadable || added.length > 0 };
}

// A key for a standard known only by its name: "Sample Standard" is
// "sample-standard".
function keyOfName(name) {
  let key = '';
  for (const ch of name.toLowerCase()) {
    if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) key += ch;
    else if (key && !key.endsWith('-')) key += '-';
  }
  if (key.endsWith('-')) key = key.slice(0, -1);
  return key || 'standard';
}

// The standard among `standards` (standardsOf) an entry belongs to, or null:
// WCAG itself, or a standard the result does not list, such as one only a
// custom rule declares.
function standardOfEntryIn(standards, m) {
  if (!m || typeof m !== 'object' || !m.requirement) return null;
  return standards.find((s) => s.standard === m.standard) || null;
}

const LEVEL_RANK = { A: 1, AA: 2, AAA: 3 };

// Whether a rule's WCAG criterion is one the scan reports on, by the target
// the result records: a test on one normativeMappings entry. A criterion
// the scan reports as a rollup (rulesResults) always is, which keeps a
// rollup named by id above engine.wcagLevel, a partly checked criterion,
// and 4.1.1 when a 2.2 scan selected it. Any other is out when it is above
// engine.wcagLevel, or not in force in engine.wcagVersion (4.1.1 under 2.2,
// a 2.2 criterion under 2.1): the engine left it out of rulesResults for
// that reason. A result that records neither field, as an older engine's,
// keeps every criterion, and so does one WCAG doesn't list (a custom rule's
// own numbering), whose level and version are unknown.
function wcagScopeOf(result) {
  const engine = (result && result.engine) || {};
  const version = WCAG_VERSIONS.includes(engine.wcagVersion) ? engine.wcagVersion : null;
  const level = LEVEL_RANK[engine.wcagLevel] ? engine.wcagLevel : null;
  if (!version && !level) return () => true;
  const reported = new Set();
  const rollups = Array.isArray(result && result.rulesResults) ? result.rulesResults : [];
  for (const rollup of rollups) {
    const mappings = rollup && rollup.meta && rollup.meta.normativeMappings;
    for (const m of Array.isArray(mappings) ? mappings : []) {
      if (m && m.requirement && (m.standard == null || m.standard === 'WCAG') && !m.type)
        reported.add(String(m.requirement).trim());
    }
  }
  const rank = (v) => WCAG_VERSIONS.indexOf(v);
  return (m) => {
    const number = String((m && m.requirement) || '').trim();
    if (reported.has(number)) return true;
    const known = WCAG_CRITERIA.find((c) => c.sc === number);
    if (!known) return true;
    if (version) {
      if (rank(known.introduced) > rank(version)) return false;
      if (known.removed && rank(known.removed) <= rank(version)) return false;
    }
    if (level) {
      // Its level in the scan's version, or, with none recorded, the latest.
      const levels = Object.values(known.levels);
      const own = (version && known.levels[version]) || levels[levels.length - 1];
      if (LEVEL_RANK[own] > LEVEL_RANK[level]) return false;
    }
    return true;
  };
}

module.exports = {
  assertScanResult,
  isCrossFrameResult,
  flattenCrossFrameResult,
  expandCompactResult,
  coercedResult,
  textOf,
  framesOf,
  framePathText,
  locationText,
  ruleErrorOf,
  helpLinkOf,
  helpUrlOf,
  standardsOf,
  standardsInfoOf,
  standardOfEntryIn,
  wcagScopeOf
};
