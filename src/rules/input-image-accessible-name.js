'use strict';

/**
 * @rule input-image-accessible-name
 * @atomic true
 * @summary Image inputs must have a non-empty accessible name
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @ref WCAG 2.2 SC 1.1.1; EN 301 549 v3.2.1 9.1.1 (Web) / 11.1.1 (Software where applicable)
 * @applicability Applies to <input type="image"> elements that are not aria-hidden="true".
 * @expectation Each applicable <input type="image"> provides a non-empty accessible name (e.g., alt, aria-label, aria-labelledby, or title as fallback).
 * @implementation-notes This checks presence only, not whether the name is equivalent/appropriate in context.
 */

const id = "input-image-accessible-name";

const meta = {
  title: "Image inputs must have an accessible name",
  description: "Ensures <input type='image'> elements have a non-empty accessible name.",
  helpUrl: null,
  tags: ["wcag2a", "wcag111", "forms", "images"],
  wcagSc: ['1.1.1'],
  defaultSeverity: "serious",
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '1.1.1': ['functional-nontext-name']
    }
  }
};

function runInPage(ctx) {
  // SAFETY: This function runs in the page context via serialization. Do not capture outer scope.
  const { document, root, helpers, rule } = ctx;

  const safeRoot = root || document;

  const queryAll =
      helpers && helpers.queryAll
          ? helpers.queryAll
          : (sel) => {
            if (!safeRoot || !safeRoot.querySelectorAll) return [];
            try {
              return Array.from(safeRoot.querySelectorAll(sel));
            } catch {
              return [];
            }
          };

  const queryAllSmart =
      helpers && helpers.queryAllSmart
          ? helpers.queryAllSmart
          : null;

  const query =
      queryAllSmart
          ? (sel) => {
            try {
              return Array.from(queryAllSmart(sel) || []);
            } catch {
              return queryAll(sel);
            }
          }
          : queryAll;

  const getOuterHtmlSnippet =
      helpers && helpers.getOuterHtmlSnippet
          ? helpers.getOuterHtmlSnippet
          : (el) => {
            if (!el || typeof el !== 'object') return '';
            return el.outerHTML || '';
          };

  const buildSimpleSelector =
      helpers && helpers.buildSimpleSelector
          ? helpers.buildSimpleSelector
          : (el) => {
            if (!el || typeof el !== 'object') return 'html';
            const tag = (el.tagName || 'html').toLowerCase();
            const id = el.id ? `#${el.id}` : '';
            const cls = el.classList && el.classList.length
                ? '.' + Array.from(el.classList).slice(0, 2).join('.')
                : '';
            return `${tag}${id}${cls}` || 'html';
          };

  const getAriaLabel = (el) => {
    if (!el || !el.getAttribute) return '';
    const v = el.getAttribute('aria-label');
    return (v || '').trim();
  };

  const getTitleAttr = (el) => {
    if (!el || !el.getAttribute) return '';
    const v = el.getAttribute('title');
    return (v || '').trim();
  };

  const getLabelledByText = (el) => {
    if (!el || !el.getAttribute) return '';
    const ids = (el.getAttribute('aria-labelledby') || '').trim();
    if (!ids) return '';
    const parts = ids.split(/\s+/).filter(Boolean);
    const texts = [];
    for (const idref of parts) {
      const ref = safeRoot.getElementById ? safeRoot.getElementById(idref) : document.getElementById(idref);
      if (ref && ref.textContent) {
        const t = ref.textContent.trim();
        if (t) texts.push(t);
      }
    }
    return texts.join(' ').trim();
  };

  const isHiddenFromAT = (el) => {
    if (!el || !el.getAttribute) return false;
    const ariaHidden = (el.getAttribute('aria-hidden') || '').toLowerCase();
    return ariaHidden === 'true';
  };


  const inputs = query('input').filter((el) => {
    if (!el || !el.getAttribute || !el.tagName) return false;
    if (isHiddenFromAT(el)) return false;
    const t = (el.getAttribute('type') || '').toLowerCase();
    return t === 'image';
  });

  if (!inputs.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: rule.defaultSeverity || 'serious',
      occurrences: []
    };
  }

  const occurrencesFail = [];

  for (const input of inputs) {
    const alt = (input.getAttribute('alt') || '').trim();
    const name =
        getAriaLabel(input) ||
        getLabelledByText(input) ||
        alt ||
        getTitleAttr(input);

    if (!name) {
      let selector = 'html';
      try { selector = buildSimpleSelector(input); } catch {}
      const html = getOuterHtmlSnippet(input);

      occurrencesFail.push({
        selector,
        html,
        summary: 'Image input has no accessible name.',
        hint: 'Provide a non-empty alt attribute, aria-label/aria-labelledby, or another accessible naming mechanism for the image button.'
      });
    }
  }

  if (occurrencesFail.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'serious',
      occurrences: occurrencesFail
    };
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'pass',
    severity: 'minor',
    occurrences: []
  };

}

module.exports = {
  id,
  meta,
  runInPage
};
