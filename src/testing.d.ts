// Types for @surea11y/core/testing (src/testing.js). Needs jsdom installed.

import type {
  EngineOptions,
  ScanResult,
  CheckResult,
  RunOnly,
  LegacyTagRunOnly,
  StringList
} from './index';

export interface ScanOptions {
  url?: string;
  contextSelector?: string | string[] | null;
  engineOptions?: EngineOptions;
  runOnly?: RunOnly | LegacyTagRunOnly | StringList | null;
  /** Also run runDomRulesInPage and assert both entry points agree (default true). */
  entryPointParity?: boolean;
  excludeSelectors?: string[];
  includeShadowDom?: boolean;
  rules?: Record<string, unknown>;
}

/** Scans an HTML string in jsdom. A scan with packs runs through runDomRulesInPage. */
export function runa11yCoreOnHtml(html: string, options?: ScanOptions): ScanResult;

/** A JSDOM for the page, set as the global window and document, to change before a scan. */
export function createDom(html: string, options?: { url?: string; contentType?: string }): any;

/** Scans a JSDOM made by createDom(). */
export function runa11yCoreOnDom(dom: any, options?: ScanOptions): ScanResult;

/** Asserts a rule's outcome and number of occurrences; returns the rule's result. */
export function assertRule(
  result: ScanResult,
  ruleId: string,
  expectedOutcome: 'pass' | 'fail' | 'cantTell' | 'notApplicable',
  options?: { minOccurrences?: number; maxOccurrences?: number | null }
): CheckResult;

/** Asserts that the in-page and the Node entry points gave the same outcomes. */
export function assertEntryPointParity(inPageResult: ScanResult, nodeResult: ScanResult): void;
