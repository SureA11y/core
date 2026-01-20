# WCAG Coverage Report

Generated: 2026-01-20T10:01:59.657Z

Rules directory: `src\rules`
Facets: `src\coverage\wcag-facets.js`

## Summary

Total rules (loaded without error): **24**

### Coverage by WCAG Level (Version-agnostic, cumulative)

| Scope | A | AA | AAA |
|---|---:|---:|---:|
| Any WCAG version | 24 | 1 | 0 |

### Coverage by WCAG Level (Per version, cumulative)

| Scope | A | AA | AAA |
|---|---:|---:|---:|
| WCAG 2.0 | 24 | 1 | 0 |
| WCAG 2.1 | 0 | 0 | 0 |
| WCAG 2.2 | 0 | 0 | 0 |

### Raw WCAG tag counts (non-cumulative)

| Tag | Rules |
|---|---:|
| wcag2a | 24 |
| wcag2aa | 1 |

## SC Coverage (A) — Enforced requirements only (normativeMappings)

### 1.1.1

Facet coverage: **9/18** facets covered.
Automation mix: **full 3, partial 13, manual 2**.

| Facet | Automation | Covered by |
|---|---|---|
| text-alternative-mechanism | partial | — |
| functional-nontext-name | partial | — |
| decorative-null | manual | — |
| text-alt-quality-review | manual | — |
| text-alternative-quality | partial | — |
| img-alt-attr-present | full | a11ycore-img-alt-present |
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

Uncovered facets: text-alternative-mechanism, functional-nontext-name, decorative-null, text-alt-quality-review, text-alternative-quality, svg-text-alt-present, embed-name-present, alt-suspicious-patterns, acc-eligibility-filtering

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-area-alt-present | automatic | &amp;lt;area&amp;gt; must have an alt attribute | src\rules\automatic\area-alt-present.js | area-alt-attr-present |  |
| a11ycore-canvas-text-alternative-present | automatic | &lt;canvas&gt; must provide a text alternative | src\rules\automatic\canvas-text-alternative-present.js | canvas-text-alternative-present |  |
| a11ycore-embed-text-alternative-present | automatic | &lt;embed&gt; must provide a text alternative | src\rules\automatic\embed-text-alternative-present.js | embed-text-alternative-present |  |
| a11ycore-img-alt-present | automatic | &lt;img&gt; must have an alt attribute | src\rules\automatic\img-alt-present.js | img-alt-attr-present |  |
| a11ycore-input-image-alt-present | automatic | &lt;input type="image"&gt; must have an alt attribute | src\rules\automatic\input-image-alt-present.js | input-image-alt-attr-present |  |
| a11ycore-object-text-alternative-present | automatic | &lt;object&gt; must provide a text alternative | src\rules\automatic\object-text-alternative-present.js | object-text-alternative-present |  |
| a11ycore-svg-image-text-alternative-present | automatic | SVG &lt;image&gt; must have a text alternative | src\rules\automatic\svg-image-text-alternative-present.js | svg-image-text-alt-present |  |
| a11ycore-svg-text-alternative-present | automatic | &lt;svg&gt; must provide a text alternative | src\rules\automatic\svg-text-alternative-present.js | svg-text-alternative-present |  |
| a11ycore-video-poster-text-alternative-present | automatic | &lt;video&gt; poster must have a text alternative | src\rules\automatic\video-poster-text-alternative-present.js | video-poster-text-alt-present |  |

### 3.1.1

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| html-lang-attr-present | full | a11ycore-html-lang-attr-present |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-html-lang-attr-present | automatic | Page language is declared | src\rules\automatic\language-page-present.js | html-lang-attr-present |  |

### 4.1.2

Facet coverage: **1/2** facets covered.
Automation mix: **full 1, partial 0, manual 1**.

| Facet | Automation | Covered by |
|---|---|---|
| form-control-name-present | full | a11ycore-form-control-programmatic-label-present |
| form-control-name-quality | manual | — |

Uncovered facets: form-control-name-quality

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-form-control-programmatic-label-present | automatic | Form controls must have a programmatic label | src\rules\automatic\form-control-programmatic-label-present.js | form-control-name-present |  |

