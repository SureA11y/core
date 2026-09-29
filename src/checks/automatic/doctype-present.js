/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check doctype-present
 * @atomic true
 * @summary The document must declare a valid doctype
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document. A run narrowed by
 *   contextSelector, or by engineOptions.fragment, is notApplicable: a
 *   subtree has no doctype of its own.
 * @expectation
 *   The document has a doctype whose name is html, and which is either the
 *   HTML5 doctype (no public identifier) or one of the W3C recommended
 *   doctypes for HTML 2.0 to 4.01, XHTML 1.0, XHTML 1.1 and XHTML Basic
 *   (RGAA 8.1.1 to 8.1.3). A doctype written after <html> is dropped by the
 *   HTML parser, so it reads as missing here, which is what RGAA 8.1.3 fails.
 * @implementation-notes
 * - Opt-in (tag `rgaa`): WCAG does not require a doctype, so the rule runs
 *   only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 */

const id = 'doctype-present';

const meta = {
  title: 'Page declares a valid doctype',
  description:
    'Checks that the document has a doctype, and that it is the HTML5 doctype or a W3C recommended one.',
  i18n: {
    titleKey: 'doctypePresent_title',
    descriptionKey: 'doctypePresent_description'
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
    '-//W3C//DTD XHTML BASIC 1.1//EN'
  ];

  const doctype = document.doctype;
  let reasonCode = null;
  let declared = '';

  if (!doctype) {
    reasonCode = 'missingDoctype';
  } else {
    const name = String(doctype.name || '');
    const publicId = String(doctype.publicId || '');
    const systemId = String(doctype.systemId || '');
    declared =
      '<!DOCTYPE ' +
      name +
      (publicId ? ' PUBLIC "' + publicId + '"' : systemId ? ' SYSTEM' : '') +
      (systemId ? ' "' + systemId + '"' : '') +
      '>';

    const isHtml = name.toLowerCase() === 'html';
    const isHtml5 = !publicId && (!systemId || systemId === 'about:legacy-compat');
    const isRecommended = RECOMMENDED_PUBLIC_IDS.includes(publicId.trim().toUpperCase());
    if (!isHtml || !(isHtml5 || isRecommended)) reasonCode = 'invalidDoctype';
  }

  if (!reasonCode) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  // A doctype is not an element, so the finding is reported on <html>, with
  // the declared doctype as its snippet.
  const missing = reasonCode === 'missingDoctype';
  const occurrence = helpers.reportOccurrence(document.documentElement, {
    selector: 'html',
    html: missing ? '<!DOCTYPE>(missing)' : declared,
    summary: missing
      ? 'The page has no doctype.'
      : 'The page declares a doctype that is neither HTML5 nor a W3C recommended one.',
    hint: 'Start the page with <!DOCTYPE html>, before the <html> element.',
    i18n: {
      summaryKey: missing
        ? 'doctypePresent_summary_fail_missing'
        : 'doctypePresent_summary_fail_invalid',
      hintKey: 'doctypePresent_hint_fail',
      params: {}
    },
    data: {
      details: { reasonCode, doctype: declared },
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
