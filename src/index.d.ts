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
 * The 4th scan argument. A bare array or string is shorthand, as in axe-core:
 * rule ids select those rules, tags select by tag; mixing the two, or naming
 * neither a rule nor a tag, throws. See docs/ENGINE_OPTIONS.md.
 */
/** A WCAG version and conformance level. */
export interface WcagTarget {
  version: '2.0' | '2.1' | '2.2';
  level: 'A' | 'AA' | 'AAA';
}

export interface RunOnly {
  /**
   * The rules for the criteria of a WCAG version at a level and below, by
   * each criterion's level in that version. Added to what `tags` and the
   * include ids select (the union); excludes apply after. See
   * docs/ENGINE_OPTIONS.md.
   */
  wcag?: WcagTarget;
  /**
   * true adds the best-practice rules, those that name no WCAG criterion
   * (tagged `best-practice`), to what the rest selects. See
   * docs/ENGINE_OPTIONS.md.
   */
  bestPractices?: boolean;
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
  /** Default true. false leaves out the console.info note for a WCAG version/level tag no rule carries. */
  logUntestedWcag?: boolean;
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
  /** Contrast rules only. Unset: 'styleAndGeometry' where the page has a layout (a browser), else 'styleOnly'. See docs/ENGINE_OPTIONS.md. */
  visibilityMode?: Open<'styleOnly' | 'styleAndGeometry'>;
  includeMode?: 'and' | 'or';
  /** A built-in contract's name, or an inline contract. See docs/POLICY.md. */
  policyContract?: Open<'a11y' | 'generic'> | PolicyContract;
  /** Overrides on top of the contract. See docs/POLICY.md. */
  policy?: Partial<Omit<PolicyContract, 'id'>>;
  output?: { includeSelector?: boolean; includeHtml?: boolean };
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

/** Which outcomes and confidence values a scan may report. See docs/POLICY.md. */
export interface PolicyContract {
  id?: string;
  allowedOutcomes?: Outcome[];
  allowedConfidence?: Confidence[];
  coerceManualFailToCantTell?: boolean;
}

/**
 * The `code` on an error the engine throws: a contextSelector that is not a
 * selector, or one that can't be parsed, or a runOnly that names nothing.
 */
export type EngineErrorCode = 'INVALID_CONTEXT_SELECTOR' | 'INVALID_RUN_ONLY';

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
  /** 'loading' while any image not loaded lazily is still loading. */
  images?: 'loaded' | 'loading';
  /**
   * How many running animations and transitions the scan moved to a fixed
   * point (a finite one to its end, an infinite one to its start) and put
   * back afterwards. Only with a layout.
   */
  animationsSettled?: number;
}

