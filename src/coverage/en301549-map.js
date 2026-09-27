/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * EN 301 549 chapter 9 (Web) clause for each WCAG Success Criterion.
 *
 * PURPOSE
 * -------
 * Chapter 9 of EN 301 549 restates the WCAG Level A and AA Success Criteria as
 * clauses numbered `9.` + the criterion's own number: WCAG 1.4.3 is clause
 * 9.1.4.3. Which criteria it restates depends on the version of the standard,
 * so the table is keyed by version and lists every clause explicitly rather
 * than deriving `9.` + sc for any criterion:
 *
 * - V3.2.1 (2021-03) restates WCAG 2.1 A and AA, including 9.4.1.1 Parsing.
 * - V4.1.1 (2026-09) restates WCAG 2.2 A and AA: it adds 2.4.11, 2.5.7, 2.5.8,
 *   3.2.6, 3.3.7 and 3.3.8, and leaves 9.4.1.1 void.
 *
 * Clauses the standard marks "Void" (the AAA criteria, and 4.1.1 in V4.1.1)
 * have no row. Titles are the standard's own, so they differ between versions
 * where the standard's wording does: V4.1.1 says "Subtitles" where V3.2.1 says
 * "Captions", and V3.2.1 capitalises "Focus Order".
 *
 * This states a correspondence between two published documents and nothing
 * more. Which version a given law requires, and from when, is not an engine
 * question.
 *
 * SOURCE: ETSI EN 301 549 V3.2.1 (2021-03) and V4.1.1 (2026-09), clause 9.
 * Chapters 10 (non-web documents) and 11 (software) are out of scope: the
 * engine tests web content.
 */

const EN301549_VERSIONS = [
  { version: 'V3.2.1', published: '2021-03', wcagVersion: '2.1' },
  { version: 'V4.1.1', published: '2026-09', wcagVersion: '2.2' }
];

