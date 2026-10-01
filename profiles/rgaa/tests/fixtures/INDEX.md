# Fixture Index

This profile's rules and their scenario pages. Every rule should have a `tests/fixtures/<slug>-all-scenarios.html` scenario page (numbered `case_NN` blocks, each marked PASS/FAIL/CANTTELL in its `.case-title`) and a "fixture coverage" test in its `tests/rules/**/<rule>.test.js` asserting the exact expected ids. Paths are relative to the profile's folder. Core's rules have their own index, in core's `tests/fixtures/INDEX.md`.

## Summary

Total rules: **69**. With fixture: **69**. Without fixture: **0**.

## Rules WITHOUT a fixture (0)

None — every rule has a fixture.

## Rules WITH a fixture (69)

| Rule ID | Type | Fixture | Cases | PASS | FAIL | CANTTELL | OTHER |
|---|---|---|---:|---:|---:|---:|---:|
| area-alt-source | automatic | `tests/fixtures/area-alt-source-all-scenarios.html` | 7 | 2 | 2 | 0 | 3 |
| aria-attribute-conformance | automatic | `tests/fixtures/aria-attribute-conformance-all-scenarios.html` | 19 | 5 | 14 | 0 | 0 |
| aria-list-item-roles | automatic | `tests/fixtures/aria-list-item-roles-all-scenarios.html` | 6 | 1 | 0 | 3 | 2 |
| aria-role-conformance | automatic | `tests/fixtures/aria-role-conformance-all-scenarios.html` | 20 | 5 | 14 | 1 | 0 |
| canvas-decorative-aria-hidden | automatic | `tests/fixtures/canvas-decorative-aria-hidden-all-scenarios.html` | 8 | 2 | 3 | 1 | 2 |
| canvas-role-img | automatic | `tests/fixtures/canvas-role-img-all-scenarios.html` | 9 | 2 | 4 | 1 | 2 |
| complex-table-summary | manual | `tests/fixtures/complex-table-summary-all-scenarios.html` | 8 | 0 | 0 | 0 | 8 |
| complex-table-summary-quality | manual | `tests/fixtures/complex-table-summary-quality-all-scenarios.html` | 7 | 0 | 0 | 3 | 4 |
| contrast-minimum-rgaa | automatic | `tests/fixtures/contrast-minimum-rgaa-all-scenarios.html` | 7 | 4 | 3 | 0 | 0 |
| data-table-headers-review | manual | `tests/fixtures/data-table-headers-review-all-scenarios.html` | 7 | 0 | 0 | 3 | 4 |
| dir-attribute-valid | automatic | `tests/fixtures/dir-attribute-valid-all-scenarios.html` | 8 | 2 | 4 | 0 | 2 |
| doctype-position | automatic | `tests/fixtures/doctype-position-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| doctype-present | automatic | `tests/fixtures/doctype-present-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| doctype-valid | automatic | `tests/fixtures/doctype-valid-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| embed-image-role-img | automatic | `tests/fixtures/embed-image-role-img-all-scenarios.html` | 8 | 1 | 2 | 2 | 3 |
| embedded-refresh-review | manual | `tests/fixtures/embedded-refresh-review-all-scenarios.html` | 6 | 0 | 0 | 4 | 2 |
| fake-list | manual | `tests/fixtures/fake-list-all-scenarios.html` | 7 | 0 | 0 | 0 | 7 |
| field-group-legend | manual | `tests/fixtures/field-group-legend-all-scenarios.html` | 10 | 0 | 0 | 0 | 10 |
| field-label-in-name-sources | automatic | `tests/fixtures/field-label-in-name-sources-all-scenarios.html` | 11 | 3 | 4 | 1 | 3 |
| field-label-listed-source | automatic | `tests/fixtures/field-label-listed-source-all-scenarios.html` | 15 | 4 | 7 | 3 | 1 |
| figure-caption-structure | automatic | `tests/fixtures/figure-caption-structure-all-scenarios.html` | 8 | 2 | 4 | 0 | 2 |
| focus-indicator-contrast | automatic | `tests/fixtures/focus-indicator-contrast-all-scenarios.html` | 11 | 2 | 3 | 4 | 2 |
| form-button-label-in-name-sources | automatic | `tests/fixtures/form-button-label-in-name-sources-all-scenarios.html` | 9 | 2 | 3 | 2 | 2 |
| form-button-name-present | automatic | `tests/fixtures/form-button-name-present-all-scenarios.html` | 9 | 3 | 3 | 2 | 1 |
| frame-title-attribute-present | automatic | `tests/fixtures/frame-title-attribute-present-all-scenarios.html` | 9 | 2 | 4 | 0 | 3 |
| frame-title-not-empty | automatic | `tests/fixtures/frame-title-not-empty-all-scenarios.html` | 5 | 1 | 2 | 0 | 2 |
| heading-content-present | automatic | `tests/fixtures/heading-content-present-all-scenarios.html` | 11 | 3 | 3 | 4 | 1 |
| heading-role-level-present | automatic | `tests/fixtures/heading-role-level-present-all-scenarios.html` | 6 | 1 | 3 | 0 | 2 |
| html-elements-attributes-valid | automatic | `tests/fixtures/html-elements-attributes-valid-all-scenarios.html` | 16 | 4 | 12 | 0 | 0 |
| html-lang-code-valid | automatic | `tests/fixtures/html-lang-code-valid-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| html-nesting-valid | automatic | `tests/fixtures/html-nesting-valid-all-scenarios.html` | 17 | 5 | 12 | 0 | 0 |
| image-alt-long | manual | `tests/fixtures/image-alt-long-all-scenarios.html` | 6 | 0 | 0 | 0 | 6 |
| img-decorative-no-alternative | automatic | `tests/fixtures/img-decorative-no-alternative-all-scenarios.html` | 9 | 3 | 2 | 2 | 2 |
| keyboard-only-event-handlers | manual | `tests/fixtures/keyboard-only-event-handlers-all-scenarios.html` | 10 | 0 | 0 | 4 | 6 |
| label-for-target-valid | automatic | `tests/fixtures/label-for-target-valid-all-scenarios.html` | 8 | 3 | 4 | 0 | 1 |
| layout-table-no-data-markup | automatic | `tests/fixtures/layout-table-no-data-markup-all-scenarios.html` | 11 | 3 | 6 | 1 | 1 |
| letters-spaced-with-spaces | manual | `tests/fixtures/letters-spaced-with-spaces-all-scenarios.html` | 8 | 0 | 0 | 0 | 8 |
| link-content-label-present | automatic | `tests/fixtures/link-content-label-present-all-scenarios.html` | 9 | 3 | 4 | 1 | 1 |
| link-context-review | manual | `tests/fixtures/link-context-review-all-scenarios.html` | 6 | 0 | 0 | 3 | 3 |
| link-label-in-name-sources | automatic | `tests/fixtures/link-label-in-name-sources-all-scenarios.html` | 13 | 3 | 4 | 3 | 3 |
| link-state-colors-review | automatic | `tests/fixtures/link-state-colors-review-all-scenarios.html` | 7 | 0 | 0 | 3 | 4 |
| listbox-option-groups-absent | automatic | `tests/fixtures/listbox-option-groups-absent-all-scenarios.html` | 4 | 1 | 2 | 0 | 1 |
| main-element-structure | automatic | `tests/fixtures/main-element-structure-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| markup-validation-review | automatic | `tests/fixtures/markup-validation-review-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| media-transcript-adjacent | automatic | `tests/fixtures/media-transcript-adjacent-all-scenarios.html` | 9 | 3 | 0 | 5 | 1 |
| meta-redirect-immediate | automatic | `tests/fixtures/meta-redirect-immediate-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| meta-refresh-no-url-timing | automatic | `tests/fixtures/meta-refresh-no-url-timing-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| object-image-role-img | automatic | `tests/fixtures/object-image-role-img-all-scenarios.html` | 9 | 2 | 2 | 3 | 2 |
| office-document-link | manual | `tests/fixtures/office-document-link-all-scenarios.html` | 10 | 0 | 0 | 0 | 10 |
| optgroup-label-not-empty | automatic | `tests/fixtures/optgroup-label-not-empty-all-scenarios.html` | 4 | 1 | 2 | 0 | 1 |
| optgroup-label-present | automatic | `tests/fixtures/optgroup-label-present-all-scenarios.html` | 3 | 2 | 1 | 0 | 0 |
| orientation-content-parity | automatic | `tests/fixtures/orientation-content-parity-all-scenarios.html` | 7 | 0 | 0 | 4 | 3 |
| page-language-present | automatic | `tests/fixtures/page-language-present-all-scenarios.html` | 1 | 1 | 0 | 0 | 0 |
| page-title-unique | automatic | `tests/fixtures/page-title-unique-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| page-zones-reachable | automatic | `tests/fixtures/page-zones-reachable-all-scenarios.html` | 6 | 2 | 0 | 4 | 0 |
| presentational-attributes-absent | automatic | `tests/fixtures/presentational-attributes-absent-all-scenarios.html` | 11 | 0 | 8 | 0 | 3 |
| presentational-elements-absent | automatic | `tests/fixtures/presentational-elements-absent-all-scenarios.html` | 9 | 0 | 7 | 0 | 2 |
| radio-group-present | manual | `tests/fixtures/radio-group-present-all-scenarios.html` | 6 | 0 | 0 | 0 | 6 |
| role-img-aria-name | automatic | `tests/fixtures/role-img-aria-name-all-scenarios.html` | 9 | 2 | 3 | 1 | 3 |
| scripted-components-review | manual | `tests/fixtures/scripted-components-review-all-scenarios.html` | 12 | 0 | 0 | 0 | 12 |
| skip-link-placement | automatic | `tests/fixtures/skip-link-placement-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| skip-link-present | automatic | `tests/fixtures/skip-link-present-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |
| svg-hidden-no-alternative | automatic | `tests/fixtures/svg-hidden-no-alternative-all-scenarios.html` | 10 | 3 | 5 | 0 | 2 |
| svg-role-img | automatic | `tests/fixtures/svg-role-img-all-scenarios.html` | 9 | 2 | 3 | 1 | 3 |
| th-scope-row-col | manual | `tests/fixtures/th-scope-row-col-all-scenarios.html` | 5 | 0 | 0 | 2 | 3 |
| title-placeholder-identical | automatic | `tests/fixtures/title-placeholder-identical-all-scenarios.html` | 7 | 2 | 0 | 3 | 2 |
| video-captions-track-kind | automatic | `tests/fixtures/video-captions-track-kind-all-scenarios.html` | 8 | 2 | 3 | 1 | 2 |
| viewport-zoom-review | manual | `tests/fixtures/viewport-zoom-review-all-scenarios.html` | 1 | 0 | 0 | 1 | 0 |
| widget-label-in-name | automatic | `tests/fixtures/widget-label-in-name-all-scenarios.html` | 6 | 1 | 2 | 1 | 2 |

