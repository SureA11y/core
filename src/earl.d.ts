// Types for @surea11y/core/earl (docs/EARL.md).

import type { ScanResult, CrossFrameResult, Outcome } from './index';

export interface EarlOptions {
  /** { name, version }; null omits assertedBy. The version defaults to the engine version the results carry. */
  assertor?: { name?: string; version?: string } | null;
  /** An EARL test mode, such as 'earl:automatic'. */
  mode?: string;
}

export type EarlOutcome = 'earl:passed' | 'earl:failed' | 'earl:cantTell' | 'earl:inapplicable';

export interface EarlAssertion {
  '@type': 'Assertion';
  test: { title: string; isPartOf?: unknown[] };
  result: { outcome: EarlOutcome };
  assertedBy?: {
    '@type': 'Assertor';
    name: string;
    release?: { '@type': 'Version'; revision: string };
  };
  mode?: string;
}

export interface EarlSubject {
  '@type': 'TestSubject';
  source: string;
  assertions: EarlAssertion[];
}

export interface EarlReport {
  '@context': Record<string, unknown>;
  '@graph': EarlSubject[];
}

/** A JSON-LD EARL document for one result, several, or a cross-frame result. */
export function renderEarlReport(
  results: ScanResult | CrossFrameResult | Array<ScanResult | CrossFrameResult>,
  options?: EarlOptions
): EarlReport;

export const EARL_CONTEXT: Record<string, unknown>;
export const OUTCOME_TO_EARL: Readonly<Record<Outcome, EarlOutcome>>;
/** A WCAG criterion's number without its dots, as '1.1.1' -> '111'. */
export function scSlug(sc: string): string;
