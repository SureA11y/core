'use strict';

const id = 'binary-control-name-present';

const meta = {
  title: 'Binary controls have an accessible name',
  description: 'Checks that checkbox, radio, and switch controls expose a non-empty accessible name.',
  i18n: {
    titleKey: 'binaryControlNamePresent_title',
    descriptionKey: 'binaryControlNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a','wcag412','forms','atomic','automatic','name','checkbox','radio','switch'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['checkbox-name-present','radio-name-present','switch-name-present'] } }
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

  const selector = 'input[type="checkbox"], input[type="radio"], [role="checkbox"], [role="radio"], [role="switch"]';
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart(selector, safeRoot) : helpers.queryAll(selector, safeRoot);


  // Precompute label[for] associations once for speed/determinism.
  const labelForMap = buildLabelForMap(document);

  function getNativeLabelText(el) {
    // 1) labels API
    try {
      if ('labels' in el && el.labels && el.labels.length) {
        // concatenate conservative text of all associated labels (cap at 4 for determinism)
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

    // 2) wrapped by <label>
    try {
      if (el.closest) {
        const wrap = el.closest('label');
        if (wrap) {
          const t = getLabelText(wrap);
          if (t) return t;
        }
      }
    } catch {}

    // 3) label[for=id]
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

  function evaluate(el, controlType) {
    // Programmatic mechanisms
    const ariaLabel = getAttr(el, 'aria-label');
    if (ariaLabel) return { ok: true, method: 'aria-label' };

    const ariaLabelledby = resolveAriaLabelledbyText(document, el, 8);
    if (ariaLabelledby) return { ok: true, method: 'aria-labelledby' };

    const title = getAttr(el, 'title');
    if (title) return { ok: true, method: 'title' };

    // Native input label association (for input[type=checkbox|radio])
    if (controlType === 'checkbox' || controlType === 'radio') {
      const lab = getNativeLabelText(el);
      if (lab) return { ok: true, method: 'label' };
    }

    // ARIA roles (checkbox/radio/switch) can use content as name
    if (controlType === 'switch' || controlType === 'aria-checkbox' || controlType === 'aria-radio') {
      const t = getConservativeSubtreeText(document, el);
      if (t) return { ok: true, method: 'content' };
    }

    return { ok: false, method: 'none' };
  }

  for (const el of nodes) {
    if (!el) continue;
    if (!isEligibleAcc(helpers, el, ctx)) continue;

    // Determine control type
    const tag = (el.tagName || '').toLowerCase();
    const type = getAttr(el, 'type').toLowerCase();
    const role = getAttr(el, 'role').toLowerCase();

    let controlType = '';
    if (tag === 'input' && type === 'checkbox') controlType = 'checkbox';
    else if (tag === 'input' && type === 'radio') controlType = 'radio';
    else if (role === 'checkbox') controlType = 'aria-checkbox';
    else if (role === 'radio') controlType = 'aria-radio';
    else if (role === 'switch') controlType = 'switch';
    else continue;

    applicableCount += 1;

    const res = evaluate(el, controlType);
    if (res.ok) continue;

    const eligInfo = getEligibilityInfo
        ? (() => { try { return getEligibilityInfo(el, ctx, { targetSet: 'acc' }); } catch { return null; } })()
        : null;
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This control has no accessible name.',
      hint: 'Provide a label, aria-label, aria-labelledby, or other accessible-name mechanism so assistive technologies can identify the control.',
      i18n: {
        summaryKey: 'binaryControlNamePresent_summary_fail',
        hintKey: 'binaryControlNamePresent_hint_fail',
        params: { controlType }
      },
      data: {
        details: {
          reasonCode: 'name_missing',
          controlType,
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
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
