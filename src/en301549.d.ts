// Types for @surea11y/core/en301549 (docs/WCAG_CONFORMANCE.md#en-301-549).

export interface En301549Version {
  version: string;
  published: string;
  /** The WCAG version its chapter 9 follows. */
  wcagVersion: string;
}

export interface En301549Clause {
  clause: string;
  title: string;
}

export const EN301549_VERSIONS: readonly En301549Version[];
/** Per version, the clause for each WCAG criterion it requires. */
export const EN301549_CLAUSES: Readonly<Record<string, Readonly<Record<string, En301549Clause>>>>;
/** The clause for a WCAG criterion in each version that has one, oldest first. */
export function en301549ClausesForSc(
  sc: string
): Array<{ version: string; clause: string; title: string }>;
