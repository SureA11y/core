/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * How a person assesses each criterion by hand: the one source of the steps
 * core gives, keyed by criterion and facet.
 *
 * WHAT IS HERE
 * ------------
 * `wcag` is keyed by success criterion, then by facet id, the facets of
 * src/coverage/wcag-facets.js, which give each its label and automation.
 * `best-practice` holds what no criterion requires, keyed by facet id, each
 * with its own label and automation: the steps of rules that claim no
 * criterion, so that they are never read as a criterion's.
 *
 * A facet with a general procedure, how a person assesses it on a whole
 * page, names the `tools` it needs, from TOOLS (an empty list: a browser
 * alone). Its text is in the procedures under
 * `<group>_<criterion>_<facet>_step<n>`, `_pass` and `_fail`
 * (`wcag_1.4.13_hover-content-hoverable_step1`; a best practice has no
 * criterion: `best-practice_<facet>_step1`), and a tool's name under
 * `tool_<id>`.
 *
 * A technology facet, one test a rule makes (`img-alt-attr-present`), has
 * no procedure of its own: `coveredBy` names the facet of the same
 * criterion, broader, whose procedure a person follows to assess it
 * (`text-alternative-mechanism`), so a checklist lists what a person does,
 * once.
 *
 * Under a facet, `variants` lists, by rule id, the reason codes whose steps
 * that rule gives for the element a finding names: how a person answers one
 * of its undecided findings. Each reason code a core rule can report as
 * cantTell is under exactly one facet, the one it tests, and a variant is
 * always what its finding shows, never the facet's general procedure: the
 * two say the same for a page and for one element, and must not contradict
 * each other.
 *
 * THE TEXT
 * --------
 * The words are in src/i18n/procedures/<locale>.json, English and its
 * translations, flat: a variant's under `<prefix>_review_<CODE>_step<n>`,
 * `_pass` and `_fail`, where `<prefix>` is the rule's i18n.titleKey without
 * `_title`, the keys the review dictionaries have always had. The review
 * dictionaries themselves (src/i18n/review/<locale>.json, published as
 * @surea11y/core/review/<locale>) are made from them by
 * scripts/generate-procedures.js; `npm run procedures:check` and the tests
 * fail on a stale one.
 *
 * Like the facets, this is guidance (NON-NORMATIVE): nothing here changes an
 * outcome, and its wording may improve in any release.
 */

// What a procedure may need besides a browser.
const TOOLS = ['keyboard', 'pointer', 'screen-reader', 'zoom', 'contrast-theme', 'devtools'];