### (unmapped)

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-aria-hidden-programmatic-focus-review | manual | Review aria-hidden programmatic focus | src\rules\aria-hidden-programmatic-focus-review.js |  |  |
| a11ycore-area-alt-decorative | manual | &lt;area&gt; with alt="" must be decorative (manual review) | src\rules\manual\area-alt-decorative-manual.js |  |  |
| a11ycore-area-alt-quality | manual | &lt;area&gt; alt text must be appropriate (manual review) | src\rules\manual\area-alt-quality-manual.js |  |  |
| a11ycore-canvas-text-alternative-quality | manual | &lt;canvas&gt; text alternative must be appropriate (manual review) | src\rules\manual\canvas-text-alternative-quality-manual.js |  |  |
| a11ycore-embed-text-alternative-quality | manual | &lt;embed&gt; text alternative must be appropriate (manual review) | src\rules\manual\embed-text-alternative-quality-manual.js |  |  |
| a11ycore-form-control-programmatic-label-quality | manual | Form controls should not rely on placeholder or title as the primary label | src\rules\manual\form-control-programmatic-label-quality-manual.js |  |  |
| a11ycore-img-alt-decorative | manual | &lt;img&gt; with alt="" must be decorative (manual review) | src\rules\manual\img-alt-decorative-manual.js |  |  |
| a11ycore-img-alt-quality | manual | &lt;img&gt; alt text must be appropriate (manual review) | src\rules\manual\img-alt-quality-manual.js |  |  |
| a11ycore-input-image-alt-decorative | manual | &lt;input type="image"&gt; with alt="" must be appropriate (manual review) | src\rules\manual\input-image-alt-decorative-manual.js |  |  |
| a11ycore-input-image-alt-quality | manual | &lt;input type="image"&gt; alt text must be appropriate (manual review) | src\rules\manual\input-image-alt-quality-manual.js |  |  |
| a11ycore-object-text-alternative-quality | manual | &lt;object&gt; text alternative must be appropriate (manual review) | src\rules\manual\object-text-alternative-quality-manual.js |  |  |
| a11ycore-svg-text-alternative-quality | manual | &lt;svg&gt; text alternative must be appropriate (manual review) | src\rules\manual\svg-text-alternative-quality-manual.js |  |  |
| manual-review | manual | Manual review: keyboard navigation and focus order | src\rules\manual-review.js |  |  |

## SC Coverage (B) — Enforced + manual/informative (normativeMappings + informativeReferences)

### 1.1.1

Facet coverage: **9/18** facets covered.
Automation mix: **full 3, partial 13, manual 2**.

| Facet | Automation | Covered by |
|---|---|---|
| text-alternative-mechanism | partial | — |
| functional-nontext-name | partial | — |
| decorative-null | manual | — |
| text-alt-quality-review | manual | — |
| text-alternative-quality | partial | — |
| img-alt-attr-present | full | a11ycore-img-alt-present |
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

Uncovered facets: text-alternative-mechanism, functional-nontext-name, decorative-null, text-alt-quality-review, text-alternative-quality, svg-text-alt-present, embed-name-present, alt-suspicious-patterns, acc-eligibility-filtering

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-area-alt-present | automatic | &amp;lt;area&amp;gt; must have an alt attribute | src\rules\automatic\area-alt-present.js | area-alt-attr-present |  |
| a11ycore-canvas-text-alternative-present | automatic | &lt;canvas&gt; must provide a text alternative | src\rules\automatic\canvas-text-alternative-present.js | canvas-text-alternative-present |  |
| a11ycore-embed-text-alternative-present | automatic | &lt;embed&gt; must provide a text alternative | src\rules\automatic\embed-text-alternative-present.js | embed-text-alternative-present |  |
| a11ycore-img-alt-present | automatic | &lt;img&gt; must have an alt attribute | src\rules\automatic\img-alt-present.js | img-alt-attr-present |  |
| a11ycore-input-image-alt-present | automatic | &lt;input type="image"&gt; must have an alt attribute | src\rules\automatic\input-image-alt-present.js | input-image-alt-attr-present |  |
| a11ycore-object-text-alternative-present | automatic | &lt;object&gt; must provide a text alternative | src\rules\automatic\object-text-alternative-present.js | object-text-alternative-present |  |
| a11ycore-svg-image-text-alternative-present | automatic | SVG &lt;image&gt; must have a text alternative | src\rules\automatic\svg-image-text-alternative-present.js | svg-image-text-alt-present |  |
| a11ycore-svg-text-alternative-present | automatic | &lt;svg&gt; must provide a text alternative | src\rules\automatic\svg-text-alternative-present.js | svg-text-alternative-present |  |
| a11ycore-video-poster-text-alternative-present | automatic | &lt;video&gt; poster must have a text alternative | src\rules\automatic\video-poster-text-alternative-present.js | video-poster-text-alt-present |  |

