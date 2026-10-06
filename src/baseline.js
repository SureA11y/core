/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

const { assertScanResult } = require('./scan-result.js');

// docs/BASELINE.md: identity for one violation occurrence is
// `ruleId + reasonCode + html`, on purpose NOT `selector`/`structuralPath`
// (both position-derived, so they shift when unrelated markup changes
// elsewhere on the page; see buildSelector/buildStructuralPath in
// src/core/dom-helpers.js). Unlike src/explain/group.js's computeGroupKey,
// this does not use a coarse structural signature: that's lossy on purpose
// for AI-explanation dedup (one prompt per shape), which would risk a CI gate
// silently treating an actually new violation as "known" just because it
// shares tag/class shape with an old baselined one -- the wrong failure mode
// here. Content-based matching survives incidental DOM changes elsewhere on
// the page; its known limitation is a flagged element with dynamic content
// in its own markup (a timestamp, a live counter) never matching itself
// twice -- acceptable for v1, see docs/BASELINE.md.
function getReasonCode(occurrence) {
  return (
    (occurrence &&
      occurrence.data &&
      occurrence.data.details &&
      occurrence.data.details.reasonCode) ||
    'DEFAULT'
  );
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

function computeBaselineKey(ruleId, reasonCode, html) {
  return `${ruleId}\u0000${reasonCode}\u0000${normalizeIdentityHtml(html == null ? '' : html)}`;
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
  assertScanResult(result, 'buildBaselineEntries');
  const entries = [];

  for (const check of (result && result.checksResults) || []) {
    if (!check || check.outcome !== 'fail' || !Array.isArray(check.occurrences)) continue;

    for (const occurrence of check.occurrences) {
      if (!occurrence || !isFailOccurrence(check, occurrence)) continue;
      entries.push({
        ruleId: check.ruleId,
        reasonCode: getReasonCode(occurrence),
        selector: typeof occurrence.selector === 'string' ? occurrence.selector : '',
        html: typeof occurrence.html === 'string' ? occurrence.html : ''
      });
    }
  }

  return entries;
}

// Read-only: matches a fresh scan's `fail` occurrences against a baseline's
// entries by multiset (not presence/absence), so N identical repeated
// violations (e.g. the same broken component instantiated 3 times) are
// counted correctly rather than all matching a single baseline entry.
// Never mutates `result` or its occurrences.
function matchBaseline(result, baselineEntries) {
  assertScanResult(result, 'matchBaseline');
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

  let totalFail = 0;
  let knownCount = 0;
  const newOccurrences = [];

  for (const check of (result && result.checksResults) || []) {
    if (!check || check.outcome !== 'fail' || !Array.isArray(check.occurrences)) continue;

    for (const occurrence of check.occurrences) {
      if (!occurrence || !isFailOccurrence(check, occurrence)) continue;
      totalFail += 1;

      const reasonCode = getReasonCode(occurrence);
      const html = typeof occurrence.html === 'string' ? occurrence.html : '';
      const key = computeBaselineKey(check.ruleId, reasonCode, html);
      const left = remaining.get(key) || 0;

      if (left > 0) {
        remaining.set(key, left - 1);
        knownCount += 1;
      } else {
        newOccurrences.push({
          ruleId: check.ruleId,
          reasonCode,
          selector: occurrence.selector,
          html: occurrence.html,
          summary: occurrence.summary
        });
      }
    }
  }

  let staleCount = 0;
  for (const left of remaining.values()) {
    if (left > 0) staleCount += left;
  }

  return {
    totalFail,
    knownCount,
    newCount: newOccurrences.length,
    newOccurrences,
    staleCount
  };
}

module.exports = { buildBaselineEntries, matchBaseline, computeBaselineKey, getReasonCode };
