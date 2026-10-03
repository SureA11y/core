# Rule catalog

Generated from the compiled engine's own catalog (`getChecksCatalog()`/`getRulesCatalog()`) and each rule's source header. Run `node scripts/generate-rule-catalog.js` after `npm run build` to regenerate this file whenever rules change. Do not hand-edit.

**133 rules total: 80 automatic (WCAG-normative, can return `fail`), 53 manual (advisory/judgment-required, capped at `cantTell`). 107 carry at least one formal WCAG Success Criterion mapping.**

The tables below are an index; [rule reference](#rule-reference) carries each rule's description, what it applies to and what it expects.

Under **What a finding reports**, a rule lists the fields its findings carry in `data.details` besides `reasonCode`, and what each one means. They help to read and reproduce a finding, but apart from `reasonCode` they are not a stable contract (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#an-occurrence-occurrencesi)): a field may be renamed or dropped in a minor release, so do not build on them.

See [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md) for what `type`/`confidence`/`severity` mean on a scan result, and [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md) for how these roll up to an SC-level conformance claim. For WCAG-facet-level coverage-gap tracking (which parts of an SC are and aren't automatable yet), see `coverage/coverage-report.md` instead: that one is organized by facet, this one by rule.

## Automatic rules (80), can return `fail`

| Rule ID | Title | WCAG SC | Level | Confidence | Default severity |
|---|---|---|---|---|---|
| [`area-alt-present`](#area-alt-present) | &lt;area&gt; must have an accessible name | 1.1.1 | A | high | serious |
| [`aria-allowed-attr`](#aria-allowed-attr) | aria-* attributes must be permitted for the element’s role | 4.1.2 | A | medium | moderate |
| [`aria-allowed-role`](#aria-allowed-role) | Explicit role must be permitted for its host element | — | — | high | moderate |
| [`aria-braille-equivalent`](#aria-braille-equivalent) | aria-braillelabel/aria-brailleroledescription must have a non-braille equivalent | 4.1.2 | A | high | moderate |
| [`aria-conditional-attr`](#aria-conditional-attr) | aria-errormessage requires aria-invalid to be set to a non-false value | 4.1.2 | A | high | moderate |
| [`aria-deprecated-role`](#aria-deprecated-role) | role attribute should not use a deprecated or author-discouraged ARIA role | 4.1.2 | A | high | moderate |
| [`aria-hidden-body`](#aria-hidden-body) | The document &lt;body&gt; must not be aria-hidden | 1.3.1, 4.1.2 | A | high | critical |
| [`aria-hidden-focus`](#aria-hidden-focus) | ARIA hidden elements must not be focusable | 2.4.7, 4.1.2 | AA | high | serious |
| [`aria-prohibited-attr`](#aria-prohibited-attr) | ARIA naming attributes must not be used on roles that prohibit them | 4.1.2 | A | high | moderate |
| [`aria-prohibited-children`](#aria-prohibited-children) | Container roles must not own a child with a disallowed role | 1.3.1 | A | medium | moderate |
| [`aria-required-attr`](#aria-required-attr) | Roles with a required ARIA state/property must carry it | 4.1.2 | A | high | serious |
| [`aria-required-children`](#aria-required-children) | Container roles must own at least one required child role | 1.3.1 | A | medium | moderate |
| [`aria-required-parent`](#aria-required-parent) | Roles requiring a specific context role must be in that context | 1.3.1 | A | medium | moderate |
| [`aria-role-name-present`](#aria-role-name-present) | ARIA roles that require an accessible name have one | 4.1.2 | A | high | serious |
| [`aria-roles-valid`](#aria-roles-valid) | role attribute must be a valid, non-abstract ARIA role | 4.1.2 | A | high | serious |
| [`aria-valid-attr`](#aria-valid-attr) | aria-* attributes must be real, defined ARIA attributes | 4.1.2 | A | high | serious |
| [`aria-valid-attr-value`](#aria-valid-attr-value) | aria-* attribute values must match their declared type | 4.1.2 | A | high | serious |
| [`autocomplete-valid`](#autocomplete-valid) | autocomplete attribute must be a valid autofill value | 1.3.5 | AA | high | moderate |
| [`avoid-inline-spacing`](#avoid-inline-spacing) | Inline style must not force text spacing below the WCAG metric | 1.4.12 | AA | high | moderate |
| [`binary-control-name-present`](#binary-control-name-present) | Binary controls have an accessible name | 4.1.2 | A | high | serious |
| [`button-name-present`](#button-name-present) | Buttons have an accessible name | 4.1.2 | A | high | serious |
| [`canvas-text-alternative-present`](#canvas-text-alternative-present) | &lt;canvas&gt; must provide a text alternative | 1.1.1 | A | high | serious |
| [`combobox-name-present`](#combobox-name-present) | Comboboxes have an accessible name | 4.1.2 | A | high | serious |
| [`contrast-computable`](#contrast-computable) | Color contrast is computable for rendered text | 1.4.3, 1.4.6 | AAA | high | serious |
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
| [`form-control-programmatic-label-present`](#form-control-programmatic-label-present) | Form controls must have a programmatic label | 1.3.1, 3.3.2, 4.1.2 | A | medium | serious |
| [`form-control-single-label`](#form-control-single-label) | Form controls must not have multiple labels | 3.3.2 | A | high | moderate |
| [`html-lang-attr-present`](#html-lang-attr-present) | Page language is declared | 3.1.1 | A | high | serious |
| [`html-xml-lang-mismatch`](#html-xml-lang-mismatch) | lang and xml:lang must not disagree | 3.1.1 | A | high | serious |
| [`identical-iframes-same-purpose`](#identical-iframes-same-purpose) | Frames with the same name embed the same resource | 4.1.2 | A | medium | moderate |
| [`iframe-focusable-content`](#iframe-focusable-content) | Frames with tabindex="-1" must not contain focusable content | 2.1.1 | A | high | moderate |
| [`iframe-name-present`](#iframe-name-present) | Frames have an accessible name | 4.1.2 | A | high | serious |
| [`iframe-title-unique`](#iframe-title-unique) | Frame title uniqueness (deprecated) | 4.1.2 | A | high | moderate |
| [`img-alt-present`](#img-alt-present) | &lt;img&gt; must have an alt attribute | 1.1.1 | A | high | serious |
| [`input-image-alt-present`](#input-image-alt-present) | &lt;input type="image"&gt; must have an alt attribute | 1.1.1 | A | high | serious |
| [`label-in-name`](#label-in-name) | Label in Name: accessible name contains visible text | 2.5.3 | A | high | serious |
| [`link-in-text-block`](#link-in-text-block) | Links in text blocks must be distinguishable from surrounding text without relying on color alone | 1.4.1 | A | high | serious |
| [`link-name-present`](#link-name-present) | Links have an accessible name | 2.4.4, 4.1.2 | A | high | serious |
| [`list-children-valid`](#list-children-valid) | Lists must only directly contain list items | 1.3.1 | A | high | serious |
| [`listbox-name-present`](#listbox-name-present) | Listboxes have an accessible name | 4.1.2 | A | high | serious |
| [`listitem-parent-valid`](#listitem-parent-valid) | List items must be inside a list container | 1.3.1 | A | high | serious |
| [`menuitem-name-present`](#menuitem-name-present) | Menu items have an accessible name | 4.1.2 | A | high | serious |
| [`meta-refresh-no-exceptions`](#meta-refresh-no-exceptions) | Page must not use a timed meta refresh (AAA) | 2.2.4, 3.2.5 | AAA | high | moderate |
| [`meta-refresh-timing-absent`](#meta-refresh-timing-absent) | Page must not use a timed meta refresh | 2.2.1 | A | high | serious |
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

## Manual rules (53), advisory, capped at `cantTell`

| Rule ID | Title | WCAG SC | Level | Confidence | Default severity |
|---|---|---|---|---|---|
| [`accesskeys`](#accesskeys) | accesskey values must be unique | — | — | medium | minor |
| [`area-alt-quality`](#area-alt-quality) | &lt;area&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`aria-checked-state-mismatch`](#aria-checked-state-mismatch) | Native checkbox/radio aria-checked should match its actual state | 4.1.2 | A | medium | moderate |
| [`aria-text`](#aria-text) | role="text" elements should have no focusable descendants | — | — | medium | minor |
| [`bypass-blocks-present`](#bypass-blocks-present) | Page must provide a way to bypass repeated blocks | 2.4.1 | A | medium | moderate |
| [`canvas-text-alternative-quality`](#canvas-text-alternative-quality) | &lt;canvas&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`css-focus-indicator-suppressed`](#css-focus-indicator-suppressed) | Focus indicator must not be removed without a replacement | 2.4.7 | AA | medium | serious |
| [`css-hidden-focus`](#css-hidden-focus) | Focusable elements must not be visually hidden | 2.4.7 | AA | low | serious |
| [`embed-text-alternative-quality`](#embed-text-alternative-quality) | &lt;embed&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`empty-heading`](#empty-heading) | Headings must not be empty | — | — | medium | minor |
| [`empty-table-header`](#empty-table-header) | Table header cells must not be empty | — | — | medium | minor |
| [`focus-order-semantics`](#focus-order-semantics) | Elements added to the tab order should have interactive semantics | — | — | medium | minor |
| [`form-control-label-quality`](#form-control-label-quality) | Form field labels should be descriptive and distinguishable | 2.4.6 | AA | medium | minor |
| [`form-control-programmatic-label-quality`](#form-control-programmatic-label-quality) | Form controls should not rely on placeholder or title as the primary label | 4.1.2 | A | medium | moderate |
| [`heading-order`](#heading-order) | Heading levels must not skip a level | — | — | medium | minor |
| [`heading-quality`](#heading-quality) | Heading text should be descriptive, not a placeholder | 2.4.6 | AA | medium | minor |
| [`identical-links-same-purpose`](#identical-links-same-purpose) | Links with the same accessible name should lead to the same destination | 2.4.9 | AAA | low | minor |
| [`image-redundant-alt`](#image-redundant-alt) | Image alt text must not duplicate adjacent visible text | — | — | medium | minor |
| [`img-alt-decorative`](#img-alt-decorative) | Excluded &lt;img&gt;/&lt;canvas&gt;/&lt;svg&gt; must be decorative (manual review) | 1.1.1 | A | medium | minor |
| [`img-alt-quality`](#img-alt-quality) | &lt;img&gt; alt text must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`input-image-alt-decorative`](#input-image-alt-decorative) | &lt;input type="image"&gt; with alt="" must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`input-image-alt-quality`](#input-image-alt-quality) | &lt;input type="image"&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`label-title-only`](#label-title-only) | Form controls should not use title as their only label | — | — | medium | minor |
| [`landmark-banner-is-top-level`](#landmark-banner-is-top-level) | Banner landmark must be top-level | — | — | medium | minor |
| [`landmark-complementary-is-top-level`](#landmark-complementary-is-top-level) | Complementary landmark must be top-level | — | — | medium | minor |
| [`landmark-contentinfo-is-top-level`](#landmark-contentinfo-is-top-level) | Contentinfo landmark must be top-level | — | — | medium | minor |
| [`landmark-main-is-top-level`](#landmark-main-is-top-level) | Main landmark must be top-level | — | — | medium | minor |
| [`landmark-no-duplicate-banner`](#landmark-no-duplicate-banner) | Page must not have more than one banner landmark | — | — | medium | minor |
| [`landmark-no-duplicate-contentinfo`](#landmark-no-duplicate-contentinfo) | Page must not have more than one contentinfo landmark | — | — | medium | minor |
| [`landmark-no-duplicate-main`](#landmark-no-duplicate-main) | Page must not have more than one main landmark | — | — | medium | minor |
| [`landmark-one-main`](#landmark-one-main) | Page should have a main landmark | — | — | medium | minor |
| [`landmark-unique`](#landmark-unique) | Landmarks with the same role must have unique names | — | — | medium | minor |
| [`link-name-quality`](#link-name-quality) | Link text should be descriptive, not generic | 2.4.4 | A | medium | minor |
| [`manual-review`](#manual-review) | Manual review: keyboard navigation and focus order | 2.1.1, 2.4.3, 2.4.7 | AA | medium | moderate |
| [`media-alternative-transcript-evidence`](#media-alternative-transcript-evidence) | Time-based media: transcript or text alternative evidence | 1.2.1 | A | low | moderate |
| [`meta-viewport-large`](#meta-viewport-large) | Viewport meta tag should allow zooming up to 500% | — | — | medium | minor |
| [`mouse-only-event-handlers`](#mouse-only-event-handlers) | Pointer-only inline event handlers should have a keyboard-reachable equivalent | 2.1.1 | A | low | moderate |
| [`no-autoplay-audio`](#no-autoplay-audio) | Autoplaying audio should provide a pause/stop or volume-control mechanism | 1.4.2 | A | low | moderate |
| [`object-text-alternative-quality`](#object-text-alternative-quality) | &lt;object&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`p-as-heading`](#p-as-heading) | Text styled to look like a heading should probably be a real heading | 1.3.1 | A | low | minor |
| [`page-has-heading-one`](#page-has-heading-one) | Page should have a level-one heading | — | — | medium | minor |
| [`page-title-patterns`](#page-title-patterns) | Page title patterns that may be insufficiently descriptive | 2.4.2 | A | medium | minor |
| [`password-paste-enabled`](#password-paste-enabled) | Authentication fields must not block pasting | 3.3.8 | AA | medium | serious |
| [`presentation-role-conflict`](#presentation-role-conflict) | Presentational role must not conflict with a global ARIA attribute or focusability | — | — | medium | minor |
| [`region`](#region) | Page content should be inside a landmark region | — | — | medium | minor |
| [`scope-attr-valid`](#scope-attr-valid) | scope attribute must have a valid value | — | — | medium | minor |
| [`scrollable-region-focusable`](#scrollable-region-focusable) | Scrollable regions with no focusable content should be keyboard-focusable | 2.1.1, 2.1.3 | AAA | low | moderate |
| [`skip-link`](#skip-link) | Skip link must have a resolvable, usable target | — | — | medium | minor |
| [`svg-text-alternative-quality`](#svg-text-alternative-quality) | &lt;svg&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`tabindex`](#tabindex) | tabindex should not be greater than 0 | — | — | medium | minor |
| [`table-duplicate-name`](#table-duplicate-name) | Table caption must not duplicate its summary attribute | — | — | medium | minor |
| [`table-fake-caption`](#table-fake-caption) | A table's first row should not stand in for a real &lt;caption&gt; | 1.3.1 | A | low | minor |
| [`video-caption`](#video-caption) | Prerecorded video should provide a captions track | 1.2.2 | A | low | moderate |

## Composite (WCAG-SC rollup) rules (34)

Composite rules aren't individually authored. They're generated rollups over the atomic rules above, one per WCAG Success Criterion with automatable coverage. See [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md) for rollup semantics.

| Composite ID | Title | Description | WCAG SC | Level | # atomic rules rolled up |
|---|---|---|---|---|---|
| `wcag-1.1.1-non-text-content` | Non-text content: text alternatives | Rollup of checks ensuring non-text content has an appropriate text alternative. | 1.1.1 | A | 21 |
| `wcag-1.2.1-audio-only-video-only-prerecorded` | Audio-only and video-only (prerecorded): transcript | Rollup of checks for transcript availability for prerecorded audio-only/video-only media. | 1.2.1 | A | 1 |
| `wcag-1.2.2-captions-prerecorded` | Captions (Prerecorded) | Rollup of checks for captions-track evidence on prerecorded video. | 1.2.2 | A | 1 |
| `wcag-1.3.1-info-and-relationships` | Info and Relationships | Rollup of checks ensuring information, structure, and relationships conveyed through presentation are programmatically determinable. | 1.3.1 | A | 14 |
| `wcag-1.3.4-orientation` | Orientation | Rollup of checks ensuring content does not restrict its view to a single display orientation. | 1.3.4 | AA | 1 |
| `wcag-1.3.5-identify-input-purpose` | Identify Input Purpose | Rollup of checks ensuring the autocomplete attribute correctly identifies input purpose. | 1.3.5 | AA | 1 |
| `wcag-1.4.1-use-of-color` | Use of Color | Rollup of checks ensuring color is not used as the only visual means of conveying information. | 1.4.1 | A | 1 |
| `wcag-1.4.12-text-spacing` | Text Spacing | Rollup of checks ensuring text spacing can be increased without losing content. | 1.4.12 | AA | 2 |
| `wcag-1.4.2-audio-control` | Audio Control | Rollup of checks for a pause/stop or volume-control mechanism on autoplaying audio. | 1.4.2 | A | 1 |
| `wcag-1.4.3-contrast-minimum` | Contrast: minimum | Rollup of checks for minimum text contrast. | 1.4.3 | AA | 2 |
| `wcag-1.4.4-resize-text` | Resize Text | Rollup of checks ensuring the viewport meta tag does not prevent users from zooming text up to 200%. | 1.4.4 | AA | 1 |
| `wcag-1.4.6-contrast-enhanced` | Contrast: enhanced | Rollup of checks for enhanced text contrast. | 1.4.6 | AAA | 2 |
| `wcag-2.1.1-keyboard` | Keyboard | Rollup of checks ensuring functionality is operable through a keyboard interface. | 2.1.1 | A | 5 |
| `wcag-2.1.3-keyboard-no-exception` | Keyboard (No Exception) | Rollup of checks ensuring functionality is operable through a keyboard interface with no exceptions (AAA). | 2.1.3 | AAA | 1 |
| `wcag-2.2.1-timing-adjustable` | Timing Adjustable | Rollup of checks ensuring the page does not impose a timed refresh the user cannot control. | 2.2.1 | A | 1 |
| `wcag-2.2.2-pause-stop-hide` | Pause, Stop, Hide | Rollup of checks ensuring moving, blinking, or auto-scrolling content can be paused, stopped, or hidden. | 2.2.2 | A | 1 |
| `wcag-2.2.4-interruptions` | Interruptions | Rollup of checks ensuring automatic context changes only happen at the user's request (AAA). | 2.2.4 | AAA | 1 |
| `wcag-2.4.1-bypass-blocks` | Bypass Blocks | Rollup of checks ensuring the page provides a way to bypass repeated blocks of content. | 2.4.1 | A | 1 |
| `wcag-2.4.2-page-titled` | Page titled | Rollup of checks ensuring documents have a meaningful page title. | 2.4.2 | A | 2 |
| `wcag-2.4.3-focus-order` | Focus order | Rollup of checks ensuring focus moves through content in a meaningful order. | 2.4.3 | A | 1 |
| `wcag-2.4.4-link-purpose-in-context` | Link Purpose (In Context) | Rollup of checks flagging links with no accessible name, or whose text alone is a known non-descriptive/generic phrase. | 2.4.4 | A | 2 |
| `wcag-2.4.6-headings-and-labels` | Headings and Labels | Rollup of checks flagging headings whose text is a placeholder rather than a description of the content that follows. | 2.4.6 | AA | 2 |
| `wcag-2.4.7-focus-visible` | Focus visible | Rollup of checks ensuring keyboard focus is not hidden and remains perceivable. | 2.4.7 | AA | 4 |
| `wcag-2.4.9-link-purpose-link-only` | Link Purpose (Link Only) | Rollup of checks ensuring links with the same accessible name serve the same purpose (AAA). | 2.4.9 | AAA | 1 |
| `wcag-2.5.3-label-in-name` | Label in name | Rollup of checks ensuring that when a control has a visible text label, the accessible name contains that visible label text. | 2.5.3 | A | 1 |
| `wcag-2.5.8-target-size-minimum` | Target size: minimum | Rollup of checks ensuring pointer targets meet minimum size requirements. | 2.5.8 | AA | 1 |
| `wcag-3.1.1-language-of-page` | Language of page | Rollup of checks ensuring the page language is specified. | 3.1.1 | A | 2 |
| `wcag-3.1.2-language-of-parts` | Language of Parts | Rollup of checks ensuring elements whose language differs from the page default declare it correctly. | 3.1.2 | AA | 1 |
| `wcag-3.2.5-change-on-request` | Change on Request | Rollup of checks ensuring context changes only happen at the user's request (AAA). | 3.2.5 | AAA | 1 |
| `wcag-3.3.2-labels-or-instructions` | Labels or Instructions | Rollup of checks ensuring form controls have unambiguous labeling. | 3.3.2 | A | 2 |
| `wcag-3.3.8-accessible-authentication-minimum` | Accessible Authentication (Minimum) | Rollup of checks ensuring an authentication step leaves the mechanisms that help a user through it in place. | 3.3.8 | AA | 1 |
| `wcag-4.1.1-parsing` | Parsing | Rollup of checks ensuring id values are unique. WCAG 2.0/2.1 only: SC 4.1.1 was removed in WCAG 2.2, so this composite carries the wcag22-removed tag. | 4.1.1 | A | 1 |
| `wcag-4.1.2-aria-validity` | Name, role, value: ARIA validity | Rollup of checks that ARIA role and attribute usage conforms to the WAI-ARIA specification (valid roles, valid attributes, valid values, required attributes, unique ARIA-referenced ids). | 4.1.2 | A | 13 |
| `wcag-4.1.2-name` | Name, role, value: accessible name | Rollup of checks that common interactive elements expose a non-empty accessible name. | 4.1.2 | A | 24 |

## Rule reference

Every atomic rule, alphabetically. "Applies to" is the rule's precondition (when it returns `notApplicable`), and "Expectation" is the condition it decides once it does apply.

### `accesskeys`

**accesskey values must be unique**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that no two elements on the page share the same accesskey attribute value.

**Applies to.** Applies whenever two or more elements share the same non-empty accesskey attribute value (case-insensitive).

**Expectation.** Every accesskey value on the page is unique. Duplicate accesskeys make keyboard-shortcut activation ambiguous: only one of the elements sharing the key can actually be reached by it, and which one is browser/platform-dependent.

**What a finding reports.**

- `accesskey`: the shared key, in lower case.
- `duplicateCount`: how many elements on the page share it, this one included.

### `area-alt-present`

**&lt;area&gt; must have an accessible name**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that &lt;area&gt; elements have a non-empty accessible name via alt, aria-label/aria-labelledby, or title.

**Applies to.** Applies to &lt;area&gt; elements that: 1) are in a &lt;map&gt; that is referenced by an &lt;img usemap&gt;, AND 2) carry a non-empty href (an &lt;area&gt; with no href is not a hyperlink at all per the HTML spec, and has nothing for this rule to name), AND 3) the referencing &lt;img&gt; is actually rendered (hidden/display:none/ visibility exclude it; aria-hidden does not, since &lt;area&gt; is not a DOM descendant of &lt;img&gt;), AND 4) the &lt;area&gt; itself is eligible in the accessibility tree. hidden, display:none and inert on the &lt;area&gt; or its &lt;map&gt; do not exclude it: neither element generates a box, so a real browser's image-map hit-testing ignores all three there (verified against Chromium and Firefox); only those mechanisms on a genuine ancestor of the whole &lt;img&gt;+&lt;map&gt; pairing do.

**Expectation.** Each applicable &lt;area&gt; element has a non-empty accessible name, from alt, aria-label/aria-labelledby, or title. An &lt;area&gt; in a used map is always a link, so alt="" is not decorative here as it is on &lt;img&gt;: an empty alt fails the same as a missing one unless another mechanism names it.

### `area-alt-quality`

**&lt;area&gt; text alternative must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;area&gt; elements with a non-empty text alternative (alt, aria-label, aria-labelledby or title) for human review of appropriateness.

**Applies to.** Applies to &lt;area&gt; elements that get a non-empty text alternative from any source: aria-labelledby (resolving to text), aria-label, alt or title. The &lt;area&gt; must carry a non-empty href (otherwise it is not a hyperlink at all per the HTML spec) and belong to a &lt;map&gt; that an &lt;img usemap&gt; actually references; an &lt;area&gt; in an unused map is out of scope. The referencing &lt;img&gt; must actually be rendered (hidden/display:none/ visibility exclude it; aria-hidden does not, since &lt;area&gt; is not a DOM descendant of &lt;img&gt;), and the &lt;area&gt; itself must be eligible: hidden, display:none and inert on the &lt;area&gt; or its &lt;map&gt; do not exclude it, since neither generates a box and a real browser's image-map hit-testing ignores all three there (verified against Chromium and Firefox); only those mechanisms on a genuine ancestor of the whole &lt;img&gt;+&lt;map&gt; pairing do. role="presentation"/"none" takes an element out unless it is focusable.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate. Each occurrence lists every source present (data.details.sources), so the reviewer checks each one: a title or aria-label that is not the name still reaches some users.

**What a finding reports.**

- `name`: the text alternative the area ends up with, taken from the first source in `sources`.
- `sources`: each source of text the area has, in the order they are used for the name: `aria-labelledby`, `aria-label`, `alt`, `title`.
- `alt` (an area with an alt attribute): the alt text.

### `aria-allowed-attr`

**aria-* attributes must be permitted for the element’s role**

automatic · WCAG 4.1.2 (A) · confidence medium · default severity moderate

Checks that every recognized aria-* attribute present on an element with an explicit role is either globally supported or supported by that role.

**Applies to.** Applies to elements carrying at least one recognized, non-global aria-* attribute, judged against the role they actually have: an explicit valid role, else the implicit role of their tag, else, for the elements HTML-AAM maps to no role at all, nothing.

**Expectation.** Every recognized aria-* attribute present is either: (a) globally supported on any element (the "global" ARIA states/properties, e.g. aria-label/aria-hidden/aria-describedby), or (b) explicitly listed as a required or supported state/property for the element's role. An attribute ARIA deprecated (rather than prohibited) on the role is still allowed: it is reported as CANTTELL (see helpers.aria.isDeprecatedAttr) so the author decides, not as a not-allowed FAIL.

**What a finding reports.**

- `attr`: the aria-* attribute that is not allowed, or deprecated, on the element.
- `role` (an element with a role): the role it was judged against, explicit or implicit. Absent when the element has no role at all.

### `aria-allowed-role`

**Explicit role must be permitted for its host element**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that an explicit role="" attribute is one of the roles the ARIA-in-HTML specification permits for the host element (e.g. role="tab" is not permitted on &lt;nav&gt;).

**Applies to.** Applies to elements with an explicit, valid, non-abstract role, where the host element/attribute combination has an asserted permitted-roles constraint in the ARIA-in-HTML table (src/core/aria-helpers.js ALLOWED_ROLES_BY_ELEMENT).

**Expectation.** The explicit role is one of the roles the ARIA-in-HTML specification permits for that host element. Reported at CANTTELL rather than FAIL: ARIA-in-HTML's permitted-roles table is an author conformance requirement with no ACT rule and no WCAG mapping in any source. The role the author asked for is still the role assistive technology exposes, so whether the combination harms anyone depends on the widget, not on the table.

**What a finding reports.**

- `role`: the explicit role that is not permitted on the host element.

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

### `aria-conditional-attr`

**aria-errormessage requires aria-invalid to be set to a non-false value**

automatic · WCAG 4.1.2 (A) · confidence high · default severity moderate

Checks that elements with aria-errormessage also have aria-invalid set to "true", "grammar", or "spelling"; otherwise the error message is dropped from the accessibility tree.

**Applies to.** Elements with a non-empty `aria-errormessage` attribute.

**Expectation.** Per the ARIA specification, `aria-errormessage` is only exposed to assistive technology when `aria-invalid` is present with a value other than `"false"` (i.e. `"true"`, `"grammar"`, or `"spelling"`). An element with `aria-errormessage` but `aria-invalid` absent or `"false"` silently drops the error message from the accessibility tree, authors almost always intend it to be exposed. Reported at CANTTELL rather than FAIL: aria-errormessage is only exposed once aria-invalid is set, so the reference is currently inert. Whether that costs the user anything depends on whether the message is conveyed some other way (visible text next to the field, aria-describedby), which static markup does not settle.

**What a finding reports.**

- `ariaInvalid`: the element's `aria-invalid` value, lowercased; an empty string when the attribute is absent.

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

### `aria-hidden-body`

**The document &lt;body&gt; must not be aria-hidden**

automatic · WCAG 1.3.1, 4.1.2 (A) · confidence high · default severity critical

Checks that &lt;body&gt; does not have aria-hidden="true", which would remove the entire page from the accessibility tree.

**Applies to.** Always applicable to any HTML document with a &lt;body&gt; element, independent of contextSelector/root scoping, this is a whole- document concern, matching page-title-present's pattern of evaluating document.body directly rather than the scoped root.

**Expectation.** &lt;body&gt; does not have aria-hidden="true". Hiding the document body removes the entire page's content and structure from the accessibility tree at once, both 1.3.1 (Info and Relationships: the page's structure becomes entirely non-determinable) and 4.1.2 (Name, Role, Value: nothing in the document exposes a role/name/value any longer) apply.

### `aria-hidden-focus`

**ARIA hidden elements must not be focusable**

automatic · WCAG 2.4.7, 4.1.2 (AA) · confidence high · default severity serious

Checks that aria-hidden="true" elements are not focusable and do not contain focusable descendants.

**Applies to.** Applies to elements that have aria-hidden="true".

**Expectation.** No element with aria-hidden="true" may itself be focusable, and no focusable element may exist within an aria-hidden="true" subtree.

**What a finding reports.**

- `metrics.focusableTotal`: how many focusable elements the hidden element holds, counting itself if it is focusable.
- `metrics.focusableDescendants`: how many of those are inside it.
- `metrics.rootIsFocusable`: whether the hidden element itself can take focus.
- `offenders`: up to 5 of the focusable elements. Each item gives its `tag`, its `tabindex`, its `href` (a link), its `type` (an input) and its `visibilityHints`. `metrics.offendersCaptured` is how many are listed.
- `metrics.visibilityHints`: ways the focusable elements are made invisible while still taking focus: `opacityZero`, `offscreen`, `clipped`, `zeroSizeOverflowHidden`. Such an element is a focus stop a sighted keyboard user cannot see.
- `metrics.modalOpen`: whether a modal dialog was open elsewhere on the page, which turns the finding into one to review.
- `runtimeProbe`: `null` unless focusing the one focusable element moved focus straight out of the hidden element. Then it holds `redirected: true`, the tag and id of the element focus moved to (`redirectedToTag`, `redirectedToId`) and `focusTrace`, the elements focus passed through. A hidden focus sentinel that hands focus on like this is reported for review.

### `aria-prohibited-attr`

**ARIA naming attributes must not be used on roles that prohibit them**

automatic · WCAG 4.1.2 (A) · confidence high · default severity moderate

Checks that aria-label/aria-labelledby are not present on WAI-ARIA roles whose specification explicitly prohibits ARIA naming (e.g. generic, emphasis, strong, paragraph).

**Applies to.** Applies to (a) elements whose explicit, valid role is one of the ARIA 1.2 roles with a documented "Prohibited ARIA States and Properties" list for naming attributes (pure text-semantics / non-naming structural roles: caption, code, deletion, emphasis, generic, insertion, mark, none, paragraph, presentation, strong, subscript, suggestion, superscript, time), plus a native &lt;caption&gt; with no valid explicit role, whose implicit role is caption, and (b) elements with no role at all: a curated set of native HTML tags verified to carry no implicit role (see ROLELESS_NATIVE_TAGS below), or any autonomous custom element (a hyphenated, author-defined tag per the Custom Elements spec; see isRolelessCustomElementTag below). In both cases, only elements that also carry aria-label or aria-labelledby.

**Expectation.** Prohibited attributes must not be present on (a); for (b), the naming attribute is at best unreliable (nothing accessible-name-aware to hang it off) and at worst silently ignored by assistive technology. A roleless element whose own content already gives it a name is reported as CANTTELL, since the attribute may be a deliberate override; one with no other source for a name FAILs.

**What a finding reports.**

- `attr`: the naming attribute found, `aria-label` or `aria-labelledby`.
- `role`: the role that prohibits it; `null` on an element with no role.

### `aria-prohibited-children`

**Container roles must not own a child with a disallowed role**

automatic · WCAG 1.3.1 (A) · confidence medium · default severity moderate

Checks that every accessible-tree-owned child of a container role (list, listbox, menu, menubar, radiogroup, rowgroup, table, grid, treegrid, tablist, tree, row) has one of that role's allowed owned roles.

**Applies to.** Applies to elements with an explicit, valid role that is one of the container roles with a documented "required owned elements" entry (the same REQUIRED_OWNED_ROLES table aria-required-children uses, see src/core/aria-helpers.js).

**Expectation.** Every accessible-tree-owned descendant of the container (after pruning role="none"/"presentation" elements and any "group"/ "rowgroup" wrapper, both always transparent for owned-element matching per WAI-ARIA, regardless of whether "group"/"rowgroup" is itself in the container's own required-owned-roles set) has a role from that same required-owned set. Nothing else is a structurally valid direct child of a composite/container role, where "allowed" is the container's required-owned roles plus the small ALLOWED_EXTRA_OWNED_ROLES set of roles it may own without being required to (a separator between menu items, a caption on a grid). A roleless wrapper is descended into to reach the items a component library buries inside it, but once one is found there the rest of that wrapper's subtree is the item's own content and is not judged against the container.

**What a finding reports.**

- `containerRole`: the container's role.
- `containerSelector`: a selector for the container.
- `allowedOwnedRoles`: the roles the container may own. Each item is a role name.
- `childRole` (a child with a role): the child's role, which is not one of them. `null` on a child with no role.
- `attr` (a child with no role): what makes it a node of its own: the global aria-* attribute it carries, `tabindex`, or `nativeFocusable` when it can take focus without one (a link, a button).

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

### `aria-required-children`

**Container roles must own at least one required child role**

automatic · WCAG 1.3.1 (A) · confidence medium · default severity moderate

Checks that container roles with a documented "required owned elements" entry (list, listbox, menu, radiogroup, table, grid, tablist, tree, row, ...) contain at least one descendant or aria-owns-referenced element with an acceptable owned role.

**Applies to.** Applies to elements with an explicit, valid, non-abstract role that is also one of the container roles with a documented "required owned elements" entry (list, listbox, menu, menubar, radiogroup, rowgroup, table, grid, treegrid, tablist, tree, row).

**Expectation.** At least one descendant, or one aria-owns-referenced element, has one of the acceptable owned roles for that container role. Reported at CANTTELL, never FAIL: this rule asks only whether the required content is PRESENT, and a container that owns nothing conveys nothing false -- an empty role="list" is announced as a list with no items, which is what it is. Whether the content a container does own is VALID is aria-prohibited-children's decision, and that rule still fails, so a genuinely misdescribed structure (a role="button" among list items, a tablist of plain buttons) is caught with the same strength as before. The native-HTML equivalents already work this way: nothing in this ruleset fails an empty &lt;ul&gt;, and list-children-valid judges only the children that exist.

**What a finding reports.**

- `role`: the container's role.
- `requiredOwnedRoles`: the roles it needs at least one child with. Each item is a role name.

### `aria-required-parent`

**Roles requiring a specific context role must be in that context**

automatic · WCAG 1.3.1 (A) · confidence medium · default severity moderate

Checks that roles with a documented "required context role" entry (listitem, option, tab, treeitem, row, cell, ...) have an ancestor or aria-owns owner with an acceptable context role.

**Applies to.** Applies to elements with an explicit, valid, non-abstract role that is also one of the roles with a documented, non-empty "required context role" entry (listitem, option, menuitem, menuitemcheckbox, menuitemradio, tab, treeitem, row, cell, gridcell, columnheader, rowheader, rowgroup).

**Expectation.** The element has an ancestor (DOM containment) or owner (via that ancestor/owner's aria-owns) whose effective role is one of the acceptable context roles for this element's role.

**What a finding reports.**

- `role`: the element's role.
- `requiredContextRoles`: the roles one of which it must sit inside, or be owned by. Each item is a role name.

### `aria-role-name-present`

**ARIA roles that require an accessible name have one**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that the ARIA roles WAI-ARIA requires an accessible name for expose a non-empty one.

**Applies to.** Applies to elements whose role attribute is exactly one of grid, meter, progressbar, radiogroup or tree, and that are included in the accessibility tree. Membership is decided by WAI-ARIA's own "Accessible Name Required: True" characteristic, not by whether a role merely permits a name: tablist, toolbar, menu, menubar and scrollbar are name-from-author roles the spec does not require a name for, and are out of scope. meter and progressbar are also covered by meter-name-present and progressbar-name-present, which map to SC 1.1.1; this rule is what gives those two roles their 4.1.2 coverage.

**Expectation.** The element has a non-empty aria-label, an aria-labelledby that resolves to non-empty text, or a non-empty title. Every role in the set is name-from-author-only, so descendant text is not accepted: a labelled child inside a composite widget would otherwise pass the container that has no name of its own. The name the HTML host element gives itself counts too, since the browser still computes it under the role: the first child &lt;legend&gt; of a &lt;fieldset&gt;, the first child &lt;caption&gt; of a &lt;table&gt;, and an associated &lt;label&gt; on a labelable element such as &lt;progress&gt; or &lt;meter&gt;.

**What a finding reports.**

- `role`: the role that needs a name.

### `aria-roles-valid`

**role attribute must be a valid, non-abstract ARIA role**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that an explicit role="" attribute resolves to a real, non-abstract WAI-ARIA role.

**Applies to.** Applies to any element with a non-empty role="" attribute in the composed DOM.

**Expectation.**

At least one role token names a concrete, non-abstract ARIA role. Graded by what the element falls back to when none does:

- FAIL on a roleless host (div, span, custom element), which is left exposed as generic, so the role the author meant reaches no one.
- CANTTELL where the element has a native role (a &lt;button&gt;, &lt;nav&gt;, &lt;a href&gt;), which the accessibility tree keeps using. ACT 674b10 lists 4.1.2 as a secondary requirement only, "satisfied through the implicit role," so the bad token is worth reporting but is not itself the criterion failing.

**What a finding reports.**

- `role`: the first token of the role attribute. No token in it is a known role, or the known ones are all abstract.
- `nativeRole` (the CANTTELL case): the element's native role, which assistive technology keeps using.

### `aria-text`

**role="text" elements should have no focusable descendants**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that elements with role="text" contain no focusable descendant (link, button, form control, tabindex, iframe, or contenteditable).

**Applies to.** Elements with an explicit `role="text"`.

**Expectation.** `role="text"` tells assistive technology to treat an element's whole subtree as a single unit of plain text (e.g. text visually split across multiple `<span>`s by styling). Per the WAI-ARIA Authoring Practices, this only makes sense when that subtree contains no focusable content: a focusable descendant inside a "this is just text" region is unreachable or confusing for keyboard/AT users.

### `aria-valid-attr`

**aria-* attributes must be real, defined ARIA attributes**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that every aria-* attribute name present in the DOM is a real attribute defined by the WAI-ARIA specification.

**Applies to.** Applies to any element in the composed DOM that carries at least one attribute whose name starts with "aria-".

**Expectation.** Each aria-* attribute name is a real attribute defined by the WAI-ARIA specification (catches typos / made-up attribute names, which are silently ignored by assistive technology and therefore a real, deterministic defect). Reported at CANTTELL rather than FAIL: an aria-* attribute the spec does not define is inert, so nothing about the element's exposed name, role or value changes because it is there. Where the author meant a real attribute and the element ends up without a name, that absence is the naming rules' decision, not this one's. ACT 5f99a7 maps 1.3.1/4.1.2 as secondary requirements, "less strict" than the rule itself.

**What a finding reports.**

- `attr`: the aria-* attribute name that WAI-ARIA does not define.

### `aria-valid-attr-value`

**aria-* attribute values must match their declared type**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that every recognized aria-* attribute has a value conforming to its WAI-ARIA-declared value type (boolean, tristate, token, integer, number, or ID reference).

**Applies to.** Applies to any element carrying at least one recognized aria-* attribute (unrecognized attribute names are aria-valid-attr's concern, not evaluated here).

**Expectation.** Each attribute's value conforms to its WAI-ARIA-declared value type: boolean ("true"/"false"), tristate ("true"/"false"/"mixed"), a token from a fixed enumerated set, an integer (within the range WAI-ARIA sets for it), a real number, or an ID reference (list) that resolves to an existing element in the document. Per ACT 6a7281's own applicability ("any state or property that is NOT empty"), an explicitly empty value, including a bare boolean-style attribute with no "=value" at all, e.g. `aria-checked` alone, is out of scope for every value type, not a violation: a common, deliberate pattern in templated markup (e.g. React conditionally rendering `aria-describedby={hasError ? errorId : ''}`).

**What a finding reports.**

- `attr`: the attribute whose value is not valid.
- `value`: its value as written.
- `valueReason`: what is wrong with it. On a FAIL: `expected-true-false`, `expected-true-false-undefined`, `expected-true-false-mixed`, `expected-integer`, `expected-number` or `invalid-token` when it is not of the attribute's type, `integer-out-of-range` when it is below the lowest value ARIA allows, `expected-single-idref` when an attribute taking one id holds several, `idref-not-found` when aria-activedescendant's id matches no element. On a CANTTELL: `idref-list-none-found` when none of the ids in a list matches an element, `idref-controls-not-found` for the same on aria-controls.

### `autocomplete-valid`

**autocomplete attribute must be a valid autofill value**

automatic · WCAG 1.3.5 (AA) · confidence high · default severity moderate

Checks that a non-empty autocomplete attribute is "on"/"off" or a well-formed autofill detail token list.

**Applies to.** Applies to form controls (input, select, textarea) with a non-empty autocomplete attribute. Disabled controls (the disabled attribute, including a control disabled by a disabled fieldset ancestor, or aria-disabled="true") and input types with a fixed value are exempt, as in ACT 73f2c2.

**Expectation.** The value is "on"/"off" alone, or a well-formed autofill detail token list: an optional "section-*" token, then an optional "shipping"/"billing" token, then an optional contact-modality token (home/work/mobile/fax/pager), then exactly one recognized field-name token (name, email, street-address, cc-number, tel, ...), optionally followed by "webauthn". A malformed value means the field is not reliably identified for assistive technology that relies on autocomplete to describe the expected input purpose.

**What a finding reports.**

- `value`: the autocomplete value as written, trimmed.

### `avoid-inline-spacing`

**Inline style must not force text spacing below the WCAG metric**

automatic · WCAG 1.4.12 (AA) · confidence high · default severity moderate

Checks that where inline style forces line-height, letter-spacing or word-spacing with !important, the value already meets WCAG 1.4.12, so the user has nothing left to override.

**Applies to.** Applies to a rendered element with visible text of its own whose style attribute declares line-height, letter-spacing or word-spacing as `!important` with a real value. A CSS-wide keyword (inherit, initial, unset, revert) specifies no spacing of its own and is out of scope.

**Expectation.** Each such declaration already meets WCAG 1.4.12's own metric for that property, as a multiple of the font size: line-height at least 1.5, letter-spacing at least 0.12, word-spacing at least 0.16. A forced value that already satisfies the criterion leaves the user nothing to override.

**What a finding reports.**

- `properties`: the spacing properties the finding is about. Each item is `line-height`, `letter-spacing` or `word-spacing`. On a FAIL, or on text that may never wrap, they are the ones forced below the metric; on `INLINE_SPACING_NOT_RESOLVABLE`, the ones whose value could not be worked out.

### `binary-control-name-present`

**Binary controls have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that checkbox, radio, and switch controls expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="checkbox", role="radio" or role="switch" (the attribute must name one of those roles alone, not a fallback list) that are included in the accessibility tree. A native &lt;input type="checkbox"&gt;/&lt;input type="radio"&gt; is in scope only when it carries one of those roles explicitly; without a role attribute it belongs to form-control-programmatic-label-present.

**Expectation.** The control has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. A native checkbox or radio additionally accepts an associated &lt;label&gt;, the labels API, a wrapping &lt;label&gt;, or label[for], with at most four labels read for determinism, and any other element accepts its own subtree text, those roles being name-from-content.

### `button-name-present`

**Buttons have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that buttons expose a non-empty accessible name.

**Applies to.** Applies to &lt;button&gt;, &lt;input type="button"&gt;, &lt;input type="submit"&gt;, &lt;input type="reset"&gt; and elements with role="button", where the element is included in the accessibility tree. role="presentation"/"none" takes an element out of scope unless a global ARIA attribute or focusability restores its role, per presentational roles conflict resolution.

**Expectation.** The element has a non-empty accessible name. A programmatic name is taken first (aria-labelledby, aria-label, an associated &lt;label&gt;, title). Failing that, an &lt;input&gt; button falls back to its value attribute, and type="submit"/type="reset" fall back to the user agent's own "Submit"/"Reset" default, which is why those two are never nameless. Failing both, a button whose role is name-from-content falls back to its subtree text, counting each descendant's own name (an &lt;img alt&gt;, aria-label, an &lt;svg&gt;'s &lt;title&gt; child, or title) rather than only text nodes.

**What a finding reports.**

- `refs.accessibleName`: what the lookup of a programmatic name (aria-labelledby, aria-label, &lt;label&gt;, title) found. Its `mechanism` is the source it stopped at, `none` when there was none, and its `flags` say why a naming attribute that is there gave no name, for example `aria-label-empty` or `aria-labelledby-empty-or-unresolvable`.

### `bypass-blocks-present`

**Page must provide a way to bypass repeated blocks**

manual · WCAG 2.4.1 (A) · confidence medium · default severity moderate

Checks that the page has at least one recognized WCAG 2.4.1 bypass-blocks mechanism: a main landmark, a working same-page anchor link, or a heading.

**Applies to.** Always applicable to any HTML document with a &lt;body&gt; element: "bypass blocks" is a whole-page concern, matching aria-hidden-body / page-title-present's pattern of evaluating the document directly rather than a scoped root.

**Expectation.** At least one of the following recognized WCAG 2.4.1 techniques is present: (a) a main landmark (&lt;main&gt; or [role="main"]), technique ARIA11: a screen reader user can jump straight to it, bypassing everything before it (nav, header, repeated blocks) in one step; (b) a working same-page anchor link, technique G1/G123: an &lt;a href="#id"&gt; (or legacy &lt;a name="id"&gt;) whose target resolves to a real element in the link's own tree (light DOM or the same shadow root). Not required to be positioned before a &lt;nav&gt; or be keyboard-focus-order-first; (c) at least one heading (&lt;h1&gt;-&lt;h6&gt; or [role="heading"]) that is both included in the accessibility tree AND visible (not off-screen, clipped, opacity:0, or zero-size-overflow-hidden), technique H69: heading navigation is itself a standards-recognized bypass mechanism (e.g. a screen reader's "jump by heading" command), but ACT 047fe0's own Expectation requires visibility too, since a screen-reader-only heading leaves sighted keyboard users with no equivalent way to locate the start of non-repeated content.

### `canvas-text-alternative-present`

**&lt;canvas&gt; must provide a text alternative**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that &lt;canvas&gt; elements provide a text alternative via fallback content or an accessible name.

**Applies to.** Applies to &lt;canvas&gt; elements included in the accessibility tree. Hidden elements are excluded whether or not they are focusable.

**Expectation.**

Each applicable &lt;canvas&gt; provides a text alternative via fallback content or an accessible name, with two exceptions:

- role="img" (first role token) makes the canvas's children presentational and its name comes from the author only, so fallback content does not count: aria-labelledby, aria-label or title must name it.
- role="none"/"presentation" marks the canvas decorative, and it passes. The role is ignored (presentational role conflict) when the canvas is focusable or carries aria-label/aria-labelledby, and the canvas is then judged like any other.

### `canvas-text-alternative-quality`

**&lt;canvas&gt; text alternative must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;canvas&gt; elements with a detected text alternative for human review of equivalence and appropriateness.

**Applies to.** Applies to &lt;canvas&gt; elements that already carry a text alternative: fallback content inside the element, an ARIA name, or a title. A &lt;canvas&gt; with none of those has no alternative whose quality could be judged; that's canvas-text-alternative-present's failure. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

**What a finding reports.**

- `value`: the text alternative to review. When the fallback content has no text of its own but holds an image with alt text or an element with an aria-label, this is the placeholder `fallback-content`.
- `mechanism`: where the text alternative comes from: `canvas-fallback` (content inside the &lt;canvas&gt;), `aria-labelledby`, `aria-label` or `title`.
- `flags`: notes on how the text alternative was found, such as `title-used` when only the title attribute provides it.

### `combobox-name-present`

**Comboboxes have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="combobox" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="combobox" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="combobox" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom combobox widget is not reliably exposed as its name. On a labelable element (&lt;input role="combobox"&gt;) an associated &lt;label&gt; counts as well. On a text-like &lt;input&gt; or a &lt;textarea&gt;, the placeholder counts last (HTML-AAM's final name source): a placeholder-only label is a 3.3.2 question, not a missing name.

### `contrast-computable`

**Color contrast is computable for rendered text**

automatic · WCAG 1.4.3, 1.4.6 (AAA) · confidence high · default severity serious

Determines whether sufficient information is available to compute WCAG color contrast for visible text (e.g., no gradients/images/blend modes that make background indeterminate).

**Applies to.** Applies to every visible text node in scope, plus the label of &lt;input type="button"&gt;/[type="submit"]/[type="reset"], which is rendered from the value attribute and so is invisible to a text-node walk. Text counts only when its element is DOM-visible under the run's visibility mode, is not clipped out of sight by the sr-only technique (clip or clip-path), and belongs neither to a disabled control nor to the label of one, WCAG's inactive-user-interface-component exception. Subtrees excluded via engineOptions.excludeSelectors are skipped, and open shadow roots are walked as roots in their own right.

**Expectation.** Both sides of the contrast calculation can be established from CSS for every applicable text node: an effective background resolving to an opaque color, and a parsable foreground color. Where either cannot be, a background image or gradient, mix-blend-mode, a filter or backdrop-filter, a text-shadow (which may add contrast this engine has no glyph-rendering model to account for), ancestor opacity, a root background that never becomes opaque, or a color that does not parse, the result is cantTell naming the blocker. This rule is the one that reports that uncertainty, which is what lets contrast-minimum and contrast-enhanced stay silent on the same text instead of guessing at a ratio.

**What a finding reports.**

- `blockerProperty`, `blockerValue` (a CSS effect in the way): the CSS property that blocks the calculation and its value, for example `mix-blend-mode`, `filter`, `text-shadow` or `opacity`.
- `blockerSelector` (a CSS effect in the way): a selector for the element that has it, which may be an ancestor of the text.
- `backgroundFillType` (a background image or gradient): `image`, `gradient`, `imageAndGradient`, or `unknown`.
- `background`, `backgroundAlpha` (a background that never becomes opaque, or a color that does not parse): the background color as far as it could be worked out, as an `rgba()` string, and its opacity from 0 to 1.
- `eligibleTextCount` (the pass): how many text nodes were checked.
- `assumptionsCount`, `assumptionsApplied` (the pass): how many text nodes needed an assumption to get a background, and which ones were made. Each item is a code; `ROOT_CANVAS_FALLBACK` means a page background that never becomes opaque was taken to sit on the configured canvas color, white by default.

### `contrast-enhanced`

**Text meets enhanced color contrast (AAA)**

automatic · WCAG 1.4.6 (AAA) · confidence high · default severity serious

Checks that visible text has a contrast ratio of at least 7:1 (normal) or 4.5:1 (large), when contrast is computable from CSS.

**Applies to.** Applies to the visible text contrast-computable applies to, see that rule for the eligibility gates, narrowed to text whose background and foreground are actually computable. Eligible text that is not computable leaves this rule notApplicable rather than cantTell: reporting that uncertainty belongs to contrast-computable, so the two never report the same text twice.

**Expectation.** Every computable text node reaches the ratio SC 1.4.6 requires for its size: 4.5:1 for large text, 7:1 for everything else. Text is large at 24px or more, or at 14pt (about 18.667px) or more when the computed font weight is 700 or higher.

**What a finding reports.**

- `metrics.ratio` (a FAIL): the text's contrast ratio, for example 4.5 for 4.5:1, unrounded, against `metrics.threshold` (7, or 4.5 for large text).
- `colors.foregroundHex`, `colors.backgroundHex` (a FAIL): the text and background colors the ratio was computed from, as hex. A semi-transparent text color is first blended onto the background.
- `colors.foregroundRgba`, `colors.backgroundRgba` (a FAIL): the same colors as `rgba()` strings.
- `typography.fontSizePx`, `typography.fontSizePt` (a FAIL): the computed font size in CSS pixels and in points.
- `typography.fontWeight`, `typography.fontWeightLabel`, `typography.isBold` (a FAIL): the computed font weight as a number, `bold` (700 or more) or `normal`, and whether it counts as bold.
- `typography.isLargeText` (a FAIL): whether the text counts as large, which sets the threshold.
- `assumptionsApplied`, `assumedRootCanvasColor` (a FAIL): `null` unless the page background never became opaque and was taken to sit on a canvas color. Then `assumptionsApplied` is `["ROOT_CANVAS_FALLBACK"]` and `assumedRootCanvasColor` is the color assumed.
- `eligibleTextCount`, `computableTextCount` (the pass, and the notApplicable result when no text was computable): how many text nodes were in scope, and how many of those had colors that could be worked out. The pass repeats both under `metrics`.

### `contrast-minimum`

**Text meets minimum color contrast (AA)**

automatic · WCAG 1.4.3 (AA) · confidence high · default severity serious

Checks that visible text has a contrast ratio of at least 4.5:1 (normal) or 3:1 (large), when contrast is computable from CSS.

**Applies to.** Applies to the visible text contrast-computable applies to, see that rule for the eligibility gates, narrowed to text whose background and foreground are actually computable. Eligible text that is not computable leaves this rule notApplicable rather than cantTell: reporting that uncertainty belongs to contrast-computable, so the two never report the same text twice.

**Expectation.** Every computable text node reaches the ratio SC 1.4.3 requires for its size: 3:1 for large text, 4.5:1 for everything else. Text is large at 24px or more, or at 14pt (about 18.667px) or more when the computed font weight is 700 or higher.

**What a finding reports.**

- `metrics.ratio` (text below the threshold): the text's contrast ratio against its background (4.5 for 4.5:1), against `metrics.threshold`, the ratio its size requires.
- `colors.foregroundHex`, `colors.backgroundHex` (text below the threshold): the text color and the background color behind it, as hex, after any transparency is blended in. `colors.foregroundRgba` and `colors.backgroundRgba` give the same two colors in `rgba()` form.
- `typography.fontSizePx`, `typography.fontSizePt` (text below the threshold): the computed font size, in CSS pixels and in points.
- `typography.fontWeight`, `typography.fontWeightLabel` (text below the threshold): the computed font weight as a number (400, 700) and as written.
- `typography.isBold`, `typography.isLargeText` (text below the threshold): whether the text counts as bold, and as large text, the size that only needs 3:1.
- `assumptionsApplied`, `assumedRootCanvasColor` (text below the threshold): `null` unless the `auditorAssist` contrast mode had to assume a page background because the page sets none that is opaque. Then `assumptionsApplied` is `['ROOT_CANVAS_FALLBACK']` and `assumedRootCanvasColor` is the color assumed (white by default).
- `eligibleTextCount`, `computableTextCount` (the summary when nothing fails): how many text nodes the rule looked at, and how many of them had colors it could compute. Repeated under `metrics` on a pass.

### `css-focus-indicator-suppressed`

**Focus indicator must not be removed without a replacement**

manual · WCAG 2.4.7 (AA) · confidence medium · default severity serious

Flags elements in the tab order whose focus outline is removed, by a :focus/:focus-visible rule or by a rule with no state such as a { outline: none }, with no replacement indicator (border, box-shadow, background, ...) in any focus rule matching them.

**Applies to.** Elements in sequential focus navigation (tabbable and rendered) on a page whose accessible stylesheets contain at least one rule that removes the outline. With no such rule anywhere, every element keeps the user agent's own indicator and there is nothing to check.

**Expectation.** No element is matched by a rule that removes the outline (`outline: none`, `outline: 0`, `outline-color: transparent`, ...) unless some focus rule matching it draws a replacement: a border, box-shadow, background, color change, a positive outline of its own, or a `::before`/`::after` decoration. The removing rule is either a `:focus`/`:focus-visible` rule, or a rule with no state at all (`a { outline: none }`, `* { outline: 0 }`): an author declaration outranks the user agent's focus outline whatever its specificity, so it removes the indicator in the focused state too (WCAG F78).

**What a finding reports.**

- `suppressingSelectors`: the selector of each style sheet rule that removes the element's outline, one item per selector.

### `css-hidden-focus`

**Focusable elements must not be visually hidden**

manual · WCAG 2.4.7 (AA) · confidence low · default severity serious

Checks that keyboard-focusable elements are not visually hidden by CSS techniques that can leave them in the tab order.

**Applies to.** Applies to elements that are tabbable (keyboard-focusable) but are visually hidden via CSS techniques that can leave them in the tab order.

**Expectation.** No element should be tabbable while visually hidden (e.g., opacity:0, clipped, off-screen). An element that CSS brings back into view when it takes focus is not hidden while focused, and is not flagged: the usual skip-link pattern (`.skip { position: absolute; left: -9999px } .skip:focus { left: 0 }`), or a hiding rule that stops applying on focus (`.visually-hidden-focusable:not(:focus) { clip: rect(0 0 0 0) }`).

**What a finding reports.**

- `metrics.visibilityHints`: how the element is hidden while it can take focus: `opacityZero`, `offscreen`, `clipped` or `zeroSizeOverflowHidden` (no size, with overflow hidden).
- `runtimeProbe`: `null` unless focusing the element moved focus straight to another element (`cssHiddenTabbable_runtimeRedirect_needsReview`). Then it holds `redirected: true` and the tag and id of the element focus moved to (`redirectedToTag`, `redirectedToId`). Only the first three hidden elements are tried this way.

### `css-orientation-lock`

**CSS must not lock the page to a single orientation**

automatic · WCAG 1.3.4 (AA) · confidence high · default severity serious

Checks that no @media (orientation: portrait|landscape) rule sets a transform: rotate(...) on the page, a known technique for defeating device orientation, and asks about any such rule that hides the page's main content.

**Applies to.** Any accessible (same-document, non-cross-origin) stylesheet, inline `<style>` blocks and same-origin `<link>` stylesheets already loaded into `document.styleSheets`.

**Expectation.** No `@media (orientation: portrait)` or `@media (orientation: landscape)` block sets a `transform`/`-webkit-transform`/`rotate` rotation of approximately 90 degrees (mod 180, i.e. ~90 or ~270), the well-known technique for visually forcing one orientation regardless of the device's actual orientation, which defeats WCAG 1.3.4's requirement that content not restrict its view to a single display orientation unless that orientation is essential. Such a rotation fails. A second shape is asked about (cantTell): an orientation media block that hides the page's content with `display: none` or `visibility: hidden`, the usual form of WCAG F100 (content replaced by a "rotate your device" message in one orientation). The hidden element counts as the page's content when it is `html` or `body`, the `main` landmark, an ancestor of it, or, on a page without a main landmark, an element holding at least half of the body's text. Whether the orientation is essential, and whether the page stays usable, is left to a person.

**What a finding reports.**

- `mediaText` (a rotation or hidden content): the media query that holds the rule, such as `(orientation: portrait)`.
- `selectorText` (a rotation or hidden content): the selector of the style rule that rotates or hides. Empty when it could not be read.
- `unreadableSheetCount` (`STYLESHEETS_NOT_READABLE`): how many style sheets could not be read, usually because they come from another origin.

### `definition-list-children-valid`

**Description lists must be structured correctly**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;dl&gt; elements only directly contain &lt;dt&gt;/&lt;dd&gt; groups (optionally wrapped in one &lt;div&gt;), &lt;script&gt;, &lt;template&gt;, or &lt;style&gt;.

**Applies to.** Applies to &lt;dl&gt; elements that have at least one direct element child or non-whitespace text directly inside them.

**Expectation.** Every direct element child is &lt;dt&gt;, &lt;dd&gt;, &lt;script&gt;, &lt;template&gt;, &lt;style&gt;, or a &lt;div&gt; whose own children are drawn from that same set (a single level of wrapping div is allowed, matching how authors commonly group dt/dd pairs). Non-whitespace text directly inside the &lt;dl&gt; or a wrapping &lt;div&gt; is an invalid child too. If the flattened set contains any &lt;dt&gt; or &lt;dd&gt; at all, it must contain BOTH (an unbalanced dt-without-dd or dd-without-dt is invalid), and read in order it must be groups of one or more &lt;dt&gt; followed by one or more &lt;dd&gt;: a &lt;dd&gt; before the first &lt;dt&gt; has no term, and a &lt;dt&gt; after the last &lt;dd&gt; has no definition. A flattened set with neither is vacuously fine, not a violation (see implementation-notes). Any other direct or wrapped child breaks the description-list semantics assistive technologies rely on.

**What a finding reports.**

- `invalidChildren`: the children that do not belong in the list, one tag name per child (`#text` for text placed directly inside). Empty when the problem is a missing or misordered `<dt>`/`<dd>`.

### `deprecated-elements-not-used`

**Scrolling &lt;marquee&gt; content must be possible to pause, stop, or hide**

automatic · WCAG 2.2.2 (A) · confidence high · default severity serious

Asks, for each obsolete &lt;marquee&gt; element, whether the page offers a way to pause, stop, or hide its auto-scrolling content, since the element itself has none.

**Applies to.** Applies to any scan scope; whether it contains a &lt;marquee&gt; element is always an answerable question. &lt;marquee&gt; is an obsolete, non-standard HTML element that browsers still render as auto-scrolling text, with no built-in user mechanism to pause, stop, or hide it.

**Expectation.** Each &lt;marquee&gt; is reported as cantTell: the scrolling itself is certain, but a page can offer its own pause or stop control (a button calling the element's stop() method, for example), and then failure F16 does not apply. Whether such a control exists is for a person to check. A scope with no &lt;marquee&gt; passes; there is no separate not-applicable case.

### `dialog-name-present`

**Dialogs have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that dialogs (elements with role="dialog" or role="alertdialog", and native &lt;dialog&gt; elements) expose a non-empty accessible name.

**Applies to.** Applies to elements included in the accessibility tree whose role is dialog or alertdialog: an element whose role attribute resolves to one of those roles (the first token that names a concrete ARIA role wins, so role="alertdialog dialog" is an alertdialog), and a native &lt;dialog&gt; whose role attribute is absent or names no concrete role (its implicit role is dialog). A closed &lt;dialog&gt; is hidden and so not in scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. Both roles are name-from-author-only, so the heading or body text inside the dialog is not accepted as its name unless aria-labelledby points at it.

### `dlitem-parent-valid`

**Description-list items must be inside a description list**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;dt&gt;/&lt;dd&gt; elements are contained by a &lt;dl&gt;, directly or via one wrapping &lt;div&gt;.

**Applies to.** Applies to &lt;dt&gt;/&lt;dd&gt; elements that have a parent element.

**Expectation.** The parent is &lt;dl&gt;, or the parent is a &lt;div&gt; whose own parent is &lt;dl&gt; (a single level of wrapping div is allowed, matching how authors commonly group dt/dd pairs). A &lt;dt&gt;/&lt;dd&gt; used outside a real description-list container is not exposed as a term/definition to assistive technologies.

**What a finding reports.**

- `parentElement`: the tag name of the element's parent, the container it is in instead of a `<dl>`.

### `duplicate-id`

**IDs must be unique**

automatic · WCAG 4.1.1 (A) · confidence high · default severity moderate

Checks that every non-empty id attribute value is unique within its own document or shadow tree (WCAG 2.0/2.1 SC 4.1.1, removed in WCAG 2.2).

**Applies to.** Applies to any element carrying a non-empty id attribute. Visibility is irrelevant. A duplicate id breaks the same lookups whether the element renders or not, which is why ACT 3ea0c8 evaluates hidden elements too.

**Expectation.** No other element in the same tree carries the same id value, compared exactly as written (id="a " and id="a" are different ids). Ids are scoped per document tree and per shadow tree, so the same id inside two different shadow roots is not a duplicate.

**What a finding reports.**

- `id`: the duplicated id.
- `count`: how many elements in the same tree carry it.

### `duplicate-id-aria`

**IDs referenced by ARIA must be unique**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that any id value referenced by an ARIA ID-reference attribute (aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-activedescendant, aria-flowto, aria-errormessage, aria-details) is unique in the document.

**Applies to.** Applies when the document contains at least one non-empty aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-activedescendant, aria-flowto, aria-errormessage, or aria-details attribute (i.e. at least one ARIA ID reference exists to resolve).

**Expectation.** For every id value referenced by one of those attributes, exactly one element in the document carries that id. A duplicate does not break the reference: it resolves to the first element in tree order, so the name is still computed. Whether that element is the intended target depends on author intent, which markup does not carry, so the outcome is cantTell.

**What a finding reports.**

- `id`: the duplicated id an ARIA attribute refers to.
- `duplicateCount`: how many elements in the document carry that id.

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

### `embed-text-alternative-quality`

**&lt;embed&gt; text alternative must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;embed&gt; elements with a detected name for human review of appropriateness.

**Applies to.** Applies to &lt;embed&gt; elements that already carry a text alternative: a non-empty aria-label, an aria-labelledby that resolves to non-empty text, or a non-empty title. An aria-labelledby pointing at a missing id resolves to nothing and so is not a text alternative to review; that element is embed-text-alternative-present's failure. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

**What a finding reports.**

- `ariaLabel`, `title`: the element's `aria-label` and `title`, or null when it has none.
- `ariaLabelledBy`: the ids in the element's `aria-labelledby`, or null when it has none.
- `ariaLabelledByText`: the text those ids point at, or null. Only looked up when the element has no `aria-label`, since `aria-label` then gives the name.

### `empty-heading`

**Headings must not be empty**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that heading elements (&lt;h1&gt;-&lt;h6&gt; or role="heading") have a non-empty accessible name.

**Applies to.** Applies to elements with a heading role: native &lt;h1&gt;-&lt;h6&gt;, or any element with explicit role="heading" (unless overridden by another explicit role).

**Expectation.** The heading has a non-empty accessible name: aria-label, aria-labelledby, visible text content not hidden from assistive technology, or (as a last resort) a title attribute. An empty heading is announced as "heading, level N" with nothing else, which is confusing when navigating by heading.

### `empty-table-header`

**Table header cells must not be empty**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that table header cells (&lt;th&gt;, or any element with role="columnheader"/"rowheader") have visible text content. A header named only via aria-label/aria-labelledby is also flagged, since real screen-reader/browser support for that is inconsistent.

**Applies to.** Applies to &lt;th&gt; elements that don't carry a conflicting explicit role, plus any element (native &lt;th&gt; or not) with role="columnheader" or role="rowheader" (`th:not([role]), [role="columnheader"], [role="rowheader"]`): a &lt;th&gt; that explicitly restates role="columnheader"/"rowheader" is still covered via the second clause, but a &lt;th role="presentation"&gt; (no longer meaningfully a header) is correctly excluded, and an ARIA-role-only header (e.g. a &lt;div role="columnheader"&gt; in a role="grid"/role="table" widget) is caught too.

**Expectation.** The header cell has visible text content. A &lt;th&gt; named only via aria-label/aria-labelledby (no visible text) is ALSO flagged, not treated as equivalent: aria-label support on &lt;th&gt; is inconsistent in practice. NVDA+Firefox and iOS VoiceOver+Safari ignore it entirely (only visible text is announced), JAWS+Chrome/IE11 also only announce visible text in the header cell itself. Visible text is the one mechanism confirmed to work across every tested combination. See https://html5accessibility.com/stuff/2024/05/22/not-so-short-note-on-aria-label-usage-big-table-edition/.

**What a finding reports.**

- `ariaName` (`TABLE_HEADER_NAME_NOT_VISIBLE_TEXT`): the name the header cell gets from `aria-label` or `aria-labelledby` instead of visible text.

### `focus-order-semantics`

**Elements added to the tab order should have interactive semantics**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Flags elements with tabindex &gt;= 0 whose explicit role is a non-interactive structural/document role (e.g. heading, list, region, presentation), for manual review.

**Applies to.** Elements with an explicit `tabindex` of `0` or greater (in the tab order) AND an explicit `role` attribute that is one of a curated set of clearly non-interactive, structural/document roles.

**Expectation.** An element placed in the tab order on purpose should communicate why it's focusable: a role like `heading`, `list`, `region`, or `presentation` gives assistive technology no interactive semantic to announce, which is confusing for keyboard users who land on it and get no indication of what activating it (if anything) would do.

**What a finding reports.**

- `tabindex`: the element's `tabindex`, as a number (0 or greater).
- `role`: the non-interactive role the element carries.

### `form-control-label-quality`

**Form field labels should be descriptive and distinguishable**

manual · WCAG 2.4.6 (AA) · confidence medium · default severity minor

Flags a visible form-field label that is a placeholder ("Label", "Field"), or that repeats another field's label with no visible context (heading, legend, or row) telling the two apart. English placeholders are always recognized, and German, Spanish, French or Japanese ones when the field is in that language.

**Applies to.** Visible form fields: native `input` (excluding hidden and the button-like types), `select`, `textarea`, or an element with one of the ARIA widget roles ACT cc0f0a lists (checkbox, combobox, listbox, menuitemcheckbox, menuitemradio, radio, searchbox, slider, spinbutton, switch, textbox) that carry a visible programmatic label: a `<label>` association, or the elements `aria-labelledby` points at. A field named only by `aria-label`/`title` has no visible label to judge and is out of scope here (its labelling mechanism is `form-control-programmatic-label-quality`'s concern, its presence `form-control-programmatic-label-present`'s).

**Expectation.** The visible label text (a) is not a placeholder left in the markup ("label", "field", "enter text", ...), (b) is not shared with another field that no visible context tells apart (the same "Name" twice, with nothing visible on screen saying which is shipping and which is billing), and (c) is the whole of the field's programmatic label, not the visible fragment of a label whose descriptive part is hidden.

**What a finding reports.**

- `label`: the visible label text of the field.
- `sharedWith`: how many other fields have the same label with nothing visible telling them apart, a count. 0 when no other field shares it.
- `hiddenLabelParts`: how many parts of the field's label are hidden from sight, a count. 0 when the whole label is visible.

### `form-control-programmatic-label-present`

**Form controls must have a programmatic label**

automatic · WCAG 1.3.1, 3.3.2, 4.1.2 (A) · confidence medium · default severity serious

Checks that form controls have a programmatic label via &lt;label&gt;, aria-label, aria-labelledby, title, or placeholder.

**Applies to.** Applies to &lt;input&gt;, &lt;select&gt; and &lt;textarea&gt; elements included in the accessibility tree, excluding the input types hidden, submit, reset, button and image, which take their name from a value or alt attribute rather than from a label. A control carrying an explicit ARIA widget role is out of scope, button, checkbox, combobox, listbox, textbox, slider and the rest of ROLE_OWNED_ELSEWHERE each have a naming rule of their own, and role="presentation"/"none" removes a control unless it is still tabbable.

**Expectation.** Each applicable control carries a programmatic label by one of the mechanisms helpers.getLabelMethod resolves, in its priority order: an associated &lt;label&gt;, aria-labelledby, aria-label, title, then placeholder. Any of the five satisfies this rule. Whether the weaker two are an appropriate primary label is a separate question, asked by form-control-programmatic-label-quality.

### `form-control-programmatic-label-quality`

**Form controls should not rely on placeholder or title as the primary label**

manual · WCAG 4.1.2 (A) · confidence medium · default severity moderate

Flags form controls whose computed accessible name relies on placeholder or title as the primary labeling method. Prefer &lt;label&gt; or aria-labelledby.

**Applies to.**

Applies to labelable native form controls exposed to assistive technologies:

- input (excluding type=hidden|submit|reset|button|image)
- select
- textarea

role="presentation"/"none" are excluded only when not focusable.

**Expectation.**

If a control has a programmatic name, it should not rely ONLY on:

- placeholder (non-empty)
- title (non-empty)

Prefer an associated &lt;label&gt; or aria-labelledby.

**What a finding reports.**

- `labelMethod`: where the control's label comes from: `placeholder` or `title`.
- `sourceText`: the label text, up to 120 characters.

### `form-control-single-label`

**Form controls must not have multiple labels**

automatic · WCAG 3.3.2 (A) · confidence high · default severity moderate

Checks that a form control is associated with at most one &lt;label&gt; (by wrapping or by label[for]).

**Applies to.** Applies to labelable form controls (input, excluding hidden/submit/reset/button/image; select; textarea).

**Expectation.**

At most one &lt;label&gt; that can contribute to the control's accessible name is associated with it, by wrapping it, or by a &lt;label for="..."&gt; on its id (a label that both wraps and self-references via for counts once). Graded by whether the surplus labels actually compete for the name:

- PASS when an override (aria-labelledby / aria-label) supersedes every native &lt;label&gt;: the labels then contribute nothing to the name, so they cannot be ambiguous. A visible-label-vs-name mismatch is SC 2.5.3 Label in Name's concern, not this rule's.
- FAIL when two or more non-empty labels compete and there is no override: screen readers announce a non-deterministic subset.
- CANTTELL when one non-empty label is joined by empty label association(s) and there is no override: the name usually resolves to the real label, but handling of the empty association is not guaranteed across user agents.

All-empty associations with no override are a missing-name case (the sibling rule form-control-programmatic-label-present), not an ambiguity, so this rule stays silent.

**What a finding reports.**

- `labelCount`: how many labels are associated with the control. On the competing-labels failure, only the non-empty ones are counted; on the empty-label case, the empty ones are counted too.
- `contributingLabelCount` (the empty-label case): how many of those labels have text, and so give the control its name.

### `heading-order`

**Heading levels must not skip a level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that heading levels increase by at most one at a time in document order.

**Applies to.** Applies whenever the page contains two or more heading elements (native &lt;h1&gt;-&lt;h6&gt;, or explicit role="heading" with aria-level; default level 2 per the ARIA spec when aria-level is absent/invalid). A native &lt;hx&gt; with a valid aria-level (a positive integer) takes that level, as browsers expose it; otherwise it takes its tag level.

**Expectation.** In document order, each heading's level is no more than one greater than the highest heading level seen so far. Jumping deeper by more than one level (e.g. an &lt;h1&gt; followed directly by an &lt;h3&gt;, skipping &lt;h2&gt;) breaks the document outline assistive technology users rely on when navigating by heading. Going back to a shallower level at any point is always fine.

**What a finding reports.**

- `fromLevel`: the deepest heading level reached before this heading (3 for an &lt;h3&gt;).
- `toLevel`: this heading's level, more than one deeper than `fromLevel`.

### `heading-quality`

**Heading text should be descriptive, not a placeholder**

manual · WCAG 2.4.6 (AA) · confidence medium · default severity minor

Flags headings whose accessible name is a placeholder rather than a description of the content that follows: a generic word ("Heading", "Untitled"), a numbered template slot ("Section 2"), a filename, or a URL. English phrases are always recognized, and German, Spanish, French or Japanese ones when the heading is in that language.

**Applies to.** Elements with a heading role (native &lt;h1&gt;-&lt;h6&gt;, or any element with an explicit role="heading") that are included in the accessibility tree and have a non-empty accessible name. A heading with no name at all is `empty-heading`'s concern, not this rule's.

**Expectation.** The heading's accessible name, normalized (whitespace-collapsed, case-folded, trailing punctuation stripped), is not a placeholder left in the markup: a known generic word ("heading", "title", "untitled", "lorem ipsum", ...), a numbered template slot ("Heading 2", "Section 3"), a filename, or a URL. None of these describe the topic or purpose of the content they introduce.

**What a finding reports.**

- `name`: the heading's accessible name, with whitespace collapsed.
- `normalizedName`: the same name as it was matched: lower case, with trailing punctuation removed.

### `html-lang-attr-present`

**Page language is declared**

automatic · WCAG 3.1.1 (A) · confidence high · default severity serious

Checks that the default language of the page is programmatically declared.

**Applies to.** Applies to HTML documents with a root &lt;html&gt; element. The rule evaluates the document element only and does not iterate over child nodes. Non-HTML documents or documents without a document element are not applicable.

**Expectation.** The &lt;html&gt; element has a lang attribute. The lang attribute is not empty and its primary language subtag (the part before the first hyphen) is a registered language subtag, as ACT bf051a requires. A malformed later subtag (lang="fr-FR-!!") still identifies French, so it passes here; it is a markup validity error, not a missing language.

**What a finding reports.**

- `lang` (a language that is not valid): the `lang` attribute's value, as written.

### `html-xml-lang-mismatch`

**lang and xml:lang must not disagree**

automatic · WCAG 3.1.1 (A) · confidence high · default severity serious

Checks that the &lt;html&gt; element's lang and xml:lang attributes declare the same primary language, when both are present.

**Applies to.** Applies when the &lt;html&gt; element has both a non-empty lang attribute and a non-empty xml:lang attribute.

**Expectation.** The primary language subtag (the part before the first "-") of lang and xml:lang match, case-insensitively. When both attributes are present but declare different languages, assistive technology and user agents may resolve the page's language inconsistently.

**What a finding reports.**

- `lang`, `xmlLang`: the values of the `lang` and `xml:lang` attributes, as written.

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

### `identical-links-same-purpose`

**Links with the same accessible name should lead to the same destination**

manual · WCAG 2.4.9 (AAA) · confidence low · default severity minor

Flags groups of links that share the same accessible name but resolve to more than one distinct destination, for manual review of whether they serve the same purpose.

**Applies to.** Any `a[href]` or `[role="link"]` with a non-empty accessible name, grouped by that name (trimmed, whitespace-collapsed, case-folded).

**Expectation.** Within a page, links that share the same accessible name are expected to serve the same purpose (i.e. resolve to the same destination, the full resolved URL, including any fragment). Same-text-different- destination links are common and frequently intentional in real sites (e.g. repeated "Read more" links per article card), so this is authored as `type: 'manual'` (cantTell-capped, never fail) rather than a hard fail, flagging a real name/destination mismatch for human judgment instead of guessing intent.

**What a finding reports.**

- `name`: the accessible name the links share, trimmed, with whitespace collapsed and in lower case.
- `href`: the full URL this link leads to.
- `distinctDestinationCount`: how many different URLs the links with this name lead to, a count of 2 or more.

### `iframe-focusable-content`

**Frames with tabindex="-1" must not contain focusable content**

automatic · WCAG 2.1.1 (A) · confidence high · default severity moderate

Checks that same-origin &lt;iframe&gt;/&lt;frame&gt; elements with tabindex="-1" do not contain focusable content, since browsers do not propagate that restriction into the frame’s embedded document.

**Applies to.** Applies to &lt;iframe&gt;/&lt;frame&gt; elements with an explicit negative tabindex, whose embedded document is same-origin and reachable via contentDocument (cross-origin/unreachable frames assert nothing, see implementation notes).

**Expectation.** The frame's embedded document contains no focusable element. Browsers do not propagate tabindex="-1" on the host &lt;iframe&gt; into its embedded document: Tab can still reach focusable content inside, even though the frame itself is skipped. An author who set tabindex="-1" intending to remove the frame from the tab order has not actually done so if the embedded document contains focusable content. Exception: an iframe with both a `width` and `height` HTML attribute of 2px or less (a common "tracking pixel" pattern) cannot render any perceptible content, so focusable content inside it never satisfies ACT akn7bn's "visible" requirement and doesn't count.

### `iframe-name-present`

**Frames have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that &lt;iframe&gt;/&lt;frame&gt; elements expose a non-empty accessible name via aria-label, aria-labelledby, or the title attribute.

**Applies to.** Applies to &lt;iframe&gt;/&lt;frame&gt; elements that are eligible for the accessibility tree (isAccTreeEligible) AND reachable by sequential focus navigation, both conditions required, regardless of role.

**Expectation.** The element has a non-empty accessible name via aria-labelledby, aria-label, or the title attribute. Unlike most interactive elements, an iframe's name is never derived from its rendered content (the embedded document is a separate browsing context), this mirrors dialog-name-present's "name-from-author-only" reasoning.

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

### `img-alt-decorative`

**Excluded &lt;img&gt;/&lt;canvas&gt;/&lt;svg&gt; must be decorative (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;img&gt;, &lt;canvas&gt; and &lt;svg&gt; elements excluded from the accessibility tree (aria-hidden, role="none"/"presentation", empty alt, or an unlabeled svg/canvas) for human review that they are purely decorative.

**Applies to.** Applies to visible &lt;img&gt;, &lt;canvas&gt; or &lt;svg&gt; elements excluded from the accessibility tree by any of: an aria-hidden ancestor-or-self, an explicit role="none"/"presentation" not overridden by focusability, an &lt;img alt=""&gt; (the native decorative marker, same focusability override; only a literally empty alt, so alt=" " is not one), an unlabeled &lt;svg&gt; whose implicit role is graphics-document (no img/graphics-symbol role restatement, aria-name, &lt;title&gt;/&lt;desc&gt;, or focusability), or an unlabeled &lt;canvas&gt; with no explicit role at all. Per ACT e88epe, an element is skipped entirely when any ancestor already has an author-supplied name (aria-label, aria-labelledby, title, or an associated &lt;label&gt;), that ancestor's name is what matters, not this element's exclusion (the common real case: an icon-only button already named via aria-label).

**Expectation.** Human review is required to confirm the excluded element is purely decorative and conveys no information a user would otherwise miss.

### `img-alt-present`

**&lt;img&gt; must have an alt attribute**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that &lt;img&gt; elements provide an alt attribute to support a text alternative mechanism.

**Applies to.** Applies to &lt;img&gt; elements included in the accessibility tree. Images with role="presentation" or role="none" are excluded only when they are not focusable, since a focusable one reverts to the img role under presentational roles conflict resolution. Hidden images are excluded whether or not they are focusable.

**Expectation.** Each applicable &lt;img&gt; element has an alt attribute. The alt attribute may be empty (alt="").

### `img-alt-quality`

**&lt;img&gt; alt text must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;img&gt; elements with non-empty alt text for human review of appropriateness.

**Applies to.** Applies to &lt;img&gt; elements whose alt attribute is present and non-empty. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role. An &lt;img&gt; with no alt at all is img-alt-present's failure, and one with alt="" is img-alt-decorative's review.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

### `input-image-alt-decorative`

**&lt;input type="image"&gt; with alt="" must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;input type="image"&gt; elements with empty alt for human review (usually not appropriate for functional controls).

**Applies to.** Applies to &lt;input type="image"&gt; elements whose alt attribute is present but empty once trimmed, and which still carry a name from another source: an ARIA name resolving to non-empty text, or a title. Without that other name there is nothing to weigh the empty alt against, and the control is input-image-alt-present's failure instead. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

### `input-image-alt-present`

**&lt;input type="image"&gt; must have an alt attribute**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that &lt;input type="image"&gt; elements provide an alt attribute to support a text alternative mechanism.

**Applies to.** Applies to &lt;input type="image"&gt; elements included in the accessibility tree.

**Expectation.** Each applicable &lt;input type="image"&gt; element has a non-empty accessible name from aria-labelledby, aria-label, alt or title. An empty name fails, whether alt is missing or empty (alt=""). An author-supplied name that equals a browser default for an image button ("Submit", "Submit Query") is not an empty name: it may describe the button, so it is reported as cantTell for a person to judge.

### `input-image-alt-quality`

**&lt;input type="image"&gt; text alternative must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;input type="image"&gt; elements with a non-empty text alternative (alt, aria-label, aria-labelledby or title) for human review of appropriateness.

**Applies to.** Applies to &lt;input type="image"&gt; elements that get a non-empty text alternative from any source: aria-labelledby (resolving to text), aria-label, alt or title. An element whose alt is present but empty is left to input-image-alt-decorative, which asks about that case. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate. Each occurrence lists every source present (data.details.sources), so the reviewer checks each one.

**What a finding reports.**

- `name`: the control's text alternative as announced, from the first source that gives one.
- `sources`: every source that gives a non-empty text alternative, in the order they are used for the name. One item is `aria-labelledby`, `aria-label`, `alt` or `title`.
- `alt` (a control with a non-empty `alt`): the `alt` text.

### `label-in-name`

**Label in Name: accessible name contains visible text**

automatic · WCAG 2.5.3 (A) · confidence high · default severity serious

Checks that when a control has a visible text label, the accessible name contains that visible label text (WCAG 2.5.3).

**Applies to.** Applies to controls named by aria-label or aria-labelledby, are visually rendered, and have visible label text this engine can extract deterministically, from an associated &lt;label&gt;, from the control's own rendered text, or from the elements aria-labelledby points at. The candidates are &lt;button&gt;, &lt;a href&gt;, &lt;summary&gt;, non-hidden form controls, and the button, link, checkbox, radio, switch, searchbox, tab, menuitem, menuitemcheckbox, menuitemradio, option, treeitem and gridcell roles, minus anything hidden or disabled. aria-hidden is not excluded: it changes nothing about what is rendered on screen, which is what this SC is about. An aria-label that is empty once trimmed, or an aria-labelledby whose ids point at nothing or only at elements with no text, names nothing: the accessible name then comes from the next source (the content, a &lt;label&gt;, title...), as for a control without them, so the control is out of scope.

**Expectation.** The accessible name contains the visible label's words, adjacent and in order. The comparison is over words rather than characters: parenthesised text is dropped, case is folded, text is NFKC-normalised, and every character that is not a letter, digit or combining mark becomes a separator, so punctuation and spacing differences never decide the outcome. Accents are not folded: "Déposer" stays one word, and a name that drops an accent ("Deposer") does not contain it. Four shapes markup cannot settle are reported as cantTell instead of fail: a word hyphenated differently in the two places; a visible word the author may have abbreviated, marked by its trailing period; visible text rendered through a known icon font (the DOM text is real words, but nothing readable actually renders); and a whole visible label of exactly one character that doesn't even appear inside the accessible name, which per ACT 2ee8b8 may be "non-text content" (e.g. "X" meaning "close") rather than literal text.

**What a finding reports.**

- `visibleLabel`, `accessibleName`: the visible label text and the accessible name, as found.
- `normalized.visibleLabel`, `normalized.accessibleName`: the same two texts as compared: parenthesised text dropped, case folded, Unicode normalised.
- `tokenized.visibleLabel`, `tokenized.accessibleName`: the words each text was split into, one word per item. The name must hold the label's words next to each other and in order.
- `labelSource`: where the visible label came from: `label` (an associated `<label>`), `self` (the control's own text) or `aria-labelledby` (the elements it points at).
- `nameMechanism`: what gives the accessible name: `aria-label` or `aria-labelledby`.

### `label-title-only`

**Form controls should not use title as their only label**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that a form control with a title attribute also has a real label (label element, aria-label, or aria-labelledby).

**Applies to.** Applies to labelable form controls (input, excluding hidden/submit/reset/button/image; select; textarea) that have a non-empty title attribute.

**Expectation.** The control also has a real label (a wrapping/associated &lt;label&gt;, aria-label, or aria-labelledby), rather than depending on the title attribute alone. A title-only tooltip is not reliably exposed by all assistive technology and is not visible at all until hover/focus, unlike a persistent visible label.

### `landmark-banner-is-top-level`

**Banner landmark must be top-level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the banner landmark (role="banner" or a non-nested &lt;header&gt;) is not nested inside another landmark region.

**Applies to.** Applies whenever the page contains at least one banner candidate: explicit role="banner", OR a &lt;header&gt; with NO role attribute at all, regardless of nesting.

**Expectation.** No banner candidate has an ancestor that is itself any landmark region. A banner nested inside another landmark is not a top-level, whole-page banner and confuses landmark-based navigation for assistive technology users.

### `landmark-complementary-is-top-level`

**Complementary landmark must be top-level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the complementary landmark (role="complementary" or an &lt;aside&gt; that keeps its implicit role) is not nested inside another landmark region.

**Applies to.** Applies whenever the page contains at least one element carrying the complementary role: explicit role="complementary", or an &lt;aside&gt; that keeps its implicit role.

**Expectation.** No complementary candidate has an ancestor that is itself a landmark region. Complementary content supports the main content of the page and sits beside it; nested inside another landmark it is a section of that landmark instead, which is not what landmark navigation announces.

### `landmark-contentinfo-is-top-level`

**Contentinfo landmark must be top-level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the contentinfo landmark (role="contentinfo" or a non-nested &lt;footer&gt;) is not nested inside another landmark region.

**Applies to.** Applies whenever the page contains at least one contentinfo candidate: explicit role="contentinfo", OR a &lt;footer&gt; with NO role attribute at all, regardless of nesting.

**Expectation.** No contentinfo candidate has an ancestor that is itself any landmark region. A contentinfo nested inside another landmark is not a top-level, whole-page footer region and confuses landmark-based navigation for assistive technology users.

### `landmark-main-is-top-level`

**Main landmark must be top-level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the main landmark (role="main" or &lt;main&gt;) is not nested inside another landmark region.

**Applies to.** Applies whenever the page contains at least one main landmark (explicit role="main", or an implicit &lt;main&gt; element).

**Expectation.** No main landmark has an ancestor that is itself any landmark region. A main region nested inside another landmark is not a top-level, whole-page main content area and confuses landmark-based navigation for assistive technology users.

### `landmark-no-duplicate-banner`

**Page must not have more than one banner landmark**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that at most one banner landmark (role="banner" or a non-nested &lt;header&gt;) exists on the page.

**Applies to.** Applies whenever the page contains at least one banner landmark (explicit role="banner", or an implicit, non-nested &lt;header&gt;; see landmark-banner-is-top-level's implementation notes for the shared landmark-detection model).

**Expectation.** At most one banner landmark exists on the page. Per WAI-ARIA Authoring Practices, the banner landmark represents site-oriented content that identifies the page as a whole, so having more than one is ambiguous for assistive technology users navigating by landmark.

**What a finding reports.**

- `count`: how many banner landmarks the page exposes to assistive technology, against a limit of 1.

### `landmark-no-duplicate-contentinfo`

**Page must not have more than one contentinfo landmark**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that at most one contentinfo landmark (role="contentinfo" or a non-nested &lt;footer&gt;) exists on the page.

**Applies to.** Applies whenever the page contains at least one contentinfo landmark (explicit role="contentinfo", or an implicit, non-nested &lt;footer&gt;).

**Expectation.** At most one contentinfo landmark exists on the page, mirroring landmark-no-duplicate-banner's rationale for contentinfo.

**What a finding reports.**

- `count`: how many contentinfo landmarks the page exposes to assistive technology, against a limit of 1.

### `landmark-no-duplicate-main`

**Page must not have more than one main landmark**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that at most one main landmark (role="main" or &lt;main&gt;) exists on the page.

**Applies to.** Applies whenever the page contains at least one main landmark (explicit role="main", or an implicit &lt;main&gt;).

**Expectation.** At most one main landmark exists on the page. Distinct, atomic decision from landmark-one-main (that rule flags zero mains too; this one only flags more than one).

**What a finding reports.**

- `count`: how many main landmarks the page exposes to assistive technology, against a limit of 1.

### `landmark-one-main`

**Page should have a main landmark**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the page has at least one main landmark (role="main" or &lt;main&gt;).

**Applies to.** Always applicable to any HTML document with a &lt;body&gt; element: "does the page have a main landmark" is a whole-page concern, matching bypass-blocks-present's pattern of evaluating the document directly.

**Expectation.** At least one main landmark (role="main" or &lt;main&gt;), exposed to assistive technology, exists on the page. A page with none gives AT users no landmark to jump straight to for the primary content.

### `landmark-unique`

**Landmarks with the same role must have unique names**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that when two or more landmarks share the same role, each has a distinct accessible name.

**Applies to.** Applies whenever two or more landmark regions on the page share the same landmark role (banner, contentinfo, main, navigation, complementary, region, form, or search).

**Expectation.** Among landmarks sharing a role, each has a distinct accessible name (via aria-label/aria-labelledby; landmarks are not named from content). Two same-role landmarks with the same name (including two both left unnamed) are indistinguishable to assistive technology users navigating by landmark.

**What a finding reports.**

- `role`: the landmark role the colliding landmarks share, such as `navigation`.
- `name`: the name they share, in lowercase with spacing collapsed. Empty when they are all unnamed.
- `groupSize`: how many landmarks of that role share that name.

### `link-in-text-block`

**Links in text blocks must be distinguishable from surrounding text without relying on color alone**

automatic · WCAG 1.4.1 (A) · confidence high · default severity serious

Checks that a link inside a run of text is visually distinguishable from the surrounding text by a non-color cue (underline, font-weight or style, border, background, icon), and asks about links distinguished only by a &gt;=3:1 color difference, which also need a hover and focus cue.

**Applies to.** Applies to links (`<a href>` and elements with `role="link"`) whose immediate parent element also has at least one direct-child text node with non-whitespace content (i.e. the link sits inline within a run of plain text, not as a standalone item, e.g. not the sole content of a &lt;li&gt; nav item).

**Expectation.**

A link inside a text block must be visually distinguishable from the surrounding text by at least one non-color means:

- text-decoration: underline, OR
- a different font-weight or font-style than the surrounding text, OR
- another visible mark on the link itself: a border, box-shadow or outline, a background color different from the surrounding one, a background image, an image or svg inside it, or ::before/::after content.

A link with none of these is distinguished by color alone. When its color contrasts with the surrounding text by at least 3:1, technique G183 is met only if hover and focus also bring a non-color cue, which a static scan cannot see, so the link is reported as cantTell. Below 3:1, with contrast confidently computable, color is demonstrably the only cue and the link fails.

**What a finding reports.**

- `metrics.ratio` (a link set apart by color only): the contrast between the link's text color and the surrounding text's, as a ratio (3 for 3:1), against `metrics.threshold` (3).
- `colors.linkForegroundHex`, `colors.surroundingTextForegroundHex` (a link set apart by color only): the link's text color and the surrounding text's, as hex.

### `link-name-present`

**Links have an accessible name**

automatic · WCAG 2.4.4, 4.1.2 (A) · confidence high · default severity serious

Checks that links expose a non-empty accessible name.

**Applies to.** Applies to &lt;a href&gt;, &lt;area href&gt; and elements with role="link" that are included in the accessibility tree. An &lt;a&gt; without an href is not a link and is not matched.

**Expectation.** The element has a non-empty accessible name. A programmatic name is taken first (aria-labelledby, aria-label, an associated &lt;label&gt;, title), and failing that the element falls back to its own subtree text, counting each descendant's own name (an &lt;img alt&gt;, aria-label or title), the shape behind the common &lt;a&gt;&lt;img alt="..."&gt;&lt;/a&gt; logo link. The content fallback is suppressed when an explicit, known role that is not name-from-content is present; an unrecognized role token falls back to the implicit role.

**What a finding reports.**

- `refs.accessibleName`: what the programmatic name lookup found: `present`, `value`, `mechanism` (the attribute or element the name would come from, `none` when there is none) and `flags` (notes on why a source gave no name). `null` when no lookup was made.

### `link-name-quality`

**Link text should be descriptive, not generic**

manual · WCAG 2.4.4 (A) · confidence medium · default severity minor

Flags links whose full accessible name is a known non-descriptive phrase (e.g. "click here", "read more", "more") or a bare file-format name (e.g. "HTML", "PDF") with no adjacent context naming what it leads to, for manual review of whether the purpose is clear. English phrases are always recognized, and German, Spanish, French or Japanese ones when the link is in that language.

**Applies to.** Elements matching `a[href], area[href], [role="link"]` with a non-empty computed accessible name (programmatic first, then "name from content", same two-step resolution as `link-name-present`, same selector too). Links with no name at all are `link-name-present`'s concern, not this rule's.

**Expectation.** The link's full accessible name, normalized (trimmed, case-folded, trailing punctuation stripped), is not an exact match for a known non-descriptive phrase ("click here", "read more", "more", "here", "details", "link", etc., WCAG technique F84's known failure pattern for SC 2.4.4) or a bare file-format/type name ("HTML", "PDF", "EPUB", ...) with no adjacent context (an aria-describedby target, the enclosing list item/table cell/paragraph's own text, or (format names only) a table's first-row header) naming what it belongs to.

**What a finding reports.**

- `normalizedName`: the link's accessible name as it was matched: in lowercase, with spacing collapsed and trailing punctuation removed. It is a generic phrase (`GENERIC_LINK_TEXT`) or a bare format name (`AMBIGUOUS_FORMAT_NAME`).

### `list-children-valid`

**Lists must only directly contain list items**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;ul&gt;/&lt;ol&gt; elements only have &lt;li&gt;, &lt;script&gt;, or &lt;template&gt; as direct children.

**Applies to.** Applies to &lt;ul&gt;/&lt;ol&gt; elements that have at least one direct element child and whose role is list: no role attribute, role="list", or a role attribute naming no concrete ARIA role. A &lt;ul&gt;/&lt;ol&gt; given another role (listbox, menubar, tablist, none, ...) is not a list, so its children follow that role's rules instead.

**Expectation.** Every direct element child is &lt;li&gt;, &lt;script&gt;, or &lt;template&gt;. UNLESS it has an explicit `role` attribute, in which case the explicit role wins over the tag entirely: a child is valid iff that role is "listitem" (so `<li role="presentation">`/`<li role="menuitem">` are invalid despite the &lt;li&gt; tag, and conversely a non-&lt;li&gt; element explicitly given `role="listitem"` is valid). A wrapper &lt;div&gt; used for styling (no role at all) still breaks list semantics the same as before.

**What a finding reports.**

- `invalidChildren`: the children that do not belong in the list, one tag name per child.

### `listbox-name-present`

**Listboxes have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="listbox" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="listbox" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="listbox" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom listbox widget is not reliably exposed as its name. On a labelable element (&lt;select multiple role="listbox"&gt;) an associated &lt;label&gt; counts as well.

### `listitem-parent-valid`

**List items must be inside a list container**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;li&gt; elements are contained by &lt;ul&gt;, &lt;ol&gt;, &lt;menu&gt;, or an element with role="list".

**Applies to.** Applies to &lt;li&gt; elements that have a parent element.

**Expectation.** The parent is &lt;ul&gt;/&lt;ol&gt;/&lt;menu&gt; with no role override (all three have the implicit role list), or an element with an explicit role of "list", "presentation", or "none". An &lt;li&gt; used outside a real list container (e.g. as a generic flex/grid item under a &lt;div&gt;) is not exposed as a list item to assistive technologies.

**What a finding reports.**

- `parentElement`: the tag name of the `<li>`'s parent, the container it is in instead of a list.

### `manual-review`

**Manual review: keyboard navigation and focus order**

manual · WCAG 2.1.1, 2.4.3, 2.4.7 (AA) · confidence medium · default severity moderate

Flags that a manual review of keyboard navigation and focus order is required.

**Applies to.** Applies to every run, whatever the page contains. Keyboard operability and focus order are properties of the page as a whole, and no markup pattern rules the question out.

**Expectation.** Always cantTell, carrying one occurrence at the scan root. Whether focus can leave every component, whether the tab order follows the reading order, and whether the focus indicator stays visible in use all need a person driving the page. The rule exists so that need is stated in the results rather than left for the reader to remember.

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

### `menuitem-name-present`

**Menu items have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that menu items (role="menuitem*", including checkbox/radio variants) expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="menuitem", role="menuitemcheckbox" or role="menuitemradio" (the attribute must name one of those roles alone, not a fallback list) that are included in the accessibility tree.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or, all three roles being name-from-content, from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

### `meta-refresh-no-exceptions`

**Page must not use a timed meta refresh (AAA)**

automatic · WCAG 2.2.4, 3.2.5 (AAA) · confidence high · default severity moderate

Checks that &lt;meta http-equiv="refresh"&gt; does not set a positive delay, however long; an immediate redirect (delay 0) passes. This is the stricter AAA-level counterpart of the A-level check, which exempts delays over 20 hours.

**Applies to.** Applies to the first &lt;meta http-equiv="refresh"&gt; element, in document order, with a valid content attribute, per HTML's shared declarative refresh steps, a document only ever acts on its first valid meta refresh, so a later one (valid or not) is inert and out of scope.

**Expectation.** Running the shared declarative refresh steps against that element's content value results in a delay of exactly 0. An immediate (delay=0) redirect still passes at AAA, same as the A-level rule. There is nothing for a user to be interrupted mid-read by when nothing is displayed first. Any positive delay fails, with none of the A-level rule's &gt;20-hour exemption: at AAA, WCAG 2.2.4 (Interruptions) and 3.2.5 (Change on Request) require that a *timed* automatic context change happen only at the user's request, regardless of how long the timer is.

### `meta-refresh-timing-absent`

**Page must not use a timed meta refresh**

automatic · WCAG 2.2.1 (A) · confidence high · default severity serious

Checks that &lt;meta http-equiv="refresh"&gt; does not impose a positive delay of 20 hours or less.

**Applies to.** Applies to the first &lt;meta http-equiv="refresh"&gt; element, in document order, whose content attribute has a parseable leading delay value. Per HTML's shared declarative refresh steps, a document only ever acts on its first valid meta refresh; any later one (valid or not) is inert markup a browser never processes, so it is not evaluated.

**Expectation.** The delay is 0 (an immediate redirect, which users cannot be caught by mid-read), or exceeds 20 hours. Any other positive delay refreshes or redirects the page on a timer the user did not initiate and cannot pause, stop, or extend, which WCAG 2.2.1 (Timing Adjustable) requires be possible.

**What a finding reports.**

- `delay`: the time before the page refreshes or redirects, in seconds. A failure is above 0 and at most 72000 (20 hours).

### `meta-viewport-large`

**Viewport meta tag should allow zooming up to 500%**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that &lt;meta name="viewport"&gt; does not set user-scalable=no or maximum-scale below 5 (500%).

**Applies to.** Applies to &lt;meta name="viewport"&gt; elements that carry a non-empty content attribute.

**Expectation.** The content attribute does not set user-scalable to "no"/"0", and does not set maximum-scale below 5 (500%). This is the AAA-level, stricter counterpart of meta-viewport-zoom-enabled (which enforces the AA 200% minimum as a hard, WCAG-normative fail); this rule is advisory best-practice guidance toward the higher AAA bar.

**What a finding reports.**

- `reasons`: each setting in the content attribute that limits zoom, as written there in lowercase, such as `user-scalable=no` or `maximum-scale=2` (below 5).

### `meta-viewport-zoom-enabled`

**Viewport meta tag must not disable zoom**

automatic · WCAG 1.4.4 (AA) · confidence high · default severity serious

Checks that &lt;meta name="viewport"&gt; does not set user-scalable=no or maximum-scale below 2 (200%).

**Applies to.** Applies to &lt;meta name="viewport"&gt; elements whose content attribute sets maximum-scale or user-scalable. Content setting neither cannot restrict zoom.

**Expectation.** user-scalable is absent, yes, device-width, device-height, or a number outside the range -1 to 1; and maximum-scale is absent, device-width, device-height, negative, or 2 or more. Anything else stops the user zooming text to 200%, which WCAG 1.4.4 (Resize Text) requires.

**What a finding reports.**

- `reasons`: the settings that restrict zoom, one per item, written as in the `content` attribute (`user-scalable=no`, `maximum-scale=1`).

### `meter-name-present`

**Meters have an accessible name**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that elements with role="meter" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="meter" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="meter" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom meter widget is not reliably exposed as its name.

### `mouse-only-event-handlers`

**Pointer-only inline event handlers should have a keyboard-reachable equivalent**

manual · WCAG 2.1.1 (A) · confidence low · default severity moderate

Flags elements with an inline pointer-only event handler (onmouseover, onmouseout, onmousedown, onmouseup, ondblclick, onmousemove, onmouseenter, onmouseleave) and no keyboard-reachable equivalent (onkeydown/onkeyup/onkeypress/onfocus/onblur), for manual review.

**Applies to.** Elements carrying at least one inline pointer-only event-handler attribute (`onmouseover`, `onmouseout`, `onmousedown`, `onmouseup`, `ondblclick`, `onmousemove`, `onmouseenter`, `onmouseleave`) with a non-empty value, that are also eligible/reachable (not hidden/`aria-hidden`/`display:none`).

**Expectation.** The element also carries at least one keyboard-reachable inline handler: `onkeydown`, `onkeyup`, `onkeypress` (the direct keyboard- event equivalents), or `onfocus`/`onblur` (the standard substitute for hover-triggered behavior: focus/blur are the keyboard- navigable analog to mouseover/mouseout, per WCAG technique G90). A handler is reachable only if keyboard events can reach it: `onfocus`/`onblur` when the element itself can take focus, and a key handler when the element or one of its descendants can (key events bubble, focus events do not). Otherwise the element's mouse-driven behavior (a hover tooltip, a custom dropdown, a drag interaction) has no way to be triggered by a keyboard-only user, and it is flagged with a reason saying whether the keyboard handlers are missing or cannot run.

**What a finding reports.**

- `mouseAttrs`: the pointer-only handler attributes the element carries. One item is an attribute name, such as `onmouseover`.
- `keyboardAttrs` (handlers that cannot run, `MOUSE_ONLY_HANDLER_KEYBOARD_EQUIVALENT_NOT_FOCUSABLE`): the keyboard handler attributes the element carries, which keyboard events cannot reach. One item is an attribute name, such as `onfocus`.

### `nested-interactive-controls-absent`

**Interactive controls must not be nested**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that an interactive control (link, button, form control, or ARIA widget role) does not contain another interactive control.

**Applies to.** Applies to elements matching the interactive-control set (native a[href], button, input (not hidden), select, textarea; or an explicit ARIA widget role: button, link, checkbox, radio, switch, tab, textbox, combobox, listbox, menuitem, menuitemcheckbox, menuitemradio, option, slider, spinbutton, searchbox, treeitem). The container is applicable regardless of whether it is itself focusable, focusability is only used to decide whether a *descendant* nests an interactive control.

**Expectation.** The element does not contain, as a descendant, another *operable* interactive control (e.g. a &lt;button&gt; wrapping a &lt;select&gt;, or a link containing a checkbox). Nested interactive controls are not reliably announced or operable via assistive technology, activating the outer control and the inner one become ambiguous, and some AT only exposes one of the two.

**What a finding reports.**

- `nestedElements`: the controls nested inside this one, one tag name per control.

### `no-autoplay-audio`

**Autoplaying audio should provide a pause/stop or volume-control mechanism**

manual · WCAG 1.4.2 (A) · confidence low · default severity moderate

Flags &lt;audio&gt;/&lt;video&gt; elements that autoplay unmuted with no native controls attribute, and &lt;embed&gt;, &lt;object&gt; or &lt;bgsound&gt; elements that may play sound, for manual review against the 3-second exemption in WCAG 1.4.2.

**Applies to.** Any &lt;audio autoplay&gt; or &lt;video autoplay&gt; element that is not `muted`. Also any &lt;bgsound&gt;, and any &lt;embed&gt; or &lt;object&gt; that loads sound or video, or a plugin (Flash) that may play it: its `type` is audio/*, video/* or a plugin type, or its `src`/`data` ends in a sound or video file extension. An &lt;embed&gt; or &lt;object&gt; with `autostart` or `autoplay` set to false (attribute or &lt;param&gt;) is left out.

**Expectation.** SC 1.4.2 only applies when audio plays automatically for MORE than 3 seconds; clip duration is not knowable from static markup (jsdom does not decode media), so this rule cannot determine whether the SC even applies to a given element. It is authored as `type: 'manual'` (cantTell-capped, never fail) on purpose rather than guessing: an autoplaying unmuted element with no `controls` attribute (the native, statically-verifiable mechanism to pause/stop or adjust volume) is flagged for human review rather than treated as a deterministic violation.

### `object-text-alternative-present`

**&lt;object&gt; must provide a text alternative**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that &lt;object&gt; elements provide a text alternative via fallback content or an accessible name.

**Applies to.** Applies to &lt;object&gt; elements included in the accessibility tree. Hidden objects are excluded whether or not they are focusable. role="presentation"/role="none" are excluded only when not focusable.

**Expectation.**

Each applicable &lt;object&gt; provides a text alternative via:

- fallback content (non-empty text content inside &lt;object&gt;), OR
- an accessible name (aria-labelledby/aria-label), OR
- a title attribute (best-effort fallback).

### `object-text-alternative-quality`

**&lt;object&gt; text alternative must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;object&gt; elements with detected fallback or name for human review of equivalence and appropriateness.

**Applies to.** Applies to &lt;object&gt; elements that already carry a text alternative: fallback text content, a non-empty aria-label, an aria-labelledby that resolves to non-empty text, or a non-empty title. An &lt;object&gt; with none of those is object-text-alternative-present's failure, not a quality question. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

**What a finding reports.**

- `fallbackText`: the text content inside the &lt;object&gt;, trimmed, or `null` when there is none.
- `ariaLabel`: the `aria-label` value, or `null` when there is none.
- `ariaLabelledBy`: the `aria-labelledby` value, the ids it points to, or `null` when there is none.
- `ariaLabelledByText`: the text of the elements `aria-labelledby` points to. Only looked up when there is no `aria-label`; `null` otherwise or when it resolves to nothing.
- `title`: the `title` value, or `null` when there is none.

### `option-name-present`

**Options have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="option" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="option" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or, role="option" being name-from-content, from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

### `p-as-heading`

**Text styled to look like a heading should probably be a real heading**

manual · WCAG 1.3.1 (A) · confidence low · default severity minor

Flags short &lt;p&gt; and &lt;div&gt; elements whose text is all bold and rendered at &gt;=18px, for manual review of whether a real heading element should be used instead.

**Applies to.** `<p>` elements, and `<div>` elements that hold only text and inline markup, with short (&lt;=120 char), non-empty trimmed text in which every piece of text is bold (computed `font-weight` &gt;= 700, however it got there: on the element itself, a `<strong>`/`<b>` or a styled `<span>`) and rendered at &gt;=18px.

**Expectation.** Text styled to visually read as a heading (bold, larger-than-body size, short) should be marked up with a real heading element (`<h1>`-`<h6>` or `role="heading"`) so its structural role is programmatically determinable, the same 1.3.1 concern as any other "structure conveyed through presentation only" issue.

**What a finding reports.**

- `fontSizePx`: the computed font size of the text in CSS pixels, the smallest one when the pieces differ, against the 18px threshold.

### `page-has-heading-one`

**Page should have a level-one heading**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the page has at least one level-one heading (&lt;h1&gt; or role="heading" with aria-level="1").

**Applies to.** Always applicable to any HTML document with a &lt;body&gt; element: "does the page have an h1" is a whole-page concern, matching bypass-blocks-present's pattern of evaluating the document directly.

**Expectation.** At least one heading with level 1 exists (native &lt;h1&gt;, or role="heading" with aria-level="1"). A page with no top-level heading has no clear entry point for assistive technology users navigating by heading.

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

### `page-title-present`

**Page has a non-empty title**

automatic · WCAG 2.4.2 (A) · confidence high · default severity serious

Checks that the page includes a non-empty &lt;title&gt; element.

**Applies to.** Applies to a run over a whole document. A run narrowed by contextSelector, or by engineOptions.fragment, is notApplicable: whether the page has a title is not a property any subtree can answer.

**Expectation.** The document has a &lt;title&gt; element, and document.title with whitespace collapsed is non-empty. The element is looked for anywhere in the document, not only inside &lt;head&gt;: a &lt;title&gt; the parser leaves outside &lt;head&gt; is still the document title in every browser. Only an HTML-namespace &lt;title&gt; counts; the &lt;title&gt; of an inline &lt;svg&gt; names the graphic, so a page whose only &lt;title&gt; is inside an &lt;svg&gt; is missing its title element. Whether that title describes the page is page-title-patterns' question.

### `password-paste-enabled`

**Authentication fields must not block pasting**

manual · WCAG 3.3.8 (AA) · confidence medium · default severity serious

Checks that a password or one-time-code field carries no inline paste handler that cancels the paste, which would remove the password manager or clipboard that WCAG 3.3.8 relies on as the assisting mechanism.

**Applies to.** Applies to any control whose autocomplete token is current-password, new-password or one-time-code, and to &lt;input type="password"&gt; unless its autocomplete names another purpose. A disabled or readonly field takes no input to block, and one outside the accessibility tree is not being asked for, so neither is in scope.

**Expectation.** A reviewer confirms the field can still be pasted into. Remembering a password is a cognitive function test, and 3.3.8 asks for a mechanism that helps the user through one; a password manager, or the clipboard for a one-time code, is that mechanism.

**What a finding reports.**

- `handler`: the field's `onpaste` attribute value, with spacing collapsed. It only cancels the paste (`PASTE_CANCELLED`) or calls other script that may or may not (`PASTE_HANDLER_OPAQUE`).

### `presentation-role-conflict`

**Presentational role must not conflict with a global ARIA attribute or focusability**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that role="presentation"/"none" (including an &lt;img alt=""&gt; implicit presentation role) is not combined with a global ARIA attribute (aria-label, aria-hidden, aria-describedby, ...) or focusability (tabindex/native).

**Applies to.** Applies to elements with an explicit role="presentation" or role="none", OR an &lt;img alt=""&gt; carrying no explicit role of its own (empty alt gives an &lt;img&gt; an implicit presentation role per HTML-AAM, even with no explicit role attribute at all: `img[alt=''], [role="none"], [role="presentation"]`).

**Expectation.** The element does not also carry a WAI-ARIA *global* state/property (aria-label, aria-hidden, aria-describedby, aria-live, aria-current, ...; the full global-attribute set, not just the naming ones), AND is not focusable. Per the WAI-ARIA spec's Presentational Roles Conflict Resolution section, a presentational role is "restored" to the element's implicit semantic role when either condition holds: the presentation/none role silently stops working, contradicting the author's evident intent to hide the element from the accessibility tree.

**What a finding reports.**

- `role`: the presentational role in effect: `presentation` or `none`. An &lt;img alt=""&gt; with no role of its own reports `presentation`.
- `conflictingAttrs`: the global ARIA attributes the element carries, whatever their value. One item is an attribute name, such as `aria-label`. Empty when the element has `aria-hidden="true"` or only its focusability conflicts.
- `focusable`: `true` when the element can take focus, which also restores its role.

### `presentational-children-focusable-absent`

**Roles with presentational children must not contain focusable content**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that an element whose role makes its children presentational (button, checkbox, img, option, radio, slider, switch, tab, ...) contains no descendant that takes a tab stop.

**Applies to.** Applies to elements whose semantic role is one of the WAI-ARIA roles defined as having presentational children (button, checkbox, img, menuitemcheckbox, menuitemradio, meter, option, progressbar, radio, scrollbar, separator, slider, switch, tab, plus doc-pagebreak and graphics-symbol from the DPUB-ARIA/Graphics-ARIA modules, which inherit the same trait). The role can be explicit (role="tab") or native (&lt;button&gt;, &lt;meter&gt;, &lt;progress&gt;, &lt;option&gt;).

**Expectation.** No descendant of the element is part of sequential focus navigation. The presentational-children mechanism removes every descendant from the accessibility tree, so a descendant that still takes a tab stop receives focus with no role and no name to announce.

**What a finding reports.**

- `role`: the role that makes the element's children presentational.
- `focusableElements`: the tag name of each tab stop found inside the element, one item per tab stop, in document order.

### `progressbar-name-present`

**Progress bars have an accessible name**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that elements with role="progressbar" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="progressbar" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="progressbar" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom progressbar widget is not reliably exposed as its name. On a labelable element (&lt;progress role="progressbar"&gt;) an associated &lt;label&gt; counts as well.

### `region`

**Page content should be inside a landmark region**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that content under &lt;body&gt; is contained within a landmark region.

**Applies to.** Applies to any element under &lt;body&gt; that directly carries visible text (or other own content, see @implementation-notes) and is not itself a landmark, live region, dialog, button, &lt;svg&gt;, &lt;iframe&gt;/&lt;frame&gt;, or a resolvable skip-link.

**Expectation.** Every top-level piece of page content lives inside a landmark region (main, navigation, banner, contentinfo, complementary, region, form, search), so assistive technology users navigating by landmark do not miss content that was never placed inside one.

### `role-img-text-alternative-present`

**[role="img"/"graphics-symbol"/"graphics-document"] must have an accessible text alternative**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that elements with role="img", "graphics-symbol" or "graphics-document" provide an accessible text alternative using aria-label, aria-labelledby, a title attribute, or (for SVG elements) a first-child &lt;title&gt;.

**Applies to.** Applies to elements with role="img", role="graphics-symbol" or role="graphics-document" that are included in the accessibility tree (ACT 23a2a8's "programmatically hidden" exemption: display:none/visibility:hidden/aria-hidden="true" on the element or an ancestor, with no carve-out for focusable or IDREF-referenced elements, aria-hidden-focus and duplicate-id-aria own those separately). Per ACT 7d6734, this reaches any element carrying one of these roles, not only the &lt;svg&gt; root, e.g. a &lt;circle role="graphics-symbol"&gt; nested inside a plain &lt;svg&gt;. Every &lt;svg&gt; element itself is left to svg-text-alternative-present's own (already ACT-clean) title/aria-name handling, so an unnamed &lt;svg role="img"&gt; is reported once, there; the &lt;img&gt; tag is excluded here since it has its own dedicated rule.

**Expectation.**

Each applicable element has an accessible text alternative:

- aria-label with a non-empty value; OR
- aria-labelledby referencing at least one existing element that contributes non-empty text; OR
- a non-empty title attribute (last-resort accessible-name source per HTML-AAM); OR
- for an SVG-namespace element, a non-empty first-child &lt;title&gt; (SVG-AAM's own naming mechanism, not only for the &lt;svg&gt; root).

**What a finding reports.**

- `ariaLabel`: the element's `aria-label` with surrounding whitespace removed, or null when it has none.
- `ariaLabelledby`: the element's `aria-labelledby` id list with surrounding whitespace removed, or null when it has none.
- `accessibleNameInfo` (`nameNotResolved`): the accessible name the element ends up with: `present`, `value`, `mechanism` (where the name came from, such as `aria-labelledby`) and `flags` (notes on what went wrong, such as `idref-missing` for a reference to an id that does not exist). Null on the other findings.

### `scope-attr-valid`

**scope attribute must have a valid value**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that scope="..." is one of row, col, rowgroup, or colgroup.

**Applies to.** Applies to elements with a non-empty scope attribute.

**Expectation.** The scope value is one of "row", "col", "rowgroup", or "colgroup" (case-insensitive). An invalid scope value is not recognized by assistive technology, silently losing the row/column header association it was meant to declare.

**What a finding reports.**

- `value`: the `scope` value as written, trimmed.

### `scrollable-region-focusable`

**Scrollable regions with no focusable content should be keyboard-focusable**

manual · WCAG 2.1.1, 2.1.3 (AAA) · confidence low · default severity moderate

Flags elements whose CSS declares overflow:auto/scroll, contain no focusable descendant, and are not themselves keyboard-focusable, for manual review of whether their content actually overflows and needs keyboard scroll access.

**Applies to.** Scoped on purpose to a fixed set of likely-to-scroll container tags (div, section, article, aside, main, nav, pre, table, blockquote, ul, ol, textarea) with computed `overflow-x`/`overflow-y` of `auto` or `scroll`, not every element on the page, to keep this deterministic and performant (same style of scope-down as `region`).

**Expectation.** A region whose CSS declares it may scroll (`auto`/`scroll`) should be reachable by keyboard: either it already contains a focusable descendant (a link, button, form control, or `tabindex`-bearing element a keyboard user could tab into and then use arrow keys to scroll from), or the region itself carries a non-negative `tabindex`.

### `searchbox-name-present`

**Searchboxes have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="searchbox" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="searchbox" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="searchbox" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom searchbox widget is not reliably exposed as its name. On a labelable element (&lt;input role="searchbox"&gt;) an associated &lt;label&gt; counts as well. On a text-like &lt;input&gt; or a &lt;textarea&gt;, the placeholder counts last (HTML-AAM's final name source): a placeholder-only label is a 3.3.2 question, not a missing name.

### `server-side-image-map-absent`

**Server-side image maps must have a keyboard-operable alternative**

automatic · WCAG 2.1.1 (A) · confidence high · default severity serious

Asks, for each &lt;img ismap&gt; inside a link, whether the page offers the same destinations as links a keyboard can reach, since a server-side image map has no keyboard-operable regions of its own.

**Applies to.** Applies to any scan scope. An &lt;img ismap&gt; inside an &lt;a href&gt; is a server-side image map: the browser sends the click coordinates to the link's URL, which has no keyboard-operable equivalent and exposes no individual regions to assistive technology.

**Expectation.** Each server-side image map is reported as cantTell: 2.1.1 is met when the same destinations are also offered as links a keyboard can reach, which the rule cannot verify. Client-side image maps (&lt;map&gt;/&lt;area&gt;) are not flagged. A scope with no &lt;img ismap&gt; passes. One whose only &lt;img ismap&gt; elements are outside a link is notApplicable: ismap does nothing there, so there is no server-side image map (the misplaced attribute is invalid HTML, a matter for the validator).

### `skip-link`

**Skip link must have a resolvable, usable target**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that a "skip to ..." link's href fragment resolves to a real, currently usable element in the document.

**Applies to.**

Applies to &lt;a href="#fragment"&gt; elements that are skip links by one of two signs:

- the accessible name follows a common skip-link wording in one of the shipped locales: "skip" or "jump to" (English); "aller au contenu", "passer au contenu", "accéder au contenu", "accès direct", "évitement" (French); "springen", "überspringen", "direkt zum", "zum Inhalt" (German); "saltar", "ir al contenido" (Spanish); "スキップ", "本文へ" (Japanese). "jump to" sits beside "skip" because real skip links use both conventions (e.g. a "Jump to section" link);
- or it is the first link in the document, and it comes before the `main` element (or `[role="main"]`): the usual place of a skip link whatever its wording.

Other same-page anchor links are not skip links and are left alone.

**Expectation.** The link's fragment resolves to a real element in the document (via a matching id, or a legacy &lt;a name="..."&gt;), and that target is currently usable (not hidden from the accessibility tree; and, when browser geometry is available, not zero-area/no-rects). A skip link whose target is missing or effectively unusable does not provide a reliable bypass destination.

**What a finding reports.**

- `href`: the link's `href`.
- `unusableReasonCode` (a target that is not usable): why it is not: `ACC_TREE_INELIGIBLE` when it is hidden from the accessibility tree, `NO_CLIENT_RECTS` when it is not rendered, `ZERO_AREA_TARGET` when it has no area.
- `targetSelector` (a target that is not usable): a selector for the target.
- `geometryCheckEnabled` (a target that is not usable): whether the target's geometry could be measured, which needs a browser.
- `viewport.width`, `viewport.height` (a target whose geometry was measured): the viewport the page was laid out in, in CSS pixels. A target hidden at one width can be usable at another.

### `slider-name-present`

**Sliders have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that sliders (input[type="range"] and role="slider") expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="slider" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope. A native &lt;input type="range"&gt; without the role belongs to form-control-programmatic-label-present.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="slider" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom slider widget is not reliably exposed as its name. On a labelable element (&lt;input role="slider"&gt;) an associated &lt;label&gt; counts as well. On a text-like &lt;input&gt; or a &lt;textarea&gt;, the placeholder counts last (HTML-AAM's final name source): a placeholder-only label is a 3.3.2 question, not a missing name.

### `spinbutton-name-present`

**Spinbuttons have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="spinbutton" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="spinbutton" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="spinbutton" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom spinbutton widget is not reliably exposed as its name. On a labelable element (&lt;input role="spinbutton"&gt;) an associated &lt;label&gt; counts as well. On a text-like &lt;input&gt; or a &lt;textarea&gt;, the placeholder counts last (HTML-AAM's final name source): a placeholder-only label is a 3.3.2 question, not a missing name.

### `summary-name-present`

**Summary elements have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that &lt;summary&gt; elements expose a non-empty accessible name.

**Applies to.** Applies to &lt;summary&gt; elements included in the accessibility tree, wherever they appear, a &lt;summary&gt; outside a &lt;details&gt; is still matched.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution.

### `svg-image-text-alternative-present`

**SVG &lt;image&gt; must have a text alternative**

automatic · WCAG 1.1.1 (A) · confidence medium · default severity serious

Checks that SVG &lt;image&gt; elements provide a text alternative via &lt;title&gt;/&lt;desc&gt; or an ARIA accessible name.

**Applies to.** Applies to SVG &lt;image&gt; elements that are exposed to assistive technologies. Elements otherwise hidden from the accessibility tree remain applicable if they are tabbable or referenced by IDREF relationships (per engine eligibility checks). SVG &lt;image&gt; elements with role="presentation" or role="none" are excluded only when they are not focusable.

**Expectation.**

Each applicable SVG &lt;image&gt; element has a text alternative via:

- a non-empty direct &lt;title&gt; child, OR
- a non-empty direct &lt;desc&gt; child, OR
- an accessible name (aria-label / aria-labelledby / title attribute).

### `svg-text-alternative-present`

**&lt;svg&gt; must provide a text alternative**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that inline &lt;svg&gt; elements provide a text alternative via a &lt;title&gt; element or an ARIA name (a &lt;desc&gt; element alone does not count).

**Applies to.**

Applies to inline &lt;svg&gt; elements that are exposed to assistive technologies AND appear intended to be conveyed. "Intended to be conveyed" is approximated deterministically by at least one of:

- role="img", role="graphics-symbol", or role="graphics-document" on the SVG root element itself (the WAI-ARIA Graphics Module roles, alongside img). Does NOT extend to arbitrary role="img"/"graphics-symbol"/"graphics-document" descendants nested inside an &lt;svg&gt;. This check's scope is the &lt;svg&gt; root only; role-img-text-alternative-present covers those same three roles on any other element, including nested SVG shapes (ACT 7d6734's own failed example: a bare `<svg>` root with a nested `<circle role="graphics-symbol">`).
- aria-label / aria-labelledby present
- &lt;title&gt; or &lt;desc&gt; present (desc alone is an applicability signal only, see @expectation)
- focusable/tabbable (e.g., tabindex, native focusability)

Images with role="presentation" or role="none" are excluded only when they are not focusable. Elements otherwise hidden from the accessibility tree remain applicable if they are tabbable-focusable or referenced by IDREF relationships (per engine eligibility checks).

**Expectation.**

Each applicable &lt;svg&gt; element provides a text alternative via:

- non-empty &lt;title&gt; text, OR
- an ARIA name (aria-label / aria-labelledby).

A &lt;desc&gt; element alone does NOT satisfy this, per the SVG Accessibility API Mappings spec §7.1, &lt;desc&gt; only ever contributes to the accessible DESCRIPTION, never the accessible NAME. An &lt;svg&gt; with only a &lt;desc&gt; and no &lt;title&gt;/ARIA name is still "applicable" (desc signals authorial intent) but fails.

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

### `tab-name-present`

**Tabs have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="tab" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="tab" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or, role="tab" being name-from-content, from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

### `tabindex`

**tabindex should not be greater than 0**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that tabindex values are 0 or negative, not a positive number.

**Applies to.** Applies to elements with a tabindex attribute whose value parses as a valid integer.

**Expectation.** The tabindex value is 0 or negative. A positive tabindex reorders keyboard tab order explicitly, which is fragile to maintain as a page changes and usually indicates the natural DOM order should be fixed instead.

**What a finding reports.**

- `value`: the `tabindex` value, a whole number above 0.

### `table-duplicate-name`

**Table caption must not duplicate its summary attribute**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that a &lt;table&gt;'s &lt;caption&gt; text is not identical to its (deprecated) summary attribute.

**Applies to.** Applies to &lt;table&gt; elements that have both a &lt;caption&gt; with text content and a (deprecated but still encountered) summary attribute.

**Expectation.** The caption text and the summary attribute text are not identical (case-insensitive, normalized). When both are present and say the same thing, assistive technology that surfaces both announces the same text twice for one table.

### `table-fake-caption`

**A table's first row should not stand in for a real &lt;caption&gt;**

manual · WCAG 1.3.1 (A) · confidence low · default severity minor

Flags tables with no &lt;caption&gt; whose first row has a single non-empty cell while other rows have multiple cells, for manual review of whether that cell is acting as a fake caption.

**Applies to.** `<table>` elements with no `<caption>` child, at least two rows, and a first row containing exactly one non-empty-text cell while at least one other row has more than one cell. Left out: a table whose role (first token) is anything but table, grid or treegrid, such as a layout table with role="presentation", which needs no caption; and a table already named by a non-empty aria-label, an aria-labelledby that resolves to text, or a non-empty title, which WCAG accepts as the table's title.

**Expectation.** A single lone cell in the first row, sitting above rows that clearly have multiple columns, strongly suggests the author is using it as a visual caption/title rather than as a real table cell. Structure conveyed only through this positional convention is not programmatically associated with the table the way a real `<caption>` element is (1.3.1).

### `table-headers-attr-valid`

**Table cell "headers" attribute must reference valid header cells**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that each id in a &lt;td&gt;/&lt;th&gt; headers attribute resolves to a cell (&lt;td&gt; or &lt;th&gt;) within the same table (not missing, not a non-cell element, not itself).

**Applies to.** Applies to &lt;td&gt;/&lt;th&gt; elements that carry a non-empty headers attribute, within a &lt;table&gt; whose semantic role is still table/grid/treegrid -- an explicit role of anything else (role="presentation"/"none", but also role="heading" or any other real role) replaces the native table semantics, leaving no table for headers to describe. Matches ACT a25f45's applicability.

**Expectation.** Every id token in the headers attribute resolves to an element that: (a) exists, (b) is a cell (&lt;td&gt; or &lt;th&gt;) of the same &lt;table&gt; as the referencing cell, and (c) is not the cell itself. A &lt;td&gt; serving as a header via role="columnheader"/"rowheader" is a valid target, same as a plain &lt;th&gt; -- ACT a25f45 does not require the native tag.

**What a finding reports.**

- `invalid`: one item per id in the headers attribute that does not point at a valid header: `id`, and `reason`, which is `missing` (no element has that id), `self-reference` (the cell points at itself), `not-a-cell` (the element is not a &lt;td&gt; or &lt;th&gt;) or `different-table` (the cell is in another table).

### `table-th-has-data-cells`

**&lt;th&gt; elements must describe at least one data cell**

automatic · WCAG 1.3.1 (A) · confidence high · default severity moderate

Checks that a table containing &lt;th&gt; elements also contains at least one &lt;td&gt; data cell for those headers to describe.

**Applies to.** Applies to &lt;table&gt; elements that keep their table semantics and are included in the accessibility tree, and that contain at least one &lt;th&gt; which is visible, included in the accessibility tree, and not overridden by an explicit role other than rowheader/columnheader. Also applies to the ARIA-only equivalent: an element with role="grid"/"treegrid" (no native &lt;table&gt; involved) that contains at least one in-scope columnheader/rowheader-role element.

**Expectation.** The table also contains at least one &lt;td&gt; somewhere in it.

### `target-size-minimum`

**Pointer targets must be at least 24x24px large, or leave sufficient distance to other targets**

automatic · WCAG 2.5.8 (AA) · confidence medium · default severity serious

Checks that pointer-operable targets have an effective hit region of at least 24 by 24 CSS pixels, or meet an allowed exception (e.g. sufficient spacing).

**Applies to.** Applies to &lt;button&gt;, &lt;summary&gt;, &lt;a href&gt;, &lt;area href&gt;, &lt;input&gt;, &lt;select&gt;, &lt;textarea&gt; and elements with role="button"/"link" that are pointer-reachable: rendered, not suppressed by pointer-events:none, and with a measurable box of non-zero size. Accessibility-tree exclusion isn't a filter here: an aria-hidden control is still a target a pointer can hit. &lt;area&gt; is matched but never actually evaluated: it has no box of its own to measure (see the implementation notes).

**Expectation.** Each target is at least 24 by 24 CSS pixels, or meets one of the SC 2.5.8 exceptions this rule can establish from geometry: spacing (a 24px-diameter circle centred on the target reaches no unrelated target), the inline exception for a link inside a run of text, or user-agent sizing (an unstyled native checkbox or radio, detected by appearance not having been reset to none). An undersized target too close to a neighbour fails. Where an exception may apply but geometry cannot confirm it (two inline links in one run of text, or a target inside an SVG, canvas or image map that may be essential), the result is cantTell rather than a guess.

**What a finding reports.**

- `metrics.widthPx`, `metrics.heightPx`: the target's size in CSS pixels, against `metrics.minSizePx` (24).
- `metrics.decidedBy`: which check found the target too close to another: `centerDistance` or `perimeterSampling`.
- `metrics.centerDistancePx`, `metrics.minDistancePx` (`centerDistance`): the distance from the target's centre to its neighbour's, against the 24px it needs.
- `metrics.perimeterHits`, `metrics.perimeterSamples`, `metrics.perimeterHitsToFail` (`perimeterSampling`): how many of the points on the 24px circle around the target land on another target, out of how many, against the number that fails.
- `conflictWith`: a selector for the neighbour it is too close to.
- `conflictHitCount`: the same count as `metrics.perimeterHits`, 0 when the distance decided.
- `measured.width`, `measured.height`: the target's size, unrounded.
- `viewport.width`, `viewport.height`: the viewport the page was laid out in, in CSS pixels. A responsive page can size or place a target differently at another width.

### `td-has-header`

**Data cells in large tables must have an associated header**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that every &lt;td&gt; in a large, simple (no colspan/rowspan) table has an associated header, via a headers attribute, an implicit column &lt;th&gt; above it, or an implicit row &lt;th&gt; to its left.

**Applies to.** `<table>` elements with at least 4 rows and at least 4 columns (a "large" table, where implicit row/column header association is useful; small tables are usually self-evident), and with NO `colspan`/`rowspan` anywhere in the table. A table whose role (first token) is anything but table, grid or treegrid, such as a layout table with role="presentation", is left out: it has no data cells.

**Expectation.**

Every non-empty `<td>` has an associated header, via one of:

- a non-empty `headers` attribute (trusted here; whether it resolves to real `<th>` ids is `table-headers-attr-valid`'s concern, not this rule's), OR
- an implicit column header: a header cell in the same column, in an earlier row, OR
- an implicit row header: a header cell earlier in the same row.

A header cell is a `<th>` with no other role, or any cell with role="columnheader" or role="rowheader" (such a `<td>` is a header, not a data cell). A `<td>` with no text and no content that could carry a name (an image, a control, an element with an ARIA label) holds no data, so it needs no header; the empty corner cell above row headers is the usual case.

**What a finding reports.**

- `row`, `column`: where the cell sits in the table, counting from 0: rows from the top, cells from the left within the row.

### `text-spacing-content-loss`

**Text stays readable when the user increases text spacing**

automatic · WCAG 1.4.12 (AA) · confidence medium · default severity serious

Applies the WCAG 1.4.12 text spacing in the browser and checks that no text is cut off or made to overlap, and asks about style sheet rules that force spacing with !important.

**Applies to.** Applies to a page with visible text. The loss of content needs a layout (a browser): without one, only the style sheets are read.

**Expectation.**

WCAG 1.4.12: with line height at 1.5 times the font size, spacing after paragraphs at 2 times, letter spacing at 0.12 times and word spacing at 0.16 times, no content or functionality is lost.

- In a browser, the spacing is applied as a style sheet that wins over the page's own (inline `!important` aside, which avoid-inline-spacing reports), and each line of text is measured before and after against the ancestors that clip it (`overflow: hidden` or `clip`). A line that was inside and ends at least half outside (half its height, or half an em across) fails: the container cuts that text off (TEXT_CLIPPED). A line pushed out by less is asked about (TEXT_CLIPPED_PARTLY), and so is text that comes to overlap other text it did not overlap before (TEXT_OVERLAPS).
- In any environment, a style sheet rule that sets line-height, letter-spacing or word-spacing below those values with `!important` is asked about (STYLESHEET_IMPORTANT): a tool that adds its own style sheet to the page cannot override it, though a user style sheet can.

Without a layout and with no such rule, the rule is notApplicable, with `data.reason: 'noLayout'`.

**What a finding reports.**

- `text`: the start of the text, up to 60 characters. Not on a style sheet rule's finding.
- `metrics.overflowPx` (cut-off text): how far, in CSS pixels, the line went past the edge of the box that clips it, with the spacing applied.
- `metrics.thresholdPx` (cut-off text): how far it may go before it fails: half an em across, or half the line's height down.
- `metrics.axis` (cut-off text): `x` when the line went past a side, `y` past the top or bottom.
- `container.widthPx`, `container.heightPx` (cut-off text): the size of the clipping box with the spacing applied.
- `viewport.width`, `viewport.height` (cut-off or overlapping text): the viewport the page was laid out in, in CSS pixels. Text that fits at one width can be cut off at another.
- `other` (overlapping text): the text it comes to overlap.
- `selector`, `property`, `value` (a style sheet rule): the rule's selector and the declaration that forces the spacing.

### `textbox-name-present`

**Textboxes have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="textbox" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="textbox" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="textbox" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom textbox widget is not reliably exposed as its name. On a labelable element (&lt;input role="textbox"&gt;) an associated &lt;label&gt; counts as well. On a text-like &lt;input&gt; or a &lt;textarea&gt;, the placeholder counts last (HTML-AAM's final name source): a placeholder-only label is a 3.3.2 question, not a missing name.

### `tooltip-name-present`

**Tooltips have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="tooltip" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="tooltip" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or, role="tooltip" being name-from-content, from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

### `treeitem-name-present`

**Tree items have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="treeitem" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="treeitem" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or, role="treeitem" being name-from-content, from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

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

- `value`: the lang attribute's value, with surrounding whitespace removed.

### `video-caption`

**Prerecorded video should provide a captions track**

manual · WCAG 1.2.2 (A) · confidence low · default severity moderate

Flags &lt;video&gt; elements with no &lt;track kind="captions"&gt; child, for manual review of whether the video has an audio track that needs captions; a subtitles track alone may be a translation only.

**Applies to.** Any &lt;video&gt; element in the composed DOM.

**Expectation.** SC 1.2.2 requires captions for prerecorded synchronized media, but only when the video actually has an audio track that conveys information (a silent/decorative video needs none), which cannot be verified from static markup alone (jsdom does not decode media). This rule is therefore `type: 'manual'` (cantTell-capped, never fail), matching the precedent set by `media-alternative-transcript-evidence` for the same class of "normatively mapped but not statically verifiable" gap. A &lt;video&gt; with a `<track kind="captions">` whose `src` is non-empty is not flagged; everything else is flagged for human review. A video whose only text tracks are subtitles (`kind="subtitles"`, or no `kind`, which HTML treats as subtitles) gets its own question: subtitles may be a translation of the dialogue only, without the speaker and sound information captions carry.

### `video-poster-text-alternative-present`

**&lt;video&gt; poster must have a text alternative**

automatic · WCAG 1.1.1 (A) · confidence medium · default severity serious

Checks that &lt;video&gt; elements with a poster image provide a text alternative (accessible name).

**Applies to.** Applies to &lt;video&gt; elements that: 1) have a non-empty poster attribute, AND 2) are exposed to assistive technologies (per engine eligibility checks). Elements otherwise hidden from the accessibility tree remain applicable if they are tabbable or referenced by IDREF relationships (per eligibility checks). Videos with role="presentation" or role="none" are excluded only when they are not focusable.

**Expectation.**

Each applicable &lt;video&gt; element provides a text alternative for the poster image, via:

- an accessible name (aria-label / aria-labelledby / title).

Between-tag fallback content inside &lt;video&gt; is NOT accepted: it is only rendered by browsers that don't support &lt;video&gt;, so it is not reliably exposed to assistive technologies in practice. &lt;video&gt; is also not a labelable element, so native &lt;label for="..."&gt; associations are not accepted either.
