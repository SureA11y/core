/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check control-name-title-only
 * @atomic true
 * @summary A button or link should not take its name only from its title
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Buttons and links in the accessibility tree with a non-empty `title`
 *   attribute: `<a href>`, `<area href>`, `<button>`, `<input>` of type
 *   `button`, `submit`, `reset` or `image`, and elements whose role
 *   attribute, or ElementInternals, give them the button or link role.
 * @expectation
 *   Accessible Name Computation takes a title as the name only when
 *   nothing else names the element: author naming (`aria-labelledby`,
 *   `aria-label`), an image button's `alt`, an input button's `value`,
 *   or, for buttons and links, their content.
 *   - Something other than the title names the control: pass. The title
 *     is its description, a tooltip.
 *   - The title is its only name: cantTell (`NAME_FROM_TITLE_ONLY`).
 *
 *   The name is valid, so 4.1.2 is met, but a title is shown only on
 *   mouse hover: not on touch screens, not when the control takes focus
 *   from the keyboard, and not as text a person using speech input can
 *   read and say. Check whether the control can be given visible text,
 *   or an `aria-label` when it shows only an icon, with the title kept as
 *   a tooltip if wanted.
 * @reports
 *   - `role`: the control's role, `button` or `link`.
 * @implementation-notes
 * - Best practice, with no WCAG mapping: a title is a valid name under
 *   HTML-AAM, and whether the control needs visible text depends on what
 *   it shows, an icon whose meaning is obvious or one that is not.
 * - Manual: whether the icon or image the control shows makes its purpose
 *   plain is a person's call.
 * - Only the control's own title counts. A title on an image inside a
 *   link names the image, which the image rules judge.
 * - Form fields named only by their title are reported by
 *   form-control-programmatic-label-quality, under 3.3.2.
 * - The query is for `[title]`, so a page without titles costs one
 *   selector match.
 */

const id = 'control-name-title-only';

const meta = {
  title: 'A button or link should not take its name only from its title',
  description:
    'Flags a button or link whose only accessible name is its title attribute, shown only on mouse hover, for manual review.',
  i18n: {
    titleKey: 'controlNameTitleOnly_title',
    descriptionKey: 'controlNameTitleOnly_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'nontext', 'name', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const CONTROL_ROLES = new Set(['button', 'link']);
  const INPUT_BUTTONS = new Set(['button', 'submit', 'reset', 'image']);

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }
  function lower(v) {
    return trim(v).toLowerCase();
  }
  function authorRole(el) {
    try {
      return helpers.aria.getAuthorRole(el) || '';
    } catch {
      return '';
    }
  }
  function implicitRole(el, tag) {
    if ((tag === 'a' || tag === 'area') && dom.hasAttribute(el, 'href')) return 'link';
    if (tag === 'button') return 'button';
    if (tag === 'input' && INPUT_BUTTONS.has(lower(dom.getAttribute(el, 'type')))) return 'button';
    return '';
  }
  // The role the element is exposed with. role="none"/"presentation" on a
  // focusable element gives way to the implicit role (WAI-ARIA's
  // presentational roles conflict resolution).
  function controlRole(el, tag) {
    const role = authorRole(el);
    if (role === 'none' || role === 'presentation') {
      let focusable = false;
      try {
        focusable = !!(helpers.getFocusableInfo(el, ctx) || {}).focusable;
      } catch {}
      return focusable ? implicitRole(el, tag) : '';
    }
    return role || implicitRole(el, tag);
  }
  // Whether the title is the only name. An input button is named by its
  // value, and submit and reset by the browser's default, ahead of the
  // title; getAccessibleNameInfo covers ARIA naming and an image's alt.
  function titleOnly(el, tag) {
    if (tag === 'input') {
      const type = lower(dom.getAttribute(el, 'type'));
      if (type === 'submit' || type === 'reset') return false;
      if (type === 'button' && trim(dom.getAttribute(el, 'value'))) return false;
      const info = helpers.getAccessibleNameInfo(el, ctx);
      return !!(info && info.mechanism === 'title');
    }
    const info = helpers.getNameFromContentInfo(el, ctx);
    if (!info || info.mechanism !== 'title') return false;
    // A custom element may name itself through ElementInternals, which
    // ranks above the title.
    const internals =
      typeof helpers.getInternalsNameInfo === 'function'
        ? helpers.getInternalsNameInfo(el, ctx)
        : null;
    return !(internals && internals.status === 'named');
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of helpers.queryAllSmart('[title]')) {
    if (!el || !trim(dom.getAttribute(el, 'title'))) continue;
    const tag = lower(dom.localName(el));
    const role = controlRole(el, tag);
    if (!CONTROL_ROLES.has(role)) continue;
    const elig = helpers.isIncludedInAccessibilityTree
      ? helpers.isIncludedInAccessibilityTree(el, ctx)
      : helpers.isAccTreeEligible(el, ctx);
    if (!(typeof elig === 'boolean' ? elig : elig && elig.eligible)) continue;
    applicableCount += 1;

    if (!titleOnly(el, tag)) continue;

    let eligInfo = null;
    try {
      eligInfo = helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' });
    } catch {}

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          role === 'link'
            ? 'This link’s only name is its title, which is shown only on mouse hover.'
            : 'This button’s only name is its title, which is shown only on mouse hover.',
        hint: 'Check whether it can have visible text, or an aria-label if it shows only an icon; keep the title as a tooltip if wanted.',
        i18n: {
          summaryKey:
            role === 'link'
              ? 'controlNameTitleOnly_summary_cantTell_link'
              : 'controlNameTitleOnly_summary_cantTell_button',
          hintKey: 'controlNameTitleOnly_hint_cantTell'
        },
        data: {
          details: { reasonCode: 'NAME_FROM_TITLE_ONLY', role },
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
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
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
