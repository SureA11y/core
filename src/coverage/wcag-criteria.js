/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Every WCAG 2 Success Criterion, with the version that introduced it, its
 * level in each version that has it, and the version that removed it.
 *
 * Each entry is { sc, tag, introduced, levels, removed }:
 * - sc: the criterion's number ('1.4.12').
 * - tag: its rule tag, the number without dots ('wcag1412').
 * - introduced: the WCAG version that added it ('2.0', '2.1' or '2.2').
 * - levels: its level ('A', 'AA' or 'AAA') in each version that has it, by
 *   version. A criterion's level is read per version, so a level that
 *   changed between versions is written down as such.
 * - id: the id W3C gives it in WCAG 2.2, as 'non-text-content' (see W3C_IDS).
 * - removed: the version that removed it, or null.
 *
 * SOURCES
 * -------
 * - WCAG 2.2, W3C Recommendation (https://www.w3.org/TR/WCAG22/), its
 *   success criteria and its "Comparison with WCAG 2.1" section: nine
 *   criteria are new in 2.2 (2.4.11, 2.4.12, 2.4.13, 2.5.7, 2.5.8, 3.2.6,
 *   3.3.7, 3.3.8, 3.3.9), and one, 4.1.1 Parsing, is removed ("Obsolete and
 *   removed", with no level).
 * - WCAG 2.1, W3C Recommendation (https://www.w3.org/TR/WCAG21/), its
 *   success criteria and its "Comparison with WCAG 2.0" section: seventeen
 *   criteria are new in 2.1, and the other 61 are WCAG 2.0's.
 *
 * Read from the source of both Recommendations (github.com/w3c/wcag, the
 * WCAG-2.1 branch and main), numbered by their place in the guidelines.
 * No criterion that two versions share has a different level in them: 2.4.7
 * Focus Visible is AA in 2.0, 2.1 and 2.2 (a draft of 2.2 moved it to A; the
 * Recommendation did not), and 2.5.5, renamed Target Size (Enhanced) in 2.2,
 * is AAA in both.
 *
 * src/coverage/wcag-version-map.js and the levels in src/coverage/wcag-facets.js
 * say the same (tests/coverage/wcag-criteria.test.js checks it); this table
 * is the one that has a level per version.
 *
 * The entries are frozen.
 */

const WCAG_VERSIONS = Object.freeze(['2.0', '2.1', '2.2']);

// The id W3C gives each criterion in WCAG 2.2: its anchor in the
// Recommendation (https://www.w3.org/TR/WCAG22/#<id>) and the name of its
// Understanding page (https://www.w3.org/WAI/WCAG22/Understanding/<id>.html).
// Taken from the file names of the criteria in the Recommendation's source
// (github.com/w3c/wcag, guidelines/sc). 2.1 and 2.0 named a few differently
// (2.5.5 was "target-size" in 2.1); these are 2.2's, the version the rules
// map to.
const W3C_IDS = {
  '1.1.1': 'non-text-content',
  '1.2.1': 'audio-only-and-video-only-prerecorded',
  '1.2.2': 'captions-prerecorded',
  '1.2.3': 'audio-description-or-media-alternative-prerecorded',
  '1.2.4': 'captions-live',
  '1.2.5': 'audio-description-prerecorded',
  '1.2.6': 'sign-language-prerecorded',
  '1.2.7': 'extended-audio-description-prerecorded',
  '1.2.8': 'media-alternative-prerecorded',
  '1.2.9': 'audio-only-live',
  '1.3.1': 'info-and-relationships',
  '1.3.2': 'meaningful-sequence',
  '1.3.3': 'sensory-characteristics',
  '1.3.4': 'orientation',
  '1.3.5': 'identify-input-purpose',
  '1.3.6': 'identify-purpose',
  '1.4.1': 'use-of-color',
  '1.4.2': 'audio-control',
  '1.4.3': 'contrast-minimum',
  '1.4.4': 'resize-text',
  '1.4.5': 'images-of-text',
  '1.4.6': 'contrast-enhanced',
  '1.4.7': 'low-or-no-background-audio',
  '1.4.8': 'visual-presentation',
  '1.4.9': 'images-of-text-no-exception',
  '1.4.10': 'reflow',
  '1.4.11': 'non-text-contrast',
  '1.4.12': 'text-spacing',
  '1.4.13': 'content-on-hover-or-focus',
  '2.1.1': 'keyboard',
  '2.1.2': 'no-keyboard-trap',
  '2.1.3': 'keyboard-no-exception',
  '2.1.4': 'character-key-shortcuts',
  '2.2.1': 'timing-adjustable',
  '2.2.2': 'pause-stop-hide',
  '2.2.3': 'no-timing',
  '2.2.4': 'interruptions',
  '2.2.5': 're-authenticating',
  '2.2.6': 'timeouts',
  '2.3.1': 'three-flashes-or-below-threshold',
  '2.3.2': 'three-flashes',
  '2.3.3': 'animation-from-interactions',
  '2.4.1': 'bypass-blocks',
  '2.4.2': 'page-titled',
  '2.4.3': 'focus-order',
  '2.4.4': 'link-purpose-in-context',
  '2.4.5': 'multiple-ways',
  '2.4.6': 'headings-and-labels',
  '2.4.7': 'focus-visible',
  '2.4.8': 'location',
  '2.4.9': 'link-purpose-link-only',
  '2.4.10': 'section-headings',
  '2.4.11': 'focus-not-obscured-minimum',
  '2.4.12': 'focus-not-obscured-enhanced',
  '2.4.13': 'focus-appearance',
  '2.5.1': 'pointer-gestures',
  '2.5.2': 'pointer-cancellation',
  '2.5.3': 'label-in-name',
  '2.5.4': 'motion-actuation',
  '2.5.5': 'target-size-enhanced',
  '2.5.6': 'concurrent-input-mechanisms',
  '2.5.7': 'dragging-movements',
  '2.5.8': 'target-size-minimum',
  '3.1.1': 'language-of-page',
  '3.1.2': 'language-of-parts',
  '3.1.3': 'unusual-words',
  '3.1.4': 'abbreviations',
  '3.1.5': 'reading-level',
  '3.1.6': 'pronunciation',
  '3.2.1': 'on-focus',
  '3.2.2': 'on-input',
  '3.2.3': 'consistent-navigation',
  '3.2.4': 'consistent-identification',
  '3.2.5': 'change-on-request',
  '3.2.6': 'consistent-help',
  '3.3.1': 'error-identification',
  '3.3.2': 'labels-or-instructions',
  '3.3.3': 'error-suggestion',
  '3.3.4': 'error-prevention-legal-financial-data',
  '3.3.5': 'help',
  '3.3.6': 'error-prevention-all',
  '3.3.7': 'redundant-entry',
  '3.3.8': 'accessible-authentication-minimum',
  '3.3.9': 'accessible-authentication-enhanced',
  '4.1.1': 'parsing',
  '4.1.2': 'name-role-value',
  '4.1.3': 'status-messages',
};

function sc(number, introduced, levels, removed = null) {
  return Object.freeze({
    sc: number,
    tag: 'wcag' + number.split('.').join(''),
    id: W3C_IDS[number],
    introduced,
    levels: Object.freeze(levels),
    removed
  });
}

const WCAG_CRITERIA = Object.freeze([
  sc('1.1.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.2.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.2.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.2.3', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.2.4', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('1.2.5', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('1.2.6', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.2.7', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.2.8', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.2.9', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.3.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.3.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.3.3', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.3.4', '2.1', { '2.1': 'AA', '2.2': 'AA' }),
  sc('1.3.5', '2.1', { '2.1': 'AA', '2.2': 'AA' }),
  sc('1.3.6', '2.1', { '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.4.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.4.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.4.3', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('1.4.4', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('1.4.5', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('1.4.6', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.4.7', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.4.8', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.4.9', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.4.10', '2.1', { '2.1': 'AA', '2.2': 'AA' }),
  sc('1.4.11', '2.1', { '2.1': 'AA', '2.2': 'AA' }),
  sc('1.4.12', '2.1', { '2.1': 'AA', '2.2': 'AA' }),
  sc('1.4.13', '2.1', { '2.1': 'AA', '2.2': 'AA' }),
  sc('2.1.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.1.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.1.3', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.1.4', '2.1', { '2.1': 'A', '2.2': 'A' }),
  sc('2.2.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.2.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.2.3', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.2.4', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.2.5', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.2.6', '2.1', { '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.3.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.3.2', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.3.3', '2.1', { '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.4.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.4.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.4.3', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.4.4', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.4.5', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('2.4.6', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('2.4.7', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('2.4.8', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.4.9', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.4.10', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.4.11', '2.2', { '2.2': 'AA' }),
  sc('2.4.12', '2.2', { '2.2': 'AAA' }),
  sc('2.4.13', '2.2', { '2.2': 'AAA' }),
  sc('2.5.1', '2.1', { '2.1': 'A', '2.2': 'A' }),
  sc('2.5.2', '2.1', { '2.1': 'A', '2.2': 'A' }),
  sc('2.5.3', '2.1', { '2.1': 'A', '2.2': 'A' }),
  sc('2.5.4', '2.1', { '2.1': 'A', '2.2': 'A' }),
  sc('2.5.5', '2.1', { '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.5.6', '2.1', { '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.5.7', '2.2', { '2.2': 'AA' }),
  sc('2.5.8', '2.2', { '2.2': 'AA' }),
  sc('3.1.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('3.1.2', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('3.1.3', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('3.1.4', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('3.1.5', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('3.1.6', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('3.2.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('3.2.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('3.2.3', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('3.2.4', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('3.2.5', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('3.2.6', '2.2', { '2.2': 'A' }),
  sc('3.3.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('3.3.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('3.3.3', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('3.3.4', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('3.3.5', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('3.3.6', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('3.3.7', '2.2', { '2.2': 'A' }),
  sc('3.3.8', '2.2', { '2.2': 'AA' }),
  sc('3.3.9', '2.2', { '2.2': 'AAA' }),
  sc('4.1.1', '2.0', { '2.0': 'A', '2.1': 'A' }, '2.2'),
  sc('4.1.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('4.1.3', '2.1', { '2.1': 'AA', '2.2': 'AA' }),
]);

// Each criterion's title as WCAG 2.2 gives it (2.1 named 2.5.5 "Target
// Size"; 4.1.1, which 2.2 removed, is 2.1's).
const WCAG_TITLES = {
  "1.1.1": "Non-text Content",
  "1.2.1": "Audio-only and Video-only (Prerecorded)",
  "1.2.2": "Captions (Prerecorded)",
  "1.2.3": "Audio Description or Media Alternative (Prerecorded)",
  "1.2.4": "Captions (Live)",
  "1.2.5": "Audio Description (Prerecorded)",
  "1.2.6": "Sign Language (Prerecorded)",
  "1.2.7": "Extended Audio Description (Prerecorded)",
  "1.2.8": "Media Alternative (Prerecorded)",
  "1.2.9": "Audio-only (Live)",
  "1.3.1": "Info and Relationships",
  "1.3.2": "Meaningful Sequence",
  "1.3.3": "Sensory Characteristics",
  "1.3.4": "Orientation",
  "1.3.5": "Identify Input Purpose",
  "1.3.6": "Identify Purpose",
  "1.4.1": "Use of Color",
  "1.4.2": "Audio Control",
  "1.4.3": "Contrast (Minimum)",
  "1.4.4": "Resize Text",
  "1.4.5": "Images of Text",
  "1.4.6": "Contrast (Enhanced)",
  "1.4.7": "Low or No Background Audio",
  "1.4.8": "Visual Presentation",
  "1.4.9": "Images of Text (No Exception)",
  "1.4.10": "Reflow",
  "1.4.11": "Non-text Contrast",
  "1.4.12": "Text Spacing",
  "1.4.13": "Content on Hover or Focus",
  "2.1.1": "Keyboard",
  "2.1.2": "No Keyboard Trap",
  "2.1.3": "Keyboard (No Exception)",
  "2.1.4": "Character Key Shortcuts",
  "2.2.1": "Timing Adjustable",
  "2.2.2": "Pause, Stop, Hide",
  "2.2.3": "No Timing",
  "2.2.4": "Interruptions",
  "2.2.5": "Re-authenticating",
  "2.2.6": "Timeouts",
  "2.3.1": "Three Flashes or Below Threshold",
  "2.3.2": "Three Flashes",
  "2.3.3": "Animation from Interactions",
  "2.4.1": "Bypass Blocks",
  "2.4.2": "Page Titled",
  "2.4.3": "Focus Order",
  "2.4.4": "Link Purpose (In Context)",
  "2.4.5": "Multiple Ways",
  "2.4.6": "Headings and Labels",
  "2.4.7": "Focus Visible",
  "2.4.8": "Location",
  "2.4.9": "Link Purpose (Link Only)",
  "2.4.10": "Section Headings",
  "2.4.11": "Focus Not Obscured (Minimum)",
  "2.4.12": "Focus Not Obscured (Enhanced)",
  "2.4.13": "Focus Appearance",
  "2.5.1": "Pointer Gestures",
  "2.5.2": "Pointer Cancellation",
  "2.5.3": "Label in Name",
  "2.5.4": "Motion Actuation",
  "2.5.5": "Target Size (Enhanced)",
  "2.5.6": "Concurrent Input Mechanisms",
  "2.5.7": "Dragging Movements",
  "2.5.8": "Target Size (Minimum)",
  "3.1.1": "Language of Page",
  "3.1.2": "Language of Parts",
  "3.1.3": "Unusual Words",
  "3.1.4": "Abbreviations",
  "3.1.5": "Reading Level",
  "3.1.6": "Pronunciation",
  "3.2.1": "On Focus",
  "3.2.2": "On Input",
  "3.2.3": "Consistent Navigation",
  "3.2.4": "Consistent Identification",
  "3.2.5": "Change on Request",
  "3.2.6": "Consistent Help",
  "3.3.1": "Error Identification",
  "3.3.2": "Labels or Instructions",
  "3.3.3": "Error Suggestion",
  "3.3.4": "Error Prevention (Legal, Financial, Data)",
  "3.3.5": "Help",
  "3.3.6": "Error Prevention (All)",
  "3.3.7": "Redundant Entry",
  "3.3.8": "Accessible Authentication (Minimum)",
  "3.3.9": "Accessible Authentication (Enhanced)",
  "4.1.1": "Parsing",
  "4.1.2": "Name, Role, Value",
  "4.1.3": "Status Messages"
};
const WCAG_TITLES_21 = { '2.5.5': 'Target Size' };

// A criterion's title in a WCAG version ('2.2' by default), or null.
function wcagTitle(sc, version = '2.2') {
  const number = String(sc || '').trim();
  if (String(version) === '2.1' && WCAG_TITLES_21[number]) return WCAG_TITLES_21[number];
  return Object.prototype.hasOwnProperty.call(WCAG_TITLES, number) ? WCAG_TITLES[number] : null;
}

// The ids WCAG 2.1 gave differently: its 2.5.5 was "Target Size" (the
// 2.1 Recommendation includes sc/21/target-size.html), renamed in 2.2.
const W3C_IDS_21 = { '2.5.5': 'target-size' };

// A criterion's pages in a WCAG version: its place in the Recommendation and
// its Understanding document, which explains its intent and the techniques
// that meet it. For 2.2 and 2.1; null for 2.0, whose anchors are of another
// kind, and for a number the version does not have.
function wcagLinks(sc, version = '2.2') {
  const number = String(sc || '').trim();
  const criterion = WCAG_CRITERIA.find((c) => c.sc === number);
  const v = String(version);
  if (!criterion || (v !== '2.2' && v !== '2.1')) return null;
  if (!criterion.levels[v] && criterion.removed !== v) return null;
  const id = v === '2.1' ? W3C_IDS_21[number] || criterion.id : criterion.id;
  const tr = v === '2.1' ? 'WCAG21' : 'WCAG22';
  return {
    url: 'https://www.w3.org/TR/' + tr + '/#' + id,
    understandingUrl: 'https://www.w3.org/WAI/' + tr + '/Understanding/' + id + '.html'
  };
}

module.exports = { WCAG_VERSIONS, WCAG_CRITERIA, WCAG_TITLES, wcagLinks, wcagTitle };
