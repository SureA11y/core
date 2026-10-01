'use strict';

/**
 * Rule variants: a rule that is another rule with different settings, written
 * as data rather than as a copy of its code.
 *
 *   module.exports = {
 *     id: 'acme-contrast-uniform',
 *     from: 'contrast-minimum',          // the base rule
 *     config: { largeTextRatio: 4.5 },   // settings the base declares
 *     meta: { ... }                      // the variant's own, as any rule's
 *   };
 *
 * The base rule exports `settings`, the names it reads from ctx.config with
 * their defaults (docs/RULE_AUTHORING.md, "Rule variants"). The variant runs
 * the base's runInPage and applicability, with its `config` in ctx.config,
 * under its own id, meta and messages: every message key of the base's that
 * starts with the base's prefix (its meta.i18n.titleKey without `_title`) is
 * read from the variant's prefix instead, so the variant's dictionary needs
 * the same keys under its own prefix.
 */

function isVariant(mod) {
  return !!mod && typeof mod === 'object' && typeof mod.from === 'string';
}

// A rule's message prefix: its meta.i18n.titleKey without `_title`.
function messagePrefix(meta) {
  const key = meta && meta.i18n && meta.i18n.titleKey;
  return typeof key === 'string' && key.endsWith('_title') ? key.slice(0, -'_title'.length) : null;
}

// Resolve every variant among loaded modules ([{ file, mod }]) against its
// base. Returns { modules, problems }: `modules` in the same order, a variant
// replaced by a rule module with its base's runInPage and applicability and a
// `variant` field ({ of, file, config, messages: { from, to } }), where `file`
// is the base's; `problems` names every variant that cannot be resolved.
function resolveVariants(entries) {
  const byId = new Map();
  for (const e of entries) if (e.mod && typeof e.mod.id === 'string') byId.set(e.mod.id, e);
  const problems = [];
  const modules = entries.map((e) => {
    const mod = e.mod;
    if (!isVariant(mod)) return e;
    const where = `${mod.id || '(no id)'} (${e.file})`;
    const base = byId.get(mod.from);
    if (!base) {
      problems.push(`${where}: from names ${mod.from}, which is no rule`);
      return e;
    }
    if (isVariant(base.mod)) {
      problems.push(`${where}: ${mod.from} is itself a variant; derive from its base`);
      return e;
    }
    const settings =
      base.mod.settings && typeof base.mod.settings === 'object' ? base.mod.settings : null;
    if (!settings) {
      problems.push(`${where}: ${mod.from} declares no settings, so it has no variants`);
      return e;
    }
    const config = mod.config && typeof mod.config === 'object' ? mod.config : {};
    for (const [name, value] of Object.entries(config)) {
      if (!Object.prototype.hasOwnProperty.call(settings, name)) {
        problems.push(
          `${where}: ${mod.from} has no setting ${name} (it has: ${Object.keys(settings).join(', ')})`
        );
      } else if (
        settings[name] !== null &&
        value !== null &&
        typeof value !== typeof settings[name]
      ) {
        problems.push(`${where}: setting ${name} must be a ${typeof settings[name]}`);
      }
    }
    const from = messagePrefix(base.mod.meta);
    const to = messagePrefix(mod.meta);
    if (!to) problems.push(`${where}: meta.i18n.titleKey must end in _title`);
    return {
      file: e.file,
      mod: {
        id: mod.id,
        meta: mod.meta,
        runInPage: base.mod.runInPage,
        ...(typeof base.mod.applicability === 'function'
          ? { applicability: base.mod.applicability }
          : {}),
        variant: { of: base.mod.id, file: base.file, config: { ...config }, messages: { from, to } }
      }
    };
  });
  return { modules, problems };
}

module.exports = { isVariant, messagePrefix, resolveVariants };
