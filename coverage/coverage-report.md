# WCAG Coverage Report

Generated: 2026-07-23T11:13:59.723Z

Rules directory: `src/checks`
Facets: `src/coverage/wcag-facets.js`

## Summary

Total rules (loaded without error): **125**

### Coverage by WCAG Level (Version-agnostic, cumulative)

| Scope | A | AA | AAA |
|---|---:|---:|---:|
| Any WCAG version | 101 | 15 | 5 |

### Coverage by WCAG Level (Per version, cumulative)

| Scope | A | AA | AAA |
|---|---:|---:|---:|
| WCAG 2.0 | 96 | 11 | 5 |
| WCAG 2.1 | 4 | 3 | 0 |
| WCAG 2.2 | 1 | 1 | 0 |

### Raw WCAG tag counts (non-cumulative)

| Tag | Rules |
|---|---:|
| wcag21a | 1 |
| wcag21aa | 3 |
| wcag22aa | 1 |
| wcag2a | 88 |
| wcag2aa | 7 |
| wcag2aaa | 5 |

## SC Coverage (A) — Enforced requirements only (normativeMappings)

### 1.1.1

Facet coverage: **13/21** facets covered.
Automation mix: **full 6, partial 13, manual 2**.

| Facet | Automation | Covered by |
|---|---|---|
| text-alternative-mechanism | partial | — |
| functional-nontext-name | partial | — |
| decorative-null | manual | — |
| text-alt-quality-review | manual | — |
| text-alternative-quality | partial | a11ycore-area-alt-decorative, a11ycore-area-alt-quality, a11ycore-canvas-text-alternative-quality, a11ycore-embed-text-alternative-quality, a11ycore-img-alt-decorative, a11ycore-img-alt-quality, a11ycore-input-image-alt-decorative, a11ycore-input-image-alt-quality, a11ycore-object-text-alternative-quality, a11ycore-svg-text-alternative-quality |
| img-alt-attr-present | full | a11ycore-img-alt-present |
| role-img-text-alternative-present | full | a11ycore-role-img-text-alternative-present |
| input-image-alt-attr-present | full | a11ycore-input-image-alt-present |
| area-alt-attr-present | full | a11ycore-area-alt-present |
| canvas-text-alternative-present | partial | a11ycore-canvas-text-alternative-present |
| embed-text-alternative-present | partial | a11ycore-embed-text-alternative-present |
| svg-text-alt-present | partial | — |
| svg-text-alternative-present | partial | a11ycore-svg-text-alternative-present |
| svg-image-text-alt-present | partial | a11ycore-svg-image-text-alternative-present |
| object-text-alternative-present | partial | a11ycore-object-text-alternative-present |
| embed-name-present | partial | — |
| video-poster-text-alt-present | partial | a11ycore-video-poster-text-alternative-present |
| alt-suspicious-patterns | partial | — |
| acc-eligibility-filtering | partial | — |
| meter-name-present | full | a11ycore-meter-name-present |
| progressbar-name-present | full | a11ycore-progressbar-name-present |

Uncovered facets: text-alternative-mechanism, functional-nontext-name, decorative-null, text-alt-quality-review, svg-text-alt-present, embed-name-present, alt-suspicious-patterns, acc-eligibility-filtering

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-area-alt-present | automatic | &amp;lt;area&amp;gt; must have an alt attribute | src/checks/automatic/area-alt-present.js | area-alt-attr-present |  |
| a11ycore-canvas-text-alternative-present | automatic | &lt;canvas&gt; must provide a text alternative | src/checks/automatic/canvas-text-alternative-present.js | canvas-text-alternative-present |  |
| a11ycore-embed-text-alternative-present | automatic | &lt;embed&gt; must provide a text alternative | src/checks/automatic/embed-text-alternative-present.js | embed-text-alternative-present |  |
| a11ycore-img-alt-present | automatic | &lt;img&gt; must have an alt attribute | src/checks/automatic/img-alt-present.js | img-alt-attr-present |  |
| a11ycore-input-image-alt-present | automatic | &lt;input type="image"&gt; must have an alt attribute | src/checks/automatic/input-image-alt-present.js | input-image-alt-attr-present |  |
| a11ycore-meter-name-present | automatic | Meters have an accessible name | src/checks/automatic/meter-name-present.js | meter-name-present |  |
| a11ycore-object-text-alternative-present | automatic | &lt;object&gt; must provide a text alternative | src/checks/automatic/object-text-alternative-present.js | object-text-alternative-present |  |
| a11ycore-progressbar-name-present | automatic | Progress bars have an accessible name | src/checks/automatic/progressbar-name-present.js | progressbar-name-present |  |
| a11ycore-role-img-text-alternative-present | automatic | [role="img"] must have an accessible text alternative | src/checks/automatic/role-img-alt-present.js | role-img-text-alternative-present |  |
| a11ycore-svg-image-text-alternative-present | automatic | SVG &lt;image&gt; must have a text alternative | src/checks/automatic/svg-image-text-alternative-present.js | svg-image-text-alt-present |  |
| a11ycore-svg-text-alternative-present | automatic | &lt;svg&gt; must provide a text alternative | src/checks/automatic/svg-text-alternative-present.js | svg-text-alternative-present |  |
| a11ycore-video-poster-text-alternative-present | automatic | &lt;video&gt; poster must have a text alternative | src/checks/automatic/video-poster-text-alternative-present.js | video-poster-text-alt-present |  |
| a11ycore-area-alt-decorative | manual | &lt;area&gt; with alt="" must be decorative (manual review) | src/checks/manual/area-alt-decorative-manual.js | text-alternative-quality |  |
| a11ycore-area-alt-quality | manual | &lt;area&gt; alt text must be appropriate (manual review) | src/checks/manual/area-alt-quality-manual.js | text-alternative-quality |  |
| a11ycore-canvas-text-alternative-quality | manual | &lt;canvas&gt; text alternative must be appropriate (manual review) | src/checks/manual/canvas-text-alternative-quality-manual.js | text-alternative-quality |  |
| a11ycore-embed-text-alternative-quality | manual | &lt;embed&gt; text alternative must be appropriate (manual review) | src/checks/manual/embed-text-alternative-quality-manual.js | text-alternative-quality |  |
| a11ycore-img-alt-decorative | manual | &lt;img&gt; with alt="" must be decorative (manual review) | src/checks/manual/img-alt-decorative-manual.js | text-alternative-quality |  |
| a11ycore-img-alt-quality | manual | &lt;img&gt; alt text must be appropriate (manual review) | src/checks/manual/img-alt-quality-manual.js | text-alternative-quality |  |
| a11ycore-input-image-alt-decorative | manual | &lt;input type="image"&gt; with alt="" must be appropriate (manual review) | src/checks/manual/input-image-alt-decorative-manual.js | text-alternative-quality |  |
| a11ycore-input-image-alt-quality | manual | &lt;input type="image"&gt; alt text must be appropriate (manual review) | src/checks/manual/input-image-alt-quality-manual.js | text-alternative-quality |  |
| a11ycore-object-text-alternative-quality | manual | &lt;object&gt; text alternative must be appropriate (manual review) | src/checks/manual/object-text-alternative-quality-manual.js | text-alternative-quality |  |
| a11ycore-svg-text-alternative-quality | manual | &lt;svg&gt; text alternative must be appropriate (manual review) | src/checks/manual/svg-text-alternative-quality-manual.js | text-alternative-quality |  |

### 1.2.1

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 1, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| transcript-evidence | partial | a11ycore-media-alternative-transcript-evidence |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-media-alternative-transcript-evidence | manual | Time-based media: transcript / media alternative evidence | src/checks/manual/a11ycore-media-transcript-present-manual.js | transcript-evidence |  |

### 1.2.2

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 0, manual 1**.

| Facet | Automation | Covered by |
|---|---|---|
| video-captions-track-evidence | manual | a11ycore-video-caption |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-video-caption | manual | Prerecorded video should provide a captions track | src/checks/manual/video-caption-manual.js | video-captions-track-evidence |  |

### 1.3.1

Facet coverage: **11/12** facets covered.
Automation mix: **full 8, partial 1, manual 3**.

