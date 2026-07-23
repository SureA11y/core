# Fixture Index

Generated: 2026-07-23T13:13:09.308Z

Every implemented rule should have a `tests/fixtures/<slug>-all-scenarios.html` scenario page (numbered `case_NN` blocks, each marked PASS/FAIL/CANTTELL in its `.case-title`) and a "fixture coverage" test in its `tests/engine-checks/**/<rule>.test.js` asserting the exact expected ids. See `docs/RULE_AUTHORING.md`.

## Summary

Total rules: **125**. With fixture: **125**. Without fixture: **0**.

## Rules WITHOUT a fixture (0)

None — every rule has a fixture.

## Rules WITH a fixture (125)

| Rule ID | Type | Fixture | Cases | PASS | FAIL | CANTTELL | OTHER |
|---|---|---|---:|---:|---:|---:|---:|
| a11ycore-accesskeys | manual | `tests/fixtures/accesskeys-all-scenarios.html` | 2 | 0 | 0 | 1 | 1 |
| a11ycore-area-alt-decorative | manual | `tests/fixtures/area-alt-decorative-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-area-alt-present | automatic | `tests/fixtures/area-alt-present-all-scenarios.html` | 23 | 5 | 8 | 0 | 10 |
| a11ycore-area-alt-quality | manual | `tests/fixtures/area-alt-quality-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-aria-allowed-attr | automatic | `tests/fixtures/aria-allowed-attr-all-scenarios.html` | 13 | 8 | 3 | 0 | 2 |
| a11ycore-aria-allowed-role | automatic | `tests/fixtures/aria-allowed-role-all-scenarios.html` | 45 | 26 | 18 | 0 | 1 |
| a11ycore-aria-braille-equivalent | automatic | `tests/fixtures/aria-braille-equivalent-all-scenarios.html` | 6 | 3 | 2 | 0 | 1 |
| a11ycore-aria-checked-state-mismatch | manual | `tests/fixtures/aria-checked-state-mismatch-all-scenarios.html` | 10 | 3 | 0 | 5 | 2 |
| a11ycore-aria-conditional-attr | automatic | `tests/fixtures/aria-conditional-attr-all-scenarios.html` | 6 | 3 | 2 | 0 | 1 |
| a11ycore-aria-deprecated-role | automatic | `tests/fixtures/aria-deprecated-role-all-scenarios.html` | 4 | 1 | 2 | 0 | 1 |
| a11ycore-aria-hidden-body | automatic | `tests/fixtures/aria-hidden-body-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| a11ycore-aria-hidden-focus | automatic | `tests/fixtures/aria-hidden-focus-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-aria-prohibited-attr | automatic | `tests/fixtures/aria-prohibited-attr-all-scenarios.html` | 9 | 2 | 6 | 0 | 1 |
| a11ycore-aria-prohibited-children | automatic | `tests/fixtures/aria-prohibited-children-all-scenarios.html` | 11 | 5 | 5 | 0 | 1 |
| a11ycore-aria-required-attr | automatic | `tests/fixtures/aria-required-attr-all-scenarios.html` | 12 | 4 | 4 | 0 | 4 |
| a11ycore-aria-required-children | automatic | `tests/fixtures/aria-required-children-all-scenarios.html` | 5 | 3 | 1 | 0 | 1 |
| a11ycore-aria-required-parent | automatic | `tests/fixtures/aria-required-parent-all-scenarios.html` | 9 | 5 | 2 | 0 | 2 |
| a11ycore-aria-role-name-present | automatic | `tests/fixtures/aria-role-name-present-all-scenarios.html` | 31 | 11 | 12 | 0 | 8 |
| a11ycore-aria-roles-valid | automatic | `tests/fixtures/aria-roles-valid-all-scenarios.html` | 6 | 3 | 2 | 0 | 1 |
| a11ycore-aria-text | manual | `tests/fixtures/aria-text-all-scenarios.html` | 4 | 0 | 0 | 2 | 2 |
| a11ycore-aria-valid-attr | automatic | `tests/fixtures/aria-valid-attr-all-scenarios.html` | 5 | 1 | 2 | 0 | 2 |
| a11ycore-aria-valid-attr-value | automatic | `tests/fixtures/aria-valid-attr-value-all-scenarios.html` | 15 | 7 | 7 | 0 | 1 |
| a11ycore-autocomplete-valid | automatic | `tests/fixtures/autocomplete-valid-all-scenarios.html` | 7 | 4 | 2 | 0 | 1 |
| a11ycore-avoid-inline-spacing | automatic | `tests/fixtures/avoid-inline-spacing-all-scenarios.html` | 3 | 1 | 2 | 0 | 0 |
| a11ycore-binary-control-name-present | automatic | `tests/fixtures/binary-control-name-present-all-scenarios.html` | 25 | 11 | 6 | 0 | 8 |
| a11ycore-button-name-present | automatic | `tests/fixtures/button-name-present-all-scenarios.html` | 21 | 8 | 10 | 0 | 3 |
| a11ycore-bypass-blocks-present | automatic | `tests/fixtures/bypass-blocks-present-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| a11ycore-canvas-text-alternative-present | automatic | `tests/fixtures/canvas-text-alternative-present-all-scenarios.html` | 25 | 9 | 9 | 0 | 7 |
| a11ycore-canvas-text-alternative-quality | manual | `tests/fixtures/canvas-text-alternative-quality-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-combobox-name-present | automatic | `tests/fixtures/combobox-name-present-all-scenarios.html` | 22 | 5 | 5 | 0 | 12 |
| a11ycore-contrast-computable | automatic | `tests/fixtures/contrast-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-contrast-enhanced | automatic | `tests/fixtures/contrast-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-contrast-minimum | automatic | `tests/fixtures/contrast-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-css-hidden-focus | manual | `tests/fixtures/css-hidden-focus-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-css-orientation-lock | automatic | `tests/fixtures/css-orientation-lock-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-definition-list-children-valid | automatic | `tests/fixtures/definition-list-children-valid-all-scenarios.html` | 10 | 5 | 4 | 0 | 1 |
| a11ycore-deprecated-elements-not-used | automatic | `tests/fixtures/deprecated-elements-not-used-all-scenarios.html` | 3 | 0 | 2 | 0 | 1 |
| a11ycore-dialog-name-present | automatic | `tests/fixtures/dialog-name-present-all-scenarios.html` | 21 | 4 | 6 | 0 | 11 |
| a11ycore-dlitem-parent-valid | automatic | `tests/fixtures/dlitem-parent-valid-all-scenarios.html` | 5 | 2 | 3 | 0 | 0 |
| a11ycore-duplicate-id-aria | automatic | `tests/fixtures/duplicate-id-aria-all-scenarios.html` | 5 | 1 | 3 | 0 | 1 |
| a11ycore-embed-text-alternative-present | automatic | `tests/fixtures/embed-text-alternative-present-all-scenarios.html` | 15 | 3 | 6 | 0 | 6 |
| a11ycore-embed-text-alternative-quality | manual | `tests/fixtures/embed-text-alternative-quality-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-empty-heading | manual | `tests/fixtures/empty-heading-all-scenarios.html` | 10 | 0 | 0 | 3 | 7 |
| a11ycore-empty-table-header | manual | `tests/fixtures/empty-table-header-all-scenarios.html` | 6 | 0 | 0 | 4 | 2 |
| a11ycore-focus-order-semantics | manual | `tests/fixtures/focus-order-semantics-all-scenarios.html` | 5 | 0 | 0 | 2 | 3 |
| a11ycore-form-control-programmatic-label-present | automatic | `tests/fixtures/form-control-programmatic-label-all-scenarios.html` | 41 | 15 | 12 | 0 | 14 |
| a11ycore-form-control-programmatic-label-quality | manual | `tests/fixtures/form-control-programmatic-label-quality-manual-all-scenarios.html` | 14 | 0 | 0 | 0 | 14 |
| a11ycore-form-control-single-label | automatic | `tests/fixtures/form-control-single-label-all-scenarios.html` | 6 | 3 | 2 | 0 | 1 |
| a11ycore-heading-order | manual | `tests/fixtures/heading-order-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| a11ycore-html-lang-attr-present | automatic | `tests/fixtures/language-page-present-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| a11ycore-html-xml-lang-mismatch | automatic | `tests/fixtures/html-xml-lang-mismatch-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| a11ycore-identical-links-same-purpose | manual | `tests/fixtures/identical-links-same-purpose-all-scenarios.html` | 1 | 0 | 0 | 0 | 1 |
| a11ycore-iframe-focusable-content | automatic | `tests/fixtures/iframe-focusable-content-all-scenarios.html` | 2 | 1 | 0 | 0 | 1 |
| a11ycore-iframe-name-present | automatic | `tests/fixtures/iframe-name-present-all-scenarios.html` | 6 | 3 | 2 | 0 | 1 |
| a11ycore-iframe-title-unique | automatic | `tests/fixtures/iframe-title-unique-all-scenarios.html` | 4 | 1 | 2 | 0 | 1 |
| a11ycore-image-redundant-alt | manual | `tests/fixtures/image-redundant-alt-all-scenarios.html` | 3 | 0 | 0 | 1 | 2 |
| a11ycore-img-alt-decorative | manual | `tests/fixtures/img-alt-decorative-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-img-alt-present | automatic | `tests/fixtures/img-alt-present-all-scenarios.html` | 33 | 6 | 11 | 0 | 16 |
| a11ycore-img-alt-quality | manual | `tests/fixtures/img-alt-quality-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-input-image-alt-decorative | manual | `tests/fixtures/input-image-alt-decorative-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-input-image-alt-present | automatic | `tests/fixtures/input-image-alt-present-all-scenarios.html` | 19 | 4 | 9 | 0 | 6 |
| a11ycore-input-image-alt-quality | manual | `tests/fixtures/input-image-alt-quality-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-label-in-name | automatic | `tests/fixtures/label-in-name-all-scenarios.html` | 17 | 7 | 5 | 0 | 5 |
| a11ycore-label-title-only | manual | `tests/fixtures/label-title-only-all-scenarios.html` | 3 | 0 | 0 | 1 | 2 |
| a11ycore-landmark-banner-is-top-level | manual | `tests/fixtures/landmark-banner-is-top-level-all-scenarios.html` | 3 | 0 | 0 | 2 | 1 |
| a11ycore-landmark-contentinfo-is-top-level | manual | `tests/fixtures/landmark-contentinfo-is-top-level-all-scenarios.html` | 3 | 0 | 0 | 1 | 2 |
| a11ycore-landmark-main-is-top-level | manual | `tests/fixtures/landmark-main-is-top-level-all-scenarios.html` | 2 | 0 | 0 | 1 | 1 |
| a11ycore-landmark-no-duplicate-banner | manual | `tests/fixtures/landmark-no-duplicate-banner-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| a11ycore-landmark-no-duplicate-contentinfo | manual | `tests/fixtures/landmark-no-duplicate-contentinfo-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| a11ycore-landmark-no-duplicate-main | manual | `tests/fixtures/landmark-no-duplicate-main-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| a11ycore-landmark-one-main | manual | `tests/fixtures/landmark-one-main-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| a11ycore-landmark-unique | manual | `tests/fixtures/landmark-unique-all-scenarios.html` | 12 | 0 | 0 | 6 | 6 |
| a11ycore-link-in-text-block | automatic | `tests/fixtures/link-in-text-block-all-scenarios.html` | 7 | 4 | 1 | 0 | 2 |
| a11ycore-link-name-present | automatic | `tests/fixtures/link-name-present-all-scenarios.html` | 17 | 10 | 5 | 0 | 2 |
| a11ycore-link-name-quality | manual | `tests/fixtures/link-name-quality-all-scenarios.html` | 7 | 0 | 0 | 4 | 3 |
| a11ycore-list-children-valid | automatic | `tests/fixtures/list-children-valid-all-scenarios.html` | 14 | 8 | 5 | 0 | 1 |
| a11ycore-listbox-name-present | automatic | `tests/fixtures/listbox-name-present-all-scenarios.html` | 21 | 5 | 5 | 0 | 11 |
| a11ycore-listitem-parent-valid | automatic | `tests/fixtures/listitem-parent-valid-all-scenarios.html` | 9 | 5 | 4 | 0 | 0 |
| a11ycore-manual-review | manual | `tests/fixtures/manual-review-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| a11ycore-media-alternative-transcript-evidence | manual | `tests/fixtures/a11ycore-media-transcript-present-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-menuitem-name-present | automatic | `tests/fixtures/menuitem-name-present-all-scenarios.html` | 20 | 6 | 6 | 0 | 8 |
| a11ycore-meta-refresh-no-exceptions | automatic | `tests/fixtures/meta-refresh-no-exceptions-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| a11ycore-meta-refresh-timing-absent | automatic | `tests/fixtures/meta-refresh-timing-absent-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| a11ycore-meta-viewport-large | manual | `tests/fixtures/meta-viewport-large-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| a11ycore-meta-viewport-zoom-enabled | automatic | `tests/fixtures/meta-viewport-zoom-enabled-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| a11ycore-meter-name-present | automatic | `tests/fixtures/meter-name-present-all-scenarios.html` | 7 | 3 | 3 | 0 | 1 |
| a11ycore-mouse-only-event-handlers | manual | `tests/fixtures/mouse-only-event-handlers-all-scenarios.html` | 6 | 0 | 0 | 2 | 4 |
| a11ycore-nested-interactive-controls-absent | automatic | `tests/fixtures/nested-interactive-controls-absent-all-scenarios.html` | 5 | 2 | 3 | 0 | 0 |
| a11ycore-no-autoplay-audio | manual | `tests/fixtures/no-autoplay-audio-all-scenarios.html` | 5 | 0 | 0 | 2 | 3 |
| a11ycore-object-text-alternative-present | automatic | `tests/fixtures/object-text-alternative-present-all-scenarios.html` | 18 | 5 | 7 | 0 | 6 |
| a11ycore-object-text-alternative-quality | manual | `tests/fixtures/object-text-alternative-quality-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-option-name-present | automatic | `tests/fixtures/option-name-present-all-scenarios.html` | 17 | 4 | 5 | 0 | 8 |
| a11ycore-p-as-heading | manual | `tests/fixtures/p-as-heading-all-scenarios.html` | 4 | 0 | 0 | 1 | 3 |
| a11ycore-page-has-heading-one | manual | `tests/fixtures/page-has-heading-one-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| a11ycore-page-title-patterns | manual | `tests/fixtures/page-title-patterns-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| a11ycore-page-title-present | automatic | `tests/fixtures/page-title-present-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| a11ycore-presentation-role-conflict | manual | `tests/fixtures/presentation-role-conflict-all-scenarios.html` | 10 | 0 | 0 | 6 | 4 |
| a11ycore-progressbar-name-present | automatic | `tests/fixtures/progressbar-name-present-all-scenarios.html` | 8 | 3 | 4 | 0 | 1 |
| a11ycore-region | manual | `tests/fixtures/region-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| a11ycore-role-img-text-alternative-present | automatic | `tests/fixtures/role-img-alt-present-all-scenarios.html` | 25 | 5 | 12 | 0 | 8 |
| a11ycore-scope-attr-valid | manual | `tests/fixtures/scope-attr-valid-all-scenarios.html` | 2 | 0 | 0 | 1 | 1 |
| a11ycore-scrollable-region-focusable | manual | `tests/fixtures/scrollable-region-focusable-all-scenarios.html` | 5 | 0 | 0 | 2 | 3 |
| a11ycore-searchbox-name-present | automatic | `tests/fixtures/searchbox-name-present-all-scenarios.html` | 21 | 5 | 5 | 0 | 11 |
| a11ycore-server-side-image-map-absent | automatic | `tests/fixtures/server-side-image-map-absent-all-scenarios.html` | 3 | 0 | 1 | 0 | 2 |
| a11ycore-skip-link | manual | `tests/fixtures/skip-link-all-scenarios.html` | 5 | 0 | 0 | 2 | 3 |
| a11ycore-slider-name-present | automatic | `tests/fixtures/slider-name-present-all-scenarios.html` | 21 | 8 | 5 | 0 | 8 |
| a11ycore-spinbutton-name-present | automatic | `tests/fixtures/spinbutton-name-present-all-scenarios.html` | 21 | 5 | 5 | 0 | 11 |
| a11ycore-summary-name-present | automatic | `tests/fixtures/summary-name-present-all-scenarios.html` | 6 | 4 | 2 | 0 | 0 |
| a11ycore-svg-image-text-alternative-present | automatic | `tests/fixtures/svg-image-text-alternative-present-all-scenarios.html` | 20 | 6 | 8 | 0 | 6 |
| a11ycore-svg-text-alternative-present | automatic | `tests/fixtures/svg-text-alternative-present-all-scenarios.html` | 24 | 5 | 12 | 0 | 7 |
| a11ycore-svg-text-alternative-quality | manual | `tests/fixtures/svg-text-alternative-quality-manual-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-tab-name-present | automatic | `tests/fixtures/tab-name-present-all-scenarios.html` | 17 | 4 | 5 | 0 | 8 |
| a11ycore-tabindex | manual | `tests/fixtures/tabindex-all-scenarios.html` | 3 | 0 | 0 | 1 | 2 |
| a11ycore-table-duplicate-name | manual | `tests/fixtures/table-duplicate-name-all-scenarios.html` | 2 | 0 | 0 | 1 | 1 |
| a11ycore-table-fake-caption | manual | `tests/fixtures/table-fake-caption-all-scenarios.html` | 4 | 0 | 0 | 1 | 3 |
| a11ycore-table-headers-attr-valid | automatic | `tests/fixtures/table-headers-attr-valid-all-scenarios.html` | 6 | 1 | 4 | 0 | 1 |
| a11ycore-table-th-has-data-cells | automatic | `tests/fixtures/table-th-has-data-cells-all-scenarios.html` | 4 | 1 | 2 | 0 | 1 |
| a11ycore-target-size-minimum | automatic | `tests/fixtures/target-size-all-scenarios.html` | 0 | 0 | 0 | 0 | 0 |
| a11ycore-td-has-header | automatic | `tests/fixtures/td-has-header-all-scenarios.html` | 5 | 0 | 1 | 0 | 4 |
| a11ycore-textbox-name-present | automatic | `tests/fixtures/textbox-name-present-all-scenarios.html` | 21 | 5 | 5 | 0 | 11 |
| a11ycore-tooltip-name-present | automatic | `tests/fixtures/tooltip-name-present-all-scenarios.html` | 7 | 4 | 2 | 0 | 1 |
| a11ycore-treeitem-name-present | automatic | `tests/fixtures/treeitem-name-present-all-scenarios.html` | 17 | 4 | 5 | 0 | 8 |
| a11ycore-valid-lang | automatic | `tests/fixtures/valid-lang-all-scenarios.html` | 3 | 1 | 1 | 0 | 1 |
| a11ycore-video-caption | manual | `tests/fixtures/video-caption-all-scenarios.html` | 5 | 0 | 0 | 3 | 2 |
| a11ycore-video-poster-text-alternative-present | automatic | `tests/fixtures/video-poster-text-alternative-present-all-scenarios.html` | 12 | 3 | 5 | 0 | 4 |

