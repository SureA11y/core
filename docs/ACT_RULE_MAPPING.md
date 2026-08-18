# ACT rule mapping

Cross-reference between the [W3C ACT Rules](https://act-rules.github.io/rules/) (as published at act-rules.github.io) and this repo's rule catalog (`docs/RULE_CATALOG.md`). Built by matching rule names/descriptions and WCAG SC; not machine-generated, so treat close calls as a starting point for review rather than ground truth.

**Summary (117 active ACT rules, excludes 3 deprecated):**
- **54 confirmed direct or family matches** in our automatic/manual rules (`scripts/data/act-rule-map.json` is the machine-readable version of the table below)
- **~2** are covered structurally by our composite/rollup layer, not a named rule
- **~50 are gaps** — no corresponding rule in this repo, listed in [Gaps](#gaps-no-corresponding-rule) below

Being validated against ACT's own published test-case corpus (`scripts/act-testcase-check.js`) — matched-rule mismatches found so far are triaged as they're found (real bug vs. wrong mapping vs. scope difference); see "Judgment-call gaps found during test-case validation" below for the ones this has turned up so far. Two real rule bugs found and fixed this way: `button-name-present` wasn't crediting the UA-default label on `input[type=submit]`/`input[type=reset]` with no `value`, and wasn't honoring `role="none"`/`role="presentation"` conflict-resolution.

We also have automatic rules with **no ACT counterpart at all** (see [Extra coverage](#extra-coverage-beyond-act)) — mostly a finer-grained decomposition of ACT's single "form field has accessible name" rule into one rule per ARIA widget role.

## Matched rules

| ACT ID | ACT rule name | Our rule(s) | Match |
|---|---|---|---|
| `5f99a7` | ARIA attribute is defined in WAI-ARIA | `aria-valid-attr` | exact |
| `ff89c9` | ARIA required context role | `aria-required-parent` | exact |
| `bc4a75` | ARIA required owned elements | `aria-required-children` | exact |
| `6a7281` | ARIA state or property has valid value | `aria-valid-attr-value` | exact |
| `5c01ea` | ARIA state or property is permitted | `aria-allowed-attr` | exact |
| `80f0bf` | Audio/video avoids autoplaying audio | `no-autoplay-audio` (manual) | family |
| `4c31df` | Autoplaying audio/video has a control mechanism | `no-autoplay-audio` (manual) | family |
| `aaa1bf` | Autoplaying audio/video has no audio > 3s | `no-autoplay-audio` (manual) | family |
| `73f2c2` | Autocomplete attribute has valid value | `autocomplete-valid` | exact |
| `97a4e1` | Button has non-empty accessible name | `button-name-present` | exact |
| `cf77f2` | Bypass Blocks of Repeated Content | `bypass-blocks-present` (manual) | exact |
| `ye5d6e` | Instrument to move focus to non-repeated content | `bypass-blocks-present` (manual) | family |
| `047fe0` | Document has heading for non-repeated content | `bypass-blocks-present` (manual) | family |
| `b40fd1` | Document has a landmark with non-repeated content | `region` (manual) | family |
| `oj04fd` | Element in sequential focus order has visible focus | `css-hidden-focus` (manual) | family |
| `6cfa84` | Element with aria-hidden has no content in sequential focus nav | `aria-hidden-focus` | exact |
| `de46e4` | Element with lang attribute has valid language tag | `valid-lang` | exact |
| `4e8ab6` | Element with role attribute has required states/properties | `aria-required-attr` | exact |
| `e086e5` | Form field has non-empty accessible name | `form-control-programmatic-label-present`, `textbox-name-present`, `combobox-name-present`, `listbox-name-present`, `searchbox-name-present`, `slider-name-present`, `spinbutton-name-present` | family (we split by widget role) |
| `cc0f0a` | Form field label is descriptive | `form-control-programmatic-label-quality` (manual) | exact |
| `a25f45` | Headers attribute refers to cells in same table | `table-headers-attr-valid` | exact |
| `ffd0e9` | Heading has non-empty accessible name | `empty-heading` (manual) | family |
| `b5c3f8` | HTML page has lang attribute | `html-lang-attr-present` | exact |
| `2779a5` | HTML page has non-empty title | `page-title-present` | exact |
| `5b7ae0` | HTML page lang/xml:lang attributes match | `html-xml-lang-mismatch` | exact |
| `bf051a` | HTML page lang attribute has valid language tag | `valid-lang` | partial (page-level case only) |
| `c4a8a4` | HTML page title is descriptive | `page-title-patterns` (manual) | exact |
| `cae760` | Iframe element has non-empty accessible name | `iframe-name-present` | exact |
| `akn7bn` | Iframe with negative tabindex has no interactive content | `iframe-focusable-content` | exact |
| `qt1vmo` | Image accessible name is descriptive | `img-alt-quality` (manual) | exact |
| `59796f` | Image button has non-empty accessible name | `input-image-alt-present` | exact |
| `23a2a8` | Image has non-empty accessible name | `img-alt-present` | exact |
| `e88epe` | Image not in the accessibility tree is decorative | `img-alt-decorative` (manual) | exact |
| `24afc2` | Letter spacing in style attrs not `!important` | `avoid-inline-spacing` | exact |
| `78fd32` | Line height in style attrs not `!important` | `avoid-inline-spacing` | exact (combined rule) |
| `9e45ec` | Word spacing in style attrs not `!important` | `avoid-inline-spacing` | exact (combined rule) |
| `c487ae` | Link has non-empty accessible name | `link-name-present` | exact |
| `aizyf1` | Link is descriptive | `link-name-quality` (manual) | exact |
| `fd3a94` | Links with identical names + same context, equivalent purpose | `identical-links-same-purpose` (manual) | exact |
| `b20e66` | Links with identical accessible names, equivalent purpose | `identical-links-same-purpose` (manual) | exact |
| `m6b1q3` | Menuitem has non-empty accessible name | `menuitem-name-present` | exact |
| `bc659a` | Meta element has no refresh delay | `meta-refresh-timing-absent` | exact |
| `bisz58` | Meta element has no refresh delay (no exception) | `meta-refresh-no-exceptions` | exact |
| `b4f0c3` | Meta viewport allows for zoom | `meta-viewport-zoom-enabled` | exact |
| `8fc3b6` | Object element rendering non-text content has accessible name | `object-text-alternative-present` | exact |
| `b33eff` | Orientation not restricted via CSS transform | `css-orientation-lock` | exact |
| `674b10` | Role attribute has valid value | `aria-roles-valid` | exact |
| `0ssw9k` | Scrollable element is keyboard accessible | `scrollable-region-focusable` (manual) | exact |
| `7d6734` | SVG element with explicit role has accessible name | `svg-text-alternative-present`, `role-img-text-alternative-present` | family |
| `d0f69e` | Table header cell has assigned cells | `table-th-has-data-cells` | exact |
| `09o5cg` | Text has enhanced contrast | `contrast-enhanced` | exact |
| `afw4f7` | Text has minimum contrast | `contrast-minimum` | exact |
| `f51b46` | Video auditory content has captions | `video-caption` (manual) | partial |
| `2ee8b8` | Visible label is part of accessible name | `label-in-name` | exact |

Structural (not a named rule, but the check exists via a different mechanism):
- `off6ek` / `ucwvc8` (language subtag matches page/default language) — partially overlaps `html-xml-lang-mismatch` + `valid-lang` but not a full match.

## Gaps (no corresponding rule)

Grouped by theme, with WCAG SC where ACT declares one:

**Audio/video alternatives (1.2.x)** — largest gap cluster, 12 ACT rules: `1a02b0`, `e7aa44`, `2eb176`, `afb423`, `eac66b`, `ab4d13`, `c5a4ea`, `1ea59c`, `1ec09b`, `c3232f`, `d7ba54`, `ee13b5`, `fd26cf`. We only have `video-caption` and `media-alternative-transcript-evidence` (both manual/low-confidence) — full media-alternative testing (transcripts, audio description, sign language equivalence) is unimplemented.

**Keyboard trap (2.1.2)** — 3 rules: `80af7b`, `ebe86a`, `a1b64e`. No automated keyboard-trap detection at all today.

**Sensory/visual gaps:**
- `9bd38c` Content has alternative for visual reference (1.3.3, sensory characteristics)
- `0va7u6` HTML graphics contain no text (1.4.5, images of text)
- `59br37` Zoomed text node not clipped by CSS overflow (1.4.10, reflow)
- `36b590` Error message describes invalid form field value (3.3.1)
- `b49b2e` Heading is descriptive (full quality check; we only catch emptiness)

**Context-aware link purpose:**
- `5effbb` Link in context is descriptive (2.4.4) — see the judgment-call note below; needs `link-name-quality` to weigh surrounding context, not just the bare name

**Motion/input (2.5.4, 2.1.4):**
- `7677a9` / `c249d5` Device motion actuation has UI alternative / can be disabled
- `ffbc54` No keyboard shortcut uses only printable characters

**Structural/HTML validity:**
- `e6952f` Attribute is not duplicated (raw HTML parsing-level check)
- `3ea0c8` Id attribute value is unique (we only check `duplicate-id-aria`, i.e. IDs referenced by ARIA — not all IDs page-wide)
- `efbfc7` Auto-updating text content can be paused/stopped/hidden (2.2.2, beyond meta-refresh)
- `307n5z` Element with presentational children has no focusable content
- `46ca7f` Element marked as decorative is not exposed
- `3e12e1` Block of repeated content is collapsible

**Judgment-call gaps found during test-case validation:**
- `4b1c6c` "Iframes with identical accessible names have equivalent purpose" was originally mapped to `iframe-title-unique`, but running ACT's own test cases against it exposed that they test different things: ACT's rule accepts a duplicate name when the two iframes point to equivalent content (same resource, mirrors, equivalent ads/sections) and only fails when duplicate-named iframes point to genuinely different content — a content-equivalence judgment call, the same class of check as our existing manual `identical-links-same-purpose`. `iframe-title-unique` instead flags *any* duplicate `title` attribute outright, deliberately and by design (see its own header comment) — a stricter, different, independently-valid check with no ACT counterpart of its own. Moved to "Extra coverage" below; `4b1c6c` itself stays a gap — closing it for real would mean a new manual `identical-iframes-same-purpose`-style rule, not a fix to `iframe-title-unique`.
- `5effbb` "Link in context is descriptive" was originally mapped to `link-in-text-block` on a name-similarity guess ("link" + "context/text"); its real applicability/expectation (fetched directly from act-rules.github.io) is "the accessible name together with its programmatically determined link context describes the purpose of the link" — WCAG 2.4.4, the *context-aware* sibling of `aizyf1`/`link-name-quality`, completely unrelated to `link-in-text-block`'s WCAG 1.4.1 color-distinguishability check (which is itself correctly and deliberately scoped to `a[href]` only, per its own header comment — not a bug). `link-name-quality`'s own header comment already documents that it doesn't consider surrounding context ("this check does not verify whether surrounding context... makes the purpose clear"), so `5effbb` stays an explicit gap rather than a forced match — closing it would mean teaching `link-name-quality` to weigh adjacent text/`aria-describedby`, a real scope expansion, not a quick fix.
- `identical-links-same-purpose`/`identical-links-same-purpose` (`fd3a94`, `b20e66`) are confirmed correct matches, but their `a[href]`-only scope (deliberate, using the DOM `.href` property for destination resolution) genuinely cannot cover `role="link"` elements without a real `href` — ACT's test corpus includes `<div role="link" tabindex="0" onclick="location='...'">`-style cases specifically to test this, and there is no static-DOM-readable destination for those (the target lives inside a JS string, not markup). This is a real, structural gap in the same family as the "dynamic/post-interaction state" limitation in `docs/LIMITATIONS.md`, not something to patch here.

## Extra coverage beyond ACT

Rules in this repo with no ACT counterpart — mostly finer decomposition of ACT's single `e086e5` "form field has accessible name" rule into one rule per ARIA widget type, plus some ARIA-validity and structural rules ACT doesn't break out separately:

`aria-hidden-body`, `aria-braille-equivalent`, `aria-conditional-attr`, `aria-deprecated-role`, `aria-prohibited-attr`, `aria-prohibited-children`, `aria-role-name-present`, `binary-control-name-present`, `canvas-text-alternative-present`, `combobox-name-present`, `contrast-computable`, `definition-list-children-valid`, `deprecated-elements-not-used`, `dialog-name-present`, `dlitem-parent-valid`, `duplicate-id-aria`, `embed-text-alternative-present`, `form-control-single-label`, `iframe-title-unique`, `list-children-valid`, `listbox-name-present`, `listitem-parent-valid`, `meter-name-present`, `nested-interactive-controls-absent`, `option-name-present`, `progressbar-name-present`, `searchbox-name-present`, `server-side-image-map-absent`, `slider-name-present`, `spinbutton-name-present`, `summary-name-present`, `svg-image-text-alternative-present`, `tab-name-present`, `target-size-minimum`, `td-has-header`, `textbox-name-present`, `tooltip-name-present`, `treeitem-name-present`, `video-poster-text-alternative-present`, `area-alt-present`.

## Next steps

1. **Validate matched rules against ACT's official test cases** (highest value — catches false pass/fail in existing rules). ACT rules each link to a test-case page with expected-pass/expected-fail HTML snippets.
2. **Prioritize gaps** — the audio/video cluster is large but likely low-ROI for automation (most require human judgment on transcript accuracy). Keyboard-trap detection and page-wide ID uniqueness (`3ea0c8`) look like the more tractable, higher-value gaps to close first.
