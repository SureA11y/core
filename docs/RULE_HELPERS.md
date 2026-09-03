# RULE_HELPERS.md — `ctx.helpers` Reference (Canonical, repo-derived)

This is the full reference for `ctx.helpers`, the object every rule's `runInPage(ctx)`
receives (`const { helpers } = ctx`, per [`RULE_AUTHORING.md`](./RULE_AUTHORING.md) §6).
It exists because that doc's own helpers section only calls out the dozen or so most
common ones — the underlying object (`createDomHelpers()` in `src/core/dom-helpers.js`)
exports around 35, and several of them replace logic a new rule would otherwise
duplicate (often incorrectly — see the naming helpers below).

Read [`RULE_AUTHORING.md`](./RULE_AUTHORING.md) first for the rule contract itself
(module shape, `runInPage` constraints, occurrence reporting). This doc only covers
what each helper does and when to reach for it.

All helpers below are called as `helpers.<name>(...)` from inside `runInPage`. None of
them may be assigned to a module-scope variable and closed over — same
serialization constraint as everything else in `runInPage` (§1 of `RULE_AUTHORING.md`).

---

## 1) Query & traversal

### `queryAll(selector)` → `Element[]`
Plain `querySelectorAll(selector)` across the resolved context root(s), deduped, with
self-match included (a root element matching `selector` itself is returned, which
`querySelectorAll` alone never does). Light DOM only.

### `queryAllDeep(selector)` → `Element[]`
Same as `queryAll`, but also descends into open shadow roots (BFS over discovered
`shadowRoot`s). Ignores `includeShadowDom`/hidden-content policy — it's the raw
traversal `queryAllSmart` builds on.

### `queryAllSmart(selector)` → `Element[]`
**The one almost every rule should use.** Honors `engineOptions.includeShadowDom`
(shadow-aware by default), applies the default hidden-content policy (filters out
`display:none`/`hidden`/etc. unless `includeHiddenElements:true`), and applies any
rule-scoped `excludeSelectors`. See `RULE_AUTHORING.md` §6.1 — write rules assuming
open shadow roots are in scope and let this helper honor the caller's choice.

```js
const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('img') : helpers.queryAll('img');
```

### `composedParent(node)` → `Node | null`
One step up the *flat tree*: `assignedSlot` first (a slotted node's rendered parent is
its slot, not its light-DOM `parentNode`), then `parentNode`, then `.host` once you're
at a `ShadowRoot`. Use this instead of `parentNode`/`closest` for any ancestor walk that
must work correctly across shadow boundaries and slots.

### `buildSimpleSelector(el, fallbackTag)` → `string`
A short, non-unique selector for an element: `#id`, else a `data-testid`/`data-test`/
`data-cy`/`data-qa` attribute selector, else `tag[name="..."]`, else just the tag name.
Cheap; not guaranteed unique. Prefer `reportOccurrence` (§6 below) over building
selectors by hand — see the perf note there.

### `buildSelector(el)` → `string`
The engine's real, best-effort-unique CSS selector builder (cached per element per
run). Used internally by `reportOccurrence`'s finalization; rules generally don't need
to call this directly.

### `getOuterHtmlSnippet(el)` → `string`
`el.outerHTML`, truncated to 2000 characters (with a trailing `…`) and cached per
element per run. `reportOccurrence` (§6 below) already fills in an occurrence's `html`
from the reported element, so most rules never call this directly — it's for the rare
case where a rule needs the HTML snippet itself, not just an occurrence carrying it.

