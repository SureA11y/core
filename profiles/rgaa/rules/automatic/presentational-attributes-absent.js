/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check presentational-attributes-absent
 * @atomic true
 * @summary Presentational HTML attributes must not be used
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to any scan scope; whether an HTML element in it carries one of
 *   the attributes RGAA 10.1.2 lists is always an answerable question.
 * @expectation
 *   No HTML element carries align, alink, background, basefont, bgcolor, border,
 *   cellpadding, cellspacing, char, charoff, clear, color, compact,
 *   frameborder, hspace, link, marginheight, marginwidth, text, valign,
 *   vlink or vspace; size is allowed only on <select>, and width and height
 *   only on <img>, <object>, <embed>, <canvas> and <svg>. That is RGAA
 *   10.1.2's list as written, so width and height on an <iframe> or a
 *   <video>, and size on an <input>, are reported too. One occurrence per
 *   element, naming every such attribute it carries.
 * @implementation-notes
 * - Opt-in (tag `rgaa`): WCAG does not forbid these attributes, so the rule
 *   runs only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 * - Only elements in the HTML namespace are checked: inside SVG and MathML,
 *   attributes such as width, height and color are the content's geometry
 *   and paint, not HTML presentation.
 * - Hidden content is checked too (helpers.queryAllSource): 10.1.2 judges
 *   the generated source, and markup inside `hidden` or display:none is part
 *   of it. includeHiddenElements makes no difference here. <template>
 *   content is not in the DOM tree and is not checked.
 */

const id = 'presentational-attributes-absent';

const meta = {
  title: 'Page uses no presentational attributes',
  description:
    'Checks that no HTML element carries one of the presentational attributes RGAA lists, such as align, bgcolor or border.',
  i18n: {
    titleKey: 'presentationalAttributesAbsent_title',
    descriptionKey: 'presentationalAttributesAbsent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const HTML_NS = 'http://www.w3.org/1999/xhtml';
  const ALWAYS = [
    'align',
    'alink',
    'background',
    'basefont',
    'bgcolor',
    'border',
    'cellpadding',
    'cellspacing',
    'char',
    'charoff',
    'clear',
    'color',
    'compact',
    'frameborder',
    'hspace',
    'link',
    'marginheight',
    'marginwidth',
    'text',
    'valign',
    'vlink',
    'vspace'
  ];
  const SIZE_ALLOWED_ON = ['select'];
  const DIMENSIONS_ALLOWED_ON = ['img', 'object', 'embed', 'canvas', 'svg'];

  const selector = ALWAYS.concat(['size', 'width', 'height'])
    .map((a) => '[' + a + ']')
    .join(', ');
  const nodes = helpers.queryAllSource
    ? helpers.queryAllSource(selector)
    : helpers.queryAll(selector);

  const occurrences = [];
  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute') || !dom.tagName(el)) continue;
    if (dom.namespaceURI(el) && dom.namespaceURI(el) !== HTML_NS) continue;

    const element = String(dom.tagName(el)).toLowerCase();
    const found = ALWAYS.filter((a) => dom.hasAttribute(el, a));
    if (dom.hasAttribute(el, 'size') && !SIZE_ALLOWED_ON.includes(element)) found.push('size');
    if (!DIMENSIONS_ALLOWED_ON.includes(element)) {
      if (dom.hasAttribute(el, 'width')) found.push('width');
      if (dom.hasAttribute(el, 'height')) found.push('height');
    }
    if (!found.length) continue;

    const attributes = found.join(', ');
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `<${element}> carries presentational attributes: ${attributes}.`,
        hint: 'Remove them and set the presentation in CSS instead.',
        i18n: {
          summaryKey: 'presentationalAttributesAbsent_summary_fail',
          hintKey: 'presentationalAttributesAbsent_hint_fail',
          params: { element, attributes }
        },
        data: {
          details: { reasonCode: 'presentationalAttribute', element, attributes: found },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
