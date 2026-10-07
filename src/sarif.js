/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Renders one scan result as a SARIF 2.1.0 log (docs/SARIF.md) for GitHub
 * Code Scanning / other SARIF-consuming dashboards -- a different output
 * shape from --json's raw result, purpose-built for that ecosystem (written
 * by @surea11y/cli's --sarif flag, see its docs/CLI.md).
 *
 * Only fail/cantTell occurrences become SARIF results (a pass/notApplicable
 * result has no occurrences at all -- see docs/OUTPUT_SCHEMA.md), the same
 * "violations only" framing docs/REPORT.md's HTML report already uses.
 * fail -> SARIF level "error" (the CI-gating case); cantTell -> "warning"
 * (surfaced, non-blocking -- this engine's own cantTell/manual-review mental
 * model, docs/TROUBLESHOOTING.md).
 *
 * If `baselineEntries` is supplied (mirrors --baseline, docs/BASELINE.md),
 * fail occurrences already recorded there are omitted entirely rather than
 * downgraded -- a generic SARIF consumer has no "known, don't re-gate"
 * concept of its own, so the only faithful way to honor a baseline here is
 * to not report the occurrence at all. cantTell occurrences are never
 * baseline-filtered (the baseline mechanism only ever tracks fail
 * occurrences, matching --write-baseline).
 */

const crypto = require('crypto');
const path = require('path');
const { fileURLToPath, pathToFileURL } = require('url');
const { computeBaselineKey, getReasonCode } = require('./baseline.js');
const { standardOfEntry } = require('./coverage/standards.js');
const { framesOf, framePathText, ruleErrorOf, helpUrlOf } = require('./scan-result.js');

const SARIF_SCHEMA_URI =
  'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/Schemata/sarif-schema-2.1.0.json';
const SARIF_VERSION = '2.1.0';

// The artifact URI must be a URI: a file inside the working directory as a
// relative reference with each segment percent-encoded, which GitHub Code
// Scanning resolves against the repository; any other file as an absolute
// file: URL, rather than a relative path climbing out of the repository
// ("../../x y/a.html"), which it can't resolve and a space makes invalid.
function artifactUriFromResult(result) {
  const url = result && result.url;
  if (!url) return 'about:blank';
  if (url.startsWith('file:')) {
    let filePath;
    try {
      filePath = fileURLToPath(url);
    } catch {
      return encodeURI(url);
    }
    const rel = path.relative(process.cwd(), filePath);
    if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
      return rel.split(path.sep).map(encodeURIComponent).join('/');
    }
    return pathToFileURL(filePath).href;
  }
  return url;
}

function buildRemainingBaselineMap(baselineEntries) {
  const remaining = new Map();
  for (const entry of Array.isArray(baselineEntries) ? baselineEntries : []) {
    if (!entry) continue;
    const key = computeBaselineKey(
      entry.ruleId,
      entry.reasonCode || 'DEFAULT',
      typeof entry.html === 'string' ? entry.html : '',
      entry.frame
    );
    remaining.set(key, (remaining.get(key) || 0) + 1);
  }
  return remaining;
}

// `normativeMappings` also carries other standards (EN 301 549 clauses, say) and
// WCAG's own non-normative documents (`type: 'Understanding'`), each with a
// `requirement` of its own. Only a WCAG Success Criterion earns a `wcag-` tag;
// an entry naming no standard is treated as WCAG, the engine's default.
function isWcagCriterion(m) {
  return !!(m && m.requirement && (m.standard == null || m.standard === 'WCAG') && !m.type);
}

const INTERNAL_TAGS = new Set(['a11ycore', 'atomic', 'automatic', 'manual']);

function ruleTags(check) {
  const mappings = (check.meta && check.meta.normativeMappings) || [];
  const tags = new Set(['accessibility', check.type === 'automatic' ? 'automatic' : 'manual']);
  for (const m of mappings) {
    if (isWcagCriterion(m)) tags.add(`wcag-${m.requirement}`);
  }
  // Each registered standard's entry gets a tag prefixed with its key
  // (src/coverage/standards.js). The tag carries no version: EN 301 549 numbers
  // a clause the same way in every version that has it, so two versions
  // collapse into one tag.
  for (const m of mappings) {
    const standard = standardOfEntry(m);
    if (standard) tags.add(`${standard.key}-${m.requirement}`);
  }
  // The rule's own tags (a custom rule's too), less the engine's
  // bookkeeping ones and a criterion's tag ("wcag111"), which wcag-1.1.1
  // above already says.
  for (const t of (check.meta && check.meta.tags) || []) {
    const tag = String(t);
    if (INTERNAL_TAGS.has(tag) || /^wcag\d{3,}$/.test(tag)) continue;
    tags.add(tag);
  }
  return Array.from(tags);
}

