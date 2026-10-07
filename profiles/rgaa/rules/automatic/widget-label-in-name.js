/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check widget-label-in-name
 * @atomic true
 * @summary The accessible name of a scripted component contains its visible label
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to elements with an explicit ARIA widget role that is neither a
 *   link, a button nor a form field (tab, menuitem, menuitemcheckbox,
 *   menuitemradio, treeitem, gridcell, option), whose visible text is their
 *   visible label, and that carry an aria-label or an aria-labelledby. Such
 *   a role marks a component built with a script (glossary "Composant
 *   d'interface"). A page with no such element is notApplicable.
 * @expectation
 *   RGAA 7.1.3 methodology step 2: the component's accessible name contains
 *   its visible label. Punctuation and capital letters are ignored (the
 *   particular cases of 7.1.3); accents are not folded. An accessible name
 *   that does not contain it fails. Only the accessible name is checked; a
 *   title is not.
 * @implementation-notes
 * - role="option" is also a form field in the glossary "Champ de saisie de
 *   formulaire". It is checked here, as part of the scripted listbox, so
 *   that one element is reported under one test.
 * - Its runInPage is the one of link-label-in-name-sources, apart from the
 *   `family` constant and the messages; the four label-in-name files are
 *   changed together. That file documents the comparison and the cases
 *   asked about instead of failed (a possible symbol, an abbreviation, text
 *   in parentheses).
 * - Opt-in (tag `rgaa`): WCAG 2.5.3 is checked by label-in-name; this rule
 *   reports the same finding under the one RGAA test it belongs to, and
 *   runs only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 */

const id = 'widget-label-in-name';

const meta = {
  title: 'The accessible name of a scripted component contains its visible label',
  description:
    'Checks that an element with an ARIA widget role (tab, menu item, tree item, grid cell, option) has an accessible name that contains its visible label, as RGAA 7.1.3 requires.',
  i18n: {
    titleKey: 'widgetLabelInName_title',
    descriptionKey: 'widgetLabelInName_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'aria', 'name', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  // Reason codes built at runtime, which scripts/generate-finding-ids.js
  // can't read from the source.
  reasonCodes: ['SOURCE_LACKS_VISIBLE_LABEL']
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  // Which of the four label-in-name tests this file checks. The four rule
  // files carry the same runInPage, apart from this constant and MESSAGES.
  const family = 'widget';

  const FIELD_ROLES = new Set([
    'textbox',
    'searchbox',
    'combobox',
    'spinbutton',
    'slider',
    'listbox',
    'checkbox',
    'radio',
    'switch',
    'progressbar'
  ]);
  // Field roles whose content is their label, not their value.
  const FIELD_ROLES_NAMED_BY_CONTENT = new Set(['checkbox', 'radio', 'switch']);
  const WIDGET_ROLES = new Set([
    'tab',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'treeitem',
    'gridcell',
    'option'
  ]);
  const BUTTON_INPUT_TYPES = new Set(['submit', 'reset', 'button', 'image']);
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const SELECTORS = {
    link: 'a[href], [role~="link" i]',
    field:
      'input, select, textarea, output, progress, meter, [role~="textbox" i], [role~="searchbox" i], [role~="combobox" i], [role~="spinbutton" i], [role~="slider" i], [role~="listbox" i], [role~="checkbox" i], [role~="radio" i], [role~="switch" i], [role~="progressbar" i]',
    button: 'button, input, [role~="button" i]',
    widget:
      '[role~="tab" i], [role~="menuitem" i], [role~="menuitemcheckbox" i], [role~="menuitemradio" i], [role~="treeitem" i], [role~="gridcell" i], [role~="option" i]'
  };

  function tagOf(el) {
    return String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  }

  // The role the attribute resolves to: its first known, non-abstract token,
  // in any case (role="foo BUTTON" is a button).
  function explicitRole(el) {
    try {
      return helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(el)
        : '';
    } catch {
      return '';
    }
  }

  function inputType(el) {
    return String(dom.getAttribute(el, 'type') || '')
      .trim()
      .toLowerCase();
  }

  // The RGAA test an element belongs to: its explicit role decides first,
  // then its tag. '' for anything none of the four tests covers.
  function classify(el) {
    if (dom.namespaceURI(el) === SVG_NS) return '';
    const role = explicitRole(el);
    if (role) {
      if (role === 'link') return 'link';
      if (role === 'button') return 'button';
      if (FIELD_ROLES.has(role)) return 'field';
      if (WIDGET_ROLES.has(role)) return 'widget';
      return '';
    }
    const tag = tagOf(el);
    if (tag === 'a') return dom.hasAttribute(el, 'href') ? 'link' : '';
    if (tag === 'button') return 'button';
    if (tag === 'input') {
      const type = inputType(el);
      if (type === 'hidden') return '';
      return BUTTON_INPUT_TYPES.has(type) ? 'button' : 'field';
    }
    if (['select', 'textarea', 'output', 'progress', 'meter'].includes(tag)) return 'field';
    return '';
  }

  function parentOf(node) {
    if (helpers.composedParent) return helpers.composedParent(node);
    return dom.parentNode(node) && dom.host(dom.parentNode(node))
      ? dom.host(dom.parentNode(node))
      : dom.parentNode(node);
  }

  // RGAA 11.9 covers the buttons « présents au sein d'un formulaire »: a
  // <form> or role="form" ancestor (glossary "Formulaire").
  function insideForm(el) {
    for (let p = parentOf(el); p && dom.nodeType(p) === 1; p = parentOf(p)) {
      if (tagOf(p) === 'form') return true;
      if (explicitRole(p) === 'form') return true;
    }
    return false;
  }

  function isDomVisible(el) {
    if (!el) return false;
    if (helpers.isDomVisibleEligible)
      return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
    if (helpers.getEligibilityInfo)
      return !!helpers.getEligibilityInfo(el, ctx, { targetSet: 'dom' }).eligible;
    return true;
  }

  // Visible and not inside an aria-hidden subtree: an aria-hidden icon glyph
  // is not read as words.
  function isAccEligible(el) {
    const fn =
      helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
    if (!fn) return isDomVisible(el);
    try {
      const r = fn(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return isDomVisible(el);
    }
  }

  function isNonRenderedTag(tag) {
    return ['script', 'style', 'template', 'noscript', 'meta', 'link'].includes(tag);
  }

  // Text of form controls nested in a label is their value, not the label.
  function isControlTag(tag) {
    return ['input', 'select', 'textarea', 'button', 'option', 'optgroup', 'datalist'].includes(
      tag
    );
  }

  const SHOW_TEXT = 4;

  // The text a person sees in `container`, in document order. With
  // `visibleOnly` false, hidden text counts too (the content of a source).
  function textUnder(container, visibleOnly) {
    if (!container) return { text: '', elements: [] };
    if (visibleOnly && !isDomVisible(container)) return { text: '', elements: [] };
    let walker;
    try {
      walker = dom.createTreeWalker(document, container, SHOW_TEXT, null);
    } catch {
      walker = null;
    }
    if (!walker) return { text: '', elements: [] };
    const parts = [];
    const elements = [];
    let n;
    while ((n = walker.nextNode())) {
      const t = String(dom.nodeValue(n) || '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!t) continue;
      const p = dom.parentElement(n);
      if (!p) continue;
      let skip = false;
      for (let a = p; a && a !== container; a = dom.parentElement(a)) {
        const tag = tagOf(a);
        if (isNonRenderedTag(tag) || isControlTag(tag)) {
          skip = true;
          break;
        }
      }
      if (skip || isNonRenderedTag(tagOf(p))) continue;
      if (visibleOnly && !isAccEligible(p)) continue;
      parts.push(t);
      if (!elements.includes(p)) elements.push(p);
    }
    return { text: parts.join(' ').replace(/\s+/g, ' ').trim(), elements };
  }

  function labelsOf(el) {
    if (!helpers.getAssociatedLabelElements) return [];
    try {
      return helpers.getAssociatedLabelElements(el) || [];
    } catch {
      return [];
    }
  }

  function labelledbyRefs(el) {
    const idrefs = dom.getAttribute(el, 'aria-labelledby');
    if (!idrefs || !idrefs.trim() || !helpers.resolveIdRefs) return [];
    try {
      const r = helpers.resolveIdRefs(idrefs, ctx, { maxRefs: 8 }, el);
      return r && Array.isArray(r.refs) ? r.refs : [];
    } catch {
      return [];
    }
  }

  function joinVisible(nodes) {
    const texts = [];
    const elements = [];
    for (const node of nodes) {
      const t = textUnder(node, true);
      if (t.text) {
        texts.push(t.text);
        for (const e of t.elements) elements.push(e);
      }
    }
    return { text: texts.join(' ').replace(/\s+/g, ' ').trim(), elements };
  }

  // The visible label (glossary "Intitulé visible") and where it comes from.
  // Links, buttons and components show it as their content; a field shows it
  // in its <label>, or in the text its aria-labelledby points to.
  function visibleLabelOf(el) {
    const tag = tagOf(el);
    const role = explicitRole(el);
    if (family === 'button' && tag === 'input') {
      if (inputType(el) === 'image') return { text: '', origin: '', elements: [] };
      const value = String(dom.getAttribute(el, 'value') || '')
        .replace(/\s+/g, ' ')
        .trim();
      return { text: value, origin: 'value', elements: [el] };
    }
    if (family === 'field') {
      const labels = labelsOf(el).filter((l) => isDomVisible(l));
      const fromLabel = joinVisible(labels);
      if (fromLabel.text) return { ...fromLabel, origin: 'label' };
      const fromRefs = joinVisible(labelledbyRefs(el));
      if (fromRefs.text) return { ...fromRefs, origin: 'aria-labelledby' };
      if (FIELD_ROLES_NAMED_BY_CONTENT.has(role)) {
        const own = textUnder(el, true);
        if (own.text) return { ...own, origin: 'content' };
      }
      return { text: '', origin: '', elements: [] };
    }
    const own = textUnder(el, true);
    return { ...own, origin: 'content' };
  }

  function clean(s) {
    return String(s == null ? '' : s)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function labelSourceText(el) {
    const texts = [];
    for (const l of labelsOf(el)) {
      const t = textUnder(l, false).text;
      if (t) texts.push(t);
    }
    return clean(texts.join(' '));
  }

  // The name sources present on the element, in the order the glossary gives
  // for the accessible name. `wins` marks the one that gives the name.
  function sourcesOf(el) {
    const out = [];
    let byRef = '';
    if (helpers.getAriaLabelledByInfo) {
      try {
        const info = helpers.getAriaLabelledByInfo(el, ctx, { maxRefs: 8 });
        byRef = clean(info && info.present ? info.value : '');
      } catch {
        byRef = '';
      }
    }
    if (byRef) out.push({ source: 'aria-labelledby', text: byRef });
    const ariaLabel = clean(dom.getAttribute(el, 'aria-label'));
    if (ariaLabel) out.push({ source: 'aria-label', text: ariaLabel });
    if (family === 'field') {
      const labelText = labelSourceText(el);
      if (labelText) out.push({ source: '<label>', text: labelText });
    }
    const title = clean(dom.getAttribute(el, 'title'));
    if (title) out.push({ source: 'title', text: title });
    return out;
  }

  // ---- Comparison (RGAA particular cases: punctuation and capitals) ----

  function tokenize(s, joinPunctuation) {
    let v = String(s == null ? '' : s).toLowerCase();
    try {
      v = v.normalize('NFKC');
    } catch {
      // Realm without String#normalize: the word comparison still holds.
    }
    if (joinPunctuation) v = v.replace(/[\p{P}\p{S}]+/gu, '');
    return v
      .replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')
      .split(' ')
      .filter(Boolean);
  }

  function containsWordRun(needle, hay, prefixable) {
    if (!needle.length) return true;
    for (let i = 0; i + needle.length <= hay.length; i++) {
      let ok = true;
      for (let j = 0; j < needle.length; j++) {
        const want = needle[j];
        const got = hay[i + j];
        if (got === want) continue;
        if (prefixable && prefixable.has(want) && got.indexOf(want) === 0) continue;
        ok = false;
        break;
      }
      if (ok) return true;
    }
    return false;
  }

  function abbreviatedWords(s) {
    // A word directly followed by a period that ends it ("av." in "l'av. Foch").
    const found = new Set();
    const re = /([\p{L}\p{N}\p{M}]+)\.(?=\s|$)/gu;
    let m;
    while ((m = re.exec(String(s == null ? '' : s))) !== null) found.add(m[1].toLowerCase());
    return found;
  }

  const ICON_FONT_FAMILIES = new Set([
    'material icons',
    'material icons outlined',
    'material icons round',
    'material icons sharp',
    'material icons two tone',
    'material symbols outlined',
    'material symbols rounded',
    'material symbols sharp',
    'font awesome 5 free',
    'font awesome 5 brands',
    'font awesome 5 pro',
    'font awesome 6 free',
    'font awesome 6 brands',
    'font awesome 6 pro',
    'fontawesome',
    'glyphicons halflings',
    'ionicons',
    'icomoon',
    'bootstrap-icons',
    'bootstrap icons',
    'feather'
  ]);

  function isIconFontElement(node) {
    let cs = null;
    try {
      const view = dom.ownerDocument(node) && dom.defaultView(dom.ownerDocument(node));
      if (view && typeof view.getComputedStyle === 'function') cs = view.getComputedStyle(node);
    } catch {
      cs = null;
    }
    if (!cs) return false;
    let fontFamily;
    try {
      fontFamily = cs.fontFamily || cs.getPropertyValue('font-family') || '';
    } catch {
      fontFamily = '';
    }
    return String(fontFamily)
      .split(',')
      .map((s) =>
        s
          .trim()
          .replace(/^['"]|['"]$/g, '')
          .toLowerCase()
      )
      .some((n) => ICON_FONT_FAMILIES.has(n));
  }

  // 'yes' when the source contains the visible label; otherwise why it may
  // still be acceptable ('abbreviation', 'parentheses', 'symbol'), or 'no'.
  function compare(label, sourceText) {
    const labelTokens = tokenize(label.text, false);
    const sourceTokens = tokenize(sourceText, false);
    if (containsWordRun(labelTokens, sourceTokens, null)) return 'yes';
    if (containsWordRun(tokenize(label.text, true), tokenize(sourceText, true), null)) return 'yes';
    const abbreviated = abbreviatedWords(label.text);
    if (abbreviated.size && containsWordRun(labelTokens, sourceTokens, abbreviated)) {
      return 'abbreviation';
    }
    const withoutParentheses = tokenize(label.text.replace(/\([^)]*\)/g, ' '), false);
    if (
      withoutParentheses.length &&
      withoutParentheses.length < labelTokens.length &&
      containsWordRun(withoutParentheses, sourceTokens, null)
    ) {
      return 'parentheses';
    }
    if (label.elements.some(isIconFontElement)) return 'symbol';
    const whole = label.text.toLowerCase();
    if (Array.from(whole).length === 1 && sourceText.toLowerCase().indexOf(whole) === -1) {
      return 'symbol';
    }
    return 'no';
  }

  function describe(el) {
    const tag = tagOf(el) || 'element';
    const role = explicitRole(el);
    // eslint-disable-next-line safe-dom/no-raw-role -- descriptor text for messages, not a selector
    if (role) return `${tag}[role="${role}"]`;
    if (tag === 'input') return `input[type="${inputType(el) || 'text'}"]`;
    return tag;
  }

  function clip(s) {
    const v = clean(s);
    return v.length <= 80 ? v : v.slice(0, 77) + '...';
  }

  const UNCERTAIN_CODES = {
    abbreviation: 'POSSIBLE_ABBREVIATION',
    parentheses: 'PARENTHESISED_TEXT_MISSING',
    symbol: 'POSSIBLE_SYMBOL'
  };

  const MESSAGES = {
    NAME_LACKS_VISIBLE_LABEL: {
      reasonCode: 'NAME_LACKS_VISIBLE_LABEL',
      outcome: 'fail',
      summaryKey: 'widgetLabelInName_summary_fail_name',
      hintKey: 'widgetLabelInName_hint_fail_name',
      summary: 'The accessible name of this component does not contain its visible label.',
      hint: 'Make the attribute that names the element contain the visible label, ideally at its start, or remove it so the visible text names the element.'
    },
    POSSIBLE_SYMBOL: {
      reasonCode: 'POSSIBLE_SYMBOL',
      outcome: 'cantTell',
      summaryKey: 'widgetLabelInName_summary_cantTell_symbol',
      hintKey: 'widgetLabelInName_hint_cantTell_symbol',
      summary:
        'The visible label of this component may be a symbol, and a label source does not contain it.',
      hint: 'If the visible text is a symbol (an icon glyph, "X" for close, ">" for next), check that the name says what the symbol means. If it is literal text, the name must contain it.',
      needed: 'Whether the visible text is a symbol whose function the name expresses.'
    },
    POSSIBLE_ABBREVIATION: {
      reasonCode: 'POSSIBLE_ABBREVIATION',
      outcome: 'cantTell',
      summaryKey: 'widgetLabelInName_summary_cantTell_nearMatch',
      hintKey: 'widgetLabelInName_hint_cantTell_nearMatch',
      summary:
        'A label source of this component differs from its visible label only by an abbreviation or by text in parentheses.',
      hint: 'Check whether the source still contains the visible label as a user would say it. RGAA excuses only punctuation and capital letters.',
      needed: 'Whether the source says the visible label, abbreviation or parenthesised text aside.'
    },
    PARENTHESISED_TEXT_MISSING: {
      reasonCode: 'PARENTHESISED_TEXT_MISSING',
      outcome: 'cantTell',
      summaryKey: 'widgetLabelInName_summary_cantTell_nearMatch',
      hintKey: 'widgetLabelInName_hint_cantTell_nearMatch',
      summary:
        'A label source of this component differs from its visible label only by an abbreviation or by text in parentheses.',
      hint: 'Check whether the source still contains the visible label as a user would say it. RGAA excuses only punctuation and capital letters.',
      needed: 'Whether the source says the visible label, abbreviation or parenthesised text aside.'
    }
  };

  let nodes;
  try {
    nodes = helpers.queryAllSmart
      ? helpers.queryAllSmart(SELECTORS[family])
      : helpers.queryAll(SELECTORS[family]);
  } catch {
    nodes = [];
  }

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (classify(el) !== family) continue;
    if (family === 'button' && !insideForm(el)) continue;
    if (!isDomVisible(el)) continue;

    const label = visibleLabelOf(el);
    if (!label.text || !tokenize(label.text, false).length) continue;

    const all = sourcesOf(el);
    // The first present ARIA source names the element; without one, a
    // field's <label>, or the content or value of anything else, does.
    const winning =
      all.find((s) => s.source === 'aria-labelledby' || s.source === 'aria-label') ||
      (family === 'field' ? all.find((s) => s.source === '<label>') : null) ||
      (label.origin === 'content' || label.origin === 'value' ? null : all[0]) ||
      null;

    // The source the visible label is read from contains it already.
    let checked = all.filter((s) => s.source !== label.origin);
    if (family === 'field' && label.origin === 'label') {
      checked = checked.filter((s) => s.source !== '<label>');
    }
    // 7.1.3 checks the accessible name only.
    if (family === 'widget') checked = checked.filter((s) => s === winning);
    if (!checked.length) continue;

    applicableCount += 1;

    const failing = [];
    for (const s of checked) {
      const verdict = compare(label, s.text);
      if (verdict !== 'yes') failing.push({ ...s, verdict, wins: s === winning });
    }
    if (!failing.length) continue;

    const definite = failing.filter((s) => s.verdict === 'no');
    let reasonCode;
    let reported;
    const nameDefinite = definite.find((s) => s.wins);
    if (nameDefinite) {
      reasonCode = 'NAME_LACKS_VISIBLE_LABEL';
      reported = [nameDefinite];
    } else if (definite.length) {
      reasonCode = 'SOURCE_LACKS_VISIBLE_LABEL';
      reported = definite;
    } else {
      reasonCode = UNCERTAIN_CODES[failing[0].verdict];
      reported = failing;
    }
    const msg = MESSAGES[reasonCode] || MESSAGES.NAME_LACKS_VISIBLE_LABEL;
    const sources = reported.map((s) => s.source).join(', ');

    const occurrence = helpers.reportOccurrence(el, {
      summary: msg.summary,
      hint: msg.hint,
      i18n: {
        summaryKey: msg.summaryKey,
        hintKey: msg.hintKey,
        params: { element: describe(el), visibleLabel: clip(label.text), sources }
      },
      ...(msg.outcome === 'cantTell' && msg.needed
        ? {
            uncertainty: {
              code: 'equivalence-unknown',
              needed: msg.needed,
              evidence: { visibleLabel: label.text, sources }
            }
          }
        : {}),
      ...(msg.outcome === 'cantTell' && !msg.needed
        ? {
            uncertainty: {
              code: 'judgement-required',
              needed: 'Whether the audit checks the sources that do not give the accessible name.',
              evidence: { visibleLabel: label.text, sources }
            }
          }
        : {}),
      data: {
        details: {
          reasonCode,
          visibleLabel: label.text,
          visibleLabelSource: label.origin,
          accessibleNameSource: winning ? winning.source : label.origin,
          sources: failing.map((s) => ({ source: s.source, text: s.text, verdict: s.verdict }))
        }
      }
    });
    if (msg.outcome === 'fail') failOccurrences.push(occurrence);
    else cantTellOccurrences.push(occurrence);
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome(
    failOccurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'serious'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
