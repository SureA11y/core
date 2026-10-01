/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check acme-contrast-uniform
 * @atomic true
 * @summary All text, large text included, must reach a contrast ratio of 4.5:1 (ACME B2)
 * @standard ACME 1.0 and 2.0, B2 (no WCAG Success Criterion of its own)
 * @applicability
 *   The same text as contrast-minimum: visible text whose background and
 *   foreground are computable.
 * @expectation
 *   Every computable text node reaches 4.5:1, whatever its size. WCAG 1.4.3
 *   asks only 3:1 of large text; ACME does not make that exception.
 * @implementation-notes
 * - A variant of contrast-minimum (docs/RULE_AUTHORING.md, "Rule
 *   variants"): its code, with large text needing 4.5:1 as well.
 * - ACME is a made-up standard that tests the profile model; it never ships.
 */

const id = 'acme-contrast-uniform';

const meta = {
  title: 'All text reaches a contrast ratio of 4.5:1',
  description:
    'Checks that visible text, large text included, has a contrast ratio of at least 4.5:1, when contrast is computable from CSS.',
  i18n: {
    titleKey: 'acmeContrastUniform_title',
    descriptionKey: 'acmeContrastUniform_description'
  },
  helpUrl: null,
  tags: ['acme', 'contrast', 'color', 'atomic', 'automatic', 'dom'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

// ACME B2: large text needs 4.5:1 too.
const config = { largeTextRatio: 4.5 };

module.exports = { id, from: 'contrast-minimum', config, meta };
