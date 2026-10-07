// Types for @surea11y/core/wcag (docs/WCAG_CONFORMANCE.md).

export type WcagVersion = '2.0' | '2.1' | '2.2';
export type WcagLevel = 'A' | 'AA' | 'AAA';

/** One WCAG 2 success criterion across versions. */
export interface WcagCriterionEntry {
  sc: string;
  /** Its rule tag, as 'wcag111'. */
  tag: string;
  /** The id W3C gives it in WCAG 2.2, as 'non-text-content': its anchor and its Understanding page's name. */
  id: string;
  introduced: WcagVersion;
  /** Its level in each version that has it. */
  levels: Partial<Record<WcagVersion, WcagLevel>>;
  /** The version that removed it, or null. */
  removed: WcagVersion | null;
}

/** A criterion as one version publishes it. */
export interface WcagCriterion {
  sc: string;
  title: string;
  level: WcagLevel;
  introduced: WcagVersion;
}

export const WCAG_VERSIONS: readonly WcagVersion[];
export const WCAG_CRITERIA: readonly WcagCriterionEntry[];

/** The criteria in force in a version, in numeric order; `levels` keeps only those. Throws for an unknown version or level. */
export function wcagCriteria(
  version: WcagVersion,
  options?: { levels?: WcagLevel | WcagLevel[] }
): readonly WcagCriterion[];

/** One criterion as a version publishes it, or null. */
export function wcagCriterion(sc: string, version: WcagVersion): WcagCriterion | null;

/** The rule tags that select a version's criteria at the given levels (A and AA by default). */
export function wcagTags(version: WcagVersion, levels?: WcagLevel | WcagLevel[]): string[];