function buildRule(check) {
  return {
    id: check.ruleId,
    name: check.ruleId,
    shortDescription: { text: check.title || check.ruleId },
    fullDescription: { text: check.description || check.title || check.ruleId },
    // type: "manual" rules are capped at cantTell (never fail), so their
    // worst-case, rule-level default is "warning"; automatic rules can
    // reach "error" -- see docs/OUTPUT_SCHEMA.md's outcome/type table.
    defaultConfiguration: { level: check.type === 'automatic' ? 'error' : 'warning' },
    ...(helpUrlOf(check) ? { helpUri: helpUrlOf(check) } : {}),
    properties: { tags: ruleTags(check) }
  };
}

function buildResult(check, occurrence, level, artifactUri, framePath = []) {
  const reasonCode = getReasonCode(occurrence);
  const html = typeof occurrence.html === 'string' ? occurrence.html : '';
  // SARIF requires a message, and GitHub rejects a result whose text is
  // empty: a finding with no summary (a custom rule's, say) is described by
  // its rule's title, or else its id.
  const summary = typeof occurrence.summary === 'string' ? occurrence.summary.trim() : '';
  const hint = typeof occurrence.hint === 'string' ? occurrence.hint.trim() : '';
  const lead = summary || (typeof check.title === 'string' && check.title.trim()) || check.ruleId;
  const message = hint ? `${lead} ${hint}` : lead;

  return {
    ruleId: check.ruleId,
    level,
    message: { text: message },
    locations: [
      {
        physicalLocation: { artifactLocation: { uri: artifactUri } },
        ...(occurrence.selector
          ? { logicalLocations: [{ fullyQualifiedName: occurrence.selector, kind: 'element' }] }
          : {})
      }
    ],
    partialFingerprints: {
      'surea11y/violation/v1': computeBaselineKey(check.ruleId, reasonCode, html, framePath)
    },
    properties: {
      severity: check.severity,
      confidence: check.confidence,
      reasonCode,
      html,
      // In a child frame of a cross-frame result: the selectors of the
      // frame elements leading to it from the page.
      ...(framePath.length ? { frame: framePath.slice() } : {})
    }
  };
}

// GitHub Code Scanning matches results between uploads on
// partialFingerprints.primaryLocationLineHash alone. Its upload action
// computes one from the result's line, and a DOM finding has no line: it
// stored an empty hash, so alerts were matched by position, and fixing one
// finding could close another's alert. So the hash is written here, from the
// finding's own identity. A finding repeated on the page (the same broken
// component twice) shares that identity, and is told apart by a count, as
// GitHub's own hashes are: `<hash>:1`, `<hash>:2`.
function addLineHashes(results) {
  const seen = new Map();
  for (const r of results) {
    const key = r.partialFingerprints['surea11y/violation/v1'];
    const n = (seen.get(key) || 0) + 1;
    seen.set(key, n);
    const hash = crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
    r.partialFingerprints.primaryLocationLineHash = `${hash}:${n}`;
  }
  return results;
}

function getOccurrenceOutcome(check, occurrence) {
  const occurrenceOutcome =
    occurrence &&
    (occurrence.occurrenceOutcome === 'fail' || occurrence.occurrenceOutcome === 'cantTell'
      ? occurrence.occurrenceOutcome
      : occurrence.outcome === 'fail' || occurrence.outcome === 'cantTell'
        ? occurrence.outcome
        : null);
  if (occurrenceOutcome) return occurrenceOutcome;
  return check && (check.outcome === 'fail' || check.outcome === 'cantTell') ? check.outcome : null;
}

// The conformance target a run used, so a dashboard can tell a WCAG 2.1 run
// from a 2.2 one, the opt-in rules it added beyond that target, and the
// conditions the page was rendered under, which layout-dependent results
// depend on. Absent on results from engines that predate the fields.
function runProperties(result) {
  const engine = (result && result.engine) || {};
  const props = {};
  if (engine.wcagVersion) props.wcagVersion = engine.wcagVersion;
  if (engine.profile) props.profile = engine.profile;
  if (Array.isArray(engine.optInRules) && engine.optInRules.length)
    props.optInRules = engine.optInRules.slice();
  if (engine.environment && typeof engine.environment === 'object')
    props.environment = JSON.parse(JSON.stringify(engine.environment));
  return Object.keys(props).length ? props : null;
}

