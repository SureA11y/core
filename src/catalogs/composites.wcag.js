'use strict';

/**
 * Composite rules catalog (human-facing).
 *
 * A composite rule groups existing atomic checks (checks) by listing their ids in `checksIds`.
 *
 * For now, composites are grouped per WCAG Success Criterion (SC).
 */
module.exports = [
    {
        id: 'a11ycore-wcag-1.1.1-non-text-content',
        checksIds: [
            'a11ycore-area-alt-present',
            'a11ycore-img-alt-decorative',
            'a11ycore-img-alt-quality',
            'a11ycore-area-alt-decorative',
            'a11ycore-area-alt-quality',
            'a11ycore-canvas-text-alternative-quality',
            'a11ycore-canvas-text-alternative-present',
            'a11ycore-embed-text-alternative-present',
            'a11ycore-img-alt-present',
            'a11ycore-input-image-alt-present',
            'a11ycore-object-text-alternative-present',
            'a11ycore-role-img-text-alternative-present',
            'a11ycore-svg-image-text-alternative-present',
            'a11ycore-svg-text-alternative-present',
            'a11ycore-video-poster-text-alternative-present',
            'a11ycore-embed-text-alternative-quality',
            'a11ycore-input-image-alt-decorative',
            'a11ycore-input-image-alt-quality',
            'a11ycore-object-text-alternative-quality',
            'a11ycore-svg-text-alternative-quality',
            'a11ycore-meter-name-present',
            'a11ycore-progressbar-name-present'
        ],
        meta: {
            title: 'Non-text content: text alternatives',
            description: 'Rollup of checks ensuring non-text content has an appropriate text alternative.',
            wcagSc: ['1.1.1'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-1.2.1-audio-only-video-only-prerecorded',
        checksIds: [
            'a11ycore-media-alternative-transcript-evidence'
        ],
        meta: {
            title: 'Audio-only and video-only (prerecorded): transcript',
            description: 'Rollup of checks for transcript availability for prerecorded audio-only/video-only media.',
            wcagSc: ['1.2.1'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-1.2.2-captions-prerecorded',
        checksIds: [
            'a11ycore-video-caption'
        ],
        meta: {
            title: 'Captions (Prerecorded)',
            description: 'Rollup of checks for captions-track evidence on prerecorded video.',
            wcagSc: ['1.2.2'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-1.3.1-info-and-relationships',
        checksIds: [
            'a11ycore-table-headers-attr-valid',
            'a11ycore-table-th-has-data-cells',
            'a11ycore-aria-hidden-body',
            'a11ycore-list-children-valid',
            'a11ycore-listitem-parent-valid',
            'a11ycore-definition-list-children-valid',
            'a11ycore-dlitem-parent-valid',
            'a11ycore-form-control-programmatic-label-present',
            'a11ycore-p-as-heading',
            'a11ycore-table-fake-caption',
            'a11ycore-td-has-header'
        ],
        meta: {
            title: 'Info and Relationships',
            description: 'Rollup of checks ensuring information, structure, and relationships conveyed through presentation are programmatically determinable.',
            wcagSc: ['1.3.1'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-1.4.1-use-of-color',
        checksIds: [
            'a11ycore-link-in-text-block'
        ],
        meta: {
            title: 'Use of Color',
            description: 'Rollup of checks ensuring color is not used as the only visual means of conveying information.',
            wcagSc: ['1.4.1'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-1.4.2-audio-control',
        checksIds: [
            'a11ycore-no-autoplay-audio'
        ],
        meta: {
            title: 'Audio Control',
            description: 'Rollup of checks for a pause/stop or volume-control mechanism on autoplaying audio.',
            wcagSc: ['1.4.2'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-1.4.3-contrast-minimum',
        checksIds: [
            'a11ycore-contrast-computable',
            'a11ycore-contrast-minimum'
        ],
        meta: {
            title: 'Contrast: minimum',
            description: 'Rollup of checks for minimum text contrast.',
            wcagSc: ['1.4.3'],
            level: 'AA'
        }
    },

    {
        id: 'a11ycore-wcag-1.4.6-contrast-enhanced',
        checksIds: [
            'a11ycore-contrast-computable',
            'a11ycore-contrast-enhanced'
        ],
        meta: {
            title: 'Contrast: enhanced',
            description: 'Rollup of checks for enhanced text contrast.',
            wcagSc: ['1.4.6'],
            level: 'AAA'
        }
    },

    {
        id: 'a11ycore-wcag-2.1.1-keyboard',
        checksIds: [
            'a11ycore-manual-review',
            'a11ycore-iframe-focusable-content',
            'a11ycore-server-side-image-map-absent',
            'a11ycore-scrollable-region-focusable',
            'a11ycore-mouse-only-event-handlers'
        ],
        meta: {
            title: 'Keyboard',
            description: 'Rollup of checks ensuring functionality is operable through a keyboard interface.',
            wcagSc: ['2.1.1'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-2.1.3-keyboard-no-exception',
        checksIds: [
            'a11ycore-scrollable-region-focusable'
        ],
        meta: {
            title: 'Keyboard (No Exception)',
            description: 'Rollup of checks ensuring functionality is operable through a keyboard interface with no exceptions (AAA).',
            wcagSc: ['2.1.3'],
            level: 'AAA'
        }
    },

    {
        id: 'a11ycore-wcag-2.2.2-pause-stop-hide',
        checksIds: [
            'a11ycore-deprecated-elements-not-used'
        ],
        meta: {
            title: 'Pause, Stop, Hide',
            description: 'Rollup of checks ensuring moving, blinking, or auto-scrolling content can be paused, stopped, or hidden.',
            wcagSc: ['2.2.2'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-2.4.1-bypass-blocks',
        checksIds: [
            'a11ycore-bypass-blocks-present'
        ],
        meta: {
            title: 'Bypass Blocks',
            description: 'Rollup of checks ensuring the page provides a way to bypass repeated blocks of content.',
            wcagSc: ['2.4.1'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-2.4.2-page-titled',
        checksIds: [
            'a11ycore-page-title-patterns',
            'a11ycore-page-title-present'
        ],
        meta: {
            title: 'Page titled',
            description: 'Rollup of checks ensuring documents have a meaningful page title.',
            wcagSc: ['2.4.2'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-2.4.3-focus-order',
        checksIds: [
            'a11ycore-manual-review'
        ],
        meta: {
            title: 'Focus order',
            description: 'Rollup of checks ensuring focus moves through content in a meaningful order.',
            wcagSc: ['2.4.3'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-2.4.4-link-purpose-in-context',
        checksIds: [
            'a11ycore-link-name-quality'
        ],
        meta: {
            title: 'Link Purpose (In Context)',
            description: 'Rollup of checks flagging links whose text alone is a known non-descriptive/generic phrase.',
            wcagSc: ['2.4.4'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-2.4.7-focus-visible',
        checksIds: [
            'a11ycore-aria-hidden-focus',
            'a11ycore-css-hidden-focus',
            'a11ycore-manual-review'
        ],
        meta: {
            title: 'Focus visible',
            description: 'Rollup of checks ensuring keyboard focus is not hidden and remains perceivable.',
            wcagSc: ['2.4.7'],
            level: 'AA'
        }
    },

    {
        id: 'a11ycore-wcag-2.4.9-link-purpose-link-only',
        checksIds: [
            'a11ycore-identical-links-same-purpose'
        ],
        meta: {
            title: 'Link Purpose (Link Only)',
            description: 'Rollup of checks ensuring links with the same accessible name serve the same purpose (AAA).',
            wcagSc: ['2.4.9'],
            level: 'AAA'
        }
    },
    {
        id: 'a11ycore-wcag-2.5.3-label-in-name',
        checksIds: [
            'a11ycore-label-in-name'
        ],
        meta: {
            title: 'Label in name',
            description: 'Rollup of checks ensuring that when a control has a visible text label, the accessible name contains that visible label text.',
            wcagSc: ['2.5.3'],
            level: 'A'
        }
    },
    {
        id: 'a11ycore-wcag-2.5.8-target-size-minimum',
        checksIds: [
            'a11ycore-target-size-minimum'
        ],
        meta: {
            title: 'Target size: minimum',
            description: 'Rollup of checks ensuring pointer targets meet minimum size requirements.',
            wcagSc: ['2.5.8'],
            level: 'AA'
        }
    },

    {
        id: 'a11ycore-wcag-3.1.1-language-of-page',
        checksIds: [
            'a11ycore-html-lang-attr-present',
            'a11ycore-html-xml-lang-mismatch'
        ],
        meta: {
            title: 'Language of page',
            description: 'Rollup of checks ensuring the page language is specified.',
            wcagSc: ['3.1.1'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-3.1.2-language-of-parts',
        checksIds: [
            'a11ycore-valid-lang'
        ],
        meta: {
            title: 'Language of Parts',
            description: 'Rollup of checks ensuring elements whose language differs from the page default declare it correctly.',
            wcagSc: ['3.1.2'],
            level: 'AA'
        }
    },

    {
        id: 'a11ycore-wcag-1.3.4-orientation',
        checksIds: [
            'a11ycore-css-orientation-lock'
        ],
        meta: {
            title: 'Orientation',
            description: 'Rollup of checks ensuring content does not restrict its view to a single display orientation.',
            wcagSc: ['1.3.4'],
            level: 'AA'
        }
    },

    {
        id: 'a11ycore-wcag-1.3.5-identify-input-purpose',
        checksIds: [
            'a11ycore-autocomplete-valid'
        ],
        meta: {
            title: 'Identify Input Purpose',
            description: 'Rollup of checks ensuring the autocomplete attribute correctly identifies input purpose.',
            wcagSc: ['1.3.5'],
            level: 'AA'
        }
    },

    {
        id: 'a11ycore-wcag-1.4.12-text-spacing',
        checksIds: [
            'a11ycore-avoid-inline-spacing'
        ],
        meta: {
            title: 'Text Spacing',
            description: 'Rollup of checks ensuring inline styles do not block user text-spacing overrides.',
            wcagSc: ['1.4.12'],
            level: 'AA'
        }
    },

    {
        id: 'a11ycore-wcag-2.2.4-interruptions',
        checksIds: [
            'a11ycore-meta-refresh-no-exceptions'
        ],
        meta: {
            title: 'Interruptions',
            description: 'Rollup of checks ensuring automatic context changes only happen at the user\'s request (AAA).',
            wcagSc: ['2.2.4'],
            level: 'AAA'
        }
    },

    {
        id: 'a11ycore-wcag-3.2.5-change-on-request',
        checksIds: [
            'a11ycore-meta-refresh-no-exceptions'
        ],
        meta: {
            title: 'Change on Request',
            description: 'Rollup of checks ensuring context changes only happen at the user\'s request (AAA).',
            wcagSc: ['3.2.5'],
            level: 'AAA'
        }
    },

    {
        id: 'a11ycore-wcag-4.1.2-name',
        checksIds: [
            'a11ycore-aria-role-name-present',
            'a11ycore-binary-control-name-present',
            'a11ycore-button-name-present',
            'a11ycore-combobox-name-present',
            'a11ycore-dialog-name-present',
            'a11ycore-form-control-programmatic-label-present',
            'a11ycore-iframe-name-present',
            'a11ycore-iframe-title-unique',
            'a11ycore-link-name-present',
            'a11ycore-listbox-name-present',
            'a11ycore-menuitem-name-present',
            'a11ycore-option-name-present',
            'a11ycore-searchbox-name-present',
            'a11ycore-slider-name-present',
            'a11ycore-spinbutton-name-present',
            'a11ycore-tab-name-present',
            'a11ycore-textbox-name-present',
            'a11ycore-treeitem-name-present',
            'a11ycore-aria-hidden-focus',
            'a11ycore-aria-hidden-body',
            'a11ycore-form-control-programmatic-label-quality',
            'a11ycore-summary-name-present',
            'a11ycore-tooltip-name-present'
        ],
        meta: {
            title: 'Name, role, value: accessible name',
            description: 'Rollup of checks that common interactive elements expose a non-empty accessible name.',
            wcagSc: ['4.1.2'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-4.1.2-aria-validity',
        checksIds: [
            'a11ycore-aria-roles-valid',
            'a11ycore-aria-deprecated-role',
            'a11ycore-aria-valid-attr',
            'a11ycore-aria-valid-attr-value',
            'a11ycore-aria-allowed-attr',
            'a11ycore-aria-prohibited-attr',
            'a11ycore-aria-required-attr',
            'a11ycore-aria-allowed-role',
            'a11ycore-aria-required-children',
            'a11ycore-aria-prohibited-children',
            'a11ycore-aria-required-parent',
            'a11ycore-duplicate-id-aria',
            'a11ycore-nested-interactive-controls-absent',
            'a11ycore-aria-braille-equivalent',
            'a11ycore-aria-conditional-attr',
            'a11ycore-aria-checked-state-mismatch'
        ],
        meta: {
            title: 'Name, role, value: ARIA validity',
            description: 'Rollup of checks that ARIA role and attribute usage conforms to the WAI-ARIA specification (valid roles, valid attributes, valid values, required attributes/relationships, unique ARIA-referenced ids).',
            wcagSc: ['4.1.2'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-1.4.4-resize-text',
        checksIds: [
            'a11ycore-meta-viewport-zoom-enabled'
        ],
        meta: {
            title: 'Resize Text',
            description: 'Rollup of checks ensuring the viewport meta tag does not prevent users from zooming text up to 200%.',
            wcagSc: ['1.4.4'],
            level: 'AA'
        }
    },

    {
        id: 'a11ycore-wcag-2.2.1-timing-adjustable',
        checksIds: [
            'a11ycore-meta-refresh-timing-absent'
        ],
        meta: {
            title: 'Timing Adjustable',
            description: 'Rollup of checks ensuring the page does not impose a timed refresh the user cannot control.',
            wcagSc: ['2.2.1'],
            level: 'A'
        }
    },

    {
        id: 'a11ycore-wcag-3.3.2-labels-or-instructions',
        checksIds: [
            'a11ycore-form-control-single-label',
            'a11ycore-form-control-programmatic-label-present'
        ],
        meta: {
            title: 'Labels or Instructions',
            description: 'Rollup of checks ensuring form controls have unambiguous labeling.',
            wcagSc: ['3.3.2'],
            level: 'A'
        }
    }
];
