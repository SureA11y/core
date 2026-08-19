# Design challenges

A running log of engine design decisions worth re-examining — cases where an existing choice turned out to conflict with a ground-truth source (usually the W3C ACT rules test corpus), or just looks questionable on a second look. Not all of these are bugs; some are deliberate tradeoffs that deserve a second opinion before being either confirmed or overturned. Each entry: the decision as it stands, why it's being questioned, and current status.

## Open

### `aria-required-children` uses "at least one acceptable owned role anywhere in the subtree", not ACT's stricter "only acceptable roles, recursively through group wrappers"

**Decision as it stands:** `src/checks/automatic/aria-required-children.js` treats a container role's "required owned elements" check as satisfied by finding *any single* matching descendant anywhere in the full subtree. The header comment states this is deliberate: "any one qualifying descendant/owned element satisfies the requirement... the full subtree is scanned without excluding nested containers with their own differing role, favoring simplicity — this can only under-report (recall), never over-report."

**Why it's being questioned:** Validating against ACT rule `bc4a75`'s own test corpus, its Expectation text reads: *"Each test target only owns elements with a semantic role from the required owned element list for the test target's semantic role."* That's an **exclusive/ALL check**, not an "at least one" check — and ACT's group-transparency rule recurses it: a `group` wrapper is transparent, but everything *that group in turn owns* must also be checked against the same acceptable-role list.

Concretely, ACT's own failed-example 7 is:
```html
<div role="menu">
  <div role="group">
    <span role="menuitem">Item 1</span>
    <div role="group">
      <span role="treeitem">Item 1</span>
      <span role="treeitem">Item 2</span>
    </div>
  </div>
</div>
```
`menu`'s required-owned set includes `group`/`menuitem`/etc. The outer group directly owns a valid `menuitem` — under our current "any match anywhere" logic this passes. But ACT fails it: the outer group *also* owns a nested `group`, and that nested group's own owned elements (`treeitem`, `treeitem`) are not in the acceptable set, so the chain is invalid *despite* the sibling `menuitem` being fine. The comment on ACT's page is explicit: "ARIA group roles are allowed to own other elements with a group role, but those nested group nodes must still meet the requirements."

This is the exact inverse of what our header comment claims about the tradeoff ("can only under-report, never over-report") — the real-world effect is the opposite: our rule will **miss real violations** whenever a container has a mix of valid and invalid owned elements, or an invalid item buried a level deeper than a valid sibling. A `role="list"` with one real `role="listitem"` plus a stray `role="button"` direct child would pass today; ACT says it should fail.

**Why this hasn't been changed yet:** this is a real algorithm rewrite, not a narrow patch — moving from "scan the whole subtree for one match" to "walk the semantic-owned-children graph (direct children + group-transparent recursion, not arbitrary-depth descendants) and require every node in that graph to be acceptable" changes behavior broadly, including on real-world pages that mix valid/invalid owned content today. It could flip a meaningful number of currently-passing pages to failing. Needs a deliberate look (and probably a fixture pass) before landing, not a quick fix buried in a larger triage sweep.

**Status:** open, unresolved as of 2026-08-19. `aria-prohibited-children.js` (the sibling rule) already implements the correct "boundary" concept — an owned entry that's a real (non-transparent) node stops the walk, including a roleless-but-globally-ARIA-attributed one — and would be the right model to port from.

### `NATIVE_CONTAINMENT_ROLE_BY_ELEMENT` gives several native tags an unconditional implicit role, ignoring HTML-AAM's context requirement

**Decision as it stands:** `src/core/aria-helpers.js`'s `NATIVE_CONTAINMENT_ROLE_BY_ELEMENT` table (used by `getContainmentRole`, the shared engine for `aria-required-parent`/`aria-required-children`/`aria-prohibited-children`) maps `li → listitem`, `tr → row`, `td → cell`, `th → columnheader`, `thead/tbody/tfoot → rowgroup`, `option → option` unconditionally — regardless of what actually contains the element.

**Why it's being questioned:** per HTML-AAM, several of these are *context-dependent* implicit roles: `<li>` is only `listitem` when it's a descendant of `<ul>`, `<ol>`, or `<menu>`; `<option>` only has its implicit role inside `<select>`/`<datalist>`/`<optgroup>`; `<tr>`/`<td>`/`<th>`/`<thead>`/`<tbody>`/`<tfoot>` only get their table-family roles inside an actual table context. Outside that native-parent context, the element has no implicit role at all (effectively `generic`).

