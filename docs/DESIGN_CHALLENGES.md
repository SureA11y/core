# Design challenges

A running log of engine design decisions worth re-examining — cases where an existing choice turned out to conflict with a ground-truth source (usually the W3C ACT rules test corpus), or just looks questionable on a second look. Not all of these are bugs; some are deliberate tradeoffs that deserve a second opinion before being either confirmed or overturned. Each entry: the decision as it stands, why it's being questioned, and current status. Entries that have been settled move to [Decided](#decided) at the bottom, with the reasoning kept — a decision is only useful later if the argument behind it survives with it.

## Open

### The ARIA structure rules only evaluate containers that carry an explicit `role`

**Decision as it stands:** `aria-required-children`, `aria-prohibited-children` and `aria-required-parent` all key their applicability off `getExplicitRole(el)` — an element with no `role=""` attribute is never evaluated as a container, however clear its native semantics.

**Why it's being questioned:** ACT `bc4a75`'s failed-example 10 is `<ul><div></div><div></div></ul>`. A `<ul>` has the implicit `list` role, `<div>` resolves to `generic`, and `generic` is not among `list`'s required owned elements, so ACT fails it. Our rules report `notApplicable`: there is no `role` attribute anywhere in that markup to key off. The same blind spot covers every native container the engine already knows about — `<ul>`/`<ol>` (`list`), `<table>` (`table`), `<select>` (`listbox`/`combobox`), `<dl>` — and native markup is where these structures usually come from, so the rules are strictest exactly where authors already used ARIA and silent where they didn't.

**Why this hasn't been changed yet:** `getContainmentRole` (`src/core/aria-helpers.js`) already resolves the native side of this for *children*, so the missing piece is applicability, not role resolution — but turning it on makes every `<ul>`, `<table>` and `<select>` on every page a container under test, which is a large behavior change on real-world markup. The two entries it was waiting on (the native-role table's missing HTML-AAM context requirements, and the "any match" vs. "all owned" question) are both settled as of 2026-08-19, so nothing blocks it now except its own blast radius. It is also the last thing between the engine and a clean `bc4a75`: ACT's failed example 10, `<ul><div></div><div></div></ul>`, is an implicit `list` owning generic children and is the one remaining mismatch on that rule.

**Status:** open, unresolved as of 2026-08-19.

### `label-in-name` compares against accessibility-tree text, where ACT uses *visible* inner text

**Decision as it stands:** `label-in-name.js` builds the element's visible label from text nodes whose parent is accessibility-tree eligible, which drops `aria-hidden` subtrees and keeps text that CSS has hidden visually. The `aria-hidden` half is deliberate and reasoned in the rule's own comment: an `<i aria-hidden="true">` icon-font ligature renders as a glyph, not as the literal word in the DOM, so counting its text would flag every icon-only button named by `aria-label`.

**Why it's being questioned:** ACT `2ee8b8` is explicit that its "visible inner text" is a rendering property, not an accessibility-tree one, and three of its examples turn on the difference: `<a aria-label="Download specification">Download <span aria-hidden="true">gizmo</span> specification</a>` fails ACT (the word "gizmo" is on screen, whatever `aria-hidden` says) and passes here; a `clip-path: inset(50%)` visually-hidden span passes ACT (nothing is rendered) and fails here; and `<div style="display: inline">` children concatenate into one word for ACT ("ACT" from three inline divs) while we read them apart. All three point the same way — the label a sighted user speaks comes from what is painted, not from what the accessibility tree carries. The icon-font case the current behavior was built for is real, but `aria-hidden` is a coarse stand-in for it: the attribute says "don't expose this", not "this doesn't render as words".

**Why this hasn't been changed yet:** "visible inner text" needs a real rendering model — per-node `display` resolution for the concatenation rule, plus the visually-hidden detection (`clip-path`, `clip`, 1px boxes, off-screen positioning) the engine's offscreen heuristic only partly covers. It's a shared-helper change with reach beyond this rule, and it lands next to the still-open icon-font question below, which is about the same expectation text.

**Status:** open, unresolved as of 2026-08-19.

### `img-alt-decorative` only considers `<img alt="">`, missing `aria-hidden`/`role=none` images and every svg/canvas case

**Decision as it stands:** `src/checks/manual/img-alt-decorative-manual.js` is hard-scoped to a CSS selector matching only `img[alt=""]`/`img[alt^=" "]`/`img[alt$=" "]` — i.e. an `<img>` already marked (or nearly marked) decorative via `alt`.

**Why it's being questioned:** ACT `e88epe`'s own applicability, fetched directly, is much broader: "any `img`, `canvas` or `svg` element that is visible and" excluded from the accessibility tree by *any* mechanism — `aria-hidden`, `role="none"`/`"presentation"`, an `svg` with `role="graphics-document"` and an empty name, or a `canvas` with no explicit role and an empty name — asking the reviewer to confirm the hidden element really is purely decorative (the rule explicitly notes the common "icon marked decorative because its text alternative sits next to it" pattern, which is a *valid* conforming case, not an automatic pass/fail either way — genuinely a `cantTell` question). All 4 of ACT's own failed-example test cases for this rule use `aria-hidden="true"`, `role="none"`, an unlabeled decorative `<svg>`, and an unlabeled `<canvas>` drawn via script — none of which our current selector reaches at all.

