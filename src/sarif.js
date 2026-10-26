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
 * model, docs/TROUBLESHOOTING.md). A cantTell whose lean points to fail is
 * "error" instead when `leanFailAs: 'error'` is given (with
 * `leanFailWcagOnly`, only for a rule mapped to a WCAG criterion); every
 * lean is in the result's properties either way.
 *
 * If `baselineEntries` is supplied (mirrors --baseline, docs/BASELINE.md),
 * fail occurrences already recorded there are omitted entirely rather than
 * downgraded -- a generic SARIF consumer has no "known, don't re-gate"
 * concept of its own, so the only faithful way to honor a baseline here is
 * to not report the occurrence at all. cantTell occurrences are never
 * left out: one that leans fail and has an entry marked `lean: 'fail'`
 * stays a "warning" under `leanFailAs: 'error'`, as it is without it.
 */

const crypto = require('crypto');
const path = require('path');
const { fileURLToPath, pathToFileURL } = require('url');
const { computeBaselineKey, getReasonCode, knownOccurrences } = require('./baseline.js');
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

const SARIF_SCHEMA_URI =
  'https://docs.oasis-open.org/sarif/sarif/v2.1.0/errata01/os/schemas/sarif-schema-2.1.0.json';
const SARIF_VERSION = '2.1.0';

// The artifact URI must be a URI: a file inside the working directory as a
// relative reference with each segment percent-encoded, which GitHub Code
// Scanning resolves against the repository; any other file as an absolute
// file: URL, rather than a relative path climbing out of the repository
// ("../../x y/a.html"), which it can't resolve and a space makes invalid.
// Any other URL is written as the URL parser serializes it, which encodes
// what a URI can't hold ("https://example.test/a%20b"); a value that isn't
// a URL, such as the path a page was scanned under ("dist/my page.html"), is
// a relative reference, forward-slashed, with each segment percent-encoded,
// or a file: URL when it is a Windows path. A url that isn't a string names
// no target.
function artifactUriFromResult(result) {
  const url = result && result.url;
  if (typeof url !== 'string' || !url) return 'about:blank';
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
  const segments = (p) => p.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/');
  // A Windows path ("C:\\x y\\a.html") would parse as a URL with the
  // scheme "c:"; it is an absolute file URL.
  const drive = /^([A-Za-z]:)[\\/]/.exec(url);
  if (drive) return `file:///${drive[1]}${segments(url.slice(2))}`;
  try {
    return new URL(url).href;
  } catch {
    return segments(url);
  }
}

// `normativeMappings` also carries other standards (EN 301 549 clauses, say) and
// WCAG's own non-normative documents (`type: 'Understanding'`), each with a
// `requirement` of its own. Only a WCAG Success Criterion earns a `wcag-` tag;
// an entry naming no standard is treated as WCAG, the engine's default.
function isWcagCriterion(m) {
  return !!(m && m.requirement && (m.standard == null || m.standard === 'WCAG') && !m.type);
}

const INTERNAL_TAGS = new Set(['a11ycore', 'atomic', 'automatic', 'manual']);

function ruleTags(check, standards, inScope) {
  const mappings = (check.meta && check.meta.normativeMappings) || [];
  const tags = new Set(['accessibility', check.type === 'automatic' ? 'automatic' : 'manual']);
  // A criterion the scan's WCAG level or version left out of its rollups
  // (wcagScopeOf) is not named: an AA scan doesn't tag a rule wcag-1.4.6.
  for (const m of mappings) {
    if (isWcagCriterion(m) && inScope(m)) tags.add(`wcag-${m.requirement}`);
  }
  // Each entry of a standard the result names (standardsOf) gets a tag
  // prefixed with the standard's key. The tag carries no version: EN 301 549 numbers
  // a clause the same way in every version that has it, so two versions
  // collapse into one tag. A requirement already named with the key (a
  // checklist item, "city-images") is its own tag.
  for (const m of mappings) {
    const standard = standardOfEntryIn(standards, m);
    if (!standard) continue;
    const requirement = String(m.requirement);
    tags.add(
      requirement.startsWith(`${standard.key}-`) ? requirement : `${standard.key}-${requirement}`
    );
  }
  // The rule's own tags (a custom rule's too), less the engine's
  // bookkeeping ones and a criterion's tag ("wcag111"), which wcag-1.1.1
  // above already says.
  for (const t of (check.meta && Array.isArray(check.meta.tags) && check.meta.tags) || []) {
    const tag = String(t);
    if (INTERNAL_TAGS.has(tag) || /^wcag\d{3,}$/.test(tag)) continue;
    tags.add(tag);
  }
  return Array.from(tags);
}

