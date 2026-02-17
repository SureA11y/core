'use strict';

const id = 'a11ycore-slider-name-present';

const meta = {
  title: 'Sliders have an accessible name',
  description: 'Checks that sliders (input[type="range"] and role="slider") expose a non-empty accessible name.',
  i18n: {
    titleKey: 'a11ycore_sliderNamePresent_title',
    descriptionKey: 'a11ycore_sliderNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a','wcag412','forms','atomic','automatic','name','slider'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['slider-name-present'] } }
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

  const selector = 'input[type="range"], [role="slider"]';
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart(selector, safeRoot) : helpers.queryAll(selector, safeRoot);


  // Precompute label[for] map for native range inputs.
  const labelForMap = buildLabelForMap(document);

  function getNativeLabelText(el) {
    try {
      if ('labels' in el && el.labels && el.labels.length) {
        const parts = [];
        const max = Math.min(4, el.labels.length);
        for (let i = 0; i < max; i += 1) {
          const lab = el.labels[i];
          const t = lab ? getConservativeSubtreeText(document, lab) : '';
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
          const t = getConservativeSubtreeText(document, wrap);
          if (t) return t;
        }
      }
    } catch {}
    try {
      const idAttr = getAttr(el, 'id');
      if (idAttr && labelForMap.has(idAttr)) {
        const lab = labelForMap.get(idAttr);
        const t = lab ? getConservativeSubtreeText(document, lab) : '';
        if (t) return t;
      }
    } catch {}
    return '';
  }

  function evaluate(el, kind) {
    const ariaLabel = getAttr(el, 'aria-label');
    if (ariaLabel) return { ok: true, method: 'aria-label' };

    const ariaLabelledby = resolveAriaLabelledbyText(document, el, 8);
    if (ariaLabelledby) return { ok: true, method: 'aria-labelledby' };

    const title = getAttr(el, 'title');
    if (title) return { ok: true, method: 'title' };

    if (kind === 'native-slider') {
      const lab = getNativeLabelText(el);
      if (lab) return { ok: true, method: 'label' };
      return { ok: false, method: 'none' };
    }

    // role=slider can derive name from content in some patterns
    const t = getConservativeSubtreeText(document, el);
    if (t) return { ok: true, method: 'content' };

    return { ok: false, method: 'none' };
  }

  for (const el of nodes) {
    if (!el) continue;
    if (!isEligibleAcc(helpers, el, ctx)) continue;

    const tag = (el.tagName || '').toLowerCase();
    const type = getAttr(el, 'type').toLowerCase();
    const role = getAttr(el, 'role').toLowerCase();

    let kind = '';
    if (tag === 'input' && type === 'range') kind = 'native-slider';
    else if (role === 'slider') kind = 'aria-slider';
    else continue;

    applicableCount += 1;

    const res = evaluate(el, kind);
    if (res.ok) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This slider has no accessible name.',
      hint: 'Provide a label, aria-label, or aria-labelledby so assistive technologies can identify the slider.',
      summaryKey: 'a11ycore_sliderNamePresent_summary_fail',
      hintKey: 'a11ycore_sliderNamePresent_hint_fail',
      i18nParams: { kind },
      data: { details: { reasonCode: 'name_missing', controlType: kind, methodTried: res.method } }
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
