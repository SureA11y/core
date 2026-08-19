# Design challenges

A running log of engine design decisions worth re-examining — cases where an existing choice turned out to conflict with a ground-truth source (usually the W3C ACT rules test corpus), or just looks questionable on a second look. Not all of these are bugs; some are deliberate tradeoffs that deserve a second opinion before being either confirmed or overturned. Each entry: the decision as it stands, why it's being questioned, and current status. Entries that have been settled move to [Decided](#decided) at the bottom, with the reasoning kept — a decision is only useful later if the argument behind it survives with it.

## Open

### `label-in-name` compares against accessibility-tree text, where ACT uses *visible* inner text

**Decision as it stands:** `label-in-name.js` builds the element's visible label from text nodes whose parent is accessibility-tree eligible, which drops `aria-hidden` subtrees and keeps text that CSS has hidden visually. The `aria-hidden` half is deliberate and reasoned in the rule's own comment: an `<i aria-hidden="true">` icon-font ligature renders as a glyph, not as the literal word in the DOM, so counting its text would flag every icon-only button named by `aria-label`.

**Why it's being questioned:** ACT `2ee8b8` is explicit that its "visible inner text" is a rendering property, not an accessibility-tree one, and three of its examples turn on the difference: `<a aria-label="Download specification">Download <span aria-hidden="true">gizmo</span> specification</a>` fails ACT (the word "gizmo" is on screen, whatever `aria-hidden` says) and passes here; a `clip-path: inset(50%)` visually-hidden span passes ACT (nothing is rendered) and fails here; and `<div style="display: inline">` children concatenate into one word for ACT ("ACT" from three inline divs) while we read them apart. All three point the same way — the label a sighted user speaks comes from what is painted, not from what the accessibility tree carries. The icon-font case the current behavior was built for is real, but `aria-hidden` is a coarse stand-in for it: the attribute says "don't expose this", not "this doesn't render as words".

**Why this hasn't been changed yet:** "visible inner text" needs a real rendering model — per-node `display` resolution for the concatenation rule, plus the visually-hidden detection (`clip-path`, `clip`, 1px boxes, off-screen positioning) the engine's offscreen heuristic only partly covers. It's a shared-helper change with reach beyond this rule.

**Caveat added 2026-08-19:** re-fetching ACT `2ee8b8`'s live rule page while closing the icon-font entry below turned up only 13 published examples, none of them the `aria-hidden`/`clip-path`/inline-concatenation shapes described above — those specific claims don't currently reproduce against the live corpus (same stale-local-checkout pattern as the `bc4a75` applicability question, now in Decided). The architectural critique (accessibility-tree text vs. true rendered text) may still be sound, but it is currently untested by ACT ground truth rather than confirmed by it.

**Status:** open, unresolved as of 2026-08-19 — deprioritized pending a live ACT example that actually exercises it.

## Decided

### `contrast-minimum`/`contrast-enhanced` treated symbol-only text as real text needing a contrast ratio — fixed

**Decision as it stands (before the fix):** the shared text scan's applicability gate (`isNonEmptyText` in `getTextScan()`, `src/core/contrast-helpers.js`) only checked for non-whitespace characters — a text node made entirely of punctuation/symbol glyphs (`----=====+++...±±±±@@@@@@@@`) counted the same as real words.

**Why it was questioned:** ACT `afw4f7`/`09o5cg`'s own applicability is scoped to text that "expresses something in human language," and their own passed example for the "environment-dependent" bucket this was filed under is exactly a paragraph of pure symbols — nothing environment-dependent about it, a plain applicability gap.

**Decision (2026-08-19):** `isNonEmptyText` now also requires at least one Unicode letter or number (`\p{L}`/`\p{N}`) somewhere in the text node, applied at both the text-node walk and the `<input type=submit|button|reset>` value-attribute path that shares the same gate. Digits-only text (`"42"`) still counts and is still checked — only text with zero letters or digits at all is exempt.

**Status:** resolved 2026-08-19 — `afw4f7` drops from 6 to 5 mismatches, `09o5cg` from 5 to 4.

### `css-orientation-lock` required an EXACT 90/270-degree rotation, when its own comments already claimed "approximately" — fixed

**Decision as it stands (before the fix):** `isLockingRotation`'s comment claimed to flag "~90/~270 degrees," but the actual code did `Math.abs(abs - 90) % 90 <= 0` — modulo of a non-negative number is `<= 0` only when it's exactly `0`, so this only ever matched a rotation that was an exact multiple of 90. The 3 live mismatches this produced were filed as a single "env/harness limit — jsdom's CSS parser drops `@media(orientation)` rules using `rad` units or `matrix3d()`."