| Facet | Automation | Covered by |
|---|---|---|
| form-control-programmatic-label-present | full | a11ycore-form-control-programmatic-label-present |
| form-control-label-quality-review | manual | — |
| table-headers-attr-valid | full | a11ycore-table-headers-attr-valid |
| table-th-has-data-cells | partial | a11ycore-table-th-has-data-cells |
| aria-hidden-body-absent | full | a11ycore-aria-hidden-body |
| list-children-valid | full | a11ycore-list-children-valid |
| listitem-parent-valid | full | a11ycore-listitem-parent-valid |
| definition-list-children-valid | full | a11ycore-definition-list-children-valid |
| dlitem-parent-valid | full | a11ycore-dlitem-parent-valid |
| p-as-heading-evidence | manual | a11ycore-p-as-heading |
| table-fake-caption-evidence | manual | a11ycore-table-fake-caption |
| td-has-header | full | a11ycore-td-has-header |

Uncovered facets: form-control-label-quality-review

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-aria-hidden-body | automatic | The document &lt;body&gt; must not be aria-hidden | src/checks/automatic/aria-hidden-body.js | aria-hidden-body-absent |  |
| a11ycore-definition-list-children-valid | automatic | Description lists must be structured correctly | src/checks/automatic/definition-list-children-valid.js | definition-list-children-valid |  |
| a11ycore-dlitem-parent-valid | automatic | Description-list items must be inside a description list | src/checks/automatic/dlitem-parent-valid.js | dlitem-parent-valid |  |
| a11ycore-form-control-programmatic-label-present | automatic | Form controls must have a programmatic label | src/checks/automatic/form-control-programmatic-label-present.js | form-control-programmatic-label-present |  |
| a11ycore-list-children-valid | automatic | Lists must only directly contain list items | src/checks/automatic/list-children-valid.js | list-children-valid |  |
| a11ycore-listitem-parent-valid | automatic | List items must be inside a list container | src/checks/automatic/listitem-parent-valid.js | listitem-parent-valid |  |
| a11ycore-table-headers-attr-valid | automatic | Table cell "headers" attribute must reference valid header cells | src/checks/automatic/table-headers-attr-valid.js | table-headers-attr-valid |  |
| a11ycore-table-th-has-data-cells | automatic | &lt;th&gt; elements must describe at least one data cell | src/checks/automatic/table-th-has-data-cells.js | table-th-has-data-cells |  |
| a11ycore-td-has-header | automatic | Data cells in large tables must have an associated header | src/checks/automatic/td-has-header.js | td-has-header |  |
| a11ycore-p-as-heading | manual | A &lt;p&gt; styled to look like a heading should probably be a real heading | src/checks/manual/p-as-heading-manual.js | p-as-heading-evidence |  |
| a11ycore-table-fake-caption | manual | A table's first row should not stand in for a real &lt;caption&gt; | src/checks/manual/table-fake-caption-manual.js | table-fake-caption-evidence |  |

### 1.3.4

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| css-orientation-lock | full | a11ycore-css-orientation-lock |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-css-orientation-lock | automatic | CSS must not lock the page to a single orientation | src/checks/automatic/css-orientation-lock.js | css-orientation-lock |  |

### 1.3.5

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| autocomplete-valid | full | a11ycore-autocomplete-valid |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-autocomplete-valid | automatic | autocomplete attribute must be a valid autofill value | src/checks/automatic/autocomplete-valid.js | autocomplete-valid |  |

### 1.4.1

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 1, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| link-in-text-block | partial | a11ycore-link-in-text-block |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-link-in-text-block | automatic | Links in text blocks must be distinguishable from surrounding text without relying on color alone | src/checks/automatic/link-in-text-block.js | link-in-text-block |  |

### 1.4.2

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 0, manual 1**.

| Facet | Automation | Covered by |
|---|---|---|
| no-autoplay-audio-evidence | manual | a11ycore-no-autoplay-audio |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-no-autoplay-audio | manual | Autoplaying audio should provide a pause/stop or volume-control mechanism | src/checks/manual/no-autoplay-audio-manual.js | no-autoplay-audio-evidence |  |

### 1.4.3

Facet coverage: **2/2** facets covered.
Automation mix: **full 0, partial 2, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| contrast-computability-143 | partial | a11ycore-contrast-computable |
| contrast-minimum-text | partial | a11ycore-contrast-minimum |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-contrast-computable | automatic | Color contrast is computable for rendered text | src/checks/automatic/contrast-computable.js | contrast-computability-143 |  |
| a11ycore-contrast-minimum | automatic | Text must meet the minimum color contrast ratio | src/checks/automatic/contrast-minimum.js | contrast-minimum-text |  |

### 1.4.4

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| meta-viewport-zoom-enabled | full | a11ycore-meta-viewport-zoom-enabled |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-meta-viewport-zoom-enabled | automatic | Viewport meta tag must not disable zoom | src/checks/automatic/meta-viewport-zoom-enabled.js | meta-viewport-zoom-enabled |  |

### 1.4.6

Facet coverage: **2/2** facets covered.
Automation mix: **full 0, partial 2, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| contrast-computability-146 | partial | a11ycore-contrast-computable |
| contrast-enhanced-text | partial | a11ycore-contrast-enhanced |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-contrast-computable | automatic | Color contrast is computable for rendered text | src/checks/automatic/contrast-computable.js | contrast-computability-146 |  |
| a11ycore-contrast-enhanced | automatic | Text must meet the enhanced color contrast ratio | src/checks/automatic/contrast-enhanced.js | contrast-enhanced-text |  |

### 1.4.12

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| avoid-inline-spacing | full | a11ycore-avoid-inline-spacing |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-avoid-inline-spacing | automatic | Inline style must not force text spacing with !important | src/checks/automatic/avoid-inline-spacing.js | avoid-inline-spacing |  |

### 2.1.1

Facet coverage: **4/4** facets covered.
Automation mix: **full 1, partial 1, manual 2**.
Rules missing facet mapping for this SC: manual-review

| Facet | Automation | Covered by |
|---|---|---|
| iframe-tabindex-negative-content-not-focusable | partial | a11ycore-iframe-focusable-content |
| server-side-image-map-absent | full | a11ycore-server-side-image-map-absent |
| scrollable-region-focusable-evidence | manual | a11ycore-scrollable-region-focusable |
| mouse-only-event-handlers-evidence | manual | a11ycore-mouse-only-event-handlers |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-iframe-focusable-content | automatic | Frames with tabindex="-1" must not contain focusable content | src/checks/automatic/iframe-focusable-content.js | iframe-tabindex-negative-content-not-focusable |  |
| a11ycore-server-side-image-map-absent | automatic | Images must not use a server-side image map | src/checks/automatic/server-side-image-map-absent.js | server-side-image-map-absent |  |
| a11ycore-mouse-only-event-handlers | manual | Pointer-only inline event handlers should have a keyboard-reachable equivalent | src/checks/manual/mouse-only-event-handlers-manual.js | mouse-only-event-handlers-evidence |  |
| a11ycore-scrollable-region-focusable | manual | Scrollable regions with no focusable content should be keyboard-focusable | src/checks/manual/scrollable-region-focusable-manual.js | scrollable-region-focusable-evidence |  |
| manual-review | manual | Manual review: keyboard navigation and focus order | src/checks/manual-review.js |  |  |

### 2.1.3

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 0, manual 1**.

| Facet | Automation | Covered by |
|---|---|---|
| scrollable-region-focusable-evidence | manual | a11ycore-scrollable-region-focusable |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-scrollable-region-focusable | manual | Scrollable regions with no focusable content should be keyboard-focusable | src/checks/manual/scrollable-region-focusable-manual.js | scrollable-region-focusable-evidence |  |

### 2.2.1

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| meta-refresh-timing-absent | full | a11ycore-meta-refresh-timing-absent |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-meta-refresh-timing-absent | automatic | Page must not use a timed meta refresh | src/checks/automatic/meta-refresh-timing-absent.js | meta-refresh-timing-absent |  |

### 2.2.2

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| deprecated-non-stoppable-elements-absent | full | a11ycore-deprecated-elements-not-used |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-deprecated-elements-not-used | automatic | Obsolete non-stoppable elements (&lt;blink&gt;, &lt;marquee&gt;) must not be used | src/checks/automatic/deprecated-elements-not-used.js | deprecated-non-stoppable-elements-absent |  |

### 2.2.4

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| meta-refresh-no-exceptions | full | a11ycore-meta-refresh-no-exceptions |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-meta-refresh-no-exceptions | automatic | Page must not use a meta refresh at all (AAA) | src/checks/automatic/meta-refresh-no-exceptions.js | meta-refresh-no-exceptions |  |

### 2.4.1

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 1, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| bypass-blocks-present | partial | a11ycore-bypass-blocks-present |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-bypass-blocks-present | automatic | Page must provide a way to bypass repeated blocks | src/checks/automatic/bypass-blocks-present.js | bypass-blocks-present |  |

### 2.4.2

