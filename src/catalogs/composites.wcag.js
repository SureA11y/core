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
      titleKey: 'catalog.rules.wcag_111_non_text_content.title',
      descriptionKey: 'catalog.rules.wcag_111_non_text_content.description',
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
      titleKey: 'catalog.rules.wcag_121_prerecorded_transcript.title',
      descriptionKey: 'catalog.rules.wcag_121_prerecorded_transcript.description',
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
      titleKey: 'catalog.rules.wcag_122_captions_prerecorded.title',
      descriptionKey: 'catalog.rules.wcag_122_captions_prerecorded.description',
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
      'aria-required-children',
      'aria-prohibited-children',
      'aria-required-parent',
      'form-control-programmatic-label-present',
      'p-as-heading',
      'table-fake-caption',
      'td-has-header'
    ],
    meta: {
      titleKey: 'catalog.rules.wcag_131_info_and_relationships.title',
      descriptionKey: 'catalog.rules.wcag_131_info_and_relationships.description',
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
      titleKey: 'catalog.rules.wcag_141_use_of_color.title',
      descriptionKey: 'catalog.rules.wcag_141_use_of_color.description',
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
      titleKey: 'catalog.rules.wcag_142_audio_control.title',
      descriptionKey: 'catalog.rules.wcag_142_audio_control.description',
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
      titleKey: 'catalog.rules.wcag_143_contrast_minimum.title',
      descriptionKey: 'catalog.rules.wcag_143_contrast_minimum.description',
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
      titleKey: 'catalog.rules.wcag_146_contrast_enhanced.title',
      descriptionKey: 'catalog.rules.wcag_146_contrast_enhanced.description',
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
      titleKey: 'catalog.rules.wcag_211_keyboard.title',
      descriptionKey: 'catalog.rules.wcag_211_keyboard.description',
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
      titleKey: 'catalog.rules.wcag_213_keyboard_no_exception.title',
      descriptionKey: 'catalog.rules.wcag_213_keyboard_no_exception.description',
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
      titleKey: 'catalog.rules.wcag_222_pause_stop_hide.title',
      descriptionKey: 'catalog.rules.wcag_222_pause_stop_hide.description',
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
      titleKey: 'catalog.rules.wcag_241_bypass_blocks.title',
      descriptionKey: 'catalog.rules.wcag_241_bypass_blocks.description',
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
      titleKey: 'catalog.rules.wcag_242_page_titled.title',
      descriptionKey: 'catalog.rules.wcag_242_page_titled.description',
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
      titleKey: 'catalog.rules.wcag_243_focus_order.title',
      descriptionKey: 'catalog.rules.wcag_243_focus_order.description',
      title: 'Focus order',
      description: 'Rollup of checks ensuring focus moves through content in a meaningful order.',
      wcagSc: ['2.4.3'],
      level: 'A'
    }
  },

  {
    id: 'wcag-2.4.4-link-purpose-in-context',
    checksIds: ['link-name-present', 'link-name-quality'],
    meta: {
      titleKey: 'catalog.rules.wcag_244_link_purpose_in_context.title',
      descriptionKey: 'catalog.rules.wcag_244_link_purpose_in_context.description',
      title: 'Link Purpose (In Context)',
      description:
        'Rollup of checks flagging links with no accessible name, or whose text alone is a known non-descriptive/generic phrase.',
      wcagSc: ['2.4.4'],
      level: 'A'
    }
  },

  {
    id: 'wcag-2.4.6-headings-and-labels',
    checksIds: ['heading-quality', 'form-control-label-quality'],
    meta: {
      titleKey: 'catalog.rules.wcag_246_headings_and_labels.title',
      descriptionKey: 'catalog.rules.wcag_246_headings_and_labels.description',
      title: 'Headings and Labels',
      description:
        'Rollup of checks flagging headings whose text is a placeholder rather than a description of the content that follows.',
      wcagSc: ['2.4.6'],
      level: 'AA'
    }
  },

  {
    id: 'wcag-2.4.7-focus-visible',
    checksIds: [
      'aria-hidden-focus',
      'css-hidden-focus',
      'css-focus-indicator-suppressed',
      'manual-review'
    ],
    meta: {
      titleKey: 'catalog.rules.wcag_247_focus_visible.title',
      descriptionKey: 'catalog.rules.wcag_247_focus_visible.description',
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
      titleKey: 'catalog.rules.wcag_249_link_purpose_link_only.title',
      descriptionKey: 'catalog.rules.wcag_249_link_purpose_link_only.description',
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
      titleKey: 'catalog.rules.wcag_253_label_in_name.title',
      descriptionKey: 'catalog.rules.wcag_253_label_in_name.description',
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
      titleKey: 'catalog.rules.wcag_258_target_size_minimum.title',
      descriptionKey: 'catalog.rules.wcag_258_target_size_minimum.description',
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
      titleKey: 'catalog.rules.wcag_311_language_of_page.title',
      descriptionKey: 'catalog.rules.wcag_311_language_of_page.description',
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
      titleKey: 'catalog.rules.wcag_312_language_of_parts.title',
      descriptionKey: 'catalog.rules.wcag_312_language_of_parts.description',
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
      titleKey: 'catalog.rules.wcag_134_orientation.title',
      descriptionKey: 'catalog.rules.wcag_134_orientation.description',
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
      titleKey: 'catalog.rules.wcag_135_identify_input_purpose.title',
      descriptionKey: 'catalog.rules.wcag_135_identify_input_purpose.description',
      title: 'Identify Input Purpose',
      description:
        'Rollup of checks ensuring the autocomplete attribute correctly identifies input purpose.',
      wcagSc: ['1.3.5'],
      level: 'AA'
    }
  },

  {
    id: 'wcag-1.4.12-text-spacing',
    checksIds: ['avoid-inline-spacing', 'text-spacing-content-loss'],
    meta: {
      titleKey: 'catalog.rules.wcag_1412_text_spacing.title',
      descriptionKey: 'catalog.rules.wcag_1412_text_spacing.description',
      title: 'Text Spacing',
      description:
        'Rollup of checks ensuring text spacing can be increased without losing content.',
      wcagSc: ['1.4.12'],
      level: 'AA'
    }
  },

  {
    id: 'wcag-2.2.4-interruptions',
    checksIds: ['meta-refresh-no-exceptions'],
    meta: {
      titleKey: 'catalog.rules.wcag_224_interruptions.title',
      descriptionKey: 'catalog.rules.wcag_224_interruptions.description',
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
      titleKey: 'catalog.rules.wcag_325_change_on_request.title',
      descriptionKey: 'catalog.rules.wcag_325_change_on_request.description',
      title: 'Change on Request',
      description:
        "Rollup of checks ensuring context changes only happen at the user's request (AAA).",
      wcagSc: ['3.2.5'],
      level: 'AAA'
    }
  },

  {
    id: 'wcag-4.1.1-parsing',
    checksIds: ['duplicate-id'],
    meta: {
      titleKey: 'catalog.rules.wcag_411_parsing.title',
      descriptionKey: 'catalog.rules.wcag_411_parsing.description',
      title: 'Parsing',
      description:
        'Rollup of checks ensuring id values are unique. WCAG 2.0/2.1 only: SC 4.1.1 was removed in WCAG 2.2, so this composite carries the wcag22-removed tag.',
      wcagSc: ['4.1.1'],
      level: 'A'
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
      'identical-iframes-same-purpose',
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
      titleKey: 'catalog.rules.wcag_412_name.title',
      descriptionKey: 'catalog.rules.wcag_412_name.description',
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
      'duplicate-id-aria',
      'nested-interactive-controls-absent',
      'presentational-children-focusable-absent',
      'aria-braille-equivalent',
      'aria-conditional-attr',
      'aria-checked-state-mismatch'
    ],
    meta: {
      titleKey: 'catalog.rules.wcag_412_aria_validity.title',
      descriptionKey: 'catalog.rules.wcag_412_aria_validity.description',
      title: 'Name, role, value: ARIA validity',
      description:
        'Rollup of checks that ARIA role and attribute usage conforms to the WAI-ARIA specification (valid roles, valid attributes, valid values, required attributes, unique ARIA-referenced ids).',
      wcagSc: ['4.1.2'],
      level: 'A'
    }
  },

  {
    id: 'wcag-1.4.4-resize-text',
    checksIds: ['meta-viewport-zoom-enabled'],
    meta: {
      titleKey: 'catalog.rules.wcag_144_resize_text.title',
      descriptionKey: 'catalog.rules.wcag_144_resize_text.description',
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
      titleKey: 'catalog.rules.wcag_221_timing_adjustable.title',
      descriptionKey: 'catalog.rules.wcag_221_timing_adjustable.description',
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
      titleKey: 'catalog.rules.wcag_332_labels_or_instructions.title',
      descriptionKey: 'catalog.rules.wcag_332_labels_or_instructions.description',
      title: 'Labels or Instructions',
      description: 'Rollup of checks ensuring form controls have unambiguous labeling.',
      wcagSc: ['3.3.2'],
      level: 'A'
    }
  },

  {
    id: 'wcag-3.3.8-accessible-authentication-minimum',
    checksIds: ['password-paste-enabled'],
    meta: {
      titleKey: 'catalog.rules.wcag_338_accessible_authentication_minimum.title',
      descriptionKey: 'catalog.rules.wcag_338_accessible_authentication_minimum.description',
      title: 'Accessible Authentication (Minimum)',
      description:
        'Rollup of checks ensuring an authentication step leaves the mechanisms that help a user through it in place.',
      wcagSc: ['3.3.8'],
      level: 'AA'
    }
  }
];
