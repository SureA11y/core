/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check office-document-link
 * @atomic true
 * @summary A downloadable office document should be accessible or have an accessible version
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to links (<a href>, <area href>) whose address, without its
 *   query and fragment, ends with an office document extension: .pdf, .doc,
 *   .docx, .odt, .rtf, .xls, .xlsx, .ods, .ppt, .pptx, .odp or .epub. A page
 *   with none is notApplicable.
 * @expectation
 *   Each such link is flagged for a person to check one of the conditions
 *   of RGAA 13.3.1: the document is accessible, or an accessible version is
 *   offered for download or in HTML.
 * @implementation-notes
 * - Manual (cantTell): the engine cannot open the document.
 * - One occurrence per link, naming the extension.
 * - Opt-in (tag `rgaa`).
 */

const id = 'office-document-link';

const meta = {
  title: 'Downloadable office documents are accessible or have an accessible version',
  description:
    'Flags each link to an office document (PDF, Word, OpenDocument, spreadsheet, presentation, EPUB, RTF) for a person to check the document or its accessible version.',
  i18n: {
    titleKey: 'officeDocumentLink_title',
    descriptionKey: 'officeDocumentLink_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'links', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const EXTENSIONS = /\.(pdf|docx?|odt|rtf|xlsx?|ods|pptx?|odp|epub)$/i;

  const links = helpers.queryAllSmart
    ? helpers.queryAllSmart('a[href], area[href]')
    : helpers.queryAll('a[href], area[href]');

  const occurrences = [];

  for (const link of links) {
    if (!link || !link.getAttribute) continue;
    const href = String(link.getAttribute('href') || '').trim();
    const path = href.split(/[?#]/)[0];
    const m = path.match(EXTENSIONS);
    if (!m) continue;
    const extension = m[1].toLowerCase();

    occurrences.push(
      helpers.reportOccurrence(link, {
        summary: `This link downloads a .${extension} document.`,
        hint: 'Check that the document is accessible, or offer an accessible version, as a download or as an HTML page.',
        i18n: {
          summaryKey: 'officeDocumentLink_summary_cantTell',
          hintKey: 'officeDocumentLink_hint_cantTell',
          params: { extension }
        },
        data: {
          details: { reasonCode: 'officeDocument', extension },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

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
