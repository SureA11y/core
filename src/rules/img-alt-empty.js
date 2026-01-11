'use strict';

/**
 * @rule img-alt-empty
 * @atomic true
 * @summary Empty alt text must only be used for decorative images (manual verification needed).
 *
 * @standard WCAG 2.2
 * @sc 1.1.1 Non-text Content
 *
 * @standard EN 301 549 (Web)
 * @ref 9.1.1.1 Non-text Content (WCAG alignment)
 *
 * @standard RGAA (Images)
 * @ref Critère 1.1 (Images porteuses d’information : alternative textuelle)
 *
 * @applicability
 * - Applies to: <img> elements that are exposed to assistive technologies AND have an alt attribute.
 * - Excludes (NOT_APPLICABLE):
 *   - <img aria-hidden="true">
 *   - <img role="presentation|none">
 *
 * @expectation
 * - CANT_TELL when an applicable <img> has alt="" or alt with only whitespace.
 *   (A human must confirm the image is purely decorative.)
 * - PASS otherwise.
 *
 * @implementation-notes
 * - This rule intentionally flags only the *fact* that alt is empty.
 * - It does not infer “decorative” automatically.
 */

const id = 'img-alt-empty';

const meta = {
  title: 'Empty alt text requires verification',
  description: 'Flags <img> elements with empty alt text for manual verification (decorative vs informative).',
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'images', 'atomic', 'manual'],
  wcagSc: ['1.1.1'],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '1.1.1': ['decorative-null']
    }
  }
};

/**
 * NOTE (engine constraint):
 * runInPage() is serialized and executed from source (fnSource) by a11yCore-core,
 * so it must NOT reference outer-scope variables like `meta` or `id`.
 * Only use `ctx.*`, locals, and DOM APIs.
 */
function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;

  const queryAll = helpers && helpers.queryAll
    ? helpers.queryAll
    : (sel) => {
      try {
        return Array.from((root || document).querySelectorAll(sel));
      } catch {
        return [];
      }
    };

  const getOuterHtmlSnippet = helpers && helpers.getOuterHtmlSnippet
    ? helpers.getOuterHtmlSnippet
    : (el) => (el && el.outerHTML) || '';

  const buildSimpleSelector = helpers && helpers.buildSimpleSelector
    ? helpers.buildSimpleSelector
    : (el, fallbackTag) => {
      try {
        if (!el || el.nodeType !== 1) return fallbackTag || '';
        if (el.id) return `#${el.id}`;
        const tag = (el.tagName || fallbackTag || '').toLowerCase();
        return tag || fallbackTag || '';
      } catch {
        return fallbackTag || '';
      }
    };

  const occurrences = [];
  const imgs = helpers.queryAllSmart ? helpers.queryAllSmart('img') : queryAll('img');

  for (const img of imgs) {
    if (!img || img.nodeType !== 1) continue;

    const ariaHidden = img.getAttribute('aria-hidden');
    if (ariaHidden === 'true') continue;

    const role = (img.getAttribute('role') || '').trim().toLowerCase();
    if (role === 'presentation' || role === 'none') continue;

    const alt = img.getAttribute('alt');
    if (alt === null) continue; // handled by img-alt-attr-present

    if (String(alt).trim() === '') {
      occurrences.push({
        selector: buildSimpleSelector(img, 'img'),
        html: getOuterHtmlSnippet(img),
        summary: 'Image has empty alt text (alt="").',
        hint: 'Confirm the image is decorative; otherwise provide a meaningful alt text.'
      });
    }
  }

  if (!imgs.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: 'minor',
      occurrences: []
    };
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'pass',
    severity: 'minor',
    occurrences: []
  };
}

module.exports = { id, meta, runInPage };
