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
