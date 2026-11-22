// Types for @surea11y/core/report (docs/REPORT.md).

import type {
  ScanResult,
  CompactScanResult,
  CrossFrameResult,
  BindingFramesResult
} from './index';

export interface HtmlReportOptions {
  /** The page's title; a localized default otherwise. */
  title?: string;
  /**
   * The packs the scan ran (engineOptions.packs): in Node, a pack rule's
   * undecided findings show the steps of its meta.review, in English or as
   * its pack's dictionaries translate them.
   */
  packs?: readonly unknown[] | null;
  /**
   * false leaves out "What's left for a person": the checks no rule decides
   * in full, for the standard scanned, with their steps (docs/REPORT.md). It
   * is shown by default, in Node; the browser report has none.
   */
  manualChecks?: boolean;
  /**
   * true makes an option of the wrong type throw a TypeError. Without it,
   * manualChecks given as 'true', 'false', '1', '0', 1 or 0 is read as that,
   * and a number title as text, with a warning (docs/REPORT.md).
   */
  strictOptions?: boolean;
}

/** A self-contained HTML page, as text. A cross-frame result covers every frame. Throws a TypeError for anything else. */
export function renderHtmlReport(
  result: ScanResult | CompactScanResult | CrossFrameResult | BindingFramesResult,
  options?: HtmlReportOptions
): string;
