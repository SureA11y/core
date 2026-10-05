/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check contrast-minimum-rgaa
 * @atomic true
 * @summary Text must meet RGAA's contrast ratio for its size, with bold text large from 18.5px
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   The same text as contrast-minimum: visible text that contrast-computable
 *   applies to, narrowed to text whose background and foreground are
 *   computable. Eligible text that is not computable leaves this rule
 *   notApplicable; contrast-computable asks about it.
 * @expectation
 *   Every computable text node reaches the ratio RGAA 3.2 requires for its
 *   size: 3:1 for text of 24px or more (3.2.3), and for bold text (computed
 *   weight 700 or more) of 18.5px or more (3.2.4); 4.5:1 for everything
 *   else (3.2.1, 3.2.2). The only difference from contrast-minimum is the
 *   bold threshold: WCAG's 14pt is about 18.67px, so bold text from 18.5px
 *   up to 18.67px needs 3:1 here and 4.5:1 there.
 * @implementation-notes
 * - A variant of contrast-minimum (docs/RULE_AUTHORING.md, "Rule
 *   variants"): its code, with bold text large from 18.5px. The other
 *   thresholds are WCAG's and RGAA's alike. Its verdicts are cached apart
 *   from contrast-minimum's, since the thresholds differ.
 * - Like contrast-minimum, it does not look for a mechanism that shows the
 *   text with enough contrast (3.2.x, second condition), nor for RGAA's
 *   particular cases (logos, decorative text) beyond the disabled controls
 *   the shared text scan leaves out.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'contrast-minimum-rgaa';

const meta = {
  title: 'Text meets RGAA minimum color contrast',
  description:
    'Checks that visible text has a contrast ratio of at least 4.5:1, or 3:1 for text of 24px or more and bold text of 18.5px or more (RGAA 3.2), when contrast is computable from CSS.',
  i18n: {
    titleKey: 'contrastMinimumRgaa_title',
    descriptionKey: 'contrastMinimumRgaa_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'contrast', 'color', 'atomic', 'automatic', 'dom'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  // Its base's code reports the closest passing text as a margin.
  margin: { measure: 'contrast-ratio', unit: 'ratio', limit: 'min' }
};

// RGAA 3.2.2/3.2.4: bold text is large from 18.5px.
const config = { boldLargeMinPx: 18.5 };

module.exports = { id, from: 'contrast-minimum', config, meta };
