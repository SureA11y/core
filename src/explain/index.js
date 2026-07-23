'use strict';

// AI-assisted explanations -- optional, host-only post-processing layer.
// See docs/ai-assisted-explanations.design.md. Never required by
// scripts/build-core.js, never inlined into src/core.js, never runs inside
// runInPage -- this file is plain Node code a consumer requires directly
// (e.g. require('a11y-core/src/explain')).

const { buildExplainGroups } = require('./group');

// §4.3/§4.4's input contract: what the provider function actually receives
// per group. Deliberately excludes internal bookkeeping (the `occurrences`
// array of live references) -- the provider only needs facts, not our
// attachment plumbing.
function toPromptInput(group) {
  return {
    groupKey: group.groupKey,
    ruleId: group.ruleId,
    title: group.title,
    description: group.description,
    normativeMappings: group.normativeMappings,
    reasonCode: group.reasonCode,
    summary: group.summary,
    hint: group.hint,
    selector: group.selector,
    html: group.html,
    data: { details: group.dataDetails }
  };
}

// §4.4's output contract is deliberately loose: accepts an array of
// { groupKey, text, provider? }, or a plain object map keyed by groupKey
// (value either a string or a { text, provider? } object). Anything that
// doesn't match either shape is ignored, not thrown on -- a malformed
// provider response degrades the same way a throwing one does (§6).
function normalizeProviderOutput(raw) {
  const byGroupKey = new Map();
  if (!raw) return byGroupKey;

  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (entry && typeof entry.groupKey === 'string' && typeof entry.text === 'string') {
        byGroupKey.set(entry.groupKey, {
          text: entry.text,
          provider: typeof entry.provider === 'string' ? entry.provider : undefined
        });
      }
    }
    return byGroupKey;
  }

  if (typeof raw === 'object') {
    for (const [groupKey, value] of Object.entries(raw)) {
      if (typeof value === 'string') {
        byGroupKey.set(groupKey, { text: value, provider: undefined });
      } else if (value && typeof value.text === 'string') {
        byGroupKey.set(groupKey, {
          text: value.text,
          provider: typeof value.provider === 'string' ? value.provider : undefined
        });
      }
    }
  }

  return byGroupKey;
}

// Shallow-clones only the spine this module ever writes to (top-level result
// -> checksResults[] -> occurrences[]). Deliberately not a deep clone
// (structuredClone included): engineOptions.customRules (echoed back onto
// checksResults[i].engineOptions, see dom-runner.js) may hold live Function
// references when a caller registered a real-function custom rule, which
// structuredClone cannot serialize and would throw on. Every field this
// module doesn't touch (meta, engineOptions, data, rulesResults, ...) is
// shared by reference with the input, which is safe precisely because this
// module only ever adds a new `explanation` key to occurrence copies -- it
// never mutates an existing field (§2 Goals).
function cloneForExplain(result) {
  const cloned = { ...result };
  cloned.checksResults = (result.checksResults || []).map((check) => {
    const clonedCheck = { ...check };
    clonedCheck.occurrences = (check.occurrences || []).map((occurrence) => ({ ...occurrence }));
    return clonedCheck;
  });
  return cloned;
}

async function explain(result, options = {}) {
  const { provider, budget = Infinity, redactHtml = false, providerName } = options;

  if (typeof provider !== 'function') {
    throw new TypeError(
      'explain(result, { provider }): options.provider must be a function -- see docs/ai-assisted-explanations.design.md §4.4'
    );
  }
  if (!result || !Array.isArray(result.checksResults)) {
    throw new TypeError('explain(result, options): result must be a finished a11y-core scan result (missing checksResults)');
  }

  const augmented = cloneForExplain(result);
  const groups = buildExplainGroups(augmented, { redactHtml });
  if (groups.length === 0) return augmented;

  const budgeted = Number.isFinite(budget) ? groups.slice(0, Math.max(0, budget)) : groups;
  if (budgeted.length === 0) return augmented;

  // §5: one batched call per explain() invocation, not one per group -- the
  // provider function is free to loop/chunk internally if its own API/model
  // doesn't support batching well (§4.4), but explain() itself never loops.
  let raw;
  try {
    raw = await provider(budgeted.map(toPromptInput));
  } catch {
    // §6/§2: no-throw, degrade invisibly -- explanations simply stay absent.
    return augmented;
  }

  const byGroupKey = normalizeProviderOutput(raw);
  if (byGroupKey.size === 0) return augmented;

  const generatedAt = new Date().toISOString();
  for (const group of budgeted) {
    const entry = byGroupKey.get(group.groupKey);
    if (!entry) continue; // partial/incomplete provider response -- never fabricated (§4.2)
    for (const occurrence of group.occurrences) {
      occurrence.explanation = {
        present: true,
        text: entry.text,
        provider: entry.provider || providerName || 'unknown',
        generatedAt,
        groupKey: group.groupKey,
        advisory: true
      };
    }
  }

  return augmented;
}

module.exports = { explain, buildExplainGroups, toPromptInput };
