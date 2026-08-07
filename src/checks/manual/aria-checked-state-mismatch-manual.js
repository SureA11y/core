'use strict';

/**
 * @check aria-checked-state-mismatch
 * @atomic true
 * @summary A native checkbox/radio's aria-checked should match its actual checked/indeterminate state
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Native `<input type="checkbox">` / `<input type="radio">` elements
 *   that carry an explicit `aria-checked` attribute.
 * @expectation
 *   `aria-checked` is redundant on a native checkbox/radio (the role's
 *   checked state is already exposed natively), but when an author sets
 *   it explicitly it should agree with the element's actual state —
 *   otherwise assistive technology is told something different from what
 *   a sighted user perceives.
 * @implementation-notes
 * - Deliberately authored as `type: 'manual'` (cantTell-capped, never
 *   fail), unlike most ARIA-validity rules in this file family. This
 *   engine analyzes STATIC markup only (no script execution) — `.checked`
 *   reliably reflects the static `checked` attribute for freshly-parsed
 *   markup, but a very common, entirely legitimate real-world pattern is a
 *   JS-hydrated widget whose server-rendered HTML intentionally ships
 *   `aria-checked="true"` (or `"mixed"`) BEFORE client JS sets the native
 *   `checked`/`indeterminate` property to match on hydration. A hard
 *   `fail` here would misfire on that pattern constantly. Flagging for
 *   human review (cantTell) captures the same signal without the
 *   false-positive risk of asserting it as a confirmed violation.
 * - `aria-checked="mixed"` is only meaningful for checkboxes (radio
 *   buttons have no indeterminate state).
 * - Any `aria-checked` value other than "true"/"false"/"mixed" (checkbox)
 *   or "true"/"false" (radio) is treated as equivalent to "false".
 * - Not rule-gated on isAccTreeEligible: whether the accessible state
 *   matches is still a markup-correctness property, while engine-level
 *   hidden-subtree filtering applies unless engineOptions.includeHiddenElements
 *   is true.
 */

const id = 'aria-checked-state-mismatch';

const meta = {
  title: 'Native checkbox/radio aria-checked should match its actual state',
  description:
    'Flags a native <input type="checkbox">/<input type="radio"> whose explicit aria-checked value disagrees with its actual checked/indeterminate state, for manual review.',
  i18n: {
    titleKey: 'ariaCheckedStateMismatch_title',
    descriptionKey: 'ariaCheckedStateMismatch_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'aria', 'forms', 'atomic', 'manual'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '4.1.2',
      title: 'Name, Role, Value',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '4.1.2': ['aria-checked-state-mismatch'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(
        'input[type="checkbox"][aria-checked], input[type="radio"][aria-checked]'
      )
    : helpers.queryAll('input[type="checkbox"][aria-checked], input[type="radio"][aria-checked]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const type = trim(el.getAttribute('type')).toLowerCase();
    const isCheckbox = type === 'checkbox';
    const isRadio = type === 'radio';
    if (!isCheckbox && !isRadio) continue;

    const rawAriaChecked = trim(el.getAttribute('aria-checked')).toLowerCase();
    if (!rawAriaChecked) continue;

    applicableCount += 1;

    let normalizedAriaChecked;
    if (isCheckbox) {
      normalizedAriaChecked =
        rawAriaChecked === 'mixed' || rawAriaChecked === 'true' ? rawAriaChecked : 'false';
    } else {
      normalizedAriaChecked = rawAriaChecked === 'true' ? 'true' : 'false';
    }

    let actualState;
    if (isCheckbox && el.indeterminate) {
      actualState = 'mixed';
    } else {
      actualState = el.checked ? 'true' : 'false';
    }

    if (normalizedAriaChecked === actualState) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    occurrences.push({
      selector: stableSelector,
      html,
      summary:
        'This element’s aria-checked value does not match its actual checked/indeterminate state.',
      hint: 'Set aria-checked to match the element’s real state, or remove it — a native checkbox/radio already exposes this state without it.',
      i18n: {
        summaryKey: 'ariaCheckedStateMismatch_summary_cantTell',
        hintKey: 'ariaCheckedStateMismatch_hint_cantTell',
        params: { ariaChecked: normalizedAriaChecked, actualState, type }
      },
      data: {
        details: {
          reasonCode: 'ARIA_CHECKED_STATE_MISMATCH',
          ariaChecked: normalizedAriaChecked,
          actualState,
          type
        }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
