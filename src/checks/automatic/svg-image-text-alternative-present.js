'use strict';

/**
 * @check a11ycore-svg-image-text-alternative-present
 * @atomic true
 * @summary Accessible SVG <image> elements must provide a text alternative
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to SVG <image> elements that are exposed to assistive technologies.
 *   Elements otherwise hidden from the accessibility tree remain applicable
 *   if they are tabbable or referenced by IDREF relationships (per engine eligibility checks).
 *   SVG <image> elements with role="presentation" or role="none" are excluded only when they are not focusable.
 * @expectation
 *   Each applicable SVG <image> element has a text alternative via:
 *   - a non-empty direct <title> child, OR
 *   - a non-empty direct <desc> child, OR
 *   - an accessible name (aria-label / aria-labelledby / title attribute).
 */

const id = 'a11ycore-svg-image-text-alternative-present';

const meta = {
  title: 'SVG <image> must have a text alternative',
  description: 'Checks that SVG <image> elements provide a text alternative via <title>/<desc> or an ARIA accessible name.',
  i18n: {
    titleKey: 'a11ycore_svgImage_textAltPresent_title',
    descriptionKey: 'a11ycore_svgImage_textAltPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'svg', 'image', 'atomic', 'automatic'],
  wcagSc: ['1.1.1'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '1.1.1', title: 'Non-text Content', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '1.1.1': ['svg-image-text-alt-present']
    }
  }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll = helpers && typeof helpers.queryAll === 'function'
    ? helpers.queryAll
    : (sel) => {
        try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
        catch { return []; }
      };

  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
    ? helpers.getEligibilityInfo
    : null;

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
    ? helpers.isAccTreeEligible
    : null;

  const isFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
    ? helpers.getFocusableInfo
    : null;

  const getAccessibleNameInfo = helpers && typeof helpers.getAccessibleNameInfo === 'function'
    ? helpers.getAccessibleNameInfo
    : null;

  function trim(v) { return (v == null ? '' : String(v)).trim(); }

  function directChildText(el, localName) {
    try {
      if (!el) return '';
      for (let n = el.firstElementChild; n; n = n.nextElementSibling) {
        const tn = (n.localName || n.tagName || '').toLowerCase();
        if (tn === localName) {
          const t = trim(n.textContent);
          if (t) return t;
        }
      }
    } catch {}
    return '';
  }

  const rawImages = (() => {
    try { return Array.from((queryAllSmart ? queryAllSmart('image') : queryAll('image')) || []); }
    catch { return queryAll('svg image'); }
  })();

  const images = rawImages.filter((el) => {
    try { return el && (el.namespaceURI === 'http://www.w3.org/2000/svg') && (String(el.localName).toLowerCase() === 'image'); }
    catch { return false; }
  });

  if (!images.length) return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };

  const occurrences = [];
  let applicableCount = 0;

  for (const el of images) {
    if (!el || !el.getAttribute) continue;

    if (isAccTreeEligible) {
      const elig = (() => {
        try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
      })();
      if (elig && elig.eligible === false) continue;
    }

    const role = trim(el.getAttribute('role')).toLowerCase();
    if (role === 'presentation' || role === 'none') {
      let focusable = false;
      if (isFocusableInfo) {
        const fi = (() => { try { return isFocusableInfo(el, ctx); } catch { return null; } })();
        focusable = !!(fi && fi.focusable);
      } else {
        const tabindex = el.getAttribute('tabindex');
        focusable = tabindex != null && trim(tabindex) !== '' && !Number.isNaN(Number(trim(tabindex)));
      }
      if (!focusable) continue;
    }

    applicableCount += 1;

    const titleText = directChildText(el, 'title');
    if (titleText) continue;

    const descText = directChildText(el, 'desc');
    if (descText) continue;

    // Only now check “accessible name” (but scoped to allowed mechanisms)
    const ariaLabelRaw = (() => { try { return el.getAttribute('aria-label'); } catch { return null; } })();
    const ariaLabelledbyRaw = (() => { try { return el.getAttribute('aria-labelledby'); } catch { return null; } })();
    const titleAttrRaw = (() => { try { return el.getAttribute('title'); } catch { return null; } })();

    const ariaLabel = trim(ariaLabelRaw);
    const ariaLabelledby = trim(ariaLabelledbyRaw);
    const titleAttr = trim(titleAttrRaw);

    const hasMechanism =
        (ariaLabelRaw !== null && ariaLabel.length > 0) ||
        (ariaLabelledbyRaw !== null && ariaLabelledby.length > 0) ||
        (titleAttrRaw !== null && titleAttr.length > 0);

    let nameInfo = null;
    let hasName = false;

    if (hasMechanism) {
      if (getAccessibleNameInfo) {
        nameInfo = (() => { try { return getAccessibleNameInfo(el, ctx); } catch { return null; } })();
        hasName = !!(nameInfo && nameInfo.present && trim(nameInfo.value));
      } else {
        // Without helper, accept presence of non-empty allowed attributes
        hasName = true;
      }
    }

    if (hasName) continue;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      summary: 'Missing text alternative on SVG <image>.',
      hint: 'Add a <title> (and optionally <desc>) inside <image>, or provide aria-label/aria-labelledby.',
      i18n: {
        summaryKey: 'a11ycore_svgImage_textAltPresent_summary_fail',
        hintKey: 'a11ycore_svgImage_textAltPresent_hint_fail',
        params: { element: 'image' }
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

  if (applicableCount === 0) return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  if (!occurrences.length) return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
