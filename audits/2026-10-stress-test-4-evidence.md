# Stress test 4: evidence for the top findings (2026-10-15)

The [fourth stress test](./2026-10-stress-test-4.md) ranked seven findings as the most important. This file weighs each one before anything is fixed, using the method in [`docs/DESIGN_CHALLENGES.md`](../docs/DESIGN_CHALLENGES.md#method):
1. the code's history;
2. any second implementation of the same concept;
3. WCAG ground truth: the success criterion, its Understanding document and Techniques, the ACT rule, and the HTML/ARIA spec text;
4. what browsers do;
5. other engines;
6. the counter-argument, then a verdict.

**WCAG is the requirement.** Each verdict answers one question: does the markup fail the criterion the rule maps to? Browser behaviour and spec text are evidence of what is programmatically determinable or accessibility-supported. They never decide a verdict on their own. Other engines are one data point, never an authority, and are named only as Engine A, B and C.

**Basis**
- `main` at `3af2008`.
- Chromium 141.0.7390.37, jsdom 29.1.1.
- Engine A 4.14.0, Engine B 4.0.34, Engine C 0.119.0, each run on the same pages in the same Chromium.

**Limits**
- The network blocked w3.org and whatwg.org, so spec quotes come from the specs' source repositories:
  - WHATWG HTML `790ce89` (2026-10-14);
  - w3c/aria and html-aam `79cd9d0` (2026-10-13);
  - w3c/html-aria `9fd6a74`;
  - w3c/wcag `23bad59` (2026-10-04);
  - ACT rules `622e612` (2026-10-14).
- The quotes for RFC 5646 and AccName steps 2A/2B are from memory and are marked unverified.
- The clone used is shallow from `33a175f` (2026-10-10). Older history comes from CHANGELOG and the stress-test-3 audit records.
- Firefox and Safari behaviour comes from browser-compat-data and release notes; their accessibility trees were not inspected.

## At a glance

| # | Finding | WCAG / ACT verdict | Engine verdict | Engines A / B / C | Confidence | Decision needed |
|---|---|---|---|---|---|---|
| 1 | CH-1 customizable `<select>` fails nested-interactive | No failure of 4.1.2. The ACT rule passes the inert button. | **Bug** (false fail) | pass / partly the same mistake / pass | high | Focusable content written inside the select's button |
| 2a | CH-3 names set through `aria*Elements` | Name is programmatically determined, so 4.1.2 / 1.1.1 are met | **Bug** (false fail): should pass | pass / fail / fail | high | none |
| 2b | CH-2 names and states set through `ElementInternals` | Met per WCAG, but the engine can't see it | **Bug**: should be `cantTell`, not pass | fail / fail / fail | high (fail is wrong), medium (scope) | How far `cantTell` reaches; a binding hook |
| 3 | RP-1 policy without `fail` still gives `fail` | Not a WCAG question | **Bug** (breaks POLICY.md) | n/a | high | none |
| 4a | FZ-2 rule order flips verdicts (idref cycle) | Hidden content is not in scope: `notApplicable` | **Bug** (determinism) | n/a | high | Gate the ARIA structure rules on "included in the accessibility tree" |
| 4b | FZ-4 closed popover under jsdom | Closed popover out of scope; opened one in scope | **Bug** (jsdom false fail, order-dependent) | A same under jsdom; C fails it in Chromium | high (behaviour), medium (fix shape) | none |
| 5 | FZ-1 `lang="constructor"` | 3.1.1 fails for the tag (already reported); 2.4.x rules should run as for `lang="xx"` | **Bug** | n/a | high | none |
| 6 | CH-4 stroke- or shadow-only text | In scope. 1.61:1 fails; a black outline passes (G18). | **Bug** (silent pass) | fail / review / silent | high | `fail` when every outline colour is below the ratio, or always `cantTell` |
| 7 | OP-1 wrong-typed options dropped silently | Not a WCAG question | **Bug** (docs say "always" warned) | silent / silent | high | Fix the code, not the docs |

Each of the nine is a real bug. Six need no decision before fixing. Five carry a judgement call, listed in the last column.

---

## 1. CH-1: `nested-interactive-controls-absent` fails the customizable `<select>`

```html
<label>Fruit <select><button><selectedcontent></selectedcontent></button><option>Apple</option><option>Pear</option></select></label>
```

### WCAG and ACT

**The rule maps to 4.1.2 only.**
- SC 4.1.2 asks that, for each user interface component, "the name and role can be programmatically determined".
- Its note: "standard HTML controls already meet this success criterion when used according to specification".
- Understanding 4.1.2 says the same.
- No 4.1.2 failure technique covers nesting (F15, F20, F42, F59, F68, F79, F86, F89, F111).

**The component is the `select`.** It is determinable: Chromium exposes `combobox "Fruit"` with its expanded state and its options.

**The `button` is not a separate component.**
- WHATWG HTML (normative since commit `172cccf`, 2025-07-22): "If a `button` element is the first child which is an element of a `select` element, then it is inert."
- HTML on inert nodes: "user agents do not expose the inert nodes to accessibility APIs or assistive technologies."
- ARIA in HTML allows no `role` or `aria-*` on that button.
- The markup is the spec's own example (#example-customizable-select), and it conforms.

**ACT has no "interactive inside interactive" rule.** The closest, 307n5z (presentational children have no focusable content), is implemented here by `presentational-children-focusable-absent`. `nested-interactive-controls-absent` is listed as "extra coverage beyond ACT" (`docs/ACT_RULE_MAPPING.md`). Under 307n5z:
- the `select` (a combobox) is inapplicable;
- the button's only descendants are not in sequential focus navigation, so it passes.

**None of the harms the rule describes occurs here.** The button never takes focus, it is absent from the accessibility tree, and activation goes to the select.

### Browser (evidence)
- **Chromium 141:**
  - The button and `selectedcontent` are `ignored (inertElement)`, with and without `appearance: base-select`, and with the picker open or closed.
  - The Tab order skips the button, and `focus()` on it leaves focus on `body`.
- **What the DOM shows:** `el.inert` is false and `tabIndex` is 0, so DOM properties don't reveal the inertness. It follows from structure alone.
- **Support** (browser-compat-data 8.1.5):
  - Chrome and Edge from 135.
  - Safari 27.
  - Firefox behind a flag in 149.
- **Legacy parsers drop the `<button>`** (parse5 and jsdom output `<select><option>…`), so there the nested control doesn't exist at all.

### Results

| Variant | This engine | A | B | C | Chromium AX |
|---|---|---|---|---|---|
| V1 spec markup | **fail** (its ACT-307n5z rule passes) | pass | review: "more than one tabbable", "button tabbable" | pass | combobox; button inert |
| V2 + `base-select` | **fail** | pass | review (same) | pass | same |
| V3 `<a href>` inside the select's button | fail | fail | review | fail | button and link inert |
| V4 `multiple` + button (non-conforming) | **fail**, plus `button-name-present` fail | pass | fail ×2 | pass | button not in tree |
| V5 `<a href>` inside an `option` | fail | fail | review | fail | link exposed and focusable |
| V6 button after the options (not first child) | fail | pass | review | pass | button exposed and focusable |
| V7 select button with `tabindex=0` | **fail** | pass | review | pass | inert |
| V8 plain select | pass | pass | – | pass | combobox |
| V9 `<a href>` containing `<button>` | fail | pass | review | pass | both focusable |

### History and second implementation
- The rule predates the parser change, and its tests run in jsdom, whose parser drops the button. No CHANGELOG or DESIGN_CHALLENGES entry mentions `select` as a container. This was never considered, rather than considered and rejected.
- `hasBlockingInert` (`src/core/dom-helpers.js`) models only the `inert` attribute. It is shared by `getFocusableInfo` and `isAccTreeEligible`, so every rule sees the select's button as a focusable, exposed `<button>`.
- Two of this engine's rules disagree on the same element: the ACT-307n5z rule passes it, and `nested-interactive-controls-absent` fails it.

### Counter-argument
- A browser that kept the button without making it inert would expose a real nested control, but it would not conform to HTML, and none is known.
- The rule is deliberately broader than ACT, but breadth doesn't justify flagging what HTML defines as unfocusable and unexposed.
- The DOM gives no inertness signal, but the inertness follows deterministically from structure.

### Verdict
**Bug, a false fail (high confidence).** The same applies to V4 and V7, and to the `button-name-present` by-product on V4.

**Fix:** make `hasBlockingInert` true for an HTML `button` that is the first element child of a `select`, whatever `multiple`, `size` or `appearance` say. Tests must build the DOM with `createElement`, since jsdom's parser drops the button.

**It must not exempt:**
- focusable content inside an `option` (V5);
- a button that isn't the first element child (V6);
- real nesting (V9).

**Decision: V3, a focusable element written inside the select's button.** The spec says only the button is inert. Chromium makes its descendants inert too. ACT 307n5z and Engines A and C fail it, and the markup breaks the button's content model. The conservative reading keeps reporting it.

---

## 2a. CH-3: names set through ARIA element reflection

```html
<span id="lbl">Email address</span><input id="f"><button id="b"></button>
<script>f.ariaLabelledByElements=[lbl]; b.ariaLabelledByElements=[lbl];</script>
```

### WCAG and ACT
- **SC 4.1.2** requires the name to be programmatically determined, for "all user interface components (including … components generated by scripts)".
- **"Programmatically determined"** means "determined by software from author-supplied data provided in a way that different user agents, including assistive technologies, can extract". An element reference set by script is author-supplied data, and the browser maps it to the accessibility API.
- **ACT 97a4e1 (button), e086e5 (form field) and 23a2a8 (image)** all expect "an accessible name that is not empty", where the accessible name is "the programmatically determined name … calculated using the accessible name and description computation". None says anything about how the name was set.
- **Accessibility support:** WCAG's conformance requirement 4 leaves which user agents and assistive technologies count to the environment. Older browsers without reflection (Chrome below 135, Firefox below 136) give no name. That is a question for an auditor about the audience, not a violation provable from the DOM.

### Specs and browsers (evidence)
- **HTML defines reflection** ("attr-associated elements"):
  - The setter writes the content attribute as `""` and stores the elements.
  - The getter drops references into a shadow root or to detached elements.
- **WAI-ARIA 1.3 (draft) adds the IDL;** ARIA 1.2 (Recommendation) has none. AccName's text still mentions only the attribute, a gap every browser fills from the reflected elements.
- **Support:** Chrome and Edge 135, Firefox 136, Safari 16.4; Baseline newly available 2025-04-04.
- **Chromium:** `textbox "Email address"`, `button "Email address"`, with the name taken from the related element through `aria-labelledby`.
- **A page script can read it:** the getter returns the elements and already applies the scope check.

### Results

| Variant | This engine | A | B | C | Chromium AX |
|---|---|---|---|---|---|
| R1 input, reflection | **fail** | pass | fail | fail | textbox "Email address" |
| R2 empty button, reflection | **fail** | pass | fail | fail | button "Email address" |
| R3 img (no alt), reflection | **fail** | pass | fail | fail | image "Company logo" |
| R4 shadow input → light-DOM label | **fail** | pass | fail | fail | textbox "Email address" |
| R5 reference into a shadow root (control) | fail | fail | fail | fail | button "" |
| R6 reference to a detached element (control) | fail | fail | fail | fail | button "" |
| R7 `ariaDescribedByElements` only (control) | fail | fail | fail | fail | textbox "" |
| C1–C2 no name (control) | fail | fail | fail | fail | "" |
| C3–C4 attribute name (control) | pass | pass | pass | pass | named |

Engine A reads the property before the attribute. Engine C serialises attributes only, so it can't see reflection.

### History and second implementation
- No record explains reading attributes only.
- Besides the shared helpers (`getAriaLabelledByInfo` and the id index), 22 rules read `aria-labelledby` themselves.

### Counter-argument
- Most pages use attributes, but that doesn't make this page's `fail` right.
- "Baseline only since 2025" is about accessibility support, which WCAG leaves to the environment.

### Verdict
**Bug, a false fail (high confidence).** The engine reports a deterministic `fail` on an element whose name it could read from the page.

**Fix:** where the reflection getter returns a non-empty list, use it in the shared helpers and in the 22 rules, best by moving those rules onto the helper. Do the same for `ariaDescribedByElements` and the other relations.

**Must not change:**
- R5, R6, R7, C1 and C2 still fail;
- jsdom, which has no getters, keeps reading the attribute.

---

## 2b. CH-2: names and states set through `ElementInternals`

```js
customElements.define('x-btn', class extends HTMLElement {
  constructor() { super(); this.attachInternals().ariaLabel = 'Save'; }
});
// <x-btn role="button" tabindex="0"><span aria-hidden="true">…</span></x-btn>
```

### WCAG and ACT
- **4.1.2 and "programmatically determined"** apply as for CH-3. HTML defines internals values as the element's **default** semantics, "sometimes also called 'native', 'implicit', or 'host language' semantics". Author `aria-*` attributes override them.
- **The ACT name rules test the computed name,** so the internals-named elements meet them.
- **ACT 4e8ab6 (`aria-required-attr`)** rests its requirement on ARIA §5.2.2. WCAG 1.3.1 and 4.1.2 are only secondary there and "less strict". The checked state and the value are exposed (Chromium: `checked=false`, `value 5 of 0–10`).
- **Accessibility support:** `ElementInternals` ARIA is Baseline widely available since 2026-04-24 (Chrome 81, Firefox 119, Safari 16.4).
- **Where WCAG and the engine differ:** WCAG is met. What the engine can **observe** is the problem.

### What a page script can see
- **Nothing in general.** HTML says internals reflection runs "only … in a single direction". `element.ariaLabel` reads only the attribute, and `computedName` is not exposed.
- **Ways around it:**
  - A component that keeps its internals on a property (`this._internals`) can be read. Engine A does this.
  - A hook installed before any page script wraps `attachInternals` and records each result. This needs the binding's init script (Playwright `addInitScript`, Puppeteer `evaluateOnNewDocument`). Neither the engine nor its bindings have one today.
  - A binding can ask the browser for the computed name (CDP, WebDriver Get Computed Label). Not tried.

### Results

| Variant | This engine | A | B | C | Chromium AX |
|---|---|---|---|---|---|
| I1 button, internals label, empty, sized | cantTell (`name_closedContent`) | fail | fail | fail | button "Save" |
| I2 same with an `aria-hidden` icon child | **fail** | fail | fail | fail | button "Save" |
| I3 empty, zero size | **fail** | fail | fail | fail | button "Save" |
| I4/I5 `role=img`, internals label | **fail** | fail | fail | fail | image "Save" |
| I6 `role=textbox`, internals label | **fail** | fail | fail | fail | textbox "Search" |
| I7/I8 internals `ariaChecked` / `ariaValueNow` | **fail** (`aria-required-attr`) | fail | fail | fail | state exposed |
| I10 `aria-label=""` overrides internals | fail | fail | fail | fail | button "" |
| I11 internals on `this._internals` | **fail** | pass | fail | fail | button "Save" |
| I13 `#private` field + init hook | **fail** | pass | fail | fail | button "Save" |
| C5 defined element, icon child, no internals (control) | fail | fail | fail | fail | button "" |
| C12 hook, internals without a label (control) | fail | fail | fail | fail | button "" |

### History and precedent
1.11.0 decided to "ask about an element whose name could come from a component no script can read, instead of failing it" for closed shadow roots (CHANGELOG, LIMITATIONS). That reasoning applies here, but its `cantTell` covers only the eight content-named rules (button, link, menuitem, option, tab, treeitem, summary, tooltip). It catches internals only by accident (I1). Nothing in src, tests or docs mentions `ElementInternals` or `attachInternals`.

### Counter-argument
- The engine can't see internals, so it can't promise either way. That argues for `cantTell`, not `fail`.
- `cantTell` hides real failures: a defined custom element with a role and no name (C5) is usually a real bug, and CI loses an enforceable `fail` for it.
- "Chromium only" doesn't apply: all three browser engines implement it.

### Verdict
**Bug (high confidence that `fail` is wrong; medium on scope).**

**Fix:**
- For a **defined autonomous custom element** (`customElements.get(localName)`) that doesn't disable internals, report `cantTell` with a reason naming internals when a name or required state would otherwise fail. Do this in every name rule for its role and in `aria-required-attr`.
- Where the engine can see the internals object (a property, or a binding hook), read it: pass when it supplies the name or state, fail when it doesn't.
- Add a LIMITATIONS entry.

**Must still fail:**
- built-in elements;
- custom elements that aren't defined;
- an author attribute that overrides internals (I10);
- internals seen to lack a label (C12).

**Decision:**
- How far the `cantTell` reaches, given the C5 trade-off.
- Whether bindings should install an `attachInternals` hook to keep these decidable.

---

## 3. RP-1: a policy without `fail` still reports `fail`

**WCAG doesn't bear on this. The engine's documented contract is the standard.**

### What is promised
- **POLICY.md:3:** a policy controls "which outcome/confidence values are allowed to reach the result at all … It never changes what a rule decides — only how that decision is allowed to be represented."
- **POLICY.md:66:** "`outcome` not in `allowedOutcomes`: reported as `cantTell`, with the outcome the rule found in `policyOutcome`."
- **POLICY.md:74:** the guarantee holds "even if a rule's own logic has a bug".
- **`index.d.ts`, OUTPUT_SCHEMA and API_STABILITY:** `policyOutcome` is the outcome found "when the policy's allowedOutcomes made it cantTell".
- **Competing promise, OUTPUT_SCHEMA.md:220:** "The outcome always agrees with the tiers … a manual rule is never `fail`, and its `fail`-tier occurrences become `cantTell`." That sentence settles the one documented collision of this kind by demoting the tiers.

### What happens
With `allowedOutcomes: ['pass', 'cantTell', 'notApplicable']`:
- **A custom rule with fail-tier occurrences** gives `outcome: 'fail', policyOutcome: 'fail'`, which contradicts the field's own definition. SARIF reports an error and JUnit a failure.
- **On the 130 scenario fixtures, 11 built-in rules still fail:** aria-hidden-focus (36 fixtures), aria-prohibited-attr (9), aria-roles-valid (6), aria-required-attr (5), input-image-alt-present (3), aria-allowed-attr (2), aria-valid-attr-value (2), and avoid-inline-spacing, form-control-single-label, link-in-text-block and video-poster-text-alternative-present (1 each).
- **The mirror case:** under a contract without `cantTell`, the tier step also overrides the policy, but such a contract is degenerate.

### Code and history
- **Order in `normalizeRuleResult`:**
  1. the policy step sets `cantTell` and `policyOutcome`;
  2. the tier step sets `fail` back for any fail-tier occurrence;
  3. the manual coercion sets `cantTell` and **demotes the tiers**.
- **Step 3 repairs manual rules; nothing repairs automatic ones.**
- **The two steps came from separate stress-test-3 fixes.** The tier step (item 14) was verified without a narrowing policy, and the `policyOutcome` rework (item 36) was tested with untiered rules only. Both shipped in 1.11.0. No record considers the interaction, and no test pins it either way.

### Counter-argument
- Tiers are the more specific layer, and the reporters read them, so letting them win keeps reporters consistent.
- But demoting the tiers gives the same consistency, as the manual path already does.
- Only custom contracts that narrow the outcome list are affected.

### Verdict
**Bug (high confidence); low reach** (custom narrowing contracts only).

**Fix:** when the policy turns `fail` into `cantTell`, demote fail-tier occurrences, as the manual block does.

**Must not change:**
- results under the built-in contracts;
- the manual coercion;
- `policyOutcome` appearing only when the policy changed the outcome.

Add a test with a narrowing policy and a tiered rule.

---

## 4a. FZ-2: rule order flips verdicts on aria-hidden content with an idref cycle

```html
<body aria-hidden="true"><dl id="d" role="rowgroup" aria-labelledby="b">I</dl><area id="a">
<input aria-labelledby="c" id="b"><input aria-labelledby="x a" id="c"><span id="x" aria-labelledby="d">T</span></body>
```

### What is promised
`tests/determinism.test.js`: "every rule reaches the same verdict alone as it does in a full scan". The README's "same page, same options, same result" holds literally, since the two scans differ in `runOnly`; the test states the real invariant.

### What happens

| Rule | Alone | Full scan |
|---|---|---|
| aria-required-parent | **fail** #d | notApplicable |
| aria-required-children | cantTell #d | notApplicable |
| aria-prohibited-children | pass | notApplicable |
| label-in-name | pass | notApplicable |
| region | cantTell #d,#b,#c,#x | cantTell #b,#c |

**Cause:**
- `isAccTreeEligible` lifts `aria-hidden` for an element referenced by an eligible element, or for a tabbable control.
- `isReferencedByVisibleIdRef` cuts cycles by skipping referrers already in progress.
- `__cacheAndReturn` stores the provisional answer from inside the cycle as final, so whichever element is asked first decides for the rest.

### WCAG and ACT
- **ACT ff89c9 and bc4a75**, behind these rules (1.3.1), apply only to elements "included in the accessibility tree".
- **ACT's glossary:** an element with an `aria-hidden="true"` inclusive ancestor is programmatically hidden.
- **AccName 2A/2B** let hidden referenced content contribute **text to a name**. They don't put the hidden node into the accessibility tree. 2B's "not already part of an ongoing traversal" is the cycle guard. (Quoted from memory; not verified.)
- **So `#d` is not included, and all five rules should be `notApplicable` for it.** The full scan gives the WCAG-correct answer, but by accident. Under the engine's own `isAccTreeEligible` model, the fixed point makes `#d` eligible, so the "alone" answer is that model's true answer.

### Second implementation
`isIncludedInAccessibilityTree` (RULE_HELPERS.md: `isAccTreeEligible` "minus anything eligible only because of an `ariaHiddenOverridden*` reason. ACT scopes … to elements genuinely included in the accessibility tree") answers "not included" for every element from every starting point. It is order-independent and agrees with ACT. The three ARIA structure rules gate on `isAccTreeEligible`, though their comments say "currently exposed to the accessibility tree". No reason for letting the carve-outs in was found.

### History
The cycle guard came from stress-test-3 (CO-1, a stack overflow): "A reference whose own answer waits on the element being decided no longer counts". Caching the provisional answer was not considered.

### Reach
On all 130 scenario fixtures the five rules agree alone and in a full scan. The pattern needs an aria-hidden subtree, an idref cycle and a tabbable control: rare.

### Counter-argument
The full scan, the normal use, already gives the right answer. A cache-only fix would make `#d` eligible everywhere, so aria-required-parent would then `fail` in full scans too: worse.

### Verdict
**Bug (high confidence); very low reach.**

**Fix, in two layers, never the first alone:**
1. **Cache:** don't store answers computed while an idref walk is in progress, or work out idref eligibility once per scan.
2. **Applicability:** gate aria-required-children, aria-required-parent and aria-prohibited-children (and review label-in-name) on `isIncludedInAccessibilityTree`.

**Decision:** layer 2 changes applicability for focusable or referenced aria-hidden containers, so it needs a DESIGN_CHALLENGES entry.

---

## 4b. FZ-4: a closed popover under jsdom

```html
<main>L<a href="#" popover><img></a></main>
```

### WCAG and ACT
- **ACT c487ae (link name)** applies to links "included in the accessibility tree". **23a2a8 (image name)** excludes programmatically hidden images.
- **"Programmatically hidden"** includes a computed `display: none` on an inclusive ancestor.
- **WCAG's full-pages requirement:** the popover's content must conform when it is shown, so that state needs its own scan.
- **So:** a closed popover is out of scope, and an opened one is in scope. A closed popover that author CSS forces visible is also in scope, since ACT goes by computed display.

### Specs and browsers (evidence)
- **The HTML rendering section's UA rule** is `[popover]:not(:popover-open):not(dialog[open]) { display:none; }`. It is "expected" rendering, and author CSS can override it.
- **WAI-ARIA:** elements "not displayed, such as CSS display:none" MUST NOT be in the accessibility tree.

| Variant | Chromium display | AX (link, image) | This engine, Chromium |
|---|---|---|---|
| P1 closed | none | absent | not applicable |
| P2 `showPopover()` | block | present | fail / fail |
| P3 opened by `popovertarget` | block | present | fail / fail |
| P4 shown then hidden | none | absent | not applicable |
| P5 closed, author `display:block` | block | present | fail / fail |
| P6 closed `div[popover]` wrapper | none | absent | not applicable |

**In Chromium the engine is already right in every row.** jsdom 29.1.1 ships the UA rule but no popover API (no `showPopover`), so a popover can never open there.

**Why `display` flips under jsdom:**
- jsdom's selector matcher returns `undefined` on the first evaluation of a rule containing `:popover-open`, and `true` afterwards.
- jsdom caches each element's computed style.
- So whichever element first takes the bad evaluation keeps the wrong `display`. This reproduces in plain jsdom with no engine loaded.

### Results
- **This engine under jsdom:** the link rule fails both alone and in a full scan. The image rule is `notApplicable` alone and fails in a full scan. This is stable across runs.
- **Engine A under the same jsdom** shows the same order dependence.
- **In Chromium:**
  - Engine A is inapplicable for P1, P4 and P6, and fails P2, P3 and P5. It matches the accessibility tree.
  - Engine B reports nothing on closed popovers.
  - **Engine C fails closed popovers:** its UA stylesheet has no `[popover]` rule.

### History
"popover" appears nowhere in src, tests, docs or CHANGELOG. The engine trusts computed `display` in `isAccTreeEligible` and its twin in `isDomVisibleEligible`.

### Counter-argument
- In a browser the engine is right already. An unconditional "closed popover is hidden" rule would hide P5, against ACT's computed-display definition.
- The defect is jsdom's, and it reaches other engines too.

### Verdict
**Bug: jsdom false fails and a determinism break (high confidence on the behaviour, medium on the fix's shape).**

**Fix:** in both `display` checks, count an element with `popover` (not `dialog[open]`) as `display: none` **only when the DOM has no `showPopover`**, that is, where no popover can be open. In a browser, keep trusting computed display. A prototype makes jsdom `notApplicable` alone, in a full scan and on repeat runs, leaves P1–P6 unchanged in Chromium, and passes the suite's 923 top-level tests.

**Must not change:**
- opened popovers stay checked (P2, P3, `dialog[popover][open]`);
- P5 stays checked in browsers.

Add a LIMITATIONS note: under jsdom, a closed popover forced visible by author CSS is treated as hidden.

---

## 5. FZ-1: `lang="constructor"` or `lang="__proto__"`

### WCAG and ACT
- **The tag itself:** neither value is a valid language tag (RFC 5646's primary subtag is 2–3 or 5–8 letters; grammar from memory). That fails 3.1.1 on `<html>` (ACT bf051a) and 3.1.2 on an element (ACT de46e4).
  - The engine already reports both: `html-lang-attr-present` fails with "the value "constructor" is not a valid language tag", and so does `valid-lang`.
- **The quality rules:**
  - heading-quality and form-control-label-quality map to 2.4.6, link-name-quality to 2.4.4, and page-title-patterns to 2.4.2.
  - The three alt-quality rules map to 1.1.1.
  - Whether a heading, link, title or alt text describes its purpose doesn't depend on a malformed tag. The per-language word lists are an aid, so the right behaviour is the unknown-language path, **as for `lang="xx"`**.

### What happens
- **Four rules don't complete:** `form-control-label-quality`, `heading-quality`, `link-name-quality` and `page-title-patterns` go from `notApplicable` to `cantTell` with an error ("byLang[lang].has is not a function"). That changes verdicts on 2.4.2, 2.4.4 and 2.4.6.
- **Three rules lose signals silently:** `img-alt-quality`, `area-alt-quality` and `input-image-alt-quality` drop their "placeholder" and "starts by saying it is an image" signals. A helper throws, and the rule swallows the error.
- **An element's own `lang` triggers it too** (`<h1 lang="constructor">`).
- **Only lowercase inherited names hit it.** `toString` and `hasOwnProperty` don't.

### Size of the fix
There are seven plain-object lookups indexed by the page's language, in five files:
- `link-name-quality-manual.js:267`
- `heading-quality-manual.js:267` and `:385`
- `form-control-label-quality-manual.js:306`
- `page-title-patterns-manual.js:329` and `:332`
- `dom-helpers.js:4229`

A sweep putting `constructor`, `__proto__`, `toString` and `hasOwnProperty` in role, type, autocomplete, ARIA tokens, tag names, `dir` and `rel` found no other erroring rule among the 134.

### History
- **When the lookups arrived:** the per-language lists in 1.8.0, the alt signals in 1.10.0.
- **The project already treats this class as a bug:**
  - 1.5.0 fixed `locale: 'constructor'` ("tested for truthiness rather than for an own property");
  - 1.11.0 fixed a custom rule id of `__proto__`;
  - stress-test-3 fixed `packs: ['__proto__']`.
- No lint rule or RULE_AUTHORING entry covers it.

### Counter-argument
The input is ill-formed, almost never seen, and the page already fails 3.1.1. But a broken tag must not also turn other criteria into "did not complete", and the 1.5.0 precedent fixed the identical pattern.

### Verdict
**Bug (high confidence); very low likelihood.**

**Fix:** own-property lookups (or `Object.create(null)` / `Map` tables) at the seven sites.

**Must not change:**
- results for real tags;
- the English list always applying;
- `html-lang-attr-present` and `valid-lang` failing the tag.

Add a test that expects the `lang="xx"` result.

---

## 6. CH-4: text drawn only by a stroke or shadow passes contrast

```html
<h2 style="color:transparent;-webkit-text-stroke:1px #ccc;font-size:32px">Outlined heading</h2>
<p style="color:#fff;text-shadow:1px 1px 0 #ccc">Shadow text</p>   <!-- on a white page -->
```

### WCAG and ACT

**Understanding 1.4.3** leaves out text "designed to be invisible or hard to discern to all viewers". Outlined text is designed to be seen. Its current text has no sentence on halos or outlines; those are in the Techniques.

**The Techniques count the outline in the contrast:**
- G18: "add a thin black outline (at least one pixel wide) around the letter in order to keep the contrast ratio … above 4.5:1".
- G18, G17 and G145: "provide a halo around the text that provides the necessary contrast ratio".

**ACT afw4f7 and 09o5cg:**
- Applicability is "any visible character".
- "Visible" is defined as "making it fully transparent would result in a difference in the pixels rendered". A stroke or shadow changes pixels, so the text is in scope.
- The expectation is the highest possible contrast between foreground and background colours. With a transparent or background-coloured fill and a `#ccc` outline, that is `#fff` against `#ccc`: **1.61:1, a fail**. With a black outline it is 21:1, a pass.
- The background section: "If all background pixels have a low contrast with all foreground pixels, the success criterion is guaranteed to not be satisfied."
- ACT's 1:1 assumption (same foreground and background colour is not "visual presentation of text") doesn't apply, because the pixels aren't 1:1.
- ACT's own examples: inapplicable example 3 is `white` on `white` with nothing else, and `color: transparent` alone is listed as not visible.

**Expected outcomes:**

| Variants | Expected |
|---|---|
| `#ccc` stroke or shadow, invisible fill | in scope: **fail** (1.61:1) |
| `#000` stroke or shadow | in scope: **pass** by ACT's arithmetic (G18) |
| Nothing drawn (transparent fill with no stroke or a transparent shadow, fill = background) | inapplicable |

Screenshot pixels match these readings in every case (evidence only).

### Results

| Variant | This engine (min / computable) | A | B | C | Pixels |
|---|---|---|---|---|---|
| transparent + 1px `#ccc` stroke | **silent / silent** | fail (1.6) | review | inapplicable | 1.61 |
| `#fff` + 1px `#ccc` stroke | **silent / silent** | fail | review | inapplicable | 1.61 |
| transparent + shadow `0 0 0 #ccc` | **silent / silent** | fail | review | inapplicable | 1.61 |
| `#fff` + shadow `1px 1px 0 #ccc` | **silent / silent** | review | review | inapplicable | 1.61 |
| `#000` stroke or shadow | silent / silent | pass (or review, offset shadow) | review | inapplicable | 21 |
| nothing drawn | silent / silent | review | review | inapplicable | none |
| `#fafafa` fill + `#ccc` stroke (control) | silent / **cantTell TEXT_STROKE** | fail | fail | fail (fill only) | 1.61 |
| plain `#ccc` (control) | fail / pass | fail | fail | fail | 1.61 |

- **"Silent":** next to a normal paragraph, contrast-minimum reports `pass` with "Eligible text nodes: 1", and the stroked text isn't counted.
- **Under jsdom** the engine never sees `-webkit-text-stroke`, and LIMITATIONS doesn't say so.

### History
- **1.6.0** added the `text-shadow` → `cantTell` blocker and the same-colour gate ("that text isn't visible in the first place") on the same day. The gate runs first, so shadowed text with a background-coloured fill never reached `TEXT_SHADOW`.
- **1.10.0** added `isUndrawn` for `color: transparent`.
- **1.11.0** added `TEXT_STROKE`. Neither 1.10.0 nor 1.11.0 revisited the gates.
- No test covers the combination. This is an oversight from features landing in sequence.
- **The engine's own contract** (RULE_CATALOG, contrast-computable) says that rule "reports that uncertainty, which is what lets contrast-minimum and contrast-enhanced stay silent on the same text". Here all three are silent.

### Counter-argument
- Engine C skips these cases too.
- The engine has no glyph model, and the `TEXT_SHADOW` precedent chose `cantTell` because a shadow can rescue contrast.
- Neither defends silence. They only bear on `fail` versus `cantTell`.

### Verdict
**Bug, a silent false pass (high confidence).**

**Fix:** in `isUndrawn` and `isSameColorAsBackground`, treat a visible stroke (width > 0, alpha > 0) or shadow (alpha > 0) as drawn, so the text reaches the existing `TEXT_STROKE` / `TEXT_SHADOW` `cantTell`. In a prototype, every outlined variant becomes `cantTell` with the right reason, nothing else changes, and the contrast tests pass (143, plus 12 in Chromium).

**Must not change:**
- invisible text stays skipped;
- the 1:1 precedent;
- the `#fefefe` near-miss still fails;
- `background-clip: text`.

**Decision:** also report `fail` when the fill is invisible, the background is a flat resolved colour and every outline or shadow colour is below the ratio against it (ACT's "guaranteed to not be satisfied"). Otherwise always ask (`cantTell`).

---

## 7. OP-1: options of the wrong type are dropped with no warning

**WCAG doesn't bear on this. The engine's documented contract is the standard.**

### What is promised
- **ENGINE_OPTIONS.md:388:** "**Always**, a value of the wrong type is warned about and read as not given". The same line says a non-colour `contrast.rootCanvasFallback` warns.
- **CHANGELOG 1.11.0:** "Without `strictOptions`, a value of the wrong type … [is] warned about rather than ignored in silence."

### What happens
- **The code (`src/core/engine-options.js:267–268`):**
  ```js
  // A value of another wrong type is said by the option's own reading.
  if (p.kind === 'invalid' && !p.onOff && p.path !== '') continue;
  ```
  Most options have no such reading. `strictOptions` throws for every case, so the check exists; outside strict mode its result is thrown away.
- **20 option paths are silent.** Nine of them would have changed results had the value been read:

| Silent option | Intended value would change results |
|---|---|
| `locale: 5` | yes |
| `excludeSelectors: 5` / `{img:true}` | yes (nothing excluded; echoed as given) |
| `contrast: 'auditorAssist'`, `contrast.mode: 'auditor'` | yes |
| `visibilityMode: 'geometry'` | yes (echoed as given) |
| `policy.allowedOutcomes: 'fail'` | yes |
| `output: 'findings'`, `output.detail: 'finding'` | yes |
| `contrast.rootCanvasFallback: 5` | contradicts the documented warning |
| `mappings`, `messages`, `policyContract`(`.id`), `policy`, `rules`(`.include`), `tags`, `tests`, `pingWaitTime`, `frameWaitTime` | cosmetic here |

- **These warn as documented:** `strictOptions`, `wcagVersion`, `wcagLevel`, `profile`, `optInRules`, `timestamp`, `includeMode`, `customRules`, `packs`, and every on/off option.

### History
Stress-test-3 item 35 scoped the warning to on/off options and a non-object `engineOptions`. The CHANGELOG and ENGINE_OPTIONS wording then generalised it to every wrong type. The docs promise more than was built.

### Other engines (one data point)
- Engine A ran silently with `runOnly: 5`, `resultTypes: 'x'` and `iframes: 'maybe'`, and threw only on a malformed `runOnly` object.
- Engine B ran silently with an invalid ruleset and returned zero results.
- Silence is common, but this engine documents the opposite.

### Counter-argument
`strictOptions` catches all of these, and unknown keys stay quiet on purpose. But these are known keys with wrong values, and the docs say "always".

### Verdict
**Bug (high confidence); medium practical impact**, since configuration typos are common.

**Fix:** warn for every invalid problem except on a list of options whose own reading already warns, so nothing warns twice. Make `rootCanvasFallback` warn for a non-string. Narrowing the docs instead is the weaker option.

**Must not change:**
- unknown keys without a close match stay silent;
- `strictOptions` still throws;
- wrong values are read as not given.
