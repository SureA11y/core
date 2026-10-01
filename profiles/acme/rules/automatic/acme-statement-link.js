/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check acme-statement-link
 * @atomic true
 * @summary Every page links to the accessibility statement (ACME B3)
 * @standard ACME 1.0 and 2.0, B3 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document. A run narrowed by
 *   contextSelector, or by engineOptions.fragment, is notApplicable.
 * @expectation
 *   The page has a link to the accessibility statement: a link whose text
 *   contains one of the accepted texts, or whose URL path contains one of
 *   the accepted paths. Under ACME 2.0 (profile acme-2.0) the link must also
 *   sit in the page's footer (a contentinfo landmark); under 1.0 it may be
 *   anywhere.
 * @implementation-notes
 * - The accepted texts and paths are a company's own, so they come from
 *   engineOptions.rules['acme-statement-link'] (ctx.config):
 *   { linkTexts: string[], urlPaths: string[] }. Without them, the rule
 *   accepts "accessibility statement", "declaración de accesibilidad" and
 *   the path "/accessibility".
 * - The footer requirement is 2.0's: the rule reads the version the run
 *   targets from ctx.standard. When no ACME profile selected the run (its
 *   rules chosen by tag), no version is known, and the rule checks what both
 *   versions require: a link anywhere.
 * - ACME is a made-up standard that tests the profile model; it never ships.
 */

const id = 'acme-statement-link';

const meta = {
  title: 'Pages link to the accessibility statement',
  description:
    'Checks that the page links to the accessibility statement, by link text or URL, and under ACME 2.0 from its footer.',
  i18n: {
    titleKey: 'acmeStatementLink_title',
    descriptionKey: 'acmeStatementLink_description'
  },
  helpUrl: null,
  tags: ['acme', 'navigation', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const config = ctx.config && typeof ctx.config === 'object' ? ctx.config : {};
  const list = (value, fallback) =>
    Array.isArray(value) && value.length
      ? value.map((v) => String(v).trim().toLowerCase()).filter(Boolean)
      : fallback;
  const linkTexts = list(config.linkTexts, [
    'accessibility statement',
    'declaración de accesibilidad'
  ]);
  const urlPaths = list(config.urlPaths, ['/accessibility']);
  const needsFooter = !!(
    ctx.standard &&
    ctx.standard.key === 'acme' &&
    ctx.standard.version === '2.0'
  );

  function pathOf(href) {
    try {
      return new URL(href, document.baseURI).pathname.toLowerCase();
    } catch {
      return '';
    }
  }
  function textOf(a) {
    const info = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(a, ctx) : null;
    const name = info && info.value ? info.value : a.textContent || '';
    return String(name).replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function inFooter(a) {
    for (let n = a; n; n = helpers.composedParent(n)) {
      if (n.nodeType !== 1) continue;
      const role = (n.getAttribute('role') || '').trim().toLowerCase();
      if (role === 'contentinfo') return true;
      // <footer> is a contentinfo landmark unless it sits inside sectioning
      // content or main (HTML-AAM).
      if (n.localName === 'footer' && !helpers.hasLandmarkScopingAncestor(n, ctx)) return true;
    }
    return false;
  }

  const links = helpers
    .queryAllSmart('a[href]')
    .filter(
      (a) =>
        linkTexts.some((t) => textOf(a).includes(t)) ||
        urlPaths.some((p) => pathOf(a.getAttribute('href')).includes(p))
    );

  if (links.length && (!needsFooter || links.some(inFooter))) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  const missing = !links.length;
  const occurrence = helpers.reportOccurrence(missing ? document.documentElement : links[0], {
    ...(missing ? { selector: 'html', html: '<html>' } : {}),
    summary: missing
      ? 'The page has no link to the accessibility statement.'
      : 'The link to the accessibility statement is not in the page footer.',
    hint: missing
      ? 'Add a link to the accessibility statement to every page, in its footer.'
      : 'Move the link, or add one, to the page footer (a contentinfo landmark).',
    i18n: {
      summaryKey: missing
        ? 'acmeStatementLink_summary_fail_missing'
        : 'acmeStatementLink_summary_fail_notInFooter',
      hintKey: missing
        ? 'acmeStatementLink_hint_fail_missing'
        : 'acmeStatementLink_hint_fail_notInFooter',
      params: {}
    },
    data: {
      details: { reasonCode: missing ? 'STATEMENT_LINK_MISSING' : 'STATEMENT_LINK_NOT_IN_FOOTER' },
      visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
    }
  });

  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'moderate',
    occurrences: [occurrence]
  };
}

module.exports = { id, meta, runInPage, applicability };
