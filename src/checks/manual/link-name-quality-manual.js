/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check link-name-quality
 * @atomic true
 * @summary Link text should not be a generic, non-descriptive phrase
 * @standard WCAG 2.2
 * @sc 2.4.4
 * @applicability
 *   Elements matching `a[href], area[href], [role="link"]` with a
 *   non-empty computed accessible name (programmatic first, then "name
 *   from content", same two-step resolution as `link-name-present`,
 *   same selector too). Links with no name at all are
 *   `link-name-present`'s concern, not this rule's.
 * @expectation
 *   The link's full accessible name, normalized (trimmed, case-folded,
 *   trailing punctuation stripped), is not an exact match for a known
 *   non-descriptive phrase ("click here", "read more", "more", "here",
 *   "details", "link", etc., WCAG technique F84's known failure pattern
 *   for SC 2.4.4) or a bare file-format/type name ("HTML", "PDF", "EPUB",
 *   ...) with no adjacent context (an aria-describedby target, the
 *   enclosing list item/table cell/paragraph's own text, or (format
 *   names only) a table's first-row header) naming what it belongs to.
 * @implementation-notes
 * - EXACT match only, on purpose, against small, well-established
 *   phrase lists, not a substring/contains check. "Read more about our
 *   privacy policy" does not match "read more"; only the bare phrase
 *   alone does. This keeps false positives near zero at the cost of
 *   not catching every possible non-descriptive phrasing (e.g. "click
 *   this", a legitimate but uncommon variant, is not in either list).
 * - Adjacent-context detection climbs through a bare wrapping list into
 *   an outer list item, so "Ulysses" heading a list of per-format
 *   download links still counts as that list's context. The table-header
 *   signal is format-name-only: a header cell can be present and still
 *   say nothing about what a generic "Download" link in the same row
 *   leads to, so the boilerplate-phrase list doesn't get that credit.
 * - Still `type: 'manual'` (cantTell-capped, never fail): finding no
 *   adjacent context is a strong signal, not proof that context doesn't
 *   exist elsewhere (a preceding heading several rows up, page-level
 *   framing) or that the surrounding text actually disambiguates.
 *   Flagging is for review, not a definitive violation.
 * - Reuses the same accessible-name computation as `link-name-present`
 *   (`getAccessibleNameInfo` then `getContentNameInfo` as fallback), so
 *   this benefits from the same "name from content" recursion fix
 *   (img alt / nested role="img" aria-label count toward the name).
 */

const id = 'link-name-quality';

const meta = {
  title: 'Link text should be descriptive, not generic',
  description:
    'Flags links whose full accessible name is a known non-descriptive phrase (e.g. "click here", "read more", "more") or a bare file-format name (e.g. "HTML", "PDF") with no adjacent context naming what it leads to, for manual review of whether the purpose is clear.',
  i18n: {
    titleKey: 'linkNameQuality_title',
    descriptionKey: 'linkNameQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag244', 'navigation', 'quality', 'atomic', 'manual'],
  wcagSc: ['2.4.4'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.4',
      title: 'Link Purpose (In Context)',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '2.4.4': ['link-text-descriptive-evidence'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const GENERIC_LINK_TEXT = new Set([
    'click here',
    'here',
    'click',
    'more',
    'more info',
    'more information',
    'read more',
    'learn more',
    'continue reading',
    'continue',
    'details',
    'more details',
    'link',
    'this link',
    'go',
    'download',
    'view more',
    'see more',
    'info'
  ]);

  const FORMAT_NAME_LINK_TEXT = new Set([
    'html',
    'pdf',
    'epub',
    'txt',
    'plain text',
    'doc',
    'docx',
    'xml',
    'zip',
    'mp3',
    'mp4',
    'csv',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'json',
    'rtf'
  ]);

  const CONTEXT_BLOCK_TAGS = new Set(['td', 'th', 'p', 'dd', 'blockquote', 'figcaption', 'dt']);

  function normalize(s) {
    return (s == null ? '' : String(s))
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/[.,;:!?]+$/g, '')
      .trim();
  }

  function ownDirectText(el) {
    let out = '';
    const kids = el.childNodes || [];
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i];
      if (n.nodeType === 3) out += n.nodeValue || '';
    }
    return out.replace(/\s+/g, ' ').trim();
  }

  function isSubstantiveContext(text) {
    return !!text && text.length >= 3 && /\p{L}/u.test(text);
  }

  // Direct text of the nearest enclosing list item/table cell/paragraph,
  // climbing through a wrapping <ul>/<ol> into an outer <li> when the
  // immediate one carries none of its own (a heading li wrapping a
  // nested list of links, e.g. "Ulysses" above per-format download
  // links).
  function nearestBlockContextText(el) {
    let node = el.parentElement;
    let liHops = 0;
    while (node) {
      const tag = (node.tagName || '').toLowerCase();
      if (tag === 'li') {
        const text = ownDirectText(node);
        if (text) return text;
        liHops += 1;
        if (liHops >= 4) return '';
        const list = node.parentElement;
        node = list ? list.parentElement : null;
        continue;
      }
      if (CONTEXT_BLOCK_TAGS.has(tag)) return ownDirectText(node);
      return '';
    }
    return '';
  }

  function describedByContextText(el) {
    const describedBy = el.getAttribute ? el.getAttribute('aria-describedby') : null;
    if (!describedBy || !describedBy.trim() || !helpers.getTextFromIdRefs) return '';
    try {
      const info = helpers.getTextFromIdRefs(describedBy, ctx);
      return info && info.text ? info.text.replace(/\s+/g, ' ').trim() : '';
    } catch {
      return '';
    }
  }

  // A table's first-row header text, when the link sits in a later row of
  // the same table -- naming the row's subject is exactly what turns a
  // bare format name ("HTML") into a link whose destination is clear.
  function firstRowHeaderText(el) {
    const cell = el.closest ? el.closest('td, th') : null;
    if (!cell) return '';
    const table = cell.closest ? cell.closest('table') : null;
    if (!table || !table.rows || !table.rows.length) return '';
    const headerRow = table.rows[0];
    const cellRow = cell.closest ? cell.closest('tr') : null;
    if (!cellRow || headerRow === cellRow) return '';
    const ths = headerRow.querySelectorAll ? headerRow.querySelectorAll('th') : [];
    if (!ths.length) return '';
    return Array.prototype.map
      .call(ths, (th) => th.textContent || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function hasAdequateContext(el, tier) {
    if (isSubstantiveContext(describedByContextText(el))) return true;
    if (isSubstantiveContext(nearestBlockContextText(el))) return true;
    if (tier === 'format' && isSubstantiveContext(firstRowHeaderText(el))) return true;
    return false;
  }

  const selector = 'a[href], area[href], [role="link"]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
    const programmaticName = nameInfo && typeof nameInfo.value === 'string' ? nameInfo.value : '';

    let rawName = programmaticName;
    if (!rawName.trim() && helpers.getContentNameInfo) {
      const contentInfo = helpers.getContentNameInfo(el, ctx);
      rawName = contentInfo && contentInfo.present ? contentInfo.value : '';
    }

    const normalized = normalize(rawName);
    if (!normalized) continue; // no name at all: link-name-present's concern, not this rule's.

    applicableCount += 1;

    const isGeneric = GENERIC_LINK_TEXT.has(normalized);
    const isFormatName = !isGeneric && FORMAT_NAME_LINK_TEXT.has(normalized);
    if (!isGeneric && !isFormatName) continue;

    const tier = isGeneric ? 'generic' : 'format';
    if (hasAdequateContext(el, tier)) continue;

    const eligInfo = helpers.getEligibilityInfo
      ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
      : null;

    const name = rawName.trim();
    const reportOpts = isGeneric
      ? {
          summary: `This link's accessible name ("${name}") is a generic, non-descriptive phrase.`,
          hint: 'Make the link text itself describe its destination/purpose (e.g. "Download the 2026 pricing guide" instead of "Download"), or confirm the surrounding context already makes the purpose clear.',
          i18n: {
            summaryKey: 'linkNameQuality_summary_cantTell',
            hintKey: 'linkNameQuality_hint_cantTell',
            params: { name }
          },
          data: {
            details: { reasonCode: 'GENERIC_LINK_TEXT', normalizedName: normalized },
            visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
          }
        }
      : {
          summary: `This link's accessible name ("${name}") names a file format/type but not the document it belongs to.`,
          hint: 'Name the document in the link text or in nearby text/a heading the link is associated with (e.g. "Download the annual report (HTML)" instead of a bare "HTML").',
          i18n: {
            summaryKey: 'linkNameQuality_summary_cantTell_formatName',
            hintKey: 'linkNameQuality_hint_cantTell_formatName',
            params: { name }
          },
          data: {
            details: { reasonCode: 'AMBIGUOUS_FORMAT_NAME', normalizedName: normalized },
            visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
          }
        };

    occurrences.push(helpers.reportOccurrence(el, reportOpts));
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }

  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
