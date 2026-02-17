'use strict';

const id = 'a11ycore-textbox-name-present';

const meta = {
  title: 'Accessible name is present',
  description: 'Checks that elements expose a non-empty accessible name.',
  i18n: {
    titleKey: 'a11ycore_textboxNamePresent_title',
    descriptionKey: 'a11ycore_textboxNamePresent_description'
  },
  helpUrl: null,
  tags: ["wcag2a", "wcag412", "forms", "atomic", "automatic", "name", "textbox"],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['textbox-name-present'] } }
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

  function getConservativeSubtreeText(document, container) {
    const SHOW_TEXT = 4; // TreeWalker SHOW_TEXT
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
    const refs = raw.split(/\s+/).filter(Boolean).slice(0, Math.max(1, maxRefs || 8));
    const parts = [];
    for (const refKey of refs) {
      try {
        const refEl = document.getElementById(refKey);
        if (refEl) {
          const t = getConservativeSubtreeText(document, refEl);
          if (t) parts.push(t);
        }
      } catch {}
    }
    return normalizeWs(parts.join(' '));
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

  const selector = "[role=\"textbox\"]";
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart(selector, safeRoot) : helpers.queryAll(selector, safeRoot);


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
    if (!isEligibleAcc(helpers, el, ctx)) continue;

    applicableCount += 1;

    const res = hasName(el);
    if (res.ok) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This element has no accessible name.',
      hint: 'Provide aria-label or aria-labelledby (preferred), or provide visible text that is not hidden from assistive technologies.',
      summaryKey: 'a11ycore_textboxNamePresent_summary_fail',
      hintKey: 'a11ycore_textboxNamePresent_hint_fail',
      i18nParams: { controlType: 'textbox' },
      data: { details: { reasonCode: 'name_missing', controlType: 'textbox', methodTried: res.method } }
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
