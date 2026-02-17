'use strict';

// NOTE: Repo ruleId contract requires ENGINE_TAG prefix in the rule id.
// File name intentionally has no prefix, per request.
const id = 'a11ycore-button-name-present';

const meta = {
  title: 'Buttons have an accessible name',
  description: 'Checks that buttons expose a non-empty accessible name.',
  i18n: {
    titleKey: 'a11ycore_buttonNamePresent_title',
    descriptionKey: 'a11ycore_buttonNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'forms', 'atomic', 'automatic', 'buttons', 'name'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['button-name-present'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const occurrences = [];
  let applicableCount = 0;

  function normalizeWs(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function getConservativeSubtreeText(container) {
    // Deterministic content-derived naming:
    // - counts text nodes
    // - excludes text where any ancestor within container has aria-hidden="true" or [hidden]
    //
    // IMPORTANT: do NOT reference global NodeFilter (can be undefined in some runtimes).
    // Use the constant SHOW_TEXT = 4.
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
      // As a last resort, fall back to a manual text-node scan without NodeFilter/TreeWalker.
      // This remains deterministic and still respects aria-hidden/hidden.
      try {
        const textNodes = [];
        const stack = [container];
        while (stack.length) {
          const node = stack.pop();
          if (!node) continue;

          if (node.nodeType === 3) { // TEXT_NODE
            textNodes.push(node);
            continue;
          }

          if (node.nodeType === 1) { // ELEMENT_NODE
            // If this element is hidden from AT, skip its subtree
            if (node.getAttribute && node.getAttribute('aria-hidden') === 'true') continue;
            if (node.hasAttribute && node.hasAttribute('hidden')) continue;

            // Push children in reverse to preserve document order
            const kids = node.childNodes ? Array.from(node.childNodes) : [];
            for (let i = kids.length - 1; i >= 0; i -= 1) stack.push(kids[i]);
          }
        }

        const parts = [];
        for (const tn of textNodes) {
          const raw = normalizeWs(tn.nodeValue || '');
          if (raw) parts.push(raw);
        }
        return normalizeWs(parts.join(' '));
      } catch {
        return '';
      }
    }
  }

  function getInputButtonValueName(el) {
    try {
      const type = normalizeWs(el.getAttribute ? el.getAttribute('type') : '').toLowerCase();
      if (type !== 'button' && type !== 'submit' && type !== 'reset') return '';
      const vAttr = el.getAttribute ? el.getAttribute('value') : '';
      return normalizeWs(vAttr != null ? vAttr : (typeof el.value === 'string' ? el.value : ''));
    } catch {
      return '';
    }
  }

  function hasExplicitProgrammaticName(el) {
    const ariaLabel = normalizeWs(el.getAttribute ? el.getAttribute('aria-label') : '');
    if (ariaLabel) return true;

    const ariaLabelledby = normalizeWs(el.getAttribute ? el.getAttribute('aria-labelledby') : '');
    if (ariaLabelledby) return true;

    const title = normalizeWs(el.getAttribute ? el.getAttribute('title') : '');
    if (title) return true;

    return false;
  }

  const selector = 'button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]';
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart(selector, safeRoot) : helpers.queryAll(selector, safeRoot);

  for (const el of nodes) {
    const eligInfo = helpers.getEligibilityInfo ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;
    const eligible = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    if (!eligible) continue;

    applicableCount += 1;

    const tag = (el.tagName || '').toLowerCase();
    const role = el.getAttribute ? el.getAttribute('role') : null;

    const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
    const explicitProg = hasExplicitProgrammaticName(el);

    // Only trust helper value as programmatic when we can prove a programmatic mechanism exists.
    let trustedProgrammaticName = '';
    if (explicitProg) {
      trustedProgrammaticName = normalizeWs(nameInfo && typeof nameInfo.value === 'string' ? nameInfo.value : '');
    }

    let inputValueName = '';
    if (!trustedProgrammaticName && tag === 'input') {
      inputValueName = getInputButtonValueName(el);
    }

    const isContentNameCandidate = tag === 'button' || role === 'button';
    const contentName =
      (!trustedProgrammaticName && !inputValueName && isContentNameCandidate)
        ? getConservativeSubtreeText(el)
        : '';

    const finalName = normalizeWs(trustedProgrammaticName || inputValueName || contentName);

    if (!finalName) {
      const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
      const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

      occurrences.push({
        selector: stableSelector,
        html,
        summary: 'This button has no accessible name.',
        hint: 'Provide visible button text or a programmatic accessible-name mechanism (for example aria-label) so assistive technologies can identify the button.',
        summaryKey: 'a11ycore_buttonNamePresent_summary_fail',
        hintKey: 'a11ycore_buttonNamePresent_hint_fail',
        i18nParams: { element: tag },
        data: {
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
          details: {
            reasonCode: 'name_missing',
            metrics: {
              trustedProgrammaticNameLength: trustedProgrammaticName.length,
              inputValueNameLength: inputValueName.length,
              contentNameLength: contentName.length,
              explicitProgrammatic: explicitProg ? 1 : 0
            },
            refs: { accessibleName: nameInfo || null }
          }
        }
      });
    }
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
