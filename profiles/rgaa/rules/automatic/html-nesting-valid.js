/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check html-nesting-valid
 * @atomic true
 * @summary Lists, description lists, links, buttons and <main> must follow HTML's nesting rules
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every ul, ol, menu, li, dl, dt, dd, a, button, img[ismap]
 *   and main element in the scan scope, hidden or not: RGAA 8.2.1 judges
 *   the generated source, which the W3C validator reads whole
 *   (helpers.queryAllSource). Elements in SVG or MathML are not HTML
 *   elements and are left out. A page with none of them is notApplicable.
 *   The checks follow the HTML nesting rules; a page whose doctype is
 *   neither HTML5 nor missing is asked about instead (see below).
 * @expectation
 *   « L'imbrication des balises est conforme » (RGAA 8.2.1). Each case
 *   below is an error of the W3C validator (Nu checker 26.9.27, the version
 *   the expected outcomes were checked against), and fails:
 *   - listChild / listText: a child element of ul, ol or menu other than
 *     li, script or template, or text directly inside the list;
 *   - listItemParent: an li whose parent is not ul, ol or menu, whatever
 *     role the parent has;
 *   - dlChild / dlText / dlGroupOrder / dlMixedGroups / dlItemParent: the
 *     dl content model. A dl holds groups of one or more dt followed by one
 *     or more dd, or div elements that each hold one such group (script
 *     and template are allowed anywhere); no other element and no text. A
 *     dt or dd must sit in a dl, or in a div child of a dl;
 *   - interactiveDescendant / tabindexDescendant: interactive content (a,
 *     button, details, embed, iframe, label, select, textarea, input other
 *     than type=hidden, img[usemap], audio or video with controls) or an
 *     element with a tabindex attribute inside an a or a button. The rule
 *     applies to every a, with or without href, and counts a disabled
 *     control or a hidden descendant too, as the validator does;
 *   - ismapOutsideLink: an img with ismap and no a[href] ancestor;
 *   - extraMain: more than one main element in the document without its
 *     own hidden attribute. A main hidden by CSS, aria-hidden or a hidden
 *     ancestor still counts.
 * @implementation-notes
 * - The WCAG rules on lists and nesting (list-children-valid,
 *   listitem-parent-valid, definition-list-children-valid,
 *   dlitem-parent-valid, nested-interactive-controls-absent) judge what
 *   assistive technologies are given: they accept role overrides, skip
 *   hidden content, and fail nesting that uses only ARIA roles. RGAA 8.2.1
 *   follows the validator, which judges the markup, so this rule reports
 *   8.2.1 in their place. Nesting that uses only ARIA roles
 *   (div role=button around a link) is only a validator warning and is not
 *   reported here.
 * - RGAA 8.2.1 judges the source "selon le type de document spécifié". The
 *   nesting rules differ before HTML5 (a dl could hold dt and dd in any
 *   order, a button could sit inside a link, main did not exist), so on a
 *   page whose doctype is neither HTML5 nor missing the rule asks once
 *   (otherDoctype) instead of applying the HTML5 rules. A page with no
 *   doctype is checked as HTML5, as the validator does.
 * - Custom elements' shadow trees are checked when shadow DOM is included,
 *   but a slot element directly inside a list is not reported, and only
 *   main elements of the document itself are counted.
 * - The parser repairs most misnesting written in the source (an a inside
 *   an a, a p around a div), so a clean result here does not mean the
 *   source passes 8.2.1.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'html-nesting-valid';

