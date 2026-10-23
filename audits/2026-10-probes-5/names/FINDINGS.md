# Names, roles and ARIA rules: findings (prefix NR)

Target: `main` at `c528af08`. Every repro below is a file in `repros/`. `node run-repros.mjs` runs each one twice in Chromium and twice in jsdom, and prints Chromium's computed role and name for each id. Every rerun gave the same result; the output is in `repro-results.txt`. Spec text is from the W3C copies of accname, HTML-AAM, ARIA in HTML, WAI-ARIA 1.2 (Recommendation), WAI-ARIA 1.3 (editor's draft) and SVG-AAM.

| id | finding | verdict | severity |
|---|---|---|---|
| NR-1 | `aria-labelledby` pointing at an `aria-hidden` element drops the text inside its child elements | Bug | High |
| NR-2 | SVG `<title>`/`<desc>` read as content in Chromium; an SVG link's own title not used in jsdom | Bug | Medium |
| NR-3 | Native range elements with a redundant role judged against 0–100 | Bug | Medium |
| NR-4 | Deprecated global ARIA attributes fail on elements with no role, but only ask on a div | Inconsistency | Medium |
| NR-5 | `<td>` in a table whose presentational role is overridden treated as roleless | Bug | Low |
| NR-6 | `aria-roles-valid` fails the ARIA 1.3 role `image` | Inconsistency | Medium |
| NR-7 | Nested `aria-labelledby` followed inside a labelledby traversal | Bug | Low |
| NR-8 | Text directly inside a closed `<details>` goes into names | Bug | Low |
| NR-9 | `page-has-heading-one` ignores `aria-level` on h1–h6 | Inconsistency | Low |
| NR-10 | `inspect('names')` roles differ from the roles the rules use | Bug | Low |
| NR-11 | `aria-allowed-attr` skips inputs with an unknown type | Gap | Low |
| NR-12 | `aria-placeholder`-only native field fails where a custom one asks | Inconsistency | Low |
| NR-13 | In jsdom, a button named only by CSS generated content fails | Gap (docs) | Low |
| NR-14 | `aria-prohibited-children` says a `<button>` has no role | Inconsistency | Low |
| NR-15 | Hexadecimal numbers accepted as ARIA numbers | Gap | Low |

## NR-1: `aria-labelledby` pointing at an `aria-hidden` element drops the text inside its child elements

Repro (`repros/nr1-labelledby-aria-hidden.html`):

```html
<button id="b1" aria-labelledby="l1"></button><span id="l1" aria-hidden="true"><b>Save</b></span>
<a id="a2" href="/cats" aria-labelledby="l2"><img src="cat.png" alt=""></a><p id="l2" aria-hidden="true"><span>Read more</span> <span>about cats</span></p>
<input id="i3" aria-labelledby="l3"><div id="l3" aria-hidden="true"><span>Email</span></div>
<div id="c4" role="checkbox" aria-checked="false" tabindex="0" aria-labelledby="l4"></div><span id="l4" aria-hidden="true"><span>Accept terms</span></span>
```

