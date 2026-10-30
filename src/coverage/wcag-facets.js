/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * WCAG coverage facets (NON-NORMATIVE)
 *
 * PURPOSE
 * -------
 * Facets represent common test objectives derived from WCAG
 * Understanding documents and Techniques.
 *
 * Facets:
 * • are NOT requirements
 * • are NOT enforced
 * • MUST NOT affect rule outcomes or policy
 *
 * ALIGNMENT WITH surea11y
 * -----------------------
 * • Referenced from rule meta via meta.coverage.facetsBySc
 * • Stable identifiers once published
 * • Automation levels correspond to expected rule types:
 *     full    → automatic
 *     partial → automatic or manual
 *     manual  → manual-only
 *
 * NOTE
 * ----
 * Facets can be broader than a single atomic rule. Multiple atomic checks may map
 * to the same facet, and a single SC often has multiple facets.
 */

/**
 * MACRO FACETS POLICY (IMPORTANT)
 * -------------------------------
 * This registry includes two kinds of facets:
 *
 * 1) Technology facets (preferred for rule meta)
 *    - Example: "img-alt-attr-present"
 *    - These represent a specific, testable objective for a specific technology/family.
 *    - RULES SHOULD reference these facets in meta.coverage.facetsBySc.
 *
 * 2) Macro facets (coverage-level only; NOT for rule meta by default)
 *    - Examples: "text-alternative-mechanism", "functional-nontext-name"
 *    - These are intentionally broader than any single atomic rule.
 *    - They are used for reporting/coverage aggregation and planning.
 *
 * RULE AUTHORING REQUIREMENT
 * --------------------------
 * Rules MUST NOT claim macro facets unless the rule explicitly implements the full
 * macro objective (i.e., a single atomic rule whose normative expectation matches
 * the macro facet definition without relying on other checks).
 *
 * Why:
 * - Prevents overstating coverage when only one mechanism is checked (e.g., alt only).
 * - Avoids ambiguity as new mechanisms/checks are added later.
 * - Keeps coverage accounting deterministic and traceable.
 *
 * Practical guidance:
 * - If your rule checks one mechanism (e.g., "alt attribute present"), claim only the
 *   corresponding technology facet (e.g., "img-alt-attr-present").
 * - If you need a macro facet to be "satisfied", implement a dedicated rule that
 *   checks that macro condition directly OR compute macro satisfaction outside the
 *   rule layer (e.g., via reporting logic that aggregates multiple technology facets).
 */

