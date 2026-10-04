/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check landmark-unique
 * @atomic true
 * @summary Landmarks sharing the same role must have unique accessible names
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies whenever two or more landmark regions on the page share the
 *   same landmark role (banner, contentinfo, main, navigation,
 *   complementary, region, form, or search).
 * @expectation
 *   Among landmarks sharing a role, each has a distinct accessible name
 *   (via aria-label/aria-labelledby; landmarks are not named from
 *   content). Two same-role landmarks with the same name (including two
 *   both left unnamed) are indistinguishable to assistive technology
 *   users navigating by landmark.
 *   A shared name is reported as CANTTELL, never as a failure: the ARIA
 *   Authoring Practices allow one when the landmarks have the same content
 *   and purpose, such as pagination repeated above and below a table,
 *   which only a person can confirm. Two unnamed landmarks need names
 *   either way, and the same allowance then applies to those names.
 * @reports
 *   - `role`: the landmark role the colliding landmarks share, such as
 *     `navigation`.
 *   - `name`: the name they share, in lowercase with spacing collapsed.
 *     Empty when they are all unnamed.
 *   - `groupSize`: how many landmarks of that role share that name.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory `type: 'manual'` rule; see
 *   landmark-banner-is-top-level's header comment for the shared rationale
 *   and the landmark-detection model (`helpers.getLandmarkRole`).
 * - Reports `pass` when every same-role group has distinct names: that
 *   needs no judgment. A shared name stays `cantTell` rather than `fail`
 *   because the APG allows one when the landmarks' content is identical,
 *   such as pagination above and below a table, which only a person can
 *   confirm.
 * - Flags every element within a colliding-name cluster (two or more
 *   same-role landmarks sharing one normalized name), not just the
 *   "extra" ones.
 */

const id = 'landmark-unique';

const meta = {
  title: 'Landmarks with the same role must have unique names',
  description:
    'Checks that when two or more landmarks share the same role, each has a distinct accessible name.',
  i18n: {
    titleKey: 'landmarkUnique_title',
    descriptionKey: 'landmarkUnique_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'landmarks', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Landmarks are named by aria-labelledby, aria-label, then title, never by
  // content; see helpers.getLandmarkNameInfo in src/core/dom-helpers.js.
  function getAccessibleLandmarkName(el) {
    try {
      if (helpers && typeof helpers.getLandmarkNameInfo === 'function') {
        const info = helpers.getLandmarkNameInfo(el, ctx);
        if (info && info.present && info.value) return normalizeWs(info.value);
      }
    } catch {}
    return '';
  }

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  function isExposedToAt(el) {
    if (!isAccTreeEligible) return true;
    try {
      const r = isAccTreeEligible(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  // queryAllSmart is shadow-DOM-aware: a third-party widget rendering its own
  // unnamed <nav>/<footer> inside a shadow root collides with the page's own
  // unnamed <nav>/<footer>, but plain querySelectorAll never reaches it.
  let nodes;
  try {
    nodes = helpers.queryAllSmart(helpers.landmarkCandidateSelector);
  } catch {
    nodes = [];
  }

  // Only landmarks actually exposed to assistive technology can collide.
  // Without this, responsive layouts that render both a desktop and a
  // mobile copy of the same named nav (one hidden via CSS at any given
  // viewport) are wrongly flagged as duplicate landmarks, since the hidden
  // copy is never reachable by AT and can't really collide with the
  // visible one.
  const byRole = new Map(); // role -> [{el, name}]
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isExposedToAt(el)) continue;
    const role = helpers.getLandmarkRole(el, ctx);
    if (!role) continue;
    const list = byRole.get(role) || [];
    list.push({ el, name: getAccessibleLandmarkName(el) });
    byRole.set(role, list);
  }

  const occurrences = [];
  let applicable = false;

  for (const [role, entries] of byRole) {
    if (entries.length <= 1) continue;
    applicable = true;

    const byName = new Map(); // normalized name -> entries[]
    for (const entry of entries) {
      const key = entry.name.toLowerCase();
      const list = byName.get(key) || [];
      list.push(entry);
      byName.set(key, list);
    }

    for (const [normalizedName, group] of byName) {
      if (group.length <= 1) continue;

      for (const { el } of group) {
        occurrences.push(
          helpers.reportOccurrence(el, {
            summary: normalizedName
              ? `This ${role} landmark shares its accessible name with another ${role} landmark.`
              : `This ${role} landmark has no accessible name, and more than one unnamed ${role} landmark exists on this page.`,
            hint: `Give each ${role} landmark a distinct name via aria-label or aria-labelledby, unless they have the same content and purpose, such as pagination repeated above and below a table, where the ARIA Authoring Practices allow the same name.`,
            i18n: {
              summaryKey: normalizedName
                ? 'landmarkUnique_summary_cantTell_duplicateName'
                : 'landmarkUnique_summary_cantTell_bothUnnamed',
              hintKey: 'landmarkUnique_hint_cantTell',
              params: { role }
            },
            data: {
              details: {
                reasonCode: 'LANDMARK_NOT_UNIQUE',
                role,
                name: normalizedName,
                groupSize: group.length
              }
            }
          })
        );
      }
    }
  }

  if (!applicable) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
