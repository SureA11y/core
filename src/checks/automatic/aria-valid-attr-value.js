/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-valid-attr-value
 * @atomic true
 * @summary Every recognized aria-* attribute must have a value matching its declared type
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to any element carrying at least one recognized aria-* attribute
 *   (unrecognized attribute names are aria-valid-attr's concern,
 *   not evaluated here).
 * @expectation
 *   Each attribute's value conforms to its WAI-ARIA-declared value type:
 *   boolean ("true"/"false"), tristate ("true"/"false"/"mixed"), a token
 *   from a fixed enumerated set, an integer (within the range WAI-ARIA sets
 *   for it), a real number, or an ID reference (list) that resolves to an
 *   existing element in the document. Boolean, tristate and token values
 *   are read in any case, as Chromium reads them (aria-checked="TRUE" is
 *   checked).
 *   Per ACT 6a7281's own applicability ("any state or property that is
 *   NOT empty"), an explicitly empty value, including a bare boolean-style
 *   attribute with no "=value" at all, e.g. `aria-checked` alone, is out
 *   of scope for every value type, not a violation: a common, deliberate
 *   pattern in templated markup (e.g. React conditionally rendering
 *   `aria-describedby={hasError ? errorId : ''}`).
 *   Some attributes also constrain each other, checked once each is
 *   valid on its own:
 *   - On an element whose role is slider, scrollbar, progressbar, meter,
 *     separator or spinbutton: `aria-valuemin` greater than
 *     `aria-valuemax` fails (`ARIA_VALUE_RANGE_INVERTED`), and so does an
 *     `aria-valuenow` outside the range (`ARIA_VALUENOW_OUT_OF_RANGE`),
 *     since the browser then gives assistive technology the nearest end of
 *     the range instead (Chromium announces 10 for 50 of 0 to 10). The range
 *     is the stated one; else a native element's own (a `<progress>`,
 *     `<meter>`, range or number input, by its `min` and `max`), as
 *     HTML-AAM maps it; else ARIA's defaults of 0 and 100, except on a
 *     spinbutton, which has none. With `aria-valuetext`, which is announced
 *     in place of the number, the value is not compared.
 *   - `aria-posinset` greater than `aria-setsize` fails
 *     (`ARIA_POSINSET_EXCEEDS_SETSIZE`); a set size of -1 (unknown) is
 *     left alone.
 *   - `aria-haspopup` whose popup, an element `aria-controls` names (or one
 *     inside it), has another role: cantTell
 *     (`ARIA_HASPOPUP_ROLE_MISMATCH`), as a script may show another popup.
 *     `true` means `menu`. Compared only when a named element has a role.
 *   - `aria-activedescendant` naming an element that is neither inside the
 *     element nor inside one it names in `aria-owns` or `aria-controls`:
 *     cantTell (`ARIA_ACTIVEDESCENDANT_OUTSIDE`). A combobox is left out,
 *     as its options are in the popup it controls.
 * @reports
 *   - `attr`: the attribute whose value is not valid.
 *   - `value`: its value as written.
 *   - `valueReason`: what is wrong with it. On a FAIL: `expected-true-false`,
 *     `expected-true-false-undefined`, `expected-true-false-mixed`,
 *     `expected-integer`, `expected-number` or `invalid-token` when it is not
 *     of the attribute's type, `integer-out-of-range` when it is below the
 *     lowest value ARIA allows, `expected-single-idref` when an attribute
 *     taking one id holds several, `idref-not-found` when
 *     aria-activedescendant's id matches no element. On a CANTTELL:
 *     `idref-list-none-found` when none of the ids in a list matches an
 *     element, `idref-controls-not-found` for the same on aria-controls.
 *   - For the constraints between attributes, the values compared:
 *     `role`, `valuenow`, `valuemin`, `valuemax` (the range used, defaults
 *     included); `posinset`, `setsize`; `haspopup`, `expectedRole`,
 *     `popupRole`; `activedescendant`.
 * @reason-codes
 *   - `ARIA_ATTR_VALUE_INVALID` (fail): an aria-* attribute whose value is not
 *     of the type WAI-ARIA defines for it, is below its lowest allowed value,
 *     or, for aria-activedescendant, names no element.
 *     Basis: WCAG 4.1.2; ACT 6a7281; WAI-ARIA 1.2 state and property value
 *     types.
 *   - `ARIA_ATTR_VALUE_TARGET_ABSENT` (cantTell): an id reference list, such as
 *     aria-describedby or aria-controls, none of whose ids matches an element;
 *     a script may add it later.
 *     It leans fail when an element with the id exists in another document
 *     tree (across a shadow root), or one with an id differing only in case
 *     or one character, digits aside, exists in the same tree.
 *     Basis: WCAG 4.1.2 (not settled); ACT 6a7281; WAI-ARIA 1.2 ID reference
 *     list.
 *   - `ARIA_VALUE_RANGE_INVERTED` (fail): a range widget whose aria-valuemin is
 *     greater than its aria-valuemax.
 *     Basis: WCAG 4.1.2; WAI-ARIA 1.2 aria-valuemin; WAI-ARIA 1.2
 *     aria-valuemax.
 *   - `ARIA_VALUENOW_OUT_OF_RANGE` (fail): a range widget whose aria-valuenow
 *     is outside its range, so assistive technology is given the nearest end of
 *     the range instead.
 *     Basis: WCAG 4.1.2; WAI-ARIA 1.2 aria-valuenow; HTML-AAM.
 *   - `ARIA_POSINSET_EXCEEDS_SETSIZE` (fail): an element whose aria-posinset is
 *     greater than its aria-setsize.
 *     Basis: WCAG 4.1.2; WAI-ARIA 1.2 aria-posinset (MUST).
 *   - `ARIA_HASPOPUP_ROLE_MISMATCH` (cantTell): the element aria-controls names
 *     has another role than the popup aria-haspopup announces; a script may
 *     show another popup.
 *     It leans fail when aria-controls names that one element and it is shown,
 *     or aria-expanded is true: the popup that is open has another role.
 *     Basis: WAI-ARIA 1.2 aria-haspopup (MUST); WCAG 4.1.2 (not settled).
 *   - `ARIA_ACTIVEDESCENDANT_OUTSIDE` (cantTell): aria-activedescendant names
 *     an element that is neither inside the element nor inside one it owns or
 *     controls.
 *     Basis: WAI-ARIA 1.2 aria-activedescendant; WCAG 4.1.2 (not settled).
 * @implementation-notes
 * - Not rule-gated on isAccTreeEligible: this remains a static-markup
 *   property, while engine-level hidden-subtree filtering still applies
 *   unless engineOptions.includeHiddenElements is true.
 * - ID-reference resolution (see aria-helpers.js's idExists) only considers
 *   idref-list attributes (aria-labelledby, aria-describedby,
 *   aria-controls, aria-owns, etc.) when NONE of the space-separated ids
 *   resolve, a partially-dangling list (some ids exist, some don't) is
 *   left unflagged (only invalidate when every token fails to resolve).
 *   Of the two single-idref attributes, aria-activedescendant is flagged
 *   whenever its one id doesn't resolve; aria-errormessage's existence is
 *   never checked (format only), ACT 6a7281's own Background
 *   text names it as a non-required property whose target "may be created
 *   in response to an event that may or may not happen" (a validation
 *   error message rendered only once the error actually occurs).
 * - An idref list that resolves to nothing is a `cantTell`, never a fail.
 *   The element falls back to its other name and description sources (a
 *   <button aria-describedby="nope">Save</button> is still named "Save"),
 *   so whether anything was lost depends on what the reference was meant
 *   to add, and the target may be created later. aria-controls goes one
 *   step further: a collapsed widget (aria-expanded="false" or
 *   aria-selected="false") passes outright, since the absence of the
 *   controlled element is exactly what that state means. A name that goes
 *   missing because of a dangling aria-labelledby is reported by the name
 *   rules.
 * - Integers are also checked against the lower bounds WAI-ARIA 1.2 sets:
 *   aria-level, aria-posinset, aria-colindex, aria-rowindex and
 *   aria-colspan at least 1, aria-rowspan at least 0, aria-setsize at
 *   least 1 or exactly -1.
 * - Two tiers in one run means helpers.resolveTieredOutcome decides the
 *   aggregate: a real fail elsewhere on the page still reports fail, and
 *   the aria-controls occurrences ride along rather than being dropped.
 */

const id = 'aria-valid-attr-value';

const meta = {
  title: 'aria-* attribute values must match their declared type',
  description:
    'Checks that every recognized aria-* attribute has a value conforming to its WAI-ARIA-declared value type (boolean, tristate, token, integer, number, or ID reference).',
  i18n: {
    titleKey: 'ariaValidAttrValue_title',
    descriptionKey: 'ariaValidAttrValue_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'aria', 'structure', 'atomic', 'automatic'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '4.1.2',
      title: 'Name, Role, Value',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['aria-attr-value-valid'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }
  function roleOf(el) {
    try {
      return trim(ariaHelpers.getAuthorRole(el)).toLowerCase();
    } catch {
      return '';
    }
  }
  // The attribute's value as a number, when it is present and valid on its
  // own (an invalid one is reported above, not compared here).
  function numberOf(el, name) {
    const raw = dom.getAttribute(el, name);
    if (raw == null || trim(raw) === '') return null;
    if (!ariaHelpers.validateAttrValue(name, raw, el).valid) return null;
    const n = Number(trim(raw));
    return Number.isFinite(n) ? n : null;
  }

  // Roles whose range ARIA gives defaults for (0 and 100), which Chromium
  // applies; a spinbutton has none, so only the bounds the page states count.
  const RANGE_DEFAULTS = new Set(['slider', 'scrollbar', 'progressbar', 'meter', 'separator']);
  const RANGE_ROLES = new Set([
    'slider',
    'scrollbar',
    'progressbar',
    'meter',
    'separator',
    'spinbutton'
  ]);
  // The range a native element gives itself (HTML-AAM maps it to
  // aria-valuemin and aria-valuemax, and ARIA lets host language values
  // take precedence over ARIA's defaults): a <progress> runs from 0 to its
  // max (1 by default), a <meter> from its min to its max (0 and 1), a
  // range input from its min to its max (0 and 100), and a number input
  // has only the bounds it states. Null for any other element.
  function nativeRange(el) {
    const tag = String(dom.localName(el) || '').toLowerCase();
    const num = (name) => {
      const raw = trim(dom.getAttribute(el, name));
      if (raw === '' || !/^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(raw)) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    };
    if (tag === 'progress') {
      const max = num('max');
      return { min: 0, max: max != null && max > 0 ? max : 1 };
    }
    const type = tag === 'input' ? trim(dom.getAttribute(el, 'type')).toLowerCase() : '';
    if (tag !== 'meter' && type !== 'range' && type !== 'number') return null;
    const statedMin = num('min');
    const statedMax = num('max');
    if (type === 'number') return { min: statedMin, max: statedMax };
    const min = statedMin != null ? statedMin : 0;
    const max = statedMax != null ? statedMax : tag === 'meter' ? 1 : 100;
    return { min, max: max < min ? min : max };
  }

  // aria-haspopup's value and the role its popup must have.
  const POPUP_ROLES = {
    true: 'menu',
    menu: 'menu',
    listbox: 'listbox',
    tree: 'tree',
    grid: 'grid',
    dialog: 'dialog'
  };

  function relationOccurrence(
    el,
    fail,
    code,
    key,
    summary,
    hint,
    params,
    details,
    uncertainty,
    lean
  ) {
    const o = {
      summary,
      hint,
      i18n: {
        summaryKey: `ariaValidAttrValue_summary_${fail ? 'fail' : 'cantTell'}_${key}`,
        hintKey: `ariaValidAttrValue_hint_${fail ? 'fail' : 'cantTell'}_${key}`,
        params
      },
      data: { details: { reasonCode: code, ...details } }
    };
    if (uncertainty) o.uncertainty = uncertainty;
    if (lean) o.lean = lean;
    return { fail, occurrence: helpers.reportOccurrence(el, o) };
  }

  // Reasons the engine gives for content that is not drawn, or kept from
  // assistive technology.
  const UNSEEN = new Set([
    'displayNone',
    'hiddenAttr',
    'visibilityHidden',
    'detailsClosed',
    'contentVisibilityHidden',
    'templateContent',
    'nonRenderedElement',
    'ariaHidden'
  ]);
  function isShown(ref) {
    try {
      const info = helpers.isAccTreeEligible(ref);
      const reasons = info && info.eligible === false ? info.reasons || [] : [];
      if (reasons.some((r) => UNSEEN.has(r))) return false;
      return !(typeof helpers.isVisuallyHidden === 'function' && helpers.isVisuallyHidden(ref));
    } catch {
      return false;
    }
  }

  // Which way a popup role mismatch points: when aria-controls names one
  // element and that popup is open (shown, or aria-expanded="true"), its
  // role is the one users meet, and it is not the one announced.
  function haspopupLean(el, refs) {
    const ids = trim(dom.getAttribute(el, 'aria-controls')).split(/\s+/).filter(Boolean);
    if (ids.length !== 1 || refs.length !== 1) return null;
    const expanded = trim(dom.getAttribute(el, 'aria-expanded')).toLowerCase() === 'true';
    const shown = isShown(refs[0].ref);
    if (!expanded && !shown) return null;
    return {
      toward: 'fail',
      why: 'The popup this element controls is open and has another role than aria-haspopup announces.',
      signals: [
        { signal: 'single-controls-id', value: true },
        { signal: 'popup-shown', value: shown },
        { signal: 'aria-expanded-true', value: expanded }
      ],
      caution: 'The widget may open a different popup, placed elsewhere in the page.',
      i18n: {
        whyKey: 'ariaValidAttrValue_lean_why_haspopupOpen',
        cautionKey: 'ariaValidAttrValue_lean_caution_haspopupOpen'
      }
    };
  }

  // Whether one edit (insert, delete, replace, or swap two neighbours) turns
  // a into b, for a !== b. Linear: a full edit-distance table for every id
  // on the page made this rule take half a second on a page of 3,000 ids.
  function oneEditApart(a, b) {
    if (a.length > b.length) [a, b] = [b, a];
    if (b.length - a.length > 1) return false;
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    if (a.length < b.length) return a.slice(i) === b.slice(i + 1);
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }

  // Every element with an id, in the document and its open shadow roots,
  // by id, with its root node; built once, on the first reference that
  // resolves to nothing.
  let idIndex = null;
  function elementsWithIds() {
    if (idIndex) return idIndex;
    idIndex = [];
    try {
      const all =
        typeof helpers.queryAllDeep === 'function'
          ? helpers.queryAllDeep('[id]')
          : dom.querySelectorAll(document, '[id]');
      for (const e of all) {
        const v = dom.getAttribute(e, 'id');
        if (!v) continue;
        let root;
        try {
          root = dom.getRootNode(e);
        } catch {}
        const value = String(v);
        idIndex.push({ id: value, lower: value.toLowerCase(), el: e, root });
      }
    } catch {}
    return idIndex;
  }
  // An id that differs from the wanted one only in case, or by one
  // character other than a digit (item-2 for item-3 is another item, not a
  // misspelling); short ids are left out.
  function isNearMiss(entry, wanted, wantedLower) {
    const found = entry.id;
    if (found === wanted) return false;
    if (entry.lower === wantedLower) return true;
    if (Math.min(found.length, wanted.length) < 4) return false;
    if (Math.abs(found.length - wanted.length) > 1) return false;
    if (/\d/.test(found) && found.replace(/\d+/g, '#') === wanted.replace(/\d+/g, '#'))
      return false;
    return oneEditApart(found, wanted);
  }

  // Which way a reference to no element points: a target that exists in
  // another tree can never be reached, and a near-miss id in the same tree
  // shows a misspelling. Otherwise a script may still add the element.
  function targetAbsentLean(el, value) {
    const ids = trim(value).split(/\s+/).filter(Boolean);
    if (!ids.length) return null;
    let root = null;
    try {
      root = dom.getRootNode(el);
    } catch {}
    let otherTree = false;
    let nearMiss = '';
    const lowers = ids.map((wanted) => wanted.toLowerCase());
    for (const entry of elementsWithIds()) {
      const sameTree = entry.root === undefined || entry.root === root;
      for (let k = 0; k < ids.length; k++) {
        const wanted = ids[k];
        if (!sameTree && entry.id === wanted) otherTree = true;
        else if (sameTree && !nearMiss && isNearMiss(entry, wanted, lowers[k])) nearMiss = entry.id;
      }
    }
    if (otherTree) {
      return {
        toward: 'fail',
        why: 'An element with this id exists, but in another document tree (across a shadow root), where the reference can never reach it.',
        signals: [{ signal: 'id-in-other-tree', value: true }],
        caution: 'The component may still create its own element with this id.',
        i18n: {
          whyKey: 'ariaValidAttrValue_lean_why_otherTree',
          cautionKey: 'ariaValidAttrValue_lean_caution_otherTree'
        }
      };
    }
    if (nearMiss) {
      return {
        toward: 'fail',
        why: 'An element whose id differs only by case or one character exists, so the reference is probably misspelled.',
        signals: [{ signal: 'near-miss-id', value: nearMiss }],
        caution: 'A script may still add an element with the exact id.',
        i18n: {
          whyKey: 'ariaValidAttrValue_lean_why_nearMiss',
          cautionKey: 'ariaValidAttrValue_lean_caution_nearMiss'
        }
      };
    }
    return null;
  }

  // Constraints ARIA sets between attributes, each valid on its own: a
  // range, a position in a set, a popup's role, an active descendant's
  // place. Only read when the attributes are there, so most elements cost
  // a few attribute lookups.
  function relationFindings(el) {
    const out = [];
    const has = (name) => dom.hasAttribute(el, name);

    if (has('aria-valuenow') || (has('aria-valuemin') && has('aria-valuemax'))) {
      const role = roleOf(el);
      if (RANGE_ROLES.has(role)) {
        const defaults = RANGE_DEFAULTS.has(role);
        const native = nativeRange(el);
        const statedMin = numberOf(el, 'aria-valuemin');
        const statedMax = numberOf(el, 'aria-valuemax');
        const min = statedMin != null ? statedMin : native ? native.min : defaults ? 0 : null;
        const max = statedMax != null ? statedMax : native ? native.max : defaults ? 100 : null;
        const now = numberOf(el, 'aria-valuenow');
        if (statedMin != null && statedMax != null && statedMin > statedMax) {
          out.push(
            relationOccurrence(
              el,
              true,
              'ARIA_VALUE_RANGE_INVERTED',
              'rangeInverted',
              `This element’s aria-valuemin (${statedMin}) is greater than its aria-valuemax (${statedMax}).`,
              'Set aria-valuemin to the lowest value and aria-valuemax to the highest.',
              { min: String(statedMin), max: String(statedMax) },
              { role, valuemin: statedMin, valuemax: statedMax }
            )
          );
        } else if (
          now != null &&
          !trim(dom.getAttribute(el, 'aria-valuetext')) &&
          ((min != null && now < min) || (max != null && now > max))
        ) {
          out.push(
            relationOccurrence(
              el,
              true,
              'ARIA_VALUENOW_OUT_OF_RANGE',
              'valueOutOfRange',
              `This element’s aria-valuenow (${now}) is outside its range, so assistive technology is given another value.`,
              'Keep aria-valuenow between aria-valuemin and aria-valuemax, or widen the range.',
              {
                now: String(now),
                min: String(min != null ? min : ''),
                max: String(max != null ? max : '')
              },
              { role, valuenow: now, valuemin: min, valuemax: max }
            )
          );
        }
      }
    }

    if (has('aria-posinset') && has('aria-setsize')) {
      const pos = numberOf(el, 'aria-posinset');
      const size = numberOf(el, 'aria-setsize');
      if (pos != null && size != null && size >= 1 && pos > size) {
        out.push(
          relationOccurrence(
            el,
            true,
            'ARIA_POSINSET_EXCEEDS_SETSIZE',
            'posinsetExceedsSetsize',
            `This element’s aria-posinset (${pos}) is greater than its aria-setsize (${size}).`,
            'Give each item a position no greater than the size of its set.',
            { posinset: String(pos), setsize: String(size) },
            { posinset: pos, setsize: size }
          )
        );
      }
    }

    if (has('aria-haspopup') && has('aria-controls')) {
      const value = trim(dom.getAttribute(el, 'aria-haspopup')).toLowerCase();
      const expected = POPUP_ROLES[value];
      if (expected) {
        const refs = helpers.resolveIdRefs(dom.getAttribute(el, 'aria-controls'), ctx, {}, el).refs;
        const roles = refs
          .map((r) => {
            let role = roleOf(r);
            if (!role) {
              try {
                role = trim(helpers.getRoleInfo(r, ctx).role).toLowerCase();
              } catch {}
            }
            return { ref: r, role };
          })
          .filter((r) => r.role);
        const matches = (r) =>
          r.role === expected ||
          !!dom.querySelector(
            r.ref,
            expected === 'dialog' ? '[role~="dialog" i], dialog' : `[role~="${expected}" i]`
          );
        if (roles.length && !roles.some(matches)) {
          out.push(
            relationOccurrence(
              el,
              false,
              'ARIA_HASPOPUP_ROLE_MISMATCH',
              'haspopupMismatch',
              `aria-haspopup="${value}" announces one kind of popup, but the element it controls has the role ${roles[0].role}.`,
              'Make aria-haspopup name the popup’s role, or check whether a script shows another popup.',
              { haspopup: value, role: roles[0].role },
              { haspopup: value, expectedRole: expected, popupRole: roles[0].role },
              {
                code: 'runtime-dependent',
                needed: 'Whether the popup that opens has the role aria-haspopup names.'
              },
              haspopupLean(el, roles)
            )
          );
        }
      }
    }

    if (has('aria-activedescendant')) {
      const idValue = trim(dom.getAttribute(el, 'aria-activedescendant'));
      const target = idValue ? helpers.getElementByIdInTree(el, idValue) : null;
      if (target && target !== el && !dom.contains(el, target) && roleOf(el) !== 'combobox') {
        const reaches = (attr) =>
          trim(dom.getAttribute(el, attr)) &&
          helpers
            .resolveIdRefs(dom.getAttribute(el, attr), ctx, {}, el)
            .refs.some((r) => r === target || dom.contains(r, target));
        if (!reaches('aria-owns') && !reaches('aria-controls')) {
          out.push(
            relationOccurrence(
              el,
              false,
              'ARIA_ACTIVEDESCENDANT_OUTSIDE',
              'activedescendantOutside',
              'This element’s aria-activedescendant points at an element that is neither inside it nor owned by it.',
              'Point aria-activedescendant at one of the element’s own items, or own the item with aria-owns.',
              { id: idValue },
              { activedescendant: idValue },
              {
                code: 'spec-only',
                needed: 'Whether assistive technology announces the active item for this element.'
              }
            )
          );
        }
      }
    }

    return out;
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('*') : helpers.queryAll('*');

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.attributes(el) || !dom.get(el, 'getAttribute')) continue;

    let invalid = null;
    let review = null;
    const attrs = dom.attributes(el);
    for (let i = 0; i < attrs.length; i++) {
      const name = String(attrs[i].name || '').toLowerCase();
      if (name.slice(0, 5) !== 'aria-') continue;
      if (!ariaHelpers.isValidAriaAttrName(name)) continue; // aria-valid-attr's concern

      applicableCount += 1;

      const rawValue = dom.getAttribute(el, name);
      const result = ariaHelpers.validateAttrValue(name, rawValue, el);
      if (result.valid) continue;

      const item = {
        name,
        value: rawValue == null ? '' : String(rawValue),
        reason: result.reason
      };

      if (result.review) {
        if (!review) review = [];
        review.push(item);
      } else {
        if (!invalid) invalid = [];
        invalid.push(item);
      }
    }

    if (!invalid) {
      for (const finding of relationFindings(el)) {
        (finding.fail ? failOccurrences : cantTellOccurrences).push(finding.occurrence);
      }
    }

    for (const item of invalid || []) {
      failOccurrences.push(
        helpers.reportOccurrence(el, {
          summary: 'This element has an ARIA attribute with an invalid value.',
          hint: 'Use a value of the type this attribute expects, as the WAI-ARIA specification defines it.',
          i18n: {
            summaryKey: 'ariaValidAttrValue_summary_fail',
            hintKey: 'ariaValidAttrValue_hint_fail',
            params: { attr: item.name, value: item.value }
          },
          data: {
            details: {
              reasonCode: 'ARIA_ATTR_VALUE_INVALID',
              attr: item.name,
              value: item.value,
              valueReason: item.reason
            }
          }
        })
      );
    }

    for (const item of review || []) {
      const controls = item.name === 'aria-controls';
      const lean = targetAbsentLean(el, item.value);
      cantTellOccurrences.push(
        helpers.reportOccurrence(el, {
          summary:
            'No element with this id exists right now, so the engine cannot tell whether this reference is wrong.',
          hint: controls
            ? 'Check that the element it refers to is added when the widget opens; if it never is, fix or remove the reference.'
            : 'Check whether an element with this id is added later. If not, correct or remove the reference; until then the element uses its other name or description sources.',
          i18n: {
            summaryKey: 'ariaValidAttrValue_summary_cantTell_idref',
            hintKey: controls
              ? 'ariaValidAttrValue_hint_cantTell_idref'
              : 'ariaValidAttrValue_hint_cantTell_idrefList',
            params: { attr: item.name, value: item.value }
          },
          uncertainty: {
            code: 'runtime-dependent',
            needed: controls
              ? 'Whether the widget creates the referenced element when it opens.'
              : 'Whether the referenced element is added later, and whether its absence loses a name, description or relationship.',
            evidence: {
              attribute: item.name,
              referencedId: item.value,
              resolvedAtScanTime: false
            }
          },
          ...(lean ? { lean } : {}),
          data: {
            details: {
              reasonCode: 'ARIA_ATTR_VALUE_TARGET_ABSENT',
              attr: item.name,
              value: item.value,
              valueReason: item.reason
            }
          }
        })
      );
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // See helpers.resolveTieredOutcome's own header comment
  // (src/core/dom-helpers.js): a fail-tier finding never silently discards
  // cantTell-tier findings from the same run.
  const resolved = helpers.resolveTieredOutcome(
    failOccurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'serious'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
