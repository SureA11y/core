/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check server-side-image-map-absent
 * @atomic true
 * @summary A server-side image map (ismap) needs a keyboard-operable alternative
 * @standard WCAG 2.2
 * @sc 2.1.1
 * @applicability
 *   Applies to any scan scope. An <img ismap> inside an <a href> is a
 *   server-side image map: the browser sends the click coordinates to the
 *   link's URL, which has no keyboard-operable equivalent and exposes no
 *   individual regions to assistive technology.
 * @expectation
 *   Each server-side image map is reported as cantTell: 2.1.1 is met when
 *   the same destinations are also offered as links a keyboard can reach,
 *   which the rule cannot verify.
 *   Client-side image maps (<map>/<area>) are not flagged.
 *   A scope with no <img ismap> passes. One whose only <img ismap> elements
 *   are outside a link is notApplicable: ismap does nothing there, so there
 *   is no server-side image map (the misplaced attribute is invalid HTML,
 *   a matter for the validator).
 * @implementation-notes
 * - There is no automatable way to verify that a usable alternative exists
 *   elsewhere on the page, so the rule never fails.
 */

const id = 'server-side-image-map-absent';

const meta = {
  title: 'Server-side image maps must have a keyboard-operable alternative',
  description:
    'Asks, for each <img ismap> inside a link, whether the page offers the same destinations as links a keyboard can reach, since a server-side image map has no keyboard-operable regions of its own.',
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
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('img[ismap]')
    : helpers.queryAll('img[ismap]');

  const occurrences = [];

  for (const el of nodes) {
    if (!el) continue;

    // ismap does something only on an image inside a hyperlink.
    let link;
    try {
      link = dom.get(el, 'closest') ? dom.closest(el, 'a[href]') : null;
    } catch {
      link = null;
    }
    if (!link) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          'This image is a server-side image map (ismap inside a link), whose regions cannot be reached from the keyboard.',
        hint: 'Check that the page offers the same destinations as separate links. Better: replace the server-side image map with a client-side image map (<map>/<area>) or separate links/buttons.',
        occurrenceOutcome: 'cantTell',
        i18n: {
          summaryKey: 'serverSideImageMapAbsent_summary_cantTell',
          hintKey: 'serverSideImageMapAbsent_hint_cantTell',
          params: {}
        },
        uncertainty: {
          code: 'equivalence-unknown',
          needed:
            'Whether the destinations of this image map are also offered as keyboard-operable links.',
          evidence: { href: dom.getAttribute(link, 'href') }
        },
        data: {
          details: { reasonCode: 'SERVER_SIDE_IMAGE_MAP' }
        }
      })
    );
  }

  // No <img ismap> at all is the passing case (see @expectation above);
  // ismap only outside links means there is no server-side image map.
  if (!nodes.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'serious',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
