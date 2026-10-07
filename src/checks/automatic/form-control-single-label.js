/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check form-control-single-label
 * @atomic true
 * @summary A form control must not be associated with more than one <label>
 * @standard WCAG 2.2
 * @sc 3.3.2
 * @applicability
 *   Applies to labelable form controls (input, excluding
 *   hidden/submit/reset/button/image; select; textarea).
 * @expectation
 *   At most one <label> that can contribute to the control's accessible name
 *   is associated with it, as HTML's labeled control defines: a
 *   <label for="..."> whose value is the id of the first element with that
 *   id in the label's own tree, or a wrapping <label> without `for` whose
 *   first labelable descendant is the control (a label that both wraps and
 *   self-references via for counts once).
 *   Graded by whether the surplus labels actually compete for the name:
 *   - PASS when an override (aria-labelledby / aria-label) supersedes every
 *     native <label>: the labels then contribute nothing to the name, so
 *     they cannot be ambiguous. A visible-label-vs-name mismatch is SC 2.5.3
 *     Label in Name's concern, not this rule's.
 *   - FAIL when two or more non-empty labels compete and there is no
 *     override: screen readers announce a non-deterministic subset.
 *   - CANTTELL when one non-empty label is joined by empty label
 *     association(s) and there is no override: the name usually resolves to
 *     the real label, but handling of the empty association is not
 *     guaranteed across user agents.
 *   All-empty associations with no override are a missing-name case (the
 *   sibling rule form-control-programmatic-label-present), not an
 *   ambiguity, so this rule stays silent.
 * @reports
 *   - `labelCount`: how many labels are associated with the control. On
 *     the competing-labels failure, only the non-empty ones are counted; on
 *     the empty-label case, the empty ones are counted too.
 *   - `contributingLabelCount` (the empty-label case): how many of those
 *     labels have text, and so give the control its name.
 * @implementation-notes
 * - Distinct, atomic decision from form-control-programmatic-label-present
 *   (that rule checks a label exists at all; this one checks at most one
 *   matters). Whether a label contributes a name is decided by the shared
 *   helpers.labelContributesAccessibleName, so the two rules agree.
 * - Accessibility-tree-ineligible labels (display:none, aria-hidden, etc.)
 *   are excluded before counting: they can't contribute to the name.
 */

const id = 'form-control-single-label';

const meta = {
  title: 'Form controls must not have multiple labels',
  description:
    'Checks that a form control is associated with at most one <label> (by wrapping or by label[for]).',
  i18n: {
    titleKey: 'formControlSingleLabel_title',
    descriptionKey: 'formControlSingleLabel_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag332', 'forms', 'atomic', 'automatic'],
  wcagSc: ['3.3.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '3.3.2',
      title: 'Labels or Instructions',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '3.3.2': ['form-control-single-label'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
  const getAriaNameInfo =
    helpers && typeof helpers.getAriaNameInfo === 'function' ? helpers.getAriaNameInfo : null;
  const labelContributesName =
    helpers && typeof helpers.labelContributesAccessibleName === 'function'
      ? helpers.labelContributesAccessibleName
      : null;

  const selector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]),select,textarea';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    applicableCount += 1;

    // The labels HTML associates with the control (its labeled control):
    // a `for` label matches the first element with that id in its own tree,
    // and a wrapping label without `for` labels only its first labelable
    // descendant.
    const labels = new Set(helpers.getAssociatedLabelElements(el) || []);

    const eligibleLabels = isAccTreeEligible
      ? new Set(
          [...labels].filter((lab) => {
            const elig = isAccTreeEligible(lab);
            return !elig || elig.eligible !== false;
          })
        )
      : labels;

    if (eligibleLabels.size <= 1) continue;

    // An override (aria-labelledby / aria-label) supersedes every native
    // <label>, so the labels contribute nothing to the accessible name and
    // cannot compete.
    const override = getAriaNameInfo ? getAriaNameInfo(el, ctx) : null;
    if (override && override.present && override.value) continue;

    // Without an override the labels feed the name; only labels with their
    // own text compete for it.
    const contributing = labelContributesName
      ? [...eligibleLabels].filter((lab) => labelContributesName(lab))
      : [...eligibleLabels];

    const tag = dom.tagName(el).toLowerCase();

    if (contributing.length >= 2) {
      failOccurrences.push(
        helpers.reportOccurrence(el, {
          summary: 'This form control is associated with more than one <label>.',
          hint: 'Keep only one <label> per form control (either wrapping it or referencing it via for/id).',
          occurrenceOutcome: 'fail',
          i18n: {
            summaryKey: 'formControlSingleLabel_summary_fail',
            hintKey: 'formControlSingleLabel_hint_fail',
            params: { element: tag, labelCount: String(contributing.length) }
          },
          data: {
            details: {
              reasonCode: 'FORM_FIELD_MULTIPLE_LABELS',
              element: tag,
              labelCount: contributing.length
            }
          }
        })
      );
    } else if (contributing.length === 1) {
      cantTellOccurrences.push(
        helpers.reportOccurrence(el, {
          summary:
            'This form control has one labelling <label> plus an extra empty <label> association.',
          hint: 'Remove the redundant empty <label> so exactly one <label> is associated with the control.',
          occurrenceOutcome: 'cantTell',
          i18n: {
            summaryKey: 'formControlSingleLabel_summary_cantTell',
            hintKey: 'formControlSingleLabel_hint_cantTell',
            params: { element: tag, labelCount: String(eligibleLabels.size) }
          },
          uncertainty: {
            code: 'spec-only',
            needed: 'Whether the empty label is filled in at runtime or is simply redundant.',
            evidence: {
              element: tag,
              labelCount: eligibleLabels.size,
              contributingLabelCount: contributing.length
            }
          },
          data: {
            details: {
              reasonCode: 'FORM_FIELD_EXTRA_EMPTY_LABEL',
              element: tag,
              labelCount: eligibleLabels.size,
              contributingLabelCount: contributing.length
            }
          }
        })
      );
    }
    // contributing.length === 0: no label carries text, so nothing competes
    // for the name. A control left unnamed is form-control-programmatic-
    // label-present's concern.
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const resolved = helpers.resolveTieredOutcome
    ? helpers.resolveTieredOutcome(
        failOccurrences,
        cantTellOccurrences,
        rule.defaultSeverity || 'moderate'
      )
    : failOccurrences.length
      ? {
          outcome: 'fail',
          severity: rule.defaultSeverity || 'moderate',
          occurrences: failOccurrences
        }
      : cantTellOccurrences.length
        ? {
            outcome: 'cantTell',
            severity: rule.defaultSeverity || 'moderate',
            occurrences: cantTellOccurrences
          }
        : { outcome: 'pass', severity: 'minor', occurrences: [] };
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
