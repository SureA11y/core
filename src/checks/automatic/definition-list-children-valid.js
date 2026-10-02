/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check definition-list-children-valid
 * @atomic true
 * @summary <dl> must only contain <dt>/<dd> groups (optionally wrapped in one <div>), <script>, <template>, or <style>
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   Applies to <dl> elements that have at least one direct element child or
 *   non-whitespace text directly inside them.
 * @expectation
 *   Every direct element child is <dt>, <dd>, <script>, <template>, <style>,
 *   or a <div> whose own children are drawn from that same set (a single
 *   level of wrapping div is allowed, matching how authors commonly group
 *   dt/dd pairs). Non-whitespace text directly inside the <dl> or a wrapping
 *   <div> is an invalid child too. If the flattened set contains any <dt> or
 *   <dd> at all, it must contain BOTH (an unbalanced dt-without-dd or
 *   dd-without-dt is invalid), and read in order it must be groups of one
 *   or more <dt> followed by one or more <dd>: a <dd> before the first <dt>
 *   has no term, and a <dt> after the last <dd> has no definition. A
 *   flattened set with neither is vacuously fine, not a violation (see
 *   implementation-notes). Any other direct or wrapped child breaks the
 *   description-list semantics assistive technologies rely on.
 * @implementation-notes
 * - Only one level of <div> wrapping is flattened, a <div> nested inside
 *   another wrapping <div> is not flattened further and its contents are
 *   reported invalid.
 * - The dt/dd pairing is only required "when not empty". A flattened set
 *   with NEITHER dt nor dd, whether from an empty wrapping <div>, only
 *   <script>/<template>/<style> content, or a childless <dl>, is not flagged; only
 *   an unbalanced dt/dd pairing is a real structural problem.
 * - The order check reads the flattened dt/dd sequence across wrapping
 *   <div> boundaries, so a term and its definition split into two sibling
 *   <div>s still pass: assistive technologies get the same terms and
 *   definitions. The stricter HTML content model (each <div> holds a whole
 *   group) is not checked here.
 * - Distinct, atomic decision from dlitem-parent-valid (the
 *   inverse relationship: does a given <dt>/<dd> have a valid parent).
 */

const id = 'definition-list-children-valid';

const meta = {
  title: 'Description lists must be structured correctly',
  description:
    'Checks that <dl> elements only directly contain <dt>/<dd> groups (optionally wrapped in one <div>), <script>, <template>, or <style>.',
  i18n: {
    titleKey: 'definitionListChildrenValid_title',
    descriptionKey: 'definitionListChildrenValid_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'structure', 'atomic', 'automatic', 'list'],
  wcagSc: ['1.3.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.3.1',
      title: 'Info and Relationships',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.3.1': ['definition-list-children-valid'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  // Declared inside runInPage, see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const PASSTHROUGH_TAGS = new Set(['dt', 'dd', 'script', 'template', 'style']);

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('dl') : helpers.queryAll('dl');

  const occurrences = [];
  let applicableCount = 0;

  // Non-whitespace text directly inside `parent` (the <dl> or a wrapping
  // <div>).
  function hasDirectText(parent) {
    for (const node of parent.childNodes || []) {
      if (node && node.nodeType === 3 && /\S/.test(node.nodeValue || '')) return true;
    }
    return false;
  }

  for (const el of nodes) {
    if (!el || !el.children) continue;
    const dlHasText = hasDirectText(el);
    if (!el.children.length && !dlHasText) continue;

    applicableCount += 1;

    // Flatten one level of wrapping <div> (common dt/dd grouping pattern).
    const flattened = [];
    let hasText = dlHasText;
    for (const child of el.children) {
      if (!child || !child.tagName) continue;
      if (child.tagName.toLowerCase() === 'div') {
        if (hasDirectText(child)) hasText = true;
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
    // The dt/dd sequence in document order, for the group-order check.
    const sequence = [];
    for (const node of flattened) {
      const tag = node.tagName.toLowerCase();
      if (tag === 'dt') {
        hasDt = true;
        sequence.push(tag);
        continue;
      }
      if (tag === 'dd') {
        hasDd = true;
        sequence.push(tag);
        continue;
      }
      if (!PASSTHROUGH_TAGS.has(tag)) invalidTags.push(tag);
    }
    if (hasText) invalidTags.push('#text');
    const dedupedInvalidTags = [...new Set(invalidTags)];

    // Groups of one or more dt then one or more dd: the sequence starts
    // with a dt and ends with a dd.
    const badOrder =
      hasDt && hasDd && (sequence[0] !== 'dt' || sequence[sequence.length - 1] !== 'dd');

    // The dt/dd pairing is only required "when not empty", a <dl> with
    // NEITHER dt nor dd (whether childless after flattening, only
    // passthrough script/template/style content, or an empty wrapping div)
    // is vacuously fine, not a violation. Only an UNBALANCED pairing (dt
    // present without any dd, or vice versa) or a misordered one is a
    // real structural problem.
    const reasonCode = invalidTags.length
      ? 'DL_INVALID_CHILD'
      : (hasDt || hasDd) && !(hasDt && hasDd)
        ? 'DL_NO_DT_DD'
        : badOrder
          ? 'DL_DT_DD_ORDER'
          : null;
    if (!reasonCode) continue;

    const TEXT = {
      DL_INVALID_CHILD: {
        summary:
          'This description list contains a direct or wrapped child that is not part of a dt/dd group.',
        hint: 'Only use <dt>/<dd> (optionally wrapped in one <div>), <script>, <template>, or <style> inside <dl>.',
        key: 'invalidChild'
      },
      DL_NO_DT_DD: {
        summary: 'This description list has no <dt>/<dd> term-definition group.',
        hint: 'Add at least one <dt>/<dd> pair inside this <dl>.',
        key: 'noDtDd'
      },
      DL_DT_DD_ORDER: {
        summary:
          'In this description list, a <dd> comes before any <dt>, or the last <dt> has no <dd> after it.',
        hint: 'Order each group as one or more <dt> followed by one or more <dd>.',
        key: 'order'
      }
    }[reasonCode];

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: TEXT.summary,
        hint: TEXT.hint,
        i18n: {
          summaryKey: `definitionListChildrenValid_summary_fail_${TEXT.key}`,
          hintKey: `definitionListChildrenValid_hint_fail_${TEXT.key}`,
          params: { invalidChildren: dedupedInvalidTags.join(', ') }
        },
        data: {
          details: { reasonCode, invalidChildren: invalidTags }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
