'use strict';

const id = 'progressbar-name-present';

const meta = {
  title: 'Progress bars have an accessible name',
  description: 'Checks that elements with role="progressbar" expose a non-empty accessible name.',
  i18n: {
    titleKey: 'progressbarNamePresent_title',
    descriptionKey: 'progressbarNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'atomic', 'automatic', 'name'],
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
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.1.1': ['progressbar-name-present'] } }
};

function runInPage(ctx) {
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
      if (!el || !el.getAttribute) return '';
      return normalizeWs(el.getAttribute(name));
    } catch {
      return '';
    }
  }

  function resolveAriaLabelledbyText(document, el, maxRefs) {
    const raw = getAttr(el, 'aria-labelledby');
    if (!raw) return '';
    // Delegates to the shared getTextFromIdRefs helper instead of computing
    // name-from-content of the referenced element — see dialog-name-
    // present.js's identical fix for the full rationale (an <iframe>
    // aria-labelledby target's only name source is its title attribute,
    // which name-from-content alone can never see).
    if (helpers.getTextFromIdRefs) {
      try {
        const r = helpers.getTextFromIdRefs(raw, ctx, { maxRefs: maxRefs || 8 });
        return normalizeWs(r && r.text);
      } catch {}
    }
    return '';
  }

  function isEligibleAcc(helpers, el, ctx) {
    const fn =
      helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
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
  let applicableCount = 0;

  const selector = '[role="progressbar"]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  function evaluate(el) {
    const ariaLabel = getAttr(el, 'aria-label');
    if (ariaLabel) return { ok: true, method: 'aria-label' };

    const ariaLabelledby = resolveAriaLabelledbyText(document, el, 8);
    if (ariaLabelledby) return { ok: true, method: 'aria-labelledby' };

    const title = getAttr(el, 'title');
    if (title) return { ok: true, method: 'title' };

    // role="progressbar" is name-from-author-only per WAI-ARIA (verified
    // against a widely-used reference engine's own aria-progressbar-name check: any:
    // ['aria-label', 'aria-labelledby', title] — no content-based naming
    // method at all). It must NOT fall back to subtree content: found on a
    // real site, Instacart's <ul role="progressbar"> loading skeleton has
    // no name of its own, but nested descendants carry their own
    // aria-label="Loading Box" (for a completely different purpose) —
    // falling back to subtree content picked that up and wrongly treated
    // it as the progressbar's own name, when that reference engine correctly
    // still flags it as unnamed.
    return { ok: false, method: 'none' };
  }

  for (const el of nodes) {
    if (!el) continue;
    if (!isEligibleAcc(helpers, el, ctx)) continue;

    const role = getAttr(el, 'role').toLowerCase();
    if (role !== 'progressbar') continue;

    applicableCount += 1;

    const res = evaluate(el);
    if (res.ok) continue;

    const eligInfo = getEligibilityInfo
      ? (() => {
          try {
            return getEligibilityInfo(el, ctx, { targetSet: 'acc' });
          } catch {
            return null;
          }
        })()
      : null;
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This progress bar has no accessible name.',
      hint: "Provide aria-label, aria-labelledby, or a title attribute — visible text content is not exposed as this progress bar's accessible name.",
      i18n: {
        summaryKey: 'progressbarNamePresent_summary_fail',
        hintKey: 'progressbarNamePresent_hint_fail',
        params: {}
      },
      data: {
        details: {
          reasonCode: 'name_missing',
          controlType: 'progressbar',
          methodTried: res.method
        },
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
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
