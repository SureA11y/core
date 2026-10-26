/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check contrast-computable
 * @atomic true
 * @summary Color contrast must be computable from CSS for rendered text
 * @standard WCAG 2.2
 * @sc 1.4.3
 * @sc 1.4.6
 * @applicability
 *   Applies to every visible text node in scope, plus the label of <input
 *   type="button">/[type="submit"]/[type="reset"], which is rendered from
 *   the value attribute and so is invisible to a text-node walk, and the
 *   text a form field shows: the current value of a <textarea> or of an
 *   <input> that shows text (text, search, email, url, tel, password,
 *   number, the date and time types), or, while the value is empty, its
 *   placeholder, in the ::placeholder color, font, opacity and background
 *   (only where the browser computes that style; jsdom does not). The text
 *   of a drop-down <select> (no `multiple`, a size of 1 or none, not
 *   `appearance: base-select`) counts as the select's, drawn by the closed
 *   control in its colours, font and background: its shown option, and any
 *   other option with the select's colours. In a browser, so is the text a
 *   ::before or ::after `content` generates (strings, attr() as the browser
 *   resolves it, counters), and a list item's ::marker text (a number or a
 *   letter, or a string; a bullet or an image isn't text), each judged in
 *   the pseudo-element's colour and font, on its element; jsdom computes no
 *   pseudo-element styles, so there it is left out. Text counts
 *   only when its element is DOM-visible under the run's visibility mode, is
 *   not clipped out of sight by the sr-only technique (clip or clip-path),
 *   and belongs neither to a disabled control nor to the label of one,
 *   WCAG's inactive-user-interface-component exception. Subtrees excluded
 *   via engineOptions.excludeSelectors are skipped, and open shadow roots
 *   are walked as roots in their own right.
 * @expectation
 *   Both sides of the contrast calculation can be established from CSS for
 *   every applicable text node: an effective background resolving to an
 *   opaque color, and a parsable foreground color. Where either cannot be,
 *   a background image or gradient (a gradient of one color is that color,
 *   and a layer that paints nothing under the text, such as a 1px underline,
 *   is left out: docs/LAYOUT_MEASUREMENT.md), mix-blend-mode, a filter
 *   (other than drop-shadow() alone over an opaque background under all of
 *   the text, which hides the shadow) or backdrop-filter, a text-shadow (which may add contrast
 *   this engine has no glyph-rendering model to account for), a
 *   -webkit-text-stroke
 *   outline (drawn in its own colour, often most of the glyph), a
 *   ::first-line or ::first-letter in a colour of its own (which text it
 *   paints depends on line breaks), opacity on an ancestor, or
 *   on the text's own element over a background of its own, that can't be
 *   resolved against what lies behind it, a root
 *   background that never becomes opaque where the page's canvas can't be
 *   known (in a frame, under forced colors; elsewhere text is measured on
 *   the canvas, see contrast-minimum), a color that does not parse, or an
 *   option of a drop-down <select>,
 *   other than the shown one, with a color, background or opacity of its
 *   own (SELECT_OPTION_COLOR: it is shown only in the list the select
 *   opens, which the platform draws in those colours or in its own),
 *   or, in an emulator such as jsdom, a text colour that can't be worked
 *   out in the color scheme the page is drawn in (COLOR_SCHEME_NOT_RENDERED),
 *   the result is cantTell naming the blocker. This rule is the one that
 *   reports that uncertainty, which is what lets contrast-minimum and
 *   contrast-enhanced stay silent on the same text instead of guessing at
 *   a ratio. One exception: text drawn by a stroke or a shadow, every
 *   colour of which, its fill included when seen, is below the AA ratio
 *   against a flat background, fails contrast-minimum and
 *   contrast-enhanced, and is not asked about here.
 * @reports
 *   - `blockerProperty`, `blockerValue` (a CSS effect in the way): the CSS
 *     property that blocks the calculation and its value, for example
 *     `mix-blend-mode`, `filter`, `text-shadow`, `-webkit-text-stroke` or
 *     `opacity`.
 *   - `blockerSelector` (a CSS effect in the way): a selector for the
 *     element that has it, which may be an ancestor of the text.
 *   - `backgroundFillType` (a background image or gradient): `image`,
 *     `gradient`, `imageAndGradient`, or `unknown`.
 *   - `background`, `backgroundAlpha` (a background that never becomes
 *     opaque, or a color that does not parse): the background color as far
 *     as it could be worked out, as an `rgba()` string, and its opacity from
 *     0 to 1.
 *   - `eligibleTextCount` (the pass): how many text nodes were checked.
 *   - `assumptionsCount`, `assumptionsApplied` (the pass): how many text
 *     nodes needed an assumption to get a background, and which ones were
 *     made. Each item is a code; `ROOT_CANVAS_FALLBACK` means a page
 *     background that never becomes opaque was taken to sit on the canvas
 *     color the scan names (`contrast.rootCanvasFallback`), or, with the
 *     `auditorAssist` mode where the page's own canvas can't be known (in a
 *     frame, under forced colors), on that color, white by default. Text
 *     measured on the canvas the page's color scheme gives it needs none.
 *   - `generatedBy` (generated text that can't be measured): `::before`,
 *     `::after` or `::marker`, the pseudo-element whose text is asked
 *     about; the selector names its element. `GENERATED_TEXT_UNREADABLE`
 *     is content whose text can't be read (a counter in a style of the
 *     page's own), `GENERATED_TEXT_POSITIONED` a pseudo-element taken out
 *     of the flow with no opaque background of its own.
 *   - `forcedColors` (every occurrence, when the colors measured were
 *     forced): `true`, and the hint says to check the page again with
 *     forced colors off. A scan under forced colors measures the page's own
 *     colors, so this is there only where it could not keep the page in
 *     them (docs/LAYOUT_MEASUREMENT.md, "Forced colors").
 * @reason-codes
 *   - `BACKGROUND_IMAGE_OR_GRADIENT` (cantTell): a background image or gradient
 *     lies behind the text, so the colour it sits on could not be worked out.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `BACKGROUND_OVERLAP` (cantTell): another element paints under the text,
 *     so the background it sits on could not be worked out.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `BACKGROUND_NOT_COMPUTABLE` (cantTell): the background behind the text
 *     could not be worked out.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `BACKGROUND_NOT_OPAQUE_AT_ROOT` (cantTell): no element behind the text,
 *     up to the root, has an opaque background, and the canvas under it
 *     can't be known: in a frame, where the page around it may show
 *     through, or under forced colors, where it is the user's palette.
 *     Elsewhere the text is measured on the canvas its color scheme gives
 *     the page, and not asked about.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `BACKGROUND_UNPARSABLE` (cantTell): a background colour behind the text
 *     does not parse.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `FOREGROUND_UNPARSABLE` (cantTell): the text colour does not parse.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `BACKGROUND_FILTER_OR_BACKDROP_FILTER` (cantTell): a filter or backdrop-
 *     filter changes the colours drawn, so the declared colours are not what is
 *     on screen.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `MIX_BLEND_MODE` (cantTell): a mix-blend-mode blends the text or its
 *     background with what is behind it, so the colours on screen could not be
 *     worked out.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `ANCESTOR_OPACITY` (cantTell): an ancestor with opacity below 1 fades the
 *     text and its background together, in a way that could not be resolved
 *     against what lies behind it.
 *     It leans fail when, before any fading, its opaque text colour is below
 *     the AA ratio against the first opaque background behind it.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `ELEMENT_OPACITY` (cantTell): the text's own element has opacity below 1
 *     over a background of its own, which could not be resolved against what
 *     lies behind it.
 *     It leans fail when, before any fading, its opaque text colour is below
 *     the AA ratio against that background.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `TEXT_SHADOW` (cantTell): a text-shadow may add contrast the colours
 *     alone do not show, so the ratio is for a person to measure.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `TEXT_STROKE` (cantTell): a -webkit-text-stroke draws the text in a
 *     colour of its own, so the ratio is for a person to measure.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `PSEUDO_ELEMENT_COLOR` (cantTell): a ::first-line or ::first-letter has a
 *     colour of its own, and which text it paints depends on line breaks.
 *     Where nothing else is in the way and the text's own colours and the
 *     pseudo-element's agree, both reaching or both missing the AA ratio and
 *     the AAA ratio, contrast-minimum and contrast-enhanced decide it and it is
 *     not asked about here.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `SELECT_OPTION_COLOR` (cantTell): an option of a drop-down select, other
 *     than the shown one, has colours of its own and is drawn only in the list
 *     the platform opens.
 *     It leans fail when the option's opaque colour is below the AA ratio
 *     against its opaque background (or the select's), and pass when it reaches
 *     the AAA ratio.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `GENERATED_TEXT_UNREADABLE` (cantTell): text a ::before, ::after or
 *     ::marker generates could not be read, such as a counter in a style of the
 *     page's own.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `GENERATED_TEXT_POSITIONED` (cantTell): a ::before or ::after with text
 *     is taken out of the flow without an opaque background of its own, so what
 *     lies behind it is unknown.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `COLOR_SCHEME_NOT_RENDERED` (cantTell): the page is drawn in a color
 *     scheme (`blockerValue`: `light` or `dark`) whose colours for this text
 *     the scan can't read. An emulator such as jsdom computes the light
 *     scheme's colours and applies no prefers-color-scheme rule: on a page
 *     drawn in light, text such a rule reaches; on a page drawn in dark
 *     (`color-scheme: dark`), text whose colour, or a background behind it,
 *     a prefers-color-scheme rule, a custom property or system colour, or
 *     the browser's own form-control colours set. The dark scheme's
 *     CanvasText and LinkText, and light-dark() and the CanvasText,
 *     LinkText and Canvas the page gives a text colour, are worked out
 *     (Chromium's colours). A browser computes the colours it draws.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 *   - `ENGINE_EXCEPTION` (cantTell): the rule stopped on an internal error; the
 *     text is to be measured by hand.
 *     Basis: WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled).
 */

const id = 'contrast-computable';

const meta = {
  title: 'Color contrast is computable for rendered text',
  description:
    'Determines whether sufficient information is available to compute WCAG color contrast for visible text (e.g., no gradients/images/blend modes that make background indeterminate).',
  i18n: {
    titleKey: 'contrastComputable_title',
    descriptionKey: 'contrastComputable_description'
  },
  helpUrl: null,
  tags: [
    'wcag2aa',
    'wcag2aaa',
    'wcag143',
    'wcag146',
    'contrast',
    'color',
    'structure',
    'atomic',
    'automatic',
    'dom'
  ],
  wcagSc: ['1.4.3', '1.4.6'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.3',
      title: 'Contrast (Minimum)',
      conformanceLevel: 'AA'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.6',
      title: 'Contrast (Enhanced)',
      conformanceLevel: 'AAA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '1.4.3': ['contrast-computability-143'],
      '1.4.6': ['contrast-computability-146']
    }
  },
  // Reason codes built at runtime, which scripts/generate-finding-ids.js
  // can't read from the source.
  reasonCodes: [
    'BACKGROUND_NOT_OPAQUE_AT_ROOT',
    'BACKGROUND_OVERLAP',
    'BACKGROUND_UNPARSABLE',
    'FOREGROUND_UNPARSABLE',
    'TEXT_SHADOW',
    'TEXT_STROKE',
    'PSEUDO_ELEMENT_COLOR',
    'SELECT_OPTION_COLOR',
    'GENERATED_TEXT_UNREADABLE',
    'GENERATED_TEXT_POSITIONED',
    'COLOR_SCHEME_NOT_RENDERED'
  ],
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    ANCESTOR_OPACITY: {
      steps: [
        'Find the text the report names and note the ancestor with opacity below 1.',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the text and background as they appear on screen (faded), with an eyedropper on the rendered page.",
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen:
        'The faded colours on screen reach the threshold, or the faded text is an inactive (disabled) control, which is exempt.',
      failWhen:
        'The faded colours on screen give a ratio below the threshold, which fails WCAG 1.4.3 (or 1.4.6), unless the text is part of an inactive control.'
    },
    BACKGROUND_FILTER_OR_BACKDROP_FILTER: {
      steps: [
        'Find the text the report names and note the filter or backdrop-filter on it or an ancestor (in the developer tools Styles pane).',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the text and background colours as they appear on screen with the filter applied, using an eyedropper on the rendered page rather than the declared values.",
        'For a blur or backdrop-filter over changing content, scroll or wait so different content passes behind, and check the worst case.',
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen: 'With the filter applied, the ratio on screen reaches the threshold.',
      failWhen:
        'With the filter applied, the ratio on screen falls below the threshold, which fails WCAG 1.4.3 (or 1.4.6).'
    },
    BACKGROUND_IMAGE_OR_GRADIENT: {
      steps: [
        'Find the text the report names and look at the image or gradient behind it.',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the text colour against the lightest and darkest parts of the background directly behind the letters.",
        'If the image changes (slides, video, responsive images), check each version and at a few window widths.',
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen:
        'Every part of the background behind the letters gives at least the threshold ratio.',
      failWhen:
        'Some part of the background behind the text gives a ratio below the threshold, which fails WCAG 1.4.3 (or 1.4.6).'
    },
    BACKGROUND_NOT_COMPUTABLE: {
      steps: [
        'Find the text the report names on the page.',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the text colour against the colour seen directly behind the letters, taking the darkest and lightest points if it varies.",
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen: 'The ratio reaches the threshold everywhere behind the text.',
      failWhen:
        'The ratio is below the threshold anywhere behind the text, which fails WCAG 1.4.3 (or 1.4.6).'
    },
    BACKGROUND_NOT_OPAQUE_AT_ROOT: {
      steps: [
        'Find the text the report names; the page sets no opaque background behind it, so what shows there is the canvas the browser paints, or, in a frame, the page around it.',
        'View the page where it is shown: inside the page that embeds it, with forced colors off, and in each color scheme the page supports (light and dark).',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the text against the background actually seen in each setting.",
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen: 'The ratio reaches the threshold in every setting where the page is shown.',
      failWhen:
        'In some setting where the page is shown the ratio is below the threshold, which fails WCAG 1.4.3 (or 1.4.6).'
    },
    BACKGROUND_OVERLAP: {
      steps: [
        'Find the text the report names and check which element actually paints behind it (inspect it and toggle the overlapping element off and on).',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the text colour against the colour actually seen behind the letters.",
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen: 'The colour actually behind the text gives at least the threshold ratio.',
      failWhen:
        'The colour actually behind the text gives a ratio below the threshold, which fails WCAG 1.4.3 (or 1.4.6).'
    },
    BACKGROUND_UNPARSABLE: {
      steps: [
        'Find the text the report names and inspect the background colour value in the developer tools (often a newer syntax such as oklch(), lab() or color()).',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the text colour against the background as rendered on screen.",
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen: 'The ratio reaches the threshold.',
      failWhen: 'The ratio is below the threshold, which fails WCAG 1.4.3 (or 1.4.6).'
    },
    COLOR_SCHEME_NOT_RENDERED: {
      steps: [
        'Open the page in a browser set to the color scheme the report names (blockerValue: light or dark), or emulate it in the developer tools (Rendering, prefers-color-scheme).',
        "Find the text the report names and use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure it against the background behind it.",
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen: 'In that color scheme the ratio reaches the threshold.',
      failWhen:
        'In that color scheme the ratio is below the threshold, which fails WCAG 1.4.3 (or 1.4.6).'
    },
    ELEMENT_OPACITY: {
      steps: [
        'Find the text the report names and note the opacity below 1 on its element.',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the text and background as they appear on screen (faded), with an eyedropper on the rendered page.",
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen:
        'The faded colours on screen reach the threshold, or the faded text is an inactive (disabled) control, which is exempt.',
      failWhen:
        'The faded colours on screen give a ratio below the threshold, which fails WCAG 1.4.3 (or 1.4.6), unless the text is part of an inactive control.'
    },
    ENGINE_EXCEPTION: {
      steps: [
        'Find the text the report names (the check stopped early, so nothing was measured).',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the text colour against the background directly behind the letters.",
        'Note the text size and weight to tell whether it counts as large (at least 24px, or 18.66px and bold).',
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen: 'The ratio reaches the threshold for its size.',
      failWhen: 'The ratio is below the threshold for its size, which fails WCAG 1.4.3 (or 1.4.6).'
    },
    FOREGROUND_UNPARSABLE: {
      steps: [
        'Find the text the report names and inspect its colour value in the developer tools (often a newer syntax such as oklch(), lab() or color()).',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the text colour as rendered against its background.",
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen: 'The ratio reaches the threshold.',
      failWhen: 'The ratio is below the threshold, which fails WCAG 1.4.3 (or 1.4.6).'
    },
    GENERATED_TEXT_POSITIONED: {
      steps: [
        'Find the element the report names and locate the text its ::before or ::after draws on screen (it is positioned away from its element).',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure that text's colour against whatever shows behind it at its actual position.",
        'Resize the window and scroll to check other positions where it may land on another background.',
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen: 'Wherever it lands, the generated text reaches the threshold.',
      failWhen:
        'Where the generated text lands, the ratio is below the threshold, which fails WCAG 1.4.3 (or 1.4.6).'
    },
    GENERATED_TEXT_UNREADABLE: {
      steps: [
        'Find the element the report names and look at the text its ::before, ::after or list marker draws (a number, bullet or label).',
        'Decide whether it is text people need to read (a number, word or label) or a purely decorative shape.',
        "If it is text, use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure its colour against the background behind it.",
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen: 'The generated text reaches the threshold, or it is purely decorative.',
      failWhen:
        'The generated text is readable content and its ratio is below the threshold, which fails WCAG 1.4.3 (or 1.4.6).'
    },
    MIX_BLEND_MODE: {
      steps: [
        'Find the text the report names and note the mix-blend-mode on it or its container.',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the blended text and background colours as they appear on screen, with an eyedropper on the rendered page.",
        'If different content can sit behind it (scrolling, sliders), check the worst case.',
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen: 'The blended colours on screen reach the threshold.',
      failWhen:
        'The blended colours on screen give a ratio below the threshold, which fails WCAG 1.4.3 (or 1.4.6).'
    },
    PSEUDO_ELEMENT_COLOR: {
      steps: [
        'Find the text the report names and note the ::first-line or ::first-letter colour in the Styles pane.',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure both the element's text colour and the first-line or first-letter colour against the background.",
        'Resize the window to see that the first-line colour applies to different words at different widths.',
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen: 'Both colours reach the threshold.',
      failWhen:
        'Either colour gives a ratio below the threshold, which fails WCAG 1.4.3 (or 1.4.6).'
    },
    SELECT_OPTION_COLOR: {
      steps: [
        'Find the drop-down the report names and open it with the mouse and with Alt+Down Arrow.',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure each option's text against its background in the open list, including the highlighted option, in each browser the page supports.",
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen: 'Every option in the open list reaches the threshold.',
      failWhen:
        'An option in the open list gives a ratio below the threshold, which fails WCAG 1.4.3 (or 1.4.6).'
    },
    TEXT_SHADOW: {
      steps: [
        'Find the text the report names and note its text-shadow.',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the text fill colour against the background.",
        'If the fill fails, zoom in and check whether the shadow forms a solid outline or halo around every letter; if so, measure the shadow colour against the background and the fill against the shadow.',
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen:
        'The fill reaches the threshold against the background, or a solid halo surrounds every letter and gives the threshold ratio.',
      failWhen:
        'Neither the fill against the background nor a solid halo around the letters reaches the threshold, which fails WCAG 1.4.3 (or 1.4.6).'
    },
    TEXT_STROKE: {
      steps: [
        'Find the text the report names and note its -webkit-text-stroke width and colour.',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the fill colour against the background, and the stroke colour against the background.",
        'Zoom in to see which colour forms most of each letter (a thin stroke counts less than the fill).',
        'Compare the ratio with 4.5:1 (3:1 for large text) for WCAG 1.4.3, and 7:1 (4.5:1 for large text) for 1.4.6.'
      ],
      passWhen:
        'The fill and stroke both reach the threshold, or the colour that clearly forms the letters does.',
      failWhen:
        'The colour that forms the letters gives a ratio below the threshold, which fails WCAG 1.4.3 (or 1.4.6).'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule, engineOptions } = ctx;

  const __contrastSharedCache =
    helpers && helpers.contrast && helpers.contrast.sharedCache
      ? helpers.contrast.sharedCache
      : null;

  const contrast =
    engineOptions && typeof engineOptions.contrast === 'object' && engineOptions.contrast
      ? engineOptions.contrast
      : {};

  const mode = contrast.mode === 'auditorAssist' ? 'auditorAssist' : 'strictConformance';

  const rootCanvasFallback =
    typeof contrast.rootCanvasFallback === 'string' && contrast.rootCanvasFallback.trim()
      ? contrast.rootCanvasFallback.trim()
      : '#ffffff';

  const MAX_OCCURRENCES = 50;

  const occurrences = [];
  let eligibleTextCount = 0;
  let cantTellCount = 0;
  let assumptionsCount = 0;
  const assumptionsAppliedSet = new Set();

  const seenFailEls = new Set();

  // Defined inside runInPage, which is serialized into the page and cannot
  // reach module scope. English fallbacks for the dictionary keys below.
  const CANT_TELL_HINT_KEYS = {
    background: 'contrastComputable_hint_cantTell_background',
    effect: 'contrastComputable_hint_cantTell_effect',
    rootNotOpaque: 'contrastComputable_hint_cantTell_rootNotOpaque',
    selectOption: 'contrastComputable_hint_cantTell_selectOption',
    generic: 'contrast_hint_cantTell_manual'
  };
  const CANT_TELL_HINTS = {
    background:
      'Measure the contrast by hand on the rendered page, where the background behind the text gives the least contrast. Normal text needs at least 4.5:1 and large text 3:1 (7:1 and 4.5:1 for AAA).',
    effect:
      'Measure the contrast by hand on the rendered page with the effect applied, since the declared CSS colors are not what ends up on screen. Normal text needs at least 4.5:1 and large text 3:1 (7:1 and 4.5:1 for AAA).',
    rootNotOpaque:
      'No element behind this text, up to the root, has a fully opaque background, so the color it sits on depends on where the page is displayed. Set an opaque background color on html or body, or measure the contrast against the background the page is actually shown on.',
    selectOption:
      "Open the list on each platform you support and measure the option's text there. Normal text needs at least 4.5:1 and large text 3:1 (7:1 and 4.5:1 for AAA). An option with the select's own colors is measured as the closed control draws it.",
    generic:
      "Measure this text's contrast by hand on the rendered page. Normal text needs at least 4.5:1 and large text 3:1 (7:1 and 4.5:1 for AAA)."
  };

  // Generated text already reported, per pseudo-element: an element's own
  // text and the text its ::before generates are reported apart.
  const seenGenerated = new Map();

  // extraDetails.generatedBy: the text is what el's ::before, ::after or
  // ::marker generates, and the summary says so.
  // lean: which way the evidence points, for the few blockers where the
  // colours that are known bound the answer (leanFor, below), or null.
  function pushCantTellOccurrence(el, reasonCode, extraDetails, lean) {
    try {
      const pseudo =
        extraDetails && typeof extraDetails === 'object' && extraDetails.generatedBy
          ? String(extraDetails.generatedBy)
          : '';
      if (pseudo && !seenGenerated.has(pseudo)) seenGenerated.set(pseudo, new Set());
      const seen = pseudo ? seenGenerated.get(pseudo) : seenFailEls;
      if (!el || seen.has(el)) return;
      if (occurrences.length >= MAX_OCCURRENCES) return;
      seen.add(el);

      const rc = String(reasonCode || 'UNKNOWN');

      // Match test contract: choose a specific summaryKey per computability blocker.
      // Fall back to the generic notComputable key.
      let summaryKey = 'contrastComputable_cantTell_notComputable';
      if (rc === 'BACKGROUND_IMAGE_OR_GRADIENT') {
        const t =
          extraDetails && typeof extraDetails === 'object'
            ? String(extraDetails.backgroundFillType || '')
            : '';

        if (t === 'image') summaryKey = 'contrastComputable_cantTell_bgImage';
        else if (t === 'gradient') summaryKey = 'contrastComputable_cantTell_bgGradient';
        else if (t === 'imageAndGradient')
          summaryKey = 'contrastComputable_cantTell_bgImageAndGradient';
        else summaryKey = 'contrastComputable_cantTell_bgImageOrGradient';
      } else if (rc === 'MIX_BLEND_MODE') summaryKey = 'contrastComputable_cantTell_mixBlendMode';
      else if (rc === 'BACKGROUND_FILTER_OR_BACKDROP_FILTER') {
        const bp =
          extraDetails && typeof extraDetails === 'object'
            ? String(extraDetails.blockerProperty || '')
            : '';
        if (bp === 'filter') summaryKey = 'contrastComputable_cantTell_filter';
        else if (bp === 'backdrop-filter')
          summaryKey = 'contrastComputable_cantTell_backdropFilter';
        else summaryKey = 'contrastComputable_cantTell_filterOrBackdropFilter';
      } else if (rc === 'BACKGROUND_NOT_OPAQUE_AT_ROOT')
        summaryKey = 'contrastComputable_cantTell_rootNotOpaque';
      else if (rc === 'TEXT_SHADOW') summaryKey = 'contrastComputable_cantTell_textShadow';
      else if (rc === 'TEXT_STROKE') summaryKey = 'contrastComputable_cantTell_textStroke';
      else if (rc === 'PSEUDO_ELEMENT_COLOR')
        summaryKey = 'contrastComputable_cantTell_pseudoElementColor';
      else if (rc === 'SELECT_OPTION_COLOR')
        summaryKey = 'contrastComputable_cantTell_selectOption';
      else if (rc === 'COLOR_SCHEME_NOT_RENDERED')
        summaryKey = 'contrastComputable_cantTell_colorScheme';
      if (pseudo) summaryKey = 'contrastComputable_cantTell_generatedText';

      // Every cantTell leaves a person to measure the contrast, so each one
      // says how, grouped by what blocked the calculation.
      let hintKind = 'generic';
      if (
        rc === 'BACKGROUND_IMAGE_OR_GRADIENT' ||
        rc === 'BACKGROUND_OVERLAP' ||
        rc === 'BACKGROUND_UNPARSABLE' ||
        rc === 'GENERATED_TEXT_POSITIONED'
      )
        hintKind = 'background';
      else if (
        rc === 'MIX_BLEND_MODE' ||
        rc === 'BACKGROUND_FILTER_OR_BACKDROP_FILTER' ||
        rc === 'TEXT_SHADOW' ||
        rc === 'TEXT_STROKE' ||
        rc === 'PSEUDO_ELEMENT_COLOR'
      )
        hintKind = 'effect';
      else if (rc === 'BACKGROUND_NOT_OPAQUE_AT_ROOT') hintKind = 'rootNotOpaque';
      else if (rc === 'SELECT_OPTION_COLOR') hintKind = 'selectOption';

      const details = Object.assign(
        { reasonCode: rc },
        extraDetails && typeof extraDetails === 'object' ? extraDetails : {}
      );

      const occBase = {
        selector: '',
        html: '',
        summary: '',
        hint: CANT_TELL_HINTS[hintKind],
        i18n: {
          summaryKey,
          hintKey: CANT_TELL_HINT_KEYS[hintKind],
          params: Object.assign(
            { reasonCode: rc },
            pseudo ? { pseudo } : {},
            details && typeof details === 'object'
              ? {
                  blockerProperty: details.blockerProperty ? String(details.blockerProperty) : '',
                  blockerValue: details.blockerValue ? String(details.blockerValue) : '',
                  backgroundAlpha:
                    details.backgroundAlpha !== undefined && details.backgroundAlpha !== null
                      ? String(details.backgroundAlpha)
                      : ''
                }
              : {}
          )
        },
        uncertainty: {
          code: 'not-computable',
          needed: 'A contrast ratio for this text, which this page composition blocks.',
          evidence: {
            reasonCode: rc,
            blockerProperty: details.blockerProperty || null,
            blockerValue: details.blockerValue || null,
            backgroundAlpha: details.backgroundAlpha === undefined ? null : details.backgroundAlpha
          }
        },
        data: { details },
        ...(lean ? { lean } : {})
      };

      if (helpers && typeof helpers.reportOccurrence === 'function') {
        occurrences.push(helpers.reportOccurrence(el, occBase));
      } else {
        // Never compute selector/snippet in the rule.
        occurrences.push({ ...occBase });
      }
    } catch {
      // no-throw
    }
  }

  // ---- Leans (docs/LEANS.md) ----
  //
  // This rule answers for 1.4.3 and 1.4.6 at once, so a lean has to hold
  // for both: it leans fail only where the ratio known is below the
  // minimum (AA) ratio, which fails the enhanced one too, and pass only
  // where it reaches the enhanced (AAA) ratio, which meets both. Between
  // the two there is no lean.
  const C = helpers && helpers.contrast ? helpers.contrast : null;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function computedStyleOf(el) {
    try {
      if (!el || dom.nodeType(el) !== 1) return null;
      if (typeof helpers.computedStyle === 'function') {
        const cs = helpers.computedStyle(el);
        if (cs) return cs;
      }
      const doc = dom.ownerDocument(el);
      const view = doc ? dom.defaultView(doc) : null;
      return view && typeof view.getComputedStyle === 'function' ? view.getComputedStyle(el) : null;
    } catch {
      return null;
    }
  }

  function styleOf(el) {
    try {
      return C && typeof C.textStyleOf === 'function' ? C.textStyleOf(el) : computedStyleOf(el);
    } catch {
      return null;
    }
  }

  // Whether el's text, at the size it is drawn, is large text.
  function largeTextOf(el, cs) {
    try {
      const px = C.parsePx(cs && cs.fontSize);
      if (!Number.isFinite(px)) return null;
      const scale = typeof C.renderedTextScale === 'function' ? C.renderedTextScale(el, cs) : 1;
      return C.isLargeText(px * scale, C.normalizeFontWeight(cs && cs.fontWeight));
    } catch {
      return null;
    }
  }

  // 'fail' below the AA ratio, 'pass' at the AAA ratio or above, else ''.
  function towardFor(ratio, large) {
    if (!Number.isFinite(ratio) || typeof large !== 'boolean') return '';
    if (ratio < C.requiredRatio('AA', large)) return 'fail';
    if (ratio >= C.requiredRatio('AAA', large)) return 'pass';
    return '';
  }

  // The colour el's text is painted in, as declared, when it is opaque:
  // its -webkit-text-fill-color, or its color. Null for SVG text (painted
  // with fill), a placeholder, or a colour that is not opaque.
  function opaqueTextColor(el) {
    try {
      if (dom.namespaceURI(el) === SVG_NS) return null;
      if (typeof C.isPlaceholderText === 'function' && C.isPlaceholderText(el)) return null;
      const cs = computedStyleOf(el);
      // In the color scheme the page is drawn in (helpers.contrast.textFillColor).
      const fill =
        (typeof C.textFillColor === 'function' && C.parseCssColorToRgba(C.textFillColor(el))) ||
        (cs && C.parseCssColorToRgba(cs.webkitTextFillColor || '')) ||
        (cs && C.parseCssColorToRgba(cs.color));
      return fill && fill.a === 1 ? { r: fill.r, g: fill.g, b: fill.b, a: 1 } : null;
    } catch {
      return null;
    }
  }

  function parentOf(node) {
    const up = dom.parentElement(node);
    if (up) return up;
    try {
      const root = dom.get(node, 'getRootNode') ? dom.getRootNode(node) : null;
      return root && root !== node && dom.get(root, 'host') ? dom.get(root, 'host') : null;
    } catch {
      return null;
    }
  }

  // The background el's text sits on before any opacity fades it: the
  // first opaque background-color from el up, with nothing translucent and
  // no background image on the way. Null where that isn't one colour.
  function unfadedBackground(el) {
    try {
      for (let cur = el, depth = 0; cur && depth < 200; cur = parentOf(cur), depth += 1) {
        if (dom.nodeType(cur) !== 1) continue;
        const cs = computedStyleOf(cur);
        if (!cs) return null;
        if (C.paintsBackgroundLayer(cs)) return null;
        const value = String(cs.backgroundColor || '').trim();
        const bg = value ? C.parseCssColorToRgba(value) : { r: 0, g: 0, b: 0, a: 0 };
        if (!bg) return null;
        if (bg.a === 1) return { r: bg.r, g: bg.g, b: bg.b, a: 1 };
        if (bg.a > 0) return null;
      }
    } catch {}
    return null;
  }

  function ratioParam(ratio) {
    return String(C.round2(ratio));
  }

  // The lean for el's cantTell, by its blocker, or null.
  function leanFor(el, reasonCode) {
    try {
      if (!C || !el || dom.nodeType(el) !== 1) return null;
      const cs = styleOf(el);
      // Opacity fades the text and its background together toward what
      // lies behind them, which brings two colours closer, never further
      // apart: below the AA ratio before the fading, the text is below it
      // after. Above it, how far the fading lowers the ratio depends on
      // what is behind, so there is no lean.
      if (reasonCode === 'ELEMENT_OPACITY' || reasonCode === 'ANCESTOR_OPACITY') {
        const fg = opaqueTextColor(el);
        const back = fg ? unfadedBackground(el) : null;
        const large = largeTextOf(el, cs);
        if (!back || typeof large !== 'boolean') return null;
        const ratio = C.contrastRatio(fg, back);
        if (towardFor(ratio, large) !== 'fail') return null;
        return {
          toward: 'fail',
          why: `Before any fading, the text reaches only ${ratioParam(ratio)}:1 against its background, below the minimum ratio for its size, and fading text and background together can only bring them closer.`,
          signals: [
            { signal: 'unfaded-ratio', value: Number(C.round2(ratio)) },
            { signal: 'large-text', value: large }
          ],
          caution:
            'Browsers blend the faded colors in a way that can shift the ratio slightly, and a filter or blend mode further out is not accounted for.',
          i18n: {
            whyKey: 'contrastComputable_lean_why_opacity',
            cautionKey: 'contrastComputable_lean_caution_opacity',
            params: { ratio: ratioParam(ratio) }
          }
        };
      }
      // An option shown only in the list the select opens: where the
      // platform draws that list in the option's colours, they are what is
      // on screen.
      if (reasonCode === 'SELECT_OPTION_COLOR') {
        const fg = opaqueTextColor(el);
        if (!fg) return null;
        const select = dom.closest(el, 'select');
        if (!select) return null;
        let back = null;
        for (let cur = el, depth = 0; cur && depth < 100; cur = dom.parentElement(cur), depth++) {
          const ccs = computedStyleOf(cur);
          if (!ccs) return null;
          if (C.paintsBackgroundLayer(ccs)) return null;
          const opacity = Number.parseFloat(ccs.opacity);
          if (Number.isFinite(opacity) && opacity < 1) return null;
          const value = String(ccs.backgroundColor || '').trim();
          const c = value ? C.parseCssColorToRgba(value) : { r: 0, g: 0, b: 0, a: 0 };
          if (!c) return null;
          if (c.a === 1) {
            back = { r: c.r, g: c.g, b: c.b, a: 1 };
            break;
          }
          if (c.a > 0) return null;
          if (cur === select) break;
        }
        if (!back) return null;
        // Large only if it is so at both the option's size and the
        // select's, since the list may be drawn in either.
        const ownLarge = largeTextOf(el, cs);
        const selectLarge = largeTextOf(select, computedStyleOf(select));
        if (typeof ownLarge !== 'boolean' || typeof selectLarge !== 'boolean') return null;
        const large = ownLarge && selectLarge;
        const ratio = C.contrastRatio(fg, back);
        const toward = towardFor(ratio, large);
        if (!toward) return null;
        return {
          toward,
          why:
            toward === 'pass'
              ? `In the option's own colors, its text reaches ${ratioParam(ratio)}:1 against its background in the open list, which meets the enhanced ratio for its size and so the minimum one too.`
              : `In the option's own colors, its text reaches only ${ratioParam(ratio)}:1 against its background in the open list, below the minimum ratio for its size.`,
          signals: [
            { signal: 'option-ratio', value: Number(C.round2(ratio)) },
            { signal: 'large-text', value: large }
          ],
          ...(toward === 'fail'
            ? {
                caution:
                  'Some platforms, macOS among them, draw the open list in their own colors and ignore the option’s.'
              }
            : {}),
          i18n: {
            whyKey:
              toward === 'pass'
                ? 'contrastComputable_lean_why_selectOption_pass'
                : 'contrastComputable_lean_why_selectOption_fail',
            ...(toward === 'fail'
              ? { cautionKey: 'contrastComputable_lean_caution_selectOption' }
              : {}),
            params: { ratio: ratioParam(ratio) }
          }
        };
      }
    } catch {}
    return null;
  }

  // Text part of which a ::first-line or ::first-letter paints in a colour
  // of its own (PSEUDO_ELEMENT_COLOR) is decided by contrast-minimum and
  // contrast-enhanced where its own colours and the pseudo-element's agree,
  // at the AA ratio and at the AAA ratio, both reaching it or both falling
  // short (helpers.contrast.measurePseudoElementText). It is asked about
  // here only where they disagree at one of them.
  function pseudoColorsAgree(el, blocker) {
    try {
      if (!blocker || blocker.reasonCode !== 'PSEUDO_ELEMENT_COLOR' || !blocker.pseudoColors)
        return false;
      if (!C || typeof C.measurePseudoElementText !== 'function') return false;
      const m = C.measurePseudoElementText(el, {
        contrast: { mode, rootCanvasFallback },
        collectStack: false
      });
      if (!m) return false;
      return ['AA', 'AAA'].every(
        (level) =>
          m.own.ratio >= C.requiredRatio(level, m.own.isLargeText) ===
          m.pseudo.ratio >= C.requiredRatio(level, m.pseudo.isLargeText)
      );
    } catch {
      return false;
    }
  }

  // perf: cache per-element analysis so multiple text nodes in same element don't repeat expensive work
  const __elBlockerCache = __contrastSharedCache
    ? __contrastSharedCache.__elBlockerCache ||
      (__contrastSharedCache.__elBlockerCache = new WeakMap())
    : new WeakMap(); // Element -> { ok:boolean, reasonCode, blockerSelector, blockerProperty, blockerValue }
  const __elBgCache = __contrastSharedCache
    ? __contrastSharedCache.__elBgCache || (__contrastSharedCache.__elBgCache = new WeakMap())
    : new WeakMap(); // Element -> { ok, rgba, alpha, reasonCode } (no stack)
  const __elFgCache = __contrastSharedCache
    ? __contrastSharedCache.__elFgCache || (__contrastSharedCache.__elFgCache = new WeakMap())
    : new WeakMap(); // Element -> { rgba, alpha, opacityProduct }

  // perf: fast-path memo for self-opaque background (common) to avoid ancestor walk
  const __elBgSelfOpaqueCache = __contrastSharedCache
    ? __contrastSharedCache.__elBgSelfOpaqueCache ||
      (__contrastSharedCache.__elBgSelfOpaqueCache = new WeakMap())
    : new WeakMap(); // Element -> { ok, rgba, alpha, reasonCode }

  // Shared deterministic text scan (computed once per run and reused across contrast checks)
  let scan;
  try {
    scan =
      helpers && helpers.contrast && typeof helpers.contrast.getTextScan === 'function'
        ? helpers.contrast.getTextScan(ctx, helpers, engineOptions)
        : null;
  } catch {
    scan = null;
  }

  // Walk eligible visible text nodes (counted per text node), but compute blockers/bg/fg once per element.
  if (scan && scan.elements && Array.isArray(scan.elements)) {
    try {
      eligibleTextCount = Number(scan.eligibleTextCount) || 0;

      for (const rec of scan.elements) {
        // If we're already capped on occurrences and already know the final outcome is cantTell,
        // stop scanning to avoid wasting time. Deterministic: we don't randomize; we just stop
        // once further work cannot change the output (cantTell + capped occurrences).
        if (cantTellCount > 0 && occurrences.length >= MAX_OCCURRENCES) break;

        const el = rec && rec.el;
        const textCount = rec && Number(rec.textCount) ? Number(rec.textCount) : 0;
        if (!el || textCount <= 0) continue;

        // 1) Blockers in ancestor chain (blend/filter/bg-image/gradient)
        let blocker = __elBlockerCache.get(el);
        if (!blocker) {
          blocker = helpers.contrast.getComputabilityBlocker(el);
          // Normalize to stable shape
          blocker = blocker || {
            ok: true,
            reasonCode: null,
            blockerSelector: '',
            blockerProperty: '',
            blockerValue: ''
          };
          __elBlockerCache.set(el, blocker);
        }
        // Text drawn by an outline or a shadow below even the AA ratio
        // is failed by contrast-minimum and contrast-enhanced, so it isn't
        // asked about here too (helpers.contrast.measureOutlineOnlyText).
        if (
          blocker &&
          blocker.ok === false &&
          (blocker.reasonCode === 'TEXT_STROKE' || blocker.reasonCode === 'TEXT_SHADOW') &&
          typeof helpers.contrast.measureOutlineOnlyText === 'function'
        ) {
          const m = helpers.contrast.measureOutlineOnlyText(el, {
            contrast: { mode, rootCanvasFallback },
            collectStack: false
          });
          if (m && m.ratio < helpers.contrast.requiredRatio('AA', m.isLargeText)) continue;
        }
        if (blocker && blocker.ok === false && pseudoColorsAgree(el, blocker)) continue;
        if (blocker && blocker.ok === false) {
          cantTellCount += textCount;
          // occurrence is deduped per element (seenFailEls)
          pushCantTellOccurrence(
            el,
            blocker.reasonCode,
            {
              blockerProperty: blocker.blockerProperty,
              blockerValue: blocker.blockerValue,
              blockerSelector: blocker.blockerSelector,
              backgroundFillType: blocker.backgroundFillType
            },
            leanFor(el, blocker.reasonCode)
          );
          continue;
        }

        // 2) Background resolution (CSS-only), strict vs. reference-engine-compatible mode
        let bg = __elBgCache.get(el);
        if (!bg) {
          // 2a) Fast-path: if the element itself paints an opaque background-color and opacity is 1,
          // then the background behind its text is computable without walking ancestors.
          // This is a strict subset of the full algorithm, so it is behavior-preserving:
          // if it doesn't match, we fall back to computeEffectiveBackground.
          let bgSelfOpaque = __elBgSelfOpaqueCache.get(el);
          if (bgSelfOpaque === undefined) {
            bgSelfOpaque = null;
            try {
              if (
                helpers &&
                typeof helpers.getComputedStyle === 'function' &&
                helpers.contrast &&
                typeof helpers.contrast.parseCssColorToRgba === 'function'
              ) {
                const cs = helpers.getComputedStyle(el);
                const op = Number.parseFloat(
                  cs && cs.opacity != null && cs.opacity !== '' ? cs.opacity : '1'
                );
                // Only treat as self-opaque if opacity is exactly 1 (string '1' or number 1)
                // to avoid float/serialization quirks and preserve determinism.
                if (Number.isFinite(op) && op === 1) {
                  const c = helpers.contrast.parseCssColorToRgba(cs && cs.backgroundColor);
                  if (c && typeof c.a === 'number' && c.a === 1) {
                    bgSelfOpaque = {
                      ok: true,
                      rgba: { r: c.r, g: c.g, b: c.b, a: 1 },
                      alpha: 1,
                      reasonCode: null
                    };
                  }
                }
              }
            } catch {
              bgSelfOpaque = null;
            }
            __elBgSelfOpaqueCache.set(el, bgSelfOpaque);
          }

          if (bgSelfOpaque && bgSelfOpaque.ok === true) {
            bg = bgSelfOpaque;
          } else {
            bg = helpers.contrast.computeEffectiveBackground(el, {
              contrast: { mode, rootCanvasFallback },
              collectStack: false
            });
            bg = bg || { ok: false, reasonCode: 'BACKGROUND_NOT_COMPUTABLE', rgba: null, alpha: 0 };
          }

          __elBgCache.set(el, bg);
        }
        if (!bg || bg.ok === false) {
          cantTellCount += textCount;
          const bgCode = (bg && bg.reasonCode) || 'BACKGROUND_NOT_COMPUTABLE';
          pushCantTellOccurrence(
            el,
            bgCode,
            {
              background: bg && bg.rgba ? helpers.contrast.rgbaToString(bg.rgba) : '',
              backgroundAlpha:
                bg && typeof bg.alpha === 'number' ? helpers.contrast.round2(bg.alpha) : '',
              // A background color the engine can't read names the element
              // and the value, as the other blockers do.
              ...(bg && bg.blockerProperty
                ? {
                    blockerSelector: bg.blockerSelector || '',
                    blockerProperty: bg.blockerProperty,
                    blockerValue: bg.blockerValue || ''
                  }
                : {})
            },
            leanFor(el, bgCode)
          );
          continue;
        }

        // Track any explicit assumptions applied by background resolution.
        try {
          if (bg && Array.isArray(bg.assumptionsApplied) && bg.assumptionsApplied.length) {
            assumptionsCount += textCount;
            for (const a of bg.assumptionsApplied) assumptionsAppliedSet.add(String(a));
          }
        } catch {
          /* no-throw */
        }

        // 3) Foreground parsability (computed color should be rgb/rgba)
        let fg = __elFgCache.get(el);
        if (!fg) {
          fg = helpers.contrast.computeEffectiveForeground(el);
          fg = fg || { rgba: null, alpha: 0, opacityProduct: 1 };
          __elFgCache.set(el, fg);
        }
        if (!fg || !fg.rgba) {
          cantTellCount += textCount;
          pushCantTellOccurrence(el, 'FOREGROUND_UNPARSABLE', {
            background: bg && bg.rgba ? helpers.contrast.rgbaToString(bg.rgba) : '',
            backgroundAlpha:
              bg && typeof bg.alpha === 'number' ? helpers.contrast.round2(bg.alpha) : ''
          });
          continue;
        }

        // If we got here, this element's eligible text is computable.
        // (We intentionally do not compute contrast ratio in this gatekeeper rule.)
      }

      // Text a ::before, ::after or ::marker generates (#219), one record
      // per pseudo-element: what stops it being measured
      // (helpers.contrast.measureGeneratedText) is asked about on its
      // element, the summary naming the pseudo-element.
      const generated = Array.isArray(scan.generated) ? scan.generated : [];
      for (const rec of generated) {
        const el = rec && rec.el;
        const pseudo = rec && rec.pseudo ? String(rec.pseudo) : '';
        const textCount = rec && Number(rec.textCount) ? Number(rec.textCount) : 0;
        if (!el || !pseudo || textCount <= 0) continue;
        eligibleTextCount += textCount;
        const m =
          typeof helpers.contrast.measureGeneratedText === 'function'
            ? helpers.contrast.measureGeneratedText(el, pseudo, {
                contrast: { mode, rootCanvasFallback },
                collectStack: false
              })
            : null;
        if (m && m.ok === true) {
          if (Array.isArray(m.assumptionsApplied) && m.assumptionsApplied.length) {
            assumptionsCount += textCount;
            for (const a of m.assumptionsApplied) assumptionsAppliedSet.add(String(a));
          }
          continue;
        }
        cantTellCount += textCount;
        pushCantTellOccurrence(el, (m && m.reasonCode) || 'GENERATED_TEXT_UNREADABLE', {
          generatedBy: pseudo,
          blockerSelector: (m && m.blockerSelector) || '',
          blockerProperty: (m && m.blockerProperty) || '',
          blockerValue: (m && m.blockerValue) || '',
          ...(m && m.backgroundFillType ? { backgroundFillType: m.backgroundFillType } : {}),
          ...(m && m.background !== undefined
            ? { background: m.background, backgroundAlpha: m.backgroundAlpha }
            : {})
        });
      }
    } catch {
      // If scan processing fails unexpectedly, keep determinism: treat as cantTell with one occurrence
      return {
        ruleId: rule.ruleId,
        outcome: 'cantTell',
        severity: rule.defaultSeverity || 'serious',
        confidence: rule.defaultConfidence || 'high',
        occurrences: [
          {
            selector: '',
            summary: '',
            hint: CANT_TELL_HINTS.generic,
            html: '',
            i18n: {
              summaryKey: 'contrastComputable_cantTell_engineFailure',
              hintKey: CANT_TELL_HINT_KEYS.generic,
              params: { reasonCode: 'ENGINE_EXCEPTION' }
            },
            data: { details: { reasonCode: 'ENGINE_EXCEPTION' } }
          }
        ]
      };
    }
  }

  if (eligibleTextCount === 0) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: rule.defaultSeverity || 'serious',
      confidence: rule.defaultConfidence || 'high',
      occurrences: []
    };
  }

  // Where the colors measured were forced, each occurrence says so
  // (contrast-helpers).
  helpers.contrast.noteForcedColors(occurrences);

  if (cantTellCount > 0) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'serious',
      confidence: rule.defaultConfidence || 'high',
      occurrences
    };
  }

  // All eligible text is computable
  return {
    ruleId: rule.ruleId,
    outcome: 'pass',
    severity: rule.defaultSeverity || 'serious',
    confidence: rule.defaultConfidence || 'high',
    occurrences: helpers.contrast.noteForcedColors([
      {
        selector: '',
        summary: '',
        hint: '',
        html: '',
        i18n: {
          summaryKey: 'contrastComputable_pass_allComputable',
          hintKey: '',
          params: {
            eligibleTextCount: String(eligibleTextCount)
          }
        },
        data: {
          details: {
            eligibleTextCount,
            assumptionsCount,
            assumptionsApplied: Array.from(assumptionsAppliedSet).sort()
          }
        }
      }
    ])
  };
}

module.exports = { id, meta, runInPage };
