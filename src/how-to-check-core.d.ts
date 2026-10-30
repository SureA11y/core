// Types for @surea11y/core/how-to-check (docs/OUTPUT_SCHEMA.md#how-to-check,
// docs/BINDING_AUTHORS_GUIDE.md).

import type {
  BindingFramesResult,
  CrossFrameResult,
  HowToCheck,
  HowToCheckOptions,
  ScanResult
} from './index';

/** One review dictionary, as @surea11y/core/review/<locale> holds it: key to text. */
export type ReviewDictionary = Readonly<Record<string, string>>;

/**
 * The review dictionaries a call may read: an object keyed by locale
 * ({ en, fr }), or a function from a locale ('fr', 'fr-ca', lower case) to its
 * dictionary. English is the fallback for every key a locale lacks.
 */
export type ReviewDictionaries =
  | Readonly<Record<string, ReviewDictionary | null | undefined>>
  | ((locale: string) => ReviewDictionary | null | undefined);

/**
 * A copy of a scan result, a cross-frame result or a binding's frames result
 * whose undecided findings carry howToCheck, in the scan's locale, from the
 * dictionaries given. Needs no file system: for a binding whose code runs in
 * a browser. A variant's finding (variantOf) without steps of its own gets
 * its base rule's; with options.packs, a pack rule's gets its meta.review's,
 * in English or as its pack's dictionaries translate them. In Node, addHowToCheck from @surea11y/core does the same with
 * every dictionary core ships.
 */
export function applyHowToCheck<T extends ScanResult | CrossFrameResult | BindingFramesResult>(
  result: T,
  dictionaries: ReviewDictionaries,
  options?: HowToCheckOptions
): T;

/**
 * The steps for one finding, by its rule's prefix (its i18n.titleKey without
 * `_title`) and reason code, in the first of `locales` that has them (English
 * last), or null when the dictionaries have none.
 */
export function howToCheckFrom(
  dictionaries: ReviewDictionaries,
  prefix: string,
  reasonCode: string,
  locales?: string | readonly string[] | null,
  options?: HowToCheckOptions
): HowToCheck | null;

/**
 * The same as @surea11y/core's: an occurrence's outcome, where it goes in a
 * review, and the reason codes each opt-in hook decides or changes.
 */
export { occurrenceOutcome, reviewGroupOf, ReviewGroup, HOOK_REASON_CODES, HookReasonCode, HookEffect } from './index';
