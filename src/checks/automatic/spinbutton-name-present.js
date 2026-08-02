'use strict';

const id = 'spinbutton-name-present';

const meta = {
  title: 'Accessible name is present',
  description: 'Checks that elements expose a non-empty accessible name.',
  i18n: {
    titleKey: 'spinbuttonNamePresent_title',
    descriptionKey: 'spinbuttonNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'forms', 'atomic', 'automatic', 'name', 'spinbutton'],
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
  coverage: { facetsBySc: { '4.1.2': ['spinbutton-name-present'] } }
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
    const t = container && container.textContent ? String(container.textContent) : '';
    return t.replace(/\s+/g, ' ').trim();
  }

  // A <label> contributes a name via its own aria-label/aria-labelledby
  // (checked first, same ARIA-over-content precedence any element's
  // accessible name gives — e.g. <label aria-label="Search"><svg
  // aria-hidden="true">...</svg></label> names its control "Search" even
  // though the label's only child content is aria-hidden) or, failing
  // that, its rendered content (getConservativeSubtreeText).
  function getLabelText(lab) {
    if (helpers.getAriaNameInfo) {
      try {
        const aria = helpers.getAriaNameInfo(lab, ctx);
        if (aria && aria.present && aria.value) return normalizeWs(aria.value);
      } catch {}
    }
    const content = getConservativeSubtreeText(document, lab);
    if (content) return content;
    // Final fallback per the general accname text-alternative algorithm,
    // which applies to any element being asked for its name regardless of
    // why (own aria-label, an aria-labelledby reference, or — here — native
    // <label for> association): title, when nothing else yields a name.
    // Purely additive (only fills in a name where there was none before),
    // so it carries no false-positive risk — see dialog-name-present.js's
    // identical <iframe>-title-fallback fix for the concrete real-world
    // trigger this same accname step covers elsewhere.
    return getAttr(lab, 'title');
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

  function buildLabelForMap(doc) {
    const map = new Map(); // id -> label element (first)
    try {
      const labels = doc && doc.getElementsByTagName ? doc.getElementsByTagName('label') : [];
      for (let i = 0; i < labels.length; i += 1) {
        const lab = labels[i];
        if (!lab || !lab.getAttribute) continue;
        const f = normalizeWs(lab.getAttribute('for'));
        if (!f) continue;
        if (!map.has(f)) map.set(f, lab);
      }
    } catch {}
    return map;
  }

  const occurrences = [];
  let applicableCount = 0;

  const selector = '[role="spinbutton"]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  // Precompute label[for] map for spinbutton elements that are labelable
  // native form controls (e.g. <input role="spinbutton">).
  const labelForMap = buildLabelForMap(document);

  function getNativeLabelText(el) {
    try {
      if ('labels' in el && el.labels && el.labels.length) {
        const parts = [];
        const max = Math.min(4, el.labels.length);
        for (let i = 0; i < max; i += 1) {
          const lab = el.labels[i];
          const t = lab ? getLabelText(lab) : '';
          if (t) parts.push(t);
        }
        const joined = normalizeWs(parts.join(' '));
        if (joined) return joined;
      }
    } catch {}
    try {
      if (el.closest) {
        const wrap = el.closest('label');
        if (wrap) {
          const t = getLabelText(wrap);
          if (t) return t;
        }
      }
    } catch {}
    try {
      const idAttr = getAttr(el, 'id');
      if (idAttr && labelForMap.has(idAttr)) {
        const lab = labelForMap.get(idAttr);
        const t = lab ? getLabelText(lab) : '';
        if (t) return t;
      }
    } catch {}
    return '';
  }

  function hasName(el) {
    const ariaLabel = getAttr(el, 'aria-label');
    if (ariaLabel) return { ok: true, method: 'aria-label' };

    const labelled = resolveAriaLabelledbyText(document, el, 8);
    if (labelled) return { ok: true, method: 'aria-labelledby' };

    const title = getAttr(el, 'title');
    if (title) return { ok: true, method: 'title' };

    // Native <label> association (e.g. <input role="spinbutton">).
    const lab = getNativeLabelText(el);
    if (lab) return { ok: true, method: 'label' };

    // role="spinbutton" is name-from-author-only per WAI-ARIA: it must NOT
    // fall back to subtree content.
    return { ok: false, method: 'none' };
  }

  for (const el of nodes) {
    if (!el) continue;
    if (!isEligibleAcc(helpers, el, ctx)) continue;

    applicableCount += 1;

    const res = hasName(el);
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
      summary: 'This element has no accessible name.',
      hint: "Provide aria-label, aria-labelledby, or a title attribute — visible text content is not exposed as this spinbutton's accessible name.",
      i18n: {
        summaryKey: 'spinbuttonNamePresent_summary_fail',
        hintKey: 'spinbuttonNamePresent_hint_fail',
        params: { controlType: 'spinbutton' }
      },
      data: {
        details: { reasonCode: 'name_missing', controlType: 'spinbutton', methodTried: res.method },
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
