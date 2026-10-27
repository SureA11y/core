# API, packs, console helpers, reporters: findings (prefix AP)

Target `c528af08`, Chromium 153, jsdom. Scripts are in this folder: `h.mjs` is a Chromium + http harness that loads the bundle with a `<script src>` tag; `axcmp.mjs` compares `inspect()` rows with Chromium's AX tree. Every repro was run at least twice with the same result.

## AP-1: WCAG rollups for 1.3.5, 3.3.2 and 2.5.8 say `notApplicable` on pages that have the fields or targets they cover

Repro (`p22-complete-applicability.js`; also in Chromium, with and without the listener hook):
- A form with `<label for=e>Your email</label><input type=email id=e name=email>` and a "Full name" field, no `autocomplete` → `wcag-1.3.5 = notApplicable`.
- `<div role=textbox contenteditable tabindex=0>` and `<div role=combobox tabindex=0>` with no label → `wcag-3.3.2 = notApplicable`, though the engine's own `textbox-name-present` and `combobox-name-present` fail those two divs.
- A 12px `<span onclick>` → `wcag-2.5.8 = notApplicable`, even when the listener hook recorded the handler.

- **In plain words:** the per-criterion summary says "doesn't apply to this page" for criteria that clearly apply, so a conformance report built on it overstates coverage.
- **Should say:** `cantTell` (`composite.rollup.cantTell.partialCoverage`) for each.
- **Spec:** 1.3.5 "The purpose of each input field collecting information about the user can be programmatically determined when…"; 3.3.2 "Labels or instructions are provided when content requires user input."; glossary *target*: "region of the display that will accept a pointer action".
- **Own docs:** `docs/WCAG_CONFORMANCE.md` allows `notApplicable` "only when its rules find every case it applies to … form fields for 1.3.5 and 3.3.2 … pointer targets for 2.5.8". But `autocomplete-valid` applies only to controls with an `autocomplete` attribute, the 3.3.2 rules don't see ARIA-role fields, and `target-size-minimum` ignores elements with click handlers.
- **Cause:** `src/coverage/complete-applicability.js:25` (1.3.5), `:31` (2.5.8), `:32` (3.3.2).
- **Verdict:** Bug. **Severity:** Medium.

## AP-2: `inspect('names')` shows `<input type=button|submit|reset>` as "(no name)"

- **Repro:** `p05-inspect-vs-ax.mjs`, `p05b-omitted.mjs`. `button-name-present` passes all three; Chromium names them "Value btn", "Submit", "Reset".
- **Own docs / CHANGELOG:** "the names are the ones the rules judge".
- **Spec:** HTML-AAM input button naming (the `value`, else the default label).
- **Cause:** `src/core/console-helpers.js:244-253`: `nameOf()` sends role `button` to `getNameFromContentInfo`, which never reads an input's `value` or default label; `button-name-present.js:252-254` adds that step and `inspect` doesn't.
- **Verdict:** Bug. **Severity:** Medium.

## AP-3: `inspect('focus-order')` doesn't follow the order Tab takes