### 3.1.1

Facet coverage: **1/1** facets covered.
Automation mix: **full 1, partial 0, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| html-lang-attr-present | full | a11ycore-html-lang-attr-present |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-html-lang-attr-present | automatic | Page language is declared | src\rules\automatic\language-page-present.js | html-lang-attr-present |  |

### 4.1.2

Facet coverage: **1/2** facets covered.
Automation mix: **full 1, partial 0, manual 1**.

| Facet | Automation | Covered by |
|---|---|---|
| form-control-name-present | full | a11ycore-form-control-programmatic-label-present |
| form-control-name-quality | manual | — |

Uncovered facets: form-control-name-quality

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-form-control-programmatic-label-present | automatic | Form controls must have a programmatic label | src\rules\automatic\form-control-programmatic-label-present.js | form-control-name-present |  |

### (unmapped)

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| a11ycore-aria-hidden-programmatic-focus-review | manual | Review aria-hidden programmatic focus | src\rules\aria-hidden-programmatic-focus-review.js |  |  |
| a11ycore-area-alt-decorative | manual | &lt;area&gt; with alt="" must be decorative (manual review) | src\rules\manual\area-alt-decorative-manual.js |  |  |
| a11ycore-area-alt-quality | manual | &lt;area&gt; alt text must be appropriate (manual review) | src\rules\manual\area-alt-quality-manual.js |  |  |
| a11ycore-canvas-text-alternative-quality | manual | &lt;canvas&gt; text alternative must be appropriate (manual review) | src\rules\manual\canvas-text-alternative-quality-manual.js |  |  |
| a11ycore-embed-text-alternative-quality | manual | &lt;embed&gt; text alternative must be appropriate (manual review) | src\rules\manual\embed-text-alternative-quality-manual.js |  |  |
| a11ycore-form-control-programmatic-label-quality | manual | Form controls should not rely on placeholder or title as the primary label | src\rules\manual\form-control-programmatic-label-quality-manual.js |  |  |
| a11ycore-img-alt-decorative | manual | &lt;img&gt; with alt="" must be decorative (manual review) | src\rules\manual\img-alt-decorative-manual.js |  |  |
| a11ycore-img-alt-quality | manual | &lt;img&gt; alt text must be appropriate (manual review) | src\rules\manual\img-alt-quality-manual.js |  |  |
| a11ycore-input-image-alt-decorative | manual | &lt;input type="image"&gt; with alt="" must be appropriate (manual review) | src\rules\manual\input-image-alt-decorative-manual.js |  |  |
| a11ycore-input-image-alt-quality | manual | &lt;input type="image"&gt; alt text must be appropriate (manual review) | src\rules\manual\input-image-alt-quality-manual.js |  |  |
| a11ycore-object-text-alternative-quality | manual | &lt;object&gt; text alternative must be appropriate (manual review) | src\rules\manual\object-text-alternative-quality-manual.js |  |  |
| a11ycore-svg-text-alternative-quality | manual | &lt;svg&gt; text alternative must be appropriate (manual review) | src\rules\manual\svg-text-alternative-quality-manual.js |  |  |
| manual-review | manual | Manual review: keyboard navigation and focus order | src\rules\manual-review.js |  |  |

