# Fixture Index

Every implemented rule should have a `tests/fixtures/<slug>-all-scenarios.html` scenario page (numbered `case_NN` blocks, each marked PASS/FAIL/CANTTELL in its `.case-title`) and a "fixture coverage" test in its `tests/engine-checks/**/<rule>.test.js` asserting the exact expected ids. See `docs/RULE_AUTHORING.md`.

## Summary

Total rules: **133**. With fixture: **132**. Without fixture: **1**.

## Rules WITHOUT a fixture (1)

| Rule ID | Type | Title | Rule file | Test file |
|---|---|---|---|---|
| identical-iframes-same-purpose | automatic | Frames with the same name embed the same resource | src/checks/automatic/identical-iframes-same-purpose.js | tests/engine-checks/automatic/identical-iframes-same-purpose.test.js |

## Rules WITH a fixture (132)

| Rule ID | Type | Fixture | Cases | PASS | FAIL | CANTTELL | OTHER |
|---|---|---|---:|---:|---:|---:|---:|
| accesskeys | manual | `tests/fixtures/accesskeys-all-scenarios.html` | 3 | 0 | 0 | 1 | 2 |
| area-alt-decorative | manual | `tests/fixtures/area-alt-decorative-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| area-alt-present | automatic | `tests/fixtures/area-alt-present-all-scenarios.html` | 23 | 5 | 8 | 0 | 10 |
| area-alt-quality | manual | `tests/fixtures/area-alt-quality-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| aria-allowed-attr | automatic | `tests/fixtures/aria-allowed-attr-all-scenarios.html` | 18 | 8 | 6 | 1 | 3 |
| aria-allowed-role | automatic | `tests/fixtures/aria-allowed-role-all-scenarios.html` | 50 | 30 | 0 | 19 | 1 |
| aria-braille-equivalent | automatic | `tests/fixtures/aria-braille-equivalent-all-scenarios.html` | 6 | 3 | 0 | 2 | 1 |
| aria-checked-state-mismatch | manual | `tests/fixtures/aria-checked-state-mismatch-all-scenarios.html` | 10 | 3 | 0 | 5 | 2 |
| aria-conditional-attr | automatic | `tests/fixtures/aria-conditional-attr-all-scenarios.html` | 6 | 3 | 0 | 2 | 1 |
| aria-deprecated-role | automatic | `tests/fixtures/aria-deprecated-role-all-scenarios.html` | 4 | 1 | 0 | 2 | 1 |
| aria-hidden-body | automatic | `tests/fixtures/aria-hidden-body-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| aria-hidden-focus | automatic | `tests/fixtures/aria-hidden-focus-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| aria-prohibited-attr | automatic | `tests/fixtures/aria-prohibited-attr-all-scenarios.html` | 15 | 2 | 9 | 0 | 4 |
| aria-prohibited-children | automatic | `tests/fixtures/aria-prohibited-children-all-scenarios.html` | 20 | 10 | 8 | 0 | 2 |
| aria-required-attr | automatic | `tests/fixtures/aria-required-attr-all-scenarios.html` | 17 | 4 | 4 | 2 | 7 |
| aria-required-children | automatic | `tests/fixtures/aria-required-children-all-scenarios.html` | 9 | 3 | 0 | 2 | 4 |
| aria-required-parent | automatic | `tests/fixtures/aria-required-parent-all-scenarios.html` | 12 | 6 | 2 | 0 | 4 |
| aria-role-name-present | automatic | `tests/fixtures/aria-role-name-present-all-scenarios.html` | 27 | 6 | 8 | 0 | 13 |
| aria-roles-valid | automatic | `tests/fixtures/aria-roles-valid-all-scenarios.html` | 8 | 4 | 2 | 1 | 1 |
| aria-text | manual | `tests/fixtures/aria-text-all-scenarios.html` | 4 | 0 | 0 | 2 | 2 |
| aria-valid-attr | automatic | `tests/fixtures/aria-valid-attr-all-scenarios.html` | 5 | 1 | 0 | 2 | 2 |
| aria-valid-attr-value | automatic | `tests/fixtures/aria-valid-attr-value-all-scenarios.html` | 17 | 9 | 6 | 1 | 1 |
| autocomplete-valid | automatic | `tests/fixtures/autocomplete-valid-all-scenarios.html` | 7 | 4 | 2 | 0 | 1 |
| avoid-inline-spacing | automatic | `tests/fixtures/avoid-inline-spacing-all-scenarios.html` | 12 | 3 | 3 | 3 | 3 |
| binary-control-name-present | automatic | `tests/fixtures/binary-control-name-present-all-scenarios.html` | 25 | 11 | 4 | 0 | 10 |
| button-name-present | automatic | `tests/fixtures/button-name-present-all-scenarios.html` | 27 | 10 | 11 | 0 | 6 |
| bypass-blocks-present | manual | `tests/fixtures/bypass-blocks-present-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| canvas-text-alternative-present | automatic | `tests/fixtures/canvas-text-alternative-present-all-scenarios.html` | 25 | 9 | 7 | 0 | 9 |
| canvas-text-alternative-quality | manual | `tests/fixtures/canvas-text-alternative-quality-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| combobox-name-present | automatic | `tests/fixtures/combobox-name-present-all-scenarios.html` | 24 | 7 | 5 | 0 | 12 |
| contrast-computable | automatic | `tests/fixtures/contrast-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| contrast-enhanced | automatic | `tests/fixtures/contrast-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| contrast-minimum | automatic | `tests/fixtures/contrast-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| css-focus-indicator-suppressed | manual | `tests/fixtures/css-focus-indicator-suppressed-all-scenarios.html` | 12 | 4 | 0 | 5 | 3 |
| css-hidden-focus | manual | `tests/fixtures/css-hidden-focus-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| css-orientation-lock | automatic | `tests/fixtures/css-orientation-lock-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| definition-list-children-valid | automatic | `tests/fixtures/definition-list-children-valid-all-scenarios.html` | 10 | 5 | 4 | 0 | 1 |
| deprecated-elements-not-used | automatic | `tests/fixtures/deprecated-elements-not-used-all-scenarios.html` | 3 | 0 | 2 | 0 | 1 |
| dialog-name-present | automatic | `tests/fixtures/dialog-name-present-all-scenarios.html` | 21 | 4 | 6 | 0 | 11 |
| dlitem-parent-valid | automatic | `tests/fixtures/dlitem-parent-valid-all-scenarios.html` | 5 | 2 | 3 | 0 | 0 |
| duplicate-id | automatic | `tests/fixtures/duplicate-id-all-scenarios.html` | 6 | 1 | 0 | 3 | 2 |
| duplicate-id-aria | automatic | `tests/fixtures/duplicate-id-aria-all-scenarios.html` | 5 | 1 | 3 | 0 | 1 |
| embed-text-alternative-present | automatic | `tests/fixtures/embed-text-alternative-present-all-scenarios.html` | 15 | 3 | 6 | 0 | 6 |
| embed-text-alternative-quality | manual | `tests/fixtures/embed-text-alternative-quality-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| empty-heading | manual | `tests/fixtures/empty-heading-all-scenarios.html` | 10 | 0 | 0 | 3 | 7 |
| empty-table-header | manual | `tests/fixtures/empty-table-header-all-scenarios.html` | 6 | 0 | 0 | 4 | 2 |
| focus-order-semantics | manual | `tests/fixtures/focus-order-semantics-all-scenarios.html` | 6 | 0 | 0 | 2 | 4 |
| form-control-label-quality | manual | `tests/fixtures/form-control-label-quality-all-scenarios.html` | 11 | 5 | 0 | 5 | 1 |
| form-control-programmatic-label-present | automatic | `tests/fixtures/form-control-programmatic-label-all-scenarios.html` | 41 | 13 | 10 | 0 | 18 |
| form-control-programmatic-label-quality | manual | `tests/fixtures/form-control-programmatic-label-quality-manual-all-scenarios.html` | 14 | 0 | 0 | 0 | 14 |
| form-control-single-label | automatic | `tests/fixtures/form-control-single-label-all-scenarios.html` | 9 | 5 | 2 | 1 | 1 |
| heading-order | manual | `tests/fixtures/heading-order-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| heading-quality | manual | `tests/fixtures/heading-quality-all-scenarios.html` | 12 | 4 | 0 | 6 | 2 |
| html-lang-attr-present | automatic | `tests/fixtures/language-page-present-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| html-xml-lang-mismatch | automatic | `tests/fixtures/html-xml-lang-mismatch-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| identical-links-same-purpose | manual | `tests/fixtures/identical-links-same-purpose-all-scenarios.html` | 1 | 0 | 0 | 0 | 1 |
| iframe-focusable-content | automatic | `tests/fixtures/iframe-focusable-content-all-scenarios.html` | 2 | 1 | 0 | 0 | 1 |
| iframe-name-present | automatic | `tests/fixtures/iframe-name-present-all-scenarios.html` | 9 | 3 | 3 | 0 | 3 |
| iframe-title-unique | automatic | `tests/fixtures/iframe-title-unique-all-scenarios.html` | 4 | 1 | 2 | 0 | 1 |
| image-redundant-alt | manual | `tests/fixtures/image-redundant-alt-all-scenarios.html` | 3 | 0 | 0 | 1 | 2 |
| img-alt-decorative | manual | `tests/fixtures/img-alt-decorative-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| img-alt-present | automatic | `tests/fixtures/img-alt-present-all-scenarios.html` | 33 | 6 | 11 | 0 | 16 |
| img-alt-quality | manual | `tests/fixtures/img-alt-quality-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| input-image-alt-decorative | manual | `tests/fixtures/input-image-alt-decorative-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| input-image-alt-present | automatic | `tests/fixtures/input-image-alt-present-all-scenarios.html` | 19 | 3 | 9 | 0 | 7 |
| input-image-alt-quality | manual | `tests/fixtures/input-image-alt-quality-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| label-in-name | automatic | `tests/fixtures/label-in-name-all-scenarios.html` | 17 | 7 | 5 | 0 | 5 |
| label-title-only | manual | `tests/fixtures/label-title-only-all-scenarios.html` | 4 | 0 | 0 | 2 | 2 |
| landmark-banner-is-top-level | manual | `tests/fixtures/landmark-banner-is-top-level-all-scenarios.html` | 4 | 0 | 0 | 2 | 2 |
| landmark-complementary-is-top-level | manual | `tests/fixtures/landmark-complementary-is-top-level-all-scenarios.html` | 7 | 0 | 0 | 2 | 5 |
| landmark-contentinfo-is-top-level | manual | `tests/fixtures/landmark-contentinfo-is-top-level-all-scenarios.html` | 4 | 0 | 0 | 1 | 3 |
| landmark-main-is-top-level | manual | `tests/fixtures/landmark-main-is-top-level-all-scenarios.html` | 2 | 0 | 0 | 1 | 1 |
| landmark-no-duplicate-banner | manual | `tests/fixtures/landmark-no-duplicate-banner-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| landmark-no-duplicate-contentinfo | manual | `tests/fixtures/landmark-no-duplicate-contentinfo-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| landmark-no-duplicate-main | manual | `tests/fixtures/landmark-no-duplicate-main-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| landmark-one-main | manual | `tests/fixtures/landmark-one-main-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| landmark-unique | manual | `tests/fixtures/landmark-unique-all-scenarios.html` | 12 | 0 | 0 | 6 | 6 |
| link-in-text-block | automatic | `tests/fixtures/link-in-text-block-all-scenarios.html` | 7 | 4 | 1 | 1 | 1 |
| link-name-present | automatic | `tests/fixtures/link-name-present-all-scenarios.html` | 19 | 12 | 5 | 0 | 2 |
| link-name-quality | manual | `tests/fixtures/link-name-quality-all-scenarios.html` | 7 | 0 | 0 | 4 | 3 |
| list-children-valid | automatic | `tests/fixtures/list-children-valid-all-scenarios.html` | 14 | 8 | 5 | 0 | 1 |
| listbox-name-present | automatic | `tests/fixtures/listbox-name-present-all-scenarios.html` | 23 | 7 | 5 | 0 | 11 |
| listitem-parent-valid | automatic | `tests/fixtures/listitem-parent-valid-all-scenarios.html` | 13 | 5 | 5 | 0 | 3 |
| manual-review | manual | `tests/fixtures/manual-review-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| media-alternative-transcript-evidence | manual | `tests/fixtures/media-transcript-present-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| menuitem-name-present | automatic | `tests/fixtures/menuitem-name-present-all-scenarios.html` | 20 | 6 | 6 | 0 | 8 |
| meta-refresh-no-exceptions | automatic | `tests/fixtures/meta-refresh-no-exceptions-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| meta-refresh-timing-absent | automatic | `tests/fixtures/meta-refresh-timing-absent-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| meta-viewport-large | manual | `tests/fixtures/meta-viewport-large-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| meta-viewport-zoom-enabled | automatic | `tests/fixtures/meta-viewport-zoom-enabled-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| meter-name-present | automatic | `tests/fixtures/meter-name-present-all-scenarios.html` | 7 | 3 | 3 | 0 | 1 |
| mouse-only-event-handlers | manual | `tests/fixtures/mouse-only-event-handlers-all-scenarios.html` | 6 | 0 | 0 | 2 | 4 |
| nested-interactive-controls-absent | automatic | `tests/fixtures/nested-interactive-controls-absent-all-scenarios.html` | 5 | 2 | 3 | 0 | 0 |
| no-autoplay-audio | manual | `tests/fixtures/no-autoplay-audio-all-scenarios.html` | 5 | 0 | 0 | 2 | 3 |
| object-text-alternative-present | automatic | `tests/fixtures/object-text-alternative-present-all-scenarios.html` | 18 | 5 | 6 | 0 | 7 |
| object-text-alternative-quality | manual | `tests/fixtures/object-text-alternative-quality-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| option-name-present | automatic | `tests/fixtures/option-name-present-all-scenarios.html` | 17 | 4 | 5 | 0 | 8 |
| p-as-heading | manual | `tests/fixtures/p-as-heading-all-scenarios.html` | 4 | 0 | 0 | 1 | 3 |
| page-has-heading-one | manual | `tests/fixtures/page-has-heading-one-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| page-title-patterns | manual | `tests/fixtures/page-title-patterns-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| page-title-present | automatic | `tests/fixtures/page-title-present-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| password-paste-enabled | manual | `tests/fixtures/password-paste-enabled-all-scenarios.html` | 14 | 0 | 0 | 8 | 6 |
| presentation-role-conflict | manual | `tests/fixtures/presentation-role-conflict-all-scenarios.html` | 15 | 0 | 0 | 8 | 7 |
| presentational-children-focusable-absent | automatic | `tests/fixtures/presentational-children-focusable-absent-all-scenarios.html` | 14 | 6 | 6 | 0 | 2 |
| progressbar-name-present | automatic | `tests/fixtures/progressbar-name-present-all-scenarios.html` | 8 | 3 | 4 | 0 | 1 |
| region | manual | `tests/fixtures/region-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| role-img-text-alternative-present | automatic | `tests/fixtures/role-img-text-alternative-present-all-scenarios.html` | 25 | 5 | 10 | 0 | 10 |
| scope-attr-valid | manual | `tests/fixtures/scope-attr-valid-all-scenarios.html` | 2 | 0 | 0 | 1 | 1 |
| scrollable-region-focusable | manual | `tests/fixtures/scrollable-region-focusable-all-scenarios.html` | 5 | 0 | 0 | 2 | 3 |
| searchbox-name-present | automatic | `tests/fixtures/searchbox-name-present-all-scenarios.html` | 23 | 7 | 5 | 0 | 11 |
| server-side-image-map-absent | automatic | `tests/fixtures/server-side-image-map-absent-all-scenarios.html` | 3 | 0 | 1 | 0 | 2 |
| skip-link | manual | `tests/fixtures/skip-link-all-scenarios.html` | 6 | 0 | 0 | 3 | 3 |
| slider-name-present | automatic | `tests/fixtures/slider-name-present-all-scenarios.html` | 23 | 9 | 4 | 0 | 10 |
| spinbutton-name-present | automatic | `tests/fixtures/spinbutton-name-present-all-scenarios.html` | 23 | 7 | 5 | 0 | 11 |
| summary-name-present | automatic | `tests/fixtures/summary-name-present-all-scenarios.html` | 6 | 4 | 2 | 0 | 0 |
| svg-image-text-alternative-present | automatic | `tests/fixtures/svg-image-text-alternative-present-all-scenarios.html` | 20 | 6 | 8 | 0 | 6 |
| svg-text-alternative-present | automatic | `tests/fixtures/svg-text-alternative-present-all-scenarios.html` | 26 | 5 | 14 | 0 | 7 |
| svg-text-alternative-quality | manual | `tests/fixtures/svg-text-alternative-quality-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| tab-name-present | automatic | `tests/fixtures/tab-name-present-all-scenarios.html` | 17 | 4 | 5 | 0 | 8 |
| tabindex | manual | `tests/fixtures/tabindex-all-scenarios.html` | 3 | 0 | 0 | 1 | 2 |
| table-duplicate-name | manual | `tests/fixtures/table-duplicate-name-all-scenarios.html` | 2 | 0 | 0 | 1 | 1 |
| table-fake-caption | manual | `tests/fixtures/table-fake-caption-all-scenarios.html` | 4 | 0 | 0 | 1 | 3 |
| table-headers-attr-valid | automatic | `tests/fixtures/table-headers-attr-valid-all-scenarios.html` | 9 | 2 | 4 | 0 | 3 |
| table-th-has-data-cells | automatic | `tests/fixtures/table-th-has-data-cells-all-scenarios.html` | 4 | 1 | 2 | 0 | 1 |
| target-size-minimum | automatic | `tests/fixtures/target-size-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| td-has-header | automatic | `tests/fixtures/td-has-header-all-scenarios.html` | 5 | 0 | 1 | 0 | 4 |
| textbox-name-present | automatic | `tests/fixtures/textbox-name-present-all-scenarios.html` | 23 | 7 | 5 | 0 | 11 |
| tooltip-name-present | automatic | `tests/fixtures/tooltip-name-present-all-scenarios.html` | 7 | 4 | 2 | 0 | 1 |
| treeitem-name-present | automatic | `tests/fixtures/treeitem-name-present-all-scenarios.html` | 17 | 4 | 5 | 0 | 8 |
| valid-lang | automatic | `tests/fixtures/valid-lang-all-scenarios.html` | 3 | 1 | 1 | 0 | 1 |
| video-caption | manual | `tests/fixtures/video-caption-all-scenarios.html` | 5 | 0 | 0 | 3 | 2 |
| video-poster-text-alternative-present | automatic | `tests/fixtures/video-poster-text-alternative-present-all-scenarios.html` | 12 | 3 | 5 | 0 | 4 |

