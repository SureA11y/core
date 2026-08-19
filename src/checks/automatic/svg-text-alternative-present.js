/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check svg-text-alternative-present
 * @atomic true
 * @summary Accessible <svg> elements must provide a text alternative
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to inline <svg> elements that are exposed to assistive technologies AND appear intended to be conveyed.
 *   "Intended to be conveyed" is approximated deterministically by at least one of:
 *     - role="img", role="graphics-symbol", or role="graphics-document"
 *       on the SVG root element itself (the WAI-ARIA Graphics Module
 *       roles, alongside img). Deliberately does NOT extend to arbitrary
 *       role="graphics-symbol" descendants nested inside an <svg> — this
 *       check's scope is the <svg> root only; a broader feature, not
 *       attempted here.
 *     - aria-label / aria-labelledby present
 *     - <title> or <desc> present (desc alone is an applicability signal only — see @expectation)
 *     - focusable/tabbable (e.g., tabindex, native focusability)
 *
 *   Images with role="presentation" or role="none" are excluded only when they are not focusable.
 *   Elements otherwise hidden from the accessibility tree remain applicable
 *   if they are tabbable-focusable or referenced by IDREF relationships (per engine eligibility checks).
 * @expectation
 *   Each applicable <svg> element provides a text alternative via:
 *     - non-empty <title> text, OR
 *     - an ARIA name (aria-label / aria-labelledby).
 *   A <desc> element alone does NOT satisfy this — per the SVG Accessibility
 *   API Mappings spec §7.1, <desc> only ever contributes to the accessible
 *   DESCRIPTION, never the accessible NAME. An <svg> with only a
 *   <desc> and no <title>/ARIA name is still "applicable" (desc signals
 *   authorial intent) but fails.
 */

const id = 'svg-text-alternative-present';