**Why this hasn't been changed yet:** not a narrow selector tweak — needs new logic for 4 different "excluded from the accessibility tree" mechanisms across 3 element types, plus real thought about false-positive noise: a huge fraction of `aria-hidden` icons on the real web are legitimately decorative, so widening the selector naively risks flagging a large fraction of ordinary icon usage for manual review, drowning out the cases that actually need a human look.

**Status:** open, unresolved as of 2026-08-19.

### No rule covers `role="graphics-symbol"`/`"graphics-document"` on an SVG descendant, only the `<svg>` root itself

**Decision as it stands:** `svg-text-alternative-present.js`'s own header comment already states: "Deliberately does NOT extend to arbitrary `role="graphics-symbol"` descendants nested inside an `<svg>` — this check's scope is the `<svg>` root only." `role-img-text-alternative-present.js` is scoped to `role="img"` only, not `graphics-symbol`/`graphics-document`.

**Why it's being questioned:** ACT `7d6734`'s applicability is "any SVG element with an explicit role of img, graphics-document, or graphics-symbol" — "SVG element" meaning any element in the SVG namespace, not just the root `<svg>` tag; `graphics-symbol` is specifically meant for descendant shapes (ACT's own failed test case: `<svg><circle role="graphics-symbol" .../></svg>`, a root `<svg>` with no role at all, but a descendant circle carrying the role). Neither existing rule reaches this.

**Why this hasn't been changed yet:** this is a real, if narrow, feature addition — a new selector for `role=img`/`graphics-symbol`/`graphics-document` anywhere in the SVG namespace, plus accessible-name computation for arbitrary SVG shape elements (which don't have the same native-tag semantics `<svg>` itself does) — not a quick extension of either existing rule's scope.

**Status:** open, unresolved as of 2026-08-19; already self-acknowledged as out of scope in `svg-text-alternative-present.js`'s own comment before this pass.

### `label-in-name` has no exemption for icon-font glyphs or icon-standing-in characters

**Decision as it stands:** `label-in-name.js` does a literal text-containment check between an element's visible text and its accessible name, with no exemption for visible text that is actually rendering as an icon rather than readable text.

**Why it's being questioned:** ACT `2ee8b8`'s own expectation text includes an explicit carve-out: visible text must be contained in the accessible name "except for characters in the text nodes used to express non-text content." Its own two failed-example fixes: `<button aria-label="close">X</button>` (a visible "X" glyph standing in for a close icon — ACT: "the 'x' text node is non-text content") and `<button aria-label="Find">search</button>` styled with an icon font (`font-family: 'Material Icons'`) that remaps the literal word "search" to render as a magnifying-glass glyph — the DOM text says "search" but nothing readable actually renders.

**Why this hasn't been changed yet:** needs two distinct heuristics, of different reliability: (a) icon-font detection via a curated `font-family` name list — tractable, same class of curated-list tradeoff as `link-name-quality`'s phrase list; and (b) a policy for short/symbolic glyph-only visible text in general — much fuzzier, with real risk of wrongly exempting a genuine one-word label if done carelessly. Needs its own deliberate design pass, not a quick patch.

**Status:** open, unresolved as of 2026-08-19.

### `valid-lang`'s applicability doesn't resolve which text actually inherits a given `lang` attribute

**Decision as it stands:** `valid-lang.js` applies to any non-root element carrying a non-empty `lang` attribute, unconditionally, and validates that attribute's value as a language tag.

**Why it's being questioned:** ACT `de46e4`'s applicability is narrower and more precise: it applies only when "there is some text inheriting its programmatic language from the element which is neither empty nor only whitespace." Three concrete gaps this exposes, each confirmed against a mismatching ACT test case: (a) an invalid `lang` on an element whose entire text content is re-scoped by a nested descendant's own (valid) `lang` attribute has no text actually governed by the invalid value, so it should pass, not fail; (b) `alt` text on a descendant counts as "governed text" too, which the current rule doesn't consider at all (a `lang`-only wrapper around an `<img alt="...">` with no other text is currently skipped as inapplicable, when it should be evaluated); (c) text that's present but not rendered/exposed (`display:none`) doesn't count as governed text either, and currently isn't excluded.

**Why this hasn't been changed yet:** a real three-part applicability rewrite (ownership resolution through nested `lang` scopes, treating `alt` as governed text, and a visibility gate), not a one-line fix — though the visibility-gate piece (c) is the most contained of the three and could reasonably land on its own if only partial progress is wanted.

**Status:** open, unresolved as of 2026-08-19.

## Decided

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
