/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/*
 * Rule template.
 *
 * Copy this file to src/checks/automatic/<rule-id>.js (or
 * src/checks/manual/<rule-id>.js for a manual rule; a pack's rule goes in the
 * pack's own rules folder) and replace every <placeholder>. The id is bare
 * kebab-case: no engine prefix is added (RULE_AUTHORING.md section 3).
 *
 * runInPage(ctx) is serialized and run from its source text in the page, so
 * it reads nothing defined outside its own body: not `id`, not `meta`, not a
 * module-scope helper. Use ctx.rule, ctx.helpers and local variables
 * (RULE_AUTHORING.md section 1). Read the DOM through ctx.helpers.dom
 * (section 1.2), and report each element with helpers.reportOccurrence,
 * which fills in selector, html and structuralPath (section 4.3).
 *
 * Messages: add every key below and its English text to src/i18n/en.json
 * (a pack: its own i18n/en.json), then run `npm run i18n:sync`. Keys are
 *   <ruleName>_title, <ruleName>_description,
 *   <ruleName>_summary_<outcome>[_<case>], <ruleName>_hint_<outcome>[_<case>]
 * where <ruleName> is the id in lowerCamelCase (target-size-minimum ->
 * targetSizeMinimum), <outcome> is fail or cantTell, and <case> tells apart
 * several messages for one outcome. meta.title and meta.description must
 * match the English dictionary text. A param carries a value, never prose
 * (section 5.2). A lean adds <ruleName>_lean_why (and _lean_caution), with a
 * suffix per case (section 8.5).
 *
 * How to check: every reason code the header lists as cantTell has steps
 * in src/procedures (section 8.6), not in this module: the code is listed
 * under the facet it tests in src/procedures/registry.js, and each step and
 * result has a key in src/i18n/procedures/en.json and in every other locale
 * there:
 *   <ruleName>_review_<CODE>_step<n>, <ruleName>_review_<CODE>_pass, _fail
 * `npm run i18n:sync` doesn't cover src/i18n/procedures/: add each locale's
 * keys by hand, then run `npm run procedures`.
 *
 * Reason codes: list each one under @reason-codes, then run
 * `npm run finding-ids` so scripts/data/finding-ids.json has them
 * (section 10.1).
 *
 * Outcomes (RULE_AUTHORING.md section 8.3, RULE_TAXONOMY.md section 1.1):
 * - automatic: notApplicable, pass, fail, or cantTell where the rule cannot
 *   decide without a guess (section 8.4). Never fail on a guess.
 * - manual: notApplicable, cantTell, or pass when nothing found needs a
 *   person to judge. Never fail: a manual rule's findings all go in
 *   `questions` below, and its occurrences carry no uncertainty.
 *
 * Check the copy with `npx eslint <file>` and
 * `npm run build && node scripts/validate-rule.js <file>`.
 */

/**
 * @check <rule-id>
 * @atomic true
 * @summary <One sentence: the single requirement this rule checks>
 * @standard WCAG 2.2
 * @sc <1.1.1>
 * @applicability
 *   <Which elements the rule applies to, and which it leaves out. Published
 *   in docs/RULE_CATALOG.md: write it for someone reading a result.>
 * @expectation
 *   <What each applicable element must do to pass.>
 * @reason-codes
 *   - `<REASON_CODE>` (fail): <what the code means, in one sentence>.
 *     Basis: WCAG <1.1.1>; <technique, failure, ACT rule or spec section>.
 *   - `<REASON_CODE_CANTTELL>` (cantTell): <what is left for a person to
 *     judge>.
 *     Basis: WCAG <1.1.1> (not settled).
 */

const id = '<rule-id>';

const meta = {
  // English fallbacks; they must match the dictionary text of the keys below.
  title: '<Human-readable title>',
  description: '<What the rule checks>',
  i18n: {
    titleKey: '<ruleName>_title',
    descriptionKey: '<ruleName>_description'
  },
  helpUrl: null,
  // 'atomic', the type, the level tag and one tag per criterion in wcagSc
  // (scripts/validate-rule.js checks them), then topic tags.
  tags: ['wcag2a', 'wcag111', 'atomic', 'automatic', '<topic>'],
  wcagSc: ['1.1.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.1.1',
      title: 'Non-text Content',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable', // perceivable | operable | understandable | robust
  type: 'automatic', // automatic | manual
  defaultConfidence: 'high',
  // Facet ids come from src/coverage/wcag-facets.js: one that isn't marked
  // `macro`, which is for coverage only.
  coverage: { facetsBySc: { '1.1.1': ['<facet-id>'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // Confident findings (fail tier) and questions (cantTell tier).
  const occurrences = [];
  const questions = [];
  let applicableCount = 0;

  // queryAllSmart applies the scan's scope, shadow DOM, excludeSelectors and
  // hidden-content settings.
  const nodes = helpers.queryAllSmart('<css-selector>');

  for (const el of nodes) {
    if (!el) continue;
    // A rule about what assistive technology exposes keeps only elements
    // in the accessibility tree; see RULE_HELPERS.md section 2 for the others.
    if (!helpers.isIncludedInAccessibilityTree(el, ctx)) continue;
    applicableCount += 1;

    const tag = String(dom.localName(el) || '').toLowerCase();
    const value = String(dom.getAttribute(el, '<attribute>') || '').trim();

    // TODO: decide one requirement for this element.
    const fails = value === '';
    const cannotTell = false;
    if (!fails && !cannotTell) continue;

    let eligInfo = null;
    try {
      eligInfo = helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' });
    } catch {}
    const visibilityFilter = eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] };

    if (fails) {
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: '<What is wrong, in one sentence>',
          hint: '<How to fix it>',
          i18n: {
            summaryKey: '<ruleName>_summary_fail',
            hintKey: '<ruleName>_hint_fail',
            params: { element: tag }
          },
          data: {
            details: { reasonCode: '<REASON_CODE>' },
            visibilityFilter
          }
        })
      );
    } else {
      questions.push(
        helpers.reportOccurrence(el, {
          summary: '<What could not be told>',
          hint: '<What a person should check>',
          i18n: {
            summaryKey: '<ruleName>_summary_cantTell',
            hintKey: '<ruleName>_hint_cantTell',
            params: { element: tag }
          },
          // An automatic rule says why it could not decide, from the closed
          // set in docs/OUTPUT_SCHEMA.md#uncertainty-codes. A manual rule
          // leaves uncertainty out.
          uncertainty: {
            code: 'not-computable',
            needed: '<What would settle the question>'
          },
          // Only where facts on the page make one answer clearly more likely:
          // lean: { toward: 'fail', why: '<...>', signals: [{ signal: '<name>', value: true }],
          //         i18n: { whyKey: '<ruleName>_lean_why' } } (section 8.5).
          data: {
            details: { reasonCode: '<REASON_CODE_CANTTELL>' },
            visibilityFilter
          }
        })
      );
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  // fail with both tiers when anything failed, cantTell when there are only
  // questions, pass otherwise. Returning only the failures would drop the
  // questions (RULE_HELPERS.md section 6).
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(occurrences, questions, rule.defaultSeverity || 'minor')
  };
}

module.exports = { id, meta, runInPage };
