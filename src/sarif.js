/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Renders one scan result as a SARIF 2.1.0 log (docs/SARIF.md) for GitHub
 * Code Scanning / other SARIF-consuming dashboards -- a different output
 * shape from --json's raw result, purpose-built for that ecosystem (see
 * docs/CLI.md's --sarif flag).
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

const path = require('path');
const { computeBaselineKey, getReasonCode } = require('./baseline.js');

const SARIF_SCHEMA_URI =
  'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/Schemata/sarif-schema-2.1.0.json';
const SARIF_VERSION = '2.1.0';

function artifactUriFromResult(result) {
  const url = result && result.url;
  if (!url) return 'about:blank';
  if (url.startsWith('file://')) {
    const filePath = url.slice('file://'.length);
    const rel = path.relative(process.cwd(), filePath).split(path.sep).join('/');
    // A file outside the cwd (e.g. an absolute path elsewhere on disk)
    // produces a "../"-leading relative path -- still valid as a URI, just
    // not resolvable as a repo-relative one by a SARIF consumer like GitHub
    // Code Scanning (see docs/SARIF.md's known limitations).
    return rel || filePath;
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
      typeof entry.html === 'string' ? entry.html : ''
    );
    remaining.set(key, (remaining.get(key) || 0) + 1);
  }
  return remaining;
}

function wcagTags(check) {
  const mappings = (check.meta && check.meta.normativeMappings) || [];
  const tags = new Set(['accessibility', check.type === 'automatic' ? 'automatic' : 'manual']);
  for (const m of mappings) {
    if (m && m.requirement) tags.add(`wcag-${m.requirement}`);
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
    properties: { tags: wcagTags(check) }
  };
}

function buildResult(check, occurrence, level, artifactUri) {
  const reasonCode = getReasonCode(occurrence);
  const html = typeof occurrence.html === 'string' ? occurrence.html : '';
  const message = occurrence.hint ? `${occurrence.summary} ${occurrence.hint}` : occurrence.summary;

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
      'surea11y/violation/v1': computeBaselineKey(check.ruleId, reasonCode, html)
    },
    properties: {
      severity: check.severity,
      confidence: check.confidence,
      reasonCode,
      html
    }
  };
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

function renderSarifReport(result, options = {}) {
  const { toolVersion, informationUri, baselineEntries } = options;
  const artifactUri = artifactUriFromResult(result);
  const remaining = buildRemainingBaselineMap(baselineEntries);

  const rules = [];
  const seenRuleIds = new Set();
  const failResults = [];
  const cantTellResults = [];

  for (const check of (result && result.checksResults) || []) {
    if (!check || !Array.isArray(check.occurrences)) continue;

    if (!seenRuleIds.has(check.ruleId)) {
      seenRuleIds.add(check.ruleId);
      rules.push(buildRule(check));
    }

    if (check.outcome !== 'fail' && check.outcome !== 'cantTell') continue;

    for (const occurrence of check.occurrences) {
      if (!occurrence) continue;

      const occurrenceOutcome = getOccurrenceOutcome(check, occurrence);
      if (occurrenceOutcome === 'fail') {
        const reasonCode = getReasonCode(occurrence);
        const html = typeof occurrence.html === 'string' ? occurrence.html : '';
        const key = computeBaselineKey(check.ruleId, reasonCode, html);
        const left = remaining.get(key) || 0;
        if (left > 0) {
          remaining.set(key, left - 1);
          continue; // already known via the baseline -- omit, don't re-gate
        }
        failResults.push(buildResult(check, occurrence, 'error', artifactUri));
      } else if (occurrenceOutcome === 'cantTell') {
        cantTellResults.push(buildResult(check, occurrence, 'warning', artifactUri));
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
            version: toolVersion || '0.0.0',
            rules
          }
        },
        // fail first: matches docs/REPORT.md's own "violations before advisory
        // findings" ordering.
        results: [...failResults, ...cantTellResults]
      }
    ]
  };

  return JSON.stringify(sarifLog, null, 2) + '\n';
}

module.exports = { renderSarifReport };