Confirmed via ACT `bc4a75` failed-example: `<div role="list"><li>Item 1</li><span role="link">Item 2</span></div>` — ACT expects this to **fail** (the `<li>` isn't inside a real `<ul>`/`<ol>`/`<menu>`, so it has no implicit `listitem` role, so `list` has no valid owned element at all), but our engine currently treats the bare `<li>` as `listitem` unconditionally and passes it.

**Why this hasn't been changed yet:** contained blast radius (only 3 consumers: the two ARIA structure rules above and `aria-prohibited-children`), but a real fix needs a native-parent-context check per tag (not a single flag), and should land as its own change with fixture coverage, not folded into an unrelated fix.

**Status:** open, unresolved as of 2026-08-19.

### `aria-allowed-attr` only checks elements with an *explicit* `role` attribute, skipping native/implicit-role elements entirely

**Decision as it stands:** `src/checks/automatic/aria-allowed-attr.js` is deliberately scoped to elements carrying an explicit `role="..."` attribute; its header comment says: "Only evaluated for elements with an explicit role, since the global set already covers implicit-role elements without asserting anything role-specific; scope kept deliberately narrow to avoid false positives on implicit-role ARIA-in-HTML edge cases not modeled here."

**Why it's being questioned:** ACT `5c01ea`'s own failed test case is `<audio src="..." controls aria-orientation="horizontal"></audio>` — no explicit role at all. `<audio>` has no ARIA role mapping, and `aria-orientation` isn't a global ARIA attribute, so this should fail — and does, per ACT. Our rule reports `notApplicable` because there's no explicit `role` attribute to key off of. This is a real, common real-world bug shape (role-specific ARIA attributes stapled onto native elements like `<audio>`, `<input type="text">`, `<img>`, etc. without an explicit role) that the rule currently cannot catch at all, for any native element.

**Why this hasn't been changed yet:** a full fix needs a comprehensive native-tag → implicit-role table for every applicable HTML element (not just the ones a sibling rule already models in `NATIVE_ROLE_BY_ELEMENT_KEY`, which only covers roughly two dozen tags used for `aria-allowed-role`'s override-validity checks and doesn't include `<audio>`/`<video>`/many others) plus careful handling of context-dependent implicit roles (see the entry above) to avoid new false positives. Real scope expansion, not a quick fix.

**Status:** open, unresolved as of 2026-08-19.

### Page-wide duplicate-`id` checking was deliberately skipped once — worth revisiting now that we're chasing ACT gap `3ea0c8`

**Decision as it stands:** `src/checks/automatic/duplicate-id-aria.js` only flags a duplicate `id` when it's referenced by an ARIA ID-reference attribute. Its header comment: "Scoped deliberately to ids referenced by ARIA, not the broader/deprecated page-wide duplicate-id check (see ROADMAP.md's 'Skip' list)." That `ROADMAP.md` no longer exists in the repo (not found in the working tree or as a tracked file in `git log` — likely a local planning doc that was never committed), so the original reasoning behind "skip" isn't recoverable verbatim, only the pointer to it.

**Why it's being questioned:** while mining ACT's gap list (per the user's request to find gaps worth turning into new rules), `3ea0c8` "Id attribute value is unique" is exactly this broader page-wide check, and it's genuinely detectable with a simple, deterministic document-wide scan. Checked ACT's own SC mapping for it: `3ea0c8` maps to **WCAG 4.1.1 Parsing**, which the Working Group formally **removed in WCAG 2.2** (browsers/AT no longer depend on strict-parsing conformance the way they did when that SC was written) — and axe-core deprecated its own equivalent broad `duplicate-id` check around the same time, for the same reason. So the original "skip" call was well-founded *for WCAG 2.2 conformance scoring specifically*.

That said, duplicate IDs are still a real, practical bug independent of which SC currently covers them: they break `<label for>` association, fragment navigation, and any `getElementById`/`querySelector('#...')` call, not just ARIA references — and this engine already supports WCAG-version-scoped tagging (`wcag2a`/`wcag21a`/`wcag22aa`-style tags, see `docs/ENGINE_OPTIONS.md`'s WCAG-version filtering). A page-wide duplicate-id rule could be added and tagged as WCAG 2.0/2.1-only (`wcag411`-style, excluded from WCAG 2.2 tag sets) rather than either fully skipped or wrongly counted against 2.2 conformance — the two options the original either/or "skip" decision didn't have room for.

**Why this hasn't been changed yet:** this reverses (or at least meaningfully qualifies) a previous deliberate call, and the original full reasoning isn't recoverable — surfacing it for a decision rather than silently re-adding what was once deliberately removed.

**Status:** open, awaiting a decision as of 2026-08-19.

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

### `<label for>`/wrapping association is applied to elements that aren't natively labelable, contradicting ACT

**Decision as it stands:** the shared accessible-name helper (`getAccessibleNameInfo` in `src/core/dom-helpers.js`, ~line 2984) falls back to a `label[for]`/wrapping-`<label>` lookup by element `id` for *any* element, not just genuinely labelable native ones (`input`/`textarea`/`select`/`button`/`output`/`meter`/`progress`) — its own comment describes this as deliberate: "fallback for elements where `.labels` isn't natively available, e.g. a non-native-labelable element like `<div role="button" id="x">` still explicitly pointed at by `<label for="x">`." The same pattern is duplicated in `textbox-name-present.js`, `combobox-name-present.js`, `listbox-name-present.js`, `searchbox-name-present.js`, `slider-name-present.js`, and `spinbutton-name-present.js`.

**Why it's being questioned:** ACT `e086e5`'s own test corpus fails a `<label>first name<div role="textbox"></div></label>` (and the `label[for]` equivalent) — a `<div role="textbox">` isn't a native HTML label target, and per HTML, `<label>` only creates a real accessible-name association with labelable elements. `textbox-name-present.js`'s own header comment even states the opposite of what the shared helper does: `role="textbox"` is "name-from-author-only... must NOT fall back to subtree content" — the intent was clearly to be strict here, but the `<label>` fallback undermines it.

**Why this hasn't been changed yet:** this is a widely-shared helper (nearly every accessible-name-dependent rule in the engine goes through `getAccessibleNameInfo`) plus 6 duplicated rule-local copies of the same logic, and the current behavior reads as a deliberate (if ACT-noncompliant) AT-compat leniency choice rather than an oversight — some real screen readers may still announce a `<label for>` pointed at a non-labelable ARIA widget, which is presumably why it was added. Needs an explicit decision (does this engine prioritize strict ACT/spec conformance or real-AT-behavior leniency here?) before touching a helper this central.

**Status:** open, awaiting a decision as of 2026-08-19.

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
