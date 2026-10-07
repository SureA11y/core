// Types for @surea11y/core/junit (docs/JUNIT.md).

import type { ScanResult } from './index';
import type { BaselineEntry } from './baseline';

export interface JunitOptions {
  /** 'failure' reports a cantTell rule as a failure; skipped by default. */
  cantTellAs?: 'skipped' | 'failure';
  /** Include notApplicable rules as skipped tests. */
  includeNotApplicable?: boolean;
  /** Failures recorded here are skipped as known (docs/BASELINE.md). */
  baselineEntries?: BaselineEntry[];
  /** The root <testsuites> name; 'surea11y' by default. */
  name?: string;
}

/** JUnit XML, as text. Throws a TypeError for anything but one scan result. */
export function renderJunitReport(result: ScanResult, options?: JunitOptions): string;
