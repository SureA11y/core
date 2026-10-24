/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-expanded-state-mismatch
 * @atomic true
 * @summary aria-expanded should match whether the content it controls is shown
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Elements the page shows with `aria-expanded="true"` or
 *   `aria-expanded="false"` and an `aria-controls` that names at least one
 *   element in the same tree. Left out:
 *   - a combobox, whose `aria-controls` names its popup, often kept in the
 *     page while it is collapsed;
 *   - controlled elements that contain the element itself (a tree item
 *     naming its own group's parent).
 * @expectation
 *   `aria-expanded` tells assistive technology whether the content the
 *   element controls is shown. When it says the opposite of what the page
 *   shows, a screen reader user is told a panel is closed while it is open,
 *   or the other way round.
 *   - `aria-expanded="false"`, and every element `aria-controls` names is
 *     shown: cantTell (`EXPANDED_FALSE_CONTROLLED_SHOWN`).
 *   - `aria-expanded="true"`, and every element `aria-controls` names is
 *     hidden: cantTell (`EXPANDED_TRUE_CONTROLLED_HIDDEN`).
 *   - Otherwise: pass.
 *
 *   An element counts as hidden when it is out of the accessibility tree:
 *   `display: none`, `visibility: hidden`, `hidden`, a closed `<details>`,
 *   `content-visibility: hidden`, `inert` or `aria-hidden="true"` on it or
 *   an ancestor, and, in a browser, a box of its own collapsed to no height
 *   or width with its overflow clipped (an accordion panel animated with
 *   `height: 0`). A panel collapsed some other way (a transform, an
 *   ancestor's height) counts as shown, and the content a control expands may stay
 *   in view while collapsed (a paragraph cut to two lines by
 *   `line-clamp`), which is why a finding is a question.
 * @reports
 *   - `ariaExpanded`: `true` or `false`, as the attribute says.
 *   - `controlledCount`: how many elements `aria-controls` names that were
 *     compared.
 * @reason-codes
 *   - `EXPANDED_FALSE_CONTROLLED_SHOWN` (cantTell): an element says
 *     aria-expanded="false" while every element its aria-controls names is
 *     shown.
 *     Basis: WAI-ARIA 1.2 aria-expanded; WCAG 4.1.2 (not settled).
 *   - `EXPANDED_TRUE_CONTROLLED_HIDDEN` (cantTell): an element says
 *     aria-expanded="true" while every element its aria-controls names is
 *     hidden.
 *     Basis: WAI-ARIA 1.2 aria-expanded; WCAG 4.1.2 (not settled).
 * @implementation-notes
 * - ARIA 1.2: `aria-expanded` "indicates if a grouping element owned or
 *   controlled by this element is expanded or collapsed". WCAG 4.1.2 asks
 *   that states be programmatically determinable; a state that contradicts
 *   what is shown fails that in effect, but static markup may catch a
 *   panel mid-transition or a script that hasn't run yet, so the rule is
 *   manual.
 * - Visibility is the engine's accessibility-tree eligibility, cached per
 *   run, and read the same way under `includeHiddenElements`. Only the
 *   controlled elements' own boxes are measured, and only when the page
 *   has a layout, probed once per run.
 * - Other values (`undefined`, a typo) are aria-valid-attr-value's.
 */

const id = 'aria-expanded-state-mismatch';

const meta = {
  title: 'aria-expanded should match whether the controlled content is shown',
  description:
    'Flags an element whose aria-expanded value disagrees with whether the elements its aria-controls names are shown, for manual review.',
  i18n: {
    titleKey: 'ariaExpandedStateMismatch_title',
    descriptionKey: 'ariaExpandedStateMismatch_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'aria', 'structure', 'atomic', 'manual'],
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
  coverage: { facetsBySc: { '4.1.2': ['aria-expanded-state-mismatch'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }
  // Whether the page has a layout to measure (not jsdom), probed once.
  let layout = null;
  function hasLayout() {
    if (layout === null) {
      try {
        const r = dom.getBoundingClientRect(dom.documentElement(document));
        layout = !!r && (r.width > 0 || r.height > 0);
      } catch {
        layout = false;
      }
    }
    return layout;
  }
  // A box collapsed to no height or no width that clips its overflow, as
  // an accordion panel animated with height: 0 is.
  function isCollapsedBox(el) {
    if (!hasLayout()) return false;
    try {
      const cs = helpers.computedStyle(el);
      const clips = (v) => !!v && v !== 'visible';
      if (clips(cs.overflowY) && dom.get(el, 'clientHeight') === 0) return true;
      if (clips(cs.overflowX) && dom.get(el, 'clientWidth') === 0) return true;
    } catch {}
    return false;
  }
  // content-visibility: hidden on the panel itself keeps its box and skips
  // its contents, so nothing in it is shown; an inline or display: contents
  // box can't take it.
  function skipsContents(el) {
    try {
      const cs = helpers.computedStyle(el);
      const display = String((cs && cs.display) || '');
      return (
        !!cs && cs.contentVisibility === 'hidden' && display !== 'inline' && display !== 'contents'
      );
    } catch {
      return false;
    }
  }
  function isHidden(el) {
    try {
      const info = helpers.isAccTreeEligible(el);
      if (info && info.eligible === false) return true;
    } catch {}
    return skipsContents(el) || isCollapsedBox(el);
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of helpers.queryAllSmart('[aria-expanded][aria-controls]')) {
    if (!el) continue;
    const expanded = trim(dom.getAttribute(el, 'aria-expanded')).toLowerCase();
    if (expanded !== 'true' && expanded !== 'false') continue;

    let role = '';
    try {
      role = trim(helpers.aria.getAuthorRole(el)).toLowerCase();
    } catch {}
    if (role === 'combobox') continue;

    // Ids, or element references set from script (ariaControlsElements).
    const refs = helpers
      .getRefElements(el, 'aria-controls', ctx)
      .filter((ref) => ref !== el && !dom.contains(ref, el));
    if (!refs.length) continue;
    applicableCount += 1;

    const hiddenCount = refs.filter(isHidden).length;
    let reasonCode = null;
    if (expanded === 'false' && hiddenCount === 0) reasonCode = 'EXPANDED_FALSE_CONTROLLED_SHOWN';
    else if (expanded === 'true' && hiddenCount === refs.length)
      reasonCode = 'EXPANDED_TRUE_CONTROLLED_HIDDEN';
    if (!reasonCode) continue;

    let eligInfo = null;
    try {
      eligInfo = helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' });
    } catch {}

    const collapsed = expanded === 'false';
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: collapsed
          ? 'aria-expanded="false" says the controlled content is collapsed, but it is shown.'
          : 'aria-expanded="true" says the controlled content is expanded, but it is hidden.',
        hint: collapsed
          ? 'Check whether the content is open; if it is, set aria-expanded="true", or hide the content while collapsed.'
          : 'Check whether the content is open; if it is not, set aria-expanded="false", or show the content while expanded.',
        i18n: {
          summaryKey: collapsed
            ? 'ariaExpandedStateMismatch_summary_cantTell_collapsedShown'
            : 'ariaExpandedStateMismatch_summary_cantTell_expandedHidden',
          hintKey: collapsed
            ? 'ariaExpandedStateMismatch_hint_cantTell_collapsedShown'
            : 'ariaExpandedStateMismatch_hint_cantTell_expandedHidden',
          params: {}
        },
        data: {
          details: { reasonCode, ariaExpanded: expanded, controlledCount: refs.length },
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
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
