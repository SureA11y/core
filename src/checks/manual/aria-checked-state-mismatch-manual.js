'use strict';

/**
 * @check a11ycore-aria-checked-state-mismatch
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
 *   a sighted user perceives. This is the same static/live-DOM check
 *   the reference engine's own `aria-conditional-attr` rule performs (verified
 *   directly against its `ariaConditionalCheckboxAttr`/
 *   `ariaConditionalRadioAttr` source).
 * @implementation-notes
 * - Deliberately authored as `type: 'manual'` (cantTell-capped, never
 *   fail), unlike most ARIA-validity rules in this file family. the reference engine
 *   runs as a script injected into the LIVE, already-hydrated DOM, so a
 *   mismatch it reports is a genuine, current-state fact. This engine
 *   analyzes STATIC markup only (no script execution) — `.checked`
 *   reliably reflects the static `checked` attribute for freshly-parsed
 *   markup (verified directly against jsdom), but a very common, entirely
 *   legitimate real-world pattern is a JS-hydrated widget whose
 *   server-rendered HTML intentionally ships `aria-checked="true"` (or
 *   `"mixed"`) BEFORE client JS sets the native `checked`/`indeterminate`
 *   property to match on hydration. A hard `fail` here would misfire on
 *   that pattern constantly — real risk given how common it is in exactly
 *   the kind of JS-framework-heavy pages this engine's own real-world
 *   corpus is full of. Flagging for human review (cantTell) captures the
 *   same signal without the false-positive risk of asserting it as a
 *   confirmed violation.
 * - `aria-checked="mixed"` is only meaningful for checkboxes (radio
 *   buttons have no indeterminate state) — matches the reference engine's own
 *   `normalizeAriaChecked` (radio) vs `normalizeAriaChecked2` (checkbox)
 *   split, verified directly against its source.
 * - Any `aria-checked` value other than "true"/"false"/"mixed" (checkbox)
 *   or "true"/"false" (radio) is treated as equivalent to "false" — also
 *   matches the reference engine's own normalization exactly.
 * - Not gated on isAccTreeEligible: whether the accessible state matches
 *   is a markup-correctness property independent of current visibility.
 */

const id = 'a11ycore-aria-checked-state-mismatch';

const meta = {
  title: 'Native checkbox/radio aria-checked should match its actual state',
  description: 'Flags a native <input type="checkbox">/<input type="radio"> whose explicit aria-checked value disagrees with its actual checked/indeterminate state, for manual review.',
  i18n: {
    titleKey: 'a11ycore_ariaCheckedStateMismatch_title',
    descriptionKey: 'a11ycore_ariaCheckedStateMismatch_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'aria', 'forms', 'atomic', 'manual'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '4.1.2': ['aria-checked-state-mismatch'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  function trim(v) { return (v == null ? '' : String(v)).trim(); }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('input[type="checkbox"][aria-checked], input[type="radio"][aria-checked]', safeRoot)
    : helpers.queryAll('input[type="checkbox"][aria-checked], input[type="radio"][aria-checked]', safeRoot);

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
      normalizedAriaChecked = (rawAriaChecked === 'mixed' || rawAriaChecked === 'true') ? rawAriaChecked : 'false';
    } else {
      normalizedAriaChecked = (rawAriaChecked === 'true') ? 'true' : 'false';
    }

    let actualState;
    if (isCheckbox && el.indeterminate) {
      actualState = 'mixed';
    } else {
      actualState = el.checked ? 'true' : 'false';
    }

    if (normalizedAriaChecked === actualState) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This element’s aria-checked value does not match its actual checked/indeterminate state.',
      hint: 'Set aria-checked to match the element’s real state, or remove it — a native checkbox/radio already exposes this state without it.',
      i18n: {
        summaryKey: 'a11ycore_ariaCheckedStateMismatch_summary_cantTell',
        hintKey: 'a11ycore_ariaCheckedStateMismatch_hint_cantTell',
        params: { ariaChecked: normalizedAriaChecked, actualState, type }
      },
      data: {
        details: { reasonCode: 'ARIA_CHECKED_STATE_MISMATCH', ariaChecked: normalizedAriaChecked, actualState, type }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'moderate', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
