'use strict';

const id = 'a11ycore-combobox-name-present';

const meta = {
  title: 'Comboboxes have an accessible name',
  description: 'Checks that elements with role="combobox" expose a non-empty accessible name.',
  i18n: {
    titleKey: 'a11ycore_comboboxNamePresent_title',
    descriptionKey: 'a11ycore_comboboxNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a','wcag412','forms','atomic','automatic','name','combobox'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['combobox-name-present'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
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
    // Deterministic text extraction excluding aria-hidden="true" and [hidden] subtrees.
    // Use TreeWalker when available; avoid NodeFilter global.
    const SHOW_TEXT = 4;
    try {
      const walker = document.createTreeWalker(container, SHOW_TEXT, null);
      const parts = [];
      let n = walker.nextNode();
      while (n) {
        const raw = normalizeWs(n.nodeValue || '');
        if (raw) {
          const pe = n.parentElement;
          let blocked = false;
          if (pe && typeof pe.closest === 'function') {
            const blocker = pe.closest('[aria-hidden="true"],[hidden]');
            if (blocker && container.contains(blocker)) blocked = true;
          } else {
            let p = pe;
            while (p && p !== container) {
              if (p.getAttribute && p.getAttribute('aria-hidden') === 'true') { blocked = true; break; }
              if (p.hasAttribute && p.hasAttribute('hidden')) { blocked = true; break; }
              p = p.parentElement;
            }
          }
          if (!blocked) {
            if (container.getAttribute && container.getAttribute('aria-hidden') === 'true') blocked = true;
            if (!blocked && container.hasAttribute && container.hasAttribute('hidden')) blocked = true;
          }
          if (!blocked) parts.push(raw);
        }
        n = walker.nextNode();
      }
      return normalizeWs(parts.join(' '));
    } catch {
      // Manual deterministic walk
      try {
        const parts = [];
        const stack = [container];
        while (stack.length) {
          const node = stack.pop();
          if (!node) continue;
          if (node.nodeType === 3) { // TEXT_NODE
            const raw = normalizeWs(node.nodeValue || '');
            if (raw) parts.push(raw);
            continue;
          }
          if (node.nodeType === 1) { // ELEMENT_NODE
            if (node.getAttribute && node.getAttribute('aria-hidden') === 'true') continue;
            if (node.hasAttribute && node.hasAttribute('hidden')) continue;
            const kids = node.childNodes ? Array.from(node.childNodes) : [];
            for (let i = kids.length - 1; i >= 0; i -= 1) stack.push(kids[i]);
          }
        }
        return normalizeWs(parts.join(' '));
      } catch {
        return '';
      }
    }
  }

  function resolveAriaLabelledbyText(document, el, maxRefs) {
    const raw = getAttr(el, 'aria-labelledby');
    if (!raw) return '';
    const ids = raw.split(/\s+/).filter(Boolean).slice(0, Math.max(1, maxRefs || 8));
    const parts = [];
    for (const elementId of ids) {
      try {
        const ref = document.getElementById(elementId);
        if (ref) {
          const t = getConservativeSubtreeText(document, ref);
          if (t) parts.push(t);
        }
      } catch {}
    }
    return normalizeWs(parts.join(' '));
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

  const selector = '[role="combobox"]';
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart(selector, safeRoot) : helpers.queryAll(selector, safeRoot);


  function evaluate(el, controlType) {
    const ariaLabel = getAttr(el, 'aria-label');
    if (ariaLabel) return { ok: true, method: 'aria-label' };

    const ariaLabelledby = resolveAriaLabelledbyText(document, el, 8);
    if (ariaLabelledby) return { ok: true, method: 'aria-labelledby' };

    const title = getAttr(el, 'title');
    if (title) return { ok: true, method: 'title' };

    // Content-derived name is allowed for role-based combobox patterns (often a button-like element).
    const t = getConservativeSubtreeText(document, el);
    if (t) return { ok: true, method: 'content' };

    return { ok: false, method: 'none' };
  }

  for (const el of nodes) {
    if (!el) continue;
    if (!isEligibleAcc(helpers, el, ctx)) continue;

    const role = getAttr(el, 'role').toLowerCase();
    if (role !== 'combobox') continue;

    applicableCount += 1;

    const res = evaluate(el, 'combobox');
    if (res.ok) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This combobox has no accessible name.',
      hint: 'Provide aria-label or aria-labelledby (preferred), or ensure the element has visible text that is not hidden from assistive technologies.',
      summaryKey: 'a11ycore_comboboxNamePresent_summary_fail',
      hintKey: 'a11ycore_comboboxNamePresent_hint_fail',
      i18nParams: {},
      data: { details: { reasonCode: 'name_missing', controlType: 'combobox', methodTried: res.method } }
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
