/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check sample-contrast-enhanced
 * @atomic true
 * @summary Text reaches a contrast ratio of 7:1 (4.5:1 for large text)
 * @standard Sample Standard S7
 * @applicability
 *   As contrast-minimum.
 * @expectation
 *   As contrast-minimum, with the sample standard's thresholds: a variant of
 *   it (docs/RULE_AUTHORING.md, "Rule variants").
 */

const id = 'sample-contrast-enhanced';

const config = { normalTextRatio: 7, largeTextRatio: 4.5 };

const meta = {
  title: 'Text reaches a contrast ratio of 7:1',
  description: 'Checks text contrast against the sample standard: 7:1, or 4.5:1 for large text.',
  i18n: {
    titleKey: 'sampleContrastEnhanced_title',
    descriptionKey: 'sampleContrastEnhanced_description'
  },
  helpUrl: null,
  tags: ['sample', 'color', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

module.exports = { id, from: 'contrast-minimum', config, meta };
