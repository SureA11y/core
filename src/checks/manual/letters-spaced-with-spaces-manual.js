/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check letters-spaced-with-spaces
 * @atomic true
 * @summary Letters of a word should not be spaced out with space characters
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to text with four or more single letters in a row separated by
 *   spaces ("S O L D E S"). The text is an element's own text, outside
 *   <pre>, <code>, <textarea>, <script> and <style>. A page with none is
 *   notApplicable.
 * @expectation
 *   Such text is flagged for a person to confirm whether it is a word
 *   spaced out with spaces, which RGAA 10.1.3 forbids: a screen reader
 *   spells it letter by letter. CSS letter-spacing gives the same look.
 * @implementation-notes
 * - Manual (cantTell): a row of single letters can be a list of options or
 *   an example, not a word.
 * - One occurrence per element, naming the first such run.
 * - Opt-in (tag `rgaa`).
 */

const id = 'letters-spaced-with-spaces';

const meta = {
  title: 'Letters of a word are not spaced out with spaces',
  description:
    'Flags text where four or more single letters in a row are separated by spaces, for a person to confirm whether a word is spaced out that way.',
  i18n: {
    titleKey: 'lettersSpacedWithSpaces_title',
    descriptionKey: 'lettersSpacedWithSpaces_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'presentation', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const SKIP = 'pre, code, kbd, samp, textarea, script, style, template';
  // Four or more single letters, each separated by spaces (including no-break spaces).
  const SPACED = /(?:^|[\s\u00a0])(\p{L}(?:[ \u00a0]+\p{L}){3,})(?=$|[\s\u00a0.,;:!?])/u;

  function ownText(el) {
    return Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.nodeValue)
      .join(' ');
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('body *')
    : helpers.queryAll('body *');

  const occurrences = [];

  for (const el of nodes) {
    if (!el || !el.childNodes || el.closest(SKIP)) continue;
    const m = ownText(el).match(SPACED);
    if (!m) continue;
    const text = m[1].replace(/[ \u00a0]+/g, ' ');
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `The text "${text}" has its letters separated by spaces.`,
        hint: 'If this is a word, write it without spaces and use the CSS letter-spacing property for the spaced-out look.',
        i18n: {
          summaryKey: 'lettersSpacedWithSpaces_summary_cantTell',
          hintKey: 'lettersSpacedWithSpaces_hint_cantTell',
          params: { text }
        },
        data: {
          details: { reasonCode: 'lettersSeparatedBySpaces', text },
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
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