const EN301549_CLAUSES = {
  'V3.2.1': {
    '1.1.1': { clause: '9.1.1.1', title: 'Non-text content' },
    '1.2.1': { clause: '9.1.2.1', title: 'Audio-only and video-only (pre-recorded)' },
    '1.2.2': { clause: '9.1.2.2', title: 'Captions (pre-recorded)' },
    '1.2.3': { clause: '9.1.2.3', title: 'Audio description or media alternative (pre-recorded)' },
    '1.2.4': { clause: '9.1.2.4', title: 'Captions (live)' },
    '1.2.5': { clause: '9.1.2.5', title: 'Audio description (pre-recorded)' },
    '1.3.1': { clause: '9.1.3.1', title: 'Info and relationships' },
    '1.3.2': { clause: '9.1.3.2', title: 'Meaningful sequence' },
    '1.3.3': { clause: '9.1.3.3', title: 'Sensory characteristics' },
    '1.3.4': { clause: '9.1.3.4', title: 'Orientation' },
    '1.3.5': { clause: '9.1.3.5', title: 'Identify input purpose' },
    '1.4.1': { clause: '9.1.4.1', title: 'Use of colour' },
    '1.4.2': { clause: '9.1.4.2', title: 'Audio control' },
    '1.4.3': { clause: '9.1.4.3', title: 'Contrast (minimum)' },
    '1.4.4': { clause: '9.1.4.4', title: 'Resize text' },
    '1.4.5': { clause: '9.1.4.5', title: 'Images of text' },
    '1.4.10': { clause: '9.1.4.10', title: 'Reflow' },
    '1.4.11': { clause: '9.1.4.11', title: 'Non-text contrast' },
    '1.4.12': { clause: '9.1.4.12', title: 'Text spacing' },
    '1.4.13': { clause: '9.1.4.13', title: 'Content on hover or focus' },
    '2.1.1': { clause: '9.2.1.1', title: 'Keyboard' },
    '2.1.2': { clause: '9.2.1.2', title: 'No keyboard trap' },
    '2.1.4': { clause: '9.2.1.4', title: 'Character key shortcuts' },
    '2.2.1': { clause: '9.2.2.1', title: 'Timing adjustable' },
    '2.2.2': { clause: '9.2.2.2', title: 'Pause, stop, hide' },
    '2.3.1': { clause: '9.2.3.1', title: 'Three flashes or below threshold' },
    '2.4.1': { clause: '9.2.4.1', title: 'Bypass blocks' },
    '2.4.2': { clause: '9.2.4.2', title: 'Page titled' },
    '2.4.3': { clause: '9.2.4.3', title: 'Focus Order' },
    '2.4.4': { clause: '9.2.4.4', title: 'Link purpose (in context)' },
    '2.4.5': { clause: '9.2.4.5', title: 'Multiple ways' },
    '2.4.6': { clause: '9.2.4.6', title: 'Headings and labels' },
    '2.4.7': { clause: '9.2.4.7', title: 'Focus visible' },
    '2.5.1': { clause: '9.2.5.1', title: 'Pointer gestures' },
    '2.5.2': { clause: '9.2.5.2', title: 'Pointer cancellation' },
    '2.5.3': { clause: '9.2.5.3', title: 'Label in name' },
    '2.5.4': { clause: '9.2.5.4', title: 'Motion actuation' },
    '3.1.1': { clause: '9.3.1.1', title: 'Language of page' },
    '3.1.2': { clause: '9.3.1.2', title: 'Language of parts' },
    '3.2.1': { clause: '9.3.2.1', title: 'On focus' },
    '3.2.2': { clause: '9.3.2.2', title: 'On input' },
    '3.2.3': { clause: '9.3.2.3', title: 'Consistent navigation' },
    '3.2.4': { clause: '9.3.2.4', title: 'Consistent identification' },
    '3.3.1': { clause: '9.3.3.1', title: 'Error identification' },
    '3.3.2': { clause: '9.3.3.2', title: 'Labels or instructions' },
    '3.3.3': { clause: '9.3.3.3', title: 'Error suggestion' },
    '3.3.4': { clause: '9.3.3.4', title: 'Error prevention (legal, financial, data)' },
    '4.1.1': { clause: '9.4.1.1', title: 'Parsing' },
    '4.1.2': { clause: '9.4.1.2', title: 'Name, role, value' },
    '4.1.3': { clause: '9.4.1.3', title: 'Status messages' }
  },
  'V4.1.1': {
    '1.1.1': { clause: '9.1.1.1', title: 'Non-text content' },
    '1.2.1': { clause: '9.1.2.1', title: 'Audio-only and video-only (pre-recorded)' },
    '1.2.2': { clause: '9.1.2.2', title: 'Subtitles (pre-recorded)' },
    '1.2.3': { clause: '9.1.2.3', title: 'Audio description or media alternative (pre-recorded)' },
    '1.2.4': { clause: '9.1.2.4', title: 'Subtitles (live)' },
    '1.2.5': { clause: '9.1.2.5', title: 'Audio description (pre-recorded)' },
    '1.3.1': { clause: '9.1.3.1', title: 'Info and relationships' },
    '1.3.2': { clause: '9.1.3.2', title: 'Meaningful sequence' },
    '1.3.3': { clause: '9.1.3.3', title: 'Sensory characteristics' },
    '1.3.4': { clause: '9.1.3.4', title: 'Orientation' },
    '1.3.5': { clause: '9.1.3.5', title: 'Identify input purpose' },
    '1.4.1': { clause: '9.1.4.1', title: 'Use of colour' },
    '1.4.2': { clause: '9.1.4.2', title: 'Audio control' },
    '1.4.3': { clause: '9.1.4.3', title: 'Contrast (minimum)' },
    '1.4.4': { clause: '9.1.4.4', title: 'Resize text' },
    '1.4.5': { clause: '9.1.4.5', title: 'Images of text' },
    '1.4.10': { clause: '9.1.4.10', title: 'Reflow' },
    '1.4.11': { clause: '9.1.4.11', title: 'Non-text contrast' },
    '1.4.12': { clause: '9.1.4.12', title: 'Text spacing' },
    '1.4.13': { clause: '9.1.4.13', title: 'Content on hover or focus' },
    '2.1.1': { clause: '9.2.1.1', title: 'Keyboard' },
    '2.1.2': { clause: '9.2.1.2', title: 'No keyboard trap' },
    '2.1.4': { clause: '9.2.1.4', title: 'Character key shortcuts' },
    '2.2.1': { clause: '9.2.2.1', title: 'Timing adjustable' },
    '2.2.2': { clause: '9.2.2.2', title: 'Pause, stop, hide' },
    '2.3.1': { clause: '9.2.3.1', title: 'Three flashes or below threshold' },
    '2.4.1': { clause: '9.2.4.1', title: 'Bypass blocks' },
    '2.4.2': { clause: '9.2.4.2', title: 'Page titled' },
    '2.4.3': { clause: '9.2.4.3', title: 'Focus order' },
    '2.4.4': { clause: '9.2.4.4', title: 'Link purpose (in context)' },
    '2.4.5': { clause: '9.2.4.5', title: 'Multiple ways' },
    '2.4.6': { clause: '9.2.4.6', title: 'Headings and labels' },
    '2.4.7': { clause: '9.2.4.7', title: 'Focus visible' },
    '2.4.11': { clause: '9.2.4.11', title: 'Focus not obscured (minimum)' },
    '2.5.1': { clause: '9.2.5.1', title: 'Pointer gestures' },
    '2.5.2': { clause: '9.2.5.2', title: 'Pointer cancellation' },
    '2.5.3': { clause: '9.2.5.3', title: 'Label in name' },
    '2.5.4': { clause: '9.2.5.4', title: 'Motion actuation' },
    '2.5.7': { clause: '9.2.5.7', title: 'Dragging movements' },
    '2.5.8': { clause: '9.2.5.8', title: 'Target size (minimum)' },
    '3.1.1': { clause: '9.3.1.1', title: 'Language of page' },
    '3.1.2': { clause: '9.3.1.2', title: 'Language of parts' },
    '3.2.1': { clause: '9.3.2.1', title: 'On focus' },
    '3.2.2': { clause: '9.3.2.2', title: 'On input' },
    '3.2.3': { clause: '9.3.2.3', title: 'Consistent navigation' },
    '3.2.4': { clause: '9.3.2.4', title: 'Consistent identification' },
    '3.2.6': { clause: '9.3.2.6', title: 'Consistent help' },
    '3.3.1': { clause: '9.3.3.1', title: 'Error identification' },
    '3.3.2': { clause: '9.3.3.2', title: 'Labels or instructions' },
    '3.3.3': { clause: '9.3.3.3', title: 'Error suggestion' },
    '3.3.4': { clause: '9.3.3.4', title: 'Error prevention (legal, financial, data)' },
    '3.3.7': { clause: '9.3.3.7', title: 'Redundant entry' },
    '3.3.8': { clause: '9.3.3.8', title: 'Accessible authentication (minimum)' },
    '4.1.2': { clause: '9.4.1.2', title: 'Name, role, value' },
    '4.1.3': { clause: '9.4.1.3', title: 'Status messages' }
  }
};

