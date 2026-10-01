# Rule catalog

Generated from the compiled engine's own catalog (`getChecksCatalog()`/`getRulesCatalog()`) and each rule's source header. Run `node scripts/generate-rule-catalog.js` after `npm run build` to regenerate this file whenever rules change. Do not hand-edit.

**203 rules total: 135 automatic (WCAG-normative, can return `fail`), 68 manual (advisory/judgment-required, capped at `cantTell`). 107 carry at least one formal WCAG Success Criterion mapping.**

The tables below are an index; [rule reference](#rule-reference) carries each rule's description, what it applies to and what it expects.

See [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md) for what `type`/`confidence`/`severity` mean on a scan result, and [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md) for how these roll up to an SC-level conformance claim. For WCAG-facet-level coverage-gap tracking (which parts of an SC are and aren't automatable yet), see `coverage/coverage-report.md` instead: that one is organized by facet, this one by rule.

## Automatic rules (135), can return `fail`

| Rule ID | Title | WCAG SC | Level | Confidence | Default severity |
|---|---|---|---|---|---|
| [`acme-statement-link`](#acme-statement-link) | Pages link to the accessibility statement | — | — | high | moderate |
| [`area-alt-present`](#area-alt-present) | &lt;area&gt; must have an accessible name | 1.1.1 | A | high | serious |
| [`area-alt-source`](#area-alt-source) | Linked image-map areas are named by alt or aria-label | — | — | medium | moderate |
| [`aria-allowed-attr`](#aria-allowed-attr) | aria-* attributes must be permitted for the element’s role | 4.1.2 | A | medium | moderate |
| [`aria-allowed-role`](#aria-allowed-role) | Explicit role must be permitted for its host element | — | — | high | moderate |
| [`aria-attribute-conformance`](#aria-attribute-conformance) | aria-* attributes are valid for the W3C validator | — | — | high | moderate |
| [`aria-braille-equivalent`](#aria-braille-equivalent) | aria-braillelabel/aria-brailleroledescription must have a non-braille equivalent | 4.1.2 | A | high | moderate |
| [`aria-conditional-attr`](#aria-conditional-attr) | aria-errormessage requires aria-invalid to be set to a non-false value | 4.1.2 | A | high | moderate |
| [`aria-deprecated-role`](#aria-deprecated-role) | role attribute should not use a deprecated or author-discouraged ARIA role | 4.1.2 | A | high | moderate |
| [`aria-hidden-body`](#aria-hidden-body) | The document &lt;body&gt; must not be aria-hidden | 1.3.1, 4.1.2 | A | high | critical |
| [`aria-hidden-focus`](#aria-hidden-focus) | ARIA hidden elements must not be focusable | 2.4.7, 4.1.2 | AA | high | serious |
| [`aria-list-item-roles`](#aria-list-item-roles) | ARIA lists use role="listitem" for their items | — | — | medium | moderate |
| [`aria-prohibited-attr`](#aria-prohibited-attr) | ARIA naming attributes must not be used on roles that prohibit them | 4.1.2 | A | high | moderate |
| [`aria-prohibited-children`](#aria-prohibited-children) | Container roles must not own a child with a disallowed role | 1.3.1 | A | medium | moderate |
| [`aria-required-attr`](#aria-required-attr) | Roles with a required ARIA state/property must carry it | 4.1.2 | A | high | serious |
| [`aria-required-children`](#aria-required-children) | Container roles must own at least one required child role | 1.3.1 | A | medium | moderate |
| [`aria-required-parent`](#aria-required-parent) | Roles requiring a specific context role must be in that context | 1.3.1 | A | medium | moderate |
| [`aria-role-conformance`](#aria-role-conformance) | Role attributes are valid for the W3C validator | — | — | high | moderate |
| [`aria-role-name-present`](#aria-role-name-present) | ARIA roles that require an accessible name have one | 4.1.2 | A | high | serious |
| [`aria-roles-valid`](#aria-roles-valid) | role attribute must be a valid, non-abstract ARIA role | 4.1.2 | A | high | serious |
| [`aria-valid-attr`](#aria-valid-attr) | aria-* attributes must be real, defined ARIA attributes | 4.1.2 | A | high | serious |
| [`aria-valid-attr-value`](#aria-valid-attr-value) | aria-* attribute values must match their declared type | 4.1.2 | A | high | serious |
| [`autocomplete-valid`](#autocomplete-valid) | autocomplete attribute must be a valid autofill value | 1.3.5 | AA | high | moderate |
| [`avoid-inline-spacing`](#avoid-inline-spacing) | Inline style must not force text spacing below the WCAG metric | 1.4.12 | AA | high | moderate |
| [`binary-control-name-present`](#binary-control-name-present) | Binary controls have an accessible name | 4.1.2 | A | high | serious |
| [`button-name-present`](#button-name-present) | Buttons have an accessible name | 4.1.2 | A | high | serious |
| [`canvas-decorative-aria-hidden`](#canvas-decorative-aria-hidden) | Decorative &lt;canvas&gt; images have aria-hidden="true" and no alternative | — | — | medium | minor |
| [`canvas-role-img`](#canvas-role-img) | &lt;canvas&gt; images have role="img" with an ARIA name, or fallback content | — | — | medium | serious |
| [`canvas-text-alternative-present`](#canvas-text-alternative-present) | &lt;canvas&gt; must provide a text alternative | 1.1.1 | A | high | serious |
| [`combobox-name-present`](#combobox-name-present) | Comboboxes have an accessible name | 4.1.2 | A | high | serious |
| [`contrast-computable`](#contrast-computable) | Color contrast is computable for rendered text | 1.4.3, 1.4.6 | AAA | high | serious |
| [`contrast-enhanced`](#contrast-enhanced) | Text meets enhanced color contrast (AAA) | 1.4.6 | AAA | high | serious |
| [`contrast-minimum`](#contrast-minimum) | Text meets minimum color contrast (AA) | 1.4.3 | AA | high | serious |
| [`contrast-minimum-rgaa`](#contrast-minimum-rgaa) | Text meets RGAA minimum color contrast | — | — | high | serious |
| [`css-orientation-lock`](#css-orientation-lock) | CSS must not lock the page to a single orientation | 1.3.4 | AA | high | serious |
| [`definition-list-children-valid`](#definition-list-children-valid) | Description lists must be structured correctly | 1.3.1 | A | high | serious |
| [`deprecated-elements-not-used`](#deprecated-elements-not-used) | Scrolling &lt;marquee&gt; content must be possible to pause, stop, or hide | 2.2.2 | A | high | serious |
| [`dialog-name-present`](#dialog-name-present) | Dialogs have an accessible name | 4.1.2 | A | high | serious |
| [`dir-attribute-valid`](#dir-attribute-valid) | dir attributes are ltr or rtl | — | — | high | minor |
| [`dlitem-parent-valid`](#dlitem-parent-valid) | Description-list items must be inside a description list | 1.3.1 | A | high | serious |
| [`doctype-position`](#doctype-position) | The doctype comes before the &lt;html&gt; tag | — | — | high | moderate |
| [`doctype-present`](#doctype-present) | Page declares a doctype | — | — | high | moderate |
| [`doctype-valid`](#doctype-valid) | Declared doctype is valid | — | — | high | moderate |
| [`duplicate-id`](#duplicate-id) | IDs must be unique | 4.1.1 | A | high | moderate |
| [`duplicate-id-aria`](#duplicate-id-aria) | IDs referenced by ARIA must be unique | 4.1.2 | A | high | serious |
| [`embed-image-role-img`](#embed-image-role-img) | Embedded images have role="img" and a text alternative | — | — | medium | serious |
| [`embed-text-alternative-present`](#embed-text-alternative-present) | &lt;embed&gt; must provide a text alternative | 1.1.1 | A | high | serious |
| [`field-label-in-name-sources`](#field-label-in-name-sources) | Every label source of a form field contains its visible label | — | — | high | serious |
| [`field-label-listed-source`](#field-label-listed-source) | Form fields have a label from a source RGAA lists | — | — | high | serious |
| [`figure-caption-structure`](#figure-caption-structure) | Images with a caption use the figure structure RGAA describes | — | — | high | minor |
| [`focus-indicator-contrast`](#focus-indicator-contrast) | Author focus indicators have a contrast ratio of at least 3:1 | — | — | medium | serious |
| [`form-button-label-in-name-sources`](#form-button-label-in-name-sources) | The accessible name of a button in a form contains its visible label | — | — | high | serious |
| [`form-button-name-present`](#form-button-name-present) | Buttons in a form have a label | — | — | high | serious |
| [`form-control-programmatic-label-present`](#form-control-programmatic-label-present) | Form controls must have a programmatic label | 1.3.1, 3.3.2, 4.1.2 | A | medium | serious |
| [`form-control-single-label`](#form-control-single-label) | Form controls must not have multiple labels | 3.3.2 | A | high | moderate |
| [`frame-title-attribute-present`](#frame-title-attribute-present) | Frames have a title attribute | — | — | high | serious |
| [`frame-title-not-empty`](#frame-title-not-empty) | Frame titles are not empty | — | — | high | serious |
| [`heading-content-present`](#heading-content-present) | Headings have content | — | — | high | moderate |
| [`heading-role-level-present`](#heading-role-level-present) | ARIA headings have an aria-level attribute | — | — | high | moderate |
| [`html-elements-attributes-valid`](#html-elements-attributes-valid) | HTML elements and attribute values are valid | — | — | high | moderate |
| [`html-lang-attr-present`](#html-lang-attr-present) | Page language is declared | 3.1.1 | A | high | serious |
| [`html-lang-code-valid`](#html-lang-code-valid) | Default language code is valid | — | — | high | serious |
| [`html-nesting-valid`](#html-nesting-valid) | HTML elements are nested as HTML allows | — | — | high | moderate |
| [`html-xml-lang-mismatch`](#html-xml-lang-mismatch) | lang and xml:lang must not disagree | 3.1.1 | A | high | serious |
| [`identical-iframes-same-purpose`](#identical-iframes-same-purpose) | Frames with the same name embed the same resource | 4.1.2 | A | medium | moderate |
| [`iframe-focusable-content`](#iframe-focusable-content) | Frames with tabindex="-1" must not contain focusable content | 2.1.1 | A | high | moderate |
| [`iframe-name-present`](#iframe-name-present) | Frames have an accessible name | 4.1.2 | A | high | serious |
| [`iframe-title-unique`](#iframe-title-unique) | Frame titles must be unique | 4.1.2 | A | high | moderate |
| [`img-alt-present`](#img-alt-present) | &lt;img&gt; must have an alt attribute | 1.1.1 | A | high | serious |
| [`img-decorative-no-alternative`](#img-decorative-no-alternative) | Decorative images have no aria-labelledby, aria-label or title | — | — | high | minor |
| [`input-image-alt-present`](#input-image-alt-present) | &lt;input type="image"&gt; must have an alt attribute | 1.1.1 | A | high | serious |
| [`label-for-target-valid`](#label-for-target-valid) | Labels point to a form field | — | — | high | serious |
| [`label-in-name`](#label-in-name) | Label in Name: accessible name contains visible text | 2.5.3 | A | high | serious |
| [`layout-table-no-data-markup`](#layout-table-no-data-markup) | Layout tables use no data table markup | — | — | high | moderate |
| [`link-content-label-present`](#link-content-label-present) | Links have a label in their content | — | — | high | serious |
| [`link-in-text-block`](#link-in-text-block) | Links in text blocks must be distinguishable from surrounding text without relying on color alone | 1.4.1 | A | high | serious |
| [`link-label-in-name-sources`](#link-label-in-name-sources) | Every name source of a link contains its visible label | — | — | high | serious |
| [`link-name-present`](#link-name-present) | Links have an accessible name | 2.4.4, 4.1.2 | A | high | serious |
| [`link-state-colors-review`](#link-state-colors-review) | Link states shown by color alone contrast 3:1 with the surrounding text | — | — | medium | moderate |
| [`list-children-valid`](#list-children-valid) | Lists must only directly contain list items | 1.3.1 | A | high | serious |
| [`listbox-name-present`](#listbox-name-present) | Listboxes have an accessible name | 4.1.2 | A | high | serious |
| [`listbox-option-groups-absent`](#listbox-option-groups-absent) | ARIA listboxes do not group options | — | — | high | moderate |
| [`listitem-parent-valid`](#listitem-parent-valid) | List items must be inside a list container | 1.3.1 | A | high | serious |
| [`main-element-structure`](#main-element-structure) | Main content uses one visible &lt;main&gt; element | — | — | high | moderate |
| [`markup-validation-review`](#markup-validation-review) | The generated source code passes the W3C validator | — | — | medium | moderate |
| [`media-transcript-adjacent`](#media-transcript-adjacent) | Audio and video have an adjacent transcript or a link to one | — | — | medium | moderate |
| [`menuitem-name-present`](#menuitem-name-present) | Menu items have an accessible name | 4.1.2 | A | high | serious |
| [`meta-redirect-immediate`](#meta-redirect-immediate) | Meta redirects are immediate | — | — | medium | serious |
| [`meta-refresh-no-exceptions`](#meta-refresh-no-exceptions) | Page must not use a timed meta refresh (AAA) | 2.2.4, 3.2.5 | AAA | high | moderate |
| [`meta-refresh-no-url-timing`](#meta-refresh-no-url-timing) | Meta refresh waits 20 hours or more | — | — | high | serious |
| [`meta-refresh-timing-absent`](#meta-refresh-timing-absent) | Page must not use a timed meta refresh | 2.2.1 | A | high | serious |
| [`meta-viewport-zoom-enabled`](#meta-viewport-zoom-enabled) | Viewport meta tag must not disable zoom | 1.4.4 | AA | high | serious |
| [`meter-name-present`](#meter-name-present) | Meters have an accessible name | 1.1.1 | A | high | serious |
| [`nested-interactive-controls-absent`](#nested-interactive-controls-absent) | Interactive controls must not be nested | 4.1.2 | A | high | serious |
| [`object-image-role-img`](#object-image-role-img) | Image objects have role="img" and a text alternative | — | — | medium | serious |
| [`object-text-alternative-present`](#object-text-alternative-present) | &lt;object&gt; must provide a text alternative | 1.1.1 | A | high | serious |
| [`optgroup-label-not-empty`](#optgroup-label-not-empty) | Option group labels are not empty | — | — | high | moderate |
| [`optgroup-label-present`](#optgroup-label-present) | Option groups have a label | — | — | high | moderate |
| [`option-name-present`](#option-name-present) | Options have an accessible name | 4.1.2 | A | high | serious |
| [`orientation-content-parity`](#orientation-content-parity) | Content stays the same in portrait and landscape | — | — | medium | moderate |
| [`page-language-present`](#page-language-present) | Page gives a default language | — | — | high | serious |
| [`page-title-present`](#page-title-present) | Page has a non-empty title | 2.4.2 | A | high | serious |
| [`page-title-unique`](#page-title-unique) | Page titles are unique across the site | — | — | high | moderate |
| [`page-zones-reachable`](#page-zones-reachable) | Each area of the page can be reached or skipped | — | — | medium | moderate |
| [`presentational-attributes-absent`](#presentational-attributes-absent) | Page uses no presentational attributes | — | — | high | minor |
| [`presentational-children-focusable-absent`](#presentational-children-focusable-absent) | Roles with presentational children must not contain focusable content | 4.1.2 | A | high | serious |
| [`presentational-elements-absent`](#presentational-elements-absent) | Page uses no presentational elements | — | — | high | minor |
| [`progressbar-name-present`](#progressbar-name-present) | Progress bars have an accessible name | 1.1.1 | A | high | serious |
| [`role-img-aria-name`](#role-img-aria-name) | Elements with role="img" are named with aria-labelledby or aria-label | — | — | high | serious |
| [`role-img-text-alternative-present`](#role-img-text-alternative-present) | [role="img"/"graphics-symbol"/"graphics-document"] must have an accessible text alternative | 1.1.1 | A | high | serious |
| [`searchbox-name-present`](#searchbox-name-present) | Searchboxes have an accessible name | 4.1.2 | A | high | serious |
| [`server-side-image-map-absent`](#server-side-image-map-absent) | Server-side image maps must have a keyboard-operable alternative | 2.1.1 | A | high | serious |
| [`skip-link-placement`](#skip-link-placement) | Skip links are visible and at the same place on every page | — | — | medium | moderate |
| [`skip-link-present`](#skip-link-present) | Pages have a skip link to the main content | — | — | high | moderate |
| [`slider-name-present`](#slider-name-present) | Sliders have an accessible name | 4.1.2 | A | high | serious |
| [`spinbutton-name-present`](#spinbutton-name-present) | Spinbuttons have an accessible name | 4.1.2 | A | high | serious |
| [`summary-name-present`](#summary-name-present) | Summary elements have an accessible name | 4.1.2 | A | high | serious |
| [`svg-hidden-no-alternative`](#svg-hidden-no-alternative) | Hidden decorative SVGs carry no text alternative | — | — | high | minor |
| [`svg-image-text-alternative-present`](#svg-image-text-alternative-present) | SVG &lt;image&gt; must have a text alternative | 1.1.1 | A | medium | serious |
| [`svg-role-img`](#svg-role-img) | SVGs with a text alternative have role="img" | — | — | high | serious |
| [`svg-text-alternative-present`](#svg-text-alternative-present) | &lt;svg&gt; must provide a text alternative | 1.1.1 | A | high | serious |
| [`tab-name-present`](#tab-name-present) | Tabs have an accessible name | 4.1.2 | A | high | serious |
| [`table-headers-attr-valid`](#table-headers-attr-valid) | Table cell "headers" attribute must reference valid header cells | 1.3.1 | A | high | serious |
| [`table-th-has-data-cells`](#table-th-has-data-cells) | &lt;th&gt; elements must describe at least one data cell | 1.3.1 | A | high | moderate |
| [`target-size-minimum`](#target-size-minimum) | Pointer targets must be at least 24x24px large, or leave sufficient distance to other targets | 2.5.8 | AA | medium | serious |
| [`td-has-header`](#td-has-header) | Data cells in large tables must have an associated header | 1.3.1 | A | high | serious |
| [`text-spacing-content-loss`](#text-spacing-content-loss) | Text stays readable when the user increases text spacing | 1.4.12 | AA | medium | serious |
| [`textbox-name-present`](#textbox-name-present) | Textboxes have an accessible name | 4.1.2 | A | high | serious |
| [`title-placeholder-identical`](#title-placeholder-identical) | A form field's title and placeholder are identical | — | — | medium | moderate |
| [`tooltip-name-present`](#tooltip-name-present) | Tooltips have an accessible name | 4.1.2 | A | high | serious |
| [`treeitem-name-present`](#treeitem-name-present) | Tree items have an accessible name | 4.1.2 | A | high | serious |
| [`valid-lang`](#valid-lang) | Element lang attribute must be syntactically valid | 3.1.2 | AA | high | moderate |
| [`video-captions-track-kind`](#video-captions-track-kind) | Video caption tracks use kind="captions" | — | — | high | moderate |
| [`video-poster-text-alternative-present`](#video-poster-text-alternative-present) | &lt;video&gt; poster must have a text alternative | 1.1.1 | A | medium | serious |
| [`widget-label-in-name`](#widget-label-in-name) | The accessible name of a scripted component contains its visible label | — | — | high | serious |

## Manual rules (68), advisory, capped at `cantTell`

| Rule ID | Title | WCAG SC | Level | Confidence | Default severity |
|---|---|---|---|---|---|
| [`accesskeys`](#accesskeys) | accesskey values must be unique | — | — | medium | minor |
| [`area-alt-quality`](#area-alt-quality) | &lt;area&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`aria-checked-state-mismatch`](#aria-checked-state-mismatch) | Native checkbox/radio aria-checked should match its actual state | 4.1.2 | A | medium | moderate |
| [`aria-text`](#aria-text) | role="text" elements should have no focusable descendants | — | — | medium | minor |
| [`bypass-blocks-present`](#bypass-blocks-present) | Page must provide a way to bypass repeated blocks | 2.4.1 | A | medium | moderate |
| [`canvas-text-alternative-quality`](#canvas-text-alternative-quality) | &lt;canvas&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`complex-table-summary`](#complex-table-summary) | Complex data tables have a summary | — | — | medium | moderate |
| [`complex-table-summary-quality`](#complex-table-summary-quality) | Complex data table summaries are relevant | — | — | medium | moderate |
| [`css-focus-indicator-suppressed`](#css-focus-indicator-suppressed) | Focus indicator must not be removed without a replacement | 2.4.7 | AA | medium | serious |
| [`css-hidden-focus`](#css-hidden-focus) | Focusable elements must not be visually hidden | 2.4.7 | AA | low | serious |
| [`data-table-headers-review`](#data-table-headers-review) | Tables with no header cells are checked for unmarked headers | — | — | medium | moderate |
| [`embed-text-alternative-quality`](#embed-text-alternative-quality) | &lt;embed&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`embedded-refresh-review`](#embedded-refresh-review) | Embedded content that may refresh itself lets the user control the refresh | — | — | low | moderate |
| [`empty-heading`](#empty-heading) | Headings must not be empty | — | — | medium | minor |
| [`empty-table-header`](#empty-table-header) | Table header cells must not be empty | — | — | medium | minor |
| [`fake-list`](#fake-list) | Text laid out as a list uses list markup | — | — | low | moderate |
| [`field-group-legend`](#field-group-legend) | Groups of form fields have a legend | — | — | medium | moderate |
| [`focus-order-semantics`](#focus-order-semantics) | Elements added to the tab order should have interactive semantics | — | — | medium | minor |
| [`form-control-label-quality`](#form-control-label-quality) | Form field labels should be descriptive and distinguishable | 2.4.6 | AA | medium | minor |
| [`form-control-programmatic-label-quality`](#form-control-programmatic-label-quality) | Form controls should not rely on placeholder or title as the primary label | 4.1.2 | A | medium | moderate |
| [`heading-order`](#heading-order) | Heading levels must not skip a level | — | — | medium | minor |
| [`heading-quality`](#heading-quality) | Heading text should be descriptive, not a placeholder | 2.4.6 | AA | medium | minor |
| [`identical-links-same-purpose`](#identical-links-same-purpose) | Links with the same accessible name should lead to the same destination | 2.4.9 | AAA | low | minor |
| [`image-alt-long`](#image-alt-long) | Text alternatives of images are short | — | — | medium | minor |
| [`image-redundant-alt`](#image-redundant-alt) | Image alt text must not duplicate adjacent visible text | — | — | medium | minor |
| [`img-alt-decorative`](#img-alt-decorative) | Excluded &lt;img&gt;/&lt;canvas&gt;/&lt;svg&gt; must be decorative (manual review) | 1.1.1 | A | medium | minor |
| [`img-alt-quality`](#img-alt-quality) | &lt;img&gt; alt text must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`input-image-alt-decorative`](#input-image-alt-decorative) | &lt;input type="image"&gt; with alt="" must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`input-image-alt-quality`](#input-image-alt-quality) | &lt;input type="image"&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`keyboard-only-event-handlers`](#keyboard-only-event-handlers) | Keyboard-only inline event handlers should have a pointer equivalent | — | — | low | moderate |
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
| [`letters-spaced-with-spaces`](#letters-spaced-with-spaces) | Letters of a word are not spaced out with spaces | — | — | medium | minor |
| [`link-context-review`](#link-context-review) | Generic links whose only context is outside RGAA's list are reviewed | — | — | medium | minor |
| [`link-name-quality`](#link-name-quality) | Link text should be descriptive, not generic | 2.4.4 | A | medium | minor |
| [`manual-review`](#manual-review) | Manual review: keyboard navigation and focus order | 2.1.1, 2.4.3, 2.4.7 | AA | medium | moderate |
| [`media-alternative-transcript-evidence`](#media-alternative-transcript-evidence) | Time-based media: transcript or text alternative evidence | 1.2.1 | A | low | moderate |
| [`meta-viewport-large`](#meta-viewport-large) | Viewport meta tag should allow zooming up to 500% | — | — | medium | minor |
| [`mouse-only-event-handlers`](#mouse-only-event-handlers) | Pointer-only inline event handlers should have a keyboard-reachable equivalent | 2.1.1 | A | low | moderate |
| [`no-autoplay-audio`](#no-autoplay-audio) | Autoplaying audio should provide a pause/stop or volume-control mechanism | 1.4.2 | A | low | moderate |
| [`object-text-alternative-quality`](#object-text-alternative-quality) | &lt;object&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`office-document-link`](#office-document-link) | Downloadable office documents are accessible or have an accessible version | — | — | high | moderate |
| [`p-as-heading`](#p-as-heading) | Text styled to look like a heading should probably be a real heading | 1.3.1 | A | low | minor |
| [`page-has-heading-one`](#page-has-heading-one) | Page should have a level-one heading | — | — | medium | minor |
| [`page-title-patterns`](#page-title-patterns) | Page title patterns that may be insufficiently descriptive | 2.4.2 | A | medium | minor |
| [`password-paste-enabled`](#password-paste-enabled) | Authentication fields must not block pasting | 3.3.8 | AA | medium | serious |
| [`presentation-role-conflict`](#presentation-role-conflict) | Presentational role must not conflict with a global ARIA attribute or focusability | — | — | medium | minor |
| [`radio-group-present`](#radio-group-present) | Radio buttons sharing a name are grouped | — | — | medium | moderate |
| [`region`](#region) | Page content should be inside a landmark region | — | — | medium | minor |
| [`scope-attr-valid`](#scope-attr-valid) | scope attribute must have a valid value | — | — | medium | minor |
| [`scripted-components-review`](#scripted-components-review) | Scripted components are compatible with assistive technologies | — | — | medium | moderate |
| [`scrollable-region-focusable`](#scrollable-region-focusable) | Scrollable regions with no focusable content should be keyboard-focusable | 2.1.1, 2.1.3 | AAA | low | moderate |
| [`skip-link`](#skip-link) | Skip link must have a resolvable, usable target | — | — | medium | minor |
| [`svg-text-alternative-quality`](#svg-text-alternative-quality) | &lt;svg&gt; text alternative must be appropriate (manual review) | 1.1.1 | A | medium | minor |
| [`tabindex`](#tabindex) | tabindex should not be greater than 0 | — | — | medium | minor |
| [`table-duplicate-name`](#table-duplicate-name) | Table caption must not duplicate its summary attribute | — | — | medium | minor |
| [`table-fake-caption`](#table-fake-caption) | A table's first row should not stand in for a real &lt;caption&gt; | 1.3.1 | A | low | minor |
| [`th-scope-row-col`](#th-scope-row-col) | Table headers use scope="row" or scope="col" | — | — | medium | moderate |
| [`video-caption`](#video-caption) | Prerecorded video should provide a captions track | 1.2.2 | A | low | moderate |
| [`viewport-zoom-review`](#viewport-zoom-review) | Text can reach 200% zoom despite a viewport meta tag that limits zoom | — | — | medium | serious |

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

### `acme-statement-link`

**Pages link to the accessibility statement**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that the page links to the accessibility statement, by link text or URL, and under ACME 2.0 from its footer.

**Applies to.** Applies to a run over a whole document. A run narrowed by contextSelector, or by engineOptions.fragment, is notApplicable.

**Expectation.** The page has a link to the accessibility statement: a link whose text contains one of the accepted texts, or whose URL path contains one of the accepted paths. Under ACME 2.0 (profile acme-2.0) the link must also sit in the page's footer (a contentinfo landmark); under 1.0 it may be anywhere.

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

### `area-alt-source`

**Linked image-map areas are named by alt or aria-label**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Checks that each linked &lt;area&gt; of a used image map takes its text alternative from alt or aria-label, the two sources RGAA accepts, not only from title or aria-labelledby.

**Applies to.** Applies to &lt;area href&gt; elements in a &lt;map&gt; that an &lt;img usemap&gt; references, when the &lt;img&gt; is rendered, and that carry at least one non-empty name source: alt, aria-label, aria-labelledby or title. An &lt;area&gt; with none is left to area-alt-present. An &lt;area&gt; hidden from assistive technologies (aria-hidden="true") is left out. A page with none is notApplicable.

**Expectation.** The &lt;area&gt; has a non-empty alt or aria-label, the two sources RGAA 1.1.2 step 3 lists (the glossary entry "Alternative textuelle (image)" gives no aria-labelledby or title source for &lt;area&gt;). An &lt;area&gt; named only by title or aria-labelledby fails. A linked &lt;area&gt; always carries information: a decorative one has no href (1.2.2).

### `aria-allowed-attr`

**aria-* attributes must be permitted for the element’s role**

automatic · WCAG 4.1.2 (A) · confidence medium · default severity moderate

Checks that every recognized aria-* attribute present on an element with an explicit role is either globally supported or supported by that role.

**Applies to.** Applies to elements carrying at least one recognized, non-global aria-* attribute, judged against the role they actually have: an explicit valid role, else the implicit role of their tag, else, for the elements HTML-AAM maps to no role at all, nothing.

**Expectation.** Every recognized aria-* attribute present is either: (a) globally supported on any element (the "global" ARIA states/properties, e.g. aria-label/aria-hidden/aria-describedby), or (b) explicitly listed as a required or supported state/property for the element's role. An attribute ARIA deprecated (rather than prohibited) on the role is still allowed: it is reported as CANTTELL (see helpers.aria.isDeprecatedAttr) so the author decides, not as a not-allowed FAIL.

### `aria-allowed-role`

**Explicit role must be permitted for its host element**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that an explicit role="" attribute is one of the roles the ARIA-in-HTML specification permits for the host element (e.g. role="tab" is not permitted on &lt;nav&gt;).

**Applies to.** Applies to elements with an explicit, valid, non-abstract role, where the host element/attribute combination has an asserted permitted-roles constraint in the ARIA-in-HTML table (src/core/aria-helpers.js ALLOWED_ROLES_BY_ELEMENT).

**Expectation.** The explicit role is one of the roles the ARIA-in-HTML specification permits for that host element. Reported at CANTTELL rather than FAIL: ARIA-in-HTML's permitted-roles table is an author conformance requirement with no ACT rule and no WCAG mapping in any source. The role the author asked for is still the role assistive technology exposes, so whether the combination harms anyone depends on the widget, not on the table.

### `aria-attribute-conformance`

**aria-* attributes are valid for the W3C validator**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks, hidden content included, that every aria-* attribute is one the W3C validator knows, has a valid value, is allowed on its element and role, and does not contradict a native attribute, and that roles carry the attributes the validator requires.

**Applies to.** Applies to every element in the scan scope that has an aria-* attribute, or a role whose required state or property the validator checks, hidden content included: RGAA 8.2.1 judges the generated source code (« le code source généré de la page »), and the W3C validator named by its methodology checks hidden markup as well. A page with neither is notApplicable.

**Expectation.**

Each aria-* attribute passes the W3C validator (Nu HTML Checker), which RGAA 8.2.1 step 1 names: attributes and their values respect the writing rules (« Les balises, attributs et valeurs d'attributs respectent les règles d'écriture »). The rule fails where the validator reports an error:

- `unknownAttribute`: an aria-* name the validator does not know (aria-labeledby, aria-foo);
- `invalidValue`: a value that does not fit the attribute: an empty or misspelt token (aria-expanded="", aria-hidden="TRUE"), an integer out of range (aria-level="0", aria-setsize="-2"), an empty ID reference, or an aria-activedescendant that points to no element;
- `attributeNotAllowed`: an attribute the element's role does not support: aria-pressed on a link, aria-sort on a &lt;td&gt;, aria-expanded on the &lt;summary&gt; of a &lt;details&gt;, any aria-* on &lt;input type="hidden"&gt;;
- `namingProhibited`: aria-label, aria-labelledby or aria-braillelabel on an element whose role cannot be named (a &lt;div&gt;, &lt;span&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;code&gt; or &lt;caption&gt; with no role, even inside a button);
- `nativeCheckedConflict`: aria-checked on &lt;input type="checkbox"&gt; or &lt;input type="radio"&gt;, whatever its value;
- `nativeAttributeConflict`: an ARIA state that contradicts a native attribute (aria-disabled other than "true" with disabled, likewise aria-required with required, aria-readonly with readonly, aria-hidden with hidden), aria-placeholder with placeholder, aria-hidden on &lt;html&gt;, aria-hidden="true" on &lt;body&gt;;
- `missingRequired`: a role without the state or property the validator requires for it, even where WAI-ARIA gives a default value: role="heading" without aria-level, role="combobox" without aria-expanded, role="checkbox", "radio", "switch", "menuitemcheckbox" or "menuitemradio" without aria-checked, role="slider", "scrollbar" or "meter" without aria-valuenow.

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

### `aria-checked-state-mismatch`

**Native checkbox/radio aria-checked should match its actual state**

manual · WCAG 4.1.2 (A) · confidence medium · default severity moderate

Flags a native &lt;input type="checkbox"&gt;/&lt;input type="radio"&gt; whose explicit aria-checked value disagrees with its actual checked/indeterminate state, for manual review.

**Applies to.** Native `&lt;input type="checkbox"&gt;` / `&lt;input type="radio"&gt;` elements that carry an explicit `aria-checked` attribute.

**Expectation.** `aria-checked` is redundant on a native checkbox/radio (the role's checked state is already exposed natively), but when an author sets it explicitly it should agree with the element's actual state, otherwise assistive technology is told something different from what a sighted user perceives.

### `aria-conditional-attr`

**aria-errormessage requires aria-invalid to be set to a non-false value**

automatic · WCAG 4.1.2 (A) · confidence high · default severity moderate

Checks that elements with aria-errormessage also have aria-invalid set to "true", "grammar", or "spelling"; otherwise the error message is dropped from the accessibility tree.

**Applies to.** Elements with a non-empty `aria-errormessage` attribute.

**Expectation.** Per the ARIA specification, `aria-errormessage` is only exposed to assistive technology when `aria-invalid` is present with a value other than `"false"` (i.e. `"true"`, `"grammar"`, or `"spelling"`). An element with `aria-errormessage` but `aria-invalid` absent or `"false"` silently drops the error message from the accessibility tree, authors almost always intend it to be exposed. Reported at CANTTELL rather than FAIL: aria-errormessage is only exposed once aria-invalid is set, so the reference is currently inert. Whether that costs the user anything depends on whether the message is conveyed some other way (visible text next to the field, aria-describedby), which static markup does not settle.

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

**Expectation.**

No element with aria-hidden="true" may itself be focusable, and no focusable element may exist within an aria-hidden="true" subtree. Notes:

- Focusability is computed via ctx.helpers.getFocusableInfo (native + tabindex + contenteditable).
- Elements that are not rendered (e.g., display:none, visibility:hidden, [hidden]) are excluded.
- Disabled controls are not focusable, including those disabled by an ancestor &lt;fieldset disabled&gt; (matched with :disabled).
- &lt;area href&gt; has no box of its own, so it is judged by the &lt;img usemap&gt; that uses its &lt;map&gt;: it counts as focusable when such an image is rendered and not inert.
- Elements hidden via CSS in ways that still allow keyboard focus (e.g., opacity:0, off-screen, clip) remain in-scope and will be flagged when focusable.

### `aria-list-item-roles`

**ARIA lists use role="listitem" for their items**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Checks that the children of an element with role="list" have role="listitem", which RGAA requires of a list built with ARIA.

**Applies to.** Applies to every element other than &lt;ul&gt; and &lt;ol&gt; whose role attribute makes it a list (first token "list") and that has at least one child element other than &lt;script&gt; and &lt;template&gt;. Lists hidden by the default hidden-content policy are not checked. A page with none is notApplicable.

**Expectation.** Every child element has role="listitem". RGAA 9.3.1 and 9.3.2 accept a list built with &lt;ul&gt; or &lt;ol&gt; and &lt;li&gt;, or with role="list" and role="listitem" (step 2). A role="list" whose items are &lt;li&gt; elements without role="listitem", or other elements, is neither. Such a list is asked about (cantTell), never failed: 9.3.1 and 9.3.2 judge information "regroupées visuellement sous forme de liste", and whether the list reads as ordered (9.3.2) or unordered (9.3.1) is visual. A list whose children all have role="listitem" passes.

### `aria-prohibited-attr`

**ARIA naming attributes must not be used on roles that prohibit them**

automatic · WCAG 4.1.2 (A) · confidence high · default severity moderate

Checks that aria-label/aria-labelledby are not present on WAI-ARIA roles whose specification explicitly prohibits ARIA naming (e.g. generic, emphasis, strong, paragraph).

**Applies to.** Applies to (a) elements whose explicit, valid role is one of the ARIA 1.2 roles with a documented "Prohibited ARIA States and Properties" list for naming attributes (pure text-semantics / non-naming structural roles: caption, code, deletion, emphasis, generic, insertion, mark, none, paragraph, presentation, strong, subscript, suggestion, superscript, time), plus a native &lt;caption&gt; with no valid explicit role, whose implicit role is caption, and (b) elements with no role at all: a curated set of native HTML tags verified to carry no implicit role (see ROLELESS_NATIVE_TAGS below), or any autonomous custom element (a hyphenated, author-defined tag per the Custom Elements spec; see isRolelessCustomElementTag below). In both cases, only elements that also carry aria-label or aria-labelledby.

**Expectation.** Prohibited attributes must not be present on (a); for (b), the naming attribute is at best unreliable (nothing accessible-name-aware to hang it off) and at worst silently ignored by assistive technology. See the roleless-branch implementation note below for the confidence split this produces.

### `aria-prohibited-children`

**Container roles must not own a child with a disallowed role**

automatic · WCAG 1.3.1 (A) · confidence medium · default severity moderate

Checks that every accessible-tree-owned child of a container role (list, listbox, menu, menubar, radiogroup, rowgroup, table, grid, treegrid, tablist, tree, row) has one of that role's allowed owned roles.

**Applies to.** Applies to elements with an explicit, valid role that is one of the container roles with a documented "required owned elements" entry (the same REQUIRED_OWNED_ROLES table aria-required-children uses, see src/core/aria-helpers.js).

**Expectation.** Every accessible-tree-owned descendant of the container (after pruning role="none"/"presentation" elements and any "group"/ "rowgroup" wrapper, both always transparent for owned-element matching per WAI-ARIA, regardless of whether "group"/"rowgroup" is itself in the container's own required-owned-roles set) has a role from that same required-owned set. Nothing else is a structurally valid direct child of a composite/container role, where "allowed" is the container's required-owned roles plus the small ALLOWED_EXTRA_OWNED_ROLES set of roles it may own without being required to (a separator between menu items, a caption on a grid). A roleless wrapper is descended into to reach the items a component library buries inside it, but once one is found there the rest of that wrapper's subtree is the item's own content and is not judged against the container.

### `aria-required-attr`

**Roles with a required ARIA state/property must carry it**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with an explicit role carry every unambiguous, context-independent required aria-* state/property for that role (e.g. role="checkbox" must have aria-checked).

**Applies to.** Applies to elements with an explicit, valid, non-abstract role that is also one of the small set of roles with a documented, context- independent required state/property (checkbox, combobox, heading, menuitemcheckbox, menuitemradio, meter, radio, scrollbar, separator, slider, switch) -- except when that explicit role is identical to the element's own native/implicit role (ACT 4e8ab6: e.g. &lt;input type="checkbox" role="checkbox"&gt;, which is exempt because the native control's own state exposure already covers it; no aria-checked is required. helpers.aria.getNativeRoleForElement resolves this). A native &lt;input type="checkbox"&gt; or &lt;input type="radio"&gt; with another checkable role (switch, menuitemcheckbox, menuitemradio, or checkbox on a radio and the reverse) is in scope, but its aria-checked counts as supplied: the browser exposes the input's own checked state (HTML-AAM), so it passes without the attribute.

**Expectation.**

Every required state/property for that role is present and non-empty. Graded by whether ARIA supplies a stand-in for the missing attribute:

- FAIL where it does not, so the state is simply not exposed (aria-checked on checkbox/radio/switch/menuitemcheckbox/menuitemradio, aria-valuenow on slider/scrollbar/meter and on a focusable separator).
- CANTTELL where ARIA defines an implicit value the role falls back to (aria-expanded on combobox, aria-level on heading), so the role still exposes a value and only the author knows whether it is the right one.

### `aria-required-children`

**Container roles must own at least one required child role**

automatic · WCAG 1.3.1 (A) · confidence medium · default severity moderate

Checks that container roles with a documented "required owned elements" entry (list, listbox, menu, radiogroup, table, grid, tablist, tree, row, ...) contain at least one descendant or aria-owns-referenced element with an acceptable owned role.

**Applies to.** Applies to elements with an explicit, valid, non-abstract role that is also one of the container roles with a documented "required owned elements" entry (list, listbox, menu, menubar, radiogroup, rowgroup, table, grid, treegrid, tablist, tree, row).

**Expectation.** At least one descendant, or one aria-owns-referenced element, has one of the acceptable owned roles for that container role. Reported at CANTTELL, never FAIL: this rule asks only whether the required content is PRESENT, and a container that owns nothing conveys nothing false -- an empty role="list" is announced as a list with no items, which is what it is. Whether the content a container does own is VALID is aria-prohibited-children's decision, and that rule still fails, so a genuinely misdescribed structure (a role="button" among list items, a tablist of plain buttons) is caught with the same strength as before. The native-HTML equivalents already work this way: nothing in this ruleset fails an empty &lt;ul&gt;, and list-children-valid judges only the children that exist.

### `aria-required-parent`

**Roles requiring a specific context role must be in that context**

automatic · WCAG 1.3.1 (A) · confidence medium · default severity moderate

Checks that roles with a documented "required context role" entry (listitem, option, tab, treeitem, row, cell, ...) have an ancestor or aria-owns owner with an acceptable context role.

**Applies to.** Applies to elements with an explicit, valid, non-abstract role that is also one of the roles with a documented, non-empty "required context role" entry (listitem, option, menuitem, menuitemcheckbox, menuitemradio, tab, treeitem, row, cell, gridcell, columnheader, rowheader, rowgroup).

**Expectation.** The element has an ancestor (DOM containment) or owner (via that ancestor/owner's aria-owns) whose effective role is one of the acceptable context roles for this element's role.

### `aria-role-conformance`

**Role attributes are valid for the W3C validator**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks, hidden content included, that every role attribute holds roles the W3C validator accepts, that the role is allowed on its element, and that an &lt;img&gt; with a role has a non-empty alt or an ARIA name.

**Applies to.** Applies to every element with a role attribute in the scan scope, hidden content included: RGAA 8.2.1 judges the generated source code (« le code source généré de la page »), and the W3C validator named by its methodology checks hidden markup as well. A page with no role attribute is notApplicable.

**Expectation.**

Each role attribute passes the W3C validator (Nu HTML Checker), which RGAA 8.2.1 step 1 names: its value respects the writing rules (« Les balises, attributs et valeurs d'attributs respectent les règles d'écriture »). The rule fails where the validator reports an error:

- `emptyRole`: the attribute holds no token;
- `unknownRoleToken`: a token that is not a role the validator accepts, alone or in a list: a misspelling, an abstract role (widget, landmark), a token written with capitals (BUTTON), or a role the validator rejects (generic, mark, comment, suggestion, doc-pageheader, doc-pagefooter);
- `roleNotAllowed`: the first recognised token is a role ARIA in HTML does not allow on this element (a tab on &lt;nav&gt;, a navigation on &lt;main&gt;, any role on a &lt;td&gt; in a native table, on the &lt;summary&gt; of a &lt;details&gt;, on &lt;caption&gt;, on &lt;input type="hidden"&gt;, or a role other than listitem on an &lt;li&gt; in a list);
- `imgRoleEmptyAlt`: an &lt;img&gt; with a role and alt="";
- `imgRoleNoName`: an &lt;img&gt; with a role and no alt, aria-label or aria-labelledby attribute.

It asks (cantTell) in one case, `imgPresentationRole`: an &lt;img&gt; with role="presentation" and an empty or missing alt. The validator reports an error there, but RGAA 1.2.1 names role="presentation" on an &lt;img&gt; as a way to mark a decorative image, so whether the audit counts it against 8.2.1 is left to the auditor.

### `aria-role-name-present`

**ARIA roles that require an accessible name have one**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that the ARIA roles WAI-ARIA requires an accessible name for expose a non-empty one.

**Applies to.** Applies to elements whose role attribute is exactly one of grid, meter, progressbar, radiogroup or tree, and that are included in the accessibility tree. Membership is decided by WAI-ARIA's own "Accessible Name Required: True" characteristic, not by whether a role merely permits a name: tablist, toolbar, menu, menubar and scrollbar are name-from-author roles the spec does not require a name for, and are out of scope. meter and progressbar are also covered by meter-name-present and progressbar-name-present, which map to SC 1.1.1; this rule is what gives those two roles their 4.1.2 coverage.

**Expectation.** The element has a non-empty aria-label, an aria-labelledby that resolves to non-empty text, or a non-empty title. Every role in the set is name-from-author-only, so descendant text is not accepted: a labelled child inside a composite widget would otherwise pass the container that has no name of its own. The name the HTML host element gives itself counts too, since the browser still computes it under the role: the first child &lt;legend&gt; of a &lt;fieldset&gt;, the first child &lt;caption&gt; of a &lt;table&gt;, and an associated &lt;label&gt; on a labelable element such as &lt;progress&gt; or &lt;meter&gt;.

### `aria-roles-valid`

**role attribute must be a valid, non-abstract ARIA role**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that an explicit role="" attribute resolves to a real, non-abstract WAI-ARIA role.

**Applies to.** Applies to any element with a non-empty role="" attribute in the composed DOM.

**Expectation.**

At least one role token names a concrete, non-abstract ARIA role. Graded by what the element falls back to when none does:

- FAIL on a roleless host (div, span, custom element), which is left exposed as generic, so the role the author meant reaches no one.
- CANTTELL where the element has a native role (a &lt;button&gt;, &lt;nav&gt;, &lt;a href&gt;), which the accessibility tree keeps using. ACT 674b10 lists 4.1.2 as a secondary requirement only, "satisfied through the implicit role," so the bad token is worth reporting but is not itself the criterion failing.

### `aria-text`

**role="text" elements should have no focusable descendants**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that elements with role="text" contain no focusable descendant (link, button, form control, tabindex, iframe, or contenteditable).

**Applies to.** Elements with an explicit `role="text"`.

**Expectation.** `role="text"` tells assistive technology to treat an element's whole subtree as a single unit of plain text (e.g. text visually split across multiple `&lt;span&gt;`s by styling). Per the WAI-ARIA Authoring Practices, this only makes sense when that subtree contains no focusable content: a focusable descendant inside a "this is just text" region is unreachable or confusing for keyboard/AT users.

### `aria-valid-attr`

**aria-* attributes must be real, defined ARIA attributes**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that every aria-* attribute name present in the DOM is a real attribute defined by the WAI-ARIA specification.

**Applies to.** Applies to any element in the composed DOM that carries at least one attribute whose name starts with "aria-".

**Expectation.** Each aria-* attribute name is a real attribute defined by the WAI-ARIA specification (catches typos / made-up attribute names, which are silently ignored by assistive technology and therefore a real, deterministic defect). Reported at CANTTELL rather than FAIL: an aria-* attribute the spec does not define is inert, so nothing about the element's exposed name, role or value changes because it is there. Where the author meant a real attribute and the element ends up without a name, that absence is the naming rules' decision, not this one's. ACT 5f99a7 maps 1.3.1/4.1.2 as secondary requirements, "less strict" than the rule itself.

### `aria-valid-attr-value`

**aria-* attribute values must match their declared type**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that every recognized aria-* attribute has a value conforming to its WAI-ARIA-declared value type (boolean, tristate, token, integer, number, or ID reference).

**Applies to.** Applies to any element carrying at least one recognized aria-* attribute (unrecognized attribute names are aria-valid-attr's concern, not evaluated here).

**Expectation.** Each attribute's value conforms to its WAI-ARIA-declared value type: boolean ("true"/"false"), tristate ("true"/"false"/"mixed"), a token from a fixed enumerated set, an integer (within the range WAI-ARIA sets for it), a real number, or an ID reference (list) that resolves to an existing element in the document. Per ACT 6a7281's own applicability ("any state or property that is NOT empty"), an explicitly empty value, including a bare boolean-style attribute with no "=value" at all, e.g. `aria-checked` alone, is out of scope for every value type, not a violation: a common, deliberate pattern in templated markup (e.g. React conditionally rendering `aria-describedby={hasError ? errorId : ''}`).

### `autocomplete-valid`

**autocomplete attribute must be a valid autofill value**

automatic · WCAG 1.3.5 (AA) · confidence high · default severity moderate

Checks that a non-empty autocomplete attribute is "on"/"off" or a well-formed autofill detail token list.

**Applies to.** Applies to form controls (input, select, textarea) with a non-empty autocomplete attribute. Disabled controls (the disabled attribute, including a control disabled by a disabled fieldset ancestor, or aria-disabled="true") and input types with a fixed value are exempt, as in ACT 73f2c2.

**Expectation.** The value is "on"/"off" alone, or a well-formed autofill detail token list: an optional "section-*" token, then an optional "shipping"/"billing" token, then an optional contact-modality token (home/work/mobile/fax/pager), then exactly one recognized field-name token (name, email, street-address, cc-number, tel, ...), optionally followed by "webauthn". The field name must also suit the control: the HTML Standard gives each field name a control group, and each group is allowed only on some input types (street-address only on textarea or select; email only on text, search or email inputs; and so on). A malformed or unsuitable value means the field is not reliably identified for assistive technology that relies on autocomplete to describe the expected input purpose.

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

**Expectation.** The control has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. A native checkbox or radio additionally accepts an associated &lt;label&gt;, the labels API, a wrapping &lt;label&gt;, or label[for], with at most four labels read for determinism, and any other element accepts its own subtree text, those roles being name-from-content.

### `button-name-present`

**Buttons have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that buttons expose a non-empty accessible name.

**Applies to.** Applies to &lt;button&gt;, &lt;input type="button"&gt;, &lt;input type="submit"&gt;, &lt;input type="reset"&gt; and elements with role="button", where the element is included in the accessibility tree. role="presentation"/"none" takes an element out of scope unless a global ARIA attribute or focusability restores its role, per presentational roles conflict resolution.

**Expectation.** The element has a non-empty accessible name. A programmatic name is taken first (aria-labelledby, aria-label, an associated &lt;label&gt;, title). Failing that, an &lt;input&gt; button falls back to its value attribute, and type="submit"/type="reset" fall back to the user agent's own "Submit"/"Reset" default, which is why those two are never nameless. Failing both, a button whose role is name-from-content falls back to its subtree text, counting each descendant's own name (an &lt;img alt&gt;, aria-label, an &lt;svg&gt;'s &lt;title&gt; child, or title) rather than only text nodes.

### `bypass-blocks-present`

**Page must provide a way to bypass repeated blocks**

manual · WCAG 2.4.1 (A) · confidence medium · default severity moderate

Checks that the page has at least one recognized WCAG 2.4.1 bypass-blocks mechanism: a main landmark, a working same-page anchor link, or a heading.

**Applies to.** Always applicable to any HTML document with a &lt;body&gt; element: "bypass blocks" is a whole-page concern, matching aria-hidden-body / page-title-present's pattern of evaluating the document directly rather than a scoped root.

**Expectation.** At least one of the following recognized WCAG 2.4.1 techniques is present: (a) a main landmark (&lt;main&gt; or [role="main"]), technique ARIA11: a screen reader user can jump straight to it, bypassing everything before it (nav, header, repeated blocks) in one step; (b) a working same-page anchor link, technique G1/G123: an &lt;a href="#id"&gt; (or legacy &lt;a name="id"&gt;) whose target resolves to a real element in the link's own tree (light DOM or the same shadow root). Not required to be positioned before a &lt;nav&gt; or be keyboard-focus-order-first (see implementation notes); (c) at least one heading (&lt;h1&gt;-&lt;h6&gt; or [role="heading"]) that is both included in the accessibility tree AND visible (not off-screen, clipped, opacity:0, or zero-size-overflow-hidden), technique H69: heading navigation is itself a standards-recognized bypass mechanism (e.g. a screen reader's "jump by heading" command), but ACT 047fe0's own Expectation requires visibility too, since a screen-reader-only heading leaves sighted keyboard users with no equivalent way to locate the start of non-repeated content.

### `canvas-decorative-aria-hidden`

**Decorative &lt;canvas&gt; images have aria-hidden="true" and no alternative**

automatic · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that a &lt;canvas&gt; marked decorative has aria-hidden="true", no aria-labelledby, aria-label or title, and no alternative content inside it.

**Applies to.** Applies to &lt;canvas&gt; elements marked decorative: with aria-hidden="true" on the element, or with role="none"/"presentation". A &lt;canvas&gt; inside a &lt;figure&gt; that has a &lt;figcaption&gt; is left out: criterion 1.2 does not apply to an image with a caption (légende). Content hidden with CSS or the hidden attribute is left out too. A page with none is notApplicable.

**Expectation.**

RGAA 1.2.5: a decorative &lt;canvas&gt; has aria-hidden="true", no aria-labelledby, aria-label or title, no text alternative on its children, and no text between &lt;canvas&gt; and &lt;/canvas&gt;. Fails:

- aria-hidden="true" with any of those alternatives. If the canvas is decorative, it breaks 1.2.5; if it carries information, hiding it breaks 1.1.8. Either way the page fails;
- role="none"/"presentation" without aria-hidden="true", and no fallback content. The role shows the author meant the image as decorative, and RGAA asks for aria-hidden="true" there; if it carries information after all, it has no alternative and fails 1.1.8.

Asks (cantTell): role="none"/"presentation" without aria-hidden="true" but with fallback content. If the canvas carries information, that content is its alternative and 1.1.8 passes; if it is decorative, it breaks 1.2.5.

### `canvas-role-img`

**&lt;canvas&gt; images have role="img" with an ARIA name, or fallback content**

automatic · no formal WCAG SC mapping · confidence medium · default severity serious

Checks each &lt;canvas&gt; against RGAA 1.1.8: role="img" named by aria-labelledby or aria-label, or fallback content, or a link or button to an alternative content right after it.

**Applies to.** Applies to &lt;canvas&gt; elements. One with aria-hidden="true", on itself or an ancestor, or with role="none"/"presentation", is left out: it is marked decorative, which canvas-decorative-aria-hidden checks (1.2.5). Content hidden with CSS or the hidden attribute is left out too. A page with none is notApplicable.

**Expectation.**

RGAA 1.1.8 passes when one of these holds:

- the &lt;canvas&gt; has role="img" and a text alternative from aria-labelledby or aria-label (steps 3 and 4);
- otherwise, alternative content sits between &lt;canvas&gt; and &lt;/canvas&gt;, or a link or button right after it gives access to an alternative content, or a mechanism replaces it (step 6).

Passes: role="img" with aria-labelledby or aria-label; or, without role="img", fallback content (text, or an element with alt or aria-label text). Fails:

- role="img" with no aria-labelledby or aria-label. The methodology's note is explicit: "si l'élément &lt;canvas&gt; dispose d'un rôle img, son alternative ne peut être fournie que par les techniques listées à l'étape 4", so fallback content, title and an adjacent link do not count;
- no role="img", an aria-label, aria-labelledby or title, but no fallback content and no link or button after it (the name alone is not one of the step 6 options);
- nothing at all.

Asks (cantTell): no role="img" and no fallback content, but a link or button right after the &lt;canvas&gt; (does it lead to an alternative content?).

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

### `combobox-name-present`

**Comboboxes have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="combobox" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="combobox" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="combobox" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom combobox widget is not reliably exposed as its name. On a labelable element (&lt;input role="combobox"&gt;) an associated &lt;label&gt; counts as well. On a text-like &lt;input&gt; or a &lt;textarea&gt;, the placeholder counts last (HTML-AAM's final name source): a placeholder-only label is a 3.3.2 question, not a missing name.

### `complex-table-summary`

**Complex data tables have a summary**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

Flags a data table whose headers are not all in the first row or column, or head only a group of rows or columns, and that has no aria-describedby (nor, before HTML5, a summary attribute), for a person to check that a summary is available.

**Applies to.**

Applies to complex data tables, in RGAA's sense: tables whose header cells are not all in the first row or the first column, or whose headers do not apply to a whole row or column. A &lt;table&gt;, or an element with role="table" (5.1.1 step 1), counts as complex when:

- a header cell (&lt;th&gt;, role="columnheader" or role="rowheader") sits outside both the first row and the first column;
- a cell uses the headers attribute;
- a header has scope="rowgroup" or scope="colgroup"; or
- two or more first-row headers each span several columns (as in "2025" and "2026" over their quarters), or two or more first-column headers each span several rows, so each heads a group of columns or rows rather than whole ones.

Tables with role="presentation" or "none" are left out. A page with none is notApplicable.

**Expectation.** A complex table without aria-describedby, and without a summary attribute where one still counts, is flagged for a person to check that a summary is available, as RGAA 5.1.1 asks: in the &lt;caption&gt;, or in a passage near the table. The summary attribute counts only on a &lt;table&gt; in a document whose doctype is not HTML5: 5.1.1 step 2 accepts it only "dans les versions de HTML et de XHTML antérieures à HTML 5". A document with no doctype is not HTML5. An ARIA table's summary comes only through aria-describedby.

### `complex-table-summary-quality`

**Complex data table summaries are relevant**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

Flags a complex data table that has a summary (caption, aria-describedby, or before HTML5 a summary attribute), for a person to check that it explains the nature and structure of the table.

**Applies to.**

Applies to complex data tables that have a summary. Complex is decided as complex-table-summary does for 5.1.1: a &lt;table&gt;, or an element with role="table", where

- a header cell (&lt;th&gt;, role="columnheader" or role="rowheader") sits outside both the first row and the first column;
- a cell uses the headers attribute;
- a header has scope="rowgroup" or scope="colgroup"; or
- two or more first-row headers each span several columns, or two or more first-column headers each span several rows.

Tables with role="presentation" or "none" are left out. The summary is what 5.1.1 step 2 accepts (5.2.1 step 1 refers to it):

- a &lt;caption&gt; with text, on a &lt;table&gt;;
- an aria-describedby that points to an element with text;
- a summary attribute with text on a &lt;table&gt;, only in a document whose doctype is not HTML5 (« dans les versions de HTML et de XHTML antérieures à HTML 5 »; glossary "Résumé (de tableau)"). A document with no doctype is not HTML5.

A page with no such table is notApplicable, including a simple table and an HTML5 table whose only summary is the summary attribute.

**Expectation.** Each complex table with a summary is asked about (cantTell): RGAA 5.2.1 asks whether the summary is relevant, that is whether it explains the nature and structure of the table. Only a person can tell, and a caption may hold only the table's title.

### `contrast-computable`

**Color contrast is computable for rendered text**

automatic · WCAG 1.4.3, 1.4.6 (AAA) · confidence high · default severity serious

Determines whether sufficient information is available to compute WCAG color contrast for visible text (e.g., no gradients/images/blend modes that make background indeterminate).

**Applies to.** Applies to every visible text node in scope, plus the label of &lt;input type="button"&gt;/[type="submit"]/[type="reset"], which is rendered from the value attribute and so is invisible to a text-node walk. Text counts only when its element is DOM-visible under the run's visibility mode, is not clipped out of sight by the sr-only technique (clip or clip-path), and belongs neither to a disabled control nor to the label of one, WCAG's inactive-user-interface-component exception. Subtrees excluded via engineOptions.excludeSelectors are skipped, and open shadow roots are walked as roots in their own right.

**Expectation.** Both sides of the contrast calculation can be established from CSS for every applicable text node: an effective background resolving to an opaque color, and a parsable foreground color. Where either cannot be, a background image or gradient, mix-blend-mode, a filter or backdrop-filter, a text-shadow (which may add contrast this engine has no glyph-rendering model to account for), ancestor opacity, a root background that never becomes opaque, or a color that does not parse, the result is cantTell naming the blocker. This rule is the one that reports that uncertainty, which is what lets contrast-minimum and contrast-enhanced stay silent on the same text instead of guessing at a ratio.

### `contrast-enhanced`

**Text meets enhanced color contrast (AAA)**

automatic · WCAG 1.4.6 (AAA) · confidence high · default severity serious

Checks that visible text has a contrast ratio of at least 7:1 (normal) or 4.5:1 (large), when contrast is computable from CSS.

**Applies to.** Applies to the visible text contrast-computable applies to, see that rule for the eligibility gates, narrowed to text whose background and foreground are actually computable. Eligible text that is not computable leaves this rule notApplicable rather than cantTell: reporting that uncertainty belongs to contrast-computable, so the two never report the same text twice.

**Expectation.** Every computable text node reaches the ratio SC 1.4.6 requires for its size: 4.5:1 for large text, 7:1 for everything else. Text is large at 24px or more, or at 14pt (about 18.667px) or more when the computed font weight is 700 or higher.

### `contrast-minimum`

**Text meets minimum color contrast (AA)**

automatic · WCAG 1.4.3 (AA) · confidence high · default severity serious

Checks that visible text has a contrast ratio of at least 4.5:1 (normal) or 3:1 (large), when contrast is computable from CSS.

**Applies to.** Applies to the visible text contrast-computable applies to, see that rule for the eligibility gates, narrowed to text whose background and foreground are actually computable. Eligible text that is not computable leaves this rule notApplicable rather than cantTell: reporting that uncertainty belongs to contrast-computable, so the two never report the same text twice.

**Expectation.** Every computable text node reaches the ratio SC 1.4.3 requires for its size: 3:1 for large text, 4.5:1 for everything else. Text is large at 24px or more, or at 14pt (about 18.667px) or more when the computed font weight is 700 or higher.

### `contrast-minimum-rgaa`

**Text meets RGAA minimum color contrast**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that visible text has a contrast ratio of at least 4.5:1, or 3:1 for text of 24px or more and bold text of 18.5px or more (RGAA 3.2), when contrast is computable from CSS.

**Applies to.** The same text as contrast-minimum: visible text that contrast-computable applies to, narrowed to text whose background and foreground are computable. Eligible text that is not computable leaves this rule notApplicable; contrast-computable asks about it.

**Expectation.** Every computable text node reaches the ratio RGAA 3.2 requires for its size: 3:1 for text of 24px or more (3.2.3), and for bold text (computed weight 700 or more) of 18.5px or more (3.2.4); 4.5:1 for everything else (3.2.1, 3.2.2). The only difference from contrast-minimum is the bold threshold: WCAG's 14pt is about 18.67px, so bold text from 18.5px up to 18.67px needs 3:1 here and 4.5:1 there.

### `css-focus-indicator-suppressed`

**Focus indicator must not be removed without a replacement**

manual · WCAG 2.4.7 (AA) · confidence medium · default severity serious

Flags elements in the tab order whose focus outline is removed, by a :focus/:focus-visible rule or by a rule with no state such as a { outline: none }, with no replacement indicator (border, box-shadow, background, ...) in any focus rule matching them.

**Applies to.** Elements in sequential focus navigation (tabbable and rendered) on a page whose accessible stylesheets contain at least one rule that removes the outline. With no such rule anywhere, every element keeps the user agent's own indicator and there is nothing to check.

**Expectation.** No element is matched by a rule that removes the outline (`outline: none`, `outline: 0`, `outline-color: transparent`, ...) unless some focus rule matching it draws a replacement: a border, box-shadow, background, color change, a positive outline of its own, or a `::before`/`::after` decoration. The removing rule is either a `:focus`/`:focus-visible` rule, or a rule with no state at all (`a { outline: none }`, `* { outline: 0 }`): an author declaration outranks the user agent's focus outline whatever its specificity, so it removes the indicator in the focused state too (WCAG F78).

### `css-hidden-focus`

**Focusable elements must not be visually hidden**

manual · WCAG 2.4.7 (AA) · confidence low · default severity serious

Checks that keyboard-focusable elements are not visually hidden by CSS techniques that can leave them in the tab order.

**Applies to.** Applies to elements that are tabbable (keyboard-focusable) but are visually hidden via CSS techniques that can leave them in the tab order.

**Expectation.**

No element should be tabbable while visually hidden (e.g., opacity:0, clipped, off-screen). An element that CSS brings back into view when it takes focus is not hidden while focused, and is not flagged: the usual skip-link pattern (`.skip { position: absolute; left: -9999px } .skip:focus { left: 0 }`), or a hiding rule that stops applying on focus (`.visually-hidden-focusable:not(:focus) { clip: rect(0 0 0 0) }`). Notes:

- This rule intentionally targets CSS techniques that *can* keep an element focusable.
- Elements removed from rendering (display:none, visibility:hidden, [hidden]) are excluded.
- The rule uses deterministic heuristics (computed style parsing) and does not rely on layout geometry.
- The focused style is worked out from the stylesheets, not by focusing the element: a DOM emulator does not restyle `:focus`. Rules whose subject carries `:focus`, `:focus-visible` or `:focus-within` (or an ancestor carries `:focus-within`) are laid over the computed style in document order; a rule written `:not(:focus)` / `:not(:focus-within)` / `:not(:focus-visible)` has its declarations reset to their initial values. Inline style outranks a stylesheet rule unless the rule is `!important`. The overlay ignores specificity among the focus rules, and cross-origin stylesheets cannot be read, so their focus rules are not seen.

### `css-orientation-lock`

**CSS must not lock the page to a single orientation**

automatic · WCAG 1.3.4 (AA) · confidence high · default severity serious

Checks that no @media (orientation: portrait|landscape) rule sets a transform: rotate(...) on the page, a known technique for defeating device orientation, and asks about any such rule that hides the page's main content.

**Applies to.** Any accessible (same-document, non-cross-origin) stylesheet, inline `&lt;style&gt;` blocks and same-origin `&lt;link&gt;` stylesheets already loaded into `document.styleSheets`.

**Expectation.** No `@media (orientation: portrait)` or `@media (orientation: landscape)` block sets a `transform`/`-webkit-transform`/`rotate` rotation of approximately 90 degrees (mod 180, i.e. ~90 or ~270), the well-known technique for visually forcing one orientation regardless of the device's actual orientation, which defeats WCAG 1.3.4's requirement that content not restrict its view to a single display orientation unless that orientation is essential. Such a rotation fails. A second shape is asked about (cantTell): an orientation media block that hides the page's content with `display: none` or `visibility: hidden`, the usual form of WCAG F100 (content replaced by a "rotate your device" message in one orientation). The hidden element counts as the page's content when it is `html` or `body`, the `main` landmark, an ancestor of it, or, on a page without a main landmark, an element holding at least half of the body's text. Whether the orientation is essential, and whether the page stays usable, is left to a person.

### `data-table-headers-review`

**Tables with no header cells are checked for unmarked headers**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

Flags a table of at least two rows and two columns with no &lt;th&gt; and no columnheader or rowheader role, for a person to check whether it is a data table whose headers should be marked up.

**Applies to.** Applies to a &lt;table&gt;, or an element with role="table", that has at least two rows and two columns and no header cell at all: no &lt;th&gt; (without another role) and no cell with role="columnheader" or role="rowheader". Tables with role="presentation" or "none" are left out, and so is a table with no text in its cells.

**Expectation.** Each such table is asked about (cantTell). RGAA 5.6.1 and 5.6.2 want each header that applies to a whole column or row marked with &lt;th&gt; or a columnheader or rowheader role. A data table usually has headers in its first row or column, but only a person can tell whether this one does, or whether it is a layout table, which 5.3 and 5.8 cover.

### `definition-list-children-valid`

**Description lists must be structured correctly**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;dl&gt; elements only directly contain &lt;dt&gt;/&lt;dd&gt; groups (optionally wrapped in one &lt;div&gt;), &lt;script&gt;, &lt;template&gt;, or &lt;style&gt;.

**Applies to.** Applies to &lt;dl&gt; elements that have at least one direct element child or non-whitespace text directly inside them.

**Expectation.** Every direct element child is &lt;dt&gt;, &lt;dd&gt;, &lt;script&gt;, &lt;template&gt;, &lt;style&gt;, or a &lt;div&gt; whose own children are drawn from that same set (a single level of wrapping div is allowed, matching how authors commonly group dt/dd pairs). Non-whitespace text directly inside the &lt;dl&gt; or a wrapping &lt;div&gt; is an invalid child too. If the flattened set contains any &lt;dt&gt; or &lt;dd&gt; at all, it must contain BOTH (an unbalanced dt-without-dd or dd-without-dt is invalid), and read in order it must be groups of one or more &lt;dt&gt; followed by one or more &lt;dd&gt;: a &lt;dd&gt; before the first &lt;dt&gt; has no term, and a &lt;dt&gt; after the last &lt;dd&gt; has no definition. A flattened set with neither is vacuously fine, not a violation (see implementation-notes). Any other direct or wrapped child breaks the description-list semantics assistive technologies rely on.

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

### `dir-attribute-valid`

**dir attributes are ltr or rtl**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks that every dir attribute is ltr or rtl, the two values RGAA accepts.

**Applies to.** Applies to elements carrying a dir attribute. An element with dir="auto" applies only when its text (content, or the value of a text field) contains a strong character of the direction opposite to the one it inherits: RGAA 8.10.2 step 1 covers only the passages of 8.10.1, text that reads in the reverse direction of the document. A page with no applicable element is notApplicable.

**Expectation.** The value is ltr or rtl, in any case (RGAA 8.10.2: « La valeur de l'attribut dir est conforme (rtl ou ltr) »). Surrounding spaces are not ignored: HTML matches the keyword exactly, apart from case, so a browser ignores dir=" rtl ". dir="auto", which HTML allows, fails with its own reasonCode on reverse-direction text, since RGAA names only those two values. Whether the direction is the right one is the relevance condition of the same test, left to a person.

### `dlitem-parent-valid`

**Description-list items must be inside a description list**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;dt&gt;/&lt;dd&gt; elements are contained by a &lt;dl&gt;, directly or via one wrapping &lt;div&gt;.

**Applies to.** Applies to &lt;dt&gt;/&lt;dd&gt; elements that have a parent element.

**Expectation.** The parent is &lt;dl&gt;, or the parent is a &lt;div&gt; whose own parent is &lt;dl&gt; (a single level of wrapping div is allowed, matching how authors commonly group dt/dd pairs). A &lt;dt&gt;/&lt;dd&gt; used outside a real description-list container is not exposed as a term/definition to assistive technologies.

### `doctype-position`

**The doctype comes before the &lt;html&gt; tag**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that a declared doctype comes before the &lt;html&gt; tag in the source, reading the page source given as the page.source probe when the parser has dropped it (RGAA 8.1.3).

**Applies to.** Applies to a run over a whole document that declares a doctype (RGAA 8.1.3: « possédant une déclaration de type de document »). A page whose source has none is notApplicable: doctype-present fails it under 8.1.1. A run narrowed by contextSelector, or by engineOptions.fragment, is notApplicable.

**Expectation.**

RGAA 8.1.3: the doctype comes before the &lt;html&gt; tag in the source.

- A doctype in the DOM passes: the HTML parser keeps one only when it comes before &lt;html&gt;, so the DOM settles it with no other input.
- With no doctype in the DOM, the source as the server sent it is needed, through the `page.source` probe: `{ url, start }`, start being the first 2,000 characters of the response body (the engine cuts longer probe strings). Comments are skipped. A doctype that comes after &lt;html&gt; fails (DOCTYPE_AFTER_HTML); a source with &lt;html&gt; and no doctype is notApplicable; a start that shows neither is asked about (SOURCE_TOO_SHORT).
- With no doctype in the DOM and no probe, the rule asks (SOURCE_MISSING): the doctype may be missing or misplaced.

### `doctype-present`

**Page declares a doctype**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that the document has a doctype, written before the &lt;html&gt; element.

**Applies to.** Applies to a run over a whole document. A run narrowed by contextSelector, or by engineOptions.fragment, is notApplicable: a subtree has no doctype of its own.

**Expectation.** The document has a doctype (RGAA 8.1.1). A doctype written after &lt;html&gt; is dropped by the HTML parser, so without the page's source it reads as missing here. With the `page.source` probe (the start of the response body, see doctype-position), a doctype the source shows after &lt;html&gt; is present and passes: its place is 8.1.3's question, which doctype-position fails.

### `doctype-valid`

**Declared doctype is valid**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that a declared doctype is the HTML5 doctype or one of the doctypes the W3C recommends.

**Applies to.** Applies to a run over a whole document that declares a doctype. A page with no doctype is notApplicable here: doctype-present fails it under RGAA 8.1.1. A run narrowed by contextSelector, or by engineOptions.fragment, is notApplicable: a subtree has no doctype of its own.

**Expectation.** The doctype is valid (RGAA 8.1.2: « le type de document (balise doctype) est-il valide ? »): its name is html, and it is either the HTML5 doctype (no public identifier, and no system identifier or about:legacy-compat) or one of the W3C recommended doctypes for HTML 2.0 to 4.01, XHTML 1.0, XHTML 1.1, XHTML Basic, XHTML 1.1 plus MathML 2.0 (plus SVG 1.1), XHTML+RDFa 1.0 and 1.1, and HTML 4.01+RDFa 1.1. Public identifiers are compared without regard to case.

### `duplicate-id`

**IDs must be unique**

automatic · WCAG 4.1.1 (A) · confidence high · default severity moderate

Checks that every non-empty id attribute value is unique within its own document or shadow tree (WCAG 2.0/2.1 SC 4.1.1, removed in WCAG 2.2).

**Applies to.** Applies to any element carrying a non-empty id attribute. Visibility is irrelevant. A duplicate id breaks the same lookups whether the element renders or not, which is why ACT 3ea0c8 evaluates hidden elements too.

**Expectation.** No other element in the same tree carries the same id value, compared exactly as written (id="a " and id="a" are different ids). Ids are scoped per document tree and per shadow tree, so the same id inside two different shadow roots is not a duplicate.

### `duplicate-id-aria`

**IDs referenced by ARIA must be unique**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that any id value referenced by an ARIA ID-reference attribute (aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-activedescendant, aria-flowto, aria-errormessage, aria-details) is unique in the document.

**Applies to.** Applies when the document contains at least one non-empty aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-activedescendant, aria-flowto, aria-errormessage, or aria-details attribute (i.e. at least one ARIA ID reference exists to resolve).

**Expectation.** For every id value referenced by one of those attributes, exactly one element in the document carries that id. A duplicate does not break the reference: it resolves to the first element in tree order, so the name is still computed. Whether that element is the intended target depends on author intent, which markup does not carry, so the outcome is cantTell.

### `embed-image-role-img`

**Embedded images have role="img" and a text alternative**

automatic · no formal WCAG SC mapping · confidence medium · default severity serious

Checks that each &lt;embed type="image/…"&gt; has role="img" and a text alternative (aria-labelledby, aria-label or title), or is followed by a link or button to an alternative content.

**Applies to.** Applies to &lt;embed&gt; elements whose type attribute starts with image/ (RGAA 1.1.7 covers "balise &lt;embed&gt; avec l'attribut type="image/…"" only; an &lt;embed&gt; with another type, or none, is out of scope). An &lt;embed&gt; with aria-hidden="true", on itself or an ancestor, or with role="none"/"presentation", is left out: it is marked decorative, which 1.2.6 covers. Content hidden with CSS or the hidden attribute is left out too. A page with none is notApplicable.

**Expectation.**

RGAA 1.1.7 passes when one of these holds:

- the &lt;embed&gt; has a text alternative (aria-labelledby, aria-label or title) and role="img";
- it is immediately followed by a link or button that gives access to an alternative content;
- a mechanism lets the user replace it with an alternative content.

Passes: role="img" and a text alternative. Fails: no text alternative and no link or button right after it. Asks (cantTell):

- a text alternative without role="img". The test wording requires both, but the methodology validates on the alternative alone (steps 2 to 4), so RGAA does not say which reading wins;
- no text alternative, but a link or button right after the &lt;embed&gt; (does it lead to an alternative content?).

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

### `embedded-refresh-review`

**Embedded content that may refresh itself lets the user control the refresh**

manual · no formal WCAG SC mapping · confidence low · default severity moderate

Flags &lt;object&gt;, &lt;embed&gt;, &lt;canvas&gt; and scripted &lt;svg&gt; elements, for a person to check whether they refresh their content on their own and, if so, whether the user can stop, slow down or be warned of the refresh.

**Applies to.**

Applies to the elements RGAA 13.1.1 lists as refresh methods, other than &lt;meta&gt;:

- every &lt;object&gt; and &lt;embed&gt;, except one that shows a still image (a `type` of image/* other than image/svg+xml, or with no `type`, a `data` or `src` ending in a raster image extension);
- every &lt;canvas&gt;, since a script draws it and may redraw it;
- every &lt;svg&gt; that contains a &lt;script&gt;.

Hidden elements count, as they can still reload content. An element inside an &lt;object&gt; already asked about is its fallback and is left out.

**Expectation.** Each element found is asked about (cantTell). If it refreshes its content on its own, RGAA 13.1.1 wants the user to be able to stop or restart the refresh, lengthen the delay tenfold, be warned in time to lengthen it, or the delay to be twenty hours at least. The markup does not show whether any refresh happens.

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

### `fake-list`

**Text laid out as a list uses list markup**

manual · no formal WCAG SC mapping · confidence low · default severity moderate

Flags consecutive lines or paragraphs that start with bullets or consecutive numbers but are not marked up as a list, for a person to decide whether they are one.

**Applies to.** Applies to text outside any list that looks like one: two or more lines of one element, split by &lt;br&gt;, or two or more consecutive sibling paragraphs, each starting with the same bullet character (•, -, *, …) or with consecutive numbers ("1.", "2." or "1)", "2)"). A page with none is notApplicable.

**Expectation.** Such text is flagged for a person to decide whether it is a list, which RGAA 9.3.1 (bullets) and 9.3.2 (numbers) want marked up with &lt;ul&gt;/&lt;ol&gt; and &lt;li&gt;, or role="list" and role="listitem".

### `field-group-legend`

**Groups of form fields have a legend**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

Flags a &lt;fieldset&gt; without a legend, or a role="group" or role="radiogroup" without aria-label or aria-labelledby, holding form fields, for a person to decide whether it groups fields of the same kind.

**Applies to.** Applies to &lt;fieldset&gt; elements and elements with role="group" or role="radiogroup" that contain at least one form field (input other than hidden, select, textarea, or an element with a form field role). A page with none is notApplicable.

**Expectation.** RGAA 11.6.1 step 2: a &lt;fieldset&gt; has a &lt;legend&gt; child with text; an element with role="group" or role="radiogroup" has an aria-label or an aria-labelledby that resolves to text. A fieldset that itself carries role="group" or role="radiogroup" may use either. aria-label on a plain fieldset, and title on a group, do not count: step 2 names only those mechanisms. A group without one is flagged for a person to decide whether it groups fields of the same kind, which is when RGAA 11.6.1 requires a legend, and, if so, whether every field instead carries a title, aria-label, aria-labelledby or aria-describedby that names the group (step 3).

### `field-label-in-name-sources`

**Every label source of a form field contains its visible label**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that the aria-label, aria-labelledby, title and &lt;label&gt; of a form field with a visible label each contain that label, as RGAA 11.2.5 requires.

**Applies to.** Applies to the form fields of RGAA's glossary entry "Champ de saisie de formulaire" (native &lt;input&gt; other than the button types and hidden, &lt;select&gt;, &lt;textarea&gt;, &lt;output&gt;, &lt;progress&gt;, &lt;meter&gt;, and the textbox, searchbox, combobox, spinbutton, slider, listbox, checkbox, radio, switch and progressbar roles) that have a visible label and at least one label source other than the one the visible label is read from. The visible label is the visible text of the field's &lt;label&gt;, else of the elements its aria-labelledby points to, else, for the checkbox, radio and switch roles, the field's own text. A field whose visible label is not tied to it in the markup is not found. A page with no such field is notApplicable.

**Expectation.** RGAA 11.2.5: when present, the aria-label, the text aria-labelledby points to, the title and the content of the &lt;label&gt; each contain the visible label. Punctuation and capital letters are ignored (the particular cases of 11.2); accents are not folded. A source that does not contain it fails.

### `field-label-listed-source`

**Form fields have a label from a source RGAA lists**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that each form field has an aria-labelledby, an aria-label, a &lt;label for&gt; or a title, the label sources RGAA 11.1.1 lists.

**Applies to.** Applies to the form fields of RGAA's glossary entry "Champ de saisie de formulaire": &lt;input&gt; of any type except submit, reset, button, image and hidden; &lt;select&gt;; &lt;textarea&gt;; &lt;output&gt;; &lt;progress&gt;; &lt;meter&gt;; and elements with role progressbar, meter, slider, spinbutton, textbox, listbox, searchbox, combobox, checkbox, radio or switch. option, optgroup and datalist are left out: a literal reading would ask for a label on every option. An element with role="button", and a field hidden from assistive technologies (aria-hidden, hidden content) are out of scope. A page with no such field is notApplicable.

**Expectation.** The field meets one of the conditions of RGAA 11.1.1: an aria-labelledby that points to a passage of text, an aria-label, a &lt;label for&gt; pointing at it, or a title. The fifth condition (an adjacent button) also needs one of these as the field's name. A field with none of them fails: a placeholder, the field's own content (a role="checkbox" named by its text) and an &lt;output&gt;'s value do not count.

### `figure-caption-structure`

**Images with a caption use the figure structure RGAA describes**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks that a &lt;figure&gt; holding an image and a &lt;figcaption&gt; has role="figure" or "group" and an aria-label matching the caption.

**Applies to.** Applies to &lt;figure&gt; elements that contain an image (&lt;img&gt;, &lt;input type="image"&gt; or an element with role="img") and a &lt;figcaption&gt; with text. A page with none is notApplicable.

**Expectation.** The &lt;figure&gt; has role="figure" or role="group", and an aria-label whose text is the same as the caption's, whitespace collapsed (RGAA 1.9.1). The caption being inside a &lt;figcaption&gt; is what makes the figure applicable.

### `focus-indicator-contrast`

**Author focus indicators have a contrast ratio of at least 3:1**

automatic · no formal WCAG SC mapping · confidence medium · default severity serious

Checks that an outline, border or box-shadow drawn by a :focus or :focus-visible rule in place of the browser outline has a contrast ratio of at least 3:1 with the colors next to it, and asks when it cannot be computed.

**Applies to.** Applies to elements in the tab order that are rendered, whose native focus outline an author rule replaces or removes: a `:focus` or `:focus-visible` rule on the element (or a rule with no state, or its style attribute) sets `outline-style` or `outline-width`, through the `outline` shorthand or the longhands, and the rule that wins the cascade is not `outline: auto`. The element must also have an author indicator to measure: a visible outline, border or box-shadow from a focus rule, or another focus style. An element that keeps the browser's outline meets RGAA 10.7.1's first condition and is not checked. An element whose outline is removed with no replacement at all is left to css-focus-indicator-suppressed. A page with none is notApplicable.

**Expectation.** RGAA 10.7.1, step 2: the indicator is « suffisamment contrastée (ratio de contraste égal ou supérieur à 3.0) ». Each outline, border or box-shadow of the focus style is measured against the two colors it touches: the background behind the element and the element's own background (only the latter for an inset shadow). The element passes when one indicator reaches 3:1 against both. It fails when every indicator is below 3:1 against both and nothing else changes on focus. It is asked about (cantTell) otherwise: a color or background the engine cannot compute (background image, gradient, `var()`, a translucent page root in strict contrast mode), a blurred shadow, an indicator that reaches 3:1 against one side only, a focus style made of other changes (background, text color, underline, a pseudo-element, a rule that styles another element), or a cascade the engine cannot settle.

### `focus-order-semantics`

**Elements added to the tab order should have interactive semantics**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Flags elements with tabindex &gt;= 0 whose explicit role is a non-interactive structural/document role (e.g. heading, list, region, presentation), for manual review.

**Applies to.** Elements with an explicit `tabindex` of `0` or greater (in the tab order) AND an explicit `role` attribute that is one of a curated set of clearly non-interactive, structural/document roles.

**Expectation.** An element placed in the tab order on purpose should communicate why it's focusable: a role like `heading`, `list`, `region`, or `presentation` gives assistive technology no interactive semantic to announce, which is confusing for keyboard users who land on it and get no indication of what activating it (if anything) would do.

### `form-button-label-in-name-sources`

**The accessible name of a button in a form contains its visible label**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that each button inside a form (a &lt;form&gt; or role="form") has an accessible name that contains its visible label, as RGAA 11.9.2 requires, and asks about other label sources that do not.

**Applies to.** Applies to the buttons of RGAA's glossary entry "Bouton (formulaire)" (&lt;button&gt;, &lt;input&gt; of type submit, reset or button, and role="button") inside a &lt;form&gt; or an element with role="form", that show a visible label (their text, or the value of an &lt;input&gt; button) and carry an aria-label, aria-labelledby or title. An image button shows its label inside the image, which this engine cannot read, and a button that joins a form only through its form attribute is not « au sein » of it: both are left out. A page with no such button is notApplicable.

**Expectation.** RGAA 11.9.2 methodology step 2: the button's accessible name contains its visible label. Punctuation and capital letters are ignored (the particular cases of 11.2, which 11.9.2 refers to); accents are not folded. An accessible name that does not contain it fails.

### `form-button-name-present`

**Buttons in a form have a label**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that each button inside a form (a &lt;form&gt; or role="form") has a label that RGAA 11.9.1 can judge.

**Applies to.** Applies to the buttons of RGAA's glossary entry "Bouton (formulaire)" (&lt;button&gt;, &lt;input&gt; of type submit, reset, button or image, and role="button") that sit inside a form: a &lt;form&gt; element or an element with role="form" (glossary "Formulaire"). RGAA 11.9.1 step 1 covers « les boutons présents au sein d'un formulaire », so a button outside any form is out of scope. A button hidden from assistive technologies, or whose explicit role is another one (role="tab", role="none"), is out of scope too. A page with no such button is notApplicable.

**Expectation.** The button has a label: an aria-labelledby passage, an aria-label, the alt of an image button, the value of an &lt;input&gt; button, the content of a &lt;button&gt; or role="button" element (an image's alt, an &lt;svg&gt;'s &lt;title&gt; and the like count), or a title. A button with none of them has no label to be relevant, and fails 11.9.1 step 2. A submit or reset &lt;input&gt; with no value shows the browser's own label ("Submit", "Reset") and passes; whether the label is relevant is left to a person, as the rest of 11.9.1 is.

### `form-control-label-quality`

**Form field labels should be descriptive and distinguishable**

manual · WCAG 2.4.6 (AA) · confidence medium · default severity minor

Flags a visible form-field label that is a placeholder ("Label", "Field"), or that repeats another field's label with no visible context (heading, legend, or row) telling the two apart. English placeholders are always recognized, and German, Spanish, French or Japanese ones when the field is in that language.

**Applies to.** Visible form fields: native `input` (excluding hidden and the button-like types), `select`, `textarea`, or an element with one of the ARIA widget roles ACT cc0f0a lists (checkbox, combobox, listbox, menuitemcheckbox, menuitemradio, radio, searchbox, slider, spinbutton, switch, textbox) that carry a visible programmatic label: a `&lt;label&gt;` association, or the elements `aria-labelledby` points at. A field named only by `aria-label`/`title` has no visible label to judge and is out of scope here (its labelling mechanism is `form-control-programmatic-label-quality`'s concern, its presence `form-control-programmatic-label-present`'s).

**Expectation.** The visible label text (a) is not a placeholder left in the markup ("label", "field", "enter text", ...), (b) is not shared with another field that no visible context tells apart (the same "Name" twice, with nothing visible on screen saying which is shipping and which is billing), and (c) is the whole of the field's programmatic label, not the visible fragment of a label whose descriptive part is hidden.

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

All-empty associations with no override are a missing-name case (the sibling rule below), not an ambiguity, so this rule stays silent.

### `frame-title-attribute-present`

**Frames have a title attribute**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that every &lt;iframe&gt; and &lt;frame&gt; has a title attribute, unless it is hidden with aria-hidden="true".

**Applies to.** Applies to every &lt;iframe&gt; and &lt;frame&gt; in the scan scope that is not hidden from assistive technologies by aria-hidden="true", on itself or on an ancestor. The RGAA glossary "Titre de cadre", note 2, makes criteria 2.1 and 2.2 not applicable to such a frame. A frame removed from the tab order (tabindex="-1") is still in scope. Frames hidden by the default hidden-content policy (display:none, hidden) are not checked. A page with no applicable frame is notApplicable.

**Expectation.** The frame has a title attribute (RGAA 2.1.1: « Chaque cadre (balise &lt;iframe&gt; ou &lt;frame&gt;) a-t-il un attribut title ? »). An accessible name from aria-label or aria-labelledby does not replace it. An empty title is present, so it passes here; it cannot be relevant, which is what frame-title-not-empty reports under 2.2.1.

### `frame-title-not-empty`

**Frame titles are not empty**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that the title attribute of every &lt;iframe&gt; and &lt;frame&gt; that has one is not empty.

**Applies to.** Applies to every &lt;iframe&gt; and &lt;frame&gt; in the scan scope that has a title attribute and is not hidden from assistive technologies by aria-hidden="true", on itself or on an ancestor (RGAA glossary "Titre de cadre", note 2). Frames hidden by the default hidden-content policy are not checked. A frame with no title attribute is left to frame-title-attribute-present (2.1.1). A page with no applicable frame is notApplicable.

**Expectation.** The title is not empty and not only whitespace. RGAA 2.2.1 asks whether the content of the title attribute is relevant, and an empty one says nothing about the frame. That is all this rule decides: whether a non-empty title is relevant is for a person (iframe-title-unique asks about frames that share a title).

### `heading-content-present`

**Headings have content**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that each heading holds text or an image with a text alternative, rather than being empty or named only by attributes.

**Applies to.** Applies to the headings RGAA defines (glossary "Titre"), included in the accessibility tree: &lt;h1&gt;-&lt;h6&gt; without a role other than heading, and elements with role="heading" and an aria-level attribute. An element with role="heading" but no aria-level is not an RGAA heading; heading-role-level-present reports it. A heading hidden only visually (a screen-reader-only class) is still a heading, as the glossary says. A page with none is notApplicable.

**Expectation.**

The heading's content holds text, or an image with a text alternative (alt, aria-label, aria-labelledby, title, or the &lt;title&gt; of an &lt;svg&gt;). RGAA 9.1.2 asks whether the content of each heading is relevant; a heading with no content has nothing to judge, so it fails. When the content gives no text but the heading is not empty, the rule asks instead:

- the heading is named only by its own title, aria-label or aria-labelledby, or by an aria-label on an element inside it: 9.1.2 judges the content, and whether such a name makes it relevant is left to a person;
- the content is text hidden from assistive technologies (aria-hidden="true"), an image with no text alternative, text added by CSS (::before, ::after), or an embedded element such as a form field or a frame.

### `heading-order`

**Heading levels must not skip a level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that heading levels increase by at most one at a time in document order.

**Applies to.** Applies whenever the page contains two or more heading elements (native &lt;h1&gt;-&lt;h6&gt;, or explicit role="heading" with aria-level; default level 2 per the ARIA spec when aria-level is absent/invalid). A native &lt;hx&gt; with a valid aria-level (a positive integer) takes that level, as browsers expose it; otherwise it takes its tag level.

**Expectation.** In document order, each heading's level is no more than one greater than the highest heading level seen so far. Jumping deeper by more than one level (e.g. an &lt;h1&gt; followed directly by an &lt;h3&gt;, skipping &lt;h2&gt;) breaks the document outline assistive technology users rely on when navigating by heading. Going back to a shallower level at any point is always fine.

### `heading-quality`

**Heading text should be descriptive, not a placeholder**

manual · WCAG 2.4.6 (AA) · confidence medium · default severity minor

Flags headings whose accessible name is a placeholder rather than a description of the content that follows: a generic word ("Heading", "Untitled"), a numbered template slot ("Section 2"), a filename, or a URL. English phrases are always recognized, and German, Spanish, French or Japanese ones when the heading is in that language.

**Applies to.** Elements with a heading role (native &lt;h1&gt;-&lt;h6&gt;, or any element with an explicit role="heading") that are included in the accessibility tree and have a non-empty accessible name. A heading with no name at all is `empty-heading`'s concern, not this rule's.

**Expectation.** The heading's accessible name, normalized (whitespace-collapsed, case-folded, trailing punctuation stripped), is not a placeholder left in the markup: a known generic word ("heading", "title", "untitled", "lorem ipsum", ...), a numbered template slot ("Heading 2", "Section 3"), a filename, or a URL. None of these describe the topic or purpose of the content they introduce.

### `heading-role-level-present`

**ARIA headings have an aria-level attribute**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that each element with role="heading" also has an aria-level attribute.

**Applies to.** Applies to elements other than &lt;h1&gt;-&lt;h6&gt; whose role is heading, that are included in the accessibility tree. A native &lt;hx&gt; is a heading by its tag, whatever its attributes, so it is not matched. A page with no such element is notApplicable.

**Expectation.** The element has an aria-level attribute whose value is a number. RGAA defines a heading as an &lt;hx&gt; element or an element with both role="heading" and aria-level (glossary "Titre"), and 9.1.3 step 1 accepts only these two structures ("un attribut WAI-ARIA aria-level=x", "x" being a number). WAI-ARIA gives role="heading" a default level of 2, which WCAG accepts, but RGAA does not.

### `html-elements-attributes-valid`

**HTML elements and attribute values are valid**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks, hidden content included, for obsolete or unknown elements and for invalid dir, id, lang, xml:lang, scope, headers, optgroup label, image button alt and autocomplete values, as the W3C validator reports them.

**Applies to.** Applies to every HTML element in the scan scope, hidden or not: RGAA 8.2.1 judges the generated source, which the W3C validator reads whole (helpers.queryAllSource). Elements in SVG or MathML are left out. The checks follow HTML5; a page whose doctype is neither HTML5 nor missing is asked about instead (see below).

**Expectation.**

« Les balises, attributs et valeurs d'attributs respectent les règles d'écriture » (RGAA 8.2.1). Each case below is an error of the W3C validator (Nu checker 26.9.27, the version the expected outcomes were checked against), and fails:

- obsoleteElement: an element HTML makes obsolete (blink, marquee, center, font, big, tt, strike, acronym, applet, dir, frame, and so on);
- unknownElement: an element HTML does not define whose name is not a valid custom element name (foo, font-face);
- dirValue: dir other than ltr, rtl or auto (case aside), spaces included; auto on bdo;
- idValue: an empty id, or one with whitespace;
- langValue: a lang value that is not a well-formed BCP 47 language tag (en_US, en-US-US, fr-FR-!!, " en"). An empty lang is allowed; whether the language subtag is registered is left to html-lang-code-valid (8.4.1) and valid-lang (8.8.1);
- xmlLangMismatch: xml:lang without lang, or with a different value (case aside);
- scopeValue: a scope on th other than row, col, rowgroup or colgroup (case aside), spaces or empty value included;
- scopeElement: scope on an element other than th or td (on td it is only a validator warning);
- headersTarget / headersEmpty: a headers token that names no th of the same table (a td, a caption, an element outside the table or in a nested table), or an empty headers attribute;
- optgroupLabel: an optgroup with no label attribute and no legend child;
- inputImageAlt: input type=image with no alt, or an empty one;
- autocompleteValue: an empty autocomplete, a token list that is not a valid autofill detail list, on or off on input type=hidden, or a form autocomplete other than on or off. Disabled fields are included;
- autocompleteControl: a field name whose control group the input type does not accept (street-address on a text input, email on a number input);
- autocompleteType: autocomplete on an input type that does not take it (checkbox, radio, file, submit, image, reset, button).

### `html-lang-attr-present`

**Page language is declared**

automatic · WCAG 3.1.1 (A) · confidence high · default severity serious

Checks that the default language of the page is programmatically declared.

**Applies to.** Applies to HTML documents with a root &lt;html&gt; element. The rule evaluates the document element only and does not iterate over child nodes. Non-HTML documents or documents without a document element are not applicable.

**Expectation.** The &lt;html&gt; element has a lang attribute. The lang attribute is not empty and its primary language subtag (the part before the first hyphen) is a registered language subtag, as ACT bf051a requires and as the RGAA glossary "Code de langue" reads it ("ne concerne que la partie [code] avant le tiret"). A malformed later subtag (lang="fr-FR-!!") still identifies French, so it passes here; it is a markup validity error, not a missing language.

### `html-lang-code-valid`

**Default language code is valid**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that the language code of lang and xml:lang on &lt;html&gt; is a valid ISO 639 code.

**Applies to.** Applies to a run over a whole document whose &lt;html&gt; element has a non-empty lang or xml:lang attribute: RGAA 8.4.1 covers only pages « ayant une langue par défaut ». Each of the two attributes is judged when present. A page with neither is notApplicable here; the missing language is page-language-present's matter (8.3.1). A run narrowed by contextSelector or engineOptions.fragment is notApplicable.

**Expectation.** The language code, which the RGAA glossary "Code de langue" defines as the part before the first hyphen, is two or three letters and is an ISO 639-1, ISO 639-2 or later ISO 639 code (8.4.1 step 2, « conforme à la norme ISO 639-1 ou ISO 639-2 et suivantes »). What follows the hyphen is left to the author: lang="fr-FR-!!" passes here, and its malformed region is a markup validity question. Whether the code names the page's main language (« pertinent ») is for a person.

### `html-nesting-valid`

**HTML elements are nested as HTML allows**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks, hidden content included, that lists, description lists, links, buttons, server-side image maps and &lt;main&gt; elements are nested as the HTML standard and the W3C validator require.

**Applies to.** Applies to every ul, ol, menu, li, dl, dt, dd, a, button, img[ismap] and main element in the scan scope, hidden or not: RGAA 8.2.1 judges the generated source, which the W3C validator reads whole (helpers.queryAllSource). Elements in SVG or MathML are not HTML elements and are left out. A page with none of them is notApplicable. The checks follow the HTML nesting rules; a page whose doctype is neither HTML5 nor missing is asked about instead (see below).

**Expectation.**

« L'imbrication des balises est conforme » (RGAA 8.2.1). Each case below is an error of the W3C validator (Nu checker 26.9.27, the version the expected outcomes were checked against), and fails:

- listChild / listText: a child element of ul, ol or menu other than li, script or template, or text directly inside the list;
- listItemParent: an li whose parent is not ul, ol or menu, whatever role the parent has;
- dlChild / dlText / dlGroupOrder / dlMixedGroups / dlItemParent: the dl content model. A dl holds groups of one or more dt followed by one or more dd, or div elements that each hold one such group (script and template are allowed anywhere); no other element and no text. A dt or dd must sit in a dl, or in a div child of a dl;
- interactiveDescendant / tabindexDescendant: interactive content (a, button, details, embed, iframe, label, select, textarea, input other than type=hidden, img[usemap], audio or video with controls) or an element with a tabindex attribute inside an a or a button. The rule applies to every a, with or without href, and counts a disabled control or a hidden descendant too, as the validator does;
- ismapOutsideLink: an img with ismap and no a[href] ancestor;
- extraMain: more than one main element in the document without its own hidden attribute. A main hidden by CSS, aria-hidden or a hidden ancestor still counts.

### `html-xml-lang-mismatch`

**lang and xml:lang must not disagree**

automatic · WCAG 3.1.1 (A) · confidence high · default severity serious

Checks that the &lt;html&gt; element's lang and xml:lang attributes declare the same primary language, when both are present.

**Applies to.** Applies when the &lt;html&gt; element has both a non-empty lang attribute and a non-empty xml:lang attribute.

**Expectation.** The primary language subtag (the part before the first "-") of lang and xml:lang match, case-insensitively. When both attributes are present but declare different languages, assistive technology and user agents may resolve the page's language inconsistently.

### `identical-iframes-same-purpose`

**Frames with the same name embed the same resource**

automatic · WCAG 4.1.2 (A) · confidence medium · default severity moderate

Checks that &lt;iframe&gt;/&lt;frame&gt; elements sharing an accessible name embed the same resource, since one name can only describe one resource.

**Applies to.** Applies to each set of two or more &lt;iframe&gt;/&lt;frame&gt; elements that are included in the accessibility tree and share the same non-empty accessible name, compared with whitespace collapsed. A frame named only by a mechanism that names nothing, or hidden from the accessibility tree, is not part of a set; a set needs two surviving members to exist at all.

**Expectation.** Every frame in a set resolves to the same resource. A shared name describes one resource, so two frames answering to it must embed the same one.

### `identical-links-same-purpose`

**Links with the same accessible name should lead to the same destination**

manual · WCAG 2.4.9 (AAA) · confidence low · default severity minor

Flags groups of links that share the same accessible name but resolve to more than one distinct destination, for manual review of whether they serve the same purpose.

**Applies to.** Any `a[href]` or `[role="link"]` with a non-empty accessible name, grouped by that name (trimmed, whitespace-collapsed, case-folded).

**Expectation.** Within a page, links that share the same accessible name are expected to serve the same purpose (i.e. resolve to the same destination, the full resolved URL, including any fragment). Same-text-different- destination links are common and frequently intentional in real sites (e.g. repeated "Read more" links per article card), so this is authored as `type: 'manual'` (cantTell-capped, never fail) rather than a hard fail, flagging a real name/destination mismatch for human judgment instead of guessing intent.

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

**Frame titles must be unique**

automatic · WCAG 4.1.2 (A) · confidence high · default severity moderate

Checks that frames sharing a title attribute value load the same resource; frames with different sources and the same title are asked about.

**Applies to.** Applies to &lt;iframe&gt;/&lt;frame&gt; elements that carry a non-empty title attribute.

**Expectation.** Frames in scope that share the same (trimmed, case-sensitive) title attribute value load the same resource (the same resolved src, or the same srcdoc). Such a group passes: the same content under the same title is what ACT 4b1c6c accepts. A group whose frames load different resources is cantTell: a shared title may stop assistive technology users from telling the frames apart, but the frames may also serve the same purpose (two instances of one widget), which only a person can judge. Every frame of such a group is reported.

### `image-alt-long`

**Text alternatives of images are short**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Flags an image whose text alternative is longer than 80 characters, for a person to decide whether it is short and concise enough.

**Applies to.** Applies to images that carry a text alternative: &lt;img&gt;, &lt;area&gt;, &lt;input type="image"&gt;, &lt;svg&gt;, &lt;canvas&gt;, &lt;object&gt;, &lt;embed&gt;, and any element whose role (first token) is img. The alternative can come from alt (on &lt;img&gt;, &lt;area&gt; and &lt;input type="image"&gt;), aria-label, aria-labelledby (the text it resolves to), title, or an &lt;svg&gt;'s own &lt;title&gt; child, the sources RGAA's image tests list. A page with none is notApplicable.

**Expectation.** A text alternative longer than 80 characters (spaces collapsed), from any of those sources, is flagged for a person to decide whether it is short and concise, as RGAA 1.3.9 asks, or one of the particular cases it allows. RGAA's test gives no number: 80 characters is a threshold for asking, not a limit. The occurrence lists each source over the threshold. Fallback content of &lt;canvas&gt; and &lt;object&gt; is not measured.

### `image-redundant-alt`

**Image alt text must not duplicate adjacent visible text**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that an &lt;img&gt; alt text is not identical to other visible text already present in its immediate parent element.

**Applies to.** Applies to &lt;img&gt; elements with non-empty alt text whose immediate parent element also has other visible text content (i.e. text nodes besides the image itself, commonly an &lt;a&gt; or &lt;button&gt; wrapping both an icon image and a text label).

**Expectation.** The image's alt text is not the same (case-insensitive, normalized) as the other visible text already in the same parent. When both are present, assistive technology announces the same words twice for a single control (e.g. an icon-plus-text link where the icon's alt duplicates the link text).

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

### `img-decorative-no-alternative`

**Decorative images have no aria-labelledby, aria-label or title**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks that an &lt;img&gt; marked decorative (alt="", aria-hidden="true" or role="presentation") has no aria-labelledby, aria-label or title attribute.

**Applies to.** Applies to &lt;img&gt; elements marked decorative: alt="", aria-hidden="true" on the element, or role="presentation"/"none". An &lt;img&gt; inside a &lt;figure&gt; that has a &lt;figcaption&gt; is left out: criterion 1.2 does not apply to an image with a caption (légende). Content hidden with CSS or the hidden attribute is left out too. A page with none is notApplicable.

**Expectation.** RGAA 1.2.1 step 2: "vérifier que l'image ne possède pas d'attributs aria-labelledby, aria-label ou title". An image marked decorative that has none of them, with a non-empty value, passes. Fails: aria-hidden="true" together with one of them. The image is hidden from assistive technologies, so it is decorative for them; if it carries information after all, hiding it fails 1.1.1 instead. Either way the page fails. Asks (cantTell): alt="" or role="presentation"/"none", without aria-hidden="true", together with one of them. The image may be informative, and then 1.2.1 does not apply and 1.1.1 accepts aria-label, aria-labelledby or title as its alternative. A person decides which.

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

### `keyboard-only-event-handlers`

**Keyboard-only inline event handlers should have a pointer equivalent**

manual · no formal WCAG SC mapping · confidence low · default severity moderate

Flags elements that are not interactive natively and have an inline key handler (onkeydown, onkeyup, onkeypress) but no click or pointer handler, for a person to check that the action also works with a mouse, touch or stylus.

**Applies to.** Applies to elements that carry a non-empty inline key handler (`onkeydown`, `onkeyup` or `onkeypress`) and are not interactive natively: not a link or area with href, button, input other than hidden, select, textarea, option, summary, details, label, iframe, embed, audio or video with controls, img with usemap, or an element made editable with contenteditable. Hidden content is skipped, as in the other rules. A page with no such element is notApplicable.

**Expectation.** Each such element with no inline click or pointer handler (`onclick`, `ondblclick`, `onmousedown`, `onmouseup`, `onpointerdown`, `onpointerup`, `ontouchstart`, `ontouchend`) is flagged (cantTell) for a person to check RGAA 7.3.1 steps 4 and 5: the action is also available with any pointing device (mouse, touch, stylus), on this element or on another element of the page that does the same thing. Never pass or fail.

### `label-for-target-valid`

**Labels point to a form field**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that the for attribute of each &lt;label&gt; matches the id of a form field it can label.

**Applies to.** Applies to &lt;label&gt; elements carrying a for attribute. A page with none is notApplicable.

**Expectation.** The first element in the label's own tree whose id equals the for value exists and is labelable: &lt;button&gt;, &lt;input&gt; other than type="hidden", &lt;meter&gt;, &lt;output&gt;, &lt;progress&gt;, &lt;select&gt;, &lt;textarea&gt;, or a form-associated custom element (RGAA 11.1.2). A for attribute that matches nothing means the label labels nothing, not even a field nested inside it, since the HTML association falls back to the label's content only when for is absent. A target that is not labelable but has a form-field ARIA role (textbox, combobox, listbox, searchbox, spinbutton, slider, progressbar, checkbox, radio, switch, option: the roles the RGAA glossary "Champ de saisie de formulaire" counts as fields) passes: 11.1.2 asks only that the field has an id equal to the for value. HTML does not let such a label name the field, and that missing name belongs to 11.1.1, not here.

### `label-in-name`

**Label in Name: accessible name contains visible text**

automatic · WCAG 2.5.3 (A) · confidence high · default severity serious

Checks that when a control has a visible text label, the accessible name contains that visible label text (WCAG 2.5.3).

**Applies to.** Applies to controls that carry aria-label or aria-labelledby, are visually rendered, and have visible label text this engine can extract deterministically, from an associated &lt;label&gt;, from the control's own rendered text, or from the elements aria-labelledby points at. The candidates are &lt;button&gt;, &lt;a href&gt;, &lt;summary&gt;, non-hidden form controls, and the button, link, checkbox, radio, switch, searchbox, tab, menuitem, menuitemcheckbox, menuitemradio, option, treeitem and gridcell roles, minus anything hidden or disabled. aria-hidden is not excluded: it changes nothing about what is rendered on screen, which is what this SC is about.

**Expectation.** The accessible name contains the visible label's words, adjacent and in order. The comparison is over words rather than characters: parenthesised text is dropped, case is folded, text is NFKC-normalised, and every character that is not a letter, digit or combining mark becomes a separator, so punctuation and spacing differences never decide the outcome. Accents are not folded: "Déposer" stays one word, and a name that drops an accent ("Deposer") does not contain it. RGAA likewise excuses only punctuation and capital letters. Four shapes markup cannot settle are reported as cantTell instead of fail: a word hyphenated differently in the two places; a visible word the author may have abbreviated, marked by its trailing period; visible text rendered through a known icon font (the DOM text is real words, but nothing readable actually renders); and a whole visible label of exactly one character that doesn't even appear inside the accessible name, which per ACT 2ee8b8 may be "non-text content" (e.g. "X" meaning "close") rather than literal text.

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

**Applies to.** Applies whenever the page contains at least one banner candidate: explicit role="banner", OR a &lt;header&gt; with NO role attribute at all, regardless of nesting (see implementation notes on why candidate selection is unconditional on purpose).

**Expectation.** No banner candidate has an ancestor that is itself any landmark region. A banner nested inside another landmark is not a top-level, whole-page banner and confuses landmark-based navigation for assistive technology users.

### `landmark-complementary-is-top-level`

**Complementary landmark must be top-level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the complementary landmark (role="complementary" or an &lt;aside&gt; that keeps its implicit role) is not nested inside another landmark region.

**Applies to.** Applies whenever the page contains at least one element carrying the complementary role: explicit role="complementary", or an &lt;aside&gt; that keeps its implicit role (see implementation notes on when it does not).

**Expectation.** No complementary candidate has an ancestor that is itself a landmark region. Complementary content supports the main content of the page and sits beside it; nested inside another landmark it is a section of that landmark instead, which is not what landmark navigation announces.

### `landmark-contentinfo-is-top-level`

**Contentinfo landmark must be top-level**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the contentinfo landmark (role="contentinfo" or a non-nested &lt;footer&gt;) is not nested inside another landmark region.

**Applies to.** Applies whenever the page contains at least one contentinfo candidate: explicit role="contentinfo", OR a &lt;footer&gt; with NO role attribute at all, regardless of nesting (see implementation notes on why candidate selection is unconditional on purpose).

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

### `landmark-no-duplicate-contentinfo`

**Page must not have more than one contentinfo landmark**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that at most one contentinfo landmark (role="contentinfo" or a non-nested &lt;footer&gt;) exists on the page.

**Applies to.** Applies whenever the page contains at least one contentinfo landmark (explicit role="contentinfo", or an implicit, non-nested &lt;footer&gt;).

**Expectation.** At most one contentinfo landmark exists on the page, mirroring landmark-no-duplicate-banner's rationale for contentinfo.

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

**Applies to.** Always applicable to any HTML document with a &lt;body&gt; element: "does the page have a main landmark" is a whole-page concern, matching bypass-blocks-present's pattern of evaluating the document directly.

**Expectation.** At least one main landmark (role="main" or &lt;main&gt;), exposed to assistive technology, exists on the page. A page with none gives AT users no landmark to jump straight to for the primary content.

### `landmark-unique`

**Landmarks with the same role must have unique names**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that when two or more landmarks share the same role, each has a distinct accessible name.

**Applies to.** Applies whenever two or more landmark regions on the page share the same landmark role (banner, contentinfo, main, navigation, complementary, region, form, or search; see implementation notes for the detection model).

**Expectation.** Among landmarks sharing a role, each has a distinct accessible name (via aria-label/aria-labelledby; landmarks are not named from content). Two same-role landmarks with the same name (including two both left unnamed) are indistinguishable to assistive technology users navigating by landmark.

### `layout-table-no-data-markup`

**Layout tables use no data table markup**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that a table marked as layout (role="presentation" or "none") has no caption, header cells, colgroup, summary, or scope, headers or axis attributes, and asks when such a table looks like a data table.

**Applies to.** Applies to &lt;table&gt; elements whose role is presentation or none, the only way markup says a table is for layout. A page with none is notApplicable.

**Expectation.** The table has no non-empty summary attribute and contains no &lt;caption&gt;, &lt;th&gt;, &lt;thead&gt;, &lt;tfoot&gt;, &lt;colgroup&gt; or element with role="rowheader" or role="columnheader", and none of its &lt;td&gt; cells carries scope, headers or axis (RGAA 5.8.1). Only the table's own cells count, not those of a table nested inside it. A table that has such markup and also looks like a data table is reported as cantTell instead of fail: 5.8.1 applies to layout tables, and role="presentation" on a real data table is a different defect (its headers are no longer exposed). It looks like a data table when it has at least two rows and two columns, a data cell, and a full header row (every cell of the first row a header) or a full header column (the first cell of every row a header), headers being &lt;th&gt;, role="columnheader" or role="rowheader".

### `letters-spaced-with-spaces`

**Letters of a word are not spaced out with spaces**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Flags text where four or more single letters in a row (three capitals when they are the whole text) are separated by spaces, for a person to confirm whether a word is spaced out that way.

**Applies to.** Applies to text with four or more single letters in a row separated by spaces ("S O L D E S"), or three capital letters in a row when they are the whole text of the element ("T O P"). The text is the element's inline text: its own text nodes joined with the text of its inline children (span, b, a, ...), so letters split across spans ("&lt;span&gt;S&lt;/span&gt; &lt;span&gt;O&lt;/span&gt; ...") are read as one run. It is read outside &lt;pre&gt;, &lt;code&gt;, &lt;textarea&gt;, &lt;script&gt; and &lt;style&gt;. A page with none is notApplicable.

**Expectation.** Such text is flagged for a person to confirm whether it is a word spaced out with spaces, which RGAA 10.1.3 forbids: a screen reader spells it letter by letter. CSS letter-spacing gives the same look.

### `link-content-label-present`

**Links have a label in their content**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that each link holds text or an image with a text alternative, rather than being named only by aria-label, aria-labelledby or title.

**Applies to.** Applies to links included in the accessibility tree: &lt;a&gt; with an href (or, in SVG, an xlink:href), and elements with role="link". An &lt;a href&gt; whose role is another widget (role="button", role="tab") is not a link to assistive technologies and is not matched. &lt;area&gt; is not matched: RGAA judges its text alternative under 1.1.2. A page with no link is notApplicable.

**Expectation.** The content of the link holds text, or an image with a text alternative (alt, aria-label, aria-labelledby, title, or the &lt;title&gt; or &lt;text&gt; of an &lt;svg&gt;). RGAA 6.2.1 asks for "un intitulé entre &lt;a&gt; et &lt;/a&gt;", and its methodology checks that the content of the element contains a label ("texte ou alternative"). A name given only by aria-label, aria-labelledby or title on the link itself does not count: the RGAA glossary "Intitulé (ou nom accessible) de lien", Note 4, says a link with no content fails 6.2. An image that has no text alternative, or that is hidden with aria-hidden="true", gives the link no label. The rule asks instead of failing when the content holds text added by CSS (::before, ::after), an embedded element such as a form field, or an element named by its own aria-label, or when text hidden from assistive technologies (aria-hidden="true") sits beside a name from aria-label, aria-labelledby or title. Hidden text with no such name leaves the link with no label at all, and fails.

### `link-context-review`

**Generic links whose only context is outside RGAA's list are reviewed**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Flags links named by a generic phrase or a bare file format whose only context is an aria-describedby text or a &lt;dd&gt;, &lt;dt&gt;, &lt;blockquote&gt; or &lt;figcaption&gt;, which RGAA's glossary entry "Contexte du lien" does not list, for a person to check RGAA 6.1.

**Applies to.** Applies to links (a[href], area[href], role="link") whose whole accessible name is a known generic phrase ("en savoir plus", "click here", ...) or a bare file format ("PDF"), the same lists link-name-quality uses, and whose only nearby context is one that RGAA's glossary entry "Contexte du lien" does not list: the text an aria-describedby points to, or the text of an enclosing &lt;dd&gt;, &lt;dt&gt;, &lt;blockquote&gt; or &lt;figcaption&gt;. A link with context from its paragraph, list item or table cell (or, for a format name, the table's header row), or with no context at all, is left to link-name-quality. A page with no such link is notApplicable.

**Expectation.** RGAA 6.1.1 to 6.1.4 accept a link whose name alone, or together with its context, gives its function and destination. The glossary lists six contexts: the sentence, the &lt;p&gt;, the &lt;li&gt; (or a parent &lt;li&gt;), the preceding heading, the associated &lt;th&gt; and the &lt;td&gt;. WCAG technique ARIA1 accepts aria-describedby for 2.4.4, so link-name-quality accepts it and stays silent. Each such link is flagged for a person to check whether one of RGAA's six contexts makes it explicit.

### `link-in-text-block`

**Links in text blocks must be distinguishable from surrounding text without relying on color alone**

automatic · WCAG 1.4.1 (A) · confidence high · default severity serious

Checks that a link inside a run of text is visually distinguishable from the surrounding text by a non-color cue (underline, font-weight or style, border, background, icon), and asks about links distinguished only by a &gt;=3:1 color difference, which also need a hover and focus cue.

**Applies to.** Applies to links (`&lt;a href&gt;` and elements with `role="link"`) whose immediate parent element also has at least one direct-child text node with non-whitespace content (i.e. the link sits inline within a run of plain text, not as a standalone item, e.g. not the sole content of a &lt;li&gt; nav item).

**Expectation.**

A link inside a text block must be visually distinguishable from the surrounding text by at least one non-color means:

- text-decoration: underline, OR
- a different font-weight or font-style than the surrounding text, OR
- another visible mark on the link itself: a border, box-shadow or outline, a background color different from the surrounding one, a background image, an image or svg inside it, or ::before/::after content.

A link with none of these is distinguished by color alone. When its color contrasts with the surrounding text by at least 3:1, technique G183 is met only if hover and focus also bring a non-color cue, which a static scan cannot see, so the link is reported as cantTell. Below 3:1, with contrast confidently computable, color is demonstrably the only cue and the link fails.

### `link-label-in-name-sources`

**Every name source of a link contains its visible label**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that the title, aria-label and aria-labelledby of a link with a visible label each contain that label, as RGAA 6.1.5 requires.

**Applies to.** Applies to HTML links (&lt;a href&gt; and role="link", glossary "Lien") that have a visible label, the text they display (glossary "Intitulé visible"), and at least one non-empty title, aria-label or aria-labelledby. A link whose only content is an image has no visible text this engine can read, and a link inside an &lt;svg&gt; is left out (6.1.5 checks SVG links through other sources, steps 4 to 6). A page with no such link is notApplicable.

**Expectation.** RGAA 6.1.5 steps 1 and 2: the content of the title, the aria-label and the text aria-labelledby points to each contain the visible label, not only the one that gives the link its accessible name. The glossary "Intitulé (ou nom accessible) de lien", note 2, says the same of the title. The comparison follows the particular cases of 6.1.5: punctuation and capital letters are ignored. Accents are not folded. A source that does not contain the visible label fails.

### `link-name-present`

**Links have an accessible name**

automatic · WCAG 2.4.4, 4.1.2 (A) · confidence high · default severity serious

Checks that links expose a non-empty accessible name.

**Applies to.** Applies to &lt;a href&gt;, &lt;area href&gt; and elements with role="link" that are included in the accessibility tree. An &lt;a&gt; without an href is not a link and is not matched.

**Expectation.** The element has a non-empty accessible name. A programmatic name is taken first (aria-labelledby, aria-label, an associated &lt;label&gt;, title), and failing that the element falls back to its own subtree text, counting each descendant's own name (an &lt;img alt&gt;, aria-label or title), the shape behind the common &lt;a&gt;&lt;img alt="..."&gt;&lt;/a&gt; logo link. The content fallback is suppressed when an explicit, known role that is not name-from-content is present; an unrecognized role token falls back to the implicit role.

### `link-name-quality`

**Link text should be descriptive, not generic**

manual · WCAG 2.4.4 (A) · confidence medium · default severity minor

Flags links whose full accessible name is a known non-descriptive phrase (e.g. "click here", "read more", "more") or a bare file-format name (e.g. "HTML", "PDF") with no adjacent context naming what it leads to, for manual review of whether the purpose is clear. English phrases are always recognized, and German, Spanish, French or Japanese ones when the link is in that language.

**Applies to.** Elements matching `a[href], area[href], [role="link"]` with a non-empty computed accessible name (programmatic first, then "name from content", same two-step resolution as `link-name-present`, same selector too). Links with no name at all are `link-name-present`'s concern, not this rule's.

**Expectation.** The link's full accessible name, normalized (trimmed, case-folded, trailing punctuation stripped), is not an exact match for a known non-descriptive phrase ("click here", "read more", "more", "here", "details", "link", etc., WCAG technique F84's known failure pattern for SC 2.4.4) or a bare file-format/type name ("HTML", "PDF", "EPUB", ...) with no adjacent context (an aria-describedby target, the enclosing list item/table cell/paragraph's own text, or (format names only) a table's first-row header) naming what it belongs to.

### `link-state-colors-review`

**Link states shown by color alone contrast 3:1 with the surrounding text**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Checks that a link in a run of text, shown only by color, keeps a contrast of 3:1 with the surrounding text in each visited, active, hover or focus state shown by another color, and asks when the states cannot be put on the link (RGAA 10.6.1).

**Applies to.** Applies to links (&lt;a href&gt; and role="link") inside a run of text (their parent has text of its own, as for link-in-text-block) that carry no mark other than color at rest: no underline, no weight or style difference from the surrounding text, no border, outline, box-shadow, background image, background color of its own (a highlight, as link-in-text-block reads it), image or generated content (glossary "Lien dont la nature n'est pas évidente").

**Expectation.** RGAA 10.6.1 step 3: the 3:1 contrast between the link color and the surrounding text must be checked « pour les différents états du lien s'ils sont présentés au moyen d'une couleur différente : l'état non visité, l'état visité, l'état activé, l'état au survol et l'état à la prise de focus ». Where the page has a layout (a browser), each state is put on the link and its colors are read. A state whose color differs from the resting one and that adds no other mark fails below 3:1 against the surrounding text (STATE_CONTRAST_LOW). The link passes when every such state reaches 3:1. It is asked about when the browser's own visited color applies (BROWSER_STATE_COLORS) or a style sheet cannot be read (STYLESHEET_UNREADABLE). Without a layout (jsdom), the states cannot be put on the link, so it is asked about when an author rule for :visited, :active, :hover, :focus or :focus-visible changes only its color (STATE_COLOR_CHANGE), when the browser's visited color applies, or when a style sheet cannot be read. A link whose states raise no question is left out there. A page with no link in scope is notApplicable.

### `list-children-valid`

**Lists must only directly contain list items**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;ul&gt;/&lt;ol&gt; elements only have &lt;li&gt;, &lt;script&gt;, or &lt;template&gt; as direct children.

**Applies to.** Applies to &lt;ul&gt;/&lt;ol&gt; elements that have at least one direct element child and whose role is list: no role attribute, role="list", or a role attribute naming no concrete ARIA role. A &lt;ul&gt;/&lt;ol&gt; given another role (listbox, menubar, tablist, none, ...) is not a list, so its children follow that role's rules instead.

**Expectation.** Every direct element child is &lt;li&gt;, &lt;script&gt;, or &lt;template&gt;. UNLESS it has an explicit `role` attribute, in which case the explicit role wins over the tag entirely: a child is valid iff that role is "listitem" (so `&lt;li role="presentation"&gt;`/`&lt;li role="menuitem"&gt;` are invalid despite the &lt;li&gt; tag, and conversely a non-&lt;li&gt; element explicitly given `role="listitem"` is valid). A wrapper &lt;div&gt; used for styling (no role at all) still breaks list semantics the same as before.

### `listbox-name-present`

**Listboxes have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="listbox" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="listbox" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="listbox" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom listbox widget is not reliably exposed as its name. On a labelable element (&lt;select multiple role="listbox"&gt;) an associated &lt;label&gt; counts as well.

### `listbox-option-groups-absent`

**ARIA listboxes do not group options**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that no element with role="listbox" groups its options with role="group", which RGAA does not accept in place of &lt;select&gt; and &lt;optgroup&gt;.

**Applies to.** Applies to every element other than &lt;select&gt; whose role attribute makes it a listbox (first token "listbox"). Listboxes hidden by the default hidden-content policy are not checked. A page with none is notApplicable.

**Expectation.** The listbox contains no element with role="group". RGAA 11.8's technical note: « il est impossible de créer des groupes d'options via l'utilisation de WAI-ARIA. De ce fait, une liste nécessitant un regroupement d'options structurée à l'aide d'une balise ayant un attribut WAI-ARIA role="listbox" sera considérée comme non conforme au critère 11.8 ». A role="group" inside the listbox shows that its author grouped the options, so the list needs grouping and fails.

### `listitem-parent-valid`

**List items must be inside a list container**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that &lt;li&gt; elements are contained by &lt;ul&gt;, &lt;ol&gt;, &lt;menu&gt;, or an element with role="list".

**Applies to.** Applies to &lt;li&gt; elements that have a parent element.

**Expectation.** The parent is &lt;ul&gt;/&lt;ol&gt;/&lt;menu&gt; with no role override (all three have the implicit role list), or an element with an explicit role of "list", "presentation", or "none". An &lt;li&gt; used outside a real list container (e.g. as a generic flex/grid item under a &lt;div&gt;) is not exposed as a list item to assistive technologies.

### `main-element-structure`

**Main content uses one visible &lt;main&gt; element**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that the main content is a &lt;main&gt; element and that every other &lt;main&gt; carries the hidden attribute, on HTML5 pages.

**Applies to.** Applies to a run over a whole document that declares the HTML5 doctype (helpers.getDoctypeInfo). RGAA 9.2 is not applicable when the declared doctype is not the HTML5 one, and a page with no doctype declares none. A run narrowed by contextSelector or engineOptions.fragment is notApplicable.

**Expectation.**

Steps 4 and 5 of RGAA 9.2.1:

- the main content zone is structured with a &lt;main&gt; element. A page with role="main" and no &lt;main&gt; element fails; a page with neither is asked about (cantTell), since only a person can say where its main content is;
- when there are several &lt;main&gt; elements, all but one carry the hidden attribute. Every &lt;main&gt; is counted, hidden or not: CSS or aria-hidden alone does not do (« l'utilisation d'un style seul restera insuffisante », 9.2 technical note). A &lt;main&gt; hidden only through a hidden ancestor, or inside a closed &lt;details&gt; or &lt;dialog&gt;, is asked about, since the step speaks of the element's own attribute. A page whose every &lt;main&gt; carries hidden is asked about too.

Steps 1 to 3 and 6 (header, navigation, footer) are left to a person.

### `manual-review`

**Manual review: keyboard navigation and focus order**

manual · WCAG 2.1.1, 2.4.3, 2.4.7 (AA) · confidence medium · default severity moderate

Flags that a manual review of keyboard navigation and focus order is required.

**Applies to.** Applies to every run, whatever the page contains. Keyboard operability and focus order are properties of the page as a whole, and no markup pattern rules the question out.

**Expectation.** Always cantTell, carrying one occurrence at the scan root. Whether focus can leave every component, whether the tab order follows the reading order, and whether the focus indicator stays visible in use all need a person driving the page. The rule exists so that need is stated in the results rather than left for the reader to remember.

### `markup-validation-review`

**The generated source code passes the W3C validator**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Reads the W3C validator report on the generated source, given as the validator.report probe, and fails the errors it lists; without a report it asks a person to run the validator (RGAA 8.2.1).

**Applies to.** Applies to every page: RGAA 8.2 asks, for every page, whether its generated source code is valid for its document type.

**Expectation.**

RGAA 8.2.1, step 1 runs the W3C validator (Nu HTML Checker, « activer l'option W3C Nu markup checker ») on « le code source généré », the page after its scripts have run, and checks five conditions: tags, attributes and values follow the writing rules; tags are nested, opened and closed correctly; id values are unique; no attribute appears twice on one element. The caller can give the validator's report as the `validator.report` probe: `{ url, source: 'generated' | 'original', messages }`, where `messages` are the Nu checker's JSON messages as it outputs them.

- A report on the generated source with an error fails, one finding per error with its line and message (VALIDATOR_ERROR). Messages about CSS (starting "CSS:") and warnings are left out: 8.2.1's conditions are about the HTML.
- A report on the generated source with no error passes, unless it holds 200 messages or more, the most the engine reads from a probe, which is asked about (REPORT_TRUNCATED).
- A report saying the validator could not check the page is asked about (VALIDATOR_FAILED).
- A report on the original source is asked about, never passed or failed: its errors may be ones the parser repairs, which RGAA's method does not count, and a clean one says nothing of what scripts add (ORIGINAL_SOURCE). A report without `source` counts as one on the original source.
- Without a report, or with one for another page or for a narrowed scan, the page is asked about (pageReview): the HTML parser repairs unclosed and misnested tags, drops repeated attributes and moves misplaced elements before the engine sees the page, so the DOM cannot show most of what 8.2.1 checks.

### `media-alternative-transcript-evidence`

**Time-based media: transcript or text alternative evidence**

manual · WCAG 1.2.1 (A) · confidence low · default severity moderate

Finds audio and video elements where a transcript or other text alternative is not strongly evidenced in the page content. This rule is conservative and reports cantTell when evidence is missing or cannot be verified.

**Applies to.** Any eligible &lt;audio&gt; or &lt;video&gt; element in the composed DOM.

**Expectation.** If a strong transcript/text-alternative signal is present (e.g., aria-describedby binding to a visible transcript block, or a nearby clearly labeled Transcript section/link), no occurrence is reported. Otherwise, the rule reports cantTell (insufficient evidence) for that media element.

### `media-transcript-adjacent`

**Audio and video have an adjacent transcript or a link to one**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Checks that the element right before or right after each &lt;audio&gt; and &lt;video&gt; is a transcript, or a link or button to one, as RGAA 4.1 requires, and asks about media that have none.

**Applies to.** Applies to every &lt;audio&gt; and &lt;video&gt; in the scan scope that is not hidden by the author. An &lt;audio&gt; without controls is hidden by the browser's own stylesheet but still plays, so for it the check looks at its parent and at its own hidden and aria-hidden attributes, as media-alternative-transcript-evidence does. A page with none is notApplicable.

**Expectation.** The element just before or just after the media in the code (RGAA glossary « Lien ou bouton adjacent »: « juste avant ou juste après l’élément ») is a link or button whose name mentions a transcript, or a block whose text does (a clearly identifiable adjacent transcript, or a block holding the link). Then the media passes the presence step of RGAA 4.1.1, 4.1.2 and 4.1.3. Otherwise it is flagged (cantTell): the transcript may be elsewhere, the media may not need one (decorative, itself an alternative, a CAPTCHA), or a video may meet 4.1.2 or 4.1.3 through audio description instead. The rule never fails.

### `menuitem-name-present`

**Menu items have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that menu items (role="menuitem*", including checkbox/radio variants) expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="menuitem", role="menuitemcheckbox" or role="menuitemradio" (the attribute must name one of those roles alone, not a fallback list) that are included in the accessibility tree.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or, all three roles being name-from-content, from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

### `meta-redirect-immediate`

**Meta redirects are immediate**

automatic · no formal WCAG SC mapping · confidence medium · default severity serious

Checks whether a &lt;meta http-equiv="refresh"&gt; that sends the visitor to another address waits before doing so.

**Applies to.** Applies to a run over a whole document whose first valid &lt;meta http-equiv="refresh"&gt; sends the visitor to another address: its content has a delay and a URL that does not resolve to the page itself. HTML acts only on the first valid meta refresh of a document. A meta refresh that reloads the page is left to meta-refresh-no-url-timing (RGAA 13.1.1). A &lt;meta&gt; inside &lt;noscript&gt; is ignored. A run narrowed by contextSelector or engineOptions.fragment is notApplicable.

**Expectation.** A delay of 0 passes: the redirect is immediate (RGAA 13.1.2). Any other delay, however long, is asked about (cantTell) and never failed: 13.1.2 has no 20-hour exception, but a redirect from an obsolete address to the new version of the page is essential, and then the criterion is not applicable (13.1, particular cases). Only a person can tell which case this is.

### `meta-refresh-no-exceptions`

**Page must not use a timed meta refresh (AAA)**

automatic · WCAG 2.2.4, 3.2.5 (AAA) · confidence high · default severity moderate

Checks that &lt;meta http-equiv="refresh"&gt; does not set a positive delay, however long; an immediate redirect (delay 0) passes. This is the stricter AAA-level counterpart of the A-level check, which exempts delays over 20 hours.

**Applies to.** Applies to the first &lt;meta http-equiv="refresh"&gt; element, in document order, with a valid content attribute, per HTML's shared declarative refresh steps, a document only ever acts on its first valid meta refresh, so a later one (valid or not) is inert and out of scope.

**Expectation.** Running the shared declarative refresh steps against that element's content value results in a delay of exactly 0. An immediate (delay=0) redirect still passes at AAA, same as the A-level rule. There is nothing for a user to be interrupted mid-read by when nothing is displayed first. Any positive delay fails, with none of the A-level rule's &gt;20-hour exemption: at AAA, WCAG 2.2.4 (Interruptions) and 3.2.5 (Change on Request) require that a *timed* automatic context change happen only at the user's request, regardless of how long the timer is.

### `meta-refresh-no-url-timing`

**Meta refresh waits 20 hours or more**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that a &lt;meta http-equiv="refresh"&gt; that reloads the page waits at least 20 hours.

**Applies to.** Applies to a run over a whole document whose first valid &lt;meta http-equiv="refresh"&gt; reloads the page itself: its content has a delay and no URL, an empty URL, or the page's own address. HTML acts only on the first valid meta refresh of a document, so later ones are not read. A meta refresh that sends the visitor to another address is a redirect, left to meta-redirect-immediate (RGAA 13.1.2). A &lt;meta&gt; inside &lt;noscript&gt; is ignored, as it never applies with scripting on. A run narrowed by contextSelector or engineOptions.fragment is notApplicable.

**Expectation.** The delay is 72000 seconds (20 hours) or more, the last condition of RGAA 13.1.1 (« La limite de temps entre deux rafraîchissements est de vingt heures, au moins »). A shorter delay, 0 included, fails: a meta refresh gives the visitor no way to stop, relaunch or lengthen it, and no warning, which are the other three conditions.

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

**Expectation.** The element also carries at least one keyboard-reachable inline handler: `onkeydown`, `onkeyup`, `onkeypress` (the direct keyboard- event equivalents), or `onfocus`/`onblur` (the standard substitute for hover-triggered behavior: focus/blur are the keyboard- navigable analog to mouseover/mouseout, per WCAG technique G90). A handler is reachable only if keyboard events can reach it: `onfocus`/`onblur` when the element itself can take focus, and a key handler when the element or one of its descendants can (key events bubble, focus events do not). Otherwise the element's mouse-driven behavior (a hover tooltip, a custom dropdown, a drag interaction) has no way to be triggered by a keyboard-only user, and it is flagged with a reason saying whether the keyboard handlers are missing or cannot run.

### `nested-interactive-controls-absent`

**Interactive controls must not be nested**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that an interactive control (link, button, form control, or ARIA widget role) does not contain another interactive control.

**Applies to.** Applies to elements matching the interactive-control set (native a[href], button, input (not hidden), select, textarea; or an explicit ARIA widget role: button, link, checkbox, radio, switch, tab, textbox, combobox, listbox, menuitem, menuitemcheckbox, menuitemradio, option, slider, spinbutton, searchbox, treeitem). The container is applicable regardless of whether it is itself focusable, focusability is only used to decide whether a *descendant* nests an interactive control.

**Expectation.** The element does not contain, as a descendant, another *operable* interactive control (e.g. a &lt;button&gt; wrapping a &lt;select&gt;, or a link containing a checkbox). Nested interactive controls are not reliably announced or operable via assistive technology, activating the outer control and the inner one become ambiguous, and some AT only exposes one of the two.

### `no-autoplay-audio`

**Autoplaying audio should provide a pause/stop or volume-control mechanism**

manual · WCAG 1.4.2 (A) · confidence low · default severity moderate

Flags &lt;audio&gt;/&lt;video&gt; elements that autoplay unmuted with no native controls attribute, and &lt;embed&gt;, &lt;object&gt; or &lt;bgsound&gt; elements that may play sound, for manual review against the 3-second exemption in WCAG 1.4.2.

**Applies to.** Any &lt;audio autoplay&gt; or &lt;video autoplay&gt; element that is not `muted`. Also any &lt;bgsound&gt;, and any &lt;embed&gt; or &lt;object&gt; that loads sound or video, or a plugin (Flash) that may play it: its `type` is audio/*, video/* or a plugin type, or its `src`/`data` ends in a sound or video file extension. An &lt;embed&gt; or &lt;object&gt; with `autostart` or `autoplay` set to false (attribute or &lt;param&gt;) is left out.

**Expectation.** SC 1.4.2 only applies when audio plays automatically for MORE than 3 seconds; clip duration is not knowable from static markup (jsdom does not decode media), so this rule cannot determine whether the SC even applies to a given element. It is authored as `type: 'manual'` (cantTell-capped, never fail) on purpose rather than guessing: an autoplaying unmuted element with no `controls` attribute (the native, statically-verifiable mechanism to pause/stop or adjust volume) is flagged for human review rather than treated as a deterministic violation.

### `object-image-role-img`

**Image objects have role="img" and a text alternative**

automatic · no formal WCAG SC mapping · confidence medium · default severity serious

Checks that each &lt;object type="image/…"&gt; has role="img" and a text alternative (aria-labelledby, aria-label or title), or is followed by a link or button to an alternative content.

**Applies to.** Applies to &lt;object&gt; elements whose type attribute starts with image/ (RGAA 1.1.6 covers "balise &lt;object&gt; avec l'attribut type="image/…"" only; an &lt;object&gt; with another type, or none, is out of scope). An &lt;object&gt; with aria-hidden="true", on itself or an ancestor, or with role="none"/"presentation", is left out: it is marked decorative, which 1.2.3 covers. Content hidden with CSS or the hidden attribute is left out too. A page with none is notApplicable.

**Expectation.**

RGAA 1.1.6 passes when one of these holds:

- the &lt;object&gt; has a text alternative (aria-labelledby, aria-label or title) and role="img";
- it is immediately followed by a link or button that gives access to an alternative content;
- a mechanism lets the user replace it with an alternative content.

Passes: role="img" and a text alternative. Fails: no text alternative, no fallback content between &lt;object&gt; and &lt;/object&gt;, and no link or button right after it. Asks (cantTell):

- a text alternative without role="img". The test wording requires both, but the methodology validates on the alternative alone (steps 3 to 5), so RGAA does not say which reading wins;
- no text alternative, but a link or button right after the &lt;object&gt; (does it lead to an alternative content?);
- no text alternative, but fallback content inside the &lt;object&gt;, which RGAA does not list as a text alternative for 1.1.6.

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

### `office-document-link`

**Downloadable office documents are accessible or have an accessible version**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags each link or form that downloads an office document (PDF, Word, OpenDocument, spreadsheet, presentation, EPUB, RTF) for a person to check the document or its accessible version.

**Applies to.** Applies to links (&lt;a href&gt;, &lt;area href&gt;), forms and submit buttons that download an office document. A link qualifies when its `download` filename, the path of its address, or a value in its query string (`/get?file=report.pdf`) ends with an office document extension. A form qualifies by its `action`, and a submit button by its `formaction`, read the same way. The extensions are those of the formats RGAA's glossary entry "Version accessible" names: Microsoft Office (.doc, .docx, .docm, .dot, .dotx, .dotm, .xls, .xlsx, .xlsm, .xlsb, .xlt, .xltx, .xltm, .ppt, .pptx, .pptm, .pps, .ppsx, .ppsm, .pot, .potx, .potm), OpenDocument (.odt, .ott, .ods, .ots, .odp, .otp, .odg, .otg), PDF and EPUB, plus .rtf. A page with none is notApplicable.

**Expectation.** Each such link or form is flagged for a person to check one of the conditions of RGAA 13.3.1: the document is accessible, or an accessible version is offered for download or in HTML.

### `optgroup-label-not-empty`

**Option group labels are not empty**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that the label attribute of every &lt;optgroup&gt; in a &lt;select&gt; that has one is not empty.

**Applies to.** Applies to every &lt;optgroup&gt; inside a &lt;select&gt; that has a label attribute (RGAA 11.8.3 step 1: « les listes de sélection […] qui possèdent des éléments &lt;optgroup&gt; pourvus d'un attribut label »). An &lt;optgroup&gt; with no label attribute is left to optgroup-label-present (11.8.2). Option groups hidden by the default hidden-content policy are not checked. A page with no applicable option group is notApplicable.

**Expectation.** The label is not empty and not only whitespace. RGAA 11.8.3 asks whether the content of the label attribute is relevant, and an empty one names nothing. That is all this rule decides: whether a non-empty label is relevant is for a person.

### `optgroup-label-present`

**Option groups have a label**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that every &lt;optgroup&gt; in a &lt;select&gt; has a label attribute.

**Applies to.** Applies to &lt;optgroup&gt; elements inside a &lt;select&gt;. A page with none is notApplicable.

**Expectation.** The &lt;optgroup&gt; has a label attribute (RGAA 11.8.2: « vérifier qu'il possède un attribut label »). An empty or whitespace-only label meets 11.8.2; that it names nothing is a relevance failure under 11.8.3, which this rule does not judge.

### `option-name-present`

**Options have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="option" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="option" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, from title, or, role="option" being name-from-content, from its own subtree text, where a descendant's own name (an &lt;img alt&gt;, aria-label or title) counts as that descendant's contribution rather than only its text nodes.

### `orientation-content-parity`

**Content stays the same in portrait and landscape**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Lays the page out as portrait and as landscape and fails content shown in one orientation and missing from the other, and asks about elements an orientation media query hides when the page cannot be laid out (RGAA 13.9.1).

**Applies to.** Applies to a page whose readable style sheets hold an orientation media condition (`@media (orientation: portrait)` or `landscape`, at any depth, or on the `&lt;style&gt;`, `&lt;link&gt;` or `@import` that holds the rule). A page with none is notApplicable.

**Expectation.**

RGAA 13.9.1 asks that « le contenu proposé reste le même quel que soit le mode d’orientation de l’écran utilisé même si sa présentation et le moyen d’y accéder peut différer ».

- Where the page has a layout (a browser), it is laid out as portrait and as landscape, and the text and image alternatives shown in each are compared. Content shown in one orientation fails when it is hidden in the other and the same text is not shown anywhere else there (CONTENT_MISSING), reported on the outermost element hidden. It is asked about when what is hidden holds the main content (a "rotate your device" page, which the essential-orientation exception may allow; MAIN_CONTENT_HIDDEN), and when an element an orientation rule hides has no text to compare (hiddenInOrientation). The page passes when every content shown in one orientation is shown in the other.
- Without a layout (jsdom), each element that a style rule inside an orientation condition hides with `display: none`, `visibility: hidden` or `visibility: collapse` is asked about (hiddenInOrientation).

### `p-as-heading`

**Text styled to look like a heading should probably be a real heading**

manual · WCAG 1.3.1 (A) · confidence low · default severity minor

Flags short &lt;p&gt; and &lt;div&gt; elements whose text is all bold and rendered at &gt;=18px, for manual review of whether a real heading element should be used instead.

**Applies to.** `&lt;p&gt;` elements, and `&lt;div&gt;` elements that hold only text and inline markup, with short (&lt;=120 char), non-empty trimmed text in which every piece of text is bold (computed `font-weight` &gt;= 700, however it got there: on the element itself, a `&lt;strong&gt;`/`&lt;b&gt;` or a styled `&lt;span&gt;`) and rendered at &gt;=18px.

**Expectation.** Text styled to visually read as a heading (bold, larger-than-body size, short) should be marked up with a real heading element (`&lt;h1&gt;`-`&lt;h6&gt;` or `role="heading"`) so its structural role is programmatically determinable, the same 1.3.1 concern as any other "structure conveyed through presentation only" issue.

### `page-has-heading-one`

**Page should have a level-one heading**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that the page has at least one level-one heading (&lt;h1&gt; or role="heading" with aria-level="1").

**Applies to.** Always applicable to any HTML document with a &lt;body&gt; element: "does the page have an h1" is a whole-page concern, matching bypass-blocks-present's pattern of evaluating the document directly.

**Expectation.** At least one heading with level 1 exists (native &lt;h1&gt;, or role="heading" with aria-level="1"). A page with no top-level heading has no clear entry point for assistive technology users navigating by heading.

### `page-language-present`

**Page gives a default language**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that the page gives its default language with lang or xml:lang, on &lt;html&gt; or on an ancestor of every text.

**Applies to.** Applies to a run over a whole document with a root &lt;html&gt; element. A run narrowed by contextSelector or engineOptions.fragment is notApplicable.

**Expectation.**

RGAA 8.3.1 accepts either of two conditions: the language (lang and/or xml:lang) is given on the &lt;html&gt; element, or it is given on each text element or on one of its parents. The rule

- passes when &lt;html&gt; has a non-empty lang;
- passes when &lt;html&gt; has a non-empty xml:lang and no lang, on an XHTML 1.1 page or a page parsed as XML, where xml:lang is the attribute the methodology asks for; on any other page it asks (cantTell), because the glossary "Langue par défaut" makes lang mandatory for HTML 4 and HTML5 and requires both attributes for XHTML 1.0 served as text/html, while the test's wording (« lang et/ou xml:lang ») accepts either;
- otherwise, passes when every text in &lt;body&gt; has an ancestor, itself included, whose nearest lang or xml:lang is non-empty, and asks when some of that text depends on xml:lang alone in the same conditions;
- fails when some rendered text in &lt;body&gt; has no language at all, or when no element carries a language.

### `page-title-patterns`

**Page title patterns that may be insufficiently descriptive**

manual · WCAG 2.4.2 (A) · confidence medium · default severity minor

Identifies page title patterns that may indicate low descriptiveness, such as generic, duplicated, or overly templated titles. This rule provides review signals and does not fail automatically.

**Applies to.** Applies to a run over a whole document whose &lt;title&gt; resolves to non-empty text. The title element is the first HTML &lt;title&gt; anywhere in the document, as for document.title, so one the parser left in &lt;body&gt; counts; a missing or empty title is page-title-present's failure, not a pattern to review. A run narrowed by contextSelector or by engineOptions.fragment is notApplicable, as is a title matching none of the patterns below.

**Expectation.** The title carries none of the conservative low-descriptiveness signals: one of the generic titles home, homepage, welcome, untitled, page or document; fewer than eight characters; or a template shape pairing a generic token with a brand, such as "Home | Brand". When the crawl.pageTitles probe supplies at least ten pages, cross-page signals are used instead: one title repeated across distinct URLs, or a prefix or suffix of twelve characters or more shared across the set. Every signal is reported as cantTell: whether a title describes its page is a judgment, so the rule never fails on a pattern alone.

### `page-title-present`

**Page has a non-empty title**

automatic · WCAG 2.4.2 (A) · confidence high · default severity serious

Checks that the page includes a non-empty &lt;title&gt; element.

**Applies to.** Applies to a run over a whole document. A run narrowed by contextSelector, or by engineOptions.fragment, is notApplicable: whether the page has a title is not a property any subtree can answer.

**Expectation.** The document has a &lt;title&gt; element, and document.title with whitespace collapsed is non-empty. The element is looked for anywhere in the document, not only inside &lt;head&gt;: a &lt;title&gt; the parser leaves outside &lt;head&gt; is still the document title in every browser. Only an HTML-namespace &lt;title&gt; counts; the &lt;title&gt; of an inline &lt;svg&gt; names the graphic, so a page whose only &lt;title&gt; is inside an &lt;svg&gt; is missing its title element. Whether that title describes the page is page-title-patterns' question.

### `page-title-unique`

**Page titles are unique across the site**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Compares the page title with the titles of the site’s other pages, given as the crawl.pageTitles probe, and fails one shared with another page, since RGAA 8.6.1 asks for a title that identifies the page uniquely.

**Applies to.** Applies to a run over a whole document whose &lt;title&gt; has text. A page with no title, or an empty one, is page-title-present's (RGAA 8.5.1) and notApplicable here.

**Expectation.**

RGAA 8.6.1 asks that the title be relevant, and the glossary entry « Titre de page » defines a relevant title as one that identifies the page « de manière claire, concise et unique ». The title is compared, with case and spacing ignored, with the other pages of the site given in the `crawl.pageTitles` probe (`{ pages: [{ url, title }] }`):

- another page, at another path, with the same title fails (TITLE_DUPLICATE);
- another page whose URL differs from this one only by its query string, with the same title, is asked about, since it may be this same page (TITLE_DUPLICATE_SAME_PATH);
- with no other page to compare, the title is asked about (TITLE_SINGLE_PAGE).

It passes when no other page shares the title.

### `page-zones-reachable`

**Each area of the page can be reached or skipped**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Checks that the header, main navigation, main content, footer and search areas each have a landmark, and asks about an area found from its name that relies on a heading, a skip or quick-access link, or a button instead (RGAA 12.6.1).

**Applies to.** Applies to a run over a whole document. RGAA 12.6.1 looks at five areas, where present: header, main navigation, main content, footer and search engine. An area is found from its landmark (banner, navigation, main, contentinfo, search), or, without one, from a name that says what it is: an id or class such as `header`, `nav`, `menu`, `content`, `footer`, `pied-de-page`, or a form with a search field. The main content is always present: a page with no main landmark is asked about. Deciding what counts as an area stays a person's call.

**Expectation.**

RGAA 12.6.1: each area has a landmark matching its nature, a heading that says what it holds, a button just before it that hides it, a skip link just before it, or a quick-access link to it that is visible, at least on focus.

- The rule passes when every area it finds has a landmark matching its nature, and no main content is missing.
- It never fails, since which blocks are areas is a person's call. It asks about an area found from its name, without a landmark: when a heading opens it (whether the heading says what it holds, ZONE_HEADING), a same-page link just before it skips it (ZONE_SKIP_LINK), a button just before it controls it (ZONE_TOGGLE), or a same-page link leads to it (whether that link is visible, ZONE_QUICK_LINK); and when it has none of these (ZONE_NO_MECHANISM). A page with no main landmark is asked about too (MAIN_NOT_FOUND).

### `password-paste-enabled`

**Authentication fields must not block pasting**

manual · WCAG 3.3.8 (AA) · confidence medium · default severity serious

Checks that a password or one-time-code field carries no inline paste handler that cancels the paste, which would remove the password manager or clipboard that WCAG 3.3.8 relies on as the assisting mechanism.

**Applies to.** Applies to any control whose autocomplete token is current-password, new-password or one-time-code, and to &lt;input type="password"&gt; unless its autocomplete names another purpose. A disabled or readonly field takes no input to block, and one outside the accessibility tree is not being asked for, so neither is in scope.

**Expectation.** A reviewer confirms the field can still be pasted into. Remembering a password is a cognitive function test, and 3.3.8 asks for a mechanism that helps the user through one; a password manager, or the clipboard for a one-time code, is that mechanism.

### `presentation-role-conflict`

**Presentational role must not conflict with a global ARIA attribute or focusability**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that role="presentation"/"none" (including an &lt;img alt=""&gt; implicit presentation role) is not combined with a global ARIA attribute (aria-label, aria-hidden, aria-describedby, ...) or focusability (tabindex/native).

**Applies to.** Applies to elements with an explicit role="presentation" or role="none", OR an &lt;img alt=""&gt; carrying no explicit role of its own (empty alt gives an &lt;img&gt; an implicit presentation role per HTML-AAM, even with no explicit role attribute at all: `img[alt=''], [role="none"], [role="presentation"]`).

**Expectation.** The element does not also carry a WAI-ARIA *global* state/property (aria-label, aria-hidden, aria-describedby, aria-live, aria-current, ...; the full global-attribute set, not just the naming ones), AND is not focusable. Per the WAI-ARIA spec's Presentational Roles Conflict Resolution section, a presentational role is "restored" to the element's implicit semantic role when either condition holds: the presentation/none role silently stops working, contradicting the author's evident intent to hide the element from the accessibility tree.

### `presentational-attributes-absent`

**Page uses no presentational attributes**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks that no HTML element carries one of the presentational attributes RGAA lists, such as align, bgcolor or border.

**Applies to.** Applies to any scan scope; whether an HTML element in it carries one of the attributes RGAA 10.1.2 lists is always an answerable question.

**Expectation.** No HTML element carries align, alink, background, basefont, bgcolor, border, cellpadding, cellspacing, char, charoff, clear, color, compact, frameborder, hspace, link, marginheight, marginwidth, text, valign, vlink or vspace; size is allowed only on &lt;select&gt;, and width and height only on &lt;img&gt;, &lt;object&gt;, &lt;embed&gt;, &lt;canvas&gt; and &lt;svg&gt;. That is RGAA 10.1.2's list as written, so width and height on an &lt;iframe&gt; or a &lt;video&gt;, and size on an &lt;input&gt;, are reported too. One occurrence per element, naming every such attribute it carries.

### `presentational-children-focusable-absent`

**Roles with presentational children must not contain focusable content**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that an element whose role makes its children presentational (button, checkbox, img, option, radio, slider, switch, tab, ...) contains no descendant that takes a tab stop.

**Applies to.** Applies to elements whose semantic role is one of the WAI-ARIA roles defined as having presentational children (button, checkbox, img, menuitemcheckbox, menuitemradio, meter, option, progressbar, radio, scrollbar, separator, slider, switch, tab, plus doc-pagebreak and graphics-symbol from the DPUB-ARIA/Graphics-ARIA modules, which inherit the same trait). The role can be explicit (role="tab") or native (&lt;button&gt;, &lt;meter&gt;, &lt;progress&gt;, &lt;option&gt;).

**Expectation.** No descendant of the element is part of sequential focus navigation. The presentational-children mechanism removes every descendant from the accessibility tree, so a descendant that still takes a tab stop receives focus with no role and no name to announce.

### `presentational-elements-absent`

**Page uses no presentational elements**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks that the page contains none of the presentational elements RGAA lists, such as &lt;font&gt;, &lt;center&gt; or &lt;big&gt;.

**Applies to.** Applies to any scan scope; whether it contains one of the elements RGAA 10.1.1 lists is always an answerable question.

**Expectation.** None of &lt;basefont&gt;, &lt;big&gt;, &lt;blink&gt;, &lt;center&gt;, &lt;font&gt;, &lt;marquee&gt;, &lt;s&gt;, &lt;strike&gt; or &lt;tt&gt; is present, and &lt;u&gt; is not present either unless the document has the HTML5 doctype, which gave &lt;u&gt; a meaning of its own. That is RGAA 10.1.1's list as written: it includes &lt;s&gt;, which HTML5 keeps.

### `progressbar-name-present`

**Progress bars have an accessible name**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that elements with role="progressbar" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="progressbar" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="progressbar" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom progressbar widget is not reliably exposed as its name. On a labelable element (&lt;progress role="progressbar"&gt;) an associated &lt;label&gt; counts as well.

### `radio-group-present`

**Radio buttons sharing a name are grouped**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

Flags a set of radio buttons with the same name that is not inside one fieldset, role="group" or role="radiogroup", for a person to decide whether it needs grouping.

**Applies to.** Applies to sets of two or more &lt;input type="radio"&gt; with the same name in the same form (or outside any form). A page with none is notApplicable.

**Expectation.** Every radio button of the set sits in one &lt;fieldset&gt;, role="group" or role="radiogroup" element, one of the ways RGAA 11.5.1 accepts. That element need not be the closest group around each radio: an outer fieldset holding every radio of the set groups them even when inner groups split them. A set that is not is flagged: 11.5.1 applies "si nécessaire", so a person decides whether this set needs grouping.

### `region`

**Page content should be inside a landmark region**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that content under &lt;body&gt; is contained within a landmark region.

**Applies to.** Applies to any element under &lt;body&gt; that directly carries visible text (or other own content, see @implementation-notes) and is not itself a landmark, live region, dialog, button, &lt;svg&gt;, &lt;iframe&gt;/&lt;frame&gt;, or a resolvable skip-link.

**Expectation.** Every top-level piece of page content lives inside a landmark region (main, navigation, banner, contentinfo, complementary, region, form, search), so assistive technology users navigating by landmark do not miss content that was never placed inside one.

### `role-img-aria-name`

**Elements with role="img" are named with aria-labelledby or aria-label**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that each exposed element with role="img" (other than &lt;img&gt; and an outer &lt;svg&gt;) has a text alternative from aria-labelledby or aria-label, the two sources RGAA accepts.

**Applies to.** Applies to elements whose role attribute starts with the token img, except &lt;img&gt; (RGAA lists its own sources for it) and an outer &lt;svg&gt; (RGAA test 1.1.5, see svg-role-img and svg-text-alternative-present). An element with aria-hidden="true", on itself or an ancestor, is left out: the glossary entry "Image de décoration" says an element with role="img" is decorative only with aria-hidden="true". Content hidden with CSS or the hidden attribute is left out too. A page with none is notApplicable.

**Expectation.** The element has a text alternative from one of the two sources RGAA 1.1.1 step 4 lists for role="img": text referenced by aria-labelledby, or a non-empty aria-label. A name that comes only from the title attribute, or no name at all, fails: the glossary entry "Alternative textuelle (image)" lists title for &lt;img&gt;, &lt;input type="image"&gt;, &lt;object&gt; and &lt;embed&gt; only. An element in the SVG namespace (a &lt;g role="img"&gt;, for example) named only by a &lt;title&gt; child is asked about (cantTell): RGAA contradicts itself on &lt;title&gt; as an SVG alternative (1.1.5 step 5 lists only aria-labelledby and aria-label, while 1.3.6 checks the content of &lt;title&gt;).

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

### `scope-attr-valid`

**scope attribute must have a valid value**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that scope="..." is one of row, col, rowgroup, or colgroup.

**Applies to.** Applies to elements with a non-empty scope attribute.

**Expectation.** The scope value is one of "row", "col", "rowgroup", or "colgroup" (case-insensitive). An invalid scope value is not recognized by assistive technology, silently losing the row/column header association it was meant to declare.

### `scripted-components-review`

**Scripted components are compatible with assistive technologies**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

On a page with script, asks a person to check every scripted component against RGAA 7.1 (name, role, value, settings and state changes exposed and rendered by assistive technologies, a name that contains the visible label), and lists the elements in the markup that look like scripted components as a starting point.

**Applies to.** Applies to every page that contains script, in the scanned document or any open shadow root inside it: an executable &lt;script&gt; element, an inline event handler attribute (onclick and the like) on any element, a href, src, action or formaction starting with "javascript:", or a custom element (a tag name with a hyphen, which only works through script). A page with none of these is notApplicable: RGAA 7.1 asks about scripts, and with no script nothing can create or drive a custom component.

**Expectation.** Always cantTell on a page with script, never pass or fail. One occurrence at the scan root asks a person to check that every scripted component exposes its name, role, value, settings and state changes to assistive technologies (RGAA 7.1.1), is rendered correctly by them (7.1.2) and has a relevant name and role, with a name that contains its visible label (7.1.3), or that an accessible alternative exists. Behaviour attached from script files (addEventListener) cannot be seen in the markup, so this question stands even when nothing else is listed. After it, one occurrence per candidate element found in the markup, as a starting list for the auditor, never a complete one.

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

**Expectation.** Each server-side image map is reported as cantTell: 2.1.1 is met when the same destinations are also offered as links a keyboard can reach (RGAA 1.1.4 step 2 asks the same), which the rule cannot verify. Client-side image maps (&lt;map&gt;/&lt;area&gt;) are not flagged. A scope with no &lt;img ismap&gt; passes. One whose only &lt;img ismap&gt; elements are outside a link is notApplicable: ismap does nothing there, so there is no server-side image map (the misplaced attribute is invalid HTML, a matter for the validator).

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

### `skip-link-placement`

**Skip links are visible and at the same place on every page**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Checks that the link to the main content is visible, at least when it takes focus, and that the site’s other pages show it at the same place and in the same focus order (RGAA 12.7.2).

**Applies to.** Applies to a run over a whole document that has a skip link: a same-page link outside the main content zone (the first visible &lt;main&gt;, or failing one a visible role="main") whose target is &lt;main&gt;, or an element inside or just before it with no navigation block, link or other focusable element in between, as skip-link-present recognises one. A page without one is notApplicable here: skip-link-present reports it, and skip-link a link that does not work.

**Expectation.**

RGAA 12.7.2, conditions 1 to 3: the link sits at the same place in the presentation, comes in the same relative order in the source, and is visible or, failing that, visible when it takes focus.

- Visibility needs a layout (a browser). A link that is not visible at rest is focused, as by the keyboard, and measured again. It fails when it is still not visible: no size, outside the page, clipped by an ancestor, fully transparent or `visibility: hidden` (SKIP_LINK_NOT_VISIBLE). It is asked about when something may cover it, or an animation starts on focus (SKIP_LINK_VISIBILITY_UNKNOWN). Without a layout (jsdom) visibility is always asked about.
- Place and order need the site's other pages, through the `crawl.skipLinks` probe. The link fails when another page measured at the same viewport width shows it more than 24 CSS pixels away (SKIP_LINK_POSITION_DIFFERS). It is asked about when its focus order differs (SKIP_LINK_ORDER_DIFFERS), since what the order is relative to is a person's call; when no other page was measured at the same width (SKIP_LINK_VIEWPORT_DIFFERS); and when the probe brings no other page with a skip link (SKIP_LINK_SINGLE_PAGE).

It passes when it is visible, at least on focus, and every other page shows it at the same place and in the same focus order.

### `skip-link-present`

**Pages have a skip link to the main content**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that a page with navigation before its main content has a working same-page link to that content.

**Applies to.** Applies to a run over a whole document. RGAA 12.7.1 step 1 finds the main content zone through the visible &lt;main&gt; element; the rule takes the first one, or, failing one, a visible role="main". With neither, the rule asks a person to locate the zone, unless the page has no link and no navigation block, which is notApplicable. A run narrowed by contextSelector or engineOptions.fragment is notApplicable.

**Expectation.**

A same-page link outside the main content zone leads to it: its fragment resolves to &lt;main&gt;, or to an element inside it or before it with no navigation block, link or other focusable element between that element and the start of the zone. RGAA 12.7.1 accepts a skip link just before the zone or a quick-access link to it; a main landmark or headings alone do not count. The rule fails:

- when a navigation block (&lt;nav&gt; or role="navigation") comes before the main zone and no link leads to it; the 12.7 particular case, a one-page site, turns on the presence of navigation, so with navigation the link is needed;
- on a skip link whose target does not exist, whether or not the page has navigation.

It asks instead of failing when no navigation block comes before the main zone and no link leads to it (a one-page site may not need one), and on a skip link whose target exists but is hidden, or sits before the zone with links or other focusable elements, but no navigation block, between the two. A skip link to a target inside navigation, after the zone, or with navigation between it and the zone leads elsewhere (to a menu, a search form, the footer) and does not count.

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

### `svg-hidden-no-alternative`

**Hidden decorative SVGs carry no text alternative**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks that an &lt;svg&gt; with aria-hidden="true" has no aria-label, aria-labelledby, title attribute, or non-empty &lt;title&gt; or &lt;desc&gt;.

**Applies to.** Applies to &lt;svg&gt; elements with aria-hidden="true", outer ones only. A page with none is notApplicable.

**Expectation.** Neither the &lt;svg&gt; nor anything in it has an aria-label, aria-labelledby or title attribute with text, and any &lt;title&gt; or &lt;desc&gt; in it is empty (RGAA 1.2.4). An SVG that breaks this fails either way: if it is decorative it breaks 1.2.4, and if it carries information, hiding it breaks 1.1.5. Content drawn through &lt;use href="#id"&gt; (or xlink:href) counts as the SVG's own: the note of RGAA criterion 1.2 says 1.2.4 also applies to the &lt;svg&gt; or &lt;symbol&gt; a &lt;use&gt; element points to. Only same-document references are followed, recursively; an external file is not fetched.

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

### `svg-role-img`

**SVGs with a text alternative have role="img"**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that an &lt;svg&gt; named by aria-labelledby, aria-label or &lt;title&gt; has role="img", and that its name comes from aria-labelledby or aria-label.

**Applies to.** Applies to outer &lt;svg&gt; elements that carry a text alternative: text referenced by aria-labelledby, a non-empty aria-label, or a non-empty &lt;title&gt; child. An &lt;svg&gt; with aria-hidden="true", on itself or an ancestor, is left out (svg-hidden-no-alternative checks it), and so is content hidden with CSS or the hidden attribute. An &lt;svg role="img"&gt; with no alternative at all is left to svg-text-alternative-present. A page with none is notApplicable.

**Expectation.** The &lt;svg&gt; has role="img" (RGAA 1.1.5 step 3; step 4: "Si ce n'est pas le cas, le test est invalidé"), and its alternative comes from aria-labelledby or aria-label (step 5). An alternative without role="img" fails: the author has shown that the image carries information, and without the role it is not exposed as an image. If the image were in fact decorative, it would fail 1.2.4 instead, which requires aria-hidden="true" and no alternative. An &lt;svg role="img"&gt; named only by its &lt;title&gt; is asked about (cantTell): RGAA contradicts itself there. 1.1.5 step 5 lists only aria-labelledby and aria-label, but 1.3.6 checks "le contenu de l'élément &lt;title&gt;" as the alternative of an SVG.

### `svg-text-alternative-present`

**&lt;svg&gt; must provide a text alternative**

automatic · WCAG 1.1.1 (A) · confidence high · default severity serious

Checks that inline &lt;svg&gt; elements provide a text alternative via a &lt;title&gt; element or an ARIA name (a &lt;desc&gt; element alone does not count).

**Applies to.**

Applies to inline &lt;svg&gt; elements that are exposed to assistive technologies AND appear intended to be conveyed. "Intended to be conveyed" is approximated deterministically by at least one of:

- role="img", role="graphics-symbol", or role="graphics-document" on the SVG root element itself (the WAI-ARIA Graphics Module roles, alongside img). Does NOT extend to arbitrary role="img"/"graphics-symbol"/"graphics-document" descendants nested inside an &lt;svg&gt;. This check's scope is the &lt;svg&gt; root only; role-img-text-alternative-present covers those same three roles on any other element, including nested SVG shapes (ACT 7d6734's own failed example: a bare `&lt;svg&gt;` root with a nested `&lt;circle role="graphics-symbol"&gt;`).
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

**Applies to.** `&lt;table&gt;` elements with no `&lt;caption&gt;` child, at least two rows, and a first row containing exactly one non-empty-text cell while at least one other row has more than one cell. Left out: a table whose role (first token) is anything but table, grid or treegrid, such as a layout table with role="presentation", which needs no caption; and a table already named by a non-empty aria-label, an aria-labelledby that resolves to text, or a non-empty title, which WCAG and RGAA 5.4.1 accept as the table's title.

**Expectation.** A single lone cell in the first row, sitting above rows that clearly have multiple columns, strongly suggests the author is using it as a visual caption/title rather than as a real table cell. Structure conveyed only through this positional convention is not programmatically associated with the table the way a real `&lt;caption&gt;` element is (1.3.1).

### `table-headers-attr-valid`

**Table cell "headers" attribute must reference valid header cells**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that each id in a &lt;td&gt;/&lt;th&gt; headers attribute resolves to a cell (&lt;td&gt; or &lt;th&gt;) within the same table (not missing, not a non-cell element, not itself).

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

**Applies to.** Applies to &lt;button&gt;, &lt;summary&gt;, &lt;a href&gt;, &lt;area href&gt;, &lt;input&gt;, &lt;select&gt;, &lt;textarea&gt; and elements with role="button"/"link" that are pointer-reachable: rendered, not suppressed by pointer-events:none, and with a measurable box of non-zero size. Accessibility-tree exclusion isn't a filter here: an aria-hidden control is still a target a pointer can hit. &lt;area&gt; is matched but never actually evaluated, for the reason given below.

**Expectation.**

Each target is at least 24 by 24 CSS pixels, or meets one of the SC 2.5.8 exceptions this rule can establish from geometry: spacing (a 24px-diameter circle centred on the target reaches no unrelated target), the inline exception for a link inside a run of text, or user-agent sizing (an unstyled native checkbox or radio, detected by appearance not having been reset to none). An undersized target too close to a neighbour fails. Where an exception may apply but geometry cannot confirm it (two inline links in one run of text, or a target inside an SVG, canvas or image map that may be essential), the result is cantTell rather than a guess. Notes (engine intent):

- This rule is DOM-based and measures pointer hit regions available to sighted pointer users.
- Elements can be "pointer-operable" even if excluded from the accessibility tree (e.g. aria-hidden="true").
- Excludes targets that are not pointer-reachable due to rendering suppression (display:none, etc.), or pointer suppression (pointer-events:none), or zero geometry (e.g. scale(0) -&gt; zero rects).

WCAG 2.5.8 exceptions implemented, and how:

- Spacing: a 24px-diameter circle centered on an undersized target must not intersect another (unrelated) target's box or another undersized target's own circle. Two passes: a fast center-distance check (exact for undersized-vs-undersized, a reasonable proxy otherwise) and a 16-point perimeter sample via elementFromPoint as a more precise fallback for cases the distance check under-detects (e.g. a small target adjacent to a large, elongated neighbor). Ancestor/descendant relationships between the target and the "other" element are never treated as a conflict (see isRelated): a nested-interactive shape, a small control inside its own wrapping link/button, is one visual region, not two independent targets. That pattern is nested-interactive-controls-absent's concern, not a spacing one.
- Inline: a link inside a text-block container passes outright (isInlineTextExceptionTarget). An inline link whose only spacing conflict is another inline link in the same run is reported as cantTell (isInlineLinkTarget), since the inline exception may cover it but geometry can't confirm that.
- User Agent Control: an unstyled native checkbox/radio, detected via `appearance` not being reset to `none` (see isUserAgentSizedControl). Scoped narrowly to checkbox/radio specifically, not every form control, since those are the only types with unambiguous native rendering.
- Essential/Equivalent: only a narrow, high-confidence subset is asserted (SVG/canvas/map-embedded controls, see isPlausiblyEssentialOrEquivalent); anything else defers to cantTell rather than guessing "essential" from a layout container.

Known gap, left unimplemented on purpose: `&lt;area&gt;` (image-map hotspot) elements are not evaluated at all. `area[href]` is in CANDIDATE_SELECTOR for forward-compatibility, but it's currently a no-op. `&lt;area&gt;` has no CSS box of its own (`display: none` by the HTML spec's default UA stylesheet, confirmed against the spec rather than a jsdom quirk), so `getBoundingClientRect()` always reports zero geometry and `isPointerReachable`'s existing `display:none` check rejects it before any size/exception logic runs. A real `&lt;area&gt;` hit-region is computed by the browser from its `shape`/`coords` attributes against the associated `&lt;img&gt;`'s *rendered* size, an entirely different measurement path than every other candidate here. Implementing that properly (parsing `coords`, resolving the owning `&lt;img&gt;` via its `usemap`, accounting for the image's CSS-scaled render size) is a separate, larger feature, not attempted in this pass. This is an automatic, deterministic approximation intended to be:

- strict on clear failures,
- conservative when exceptions cannot be determined reliably.

### `td-has-header`

**Data cells in large tables must have an associated header**

automatic · WCAG 1.3.1 (A) · confidence high · default severity serious

Checks that every &lt;td&gt; in a large, simple (no colspan/rowspan) table has an associated header, via a headers attribute, an implicit column &lt;th&gt; above it, or an implicit row &lt;th&gt; to its left.

**Applies to.** `&lt;table&gt;` elements with at least 4 rows and at least 4 columns (a "large" table, where implicit row/column header association is useful; small tables are usually self-evident), and with NO `colspan`/`rowspan` anywhere in the table. A table whose role (first token) is anything but table, grid or treegrid, such as a layout table with role="presentation", is left out: it has no data cells.

**Expectation.**

Every non-empty `&lt;td&gt;` has an associated header, via one of:

- a non-empty `headers` attribute (trusted here; whether it resolves to real `&lt;th&gt;` ids is `table-headers-attr-valid`'s concern, not this rule's), OR
- an implicit column header: a header cell in the same column, in an earlier row, OR
- an implicit row header: a header cell earlier in the same row.

A header cell is a `&lt;th&gt;` with no other role, or any cell with role="columnheader" or role="rowheader" (such a `&lt;td&gt;` is a header, not a data cell). A `&lt;td&gt;` with no text and no content that could carry a name (an image, a control, an element with an ARIA label) holds no data, so it needs no header; the empty corner cell above row headers is the usual case.

### `text-spacing-content-loss`

**Text stays readable when the user increases text spacing**

automatic · WCAG 1.4.12 (AA) · confidence medium · default severity serious

Applies the WCAG 1.4.12 text spacing in the browser and checks that no text is cut off or made to overlap, and asks about style sheet rules that force spacing with !important.

**Applies to.** Applies to a page with visible text. The loss of content needs a layout (a browser): without one, only the style sheets are read.

**Expectation.**

WCAG 1.4.12 and RGAA 10.12.1: with line height at 1.5 times the font size, spacing after paragraphs at 2 times, letter spacing at 0.12 times and word spacing at 0.16 times, no content or functionality is lost.

- In a browser, the spacing is applied as a style sheet that wins over the page's own (inline `!important` aside, which avoid-inline-spacing reports), and each line of text is measured before and after against the ancestors that clip it (`overflow: hidden` or `clip`). A line that was inside and ends at least half outside (half its height, or half an em across) fails: the container cuts that text off (TEXT_CLIPPED). A line pushed out by less is asked about (TEXT_CLIPPED_PARTLY), and so is text that comes to overlap other text it did not overlap before (TEXT_OVERLAPS).
- In any environment, a style sheet rule that sets line-height, letter-spacing or word-spacing below those values with `!important` is asked about (STYLESHEET_IMPORTANT): a tool that adds its own style sheet to the page cannot override it, though a user style sheet can.

Without a layout and with no such rule, the rule is notApplicable, with `data.reason: 'noLayout'`.

### `textbox-name-present`

**Textboxes have an accessible name**

automatic · WCAG 4.1.2 (A) · confidence high · default severity serious

Checks that elements with role="textbox" expose a non-empty accessible name.

**Applies to.** Applies to elements carrying role="textbox" (the attribute must name that role alone, not a fallback list) that are included in the accessibility tree. An element with the matching implicit role but no role attribute is out of scope.

**Expectation.** The element has a non-empty accessible name from aria-label, from an aria-labelledby that resolves to non-empty text, or from title. role="textbox" is name-from-author-only, so subtree text is never accepted: text sitting inside a custom textbox widget is not reliably exposed as its name. On a labelable element (&lt;input role="textbox"&gt;) an associated &lt;label&gt; counts as well. On a text-like &lt;input&gt; or a &lt;textarea&gt;, the placeholder counts last (HTML-AAM's final name source): a placeholder-only label is a 3.3.2 question, not a missing name.

### `th-scope-row-col`

**Table headers use scope="row" or scope="col"**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

Flags a &lt;th&gt; with scope="rowgroup" or scope="colgroup", which RGAA does not accept, for a person to tell whether it covers a whole row or column.

**Applies to.** Applies to every &lt;th&gt; whose scope attribute is "rowgroup" or "colgroup" (compared without regard to case or surrounding spaces), except in a &lt;table&gt; with role="presentation" or role="none", which is not a data table. Headers hidden by the default hidden-content policy are not checked. A page with none is notApplicable.

**Expectation.** Such a header is asked about (cantTell). RGAA gives a &lt;th&gt; two choices. A header over a whole row or column that has a scope uses scope="row" or scope="col" (5.7.2). A header over only part of a row or column has no scope, no role="rowheader" or "columnheader", and a unique id (5.7.3); the glossary "En-tête de colonne ou de ligne" adds that only a &lt;th&gt; can be used then. So scope="rowgroup" or "colgroup" fails one of the two tests, but which one depends on how much of the table the header covers, which only a person can tell.

### `title-placeholder-identical`

**A form field's title and placeholder are identical**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Asks about form fields whose title and placeholder are both present but differ: RGAA's glossary entry "Étiquette de champ de formulaire" requires them to be identical.

**Applies to.** Applies to &lt;input&gt; and &lt;textarea&gt; fields that carry both a non-empty title and a non-empty placeholder. Only these fields show a placeholder; the attribute does nothing elsewhere. A hidden field, or a page with no such field, is notApplicable.

**Expectation.** RGAA's glossary entry "Étiquette de champ de formulaire" says that a placeholder « est susceptible d'être restitué à la place de l'attribut title » and that « lorsque ces deux attributs title et placeholder sont présents, ils doivent être identiques ». A field whose two values are the same once whitespace is collapsed passes.

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

**Expectation.** The primary language subtag of the lang value (the part before the first hyphen) is a registered language subtag, as ACT de46e4 requires and as the RGAA glossary "Code de langue" reads it ("ne concerne que la partie [code] avant le tiret"). WCAG 3.1.2 (Language of Parts) requires that when a passage's language differs from the page's default, it is identified programmatically. A tag whose primary subtag is unknown fails to identify a real language at all; a malformed later subtag (lang="en-US_x") still identifies English and passes here, since it is a markup validity error rather than a missing language.

### `video-caption`

**Prerecorded video should provide a captions track**

manual · WCAG 1.2.2 (A) · confidence low · default severity moderate

Flags &lt;video&gt; elements with no &lt;track kind="captions"&gt; child, for manual review of whether the video has an audio track that needs captions; a subtitles track alone may be a translation only.

**Applies to.** Any &lt;video&gt; element in the composed DOM.

**Expectation.** SC 1.2.2 requires captions for prerecorded synchronized media, but only when the video actually has an audio track that conveys information (a silent/decorative video needs none), which cannot be verified from static markup alone (jsdom does not decode media). This rule is therefore `type: 'manual'` (cantTell-capped, never fail), matching the precedent set by `media-alternative-transcript-evidence` for the same class of "normatively mapped but not statically verifiable" gap. A &lt;video&gt; with a `&lt;track kind="captions"&gt;` whose `src` is non-empty is not flagged; everything else is flagged for human review. A video whose only text tracks are subtitles (`kind="subtitles"`, or no `kind`, which HTML treats as subtitles) gets its own question: subtitles may be a translation of the dialogue only, without the speaker and sound information captions carry (RGAA's glossary "Sous-titres synchronisés" makes the same distinction).

### `video-captions-track-kind`

**Video caption tracks use kind="captions"**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that a &lt;video&gt; with text tracks has at least one &lt;track kind="captions"&gt;, not only subtitles, and asks when its subtitles may be translations.

**Applies to.** Applies to &lt;video&gt; elements with at least one &lt;track&gt; child with a non-empty src carrying text for the video: kind="subtitles", kind="captions", or no kind at all, which HTML reads as subtitles. A track with no src delivers nothing and is ignored. A page with none is notApplicable.

**Expectation.**

At least one of those tracks has kind="captions" (RGAA 4.3.2). When the only tracks are subtitles:

- fail when one of them has a srclang in the language of the video (the nearest lang attribute, compared on the primary subtag): a same-language subtitles track is most likely captions that do not say so;
- cantTell otherwise (srclang in another language, or missing, or no language to compare with): the track may be a translation, which is not a caption track, and then 4.3.2 does not apply and the question is 4.3.1's.

### `video-poster-text-alternative-present`

**&lt;video&gt; poster must have a text alternative**

automatic · WCAG 1.1.1 (A) · confidence medium · default severity serious

Checks that &lt;video&gt; elements with a poster image provide a text alternative (accessible name).

**Applies to.** Applies to &lt;video&gt; elements that: 1) have a non-empty poster attribute, AND 2) are exposed to assistive technologies (per engine eligibility checks). Elements otherwise hidden from the accessibility tree remain applicable if they are tabbable or referenced by IDREF relationships (per eligibility checks). Videos with role="presentation" or role="none" are excluded only when they are not focusable.

**Expectation.**

Each applicable &lt;video&gt; element provides a text alternative for the poster image, via:

- an accessible name (aria-label / aria-labelledby / title).

Between-tag fallback content inside &lt;video&gt; is NOT accepted: it is only rendered by browsers that don't support &lt;video&gt;, so it is not reliably exposed to assistive technologies in practice. &lt;video&gt; is also not a labelable element, so native &lt;label for="..."&gt; associations are not accepted either.

### `viewport-zoom-review`

**Text can reach 200% zoom despite a viewport meta tag that limits zoom**

manual · no formal WCAG SC mapping · confidence medium · default severity serious

Flags a &lt;meta name="viewport"&gt; that disables zoom or caps it below 200%, for a person to check that text still reaches 200% with the browser text zoom, the browser graphic zoom or a zoom control of the site.

**Applies to.** Applies to &lt;meta name="viewport"&gt; elements whose content sets user-scalable or maximum-scale to a value that disables or limits zoom: user-scalable other than yes, device-width, device-height or a number outside -1 to 1; maximum-scale from 0 up to (not including) 2, or a value that does not parse. These are the values meta-viewport-zoom-enabled fails. A page with no such tag is notApplicable. The check is whole-document: notApplicable when the scan is scoped to part of the page.

**Expectation.** Always cantTell on such a tag, never pass or fail. RGAA 10.4.2 is met when text can be enlarged to 200% by any one of: the browser's text zoom, its graphic zoom, or a zoom control provided by the site (« selon une de ces conditions »). The viewport meta tag acts only on pinch zoom, which desktop browsers do not use, so whether it stops all three depends on the audit environment. A person checks them.

### `widget-label-in-name`

**The accessible name of a scripted component contains its visible label**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that an element with an ARIA widget role (tab, menu item, tree item, grid cell, option) has an accessible name that contains its visible label, as RGAA 7.1.3 requires.

**Applies to.** Applies to elements with an explicit ARIA widget role that is neither a link, a button nor a form field (tab, menuitem, menuitemcheckbox, menuitemradio, treeitem, gridcell, option), whose visible text is their visible label, and that carry an aria-label or an aria-labelledby. Such a role marks a component built with a script (glossary "Composant d'interface"). A page with no such element is notApplicable.

**Expectation.** RGAA 7.1.3 methodology step 2: the component's accessible name contains its visible label. Punctuation and capital letters are ignored (the particular cases of 7.1.3); accents are not folded. An accessible name that does not contain it fails. Only the accessible name is checked; a title is not.