**Why it was questioned:** directly parsing both cited stylesheets with jsdom (outside this engine entirely) showed jsdom parses `rotate(1.5708rad)` and `matrix3d(...)` correctly — `style.transform` comes back with both intact. Neither is a jsdom limitation. What's actually happening: `1.5708rad` converts to `90.0000210...` degrees (floating-point remainder from the radian conversion), and ACT's own failed example uses a deliberately-inexact `92.5deg` — both are "approximately 90" in every practical sense, but neither is `=== 90`, so the exact-modulo check silently passed both.

**Decision (2026-08-19):** replaced the exact-equality check with a real tolerance window (±5 degrees) around the normalized position, fixing both the floating-point case and the deliberately-inexact one — the "not a jsdom limitation" 2 of the original 3 mismatches. The third, `matrix3d()`, genuinely is a documented, deliberate scope limit (this rule doesn't decompose transform matrices into an equivalent angle) and stays as-is — that reasoning was already correct, just miscategorized as "jsdom" alongside the two that weren't.

**Status:** resolved 2026-08-19 — `b33eff` drops from 3 to 1 mismatch (the accepted `matrix3d()` case).

### `iframe-focusable-content` never resolved a `srcdoc` iframe's content, and never exempted tiny "tracking pixel" iframes — both fixed

**Decision as it stands (before the fix):** the rule's `contentDoc = el.contentDocument || null` resolution was the only path to an embedded document; it was documented as an "env/harness limit — jsdom doesn't populate `iframe.contentDocument` from a `srcdoc` attribute; a real browser does," implying nothing could be done about it in this codebase specifically.

**Why it was questioned:** that framing only holds for the test-fetcher's own jsdom instance. This library's own Node/jsdom integration path (`docs/INTEGRATION.md` Pattern 1) is a real, documented way consumers run this engine — and jsdom's `srcdoc` gap affects them identically, not just this repo's test harness. `el.getAttribute('srcdoc')` is a plain string this engine can read and parse itself, independent of whatever the host DOM implementation does with it.

**Decision (2026-08-19):** two changes, both scoped to this rule. (1) When the live `contentDocument` looks empty and a `srcdoc` attribute is present, its HTML string is parsed via `DOMParser` as a static fallback — no rendering pipeline needed, and every downstream helper in this file (`isRenderedInDoc`, `probeImmediateFocusRedirect`) already degrades gracefully when handed a detached, `defaultView`-less document. (2) Fixing that surfaced a second, previously-masked gap: ACT akn7bn's own Expectation requires the focusable content to also be *visible*, and a `width`/`height` ≤ 2px iframe (the "tracking pixel" pattern, ACT's own passed example) can't render anything perceptible — that exemption is now checked via the iframe's own HTML attributes, a static signal that doesn't need real layout.

**Status:** resolved 2026-08-19 — `akn7bn` runs clean (0/6).

### `bypass-blocks-present`'s heading mechanism credited a screen-reader-only heading, when ACT requires it to be visible — fixed

**Decision as it stands (before the fix):** `hasHeading()` credited any `<h1>`-`<h6>`/`[role="heading"]` that was included in the accessibility tree — an off-screen-positioned, clipped, opacity:0, or zero-size-overflow-hidden heading counted the same as a fully visible one. This mismatch was never individually triaged; it sat inside `ye5d6e`/`047fe0`'s combined "1, 2" mismatch count, both filed under one blanket "deliberate leniency" reason that only actually described a *different* shape (a heading positioned inside the repeated content it's supposed to be an escape from).

**Why it was questioned:** re-fetching `047fe0`'s live corpus surfaced a case that reason doesn't cover at all: `<h1 class="off-screen">` inside `<div id="main">`, correctly positioned *after* the repeated nav — ACT still expects **failed**. Its own Expectation text requires the heading to be both "included in the accessibility tree" *and* "[visible](#visible)" — a screen-reader-only heading gives sighted keyboard users no equivalent way to locate the start of non-repeated content, which is exactly the gap `047fe0` is checking for.

