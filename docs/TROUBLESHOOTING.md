# Troubleshooting / FAQ

## "`runOnly` threw: no rule or tag named …, or either rule ids or tags"

Since 1.10.0, `runOnly` given as a bare array or string is read as rule ids or as tags, the way axe-core reads it (see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#via-runonly-4th-argument)). It throws in two cases:

- **A value that names no rule and no tag**, usually a typo: `runOnly: ['img-alt-presnt']`. Check the id against `getChecksCatalog()`.
- **Rule ids and tags in one array**: `runOnly: ['img-alt-present', 'wcag2a']`. Use the object form to combine them:

```js
runOnly: { includeRuleIds: ['img-alt-present'], tags: ['wcag2a'], includeMode: 'or' }
```

Before 1.10.0, a bare array was ignored and every rule ran.

## "My scoped scan reports everything as `notApplicable`", or "`contextSelector` threw: … is not a valid CSS selector"

Since 1.10.0, a `contextSelector` that matches no element scans nothing, and one the browser can't parse throws (see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#contextselector-2nd-runner-argument-not-an-engineoptions-field)).

- **Everything is `notApplicable`**: look at `result.contextMatch`. `elementCount: 0` means the selector matched nothing, and `unmatchedSelectors` names it. Check it for a typo, or whether the element is on the page yet when you scan (content rendered by a script after load, say).
- **The scan threw with `code: 'INVALID_CONTEXT_SELECTOR'`**: the selector in the message, and in the error's `selector`, isn't valid CSS, for example `'#main['` or a `>>>` combinator.

Before 1.10.0, both cases scanned the whole page instead.

## "My custom rule always returns `cantTell` with no clear reason"

Check the result's `error` field first — if it says `"<something> is not defined"`, your `runInPage` references a variable from outside the function body (a module-scope `const`, an imported helper, anything not reached through `ctx.*`). This is a real, common footgun: `runInPage` is serialized to source text and re-evaluated later in the page context, so **the build never catches this — only running the rule does**, and the failure looks like a normal (if uninformative) result, not a crash. See [`RULE_AUTHORING.md`](./RULE_AUTHORING.md) §1.1 for the full explanation and the fix (move the value inside `runInPage`, or route it through `ctx.rule`/`ctx.helpers`).

## "A geometry-dependent rule (e.g. `target-size-minimum`) always says `notApplicable`"

Plain jsdom (no real browser) doesn't implement CSS layout — `getBoundingClientRect()` always returns zero geometry. Rules that need real layout report `notApplicable` under jsdom rather than guess. Run through a real browser instead (Puppeteer/Playwright — see [`INTEGRATION.md`](./INTEGRATION.md) Pattern 2) to get real findings from these rules. See [`LIMITATIONS.md`](./LIMITATIONS.md).

## "I only see `fail`/`cantTell` occurrences — where's the list of elements that passed?"

By design, this engine never enumerates the elements a rule *passed* — only the ones it flagged. A rule's overall `outcome: 'pass'` means "applicable target(s) existed and none were flagged," but `occurrences` is `[]` either way. If you need to know which specific elements were checked and considered fine, that's not currently exposed — see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#an-occurrence-occurrencesi).

## "A rule I expected to fire returned `notApplicable` / found nothing on a page I know has the issue"

Two common causes, in order of likelihood:

1. **The element is excluded from the accessibility tree** — `aria-hidden="true"`, `display: none`, `visibility: hidden`, `hidden`, or an `inert` ancestor. Most rules skip content that's already invisible to assistive technology, since checking a hidden element would be meaningless and could produce a misleading `fail` on content no user encounters. Some rules explicitly opt out of this gating when it wouldn't make sense to (e.g. `no-autoplay-audio` — hidden audio still plays sound) — check the specific rule's file header comment (`@applicability`) in `src/checks/`.
2. **`excludeSelectors`** — if you've configured this (directly or inherited from a shared config), confirm the element in question isn't matched by it. Remember this can also be scoped to a single rule via `engineOptions.rules[ruleId].excludeSelectors` (see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#rule-scoped-excludeselectors)) — if a rule you expect to fire keeps coming back `notApplicable`/`pass` for one element only, check whether that rule specifically has its own exclude list configured, not just the global one.

## "Does a clean scan (`pass` everywhere) mean the page is WCAG conformant?"

No — see [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md). A `pass` means every *automatable* check came back clean. A meaningful fraction of WCAG requires human judgment (accurate alt text, understandable error messages) or dynamic testing this engine's architecture can't do at all (keyboard traps, reflow at zoom) — see [`LIMITATIONS.md`](./LIMITATIONS.md) for the explicit, non-exhaustive-on-purpose list.

## "Should I treat `cantTell` as a failure?"

Treat it as "needs a human to look" — it's neither pass nor fail by design. Most teams log `cantTell` findings without failing CI on them, since failing a build on something the engine explicitly couldn't determine tends to train people to ignore the gate. See [`POLICY.md`](./POLICY.md) if you want to reshape this behavior (e.g. via a custom policy contract), and [`INTEGRATION.md`](./INTEGRATION.md#ci-gating-a-build-on-the-result) for a concrete CI-gating example.

## "What happens if a locale is only partially translated?"

Missing keys fall back to English per-string (never a blank or broken result), so a partial locale degrades gracefully rather than failing outright — see [`I18N.md`](./I18N.md) for the mechanism and current coverage. Key parity is enforced rather than hoped for: `npm run i18n:sync` carries any new or renamed `en.json` key into every other locale file, and the build fails if one is out of step. A key it adds holds the English text until someone translates it, so a locale can be behind on wording without ever being behind on keys.

## "`runDomRulesInPage` vs `runa11yCoreInPage` — which one do I want?"

`runDomRulesInPage` if you're calling it directly in the same Node process (jsdom, browser-extension content script). `runa11yCoreInPage` if you're handing the *function itself* to a different JS realm — almost always `page.evaluate` in Puppeteer/Playwright, which serializes the function to source text and re-runs it inside the browser tab (which has no access to your Node module scope). See [`INTEGRATION.md`](./INTEGRATION.md) for both patterns worked out in full.
