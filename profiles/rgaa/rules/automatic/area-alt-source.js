/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check area-alt-source
 * @atomic true
 * @summary A linked <area> must be named by alt or aria-label
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <area href> elements in a <map> that an <img usemap>
 *   references, when the <img> is rendered, and that carry at least one
 *   non-empty name source: alt, aria-label, aria-labelledby or title. An
 *   <area> with none is left to area-alt-present. An <area> hidden from
 *   assistive technologies (aria-hidden="true") is left out. A page with
 *   none is notApplicable.
 * @expectation
 *   The <area> has a non-empty alt or aria-label, the two sources RGAA 1.1.2
 *   step 3 lists (the glossary entry "Alternative textuelle (image)" gives
 *   no aria-labelledby or title source for <area>). An <area> named only by
 *   title or aria-labelledby fails. A linked <area> always carries
 *   information: a decorative one has no href (1.2.2).
 * @implementation-notes
 * - The map is matched to the <img usemap> by name (or id), case-
 *   insensitively, as area-alt-present does.
 * - The glossary adds that, where assistive technologies only partly support
 *   the name calculation, the value they really render counts. That leaves
 *   some room for aria-labelledby; the rule follows the methodology's list.
 * - Opt-in (tag `rgaa`): WCAG accepts any accessible name, so the rule runs
 *   only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 */

const id = 'area-alt-source';

const meta = {
  title: 'Linked image-map areas are named by alt or aria-label',
  description:
    'Checks that each linked <area> of a used image map takes its text alternative from alt or aria-label, the two sources RGAA accepts, not only from title or aria-labelledby.',
  i18n: {
    titleKey: 'areaAltSource_title',
    descriptionKey: 'areaAltSource_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'imagemap', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const doc = document || (root && root.ownerDocument) || null;

  const trim = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const attr = (el, name) => {
    try {
      return el.getAttribute(name);
    } catch {
      return null;
    }
  };

  const usedMaps = new Map();
  try {
    for (const img of Array.from(doc ? doc.querySelectorAll('img[usemap]') : [])) {
      const raw = trim(attr(img, 'usemap'));
      const name = (raw[0] === '#' ? raw.slice(1) : raw).toLowerCase();
      if (name && !usedMaps.has(name)) usedMaps.set(name, img);
    }
  } catch {}

  function referencingImg(area) {
    const map = area.closest ? area.closest('map') : null;
    if (!map) return null;
    const name = trim(attr(map, 'name') || attr(map, 'id')).toLowerCase();
    return name ? usedMaps.get(name) || null : null;
  }

  function imgRendered(img) {
    if (!helpers.isDomVisibleEligible) return true;
    try {
      const vis = helpers.isDomVisibleEligible(img, ctx, {
        visibilityMode: 'styleOnly',
        disableGeometry: true
      });
      return !(vis && vis.eligible === false);
    } catch {
      return true;
    }
  }

  function labelledbyText(el) {
    if (!trim(attr(el, 'aria-labelledby'))) return '';
    if (helpers.getAriaLabelledByInfo) {
      try {
        const info = helpers.getAriaLabelledByInfo(el, ctx);
        return info && info.present ? trim(info.value) : '';
      } catch {}
    }
    return trim(attr(el, 'aria-labelledby'));
  }

  const areas = helpers.queryAllSmart
    ? helpers.queryAllSmart('area[href]')
    : helpers.queryAll('area[href]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of areas) {
    if (!el || !el.getAttribute) continue;
    if (!trim(attr(el, 'href'))) continue;
    if (trim(attr(el, 'aria-hidden')).toLowerCase() === 'true') continue;
    const img = referencingImg(el);
    if (!img || !imgRendered(img)) continue;

    const alt = trim(attr(el, 'alt'));
    const ariaLabel = trim(attr(el, 'aria-label'));
    const found = [];
    if (labelledbyText(el)) found.push('aria-labelledby');
    if (trim(attr(el, 'title'))) found.push('title');
    if (!alt && !ariaLabel && !found.length) continue;
    applicableCount += 1;
    if (alt || ariaLabel) continue;

    const sources = found.join(', ');
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This <area> is named only by ${sources}; RGAA accepts alt or aria-label.`,
        hint: 'Put the text alternative in the alt attribute (or in aria-label).',
        i18n: {
          summaryKey: 'areaAltSource_summary_fail',
          hintKey: 'areaAltSource_hint_fail',
          params: { sources }
        },
        data: {
          details: { reasonCode: 'unlistedNameSource', sources: found },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
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
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
