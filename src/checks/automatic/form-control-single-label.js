/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check form-control-single-label
 * @atomic true
 * @summary A form control should not be associated with more than one <label>
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
 *   - CANTTELL when two or more non-empty labels compete and there is no
 *     override: browsers join their text, in DOM order, into one name,
 *     and only a person can tell whether that joined name still makes
 *     sense ("Address Mailing address") or reads as noise.
 *   - CANTTELL when one non-empty label is joined by empty label
 *     association(s) and there is no override: the name usually resolves to
 *     the real label, but handling of the empty association is not
 *     guaranteed across user agents.
 *   All-empty associations with no override are a missing-name case (the
 *   sibling rule form-control-programmatic-label-present), not an
 *   ambiguity, so this rule stays silent.
 * @reports
 *   - `labelCount`: how many labels are associated with the control. On
 *     the competing-labels case, only the non-empty ones are counted; on
 *     the empty-label case, the empty ones are counted too.
 *   - `contributingLabelCount` (the empty-label case): how many of those
 *     labels have text, and so give the control its name.
 * @reason-codes
 *   - `FORM_FIELD_MULTIPLE_LABELS` (cantTell): two or more labels with text
 *     name the field, and no aria-label or aria-labelledby overrides them;
 *     browsers join them into one name, which a person judges.
 *     It leans pass when the labels repeat each other (one's words appear
 *     in another) or the extra ones only mark the field as required.
 *     Basis: HTML-AAM 4.1.1; WCAG 3.3.2 (not settled); WCAG 4.1.2.
 *   - `FORM_FIELD_EXTRA_EMPTY_LABEL` (cantTell): one label with text and one
 *     or more empty label associations, with no override.
 *     It leans pass: browsers join the labels' text, so the empty one adds nothing.
 *     Basis: HTML-AAM 4.1.1; WCAG 3.3.2 (not settled).
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
  title: 'Form controls should not have multiple labels',
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

  // The text a label gives the control's name: its own aria name, else its
  // content without the control, else its title.
  function labelText(lab, control) {
    try {
      const aria = getAriaNameInfo ? getAriaNameInfo(lab, null, {}) : null;
      if (aria && aria.present && String(aria.value || '').trim()) return String(aria.value);
    } catch {}
    try {
      const info = helpers.getContentNameInfo(lab, null, { skipNode: control });
      if (info && info.present && String(info.value || '').trim()) return String(info.value);
    } catch {}
    return String(dom.getAttribute(lab, 'title') || '');
  }
  // Letters and digits only, lower case, single-spaced.
  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }
  // A label that only marks the field as required or optional ("*",
  // "(required)"), in the languages the dictionaries cover.
  const MARKERS = new Set([
    'required',
    'optional',
    'mandatory',
    'req',
    'obligatoire',
    'facultatif',
    'requis',
    'erforderlich',
    'pflichtfeld',
    'obligatorio',
    'requerido',
    'opcional',
    '必須',
    '任意'
  ]);
  const isMarker = (norm) => norm === '' || MARKERS.has(norm);
  // Whether the joined name only repeats itself: after leaving out marker
  // labels, every label's words appear, as a run, in the longest one.
  function labelsRepeat(texts) {
    const words = texts.map(normalize).filter((t) => !isMarker(t));
    const markers = texts.length - words.length;
    if (!words.length) return null;
    const longest = words.reduce((a, b) => (b.length > a.length ? b : a));
    const repeat = words.every((w) => (' ' + longest + ' ').indexOf(' ' + w + ' ') !== -1);
    return repeat ? { markers, distinct: new Set(words).size } : null;
  }

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
      // Labels that repeat each other, or a marker such as "required",
      // leave the joined name clear, if wordy.
      const repeat = labelsRepeat(contributing.map((lab) => labelText(lab, el)));
      cantTellOccurrences.push(
        helpers.reportOccurrence(el, {
          summary: 'This form control is associated with more than one <label>.',
          hint: 'Browsers join the labels into one name. Check that it still makes sense, or keep one <label> per field.',
          occurrenceOutcome: 'cantTell',
          i18n: {
            summaryKey: 'formControlSingleLabel_summary_cantTell_competing',
            hintKey: 'formControlSingleLabel_hint_cantTell_competing',
            params: { element: tag, labelCount: String(contributing.length) }
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether the name the labels make together is clear.',
            evidence: { element: tag, labelCount: contributing.length }
          },
          ...(repeat
            ? {
                lean: {
                  toward: 'pass',
                  why: 'The labels repeat each other or only mark the field as required, so the joined name stays clear.',
                  signals: [
                    { signal: 'labels-repeat-each-other', value: true },
                    { signal: 'marker-only-labels', value: repeat.markers }
                  ],
                  caution:
                    'A repeated name such as "Email Email address" is wordy; a person judges whether it is still clear.',
                  i18n: {
                    whyKey: 'formControlSingleLabel_lean_why_competing',
                    cautionKey: 'formControlSingleLabel_lean_caution_competing'
                  }
                }
              }
            : {}),
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
          hint: 'Remove the empty <label> so the field has exactly one.',
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
          // Browsers join the labels' text, so an empty one adds nothing.
          lean: {
            toward: 'pass',
            why: 'Browsers join the text of a field’s labels, so the empty label adds nothing and the name is the real label’s text.',
            signals: [{ signal: 'contributing-label-count', value: contributing.length }],
            caution:
              'A user agent that reads only the first label may pick the empty one; a script may fill it in.',
            i18n: {
              whyKey: 'formControlSingleLabel_lean_why',
              cautionKey: 'formControlSingleLabel_lean_caution'
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
