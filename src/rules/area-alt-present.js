'use strict';

/**
 * @rule area-alt-present
 * @atomic true
 * @summary Image map areas must have non-empty alt text
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @ref WCAG 2.2 SC 1.1.1; EN 301 549 v3.2.1 9.1.1 (Web) / 11.1.1 (Software where applicable)
 * @applicability Applies to <area> elements with an href attribute (interactive image map regions) that are not aria-hidden="true".
 * @expectation Each applicable <area> element provides a non-empty alt attribute.
 * @implementation-notes This checks only for presence of a non-empty alt. Whether the text is equivalent may require manual review.
 */

const id = "area-alt-present";

const meta = {
  title: "Image map areas must have alt text",
  description: "Ensures <area href> elements in image maps provide a non-empty alt text alternative.",
  helpUrl: null,
  tags: ["wcag2a", "wcag111", "images", "links", "imagemap"],
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


  const areas = query('area[href]').filter((el) => el && el.tagName && !isHiddenFromAT(el));

  if (!areas.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: rule.defaultSeverity || 'serious',
      occurrences: []
    };
  }

  const occurrencesFail = [];

  for (const area of areas) {
    const alt = area.getAttribute ? area.getAttribute('alt') : null;
    const altTrim = (alt || '').trim();

    if (alt === null || altTrim === '') {
      let selector = 'html';
      try { selector = buildSimpleSelector(area); } catch {}
      const html = getOuterHtmlSnippet(area);

      occurrencesFail.push({
        selector,
        html,
        summary: 'Image map area is missing a non-empty alt text alternative.',
        hint: 'Provide an alt attribute that describes the purpose/destination of the hotspot.'
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
