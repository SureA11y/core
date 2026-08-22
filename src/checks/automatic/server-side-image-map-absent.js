/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check server-side-image-map-absent
 * @atomic true
 * @summary <img> must not use a server-side image map (ismap)
 * @standard WCAG 2.2
 * @sc 2.1.1
 * @applicability
 *   Applies to <img> elements that carry an ismap attribute.
 * @expectation
 *   The image does not use ismap at all. Server-side image maps depend on
 *   the browser sending click coordinates to the server, which has no
 *   keyboard-operable equivalent, there is no way to determine or expose
 *   individual clickable regions to assistive technology or keyboard
 *   users. Client-side image maps (<map>/<area>, each with real href/alt)
 *   are the accessible alternative and are not flagged by this rule.
 * @implementation-notes
 * - Presence of ismap is itself the violation (there is no automatable way
 *   to verify a "usable alternative" exists elsewhere on the page).
 */

const id = 'server-side-image-map-absent';

const meta = {
  title: 'Images must not use a server-side image map',
  description:
    'Checks that <img> elements do not carry the ismap attribute (server-side image maps have no keyboard-operable equivalent).',
  i18n: {
    titleKey: 'serverSideImageMapAbsent_title',
    descriptionKey: 'serverSideImageMapAbsent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag211', 'structure', 'atomic', 'automatic', 'keyboard'],
  wcagSc: ['2.1.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.1.1',
      title: 'Keyboard',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '2.1.1': ['server-side-image-map-absent'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('img[ismap]')
    : helpers.queryAll('img[ismap]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el) continue;

    applicableCount += 1;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          'This image uses a server-side image map, which has no keyboard-operable equivalent.',
        hint: 'Replace the server-side image map (ismap) with a client-side image map (<map>/<area>) or separate accessible links/buttons.',
        i18n: {
          summaryKey: 'serverSideImageMapAbsent_summary_fail',
          hintKey: 'serverSideImageMapAbsent_hint_fail',
          params: {}
        },
        data: {
          details: { reasonCode: 'SERVER_SIDE_IMAGE_MAP' }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
