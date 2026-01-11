'use strict';

/**
 * @rule canvas-text-alternative
 * @atomic true
 * @summary Canvas elements must provide a text alternative
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @ref WCAG 2.2 SC 1.1.1; EN 301 549 v3.2.1 9.1.1 (Web) / 11.1.1 (Software where applicable)
 * @applicability Applies to <canvas> elements that are not aria-hidden="true".
 * @expectation Each applicable <canvas> has either non-empty fallback text content or a non-empty accessible name (aria-label/aria-labelledby/title).
 * @implementation-notes This is a presence check. If the canvas is used for complex graphics (charts/diagrams), equivalent information may require additional text and manual review.
 */

const id = "canvas-text-alternative";

const meta = {
  title: "Canvas must have a text alternative",
  description: "Ensures <canvas> elements provide fallback content or an accessible name as a text alternative mechanism.",
  helpUrl: null,
  tags: ["wcag2a", "wcag111", "canvas"],
  wcagSc: ['1.1.1'],
  defaultSeverity: "serious",
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '1.1.1': ['text-alternative-mechanism']
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


  const canvases = query('canvas').filter((el) => el && el.tagName && !isHiddenFromAT(el));

  if (!canvases.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: rule.defaultSeverity || 'serious',
      occurrences: []
    };
  }

  const occurrencesFail = [];

  for (const canvas of canvases) {
    const fallbackText = (canvas.textContent || '').trim();

    const name =
        getAriaLabel(canvas) ||
        getLabelledByText(canvas) ||
        getTitleAttr(canvas);

    if (!fallbackText && !name) {
      let selector = 'html';
      try { selector = buildSimpleSelector(canvas); } catch {}
      const html = getOuterHtmlSnippet(canvas);

      occurrencesFail.push({
        selector,
        html,
        summary: 'Canvas element has no text alternative.',
        hint: 'Provide fallback text content inside <canvas>…</canvas> or an accessible name via aria-label/aria-labelledby (or title as a fallback).'
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