// A scan category, for a consumer that keeps several analyses of one commit
// apart: a page scanned at two viewport widths is two analyses, and GitHub
// Code Scanning closes an alert that is missing from a later upload in the
// same category, so a finding seen at one width only would open and close
// with every upload. SARIF has automationDetails.id for this; GitHub reads
// everything up to its last slash as the category, hence the one added.
function automationDetails(category) {
  if (typeof category !== 'string' || !category.trim()) return null;
  const id = category.trim();
  return { id: id.endsWith('/') ? id : `${id}/` };
}

function renderSarifReport(result, options = {}) {
  const frames = framesOf(result, 'renderSarifReport');
  const top = frames[0].result;
  const { toolVersion, informationUri, baselineEntries, category } = options;
  const automation = automationDetails(category);
  const remaining = buildRemainingBaselineMap(baselineEntries);

  const rules = [];
  const seenRuleIds = new Set();
  const failResults = [];
  const cantTellResults = [];
  const notices = [];

  // A cross-frame result is one run: each frame's findings are located in
  // its own document, and a frame that did not answer is a notification,
  // since nothing in it was checked.
  for (const { frame, result: frameResult, error } of frames) {
    const framePath = frame.path;
    if (!frameResult) {
      notices.push({
        level: 'warning',
        message: {
          text: `The frame ${framePathText(framePath)}${frame.url ? ` (${frame.url})` : ''} was not scanned: ${error}`
        }
      });
      continue;
    }
    const artifactUri = artifactUriFromResult(frameResult);
    for (const check of (frameResult && frameResult.checksResults) || []) {
      if (!check || !Array.isArray(check.occurrences)) continue;

      if (!seenRuleIds.has(check.ruleId)) {
        seenRuleIds.add(check.ruleId);
        rules.push(buildRule(check));
      }

      // A rule that did not complete judged nothing, so it is no result; an
      // error notification keeps the gap in coverage from reading as a pass.
      const ruleError = ruleErrorOf(check);
      if (ruleError) {
        notices.push({
          level: 'error',
          message: { text: `The rule ${check.ruleId} did not complete: ${ruleError}` },
          associatedRule: { id: check.ruleId }
        });
        continue;
      }

      if (check.outcome !== 'fail' && check.outcome !== 'cantTell') {
        // A rule with nothing to judge may still say why, which is the
        // difference between "checked, nothing to flag" and "could not check".
        // That is not an alert, so it cannot be a result; carrying it as a
        // tool execution notification keeps a SARIF-only pipeline from reading
        // silence as a clean bill of health.
        for (const occurrence of check.occurrences) {
          const text =
            occurrence && typeof occurrence.summary === 'string' ? occurrence.summary : '';
          if (!text) continue;
          notices.push({
            level: 'note',
            message: { text },
            associatedRule: { id: check.ruleId }
          });
        }
        continue;
      }

      for (const occurrence of check.occurrences) {
        if (!occurrence) continue;

        const occurrenceOutcome = getOccurrenceOutcome(check, occurrence);
        if (occurrenceOutcome === 'fail') {
          const reasonCode = getReasonCode(occurrence);
          const html = typeof occurrence.html === 'string' ? occurrence.html : '';
          const key = computeBaselineKey(check.ruleId, reasonCode, html, framePath);
          const left = remaining.get(key) || 0;
          if (left > 0) {
            remaining.set(key, left - 1);
            continue; // already known via the baseline -- omit, don't re-gate
          }
          failResults.push(buildResult(check, occurrence, 'error', artifactUri, framePath));
        } else if (occurrenceOutcome === 'cantTell') {
          cantTellResults.push(buildResult(check, occurrence, 'warning', artifactUri, framePath));
        }
      }
    }
  }

  const sarifLog = {
    $schema: SARIF_SCHEMA_URI,
    version: SARIF_VERSION,
    runs: [
      {
        tool: {
          driver: {
            name: 'surea11y',
            informationUri: informationUri || 'https://github.com/SureA11y/core',
            // The caller's own version (a CLI wrapping the engine), or else
            // the engine release that produced the result.
            version: toolVersion || (top.engine && top.engine.version) || '0.0.0',
            rules
          }
        },
        // fail first: matches docs/REPORT.md's own "violations before advisory
        // findings" ordering.
        results: addLineHashes([...failResults, ...cantTellResults]),
        ...(automation ? { automationDetails: automation } : {}),
        ...(runProperties(top) ? { properties: runProperties(top) } : {}),
        ...(notices.length
          ? { invocations: [{ executionSuccessful: true, toolExecutionNotifications: notices }] }
          : {})
      }
    ]
  };

  return JSON.stringify(sarifLog, null, 2) + '\n';
}

module.exports = { renderSarifReport };