export interface EngineInfo {
  tag: string;
  /** The @surea11y/core release that produced the result, e.g. "1.10.0". */
  version: string;
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
  /** A WCAG 2.1 or 2.2 criterion's place in the Recommendation. */
  url?: string;
  /** A WCAG 2.1 or 2.2 criterion's Understanding document. */
  understandingUrl?: string;
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
  /** Where to read how to fix it; '' when the rule names none. */
  helpUrl: string;
  /** The rule's tags, its own and the engine's. */
  tags: string[];
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
  /**
   * For an element in a shadow tree: the selectors of the shadow hosts that
   * lead to it, outermost first, each resolved in the tree that holds it.
   * `selector` then resolves inside the last host's shadow root.
   */
  shadowHostSelectors?: string[];
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

/** What a rule measures against a threshold, as `meta.margin` declares it. */
export interface MarginDeclaration {
  /** An open set: `contrast-ratio`, `overflow-px`, `target-size-px`, and more in a minor. */
  measure: 'contrast-ratio' | 'overflow-px' | 'target-size-px' | (string & {});
  /** An open set; pixels keep one decimal, a ratio is not rounded. */
  unit: 'px' | 'ratio' | (string & {});
  /** `min`: the value must reach the threshold. `max`: it must stay under it. */
  limit: 'min' | 'max';
}

/**
 * The measurement that came closest to its threshold while meeting it. Never
 * a finding: it does not change the outcome or the occurrences. See
 * docs/OUTPUT_SCHEMA.md.
 */
export interface Margin extends MarginDeclaration {
  /** The threshold that element was judged against. */
  threshold: number;
  /** That element's measurement. */
  value: number;
  /** How far inside the limit, in `unit`; never negative. */
  headroom: number;
  /** How many elements the rule compared. */
  measuredCount: number;
  /** Absent with `output.includeSelector: false`. */
  selector?: string;
  /** As on an occurrence: present for an element in a shadow tree. */
  shadowHostSelectors?: string[];
  structuralPath?: number[];
  /** Rule-specific detail; not a stable contract. */
  context?: Record<string, unknown>;
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
  /** Present only on a rule that declares `meta.margin`, when an element met its threshold. */
  margin?: Margin;
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

/**
 * How a scan's `contextSelector` resolved. An `elementCount` of 0 means the
 * selector matched nothing, so nothing was scanned and every rule reports
 * `notApplicable`. An invalid selector throws instead, with
 * `code: 'INVALID_CONTEXT_SELECTOR'`.
 */
export interface ContextMatch {
  /** Distinct elements the selectors matched, the roots of the scan. */
  elementCount: number;
  /** Each selector, as given, that matched no element. */
  unmatchedSelectors: string[];
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
  /** How the `contextSelector` resolved; `null` when none was given. */
  contextMatch: ContextMatch | null;
  checksResults: CheckResult[];
  rulesResults: CompositeResult[];
  overriddenBuiltinIds: string[];
  /** engineOptions.customRules entries that were not run, and why; empty when all ran. */
  skippedCustomRules: { id: string | null; reason: string }[];
}

/** A child frame that answered, with its own frames, recursively. */
export interface ScannedFrame {
  url: string | null;
  /** A CSS selector for the <iframe>/<frame> in the parent's document. */
  selector: string | null;
  /** The frame element's title attribute, or null. */
  title: string | null;
  topFrame: ScanResult;
  frames: FrameEntry[];
}

/** A child frame that could not be reached (no responder, or a timeout). */
export interface UnreachableFrame {
  url: string | null;
  /** A CSS selector for the <iframe>/<frame> in the parent's document. */
  selector: string | null;
  /** The frame element's title attribute, or null. */
  title: string | null;
  error: string;
}

export type FrameEntry = ScannedFrame | UnreachableFrame;

/** What runa11yCoreAcrossFrames resolves to: a tree, not a flat list. */
export interface CrossFrameResult {
  topFrame: ScanResult;
  frames: FrameEntry[];
}

/** Where a frame sits in a cross-frame result. */
export interface FramePosition {
  /** The selectors of the frame elements leading to it, outermost first; [] for the top frame. */
  path: string[];
  /** The frame element's title attribute, or null. */
  title: string | null;
  url: string | null;
}

/** One frame of a flattened cross-frame result: its result, or why it has none. */
export type FlatFrame =
  { frame: FramePosition; result: ScanResult } | { frame: FramePosition; error: string };

/**
 * Lists every frame of a cross-frame result, the top frame first, then each
 * frame before the frames inside it. A plain scan result is one frame with an
 * empty path; anything else gives [].
 */
export function flattenCrossFrameResult(value: CrossFrameResult | ScanResult): FlatFrame[];

// ---- Scanning ----

/**
 * Scans the current `window`/`document` (a real page, or jsdom set up on the
 * globals), using the rule modules from the package. For Node.
 */
export function runDomRulesInPage(
  pageUrl?: string | null,
  contextSelector?: ContextSelector | null,
  engineOptions?: EngineOptions | null,
  runOnly?: RunOnly | LegacyTagRunOnly | StringList | null
): ScanResult;

/**
 * The same scan from a single self-contained function, which can be
 * serialized into a page (the browser bindings inject its source).
 */
export function runa11yCoreInPage(
  pageUrl?: string | null,
  contextSelector?: ContextSelector | null,
  engineOptions?: EngineOptions | null,
  runOnly?: RunOnly | LegacyTagRunOnly | StringList | null
): ScanResult;

/** Options for waitForPageReady. */
export interface PageReadyOptions {
  /** The most it waits in total, in ms. Default 5000; 0 checks once without waiting. */
  timeoutMs?: number;
  /**
   * Also wait until the DOM has not changed for this many ms, for a page its
   * script is still building after `load`. Off unless a positive number.
   */
  quietMs?: number;
  /** The document to wait for. Default: the page's own `document`. */
  document?: unknown;
}

/** What waitForPageReady found: `ready` false means the time ran out first. */
export interface PageReadyResult {
  ready: boolean;
  waitedMs: number;
  pending: {
    /** The window's load event had not fired. */
    load: boolean;
    /** A font face was still loading. */
    fonts: boolean;
    /** Images still loading, not counting those with loading="lazy". */
    images: number;
    /** With quietMs only: the DOM was still changing. */
    domChanging?: boolean;
  };
}

/**
 * Waits for the page to finish loading before a scan: the load event, fonts,
 * images, and with `quietMs` a DOM that stops changing. Never rejects. The
 * scan itself never calls it; see docs/INTEGRATION.md.
 */
export function waitForPageReady(options?: PageReadyOptions): Promise<PageReadyResult>;

/**
 * The WCAG target a conformance profile comes to, for `runOnly.wcag`:
 * `{ version: '2.2', level: 'AA' }` for `'wcag22-aa'`. null for a name that
 * is no profile, or a profile that is no WCAG version and level.
 */
export function getProfileWcagTarget(profile: string): WcagTarget | null;

/** Every margin in a scan result, as `{ ruleId, ...margin }`, sorted by `ruleId`. */
export function getMargins(
  result: ScanResult | null | undefined
): Array<Margin & { ruleId: string }>;

/**
 * Scans this frame and every child frame that called
 * a11yCoreEnableFrameResponder(), over postMessage. For code running inside
 * the page with no automation driver; see docs/INTEGRATION.md.
 */
export function runa11yCoreAcrossFrames(
  pageUrl?: string | null,
  contextSelector?: ContextSelector | null,
  engineOptions?: EngineOptions | null,
  runOnly?: RunOnly | LegacyTagRunOnly | StringList | null
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
  /** What the rule measures against a threshold, when it reports a margin; else null. */
  margin: MarginDeclaration | null;
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