### `isExcluded(el)` → `boolean`
Whether `el` matches the currently effective `excludeSelectors` (global config ∪ the
active rule's own `engineOptions.rules[ruleId].excludeSelectors`), via `closest()`.
`queryAllSmart` already applies this filtering for you; reach for `isExcluded` directly
only if a rule walks the DOM some other way (e.g. following `composedParent`) and still
needs to respect exclusions on nodes found off that path.

### `buildStructuralPath(node, selector)` → `number[] | null`
Sibling-index path from the document root to `node` (or, given only a `selector`,
re-resolves the element first — the same fallback `reportOccurrence` triggers, and the
same one `perfStats.counters['structuralPath.selectorFallback']` counts, per
`RULE_AUTHORING.md` §4.3). Rules don't normally call this either — it's what backs
`selector`/`structuralPath` finalization for reported occurrences.

---

## 2) Eligibility & visibility

These answer "is this node in scope" from different angles. They are easy to reach for
the wrong one, so the distinctions matter:

### `isAccTreeEligible(node)` → `{ eligible, reasons[] }`
Whether a node is eligible for the accessibility tree, per an ordered set of checks
(display/visibility, `hidden`, `inert`, closed `<details>`, template content, etc.).
Deliberately keeps a focusable-but-`aria-hidden` element *eligible* — see the header
comment on `isIncludedInAccessibilityTree` below for why.

### `isIncludedInAccessibilityTree(el)` → `boolean`
The narrower question most accessible-name rules actually want: `isAccTreeEligible`,
minus anything eligible only because of an `ariaHiddenOverridden*` reason. ACT scopes
name-computation rules (button-name, link-name, etc.) to elements genuinely included in
the accessibility tree; a focusable element hidden by `aria-hidden` is a real
issue, but it's `aria-hidden-focus`'s issue (WCAG 4.1.2), not a naming rule's — so
naming rules should check this, not `isAccTreeEligible`, to avoid double-flagging the
same element under the wrong rule.

### `isDomVisibleEligible(node, ctx, opts)` → `{ eligible, reasons[], metrics }`
Style/geometry-only visibility (not accessibility-tree membership): `display`,
`visibility`, size/position, opacity, etc. `opts.visibilityMode` (`'styleOnly'` |
`'styleAndGeometry'`), `opts.disableGeometry`, `opts.ignoreOpacity` tune what's checked.
Use when a rule cares about visual rendering specifically, not AT exposure.

### `getEligibilityInfo(node, ctx, opts)` → `{ eligible, reasons[], targetSet, accEligible }`
A single wrapper choosing between the two above via `opts.targetSet` (`'acc'` |
`'dom'`, default `'dom'`). **This is also the shape `RULE_AUTHORING.md` §7 requires every
occurrence to carry** as `data.visibilityFilter` — call this once per element and pass
its result straight through.

### `getVisibilityHintsInfo(el, ctx, opts)` → `{ hints[], metrics, flags[] }`
Style-only visibility *hints* for triage/diagnostics (`opacityZero`, `clipped`, etc.) —
explicitly does **not** decide eligibility; a rule's own logic still owns the outcome.

### `isWholeDocumentScope()` → `boolean`
`true` unless `engineOptions.fragment: true` was set, or `contextSelector` scoped the
run narrower than the whole document. Required for any rule checking a page-wide,
one-per-document property (`<title>`, `<html lang>`, landmark structure) — gate it with
an `applicability(ctx)` export using this, per `RULE_AUTHORING.md` §4.2/§11.2, or the
rule will wrongly fault a scoped subtree for lacking something it was never meant to
have.

### `hasTruncatedAncestorWalk` (internal)
Backs confidence scoring during result normalization when a 200-step ancestor walk
didn't reach the root. Not something a rule calls directly.

---

## 3) Accessible naming & labeling

Naming is layered — each function below builds on the ones above it — and several exist
specifically to replace a naive reimplementation that gets an edge case wrong. Reach for
the highest-level one that answers your actual question before dropping to a primitive.

### `getAriaLabelInfo(el)` → `{ present, value, mechanism, flags[] }`
Just `aria-label`, trimmed, presence-checked.

### `getAriaLabelledByInfo(el, ctx, opts)` → `{ present, value, mechanism, refsCount, missing[], flags[] }`
Resolves `aria-labelledby` through `getTextFromIdRefs` (recursive, accname-aligned — see
§4 below), not raw `textContent`.

### `getAriaNameInfo(el, ctx, opts)` → `{ present, value, mechanism, flags[] }`
ARIA-only name with correct precedence: `aria-labelledby` (if it resolves non-empty)
wins over `aria-label`. Use this rather than checking the two attributes yourself when
you specifically want "does ARIA name this," excluding native `<label>`/content/title.

### `getLandmarkNameInfo(el, ctx)` → `{ present, value, mechanism, flags[] }`
Landmark-role naming (`nav`/`main`/`region`/`banner`/`contentinfo`, etc.): ARIA name,
then `title` — landmark roles don't get a name from content, and `title` must be
included or two landmarks distinguished only by `title` both read as unnamed and get
flagged as duplicates. Shared by all 7 landmark rule files; use this rather than
reimplementing landmark naming in a new landmark rule.

### `getAccessibleNameInfo(el, ctx, opts)` → `{ present, value, mechanism, flags[] }`
The general-purpose accessible name: ARIA name → native `<label>` association → `alt`
(image-like elements) → `title` (flagged `title-used` — see the policy note in the
source; `title` is accepted per spec but is a weak mechanism in practice). This is what
almost every naming rule should call.

### `getAccessibleDescriptionInfo(el, ctx, opts)` → `{ present, value, mechanism, flags[] }`
`aria-describedby` (via `getTextFromIdRefs`), then optionally `title` if
`opts.allowTitle === true`.

### `getTextAlternativeInfo(el, ctx, opts)` → `{ present, value, mechanism, requiredMechanism, flags[] }`
Mechanism-aware text alternative for elements with a *specific required* mechanism:
`alt` for `img`/`area`/`input[type=image]` (missing `alt` is flagged even when an
accessible name exists elsewhere — that's still a real alt-text violation), fallback
content or ARIA/`title` for `<canvas>`. Use this for alt-text-shaped rules, not
`getAccessibleNameInfo`, when the rule cares which mechanism was used, not just whether
a name exists.

### `getContentNameInfo(el, ctx, opts)` → `{ present, value, mechanism, flags[] }`
Recursive "name from content" (accname step 2F): walks children using each child's
*own* accessible name (not just literal text), so `<a href="…"><img alt="Company
Name"></a>` and `<button><span aria-label="Close"></span></button>` both name correctly.
A plain `TreeWalker(SHOW_TEXT)` walk misses both.

### `getAssociatedLabelElements(el)` → `Element[]`
Real `<label>` element(s) associated with `el` — a `<label for="id">` pointing at it,
plus a wrapping `<label>` whose first labelable descendant it is. **Does not call the
native `.labels`/`.control` API** — in this project's supported jsdom runtime,
`.labels` is an expensive whole-document walk per element (`.control` resolution is
another one), which used to dominate whole-engine runtime on form-heavy pages. Use this
whenever a rule needs the actual label element(s), not just a yes/no.

### `labelContributesAccessibleName(labelEl)` → `boolean`
Whether a `<label>` element itself carries text that would name its control: own
ARIA name, else rendered content (`getContentNameInfo`, so `aria-hidden`/`display:none`
descendants are correctly excluded), else its own `title`. Shared by
`form-control-single-label` and `form-control-programmatic-label-present` so they agree
on what "a label with content" means.

### `getLabelMethod(el, ctx, opts)` → `{ method, value }`
Which mechanism actually labels `el` — `'label'` | `'aria-labelledby'` |
`'aria-label'` | `'title'` | `'placeholder'` | `'none'` — checked in that precedence
order.

### `getLabelStrength(method)` → `'strong' | 'medium' | 'weak' | 'none'`
Policy classification of a `getLabelMethod` result (`label`/`aria-labelledby` →
strong, `aria-label` → medium, `title`/`placeholder` → weak). Deterministic and
intentionally tweakable in one place rather than per rule.

### `hasAccessibleName(el)` → `boolean`
Back-compat convenience: `!!getAccessibleNameInfo(el).value`.

---

## 4) IDREF resolution

Backs `aria-labelledby`/`aria-describedby` and any other space-separated ID-reference
attribute.

### `resolveIdRefs(idrefString, ctx, opts)` → `{ refs: Element[], missing: string[], flags[] }`
Splits and resolves a space-separated ID list to elements (deduped, cached per scope).
`opts.maxRefs` truncates deterministically (adds `'truncated'` to `flags`).

### `getTextFromIdRefs(idrefString, ctx, opts)` → `{ text, refsCount, missing[], flags[] }`
Resolves refs, then computes **each target's own text alternative** recursively
(accname-aligned — a referenced element's name is recomputed, not read as raw
`textContent`), joins with spaces. This is what `getAriaLabelledByInfo`/
`getAccessibleDescriptionInfo` call internally.

### `getTextFromIdRefsIdrefEligible(idrefString, ctx, opts)` → `{ text, refsCount, missing[], excluded[], flags[] }`
Same, but under IDREF eligibility rules specifically: hidden/`aria-hidden`/collapsed
targets are still included (IDREF targets aren't scoped by visibility the way rendered
content is — see the `root` note in the source), only `inert` targets are excluded.
`excluded` lists `{ id, reasons }` for anything dropped.

---

## 5) Role & focusability

### `getRoleInfo(el, ctx, opts)` → `{ role, source, flags[] }`
Explicit `role` attribute if present (flags `'presentation'` for
`presentation`/`none`, `'multiple-roles'` if it contains whitespace), else a small,
deliberately minimal implicit-role mapping (`a[href]`→`link`, `button`→`button`,
`input[type=checkbox]`→`checkbox`, etc.) unless `opts.disallowImplicit`.

### `getFocusableInfo(el, ctx, opts)` → `{ focusable, tabbable, mechanism, flags[] }`
Platform focusability: whether `el` can receive focus at all, and whether it's in the
default tab order.

### `hasLandmarkScopingAncestor(el, ctx)` → `boolean`
Whether `el` sits inside a landmark-scoping ancestor — the role-aware
sectioning-content/`<main>` check backing `<header>`/`<footer>`/`<aside>`'s conditional
implicit roles (their implicit landmark role only applies when *not* nested inside
certain ancestors). Available both as `helpers.hasLandmarkScopingAncestor` and
`helpers.aria.hasLandmarkScopingAncestor` — same function, re-exported at the top level
so landmark-check files don't need to reach into `aria.*` for it.

---

## 6) Attributes, language, reporting, outcomes

### `getAttributeInfo(el, attrName)` → `{ present, value, mechanism, flags[] }`
Generic trimmed-attribute presence/value check. Use for any plain attribute a rule
inspects directly (not one of the naming/ARIA attributes above, which have their own
dedicated helpers).

### `isValidLanguageTag(value)` / `isRegisteredLanguageSubtag(subtag)` → `boolean`
BCP 47 well-formedness **plus** a real IANA subtag-registry check — shape alone accepts
`"eng"` or `"em-US"`, which look like language tags but use an unregistered primary
subtag (the registry only lists a three-letter subtag when no two-letter one exists,
so `"en"` is registered and `"eng"` is not). Use `isValidLanguageTag` for any
`lang`/`xml:lang`-checking rule instead of a regex-only check.

### `reportOccurrence(node, partial)` → occurrence object
**Use this to build every occurrence.** Attaches the element so the engine fills in
`selector`, `html`, and `structuralPath` centrally — see `RULE_AUTHORING.md` §4.3/§9 for
the full contract and why hand-building these fields yourself is a real (measured:
4 min → <1 s) performance regression on any rule reporting many occurrences.

```js
occurrences.push(helpers.reportOccurrence(el, {
  summary: '…',
  hint: '…',
  i18n: { summaryKey: '…', hintKey: '…', params: { element: 'img' } },
  data: { visibilityFilter: eligInfo }
}));
```

### `resolveTieredOutcome(failOccurrences, cantTellOccurrences, severity)` → `{ outcome, severity, occurrences }`
For a rule that collects two confidence tiers in one run — some findings confident
enough for `fail`, others only `cantTell` ("needs human review"). Returns `fail` (with
**both** tiers' occurrences, tagged via `occurrenceOutcome`) whenever any fail-tier
finding exists, `cantTell` when only cantTell-tier findings exist, `pass` otherwise.
Reach for this instead of the naive `if (fails.length) return fail(fails); else if
(cantTells.length) return cantTell(cantTells);`, which silently drops every cantTell
finding whenever at least one fail finding also exists on the page.

### `getPerfStats()` / `resetPerfStats()`
Only populated when the engine is run with `perfStats: true`. Not for rule logic —
useful when profiling a new rule's hot paths during development.

---

## 7) Namespaced helper groups

Two larger helper sets are exposed as namespaces rather than flattened, since their
member counts and internal cohesion (contrast math, ARIA validity data) don't fit the
flat `helpers.*` list above:

### `helpers.contrast.*`
Color/contrast math and text-run analysis: `parseCssColorToRgba`, `compositeRgba`,
`relativeLuminance`, `contrastRatio`, `requiredRatio`, `isLargeText`,
`computeEffectiveForeground`/`computeEffectiveBackground`, `getComputabilityBlocker`,
`getTextScan`, `isInactiveUiComponent`, plus small numeric/formatting utilities
(`clamp01`, `round2`, `toHex2`, `pxToPt`, `fontWeightLabel`, …). Backs the
`contrast-*` rule family (`contrast-minimum`, `contrast-enhanced`,
`contrast-computable`) — see `src/core/contrast-helpers.js` if you're extending that
family specifically.

### `helpers.aria.*`
ARIA validity/taxonomy data and checks: `isValidAriaAttrName`, `getAttrValueType`,
`validateAttrValue`, `getExplicitRole`, `getAllRoleTokens`, `isAbstractRole`,
`isDeprecatedRole`, `isAuthorDiscouragedRole`, `isAuthorProhibitedRole`,
`isDeprecatedAttr`, `getDeprecatedRoleGuidance`, `isKnownRole`, `isValidConcreteRole`,
`getRequiredAttrsForRole`, `getRequiredOwnedRoles`, `getRequiredContextRoles`,
`isRoleAllowedOnElement`, `getContainmentRole`, `getNativeRoleForElement`,
`hasLandmarkScopingAncestor` (also re-exported flat, see §5). Backs the whole
`aria-*` rule family — check here before hand-rolling role/attribute validity logic in
a new ARIA rule.

---

## 8) Not for rule use

`helpers.__setActiveRuleExcludeSelectors` exists on the object but is engine-internal —
`dom-runner.js` calls it before invoking each rule to scope that rule's
`engineOptions.rules[ruleId].excludeSelectors`. A rule itself never calls it.
