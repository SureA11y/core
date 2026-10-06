/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check canvas-text-alternative-present
 * @atomic true
 * @summary Accessible <canvas> elements must provide a text alternative
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to <canvas> elements included in the accessibility tree.
 *   Hidden elements are excluded whether or not they are focusable.
 * @expectation
 *   Each applicable <canvas> provides a text alternative via fallback content
 *   or an accessible name, with two exceptions:
 *   - role="img" (the first token of the role attribute that names a known
 *     role, matched case-insensitively) makes the canvas's children
 *     presentational and its name comes from the author only, so fallback
 *     content does not count: aria-labelledby, aria-label or title must name
 *     it.
 *   - role="none"/"presentation" (resolved the same way) marks the canvas
 *     decorative, and it passes.
 *     The role is ignored (presentational role conflict) when the canvas is
 *     focusable or carries aria-label/aria-labelledby, and the canvas is then
 *     judged like any other.
 */

const id = 'canvas-text-alternative-present';

const meta = {
  title: '<canvas> must provide a text alternative',
  description:
    'Checks that <canvas> elements provide a text alternative via fallback content or an accessible name.',
  i18n: {
    titleKey: 'canvas_textAltPresent_title',
    descriptionKey: 'canvas_textAltPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'canvas', 'atomic', 'automatic'],
  wcagSc: ['1.1.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.1.1',
      title: 'Non-text Content',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '1.1.1': ['canvas-text-alternative-present']
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart =
    helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll =
    helpers && typeof helpers.queryAll === 'function'
      ? helpers.queryAll
      : (sel) => {
          try {
            return safeRoot && dom.get(safeRoot, 'querySelectorAll')
              ? Array.from(dom.querySelectorAll(safeRoot, sel))
              : [];
          } catch {
            return [];
          }
        };

  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  // aria-hidden removes the canvas from the accessibility tree, so a text
  // alternative on it cannot reach anyone; aria-hidden-focus reports a
  // focusable one. Matches the other non-text-content rules.
  const isEligibleHelper =
    helpers && typeof helpers.isIncludedInAccessibilityTree === 'function'
      ? helpers.isIncludedInAccessibilityTree
      : helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

  const getTextAlternativeInfo =
    helpers && typeof helpers.getTextAlternativeInfo === 'function'
      ? helpers.getTextAlternativeInfo
      : null;

  const getAriaNameInfo =
    helpers && typeof helpers.getAriaNameInfo === 'function' ? helpers.getAriaNameInfo : null;

  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  function attrText(el, name) {
    try {
      const v = dom.getAttribute(el, name);
      return v == null ? '' : String(v).trim();
    } catch {
      return '';
    }
  }

  // The role attribute is a fallback list: the first token naming a known
  // role wins, case-insensitively; '' when none does (no explicit role).
  function firstRoleToken(el) {
    try {
      return helpers.aria.getExplicitRole(el);
    } catch {
      return '';
    }
  }

  // ARIA's presentational role conflict: a focusable element, or one with a
  // global naming attribute, keeps its native role.
  function isPresentationHonoured(el) {
    if (attrText(el, 'aria-label') || attrText(el, 'aria-labelledby')) return false;
    if (getFocusableInfo) {
      try {
        const fi = getFocusableInfo(el, ctx);
        if (fi && fi.focusable) return false;
      } catch {}
    } else if (attrText(el, 'tabindex') !== '') {
      return false;
    }
    return true;
  }

  // role="img": the name comes from the author (aria-labelledby, aria-label,
  // then title), never from the children.
  function getRoleImgNameInfo(el) {
    let aria = null;
    if (getAriaNameInfo) {
      try {
        aria = getAriaNameInfo(el, ctx);
      } catch {
        aria = null;
      }
    }
    if (aria && aria.present && aria.value) {
      return { present: true, value: aria.value, mechanism: aria.mechanism };
    }
    if (!getAriaNameInfo) {
      const label = attrText(el, 'aria-label');
      if (label) return { present: true, value: label, mechanism: 'aria-label' };
    }
    const title = attrText(el, 'title');
    if (title) return { present: true, value: title, mechanism: 'title' };
    return { present: false, value: '', mechanism: 'none' };
  }

  const canvases = (() => {
    try {
      return Array.from((queryAllSmart ? queryAllSmart('canvas') : queryAll('canvas')) || []);
    } catch {
      return queryAll('canvas');
    }
  })();

  if (!canvases.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of canvases) {
    if (!el) continue;

    // Applicability: included in the accessibility tree.
    if (isEligibleHelper) {
      const elig = (() => {
        try {
          return isEligibleHelper(el, ctx);
        } catch {
          return { eligible: true, reasons: [] };
        }
      })();
      if (elig === false) continue;
      if (elig && elig.eligible === false) continue;
    }

    applicableCount += 1;

    const role = firstRoleToken(el);

    // A decorative canvas needs no text alternative.
    if ((role === 'none' || role === 'presentation') && isPresentationHonoured(el)) continue;

    const isRoleImg = role === 'img';

    // Expectation: must provide a text alternative.
    const ti = isRoleImg
      ? getRoleImgNameInfo(el)
      : getTextAlternativeInfo
        ? (() => {
            try {
              return getTextAlternativeInfo(el, ctx);
            } catch {
              return null;
            }
          })()
        : null;

    const hasTextAlt = !!(ti && ti.present);

    if (hasTextAlt) continue;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const messages = isRoleImg
      ? {
          summary:
            'This <canvas role="img"> has no accessible name; with role="img" its fallback content does not count.',
          hint: 'Name it with aria-label or aria-labelledby, or remove role="img" so that its fallback content can serve as the text alternative.',
          summaryKey: 'canvas_textAltPresent_summary_fail_roleImg',
          hintKey: 'canvas_textAltPresent_hint_fail_roleImg'
        }
      : {
          summary: 'Missing text alternative for <canvas>.',
          hint: 'Provide fallback text inside <canvas> or an accessible name (e.g., aria-label/aria-labelledby).',
          summaryKey: 'canvas_textAltPresent_summary_fail',
          hintKey: 'canvas_textAltPresent_hint_fail'
        };

    const baseOccurrence = {
      selector: '',
      html: '',
      summary: messages.summary,
      hint: messages.hint,
      i18n: {
        summaryKey: messages.summaryKey,
        hintKey: messages.hintKey,
        params: { element: 'canvas' }
      },
      data: {
        // Always log eligibility/filter info (engine contract for targetSet=acc checks)
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        // Debuggable, deterministic helper facts (non-verdict)
        textAlternative: ti || null
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      // Never compute selector/snippet in the rule.
      occurrences.push({ ...baseOccurrence });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
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
