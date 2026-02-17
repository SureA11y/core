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
 * ALIGNMENT WITH a11y-core
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
        "facets": []
    },
    "1.2.3": {
        "title": "Audio Description or Media Alternative (Prerecorded)",
        "level": "A",
        "facets": []
    },
    "1.2.4": {
        "title": "Captions (Live)",
        "level": "AA",
        "facets": []
    },
    "1.2.5": {
        "title": "Audio Description (Prerecorded)",
        "level": "AA",
        "facets": []
    },
    "1.2.6": {
        "title": "Sign Language (Prerecorded)",
        "level": "AAA",
        "facets": []
    },
    "1.2.7": {
        "title": "Extended Audio Description (Prerecorded)",
        "level": "AAA",
        "facets": []
    },
    "1.2.8": {
        "title": "Media Alternative (Prerecorded)",
        "level": "AAA",
        "facets": []
    },
    "1.2.9": {
        "title": "Audio-only (Live)",
        "level": "AAA",
        "facets": []
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
            }
        ]
    },
    "1.3.2": {
        "title": "Meaningful Sequence",
        "level": "A",
        "facets": []
    },
    "1.3.3": {
        "title": "Sensory Characteristics",
        "level": "A",
        "facets": []
    },
    "1.3.4": {
        "title": "Orientation",
        "level": "AA",
        "facets": []
    },
    "1.3.5": {
        "title": "Identify Input Purpose",
        "level": "AA",
        "facets": []
    },
    "1.3.6": {
        "title": "Identify Purpose",
        "level": "AAA",
        "facets": []
    },
    "1.4.1": {
        "title": "Use of Color",
        "level": "A",
        "facets": []
    },
    "1.4.2": {
        "title": "Audio Control",
        "level": "A",
        "facets": []
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
        "facets": []
    },
    "1.4.5": {
        "title": "Images of Text",
        "level": "AA",
        "facets": []
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
        "facets": []
    },
    "1.4.8": {
        "title": "Visual Presentation",
        "level": "AAA",
        "facets": []
    },
    "1.4.9": {
        "title": "Images of Text (No Exception)",
        "level": "AAA",
        "facets": []
    },
    "1.4.10": {
        "title": "Reflow",
        "level": "AA",
        "facets": []
    },
    "1.4.11": {
        "title": "Non-text Contrast",
        "level": "AA",
        "facets": []
    },
    "1.4.12": {
        "title": "Text Spacing",
        "level": "AA",
        "facets": []
    },
    "1.4.13": {
        "title": "Content on Hover or Focus",
        "level": "AA",
        "facets": []
    },
    "2.1.1": {
        "title": "Keyboard",
        "level": "A",
        "facets": []
    },
    "2.1.2": {
        "title": "No Keyboard Trap",
        "level": "A",
        "facets": []
    },
    "2.1.3": {
        "title": "Keyboard (No Exception)",
        "level": "AAA",
        "facets": []
    },
    "2.1.4": {
        "title": "Character Key Shortcuts",
        "level": "A",
        "facets": []
    },
    "2.2.1": {
        "title": "Timing Adjustable",
        "level": "A",
        "facets": []
    },
    "2.2.2": {
        "title": "Pause, Stop, Hide",
        "level": "A",
        "facets": []
    },
    "2.2.3": {
        "title": "No Timing",
        "level": "AAA",
        "facets": []
    },
    "2.2.4": {
        "title": "Interruptions",
        "level": "AAA",
        "facets": []
    },
    "2.2.5": {
        "title": "Re-authenticating",
        "level": "AAA",
        "facets": []
    },
    "2.2.6": {
        "title": "Timeouts",
        "level": "AAA",
        "facets": []
    },
    "2.3.1": {
        "title": "Three Flashes or Below Threshold",
        "level": "A",
        "facets": []
    },
    "2.3.2": {
        "title": "Three Flashes",
        "level": "AAA",
        "facets": []
    },
    "2.3.3": {
        "title": "Animation from Interactions",
        "level": "AAA",
        "facets": []
    },
    "2.4.1": {
        "title": "Bypass Blocks",
        "level": "A",
        "facets": []
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
            }
        ]
    },
    "2.4.3": {
        "title": "Focus Order",
        "level": "A",
        "facets": []
    },
    "2.4.4": {
        "title": "Link Purpose (In Context)",
        "level": "A",
        "facets": []
    },
    "2.4.5": {
        "title": "Multiple Ways",
        "level": "AA",
        "facets": []
    },
    "2.4.6": {
        "title": "Headings and Labels",
        "level": "AA",
        "facets": []
    },
    "2.4.7": {
        "title": "Focus Visible",
        "level": "AA",
        "facets": [
            {
                "id": "css-hidden-focusable",
                "label": "tabbable element is visually hidden by CSS",
                "automation": "full"
            }
        ]
    },
    "2.4.8": {
        "title": "Location",
        "level": "AAA",
        "facets": []
    },
    "2.4.9": {
        "title": "Link Purpose (Link Only)",
        "level": "AAA",
        "facets": []
    },
    "2.4.10": {
        "title": "Section Headings",
        "level": "AAA",
        "facets": []
    },
    "2.4.11": {
        "title": "Focus Not Obscured (Minimum)",
        "level": "AA",
        "facets": []
    },
    "2.4.12": {
        "title": "Focus Not Obscured (Enhanced)",
        "level": "AAA",
        "facets": []
    },
    "2.4.13": {
        "title": "Focus Appearance",
        "level": "AAA",
        "facets": []
    },
    "2.5.1": {
        "title": "Pointer Gestures",
        "level": "A",
        "facets": []
    },
    "2.5.2": {
        "title": "Pointer Cancellation",
        "level": "A",
        "facets": []
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
        "facets": []
    },
    "2.5.5": {
        "title": "Target Size (Enhanced)",
        "level": "AAA",
        "facets": []
    },
    "2.5.6": {
        "title": "Concurrent Input Mechanisms",
        "level": "AAA",
        "facets": []
    },
    "2.5.7": {
        "title": "Dragging Movements",
        "level": "AA",
        "facets": []
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
            }
        ]
    },
    "3.1.3": {
        "title": "Unusual Words",
        "level": "AAA",
        "facets": []
    },
    "3.1.4": {
        "title": "Abbreviations",
        "level": "AAA",
        "facets": []
    },
    "3.1.5": {
        "title": "Reading Level",
        "level": "AAA",
        "facets": []
    },
    "3.1.6": {
        "title": "Pronunciation",
        "level": "AAA",
        "facets": []
    },
    "3.2.1": {
        "title": "On Focus",
        "level": "A",
        "facets": []
    },
    "3.2.2": {
        "title": "On Input",
        "level": "A",
        "facets": []
    },
    "3.2.3": {
        "title": "Consistent Navigation",
        "level": "AA",
        "facets": []
    },
    "3.2.4": {
        "title": "Consistent Identification",
        "level": "AA",
        "facets": []
    },
    "3.2.5": {
        "title": "Change on Request",
        "level": "AAA",
        "facets": []
    },
    "3.2.6": {
        "title": "Consistent Help",
        "level": "A",
        "facets": []
    },
    "3.3.1": {
        "title": "Error Identification",
        "level": "A",
        "facets": []
    },
    "3.3.2": {
        "title": "Labels or Instructions",
        "level": "A",
        "facets": [
            {
                "id": "form-control-labels-or-instructions-present",
                "label": "Form controls provide labels or instructions (label/aria-label/aria-labelledby/title/placeholder)",
                "automation": "full"
            }
        ]
    },
    "3.3.3": {
        "title": "Error Suggestion",
        "level": "AA",
        "facets": []
    },
    "3.3.4": {
        "title": "Error Prevention (Legal, Financial, Data)",
        "level": "AA",
        "facets": []
    },
    "3.3.5": {
        "title": "Help",
        "level": "AAA",
        "facets": []
    },
    "3.3.6": {
        "title": "Error Prevention (All)",
        "level": "AAA",
        "facets": []
    },
    "3.3.7": {
        "title": "Redundant Entry",
        "level": "A",
        "facets": []
    },
    "3.3.8": {
        "title": "Accessible Authentication (Minimum)",
        "level": "AA",
        "facets": []
    },
    "3.3.9": {
        "title": "Accessible Authentication (Enhanced)",
        "level": "AAA",
        "facets": []
    },
    "4.1.1": {
        "title": "Parsing (Obsolete and removed)",
        "level": null,
        "facets": []
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
                "id": "form-control-name-quality",
                "label": "Form controls accessible name quality (avoid placeholder/title as primary)",
                "automation": "manual"
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
            }
        ]
    },
    "4.1.3": {
        "title": "Status Messages",
        "level": "AA",
        "facets": []
    }
};

module.exports = {FACETS};
