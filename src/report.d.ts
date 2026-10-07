// Types for @surea11y/core/report (docs/REPORT.md).

import type { ScanResult, CrossFrameResult } from './index';

export interface HtmlReportOptions {
  /** The page's title; a localized default otherwise. */
  title?: string;
}

/** A self-contained HTML page, as text. A cross-frame result covers every frame. Throws a TypeError for anything else. */
export function renderHtmlReport(
  result: ScanResult | CrossFrameResult,
  options?: HtmlReportOptions
): string;
