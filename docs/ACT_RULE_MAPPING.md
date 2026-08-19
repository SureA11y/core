# ACT rule mapping

Cross-reference between the [W3C ACT Rules](https://act-rules.github.io/rules/) (as published at act-rules.github.io) and this repo's rule catalog (`docs/RULE_CATALOG.md`). Built by matching rule names/descriptions and WCAG SC; not machine-generated, so treat close calls as a starting point for review rather than ground truth.

**Summary (117 active ACT rules, excludes 3 deprecated):**
- **57 confirmed direct or family matches** in our automatic/manual rules (`scripts/data/act-rule-map.json` is the machine-readable version of the table below)
- **~2** are covered structurally by our composite/rollup layer, not a named rule
- **~47 are gaps** — no corresponding rule in this repo, listed in [Gaps](#gaps-no-corresponding-rule) below

**Every matched rule has now been run through ACT's own official test-case corpus** (`scripts/act-testcase-check.js`, 713 test cases across the 51-rule matched set of the time). Started at 86 mismatches; real bugs were fixed, mapping errors corrected, and every remaining mismatch triaged into a deliberate scope difference, a jsdom/environment limit, or a genuine open design question (tracked in [`docs/DESIGN_CHALLENGES.md`](./DESIGN_CHALLENGES.md)). A second pass then re-ran the whole corpus from a local checkout (see "Second pass" below) and repeated the exercise on what it turned up. Current state: **866 examples across the 57-rule matched set, 45 mismatches, all explained** below or in that file — see "Progress" further down for the full per-rule breakdown.

Real rule bugs found and fixed this way, in rough chronological order:
- `button-name-present` wasn't crediting the UA-default label on `input[type=submit]`/`input[type=reset]` with no `value`, and wasn't honoring `role="none"`/`role="presentation"` conflict-resolution.
- `link-name-quality` was scoped to `a[href]` only; widened to `a[href], area[href], [role="link"]` to match ACT's "any semantic link" applicability (safe here — its logic is name-text-only, no destination resolution).
- `contrast-minimum`/`contrast-enhanced` (shared `isLargeText` helper): a hardcoded `18.6667px` bold-large-text threshold was a floating-point hair above the true value of `14pt` converted to px, so text sized exactly at the boundary via `pt` units (the common real-world case) silently fell through to the stricter normal-text ratio. Fixed by deriving the threshold from the same `parsePx()` conversion instead of a decimal literal.
- `contrast-minimum`/`contrast-enhanced` (shared `isInactiveUiComponent` helper): the WCAG 1.4.3/1.4.6 "inactive UI component" exception only walked the text's own ancestor chain for `:disabled`/`aria-disabled`, missing the case where the low-contrast text is a `<label>` (native association or `aria-labelledby`-referenced) for a *sibling* disabled widget rather than a descendant of one.
- `aria-required-parent`: a roleless ancestor carrying a global ARIA attribute (e.g. `aria-live`) is still included in the accessibility tree, so it should block the required-context-role search the same way a real role would — it was being treated as transparent instead.
- `dom-helpers.js`'s `inClosedDetailsContent()`: a closed `<details>` element was judging its own accessibility-tree eligibility against its own `open` state (`closest('details')` matches the node itself), hiding the `<details>`/`<summary>` toggle along with the content it's supposed to keep hiding.
- `img-alt-present`: `alt=" "` (whitespace-only) was treated the same as `alt=""` (the real decorative marker). Per HTML-AAM the img-to-presentation role flip only fires on the literal empty string, so a whitespace-only alt keeps the `img` role with an empty computed name — a real failure.
- `role-img-alt-present`: an inline SVG's own `<title>` child element (the standard SVG-AAM naming mechanism) wasn't recognized as a name source, separate from the HTML `title` attribute.
- `table-headers-attr-valid`: cells inside a `role="presentation"`/`"none"` table are out of scope entirely, and a referenced header can be any cell (`td` or `th`) of the same table, not only a `th`.
- `dom-helpers.js`'s offscreen heuristic: `em`/`rem` values (e.g. `top: -999em`) were compared against the `-5000` px threshold as a bare number, so they never registered as offscreen.
- `getAccessibleNameInfo` never consulted the `alt` attribute for `img`/`area`/`input[type=image]`, so e.g. an `<area>` named only by `alt` had no computed name anywhere outside the img-specific rules.
- `getContentNameInfo`: a `role="presentation"`/`"none"` image-like descendant was still contributing its `alt` text to an ancestor's content name, even though `alt` doesn't trigger presentational-roles conflict resolution.
- `identical-links-same-purpose`: fell back to raw `el.textContent` instead of the content-aware name helper, so a link named only by a descendant image's `alt` (no text nodes at all) was silently skipped. Also fixed SVG `<a>`'s `.href`, which is an `SVGAnimatedString` rather than a plain string, so the destination comparison was reading a useless stringified wrapper for every SVG link.
- `meta-refresh-timing-absent` / `meta-refresh-no-exceptions`: only the first valid meta refresh in a document is ever acted on by a browser; both rules were evaluating every matching `<meta>` tag independently. `meta-refresh-no-exceptions`'s own header comment also claimed AAA drops the zero-delay exception — it doesn't; an immediate redirect isn't a timed interruption at any level.
- `table-th-has-data-cells`: extended the existing "`<th>` with zero `<td>` anywhere" check to its ARIA `role="grid"`/`"treegrid"` equivalent.
- `empty-heading`: a heading whose only content is a `role="presentation"` image no longer gets that image's `alt` text as its name; a native heading tag marked `role="none"`/`"presentation"` but carrying a global ARIA attribute (even an empty one) is still evaluated as a heading, per conflict resolution.
- `aria-required-attr`: an explicit role identical to an element's own native role is now exempt (e.g. `<input type="checkbox" role="checkbox">` needs no `aria-checked`); `role="combobox"` now requires `aria-controls` once `aria-expanded="true"`.
- `aria-allowed-attr` had no answer for an element HTML-AAM maps to no ARIA role at all: `<audio controls aria-orientation="horizontal">` (ACT `5c01ea`'s own failed example) was skipped, because an empty implicit-role lookup was indistinguishable from "a role this table does not model". A generated `ROLELESS_ELEMENTS` set makes the absence itself the answer. `<div>`/`<span>` also joined the context-free table as `generic`, so a role-specific attribute on a bare div is now reported rather than passed over.
- `getContainmentRole` handed several native tags an implicit role in every context, where HTML-AAM makes them conditional: `<li>` is a `listitem` only inside `<ul>`/`<ol>`/`<menu>`, `<option>` only inside `select`/`datalist`/`optgroup`, the table family only inside a real table. ACT `bc4a75` fails `<div role="list"><li>Item</li>…</div>` for exactly that reason and the engine passed it. The three rules built on that helper (`aria-required-children`, `aria-prohibited-children`, `aria-required-parent`) all inherit the fix.

Mapping-table corrections found this way (data-only, no rule-code change):
- `bc4a75` was mapped to `aria-required-children` alone, but this repo splits ACT's single question into two atomic decisions — "does a required child exist" and "is every owned child allowed", the second being `aria-prohibited-children`. Measuring one rule against a two-part expectation reported the missing half as an engine gap; it was a mapping gap. Now a family match.
- `qt1vmo` and `23a2a8` were missing existing sibling rules from their `ourRuleIds` family (`canvas-text-alternative-quality`/`svg-text-alternative-quality`, and `role-img-text-alternative-present`, respectively) — the code to catch these cases already existed, just wasn't wired into the mapping.
- `bf051a` was mapped to `valid-lang` (which deliberately skips the `<html>` element by design) instead of `html-lang-attr-present`, which actually validates it.
- `b40fd1` was mapped to `region` (an unrelated best-practice check) instead of `bypass-blocks-present`, which already implements this exact WCAG 2.4.1 technique alongside its `cf77f2`/`ye5d6e`/`047fe0` siblings.
- `oj04fd` was mapped to `css-hidden-focus` on a surface keyword match ("focus," "visible") — the two check unrelated things (element visibility while focused vs. whether a focus indicator is suppressed by CSS). Removed from the matched table; see the Gaps section, where it's also flagged as a plausible new-rule candidate.
- `cc0f0a` and `c4a8a4` were mapped to `form-control-programmatic-label-quality` and `page-title-patterns`, both of which only catch weak-primary-mechanism/generic-pattern cases, never real label-text-vs-field or title-vs-content relevance — genuinely un-covered by either rule. Moved both ACT ids to Gaps and both of our rules to [Extra coverage](#extra-coverage-beyond-act) (they remain valid, independent checks with no ACT counterpart of their own).

Gaps closed since:
- `307n5z` "Element with presentational children has no focusable content" is now implemented by the new `presentational-children-focusable-absent` rule. The gap entry it replaces described the wrong mechanism — it read the rule as being about an explicit `role="presentation"`/`"none"` attribute, which is the exact misreading ACT's own Background section warns against. The rule is about the *implicit* presentational-children trait a role carries (`button`, `checkbox`, `img`, `option`, `tab`, ...): those roles drop their whole subtree from the accessibility tree, so a descendant that still takes a tab stop receives focus with no role and no name. Clean against all 11 of ACT's examples.
- `46ca7f` "Element marked as decorative is not exposed" needed no new rule at all: `presentation-role-conflict` already implements it, end to end, and was simply never mapped — the gap entry was a mapping miss, same class as the `qt1vmo`/`23a2a8` misses above. It runs clean against all 10 of ACT's examples, and the one scope difference the corpus exposed (an `<img alt="">` carrying an explicit role of its own is not "marked as decorative", since the explicit role wins over the presentation role empty alt would confer) is now fixed in the rule.
- `b49b2e` "Heading is descriptive" is now half-covered by the new `heading-quality` rule: a heading whose accessible name is a placeholder — a generic word ("Heading", "Untitled"), a numbered template slot ("Section 2"), a filename, or a URL — cannot describe anything, and that much is deterministic. Whether a well-formed heading is *about* the content after it is not, so the rule is `cantTell`-capped and `b49b2e` is mapped `partial`. Clean on all 6 passed and both inapplicable examples (no false positives); the 4 failed examples are all the topic-relevance shape.
- `oj04fd` "Element in sequential focus order has visible focus" is now partly covered by the new `css-focus-indicator-suppressed` rule: it reads the page's own stylesheets for a `:focus`/`:focus-visible` rule that removes the outline, and reports the tab stops it matches unless some other focus rule draws a replacement for them. ACT's expectation is a pixel comparison between the focused and unfocused states, which no static check performs — and its passed examples paint their indicator from an `onfocus` handler onto a sibling — so the rule is `cantTell`-capped and the mapping is `partial`.
- `cc0f0a` "Form field label is descriptive" is now partly covered by the new `form-control-label-quality` rule. Three shapes of a bad label are decidable from markup: a placeholder string, a label repeated on several fields with no *visible* heading, legend or row text telling them apart, and a label split between visible and hidden parts. The second and third are what ACT's own failed examples 4 and 5 test, and the rule catches both; the remaining four failures turn on the meaning of an ordinary word, so the mapping is `partial` and the rule is `cantTell`-capped.
- `3ea0c8` "Id attribute value is unique" is closed by the new `duplicate-id` rule — clean against all 10 of ACT's examples, including the per-tree scoping that keeps the same id inside two different shadow roots from counting as a duplicate. It is the first rule in the catalog whose Success Criterion no longer exists in the current WCAG version, so it carries `wcag22-removed` alongside its `wcag2a` origin tag; see `docs/ENGINE_OPTIONS.md` for how a 2.2 conformance run excludes it.

### Second pass: the corpus read from a local checkout

act-rules.github.io is unreachable from the environment this pass ran in, so the examples were read straight out of a local checkout of the `act-rules/act-rules.github.io` repository (`_rules/*.md`) instead of the generated per-case pages `scripts/act-testcase-check.js` fetches. Same corpus, different entry point: running the manifest's existing entries through it reproduces the published per-rule results (`97a4e1` clean, `6cfa84` clean, `d0f69e` 3 mismatches, ...), which is what makes the new results trustworthy.

It carries 821 examples against the 713 test-case pages the first pass fetched. The gap is not explained from here — the published pages can't be diffed against without network access — so everything it surfaced beyond the 49 already-triaged mismatches was read on its own merits rather than assumed to be a regression. What it found, in four groups:

Real rule bugs, fixed:
- `table-headers-attr-valid` only took a table out of scope for `role="presentation"`/`"none"`. Any explicit role replaces the native table semantics, so `<table role="heading">` has no table for a cell's `headers` attribute to describe either — the applicability now keeps only `table`/`grid`/`treegrid`, matching ACT a25f45.
- `aria-required-attr` never required `aria-valuenow` on a `separator`. A plain separator is a structural divider that needs no value, but a focusable one is a splitter the user can move, and WAI-ARIA requires the value then — the same conditional shape as `combobox`'s `aria-controls`, which the rule already handles.
- `iframe-name-present` demanded a name from an iframe the author had marked decorative with `role="none"`/`"presentation"`. ACT cae760 excludes those outright, and the contradiction between "decorative" and a restored role is `presentation-role-conflict`'s report, not this rule's.

Mapping fix (data-only): `e086e5`'s family was missing `binary-control-name-present` and `menuitem-name-present`, so ACT's `checkbox`/`radio`/`switch`/`menuitemcheckbox`/`menuitemradio` cases looked uncovered when the rules for them already existed — the same shape as the `qt1vmo`/`23a2a8` misses above.

Re-checked against the live rule page (not just the local checkout) and settled, all in `docs/DESIGN_CHALLENGES.md`'s Decided section:
- `aria-required-children`/`aria-prohibited-children` only evaluating containers with an explicit `role` isn't a gap — ACT `bc4a75`'s own Applicability text requires one, and its Inapplicable Example 2 is a bare `<ul><li>`.
- `aria-prohibited-children` was a real bug: it only treated `role="group"`/`role="rowgroup"` as transparent when the container's own required-owned set named `group`/`rowgroup`, so `role="list"` wrapping valid `listitem`s in a `role="group"` was wrongly flagged. Group/rowgroup are transparent unconditionally. `bc4a75` now runs clean.
- `label-in-name` had no exemption for "non-text content" characters — ACT `2ee8b8`'s own failed examples for us, `<button aria-label="close">X</button>` and a Material-Icons-font-remapped `search`->magnifying-glass button, are both text standing in for an icon rather than literal words. The live corpus's actual 13 examples don't exercise the separately-claimed `aria-hidden`/visually-hidden/inline-concatenation divergence at all (unsubstantiated against current ground truth, likely a local-checkout artifact same as the `bc4a75` case) — that narrower part stays open in `docs/DESIGN_CHALLENGES.md` on its own merits, not as an ACT mismatch. `2ee8b8` now runs clean.

Accepted divergence, documented in the table above: `8fc3b6` (an `<object>` rendering neither image, audio nor video is exempt from needing a name — what a `data` URL resolves to isn't knowable without fetching it). The `afw4f7`/`09o5cg` same-color note that used to sit here was a misreading, not a real limitation — see `docs/DESIGN_CHALLENGES.md`'s Decided section — and is fixed.

We also have automatic rules with **no ACT counterpart at all** (see [Extra coverage](#extra-coverage-beyond-act)) — mostly a finer-grained decomposition of ACT's single "form field has accessible name" rule into one rule per ARIA widget role.

### Progress: full validation results, by ACT rule

**Clean (0 mismatches):** `5f99a7`, `80f0bf`, `4c31df`, `73f2c2`, `97a4e1`, `cf77f2`, `b40fd1`, `46ca7f`, `6cfa84`, `307n5z`, `4e8ab6`, `a25f45`, `ffd0e9`, `b5c3f8`, `2779a5`, `5b7ae0`, `bf051a`, `qt1vmo`, `59796f`, `23a2a8`, `24afc2`, `9e45ec`, `c487ae`, `m6b1q3`, `bc659a`, `bisz58`, `b4f0c3`, `674b10`, `0ssw9k`, `3ea0c8`, `5c01ea`, `bc4a75`, `2ee8b8`, `e88epe`, `7d6734`, `de46e4` (36 of 57 matched rules).

**Remaining mismatches (45 total), all triaged:**

| ACT ID | Mismatches | Category |
|---|---|---|
| `ff89c9` | 1 | env/harness limit — jsdom doesn't execute inline `<script>`, so a runtime-created shadow root is invisible to the test fetcher (not the real engine, which runs after page scripts) |
| `6a7281` | 2 | deliberate scope — our idref-type validation extends beyond ACT's syntax-only check to also require the referenced id to exist (see `aria-valid-attr-value.js`'s own header comment); genuinely more useful, not a bug |
| `aaa1bf` | 1 | inherent limitation — clip duration isn't knowable from static markup; no browser decodes media at scan time |
| `ye5d6e`, `047fe0` | 1, 2 | deliberate leniency — whether repeated-boilerplate content wraps the skip target/heading is a cross-page judgment undecidable from one document; the rule's own header comment already reasons through this trade-off |
| `e086e5` | 2 | deliberate divergence, decided 2026-08-19 — see `docs/DESIGN_CHALLENGES.md`'s "Decided" section: `<label for>`/wrapping association stays honoured on non-natively-labelable ARIA widgets, because a screen reader that announces such a label makes "no accessible name" a false positive. Real AT behaviour wins over the spec reading here |
| `oj04fd` | 1 | env/harness limit — ACT's one failed example keeps its `outline: none` in a linked stylesheet, which the example runner does not fetch, so no focus rule is visible to parse at all. Inlining that same CSS reports the element (`tests/engine-checks/manual/css-focus-indicator-suppressed.test.js` pins it); a real page hands the engine its stylesheets through the CSSOM |
| `cc0f0a` | 4 | inherent limitation — `form-control-label-quality` catches the three deterministic shapes (a placeholder label, a label repeated with no visible heading/legend/row telling the fields apart, a label split between visible and hidden parts, which covers ACT's failed examples 4 and 5). The remaining four fail on the meaning of a well-formed word — `<label>Menu</label>` over a first-name field — which no markup-level check reaches |
| `b49b2e` | 4 | inherent limitation — `heading-quality` catches placeholder heading text (a generic word, a numbered template slot, a filename, a URL), which is the deterministic half of this rule; whether a well-formed heading actually describes the content after it is a reading-comprehension judgment, and all 4 of ACT's failed examples are exactly that shape ("Weather" over opening hours) |
| `cae760` | 1 | deliberate, broader-than-ACT scope — `iframe-name-present` doesn't exempt a `tabindex="-1"` iframe the way ACT's focus-reachability precondition does; arguably more useful for AT rotor/frame-list navigation, not just Tab order |
| `akn7bn` | 1 | env/harness limit — jsdom doesn't populate `iframe.contentDocument` from a `srcdoc` attribute; a real browser does |
| `78fd32` | 1 | deliberate, documented limitation — `avoid-inline-spacing`'s own header comment already states it can't detect "text that never soft-wraps" without real layout |
| `aizyf1` | 2 | deliberate, documented trade-off — `link-name-quality`'s own header comment states it matches an exact curated phrase list only, favoring precision over recall |
| `fd3a94`, `b20e66` | 1, 1 | deliberate, documented structural gap — `identical-links-same-purpose`'s `a[href]`-only destination resolution genuinely cannot cover a `role="link"` element whose target lives inside a JS string, not markup |
| `b33eff` | 3 | env/harness limit — jsdom's CSS parser drops `@media(orientation)` rules using `rad` units or `matrix3d()` that a real browser's CSSOM parses fine |
| `d0f69e` | 3 | deliberate, documented false-negative policy — `table-th-has-data-cells`'s own header comment explains it only catches the unambiguous "zero data cells anywhere" case, not real positional header-association (the new ARIA-grid coverage added during this pass is real but doesn't happen to close these 3 specific positional-mismatch cases) |
| `09o5cg`, `afw4f7` | 5, 6 | environment-dependent — gradient/image backgrounds, Shadow DOM without `includeShadowDom`, `text-shadow` as a contrast aid, symbol-only text, one pixel-matching edge case (see `docs/LIMITATIONS.md`) |
| `f51b46` | 1 | inherent limitation — `video-caption`'s own header comment states it can't verify a caption track's *content* accuracy, only that one is declared; genuinely a human-judgment task |
| `8fc3b6` | 1 | inherent limitation — ACT exempts an `<object>` that renders neither image, audio nor video (its fallback content is shown instead); what a given `data` URL resolves to isn't knowable without fetching it, so `object-text-alternative-present` asks for a name regardless |

## Matched rules

| ACT ID | ACT rule name | Our rule(s) | Match |
|---|---|---|---|
| `5f99a7` | ARIA attribute is defined in WAI-ARIA | `aria-valid-attr` | exact |
| `ff89c9` | ARIA required context role | `aria-required-parent` | exact |
| `bc4a75` | ARIA required owned elements | `aria-required-children`, `aria-prohibited-children` | family (we split by decision) |
| `6a7281` | ARIA state or property has valid value | `aria-valid-attr-value` | exact |
| `5c01ea` | ARIA state or property is permitted | `aria-allowed-attr` | exact |
| `80f0bf` | Audio/video avoids autoplaying audio | `no-autoplay-audio` (manual) | family |
| `4c31df` | Autoplaying audio/video has a control mechanism | `no-autoplay-audio` (manual) | family |
| `aaa1bf` | Autoplaying audio/video has no audio > 3s | `no-autoplay-audio` (manual) | family |
| `73f2c2` | Autocomplete attribute has valid value | `autocomplete-valid` | exact |
| `97a4e1` | Button has non-empty accessible name | `button-name-present` | exact |
| `cf77f2` | Bypass Blocks of Repeated Content | `bypass-blocks-present` (manual) | exact |
| `ye5d6e` | Instrument to move focus to non-repeated content | `bypass-blocks-present` (manual) | family |
| `047fe0` | Document has heading for non-repeated content | `bypass-blocks-present` (manual) | family |
| `b40fd1` | Document has a landmark with non-repeated content | `bypass-blocks-present` (manual) | family |
| `46ca7f` | Element marked as decorative is not exposed | `presentation-role-conflict` (manual) | exact |
| `oj04fd` | Element in sequential focus order has visible focus | `css-focus-indicator-suppressed` (manual) | partial |
| `6cfa84` | Element with aria-hidden has no content in sequential focus nav | `aria-hidden-focus` | exact |
| `de46e4` | Element with lang attribute has valid language tag | `valid-lang` | exact |
| `307n5z` | Element with presentational children has no focusable content | `presentational-children-focusable-absent` | exact |
| `4e8ab6` | Element with role attribute has required states/properties | `aria-required-attr` | exact |
| `e086e5` | Form field has non-empty accessible name | `form-control-programmatic-label-present`, `textbox-name-present`, `combobox-name-present`, `listbox-name-present`, `searchbox-name-present`, `slider-name-present`, `spinbutton-name-present` | family (we split by widget role) |
| `cc0f0a` | Form field label is descriptive | `form-control-label-quality` (manual) | partial |
| `a25f45` | Headers attribute refers to cells in same table | `table-headers-attr-valid` | exact |
| `ffd0e9` | Heading has non-empty accessible name | `empty-heading` (manual) | family |
| `b49b2e` | Heading is descriptive | `heading-quality` (manual) | partial |
| `b5c3f8` | HTML page has lang attribute | `html-lang-attr-present` | exact |
| `2779a5` | HTML page has non-empty title | `page-title-present` | exact |
| `5b7ae0` | HTML page lang/xml:lang attributes match | `html-xml-lang-mismatch` | exact |
| `bf051a` | HTML page lang attribute has valid language tag | `html-lang-attr-present` | exact |
| `3ea0c8` | Id attribute value is unique | `duplicate-id` | exact |
| `cae760` | Iframe element has non-empty accessible name | `iframe-name-present` | exact |
| `akn7bn` | Iframe with negative tabindex has no interactive content | `iframe-focusable-content` | exact |
| `qt1vmo` | Image accessible name is descriptive | `img-alt-quality`, `canvas-text-alternative-quality`, `svg-text-alternative-quality` (all manual) | family |
| `59796f` | Image button has non-empty accessible name | `input-image-alt-present` | exact |
| `23a2a8` | Image has non-empty accessible name | `img-alt-present`, `role-img-text-alternative-present` | family |
| `e88epe` | Image not in the accessibility tree is decorative | `img-alt-decorative` (manual) | exact |
| `24afc2` | Letter spacing in style attrs not `!important` | `avoid-inline-spacing` | exact |
| `78fd32` | Line height in style attrs not `!important` | `avoid-inline-spacing` | exact (combined rule) |
| `9e45ec` | Word spacing in style attrs not `!important` | `avoid-inline-spacing` | exact (combined rule) |
| `c487ae` | Link has non-empty accessible name | `link-name-present` | exact |
| `aizyf1` | Link is descriptive | `link-name-quality` (manual) | exact |
| `fd3a94` | Links with identical names + same context, equivalent purpose | `identical-links-same-purpose` (manual) | exact |
| `b20e66` | Links with identical accessible names, equivalent purpose | `identical-links-same-purpose` (manual) | exact |
| `m6b1q3` | Menuitem has non-empty accessible name | `menuitem-name-present` | exact |
| `bc659a` | Meta element has no refresh delay | `meta-refresh-timing-absent` | exact |
| `bisz58` | Meta element has no refresh delay (no exception) | `meta-refresh-no-exceptions` | exact |
| `b4f0c3` | Meta viewport allows for zoom | `meta-viewport-zoom-enabled` | exact |
| `8fc3b6` | Object element rendering non-text content has accessible name | `object-text-alternative-present` | exact |
| `b33eff` | Orientation not restricted via CSS transform | `css-orientation-lock` | exact |
| `674b10` | Role attribute has valid value | `aria-roles-valid` | exact |
| `0ssw9k` | Scrollable element is keyboard accessible | `scrollable-region-focusable` (manual) | exact |
| `7d6734` | SVG element with explicit role has accessible name | `svg-text-alternative-present`, `role-img-text-alternative-present` | family |
| `d0f69e` | Table header cell has assigned cells | `table-th-has-data-cells` | exact |
| `09o5cg` | Text has enhanced contrast | `contrast-enhanced` | exact |
| `afw4f7` | Text has minimum contrast | `contrast-minimum` | exact |
| `f51b46` | Video auditory content has captions | `video-caption` (manual) | partial |
| `2ee8b8` | Visible label is part of accessible name | `label-in-name` | exact |

Structural (not a named rule, but the check exists via a different mechanism):
- `off6ek` / `ucwvc8` (language subtag matches page/default language) — partially overlaps `html-xml-lang-mismatch` + `valid-lang` but not a full match.

## Gaps (no corresponding rule)

Grouped by theme, with WCAG SC where ACT declares one:

**Audio/video alternatives (1.2.x)** — largest gap cluster, 12 ACT rules: `1a02b0`, `e7aa44`, `2eb176`, `afb423`, `eac66b`, `ab4d13`, `c5a4ea`, `1ea59c`, `1ec09b`, `c3232f`, `d7ba54`, `ee13b5`, `fd26cf`. We only have `video-caption` and `media-alternative-transcript-evidence` (both manual/low-confidence) — full media-alternative testing (transcripts, audio description, sign language equivalence) is unimplemented.

**Keyboard trap (2.1.2)** — 3 rules: `80af7b`, `ebe86a`, `a1b64e`. No automated keyboard-trap detection at all today.

**Sensory/visual gaps:**
- `9bd38c` Content has alternative for visual reference (1.3.3, sensory characteristics)
- `0va7u6` HTML graphics contain no text (1.4.5, images of text)
- `59br37` Zoomed text node not clipped by CSS overflow (1.4.10, reflow)
- `36b590` Error message describes invalid form field value (3.3.1)
- `c4a8a4` HTML page title is descriptive (2.4.2) — `page-title-patterns` only catches generic/templated title *patterns*, never whether a plausible-looking title actually matches the page's content; see the judgment-call note below

**Context-aware link purpose:**
- `5effbb` Link in context is descriptive (2.4.4) — see the judgment-call note below; needs `link-name-quality` to weigh surrounding context, not just the bare name

**Motion/input (2.5.4, 2.1.4):**
- `7677a9` / `c249d5` Device motion actuation has UI alternative / can be disabled
- `ffbc54` No keyboard shortcut uses only printable characters

**Structural/HTML validity:**
- `e6952f` Attribute is not duplicated (raw HTML parsing-level check)
- `efbfc7` Auto-updating text content can be paused/stopped/hidden (2.2.2, beyond meta-refresh)
- `3e12e1` Block of repeated content is collapsible

**Judgment-call gaps found during test-case validation:**
- `4b1c6c` "Iframes with identical accessible names have equivalent purpose" was originally mapped to `iframe-title-unique`, but running ACT's own test cases against it exposed that they test different things: ACT's rule accepts a duplicate name when the two iframes point to equivalent content (same resource, mirrors, equivalent ads/sections) and only fails when duplicate-named iframes point to genuinely different content — a content-equivalence judgment call, the same class of check as our existing manual `identical-links-same-purpose`. `iframe-title-unique` instead flags *any* duplicate `title` attribute outright, deliberately and by design (see its own header comment) — a stricter, different, independently-valid check with no ACT counterpart of its own. Moved to "Extra coverage" below; `4b1c6c` itself stays a gap — closing it for real would mean a new manual `identical-iframes-same-purpose`-style rule, not a fix to `iframe-title-unique`.
- `5effbb` "Link in context is descriptive" was originally mapped to `link-in-text-block` on a name-similarity guess ("link" + "context/text"); its real applicability/expectation (fetched directly from act-rules.github.io) is "the accessible name together with its programmatically determined link context describes the purpose of the link" — WCAG 2.4.4, the *context-aware* sibling of `aizyf1`/`link-name-quality`, completely unrelated to `link-in-text-block`'s WCAG 1.4.1 color-distinguishability check (which is itself correctly and deliberately scoped to `a[href]` only, per its own header comment — not a bug). `link-name-quality`'s own header comment already documents that it doesn't consider surrounding context ("this check does not verify whether surrounding context... makes the purpose clear"), so `5effbb` stays an explicit gap rather than a forced match — closing it would mean teaching `link-name-quality` to weigh adjacent text/`aria-describedby`, a real scope expansion, not a quick fix.
- `identical-links-same-purpose`/`identical-links-same-purpose` (`fd3a94`, `b20e66`) are confirmed correct matches, but their `a[href]`-only scope (deliberate, using the DOM `.href` property for destination resolution) genuinely cannot cover `role="link"` elements without a real `href` — ACT's test corpus includes `<div role="link" tabindex="0" onclick="location='...'">`-style cases specifically to test this, and there is no static-DOM-readable destination for those (the target lives inside a JS string, not markup). This is a real, structural gap in the same family as the "dynamic/post-interaction state" limitation in `docs/LIMITATIONS.md`, not something to patch here.
- `oj04fd` "Element in sequential focus order has visible focus" was originally mapped to `css-hidden-focus` on a surface keyword match ("focus," "visible"); its real applicability/expectation is about whether a browser draws *any* visible focus indicator for a normally-visible, normally-positioned element (i.e. `:focus`/`:focus-visible` CSS suppressing the outline with no replacement) — a completely different concern from `css-hidden-focus`'s actual check (a keyboard-focusable element that is itself visually hidden by CSS, e.g. `opacity:0`/clip/off-screen). Removed from the matched table and moved to Gaps; a plausible new-rule candidate, not a fix to `css-hidden-focus` — and built as one since, `css-focus-indicator-suppressed`, which is what `oj04fd` maps to now.
- `cc0f0a` "Form field label is descriptive" and `c4a8a4` "HTML page title is descriptive" were both mapped to rules that only catch a narrower, adjacent concern: `form-control-programmatic-label-quality` flags a *weak primary labeling mechanism* (title/placeholder used instead of a real label), never whether a properly-associated label's own text is relevant to the field; `page-title-patterns` flags generic/templated title *patterns* (e.g. "Home", "Untitled"), never whether a specific, plausible-looking title actually matches the page's content (ACT's own failed example: `<title>Apple harvesting season</title>` on a page about clementines — a real title/content mismatch neither pattern-list nor mechanism-check was ever designed to catch). Both ACT ids moved to Gaps; both of our rules moved to [Extra coverage](#extra-coverage-beyond-act) as valid, independent, narrower checks with no ACT counterpart of their own. `cc0f0a` has since been picked up by a new rule of its own, `form-control-label-quality`; `c4a8a4` remains a gap.
- `d0f69e` "Table header cell has assigned cells" is a confirmed correct match, but `table-th-has-data-cells`'s own header comment already documents its scope as deliberately limited to the single unambiguous case (a table/ARIA-grid with header cells but *zero* data cells anywhere) rather than the full HTML5 header-association algorithm — 3 of ACT's test cases specifically probe the excluded "some particular header doesn't actually describe any cell, even though the table has data cells elsewhere" shape (both for native `<table>` and the ARIA `role="grid"` equivalent added during this validation pass), which stays an accepted, documented false negative rather than a bug.

### Gaps ranked for automatability

The goal is maximum automation, not just parity with ACT's own scope — several gaps above are worth turning into new rules even though they were never going to be "quick" ACT-mapping fixes. Ranked by confidence that a deterministic (or manual/`cantTell`-heuristic) DOM check can actually catch them:

**High confidence, new automatic rule, deterministic DOM check — both now closed, see the notes under "Matched rules":**
- ~~`307n5z` Element with presentational children has no focusable content~~ — closed by the new `presentational-children-focusable-absent` rule.
- ~~`46ca7f` Element marked as decorative is not exposed~~ — no new rule needed; the existing `presentation-role-conflict` already implements it (mapping miss, not a coverage gap).

**Medium confidence, new manual/`cantTell` rule (same pattern as existing quality checks):**
- ~~`b49b2e` Heading is descriptive~~ — closed by the new `heading-quality` rule, modelled on `link-name-quality`'s curated-phrase heuristic. It reaches the placeholder half only (see the mismatch table above), so `b49b2e` is a partial match rather than an exact one. One thing the original plan here got wrong: it proposed flagging single characters, and ACT's own passed example is `<h1>A</h1>` above a glossary — length carries no signal for headings, unlike page titles.
- `5effbb` Link in context is descriptive — already the clearest scope-expansion candidate (see the judgment-call note above): teach `link-name-quality` to weigh adjacent text/`aria-describedby` context, not a brand-new rule.
- ~~`oj04fd` Focus indicator suppressed via CSS~~ — closed by the new `css-focus-indicator-suppressed` rule. The CSSOM parsing turned out to be the easy half; what needed the care was deciding which rule a suppression belongs to (only the selector's subject, so `.card:focus .link` is not `.link`'s own suppression) and crediting a replacement drawn anywhere the focused element causes it — its own rule, a pseudo-element, a sibling.
- ~~`cc0f0a` Form field label is descriptive~~ — closed by the new `form-control-label-quality` rule, sitting alongside `form-control-programmatic-label-quality` rather than replacing it (one judges the label's text, the other the labelling mechanism). The curated placeholder list turned out to be the weakest of its three signals; the duplicate-label and split-label checks are what actually catch ACT's own failed examples.
- `c4a8a4` HTML page title is descriptive (title-vs-content relevance) — genuinely harder to heuristic than the others in this tier (needs some notion of "does this title's vocabulary overlap with the page's own content," not just a pattern/word list), so lower confidence within this tier.

**Design decision needed before building (not purely a confidence question):**
- ~~`3ea0c8` Page-wide unique `id`~~ — built as `duplicate-id`, tagged `wcag2a` plus the new `wcag22-removed`, which a 2.2 conformance run excludes and a 2.0/2.1 run keeps. The decision that unblocked it, and the reasoning, are in `docs/DESIGN_CHALLENGES.md`'s "Decided" section; the tag is documented in `docs/ENGINE_OPTIONS.md`.

**Lower confidence / needs a different technique than the rest of the engine:**
- `e6952f` Attribute is not duplicated — only detectable from the raw HTML *text* (the DOM has already collapsed duplicate attributes by the time any DOM-based rule runs), a different input than every other rule in this engine uses. Feasible only where raw source is available (not guaranteed in every integration).
- `efbfc7` Auto-updating content can be paused/stopped/hidden, `7677a9`/`c249d5` device-motion actuation — both require observing *behavior over time* (a MutationObserver window, or JS event-listener presence), not a markup snapshot. Could become a low-confidence manual heuristic (e.g. flag `<marquee>`, `role="marquee"`/`role="timer"` without a visible pause control) but real coverage is inherently limited.
- `ffbc54` No single-printable-character keyboard shortcut — HTML `accesskey` values are staticly visible, but most JS-implemented character-key shortcuts (the actual common real-world case) live in event-handler logic this engine doesn't execute or trace.
- Audio/video alternatives (1.2.x, 12 rules), `9bd38c`, `0va7u6`, `3e12e1` — these require judging semantic *accuracy* (does the transcript match the audio, is the image text redundant, is a "read more" toggle actually collapsible) that's beyond markup-level heuristics; stay manual/out of scope for now.

## Extra coverage beyond ACT

Rules in this repo with no ACT counterpart — mostly finer decomposition of ACT's single `e086e5` "form field has accessible name" rule into one rule per ARIA widget type, plus some ARIA-validity and structural rules ACT doesn't break out separately:

`aria-hidden-body`, `aria-braille-equivalent`, `aria-conditional-attr`, `aria-deprecated-role`, `aria-prohibited-attr`, `aria-prohibited-children`, `aria-role-name-present`, `binary-control-name-present`, `canvas-text-alternative-present`, `combobox-name-present`, `contrast-computable`, `definition-list-children-valid`, `deprecated-elements-not-used`, `dialog-name-present`, `dlitem-parent-valid`, `duplicate-id-aria`, `embed-text-alternative-present`, `form-control-programmatic-label-quality`, `form-control-single-label`, `iframe-title-unique`, `list-children-valid`, `listbox-name-present`, `listitem-parent-valid`, `meter-name-present`, `nested-interactive-controls-absent`, `option-name-present`, `page-title-patterns`, `progressbar-name-present`, `searchbox-name-present`, `server-side-image-map-absent`, `slider-name-present`, `spinbutton-name-present`, `summary-name-present`, `svg-image-text-alternative-present`, `tab-name-present`, `target-size-minimum`, `td-has-header`, `textbox-name-present`, `tooltip-name-present`, `treeitem-name-present`, `video-poster-text-alternative-present`, `area-alt-present`.

## Next steps

1. **Validate matched rules against ACT's official test cases** — done for the full matched set (see "Progress" above); re-run `scripts/act-testcase-check.js` after any future change to a matched rule to catch regressions.
2. **Resolve the open design questions in `docs/DESIGN_CHALLENGES.md`** — these are the highest-value remaining item: each is a confirmed, understood defect or scope gap in an already-matched rule, just deferred because the fix is a real behavior change (not a quick patch) that deserves a deliberate look and fixture coverage before landing.
3. **Build the highest-confidence automatable gaps** — `307n5z` and `46ca7f` are done (see above). `3ea0c8` (page-wide unique id) is done as well, once the WCAG-version-tagging question it was blocked on was decided. `b49b2e` (heading quality), `oj04fd` (suppressed focus indicator) and `cc0f0a` (label-text relevance) are done too, which empties the manual/`cantTell` tier.
4. **Keyboard trap detection** (`80af7b`/`ebe86a`/`a1b64e`) remains a large, currently-unaddressed gap with no automated detection at all — likely needs a different technique (interaction simulation) than the rest of this engine's static-markup approach.
