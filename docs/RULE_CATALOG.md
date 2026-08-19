# Rule catalog

Generated from the compiled engine's own catalog (`getChecksCatalog()`/`getRulesCatalog()`) and each rule's source header — run `node scripts/generate-rule-catalog.js` after `npm run build` to regenerate this file whenever rules change. Do not hand-edit.

**130 rules total: 78 automatic (WCAG-normative, can return `fail`), 52 manual (advisory/judgment-required, capped at `cantTell`). 106 carry at least one formal WCAG Success Criterion mapping.**

The tables below are an index; [rule reference](#rule-reference) carries each rule's description, what it applies to and what it expects.

See [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md) for what `type`/`confidence`/`severity` mean on a scan result, and [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md) for how these roll up to an SC-level conformance claim. For WCAG-facet-level coverage-gap tracking (which parts of an SC are and aren't automatable yet), see `coverage/coverage-report.md` instead — that one is organized by facet, this one by rule.

## Automatic rules (78) — can return `fail`

| Rule ID | Title | WCAG SC | Level | Confidence | Default severity |
|---|---|---|---|---|---|
| [`area-alt-present`](#area-alt-present) | &lt;area&gt; must have an alt attribute | 1.1.1 | A | high | serious |
| [`aria-allowed-attr`](#aria-allowed-attr) | aria-* attributes must be permitted for the element’s role | 4.1.2 | A | medium | moderate |
| [`aria-allowed-role`](#aria-allowed-role) | Explicit role must be permitted for its host element | 4.1.2 | A | high | moderate |
| [`aria-braille-equivalent`](#aria-braille-equivalent) | aria-braillelabel/aria-brailleroledescription must have a non-braille equivalent | 4.1.2 | A | high | serious |
| [`aria-conditional-attr`](#aria-conditional-attr) | aria-errormessage requires aria-invalid to be set to a non-false value | 4.1.2 | A | high | serious |
| [`aria-deprecated-role`](#aria-deprecated-role) | role attribute should not use a deprecated or author-discouraged ARIA role | 4.1.2 | A | high | moderate |
| [`aria-hidden-body`](#aria-hidden-body) | The document &lt;body&gt; must not be aria-hidden | 1.3.1, 4.1.2 | A | high | critical |
| [`aria-hidden-focus`](#aria-hidden-focus) | ARIA hidden elements must not be focusable | 2.4.7, 4.1.2 | AA | high | serious |
| [`aria-prohibited-attr`](#aria-prohibited-attr) | ARIA naming attributes must not be used on roles that prohibit them | 4.1.2 | A | high | moderate |
| [`aria-prohibited-children`](#aria-prohibited-children) | Container roles must not own a child with a disallowed role | 4.1.2 | A | medium | moderate |
| [`aria-required-attr`](#aria-required-attr) | Roles with a required ARIA state/property must carry it | 4.1.2 | A | high | serious |
| [`aria-required-children`](#aria-required-children) | Container roles must own at least one required child role | 4.1.2 | A | medium | moderate |
| [`aria-required-parent`](#aria-required-parent) | Roles requiring a specific context role must be in that context | 4.1.2 | A | medium | moderate |
| [`aria-role-name-present`](#aria-role-name-present) | ARIA widget/container roles have an accessible name | 4.1.2 | A | high | serious |
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
| [`deprecated-elements-not-used`](#deprecated-elements-not-used) | Obsolete non-stoppable elements (&lt;blink&gt;, &lt;marquee&gt;) must not be used | 2.2.2 | A | high | serious |
| [`dialog-name-present`](#dialog-name-present) | Dialogs have an accessible name | 4.1.2 | A | high | serious |
| [`dlitem-parent-valid`](#dlitem-parent-valid) | Description-list items must be inside a description list | 1.3.1 | A | high | serious |
| [`duplicate-id`](#duplicate-id) | IDs must be unique | 4.1.1 | A | high | moderate |
| [`duplicate-id-aria`](#duplicate-id-aria) | IDs referenced by ARIA must be unique | 4.1.2 | A | high | serious |
| [`embed-text-alternative-present`](#embed-text-alternative-present) | &lt;embed&gt; must provide a text alternative | 1.1.1 | A | high | serious |
| [`form-control-programmatic-label-present`](#form-control-programmatic-label-present) | Form controls must have a programmatic label | 1.3.1, 3.3.2, 4.1.2 | A | medium | serious |
| [`form-control-single-label`](#form-control-single-label) | Form controls must not have multiple labels | 3.3.2 | A | high | moderate |
| [`html-lang-attr-present`](#html-lang-attr-present) | Page language is declared | 3.1.1 | A | high | serious |
| [`html-xml-lang-mismatch`](#html-xml-lang-mismatch) | lang and xml:lang must not disagree | 3.1.1 | A | high | serious |
| [`iframe-focusable-content`](#iframe-focusable-content) | Frames with tabindex="-1" must not contain focusable content | 2.1.1 | A | high | moderate |
| [`iframe-name-present`](#iframe-name-present) | Frames have an accessible name | 4.1.2 | A | high | serious |
| [`iframe-title-unique`](#iframe-title-unique) | Frame titles must be unique | 4.1.2 | A | high | moderate |
| [`img-alt-present`](#img-alt-present) | &lt;img&gt; must have an alt attribute | 1.1.1 | A | high | serious |
| [`input-image-alt-present`](#input-image-alt-present) | &lt;input type="image"&gt; must have an alt attribute | 1.1.1 | A | high | serious |
| [`label-in-name`](#label-in-name) | Label in Name: accessible name contains visible text | 2.5.3 | A | high | serious |
| [`link-in-text-block`](#link-in-text-block) | Links in text blocks must be distinguishable from surrounding text without relying on color alone | 1.4.1 | A | high | serious |
| [`link-name-present`](#link-name-present) | Links have an accessible name | 4.1.2 | A | high | serious |
| [`list-children-valid`](#list-children-valid) | Lists must only directly contain list items | 1.3.1 | A | high | serious |
| [`listbox-name-present`](#listbox-name-present) | Listboxes have an accessible name | 4.1.2 | A | high | serious |
| [`listitem-parent-valid`](#listitem-parent-valid) | List items must be inside a list container | 1.3.1 | A | high | serious |
| [`menuitem-name-present`](#menuitem-name-present) | Menu items have an accessible name | 4.1.2 | A | high | serious |
| [`meta-refresh-no-exceptions`](#meta-refresh-no-exceptions) | Page must not use a meta refresh at all (AAA) | 2.2.4, 3.2.5 | AAA | high | moderate |
| [`meta-refresh-timing-absent`](#meta-refresh-timing-absent) | Page must not use a timed meta refresh | 2.2.1 | A | high | serious |
| [`meta-viewport-zoom-enabled`](#meta-viewport-zoom-enabled) | Viewport meta tag must not disable zoom | 1.4.4 | AA | high | serious |
| [`meter-name-present`](#meter-name-present) | Meters have an accessible name | 1.1.1 | A | high | serious |
| [`nested-interactive-controls-absent`](#nested-interactive-controls-absent) | Interactive controls must not be nested | 4.1.2 | A | high | serious |
| [`object-text-alternative-present`](#object-text-alternative-present) | &lt;object&gt; must provide a text alternative | 1.1.1 | A | high | serious |
| [`option-name-present`](#option-name-present) | Options have an accessible name | 4.1.2 | A | high | serious |
| [`page-title-present`](#page-title-present) | Page has a non-empty title | 2.4.2 | A | high | serious |
| [`presentational-children-focusable-absent`](#presentational-children-focusable-absent) | Roles with presentational children must not contain focusable content | 4.1.2 | A | high | serious |
| [`progressbar-name-present`](#progressbar-name-present) | Progress bars have an accessible name | 1.1.1 | A | high | serious |
| [`role-img-text-alternative-present`](#role-img-text-alternative-present) | [role="img"] must have an accessible text alternative | 1.1.1 | A | high | serious |
| [`searchbox-name-present`](#searchbox-name-present) | Searchboxes have an accessible name | 4.1.2 | A | high | serious |
| [`server-side-image-map-absent`](#server-side-image-map-absent) | Images must not use a server-side image map | 2.1.1 | A | high | serious |
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
| [`textbox-name-present`](#textbox-name-present) | Textboxes have an accessible name | 4.1.2 | A | high | serious |
| [`tooltip-name-present`](#tooltip-name-present) | Tooltips have an accessible name | 4.1.2 | A | high | serious |
| [`treeitem-name-present`](#treeitem-name-present) | Tree items have an accessible name | 4.1.2 | A | high | serious |
| [`valid-lang`](#valid-lang) | Element lang attribute must be syntactically valid | 3.1.2 | AA | high | moderate |
| [`video-poster-text-alternative-present`](#video-poster-text-alternative-present) | &lt;video&gt; poster must have a text alternative | 1.1.1 | A | medium | serious |

## Manual rules (52) — advisory, capped at `cantTell`

| Rule ID | Title | WCAG SC | Level | Confidence | Default severity |
|---|---|---|---|---|---|
| [`accesskeys`](#accesskeys) | accesskey values must be unique | — | — | medium | minor |
| [`area-alt-decorative`](#area-alt-decorative) | &lt;area&gt; with alt="" must be decorative (manual review) | 1.1.1 | A | medium | minor |
| [`area-alt-quality`](#area-alt-quality) | &lt;area&gt; alt text must be appropriate (manual review) | 1.1.1 | A | medium | minor |
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
| [`img-alt-decorative`](#img-alt-decorative) | &lt;img&gt; with alt="" must be decorative (manual review) | 1.1.1 | A | medium | minor |
| [`img-alt-quality`](#img-alt-quality) | &lt;img&gt; alt text must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`input-image-alt-decorative`](#input-image-alt-decorative) | &lt;input type="image"&gt; with alt="" must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`input-image-alt-quality`](#input-image-alt-quality) | &lt;input type="image"&gt; alt text must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`label-title-only`](#label-title-only) | Form controls should not use title as their only label | — | — | medium | minor |
| [`landmark-banner-is-top-level`](#landmark-banner-is-top-level) | Banner landmark must be top-level | — | — | medium | minor |
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
| [`p-as-heading`](#p-as-heading) | A &lt;p&gt; styled to look like a heading should probably be a real heading | 1.3.1 | A | low | minor |
| [`page-has-heading-one`](#page-has-heading-one) | Page should have a level-one heading | — | — | medium | minor |
| [`page-title-patterns`](#page-title-patterns) | Page title patterns that may be insufficiently descriptive | 2.4.2 | A | medium | minor |
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

## Composite (WCAG-SC rollup) rules (33)

Composite rules aren't individually authored — they're generated rollups over the atomic rules above, one per WCAG Success Criterion with automatable coverage. See [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md) for rollup semantics.

| Composite ID | Title | Description | WCAG SC | Level | # atomic rules rolled up |
|---|---|---|---|---|---|
| `wcag-1.1.1-non-text-content` | Non-text content: text alternatives | Rollup of checks ensuring non-text content has an appropriate text alternative. | 1.1.1 | A | 22 |
| `wcag-1.2.1-audio-only-video-only-prerecorded` | Audio-only and video-only (prerecorded): transcript | Rollup of checks for transcript availability for prerecorded audio-only/video-only media. | 1.2.1 | A | 1 |
| `wcag-1.2.2-captions-prerecorded` | Captions (Prerecorded) | Rollup of checks for captions-track evidence on prerecorded video. | 1.2.2 | A | 1 |
| `wcag-1.3.1-info-and-relationships` | Info and Relationships | Rollup of checks ensuring information, structure, and relationships conveyed through presentation are programmatically determinable. | 1.3.1 | A | 11 |
| `wcag-1.3.4-orientation` | Orientation | Rollup of checks ensuring content does not restrict its view to a single display orientation. | 1.3.4 | AA | 1 |
| `wcag-1.3.5-identify-input-purpose` | Identify Input Purpose | Rollup of checks ensuring the autocomplete attribute correctly identifies input purpose. | 1.3.5 | AA | 1 |
| `wcag-1.4.1-use-of-color` | Use of Color | Rollup of checks ensuring color is not used as the only visual means of conveying information. | 1.4.1 | A | 1 |
| `wcag-1.4.12-text-spacing` | Text Spacing | Rollup of checks ensuring inline styles do not block user text-spacing overrides. | 1.4.12 | AA | 1 |
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
| `wcag-2.4.4-link-purpose-in-context` | Link Purpose (In Context) | Rollup of checks flagging links whose text alone is a known non-descriptive/generic phrase. | 2.4.4 | A | 1 |
| `wcag-2.4.6-headings-and-labels` | Headings and Labels | Rollup of checks flagging headings whose text is a placeholder rather than a description of the content that follows. | 2.4.6 | AA | 2 |
| `wcag-2.4.7-focus-visible` | Focus visible | Rollup of checks ensuring keyboard focus is not hidden and remains perceivable. | 2.4.7 | AA | 4 |
| `wcag-2.4.9-link-purpose-link-only` | Link Purpose (Link Only) | Rollup of checks ensuring links with the same accessible name serve the same purpose (AAA). | 2.4.9 | AAA | 1 |
| `wcag-2.5.3-label-in-name` | Label in name | Rollup of checks ensuring that when a control has a visible text label, the accessible name contains that visible label text. | 2.5.3 | A | 1 |
| `wcag-2.5.8-target-size-minimum` | Target size: minimum | Rollup of checks ensuring pointer targets meet minimum size requirements. | 2.5.8 | AA | 1 |
| `wcag-3.1.1-language-of-page` | Language of page | Rollup of checks ensuring the page language is specified. | 3.1.1 | A | 2 |
| `wcag-3.1.2-language-of-parts` | Language of Parts | Rollup of checks ensuring elements whose language differs from the page default declare it correctly. | 3.1.2 | AA | 1 |
| `wcag-3.2.5-change-on-request` | Change on Request | Rollup of checks ensuring context changes only happen at the user's request (AAA). | 3.2.5 | AAA | 1 |
| `wcag-3.3.2-labels-or-instructions` | Labels or Instructions | Rollup of checks ensuring form controls have unambiguous labeling. | 3.3.2 | A | 2 |
| `wcag-4.1.1-parsing` | Parsing | Rollup of checks ensuring id values are unique. WCAG 2.0/2.1 only — SC 4.1.1 was removed in WCAG 2.2, so this composite carries the wcag22-removed tag. | 4.1.1 | A | 1 |
| `wcag-4.1.2-aria-validity` | Name, role, value: ARIA validity | Rollup of checks that ARIA role and attribute usage conforms to the WAI-ARIA specification (valid roles, valid attributes, valid values, required attributes/relationships, unique ARIA-referenced ids). | 4.1.2 | A | 17 |
| `wcag-4.1.2-name` | Name, role, value: accessible name | Rollup of checks that common interactive elements expose a non-empty accessible name. | 4.1.2 | A | 23 |

## Rule reference

Every atomic rule, alphabetically. "Applies to" is the rule's precondition — when it returns `notApplicable` — and "Expectation" is the condition it decides once it does apply.

### `accesskeys`

**accesskey values must be unique**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that no two elements on the page share the same accesskey attribute value.

**Applies to.** Applies whenever two or more elements share the same non-empty accesskey attribute value (case-insensitive).

**Expectation.** Every accesskey value on the page is unique. Duplicate accesskeys make keyboard-shortcut activation ambiguous — only one of the elements sharing the key can actually be reached by it, and which one is browser/platform-dependent.

### `area-alt-decorative`

**&lt;area&gt; with alt="" must be decorative (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;area&gt; elements with empty alt for human review that they are decorative/non-informative.

**Applies to.** Applies to &lt;area&gt; elements whose alt attribute is present but empty once trimmed, the markup that declares a hotspot decorative. The &lt;area&gt; must belong to a &lt;map&gt; that an &lt;img usemap&gt; actually references, and both that &lt;img&gt; and the &lt;area&gt; itself must be included in the accessibility tree; an &lt;area&gt; in an unused map is out of scope. role="presentation"/"none" takes an element out unless it is focusable.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

### `area-alt-present`

**&lt;area&gt; must have an alt attribute**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that &lt;area&gt; elements provide an alt attribute to support a text alternative mechanism.

**Applies to.** Applies to &lt;area&gt; elements that: 1) are in a &lt;map&gt; that is referenced by an &lt;img usemap&gt;, AND 2) the referencing &lt;img&gt; is eligible in the accessibility tree (best-effort), AND 3) the &lt;area&gt; itself is eligible in the accessibility tree (with engine exceptions).

**Expectation.** Each applicable &lt;area&gt; element has an alt attribute. The alt attribute may be empty (alt="").

### `area-alt-quality`

**&lt;area&gt; alt text must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;area&gt; elements with non-empty alt text for human review of appropriateness.

**Applies to.** Applies to &lt;area&gt; elements whose alt attribute is present and non-empty. The &lt;area&gt; must belong to a &lt;map&gt; that an &lt;img usemap&gt; actually references, and both that &lt;img&gt; and the &lt;area&gt; itself must be included in the accessibility tree; an &lt;area&gt; in an unused map is out of scope. role="presentation"/"none" takes an element out unless it is focusable.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

### `aria-allowed-attr`

**aria-* attributes must be permitted for the element’s role**

automatic · WCAG 4.1.2 (A) · confidence medium · default severity moderate

Checks that every recognized aria-* attribute present on an element with an explicit role is either globally supported or supported by that role.

**Applies to.** Applies to elements carrying at least one recognized, non-global aria-* attribute, judged against the role they actually have: an explicit valid role, else the implicit role of their tag, else — for the elements HTML-AAM maps to no role at all — nothing.

**Expectation.** Every recognized aria-* attribute present is either: (a) globally supported on any element (the "global" ARIA states/properties, e.g. aria-label/aria-hidden/aria-describedby), or (b) explicitly listed as a required or supported state/property for the element's role. An attribute ARIA deprecated (rather than prohibited) on the role is still allowed: it is reported as CANTTELL (see helpers.aria.isDeprecatedAttr) so the author decides, not as a not-allowed FAIL.

### `aria-allowed-role`

**Explicit role must be permitted for its host element**

automatic · WCAG 4.1.2 (A) · confidence high · default severity moderate

Checks that an explicit role="" attribute is one of the roles the ARIA-in-HTML specification permits for the host element (e.g. role="tab" is not permitted on &lt;nav&gt;).

**Applies to.** Applies to elements with an explicit, valid, non-abstract role, where the host element/attribute combination has an asserted permitted-roles constraint in the ARIA-in-HTML table (src/core/aria-helpers.js ALLOWED_ROLES_BY_ELEMENT).

**Expectation.** The explicit role is one of the roles the ARIA-in-HTML specification permits for that host element.

### `aria-braille-equivalent`

**aria-braillelabel/aria-brailleroledescription must have a non-braille equivalent**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements using aria-braillelabel also have a regular accessible name, and elements using aria-brailleroledescription also have aria-roledescription.

**Applies to.** Elements with a non-empty `aria-braillelabel` and/or non-empty `aria-brailleroledescription` attribute.

**Expectation.**

Per the ARIA specification, `aria-braillelabel` is a Braille-specific SUPPLEMENT to (not a replacement for) the element's regular accessible name, and `aria-brailleroledescription` is a supplement to `aria-roledescription`. An element must therefore also have:

- a non-empty accessible name from a non-braille mechanism, if it declares `aria-braillelabel`;
- a non-empty `aria-roledescription`, if it declares `aria-brailleroledescription`.

Using either braille-specific attribute as the ONLY naming mechanism leaves non-braille assistive technology (most screen readers, voice control, etc.) with no accessible name/role description at all.

### `aria-checked-state-mismatch`

**Native checkbox/radio aria-checked should match its actual state**

manual · WCAG 4.1.2 (A) · confidence medium · default severity moderate

Flags a native &lt;input type="checkbox"&gt;/&lt;input type="radio"&gt; whose explicit aria-checked value disagrees with its actual checked/indeterminate state, for manual review.

**Applies to.** Native `&lt;input type="checkbox"&gt;` / `&lt;input type="radio"&gt;` elements that carry an explicit `aria-checked` attribute.

**Expectation.** `aria-checked` is redundant on a native checkbox/radio (the role's checked state is already exposed natively), but when an author sets it explicitly it should agree with the element's actual state — otherwise assistive technology is told something different from what a sighted user perceives.

### `aria-conditional-attr`

**aria-errormessage requires aria-invalid to be set to a non-false value**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with aria-errormessage also have aria-invalid set to "true", "grammar", or "spelling" — otherwise the error message is dropped from the accessibility tree.

**Applies to.** Elements with a non-empty `aria-errormessage` attribute.

**Expectation.** Per the ARIA specification, `aria-errormessage` is only exposed to assistive technology when `aria-invalid` is present with a value other than `"false"` (i.e. `"true"`, `"grammar"`, or `"spelling"`). An element with `aria-errormessage` but `aria-invalid` absent or `"false"` silently drops the error message from the accessibility tree — authors almost always intend it to be exposed.

### `aria-deprecated-role`

**role attribute should not use a deprecated or author-discouraged ARIA role**

automatic · WCAG 4.1.2 (A) · confidence high · default severity moderate

Checks that an explicit role="" attribute does not use a role deprecated by the WAI-ARIA specification, or one reserved for user-agent-internal use (e.g. role="generic").

**Applies to.** Applies to any element whose role attribute's first (used) token is a valid, non-abstract ARIA role that authors should not explicitly declare — either because WAI-ARIA has deprecated it (e.g. "directory", superseded by role="list") or because it is reserved for user-agent- internal use (role="generic", which ARIA 1.2 §5.4 says authors SHOULD NOT use in content).

**Expectation.**

The role in use is neither deprecated nor reserved. Graded by the strength of the rule ARIA states:

- CANTTELL at SHOULD NOT, which leaves the usage conforming, so the author decides whether it matters: a deprecated role ("directory") or one reserved for user agents ("generic").
- FAIL at MUST NOT. No ARIA 1.2 or 1.3 role carries an author MUST NOT outside the abstract roles, so this outcome is reserved for a later revision promoting a role to that strength.

Distinct, atomic decision from aria-roles-valid (existence/ abstractness): a role can be valid and non-abstract while still being discouraged in explicit author use.

### `aria-hidden-body`

**The document &lt;body&gt; must not be aria-hidden**

automatic · WCAG 1.3.1, 4.1.2 (A) · confidence high · default severity critical

Checks that &lt;body&gt; does not have aria-hidden="true", which would remove the entire page from the accessibility tree.

**Applies to.** Always applicable to any HTML document with a &lt;body&gt; element, independent of contextSelector/root scoping — this is a whole- document concern, matching page-title-present's pattern of evaluating document.body directly rather than the scoped root.

**Expectation.** &lt;body&gt; does not have aria-hidden="true". Hiding the document body removes the entire page's content and structure from the accessibility tree at once — both 1.3.1 (Info and Relationships: the page's structure becomes entirely non-determinable) and 4.1.2 (Name, Role, Value: nothing in the document exposes a role/name/value any longer) apply.

### `aria-hidden-focus`

**ARIA hidden elements must not be focusable**

automatic · WCAG 2.4.7, 4.1.2 (AA) · confidence high · default severity serious

Checks that aria-hidden="true" elements are not focusable and do not contain focusable descendants.

**Applies to.** Applies to elements that have aria-hidden="true".

**Expectation.**

No element with aria-hidden="true" may itself be focusable, and no focusable element may exist within an aria-hidden="true" subtree. Notes:

- Focusability is computed via ctx.helpers.getFocusableInfo (native + tabindex + contenteditable).
- Elements that are not rendered (e.g., display:none, visibility:hidden, [hidden]) are excluded.
- Elements hidden via CSS in ways that still allow keyboard focus (e.g., opacity:0, off-screen, clip) remain in-scope and will be flagged when focusable.

### `aria-prohibited-attr`

**ARIA naming attributes must not be used on roles that prohibit them**

automatic · WCAG 4.1.2 (A) · confidence high · default severity moderate

Checks that aria-label/aria-labelledby are not present on WAI-ARIA roles whose specification explicitly prohibits ARIA naming (e.g. generic, emphasis, strong, paragraph).

**Applies to.** Applies to (a) elements whose explicit, valid role is one of the ARIA 1.2 roles with a documented "Prohibited ARIA States and Properties" list for naming attributes (pure text-semantics / non-naming structural roles: caption, code, deletion, emphasis, generic, insertion, mark, none, paragraph, presentation, strong, subscript, suggestion, superscript, time), and (b) elements with no role at all — a curated set of native HTML tags verified to carry no implicit role (see ROLELESS_NATIVE_TAGS below), or any autonomous custom element (a hyphenated, author-defined tag per the Custom Elements spec; see isRolelessCustomElementTag below) — in both cases, only elements that also carry aria-label or aria-labelledby.

**Expectation.** Prohibited attributes must not be present on (a); for (b), the naming attribute is at best unreliable (nothing accessible-name-aware to hang it off) and at worst silently ignored by assistive technology — see the roleless-branch implementation note below for the confidence split this produces.

### `aria-prohibited-children`

**Container roles must not own a child with a disallowed role**

automatic · WCAG 4.1.2 (A) · confidence medium · default severity moderate

Checks that every accessible-tree-owned child of a container role (list, listbox, menu, menubar, radiogroup, rowgroup, table, grid, treegrid, tablist, tree, row) has one of that role's allowed owned roles.

**Applies to.** Applies to elements with an explicit, valid role that is one of the container roles with a documented "required owned elements" entry (the same REQUIRED_OWNED_ROLES table aria-required-children uses — see src/core/aria-helpers.js).

**Expectation.** Every accessible-tree-owned descendant of the container (after pruning role="none"/"presentation" elements and any "group"/ "rowgroup" wrapper whose role is itself one of the required roles — both are structurally transparent, same as WAI-ARIA's own accessibility-tree construction) has a role from that same required- owned set. Nothing else is a structurally valid direct child of a composite/container role.

### `aria-required-attr`

**Roles with a required ARIA state/property must carry it**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with an explicit role carry every unambiguous, context-independent required aria-* state/property for that role (e.g. role="checkbox" must have aria-checked).

**Applies to.** Applies to elements with an explicit, valid, non-abstract role that is also one of the small set of roles with a documented, context- independent required state/property (checkbox, combobox, heading, menuitemcheckbox, menuitemradio, meter, radio, scrollbar, separator, slider, switch) -- except when that explicit role is identical to the element's own native/implicit role (ACT 4e8ab6: e.g. &lt;input type="checkbox" role="checkbox"&gt;, which is exempt because the native control's own state exposure already covers it; no aria-checked is required. helpers.aria.getNativeRoleForElement resolves this).

**Expectation.** Every required aria-* attribute for that role is present (and non-empty).

### `aria-required-children`

**Container roles must own at least one required child role**

automatic · WCAG 4.1.2 (A) · confidence medium · default severity moderate

Checks that container roles with a documented "required owned elements" entry (list, listbox, menu, radiogroup, table, grid, tablist, tree, row, ...) contain at least one descendant or aria-owns-referenced element with an acceptable owned role.

**Applies to.** Applies to elements with an explicit, valid, non-abstract role that is also one of the container roles with a documented "required owned elements" entry (list, listbox, menu, menubar, radiogroup, rowgroup, table, grid, treegrid, tablist, tree, row).

**Expectation.** At least one descendant, or one aria-owns-referenced element, has one of the acceptable owned roles for that container role.

### `aria-required-parent`

**Roles requiring a specific context role must be in that context**

automatic · WCAG 4.1.2 (A) · confidence medium · default severity moderate

Checks that roles with a documented "required context role" entry (listitem, option, tab, treeitem, row, cell, ...) have an ancestor or aria-owns owner with an acceptable context role.

**Applies to.** Applies to elements with an explicit, valid, non-abstract role that is also one of the roles with a documented, non-empty "required context role" entry (listitem, option, menuitem, menuitemcheckbox, menuitemradio, tab, treeitem, row, cell, gridcell, columnheader, rowheader, rowgroup).

**Expectation.** The element has an ancestor (DOM containment) or owner (via that ancestor/owner's aria-owns) whose effective role is one of the acceptable context roles for this element's role.

### `aria-role-name-present`

**ARIA widget/container roles have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that selected ARIA widget/container roles expose a non-empty accessible name.

**Applies to.** Applies to elements whose role attribute is exactly one of scrollbar, toolbar, tablist, radiogroup, tree, grid, menu, menubar, meter or progressbar, and that are included in the accessibility tree. The list is a frozen allowlist rather than every role WAI-ARIA lets an author name. meter and progressbar are also covered by meter-name-present and progressbar-name-present, so those two roles are reported by both rules.

**Expectation.** The element has a non-empty aria-label, an aria-labelledby that resolves to non-empty text, or a non-empty title. Every role in the list is name-from-author-only, so descendant text is deliberately not accepted: a labelled child inside a composite widget would otherwise pass the container that has no name of its own.

### `aria-roles-valid`

**role attribute must be a valid, non-abstract ARIA role**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that an explicit role="" attribute resolves to a real, non-abstract WAI-ARIA role.

**Applies to.** Applies to any element with a non-empty role="" attribute in the composed DOM.

**Expectation.** The role attribute's first token (the role actually used by assistive technology; later space-separated tokens are author-supplied fallbacks and are not evaluated here) must be a real WAI-ARIA role name, and must not be an abstract role (abstract roles exist only for the specification's own role taxonomy and must never be used directly in markup).

### `aria-text`

**role="text" elements should have no focusable descendants**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that elements with role="text" contain no focusable descendant (link, button, form control, tabindex, iframe, or contenteditable).

**Applies to.** Elements with an explicit `role="text"`.

**Expectation.** `role="text"` tells assistive technology to treat an element's whole subtree as a single unit of plain text (e.g. text visually split across multiple `&lt;span&gt;`s by styling). Per the WAI-ARIA Authoring Practices, this only makes sense when that subtree contains no focusable content — a focusable descendant inside a "this is just text" region is unreachable or confusing for keyboard/AT users.

### `aria-valid-attr`

**aria-* attributes must be real, defined ARIA attributes**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that every aria-* attribute name present in the DOM is a real attribute defined by the WAI-ARIA specification.

**Applies to.** Applies to any element in the composed DOM that carries at least one attribute whose name starts with "aria-".

**Expectation.** Each aria-* attribute name is a real attribute defined by the WAI-ARIA specification (catches typos / made-up attribute names, which are silently ignored by assistive technology and therefore a real, deterministic defect).

### `aria-valid-attr-value`

**aria-* attribute values must match their declared type**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that every recognized aria-* attribute has a value conforming to its WAI-ARIA-declared value type (boolean, tristate, token, integer, number, or ID reference).

**Applies to.** Applies to any element carrying at least one recognized aria-* attribute (unrecognized attribute names are aria-valid-attr's concern, not evaluated here).

**Expectation.** Each attribute's value conforms to its WAI-ARIA-declared value type: boolean ("true"/"false"), tristate ("true"/"false"/"mixed"), a token from a fixed enumerated set, an integer, a real number, or an empty value or ID reference (list) that resolves to an existing element in the document.

### `autocomplete-valid`

**autocomplete attribute must be a valid autofill value**

automatic · WCAG 1.3.5 (AA) · confidence high · default severity moderate

Checks that a non-empty autocomplete attribute is "on"/"off" or a well-formed autofill detail token list.

**Applies to.** Applies to form controls (input, select, textarea) with a non-empty autocomplete attribute.

**Expectation.** The value is "on"/"off" alone, or a well-formed autofill detail token list: an optional "section-*" token, then an optional "shipping"/"billing" token, then an optional contact-modality token (home/work/mobile/fax/pager/impp), then exactly one recognized field-name token (name, email, street-address, cc-number, tel, ...), optionally followed by "webauthn". A malformed value means the field is not reliably identified for assistive technology that relies on autocomplete to describe the expected input purpose.

### `avoid-inline-spacing`

**Inline style must not force text spacing below the WCAG metric**

automatic · WCAG 1.4.12 (AA) · confidence high · default severity moderate

Checks that where inline style forces line-height, letter-spacing or word-spacing with !important, the value already meets WCAG 1.4.12, so the user has nothing left to override.

**Applies to.** Applies to a rendered element with visible text of its own whose style attribute declares line-height, letter-spacing or word-spacing as `!important` with a real value. A CSS-wide keyword (inherit, initial, unset, revert) specifies no spacing of its own and is out of scope.

**Expectation.** Each such declaration already meets WCAG 1.4.12's own metric for that property, as a multiple of the font size: line-height at least 1.5, letter-spacing at least 0.12, word-spacing at least 0.16. A forced value that already satisfies the criterion leaves the user nothing to override.

### `binary-control-name-present`

**Binary controls have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that checkbox, radio, and switch controls expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="checkbox", role="radio" or role="switch" (the attribute must name one of those roles alone, not a fallback list) that are included in the accessibility tree. A native &lt;input type="checkbox"&gt;/&lt;input type="radio"&gt; is in scope only when it carries one of those roles explicitly; without a role attribute it belongs to form-control-programmatic-label-present.

**Expectation.** The control has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. A native checkbox or radio additionally accepts an associated &lt;label&gt; — the labels API, a wrapping &lt;label&gt;, or label[for], with at most four labels read for determinism — and any other element accepts its own subtree text, those roles being name-from-content.

### `button-name-present`

**Buttons have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that buttons expose a non-empty accessible name.

**Applies to.** Applies to &lt;button&gt;, &lt;input type="button"&gt;, &lt;input type="submit"&gt;, &lt;input type="reset"&gt; and elements with role="button", where the element is included in the accessibility tree. role="presentation"/"none" takes an element out of scope unless a global ARIA attribute or focusability restores its role, per presentational roles conflict resolution.

**Expectation.** The element has a non-empty accessible name. A programmatic name is taken first (aria-labelledby, aria-label, an associated &lt;label&gt;, title). Failing that, an &lt;input&gt; button falls back to its value attribute, and type="submit"/type="reset" fall back to the user agent's own "Submit"/"Reset" default, which is why those two are never nameless. Failing both, a button whose role is name-from-content falls back to its subtree text, counting each descendant's own name (an &lt;img alt&gt;, aria-label or title) rather than only text nodes.

### `bypass-blocks-present`

**Page must provide a way to bypass repeated blocks**

manual · WCAG 2.4.1 (A) · confidence medium · default severity moderate

Checks that the page has at least one recognized WCAG 2.4.1 bypass-blocks mechanism: a main landmark, a working same-page anchor link, or a heading.

**Applies to.** Always applicable to any HTML document with a &lt;body&gt; element — "bypass blocks" is a whole-page concern, matching aria-hidden-body / page-title-present's pattern of evaluating the document directly rather than a scoped root.

**Expectation.** At least one of the following recognized WCAG 2.4.1 techniques is present: (a) a main landmark (&lt;main&gt; or [role="main"]) — technique ARIA11: a screen reader user can jump straight to it, bypassing everything before it (nav, header, repeated blocks) in one step; (b) a working same-page anchor link — technique G1/G123: an &lt;a href="#id"&gt; (or legacy &lt;a name="id"&gt;) whose target resolves to a real element in the link's own tree (light DOM or the same shadow root). Deliberately NOT required to be positioned before a &lt;nav&gt; or be keyboard-focus-order-first — see implementation notes; (c) at least one heading (&lt;h1&gt;-&lt;h6&gt; or [role="heading"]) — technique H69: heading navigation is itself a standards-recognized bypass mechanism (e.g. a screen reader's "jump by heading" command).

### `canvas-text-alternative-present`

**&lt;canvas&gt; must provide a text alternative**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that &lt;canvas&gt; elements provide a text alternative via fallback content or an accessible name.

**Applies to.** Applies to &lt;canvas&gt; elements included in the accessibility tree. Hidden elements are excluded whether or not they are focusable.

**Expectation.** Each applicable &lt;canvas&gt; provides a text alternative via fallback content or an accessible name.

### `canvas-text-alternative-quality`

**&lt;canvas&gt; text alternative must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;canvas&gt; elements with a detected text alternative for human review of equivalence and appropriateness.

**Applies to.** Applies to &lt;canvas&gt; elements that already carry a text alternative: fallback content inside the element, an ARIA name, or a title. A &lt;canvas&gt; with none of those has no alternative whose quality could be judged — it is canvas-text-alternative-present's failure. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

### `combobox-name-present`

**Comboboxes have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="combobox" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="combobox" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="combobox" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom combobox widget is not reliably exposed as its name. On a labelable element (&lt;input role="combobox"&gt;) an associated &lt;label&gt; counts as well.

### `contrast-computable`

**Color contrast is computable for rendered text**

automatic · WCAG 1.4.3, 1.4.6 (AAA) · confidence high · default severity serious

Determines whether sufficient information is available to compute WCAG color contrast for visible text (e.g., no gradients/images/blend modes that make background indeterminate).

**Applies to.** Applies to every visible text node in scope, plus the label of &lt;input type="button"&gt;/[type="submit"]/[type="reset"], which is rendered from the value attribute and so is invisible to a text-node walk. Text counts only when its element is DOM-visible under the run's visibility mode, is not clipped out of sight by the sr-only technique (clip or clip-path), and belongs neither to a disabled control nor to the label of one — WCAG's inactive-user-interface-component exception. Subtrees excluded via engineOptions.excludeSelectors are skipped, and open shadow roots are walked as roots in their own right.

**Expectation.** Both sides of the contrast calculation can be established from CSS for every applicable text node: an effective background resolving to an opaque color, and a parsable foreground color. Where either cannot be — a background image or gradient, mix-blend-mode, a filter or backdrop-filter, ancestor opacity, a root background that never becomes opaque, or a color that does not parse — the result is cantTell naming the blocker. This rule is the one that reports that uncertainty, which is what lets contrast-minimum and contrast-enhanced stay silent on the same text instead of guessing at a ratio.

### `contrast-enhanced`

**Text meets enhanced color contrast (AAA)**

automatic · WCAG 1.4.6 (AAA) · confidence high · default severity serious

Checks that visible text has a contrast ratio of at least 7.0:1 (normal) or 4.5:1 (large), when contrast is computable from CSS.

**Applies to.** Applies to the visible text contrast-computable applies to — see that rule for the eligibility gates — narrowed to text whose background and foreground are actually computable. Eligible text that is not computable leaves this rule notApplicable rather than cantTell: reporting that uncertainty belongs to contrast-computable, so the two never report the same text twice.

**Expectation.** Every computable text node reaches the ratio SC 1.4.6 requires for its size: 4.5:1 for large text, 7:1 for everything else. Text is large at 24px or more, or at 14pt (about 18.667px) or more when the computed font weight is 700 or higher.

### `contrast-minimum`

**Text meets minimum color contrast (AA)**

automatic · WCAG 1.4.3 (AA) · confidence high · default severity serious

Checks that visible text has a contrast ratio of at least 4.5:1 (normal) or 3.0:1 (large), when contrast is computable from CSS.

**Applies to.** Applies to the visible text contrast-computable applies to — see that rule for the eligibility gates — narrowed to text whose background and foreground are actually computable. Eligible text that is not computable leaves this rule notApplicable rather than cantTell: reporting that uncertainty belongs to contrast-computable, so the two never report the same text twice.

**Expectation.** Every computable text node reaches the ratio SC 1.4.3 requires for its size: 3:1 for large text, 4.5:1 for everything else. Text is large at 24px or more, or at 14pt (about 18.667px) or more when the computed font weight is 700 or higher.

### `css-focus-indicator-suppressed`

**Focus indicator must not be removed without a replacement**

manual · WCAG 2.4.7 (AA) · confidence medium · default severity serious

Flags elements in the tab order whose focus outline is removed by a :focus/:focus-visible rule with no replacement indicator (border, box-shadow, background, ...) in any other focus rule matching them.

**Applies to.** Elements in sequential focus navigation (tabbable and rendered) on a page whose accessible stylesheets contain at least one `:focus` or `:focus-visible` rule. With no focus rule anywhere, every element keeps the user agent's own indicator and there is nothing to check.

**Expectation.** No element is matched by a `:focus`/`:focus-visible` rule that removes the outline (`outline: none`, `outline: 0`, `outline-color: transparent`, ...) unless some other focus rule matching it draws a replacement — a border, box-shadow, background, color change, a positive outline of its own, or a `::before`/`::after` decoration.

### `css-hidden-focus`

**Focusable elements must not be visually hidden**

manual · WCAG 2.4.7 (AA) · confidence low · default severity serious

Checks that keyboard-focusable elements are not visually hidden by CSS techniques that can leave them in the tab order.

**Applies to.** Applies to elements that are tabbable (keyboard-focusable) but are visually hidden via CSS techniques that can leave them in the tab order.

**Expectation.**

No element should be tabbable while visually hidden (e.g., opacity:0, clipped, off-screen). Notes:

- This rule intentionally targets CSS techniques that *can* keep an element focusable.
- Elements removed from rendering (display:none, visibility:hidden, [hidden]) are excluded.
- The rule uses deterministic heuristics (computed style parsing) and does not rely on layout geometry.

### `css-orientation-lock`

**CSS must not lock the page to a single orientation**

automatic · WCAG 1.3.4 (AA) · confidence high · default severity serious

Checks that no @media (orientation: portrait|landscape) rule sets a transform: rotate(...) on the page, a known technique for defeating device orientation.

**Applies to.** Any accessible (same-document, non-cross-origin) stylesheet — inline `&lt;style&gt;` blocks and same-origin `&lt;link&gt;` stylesheets already loaded into `document.styleSheets`.

**Expectation.** No `@media (orientation: portrait)` or `@media (orientation: landscape)` block sets a `transform`/`-webkit-transform`/`rotate` rotation of approximately 90 degrees (mod 180, i.e. ~90 or ~270) — the well-known technique for visually forcing one orientation regardless of the device's actual orientation, which defeats WCAG 1.3.4's requirement that content not restrict its view to a single display orientation unless that orientation is essential.

### `definition-list-children-valid`

**Description lists must be structured correctly**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;dl&gt; elements only directly contain &lt;dt&gt;/&lt;dd&gt; groups (optionally wrapped in one &lt;div&gt;), &lt;script&gt;, &lt;template&gt;, or &lt;style&gt;.

**Applies to.** Applies to &lt;dl&gt; elements that have at least one direct element child.

**Expectation.** Every direct element child is &lt;dt&gt;, &lt;dd&gt;, &lt;script&gt;, &lt;template&gt;, &lt;style&gt;, or a &lt;div&gt; whose own children are drawn from that same set (a single level of wrapping div is allowed, matching how authors commonly group dt/dd pairs). If the flattened set contains any &lt;dt&gt; or &lt;dd&gt; at all, it must contain BOTH (an unbalanced dt-without-dd or dd-without-dt is invalid) — a flattened set with neither is vacuously fine, not a violation (see implementation-notes). Any other direct or wrapped child breaks the description-list semantics assistive technologies rely on.

### `deprecated-elements-not-used`

**Obsolete non-stoppable elements (&lt;blink&gt;, &lt;marquee&gt;) must not be used**

automatic · WCAG 2.2.2 (A) · confidence high · default severity serious

Checks that deprecated, non-standard HTML elements whose blinking/scrolling content cannot be paused, stopped, or hidden by the user (&lt;blink&gt;, &lt;marquee&gt;) are not present.

**Applies to.** Applies to any &lt;blink&gt; or &lt;marquee&gt; element present in scope. These are obsolete, non-standard HTML elements whose defining behavior (blinking or auto-scrolling text) has no built-in user mechanism to pause, stop, or hide it.

**Expectation.** Neither element is present. Since their movement can never be paused, stopped, or hidden by the user, presence is itself the violation — this rule has no partial-pass case (it reports only when the element is found).

### `dialog-name-present`

**Dialogs have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="dialog" or role="alertdialog" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="dialog" or role="alertdialog" (the attribute must name one of those roles alone, not a fallback list) that are included in the accessibility tree. A native &lt;dialog&gt; without an explicit role is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. Both roles are name-from-author-only, so the heading or body text inside the dialog is not accepted as its name unless aria-labelledby points at it.

### `dlitem-parent-valid`

**Description-list items must be inside a description list**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;dt&gt;/&lt;dd&gt; elements are contained by a &lt;dl&gt;, directly or via one wrapping &lt;div&gt;.

**Applies to.** Applies to &lt;dt&gt;/&lt;dd&gt; elements that have a parent element.

**Expectation.** The parent is &lt;dl&gt;, or the parent is a &lt;div&gt; whose own parent is &lt;dl&gt; (a single level of wrapping div is allowed, matching how authors commonly group dt/dd pairs). A &lt;dt&gt;/&lt;dd&gt; used outside a real description-list container is not exposed as a term/definition to assistive technologies.

### `duplicate-id`

**IDs must be unique**

automatic · WCAG 4.1.1 (A) · confidence high · default severity moderate

Checks that every non-empty id attribute value is unique within its own document or shadow tree (WCAG 2.0/2.1 SC 4.1.1, removed in WCAG 2.2).

**Applies to.** Applies to any element carrying a non-empty id attribute. Visibility is irrelevant — a duplicate id breaks the same lookups whether the element renders or not, which is why ACT 3ea0c8 evaluates hidden elements too.

**Expectation.** No other element in the same tree carries the same id value. Ids are scoped per document tree and per shadow tree, so the same id inside two different shadow roots is not a duplicate.

### `duplicate-id-aria`

**IDs referenced by ARIA must be unique**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that any id value referenced by an ARIA ID-reference attribute (aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-activedescendant, aria-flowto, aria-errormessage, aria-details) is unique in the document.

**Applies to.** Applies when the document contains at least one non-empty aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-activedescendant, aria-flowto, aria-errormessage, or aria-details attribute (i.e. at least one ARIA ID reference exists to resolve).

**Expectation.** For every id value referenced by one of those attributes, exactly one element in the document carries that id. A duplicate does not break the reference: it resolves to the first element in tree order, so the name is still computed. Whether that element is the intended target depends on author intent, which markup does not carry, so the outcome is cantTell.

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

### `empty-heading`

**Headings must not be empty**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that heading elements (&lt;h1&gt;-&lt;h6&gt; or role="heading") have a non-empty accessible name.

**Applies to.** Applies to elements with a heading role: native &lt;h1&gt;-&lt;h6&gt;, or any element with explicit role="heading" (unless overridden by another explicit role).

**Expectation.** The heading has a non-empty accessible name: aria-label, aria-labelledby, visible text content not hidden from assistive technology, or (as a last resort) a title attribute. An empty heading is announced as "heading, level N" with nothing else, which is confusing when navigating by heading.

### `empty-table-header`

**Table header cells must not be empty**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that &lt;th&gt; elements have visible text content — a header named only via aria-label/aria-labelledby is also flagged, since real screen-reader/browser support for that is inconsistent.

**Applies to.** Applies to &lt;th&gt; elements that don't carry a conflicting explicit role, plus any element (native &lt;th&gt; or not) with role="columnheader" or role="rowheader" (`th:not([role]), [role="columnheader"], [role="rowheader"]`): a &lt;th&gt; that explicitly restates role="columnheader"/"rowheader" is still covered via the second clause, but a &lt;th role="presentation"&gt; (no longer meaningfully a header) is correctly excluded, and an ARIA-role-only header (e.g. a &lt;div role="columnheader"&gt; in a role="grid"/role="table" widget) is caught too.

**Expectation.** The header cell has visible text content. A &lt;th&gt; named only via aria-label/aria-labelledby (no visible text) is ALSO flagged, not treated as equivalent — aria-label support on &lt;th&gt; is genuinely inconsistent in practice: NVDA+Firefox and iOS VoiceOver+Safari ignore it entirely (only visible text is announced), JAWS+Chrome/IE11 also only announce visible text in the header cell itself. Visible text is the one mechanism confirmed to work across every tested combination. See https://html5accessibility.com/stuff/2024/05/22/not-so-short-note-on-aria-label-usage-big-table-edition/.

### `focus-order-semantics`

**Elements added to the tab order should have interactive semantics**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Flags elements with tabindex &gt;= 0 whose explicit role is a non-interactive structural/document role (e.g. heading, list, region, presentation), for manual review.

**Applies to.** Elements with an explicit `tabindex` of `0` or greater (in the tab order) AND an explicit `role` attribute that is one of a curated set of clearly non-interactive, structural/document roles.

**Expectation.** An element deliberately placed in the tab order should communicate why it's focusable — a role like `heading`, `list`, `region`, or `presentation` gives assistive technology no interactive semantic to announce, which is confusing for keyboard users who land on it and get no indication of what activating it (if anything) would do.

### `form-control-label-quality`

**Form field labels should be descriptive and distinguishable**

manual · WCAG 2.4.6 (AA) · confidence medium · default severity minor

Flags a visible form-field label that is a placeholder ("Label", "Field"), or that repeats another field's label with no visible context — heading, legend, or row — telling the two apart.

**Applies to.** Visible form fields — native `input` (excluding hidden and the button-like types), `select`, `textarea`, or an element with one of the ARIA widget roles ACT cc0f0a lists (checkbox, combobox, listbox, menuitemcheckbox, menuitemradio, radio, searchbox, slider, spinbutton, switch, textbox) — that carry a visible programmatic label: a `&lt;label&gt;` association, or the elements `aria-labelledby` points at. A field named only by `aria-label`/`title` has no visible label to judge and is out of scope here (its labelling mechanism is `form-control-programmatic-label-quality`'s concern, its presence `form-control-programmatic-label-present`'s).

**Expectation.** The visible label text (a) is not a placeholder left in the markup ("label", "field", "enter text", ...), (b) is not shared with another field that no visible context tells apart — the same "Name" twice, with nothing visible on screen saying which is shipping and which is billing — and (c) is the whole of the field's programmatic label, not the visible fragment of a label whose descriptive part is hidden.

### `form-control-programmatic-label-present`

**Form controls must have a programmatic label**

automatic · WCAG 1.3.1, 3.3.2, 4.1.2 (A) · confidence medium · default severity serious

Checks that form controls have a programmatic label via &lt;label&gt;, aria-label, or aria-labelledby.

**Applies to.** Applies to &lt;input&gt;, &lt;select&gt; and &lt;textarea&gt; elements included in the accessibility tree, excluding the input types hidden, submit, reset, button and image, which take their name from a value or alt attribute rather than from a label. A control carrying an explicit ARIA widget role is out of scope — button, checkbox, combobox, listbox, textbox, slider and the rest of ROLE_OWNED_ELSEWHERE each have a naming rule of their own — and role="presentation"/"none" removes a control unless it is still tabbable.

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

### `form-control-single-label`

**Form controls must not have multiple labels**

automatic · WCAG 3.3.2 (A) · confidence high · default severity moderate

Checks that a form control is associated with at most one &lt;label&gt; (by wrapping or by label[for]).

**Applies to.** Applies to labelable form controls (input, excluding hidden/submit/reset/button/image; select; textarea).

**Expectation.**

At most one &lt;label&gt; that can contribute to the control's accessible name is associated with it — by wrapping it, or by a &lt;label for="..."&gt; on its id (a label that both wraps and self-references via for counts once). Graded by whether the surplus labels actually compete for the name:

- PASS when an override (aria-labelledby / aria-label) supersedes every native &lt;label&gt;: the labels then contribute nothing to the name, so they cannot be ambiguous. A visible-label-vs-name mismatch is SC 2.5.3 Label in Name's concern, not this rule's.
- FAIL when two or more non-empty labels compete and there is no override: screen readers announce a non-deterministic subset.
- CANTTELL when one non-empty label is joined by empty label association(s) and there is no override: the name usually resolves to the real label, but handling of the empty association is not guaranteed across user agents.

All-empty associations with no override are a missing-name case (the sibling rule below), not an ambiguity, so this rule stays silent.

### `heading-order`

**Heading levels must not skip a level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that heading levels increase by at most one at a time in document order.

**Applies to.** Applies whenever the page contains two or more heading elements (native &lt;h1&gt;-&lt;h6&gt;, or explicit role="heading" with aria-level — default level 2 per the ARIA spec when aria-level is absent/invalid).

**Expectation.** In document order, each heading's level is no more than one greater than the highest heading level seen so far. Jumping deeper by more than one level (e.g. an &lt;h1&gt; followed directly by an &lt;h3&gt;, skipping &lt;h2&gt;) breaks the document outline assistive technology users rely on when navigating by heading. Going back to a shallower level at any point is always fine.

### `heading-quality`

**Heading text should be descriptive, not a placeholder**

manual · WCAG 2.4.6 (AA) · confidence medium · default severity minor

Flags headings whose accessible name is a placeholder rather than a description of the content that follows: a generic word ("Heading", "Untitled"), a numbered template slot ("Section 2"), a filename, or a URL.

**Applies to.** Elements with a heading role — native &lt;h1&gt;-&lt;h6&gt;, or any element with an explicit role="heading" — that are included in the accessibility tree and have a non-empty accessible name. A heading with no name at all is `empty-heading`'s concern, not this rule's.

**Expectation.** The heading's accessible name, normalized (whitespace-collapsed, case-folded, trailing punctuation stripped), is not a placeholder left in the markup: a known generic word ("heading", "title", "untitled", "lorem ipsum", ...), a numbered template slot ("Heading 2", "Section 3"), a filename, or a URL. None of these describe the topic or purpose of the content they introduce.

### `html-lang-attr-present`

**Page language is declared**

automatic · WCAG 3.1.1 (A) · confidence high · default severity serious

Checks that the default language of the page is programmatically declared.

**Applies to.** Applies to HTML documents with a root &lt;html&gt; element. The rule evaluates the document element only and does not iterate over child nodes. Non-HTML documents or documents without a document element are not applicable.

**Expectation.** The &lt;html&gt; element has a lang attribute. The lang attribute is not empty and contains a syntactically valid language tag.

### `html-xml-lang-mismatch`

**lang and xml:lang must not disagree**

automatic · WCAG 3.1.1 (A) · confidence high · default severity serious

Checks that the &lt;html&gt; element's lang and xml:lang attributes declare the same primary language, when both are present.

**Applies to.** Applies when the &lt;html&gt; element has both a non-empty lang attribute and a non-empty xml:lang attribute.

**Expectation.** The primary language subtag (the part before the first "-") of lang and xml:lang match, case-insensitively. When both attributes are present but declare different languages, assistive technology and user agents may resolve the page's language inconsistently.

### `identical-links-same-purpose`

**Links with the same accessible name should lead to the same destination**

manual · WCAG 2.4.9 (AAA) · confidence low · default severity minor

Flags groups of links that share the same accessible name but resolve to more than one distinct destination, for manual review of whether they serve the same purpose.

**Applies to.** Any `a[href]` with a non-empty accessible name, grouped by that name (trimmed, whitespace-collapsed, case-folded).

**Expectation.** Within a page, links that share the same accessible name are expected to serve the same purpose (i.e. resolve to the same destination — the full resolved URL, including any fragment). Same-text-different- destination links are common and frequently intentional in real sites (e.g. repeated "Read more" links per article card), so this is authored as `type: 'manual'` (cantTell-capped, never fail) rather than a hard fail — flagging a real name/destination mismatch for human judgment instead of guessing intent.

### `iframe-focusable-content`

**Frames with tabindex="-1" must not contain focusable content**

automatic · WCAG 2.1.1 (A) · confidence high · default severity moderate

Checks that same-origin &lt;iframe&gt;/&lt;frame&gt; elements with tabindex="-1" do not contain focusable content, since browsers do not propagate that restriction into the frame’s embedded document.

**Applies to.** Applies to &lt;iframe&gt;/&lt;frame&gt; elements with an explicit negative tabindex, whose embedded document is same-origin and reachable via contentDocument (cross-origin/unreachable frames assert nothing — see implementation notes).

**Expectation.** The frame's embedded document contains no focusable element. Browsers do not propagate tabindex="-1" on the host &lt;iframe&gt; into its embedded document: Tab can still reach focusable content inside, even though the frame itself is skipped. An author who set tabindex="-1" intending to remove the frame from the tab order has not actually done so if the embedded document contains focusable content.

### `iframe-name-present`

**Frames have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that &lt;iframe&gt;/&lt;frame&gt; elements expose a non-empty accessible name via aria-label, aria-labelledby, or the title attribute.

**Applies to.** Applies to &lt;iframe&gt;/&lt;frame&gt; elements that are eligible for the accessibility tree (isAccTreeEligible) and are not marked as decorative with role="none"/"presentation".

**Expectation.** The element has a non-empty accessible name via aria-labelledby, aria-label, or the title attribute. Unlike most interactive elements, an iframe's name is never derived from its rendered content (the embedded document is a separate browsing context) — this mirrors dialog-name-present's "name-from-author-only" reasoning.

### `iframe-title-unique`

**Frame titles must be unique**

automatic · WCAG 4.1.2 (A) · confidence high · default severity moderate

Checks that no two &lt;iframe&gt;/&lt;frame&gt; elements in scope share the same title attribute value.

**Applies to.** Applies to &lt;iframe&gt;/&lt;frame&gt; elements that carry a non-empty title attribute.

**Expectation.** No two frames in scope share the same (trimmed, case-sensitive) title attribute value — a duplicate title prevents assistive technology users from telling frames apart when scanning by name.

### `image-redundant-alt`

**Image alt text must not duplicate adjacent visible text**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that an &lt;img&gt; alt text is not identical to other visible text already present in its immediate parent element.

**Applies to.** Applies to &lt;img&gt; elements with non-empty alt text whose immediate parent element also has other visible text content (i.e. text nodes besides the image itself — commonly an &lt;a&gt; or &lt;button&gt; wrapping both an icon image and a text label).

**Expectation.** The image's alt text is not the same (case-insensitive, normalized) as the other visible text already in the same parent. When both are present, assistive technology announces the same words twice for a single control (e.g. an icon-plus-text link where the icon's alt duplicates the link text).

### `img-alt-decorative`

**&lt;img&gt; with alt="" must be decorative (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;img&gt; elements with empty alt for human review that they are purely decorative.

**Applies to.** Applies to &lt;img&gt; elements whose alt attribute is present but empty once trimmed — alt="" and its whitespace-only variants, the markup that declares an image decorative. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

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

**Expectation.** Each applicable &lt;input type="image"&gt; element has an alt attribute, and its accessible name is not the browser default for an image button. The alt attribute may be empty (alt="").

### `input-image-alt-quality`

**&lt;input type="image"&gt; alt text must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags &lt;input type="image"&gt; elements with non-empty alt text for human review of appropriateness.

**Applies to.** Applies to &lt;input type="image"&gt; elements whose alt attribute is present and non-empty — an image button whose alt is its label. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

### `label-in-name`

**Label in Name: accessible name contains visible text**

automatic · WCAG 2.5.3 (A) · confidence high · default severity serious

Checks that when a control has a visible text label, the accessible name contains that visible label text (WCAG 2.5.3).

**Applies to.** Applies to controls that carry aria-label or aria-labelledby, are visually rendered, and have visible label text this engine can extract deterministically — from an associated &lt;label&gt;, from the control's own rendered text, or from the elements aria-labelledby points at. The candidates are &lt;button&gt;, &lt;a href&gt;, &lt;summary&gt;, non-hidden form controls, and the button, link, checkbox, radio, switch, searchbox, tab, menuitem, menuitemcheckbox, menuitemradio, option, treeitem and gridcell roles, minus anything hidden or disabled. aria-hidden is deliberately not excluded: it changes nothing about what is rendered on screen, which is what this SC is about.

**Expectation.** The accessible name contains the visible label's words, adjacent and in order. The comparison is over words rather than characters: parenthesised text is dropped, case is folded, text is NFKD-normalised, and every non-letter/digit becomes a separator, so punctuation and spacing differences never decide the outcome. Two shapes markup cannot settle are reported as cantTell instead of fail — a word hyphenated differently in the two places, and a visible word the author may have abbreviated, marked by its trailing period.

### `label-title-only`

**Form controls should not use title as their only label**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that a form control with a title attribute also has a real label (label element, aria-label, or aria-labelledby).

**Applies to.** Applies to labelable form controls (input, excluding hidden/submit/reset/button/image; select; textarea) that have a non-empty title attribute.

**Expectation.** The control also has a real label — a wrapping/associated &lt;label&gt;, aria-label, or aria-labelledby — rather than depending on the title attribute alone. A title-only tooltip is not reliably exposed by all assistive technology and is not visible at all until hover/focus, unlike a persistent visible label.

### `landmark-banner-is-top-level`

**Banner landmark must be top-level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the banner landmark (role="banner" or a non-nested &lt;header&gt;) is not nested inside another landmark region.

**Applies to.** Applies whenever the page contains at least one banner candidate: explicit role="banner", OR a &lt;header&gt; with NO role attribute at all, regardless of nesting (see implementation notes on why candidate selection is deliberately unconditional).

**Expectation.** No banner candidate has an ancestor that is itself any landmark region. A banner nested inside another landmark is not a top-level, whole-page banner and confuses landmark-based navigation for assistive technology users.

### `landmark-contentinfo-is-top-level`

**Contentinfo landmark must be top-level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the contentinfo landmark (role="contentinfo" or a non-nested &lt;footer&gt;) is not nested inside another landmark region.

**Applies to.** Applies whenever the page contains at least one contentinfo candidate: explicit role="contentinfo", OR a &lt;footer&gt; with NO role attribute at all, regardless of nesting (see implementation notes on why candidate selection is deliberately unconditional).

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

**Applies to.** Applies whenever the page contains at least one banner landmark (explicit role="banner", or an implicit, non-nested &lt;header&gt; — see landmark-banner-is-top-level's implementation notes for the shared landmark-detection model).

**Expectation.** At most one banner landmark exists on the page. Per WAI-ARIA Authoring Practices, the banner landmark represents site-oriented content that identifies the page as a whole — having more than one is ambiguous for assistive technology users navigating by landmark.

### `landmark-no-duplicate-contentinfo`

**Page must not have more than one contentinfo landmark**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that at most one contentinfo landmark (role="contentinfo" or a non-nested &lt;footer&gt;) exists on the page.

**Applies to.** Applies whenever the page contains at least one contentinfo landmark (explicit role="contentinfo", or an implicit, non-nested &lt;footer&gt;).

**Expectation.** At most one contentinfo landmark exists on the page — mirrors landmark-no-duplicate-banner's rationale for contentinfo.

### `landmark-no-duplicate-main`

**Page must not have more than one main landmark**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that at most one main landmark (role="main" or &lt;main&gt;) exists on the page.

**Applies to.** Applies whenever the page contains at least one main landmark (explicit role="main", or an implicit &lt;main&gt;).

**Expectation.** At most one main landmark exists on the page. Distinct, atomic decision from landmark-one-main (that rule flags zero mains too; this one only flags more than one).

### `landmark-one-main`

**Page should have a main landmark**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the page has at least one main landmark (role="main" or &lt;main&gt;).

**Applies to.** Always applicable to any HTML document with a &lt;body&gt; element — "does the page have a main landmark" is a whole-page concern, matching bypass-blocks-present's pattern of evaluating the document directly.

**Expectation.** At least one main landmark (role="main" or &lt;main&gt;), exposed to assistive technology, exists on the page — a page with none gives AT users no landmark to jump straight to for the primary content.

### `landmark-unique`

**Landmarks with the same role must have unique names**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that when two or more landmarks share the same role, each has a distinct accessible name.

**Applies to.** Applies whenever two or more landmark regions on the page share the same landmark role (banner, contentinfo, main, navigation, complementary, region, form, or search — see implementation notes for the detection model).

**Expectation.** Among landmarks sharing a role, each has a distinct accessible name (via aria-label/aria-labelledby — landmarks are not named from content). Two same-role landmarks with the same name (including two both left unnamed) are indistinguishable to assistive technology users navigating by landmark.

### `link-in-text-block`

**Links in text blocks must be distinguishable from surrounding text without relying on color alone**

automatic · WCAG 1.4.1 (A) · confidence high · default severity serious

Checks that a link inside a run of text is visually distinguishable from the surrounding text by underline, a font-weight/style difference, or a sufficient (&gt;=3:1) color-contrast difference — not by color alone.

**Applies to.** Applies to &lt;a href&gt; elements whose immediate parent element also has at least one direct-child text node with non-whitespace content (i.e. the link sits inline within a run of plain text, not as a standalone item — e.g. not the sole content of a &lt;li&gt; nav item).

**Expectation.**

A link inside a text block must be visually distinguishable from the surrounding text by at least one non-color means:

- text-decoration: underline, OR
- a different font-weight than the surrounding text, OR
- a different font-style than the surrounding text, OR
- a contrast ratio of at least 3:1 between the link's text color and the surrounding text's color (WCAG technique G183's threshold — sufficient contrast alone is an accepted alternative to underline).

Fails only when none of the above hold AND the color contrast between link and surrounding text is confidently computable and below 3:1 — i.e. color is demonstrably the only cue.

### `link-name-present`

**Links have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that links expose a non-empty accessible name.

**Applies to.** Applies to &lt;a href&gt;, &lt;area href&gt; and elements with role="link" that are included in the accessibility tree. An &lt;a&gt; without an href is not a link and is not matched.

**Expectation.** The element has a non-empty accessible name. A programmatic name is taken first (aria-labelledby, aria-label, an associated &lt;label&gt;, title), and failing that the element falls back to its own subtree text, counting each descendant's own name (an &lt;img alt&gt;, aria-label or title) — the shape behind the common &lt;a&gt;&lt;img alt="..."&gt;&lt;/a&gt; logo link. The content fallback is suppressed when an explicit, known role that is not name-from-content is present; an unrecognized role token falls back to the implicit role.

### `link-name-quality`

**Link text should be descriptive, not generic**

manual · WCAG 2.4.4 (A) · confidence medium · default severity minor

Flags links whose full accessible name is a known non-descriptive phrase (e.g. "click here", "read more", "more"), for manual review of whether the purpose is clear without additional context.

**Applies to.** Elements matching `a[href], area[href], [role="link"]` with a non-empty computed accessible name (programmatic first, then "name from content" — same two-step resolution as `link-name-present`, same selector too). Links with no name at all are `link-name-present`'s concern, not this rule's.

**Expectation.** The link's full accessible name, normalized (trimmed, case-folded, trailing punctuation stripped), is not an exact match for a known non-descriptive phrase ("click here", "read more", "more", "here", "details", "link", etc.) — WCAG technique F84's known failure pattern for SC 2.4.4.

### `list-children-valid`

**Lists must only directly contain list items**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;ul&gt;/&lt;ol&gt; elements only have &lt;li&gt;, &lt;script&gt;, or &lt;template&gt; as direct children.

**Applies to.** Applies to &lt;ul&gt;/&lt;ol&gt; elements that have at least one direct element child.

**Expectation.** Every direct element child is &lt;li&gt;, &lt;script&gt;, or &lt;template&gt; — UNLESS it has an explicit `role` attribute, in which case the explicit role wins over the tag entirely: a child is valid iff that role is "listitem" (so `&lt;li role="presentation"&gt;`/`&lt;li role="menuitem"&gt;` are invalid despite the &lt;li&gt; tag, and conversely a non-&lt;li&gt; element explicitly given `role="listitem"` is valid). A wrapper &lt;div&gt; used for styling (no role at all) still breaks list semantics the same as before.

### `listbox-name-present`

**Listboxes have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="listbox" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="listbox" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="listbox" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom listbox widget is not reliably exposed as its name. On a labelable element (&lt;select multiple role="listbox"&gt;) an associated &lt;label&gt; counts as well.

### `listitem-parent-valid`

**List items must be inside a list container**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;li&gt; elements are contained by &lt;ul&gt;, &lt;ol&gt;, or an element with role="list".

**Applies to.** Applies to &lt;li&gt; elements that have a parent element.

**Expectation.** The parent is &lt;ul&gt;/&lt;ol&gt; with no role override, or an element with an explicit role of "list", "presentation", or "none". An &lt;li&gt; used outside a real list container (e.g. as a generic flex/grid item under a &lt;div&gt;) is not exposed as a list item to assistive technologies.

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

### `menuitem-name-present`

**Menu items have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that menu items (role="menuitem*", including checkbox/radio variants) expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="menuitem", role="menuitemcheckbox" or role="menuitemradio" (the attribute must name one of those roles alone, not a fallback list) that are included in the accessibility tree.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or — all three roles being name-from-content — from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

### `meta-refresh-no-exceptions`

**Page must not use a meta refresh at all (AAA)**

automatic · WCAG 2.2.4, 3.2.5 (AAA) · confidence high · default severity moderate

Checks that &lt;meta http-equiv="refresh"&gt; is not present at all, regardless of delay — the stricter AAA-level counterpart of the A-level positive-delay-only check.

**Applies to.** Applies to the first &lt;meta http-equiv="refresh"&gt; element, in document order, with a valid content attribute — per HTML's shared declarative refresh steps, a document only ever acts on its first valid meta refresh, so a later one (valid or not) is inert and out of scope.

**Expectation.** Running the shared declarative refresh steps against that element's content value results in a delay of exactly 0. An immediate (delay=0) redirect still passes at AAA, same as the A-level rule — there is nothing for a user to be interrupted mid-read by when nothing is displayed first. Any positive delay fails, with none of the A-level rule's &gt;20-hour exemption: at AAA, WCAG 2.2.4 (Interruptions) and 3.2.5 (Change on Request) require that a *timed* automatic context change happen only at the user's request, regardless of how long the timer is.

### `meta-refresh-timing-absent`

**Page must not use a timed meta refresh**

automatic · WCAG 2.2.1 (A) · confidence high · default severity serious

Checks that &lt;meta http-equiv="refresh"&gt; does not impose a positive delay of 20 hours or less.

**Applies to.** Applies to the first &lt;meta http-equiv="refresh"&gt; element, in document order, whose content attribute has a parseable leading delay value. Per HTML's shared declarative refresh steps, a document only ever acts on its first valid meta refresh; any later one (valid or not) is inert markup a browser never processes, so it is not evaluated.

**Expectation.** The delay is 0 (an immediate redirect, which users cannot be caught by mid-read), or exceeds 20 hours. Any other positive delay refreshes or redirects the page on a timer the user did not initiate and cannot pause, stop, or extend, which WCAG 2.2.1 (Timing Adjustable) requires be possible.

### `meta-viewport-large`

**Viewport meta tag should allow zooming up to 500%**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that &lt;meta name="viewport"&gt; does not set user-scalable=no or maximum-scale below 5 (500%).

**Applies to.** Applies to &lt;meta name="viewport"&gt; elements that carry a non-empty content attribute.

**Expectation.** The content attribute does not set user-scalable to "no"/"0", and does not set maximum-scale below 5 (500%). This is the AAA-level, stricter counterpart of meta-viewport-zoom-enabled (which enforces the AA 200% minimum as a hard, WCAG-normative fail); this rule is advisory best-practice guidance toward the higher AAA bar.

### `meta-viewport-zoom-enabled`

**Viewport meta tag must not disable zoom**

automatic · WCAG 1.4.4 (AA) · confidence high · default severity serious

Checks that &lt;meta name="viewport"&gt; does not set user-scalable=no or maximum-scale below 2 (200%).

**Applies to.** Applies to &lt;meta name="viewport"&gt; elements whose content attribute sets maximum-scale or user-scalable. Content setting neither cannot restrict zoom.

**Expectation.** user-scalable is absent, yes, device-width, device-height, or a number outside the range -1 to 1; and maximum-scale is absent, device-width, device-height, negative, or 2 or more. Anything else stops the user zooming text to 200%, which WCAG 1.4.4 (Resize Text) requires.

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

**Expectation.** The element also carries at least one keyboard-reachable inline handler: `onkeydown`, `onkeyup`, `onkeypress` (the direct keyboard- event equivalents), or `onfocus`/`onblur` (the standard substitute for hover-triggered behavior — focus/blur are the keyboard- navigable analog to mouseover/mouseout, per WCAG technique G90). Otherwise the element's mouse-driven behavior (a hover tooltip, a custom dropdown, a drag interaction) has no way to be triggered by a keyboard-only user.

### `nested-interactive-controls-absent`

**Interactive controls must not be nested**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that an interactive control (link, button, form control, or ARIA widget role) does not contain another interactive control.

**Applies to.** Applies to elements matching the interactive-control set (native a[href], button, input (not hidden), select, textarea; or an explicit ARIA widget role: button, link, checkbox, radio, switch, tab, textbox, combobox, listbox, menuitem, menuitemcheckbox, menuitemradio, option, slider, spinbutton, searchbox, treeitem). The container is applicable regardless of whether it is itself focusable — focusability is only used to decide whether a *descendant* nests an interactive control.

**Expectation.** The element does not contain, as a descendant, another *operable* interactive control (e.g. a &lt;button&gt; wrapping a &lt;select&gt;, or a link containing a checkbox). Nested interactive controls are not reliably announced or operable via assistive technology — activating the outer control and the inner one become ambiguous, and some AT only exposes one of the two.

### `no-autoplay-audio`

**Autoplaying audio should provide a pause/stop or volume-control mechanism**

manual · WCAG 1.4.2 (A) · confidence low · default severity moderate

Flags &lt;audio&gt;/&lt;video&gt; elements that autoplay unmuted with no native controls attribute, for manual review against the 3-second exemption in WCAG 1.4.2.

**Applies to.** Any &lt;audio autoplay&gt; or &lt;video autoplay&gt; element that is not `muted`.

**Expectation.** SC 1.4.2 only applies when audio plays automatically for MORE than 3 seconds; clip duration is not knowable from static markup (jsdom does not decode media), so this rule cannot determine whether the SC even applies to a given element. It is deliberately authored as `type: 'manual'` (cantTell-capped, never fail) rather than guessing: an autoplaying unmuted element with no `controls` attribute (the native, statically-verifiable mechanism to pause/stop or adjust volume) is flagged for human review rather than treated as a deterministic violation.

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

### `option-name-present`

**Options have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="option" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="option" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or — role="option" being name-from-content — from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

### `p-as-heading`

**A &lt;p&gt; styled to look like a heading should probably be a real heading**

manual · WCAG 1.3.1 (A) · confidence low · default severity minor

Flags short &lt;p&gt; elements whose entire text is bold and rendered at &gt;=18px, for manual review of whether a real heading element should be used instead.

**Applies to.** `&lt;p&gt;` elements with short (&lt;=120 char), non-empty trimmed text content that is entirely bold (the `&lt;p&gt;`'s own computed `font-weight` &gt;= 700, OR its entire text is wrapped in a single `&lt;strong&gt;`/`&lt;b&gt;` child) and rendered at &gt;=18px.

**Expectation.** Text styled to visually read as a heading (bold, larger-than-body size, short) should be marked up with a real heading element (`&lt;h1&gt;`-`&lt;h6&gt;` or `role="heading"`) so its structural role is programmatically determinable — the same 1.3.1 concern as any other "structure conveyed through presentation only" issue.

### `page-has-heading-one`

**Page should have a level-one heading**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the page has at least one level-one heading (&lt;h1&gt; or role="heading" with aria-level="1").

**Applies to.** Always applicable to any HTML document with a &lt;body&gt; element — "does the page have an h1" is a whole-page concern, matching bypass-blocks-present's pattern of evaluating the document directly.

**Expectation.** At least one heading with level 1 exists (native &lt;h1&gt;, or role="heading" with aria-level="1"). A page with no top-level heading has no clear entry point for assistive technology users navigating by heading.

### `page-title-patterns`

**Page title patterns that may be insufficiently descriptive**

manual · WCAG 2.4.2 (A) · confidence medium · default severity minor

Identifies page title patterns that may indicate low descriptiveness, such as generic, duplicated, or overly templated titles. This rule provides review signals and does not fail automatically.

**Applies to.** Applies to a run over a whole document whose &lt;title&gt; resolves to non-empty text; a missing or empty title is page-title-present's failure, not a pattern to review. A run narrowed by contextSelector or by engineOptions.fragment is notApplicable, as is a title matching none of the patterns below.

**Expectation.** The title carries none of the conservative low-descriptiveness signals: one of the generic titles home, homepage, welcome, untitled, page or document; fewer than eight characters; or a template shape pairing a generic token with a brand, such as "Home | Brand". When the crawl.pageTitles probe supplies at least ten pages, cross-page signals are used instead: one title repeated across distinct URLs, or a prefix or suffix of twelve characters or more shared across the set. Every signal is reported as cantTell — whether a title describes its page is a judgment, so the rule never fails on a pattern alone.

### `page-title-present`

**Page has a non-empty title**

automatic · WCAG 2.4.2 (A) · confidence high · default severity serious

Checks that the page includes a non-empty &lt;title&gt; element that identifies the page.

**Applies to.** Applies to a run over a whole document. A run narrowed by contextSelector, or by engineOptions.fragment, is notApplicable: whether the page has a title is not a property any subtree can answer.

**Expectation.** The document has a &lt;title&gt; element, and document.title with whitespace collapsed is non-empty. The element is looked for anywhere in the document, not only inside &lt;head&gt;: a &lt;title&gt; the parser leaves outside &lt;head&gt; is still the document title in every browser. Whether that title describes the page is page-title-patterns' question.

### `presentation-role-conflict`

**Presentational role must not conflict with a global ARIA attribute or focusability**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that role="presentation"/"none" (including an &lt;img alt=""&gt; implicit presentation role) is not combined with a global ARIA attribute (aria-label, aria-hidden, aria-describedby, ...) or focusability (tabindex/native).

**Applies to.** Applies to elements with an explicit role="presentation" or role="none", OR an &lt;img alt=""&gt; carrying no explicit role of its own (empty alt gives an &lt;img&gt; an implicit presentation role per HTML-AAM, even with no explicit role attribute at all — `img[alt=''], [role="none"], [role="presentation"]`).

**Expectation.** The element does not also carry a WAI-ARIA *global* state/property (aria-label, aria-hidden, aria-describedby, aria-live, aria-current, ... — the full global-attribute set, not just the naming ones), AND is not focusable. Per the WAI-ARIA spec's Presentational Roles Conflict Resolution section, a presentational role is "restored" to the element's implicit semantic role when either condition holds — the presentation/none role silently stops working, contradicting the author's evident intent to hide the element from the accessibility tree.

### `presentational-children-focusable-absent`

**Roles with presentational children must not contain focusable content**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that an element whose role makes its children presentational (button, checkbox, img, option, radio, slider, switch, tab, ...) contains no descendant that takes a tab stop.

**Applies to.** Applies to elements whose semantic role is one of the WAI-ARIA roles defined as having presentational children (button, checkbox, img, menuitemcheckbox, menuitemradio, meter, option, progressbar, radio, scrollbar, separator, slider, switch, tab — plus doc-pagebreak and graphics-symbol from the DPUB-ARIA/Graphics-ARIA modules, which inherit the same trait). The role can be explicit (role="tab") or native (&lt;button&gt;, &lt;meter&gt;, &lt;progress&gt;, &lt;option&gt;).

**Expectation.** No descendant of the element is part of sequential focus navigation. The presentational-children mechanism removes every descendant from the accessibility tree, so a descendant that still takes a tab stop receives focus with no role and no name to announce.

### `progressbar-name-present`

**Progress bars have an accessible name**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that elements with role="progressbar" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="progressbar" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="progressbar" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom progressbar widget is not reliably exposed as its name.

### `region`

**Page content should be inside a landmark region**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that content under &lt;body&gt; is contained within a landmark region.

**Applies to.** Applies to any element under &lt;body&gt; that directly carries visible text (or other own content — see @implementation-notes) and is not itself a landmark, live region, dialog, button, &lt;svg&gt;, &lt;iframe&gt;/&lt;frame&gt;, or a resolvable skip-link.

**Expectation.** Every top-level piece of page content lives inside a landmark region (main, navigation, banner, contentinfo, complementary, region, form, search), so assistive technology users navigating by landmark do not miss content that was never placed inside one.

### `role-img-text-alternative-present`

**[role="img"] must have an accessible text alternative**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that elements with role="img" provide an accessible text alternative using aria-label, aria-labelledby, or a title attribute.

**Applies to.** Applies to elements with role="img" that are included in the accessibility tree (ACT 23a2a8's "programmatically hidden" exemption: display:none/visibility:hidden/aria-hidden="true" on the element or an ancestor, with no carve-out for focusable or IDREF-referenced elements — aria-hidden-focus and duplicate-id-aria own those separately).

**Expectation.**

Each applicable element with role="img" has an accessible text alternative:

- aria-label with a non-empty value; OR
- aria-labelledby referencing at least one existing element that contributes non-empty text; OR
- a non-empty title attribute (last-resort accessible-name source per HTML-AAM).

### `scope-attr-valid`

**scope attribute must have a valid value**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that scope="..." is one of row, col, rowgroup, or colgroup.

**Applies to.** Applies to elements with a non-empty scope attribute.

**Expectation.** The scope value is one of "row", "col", "rowgroup", or "colgroup" (case-insensitive). An invalid scope value is not recognized by assistive technology, silently losing the row/column header association it was meant to declare.

### `scrollable-region-focusable`

**Scrollable regions with no focusable content should be keyboard-focusable**

manual · WCAG 2.1.1, 2.1.3 (AAA) · confidence low · default severity moderate

Flags elements whose CSS declares overflow:auto/scroll, contain no focusable descendant, and are not themselves keyboard-focusable, for manual review of whether their content actually overflows and needs keyboard scroll access.

**Applies to.** Deliberately scoped to a fixed set of likely-to-scroll container tags (div, section, article, aside, main, nav, pre, table, blockquote, ul, ol, textarea) with computed `overflow-x`/`overflow-y` of `auto` or `scroll` — not every element on the page, to keep this deterministic and performant (same style of scope-down as `region`).

**Expectation.** A region whose CSS declares it may scroll (`auto`/`scroll`) should be reachable by keyboard: either it already contains a focusable descendant (a link, button, form control, or `tabindex`-bearing element a keyboard user could tab into and then use arrow keys to scroll from), or the region itself carries a non-negative `tabindex`.

### `searchbox-name-present`

**Searchboxes have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="searchbox" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="searchbox" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="searchbox" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom searchbox widget is not reliably exposed as its name. On a labelable element (&lt;input role="searchbox"&gt;) an associated &lt;label&gt; counts as well.

### `server-side-image-map-absent`

**Images must not use a server-side image map**

automatic · WCAG 2.1.1 (A) · confidence high · default severity serious

Checks that &lt;img&gt; elements do not carry the ismap attribute (server-side image maps have no keyboard-operable equivalent).

**Applies to.** Applies to &lt;img&gt; elements that carry an ismap attribute.

**Expectation.** The image does not use ismap at all. Server-side image maps depend on the browser sending click coordinates to the server, which has no keyboard-operable equivalent — there is no way to determine or expose individual clickable regions to assistive technology or keyboard users. Client-side image maps (&lt;map&gt;/&lt;area&gt;, each with real href/alt) are the accessible alternative and are not flagged by this rule.

### `skip-link`

**Skip link must have a resolvable, usable target**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that a "skip to ..." link's href fragment resolves to a real, currently usable element in the document.

**Applies to.** Applies to &lt;a href="#fragment"&gt; elements whose accessible name matches a common "skip to ..." / "jump to ..." authoring convention (case-insensitive "skip" or "jump to" in the name) — the recognizable pattern for a skip-navigation link, not every same-page anchor link on the page. "jump to" is included alongside "skip" since real skip links use both conventions (e.g. a "Jump to section" link, which a purely positional match would catch but a "skip"-only text pattern would miss). Text-pattern matching itself stays deliberate (see implementation-notes) — this only widens the known-convention list.

**Expectation.** The link's fragment resolves to a real element in the document (via a matching id, or a legacy &lt;a name="..."&gt;), and that target is currently usable (not hidden from the accessibility tree; and, when browser geometry is available, not zero-area/no-rects). A skip link whose target is missing or effectively unusable does not provide a reliable bypass destination.

### `slider-name-present`

**Sliders have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that sliders (input[type="range"] and role="slider") expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="slider" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope. A native &lt;input type="range"&gt; without the role belongs to form-control-programmatic-label-present.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="slider" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom slider widget is not reliably exposed as its name. On a labelable element (&lt;input role="slider"&gt;) an associated &lt;label&gt; counts as well.

### `spinbutton-name-present`

**Spinbuttons have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="spinbutton" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="spinbutton" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="spinbutton" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom spinbutton widget is not reliably exposed as its name. On a labelable element (&lt;input role="spinbutton"&gt;) an associated &lt;label&gt; counts as well.

### `summary-name-present`

**Summary elements have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that &lt;summary&gt; elements expose a non-empty accessible name.

**Applies to.** Applies to &lt;summary&gt; elements included in the accessibility tree, wherever they appear — a &lt;summary&gt; outside a &lt;details&gt; is still matched.

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

- role="img", role="graphics-symbol", or role="graphics-document" on the SVG root element itself (the WAI-ARIA Graphics Module roles, alongside img). Deliberately does NOT extend to arbitrary role="graphics-symbol" descendants nested inside an &lt;svg&gt; — this check's scope is the &lt;svg&gt; root only; a broader feature, not attempted here.
- aria-label / aria-labelledby present
- &lt;title&gt; or &lt;desc&gt; present (desc alone is an applicability signal only — see @expectation)
- focusable/tabbable (e.g., tabindex, native focusability)

Images with role="presentation" or role="none" are excluded only when they are not focusable. Elements otherwise hidden from the accessibility tree remain applicable if they are tabbable-focusable or referenced by IDREF relationships (per engine eligibility checks).

**Expectation.**

Each applicable &lt;svg&gt; element provides a text alternative via:

- non-empty &lt;title&gt; text, OR
- an ARIA name (aria-label / aria-labelledby).

A &lt;desc&gt; element alone does NOT satisfy this — per the SVG Accessibility API Mappings spec §7.1, &lt;desc&gt; only ever contributes to the accessible DESCRIPTION, never the accessible NAME. An &lt;svg&gt; with only a &lt;desc&gt; and no &lt;title&gt;/ARIA name is still "applicable" (desc signals authorial intent) but fails.

### `svg-text-alternative-quality`

**&lt;svg&gt; text alternative must be appropriate (manual review)**

manual · WCAG 1.1.1 (A) · confidence medium · default severity minor

Flags applicable &lt;svg&gt; graphics with a detected text alternative for human review of appropriateness.

**Applies to.** Applies to inline &lt;svg&gt; elements that already carry a text alternative: non-empty &lt;title&gt; or &lt;desc&gt; text, a non-empty aria-label, or an aria-labelledby that resolves to non-empty text. &lt;desc&gt; counts here as something to review even though it never contributes to the accessible name — that distinction is svg-text-alternative-present's. The element must be included in the accessibility tree, and role="presentation"/"none" takes it out of scope unless it is focusable, which restores its role.

**Expectation.** Human review is required to confirm that the provided text alternative is accurate and appropriate.

### `tab-name-present`

**Tabs have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="tab" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="tab" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or — role="tab" being name-from-content — from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

### `tabindex`

**tabindex should not be greater than 0**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that tabindex values are 0 or negative, not a positive number.

**Applies to.** Applies to elements with a tabindex attribute whose value parses as a valid integer.

**Expectation.** The tabindex value is 0 or negative. A positive tabindex reorders keyboard tab order explicitly, which is fragile to maintain as a page changes and usually indicates the natural DOM order should be fixed instead.

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

**Applies to.** `&lt;table&gt;` elements with no `&lt;caption&gt;` child, at least two rows, and a first row containing exactly one non-empty-text cell while at least one other row has more than one cell.

**Expectation.** A single lone cell in the first row, sitting above rows that clearly have multiple columns, strongly suggests the author is using it as a visual caption/title rather than as a real table cell. Structure conveyed only through this positional convention is not programmatically associated with the table the way a real `&lt;caption&gt;` element is (1.3.1).

### `table-headers-attr-valid`

**Table cell "headers" attribute must reference valid header cells**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that each id in a &lt;td&gt;/&lt;th&gt; headers attribute resolves to a &lt;th&gt; element within the same table (not missing, not a non-th element, not itself).

**Applies to.** Applies to &lt;td&gt;/&lt;th&gt; elements that carry a non-empty headers attribute, within a &lt;table&gt; whose semantic role is still table/grid/treegrid -- an explicit role of anything else (role="presentation"/"none", but also role="heading" or any other real role) replaces the native table semantics, leaving no table for headers to describe. Matches ACT a25f45's applicability.

**Expectation.** Every id token in the headers attribute resolves to an element that: (a) exists, (b) is a cell (&lt;td&gt; or &lt;th&gt;) of the same &lt;table&gt; as the referencing cell, and (c) is not the cell itself. A &lt;td&gt; serving as a header via role="columnheader"/"rowheader" is a valid target, same as a plain &lt;th&gt; -- ACT a25f45 does not require the native tag.

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

**Applies to.** Applies to &lt;button&gt;, &lt;summary&gt;, &lt;a href&gt;, &lt;area href&gt;, &lt;input&gt;, &lt;select&gt;, &lt;textarea&gt; and elements with role="button"/"link" that are pointer-reachable: rendered, not suppressed by pointer-events:none, and with a measurable box of non-zero size. Accessibility-tree exclusion is deliberately not a filter — an aria-hidden control is still a target a pointer can hit. &lt;area&gt; is matched but never actually evaluated, for the reason given below.

**Expectation.**

Each target is at least 24 by 24 CSS pixels, or meets one of the SC 2.5.8 exceptions this rule can establish from geometry: spacing (a 24px-diameter circle centred on the target reaches no unrelated target), the inline exception for a link inside a run of text, or user-agent sizing (an unstyled native checkbox or radio, detected by appearance not having been reset to none). An undersized target too close to a neighbour fails. Where an exception may apply but geometry cannot confirm it — two inline links in one run of text, or a target inside an SVG, canvas or image map that may be essential — the result is cantTell rather than a guess. Notes (engine intent):

- This rule is DOM-based and measures pointer hit regions available to sighted pointer users.
- Elements can be "pointer-operable" even if excluded from the accessibility tree (e.g. aria-hidden="true").
- Excludes targets that are not pointer-reachable due to rendering suppression (display:none, etc.), or pointer suppression (pointer-events:none), or zero geometry (e.g. scale(0) -&gt; zero rects).

WCAG 2.5.8 exceptions implemented, and how:

- Spacing: a 24px-diameter circle centered on an undersized target must not intersect another (unrelated) target's box or another undersized target's own circle. Two passes: a fast center-distance check (exact for undersized-vs-undersized; a reasonable proxy otherwise) and a 16-point perimeter sample via elementFromPoint as a more precise fallback for cases the distance check under-detects (e.g. a small target adjacent to a large, elongated neighbor). Ancestor/descendant relationships between the target and the "other" element are never treated as a conflict — see isRelated — since a nested-interactive shape (a small control inside its own wrapping link/button) is one visual region, not two independent targets; that pattern is nested-interactive-controls-absent's concern, not a spacing one.
- Inline: a link inside a text-block container passes outright (isInlineTextExceptionTarget). An inline link whose only spacing conflict is another inline link in the same run is reported as cantTell (isInlineLinkTarget) — the inline exception may cover it, but geometry can't confirm that.
- User Agent Control: an unstyled native checkbox/radio, detected via `appearance` not being reset to `none` (see isUserAgentSizedControl) — scoped narrowly to checkbox/radio specifically, not every form control, since those are the only types with unambiguous native rendering.
- Essential/Equivalent: only a narrow, high-confidence subset is asserted (SVG/canvas/map-embedded controls) — see isPlausiblyEssentialOrEquivalent; anything else defers to cantTell rather than guessing "essential" from a layout container.

Known, deliberately unimplemented gap: `&lt;area&gt;` (image-map hotspot) elements are not evaluated at all. `area[href]` is in CANDIDATE_SELECTOR for forward-compatibility, but it's currently a no-op: `&lt;area&gt;` has no CSS box of its own (`display: none` by the HTML spec's default UA stylesheet — verified, not a jsdom quirk), so `getBoundingClientRect()` always reports zero geometry and `isPointerReachable`'s existing `display:none` check rejects it before any size/exception logic runs. A real `&lt;area&gt;` hit-region is computed by the browser from its `shape`/ `coords` attributes against the associated `&lt;img&gt;`'s *rendered* size — an entirely different measurement path than every other candidate here. Implementing that properly (parsing `coords`, resolving the owning `&lt;img&gt;` via its `usemap`, accounting for the image's CSS-scaled render size) is a separate, larger feature, not attempted in this pass. This is an automatic, deterministic approximation intended to be:

- strict on clear failures,
- conservative when exceptions cannot be determined reliably.

### `td-has-header`

**Data cells in large tables must have an associated header**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that every &lt;td&gt; in a large, simple (no colspan/rowspan) table has an associated header — via a headers attribute, an implicit column &lt;th&gt; above it, or an implicit row &lt;th&gt; to its left.

**Applies to.** `&lt;table&gt;` elements with at least 4 rows and at least 4 columns (a "large" table, where implicit row/column header association is genuinely useful — small tables are usually self-evident), and with NO `colspan`/`rowspan` anywhere in the table.

**Expectation.**

Every `&lt;td&gt;` has an associated header, via one of:

- a non-empty `headers` attribute (trusted here; whether it resolves to real `&lt;th&gt;` ids is `table-headers-attr-valid`'s concern, not this rule's), OR
- an implicit column header: some `&lt;th&gt;` in the same column, in an earlier row, OR
- an implicit row header: some `&lt;th&gt;` earlier in the same row.

### `textbox-name-present`

**Textboxes have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="textbox" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="textbox" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="textbox" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom textbox widget is not reliably exposed as its name. On a labelable element (&lt;input role="textbox"&gt;) an associated &lt;label&gt; counts as well.

### `tooltip-name-present`

**Tooltips have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="tooltip" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="tooltip" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or — role="tooltip" being name-from-content — from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

### `treeitem-name-present`

**Tree items have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="treeitem" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="treeitem" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or — role="treeitem" being name-from-content — from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

### `valid-lang`

**Element lang attribute must be syntactically valid**

automatic · WCAG 3.1.2 (AA) · confidence high · default severity moderate

Checks that any element (other than the root &lt;html&gt;) with a non-empty lang attribute uses a syntactically valid language tag.

**Applies to.** Applies to any element other than the root &lt;html&gt; with a non-empty lang attribute.

**Expectation.** The lang value matches a valid BCP47 language-tag syntax. WCAG 3.1.2 (Language of Parts) requires that when a passage's language differs from the page's default, it is identified programmatically — an invalid tag fails to identify a real language at all.

### `video-caption`

**Prerecorded video should provide a captions track**

manual · WCAG 1.2.2 (A) · confidence low · default severity moderate

Flags &lt;video&gt; elements with no &lt;track kind="captions"|"subtitles"&gt; child, for manual review of whether the video has an audio track that needs captions.

**Applies to.** Any &lt;video&gt; element in the composed DOM.

**Expectation.** SC 1.2.2 requires captions for prerecorded synchronized media, but only when the video actually has an audio track that conveys information (a silent/decorative video needs none) — which cannot be verified from static markup alone (jsdom does not decode media). This rule is therefore `type: 'manual'` (cantTell-capped, never fail), matching the precedent set by `media-alternative-transcript-evidence` for the same class of "normatively mapped but not staticaly verifiable" gap. A &lt;video&gt; with a `&lt;track kind="captions"&gt;` (or `kind="subtitles"`, commonly used interchangeably in the wild even though captions and subtitles serve technically distinct purposes) whose `src` is non-empty is not flagged; everything else is flagged for human review.

### `video-poster-text-alternative-present`

**&lt;video&gt; poster must have a text alternative**

automatic · WCAG 1.1.1 (A) · confidence medium · default severity serious

Checks that &lt;video&gt; elements with a poster image provide a text alternative (accessible name).

**Applies to.** Applies to &lt;video&gt; elements that: 1) have a non-empty poster attribute, AND 2) are exposed to assistive technologies (per engine eligibility checks). Elements otherwise hidden from the accessibility tree remain applicable if they are tabbable or referenced by IDREF relationships (per eligibility checks). Videos with role="presentation" or role="none" are excluded only when they are not focusable.

**Expectation.**

Each applicable &lt;video&gt; element provides a text alternative for the poster image, via:

- an accessible name (aria-label / aria-labelledby / title).

Between-tag fallback content inside &lt;video&gt; is NOT accepted: it is only rendered by browsers that don't support &lt;video&gt;, so it is not reliably exposed to assistive technologies in practice. &lt;video&gt; is also not a labelable element, so native &lt;label for="..."&gt; associations are not accepted either.
