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
 *   option, treeitem or gridcell role, and a <td> with no role attribute
 *   in a grid or treegrid, a gridcell by HTML-AAM, minus anything hidden
 *   or disabled.
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
 *   A custom element whose ElementInternals give it one of those roles
 *   (this.attachInternals().role), with no role attribute naming another,
 *   counts as a native element with that role does.
 * @expectation
 *   The accessible name contains the visible label's words, adjacent and in
 *   order. In a browser, the label is also read as it shows: two boxes
 *   drawn side by side on one line with no space between them join their
 *   words (flex items "sure" and "a11y" read "surea11y"), and a name that
 *   holds either reading contains the label. The comparison is over words
 *   rather than characters: parenthesised text is dropped, case is folded, text is NFKC-normalised,
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
 * @reason-codes
 *   - `HYPHENATION_DIFFERS` (cantTell): the accessible name holds the visible
 *     label's words only when hyphens are ignored, so whether it contains the
 *     label is a judgment call.
 *     It leans pass: the words are the same once hyphens are ignored.
 *     Basis: WCAG 2.5.3 (not settled); ACT 2ee8b8.
 *   - `POSSIBLE_ABBREVIATION` (cantTell): the accessible name holds the
 *     visible label only if a word ending in a period is read as an
 *     abbreviation of a longer word.
 *     It leans pass when each shortened word has three letters or more and
 *     starts the word in the name; otherwise no lean.
 *     Basis: WCAG 2.5.3 (not settled); ACT 2ee8b8.
 *   - `POSSIBLE_ICON_FONT_GLYPH` (cantTell): the visible label renders through
 *     an icon font, so its text may show as a symbol rather than readable
 *     words.
 *     It leans pass when the text is a ligature name or Private Use Area
 *     characters and the page has loaded that font; otherwise no lean.
 *     Basis: WCAG 2.5.3 (not settled); ACT 2ee8b8.
 *   - `POSSIBLE_SYMBOLIC_CHARACTER` (cantTell): the visible label is a single
 *     character, or symbols only ("×", "+", "»"), missing from the accessible
 *     name, which may be a symbol rather than text.
 *     It leans pass when the character is the letter x (a close icon), and
 *     fail when it is a digit; other letters have no lean.
 *     Basis: WCAG 2.5.3 (not settled); ACT 2ee8b8.
 *   - `VISIBLE_LABEL_NOT_IN_ACCESSIBLE_NAME` (fail): the accessible name from
 *     aria-label or aria-labelledby does not contain the visible label's
 *     words, together and in order.
 *     Basis: WCAG 2.5.3; F96; G208; ACT 2ee8b8.
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
  ],
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    HYPHENATION_DIFFERS: {
      steps: [
        'Read the visible label of the control the report names.',
        "Open the Accessibility pane and read the control's accessible name.",
        'Compare the two: they differ only in where hyphens fall ("e-mail" against "email"); decide whether a person saying the visible label would say the same words.',
        'If speech input software is available, say the visible label and see whether it activates the control.'
      ],
      passWhen:
        'The name says the same words as the label, with only the hyphenation differing, so speaking the label reaches the control.',
      failWhen:
        'The hyphenation changes the words, so the name does not contain what the label shows, which fails WCAG 2.5.3.'
    },
    POSSIBLE_ABBREVIATION: {
      steps: [
        'Read the visible label of the control the report names, and note the word ending in a period.',
        "Open the Accessibility pane and read the control's accessible name.",
        'Decide whether the label\'s word is a common abbreviation of the word in the name ("Ave." for "Avenue") that a person would read aloud as the full word.'
      ],
      passWhen:
        'The abbreviation is a conventional one read as the full word that the name contains.',
      failWhen:
        "The label's word is not read as the word in the name, so a person saying the label would not match the name, which fails WCAG 2.5.3."
    },
    POSSIBLE_ICON_FONT_GLYPH: {
      steps: [
        'Look at the control the report names on screen and note what it shows: readable words or an icon.',
        "Open the Accessibility pane and read the control's accessible name.",
        'If the control shows only an icon, decide whether the name describes it; if it shows readable words, check that the name contains them.'
      ],
      passWhen:
        'The control shows an icon rather than readable text, or the readable text it shows is contained in the name.',
      failWhen:
        'The control shows readable words that the accessible name does not contain, which fails WCAG 2.5.3.'
    },
    POSSIBLE_SYMBOLIC_CHARACTER: {
      steps: [
        'Look at the single character the control the report names shows.',
        "Open the Accessibility pane and read the control's accessible name.",
        'Decide whether the character is a symbol standing for an action (an "X" for close, an arrow) or literal text a user would say, such as a digit or letter.'
      ],
      passWhen: 'The character is a symbol, and the name describes what it does.',
      failWhen:
        'The character is text a user would say (a digit or a letter) and the name does not contain it, which fails WCAG 2.5.3.'
    }
  }
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
  const CONDITIONS =
    ':not([hidden]):not([disabled]):not([aria-disabled="true"]):is([aria-label], [aria-labelledby])';
  // A <td> is a gridcell in a grid or treegrid (HTML-AAM), with no role
  // attribute to select it by. Only cells under such a table are asked
  // for, so a page's plain tables cost nothing; isCandidate keeps those
  // whose nearest table is the grid.
  const GRID_CELLS = ':is(table[role~="grid" i], table[role~="treegrid" i]) td';
  const selector = `:is(${NATIVE_CONTROLS}, ${GRID_CELLS}, ${roleSelectors})${CONDITIONS}`;

  // The resolved role: the role attribute's first known token, else the role
  // a custom element's internals give it.
  function getExplicitRole(el) {
    try {
      return helpers.aria && typeof helpers.aria.getAuthorRole === 'function'
        ? helpers.aria.getAuthorRole(el)
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
    const role = getExplicitRole(el);
    if (role) return CONTROL_ROLES.includes(role);
    return (
      String(dom.localName(el) || '').toLowerCase() === 'td' &&
      helpers.aria.getTableCellRole(el) === 'gridcell'
    );
  }

  const nodes = (
    helpers.queryAllSmart ? helpers.queryAllSmart(selector) : helpers.queryAll(selector)
  ).filter(isCandidate);
  // Custom elements that are controls by their internals, which no role
  // attribute shows to the selector above. Asked only for the roles such
  // elements have, and not at all on a page with none.
  const internalsRoles =
    typeof helpers.getInternalsRoleElements === 'function'
      ? [...new Set(helpers.getInternalsRoleElements().map((e) => e.role))].filter((r) =>
          CONTROL_ROLES.includes(r)
        )
      : [];
  if (internalsRoles.length && helpers.queryAllSmart) {
    const seen = new Set(nodes);
    const internalsSelector = internalsRoles.map((r) => `[role~="${r}" i]`).join(', ');
    for (const el of helpers.queryAllSmart(internalsSelector, { internalsRoles: true })) {
      if (seen.has(el) || helpers.aria.getExplicitRole(el)) continue;
      let matches;
      try {
        matches = dom.matches(el, `*${CONDITIONS}`);
      } catch {
        matches = false;
      }
      if (matches && isCandidate(el)) nodes.push(el);
    }
  }

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
    // A role from a custom element's internals is no attribute to show.
    const r = el ? helpers.aria.getExplicitRole(el) : '';
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
  // collectVisibleTextUnder uses it to tell text it reads as on screen from
  // text only aria-hidden keeps out of the accessibility tree: the latter is
  // still painted, so it is part of the visible label (ACT 2ee8b8 Failed
  // Example 16, "Download <span aria-hidden>gizmo</span> specification"),
  // unless it is an icon -- see isHiddenIconText.
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
  // Returns { text, asShown }. asShown is the same text read as it shows on
  // screen: a break between two boxes that sit on one line with nothing
  // drawn between them (two touching flex items, "sure" and "a11y") joins
  // their words, as a person reads them. It is '' when no break was joined.
  function collectVisibleTextUnder(container) {
    if (!container) return { text: '', asShown: '' };
    if (!isDomVisible(container)) return { text: '', asShown: '' };

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
              ok = isAccEligible(p) ? 'shown' : isDomVisible(p) ? 'ariaHidden' : '';
              eligibleByParent.set(p, ok);
            }
            const value = String(dom.nodeValue(n) || '');
            if (ok === 'shown' || (ok === 'ariaHidden' && !isHiddenIconText(p, value, container))) {
              parts.push({ node: n, value });
            }
            continue;
          }
          if (type !== 1 || isNonRenderedTag(n) || hidden(n)) continue;
          // What a <select> or <textarea> shows is its value (its options,
          // its text), not label text.
          const childTag = String(dom.tagName(n) || '').toLowerCase();
          if (childTag === 'select' || childTag === 'textarea') continue;
          const apart = boundaryOf(n) === 'block';
          if (apart) parts.push(BOX_BREAK);
          walk(n);
          if (apart) parts.push(BOX_BREAK);
        } catch {
          // no-throws
        }
      }
    };
    if (!hidden(container)) walk(container);
    const tidy = (v) => v.replace(/\s+/g, ' ').trim();
    const text = tidy(parts.map((p) => (p === BOX_BREAK ? ' ' : p.value)).join(''));
    if (!parts.includes(BOX_BREAK) || !hasLayout(container)) return { text, asShown: '' };
    // Between two words a break separates, the whitespace is replaced by
    // what the screen shows there: nothing, or a space.
    let out = '';
    let held = '';
    let last = null;
    let broken = false;
    let anyJoined = false;
    for (const p of parts) {
      if (p === BOX_BREAK) {
        broken = true;
        continue;
      }
      if (!p.value.trim()) {
        held += p.value;
        continue;
      }
      let value = p.value;
      if (broken && last && drawnTouching(last, p.node)) {
        out = out.replace(/\s+$/, '');
        value = value.replace(/^\s+/, '');
        anyJoined = true;
      } else {
        out += broken ? ' ' : held;
      }
      out += value;
      held = '';
      broken = false;
      last = p.node;
    }
    return { text, asShown: anyJoined ? tidy(out) : '' };
  }

  const BOX_BREAK = {};

  // Whether the page is laid out (a browser), not jsdom's zero-size boxes.
  let layoutKnown = null;
  function hasLayout(node) {
    if (layoutKnown === null) {
      try {
        const root = dom.documentElement(dom.ownerDocument(node));
        const r = root && dom.getBoundingClientRect(root);
        layoutKnown = !!r && (r.width > 0 || r.height > 0);
      } catch {
        layoutKnown = false;
      }
    }
    return layoutKnown;
  }

  // The box drawn for one character of a text node: the first one that
  // isn't whitespace, or the last one with fromEnd.
  function charRect(textNode, fromEnd) {
    const value = String(dom.nodeValue(textNode) || '');
    let i = fromEnd ? value.length - 1 : 0;
    while (i >= 0 && i < value.length && /\s/.test(value[i])) i += fromEnd ? -1 : 1;
    if (i < 0 || i >= value.length) return null;
    // A surrogate pair is measured whole.
    let end = i + 1;
    if (fromEnd && i > 0 && /[\uDC00-\uDFFF]/.test(value[i])) i -= 1;
    else if (!fromEnd && /[\uD800-\uDBFF]/.test(value[i])) end += 1;
    let range = null;
    try {
      range = dom.createRange(dom.ownerDocument(textNode));
      range.setStart(textNode, i);
      range.setEnd(textNode, Math.min(end, value.length));
      const r = dom.getBoundingClientRect(range);
      return r && r.width > 0 && r.height > 0 ? r : null;
    } catch {
      return null;
    } finally {
      try {
        if (range) range.detach();
      } catch {}
    }
  }

  // Whether the last character of one piece of text and the first of the
  // next are drawn side by side on one line with no space between them: no
  // gap, margin or padding wider than a tenth of the font size (a space is
  // about a quarter). Either order counts, for right-to-left text.
  function drawnTouching(before, after) {
    const a = charRect(before, true);
    const b = charRect(after, false);
    if (!a || !b) return false;
    const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (overlap < Math.min(a.height, b.height) / 2) return false;
    const parent = dom.parentElement(after);
    const cs = parent ? computedStyleOf(parent) : null;
    const fontSize = parseFloat(cs && cs.fontSize) || 16;
    const gap = Math.max(b.left - a.right, a.left - b.right);
    return Math.abs(gap) <= Math.max(1, fontSize * 0.1);
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
    // Returns { text, asShown, source, sourceElements }, where asShown is
    // as collectVisibleTextUnder gives it, source helps reporting
    // and sourceElements (the actual DOM nodes the visible text came from)
    // lets the icon-font check below look at the right element's own style.
    // Source policy (deterministic):
    // 1) <label> association for form controls
    // 2) visible text inside the element
    // 3) visible text from aria-labelledby referenced elements
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
        if (t.text) {
          labelParts.push(t);
          contributing.push(l);
        }
      }
      if (labelParts.length)
        return { ...joinTexts(labelParts), source: 'label', sourceElements: contributing };
    }

    // 2) Text inside the control itself. Not for <select> or <textarea>:
    //    what shows inside them is a value (the chosen option, what the
    //    user typed), not a label, and neither takes its name from content.
    const own =
      tn === 'select' || tn === 'textarea'
        ? { text: '', asShown: '' }
        : collectVisibleTextUnder(el);
    if (own.text) return { ...own, source: 'self', sourceElements: [el] };

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
          if (t.text) {
            parts.push(t);
            contributing.push(ref);
          }
        }
        if (parts.length)
          return {
            ...joinTexts(parts),
            source: 'aria-labelledby',
            sourceElements: contributing
          };
      }
    } catch {
      // ignore
    }

    return { text: '', asShown: '', source: 'none', sourceElements: [] };
  }

  // Several labels' texts joined in order, in both readings.
  function joinTexts(texts) {
    const tidy = (v) => v.join(' ').replace(/\s+/g, ' ').trim();
    const asShown = texts.some((t) => t.asShown);
    return {
      text: tidy(texts.map((t) => t.text)),
      asShown: asShown ? tidy(texts.map((t) => t.asShown || t.text)) : ''
    };
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

  // Text under aria-hidden that is painted but is not words a user would
  // speak: an icon-font ligature ("format_color_fill" drawn as a glyph), or
  // a chunk of symbols and punctuation (an arrow, a separator, an emoji).
  // An icon font is recognised by its family where its style sheet loaded,
  // and otherwise by the conventions icon sets use: an icon class on the
  // element or an ancestor inside the control, or a snake_case ligature name.
  function isHiddenIconText(parent, text, container) {
    const t = String(text || '').trim();
    if (!t) return true;
    if (!/[\p{L}\p{N}]/u.test(t)) return true;
    if (/^[a-z0-9]+(?:_[a-z0-9]+)+$/.test(t)) return true;
    for (let node = parent, depth = 0; node && depth < 6; depth += 1) {
      if (isIconFontElement(node)) return true;
      const cls = String(dom.getAttribute(node, 'class') || '');
      if (/(?:^|[\s_-])(?:icons?|glyph(?:icon)?s?|symbols?|fa[srbl]?)(?:$|[\s_-])/i.test(cls)) {
        return true;
      }
      if (node === container) break;
      node = dom.parentElement(node);
    }
    return false;
  }

  function isIconFontElement(node) {
    return iconFontFamilyOf(node) !== '';
  }

  // The known icon font a node's font-family names, or ''.
  function iconFontFamilyOf(node) {
    if (!node) return '';
    const cs = computedStyleOf(node);
    if (!cs) return '';
    let family;
    try {
      family =
        cs.fontFamily || (cs.getPropertyValue ? cs.getPropertyValue('font-family') : '') || '';
    } catch {
      family = '';
    }
    if (!family) return '';
    const names = String(family)
      .split(',')
      .map((s) =>
        s
          .trim()
          .replace(/^['"]|['"]$/g, '')
          .toLowerCase()
      );
    return names.find((n) => ICON_FONT_FAMILIES.has(n)) || '';
  }

  // Whether the page has loaded a font face of that family: true, false
  // when none is loaded, null when the page does not say (no font set).
  function iconFontLoaded(family, node) {
    try {
      const fonts = dom.fonts(dom.ownerDocument(node));
      if (!fonts || typeof fonts.forEach !== 'function') return null;
      let loaded = false;
      fonts.forEach((face) => {
        const f = String((face && face.family) || '')
          .trim()
          .replace(/^['"]|['"]$/g, '')
          .toLowerCase();
        if (f === family && face.status === 'loaded') loaded = true;
      });
      return loaded;
    } catch {
      return null;
    }
  }

  // Text an icon font draws as one glyph: a ligature name ("search",
  // "arrow_back") or characters from the Private Use Area.
  function isLigatureOrPua(text) {
    const t = String(text || '').trim();
    return /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(t) || /^[\uE000-\uF8FF]+$/u.test(t);
  }

  // Which way a single visible character points: the letter x (a common
  // close icon) or a symbol stands for an icon; a digit is text a user
  // would say. Other letters give no direction. (A symbol alone has no
  // words to compare, so it is not reported; it is read here all the same.)
  function symbolicCharacterKind(text) {
    const c = Array.from(norm(text))[0] || '';
    if (c === 'x') return 'letter-x';
    if (/^[\p{S}\p{P}]$/u.test(c)) return 'symbol';
    if (/^\p{N}$/u.test(c)) return 'digit';
    return '';
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
    // A label of symbols only ("×", "+", "»") has no words to look for, and
    // was counted as contained. One the name doesn't hold is asked about as a
    // symbol standing for an icon, as a single "X" is.
    const symbolsOnly = labelTokens.length === 0 && accNorm.indexOf(visibleNorm) === -1;
    // The label as the screen shows it counts too: touching flex items
    // "sure" and "a11y" read "surea11y" to a person, though the box break
    // splits the visible text into two words.
    const asShown = labelInfo.asShown ? String(labelInfo.asShown) : '';
    const contains =
      !symbolsOnly &&
      (containsWordRun(labelTokens, nameTokens, null) ||
        (!!asShown && containsWordRun(tokenize(asShown, false), nameTokens, null)));

    // An abbreviation, a word hyphenated differently, or visible text that
    // may not be literal text at all (an icon-font glyph, a single symbolic
    // character) is not something markup settles: the author may have meant
    // either. Report without asserting a defect instead of failing or
    // staying silent.
    let uncertainReason = '';
    if (symbolsOnly) {
      uncertainReason = 'POSSIBLE_SYMBOLIC_CHARACTER';
    } else if (!contains) {
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

    // Which way the evidence points, for the shapes where it points one way.
    let lean = null;
    if (uncertainReason === 'HYPHENATION_DIFFERS') {
      lean = {
        toward: 'pass',
        why: 'The name holds the label’s words once hyphens are ignored, so the label’s meaning is unchanged.',
        signals: [{ signal: 'words-equal-without-hyphens', value: true }],
        caution:
          'Speech input may need the hyphenated word said differently ("e mail" against "email").',
        i18n: {
          whyKey: 'labelInName_lean_why_hyphenation',
          cautionKey: 'labelInName_lean_caution_hyphenation'
        }
      };
    } else if (uncertainReason === 'POSSIBLE_ABBREVIATION') {
      // A stem of one or two letters ("N.", "No.") starts too many words to
      // stand for the one in the name; three or more ("Ave.", "Dept.") does.
      const longStems = new Set(
        [...abbreviatedWords(visibleLabel)].filter((w) => Array.from(w).length >= 3)
      );
      if (longStems.size && containsWordRun(labelTokens, nameTokens, longStems)) {
        lean = {
          toward: 'pass',
          why: 'Each shortened word in the label starts the matching word in the name, as a conventional abbreviation does ("Ave." for "Avenue").',
          signals: [
            { signal: 'abbreviation-prefix-match', value: true },
            {
              signal: 'shortest-abbreviation-stem',
              value: Math.min(...[...longStems].map((w) => Array.from(w).length))
            }
          ],
          caution: 'A speech user may say the abbreviation as shown rather than the full word.',
          i18n: {
            whyKey: 'labelInName_lean_why_abbreviation',
            cautionKey: 'labelInName_lean_caution_abbreviation'
          }
        };
      }
    } else if (uncertainReason === 'POSSIBLE_ICON_FONT_GLYPH') {
      // ACT 2ee8b8 passes a ligature drawn as an icon; only when the page
      // has loaded the font, else the word itself is drawn.
      const source = (labelInfo.sourceElements || []).find(isIconFontElement);
      const family = iconFontFamilyOf(source);
      if (isLigatureOrPua(visibleLabel) && iconFontLoaded(family, source) === true) {
        lean = {
          toward: 'pass',
          why: 'The label is an icon font’s ligature or symbol code, drawn as an icon, so it shows no readable words.',
          signals: [
            { signal: 'icon-font-family', value: family },
            { signal: 'ligature-or-pua-text', value: true },
            { signal: 'icon-font-loaded', value: true }
          ],
          caution:
            'If the font fails to load for a user, the word itself is drawn and becomes a visible label.',
          i18n: {
            whyKey: 'labelInName_lean_why_iconFont',
            cautionKey: 'labelInName_lean_caution_iconFont'
          }
        };
      }
    } else if (uncertainReason === 'POSSIBLE_SYMBOLIC_CHARACTER') {
      const kind = symbolicCharacterKind(visibleLabel);
      if (kind === 'letter-x' || kind === 'symbol') {
        lean = {
          toward: 'pass',
          why: 'The label is a single symbol or an "X", which stands for an icon rather than words to say.',
          signals: [{ signal: 'character-kind', value: kind }],
          caution: 'A user may still say the character ("X") to reach the control.',
          i18n: {
            whyKey: 'labelInName_lean_why_symbol',
            cautionKey: 'labelInName_lean_caution_symbol'
          }
        };
      } else if (kind === 'digit') {
        lean = {
          toward: 'fail',
          why: 'The label is a digit, text a speech user would say, and the name does not contain it.',
          signals: [{ signal: 'character-kind', value: kind }],
          caution: 'The name may spell the number out in words, which some speech input matches.',
          i18n: {
            whyKey: 'labelInName_lean_why_digit',
            cautionKey: 'labelInName_lean_caution_digit'
          }
        };
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
                ...(lean ? { lean } : null),
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
