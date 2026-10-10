// Types for @surea11y/core/sarif (docs/SARIF.md).

import type { ScanResult, CrossFrameResult } from './index';
import type { BaselineEntry, BaselineFile } from './baseline';

export interface SarifOptions {
  /** The tool's version; defaults to the engine version the result carries. */
  toolVersion?: string;
  /** The tool's home page. */
  informationUri?: string;
  /** Failures recorded here are left out (docs/BASELINE.md). */
  baselineEntries?: BaselineEntry[] | BaselineFile;
  /** runs[0].automationDetails.id, for one analysis per viewport width or page. */
  category?: string;
}

/** A SARIF 2.1.0 log, as JSON text. A cross-frame result covers every frame. Throws a TypeError for anything else. */
export function renderSarifReport(
  result: ScanResult | CrossFrameResult,
  options?: SarifOptions
): string;
