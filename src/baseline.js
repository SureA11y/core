/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

const { framesOf, locationText } = require('./scan-result.js');
const BASELINE_MOVES = require('./baseline-moves.json');

// docs/BASELINE.md: identity for one violation occurrence is
// `ruleId + reasonCode + html`, on purpose NOT `selector`/`structuralPath`
// (both position-derived, so they shift when unrelated markup changes
// elsewhere on the page; see buildSelector/buildStructuralPath in
// src/core/dom-helpers.js). It does not use a coarse structural signature
// either: that would be lossy on purpose, and risk a CI gate silently
// treating an actually new violation as "known" just because it shares
// tag/class shape with an old baselined one -- the wrong failure mode here.
// Content-based matching survives incidental DOM changes elsewhere on the
// page; its known limitation is a flagged element with dynamic content in
// its own markup (a timestamp, a live counter) never matching itself twice
// -- acceptable for v1, see docs/BASELINE.md.
// Only a string is a reason code: a number, an object or an empty string a
// rule left there reads as none, so no key holds "[object Object]" or a 0.
function getReasonCode(occurrence) {
  const code =
    occurrence && occurrence.data && occurrence.data.details && occurrence.data.details.reasonCode;
  return typeof code === 'string' && code ? code : 'DEFAULT';
}

// The markup in a finding's identity, with each start tag's attributes in
// name order and its class names sorted: frameworks reorder both freely, and
// <img class="a b" src="x"> is the same element as <img src="x" class="b a">.
// The snippet is serialized HTML (outerHTML), so every attribute reads
// name="value" with any quote in the value escaped. A tag cut off by the
// snippet's length limit is left as it is. A single forward scan, not a
// regular expression: the snippet is page content, and a backtracking
// pattern could be made to take polynomial time.
const isSpace = (ch) => ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r' || ch === '\f';
const isNameEnd = (ch) => isSpace(ch) || ch === '=' || ch === '/' || ch === '>' || ch === '<';

// Reads the start tag at html[start] (a '<'): { end, text } when there is
// one, or { end } where reading stopped when there is none (the caller goes
// on from there, so no character is read twice).
function readStartTag(html, start) {
  let i = start + 1;
  if (!/[a-zA-Z]/.test(html[i] || '')) return { end: i };
  while (i < html.length && !isNameEnd(html[i])) i++;
  const tag = html.slice(start + 1, i);
  const attrs = [];
  for (;;) {
    while (i < html.length && isSpace(html[i])) i++;
    if (i >= html.length) return { end: i };
    if (html[i] === '>') {
      i += 1;
      break;
    }
    if (html[i] === '/') {
      if (html[i + 1] !== '>') return { end: i };
      i += 2;
      break;
    }
    const nameStart = i;
    while (i < html.length && !isNameEnd(html[i])) i++;
    if (i === nameStart) return { end: i };
    const name = html.slice(nameStart, i);
    let value;
    if (html[i] === '=') {
      if (html[i + 1] !== '"') return { end: i };
      const close = html.indexOf('"', i + 2);
      if (close === -1) return { end: html.length };
      value = html.slice(i + 2, close);
      i = close + 1;
    }
    if (name.toLowerCase() === 'class' && value !== undefined) {
      value = value.split(/\s+/).filter(Boolean).sort().join(' ');
    }
    attrs.push({ name, text: value === undefined ? name : `${name}="${value}"` });
  }
  if (!attrs.length) return { end: i, text: html.slice(start, i) };
  attrs.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return { end: i, text: `<${tag} ${attrs.map((a) => a.text).join(' ')}>` };
}

function normalizeIdentityHtml(html) {
  const s = String(html);
  let out = '';
  let from = 0;
  for (let i = s.indexOf('<'); i !== -1;) {
    const tag = readStartTag(s, i);
    if (tag.text !== undefined) {
      out += s.slice(from, i) + tag.text;
      from = tag.end;
    }
    i = s.indexOf('<', Math.max(tag.end, i + 1));
  }
  return out + s.slice(from);
}

