// Types for @surea11y/core/junit (docs/JUNIT.md).

import type { ScanResult, CrossFrameResult } from './index';
import type { BaselineEntry, BaselineFile } from './baseline';

export interface JunitOptions {
  /** 'failure' reports a cantTell rule as a failure; skipped by default. Read in any case; another value throws a TypeError. */
  cantTellAs?: 'skipped' | 'failure';
  /** Include notApplicable rules as skipped tests. */
  includeNotApplicable?: boolean;
  /** Failures recorded here are skipped as known (docs/BASELINE.md). */
  baselineEntries?: BaselineEntry[] | BaselineFile;
  /** The root <testsuites> name; 'surea11y' by default. */
  name?: string;
}

/** JUnit XML, as text. A cross-frame result covers every frame. Throws a TypeError for anything else. */
export function renderJunitReport(
  result: ScanResult | CrossFrameResult,
  options?: JunitOptions
): string;
