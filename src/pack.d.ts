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
      /**
       * The WCAG version its scans are judged by (`engine.wcagVersion`), when
       * its tags don't imply the one the standard is built on. An explicit
       * `engineOptions.wcagVersion` still wins.
       */
      wcagVersion?: '2.0' | '2.1' | '2.2';
      /**
       * True when the standard requires 4.1.1 Parsing as written: a failure of
       * it stays one under 2.0 or 2.1, which the 2023 errata would have asked.
       * A profile that takes the place of one of core's doesn't inherit it.
       */
      keepsParsing?: boolean;
    }
  >;
  mappingsFor: (rule: { id: string; wcagSc?: string[]; checksIds?: string[] }) => object[];
  ruleTag?: string;
  ruleMapped?: boolean;
  restatedPrefixes?: string[];
  /** The standard's own rollups (see StandardRollup). */
  composites?: () => object[];
  validate?: (rules: { ruleId: string; wcagSc: string[] }[]) => string[];
  report?: { noteKey?: string; titleLang?: string };
  /**
   * How a person assesses each requirement by hand (docs/PROCEDURES.md), by
   * version and requirement: a WCAG criterion's procedures, or its own
   * facets, in English.
   */
  procedures?: Record<string, Record<string, PackRequirementProcedures>>;
}

/** A general procedure a pack writes, in English. */
export interface PackProcedure {
  /** What it needs besides a browser; by default, for a replaced facet, what core's needs. */
  tools?: ('keyboard' | 'pointer' | 'screen-reader' | 'zoom' | 'contrast-theme' | 'devtools')[];
  steps: string[];
  passWhen: string;
  failWhen: string;
}

/**
 * One requirement's procedures: a WCAG criterion's, some of whose facets'
 * general procedures it may replace (by facet id; not a facet with
 * coveredBy), or facets of its own.
 */
export type PackRequirementProcedures =
  | { title?: string; wcag: string; replace?: Record<string, PackProcedure> }
  | {
      title?: string;
      facets: {
        id: string;
        label: string;
        automation?: 'full' | 'partial' | 'manual';
        tools?: ('keyboard' | 'pointer' | 'screen-reader' | 'zoom' | 'contrast-theme' | 'devtools')[];
        steps: string[];
        passWhen: string;
        failWhen: string;
      }[];
    };

/**
 * What a rollup does with a finding: count it, make a failing one a
 * question ('cantTell'), or leave it out ('ignore'). As an object, it also
 * names the rollup's requirements the finding counts toward, so the rollup
 * names only those when such findings decide it.
 */
export type ContributionAct =
  | 'count'
  | 'cantTell'
  | 'ignore'
  | { act: 'count' | 'cantTell' | 'ignore'; requirements?: string[] };

/**
 * How a rollup judges one of its rules by the rule's findings: by the first
 * of `findings` whose `when` the finding's data.details match (fields by
 * dotted path), else by its reason code in `codes`, else by `default`.
 */
export interface RollupContribution {
  default: ContributionAct;
  codes?: Record<string, ContributionAct>;
  findings?: Array<{
    when: Record<string, string | number | boolean | null>;
    act: ContributionAct;
  }>;
}

