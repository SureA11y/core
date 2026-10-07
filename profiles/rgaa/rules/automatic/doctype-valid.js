/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check doctype-valid
 * @atomic true
 * @summary A declared doctype must be the HTML5 doctype or a W3C recommended one
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document that declares a doctype. A page
 *   with no doctype is notApplicable here: doctype-present fails it under
 *   RGAA 8.1.1. A run narrowed by contextSelector, or by
 *   engineOptions.fragment, is notApplicable: a subtree has no doctype of
 *   its own.
 * @expectation
 *   The doctype is valid (RGAA 8.1.2: « le type de document (balise
 *   doctype) est-il valide ? »): its name is html, and it is either the
 *   HTML5 doctype (no public identifier, and no system identifier or
 *   about:legacy-compat) or one of the W3C recommended doctypes for
 *   HTML 2.0 to 4.01, XHTML 1.0, XHTML 1.1, XHTML Basic, XHTML 1.1 plus
 *   MathML 2.0 (plus SVG 1.1), XHTML+RDFa 1.0 and 1.1, and HTML 4.01+RDFa
 *   1.1. Public identifiers are compared without regard to case.
 * @implementation-notes
 * - The W3C list also has SVG and MathML doctypes. Their name is svg or
 *   math, not html, so they do not describe an HTML page and fail.
 * - RGAA 8.1.3 (the doctype comes before <html>) cannot be judged from the
 *   DOM: the parser drops a doctype written after <html>, so the page
 *   reads as having none, which doctype-present reports.
 * - Opt-in (tag `rgaa`): WCAG does not require a doctype, so the rule runs
 *   only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 */

const id = 'doctype-valid';

const meta = {
  title: 'Declared doctype is valid',
  description:
    'Checks that a declared doctype is the HTML5 doctype or one of the doctypes the W3C recommends.',
  i18n: {
    titleKey: 'doctypeValid_title',
    descriptionKey: 'doctypeValid_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const RECOMMENDED_PUBLIC_IDS = [
    '-//IETF//DTD HTML 2.0//EN',
    '-//W3C//DTD HTML 3.2 FINAL//EN',
    '-//W3C//DTD HTML 4.01//EN',
    '-//W3C//DTD HTML 4.01 TRANSITIONAL//EN',
    '-//W3C//DTD HTML 4.01 FRAMESET//EN',
    '-//W3C//DTD XHTML 1.0 STRICT//EN',
    '-//W3C//DTD XHTML 1.0 TRANSITIONAL//EN',
    '-//W3C//DTD XHTML 1.0 FRAMESET//EN',
    '-//W3C//DTD XHTML 1.1//EN',
    '-//W3C//DTD XHTML BASIC 1.0//EN',
    '-//W3C//DTD XHTML BASIC 1.1//EN',
    '-//W3C//DTD XHTML 1.1 PLUS MATHML 2.0//EN',
    '-//W3C//DTD XHTML 1.1 PLUS MATHML 2.0 PLUS SVG 1.1//EN',
    '-//W3C//DTD XHTML+RDFA 1.0//EN',
    '-//W3C//DTD XHTML+RDFA 1.1//EN',
    '-//W3C//DTD HTML 4.01+RDFA 1.1//EN'
  ];

  const doctype = dom.doctype(document);
  if (!doctype) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const name = String(doctype.name || '');
  const publicId = String(doctype.publicId || '');
  const systemId = String(doctype.systemId || '');
  const isHtml = name.toLowerCase() === 'html';
  const isHtml5 = !publicId && (!systemId || systemId === 'about:legacy-compat');
  const isRecommended = RECOMMENDED_PUBLIC_IDS.includes(publicId.trim().toUpperCase());
  if (isHtml && (isHtml5 || isRecommended)) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  const declared =
    '<!DOCTYPE ' +
    name +
    (publicId ? ' PUBLIC "' + publicId + '"' : systemId ? ' SYSTEM' : '') +
    (systemId ? ' "' + systemId + '"' : '') +
    '>';

  // A doctype is not an element, so the finding is reported on <html>, with
  // the declared doctype as its snippet.
  const occurrence = helpers.reportOccurrence(dom.documentElement(document), {
    selector: 'html',
    html: declared,
    summary: 'The page declares a doctype that is neither HTML5 nor a W3C recommended one.',
    hint: 'Start the page with <!DOCTYPE html>, or with a doctype from the W3C list of recommended doctypes.',
    i18n: {
      summaryKey: 'doctypeValid_summary_fail',
      hintKey: 'doctypeValid_hint_fail',
      params: {}
    },
    data: {
      details: { reasonCode: 'invalidDoctype', doctype: declared },
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
