/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check presentational-elements-absent
 * @atomic true
 * @summary Presentational HTML elements must not be used
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to any scan scope; whether it contains one of the elements RGAA
 *   10.1.1 lists is always an answerable question.
 * @expectation
 *   None of <basefont>, <big>, <blink>, <center>, <font>, <marquee>, <s>,
 *   <strike> or <tt> is present, and <u> is not present either unless the
 *   document has the HTML5 doctype, which gave <u> a meaning of its own.
 *   That is RGAA 10.1.1's list as written: it includes <s>, which HTML5
 *   keeps.
 * @implementation-notes
 * - Opt-in (tag `rgaa`): WCAG does not forbid these elements, so the rule
 *   runs only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 * - Hidden content is checked too (helpers.queryAllSource): 10.1.1 judges
 *   the generated source, and markup inside `hidden` or display:none is part
 *   of it. This also covers <basefont>, which never renders.
 *   includeHiddenElements makes no difference here. <template> content is
 *   not in the DOM tree and is not checked.
 */

const id = 'presentational-elements-absent';

const meta = {
  title: 'Page uses no presentational elements',
  description:
    'Checks that the page contains none of the presentational elements RGAA lists, such as <font>, <center> or <big>.',
  i18n: {
    titleKey: 'presentationalElementsAbsent_title',
    descriptionKey: 'presentationalElementsAbsent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const ELEMENTS = ['basefont', 'big', 'blink', 'center', 'font', 'marquee', 's', 'strike', 'tt'];

  const doctype = dom.doctype(document);
  const isHtml5 =
    !!doctype &&
    String(doctype.name || '').toLowerCase() === 'html' &&
    !doctype.publicId &&
    (!doctype.systemId || doctype.systemId === 'about:legacy-compat');
  const selector = (isHtml5 ? ELEMENTS : ELEMENTS.concat(['u'])).join(', ');

  const nodes = helpers.queryAllSource
    ? helpers.queryAllSource(selector)
    : helpers.queryAll(selector);

  const occurrences = [];
  for (const el of nodes) {
    if (!el || !dom.tagName(el)) continue;
    const element = String(dom.tagName(el)).toLowerCase();
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `The presentational element <${element}> is used.`,
        hint: 'Replace it with the element that carries the meaning, or with CSS for the presentation.',
        i18n: {
          summaryKey: 'presentationalElementsAbsent_summary_fail',
          hintKey: 'presentationalElementsAbsent_hint_fail',
          params: { element }
        },
        data: {
          details: { reasonCode: 'presentationalElement', element },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
