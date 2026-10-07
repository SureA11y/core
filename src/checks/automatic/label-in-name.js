/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check label-in-name
 * @atomic true
 * @summary A control's accessible name must contain its visible label text
 * @standard WCAG 2.2
 * @sc 2.5.3
 * @applicability
 *   Applies to controls named by aria-label or aria-labelledby, are
 *   visually rendered, and have visible label text this engine can extract
 *   deterministically, from an associated <label>, from the control's own
 *   rendered text, or from the elements aria-labelledby points at. The
 *   candidates are <button>, <a href>, <summary>, non-hidden form controls,
 *   and elements whose role attribute resolves (its first known,
 *   non-abstract token, in any case) to the button, link, checkbox, radio,
 *   switch, searchbox, tab, menuitem, menuitemcheckbox, menuitemradio,
 *   option, treeitem or gridcell role, minus anything hidden or disabled.
 *   A button-type <input> (submit, reset, button) with a value shows that
 *   value as its label; without one it shows the browser's own default,
 *   which can't be known, and is out of scope.
 *   The visible label is the visible inner text: text in inline elements
 *   joins as written (<b>Down</b>load reads "Download"), a block-level box or
 *   a <br> starts a new word, and text in a box nobody can see (clipped away,
 *   1x1 px or fully transparent, as screen-reader-only text is) is left
 *   out, as are the options of a <select> and the text of a <textarea>,
 *   which are a field's value, not label text. aria-hidden is not
 *   excluded: it changes nothing about what is rendered on screen, which is
 *   what this SC is about. An aria-label that is empty once trimmed, or an
 *   aria-labelledby whose ids point at nothing or only at elements with no
 *   text, names nothing: the accessible name then comes from the next
 *   source (the content, a <label>, title...), as for a control without
 *   them, so the control is out of scope.
 * @expectation
 *   The accessible name contains the visible label's words, adjacent and in
 *   order. The comparison is over words rather than characters:
 *   parenthesised text is dropped, case is folded, text is NFKC-normalised,
 *   and every character that is not a letter, digit or combining mark
 *   becomes a separator, so punctuation and spacing differences never
 *   decide the outcome. Invisible formatting characters (a soft hyphen, a
 *   zero-width space) and an apostrophe inside a word are removed instead,
 *   so "Down&shy;load" is "Download" and "Don’t" is "Dont". Accents are not folded: "Déposer" stays one word,
 *   and a name that drops an accent ("Deposer") does not contain it. Four
 *   shapes markup cannot
 *   settle are reported as cantTell instead of fail: a word hyphenated
 *   differently in the two places; a visible word the author may have
 *   abbreviated, marked by its trailing period; visible text rendered
 *   through a known icon font (the DOM text is real words, but nothing
 *   readable actually renders); and a whole visible label of exactly one
 *   character that doesn't even appear inside the accessible name, which
 *   per ACT 2ee8b8 may be "non-text content" (e.g. "X" meaning "close")
 *   rather than literal text.
 * @reports
 *   - `visibleLabel`, `accessibleName`: the visible label text and the
 *     accessible name, as found.
 *   - `normalized.visibleLabel`, `normalized.accessibleName`: the same two
 *     texts as compared: parenthesised text dropped, case folded, Unicode
 *     normalised.
 *   - `tokenized.visibleLabel`, `tokenized.accessibleName`: the words each
 *     text was split into, one word per item. The name must hold the
 *     label's words next to each other and in order.
 *   - `labelSource`: where the visible label came from: `label` (an
 *     associated `<label>`), `self` (the control's own text), `value` (a
 *     button-type `<input>`'s value) or `aria-labelledby` (the elements it
 *     points at).
 *   - `nameMechanism`: what gives the accessible name: `aria-label` or
 *     `aria-labelledby`.
 */

const id = 'label-in-name';

