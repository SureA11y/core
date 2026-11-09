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
      /**
       * The id of the law the profile serves, one of `laws`.
       * @experimental Until 1.18.0.
       */
      law?: string;
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
  /**
   * How the standard groups its requirements, by version, as a list of its
   * procedures shows them (listProcedures): each requirement of the
   * version's procedures in one group at most.
   */
  groups?: Record<string, PackRequirementGroup[]>;
  /**
   * The standard's own steps for core rules' undecided findings, by rule id
   * and reason code, in English (docs/PACKS.md): a finding only the
   * standard's profiles ask about reads them in place of core's. Each text
   * may name what the finding found, {{name|text}}. The pack's dictionaries
   * translate an entry, as a whole, under
   * `<key>_standardReview_<ruleId>_<CODE>_step<n>`, `_pass` and `_fail`.
   */
  review?: Record<string, Record<string, { steps: string[]; passWhen: string; failWhen: string }>>;
  /**
   * The language the standard's own text is written in (its procedures,
   * titles, notes and rollups' titles): a language tag, 'en' by default.
   */
  lang?: string;
  /**
   * The standard's own text in other languages, by locale, keyed by the text
   * it translates. A standard that declares lang or translations is read in
   * one of its languages, core's procedures included (docs/PACKS.md).
   */
  translations?: Record<string, Record<string, string>>;
  /**
   * Translations by what each text is, per version, read before
   * `translations`: { fr: { '1.0': { 'requirements.4.2.title': '…',
   * 'requirements.4.2.facets.alt.steps': ['…'] } } }. Keys:
   * requirements.<id>.title | note, requirements.<id>.facets.<facet>.label |
   * steps | passWhen | failWhen, requirements.<id>.replace.<facet>.steps |
   * passWhen | failWhen, groups.<id>.title, notes, review.<rule>.<CODE>.steps
   * | passWhen | failWhen. A list is given as a list.
   * @experimental Until 1.18.0 (docs/API_STABILITY.md).
   */
  texts?: Record<string, Record<string, Record<string, string | string[]>>>;
  /**
   * A version's own steps for core's codes, replacing `review`'s for the
   * same rule and code under the profiles of that version.
   * @experimental Until 1.18.0.
   */
  reviewByVersion?: Record<
    string,
    Record<string, Record<string, { steps: string[]; passWhen: string; failWhen: string }>>
  >;
  /**
   * The laws its profiles are used for, by id, identified and not
   * documented: name, jurisdiction, official texts (docs/PACKS.md, "The
   * law a profile is used for").
   * @experimental Until 1.18.0.
   */
  laws?: Record<string, PackLaw>;
  /**
   * The laws' names in other languages, by locale and id: { en:
   * { 'laws.<id>.name': '…' } }.
   * @experimental Until 1.18.0.
   */
  lawTexts?: Record<string, Record<string, string>>;
}

/**
 * A law a profile is used for: identified, not documented.
 * @experimental Until 1.18.0.
 */
export interface PackLaw {
  name: string;
  /** A country ('FR'), a subdivision ('DE-BY') or a region ('EU'). */
  jurisdiction: string;
  /** Its official texts, at https addresses. */
  sources?: { title: string; url: string }[];
}

/**
 * A law in a language (lawOf).
 * @experimental Until 1.18.0.
 */
export interface LawText extends PackLaw {
  id: string;
  /** The language its name is in. */
  lang: string;
}

/**
 * A standard's law in `locale`, read from standard.lawTexts for it or its
 * base language, else as written; null for a law it doesn't have.
 * @experimental Until 1.18.0.
 */
export function lawOf(standard: PackStandard, id: string, locale?: string): LawText | null;

/** A group of a standard's requirements, such as a theme or a chapter. */
export interface PackRequirementGroup {
  id: string;
  title: string;
  requirements?: string[];
  groups?: PackRequirementGroup[];
}

