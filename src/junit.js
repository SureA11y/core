/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Renders one scan result as a JUnit XML report (docs/JUNIT.md), the test
 * report format CI dashboards read natively: GitLab's merge request widget,
 * Azure DevOps' Tests tab, Jenkins, CircleCI.
 *
 * One <testsuite> per WCAG Success Criterion, one <testcase> per rule mapped
 * to it. A criterion is the unit people track, and a rule rather than an
 * occurrence keeps test counts stable when the same defect repeats. Suite,
 * classname and testcase names are the criterion number and the rule id, in
 * English in every locale, as CI keys test history on them; the criterion's
 * translated title is a `title` property. Suites
 * come from each rule's own WCAG mappings rather than from the composites, so
 * every rule that ran is reported even when composites were excluded; a rule
 * mapped to no criterion goes into a final "Other checks" suite, and a rule
 * mapped to two criteria appears in both. A criterion the scan's WCAG level
 * or version left out of the rollups gets no suite either: a rule mapped
 * only to such criteria goes into "Other checks", its failures skipped
 * rather than counted, so an AA scan does not fail on an AAA criterion.
 *
 * A rule that did not complete (it threw) is an <error>, JUnit's own
 * element for a test that could not run, so a scan that covered less than
 * it was asked to is not read as one that passed.
 *
 * JUnit has no "could not tell". A cantTell rule is <skipped> by default:
 * surfaced for review, never turning a build red, the same line the SARIF
 * reporter draws with "warning". `cantTellAs: 'failure'` gates on it instead,
 * and `leanFailAs: 'failure'` gates only on the undecided findings whose
 * evidence points to fail (their `lean`), as <failure type="leanFail">:
 * those of every rule, best-practice ones included, or, with
 * `leanFailWcagOnly`, of the rules mapped to a WCAG criterion.
 * notApplicable rules are left out unless `includeNotApplicable` is set, since
 * a page has hundreds of them and none says anything.
 *
 * `baselineEntries` (docs/BASELINE.md) drops fail occurrences already
 * recorded there, as SARIF does. A rule whose every failure is known is
 * <skipped> with the count, not reported as passing: it did not pass. Under
 * leanFailAs, a finding that leans fail and has an entry marked
 * `lean: 'fail'` does not gate either.
 *
 * No timings are invented. `time` is "0" throughout, so the same scan always
 * renders byte-identical XML, and `timestamp` appears only when the result
 * carries one (the engine has no clock of its own).
 */

const { knownOccurrences } = require('./baseline.js');
const { withHowToCheck } = require('./how-to-check-lazy.js');
const {
  framesOf,
  framePathText,
  locationText,
  ruleErrorOf,
  helpUrlOf,
  standardsOf,
  standardOfEntryIn,
  wcagScopeOf,
  occurrenceOutcome,
  leaningOccurrencesOf
} = require('./scan-result.js');

const OTHER_SUITE = 'Other checks';