**Decision (2026-08-19):** `hasHeading()` now also requires the heading to carry no CSS-hiding hint (`helpers.getVisibilityHintsInfo` — off-screen, clipped, opacity:0, zero-size-overflow-hidden). The sibling `hasMainLandmark()`/`hasWorkingAnchorLink()` checks are deliberately untouched — `cf77f2`'s own live text doesn't carry the same visibility requirement for a `<main>` landmark, confirmed by an existing regression test that pins a clipped-but-accessible `<main>` as still credited.

**Status:** resolved 2026-08-19 — verified directly (`tests/engine-checks/manual/bypass-blocks-present.test.js` pins the case with the CSS inlined, since the real ACT test case defines it via an external stylesheet jsdom's test fetcher can't load, an env/harness limit of the same class as `oj04fd`). The corpus checker's own count for `047fe0` stays at 2 (the fixed case can't register as clean through the harness limitation; the other, unrelated mismatch is the genuine, still-open positional-judgment gap).

### `iframe-name-present` exempted every `role="none"`/`"presentation"` iframe from needing a name, regardless of focusability — fixed

**Decision as it stands (before the fix):** the rule's own header comment already claimed this "matches ACT cae760," and the doc's mismatch table filed the one remaining `cae760` case entirely under a *different*, correctly-reasoned divergence (a `tabindex="-1"` iframe with no role, which ACT considers unreachable and out of scope, but this engine still evaluates). That framing missed a second, distinct mismatch hiding in the same ACT id.

**Why it was questioned:** re-fetching `cae760`'s live corpus surfaced `<iframe title=" " role="none" src="...">` (no `tabindex` at all) expected **failed**, which this rule returned `notApplicable` for. ACT's own reasoning: "because iframe elements are part of sequential focus navigation, the explicit semantic role of none will be ignored, due to Presentational Roles Conflict Resolution." Unlike most elements, `<iframe>`/`<frame>` are natively focusable by default — no `tabindex` needed — so `role="none"` alone never actually removes one from the tab order, and the "decorative" marking doesn't stick.