const FACETS = {
    "1.1.1": {
        "title": "Non-text Content",
        "level": "A",
        "facets": [
            {
                "id": "text-alternative-mechanism",
                "label": "Text alternative mechanism present",
                "automation": "partial",
                "macro": true
            },
            {
                "id": "functional-nontext-name",
                "label": "Functional non-text has accessible name",
                "automation": "partial",
                "macro": true
            },
            {
                "id": "decorative-null",
                "label": "Decorative content correctly null",
                "automation": "manual",
                "macro": true
            },
            {
                "id": "text-alt-quality-review",
                "label": "Text alternative is appropriate and equivalent",
                "automation": "manual",
                "macro": true
            },
            {
                "id": "text-alternative-quality",
                "label": "Text alternatives are appropriate and equivalent",
                "automation": "partial",
                "macro": true
            },
            {
                "id": "img-alt-attr-present",
                "label": "<img> has alt attribute",
                "automation": "full"
            },
            {
                "id": "role-img-text-alternative-present",
                "label": "role=\"img\" has text alternative",
                "automation": "full"
            },
            {
                "id": "input-image-alt-attr-present",
                "label": "<input type=\"image\"> has alt attribute",
                "automation": "full"
            },
            {
                "id": "area-alt-attr-present",
                "label": "<area> has alt attribute",
                "automation": "full"
            },
            {
                "id": "canvas-text-alternative-present",
                "label": "<canvas> has fallback text or accessible name",
                "automation": "partial"
            },
            {
                "id": "embed-text-alternative-present",
                "label": "<embed> has fallback text or accessible name",
                "automation": "partial"
            },
            {
                "id": "svg-text-alt-present",
                "label": "<svg> has a text alternative mechanism when exposed",
                "automation": "partial"
            },
            {
                "id": "svg-text-alternative-present",
                "label": "SVG <image> has a text alternative mechanism",
                "automation": "partial"
            },
            {
                "id": "svg-image-text-alt-present",
                "label": "SVG <image> has a text alternative mechanism",
                "automation": "partial"
            },
            {
                "id": "object-text-alternative-present",
                "label": "<object> has fallback text or accessible name",
                "automation": "partial"
            },
            {
                "id": "embed-name-present",
                "label": "<embed> has accessible name",
                "automation": "partial"
            },
            {
                "id": "video-poster-text-alt-present",
                "label": "<video poster> has a text alternative mechanism",
                "automation": "partial"
            },
            {
                "id": "alt-suspicious-patterns",
                "label": "Alt text suspicious patterns (e.g., filename/placeholder)",
                "automation": "partial"
            },
            {
                "id": "acc-eligibility-filtering",
                "label": "Excluded due to accessibility-tree eligibility",
                "automation": "partial",
                "macro": true
            },
            {
                "id": "meter-name-present",
                "label": "role=\"meter\" elements expose an accessible name",
                "automation": "full"
            },
            {
                "id": "progressbar-name-present",
                "label": "role=\"progressbar\" elements expose an accessible name",
                "automation": "full"
            },
            {
                "id": "captcha-alternative",
                "label": "A CAPTCHA says what it is for and offers another form that uses a different sense",
                "automation": "manual"
            }
        ]
    },
    "1.2.1": {
        "title": "Audio-only and Video-only (Prerecorded)",
        "level": "A",
        "facets": [
            {
                "id": "transcript-evidence",
                "label": "Transcript / text alternative evidence for prerecorded audio-only or video-only media (in-page association or verified on-page target)",
                "automation": "partial"
            }
        ]
    },
    "1.2.2": {
        "title": "Captions (Prerecorded)",
        "level": "A",
        "facets": [
            {
                "id": "video-captions-track-evidence",
                "label": "<video> declares a captions/subtitles <track> (evidence only: cannot verify audio content)",
                "automation": "manual"
            },
            {
                "id": "captions-complete",
                "label": "Captions give all the dialogue, who is speaking, and the sounds that matter, in time with the video",
                "automation": "manual"
            }
        ]
    },
    "1.2.3": {
        "title": "Audio Description or Media Alternative (Prerecorded)",
        "level": "A",
        "facets": [
            {
                "id": "audio-description-or-alternative",
                "label": "Prerecorded video with sound has an audio description or a full text alternative",
                "automation": "manual"
            }
        ]
    },
    "1.2.4": {
        "title": "Captions (Live)",
        "level": "AA",
        "facets": [
            {
                "id": "live-captions",
                "label": "Live video with sound has captions",
                "automation": "manual"
            }
        ]
    },
    "1.2.5": {
        "title": "Audio Description (Prerecorded)",
        "level": "AA",
        "facets": [
            {
                "id": "audio-description",
                "label": "Prerecorded video with sound has an audio description",
                "automation": "manual"
            }
        ]
    },
    "1.2.6": {
        "title": "Sign Language (Prerecorded)",
        "level": "AAA",
        "facets": [
            {
                "id": "sign-language",
                "label": "Prerecorded video with sound has sign language interpretation",
                "automation": "manual"
            }
        ]
    },
    "1.2.7": {
        "title": "Extended Audio Description (Prerecorded)",
        "level": "AAA",
        "facets": [
            {
                "id": "extended-audio-description",
                "label": "Where pauses are too short for audio description, the video stops to make room for it",
                "automation": "manual"
            }
        ]
    },
    "1.2.8": {
        "title": "Media Alternative (Prerecorded)",
        "level": "AAA",
        "facets": [
            {
                "id": "media-text-alternative",
                "label": "Prerecorded video has a full text alternative that gives everything it shows and says",
                "automation": "manual"
            }
        ]
    },
    "1.2.9": {
        "title": "Audio-only (Live)",
        "level": "AAA",
        "facets": [
            {
                "id": "live-audio-alternative",
                "label": "Live audio-only content has a text alternative, such as live captions or a script",
                "automation": "manual"
            }
        ]
    },
    "1.3.1": {
        "title": "Info and Relationships",
        "level": "A",
        "facets": [
            {
                "id": "form-control-programmatic-label-present",
                "label": "Form controls have a programmatic label (label/aria-label/aria-labelledby/title/placeholder)",
                "automation": "full"
            },
            {
                "id": "form-control-label-quality-review",
                "label": "Form control labels are appropriate",
                "automation": "manual",
                "macro": true
            },
            {
                "id": "table-headers-attr-valid",
                "label": "Table cell headers attribute references valid <th> cells within the same table",
                "automation": "full"
            },
            {
                "id": "table-th-has-data-cells",
                "label": "Tables with <th> cells also have data cells for them to describe",
                "automation": "partial"
            },
            {
                "id": "aria-hidden-body-absent",
                "label": "The document <body> does not have aria-hidden=\"true\"",
                "automation": "full"
            },
            {
                "id": "list-children-valid",
                "label": "<ul>/<ol> only directly contain <li> (or <script>/<template>)",
                "automation": "full"
            },
            {
                "id": "listitem-parent-valid",
                "label": "<li> elements are contained by a list container (<ul>/<ol>/role=\"list\")",
                "automation": "full"
            },
            {
                "id": "definition-list-children-valid",
                "label": "<dl> only directly contains <dt>/<dd> groups (optionally wrapped in one <div>), <script>, <template>, or <style>",
                "automation": "full"
            },
            {
                "id": "dlitem-parent-valid",
                "label": "<dt>/<dd> elements are contained by a <dl>, directly or via one wrapping <div>",
                "automation": "full"
            },
            {
                "id": "aria-role-required-owned-children",
                "label": "Container roles (list, listbox, menu, table, tablist, tree, ...) own at least one required child role",
                "automation": "full"
            },
            {
                "id": "aria-role-owned-children-allowed",
                "label": "Container roles do not own an accessible-tree child with a disallowed role",
                "automation": "full"
            },
            {
                "id": "aria-role-required-context-parent",
                "label": "Roles requiring a specific context role (listitem, option, tab, treeitem, row, cell, ...) have an acceptable ancestor/owner",
                "automation": "full"
            },
            {
                "id": "p-as-heading-evidence",
                "label": "Bold, heading-sized <p> text that may need a real heading element (evidence only)",
                "automation": "manual"
            },
            {
                "id": "table-fake-caption-evidence",
                "label": "Table first-row cell that may be standing in for a real <caption> (evidence only)",
                "automation": "manual"
            },
            {
                "id": "td-has-header",
                "label": "Data cells in large, simple tables have an associated header",
                "automation": "full"
            },
            {
                "id": "aria-role-valid",
                "label": "Explicit role attribute resolves to a real, non-abstract ARIA role, so the structure it conveys is programmatically determined",
                "automation": "full"
            },
            {
                "id": "aria-owns-valid",
                "label": "aria-owns gives each element one owner, and never an ancestor of the owner",
                "automation": "full"
            },
            {
                "id": "headings-marked-up",
                "label": "Text that looks like a heading is marked up as one, at a level that matches the page's outline",
                "automation": "partial",
                "macro": true
            },
            {
                "id": "lists-marked-up",
                "label": "Content shown as a list is marked up as a list",
                "automation": "partial",
                "macro": true
            },
            {
                "id": "tables-marked-up",
                "label": "Data tables mark up their headers and caption, and tables used only for layout carry no header markup",
                "automation": "partial",
                "macro": true
            },
            {
                "id": "form-labels-associated",
                "label": "Form fields are tied to their visible labels, and groups of fields to the text that names the group",
                "automation": "partial",
                "macro": true
            },
            {
                "id": "aria-structure-valid",
                "label": "ARIA roles and relationships give the same structure the page shows",
                "automation": "partial",
                "macro": true
            },
            {
                "id": "visual-cues-conveyed",
                "label": "Meaning shown by styling or layout, such as bold, color, position or an asterisk, is also given in the markup or the text",
                "automation": "manual",
                "macro": true
            }
        ]
    },
    "1.3.2": {
        "title": "Meaningful Sequence",
        "level": "A",
        "facets": [
            {
                "id": "reading-order-meaningful",
                "label": "The order assistive technology reads the content in keeps its meaning, and spaces don't lay out text",
                "automation": "manual"
            }
        ]
    },
    "1.3.3": {
        "title": "Sensory Characteristics",
        "level": "A",
        "facets": [
            {
                "id": "instructions-not-sensory-only",
                "label": "Instructions don't rely only on shape, color, size, position, orientation or sound",
                "automation": "manual"
            }
        ]
    },
    "1.3.4": {
        "title": "Orientation",
        "level": "AA",
        "facets": [
            {
                "id": "css-orientation-lock",
                "label": "No CSS orientation media query rotates the page to lock its display orientation",
                "automation": "full"
            },
            {
                "id": "orientation-not-locked",
                "label": "The page works in both portrait and landscape, unless one orientation is essential",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "1.3.5": {
        "title": "Identify Input Purpose",
        "level": "AA",
        "facets": [
            {
                "id": "autocomplete-valid",
                "label": "A non-empty autocomplete attribute is a valid autofill value",
                "automation": "full"
            },
            {
                "id": "input-purpose-identified",
                "label": "Fields that ask for information about the user name its purpose with the right autocomplete value",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "1.3.6": {
        "title": "Identify Purpose",
        "level": "AAA",
        "facets": [
            {
                "id": "purpose-identified",
                "label": "The purpose of regions, icons and controls is given in the markup, so tools can adapt or replace them",
                "automation": "manual"
            }
        ]
    },
    "1.4.1": {
        "title": "Use of Color",
        "level": "A",
        "facets": [
            {
                "id": "link-in-text-block",
                "label": "Links inside blocks of text are distinguishable from surrounding text by non-color means (underline, weight/style difference, or >=3:1 contrast)",
                "automation": "partial"
            },
            {
                "id": "color-not-only-means",
                "label": "Color is not the only way information is shown, a choice is asked for or an element is set apart",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "1.4.2": {
        "title": "Audio Control",
        "level": "A",
        "facets": [
            {
                "id": "no-autoplay-audio-evidence",
                "label": "Autoplaying unmuted audio/video has a controls mechanism (evidence only: clip duration is not statically knowable)",
                "automation": "manual"
            }
        ]
    },
    "1.4.3": {
        "title": "Contrast (Minimum)",
        "level": "AA",
        "facets": [
            {
                "id": "contrast-computability-143",
                "label": "Text contrast is computable from CSS for 1.4.3 (no images/gradients/blending ambiguity)",
                "automation": "partial"
            },
            {
                "id": "contrast-minimum-text",
                "label": "Visible text meets minimum contrast ratio (AA) when computable",
                "automation": "partial"
            }
        ]
    },
    "1.4.4": {
        "title": "Resize Text",
        "level": "AA",
        "facets": [
            {
                "id": "meta-viewport-zoom-enabled",
                "label": "<meta name=\"viewport\"> does not disable or cap pinch-zoom below 200%",
                "automation": "full"
            },
            {
                "id": "text-resizes-200",
                "label": "Text can be resized to 200% without losing content or function",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "1.4.5": {
        "title": "Images of Text",
        "level": "AA",
        "facets": [
            {
                "id": "image-of-text-evidence",
                "label": "Images markup shows likely to hold text (<input type=\"image\">, an <img> of an SVG with <text>) are asked about (evidence only: text in an image's pixels is not seen)",
                "automation": "manual"
            },
            {
                "id": "text-not-as-image",
                "label": "Text is shown as text, not in an image, unless its look is essential, as in a logo",
                "automation": "manual",
                "macro": true
            }
        ]
    },
    "1.4.6": {
        "title": "Contrast (Enhanced)",
        "level": "AAA",
        "facets": [
            {
                "id": "contrast-computability-146",
                "label": "Text contrast is computable from CSS for 1.4.6 (no images/gradients/blending ambiguity)",
                "automation": "partial"
            },
            {
                "id": "contrast-enhanced-text",
                "label": "Visible text meets enhanced contrast ratio (AAA) when computable",
                "automation": "partial"
            }
        ]
    },
    "1.4.7": {
        "title": "Low or No Background Audio",
        "level": "AAA",
        "facets": [
            {
                "id": "background-audio-low",
                "label": "Speech in prerecorded audio has no background sound, or background sound that can be turned off or is 20 dB quieter",
                "automation": "manual"
            }
        ]
    },
    "1.4.8": {
        "title": "Visual Presentation",
        "level": "AAA",
        "facets": [
            {
                "id": "visual-presentation",
                "label": "Blocks of text can be given the user's colors, are at most 80 characters wide, not justified, spaced 1.5 lines, and resize to 200% without sideways scrolling",
                "automation": "manual"
            }
        ]
    },
    "1.4.9": {
        "title": "Images of Text (No Exception)",
        "level": "AAA",
        "facets": [
            {
                "id": "no-images-of-text",
                "label": "Images of text are used only for decoration or where the look is essential",
                "automation": "manual"
            }
        ]
    },
    "1.4.10": {
        "title": "Reflow",
        "level": "AA",
        "facets": [
            {
                "id": "reflow-320",
                "label": "At 320 CSS pixels wide, content needs no scrolling in two directions and nothing is lost",
                "automation": "manual"
            }
        ]
    },
    "1.4.11": {
        "title": "Non-text Contrast",
        "level": "AA",
        "facets": [
            {
                "id": "ui-component-contrast",
                "label": "The parts of a control that show it is there and its state have a contrast of at least 3:1",
                "automation": "manual"
            },
            {
                "id": "graphics-contrast",
                "label": "The parts of a graphic needed to understand it have a contrast of at least 3:1",
                "automation": "manual"
            }
        ]
    },
    "1.4.12": {
        "title": "Text Spacing",
        "level": "AA",
        "facets": [
            {
                "id": "avoid-inline-spacing",
                "label": "Inline style does not force line-height/letter-spacing/word-spacing with !important",
                "automation": "full"
            },
            {
                "id": "text-spacing-content-loss",
                "label": "With the 1.4.12 spacing applied, no text is cut off or made to overlap (measured in a browser)",
                "automation": "partial"
            },
            {
                "id": "text-spacing-functionality-kept",
                "label": "With the 1.4.12 spacing applied, controls, menus and forms keep working and show all their text",
                "automation": "manual"
            },
            {
                "id": "text-spacing-other-states",
                "label": "With the 1.4.12 spacing applied, content shown only after interaction (menus, dialogs, tabs, messages) keeps all its text",
                "automation": "manual"
            }
        ]
    },
    "1.4.13": {
        "title": "Content on Hover or Focus",
        "level": "AA",
        "facets": [
            {
                "id": "hover-focus-content-dismissible",
                "label": "Extra content that appears on hover or focus can be dismissed without moving the pointer or focus",
                "automation": "manual"
            },
            {
                "id": "hover-content-hoverable",
                "label": "The pointer can move onto extra content that appears on hover without it disappearing",
                "automation": "manual"
            },
            {
                "id": "hover-focus-content-persistent",
                "label": "Extra content that appears on hover or focus stays until it is dismissed, the pointer or focus leaves, or it is no longer true",
                "automation": "manual"
            }
        ]
    },
    "2.1.1": {
        "title": "Keyboard",
        "level": "A",
        "facets": [
            {
                "id": "iframe-tabindex-negative-content-not-focusable",
                "label": "Same-origin frames with tabindex=\"-1\" contain no focusable content",
                "automation": "partial"
            },
            {
                "id": "server-side-image-map-absent",
                "label": "<img> does not use a server-side image map (ismap)",
                "automation": "full"
            },
            {
                "id": "scrollable-region-focusable-evidence",
                "label": "A CSS-scrollable region with no focusable descendant is itself keyboard-focusable (evidence only: actual overflow not statically knowable)",
                "automation": "manual"
            },
            {
                "id": "mouse-only-event-handlers-evidence",
                "label": "Pointer-only inline event handlers have a keyboard-reachable equivalent (evidence only: JS-attached listeners are not statically visible)",
                "automation": "manual"
            },
            {
                "id": "click-handler-keyboard-operable",
                "label": "An inline click handler on an element that is not a native control can be reached and run by keyboard",
                "automation": "partial"
            },
            {
                "id": "widget-keyboard-focusable-evidence",
                "label": "An element with a widget role, or one item of a composite widget, is in the tab order (evidence only: a script may move focus in ways the markup doesn't show)",
                "automation": "manual"
            },
            {
                "id": "focus-not-removed-by-script-evidence",
                "label": "An inline focus handler does not remove focus from the element that receives it (evidence only: listeners added from script are not statically visible)",
                "automation": "manual"
            },
            {
                "id": "keyboard-operable-all-functionality",
                "label": "All functionality can be operated from a keyboard alone",
                "automation": "manual"
            }
        ]
    },
    "2.1.2": {
        "title": "No Keyboard Trap",
        "level": "A",
        "facets": [
            {
                "id": "no-keyboard-trap",
                "label": "Focus can always be moved away from any part of the page with the keyboard",
                "automation": "manual"
            }
        ]
    },
    "2.1.3": {
        "title": "Keyboard (No Exception)",
        "level": "AAA",
        "facets": [
            {
                "id": "scrollable-region-focusable-evidence",
                "label": "A CSS-scrollable region with no focusable descendant is itself keyboard-focusable (evidence only: actual overflow not statically knowable)",
                "automation": "manual"
            },
            {
                "id": "mouse-only-event-handlers-evidence",
                "label": "Pointer-only inline event handlers have a keyboard-reachable equivalent (evidence only: JS-attached listeners are not statically visible)",
                "automation": "manual"
            },
            {
                "id": "click-handler-keyboard-operable",
                "label": "An inline click handler on an element that is not a native control can be reached and run by keyboard",
                "automation": "partial"
            },
            {
                "id": "keyboard-no-exception",
                "label": "Everything can be done with the keyboard, with no exception for path-dependent input",
                "automation": "manual",
                "macro": true
            }
        ]
    },
    "2.1.4": {
        "title": "Character Key Shortcuts",
        "level": "A",
        "facets": [
            {
                "id": "character-key-shortcuts",
                "label": "Shortcuts made of a single letter, number or symbol can be turned off or remapped, or work only while their control has focus",
                "automation": "manual"
            }
        ]
    },
    "2.2.1": {
        "title": "Timing Adjustable",
        "level": "A",
        "facets": [
            {
                "id": "meta-refresh-timing-absent",
                "label": "<meta http-equiv=\"refresh\"> does not impose a delayed page refresh",
                "automation": "full"
            },
            {
                "id": "time-limits-adjustable",
                "label": "Each time limit can be turned off, adjusted or extended, unless it is real-time, essential or over 20 hours",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "2.2.2": {
        "title": "Pause, Stop, Hide",
        "level": "A",
        "facets": [
            {
                "id": "deprecated-non-stoppable-elements-absent",
                "label": "Obsolete non-stoppable elements (<blink>, <marquee>) are not present",
                "automation": "full"
            },
            {
                "id": "auto-moving-content-pausable",
                "label": "Animations that start by themselves and last over five seconds can be paused, stopped or hidden",
                "automation": "manual"
            },
            {
                "id": "auto-updating-content-controllable",
                "label": "Content that updates by itself can be paused, stopped, hidden or set to update less often",
                "automation": "manual"
            }
        ]
    },
    "2.2.3": {
        "title": "No Timing",
        "level": "AAA",
        "facets": [
            {
                "id": "no-timing",
                "label": "Nothing has a time limit, except real-time events and non-interactive media",
                "automation": "manual"
            }
        ]
    },
    "2.2.4": {
        "title": "Interruptions",
        "level": "AAA",
        "facets": [
            {
                "id": "meta-refresh-no-exceptions",
                "label": "No meta refresh is used, regardless of delay (AAA)",
                "automation": "full"
            },
            {
                "id": "meta-refresh-timing-absent",
                "label": "<meta http-equiv=\"refresh\"> does not impose a delayed page refresh",
                "automation": "full"
            },
            {
                "id": "interruptions-postponable",
                "label": "Interruptions, such as updates, alerts and refreshes, can be postponed or turned off, except in an emergency",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "2.2.5": {
        "title": "Re-authenticating",
        "level": "AAA",
        "facets": [
            {
                "id": "reauthentication-keeps-data",
                "label": "After a session expires, the user can sign in again and continue without losing data",
                "automation": "manual"
            }
        ]
    },
    "2.2.6": {
        "title": "Timeouts",
        "level": "AAA",
        "facets": [
            {
                "id": "timeout-warning",
                "label": "Users are told how long inactivity may lose their data, unless it is kept for over 20 hours",
                "automation": "manual"
            }
        ]
    },
    "2.3.1": {
        "title": "Three Flashes or Below Threshold",
        "level": "A",
        "facets": [
            {
                "id": "flashing-below-threshold",
                "label": "Nothing flashes more than three times in any one second, or the flashes are small and dim enough",
                "automation": "manual"
            }
        ]
    },
    "2.3.2": {
        "title": "Three Flashes",
        "level": "AAA",
        "facets": [
            {
                "id": "no-flashing",
                "label": "Nothing flashes more than three times in any one second",
                "automation": "manual"
            }
        ]
    },
    "2.3.3": {
        "title": "Animation from Interactions",
        "level": "AAA",
        "facets": [
            {
                "id": "motion-animation-disableable",
                "label": "Motion caused by interaction can be turned off, unless it is essential",
                "automation": "manual"
            }
        ]
    },
    "2.4.1": {
        "title": "Bypass Blocks",
        "level": "A",
        "facets": [
            {
                "id": "bypass-blocks-present",
                "label": "Page has a main landmark, working same-page anchor link, or heading (recognized bypass-blocks mechanism)",
                "automation": "partial"
            }
        ]
    },
    "2.4.2": {
        "title": "Page Titled",
        "level": "A",
        "facets": [
            {
                "id": "page-title-present",
                "label": "<title> element is present and non-empty",
                "automation": "full"
            },
            {
                "id": "page-title-patterns",
                "label": "Page title patterns review (generic / duplicated / overly templated across pages)",
                "automation": "partial"
            },
            {
                "id": "page-title-descriptive",
                "label": "The page has a title that says what it is about or for, and tells it apart from the site's other pages",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "2.4.3": {
        "title": "Focus Order",
        "level": "A",
        "facets": [
            {
                "id": "focus-order-preserves-meaning",
                "label": "Moving focus with Tab and Shift+Tab follows an order that keeps the page's meaning and lets it be used",
                "automation": "manual"
            },
            {
                "id": "focus-order-opened-content",
                "label": "Focus moves into a dialog, menu or section that opens, stays in a dialog while it covers the page, and comes back when it closes",
                "automation": "manual"
            },
            {
                "id": "focus-order-no-hidden-stops",
                "label": "Focus does not stop on content that is closed, hidden or off screen",
                "automation": "manual"
            }
        ]
    },
    "2.4.4": {
        "title": "Link Purpose (In Context)",
        "level": "A",
        "facets": [
            {
                "id": "link-name-present",
                "label": "Links expose an accessible name (a link with no name has no purpose to determine)",
                "automation": "full"
            },
            {
                "id": "link-text-descriptive-evidence",
                "label": "Link text is not a known non-descriptive/generic phrase (evidence only: surrounding-context sufficiency not verified)",
                "automation": "manual"
            },
            {
                "id": "link-purpose-clear",
                "label": "Each link's purpose can be told from its text, or from its text with the sentence, paragraph, list item or table cell it is in",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "2.4.5": {
        "title": "Multiple Ways",
        "level": "AA",
        "facets": [
            {
                "id": "multiple-ways",
                "label": "There is more than one way to find a page in the site",
                "automation": "manual"
            }
        ]
    },
    "2.4.6": {
        "title": "Headings and Labels",
        "level": "AA",
        "facets": [
            {
                "id": "heading-text-descriptive-evidence",
                "label": "Heading text is a description of the content that follows, not a placeholder",
                "automation": "manual"
            },
            {
                "id": "form-control-label-descriptive-evidence",
                "label": "Form field label text describes the field and is not repeated without visible context",
                "automation": "manual"
            }
        ]
    },
    "2.4.7": {
        "title": "Focus Visible",
        "level": "AA",
        "facets": [
            {
                "id": "css-hidden-focusable",
                "label": "tabbable element is visually hidden by CSS",
                "automation": "full"
            },
            {
                "id": "focus-indicator-not-suppressed",
                "label": "CSS does not remove the focus indicator without drawing a replacement",
                "automation": "manual"
            },
            {
                "id": "focus-not-removed-by-script-evidence",
                "label": "An inline focus handler does not remove focus from the element that receives it (evidence only: listeners added from script are not statically visible)",
                "automation": "manual"
            },
            {
                "id": "focus-indicator-visible",
                "label": "Every element that takes keyboard focus shows that it has it",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "2.4.8": {
        "title": "Location",
        "level": "AAA",
        "facets": [
            {
                "id": "location-shown",
                "label": "The page shows where it is in the site",
                "automation": "manual"
            }
        ]
    },
    "2.4.9": {
        "title": "Link Purpose (Link Only)",
        "level": "AAA",
        "facets": [
            {
                "id": "identical-links-same-purpose-evidence",
                "label": "Links sharing an accessible name resolve to a single shared destination",
                "automation": "manual"
            },
            {
                "id": "link-name-present",
                "label": "Links expose an accessible name (a link with no name has no purpose to determine from its text)",
                "automation": "full"
            },
            {
                "id": "link-text-alone-clear",
                "label": "Each link's purpose can be told from its text alone",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "2.4.10": {
        "title": "Section Headings",
        "level": "AAA",
        "facets": [
            {
                "id": "section-headings",
                "label": "Sections of content are organised with headings",
                "automation": "manual"
            }
        ]
    },
    "2.4.11": {
        "title": "Focus Not Obscured (Minimum)",
        "level": "AA",
        "facets": [
            {
                "id": "focus-not-obscured",
                "label": "An element that receives focus is not entirely hidden by content the page puts over it",
                "automation": "manual"
            }
        ]
    },
    "2.4.12": {
        "title": "Focus Not Obscured (Enhanced)",
        "level": "AAA",
        "facets": [
            {
                "id": "focus-fully-visible",
                "label": "No part of an element that receives focus is hidden by content the page puts over it",
                "automation": "manual"
            }
        ]
    },
    "2.4.13": {
        "title": "Focus Appearance",
        "level": "AAA",
        "facets": [
            {
                "id": "focus-appearance",
                "label": "The focus indicator is at least as large as a 2 CSS pixel outline around the element and changes contrast by at least 3:1",
                "automation": "manual"
            }
        ]
    },
    "2.5.1": {
        "title": "Pointer Gestures",
        "level": "A",
        "facets": [
            {
                "id": "single-pointer-alternative",
                "label": "What a path or multipoint gesture does can also be done with a single tap or click",
                "automation": "manual"
            }
        ]
    },
    "2.5.2": {
        "title": "Pointer Cancellation",
        "level": "A",
        "facets": [
            {
                "id": "pointer-cancellation",
                "label": "Actions run when the pointer is released, not pressed, or can be cancelled or undone",
                "automation": "manual"
            }
        ]
    },
    "2.5.3": {
        "title": "Label in Name",
        "level": "A",
        "facets": [
            {
                "id": "label-in-name",
                "label": "Controls with aria-label/aria-labelledby: accessible name contains visible label text",
                "automation": "partial"
            }
        ]
    },
    "2.5.4": {
        "title": "Motion Actuation",
        "level": "A",
        "facets": [
            {
                "id": "motion-actuation",
                "label": "What is done by moving the device can also be done with controls, and the motion response can be turned off",
                "automation": "manual"
            }
        ]
    },
    "2.5.5": {
        "title": "Target Size (Enhanced)",
        "level": "AAA",
        "facets": [
            {
                "id": "target-size-enhanced",
                "label": "Pointer targets are at least 44 by 44 CSS pixels",
                "automation": "manual"
            }
        ]
    },
    "2.5.6": {
        "title": "Concurrent Input Mechanisms",
        "level": "AAA",
        "facets": [
            {
                "id": "concurrent-input",
                "label": "The page doesn't limit the kinds of input that can be used, such as a mouse with a touch screen",
                "automation": "manual"
            }
        ]
    },
    "2.5.7": {
        "title": "Dragging Movements",
        "level": "AA",
        "facets": [
            {
                "id": "dragging-alternative",
                "label": "What is done by dragging can also be done with single taps or clicks",
                "automation": "manual"
            }
        ]
    },
    "2.5.8": {
        "title": "Target Size (Minimum)",
        "level": "AA",
        "facets": [
            {
                "id": "target-size-minimum-pointer",
                "label": "Pointer targets meet minimum size or spacing exception (24×24 CSS px) when measurable",
                "automation": "partial"
            }
        ]
    },
    "3.1.1": {
        "title": "Language of Page",
        "level": "A",
        "facets": [
            {
                "id": "html-lang-attr-present",
                "label": "<html> has a valid non-empty lang attribute",
                "automation": "full"
            },
            {
                "id": "html-xml-lang-mismatch",
                "label": "lang and xml:lang on <html> declare the same primary language, when both are present",
                "automation": "full"
            },
            {
                "id": "page-language-correct",
                "label": "The page's main language is given in its markup, and is the right one",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "3.1.2": {
        "title": "Language of Parts",
        "level": "AA",
        "facets": [
            {
                "id": "element-lang-valid",
                "label": "Any element's lang attribute (when present) is a syntactically valid language tag",
                "automation": "full"
            },
            {
                "id": "parts-language-marked",
                "label": "Passages and phrases in a language other than the page's are marked with their own language",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "3.1.3": {
        "title": "Unusual Words",
        "level": "AAA",
        "facets": [
            {
                "id": "unusual-words-defined",
                "label": "Words used in an unusual way, idioms and jargon have their meaning given",
                "automation": "manual"
            }
        ]
    },
    "3.1.4": {
        "title": "Abbreviations",
        "level": "AAA",
        "facets": [
            {
                "id": "abbreviations-expanded",
                "label": "Abbreviations have their expanded form or meaning given",
                "automation": "manual"
            }
        ]
    },
    "3.1.5": {
        "title": "Reading Level",
        "level": "AAA",
        "facets": [
            {
                "id": "reading-level",
                "label": "Text that needs more than lower secondary education to read has a simpler version or supplement",
                "automation": "manual"
            }
        ]
    },
    "3.1.6": {
        "title": "Pronunciation",
        "level": "AAA",
        "facets": [
            {
                "id": "pronunciation-given",
                "label": "Where meaning depends on pronunciation, the pronunciation is given",
                "automation": "manual"
            }
        ]
    },
    "3.2.1": {
        "title": "On Focus",
        "level": "A",
        "facets": [
            {
                "id": "focus-no-change-of-context",
                "label": "Moving focus onto an element doesn't change the context by itself",
                "automation": "manual"
            }
        ]
    },
    "3.2.2": {
        "title": "On Input",
        "level": "A",
        "facets": [
            {
                "id": "input-no-unexpected-change",
                "label": "Changing a setting doesn't change the context unless the user is told beforehand",
                "automation": "manual"
            }
        ]
    },
    "3.2.3": {
        "title": "Consistent Navigation",
        "level": "AA",
        "facets": [
            {
                "id": "navigation-consistent",
                "label": "Navigation repeated on several pages comes in the same relative order each time",
                "automation": "manual"
            }
        ]
    },
    "3.2.4": {
        "title": "Consistent Identification",
        "level": "AA",
        "facets": [
            {
                "id": "identification-consistent",
                "label": "Components that do the same thing across pages are identified the same way",
                "automation": "manual"
            }
        ]
    },
    "3.2.5": {
        "title": "Change on Request",
        "level": "AAA",
        "facets": [
            {
                "id": "meta-refresh-no-exceptions",
                "label": "No meta refresh is used, regardless of delay (AAA)",
                "automation": "full"
            },
            {
                "id": "meta-refresh-timing-absent",
                "label": "<meta http-equiv=\"refresh\"> does not impose a delayed page refresh",
                "automation": "full"
            },
            {
                "id": "changes-on-request",
                "label": "Changes of context happen only when the user asks for them, or can be turned off",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "3.2.6": {
        "title": "Consistent Help",
        "level": "A",
        "facets": [
            {
                "id": "help-consistent",
                "label": "Help offered on several pages is in the same relative place each time",
                "automation": "manual"
            }
        ]
    },
    "3.3.1": {
        "title": "Error Identification",
        "level": "A",
        "facets": [
            {
                "id": "invalid-field-error-message",
                "label": "A field marked invalid with aria-invalid has a shown error message in text tied to it",
                "automation": "partial"
            },
            {
                "id": "errors-identified",
                "label": "An input error the page detects is shown in text that says which field is wrong and what is wrong",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "3.3.2": {
        "title": "Labels or Instructions",
        "level": "A",
        "facets": [
            {
                "id": "form-control-labels-or-instructions-present",
                "label": "Form controls provide labels or instructions (label/aria-label/aria-labelledby/title/placeholder)",
                "automation": "full"
            },
            {
                "id": "form-control-single-label",
                "label": "Form controls are associated with at most one <label>",
                "automation": "full"
            },
            {
                "id": "form-control-visible-label-quality",
                "label": "Form controls have a label presented to all users, not only a title or placeholder",
                "automation": "manual"
            },
            {
                "id": "labels-instructions-provided",
                "label": "Fields that ask for input have a visible label, and instructions where the input needs them",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "3.3.3": {
        "title": "Error Suggestion",
        "level": "AA",
        "facets": [
            {
                "id": "error-suggestions",
                "label": "When the page knows how to fix an input error, it says how",
                "automation": "manual"
            }
        ]
    },
    "3.3.4": {
        "title": "Error Prevention (Legal, Financial, Data)",
        "level": "AA",
        "facets": [
            {
                "id": "submission-reversible-checked-confirmed",
                "label": "Submissions with legal or financial effect, or that change stored data, can be reversed, checked or reviewed and confirmed",
                "automation": "manual"
            }
        ]
    },
    "3.3.5": {
        "title": "Help",
        "level": "AAA",
        "facets": [
            {
                "id": "context-help",
                "label": "Help for filling in each field is available where it is needed",
                "automation": "manual"
            }
        ]
    },
    "3.3.6": {
        "title": "Error Prevention (All)",
        "level": "AAA",
        "facets": [
            {
                "id": "all-submissions-reversible-checked-confirmed",
                "label": "Every submission of information can be reversed, checked or reviewed and confirmed",
                "automation": "manual"
            }
        ]
    },
    "3.3.7": {
        "title": "Redundant Entry",
        "level": "A",
        "facets": [
            {
                "id": "redundant-entry",
                "label": "Information the user already gave in a process is filled in or offered to pick, not asked for again",
                "automation": "manual"
            }
        ]
    },
    "3.3.8": {
        "title": "Accessible Authentication (Minimum)",
        "level": "AA",
        "facets": [
            {
                "id": "authentication-paste-not-blocked",
                "label": "A password or one-time-code field does not cancel pasting, so a password manager or the clipboard can still fill it",
                "automation": "manual"
            },
            {
                "id": "authentication-no-cognitive-test",
                "label": "Signing in doesn't require remembering, transcribing or solving something, unless a way around it is offered",
                "automation": "manual",
                "macro": true
            }
        ]
    },
    "3.3.9": {
        "title": "Accessible Authentication (Enhanced)",
        "level": "AAA",
        "facets": [
            {
                "id": "authentication-no-recognition-test",
                "label": "Signing in needs no cognitive test, not even recognising objects or the user's own content, unless a way around it is offered",
                "automation": "manual"
            }
        ]
    },
    "4.1.1": {
        "title": "Parsing (Obsolete and removed)",
        "level": null,
        "facets": [
            {
                "id": "id-unique-page-wide",
                "label": "Every id value is unique within its own document or shadow tree",
                "automation": "full"
            }
        ]
    },
    "4.1.2": {
        "title": "Name, Role, Value",
        "level": "A",
        "facets": [
            {
                "id": "form-control-name-present",
                "label": "Form controls expose an accessible name (label/aria-label/aria-labelledby/title/placeholder)",
                "automation": "full"
            },
            {
                "id": "aria-hidden-focusable",
                "label": "aria-hidden subtree has focusable content",
                "automation": "full"
            },
            {
                "id": "link-name-present",
                "label": "Links expose an accessible name (content text / aria-label / aria-labelledby / title)",
                "automation": "full"
            },
            {
                "id": "button-name-present",
                "label": "Buttons expose an accessible name (content text / aria-label / aria-labelledby / title / value)",
                "automation": "full"
            },
            {
                "id": "input-image-name-present",
                "label": "Image buttons (<input type=\"image\">) expose an accessible name (aria-labelledby / aria-label / alt / title)",
                "automation": "full"
            },
            {
                "id": "checkbox-name-present",
                "label": "Checkboxes expose an accessible name (label / aria-label / aria-labelledby / title)",
                "automation": "full"
            },
            {
                "id": "radio-name-present",
                "label": "Radio buttons expose an accessible name (label / aria-label / aria-labelledby / title)",
                "automation": "full"
            },
            {
                "id": "switch-name-present",
                "label": "Switches expose an accessible name (content / aria-label / aria-labelledby / title)",
                "automation": "full"
            },
            {
                "id": "combobox-name-present",
                "label": "Comboboxes expose an accessible name (content / aria-label / aria-labelledby / title)",
                "automation": "full"
            },
            {
                "id": "dialog-name-present",
                "label": "Dialogs expose an accessible name (aria-labelledby / aria-label / title / content)",
                "automation": "full"
            },
            {
                "id": "menuitem-name-present",
                "label": "Menu items expose an accessible name (content / aria-label / aria-labelledby / title)",
                "automation": "full"
            },
            {
                "id": "tab-name-present",
                "label": "Tabs expose an accessible name (content / aria-label / aria-labelledby / title)",
                "automation": "full"
            },
            {
                "id": "slider-name-present",
                "label": "Sliders expose an accessible name (label / aria-label / aria-labelledby / title / content)",
                "automation": "full"
            },
            {
                "id": "textbox-name-present",
                "label": "Textboxes (role=\\\"textbox\\\") expose an accessible name (content / aria-label / aria-labelledby / title)",
                "automation": "full"
            },
            {
                "id": "searchbox-name-present",
                "label": "Searchboxes (role=\\\"searchbox\\\") expose an accessible name (content / aria-label / aria-labelledby / title)",
                "automation": "full"
            },
            {
                "id": "spinbutton-name-present",
                "label": "Spinbuttons (role=\\\"spinbutton\\\") expose an accessible name (content / aria-label / aria-labelledby / title)",
                "automation": "full"
            },
            {
                "id": "listbox-name-present",
                "label": "Listboxes (role=\\\"listbox\\\") expose an accessible name (content / aria-label / aria-labelledby / title)",
                "automation": "full"
            },
            {
                "id": "option-name-present",
                "label": "Options (role=\\\"option\\\") expose an accessible name (content / aria-label / aria-labelledby / title)",
                "automation": "full"
            },
            {
                "id": "treeitem-name-present",
                "label": "Tree items (role=\\\"treeitem\\\") expose an accessible name (content / aria-label / aria-labelledby / title)",
                "automation": "full"
            },
            {
                "id": "aria-role-name-present",
                "label": "Selected ARIA widget/container roles (scrollbar, toolbar, tablist, radiogroup, tree, grid, menu, menubar) expose an accessible name",
                "automation": "full"
            },
            {
                "id": "aria-role-valid",
                "label": "Explicit role attribute resolves to a real, non-abstract ARIA role",
                "automation": "full"
            },
            {
                "id": "aria-role-not-deprecated",
                "label": "Explicit role attribute does not use a deprecated ARIA role",
                "automation": "full"
            },
            {
                "id": "aria-attr-name-valid",
                "label": "Every aria-* attribute name present is a real, defined ARIA attribute",
                "automation": "full"
            },
            {
                "id": "aria-attr-value-valid",
                "label": "Every recognized aria-* attribute has a value matching its declared type",
                "automation": "full"
            },
            {
                "id": "aria-attr-allowed-for-role",
                "label": "aria-* attributes present are permitted for the element's explicit role",
                "automation": "full"
            },
            {
                "id": "aria-attr-not-prohibited",
                "label": "ARIA naming attributes are not used on roles that prohibit them",
                "automation": "full"
            },
            {
                "id": "aria-attr-required-for-role",
                "label": "Roles with an unambiguous required state/property carry it (e.g. role=\\\"checkbox\\\" has aria-checked)",
                "automation": "full"
            },
            {
                "id": "iframe-name-present",
                "label": "<iframe>/<frame> elements expose an accessible name (aria-label / aria-labelledby / title)",
                "automation": "full"
            },
            {
                "id": "identical-iframes-same-purpose",
                "label": "<iframe>/<frame> elements sharing an accessible name embed the same resource",
                "automation": "partial"
            },
            {
                "id": "aria-hidden-body-absent",
                "label": "The document <body> does not have aria-hidden=\"true\"",
                "automation": "full"
            },
            {
                "id": "duplicate-id-aria",
                "label": "IDs referenced by ARIA ID-reference attributes are unique in the document",
                "automation": "full"
            },
            {
                "id": "summary-name-present",
                "label": "<summary> elements expose an accessible name",
                "automation": "full"
            },
            {
                "id": "tooltip-name-present",
                "label": "role=\"tooltip\" elements expose an accessible name",
                "automation": "full"
            },
            {
                "id": "nested-interactive-controls-absent",
                "label": "Interactive controls do not contain other interactive controls",
                "automation": "full"
            },
            {
                "id": "presentational-children-focusable-absent",
                "label": "Roles with presentational children contain no content in sequential focus navigation",
                "automation": "full"
            },
            {
                "id": "aria-braille-equivalent",
                "label": "aria-braillelabel/aria-brailleroledescription have a non-braille equivalent",
                "automation": "full"
            },
            {
                "id": "aria-conditional-attr",
                "label": "aria-errormessage is only used when aria-invalid is not false/absent",
                "automation": "full"
            },
            {
                "id": "aria-checked-state-mismatch",
                "label": "Native checkbox/radio aria-checked matches its actual checked/indeterminate state (evidence only: static markup can't rule out later JS hydration)",
                "automation": "manual"
            },
            {
                "id": "aria-expanded-state-mismatch",
                "label": "aria-expanded matches whether the content aria-controls names is shown (evidence only: static markup may catch a transition or a script that hasn't run)",
                "automation": "manual"
            },
            {
                "id": "aria-owns-valid",
                "label": "aria-owns gives each element one owner, and never an ancestor of the owner",
                "automation": "full"
            },
            {
                "id": "components-named",
                "label": "Every link, control, frame and dialog has a name that says what it is for",
                "automation": "partial",
                "macro": true
            },
            {
                "id": "roles-match-behavior",
                "label": "Every control's role says what it does, and controls aren't nested inside one another",
                "automation": "partial",
                "macro": true
            },
            {
                "id": "states-values-exposed",
                "label": "Every control's state and value are exposed and change with what is on screen",
                "automation": "partial",
                "macro": true
            },
            {
                "id": "aria-used-validly",
                "label": "ARIA attributes are real, valid and allowed where they are, and nothing focusable is hidden from assistive technology",
                "automation": "partial",
                "macro": true
            }
        ]
    },
    "4.1.3": {
        "title": "Status Messages",
        "level": "AA",
        "facets": [
            {
                "id": "live-region-reachable-evidence",
                "label": "A live region is not hidden from assistive technology by aria-hidden or inert, and is not left busy (evidence only: whether the page uses it for status messages is a person's call)",
                "automation": "manual"
            },
            {
                "id": "live-region-changes-evidence",
                "label": "A live region gets its status message after it is in the accessibility tree, not added with it or shown with it (evidence only: needs the live-region hook, and screen readers differ)",
                "automation": "manual"
            },
            {
                "id": "status-messages-announced",
                "label": "Status messages are announced by assistive technology without taking focus",
                "automation": "manual",
                "macro": true
            }
        ]
    }
};

module.exports = {FACETS};