Facet coverage: **2/2** facets covered.
Automation mix: **full 1, partial 1, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| page-title-present | full | a11ycore-page-title-present |
| page-title-patterns | partial | a11ycore-page-title-patterns |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-page-title-present | automatic | Page title is present and non-empty | src/checks/automatic/page-title-present.js | page-title-present |  |
| a11ycore-page-title-patterns | manual | Page title patterns that may indicate low descriptiveness | src/checks/manual/page-title-patterns-manual.js | page-title-patterns |  |

### 2.4.3

Facet coverage: **0/0** facets covered.
Automation mix: **full 0, partial 0, manual 0**.
Rules missing facet mapping for this SC: manual-review

| Facet | Automation | Covered by |
|---|---|---|

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| manual-review | manual | Manual review: keyboard navigation and focus order | src/checks/manual-review.js |  |  |

### 2.4.4

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 0, manual 1**.

| Facet | Automation | Covered by |
|---|---|---|
| link-text-descriptive-evidence | manual | a11ycore-link-name-quality |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-link-name-quality | manual | Link text should be descriptive, not generic | src/checks/manual/link-name-quality-manual.js | link-text-descriptive-evidence |  |

### 2.4.7

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.
Rules missing facet mapping for this SC: a11ycore-aria-hidden-focus, manual-review

| Facet | Automation | Covered by |
|---|---|---|
| css-hidden-focusable | full | a11ycore-css-hidden-focus |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-aria-hidden-focus | automatic | ARIA hidden elements must not be focusable | src/checks/automatic/aria-hidden-focus.js |  |  |
| a11ycore-css-hidden-focus | manual | Focusable elements must not be visually hidden | src/checks/manual/css-hidden-focus.js | css-hidden-focusable |  |
| manual-review | manual | Manual review: keyboard navigation and focus order | src/checks/manual-review.js |  |  |

### 2.4.9

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 0, manual 1**.

| Facet | Automation | Covered by |
|---|---|---|
| identical-links-same-purpose-evidence | manual | a11ycore-identical-links-same-purpose |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-identical-links-same-purpose | manual | Links with the same accessible name should lead to the same destination | src/checks/manual/identical-links-same-purpose-manual.js | identical-links-same-purpose-evidence |  |

### 2.5.3

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 1, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| label-in-name | partial | a11ycore-label-in-name |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-label-in-name | automatic | Label in Name: accessible name contains visible text | src/checks/automatic/label-in-name.js | label-in-name |  |

### 2.5.8

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 1, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| target-size-minimum-pointer | partial | a11ycore-target-size-minimum |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-target-size-minimum | automatic | Pointer targets meet minimum size (AA) | src/checks/automatic/target-size-minimum.js | target-size-minimum-pointer |  |

### 3.1.1

Facet coverage: **2/2** facets covered.
Automation mix: **full 2, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| html-lang-attr-present | full | a11ycore-html-lang-attr-present |
| html-xml-lang-mismatch | full | a11ycore-html-xml-lang-mismatch |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-html-xml-lang-mismatch | automatic | lang and xml:lang must not disagree | src/checks/automatic/html-xml-lang-mismatch.js | html-xml-lang-mismatch |  |
| a11ycore-html-lang-attr-present | automatic | Page language is declared | src/checks/automatic/language-page-present.js | html-lang-attr-present |  |

### 3.1.2

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| element-lang-valid | full | a11ycore-valid-lang |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-valid-lang | automatic | Element lang attribute must be syntactically valid | src/checks/automatic/valid-lang.js | element-lang-valid |  |

### 3.2.5

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| meta-refresh-no-exceptions | full | a11ycore-meta-refresh-no-exceptions |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-meta-refresh-no-exceptions | automatic | Page must not use a meta refresh at all (AAA) | src/checks/automatic/meta-refresh-no-exceptions.js | meta-refresh-no-exceptions |  |

### 3.3.2

Facet coverage: **2/2** facets covered.
Automation mix: **full 2, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| form-control-labels-or-instructions-present | full | a11ycore-form-control-programmatic-label-present |
| form-control-single-label | full | a11ycore-form-control-single-label |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-form-control-programmatic-label-present | automatic | Form controls must have a programmatic label | src/checks/automatic/form-control-programmatic-label-present.js | form-control-labels-or-instructions-present |  |
| a11ycore-form-control-single-label | automatic | Form controls must not have multiple labels | src/checks/automatic/form-control-single-label.js | form-control-single-label |  |

### 4.1.2

Facet coverage: **41/41** facets covered.
Automation mix: **full 39, partial 0, manual 2**.

