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
            'a11ycore-svg-text-alternative-quality'
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
            'a11ycore-manual-review'
        ],
        meta: {
            title: 'Keyboard',
            description: 'Rollup of checks ensuring functionality is operable through a keyboard interface.',
            wcagSc: ['2.1.1'],
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
            'a11ycore-html-lang-attr-present'
        ],
        meta: {
            title: 'Language of page',
            description: 'Rollup of checks ensuring the page language is specified.',
            wcagSc: ['3.1.1'],
            level: 'A'
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
            'a11ycore-form-control-programmatic-label-quality'
        ],
        meta: {
            title: 'Name, role, value: accessible name',
            description: 'Rollup of checks that common interactive elements expose a non-empty accessible name.',
            wcagSc: ['4.1.2'],
            level: 'A'
        }
    }
];