/** A rollup of a standard's own, as `composites()` returns it. */
export interface StandardRollup {
  /** Starts with the pack's namespace and '-'. */
  id: string;
  checksIds: string[];
  meta: {
    title: string;
    standard: string;
    version: string;
    criterion: string;
    tags: string[];
    /** The requirements it covers, entries as mappingsFor gives them. */
    standardMappings: object[];
    /**
     * The rules it judges by their findings, by rule id; the others it judges
     * by their outcome.
     */
    contributions?: Record<string, RollupContribution>;
    /**
     * 'wcag' when it restates WCAG criteria, the `wcagSc` of its
     * `standardMappings`: it is judged as WCAG's rollup of them would be
     * (`notApplicable` and `pass` only where theirs would be), and its
     * result's `data.details.restatesWcag` lists them. Without it, it is
     * judged as a requirement of the standard's own; definePack refuses any
     * other value.
     */
    applicability?: 'wcag';
    /**
     * True when its rules don't check all its requirement asks: where they all
     * pass it is `cantTell` (`composite.rollup.cantTell.partialCheck`), where
     * they are all notApplicable `cantTell` (`partialCoverage`), and its
     * result's `data.details.partial` is true.
     */
    partial?: boolean;
    [field: string]: unknown;
  };
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
      /** The WCAG version its scans are judged by, when its tags don't imply it. */
      wcagVersion?: '2.0' | '2.1' | '2.2';
      /** True when it requires 4.1.1 Parsing as written, whatever the 2023 errata say. */
      keepsParsing?: boolean;
    }
  >;
  /** A checklist's items: each groups rules into one result, under its profiles. */
  rollups?: { id: string; title: string; description?: string; checksIds: string[] }[];
  /** The probes its rules read from engineOptions.probes, documented for the host. */
  probes?: Record<string, { description: string; readBy?: string[] }>;
  /** Messages of its own keys, per locale; English is the fallback. */
  dictionaries?: Record<string, Record<string, string>>;
}

/**
 * Returns the pack, checked and frozen with the lists and objects it holds (a
 * scan keeps its engine for the same pack object); throws a TypeError naming
 * what is wrong.
 */
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

/**
 * Whether a version is in a range, as npm reads it ('^1.2.0', '~1.2', '1.x', '>=1.2.0 <2', '1.0.0 - 2.x', a || b),
 * prereleases included; null when it isn't a range npm reads, or is empty or has an empty alternative.
 */
export function satisfiesRange(version: string, range: string): boolean | null;

/** A registry entry's mapping for a standard mapped rule by rule. See src/profile-kit.js. */
export function ruleMappedStandard(options: {
  standard: string;
  tag: string;
  /**
   * The standard's versions, oldest first, each with the WCAG version its
   * requirements are built on: [{ version: '1.0', wcagVersion: '2.1' }, ...].
   */
  versions: Array<{
    version: string;
    wcagVersion: '2.0' | '2.1' | '2.2';
    [field: string]: unknown;
  }>;
  /**
   * Per version, each requirement by its number: { '1.0': { '1': { title, wcagSc } } }.
   * `partial: true` when its rules don't check all it asks: its rollup is then
   * cantTell (partialCoverage), not notApplicable, where they all are.
   */
  requirements: Record<
    string,
    Record<
      string,
      { title: string; wcagSc?: string[]; partial?: boolean; [field: string]: unknown }
    >
  >;
  /** Per version, the requirements each rule checks: { '1.0': { 'img-alt-present': { requirements: ['1'] } } }. */
  ruleMap: Record<
    string,
    Record<
      string,
      {
        requirements: string[];
        /** Findings of a reason code: the requirements they count toward ([] for none), and 'cantTell' to make a failing one a question there. */
        reasonCodes?: Record<string, { requirements?: string[]; outcome?: 'cantTell' }>;
        /**
         * Findings by what they record: the first entry whose `when` values
         * equal the finding's data.details fields (by dotted path) decides,
         * before its reason code. Use fields the rule keeps stable.
         */
        findings?: Array<{
          when: Record<string, string | number | boolean | null>;
          requirements?: string[];
          outcome?: 'cantTell';
        }>;
        [field: string]: unknown;
      }
    >
  >;
  /**
   * 'wcag' for a standard whose requirements restate WCAG criteria one for
   * one: a requirement's rollup is notApplicable only where WCAG's would be.
   */
  applicability?: 'wcag';
}): {
  mappingsFor: PackStandard['mappingsFor'];
  composites: NonNullable<PackStandard['composites']>;
  validate: NonNullable<PackStandard['validate']>;
  wcagTagsOf: (version: string) => string[];
  /**
   * With applicability 'wcag', each requirement that restates one criterion
   * taking its procedures, for standard.procedures; undefined otherwise.
   */
  procedures: PackStandard['procedures'];
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
