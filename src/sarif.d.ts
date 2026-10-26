// Types for @surea11y/core/sarif (docs/SARIF.md).

import type { ScanResult, CrossFrameResult, BindingFramesResult } from './index';
import type { BaselineEntry, BaselineFile } from './baseline';

export interface SarifOptions {
  /** The tool's version; defaults to the engine version the result carries. */
  toolVersion?: string;
  /** The tool's home page. */
  informationUri?: string;
  /** Failures recorded here are left out, and under leanFailAs a finding that leans fail recorded here stays a warning (docs/BASELINE.md). */
  baselineEntries?: BaselineEntry[] | BaselineFile;
  /** runs[0].automationDetails.id, for one analysis per viewport width or page. */
  category?: string;
  /** 'error' reports an undecided finding whose lean points to fail at "error". Default 'warning'. */
  leanFailAs?: 'warning' | 'error';
  /** With leanFailAs: 'error', raise only the leans of rules mapped to a WCAG criterion, not a best-practice rule's. Default false. */
  leanFailWcagOnly?: boolean;
  /**
   * The packs the scan ran (engineOptions.packs): in Node, a pack rule's
   * undecided findings carry the steps of its meta.review.
   */
  packs?: readonly unknown[] | null;
}

/** A SARIF 2.1.0 log, as JSON text. A cross-frame result covers every frame. Throws a TypeError for anything else. */
export function renderSarifReport(
  result: ScanResult | CrossFrameResult | BindingFramesResult,
  options?: SarifOptions
): string;
