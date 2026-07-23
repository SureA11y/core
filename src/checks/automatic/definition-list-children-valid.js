'use strict';

/**
 * @check a11ycore-definition-list-children-valid
 * @atomic true
 * @summary <dl> must only contain <dt>/<dd> groups (optionally wrapped in one <div>), <script>, <template>, or <style>
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   Applies to <dl> elements that have at least one direct element child.
 * @expectation
 *   Every direct element child is <dt>, <dd>, <script>, <template>, <style>,
 *   or a <div> whose own children are drawn from that same set (a single
 *   level of wrapping div is allowed, matching how authors commonly group
 *   dt/dd pairs). If the flattened set contains any <dt> or <dd> at all, it
 *   must contain BOTH (an unbalanced dt-without-dd or dd-without-dt is
 *   invalid) — a flattened set with neither is vacuously fine, not a
 *   violation (see implementation-notes). Any other direct or wrapped child
 *   breaks the description-list semantics assistive technologies rely on.
 * @implementation-notes
 * - Only one level of <div> wrapping is flattened, matching the reference engine's
 *   definition-list algorithm — a <div> nested inside another wrapping
 *   <div> is not flattened further and its contents are reported invalid.
 * - Verified against the reference engine 4.12.1 (2026-07-20): the dt/dd pairing is
 *   only required "when not empty". A flattened set with NEITHER dt nor dd
 *   — whether from an empty wrapping <div>, only <script>/<template>/
 *   <style> content, or a genuinely childless <dl> — is not flagged; only
 *   an unbalanced dt/dd pairing is a real structural problem.
 * - Distinct, atomic decision from a11ycore-dlitem-parent-valid (the
 *   inverse relationship: does a given <dt>/<dd> have a valid parent).
 */

const id = 'a11ycore-definition-list-children-valid';

const meta = {
  title: 'Description lists must be structured correctly',
  description: 'Checks that <dl> elements only directly contain <dt>/<dd> groups (optionally wrapped in one <div>), <script>, <template>, or <style>.',
  i18n: {
    titleKey: 'a11ycore_definitionListChildrenValid_title',
    descriptionKey: 'a11ycore_definitionListChildrenValid_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'structure', 'atomic', 'automatic', 'list'],
  wcagSc: ['1.3.1'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '1.3.1', title: 'Info and Relationships', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.3.1': ['definition-list-children-valid'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  // Declared inside runInPage — see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const PASSTHROUGH_TAGS = new Set(['dt', 'dd', 'script', 'template', 'style']);

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('dl', safeRoot) : helpers.queryAll('dl', safeRoot);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.children) continue;
    if (!el.children.length) continue;

    applicableCount += 1;

    // Flatten one level of wrapping <div> (common dt/dd grouping pattern).
    const flattened = [];
    for (const child of el.children) {
      if (!child || !child.tagName) continue;
      if (child.tagName.toLowerCase() === 'div') {
        for (const grandchild of child.children || []) {
          if (grandchild && grandchild.tagName) flattened.push(grandchild);
        }
      } else {
        flattened.push(child);
      }
    }

    let hasDt = false;
    let hasDd = false;
    const invalidTags = [];
    for (const node of flattened) {
      const tag = node.tagName.toLowerCase();
      if (tag === 'dt') { hasDt = true; continue; }
      if (tag === 'dd') { hasDd = true; continue; }
      if (!PASSTHROUGH_TAGS.has(tag)) invalidTags.push(tag);
    }

    // Verified against the reference engine 4.12.1's definition-list check (2026-07-20):
    // the dt/dd pairing is only required "when not empty" — a <dl> with
    // NEITHER dt nor dd (whether genuinely childless after flattening, only
    // passthrough script/template/style content, or an empty wrapping div)
    // is vacuously fine, not a violation. Only an UNBALANCED pairing (dt
    // present without any dd, or vice versa) is a real structural problem.
    const reasonCode = invalidTags.length
        ? 'DL_INVALID_CHILD'
        : ((hasDt || hasDd) && !(hasDt && hasDd) ? 'DL_NO_DT_DD' : null);
    if (!reasonCode) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    const summary = invalidTags.length
        ? 'This description list contains a direct or wrapped child that is not part of a dt/dd group.'
        : 'This description list has no <dt>/<dd> term-definition group.';
    const hint = invalidTags.length
        ? 'Only use <dt>/<dd> (optionally wrapped in one <div>), <script>, <template>, or <style> inside <dl>.'
        : 'Add at least one <dt>/<dd> pair inside this <dl>.';

    occurrences.push({
      selector: stableSelector,
      html,
      summary,
      hint,
      i18n: {
        summaryKey: invalidTags.length
            ? 'a11ycore_definitionListChildrenValid_summary_fail_invalidChild'
            : 'a11ycore_definitionListChildrenValid_summary_fail_noDtDd',
        hintKey: invalidTags.length
            ? 'a11ycore_definitionListChildrenValid_hint_fail_invalidChild'
            : 'a11ycore_definitionListChildrenValid_hint_fail_noDtDd',
        params: { invalidChildren: invalidTags.join(', ') }
      },
      data: {
        details: { reasonCode, invalidChildren: invalidTags }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'serious', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };