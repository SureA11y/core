'use strict';

const id = 'dialog-name-present';

const meta = {
  title: 'Dialogs have an accessible name',
  description: 'Checks that elements with role="dialog" or role="alertdialog" expose a non-empty accessible name.',
  i18n: {
    titleKey: 'dialogNamePresent_title',
    descriptionKey: 'dialogNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a','wcag412','structure','atomic','automatic','name','dialog'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['dialog-name-present'] } }
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

  function hasAttr(el, name) {
    try { return !!(el && el.hasAttribute && el.hasAttribute(name)); } catch { return false; }
  }

  function isExplicitProgrammatic(el) {
    // Programmatic name mechanisms we treat as authoritative (presence-only):
    // - aria-label (non-empty)
    // - aria-labelledby (non-empty)
    // - title (non-empty) [weak but allowed for presence]
    const al = getAttr(el, 'aria-label');
    if (al) return true;
    const alb = getAttr(el, 'aria-labelledby');
    if (alb) return true;
    const t = getAttr(el, 'title');
    if (t) return true;
    return false;
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
    // Resolve via the shared getTextFromIdRefs helper — computes each
    // referenced element's own ACCESSIBLE NAME (aria-label, then
    // aria-labelledby, then a value-like name, then content, then title),
    // not just its content text. Found via a real page (BBC News' cookie-
    // consent dialog, 2026-07-22): aria-labelledby pointed at an
    // <iframe title="SP Consent Message">, whose only name source is its
    // title attribute (an iframe's content is opaque/cross-origin per
    // HTML-AAM, so "name from content" is always empty). The previous
    // version here only ever computed name-from-content of the referenced
    // node (via getConservativeSubtreeText), silently missing the title
    // fallback and reporting no accessible name at all — the identical
    // pattern was hand-copied into 15 other *-name-present rules; all
    // fixed the same way.
    if (helpers.getTextFromIdRefs) {
      try {
        const r = helpers.getTextFromIdRefs(raw, ctx, { maxRefs: maxRefs || 8 });
        return normalizeWs(r && r.text);
      } catch {}
    }
    return '';
  }

  function getInputValueName(el) {
    try {
      const type = getAttr(el, 'type').toLowerCase();
      if (type !== 'button' && type !== 'submit' && type !== 'reset') return '';
      const v = getAttr(el, 'value');
      return v;
    } catch { return ''; }
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

  const selector = '[role="dialog"],[role="alertdialog"]';
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart(selector, safeRoot) : helpers.queryAll(selector, safeRoot);


  function evaluate(el) {
    const ariaLabel = getAttr(el, 'aria-label');
    if (ariaLabel) return { ok: true, method: 'aria-label' };

    const ariaLabelledby = resolveAriaLabelledbyText(document, el, 8);
    if (ariaLabelledby) return { ok: true, method: 'aria-labelledby' };

    const title = getAttr(el, 'title');
    if (title) return { ok: true, method: 'title' };

    // role="dialog"/"alertdialog" is name-from-author-only per WAI-ARIA: it
    // must NOT fall back to subtree content. A dialog's heading or body
    // text is not reliably exposed to assistive technologies as the
    // dialog's accessible name unless explicitly wired via aria-labelledby.
    return { ok: false, method: 'none' };
  }

  for (const el of nodes) {
    if (!el) continue;
    if (!isEligibleAcc(helpers, el, ctx)) continue;

    const role = getAttr(el, 'role').toLowerCase();
    if (role !== 'dialog' && role !== 'alertdialog') continue;

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
      summary: 'This dialog has no accessible name.',
      hint: 'Provide aria-labelledby (preferred) or aria-label so assistive technologies can announce the dialog.',
      i18n: {
        summaryKey: 'dialogNamePresent_summary_fail',
        hintKey: 'dialogNamePresent_hint_fail',
        params: { role }
      },
      data: {
        details: { reasonCode: 'name_missing', controlType: role, methodTried: res.method },
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
