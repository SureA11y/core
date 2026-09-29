/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check fake-list
 * @atomic true
 * @summary Text laid out as a list should use list markup
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to text outside any list that looks like one: two or more lines
 *   of one element, split by <br>, or two or more consecutive sibling
 *   paragraphs, each starting with the same bullet character (•, -, *, …)
 *   or with consecutive numbers ("1.", "2." or "1)", "2)"). A page with
 *   none is notApplicable.
 * @expectation
 *   Such text is flagged for a person to decide whether it is a list, which
 *   RGAA 9.3.1 (bullets) and 9.3.2 (numbers) want marked up with <ul>/<ol>
 *   and <li>, or role="list" and role="listitem".
 * @implementation-notes
 * - Manual (cantTell): a run of lines starting with a dash can be dialogue.
 * - Text inside <ul>, <ol>, role="list", <pre>, <code> or <textarea> is
 *   skipped. A <div> counts as a paragraph only when it holds no block
 *   elements.
 * - One occurrence per run, reported on the element holding the lines or on
 *   the first paragraph of the run.
 * - Opt-in (tag `rgaa`).
 */

const id = 'fake-list';

const meta = {
  title: 'Text laid out as a list uses list markup',
  description:
    'Flags consecutive lines or paragraphs that start with bullets or consecutive numbers but are not marked up as a list, for a person to decide whether they are one.',
  i18n: {
    titleKey: 'fakeList_title',
    descriptionKey: 'fakeList_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const BULLETS = '•·‣◦▪▫■□●○◆◇►▸▶–—-*+✓✔→';
  const SKIP = 'ul, ol, [role="list"], pre, code, textarea, script, style, template';
  const BLOCKS = 'p, div, ul, ol, dl, table, h1, h2, h3, h4, h5, h6, section, article, blockquote';
  const MIN_ITEMS = 2;

  function collapse(v) {
    return String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  }

  // The marker a line starts with: { kind, key, n }, or null.
  function markerOf(line) {
    const first = line.charAt(0);
    if (first && BULLETS.includes(first) && /^.\s+\S/u.test(line)) {
      return { kind: 'unordered', key: first };
    }
    const m = line.match(/^(\d{1,3})([.)])\s+\S/);
    if (m) return { kind: 'ordered', key: m[2], n: Number(m[1]) };
    return null;
  }

  // Whether every line starts with the same kind of marker, numbers counting up by one.
  function listKind(lines) {
    if (lines.length < MIN_ITEMS) return null;
    const markers = lines.map(markerOf);
    if (markers.some((m) => !m)) return null;
    const [first] = markers;
    for (let i = 1; i < markers.length; i += 1) {
      const m = markers[i];
      if (m.kind !== first.kind || m.key !== first.key) return null;
      if (m.kind === 'ordered' && m.n !== first.n + i) return null;
    }
    return first.kind;
  }

  function linesOf(el) {
    const lines = [''];
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === 1 && String(node.tagName).toLowerCase() === 'br') lines.push('');
      else lines[lines.length - 1] += ' ' + (node.textContent || '');
    }
    return lines.map(collapse).filter(Boolean);
  }

  function isParagraph(el) {
    const tag = String(el.tagName).toLowerCase();
    if (tag === 'p') return true;
    return tag === 'div' && !el.querySelector(BLOCKS);
  }

  const found = [];
  const reported = new Set();

  function report(el, kind, items) {
    reported.add(el);
    const ordered = kind === 'ordered';
    found.push({
      el,
      occurrence: helpers.reportOccurrence(el, {
        summary: ordered
          ? `These ${items} lines start with consecutive numbers but are not marked up as a list.`
          : `These ${items} lines start with the same bullet but are not marked up as a list.`,
        hint: ordered
          ? 'If this is a list, use <ol> and <li> (or role="list" and role="listitem"), and let the list number the items.'
          : 'If this is a list, use <ul> and <li> (or role="list" and role="listitem"), and style the bullets with CSS.',
        i18n: {
          summaryKey: ordered
            ? 'fakeList_summary_cantTell_ordered'
            : 'fakeList_summary_cantTell_unordered',
          hintKey: ordered ? 'fakeList_hint_cantTell_ordered' : 'fakeList_hint_cantTell_unordered',
          params: { items: String(items) }
        },
        data: {
          details: { reasonCode: ordered ? 'orderedListAsText' : 'unorderedListAsText', items },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    });
  }

  const candidates = helpers.queryAllSmart
    ? helpers.queryAllSmart('p, div, td, th, dd, li, blockquote')
    : helpers.queryAll('p, div, td, th, dd, li, blockquote');

  // Lines split by <br> inside one element.
  for (const el of candidates) {
    if (!el || !el.querySelector || el.closest(SKIP)) continue;
    if (!Array.from(el.children).some((c) => String(c.tagName).toLowerCase() === 'br')) continue;
    const lines = linesOf(el);
    const kind = listKind(lines);
    if (kind) report(el, kind, lines.length);
  }

  // Runs of consecutive sibling paragraphs.
  const seen = new Set();
  for (const el of candidates) {
    if (!el || seen.has(el) || !isParagraph(el) || el.closest(SKIP)) continue;
    const run = [el];
    let next = el.nextElementSibling;
    while (next && isParagraph(next)) {
      run.push(next);
      next = next.nextElementSibling;
    }
    run.forEach((p) => seen.add(p));
    // Within a run, keep the longest stretch that reads as one list.
    let start = 0;
    while (start < run.length) {
      let best = 0;
      for (let end = run.length; end >= start + MIN_ITEMS; end -= 1) {
        const slice = run.slice(start, end);
        if (slice.some((p) => reported.has(p))) continue;
        if (listKind(slice.map((p) => collapse(p.textContent)))) {
          best = end;
          break;
        }
      }
      if (best) {
        const slice = run.slice(start, best);
        report(slice[0], listKind(slice.map((p) => collapse(p.textContent))), slice.length);
        start = best;
      } else {
        start += 1;
      }
    }
  }

  // Both passes report in document order; merge them.
  const occurrences = found
    .sort((a, b) => (a.el.compareDocumentPosition(b.el) & 2 ? 1 : -1))
    .map((f) => f.occurrence);

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