| Facet | Automation | Covered by |
|---|---|---|
| form-control-name-present | full | a11ycore-form-control-programmatic-label-present |
| form-control-name-quality | manual | a11ycore-form-control-programmatic-label-quality |
| aria-hidden-focusable | full | a11ycore-aria-hidden-focus |
| link-name-present | full | a11ycore-link-name-present |
| button-name-present | full | a11ycore-button-name-present |
| checkbox-name-present | full | a11ycore-binary-control-name-present |
| radio-name-present | full | a11ycore-binary-control-name-present |
| switch-name-present | full | a11ycore-binary-control-name-present |
| combobox-name-present | full | a11ycore-combobox-name-present |
| dialog-name-present | full | a11ycore-dialog-name-present |
| menuitem-name-present | full | a11ycore-menuitem-name-present |
| tab-name-present | full | a11ycore-tab-name-present |
| slider-name-present | full | a11ycore-slider-name-present |
| textbox-name-present | full | a11ycore-textbox-name-present |
| searchbox-name-present | full | a11ycore-searchbox-name-present |
| spinbutton-name-present | full | a11ycore-spinbutton-name-present |
| listbox-name-present | full | a11ycore-listbox-name-present |
| option-name-present | full | a11ycore-option-name-present |
| treeitem-name-present | full | a11ycore-treeitem-name-present |
| aria-role-name-present | full | a11ycore-aria-role-name-present |
| aria-role-valid | full | a11ycore-aria-roles-valid |
| aria-role-not-deprecated | full | a11ycore-aria-deprecated-role |
| aria-attr-name-valid | full | a11ycore-aria-valid-attr |
| aria-attr-value-valid | full | a11ycore-aria-valid-attr-value |
| aria-attr-allowed-for-role | full | a11ycore-aria-allowed-attr |
| aria-attr-not-prohibited | full | a11ycore-aria-prohibited-attr |
| aria-attr-required-for-role | full | a11ycore-aria-required-attr |
| aria-role-allowed-for-element | full | a11ycore-aria-allowed-role |
| aria-role-required-owned-children | full | a11ycore-aria-required-children |
| aria-role-owned-children-allowed | full | a11ycore-aria-prohibited-children |
| aria-role-required-context-parent | full | a11ycore-aria-required-parent |
| iframe-name-present | full | a11ycore-iframe-name-present |
| iframe-title-unique | full | a11ycore-iframe-title-unique |
| aria-hidden-body-absent | full | a11ycore-aria-hidden-body |
| duplicate-id-aria | full | a11ycore-duplicate-id-aria |
| summary-name-present | full | a11ycore-summary-name-present |
| tooltip-name-present | full | a11ycore-tooltip-name-present |
| nested-interactive-controls-absent | full | a11ycore-nested-interactive-controls-absent |
| aria-braille-equivalent | full | a11ycore-aria-braille-equivalent |
| aria-conditional-attr | full | a11ycore-aria-conditional-attr |
| aria-checked-state-mismatch | manual | a11ycore-aria-checked-state-mismatch |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-aria-allowed-attr | automatic | aria-* attributes must be permitted for the element’s role | src/checks/automatic/aria-allowed-attr.js | aria-attr-allowed-for-role |  |
| a11ycore-aria-allowed-role | automatic | Explicit role must be permitted for its host element | src/checks/automatic/aria-allowed-role.js | aria-role-allowed-for-element |  |
| a11ycore-aria-braille-equivalent | automatic | aria-braillelabel/aria-brailleroledescription must have a non-braille equivalent | src/checks/automatic/aria-braille-equivalent.js | aria-braille-equivalent |  |
| a11ycore-aria-conditional-attr | automatic | aria-errormessage requires aria-invalid to be set to a non-false value | src/checks/automatic/aria-conditional-attr.js | aria-conditional-attr |  |
| a11ycore-aria-deprecated-role | automatic | role attribute must not use a deprecated or author-prohibited ARIA role | src/checks/automatic/aria-deprecated-role.js | aria-role-not-deprecated |  |
| a11ycore-aria-hidden-body | automatic | The document &lt;body&gt; must not be aria-hidden | src/checks/automatic/aria-hidden-body.js | aria-hidden-body-absent |  |
| a11ycore-aria-hidden-focus | automatic | ARIA hidden elements must not be focusable | src/checks/automatic/aria-hidden-focus.js | aria-hidden-focusable |  |
| a11ycore-aria-prohibited-attr | automatic | ARIA naming attributes must not be used on roles that prohibit them | src/checks/automatic/aria-prohibited-attr.js | aria-attr-not-prohibited |  |
| a11ycore-aria-prohibited-children | automatic | Container roles must not own a child with a disallowed role | src/checks/automatic/aria-prohibited-children.js | aria-role-owned-children-allowed |  |
| a11ycore-aria-required-attr | automatic | Roles with a required ARIA state/property must carry it | src/checks/automatic/aria-required-attr.js | aria-attr-required-for-role |  |
| a11ycore-aria-required-children | automatic | Container roles must own at least one required child role | src/checks/automatic/aria-required-children.js | aria-role-required-owned-children |  |
| a11ycore-aria-required-parent | automatic | Roles requiring a specific context role must be in that context | src/checks/automatic/aria-required-parent.js | aria-role-required-context-parent |  |
| a11ycore-aria-role-name-present | automatic | ARIA widget/container roles have an accessible name | src/checks/automatic/aria-role-name-present.js | aria-role-name-present |  |
| a11ycore-aria-roles-valid | automatic | role attribute must be a valid, non-abstract ARIA role | src/checks/automatic/aria-roles-valid.js | aria-role-valid |  |
| a11ycore-aria-valid-attr-value | automatic | aria-* attribute values must match their declared type | src/checks/automatic/aria-valid-attr-value.js | aria-attr-value-valid |  |
| a11ycore-aria-valid-attr | automatic | aria-* attributes must be real, defined ARIA attributes | src/checks/automatic/aria-valid-attr.js | aria-attr-name-valid |  |
| a11ycore-binary-control-name-present | automatic | Binary controls have an accessible name | src/checks/automatic/binary-control-name-present.js | checkbox-name-present, radio-name-present, switch-name-present |  |
| a11ycore-button-name-present | automatic | Buttons have an accessible name | src/checks/automatic/button-name-present.js | button-name-present |  |
| a11ycore-combobox-name-present | automatic | Comboboxes have an accessible name | src/checks/automatic/combobox-name-present.js | combobox-name-present |  |
| a11ycore-dialog-name-present | automatic | Dialogs have an accessible name | src/checks/automatic/dialog-name-present.js | dialog-name-present |  |
| a11ycore-duplicate-id-aria | automatic | IDs referenced by ARIA must be unique | src/checks/automatic/duplicate-id-aria.js | duplicate-id-aria |  |
| a11ycore-form-control-programmatic-label-present | automatic | Form controls must have a programmatic label | src/checks/automatic/form-control-programmatic-label-present.js | form-control-name-present |  |
| a11ycore-iframe-name-present | automatic | Frames have an accessible name | src/checks/automatic/iframe-name-present.js | iframe-name-present |  |
| a11ycore-iframe-title-unique | automatic | Frame titles must be unique | src/checks/automatic/iframe-title-unique.js | iframe-title-unique |  |
| a11ycore-link-name-present | automatic | Links have an accessible name | src/checks/automatic/link-name-present.js | link-name-present |  |
| a11ycore-listbox-name-present | automatic | Accessible name is present | src/checks/automatic/listbox-name-present.js | listbox-name-present |  |
| a11ycore-menuitem-name-present | automatic | Menu items have an accessible name | src/checks/automatic/menuitem-name-present.js | menuitem-name-present |  |
| a11ycore-nested-interactive-controls-absent | automatic | Interactive controls must not be nested | src/checks/automatic/nested-interactive-controls-absent.js | nested-interactive-controls-absent |  |
| a11ycore-option-name-present | automatic | Accessible name is present | src/checks/automatic/option-name-present.js | option-name-present |  |
| a11ycore-searchbox-name-present | automatic | Accessible name is present | src/checks/automatic/searchbox-name-present.js | searchbox-name-present |  |
| a11ycore-slider-name-present | automatic | Sliders have an accessible name | src/checks/automatic/slider-name-present.js | slider-name-present |  |
| a11ycore-spinbutton-name-present | automatic | Accessible name is present | src/checks/automatic/spinbutton-name-present.js | spinbutton-name-present |  |
| a11ycore-summary-name-present | automatic | Summary elements have an accessible name | src/checks/automatic/summary-name-present.js | summary-name-present |  |
| a11ycore-tab-name-present | automatic | Tabs have an accessible name | src/checks/automatic/tab-name-present.js | tab-name-present |  |
| a11ycore-textbox-name-present | automatic | Accessible name is present | src/checks/automatic/textbox-name-present.js | textbox-name-present |  |
| a11ycore-tooltip-name-present | automatic | Tooltips have an accessible name | src/checks/automatic/tooltip-name-present.js | tooltip-name-present |  |
| a11ycore-treeitem-name-present | automatic | Accessible name is present | src/checks/automatic/treeitem-name-present.js | treeitem-name-present |  |
| a11ycore-aria-checked-state-mismatch | manual | Native checkbox/radio aria-checked should match its actual state | src/checks/manual/aria-checked-state-mismatch-manual.js | aria-checked-state-mismatch |  |
| a11ycore-form-control-programmatic-label-quality | manual | Form controls should not rely on placeholder or title as the primary label | src/checks/manual/form-control-programmatic-label-quality-manual.js | form-control-name-quality |  |

### (unmapped)

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-accesskeys | manual | accesskey values must be unique | src/checks/manual/accesskeys-manual.js |  |  |
| a11ycore-aria-text | manual | role="text" elements should have no focusable descendants | src/checks/manual/aria-text-manual.js |  |  |
| a11ycore-empty-heading | manual | Headings must not be empty | src/checks/manual/empty-heading-manual.js |  |  |
| a11ycore-empty-table-header | manual | Table header cells must not be empty | src/checks/manual/empty-table-header-manual.js |  |  |
| a11ycore-focus-order-semantics | manual | Elements added to the tab order should have interactive semantics | src/checks/manual/focus-order-semantics-manual.js |  |  |
| a11ycore-heading-order | manual | Heading levels must not skip a level | src/checks/manual/heading-order-manual.js |  |  |
| a11ycore-image-redundant-alt | manual | Image alt text must not duplicate adjacent visible text | src/checks/manual/image-redundant-alt-manual.js |  |  |
| a11ycore-label-title-only | manual | Form controls should not use title as their only label | src/checks/manual/label-title-only-manual.js |  |  |
| a11ycore-landmark-banner-is-top-level | manual | Banner landmark must be top-level | src/checks/manual/landmark-banner-is-top-level-manual.js |  |  |
| a11ycore-landmark-contentinfo-is-top-level | manual | Contentinfo landmark must be top-level | src/checks/manual/landmark-contentinfo-is-top-level-manual.js |  |  |
| a11ycore-landmark-main-is-top-level | manual | Main landmark must be top-level | src/checks/manual/landmark-main-is-top-level-manual.js |  |  |
| a11ycore-landmark-no-duplicate-banner | manual | Page must not have more than one banner landmark | src/checks/manual/landmark-no-duplicate-banner-manual.js |  |  |
| a11ycore-landmark-no-duplicate-contentinfo | manual | Page must not have more than one contentinfo landmark | src/checks/manual/landmark-no-duplicate-contentinfo-manual.js |  |  |
| a11ycore-landmark-no-duplicate-main | manual | Page must not have more than one main landmark | src/checks/manual/landmark-no-duplicate-main-manual.js |  |  |
| a11ycore-landmark-one-main | manual | Page should have a main landmark | src/checks/manual/landmark-one-main-manual.js |  |  |
| a11ycore-landmark-unique | manual | Landmarks with the same role must have unique names | src/checks/manual/landmark-unique-manual.js |  |  |
| a11ycore-meta-viewport-large | manual | Viewport meta tag should allow zooming up to 500% | src/checks/manual/meta-viewport-large-manual.js |  |  |
| a11ycore-page-has-heading-one | manual | Page should have a level-one heading | src/checks/manual/page-has-heading-one-manual.js |  |  |
| a11ycore-presentation-role-conflict | manual | Presentational role must not conflict with a global ARIA attribute or focusability | src/checks/manual/presentation-role-conflict-manual.js |  |  |
| a11ycore-region | manual | Page content should be inside a landmark region | src/checks/manual/region-manual.js |  |  |
| a11ycore-scope-attr-valid | manual | scope attribute must have a valid value | src/checks/manual/scope-attr-valid-manual.js |  |  |
| a11ycore-skip-link | manual | Skip link must have a resolvable target | src/checks/manual/skip-link-manual.js |  |  |
| a11ycore-tabindex | manual | tabindex should not be greater than 0 | src/checks/manual/tabindex-manual.js |  |  |
| a11ycore-table-duplicate-name | manual | Table caption must not duplicate its summary attribute | src/checks/manual/table-duplicate-name-manual.js |  |  |

