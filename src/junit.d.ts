// Types for @surea11y/core/junit (docs/JUNIT.md).

import type { ScanResult, CrossFrameResult, BindingFramesResult } from './index';
import type { BaselineEntry, BaselineFile } from './baseline';

export interface JunitOptions {
  /** 'failure' reports a cantTell rule as a failure; skipped by default. Read in any case; another value throws a TypeError. */
  cantTellAs?: 'skipped' | 'failure';
  /** 'failure' gates on undecided findings whose lean points to fail. Default 'skipped'. */
  leanFailAs?: 'skipped' | 'failure';
  /** With leanFailAs: 'failure', gate only on the leans of rules mapped to a WCAG criterion, not a best-practice rule's. Default false. */
  leanFailWcagOnly?: boolean;
  /** Include notApplicable rules as skipped tests. */
  includeNotApplicable?: boolean;
  /** Failures recorded here are skipped as known, and under leanFailAs so are findings that lean fail recorded here (docs/BASELINE.md). */
  baselineEntries?: BaselineEntry[] | BaselineFile;
  /**
   * The packs the scan ran (engineOptions.packs): with leanFailAs: 'failure',
   * in Node, a pack rule's likely failures give the steps of its meta.review.
   */
  packs?: readonly unknown[] | null;
  /** The root <testsuites> name; 'surea11y' by default. */
  name?: string;
}

/** JUnit XML, as text. A cross-frame result covers every frame. Throws a TypeError for anything else. */
export function renderJunitReport(
  result: ScanResult | CrossFrameResult | BindingFramesResult,
  options?: JunitOptions
): string;
