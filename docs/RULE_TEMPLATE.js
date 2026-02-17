'use strict';

/**
 * DOM Rules: Rule Template (v1)
 *
 * Copy this file to src/checks/<kebab-id>.js and fill in the placeholders.
 *
 * IMPORTANT: This module is loaded in Node, but `runInPage(ctx)` is serialized and executed
 * inside the browser DOM via page.evaluate. Therefore:
 *   - runInPage(ctx) MUST NOT capture outer-scope variables (including `meta` or `id`).
 *   - Only use ctx.*, DOM APIs, and local variables.
 *
 * i18n CONTRACT (required)
 * Each rule should provide translation keys for:
 *   - meta.title
 *   - meta.description (optional but recommended)
 * and each occurrence should provide translation keys for:
 *   - summary
 *   - hint
 *
 * Recommended key convention:
 *   checks.<canonicalRuleId>.meta.title
 *   checks.<canonicalRuleId>.meta.description
 *   checks.<canonicalRuleId>.occurrence.<case>.summary
 *   checks.<canonicalRuleId>.occurrence.<case>.hint
 *
 * Where <canonicalRuleId> is the engine-prefixed id (e.g. a11ycore-<kebab-id>).
 */

/**
 * @check <kebab-id>  (engine prefix is applied at build-time: a11ycore-<kebab-id>)
 * @atomic true
 * @summary <One-sentence summary of the single normative requirement>
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @ref WCAG22:1.1.1; EN301549:9.1.1.1
 * @applicability <Precisely define which elements/content this rule applies to; include exclusions>
 * @expectation <Define pass/fail/notApplicable/cantTell deterministically>
 * @implementation-notes
 * - runInPage(ctx) is executed inside the browser DOM; do not import modules or capture outer scope.
 *
 * FAIL INTEGRITY REQUIREMENT
 * - Return `fail` only when ALL are true:
 *   1) A mapped normative requirement is violated
 *   2) The violation is a real, user-impacting accessibility barrier
 *   3) The condition is objectively and deterministically detectable
 * - If any condition is not met, return `cantTell` (manual) or reclassify as advisory.
 *
 * RULE TYPE GUIDANCE
 * - Automatic checks: may return pass | fail | notApplicable | cantTell
 * - Manual checks: must NEVER return fail (only cantTell | notApplicable | pass)
 *
 * RESULT PAYLOAD
 * - You may include a `data` object (non-normative) with: fixes[], usefulFor[], notes[]
 */

const id = '<kebab-id>';

const meta = {
  // Base (English) fallbacks used when i18n keys are missing.
  title: '<Human-friendly title>',
  description: '<What this rule checks and why>',
  helpUrl: null,
  tags: ['<topic>', 'wcag2a', 'wcag111'],
  defaultSeverity: 'serious',
  category: '<perceivable|operable|understandable|robust>',
  type: 'automatic', // 'automatic' | 'manual'
  defaultConfidence: 'high',

  // Standards traceability
  normativeMappings: [
    // { standard: 'WCAG', version: '2.2', requirement: '1.1.1', conformanceLevel: 'A', title: 'Non-text Content' }
  ],

  // i18n keys (required when i18n provided)
  i18n: {
    titleKey: 'checks.a11ycore-<kebab-id>.meta.title',
    descriptionKey: 'checks.a11ycore-<kebab-id>.meta.description'
  }
};

/**
 * NOTE: runInPage() is serialized/executed from source by a11y-core.
 * Do not reference outer-scope variables like `meta` or `id`.
 */
function runInPage(ctx) {
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
    : (el) => {
        try { return (el && el.outerHTML) ? String(el.outerHTML) : ''; } catch { return ''; }
      };

  const buildSelector = helpers && helpers.buildSelector
    ? helpers.buildSelector
    : (el) => {
        if (!el || typeof el !== 'object') return 'html';
        const tag = el.tagName ? el.tagName.toLowerCase() : 'html';
        return tag;
      };

  // --- selection ---
  const elements = queryAllSmart
    ? queryAllSmart('<your-selector-here>')
    : queryAll('<your-selector-here>');

  if (!elements.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: rule.defaultSeverity || 'serious',
      occurrences: [],
      data: { fixes: [], usefulFor: [], notes: [] }
    };
  }

  const occurrencesFail = [];
  const occurrencesCantTell = [];

  for (const el of elements) {
    // TODO: implement deterministic check(s) for ONE requirement only.
    const isFail = false;
    const isCantTell = false;

    if (isFail) {
      occurrencesFail.push({
        selector: buildSelector(el),
        html: getOuterHtmlSnippet(el),

        // Base strings (English fallbacks)
        summary: '<What failed (short)>',
        hint: '<How to fix (actionable)>',

        // i18n keys (recommended)
        i18n: {
          summaryKey: 'checks.' + rule.ruleId + '.occurrence.<case>.summary',
          hintKey: 'checks.' + rule.ruleId + '.occurrence.<case>.hint',
          params: {}
        }
      });
    } else if (isCantTell) {
      occurrencesCantTell.push({
        selector: buildSelector(el),
        html: getOuterHtmlSnippet(el),
        summary: '<Needs human review (short)>',
        hint: '<What to verify>',
        i18n: {
          summaryKey: 'checks.' + rule.ruleId + '.occurrence.<case>.summary',
          hintKey: 'checks.' + rule.ruleId + '.occurrence.<case>.hint',
          params: {}
        }
      });
    }
  }

  if (occurrencesFail.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'serious',
      occurrences: occurrencesFail,
      data: {
        fixes: ['<Common valid fix #1>', '<Common valid fix #2>'],
        usefulFor: ['<Who benefits / why it matters>'],
        notes: ['<Any important limitations or edge cases>']
      }
    };
  }

  if (occurrencesCantTell.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'serious',
      occurrences: occurrencesCantTell,
      data: {
        fixes: ['<What to check / adjust>'],
        usefulFor: ['<Who benefits / why it matters>'],
        notes: ['This condition requires manual verification; do not return fail.']
      }
    };
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'pass',
    severity: rule.defaultSeverity || 'minor',
    occurrences: [],
    data: { fixes: [], usefulFor: [], notes: [] }
  };
}

module.exports = { id, meta, runInPage };
