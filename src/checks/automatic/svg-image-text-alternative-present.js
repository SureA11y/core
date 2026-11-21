/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check svg-image-text-alternative-present
 * @atomic true
 * @summary Accessible SVG <image> elements must provide a text alternative
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to SVG <image> elements that are exposed to assistive technologies.
 *   Elements otherwise hidden from the accessibility tree remain applicable
 *   if they are tabbable or referenced by IDREF relationships (per engine eligibility checks).
 *   SVG <image> elements whose role attribute resolves to presentation or none (the first known
 *   role token, in any case) are excluded only when they are not focusable.
 *   An <image> inside an element whose children are presentational (role
 *   img, button, checkbox, tab..., by its role attribute, its
 *   ElementInternals or, for <button>, <meter>, <option> and <progress>,
 *   natively) or inside an <svg> with no role that is already named (a
 *   <title> child, aria-label, aria-labelledby) is out of scope: it is
 *   part of that image or control, whose name speaks for it, and no image
 *   of its own in the accessibility tree (Chromium leaves it out).
 * @expectation
 *   Each applicable SVG <image> element has a text alternative via:
 *   - a non-empty direct <title> child, OR
 *   - an accessible name (aria-label / aria-labelledby / title attribute).
 *   The first <title> child counts, wherever it is among the children, as
 *   SVG-AAM reads it. A <desc> child does not: SVG-AAM maps it to the
 *   accessible description, never the name, as svg-text-alternative-present
 *   has it.
 * @reason-codes
 *   - `TEXT_ALTERNATIVE_MISSING` (fail): an SVG <image> has no <title>
 *     child with text and no name from aria-label, aria-labelledby or
 *     title; a <desc> describes it but doesn't name it.
 *     Basis: WCAG 1.1.1; SVG-AAM; accname 1.2.
 */

const id = 'svg-image-text-alternative-present';