/** A general procedure a pack writes, in its standard's language. */
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
 * coveredBy), or facets of its own. `title` names the requirement in a list,
 * a checklist and a page of procedures; without it, the title the standard's
 * rollups give the requirement, or only its number where none does.
 */
export type PackRequirementProcedures =
  | {
      title?: string;
      wcag: string;
      replace?: Record<string, PackProcedure>;
      /** The laws that ask for it; without it, all do. @experimental Until 1.18.0. */
      laws?: string[];
    }
  | {
      title?: string;
      /** The laws that ask for it; without it, all do. @experimental Until 1.18.0. */
      laws?: string[];
      /** The WCAG criteria it relates to, without restating any (relatedRequirements). */
      relatesTo?: string[];
      facets: {
        id: string;
        label: string;
        automation?: 'full' | 'partial' | 'manual';
        tools?: (
          'keyboard' | 'pointer' | 'screen-reader' | 'zoom' | 'contrast-theme' | 'devtools'
        )[];
        steps: string[];
        passWhen: string;
        failWhen: string;
        /**
         * The requirement ids of the standard's mapping (the requirement of
         * its mappingsFor entries) the facet assesses, such as a test of the
         * requirement ('8.5.1'): the core rules mapped to them are listed
         * under it, in rules and mappedRules. Without it, the only facet of
         * a requirement assesses the requirement itself.
         */
        mappedRequirements?: string[];
      }[];
    };

/**
 * What a rollup does with a finding: count it, make a failing one a
 * question ('cantTell'), make a question a failure ('fail'), or leave it out
 * ('ignore'). As an object, it also
 * names the rollup's requirements the finding counts toward, so the rollup
 * names only those when such findings decide it.
 */
export type ContributionAct =
  | 'count'
  | 'cantTell'
  | 'fail'
  | 'ignore'
  | { act: 'count' | 'cantTell' | 'fail' | 'ignore'; requirements?: string[] };

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
    /** Its laws, in English, with the profiles that serve each. @experimental Until 1.18.0. */
    laws?: (LawText & { profiles: string[] })[];
  } | null;
  locales: string[];
  probes: { path: string; description: string; readBy: string[] }[];
  /**
   * The experimental APIs of core the pack uses (`docs/API_STABILITY.md`,
   * "Experimental"), each with the version that brought it and the one by
   * which it is stable or removed. Present only when it uses one.
   */
  experimental?: { id: string; since: string; until: string }[];
}

/** Each pack described, or, for one that is not valid, its name and problems. */
export function describePacks(
  packs: unknown[]
): (PackDescription | { name: string | null; problems: string[] })[];

/**
 * What is wrong with a pack's shape; empty when it can be prepared. Also
 * reports a rule's steps (`meta.review`) that a dictionary translates only
 * in part, which `definePack` and a scan accept, reading each missing key in
 * English; and a `core` range wider than `~` in a pack that uses an
 * experimental API, which the next minor may change.
 */
export function checkPack(pack: unknown): string[];

/** How far one translation of a pack's standard covers its texts. */
export interface PackTranslationCoverage {
  locale: string;
  /** The standard's texts a translation can give. */
  total: number;
  translated: number;
  /** The texts it doesn't translate yet. */
  missing: string[];
}

/**
 * The languages of a pack's standard (docs/PACKS.md, "Languages"): the one
 * its own text is written in, standard.lang ('en' where it gives none),
 * first, then those standard.translations gives, lower case. Takes the
 * standard, pack.standard.
 */
export function languagesOf(standard: unknown): string[];