## SC Coverage (B) — Enforced + manual/informative (normativeMappings + informativeReferences)

### 1.1.1

Facet coverage: **13/21** facets covered.
Automation mix: **full 6, partial 13, manual 2**.

| Facet | Automation | Covered by |
|---|---|---|
| text-alternative-mechanism | partial | — |
| functional-nontext-name | partial | — |
| decorative-null | manual | — |
| text-alt-quality-review | manual | — |
| text-alternative-quality | partial | a11ycore-area-alt-decorative, a11ycore-area-alt-quality, a11ycore-canvas-text-alternative-quality, a11ycore-embed-text-alternative-quality, a11ycore-img-alt-decorative, a11ycore-img-alt-quality, a11ycore-input-image-alt-decorative, a11ycore-input-image-alt-quality, a11ycore-object-text-alternative-quality, a11ycore-svg-text-alternative-quality |
| img-alt-attr-present | full | a11ycore-img-alt-present |
| role-img-text-alternative-present | full | a11ycore-role-img-text-alternative-present |
| input-image-alt-attr-present | full | a11ycore-input-image-alt-present |
| area-alt-attr-present | full | a11ycore-area-alt-present |
| canvas-text-alternative-present | partial | a11ycore-canvas-text-alternative-present |
| embed-text-alternative-present | partial | a11ycore-embed-text-alternative-present |
| svg-text-alt-present | partial | — |
| svg-text-alternative-present | partial | a11ycore-svg-text-alternative-present |
| svg-image-text-alt-present | partial | a11ycore-svg-image-text-alternative-present |
| object-text-alternative-present | partial | a11ycore-object-text-alternative-present |
| embed-name-present | partial | — |
| video-poster-text-alt-present | partial | a11ycore-video-poster-text-alternative-present |
| alt-suspicious-patterns | partial | — |
| acc-eligibility-filtering | partial | — |
| meter-name-present | full | a11ycore-meter-name-present |
| progressbar-name-present | full | a11ycore-progressbar-name-present |

Uncovered facets: text-alternative-mechanism, functional-nontext-name, decorative-null, text-alt-quality-review, svg-text-alt-present, embed-name-present, alt-suspicious-patterns, acc-eligibility-filtering

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-area-alt-present | automatic | &amp;lt;area&amp;gt; must have an alt attribute | src/checks/automatic/area-alt-present.js | area-alt-attr-present |  |
| a11ycore-canvas-text-alternative-present | automatic | &lt;canvas&gt; must provide a text alternative | src/checks/automatic/canvas-text-alternative-present.js | canvas-text-alternative-present |  |
| a11ycore-embed-text-alternative-present | automatic | &lt;embed&gt; must provide a text alternative | src/checks/automatic/embed-text-alternative-present.js | embed-text-alternative-present |  |
| a11ycore-img-alt-present | automatic | &lt;img&gt; must have an alt attribute | src/checks/automatic/img-alt-present.js | img-alt-attr-present |  |
| a11ycore-input-image-alt-present | automatic | &lt;input type="image"&gt; must have an alt attribute | src/checks/automatic/input-image-alt-present.js | input-image-alt-attr-present |  |
| a11ycore-meter-name-present | automatic | Meters have an accessible name | src/checks/automatic/meter-name-present.js | meter-name-present |  |
| a11ycore-object-text-alternative-present | automatic | &lt;object&gt; must provide a text alternative | src/checks/automatic/object-text-alternative-present.js | object-text-alternative-present |  |
| a11ycore-progressbar-name-present | automatic | Progress bars have an accessible name | src/checks/automatic/progressbar-name-present.js | progressbar-name-present |  |
| a11ycore-role-img-text-alternative-present | automatic | [role="img"] must have an accessible text alternative | src/checks/automatic/role-img-alt-present.js | role-img-text-alternative-present |  |
| a11ycore-svg-image-text-alternative-present | automatic | SVG &lt;image&gt; must have a text alternative | src/checks/automatic/svg-image-text-alternative-present.js | svg-image-text-alt-present |  |
| a11ycore-svg-text-alternative-present | automatic | &lt;svg&gt; must provide a text alternative | src/checks/automatic/svg-text-alternative-present.js | svg-text-alternative-present |  |
| a11ycore-video-poster-text-alternative-present | automatic | &lt;video&gt; poster must have a text alternative | src/checks/automatic/video-poster-text-alternative-present.js | video-poster-text-alt-present |  |
| a11ycore-area-alt-decorative | manual | &lt;area&gt; with alt="" must be decorative (manual review) | src/checks/manual/area-alt-decorative-manual.js | text-alternative-quality |  |
| a11ycore-area-alt-quality | manual | &lt;area&gt; alt text must be appropriate (manual review) | src/checks/manual/area-alt-quality-manual.js | text-alternative-quality |  |
| a11ycore-canvas-text-alternative-quality | manual | &lt;canvas&gt; text alternative must be appropriate (manual review) | src/checks/manual/canvas-text-alternative-quality-manual.js | text-alternative-quality |  |
| a11ycore-embed-text-alternative-quality | manual | &lt;embed&gt; text alternative must be appropriate (manual review) | src/checks/manual/embed-text-alternative-quality-manual.js | text-alternative-quality |  |
| a11ycore-img-alt-decorative | manual | &lt;img&gt; with alt="" must be decorative (manual review) | src/checks/manual/img-alt-decorative-manual.js | text-alternative-quality |  |
| a11ycore-img-alt-quality | manual | &lt;img&gt; alt text must be appropriate (manual review) | src/checks/manual/img-alt-quality-manual.js | text-alternative-quality |  |
| a11ycore-input-image-alt-decorative | manual | &lt;input type="image"&gt; with alt="" must be appropriate (manual review) | src/checks/manual/input-image-alt-decorative-manual.js | text-alternative-quality |  |
| a11ycore-input-image-alt-quality | manual | &lt;input type="image"&gt; alt text must be appropriate (manual review) | src/checks/manual/input-image-alt-quality-manual.js | text-alternative-quality |  |
| a11ycore-object-text-alternative-quality | manual | &lt;object&gt; text alternative must be appropriate (manual review) | src/checks/manual/object-text-alternative-quality-manual.js | text-alternative-quality |  |
| a11ycore-svg-text-alternative-quality | manual | &lt;svg&gt; text alternative must be appropriate (manual review) | src/checks/manual/svg-text-alternative-quality-manual.js | text-alternative-quality |  |

### 1.2.1

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 1, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| transcript-evidence | partial | a11ycore-media-alternative-transcript-evidence |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-media-alternative-transcript-evidence | manual | Time-based media: transcript / media alternative evidence | src/checks/manual/a11ycore-media-transcript-present-manual.js | transcript-evidence |  |

### 1.2.2

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 0, manual 1**.

| Facet | Automation | Covered by |
|---|---|---|
| video-captions-track-evidence | manual | a11ycore-video-caption |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-video-caption | manual | Prerecorded video should provide a captions track | src/checks/manual/video-caption-manual.js | video-captions-track-evidence |  |

### 1.3.1

Facet coverage: **11/12** facets covered.
Automation mix: **full 8, partial 1, manual 3**.

| Facet | Automation | Covered by |
|---|---|---|
| form-control-programmatic-label-present | full | a11ycore-form-control-programmatic-label-present |
| form-control-label-quality-review | manual | — |
| table-headers-attr-valid | full | a11ycore-table-headers-attr-valid |
| table-th-has-data-cells | partial | a11ycore-table-th-has-data-cells |
| aria-hidden-body-absent | full | a11ycore-aria-hidden-body |
| list-children-valid | full | a11ycore-list-children-valid |
| listitem-parent-valid | full | a11ycore-listitem-parent-valid |
| definition-list-children-valid | full | a11ycore-definition-list-children-valid |
| dlitem-parent-valid | full | a11ycore-dlitem-parent-valid |
| p-as-heading-evidence | manual | a11ycore-p-as-heading |
| table-fake-caption-evidence | manual | a11ycore-table-fake-caption |
| td-has-header | full | a11ycore-td-has-header |