const meta = {
  title: '<svg> must provide a text alternative',
  description:
    'Checks that inline <svg> elements provide a text alternative via a <title> element or an ARIA name (a <desc> element alone does not count).',
  i18n: {
    titleKey: 'svg_textAltPresent_title',
    descriptionKey: 'svg_textAltPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'svg', 'nontext', 'images', 'atomic', 'automatic'],
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
      '1.1.1': ['svg-text-alternative-present']
    }
  }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart =
    helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll =
    helpers && typeof helpers.queryAll === 'function'
      ? helpers.queryAll
      : (sel) => {
          try {
            return safeRoot && safeRoot.querySelectorAll
              ? Array.from(safeRoot.querySelectorAll(sel))
              : [];
          } catch {
            return [];
          }
        };

  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  const getAriaNameInfo =
    helpers && typeof helpers.getAriaNameInfo === 'function' ? helpers.getAriaNameInfo : null;

  function trim(v) {
    try {
      return (v == null ? '' : String(v)).trim();
    } catch {
      return '';
    }
  }

  // Per SVG accessible-name conventions, only a <title> that is literally
  // the first child element is used by assistive technologies as the
  // SVG's accessible name; a <title> appearing later among the children
  // is commonly ignored by AT even though it's still a valid DOM child.
  function nonEmptyFirstChildTitleText(svg) {
    try {
      const first = svg.firstElementChild;
      const tn = first ? (first.localName || first.tagName || '').toLowerCase() : '';
      if (tn === 'title') {
        const txt = trim(first.textContent);
        if (txt) return txt;
      }
    } catch {}
    return '';
  }

  // <desc> counts when it is the first child, or the second child
  // immediately following a <title> — the standard <title>+<desc> pairing
  // (e.g. <svg><title>...</title><desc>...</desc>...</svg>). A <desc>
  // appearing later than that is not reliably read by AT.
  function nonEmptyDescText(svg) {
    try {
      const first = svg.firstElementChild;
      const firstTag = first ? (first.localName || first.tagName || '').toLowerCase() : '';
      if (firstTag === 'desc') {
        const txt = trim(first.textContent);
        if (txt) return txt;
      } else if (firstTag === 'title' && first.nextElementSibling) {
        const second = first.nextElementSibling;
        const secondTag = (second.localName || second.tagName || '').toLowerCase();
        if (secondTag === 'desc') {
          const txt = trim(second.textContent);
          if (txt) return txt;
        }
      }
    } catch {}
    return '';
  }

  function isFocusable(svg) {
    if (getFocusableInfo) {
      const fi = (() => {
        try {
          return getFocusableInfo(svg, ctx);
        } catch {
          return null;
        }
      })();
      return !!(fi && fi.focusable);
    }
    // deterministic fallback: tabindex presence/valid number
    try {
      const tabindex = svg && svg.getAttribute ? svg.getAttribute('tabindex') : null;
      return (
        tabindex != null &&
        String(tabindex).trim() !== '' &&
        !Number.isNaN(Number(String(tabindex).trim()))
      );
    } catch {
      return false;
    }
  }

  const svgs = (() => {
    try {
      return Array.from((queryAllSmart ? queryAllSmart('svg') : queryAll('svg')) || []);
    } catch {
      return queryAll('svg');
    }
  })();

  if (!svgs.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of svgs) {
    if (!el || !el.getAttribute) continue;

    // Applicability step 1: only acc-tree eligible nodes (with helper exceptions)
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

    // Applicability step 2: role (presentation/none) exclusion only when not focusable
    const role = (() => {
      try {
        return String(el.getAttribute('role') || '')
          .trim()
          .toLowerCase();
      } catch {
        return '';
      }
    })();

    const focusable = isFocusable(el);

    if (role === 'presentation' || role === 'none') {
      if (!focusable) continue;
    }

    // Applicability step 3: intent signal gating (computed once per element)
    let hasAriaNamingAttr = false;
    try {
      hasAriaNamingAttr =
        el.getAttribute('aria-label') != null || el.getAttribute('aria-labelledby') != null;
    } catch {}

    const titleText = nonEmptyFirstChildTitleText(el);
    const descText = titleText ? '' : nonEmptyDescText(el); // avoid second scan if title already passes
    const hasTitleOrDesc = !!(titleText || descText);

    const hasIntent =
      role === 'img' ||
      role === 'graphics-symbol' ||
      role === 'graphics-document' ||
      hasAriaNamingAttr ||
      hasTitleOrDesc ||
      focusable;

    if (!hasIntent) continue;

    applicableCount += 1;

    // Expectation: non-empty title/desc OR ARIA name (but only resolve name if attrs exist)
    let hasAriaName = false;
    if (hasAriaNamingAttr) {
      if (getAriaNameInfo) {
        const info = (() => {
          try {
            return getAriaNameInfo(el, ctx);
          } catch {
            return null;
          }
        })();
        hasAriaName = !!(info && info.present && trim(info.value));
      } else {
        // minimal deterministic fallback
        const ariaLabel = trim(
          (() => {
            try {
              return el.getAttribute('aria-label');
            } catch {
              return '';
            }
          })()
        );
        const ariaLabelledby = trim(
          (() => {
            try {
              return el.getAttribute('aria-labelledby');
            } catch {
              return '';
            }
          })()
        );
        hasAriaName = !!(ariaLabel || ariaLabelledby);
      }
    }

    // Per SVG-AAM §7.1: <desc> contributes only to the accessible
    // DESCRIPTION, never the accessible NAME — so descText does not
    // count here even though it does count toward applicability above.
    const ok = !!titleText || hasAriaName;
    if (ok) continue;

    let eligInfo = null;
    if (getEligibilityInfo) {
      try {
        eligInfo = getEligibilityInfo(el, ctx, { targetSet: 'acc' });
      } catch {
        eligInfo = null;
      }
    }

    const baseOccurrence = {
      summary: 'Missing text alternative for <svg>.',
      hint: 'Provide a <title> element with text, or an ARIA name (aria-label/aria-labelledby) — a <desc> element alone does not provide an accessible name.',
      i18n: {
        summaryKey: 'svg_textAltPresent_summary_fail',
        hintKey: 'svg_textAltPresent_hint_fail',
        params: { element: 'svg' }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
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