// XML 1.0 forbids most control characters, and lone surrogates, outright,
// escaped or not, and markup scraped from a page can carry them.
function isXmlChar(codePoint) {
  return (
    codePoint === 0x9 ||
    codePoint === 0xa ||
    codePoint === 0xd ||
    (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
    (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
    codePoint >= 0x10000
  );
}

function xmlText(value) {
  let text = '';
  for (const ch of String(value == null ? '' : value)) {
    if (isXmlChar(ch.codePointAt(0))) text += ch;
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function compareCriteria(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff) return diff;
  }
  return 0;
}

// Same test as src/sarif.js and src/report.js.
function isWcagCriterion(m) {
  return !!(m && m.requirement && (m.standard == null || m.standard === 'WCAG') && !m.type);
}

function mappingsOf(result) {
  return (result && result.meta && result.meta.normativeMappings) || [];
}

// What one rule contributes, decided once for a rule that appears in two
// suites. `baseline` holds what the baseline knows (knownOccurrences), and
// `gating` the findings that lean fail and gate under leanFailAs
// (leaningOccurrencesOf).
function classify(check, baseline, gating, options) {
  const occurrences = Array.isArray(check.occurrences) ? check.occurrences.filter(Boolean) : [];
  const failing = [];
  const undecided = [];
  let baselined = 0;

  if (check.outcome === 'fail' || check.outcome === 'cantTell') {
    for (const occurrence of occurrences) {
      const outcome = occurrenceOutcome(check, occurrence);
      if (outcome === 'fail') {
        if (baseline.known.has(occurrence)) {
          baselined++;
          continue;
        }
        failing.push(occurrence);
      } else if (outcome === 'cantTell') {
        undecided.push(occurrence);
      }
    }
  }

  // With leanFailAs: 'failure', an undecided occurrence whose evidence
  // points to fail gates as a failure, unless the baseline knows it (an entry
  // marked lean: 'fail'); the rest stay as cantTellAs says.
  const leaning = [];
  let leanBaselined = 0;
  if (options.leanFailAs === 'failure') {
    for (const o of undecided) {
      if (!gating.has(o)) continue;
      if (baseline.knownLeaning.has(o)) leanBaselined++;
      else leaning.push(o);
    }
  }

  let status;
  if (ruleErrorOf(check)) status = 'error';
  else if (failing.length) status = 'failure';
  else if (leaning.length) status = 'failure';
  else if (undecided.length) status = options.cantTellAs === 'failure' ? 'failure' : 'skipped';
  else if (baselined) status = 'skipped';
  else if (check.outcome === 'notApplicable') status = 'notApplicable';
  else if (check.outcome === 'cantTell')
    status = options.cantTellAs === 'failure' ? 'failure' : 'skipped';
  else status = 'passed';

  return {
    check,
    status,
    failing,
    undecided,
    leaning,
    baselined,
    leanBaselined,
    cantTellAs: options.cantTellAs
  };
}

function describeOccurrence(occurrence) {
  const lines = [];
  const message = [occurrence.summary, occurrence.hint].filter(Boolean).join(' ');
  lines.push(`- ${message || '(no message)'}`);
  if (occurrence.selector) lines.push(`  selector: ${locationText(occurrence)}`);
  if (typeof occurrence.html === 'string' && occurrence.html) {
    lines.push(`  html: ${occurrence.html}`);
  }
  return lines.join('\n');
}

// A finding that leans fail and gates as one: what any finding says, then
// why it likely fails and what could make that wrong, and how a person
// confirms it (howToCheck), so the build log says what to look at before
// anyone opens the HTML report.
function describeLeaning(occurrence) {
  const lines = [describeOccurrence(occurrence)];
  const lean = occurrence.lean || {};
  if (typeof lean.why === 'string' && lean.why) lines.push(`  likely fails: ${lean.why}`);
  if (typeof lean.caution === 'string' && lean.caution) lines.push(`  caution: ${lean.caution}`);
  const how = occurrence.howToCheck;
  if (how && Array.isArray(how.steps) && how.steps.length) {
    lines.push('  how to check:');
    how.steps.forEach((step, i) => lines.push(`    ${i + 1}. ${step}`));
    if (typeof how.failWhen === 'string' && how.failWhen)
      lines.push(`  fails when: ${how.failWhen}`);
  }
  return lines.join('\n');
}

// Where to read how to fix it, when the rule says.
function helpLine(check) {
  const url = helpUrlOf(check);
  return url ? [`help: ${url}`] : [];
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function needReview(n) {
  return `${plural(n, 'occurrence')} ${n === 1 ? 'needs' : 'need'} manual review`;
}

function renderTestcase(entry, classname, indent) {
  const { check, status, failing, undecided, baselined } = entry;
  const leaning = entry.leaning || [];
  const open = `${indent}<testcase classname="${xmlText(classname)}" name="${xmlText(check.ruleId)}" time="0"`;
  const inner = [];

  if (status === 'error') {
    const error = ruleErrorOf(check);
    inner.push(
      `${indent}  <error type="ruleError" message="${xmlText(`The rule did not complete: ${error}`)}">${xmlText(error)}</error>`
    );
  } else if (status === 'failure' && failing.length) {
    const message = `${plural(failing.length, 'failing occurrence')}: ${failing[0].summary || check.ruleId}`;
    inner.push(
      `${indent}  <failure type="fail" message="${xmlText(message)}">${xmlText([...failing.map(describeOccurrence), ...helpLine(check)].join('\n'))}</failure>`
    );
  } else if (status === 'failure' && leaning.length && entry.cantTellAs !== 'failure') {
    const message = `${plural(leaning.length, 'occurrence')} likely ${leaning.length === 1 ? 'fails' : 'fail'}: ${leaning[0].summary || check.ruleId}`;
    inner.push(
      `${indent}  <failure type="leanFail" message="${xmlText(message)}">${xmlText([...leaning.map(describeLeaning), ...helpLine(check)].join('\n'))}</failure>`
    );
  } else if (status === 'failure') {
    const message = undecided.length ? needReview(undecided.length) : 'Needs manual review';
    inner.push(
      `${indent}  <failure type="cantTell" message="${xmlText(message)}">${xmlText([...undecided.map(describeOccurrence), ...helpLine(check)].join('\n'))}</failure>`
    );
  } else if (status === 'skipped') {
    const parts = [];
    if (entry.outside) {
      const verb = entry.outside.length > 1 ? 'are' : 'is';
      parts.push(
        `Not counted: ${entry.outside.join(', ')} ${verb} outside the scan's target, ${entry.target}`
      );
      if (failing.length) parts.push(plural(failing.length, 'failing occurrence'));
    }
    if (undecided.length) parts.push(needReview(undecided.length));
    else if (check.outcome === 'cantTell' && !baselined) parts.push('Needs manual review');
    if (baselined) parts.push(`${plural(baselined, 'known failure')} recorded in the baseline`);
    if (entry.leanBaselined) {
      parts.push(`${plural(entry.leanBaselined, 'known likely failure')} recorded in the baseline`);
    }
    inner.push(`${indent}  <skipped message="${xmlText(parts.join('; '))}"/>`);
  } else if (status === 'notApplicable') {
    inner.push(`${indent}  <skipped message="Not applicable"/>`);
  }

  // Undecided occurrences on a rule that also failed, or that were skipped,
  // are still worth reading, and so are the failures of a rule outside the
  // scan's target; they go where dashboards show test output.
  const out = [];
  if (status === 'skipped' && entry.outside && failing.length) {
    out.push('Failing:', ...failing.map(describeOccurrence), ...helpLine(check));
  }
  if (undecided.length && !(status === 'failure' && !failing.length)) {
    out.push('Needs manual review:', ...undecided.map(describeOccurrence));
  }
  if (out.length) inner.push(`${indent}  <system-out>${xmlText(out.join('\n'))}</system-out>`);

  return inner.length ? `${open}>\n${inner.join('\n')}\n${indent}</testcase>` : `${open}/>`;
}

function countStatus(entries, status) {
  return entries.filter((e) => e.status === status).length;
}

// The conditions the page was rendered under, as flat properties: a test
// view shows them next to the profile, and a failure that comes and goes
// with the viewport width can be traced to the width it ran at.
function environmentProperties(env) {
  if (!env || typeof env !== 'object') return [];
  const vp = env.viewport;
  return [
    ['layout', typeof env.layout === 'boolean' ? String(env.layout) : null],
    ['viewport', vp && vp.width != null && vp.height != null ? `${vp.width}x${vp.height}` : null],
    ['devicePixelRatio', env.devicePixelRatio != null ? String(env.devicePixelRatio) : null],
    ['colorScheme', env.colorScheme],
    ['forcedColors', env.forcedColors],
    ['fonts', env.fonts]
  ];
}

// Worst first: a criterion fails when any part of it fails.
const OUTCOME_RANK = ['fail', 'cantTell', 'pass', 'notApplicable'];

// A criterion's title and outcome from the composites that check it. Its
// outcome is the worst of theirs, since one part failing fails the
// criterion. Its title is the composite's, or, for a criterion checked in
// parts ("Name, role, value: accessible name", "Name, role, value: ARIA
// validity"), the name they share. French writes a space before the colon
// ("Nom, rôle et valeur : nom accessible"), which isn't part of the name.
function criterionOf(list) {
  if (!Array.isArray(list) || !list.length) return null;
  const rank = (o) => (OUTCOME_RANK.includes(o) ? OUTCOME_RANK.indexOf(o) : OUTCOME_RANK.length);
  let outcome = null;
  for (const c of list) {
    if (c && typeof c.outcome === 'string' && (outcome === null || rank(c.outcome) < rank(outcome)))
      outcome = c.outcome;
  }
  const titles = list.map((c) => (c && typeof c.title === 'string' ? c.title : '')).filter(Boolean);
  let title = titles[0] || '';
  if (titles.length > 1) {
    const heads = titles.map((t) => t.split(/\s*:\s/)[0]);
    title = heads.every((h) => h === heads[0]) ? heads[0] : titles.join('; ');
  }
  return { title, outcome };
}

// The suites of one frame's result. A child frame of a cross-frame result
// gets suites of its own, named after it, since its criteria are met or
// failed in its own document.
function frameSuites(result, frame, baseline, opts, totals) {
  const engine = (result && result.engine) || {};
  // The standards the result names besides WCAG, in registry order.
  const standards = standardsOf(result);

  // The composites that ran for each criterion: one for most, several
  // where a criterion is checked in parts (4.1.2's name and its ARIA
  // validity).
  const composites = new Map();
  for (const composite of (result && result.rulesResults) || []) {
    const sc = mappingsOf(composite).find(isWcagCriterion);
    if (!sc) continue;
    if (!composites.has(sc.requirement)) composites.set(sc.requirement, []);
    composites.get(sc.requirement).push(composite);
  }

  // The criteria the scan's WCAG level and version leave out get no suite,
  // as they get no rollup (docs/ENGINE_OPTIONS.md).
  const inScope = wcagScopeOf(result);
  const target = `WCAG ${[engine.wcagVersion, engine.wcagLevel].filter(Boolean).join(' ')}`;

  const suites = new Map(); // criterion (or OTHER_SUITE) -> { entries, level, standards }
  const checks = ((result && result.checksResults) || []).filter((c) => c && c.ruleId);
  const gating = new Set(
    leaningOccurrencesOf(result, { wcagOnly: opts.leanFailWcagOnly }).map((l) => l.occurrence)
  );
  for (const check of checks) {
    let entry = classify(check, baseline, gating, opts);
    if (entry.status === 'notApplicable' && !opts.includeNotApplicable) continue;

    const mappings = mappingsOf(check);
    const all = mappings.filter(isWcagCriterion);
    const criteria = all.filter(inScope);
    // A rule whose every criterion is outside the scan's target still ran,
    // and is listed with the rules mapped to none; a failure there is
    // skipped with its occurrences shown, so it is seen without failing a
    // build scoped to the target.
    if (all.length && !criteria.length) {
      const outside = [...new Set(all.map((m) => `WCAG ${m.requirement}`))];
      entry = { ...entry, outside, target };
      if (entry.status === 'failure') entry.status = 'skipped';
    }
    const keys = criteria.length
      ? [...new Set(criteria.map((m) => String(m.requirement)))]
      : [OTHER_SUITE];
    for (const key of keys) {
      if (!suites.has(key)) suites.set(key, { entries: [], level: null, standards: new Map() });
      const suite = suites.get(key);
      suite.entries.push(entry);
      const own = criteria.find((m) => String(m.requirement) === key);
      if (own && !suite.level) suite.level = own.conformanceLevel || own.level || null;
      // Another standard's entry goes under the criteria it corresponds to
      // (its `wcagSc`); one that names none (no field, or an empty list, for a
      // requirement outside WCAG) belongs to every criterion of its rule, and
      // a rule with no criterion keeps all of its entries.
      for (const m of mappings) {
        const standard = standardOfEntryIn(standards, m);
        if (!standard) continue;
        const named = Array.isArray(m.wcagSc) && m.wcagSc.length ? m.wcagSc.map(String) : null;
        if (key !== OTHER_SUITE && named && !named.includes(key)) continue;
        if (!suite.standards.has(standard.key)) suite.standards.set(standard.key, new Set());
        suite.standards.get(standard.key).add(String(m.requirement));
      }
    }
  }

  const keys = [...suites.keys()].sort((a, b) => {
    if (a === OTHER_SUITE) return 1;
    if (b === OTHER_SUITE) return -1;
    return compareCriteria(a, b);
  });

  const runProperties = [
    ['engine', engine.tag],
    ['schemaVersion', engine.schemaVersion],
    ['wcagVersion', engine.wcagVersion],
    ['profile', engine.profile],
    ['optInRules', Array.isArray(engine.optInRules) ? engine.optInRules.join(',') : null],
    ...environmentProperties(engine.environment),
    ['locale', engine.locale && engine.locale.resolved],
    ['url', result && result.url],
    ['frame', framePathText(frame.path)]
  ].filter(([, v]) => v != null && v !== '');
  // A child frame's suites say whose they are.
  const prefix = frame.path.length ? `Frame ${framePathText(frame.path)}: ` : '';

  return keys.map((key) => {
    const suite = suites.get(key);
    const entries = suite.entries
      .slice()
      .sort((a, b) => a.check.ruleId.localeCompare(b.check.ruleId));
    const criterion = key === OTHER_SUITE ? null : criterionOf(composites.get(key));
    // Names are the same in every locale, since CI test history is keyed
    // on them: a scan read in French must not give "new" tests. The title,
    // which is translated, is a property.
    const name = prefix + (key === OTHER_SUITE ? OTHER_SUITE : `WCAG ${key}`);
    // A child frame's test cases carry its path too, so a CI that keys a
    // test on classname and name keeps them apart from the page's.
    const classname =
      (frame.path.length ? `frame ${framePathText(frame.path)} ` : '') +
      (key === OTHER_SUITE ? 'other' : `wcag-${key}`);
    const failures = countStatus(entries, 'failure');
    const errors = countStatus(entries, 'error');
    const skipped = countStatus(entries, 'skipped') + countStatus(entries, 'notApplicable');
    totals.tests += entries.length;
    totals.failures += failures;
    totals.errors += errors;
    totals.skipped += skipped;

    const properties = [
      ...(key === OTHER_SUITE ? [] : [['wcagCriterion', key]]),
      ...(criterion && criterion.title ? [['title', criterion.title]] : []),
      ...(suite.level ? [['wcagLevel', suite.level]] : []),
      ...standards.flatMap((standard) =>
        [...(suite.standards.get(standard.key) || [])]
          .sort((a, b) => compareCriteria(a, b) || a.localeCompare(b))
          .map((requirement) => [standard.key, requirement])
      ),
      ...(criterion && criterion.outcome ? [['criterionOutcome', criterion.outcome]] : []),
      ...runProperties
    ];

    const timestamp = result && result.timestamp ? ` timestamp="${xmlText(result.timestamp)}"` : '';
    return [
      `  <testsuite name="${xmlText(name)}" tests="${entries.length}" failures="${failures}" errors="${errors}" skipped="${skipped}" time="0"${timestamp}>`,
      '    <properties>',
      ...properties.map(([k, v]) => `      <property name="${xmlText(k)}" value="${xmlText(v)}"/>`),
      '    </properties>',
      ...entries.map((entry) => renderTestcase(entry, classname, '    ')),
      '  </testsuite>'
    ].join('\n');
  });
}

function renderJunitReport(result, options = {}) {
  let frames = framesOf(result, 'renderJunitReport');
  // cantTellAs is 'skipped' (the default) or 'failure', in any case. Another
  // value is a mistake that would quietly not gate, so it throws.
  const cantTellAs =
    options.cantTellAs === undefined || options.cantTellAs === null
      ? 'skipped'
      : String(options.cantTellAs).trim().toLowerCase();
  if (cantTellAs !== 'skipped' && cantTellAs !== 'failure') {
    throw new TypeError(
      `renderJunitReport: cantTellAs must be 'skipped' or 'failure', not ${JSON.stringify(options.cantTellAs)}`
    );
  }
  // leanFailAs is 'skipped' (the default) or 'failure': an undecided
  // occurrence whose evidence points to fail then gates as a failure.
  const leanFailAs =
    options.leanFailAs === undefined || options.leanFailAs === null
      ? 'skipped'
      : String(options.leanFailAs).trim().toLowerCase();
  if (leanFailAs !== 'skipped' && leanFailAs !== 'failure') {
    throw new TypeError(
      `renderJunitReport: leanFailAs must be 'skipped' or 'failure', not ${JSON.stringify(options.leanFailAs)}`
    );
  }
  // leanFailWcagOnly: true gates only on the leans of rules mapped to a WCAG
  // criterion, not on a best-practice rule's, whose stated facts lean fail
  // without condition (docs/LEANS.md).
  const leanFailWcagOnly = options.leanFailWcagOnly;
  if (leanFailWcagOnly != null && typeof leanFailWcagOnly !== 'boolean') {
    throw new TypeError(
      `renderJunitReport: leanFailWcagOnly must be true or false, not ${JSON.stringify(leanFailWcagOnly)}`
    );
  }
  const opts = {
    cantTellAs,
    leanFailAs,
    leanFailWcagOnly: leanFailWcagOnly === true,
    includeNotApplicable: options.includeNotApplicable === true
  };
  // A finding that gates as a likely failure says how to confirm it: a
  // result that comes without the steps (a binding's) gains them, in Node.
  // Before the baseline, which knows the occurrences it matched by identity.
  if (leanFailAs === 'failure') {
    frames = frames.map((f) =>
      f.result ? { ...f, result: withHowToCheck(f.result, options.packs) } : f
    );
  }
  const baseline = knownOccurrences(frames, options.baselineEntries);

  const totals = { tests: 0, failures: 0, errors: 0, skipped: 0 };
  const suiteXml = [];
  for (const { frame, result: frameResult, error } of frames) {
    if (frameResult) {
      suiteXml.push(...frameSuites(frameResult, frame, baseline, opts, totals));
      continue;
    }
    // A frame that did not answer was not checked: a skip, not a failure,
    // since most third-party embeds never answer.
    totals.tests += 1;
    totals.skipped += 1;
    const pathText = framePathText(frame.path);
    suiteXml.push(
      [
        `  <testsuite name="${xmlText(`Frame ${pathText}`)}" tests="1" failures="0" errors="0" skipped="1" time="0">`,
        '    <properties>',
        `      <property name="frame" value="${xmlText(pathText)}"/>`,
        ...(frame.url ? [`      <property name="url" value="${xmlText(frame.url)}"/>`] : []),
        '    </properties>',
        `    <testcase classname="frame" name="${xmlText(pathText)}" time="0">`,
        `      <skipped message="${xmlText(`Not scanned: ${error}`)}"/>`,
        '    </testcase>',
        '  </testsuite>'
      ].join('\n')
    );
  }

  const name = typeof options.name === 'string' && options.name ? options.name : 'surea11y';
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuites name="${xmlText(name)}" tests="${totals.tests}" failures="${totals.failures}" errors="${totals.errors}" skipped="${totals.skipped}" time="0">`,
    ...suiteXml,
    '</testsuites>',
    ''
  ].join('\n');
}

module.exports = { renderJunitReport };
