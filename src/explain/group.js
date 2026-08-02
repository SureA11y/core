'use strict';

const { coarseStructuralSignature } = require('./coarse-signature');

// docs/ai-assisted-explanations.design.md §5: dedup by
// `ruleId + reasonCode + a coarse structural signature`, one explanation
// generated per group, applied to every occurrence in that group -- so a page
// with 50 near-identical missing-alt images costs one prompt entry, not 50.
function computeGroupKey(ruleId, reasonCode, selector) {
  return `${ruleId}|${reasonCode}|${coarseStructuralSignature(selector)}`;
}

// Read-only: groups a finished scan result's occurrences by groupKey without
// mutating anything, so a consumer can inspect group count/cost *before*
// deciding to call explain() (§5's budget-cap concern) without spending a
// provider call to find out. explain() itself calls this on its own working
// copy (see index.js) -- calling it directly here on the original result is
// equally safe, since it only ever reads.
function buildExplainGroups(result, { redactHtml = false } = {}) {
  const groupsByKey = new Map();

  for (const check of (result && result.checksResults) || []) {
    if (!check || !Array.isArray(check.occurrences) || check.occurrences.length === 0) continue;

    const normativeMappings = (check.meta && check.meta.normativeMappings) || [];

    for (const occurrence of check.occurrences) {
      if (!occurrence) continue;

      const reasonCode =
        (occurrence.data && occurrence.data.details && occurrence.data.details.reasonCode) ||
        'DEFAULT';
      const groupKey = computeGroupKey(check.ruleId, reasonCode, occurrence.selector);

      let group = groupsByKey.get(groupKey);
      if (!group) {
        group = {
          groupKey,
          ruleId: check.ruleId,
          title: check.title,
          description: check.description,
          normativeMappings,
          reasonCode,
          summary: occurrence.summary,
          hint: occurrence.hint,
          selector: occurrence.selector,
          html: redactHtml ? undefined : occurrence.html,
          dataDetails: (occurrence.data && occurrence.data.details) || null,
          occurrences: []
        };
        groupsByKey.set(groupKey, group);
      }
      group.occurrences.push(occurrence);
    }
  }

  return Array.from(groupsByKey.values());
}

module.exports = { buildExplainGroups, computeGroupKey };
