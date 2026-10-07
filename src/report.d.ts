// Types for @surea11y/core/report (docs/REPORT.md).

import type { ScanResult } from './index';

export interface HtmlReportOptions {
  /** The page's title; a localized default otherwise. */
  title?: string;
}

/** A self-contained HTML page, as text. Throws a TypeError for anything but one scan result. */
export function renderHtmlReport(result: ScanResult, options?: HtmlReportOptions): string;
