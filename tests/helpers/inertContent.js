'use strict';

// The rules that still judge content inside an [inert] subtree, on purpose,
// and a page with its body inside <div inert>, for the inert-content tests
// (tests/engine-checks/inert-content*.test.js).

// Rules that still judge inert content, and why.
const JUDGED_WHEN_INERT = {
  // About the document itself, which inert on its content doesn't change.
  'aria-hidden-body': 'document',
  'html-lang-attr-present': 'document',
  'html-xml-lang-mismatch': 'document',
  'meta-refresh-no-exceptions': 'document',
  'meta-refresh-timing-absent': 'document',
  'meta-viewport-large': 'document',
  'meta-viewport-zoom-enabled': 'document',
  'page-title-present': 'document',
  'page-title-patterns': 'document',
  'manual-review': 'document',
  // About the page's structure: inert content counts as absent, so a page
  // whose content is all inert has no heading, main or bypass to find.
  'bypass-blocks-present': 'structure',
  'landmark-one-main': 'structure',
  'page-has-heading-one': 'structure',
  // About how content looks: inert content is still drawn (and a marquee
  // still moves).
  'contrast-minimum': 'drawn',
  'contrast-enhanced': 'drawn',
  'contrast-computable': 'drawn',
  'avoid-inline-spacing': 'drawn',
  'css-orientation-lock': 'drawn',
  'text-spacing-content-loss': 'drawn',
  'deprecated-elements-not-used': 'drawn',
  'moving-content-pausable': 'drawn',
  // About the markup: a duplicate id breaks the same lookups when inert.
  'duplicate-id': 'markup',
  'duplicate-id-aria': 'markup',
  // About whether assistive technology can reach a live region: an inert
  // one is what the rule asks about.
  'live-region-announcements': 'reach',
  // About sound and video, which an inert page still plays.
  'no-autoplay-audio': 'sound',
  'video-caption': 'media'
};

const inertPage = (page) =>
  page.replace(/<body([^>]*)>/i, '<body$1><div inert>').replace(/<\/body>/i, '</div></body>');

module.exports = { JUDGED_WHEN_INERT, inertPage };
