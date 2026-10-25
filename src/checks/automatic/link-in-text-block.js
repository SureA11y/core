/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check link-in-text-block
 * @atomic true
 * @summary Links surrounded by text must be distinguishable from that text by non-color means
 * @standard WCAG 2.2
 * @sc 1.4.1
 * @applicability
 *   Applies to links (`<a href>` and elements whose role attribute resolves
 *   to link: its first known role token, in any case, is `link`) that draw
 *   text (text other than white space in the link's flat tree and, where the
 *   page has a layout, a box with some area) and whose immediate parent
 *   element also has text with a letter or a digit beside
 *   it: a direct-child text node, or text in an inline element on the same
 *   line that is not a link, is not drawn invisibly, and is not an item of
 *   a flex or grid parent (i.e. the link sits inline within a run of
 *   plain text, not as a standalone item, e.g. not the sole content of a
 *   <li> nav item, nor one of a row of links separated by "|" or "·").
 *   A custom element whose ElementInternals give it the link role
 *   (this.attachInternals().role), with no role attribute naming another,
 *   counts as a native element with that role does.
 * @expectation
 *   A link inside a text block must be visually distinguishable from the
 *   surrounding text by at least one non-color means:
 *     - text-decoration: underline, OR
 *     - a different font-weight or font-style than the surrounding text, OR
 *     - another visible mark on the link itself: a border, box-shadow or
 *       outline, a background color different from the surrounding one, a
 *       background image, an image or svg inside it, or a ::before/::after
 *       that draws something (content of its own, or an empty box painting
 *       a background, border, outline or shadow, as an underline drawn
 *       that way does), OR
 *     - a mark on all of its content: bold, italic, underlined, bordered,
 *       a background unlike the surrounding text's (a code chip, <mark>),
 *       or raised or lowered (a footnote's <sup>).
 *   A link with none of these is distinguished by color alone. When its
 *   color contrasts with the surrounding text by at least 3:1, technique
 *   G183 is met only if hover and focus also bring a non-color cue, which
 *   a static scan cannot see, so the link is reported as cantTell. Below
 *   3:1, with contrast confidently computable, color is demonstrably the
 *   only cue and the link fails.
 *   Margin (`contrast-ratio`): of the links told apart by color alone that
 *   reach 3:1, the one closest to it, with its ratio unrounded. Those links
 *   are also asked about (the hover and focus cue), so the margin appears on
 *   a cantTell or fail result. Only a link within 10% of 3:1 (up to 3.3:1)
 *   counts as close. `measuredCount` counts the links whose only cue is
 *   color.
 * @reports
 *   - `metrics.ratio` (a link set apart by color only): the contrast
 *     between the link's text color and the surrounding text's, as a ratio
 *     (3 for 3:1), against `metrics.threshold` (3).
 *   - `colors.linkForegroundHex`, `colors.surroundingTextForegroundHex` (a
 *     link set apart by color only): the link's text color and the
 *     surrounding text's, as hex.
 * @reason-codes
 *   - `COLOR_ONLY_DIFFERENTIATION` (fail): a link in a block of text is told
 *     apart from the surrounding text by color alone, with less than 3:1
 *     contrast between the two.
 *     Basis: WCAG 1.4.1; F73; G183.
 *   - `LINK_COLOR_CONTRAST_ONLY` (cantTell): a link in a block of text is
 *     told apart by color alone at 3:1 or more; whether hover and focus add
 *     a non-color cue is for a person to check.
 *     It leans pass when the style sheets give it a non-color cue on :hover and
 *     on :focus, and fail when every sheet could be read and none gives it one
 *     on :hover.
 *     Basis: WCAG 1.4.1 (not settled); G183 (not settled).
 *   - `TEXT_DECORATION_NOT_RESOLVABLE` (cantTell): whether the link is
 *     underlined could not be read, so whether color is its only cue is
 *     unknown.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `COLOR_NOT_COMPUTABLE` (cantTell): the colors of the link or of the
 *     surrounding text could not be worked out.
 *     It leans fail when the link is not underlined, has no background of its
 *     own, and is drawn in the surrounding text's color, or in an opaque one
 *     less than 3:1 from it (two opaque colors compare without the background);
 *     it leans pass when it has an opaque background of its own unlike the one
 *     around it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `BACKGROUND_IMAGE_OR_GRADIENT` (cantTell): a background image or
 *     gradient lies behind the link, so its colors could not be compared.
 *     It leans fail when the link is not underlined, has no background of its
 *     own, and is drawn in the surrounding text's color, or in an opaque one
 *     less than 3:1 from it, the same image lying behind the text; it leans
 *     pass when it has an opaque background of its own unlike the one around
 *     it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `BACKGROUND_OVERLAP` (cantTell): another element paints under a link
 *     or text drawn in a translucent color, so the colors could not be
 *     compared.
 *     It leans fail when the link is not underlined, has no background of its
 *     own, and is drawn in the surrounding text's color, under the same paint;
 *     it leans pass when it has an opaque background of its own unlike the one
 *     around it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `BACKGROUND_FILTER_OR_BACKDROP_FILTER` (cantTell): a filter or
 *     backdrop-filter changes the colors drawn, so the declared colors of the
 *     link and the text are not what is on screen.
 *     It leans fail when the link is not underlined, has no background of its
 *     own, and is drawn in the surrounding text's color, the same filter
 *     applying to both; it leans pass when it has an opaque background of its
 *     own unlike the one around it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `MIX_BLEND_MODE` (cantTell): a mix-blend-mode blends the link or the text
 *     with what is behind it, so the colors on screen could not be compared.
 *     It leans fail when the link is not underlined, has no background of its
 *     own, and is drawn in the surrounding text's color, the same blend
 *     applying to both; it leans pass when it has an opaque background of its
 *     own unlike the one around it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `ANCESTOR_OPACITY` (cantTell): an ancestor with opacity below 1 fades the
 *     link and its background together, in a way that could not be resolved.
 *     It leans fail when the link is not underlined, has no background of its
 *     own, and is drawn in the surrounding text's color, or in an opaque one
 *     less than 3:1 from it, the same ancestor fading both; it leans pass when
 *     it has an opaque background of its own unlike the one around it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `ELEMENT_OPACITY` (cantTell): the link's own element has opacity below 1
 *     over a background of its own, which could not be resolved.
 *     It leans pass when that background is opaque and unlike the one around
 *     it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `TEXT_SHADOW` (cantTell): a text-shadow changes how the link or the text
 *     looks, so their colors alone don't tell whether they stand apart.
 *     It leans fail when the link is not underlined, has no background of its
 *     own, and is drawn in the surrounding text's color, or in an opaque one
 *     less than 3:1 from it, with the same shadow on both; it leans pass when
 *     it has an opaque background of its own unlike the one around it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `TEXT_STROKE` (cantTell): a -webkit-text-stroke draws the link or the
 *     text in a color of its own, so the colors could not be compared.
 *     It leans fail when the link is not underlined, has no background of its
 *     own, and is drawn in the surrounding text's color, or in an opaque one
 *     less than 3:1 from it, with the same stroke on both; it leans pass when
 *     it has an opaque background of its own unlike the one around it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `PSEUDO_ELEMENT_COLOR` (cantTell): a ::first-line or ::first-letter has a
 *     color of its own, and which text it paints depends on line breaks.
 *     Where nothing else is in the way, the pseudo-element paints no background
 *     or weight of its own, and the link in both colors is on the same side of
 *     3:1 from the surrounding text, it is decided as any link is (by the
 *     closer ratio when both reach 3:1, the better one when both fall short);
 *     it is asked about where they disagree.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `SELECT_OPTION_COLOR` (cantTell): the text is a drop-down option drawn
 *     only in the list the platform opens, with colors of its own.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `CONTRAST_HELPERS_UNAVAILABLE` (cantTell): the color helpers were not
 *     available in this run, so the link could not be checked.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `ENGINE_EXCEPTION` (cantTell): the rule stopped on an internal error
 *     for this link; it is to be checked by hand.
 *     Basis: WCAG 1.4.1 (not settled).
 * @implementation-notes
 * - "Surrounding text style" is approximated as the link's immediate
 *   parent element's own computed style, not a full inline-context walk
 *   of the actual adjacent text node(s), a deliberate scope-down, since
 *   plain text nodes inherit their rendering from the parent in the
 *   overwhelming majority of real markup.
 * - A candidate that cannot be evaluated reports cantTell, not pass:
 *   contrast not confidently computable (the blockers `contrast-minimum`/
 *   `contrast-computable` use), or `text-decoration` unreadable in both
 *   the computed style and the CSSOM (see `decorationInfo`). `fail` stays
 *   reserved for deterministic violations; this is the computability gate
 *   RULE_TAXONOMY.md §1.1 allows automatic rules, as in `contrast-minimum`
 *   and `target-size-minimum`.
 * - Reuses the shared `helpers.contrast` subsystem (same
 *   computeEffectiveForeground/Background, getComputabilityBlocker,
 *   contrastRatio helpers as `contrast-minimum`), rather than re-deriving
 *   color math independently.
 * - What ::before/::after draws is read from their computed style in a
 *   browser. A DOM emulator computes no pseudo-element styles, so there it
 *   is read from the CSSOM, where content declared in a cross-origin
 *   stylesheet is not seen.
 * - Only the resting state is evaluated. The :hover, :focus and :visited
 *   states are not.
 */

const id = 'link-in-text-block';

const meta = {
  title:
    'Links in text blocks must be distinguishable from surrounding text without relying on color alone',
  description:
    'Checks that a link inside a run of text is visually distinguishable from the surrounding text by a non-color cue (underline, font-weight or style, border, background, icon), and asks about links distinguished only by a >=3:1 color difference, which also need a hover and focus cue.',
  i18n: {
    titleKey: 'linkInTextBlock_title',
    descriptionKey: 'linkInTextBlock_description'
  },
  helpUrl: null,
  tags: [
    'wcag2a',
    'wcag141',
    'navigation',
    'color',
    'links',
    'contrast',
    'atomic',
    'automatic',
    'dom'
  ],
  wcagSc: ['1.4.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.1',
      title: 'Use of Color',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.4.1': ['link-in-text-block'] } },
  // Reason codes built at runtime, which scripts/generate-finding-ids.js
  // can't read from the source; those of the contrast helpers' computability
  // blocker are passed on as they are.
  reasonCodes: [
    'ANCESTOR_OPACITY',
    'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
    'BACKGROUND_OVERLAP',
    'COLOR_NOT_COMPUTABLE',
    'CONTRAST_HELPERS_UNAVAILABLE',
    'ELEMENT_OPACITY',
    'ENGINE_EXCEPTION',
    'MIX_BLEND_MODE',
    'PSEUDO_ELEMENT_COLOR',
    'SELECT_OPTION_COLOR',
    'TEXT_DECORATION_NOT_RESOLVABLE',
    'TEXT_SHADOW',
    'TEXT_STROKE'
  ],
  margin: { measure: 'contrast-ratio', unit: 'ratio', limit: 'min', band: { relative: 0.1 } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    ANCESTOR_OPACITY: {
      steps: [
        'Find the link the report names inside its paragraph and look at it next to the surrounding text.',
        'Check whether the link is set apart by an underline, bold, italics, a border or another mark; read colors from the screen, since the fading changes them.',
        "If nothing but color differs, use the color picker's eyedropper in the developer tools to read the link color and the text color as drawn, and check their contrast is at least 3:1.",
        'Then hover the pointer over the link and Tab to it, and check that an underline or another non-color mark appears.'
      ],
      passWhen:
        'The link has a non-color cue such as an underline, bold or a border, or its color contrasts with the text by at least 3:1 and hover and focus add a non-color cue.',
      failWhen:
        'The link has no non-color cue and it is told apart from the text by color alone, at less than 3:1 or with no non-color cue on hover and focus, which fails WCAG 1.4.1 (F73).'
    },
    BACKGROUND_FILTER_OR_BACKDROP_FILTER: {
      steps: [
        'Find the link the report names inside its paragraph and look at it next to the surrounding text.',
        'Check whether the link is set apart by an underline, bold, italics, a border or another mark; read colors from the screen, since the filter changes them.',
        "If nothing but color differs, use the color picker's eyedropper in the developer tools to read the link color and the text color as drawn, and check their contrast is at least 3:1.",
        'Then hover the pointer over the link and Tab to it, and check that an underline or another non-color mark appears.'
      ],
      passWhen:
        'The link has a non-color cue such as an underline, bold or a border, or its color contrasts with the text by at least 3:1 and hover and focus add a non-color cue.',
      failWhen:
        'The link has no non-color cue and it is told apart from the text by color alone, at less than 3:1 or with no non-color cue on hover and focus, which fails WCAG 1.4.1 (F73).'
    },
    BACKGROUND_IMAGE_OR_GRADIENT: {
      steps: [
        'Find the link the report names inside its paragraph and look at it next to the surrounding text.',
        'Check whether the link is set apart by an underline, bold, italics, a border or another mark, not just its color over the background image.',
        "If nothing but color differs, use the color picker's eyedropper in the developer tools to read the link color and the text color as drawn, and check their contrast is at least 3:1.",
        'Then hover the pointer over the link and Tab to it, and check that an underline or another non-color mark appears.'
      ],
      passWhen:
        'The link has a non-color cue such as an underline, bold or a border, or its color contrasts with the text by at least 3:1 and hover and focus add a non-color cue.',
      failWhen:
        'The link has no non-color cue and it is told apart from the text by color alone, at less than 3:1 or with no non-color cue on hover and focus, which fails WCAG 1.4.1 (F73).'
    },
    BACKGROUND_OVERLAP: {
      steps: [
        'Find the link the report names inside its paragraph and look at it next to the surrounding text.',
        'Check whether the link is set apart by an underline, bold, italics, a border or another mark, not just its color.',
        "If nothing but color differs, use the color picker's eyedropper in the developer tools to read the link color and the text color as drawn, and check their contrast is at least 3:1.",
        'Then hover the pointer over the link and Tab to it, and check that an underline or another non-color mark appears.'
      ],
      passWhen:
        'The link has a non-color cue such as an underline, bold or a border, or its color contrasts with the text by at least 3:1 and hover and focus add a non-color cue.',
      failWhen:
        'The link has no non-color cue and it is told apart from the text by color alone, at less than 3:1 or with no non-color cue on hover and focus, which fails WCAG 1.4.1 (F73).'
    },
    COLOR_NOT_COMPUTABLE: {
      steps: [
        'Find the link the report names inside its paragraph and look at it next to the surrounding text.',
        'Check whether the link is set apart on screen by an underline, bold, italics, a border or another mark.',
        "If nothing but color differs, use the color picker's eyedropper in the developer tools to read the link color and the text color as drawn, and check their contrast is at least 3:1.",
        'Then hover the pointer over the link and Tab to it, and check that an underline or another non-color mark appears.'
      ],
      passWhen:
        'The link has a non-color cue such as an underline, bold or a border, or its color contrasts with the text by at least 3:1 and hover and focus add a non-color cue.',
      failWhen:
        'The link has no non-color cue and it is told apart from the text by color alone, at less than 3:1 or with no non-color cue on hover and focus, which fails WCAG 1.4.1 (F73).'
    },
    CONTRAST_HELPERS_UNAVAILABLE: {
      steps: [
        'Find the link the report names inside its paragraph and look at it next to the surrounding text.',
        'Check whether the link is set apart by an underline, bold, italics, a border or another mark.',
        "If nothing but color differs, use the color picker's eyedropper in the developer tools to read the link color and the text color as drawn, and check their contrast is at least 3:1.",
        'Then hover the pointer over the link and Tab to it, and check that an underline or another non-color mark appears.'
      ],
      passWhen:
        'The link has a non-color cue such as an underline, bold or a border, or its color contrasts with the text by at least 3:1 and hover and focus add a non-color cue.',
      failWhen:
        'The link has no non-color cue and it is told apart from the text by color alone, at less than 3:1 or with no non-color cue on hover and focus, which fails WCAG 1.4.1 (F73).'
    },
    ELEMENT_OPACITY: {
      steps: [
        'Find the link the report names inside its paragraph and look at it next to the surrounding text.',
        'Check whether the link is set apart by an underline, bold, italics, a border or another mark; read its color from the screen, since its own opacity changes it.',
        "If nothing but color differs, use the color picker's eyedropper in the developer tools to read the link color and the text color as drawn, and check their contrast is at least 3:1.",
        'Then hover the pointer over the link and Tab to it, and check that an underline or another non-color mark appears.'
      ],
      passWhen:
        'The link has a non-color cue such as an underline, bold or a border, or its color contrasts with the text by at least 3:1 and hover and focus add a non-color cue.',
      failWhen:
        'The link has no non-color cue and it is told apart from the text by color alone, at less than 3:1 or with no non-color cue on hover and focus, which fails WCAG 1.4.1 (F73).'
    },
    ENGINE_EXCEPTION: {
      steps: [
        'Find the link the report names inside its paragraph and look at it next to the surrounding text.',
        'Check whether the link is set apart by an underline, bold, italics, a border or another mark.',
        "If nothing but color differs, use the color picker's eyedropper in the developer tools to read the link color and the text color as drawn, and check their contrast is at least 3:1.",
        'Then hover the pointer over the link and Tab to it, and check that an underline or another non-color mark appears.'
      ],
      passWhen:
        'The link has a non-color cue such as an underline, bold or a border, or its color contrasts with the text by at least 3:1 and hover and focus add a non-color cue.',
      failWhen:
        'The link has no non-color cue and it is told apart from the text by color alone, at less than 3:1 or with no non-color cue on hover and focus, which fails WCAG 1.4.1 (F73).'
    },
    LINK_COLOR_CONTRAST_ONLY: {
      steps: [
        'Find the link the report names inside its paragraph; the report gives its contrast with the surrounding text.',
        'Hover the pointer over the link and check whether an underline or another non-color mark appears.',
        'Click just before the link and press Tab until it has focus, and check again for a non-color mark.'
      ],
      passWhen: 'Both hover and focus add a non-color cue, such as an underline, to the link.',
      failWhen:
        'Hover or focus changes only the color, so color alone sets the link apart, which fails WCAG 1.4.1 (G183, F73).'
    },
    MIX_BLEND_MODE: {
      steps: [
        'Find the link the report names inside its paragraph and look at it next to the surrounding text.',
        'Check whether the link is set apart by an underline, bold, italics, a border or another mark; read colors from the screen, since blending changes them.',
        "If nothing but color differs, use the color picker's eyedropper in the developer tools to read the link color and the text color as drawn, and check their contrast is at least 3:1.",
        'Then hover the pointer over the link and Tab to it, and check that an underline or another non-color mark appears.'
      ],
      passWhen:
        'The link has a non-color cue such as an underline, bold or a border, or its color contrasts with the text by at least 3:1 and hover and focus add a non-color cue.',
      failWhen:
        'The link has no non-color cue and it is told apart from the text by color alone, at less than 3:1 or with no non-color cue on hover and focus, which fails WCAG 1.4.1 (F73).'
    },
    PSEUDO_ELEMENT_COLOR: {
      steps: [
        'Find the link the report names inside its paragraph and look at it next to the surrounding text.',
        "Check whether the link is set apart by an underline, bold, italics, a border or another mark; if it sits on the paragraph's first line or first letter, compare it with the text on that line.",
        "If nothing but color differs, use the color picker's eyedropper in the developer tools to read the link color and the text color as drawn, and check their contrast is at least 3:1.",
        'Then hover the pointer over the link and Tab to it, and check that an underline or another non-color mark appears.'
      ],
      passWhen:
        'The link has a non-color cue such as an underline, bold or a border, or its color contrasts with the text by at least 3:1 and hover and focus add a non-color cue.',
      failWhen:
        'The link has no non-color cue and it is told apart from the text by color alone, at less than 3:1 or with no non-color cue on hover and focus, which fails WCAG 1.4.1 (F73).'
    },
    SELECT_OPTION_COLOR: {
      steps: [
        'Find the drop-down the report names and open its list of options.',
        "Look at the option the report names next to the other options' text.",
        "Check whether it is set apart by something other than color (an underline, bold, a mark); if only color differs, read both colors with the color picker's eyedropper and check the contrast is at least 3:1."
      ],
      passWhen:
        'The option is set apart by a non-color cue, or its color contrasts with the other text by at least 3:1 with a non-color cue on focus.',
      failWhen:
        'Color alone sets the option apart, below 3:1 or with no other cue, which fails WCAG 1.4.1 (F73).'
    },
    TEXT_DECORATION_NOT_RESOLVABLE: {
      steps: [
        'Find the link the report names inside its paragraph and look at it next to the surrounding text.',
        'Check whether the link is underlined on screen, or set apart by bold, italics, a border or another mark.',
        "If nothing but color differs, use the color picker's eyedropper in the developer tools to read the link color and the text color as drawn, and check their contrast is at least 3:1.",
        'Then hover the pointer over the link and Tab to it, and check that an underline or another non-color mark appears.'
      ],
      passWhen:
        'The link has a non-color cue such as an underline, bold or a border, or its color contrasts with the text by at least 3:1 and hover and focus add a non-color cue.',
      failWhen:
        'The link has no non-color cue and it is told apart from the text by color alone, at less than 3:1 or with no non-color cue on hover and focus, which fails WCAG 1.4.1 (F73).'
    },
    TEXT_SHADOW: {
      steps: [
        'Find the link the report names inside its paragraph and look at it next to the surrounding text.',
        'Check whether the link is set apart by an underline, bold, italics, a border or another mark; a shadow shared with the text does not count.',
        "If nothing but color differs, use the color picker's eyedropper in the developer tools to read the link color and the text color as drawn, and check their contrast is at least 3:1.",
        'Then hover the pointer over the link and Tab to it, and check that an underline or another non-color mark appears.'
      ],
      passWhen:
        'The link has a non-color cue such as an underline, bold or a border, or its color contrasts with the text by at least 3:1 and hover and focus add a non-color cue.',
      failWhen:
        'The link has no non-color cue and it is told apart from the text by color alone, at less than 3:1 or with no non-color cue on hover and focus, which fails WCAG 1.4.1 (F73).'
    },
    TEXT_STROKE: {
      steps: [
        'Find the link the report names inside its paragraph and look at it next to the surrounding text.',
        'Check whether the link is set apart by an underline, bold, italics, a border or another mark; read colors from the screen, where the stroke is drawn.',
        "If nothing but color differs, use the color picker's eyedropper in the developer tools to read the link color and the text color as drawn, and check their contrast is at least 3:1.",
        'Then hover the pointer over the link and Tab to it, and check that an underline or another non-color mark appears.'
      ],
      passWhen:
        'The link has a non-color cue such as an underline, bold or a border, or its color contrasts with the text by at least 3:1 and hover and focus add a non-color cue.',
      failWhen:
        'The link has no non-color cue and it is told apart from the text by color alone, at less than 3:1 or with no non-color cue on hover and focus, which fails WCAG 1.4.1 (F73).'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule, engineOptions } = ctx;

  // The element's resolved role: the first known role token of its role
  // attribute, lower-cased, else the role a custom element's internals give
  // it, or '' for neither.
  function explicitRole(el) {
    try {
      return helpers && helpers.aria && typeof helpers.aria.getAuthorRole === 'function'
        ? helpers.aria.getAuthorRole(el)
        : '';
    } catch {
      return '';
    }
  }

  function safeComputedStyle(el) {
    try {
      if (!el || dom.nodeType(el) !== 1) return null;
      if (helpers && typeof helpers.computedStyle === 'function') {
        const cs = helpers.computedStyle(el);
        if (cs) return cs;
      }
      const view =
        dom.ownerDocument(el) && dom.defaultView(dom.ownerDocument(el))
          ? dom.defaultView(dom.ownerDocument(el))
          : null;
      if (view && typeof view.getComputedStyle === 'function') return view.getComputedStyle(el);
    } catch {}
    return null;
  }

  // Whether the element is underlined, and whether the computed style can be
  // trusted to say so. A conforming CSSOM serialises the `text-decoration`
  // shorthand with the line value first, so it and `text-decoration-line`
  // always agree on whether `underline` is present. jsdom does not cascade
  // the property at all: the shorthand reads back as the UA's "underline"
  // for every <a> whatever the author CSS says, and the longhand as "none"
  // unless the author used the longhand. Either one taken alone is wrong in
  // one direction, so disagreement is the signal to stop trusting both.
  function decorationInfo(cs) {
    if (!cs) return { underlined: false, trustworthy: false };

    const lineRaw = String(cs.textDecorationLine || '')
      .trim()
      .toLowerCase();
    const shortRaw = String(cs.textDecoration || '')
      .trim()
      .toLowerCase();

    const lineTokens = lineRaw.split(/\s+/).filter(Boolean);
    const shortTokens = shortRaw.split(/\s+/).filter(Boolean);

    // Only one of the two exposed: nothing to cross-check against, take it.
    if (!lineTokens.length) {
      return { underlined: shortTokens.includes('underline'), trustworthy: shortTokens.length > 0 };
    }
    if (!shortTokens.length) {
      return { underlined: lineTokens.includes('underline'), trustworthy: true };
    }

    const byLine = lineTokens.includes('underline');
    const byShort = shortTokens.includes('underline');
    return { underlined: byLine, trustworthy: byLine === byShort };
  }

  // Resolves `text-decoration` from the author stylesheets when the computed
  // style is untrustworthy, reading the CSSOM as `css-orientation-lock` and
  // `css-focus-indicator-suppressed` do. Without it the rule could not decide
  // anything under a DOM emulator, which is how the CLI scans static HTML.
  //
  // A narrow cascade is enough: `text-decoration-line` is not inherited, so
  // only declarations matching the element itself and its inline style apply,
  // ordered by specificity. With no author declaration the UA default stands,
  // and for a link that is an underline. Anything that would make the answer a
  // guess yields `resolved: false` and the caller reports cantTell.
  const CSS_STYLE_RULE = 1;
  const MAX_NESTED_DEPTH = 8;

  function splitSelectorList(selectorText) {
    const parts = [];
    let depth = 0;
    let current = '';
    for (const ch of String(selectorText || '')) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
        parts.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    parts.push(current);
    return parts.map((p) => p.trim()).filter(Boolean);
  }

  // Approximate CSS specificity as a single sortable integer. Exactness is
  // not required: this only orders declarations of one property against each
  // other, and near-ties are broken by document order as the cascade does.
  function specificityOf(selector) {
    const s = String(selector || '');
    const ids = (s.match(/#[\w-]+/g) || []).length;
    const classesEtc = (s.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) || []).length;
    const types = (s.match(/(^|[\s>+~])[a-z][\w-]*/gi) || []).length;
    return ids * 10000 + classesEtc * 100 + types;
  }

  // A declaration wins if it is the last one, in (specificity, order), whose
  // selector matches. `!important` outranks everything non-important.
  function underlineFromDeclaration(style) {
    if (!style || typeof style.getPropertyValue !== 'function') return null;
    for (const prop of ['text-decoration-line', 'text-decoration']) {
      const raw = String(style.getPropertyValue(prop) || '')
        .trim()
        .toLowerCase();
      if (!raw) continue;
      const important = String(style.getPropertyPriority(prop) || '') === 'important';
      return { underlined: /\bunderline\b/.test(raw), important };
    }
    return null;
  }

  // The user agent underlines `a[href]`; an element with role="link" has no
  // default decoration.
  function uaUnderlines(el) {
    return (
      String(dom.localName(el) || '').toLowerCase() === 'a' &&
      typeof dom.get(el, 'hasAttribute') === 'function' &&
      dom.hasAttribute(el, 'href')
    );
  }

  function resolveUnderlineFromCssom(el) {
    const doc = el && dom.ownerDocument(el) ? dom.ownerDocument(el) : null;
    if (!doc || typeof dom.get(el, 'matches') !== 'function')
      return { underlined: false, resolved: false };

    let best = null; // { rank, order, underlined }
    let order = 0;
    let unreadableSheet = false;
    let unparsableSelector = false;

    function consider(cssRule) {
      const decl = underlineFromDeclaration(cssRule.style);
      if (!decl) return;
      for (const part of splitSelectorList(cssRule.selectorText)) {
        // A pseudo-element rule paints a box other than the link's own text.
        if (/::[a-z-]+/i.test(part)) continue;
        // A state the static DOM is not in (:hover/:focus/...) does not
        // describe the link's resting appearance, which is what this rule is
        // about.
        if (/:(hover|focus|focus-visible|focus-within|active|target|visited)\b/i.test(part)) {
          continue;
        }
        let matched;
        try {
          matched = dom.matches(el, part);
        } catch {
          unparsableSelector = true;
          continue;
        }
        if (!matched) continue;
        order += 1;
        const rank = (decl.important ? 1e9 : 0) + specificityOf(part);
        if (!best || rank >= best.rank) best = { rank, order, underlined: decl.underlined };
      }
    }

    function walk(rules, depth) {
      if (!rules || depth > MAX_NESTED_DEPTH) return;
      for (const cssRule of rules) {
        if (!cssRule) continue;
        if (cssRule.type === CSS_STYLE_RULE && cssRule.selectorText) {
          consider(cssRule);
          continue;
        }
        let nested;
        try {
          nested = cssRule.cssRules || null;
        } catch {
          nested = null;
        }
        if (nested) walk(nested, depth + 1);
      }
    }

    try {
      for (const sheet of dom.styleSheets(doc) || []) {
        let rules = null;
        try {
          rules = sheet && sheet.cssRules ? sheet.cssRules : null;
        } catch {
          unreadableSheet = true; // cross-origin, not inspectable
          continue;
        }
        if (rules) walk(rules, 0);
      }
    } catch {
      return { underlined: false, resolved: false };
    }

    // The inline style attribute outranks every stylesheet declaration.
    const inline = underlineFromDeclaration(dom.get(el, 'style'));
    if (inline) return { underlined: inline.underlined, resolved: true };

    if (best) return { underlined: best.underlined, resolved: true };

    // No author declaration reached this element. If a sheet or selector was
    // unreadable, one of them might have, so the answer is unknown; otherwise
    // the UA default stands, and for a link that means underlined.
    if (unreadableSheet || unparsableSelector) return { underlined: false, resolved: false };
    return { underlined: uaUnderlines(el), resolved: true };
  }

  // ---- Non-color cues on the link itself ----
  const LINE_STYLES = /^(solid|dashed|dotted|double|groove|ridge|inset|outset|auto)$/;

  function isZeroWidth(v) {
    return /^0(\.0+)?[a-z%]*$/i.test(String(v || '').trim());
  }

  // A color that draws nothing: a line in it is no cue.
  function isTransparentColor(v) {
    const raw = String(v || '').trim();
    if (!raw) return false;
    const parsed =
      c && typeof c.parseCssColorToRgba === 'function' ? c.parseCssColorToRgba(raw) : null;
    if (parsed) return parsed.a === 0;
    return /^transparent$/i.test(raw);
  }

  function hasBorder(cs) {
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const style = String(cs['border' + side + 'Style'] || '')
        .trim()
        .toLowerCase();
      if (!style || style === 'none' || style === 'hidden') continue;
      if (isTransparentColor(cs['border' + side + 'Color'])) continue;
      if (!isZeroWidth(cs['border' + side + 'Width'])) return true;
    }
    return false;
  }

  // Some environments do not expand the `outline` shorthand into its
  // longhands, so it is read too.
  function hasOutline(cs) {
    const style = String(cs.outlineStyle || '')
      .trim()
      .toLowerCase();
    if (style && style !== 'none' && style !== 'hidden') return !isZeroWidth(cs.outlineWidth);
    const tokens = String((cs.getPropertyValue && cs.getPropertyValue('outline')) || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    return tokens.some((t) => LINE_STYLES.test(t)) && !tokens.some((t) => isZeroWidth(t));
  }

  function hasBoxShadow(cs) {
    const v = String(cs.boxShadow || '')
      .trim()
      .toLowerCase();
    return !!v && v !== 'none';
  }

  // Whether a background-image layer draws something seen behind el's text:
  // `none`, a layer sized to nothing, a transparent gradient and a solid one
  // in the colour already behind it draw nothing.
  function hasBackgroundImage(cs, el) {
    const contrast = helpers.contrast;
    if (contrast && typeof contrast.backgroundLayerKinds === 'function') {
      const kinds = contrast.backgroundLayerKinds(cs);
      return (
        !!kinds &&
        kinds.some(
          (k) =>
            k.kind !== 'none' &&
            !(k.color && el && sameAsBackground(el, contrast.rgbaToString({ ...k.color, a: 1 })))
        )
      );
    }
    if (contrast && typeof contrast.paintsBackgroundLayer === 'function') {
      return contrast.paintsBackgroundLayer(cs);
    }
    const v = String(cs.backgroundImage || '')
      .trim()
      .toLowerCase();
    if (!v || v === 'none') return false;
    return v.split(',').some((layer) => layer.trim() !== 'none');
  }

  function hasVisibleImageChild(el) {
    let imgs;
    try {
      imgs = Array.from(
        dom.querySelectorAll(el, 'img, svg, picture, canvas, [role~="img" i], [role~="image" i]')
      ).filter((img) => {
        const name = String(dom.localName(img) || '').toLowerCase();
        if (['img', 'svg', 'picture', 'canvas'].includes(name)) return true;
        return explicitRole(img) === 'img';
      });
    } catch {
      return false;
    }
    return imgs.some((img) => {
      if (!helpers.isDomVisibleEligible) return true;
      try {
        const vis = helpers.isDomVisibleEligible(img, ctx, {
          visibilityMode: 'styleOnly',
          disableGeometry: true
        });
        return !(vis && vis.eligible === false);
      } catch {
        return true;
      }
    });
  }

  const NO_BOX = ['', 'none', 'normal'];
  const EMPTY_STRING = ['""', "''"];
  // Whether a declaration block paints a box: a background, a border, an
  // outline or a shadow. An empty-content ::before/::after drawing an
  // underline this way is a mark (#107).
  function declaresPaint(style) {
    const get = (prop) =>
      String(style.getPropertyValue(prop) || '')
        .trim()
        .toLowerCase();
    const bg = get('background-color');
    if (bg && !isTransparentColor(bg)) return true;
    const image = get('background-image');
    const contrast = helpers.contrast;
    if (
      image &&
      (contrast
        ? contrast.hasBackgroundImageOrGradient({ backgroundImage: image })
        : image !== 'none')
    )
      return true;
    for (const side of ['top', 'right', 'bottom', 'left']) {
      const line = get('border-' + side + '-style');
      if (!line || line === 'none' || line === 'hidden') continue;
      if (!isZeroWidth(get('border-' + side + '-width') || 'medium')) return true;
    }
    const outline = get('outline-style');
    if (outline && outline !== 'none') return true;
    const shadow = get('box-shadow');
    return !!shadow && shadow !== 'none';
  }
  let pseudoContentRules = null;
  // Style rules that put content in a ::before/::after box, by the selector
  // of the element that box belongs to: content of its own, or an empty
  // string with something painted.
  function getPseudoContentRules(doc) {
    if (pseudoContentRules) return pseudoContentRules;
    pseudoContentRules = [];
    function consider(cssRule) {
      const style = cssRule.style;
      if (!style || typeof style.getPropertyValue !== 'function') return;
      const content = String(style.getPropertyValue('content') || '')
        .trim()
        .toLowerCase();
      if (NO_BOX.indexOf(content) !== -1) return;
      if (EMPTY_STRING.indexOf(content) !== -1 && !declaresPaint(style)) return;
      for (const part of splitSelectorList(cssRule.selectorText)) {
        if (!/::?(before|after)\s*$/i.test(part)) continue;
        if (/:(hover|focus|focus-visible|focus-within|active|target|visited)\b/i.test(part)) {
          continue;
        }
        pseudoContentRules.push(part.replace(/::?(before|after)\s*$/i, '').trim() || '*');
      }
    }
    function walk(rules, depth) {
      if (!rules || depth > MAX_NESTED_DEPTH) return;
      for (const cssRule of rules) {
        if (!cssRule) continue;
        if (cssRule.type === CSS_STYLE_RULE && cssRule.selectorText) {
          consider(cssRule);
          continue;
        }
        let nested;
        try {
          nested = cssRule.cssRules || null;
        } catch {
          nested = null;
        }
        if (nested) walk(nested, depth + 1);
      }
    }
    try {
      for (const sheet of (doc && dom.styleSheets(doc)) || []) {
        let rules = null;
        try {
          rules = sheet && sheet.cssRules ? sheet.cssRules : null;
        } catch {
          continue; // cross-origin, not inspectable
        }
        if (rules) walk(rules, 0);
      }
    } catch {
      // no readable stylesheets
    }
    return pseudoContentRules;
  }

  // Whether the page has a layout, and so computes pseudo-element styles:
  // a browser lays out the root element; jsdom gives it no boxes.
  let layout = null;
  function hasLayout() {
    if (layout === null) {
      try {
        const root = dom.documentElement(ctx.document);
        layout = !!(root && dom.getClientRects(root).length);
      } catch {
        layout = false;
      }
    }
    return layout;
  }

  // Whether el's ::before or ::after draws something: content of its own,
  // or, with an empty string, a box that paints a background, a border, an
  // outline or a shadow with a size that shows it, in a color other than
  // the link's background.
  function pseudoPaints(el, which) {
    let cs;
    try {
      const view = dom.defaultView(dom.ownerDocument(el));
      cs = view.getComputedStyle(el, which);
    } catch {
      return false;
    }
    if (!cs) return false;
    const content = String(cs.content || '').trim();
    if (NO_BOX.indexOf(content.toLowerCase()) !== -1) return false;
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (Number.parseFloat(cs.opacity) === 0) return false;
    if (EMPTY_STRING.indexOf(content) === -1) return true;
    const size = (v) => {
      const n = Number.parseFloat(v);
      return Number.isFinite(n) && n > 0 ? n : 0;
    };
    const w = size(cs.width);
    const h = size(cs.height);
    const shows = (color) => !isTransparentColor(color) && !sameAsBackground(el, color);
    if (w && h && shows(cs.backgroundColor)) return true;
    if (w && h && hasBackgroundImage(cs, el)) return true;
    for (const [side, along] of [
      ['Top', w],
      ['Bottom', w],
      ['Left', h],
      ['Right', h]
    ]) {
      const style = String(cs['border' + side + 'Style'] || '').toLowerCase();
      if (!style || style === 'none' || style === 'hidden') continue;
      if (along && size(cs['border' + side + 'Width']) && shows(cs['border' + side + 'Color']))
        return true;
    }
    if (hasOutline(cs) && shows(cs.outlineColor)) return true;
    if (hasBoxShadow(cs)) {
      // A shadow of an empty box shows only with blur or spread.
      const lengths = String(cs.boxShadow).match(/-?[\d.]+px/g) || [];
      if ((w && h) || lengths.slice(2, 4).some((v) => size(v))) return true;
    }
    return false;
  }
  // Whether a color is the one behind the link, so a mark in it is unseen.
  const linkBackgrounds = new Map();
  function sameAsBackground(el, color) {
    if (!c || !c.parseCssColorToRgba || !c.rgbToHex) return false;
    const parsed = c.parseCssColorToRgba(String(color || ''));
    if (!parsed || parsed.a < 1) return false;
    if (!linkBackgrounds.has(el)) {
      let hex = null;
      try {
        const bg = c.computeEffectiveBackground(el, {
          contrast: { mode, rootCanvasFallback },
          collectStack: false
        });
        if (bg && bg.ok && bg.rgba) hex = c.rgbToHex(bg.rgba);
      } catch {}
      linkBackgrounds.set(el, hex);
    }
    const hex = linkBackgrounds.get(el);
    return !!hex && hex === c.rgbToHex(parsed);
  }

  function hasPseudoContent(el) {
    if (hasLayout()) return pseudoPaints(el, '::before') || pseudoPaints(el, '::after');
    return getPseudoContentRules(dom.ownerDocument(el)).some((base) => {
      try {
        return dom.matches(el, base);
      } catch {
        return false;
      }
    });
  }

  function hasNonColorMark(el, cs) {
    if (cs && (hasBorder(cs) || hasOutline(cs) || hasBoxShadow(cs) || hasBackgroundImage(cs, el))) {
      return true;
    }
    return hasVisibleImageChild(el) || hasPseudoContent(el);
  }

  // Whether the link's parent holds text beside it. The link is an element,
  // so that is a property of the parent alone, and it is read once per
  // parent: scanning every sibling for every link made a parent with
  // thousands of links take seconds, quadratic in the links.
  // Text is what has a letter or a digit, as in the contrast text scan: the
  // "|" or "·" between a row of links makes no block of text for them to
  // sit in, and a row of links is navigation (WCAG 1.4.1, G183).
  const TEXT = /[\p{L}\p{N}]/u;
  // Text in an inline element beside the link is on the same line too: a
  // sentence split into spans ("<span>Please read our</span> <a>terms</a>").
  // Not in another link, which is no text around this one, nor in an
  // element drawn invisibly (a screen-reader-only label), nor in one laid
  // out as a box of its own (inline-block, a flex or grid item). Read
  // through at most INLINE_NODES nodes of each element.
  const INLINE_NODES = 200;
  function isLinkElement(n) {
    return uaUnderlines(n) || explicitRole(n) === 'link';
  }
  function isHiddenText(n) {
    try {
      return typeof helpers.isVisuallyHidden === 'function' && helpers.isVisuallyHidden(n);
    } catch {
      return false;
    }
  }
  // The element whose text it is: the inline element holding the first
  // text found in root, or null when root has none.
  function inlineTextElement(root) {
    const stack = [root];
    let seen = 0;
    while (stack.length && seen < INLINE_NODES) {
      const n = stack.pop();
      seen += 1;
      const type = dom.nodeType(n);
      if (type === 3) {
        if (TEXT.test(dom.nodeValue(n) || '')) return dom.parentElement(n);
        continue;
      }
      if (type !== 1 || isLinkElement(n)) continue;
      const cs = safeComputedStyle(n);
      if (!cs || String(cs.display || '') !== 'inline' || isHiddenText(n)) continue;
      const kids = [];
      for (let c = dom.firstChild(n); c; c = dom.nextSibling(c)) kids.push(c);
      for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
    }
    return null;
  }
  // The element whose style is the surrounding text's, for the parent: the
  // parent itself when text sits in it directly, else the inline element
  // beside the link that holds it, else null (no text around the link).
  const surroundingTextElement = new Map();
  function textElementOf(parent) {
    if (!parent) return null;
    if (surroundingTextElement.has(parent)) return surroundingTextElement.get(parent);
    let found = null;
    for (let n = dom.firstChild(parent); n; n = dom.nextSibling(n)) {
      if (dom.nodeType(n) === 3 && TEXT.test(dom.nodeValue(n) || '')) {
        found = parent;
        break;
      }
    }
    if (!found && !/flex|grid/.test(String((safeComputedStyle(parent) || {}).display || ''))) {
      for (let n = dom.firstElementChild(parent); n && !found; n = dom.nextElementSibling(n)) {
        found = inlineTextElement(n);
      }
    }
    surroundingTextElement.set(parent, found);
    return found;
  }
  function hasSurroundingText(el, parent) {
    return !!textElementOf(parent);
  }

  const contrastOpts =
    engineOptions && typeof engineOptions.contrast === 'object' && engineOptions.contrast
      ? engineOptions.contrast
      : {};
  const mode = contrastOpts.mode === 'auditorAssist' ? 'auditorAssist' : 'strictConformance';
  const rootCanvasFallback =
    typeof contrastOpts.rootCanvasFallback === 'string' && contrastOpts.rootCanvasFallback.trim()
      ? contrastOpts.rootCanvasFallback.trim()
      : '#ffffff';

  const c = helpers && helpers.contrast ? helpers.contrast : null;

  // `[role~="link" i]` also matches a fallback list whose first known role
  // is something else (role="button link" is a button), so a role-only
  // candidate is kept only when its resolved explicit role is link.
  const selector = 'a[href], [role~="link" i]';
  const nodes = (
    helpers.queryAllSmart
      ? helpers.queryAllSmart(selector, { internalsRoles: true })
      : helpers.queryAll(selector)
  ).filter((el) => {
    if (uaUnderlines(el)) return true;
    return explicitRole(el) === 'link';
  });

  const occurrences = [];
  const undecided = [];
  const contrastOnly = [];
  let applicableCount = 0;
  let decidedCount = 0;
  // Links whose only cue is color, compared with the surrounding text.
  let colorCompared = 0;

  // Applicable, but not evaluable. Held separately so the outcome below can
  // tell "checked and sound" apart from "never decided".
  function markUndecided(el, reasonCode, lean) {
    undecided.push({ el, reasonCode, lean: lean || null });
  }

  // ---- Leans (docs/LEANS.md) ----

  // The colour a style paints text in: -webkit-text-fill-color, else color.
  function fillOf(cs) {
    if (!cs || !c) return null;
    return (
      c.parseCssColorToRgba(String(cs.webkitTextFillColor || '')) ||
      c.parseCssColorToRgba(String(cs.color || ''))
    );
  }

  function sameRgba(a, b) {
    return !!a && !!b && a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
  }

  // The effects that stopped the colours being measured, by whether they
  // can at most keep two equal colours equal (filter, blend: the same
  // effect on the same colour) or also keep two close colours close
  // (a background or an opacity behind or around both).
  const SAME_ONLY = new Set(['BACKGROUND_FILTER_OR_BACKDROP_FILTER', 'MIX_BLEND_MODE']);
  const LOW_RATIO = new Set([
    'COLOR_NOT_COMPUTABLE',
    'BACKGROUND_IMAGE_OR_GRADIENT',
    'ANCESTOR_OPACITY',
    'TEXT_SHADOW',
    'TEXT_STROKE'
  ]);
  const OWN_BACKGROUND = new Set([
    'COLOR_NOT_COMPUTABLE',
    'BACKGROUND_IMAGE_OR_GRADIENT',
    'BACKGROUND_OVERLAP',
    'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
    'MIX_BLEND_MODE',
    'ANCESTOR_OPACITY',
    'ELEMENT_OPACITY',
    'TEXT_SHADOW',
    'TEXT_STROKE'
  ]);

  function strokeOf(cs) {
    if (!cs || typeof cs.getPropertyValue !== 'function') return '';
    return (
      String(cs.getPropertyValue('-webkit-text-stroke-width') || '').trim() +
      ' ' +
      String(cs.getPropertyValue('-webkit-text-stroke-color') || '').trim()
    );
  }

  // Whether what stopped the link's colours being measured is the same for
  // the text around it: the same blocker, on the same element, or the same
  // shadow or outline on both.
  function effectShared(reasonCode, blocker, linkCs, textEl, parentCs) {
    if (reasonCode === 'COLOR_NOT_COMPUTABLE') return true;
    if (reasonCode === 'TEXT_SHADOW')
      return String(linkCs.textShadow || '') === String(parentCs.textShadow || '');
    if (reasonCode === 'TEXT_STROKE') return strokeOf(linkCs) === strokeOf(parentCs);
    if (!blocker || !textEl) return false;
    const other = c.getComputabilityBlocker(textEl);
    return (
      !!other &&
      other.ok === false &&
      other.reasonCode === blocker.reasonCode &&
      other.blockerSelector === blocker.blockerSelector &&
      other.blockerValue === blocker.blockerValue
    );
  }

  // The first background-color above el that paints, or null.
  function backgroundAround(el) {
    for (
      let cur = dom.parentElement(el), d = 0;
      cur && d < 200;
      cur = dom.parentElement(cur), d++
    ) {
      const bg = c.parseCssColorToRgba(
        String((safeComputedStyle(cur) || {}).backgroundColor || '')
      );
      if (bg && bg.a > 0) return bg;
    }
    return null;
  }

  // Which way a link left undecided because its colours could not be
  // measured points. A link with no underline and no other mark, drawn in
  // the same color as the text around it, or one less than 3:1 from it
  // where the effect in the way applies to both alike, has color as its
  // only cue, and too little of it. A link with an opaque background of
  // its own, unlike the one around it, is marked like a highlight.
  function undecidedLean(reasonCode, info) {
    try {
      if (!c || !info || !info.linkCs || !info.parentCs) return null;
      const { el, linkCs, textEl, parentCs, blocker, underlined } = info;
      if (!OWN_BACKGROUND.has(reasonCode)) return null;
      const ownBg = c.parseCssColorToRgba(String(linkCs.backgroundColor || ''));
      if (ownBg && ownBg.a === 1) {
        const around = backgroundAround(el);
        if (!around || (around.r === ownBg.r && around.g === ownBg.g && around.b === ownBg.b))
          return null;
        return {
          toward: 'pass',
          why: 'The link has an opaque background color of its own, unlike the one around it, which marks it without relying on its text color.',
          signals: [
            { signal: 'link-own-background', value: c.rgbToHex(ownBg) },
            { signal: 'background-around', value: c.rgbToHex(around) }
          ],
          caution: 'A background color close to the one around it may not be noticed.',
          i18n: {
            whyKey: 'linkInTextBlock_lean_why_ownBackground',
            cautionKey: 'linkInTextBlock_lean_caution_ownBackground'
          }
        };
      }
      if (underlined !== false) return null;
      if (ownBg && ownBg.a > 0) return null;
      if (
        !SAME_ONLY.has(reasonCode) &&
        !LOW_RATIO.has(reasonCode) &&
        reasonCode !== 'BACKGROUND_OVERLAP'
      )
        return null;
      const linkFill = fillOf(linkCs);
      const textFill = fillOf(parentCs);
      if (!linkFill || !textFill) return null;
      if (c.computeOpacityProduct(el) !== c.computeOpacityProduct(textEl)) return null;
      if (!effectShared(reasonCode, blocker, linkCs, textEl, parentCs)) return null;
      const same = sameRgba(linkFill, textFill);
      let ratio = null;
      if (!same) {
        if (!LOW_RATIO.has(reasonCode) || linkFill.a !== 1 || textFill.a !== 1) return null;
        ratio = c.contrastRatio(linkFill, textFill);
        if (!(ratio < 3)) return null;
      }
      const ratioStr = ratio === null ? '' : String(c.round2(ratio));
      const effect = reasonCode !== 'COLOR_NOT_COMPUTABLE';
      return {
        toward: 'fail',
        why: same
          ? 'The link is drawn in the same color as the text around it, with no underline or other mark, so nothing sets it apart.'
          : `The link's color is only ${ratioStr}:1 from the surrounding text's, below 3:1, and it has no underline or other mark, so color alone sets it apart, and too little.`,
        signals: [
          { signal: 'underline-absent', value: true },
          { signal: 'link-text-same-color', value: same },
          { signal: 'link-text-ratio', value: ratio === null ? 1 : Number(c.round2(ratio)) },
          { signal: 'blocked-by', value: reasonCode }
        ],
        ...(effect
          ? {
              caution:
                'The effect that kept the colors from being measured applies to the link and the text alike, but how it draws them is not modeled.'
            }
          : {}),
        i18n: {
          whyKey: same ? 'linkInTextBlock_lean_why_sameColor' : 'linkInTextBlock_lean_why_lowRatio',
          ...(effect ? { cautionKey: 'linkInTextBlock_lean_caution_effect' } : {}),
          params: same ? {} : { ratio: ratioStr }
        }
      };
    } catch {
      return null;
    }
  }

  // Whether the page's style sheets give the link a non-color cue on hover
  // and on focus, as G183 asks of a link told apart by color at 3:1 or
  // more: a :hover or :focus rule matching it (with the state taken out)
  // that underlines it, gives it a border, outline, shadow or background,
  // changes its weight or style, or gives its ::before or ::after content.
  // { onHover, onFocus, readable }: readable is false when a sheet, a selector
  // or the link's own tree (a shadow root, adopted sheets) can't be read.
  const STATE_RE = /:(hover|focus-visible|focus-within|focus)\b/gi;
  function declaresCue(style, onPseudo) {
    if (!style || typeof style.getPropertyValue !== 'function') return false;
    const n = Number(style.length) || 0;
    for (let i = 0; i < n; i++) {
      const prop = String(style[i] || '').toLowerCase();
      const value = String(style.getPropertyValue(prop) || '')
        .trim()
        .toLowerCase();
      if (!value) continue;
      if (prop.startsWith('text-decoration')) {
        if (/\b(underline|overline|line-through)\b/.test(value)) return true;
      } else if (prop.startsWith('border') || prop.startsWith('outline')) {
        if (prop.endsWith('-color') || prop.endsWith('-offset') || prop.endsWith('-radius'))
          continue;
        if (!/^(none|hidden|0|0px|initial|unset)$/.test(value)) return true;
      } else if (prop === 'box-shadow') {
        if (value !== 'none') return true;
      } else if (prop === 'background-color' || prop === 'background') {
        if (!isTransparentColor(value) && value !== 'none') return true;
      } else if (prop === 'background-image') {
        if (value !== 'none') return true;
      } else if (prop === 'font-weight' || prop === 'font-style') {
        return true;
      } else if (prop === 'content' && onPseudo) {
        if (!['none', 'normal', '""', "''"].includes(value)) return true;
      }
    }
    return false;
  }

  function hoverFocusCues(el) {
    const out = { onHover: false, onFocus: false, readable: true };
    const doc = el && dom.ownerDocument(el) ? dom.ownerDocument(el) : null;
    if (!doc || typeof dom.get(el, 'matches') !== 'function') return { ...out, readable: false };
    try {
      const root = dom.get(el, 'getRootNode') ? dom.getRootNode(el) : null;
      if (root && root !== doc) return { ...out, readable: false };
      const adopted = dom.get(doc, 'adoptedStyleSheets');
      if (adopted && adopted.length) out.readable = false;
    } catch {
      out.readable = false;
    }
    const consider = (cssRule) => {
      for (const part of splitSelectorList(cssRule.selectorText)) {
        if (!/:(hover|focus|focus-visible|focus-within)\b/i.test(part)) continue;
        const hover = /:hover\b/i.test(part);
        const focus = /:focus(-visible|-within)?\b/i.test(part);
        let base = part.replace(STATE_RE, '');
        const onPseudo = /::?(before|after)\b/i.test(base);
        base = base.replace(/::?(before|after)\b/gi, '');
        if (/::[a-z-]+/i.test(base)) continue;
        base = base.trim() || '*';
        if (/[>+~]$/.test(base)) base += ' *';
        let matched;
        try {
          matched = dom.matches(el, base);
        } catch {
          out.readable = false;
          continue;
        }
        if (!matched || !declaresCue(cssRule.style, onPseudo)) continue;
        if (hover) out.onHover = true;
        if (focus) out.onFocus = true;
      }
    };
    const walk = (rules, depth) => {
      if (!rules || depth > MAX_NESTED_DEPTH) return;
      for (const cssRule of rules) {
        if (!cssRule) continue;
        if (cssRule.type === CSS_STYLE_RULE && cssRule.selectorText) consider(cssRule);
        let nested;
        try {
          nested = cssRule.cssRules || null;
        } catch {
          nested = null;
        }
        if (nested && nested.length) walk(nested, depth + 1);
      }
    };
    try {
      for (const sheet of dom.styleSheets(doc) || []) {
        let rules = null;
        try {
          rules = sheet && sheet.cssRules ? sheet.cssRules : null;
        } catch {
          out.readable = false;
          continue;
        }
        if (rules) walk(rules, 0);
      }
    } catch {
      out.readable = false;
    }
    return out;
  }

  // A link told apart by color alone at 3:1 or more: it leans pass where
  // the style sheets add a non-color cue on hover and on focus, and fail
  // where every sheet could be read and none adds one on hover.
  function contrastOnlyLean(el, ratio) {
    try {
      const cues = hoverFocusCues(el);
      const handlers = ['onmouseover', 'onmouseenter', 'onfocus', 'onfocusin'].some(
        (a) => dom.getAttribute(el, a) != null
      );
      const signals = [
        { signal: 'hover-cue-rule', value: cues.onHover },
        { signal: 'focus-cue-rule', value: cues.onFocus },
        { signal: 'stylesheets-readable', value: cues.readable },
        { signal: 'contrast-ratio', value: Number(c.round2(ratio)) }
      ];
      if (cues.onHover && cues.onFocus) {
        return {
          toward: 'pass',
          why: "The page's style sheets give this link an underline or another non-color cue when it is hovered and when it is focused.",
          signals,
          caution: 'A later or more specific rule can undo the cue; check that it shows.',
          i18n: {
            whyKey: 'linkInTextBlock_lean_why_hoverFocusCue',
            cautionKey: 'linkInTextBlock_lean_caution_hoverFocusCue'
          }
        };
      }
      if (!cues.onHover && cues.readable && !handlers) {
        return {
          toward: 'fail',
          why: "No rule in the page's style sheets adds an underline or another non-color cue when this link is hovered, so its color stays its only cue.",
          signals,
          caution: 'A cue a script adds is not in the style sheets.',
          i18n: {
            whyKey: 'linkInTextBlock_lean_why_noHoverCue',
            cautionKey: 'linkInTextBlock_lean_caution_noHoverCue'
          }
        };
      }
    } catch {}
    return null;
  }

  // An inline element that holds nothing but the link (<span><a>...</a></span>,
  // as frameworks often wrap one) is part of the link as far as the text
  // around it goes: the surrounding text is its parent's.
  function wrapperHasCue(wrapper, cs) {
    const outerCs = safeComputedStyle(dom.parentElement(wrapper));
    if (
      c &&
      outerCs &&
      c.normalizeFontWeight(cs.fontWeight) !== c.normalizeFontWeight(outerCs.fontWeight)
    ) {
      return true;
    }
    if (outerCs && (cs.fontStyle || 'normal') !== (outerCs.fontStyle || 'normal')) return true;
    if (hasBorder(cs)) return true;
    const deco = decorationInfo(cs);
    return deco.trustworthy && deco.underlined && !isTransparentColor(cs.textDecorationColor);
  }

  function textParentOf(el) {
    let child = el;
    let parent = dom.parentElement(el);
    for (let depth = 0; parent && depth < 5; depth++) {
      if (hasSurroundingText(child, parent)) break;
      if (dom.firstElementChild(parent) !== child || dom.lastElementChild(parent) !== child) break;
      const wcs = safeComputedStyle(parent) || {};
      const display = String(wcs.display || '');
      if (!display.startsWith('inline') || display === 'inline-block') break;
      // A wrapper that sets the link apart itself is not transparent: a
      // footnote marker raised by <sup>, or a bold or underlined wrapper.
      const valign = String(wcs.verticalAlign || 'baseline');
      if (valign !== 'baseline' || wrapperHasCue(parent, wcs)) break;
      child = parent;
      parent = dom.parentElement(parent);
    }
    return parent;
  }

  // Whether the cue that sets a link apart can sit on an element inside it:
  // every piece of the link's text is inside an element, between the text
  // and the link, that is bold, italic, underlined or bordered where the
  // surrounding text is not (<a><strong>guide</strong></a>), or that has a
  // background of its own unlike the surrounding text's, as a code chip or
  // <mark> does, or is raised or lowered, as a footnote's <sup> is (#107).
  function cueOnContent(el, parent, parentCs) {
    let parentBgHex;
    const backgroundHex = (node) => {
      try {
        const bg = c.computeEffectiveBackground(node, {
          contrast: { mode, rootCanvasFallback },
          collectStack: false
        });
        return bg && bg.ok && bg.rgba ? c.rgbToHex(bg.rgba) : null;
      } catch {
        return null;
      }
    };
    const ownBackground = (node, cs) => {
      if (!c || !c.rgbToHex || isTransparentColor(cs.backgroundColor || 'transparent'))
        return false;
      if (parentBgHex === undefined) parentBgHex = backgroundHex(parent);
      const hex = backgroundHex(node);
      return !!hex && !!parentBgHex && hex !== parentBgHex;
    };
    const parentWeight = c && parentCs ? c.normalizeFontWeight(parentCs.fontWeight) : 400;
    const parentStyle = (parentCs && parentCs.fontStyle) || 'normal';
    const hasCue = (node) => {
      const cs = safeComputedStyle(node);
      if (!cs) return false;
      if (c && c.normalizeFontWeight(cs.fontWeight) !== parentWeight) return true;
      if ((cs.fontStyle || 'normal') !== parentStyle) return true;
      if (hasBorder(cs)) return true;
      if (String(cs.verticalAlign || 'baseline') !== 'baseline') return true;
      if (hasBackgroundImage(cs, node) || ownBackground(node, cs)) return true;
      const deco = decorationInfo(cs);
      return deco.trustworthy && deco.underlined && !isTransparentColor(cs.textDecorationColor);
    };
    let sawText = false;
    const doc = dom.ownerDocument(el);
    const walker =
      doc && dom.get(doc, 'createTreeWalker') ? dom.createTreeWalker(doc, el, 4) : null;
    if (!walker) return false;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!dom.nodeValue(n) || !dom.nodeValue(n).trim()) continue;
      sawText = true;
      let cued = false;
      // Bounded as a safety net only: a walk up a real tree always ends.
      for (
        let a = dom.parentElement(n), i = 0;
        a && a !== el && i < 100000;
        a = dom.parentElement(a), i++
      ) {
        if (hasCue(a)) {
          cued = true;
          break;
        }
      }
      if (!cued) return false;
    }
    return sawText;
  }

  // Whether the link draws text: a text node with something other than
  // white space in its flat tree (its shadow tree's, with what is slotted
  // into it), and, where the page has a layout, a box of some area. A link
  // that draws no text can't be told from the text around it by its color,
  // and has no name, which link-name-present reports.
  let pageHasLayout;
  function drawsText(el) {
    let found = false;
    let budget = 20000;
    const visit = (node, depth) => {
      if (found || budget-- <= 0 || depth > 200) return;
      const type = dom.nodeType(node);
      if (type === 3) {
        if (/\S/.test(dom.nodeValue(node) || '')) found = true;
        return;
      }
      if (type !== 1 && type !== 11) return;
      let kids = null;
      if (type === 1) {
        const name = String(dom.localName(node) || '').toLowerCase();
        if (name === 'script' || name === 'style' || name === 'template') return;
        let root;
        try {
          root = dom.shadowRoot(node);
        } catch {
          root = null;
        }
        if (root) kids = dom.childNodes(root);
        else if (name === 'slot') {
          try {
            const assigned = dom.assignedNodes(node, { flatten: true });
            if (assigned && assigned.length) kids = assigned;
          } catch {
            // No slotting here: its fallback content stands.
          }
        }
      }
      if (!kids) kids = dom.childNodes(node);
      for (let i = 0; kids && i < kids.length && !found; i++) visit(kids[i], depth + 1);
    };
    try {
      visit(el, 0);
    } catch {
      return true;
    }
    if (!found) return false;
    try {
      if (pageHasLayout === undefined) {
        const root = dom.documentElement(dom.ownerDocument(el));
        const r = root && dom.getBoundingClientRect(root);
        pageHasLayout = !!r && (r.width > 0 || r.height > 0);
      }
      if (!pageHasLayout) return true;
      const cs = safeComputedStyle(el);
      // A display: contents link has no box of its own; its text has.
      if (cs && cs.display === 'contents') return true;
      const rects = dom.getClientRects(el);
      if (!rects) return true;
      for (let i = 0; i < rects.length; i++) {
        if (rects[i] && rects[i].width > 0 && rects[i].height > 0) return true;
      }
      return false;
    } catch {
      return true;
    }
  }

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    if (!drawsText(el)) continue;

    const parent = textParentOf(el);
    if (!hasSurroundingText(el, parent)) continue;

    applicableCount += 1;

    const linkCs = safeComputedStyle(el);
    // The surrounding text's style: the parent's, or the inline element's
    // beside the link that holds the text.
    const textEl = textElementOf(parent);
    const parentCs = safeComputedStyle(textEl);

    // Cues that do not depend on `text-decoration` come first, so a link
    // carrying one is decided even where decoration is unreadable.
    const linkWeight = c && linkCs ? c.normalizeFontWeight(linkCs.fontWeight) : 400;
    const parentWeight = c && parentCs ? c.normalizeFontWeight(parentCs.fontWeight) : 400;
    if (linkWeight !== parentWeight) {
      decidedCount += 1;
      continue;
    }

    const linkStyle = (linkCs && linkCs.fontStyle) || 'normal';
    const parentStyle = (parentCs && parentCs.fontStyle) || 'normal';
    if (linkStyle !== parentStyle) {
      decidedCount += 1;
      continue;
    }

    // An underline the computed style vouches for settles the link before
    // the costlier marks are looked for (what a ::before or ::after draws).
    const shown = decorationInfo(linkCs);
    if (
      shown.trustworthy &&
      shown.underlined &&
      !isTransparentColor(linkCs && linkCs.textDecorationColor)
    ) {
      decidedCount += 1;
      continue;
    }

    // A border, box-shadow, outline, background image, icon or generated
    // content marks the link without relying on color.
    if (hasNonColorMark(el, linkCs) || cueOnContent(el, parent, parentCs)) {
      decidedCount += 1;
      continue;
    }

    if (!c) {
      markUndecided(el, 'CONTRAST_HELPERS_UNAVAILABLE');
      continue;
    }

    // An underline is a non-color cue: once it is found, the colors do not
    // matter, so it is looked for before them. Otherwise an underlined link
    // on a page whose background cannot be computed (no background set,
    // which strict mode does not assume is white) was left undecided, while
    // a bold one passed. null: this environment cannot tell.
    let underlined = null;
    const decoration = decorationInfo(linkCs);
    if (decoration.trustworthy) {
      // An underline drawn in a transparent color shows nothing.
      underlined =
        decoration.underlined && !isTransparentColor(linkCs && linkCs.textDecorationColor);
    } else {
      const fromCssom = resolveUnderlineFromCssom(el);
      if (fromCssom.resolved) underlined = fromCssom.underlined;
    }
    if (underlined === true) {
      decidedCount += 1;
      continue;
    }

    let flagged = false;
    let computed = false;
    let backgroundDiffers = false;
    let ratio = null;
    let fgLinkHex = '';
    let fgParentHex = '';
    let undecidedReason = 'COLOR_NOT_COMPUTABLE';
    let lastBlocker = null;

    try {
      const blocker = c.getComputabilityBlocker(el);
      // Paint under the text that is not an ancestor's leaves the link's
      // color and the surrounding text's as they are: only a translucent
      // one depends on what is behind it, checked below.
      const overlapOnly =
        !!blocker && blocker.ok === false && blocker.reasonCode === 'BACKGROUND_OVERLAP';
      // A ::first-line or ::first-letter of the link's own in a color of
      // its own, with nothing else in the way: the link is compared with
      // the text around it in both colors, below (#2 in measurePseudoElementText).
      const pseudo =
        !!blocker &&
        blocker.ok === false &&
        blocker.reasonCode === 'PSEUDO_ELEMENT_COLOR' &&
        !!blocker.pseudoColors &&
        blocker.pseudoColors.background.a === 0 &&
        blocker.pseudoColors.fontWeightNum === linkWeight &&
        typeof c.measurePseudoElementText === 'function';
      if (blocker && blocker.ok === false) lastBlocker = blocker;
      if (blocker && blocker.ok === false && !overlapOnly && !pseudo) {
        // Not confidently computable: recorded below rather than skipped, so
        // it cannot be mistaken for a clean result.
        if (blocker.reasonCode) undecidedReason = String(blocker.reasonCode);
      } else {
        const bg = c.computeEffectiveBackground(el, {
          contrast: { mode, rootCanvasFallback },
          collectStack: false
        });
        const fgLink = c.computeEffectiveForeground(el);
        const fgParent = c.computeEffectiveForeground(textEl);

        if (
          overlapOnly &&
          fgLink &&
          fgLink.rgba &&
          fgParent &&
          fgParent.rgba &&
          (fgLink.rgba.a < 1 || fgParent.rgba.a < 1)
        ) {
          undecidedReason = 'BACKGROUND_OVERLAP';
        } else if (bg && bg.ok && bg.rgba && fgLink && fgLink.rgba && fgParent && fgParent.rgba) {
          const fgLinkOpaque =
            fgLink.rgba.a < 1
              ? c.compositeRgba(fgLink.rgba, bg.rgba)
              : { r: fgLink.rgba.r, g: fgLink.rgba.g, b: fgLink.rgba.b, a: 1 };
          const fgParentOpaque =
            fgParent.rgba.a < 1
              ? c.compositeRgba(fgParent.rgba, bg.rgba)
              : { r: fgParent.rgba.r, g: fgParent.rgba.g, b: fgParent.rgba.b, a: 1 };

          ratio = c.contrastRatio(fgLinkOpaque, fgParentOpaque);
          fgLinkHex = c.rgbToHex ? c.rgbToHex(fgLinkOpaque) : '';
          fgParentHex = c.rgbToHex ? c.rgbToHex(fgParentOpaque) : '';

          computed = true;
          // In the pseudo-element's color too: where both reach 3:1, or
          // both fall short, which text it paints doesn't change the
          // answer, which is taken from the closer one when both reach it
          // and from the better one when both fall short. Where they
          // disagree it is asked about.
          if (pseudo) {
            const m = c.measurePseudoElementText(el, {
              contrast: { mode, rootCanvasFallback },
              collectStack: false
            });
            const pRatio = m ? c.contrastRatio(m.pseudo.fg, fgParentOpaque) : NaN;
            if (!m || !Number.isFinite(pRatio) || pRatio >= 3 !== ratio >= 3) {
              computed = false;
              undecidedReason = 'PSEUDO_ELEMENT_COLOR';
            } else if (ratio >= 3 ? pRatio < ratio : pRatio > ratio) {
              ratio = pRatio;
              fgLinkHex = c.rgbToHex ? c.rgbToHex(m.pseudo.fg) : '';
            }
          }
          if (!(ratio >= 3)) flagged = true;

          // A background color of the link's own, different from the one
          // behind the surrounding text, marks it like a highlight.
          const ownBg = String((linkCs && linkCs.backgroundColor) || '').replace(/\s+/g, '');
          const transparentBg =
            !ownBg || ownBg === 'transparent' || /^rgba\(\d+,\d+,\d+,0(\.0+)?\)$/.test(ownBg);
          if (!transparentBg && c.rgbToHex) {
            const parentBg = c.computeEffectiveBackground(parent, {
              contrast: { mode, rootCanvasFallback },
              collectStack: false
            });
            if (parentBg && parentBg.ok && parentBg.rgba) {
              backgroundDiffers = c.rgbToHex(parentBg.rgba) !== c.rgbToHex(bg.rgba);
            }
          }
        }
        // else: not confidently computable, recorded below.
      }
    } catch {
      // No-throw: treat as not computable and record it.
      undecidedReason = 'ENGINE_EXCEPTION';
    }

    if (!computed) {
      markUndecided(
        el,
        undecidedReason,
        undecidedLean(undecidedReason, {
          el,
          linkCs,
          textEl,
          parentCs,
          blocker: lastBlocker,
          underlined
        })
      );
      continue;
    }

    if (backgroundDiffers) {
      decidedCount += 1;
      continue;
    }

    // No underline was found. If this environment could not tell, the
    // colors cannot settle it either.
    if (underlined === null) {
      markUndecided(el, 'TEXT_DECORATION_NOT_RESOLVABLE');
      continue;
    }

    // Color is the only cue at rest. At 3:1 or more, G183 also needs a
    // non-color cue on hover and focus, which a static scan cannot see.
    colorCompared += 1;
    if (!flagged) {
      contrastOnly.push({ el, ratio, fgLinkHex, fgParentHex });
      continue;
    }

    decidedCount += 1;

    const eligInfo = helpers.getEligibilityInfo
      ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
      : null;
    const tag = (dom.tagName(el) || '').toLowerCase();
    const ratioStr = c.round2 ? c.round2(ratio) : String(ratio);

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          'This link in a block of text relies on color alone to be distinguished from the surrounding text.',
        hint: 'Add an underline or another non-color cue (a font-weight or style difference, a border, an icon). Raising the color contrast with the surrounding text to 3:1 is enough only if hovering and focusing the link also add a non-color cue.',
        i18n: {
          summaryKey: 'linkInTextBlock_summary_fail',
          hintKey: 'linkInTextBlock_hint_fail',
          params: { element: tag, ratio: String(ratioStr), threshold: '3' }
        },
        data: {
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
          details: {
            reasonCode: 'COLOR_ONLY_DIFFERENTIATION',
            metrics: { ratio, threshold: 3 },
            colors: { linkForegroundHex: fgLinkHex, surroundingTextForegroundHex: fgParentHex }
          }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const cantTellOccurrences = undecided.map(({ el, reasonCode, lean }) =>
    helpers.reportOccurrence(el, {
      occurrenceOutcome: 'cantTell',
      ...(lean ? { lean } : {}),
      summary:
        'Whether this link is distinguishable from the surrounding text by non-color means could not be determined.',
      hint: 'Confirm by eye that the link carries an underline, a font-weight or font-style difference or another non-color mark, or at least 3:1 contrast against the surrounding text together with a non-color cue on hover and focus. Running the engine in a real browser rather than a DOM emulator resolves most cases automatically.',
      i18n: {
        summaryKey: 'linkInTextBlock_summary_cantTell',
        hintKey: 'linkInTextBlock_hint_cantTell'
      },
      uncertainty: {
        code: 'not-computable',
        needed:
          'Whether the link carries an underline, weight or style difference, or 3:1 contrast against its surrounding text.',
        evidence: { reasonCode }
      },
      data: {
        visibilityFilter: helpers.getEligibilityInfo
          ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
          : { targetSet: 'acc', accEligible: null, reasons: [] },
        details: { reasonCode }
      }
    })
  );

  const contrastOnlyOccurrences = contrastOnly.map(({ el, ratio, fgLinkHex, fgParentHex }) => {
    const ratioStr = c && c.round2 ? c.round2(ratio) : String(ratio);
    const lean = contrastOnlyLean(el, ratio);
    return helpers.reportOccurrence(el, {
      occurrenceOutcome: 'cantTell',
      ...(lean ? { lean } : {}),
      summary: `This link in a block of text is distinguished from the surrounding text only by its color (contrast ${ratioStr}:1). That is enough only if hovering and focusing it also show a non-color cue, such as an underline.`,
      hint: 'Hover over the link and move keyboard focus to it: confirm that each state adds a non-color cue (an underline, a border, a weight change). Otherwise underline the link at rest.',
      i18n: {
        summaryKey: 'linkInTextBlock_summary_cantTell_contrastOnly',
        hintKey: 'linkInTextBlock_hint_cantTell_contrastOnly',
        params: { ratio: String(ratioStr), threshold: '3' }
      },
      uncertainty: {
        code: 'runtime-dependent',
        needed: 'Whether hovering and focusing the link add a non-color cue.',
        evidence: { reasonCode: 'LINK_COLOR_CONTRAST_ONLY', ratio }
      },
      data: {
        visibilityFilter: helpers.getEligibilityInfo
          ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
          : { targetSet: 'acc', accEligible: null, reasons: [] },
        details: {
          reasonCode: 'LINK_COLOR_CONTRAST_ONLY',
          metrics: { ratio, threshold: 3 },
          colors: { linkForegroundHex: fgLinkHex, surroundingTextForegroundHex: fgParentHex }
        }
      }
    });
  });

  // Links told apart by color alone that reach 3:1 against the surrounding
  // text: the closest is the result's margin (src/core/margin.js).
  const margin = {
    marginCandidates: contrastOnly.map(({ el, ratio }) => ({ el, value: ratio, threshold: 3 })),
    measuredCount: colorCompared
  };

  // See helpers.resolveTieredOutcome (src/core/dom-helpers.js): a proven
  // violation outranks an undecided candidate for the rule's own outcome, but
  // never discards it, so an unevaluable link survives a failure elsewhere in
  // the same run.
  if (occurrences.length || cantTellOccurrences.length || contrastOnlyOccurrences.length) {
    const resolved = helpers.resolveTieredOutcome(
      occurrences,
      contrastOnlyOccurrences.concat(cantTellOccurrences),
      rule.defaultSeverity || 'serious'
    );
    return {
      ruleId: rule.ruleId,
      ...resolved,
      ...(resolved.outcome === 'cantTell' ? { confidence: 'low' } : null),
      ...margin
    };
  }

  if (decidedCount > 0) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
