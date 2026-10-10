/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

// surea11y public API: the generated core surface verbatim, plus the one
// helper for reading a cross-frame result that the reporters share.
const core = require('./core');
const { flattenCrossFrameResult } = require('./scan-result');

// engineOptions.packs (src/pack.js): the Node entry points below run a scan,
// or answer a catalog question, on an engine prepared with the packs, with
// the rest of the options as given. Without packs they are core's own,
// called as they always were; src/pack.js is only loaded once packs are
// passed. runa11yCoreInPage stays core's: it is serialized into pages
// (page.evaluate), so it can't be wrapped.
function withPacks(engineOptions) {
  if (!engineOptions || typeof engineOptions !== 'object') return null;
  const { packs, ...rest } = engineOptions;
  if (packs !== undefined && !Array.isArray(packs)) {
    const message =
      'engineOptions.packs must be a list of packs ([pack]), and is ' +
      (packs === null ? 'null' : typeof packs);
    if (require('./core/engine-options.js').strictOf(engineOptions)) {
      const err = new TypeError(message + ' (strictOptions)');
      err.code = 'INVALID_ENGINE_OPTIONS';
      throw err;
    }
    try {
      console.warn(`[surea11y] ${message}; it runs without packs.`);
    } catch {}
    return null;
  }
  if (!Array.isArray(packs) || !packs.length) return null;
  const engine = require('./pack.js').preparePacks(packs, {
    strict: require('./core/engine-options.js').strictOf(engineOptions)
  });
  for (const s of engine.skipped) {
    try {
      console.warn(`[surea11y] engineOptions.packs: ${s.name || 'a pack'} skipped: ${s.reason}`);
    } catch {}
  }
  return { engine, engineOptions: rest };
}

// A result of a scan with packs names them (engine.packs, as name@version),
// lists the core rules they replace with the overrides of customRules
// (overriddenBuiltinIds), and the packs it skipped (skippedPacks) when there
// are any.
function stampPacks(result, engine) {
  const stamp = (r) =>
    r && typeof r === 'object'
      ? {
          ...r,
          engine: { ...r.engine, packs: engine.packs.slice() },
          ...(engine.overrides.length
            ? {
                overriddenBuiltinIds: Array.from(
                  new Set((r.overriddenBuiltinIds || []).concat(engine.overrides))
                ).sort()
              }
            : {}),
          ...(engine.skipped.length ? { skippedPacks: engine.skipped.map((s) => ({ ...s })) } : {})
        }
      : r;
  return result && typeof result.then === 'function' ? result.then(stamp) : stamp(result);
}

function runDomRulesInPage(pageUrl, contextSelector, engineOptions, runOnly) {
  const p = withPacks(engineOptions);
  if (!p) {
    // packs: [] is a scan without packs, and reads as one: not echoed.
    let options = engineOptions;
    if (
      options &&
      typeof options === 'object' &&
      Array.isArray(options.packs) &&
      !options.packs.length
    ) {
      const { packs, ...rest } = options;
      void packs;
      options = rest;
    }
    return core.runDomRulesInPage(pageUrl, contextSelector, options, runOnly);
  }
  return stampPacks(
    p.engine.runtime.runDomRulesInPage(pageUrl, contextSelector, p.engineOptions, runOnly),
    p.engine
  );
}

function getCheckDefById(ruleId, engineOptions) {
  const p = withPacks(engineOptions);
  return p
    ? p.engine.runtime.getCheckDefById(ruleId, p.engineOptions)
    : core.getCheckDefById(ruleId, engineOptions);
}

function getChecksCatalog(engineOptions) {
  const p = withPacks(engineOptions);
  return p
    ? p.engine.runtime.getChecksCatalog(p.engineOptions)
    : core.getChecksCatalog(engineOptions);
}

function getRulesCatalog(engineOptions) {
  const p = withPacks(engineOptions);
  return p
    ? p.engine.runtime.getRulesCatalog(p.engineOptions)
    : core.getRulesCatalog(engineOptions);
}

function getCompositeRuleById(ruleId, engineOptions) {
  const p = withPacks(engineOptions);
  return p
    ? p.engine.runtime.getCompositeRuleById(ruleId, p.engineOptions)
    : core.getCompositeRuleById(ruleId, engineOptions);
}

function getChecksForRunOnly(runOnly, engineOptions) {
  const p = withPacks(engineOptions);
  return p
    ? p.engine.runtime.getChecksForRunOnly(runOnly, p.engineOptions)
    : core.getChecksForRunOnly(runOnly, engineOptions);
}

function getTestsForRunOnly(runOnly, engineOptions) {
  const p = withPacks(engineOptions);
  return p
    ? p.engine.runtime.getTestsForRunOnly(runOnly, p.engineOptions)
    : core.getTestsForRunOnly(runOnly, engineOptions);
}

module.exports = {
  ...core,
  getCheckDefById,
  getChecksCatalog,
  getRulesCatalog,
  getCompositeRuleById,
  getChecksForRunOnly,
  getTestsForRunOnly,
  runDomRulesInPage,
  flattenCrossFrameResult
};
