'use strict';

/**
 * @rule nontext-equivalent-alternative-manual
 * @atomic true
 * @summary Text alternatives must be equivalent to the non-text content
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @ref WCAG 2.2 SC 1.1.1; EN 301 549 v3.2.1 9.1.1 (Web) / 11.1.1 (Software where applicable)
 * @applicability Applies when a text alternative mechanism is present for common non-text content types (e.g., <img alt>, labeled SVG, canvas with fallback/name, image map areas, image inputs).
 * @expectation A human verifies that the provided alternative serves an equivalent purpose and that decorative content is correctly marked as decorative.
 * @implementation-notes This rule is intentionally manual (cantTell) because WCAG requires assessing intent and equivalence, which cannot be determined reliably from DOM alone.
 */

const id = "nontext-equivalent-alternative-manual";

const meta = {
  title: "Non-text alternatives must be equivalent (manual)",
  description: "Flags non-text content that has some text alternative mechanism so a human can verify equivalence per WCAG 1.1.1.",
  helpUrl: null,
  tags: ["wcag2a", "wcag111", "manual"],
  wcagSc: ['1.1.1'],
  defaultSeverity: "minor",
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '1.1.1': ['equivalent-purpose']
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


  // Candidates where a text alternative mechanism exists, but equivalence must be verified by a human.
  const occurrences = [];

  const addOccurrence = (el, summary, hint) => {
    let selector = 'html';
    try { selector = buildSimpleSelector(el); } catch {}
    const html = getOuterHtmlSnippet(el);
    occurrences.push({ selector, html, summary, hint });
  };

  // <img> with alt attribute (including empty) — equivalence & decorative intent require judgment.
  for (const img of query('img').filter((el) => el && el.tagName && !isHiddenFromAT(el))) {
    if (img.hasAttribute && img.hasAttribute('alt')) {
      addOccurrence(
        img,
        'Verify the image text alternative is equivalent for its purpose.',
        'Confirm that alt text (or alt="") is appropriate: informative images need meaningful alt; decorative images should use alt=""; functional images should describe the function.'
      );
    }
  }

  // <svg> exposed as image with a name mechanism present.
  for (const svg of query('svg').filter((el) => {
    if (!el || !el.getAttribute || !el.tagName) return false;
    if (isHiddenFromAT(el)) return false;
    const role = (el.getAttribute('role') || '').toLowerCase();
    const hasLabel = !!getAriaLabel(el) || !!(el.getAttribute('aria-labelledby') || '').trim();
    if (!(role === 'img' || hasLabel)) return false;
    const titleEl = el.querySelector ? el.querySelector('title') : null;
    const titleText = titleEl && titleEl.textContent ? titleEl.textContent.trim() : '';
    const name = getAriaLabel(el) || getLabelledByText(el) || titleText || getTitleAttr(el);
    return !!name;
  })) {
    addOccurrence(
      svg,
      'Verify the SVG text alternative is equivalent for its purpose.',
      'Confirm the accessible name (<title>/aria-label/aria-labelledby) provides an equivalent alternative.'
    );
  }

  // <canvas> with fallback text or accessible name.
  for (const canvas of query('canvas').filter((el) => el && el.tagName && !isHiddenFromAT(el))) {
    const fallbackText = (canvas.textContent || '').trim();
    const name = getAriaLabel(canvas) || getLabelledByText(canvas) || getTitleAttr(canvas);
    if (fallbackText || name) {
      addOccurrence(
        canvas,
        'Verify the canvas text alternative is equivalent for its purpose.',
        'Confirm fallback text or accessible name conveys equivalent information. Complex graphics may need a longer description elsewhere.'
      );
    }
  }

  // <area href> with alt.
  for (const area of query('area[href]').filter((el) => el && el.tagName && !isHiddenFromAT(el))) {
    const alt = (area.getAttribute && area.getAttribute('alt') || '').trim();
    if (alt) {
      addOccurrence(
        area,
        'Verify the image map area alt text is equivalent for its purpose.',
        'Confirm the alt text describes the purpose/destination of the hotspot.'
      );
    }
  }

  // <input type="image"> with naming mechanism.
  for (const input of query('input').filter((el) => {
    if (!el || !el.getAttribute || !el.tagName) return false;
    if (isHiddenFromAT(el)) return false;
    const t = (el.getAttribute('type') || '').toLowerCase();
    return t === 'image';
  })) {
    const alt = (input.getAttribute('alt') || '').trim();
    const name = getAriaLabel(input) || getLabelledByText(input) || alt || getTitleAttr(input);
    if (name) {
      addOccurrence(
        input,
        'Verify the image input accessible name is equivalent for its purpose.',
        'Confirm the name describes the function of the image button.'
      );
    }
  }

  if (!occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: rule.defaultSeverity || 'minor',
      occurrences: []
    };
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };

}

module.exports = {
  id,
  meta,
  runInPage
};
