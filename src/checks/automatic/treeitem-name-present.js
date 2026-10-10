/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check treeitem-name-present
 * @atomic true
 * @summary Elements with role="treeitem" must have an accessible name
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements whose role attribute resolves to treeitem: its first
 *   token naming a known role, matched in any case, is treeitem, so
 *   role="foo treeitem" and role="TREEITEM" count while role="link treeitem"
 *   (a link) does not. The element must be included in the accessibility
 *   tree. An element with the matching implicit role but no role attribute
 *   is out of scope.
 * @expectation
 *   The element has a non-empty accessible name from aria-label, from an
 *   aria-labelledby that resolves to non-empty text, from title, or,
 *   role="treeitem" being name-from-content, from its own subtree text,
 *   where a descendant's own name (an <img alt>, aria-label or title) counts
 *   as that descendant's contribution rather than only its text nodes.
 */

const id = 'treeitem-name-present';

const meta = {
  title: 'Tree items have an accessible name',
  description: 'Checks that elements with role="treeitem" expose a non-empty accessible name.',
  i18n: {
    titleKey: 'treeitemNamePresent_title',
    descriptionKey: 'treeitemNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'navigation', 'atomic', 'automatic', 'name', 'treeitem'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '4.1.2',
      title: 'Name, Role, Value',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['treeitem-name-present'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  // Set while the name is worked out from content: the name may sit in a
  // component no script can read (a closed shadow root), or in content
  // nested too deep to read (getContentNameInfo's depth-limit). Either is
  // asked about, not failed, as button-name-present and link-name-present do.
  let closedContent;
  let tooDeep;
  const { document, helpers, rule } = ctx;
  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getAttr(el, name) {
    try {
      if (!el || !dom.get(el, 'getAttribute')) return '';
      return normalizeWs(dom.getAttribute(el, name));
    } catch {
      return '';
    }
  }

  function getConservativeSubtreeText(document, container) {
    // "Name from content", recurses into descendants and uses each one's
    // own accessible name (img alt, aria-label/aria-labelledby, title) when
    // it has one, not just literal text nodes. See getContentNameInfo's
    // header comment in src/core/dom-helpers.js for the full rationale
    // (this replaced a text-node-only TreeWalker that missed the common
    // "<a><img alt='...'></a>" logo-link / "<button><img alt='...'></button>"
    // icon-button pattern).
    if (helpers.getContentNameInfo) {
      const info = helpers.getContentNameInfo(container, ctx);
      const flags = info && Array.isArray(info.flags) ? info.flags : [];
      closedContent = flags.includes('closedContent');
      tooDeep = flags.includes('depth-limit');
      return info && info.present ? info.value : '';
    }
    const t = container && dom.textContent(container) ? String(dom.textContent(container)) : '';
    return t.replace(/\s+/g, ' ').trim();
  }

  function resolveAriaLabelledbyText(document, el, maxRefs) {
    const raw = getAttr(el, 'aria-labelledby');
    if (!raw) return '';
    // Delegates to the shared getTextFromIdRefs helper instead of computing
    // name-from-content of the referenced element, see dialog-name-
    // present.js's identical fix for the full rationale (an <iframe>
    // aria-labelledby target's only name source is its title attribute,
    // which name-from-content alone can never see).
    if (helpers.getTextFromIdRefs) {
      try {
        const r = helpers.getTextFromIdRefs(raw, ctx, { maxRefs: maxRefs || 8 }, el);
        return normalizeWs(r && r.text);
      } catch {}
    }
    return '';
  }

  // Naming rules apply only to elements included in the accessibility tree
  // (ACT c487ae and siblings), which excludes focusable aria-hidden content.
  // aria-hidden-focus (ACT 6cfa84) covers that markup instead.
  function isEligibleAcc(helpers, el, ctx) {
    const fn =
      helpers && typeof helpers.isIncludedInAccessibilityTree === 'function'
        ? helpers.isIncludedInAccessibilityTree
        : helpers && typeof helpers.isAccTreeEligible === 'function'
          ? helpers.isAccTreeEligible
          : null;
    if (!fn) return true;
    try {
      const r = fn(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  const occurrences = [];
  // Elements whose name could not be told (closedContent, tooDeep).
  const questions = [];
  let applicableCount = 0;

  // `~=` matches the token anywhere in the role fallback list; the loop
  // below keeps only elements whose resolved explicit role (the first known
  // token) is treeitem, so role="link treeitem" (a link) is left out.
  const selector = '[role~="treeitem" i]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  function explicitRole(el) {
    try {
      return helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(el)
        : '';
    } catch {
      return '';
    }
  }

  function hasName(el) {
    const ariaLabel = getAttr(el, 'aria-label');
    if (ariaLabel) return { ok: true, method: 'aria-label' };

    const labelled = resolveAriaLabelledbyText(document, el, 8);
    if (labelled) return { ok: true, method: 'aria-labelledby' };

    const title = getAttr(el, 'title');
    if (title) return { ok: true, method: 'title' };

    const t = getConservativeSubtreeText(document, el);
    if (t) return { ok: true, method: 'content' };

    return { ok: false, method: 'none' };
  }

  for (const el of nodes) {
    if (!el) continue;
    if (explicitRole(el) !== 'treeitem') continue;
    if (!isEligibleAcc(helpers, el, ctx)) continue;

    applicableCount += 1;

    closedContent = false;
    tooDeep = false;
    const res = hasName(el);
    if (res.ok) continue;
    if (tooDeep || closedContent) {
      questions.push(
        helpers.reportOccurrence(el, {
          summary: tooDeep
            ? "This element's content is nested too deeply to work out a name from, so whether it has one could not be told."
            : 'This element may take its name from a component whose content no script can read (a closed shadow root), so whether it has one could not be told.',
          hint: tooDeep
            ? "Check its name in the browser's accessibility tree; browsers stop reading content that deep too, so give the element an aria-label or visible text near its top."
            : "Check its name in the browser's accessibility tree or with a screen reader; if it has none, give it an aria-label or visible text.",
          i18n: {
            summaryKey: tooDeep
              ? 'nameFromContent_summary_cantTell_contentTooDeep'
              : 'nameFromContent_summary_cantTell_closedContent',
            hintKey: tooDeep
              ? 'nameFromContent_hint_cantTell_contentTooDeep'
              : 'nameFromContent_hint_cantTell_closedContent'
          },
          uncertainty: {
            code: 'not-computable',
            needed: tooDeep
              ? "The element's name, from content nested too deep to read."
              : 'Whether the component inside gives the element a name.'
          },
          data: {
            details: { reasonCode: tooDeep ? 'name_contentTooDeep' : 'name_closedContent' }
          }
        })
      );
      continue;
    }

    const eligInfo = getEligibilityInfo
      ? (() => {
          try {
            return getEligibilityInfo(el, ctx, { targetSet: 'acc' });
          } catch {
            return null;
          }
        })()
      : null;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This element has no accessible name.',
        hint: 'Provide aria-label or aria-labelledby (preferred), or provide visible text that is not hidden from assistive technologies.',
        i18n: {
          summaryKey: 'treeitemNamePresent_summary_fail',
          hintKey: 'treeitemNamePresent_hint_fail',
          params: { controlType: 'treeitem' }
        },
        data: {
          details: { reasonCode: 'name_missing', controlType: 'treeitem', methodTried: res.method },
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  // Tiered only when there is a question, so a plain failure reads as before.
  if (questions.length) {
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome(occurrences, questions, rule.defaultSeverity || 'minor')
    };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