// SARIF's descriptions are strings: a title or description of another type,
// in a stored result, is left for the next one along.
const textOr = (value, fallback) => (typeof value === 'string' && value ? value : fallback);

function buildRule(check, standards, inScope) {
  const title = textOr(check.title, check.ruleId);
  return {
    id: check.ruleId,
    name: check.ruleId,
    shortDescription: { text: title },
    fullDescription: { text: textOr(check.description, title) },
    // type: "manual" rules are capped at cantTell (never fail), so their
    // worst-case, rule-level default is "warning"; automatic rules can
    // reach "error" -- see docs/OUTPUT_SCHEMA.md's outcome/type table.
    defaultConfiguration: { level: check.type === 'automatic' ? 'error' : 'warning' },
    ...(helpUrlOf(check) ? { helpUri: helpUrlOf(check) } : {}),
    properties: { tags: ruleTags(check, standards, inScope) }
  };
}

function buildResult(check, occurrence, level, artifactUri, framePath = [], outside = null) {
  const reasonCode = getReasonCode(occurrence);
  const html = typeof occurrence.html === 'string' ? occurrence.html : '';
  // SARIF requires a message, and GitHub rejects a result whose text is
  // empty: a finding with no summary (a custom rule's, say) is described by
  // its rule's title, or else its id.
  const summary = typeof occurrence.summary === 'string' ? occurrence.summary.trim() : '';
  const hint = typeof occurrence.hint === 'string' ? occurrence.hint.trim() : '';
  const lead = summary || (typeof check.title === 'string' && check.title.trim()) || check.ruleId;
  const message = hint ? `${lead} ${hint}` : lead;
  const where = locationText(occurrence);
  const lean = sarifLean(occurrence.lean);

  return {
    ruleId: check.ruleId,
    level,
    message: { text: message },
    locations: [
      {
        physicalLocation: { artifactLocation: { uri: artifactUri } },
        ...(where ? { logicalLocations: [{ fullyQualifiedName: where, kind: 'element' }] } : {})
      }
    ],
    // The finding's identity key (computeBaselineKey) carries raw \u0000
    // separators and up to 2 KB of markup; tools only compare it, so it is
    // written as its SHA-256 digest: the same finding gets the same one in
    // every report.
    partialFingerprints: {
      'surea11y/violation/v2': crypto
        .createHash('sha256')
        .update(computeBaselineKey(check.ruleId, reasonCode, html, framePath))
        .digest('hex')
    },
    properties: {
      severity: check.severity,
      confidence: check.confidence,
      reasonCode,
      html,
      // In a child frame of a cross-frame result: the selectors of the
      // frame elements leading to it from the page.
      ...(framePath.length ? { frame: framePath.slice() } : {}),
      ...(outside ? { outsideTarget: outside } : {}),
      // An undecided finding's lean: which way its evidence points.
      ...(lean ? { lean } : {})
    }
  };
}

// The lean as a SARIF result carries it: which way, why, and, where the
// engine gives them, what could make it wrong (caution) and how often it has
// been right (measured), so a reviewer reading an alert sees the caution the
// HTML report shows. Its signals and i18n keys stay in the scan result.
function sarifLean(lean) {
  if (!lean || (lean.toward !== 'fail' && lean.toward !== 'pass')) return null;
  const out = { toward: lean.toward, why: lean.why };
  if (typeof lean.caution === 'string' && lean.caution) out.caution = lean.caution;
  if (lean.measured && typeof lean.measured === 'object') out.measured = { ...lean.measured };
  return out;
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
    // The digest of the identity key, so its first 16 digits are the hash
    // this field always had.
    const key = r.partialFingerprints['surea11y/violation/v2'];
    const n = (seen.get(key) || 0) + 1;
    seen.set(key, n);
    r.partialFingerprints.primaryLocationLineHash = `${key.slice(0, 16)}:${n}`;
  }
  return results;
}

