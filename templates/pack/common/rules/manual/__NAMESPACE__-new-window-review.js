'use strict';

/**
 * A manual rule: it finds what a person has to judge and asks about it. It
 * never fails; it returns cantTell with an occurrence per element to check,
 * or notApplicable when there is nothing to check.
 *
 * @check __NAMESPACE__-new-window-review
 * @summary Links that open a new window say so
 * @applicability
 *   Every link with target="_blank".
 * @expectation
 *   A person checks that the link's text, or something next to it, says it
 *   opens a new window or tab.
 */

const id = '__NAMESPACE__-new-window-review';

const meta = {
  title: 'Links that open a new window say so',
  description: 'Lists the links that open a new window, for a person to check they say so.',
  i18n: {
    titleKey: '__KEY__NewWindowReview_title',
    descriptionKey: '__KEY__NewWindowReview_description'
  },
  tags: ['__NAMESPACE__', 'links', 'atomic', 'manual'],
  wcagSc: [],
  defaultSeverity: 'minor',
  type: 'manual',
  defaultConfidence: 'medium'
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;
  // helpers.dom reads DOM properties and attributes in a way the page's
  // markup can't redirect (the lint rules in eslint.config.js ask for it).
  const { dom } = helpers;

  const links = helpers
    .queryAllSmart('a[href][target]')
    .filter((el) => String(dom.getAttribute(el, 'target') || '').toLowerCase() === '_blank');
  if (!links.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity,
    occurrences: links.map((el) =>
      helpers.reportOccurrence(el, {
        summary: 'This link opens a new window.',
        hint: 'Check that its text, or something next to it, says so.',
        i18n: {
          summaryKey: '__KEY__NewWindowReview_summary',
          hintKey: '__KEY__NewWindowReview_hint'
        },
        data: { details: { reasonCode: 'OPENS_NEW_WINDOW' } }
      })
    )
  };
}

module.exports = { id, meta, runInPage };
