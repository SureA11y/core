// SPDX-License-Identifier: MPL-2.0

// Types for @surea11y/core's main entry: the scan result and the functions
// that produce it. docs/OUTPUT_SCHEMA.md describes every field; this file is
// that shape in TypeScript, and tests/types/result-types.test.js checks it
// against real scan results, so the two cannot drift apart.
//
// Sets the engine documents as open (it may add values in a minor release)
// accept any string besides the known ones, so code that branches on them
// keeps compiling when a value is added.

type Open<T extends string> = T | (string & {});

// ---- Inputs ----

/** A list given as an array or as a comma-separated string. */
export type StringList = string | string[];

/**
 * The 4th scan argument. It must be this object shape: a bare array is
 * ignored and every rule runs. See docs/ENGINE_OPTIONS.md.
 */
export interface RunOnly {
  includeRuleIds?: StringList;
  excludeRuleIds?: StringList;
  includeTestIds?: StringList;
  excludeTestIds?: StringList;
  tags?: StringList;
  excludeTags?: StringList;
  includeMode?: 'and' | 'or';
}

/** The legacy tag filter, accepted as the whole `runOnly` value. */
export interface LegacyTagRunOnly {
  type: 'tag';
  values: string[];
}

/** The 2nd scan argument: one selector (a CSS selector list) or several. */
export type ContextSelector = string | string[];

/** The 3rd scan argument. Fields not listed here are passed through. */
export interface EngineOptions {
  locale?: string;
  wcagVersion?: '2.0' | '2.1' | '2.2';
  profile?: Open<'wcag22-aa' | 'en301549-v4.1.1' | 'en301549-v3.2.1' | 'section508'>;
  mappings?: StringList;
  optInRules?: 'all' | StringList;
  messages?: Record<string, Record<string, string>>;
  includeHiddenElements?: boolean;
  includeShadowDom?: boolean;
  fragment?: boolean;
  excludeSelectors?: StringList;
  timestamp?: string;
  contrast?: {
    mode?: 'strictConformance' | 'auditorAssist';
    rootCanvasFallback?: string;
  };
  visibilityMode?: string;
  includeMode?: 'and' | 'or';
  /** `include`/`exclude` select rules; any other key is that rule's `ctx.config`. */
  rules?: { include?: StringList; exclude?: StringList; [ruleId: string]: unknown };
  tags?: { include?: StringList; exclude?: StringList };
  tests?: { include?: StringList; exclude?: StringList };
  customRules?: CustomRule[];
  probes?: unknown;
  perfStats?: boolean;
  profileRules?: boolean;
  /** Read only by runa11yCoreAcrossFrames, in milliseconds. */
  pingWaitTime?: number;
  frameWaitTime?: number;
  [option: string]: unknown;
}

/** A rule registered for one scan. See docs/ENGINE_OPTIONS.md, `customRules`. */
export interface CustomRule {
  id: string;
  meta: Record<string, unknown>;
  /** A function, or its source as a string (to cross into a page). */
  runInPage: string | ((ctx: unknown) => unknown);
  applicability?: string | ((ctx: unknown) => unknown);
  data?: unknown;
}

// ---- The result ----

export type Outcome = 'pass' | 'fail' | 'cantTell' | 'notApplicable';
export type OutcomeNormalized = 'pass' | 'fail' | 'cantTell' | 'inapplicable';
export type Severity = 'minor' | 'moderate' | 'serious' | 'critical';
export type Confidence = 'high' | 'medium' | 'low';
export type RuleType = 'automatic' | 'manual';

export interface LocaleResolution {
  requested: string;
  resolved: string;
  reason: Open<
    'ok' | 'primary-subtag' | 'dictionary-not-loaded' | 'unknown-locale' | 'partial-dictionary'
  >;
}

/** The conditions the page was rendered under, read before any rule ran. */
export interface RenderingEnvironment {
  /** False in jsdom and other DOM emulators, and then the only field. */
  layout: boolean;
  /** CSS pixels. */
  viewport?: { width: number; height: number };
  devicePixelRatio?: number;
  colorScheme?: 'light' | 'dark';
  /** 'loading' while any of the page's font faces is still loading. */
  fonts?: 'loaded' | 'loading';
}

export interface EngineInfo {
  tag: string;
  schemaVersion: string;
  locale: LocaleResolution;
  wcagVersion: '2.0' | '2.1' | '2.2';
  environment: RenderingEnvironment;
  profile?: string;
  profileExcludes?: { rules: string[]; criteria: string[] };
  optInRules?: string[];
  mappings?: string[];
}

export interface NormativeMapping {
  standard: string;
  version: string;
  requirement: string;
  title: string;
  conformanceLevel?: string;
  wcagSc?: string[];
  /** Present on a reference that is not a requirement, such as `'Understanding'`. */
  type?: string;
  url?: string;
  [field: string]: unknown;
}

