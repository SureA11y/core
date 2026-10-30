// Types for @surea11y/core/procedures (docs/PROCEDURES.md).

import type { Procedures, ProceduresOptions } from './index';

export type {
  Procedures,
  ProcedureFacet,
  ProcedureTool,
  ProcedureVariant,
  ProceduresOptions
} from './index';

/** One procedures dictionary, as @surea11y/core/procedures/<locale> holds it: key to text. */
export type ProceduresDictionary = Readonly<Record<string, string>>;

/**
 * The dictionaries a call may read: an object keyed by locale ({ en, fr }),
 * or a function from a locale ('fr', 'fr-ca', lower case) to its dictionary.
 * English is the fallback for every key a locale lacks.
 */
export type ProceduresDictionaries =
  | Readonly<Record<string, ProceduresDictionary | null | undefined>>
  | ((locale: string) => ProceduresDictionary | null | undefined);

/**
 * How a person assesses a WCAG 2.2 criterion ('1.4.13'), or the best
 * practices ('best-practice'), by hand, from the dictionaries given, or,
 * with options.packs, a requirement of a pack's standard, with the packs'
 * rules under the facets they claim; null for a requirement none of them
 * knows. Needs no file system: for code that
 * runs in a browser. In Node, proceduresFor from @surea11y/core does the
 * same with every dictionary core ships.
 */
export function proceduresFrom(
  dictionaries: ProceduresDictionaries,
  requirement: string,
  options?: ProceduresOptions
): Procedures | null;
