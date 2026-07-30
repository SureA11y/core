'use strict';

/**
 * @check iframe-focusable-content
 * @atomic true
 * @summary <iframe>/<frame> elements with tabindex="-1" must not contain focusable content
 * @standard WCAG 2.2
 * @sc 2.1.1
 * @applicability
 *   Applies to <iframe>/<frame> elements with an explicit negative
 *   tabindex, whose embedded document is same-origin and reachable via
 *   contentDocument (cross-origin/unreachable frames assert nothing — see
 *   implementation notes).
 * @expectation
 *   The frame's embedded document contains no focusable element. Browsers
 *   do not propagate tabindex="-1" on the host <iframe> into its embedded
 *   document: Tab can still reach focusable content inside, even though
 *   the frame itself is skipped. An author who set tabindex="-1" intending
 *   to remove the frame from the tab order has not actually done so if the
 *   embedded document contains focusable content.
 * @implementation-notes
 * - Deliberately scoped to same-origin, currently-accessible content only
 *   (contentDocument access is wrapped in try/catch and treated as "no
 *   constraint asserted" — not counted as applicable — when unreachable),
 *   matching this engine's established scope-limiting rationale (see
 *   src/core/aria-helpers.js file header) rather than guessing at
 *   cross-origin content.
 * - Focusability inside the embedded document is checked with a small,
 *   self-contained heuristic (native interactive tags + non-negative
 *   tabindex) rather than ctx.helpers.getFocusableInfo, since that helper
 *   is built for the outer document's realm/caches, not an embedded
 *   document that may be a distinct realm.
 */

const id = 'iframe-focusable-content';

const meta = {
  title: 'Frames with tabindex="-1" must not contain focusable content',
  description: 'Checks that same-origin <iframe>/<frame> elements with tabindex="-1" do not contain focusable content, since browsers do not propagate that restriction into the frame’s embedded document.',
  i18n: {
    titleKey: 'iframeFocusableContent_title',
    descriptionKey: 'iframeFocusableContent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag211', 'structure', 'atomic', 'automatic', 'keyboard', 'iframe'],
  wcagSc: ['2.1.1'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '2.1.1', title: 'Keyboard', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '2.1.1': ['iframe-tabindex-negative-content-not-focusable'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  function hasFocusableCandidate(doc) {
    if (!doc || !doc.querySelectorAll) return false;
    let els = [];
    try {
      els = doc.querySelectorAll(
        'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
        'select:not([disabled]), textarea:not([disabled]), iframe, [contenteditable="true"], [tabindex]'
      );
    } catch {
      return false;
    }
    for (const el of els) {
      if (!el || !el.getAttribute) continue;
      const raw = el.getAttribute('tabindex');
      if (raw != null) {
        const n = Number(String(raw).trim());
        if (!Number.isNaN(n) && n < 0) continue; // explicitly removed from tab order
      }
      return true;
    }
    return false;
  }

  function getNegativeTabIndex(el) {
    const raw = el.getAttribute('tabindex');
    if (raw == null) return false;
    const n = Number(String(raw).trim());
    return !Number.isNaN(n) && n < 0;
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('iframe, frame') : helpers.queryAll('iframe, frame');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    if (!getNegativeTabIndex(el)) continue;

    let contentDoc = null;
    try {
      contentDoc = el.contentDocument || null;
    } catch {
      contentDoc = null;
    }
    if (!contentDoc || !contentDoc.querySelectorAll) continue; // cross-origin/unreachable: no constraint asserted

    applicableCount += 1;

    if (!hasFocusableCandidate(contentDoc)) continue;

    const tag = el.tagName.toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This frame has tabindex="-1" but its content contains focusable elements, which remain reachable by keyboard.',
      hint: 'Remove focusable content from the frame, or remove tabindex="-1" if the frame is meant to be reachable.',
      i18n: {
        summaryKey: 'iframeFocusableContent_summary_fail',
        hintKey: 'iframeFocusableContent_hint_fail',
        params: { element: tag }
      },
      data: {
        details: { reasonCode: 'IFRAME_TABINDEX_NEGATIVE_CONTENT_FOCUSABLE', element: tag }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'moderate', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };