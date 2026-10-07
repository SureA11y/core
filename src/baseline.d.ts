// Types for @surea11y/core/baseline (docs/BASELINE.md).

import type { ScanResult, CrossFrameResult } from './index';

/** One known failure: what identifies it (ruleId, reasonCode, html) and where it was. */
export interface BaselineEntry {
  ruleId: string;
  reasonCode: string;
  selector: string;
  html: string;
  /** For a failure inside a frame of a cross-frame result: the frame's path (FramePosition.path). */
  frame?: string[];
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

/** The result's failing occurrences, as entries to save. A cross-frame result covers every frame. Throws a TypeError for anything else. */
export function buildBaselineEntries(result: ScanResult | CrossFrameResult): BaselineEntry[];

/** Which of the result's failures the baseline knows. A cross-frame result covers every frame. Throws a TypeError for anything else. */
export function matchBaseline(
  result: ScanResult | CrossFrameResult,
  baselineEntries: BaselineEntry[] | null | undefined
): BaselineMatch;

/** The identity of a finding: ruleId, reasonCode and html, and the frame's path for a failure inside a frame. */
export function computeBaselineKey(
  ruleId: string,
  reasonCode: string,
  html: string,
  framePath?: string[]
): string;

/** An occurrence's reason code, or 'DEFAULT'. */
export function getReasonCode(occurrence: unknown): string;