export interface RuleMeta {
  ruleId: string;
  ruleInterfaceVersion: string;
  ruleVersion: string;
  normative: boolean;
  atomic: boolean;
  deprecated: boolean;
  deprecation: {
    sinceVersion?: string;
    replacedBy?: string;
    reason?: string;
    [field: string]: unknown;
  } | null;
  category: 'perceivable' | 'operable' | 'understandable' | 'robust' | null;
  normativeMappings: NormativeMapping[];
  standard: string | null;
  applicability: string;
  expectation: string;
  references: string[];
  requirements: Record<string, unknown> | null;
  mappings: Record<string, unknown> | null;
}

export type UncertaintyCode = Open<
  | 'not-computable'
  | 'runtime-dependent'
  | 'spec-only'
  | 'equivalence-unknown'
  | 'judgement-required'
  | 'out-of-scope'
>;

export interface Uncertainty {
  code: UncertaintyCode;
  /** What would settle the question. */
  needed?: string;
  /** What the rule did establish; rule-specific. */
  evidence?: Record<string, unknown>;
}

export interface VisibilityFilter {
  /** Absent from the page-level findings of a few rules, such as page-title-present. */
  eligible?: boolean;
  targetSet: string;
  accEligible: boolean | null;
  reasons: string[];
}

export interface Occurrence {
  selector: string;
  html: string;
  structuralPath: number[] | null;
  summary: string;
  hint: string;
  i18n: { summaryKey: string; hintKey: string; params: Record<string, unknown> } | null;
  /** Present when the rule graded its findings into tiers. */
  occurrenceOutcome?: 'fail' | 'cantTell';
  /** Present only on a cantTell-tier occurrence. */
  uncertainty?: Uncertainty;
  /** Absent on manual-review's finding, which is about the whole page. */
  data?: {
    visibilityFilter?: VisibilityFilter;
    /**
     * Rule-specific and not a stable contract, except `reasonCode`, which
     * identifies the finding (docs/API_STABILITY.md, "Finding identity").
     */
    details?: { reasonCode?: string; [field: string]: unknown };
    [field: string]: unknown;
  };
}

export interface CheckResult {
  ruleId: string;
  outcome: Outcome;
  outcomeNormalized: OutcomeNormalized;
  severity: Severity;
  confidence: Confidence;
  type: RuleType;
  occurrences: Occurrence[];
  title: string;
  description: string;
  i18n: { titleKey: string; descriptionKey: string } | null;
  meta: RuleMeta;
  /** The resolved options this rule ran under. */
  engineOptions: Record<string, unknown>;
  schemaVersion: string;
  /** The rulesResults entries that group this rule in this run. */
  rollupIds: string[];
  /** Page-level data a rule reports whatever its outcome; not a stable contract. */
  data?: Record<string, unknown>;
  /** Present only when the target WCAG version changed this outcome. */
  wcagVersionScope?: { target: '2.0' | '2.1' | '2.2'; removedSc: string[]; coercedFrom: 'fail' };
  /** Present only if the rule threw, or a manual rule's fail was coerced. */
  error?: string;
}

/** The shorter form a composite names its criterion in. */
export interface CompositeNormativeMapping {
  standard: string;
  requirement: string;
  level?: string;
  version?: string;
  title?: string;
  [field: string]: unknown;
}

export interface CompositeResult {
  ruleId: string;
  outcome: Outcome;
  outcomeNormalized: OutcomeNormalized;
  severity: Severity;
  confidence: Confidence;
  type: RuleType;
  /** Always empty: a composite rolls rules up, it does not flag elements. */
  occurrences: [];
  title: string;
  description: string;
  i18n: { titleKey: string; descriptionKey: string } | null;
  meta: Omit<RuleMeta, 'normativeMappings'> & { normativeMappings: CompositeNormativeMapping[] };
  engineOptions: Record<string, unknown>;
  schemaVersion: string;
  summaryKey?: string;
  i18nKey?: string;
  i18nParams?: Record<string, unknown>;
  data: {
    details: {
      reasonCode: string;
      /** A standard's own rollup only, with version and criterion. */
      standard?: string;
      version?: string;
      criterion?: string;
      checksIds: string[];
      contributors: Array<{ testId: string; outcome: string; severity: string | null }>;
      metrics: {
        failCount: number;
        cantTellCount: number;
        notApplicableCount: number;
        passCount: number;
        missingCount: number;
      };
      [field: string]: unknown;
    };
  };
}

/** What runDomRulesInPage and runa11yCoreInPage return. */
export interface ScanResult {
  engine: EngineInfo;
  url: string | null;
  title: string | null;
  /** Only what `engineOptions.timestamp` supplied: the engine has no clock. */
  timestamp: string | null;
  /** Debug only, when `engineOptions.perfStats` is set; not a stable shape. */
  perfStats: Record<string, unknown> | null;
  contextSelector: ContextSelector | null;
  checksResults: CheckResult[];
  rulesResults: CompositeResult[];
  overriddenBuiltinIds: string[];
}

/** A child frame that answered, with its own frames, recursively. */
export interface ScannedFrame {
  url: string | null;
  topFrame: ScanResult;
  frames: FrameEntry[];
}

