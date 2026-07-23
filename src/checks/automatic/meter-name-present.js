'use strict';

const id = 'a11ycore-meter-name-present';

const meta = {
  title: 'Meters have an accessible name',
  description: 'Checks that elements with role="meter" expose a non-empty accessible name.',
  i18n: {
    titleKey: 'a11ycore_meterNamePresent_title',
    descriptionKey: 'a11ycore_meterNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'atomic', 'automatic', 'name'],
  wcagSc: ['1.1.1'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '1.1.1', title: 'Non-text Content', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.1.1': ['meter-name-present'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
      ? helpers.getEligibilityInfo
      : null;
  const safeRoot = root || document;


  function normalizeWs(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function getAttr(el, name) {
    try {
      if (!el || !el.getAttribute) return '';
      return normalizeWs(el.getAttribute(name));
    } catch { return ''; }
  }

  function getConservativeSubtreeText(document, container) {
    // "Name from content" — recurses into descendants and uses each one's
    // own accessible name (img alt, aria-label/aria-labelledby, title) when
    // it has one, not just literal text nodes. See getContentNameInfo's
    // header comment in src/core/dom-helpers.js for the full rationale
    // (this replaced a text-node-only TreeWalker that missed the common
    // "<a><img alt='...'></a>" logo-link / "<button><img alt='...'></button>"
    // icon-button pattern).
    if (helpers.getContentNameInfo) {
      const info = helpers.getContentNameInfo(container, ctx);
      return info && info.present ? info.value : '';
    }
    const t = (container && container.textContent) ? String(container.textContent) : '';
    return t.replace(/\s+/g, ' ').trim();
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
    const fn = helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
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

  const selector = '[role="meter"]';
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart(selector, safeRoot) : helpers.queryAll(selector, safeRoot);


  function evaluate(el) {
    const ariaLabel = getAttr(el, 'aria-label');
    if (ariaLabel) return { ok: true, method: 'aria-label' };

    const ariaLabelledby = resolveAriaLabelledbyText(document, el, 8);
    if (ariaLabelledby) return { ok: true, method: 'aria-labelledby' };

    const title = getAttr(el, 'title');
    if (title) return { ok: true, method: 'title' };

    // role="meter" is name-from-author-only per WAI-ARIA (verified against
    // the reference engine's own aria-meter-name check: any: ['aria-label',
    // 'aria-labelledby', title] — no content-based naming method at all).
    // It must NOT fall back to subtree content — visible text near/inside a
    // custom meter widget is not reliably exposed as its accessible name.
    return { ok: false, method: 'none' };
  }

  for (const el of nodes) {
    if (!el) continue;
    if (!isEligibleAcc(helpers, el, ctx)) continue;

    const role = getAttr(el, 'role').toLowerCase();
    if (role !== 'meter') continue;

    applicableCount += 1;

    const res = evaluate(el);
    if (res.ok) continue;

    const eligInfo = getEligibilityInfo
        ? (() => { try { return getEligibilityInfo(el, ctx, { targetSet: 'acc' }); } catch { return null; } })()
        : null;
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This meter has no accessible name.',
      hint: 'Provide meter text that is not hidden from assistive technologies, or provide aria-label or aria-labelledby.',
      i18n: {
        summaryKey: 'a11ycore_meterNamePresent_summary_fail',
        hintKey: 'a11ycore_meterNamePresent_hint_fail',
        params: {}
      },
      data: {
        details: { reasonCode: 'name_missing', controlType: 'meter', methodTried: res.method },
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    });
  }


  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };