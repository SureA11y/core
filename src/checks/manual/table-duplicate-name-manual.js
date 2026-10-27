/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check table-duplicate-name
 * @atomic true
 * @summary A table's caption must not duplicate its summary attribute
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies to <table> elements that have both a <caption> with text
 *   content and a (deprecated but still encountered) summary attribute.
 * @expectation
 *   The caption text and the summary attribute text are not identical
 *   (case-insensitive, normalized). When both are present and say the
 *   same thing, assistive technology that surfaces both announces the
 *   same text twice for one table.
 * @reason-codes
 *   - `TABLE_CAPTION_SUMMARY_DUPLICATE` (cantTell): the table's caption and
 *     its summary attribute say the same text, which may be announced twice.
 *     It leans fail: the page states it.
 *     Basis: HTML table element summary attribute (best practice); H39.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Narrowly scoped to caption-vs-summary duplication specifically, not a
 *   general "table name quality" check.
 */

const id = 'table-duplicate-name';

const meta = {
  title: 'Table caption must not duplicate its summary attribute',
  description:
    "Checks that a <table>'s <caption> text is not identical to its (deprecated) summary attribute.",
  i18n: {
    titleKey: 'tableDuplicateName_title',
    descriptionKey: 'tableDuplicateName_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'tables', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {},
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    TABLE_CAPTION_SUMMARY_DUPLICATE: {
      steps: [
        'Find the table the report names and read its caption and its summary attribute in the page source.',
        'Move to the table with a screen reader and listen to what is announced as it starts.',
        'Note whether the same text is read twice.'
      ],
      passWhen:
        "The table's title is announced once, and the summary (if kept) adds different information, such as how the table is laid out.",
      failWhen:
        'The same text is read twice because caption and summary repeat each other (best practice, H39); remove the summary or make it say something else.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('table[summary]')
    : helpers.queryAll('table[summary]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const summary = normalizeWs(dom.getAttribute(el, 'summary'));
    if (!summary) continue;

    // The table's own caption (its first <caption> child, HTML's
    // table.caption), not one of a table nested in its cells.
    const captionEl = dom.get(el, 'caption') || null;
    const captionText = captionEl ? normalizeWs(dom.textContent(captionEl)) : '';
    if (!captionText) continue;

    applicableCount += 1;

    if (captionText.toLowerCase() !== summary.toLowerCase()) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: "This table's caption duplicates its summary attribute.",
        hint: "Remove the summary attribute, or use it to say something the caption doesn't.",
        i18n: {
          summaryKey: 'tableDuplicateName_summary_cantTell',
          hintKey: 'tableDuplicateName_hint_cantTell',
          params: {}
        },
        lean: {
          toward: 'fail',
          why: "The table's caption and summary say the same thing, so it is read twice.",
          signals: [{ signal: 'caption-equals-summary', value: true }],
          i18n: { whyKey: 'tableDuplicateName_lean_why' }
        },
        data: {
          details: { reasonCode: 'TABLE_CAPTION_SUMMARY_DUPLICATE' }
        }
      })
    );
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