// The conformance target a run used, so a dashboard can tell a WCAG 2.1 run
// from a 2.2 one, and an AA one from one at every level, the opt-in rules it
// added beyond that target, and the conditions the page was rendered under,
// which layout-dependent results depend on. Absent on results from releases
// that predate the fields.
function runProperties(result) {
  const engine = (result && result.engine) || {};
  const props = {};
  if (engine.wcagVersion) props.wcagVersion = engine.wcagVersion;
  if (engine.wcagLevel) props.wcagLevel = engine.wcagLevel;
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
  // leanFailAs: 'error' reports an undecided finding whose evidence points
  // to fail at "error", so a gate on errors counts it; by default it is a
  // "warning" like every other undecided finding.
  const leanFailAs =
    options.leanFailAs === undefined || options.leanFailAs === null
      ? 'warning'
      : String(options.leanFailAs).trim().toLowerCase();
  if (leanFailAs !== 'warning' && leanFailAs !== 'error') {
    throw new TypeError(
      `renderSarifReport: leanFailAs must be 'warning' or 'error', not ${JSON.stringify(options.leanFailAs)}`
    );
  }
  // leanFailWcagOnly: true raises only the leans of rules mapped to a WCAG
  // criterion, not a best-practice rule's, whose stated facts lean fail
  // without condition (docs/LEANS.md).
  const { leanFailWcagOnly } = options;
  if (leanFailWcagOnly != null && typeof leanFailWcagOnly !== 'boolean') {
    throw new TypeError(
      `renderSarifReport: leanFailWcagOnly must be true or false, not ${JSON.stringify(leanFailWcagOnly)}`
    );
  }
  const automation = automationDetails(category);
  const { known, knownLeaning } = knownOccurrences(frames, baselineEntries);

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
    // The findings that lean fail and are raised under leanFailAs: 'error',
    // less those the baseline knows (entries marked lean: 'fail').
    const raised = new Set(
      leanFailAs === 'error'
        ? leaningOccurrencesOf(frameResult, { wcagOnly: leanFailWcagOnly === true })
            .map((l) => l.occurrence)
            .filter((o) => !knownLeaning.has(o))
        : []
    );
    const standards = standardsOf(frameResult);
    const inScope = wcagScopeOf(frameResult);
    for (const check of (frameResult && frameResult.checksResults) || []) {
      // A check with no rule id names no rule, which SARIF requires, so it
      // is left out, as JUnit and EARL leave it.
      if (!check || !check.ruleId || !Array.isArray(check.occurrences)) continue;

      if (!seenRuleIds.has(check.ruleId)) {
        seenRuleIds.add(check.ruleId);
        rules.push(buildRule(check, standards, inScope));
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
        // silence as a clean bill of health. A pass has nothing of the kind to
        // say: what its occurrences describe was checked, so a clean run stays
        // free of notes, as docs/SARIF.md says.
        if (check.outcome !== 'notApplicable') continue;
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

      // A rule whose every criterion is outside the scan's target still ran:
      // its findings are written as notes, which say what it found without
      // failing a build scoped to the target, and say which criteria they
      // belong to and what the target was.
      const criteria = ((check.meta && check.meta.normativeMappings) || []).filter(isWcagCriterion);
      const outside =
        criteria.length && !criteria.some(inScope)
          ? {
              criteria: [...new Set(criteria.map((m) => String(m.requirement)))],
              target: `WCAG ${[frameResult.engine && frameResult.engine.wcagVersion, frameResult.engine && frameResult.engine.wcagLevel].filter(Boolean).join(' ')}`
            }
          : null;

      for (const occurrence of check.occurrences) {
        if (!occurrence) continue;

        const outcome = occurrenceOutcome(check, occurrence);
        if (outcome === 'fail') {
          // Already known via the baseline: omitted, not re-gated.
          if (known.has(occurrence)) continue;
          failResults.push(
            buildResult(
              check,
              occurrence,
              outside ? 'note' : 'error',
              artifactUri,
              framePath,
              outside
            )
          );
        } else if (outcome === 'cantTell') {
          cantTellResults.push(
            buildResult(
              check,
              occurrence,
              outside ? 'note' : raised.has(occurrence) ? 'error' : 'warning',
              artifactUri,
              framePath,
              outside
            )
          );
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
            version:
              toolVersion ||
              (top.engine && typeof top.engine.version === 'string' && top.engine.version) ||
              '0.0.0',
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
