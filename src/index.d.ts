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

type LevelA = 'A' | 'a';
/** A WCAG conformance level in any case: 'AA', 'aa', 'Aa'. */
export type WcagLevelInput = LevelA | `${LevelA}${LevelA}` | `${LevelA}${LevelA}${LevelA}`;

/**
 * The 4th scan argument. A bare array or string is shorthand:
 * rule ids select those rules, tags select by tag; mixing the two, or naming
 * neither a rule nor a tag, throws. See docs/ENGINE_OPTIONS.md.
 */
/** A WCAG version and conformance level. */
export interface WcagTarget {
  version: '2.0' | '2.1' | '2.2';
  /** Any case: 'AA', 'aa'. */
  level: WcagLevelInput;
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

/**
 * The legacy `{ type, values }` form, accepted as the whole `runOnly` value:
 * `type` 'tag' or 'tags' selects by tag, 'rule' or 'rules' by rule id. The
 * other keys beside it still apply. See docs/ENGINE_OPTIONS.md.
 */
export interface LegacyTagRunOnly extends RunOnly {
  type: 'tag' | 'tags' | 'rule' | 'rules';
  /** A list, a comma-separated string, or a Set of names (typed by shape, so no ES2015 lib is needed). */
  values: StringList | { readonly size: number; has(name: string): boolean };
}

/** The 2nd scan argument: one selector (a CSS selector list) or several. */
export type ContextSelector = string | string[];

/** The options the engine reads. See docs/ENGINE_OPTIONS.md. */
export interface EngineOptionFields {
  /**
   * true throws INVALID_ENGINE_OPTIONS on an option the engine doesn't read,
   * or a value of the wrong type; without it, only a key that looks like a
   * typo of a known one is warned about. 'true', '1' and 1 count as true,
   * as a command line or an environment variable spells it.
   */
  strictOptions?: boolean | 'true' | 'false' | '1' | '0' | 1 | 0;
  locale?: string;
  wcagVersion?: '2.0' | '2.1' | '2.2';
  /**
   * The WCAG level the reported criteria are gated by, in any case: rollups
   * above it are left out of rulesResults, while their rules still run. Wins
   * over the level the selection implies; a rollup named by id is reported
   * as named.
   */
  wcagLevel?: WcagLevelInput;
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
  /**
   * The text of style sheets the page can't read (another origin's), by their
   * URL, which the rules read in their place: what preloadStyleSheets() fetches
   * in the page, or what a binding fetched from outside it.
   */
  styleSheetTexts?: Array<{ href: string; text: string }>;
  timestamp?: string;
  contrast?: {
    mode?: 'strictConformance' | 'auditorAssist';
    rootCanvasFallback?: string;
    /**
     * Echoed on each result: whether rootCanvasFallback is one the caller gave
     * (true) or the default white the engine filled in (false). Passed back,
     * false reads the color as the default. See docs/ENGINE_OPTIONS.md.
     */
    rootCanvasFallbackSet?: boolean;
  };
  /** Contrast rules only. Unset: 'styleAndGeometry' where the page has a layout (a browser), else 'styleOnly'. See docs/ENGINE_OPTIONS.md. */
  visibilityMode?: Open<'styleOnly' | 'styleAndGeometry'>;
  includeMode?: 'and' | 'or';
  /** A built-in contract's name, or an inline contract. See docs/POLICY.md. */
  policyContract?: Open<'a11y' | 'generic'> | PolicyContract;
  /** Overrides on top of the contract. See docs/POLICY.md. */
  policy?: Partial<Omit<PolicyContract, 'id'>>;
  /**
   * `detail: 'findings'` keeps whole only the results that report something;
   * a pass or notApplicable with no occurrences is a CompactCheckResult.
   */
  output?: { includeSelector?: boolean; includeHtml?: boolean; detail?: 'full' | 'findings' };
  /** `include`/`exclude` select rules; any other key is that rule's `ctx.config`. */
  rules?: { include?: StringList; exclude?: StringList; [ruleId: string]: unknown };
  tags?: { include?: StringList; exclude?: StringList };
  tests?: { include?: StringList; exclude?: StringList };
  customRules?: CustomRule[];
  /**
   * Packs from @surea11y/core/pack: their rules, variants, standard and
   * messages join the scan. In Node, the packs themselves (runDomRulesInPage
   * and the catalog functions); in a page, their names as name@version, once
   * packScript has registered them (runa11yCoreInPage).
   */
  packs?: import('./pack').Pack[] | string[];
  probes?: unknown;
  perfStats?: boolean;
  profileRules?: boolean;
  /** Read only by runa11yCoreAcrossFrames, in milliseconds. */
  pingWaitTime?: number;
  frameWaitTime?: number;
}

/** The 3rd scan argument. Fields not listed here are passed through. */
export interface EngineOptions extends EngineOptionFields {
  [option: string]: unknown;
}

/**
 * The 3rd scan argument with strictOptions: no field but the engine's own,
 * so a misspelt option does not compile either.
 */
export interface StrictEngineOptions extends EngineOptionFields {
  strictOptions: true;
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
 * selector, or one that can't be parsed, a runOnly that names nothing,
 * under strictOptions an option the engine doesn't read or a value of the
 * wrong type, or, in a page whose scripts broke a JavaScript built-in the
 * engine relies on, PAGE_BUILTINS_BROKEN (its `broken` lists them).
 */
export type EngineErrorCode =
  | 'INVALID_CONTEXT_SELECTOR'
  | 'INVALID_RUN_ONLY'
  | 'INVALID_ENGINE_OPTIONS'
  | 'PAGE_BUILTINS_BROKEN';

/** A rule registered for one scan. See docs/ENGINE_OPTIONS.md, `customRules`. */
export interface CustomRule {
  id: string;
  /** Optional: every field has a default, as for a built-in rule. */
  meta?: CustomRuleMeta;
  /** A function, or its source as a string (to cross into a page). */
  runInPage: string | ((ctx: RuleContext) => unknown);
  applicability?: string | ((ctx: RuleContext) => unknown);
  data?: unknown;
}

/**
 * A custom rule's meta: the fields of a rule module's meta, each optional.
 * Severity, confidence and type are read in any case. See
 * docs/RULE_AUTHORING.md.
 */
export interface CustomRuleMeta {
  title?: string;
  description?: string;
  /** A list, or one string of tags separated by commas or spaces. */
  tags?: StringList;
  /** Default 'automatic'. */
  type?: RuleType | (string & {});
  /** Default 'moderate'. */
  defaultSeverity?: Severity | (string & {});
  /** Default 'medium'. */
  defaultConfidence?: Confidence | (string & {});
  wcagSc?: string[];
  normativeMappings?: Array<Partial<NormativeMapping>>;
  helpUrl?: string | null;
  margin?: MarginDeclaration;
  deprecated?: boolean;
  /** Required with `deprecated: true`. */
  deprecation?: { reason: string; sinceVersion: string; [field: string]: unknown };
  /** The reason codes the rule reports, which meta.review is checked against. */
  reasonCodes?: string[];
  /**
   * The facets the rule tests (docs/PROCEDURES.md): a WCAG criterion's, and,
   * for a pack's rule, a requirement of its pack's standard's.
   */
  coverage?: {
    facetsBySc?: Record<string, string[]>;
    facetsByRequirement?: Record<string, string[]>;
    [field: string]: unknown;
  };
  /** A pack rule's steps for each undecided finding, by reason code (docs/PACKS.md). */
  review?: Record<string, RuleReviewEntry>;
  [field: string]: unknown;
}

/**
 * How a person answers a rule's undecided finding of one reason code, in
 * English, and the facet it is filed under in the procedures: needed where
 * the rule claims several facets, with the criterion or requirement where it
 * claims that facet under several.
 */
export interface RuleReviewEntry {
  steps: string[];
  passWhen: string;
  failWhen: string;
  facet?: string;
  criterion?: string;
}

/**
 * What `runInPage(ctx)` and `applicability(ctx)` receive, built-in and custom
 * rules alike. See docs/RULE_AUTHORING.md, "What ctx carries". Nodes are
 * typed `any`: this file does not depend on the DOM library.
 */
export interface RuleContext {
  /** The page being scanned. */
  document: any;
  window: any;
  /** The roots the scan covers: the document, or what contextSelector resolved to. */
  root: any;
  /** The selector that scoped the run, if any. */
  contextSelector: ContextSelector | null;
  /** The rule's resolved definition. */
  rule: {
    ruleId: string;
    type: RuleType;
    defaultSeverity: Severity;
    defaultConfidence: Confidence;
    meta?: Record<string, unknown>;
    [field: string]: unknown;
  };
  /** `engineOptions.rules[ruleId]`, this rule's settings, if the caller gave any. */
  config: unknown;
  /** The standard and version the run targets, when a standard's profile selected it. */
  standard: { key: string; name: string; version: string } | null;
  helpers: RuleHelpers;
  /** The scan's options as resolved. */
  engineOptions: EngineOptions;
  /** Evidence the host application supplied (`engineOptions.probes`). */
  inputs: { probes?: unknown };
}

/** A helper's arguments and result are described in docs/RULE_HELPERS.md. */
export type RuleHelper = (...args: any[]) => any;

/**
 * Reads DOM properties and calls DOM methods so a page's named form controls
 * and images can't redirect them. See docs/RULE_AUTHORING.md section 1.2.
 */
export interface SafeDom {
  /** Reads any property, a method included, without calling it. */
  get(node: any, name: string): any;
  /** Calls any method. */
  call(node: any, name: string, ...args: any[]): any;
  /** `dom.<name>(node)` reads a DOM property; `dom.<name>(node, ...args)` calls a DOM method. */
  [name: string]: (node: any, ...args: any[]) => any;
}

/** `ctx.helpers`: the helpers docs/RULE_HELPERS.md documents, and no others. */
export interface RuleHelpers {
  dom: SafeDom;
  /** Color and contrast helpers (docs/RULE_HELPERS.md section 7). */
  contrast: { [name: string]: any };
  /** ARIA helpers (docs/RULE_HELPERS.md section 7). */
  aria: { [name: string]: any };
  queryAll: RuleHelper;
  queryAllDeep: RuleHelper;
  queryAllSmart: RuleHelper;
  queryAllSource: RuleHelper;
  getDoctypeInfo: RuleHelper;
  composedParent: RuleHelper;
  /** An element's computed style, read once per scan; an empty object where it can't be read. */
  computedStyle: RuleHelper;
  flatChildNodes: RuleHelper;
  flatChildElements: RuleHelper;
  flatParentElement: RuleHelper;
  buildSimpleSelector: RuleHelper;
  buildSelector: RuleHelper;
  getOuterHtmlSnippet: RuleHelper;
  isExcluded: RuleHelper;
  buildStructuralPath: RuleHelper;
  isAccTreeEligible: RuleHelper;
  isHiddenContent: RuleHelper;
  isIncludedInAccessibilityTree: RuleHelper;
  isDomVisibleEligible: RuleHelper;
  getEligibilityInfo: RuleHelper;
  getVisibilityHintsInfo: RuleHelper;
  isClipHidden: RuleHelper;
  containingBlockOf: RuleHelper;
  isVisuallyHidden: RuleHelper;
  readViewportContent: RuleHelper;
  getTextBoundaryKind: RuleHelper;
  isWholeDocumentScope: RuleHelper;
  isModalDialogOpen: RuleHelper;
  getOpenModalDialogs: RuleHelper;
  getDocumentRoots: RuleHelper;
  getAriaLabelInfo: RuleHelper;
  getAriaLabelledByInfo: RuleHelper;
  getAriaNameInfo: RuleHelper;
  getLandmarkNameInfo: RuleHelper;
  getLandmarkRole: RuleHelper;
  getAccessibleNameInfo: RuleHelper;
  getAccessibleDescriptionInfo: RuleHelper;
  getTextAlternativeInfo: RuleHelper;
  getTextAlternativeSignal: RuleHelper;
  describeTextAlternativeSignal: RuleHelper;
  getContentNameInfo: RuleHelper;
  getNameFromContentInfo: RuleHelper;
  getAssociatedLabelElements: RuleHelper;
  getAssociatedLabelsNameInfo: RuleHelper;
  getSvgChildText: RuleHelper;
  getNativeHostNameInfo: RuleHelper;
  labelContributesAccessibleName: RuleHelper;
  getLabelMethod: RuleHelper;
  getLabelStrength: RuleHelper;
  hasAccessibleName: RuleHelper;
  getElementByIdInTree: RuleHelper;
  resolveIdRefs: RuleHelper;
  getTextFromIdRefs: RuleHelper;
  getTextFromElements: RuleHelper;
  getReflectedRefs: RuleHelper;
  getRefElements: RuleHelper;
  animationsAtScanStart: RuleHelper;
  paintContainedByContentVisibility: RuleHelper;
  cssRulesOf: RuleHelper;
  cssConditionApplies: RuleHelper;
  getStyleSheets: RuleHelper;
  getCustomElementInternals: RuleHelper;
  getInternalsNameInfo: RuleHelper;
  getInternalsStateInfo: RuleHelper;
  internalsQuestion: RuleHelper;
  getInternalsRoleElements: RuleHelper;
  getTextFromIdRefsIdrefEligible: RuleHelper;
  getRoleInfo: RuleHelper;
  getFocusableInfo: RuleHelper;
  isPresentationalRoleIgnored: RuleHelper;
  getEventListenerInfo: RuleHelper;
  getLiveRegionRecord: RuleHelper;
  hasLandmarkScopingAncestor: RuleHelper;
  getAttributeInfo: RuleHelper;
  isValidLanguageTag: RuleHelper;
  isRegisteredLanguageSubtag: RuleHelper;
  isIso639LanguageCode: RuleHelper;
  getImagesUsingMap: RuleHelper;
  parseHtmlInteger: RuleHelper;
  hasSkipLinkWording: RuleHelper;
  reportOccurrence: RuleHelper;
  resolveTieredOutcome: RuleHelper;
  getPerfStats: RuleHelper;
  resetPerfStats: RuleHelper;
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
  /**
   * False in jsdom and other DOM emulators, and then the only field
   * besides `internalsHook`, `listenerHook` and `liveRegionHook`, where the
   * page runs them.
   */
  layout: boolean;
  /** CSS pixels. */
  viewport?: { width: number; height: number };
  devicePixelRatio?: number;
  colorScheme?: 'light' | 'dark';
  /**
   * Whether `forced-colors: active` matched: 'active' under Windows high
   * contrast or an emulated forced-colors. The scan measures the page's own
   * colors all the same; where it could not, the contrast rules'
   * occurrences carry `details.forcedColors: true`. Only with a layout.
   */
  forcedColors?: 'active' | 'none';
  /**
   * Under forced colors, true when the page's own CSS reacts to them in a
   * way the scan can't hold off: a `forced-colors` media query, which still
   * matches, or a system color (GrayText, Canvas...), which still takes the
   * forced palette's. The contrast results can then differ from a scan with
   * forced colors off. Absent otherwise.
   */
  forcedColorsCss?: true;
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
  /**
   * How many elements with content-visibility: auto had their content
   * skipped, which the scan laid out as it is near the viewport and let the
   * browser skip again afterwards. Absent when there were none.
   */
  contentVisibilitySkipped?: number;
  /**
   * Whether the page runs the internals hook (internalsHookScript) in this
   * document's realm: 'early' when it was installed before the page's
   * scripts and is still the realm's attachInternals, 'late' otherwise.
   * Absent without one.
   */
  internalsHook?: 'early' | 'late';
  /**
   * Whether the page runs the listener hook (listenerHookScript) in this
   * document's realm: 'early' when it was installed before the page's
   * scripts and is still the realm's addEventListener, 'late' otherwise.
   * Absent without one.
   */
  listenerHook?: 'early' | 'late';
  /**
   * Whether the page runs the live-region hook (liveRegionHookScript) in
   * this document's realm: 'early' when it was installed before the
   * document finished loading, so it saw every change since, 'late'
   * otherwise. Absent without one.
   */
  liveRegionHook?: 'early' | 'late';
}

export interface EngineInfo {
  tag: string;
  /** The @surea11y/core release that produced the result, e.g. "1.10.0". */
  version: string;
  schemaVersion: string;
  locale: LocaleResolution;
  wcagVersion: '2.0' | '2.1' | '2.2';
  /**
   * The level the reported criteria were gated by: engineOptions.wcagLevel
   * when it was given and valid, or else the level the selection implies
   * (runOnly.wcag.level, or level tags). Absent when the scan had none.
   */
  wcagLevel?: 'A' | 'AA' | 'AAA';
  environment: RenderingEnvironment;
  profile?: string;
  profileExcludes?: { rules: string[]; criteria: string[] };
  optInRules?: string[];
  mappings?: string[];
  /** 'findings' when output.detail made pass and notApplicable results compact. */
  outputDetail?: 'findings';
  /** The packs the scan ran with, as name@version (engineOptions.packs). */
  packs?: string[];
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
  /**
   * Where to read how to fix it; '' when the rule names none. Every result
   * carries it; optional so objects built for earlier versions still fit.
   */
  helpUrl?: string;
  /** The rule's tags, its own and the engine's. Every result carries them; optional as helpUrl. */
  tags?: string[];
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

/**
 * Which way a cantTell finding points, when the page gives evidence for one.
 * The outcome stays cantTell: a lean is advice, not a verdict. Absent where
 * only a person can judge.
 */
export interface Lean {
  toward: 'pass' | 'fail';
  /** What in the page points that way, in the scan's locale. */
  why: string;
  /** The facts the rule read: a name and a plain value each. */
  signals: { signal: string; value: string | number | boolean | null }[];
  /** What could make the lean wrong, in the scan's locale. */
  caution?: string;
  /** How often this lean was right, once it has been measured. */
  measured?: { agreed: number; cases: number; corpus?: string; coreVersion?: string };
  i18n?: { whyKey?: string; cautionKey?: string; params?: Record<string, unknown> };
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
  /** On a cantTell occurrence only: the answer the evidence makes likely. */
  lean?: Lean;
  /** On a cantTell occurrence only: how a person answers the question, in the scan's locale. */
  howToCheck?: HowToCheck;
  /** Absent on manual-review's finding, which is about the whole page. */
  data?: {
    visibilityFilter?: VisibilityFilter;
    /**
     * Rule-specific and not a stable contract, except `reasonCode`, which
     * identifies the finding (docs/API_STABILITY.md, "Finding identity").
     */
    /** null where a rule reports no details (img-alt-quality, input-image-alt-decorative). */
    details?: { reasonCode?: string; [field: string]: unknown } | null;
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
  /**
   * How much room a value may have and still count as close: `relative`, a
   * fraction of the threshold (above 0, at most 1), or `absolute`, an amount
   * in `unit` (above 0). With a band, a margin is reported only when the
   * closest element is inside it; without one, whenever an element met the
   * limit.
   */
  band?: { relative: number } | { absolute: number };
}

/**
 * The measurement that came closest to its threshold while meeting it. Never
 * a finding: it does not change the outcome or the occurrences. See
 * docs/OUTPUT_SCHEMA.md.
 */
export interface Margin extends Omit<MarginDeclaration, 'band'> {
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

/**
 * A pass or notApplicable under output.detail 'findings': its rule, outcome
 * and type, and its margin or error when it has one. Its title, description
 * and meta are the catalog's (getCheckDefById).
 */
export interface CompactCheckResult {
  ruleId: string;
  outcome: 'pass' | 'notApplicable';
  type: RuleType;
  margin?: Margin;
  error?: string;
}

export interface CheckResult {
  ruleId: string;
  outcome: Outcome;
  outcomeNormalized: OutcomeNormalized;
  severity: Severity;
  /** The rule's own severity, when the applied profile gave it another one. */
  ruleSeverity?: Severity;
  /** The outcome the rule found, when the policy's allowedOutcomes made it cantTell. */
  policyOutcome?: 'fail' | 'pass' | 'cantTell' | 'notApplicable';
  confidence: Confidence;
  type: RuleType;
  occurrences: Occurrence[];
  title: string;
  description: string;
  /** variantOfTitleKey: a variant's only, its base rule's titleKey. */
  i18n: { titleKey: string; descriptionKey: string; variantOfTitleKey?: string } | null;
  meta: RuleMeta;
  /** The resolved options this rule ran under. */
  engineOptions: Record<string, unknown>;
  schemaVersion: string;
  /** The rulesResults entries that group this rule in this run. */
  rollupIds: string[];
  /** A pack's variant only: the id of the rule it runs at other settings. */
  variantOf?: string;
  /** Page-level data a rule reports whatever its outcome; not a stable contract. */
  data?: Record<string, unknown>;
  /** Present only on a rule that declares `meta.margin`, when an element met its threshold. */
  margin?: Margin;
  /** Present only when the target WCAG version changed this outcome. */
  wcagVersionScope?: {
    target: '2.0' | '2.1' | '2.2';
    removedSc: string[];
    coercedFrom: 'fail';
    /** Under 2.0 or 2.1: their 2023 errata count the criterion as always satisfied. */
    by?: 'errata';
  };
  /**
   * Present when the rule did not complete (cantTell with no occurrences),
   * or with the engine's notes on what it changed in what the rule returned
   * (docs/OUTPUT_SCHEMA.md, `error`).
   */
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
      /** Its rules: its own list, with the custom rules mapped to its criteria that ran. */
      checksIds: string[];
      /** The custom rules among checksIds; absent when there are none. */
      customChecksIds?: string[];
      contributors: Array<{
        testId: string;
        outcome: string;
        /**
         * null where it has none. A contributor that didn't run ('missing')
         * carries no severity at all; typed as before for compatibility.
         */
        severity: string | null;
        /** A rule from engineOptions.customRules. */
        custom?: true;
        /**
         * A rule that didn't run ('missing') because the scan did not select
         * it, in a rollup reported for the rules the scan named on its own:
         * the criterion was checked in part (reasonCode
         * composite.rollup.cantTell.notSelectedChild).
         */
        notSelected?: true;
        /**
         * A rule a standard's rollup judged by its findings (the rollup's
         * meta.contributions): `outcome` is its outcome here, and
         * `checkOutcome` the rule's own.
         */
        byReasonCode?: true;
        checkOutcome?: string;
        /**
         * Of such a rule, the rollup's requirements its counted findings
         * name, when every one of them names some: those the rollup names
         * for it.
         */
        requirements?: string[];
      }>;
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
  /**
   * With engine.outputDetail 'findings', a pass or notApplicable that lists
   * no occurrences is a CompactCheckResult: read it as `CheckResult |
   * CompactCheckResult`. The reporters read either.
   */
  checksResults: CheckResult[];
  rulesResults: CompositeResult[];
  /**
   * The registered standards the result names besides WCAG, in registry
   * order, with what a reporter needs to show them; absent when it names
   * none.
   */
  standards?: ResultStandard[];
  overriddenBuiltinIds: string[];
  /**
   * engineOptions.customRules entries that were not run, and why; empty when
   * all ran. `excluded: true` marks one the caller's own excludes left out,
   * which is their choice rather than a gap.
   */
  skippedCustomRules: { id: string | null; reason: string; excluded?: true }[];
  /** engineOptions.packs that were not run, and why; absent when all ran. */
  skippedPacks?: { name: string | null; reason: string }[];
}

/**
 * A result scanned with output.detail 'findings'. Type a compact scan's
 * result as this, rather than ScanResult, to have a compact check result's
 * missing fields checked: `'meta' in c` tells the two apart.
 */
export interface CompactScanResult extends Omit<ScanResult, 'checksResults'> {
  checksResults: (CheckResult | CompactCheckResult)[];
}

/** A standard a result names besides WCAG (result.standards). */
export interface ResultStandard {
  /** Its key in engineOptions.mappings, SARIF tags and JUnit properties ('en301549'). */
  key: string;
  /** The name its entries carry in `standard` ('EN 301 549'). */
  standard: string;
  /** The language its own rollups' titles are written in, when not the scan's. */
  titleLang?: string;
  /** The note above its own rollups, in the scan's language. */
  note?: string;
}

/** A child frame that answered, with its own frames, recursively. */
export interface ScannedFrame {
  url: string | null;
  /**
   * A CSS selector for the <iframe>/<frame> in the parent's document. Every
   * result carries it; optional so objects built for earlier versions still fit.
   */
  selector?: string | null;
  /** The frame element's title attribute, or null. Every result carries it; optional as selector. */
  title?: string | null;
  topFrame: ScanResult;
  frames: FrameEntry[];
}

/** A child frame that could not be reached (no responder, or a timeout). */
export interface UnreachableFrame {
  url: string | null;
  /**
   * A CSS selector for the <iframe>/<frame> in the parent's document. Every
   * result carries it; optional so objects built for earlier versions still fit.
   */
  selector?: string | null;
  /** The frame element's title attribute, or null. Every result carries it; optional as selector. */
  title?: string | null;
  error: string;
}

export type FrameEntry = ScannedFrame | UnreachableFrame;

/** What runa11yCoreAcrossFrames resolves to: a tree, not a flat list. */
export interface CrossFrameResult {
  topFrame: ScanResult;
  frames: FrameEntry[];
}

/**
 * A frame scan whose frames are each a result of their own, as the browser
 * bindings' frames(true) returns one. The reporters and getMargins read it as a
 * cross-frame result.
 */
export interface BindingFramesResult {
  topFrame: ScanResult;
  frames: Array<ScanResult | UnreachableFrame>;
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
export function flattenCrossFrameResult(
  value: CrossFrameResult | BindingFramesResult | ScanResult
): FlatFrame[];

/**
 * An occurrence's outcome, as the reporters read it: its own tier
 * (`occurrenceOutcome`) when it is 'fail' or 'cantTell', or else its check's
 * outcome when that is; null otherwise.
 */
export function occurrenceOutcome(
  check: Pick<CheckResult, 'outcome'> | null | undefined,
  occurrence: Occurrence | null | undefined
): 'fail' | 'cantTell' | null;

/**
 * Where an occurrence goes in a review: 'leanFail' or 'leanPass' for an
 * undecided one whose lean points that way, 'open' for one only a person can
 * judge.
 */
export type ReviewGroup = 'leanFail' | 'leanPass' | 'open';

/**
 * Where an occurrence goes in a review, as the HTML report groups them:
 * 'fail' for a failure, a ReviewGroup for an undecided one (its outcome, as
 * occurrenceOutcome reads it, is 'cantTell'), and null for neither.
 */
export function reviewGroupOf(
  check: Pick<CheckResult, 'outcome'> | null | undefined,
  occurrence: Occurrence | null | undefined
): 'fail' | ReviewGroup | null;

/** An undecided finding whose lean points to fail. */
export interface LeaningFailure {
  ruleId: string;
  /** Its reason code, or 'DEFAULT'. */
  reasonCode: string;
  occurrence: Occurrence;
  /** For a finding inside a frame of a cross-frame result: the frame's path (FramePosition.path). */
  frame?: string[];
}

/**
 * The undecided findings that lean fail and gate under the reporters'
 * `leanFailAs` (docs/LEANS.md): the findings of a rule whose every WCAG
 * criterion is outside the scan's target are left out, as JUnit and SARIF
 * leave them out. With `wcagOnly`, only those of rules mapped to a WCAG
 * criterion in the target, as `leanFailWcagOnly` does. A cross-frame result
 * covers every frame. Throws a TypeError for anything else.
 */
export function leaningFailures(
  result: ScanResult | CrossFrameResult | BindingFramesResult,
  options?: { wcagOnly?: boolean }
): LeaningFailure[];

// ---- Scanning ----

/**
 * Scans the current `window`/`document` (a real page, or jsdom set up on the
 * globals), using the rule modules from the package. For Node.
 */
export function runDomRulesInPage(
  pageUrl?: string | null,
  contextSelector?: ContextSelector | null,
  engineOptions?: EngineOptions | StrictEngineOptions | null,
  runOnly?: RunOnly | LegacyTagRunOnly | StringList | null
): ScanResult;

export interface HowToCheck {
  steps: string[];
  passWhen: string;
  failWhen: string;
}

/**
 * A copy of a scan result, a cross-frame result or a binding's frames result
 * whose undecided findings carry howToCheck in the scan's locale. Each frame's
 * result in the tree gains them; a frame that could not be scanned is left as
 * it is. runDomRulesInPage does this itself; a binding that runs
 * runa11yCoreInPage in a page calls it on what comes back.
 */
export function addHowToCheck<T extends ScanResult | CrossFrameResult | BindingFramesResult>(
  result: T,
  options?: HowToCheckOptions
): T;

/**
 * The packs a result was scanned with: their rules' meta.review give steps,
 * in English or as their dictionaries translate them, and their variants are known for howToCheckFor.
 */
export interface HowToCheckOptions {
  packs?: readonly unknown[] | null;
  /**
   * addHowToCheck and applyHowToCheck only: the locale to give the steps in
   * ('fr-CA'), or a list of locales, most wanted first, in place of the
   * scan's. Steps a finding already has are given again in it; English is
   * the fallback for every step a locale lacks.
   */
  locale?: string | readonly string[] | null;
}

/**
 * A rule's steps for one reason code, in a locale (English when
 * untranslated), or null: core's, a variant's base rule's where it has none
 * of its own, and, with options.packs, a pack rule's own.
 */
export function howToCheckFor(
  ruleId: string,
  reasonCode: string,
  locale?: string,
  options?: HowToCheckOptions
): HowToCheck | null;

/** Something a procedure needs besides a browser, with its name in the locale. */
export interface ProcedureTool {
  id: 'keyboard' | 'pointer' | 'screen-reader' | 'zoom' | 'contrast-theme' | 'devtools' | (string & {});
  label: string;
}

/**
 * A variant: the steps one rule's finding shows for a reason code
 * (howToCheck), under the facet the code tests.
 */
export interface ProcedureVariant extends HowToCheck {
  ruleId: string;
  reasonCode: string;
}

/** One facet of a requirement: a test objective, and how a person assesses it. */
export interface ProcedureFacet {
  id: string;
  label: string;
  /** full: rules decide it; partial: rules decide part of it; manual: only a person can. */
  automation: 'full' | 'partial' | 'manual';
  /** A facet broader than any one rule, kept for coverage reporting. */
  macro?: true;
  /**
   * The rules that claim the facet (meta.coverage): core's, then, with
   * options.packs, the packs' own rules and variants.
   */
  rules: string[];
  /** What its procedure needs besides a browser; empty without a procedure. */
  tools: ProcedureTool[];
  /**
   * How a person assesses the facet on a whole page; null where its
   * coveredBy facet's procedure does, or where core has none yet.
   */
  procedure: HowToCheck | null;
  /**
   * A pack's requirement that replaces this WCAG facet's general procedure
   * (standard.procedures, replace): the pack's name. The procedure and tools
   * are then the pack's, in English; rules and variants stay core's.
   */
  procedureFrom?: string;
  /** The broader facet of the same criterion whose procedure assesses this one. */
  coveredBy?: string;
  variants: ProcedureVariant[];
}

/** How a person assesses a requirement by hand (docs/PROCEDURES.md). */
export interface Procedures {
  /** 'wcag', 'best-practice', or the name of a pack's standard ('EN 301 549'). */
  standard: 'wcag' | 'best-practice' | (string & {});
  /** The criterion ('1.4.13'), 'best-practice', or a pack's requirement ('9.1.4.3'). */
  id: string;
  /** A pack's requirement: the version of its standard it is read from. */
  version?: string;
  /** A pack's requirement: its title, or null where the pack gives none. */
  title: string | null;
  level: 'A' | 'AA' | 'AAA' | null;
  /** A pack's requirement that restates a WCAG criterion: that criterion, whose facets it has. */
  wcag?: string;
  /** A pack's requirement of its own: the WCAG criteria it relates to, without restating any. */
  relatesTo?: string[];
  /** Whether every facet has a procedure, its own or its coveredBy facet's. */
  complete: boolean;
  /**
   * The rules that test the criterion (wcagSc), core's then the packs'; the
   * best practices'; or the pack rules that claim a pack requirement's facets.
   */
  rules: string[];
  facets: ProcedureFacet[];
}

export interface ProceduresOptions {
  /** A locale ('fr-CA') or a list of them, most wanted first; English is the fallback. */
  locale?: string | readonly string[] | null;
  /**
   * Packs whose standards' requirements can be read (their standard.procedures),
   * and whose rules are listed under the facets they claim.
   */
  packs?: readonly object[];
  /** 'wcag' (the default), 'best-practice', or a pack's standard by key or name. */
  standard?: string;
  /** A version of the pack's standard; the latest that has the requirement by default. */
  version?: string;
}

/**
 * How a person assesses a WCAG 2.2 criterion ('1.4.13'), the best practices
 * ('best-practice'), or, with options.packs, a requirement of a pack's
 * standard, by hand, read from disk in Node; null for a requirement none of
 * them knows. In a browser bundle it warns once and returns null: use
 * proceduresFrom from @surea11y/core/procedures.
 */
export function proceduresFor(requirement: string, options?: ProceduresOptions): Procedures | null;

/** A group of a standard's requirements: a WCAG principle or guideline, or a pack's own group. */
export interface ProcedureGroup {
  id: string;
  title: string;
  /** The requirements in this group itself, in the standard's order. */
  requirements: string[];
  /** The groups under it: a principle's guidelines. */
  groups: ProcedureGroup[];
}

export interface ProcedureListOptions {
  /** 'wcag' (the default), 'best-practice', or a pack's standard by key or name. */
  standard?: string;
  /** WCAG's version ('2.2', the default), or the pack's standard's (the latest that gives procedures). */
  version?: string;
  /** WCAG only: the levels to list; all by default. */
  levels?: 'A' | 'AA' | 'AAA' | readonly ('A' | 'AA' | 'AAA')[];
  locale?: string | readonly string[] | null;
  packs?: readonly object[];
  /** Keep only the facets whose procedure needs one of these tools. */
  tools?: ProcedureTool['id'] | readonly ProcedureTool['id'][];
  /** Keep only the facets with one of these automation levels. */
  automation?: ProcedureFacet['automation'] | readonly ProcedureFacet['automation'][];
  /** Keep only the facets one of these rules claims. */
  rules?: string | readonly string[];
}

/** Every requirement of a standard, in its order, and the groups it puts them in. */
export interface ProcedureList {
  /** 'wcag', 'best-practice', or the name of a pack's standard. */
  standard: string;
  /** A pack's standard: its key. */
  key?: string;
  /** The version listed; null for the best practices. */
  version: string | null;
  /** The locale the text was read in: the first of options.locale a dictionary was given for, or 'en'. */
  locale: string;
  /** What shaped it: the WCAG levels asked for and the filters, each null where not given. */
  scope: {
    levels: string[] | null;
    tools: string[] | null;
    automation: string[] | null;
    rules: string[] | null;
  };
  /**
   * Each requirement as proceduresFor gives it; with filters, only the
   * matching facets (a technology facet keeps the one it is covered by), and
   * only the requirements left with any. complete is the requirement's own.
   */
  requirements: Procedures[];
  groups: ProcedureGroup[];
}

/** One thing a person does to assess a standard: a general procedure, once. */
export interface ProcedureChecklistItem {
  /** '<criterion>/<facet>' for core's procedure; '<requirement>/<facet>' for a pack's own or replaced one. */
  key: string;
  facet: string;
  label: string;
  automation: ProcedureFacet['automation'];
  /** The WCAG criterion the facet is of, or null for a pack's own requirement. */
  wcag: string | null;
  /** The requirements it serves, in the standard's order. */
  requirements: string[];
  /** The technology facets it assesses (their coveredBy). */
  covers: string[];
  /** The rules that claim it or a facet it covers. */
  rules: string[];
  tools: ProcedureTool[];
  /** Naming every requirement it serves where it says what fails. */
  procedure: HowToCheck;
  /** A pack's procedure in place of core's: the pack's name. */
  procedureFrom?: string;
}

export interface ProcedureChecklist {
  standard: string;
  key?: string;
  version: string | null;
  /** The locale the text was read in: the first of options.locale a dictionary was given for, or 'en'. */
  locale: string;
  /** What shaped it: the WCAG levels asked for and the filters, each null where not given. */
  scope: {
    levels: string[] | null;
    tools: string[] | null;
    automation: string[] | null;
    rules: string[] | null;
  };
  items: ProcedureChecklistItem[];
  groups: ProcedureGroup[];
}

/** A requirement related to another: a pack's to a WCAG criterion, or a WCAG criterion to a pack's. */
export interface RelatedRequirement {
  /** 'wcag', or the name of a pack's standard. */
  standard: string;
  /** A pack's standard: its key. */
  key?: string;
  id: string;
  /** A pack's standard: the version read. */
  version?: string;
  title: string | null;
  /** A WCAG criterion: its level. */
  level?: 'A' | 'AA' | 'AAA' | null;
  /** The pack's requirement restates the criterion, or relates to it without restating it. */
  relation: 'restates' | 'relatesTo';
}

export interface RelatedRequirementsOptions {
  packs?: readonly object[];
  /** For a pack's requirement: its standard, by key or name. */
  standard?: string;
  /** For a pack's requirement: a version of its standard; the latest that has it by default. */
  version?: string;
}

export interface RenderProceduresOptions {
  /** 'html' (the default): one self-contained page; or 'markdown'. */
  format?: 'html' | 'markdown';
  /** The page's words in this locale; by default the one the procedures were read in. */
  locale?: string | readonly string[] | null;
  /** The page's title; by default one naming the standard. */
  title?: string;
  /** A list: under each facet, the steps a scan's undecided finding gives (its variants). */
  variants?: boolean;
  /** A checklist in HTML: false for a page without results to record. */
  record?: boolean;
  /** HTML: the page's content alone, with no document, style or script, to put in a page of one's own. */
  fragment?: boolean;
  /** The packs the procedures were read with: their rules' steps and their titles' language. */
  packs?: readonly object[];
}

/**
 * Procedures as a document (docs/PROCEDURES.md#rendering-them): what
 * listProcedures, procedureChecklist or proceduresFor gives, as one
 * self-contained HTML page or as Markdown. A checklist page records a result
 * and notes per item, kept in the browser and downloaded as JSON or CSV.
 * Throws a TypeError for anything else. In a browser bundle it warns once
 * and returns null: use renderProceduresFrom from @surea11y/core/procedures.
 */
export function renderProcedures(
  input: ProcedureList | ProcedureChecklist | Procedures,
  options?: RenderProceduresOptions
): string;

/**
 * Every requirement of a standard, in its order and groups (docs/PROCEDURES.md),
 * read from disk, in Node; null for a standard or version it doesn't know. In a
 * browser bundle it warns once and returns null: use listProceduresFrom from
 * @surea11y/core/procedures.
 */
export function listProcedures(options?: ProcedureListOptions): ProcedureList | null;

/**
 * What a person does to assess a standard by hand, once each: one item per
 * general procedure. Takes listProcedures' options. In a browser bundle it
 * warns once and returns null: use procedureChecklistFrom.
 */
export function procedureChecklist(options?: ProcedureListOptions): ProcedureChecklist | null;

/**
 * For a WCAG criterion, the packs' requirements that restate or relate to it;
 * for a pack's requirement, the WCAG criteria it restates or relates to.
 */
export function relatedRequirements(
  requirement: string,
  options?: RelatedRequirementsOptions
): RelatedRequirement[];

/**
 * The same scan from a single self-contained function, which can be
 * serialized into a page (the browser bindings inject its source).
 */
export function runa11yCoreInPage(
  pageUrl?: string | null,
  contextSelector?: ContextSelector | null,
  engineOptions?: EngineOptions | StrictEngineOptions | null,
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
 * Fetches, in the page, the style sheets the page can't read (another
 * origin's, linked or imported), for engineOptions.styleSheetTexts. Only those the
 * server shares (CORS) come back; each fetch gives up after `timeoutMs`
 * (default 5000). Never rejects; [] without a document or fetch.
 */
export function preloadStyleSheets(options?: {
  timeoutMs?: number;
  document?: unknown;
}): Promise<Array<{ href: string; text: string }>>;

/**
 * The internals hook, opt-in: a script to run in every frame of a page before
 * the page's own scripts. A custom element that keeps its ElementInternals in
 * a private field names itself in a way no page script can read, so the name
 * rules ask (name_internals) instead of deciding. The hook wraps
 * HTMLElement.prototype.attachInternals, records each element's internals for
 * the scan, and otherwise gives the page exactly what it would have had.
 * `engine.environment.internalsHook` says whether a scan saw it. See
 * docs/INTEGRATION.md.
 *
 * @example
 * // Playwright: every frame, before any of the page's scripts.
 * await page.addInitScript({ content: internalsHookScript() });
 * // Puppeteer
 * await page.evaluateOnNewDocument(internalsHookScript());
 * // A jsdom test setup file: the document has loaded, but no component is
 * // defined yet, so say the hook is early.
 * window.eval(internalsHookScript({ early: true }));
 */
export function internalsHookScript(options?: InternalsHookOptions): string;

export interface InternalsHookOptions {
  /**
   * Record the hook as early whatever the document's state. A promise the
   * caller makes: that none of the page's or the test's code has run yet. If
   * it has, an element that attached internals before the hook is judged on
   * its markup. Default: early only while the document is loading.
   */
  early?: boolean;
}

/**
 * The listener hook, opt-in: a script to run in every frame of a page before
 * the page's own scripts. The keyboard rules read inline handlers
 * (onclick="…") from the markup; a listener added with addEventListener, or
 * set as a property (el.onclick = fn), is invisible to them. The hook wraps
 * EventTarget.prototype.addEventListener and removeEventListener and the
 * on* property setters, records which elements have click, key, focus,
 * mouse and paste listeners, and otherwise gives the page exactly what it would have
 * had. `engine.environment.listenerHook` says whether a scan saw it. See
 * docs/INTEGRATION.md.
 *
 * @example
 * // Playwright: every frame, before any of the page's scripts.
 * await page.addInitScript({ content: listenerHookScript() });
 * // Puppeteer
 * await page.evaluateOnNewDocument(listenerHookScript());
 * // A jsdom test setup file, before the code under test runs.
 * window.eval(listenerHookScript({ early: true }));
 */
export function listenerHookScript(options?: ListenerHookOptions): string;

export interface ListenerHookOptions {
  /**
   * Record the hook as early whatever the document's state. A promise the
   * caller makes: that none of the page's or the test's code has run yet. If
   * it has, a listener added before the hook is not seen, and the rules ask
   * where they would otherwise decide. Default: early only while the
   * document is loading.
   */
  early?: boolean;
}

/**
 * The live-region hook's script: run it in every frame of a page before
 * the page's own scripts, and a scan sees what the page's live regions were
 * given while it ran. From the load event on, it records each text a shown
 * live region reachable by assistive technology is given (getAnnouncements),
 * and live-region-announcements asks about a region added with its text
 * already in it, or shown and filled in the same task. It only observes,
 * with one MutationObserver. `engine.environment.liveRegionHook` says
 * whether a scan saw it. See docs/INTEGRATION.md.
 *
 * @example
 * // Playwright: every frame, before any of the page's scripts.
 * await page.addInitScript({ content: liveRegionHookScript() });
 * // A jsdom test setup file, after the document has loaded.
 * window.eval(liveRegionHookScript({ early: true }));
 */
export function liveRegionHookScript(options?: LiveRegionHookOptions): string;

/** What a hook's record does to a reason code: see HOOK_REASON_CODES. */
export type HookEffect = 'reports' | 'decides' | 'leans';

export interface HookReasonCode {
  readonly ruleId: string;
  readonly reasonCode: string;
  /**
   * 'reports': given only where the hook ran. 'decides': the hook's record
   * settles it (a question becomes a pass or a fail, or a fail a question).
   * 'leans': the hook's record sets or changes its lean.
   */
  readonly effect: HookEffect;
}

/**
 * The reason codes each opt-in hook decides or changes, one entry per rule
 * and code, so a binding can say what installing a hook does without copying
 * the codes (docs/BINDING_AUTHORS_GUIDE.md). Frozen; a minor release may add
 * entries.
 */
export const HOOK_REASON_CODES: {
  readonly internals: readonly HookReasonCode[];
  readonly listener: readonly HookReasonCode[];
  readonly liveRegion: readonly HookReasonCode[];
};

export interface LiveRegionHookOptions {
  /**
   * Record the hook as early whatever the document's state. A promise the
   * caller makes: that no change the test cares about has happened yet.
   * Default: early only when installed before the document finished
   * loading.
   */
  early?: boolean;
}

/** A text a live region was given while shown and reachable. */
export interface Announcement {
  /** The region's text, whitespace collapsed, up to 300 characters. */
  text: string;
  politeness: 'polite' | 'assertive';
  /** performance.now(), in milliseconds, when the hook saw it. */
  time: number;
  /**
   * The change's place among all the changes the page made, counted in
   * mutation records, so changes made in one task keep their order.
   */
  order: number;
  /**
   * true when the region was behind an open modal <dialog> in the document
   * when it was given the text: the browser made it inert, so assistive
   * technology did not get it. Only listed with { includeBehindModal: true }.
   */
  behindModal: boolean;
  /** The live region, which may since have left the page. */
  element: Element;
}

/**
 * What the page's live regions were given while shown and reachable by
 * assistive technology, as the live-region hook recorded it: what the page
 * made available to announce, not what a screen reader said. A text given
 * to a region behind an open modal dialog is left out, unless
 * `includeBehindModal: true`, which lists it with behindModal: true. Changes
 * made in the current task are included. null when the window has no hook.
 * `win` defaults to the global `window`. Self-contained, like
 * runa11yCoreInPage: `getAnnouncements.toString()` evaluated in a page works
 * there. With `selectors: true`, each entry names its region by a selector
 * instead of holding it, so the list crosses a driver (page.evaluate).
 */
export function getAnnouncements(
  win: Window | undefined,
  options: GetAnnouncementsOptions & { selectors: true }
): LocatedAnnouncement[] | null;
export function getAnnouncements(
  options: GetAnnouncementsOptions & { selectors: true }
): LocatedAnnouncement[] | null;
export function getAnnouncements(
  win?: Window,
  options?: GetAnnouncementsOptions
): Announcement[] | null;
export function getAnnouncements(options: GetAnnouncementsOptions): Announcement[] | null;

/**
 * An announcement as getAnnouncements({ selectors: true }) gives it: the
 * region named by a selector, in place of the element.
 */
export interface LocatedAnnouncement extends Omit<Announcement, 'element'> {
  /**
   * The region: its id where that is unique in its tree, else its tag and
   * place among its siblings up to the root. null for a region no longer in
   * the page.
   */
  selector: string | null;
  /** For a region inside a shadow root: the shadow hosts leading to it, outermost first. */
  shadowHostSelectors?: string[];
}

export interface GetAnnouncementsOptions {
  /**
   * Also list the texts given to a region behind an open modal dialog,
   * which assistive technology did not get, marked behindModal: true.
   * Default: false.
   */
  includeBehindModal?: boolean;
  /**
   * Name each region by a selector (`selector`, and `shadowHostSelectors`
   * inside a shadow root) instead of holding it in `element`, so the list
   * can be returned through a driver's page.evaluate. Default: false.
   */
  selectors?: boolean;
}

/**
 * The WCAG target a conformance profile comes to, for `runOnly.wcag`:
 * `{ version: '2.2', level: 'AA' }` for `'wcag22-aa'`. null for a name that
 * is no profile, or a profile that is no WCAG version and level.
 */
export function getProfileWcagTarget(profile: string): WcagTarget | null;

/**
 * Every margin in a scan result, as `{ ruleId, ...margin }`, sorted by
 * `ruleId`. Of a cross-frame result, every frame's, a child frame's with
 * `frame`, the path to it.
 */
export function getMargins(
  result: ScanResult | CrossFrameResult | BindingFramesResult | null | undefined
): Array<Margin & { ruleId: string; frame?: string[] }>;

/**
 * Scans this frame and every child frame that called
 * a11yCoreEnableFrameResponder(), over postMessage. For code running inside
 * the page with no automation driver; see docs/INTEGRATION.md.
 */
export function runa11yCoreAcrossFrames(
  pageUrl?: string | null,
  contextSelector?: ContextSelector | null,
  engineOptions?: EngineOptions | StrictEngineOptions | null,
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
  /** The settings a pack's variant of this rule may change; absent when it offers none. */
  variantSettings?: VariantSetting[];
  [field: string]: unknown;
}

/** A setting a rule offers its variants (docs/RULE_SETTINGS.md). */
export interface VariantSetting {
  name: string;
  /** The value the rule itself uses. */
  default: number | string | boolean | null;
  /** The values it takes, when it is a choice; null for a threshold. */
  values: Array<number | string | boolean | null> | null;
  /** What it changes. */
  description: string;
  /** What in WCAG, or another standard, it stands on. */
  basis: string;
}

/** One composite rule, as getRulesCatalog lists it. */
export interface RuleCatalogEntry {
  id: string;
  /** Its rules, with the custom rules of engineOptions.customRules mapped to its criteria. */
  checksIds: string[];
  /** The custom rules among checksIds; absent when there are none. */
  customChecksIds?: string[];
  meta: Record<string, unknown>;
  [field: string]: unknown;
}

/** Every atomic rule the given options would make available. */
export function getChecksCatalog(
  engineOptions?: EngineOptions | StrictEngineOptions | null
): CheckCatalogEntry[];

/** Every composite rule the given options would make available. */
export function getRulesCatalog(
  engineOptions?: EngineOptions | StrictEngineOptions | null
): RuleCatalogEntry[];

/** One rule's catalog entry, a custom rule's included, or null. */
export function getCheckDefById(
  ruleId: string,
  engineOptions?: EngineOptions | StrictEngineOptions | null
): CheckCatalogEntry | null;

/** One composite rule's catalog entry, or null. */
export function getCompositeRuleById(
  id: string,
  engineOptions?: EngineOptions | StrictEngineOptions | null
): RuleCatalogEntry | null;

/** The rules a scan with this selection and these options runs. */
export function getChecksForRunOnly(
  runOnly?: RunOnly | LegacyTagRunOnly | StringList | null,
  engineOptions?: EngineOptions | StrictEngineOptions | null
): CheckCatalogEntry[];

/**
 * The composite rules a scan with this selection and these options reports:
 * those the selection selects, and those of the criteria the rules it names
 * on its own check. Like every catalog function, it checks engineOptions as
 * a scan does: an invalid option is warned about, and throws
 * INVALID_ENGINE_OPTIONS under strictOptions.
 */
export function getRulesForRunOnly(
  runOnly?: RunOnly | LegacyTagRunOnly | StringList | null,
  engineOptions?: EngineOptions | StrictEngineOptions | null
): RuleCatalogEntry[];

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
export function getTestsForRunOnly(runOnly: unknown, engineOptions?: unknown): unknown[];
/** @internal */
export const __internal: Record<string, unknown>;
