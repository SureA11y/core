'use strict';

// NOTE: Repo ruleId contract requires ENGINE_TAG prefix in the rule id.
// File name intentionally has no prefix, per request.
const id = 'button-name-present';

const meta = {
  title: 'Buttons have an accessible name',
  description: 'Checks that buttons expose a non-empty accessible name.',
  i18n: {
    titleKey: 'buttonNamePresent_title',
    descriptionKey: 'buttonNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'forms', 'atomic', 'automatic', 'buttons', 'name'],
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
  coverage: { facetsBySc: { '4.1.2': ['button-name-present'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const occurrences = [];
  let applicableCount = 0;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getConservativeSubtreeText(container) {
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

  function getInputButtonValueName(el) {
    try {
      const type = normalizeWs(el.getAttribute ? el.getAttribute('type') : '').toLowerCase();
      if (type !== 'button' && type !== 'submit' && type !== 'reset') return '';
      const vAttr = el.getAttribute ? el.getAttribute('value') : '';
      return normalizeWs(vAttr != null ? vAttr : typeof el.value === 'string' ? el.value : '');
    } catch {
      return '';
    }
  }

  const selector =
    'button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  for (const el of nodes) {
    // isAccTreeEligible returns { eligible, reasons }, not a boolean.
    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    applicableCount += 1;

    const tag = (el.tagName || '').toLowerCase();
    const role = el.getAttribute ? el.getAttribute('role') : null;
    const roleNorm = normalizeWs(role).toLowerCase();

    const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;

    // getAccessibleNameInfo only resolves programmatic mechanisms (aria-labelledby,
    // aria-label, native <label> association, title) — it never falls back to
    // subtree content — so it's safe to trust directly whenever present.
    const trustedProgrammaticName = normalizeWs(
      nameInfo && nameInfo.present && typeof nameInfo.value === 'string' ? nameInfo.value : ''
    );
    const explicitProg = !!trustedProgrammaticName;

    let inputValueName = '';
    if (!trustedProgrammaticName && tag === 'input') {
      inputValueName = getInputButtonValueName(el);
    }

    // A native <button> (or [role="button"]) whose role has been overridden to
    // one of these roles is no longer semantically a button — per the WAI-ARIA
    // Accessible Name and Description Computation spec these roles are
    // name-from-author-only, and their rendered content represents a VALUE,
    // not a NAME. Found on a real page (Spotify's "sort by" control): a
    // <button role="combobox">List</button> where "List" is the combobox's
    // currently selected value, not a label for what the combobox is —
    // crediting it as the accessible name masked a real missing-name bug.
    const VALUE_ROLES = [
      'textbox',
      'progressbar',
      'scrollbar',
      'slider',
      'spinbutton',
      'combobox',
      'listbox'
    ];
    const isContentNameCandidate =
      (tag === 'button' || role === 'button') && !VALUE_ROLES.includes(roleNorm);
    const contentName =
      !trustedProgrammaticName && !inputValueName && isContentNameCandidate
        ? getConservativeSubtreeText(el)
        : '';

    const finalName = normalizeWs(trustedProgrammaticName || inputValueName || contentName);

    if (!finalName) {
      // Only compute the richer eligibility-info payload (used solely for
      // the occurrence's visibilityFilter) once we know an occurrence is
      // actually being built, rather than for every applicable element.
      const eligInfo = helpers.getEligibilityInfo
        ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
        : null;

      const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
      const html = helpers.getOuterHtmlSnippet
        ? helpers.getOuterHtmlSnippet(el)
        : el.outerHTML || '';

      occurrences.push({
        selector: stableSelector,
        html,
        summary: 'This button has no accessible name.',
        hint: 'Provide visible button text or a programmatic accessible-name mechanism (for example aria-label) so assistive technologies can identify the button.',
        i18n: {
          summaryKey: 'buttonNamePresent_summary_fail',
          hintKey: 'buttonNamePresent_hint_fail',
          params: { element: tag }
        },
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