const PROCEDURES = {
  wcag: {
    '1.1.1': {
      'text-alternative-mechanism': {
        tools: ['devtools']
      },
      'functional-nontext-name': {
        tools: ['devtools']
      },
      'decorative-null': {
        tools: ['devtools']
      },
      'text-alt-quality-review': {
        coveredBy: 'text-alternative-quality'
      },
      'text-alternative-quality': {
        tools: ['devtools'],
        variants: {
          'area-alt-quality': ['TEXT_ALTERNATIVE_REVIEW'],
          'canvas-text-alternative-quality': ['TEXT_ALTERNATIVE_REVIEW'],
          'embed-text-alternative-quality': ['TEXT_ALTERNATIVE_REVIEW'],
          'img-alt-decorative': ['EXCLUDED_ELEMENT_REVIEW', 'IMAGE_ONLY_CONTROL_CONTENT'],
          'img-alt-quality': ['IMAGE_ONLY_CONTROL_CONTENT', 'TEXT_ALTERNATIVE_REVIEW'],
          'input-image-alt-decorative': ['NAME_FROM_ELSEWHERE_REVIEW'],
          'input-image-alt-quality': ['TEXT_ALTERNATIVE_REVIEW'],
          'object-text-alternative-quality': ['TEXT_ALTERNATIVE_REVIEW'],
          'svg-text-alternative-quality': ['IMAGE_ONLY_CONTROL_CONTENT', 'TEXT_ALTERNATIVE_REVIEW']
        }
      },
      'img-alt-attr-present': {
        coveredBy: 'text-alternative-mechanism'
      },
      'role-img-text-alternative-present': {
        coveredBy: 'text-alternative-mechanism',
        variants: {
          'role-img-text-alternative-present': ['name_internals']
        }
      },
      'input-image-alt-attr-present': {
        coveredBy: 'functional-nontext-name',
        variants: {
          'input-image-alt-present': ['default_name']
        }
      },
      'area-alt-attr-present': {
        coveredBy: 'functional-nontext-name'
      },
      'canvas-text-alternative-present': {
        coveredBy: 'text-alternative-mechanism'
      },
      'embed-text-alternative-present': {
        coveredBy: 'text-alternative-mechanism'
      },
      'svg-text-alt-present': {
        coveredBy: 'text-alternative-mechanism'
      },
      'svg-text-alternative-present': {
        coveredBy: 'text-alternative-mechanism'
      },
      'svg-image-text-alt-present': {
        coveredBy: 'text-alternative-mechanism'
      },
      'object-text-alternative-present': {
        coveredBy: 'text-alternative-mechanism'
      },
      'embed-name-present': {
        coveredBy: 'text-alternative-mechanism'
      },
      'video-poster-text-alt-present': {
        coveredBy: 'text-alternative-mechanism',
        variants: {
          'video-poster-text-alternative-present': ['VIDEO_POSTER_FIGCAPTION_REVIEW']
        }
      },
      'alt-suspicious-patterns': {
        coveredBy: 'text-alternative-quality'
      },
      'acc-eligibility-filtering': {
        coveredBy: 'decorative-null'
      },
      'meter-name-present': {
        coveredBy: 'text-alternative-mechanism',
        variants: {
          'meter-name-present': ['name_internals']
        }
      },
      'progressbar-name-present': {
        coveredBy: 'text-alternative-mechanism',
        variants: {
          'progressbar-name-present': ['name_internals']
        }
      },
      'captcha-alternative': {
        tools: ['screen-reader']
      }
    },
    '1.2.1': {
      'transcript-evidence': {
        tools: [],
        variants: {
          'media-alternative-transcript-evidence': [
            'transcriptNotDetected',
            'transcriptEvidenceUnverified'
          ]
        }
      }
    },
    '1.2.2': {
      'video-captions-track-evidence': {
        tools: [],
        variants: {
          'video-caption': [
            'CAPTIONS_REVIEW',
            'CAPTIONS_TRACK_NOT_DETECTED',
            'SUBTITLES_TRACK_ONLY'
          ]
        }
      },
      'captions-complete': {
        tools: []
      }
    },
    '1.2.3': {
      'audio-description-or-alternative': {
        tools: []
      }
    },
    '1.2.4': {
      'live-captions': {
        tools: []
      }
    },
    '1.2.5': {
      'audio-description': {
        tools: []
      }
    },
    '1.2.6': {
      'sign-language': {
        tools: []
      }
    },
    '1.2.7': {
      'extended-audio-description': {
        tools: []
      }
    },
    '1.2.8': {
      'media-text-alternative': {
        tools: []
      }
    },
    '1.2.9': {
      'live-audio-alternative': {
        tools: []
      }
    },
    '1.3.1': {
      'form-control-programmatic-label-present': {
        coveredBy: 'form-labels-associated'
      },
      'form-control-label-quality-review': {
        coveredBy: 'form-labels-associated'
      },
      'table-headers-attr-valid': {
        coveredBy: 'tables-marked-up'
      },
      'table-th-has-data-cells': {
        coveredBy: 'tables-marked-up',
        variants: {
          'table-th-has-data-cells': ['TABLE_TH_NO_ASSIGNED_CELL']
        }
      },
      'aria-hidden-body-absent': {
        coveredBy: 'aria-structure-valid'
      },
      'list-children-valid': {
        coveredBy: 'lists-marked-up'
      },
      'listitem-parent-valid': {
        coveredBy: 'lists-marked-up'
      },
      'definition-list-children-valid': {
        coveredBy: 'lists-marked-up'
      },
      'dlitem-parent-valid': {
        coveredBy: 'lists-marked-up'
      },
      'aria-role-required-owned-children': {
        coveredBy: 'aria-structure-valid',
        variants: {
          'aria-required-children': ['ARIA_REQUIRED_CHILD_MISSING']
        }
      },
      'aria-role-owned-children-allowed': {
        coveredBy: 'aria-structure-valid'
      },
      'aria-role-required-context-parent': {
        coveredBy: 'aria-structure-valid'
      },
      'p-as-heading-evidence': {
        coveredBy: 'headings-marked-up',
        variants: {
          'p-as-heading': [
            'BOLD_LARGE_DIV',
            'BOLD_LARGE_PARAGRAPH',
            'HEADING_LIKE_LINK',
            'HEADING_LIKE_NUMBER'
          ]
        }
      },
      'table-fake-caption-evidence': {
        coveredBy: 'tables-marked-up',
        variants: {
          'table-fake-caption': ['SINGLE_CELL_FIRST_ROW_NO_CAPTION']
        }
      },
      'td-has-header': {
        coveredBy: 'tables-marked-up',
        variants: {
          'td-has-header': ['TD_TABLE_NO_HEADERS']
        }
      },
      'aria-role-valid': {
        coveredBy: 'aria-structure-valid'
      },
      'aria-owns-valid': {
        coveredBy: 'aria-structure-valid'
      },
      'headings-marked-up': {
        tools: ['devtools', 'screen-reader']
      },
      'lists-marked-up': {
        tools: ['devtools']
      },
      'tables-marked-up': {
        tools: ['devtools', 'screen-reader']
      },
      'form-labels-associated': {
        tools: ['devtools', 'screen-reader']
      },
      'aria-structure-valid': {
        tools: ['devtools']
      },
      'visual-cues-conveyed': {
        tools: ['devtools', 'screen-reader']
      }
    },
    '1.3.2': {
      'reading-order-meaningful': {
        tools: ['screen-reader', 'devtools']
      }
    },
    '1.3.3': {
      'instructions-not-sensory-only': {
        tools: []
      }
    },
    '1.3.4': {
      'css-orientation-lock': {
        coveredBy: 'orientation-not-locked',
        variants: {
          'css-orientation-lock': [
            'ORIENTATION_MEDIA_HIDES_CONTENT',
            'ORIENTATION_MEDIA_ROTATES_ELEMENT',
            'STYLESHEETS_NOT_READABLE'
          ]
        }
      },
      'orientation-not-locked': {
        tools: ['devtools']
      }
    },
    '1.3.5': {
      'autocomplete-valid': {
        coveredBy: 'input-purpose-identified'
      },
      'input-purpose-identified': {
        tools: ['devtools']
      }
    },
    '1.3.6': {
      'purpose-identified': {
        tools: ['devtools']
      }
    },
    '1.4.1': {
      'link-in-text-block': {
        coveredBy: 'color-not-only-means',
        variants: {
          'link-in-text-block': [
            'ANCESTOR_OPACITY',
            'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
            'BACKGROUND_IMAGE_OR_GRADIENT',
            'BACKGROUND_NOT_OPAQUE_AT_ROOT',
            'BACKGROUND_OVERLAP',
            'COLOR_NOT_COMPUTABLE',
            'CONTRAST_HELPERS_UNAVAILABLE',
            'ELEMENT_OPACITY',
            'ENGINE_EXCEPTION',
            'LINK_COLOR_CONTRAST_ONLY',
            'MIX_BLEND_MODE',
            'PSEUDO_ELEMENT_COLOR',
            'SELECT_OPTION_COLOR',
            'TEXT_DECORATION_NOT_RESOLVABLE',
            'TEXT_SHADOW',
            'TEXT_STROKE'
          ]
        }
      },
      'color-not-only-means': {
        tools: ['devtools']
      }
    },
    '1.4.2': {
      'no-autoplay-audio-evidence': {
        tools: ['keyboard'],
        variants: {
          'no-autoplay-audio': [
            'AUTOPLAY_CONTROLS_HIDDEN',
            'AUTOPLAY_NO_CONTROLS_MECHANISM',
            'EMBEDDED_SOUND_SOURCE'
          ]
        }
      }
    },
    '1.4.3': {
      'contrast-computability-143': {
        coveredBy: 'contrast-minimum-text',
        variants: {
          'contrast-computable': [
            'ANCESTOR_OPACITY',
            'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
            'BACKGROUND_IMAGE_OR_GRADIENT',
            'BACKGROUND_NOT_COMPUTABLE',
            'BACKGROUND_NOT_OPAQUE_AT_ROOT',
            'BACKGROUND_OVERLAP',
            'BACKGROUND_UNPARSABLE',
            'COLOR_SCHEME_NOT_RENDERED',
            'ELEMENT_OPACITY',
            'ENGINE_EXCEPTION',
            'FOREGROUND_UNPARSABLE',
            'GENERATED_TEXT_POSITIONED',
            'GENERATED_TEXT_UNREADABLE',
            'MIX_BLEND_MODE',
            'PSEUDO_ELEMENT_COLOR',
            'SELECT_OPTION_COLOR',
            'TEXT_SHADOW',
            'TEXT_STROKE'
          ]
        }
      },
      'contrast-minimum-text': {
        tools: ['devtools'],
        variants: {
          'contrast-minimum': [
            'CONTRAST_SWITCH_OFFERED',
            'ENGINE_EXCEPTION',
            'LOGO_TEXT_BELOW_THRESHOLD',
            'PLACEHOLDER_BELOW_THRESHOLD',
            'PSEUDO_ELEMENT_COLOR',
            'SEMIBOLD_BELOW_THRESHOLD',
            'SYMBOLIC_CHARACTER_BELOW_THRESHOLD',
            'TEXT_SHADOW',
            'TEXT_STROKE'
          ]
        }
      }
    },
    '1.4.4': {
      'meta-viewport-zoom-enabled': {
        coveredBy: 'text-resizes-200',
        variants: {
          'meta-viewport-zoom-enabled': ['VIEWPORT_ZOOM_RESTRICTED_OVERRIDDEN']
        }
      },
      'text-resizes-200': {
        tools: ['zoom']
      }
    },
    '1.4.5': {
      'image-of-text-evidence': {
        coveredBy: 'text-not-as-image',
        variants: {
          'image-of-text': ['IMAGE_BUTTON_TEXT_REVIEW', 'SVG_IMAGE_TEXT_REVIEW']
        }
      },
      'text-not-as-image': {
        tools: ['devtools']
      }
    },
    '1.4.6': {
      'contrast-computability-146': {
        coveredBy: 'contrast-enhanced-text'
      },
      'contrast-enhanced-text': {
        tools: ['devtools'],
        variants: {
          'contrast-enhanced': [
            'CONTRAST_UNREACHABLE_ANY_BACKGROUND',
            'ENGINE_EXCEPTION',
            'PLACEHOLDER_BELOW_THRESHOLD',
            'SYMBOLIC_CHARACTER_BELOW_THRESHOLD'
          ]
        }
      }
    },
    '1.4.7': {
      'background-audio-low': {
        tools: []
      }
    },
    '1.4.8': {
      'visual-presentation': {
        tools: ['zoom', 'contrast-theme']
      }
    },
    '1.4.9': {
      'no-images-of-text': {
        tools: ['devtools']
      }
    },
    '1.4.10': {
      'reflow-320': {
        tools: ['devtools', 'zoom']
      }
    },
    '1.4.11': {
      'ui-component-contrast': {
        tools: ['devtools', 'keyboard']
      },
      'graphics-contrast': {
        tools: ['devtools']
      }
    },
    '1.4.12': {
      'avoid-inline-spacing': {
        tools: ['devtools'],
        variants: {
          'avoid-inline-spacing': [
            'INLINE_SPACING_NOT_RESOLVABLE',
            'INLINE_SPACING_NO_SOFT_WRAP',
            'INLINE_SPACING_SHORT_TEXT'
          ]
        }
      },
      'text-spacing-content-loss': {
        tools: ['devtools', 'keyboard'],
        variants: {
          'text-spacing-content-loss': [
            'SPACING_NOT_APPLIED',
            'STYLESHEET_IMPORTANT',
            'TEXT_CLIPPED_FURTHER',
            'TEXT_CLIPPED_MOVING',
            'TEXT_CLIPPED_SCRIPT_SIZED',
            'TEXT_CLIPPED_PARTLY',
            'TEXT_OVERLAPS',
            'VIEWPORT_SCROLL_LOCKED'
          ]
        }
      },
      'text-spacing-functionality-kept': {
        tools: ['devtools', 'keyboard', 'pointer']
      },
      'text-spacing-other-states': {
        tools: ['devtools', 'keyboard', 'pointer']
      }
    },
    '1.4.13': {
      'hover-focus-content-dismissible': {
        tools: ['pointer', 'keyboard']
      },
      'hover-content-hoverable': {
        tools: ['pointer']
      },
      'hover-focus-content-persistent': {
        tools: ['pointer', 'keyboard']
      }
    },
    '2.1.1': {
      'iframe-tabindex-negative-content-not-focusable': {
        coveredBy: 'keyboard-operable-all-functionality',
        variants: {
          'iframe-focusable-content': ['IFRAME_TABINDEX_NEGATIVE_CONTENT_RUNTIME_REDIRECT']
        }
      },
      'server-side-image-map-absent': {
        coveredBy: 'keyboard-operable-all-functionality',
        variants: {
          'server-side-image-map-absent': ['SERVER_SIDE_IMAGE_MAP']
        }
      },
      'scrollable-region-focusable-evidence': {
        coveredBy: 'keyboard-operable-all-functionality',
        variants: {
          'scrollable-region-focusable': ['SCROLLABLE_OVERFLOW_NOT_FOCUSABLE']
        }
      },
      'mouse-only-event-handlers-evidence': {
        coveredBy: 'keyboard-operable-all-functionality',
        variants: {
          'mouse-only-event-handlers': [
            'MOUSE_ONLY_HANDLER_KEYBOARD_EQUIVALENT_NOT_FOCUSABLE',
            'MOUSE_ONLY_HANDLER_NO_KEYBOARD_EQUIVALENT'
          ]
        }
      },
      'click-handler-keyboard-operable': {
        coveredBy: 'keyboard-operable-all-functionality',
        variants: {
          'click-handler-keyboard-operable': [
            'CLICK_HANDLER_FOCUS_LISTENER',
            'CLICK_HANDLER_KEY_LISTENER_ABOVE',
            'CLICK_HANDLER_NOT_FOCUSABLE',
            'CLICK_HANDLER_NOT_IN_TAB_ORDER',
            'CLICK_HANDLER_NO_KEY_HANDLER'
          ]
        }
      },
      'widget-keyboard-focusable-evidence': {
        coveredBy: 'keyboard-operable-all-functionality',
        variants: {
          'widget-keyboard-focusable': [
            'ACTIVEDESCENDANT_HOST_NOT_FOCUSABLE',
            'COMPOSITE_NO_TAB_STOP',
            'WIDGET_NOT_FOCUSABLE',
            'WIDGET_NOT_IN_TAB_ORDER'
          ]
        }
      },
      'focus-not-removed-by-script-evidence': {
        coveredBy: 'keyboard-operable-all-functionality',
        variants: {
          'focus-not-removed-by-script': [
            'FOCUS_HANDLER_BLURS_SELF',
            'FOCUS_HANDLER_CALLS_BLUR',
            'FOCUS_HANDLER_MOVES_FOCUS'
          ]
        }
      },
      'keyboard-operable-all-functionality': {
        tools: ['keyboard'],
        variants: {
          'manual-review': ['KEYBOARD_REVIEW']
        }
      }
    },
    '2.1.2': {
      'no-keyboard-trap': {
        tools: ['keyboard']
      }
    },
    '2.1.3': {
      'scrollable-region-focusable-evidence': {
        coveredBy: 'keyboard-no-exception'
      },
      'mouse-only-event-handlers-evidence': {
        coveredBy: 'keyboard-no-exception'
      },
      'click-handler-keyboard-operable': {
        coveredBy: 'keyboard-no-exception'
      },
      'keyboard-no-exception': {
        tools: ['keyboard']
      }
    },
    '2.1.4': {
      'character-key-shortcuts': {
        tools: ['keyboard']
      }
    },
    '2.2.1': {
      'meta-refresh-timing-absent': {
        coveredBy: 'time-limits-adjustable'
      },
      'time-limits-adjustable': {
        tools: []
      }
    },
    '2.2.2': {
      'deprecated-non-stoppable-elements-absent': {
        coveredBy: 'auto-moving-content-pausable',
        variants: {
          'deprecated-elements-not-used': ['MARQUEE_PAUSE_MECHANISM_UNKNOWN']
        }
      },
      'auto-moving-content-pausable': {
        tools: ['keyboard'],
        variants: {
          'moving-content-pausable': ['MOVING_CONTENT_LOOPS', 'MOVING_CONTENT_OVER_5S']
        }
      },
      'auto-updating-content-controllable': {
        tools: ['keyboard']
      }
    },
    '2.2.3': {
      'no-timing': {
        tools: []
      }
    },
    '2.2.4': {
      'meta-refresh-no-exceptions': {
        coveredBy: 'interruptions-postponable'
      },
      'meta-refresh-timing-absent': {
        coveredBy: 'interruptions-postponable'
      },
      'interruptions-postponable': {
        tools: []
      }
    },
    '2.2.5': {
      'reauthentication-keeps-data': {
        tools: []
      }
    },
    '2.2.6': {
      'timeout-warning': {
        tools: []
      }
    },
    '2.3.1': {
      'flashing-below-threshold': {
        tools: []
      }
    },
    '2.3.2': {
      'no-flashing': {
        tools: []
      }
    },
    '2.3.3': {
      'motion-animation-disableable': {
        tools: ['devtools']
      }
    },
    '2.4.1': {
      'bypass-blocks-present': {
        tools: ['keyboard', 'screen-reader', 'devtools'],
        variants: {
          'bypass-blocks-present': ['BYPASS_MECHANISM_ABSENT']
        }
      }
    },
    '2.4.2': {
      'page-title-present': {
        coveredBy: 'page-title-descriptive'
      },
      'page-title-patterns': {
        coveredBy: 'page-title-descriptive',
        variants: {
          'page-title-patterns': [
            'genericTitle',
            'veryShortTitle',
            'templateLikeTitle',
            'duplicateTitlesAcrossPages',
            'templatedTitlesAcrossPages',
            'titleReview'
          ]
        }
      },
      'page-title-descriptive': {
        tools: []
      }
    },
    '2.4.3': {
      'focus-order-preserves-meaning': {
        tools: ['keyboard']
      },
      'focus-order-opened-content': {
        tools: ['keyboard']
      },
      'focus-order-no-hidden-stops': {
        tools: ['keyboard', 'devtools']
      }
    },
    '2.4.4': {
      'link-name-present': {
        coveredBy: 'link-purpose-clear',
        variants: {
          'link-name-present': ['name_closedContent', 'name_contentTooDeep', 'name_internals']
        }
      },
      'link-text-descriptive-evidence': {
        coveredBy: 'link-purpose-clear',
        variants: {
          'link-name-quality': ['AMBIGUOUS_FORMAT_NAME', 'GENERIC_LINK_TEXT']
        }
      },
      'link-purpose-clear': {
        tools: ['devtools', 'screen-reader']
      }
    },
    '2.4.5': {
      'multiple-ways': {
        tools: []
      }
    },
    '2.4.6': {
      'heading-text-descriptive-evidence': {
        tools: ['screen-reader'],
        variants: {
          'heading-quality': [
            'FILENAME_LIKE_HEADING',
            'PLACEHOLDER_HEADING_TEXT',
            'URL_LIKE_HEADING'
          ]
        }
      },
      'form-control-label-descriptive-evidence': {
        tools: [],
        variants: {
          'form-control-label-quality': [
            'DUPLICATE_LABEL_TEXT',
            'PARTIALLY_HIDDEN_LABEL',
            'PLACEHOLDER_LABEL_TEXT'
          ]
        }
      }
    },
    '2.4.7': {
      'css-hidden-focusable': {
        coveredBy: 'focus-indicator-visible',
        variants: {
          'css-hidden-focus': [
            'cssHiddenTabbable_needsFocusStateVerification',
            'cssHiddenTabbable_runtimeRedirect_needsReview'
          ]
        }
      },
      'focus-indicator-not-suppressed': {
        coveredBy: 'focus-indicator-visible',
        variants: {
          'css-focus-indicator-suppressed': ['FOCUS_INDICATOR_SUPPRESSED']
        }
      },
      'focus-not-removed-by-script-evidence': {
        coveredBy: 'focus-indicator-visible'
      },
      'focus-indicator-visible': {
        tools: ['keyboard']
      }
    },
    '2.4.8': {
      'location-shown': {
        tools: []
      }
    },
    '2.4.9': {
      'identical-links-same-purpose-evidence': {
        coveredBy: 'link-text-alone-clear',
        variants: {
          'identical-links-same-purpose': ['SAME_NAME_DIFFERENT_DESTINATION']
        }
      },
      'link-name-present': {
        coveredBy: 'link-text-alone-clear'
      },
      'link-text-alone-clear': {
        tools: ['devtools', 'screen-reader']
      }
    },
    '2.4.10': {
      'section-headings': {
        tools: ['screen-reader']
      }
    },
    '2.4.11': {
      'focus-not-obscured': {
        tools: ['keyboard']
      }
    },
    '2.4.12': {
      'focus-fully-visible': {
        tools: ['keyboard']
      }
    },
    '2.4.13': {
      'focus-appearance': {
        tools: ['keyboard', 'devtools']
      }
    },
    '2.5.1': {
      'single-pointer-alternative': {
        tools: ['pointer']
      }
    },
    '2.5.2': {
      'pointer-cancellation': {
        tools: ['pointer']
      }
    },
    '2.5.3': {
      'label-in-name': {
        tools: ['devtools'],
        variants: {
          'label-in-name': [
            'HYPHENATION_DIFFERS',
            'POSSIBLE_ABBREVIATION',
            'POSSIBLE_ICON_FONT_GLYPH',
            'POSSIBLE_SYMBOLIC_CHARACTER'
          ]
        }
      }
    },
    '2.5.4': {
      'motion-actuation': {
        tools: []
      }
    },
    '2.5.5': {
      'target-size-enhanced': {
        tools: ['devtools']
      }
    },
    '2.5.6': {
      'concurrent-input': {
        tools: ['keyboard', 'pointer']
      }
    },
    '2.5.7': {
      'dragging-alternative': {
        tools: ['pointer']
      }
    },
    '2.5.8': {
      'target-size-minimum-pointer': {
        tools: ['devtools']
      }
    },
    '3.1.1': {
      'html-lang-attr-present': {
        coveredBy: 'page-language-correct'
      },
      'html-xml-lang-mismatch': {
        coveredBy: 'page-language-correct'
      },
      'page-language-correct': {
        tools: ['devtools']
      }
    },
    '3.1.2': {
      'element-lang-valid': {
        coveredBy: 'parts-language-marked'
      },
      'parts-language-marked': {
        tools: ['devtools', 'screen-reader']
      }
    },
    '3.1.3': {
      'unusual-words-defined': {
        tools: []
      }
    },
    '3.1.4': {
      'abbreviations-expanded': {
        tools: []
      }
    },
    '3.1.5': {
      'reading-level': {
        tools: []
      }
    },
    '3.1.6': {
      'pronunciation-given': {
        tools: []
      }
    },
    '3.2.1': {
      'focus-no-change-of-context': {
        tools: ['keyboard']
      }
    },
    '3.2.2': {
      'input-no-unexpected-change': {
        tools: ['keyboard']
      }
    },
    '3.2.3': {
      'navigation-consistent': {
        tools: []
      }
    },
    '3.2.4': {
      'identification-consistent': {
        tools: ['devtools']
      }
    },
    '3.2.5': {
      'meta-refresh-no-exceptions': {
        coveredBy: 'changes-on-request'
      },
      'meta-refresh-timing-absent': {
        coveredBy: 'changes-on-request'
      },
      'changes-on-request': {
        tools: ['keyboard']
      }
    },
    '3.2.6': {
      'help-consistent': {
        tools: []
      }
    },
    '3.3.1': {
      'invalid-field-error-message': {
        coveredBy: 'errors-identified',
        variants: {
          'invalid-field-error-message': [
            'ERROR_MESSAGE_ARIA_HIDDEN',
            'ERROR_MESSAGE_EMPTY',
            'ERROR_MESSAGE_HIDDEN',
            'ERROR_MESSAGE_NOT_SHOWN_DESCRIBED',
            'ERROR_MESSAGE_TARGET_MISSING',
            'NO_ERROR_MESSAGE'
          ]
        }
      },
      'errors-identified': {
        tools: ['keyboard', 'screen-reader']
      }
    },
    '3.3.2': {
      'form-control-labels-or-instructions-present': {
        coveredBy: 'labels-instructions-provided'
      },
      'form-control-single-label': {
        coveredBy: 'labels-instructions-provided',
        variants: {
          'form-control-single-label': [
            'FORM_FIELD_EXTRA_EMPTY_LABEL',
            'FORM_FIELD_MULTIPLE_LABELS'
          ]
        }
      },
      'form-control-visible-label-quality': {
        coveredBy: 'labels-instructions-provided',
        variants: {
          'form-control-programmatic-label-quality': [
            'label_from_aria_label_only',
            'label_from_hidden_labelledby',
            'label_from_placeholder_primary',
            'label_from_title_primary'
          ]
        }
      },
      'labels-instructions-provided': {
        tools: ['devtools']
      }
    },
    '3.3.3': {
      'error-suggestions': {
        tools: []
      }
    },
    '3.3.4': {
      'submission-reversible-checked-confirmed': {
        tools: []
      }
    },
    '3.3.5': {
      'context-help': {
        tools: []
      }
    },
    '3.3.6': {
      'all-submissions-reversible-checked-confirmed': {
        tools: []
      }
    },
    '3.3.7': {
      'redundant-entry': {
        tools: []
      }
    },
    '3.3.8': {
      'authentication-paste-not-blocked': {
        coveredBy: 'authentication-no-cognitive-test',
        variants: {
          'password-paste-enabled': ['PASTE_CANCELLED', 'PASTE_HANDLER_OPAQUE']
        }
      },
      'authentication-no-cognitive-test': {
        tools: []
      }
    },
    '3.3.9': {
      'authentication-no-recognition-test': {
        tools: []
      }
    },
    '4.1.1': {
      'id-unique-page-wide': {
        tools: ['devtools'],
        variants: {
          'duplicate-id': ['DUPLICATE_ID', 'DUPLICATE_ID_IN_SHADOW_TREE']
        }
      }
    },
    '4.1.2': {
      'form-control-name-present': {
        coveredBy: 'components-named'
      },
      'aria-hidden-focusable': {
        coveredBy: 'aria-used-validly',
        variants: {
          'aria-hidden-focus': [
            'ariaHiddenFocusable_modalOpen_needsReview',
            'ariaHiddenFocusable_runtimeRedirect_needsReview'
          ]
        }
      },
      'link-name-present': {
        coveredBy: 'components-named'
      },
      'button-name-present': {
        coveredBy: 'components-named',
        variants: {
          'button-name-present': ['name_closedContent', 'name_contentTooDeep', 'name_internals']
        }
      },
      'input-image-name-present': {
        coveredBy: 'components-named'
      },
      'checkbox-name-present': {
        coveredBy: 'components-named',
        variants: {
          'binary-control-name-present': ['name_internals']
        }
      },
      'radio-name-present': {
        coveredBy: 'components-named'
      },
      'switch-name-present': {
        coveredBy: 'components-named'
      },
      'combobox-name-present': {
        coveredBy: 'components-named',
        variants: {
          'combobox-name-present': ['name_internals']
        }
      },
      'dialog-name-present': {
        coveredBy: 'components-named',
        variants: {
          'dialog-name-present': ['name_internals']
        }
      },
      'menuitem-name-present': {
        coveredBy: 'components-named',
        variants: {
          'menuitem-name-present': ['name_closedContent', 'name_contentTooDeep', 'name_internals']
        }
      },
      'tab-name-present': {
        coveredBy: 'components-named',
        variants: {
          'tab-name-present': ['name_closedContent', 'name_contentTooDeep', 'name_internals']
        }
      },
      'slider-name-present': {
        coveredBy: 'components-named',
        variants: {
          'slider-name-present': ['name_internals']
        }
      },
      'textbox-name-present': {
        coveredBy: 'components-named',
        variants: {
          'textbox-name-present': ['name_internals']
        }
      },
      'searchbox-name-present': {
        coveredBy: 'components-named',
        variants: {
          'searchbox-name-present': ['name_internals']
        }
      },
      'spinbutton-name-present': {
        coveredBy: 'components-named',
        variants: {
          'spinbutton-name-present': ['name_internals']
        }
      },
      'listbox-name-present': {
        coveredBy: 'components-named',
        variants: {
          'listbox-name-present': ['name_internals']
        }
      },
      'option-name-present': {
        coveredBy: 'components-named',
        variants: {
          'option-name-present': ['name_closedContent', 'name_contentTooDeep', 'name_internals']
        }
      },
      'treeitem-name-present': {
        coveredBy: 'components-named',
        variants: {
          'treeitem-name-present': ['name_closedContent', 'name_contentTooDeep', 'name_internals']
        }
      },
      'aria-role-name-present': {
        coveredBy: 'components-named',
        variants: {
          'aria-role-name-present': ['name_internals']
        }
      },
      'aria-role-valid': {
        coveredBy: 'roles-match-behavior',
        variants: {
          'aria-roles-valid': ['ARIA_ROLE_ABSTRACT', 'ARIA_ROLE_INVALID']
        }
      },
      'aria-role-not-deprecated': {
        coveredBy: 'roles-match-behavior',
        variants: {
          'aria-deprecated-role': ['ARIA_ROLE_AUTHOR_DISCOURAGED', 'ARIA_ROLE_DEPRECATED']
        }
      },
      'aria-attr-name-valid': {
        coveredBy: 'aria-used-validly',
        variants: {
          'aria-valid-attr': ['ARIA_ATTR_INVALID']
        }
      },
      'aria-attr-value-valid': {
        coveredBy: 'aria-used-validly',
        variants: {
          'aria-valid-attr-value': [
            'ARIA_ACTIVEDESCENDANT_OUTSIDE',
            'ARIA_ATTR_VALUE_TARGET_ABSENT',
            'ARIA_HASPOPUP_ROLE_MISMATCH'
          ]
        }
      },
      'aria-attr-allowed-for-role': {
        coveredBy: 'aria-used-validly',
        variants: {
          'aria-allowed-attr': ['ARIA_ATTR_DEPRECATED']
        }
      },
      'aria-attr-not-prohibited': {
        coveredBy: 'aria-used-validly',
        variants: {
          'aria-prohibited-attr': ['ARIA_ATTR_PROHIBITED_ROLELESS_NEEDS_REVIEW']
        }
      },
      'aria-attr-required-for-role': {
        coveredBy: 'states-values-exposed',
        variants: {
          'aria-required-attr': ['ARIA_ATTR_REQUIRED_MISSING_IMPLICIT', 'state_internals']
        }
      },
      'iframe-name-present': {
        coveredBy: 'components-named'
      },
      'identical-iframes-same-purpose': {
        coveredBy: 'components-named',
        variants: {
          'identical-iframes-same-purpose': [
            'IFRAME_RESOURCE_DIFFERS',
            'IFRAME_RESOURCE_UNRESOLVED'
          ]
        }
      },
      'aria-hidden-body-absent': {
        coveredBy: 'aria-used-validly'
      },
      'duplicate-id-aria': {
        coveredBy: 'aria-used-validly',
        variants: {
          'duplicate-id-aria': ['DUPLICATE_ID_ARIA_REFERENCED']
        }
      },
      'summary-name-present': {
        coveredBy: 'components-named',
        variants: {
          'summary-name-present': ['name_closedContent', 'name_contentTooDeep']
        }
      },
      'tooltip-name-present': {
        coveredBy: 'components-named',
        variants: {
          'tooltip-name-present': ['name_closedContent', 'name_contentTooDeep', 'name_internals']
        }
      },
      'nested-interactive-controls-absent': {
        coveredBy: 'roles-match-behavior'
      },
      'presentational-children-focusable-absent': {
        coveredBy: 'roles-match-behavior'
      },
      'aria-braille-equivalent': {
        coveredBy: 'components-named',
        variants: {
          'aria-braille-equivalent': ['BRAILLE_ATTR_WITHOUT_EQUIVALENT']
        }
      },
      'aria-conditional-attr': {
        coveredBy: 'states-values-exposed',
        variants: {
          'aria-conditional-attr': ['ARIA_ERRORMESSAGE_WITHOUT_TRUTHY_INVALID']
        }
      },
      'aria-checked-state-mismatch': {
        coveredBy: 'states-values-exposed',
        variants: {
          'aria-checked-state-mismatch': ['ARIA_CHECKED_STATE_MISMATCH']
        }
      },
      'aria-expanded-state-mismatch': {
        coveredBy: 'states-values-exposed',
        variants: {
          'aria-expanded-state-mismatch': [
            'EXPANDED_FALSE_CONTROLLED_SHOWN',
            'EXPANDED_TRUE_CONTROLLED_HIDDEN'
          ]
        }
      },
      'aria-owns-valid': {
        coveredBy: 'roles-match-behavior'
      },
      'components-named': {
        tools: ['devtools', 'screen-reader']
      },
      'roles-match-behavior': {
        tools: ['devtools', 'screen-reader']
      },
      'states-values-exposed': {
        tools: ['devtools', 'screen-reader', 'keyboard']
      },
      'aria-used-validly': {
        tools: ['devtools']
      }
    },
    '4.1.3': {
      'live-region-reachable-evidence': {
        coveredBy: 'status-messages-announced',
        variants: {
          'live-region-announcements': ['LIVE_REGION_BUSY', 'LIVE_REGION_HIDDEN']
        }
      },
      'live-region-changes-evidence': {
        coveredBy: 'status-messages-announced',
        variants: {
          'live-region-announcements': [
            'LIVE_REGION_INSERTED_WITH_CONTENT',
            'LIVE_REGION_SHOWN_AND_FILLED'
          ]
        }
      },
      'status-messages-announced': {
        tools: ['screen-reader']
      }
    }
  },
  'best-practice': {
    'landmark-structure': {
      label:
        'Landmarks are unique where they should be, at the top level where required, and named',
      automation: 'partial',
      tools: ['screen-reader', 'devtools'],
      variants: {
        'landmark-banner-is-top-level': ['LANDMARK_BANNER_NOT_TOP_LEVEL'],
        'landmark-complementary-is-top-level': ['LANDMARK_COMPLEMENTARY_NOT_TOP_LEVEL'],
        'landmark-contentinfo-is-top-level': ['LANDMARK_CONTENTINFO_NOT_TOP_LEVEL'],
        'landmark-main-is-top-level': ['LANDMARK_MAIN_NOT_TOP_LEVEL'],
        'landmark-no-duplicate-banner': ['LANDMARK_DUPLICATE_BANNER'],
        'landmark-no-duplicate-contentinfo': ['LANDMARK_DUPLICATE_CONTENTINFO'],
        'landmark-no-duplicate-main': ['LANDMARK_DUPLICATE_MAIN'],
        'landmark-one-main': ['LANDMARK_MAIN_MISSING'],
        'landmark-role-name-present': ['LANDMARK_ROLE_NAME_MISSING'],
        'landmark-unique': ['LANDMARK_NOT_UNIQUE']
      }
    },
    'content-in-landmarks': {
      label: 'All content is inside a landmark',
      automation: 'partial',
      tools: ['screen-reader', 'devtools'],
      variants: {
        region: ['CONTENT_OUTSIDE_LANDMARK']
      }
    },
    'heading-structure': {
      label:
        'The page has a main heading, and headings are not empty and go down one level at a time',
      automation: 'partial',
      tools: ['screen-reader', 'devtools'],
      variants: {
        'empty-heading': ['name_closedContent', 'name_contentTooDeep', 'name_internals'],
        'heading-order': ['HEADING_ORDER_SKIPPED_LEVEL'],
        'page-has-heading-one': ['HEADING_ONE_MISSING']
      }
    },
    'table-markup': {
      label: 'Table headers, scope and caption are meaningful',
      automation: 'partial',
      tools: ['screen-reader', 'devtools'],
      variants: {
        'empty-table-header': ['TABLE_HEADER_EMPTY', 'TABLE_HEADER_NAME_NOT_VISIBLE_TEXT'],
        'scope-attr-valid': ['SCOPE_ATTR_INVALID'],
        'table-duplicate-name': ['TABLE_CAPTION_SUMMARY_DUPLICATE']
      }
    },
    'aria-role-usage': {
      label: 'ARIA roles suit the elements they are on',
      automation: 'partial',
      tools: ['screen-reader', 'devtools'],
      variants: {
        'aria-allowed-role': ['ARIA_ROLE_NOT_ALLOWED_FOR_ELEMENT'],
        'aria-text': ['ROLE_TEXT_HAS_FOCUSABLE_DESCENDANT'],
        'presentation-role-conflict': ['PRESENTATION_ROLE_CONFLICT']
      }
    },
    'keyboard-focus-order': {
      label: 'The tab order follows the page and stops only on interactive elements',
      automation: 'partial',
      tools: ['keyboard', 'devtools'],
      variants: {
        'focus-order-semantics': ['TABBABLE_WITH_NON_INTERACTIVE_ROLE'],
        tabindex: ['TABINDEX_POSITIVE']
      }
    },
    'keyboard-shortcuts': {
      label: 'Access keys are unique',
      automation: 'partial',
      tools: ['keyboard', 'devtools'],
      variants: {
        accesskeys: ['ACCESSKEY_DUPLICATE']
      }
    },
    'skip-links': {
      label: 'Skip links lead to a usable target',
      automation: 'partial',
      tools: ['keyboard'],
      variants: {
        'skip-link': ['SKIP_LINK_TARGET_MISSING', 'SKIP_LINK_TARGET_UNUSABLE']
      }
    },
    'names-and-labels': {
      label:
        'Names and labels come from visible text, point at a control and do not repeat nearby text',
      automation: 'partial',
      tools: ['screen-reader', 'devtools'],
      variants: {
        'control-name-title-only': ['NAME_FROM_TITLE_ONLY'],
        'image-redundant-alt': ['IMAGE_ALT_REDUNDANT'],
        'label-for-valid': ['LABEL_FOR_NOT_LABELABLE', 'LABEL_FOR_TARGET_MISSING']
      }
    },
    'viewport-zoom': {
      label: 'The viewport lets the page be zoomed well past 200%',
      automation: 'partial',
      tools: ['zoom', 'devtools'],
      variants: {
        'meta-viewport-large': ['VIEWPORT_ZOOM_BELOW_500']
      }
    }
  }
};

module.exports = { PROCEDURES, TOOLS };