- Every radio in a group is listed; Tab stops only on the checked one (or the first).
- A link inside `aria-hidden="true"` is left out, though Tab reaches it and `aria-hidden-focus` fails it in the same scan.
- Everything in shadow roots is numbered after the whole light DOM (only this part is covered by the doc's "press Tab to confirm" caveat).
- Recorded in Chromium (`p09-focus-order.mjs`): inspect gives `A, C, r1, r2, r3, …, B`; Tab gives `A, B, C, r2, …, ah, …`.
- **Cause:** `console-helpers.js:303` (the accessibility-tree filter applied to focus order), `:305-307` (no radio-group handling), `:311`/`:326` (document order with shadow content last).
- **Verdict:** Bug. **Severity:** Medium (radio groups), the rest Low.

## AP-4: `a11ycore.run()` silently runs every rule when the selection is put at the top level, or the options are a list or a string

- `run({ wcag: {…} })`, `run({ bestPractices: true })`, `run({ includeRuleIds: […] })`, `run(['img-alt-present'])`, `run('img-alt-present')` all run all 144 rules with no warning. `{ wcag }` at the top level was the documented form until `c528af08`.
- **Own docs:** "a typo can't quietly run every rule"; an `engineOptions` that isn't an object is promised a warning, which `Object.assign` hides. The types accept it too: `RunOptions` extends `EngineOptions`, which takes any key.
- **Cause:** `console-helpers.js:501-510`. Repro: `p06b-run-nonobject.mjs`.
- **Verdict:** Inconsistency. **Severity:** Medium (unreleased API).

## AP-5: `highlight()` / `inspect()` draw nothing usable under a CSP that blocks inline styles

- With `style-src 'self'` or `default-src 'self'`, the overlay's `<style>` is blocked: boxes are static with no border, labels pile up at the top. `highlight()` still returns a count. Constructable style sheets (`adoptedStyleSheets`) are not blocked by CSP. The docs mention a CSP blocking only the scripts.
- **Cause:** `console-helpers.js:155-164`. Repro: `p03-csp-overlay.mjs`.
- **Verdict:** Bug. **Severity:** Low.

## AP-6: Overlay boxes are misplaced when `<html>` is transformed, zoomed, bordered or has a margin

- Offsets of 20 to 156px. **Cause:** `console-helpers.js:166-186` (host appended to `<html>`, placed by bounding rect plus scroll). Repro: `p08-overlay-geometry.mjs`.
- **Verdict:** Bug. **Severity:** Low.

## AP-7: 17 rules report findings with no `reasonCode`

- The text-alternative family (`img-alt-present`, `area-alt-*`, canvas, embed and object `-present`/`-quality`, `input-image-alt-*`, the svg rules, `video-poster-…`) plus `manual-review`.
- **Own docs:** PACKS.md "Match only fields a rule keeps stable: `reasonCode` on every rule". A `reasonCodes` row for these rules can never match, and `checkPack` and the scan accept such a row silently.
- Repro: `p11-reasoncode-coverage.js`, `p14-checkpack-vs-scan.js`.
- **Verdict:** Inconsistency. **Severity:** Low.

## AP-8: `checkPack()` and `definePack` approve rule-mapped standards that every scan then skips

- A version with no `wcagVersion` (which `pack.d.ts` doesn't require), or a `findings` entry naming a requirement the table lacks. The scan drops the pack with a warning and calls its profile "no such profile".
- **Cause:** `src/pack.js:382` doesn't run the standard's `validate` (`src/profile-kit.js:192`). Repro: `p14-checkpack-vs-scan.js`.
- **Verdict:** Inconsistency. **Severity:** Low.

## AP-9: `getChecksForRunOnly` / `getRulesForRunOnly` return `[]` for a selection that cancels itself

- The same id included and excluded, or `includeRuleIds: ['region']` with `tags: ['wcag2a']`. The scan warns, and throws `INVALID_RUN_ONLY` under `strictOptions`; the catalog functions do neither, against the documented "so the two agree".
- **Cause:** the check exists only in `src/core/dom-runner.js:2799-2820`. Repro: `p21b-selection-errors.js`.
- **Verdict:** Inconsistency. **Severity:** Low.

## AP-10: `openReport()` can't be retried after one failed load

- When a script loads but defines no report, or `s.src` throws (Trusted Types, surfacing a raw `TypeError`), the rejected promise stays cached for the page's life.
- **Cause:** `console-helpers.js:454-476`. Repro: `p23-openreport-retry.mjs`, `p03b-trusted-types.mjs`.
- **Verdict:** Bug. **Severity:** Low.

## Leads

- **Unknown profile or opt-in tag under `strictOptions`:** no throw for an unknown `profile` (a typo of `wcag22-aa`) or unknown `optInRules`; the scan runs every rule, and the catalog functions don't warn as the scan does. Profiles are an open set: needs a decision.
- **`focus-not-removed-by-script` maps 2.1.1 and 2.4.7 only;** F55 also names 3.2.1.
- **Scrollable regions** are left out of `inspect('focus-order')`, though Chromium makes them keyboard-focusable.
- **`logoText: 'exempt'`:** a class word like `branding` up to six ancestors up counts as a logo, so WordPress's `.site-branding` would exempt the site's tagline.
- **The overlay can widen the page:** labels pushed `scrollWidth` from 320 to 402 at 320px. `run()` clears it first, but it could mislead a manual reflow check.
- **Docs and types nits:** `InspectRow.level` says "1 to 6", `aria-level=9` gives 9; a stale comment in `run()` calls `engineOptions.rules` per-rule settings; `table()` / `inspect()` rows drop the shadow host selectors.
- **`when` paths read inherited properties** (`findingMatches`), so `'constructor.name'` would match. No effect shown.

## What held up

- **`run()` and `runOnly`:** 37 forms, valid and invalid, gave exactly what `runa11yCoreInPage` gives directly, error messages included (`p06`).
- **Bundle shape:** runtime keys match `surea11y.browser.d.ts` one for one; `version` matches `package.json`.
- **Overlays never changed a later scan:** all five (`highlight()` and each `inspect()` kind), at 1280 and 320px; focus and scroll kept.
- **Hostile names** with HTML or script are drawn as text and never run. Shadow DOM, RTL and fixed elements are boxed correctly.
- **12 setups that patch page globals** work or are refused cleanly with the documented error.
- **`inspect('headings')` and `inspect('landmarks')`** agree with Chromium on 14 cases.
- **Selection property test:** 600 random selections and option sets, catalog vs scan, zero differences (`p21`).
- **Catalog:** tags and levels agree for all 144 rules, the ten new ones included; no best-practice rule is in a WCAG rollup.
- **Reporters**, on 55 results (the new rules' fixtures plus hostile strings, five locales, hooks on): SARIF validates against 2.1.0; JUnit well-formed with agreeing counts; EARL outcomes right; each result matches its own baseline; the HTML report doesn't scroll sideways at 320px, has `lang` right, no English left in other locales, cards in order, and the "not a claim of conformance" note exactly when nothing fails.
- **Messages:** 15,096 texts of the new rules in four other locales: no unfilled placeholders, no keys shown, no English left.
- **EN 301 549 deprecation:** one notice, `window` left clean, name variants work, no throw under `strictOptions`.
- **Hostile pack inputs:** prototype-named keys, cyclic or object `when` values, invalid `partial` / `applicability` values handled or refused.