Uncovered facets: form-control-label-quality-review

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-aria-hidden-body | automatic | The document &lt;body&gt; must not be aria-hidden | src/checks/automatic/aria-hidden-body.js | aria-hidden-body-absent |  |
| a11ycore-definition-list-children-valid | automatic | Description lists must be structured correctly | src/checks/automatic/definition-list-children-valid.js | definition-list-children-valid |  |
| a11ycore-dlitem-parent-valid | automatic | Description-list items must be inside a description list | src/checks/automatic/dlitem-parent-valid.js | dlitem-parent-valid |  |
| a11ycore-form-control-programmatic-label-present | automatic | Form controls must have a programmatic label | src/checks/automatic/form-control-programmatic-label-present.js | form-control-programmatic-label-present |  |
| a11ycore-list-children-valid | automatic | Lists must only directly contain list items | src/checks/automatic/list-children-valid.js | list-children-valid |  |
| a11ycore-listitem-parent-valid | automatic | List items must be inside a list container | src/checks/automatic/listitem-parent-valid.js | listitem-parent-valid |  |
| a11ycore-table-headers-attr-valid | automatic | Table cell "headers" attribute must reference valid header cells | src/checks/automatic/table-headers-attr-valid.js | table-headers-attr-valid |  |
| a11ycore-table-th-has-data-cells | automatic | &lt;th&gt; elements must describe at least one data cell | src/checks/automatic/table-th-has-data-cells.js | table-th-has-data-cells |  |
| a11ycore-td-has-header | automatic | Data cells in large tables must have an associated header | src/checks/automatic/td-has-header.js | td-has-header |  |
| a11ycore-p-as-heading | manual | A &lt;p&gt; styled to look like a heading should probably be a real heading | src/checks/manual/p-as-heading-manual.js | p-as-heading-evidence |  |
| a11ycore-table-fake-caption | manual | A table's first row should not stand in for a real &lt;caption&gt; | src/checks/manual/table-fake-caption-manual.js | table-fake-caption-evidence |  |

### 1.3.4

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| css-orientation-lock | full | a11ycore-css-orientation-lock |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-css-orientation-lock | automatic | CSS must not lock the page to a single orientation | src/checks/automatic/css-orientation-lock.js | css-orientation-lock |  |

### 1.3.5

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| autocomplete-valid | full | a11ycore-autocomplete-valid |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-autocomplete-valid | automatic | autocomplete attribute must be a valid autofill value | src/checks/automatic/autocomplete-valid.js | autocomplete-valid |  |

### 1.4.1

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 1, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| link-in-text-block | partial | a11ycore-link-in-text-block |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-link-in-text-block | automatic | Links in text blocks must be distinguishable from surrounding text without relying on color alone | src/checks/automatic/link-in-text-block.js | link-in-text-block |  |

### 1.4.2

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 0, manual 1**.

| Facet | Automation | Covered by |
|---|---|---|
| no-autoplay-audio-evidence | manual | a11ycore-no-autoplay-audio |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-no-autoplay-audio | manual | Autoplaying audio should provide a pause/stop or volume-control mechanism | src/checks/manual/no-autoplay-audio-manual.js | no-autoplay-audio-evidence |  |

### 1.4.3

Facet coverage: **2/2** facets covered.
Automation mix: **full 0, partial 2, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| contrast-computability-143 | partial | a11ycore-contrast-computable |
| contrast-minimum-text | partial | a11ycore-contrast-minimum |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-contrast-computable | automatic | Color contrast is computable for rendered text | src/checks/automatic/contrast-computable.js | contrast-computability-143 |  |
| a11ycore-contrast-minimum | automatic | Text must meet the minimum color contrast ratio | src/checks/automatic/contrast-minimum.js | contrast-minimum-text |  |

### 1.4.4

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| meta-viewport-zoom-enabled | full | a11ycore-meta-viewport-zoom-enabled |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-meta-viewport-zoom-enabled | automatic | Viewport meta tag must not disable zoom | src/checks/automatic/meta-viewport-zoom-enabled.js | meta-viewport-zoom-enabled |  |

### 1.4.6

Facet coverage: **2/2** facets covered.
Automation mix: **full 0, partial 2, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| contrast-computability-146 | partial | a11ycore-contrast-computable |
| contrast-enhanced-text | partial | a11ycore-contrast-enhanced |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-contrast-computable | automatic | Color contrast is computable for rendered text | src/checks/automatic/contrast-computable.js | contrast-computability-146 |  |
| a11ycore-contrast-enhanced | automatic | Text must meet the enhanced color contrast ratio | src/checks/automatic/contrast-enhanced.js | contrast-enhanced-text |  |

### 1.4.12

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| avoid-inline-spacing | full | a11ycore-avoid-inline-spacing |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-avoid-inline-spacing | automatic | Inline style must not force text spacing with !important | src/checks/automatic/avoid-inline-spacing.js | avoid-inline-spacing |  |

### 2.1.1

Facet coverage: **4/4** facets covered.
Automation mix: **full 1, partial 1, manual 2**.
Rules missing facet mapping for this SC: manual-review

| Facet | Automation | Covered by |
|---|---|---|
| iframe-tabindex-negative-content-not-focusable | partial | a11ycore-iframe-focusable-content |
| server-side-image-map-absent | full | a11ycore-server-side-image-map-absent |
| scrollable-region-focusable-evidence | manual | a11ycore-scrollable-region-focusable |
| mouse-only-event-handlers-evidence | manual | a11ycore-mouse-only-event-handlers |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-iframe-focusable-content | automatic | Frames with tabindex="-1" must not contain focusable content | src/checks/automatic/iframe-focusable-content.js | iframe-tabindex-negative-content-not-focusable |  |
| a11ycore-server-side-image-map-absent | automatic | Images must not use a server-side image map | src/checks/automatic/server-side-image-map-absent.js | server-side-image-map-absent |  |
| a11ycore-mouse-only-event-handlers | manual | Pointer-only inline event handlers should have a keyboard-reachable equivalent | src/checks/manual/mouse-only-event-handlers-manual.js | mouse-only-event-handlers-evidence |  |
| a11ycore-scrollable-region-focusable | manual | Scrollable regions with no focusable content should be keyboard-focusable | src/checks/manual/scrollable-region-focusable-manual.js | scrollable-region-focusable-evidence |  |
| manual-review | manual | Manual review: keyboard navigation and focus order | src/checks/manual-review.js |  |  |

### 2.1.3

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 0, manual 1**.

| Facet | Automation | Covered by |
|---|---|---|
| scrollable-region-focusable-evidence | manual | a11ycore-scrollable-region-focusable |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-scrollable-region-focusable | manual | Scrollable regions with no focusable content should be keyboard-focusable | src/checks/manual/scrollable-region-focusable-manual.js | scrollable-region-focusable-evidence |  |

### 2.2.1

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| meta-refresh-timing-absent | full | a11ycore-meta-refresh-timing-absent |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-meta-refresh-timing-absent | automatic | Page must not use a timed meta refresh | src/checks/automatic/meta-refresh-timing-absent.js | meta-refresh-timing-absent |  |

### 2.2.2

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| deprecated-non-stoppable-elements-absent | full | a11ycore-deprecated-elements-not-used |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-deprecated-elements-not-used | automatic | Obsolete non-stoppable elements (&lt;blink&gt;, &lt;marquee&gt;) must not be used | src/checks/automatic/deprecated-elements-not-used.js | deprecated-non-stoppable-elements-absent |  |

### 2.2.4

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| meta-refresh-no-exceptions | full | a11ycore-meta-refresh-no-exceptions |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-meta-refresh-no-exceptions | automatic | Page must not use a meta refresh at all (AAA) | src/checks/automatic/meta-refresh-no-exceptions.js | meta-refresh-no-exceptions |  |

### 2.4.1

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 1, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| bypass-blocks-present | partial | a11ycore-bypass-blocks-present |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-bypass-blocks-present | automatic | Page must provide a way to bypass repeated blocks | src/checks/automatic/bypass-blocks-present.js | bypass-blocks-present |  |

### 2.4.2

Facet coverage: **2/2** facets covered.
Automation mix: **full 1, partial 1, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| page-title-present | full | a11ycore-page-title-present |
| page-title-patterns | partial | a11ycore-page-title-patterns |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-page-title-present | automatic | Page title is present and non-empty | src/checks/automatic/page-title-present.js | page-title-present |  |
| a11ycore-page-title-patterns | manual | Page title patterns that may indicate low descriptiveness | src/checks/manual/page-title-patterns-manual.js | page-title-patterns |  |

### 2.4.3