/** How far each translation of a pack's standard covers its texts; empty without any. */
export function packTranslationCoverage(pack: unknown): PackTranslationCoverage[];

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
  /**
   * Per version, the tests a standard judges under its requirements:
   * { '1.0': { '1.1.1': { title, requirements: ['1.1'] } } }. A test belongs
   * to one requirement or several; its `wcagSc` defaults to its requirement's.
   * With tests, every version has them, a rule-map row names tests or
   * requirements, and a result names each test with its `criterion`.
   * @experimental Until 1.18.0 (docs/API_STABILITY.md).
   */
  tests?: Record<
    string,
    Record<
      string,
      { title: string; requirements: string[]; wcagSc?: string[]; [field: string]: unknown }
    >
  >;
  /**
   * With tests: link a rule only to tests whose WCAG criteria share one with
   * the rule's (or give the reason in the row's `outsideCorrespondence`), and
   * name only the shared criteria in each entry.
   * @experimental Until 1.18.0.
   */
  wcagCorrespondence?: boolean;
  /** Per version, the requirements (or, with tests, the tests) each rule checks: { '1.0': { 'img-alt-present': { requirements: ['1'] } } }. */
  ruleMap: Record<
    string,
    Record<
      string,
      {
        requirements: string[];
        /** Findings of a reason code: the requirements they count toward ([] for none), 'cantTell' to make a failing one a question there, and 'fail' to make a question a failure there. */
        reasonCodes?: Record<string, { requirements?: string[]; outcome?: 'cantTell' | 'fail' }>;
        /**
         * Findings by what they record: the first entry whose `when` values
         * equal the finding's data.details fields (by dotted path) decides,
         * before its reason code. Use fields the rule keeps stable.
         */
        findings?: Array<{
          when: Record<string, string | number | boolean | null>;
          requirements?: string[];
          outcome?: 'cantTell' | 'fail';
        }>;
        /** With tests: where the row's findings are questions. @experimental Until 1.18.0. */
        asks?: string[];
        /** With wcagCorrespondence: tests linked outside it, each with the reason. @experimental Until 1.18.0. */
        outsideCorrespondence?: Record<string, string>;
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

/**
 * A standard as data, format "surea11y-standard/1"
 * (`@surea11y/core/schemas/standard.schema.json`): its versions and, per
 * version, its groups, requirements, tests and rule map, in JSON.
 * @experimental Until 1.18.0 (docs/API_STABILITY.md).
 */
export interface StandardData {
  format: 'surea11y-standard/1';
  key: string;
  standard: string;
  lang?: string;
  versions: Array<{
    version: string;
    wcagVersion: '2.0' | '2.1' | '2.2';
    published?: string;
    basedOn?: Array<{ standard: string; version?: string; id?: string }>;
  }>;
  options?: { applicability?: 'wcag'; wcagCorrespondence?: boolean; ruleMapped?: boolean };
  data: Record<
    string,
    {
      groups?: Array<Record<string, unknown>>;
      requirements: Record<string, Record<string, unknown>>;
      tests?: Record<string, Record<string, unknown>>;
      ruleMap: Record<string, Record<string, unknown>>;
    }
  >;
  profiles?: Record<string, { version: string; [field: string]: unknown }>;
}

/**
 * The problems with a standard's data: its shape and the cross-references a
 * schema can't check. [] when sound.
 * @experimental Until 1.18.0.
 */
export function checkStandardData(data: unknown): string[];

/**
 * The registry entry for a standard's data, what a pack's `standard` is.
 * `extras` adds or replaces fields the data doesn't give (report, review,
 * translations, notes). Throws a TypeError naming each problem of the data.
 * @experimental Until 1.18.0.
 */
export function standardFromData(
  data: StandardData,
  extras?: Record<string, unknown>
): PackStandard;

/**
 * The data a pack's standard was built from (frozen), or null.
 * @experimental Until 1.18.0.
 */
export function standardDataOf(standard: unknown): StandardData | null;

/**
 * The complete data of a standard built on others: each version, requirement
 * and test of `own` may say what it is based on (`basedOn`); fields, tests
 * and rule-map rows are inherited from the `bases` through it, the derived
 * standard's own fields and rows replacing them (a row `null` drops one).
 * Only what `own` declares exists. Throws a TypeError naming each basedOn the
 * bases can't answer, and each rule inherited from two bases without a row of
 * its own. Results' entries carry each requirement's and test's `basedOn`.
 * @experimental Until 1.18.0.
 */
export function deriveStandard(bases: StandardData[], own: Record<string, unknown>): StandardData;
