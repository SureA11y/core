// Types for @surea11y/core/testing (src/testing.js). Needs jsdom installed.

import type {
  EngineOptions,
  StrictEngineOptions,
  ScanResult,
  ScanResultFor,
  CompactScanResult,
  CheckResult,
  CompactCheckResult,
  RunOnly,
  LegacyTagRunOnly,
  StringList
} from './index';

export interface ScanOptions<T = EngineOptions | StrictEngineOptions> {
  url?: string;
  /** How jsdom parses the markup: 'text/html' (default), 'image/svg+xml' or 'application/xhtml+xml', say. */
  contentType?: string;
  contextSelector?: string | string[] | null;
  engineOptions?: T;
  runOnly?: RunOnly | LegacyTagRunOnly | StringList | null;
  /** Also run runDomRulesInPage and assert both entry points agree (default true). */
  entryPointParity?: boolean;
  excludeSelectors?: string[];
  includeShadowDom?: boolean;
  rules?: Record<string, unknown>;
}

/** Scans an HTML string in jsdom. A scan with packs runs through runDomRulesInPage. */
export function runa11yCoreOnHtml<T extends EngineOptions | StrictEngineOptions = EngineOptions>(
  html: string,
  options?: ScanOptions<T>
): ScanResultFor<T>;

/** A JSDOM for the page, set as the global window and document, to change before a scan. */
export function createDom(html: string, options?: { url?: string; contentType?: string }): any;

/** Scans a JSDOM made by createDom(). */
export function runa11yCoreOnDom<T extends EngineOptions | StrictEngineOptions = EngineOptions>(
  dom: any,
  options?: ScanOptions<T>
): ScanResultFor<T>;

/** Asserts a rule's outcome and number of occurrences; returns the rule's result. */
export function assertRule(
  result: ScanResult,
  ruleId: string,
  expectedOutcome: 'pass' | 'fail' | 'cantTell' | 'notApplicable',
  options?: { minOccurrences?: number; maxOccurrences?: number | null }
): CheckResult;
export function assertRule(
  result: CompactScanResult,
  ruleId: string,
  expectedOutcome: 'pass' | 'fail' | 'cantTell' | 'notApplicable',
  options?: { minOccurrences?: number; maxOccurrences?: number | null }
): CheckResult | CompactCheckResult;

/** Asserts that the in-page and the Node entry points gave the same outcomes. */
export function assertEntryPointParity(
  inPageResult: ScanResult | CompactScanResult,
  nodeResult: ScanResult | CompactScanResult
): void;