**Decision (2026-08-19):** the role="none"/"presentation" exemption now only applies when the iframe is also out of the tab order (an explicit negative `tabindex`). `helpers.getFocusableInfo` has no native-focusability entry for `iframe`/`frame` at all (it's an unusual element in that respect — most things need an explicit `tabindex` or a native-interactive tag), so focusability is computed locally in the rule instead of through the shared helper.

**Status:** resolved 2026-08-19 — `cae760` drops from 2 to 1 mismatch; the one remaining case is the pre-existing, correctly-reasoned `tabindex="-1"`-without-role divergence, left as-is.

### `aria-valid-attr-value` treated an explicitly-empty non-idref value as invalid, and always required `aria-errormessage`'s target to exist — both fixed

**Decision as it stands (before the fix):** `validateAttrValue`'s empty-value exemption (`allowEmpty`) only applied to `idref`/`idref-list` types; a bare boolean/tristate/number/token-list attribute with no value (`aria-checked` alone, `aria-relevant=""`) was validated against its type's value set and failed. Existence-checking on single-idref attributes applied uniformly to both `aria-activedescendant` and `aria-errormessage`. Confirmed against ACT `6a7281`'s live corpus (2/23 mismatches).

**Why it was questioned:** the doc previously filed this under "deliberate scope — our idref-type validation extends beyond ACT's syntax-only check... genuinely more useful, not a bug," covering only the `aria-errormessage` half. But ACT `6a7281`'s own Applicability text is a blanket rule for *every* value type: "any WAI-ARIA state or property that is **not empty**" — an empty value (including a bare attribute) is out of scope entirely, not specific to idrefs. And its own Background text names `aria-errormessage` specifically as a non-required property whose target "may be created in response to an event that may or may not happen" — a documented ACT exception, not something our stricter check improves on.

**Decision (2026-08-19):** `validateAttrValue` now short-circuits to `{valid: true}` for any empty value before the type-specific switch, and the `idref` case exempts `aria-errormessage` (but not `aria-activedescendant`, which ACT gives no such carve-out) from existence-checking.

**Status:** resolved 2026-08-19 — `6a7281` runs clean (0/23).

### `contrast-minimum`/`contrast-enhanced` treated exact foreground/background color matches as a real (1:1) contrast failure — fixed

**Decision as it stands (before the fix):** the docs described this as an accepted, permanent divergence: "ACT treats text whose color exactly matches its background as invisible; the contrast rules report the 1:1 ratio, since nothing in the markup separates 'invisible on purpose' from 'invisible by accident'."

**Why it was questioned:** that framing conflates two different questions. Detecting authorial *intent* (was this meant to be hidden?) is genuinely undecidable from markup, and the engine is right not to guess at it. But ACT's own rule doesn't ask that question at all — its stated reasoning for the inapplicable case is purely factual: "this text is not visible because the foreground color is the same as the background color." Whether two fully-resolved, fully-opaque colors are bit-for-bit identical is a plain equality check, deterministic and intent-free, not a judgment call — the same class of fact as any other computability gate this engine already applies (gradients, filters, opacity).

**Decision (2026-08-19):** added an `isSameColorAsBackground` gate to the shared text scan (`getTextScan` in `src/core/contrast-helpers.js`) that all three contrast rules (`contrast-computable`, `contrast-minimum`, `contrast-enhanced`) already use for applicability. It fires only when both the effective foreground and effective background resolve cleanly to a fully opaque color and those colors are identical — any gradient, image, or partial-opacity background is left untouched and still reaches the existing computability/ratio logic normally. A near-miss (e.g. `#fefefe` on `#ffffff`) is unaffected and still fails on ratio, guarded by a regression test.

**Status:** resolved 2026-08-19 — `afw4f7` and `09o5cg` both drop one mismatch each (7→6, 6→5).

### `valid-lang`'s applicability didn't resolve which text actually inherits a given `lang` attribute — fixed

**Decision as it stands (before the fix):** `valid-lang.js` applied to any non-root element carrying a non-empty `lang` attribute with *any* non-whitespace text anywhere in its subtree, unconditionally, and validated that attribute's value as a language tag. Confirmed against ACT `de46e4`'s live corpus (3/19 mismatches, exactly the three shapes below).

**Why it was questioned:** ACT `de46e4`'s applicability is narrower and more precise: it applies only when "there is some text inheriting its programmatic language from the element which is neither empty nor only whitespace." Three concrete gaps: (a) an invalid `lang` on an element whose entire text content is re-scoped by a nested descendant's own (valid) `lang` attribute has no text actually governed by the invalid value, so it should pass, not fail; (b) `alt` text on a descendant counts as "governed text" too; (c) text that's present but not rendered (`display:none`) doesn't count as governed text — but `aria-hidden` and offscreen positioning do *not* exempt text either, confirmed by ACT's own failed examples for both.

**Decision (2026-08-19):** rewrote applicability around a `hasGovernedText` walk: recurses through the element's subtree, stopping at (not recursing into) any descendant that carries its own non-empty `lang` — that subtree governs itself, not the outer element — and counts a non-empty `alt` on `img`/`area`/`input[type=image]` the same as a text node. Only actual non-rendering (CSS `display:none`, the `hidden` attribute, via the existing `targetSet: 'dom'` eligibility check) excludes a node; `aria-hidden` and offscreen positioning are deliberately left alone, matching ACT's own failed examples for both.

**Status:** resolved 2026-08-19 — `de46e4` runs clean (0/19).

### No rule covered `role="graphics-symbol"`/`"graphics-document"` on an SVG descendant, only the `<svg>` root itself — fixed

**Decision as it stands (before the fix):** `svg-text-alternative-present.js`'s own header comment stated: "Deliberately does NOT extend to arbitrary `role="graphics-symbol"` descendants nested inside an `<svg>` — this check's scope is the `<svg>` root only." `role-img-text-alternative-present.js` was scoped to `role="img"` only, not `graphics-symbol`/`graphics-document`. Confirmed against ACT `7d6734`'s live corpus (1/10 mismatch, its own failed example: `<svg><circle role="graphics-symbol" .../></svg>`, a root `<svg>` with no role at all but a descendant circle carrying the role).

**Why it was questioned:** ACT `7d6734`'s applicability is "any SVG element with an explicit role of img, graphics-document, or graphics-symbol" — "SVG element" meaning any element in the SVG namespace, not just the root `<svg>` tag; `graphics-symbol` is specifically meant for descendant shapes. Neither existing rule reached this.

**Decision (2026-08-19):** `role-img-text-alternative-present.js`'s selector widened from `[role="img" i]:not(img)` to also match `[role="graphics-symbol" i]`/`[role="graphics-document" i]` anywhere in the document — this already covers nested SVG shapes, since the rule was never scoped to a particular tag. Its existing aria-label/aria-labelledby/title checks needed no change; its SVG-first-child-`<title>` naming check (previously gated to `tag === 'svg'` only) was widened to any SVG-namespace element via `namespaceURI`, since SVG-AAM's title-child naming mechanism isn't root-specific either. `svg-text-alternative-present.js` keeps sole ownership of the `<svg>` root case (its own header comment updated to point at the sibling rule for descendants) — the two rules already had accepted, pre-existing double-coverage on a `role="img"`/`"graphics-document"` `<svg>` root (both fire on the same unnamed element), which this change doesn't newly introduce, only extends consistently to `graphics-document` alongside the existing `img` overlap.

**Status:** resolved 2026-08-19 — `7d6734` runs clean (0/10).

### `img-alt-decorative` only considered `<img alt="">`, missing `aria-hidden`/`role=none` images and every svg/canvas case — fixed

**Decision as it stands (before the fix):** `src/checks/manual/img-alt-decorative-manual.js` was hard-scoped to a CSS selector matching only `img[alt=""]`/`img[alt^=" "]`/`img[alt$=" "]` — i.e. an `<img>` already marked (or nearly marked) decorative via `alt`. Confirmed against ACT `e88epe`'s live corpus (4/20 mismatches, all four of its own failed examples: `aria-hidden="true"` with a non-empty `alt`, `role="none"` with a non-empty `alt`, an unlabeled decorative `<svg>`, an unlabeled `<canvas>` drawn via script).

**Why it was questioned:** ACT `e88epe`'s own applicability, fetched directly, is much broader: "any `img`, `canvas` or `svg` element that is visible and" excluded from the accessibility tree by *any* mechanism — `aria-hidden`, `role="none"`/`"presentation"`, an `svg` with an implicit/explicit `graphics-document` role and an empty name, or a `canvas` with no explicit role and an empty name.

**Decision (2026-08-19):** rewritten around the direction ACT actually asks for — instead of a narrow "already-marked-decorative" selector, the rule now selects visible `img`/`canvas`/`svg` elements and asks whether each is *excluded* from the accessibility tree (`isIncludedInAccessibilityTree` for aria-hidden/inert; an explicit `role="none"`/`"presentation"` or `<img alt="">` not overridden by focusability, matching the same conflict-resolution convention already used by `svg-text-alternative-present.js`; an unlabeled `<svg>`'s implicit `graphics-document` role reusing that same file's `hasIntent` boundary; an unlabeled `<canvas>` with no explicit role). The noise-reduction concern is handled by ACT's own exception: an element is skipped entirely when any ancestor already has an author-supplied name (`aria-label`/`aria-labelledby`/`title`/`<label>`) — the common real case of an icon-only button already named via `aria-label`, where whether the icon itself "is decorative" is moot. Two of ACT's own applicability carve-outs (an `<img>` mid-load/broken, a fully-transparent `<canvas>`) aren't decidable from a static scan and are accepted as a documented limitation (`docs/LIMITATIONS.md`) rather than chased further — a rare, low-cost false positive a reviewer dismisses at a glance.

**Status:** resolved 2026-08-19 — `e88epe` runs clean (0/20).

### `label-in-name` had no exemption for icon-font glyphs or icon-standing-in characters — fixed

**Decision as it stands (before the fix):** `label-in-name.js` did a literal text-containment check between an element's visible text and its accessible name, with no exemption for visible text that is actually rendering as an icon rather than readable text.

**Why it was questioned:** ACT `2ee8b8`'s own expectation text includes an explicit carve-out: visible text must be contained in the accessible name "except for characters in the text nodes used to express non-text content." Its own two failed-example fixes: `<button aria-label="close">X</button>` (a visible "X" glyph standing in for a close icon — ACT: "the 'x' text node is non-text content") and `<button aria-label="Find">search</button>` styled with an icon font (`font-family: 'Material Icons'`) that remaps the literal word "search" to render as a magnifying-glass glyph.

**Decision (2026-08-19):** fixed with two narrow heuristics. (a) A curated `font-family` name list (Material Icons/Symbols, Font Awesome, Ionicons, Glyphicons, IcoMoon, Bootstrap Icons, Feather, ...) catches the icon-font-remap shape, same curated-list tradeoff as `link-name-quality`'s phrase list. (b) A whole visible label of exactly one character that doesn't even appear inside the accessible name catches the "X" shape — scoped to "doesn't appear in the name at all" specifically so a real word-boundary mismatch (visible `"1"` against `aria-label="1a"`, where "1" *is* a substring of the name) still fails outright rather than being swept into the exemption; an existing test guards exactly this distinction. ACT does not itself define an algorithmic test for "non-text content" (confirmed by fetching the rule's own Background/Assumptions text), so both heuristics report `cantTell` rather than a silent pass, surfacing the case for a human look instead of asserting or hiding a possible defect.

**Status:** resolved 2026-08-19 — `2ee8b8` runs clean (0/13).

### The ARIA structure rules only evaluate containers that carry an explicit `role` — not a bug

**Decision as it stands:** `aria-required-children`, `aria-prohibited-children` and `aria-required-parent` all key their applicability off `getExplicitRole(el)` — an element with no `role=""` attribute is never evaluated as a container, however clear its native semantics.

**Why it was questioned:** an earlier pass, reading ACT `bc4a75` from a local checkout of `act-rules/act-rules.github.io`, took the rule's failed-example 10 to be `<ul><div></div><div></div></ul>` (an implicit `list` owning `generic` children) and concluded our explicit-role-only applicability was a gap.

**Decision (2026-08-19):** not a bug. Fetching `bc4a75`'s live page directly (act-rules.github.io) shows its Applicability text reads *"has a WAI-ARIA 1.1 explicit semantic role with required owned elements"* — explicit is load-bearing — and its own **Inapplicable Example 2** is exactly `<ul><li>Item 1</li></ul>`, plain native markup with no role anywhere. ACT itself excludes bare native containers from this rule; the local-checkout reading that prompted this entry didn't match the current published rule. `getExplicitRole`-only applicability is correct as written and needs no change.

**Status:** resolved 2026-08-19 — no code change; confirmed against the live ACT rule text.

### `aria-prohibited-children` gated `group`/`rowgroup` transparency behind the container's own required-owned set — a real bug, now fixed

**Decision as it stands (before the fix):** a `role="group"`/`role="rowgroup"` owned child was only treated as a transparent wrapper (recursed through) when the *container's own* required-owned-roles set happened to include `group`/`rowgroup` — true for `menu`/`menubar`/`tree`, false for `list`, `listbox`, `table`, `radiogroup`, `tablist`.

**Why it was questioned:** running the live `bc4a75` corpus surfaced a passed example this engine failed: `<div role="list"><span role="listitem">Item 1</span><div role="group"><span role="listitem">Item 2</span><span role="listitem">Item 3</span></div></div>`. `list`'s required-owned set is `listitem` only, so the `group` wrapper was treated as a real, non-transparent owned entry with role `group` — not in the required set — and flagged. ACT's failed example 6 (`role="list"` wrapping a `role="group"` that owns `role="tab"` children, expected to fail) confirms the same: `group` is transparent under `list` regardless of `list`'s own required-owned set, so what determines the outcome is the *group's own children*, not the group role itself.

**Decision:** `group`/`rowgroup` are universally transparent intermediary containers for owned-element matching, for any container role — not conditional on the container's own required-owned set naming `group`/`rowgroup` as an acceptable leaf role. Fixed in `collectOwnedRoles` (`src/checks/automatic/aria-prohibited-children.js`).

**Status:** resolved 2026-08-19 — `bc4a75` runs clean (0/19 mismatches).

### Page-wide duplicate-`id` checking was deliberately skipped once — now built, version-scoped

**Decision as it stands:** `src/checks/automatic/duplicate-id-aria.js` only flags a duplicate `id` when it's referenced by an ARIA ID-reference attribute. Its header comment: "Scoped deliberately to ids referenced by ARIA, not the broader/deprecated page-wide duplicate-id check (see ROADMAP.md's 'Skip' list)." That `ROADMAP.md` no longer exists in the repo (not found in the working tree or as a tracked file in `git log` — likely a local planning doc that was never committed), so the original reasoning behind "skip" isn't recoverable verbatim, only the pointer to it.

**Why it's being questioned:** while mining ACT's gap list (per the user's request to find gaps worth turning into new rules), `3ea0c8` "Id attribute value is unique" is exactly this broader page-wide check, and it's genuinely detectable with a simple, deterministic document-wide scan. Checked ACT's own SC mapping for it: `3ea0c8` maps to **WCAG 4.1.1 Parsing**, which the Working Group formally **removed in WCAG 2.2** (browsers/AT no longer depend on strict-parsing conformance the way they did when that SC was written) — and axe-core deprecated its own equivalent broad `duplicate-id` check around the same time, for the same reason. So the original "skip" call was well-founded *for WCAG 2.2 conformance scoring specifically*.

That said, duplicate IDs are still a real, practical bug independent of which SC currently covers them: they break `<label for>` association, fragment navigation, and any `getElementById`/`querySelector('#...')` call, not just ARIA references — and this engine already supports WCAG-version-scoped tagging (`wcag2a`/`wcag21a`/`wcag22aa`-style tags, see `docs/ENGINE_OPTIONS.md`'s WCAG-version filtering). A page-wide duplicate-id rule could be added and tagged as WCAG 2.0/2.1-only (`wcag411`-style, excluded from WCAG 2.2 tag sets) rather than either fully skipped or wrongly counted against 2.2 conformance — the two options the original either/or "skip" decision didn't have room for.

**Decision (2026-08-19):** build it, version-scoped. The new `duplicate-id` rule maps to SC 4.1.1 and carries `wcag2a` (its 2.0/2.1 origin) plus a new `wcag22-removed` tag; a consumer targeting WCAG 2.2 drops it with `excludeTags: ['wcag22-removed']`, one targeting 2.0 or 2.1 keeps a real 4.1.1 result. That is the third option the original either/or "skip" call did not have room for: the defect is real regardless of which SC covers it (`<label for>`, fragment navigation and `getElementById` all resolve to the first match), while the conformance arithmetic stays honest for every version. `src/coverage/wcag-version-map.js` gained `WCAG22_REMOVED_SCS`/`removedInVersion` so the removal is recorded next to the additions rather than living only in a rule comment.

**Status:** resolved 2026-08-19 — `duplicate-id` ships, clean against all 10 of ACT `3ea0c8`'s examples.

### `<label for>`/wrapping association is applied to elements that aren't natively labelable, contradicting ACT

**Decision as it stands:** the shared accessible-name helper (`getAccessibleNameInfo` in `src/core/dom-helpers.js`, ~line 2984) falls back to a `label[for]`/wrapping-`<label>` lookup by element `id` for *any* element, not just genuinely labelable native ones (`input`/`textarea`/`select`/`button`/`output`/`meter`/`progress`) — its own comment describes this as deliberate: "fallback for elements where `.labels` isn't natively available, e.g. a non-native-labelable element like `<div role="button" id="x">` still explicitly pointed at by `<label for="x">`." The same pattern is duplicated in `textbox-name-present.js`, `combobox-name-present.js`, `listbox-name-present.js`, `searchbox-name-present.js`, `slider-name-present.js`, and `spinbutton-name-present.js`.

**Why it's being questioned:** ACT `e086e5`'s own test corpus fails a `<label>first name<div role="textbox"></div></label>` (and the `label[for]` equivalent) — a `<div role="textbox">` isn't a native HTML label target, and per HTML, `<label>` only creates a real accessible-name association with labelable elements. `textbox-name-present.js`'s own header comment even states the opposite of what the shared helper does: `role="textbox"` is "name-from-author-only... must NOT fall back to subtree content" — the intent was clearly to be strict here, but the `<label>` fallback undermines it.

**Decision (2026-08-19):** keep the leniency. The question was whether this engine follows the spec or follows what assistive technology actually does, and the answer here is what users experience: where a screen reader announces a `<label for>` pointed at a non-labelable ARIA widget, an engine that calls that name absent would report a missing name the user can hear perfectly well — a false positive, and the worst kind, since it sends an author to "fix" working markup. Reporting a name that some AT ignores is the safer error: it under-reports a real problem rather than inventing one, and the widget's own naming rules (`aria-label`/`aria-labelledby`) still apply on top.

Two consequences, both accepted: the shared helper and its six rule-local copies stay as they are, and ACT `e086e5`'s two `<label>`-on-`role="textbox"` failed examples stay permanent mismatches — reclassified in `docs/ACT_RULE_MAPPING.md` from an open question to a deliberate divergence.

**Status:** resolved 2026-08-19 — no code change; behaviour confirmed as intended.

### `aria-allowed-attr` only checks elements with an *explicit* `role` attribute — the entry was written from a stale comment

**Decision as it stood:** `src/checks/automatic/aria-allowed-attr.js`'s header comment said the rule was deliberately scoped to elements carrying an explicit `role="..."`, and this entry took it at its word.

**What was actually true:** the comment was out of date when the entry was written. An implicit-role path had already landed on 2026-08-13 (`cdf9a13`), with a generated `IMPLICIT_ROLE_BY_ELEMENT` table gated on elements whose role is the same in every context, and the rule had been judging `<p aria-level="2">` and friends ever since. The entry described the documentation, not the code — a reminder that a header comment is evidence of intent, not of behaviour, and that the check is one `runa11yCoreOnHtml` call away.

**What the real remaining gap was:** elements HTML-AAM maps to *no* role at all. ACT `5c01ea`'s failed example 2 is `<audio controls aria-orientation="horizontal">`: `audio` has no role, so no role-specific attribute is supported on it, and the rule skipped it because the implicit-role lookup came back empty — indistinguishable, in the old code, from "a role this table does not model".

**Decision (2026-08-19):** separate the two. A generated `ROLELESS_ELEMENTS` set (`audio`, `video`) makes "no role in any context" an answer rather than a shrug, and every non-global ARIA attribute on one of those is reported. `div`/`span` joined the context-free table as `generic`, whose supported set is empty, so `<div aria-expanded="true">` is now reported too — the attribute announces nothing there, which is a real defect rather than a spec technicality. Context-dependent elements (`<a>`, `<section>`, `<td>`, ...) are still skipped rather than guessed at; that restraint is what the second entry above is about.

**Status:** resolved 2026-08-19 — `5c01ea` now runs clean against all 17 of ACT's examples, and the rule's header comment describes what it does.

### `aria-required-children` uses "at least one acceptable owned role", where ACT requires every owned role to be acceptable

**Decision as it stood:** `aria-required-children` is satisfied by finding any single matching descendant, and its header comment called that a deliberate recall-over-precision trade-off. This entry read ACT `bc4a75`'s exclusive expectation against it and concluded the engine would miss any container mixing valid and invalid owned children — a `role="list"` holding one real `listitem` and a stray `role="button"`.

**What was actually true:** the exclusive check exists, in `aria-prohibited-children`. This repo splits ACT's single rule into two atomic decisions — "does a required child exist" and "is every owned child allowed" — and the second one already walks the owned graph exclusively, with `group`/`rowgroup` transparency and boundary handling. ACT's failed example 6, the nested `group` owning `treeitem`s that this entry quoted in full, fails today; so does the mixed list. The entry compared ACT's rule against one half of the pair.

**Decision (2026-08-19):** no algorithm rewrite. The defect was in the mapping, which pointed `bc4a75` at `aria-required-children` alone, so the corpus run measured half the coverage and reported the other half as missing. `bc4a75` is now a `family` match over both rules, and `aria-required-children`'s header says which half it owns, so the next reader does not repeat the inference.

**Status:** resolved 2026-08-19 — `bc4a75` went from 4 mismatches to 1, the remainder being the implicit-container applicability entry below.

### `NATIVE_CONTAINMENT_ROLE_BY_ELEMENT` gave several native tags an unconditional implicit role, ignoring HTML-AAM's context requirement

**Decision as it stood:** `getContainmentRole` mapped `li → listitem`, `option → option`, `tr → row`, `td → cell`, `th → columnheader` and the row groups unconditionally, whatever contained them.

**Why it was wrong:** HTML-AAM makes those roles conditional. An `<li>` is a `listitem` only as a child of `<ul>`, `<ol>` or `<menu>`; an `<option>` only inside `select`/`datalist`/`optgroup`; the table family only inside a real table. ACT `bc4a75` tests it directly: `<div role="list"><li>Item 1</li><span role="link">Item 2</span></div>` must fail, because with the `<li>` carrying no role the list owns nothing valid at all — and the engine passed it.

**Decision (2026-08-19):** fixed. A `NATIVE_CONTAINMENT_CONTEXT` table records the containing tags each conditional role needs, split between HTML-AAM's "child of" conditions (`li`, `option`, the row groups) and its "descendant of a table" ones (`tr`, `td`, `th`), which sit inside a rowgroup in most real tables. The common CSS-reset shape `<ul role="list"><li>…</li></ul>` is untouched, since the `<li>`'s parent really is a `<ul>`.

One existing test changed meaning with it: a bare `<option>` under `role="listbox"`, outside any `<select>`, used to count as the listbox's owned child. It no longer carries a role, so it is transparent and a focusable element inside it becomes the listbox's own roleless owned entry. That is the same conditional ACT applies to `<li>`, so applying it to `<option>` too is the consistent reading — the alternative would have been to accept `role="listbox"` as native context for `<option>` while ACT explicitly refuses `role="list"` as context for `<li>`.

**Status:** resolved 2026-08-19.
