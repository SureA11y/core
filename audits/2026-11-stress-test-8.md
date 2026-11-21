# Stress test of `main`, eighth round: findings (2026-11-21)

The eighth stress test of `main` ran at `254b644f`: version 1.17.0 plus the unreleased 1.18.0 work, after round 7's fixes (#411), the leftovers and decisions of #412, and #413 to #415. It looked first at what changed since round 7, rule by rule and fix by fix, for regressions and for slips in the new work; then, as usual, for wrong verdicts, misses, slowness and memory in names and ARIA, layout and visual rules, the pack and integrator API, and robustness.

Like rounds 6 and 7, this round has no `FINDINGS.md` per area: its findings were fixed the same day, and this report says where. Its notes were not kept as a written report, so this record is built from the probes and from the messages of the fixes in [#416](https://github.com/SureA11y/core/pull/416), each of which names its finding; it gives no verdict or severity per finding. Each area's probes are under [`2026-11-probes-8/`](./2026-11-probes-8/):

| Area | Folder | Prefix | Runtime | Findings |
|---|---|---|---|---|
| Regressions and new-work checks | [`changes/`](./2026-11-probes-8/changes/) | NW | Chromium, jsdom | 15 |
| Accessible names and ARIA | [`names-aria/`](./2026-11-probes-8/names-aria/) | NA | jsdom, Chromium (accessibility tree over CDP) | 11 |
| Layout and visual rules | [`visual/`](./2026-11-probes-8/visual/) | LY | Chromium, with screenshots | 15 |
| Packs and the integrator's API | [`api/`](./2026-11-probes-8/api/) | PK | Node, jsdom, Chromium | 13 |
| Robustness, speed and memory | [`robust/`](./2026-11-probes-8/robust/) | RO | Chromium, jsdom | 6 |

That makes 60 findings. Two of them, **NW-1 and NW-2, are regressions of round 7's own fixes** (VL-2 and VL-5); NW-4 is a third, of IF-7's change. Ten needed a decision, taken by the owner on 2026-11-21 (§2).

**Basis**
- `main` at `254b644f`.
- Chromium 153 (`/opt/pw-browsers/chromium`), and jsdom from the repo.
- WCAG 2.2 and its Understanding documents are the source of truth. HTML, WAI-ARIA 1.2, ARIA in HTML, accname, HTML-AAM, SVG-AAM, the APG and the CSS specs decide the details; Chromium's layout and accessibility tree are supporting evidence.

**How findings were verified.** Each finding was reproduced by its probe, then reproduced again while it was fixed, with a regression test that fails without its fix ([#416](https://github.com/SureA11y/core/pull/416), merged 2026-11-21 as `a021f714`; unreleased, for 1.18.0). `names-aria/verify-na.js` re-runs the NA findings; `visual/repro-all.js` the LY ones.

---

## 1. Findings

Ordered by area. All are fixed in [#416](https://github.com/SureA11y/core/pull/416), which landed on `main` as the single commit `a021f714`.

### Regressions and new-work checks

| # | Finding | Fixed |
|---|---|---|
| NW-1 | **target-size: a neighbour whose face a component draws read as covered**, so the plain targets beside it stopped failing. Round 7 made the hit test drill into open shadow roots (VL-2), but `isCoveredNear` and `coveredAtCentre` then asked `contains()`, which stops at the shadow boundary (`NW-ts-*.js`). Regression of round 7. | Containment follows the composed tree |
| NW-2 | **focus-not-obscured: an opaque sticky header holding a web component was no longer asked about**, for the same reason (`NW-fno-*.js`). Regression of round 7's VL-5. | Containment and the walk to the cover's root follow the composed tree |
| NW-3 | An `<li>` in a list given a composite widget role (tablist, menu, listbox…) was only asked about since #412 (`NW-listitem-override.js`). | Decided (§2): fails again where drawn as a list item |
| NW-4 | **A pack's own verdict, and the merge of several profiles, made a check fail after the policy step**, undoing a policy whose `allowedOutcomes` leave out `fail` (`NW-ownverdicts-policy.js`). Regression of round 7's IF-7. | Capped to `cantTell` with `policyOutcome: 'fail'`, as the policy step does |
| NW-5 | `duplicate-id-aria`'s `nearestCopies` grew with the square of repeated nested cards (`NW-dupid-aria-*.js`); with RO-1. | One pass over each copy's ancestors; findings identical |
| NW-6 | A pack whose `name`, `version` or `standard` getter throws still crashed the scan through `stampPacks` and the steps' reading of standards (`NW-pack-throwing-name.js`, `NW-pack-flaky-getter.js`). | Skipped, as elsewhere |
| NW-7 | Eight more rules copied a page value whole into the summary, hint, parameters or details (`duplicate-id-aria`, `duplicate-id`, `autocomplete-valid`, `identical-links-same-purpose`, `aria-roles-valid`, `valid-lang`, `form-control-programmatic-label-present`, `invalid-field-error-message`) (`NW-bigvalue-*.js`, `NW-bigquote.js`). | `quoteText`, as round 7 did for five; and the near-role search skips lengths too far off |
| NW-8 | The image-replacement shortcut skipped `::before`/`::after` text with a negative `text-indent` even when aligned to the line's end, which Chromium paints (`NW-pseudo-indent-*.js`). | Measured |
| NW-9 | `scroll-padding-top` written with `min()`, `max()` or `clamp()` read as 0 (`NW-fno-scrollpad.js`). | Read as an expression |
| NW-10 | `p-as-heading` asked about bold "+45%", "−5%", a phone number, "$29.99*", "3×", "4.5 ★", "~30", "100+" and digits of other scripts (`NW-pheading-numbers.js`). | Read as numbers |
| NW-11 | Profile names in a list folded case beyond ASCII, where a single name doesn't (#412) (`NW-kelvin-profile-list.js`). | ASCII only |
| NW-12 | `packScript` refused `<!-->` and `<!--->`, which HTML closes at once (`NW-packscript-comment.js`). | HTML's script data states modelled |
| NW-13 | `rootCanvasFallback` refused valid colours its parser can't read (`NW-rootcanvas.js`). | `CSS.supports` where the browser has it |
| NW-14 | The console's `run()` warned twice about a near typo (`lcoale`), and warned about `report`, which `openReport` takes (`NW-console-run-keys.js`). | One shared `closestOptionKey` |
| NW-15 | `duplicate-id-aria`'s speed test bound (5 s) failed on a loaded machine. | 30 s |

### Accessible names and ARIA

| # | Finding | Fixed |
|---|---|---|
| NA-1 | `aria-prohibited-children` failed the APG navigation menubar, whose submenu `role=menu` sits beside its `menuitem` (`menubar-apg.js`). | Decided (§2): allowed |
| NA-2 | `nested-interactive-controls-absent` counted a `tabindex="-1"` control inside a tab, button or option, where ACT 307n5z counts only tab-order content (`nested-tabindex.js`). | Tab order only |
| NA-3 | A native element's implicit role between a role and its required context was ignored: `<div role=tablist><h3><button role=tab>` passed, the same with `<div role=heading>` failed (`interm*.js`). | Implicit role read; messages say "has the implicit role heading" |
| NA-4 | An ARIA textbox or `<div>` combobox in a name gave its `aria-label`, not its value (accname 2C) (`embedded-aria-textbox.js`, `emb.js`). | Content as value, as Chromium |
| NA-5 | `label-in-name` read every option of a drop-down `<select>` as visible label (`lin-select-target.js`). | The selected option only |
| NA-6 | An `<svg>`'s `<text>` named the link or button around it; Chromium gives "" (`svgtext.js`). | Decided (§2): follows Chromium |
| NA-7 | `aria-allowed-role` asked about DPUB roles ARIA in HTML allows on `section`, `aside`, `hr`, headings and `img` (`dpub.js`). | Allowed |
| NA-8 | An unnamed `<button role=tab>` (or switch, menuitem, link, option) was reported twice, by `button-name-present` and its role's rule (`button-role-double.js`). | Decided (§2) |
| NA-9 | `aria-hidden-focus` passed an aria-hidden scroll container Chromium 153 puts in the tab order (`scroller.js`). | Counted where laid out; `scrollable-region-focusable`'s message corrected |
| NA-10 | `region` never saw text directly in `<body>` (`region-text*.js`). | Reported on `<body>` |
| NA-11 | Three messages untrue: a `<canvas>`'s fallback "has no name", a `<th>` named by its checkbox "nameless", "is a option" (`canvas.js`, `th.js`, `misc-msgs.js`). | Reworded |

### Layout and visual rules

| # | Finding | Fixed |
|---|---|---|
| LY-1 | **An inset `box-shadow` under text was never read**: `#555` on a card darkened to about 1.2:1 passed at 7.46:1. | Composited where it fills the box; otherwise not computable |
| LY-2 | **`mask-image` was never read**: black text under a 20% mask, drawn at about 1.6:1, passed at 21:1; "read more" fades too. | Not computable (`blocker: mask-image`) |
| LY-3 | `css-focus-indicator-suppressed` took `box-shadow: none`, `border: 0`, `color: inherit`… beside `outline: none` for a replacement. | Only values that draw, and that differ from unfocused |
| LY-4 | `text-spacing-content-loss` never measured text in open shadow roots, and measured slotted text against its light-DOM parents. | Shadow roots walked, flat tree |
| LY-5 | Text in a `display: contents` box (a wrapper, a `<slot>`'s fallback) was `notApplicable` on all three contrast rules, even at 1.6:1. | Visible by its content's rects |
| LY-6 | Target size took only buttons, links and native controls: a row of 16px tabs, switches or menu items went unmeasured. | Decided (§2) |
| LY-7 | `link-in-text-block` took a link's underline as a cue in an underlined paragraph. | Compared with the surrounding text |
| LY-8 | A `box-shadow` that draws nothing counted as a link's cue. | Only a drawn shadow |
| LY-9 | Any `font-weight` difference counted as a link's cue (500 in 400). | Decided (§2) |
| LY-10 | Under forced colors, the browser's own placeholder and a drop-down select's colours gave other verdicts than without, against LAYOUT_MEASUREMENT.md. | Decided (§2): same verdicts |
| LY-11 | LAYOUT_MEASUREMENT.md and RULE_HELPERS.md described target size and reflow as they no longer work. | Docs corrected |
| LY-12 | `a:is(:focus)` was stripped to `a:is()`, which nothing parses, so the rule was skipped. | Empty `:is()` / `:where()` arguments dropped |
| LY-13 | `transform: scale()` was not counted in the drawn size: 12px text at `scale(2)` failed where `zoom: 2` passed. | Decided (§2); the ancestor walk then cached (47,575 steps to about 1,200 on 300 nested spans) |
| LY-14 | A custom button disabled through `ElementInternals.ariaDisabled` was held to contrast. | Exempt, as the attribute |
| LY-15 | `clip-path: inset()` and `clip: rect()` didn't count as clipping under the text spacing. | Clipping boxes at the shape's rectangle |

### Packs and the integrator's API

| # | Finding | Fixed |
|---|---|---|
| PK-1 | **In a scan of several profiles, a profile counting none of a check's findings gave `pass`**: a failure RAWeb alone reports vanished from SARIF, JUnit and baselines beside WAI-ARIA or WCAG (`p39-multi-invariant.js`, `p40-raweb-multi.js`). | Each profile keeps the outcome its own scan gives |
| PK-2 | A `Set` of names in `runOnly` was not read (`p16-legacy-set.js`). | Read as its list |
| PK-3 | A rule mapped only to 4.1.1 was scoped to the WCAG version only with its tag (`p36-parsing.js`, `p37-parsing-rollup.js`). | With or without |
| PK-4 | A caller's messages fell back to the engine's English before the caller's own (`p33-msg-fallback.js`). | The caller's English first |
| PK-5 | The catalog functions took under `strictOptions` what the scan refuses (`p03-catalog-strict.js`). | Same refusals, worded once |
| PK-6 | Replaced built-ins (`Array.isArray`, array and string methods, `Math`, `RegExp`…) changed results with no `PAGE_BUILTINS_BROKEN` (`p13-isarray.js`); with RO-5. | Probed at the start of the scan |
| PK-7 | A custom rule whose `wcagSc` names no criterion ran, though `definePack` refuses it (`p49-wcagsc-custom.js`). | Skipped |
| PK-8 | JUnit `includeNotApplicable` and the HTML report's `manualChecks` took values other than `true`/`false` (`p22-bool-opts.js`). | Refused |
| PK-9 | Standard data that holds itself, or nests too deep, was not reported (`p48-stddata-cycle.js`). | A problem |
| PK-10 | A pack changed in place after a scan ran its cached version silently (`p30-pack-mutate.js`). | Decided (§2) |
| PK-11 | An empty slot or blank name in a profile list passed (`p24-profile-holes.js`). | Said; refused under strict |
| PK-12 | A timestamp that isn't ISO 8601 was taken (`p38-timestamp.js`). | Refused under strict, dropped otherwise |
| PK-13 | The review dictionary's count, the baseline's internal exports' types, and occurrence tiers in another case. | Corrected |

### Robustness, speed and memory

| # | Finding | Fixed |
|---|---|---|
| RO-1 | `duplicate-id-aria` quadratic on repeated nested cards (`dupid-aria*.js`); with NW-5. | One pass |
| RO-2 | focus-not-obscured's own scrolling reached the page's `scroll` and `scrollend` listeners, so a page that loads a widget on first scroll changed under the next scan (`scroll-reaches-page.js`). | Held from the page's listeners; LIMITATIONS.md |
| RO-3 | Under jsdom, a form control's computed `text-shadow` depended on what was read before, so two scans of one DOM disagreed (`jsdom-textshadow-order.js`, `rescan-button-shadow*.js`). | Taken from the page's own rules, as Chromium |
| RO-4 | Text in a native `<marquee>` passed or failed contrast depending on when the scan ran, about one scan in fifteen (`marquee-contrast.js`, `rescan-marquee.js`). | Placed by the marquee's box |
| RO-5 | More built-ins whose replacement changed results silently (`builtins-unchecked.js`); with PK-6. | Probed |
| RO-6 | Custom elements overriding DOM members (`getAttribute`, `children`…) are read as they answer (`ce-getters*.js`). | Decided (§2): documented |

---

## 2. Decisions taken

All were taken on 2026-11-21, and acted on in #416.

- **NW-3:** an `<li>` in a list given a composite widget role (tablist, menu, menubar, listbox, combobox, tree, treegrid, grid, radiogroup, toolbar) fails again where drawn as a list item; under a landmark or structure role (navigation, group, region…) it is still asked about, leaning fail.
- **NA-1:** a submenu's `menu` (or `group`) inside a `menubar` or `menu` is allowed, as the APG does.
- **LY-6:** target size measures every interactive widget role (checkbox, combobox, menuitem…, option, radio, scrollbar, searchbox, slider, spinbutton, switch, tab, textbox, treeitem, and a `gridcell` with a `tabindex`), from a role attribute or `ElementInternals`.
- **NA-8:** an unnamed `<button role=X>` is reported only by role X's own name rule; one given `none`/`presentation`, or a role no rule names, stays with `button-name-present`.
- **LY-10:** under forced colors, verdicts stay those without forced colors.
- **LY-13:** a uniform transform scale counts toward the drawn size, and so toward large text, both ways.
- **NA-6 and LY-9 follow Chromium:** an SVG `<text>` names no link or button around the `<svg>`; a weight sets a link apart only where one side is 600 or more and the other under 600.
- **RO-6:** custom elements overriding DOM members: documented only.
- **PK-10:** a pack passed as a plain object is frozen on its first use in a scan, as `definePack` freezes one.

## 3. What is left

Two Low leftovers, recorded in the register's §1:
- `aria-valid-attr` still copies a whole very long `aria-*` attribute name into its finding;
- under jsdom, `getComputedStyle` dominates `duplicate-id-aria`'s time on big pages, now that the rule's own walk is linear.

## 4. Lesson: regressions from round 7

Round 8 found three regressions of round 7's fixes (NW-1, NW-2: the shadow-root hit test; NW-4: a pack's own verdict). Each round 7 fix had its regression test, but none checked the fix's neighbours. The light measures agreed for later fixes:
- **a regression test per fix**, as before;
- **a shadow-wrapping invariant test**: the same page with its icons and its sticky header's content in the light DOM or drawn in open shadow roots must give every target and focused link the same outcome (added in #416; it fails on `254b644f`);
- **one before/after diff of the scenario fixtures per branch**, rather than per commit.