const meta = {
  title: 'SVG <image> must have a text alternative',
  description:
    'Checks that SVG <image> elements provide a text alternative via a <title> element or an ARIA accessible name (a <desc> element alone does not count).',
  i18n: {
    titleKey: 'svgImage_textAltPresent_title',
    descriptionKey: 'svgImage_textAltPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'svg', 'image', 'atomic', 'automatic'],
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
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '1.1.1': ['svg-image-text-alt-present']
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
              ? [...dom.querySelectorAll(safeRoot, sel)]
              : [];
          } catch {
            return [];
          }
        };

  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  const isFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  const getAccessibleNameInfo =
    helpers && typeof helpers.getAccessibleNameInfo === 'function'
      ? helpers.getAccessibleNameInfo
      : null;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  // An SVG element's first direct child <title>, wherever it is among the
  // children (SVG-AAM: "a direct child title element"; helpers.getSvgChildText).
  function svgChildText(el, tag) {
    try {
      return helpers && typeof helpers.getSvgChildText === 'function'
        ? helpers.getSvgChildText(el, tag)
        : '';
    } catch {
      return '';
    }
  }

  function titleText(el) {
    return svgChildText(el, 'title');
  }

  // WAI-ARIA roles with "Children Presentational: True" (and the module
  // roles that inherit it), and the native elements that have one of them
  // and can hold an <svg>. Inside such an element, or inside an <svg> that
  // is already named, an <image> is part of a single image or control
  // whose own name speaks for it: it is no image of its own in the
  // accessibility tree (Chromium leaves it out).
  const PRESENTATIONAL_CHILDREN_ROLES = new Set([
    'button',
    'checkbox',
    'doc-pagebreak',
    'graphics-symbol',
    'image',
    'img',
    'math',
    'menuitemcheckbox',
    'menuitemradio',
    'meter',
    'option',
    'progressbar',
    'radio',
    'scrollbar',
    'separator',
    'slider',
    'switch',
    'tab'
  ]);
  const NATIVE_PRESENTATIONAL_CHILDREN = new Set(['button', 'meter', 'option', 'progress']);
  const composedParent =
    typeof helpers.composedParent === 'function'
      ? helpers.composedParent
      : (n) => (n && dom.parentElement(n) ? dom.parentElement(n) : null);

  // Whether a named <svg> or an element whose children are presentational
  // holds `el`, so its name or role covers the <image>.
  function insideWholeImageOrControl(el) {
    let guard = 0;
    for (let a = composedParent(el); a && guard++ < 500; a = composedParent(a)) {
      if (dom.nodeType(a) !== 1) continue;
      const author = (() => {
        try {
          return helpers.aria && typeof helpers.aria.getAuthorRole === 'function'
            ? helpers.aria.getAuthorRole(a)
            : '';
        } catch {
          return '';
        }
      })();
      if (author) {
        if (PRESENTATIONAL_CHILDREN_ROLES.has(author)) return true;
        if (author !== 'none' && author !== 'presentation') continue;
      }
      const local = String(dom.localName(a) || '').toLowerCase();
      const ns = dom.namespaceURI(a);
      if (ns === 'http://www.w3.org/1999/xhtml' && NATIVE_PRESENTATIONAL_CHILDREN.has(local))
        return true;
      if (ns === 'http://www.w3.org/2000/svg' && local === 'svg' && !author) {
        if (titleText(a)) return true;
        try {
          const n = getAccessibleNameInfo ? getAccessibleNameInfo(a, ctx) : null;
          if (n && n.present && trim(n.value)) return true;
        } catch {
          // no name read: not covered
        }
      }
    }
    return false;
  }

  const rawImages = (() => {
    try {
      return [...((queryAllSmart ? queryAllSmart('image') : queryAll('image')) || [])];
    } catch {
      return queryAll('svg image');
    }
  })();

  const images = rawImages.filter((el) => {
    try {
      return (
        el &&
        dom.namespaceURI(el) === 'http://www.w3.org/2000/svg' &&
        String(dom.localName(el)).toLowerCase() === 'image'
      );
    } catch {
      return false;
    }
  });

  if (!images.length)
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };

  const occurrences = [];
  let applicableCount = 0;

  for (const el of images) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

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

    // Resolved explicit role: the first known token of the role fallback
    // list, so role="foo none" is presentational too.
    const role = (() => {
      try {
        return helpers && helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
          ? helpers.aria.getExplicitRole(el)
          : '';
      } catch {
        return '';
      }
    })();
    if (role === 'presentation' || role === 'none') {
      let focusable;
      if (isFocusableInfo) {
        const fi = (() => {
          try {
            return isFocusableInfo(el, ctx);
          } catch {
            return null;
          }
        })();
        focusable = !!(fi && fi.focusable);
      } else {
        const tabindex = dom.getAttribute(el, 'tabindex');
        focusable =
          tabindex != null && trim(tabindex) !== '' && !Number.isNaN(Number(trim(tabindex)));
      }
      // A global ARIA attribute keeps its role too (presentational roles
      // conflict resolution), as being focusable does.
      const keptByGlobal =
        typeof helpers.isPresentationalRoleIgnored === 'function' &&
        helpers.isPresentationalRoleIgnored(el);
      if (!focusable && !keptByGlobal) continue;
    }

    if (insideWholeImageOrControl(el)) continue;

    applicableCount += 1;

    const titleChildText = titleText(el);
    if (titleChildText) continue;

    // Only now check “accessible name” (but scoped to allowed mechanisms)
    const ariaLabelRaw = (() => {
      try {
        return dom.getAttribute(el, 'aria-label');
      } catch {
        return null;
      }
    })();
    const ariaLabelledbyRaw = (() => {
      try {
        return dom.getAttribute(el, 'aria-labelledby');
      } catch {
        return null;
      }
    })();
    const titleAttrRaw = (() => {
      try {
        return dom.getAttribute(el, 'title');
      } catch {
        return null;
      }
    })();

    const ariaLabel = trim(ariaLabelRaw);
    const ariaLabelledby = trim(ariaLabelledbyRaw);
    // References a script set as elements (el.ariaLabelledByElements) leave
    // the attribute empty; they name the element as an id list would.
    const hasReflectedLabelledby =
      !ariaLabelledby &&
      !!helpers &&
      typeof helpers.getReflectedRefs === 'function' &&
      helpers.getReflectedRefs(el, 'aria-labelledby').length > 0;
    const titleAttr = trim(titleAttrRaw);

    const hasMechanism =
      (ariaLabelRaw !== null && ariaLabel.length > 0) ||
      (ariaLabelledbyRaw !== null && ariaLabelledby.length > 0) ||
      hasReflectedLabelledby ||
      (titleAttrRaw !== null && titleAttr.length > 0);

    let nameInfo;
    let hasName = false;

    if (hasMechanism) {
      if (getAccessibleNameInfo) {
        nameInfo = (() => {
          try {
            return getAccessibleNameInfo(el, ctx);
          } catch {
            return null;
          }
        })();
        hasName = !!(nameInfo && nameInfo.present && trim(nameInfo.value));
      } else {
        // Without helper, accept presence of non-empty allowed attributes
        hasName = true;
      }
    }

    if (hasName) continue;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    // Why it has none, where the page shows a cause the reader would not
    // see from the element alone (helpers.nameCause), or a <title> beside
    // it, which names the <svg> or <g> they sit in, not the <image>.
    const imageCause = (() => {
      const parent = dom.parentElement(el);
      if (!parent) return null;
      for (let c = dom.firstElementChild(parent); c; c = dom.nextElementSibling(c)) {
        if (String(dom.localName(c) || '').toLowerCase() !== 'title') continue;
        const all = trim(String(dom.textContent(c) || '').replace(/\s+/g, ' '));
        if (!all) return null;
        const text = all.length > 40 ? `${all.slice(0, 39)}…` : all;
        const parentTag = String(dom.localName(parent) || '').toLowerCase();
        return {
          hint: `The <title> "${text}" beside it is a child of the <${parentTag}>, so it names the <${parentTag}>, not this <image>. Put a <title> inside the <image>, or name it with aria-label.`,
          hintKey: 'svgImage_textAltPresent_hint_fail_parentTitle',
          params: { text, parentTag },
          detail: { cause: 'parentTitle', text, parent: parentTag }
        };
      }
      return null;
    })();
    const cause =
      (helpers.nameCause ? helpers.nameCause(el, { content: false }) : null) || imageCause;
    const baseOccurrence = {
      summary: 'This SVG <image> has no text alternative.',
      hint: cause
        ? cause.hint
        : 'Add a <title> inside the <image>, or name it with aria-label or aria-labelledby.',
      i18n: {
        summaryKey: 'svgImage_textAltPresent_summary_fail',
        hintKey: cause ? cause.hintKey : 'svgImage_textAltPresent_hint_fail',
        params: { element: 'image', ...(cause ? cause.params : {}) }
      },
      data: {
        details: {
          reasonCode: 'TEXT_ALTERNATIVE_MISSING',
          ...(cause ? { nameCause: cause.detail } : {})
        },
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
    }
  }

  if (applicableCount === 0)
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  if (!occurrences.length)
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
