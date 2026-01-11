'use strict';

/**
 * @rule img-alt-functional-name
 * @atomic true
 * @summary Image-only links and buttons must have an accessible name
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @ref WCAG 2.2 SC 1.1.1; EN 301 549 v3.2.1 9.1.1 (Web) / 11.1.1 (Software where applicable)
 * @applicability Applies to <a> and <button> elements that contain exactly one <img> and no non-whitespace text, and are not aria-hidden="true".
 * @expectation Each applicable control has a non-empty accessible name (from aria-label/aria-labelledby/title, or from the contained image alt).
 * @implementation-notes This targets functional non-text content (controls). It does not attempt to judge whether the name is meaningful in context.
 */

const id = "img-alt-functional-name";

const meta = {
  title: "Image-only controls must have an accessible name",
  description: "Ensures links and buttons that are represented only by an image provide a non-empty accessible name.",
  helpUrl: null,
  tags: ["wcag2a", "wcag111", "images", "links", "forms"],
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


  const controls = query('a,button').filter((el) => {
    if (!el || !el.tagName || isHiddenFromAT(el)) return false;
    // Ignore disabled buttons
    if (el.tagName.toLowerCase() === 'button' && el.disabled) return false;

    const imgs = el.querySelectorAll ? Array.from(el.querySelectorAll('img')) : [];
    if (imgs.length !== 1) return false;

    // Treat as "image-only" if there is no non-whitespace text content.
    const text = (el.textContent || '').trim();
    if (text) return false;

    return true;
  });

  if (!controls.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: rule.defaultSeverity || 'serious',
      occurrences: []
    };
  }

  const occurrencesFail = [];

  for (const el of controls) {
    const img = el.querySelector ? el.querySelector('img') : null;
    const imgAlt = img && img.getAttribute ? (img.getAttribute('alt') || '').trim() : '';

    const name =
        getAriaLabel(el) ||
        getLabelledByText(el) ||
        imgAlt ||
        getTitleAttr(el);

    if (!name) {
      let selector = 'html';
      try { selector = buildSimpleSelector(el); } catch {}
      const html = getOuterHtmlSnippet(el);

      occurrencesFail.push({
        selector,
        html,
        summary: 'Image-only control has no accessible name.',
        hint: 'Provide a non-empty accessible name via the image alt text or aria-label/aria-labelledby on the control.'
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