const meta = {
  title: 'HTML elements are nested as HTML allows',
  description:
    'Checks, hidden content included, that lists, description lists, links, buttons, server-side image maps and <main> elements are nested as the HTML standard and the W3C validator require.',
  i18n: {
    titleKey: 'htmlNestingValid_title',
    descriptionKey: 'htmlNestingValid_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  // Reason codes built at runtime, which scripts/generate-finding-ids.js
  // can't read from the source.
  reasonCodes: ['dlText', 'listText', 'otherDoctype']
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const HTML_NS = 'http://www.w3.org/1999/xhtml';
  const query = (sel) =>
    (helpers.queryAllSource ? helpers.queryAllSource(sel) : helpers.queryAll(sel)).filter(
      (el) => el && dom.namespaceURI(el) === HTML_NS
    );
  const tagOf = (el) => String(dom.localName(el) || '').toLowerCase();
  const isHtml = (el) => !!el && dom.nodeType(el) === 1 && dom.namespaceURI(el) === HTML_NS;
  const parentElementOf = (el) => {
    const p = dom.parentNode(el);
    return p && dom.nodeType(p) === 1 ? p : null;
  };
  const hasText = (el) =>
    Array.from(dom.childNodes(el) || []).some(
      (n) => dom.nodeType(n) === 3 && /\S/.test(dom.nodeValue(n) || '')
    );

  const TEXTS = {
    listChild: [
      (p) =>
        `This <${p.element}> is a direct child of a <${p.parent}>, which may only hold <li>, <script> and <template>.`,
      'Wrap the content in an <li>, or move it out of the list.'
    ],
    listText: [
      (p) => `This <${p.element}> has text directly inside it, outside any <li>.`,
      'Put the text in an <li>, or move it out of the list.'
    ],
    listItemParent: [
      (p) => `This <li> is inside a <${p.parent}>, not a <ul>, <ol> or <menu>.`,
      'Put list items in a <ul>, <ol> or <menu>. A role on the parent does not make it a list for HTML.'
    ],
    dlChild: [
      (p) =>
        `This <${p.element}> is not allowed directly inside this description list’s <${p.parent}>.`,
      'A <dl> may only hold <dt>, <dd>, <div> groups, <script> and <template>; a <div> group only <dt>, <dd>, <script> and <template>.'
    ],
    dlText: [
      (p) => `This <${p.element}> of a description list has text directly inside it.`,
      'Put the text in a <dt> or <dd>.'
    ],
    dlGroupOrder: [
      (p) =>
        `The <dt> and <dd> elements in this <${p.element}> are not groups of one or more <dt> followed by one or more <dd>.`,
      'Start each group with its <dt> terms and end it with their <dd> descriptions. A <div> group holds exactly one such group.'
    ],
    dlMixedGroups: [
      () => 'This <dl> mixes <div> groups with <dt> or <dd> elements placed directly inside it.',
      'Either wrap every group in a <div>, or none of them.'
    ],
    dlItemParent: [
      (p) =>
        `This <${p.element}> is inside a <${p.parent}>, not a <dl> or a <div> child of a <dl>.`,
      'Put <dt> and <dd> elements in a <dl>.'
    ],
    interactiveDescendant: [
      (p) => `This <${p.element}> is interactive content nested in <${p.ancestor}>.`,
      'Move the control out of the link or button. HTML does not allow interactive content inside <a> or <button>, even when disabled or hidden.'
    ],
    tabindexDescendant: [
      (p) => `This <${p.element}> has a tabindex attribute and is nested in <${p.ancestor}>.`,
      'Remove the tabindex attribute, or move the element out of the link or button.'
    ],
    ismapOutsideLink: [
      () => 'This <img> has the ismap attribute but no <a href> ancestor.',
      'Remove the ismap attribute, or put the image in a link with an href.'
    ],
    extraMain: [
      () => 'This <main> element is not the first one on the page without the hidden attribute.',
      'Keep one <main> element without the hidden attribute. CSS, aria-hidden or a hidden ancestor does not count.'
    ],
    otherDoctype: [
      () =>
        'The page declares a doctype other than HTML5, so HTML5 nesting rules may not apply to it.',
      'Run the W3C validator on the generated source and check the nesting against the declared doctype.'
    ]
  };

  const occurrences = [];
  function report(el, reasonCode, params, outcome) {
    const key = outcome === 'cantTell' ? 'cantTell' : 'fail';
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: TEXTS[reasonCode][0](params || {}),
        hint: TEXTS[reasonCode][1],
        i18n: {
          summaryKey: `htmlNestingValid_summary_${key}_${reasonCode}`,
          hintKey: `htmlNestingValid_hint_${key}_${reasonCode}`,
          params: params || {}
        },
        uncertainty:
          outcome === 'cantTell'
            ? {
                code: 'out-of-scope',
                needed: 'Whether the nesting is valid for the declared doctype.'
              }
            : undefined,
        data: {
          details: { reasonCode, ...(params || {}) },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  function result(outcome) {
    return {
      ruleId: rule.ruleId,
      outcome,
      severity: outcome === 'pass' || outcome === 'notApplicable' ? 'minor' : rule.defaultSeverity,
      occurrences: outcome === 'pass' || outcome === 'notApplicable' ? [] : occurrences
    };
  }

  const lists = query('ul, ol, menu');
  const items = query('li');
  const dls = query('dl');
  const dlItems = query('dt, dd');
  const containers = query('a, button');
  const ismaps = query('img[ismap]');
  const mains = query('main');

  const applicable =
    lists.length +
    items.length +
    dls.length +
    dlItems.length +
    containers.length +
    ismaps.length +
    mains.length;
  if (!applicable) return result('notApplicable');

  const doctype = helpers.getDoctypeInfo ? helpers.getDoctypeInfo() : { kind: 'html5' };
  if (doctype.kind !== 'html5' && doctype.kind !== 'none') {
    report(dom.documentElement(document), 'otherDoctype', {}, 'cantTell');
    return result('cantTell');
  }

  const SCRIPT_SUPPORTING = new Set(['script', 'template']);

  // ul, ol, menu: li, script and template children only.
  for (const list of lists) {
    const parent = tagOf(list);
    for (const child of Array.from(dom.querySelectorAll(list, ':scope > *'))) {
      const tag = tagOf(child);
      if (!isHtml(child)) {
        report(child, 'listChild', { element: tag, parent });
        continue;
      }
      if (tag === 'li' || SCRIPT_SUPPORTING.has(tag) || tag === 'slot') continue;
      report(child, 'listChild', { element: tag, parent });
    }
    if (hasText(list)) report(list, 'listText', { element: parent });
  }

  // li: parent must be ul, ol or menu. An li at the top of a shadow tree has
  // no parent element, and the validator never sees it.
  for (const li of items) {
    const p = parentElementOf(li);
    if (!p) continue;
    const ptag = tagOf(p);
    if (isHtml(p) && (ptag === 'ul' || ptag === 'ol' || ptag === 'menu')) continue;
    report(li, 'listItemParent', { parent: ptag });
  }

  // dl content model.
  // Checks one run of dt/dd children: one or more dt, then one or more dd,
  // repeated (`single`: exactly one group, as in a div).
  function groupsValid(tags, single) {
    const seq = tags.map((t) => (t === 'dt' ? 't' : 'd')).join('');
    if (!seq) return !single;
    return single ? /^t+d+$/.test(seq) : /^(t+d+)+$/.test(seq);
  }

  for (const dl of dls) {
    const kids = Array.from(dom.querySelectorAll(dl, ':scope > *')).filter(
      (c) => !(isHtml(c) && SCRIPT_SUPPORTING.has(tagOf(c)))
    );
    if (hasText(dl)) report(dl, 'dlText', { element: 'dl' });
    const dtdd = [];
    const divs = [];
    for (const c of kids) {
      const tag = tagOf(c);
      if (isHtml(c) && (tag === 'dt' || tag === 'dd')) dtdd.push(c);
      else if (isHtml(c) && tag === 'div') divs.push(c);
      else report(c, 'dlChild', { element: tag, parent: 'dl' });
    }
    if (dtdd.length && divs.length) {
      report(dl, 'dlMixedGroups', {});
      continue;
    }
    if (dtdd.length) {
      if (!groupsValid(dtdd.map(tagOf), false)) report(dl, 'dlGroupOrder', { element: 'dl' });
      continue;
    }
    for (const div of divs) {
      if (hasText(div)) report(div, 'dlText', { element: 'div' });
      const groupTags = [];
      for (const c of Array.from(dom.querySelectorAll(div, ':scope > *'))) {
        const tag = tagOf(c);
        if (isHtml(c) && SCRIPT_SUPPORTING.has(tag)) continue;
        if (isHtml(c) && (tag === 'dt' || tag === 'dd')) groupTags.push(tag);
        else report(c, 'dlChild', { element: tag, parent: 'div' });
      }
      if (!groupsValid(groupTags, true)) report(div, 'dlGroupOrder', { element: 'div' });
    }
  }

  // dt, dd: in a dl, or in a div child of a dl.
  for (const item of dlItems) {
    const p = parentElementOf(item);
    if (!p) continue;
    const ptag = tagOf(p);
    if (isHtml(p) && ptag === 'dl') continue;
    if (isHtml(p) && ptag === 'div') {
      const gp = parentElementOf(p);
      if (gp && isHtml(gp) && tagOf(gp) === 'dl') continue;
    }
    report(item, 'dlItemParent', { element: tagOf(item), parent: ptag });
  }

  // Interactive content, or tabindex, inside a or button. Each descendant is
  // reported once, against its nearest a or button ancestor in the same tree.
  function isInteractive(el) {
    const tag = tagOf(el);
    switch (tag) {
      case 'a':
      case 'button':
      case 'details':
      case 'embed':
      case 'iframe':
      case 'label':
      case 'select':
      case 'textarea':
        return true;
      case 'input':
        return String(dom.getAttribute(el, 'type') || '').toLowerCase() !== 'hidden';
      case 'img':
        return dom.hasAttribute(el, 'usemap');
      case 'audio':
      case 'video':
        return dom.hasAttribute(el, 'controls');
      default:
        return false;
    }
  }
  const seen = new Set();
  for (const container of containers) {
    for (const d of Array.from(dom.querySelectorAll(container, '*'))) {
      if (!isHtml(d) || seen.has(d)) continue;
      const interactive = isInteractive(d);
      const tabindex = dom.hasAttribute(d, 'tabindex');
      if (!interactive && !tabindex) continue;
      let anc = parentElementOf(d);
      while (anc && !(isHtml(anc) && (tagOf(anc) === 'a' || tagOf(anc) === 'button'))) {
        anc = parentElementOf(anc);
      }
      if (!anc) continue;
      seen.add(d);
      report(d, interactive ? 'interactiveDescendant' : 'tabindexDescendant', {
        element: tagOf(d),
        ancestor: tagOf(anc)
      });
    }
  }

  // img[ismap]: needs an a[href] ancestor.
  for (const img of ismaps) {
    let anc = parentElementOf(img);
    while (anc && !(isHtml(anc) && tagOf(anc) === 'a' && dom.hasAttribute(anc, 'href'))) {
      anc = parentElementOf(anc);
    }
    if (!anc) report(img, 'ismapOutsideLink', {});
  }

  // main: at most one in the document without its own hidden attribute.
  const shownMains = mains.filter(
    (el) =>
      !dom.hasAttribute(el, 'hidden') &&
      (dom.get(el, 'getRootNode') ? dom.getRootNode(el) === document : true)
  );
  for (const el of shownMains.slice(1)) report(el, 'extraMain', {});

  return result(occurrences.length ? 'fail' : 'pass');
}

module.exports = { id, meta, runInPage };
