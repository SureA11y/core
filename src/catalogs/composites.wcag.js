/* SPDX-License-Identifier: MPL-2.0 */

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
    id: 'wcag-1.1.1-non-text-content',
    checksIds: [
      'area-alt-present',
      'img-alt-decorative',
      'img-alt-quality',
      'area-alt-decorative',
      'area-alt-quality',
      'canvas-text-alternative-quality',
      'canvas-text-alternative-present',
      'embed-text-alternative-present',
      'img-alt-present',
      'input-image-alt-present',
      'object-text-alternative-present',
      'role-img-text-alternative-present',
      'svg-image-text-alternative-present',
      'svg-text-alternative-present',
      'video-poster-text-alternative-present',
      'embed-text-alternative-quality',
      'input-image-alt-decorative',
      'input-image-alt-quality',
      'object-text-alternative-quality',
      'svg-text-alternative-quality',
      'meter-name-present',
      'progressbar-name-present'
    ],
    meta: {
      title: 'Non-text content: text alternatives',
      description:
        'Rollup of checks ensuring non-text content has an appropriate text alternative.',
      wcagSc: ['1.1.1'],
      level: 'A'
    }
  },

  {
    id: 'wcag-1.2.1-audio-only-video-only-prerecorded',
    checksIds: ['media-alternative-transcript-evidence'],
    meta: {
      title: 'Audio-only and video-only (prerecorded): transcript',
      description:
        'Rollup of checks for transcript availability for prerecorded audio-only/video-only media.',
      wcagSc: ['1.2.1'],
      level: 'A'
    }
  },

  {
    id: 'wcag-1.2.2-captions-prerecorded',
    checksIds: ['video-caption'],
    meta: {
      title: 'Captions (Prerecorded)',
      description: 'Rollup of checks for captions-track evidence on prerecorded video.',
      wcagSc: ['1.2.2'],
      level: 'A'
    }
  },

  {
    id: 'wcag-1.3.1-info-and-relationships',
    checksIds: [
      'table-headers-attr-valid',
      'table-th-has-data-cells',
      'aria-hidden-body',
      'list-children-valid',
      'listitem-parent-valid',
      'definition-list-children-valid',
      'dlitem-parent-valid',
      'form-control-programmatic-label-present',
      'p-as-heading',
      'table-fake-caption',
      'td-has-header'
    ],
    meta: {
      title: 'Info and Relationships',
      description:
        'Rollup of checks ensuring information, structure, and relationships conveyed through presentation are programmatically determinable.',
      wcagSc: ['1.3.1'],
      level: 'A'
    }
  },

  {
    id: 'wcag-1.4.1-use-of-color',
    checksIds: ['link-in-text-block'],
    meta: {
      title: 'Use of Color',
      description:
        'Rollup of checks ensuring color is not used as the only visual means of conveying information.',
      wcagSc: ['1.4.1'],
      level: 'A'
    }
  },

  {
    id: 'wcag-1.4.2-audio-control',
    checksIds: ['no-autoplay-audio'],
    meta: {
      title: 'Audio Control',
      description:
        'Rollup of checks for a pause/stop or volume-control mechanism on autoplaying audio.',
      wcagSc: ['1.4.2'],
      level: 'A'
    }
  },

  {
    id: 'wcag-1.4.3-contrast-minimum',
    checksIds: ['contrast-computable', 'contrast-minimum'],
    meta: {
      title: 'Contrast: minimum',
      description: 'Rollup of checks for minimum text contrast.',
      wcagSc: ['1.4.3'],
      level: 'AA'
    }
  },

  {
    id: 'wcag-1.4.6-contrast-enhanced',
    checksIds: ['contrast-computable', 'contrast-enhanced'],
    meta: {
      title: 'Contrast: enhanced',
      description: 'Rollup of checks for enhanced text contrast.',
      wcagSc: ['1.4.6'],
      level: 'AAA'
    }
  },

  {
    id: 'wcag-2.1.1-keyboard',
    checksIds: [
      'manual-review',
      'iframe-focusable-content',
      'server-side-image-map-absent',
      'scrollable-region-focusable',
      'mouse-only-event-handlers'
    ],
    meta: {
      title: 'Keyboard',
      description:
        'Rollup of checks ensuring functionality is operable through a keyboard interface.',
      wcagSc: ['2.1.1'],
      level: 'A'
    }
  },

  {
    id: 'wcag-2.1.3-keyboard-no-exception',
    checksIds: ['scrollable-region-focusable'],
    meta: {
      title: 'Keyboard (No Exception)',
      description:
        'Rollup of checks ensuring functionality is operable through a keyboard interface with no exceptions (AAA).',
      wcagSc: ['2.1.3'],
      level: 'AAA'
    }
  },

  {
    id: 'wcag-2.2.2-pause-stop-hide',
    checksIds: ['deprecated-elements-not-used'],
    meta: {
      title: 'Pause, Stop, Hide',
      description:
        'Rollup of checks ensuring moving, blinking, or auto-scrolling content can be paused, stopped, or hidden.',
      wcagSc: ['2.2.2'],
      level: 'A'
    }
  },

  {
    id: 'wcag-2.4.1-bypass-blocks',
    checksIds: ['bypass-blocks-present'],
    meta: {
      title: 'Bypass Blocks',
      description:
        'Rollup of checks ensuring the page provides a way to bypass repeated blocks of content.',
      wcagSc: ['2.4.1'],
      level: 'A'
    }
  },

  {
    id: 'wcag-2.4.2-page-titled',
    checksIds: ['page-title-patterns', 'page-title-present'],
    meta: {
      title: 'Page titled',
      description: 'Rollup of checks ensuring documents have a meaningful page title.',
      wcagSc: ['2.4.2'],
      level: 'A'
    }
  },

  {
    id: 'wcag-2.4.3-focus-order',
    checksIds: ['manual-review'],
    meta: {
      title: 'Focus order',
      description: 'Rollup of checks ensuring focus moves through content in a meaningful order.',
      wcagSc: ['2.4.3'],
      level: 'A'
    }
  },

  {
    id: 'wcag-2.4.4-link-purpose-in-context',
    checksIds: ['link-name-quality'],
    meta: {
      title: 'Link Purpose (In Context)',
      description:
        'Rollup of checks flagging links whose text alone is a known non-descriptive/generic phrase.',
      wcagSc: ['2.4.4'],
      level: 'A'
    }
  },

  {
    id: 'wcag-2.4.7-focus-visible',
    checksIds: ['aria-hidden-focus', 'css-hidden-focus', 'manual-review'],
    meta: {
      title: 'Focus visible',
      description:
        'Rollup of checks ensuring keyboard focus is not hidden and remains perceivable.',
      wcagSc: ['2.4.7'],
      level: 'AA'
    }
  },

  {
    id: 'wcag-2.4.9-link-purpose-link-only',
    checksIds: ['identical-links-same-purpose'],
    meta: {
      title: 'Link Purpose (Link Only)',
      description:
        'Rollup of checks ensuring links with the same accessible name serve the same purpose (AAA).',
      wcagSc: ['2.4.9'],
      level: 'AAA'
    }
  },
  {
    id: 'wcag-2.5.3-label-in-name',
    checksIds: ['label-in-name'],
    meta: {
      title: 'Label in name',
      description:
        'Rollup of checks ensuring that when a control has a visible text label, the accessible name contains that visible label text.',
      wcagSc: ['2.5.3'],
      level: 'A'
    }
  },
  {
    id: 'wcag-2.5.8-target-size-minimum',
    checksIds: ['target-size-minimum'],
    meta: {
      title: 'Target size: minimum',
      description: 'Rollup of checks ensuring pointer targets meet minimum size requirements.',
      wcagSc: ['2.5.8'],
      level: 'AA'
    }
  },

  {
    id: 'wcag-3.1.1-language-of-page',
    checksIds: ['html-lang-attr-present', 'html-xml-lang-mismatch'],
    meta: {
      title: 'Language of page',
      description: 'Rollup of checks ensuring the page language is specified.',
      wcagSc: ['3.1.1'],
      level: 'A'
    }
  },

  {
    id: 'wcag-3.1.2-language-of-parts',
    checksIds: ['valid-lang'],
    meta: {
      title: 'Language of Parts',
      description:
        'Rollup of checks ensuring elements whose language differs from the page default declare it correctly.',
      wcagSc: ['3.1.2'],
      level: 'AA'
    }
  },

  {
    id: 'wcag-1.3.4-orientation',
    checksIds: ['css-orientation-lock'],
    meta: {
      title: 'Orientation',
      description:
        'Rollup of checks ensuring content does not restrict its view to a single display orientation.',
      wcagSc: ['1.3.4'],
      level: 'AA'
    }
  },

  {
    id: 'wcag-1.3.5-identify-input-purpose',
    checksIds: ['autocomplete-valid'],
    meta: {
      title: 'Identify Input Purpose',
      description:
        'Rollup of checks ensuring the autocomplete attribute correctly identifies input purpose.',
      wcagSc: ['1.3.5'],
      level: 'AA'
    }
  },

  {
    id: 'wcag-1.4.12-text-spacing',
    checksIds: ['avoid-inline-spacing'],
    meta: {
      title: 'Text Spacing',
      description:
        'Rollup of checks ensuring inline styles do not block user text-spacing overrides.',
      wcagSc: ['1.4.12'],
      level: 'AA'
    }
  },

  {
    id: 'wcag-2.2.4-interruptions',
    checksIds: ['meta-refresh-no-exceptions'],
    meta: {
      title: 'Interruptions',
      description:
        "Rollup of checks ensuring automatic context changes only happen at the user's request (AAA).",
      wcagSc: ['2.2.4'],
      level: 'AAA'
    }
  },

  {
    id: 'wcag-3.2.5-change-on-request',
    checksIds: ['meta-refresh-no-exceptions'],
    meta: {
      title: 'Change on Request',
      description:
        "Rollup of checks ensuring context changes only happen at the user's request (AAA).",
      wcagSc: ['3.2.5'],
      level: 'AAA'
    }
  },

  {
    id: 'wcag-4.1.2-name',
    checksIds: [
      'aria-role-name-present',
      'binary-control-name-present',
      'button-name-present',
      'combobox-name-present',
      'dialog-name-present',
      'form-control-programmatic-label-present',
      'iframe-name-present',
      'iframe-title-unique',
      'link-name-present',
      'listbox-name-present',
      'menuitem-name-present',
      'option-name-present',
      'searchbox-name-present',
      'slider-name-present',
      'spinbutton-name-present',
      'tab-name-present',
      'textbox-name-present',
      'treeitem-name-present',
      'aria-hidden-focus',
      'aria-hidden-body',
      'form-control-programmatic-label-quality',
      'summary-name-present',
      'tooltip-name-present'
    ],
    meta: {
      title: 'Name, role, value: accessible name',
      description:
        'Rollup of checks that common interactive elements expose a non-empty accessible name.',
      wcagSc: ['4.1.2'],
      level: 'A'
    }
  },

  {
    id: 'wcag-4.1.2-aria-validity',
    checksIds: [
      'aria-roles-valid',
      'aria-deprecated-role',
      'aria-valid-attr',
      'aria-valid-attr-value',
      'aria-allowed-attr',
      'aria-prohibited-attr',
      'aria-required-attr',
      'aria-allowed-role',
      'aria-required-children',
      'aria-prohibited-children',
      'aria-required-parent',
      'duplicate-id-aria',
      'nested-interactive-controls-absent',
      'aria-braille-equivalent',
      'aria-conditional-attr',
      'aria-checked-state-mismatch'
    ],
    meta: {
      title: 'Name, role, value: ARIA validity',
      description:
        'Rollup of checks that ARIA role and attribute usage conforms to the WAI-ARIA specification (valid roles, valid attributes, valid values, required attributes/relationships, unique ARIA-referenced ids).',
      wcagSc: ['4.1.2'],
      level: 'A'
    }
  },

  {
    id: 'wcag-1.4.4-resize-text',
    checksIds: ['meta-viewport-zoom-enabled'],
    meta: {
      title: 'Resize Text',
      description:
        'Rollup of checks ensuring the viewport meta tag does not prevent users from zooming text up to 200%.',
      wcagSc: ['1.4.4'],
      level: 'AA'
    }
  },

  {
    id: 'wcag-2.2.1-timing-adjustable',
    checksIds: ['meta-refresh-timing-absent'],
    meta: {
      title: 'Timing Adjustable',
      description:
        'Rollup of checks ensuring the page does not impose a timed refresh the user cannot control.',
      wcagSc: ['2.2.1'],
      level: 'A'
    }
  },

  {
    id: 'wcag-3.3.2-labels-or-instructions',
    checksIds: ['form-control-single-label', 'form-control-programmatic-label-present'],
    meta: {
      title: 'Labels or Instructions',
      description: 'Rollup of checks ensuring form controls have unambiguous labeling.',
      wcagSc: ['3.3.2'],
      level: 'A'
    }
  }
];
