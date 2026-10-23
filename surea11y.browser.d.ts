// Types for @surea11y/core/browser: the standalone browser bundle, as a
// bundler or require() loads it (a <script> gets the same object as
// window.a11ycore).

import type {
  runa11yCoreInPage as RunInPage,
  waitForPageReady as WaitForPageReady,
  preloadStyleSheets as PreloadStyleSheets,
  getMargins as GetMargins,
  getAnnouncements as GetAnnouncements
} from './src/index';

declare namespace a11ycore {
  const ENGINE_TAG: string;
  const SCHEMA_VERSION: string;
  /** Adds a locale's messages, as a surea11y.i18n.<locale>.js file does. */
  function registerMessages(locale: string, messages: Record<string, string>): void;
  const waitForPageReady: typeof WaitForPageReady;
  const getMargins: typeof GetMargins;
  /**
   * What the page's live regions were given while shown and reachable, by
   * the live-region hook (liveRegionHookScript); null without one. `win`
   * defaults to this window.
   */
  const getAnnouncements: typeof GetAnnouncements;
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
    /**
     * The selection, as the scan's runOnly takes it: rule ids, or
     * { wcag, bestPractices, tags, … }. Every rule when left out.
     */
    runOnly?: Parameters<typeof RunInPage>[3];
    /** The selection's own keys go under runOnly; run() refuses them here. */
    wcag?: never;
    bestPractices?: never;
    excludeTags?: never;
    includeRuleIds?: never;
    excludeRuleIds?: never;
    includeTestIds?: never;
    excludeTestIds?: never;
  };
  /**
   * A scan of the page, with the style sheets it can't read fetched first,
   * as runa11yCoreInPageAsync does. Clears any highlights before it scans.
   * Rejects options that aren't an object, or that put the selection
   * outside runOnly.
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
  function table(result: ReturnType<typeof RunInPage>, options?: { all?: boolean }): TableRow[];

  /**
   * Draws a box over each element a fail (red) or cantTell (amber, dashed)
   * occurrence names, in a layer of its own that leaves the page's elements
   * unchanged. Returns how many elements it marked.
   */
  function highlight(result: ReturnType<typeof RunInPage>): number;
  /** What inspect() lists and draws. */
  type InspectKind = 'headings' | 'landmarks' | 'names' | 'focus-order';
  /** One row of inspect(); which fields it has depends on the kind. */
  interface InspectRow {
    /** headings: the heading's level, 1 to 6 (aria-level wins). */
    level?: number;
    /** landmarks, names and focus-order: the role. */
    role?: string;
    /** The accessible name, '' for none. */
    name: string;
    /** focus-order: the position Tab reaches it in, from 1. */
    order?: number;
    /** focus-order: a positive tabindex, which puts it before the rest. */
    tabindex?: number;
    /** A selector for the element. */
    element: string;
  }
  /**
   * Lists, and draws over the page in the layer highlight() uses, what a
   * person reviewing the page checks by hand: the headings, the landmarks,
   * each control's name (one with no name in amber), or the order Tab
   * reaches the controls in, as the engine works them out. Logs the rows
   * with console.table and resolves to them; { draw: false } only lists.
   * Clears any highlights first. A review aid: it judges nothing.
   */
  function inspect(kind: InspectKind, options?: { draw?: boolean }): Promise<InspectRow[]>;
  /** Removes what highlight() and inspect() drew. */
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