Facet coverage: **0/0** facets covered.
Automation mix: **full 0, partial 0, manual 0**.
Rules missing facet mapping for this SC: manual-review

| Facet | Automation | Covered by |
|---|---|---|

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| manual-review | manual | Manual review: keyboard navigation and focus order | src/checks/manual-review.js |  |  |

### 2.4.4

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 0, manual 1**.

| Facet | Automation | Covered by |
|---|---|---|
| link-text-descriptive-evidence | manual | a11ycore-link-name-quality |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-link-name-quality | manual | Link text should be descriptive, not generic | src/checks/manual/link-name-quality-manual.js | link-text-descriptive-evidence |  |

### 2.4.7

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.
Rules missing facet mapping for this SC: a11ycore-aria-hidden-focus, manual-review

| Facet | Automation | Covered by |
|---|---|---|
| css-hidden-focusable | full | a11ycore-css-hidden-focus |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-aria-hidden-focus | automatic | ARIA hidden elements must not be focusable | src/checks/automatic/aria-hidden-focus.js |  |  |
| a11ycore-css-hidden-focus | manual | Focusable elements must not be visually hidden | src/checks/manual/css-hidden-focus.js | css-hidden-focusable |  |
| manual-review | manual | Manual review: keyboard navigation and focus order | src/checks/manual-review.js |  |  |

### 2.4.9

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 0, manual 1**.

| Facet | Automation | Covered by |
|---|---|---|
| identical-links-same-purpose-evidence | manual | a11ycore-identical-links-same-purpose |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-identical-links-same-purpose | manual | Links with the same accessible name should lead to the same destination | src/checks/manual/identical-links-same-purpose-manual.js | identical-links-same-purpose-evidence |  |

### 2.5.3

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 1, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| label-in-name | partial | a11ycore-label-in-name |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-label-in-name | automatic | Label in Name: accessible name contains visible text | src/checks/automatic/label-in-name.js | label-in-name |  |

### 2.5.8

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 1, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| target-size-minimum-pointer | partial | a11ycore-target-size-minimum |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-target-size-minimum | automatic | Pointer targets meet minimum size (AA) | src/checks/automatic/target-size-minimum.js | target-size-minimum-pointer |  |

### 3.1.1

Facet coverage: **2/2** facets covered.
Automation mix: **full 2, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| html-lang-attr-present | full | a11ycore-html-lang-attr-present |
| html-xml-lang-mismatch | full | a11ycore-html-xml-lang-mismatch |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-html-xml-lang-mismatch | automatic | lang and xml:lang must not disagree | src/checks/automatic/html-xml-lang-mismatch.js | html-xml-lang-mismatch |  |
| a11ycore-html-lang-attr-present | automatic | Page language is declared | src/checks/automatic/language-page-present.js | html-lang-attr-present |  |

### 3.1.2

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| element-lang-valid | full | a11ycore-valid-lang |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-valid-lang | automatic | Element lang attribute must be syntactically valid | src/checks/automatic/valid-lang.js | element-lang-valid |  |

### 3.2.5

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| meta-refresh-no-exceptions | full | a11ycore-meta-refresh-no-exceptions |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-meta-refresh-no-exceptions | automatic | Page must not use a meta refresh at all (AAA) | src/checks/automatic/meta-refresh-no-exceptions.js | meta-refresh-no-exceptions |  |

### 3.3.2

Facet coverage: **2/2** facets covered.
Automation mix: **full 2, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| form-control-labels-or-instructions-present | full | a11ycore-form-control-programmatic-label-present |
| form-control-single-label | full | a11ycore-form-control-single-label |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-form-control-programmatic-label-present | automatic | Form controls must have a programmatic label | src/checks/automatic/form-control-programmatic-label-present.js | form-control-labels-or-instructions-present |  |
| a11ycore-form-control-single-label | automatic | Form controls must not have multiple labels | src/checks/automatic/form-control-single-label.js | form-control-single-label |  |

### 4.1.2

Facet coverage: **41/41** facets covered.
Automation mix: **full 39, partial 0, manual 2**.

