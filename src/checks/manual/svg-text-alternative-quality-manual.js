/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check svg-text-alternative-quality
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @applicability
 *   Applies to inline <svg> elements that already carry a text alternative:
 *   non-empty <title> or <desc> text, a non-empty aria-label, or an
 *   aria-labelledby that resolves to non-empty text. <desc> counts here as
 *   something to review even though it never contributes to the accessible
 *   name: that distinction is svg-text-alternative-present's. The element
 *   must be included in the accessibility tree, and
 *   role="presentation"/"none" takes it out of scope unless it is focusable,
 *   which restores its role.
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 * @reports
 *   - `hasNonEmptyTitle`: `true` when the first <title> inside the <svg> has
 *     text.
 *   - `hasNonEmptyDesc`: `true` when the first <desc> inside the <svg> has
 *     text.
 *   - `ariaLabel`: the `aria-label` value, or `null` when there is none.
 *   - `ariaLabelledBy`: the `aria-labelledby` value, the ids it points to,
 *     or `null` when there is none.
 *   - `ariaLabelledByText`: the text of the elements `aria-labelledby`
 *     points to, up to 120 characters. Only looked up when there is no
 *     `aria-label`; `null` otherwise or when it resolves to nothing.
 *   - `reasonCode`: `IMAGE_ONLY_CONTROL_CONTENT` when the <svg> is the
 *     only content of a link or button (no text and no other image in it),
 *     so its text alternative is the control's name, with `controlContent`
 *     naming the control's role (`link` or `button`);
 *     `TEXT_ALTERNATIVE_REVIEW` otherwise.
 * @reason-codes
 *   - `TEXT_ALTERNATIVE_REVIEW` (cantTell): an <svg> has a text
 *     alternative, and a person checks that it conveys what the graphic
 *     shows.
 *     Basis: WCAG 1.1.1 (not settled); ACT qt1vmo; SVG-AAM.
 *   - `IMAGE_ONLY_CONTROL_CONTENT` (cantTell): the <svg> is the only
 *     content of a link or button, so its text alternative is the
 *     control's name and should say what the control does.
 *     Basis: WCAG 1.1.1 (not settled); ACT qt1vmo; accname 1.2.
 */

const id = 'svg-text-alternative-quality';