/** A child frame that could not be reached (no responder, or a timeout). */
export interface UnreachableFrame {
  url: string | null;
  error: string;
}

export type FrameEntry = ScannedFrame | UnreachableFrame;

/** What runa11yCoreAcrossFrames resolves to: a tree, not a flat list. */
export interface CrossFrameResult {
  topFrame: ScanResult;
  frames: FrameEntry[];
}

// ---- Scanning ----

/**
 * Scans the current `window`/`document` (a real page, or jsdom set up on the
 * globals), using the rule modules from the package. For Node.
 */
export function runDomRulesInPage(
  pageUrl?: string | null,
  contextSelector?: ContextSelector | null,
  engineOptions?: EngineOptions | null,
  runOnly?: RunOnly | LegacyTagRunOnly | null
): ScanResult;

/**
 * The same scan from a single self-contained function, which can be
 * serialized into a page (the browser bindings inject its source).
 */
export function runa11yCoreInPage(
  pageUrl?: string | null,
  contextSelector?: ContextSelector | null,
  engineOptions?: EngineOptions | null,
  runOnly?: RunOnly | LegacyTagRunOnly | null
): ScanResult;

/**
 * Scans this frame and every child frame that called
 * a11yCoreEnableFrameResponder(), over postMessage. For code running inside
 * the page with no automation driver; see docs/INTEGRATION.md.
 */
export function runa11yCoreAcrossFrames(
  pageUrl?: string | null,
  contextSelector?: ContextSelector | null,
  engineOptions?: EngineOptions | null,
  runOnly?: RunOnly | LegacyTagRunOnly | null
): Promise<CrossFrameResult>;

/**
 * Lets the frame that embeds this one scan it. Returns a function that
 * turns the responder off again.
 */
export function a11yCoreEnableFrameResponder(): () => void;

// ---- Catalogs ----

/** One atomic rule, as getChecksCatalog lists it. */
export interface CheckCatalogEntry {
  ruleId: string;
  title: string;
  description: string;
  i18n: { titleKey: string; descriptionKey: string } | null;
  helpUrl: string | null;
  tags: string[];
  wcagSc: string[];
  normativeMappings: NormativeMapping[];
  defaultSeverity: Severity;
  defaultConfidence: Confidence;
  type: RuleType;
  deprecated: boolean;
  deprecation: RuleMeta['deprecation'];
  [field: string]: unknown;
}

/** One composite rule, as getRulesCatalog lists it. */
export interface RuleCatalogEntry {
  id: string;
  checksIds: string[];
  meta: Record<string, unknown>;
  [field: string]: unknown;
}

/** Every atomic rule the given options would make available. */
export function getChecksCatalog(engineOptions?: EngineOptions | null): CheckCatalogEntry[];

/** Every composite rule the given options would make available. */
export function getRulesCatalog(engineOptions?: EngineOptions | null): RuleCatalogEntry[];

/** How far one shipped translation covers the English dictionary. */
export interface LocaleCoverage {
  locale: string;
  /** English keys the locale is measured against. */
  total: number;
  /** Keys whose value differs from English. */
  translated: number;
  /** Keys the locale lacks; they show in English. */
  missing: number;
  /** Keys the locale has that English does not. */
  orphaned: string[];
  /** translated / total, as a percentage with one decimal. */
  percent: number;
}

/** Translation coverage of every locale the package ships, against English. */
export function getLocaleCoverage(): {
  sourceLocale: 'en';
  totalKeys: number;
  locales: LocaleCoverage[];
};

// ---- Exported but internal ----
// Reachable, but not part of the supported API (docs/API_STABILITY.md), and
// free to change in a minor release. Typed loosely on purpose.

/** @internal Read `result.engine.tag` instead. */
export const ENGINE_TAG: string;
/** @internal Read `result.engine.schemaVersion` instead. */
export const SCHEMA_VERSION: string;
/** @internal */
export const DEFAULT_POLICY: Record<string, unknown>;
/** @internal */
export const POLICY_CONTRACTS: Record<string, unknown>;
/** @internal */
export function resolvePolicy(contracts: unknown, engineOptions: unknown): Record<string, unknown>;
/** @internal */
export const CHECK_DEFS: ReadonlyArray<Record<string, unknown>>;
/** @internal */
export const TEST_DEFS: ReadonlyArray<Record<string, unknown>>;
/** @internal */
export const COMPOSITE_RULES: ReadonlyArray<Record<string, unknown>>;
/** @internal */
export function getCheckDefById(
  id: string,
  engineOptions?: unknown
): Record<string, unknown> | null;
/** @internal */
export function getCompositeRuleById(
  id: string,
  engineOptions?: unknown
): Record<string, unknown> | null;
/** @internal */
export function getChecksForRunOnly(runOnly: unknown, engineOptions?: unknown): unknown[];
/** @internal */
export function getTestsForRunOnly(runOnly: unknown, engineOptions?: unknown): unknown[];
/** @internal */
export const __internal: Record<string, unknown>;
