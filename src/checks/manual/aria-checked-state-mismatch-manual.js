/* SPDX-License-Identifier: MPL-2.0 */

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
 *   it explicitly it should agree with the element's actual state,
 *   otherwise assistive technology is told something different from what
 *   a sighted user perceives.
 * @reports
 *   - `ariaChecked`: the state `aria-checked` announces: `true`, `false`,
 *     or `mixed` (a checkbox only). A value that is not one of these counts
 *     as `false`.
 *   - `actualState`: the state the control is really in: `true`, `false`,
 *     or `mixed` for an indeterminate checkbox.
 *   - `type`: `checkbox` or `radio`.
 * @reason-codes
 *   - `ARIA_CHECKED_STATE_MISMATCH` (cantTell): a native checkbox or radio
 *     button whose aria-checked says a different state from the one the control
 *     is in; a script may still set them to agree.
 *     It leans pass: browsers expose the native state, not aria-checked.
 *     Basis: WCAG 4.1.2 (not settled); ARIA in HTML; HTML-AAM input.
 * @implementation-notes
 * - Authored as `type: 'manual'` (cantTell-capped, never fail), unlike
 *   most ARIA-validity rules in this file family. This engine analyzes
 *   STATIC markup only (no script execution), so `.checked`
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
  coverage: { facetsBySc: { '4.1.2': ['aria-checked-state-mismatch'] } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    ARIA_CHECKED_STATE_MISMATCH: {
      steps: [
        'Wait until the page has fully loaded, then find the checkbox or radio button the report names and note whether it looks checked.',
        'Open the Accessibility pane and read its checked state.',
        'Click it, or press Space, and check that both the look and the state in the Accessibility pane change together, or listen with a screen reader.'
      ],
      passWhen:
        'The state assistive technology reports matches what the control shows, before and after it is changed.',
      failWhen:
        'Assistive technology reports a different state from the one shown, which fails WCAG 4.1.2.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
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
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const type = trim(dom.getAttribute(el, 'type')).toLowerCase();
    const isCheckbox = type === 'checkbox';
    const isRadio = type === 'radio';
    if (!isCheckbox && !isRadio) continue;

    const rawAriaChecked = trim(dom.getAttribute(el, 'aria-checked')).toLowerCase();
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

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          'This element’s aria-checked value does not match its actual checked/indeterminate state.',
        hint: 'Make aria-checked match the real state, or remove it; a native checkbox or radio button already exposes its state.',
        i18n: {
          summaryKey: 'ariaCheckedStateMismatch_summary_cantTell',
          hintKey: 'ariaCheckedStateMismatch_hint_cantTell',
          params: { ariaChecked: normalizedAriaChecked, actualState, type }
        },
        // Browsers expose a native checkbox's or radio's own state and ignore
        // aria-checked on it (Chromium, checked 2026-10-25), so assistive
        // technology hears the real state.
        lean: {
          toward: 'pass',
          why: 'Browsers ignore aria-checked on a native checkbox or radio button and expose its real state.',
          signals: [{ signal: 'native-checkable', value: true }],
          caution:
            'ARIA in HTML forbids aria-checked here; remove it so no tool reads the wrong state.',
          i18n: {
            whyKey: 'ariaCheckedStateMismatch_lean_why',
            cautionKey: 'ariaCheckedStateMismatch_lean_caution'
          }
        },
        data: {
          details: {
            reasonCode: 'ARIA_CHECKED_STATE_MISMATCH',
            ariaChecked: normalizedAriaChecked,
            actualState,
            type
          }
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
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