const meta = {
  title: '<svg> text alternative must be appropriate (manual review)',
  description:
    'Flags applicable <svg> graphics with a detected text alternative for human review of appropriateness.',
  i18n: {
    titleKey: 'svg_textAltQuality_title',
    descriptionKey: 'svg_textAltQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'svg', 'manual', 'atomic'],
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
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '1.1.1': ['text-alternative-quality']
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

  const buildSelector =
    helpers && typeof helpers.buildSelector === 'function'
      ? helpers.buildSelector
      : (el) => {
          try {
            if (!el || !dom.tagName(el)) return 'html';
            const tag = (dom.tagName(el) || 'html').toLowerCase();
            return dom.get(el, 'id') ? `${tag}#${dom.get(el, 'id')}` : tag;
          } catch {
            return 'html';
          }
        };

  const getOuterHtmlSnippet =
    helpers && typeof helpers.getOuterHtmlSnippet === 'function'
      ? helpers.getOuterHtmlSnippet
      : (el) => {
          try {
            return el && dom.outerHTML(el) ? String(dom.outerHTML(el)).slice(0, 2000) : '';
          } catch {
            return '';
          }
        };

  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  function isRolePresentationExcluded(el) {
    // The resolved role: the first token naming a known role, in any case.
    const role = (() => {
      try {
        return helpers.aria.getExplicitRole(el);
      } catch {
        return '';
      }
    })();
    if (role !== 'presentation' && role !== 'none') return false;

    // Exclude only when NOT focusable (mirrors img-alt-present policy)
    let focusable;
    if (getFocusableInfo) {
      const fi = (() => {
        try {
          return getFocusableInfo(el, ctx);
        } catch {
          return null;
        }
      })();
      focusable = !!(fi && fi.focusable);
    } else {
      const tabindex = dom.getAttribute(el, 'tabindex');
      focusable =
        tabindex != null &&
        String(tabindex).trim() !== '' &&
        !Number.isNaN(Number(String(tabindex).trim()));
    }
    return !focusable;
  }

  const els = (() => {
    try {
      return Array.from((queryAllSmart ? queryAllSmart('svg') : queryAll('svg')) || []);
    } catch {
      return queryAll('svg');
    }
  })();

  if (!els.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // 'link' or 'button' when this image is the only content of one (no text
  // and no other image in it), '' otherwise. A report may want the image
  // judged with the control it names: its text alternative is then the
  // control's name (H30).
  const CONTROL_ROLES = new Set(['link', 'button']);
  const OTHER_CONTENT_TAGS = new Set([
    'img',
    'svg',
    'canvas',
    'input',
    'video',
    'object',
    'embed',
    'iframe'
  ]);
  function onlyContentOf(el) {
    let control = null;
    let role = '';
    let cur = helpers.flatParentElement ? helpers.flatParentElement(el) : dom.parentElement(el);
    for (let steps = 0; cur && steps < 50; steps++) {
      try {
        role = (helpers.getRoleInfo && (helpers.getRoleInfo(cur, ctx) || {}).role) || '';
      } catch {
        role = '';
      }
      if (CONTROL_ROLES.has(role)) {
        control = cur;
        break;
      }
      cur = helpers.flatParentElement ? helpers.flatParentElement(cur) : dom.parentElement(cur);
    }
    if (!control) return '';
    let other = false;
    let visits = 0;
    (function walk(n) {
      if (other || visits++ > 2000) return;
      const kids = helpers.flatChildNodes
        ? helpers.flatChildNodes(n)
        : Array.from(dom.childNodes(n) || []);
      for (const k of kids) {
        if (other) return;
        const type = dom.nodeType(k);
        if (type === 3) {
          if (String(dom.nodeValue(k) || '').trim()) other = true;
        } else if (type === 1 && k !== el) {
          if (
            dom.getAttribute(k, 'aria-hidden') === 'true' ||
            dom.getAttribute(k, 'hidden') != null
          )
            continue;
          if (OTHER_CONTENT_TAGS.has(String(dom.tagName(k)).toLowerCase())) other = true;
          else walk(k);
        }
      }
    })(control);
    return other ? '' : role;
  }

  const occurrences = [];
  let applicableCount = 0;

  const trim = (v) => (v == null ? '' : String(v)).trim();

  for (const el of els) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    // acc eligibility
    if (isAccTreeEligible) {
      const elig = (() => {
        try {
          return isAccTreeEligible(el, ctx);
        } catch {
          return { eligible: true, reasons: [] };
        }
      })();
      if (elig && elig.eligible === false) continue;
    }

    if (isRolePresentationExcluded(el)) continue;

    // Detect mechanisms once
    let titleText = '';
    let descText = '';
    let ariaLabel = '';
    let ariaLabelledBy = '';
    let labelledByText = '';

    try {
      const titleEl = dom.get(el, 'querySelector') ? dom.querySelector(el, 'title') : null;
      const descEl = dom.get(el, 'querySelector') ? dom.querySelector(el, 'desc') : null;
      titleText = trim(titleEl && dom.textContent(titleEl));
      descText = trim(descEl && dom.textContent(descEl));

      ariaLabel = trim(dom.getAttribute(el, 'aria-label'));
      ariaLabelledBy = trim(dom.getAttribute(el, 'aria-labelledby'));
    } catch {}

    if (
      !ariaLabel &&
      ariaLabelledBy &&
      helpers &&
      typeof helpers.getTextFromIdRefs === 'function'
    ) {
      try {
        const t = helpers.getTextFromIdRefs(ariaLabelledBy, ctx, undefined, el);
        labelledByText = trim(t && t.text);
      } catch {}
    }

    const hasNonEmptyTitle = !!titleText;
    const hasNonEmptyDesc = !!descText;
    const hasAriaLabel = !!ariaLabel;
    const hasResolvedLabelledBy = !!labelledByText;

    const hasMechanism =
      hasNonEmptyTitle || hasNonEmptyDesc || hasAriaLabel || hasResolvedLabelledBy;
    if (!hasMechanism) continue;

    applicableCount += 1;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;
    const controlContent = onlyContentOf(el);

    const baseOccurrence = {
      summary: 'Check that the text alternative of this <svg> is accurate.',
      hint: 'The <title>, <desc> or ARIA name should say what the graphic means or does here.',
      i18n: {
        summaryKey: 'svg_textAltQuality_summary_cantTell',
        hintKey: 'svg_textAltQuality_hint_cantTell',
        params: { element: 'svg' }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        details: {
          reasonCode: 'TEXT_ALTERNATIVE_REVIEW',
          hasNonEmptyTitle,
          hasNonEmptyDesc,
          ariaLabel: ariaLabel || null,
          ariaLabelledBy: ariaLabelledBy || null,
          ariaLabelledByText: labelledByText ? labelledByText.slice(0, 120) : null, // deterministic truncation
          ...(controlContent ? { reasonCode: 'IMAGE_ONLY_CONTROL_CONTENT', controlContent } : {})
        }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      const selectorStr = (() => {
        try {
          return buildSelector(el);
        } catch {
          return 'html';
        }
      })();
      const html = getOuterHtmlSnippet(el);
      occurrences.push({ selector: selectorStr, html, ...baseOccurrence });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