- **In plain words:** pointing `aria-labelledby` at text hidden with `aria-hidden="true"` is a normal way to name a control. The engine reads only the text sitting directly in the hidden element and skips anything inside a child element, so these controls get no name. Chromium names them "Save", "Read more about cats", "Email", "Accept terms".
- **Engine says:** fail in `button-name-present` (#b1), `link-name-present` (#a2), `form-control-programmatic-label-present` (#i3) and `binary-control-name-present` (#c4), in Chromium and jsdom alike. `<span aria-hidden=true>AH <span>child</span></span>` gives "AH" where Chromium gives "AH child". **Should say:** pass, with the full referenced text as the name.
- **Spec:** accname 2A: "If the current node is hidden and is: Not part of an aria-labelledby or aria-describedby traversal, where the node directly referenced by that relation was hidden. […] Return the empty string." LabelledBy Traversal: "user agents MUST include all nodes in the subtree as part of the accessible name or accessible description, when the node referenced by aria-labelledby or aria-describedby is hidden."
- **Own docs:** `computeIdRefTargetTextOf` sets `includeHidden` so that "the whole referenced subtree … shares one decision". `display:none`, `hidden` and `visibility:hidden` targets work; only aria-hidden doesn't.
- **Cause:** `isAccTreeEligible` returns eligible (`ariaHiddenOverriddenIdref`) for the referenced element only (`dom-helpers.js:3311-3325`); `computeIdRefTargetTextOf` takes its hidden state from that answer, so `includeHidden` is false (`:4145-4153`); the content walk then drops each child element as `ariaHidden` (`:5438-5450`).
- **Verdict:** Bug. **Severity:** High.

## NR-2: SVG `<title>`/`<desc>` read as visible content in Chromium; an SVG link's own title not used in jsdom

- **Repro** (`repros/nr2-svg-title-content.html`): s1 `<a href><svg role=presentation><title>Home</title>…`; s2 the same in a `<button>` with `role=none`; s3 `<g role=presentation><title>`; s4 `<svg role=presentation><desc>Docs</desc>`; s5 `<svg><a href><title>Next page</title><rect/></a></svg>`.
- **In plain words:** Chromium names s1–s4 `""` and s5 "Next page". The engine in Chromium passes s1–s4; in jsdom it fails s1–s3 (right), fails s5 (wrong) and passes s4. **Should say:** fail s1–s4, pass s5, in both environments.
- **Spec:** SVG-AAM title: "no accessible object created; see Name and Description mapping"; "User agents MUST NOT include any elements, or their descendant content, as an accessible object … indicated as no accessible object created"; name step: "If the current node has at least one direct child title element, … return the title text alternative".
- **Own docs:** dom-helpers says "The `<title>` itself is never rendered, so the walk below would skip it". The differential script's `svg-desc` known difference says counting `<desc>` "changes no verdict"; s4 shows it does.
- **Cause:** `getSvgTitleChildText` gives no name to a presentational SVG (`:5151-5159`), and the walk continues into the `<title>`. Chromium reports `display: inline` for an SVG `<title>` and jsdom `none`, so whether it is read depends on the environment (`:5440-5450`). Only descendants are named from their `<title>` (`:5537`), not the SVG `<a>` itself.
- **Verdict:** Bug (gap in Chromium, wrong fail in jsdom). **Severity:** Medium.

## NR-3: Native range elements with a redundant role are judged against 0–100

- **Repro** (`repros/nr3-native-range-role.html`): `<progress role=progressbar max=1000 value=500 aria-valuenow=500>`, `<input type=range role=slider min=1900 max=2100 value=2000 aria-valuenow=2000>`, `<meter role=meter max=500 value=250 aria-valuenow=250>`.
- **Engine says:** `aria-valid-attr-value` fail `ARIA_VALUENOW_OUT_OF_RANGE` on all three, in Chromium and jsdom. Chromium exposes valuemax 1000, 1900–2100 and 0–500. **Should say:** pass.
- **Spec:** HTML-AAM maps native max/min to aria-valuemax/min; ARIA 1.2 §8.1: "the equivalent host language states and properties take precedence".
- Without the redundant role, all three pass.
- **Cause:** `aria-valid-attr-value.js:142` (author role only), `:161` and `:209-210` (only the aria-valuemin/max attributes, else the defaults).
- **Verdict:** Bug. **Severity:** Medium.

## NR-4: Deprecated global ARIA attributes fail on elements with no role, but only ask on a div

- **Repro** (`repros/nr4-roleless-deprecated-global.html`): `<input type=file aria-invalid=true aria-errormessage=cv-err>`, `<input type=color aria-invalid=true>`, `<video controls aria-disabled=true>`, `<div aria-invalid=true>`.
- **Engine says:** fail `ARIA_ATTR_NOT_ALLOWED_ROLELESS` on the file input, color input and video; cantTell `ARIA_ATTR_DEPRECATED` on the div. **Should say:** cantTell for all four.
- **Spec:** WAI-ARIA 1.2 §6.5: global attributes "are supported by all roles and by all base markup elements unless otherwise prohibited"; aria-disabled, aria-errormessage, aria-haspopup and aria-invalid are marked "Global use deprecated in ARIA 1.2". The 1.3 draft keeps the same list.
- **Own docs:** aria-allowed-attr: "An attribute ARIA deprecated (rather than prohibited) on the role is still allowed: it is reported as CANTTELL".
- **Cause:** `aria-allowed-attr.js:852-861`: `rolelessOccurrences` never checks `isDeprecatedAttr`; only the role path does (`:1037-1050`).
- **Verdict:** Inconsistency. **Severity:** Medium.

## NR-5: `<td>` in a table whose presentational role is overridden is treated as roleless

- **Repro** (`repros/nr5-td-conflict-table.html`): `<table role=presentation aria-label=Prices>` and `<table role=none tabindex=0>`, each with a td carrying `aria-colindex` or `aria-rowspan`. Chromium: table "Prices", cell "Tea".
- **Engine says:** aria-allowed-attr fail `ROLELESS` on the cells. **Should say:** pass.
- **Spec:** ARIA 1.2 Presentational Roles Conflict Resolution: "If an element is focusable … MUST ignore the presentation role … If an element has global WAI-ARIA states or properties, user agents MUST ignore the presentation role". HTML-AAM td: "cell role if the ancestor table element is exposed as a role=table".
- **Own docs:** the code comment says "A table is not focusable", untrue with `tabindex`.
- **Cause:** `aria-helpers.js:1453-1456` reads only the table's explicit role.
- **Verdict:** Bug. **Severity:** Low.

## NR-6: `aria-roles-valid` fails the ARIA 1.3 role `image`

- **Repro** (`repros/nr6-image-role.html`): `<div role=image aria-label="Three stars">★★★</div>`. Chromium: image "Three stars".
- **Engine says:** fail `ARIA_ROLE_INVALID`, plus an aria-prohibited-attr cantTell (roleless).
- **Spec:** ARIA 1.3 ED: "The image role was added to ARIA in version 1.3 as a synonym of the ARIA 1.0 img role."
- **Own docs:** CHANGELOG: "accepts sectionheader and sectionfooter, ARIA 1.3 roles Chromium exposes, as it already accepted comment and suggestion".
- **Cause:** `CONCRETE_ROLES` (`aria-helpers.js:255-`) has `img` (`:330`) but not `image`.
- **Verdict:** Inconsistency. **Severity:** Medium (a wrong fail, on rare markup).

## NR-7: Nested `aria-labelledby` followed inside a labelledby traversal

- **Repro** (`repros/nr7-nested-labelledby.html`): `<button aria-labelledby=l1><span id=l1>Delete <span aria-labelledby=l1x>file</span></span></button><span id=l1x hidden>everything</span>`.
- **Engine says:** name "Delete everything", so label-in-name fails `VISIBLE_LABEL_NOT_IN_ACCESSIBLE_NAME`. Chromium: "Delete file".
- **Spec:** accname 2B: processed only when "the current node is not already part of an ongoing aria-labelledby or aria-describedby traversal"; Example 3: "element1's aria-labelledby is not subsequently followed."
- **Cause:** `__inIdRefTraversal` is honoured only at `dom-helpers.js:4367`; descendants are named through `getAccessibleNameInfo` at `:5561`, which ignores it.
- **Verdict:** Bug. **Severity:** Low.

## NR-8: Text directly inside a closed `<details>` goes into names

- **Repro** (`repros/nr8-closed-details-text.html`): `<label for=n>Name <details><summary>Help</summary>Use the name on your passport</details></label><input id=n>` gives "Name Help Use the name on your passport" (Chromium "Name Help"). No outcome changed; the wrong names show in `inspect()` and in messages.
- **Spec:** accname 2A.
- **Cause:** the text-node branch checks only the parent's own `content-visibility` (`dom-helpers.js:5398-5412`).
- **Verdict:** Bug. **Severity:** Low.

## NR-9: `page-has-heading-one` ignores `aria-level` on h1–h6

- **Repro:** `repros/nr9a-h1-level2.html` (`<h1 aria-level=2>`) passes; `repros/nr9b-h2-level1.html` (`<h2 aria-level=1>`) gives cantTell `HEADING_ONE_MISSING`. heading-order says "A native <hx> with a valid aria-level … takes that level, as browsers expose it".
- **Cause:** `page-has-heading-one-manual.js:126-129`.
- **Verdict:** Inconsistency. **Severity:** Low.

## NR-10: `inspect('names')` roles differ from the roles the rules use

- **Repro:** `p18-inspect-roles.mjs`. `<select multiple>` and `<select size=4>` are listed as combobox, a `<td>` in `role=grid` as cell; Chromium and aria-allowed-attr say listbox and gridcell. CHANGELOG: inspect's roles "are the engine's own, the ones the rules judge".
- **Cause:** `getRoleInfo` maps every select to combobox (`dom-helpers.js:5780`); `console-helpers.js:258-264`. The aria-valid-attr-value haspopup check uses the same `getRoleInfo`.
- **Verdict:** Bug. **Severity:** Low.

## NR-11: `aria-allowed-attr` skips inputs with an unknown type

- **Repro:** `repros/nr11-unknown-input-type.html`. `<input type=bogus aria-checked aria-valuenow>` is not checked; the same without a type fails. HTML: "missing value default and invalid value default are the Text state".
- **Cause:** the literal key `input[type=bogus]` isn't in the table (`aria-allowed-attr.js:957-963`).
- **Verdict:** Gap. **Severity:** Low.

## NR-12: `aria-placeholder`-only native field fails where a custom one asks

- **Repro:** `repros/nr12-aria-placeholder-native.html`. `<input aria-placeholder="Search the site">` fails `form-control-programmatic-label-present`; `<div role=textbox aria-placeholder=…>` is cantTell `name_from_aria_placeholder_only`. Chromium names both; the CHANGELOG reason applies to both.
- **Cause:** the branch exists only in `textbox-name-present.js:224` and the searchbox rule.
- **Verdict:** Inconsistency. **Severity:** Low.

## NR-13: In jsdom, a button named only by CSS generated content fails

- **Repro:** `repros/nr13-jsdom-pseudo-name.html`: buttons named by `content:"\2605" / "Favourite"`, `content:attr(data-label)`, `content:"Save"`. They pass in Chromium and fail `button-name-present` in jsdom. LIMITATIONS.md mentions generated text under jsdom only for contrast.
- **Verdict:** Gap (docs). **Severity:** Low.

## NR-14: `aria-prohibited-children` says a `<button>` has no role

- **Repro:** `repros/nr14-prohibited-child-message.html` (a button inside a tablist). The fail is right, but the message says "This element has no role but can take focus" and the data has `childRole: null`.
- **Cause:** `aria-prohibited-children.js:301`, `:426`.
- **Verdict:** Inconsistency. **Severity:** Low.

## NR-15: Hexadecimal numbers accepted as ARIA numbers

- **Repro:** `repros/nr15-number-hex.html`: `aria-valuenow="0x10"` passes, compared as 16.
- **Cause:** `aria-helpers.js:1117` uses `Number()`.
- **Verdict:** Gap. **Severity:** Low.

## Leads

1. `form-control-single-label` still fails a field with two labels. Its stated reason (screen readers announce an unpredictable subset) contradicts HTML-AAM and Chromium, which join the labels in DOM order.
2. `listitem-parent-valid` fails `<li>` in `<ul role=group|navigation>`. ARIA in HTML makes that `li` generic, so no list item is left without a list.
3. Alt text from `content: "x" / "Alt"` is joined with no space ("AltLink1"; Chromium "Alt Link1"); open-quote/close-quote are left out.
4. An input whose `list` names no datalist is a textbox (HTML-AAM); ARIA in HTML says combobox whenever the attribute is present.
5. `aria-owns-valid` ignores an owner that is display:none, hidden or inert, yet Chromium gives the owned element to that owner. A mutual pair (A owns B, B owns A) is not reported.
6. An `<input type=button>` inside a label adds nothing to the name ("Remind me"; Chromium "Remind me tomorrow").
7. `hidden="until-found"` with author `content-visibility: visible` is still treated as hidden; `content-visibility` on a `display:ruby` box hides content Chromium shows.
8. `h1 role=none` with `aria-hidden="false"` or `aria-disabled` counts as a heading: follows the spec, Chromium disagrees.
9. The dev tool `ax-tree-differential.js` has its own global-attribute list, missing four (aria-description among them), so it reports false disagreements.
10. A non-focusable separator with `aria-valuenow` gets the range check.

## What held up

- **Input roles:** 2,852 input type × attribute × list cases; apart from NR-4 and NR-11, every result matched HTML-AAM and ARIA in HTML, or a documented spec choice.
- **AX-tree differential:** about 1,590 elements across five pages. Roles matched Chromium apart from documented differences. Names matched for multiple, hidden and self-named labels, `aria-labelledby="x x"`, self-references, embedded control values, CSS content including `/ ""`, slots, shadow DOM, ariaLabelledByElements and ElementInternals.
- **Hidden content:** 47 cases (`hidden`, `until-found`, `content-visibility`, details, dialogs, popovers, inert); only lead 7 differed.
- **Modal dialog claims:** 7 variants, all right. **Heading role=none conflicts:** 26 variants, consistent with ARIA.
- **New rules:** aria-owns-valid (10 cases), label-for-valid, control-name-title-only (15), 49 aria-valid-attr-value constraint cases.
- **ElementInternals:** 16 cases, all as Chromium.
- **Older name rules:** an 87-case sweep with fresh markup, plus 10 SVG cases.
- **jsdom vs Chromium:** the only non-layout differences were NR-2, NR-13 and `element.ariaLabel` reflection (jsdom has none). Pages with an `aria-modal` dialog were left out (jsdom's documented aria-modal fallback empties the page).