| Facet | Automation | Covered by |
|---|---|---|
| form-control-name-present | full | a11ycore-form-control-programmatic-label-present |
| form-control-name-quality | manual | a11ycore-form-control-programmatic-label-quality |
| aria-hidden-focusable | full | a11ycore-aria-hidden-focus |
| link-name-present | full | a11ycore-link-name-present |
| button-name-present | full | a11ycore-button-name-present |
| checkbox-name-present | full | a11ycore-binary-control-name-present |
| radio-name-present | full | a11ycore-binary-control-name-present |
| switch-name-present | full | a11ycore-binary-control-name-present |
| combobox-name-present | full | a11ycore-combobox-name-present |
| dialog-name-present | full | a11ycore-dialog-name-present |
| menuitem-name-present | full | a11ycore-menuitem-name-present |
| tab-name-present | full | a11ycore-tab-name-present |
| slider-name-present | full | a11ycore-slider-name-present |
| textbox-name-present | full | a11ycore-textbox-name-present |
| searchbox-name-present | full | a11ycore-searchbox-name-present |
| spinbutton-name-present | full | a11ycore-spinbutton-name-present |
| listbox-name-present | full | a11ycore-listbox-name-present |
| option-name-present | full | a11ycore-option-name-present |
| treeitem-name-present | full | a11ycore-treeitem-name-present |
| aria-role-name-present | full | a11ycore-aria-role-name-present |
| aria-role-valid | full | a11ycore-aria-roles-valid |
| aria-role-not-deprecated | full | a11ycore-aria-deprecated-role |
| aria-attr-name-valid | full | a11ycore-aria-valid-attr |
| aria-attr-value-valid | full | a11ycore-aria-valid-attr-value |
| aria-attr-allowed-for-role | full | a11ycore-aria-allowed-attr |
| aria-attr-not-prohibited | full | a11ycore-aria-prohibited-attr |
| aria-attr-required-for-role | full | a11ycore-aria-required-attr |
| aria-role-allowed-for-element | full | a11ycore-aria-allowed-role |
| aria-role-required-owned-children | full | a11ycore-aria-required-children |
| aria-role-owned-children-allowed | full | a11ycore-aria-prohibited-children |
| aria-role-required-context-parent | full | a11ycore-aria-required-parent |
| iframe-name-present | full | a11ycore-iframe-name-present |
| iframe-title-unique | full | a11ycore-iframe-title-unique |
| aria-hidden-body-absent | full | a11ycore-aria-hidden-body |
| duplicate-id-aria | full | a11ycore-duplicate-id-aria |
| summary-name-present | full | a11ycore-summary-name-present |
| tooltip-name-present | full | a11ycore-tooltip-name-present |
| nested-interactive-controls-absent | full | a11ycore-nested-interactive-controls-absent |
| aria-braille-equivalent | full | a11ycore-aria-braille-equivalent |
| aria-conditional-attr | full | a11ycore-aria-conditional-attr |
| aria-checked-state-mismatch | manual | a11ycore-aria-checked-state-mismatch |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-aria-allowed-attr | automatic | aria-* attributes must be permitted for the element’s role | src/checks/automatic/aria-allowed-attr.js | aria-attr-allowed-for-role |  |
| a11ycore-aria-allowed-role | automatic | Explicit role must be permitted for its host element | src/checks/automatic/aria-allowed-role.js | aria-role-allowed-for-element |  |
| a11ycore-aria-braille-equivalent | automatic | aria-braillelabel/aria-brailleroledescription must have a non-braille equivalent | src/checks/automatic/aria-braille-equivalent.js | aria-braille-equivalent |  |
| a11ycore-aria-conditional-attr | automatic | aria-errormessage requires aria-invalid to be set to a non-false value | src/checks/automatic/aria-conditional-attr.js | aria-conditional-attr |  |
| a11ycore-aria-deprecated-role | automatic | role attribute must not use a deprecated or author-prohibited ARIA role | src/checks/automatic/aria-deprecated-role.js | aria-role-not-deprecated |  |
| a11ycore-aria-hidden-body | automatic | The document &lt;body&gt; must not be aria-hidden | src/checks/automatic/aria-hidden-body.js | aria-hidden-body-absent |  |
| a11ycore-aria-hidden-focus | automatic | ARIA hidden elements must not be focusable | src/checks/automatic/aria-hidden-focus.js | aria-hidden-focusable |  |
| a11ycore-aria-prohibited-attr | automatic | ARIA naming attributes must not be used on roles that prohibit them | src/checks/automatic/aria-prohibited-attr.js | aria-attr-not-prohibited |  |
| a11ycore-aria-prohibited-children | automatic | Container roles must not own a child with a disallowed role | src/checks/automatic/aria-prohibited-children.js | aria-role-owned-children-allowed |  |
| a11ycore-aria-required-attr | automatic | Roles with a required ARIA state/property must carry it | src/checks/automatic/aria-required-attr.js | aria-attr-required-for-role |  |
| a11ycore-aria-required-children | automatic | Container roles must own at least one required child role | src/checks/automatic/aria-required-children.js | aria-role-required-owned-children |  |
| a11ycore-aria-required-parent | automatic | Roles requiring a specific context role must be in that context | src/checks/automatic/aria-required-parent.js | aria-role-required-context-parent |  |
| a11ycore-aria-role-name-present | automatic | ARIA widget/container roles have an accessible name | src/checks/automatic/aria-role-name-present.js | aria-role-name-present |  |
| a11ycore-aria-roles-valid | automatic | role attribute must be a valid, non-abstract ARIA role | src/checks/automatic/aria-roles-valid.js | aria-role-valid |  |
| a11ycore-aria-valid-attr-value | automatic | aria-* attribute values must match their declared type | src/checks/automatic/aria-valid-attr-value.js | aria-attr-value-valid |  |
| a11ycore-aria-valid-attr | automatic | aria-* attributes must be real, defined ARIA attributes | src/checks/automatic/aria-valid-attr.js | aria-attr-name-valid |  |
| a11ycore-binary-control-name-present | automatic | Binary controls have an accessible name | src/checks/automatic/binary-control-name-present.js | checkbox-name-present, radio-name-present, switch-name-present |  |
| a11ycore-button-name-present | automatic | Buttons have an accessible name | src/checks/automatic/button-name-present.js | button-name-present |  |
| a11ycore-combobox-name-present | automatic | Comboboxes have an accessible name | src/checks/automatic/combobox-name-present.js | combobox-name-present |  |
| a11ycore-dialog-name-present | automatic | Dialogs have an accessible name | src/checks/automatic/dialog-name-present.js | dialog-name-present |  |
| a11ycore-duplicate-id-aria | automatic | IDs referenced by ARIA must be unique | src/checks/automatic/duplicate-id-aria.js | duplicate-id-aria |  |
| a11ycore-form-control-programmatic-label-present | automatic | Form controls must have a programmatic label | src/checks/automatic/form-control-programmatic-label-present.js | form-control-name-present |  |
| a11ycore-iframe-name-present | automatic | Frames have an accessible name | src/checks/automatic/iframe-name-present.js | iframe-name-present |  |
| a11ycore-iframe-title-unique | automatic | Frame titles must be unique | src/checks/automatic/iframe-title-unique.js | iframe-title-unique |  |
| a11ycore-link-name-present | automatic | Links have an accessible name | src/checks/automatic/link-name-present.js | link-name-present |  |
| a11ycore-listbox-name-present | automatic | Accessible name is present | src/checks/automatic/listbox-name-present.js | listbox-name-present |  |
| a11ycore-menuitem-name-present | automatic | Menu items have an accessible name | src/checks/automatic/menuitem-name-present.js | menuitem-name-present |  |
| a11ycore-nested-interactive-controls-absent | automatic | Interactive controls must not be nested | src/checks/automatic/nested-interactive-controls-absent.js | nested-interactive-controls-absent |  |
| a11ycore-option-name-present | automatic | Accessible name is present | src/checks/automatic/option-name-present.js | option-name-present |  |
| a11ycore-searchbox-name-present | automatic | Accessible name is present | src/checks/automatic/searchbox-name-present.js | searchbox-name-present |  |
| a11ycore-slider-name-present | automatic | Sliders have an accessible name | src/checks/automatic/slider-name-present.js | slider-name-present |  |
| a11ycore-spinbutton-name-present | automatic | Accessible name is present | src/checks/automatic/spinbutton-name-present.js | spinbutton-name-present |  |
| a11ycore-summary-name-present | automatic | Summary elements have an accessible name | src/checks/automatic/summary-name-present.js | summary-name-present |  |
| a11ycore-tab-name-present | automatic | Tabs have an accessible name | src/checks/automatic/tab-name-present.js | tab-name-present |  |
| a11ycore-textbox-name-present | automatic | Accessible name is present | src/checks/automatic/textbox-name-present.js | textbox-name-present |  |
| a11ycore-tooltip-name-present | automatic | Tooltips have an accessible name | src/checks/automatic/tooltip-name-present.js | tooltip-name-present |  |
| a11ycore-treeitem-name-present | automatic | Accessible name is present | src/checks/automatic/treeitem-name-present.js | treeitem-name-present |  |
| a11ycore-aria-checked-state-mismatch | manual | Native checkbox/radio aria-checked should match its actual state | src/checks/manual/aria-checked-state-mismatch-manual.js | aria-checked-state-mismatch |  |
| a11ycore-form-control-programmatic-label-quality | manual | Form controls should not rely on placeholder or title as the primary label | src/checks/manual/form-control-programmatic-label-quality-manual.js | form-control-name-quality |  |

### (unmapped)

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-accesskeys | manual | accesskey values must be unique | src/checks/manual/accesskeys-manual.js |  |  |
| a11ycore-aria-text | manual | role="text" elements should have no focusable descendants | src/checks/manual/aria-text-manual.js |  |  |
| a11ycore-empty-heading | manual | Headings must not be empty | src/checks/manual/empty-heading-manual.js |  |  |
| a11ycore-empty-table-header | manual | Table header cells must not be empty | src/checks/manual/empty-table-header-manual.js |  |  |
| a11ycore-focus-order-semantics | manual | Elements added to the tab order should have interactive semantics | src/checks/manual/focus-order-semantics-manual.js |  |  |
| a11ycore-heading-order | manual | Heading levels must not skip a level | src/checks/manual/heading-order-manual.js |  |  |
| a11ycore-image-redundant-alt | manual | Image alt text must not duplicate adjacent visible text | src/checks/manual/image-redundant-alt-manual.js |  |  |
| a11ycore-label-title-only | manual | Form controls should not use title as their only label | src/checks/manual/label-title-only-manual.js |  |  |
| a11ycore-landmark-banner-is-top-level | manual | Banner landmark must be top-level | src/checks/manual/landmark-banner-is-top-level-manual.js |  |  |
| a11ycore-landmark-contentinfo-is-top-level | manual | Contentinfo landmark must be top-level | src/checks/manual/landmark-contentinfo-is-top-level-manual.js |  |  |
| a11ycore-landmark-main-is-top-level | manual | Main landmark must be top-level | src/checks/manual/landmark-main-is-top-level-manual.js |  |  |
| a11ycore-landmark-no-duplicate-banner | manual | Page must not have more than one banner landmark | src/checks/manual/landmark-no-duplicate-banner-manual.js |  |  |
| a11ycore-landmark-no-duplicate-contentinfo | manual | Page must not have more than one contentinfo landmark | src/checks/manual/landmark-no-duplicate-contentinfo-manual.js |  |  |
| a11ycore-landmark-no-duplicate-main | manual | Page must not have more than one main landmark | src/checks/manual/landmark-no-duplicate-main-manual.js |  |  |
| a11ycore-landmark-one-main | manual | Page should have a main landmark | src/checks/manual/landmark-one-main-manual.js |  |  |
| a11ycore-landmark-unique | manual | Landmarks with the same role must have unique names | src/checks/manual/landmark-unique-manual.js |  |  |
| a11ycore-meta-viewport-large | manual | Viewport meta tag should allow zooming up to 500% | src/checks/manual/meta-viewport-large-manual.js |  |  |
| a11ycore-page-has-heading-one | manual | Page should have a level-one heading | src/checks/manual/page-has-heading-one-manual.js |  |  |
| a11ycore-presentation-role-conflict | manual | Presentational role must not conflict with a global ARIA attribute or focusability | src/checks/manual/presentation-role-conflict-manual.js |  |  |
| a11ycore-region | manual | Page content should be inside a landmark region | src/checks/manual/region-manual.js |  |  |
| a11ycore-scope-attr-valid | manual | scope attribute must have a valid value | src/checks/manual/scope-attr-valid-manual.js |  |  |
| a11ycore-skip-link | manual | Skip link must have a resolvable target | src/checks/manual/skip-link-manual.js |  |  |
| a11ycore-tabindex | manual | tabindex should not be greater than 0 | src/checks/manual/tabindex-manual.js |  |  |
| a11ycore-table-duplicate-name | manual | Table caption must not duplicate its summary attribute | src/checks/manual/table-duplicate-name-manual.js |  |  |

