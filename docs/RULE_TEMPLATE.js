'use strict';

/**
 * @rule a11yCore-<kebab-id>
 * @atomic yes
 * @summary <One-sentence summary of the single normative requirement>
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @ref WCAG22:1.1.1; EN301549:9.1.1
 * @applicability <Precisely define which elements/content this rule applies to; include exclusions>
 * @expectation <Define Pass/Fail/NotApplicable/CantTell conditions deterministically>
 * @implementation-notes
 * - This file is loaded in Node, but runInPage(ctx) is executed inside the browser DOM via page.evaluate.
 * - IMPORTANT: runInPage(ctx) MUST NOT capture Node variables (including `meta`). Only use ctx.*, DOM APIs, and locals.
 * - Prefer helpers.queryAllSmart when available; fall back safely.
 */

const id = '<kebab-id>';

const meta = {
  title: '<Human-friendly title>',
  description: '<What this rule checks and why>',
  tags: ['wcag', '1.1.1', '<topic>'],
  wcagSc: ['1.1.1'],
  // Optional additional mappings if your engine supports them:
  // en301549: ['9.1.1'],
  defaultSeverity: 'serious',
  category: '<perceivable|operable|understandable|robust>',
  type: 'automatic', // 'automatic' | 'manual'
  defaultConfidence: 'high'
};

function runInPage(ctx) {
  // SAFETY NOTE: This function runs in the page context (serialized). Do not reference outer-scope variables.

  const { document, root, helpers, rule } = ctx;

  // --- helpers with safe fallbacks (shadow-DOM aware when available) ---
  const queryAllSmart = helpers && helpers.queryAllSmart ? helpers.queryAllSmart : null;
  const queryAll = helpers && helpers.queryAll ? helpers.queryAll : (sel) => {
    try {
      return Array.from((root || document).querySelectorAll(sel));
    } catch {
      return [];
    }
  };

  const getOuterHtmlSnippet = helpers && helpers.getOuterHtmlSnippet
    ? helpers.getOuterHtmlSnippet
    : (el) => (el && el.outerHTML) || '';

  const buildSimpleSelector = helpers && helpers.buildSimpleSelector
    ? helpers.buildSimpleSelector
    : (el) => {
        if (!el || typeof el !== 'object') return 'html';
        const tag = el.tagName ? el.tagName.toLowerCase() : 'html';
        return tag;
      };

  // --- selection ---
  const elements = queryAllSmart
    ? queryAllSmart('<your-selector-here>', { root: root || document })
    : queryAll('<your-selector-here>');

  if (!elements.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: rule.defaultSeverity || 'serious',
      occurrences: []
    };
  }

  const occurrencesFail = [];
  const occurrencesCantTell = [];

  for (const el of elements) {
    // TODO: implement deterministic check(s) for *one* requirement only.

    const isFail = false;
    const isCantTell = false;

    if (isFail) {
      occurrencesFail.push({
        selector: buildSimpleSelector(el),
        html: getOuterHtmlSnippet(el),
        summary: '<What failed (short)>',
        hint: '<How to fix (actionable)>'
      });
    } else if (isCantTell) {
      occurrencesCantTell.push({
        selector: buildSimpleSelector(el),
        html: getOuterHtmlSnippet(el),
        summary: '<Needs human review (short)>',
        hint: '<What to verify, referencing the standard intent>'
      });
    }
  }

  if (occurrencesFail.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'serious',
      occurrences: occurrencesFail
    };
  }

  if (occurrencesCantTell.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'serious',
      occurrences: occurrencesCantTell
    };
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'pass',
    severity: 'minor',
    occurrences: []
  };
}

module.exports = { id, meta, runInPage };
