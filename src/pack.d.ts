// Types for @surea11y/core/pack (docs/ENGINE_OPTIONS.md, "Packs").

import type { CustomRule, CustomRuleMeta, RuleContext } from './index';

export { wcagTags } from './wcag';

/** A variant of a rule: its base's code with other values for the base's settings. */
export interface PackVariant {
  /** Starts with the pack's namespace and '-'. */
  id: string;
  /** The base rule: a core rule, or one of the pack's own. */
  from: string;
  /** Values for settings the base declares. */
  config?: Record<string, unknown>;
  meta?: CustomRuleMeta;
}

/** A pack's rule: a rule module, as core's (its id starts with the pack's namespace and '-'). */
export interface PackRule extends Omit<CustomRule, 'runInPage' | 'applicability'> {
  runInPage: (ctx: RuleContext) => unknown;
  applicability?: (ctx: RuleContext) => unknown;
  /** The values the rule reads from ctx.config, with their defaults, for its variants. */
  settings?: Record<string, unknown>;
}

/** A standard's registry entry. See ENTRY SHAPE in src/coverage/standards.js. */
export interface PackStandard {
  key: string;
  standard: string;
  versions: string[];
  profiles?: Record<
    string,
    {
      version: string;
      tags: string[];
      mappedRules?: boolean;
      /** Rules it runs by id besides those its tags select. */
      rules?: string[];
      exclude?: { rules?: string[]; criteria?: string[] };
      /** The severity it gives a rule in place of the rule's own. */
      severity?: Record<string, 'minor' | 'moderate' | 'serious' | 'critical'>;
    }
  >;
  mappingsFor: (rule: { id: string; wcagSc?: string[]; checksIds?: string[] }) => object[];
  ruleTag?: string;
  ruleMapped?: boolean;
  restatedPrefixes?: string[];
  composites?: () => object[];
  validate?: (rules: { ruleId: string; wcagSc: string[] }[]) => string[];
  report?: { noteKey?: string; titleLang?: string };
}

export interface Pack {
  name: string;
  /** The pack's own version, as '1.2.0'; results name it as name@version. */
  version: string;
  /** Every rule and variant id starts with it and '-'. */
  namespace: string;
  /** The core versions it works with, as '^1.11.0'. */
  core: string;
  /** The name a checklist's results and report show; the pack's name by default. */
  title?: string;
  description?: string;
  rules?: (PackRule | PackVariant)[];
  variants?: PackVariant[];
  /**
   * Core rule ids the pack's rules replace: each needs a rule of that id in
   * `rules`. Meta it doesn't give is the core rule's, by group (texts,
   * mapping, tags).
   */
  overrides?: string[];
  standard?: PackStandard;
  /**
   * A checklist's profiles, without a standard: each a selection by tags and
   * rule ids, with what it leaves out. Shorthand for a standard keyed by the
   * namespace.
   */
  profiles?: Record<
    string,
    {
      tags: string[];
      /** Rules it runs by id besides those its tags select; with `tags: []`, exactly these. */
      rules?: string[];
      exclude?: { rules?: string[]; criteria?: string[] };
      severity?: Record<string, 'minor' | 'moderate' | 'serious' | 'critical'>;
    }
  >;
  /** A checklist's items: each groups rules into one result, under its profiles. */
  rollups?: { id: string; title: string; description?: string; checksIds: string[] }[];
  /** The probes its rules read from engineOptions.probes, documented for the host. */
  probes?: Record<string, { description: string; readBy?: string[] }>;
  /** Messages of its own keys, per locale; English is the fallback. */
  dictionaries?: Record<string, Record<string, string>>;
}

/** Returns the pack, checked; throws a TypeError naming what is wrong. */
export function definePack<T extends Pack>(pack: T): T;

/** What a pack brings, for a tool that lets its users choose packs. */
export interface PackDescription {
  name: string;
  version: string;
  namespace: string;
  core: string;
  title?: string;
  description?: string;
  rules: string[];
  variants: string[];
  overrides: string[];
  standard: {
    key: string;
    standard: string;
    versions: string[];
    profiles: string[];
    rollups: string[];
  } | null;
  locales: string[];
  probes: { path: string; description: string; readBy: string[] }[];
}

/** Each pack described, or, for one that is not valid, its name and problems. */
export function describePacks(
  packs: unknown[]
): (PackDescription | { name: string | null; problems: string[] })[];

/** What is wrong with a pack's shape; empty when it can be prepared. */
export function checkPack(pack: unknown): string[];

/** Whether a version is in a range ('^1.2.0', '~1.2.0', '>=1.2.0 <2.0.0', a || b); null if unreadable. */
export function satisfiesRange(version: string, range: string): boolean | null;

/** A registry entry's mapping for a standard mapped rule by rule. See src/profile-kit.js. */
export function ruleMappedStandard(options: {
  standard: string;
  tag: string;
  versions: object[];
  requirements: object[];
  ruleMap: Record<string, unknown>;
}): {
  mappingsFor: PackStandard['mappingsFor'];
  composites: NonNullable<PackStandard['composites']>;
  validate: NonNullable<PackStandard['validate']>;
  wcagTagsOf: (version: string) => string[];
};

/**
 * A script that registers the packs in a page, after core's browser bundle;
 * a scan there names them in engineOptions.packs as name@version. Throws for
 * a pack that is not valid.
 */
export function packScript(packs: Pack[]): string;

/** Core's browser bundle with the packs registered after it. */
export function buildBrowserBundle(options?: { packs?: Pack[] }): string;

/** Internal: the engine a scan with these packs runs on. Not covered by semver. */
export function preparePacks(packs: unknown[], options?: { strict?: boolean }): unknown;
