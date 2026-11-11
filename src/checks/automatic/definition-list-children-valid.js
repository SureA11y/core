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
 *   flattened set with neither (an empty list, or one holding only
 *   <script>, <template> or <style>) is not a violation: the pairing is
 *   required only of a list that has items. Any other direct or wrapped
 *   child breaks the description-list semantics assistive technologies rely
 *   on.
 *   Every finding is reported at CANTTELL, not FAIL. HTML-AAM gives <dt> and
 *   <dd> their term and definition roles wherever they sit, so what a broken
 *   content model loses is the pairing of terms with definitions, which only
 *   the <dl>'s structure and order state. That is a WCAG failure (SC 1.3.1)
 *   only where the page shows the pairing, and H40 is only a sufficient
 *   technique: a person settles it.
 * @reports
 *   - `invalidChildren`: the children that do not belong in the list, one
 *     tag name per child (`#text` for text placed directly inside). Empty
 *     when the problem is a missing or misordered `<dt>`/`<dd>`.
 * @reason-codes
 *   - `DL_INVALID_CHILD` (cantTell): the list holds an element, or text,
 *     that is not a dt/dd group, a single wrapping div, script, template or style.
 *     Basis: H40; HTML dl element content model (MUST); WCAG 1.3.1 (not
 *     settled).
 *   - `DL_NO_DT_DD` (cantTell): the list has terms with no definition, or
 *     definitions with no term.
 *     Basis: H40; HTML dl element content model (MUST); WCAG 1.3.1 (not
 *     settled).
 *   - `DL_DT_DD_ORDER` (cantTell): a definition comes before the first
 *     term, or the last term has no definition after it.
 *     Basis: H40; HTML dl element content model (MUST); WCAG 1.3.1 (not
 *     settled).
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
 * - Children are read in the flat tree, as the list rules read them: a
 *   <slot> stands for the nodes assigned to it, or its fallback content
 *   when none is, so a shadow <dl><slot></slot></dl> holds the dt/dd its
 *   host slots in. A custom element between the <dl> and its items is a
 *   child of the <dl> like any other.
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
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // Declared inside runInPage, see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const PASSTHROUGH_TAGS = new Set(['dt', 'dd', 'script', 'template', 'style']);

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('dl') : helpers.queryAll('dl');

  const occurrences = [];
  let applicableCount = 0;

  // Children in the flat tree, as the page renders them: a <slot> stands
  // for the nodes assigned to it (a shadow <dl><slot></slot></dl> holds the
  // host's <dt> and <dd> children), or for its fallback content when none
  // is (helpers.flatChildNodes).
  function childNodesOf(el) {
    return el ? helpers.flatChildNodes(el) : [];
  }

  function childElementsOf(el) {
    return childNodesOf(el).filter((n) => dom.nodeType(n) === 1);
  }

  // Non-whitespace text directly inside `parent` (the <dl> or a wrapping
  // <div>), in the flat tree.
  function hasDirectText(parent) {
    return childNodesOf(parent).some(
      (node) => dom.nodeType(node) === 3 && /\S/.test(dom.nodeValue(node) || '')
    );
  }

  for (const el of nodes) {
    if (!el || dom.nodeType(el) !== 1) continue;
    const dlHasText = hasDirectText(el);
    if (!childElementsOf(el).length && !dlHasText) continue;

    applicableCount += 1;

    // Flatten one level of wrapping <div> (common dt/dd grouping pattern).
    const flattened = [];
    let hasText = dlHasText;
    // <div>s inside a wrapping <div>: one level of wrapper too many.
    const nestedDivs = new Set();
    for (const child of childElementsOf(el)) {
      if (!child || !dom.tagName(child)) continue;
      if (dom.tagName(child).toLowerCase() === 'div') {
        if (hasDirectText(child)) hasText = true;
        for (const grandchild of childElementsOf(child)) {
          if (!grandchild || !dom.tagName(grandchild)) continue;
          flattened.push(grandchild);
          if (dom.tagName(grandchild).toLowerCase() === 'div') nestedDivs.add(grandchild);
        }
      } else {
        flattened.push(child);
      }
    }

    let hasDt = false;
    let hasDd = false;
    let dtCount = 0;
    let ddCount = 0;
    let lastDt = null;
    let invalidNotNested = 0;
    const invalidTags = [];
    // The dt/dd sequence in document order, for the group-order check.
    const sequence = [];
    for (const node of flattened) {
      const tag = dom.tagName(node).toLowerCase();
      if (tag === 'dt') {
        hasDt = true;
        dtCount += 1;
        lastDt = node;
        sequence.push(tag);
        continue;
      }
      if (tag === 'dd') {
        hasDd = true;
        ddCount += 1;
        sequence.push(tag);
        continue;
      }
      if (!PASSTHROUGH_TAGS.has(tag)) {
        invalidTags.push(tag);
        if (!nestedDivs.has(node)) invalidNotNested += 1;
      }
    }
    if (hasText) {
      invalidTags.push('#text');
      invalidNotNested += 1;
    }
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

    // Which form of the finding the summary takes: a <div> nested in the
    // wrapping <div> and nothing else wrong; which of dt and dd is missing;
    // which end of the order is wrong.
    let variant = '';
    let lastTerm = '';
    if (reasonCode === 'DL_INVALID_CHILD' && invalidNotNested === 0) variant = 'nestedDiv';
    else if (reasonCode === 'DL_NO_DT_DD') variant = hasDt ? 'noDd' : 'noDt';
    else if (reasonCode === 'DL_DT_DD_ORDER') {
      if (sequence[0] !== 'dt') variant = 'orderStart';
      else {
        variant = 'orderEnd';
        const t = String((lastDt && dom.textContent(lastDt)) || '')
          .replace(/\s+/g, ' ')
          .trim();
        lastTerm = t.length > 40 ? t.slice(0, 39) + '…' : t;
      }
    }
    const VARIANT = {
      nestedDiv: {
        summary:
          'A <div> inside the wrapping <div> holds items of this description list; only one level of <div> may sit between <dl> and its <dt>/<dd>.',
        hint: 'Remove the inner <div>, so each group is wrapped in at most one <div> directly inside the <dl>.',
        key: 'invalidChild_nestedDiv',
        hintSuffix: 'invalidChild_nestedDiv'
      },
      noDd: {
        summary: `This description list has terms (<dt>, ${dtCount}) but no definition (<dd>).`,
        key: 'noDd'
      },
      noDt: {
        summary: `This description list has definitions (<dd>, ${ddCount}) but no term (<dt>).`,
        key: 'noDt'
      },
      orderStart: {
        summary: "This description list's first item is a <dd>, with no <dt> term before it.",
        key: 'order_start'
      },
      orderEnd: {
        summary: `In this description list, the last <dt>${lastTerm ? ` ("${lastTerm}")` : ''} has no <dd> after it.`,
        key: 'order_end'
      }
    }[variant];

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
        summary: VARIANT ? VARIANT.summary : TEXT.summary,
        hint: VARIANT && VARIANT.hint ? VARIANT.hint : TEXT.hint,
        uncertainty: {
          code: 'spec-only',
          needed:
            'Whether the page shows terms paired with their definitions in a way this markup does not state.',
          evidence: { reasonCode, invalidChildren: invalidTags }
        },
        i18n: {
          summaryKey: `definitionListChildrenValid_summary_fail_${VARIANT ? VARIANT.key : TEXT.key}`,
          hintKey: `definitionListChildrenValid_hint_fail_${VARIANT && VARIANT.hintSuffix ? VARIANT.hintSuffix : TEXT.key}`,
          params: {
            invalidChildren: dedupedInvalidTags.join(', '),
            dtCount: String(dtCount),
            ddCount: String(ddCount),
            lastTerm
          }
        },
        data: {
          details: {
            reasonCode,
            invalidChildren: invalidTags,
            ...(variant ? { finding: variant, dtCount, ddCount } : {})
          }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  // Every finding is a question: the term and definition roles survive,
  // and whether the pairing the markup breaks is one the page shows is for
  // a person to say (see @expectation).
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome([], occurrences, rule.defaultSeverity || 'serious')
  };
}

module.exports = { id, meta, runInPage };
