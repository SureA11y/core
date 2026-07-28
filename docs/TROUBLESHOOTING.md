# Troubleshooting / FAQ

## "I passed `runOnly: ['some-rule-id']` but every rule still ran"

`runOnly` must be an object, not a bare array — `runOnly: ['img-alt-present']` is silently ignored (the engine falls through to "run everything"), because that shape has none of the fields the engine actually checks (`includeRuleIds`, `tags`, etc.). This is easy to get wrong if you're coming from another engine that does accept a bare array.

Fix:

```js
runOnly: { includeRuleIds: ['img-alt-present'] }
```

See [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#via-runonly-4th-argument) for the full shape.

## "My custom rule always returns `cantTell` with no clear reason"

Check the result's `error` field first — if it says `"<something> is not defined"`, your `runInPage` references a variable from outside the function body (a module-scope `const`, an imported helper, anything not reached through `ctx.*`). This is a real, common footgun: `runInPage` is serialized to source text and re-evaluated later in the page context, so **the build never catches this — only running the rule does**, and the failure looks like a normal (if uninformative) result, not a crash. See [`RULE_AUTHORING.md`](./RULE_AUTHORING.md) §1.1 for the full explanation and the fix (move the value inside `runInPage`, or route it through `ctx.rule`/`ctx.helpers`).

## "A geometry-dependent rule (e.g. `target-size-minimum`) always says `notApplicable`"

Plain jsdom (no real browser) doesn't implement CSS layout — `getBoundingClientRect()` always returns zero geometry. Rules that need real layout deliberately report `notApplicable` under jsdom rather than guess. Run through a real browser instead (Puppeteer/Playwright — see [`INTEGRATION.md`](./INTEGRATION.md) Pattern 2) to get real findings from these rules. See [`LIMITATIONS.md`](./LIMITATIONS.md).

## "I only see `fail`/`cantTell` occurrences — where's the list of elements that passed?"

By design, this engine never enumerates the elements a rule *passed* — only the ones it flagged. A rule's overall `outcome: 'pass'` means "applicable target(s) existed and none were flagged," but `occurrences` is `[]` either way. If you need to know which specific elements were checked and considered fine, that's not currently exposed — see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#an-occurrence-occurrencesi).

## "A rule I expected to fire returned `notApplicable` / found nothing on a page I know has the issue"

Two common causes, in order of likelihood:

1. **The element is excluded from the accessibility tree** — `aria-hidden="true"`, `display: none`, `visibility: hidden`, `hidden`, or an `inert` ancestor. Most rules deliberately skip content that's already invisible to assistive technology (checking a hidden element would be meaningless, and could produce a misleading `fail` on content no user encounters). Some rules explicitly opt out of this gating when it wouldn't make sense to (e.g. `no-autoplay-audio` — hidden audio still plays sound) — check the specific rule's file header comment (`@applicability`) in `src/checks/`.
2. **`excludeSelectors`** — if you've configured this (directly or inherited from a shared config), confirm the element in question isn't matched by it.

## "Does a clean scan (`pass` everywhere) mean the page is WCAG conformant?"

No — see [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md). A `pass` means every *automatable* check came back clean. A meaningful fraction of WCAG requires human judgment (accurate alt text, understandable error messages) or dynamic testing this engine's architecture can't do at all (keyboard traps, reflow at zoom) — see [`LIMITATIONS.md`](./LIMITATIONS.md) for the explicit, non-exhaustive-on-purpose list.

## "Should I treat `cantTell` as a failure?"

Treat it as "needs a human to look" — it's neither pass nor fail by design. Most teams log `cantTell` findings without failing CI on them, since failing a build on something the engine explicitly couldn't determine tends to train people to ignore the gate. See [`POLICY.md`](./POLICY.md) if you want to reshape this behavior (e.g. via a custom policy contract), and [`INTEGRATION.md`](./INTEGRATION.md#ci-gating-a-build-on-the-result) for a concrete CI-gating example.

## "What happens if a locale is only partially translated?"

Missing keys fall back to English per-string (never a blank or broken result), so a partial locale degrades gracefully rather than failing outright — see [`I18N.md`](./I18N.md) for the mechanism and current coverage. Both shipped locales (`en`, `fr`) are at full parity as of this writing, but that's not guaranteed to stay true automatically: adding a new rule adds a new key to `en.js`, and unless the same key is added to `fr.js` (or any other locale file you maintain), that string falls back to English until it is.

## "`runDomRulesInPage` vs `runa11yCoreInPage` — which one do I want?"

`runDomRulesInPage` if you're calling it directly in the same Node process (jsdom, browser-extension content script). `runa11yCoreInPage` if you're handing the *function itself* to a different JS realm — almost always `page.evaluate` in Puppeteer/Playwright, which serializes the function to source text and re-runs it inside the browser tab (which has no access to your Node module scope). See [`INTEGRATION.md`](./INTEGRATION.md) for both patterns worked out in full.
