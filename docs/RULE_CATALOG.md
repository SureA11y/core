# Rule catalog

Generated from the compiled engine's own catalog (`getChecksCatalog()`/`getRulesCatalog()`) — run `node scripts/generate-rule-catalog.js` after `npm run build` to regenerate this file whenever rules change. Do not hand-edit.

**130 rules total: 78 automatic (WCAG-normative, can return `fail`), 52 manual (advisory/judgment-required, capped at `cantTell`). 106 carry at least one formal WCAG Success Criterion mapping.**

See [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md) for what `type`/`confidence`/`severity` mean on a scan result, and [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md) for how these roll up to an SC-level conformance claim. For WCAG-facet-level coverage-gap tracking (which parts of an SC are and aren't automatable yet), see `coverage/coverage-report.md` instead — that one is organized by facet, this one by rule.

## Automatic rules (78) — can return `fail`

| Rule ID | Title | WCAG SC | Level | Confidence | Default severity |
|---|---|---|---|---|---|
| `area-alt-present` | &lt;area&gt; must have an alt attribute | 1.1.1 | A | high | serious |
| `aria-allowed-attr` | aria-* attributes must be permitted for the element’s role | 4.1.2 | A | medium | moderate |
| `aria-allowed-role` | Explicit role must be permitted for its host element | 4.1.2 | A | high | moderate |
| `aria-braille-equivalent` | aria-braillelabel/aria-brailleroledescription must have a non-braille equivalent | 4.1.2 | A | high | serious |
| `aria-conditional-attr` | aria-errormessage requires aria-invalid to be set to a non-false value | 4.1.2 | A | high | serious |
| `aria-deprecated-role` | role attribute should not use a deprecated or author-discouraged ARIA role | 4.1.2 | A | high | moderate |
| `aria-hidden-body` | The document &lt;body&gt; must not be aria-hidden | 1.3.1, 4.1.2 | A | high | critical |
| `aria-hidden-focus` | ARIA hidden elements must not be focusable | 2.4.7, 4.1.2 | AA | high | serious |
| `aria-prohibited-attr` | ARIA naming attributes must not be used on roles that prohibit them | 4.1.2 | A | high | moderate |
| `aria-prohibited-children` | Container roles must not own a child with a disallowed role | 4.1.2 | A | medium | moderate |
| `aria-required-attr` | Roles with a required ARIA state/property must carry it | 4.1.2 | A | high | serious |
| `aria-required-children` | Container roles must own at least one required child role | 4.1.2 | A | medium | moderate |
| `aria-required-parent` | Roles requiring a specific context role must be in that context | 4.1.2 | A | medium | moderate |
| `aria-role-name-present` | ARIA widget/container roles have an accessible name | 4.1.2 | A | high | serious |
| `aria-roles-valid` | role attribute must be a valid, non-abstract ARIA role | 4.1.2 | A | high | serious |
| `aria-valid-attr` | aria-* attributes must be real, defined ARIA attributes | 4.1.2 | A | high | serious |
| `aria-valid-attr-value` | aria-* attribute values must match their declared type | 4.1.2 | A | high | serious |
| `autocomplete-valid` | autocomplete attribute must be a valid autofill value | 1.3.5 | AA | high | moderate |
| `avoid-inline-spacing` | Inline style must not force text spacing below the WCAG metric | 1.4.12 | AA | high | moderate |
| `binary-control-name-present` | Binary controls have an accessible name | 4.1.2 | A | high | serious |
| `button-name-present` | Buttons have an accessible name | 4.1.2 | A | high | serious |
| `canvas-text-alternative-present` | &lt;canvas&gt; must provide a text alternative | 1.1.1 | A | high | serious |
| `combobox-name-present` | Comboboxes have an accessible name | 4.1.2 | A | high | serious |
| `contrast-computable` | Color contrast is computable for rendered text | 1.4.3, 1.4.6 | AAA | high | serious |
| `contrast-enhanced` | Text meets enhanced color contrast (AAA) | 1.4.6 | AAA | high | serious |
| `contrast-minimum` | Text meets minimum color contrast (AA) | 1.4.3 | AA | high | serious |
| `css-orientation-lock` | CSS must not lock the page to a single orientation | 1.3.4 | AA | high | serious |
| `definition-list-children-valid` | Description lists must be structured correctly | 1.3.1 | A | high | serious |
| `deprecated-elements-not-used` | Obsolete non-stoppable elements (&lt;blink&gt;, &lt;marquee&gt;) must not be used | 2.2.2 | A | high | serious |
| `dialog-name-present` | Dialogs have an accessible name | 4.1.2 | A | high | serious |
| `dlitem-parent-valid` | Description-list items must be inside a description list | 1.3.1 | A | high | serious |
| `duplicate-id` | IDs must be unique | 4.1.1 | A | high | moderate |
| `duplicate-id-aria` | IDs referenced by ARIA must be unique | 4.1.2 | A | high | serious |
| `embed-text-alternative-present` | &lt;embed&gt; must provide a text alternative | 1.1.1 | A | high | serious |
| `form-control-programmatic-label-present` | Form controls must have a programmatic label | 1.3.1, 3.3.2, 4.1.2 | A | medium | serious |
| `form-control-single-label` | Form controls must not have multiple labels | 3.3.2 | A | high | moderate |
| `html-lang-attr-present` | Page language is declared | 3.1.1 | A | high | serious |
| `html-xml-lang-mismatch` | lang and xml:lang must not disagree | 3.1.1 | A | high | serious |
| `iframe-focusable-content` | Frames with tabindex="-1" must not contain focusable content | 2.1.1 | A | high | moderate |
| `iframe-name-present` | Frames have an accessible name | 4.1.2 | A | high | serious |
| `iframe-title-unique` | Frame titles must be unique | 4.1.2 | A | high | moderate |
| `img-alt-present` | &lt;img&gt; must have an alt attribute | 1.1.1 | A | high | serious |
| `input-image-alt-present` | &lt;input type="image"&gt; must have an alt attribute | 1.1.1 | A | high | serious |
| `label-in-name` | Label in Name: accessible name contains visible text | 2.5.3 | A | high | serious |
| `link-in-text-block` | Links in text blocks must be distinguishable from surrounding text without relying on color alone | 1.4.1 | A | high | serious |
| `link-name-present` | Links have an accessible name | 4.1.2 | A | high | serious |
| `list-children-valid` | Lists must only directly contain list items | 1.3.1 | A | high | serious |
| `listbox-name-present` | Listboxes have an accessible name | 4.1.2 | A | high | serious |
| `listitem-parent-valid` | List items must be inside a list container | 1.3.1 | A | high | serious |
| `menuitem-name-present` | Menu items have an accessible name | 4.1.2 | A | high | serious |
| `meta-refresh-no-exceptions` | Page must not use a meta refresh at all (AAA) | 2.2.4, 3.2.5 | AAA | high | moderate |
| `meta-refresh-timing-absent` | Page must not use a timed meta refresh | 2.2.1 | A | high | serious |
| `meta-viewport-zoom-enabled` | Viewport meta tag must not disable zoom | 1.4.4 | AA | high | serious |
| `meter-name-present` | Meters have an accessible name | 1.1.1 | A | high | serious |
| `nested-interactive-controls-absent` | Interactive controls must not be nested | 4.1.2 | A | high | serious |
| `object-text-alternative-present` | &lt;object&gt; must provide a text alternative | 1.1.1 | A | high | serious |
| `option-name-present` | Options have an accessible name | 4.1.2 | A | high | serious |
| `page-title-present` | Page has a non-empty title | 2.4.2 | A | high | serious |
| `presentational-children-focusable-absent` | Roles with presentational children must not contain focusable content | 4.1.2 | A | high | serious |
| `progressbar-name-present` | Progress bars have an accessible name | 1.1.1 | A | high | serious |
| `role-img-text-alternative-present` | [role="img"] must have an accessible text alternative | 1.1.1 | A | high | serious |
| `searchbox-name-present` | Searchboxes have an accessible name | 4.1.2 | A | high | serious |
| `server-side-image-map-absent` | Images must not use a server-side image map | 2.1.1 | A | high | serious |
| `slider-name-present` | Sliders have an accessible name | 4.1.2 | A | high | serious |
| `spinbutton-name-present` | Spinbuttons have an accessible name | 4.1.2 | A | high | serious |
| `summary-name-present` | Summary elements have an accessible name | 4.1.2 | A | high | serious |
| `svg-image-text-alternative-present` | SVG &lt;image&gt; must have a text alternative | 1.1.1 | A | medium | serious |
| `svg-text-alternative-present` | &lt;svg&gt; must provide a text alternative | 1.1.1 | A | high | serious |
| `tab-name-present` | Tabs have an accessible name | 4.1.2 | A | high | serious |
| `table-headers-attr-valid` | Table cell "headers" attribute must reference valid header cells | 1.3.1 | A | high | serious |
| `table-th-has-data-cells` | &lt;th&gt; elements must describe at least one data cell | 1.3.1 | A | high | moderate |
| `target-size-minimum` | Pointer targets must be at least 24x24px large, or leave sufficient distance to other targets | 2.5.8 | AA | medium | serious |
| `td-has-header` | Data cells in large tables must have an associated header | 1.3.1 | A | high | serious |
| `textbox-name-present` | Textboxes have an accessible name | 4.1.2 | A | high | serious |
| `tooltip-name-present` | Tooltips have an accessible name | 4.1.2 | A | high | serious |
| `treeitem-name-present` | Tree items have an accessible name | 4.1.2 | A | high | serious |
| `valid-lang` | Element lang attribute must be syntactically valid | 3.1.2 | AA | high | moderate |
| `video-poster-text-alternative-present` | &lt;video&gt; poster must have a text alternative | 1.1.1 | A | medium | serious |

## Manual rules (52) — advisory, capped at `cantTell`

| Rule ID | Title | WCAG SC | Level | Confidence | Default severity |
|---|---|---|---|---|---|
| `accesskeys` | accesskey values must be unique | — | — | medium | minor |
| `area-alt-decorative` | &lt;area&gt; with alt="" must be decorative (manual review) | 1.1.1 | A | medium | minor |
| `area-alt-quality` | &lt;area&gt; alt text must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| `aria-checked-state-mismatch` | Native checkbox/radio aria-checked should match its actual state | 4.1.2 | A | medium | moderate |
| `aria-text` | role="text" elements should have no focusable descendants | — | — | medium | minor |
| `bypass-blocks-present` | Page must provide a way to bypass repeated blocks | 2.4.1 | A | medium | moderate |
| `canvas-text-alternative-quality` | &lt;canvas&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| `css-focus-indicator-suppressed` | Focus indicator must not be removed without a replacement | 2.4.7 | AA | medium | serious |
| `css-hidden-focus` | Focusable elements must not be visually hidden | 2.4.7 | AA | low | serious |
| `embed-text-alternative-quality` | &lt;embed&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| `empty-heading` | Headings must not be empty | — | — | medium | minor |
| `empty-table-header` | Table header cells must not be empty | — | — | medium | minor |
| `focus-order-semantics` | Elements added to the tab order should have interactive semantics | — | — | medium | minor |
| `form-control-label-quality` | Form field labels should be descriptive and distinguishable | 2.4.6 | AA | medium | minor |
| `form-control-programmatic-label-quality` | Form controls should not rely on placeholder or title as the primary label | 4.1.2 | A | medium | moderate |
| `heading-order` | Heading levels must not skip a level | — | — | medium | minor |
| `heading-quality` | Heading text should be descriptive, not a placeholder | 2.4.6 | AA | medium | minor |
| `identical-links-same-purpose` | Links with the same accessible name should lead to the same destination | 2.4.9 | AAA | low | minor |
| `image-redundant-alt` | Image alt text must not duplicate adjacent visible text | — | — | medium | minor |
| `img-alt-decorative` | &lt;img&gt; with alt="" must be decorative (manual review) | 1.1.1 | A | medium | minor |
| `img-alt-quality` | &lt;img&gt; alt text must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| `input-image-alt-decorative` | &lt;input type="image"&gt; with alt="" must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| `input-image-alt-quality` | &lt;input type="image"&gt; alt text must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| `label-title-only` | Form controls should not use title as their only label | — | — | medium | minor |
| `landmark-banner-is-top-level` | Banner landmark must be top-level | — | — | medium | minor |
| `landmark-contentinfo-is-top-level` | Contentinfo landmark must be top-level | — | — | medium | minor |
| `landmark-main-is-top-level` | Main landmark must be top-level | — | — | medium | minor |
| `landmark-no-duplicate-banner` | Page must not have more than one banner landmark | — | — | medium | minor |
| `landmark-no-duplicate-contentinfo` | Page must not have more than one contentinfo landmark | — | — | medium | minor |
| `landmark-no-duplicate-main` | Page must not have more than one main landmark | — | — | medium | minor |
| `landmark-one-main` | Page should have a main landmark | — | — | medium | minor |
| `landmark-unique` | Landmarks with the same role must have unique names | — | — | medium | minor |
| `link-name-quality` | Link text should be descriptive, not generic | 2.4.4 | A | medium | minor |
| `manual-review` | Manual review: keyboard navigation and focus order | 2.1.1, 2.4.3, 2.4.7 | AA | medium | moderate |
| `media-alternative-transcript-evidence` | Time-based media: transcript or text alternative evidence | 1.2.1 | A | low | moderate |
| `meta-viewport-large` | Viewport meta tag should allow zooming up to 500% | — | — | medium | minor |
| `mouse-only-event-handlers` | Pointer-only inline event handlers should have a keyboard-reachable equivalent | 2.1.1 | A | low | moderate |
| `no-autoplay-audio` | Autoplaying audio should provide a pause/stop or volume-control mechanism | 1.4.2 | A | low | moderate |
| `object-text-alternative-quality` | &lt;object&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| `p-as-heading` | A &lt;p&gt; styled to look like a heading should probably be a real heading | 1.3.1 | A | low | minor |
| `page-has-heading-one` | Page should have a level-one heading | — | — | medium | minor |
| `page-title-patterns` | Page title patterns that may be insufficiently descriptive | 2.4.2 | A | medium | minor |
| `presentation-role-conflict` | Presentational role must not conflict with a global ARIA attribute or focusability | — | — | medium | minor |
| `region` | Page content should be inside a landmark region | — | — | medium | minor |
| `scope-attr-valid` | scope attribute must have a valid value | — | — | medium | minor |
| `scrollable-region-focusable` | Scrollable regions with no focusable content should be keyboard-focusable | 2.1.1, 2.1.3 | AAA | low | moderate |
| `skip-link` | Skip link must have a resolvable, usable target | — | — | medium | minor |
| `svg-text-alternative-quality` | &lt;svg&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| `tabindex` | tabindex should not be greater than 0 | — | — | medium | minor |
| `table-duplicate-name` | Table caption must not duplicate its summary attribute | — | — | medium | minor |
| `table-fake-caption` | A table's first row should not stand in for a real &lt;caption&gt; | 1.3.1 | A | low | minor |
| `video-caption` | Prerecorded video should provide a captions track | 1.2.2 | A | low | moderate |

## Composite (WCAG-SC rollup) rules (33)

Composite rules aren't individually authored — they're generated rollups over the atomic rules above, one per WCAG Success Criterion with automatable coverage. See [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md) for rollup semantics.

| Composite ID | Title | WCAG SC | Level | # atomic rules rolled up |
|---|---|---|---|---|
| `wcag-1.1.1-non-text-content` | Non-text content: text alternatives | 1.1.1 | A | 22 |
| `wcag-1.2.1-audio-only-video-only-prerecorded` | Audio-only and video-only (prerecorded): transcript | 1.2.1 | A | 1 |
| `wcag-1.2.2-captions-prerecorded` | Captions (Prerecorded) | 1.2.2 | A | 1 |
| `wcag-1.3.1-info-and-relationships` | Info and Relationships | 1.3.1 | A | 11 |
| `wcag-1.3.4-orientation` | Orientation | 1.3.4 | AA | 1 |
| `wcag-1.3.5-identify-input-purpose` | Identify Input Purpose | 1.3.5 | AA | 1 |
| `wcag-1.4.1-use-of-color` | Use of Color | 1.4.1 | A | 1 |
| `wcag-1.4.12-text-spacing` | Text Spacing | 1.4.12 | AA | 1 |
| `wcag-1.4.2-audio-control` | Audio Control | 1.4.2 | A | 1 |
| `wcag-1.4.3-contrast-minimum` | Contrast: minimum | 1.4.3 | AA | 2 |
| `wcag-1.4.4-resize-text` | Resize Text | 1.4.4 | AA | 1 |
| `wcag-1.4.6-contrast-enhanced` | Contrast: enhanced | 1.4.6 | AAA | 2 |
| `wcag-2.1.1-keyboard` | Keyboard | 2.1.1 | A | 5 |
| `wcag-2.1.3-keyboard-no-exception` | Keyboard (No Exception) | 2.1.3 | AAA | 1 |
| `wcag-2.2.1-timing-adjustable` | Timing Adjustable | 2.2.1 | A | 1 |
| `wcag-2.2.2-pause-stop-hide` | Pause, Stop, Hide | 2.2.2 | A | 1 |
| `wcag-2.2.4-interruptions` | Interruptions | 2.2.4 | AAA | 1 |
| `wcag-2.4.1-bypass-blocks` | Bypass Blocks | 2.4.1 | A | 1 |
| `wcag-2.4.2-page-titled` | Page titled | 2.4.2 | A | 2 |
| `wcag-2.4.3-focus-order` | Focus order | 2.4.3 | A | 1 |
| `wcag-2.4.4-link-purpose-in-context` | Link Purpose (In Context) | 2.4.4 | A | 1 |
| `wcag-2.4.6-headings-and-labels` | Headings and Labels | 2.4.6 | AA | 2 |
| `wcag-2.4.7-focus-visible` | Focus visible | 2.4.7 | AA | 4 |
| `wcag-2.4.9-link-purpose-link-only` | Link Purpose (Link Only) | 2.4.9 | AAA | 1 |
| `wcag-2.5.3-label-in-name` | Label in name | 2.5.3 | A | 1 |
| `wcag-2.5.8-target-size-minimum` | Target size: minimum | 2.5.8 | AA | 1 |
| `wcag-3.1.1-language-of-page` | Language of page | 3.1.1 | A | 2 |
| `wcag-3.1.2-language-of-parts` | Language of Parts | 3.1.2 | AA | 1 |
| `wcag-3.2.5-change-on-request` | Change on Request | 3.2.5 | AAA | 1 |
| `wcag-3.3.2-labels-or-instructions` | Labels or Instructions | 3.3.2 | A | 2 |
| `wcag-4.1.1-parsing` | Parsing | 4.1.1 | A | 1 |
| `wcag-4.1.2-aria-validity` | Name, role, value: ARIA validity | 4.1.2 | A | 17 |
| `wcag-4.1.2-name` | Name, role, value: accessible name | 4.1.2 | A | 23 |
