# Rule catalog

Generated from the compiled engine's own catalog (`getChecksCatalog()`/`getRulesCatalog()`) and each rule's source header. Run `node scripts/generate-rule-catalog.js` after `npm run build` to regenerate this file whenever rules change. Do not hand-edit.

**144 rules total: 85 automatic (decide deterministically; can return `fail` when they check a WCAG requirement, or a best practice whose failure is itself a barrier), 59 manual (a person judges what they find; never `fail`, and `pass` only when nothing needs judging). 115 carry at least one formal WCAG Success Criterion mapping.**

The tables below are an index; [rule reference](#rule-reference) carries each rule's description, what it applies to and what it expects.

A rule with a **Margin** line measures a value against a threshold, and its check result's `margin` says how close the closest element came while still meeting it (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#a-check-result-checksresultsi)). Unlike the fields below, it is a stable contract.

Under **What a finding reports**, a rule lists the fields its findings carry in `data.details` besides `reasonCode`, and what each one means. They help to read and reproduce a finding, but apart from `reasonCode` (and the few fields [`API_STABILITY.md`](./API_STABILITY.md) names, such as the contrast size fields) they are not a stable contract (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#an-occurrence-occurrencesi)): a field may be renamed or dropped in a minor release, so do not build on them.

See [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md) for what `type`/`confidence`/`severity` mean on a scan result, and [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md) for how these roll up to an SC-level conformance claim. For WCAG-facet-level coverage-gap tracking (which parts of an SC are and aren't automatable yet), see `coverage/coverage-report.md` instead: that one is organized by facet, this one by rule.

## Automatic rules (85), can return `fail`

| Rule ID | Title | WCAG SC | Level | Confidence | Default severity |
|---|---|---|---|---|---|
| [`area-alt-present`](#area-alt-present) | &lt;area&gt; must have an accessible name | 1.1.1 | A | high | serious |
| [`aria-allowed-attr`](#aria-allowed-attr) | aria-* attributes must be permitted for the element’s role | 4.1.2 | A | medium | moderate |
| [`aria-allowed-role`](#aria-allowed-role) | Explicit role must be permitted for its host element | — | — | high | moderate |
| [`aria-braille-equivalent`](#aria-braille-equivalent) | aria-braillelabel/aria-brailleroledescription must have a non-braille equivalent | 4.1.2 | A | high | moderate |
| [`aria-conditional-attr`](#aria-conditional-attr) | aria-errormessage requires aria-invalid to be set to a non-false value | 4.1.2 | A | high | moderate |
| [`aria-deprecated-role`](#aria-deprecated-role) | role attribute should not use a deprecated or author-discouraged ARIA role | 4.1.2 | A | high | moderate |
| [`aria-hidden-body`](#aria-hidden-body) | The document &lt;body&gt; must not be aria-hidden | 1.3.1, 4.1.2 | A | high | critical |
| [`aria-hidden-focus`](#aria-hidden-focus) | ARIA hidden elements must not be focusable | 4.1.2 | A | high | serious |
| [`aria-owns-valid`](#aria-owns-valid) | aria-owns must give each element one owner, and never an ancestor of the owner | 1.3.1, 4.1.2 | A | high | serious |
| [`aria-prohibited-attr`](#aria-prohibited-attr) | ARIA naming attributes must not be used on roles that prohibit them | 4.1.2 | A | high | moderate |
| [`aria-prohibited-children`](#aria-prohibited-children) | Container roles must not own a child with a disallowed role | 1.3.1 | A | medium | moderate |
| [`aria-required-attr`](#aria-required-attr) | Roles with a required ARIA state/property must carry it | 4.1.2 | A | high | serious |
| [`aria-required-children`](#aria-required-children) | Container roles must own at least one required child role | 1.3.1 | A | medium | moderate |
| [`aria-required-parent`](#aria-required-parent) | Roles requiring a specific context role must be in that context | 1.3.1 | A | medium | moderate |
| [`aria-role-name-present`](#aria-role-name-present) | ARIA roles that require an accessible name have one | 4.1.2 | A | high | serious |
| [`aria-roles-valid`](#aria-roles-valid) | role attribute must be a valid, non-abstract ARIA role | 1.3.1, 4.1.2 | A | high | serious |
| [`aria-valid-attr`](#aria-valid-attr) | aria-* attributes must be real, defined ARIA attributes | 4.1.2 | A | high | serious |
| [`aria-valid-attr-value`](#aria-valid-attr-value) | aria-* attribute values must match their declared type | 4.1.2 | A | high | serious |
| [`autocomplete-valid`](#autocomplete-valid) | autocomplete attribute must be a valid autofill value | 1.3.5 | AA | high | moderate |
| [`avoid-inline-spacing`](#avoid-inline-spacing) | Inline style must not force text spacing below the WCAG metric | 1.4.12 | AA | high | moderate |
| [`binary-control-name-present`](#binary-control-name-present) | Binary controls have an accessible name | 4.1.2 | A | high | serious |
| [`button-name-present`](#button-name-present) | Buttons have an accessible name | 4.1.2 | A | high | serious |
| [`canvas-text-alternative-present`](#canvas-text-alternative-present) | &lt;canvas&gt; must provide a text alternative | 1.1.1 | A | high | serious |
| [`click-handler-keyboard-operable`](#click-handler-keyboard-operable) | Click handlers on elements that are not native controls must work by keyboard | 2.1.1, 2.1.3 | A, AAA | medium | serious |
| [`combobox-name-present`](#combobox-name-present) | Comboboxes have an accessible name | 4.1.2 | A | high | serious |
| [`contrast-computable`](#contrast-computable) | Color contrast is computable for rendered text | 1.4.3, 1.4.6 | AA, AAA | high | serious |
| [`contrast-enhanced`](#contrast-enhanced) | Text meets enhanced color contrast (AAA) | 1.4.6 | AAA | high | serious |
| [`contrast-minimum`](#contrast-minimum) | Text meets minimum color contrast (AA) | 1.4.3 | AA | high | serious |
| [`css-orientation-lock`](#css-orientation-lock) | CSS must not lock the page to a single orientation | 1.3.4 | AA | high | serious |
| [`definition-list-children-valid`](#definition-list-children-valid) | Description lists must be structured correctly | 1.3.1 | A | high | serious |
| [`deprecated-elements-not-used`](#deprecated-elements-not-used) | Scrolling &lt;marquee&gt; content must be possible to pause, stop, or hide | 2.2.2 | A | high | serious |
| [`dialog-name-present`](#dialog-name-present) | Dialogs have an accessible name | 4.1.2 | A | high | serious |
| [`dlitem-parent-valid`](#dlitem-parent-valid) | Description-list items must be inside a description list | 1.3.1 | A | high | serious |
| [`duplicate-id`](#duplicate-id) | IDs must be unique | 4.1.1 | A | high | moderate |
| [`duplicate-id-aria`](#duplicate-id-aria) | IDs referenced by ARIA must be unique | 4.1.2 | A | high | serious |
| [`embed-text-alternative-present`](#embed-text-alternative-present) | &lt;embed&gt; must provide a text alternative | 1.1.1 | A | high | serious |
| [`empty-heading`](#empty-heading) | Headings must not be empty | — | — | high | minor |
| [`form-control-programmatic-label-present`](#form-control-programmatic-label-present) | Form controls must have a programmatic label | 1.3.1, 3.3.2, 4.1.2 | A | medium | serious |
| [`form-control-single-label`](#form-control-single-label) | Form controls must not have multiple labels | 3.3.2 | A | high | moderate |
| [`html-lang-attr-present`](#html-lang-attr-present) | Page language is declared | 3.1.1 | A | high | serious |
| [`html-xml-lang-mismatch`](#html-xml-lang-mismatch) | lang and xml:lang must not disagree | 3.1.1 | A | high | serious |
| [`identical-iframes-same-purpose`](#identical-iframes-same-purpose) | Frames with the same name embed the same resource | 4.1.2 | A | medium | moderate |
| [`iframe-focusable-content`](#iframe-focusable-content) | Frames with tabindex="-1" must not contain focusable content | 2.1.1 | A | high | moderate |
| [`iframe-name-present`](#iframe-name-present) | Frames have an accessible name | 4.1.2 | A | high | serious |
| [`iframe-title-unique`](#iframe-title-unique) | Frame title uniqueness (deprecated) | 4.1.2 | A | high | moderate |
| [`img-alt-present`](#img-alt-present) | &lt;img&gt; must have an alt attribute | 1.1.1 | A | high | serious |
| [`input-image-alt-present`](#input-image-alt-present) | &lt;input type="image"&gt; must have an alt attribute | 1.1.1, 4.1.2 | A | high | serious |
| [`invalid-field-error-message`](#invalid-field-error-message) | Fields marked invalid must have a shown error message | 3.3.1 | A | high | serious |
| [`label-in-name`](#label-in-name) | Label in Name: accessible name contains visible text | 2.5.3 | A | high | serious |
| [`landmark-role-name-present`](#landmark-role-name-present) | Region and form roles must have an accessible name | — | — | high | minor |
| [`link-in-text-block`](#link-in-text-block) | Links in text blocks must be distinguishable from surrounding text without relying on color alone | 1.4.1 | A | high | serious |
| [`link-name-present`](#link-name-present) | Links have an accessible name | 2.4.4, 2.4.9, 4.1.2 | A, AAA, A | high | serious |
| [`list-children-valid`](#list-children-valid) | Lists must only directly contain list items | 1.3.1 | A | high | serious |
| [`listbox-name-present`](#listbox-name-present) | Listboxes have an accessible name | 4.1.2 | A | high | serious |
| [`listitem-parent-valid`](#listitem-parent-valid) | List items must be inside a list container | 1.3.1 | A | high | serious |
| [`menuitem-name-present`](#menuitem-name-present) | Menu items have an accessible name | 4.1.2 | A | high | serious |
| [`meta-refresh-no-exceptions`](#meta-refresh-no-exceptions) | Page must not use a timed meta refresh (AAA) | 2.2.4, 3.2.5 | AAA | high | moderate |
| [`meta-refresh-timing-absent`](#meta-refresh-timing-absent) | Page must not use a timed meta refresh | 2.2.1, 2.2.4, 3.2.5 | A, AAA, AAA | high | serious |
| [`meta-viewport-zoom-enabled`](#meta-viewport-zoom-enabled) | Viewport meta tag must not disable zoom | 1.4.4 | AA | high | serious |
| [`meter-name-present`](#meter-name-present) | Meters have an accessible name | 1.1.1 | A | high | serious |
| [`nested-interactive-controls-absent`](#nested-interactive-controls-absent) | Interactive controls must not be nested | 4.1.2 | A | high | serious |
| [`object-text-alternative-present`](#object-text-alternative-present) | &lt;object&gt; must provide a text alternative | 1.1.1 | A | high | serious |
| [`option-name-present`](#option-name-present) | Options have an accessible name | 4.1.2 | A | high | serious |
| [`page-title-present`](#page-title-present) | Page has a non-empty title | 2.4.2 | A | high | serious |
| [`presentational-children-focusable-absent`](#presentational-children-focusable-absent) | Roles with presentational children must not contain focusable content | 4.1.2 | A | high | serious |
| [`progressbar-name-present`](#progressbar-name-present) | Progress bars have an accessible name | 1.1.1 | A | high | serious |
| [`role-img-text-alternative-present`](#role-img-text-alternative-present) | [role="img"/"graphics-symbol"/"graphics-document"] must have an accessible text alternative | 1.1.1 | A | high | serious |
| [`searchbox-name-present`](#searchbox-name-present) | Searchboxes have an accessible name | 4.1.2 | A | high | serious |
| [`server-side-image-map-absent`](#server-side-image-map-absent) | Server-side image maps must have a keyboard-operable alternative | 2.1.1 | A | high | serious |
| [`slider-name-present`](#slider-name-present) | Sliders have an accessible name | 4.1.2 | A | high | serious |
| [`spinbutton-name-present`](#spinbutton-name-present) | Spinbuttons have an accessible name | 4.1.2 | A | high | serious |
| [`summary-name-present`](#summary-name-present) | Summary elements have an accessible name | 4.1.2 | A | high | serious |
| [`svg-image-text-alternative-present`](#svg-image-text-alternative-present) | SVG &lt;image&gt; must have a text alternative | 1.1.1 | A | medium | serious |
| [`svg-text-alternative-present`](#svg-text-alternative-present) | &lt;svg&gt; must provide a text alternative | 1.1.1 | A | high | serious |
| [`tab-name-present`](#tab-name-present) | Tabs have an accessible name | 4.1.2 | A | high | serious |
| [`table-headers-attr-valid`](#table-headers-attr-valid) | Table cell "headers" attribute must reference valid header cells | 1.3.1 | A | high | serious |
| [`table-th-has-data-cells`](#table-th-has-data-cells) | &lt;th&gt; elements must describe at least one data cell | 1.3.1 | A | high | moderate |
| [`target-size-minimum`](#target-size-minimum) | Pointer targets must be at least 24x24px large, or leave sufficient distance to other targets | 2.5.8 | AA | medium | serious |
| [`td-has-header`](#td-has-header) | Data cells in large tables must have an associated header | 1.3.1 | A | high | serious |
| [`text-spacing-content-loss`](#text-spacing-content-loss) | Text stays readable when the user increases text spacing | 1.4.12 | AA | medium | serious |
| [`textbox-name-present`](#textbox-name-present) | Textboxes have an accessible name | 4.1.2 | A | high | serious |
| [`tooltip-name-present`](#tooltip-name-present) | Tooltips have an accessible name | 4.1.2 | A | high | serious |
| [`treeitem-name-present`](#treeitem-name-present) | Tree items have an accessible name | 4.1.2 | A | high | serious |
| [`valid-lang`](#valid-lang) | Element lang attribute must be syntactically valid | 3.1.2 | AA | high | moderate |
| [`video-poster-text-alternative-present`](#video-poster-text-alternative-present) | &lt;video&gt; poster must have a text alternative | 1.1.1 | A | medium | serious |

## Manual rules (59), never `fail`

| Rule ID | Title | WCAG SC | Level | Confidence | Default severity |
|---|---|---|---|---|---|
| [`accesskeys`](#accesskeys) | accesskey values must be unique | — | — | medium | minor |
| [`area-alt-quality`](#area-alt-quality) | &lt;area&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`aria-checked-state-mismatch`](#aria-checked-state-mismatch) | Native checkbox/radio aria-checked should match its actual state | 4.1.2 | A | medium | moderate |
| [`aria-expanded-state-mismatch`](#aria-expanded-state-mismatch) | aria-expanded should match whether the controlled content is shown | 4.1.2 | A | medium | moderate |
| [`aria-text`](#aria-text) | role="text" elements should have no focusable descendants | — | — | medium | minor |
| [`bypass-blocks-present`](#bypass-blocks-present) | Page must provide a way to bypass repeated blocks | 2.4.1 | A | medium | moderate |
| [`canvas-text-alternative-quality`](#canvas-text-alternative-quality) | &lt;canvas&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`control-name-title-only`](#control-name-title-only) | A button or link should not take its name only from its title | — | — | medium | minor |
| [`css-focus-indicator-suppressed`](#css-focus-indicator-suppressed) | Focus indicator must not be removed without a replacement | 2.4.7 | AA | medium | serious |
| [`css-hidden-focus`](#css-hidden-focus) | Focusable elements must not be visually hidden | 2.4.7 | AA | low | serious |
| [`embed-text-alternative-quality`](#embed-text-alternative-quality) | &lt;embed&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`empty-table-header`](#empty-table-header) | Table header cells must not be empty | — | — | medium | minor |
| [`focus-not-removed-by-script`](#focus-not-removed-by-script) | A script does not remove focus from an element as it receives it | 2.1.1, 2.4.7 | A, AA | low | serious |
| [`focus-order-semantics`](#focus-order-semantics) | Elements added to the tab order should have interactive semantics | — | — | medium | minor |
| [`form-control-label-quality`](#form-control-label-quality) | Form field labels should be descriptive and distinguishable | 2.4.6 | AA | medium | minor |
| [`form-control-programmatic-label-quality`](#form-control-programmatic-label-quality) | Form controls should have a label shown on screen | 3.3.2 | A | medium | moderate |
| [`heading-order`](#heading-order) | Heading levels must not skip a level | — | — | medium | minor |
| [`heading-quality`](#heading-quality) | Heading text should be descriptive, not a placeholder | 2.4.6 | AA | medium | minor |
| [`identical-links-same-purpose`](#identical-links-same-purpose) | Links with the same accessible name should lead to the same destination | 2.4.9 | AAA | low | minor |
| [`image-redundant-alt`](#image-redundant-alt) | Image alt text must not duplicate adjacent visible text | — | — | medium | minor |
| [`img-alt-decorative`](#img-alt-decorative) | Excluded &lt;img&gt;/&lt;canvas&gt;/&lt;svg&gt; must be decorative (manual review) | 1.1.1 | A | medium | minor |
| [`img-alt-quality`](#img-alt-quality) | &lt;img&gt; alt text must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`input-image-alt-decorative`](#input-image-alt-decorative) | &lt;input type="image"&gt; with alt="" must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`input-image-alt-quality`](#input-image-alt-quality) | &lt;input type="image"&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`label-for-valid`](#label-for-valid) | A label’s for attribute should name a control it can label | — | — | medium | minor |
| [`label-title-only`](#label-title-only) | Title-only form labels (deprecated) | — | — | medium | minor |
| [`landmark-banner-is-top-level`](#landmark-banner-is-top-level) | Banner landmark must be top-level | — | — | medium | minor |
| [`landmark-complementary-is-top-level`](#landmark-complementary-is-top-level) | Complementary landmark must be top-level | — | — | medium | minor |
| [`landmark-contentinfo-is-top-level`](#landmark-contentinfo-is-top-level) | Contentinfo landmark must be top-level | — | — | medium | minor |
| [`landmark-main-is-top-level`](#landmark-main-is-top-level) | Main landmark must be top-level | — | — | medium | minor |
| [`landmark-no-duplicate-banner`](#landmark-no-duplicate-banner) | Page must not have more than one banner landmark | — | — | medium | minor |
| [`landmark-no-duplicate-contentinfo`](#landmark-no-duplicate-contentinfo) | Page must not have more than one contentinfo landmark | — | — | medium | minor |
| [`landmark-no-duplicate-main`](#landmark-no-duplicate-main) | Page must not have more than one main landmark | — | — | medium | minor |
| [`landmark-one-main`](#landmark-one-main) | Page should have a main landmark | — | — | medium | minor |
| [`landmark-unique`](#landmark-unique) | Landmarks with the same role must have unique names | — | — | medium | minor |
| [`link-name-quality`](#link-name-quality) | Link text should be descriptive, not generic | 2.4.4, 2.4.9 | A, AAA | medium | minor |
| [`live-region-announcements`](#live-region-announcements) | Live regions should be able to announce status messages | 4.1.3 | AA | medium | moderate |
| [`manual-review`](#manual-review) | Manual review: keyboard navigation and focus order | 2.1.1, 2.4.3, 2.4.7 | A, A, AA | medium | moderate |
| [`media-alternative-transcript-evidence`](#media-alternative-transcript-evidence) | Time-based media: transcript or text alternative evidence | 1.2.1 | A | low | moderate |
| [`meta-viewport-large`](#meta-viewport-large) | Viewport meta tag should allow zooming up to 500% | — | — | medium | minor |
| [`mouse-only-event-handlers`](#mouse-only-event-handlers) | Pointer-only event handlers should have a keyboard-reachable equivalent | 2.1.1, 2.1.3 | A, AAA | low | moderate |
| [`moving-content-pausable`](#moving-content-pausable) | Content that moves by itself can be paused, stopped or hidden | 2.2.2 | A | low | moderate |
| [`no-autoplay-audio`](#no-autoplay-audio) | Autoplaying audio should provide a pause/stop or volume-control mechanism | 1.4.2 | A | low | moderate |
| [`object-text-alternative-quality`](#object-text-alternative-quality) | &lt;object&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`p-as-heading`](#p-as-heading) | Text styled to look like a heading should probably be a real heading | 1.3.1 | A | low | minor |
| [`page-has-heading-one`](#page-has-heading-one) | Page should have a level-one heading | — | — | medium | minor |
| [`page-title-patterns`](#page-title-patterns) | Page title patterns that may be insufficiently descriptive | 2.4.2 | A | medium | minor |
| [`password-paste-enabled`](#password-paste-enabled) | Authentication fields must not block pasting | 3.3.8 | AA | medium | serious |
| [`presentation-role-conflict`](#presentation-role-conflict) | Presentational role must not conflict with a global ARIA attribute or focusability | — | — | medium | minor |
| [`region`](#region) | Page content should be inside a landmark region | — | — | medium | minor |
| [`scope-attr-valid`](#scope-attr-valid) | scope attribute must have a valid value | — | — | medium | minor |
| [`scrollable-region-focusable`](#scrollable-region-focusable) | Scrollable regions with no focusable content should be keyboard-focusable | 2.1.1, 2.1.3 | A, AAA | low | moderate |
| [`skip-link`](#skip-link) | Skip link must have a resolvable, usable target | — | — | medium | minor |
| [`svg-text-alternative-quality`](#svg-text-alternative-quality) | &lt;svg&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`tabindex`](#tabindex) | tabindex should not be greater than 0 | — | — | medium | minor |
| [`table-duplicate-name`](#table-duplicate-name) | Table caption must not duplicate its summary attribute | — | — | medium | minor |
| [`table-fake-caption`](#table-fake-caption) | A table's first row should not stand in for a real &lt;caption&gt; | 1.3.1 | A | low | minor |
| [`video-caption`](#video-caption) | Prerecorded video should provide a captions track | 1.2.2 | A | low | moderate |
| [`widget-keyboard-focusable`](#widget-keyboard-focusable) | Widgets should be reachable with the keyboard | 2.1.1 | A | medium | serious |

## Composite (WCAG-SC rollup) rules (36)

Composite rules aren't individually authored. They're generated rollups over the atomic rules above, one per WCAG Success Criterion with automatable coverage. See [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md) for rollup semantics.

| Composite ID | Title | Description | WCAG SC | Level | # atomic rules rolled up |
|---|---|---|---|---|---|
| `wcag-1.1.1-non-text-content` | Non-text content: text alternatives | Rollup of checks ensuring non-text content has an appropriate text alternative. | 1.1.1 | A | 21 |
| `wcag-1.2.1-audio-only-video-only-prerecorded` | Audio-only and video-only (prerecorded): transcript | Rollup of checks for transcript availability for prerecorded audio-only/video-only media. | 1.2.1 | A | 1 |
| `wcag-1.2.2-captions-prerecorded` | Captions (Prerecorded) | Rollup of checks for captions-track evidence on prerecorded video. | 1.2.2 | A | 1 |
| `wcag-1.3.1-info-and-relationships` | Info and Relationships | Rollup of checks ensuring information, structure, and relationships conveyed through presentation are programmatically determinable. | 1.3.1 | A | 16 |
| `wcag-1.3.4-orientation` | Orientation | Rollup of checks ensuring content does not restrict its view to a single display orientation. | 1.3.4 | AA | 1 |
| `wcag-1.3.5-identify-input-purpose` | Identify Input Purpose | Rollup of checks ensuring the autocomplete attribute correctly identifies input purpose. | 1.3.5 | AA | 1 |
| `wcag-1.4.1-use-of-color` | Use of Color | Rollup of checks ensuring color is not used as the only visual means of conveying information. | 1.4.1 | A | 1 |
| `wcag-1.4.12-text-spacing` | Text Spacing | Rollup of checks ensuring text spacing can be increased without losing content. | 1.4.12 | AA | 2 |
| `wcag-1.4.2-audio-control` | Audio Control | Rollup of checks for a pause/stop or volume-control mechanism on autoplaying audio. | 1.4.2 | A | 1 |
| `wcag-1.4.3-contrast-minimum` | Contrast: minimum | Rollup of checks for minimum text contrast. | 1.4.3 | AA | 2 |
| `wcag-1.4.4-resize-text` | Resize Text | Rollup of checks ensuring the viewport meta tag does not prevent users from zooming text up to 200%. | 1.4.4 | AA | 1 |
| `wcag-1.4.6-contrast-enhanced` | Contrast: enhanced | Rollup of checks for enhanced text contrast. | 1.4.6 | AAA | 2 |
| `wcag-2.1.1-keyboard` | Keyboard | Rollup of checks ensuring functionality is operable through a keyboard interface. | 2.1.1 | A | 8 |
| `wcag-2.1.3-keyboard-no-exception` | Keyboard (No Exception) | Rollup of checks ensuring functionality is operable through a keyboard interface with no exceptions (AAA). | 2.1.3 | AAA | 3 |
| `wcag-2.2.1-timing-adjustable` | Timing Adjustable | Rollup of checks ensuring the page does not impose a timed refresh the user cannot control. | 2.2.1 | A | 1 |
| `wcag-2.2.2-pause-stop-hide` | Pause, Stop, Hide | Rollup of checks ensuring moving, blinking, or auto-scrolling content can be paused, stopped, or hidden. | 2.2.2 | A | 2 |
| `wcag-2.2.4-interruptions` | Interruptions | Rollup of checks ensuring automatic context changes only happen at the user's request (AAA). | 2.2.4 | AAA | 2 |
| `wcag-2.4.1-bypass-blocks` | Bypass Blocks | Rollup of checks ensuring the page provides a way to bypass repeated blocks of content. | 2.4.1 | A | 1 |
| `wcag-2.4.2-page-titled` | Page titled | Rollup of checks ensuring documents have a meaningful page title. | 2.4.2 | A | 2 |
| `wcag-2.4.3-focus-order` | Focus order | Rollup of checks ensuring focus moves through content in a meaningful order. | 2.4.3 | A | 1 |
| `wcag-2.4.4-link-purpose-in-context` | Link Purpose (In Context) | Rollup of checks flagging links with no accessible name, or whose text alone is a known non-descriptive/generic phrase. | 2.4.4 | A | 2 |
| `wcag-2.4.6-headings-and-labels` | Headings and Labels | Rollup of checks flagging headings whose text is a placeholder rather than a description of the content that follows. | 2.4.6 | AA | 2 |
| `wcag-2.4.7-focus-visible` | Focus visible | Rollup of checks ensuring keyboard focus is not hidden and remains perceivable. | 2.4.7 | AA | 4 |
| `wcag-2.4.9-link-purpose-link-only` | Link Purpose (Link Only) | Rollup of checks ensuring a link's purpose can be identified from the link alone: it has an accessible name that is not a generic phrase, and links with the same accessible name serve the same purpose (AAA). | 2.4.9 | AAA | 3 |
| `wcag-2.5.3-label-in-name` | Label in name | Rollup of checks ensuring that when a control has a visible text label, the accessible name contains that visible label text. | 2.5.3 | A | 1 |
| `wcag-2.5.8-target-size-minimum` | Target size: minimum | Rollup of checks ensuring pointer targets meet minimum size requirements. | 2.5.8 | AA | 1 |
| `wcag-3.1.1-language-of-page` | Language of page | Rollup of checks ensuring the page language is specified. | 3.1.1 | A | 2 |
| `wcag-3.1.2-language-of-parts` | Language of Parts | Rollup of checks ensuring elements whose language differs from the page default declare it correctly. | 3.1.2 | AA | 1 |
| `wcag-3.2.5-change-on-request` | Change on Request | Rollup of checks ensuring context changes only happen at the user's request (AAA). | 3.2.5 | AAA | 2 |
| `wcag-3.3.1-error-identification` | Error Identification | Rollup of checks ensuring a field marked invalid has an error message, shown in text. | 3.3.1 | A | 1 |
| `wcag-3.3.2-labels-or-instructions` | Labels or Instructions | Rollup of checks ensuring form controls have unambiguous labeling. | 3.3.2 | A | 3 |
| `wcag-3.3.8-accessible-authentication-minimum` | Accessible Authentication (Minimum) | Rollup of checks ensuring an authentication step leaves the mechanisms that help a user through it in place. | 3.3.8 | AA | 1 |
| `wcag-4.1.1-parsing` | Parsing | Rollup of checks ensuring id values are unique. WCAG 2.0/2.1 only: SC 4.1.1 was removed in WCAG 2.2, so this composite carries the wcag22-removed tag. | 4.1.1 | A | 1 |
| `wcag-4.1.2-aria-validity` | Name, role, value: ARIA validity | Rollup of checks that ARIA role and attribute usage conforms to the WAI-ARIA specification (valid roles, valid attributes, valid values, required attributes, unique ARIA-referenced ids). | 4.1.2 | A | 15 |
| `wcag-4.1.2-name` | Name, role, value: accessible name | Rollup of checks that common interactive elements expose a non-empty accessible name. | 4.1.2 | A | 24 |
| `wcag-4.1.3-status-messages` | Status Messages | Rollup of checks that live regions can present status messages to assistive technology without receiving focus. | 4.1.3 | AA | 1 |

## Rule reference

Every atomic rule, alphabetically. "Applies to" is the rule's precondition (when it returns `notApplicable`), and "Expectation" is the condition it decides once it does apply.

### `accesskeys`

**accesskey values must be unique**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that no two elements on the page share the same accesskey attribute value.

**Applies to.** Applies whenever two or more elements carry a non-empty accesskey attribute: only then can two of them collide.

**Expectation.** Every accesskey value on the page is unique. Duplicate accesskeys make keyboard-shortcut activation ambiguous: only one of the elements sharing the key can actually be reached by it, and which one is browser/platform-dependent.

**What a finding reports.**

- `accesskey`: the shared key, in lower case.
- `duplicateCount`: how many elements on the page share it, this one included.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ACCESSKEY_DUPLICATE` | cantTell | This element's accesskey value is also used by another element on the page, so the shortcut may not reach it. | WCAG 2.1.1 (best practice); HTML accesskey attribute (not settled) |

### `area-alt-present`

**&lt;area&gt; must have an accessible name**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that &lt;area&gt; elements have a non-empty accessible name via alt, aria-label/aria-labelledby, or title.

**Applies to.** Applies to &lt;area&gt; elements that: 1) are in a &lt;map&gt; that is referenced by an &lt;img usemap&gt; (as HTML matches it: "#" and the map's id or name, case-sensitive), AND 2) carry a non-empty href (an &lt;area&gt; with no href is not a hyperlink at all per the HTML spec, and has nothing for this rule to name), AND 3) the referencing &lt;img&gt; is actually rendered (hidden/display:none/ visibility exclude it; aria-hidden does not, since &lt;area&gt; is not a DOM descendant of &lt;img&gt;), AND 4) the &lt;area&gt; itself is eligible in the accessibility tree. hidden, display:none and inert on the &lt;area&gt; or its &lt;map&gt; do not exclude it: neither element generates a box, so a real browser's image-map hit-testing ignores all three there (verified against Chromium and Firefox); only those mechanisms on a genuine ancestor of the whole &lt;img&gt;+&lt;map&gt; pairing do.

**Expectation.** Each applicable &lt;area&gt; element has a non-empty accessible name, from alt, aria-label/aria-labelledby, or title. An &lt;area&gt; in a used map is always a link, so alt="" is not decorative here as it is on &lt;img&gt;: an empty alt fails the same as a missing one unless another mechanism names it.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_ALTERNATIVE_MISSING` | fail | An &lt;area&gt; link in an image map that is in use has no alt attribute and no name from aria-label, aria-labelledby or title. | WCAG 1.1.1; H24; F65; HTML area alt (MUST) |
| `TEXT_ALTERNATIVE_EMPTY` | fail | An &lt;area&gt; link in an image map that is in use has an empty alt and no name from aria-label, aria-labelledby or title, so the link has no name. | WCAG 1.1.1; H24; HTML area alt (MUST) |

### `area-alt-quality`

**&lt;area&gt; text alternative must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;area&gt; elements with a non-empty text alternative (alt, aria-label, aria-labelledby or title) for human review of appropriateness. Says when the name looks like a file name, a web address, a placeholder, an "image of" opening or is very long.

**Applies to.** Applies to &lt;area&gt; elements that get a non-empty text alternative from any source: aria-labelledby (resolving to text), aria-label, alt or title. The &lt;area&gt; must carry a non-empty href (otherwise it is not a hyperlink at all per the HTML spec) and belong to a &lt;map&gt; that an &lt;img usemap&gt; actually references ("#" and the map's id or name, case-sensitive, as HTML matches it); an &lt;area&gt; in an unused map is out of scope. The referencing &lt;img&gt; must actually be rendered (hidden/display:none/ visibility exclude it; aria-hidden does not, since &lt;area&gt; is not a DOM descendant of &lt;img&gt;), and the &lt;area&gt; itself must be eligible: hidden, display:none and inert on the &lt;area&gt; or its &lt;map&gt; do not exclude it, since neither generates a box and a real browser's image-map hit-testing ignores all three there (verified against Chromium and Firefox); only those mechanisms on a genuine ancestor of the whole &lt;img&gt;+&lt;map&gt; pairing do. role="presentation"/"none" takes an element out unless it is focusable.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate. Each occurrence lists every source present (data.details.sources), so the reviewer checks each one: a title or aria-label that is not the name still reaches some users. The name is also checked for what the img-alt-quality rule checks in an alt (helpers.getTextAlternativeSignal): a file name, a web address, only symbols, a placeholder or generic word, an opening that says it is an image, or more than 150 characters. Such a name gets its own summary and hint; the finding stays `cantTell`.

**What a finding reports.**

- `reasonCode`: `TEXT_ALTERNATIVE_REVIEW`, whatever the signal.
- `name`: the text alternative the area ends up with, taken from the first source in `sources`.
- `sources`: each source of text the area has, in the order they are used for the name: `aria-labelledby`, `aria-label`, `alt`, `title`.
- `altSignal`, and `length` and `limit` for `too-long`: what made the name look like something other than a description, as for img-alt-quality. Absent when the name is ordinary.
- `alt` (an area with an alt attribute): the alt text.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_ALTERNATIVE_REVIEW` | cantTell | An &lt;area&gt; link has a text alternative, and a person checks that it says where the link leads. | WCAG 1.1.1 (not settled); H24 |

### `aria-allowed-attr`

**aria-* attributes must be permitted for the element’s role**

automatic · WCAG 4.1.2 (A) · confidence medium · default severity moderate

Checks that every recognized aria-* attribute present on an element with an explicit role is either globally supported or supported by that role.

**Applies to.** Applies to elements carrying at least one recognized, non-global aria-* attribute, judged against the role they actually have: an explicit valid role, else the implicit role of their tag, else, for the elements HTML-AAM maps to no role at all, nothing. A custom element with no role attribute naming a role is judged against the role its ElementInternals give it (this.attachInternals().role), its default role, as a native element is judged against its tag's.

**Expectation.** Every recognized aria-* attribute present is either: (a) globally supported on any element (the "global" ARIA states/properties, e.g. aria-label/aria-hidden/aria-describedby), or (b) explicitly listed as a required or supported state/property for the element's role. An attribute ARIA deprecated (rather than prohibited) on the role is still allowed: it is reported as CANTTELL, so the author decides, not as a not-allowed FAIL. The same goes for an element with no role: an attribute ARIA 1.2 made no longer global (`aria-disabled`, `aria-errormessage`, `aria-haspopup`, `aria-invalid`) is CANTTELL there too.

**What a finding reports.**

- `attr`: the aria-* attribute that is not allowed, or deprecated, on the element.
- `role` (an element with a role): the role it was judged against, explicit or implicit. Absent when the element has no role at all.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ARIA_ATTR_NOT_ALLOWED` | fail | An aria-* attribute that the element's role, explicit or implicit, neither requires nor supports, and that is not global. | WCAG 4.1.2; ACT 5c01ea; WAI-ARIA 1.2 supported states and properties |
| `ARIA_ATTR_NOT_ALLOWED_ROLELESS` | fail | A role-specific aria-* attribute on an element that has no role at all, so nothing supports it and assistive technology ignores it. | WCAG 4.1.2; ACT 5c01ea; WAI-ARIA 1.2 supported states and properties; HTML-AAM |
| `ARIA_ATTR_DEPRECATED` | cantTell | An aria-* attribute that ARIA deprecates on the element's role, or that ARIA 1.2 stopped making global, used on an element with no role; it is still allowed. | WAI-ARIA 1.2 deprecated states and properties; WCAG 4.1.2 (not settled) |

### `aria-allowed-role`

**Explicit role must be permitted for its host element**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that an explicit role="" attribute is one of the roles the ARIA-in-HTML specification permits for the host element (e.g. role="tab" is not permitted on &lt;nav&gt;).

**Applies to.** Applies to elements with an explicit, valid, non-abstract role, where the host element/attribute combination has an asserted permitted-roles constraint in the ARIA in HTML specification's table of permitted roles.

**Expectation.** The explicit role is one of the roles the ARIA-in-HTML specification permits for that host element. Reported at CANTTELL rather than FAIL: ARIA-in-HTML's permitted-roles table is an author conformance requirement with no ACT rule and no WCAG mapping in any source. The role the author asked for is still the role assistive technology exposes, so whether the combination harms anyone depends on the widget, not on the table.

**What a finding reports.**

- `role`: the explicit role that is not permitted on the host element.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ARIA_ROLE_NOT_ALLOWED_FOR_ELEMENT` | cantTell | An explicit role that ARIA in HTML does not permit on that element, which assistive technology still exposes. | ARIA in HTML (MUST) |

### `aria-braille-equivalent`

**aria-braillelabel/aria-brailleroledescription must have a non-braille equivalent**

automatic · WCAG 4.1.2 (A) · confidence high · default severity moderate

Checks that elements using aria-braillelabel also have a regular accessible name, and elements using aria-brailleroledescription also have aria-roledescription.

**Applies to.** Elements with a non-empty `aria-braillelabel` and/or non-empty `aria-brailleroledescription` attribute.

**Expectation.**

Per the ARIA specification, `aria-braillelabel` is a Braille-specific SUPPLEMENT to (not a replacement for) the element's regular accessible name, and `aria-brailleroledescription` is a supplement to `aria-roledescription`. An element must therefore also have:

- a non-empty accessible name from a non-braille mechanism, if it declares `aria-braillelabel`;
- a non-empty `aria-roledescription`, if it declares `aria-brailleroledescription`.

Using either braille-specific attribute as the ONLY naming mechanism leaves non-braille assistive technology (most screen readers, voice control, etc.) with no accessible name/role description at all. Reported at CANTTELL rather than FAIL: aria-brailleroledescription without aria-roledescription reaches no user at all, and a missing accessible name is the naming rules' decision for the roles that require one. The braille attribute being unpaired is worth surfacing, but it is not itself a criterion failing.

**What a finding reports.**

- `attr`: the braille attribute that has no equivalent: `aria-braillelabel` or `aria-brailleroledescription`.
- `requires`: what the element also needs: "an accessible name" for `aria-braillelabel`, `aria-roledescription` for `aria-brailleroledescription`.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `BRAILLE_ATTR_WITHOUT_EQUIVALENT` | cantTell | An element with aria-braillelabel but no other accessible name, or with aria-brailleroledescription but no aria-roledescription, so the braille text supplements nothing. | WAI-ARIA 1.3 aria-braillelabel; WAI-ARIA 1.3 aria-brailleroledescription; WCAG 4.1.2 (not settled) |

### `aria-checked-state-mismatch`

**Native checkbox/radio aria-checked should match its actual state**

manual · WCAG 4.1.2 (A) · confidence medium · default severity moderate

Flags a native &lt;input type="checkbox"&gt;/&lt;input type="radio"&gt; whose explicit aria-checked value disagrees with its actual checked/indeterminate state, for manual review.

**Applies to.** Native `<input type="checkbox">` / `<input type="radio">` elements that carry an explicit `aria-checked` attribute.

**Expectation.** `aria-checked` is redundant on a native checkbox/radio (the role's checked state is already exposed natively), but when an author sets it explicitly it should agree with the element's actual state, otherwise assistive technology is told something different from what a sighted user perceives.

**What a finding reports.**

- `ariaChecked`: the state `aria-checked` announces: `true`, `false`, or `mixed` (a checkbox only). A value that is not one of these counts as `false`.
- `actualState`: the state the control is really in: `true`, `false`, or `mixed` for an indeterminate checkbox.
- `type`: `checkbox` or `radio`.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ARIA_CHECKED_STATE_MISMATCH` | cantTell | A native checkbox or radio button whose aria-checked says a different state from the one the control is in; a script may still set them to agree. | WCAG 4.1.2 (not settled); ARIA in HTML; HTML-AAM input |

### `aria-conditional-attr`

**aria-errormessage requires aria-invalid to be set to a non-false value**

automatic · WCAG 4.1.2 (A) · confidence high · default severity moderate

Checks that elements with aria-errormessage also have aria-invalid set to "true", "grammar", or "spelling"; otherwise the error message is dropped from the accessibility tree.

**Applies to.** Elements with a non-empty `aria-errormessage` attribute.

**Expectation.** Per the ARIA specification, `aria-errormessage` is only exposed to assistive technology when `aria-invalid` is present with a value other than `"false"` (i.e. `"true"`, `"grammar"`, or `"spelling"`). An element with `aria-errormessage` but `aria-invalid` absent or `"false"` silently drops the error message from the accessibility tree, authors almost always intend it to be exposed. Reported at CANTTELL rather than FAIL: aria-errormessage is only exposed once aria-invalid is set, so the reference is currently inert. Whether that costs the user anything depends on whether the message is conveyed some other way (visible text next to the field, aria-describedby), which static markup does not settle.

**What a finding reports.**

- `ariaInvalid`: the element's `aria-invalid` value, lowercased; an empty string when the attribute is absent.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ARIA_ERRORMESSAGE_WITHOUT_TRUTHY_INVALID` | cantTell | An element with aria-errormessage whose aria-invalid is absent or false, so the error message is not exposed. | WAI-ARIA 1.2 aria-errormessage; WCAG 4.1.2 (not settled) |

### `aria-deprecated-role`

**role attribute should not use a deprecated or author-discouraged ARIA role**

automatic · WCAG 4.1.2 (A) · confidence high · default severity moderate

Checks that an explicit role="" attribute does not use a role deprecated by the WAI-ARIA specification, or one reserved for user-agent-internal use (e.g. role="generic").

**Applies to.** Applies to any element whose role attribute's first (used) token is a valid, non-abstract ARIA role that authors should not explicitly declare, either because WAI-ARIA has deprecated it (e.g. "directory", superseded by role="list") or because it is reserved for user-agent- internal use (role="generic", which ARIA 1.2 §5.4 says authors SHOULD NOT use in content).

**Expectation.**

The role in use is neither deprecated nor reserved. Graded by the strength of the rule ARIA states:

- CANTTELL at SHOULD NOT, which leaves the usage conforming, so the author decides whether it matters: a deprecated role ("directory") or one reserved for user agents ("generic").
- FAIL at MUST NOT. No ARIA 1.2 or 1.3 role carries an author MUST NOT outside the abstract roles, so this outcome is reserved for a later revision promoting a role to that strength.

Distinct, atomic decision from aria-roles-valid (existence/ abstractness): a role can be valid and non-abstract while still being discouraged in explicit author use.

**What a finding reports.**

- `role`: the deprecated or reserved role in use.
- `guidance`: advice on what to use instead, as English text.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ARIA_ROLE_DEPRECATED` | cantTell | An explicit role that WAI-ARIA has deprecated, such as directory; it still works, and a replacement role is suggested. | WAI-ARIA 1.2 directory; WCAG 4.1.2 (not settled) |
| `ARIA_ROLE_AUTHOR_DISCOURAGED` | cantTell | An explicit role that WAI-ARIA reserves for user agents and says authors should not use, such as generic. | WAI-ARIA 1.2 generic (SHOULD); WCAG 4.1.2 (not settled) |
| `ARIA_ROLE_AUTHOR_PROHIBITED` | fail | An explicit role that WAI-ARIA says authors must not use; no current concrete role is listed, so this code is not given yet. | WAI-ARIA 1.2 role definitions (MUST); WCAG 4.1.2 |

### `aria-expanded-state-mismatch`

**aria-expanded should match whether the controlled content is shown**

manual · WCAG 4.1.2 (A) · confidence medium · default severity moderate

Flags an element whose aria-expanded value disagrees with whether the elements its aria-controls names are shown, for manual review.

**Applies to.**

Elements the page shows with `aria-expanded="true"` or `aria-expanded="false"` and an `aria-controls` that names at least one element in the same tree. Left out:

- a combobox, whose `aria-controls` names its popup, often kept in the page while it is collapsed;
- controlled elements that contain the element itself (a tree item naming its own group's parent).

**Expectation.**

`aria-expanded` tells assistive technology whether the content the element controls is shown. When it says the opposite of what the page shows, a screen reader user is told a panel is closed while it is open, or the other way round.

- `aria-expanded="false"`, and every element `aria-controls` names is shown: cantTell (`EXPANDED_FALSE_CONTROLLED_SHOWN`).
- `aria-expanded="true"`, and every element `aria-controls` names is hidden: cantTell (`EXPANDED_TRUE_CONTROLLED_HIDDEN`).
- Otherwise: pass.

An element counts as hidden when it is out of the accessibility tree: `display: none`, `visibility: hidden`, `hidden`, a closed `<details>`, `content-visibility: hidden`, `inert` or `aria-hidden="true"` on it or an ancestor, and, in a browser, a box of its own collapsed to no height or width with its overflow clipped (an accordion panel animated with `height: 0`). A panel collapsed some other way (a transform, an ancestor's height) counts as shown, and the content a control expands may stay in view while collapsed (a paragraph cut to two lines by `line-clamp`), which is why a finding is a question.

**What a finding reports.**

- `ariaExpanded`: `true` or `false`, as the attribute says.
- `controlledCount`: how many elements `aria-controls` names that were compared.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `EXPANDED_FALSE_CONTROLLED_SHOWN` | cantTell | An element says aria-expanded="false" while every element its aria-controls names is shown. | WAI-ARIA 1.2 aria-expanded; WCAG 4.1.2 (not settled) |
| `EXPANDED_TRUE_CONTROLLED_HIDDEN` | cantTell | An element says aria-expanded="true" while every element its aria-controls names is hidden. | WAI-ARIA 1.2 aria-expanded; WCAG 4.1.2 (not settled) |

### `aria-hidden-body`

**The document &lt;body&gt; must not be aria-hidden**

automatic · WCAG 1.3.1, 4.1.2 (A) · confidence high · default severity critical

Checks that &lt;body&gt; does not have aria-hidden="true", which would remove the entire page from the accessibility tree.

**Applies to.** Always applicable to any HTML document with a &lt;body&gt; element, independent of contextSelector/root scoping, this is a whole- document concern, matching page-title-present's pattern of evaluating document.body directly rather than the scoped root.

**Expectation.** &lt;body&gt; does not have aria-hidden="true". Hiding the document body removes the entire page's content and structure from the accessibility tree at once, both 1.3.1 (Info and Relationships: the page's structure becomes entirely non-determinable) and 4.1.2 (Name, Role, Value: nothing in the document exposes a role/name/value any longer) apply.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ARIA_HIDDEN_BODY` | fail | The &lt;body&gt; has aria-hidden="true", which removes the whole page from the accessibility tree. | WCAG 1.3.1; WCAG 4.1.2; WAI-ARIA 1.2 aria-hidden |

### `aria-hidden-focus`

**ARIA hidden elements must not be focusable**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that aria-hidden="true" elements are not focusable and do not contain focusable descendants.

**Applies to.** Applies to elements that have aria-hidden="true", the value read in any case and with surrounding whitespace ignored (aria-hidden="TRUE" hides content in browsers too).

**Expectation.** No element with aria-hidden="true" may itself be focusable, and no focusable element may exist within an aria-hidden="true" subtree.

**What a finding reports.**

- `metrics.focusableTotal`: how many focusable elements the hidden element holds, counting itself if it is focusable.
- `metrics.focusableDescendants`: how many of those are inside it.
- `metrics.rootIsFocusable`: whether the hidden element itself can take focus.
- `offenders`: up to 5 of the focusable elements. Each item gives its `tag`, its `tabindex`, its `href` (a link), its `type` (an input) and its `visibilityHints`. `metrics.offendersCaptured` is how many are listed.
- `metrics.visibilityHints`: ways the focusable elements are made invisible while still taking focus: `opacityZero`, `offscreen`, `clipped`, `zeroSizeOverflowHidden`. Such an element is a focus stop a sighted keyboard user cannot see.
- `metrics.modalOpen`: whether a modal dialog was open elsewhere on the page, which turns the finding into one to review.
- `runtimeProbe`: `null` unless focusing the one focusable element moved focus straight out of the hidden element. Then it holds `redirected: true`, the tag and id of the element focus moved to (`redirectedToTag`, `redirectedToId`) and `focusTrace`, the elements focus passed through. A hidden focus sentinel that hands focus on like this is reported for review.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ariaHiddenSelfFocusable` | fail | An element with aria-hidden="true" can itself take keyboard focus, which screen readers then do not announce. | WCAG 4.1.2; ACT 6cfa84; WAI-ARIA 1.2 aria-hidden |
| `ariaHiddenContainsFocusable` | fail | An element with aria-hidden="true" contains elements that can take keyboard focus, which screen readers then do not announce. | WCAG 4.1.2; ACT 6cfa84; WAI-ARIA 1.2 aria-hidden |
| `ariaHiddenSelfAndDescendantsFocusable` | fail | An element with aria-hidden="true" can take keyboard focus and also contains other elements that can. | WCAG 4.1.2; ACT 6cfa84; WAI-ARIA 1.2 aria-hidden |
| `ariaHiddenFocusable_modalOpen_needsReview` | cantTell | Focusable content inside aria-hidden="true" while a modal dialog is open elsewhere; it is fine if the dialog keeps focus inside it. | WCAG 4.1.2 (not settled); ACT 6cfa84; WAI-ARIA 1.2 aria-modal |
| `ariaHiddenFocusable_runtimeRedirect_needsReview` | cantTell | The one focusable element inside aria-hidden="true" passed focus straight on to another element when focused, as a focus trap sentinel does. | WCAG 4.1.2 (not settled); ACT 6cfa84; WAI-ARIA 1.2 aria-hidden |

### `aria-owns-valid`

**aria-owns must give each element one owner, and never an ancestor of the owner**

automatic · WCAG 1.3.1, 4.1.2 (A) · confidence high · default severity serious

Checks that no element is named by more than one aria-owns, and that no aria-owns names the element itself or one of its ancestors.

**Applies to.** Elements the page shows with an `aria-owns` naming at least one element in the same tree.

**Expectation.**

WAI-ARIA: an element has only one owner, so its id is in no more than one `aria-owns`, and an element cannot own one that contains it.

- An element named by two or more `aria-owns`: fail (`ARIA_OWNS_DUPLICATE`), reported on the element owned. The browser gives it to one owner, by order, so the structure the other owners state is lost.
- An `aria-owns` naming the element itself or one of its ancestors: fail (`ARIA_OWNS_ANCESTOR`), reported on the owner. The browser ignores that ownership, as it would make a cycle.
- Otherwise: pass.

**What a finding reports.**

- `ownerCount`: for `ARIA_OWNS_DUPLICATE`, how many elements name the owned element in `aria-owns`.
- `ownedId`: the id named.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ARIA_OWNS_DUPLICATE` | fail | An element named in the aria-owns of two or more elements, so the browser gives it to one owner and the structure the others state is lost. | WCAG 1.3.1; WCAG 4.1.2; WAI-ARIA 1.2 aria-owns (MUST) |
| `ARIA_OWNS_ANCESTOR` | fail | An aria-owns that names the element itself or one of its ancestors, an ownership the browser ignores. | WCAG 1.3.1; WCAG 4.1.2; WAI-ARIA 1.2 aria-owns |

### `aria-prohibited-attr`

**ARIA naming attributes must not be used on roles that prohibit them**

automatic · WCAG 4.1.2 (A) · confidence high · default severity moderate

Checks that aria-label/aria-labelledby are not present on WAI-ARIA roles whose specification explicitly prohibits ARIA naming (e.g. generic, emphasis, strong, paragraph).

**Applies to.** Applies to (a) elements whose explicit, valid role is one of the ARIA 1.2 roles with a documented "Prohibited ARIA States and Properties" list for naming attributes (pure text-semantics / non-naming structural roles: caption, code, deletion, emphasis, generic, insertion, mark, none, paragraph, presentation, strong, subscript, suggestion, superscript, time), plus a native &lt;caption&gt; with no valid explicit role, whose implicit role is caption, and (b) elements with no role at all: native HTML tags verified to carry no implicit role (such as &lt;div&gt;, &lt;span&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;code&gt; and &lt;time&gt;), or any autonomous custom element (a hyphenated, author-defined tag per the Custom Elements spec). In both cases, only elements that also carry aria-label or aria-labelledby. A custom element whose ElementInternals give it a role (this.attachInternals().role) is judged by that role, its default role: one of the roles above puts it in (a), any other keeps it out of (b).

**Expectation.** Prohibited attributes must not be present on (a); for (b), the naming attribute is at best unreliable (nothing accessible-name-aware to hang it off) and at worst silently ignored by assistive technology. A roleless element whose own content already gives it a name is reported as CANTTELL, since the attribute may be a deliberate override; one with no other source for a name FAILs.

**What a finding reports.**

- `attr`: the naming attribute found, `aria-label` or `aria-labelledby`.
- `role`: the role that prohibits it; `null` on an element with no role.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ARIA_ATTR_PROHIBITED` | fail | Aria-label or aria-labelledby on an element whose role cannot be named, such as paragraph, generic or presentation. | WCAG 4.1.2; ACT kb1m8s; WAI-ARIA 1.2 prohibited states and properties (MUST) |
| `ARIA_ATTR_PROHIBITED_ROLELESS` | fail | A naming attribute on an element with no role and no other source for a name, or a role description on an element with no role. | WCAG 4.1.2; ACT kb1m8s; WAI-ARIA 1.2 generic (MUST); HTML-AAM |
| `ARIA_ATTR_PROHIBITED_ROLELESS_NEEDS_REVIEW` | cantTell | A naming attribute on an element with no role whose own text gives it a name, so the attribute may be a deliberate override. | WCAG 4.1.2 (not settled); ACT kb1m8s; WAI-ARIA 1.2 generic |

### `aria-prohibited-children`

**Container roles must not own a child with a disallowed role**

automatic · WCAG 1.3.1 (A) · confidence medium · default severity moderate

Checks that every accessible-tree-owned child of a container role (list, listbox, menu, menubar, radiogroup, rowgroup, table, grid, treegrid, tablist, tree, row) has one of that role's allowed owned roles.

**Applies to.** Applies to elements with an explicit, valid role that is one of the container roles with a documented "required owned elements" entry (the same table aria-required-children uses).

**Expectation.** Every accessible-tree-owned descendant of the container (after pruning role="none"/"presentation" elements, and any "group"/ "rowgroup" wrapper the container's own required-owned set names, as transparent for owned-element matching per WAI-ARIA, regardless of whether "group"/"rowgroup" is itself in the container's own required-owned-roles set) has a role from that same required-owned set. Nothing else is a structurally valid direct child of a composite/container role, where "allowed" is the container's required-owned roles plus a small set of roles it may own without being required to (a separator between menu items, a caption on a grid). A roleless wrapper is descended into to reach the items a component library buries inside it, but once one is found there the rest of that wrapper's subtree is the item's own content and is not judged against the container.

**What a finding reports.**

- `containerRole`: the container's role.
- `containerSelector`: a selector for the container.
- `allowedOwnedRoles`: the roles the container may own. Each item is a role name.
- `childRole` (a child with a role): the child's role, which is not one of them; for a link, a button or another control focusable by itself, the role its element has (`link`, `button`). `null` on a child with no role.
- `attr` (a child with no role, or one focusable by itself): what makes it a node of its own: the global aria-* attribute it carries, `tabindex`, or `nativeFocusable` when it can take focus without one (a link, a button).

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ARIA_PROHIBITED_CHILD` | fail | A container role owns a child whose role is not one the container may own, such as a button among list items. | WCAG 1.3.1; ACT bc4a75; WAI-ARIA 1.2 required owned elements |
| `ARIA_PROHIBITED_CHILD_ROLELESS` | fail | A container role owns a child with no role that is still a node of its own, because it carries a global aria-* attribute or can take focus. | WCAG 1.3.1; ACT bc4a75; WAI-ARIA 1.2 required owned elements |

### `aria-required-attr`

**Roles with a required ARIA state/property must carry it**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with an explicit role carry every unambiguous, context-independent required aria-* state/property for that role (e.g. role="checkbox" must have aria-checked).

**Applies to.** Applies to elements with an explicit, valid, non-abstract role that is also one of the small set of roles with a documented, context- independent required state/property (checkbox, combobox, heading, menuitemcheckbox, menuitemradio, meter, radio, scrollbar, separator, slider, switch) -- except when that explicit role is identical to the element's own native/implicit role (ACT 4e8ab6: e.g. &lt;input type="checkbox" role="checkbox"&gt;, which is exempt because the native control's own state exposure already covers it; no aria-checked is required. helpers.aria.getNativeRoleForElement resolves this). A native &lt;input type="checkbox"&gt; or &lt;input type="radio"&gt; with another checkable role (switch, menuitemcheckbox, menuitemradio, or checkbox on a radio and the reverse) is in scope, but its aria-checked counts as supplied: the browser exposes the input's own checked state (HTML-AAM), so it passes without the attribute.

**Expectation.**

Every required state/property for that role is present and non-empty. Graded by whether ARIA supplies a stand-in for the missing attribute:

- FAIL where it does not, so the state is simply not exposed (aria-checked on checkbox/radio/switch/menuitemcheckbox/menuitemradio, aria-valuenow on slider/scrollbar/meter and on a focusable separator).
- CANTTELL where ARIA defines an implicit value the role falls back to (aria-expanded on combobox, aria-level on heading), so the role still exposes a value and only the author knows whether it is the right one.

**What a finding reports.**

- `attr`: the required attribute that is missing or empty.
- `role`: the element's role.
- `implicitValue` (the CANTTELL case): the value ARIA falls back to, `false` for aria-expanded on a combobox, `2` for aria-level on a heading.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ARIA_ATTR_REQUIRED_MISSING` | fail | An element whose role requires a state or property it does not have, and for which ARIA gives no default, so the state is not exposed. | WCAG 4.1.2; ACT 4e8ab6; WAI-ARIA 1.2 required states and properties (MUST) |
| `ARIA_ATTR_REQUIRED_MISSING_IMPLICIT` | cantTell | An element whose role requires a state or property it does not have, where ARIA gives a default value, such as level 2 for a heading. | WAI-ARIA 1.2 required states and properties (exception: implicit value); ACT 4e8ab6; WCAG 4.1.2 (not settled) |
| `state_internals` | cantTell | The element is a custom element that may set the required state through ElementInternals, which no script can read, so whether it is set could not be told. | WCAG 4.1.2 (not settled); HTML ElementInternals (not settled) |

### `aria-required-children`

**Container roles must own at least one required child role**

automatic · WCAG 1.3.1 (A) · confidence medium · default severity moderate

Checks that container roles with a documented "required owned elements" entry (list, listbox, menu, radiogroup, table, grid, tablist, tree, row, ...) contain at least one descendant or aria-owns-referenced element with an acceptable owned role.

**Applies to.** Applies to elements with an explicit, valid, non-abstract role that is also one of the container roles with a documented "required owned elements" entry (list, listbox, menu, menubar, radiogroup, rowgroup, table, grid, treegrid, tablist, tree, row). The container needs its explicit role, but an owned element may take its role from a custom element's ElementInternals (this.attachInternals().role), as an owned native element takes its tag's.

**Expectation.** At least one descendant, or one aria-owns-referenced element, has one of the acceptable owned roles for that container role. Reported at CANTTELL, never FAIL: this rule asks only whether the required content is PRESENT, and a container that owns nothing conveys nothing false -- an empty role="list" is announced as a list with no items, which is what it is. Whether the content a container does own is VALID is aria-prohibited-children's decision, and that rule still fails, so a genuinely misdescribed structure (a role="button" among list items, a tablist of plain buttons) is caught with the same strength as before. The native-HTML equivalents already work this way: nothing in this ruleset fails an empty &lt;ul&gt;, and list-children-valid judges only the children that exist.

**What a finding reports.**

- `role`: the container's role.
- `requiredOwnedRoles`: the roles it needs at least one child with. Each item is a role name.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ARIA_REQUIRED_CHILD_MISSING` | cantTell | A container role owns none of the roles it requires, such as a list with no list items. | WAI-ARIA 1.2 required owned elements (MUST); ACT bc4a75; WCAG 1.3.1 (not settled) |

### `aria-required-parent`

**Roles requiring a specific context role must be in that context**

automatic · WCAG 1.3.1 (A) · confidence medium · default severity moderate

Checks that roles with a documented "required context role" entry (listitem, option, tab, treeitem, row, cell, ...) have an ancestor or aria-owns owner with an acceptable context role.

**Applies to.** Applies to elements with an explicit, valid, non-abstract role that is also one of the roles with a documented, non-empty "required context role" entry (listitem, option, menuitem, menuitemcheckbox, menuitemradio, tab, treeitem, row, cell, gridcell, columnheader, rowheader, rowgroup). The element needs its explicit role, but its context may take its role from a custom element's ElementInternals (this.attachInternals().role), as a native context takes its tag's.

**Expectation.** The element has an ancestor (DOM containment) or owner (via that ancestor/owner's aria-owns) whose effective role is one of the acceptable context roles for this element's role.

**What a finding reports.**

- `role`: the element's role.
- `requiredContextRoles`: the roles one of which it must sit inside, or be owned by. Each item is a role name.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ARIA_REQUIRED_PARENT_MISSING` | fail | An element whose role needs a context role, such as a list item outside a list, has no ancestor or owner with one. | WCAG 1.3.1; ACT ff89c9; WAI-ARIA 1.2 required context role (MUST) |

### `aria-role-name-present`

**ARIA roles that require an accessible name have one**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that the ARIA roles WAI-ARIA requires an accessible name for expose a non-empty one.

**Applies to.** Applies to elements whose role attribute resolves to one of grid, meter, progressbar, radiogroup or tree (its first token naming a known role, matched in any case: role="foo tree" and role="TREE" count, role="link tree" does not), and that are included in the accessibility tree. Membership is decided by WAI-ARIA's own "Accessible Name Required: True" characteristic, not by whether a role merely permits a name: tablist, toolbar, menu, menubar and scrollbar are name-from-author roles the spec does not require a name for, and are out of scope. meter and progressbar are also covered by meter-name-present and progressbar-name-present, which map to SC 1.1.1; this rule is what gives those two roles their 4.1.2 coverage. A custom element whose ElementInternals give it one of those roles (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The element has a non-empty aria-label, an aria-labelledby that resolves to non-empty text, or a non-empty title. Every role in the set is name-from-author-only, so descendant text is not accepted: a labelled child inside a composite widget would otherwise pass the container that has no name of its own. The name the HTML host element gives itself counts too, since the browser still computes it under the role: the first child &lt;legend&gt; of a &lt;fieldset&gt;, the first child &lt;caption&gt; of a &lt;table&gt;, and an associated &lt;label&gt; on a labelable element such as &lt;progress&gt; or &lt;meter&gt;.

**What a finding reports.**

- `role`: the role that needs a name, one of `grid`, `meter`, `progressbar`, `radiogroup` and `tree`. A stable contract (API_STABILITY.md), unlike the rest of `data.details`.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | An element whose role requires an accessible name has none from aria-label, aria-labelledby, title or its host element. | WCAG 4.1.2; WAI-ARIA 1.2 accessible name required; accname 1.2 |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `aria-roles-valid`

**role attribute must be a valid, non-abstract ARIA role**

automatic · WCAG 1.3.1, 4.1.2 (A) · confidence high · default severity serious

Checks that an explicit role="" attribute resolves to a real, non-abstract WAI-ARIA role.

**Applies to.** Applies to any element with a non-empty role="" attribute in the composed DOM.

**Expectation.**

At least one role token names a concrete, non-abstract ARIA role. Graded by what the element falls back to when none does:

- FAIL on a roleless host (div, span, custom element), which is left exposed as generic, so the role the author meant reaches no one.
- CANTTELL where the element has a native role (a &lt;button&gt;, &lt;nav&gt;, &lt;a href&gt;), which the accessibility tree keeps using. ACT 674b10 lists 4.1.2 as a secondary requirement only, "satisfied through the implicit role," so the bad token is worth reporting but is not itself the criterion failing.

**What a finding reports.**

- `role`: the first token of the role attribute. No token in it is a known role, or the known ones are all abstract.
- `nativeRole` (the CANTTELL case): the element's native role, which assistive technology keeps using.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ARIA_ROLE_INVALID` | fail, cantTell | No token of the role attribute is a known ARIA role; it fails on an element left with no role, and is asked about where the element keeps its native role. | WCAG 1.3.1; WCAG 4.1.2; ACT 674b10; WAI-ARIA 1.2 role attribute |
| `ARIA_ROLE_ABSTRACT` | fail, cantTell | The role attribute names only abstract roles, which authors must not use; it fails on an element left with no role, and is asked about where the element keeps its native role. | WCAG 1.3.1; WCAG 4.1.2; ACT 674b10; WAI-ARIA 1.2 abstract roles (MUST) |

### `aria-text`

**role="text" elements should have no focusable descendants**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that elements with role="text" contain no focusable descendant (link, button, form control, tabindex, iframe, or contenteditable).

**Applies to.** Elements whose role attribute resolves to text: its first token naming a known role, matched in any case, is `text`, so `role="foo text"` and `role="TEXT"` count while `role="link text"` (a link) does not.

**Expectation.** `role="text"` tells assistive technology to treat an element's whole subtree as a single unit of plain text (e.g. text visually split across multiple `<span>`s by styling). Per the WAI-ARIA Authoring Practices, this only makes sense when that subtree contains no focusable content: a focusable descendant inside a "this is just text" region is unreachable or confusing for keyboard/AT users.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ROLE_TEXT_HAS_FOCUSABLE_DESCENDANT` | cantTell | An element with role="text" contains content that can take keyboard focus. | WAI-ARIA Authoring Practices (best practice) |

### `aria-valid-attr`

**aria-* attributes must be real, defined ARIA attributes**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that every aria-* attribute name present in the DOM is a real attribute defined by the WAI-ARIA specification.

**Applies to.** Applies to any element in the composed DOM that carries at least one attribute whose name starts with "aria-".

**Expectation.** Each aria-* attribute name is a real attribute defined by the WAI-ARIA specification (catches typos / made-up attribute names, which are silently ignored by assistive technology and therefore a real, deterministic defect). Reported at CANTTELL rather than FAIL: an aria-* attribute the spec does not define is inert, so nothing about the element's exposed name, role or value changes because it is there. Where the author meant a real attribute and the element ends up without a name, that absence is the naming rules' decision, not this one's. ACT 5f99a7 maps 1.3.1/4.1.2 as secondary requirements, "less strict" than the rule itself.

**What a finding reports.**

- `attr`: the aria-* attribute name that WAI-ARIA does not define.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ARIA_ATTR_INVALID` | cantTell | An aria-* attribute name that WAI-ARIA does not define, such as a typo, which assistive technology ignores. | WAI-ARIA 1.2 states and properties; ACT 5f99a7; WCAG 4.1.2 (not settled) |

### `aria-valid-attr-value`

**aria-* attribute values must match their declared type**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that every recognized aria-* attribute has a value conforming to its WAI-ARIA-declared value type (boolean, tristate, token, integer, number, or ID reference).

**Applies to.** Applies to any element carrying at least one recognized aria-* attribute (unrecognized attribute names are aria-valid-attr's concern, not evaluated here).

**Expectation.**

Each attribute's value conforms to its WAI-ARIA-declared value type: boolean ("true"/"false"), tristate ("true"/"false"/"mixed"), a token from a fixed enumerated set, an integer (within the range WAI-ARIA sets for it), a real number, or an ID reference (list) that resolves to an existing element in the document. Boolean, tristate and token values are read in any case, as Chromium reads them (aria-checked="TRUE" is checked). Per ACT 6a7281's own applicability ("any state or property that is NOT empty"), an explicitly empty value, including a bare boolean-style attribute with no "=value" at all, e.g. `aria-checked` alone, is out of scope for every value type, not a violation: a common, deliberate pattern in templated markup (e.g. React conditionally rendering `aria-describedby={hasError ? errorId : ''}`). Some attributes also constrain each other, checked once each is valid on its own:

- On an element whose role is slider, scrollbar, progressbar, meter, separator or spinbutton: `aria-valuemin` greater than `aria-valuemax` fails (`ARIA_VALUE_RANGE_INVERTED`), and so does an `aria-valuenow` outside the range (`ARIA_VALUENOW_OUT_OF_RANGE`), since the browser then gives assistive technology the nearest end of the range instead (Chromium announces 10 for 50 of 0 to 10). The range is the stated one; else a native element's own (a `<progress>`, `<meter>`, range or number input, by its `min` and `max`), as HTML-AAM maps it; else ARIA's defaults of 0 and 100, except on a spinbutton, which has none. With `aria-valuetext`, which is announced in place of the number, the value is not compared.
- `aria-posinset` greater than `aria-setsize` fails (`ARIA_POSINSET_EXCEEDS_SETSIZE`); a set size of -1 (unknown) is left alone.
- `aria-haspopup` whose popup, an element `aria-controls` names (or one inside it), has another role: cantTell (`ARIA_HASPOPUP_ROLE_MISMATCH`), as a script may show another popup. `true` means `menu`. Compared only when a named element has a role.
- `aria-activedescendant` naming an element that is neither inside the element nor inside one it names in `aria-owns` or `aria-controls`: cantTell (`ARIA_ACTIVEDESCENDANT_OUTSIDE`). A combobox is left out, as its options are in the popup it controls.

**What a finding reports.**

- `attr`: the attribute whose value is not valid.
- `value`: its value as written.
- `valueReason`: what is wrong with it. On a FAIL: `expected-true-false`, `expected-true-false-undefined`, `expected-true-false-mixed`, `expected-integer`, `expected-number` or `invalid-token` when it is not of the attribute's type, `integer-out-of-range` when it is below the lowest value ARIA allows, `expected-single-idref` when an attribute taking one id holds several, `idref-not-found` when aria-activedescendant's id matches no element. On a CANTTELL: `idref-list-none-found` when none of the ids in a list matches an element, `idref-controls-not-found` for the same on aria-controls.
- For the constraints between attributes, the values compared: `role`, `valuenow`, `valuemin`, `valuemax` (the range used, defaults included); `posinset`, `setsize`; `haspopup`, `expectedRole`, `popupRole`; `activedescendant`.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ARIA_ATTR_VALUE_INVALID` | fail | An aria-* attribute whose value is not of the type WAI-ARIA defines for it, is below its lowest allowed value, or, for aria-activedescendant, names no element. | WCAG 4.1.2; ACT 6a7281; WAI-ARIA 1.2 state and property value types |
| `ARIA_ATTR_VALUE_TARGET_ABSENT` | cantTell | An id reference list, such as aria-describedby or aria-controls, none of whose ids matches an element; a script may add it later. | WCAG 4.1.2 (not settled); ACT 6a7281; WAI-ARIA 1.2 ID reference list |
| `ARIA_VALUE_RANGE_INVERTED` | fail | A range widget whose aria-valuemin is greater than its aria-valuemax. | WCAG 4.1.2; WAI-ARIA 1.2 aria-valuemin; WAI-ARIA 1.2 aria-valuemax |
| `ARIA_VALUENOW_OUT_OF_RANGE` | fail | A range widget whose aria-valuenow is outside its range, so assistive technology is given the nearest end of the range instead. | WCAG 4.1.2; WAI-ARIA 1.2 aria-valuenow; HTML-AAM |
| `ARIA_POSINSET_EXCEEDS_SETSIZE` | fail | An element whose aria-posinset is greater than its aria-setsize. | WCAG 4.1.2; WAI-ARIA 1.2 aria-posinset (MUST) |
| `ARIA_HASPOPUP_ROLE_MISMATCH` | cantTell | The element aria-controls names has another role than the popup aria-haspopup announces; a script may show another popup. | WAI-ARIA 1.2 aria-haspopup (MUST); WCAG 4.1.2 (not settled) |
| `ARIA_ACTIVEDESCENDANT_OUTSIDE` | cantTell | Aria-activedescendant names an element that is neither inside the element nor inside one it owns or controls. | WAI-ARIA 1.2 aria-activedescendant; WCAG 4.1.2 (not settled) |

### `autocomplete-valid`

**autocomplete attribute must be a valid autofill value**

automatic · WCAG 1.3.5 (AA) · confidence high · default severity moderate

Checks that a non-empty autocomplete attribute is "on"/"off" or a well-formed autofill detail token list.

**Applies to.** Applies to form controls (input, select, textarea) with a non-empty autocomplete attribute. Disabled controls (the disabled attribute, including a control disabled by a disabled fieldset ancestor, or aria-disabled="true") and input types with a fixed value are exempt, as in ACT 73f2c2.

**Expectation.** The value is "on"/"off" alone, or a well-formed autofill detail token list: an optional "section-*" token, then an optional "shipping"/"billing" token, then an optional contact-modality token (home/work/mobile/fax/pager), then exactly one recognized field-name token (name, email, street-address, cc-number, tel, ...), optionally followed by "webauthn". A malformed value means the field is not reliably identified for assistive technology that relies on autocomplete to describe the expected input purpose.

**What a finding reports.**

- `value`: the autocomplete value as written, trimmed.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `AUTOCOMPLETE_VALUE_INVALID` | fail | The autocomplete value is neither "on"/"off" nor a well-formed list of autofill tokens, so the field's input purpose is not identified. | WCAG 1.3.5; HTML autocomplete (MUST); H98; F107; ACT 73f2c2 |

### `avoid-inline-spacing`

**Inline style must not force text spacing below the WCAG metric**

automatic · WCAG 1.4.12 (AA) · confidence high · default severity moderate

Checks that where inline style forces line-height, letter-spacing or word-spacing with !important, the value already meets WCAG 1.4.12, so the user has nothing left to override.

**Applies to.** Applies to a rendered element with visible text of its own whose style attribute declares line-height, letter-spacing or word-spacing as `!important` with a real value. A CSS-wide keyword (inherit, initial, unset, revert) specifies no spacing of its own and is out of scope.

**Expectation.** Each such declaration already meets WCAG 1.4.12's own metric for that property, as a multiple of the font size: line-height at least 1.5, letter-spacing at least 0.12, word-spacing at least 0.16. A forced value that already satisfies the criterion leaves the user nothing to override.

**What a finding reports.**

- `properties`: the spacing properties the finding is about. Each item is `line-height`, `letter-spacing` or `word-spacing`. On a FAIL, or on text that may never wrap, they are the ones forced below the metric; on `INLINE_SPACING_NOT_RESOLVABLE`, the ones whose value could not be worked out.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `INLINE_SPACING_IMPORTANT` | fail | The element's style attribute forces line-height, letter-spacing or word-spacing with !important below the spacing WCAG 1.4.12 lets users apply, on text that wraps. | WCAG 1.4.12; ACT 78fd32; ACT 24afc2; ACT 9e45ec; CSS Cascade important declarations |
| `INLINE_SPACING_NO_SOFT_WRAP` | cantTell | Spacing forced below the metric on text that does not appear able to wrap, which the criterion may not cover. | WCAG 1.4.12 (not settled); ACT 78fd32; ACT 24afc2; ACT 9e45ec |
| `INLINE_SPACING_SHORT_TEXT` | cantTell | Spacing forced below the metric on text short enough to fit on one line, which may never wrap. | WCAG 1.4.12 (not settled); ACT 78fd32; ACT 24afc2; ACT 9e45ec |
| `INLINE_SPACING_NOT_RESOLVABLE` | cantTell | Spacing set with !important whose value could not be worked out, so whether it meets the metric is unknown. | WCAG 1.4.12 (not settled) |

### `binary-control-name-present`

**Binary controls have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that checkbox, radio, and switch controls expose a non-empty accessible name.

**Applies to.** Applies to elements whose role attribute resolves to checkbox, radio or switch (the first token naming a known role, matched case-insensitively, so role="foo switch" and role="SWITCH" count) that are included in the accessibility tree. A native &lt;input type="checkbox"&gt;/&lt;input type="radio"&gt; is in scope only when it carries one of those roles explicitly; without a role attribute it belongs to form-control-programmatic-label-present. A custom element whose ElementInternals give it one of those roles (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The control has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. A native checkbox or radio additionally accepts an associated &lt;label&gt;, the labels API, a wrapping &lt;label&gt;, or label[for], with at most four labels read for determinism, and any other element accepts its own subtree text, those roles being name-from-content.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The checkbox, radio or switch has no accessible name from aria-label, aria-labelledby, title, a label or its content. | WCAG 4.1.2; F68; accname 1.2; ACT e086e5 |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `button-name-present`

**Buttons have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that buttons expose a non-empty accessible name.

**Applies to.** Applies to &lt;button&gt;, &lt;input type="button"&gt;, &lt;input type="submit"&gt;, &lt;input type="reset"&gt; and elements whose role attribute resolves to button (its first known, non-abstract token, in any case, so role="foo button" counts and role="link button" does not), where the element is included in the accessibility tree. role="presentation"/"none" takes an element out of scope unless a global ARIA attribute or focusability restores its role, per presentational roles conflict resolution. A custom element whose ElementInternals give it the button role (this.attachInternals().role), with no role attribute naming another, counts as a native element with that role does.

**Expectation.** The element has a non-empty accessible name. A programmatic name is taken first (aria-labelledby, aria-label, an associated &lt;label&gt;, title). Failing that, an &lt;input&gt; button falls back to its value attribute, and type="submit"/type="reset" fall back to the user agent's own "Submit"/"Reset" default, which is why those two are never nameless. Failing both, a button whose role is name-from-content falls back to its subtree text, counting each descendant's own name (an &lt;img alt&gt;, aria-label, an &lt;svg&gt;'s &lt;title&gt; child, or title) rather than only text nodes.

**What a finding reports.**

- `refs.accessibleName`: what the lookup of a programmatic name (aria-labelledby, aria-label, &lt;label&gt;, title) found. Its `mechanism` is the source it stopped at, `none` when there was none, and its `flags` say why a naming attribute that is there gave no name, for example `aria-label-empty` or `aria-labelledby-empty-or-unresolvable`.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The button has no accessible name from its naming attributes, a label, title, an input's value or its content. | WCAG 4.1.2; F68; accname 1.2; HTML-AAM 4.1.1; ACT 97a4e1 |
| `name_closedContent` | cantTell | The button may take its name from content inside a closed shadow root, which no script can read, so whether it has a name could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |
| `name_contentTooDeep` | cantTell | The button's content is nested too deeply for its name to be worked out, so whether it has a name could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `bypass-blocks-present`

**Page must provide a way to bypass repeated blocks**

manual · WCAG 2.4.1 (A) · confidence medium · default severity moderate

Checks that the page has at least one recognized WCAG 2.4.1 bypass-blocks mechanism: a main landmark, a working skip link, or a heading.

**Applies to.** Always applicable to any HTML document with a &lt;body&gt; element: "bypass blocks" is a whole-page concern, matching aria-hidden-body / page-title-present's pattern of evaluating the document directly rather than a scoped root. Not while a modal dialog is open: the rest of the page is inert then, so the scan sees the dialog, not the page. A custom element whose ElementInternals give it the main or heading role (this.attachInternals().role) counts as a &lt;main&gt; or a heading does.

**Expectation.** At least one of the following recognized WCAG 2.4.1 techniques is present: (a) a main landmark (&lt;main&gt;, or an element whose role attribute resolves to main: the first real role token, in any case), ARIA11: a screen reader user can jump straight to it, bypassing everything before it (nav, header, repeated blocks) in one step; (b) a working skip link, technique G1: an &lt;a href="#id"&gt; (or legacy &lt;a name="id"&gt;) whose name reads as a skip link in one of the shipped languages (helpers.hasSkipLinkWording, as skip-link uses) and whose target resolves to a real element in the link's own tree (light DOM or the same shadow root). Not required to be positioned before a &lt;nav&gt; or be keyboard-focus-order-first; (c) at least one heading (&lt;h1&gt;-&lt;h6&gt;, or a role resolving to heading) that is both included in the accessibility tree AND visible (not off-screen, clipped, opacity:0, or zero-size-overflow-hidden), technique H69: heading navigation is itself a standards-recognized bypass mechanism (e.g. a screen reader's "jump by heading" command), but ACT 047fe0's own Expectation requires visibility too, since a screen-reader-only heading leaves sighted keyboard users with no equivalent way to locate the start of non-repeated content.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `BYPASS_MECHANISM_ABSENT` | cantTell | No main landmark, working skip link or visible heading was found, so a person checks whether the page needs a way to bypass repeated content and offers one. | WCAG 2.4.1 (not settled); G1; ARIA11; H69; ACT cf77f2 |

### `canvas-text-alternative-present`

**&lt;canvas&gt; must provide a text alternative**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that &lt;canvas&gt; elements provide a text alternative via fallback content or an accessible name.

**Applies to.** Applies to &lt;canvas&gt; elements included in the accessibility tree. Hidden elements are excluded whether or not they are focusable.

**Expectation.**

Each applicable &lt;canvas&gt; provides a text alternative via fallback content or an accessible name, with two exceptions:

- role="img" (the first token of the role attribute that names a known role, matched case-insensitively) makes the canvas's children presentational and its name comes from the author only, so fallback content does not count: aria-labelledby, aria-label or title must name it.
- role="none"/"presentation" (resolved the same way) marks the canvas decorative, and it passes. The role is ignored (presentational role conflict) when the canvas is focusable or carries aria-label/aria-labelledby, and the canvas is then judged like any other.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_ALTERNATIVE_MISSING` | fail | A &lt;canvas&gt; has no fallback content with text and no name from aria-label, aria-labelledby or title. | WCAG 1.1.1; HTML canvas (MUST); accname 1.2 |
| `ROLE_IMG_NAME_MISSING` | fail | A &lt;canvas&gt; with role="img" has no name from aria-label, aria-labelledby or title; its fallback content does not count, since the img role makes it presentational. | WCAG 1.1.1; WAI-ARIA 1.2 img role (MUST); accname 1.2 |

### `canvas-text-alternative-quality`

**&lt;canvas&gt; text alternative must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;canvas&gt; elements with a detected text alternative for human review of equivalence and appropriateness.

**Applies to.** Applies to &lt;canvas&gt; elements that already carry a text alternative: fallback content inside the element, an ARIA name, or a title. A &lt;canvas&gt; with none of those has no alternative whose quality could be judged; that's canvas-text-alternative-present's failure. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

**What a finding reports.**

- `reasonCode`: `TEXT_ALTERNATIVE_REVIEW`.
- `value`: the text alternative to review. When the fallback content has no text of its own but holds an image with alt text or an element with an aria-label, this is the placeholder `fallback-content`.
- `mechanism`: where the text alternative comes from: `canvas-fallback` (content inside the &lt;canvas&gt;), `aria-labelledby`, `aria-label` or `title`.
- `flags`: notes on how the text alternative was found, such as `title-used` when only the title attribute provides it.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_ALTERNATIVE_REVIEW` | cantTell | A &lt;canvas&gt; has a text alternative, and a person checks that it conveys what the canvas shows. | WCAG 1.1.1 (not settled); ACT qt1vmo |

### `click-handler-keyboard-operable`

**Click handlers on elements that are not native controls must work by keyboard**

automatic · WCAG 2.1.1, 2.1.3 (A, AAA) · confidence medium · default severity serious

Checks that an element that is not a native control and has a click handler (an inline onclick, or a click listener the listener hook saw) can take keyboard focus and has a key handler, so a keyboard user can run what a click runs.

**Applies to.**

Elements the page renders with a non-empty inline `onclick` attribute, or, where the page runs the listener hook (`listenerHookScript`), with a click listener added from script (`addEventListener('click', …)` or the `onclick` property) on the element itself, except:

- `<html>` and `<body>`, where a click handler serves the whole page;
- a handler made only of statements that do nothing (`return false`, `void(0)`, `void 0`, `event.preventDefault()`): it offers no function;
- an element with `aria-disabled="true"`, on itself or an ancestor: a disabled control offers no function to operate;
- native controls, whose own keyboard behaviour reaches the user: a link or area with `href`, `button`, `input` other than hidden, `select`, `textarea`, `option`, `summary`, `label` (it activates its control, which takes focus itself), `iframe`, `embed`, `audio` or `video` with `controls`, and an editing host (`contenteditable`);
- an element containing, in the flat tree (its shadow root and slotted content included), a control whose keyboard activation fires `click` (a link or area with `href`, `button`, `summary`, or an input of type button, submit, reset, image, checkbox or radio) that is in the tab order: the control's click bubbles to the handler, so this is event delegation and the keyboard already runs it;
- an element that cannot take focus, has no descendant that can, has no widget role and no `cursor: pointer`: nothing tells the user it is clickable, and such a handler often only tracks clicks or stops their propagation.

**Expectation.**

A keyboard user can run what the click runs. Chromium fires `click` on Enter or Space for native controls only: a `<span role="button" tabindex="0" onclick>` gets focus but does nothing on either key.

- The element, or one of its flat-tree descendants, is in the tab order, and an inline key handler (`onkeydown`, `onkeyup`, `onkeypress`) is on it, an ancestor or a descendant, so key events from the focused element can reach one: pass.
- The element or a descendant is in the tab order, but no inline key handler is there: cantTell (`CLICK_HANDLER_NO_KEY_HANDLER`), check that Enter and Space do what a click does.
- The element or a descendant can take focus, but only with `tabindex="-1"`, and no ancestor has a key handler: cantTell (`CLICK_HANDLER_NOT_IN_TAB_ORDER`). Tab never reaches it; a script may move focus there, as a roving tabindex does.
- With the listener hook, a key listener added from script on the element or a descendant counts as an inline key handler does. One only on an ancestor, a shadow root the element is in, the document or the window may handle the element's keys or only others': cantTell (`CLICK_HANDLER_KEY_LISTENER_ABOVE`).
- The element is in the tab order, its role is button, link, checkbox or switch, and a hook installed before the page's scripts saw no key listener on it, a descendant, an ancestor, a shadow root it is in, the document or the window, nor is an inline key handler there: fail (`CLICK_HANDLER_NO_KEY_LISTENER`). No key event reaches a handler, so Enter and Space do nothing. Unless a focus or focusin listener is on it, an ancestor, a shadow root it is in, the document or the window: it may add the key listener once the element has focus, so cantTell (`CLICK_HANDLER_FOCUS_LISTENER`).
- Neither it nor a descendant can take focus, and its role is button, link, checkbox or switch: fail (`CLICK_HANDLER_CONTROL_NOT_FOCUSABLE`). The element says it is a control, and Tab never reaches it, as in WCAG failure F42 for scripted links. Unless an ancestor carries `aria-activedescendant` or an inline key handler, or is a focusable composite widget (grid, treegrid, listbox, menu, menubar, tree, tablist, toolbar, radiogroup, combobox), which may operate it without moving focus to it: then cantTell.
- Neither it nor a descendant can take focus, with another widget role or `cursor: pointer`: cantTell (`CLICK_HANDLER_NOT_FOCUSABLE`). An option of a combobox's list or a cell of a grid is often operated from the element that keeps focus, and the action may be offered by another control of the page.

**What a finding reports.**

- `role`: the element's ARIA role, or '' for none.
- `focusable`: whether the element itself can take focus.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `CLICK_HANDLER_NO_KEY_LISTENER` | fail | A button, link, checkbox or switch with a click handler is in the tab order, but no key handler or listener is anywhere its key events go, so Enter and Space do nothing. | WCAG 2.1.1; WCAG 2.1.3 |
| `CLICK_HANDLER_CONTROL_NOT_FOCUSABLE` | fail | A button, link, checkbox or switch with a click handler cannot take focus, nor can anything inside it, and nothing above it operates it. | WCAG 2.1.1; WCAG 2.1.3; F42 |
| `CLICK_HANDLER_NO_KEY_HANDLER` | cantTell | An element with a click handler is in the tab order, but no key handler is seen; whether Enter and Space do what a click does is for a person to check. | WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled) |
| `CLICK_HANDLER_NOT_IN_TAB_ORDER` | cantTell | An element with a click handler takes focus only from script (tabindex="-1"), so Tab never reaches it. | WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled) |
| `CLICK_HANDLER_KEY_LISTENER_ABOVE` | cantTell | An element with a click handler is in the tab order, and the only key listener is above it, which may or may not handle its keys. | WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled) |
| `CLICK_HANDLER_FOCUS_LISTENER` | cantTell | A control with a click handler is in the tab order with no key listener, but a focus listener may add one once it has focus. | WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled) |
| `CLICK_HANDLER_NOT_FOCUSABLE` | cantTell | An element with a click handler that cannot take focus, with a widget role or a pointer cursor; whether the action is offered by keyboard elsewhere is for a person to check. | WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled) |

### `combobox-name-present`

**Comboboxes have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="combobox" expose a non-empty accessible name.

**Applies to.** Applies to elements whose role attribute resolves to combobox: its first token naming a known role, matched in any case, is combobox, so role="foo combobox" and role="COMBOBOX" count while role="link combobox" (a link) does not. The element must be included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope. A custom element whose ElementInternals give it the role (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="combobox" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom combobox widget is not reliably exposed as its name. On a labelable element (&lt;input role="combobox"&gt;) an associated &lt;label&gt; counts as well. On a text-like &lt;input&gt; or a &lt;textarea&gt;, the placeholder counts last (HTML-AAM's final name source): a placeholder-only label is a 3.3.2 question, not a missing name.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The combobox has no accessible name from aria-label, aria-labelledby, title, an associated label or a placeholder. | WCAG 4.1.2; F68; accname 1.2; HTML-AAM 4.1.1; WAI-ARIA 1.2 combobox role; ACT e086e5 |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `contrast-computable`

**Color contrast is computable for rendered text**

automatic · WCAG 1.4.3, 1.4.6 (AA, AAA) · confidence high · default severity serious

Determines whether sufficient information is available to compute WCAG color contrast for visible text (e.g., no gradients/images/blend modes that make background indeterminate).

**Applies to.** Applies to every visible text node in scope, plus the label of &lt;input type="button"&gt;/[type="submit"]/[type="reset"], which is rendered from the value attribute and so is invisible to a text-node walk, and the text a form field shows: the current value of a &lt;textarea&gt; or of an &lt;input&gt; that shows text (text, search, email, url, tel, password, number, the date and time types), or, while the value is empty, its placeholder, in the ::placeholder color, font, opacity and background (only where the browser computes that style; jsdom does not). The text of a drop-down &lt;select&gt; (no `multiple`, a size of 1 or none, not `appearance: base-select`) counts as the select's, drawn by the closed control in its colours, font and background: its shown option, and any other option with the select's colours. In a browser, so is the text a ::before or ::after `content` generates (strings, attr() as the browser resolves it, counters), and a list item's ::marker text (a number or a letter, or a string; a bullet or an image isn't text), each judged in the pseudo-element's colour and font, on its element; jsdom computes no pseudo-element styles, so there it is left out. Text counts only when its element is DOM-visible under the run's visibility mode, is not clipped out of sight by the sr-only technique (clip or clip-path), and belongs neither to a disabled control nor to the label of one, WCAG's inactive-user-interface-component exception. Subtrees excluded via engineOptions.excludeSelectors are skipped, and open shadow roots are walked as roots in their own right.

**Expectation.** Both sides of the contrast calculation can be established from CSS for every applicable text node: an effective background resolving to an opaque color, and a parsable foreground color. Where either cannot be, a background image or gradient (a gradient of one color is that color, and a layer that paints nothing under the text, such as a 1px underline, is left out: docs/LAYOUT_MEASUREMENT.md), mix-blend-mode, a filter (other than drop-shadow() alone over an opaque background under all of the text, which hides the shadow) or backdrop-filter, a text-shadow (which may add contrast this engine has no glyph-rendering model to account for), a -webkit-text-stroke outline (drawn in its own colour, often most of the glyph), a ::first-line or ::first-letter in a colour of its own (which text it paints depends on line breaks), opacity on an ancestor, or on the text's own element over a background of its own, that can't be resolved against what lies behind it, a root background that never becomes opaque (in a browser, outside a frame, the canvas painted under the root is read, and text is measured on it), a color that does not parse, or an option of a drop-down &lt;select&gt;, other than the shown one, with a color, background or opacity of its own (SELECT_OPTION_COLOR: it is shown only in the list the select opens, which the platform draws in those colours or in its own), the result is cantTell naming the blocker. This rule is the one that reports that uncertainty, which is what lets contrast-minimum and contrast-enhanced stay silent on the same text instead of guessing at a ratio. One exception: text drawn by a stroke or a shadow, every colour of which, its fill included when seen, is below the AA ratio against a flat background, fails contrast-minimum and contrast-enhanced, and is not asked about here.

**What a finding reports.**

- `blockerProperty`, `blockerValue` (a CSS effect in the way): the CSS property that blocks the calculation and its value, for example `mix-blend-mode`, `filter`, `text-shadow`, `-webkit-text-stroke` or `opacity`.
- `blockerSelector` (a CSS effect in the way): a selector for the element that has it, which may be an ancestor of the text.
- `backgroundFillType` (a background image or gradient): `image`, `gradient`, `imageAndGradient`, or `unknown`.
- `background`, `backgroundAlpha` (a background that never becomes opaque, or a color that does not parse): the background color as far as it could be worked out, as an `rgba()` string, and its opacity from 0 to 1.
- `eligibleTextCount` (the pass): how many text nodes were checked.
- `assumptionsCount`, `assumptionsApplied` (the pass): how many text nodes needed an assumption to get a background, and which ones were made. Each item is a code; `ROOT_CANVAS_FALLBACK` means a page background that never becomes opaque was taken to sit on the configured canvas color, white by default.
- `generatedBy` (generated text that can't be measured): `::before`, `::after` or `::marker`, the pseudo-element whose text is asked about; the selector names its element. `GENERATED_TEXT_UNREADABLE` is content whose text can't be read (a counter in a style of the page's own), `GENERATED_TEXT_POSITIONED` a pseudo-element taken out of the flow with no opaque background of its own.
- `forcedColors` (every occurrence, when the colors measured were forced): `true`, and the hint says to check the page again with forced colors off. A scan under forced colors measures the page's own colors, so this is there only where it could not keep the page in them (docs/LAYOUT_MEASUREMENT.md, "Forced colors").

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `BACKGROUND_IMAGE_OR_GRADIENT` | cantTell | A background image or gradient lies behind the text, so the colour it sits on could not be worked out. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `BACKGROUND_OVERLAP` | cantTell | Another element paints under the text, so the background it sits on could not be worked out. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `BACKGROUND_NOT_COMPUTABLE` | cantTell | The background behind the text could not be worked out. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `BACKGROUND_NOT_OPAQUE_AT_ROOT` | cantTell | No element behind the text, up to the root, has an opaque background, so the colour it sits on depends on where the page is shown. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `BACKGROUND_UNPARSABLE` | cantTell | A background colour behind the text does not parse. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `FOREGROUND_UNPARSABLE` | cantTell | The text colour does not parse. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `BACKGROUND_FILTER_OR_BACKDROP_FILTER` | cantTell | A filter or backdrop- filter changes the colours drawn, so the declared colours are not what is on screen. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `MIX_BLEND_MODE` | cantTell | A mix-blend-mode blends the text or its background with what is behind it, so the colours on screen could not be worked out. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `ANCESTOR_OPACITY` | cantTell | An ancestor with opacity below 1 fades the text and its background together, in a way that could not be resolved against what lies behind it. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `ELEMENT_OPACITY` | cantTell | The text's own element has opacity below 1 over a background of its own, which could not be resolved against what lies behind it. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `TEXT_SHADOW` | cantTell | A text-shadow may add contrast the colours alone do not show, so the ratio is for a person to measure. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `TEXT_STROKE` | cantTell | A -webkit-text-stroke draws the text in a colour of its own, so the ratio is for a person to measure. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `PSEUDO_ELEMENT_COLOR` | cantTell | A ::first-line or ::first-letter has a colour of its own, and which text it paints depends on line breaks. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `SELECT_OPTION_COLOR` | cantTell | An option of a drop-down select, other than the shown one, has colours of its own and is drawn only in the list the platform opens. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `GENERATED_TEXT_UNREADABLE` | cantTell | Text a ::before, ::after or ::marker generates could not be read, such as a counter in a style of the page's own. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `GENERATED_TEXT_POSITIONED` | cantTell | A ::before or ::after with text is taken out of the flow without an opaque background of its own, so what lies behind it is unknown. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |
| `ENGINE_EXCEPTION` | cantTell | The rule stopped on an internal error; the text is to be measured by hand. | WCAG 1.4.3 (not settled); WCAG 1.4.6 (not settled) |

### `contrast-enhanced`

**Text meets enhanced color contrast (AAA)**

automatic · WCAG 1.4.6 (AAA) · confidence high · default severity serious

Checks that visible text has a contrast ratio of at least 7:1 (normal) or 4.5:1 (large), when contrast is computable from CSS.

**Applies to.** Applies to the visible text contrast-computable applies to, see that rule for the eligibility gates, narrowed to text whose background and foreground are actually computable. Eligible text that is not computable leaves this rule notApplicable rather than cantTell: reporting that uncertainty belongs to contrast-computable, so the two never report the same text twice.

**Expectation.** Every computable text node reaches the ratio SC 1.4.6 requires for its size: 4.5:1 for large text, 7:1 for everything else. Text is large at 24px or more, or at 14pt (about 18.667px) or more when the computed font weight is 700 or higher. Text drawn by a -webkit-text-stroke or a text-shadow is left to contrast-computable, except where every colour it is drawn in, its fill among them unless the fill draws nothing (transparent, or the colour of its background), is below the ratio against a flat background: no reading of it can then meet the criterion, and it fails, measured by the best of those colours (`drawnBy`: `textStroke` or `textShadow`). Margin (`contrast-ratio`): of the text that reaches its ratio, the element closest to it, with the ratio unrounded against the one its size requires; `context.largeText` says which. Only text within 10% of its ratio counts as close, so text further above it gives no margin. `measuredCount` counts the elements whose contrast was computed. A field's placeholder below its ratio (`PLACEHOLDER_BELOW_THRESHOLD`) fails when the page chose its colours: the placeholder's color, opacity or background, or the field's background, differ from the browser's own, read in a blank frame. In the browser's own colours it meets the ratio (WCAG G148), and when that can't be told it is a `cantTell` occurrence.

**What a finding reports.**

- `metrics.ratio` (a FAIL): the text's contrast ratio, for example 4.5 for 4.5:1, unrounded, against `metrics.threshold` (7, or 4.5 for large text).
- `colors.foregroundHex`, `colors.backgroundHex` (a FAIL): the text and background colors the ratio was computed from, as hex (the text in the -webkit-text-fill-color it is painted in, `color` unless set). A semi-transparent text color is first blended onto the background.
- `selectField` (a drop-down select in the browser's own background): `backgroundHex`, its computed background, and `fieldHex`, the Field color Chromium paints it in. The text is measured against both and the lower ratio is reported.
- `colors.foregroundRgba`, `colors.backgroundRgba` (a FAIL): the same colors as `rgba()` strings.
- `typography.fontSizePx`, `typography.fontSizePt` (a FAIL): the font size as drawn (the computed size times CSS zoom, or for SVG text its viewBox and transform scale, and times what font-size-adjust scales the font by), in CSS pixels and in points.
- `typography.declaredFontSizePx`, `typography.sizeScaledBy` (a FAIL drawn at another size): the computed font-size, and what drew it otherwise (`zoom`, `svg`, `font-size-adjust`). Where that puts the text on the other side of the large-text line, the hint says so (`contrast_hint_drawnSize`).
- `typography.fontWeight`, `typography.fontWeightLabel`, `typography.isBold` (a FAIL): the computed font weight as a number, `bold` (700 or more) or `normal`, and whether it counts as bold.
- `typography.isLargeText` (a FAIL): whether the text counts as large, which sets the threshold.
- The ratio, threshold and typography fields above are a stable contract (API_STABILITY.md), unlike the rest of `data.details`.
- `assumptionsApplied`, `assumedRootCanvasColor` (a FAIL): `null` unless the page background never became opaque and was taken to sit on a canvas color. Then `assumptionsApplied` is `["ROOT_CANVAS_FALLBACK"]` and `assumedRootCanvasColor` is the color assumed.
- `generatedBy` (a FAIL on generated text): `::before`, `::after` or `::marker`, the pseudo-element whose text is measured; the selector names its element, and the colours and font are the pseudo-element's.
- `eligibleTextCount`, `computableTextCount` (the pass, and the notApplicable result when no text was computable): how many text nodes were in scope, and how many of those had colors that could be worked out. The pass repeats both under `metrics`.
- `forcedColors` (every occurrence, when the colors measured were forced): `true`, and the hint says to check the page again with forced colors off. A scan under forced colors measures the page's own colors, so this is there only where it could not keep the page in them (docs/LAYOUT_MEASUREMENT.md, "Forced colors").

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ALL_ABOVE_THRESHOLD` | pass | All the computable text reaches the enhanced ratio its size requires. | WCAG 1.4.6; G17; G18; ACT 09o5cg |
| `BELOW_THRESHOLD` | fail | Text below the enhanced ratio its size requires, including text drawn by an outline or a shadow every colour of which, its fill included when seen, is below it. | WCAG 1.4.6; G17; G18; ACT 09o5cg |
| `PLACEHOLDER_BELOW_THRESHOLD` | fail, cantTell | A field's placeholder below its ratio. It fails when the page chose its colours, and is asked about when that can't be told; in the browser's own colours it is not reported. | WCAG 1.4.6; G148 |
| `SYMBOLIC_CHARACTER_BELOW_THRESHOLD` | cantTell | A symbol that is not a letter or a digit, below the ratio; whether it is text the criterion covers is for a person. | WCAG 1.4.6 (not settled) |
| `BACKGROUND_NOT_COMPUTABLE` | cantTell | The background behind the text could not be worked out. | WCAG 1.4.6 (not settled) |
| `ENGINE_EXCEPTION` | cantTell | The rule stopped on an internal error; the text is to be measured by hand. | WCAG 1.4.6 (not settled) |
| `UNKNOWN` | fail | Text below its ratio whose finding lost its details; a safeguard, not expected in a normal scan. | WCAG 1.4.6 |

**Margin.** `contrast-ratio`, in a ratio: the value must reach the threshold, and the result's `margin` names the element that came closest while meeting it, if it is within 10% of the threshold.

### `contrast-minimum`

**Text meets minimum color contrast (AA)**

automatic · WCAG 1.4.3 (AA) · confidence high · default severity serious

Checks that visible text has a contrast ratio of at least 4.5:1 (normal) or 3:1 (large), when contrast is computable from CSS.

**Applies to.** Applies to the visible text contrast-computable applies to, see that rule for the eligibility gates, narrowed to text whose background and foreground are actually computable. Eligible text that is not computable leaves this rule notApplicable rather than cantTell: reporting that uncertainty belongs to contrast-computable, so the two never report the same text twice.

**Expectation.** Every computable text node reaches the ratio SC 1.4.3 requires for its size: 3:1 for large text, 4.5:1 for everything else. Text is large at 24px or more, or at 14pt (about 18.667px) or more when the computed font weight is 700 or higher. Text drawn by a -webkit-text-stroke or a text-shadow is left to contrast-computable, except where every colour it is drawn in, its fill among them unless the fill draws nothing (transparent, or the colour of its background), is below the ratio against a flat background: no reading of it can then meet the criterion, and it fails, measured by the best of those colours (`drawnBy`: `textStroke` or `textShadow`). Margin (`contrast-ratio`): of the text that reaches its ratio, the element closest to it, with the ratio unrounded against the one its size requires; `context.largeText` says which. Only text within 10% of its ratio counts as close, so text further above it gives no margin. `measuredCount` counts the elements whose contrast was computed. A field's placeholder below its ratio (`PLACEHOLDER_BELOW_THRESHOLD`) fails when the page chose its colours: the placeholder's color, opacity or background, or the field's background, differ from the browser's own, read in a blank frame. In the browser's own colours it meets the ratio (WCAG G148), and when that can't be told it is a `cantTell` occurrence.

**What a finding reports.**

- `metrics.ratio` (text below the threshold): the text's contrast ratio against its background (4.5 for 4.5:1), against `metrics.threshold`, the ratio its size requires.
- `colors.foregroundHex`, `colors.backgroundHex` (text below the threshold): the text color (the -webkit-text-fill-color it is painted in, `color` unless set) and the background color behind it, as hex, after any transparency is blended in. `colors.foregroundRgba` and `colors.backgroundRgba` give the same two colors in `rgba()` form.
- `selectField` (a drop-down select in the browser's own background): `backgroundHex`, its computed background, and `fieldHex`, the Field color Chromium paints it in. The text is measured against both and the lower ratio is reported.
- `typography.fontSizePx`, `typography.fontSizePt` (text below the threshold): the font size as drawn, in CSS pixels and in points: the computed size times CSS zoom, or for SVG text its viewBox and transform scale, and times what font-size-adjust scales the font by (its adjust value over the font's own aspect, read in a browser). This is the size the large-text threshold is judged on, as WCAG's "size when the content is delivered".
- `typography.declaredFontSizePx`, `typography.sizeScaledBy` (text below the threshold, drawn at another size): the computed font-size, and what drew it otherwise (`zoom`, `svg`, `font-size-adjust`). Where that puts the text on the other side of the large-text line, the hint says so (`contrast_hint_drawnSize`).
- `typography.fontWeight`, `typography.fontWeightLabel` (text below the threshold): the computed font weight as a number (400, 700) and as written.
- `typography.isBold`, `typography.isLargeText` (text below the threshold): whether the text counts as bold, and as large text, the size that only needs 3:1.
- The ratio, threshold and typography fields above are a stable contract (API_STABILITY.md), unlike the rest of `data.details`.
- `assumptionsApplied`, `assumedRootCanvasColor` (text below the threshold): `null` unless the `auditorAssist` contrast mode had to assume a page background because the page sets none that is opaque. Then `assumptionsApplied` is `['ROOT_CANVAS_FALLBACK']` and `assumedRootCanvasColor` is the color assumed (white by default).
- `generatedBy` (generated text below the threshold): `::before`, `::after` or `::marker`, the pseudo-element whose text is measured; the selector names its element, and the colours and font are the pseudo-element's.
- `eligibleTextCount`, `computableTextCount` (the summary when nothing fails): how many text nodes the rule looked at, and how many of them had colors it could compute. Repeated under `metrics` on a pass.
- `forcedColors` (every occurrence, when the colors measured were forced): `true`, and the hint says to check the page again with forced colors off. A scan under forced colors measures the page's own colors, so this is there only where it could not keep the page in them (docs/LAYOUT_MEASUREMENT.md, "Forced colors").

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ALL_ABOVE_THRESHOLD` | pass | All the computable text reaches the ratio its size requires. | WCAG 1.4.3; G18; G145; ACT afw4f7 |
| `BELOW_THRESHOLD` | fail | Text below the ratio its size requires, including text drawn by an outline or a shadow every colour of which, its fill included when seen, is below it. | WCAG 1.4.3; G18; G145; ACT afw4f7 |
| `PLACEHOLDER_BELOW_THRESHOLD` | fail, cantTell | A field's placeholder below its ratio. It fails when the page chose its colours, and is asked about when that can't be told; in the browser's own colours it is not reported. | WCAG 1.4.3; G148 |
| `SYMBOLIC_CHARACTER_BELOW_THRESHOLD` | cantTell | A symbol that is not a letter or a digit, below the ratio; whether it is text the criterion covers is for a person. | WCAG 1.4.3 (not settled) |
| `BACKGROUND_NOT_COMPUTABLE` | cantTell | The background behind the text could not be worked out. | WCAG 1.4.3 (not settled) |
| `ENGINE_EXCEPTION` | cantTell | The rule stopped on an internal error; the text is to be measured by hand. | WCAG 1.4.3 (not settled) |
| `UNKNOWN` | fail | Text below its ratio whose finding lost its details; a safeguard, not expected in a normal scan. | WCAG 1.4.3 |

**Margin.** `contrast-ratio`, in a ratio: the value must reach the threshold, and the result's `margin` names the element that came closest while meeting it, if it is within 10% of the threshold.

**Settings a variant can change.** See [`RULE_SETTINGS.md`](./RULE_SETTINGS.md).

| Setting | Default | Takes | What it changes | Basis |
|---|---|---|---|---|
| `boldLargeMinPx` | `null` | a number above 0, or `null` | The size, in CSS pixels, from which bold text counts as large and needs only largeTextRatio. null is WCAG's 14pt (about 18.67px). | WCAG 1.4.3, "large scale" text |
| `largeTextRatio` | `3` | a number above 0 | The contrast ratio large text needs. | WCAG 1.4.3: 3:1 (1.4.6: 4.5:1) |
| `normalTextRatio` | `4.5` | a number above 0 | The contrast ratio other text needs. | WCAG 1.4.3: 4.5:1 (1.4.6: 7:1) |
| `logoText` | `"fail"` | `"fail"`, `"ask"`, `"exempt"` | Text that looks like part of a logo (an id or class naming a logo, or the site's brand, on the text, up to two levels above it or on its link; or the banner's first link to the home page, holding an image or the site's name) below its ratio: fail, with a hint that logo text is exempt; ask (cantTell, LOGO_TEXT_BELOW_THRESHOLD); or exempt (not reported). | WCAG 1.4.3 exception: "Text that is part of a logo or brand name has no contrast requirement" |
| `contrastSwitch` | `"fail"` | `"fail"`, `"ask"` | Text below its ratio on a page with a control that switches to higher contrast (its name holds "contrast", in any of five languages): fail, with a hint naming the switch; or ask (cantTell, CONTRAST_SWITCH_OFFERED). | WCAG technique G174, a control that switches to sufficient contrast |
| `semiBold` | `"normal"` | `"normal"`, `"ask"` | Text of weight 600 to 699, between the bold large-text size and 24px, that reaches largeTextRatio but not normalTextRatio: normal text, as for any weight under 700; or ask (cantTell, SEMIBOLD_BELOW_THRESHOLD) whether it reads as bold. | WCAG 1.4.3 "large scale" text: WCAG says bold without a number |

### `control-name-title-only`

**A button or link should not take its name only from its title**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Flags a button or link whose only accessible name is its title attribute, shown only on mouse hover, for manual review.

**Applies to.** Buttons and links in the accessibility tree with a non-empty `title` attribute: `<a href>`, `<area href>`, `<button>`, `<input>` of type `button`, `submit`, `reset` or `image`, and elements whose role attribute, or ElementInternals, give them the button or link role.

**Expectation.**

Accessible Name Computation takes a title as the name only when nothing else names the element: author naming (`aria-labelledby`, `aria-label`), an image button's `alt`, an input button's `value`, or, for buttons and links, their content.

- Something other than the title names the control: pass. The title is its description, a tooltip.
- The title is its only name: cantTell (`NAME_FROM_TITLE_ONLY`).

The name is valid, so 4.1.2 is met, but a title is shown only on mouse hover: not on touch screens, not when the control takes focus from the keyboard, and not as text a person using speech input can read and say. Check whether the control can be given visible text, or an `aria-label` when it shows only an icon, with the title kept as a tooltip if wanted.

**What a finding reports.**

- `role`: the control's role, `button` or `link`.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `NAME_FROM_TITLE_ONLY` | cantTell | The button or link takes its only name from its title, which is shown only on mouse hover. | accname 1.2 (best practice) |

### `css-focus-indicator-suppressed`

**Focus indicator must not be removed without a replacement**

manual · WCAG 2.4.7 (AA) · confidence medium · default severity serious

Flags elements in the tab order whose focus outline is removed, by a :focus/:focus-visible rule or by a rule with no state such as a { outline: none }, with no replacement indicator (border, box-shadow, background, ...) in any focus rule matching them.

**Applies to.** Elements in sequential focus navigation (tabbable and rendered) on a page whose accessible stylesheets contain at least one rule that removes the outline. With no such rule anywhere, every element keeps the user agent's own indicator and there is nothing to check.

**Expectation.** No element is matched by a rule that removes the outline (`outline: none`, `outline: 0`, `outline-color: transparent`, ...) unless some focus rule matching it draws a replacement: a border, box-shadow, background, color change, a positive outline of its own, or a `::before`/`::after` decoration. The removing rule is either a `:focus`/`:focus-visible` rule, or a rule with no state at all (`a { outline: none }`, `* { outline: 0 }`): an author declaration outranks the user agent's focus outline whatever its specificity, so it removes the indicator in the focused state too (WCAG F78).

**What a finding reports.**

- `suppressingSelectors`: the selector of each style sheet rule that removes the element's outline, one item per selector.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `FOCUS_INDICATOR_SUPPRESSED` | cantTell | A style sheet rule removes the element's focus outline and no focus rule draws a replacement; whether the page shows focus another way is for a person to check. | WCAG 2.4.7 (not settled); F78; ACT oj04fd |

### `css-hidden-focus`

**Focusable elements must not be visually hidden**

manual · WCAG 2.4.7 (AA) · confidence low · default severity serious

Checks that keyboard-focusable elements are not visually hidden by CSS techniques that can leave them in the tab order.

**Applies to.** Applies to elements that are tabbable (keyboard-focusable) but are visually hidden via CSS techniques that can leave them in the tab order.

**Expectation.** No element should be tabbable while visually hidden (e.g., opacity:0, clipped, off-screen). An element that CSS brings back into view when it takes focus is not hidden while focused, and is not flagged: the usual skip-link pattern (`.skip { position: absolute; left: -9999px } .skip:focus { left: 0 }`), or a hiding rule that stops applying on focus (`.visually-hidden-focusable:not(:focus) { clip: rect(0 0 0 0) }`). A focus rule nested in another (`.skip { &:focus { top: 0 } }`) counts as written out; one whose focus is inside `:has()` counts, for its subject, as `:focus-within` does. A focus rule that isn't `!important` doesn't override an `!important` declaration that hides the element.

**What a finding reports.**

- `metrics.visibilityHints`: how the element is hidden while it can take focus: `opacityZero`, `offscreen`, `clipped` or `zeroSizeOverflowHidden` (no size, with overflow hidden) by its own styles; when they show it, `outOfReach` (a container is positioned off screen, or, in a browser, the box focus would show lies where no scrolling reaches) or `containerClipped` (a container is clipped to nothing, has no size with overflow hidden, or is scaled to nothing, or, in a browser, the element lies wholly outside a container with `overflow: clip`, which focus doesn't scroll).
- `runtimeProbe`: `null` unless focusing the element moved focus straight to another element (`cssHiddenTabbable_runtimeRedirect_needsReview`). Then it holds `redirected: true` and the tag and id of the element focus moved to (`redirectedToTag`, `redirectedToId`). Only the first three hidden elements are tried this way.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `cssHiddenTabbable_needsFocusStateVerification` | cantTell | An element in the tab order is hidden by CSS and no focus rule brings it into view, so a keyboard user may not see where focus is. | WCAG 2.4.7 (not settled) |
| `cssHiddenTabbable_runtimeRedirect_needsReview` | cantTell | An element in the tab order is hidden by CSS, but focusing it moved focus straight to another element, as a focus trap's sentinel does; whether focus can stay on it is for a person to check. | WCAG 2.4.7 (not settled) |

### `css-orientation-lock`

**CSS must not lock the page to a single orientation**

automatic · WCAG 1.3.4 (AA) · confidence high · default severity serious

Checks that no @media (orientation: portrait|landscape) rule sets a transform: rotate(...) on the page, a known technique for defeating device orientation, and asks about any such rule that hides the page's main content.

**Applies to.** Any accessible (same-document, non-cross-origin) stylesheet, inline `<style>` blocks and same-origin `<link>` stylesheets already loaded into `document.styleSheets`, sheets adopted by the document, and those of each open shadow root, whose rules are matched against that root's elements.

**Expectation.** No `@media (orientation: portrait)` or `@media (orientation: landscape)` block sets a `transform`/`-webkit-transform`/`rotate` rotation of approximately 90 degrees (mod 180, i.e. ~90 or ~270), the well-known technique for visually forcing one orientation regardless of the device's actual orientation, which defeats WCAG 1.3.4's requirement that content not restrict its view to a single display orientation unless that orientation is essential. Such a rotation is judged on the visible elements its selector matches (ACT b33eff), visibility judged without the rotation itself: it fails where one of them holds the page's content (as defined below for hidden content), and any other element turned that way is asked about (cantTell): an arrow pointing to a panel beside it in one orientation and below it in the other locks nothing. A rule that turns no visible element, or only a pseudo-element, has nothing to judge. A second shape is asked about (cantTell): an orientation media block that hides the page's content with `display: none` or `visibility: hidden`, the usual form of WCAG F100 (content replaced by a "rotate your device" message in one orientation). The hidden element counts as the page's content when it is `html` or `body`, the `main` landmark, an ancestor of it, or, on a page without a main landmark, an element holding at least half of the body's text. Where the page has no &lt;main&gt; and no role="main", a custom element whose ElementInternals give it the main role (this.attachInternals().role) is the main landmark. Whether the orientation is essential, and whether the page stays usable, is left to a person.

**What a finding reports.**

- `mediaText` (a rotation or hidden content): the media query that holds the rule, such as `(orientation: portrait)`. A rotation of an element that doesn't hold the page's content is reported against that element (ORIENTATION_MEDIA_ROTATES_ELEMENT).
- `selectorText` (a rotation or hidden content): the selector of the style rule that rotates or hides. Empty when it could not be read.
- `unreadableSheetCount` (`STYLESHEETS_NOT_READABLE`): how many style sheets could not be read, usually because they come from another origin.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ORIENTATION_MEDIA_ROTATE_TRANSFORM` | fail | An orientation media query rotates an element holding the page's content by about 90 degrees, locking the page to one orientation. | WCAG 1.3.4; ACT b33eff; CSS Media Queries orientation |
| `ORIENTATION_MEDIA_ROTATES_ELEMENT` | cantTell | An orientation media query rotates by about 90 degrees an element that does not hold the page's content; whether that restricts the view is for a person to judge. | WCAG 1.3.4 (not settled); ACT b33eff |
| `ORIENTATION_MEDIA_HIDES_CONTENT` | cantTell | An orientation media query hides the page's content; whether the page stays usable in that orientation, or one orientation is essential, is for a person to judge. | WCAG 1.3.4 (not settled); F100 |
| `STYLESHEETS_NOT_READABLE` | cantTell | Some style sheets could not be read, so whether they lock the orientation could not be told. | WCAG 1.3.4 (not settled) |

### `definition-list-children-valid`

**Description lists must be structured correctly**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;dl&gt; elements only directly contain &lt;dt&gt;/&lt;dd&gt; groups (optionally wrapped in one &lt;div&gt;), &lt;script&gt;, &lt;template&gt;, or &lt;style&gt;.

**Applies to.** Applies to &lt;dl&gt; elements that have at least one direct element child or non-whitespace text directly inside them.

**Expectation.** Every direct element child is &lt;dt&gt;, &lt;dd&gt;, &lt;script&gt;, &lt;template&gt;, &lt;style&gt;, or a &lt;div&gt; whose own children are drawn from that same set (a single level of wrapping div is allowed, matching how authors commonly group dt/dd pairs). Non-whitespace text directly inside the &lt;dl&gt; or a wrapping &lt;div&gt; is an invalid child too. If the flattened set contains any &lt;dt&gt; or &lt;dd&gt; at all, it must contain BOTH (an unbalanced dt-without-dd or dd-without-dt is invalid), and read in order it must be groups of one or more &lt;dt&gt; followed by one or more &lt;dd&gt;: a &lt;dd&gt; before the first &lt;dt&gt; has no term, and a &lt;dt&gt; after the last &lt;dd&gt; has no definition. A flattened set with neither (an empty list, or one holding only &lt;script&gt;, &lt;template&gt; or &lt;style&gt;) is not a violation: the pairing is required only of a list that has items. Any other direct or wrapped child breaks the description-list semantics assistive technologies rely on.

**What a finding reports.**

- `invalidChildren`: the children that do not belong in the list, one tag name per child (`#text` for text placed directly inside). Empty when the problem is a missing or misordered `<dt>`/`<dd>`.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `DL_INVALID_CHILD` | fail | The list holds an element, or text, that is not a dt/dd group, a single wrapping div, script, template or style. | WCAG 1.3.1; H40; HTML dl element content model (MUST) |
| `DL_NO_DT_DD` | fail | The list has terms with no definition, or definitions with no term. | WCAG 1.3.1; H40; HTML dl element content model (MUST) |
| `DL_DT_DD_ORDER` | fail | A definition comes before the first term, or the last term has no definition after it. | WCAG 1.3.1; H40; HTML dl element content model (MUST) |

### `deprecated-elements-not-used`

**Scrolling &lt;marquee&gt; content must be possible to pause, stop, or hide**

automatic · WCAG 2.2.2 (A) · confidence high · default severity serious

Asks, for each obsolete &lt;marquee&gt; element, whether the page offers a way to pause, stop, or hide its auto-scrolling content, since the element itself has none.

**Applies to.** Applies to any scan scope; whether it contains a &lt;marquee&gt; element is always an answerable question. &lt;marquee&gt; is an obsolete, non-standard HTML element that browsers still render as auto-scrolling text, with no built-in user mechanism to pause, stop, or hide it.

**Expectation.** Each &lt;marquee&gt; is reported as cantTell: the scrolling itself is certain, but a page can offer its own pause or stop control (a button calling the element's stop() method, for example), and then failure F16 does not apply. Whether such a control exists is for a person to check. A scope with no &lt;marquee&gt; passes; there is no separate not-applicable case.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `MARQUEE_PAUSE_MECHANISM_UNKNOWN` | cantTell | A &lt;marquee&gt; scrolls its content, and whether the page offers a control to pause, stop or hide it is for a person to check. | WCAG 2.2.2 (not settled); F16 |

### `dialog-name-present`

**Dialogs have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that dialogs (elements with role="dialog" or role="alertdialog", and native &lt;dialog&gt; elements) expose a non-empty accessible name.

**Applies to.** Applies to elements included in the accessibility tree whose role is dialog or alertdialog: an element whose role attribute resolves to one of those roles (the first token that names a concrete ARIA role wins, so role="alertdialog dialog" is an alertdialog), and a native &lt;dialog&gt; whose role attribute is absent or names no concrete role (its implicit role is dialog). A closed &lt;dialog&gt; is hidden and so not in scope. A custom element whose ElementInternals give it one of those roles (this.attachInternals().role), with no role attribute naming another, counts as a native element with that role does.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. Both roles are name-from-author-only, so the heading or body text inside the dialog is not accepted as its name unless aria-labelledby points at it.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The dialog or alertdialog has no accessible name from aria-label, aria-labelledby or title. | WCAG 4.1.2; accname 1.2; WAI-ARIA 1.2 dialog role (MUST); WAI-ARIA 1.2 alertdialog role |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `dlitem-parent-valid`

**Description-list items must be inside a description list**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;dt&gt;/&lt;dd&gt; elements are contained by a &lt;dl&gt;, directly or via one wrapping &lt;div&gt;.

**Applies to.** Applies to &lt;dt&gt;/&lt;dd&gt; elements that have a parent element in the flat tree, as the page renders it: a &lt;dt&gt;/&lt;dd&gt; slotted into a shadow &lt;dl&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/dl&gt; is in that list, and a &lt;slot&gt; in between is seen through. A &lt;dt&gt;/&lt;dd&gt; a shadow host doesn't slot is not rendered and is left out.

**Expectation.** The parent is &lt;dl&gt;, or the parent is a &lt;div&gt; whose own parent is &lt;dl&gt; (a single level of wrapping div is allowed, matching how authors commonly group dt/dd pairs). A &lt;dt&gt;/&lt;dd&gt; used outside a real description-list container is not exposed as a term/definition to assistive technologies.

**What a finding reports.**

- `parentElement`: the tag name of the element's parent, the container it is in instead of a `<dl>`.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `DLITEM_INVALID_PARENT` | fail | A dt or dd is not inside a dl, either directly or through one wrapping div. | WCAG 1.3.1; H40; HTML dt and dd elements contexts (MUST) |

### `duplicate-id`

**IDs must be unique**

automatic · WCAG 4.1.1 (A) · confidence high · default severity moderate

Checks that every non-empty id attribute value is unique within its own document or shadow tree (WCAG 2.0/2.1 SC 4.1.1, removed in WCAG 2.2).

**Applies to.** Applies to any element carrying a non-empty id attribute. Visibility is irrelevant. A duplicate id breaks the same lookups whether the element renders or not, which is why ACT 3ea0c8 evaluates hidden elements too.

**Expectation.** No other element in the same tree carries the same id value, compared exactly as written (id="a " and id="a" are different ids). Ids are scoped per document tree and per shadow tree, so the same id inside two different shadow roots is not a duplicate.

**What a finding reports.**

- `reasonCode`: `DUPLICATE_ID_IN_SHADOW_TREE` when the elements are in one shadow tree, which script builds and the page's served markup does not hold; `DUPLICATE_ID` otherwise. Both fail the same way.
- `id`: the duplicated id.
- `count`: how many elements in the same tree carry it.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `DUPLICATE_ID` | fail, cantTell | Two or more elements in the same tree have the same id; it fails under WCAG 2.0 and 2.1, and is asked about under WCAG 2.2, which removed 4.1.1. | WCAG 4.1.1; WCAG 2.1 F77; ACT 3ea0c8; HTML id attribute (MUST) |
| `DUPLICATE_ID_IN_SHADOW_TREE` | fail, cantTell | Two or more elements in one shadow tree have the same id; it is graded as DUPLICATE_ID is. | WCAG 4.1.1; WCAG 2.1 F77; ACT 3ea0c8; HTML id attribute (MUST) |

### `duplicate-id-aria`

**IDs referenced by ARIA must be unique**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that any id value referenced by an ARIA ID-reference attribute (aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-activedescendant, aria-flowto, aria-errormessage, aria-details) is unique in the document.

**Applies to.** Applies when the document contains at least one non-empty aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-activedescendant, aria-flowto, aria-errormessage, or aria-details attribute (i.e. at least one ARIA ID reference exists to resolve).

**Expectation.** For every id value referenced by one of those attributes, exactly one element in the document carries that id. A duplicate does not break the reference: it resolves to the first element in tree order, so the name is still computed. Whether that element is the intended target depends on author intent, which markup does not carry, so the outcome is cantTell.

**What a finding reports.**

- `id`: the duplicated id an ARIA attribute refers to.
- `duplicateCount`: how many elements in the document carry that id.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `DUPLICATE_ID_ARIA_REFERENCED` | cantTell | An id that an ARIA attribute refers to is on more than one element, so the reference goes to the first, which may not be the one meant. | HTML id attribute (MUST); WAI-ARIA 1.2 ID reference; WCAG 4.1.2 (not settled) |

### `embed-text-alternative-present`

**&lt;embed&gt; must provide a text alternative**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that &lt;embed&gt; elements provide a text alternative via an accessible name.

**Applies to.** Applies to &lt;embed&gt; elements that are exposed to assistive technologies. Elements otherwise hidden from the accessibility tree remain applicable if they are tabbable or referenced by IDREF relationships (per engine eligibility checks). role="presentation"/role="none" are excluded only when not focusable.

**Expectation.**

Each applicable &lt;embed&gt; provides a text alternative via:

- an accessible name (aria-labelledby/aria-label), OR
- a title attribute (best-effort fallback).

Note: &lt;embed&gt; does not support fallback content in HTML, so this rule does not check children.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_ALTERNATIVE_MISSING` | fail | An &lt;embed&gt; has no name from aria-label, aria-labelledby or title. | WCAG 1.1.1; accname 1.2 |

### `embed-text-alternative-quality`

**&lt;embed&gt; text alternative must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;embed&gt; elements with a detected name for human review of appropriateness.

**Applies to.** Applies to &lt;embed&gt; elements that already carry a text alternative: a non-empty aria-label, an aria-labelledby that resolves to non-empty text, or a non-empty title. An aria-labelledby pointing at a missing id resolves to nothing and so is not a text alternative to review; that element is embed-text-alternative-present's failure. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

**What a finding reports.**

- `reasonCode`: `TEXT_ALTERNATIVE_REVIEW`.
- `ariaLabel`, `title`: the element's `aria-label` and `title`, or null when it has none.
- `ariaLabelledBy`: the ids in the element's `aria-labelledby`, or null when it has none.
- `ariaLabelledByText`: the text those ids point at, or null. Only looked up when the element has no `aria-label`, since `aria-label` then gives the name.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_ALTERNATIVE_REVIEW` | cantTell | An &lt;embed&gt; has a text alternative, and a person checks that it describes the embedded content. | WCAG 1.1.1 (not settled) |

### `empty-heading`

**Headings must not be empty**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks that heading elements (&lt;h1&gt;-&lt;h6&gt; or role="heading") have a non-empty accessible name.

**Applies to.** Applies to elements with a heading role: native &lt;h1&gt;-&lt;h6&gt;, or any element whose role attribute resolves to heading (the first token naming a known role, matched case-insensitively, so role="foo heading" counts). A native heading keeps its role when no token is a known role, and loses it to any other resolved role. A native &lt;hx&gt; marked role="none" or "presentation" is still a heading when it can take focus or carries a global ARIA attribute, as WAI-ARIA's presentational roles conflict resolution has browsers ignore that role then. A custom element whose ElementInternals give it the heading role (this.attachInternals().role), with no role attribute naming another, counts as a native element with that role does.

**Expectation.** The heading has a non-empty accessible name: aria-label, aria-labelledby, visible text content not hidden from assistive technology, or (as a last resort) a title attribute. An empty heading is announced as "heading, level N" with nothing else, which is confusing when navigating by heading. Reported at FAIL although no WCAG criterion is claimed: an empty heading is itself the barrier, as the ACT rule ffd0e9 treats it. A heading whose name may come from content no script can read (a closed shadow root, content nested too deep, a custom element naming itself through ElementInternals) is asked about instead, as the *-name-present rules do.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `HEADING_EMPTY` | fail | A heading exposed to assistive technology has no accessible name. | ACT ffd0e9; WAI-ARIA 1.2 heading role (best practice) |
| `name_closedContent` | cantTell | The heading may take its name from content in a closed shadow root, which no script can read. | accname 1.2 (not settled); ACT ffd0e9 (not settled) |
| `name_contentTooDeep` | cantTell | The heading's content is nested too deeply to work out a name from it. | accname 1.2 (not settled); ACT ffd0e9 (not settled) |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | accname 1.2 (not settled) |

### `empty-table-header`

**Table header cells must not be empty**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that table header cells (&lt;th&gt;, or any element with role="columnheader"/"rowheader") have visible text content. A header named only via aria-label/aria-labelledby is also flagged, since real screen-reader/browser support for that is inconsistent.

**Applies to.** Applies to &lt;th&gt; elements that don't carry a conflicting explicit role, plus any element (native &lt;th&gt; or not) whose role resolves to columnheader or rowheader. The role attribute is a fallback list: its first known, non-abstract token, in any case, is the role, so role="foo columnheader" counts, and a &lt;th role="foo"&gt; (no known token) keeps its implicit header role. A &lt;th&gt; that explicitly restates role="columnheader"/"rowheader" is still covered, but a &lt;th role="presentation"&gt; (no longer meaningfully a header) is correctly excluded, and an ARIA-role-only header (e.g. a &lt;div role="columnheader"&gt; in a role="grid"/role="table" widget) is caught too. A custom element whose ElementInternals give it the columnheader or rowheader role (this.attachInternals().role), with no role attribute naming another, counts as a native element with that role does.

**Expectation.** The header cell has visible text content. A &lt;th&gt; named only via aria-label/aria-labelledby (no visible text) is ALSO flagged, not treated as equivalent: aria-label support on &lt;th&gt; is inconsistent in practice. NVDA+Firefox and iOS VoiceOver+Safari ignore it entirely (only visible text is announced), JAWS+Chrome/IE11 also only announce visible text in the header cell itself. Visible text is the one mechanism confirmed to work across every tested combination. See https://html5accessibility.com/stuff/2024/05/22/not-so-short-note-on-aria-label-usage-big-table-edition/.

**What a finding reports.**

- `ariaName` (`TABLE_HEADER_NAME_NOT_VISIBLE_TEXT`): the name the header cell gets from `aria-label` or `aria-labelledby` instead of visible text.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TABLE_HEADER_EMPTY` | cantTell | A header cell has no visible text and no name from aria-label or aria-labelledby. | HTML table model th element (best practice); WAI-ARIA 1.2 columnheader role (best practice) |
| `TABLE_HEADER_NAME_NOT_VISIBLE_TEXT` | cantTell | A header cell has no visible text and is named only by aria-label or aria-labelledby, which some screen readers do not read on header cells. | accname 1.2 (best practice) |

### `focus-not-removed-by-script`

**A script does not remove focus from an element as it receives it**

manual · WCAG 2.1.1, 2.4.7 (A, AA) · confidence low · default severity serious

Asks about elements whose inline onfocus handler calls blur(), or focus() on another element, which can remove focus as soon as the element receives it (WCAG failure F55).

**Applies to.** Elements that can take focus, that the page renders, and whose inline `onfocus` handler calls `blur()`, or `focus()` on another element. Without such an element, or in a document where none can take focus, nothing is applicable.

**Expectation.**

WCAG failure F55: a script that removes focus from an element when it receives it leaves a keyboard user unable to reach or operate it, and unable to see where focus is. Each element is asked about (cantTell):

- `FOCUS_HANDLER_BLURS_SELF` when the handler does only that (`this.blur()`, `blur()`, or `blur()` on `event.target` or `event.currentTarget`, by name or in brackets, possibly behind `if (this.blur)`, with at most a `return`), as F55's examples do;
- `FOCUS_HANDLER_CALLS_BLUR` when it calls `blur()` among other code, or on another element, where whether focus is lost depends on the script;
- `FOCUS_HANDLER_MOVES_FOCUS` when it calls `focus()` on another element (`document.body.focus()`), which takes focus away as it arrives, as F55's test checks.

It never fails: it reads the handler's text, not what the page does, and a person can confirm it by tabbing to the element.

**What a finding reports.**

- `reasonCode`: `FOCUS_HANDLER_BLURS_SELF`, `FOCUS_HANDLER_CALLS_BLUR` or `FOCUS_HANDLER_MOVES_FOCUS`.
- `handler`: the onfocus attribute's value, whitespace collapsed, up to 120 characters; a longer one is cut and ends in `…`.
- `tabbable`: whether the element is in the tab order. One that is not can still receive focus from a click or a script.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `FOCUS_HANDLER_BLURS_SELF` | cantTell | The element's onfocus handler does nothing but call blur() on it, so focus is removed as it arrives. | WCAG 2.1.1; WCAG 2.4.7; F55 |
| `FOCUS_HANDLER_CALLS_BLUR` | cantTell | The element's onfocus handler calls blur() among other code or on another element; whether focus is lost depends on the script. | WCAG 2.1.1 (not settled); WCAG 2.4.7 (not settled); F55 |
| `FOCUS_HANDLER_MOVES_FOCUS` | cantTell | The element's onfocus handler calls focus() on another element, so focus may move away as it arrives. | WCAG 2.1.1 (not settled); WCAG 2.4.7 (not settled); F55 |

### `focus-order-semantics`

**Elements added to the tab order should have interactive semantics**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Flags elements with tabindex &gt;= 0 whose explicit role is a non-interactive structural/document role (e.g. heading, list, note, presentation), for manual review.

**Applies to.** Elements with an explicit `tabindex` of `0` or greater (in the tab order) AND an explicit `role` attribute that resolves to one of a curated set of clearly non-interactive, structural/document roles. The attribute is a fallback list: its first known, non-abstract token, in any case, is the role (role="foo HEADING" is a heading, role="foo" is no role).

**Expectation.** An element placed in the tab order on purpose should communicate why it's focusable: a role like `heading`, `list`, `note`, or `presentation` gives assistive technology no interactive semantic to announce, which is confusing for keyboard users who land on it and get no indication of what activating it (if anything) would do.

**What a finding reports.**

- `tabindex`: the element's `tabindex`, as a number (0 or greater).
- `role`: the non-interactive role the element carries.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TABBABLE_WITH_NON_INTERACTIVE_ROLE` | cantTell | The element is in the tab order but carries a non-interactive role, so a keyboard user who reaches it is not told what it does. | WCAG 2.4.3 (best practice); WCAG 4.1.2 (best practice) |

### `form-control-label-quality`

**Form field labels should be descriptive and distinguishable**

manual · WCAG 2.4.6 (AA) · confidence medium · default severity minor

Flags a visible form-field label that is a placeholder ("Label", "Field"), or that repeats another field's label with no visible context (heading, legend, or row) telling the two apart. English placeholders are always recognized, and German, Spanish, French or Japanese ones when the field is in that language.

**Applies to.** Visible form fields: native `input` (excluding hidden and the button-like types), `select`, `textarea`, or an element with one of the ARIA widget roles ACT cc0f0a lists (checkbox, combobox, listbox, menuitemcheckbox, menuitemradio, radio, searchbox, slider, spinbutton, switch, textbox; the first real role token of the role attribute, in any case) that carry a visible programmatic label: a `<label>` association, or the elements `aria-labelledby` points at. A field named only by `aria-label`/`title` has no visible label to judge and is out of scope here (its labelling mechanism is `form-control-programmatic-label-quality`'s concern, its presence `form-control-programmatic-label-present`'s). A custom element whose ElementInternals give it one of those roles (this.attachInternals().role), with no role attribute naming another, counts as a native element with that role does.

**Expectation.** The visible label text (a) is not a placeholder left in the markup ("label", "field", "enter text", ...), (b) is not shared with another field that no visible context tells apart (the same "Name" twice, with nothing visible on screen saying which is shipping and which is billing), and (c) is the whole of the field's programmatic label, not the visible fragment of a label whose descriptive part is hidden.

**What a finding reports.**

- `label`: the visible label text of the field.
- `sharedWith`: how many other fields have the same label with nothing visible telling them apart, a count. 0 when no other field shares it.
- `hiddenLabelParts`: how many parts of the field's label are hidden from sight, a count. 0 when the whole label is visible.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `DUPLICATE_LABEL_TEXT` | cantTell | The field's visible label is the same as another field's, with no visible legend, heading or row text telling them apart. | WCAG 2.4.6 (not settled); G131; ACT cc0f0a |
| `PARTIALLY_HIDDEN_LABEL` | cantTell | Part of the field's programmatic label is hidden from sight, so the visible part may not identify the field on its own. | WCAG 2.4.6 (not settled); G131; ACT cc0f0a |
| `PLACEHOLDER_LABEL_TEXT` | cantTell | The field's visible label is generic placeholder text, such as "label" or "enter text", rather than a description of the field. | WCAG 2.4.6 (not settled); G131; ACT cc0f0a |

### `form-control-programmatic-label-present`

**Form controls must have a programmatic label**

automatic · WCAG 1.3.1, 3.3.2, 4.1.2 (A) · confidence medium · default severity serious

Checks that form controls have a programmatic label via &lt;label&gt;, aria-label, aria-labelledby, title, or placeholder.

**Applies to.** Applies to &lt;input&gt;, &lt;select&gt; and &lt;textarea&gt; elements included in the accessibility tree, excluding the input types hidden, submit, reset, button and image, which take their name from a value or alt attribute rather than from a label. A control whose role attribute resolves (first token naming a known role, case-insensitively) to an explicit ARIA widget role is out of scope, button, checkbox, combobox, listbox, textbox, slider and the rest of ROLE_OWNED_ELSEWHERE each have a naming rule of their own, and role="presentation"/"none" removes a control unless it is still tabbable.

**Expectation.** Each applicable control carries a programmatic label by one of the mechanisms helpers.getLabelMethod resolves, in its priority order: an associated &lt;label&gt;, aria-labelledby, aria-label, title, then placeholder. Any of the five satisfies this rule. Whether the weaker two are an appropriate primary label is a separate question, asked by form-control-programmatic-label-quality.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `missing_programmatic_label` | fail | The form field has no programmatic label from a label element, aria-labelledby, aria-label, title or placeholder; aria-placeholder alone does not count. | WCAG 4.1.2; WCAG 1.3.1; WCAG 3.3.2; H44; F68; accname 1.2; HTML-AAM 4.1.1; ACT e086e5 |

### `form-control-programmatic-label-quality`

**Form controls should have a label shown on screen**

manual · WCAG 3.3.2 (A) · confidence medium · default severity moderate

Flags form controls whose accessible name comes from placeholder, title, aria-label, or aria-labelledby pointing only at hidden text, none of which is a label shown on screen. Prefer a visible &lt;label&gt;, or aria-labelledby pointing at visible text.

**Applies to.**

Applies to labelable native form controls exposed to assistive technologies:

- input (excluding type=hidden|submit|reset|button|image)
- select
- textarea

role="presentation"/"none" are excluded only when not focusable. A control not drawn on screen is excluded: transparent (opacity 0, its own or an ancestor's) or clipped away (as visually hidden text is), as a checkbox hidden behind a styled toggle is. It has no visible label to judge; its visible stand-in does. Only controls that have a programmatic name count: a control with none is form-control-programmatic-label-present's finding, not a question about how good its name is.

**Expectation.**

If a control has a programmatic name, it should not come ONLY from:

- placeholder (non-empty)
- title (non-empty)
- aria-label
- aria-labelledby whose every referenced element is unrendered (hidden, display:none, visibility:hidden)

Prefer an associated &lt;label&gt; or aria-labelledby pointing at visible text.

**What a finding reports.**

- `labelMethod`: where the control's label comes from: `placeholder`, `title`, `aria-label` or `aria-labelledby`.
- `reasonCode`: `label_from_placeholder_primary`, `label_from_title_primary`, `label_from_aria_label_only` or `label_from_hidden_labelledby`.
- `sourceText`: the label text, up to 120 characters.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `label_from_aria_label_only` | cantTell | The field's name comes from aria-label, which is not shown on screen, so whether a visible label sits next to it needs checking. | WCAG 3.3.2 (not settled); H44 |
| `label_from_hidden_labelledby` | cantTell | The field's name comes from aria-labelledby pointing only at hidden elements, so no label it names is shown on screen. | WCAG 3.3.2 (not settled); H44 |
| `label_from_placeholder_primary` | cantTell | The field's only label is its placeholder, which disappears once someone types. | WCAG 3.3.2 (not settled); H44; HTML-AAM 4.1.1 |
| `label_from_title_primary` | cantTell | The field's only label is its title, which is shown only on mouse hover. | WCAG 3.3.2 (not settled); H44; HTML-AAM 4.1.1 |

### `form-control-single-label`

**Form controls must not have multiple labels**

automatic · WCAG 3.3.2 (A) · confidence high · default severity moderate

Checks that a form control is associated with at most one &lt;label&gt; (by wrapping or by label[for]).

**Applies to.** Applies to labelable form controls (input, excluding hidden/submit/reset/button/image; select; textarea).

**Expectation.**

At most one &lt;label&gt; that can contribute to the control's accessible name is associated with it, as HTML's labeled control defines: a &lt;label for="..."&gt; whose value is the id of the first element with that id in the label's own tree, or a wrapping &lt;label&gt; without `for` whose first labelable descendant is the control (a label that both wraps and self-references via for counts once). Graded by whether the surplus labels actually compete for the name:

- PASS when an override (aria-labelledby / aria-label) supersedes every native &lt;label&gt;: the labels then contribute nothing to the name, so they cannot be ambiguous. A visible-label-vs-name mismatch is SC 2.5.3 Label in Name's concern, not this rule's.
- CANTTELL when two or more non-empty labels compete and there is no override: browsers join their text, in DOM order, into one name, and only a person can tell whether that joined name still makes sense ("Address Mailing address") or reads as noise.
- CANTTELL when one non-empty label is joined by empty label association(s) and there is no override: the name usually resolves to the real label, but handling of the empty association is not guaranteed across user agents.

All-empty associations with no override are a missing-name case (the sibling rule form-control-programmatic-label-present), not an ambiguity, so this rule stays silent.

**What a finding reports.**

- `labelCount`: how many labels are associated with the control. On the competing-labels case, only the non-empty ones are counted; on the empty-label case, the empty ones are counted too.
- `contributingLabelCount` (the empty-label case): how many of those labels have text, and so give the control its name.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `FORM_FIELD_MULTIPLE_LABELS` | cantTell | Two or more labels with text name the field, and no aria-label or aria-labelledby overrides them; browsers join them into one name, which a person judges. | HTML-AAM 4.1.1; WCAG 3.3.2 (not settled); WCAG 4.1.2 |
| `FORM_FIELD_EXTRA_EMPTY_LABEL` | cantTell | One label with text and one or more empty label associations, with no override. | HTML-AAM 4.1.1; WCAG 3.3.2 (not settled) |

### `heading-order`

**Heading levels must not skip a level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that heading levels increase by at most one at a time in document order.

**Applies to.** Applies whenever the page contains two or more heading elements (native &lt;h1&gt;-&lt;h6&gt;, or explicit role="heading" with aria-level; default level 2 per the ARIA spec when aria-level is absent/invalid). A native &lt;hx&gt; with a valid aria-level (a positive integer) takes that level, as browsers expose it; otherwise it takes its tag level. A native &lt;hx&gt; marked role="none" or "presentation" is still a heading when it can take focus or carries a global ARIA attribute, as WAI-ARIA's presentational roles conflict resolution has browsers ignore that role then. A custom element whose ElementInternals give it the heading role (this.attachInternals().role) counts as role="heading" does, at the level its aria-level attribute or its internals' ariaLevel give.

**Expectation.** In the order assistive technology reads the page, each heading's level is no more than one greater than the level of the previous heading exposed to assistive technology. Jumping deeper by more than one level (e.g. an &lt;h1&gt; followed directly by an &lt;h3&gt;, skipping &lt;h2&gt;) breaks the document outline assistive technology users rely on when navigating by heading. Going back to a shallower level at any point is always fine.

**What a finding reports.**

- `fromLevel`: the level of the previous exposed heading (3 for an &lt;h3&gt;).
- `toLevel`: this heading's level, more than one deeper than `fromLevel`.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `HEADING_ORDER_SKIPPED_LEVEL` | cantTell | A heading is more than one level deeper than the previous heading exposed to assistive technology, skipping a level. | G141 (best practice); WAI-ARIA 1.2 heading role |

### `heading-quality`

**Heading text should be descriptive, not a placeholder**

manual · WCAG 2.4.6 (AA) · confidence medium · default severity minor

Flags headings whose accessible name is a placeholder rather than a description of the content that follows: a generic word ("Heading", "Untitled"), a numbered template slot ("Section 2"), a filename, or a URL. English phrases are always recognized, and German, Spanish, French or Japanese ones when the heading is in that language.

**Applies to.** Elements with a heading role (native &lt;h1&gt;-&lt;h6&gt;, or any element whose role attribute resolves to heading: the first token naming a known role, matched case-insensitively) that are included in the accessibility tree and have a non-empty accessible name. A heading with no name at all is `empty-heading`'s concern, not this rule's. A custom element whose ElementInternals give it the heading role (this.attachInternals().role), with no role attribute naming another, counts as a native element with that role does.

**Expectation.** The heading's accessible name, normalized (whitespace-collapsed, case-folded, trailing punctuation stripped), is not a placeholder left in the markup: a known generic word ("heading", "title", "untitled", "lorem ipsum", ...), a numbered template slot ("Heading 2", "Section 3"), a filename, or a URL. None of these describe the topic or purpose of the content they introduce.

**What a finding reports.**

- `name`: the heading's accessible name, with whitespace collapsed.
- `normalizedName`: the same name as it was matched: lower case, with trailing punctuation removed.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `PLACEHOLDER_HEADING_TEXT` | cantTell | The heading's name is a placeholder such as "heading", "lorem ipsum" or "Section 3" rather than a description of the content it introduces. | WCAG 2.4.6 (not settled); G130; ACT b49b2e (not settled) |
| `FILENAME_LIKE_HEADING` | cantTell | The heading's name is a file name rather than a description of the content it introduces. | WCAG 2.4.6 (not settled); G130; ACT b49b2e (not settled) |
| `URL_LIKE_HEADING` | cantTell | The heading's name is a web address rather than a description of the content it introduces. | WCAG 2.4.6 (not settled); G130; ACT b49b2e (not settled) |

### `html-lang-attr-present`

**Page language is declared**

automatic · WCAG 3.1.1 (A) · confidence high · default severity serious

Checks that the default language of the page is programmatically declared.

**Applies to.** Applies to HTML documents with a root &lt;html&gt; element. The rule evaluates the document element only and does not iterate over child nodes. Non-HTML documents or documents without a document element are not applicable.

**Expectation.** The &lt;html&gt; element has a lang attribute. The lang attribute is not empty and its primary language subtag (the part before the first hyphen) is a registered language subtag, as ACT bf051a requires. A malformed later subtag (lang="fr-FR-!!") still identifies French, so it passes here; it is a markup validity error, not a missing language.

**What a finding reports.**

- `lang` (a language that is not valid): the `lang` attribute's value, as written.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `lang-missing` | fail | The &lt;html&gt; element has no lang attribute, so the page's language is not declared. | WCAG 3.1.1; ACT b5c3f8; H57; HTML lang attribute |
| `lang-empty` | fail | The &lt;html&gt; element's lang attribute is empty or only whitespace, so it declares no language. | WCAG 3.1.1; ACT b5c3f8; H57; HTML lang attribute |
| `lang-invalid-bcp47` | fail | The primary subtag of the &lt;html&gt; element's lang attribute is not a registered language subtag. | WCAG 3.1.1; ACT bf051a; H57; HTML lang attribute (MUST); BCP 47 |

### `html-xml-lang-mismatch`

**lang and xml:lang must not disagree**

automatic · WCAG 3.1.1 (A) · confidence high · default severity serious

Checks that the &lt;html&gt; element's lang and xml:lang attributes declare the same primary language, when both are present.

**Applies to.** Applies when the &lt;html&gt; element has both a non-empty lang attribute whose primary language subtag is a known one (ACT 5b7ae0) and a non-empty xml:lang attribute that has a primary language subtag. A lang naming no known language is html-lang-attr-present's failure, not this rule's; an xml:lang with no primary subtag (a private-use "x-foo", or no tag at all) has no language to compare, as ACT's "if any exist" says.

**Expectation.** The primary language subtag (the part before the first "-") of lang and xml:lang match, case-insensitively. When both attributes are present but declare different languages, assistive technology and user agents may resolve the page's language inconsistently.

**What a finding reports.**

- `lang`, `xmlLang`: the values of the `lang` and `xml:lang` attributes, as written.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `HTML_XML_LANG_MISMATCH` | fail | The lang and xml:lang attributes on &lt;html&gt; declare different primary languages. | WCAG 3.1.1; ACT 5b7ae0; HTML lang attribute (MUST) |

### `identical-iframes-same-purpose`

**Frames with the same name embed the same resource**

automatic · WCAG 4.1.2 (A) · confidence medium · default severity moderate

Checks that &lt;iframe&gt;/&lt;frame&gt; elements sharing an accessible name embed the same resource, since one name can only describe one resource.

**Applies to.** Applies to each set of two or more &lt;iframe&gt;/&lt;frame&gt; elements that are included in the accessibility tree and share the same non-empty accessible name, compared with whitespace collapsed. A frame named only by a mechanism that names nothing, or hidden from the accessibility tree, is not part of a set; a set needs two surviving members to exist at all.

**Expectation.** Every frame in a set resolves to the same resource. A shared name describes one resource, so two frames answering to it must embed the same one.

**What a finding reports.**

- `name`: the accessible name the frames share.
- `resource`: the address this frame embeds, as an absolute URL without its fragment. Empty (`null`) when its `src` could not be resolved (`IFRAME_RESOURCE_UNRESOLVED`).
- `setSize`: how many frames share the name.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `IFRAME_RESOURCE_DIFFERS` | cantTell | Frames that share an accessible name embed different resources; a person judges whether they serve the same purpose. | WCAG 4.1.2 (not settled); ACT 4b1c6c (not settled) |
| `IFRAME_RESOURCE_UNRESOLVED` | cantTell | A frame shares its accessible name with other frames, but its src could not be resolved to compare what it embeds. | WCAG 4.1.2 (not settled); ACT 4b1c6c (not settled) |

### `identical-links-same-purpose`

**Links with the same accessible name should lead to the same destination**

manual · WCAG 2.4.9 (AAA) · confidence low · default severity minor

Flags groups of links that share the same accessible name but resolve to more than one distinct destination, for manual review of whether they serve the same purpose.

**Applies to.** Sets of two or more `a[href]` elements, or elements whose role attribute resolves to link (its first real role token, in any case), that share a non-empty accessible name (trimmed, whitespace-collapsed, case-folded), as in ACT b20e66. A link whose name no other link shares has nothing to be compared with. A custom element whose ElementInternals give it the link role (this.attachInternals().role), with no role attribute naming another, counts as a native element with that role does.

**Expectation.** Within a page, links that share the same accessible name are expected to serve the same purpose (i.e. resolve to the same destination, the full resolved URL, including any fragment). Same-text-different- destination links are common and frequently intentional in real sites (e.g. repeated "Read more" links per article card), so this is authored as `type: 'manual'` (cantTell-capped, never fail) rather than a hard fail, flagging a real name/destination mismatch for human judgment instead of guessing intent.

**What a finding reports.**

- `name`: the accessible name the links share, trimmed, with whitespace collapsed and in lower case.
- `href`: the full URL this link leads to.
- `distinctDestinationCount`: how many different URLs the links with this name lead to, a count of 2 or more.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `SAME_NAME_DIFFERENT_DESTINATION` | cantTell | Links that share an accessible name lead to two or more different URLs; a person judges whether they serve the same purpose. | WCAG 2.4.9 (not settled); ACT b20e66; ACT fd3a94 |

### `iframe-focusable-content`

**Frames with tabindex="-1" must not contain focusable content**

automatic · WCAG 2.1.1 (A) · confidence high · default severity moderate

Checks that same-origin &lt;iframe&gt;/&lt;frame&gt; elements with tabindex="-1" do not contain focusable content, which keyboard users cannot reach: the negative tabindex takes the frame’s whole content out of the tab order.

**Applies to.** Applies to &lt;iframe&gt;/&lt;frame&gt; elements with an explicit negative tabindex, whose embedded document is same-origin and reachable via contentDocument. A cross-origin or otherwise unreachable frame can't be looked into, so nothing is asserted about it.

**Expectation.** The frame's embedded document contains no element in its sequential focus navigation order. A negative tabindex on the &lt;iframe&gt; takes its whole browsing context out of the tab order: Tab skips everything inside, so a link or control there cannot be reached by keyboard (ACT akn7bn; in Chromium, Tab goes from the element before the frame to the one after it). An element is in the order by HTML's rules, read in the frame's own document: not when disabled (:disabled, which counts a disabled &lt;fieldset&gt; but not its first &lt;legend&gt;) or inert; a tabindex that parses as an integer decides, and an invalid one ("", "abc") is ignored; otherwise links with href, form controls but hidden inputs, frames, media with controls, an &lt;area&gt; of an image map an &lt;img&gt; uses (usemap matched exactly), the first &lt;summary&gt; of a &lt;details&gt; and editing hosts (contenteditable "", "true" or "plaintext-only") are. Exception: an iframe with both a `width` and `height` HTML attribute of 2px or less (a common "tracking pixel" pattern) cannot render any perceptible content, so focusable content inside it never satisfies ACT akn7bn's "visible" requirement and doesn't count.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `IFRAME_TABINDEX_NEGATIVE_CONTENT_FOCUSABLE` | fail | A frame with a negative tabindex holds content in the tab order, which Tab skips, so a keyboard user cannot reach it. | WCAG 2.1.1; ACT akn7bn; HTML sequential focus navigation |
| `IFRAME_TABINDEX_NEGATIVE_CONTENT_RUNTIME_REDIRECT` | cantTell | A frame with a negative tabindex holds one focusable element, but focus moved straight on from it, so keyboard access is checked in a real browser. | WCAG 2.1.1 (not settled); ACT akn7bn (not settled) |

### `iframe-name-present`

**Frames have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that &lt;iframe&gt;/&lt;frame&gt; elements expose a non-empty accessible name via aria-label, aria-labelledby, or the title attribute.

**Applies to.** Applies to &lt;iframe&gt;/&lt;frame&gt; elements that are eligible for the accessibility tree (isAccTreeEligible) AND reachable by sequential focus navigation, both conditions required, and that the author has not marked as decorative with role="none"/"presentation".

**Expectation.** The element has a non-empty accessible name via aria-labelledby, aria-label, or the title attribute. Unlike most interactive elements, an iframe's name is never derived from its rendered content (the embedded document is a separate browsing context), this mirrors dialog-name-present's "name-from-author-only" reasoning.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `IFRAME_NAME_MISSING` | fail | A focusable iframe or frame has no accessible name from aria-labelledby, aria-label or title. | WCAG 4.1.2; H64; ACT cae760; HTML-AAM iframe element; accname 1.2 |

### `iframe-title-unique`

**Frame title uniqueness (deprecated)**

automatic · WCAG 4.1.2 (A) · confidence high · default severity moderate

Deprecated since 1.8.0 and always notApplicable: whether frames sharing a name embed the same resource is checked by identical-iframes-same-purpose.

**Applies to.** Nothing. The rule is deprecated and reports notApplicable on every page. Its id stays in the catalog, with meta.deprecated set and deprecation.replacedBy naming the successor, so a runOnly list, a stored baseline or an open Code Scanning alert that holds the id keeps resolving until the file is removed in 2.0.0 (docs/API_STABILITY.md, "Rule-ID deprecation policy").

**Expectation.** None. The check this rule used to make, that no two frames share a title attribute, is not a WCAG 4.1.2 requirement: the criterion asks that a frame's name be programmatically determinable, not unique, and ACT rule 4b1c6c accepts identical names on frames that embed equivalent resources. identical-iframes-same-purpose asks the question 4b1c6c does ask, of the computed accessible name, which for a frame is the title attribute unless aria-label or aria-labelledby overrides it.

### `image-redundant-alt`

**Image alt text must not duplicate adjacent visible text**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that an &lt;img&gt; alt text is not identical to other visible text already present in its immediate parent element.

**Applies to.** Applies to &lt;img&gt; elements with non-empty alt text whose immediate parent element also has other visible text content (i.e. text nodes besides the image itself, commonly an &lt;a&gt; or &lt;button&gt; wrapping both an icon image and a text label).

**Expectation.** The image's alt text is not the same (case-insensitive, normalized) as the other visible text already in the same parent. When both are present, assistive technology announces the same words twice for a single control (e.g. an icon-plus-text link where the icon's alt duplicates the link text).

**What a finding reports.**

- `alt`: the image's alt text, with spacing collapsed. It matches the text next to it.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `IMAGE_ALT_REDUNDANT` | cantTell | An image's alt text repeats the visible text next to it in the same parent, so the same words may be read twice. | HTML img alt (best practice); H2 (best practice) |

### `img-alt-decorative`

**Excluded &lt;img&gt;/&lt;canvas&gt;/&lt;svg&gt; must be decorative (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;img&gt;, &lt;canvas&gt; and &lt;svg&gt; elements excluded from the accessibility tree (aria-hidden, role="none"/"presentation", empty alt, or an unlabeled svg/canvas) for human review that they are purely decorative.

**Applies to.** Applies to visible &lt;img&gt;, &lt;canvas&gt; or &lt;svg&gt; elements excluded from the accessibility tree by any of: an aria-hidden ancestor-or-self, an explicit role="none"/"presentation" not overridden by focusability, an &lt;img alt=""&gt; (the native decorative marker, same focusability override; only a literally empty alt, so alt=" " is not one), an unlabeled &lt;svg&gt; whose implicit role is graphics-document (no img/graphics-symbol role restatement, aria-name, direct child &lt;title&gt;/&lt;desc&gt; with text wherever it is among the children, or focusability), or an unlabeled &lt;canvas&gt; with no explicit role at all. An element is skipped when an ancestor whose name stands for its content has an author-supplied name (aria-label, aria-labelledby, title, or an associated &lt;label&gt;): that name replaces what the image would have said (the common case: an icon-only button named with aria-label). Such an ancestor has a role named from its content (link, button, heading, cell, option, tab, treeitem, menuitem...) or with presentational children (img, slider, progressbar...). ACT e88epe skips the element under any ancestor named from author; this rule still asks under a named landmark, figure, group, region, dialog or composite widget (listbox, menu, grid...), whose name labels a container and says nothing of what an image in it shows: `<figure aria-label="Photo: DR">` credits a photo. A link or button named by its text does not exempt an image beside the text either: a file-type, external-link or rating icon can say what the text does not, and ACT keeps it applicable. An element in an [inert] subtree, or behind an open modal dialog, is left out as other hidden content is, as img-alt-present leaves it out: it takes no interaction and no assistive technology gets it.

**Expectation.** Human review is required to confirm the excluded element is purely decorative and conveys no information a user would otherwise miss.

**What a finding reports.**

- `element`: `img`, `svg` or `canvas`.
- `sameImageCount`: how many of this result's findings show the same image, this one included: an &lt;img&gt; with the same current source (`currentSrc`, else `src`), or an inline &lt;svg&gt; with the same root attributes that change its rendering (viewBox, width, height, class, style, fill, stroke, color) and the same markup. 1 for a canvas, an image with no source or markup to compare, or a lazy-loaded &lt;img&gt; whose `data:` placeholder stands in for a `data-src` or `data-srcset`.
- `sameImageFirst`: true on the first of them in document order, so a reader can review one copy and count the rest.
- `reasonCode`: `IMAGE_ONLY_CONTROL_CONTENT` when the image is the only content of a link or button (no text and no other image in it): the control then has no name from it, whether or not it decorates, with `controlContent` naming the control's role (`link` or `button`). `EXCLUDED_ELEMENT_REVIEW` otherwise.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `EXCLUDED_ELEMENT_REVIEW` | cantTell | A visible image, &lt;svg&gt; or &lt;canvas&gt; is hidden from assistive technology, and a person checks that it is purely decorative. | WCAG 1.1.1 (not settled); H67; ACT e88epe |
| `IMAGE_ONLY_CONTROL_CONTENT` | cantTell | An image hidden from assistive technology is the only content of a link or button, so the control gets no name from it. | WCAG 1.1.1 (not settled); F89; ACT e88epe |

### `img-alt-present`

**&lt;img&gt; must have an alt attribute**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that &lt;img&gt; elements provide an alt attribute to support a text alternative mechanism.

**Applies to.** Applies to &lt;img&gt; elements included in the accessibility tree. Images with role="presentation" or role="none" are excluded only when they are not focusable, since a focusable one reverts to the img role under presentational roles conflict resolution. Hidden images are excluded whether or not they are focusable.

**Expectation.** Each applicable &lt;img&gt; element has an alt attribute. The alt attribute may be empty (alt="").

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_ALTERNATIVE_MISSING` | fail | An &lt;img&gt; has no alt attribute (or one with only spaces) and no name from aria-label, aria-labelledby or title. | WCAG 1.1.1; H37; F65; ACT 23a2a8; HTML img alt (MUST) |

### `img-alt-quality`

**&lt;img&gt; alt text must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;img&gt; elements with non-empty alt text for human review of appropriateness, and says when the alt looks like a file name, a web address, a placeholder, an "image of" opening or is very long.

**Applies to.** Applies to &lt;img&gt; elements whose alt attribute is present and non-empty. The element must be included in the accessibility tree, and a role attribute resolving to presentation/none (its first token naming a known role, matched case-insensitively) takes it out of scope unless it is focusable, which restores its role. An &lt;img&gt; with no alt at all is img-alt-present's failure, and one with alt="" is img-alt-decorative's review.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate. Alt text that looks like something other than a description gets its own summary and hint: a file name (or alt equal to the image's own file name), a web address, only symbols (such as "★★★★☆"), a placeholder or generic word such as "image" or "TBD", an opening that says it is an image ("image of", "photo of"), or alt longer than 150 characters. Every finding is still `cantTell`: each of these can be right in context.

**What a finding reports.**

- `altSignal`: what made the alt text look suspicious, on those findings only: `file-name`, `url`, `symbols`, `placeholder`, `redundant-prefix` or `too-long`. Absent on a finding with ordinary alt text. When several apply, the first in that order is reported.
- `length`: the alt text's length in characters, on `too-long` only.
- `limit`: the length above which alt counts as too long (150), on `too-long` only.
- `reasonCode`: `IMAGE_ONLY_CONTROL_CONTENT` when the image is the only content of a link or button (no text and no other image in it), so its alt is the control's name (H30), with `controlContent` naming the control's role (`link` or `button`); `TEXT_ALTERNATIVE_REVIEW` otherwise.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_ALTERNATIVE_REVIEW` | cantTell | An &lt;img&gt; has non-empty alt text, and a person checks that it conveys what the image shows. | WCAG 1.1.1 (not settled); H37; ACT qt1vmo |
| `IMAGE_ONLY_CONTROL_CONTENT` | cantTell | The image is the only content of a link or button, so its alt text is the control's name and should say what the control does. | WCAG 1.1.1 (not settled); H30; ACT qt1vmo |

### `input-image-alt-decorative`

**&lt;input type="image"&gt; with alt="" must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;input type="image"&gt; elements with empty alt for human review (usually not appropriate for functional controls).

**Applies to.** Applies to &lt;input type="image"&gt; elements whose alt attribute is present but empty once trimmed, and which still carry a name from another source: an ARIA name resolving to non-empty text, or a title. Without that other name there is nothing to weigh the empty alt against, and the control is input-image-alt-present's failure instead. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `NAME_FROM_ELSEWHERE_REVIEW` | cantTell | An image button has alt="" but takes a name from aria-label, aria-labelledby or title, and a person checks that the name says what the button does. | WCAG 1.1.1 (not settled); H36; HTML-AAM input type=image |

### `input-image-alt-present`

**&lt;input type="image"&gt; must have an alt attribute**

automatic · WCAG 1.1.1, 4.1.2 (A) · confidence high · default severity serious

Checks that &lt;input type="image"&gt; elements provide an alt attribute to support a text alternative mechanism.

**Applies to.** Applies to &lt;input type="image"&gt; elements included in the accessibility tree.

**Expectation.** Each applicable &lt;input type="image"&gt; element has a non-empty accessible name from aria-labelledby, aria-label, alt or title. An empty name fails, whether alt is missing or empty (alt=""). An author-supplied name that equals a browser default for an image button ("Submit", "Submit Query") is not an empty name: it may describe the button, so it is reported as cantTell for a person to judge.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `missing_alt` | fail | An image button has no alt attribute and no name from aria-label, aria-labelledby or title. | WCAG 1.1.1; WCAG 4.1.2; H36; F65; ACT 59796f; HTML input type=image alt (MUST) |
| `empty_alt` | fail | An image button has an empty alt and no name from aria-label, aria-labelledby or title, so the button has no name. | WCAG 1.1.1; WCAG 4.1.2; H36; ACT 59796f; HTML input type=image alt (MUST) |
| `default_name` | cantTell | An image button's author-given name is a browser default ("Submit" or "Submit Query"), and a person checks that it says what the button does. | WCAG 1.1.1 (not settled); HTML-AAM input type=image |

### `input-image-alt-quality`

**&lt;input type="image"&gt; text alternative must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;input type="image"&gt; elements with a non-empty text alternative (alt, aria-label, aria-labelledby or title) for human review of appropriateness. Says when the name looks like a file name, a web address, a placeholder, an "image of" opening or is very long.

**Applies to.** Applies to &lt;input type="image"&gt; elements that get a non-empty text alternative from any source: aria-labelledby (resolving to text), aria-label, alt or title. An element whose alt is present but empty is left to input-image-alt-decorative, which asks about that case. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate. Each occurrence lists every source present (data.details.sources), so the reviewer checks each one. The name is also checked for what the img-alt-quality rule checks in an alt (helpers.getTextAlternativeSignal): a file name, a web address, only symbols, a placeholder or generic word, an opening that says it is an image, or more than 150 characters. Such a name gets its own summary and hint; the finding stays `cantTell`.

**What a finding reports.**

- `reasonCode`: `TEXT_ALTERNATIVE_REVIEW`, whatever the signal.
- `name`: the control's text alternative as announced, from the first source that gives one.
- `sources`: every source that gives a non-empty text alternative, in the order they are used for the name. One item is `aria-labelledby`, `aria-label`, `alt` or `title`.
- `altSignal`, and `length` and `limit` for `too-long`: what made the name look like something other than a description, as for img-alt-quality. Absent when the name is ordinary.
- `alt` (a control with a non-empty `alt`): the `alt` text.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_ALTERNATIVE_REVIEW` | cantTell | An image button has a text alternative, and a person checks that it says what the button does. | WCAG 1.1.1 (not settled); H36 |

### `invalid-field-error-message`

**Fields marked invalid must have a shown error message**

automatic · WCAG 3.3.1 (A) · confidence high · default severity serious

Checks that an element with aria-invalid has an error message in text: its aria-errormessage must name a shown element with text, and a field with no linked message is asked about.

**Applies to.** Elements the page shows, in the accessibility tree and not disabled, whose `aria-invalid` says they are invalid: `true`, or a value ARIA reads as `true` (anything but `false`, `grammar`, `spelling` or empty). `grammar` and `spelling` mark text, not a value a user entered.

**Expectation.**

The error is identified and described to the user in text (WCAG 3.3.1).

- `aria-errormessage` names an element that is shown and has text: pass.
- `aria-errormessage` names only elements that are hidden (`ERROR_MESSAGE_HIDDEN`) or that are shown with no text (`ERROR_MESSAGE_EMPTY`): fail. ARIA requires the message to be shown while the field is invalid, and the page states it isn't. When the field's `aria-describedby` gives a description, the error may be there: cantTell (`ERROR_MESSAGE_NOT_SHOWN_DESCRIBED`).
- `aria-errormessage` names no element of the page: cantTell (`ERROR_MESSAGE_TARGET_MISSING`); a script may add it.
- No `aria-errormessage`, and `aria-describedby` gives a description: pass.
- Neither: cantTell (`NO_ERROR_MESSAGE`). The error may be in the label or in text next to the field, which the markup doesn't tie to it; check that the user is told, in text, which field is in error and what is wrong.
- `aria-errormessage` names a message that is `aria-hidden` itself or inside an `aria-hidden` element: fail (`ERROR_MESSAGE_HIDDEN`, with `hiddenBy: 'aria-hidden'`). ARIA counts such an element as hidden, and requires a pertinent error message not to be.
- `aria-errormessage` names a shown message all of whose text is inside `aria-hidden` elements, while the message itself is not: cantTell (`ERROR_MESSAGE_ARIA_HIDDEN`). People who see it are told; screen reader users may not be.

An element counts as hidden when nobody sees it: `display: none`, `visibility: hidden`, `hidden`, a closed `<details>` or `content-visibility: hidden` on it or an ancestor; a message hidden with `visibility: hidden` whose text is brought back with `visibility: visible` is shown. Text is what the accessible name computation reads: an image's alt counts, and text hidden inside the message doesn't. The message may be named by id or set from script as an element (`ariaErrorMessageElements`).

**What a finding reports.**

- `ariaInvalid`: the attribute's value.
- `hiddenBy` (`ERROR_MESSAGE_HIDDEN`): `aria-hidden` when only aria-hidden hides the message; absent when nobody sees it.
- `errorMessageIds`: the ids `aria-errormessage` names, or [] for none.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `ERROR_MESSAGE_HIDDEN` | fail | Aria-errormessage names only messages that are hidden: nobody sees them, or aria-hidden, on the message or around it, hides them from assistive technology. | WAI-ARIA 1.2 aria-errormessage (MUST); WCAG 3.3.1; ARIA21 |
| `ERROR_MESSAGE_EMPTY` | fail | Aria-errormessage names only shown messages that have no text. | WAI-ARIA 1.2 aria-errormessage; WCAG 3.3.1 |
| `ERROR_MESSAGE_NOT_SHOWN_DESCRIBED` | cantTell | The named message is hidden or empty, but the field's aria-describedby gives a description that may carry the error. | WCAG 3.3.1 (not settled); WAI-ARIA 1.2 aria-errormessage |
| `ERROR_MESSAGE_ARIA_HIDDEN` | cantTell | The named message is shown, but all its text is inside aria-hidden elements, so people who see it are told and screen reader users may not be. | WCAG 3.3.1 (not settled); WAI-ARIA 1.2 aria-errormessage (MUST) |
| `ERROR_MESSAGE_TARGET_MISSING` | cantTell | Aria-errormessage names no element of the page; a script may add it later. | WAI-ARIA 1.2 aria-errormessage (not settled); WCAG 3.3.1 |
| `NO_ERROR_MESSAGE` | cantTell | Neither aria-errormessage nor aria-describedby ties a message to the field; the error may be told in text the markup doesn't tie to it. | WCAG 3.3.1 (not settled); G83 |

### `label-for-valid`

**A label’s for attribute should name a control it can label**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Flags a label whose for attribute names no element, or an element that cannot be labelled, so the label labels nothing, for manual review.

**Applies to.** `<label>` elements the page shows with a non-empty `for` attribute.

**Expectation.**

HTML: a label with `for` labels the element with that id in its tree, if that element is labelable, and nothing otherwise, whatever the label contains.

- `for` names a labelable element (`button`, `input` other than hidden, `meter`, `output`, `progress`, `select`, `textarea`) or a custom element, which may be form-associated: pass.
- `for` names no element: cantTell (`LABEL_FOR_TARGET_MISSING`).
- `for` names an element that can't be labelled: cantTell (`LABEL_FOR_NOT_LABELABLE`).

Either way the label labels nothing. Check which control it was meant for: that control may be named another way, which the name rules judge, or be left without the visible label meant for it.

**What a finding reports.**

- `for`: the id the label names.
- `targetElement`: for `LABEL_FOR_NOT_LABELABLE`, the tag of the element named.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `LABEL_FOR_NOT_LABELABLE` | cantTell | The label's for attribute names an element that cannot be labelled, so the label labels nothing. | HTML labeled control (best practice) |
| `LABEL_FOR_TARGET_MISSING` | cantTell | The label's for attribute names no element in its tree, so the label labels nothing. | HTML labeled control (best practice) |

### `label-in-name`

**Label in Name: accessible name contains visible text**

automatic · WCAG 2.5.3 (A) · confidence high · default severity serious

Checks that when a control has a visible text label, the accessible name contains that visible label text (WCAG 2.5.3).

**Applies to.** Applies to controls named by aria-label or aria-labelledby, are visually rendered, and have visible label text this engine can extract deterministically, from an associated &lt;label&gt;, from the control's own rendered text, or from the elements aria-labelledby points at. The candidates are &lt;button&gt;, &lt;a href&gt;, &lt;summary&gt;, non-hidden form controls, and elements whose role attribute resolves (its first known, non-abstract token, in any case) to the button, link, checkbox, radio, switch, searchbox, tab, menuitem, menuitemcheckbox, menuitemradio, option, treeitem or gridcell role, and a &lt;td&gt; with no role attribute in a grid or treegrid, a gridcell by HTML-AAM, minus anything hidden or disabled. A button-type &lt;input&gt; (submit, reset, button) with a value shows that value as its label; without one it shows the browser's own default, which can't be known, and is out of scope. The visible label is the visible inner text: text in inline elements joins as written (&lt;b&gt;Down&lt;/b&gt;load reads "Download"), a block-level box or a &lt;br&gt; starts a new word, and text in a box nobody can see (clipped away, 1x1 px or fully transparent, as screen-reader-only text is) is left out, as are the options of a &lt;select&gt; and the text of a &lt;textarea&gt;, which are a field's value, not label text. aria-hidden is not excluded: it changes nothing about what is rendered on screen, which is what this SC is about. An aria-label that is empty once trimmed, or an aria-labelledby whose ids point at nothing or only at elements with no text, names nothing: the accessible name then comes from the next source (the content, a &lt;label&gt;, title...), as for a control without them, so the control is out of scope. A custom element whose ElementInternals give it one of those roles (this.attachInternals().role), with no role attribute naming another, counts as a native element with that role does.

**Expectation.** The accessible name contains the visible label's words, adjacent and in order. The comparison is over words rather than characters: parenthesised text is dropped, case is folded, text is NFKC-normalised, and every character that is not a letter, digit or combining mark becomes a separator, so punctuation and spacing differences never decide the outcome. Invisible formatting characters (a soft hyphen, a zero-width space) and an apostrophe inside a word are removed instead, so "Down&shy;load" is "Download" and "Don’t" is "Dont". Accents are not folded: "Déposer" stays one word, and a name that drops an accent ("Deposer") does not contain it. Four shapes markup cannot settle are reported as cantTell instead of fail: a word hyphenated differently in the two places; a visible word the author may have abbreviated, marked by its trailing period; visible text rendered through a known icon font (the DOM text is real words, but nothing readable actually renders); and a whole visible label of exactly one character that doesn't even appear inside the accessible name, which per ACT 2ee8b8 may be "non-text content" (e.g. "X" meaning "close") rather than literal text.

**What a finding reports.**

- `visibleLabel`, `accessibleName`: the visible label text and the accessible name, as found.
- `normalized.visibleLabel`, `normalized.accessibleName`: the same two texts as compared: parenthesised text dropped, case folded, Unicode normalised.
- `tokenized.visibleLabel`, `tokenized.accessibleName`: the words each text was split into, one word per item. The name must hold the label's words next to each other and in order.
- `labelSource`: where the visible label came from: `label` (an associated `<label>`), `self` (the control's own text), `value` (a button-type `<input>`'s value) or `aria-labelledby` (the elements it points at).
- `nameMechanism`: what gives the accessible name: `aria-label` or `aria-labelledby`.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `HYPHENATION_DIFFERS` | cantTell | The accessible name holds the visible label's words only when hyphens are ignored, so whether it contains the label is a judgment call. | WCAG 2.5.3 (not settled); ACT 2ee8b8 |
| `POSSIBLE_ABBREVIATION` | cantTell | The accessible name holds the visible label only if a word ending in a period is read as an abbreviation of a longer word. | WCAG 2.5.3 (not settled); ACT 2ee8b8 |
| `POSSIBLE_ICON_FONT_GLYPH` | cantTell | The visible label renders through an icon font, so its text may show as a symbol rather than readable words. | WCAG 2.5.3 (not settled); ACT 2ee8b8 |
| `POSSIBLE_SYMBOLIC_CHARACTER` | cantTell | The visible label is a single character missing from the accessible name, which may be a symbol rather than text. | WCAG 2.5.3 (not settled); ACT 2ee8b8 |
| `VISIBLE_LABEL_NOT_IN_ACCESSIBLE_NAME` | fail | The accessible name from aria-label or aria-labelledby does not contain the visible label's words, together and in order. | WCAG 2.5.3; F96; G208; ACT 2ee8b8 |

### `label-title-only`

**Title-only form labels (deprecated)**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Deprecated since 1.10.0 and always notApplicable: a form control labelled only by its title attribute is reported by form-control-programmatic-label-quality.

**Applies to.** Nothing. The rule is deprecated and reports notApplicable on every page. Its id stays in the catalog, with meta.deprecated set and deprecation.replacedBy naming the rule that covers it, so a runOnly list, a stored baseline or code that looks the result up by ruleId keeps resolving until the file is removed in 2.0.0 (docs/API_STABILITY.md, "Rule-ID deprecation policy").

**Expectation.** None. The case it reported, a form control whose only label is its title attribute, is reported by form-control-programmatic-label-quality (label_from_title_primary), which also covers placeholder-only labels, under SC 3.3.2. Every finding this rule made was a second report of one that rule makes for the same element.

### `landmark-banner-is-top-level`

**Banner landmark must be top-level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the banner landmark (role="banner" or a non-nested &lt;header&gt;) is not nested inside another landmark region.

**Applies to.** Applies whenever the page contains at least one banner candidate: explicit role="banner", OR a &lt;header&gt; with NO role attribute at all, regardless of nesting. A custom element whose ElementInternals give it a landmark role (this.attachInternals().role), with no role attribute naming another, is a landmark as a native element with that role is.

**Expectation.** No banner candidate has an ancestor that is itself any landmark region. A banner nested inside another landmark is not a top-level, whole-page banner and confuses landmark-based navigation for assistive technology users.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `LANDMARK_BANNER_NOT_TOP_LEVEL` | cantTell | A banner landmark sits inside another landmark instead of at the top level of the page. | WAI-ARIA 1.2 banner role (best practice); HTML-AAM header element |

### `landmark-complementary-is-top-level`

**Complementary landmark must be top-level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the complementary landmark (role="complementary" or an &lt;aside&gt; that keeps its implicit role) is not nested inside another landmark region.

**Applies to.** Applies whenever the page contains at least one element carrying the complementary role: explicit role="complementary", or an &lt;aside&gt; that keeps its implicit role. A custom element whose ElementInternals give it a landmark role (this.attachInternals().role), with no role attribute naming another, is a landmark as a native element with that role is.

**Expectation.** No complementary candidate has an ancestor that is itself a landmark region. Complementary content supports the main content of the page and sits beside it; nested inside another landmark it is a section of that landmark instead, which is not what landmark navigation announces.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `LANDMARK_COMPLEMENTARY_NOT_TOP_LEVEL` | cantTell | A complementary landmark sits inside another landmark instead of at the top level of the page. | WAI-ARIA 1.2 complementary role (best practice); HTML-AAM aside element |

### `landmark-contentinfo-is-top-level`

**Contentinfo landmark must be top-level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the contentinfo landmark (role="contentinfo" or a non-nested &lt;footer&gt;) is not nested inside another landmark region.

**Applies to.** Applies whenever the page contains at least one contentinfo candidate: explicit role="contentinfo", OR a &lt;footer&gt; with NO role attribute at all, regardless of nesting. A custom element whose ElementInternals give it a landmark role (this.attachInternals().role), with no role attribute naming another, is a landmark as a native element with that role is.

**Expectation.** No contentinfo candidate has an ancestor that is itself any landmark region. A contentinfo nested inside another landmark is not a top-level, whole-page footer region and confuses landmark-based navigation for assistive technology users.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `LANDMARK_CONTENTINFO_NOT_TOP_LEVEL` | cantTell | A contentinfo landmark sits inside another landmark instead of at the top level of the page. | WAI-ARIA 1.2 contentinfo role (best practice); HTML-AAM footer element |

### `landmark-main-is-top-level`

**Main landmark must be top-level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the main landmark (role="main" or &lt;main&gt;) is not nested inside another landmark region.

**Applies to.** Applies whenever the page contains at least one main landmark (explicit role="main", or an implicit &lt;main&gt; element). A custom element whose ElementInternals give it a landmark role (this.attachInternals().role), with no role attribute naming another, is a landmark as a native element with that role is.

**Expectation.** No main landmark has an ancestor that is itself any landmark region. A main region nested inside another landmark is not a top-level, whole-page main content area and confuses landmark-based navigation for assistive technology users.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `LANDMARK_MAIN_NOT_TOP_LEVEL` | cantTell | A main landmark sits inside another landmark instead of at the top level of the page. | WAI-ARIA 1.2 main role (best practice); HTML-AAM main element |

### `landmark-no-duplicate-banner`

**Page must not have more than one banner landmark**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that at most one banner landmark (role="banner" or a non-nested &lt;header&gt;) exists on the page.

**Applies to.** Applies whenever the page contains at least one banner landmark (explicit role="banner", or an implicit, non-nested &lt;header&gt;, found the same way as in landmark-banner-is-top-level). A custom element whose ElementInternals give it a landmark role (this.attachInternals().role), with no role attribute naming another, is a landmark as a native element with that role is.

**Expectation.** At most one banner landmark exists on the page. Per WAI-ARIA Authoring Practices, the banner landmark represents site-oriented content that identifies the page as a whole, so having more than one is ambiguous for assistive technology users navigating by landmark.

**What a finding reports.**

- `count`: how many banner landmarks the page exposes to assistive technology, against a limit of 1.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `LANDMARK_DUPLICATE_BANNER` | cantTell | The page exposes more than one banner landmark; each one is reported. | WAI-ARIA 1.2 banner role (SHOULD) |

### `landmark-no-duplicate-contentinfo`

**Page must not have more than one contentinfo landmark**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that at most one contentinfo landmark (role="contentinfo" or a non-nested &lt;footer&gt;) exists on the page.

**Applies to.** Applies whenever the page contains at least one contentinfo landmark (explicit role="contentinfo", or an implicit, non-nested &lt;footer&gt;). A custom element whose ElementInternals give it a landmark role (this.attachInternals().role), with no role attribute naming another, is a landmark as a native element with that role is.

**Expectation.** At most one contentinfo landmark exists on the page, mirroring landmark-no-duplicate-banner's rationale for contentinfo.

**What a finding reports.**

- `count`: how many contentinfo landmarks the page exposes to assistive technology, against a limit of 1.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `LANDMARK_DUPLICATE_CONTENTINFO` | cantTell | The page exposes more than one contentinfo landmark; each one is reported. | WAI-ARIA 1.2 contentinfo role (SHOULD) |

### `landmark-no-duplicate-main`

**Page must not have more than one main landmark**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that at most one main landmark (role="main" or &lt;main&gt;) exists on the page.

**Applies to.** Applies whenever the page contains at least one main landmark (explicit role="main", or an implicit &lt;main&gt;). A custom element whose ElementInternals give it a landmark role (this.attachInternals().role), with no role attribute naming another, is a landmark as a native element with that role is.

**Expectation.** At most one main landmark exists on the page. Distinct, atomic decision from landmark-one-main (that rule flags zero mains too; this one only flags more than one).

**What a finding reports.**

- `count`: how many main landmarks the page exposes to assistive technology, against a limit of 1.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `LANDMARK_DUPLICATE_MAIN` | cantTell | The page exposes more than one main landmark; each one is reported. | WAI-ARIA 1.2 main role (SHOULD) |

### `landmark-one-main`

**Page should have a main landmark**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the page has at least one main landmark (role="main" or &lt;main&gt;).

**Applies to.** Always applicable to any HTML document with a &lt;body&gt; element: "does the page have a main landmark" is a whole-page concern, matching bypass-blocks-present's pattern of evaluating the document directly. Not while a modal dialog is open: the rest of the page is inert then, so the scan sees the dialog, not the page. A custom element whose ElementInternals give it a landmark role (this.attachInternals().role), with no role attribute naming another, is a landmark as a native element with that role is.

**Expectation.** At least one main landmark (role="main" or &lt;main&gt;), exposed to assistive technology, exists on the page. A page with none gives AT users no landmark to jump straight to for the primary content.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `LANDMARK_MAIN_MISSING` | cantTell | The page exposes no main landmark to assistive technology. | WAI-ARIA 1.2 main role (best practice) |

### `landmark-role-name-present`

**Region and form roles must have an accessible name**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks that an element given role="region" or role="form" has an accessible name, without which it is not exposed as a landmark.

**Applies to.** Applies to elements whose role attribute resolves to region or form (its first known, non-abstract token, in any case: role="foo region" counts, role="search region" is a search landmark), and that are included in the accessibility tree. A custom element whose ElementInternals give it one of those roles (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The element has a non-empty accessible name from aria-labelledby, aria-label or title. WAI-ARIA requires one ("Authors MUST give each element with role region a brief label", and the same for form), and without one the element is not exposed as a landmark at all, so the role the author asked for is lost. Reported at CANTTELL rather than FAIL: the requirement is WAI-ARIA's, not a WCAG Success Criterion's. Nothing false reaches assistive technology, which gets a plain container, so whether losing the landmark harms anyone depends on the page.

**What a finding reports.**

- `role`: the role that needs a name, `region` or `form`.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `LANDMARK_ROLE_NAME_MISSING` | cantTell | An element given the region or form role has no accessible name, so it is not exposed as a landmark. | WAI-ARIA 1.2 region role (MUST); WAI-ARIA 1.2 form role (MUST); ARIA13 |

### `landmark-unique`

**Landmarks with the same role must have unique names**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that when two or more landmarks share the same role, each has a distinct accessible name.

**Applies to.** Applies whenever two or more landmark regions on the page share the same landmark role (banner, contentinfo, main, navigation, complementary, region, form, or search). A custom element whose ElementInternals give it a landmark role (this.attachInternals().role), with no role attribute naming another, is a landmark as a native element with that role is.

**Expectation.** Among landmarks sharing a role, each has a distinct accessible name (via aria-label/aria-labelledby; landmarks are not named from content). Two same-role landmarks with the same name (including two both left unnamed) are indistinguishable to assistive technology users navigating by landmark. A shared name is reported as CANTTELL, never as a failure: the ARIA Authoring Practices allow one when the landmarks have the same content and purpose, such as pagination repeated above and below a table, which only a person can confirm. Two unnamed landmarks need names either way, and the same allowance then applies to those names.

**What a finding reports.**

- `role`: the landmark role the colliding landmarks share, such as `navigation`.
- `name`: the name they share, in lowercase with spacing collapsed. Empty when they are all unnamed.
- `groupSize`: how many landmarks of that role share that name.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `LANDMARK_NOT_UNIQUE` | cantTell | Two or more landmarks with the same role share one accessible name, or are all unnamed; a person judges whether they have the same content and purpose. | WAI-ARIA 1.2 landmark roles (best practice); ARIA13 |

### `link-in-text-block`

**Links in text blocks must be distinguishable from surrounding text without relying on color alone**

automatic · WCAG 1.4.1 (A) · confidence high · default severity serious

Checks that a link inside a run of text is visually distinguishable from the surrounding text by a non-color cue (underline, font-weight or style, border, background, icon), and asks about links distinguished only by a &gt;=3:1 color difference, which also need a hover and focus cue.

**Applies to.** Applies to links (`<a href>` and elements whose role attribute resolves to link: its first known role token, in any case, is `link`) that draw text (text other than white space in the link's flat tree and, where the page has a layout, a box with some area) and whose immediate parent element also has text with a letter or a digit beside it: a direct-child text node, or text in an inline element on the same line that is not a link, is not drawn invisibly, and is not an item of a flex or grid parent (i.e. the link sits inline within a run of plain text, not as a standalone item, e.g. not the sole content of a &lt;li&gt; nav item, nor one of a row of links separated by "|" or "·"). A custom element whose ElementInternals give it the link role (this.attachInternals().role), with no role attribute naming another, counts as a native element with that role does.

**Expectation.**

A link inside a text block must be visually distinguishable from the surrounding text by at least one non-color means:

- text-decoration: underline, OR
- a different font-weight or font-style than the surrounding text, OR
- another visible mark on the link itself: a border, box-shadow or outline, a background color different from the surrounding one, a background image, an image or svg inside it, or a ::before/::after that draws something (content of its own, or an empty box painting a background, border, outline or shadow, as an underline drawn that way does), OR
- a mark on all of its content: bold, italic, underlined, bordered, a background unlike the surrounding text's (a code chip, &lt;mark&gt;), or raised or lowered (a footnote's &lt;sup&gt;).

A link with none of these is distinguished by color alone. When its color contrasts with the surrounding text by at least 3:1, technique G183 is met only if hover and focus also bring a non-color cue, which a static scan cannot see, so the link is reported as cantTell. Below 3:1, with contrast confidently computable, color is demonstrably the only cue and the link fails. Margin (`contrast-ratio`): of the links told apart by color alone that reach 3:1, the one closest to it, with its ratio unrounded. Those links are also asked about (the hover and focus cue), so the margin appears on a cantTell or fail result. Only a link within 10% of 3:1 (up to 3.3:1) counts as close. `measuredCount` counts the links whose only cue is color.

**What a finding reports.**

- `metrics.ratio` (a link set apart by color only): the contrast between the link's text color and the surrounding text's, as a ratio (3 for 3:1), against `metrics.threshold` (3).
- `colors.linkForegroundHex`, `colors.surroundingTextForegroundHex` (a link set apart by color only): the link's text color and the surrounding text's, as hex.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `COLOR_ONLY_DIFFERENTIATION` | fail | A link in a block of text is told apart from the surrounding text by color alone, with less than 3:1 contrast between the two. | WCAG 1.4.1; F73; G183 |
| `LINK_COLOR_CONTRAST_ONLY` | cantTell | A link in a block of text is told apart by color alone at 3:1 or more; whether hover and focus add a non-color cue is for a person to check. | WCAG 1.4.1 (not settled); G183 (not settled) |
| `TEXT_DECORATION_NOT_RESOLVABLE` | cantTell | Whether the link is underlined could not be read, so whether color is its only cue is unknown. | WCAG 1.4.1 (not settled) |
| `COLOR_NOT_COMPUTABLE` | cantTell | The colors of the link or of the surrounding text could not be worked out. | WCAG 1.4.1 (not settled) |
| `BACKGROUND_IMAGE_OR_GRADIENT` | cantTell | A background image or gradient lies behind the link, so its colors could not be compared. | WCAG 1.4.1 (not settled) |
| `BACKGROUND_OVERLAP` | cantTell | Another element paints under a link or text drawn in a translucent color, so the colors could not be compared. | WCAG 1.4.1 (not settled) |
| `BACKGROUND_FILTER_OR_BACKDROP_FILTER` | cantTell | A filter or backdrop-filter changes the colors drawn, so the declared colors of the link and the text are not what is on screen. | WCAG 1.4.1 (not settled) |
| `MIX_BLEND_MODE` | cantTell | A mix-blend-mode blends the link or the text with what is behind it, so the colors on screen could not be compared. | WCAG 1.4.1 (not settled) |
| `ANCESTOR_OPACITY` | cantTell | An ancestor with opacity below 1 fades the link and its background together, in a way that could not be resolved. | WCAG 1.4.1 (not settled) |
| `ELEMENT_OPACITY` | cantTell | The link's own element has opacity below 1 over a background of its own, which could not be resolved. | WCAG 1.4.1 (not settled) |
| `TEXT_SHADOW` | cantTell | A text-shadow changes how the link or the text looks, so their colors alone don't tell whether they stand apart. | WCAG 1.4.1 (not settled) |
| `TEXT_STROKE` | cantTell | A -webkit-text-stroke draws the link or the text in a color of its own, so the colors could not be compared. | WCAG 1.4.1 (not settled) |
| `PSEUDO_ELEMENT_COLOR` | cantTell | A ::first-line or ::first-letter has a color of its own, and which text it paints depends on line breaks. | WCAG 1.4.1 (not settled) |
| `SELECT_OPTION_COLOR` | cantTell | The text is a drop-down option drawn only in the list the platform opens, with colors of its own. | WCAG 1.4.1 (not settled) |
| `CONTRAST_HELPERS_UNAVAILABLE` | cantTell | The color helpers were not available in this run, so the link could not be checked. | WCAG 1.4.1 (not settled) |
| `ENGINE_EXCEPTION` | cantTell | The rule stopped on an internal error for this link; it is to be checked by hand. | WCAG 1.4.1 (not settled) |

**Margin.** `contrast-ratio`, in a ratio: the value must reach the threshold, and the result's `margin` names the element that came closest while meeting it, if it is within 10% of the threshold.

### `link-name-present`

**Links have an accessible name**

automatic · WCAG 2.4.4, 2.4.9, 4.1.2 (A, AAA, A) · confidence high · default severity serious

Checks that links expose a non-empty accessible name.

**Applies to.** Applies to &lt;a href&gt;, &lt;area href&gt; and elements whose role attribute resolves to link (its first token naming a known role, matched in any case) that are included in the accessibility tree. An &lt;a&gt; without an href is not a link and is not matched. An &lt;a href&gt;/&lt;area href&gt; whose explicit role is a known role other than link, a DPUB role inheriting from link, none or presentation is not a link and is not matched (ACT c487ae, Inapplicable Example 1). A custom element whose ElementInternals give it the link role (this.attachInternals().role), with no role attribute naming another, counts as a native element with that role does.

**Expectation.** The element has a non-empty accessible name. A programmatic name is taken first (aria-labelledby, aria-label, an associated &lt;label&gt;, title), and failing that the element falls back to its own subtree text, counting each descendant's own name (an &lt;img alt&gt;, aria-label or title), the shape behind the common &lt;a&gt;&lt;img alt="..."&gt;&lt;/a&gt; logo link. The content fallback is suppressed when an explicit, known role that is not name-from-content is present (the first known token of the role fallback list); a role attribute with no known token falls back to the implicit role.

**What a finding reports.**

- `refs.accessibleName`: what the programmatic name lookup found: `present`, `value`, `mechanism` (the attribute or element the name would come from, `none` when there is none) and `flags` (notes on why a source gave no name). `null` when no lookup was made.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | A link exposed to assistive technology has no accessible name, from attributes or from its content. | WCAG 2.4.4; WCAG 2.4.9; WCAG 4.1.2; ACT c487ae; F89; accname 1.2 |
| `name_closedContent` | cantTell | The link may take its name from content in a closed shadow root, which no script can read. | WCAG 4.1.2 (not settled); accname 1.2 |
| `name_contentTooDeep` | cantTell | The link's content is nested too deeply to work out a name from it. | WCAG 4.1.2 (not settled); accname 1.2 |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 2.4.4 (not settled); WCAG 2.4.9 (not settled); WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `link-name-quality`

**Link text should be descriptive, not generic**

manual · WCAG 2.4.4, 2.4.9 (A, AAA) · confidence medium · default severity minor

Flags links whose full accessible name is a known non-descriptive phrase (e.g. "click here", "read more", "more") or a bare file-format name (e.g. "HTML", "PDF") with no adjacent context naming what it leads to, for manual review of whether the purpose is clear. English phrases are always recognized, and German, Spanish, French or Japanese ones when the link is in that language.

**Applies to.** `a[href]`, `area[href]` and elements whose role attribute resolves to link (its first real role token, in any case) with a non-empty computed accessible name (aria-labelledby, aria-label, the content, then title, as accname orders them; same selector as `link-name-present`). Links with no name at all are `link-name-present`'s concern, not this rule's. A custom element whose ElementInternals give it the link role (this.attachInternals().role), with no role attribute naming another, counts as a native element with that role does.

**Expectation.** The link's full accessible name, normalized (trimmed, case-folded, trailing punctuation stripped), is not an exact match for a known non-descriptive phrase ("click here", "read more", "more", "here", "details", "link", etc., WCAG technique F84's known failure pattern for SC 2.4.4) or a bare file-format/type name ("HTML", "PDF", "EPUB", ...) with no adjacent context (an aria-describedby target, the enclosing list item/table cell/paragraph's own text, or (format names only) a table's first-row header) naming what it belongs to.

**What a finding reports.**

- `normalizedName`: the link's accessible name as it was matched: in lowercase, with spacing collapsed and trailing punctuation removed. It is a generic phrase (`GENERIC_LINK_TEXT`) or a bare format name (`AMBIGUOUS_FORMAT_NAME`).

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `GENERIC_LINK_TEXT` | cantTell | The link's whole name is a generic phrase such as "read more" or "click here", with no adjacent context found that says where it leads. | WCAG 2.4.4 (not settled); WCAG 2.4.9; F84; G91; G53; ACT 5effbb; ACT aizyf1 |
| `AMBIGUOUS_FORMAT_NAME` | cantTell | The link's whole name is a bare file format such as "PDF", with no adjacent context found that names the document. | WCAG 2.4.4 (not settled); WCAG 2.4.9 (not settled); G91; G53; ACT 5effbb; ACT aizyf1 |

### `list-children-valid`

**Lists must only directly contain list items**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;ul&gt;/&lt;ol&gt; elements only have &lt;li&gt;, &lt;script&gt;, or &lt;template&gt; as direct children.

**Applies to.** Applies to &lt;ul&gt;/&lt;ol&gt; elements that have at least one direct element child or non-whitespace text directly inside them, and whose role is list: no role attribute, a role attribute resolving to list (its first token naming a known role, in any case), or one naming no known ARIA role. A &lt;ul&gt;/&lt;ol&gt; given another role (listbox, menubar, tablist, none, ...) is not a list, so its children follow that role's rules instead.

**Expectation.** Every direct element child is &lt;li&gt;, &lt;script&gt;, or &lt;template&gt;. UNLESS it has an explicit role (its role attribute's first token naming a known role, matched in any case), in which case the explicit role wins over the tag entirely: a child is valid iff that role is "listitem" (so `<li role="presentation">`/`<li role="menuitem">` are invalid despite the &lt;li&gt; tag, and conversely a non-&lt;li&gt; element explicitly given `role="listitem"` or `role="foo LISTITEM"` is valid). A role attribute naming no known role leaves the tag to decide. A wrapper &lt;div&gt; used for styling (no role at all) still breaks list semantics the same as before. Non-whitespace text directly inside the list is an invalid child too: HTML allows only &lt;li&gt; and script-supporting elements there, and the text belongs to no list item.

**What a finding reports.**

- `reasonCode`: `LIST_ITEM_ROLE_OVERRIDDEN` when every child that does not belong is an &lt;li&gt; whose explicit role replaces listitem (`<li role="presentation">`, `role="none"`, `role="group"`...), and `LIST_INVALID_CHILD` for any other child: an element that is not an &lt;li&gt;, or text. A list with both is `LIST_INVALID_CHILD`.
- `element`: the list's tag name, `ul` or `ol`.
- `invalidChildren`: the children that do not belong in the list, one tag name per child (`#text` for text placed directly inside).
- `overriddenRoles`: with `LIST_ITEM_ROLE_OVERRIDDEN`, the role of each such &lt;li&gt;, in order.
- `element` is a stable contract (API_STABILITY.md), unlike the rest of `data.details`.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `LIST_INVALID_CHILD` | fail | The list holds an element that is not a list item, script or template, or text outside any list item. | WCAG 1.3.1; H48; HTML ul and ol elements content model (MUST); WAI-ARIA 1.2 list role (MUST) |
| `LIST_ITEM_ROLE_OVERRIDDEN` | fail | An li in the list has a role that replaces listitem, so it is not one of the list's items. | WCAG 1.3.1; ARIA in HTML li element (MUST); WAI-ARIA 1.2 list role (MUST) |

### `listbox-name-present`

**Listboxes have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="listbox" expose a non-empty accessible name.

**Applies to.** Applies to elements whose role attribute resolves to listbox: its first token naming a known role, matched in any case, is listbox, so role="foo listbox" and role="LISTBOX" count while role="link listbox" (a link) does not. The element must be included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope. A custom element whose ElementInternals give it the role (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="listbox" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom listbox widget is not reliably exposed as its name. On a labelable element (&lt;select multiple role="listbox"&gt;) an associated &lt;label&gt; counts as well.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | An element with the listbox role has no accessible name from aria-label, aria-labelledby, title or a label. | WCAG 4.1.2; ACT e086e5; ARIA16; WAI-ARIA 1.2 listbox role (MUST); accname 1.2 |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `listitem-parent-valid`

**List items must be inside a list container**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;li&gt; elements are contained by &lt;ul&gt;, &lt;ol&gt;, &lt;menu&gt;, or an element with role="list".

**Applies to.** Applies to &lt;li&gt; elements that have a parent element.

**Expectation.** The parent is &lt;ul&gt;/&lt;ol&gt;/&lt;menu&gt; with no role override (all three have the implicit role list), or an element with an explicit role of "list", "directory" (deprecated, but a required parent of listitem in WAI-ARIA 1.2), "presentation", or "none". An &lt;li&gt; used outside a real list container (e.g. as a generic flex/grid item under a &lt;div&gt;) is not exposed as a list item to assistive technologies.

**What a finding reports.**

- `reasonCode`: `LIST_ROLE_OVERRIDDEN` when the parent is a &lt;ul&gt;, &lt;ol&gt; or &lt;menu&gt; whose explicit role replaces list (`<ul role="tablist">`), `LISTITEM_INVALID_PARENT` otherwise. Both fail.
- `parentElement`: the tag name of the `<li>`'s parent, the container it is in instead of a list.
- `parentRole`: with `LIST_ROLE_OVERRIDDEN`, the parent's role.
- `parentElement` is a stable contract (API_STABILITY.md), unlike the rest of `data.details`.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `LISTITEM_INVALID_PARENT` | fail | An li is not inside a ul, ol, menu or an element with role list, so it is not exposed as a list item. | WCAG 1.3.1; H48; HTML li element contexts (MUST); WAI-ARIA 1.2 listitem role (MUST) |
| `LIST_ROLE_OVERRIDDEN` | fail | The li's parent is a ul, ol or menu whose explicit role replaces list, so the li is not in a list. | WCAG 1.3.1; WAI-ARIA 1.2 listitem role (MUST) |

### `live-region-announcements`

**Live regions should be able to announce status messages**

manual · WCAG 4.1.3 (AA) · confidence medium · default severity moderate

Flags a live region hidden from assistive technology or left busy, and, with the live-region hook, one added with its text or shown and filled at once, for manual review.

**Applies to.** Live regions the page draws: elements whose aria-live is polite or assertive, or, without an aria-live, whose role is status, log or alert, and &lt;output&gt; elements. aria-live="off" turns any of them off. A live region hidden with display: none, visibility: hidden or [hidden] is left out: a region waiting to be shown is the page at rest. With the live-region hook (liveRegionHookScript), also the live regions it saw given their text in a way that is commonly not announced, whether or not they are still on the page.

**Expectation.**

WCAG 4.1.3: a status message can be presented to the user by assistive technology without receiving focus, which a live region does when its content changes while assistive technology can reach it.

- A drawn live region inside, or on, aria-hidden="true" or inert: cantTell (`LIVE_REGION_HIDDEN`). It is out of the accessibility tree, so nothing it is given can be announced.
- A live region with aria-busy="true" when the page was scanned: cantTell (`LIVE_REGION_BUSY`). Assistive technology may hold back its changes until aria-busy is cleared.
- Recorded by the hook, a live region added to the page with its text already in it, other than role="alert": cantTell (`LIVE_REGION_INSERTED_WITH_CONTENT`). Screen readers commonly announce changes to a region they already know, not a new region's content.
- Recorded by the hook, a live region that was hidden and was shown and given its text in the same task: cantTell (`LIVE_REGION_SHOWN_AND_FILLED`). It was not in the accessibility tree when the text arrived.
- Otherwise: pass.

Check whether the page uses the region for status messages, and that it is in the page, shown and reachable, before its text changes.

**What a finding reports.**

- `politeness`: the region's, `polite` or `assertive`.
- `hiddenBy`: for `LIVE_REGION_HIDDEN`, `aria-hidden` or `inert`.
- `text`: for the hook's two findings, the text the region was given (up to 300 characters).
- `removed`: for the hook's two findings, true when the region was no longer on the page when it was scanned; the occurrence is then on the document element, and `region` describes it (`tag`, `role`, `id`).

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `LIVE_REGION_HIDDEN` | cantTell | A live region inside or on aria-hidden="true" or inert, so nothing it is given can be announced. | WCAG 4.1.3 (not settled); WAI-ARIA 1.2 aria-hidden; WAI-ARIA 1.2 aria-live |
| `LIVE_REGION_BUSY` | cantTell | A live region with aria-busy="true" when the page was scanned, so assistive technology may hold back its changes. | WCAG 4.1.3 (not settled); WAI-ARIA 1.2 aria-busy |
| `LIVE_REGION_INSERTED_WITH_CONTENT` | cantTell | A live region, other than role="alert", added to the page with its text already in it, which screen readers commonly do not announce. | WCAG 4.1.3 (not settled); WAI-ARIA 1.2 aria-live |
| `LIVE_REGION_SHOWN_AND_FILLED` | cantTell | A hidden live region shown and given its text in the same task, so it was not in the accessibility tree when the text arrived. | WCAG 4.1.3 (not settled); WAI-ARIA 1.2 aria-live |

### `manual-review`

**Manual review: keyboard navigation and focus order**

manual · WCAG 2.1.1, 2.4.3, 2.4.7 (A, A, AA) · confidence medium · default severity moderate

Flags that a manual review of keyboard navigation and focus order is required.

**Applies to.** Applies to every run, whatever the page contains. Keyboard operability and focus order are properties of the page as a whole, and no markup pattern rules the question out.

**Expectation.** Always cantTell, carrying one occurrence at the scan root. Whether focus can leave every component, whether the tab order follows the reading order, and whether the focus indicator stays visible in use all need a person driving the page. The rule exists so that need is stated in the results rather than left for the reader to remember.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `KEYBOARD_REVIEW` | cantTell | Every page needs a person to check that it works by keyboard, that focus order follows reading order, and that focus stays visible. | WCAG 2.1.1 (not settled); WCAG 2.4.3 (not settled); WCAG 2.4.7 (not settled) |

### `media-alternative-transcript-evidence`

**Time-based media: transcript or text alternative evidence**

manual · WCAG 1.2.1 (A) · confidence low · default severity moderate

Finds audio and video elements where a transcript or other text alternative is not strongly evidenced in the page content. This rule is conservative and reports cantTell when evidence is missing or cannot be verified.

**Applies to.** Any eligible &lt;audio&gt; or &lt;video&gt; element in the composed DOM.

**Expectation.** If a strong transcript/text-alternative signal is present (e.g., aria-describedby binding to a visible transcript block, or a nearby clearly labeled Transcript section/link), no occurrence is reported. Otherwise, the rule reports cantTell (insufficient evidence) for that media element.

**What a finding reports.**

- `evidence.strength`: how strong the transcript signal found near the media is: `none` (`transcriptNotDetected`) or `weak` (`transcriptEvidenceUnverified`).
- `evidence.method`: what was found: `none`, `anchor-unverified` (a transcript link to a part of the same page that does not look like a transcript) or `external-link` (a transcript link to another page, which is not followed).
- `evidence.transcriptLinkHref` (a weak signal): the transcript link's `href`.
- `evidence.transcriptNodeSelector` (a weak signal): a selector for the transcript link.
- `evidence.notes`: short English notes on what was found. Empty when nothing was.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `transcriptNotDetected` | cantTell | No transcript or other text alternative was found near an &lt;audio&gt; or &lt;video&gt;. | WCAG 1.2.1 (not settled); G158; G159 |
| `transcriptEvidenceUnverified` | cantTell | A link that may lead to a transcript was found, but the page does not show that it is one. | WCAG 1.2.1 (not settled); G158; G159 |

### `menuitem-name-present`

**Menu items have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that menu items (role="menuitem*", including checkbox/radio variants) expose a non-empty accessible name.

**Applies to.** Applies to elements whose role attribute resolves to menuitem, menuitemcheckbox or menuitemradio (the first token naming a known role, matched case-insensitively, so role="foo menuitem" and role="MENUITEM" count) that are included in the accessibility tree. A custom element whose ElementInternals give it one of those roles (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or, all three roles being name-from-content, from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The menu item has no accessible name from aria-label, aria-labelledby, title or its content. | WCAG 4.1.2; F68; accname 1.2; ACT m6b1q3; ACT e086e5 |
| `name_closedContent` | cantTell | The menu item may take its name from content inside a closed shadow root, which no script can read, so whether it has a name could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |
| `name_contentTooDeep` | cantTell | The menu item's content is nested too deeply for its name to be worked out, so whether it has a name could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `meta-refresh-no-exceptions`

**Page must not use a timed meta refresh (AAA)**

automatic · WCAG 2.2.4, 3.2.5 (AAA) · confidence high · default severity moderate

Checks that &lt;meta http-equiv="refresh"&gt; does not set a positive delay, however long; an immediate redirect (delay 0) passes. This is the stricter AAA-level counterpart of the A-level check, which exempts delays over 20 hours.

**Applies to.** Applies to the first &lt;meta http-equiv="refresh"&gt; element, in document order, with a valid content attribute, per HTML's shared declarative refresh steps, a document only ever acts on its first valid meta refresh, so a later one (valid or not) is inert and out of scope.

**Expectation.** Running the shared declarative refresh steps against that element's content value results in a delay of exactly 0. An immediate (delay=0) redirect still passes at AAA, same as the A-level rule. There is nothing for a user to be interrupted mid-read by when nothing is displayed first. Any positive delay fails, with none of the A-level rule's &gt;20-hour exemption: at AAA, WCAG 2.2.4 (Interruptions) and 3.2.5 (Change on Request) require that a *timed* automatic context change happen only at the user's request, regardless of how long the timer is.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `META_REFRESH_PRESENT` | fail | The page's meta refresh reloads or redirects it after a positive delay, a timed change the user did not ask for. | WCAG 2.2.4; WCAG 3.2.5; ACT bisz58; F40; F41; HTML meta refresh |

### `meta-refresh-timing-absent`

**Page must not use a timed meta refresh**

automatic · WCAG 2.2.1, 2.2.4, 3.2.5 (A, AAA, AAA) · confidence high · default severity serious

Checks that &lt;meta http-equiv="refresh"&gt; does not impose a positive delay of 20 hours or less.

**Applies to.** Applies to the first &lt;meta http-equiv="refresh"&gt; element, in document order, whose content attribute has a parseable leading delay value. Per HTML's shared declarative refresh steps, a document only ever acts on its first valid meta refresh; any later one (valid or not) is inert markup a browser never processes, so it is not evaluated.

**Expectation.** The delay is 0 (an immediate redirect, which users cannot be caught by mid-read), or exceeds 20 hours. Any other positive delay refreshes or redirects the page on a timer the user did not initiate and cannot pause, stop, or extend, which WCAG 2.2.1 (Timing Adjustable) requires be possible.

**What a finding reports.**

- `delay`: the time before the page refreshes or redirects, in seconds. A failure is above 0 and at most 72000 (20 hours).

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `META_REFRESH_DELAYED` | fail | The page's meta refresh reloads or redirects it after a delay above 0 and at most 20 hours, which the user cannot turn off, adjust or extend. | WCAG 2.2.1; WCAG 2.2.4; WCAG 3.2.5; ACT bc659a; F40; F41; HTML meta refresh |

### `meta-viewport-large`

**Viewport meta tag should allow zooming up to 500%**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that &lt;meta name="viewport"&gt; does not set user-scalable=no or maximum-scale below 5 (500%).

**Applies to.** Applies to &lt;meta name="viewport"&gt; elements that carry a non-empty content attribute.

**Expectation.** The content attribute does not block zoom with user-scalable, and does not set maximum-scale below 5 (500%), read as browsers read it, the same way meta-viewport-zoom-enabled reads it. This is the AAA-level, stricter counterpart of meta-viewport-zoom-enabled (which enforces the AA 200% minimum as a hard, WCAG-normative fail); this rule is advisory best-practice guidance toward the higher AAA bar.

**What a finding reports.**

- `reasons`: each setting in the content attribute that limits zoom, as written there in lowercase, such as `user-scalable=no` or `maximum-scale=2` (below 5).

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `VIEWPORT_ZOOM_BELOW_500` | cantTell | The viewport meta tag blocks zoom or caps it below 500%. | WCAG 1.4.4 (best practice); CSS Viewport meta viewport |

### `meta-viewport-zoom-enabled`

**Viewport meta tag must not disable zoom**

automatic · WCAG 1.4.4 (AA) · confidence high · default severity serious

Checks that &lt;meta name="viewport"&gt; does not set user-scalable=no or maximum-scale below 2 (200%).

**Applies to.** Applies to &lt;meta name="viewport"&gt; elements whose content attribute sets maximum-scale or user-scalable. Content setting neither cannot restrict zoom.

**Expectation.** user-scalable is absent, yes, device-width, device-height, or a number outside the range -1 to 1; and maximum-scale is absent, device-width, device-height, negative, or 2 or more. Anything else stops the user zooming text to 200%, which WCAG 1.4.4 (Resize Text) requires.

**What a finding reports.**

- `reasons`: the settings that restrict zoom, one per item, written as in the `content` attribute (`user-scalable=no`, `maximum-scale=1`).

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `VIEWPORT_ZOOM_RESTRICTED` | fail | The viewport meta tag disables zoom or caps it below 200%. | WCAG 1.4.4; ACT b4f0c3; CSS Viewport meta viewport |

### `meter-name-present`

**Meters have an accessible name**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that elements with role="meter" expose a non-empty accessible name.

**Applies to.** Applies to elements whose role attribute resolves to meter (the first token naming a known role, matched case-insensitively, so role="foo meter" and role="METER" count) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope. A custom element whose ElementInternals give it the role (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="meter" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom meter widget is not reliably exposed as its name.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The meter has no accessible name from aria-label, aria-labelledby or title. | WCAG 1.1.1; accname 1.2; WAI-ARIA 1.2 meter role |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 1.1.1 (not settled); accname 1.2 (not settled) |

### `mouse-only-event-handlers`

**Pointer-only event handlers should have a keyboard-reachable equivalent**

manual · WCAG 2.1.1, 2.1.3 (A, AAA) · confidence low · default severity moderate

Flags elements with a pointer-only event handler (onmouseover, onmouseout, onmousedown, onmouseup, ondblclick, onmousemove, onmouseenter, onmouseleave), inline or, with the listener hook, added from script, and no keyboard-reachable equivalent (onkeydown/onkeyup/onkeypress/onfocus/onblur), for manual review.

**Applies to.** Elements carrying at least one inline pointer-only event-handler attribute (`onmouseover`, `onmouseout`, `onmousedown`, `onmouseup`, `ondblclick`, `onmousemove`, `onmouseenter`, `onmouseleave`) with a non-empty value, or, where the page runs the listener hook (`listenerHookScript`), a listener of one of those types added from script (`addEventListener` or the `on…` property), that are also eligible/reachable (not hidden/`aria-hidden`/`display:none`).

**Expectation.** The element also carries at least one keyboard-reachable inline handler: `onkeydown`, `onkeyup`, `onkeypress` (the direct keyboard- event equivalents), or `onfocus`/`onblur` (the standard substitute for hover-triggered behavior: focus/blur are the keyboard- navigable analog to mouseover/mouseout, per WCAG technique G90). A handler is reachable only if keyboard events can reach it: `onfocus`/`onblur` when the element itself can take focus, and a key handler when the element or one of its descendants can (key events bubble, focus events do not). Otherwise the element's mouse-driven behavior (a hover tooltip, a custom dropdown, a drag interaction) has no way to be triggered by a keyboard-only user, and it is flagged with a reason saying whether the keyboard handlers are missing or cannot run. With the listener hook, a key, focus or blur listener added from script on the element counts as the matching inline handler does, and so do `focusin`/`focusout` listeners, which, like key events, also fire for a focused descendant.

**What a finding reports.**

- `mouseAttrs`: the pointer-only handlers the element has. One item is an attribute name, such as `onmouseover`; a listener added from script is named as the attribute of its type.
- `keyboardAttrs` (handlers that cannot run, `MOUSE_ONLY_HANDLER_KEYBOARD_EQUIVALENT_NOT_FOCUSABLE`): the keyboard handler attributes the element carries, which keyboard events cannot reach. One item is an attribute name, such as `onfocus`.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `MOUSE_ONLY_HANDLER_NO_KEYBOARD_EQUIVALENT` | cantTell | The element has pointer-only event handlers and no key, focus or blur handler. | WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled); F54 |
| `MOUSE_ONLY_HANDLER_KEYBOARD_EQUIVALENT_NOT_FOCUSABLE` | cantTell | The element has pointer-only event handlers, and its keyboard handlers cannot run because neither it nor anything inside it can take focus. | WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled); F54 |

### `moving-content-pausable`

**Content that moves by itself can be paused, stopped or hidden**

manual · WCAG 2.2.2 (A) · confidence low · default severity moderate

Asks about elements animated when the page loads, for more than five seconds or without end, whether the movement can be paused, stopped or hidden.

**Applies to.** Elements with an animation running when the scan starts, a CSS animation, a CSS transition or one a script started, on a time-based timeline (not scroll-driven), that is rendered, and that lasts more than five seconds from its start (its delay and every iteration) or never ends. Such motion started without the user asking for it. Without a browser's getAnimations (jsdom) nothing is applicable.

**Expectation.** WCAG 2.2.2 asks that moving, blinking or scrolling content that starts automatically, lasts more than five seconds and is shown beside other content can be paused, stopped or hidden, unless the movement is essential. Whether a control does that, and whether the movement is essential, is for a person to check, so each element is asked about (cantTell), once, however many animations it runs.

**What a finding reports.**

- `reasonCode`: `MOVING_CONTENT_LOOPS` for an animation that never ends, `MOVING_CONTENT_OVER_5S` for one that ends after more than five seconds.
- `animations`: the element's animations, up to five, each with its `kind` (`css-animation`, `css-transition` or `script`), `name` (the animation name or transitioned property, '' when it has none) and `endTime`, in milliseconds from its start, `null` when it never ends.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `MOVING_CONTENT_LOOPS` | cantTell | The element runs an animation that started by itself and never ends; whether it can be paused, stopped or hidden, or is essential, is for a person to check. | WCAG 2.2.2 (not settled) |
| `MOVING_CONTENT_OVER_5S` | cantTell | The element runs an animation that started by itself and lasts more than five seconds; whether it can be paused, stopped or hidden, or is essential, is for a person to check. | WCAG 2.2.2 (not settled) |

### `nested-interactive-controls-absent`

**Interactive controls must not be nested**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that an interactive control (link, button, form control, or ARIA widget role) does not contain another interactive control.

**Applies to.** Applies to elements matching the interactive-control set (native a[href], button, input (not hidden), select, textarea; or an explicit ARIA widget role: button, link, checkbox, radio, switch, tab, textbox, combobox, listbox, menuitem, menuitemcheckbox, menuitemradio, option, slider, spinbutton, searchbox, treeitem, taken from the role attribute's first token naming a known role, matched in any case, so role="foo button" and role="BUTTON" count and role="none button" does not). The container is applicable regardless of whether it is itself focusable, focusability is only used to decide whether a *descendant* nests an interactive control. A custom element whose ElementInternals give it one of those widget roles (this.attachInternals().role), with no role attribute naming another, counts as a native element with that role does.

**Expectation.** The element does not contain, as a descendant, another *operable* interactive control (e.g. a &lt;button&gt; wrapping a &lt;select&gt;, or a link containing a checkbox). Nested interactive controls are not reliably announced or operable via assistive technology, activating the outer control and the inner one become ambiguous, and some AT only exposes one of the two.

**What a finding reports.**

- `nestedElements`: the controls nested inside this one, one tag name per control.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `NESTED_INTERACTIVE_CONTROL` | fail | An interactive control contains another control that can take focus, such as a button inside a link. | WCAG 4.1.2; HTML interactive content (MUST); WAI-ARIA 1.2 presentational children |

### `no-autoplay-audio`

**Autoplaying audio should provide a pause/stop or volume-control mechanism**

manual · WCAG 1.4.2 (A) · confidence low · default severity moderate

Flags &lt;audio&gt;/&lt;video&gt; elements that autoplay unmuted with no native controls attribute, and &lt;embed&gt;, &lt;object&gt; or &lt;bgsound&gt; elements that may play sound, for manual review against the 3-second exemption in WCAG 1.4.2.

**Applies to.** Any &lt;audio autoplay&gt; or &lt;video autoplay&gt; element that is not `muted`. Also any &lt;bgsound&gt;, and any &lt;embed&gt; or &lt;object&gt; that loads sound or video, or a plugin (Flash) that may play it: its `type` is audio/*, video/* or a plugin type, or its `src`/`data` ends in a sound or video file extension. An &lt;embed&gt; or &lt;object&gt; with `autostart` or `autoplay` set to false (attribute or &lt;param&gt;) is left out.

**Expectation.** SC 1.4.2 only applies when audio plays automatically for MORE than 3 seconds; clip duration is not knowable from static markup (jsdom does not decode media), so this rule cannot determine whether the SC even applies to a given element. It is authored as `type: 'manual'` (cantTell-capped, never fail) on purpose rather than guessing: an autoplaying unmuted element with no `controls` attribute (the native, statically-verifiable mechanism to pause/stop or adjust volume) is flagged for human review rather than treated as a deterministic violation.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `AUTOPLAY_NO_CONTROLS_MECHANISM` | cantTell | An unmuted &lt;audio&gt; or &lt;video&gt; plays automatically with no native controls to pause, stop or turn down its sound. | WCAG 1.4.2 (not settled); F23; ACT 80f0bf; ACT 4c31df |
| `AUTOPLAY_CONTROLS_HIDDEN` | cantTell | An unmuted &lt;audio&gt; or &lt;video&gt; plays automatically and has native controls, but it is hidden, so the controls cannot be reached. | WCAG 1.4.2 (not settled); F23; ACT 4c31df |
| `EMBEDDED_SOUND_SOURCE` | cantTell | An &lt;embed&gt;, &lt;object&gt; or &lt;bgsound&gt; may play sound when the page loads, with no controls the rule can read. | WCAG 1.4.2 (not settled); F23 |

### `object-text-alternative-present`

**&lt;object&gt; must provide a text alternative**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that &lt;object&gt; elements provide a text alternative via fallback content or an accessible name.

**Applies to.** Applies to &lt;object&gt; elements included in the accessibility tree. Hidden objects are excluded whether or not they are focusable. role="presentation"/role="none" are excluded only when not focusable. An object whose `type` attribute, or failing that its `data` URL's file extension, names a resource that is not an image, audio or video (an HTML page, a PDF, plain text) is excluded too: it renders no non-text content, so 1.1.1 asks nothing of it (ACT 8fc3b6's applicability). An object whose type cannot be told from markup stays in scope.

**Expectation.**

Each applicable &lt;object&gt; provides a text alternative via:

- fallback content (non-empty text content inside &lt;object&gt;), OR
- an accessible name (aria-labelledby/aria-label), OR
- a title attribute (best-effort fallback).

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_ALTERNATIVE_MISSING` | fail | An &lt;object&gt; that may render non-text content has no fallback text and no name from aria-label, aria-labelledby or title. | WCAG 1.1.1; H53; ACT 8fc3b6 |

### `object-text-alternative-quality`

**&lt;object&gt; text alternative must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;object&gt; elements with detected fallback or name for human review of equivalence and appropriateness.

**Applies to.** Applies to &lt;object&gt; elements that already carry a text alternative: fallback text content, a non-empty aria-label, an aria-labelledby that resolves to non-empty text, or a non-empty title. An &lt;object&gt; with none of those is object-text-alternative-present's failure, not a quality question. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

**What a finding reports.**

- `reasonCode`: `TEXT_ALTERNATIVE_REVIEW`.
- `fallbackText`: the text content inside the &lt;object&gt;, trimmed, or `null` when there is none.
- `ariaLabel`: the `aria-label` value, or `null` when there is none.
- `ariaLabelledBy`: the `aria-labelledby` value, the ids it points to, or `null` when there is none.
- `ariaLabelledByText`: the text of the elements `aria-labelledby` points to. Only looked up when there is no `aria-label`; `null` otherwise or when it resolves to nothing.
- `title`: the `title` value, or `null` when there is none.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_ALTERNATIVE_REVIEW` | cantTell | An &lt;object&gt; has a text alternative, and a person checks that it describes the object's content. | WCAG 1.1.1 (not settled); H53 |

### `option-name-present`

**Options have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="option" expose a non-empty accessible name.

**Applies to.** Applies to elements whose role attribute resolves to option (the first token naming a known role, matched case-insensitively, so role="foo option" and role="OPTION" count) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope. A custom element whose ElementInternals give it the role (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or, role="option" being name-from-content, from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The option has no accessible name from aria-label, aria-labelledby, title or its content. | WCAG 4.1.2; F68; accname 1.2; WAI-ARIA 1.2 option role |
| `name_closedContent` | cantTell | The option may take its name from content inside a closed shadow root, which no script can read, so whether it has a name could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |
| `name_contentTooDeep` | cantTell | The option's content is nested too deeply for its name to be worked out, so whether it has a name could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `p-as-heading`

**Text styled to look like a heading should probably be a real heading**

manual · WCAG 1.3.1 (A) · confidence low · default severity minor

Flags short &lt;p&gt; and &lt;div&gt; elements whose text is all bold and rendered at &gt;=18px, for manual review of whether a real heading element should be used instead.

**Applies to.** `<p>` elements, and `<div>` elements that hold only text and inline markup, whose visible text is short (&lt;=120 char) and non-empty, and in which every visible piece of text is bold (computed `font-weight` &gt;= 700, however it got there: on the element itself, a `<strong>`/`<b>` or a styled `<span>`) and rendered at &gt;=18px. Visible text is the text that is rendered (not display:none, [hidden] or visibility:hidden) and not screen-reader-only. Text that is all inside controls (a widget's or a &lt;label&gt;'s own text) is left out.

**Expectation.** Text styled to visually read as a heading (bold, larger-than-body size, short) should be marked up with a real heading element (`<h1>`-`<h6>` or `role="heading"`) so its structural role is programmatically determinable, the same 1.3.1 concern as any other "structure conveyed through presentation only" issue.

**What a finding reports.**

- `reasonCode`: `HEADING_LIKE_NUMBER` when the text is only a number (digits with spacing and punctuation: "2024", "No 12" is not one), `HEADING_LIKE_LINK` when it is all inside one link, so a report can set either kind aside as a group; otherwise `BOLD_LARGE_PARAGRAPH` for a &lt;p&gt; and `BOLD_LARGE_DIV` for a &lt;div&gt;. All are asked about.
- `fontSizePx`: the font size of the text as drawn, in CSS pixels (the computed size times CSS zoom, an SVG transform or what font-size-adjust scales the font by), the smallest one when the pieces differ, against the 18px threshold.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `BOLD_LARGE_PARAGRAPH` | cantTell | A short p whose visible text is all bold and at least 18px may be a heading shown only by its style. | WCAG 1.3.1 (not settled); H42; F2 |
| `BOLD_LARGE_DIV` | cantTell | A short div of text and inline markup, all bold and at least 18px, may be a heading shown only by its style. | WCAG 1.3.1 (not settled); H42; F2 |
| `HEADING_LIKE_LINK` | cantTell | Bold, large, short text that is all inside one link may be a heading shown only by its style. | WCAG 1.3.1 (not settled); H42; F2 |
| `HEADING_LIKE_NUMBER` | cantTell | Bold, large text that is only a number, such as a year, may be a heading shown only by its style. | WCAG 1.3.1 (not settled); H42; F2 |

### `page-has-heading-one`

**Page should have a level-one heading**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the page has at least one level-one heading (&lt;h1&gt; or role="heading" with aria-level="1").

**Applies to.** Always applicable to any HTML document with a &lt;body&gt; element: "does the page have an h1" is a whole-page concern, matching bypass-blocks-present's pattern of evaluating the document directly. Not while a modal dialog is open: the rest of the page is inert then, so the scan sees the dialog, not the page. A custom element whose ElementInternals give it the heading role (this.attachInternals().role) and level 1 (its aria-level attribute or its internals' ariaLevel) counts as an &lt;h1&gt;. A native &lt;hx&gt; marked role="none" or "presentation" is still a heading when it can take focus or carries a global ARIA attribute, as WAI-ARIA's presentational roles conflict resolution has browsers ignore that role then. A native &lt;hx&gt; with a valid aria-level (a positive integer) has that level, as browsers expose it: &lt;h2 aria-level="1"&gt; is a level-one heading and &lt;h1 aria-level="2"&gt; is not, as heading-order reads them.

**Expectation.** At least one heading with level 1 exists (native &lt;h1&gt;, or role="heading" with aria-level="1"). A page with no top-level heading has no clear entry point for assistive technology users navigating by heading.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `HEADING_ONE_MISSING` | cantTell | The page exposes no level-one heading to assistive technology. | G141 (best practice); WAI-ARIA 1.2 heading role |

### `page-title-patterns`

**Page title patterns that may be insufficiently descriptive**

manual · WCAG 2.4.2 (A) · confidence medium · default severity minor

Identifies page title patterns that may indicate low descriptiveness, such as generic, duplicated, or overly templated titles. This rule provides review signals and does not fail automatically.

**Applies to.** Applies to a run over a whole document whose &lt;title&gt; resolves to non-empty text. The title element is the first HTML &lt;title&gt; anywhere in the document, as for document.title, so one the parser left in &lt;body&gt; counts; a missing or empty title is page-title-present's failure, not a pattern to review. A run narrowed by contextSelector or by engineOptions.fragment is notApplicable, as is a title matching none of the patterns below.

**Expectation.** The title carries none of the conservative low-descriptiveness signals: one of the generic titles home, homepage, welcome, untitled, page or document; fewer than eight characters; or a template shape pairing a generic token with a brand, such as "Home | Brand". When the crawl.pageTitles probe supplies at least ten pages, cross-page signals are used instead: one title repeated across distinct URLs, or a prefix or suffix of twelve characters or more shared across the set. Every signal is reported as cantTell: whether a title describes its page is a judgment, so the rule never fails on a pattern alone.

**What a finding reports.**

- `titleText` (a single-page signal: `genericTitle`, `veryShortTitle`, `templateLikeTitle`): the page title, with spacing collapsed.
- `metrics.pagesAnalyzed` (a cross-page signal): how many pages with a URL and a title were compared.
- `metrics.duplicateGroups` (a cross-page signal): how many titles are used by two or more URLs, compared without regard to case.
- `metrics.largestDuplicateGroupSize` (a cross-page signal): how many URLs share the most-repeated title. 0 when no title repeats.
- `metrics.sharedPrefix`, `metrics.sharedSuffix` (a cross-page signal): the start or end of the title that every page shares, when it is 12 characters or more. Empty otherwise.
- `refs.exampleDuplicateTitles` (a cross-page signal): up to three repeated titles. One item is the `title` and up to five of the `urls` that use it.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `genericTitle` | cantTell | The page title is a generic word such as home, welcome or untitled; whether it describes the page is for a person to judge. | WCAG 2.4.2 (not settled); F25 (not settled) |
| `veryShortTitle` | cantTell | The page title is under eight characters; whether so short a title describes the page is for a person to judge. | WCAG 2.4.2 (not settled) |
| `templateLikeTitle` | cantTell | The page title pairs a site name with a generic word such as home or welcome, so it may be a template's. | WCAG 2.4.2 (not settled); F25 (not settled) |
| `duplicateTitlesAcrossPages` | cantTell | Several pages of the scan share the same title, which may not tell them apart. | WCAG 2.4.2 (not settled); F25 (not settled) |
| `templatedTitlesAcrossPages` | cantTell | The pages' titles share a long common start or end, so the part that names each page may be small. | WCAG 2.4.2 (not settled) |

### `page-title-present`

**Page has a non-empty title**

automatic · WCAG 2.4.2 (A) · confidence high · default severity serious

Checks that the page includes a non-empty &lt;title&gt; element.

**Applies to.** Applies to a run over a whole HTML document, one whose document element is &lt;html&gt;; an SVG document opened on its own is notApplicable. A run narrowed by contextSelector, or by engineOptions.fragment, is notApplicable: whether the page has a title is not a property any subtree can answer.

**Expectation.** The document has a &lt;title&gt; element, and document.title with whitespace collapsed is non-empty. The element is looked for anywhere in the document, not only inside &lt;head&gt;: a &lt;title&gt; the parser leaves outside &lt;head&gt; is still the document title in every browser. Only an HTML-namespace &lt;title&gt; counts; the &lt;title&gt; of an inline &lt;svg&gt; names the graphic, so a page whose only &lt;title&gt; is inside an &lt;svg&gt; is missing its title element. Whether that title describes the page is page-title-patterns' question.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `missingTitleElement` | fail | The page has no &lt;title&gt; element. | WCAG 2.4.2; ACT 2779a5; H25 |
| `emptyTitleText` | fail | The page has a &lt;title&gt; element, but its text is empty or only whitespace. | WCAG 2.4.2; ACT 2779a5; H25 |

### `password-paste-enabled`

**Authentication fields must not block pasting**

manual · WCAG 3.3.8 (AA) · confidence medium · default severity serious

Checks that a password or one-time-code field carries no inline paste handler that cancels the paste, which would remove the password manager or clipboard that WCAG 3.3.8 relies on as the assisting mechanism.

**Applies to.** Applies to any control whose autocomplete token is current-password, new-password or one-time-code, and to &lt;input type="password"&gt; unless its autocomplete names another purpose. A disabled or readonly field takes no input to block, and one outside the accessibility tree is not being asked for, so neither is in scope.

**Expectation.** A reviewer confirms the field can still be pasted into. Remembering a password is a cognitive function test, and 3.3.8 asks for a mechanism that helps the user through one; a password manager, or the clipboard for a one-time code, is that mechanism.

**What a finding reports.**

- `handler`: the field's `onpaste` attribute value, with spacing collapsed. It only cancels the paste (`PASTE_CANCELLED`) or calls other script that may or may not (`PASTE_HANDLER_OPAQUE`).

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `PASTE_CANCELLED` | cantTell | The authentication field has an inline paste handler whose only effect is to cancel the paste, which may stop a password manager or the clipboard filling it. | WCAG 3.3.8 (not settled) |
| `PASTE_HANDLER_OPAQUE` | cantTell | The authentication field has an inline paste handler that calls other script, so whether it blocks pasting could not be told. | WCAG 3.3.8 (not settled) |

### `presentation-role-conflict`

**Presentational role must not conflict with a global ARIA attribute or focusability**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that role="presentation"/"none" (including an &lt;img alt=""&gt; implicit presentation role) is not combined with a global ARIA attribute (aria-label, aria-hidden, aria-describedby, ...) or focusability (tabindex/native).

**Applies to.** Applies to elements whose role attribute resolves to presentation or none (the first token naming a known role, matched case-insensitively, so role="foo none" and role="NONE" count), OR an &lt;img alt=""&gt; carrying no explicit role of its own (empty alt gives an &lt;img&gt; an implicit presentation role per HTML-AAM, even with no explicit role attribute at all: `img[alt=''], [role~="none" i], [role~="presentation" i]`).

**Expectation.** The element does not also carry a WAI-ARIA *global* state/property (aria-label, aria-hidden, aria-describedby, aria-live, aria-current, ...; the full global-attribute set, not just the naming ones), AND is not focusable. Per the WAI-ARIA spec's Presentational Roles Conflict Resolution section, a presentational role is "restored" to the element's implicit semantic role when either condition holds: the presentation/none role silently stops working, contradicting the author's evident intent to hide the element from the accessibility tree.

**What a finding reports.**

- `role`: the presentational role in effect: `presentation` or `none`. An &lt;img alt=""&gt; with no role of its own reports `presentation`.
- `conflictingAttrs`: the global ARIA attributes the element carries, whatever their value. One item is an attribute name, such as `aria-label`. Empty when the element has `aria-hidden="true"` or only its focusability conflicts.
- `focusable`: `true` when the element can take focus, which also restores its role.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `PRESENTATION_ROLE_CONFLICT` | cantTell | An element with role="presentation" or "none", or an &lt;img alt=""&gt;, that carries a global aria-* attribute or can take focus, so browsers expose its own role again. | WAI-ARIA 1.2 presentational roles conflict resolution (best practice); ACT 46ca7f; HTML-AAM img |

### `presentational-children-focusable-absent`

**Roles with presentational children must not contain focusable content**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that an element whose role makes its children presentational (button, checkbox, img, option, radio, slider, switch, tab, ...) contains no descendant that takes a tab stop.

**Applies to.** Applies to elements whose semantic role is one of the WAI-ARIA roles defined as having presentational children (button, checkbox, img, menuitemcheckbox, menuitemradio, meter, option, progressbar, radio, scrollbar, separator, slider, switch, tab, plus doc-pagebreak and graphics-symbol from the DPUB-ARIA/Graphics-ARIA modules, which inherit the same trait). The role can be explicit (role="tab") or native (&lt;button&gt;, &lt;meter&gt;, &lt;progress&gt;, &lt;option&gt;). A custom element whose ElementInternals give it one of those roles (this.attachInternals().role), with no role attribute naming another, counts as a native element with that role does.

**Expectation.** No descendant of the element is part of sequential focus navigation. The presentational-children mechanism removes every descendant from the accessibility tree, so a descendant that still takes a tab stop receives focus with no role and no name to announce.

**What a finding reports.**

- `role`: the role that makes the element's children presentational.
- `focusableElements`: the tag name of each tab stop found inside the element, one item per tab stop, in document order.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `PRESENTATIONAL_CHILDREN_FOCUSABLE_CONTENT` | fail | An element whose role makes its children presentational, such as a button or a tab, contains a tab stop, which gets focus with no role or name to announce. | WCAG 4.1.2; ACT 307n5z; WAI-ARIA 1.2 presentational children |

### `progressbar-name-present`

**Progress bars have an accessible name**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that elements with role="progressbar" expose a non-empty accessible name.

**Applies to.** Applies to elements whose role attribute resolves to progressbar: its first token naming a known role, matched in any case, is progressbar, so role="foo progressbar" and role="PROGRESSBAR" count while role="link progressbar" (a link) does not. The element must be included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope. A custom element whose ElementInternals give it the role (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="progressbar" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom progressbar widget is not reliably exposed as its name. On a labelable element (&lt;progress role="progressbar"&gt;) an associated &lt;label&gt; counts as well.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The progress bar has no accessible name from aria-label, aria-labelledby, title or an associated label. | WCAG 1.1.1; accname 1.2; WAI-ARIA 1.2 progressbar role |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 1.1.1 (not settled); accname 1.2 (not settled) |

### `region`

**Page content should be inside a landmark region**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that content under &lt;body&gt; is contained within a landmark region.

**Applies to.** Applies to a page whose &lt;body&gt; has content: outside any landmark, an element with text of its own or an aria-label, an &lt;img&gt;, &lt;video&gt;, &lt;audio&gt;, &lt;canvas&gt;, &lt;object&gt; or &lt;embed&gt;, or an &lt;input&gt; other than type="hidden"; or a landmark with anything in it. Live regions, dialogs, buttons, &lt;svg&gt;, &lt;iframe&gt;/&lt;frame&gt; and resolvable skip links are not content that needs a landmark. Not while a modal dialog is open: the rest of the page is inert then, so the scan sees the dialog, not the page. Content matched by excludeSelectors (global or for this rule) is left out, and a reported gap never takes it in. A custom element whose ElementInternals give it a landmark role (this.attachInternals().role), with no role attribute naming another, is a landmark as a native element with that role is.

**Expectation.** Every top-level piece of page content lives inside a landmark region (main, navigation, banner, contentinfo, complementary, region, form, search), so assistive technology users navigating by landmark do not miss content that was never placed inside one.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `CONTENT_OUTSIDE_LANDMARK` | cantTell | Content on the page, or an iframe whose content can't be seen from the page, is outside every landmark region. | WAI-ARIA 1.2 landmark role (best practice); ARIA11 |

### `role-img-text-alternative-present`

**[role="img"/"graphics-symbol"/"graphics-document"] must have an accessible text alternative**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that elements with role="img", "graphics-symbol" or "graphics-document" provide an accessible text alternative using aria-label, aria-labelledby, a title attribute, or (for SVG elements) a child &lt;title&gt;.

**Applies to.** Applies to elements whose role attribute resolves to img, graphics-symbol or graphics-document (the first known role token of the fallback list, matched in any case) that are included in the accessibility tree (ACT 23a2a8's "programmatically hidden" exemption: display:none/visibility:hidden/aria-hidden="true" on the element or an ancestor, with no carve-out for focusable or IDREF-referenced elements, aria-hidden-focus and duplicate-id-aria own those separately). Per ACT 7d6734, this reaches any element carrying one of these roles, not only the &lt;svg&gt; root, e.g. a &lt;circle role="graphics-symbol"&gt; nested inside a plain &lt;svg&gt;. Every &lt;svg&gt; element itself is left to svg-text-alternative-present's own (already ACT-clean) title/aria-name handling, so an unnamed &lt;svg role="img"&gt; is reported once, there; the &lt;img&gt; tag is excluded here since it has its own dedicated rule. A custom element whose ElementInternals give it one of those roles (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.**

Each applicable element has an accessible text alternative:

- aria-label with a non-empty value; OR
- aria-labelledby referencing at least one existing element that contributes non-empty text; OR
- a non-empty title attribute (last-resort accessible-name source per HTML-AAM); OR
- for an SVG-namespace element, a non-empty direct child &lt;title&gt;, wherever it is among the children (SVG-AAM's own naming mechanism, not only for the &lt;svg&gt; root); the first one counts.

**What a finding reports.**

- `ariaLabel`: the element's `aria-label` with surrounding whitespace removed, or null when it has none.
- `ariaLabelledby`: the element's `aria-labelledby` id list with surrounding whitespace removed, or null when it has none.
- `accessibleNameInfo` (`nameNotResolved`): the accessible name the element ends up with: `present`, `value`, `mechanism` (where the name came from, such as `aria-labelledby`) and `flags` (notes on what went wrong, such as `idref-missing` for a reference to an id that does not exist). Null on the other findings.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `missingTextAlternative` | fail | An element with role img, graphics-symbol or graphics-document has no aria-label, aria-labelledby, title or SVG &lt;title&gt; child. | WCAG 1.1.1; ACT 23a2a8; ACT 7d6734; WAI-ARIA 1.2 img role (MUST) |
| `emptyAriaLabel` | fail | The element's aria-label is empty and no title or SVG &lt;title&gt; child names it. | WCAG 1.1.1; ARIA6; ACT 23a2a8; ACT 7d6734; WAI-ARIA 1.2 img role (MUST) |
| `emptyAriaLabelledby` | fail | The element's aria-labelledby is empty and no title or SVG &lt;title&gt; child names it. | WCAG 1.1.1; ARIA10; ACT 23a2a8; ACT 7d6734; WAI-ARIA 1.2 img role (MUST) |
| `nameNotResolved` | fail | The element has a non-empty aria-label or aria-labelledby, but its computed name is empty, for example because aria-labelledby points at ids that do not exist. | WCAG 1.1.1; ACT 23a2a8; ACT 7d6734; accname 1.2 |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 1.1.1 (not settled); accname 1.2 (not settled) |

### `scope-attr-valid`

**scope attribute must have a valid value**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that scope="..." is one of row, col, rowgroup, or colgroup.

**Applies to.** Applies to &lt;th&gt; elements with a non-empty scope attribute. HTML's table model reads scope on &lt;th&gt; only, and browsers ignore it elsewhere (on a &lt;td&gt;, or a custom element's own scope attribute).

**Expectation.** The scope value is one of "row", "col", "rowgroup", or "colgroup" (case-insensitive, and not trimmed: HTML matches the keyword exactly, so scope=" col " is no column header). An invalid scope value is not recognized by assistive technology, silently losing the row/column header association it was meant to declare.

**What a finding reports.**

- `value`: the `scope` value as written.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `SCOPE_ATTR_INVALID` | cantTell | A th has a scope value that is not row, col, rowgroup or colgroup, so it declares no header direction. | HTML table model scope attribute (best practice); H63 |

### `scrollable-region-focusable`

**Scrollable regions with no focusable content should be keyboard-focusable**

manual · WCAG 2.1.1, 2.1.3 (A, AAA) · confidence low · default severity moderate

Flags elements whose CSS declares overflow:auto/scroll, contain no focusable descendant, and are not themselves keyboard-focusable, for manual review of whether their content actually overflows and needs keyboard scroll access.

**Applies to.** Scoped on purpose to a fixed set of likely-to-scroll container tags (div, section, article, aside, main, nav, pre, table, blockquote, ul, ol, textarea) with computed `overflow-x`/`overflow-y` of `auto` or `scroll`, not every element on the page, to keep this deterministic and performant (same style of scope-down as `region`).

**Expectation.** A region whose CSS declares it may scroll (`auto`/`scroll`) should be reachable by keyboard: either it already contains a focusable descendant (a link, button, form control, or `tabindex`-bearing element a keyboard user could tab into and then use arrow keys to scroll from), or the region itself is reached by Tab: a non-negative `tabindex`, or natively, as a `<textarea>` or an editable region is. A disabled `<textarea>` is left out, as a disabled field need not be operable.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `SCROLLABLE_OVERFLOW_NOT_FOCUSABLE` | cantTell | The element's CSS lets it scroll, but neither it nor anything inside it can be reached by keyboard; whether its content really overflows is for a person to check. | WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled); ACT 0ssw9k |

### `searchbox-name-present`

**Searchboxes have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="searchbox" expose a non-empty accessible name.

**Applies to.** Applies to elements whose role attribute resolves to searchbox (the attribute is a fallback list: its first known, non-abstract token, in any case, is the role, so role="foo searchbox" counts and role="link searchbox" does not) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope. A custom element whose ElementInternals give it the role (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="searchbox" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom searchbox widget is not reliably exposed as its name. On a labelable element (&lt;input role="searchbox"&gt;) an associated &lt;label&gt; counts as well. On a text-like &lt;input&gt; or a &lt;textarea&gt;, the placeholder counts last (HTML-AAM's final name source): a placeholder-only label is a 3.3.2 question, not a missing name. An element named by nothing but aria-placeholder fails: accname gives it no name, and only some browsers name it from aria-placeholder.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The search box has no accessible name from aria-label, aria-labelledby, title, an associated label or a placeholder; aria-placeholder alone does not count. | WCAG 4.1.2; F68; accname 1.2; HTML-AAM 4.1.1; WAI-ARIA 1.2 searchbox role; ACT e086e5 |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `server-side-image-map-absent`

**Server-side image maps must have a keyboard-operable alternative**

automatic · WCAG 2.1.1 (A) · confidence high · default severity serious

Asks, for each &lt;img ismap&gt; inside a link, whether the page offers the same destinations as links a keyboard can reach, since a server-side image map has no keyboard-operable regions of its own.

**Applies to.** Applies to any scan scope. An &lt;img ismap&gt; inside an &lt;a href&gt; is a server-side image map: the browser sends the click coordinates to the link's URL, which has no keyboard-operable equivalent and exposes no individual regions to assistive technology.

**Expectation.** Each server-side image map is reported as cantTell: 2.1.1 is met when the same destinations are also offered as links a keyboard can reach, which the rule cannot verify. Client-side image maps (&lt;map&gt;/&lt;area&gt;) are not flagged. A scope with no &lt;img ismap&gt; passes. One whose only &lt;img ismap&gt; elements are outside a link is notApplicable: ismap does nothing there, so there is no server-side image map (the misplaced attribute is invalid HTML, a matter for the validator).

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `SERVER_SIDE_IMAGE_MAP` | cantTell | An &lt;img ismap&gt; in a link is a server-side image map, which a keyboard cannot operate; a person checks that the same destinations are offered as ordinary links. | WCAG 2.1.1 (not settled); HTML img ismap |

### `skip-link`

**Skip link must have a resolvable, usable target**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that a "skip to ..." link's href fragment resolves to a real, currently usable element in the document.

**Applies to.**

Applies to &lt;a href="#fragment"&gt; elements that are skip links by one of two signs:

- the accessible name follows a common skip-link wording in one of the shipped locales: "skip" or "jump to" (English); "aller au contenu", "passer au contenu", "accéder au contenu", "accès direct", "évitement" (French); "springen", "überspringen", "direkt zum", "zum Inhalt" (German); "saltar", "ir al contenido" (Spanish); "スキップ", "本文へ" (Japanese). "jump to" sits beside "skip" because real skip links use both conventions (e.g. a "Jump to section" link);
- or it is the first link in the document, and it comes before the `main` element (or an element whose role attribute resolves to main, its first real role token in any case): the usual place of a skip link whatever its wording.

Other same-page anchor links are not skip links and are left alone. Where the page has no &lt;main&gt; and no role="main", a custom element whose ElementInternals give it the main role (this.attachInternals().role) is the main a link's position is measured against.

**Expectation.** The link's fragment resolves to a real element in the document (via a matching id, or a legacy &lt;a name="..."&gt;), and that target is currently usable (not hidden from the accessibility tree; and, when browser geometry is available, rendered with an area that no ancestor cuts to nothing: one with `overflow: hidden` collapsed to no size, or `overflow: clip` keeping it outside). A skip link whose target is missing or effectively unusable does not provide a reliable bypass destination. An empty target (no element or text inside it), such as `<a id="content" tabindex="-1"></a>` or a legacy `<a name>`, has no area by nature: following the link moves focus, or the sequential focus navigation starting point, to it (HTML, "scroll to the fragment"), so the next Tab goes on from there. What it marks is measured instead: its nearest ancestor with content of its own, such as the &lt;main&gt; it opens. A `display: contents` target has no box of its own, and is measured by its children's.

**What a finding reports.**

- `href`: the link's `href`.
- `unusableReasonCode` (a target that is not usable): why it is not: `ACC_TREE_INELIGIBLE` when it is hidden from the accessibility tree, `NO_CLIENT_RECTS` when it is not rendered, `ZERO_AREA_TARGET` when it, or for an empty target the content it marks, has no area or is cut to nothing.
- `targetSelector` (a target that is not usable): a selector for the target.
- `geometryCheckEnabled` (a target that is not usable): whether the target's geometry could be measured, which needs a browser.
- `viewport.width`, `viewport.height` (a target whose geometry was measured): the viewport the page was laid out in, in CSS pixels. A target hidden at one width can be usable at another.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `SKIP_LINK_TARGET_MISSING` | cantTell | A skip link's fragment matches no element id or legacy anchor name in the document. | G1 (best practice); HTML scroll to the fragment |
| `SKIP_LINK_TARGET_UNUSABLE` | cantTell | A skip link's target exists but is hidden from the accessibility tree, not rendered, or has no area. | G1 (best practice); HTML scroll to the fragment |

### `slider-name-present`

**Sliders have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="slider" expose a non-empty accessible name. A native &lt;input type="range"&gt; is checked by form-control-programmatic-label-present.

**Applies to.** Applies to elements whose role attribute resolves to slider (the attribute is a fallback list: its first known, non-abstract token, in any case, is the role, so role="foo slider" counts and role="link slider" does not) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope. A native &lt;input type="range"&gt; without the role belongs to form-control-programmatic-label-present. A custom element whose ElementInternals give it the role (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="slider" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom slider widget is not reliably exposed as its name. On a labelable element (&lt;input role="slider"&gt;) an associated &lt;label&gt; counts as well. On a text-like &lt;input&gt; or a &lt;textarea&gt;, the placeholder counts last (HTML-AAM's final name source): a placeholder-only label is a 3.3.2 question, not a missing name.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The slider has no accessible name from aria-label, aria-labelledby, title or an associated label. | WCAG 4.1.2; F68; accname 1.2; WAI-ARIA 1.2 slider role; ACT e086e5 |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `spinbutton-name-present`

**Spinbuttons have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="spinbutton" expose a non-empty accessible name.

**Applies to.** Applies to elements whose role attribute resolves to spinbutton: its first token naming a known role, matched in any case, is spinbutton, so role="foo spinbutton" and role="SPINBUTTON" count while role="link spinbutton" (a link) does not. The element must be included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope. A custom element whose ElementInternals give it the role (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="spinbutton" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom spinbutton widget is not reliably exposed as its name. On a labelable element (&lt;input role="spinbutton"&gt;) an associated &lt;label&gt; counts as well. On a text-like &lt;input&gt; or a &lt;textarea&gt;, the placeholder counts last (HTML-AAM's final name source): a placeholder-only label is a 3.3.2 question, not a missing name.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The spin button has no accessible name from aria-label, aria-labelledby, title, an associated label or a placeholder. | WCAG 4.1.2; F68; accname 1.2; HTML-AAM 4.1.1; WAI-ARIA 1.2 spinbutton role; ACT e086e5 |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `summary-name-present`

**Summary elements have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that &lt;summary&gt; elements expose a non-empty accessible name.

**Applies to.** Applies to &lt;summary&gt; elements included in the accessibility tree that work as the summary button of their parent &lt;details&gt;: the first &lt;summary&gt; child of a &lt;details&gt;. Any other &lt;summary&gt; (outside a &lt;details&gt;, nested deeper, or a second one) is not a control at all, it neither takes focus nor toggles anything, so it has nothing to name (as ACT 2t702h has it).

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The summary of a details element has no accessible name from aria-label, aria-labelledby, title or its content. | WCAG 4.1.2; F68; accname 1.2; ACT 2t702h |
| `name_closedContent` | cantTell | The summary may take its name from content inside a closed shadow root, which no script can read, so whether it has a name could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |
| `name_contentTooDeep` | cantTell | The summary's content is nested too deeply for its name to be worked out, so whether it has a name could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `svg-image-text-alternative-present`

**SVG &lt;image&gt; must have a text alternative**

automatic · WCAG 1.1.1 (A) · confidence medium · default severity serious

Checks that SVG &lt;image&gt; elements provide a text alternative via &lt;title&gt;/&lt;desc&gt; or an ARIA accessible name.

**Applies to.** Applies to SVG &lt;image&gt; elements that are exposed to assistive technologies. Elements otherwise hidden from the accessibility tree remain applicable if they are tabbable or referenced by IDREF relationships (per engine eligibility checks). SVG &lt;image&gt; elements whose role attribute resolves to presentation or none (the first known role token, in any case) are excluded only when they are not focusable.

**Expectation.**

Each applicable SVG &lt;image&gt; element has a text alternative via:

- a non-empty direct &lt;title&gt; child, OR
- a non-empty direct &lt;desc&gt; child, OR
- an accessible name (aria-label / aria-labelledby / title attribute).

The first &lt;title&gt; and the first &lt;desc&gt; child count, wherever they are among the children, as SVG-AAM reads them.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_ALTERNATIVE_MISSING` | fail | An SVG &lt;image&gt; has no &lt;title&gt; or &lt;desc&gt; child with text and no name from aria-label, aria-labelledby or title. | WCAG 1.1.1; SVG-AAM; accname 1.2 |

### `svg-text-alternative-present`

**&lt;svg&gt; must provide a text alternative**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that inline &lt;svg&gt; elements provide a text alternative via a &lt;title&gt; element or an ARIA name (a &lt;desc&gt; element alone does not count).

**Applies to.**

Applies to inline &lt;svg&gt; elements that are exposed to assistive technologies AND appear intended to be conveyed. "Intended to be conveyed" is approximated deterministically by at least one of:

- role="img", role="graphics-symbol", or role="graphics-document" on the SVG root element itself (the WAI-ARIA Graphics Module roles, alongside img). Does NOT extend to arbitrary role="img"/"graphics-symbol"/"graphics-document" descendants nested inside an &lt;svg&gt;. This check's scope is the &lt;svg&gt; root only; role-img-text-alternative-present covers those same three roles on any other element, including nested SVG shapes (ACT 7d6734's own failed example: a bare `<svg>` root with a nested `<circle role="graphics-symbol">`).
- a non-blank aria-label / aria-labelledby (aria-label="" names nothing and signals no intent)
- &lt;title&gt; or &lt;desc&gt; present as a direct child, wherever it is among the children (SVG-AAM); the first of each counts (desc alone is an applicability signal only, see @expectation)
- focusable/tabbable (e.g., tabindex, native focusability)

Images with role="presentation" or role="none" are excluded only when they are not focusable. Elements otherwise hidden from the accessibility tree remain applicable if they are tabbable-focusable or referenced by IDREF relationships (per engine eligibility checks).

**Expectation.**

Each applicable &lt;svg&gt; element provides a text alternative via:

- non-empty text in its first direct child &lt;title&gt;, wherever it is among the children (an empty first &lt;title&gt; names nothing), OR
- an ARIA name (aria-label / aria-labelledby).

A &lt;desc&gt; element alone does NOT satisfy this, per the SVG Accessibility API Mappings spec §7.1, &lt;desc&gt; only ever contributes to the accessible DESCRIPTION, never the accessible NAME. An &lt;svg&gt; with only a &lt;desc&gt; and no &lt;title&gt;/ARIA name is still "applicable" (desc signals authorial intent) but fails.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_ALTERNATIVE_MISSING` | fail | An &lt;svg&gt; that appears meant to convey something has no &lt;title&gt; child with text and no name from aria-label or aria-labelledby. | WCAG 1.1.1; ACT 7d6734; SVG-AAM; accname 1.2 |

### `svg-text-alternative-quality`

**&lt;svg&gt; text alternative must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags applicable &lt;svg&gt; graphics with a detected text alternative for human review of appropriateness.

**Applies to.** Applies to inline &lt;svg&gt; elements that already carry a text alternative: non-empty &lt;title&gt; or &lt;desc&gt; text, a non-empty aria-label, or an aria-labelledby that resolves to non-empty text. &lt;desc&gt; counts here as something to review even though it never contributes to the accessible name: that distinction is svg-text-alternative-present's. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

**What a finding reports.**

- `hasNonEmptyTitle`: `true` when the first &lt;title&gt; inside the &lt;svg&gt; has text.
- `hasNonEmptyDesc`: `true` when the first &lt;desc&gt; inside the &lt;svg&gt; has text.
- `ariaLabel`: the `aria-label` value, or `null` when there is none.
- `ariaLabelledBy`: the `aria-labelledby` value, the ids it points to, or `null` when there is none.
- `ariaLabelledByText`: the text of the elements `aria-labelledby` points to, up to 120 characters. Only looked up when there is no `aria-label`; `null` otherwise or when it resolves to nothing.
- `reasonCode`: `IMAGE_ONLY_CONTROL_CONTENT` when the &lt;svg&gt; is the only content of a link or button (no text and no other image in it), so its text alternative is the control's name, with `controlContent` naming the control's role (`link` or `button`); `TEXT_ALTERNATIVE_REVIEW` otherwise.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_ALTERNATIVE_REVIEW` | cantTell | An &lt;svg&gt; has a text alternative, and a person checks that it conveys what the graphic shows. | WCAG 1.1.1 (not settled); ACT qt1vmo; SVG-AAM |
| `IMAGE_ONLY_CONTROL_CONTENT` | cantTell | The &lt;svg&gt; is the only content of a link or button, so its text alternative is the control's name and should say what the control does. | WCAG 1.1.1 (not settled); ACT qt1vmo; accname 1.2 |

### `tab-name-present`

**Tabs have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="tab" expose a non-empty accessible name.

**Applies to.** Applies to elements whose role attribute resolves to tab (the attribute is a fallback list: its first known, non-abstract token, in any case, is the role, so role="foo tab" counts and role="link tab" does not) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope. A custom element whose ElementInternals give it the role (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or, role="tab" being name-from-content, from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The tab has no accessible name from aria-label, aria-labelledby, title or its content. | WCAG 4.1.2; F68; accname 1.2 |
| `name_closedContent` | cantTell | The tab may take its name from content inside a closed shadow root, which no script can read, so whether it has a name could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |
| `name_contentTooDeep` | cantTell | The tab's content is nested too deeply for its name to be worked out, so whether it has a name could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `tabindex`

**tabindex should not be greater than 0**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that tabindex values are 0 or negative, not a positive number.

**Applies to.** Applies to elements with a tabindex attribute whose value parses as a valid integer.

**Expectation.** The tabindex value is 0 or negative. A positive tabindex reorders keyboard tab order explicitly, which is fragile to maintain as a page changes and usually indicates the natural DOM order should be fixed instead.

**What a finding reports.**

- `value`: the `tabindex` value, a whole number above 0.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TABINDEX_POSITIVE` | cantTell | The element has a tabindex above 0, which moves it ahead of the page's natural tab order. | WCAG 2.4.3 (best practice); F44 (not settled) |

### `table-duplicate-name`

**Table caption must not duplicate its summary attribute**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that a &lt;table&gt;'s &lt;caption&gt; text is not identical to its (deprecated) summary attribute.

**Applies to.** Applies to &lt;table&gt; elements that have both a &lt;caption&gt; with text content and a (deprecated but still encountered) summary attribute.

**Expectation.** The caption text and the summary attribute text are not identical (case-insensitive, normalized). When both are present and say the same thing, assistive technology that surfaces both announces the same text twice for one table.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TABLE_CAPTION_SUMMARY_DUPLICATE` | cantTell | The table's caption and its summary attribute say the same text, which may be announced twice. | HTML table element summary attribute (best practice); H39 |

### `table-fake-caption`

**A table's first row should not stand in for a real &lt;caption&gt;**

manual · WCAG 1.3.1 (A) · confidence low · default severity minor

Flags tables with no &lt;caption&gt; whose first row has a single non-empty cell while other rows have multiple cells, for manual review of whether that cell is acting as a fake caption.

**Applies to.** `<table>` elements with no `<caption>` child, at least two rows, and a first row containing exactly one non-empty-text cell while at least one other row has more than one cell. Left out: a table whose role (the first token of its role attribute that names a real role, in any case) is anything but table, grid or treegrid, such as a layout table with role="presentation", which needs no caption; and a table already named by a non-empty aria-label, an aria-labelledby that resolves to text, or a non-empty title, which WCAG accepts as the table's title.

**Expectation.** A single lone cell in the first row, sitting above rows that clearly have multiple columns, strongly suggests the author is using it as a visual caption/title rather than as a real table cell. Structure conveyed only through this positional convention is not programmatically associated with the table the way a real `<caption>` element is (1.3.1).

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `SINGLE_CELL_FIRST_ROW_NO_CAPTION` | cantTell | A table with no caption or name has a first row of one text cell above rows of several cells, which may be a title shown as a cell instead of a caption. | WCAG 1.3.1 (not settled); H39 |

### `table-headers-attr-valid`

**Table cell "headers" attribute must reference valid header cells**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that each id in a &lt;td&gt;/&lt;th&gt; headers attribute resolves to a cell (&lt;td&gt; or &lt;th&gt;) within the same table (not missing, not a non-cell element, not itself).

**Applies to.** Applies to &lt;td&gt;/&lt;th&gt; elements that carry a non-empty headers attribute, within a &lt;table&gt; whose semantic role is still table/grid/treegrid -- an explicit role of anything else (role="presentation"/"none", but also role="heading" or any other real role) replaces the native table semantics, leaving no table for headers to describe. Matches ACT a25f45's applicability.

**Expectation.** Every id token in the headers attribute resolves to an element that: (a) exists, (b) is a cell (&lt;td&gt; or &lt;th&gt;) of the same &lt;table&gt; as the referencing cell, and (c) is not the cell itself. A &lt;td&gt; serving as a header via role="columnheader"/"rowheader" is a valid target, same as a plain &lt;th&gt; -- ACT a25f45 does not require the native tag.

**What a finding reports.**

- `invalid`: one item per id in the headers attribute that does not point at a valid header: `id`, and `reason`, which is `missing` (no element has that id), `self-reference` (the cell points at itself), `not-a-cell` (the element is not a &lt;td&gt; or &lt;th&gt;) or `different-table` (the cell is in another table).

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TABLE_HEADERS_ATTR_INVALID` | fail | A cell's headers attribute names an id that is missing, is the cell itself, is not a cell, or is a cell of another table. | WCAG 1.3.1; H43; ACT a25f45; HTML table model headers attribute (MUST) |

### `table-th-has-data-cells`

**&lt;th&gt; elements must describe at least one data cell**

automatic · WCAG 1.3.1 (A) · confidence high · default severity moderate

Checks that a table containing &lt;th&gt; elements also contains at least one &lt;td&gt; data cell for those headers to describe.

**Applies to.** Applies to &lt;table&gt; elements that keep their table semantics and are included in the accessibility tree, and that contain at least one &lt;th&gt; which is visible, included in the accessibility tree, and not overridden by an explicit role other than rowheader/columnheader. Also applies to the ARIA-only equivalent: an element whose role resolves to grid/treegrid (no native &lt;table&gt; involved) that contains at least one in-scope columnheader/rowheader-role element. Roles are resolved as user agents do: the first token of the role attribute naming a known role, matched in any case; a role attribute with no known token leaves the implicit role in place. In the ARIA-only form, a custom element whose ElementInternals give it the grid, treegrid, header or cell role (this.attachInternals().role), with no role attribute naming another, counts as one with that role attribute does.

**Expectation.** The table also contains at least one &lt;td&gt; somewhere in it.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TABLE_TH_NO_DATA_CELLS` | fail | The table has header cells but no data cell at all, so no header describes anything. | WCAG 1.3.1; H51; ACT d0f69e; HTML table model |

### `target-size-minimum`

**Pointer targets must be at least 24x24px large, or leave sufficient distance to other targets**

automatic · WCAG 2.5.8 (AA) · confidence medium · default severity serious

Checks that pointer-operable targets have an effective hit region of at least 24 by 24 CSS pixels, or meet an allowed exception (e.g. sufficient spacing).

**Applies to.** Applies to &lt;button&gt;, &lt;summary&gt;, &lt;a href&gt;, &lt;area href&gt;, &lt;input&gt;, &lt;select&gt;, &lt;textarea&gt; and elements whose role resolves to button or link (the first real role in the role attribute, in any case) that are pointer-reachable: rendered, not suppressed by pointer-events:none, and with something left for a pointer to hit (a target clipped away is none; one with display: contents is its content). Accessibility-tree exclusion isn't a filter here: an aria-hidden control is still a target a pointer can hit. &lt;area&gt; is matched but never actually evaluated: it has no box of its own to measure. A custom element whose ElementInternals give it the button or link role (this.attachInternals().role), with no role attribute naming another, counts as a native element with that role does.

**Expectation.** Each target is at least 24 by 24 CSS pixels, or meets one of the SC 2.5.8 exceptions this rule can establish from geometry. A target is the region a pointer can hit: its border box with its rounded corners and 2D transforms, clipped by clip and clip-path: inset() on its containing-block chain and no larger than a box there that clips its overflow, with content sticking out of it. What is painted over a target takes nothing from it, another target included: whether a decorative layer, an overlay or a pinned row covers a target depends on the moment and the scroll position of the scan, so it says nothing about the target's size, and 2.5.8 measures the target itself. Two targets that overlap are within each other's circle, so an undersized one is still too close. A box that clips its overflow (overflow other than visible, or contain: paint), scrolled by the reader or by a script, doesn't cut it where its edge is now: the target is measured whole, as scrolled into it, no larger than the box, and only the boxes and targets inside the box are near a target it keeps out of view. It is large enough when a 24 by 24 square aligned to the page fits in that region, as Understanding 2.5.8 measures it. The exceptions: spacing (a 24px-diameter circle centred on the region's bounding box reaches no unrelated target's region, nor the circle of another undersized one), the inline exception for a target in a sentence, a link or a button written into the text (the stretch of its block container between line breaks holds text outside any target with a letter or a digit in it), or user-agent sizing (an unstyled native checkbox or radio, detected by appearance not having been reset to none). An undersized target too close to a neighbour fails. Where an exception may apply but cannot be confirmed (two inline links crowding each other between separators alone, as in "Edit | Delete", or a target inside an SVG, canvas or image map that may be essential), the result is cantTell rather than a guess. Margin (`target-size-px`): of the targets that are at least 24 by 24, the smallest, as the side of the largest square that fits in it against 24 (for a rectangle, the smaller of its width and height); `context.widthPx` and `context.heightPx` give its extent. A target under 24 that passes through the spacing exception is not a candidate. Only a target within 6px of 24 (up to 30) counts as close, so a page whose smallest target is larger gives no margin. `measuredCount` counts every target measured.

**What a finding reports.**

- `metrics.widthPx`, `metrics.heightPx`: the extent of the region a pointer can hit, in CSS pixels; `metrics.squarePx`: the side of the largest square that fits in it, against `metrics.minSizePx` (24). Rounded to a tenth, but down where that would reach the limit, so a size under 24 never reads as 24.
- `metrics.decidedBy`: what found the target too close to another: `centerDistance`, the circle of another undersized target, or `regionDistance`, another target's region within the circle.
- `metrics.centerDistancePx`, `metrics.minDistancePx` (`centerDistance`): the distance from the target's centre to its neighbour's, against the 24px it needs.
- `metrics.regionDistancePx`, `metrics.minDistancePx` (`regionDistance`): how far the neighbour's region is from the target's centre, against the circle's 12px radius.
- `conflictWith`: a selector for the neighbour it is too close to.
- `measured.width`, `measured.height`, `measured.square`: the region's extent and the largest square, unrounded.
- `viewport.width`, `viewport.height`: the viewport the page was laid out in, in CSS pixels. A responsive page can size or place a target differently at another width.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `undersized-and-too-close` | fail | A target smaller than 24 by 24 CSS pixels is too close to another target for the spacing exception, and no other exception applies. | WCAG 2.5.8 |
| `undersized-inline-link-run` | cantTell | An undersized inline link is too close only to another inline link in a run with separators but no words, as in "Edit \| Delete"; whether the inline exception covers it is for a person to judge. | WCAG 2.5.8 (exception: inline) |
| `undersized-plausibly-essential` | cantTell | An undersized target too close to another sits inside an SVG, a canvas or an image map, where its size may be essential. | WCAG 2.5.8 (exception: essential) |

**Margin.** `target-size-px`, in CSS pixels: the value must reach the threshold, and the result's `margin` names the element that came closest while meeting it, if it is within 6 px of the threshold.

### `td-has-header`

**Data cells in large tables must have an associated header**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that every &lt;td&gt; in a large, simple (no colspan/rowspan) table has an associated header, via a headers attribute, an implicit column &lt;th&gt; above it, or an implicit row &lt;th&gt; to its left.

**Applies to.** `<table>` elements with at least 4 rows and at least 4 columns (a "large" table, where implicit row/column header association is useful; small tables are usually self-evident), and with NO `colspan`/`rowspan` anywhere in the table (a `rowspan` of 0, which grows the cell to the end of its row group, is a span; a `colspan` of 0 is 1). A table whose role (the role attribute's first known, non-abstract token, in any case) is anything but table, grid or treegrid, such as a layout table with role="presentation", is left out: it has no data cells.

**Expectation.**

Every non-empty `<td>` has an associated header, via one of:

- a non-empty `headers` attribute (trusted here; whether it resolves to real `<th>` ids is `table-headers-attr-valid`'s concern, not this rule's), OR
- an implicit column header: a header cell in the same column, in an earlier row, OR
- an implicit row header: a header cell earlier in the same row.

A header cell is a `<th>` with no other role, or any cell with role="columnheader" or role="rowheader" (such a `<td>` is a header, not a data cell). A `<td>` with no text and no content that could carry a name (an image, a control, an element with an ARIA label) holds no data, so it needs no header; the empty corner cell above row headers is the usual case.

**What a finding reports.**

- `row`, `column`: where the cell sits in the table, counting from 0: rows from the top, cells from the left within the row.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TD_NO_ASSOCIATED_HEADER` | fail | A non-empty data cell in a large table has no headers attribute and no header cell above it in its column or before it in its row. | WCAG 1.3.1; H51; H43; HTML table model |

### `text-spacing-content-loss`

**Text stays readable when the user increases text spacing**

automatic · WCAG 1.4.12 (AA) · confidence medium · default severity serious

Applies the WCAG 1.4.12 text spacing in the browser and checks that no text is cut off or made to overlap, and asks about style sheet rules that force spacing with !important.

**Applies to.** Applies to a page with visible text. The loss of content needs a layout (a browser): without one, only the style sheets are read.

**Expectation.**

WCAG 1.4.12: with line height at 1.5 times the font size, spacing after paragraphs at 2 times, letter spacing at 0.12 times and word spacing at 0.16 times, no content or functionality is lost.

- In a browser, the spacing is applied as a style sheet that wins over the page's own (inline `!important` aside, which avoid-inline-spacing reports), and each line of text is measured before and after against the boxes that clip it: those on its containing block chain with `overflow: hidden` or `clip`, or `contain: paint`, and the viewport on an axis the page keeps from scrolling, or for text in a fixed box, which doesn't scroll with the page. A line that was inside and ends at least half outside (half its height, or half an em across) fails: the container cuts that text off (TEXT_CLIPPED). A line pushed out by less is asked about (TEXT_CLIPPED_PARTLY), and so is text that comes to overlap other text it did not overlap before (TEXT_OVERLAPS). Text moved by an animation that repeats for ever (a ticker) is asked about however far it goes (TEXT_CLIPPED_MOVING): it passes through the edge anyway, and one frame can't tell whether any of it is lost. Where the page is scroll-locked, both of the viewport's axes hidden while content already lay beyond it, as behind a cookie banner, text the spacing moves out of the viewport is asked about (VIEWPORT_SCROLL_LOCKED): the lock is usually a passing state, and the engine can't see past it. Text inside a &lt;marquee&gt; is left out: browsers move it outside the Web Animations API, so the engine can't hold it still, and its finding would depend on when the scan ran; deprecated-elements-not-used asks about the marquee (2.2.2). Text its box already cut off before the spacing (a fixed-height excerpt) is asked about when the spacing cuts off lines it showed in full (TEXT_CLIPPED_FURTHER): the excerpt was cut on purpose, but shows less. A box that grows with its lines, as line-clamp does, shows as many and is left alone.
- In any environment, a style sheet rule that sets line-height, letter-spacing or word-spacing below those values with `!important` is asked about (STYLESHEET_IMPORTANT): a tool that adds its own style sheet to the page cannot override it, though a user style sheet can. A value relative to the font size is read as declared, and a computed one meets the value within the rounding browsers report lengths with, so a rule setting exactly the minimum is not asked about (#108).
- The spacing is applied with a &lt;style&gt; element, or, where the page's Content Security Policy blocks one, as a style sheet the document adopts. Where neither applies, the page is asked about (SPACING_NOT_APPLIED) instead of measured, never passed.

Without a layout and with no such rule, the rule is notApplicable, with `data.reason: 'noLayout'`.

- Only text inside the scan's scope (contextSelector) and not excluded (excludeSelectors) is judged. Text elsewhere on the page is still measured, since text in scope can come to overlap it. While a modal dialog is open, the page behind it is left out altogether: the browser makes it inert, and the scan judges the dialog.
- Margin (`overflow-px`): of the text a clipping box keeps in full, the line that came closest to being cut off. `value` is how far it reaches past the box's edge, negative while it is still inside, against 2px, past which a line is partly cut off (the first finding); `context.axis` and `context.text` say which edge and which text. It is measured where text grows with more spacing, the inline end (the right, or the left in right-to-left text) and the bottom; a start edge counts only once a line is past it. An axis on which the box grew with the spacing (a block of auto height) follows its content and is left out, and vertical text gets no margin. Text a repeating animation moves (a ticker) is left out, since where it stands depends on the point the animation was held at, and so is a box that cuts off other text: it is a finding. Only a line within 8px of the limit (from 6px inside the edge) counts as close, so text deeper inside its box gives no margin. `measuredCount` counts the pairs of text and clipping box compared; like the findings, the margin covers the first 3,000 text nodes.

**What a finding reports.**

- `text`: the start of the text, up to 60 characters. Not on a style sheet rule's finding.
- `lines.shownBefore`, `lines.shownAfter` (TEXT_CLIPPED_FURTHER): how many lines of the text its box showed in full without and with the spacing.
- `metrics.overflowPx` (cut-off text): how far, in CSS pixels, the line went past the edge of the box that clips it, with the spacing applied.
- `metrics.thresholdPx` (cut-off text): how far it may go before it fails: half an em across, or half the line's height down.
- `metrics.axis` (cut-off text): `x` when the line went past a side, `y` past the top or bottom.
- `container.widthPx`, `container.heightPx` (cut-off text): the size of the clipping box with the spacing applied.
- `viewport.width`, `viewport.height` (cut-off or overlapping text): the viewport the page was laid out in, in CSS pixels. Text that fits at one width can be cut off at another.
- `other` (overlapping text): the text it comes to overlap.
- `selector`, `property`, `value` (a style sheet rule): the rule's selector and the declaration that forces the spacing.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_CLIPPED` | fail | With the WCAG text spacing applied, a line of text ends at least half outside the box that clips it, so it is cut off. | WCAG 1.4.12; F104 |
| `TEXT_CLIPPED_PARTLY` | cantTell | With the spacing applied, a line of text reaches past the edge of the box that clips it by less than half; whether it can still be read is for a person to judge. | WCAG 1.4.12 (not settled); F104 (not settled) |
| `TEXT_CLIPPED_MOVING` | cantTell | Text moved by an animation that repeats for ever reaches past the edge of its clipping box with the spacing applied; whether any of it is lost is for a person to judge. | WCAG 1.4.12 (not settled) |
| `TEXT_CLIPPED_FURTHER` | cantTell | Text its box already cut off shows fewer lines in full once the spacing is applied; whether the excerpt still serves its purpose is for a person to judge. | WCAG 1.4.12 (not settled) |
| `TEXT_OVERLAPS` | cantTell | With the spacing applied, text comes to overlap other text it did not overlap before. | WCAG 1.4.12 (not settled); F104 (not settled) |
| `VIEWPORT_SCROLL_LOCKED` | cantTell | The page is scroll-locked, and the spacing moves text out of the viewport, where it can't be scrolled to while the lock lasts. | WCAG 1.4.12 (not settled) |
| `SPACING_NOT_APPLIED` | cantTell | The page's Content Security Policy kept the spacing from being applied, so the text could not be measured with it. | WCAG 1.4.12 (not settled) |
| `STYLESHEET_IMPORTANT` | cantTell | A style sheet rule sets line-height, letter-spacing or word-spacing below the WCAG values with !important, which a tool's own style sheet cannot override. | WCAG 1.4.12 (not settled); CSS Cascade important declarations |

**Margin.** `overflow-px`, in CSS pixels: the value must stay under the threshold, and the result's `margin` names the element that came closest while meeting it, if it is within 8 px of the threshold.

### `textbox-name-present`

**Textboxes have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="textbox" expose a non-empty accessible name.

**Applies to.** Applies to elements whose role attribute resolves to textbox (the first token naming a known role, matched case-insensitively, so role="foo textbox" and role="TEXTBOX" count) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope. A custom element whose ElementInternals give it the role (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="textbox" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom textbox widget is not reliably exposed as its name. On a labelable element (&lt;input role="textbox"&gt;) an associated &lt;label&gt; counts as well. On a text-like &lt;input&gt; or a &lt;textarea&gt;, the placeholder counts last (HTML-AAM's final name source): a placeholder-only label is a 3.3.2 question, not a missing name. An element named by nothing but aria-placeholder fails: accname gives it no name, and only some browsers name it from aria-placeholder.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The text box has no accessible name from aria-label, aria-labelledby, title, an associated label or a placeholder; aria-placeholder alone does not count. | WCAG 4.1.2; F68; accname 1.2; HTML-AAM 4.1.1; WAI-ARIA 1.2 textbox role; ACT e086e5 |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `tooltip-name-present`

**Tooltips have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="tooltip" expose a non-empty accessible name.

**Applies to.** Applies to elements whose role attribute resolves to tooltip: its first token naming a known role, matched in any case, is tooltip, so role="foo tooltip" and role="TOOLTIP" count while role="link tooltip" (a link) does not. The element must be included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope. A custom element whose ElementInternals give it the role (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or, role="tooltip" being name-from-content, from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The tooltip has no accessible name from aria-label, aria-labelledby, title or its content. | WCAG 4.1.2; accname 1.2; WAI-ARIA 1.2 tooltip role |
| `name_closedContent` | cantTell | The tooltip may take its name from content inside a closed shadow root, which no script can read, so whether it has a name could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |
| `name_contentTooDeep` | cantTell | The tooltip's content is nested too deeply for its name to be worked out, so whether it has a name could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `treeitem-name-present`

**Tree items have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="treeitem" expose a non-empty accessible name.

**Applies to.** Applies to elements whose role attribute resolves to treeitem: its first token naming a known role, matched in any case, is treeitem, so role="foo treeitem" and role="TREEITEM" count while role="link treeitem" (a link) does not. The element must be included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope. A custom element whose ElementInternals give it the role (this.attachInternals().role), with no role attribute naming another, is in scope too: that is its default role, and no other rule checks it.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or, role="treeitem" being name-from-content, from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `name_missing` | fail | The tree item has no accessible name from aria-label, aria-labelledby, title or its content. | WCAG 4.1.2; F68; accname 1.2; WAI-ARIA 1.2 treeitem role |
| `name_closedContent` | cantTell | The tree item may take its name from content inside a closed shadow root, which no script can read, so whether it has a name could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |
| `name_contentTooDeep` | cantTell | The tree item's content is nested too deeply for its name to be worked out, so whether it has a name could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |
| `name_internals` | cantTell | The element is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told. | WCAG 4.1.2 (not settled); accname 1.2 (not settled) |

### `valid-lang`

**Element lang attribute must be syntactically valid**

automatic · WCAG 3.1.2 (AA) · confidence high · default severity moderate

Checks that any element (other than the root &lt;html&gt;) with a non-empty lang attribute uses a syntactically valid language tag.

**Applies to.**

Applies to any element other than the root &lt;html&gt; with a non-empty lang attribute AND at least some non-whitespace "governed text" that actually inherits its language from that element, per ACT de46e4:

- Descendant text/alt is governed by the nearest lang-carrying ancestor only, a nested descendant with its own non-empty lang re-scopes everything inside it, so that subtree no longer counts toward the outer element's applicability (it counts toward the nested element's own, if that one is also being evaluated).
- A non-empty alt attribute on img/area/input[type=image] counts as governed text, the same as a text node.
- Text (or alt) that CSS keeps out of the render tree (display:none, the hidden attribute, ...) does not count. aria-hidden and offscreen positioning do NOT exempt text, per ACT's own failed examples for both, only actual non-rendering does.

**Expectation.** The primary language subtag of the lang value (the part before the first hyphen) is a registered language subtag, as ACT de46e4 requires. WCAG 3.1.2 (Language of Parts) requires that when a passage's language differs from the page's default, it is identified programmatically. A tag whose primary subtag is unknown fails to identify a real language at all; a malformed later subtag (lang="en-US_x") still identifies English and passes here, since it is a markup validity error rather than a missing language.

**What a finding reports.**

- `reasonCode`: `DEFAULT_LANG_INVALID` when no ancestor (through shadow hosts, &lt;html&gt; included) has a non-empty lang, so this one sets the language its text starts from, as `<body lang>` does on a page whose &lt;html&gt; has none; `ELEMENT_LANG_INVALID` when it changes an inherited language. Both fail 3.1.2, as ACT de46e4 does.
- `value`: the lang attribute's value, with surrounding whitespace removed.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `DEFAULT_LANG_INVALID` | fail | An element that sets the starting language of its text, with no lang above it, has a lang whose primary subtag is not a registered language subtag. | WCAG 3.1.2; ACT de46e4; HTML lang attribute (MUST); BCP 47 |
| `ELEMENT_LANG_INVALID` | fail | An element that changes the inherited language has a lang whose primary subtag is not a registered language subtag. | WCAG 3.1.2; ACT de46e4; H58; HTML lang attribute (MUST); BCP 47 |

**Settings a variant can change.** See [`RULE_SETTINGS.md`](./RULE_SETTINGS.md).

| Setting | Default | Takes | What it changes | Basis |
|---|---|---|---|---|
| `codes` | `"registry"` | `"registry"`, `"iso639"` | The codes a primary language subtag is checked against: registry, the IANA Language Subtag Registry, which lists a three-letter code only for a language with no two-letter one; or iso639, any ISO 639 code, which also accepts the three-letter ISO 639-2 and 639-3 codes of languages that have a two-letter one (eng, fra, fre, ger) and the qaa to qtz range reserved for local use. | BCP 47 and ACT de46e4 (registry); standards that accept any ISO 639 code, such as RGAA 4.1.2, glossary "Code de langue" (iso639) |

### `video-caption`

**Prerecorded video should provide a captions track**

manual · WCAG 1.2.2 (A) · confidence low · default severity moderate

Flags &lt;video&gt; elements with no &lt;track kind="captions"&gt; child, for manual review of whether the video has an audio track that needs captions; a subtitles track alone may be a translation only.

**Applies to.** Any &lt;video&gt; element in the composed DOM, inert ones included: an inert video is still shown and can still play.

**Expectation.** SC 1.2.2 requires captions for prerecorded synchronized media, but only when the video actually has an audio track that conveys information (a silent/decorative video needs none), which cannot be verified from static markup alone (jsdom does not decode media). This rule is therefore `type: 'manual'` (cantTell-capped, never fail), matching the precedent set by `media-alternative-transcript-evidence` for the same class of "normatively mapped but not statically verifiable" gap. A &lt;video&gt; with a `<track kind="captions">` whose `src` is non-empty is not flagged; everything else is flagged for human review. A video whose only text tracks are subtitles (`kind="subtitles"`, or no `kind`, which HTML treats as subtitles) gets its own question: subtitles may be a translation of the dialogue only, without the speaker and sound information captions carry.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `CAPTIONS_TRACK_NOT_DETECTED` | cantTell | A &lt;video&gt; has no &lt;track kind="captions"&gt; with a source; a person checks whether it has audio that needs captions. | WCAG 1.2.2 (not settled); G87; H95; ACT f51b46 |
| `SUBTITLES_TRACK_ONLY` | cantTell | A &lt;video&gt; has only subtitles tracks, which may carry the dialogue without the speaker and sound information that captions add. | WCAG 1.2.2 (not settled); H95; HTML track kind |

### `video-poster-text-alternative-present`

**&lt;video&gt; poster must have a text alternative**

automatic · WCAG 1.1.1 (A) · confidence medium · default severity serious

Checks that &lt;video&gt; elements with a poster image provide a text alternative (accessible name).

**Applies to.** Applies to &lt;video&gt; elements that: 1) have a non-empty poster attribute, AND 2) are exposed to assistive technologies (per engine eligibility checks). Elements otherwise hidden from the accessibility tree remain applicable if they are tabbable or referenced by IDREF relationships (per eligibility checks). Videos with role="presentation" or role="none" are excluded only when they are not focusable.

**Expectation.**

Each applicable &lt;video&gt; element provides a text alternative for the poster image, via:

- an accessible name (aria-label / aria-labelledby / title).

Between-tag fallback content inside &lt;video&gt; is NOT accepted: it is only rendered by browsers that don't support &lt;video&gt;, so it is not reliably exposed to assistive technologies in practice. &lt;video&gt; is also not a labelable element, so native &lt;label for="..."&gt; associations are not accepted either. A &lt;video&gt; with no name that is the only content of a &lt;figure&gt; with a non-empty &lt;figcaption&gt; is asked about (cantTell) rather than failed: the caption names the figure, not the video (HTML-AAM; Chromium gives the video no name), but it may describe the poster, and only a person can tell.

**What a finding reports.**

- `reasonCode`: `VIDEO_POSTER_FIGCAPTION_REVIEW` on the cantTell finding, with `figcaption`, the caption's text up to 100 characters; `TEXT_ALTERNATIVE_MISSING` on a failure.

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `TEXT_ALTERNATIVE_MISSING` | fail | A &lt;video&gt; with a poster image has no name from aria-label, aria-labelledby or title. | WCAG 1.1.1; HTML video poster; accname 1.2 |
| `VIDEO_POSTER_FIGCAPTION_REVIEW` | cantTell | A &lt;video&gt; with a poster has no name but is the only content of a figure with a caption, and a person checks that the caption describes the poster. | WCAG 1.1.1 (not settled); HTML-AAM figcaption |

### `widget-keyboard-focusable`

**Widgets should be reachable with the keyboard**

manual · WCAG 2.1.1 (A) · confidence medium · default severity serious

Flags an element with a widget role that cannot take focus or is out of the tab order, and a composite widget with no tab stop, for manual review.

**Applies to.**

Elements the page shows with `aria-activedescendant`, and those whose role, from the `role` attribute or a custom element's `ElementInternals`, is a widget a user operates:

- single widgets: button, link, checkbox, switch, radio, slider, spinbutton, textbox, searchbox, combobox;
- composite widgets: grid, treegrid, listbox, menu, menubar, tree, tablist, toolbar, radiogroup.

Left out:

- an element out of the accessibility tree (`aria-hidden="true"`), or disabled (`disabled`, or `aria-disabled="true"` on it or an ancestor): it offers nothing to operate;
- a widget inside a composite widget, or inside an element with `aria-activedescendant` that can take focus: the composite moves focus among its items (a roving tabindex) or keeps it and points at the active one, so the outer element is judged instead (for a submenu, its menubar);
- an element with an inline `onclick`, or a click listener the listener hook (`listenerHookScript`) saw, which `click-handler-keyboard-operable` judges.

**Expectation.**

A keyboard user can reach the widget with Tab (WCAG 2.1.1). Only the markup's focusability is read: a script may move focus or handle keys in ways the markup doesn't show, so a finding is a question, never a failure.

- A single widget that is in the tab order, or holds an element that is, passes.
- A single widget that can't take focus, and holds nothing that can: cantTell (`WIDGET_NOT_FOCUSABLE`). Check that a keyboard user can reach it, or what it does, another way.
- A single widget that takes focus only from script (`tabindex="-1"`): cantTell (`WIDGET_NOT_IN_TAB_ORDER`). Tab never reaches it; check that a script moves focus to it, or that what it does is offered elsewhere.
- A composite widget passes when it is in the tab order (with `aria-activedescendant` pointing at its active item, or not) or holds an element that is. One that no other element names in `aria-controls` or `aria-owns` (a popup opened by a button or combobox gets focus from it) and that has neither: cantTell (`COMPOSITE_NO_TAB_STOP`).
- An element of any role carrying `aria-activedescendant` that can't take focus: cantTell (`ACTIVEDESCENDANT_HOST_NOT_FOCUSABLE`). The active item is announced only while that element has focus. Such an element doesn't manage focus for the widgets inside it, so they are judged on their own.

**What a finding reports.**

- `role`: the element's role.
- `focusable`: whether the element itself can take focus.
- `scriptFocusable`: for a composite, whether any element in it takes focus from script (`tabindex="-1"`).

**Reason codes.**

| Code | Outcome | Meaning | Basis |
|---|---|---|---|
| `WIDGET_NOT_FOCUSABLE` | cantTell | A widget that cannot take focus and holds nothing that can; whether a keyboard user can reach it or what it does another way is for a person to check. | WCAG 2.1.1 (not settled); F42 |
| `WIDGET_NOT_IN_TAB_ORDER` | cantTell | A widget that takes focus only from script (tabindex="-1"), so Tab never reaches it. | WCAG 2.1.1 (not settled) |
| `COMPOSITE_NO_TAB_STOP` | cantTell | A composite widget that no other element controls or owns, with no tab stop on it or on any of its items. | WCAG 2.1.1 (not settled) |
| `ACTIVEDESCENDANT_HOST_NOT_FOCUSABLE` | cantTell | An element with aria-activedescendant that cannot take focus, so its active item is never announced. | WCAG 2.1.1 (not settled); WAI-ARIA 1.2 aria-activedescendant |