// A finding in a child frame is told apart from the same finding in the
// page or another frame by its frame's path (flattenCrossFrameResult); one
// in the page has none, and keeps the key it always had.
function computeBaselineKey(ruleId, reasonCode, html, framePath) {
  const key = `${ruleId}\u0000${reasonCode}\u0000${normalizeIdentityHtml(html == null ? '' : html)}`;
  return Array.isArray(framePath) && framePath.length
    ? `${key}\u0000frame\u0000${framePath.join('\u0001')}`
    : key;
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

function isFailOccurrence(check, occurrence) {
  if (!check || check.outcome !== 'fail') return false;
  return getOccurrenceOutcome(check, occurrence) === 'fail';
}

// Read-only: one entry per `fail` occurrence (not pre-deduplicated), so the
// written file is a plain reviewable list -- a new violation shows up as one
// new array row in a PR diff, not a changed count. `selector` is kept only
// for human readability in the committed file; matching never reads it.
function buildBaselineEntries(result) {
  const entries = [];
  for (const { frame, result: frameResult } of framesOf(result, 'buildBaselineEntries')) {
    for (const check of (frameResult && frameResult.checksResults) || []) {
      if (!check || check.outcome !== 'fail' || !Array.isArray(check.occurrences)) continue;

      for (const occurrence of check.occurrences) {
        if (!occurrence || !isFailOccurrence(check, occurrence)) continue;
        entries.push({
          ruleId: check.ruleId,
          reasonCode: getReasonCode(occurrence),
          selector: locationText(occurrence),
          html: typeof occurrence.html === 'string' ? occurrence.html : '',
          // In a child frame of a cross-frame result: the path to it.
          ...(frame.path.length ? { frame: frame.path.slice() } : {})
        });
      }
    }
  }

  return entries;
}

// The entries of a baseline: the list itself, or the file as saved
// ({ version, entries }); anything else holds none.
function entriesOf(baseline) {
  if (Array.isArray(baseline)) return baseline;
  if (baseline && typeof baseline === 'object' && Array.isArray(baseline.entries)) {
    return baseline.entries;
  }
  return [];
}

// The reason codes a finding had before this release moved it to the one
// it has now (src/baseline-moves.json): ruleId and new code -> old codes.
const EARLIER_CODES = new Map();
for (const move of BASELINE_MOVES.moves) {
  for (const to of move.to) {
    const key = `${move.ruleId}\u0000${to}`;
    if (!EARLIER_CODES.has(key)) EARLIER_CODES.set(key, []);
    EARLIER_CODES.get(key).push(move.from);
  }
}

function earlierCodesOf(ruleId, reasonCode) {
  return EARLIER_CODES.get(`${ruleId}\u0000${reasonCode}`) || [];
}

function entryKey(entry) {
  return computeBaselineKey(
    entry.ruleId,
    entry.reasonCode || 'DEFAULT',
    typeof entry.html === 'string' ? entry.html : '',
    entry.frame
  );
}

// How many entries the baseline holds under each key.
function entryCounts(baselineEntries) {
  const remaining = new Map();
  for (const entry of entriesOf(baselineEntries)) {
    if (!entry) continue;
    const key = entryKey(entry);
    remaining.set(key, (remaining.get(key) || 0) + 1);
  }
  return remaining;
}

// Which of the findings ({ ruleId, reasonCode, html, framePath }) the
// baseline knows, taking one entry from `remaining` for each. Every finding
// is looked up under its own code first; only then is one that a release
// moved to a new code looked up under the code it had (src/baseline-moves.json),
// with the same rule, markup and frame. So an entry that names a finding
// exactly is never taken by another that only matches it through a move.
function takeKnown(remaining, findings) {
  const take = (key) => {
    const left = remaining.get(key) || 0;
    if (left <= 0) return false;
    remaining.set(key, left - 1);
    return true;
  };
  const known = findings.map((f) =>
    take(computeBaselineKey(f.ruleId, f.reasonCode, f.html, f.framePath))
  );
  findings.forEach((f, i) => {
    if (known[i]) return;
    known[i] = earlierCodesOf(f.ruleId, f.reasonCode).some((code) =>
      take(computeBaselineKey(f.ruleId, code, f.html, f.framePath))
    );
  });
  return known;
}

// The fail occurrences of frames (framesOf), in order: { frame, check,
// occurrence, ruleId, reasonCode, html, framePath }.
function failFindingsOf(frames) {
  const out = [];
  for (const { frame, result: frameResult } of frames) {
    for (const check of (frameResult && frameResult.checksResults) || []) {
      if (!check || check.outcome !== 'fail' || !Array.isArray(check.occurrences)) continue;
      for (const occurrence of check.occurrences) {
        if (!occurrence || !isFailOccurrence(check, occurrence)) continue;
        out.push({
          frame,
          check,
          occurrence,
          ruleId: check.ruleId,
          reasonCode: getReasonCode(occurrence),
          html: typeof occurrence.html === 'string' ? occurrence.html : '',
          framePath: frame.path
        });
      }
    }
  }
  return out;
}

// The fail occurrences of frames (framesOf) that the baseline knows, as a
// set the reporters look each occurrence up in, and the entries left over.
function knownOccurrences(frames, baselineEntries) {
  const remaining = entryCounts(baselineEntries);
  const findings = failFindingsOf(frames);
  const known = takeKnown(remaining, findings);
  return {
    known: new Set(findings.filter((f, i) => known[i]).map((f) => f.occurrence)),
    remaining
  };
}

function matchBaseline(result, baselineEntries) {
  const frames = framesOf(result, 'matchBaseline');
  const remaining = entryCounts(baselineEntries);
  const findings = failFindingsOf(frames);
  const known = takeKnown(remaining, findings);

  const newOccurrences = [];
  findings.forEach((f, i) => {
    if (known[i]) return;
    newOccurrences.push({
      ruleId: f.ruleId,
      reasonCode: f.reasonCode,
      selector: f.occurrence.selector,
      html: f.occurrence.html,
      summary: f.occurrence.summary,
      ...(f.framePath.length ? { frame: f.framePath.slice() } : {})
    });
  });

  let staleCount = 0;
  for (const left of remaining.values()) {
    if (left > 0) staleCount += left;
  }

  return {
    totalFail: findings.length,
    knownCount: findings.length - newOccurrences.length,
    newCount: newOccurrences.length,
    newOccurrences,
    staleCount
  };
}

// The entries with each one written under a reason code a release has since
// moved its finding to (src/baseline-moves.json) given that code, so the
// file matches without the table. With a result, an entry takes the code of
// the finding it matches there; without one, only an entry whose old code
// the rule no longer gives, and that moved to a single code, is rewritten,
// since a split code can't be told apart without the finding. Every other
// entry is kept as it is, so nothing new is accepted.
function migrateBaselineEntries(baselineEntries, result) {
  const entries = entriesOf(baselineEntries).map((entry) =>
    entry && typeof entry === 'object' ? { ...entry } : entry
  );
  if (result === undefined || result === null) {
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;
      const move = BASELINE_MOVES.moves.find(
        (m) => m.ruleId === entry.ruleId && m.from === (entry.reasonCode || 'DEFAULT')
      );
      if (move && !move.stillGiven && move.to.length === 1) entry.reasonCode = move.to[0];
    }
    return entries;
  }
  const frames = framesOf(result, 'migrateBaselineEntries');
  // The entries under each key, so the one a finding takes can be rewritten.
  const byKey = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const key = entryKey(entry);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(entry);
  }
  const takeEntry = (key) => {
    const list = byKey.get(key);
    return list && list.length ? list.shift() : null;
  };
  const findings = failFindingsOf(frames);
  const exact = findings.map((f) =>
    takeEntry(computeBaselineKey(f.ruleId, f.reasonCode, f.html, f.framePath))
  );
  findings.forEach((f, i) => {
    if (exact[i]) return;
    for (const code of earlierCodesOf(f.ruleId, f.reasonCode)) {
      const entry = takeEntry(computeBaselineKey(f.ruleId, code, f.html, f.framePath));
      if (entry) {
        entry.reasonCode = f.reasonCode;
        break;
      }
    }
  });
  return entries;
}

module.exports = {
  buildBaselineEntries,
  matchBaseline,
  migrateBaselineEntries,
  knownOccurrences,
  computeBaselineKey,
  getReasonCode,
  entriesOf
};
