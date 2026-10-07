// Types for @surea11y/core/sarif (docs/SARIF.md).

import type { ScanResult } from './index';
import type { BaselineEntry } from './baseline';

export interface SarifOptions {
  /** The tool's version; defaults to the engine version the result carries. */
  toolVersion?: string;
  /** The tool's home page. */
  informationUri?: string;
  /** Failures recorded here are left out (docs/BASELINE.md). */
  baselineEntries?: BaselineEntry[];
  /** runs[0].automationDetails.id, for one analysis per viewport width or page. */
  category?: string;
}

/** A SARIF 2.1.0 log, as JSON text. Throws a TypeError for anything but one scan result. */
export function renderSarifReport(result: ScanResult, options?: SarifOptions): string;
