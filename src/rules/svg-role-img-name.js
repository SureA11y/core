'use strict';

/**
 * @rule svg-role-img-name
 * @atomic true
 * @summary SVG images must have an accessible name
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @ref WCAG 2.2 SC 1.1.1; EN 301 549 v3.2.1 9.1.1 (Web) / 11.1.1 (Software where applicable)
 * @applicability Applies to inline <svg> elements that are exposed as images (role="img" or explicitly labeled via aria-label/aria-labelledby) and are not aria-hidden="true".
 * @expectation Each applicable <svg> has a non-empty accessible name (e.g., <title>, aria-label, aria-labelledby, or title attribute as fallback).
 * @implementation-notes Presence check only; equivalence/appropriateness of the name may require manual review.
 */

const id = "svg-role-img-name";

const meta = {
  title: "SVG images must have an accessible name",
  description: "Ensures inline SVG graphics exposed as images provide a non-empty accessible name.",
  helpUrl: null,
  tags: ["wcag2a", "wcag111", "svg", "images"],
  wcagSc: ['1.1.1'],
  defaultSeverity: "serious",
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '1.1.1': ['technology-specific-nontext']
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


  const svgs = query('svg').filter((el) => {
    if (!el || !el.getAttribute || !el.tagName) return false;
    if (isHiddenFromAT(el)) return false;
    const role = (el.getAttribute('role') || '').toLowerCase();
    const hasLabel = !!getAriaLabel(el) || !!(el.getAttribute('aria-labelledby') || '').trim();
    return role === 'img' || hasLabel;
  });

  if (!svgs.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: rule.defaultSeverity || 'serious',
      occurrences: []
    };
  }

  const getTitleText = (svg) => {
    if (!svg || !svg.querySelector) return '';
    const t = svg.querySelector('title');
    return t && t.textContent ? t.textContent.trim() : '';
  };

  const occurrencesFail = [];

  for (const svg of svgs) {
    const name =
        getAriaLabel(svg) ||
        getLabelledByText(svg) ||
        getTitleText(svg) ||
        getTitleAttr(svg);

    if (!name) {
      let selector = 'html';
      try { selector = buildSimpleSelector(svg); } catch {}
      const html = getOuterHtmlSnippet(svg);

      occurrencesFail.push({
        selector,
        html,
        summary: 'SVG with role="img" has no accessible name.',
        hint: 'Provide an accessible name using <title>, aria-label, or aria-labelledby.'
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
