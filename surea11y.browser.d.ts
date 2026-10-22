// Types for @surea11y/core/browser: the standalone browser bundle, as a
// bundler or require() loads it (a <script> gets the same object as
// window.a11ycore).

import type {
  runa11yCoreInPage as RunInPage,
  waitForPageReady as WaitForPageReady,
  preloadStyleSheets as PreloadStyleSheets,
  getMargins as GetMargins
} from './src/index';

declare namespace a11ycore {
  const ENGINE_TAG: string;
  const SCHEMA_VERSION: string;
  /** Adds a locale's messages, as a surea11y.i18n.<locale>.js file does. */
  function registerMessages(locale: string, messages: Record<string, string>): void;
  const waitForPageReady: typeof WaitForPageReady;
  const getMargins: typeof GetMargins;
  const runa11yCoreInPage: typeof RunInPage;
  const preloadStyleSheets: typeof PreloadStyleSheets;
  /**
   * runa11yCoreInPage, after fetching the style sheets the page can't read
   * (preloadStyleSheets) and adding them to engineOptions.styleSheetTexts.
   */
  function runa11yCoreInPageAsync(
    ...args: Parameters<typeof RunInPage>
  ): Promise<ReturnType<typeof RunInPage>>;

  /** The engine's version, as published. */
  const version: string;

  /** run()'s options: the engine options, and two of its own. */
  type RunOptions = NonNullable<Parameters<typeof RunInPage>[2]> & {
    /** A selector: scan only that part of the page. */
    context?: string | null;
    /** The rule ids to run; all when left out. */
    runOnly?: string[] | null;
  };
  /**
   * A scan of the page, with the style sheets it can't read fetched first,
   * as runa11yCoreInPageAsync does. Clears any highlights before it scans.
   */
  function run(options?: RunOptions): Promise<ReturnType<typeof RunInPage>>;

  /** One row of table(): an occurrence, or with { all: true } a rule. */
  interface TableRow {
    outcome: string;
    severity: string;
    rule: string;
    element: string;
    summary: string;
  }
  /**
   * Prints the scan's fail and cantTell occurrences with console.table,
   * worst first, and returns the rows. { all: true } adds a row for each
   * rule that passed or did not apply.
   */
  function table(
    result: ReturnType<typeof RunInPage>,
    options?: { all?: boolean }
  ): TableRow[];

  /**
   * Draws a box over each element a fail (red) or cantTell (amber, dashed)
   * occurrence names, in a layer of its own that leaves the page's elements
   * unchanged. Returns how many elements it marked.
   */
  function highlight(result: ReturnType<typeof RunInPage>): number;
  /** Removes what highlight() drew. */
  function clearHighlights(): void;

  /**
   * Opens the scan's HTML report in a new tab, loading surea11y.report.js
   * from beside the bundle the first time (or from options.reportScript),
   * and resolves to the report's address.
   */
  function openReport(
    result: ReturnType<typeof RunInPage>,
    options?: { reportScript?: string; report?: { title?: string } }
  ): Promise<string>;
}

export = a11ycore;

// window.a11ycore is not declared here: a project that declares it itself
// would get conflicting declarations (TS2717). To type it, add to your own
// .d.ts file:
//
//   declare global {
//     interface Window { a11ycore: typeof import('@surea11y/core/browser'); }
//   }
