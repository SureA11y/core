# WCAG Coverage Report

Generated: 2026-01-11T06:50:27.754Z

Rules directory: `src/rules`
Facets: `src/coverage/wcag-facets.js`

## Summary

Total rules (loaded without error): **12**

### Coverage by WCAG Level (Version-agnostic, cumulative)

| Scope | A | AA | AAA |
|---|---:|---:|---:|
| Any WCAG version | 10 | 0 | 0 |

### Coverage by WCAG Level (Per version, cumulative)

| Scope | A | AA | AAA |
|---|---:|---:|---:|
| WCAG 2.0 | 10 | 0 | 0 |
| WCAG 2.1 | 0 | 0 | 0 |
| WCAG 2.2 | 0 | 0 | 0 |

### Raw WCAG tag counts (non-cumulative)

| Tag | Rules |
|---|---:|
| wcag2a | 10 |

## 1.1.1

Facet coverage: **5/5** facets covered.
Automation mix: **full 1, partial 3, manual 1**.

| Facet | Automation | Covered by |
|---|---|---|
| text-alternative-mechanism | full | area-alt-present, canvas-text-alternative, img-alt-attr-present |
| functional-nontext-name | partial | img-alt-functional-name, input-image-accessible-name |
| decorative-null | partial | img-alt-empty |
| technology-specific-nontext | partial | svg-role-img-name |
| equivalent-purpose | manual | nontext-equivalent-alternative-manual |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| area-alt-present | automatic | Image map areas must have alt text | src/rules/area-alt-present.js | text-alternative-mechanism |  |
| canvas-text-alternative | automatic | Canvas must have a text alternative | src/rules/canvas-text-alternative.js | text-alternative-mechanism |  |
| img-alt-attr-present | automatic | Images must have an alt attribute | src/rules/img-alt-attr-present.js | text-alternative-mechanism |  |
| img-alt-empty | manual | Empty alt text requires verification | src/rules/img-alt-empty.js | decorative-null |  |
| img-alt-functional-name | automatic | Image-only controls must have an accessible name | src/rules/img-alt-functional-name.js | functional-nontext-name |  |
| input-image-accessible-name | automatic | Image inputs must have an accessible name | src/rules/input-image-accessible-name.js | functional-nontext-name |  |
| nontext-equivalent-alternative-manual | manual | Non-text alternatives must be equivalent (manual) | src/rules/nontext-equivalent-alternative-manual.js | equivalent-purpose |  |
| svg-role-img-name | automatic | SVG images must have an accessible name | src/rules/svg-role-img-name.js | technology-specific-nontext |  |

## 1.3.1

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 1, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| programmatic-relationships | partial | form-control-accessible-name, form-control-explicit-label |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| form-control-accessible-name | automatic | Form controls must have an accessible name | src/rules/form-control-accessible-name.js | programmatic-relationships |  |
| form-control-explicit-label | automatic | Form controls should have an explicit <label> element | src/rules/form-control-explicit-label.js | programmatic-relationships |  |

## 4.1.2

Facet coverage: **1/1** facets covered.
Automation mix: **full 0, partial 1, manual 0**.

| Facet | Automation | Covered by |
|---|---|---|
| accessible-name | partial | form-control-accessible-name |

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| form-control-accessible-name | automatic | Form controls must have an accessible name | src/rules/form-control-accessible-name.js | accessible-name |  |

## (unmapped)

| Rule ID | Type | Title | File | Facet | Notes |
|---|---|---|---|---|---|
| links-target-blank-noopener | automatic | Links that open in a new tab should use rel="noopener" | src/rules/links-target-blank-noopener.js |  |  |
| manual-review | manual | Manual review: keyboard navigation and focus order | src/rules/manual-review.js |  |  |