// Every EN 301 549 clause that restates this Success Criterion, one entry per
// version that includes it, oldest version first. An AAA criterion, or one no
// listed version restates, gets an empty list.
function en301549ClausesForSc(sc) {
  const s = String(sc || '').trim();
  const out = [];
  for (const { version } of EN301549_VERSIONS) {
    const row = EN301549_CLAUSES[version][s];
    if (row) out.push({ version, clause: row.clause, title: row.title });
  }
  return out;
}

// The EN 301 549 entries for a list of WCAG criteria, shaped as
// `normativeMappings` entries, in criterion order and oldest version first.
function en301549MappingsForScs(scs) {
  const out = [];
  for (const sc of Array.isArray(scs) ? scs : []) {
    for (const c of en301549ClausesForSc(sc)) {
      out.push({ standard: 'EN 301 549', version: c.version, requirement: c.clause, title: c.title });
    }
  }
  return out;
}

// A rule's `normativeMappings` with the EN 301 549 clause for each of its WCAG
// Success Criteria appended. An entry the rule already declares is not
// repeated. Only WCAG criteria are followed: an Understanding-document entry,
// or one for another standard, shares a `requirement` with a criterion without
// being one.
function withEn301549Mappings(normativeMappings) {
  const list = Array.isArray(normativeMappings) ? normativeMappings : [];
  const scs = list
    .filter((m) => m && m.requirement && (m.standard == null || m.standard === 'WCAG') && !m.type)
    .map((m) => String(m.requirement).trim());
  const key = (m) => `${m.standard}|${m.version}|${m.requirement}`;
  const seen = new Set(list.filter(Boolean).map(key));
  const added = en301549MappingsForScs(scs).filter((m) => {
    if (seen.has(key(m))) return false;
    seen.add(key(m));
    return true;
  });
  return list.concat(added);
}

module.exports = {
  EN301549_VERSIONS,
  EN301549_CLAUSES,
  en301549ClausesForSc,
  en301549MappingsForScs,
  withEn301549Mappings
};
