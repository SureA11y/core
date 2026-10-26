// Types for @surea11y/core/baseline (docs/BASELINE.md).

import type { ScanResult, CrossFrameResult, BindingFramesResult } from './index';

/** One known failure: what identifies it (ruleId, reasonCode, html) and where it was. */
export interface BaselineEntry {
  ruleId: string;
  reasonCode: string;
  selector: string;
  html: string;
  /**
   * 'fail' for an undecided finding that leans fail, written with buildBaselineEntries(result, { leanFail: true }):
   * it matches only such a finding, and JUnit and SARIF don't gate on it under leanFailAs. Absent for a failure.
   */
  lean?: 'fail';
  /** For a failure inside a frame of a cross-frame result: the frame's path (FramePosition.path). */
  frame?: string[];
}

/** A baseline file as saved (docs/BASELINE.md): its entries, with a version and a date. */
export interface BaselineFile {
  version?: number;
  generatedAt?: string;
  entries: BaselineEntry[];
}

/** A failure the baseline does not know. */
export interface NewOccurrence {
  ruleId: string;
  reasonCode: string;
  selector?: string;
  html?: string;
  summary?: string;
  /** For a failure inside a frame of a cross-frame result: the frame's path. */
  frame?: string[];
}

/** How the findings that lean fail compare with the baseline's entries marked lean: 'fail'. */
export interface BaselineLeanMatch {
  /** Every undecided finding that leans fail and gates under leanFailAs (leaningFailures). */
  total: number;
  knownCount: number;
  newCount: number;
  newOccurrences: NewOccurrence[];
  /** Entries marked lean: 'fail' that no such finding matched. */
  staleCount: number;
}

export interface BaselineMatch {
  /** Every failing occurrence in the result. */
  totalFail: number;
  /** Failing occurrences the baseline knows. */
  knownCount: number;
  /** Failing occurrences it does not: the ones a gate fails on. */
  newCount: number;
  newOccurrences: NewOccurrence[];
  /** Baseline entries no failure matched any more; entries marked lean: 'fail' are not counted. */
  staleCount: number;
  /** With { leanFail: true }: the findings that lean fail, against the entries marked lean: 'fail'. */
  leanFail?: BaselineLeanMatch;
}

/**
 * The result's failing occurrences, as entries to save. With { leanFail: true }, also each undecided finding that leans fail
 * and gates under leanFailAs (leaningFailures), as an entry marked lean: 'fail', after the failures.
 * A cross-frame result covers every frame. Throws a TypeError for anything else.
 */
export function buildBaselineEntries(
  result: ScanResult | CrossFrameResult | BindingFramesResult,
  options?: { leanFail?: boolean }
): BaselineEntry[];

/**
 * Which of the result's failures the baseline knows. A cross-frame result covers every frame. Throws a TypeError for anything else.
 * An entry written under a reason code that a release has since moved its finding to also matches the finding under the new code,
 * with the same rule, markup and frame (docs/BASELINE.md, "Upgrading"). Entries marked lean: 'fail' are compared, in `leanFail`,
 * only with { leanFail: true }.
 */
export function matchBaseline(
  result: ScanResult | CrossFrameResult | BindingFramesResult,
  baselineEntries: BaselineEntry[] | BaselineFile | null | undefined,
  options?: { leanFail?: boolean }
): BaselineMatch;

/**
 * The entries with each one written under a reason code that a release has
 * since moved its finding to given the new code (docs/BASELINE.md,
 * "Upgrading"), so the baseline matches without the moves table. With a
 * result, an entry takes the code of the finding it matches there; without
 * one, only an entry whose finding moved to a single code, from a code the
 * rule no longer gives, is rewritten. Every other entry is kept as it is.
 * The entries given are not changed. A result other than a scan result or a
 * cross-frame result throws a TypeError.
 */
export function migrateBaselineEntries(
  baselineEntries: BaselineEntry[] | BaselineFile | null | undefined,
  result?: ScanResult | CrossFrameResult | BindingFramesResult
): BaselineEntry[];

/** The identity of a finding: ruleId, reasonCode and html, and the frame's path for a failure inside a frame. */
export function computeBaselineKey(
  ruleId: string,
  reasonCode: string,
  html: string,
  framePath?: string[]
): string;

/** An occurrence's reason code, or 'DEFAULT'. */
export function getReasonCode(occurrence: unknown): string;
