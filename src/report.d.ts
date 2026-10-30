// Types for @surea11y/core/report (docs/REPORT.md).

import type { ScanResult, CrossFrameResult, BindingFramesResult } from './index';

export interface HtmlReportOptions {
  /** The page's title; a localized default otherwise. */
  title?: string;
  /**
   * The packs the scan ran (engineOptions.packs): in Node, a pack rule's
   * undecided findings show the steps of its meta.review, in English or as
   * its pack's dictionaries translate them.
   */
  packs?: readonly unknown[] | null;
}

/** A self-contained HTML page, as text. A cross-frame result covers every frame. Throws a TypeError for anything else. */
export function renderHtmlReport(
  result: ScanResult | CrossFrameResult | BindingFramesResult,
  options?: HtmlReportOptions
): string;
