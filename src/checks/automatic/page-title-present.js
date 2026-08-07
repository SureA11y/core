/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

const id = 'page-title-present';

const meta = {
  title: 'Page title is present and non-empty',
  description: 'Checks that the document has a non-empty <title> element (WCAG 2.2 SC 2.4.2).',
  i18n: {
    titleKey: 'pageTitlePresent_title',
    descriptionKey: 'pageTitlePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag242', 'titles', 'atomic', 'navigation', 'automatic'],
  wcagSc: ['2.4.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.2',
      title: 'Page Titled',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '2.4.2': ['page-title-present'] } }
};

// This check is inherently whole-document (does the PAGE have this
// property?), not evaluable per-subtree -- notApplicable when contextSelector
// scoped this run narrower than the whole document, or when
// engineOptions.fragment:true was set (see helpers.isWholeDocumentScope).
function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const occurrences = [];
  let applicableCount = 1;

  // Not restricted to `head > title`: per HTML parsing, a <title> encountered
  // after <head> has closed is not re-parented into <head>, yet the browser
  // (and document.title, used below) still recognizes it as the document's
  // title — matching that here avoids a false "missing title" report for a
  // <title> that legitimately ended up outside <head>.
  const titleEl = document.querySelector('title');
  const titleText = (document.title || '').replace(/\s+/g, ' ').trim();

  const missingTitleEl = !titleEl;
  const emptyTitle = !missingTitleEl && titleText.length === 0;

  if (missingTitleEl || emptyTitle) {
    const reasonCode = missingTitleEl ? 'missingTitleElement' : 'emptyTitleText';

    const occBase = {
      selector: 'head > title',
      html: '',
      summary: missingTitleEl
        ? 'The page is missing a <title> element.'
        : 'The page has an empty <title>.',
      hint: 'Provide a descriptive, non-empty <title> that identifies the page topic or purpose.',
      i18n: {
        summaryKey: missingTitleEl
          ? 'pageTitlePresent_summary_fail_missing'
          : 'pageTitlePresent_summary_fail_empty',
        hintKey: 'pageTitlePresent_hint_fail',
        params: {}
      },
      data: {
        details: {
          reasonCode,
          titleText
        },
        visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    };

    if (!missingTitleEl && titleEl && helpers && typeof helpers.reportOccurrence === 'function') {
      // empty title: we have a node, so engine can attach html
      occurrences.push(helpers.reportOccurrence(titleEl, occBase));
    } else {
      // missing title element: no node exists, keep deterministic html string
      occurrences.push({ ...occBase, html: '<title>(missing)</title>' });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage, applicability };
