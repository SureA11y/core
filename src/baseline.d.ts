// Types for @surea11y/core/baseline (docs/BASELINE.md).

import type { ScanResult } from './index';

/** One known failure: what identifies it (ruleId, reasonCode, html) and where it was. */
export interface BaselineEntry {
  ruleId: string;
  reasonCode: string;
  selector: string;
  html: string;
}

/** A failure the baseline does not know. */
export interface NewOccurrence {
  ruleId: string;
  reasonCode: string;
  selector?: string;
  html?: string;
  summary?: string;
}

export interface BaselineMatch {
  /** Every failing occurrence in the result. */
  totalFail: number;
  /** Failing occurrences the baseline knows. */
  knownCount: number;
  /** Failing occurrences it does not: the ones a gate fails on. */
  newCount: number;
  newOccurrences: NewOccurrence[];
  /** Baseline entries no failure matched any more. */
  staleCount: number;
}

/** The result's failing occurrences, as entries to save. Throws a TypeError for anything but one scan result. */
export function buildBaselineEntries(result: ScanResult): BaselineEntry[];

/** Which of the result's failures the baseline knows. Throws a TypeError for anything but one scan result. */
export function matchBaseline(
  result: ScanResult,
  baselineEntries: BaselineEntry[] | null | undefined
): BaselineMatch;

/** The identity of a finding: ruleId, reasonCode and html. */
export function computeBaselineKey(ruleId: string, reasonCode: string, html: string): string;

/** An occurrence's reason code, or 'DEFAULT'. */
export function getReasonCode(occurrence: unknown): string;