const meta = {
  title: 'Label in Name: accessible name contains visible text',
  description:
    'Checks that when a control has a visible text label, the accessible name contains that visible label text (WCAG 2.5.3).',
  i18n: {
    titleKey: 'labelInName_title',
    descriptionKey: 'labelInName_description'
  },
  helpUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html',
  tags: ['wcag21a', 'wcag253', 'forms', 'atomic', 'automatic'],
  wcagSc: ['2.5.3'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.5.3',
      title: 'Label in Name',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '2.5.3': ['label-in-name'] } },
  // Reason codes built at runtime, which scripts/generate-finding-ids.js
  // can't read from the source.
  reasonCodes: [
    'HYPHENATION_DIFFERS',
    'POSSIBLE_ABBREVIATION',
    'POSSIBLE_ICON_FONT_GLYPH',
    'POSSIBLE_SYMBOLIC_CHARACTER'
  ]
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const occurrences = [];
  let applicableCount = 0;

  // Applicability: focus/activation controls with explicit ARIA naming.
  // NOTE: aria-hidden is intentionally NOT excluded here; it does not affect visual rendering.
  // The role attribute is a fallback list matched in any case, so roles are
  // selected by token ([role~="x" i]) and then kept only when the role the
  // attribute resolves to (its first known, non-abstract token) is one of
  // these: role="link button" is a link, role="foo BUTTON" a button.
  const NATIVE_CONTROLS = 'button, a[href], summary, input:not([type="hidden"]), textarea, select';
  const CONTROL_ROLES = [
    'button',
    'link',
    'checkbox',
    'radio',
    'switch',
    'searchbox',
    'tab',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'option',
    'treeitem',
    'gridcell'
  ];
  const roleSelectors = CONTROL_ROLES.map((r) => `[role~="${r}" i]`).join(', ');
  const selector = `:is(${NATIVE_CONTROLS}, ${roleSelectors}):not([hidden]):not([disabled]):not([aria-disabled="true"]):is([aria-label], [aria-labelledby])`;

  function getExplicitRole(el) {
    try {
      return helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(el)
        : '';
    } catch {
      return '';
    }
  }

  function isCandidate(el) {
    try {
      if (dom.matches(el, NATIVE_CONTROLS)) return true;
    } catch {
      // fall through to the role check
    }
    return CONTROL_ROLES.includes(getExplicitRole(el));
  }

  const nodes = (
    helpers.queryAllSmart ? helpers.queryAllSmart(selector) : helpers.queryAll(selector)
  ).filter(isCandidate);

  function norm(s) {
    const v = s == null ? '' : String(s);
    // deterministic normalization: trim + collapse whitespace + case-fold
    return v.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  // WCAG 2.5.3's label-in-name comparison is over words, not characters: drop
  // parenthesised text, case-fold and NFKC-normalise, then reduce every
  // character that is not a letter, digit or combining mark to a space.
  // NFKC folds compatibility forms (ligatures, full-width letters) but keeps
  // accented letters whole; with NFKD, "déposer" split at its combining
  // accent into "de" and "poser". `hyphensJoin` deletes hyphens instead of
  // splitting on them, which distinguishes a real mismatch from one that is
  // only a hyphenation difference.
  function tokenize(s, hyphensJoin) {
    let v = (s == null ? '' : String(s)).replace(/\([^)]*\)/g, ' ').toLowerCase();
    try {
      v = v.normalize('NFKC');
    } catch {
      // Realm without String#normalize: the word comparison below still holds.
    }
    if (hyphensJoin) v = v.replace(/[-‐-―−]/g, '');
    // Invisible formatting characters (a soft hyphen, a zero-width space)
    // render as nothing inside a word, and an apostrophe inside a word
    // ("Don’t") is part of its spelling: remove them rather than split on
    // them, so "Down\u00adload" is "download" and "Don’t" is "dont".
    v = v.replace(/\p{Cf}/gu, '').replace(/([\p{L}\p{N}])['’ʼ](?=[\p{L}\p{N}])/gu, '$1');
    return v
      .replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')
      .split(' ')
      .filter(Boolean);
  }

  // The label's words must appear adjacent and in order inside the name, so a
  // scattered subsequence does not count. Words in `prefixable` may match a
  // longer name word they start.
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

  // A trailing period marks a word the author may have shortened ("Ave." for
  // "Avenue"). Tokenizing removes the period, so collect these beforehand.
  function abbreviatedWords(s) {
    const out = new Set();
    for (const w of (s == null ? '' : String(s)).split(/\s+/)) {
      const m = /^([\p{L}\p{N}\p{M}]+)\.$/u.exec(w);
      if (m) out.add(m[1].toLowerCase());
    }
    return out;
  }

  function getElementDescriptor(el) {
    const tag = el && dom.tagName(el) ? String(dom.tagName(el)).toLowerCase() : 'element';
    // The resolved role, not the raw attribute: <div role="foo button"> is
    // described as div[role="button"], the role assistive technology sees.
    const r = el ? getExplicitRole(el) : '';
    // eslint-disable-next-line safe-dom/no-raw-role -- descriptor text for messages, not a selector
    return r ? `${tag}[role="${r}"]` : tag;
  }

  function clipForSummary(s) {
    const v = (s == null ? '' : String(s)).replace(/\s+/g, ' ').trim();
    if (v.length <= 80) return v;
    return v.slice(0, 77) + '...';
  }

  function isNonRenderedTag(el) {
    const tn = el && dom.tagName(el) ? String(dom.tagName(el)).toLowerCase() : '';
    return (
      tn === 'script' ||
      tn === 'style' ||
      tn === 'template' ||
      tn === 'noscript' ||
      tn === 'meta' ||
      tn === 'link'
    );
  }

  function isDomVisible(el) {
    if (!el) return false;
    if (helpers.isDomVisibleEligible)
      return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
    if (helpers.getEligibilityInfo)
      return !!helpers.getEligibilityInfo(el, ctx, { targetSet: 'dom' }).eligible;
    return true;
  }

  // Unlike isDomVisible above, this also excludes aria-hidden subtrees.
  // Needed for collectVisibleTextUnder's per-text-node check below: an
  // aria-hidden icon-font glyph (e.g. an <i aria-hidden="true"> ligature
  // rendering as "format_color_fill") is DOM-visible pixels but is never
  // perceived as literal readable words the way real visible text is.
  // Excluding aria-hidden content is a cheap static-markup signal that gets
  // the common case (decorative icon fonts) right. An icon-only button
  // named via aria-label shouldn't have its glyph name counted as text.
  function isAccEligible(el) {
    if (!el) return false;
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

  // The element's visible inner text (ACT 2ee8b8): rendered, visible text
  // joined as it is laid out. Pieces of text in inline elements join as
  // written, so <b>Down</b>load is "Download"; a block-level box or a <br>
  // starts a new line, read as a space (helpers.getTextBoundaryKind). Text in
  // a box nobody can see -- clipped away, 1x1 px or fully transparent, as a
  // screen-reader-only span is -- is not part of it (helpers.isVisuallyHidden), and
  // neither is what a <select> or <textarea> holds.
  function collectVisibleTextUnder(container) {
    if (!container) return '';
    if (!isDomVisible(container)) return '';

    const boundaryOf = (n) =>
      typeof helpers.getTextBoundaryKind === 'function' ? helpers.getTextBoundaryKind(n) : 'inline';
    const hidden = (n) =>
      typeof helpers.isVisuallyHidden === 'function' ? helpers.isVisuallyHidden(n) : false;

    // Per parent element: whether its text is perceived (see isAccEligible).
    const eligibleByParent = new Map();
    const parts = [];
    let budget = 20000;
    const walk = (node) => {
      for (const n of dom.childNodes(node) || []) {
        if (budget-- <= 0) return;
        try {
          const type = dom.nodeType(n);
          if (type === 3) {
            const p = dom.parentElement(n);
            if (!p) continue;
            let ok = eligibleByParent.get(p);
            if (ok === undefined) {
              ok = isAccEligible(p);
              eligibleByParent.set(p, ok);
            }
            if (ok) parts.push(String(dom.nodeValue(n) || ''));
            continue;
          }
          if (type !== 1 || isNonRenderedTag(n) || hidden(n)) continue;
          // What a <select> or <textarea> shows is its value (its options,
          // its text), not label text.
          const childTag = String(dom.tagName(n) || '').toLowerCase();
          if (childTag === 'select' || childTag === 'textarea') continue;
          const apart = boundaryOf(n) === 'block';
          if (apart) parts.push(' ');
          walk(n);
          if (apart) parts.push(' ');
        } catch {
          // no-throws
        }
      }
    };
    if (!hidden(container)) walk(container);
    return parts.join('').replace(/\s+/g, ' ').trim();
  }

  // Real <label> elements associated with a native form control -- the
  // shared dom-helpers.js implementation (a `for`-attribute index plus a
  // bounded closest('label') walk), not the native `.labels`/`.control`
  // pair: jsdom implements those as a whole-document walk on every access
  // (see that function's own header comment for the full explanation),
  // real cost this engine's Node/jsdom runtime pays, not just a browser
  // realm this code happens to also run in.
  function getAssociatedLabelElements(control) {
    if (helpers && typeof helpers.getAssociatedLabelElements === 'function') {
      try {
        return helpers.getAssociatedLabelElements(control) || [];
      } catch {
        return [];
      }
    }
    return [];
  }

  function getVisibleTextLabelInfo(el) {
    // Returns { text, source, sourceElements } where source helps reporting
    // and sourceElements (the actual DOM nodes the visible text came from)
    // lets the icon-font check below look at the right element's own style.
    // Source policy (deterministic):
    // 1) <label> association for form controls
    // 2) visible text inside the element
    // 3) visible text from aria-labelledby referenced elements
    let text;
    let source = 'none';

    const tn = el && dom.tagName(el) ? String(dom.tagName(el)).toLowerCase() : '';

    // 1) Label association (native form controls)
    const isFormControl = tn === 'input' || tn === 'select' || tn === 'textarea';
    if (isFormControl) {
      const labels = getAssociatedLabelElements(el);
      const labelParts = [];
      const contributing = [];
      for (const l of labels) {
        if (!l || !isDomVisible(l)) continue;
        const t = collectVisibleTextUnder(l);
        if (t) {
          labelParts.push(t);
          contributing.push(l);
        }
      }
      const joined = labelParts.join(' ').replace(/\s+/g, ' ').trim();
      if (joined) return { text: joined, source: 'label', sourceElements: contributing };
    }

    // 2) Text inside the control itself. Not for <select> or <textarea>:
    //    what shows inside them is a value (the chosen option, what the
    //    user typed), not a label, and neither takes its name from content.
    text = tn === 'select' || tn === 'textarea' ? '' : collectVisibleTextUnder(el);
    if (text) return { text, source: 'self', sourceElements: [el] };

    // 2b) A button-type <input> shows its value as its label. Without a
    //     value it shows the browser's own default ("Submit", in the
    //     browser's language), which can't be known, so it gives no label.
    if (tn === 'input') {
      const type = String(dom.getAttribute(el, 'type') || '').toLowerCase();
      if (type === 'submit' || type === 'reset' || type === 'button') {
        const value = String(dom.getAttribute(el, 'value') || '')
          .replace(/\s+/g, ' ')
          .trim();
        if (value) return { text: value, source: 'value', sourceElements: [el] };
      }
    }

    // 3) aria-labelledby referenced visible text (only if refs exist and are visible)
    try {
      const idrefs =
        el && dom.get(el, 'getAttribute') ? dom.getAttribute(el, 'aria-labelledby') : null;
      if (idrefs && helpers.resolveIdRefs) {
        const r = helpers.resolveIdRefs(idrefs, ctx, { maxRefs: 8 }, el);
        const parts = [];
        const contributing = [];
        for (const ref of r && Array.isArray(r.refs) ? r.refs : []) {
          if (!ref || !dom.tagName(ref)) continue;
          if (!isDomVisible(ref)) continue;
          const t = collectVisibleTextUnder(ref);
          if (t) {
            parts.push(t);
            contributing.push(ref);
          }
        }
        const joined = parts.join(' ').replace(/\s+/g, ' ').trim();
        if (joined)
          return { text: joined, source: 'aria-labelledby', sourceElements: contributing };
      }
    } catch {
      // ignore
    }

    return { text: '', source, sourceElements: [] };
  }

  // Curated real-world icon-font family names. These fonts remap ordinary
  // word glyphs to unrelated symbols via ligatures/PUA codepoints, so the
  // DOM text is real words but nothing readable actually renders, ACT
  // 2ee8b8's own passed example is exactly this (a button's DOM text
  // "search" rendered as a magnifying-glass icon by "Material Icons").
  // Same curated-list tradeoff as link-name-quality's phrase list.
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

  // Same two-tier lookup as avoid-inline-spacing.js's computedStyleOf:
  // helpers.computedStyle isn't actually part of the public helpers API
  // (it's internal to dom-helpers.js), so the realm's own getComputedStyle
  // is what actually resolves a stylesheet-declared font-family.
  function computedStyleOf(node) {
    if (helpers && typeof helpers.computedStyle === 'function') {
      try {
        const cs = helpers.computedStyle(node);
        if (cs) return cs;
      } catch {
        // fall through to the realm's own view
      }
    }
    try {
      const view = dom.ownerDocument(node) && dom.defaultView(dom.ownerDocument(node));
      if (view && typeof view.getComputedStyle === 'function') return view.getComputedStyle(node);
    } catch {
      // no computed style available
    }
    return null;
  }

  function isIconFontElement(node) {
    if (!node) return false;
    const cs = computedStyleOf(node);
    if (!cs) return false;
    let family;
    try {
      family =
        cs.fontFamily || (cs.getPropertyValue ? cs.getPropertyValue('font-family') : '') || '';
    } catch {
      family = '';
    }
    if (!family) return false;
    const names = String(family)
      .split(',')
      .map((s) =>
        s
          .trim()
          .replace(/^['"]|['"]$/g, '')
          .toLowerCase()
      );
    return names.some((n) => ICON_FONT_FAMILIES.has(n));
  }

  // ACT 2ee8b8's own passed example `<button aria-label="close">X</button>`:
  // a single character standing in for an icon ("x" meaning "close") is
  // "non-text content" per the rule's own background text, which names no
  // algorithmic test for it. Scoped narrowly to a whole visible label of
  // exactly one character that doesn't even appear inside the accessible
  // name: "x" has no relation at all to "close", which is the icon-glyph
  // shape. A single character that DOES appear in the name (e.g. visible
  // "1" against aria-label "1a") is a real word-boundary mismatch, not a
  // symbol standing in for something else, and still fails outright.
  function isSingleSymbolicCharacter(text, accessibleNameNorm) {
    const t = norm(text);
    if (!t || Array.from(t).length !== 1) return false;
    return accessibleNameNorm.indexOf(t) === -1;
  }

  for (const el of nodes) {
    // Gate: control must be visually rendered (SC is about visual labels).
    if (!isDomVisible(el)) continue;

    const labelInfo = getVisibleTextLabelInfo(el);
    const visibleLabel = labelInfo && labelInfo.text ? String(labelInfo.text) : '';
    const visibleNorm = norm(visibleLabel);

    // Applicability: only when we can deterministically extract visible label text.
    if (!visibleNorm) continue;

    let acc = { present: false, value: '', mechanism: 'none', flags: [] };
    try {
      acc = helpers.getAccessibleNameInfo
        ? helpers.getAccessibleNameInfo(el, ctx, { maxRefs: 8 })
        : acc;
    } catch {
      acc = { present: false, value: '', mechanism: 'none', flags: ['exception'] };
    }

    // An aria-label empty once trimmed, or an aria-labelledby that yields no
    // text, is skipped by the accessible name computation (AccName 1.2 steps
    // 2B and 2C): the name comes from the next source, the content for a
    // button or link, as if neither attribute were there. Such a control is
    // not named by aria-label or aria-labelledby, so it is out of scope.
    // getAccessibleNameInfo leaves name from content to its callers, which
    // made `<button aria-labelledby="missing">Save</button>` fail with an
    // empty name although its name is "Save".
    const flags = acc && Array.isArray(acc.flags) ? acc.flags : [];
    const ariaNamed =
      acc && (acc.mechanism === 'aria-label' || acc.mechanism === 'aria-labelledby');
    if (
      !ariaNamed &&
      (flags.includes('aria-labelledby-empty-or-unresolvable') ||
        flags.includes('aria-label-empty'))
    )
      continue;

    applicableCount += 1;
    const accName = acc && acc.value != null ? String(acc.value) : '';
    const accNorm = norm(accName);

    const labelTokens = tokenize(visibleLabel, false);
    const nameTokens = tokenize(accName, false);
    const contains = containsWordRun(labelTokens, nameTokens, null);

    // An abbreviation, a word hyphenated differently, or visible text that
    // may not be literal text at all (an icon-font glyph, a single symbolic
    // character) is not something markup settles: the author may have meant
    // either. Report without asserting a defect instead of failing or
    // staying silent.
    let uncertainReason = '';
    if (!contains) {
      if (containsWordRun(tokenize(visibleLabel, true), tokenize(accName, true), null)) {
        uncertainReason = 'HYPHENATION_DIFFERS';
      } else {
        const abbreviated = abbreviatedWords(visibleLabel);
        if (abbreviated.size && containsWordRun(labelTokens, nameTokens, abbreviated)) {
          uncertainReason = 'POSSIBLE_ABBREVIATION';
        } else if ((labelInfo.sourceElements || []).some(isIconFontElement)) {
          uncertainReason = 'POSSIBLE_ICON_FONT_GLYPH';
        } else if (isSingleSymbolicCharacter(visibleLabel, accNorm)) {
          uncertainReason = 'POSSIBLE_SYMBOLIC_CHARACTER';
        }
      }
    }

    const isSymbolicUncertainty =
      uncertainReason === 'POSSIBLE_ICON_FONT_GLYPH' ||
      uncertainReason === 'POSSIBLE_SYMBOLIC_CHARACTER';

    if (!contains) {
      occurrences.push(
        helpers.reportOccurrence(el, {
          ...(uncertainReason ? { outcome: 'cantTell' } : null),
          summary: uncertainReason
            ? 'Accessible name may not contain the visible label text.'
            : 'Accessible name does not contain the visible label text.',
          hint: !uncertainReason
            ? 'Ensure the accessible name includes the visible text label (e.g., update aria-label/aria-labelledby to include the visible wording).'
            : isSymbolicUncertainty
              ? 'Check by hand: the visible text may render as an icon or symbol rather than literal words, which markup cannot settle.'
              : 'Check by hand: the two differ only by an abbreviation or by hyphenation, which markup cannot settle.',
          i18n: {
            summaryKey: !uncertainReason
              ? 'labelInName_summary_fail'
              : isSymbolicUncertainty
                ? 'labelInName_summary_cantTell_symbolic'
                : 'labelInName_summary_cantTell',
            hintKey: !uncertainReason
              ? 'labelInName_hint_fail'
              : isSymbolicUncertainty
                ? 'labelInName_hint_cantTell_symbolic'
                : 'labelInName_hint_cantTell',
            params: {
              element: getElementDescriptor(el),
              visibleLabel: clipForSummary(visibleLabel),
              labelSource: labelInfo && labelInfo.source ? labelInfo.source : 'none',
              nameMechanism: acc && acc.mechanism ? acc.mechanism : 'none'
            }
          },
          ...(uncertainReason
            ? {
                uncertainty: {
                  code: 'equivalence-unknown',
                  needed:
                    'Whether the accessible name and the visible label say the same thing to a user.',
                  evidence: {
                    visibleLabel,
                    accessibleName: accName,
                    difference: uncertainReason
                  }
                }
              }
            : null),
          data: {
            details: {
              reasonCode: uncertainReason || 'VISIBLE_LABEL_NOT_IN_ACCESSIBLE_NAME',
              visibleLabel,
              accessibleName: accName,
              normalized: { visibleLabel: visibleNorm, accessibleName: accNorm },
              tokenized: { visibleLabel: labelTokens, accessibleName: nameTokens },
              labelSource: labelInfo && labelInfo.source ? labelInfo.source : 'none',
              nameMechanism: acc && acc.mechanism ? acc.mechanism : 'none'
            }
          }
        })
      );
    }
  }

  if (applicableCount === 0)
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  if (occurrences.length) {
    const isReview = (o) => o.outcome === 'cantTell';
    const anyFail = occurrences.some((o) => !isReview(o));
    const anyReview = occurrences.some(isReview);
    // Tiers go in occurrenceOutcome (OUTPUT_SCHEMA.md), on every occurrence
    // when the result mixes them, and on none when it doesn't.
    const tiered = occurrences.map((o) => {
      const { outcome, ...rest } = o;
      return anyFail && anyReview
        ? { ...rest, occurrenceOutcome: outcome === 'cantTell' ? 'cantTell' : 'fail' }
        : rest;
    });
    return {
      ruleId: rule.ruleId,
      outcome: anyFail ? 'fail' : 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences: tiered
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
