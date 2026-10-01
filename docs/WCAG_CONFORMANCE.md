# WCAG conformance mapping guide

How individual rule results relate to a WCAG Success Criterion (SC), and what surea11y can and cannot tell you about overall conformance.

## The three layers

1. **Atomic rules** (`checksResults[]`) — one normative decision each, e.g. "does this `<img>` have an `alt` attribute." See [`RULE_CATALOG.md`](./RULE_CATALOG.md) for all 130.
2. **Facets** — a WCAG SC is usually bigger than any one rule can decide deterministically. Internally, each SC is broken into named "facets" (e.g. 1.1.1 Non-text Content has facets like `img-alt-attr-present`, `text-alternative-quality`, `decorative-null`) tracked in `src/coverage/wcag-facets.js`, each marked `full` (a rule decides it with high confidence), `partial` (a rule decides *part* of it — see each rule's own scope notes), or `manual` (no safe automated heuristic exists at all). Run `npm run coverage` to regenerate `coverage/coverage-report.md`, the per-SC facet breakdown.
3. **Composite (WCAG-SC rollup) rules** (`rulesResults[]`) — a generated aggregate of every atomic rule mapped to one SC, giving you one pass/fail/cantTell/notApplicable verdict per SC instead of having to roll up dozens of atomic results yourself. See [`RULE_CATALOG.md`](./RULE_CATALOG.md#composite-wcag-sc-rollup-rules-33) for the full list (e.g. `wcag-1.1.1-non-text-content` rolls up 22 atomic rules).

## How a composite's outcome is computed

Deterministic precedence, evaluated over that composite's atomic contributors:

| Condition | Composite outcome |
|---|---|
| Any contributor `fail` | `fail` |
| No `fail`, but any contributor `cantTell` **or** a listed contributor didn't run at all | `cantTell` |
| Every contributor `notApplicable` | `notApplicable` |
| Otherwise (all ran, none failed/cantTell, not all N/A) | `pass` |

This means: **a composite `pass` is a real, deterministic "every applicable automated check for this SC came back clean" — but it is not a WCAG conformance claim on its own.** If any facet of that SC has no automated coverage at all (see `coverage-report.md`), a composite `pass` is silent about that facet, not asserting it's fine. Cross-check the facet table before treating a composite `pass` as "SC fully verified."

A composite's `data.details.contributors` array (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#a-composite-result-rulesresultsi)) lists every atomic rule and its individual outcome — use this to see exactly which facet(s) drove a `fail`/`cantTell`, rather than treating the composite as a black box.

## Targeting a conformance level (A / AA / AAA)

Pass `runOnly.tags` (or `engineOptions.tags.include`) with the level tags you want:

```js
// WCAG 2.0 A and AA. Both tags are required: they are not cumulative.
runDomRulesInPage(url, null, {}, { tags: ['wcag2a', 'wcag2aa'] });
```

**Level tags do not nest, and this is the easiest thing to get wrong here.** A rule
carries one level tag per Success Criterion it maps to, and nothing more: a rule
mapped only to an AA criterion is tagged `wcag2aa` and *not* `wcag2a`. Asking for
`{ tags: ['wcag2aa'] }` on its own therefore runs the 10 rules mapped to a 2.0 AA
criterion, not the ~100 that make up an A + AA target. List every level you mean.
`engineOptions.profile` (`wcag22-aa`, `en301549-v4.1.1`, `en301549-v3.2.1`, `section508`, `rgaa-4.1.2`) does
this for you; see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#conformance-profiles).

The same applies across WCAG versions — a criterion introduced in 2.1 or 2.2 carries
only its own origin tag — so a full conformance target is a union of tag sets. See
[`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#filtering-by-wcag-version-21-vs-22) for the
ready-made sets per version, including the one criterion WCAG 2.2 removed rather than
added.

**The removed criterion is handled for you.** Every run resolves a target WCAG version
(`engineOptions.wcagVersion`, else whatever your version tags imply, else `2.2`) and
reports it back as `engine.wcagVersion`. Under a 2.2 target, a rule mapped only to SC
4.1.1 Parsing cannot report `fail` — it runs, reports its occurrences, and comes back
`cantTell` with a `wcagVersionScope` field explaining the coercion. So a default scan
never gates on a criterion WCAG 2.2 does not contain, and a 2.0/2.1 scan still gets a
real 4.1.1 verdict.

Composites, unlike atomic rules, *are* filtered cumulatively. The runner reads the
highest level named in `tags` and drops every composite above it, so requesting
`['wcag2a', 'wcag2aa']` returns no `rulesResults` entry for an AAA-only SC. That is
`inferTargetLevelFromRunOnly`/`isAllowedByTargetLevel` in `src/core/dom-runner.js` if
you need the exact precedence.

Omit `tags` entirely (the default) and every rule at every level runs, with no composite
suppression.

## EN 301 549

Chapter 9 of EN 301 549 restates the WCAG Level A and AA Success Criteria as clauses numbered `9.` plus the criterion's own number: WCAG 1.4.3 is clause 9.1.4.3. When a scan asks for them, every atomic and composite result carries, after its WCAG entries in `meta.normativeMappings`, the clause for each of its criteria, once per version of the standard that includes that criterion. A scan asks with `engineOptions.mappings: ['en301549']` (both versions) or `['en301549:V3.2.1']` (one), or by targeting an EN 301 549 profile, which adds the version it names; by default results name WCAG only (see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#other-standards-mappings)):

| Version | Built on | Differs from the other in |
|---|---|---|
| V3.2.1 (2021-03) | WCAG 2.1 A and AA, 50 criteria | Includes 9.4.1.1 Parsing |
| V4.1.1 (2026-09) | WCAG 2.2 A and AA, 55 criteria | Adds 2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8; 9.4.1.1 is void |

Each clause entry also names the criterion it restates, as `wcagSc: ["1.4.3"]`, so a view grouped by criterion (JUnit's suites, the HTML report's rollup) puts it under the right one even on a rule mapped to several.

AAA criteria have no clause in either version. The table lives in `src/coverage/en301549-map.js`, taken from the ETSI text; rules never declare these entries themselves, the build derives them from each rule's WCAG mapping. A rule added through `engineOptions.customRules` keeps exactly the mappings it declares. The catalogs name the clauses under the same options: `getChecksCatalog({ mappings: ['en301549'] })` in each entry's `normativeMappings`, and composite entries returned by `getRulesCatalog({ mappings: ['en301549'] })` as `meta.standardMappings`, so the clauses a criterion maps to can be read without running a scan. Called with no options, they name WCAG only, as a result does.

The table is public as `@surea11y/core/en301549`, for tools that need the reverse view, such as which criteria a version requires that a scan did not cover:

```js
const { EN301549_CLAUSES, en301549ClausesForSc } = require('@surea11y/core/en301549');

Object.keys(EN301549_CLAUSES['V3.2.1']);  // the 50 WCAG 2.1 A and AA criteria V3.2.1 restates
en301549ClausesForSc('2.5.8');            // [{ version: 'V4.1.1', clause: '9.2.5.8', title: 'Target size (minimum)' }]
```

This is a correspondence between two published documents, not a conformance claim: a clause on a result says which EN 301 549 requirement that WCAG criterion is, nothing more. Which version a given law requires is outside the engine.

## RGAA

RGAA (Référentiel général d’amélioration de l’accessibilité) is the French standard. Unlike EN 301 549 it does not restate WCAG criterion by criterion: its 106 criteria, in 13 themes, are its own, each checked by one or more tests (258 in all), and RGAA itself states which WCAG criteria each one relates to. The relation runs many to many. WCAG 1.1.1 alone relates to 19 RGAA criteria, across images, media, scripts and consultation.

The engine carries RGAA 4.1.2, the version in force, built on WCAG 2.1. Its criteria relate to every WCAG 2.1 Level A and AA criterion except 1.2.4 Captions (Live), which no RGAA 4.1.2 criterion references.

The table is public as `@surea11y/core/rgaa`, in RGAA's own French wording:

```js
const { RGAA_THEMES, RGAA_CRITERIA, RGAA_TESTS, rgaaCriteriaForSc } = require('@surea11y/core/rgaa');

RGAA_CRITERIA['4.1.2']['11.1'];
// { theme: 11, title: 'Chaque champ de formulaire a-t-il une étiquette ?',
//   wcagSc: ['1.3.1', '2.4.6', '3.3.2', '4.1.2'], techniques: ['G82', …], tests: ['11.1.1', '11.1.2', '11.1.3'] }
RGAA_TESTS['4.1.2']['11.1.1'].conditions;  // what the test enumerates, when it does
rgaaCriteriaForSc('1.1.1');               // [{ version: '4.1.2', criterion: '1.1', title: '…' }, …]
```

### RGAA tests on scan results

With `engineOptions.mappings: ['rgaa']`, every result names the RGAA tests its rule checks: `{ standard: "RGAA", version: "4.1.2", requirement: "1.1.1", title, criterion: "1.1", wcagSc: ["1.1.1"] }`, where `requirement` is the test, `title` its wording and `criterion` the criterion it belongs to. A composite names the tests of the rules that produced its outcome, among those RGAA relates to its criterion: the failing rules' tests when it fails, the undecided rules' when it is `cantTell`, the passing rules' when it passes, and none when it is `notApplicable`. Its catalog entry (`getRulesCatalog`) still lists the tests of every rule it groups. EN 301 549 clauses are not narrowed this way: a clause restates the composite's own criterion, whichever rule decided. SARIF tags them `rgaa-1.1.1`, JUnit adds `rgaa` properties, and the HTML report lists them under each criterion.

Because the relation is many to many, a rule's tests cannot be derived from its WCAG criteria the way an EN 301 549 clause is. They are stated rule by rule in `src/coverage/rgaa-rule-map.js`, under one rule: a rule maps to a test when its failure (or, for a manual rule, the question it raises) is direct evidence about what the test's official methodology checks, on the same kind of element. Covering one step of a test is enough; sharing a WCAG criterion is not. Each row says which step and why. The build rejects an unknown rule or test, and a test whose criterion RGAA relates to none of the rule's WCAG criteria. A rule with no WCAG mapping may map to any test, since RGAA checks some things WCAG leaves to best practice, such as heading hierarchy (9.1.1) and landmarks (9.2.1). A few links go against RGAA's correspondence on purpose: `<img ismap>` is what RGAA 1.1.4 looks for, although RGAA files 1.1.4 under WCAG 1.1.1 and the engine files the rule under 2.1.1. Such a row lists the test in `outsideCorrespondence` with the reason, the build refuses the link without one, and the entry is filed under the rule's own WCAG criteria. `RGAA_MAPPING.md` marks these tests "(exception)".

126 of the 202 rules map to at least one test, and together they reach 51 of the 106 criteria. [`RGAA_MAPPING.md`](./RGAA_MAPPING.md) lists every rule's tests with the reason, and every criterion with the rules that speak to it, including the 55 no rule reaches.

`profile: 'rgaa-4.1.2'` targets RGAA directly: it runs the WCAG 2.1 A and AA rules, every rule mapped to an RGAA test (including those with no WCAG mapping, such as `heading-order`), and the opt-in rules for RGAA's own requirements, tagged `rgaa`, which no other profile runs (see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#opt-in-rules)); it also switches on the RGAA mapping. To see them without targeting RGAA, `engineOptions.optInRules: 'all'` with no profile runs every rule the engine has, RGAA's included.

Nineteen opt-in rules decide RGAA requirements WCAG does not make, each deciding exactly what the RGAA test's procedure checks:

| Rule | RGAA | Fails when |
|---|---|---|
| `doctype-present` | 8.1.1 | the page has no doctype |
| `doctype-position` | 8.1.3 | with the `page.source` probe (the start of the response body), the doctype comes after the `<html>` tag; a doctype in the DOM passes, since the parser keeps one only before `<html>`. With no doctype in the DOM and no probe, it asks |
| `markup-validation-review` | 8.2.1 | the W3C validator's report on the generated source, given as the `validator.report` probe, lists an error (CSS messages and warnings aside). A clean report passes. Without a report, or with one on the original source, it asks, since the DOM no longer shows the errors the parser repaired and RGAA validates the generated source |
| `doctype-valid` | 8.1.2 | the doctype is neither HTML5 nor a W3C recommended one |
| `html-nesting-valid` | 8.2.1 | the page has a nesting error the W3C validator reports: list or description-list content, interactive content or `tabindex` inside `<a>` or `<button>`, `<img ismap>` outside a link, a second `<main>` without `hidden`; hidden content included |
| `html-elements-attributes-valid` | 8.2.1 | the page has an obsolete or unknown element, or a `dir`, `id`, `lang`, `xml:lang`, `scope`, `headers`, `optgroup` label, image-button `alt` or `autocomplete` value the W3C validator rejects; hidden content included |
| `aria-role-conformance` | 8.2.1 | a `role` attribute has an error the W3C validator reports: empty, a token that is not a role it accepts, a role the element does not allow, or a role on an `<img>` with an empty or missing alt (`role="presentation"` there is asked about); hidden content included |
| `aria-attribute-conformance` | 8.2.1 | an `aria-*` attribute has an error the W3C validator reports: unknown, an invalid value, not allowed on the element or role, naming an element that cannot be named, contradicting a native attribute, or a required attribute missing; hidden content included |
| `presentational-elements-absent` | 10.1.1 | the page uses an element RGAA lists (`<font>`, `<center>`, `<big>`, `<s>`, …; `<u>` too without the HTML5 doctype) |
| `presentational-attributes-absent` | 10.1.2 | an HTML element carries an attribute RGAA lists (`align`, `bgcolor`, `border`, …), with RGAA's exceptions for `size`, `width` and `height` |
| `optgroup-label-present` | 11.8.2 | an `<optgroup>` in a `<select>` has no `label` attribute |
| `page-title-unique` | 8.6.1 | another page of the site, given in the `crawl.pageTitles` probe, has the same title at another path (the glossary asks for a title that identifies the page « de manière claire, concise et unique »). It asks when the other address differs only by its query string, and when no other page is given |
| `skip-link-placement` | 12.7.2 | in a browser, the skip link is not visible even when it takes focus; with the `crawl.skipLinks` probe, another page measured at the same window width shows it more than 24px away. It asks when its focus order differs between pages, when only one page is available, when something may cover it, and in jsdom |
| `label-for-target-valid` | 11.1.2 | a `<label for>` matches no id, an empty one, or an element that is neither labelable nor an ARIA form field |
| `layout-table-no-data-markup` | 5.8.1 | a table with `role="presentation"` or `"none"` has a caption, header cells, `thead`, `tfoot`, `colgroup`, a non-empty `summary`, or cells with `scope`, `headers` or `axis` (a table that looks like a data table is asked about instead) |
| `figure-caption-structure` | 1.9.1 | a `<figure>` holding an image and a `<figcaption>` has no `role="figure"` or `"group"`, or no `aria-label` identical to the caption |
| `video-captions-track-kind` | 4.3.2 | a `<video>` has subtitle tracks in its own language but none with `kind="captions"` and a `src` (subtitles that may be a translation are asked about) |
| `dir-attribute-valid` | 8.10.2 | a `dir` attribute is anything but exactly `ltr` or `rtl`, and `auto` on text that reads in the opposite direction |
| `svg-hidden-no-alternative` | 1.2.4, 1.1.5 | an `<svg aria-hidden="true">` carries a text alternative (`aria-label`, `aria-labelledby`, `title`, or a non-empty `<title>` or `<desc>`), on itself, its content or what it draws through `<use>` |

They follow RGAA's lists as written, so `width` on an `<iframe>` and `size` on an `<input>` are reported, and `<s>` is, although HTML allows it.

Ten more are manual: they cannot decide, so they point a person at what to check and return `cantTell`, never `fail`:

| Rule | RGAA | Asks about |
|---|---|---|
| `field-group-legend` | 11.6.1 | a `<fieldset>` holding form fields with no `<legend>`, or a `role="group"` or `"radiogroup"` with no `aria-label` or `aria-labelledby` |
| `radio-group-present` | 11.5.1 | radio buttons sharing a name that are not all in one `<fieldset>`, `role="group"` or `role="radiogroup"` |
| `fake-list` | 9.3.1, 9.3.2 | lines or paragraphs starting with the same bullet, or with consecutive numbers, that are not marked up as a list |
| `letters-spaced-with-spaces` | 10.1.3 | four or more single letters in a row separated by spaces (`S O L D E S`), or three capitals that form an element's whole text |
| `image-alt-long` | 1.3.9 | a text alternative from any source, on any kind of image, longer than 80 characters (RGAA gives no number; 80 is a threshold for asking) |
| `complex-table-summary` | 5.1.1 | a table with headers beyond its first row and column, cells using `headers`, `scope="rowgroup"`/`"colgroup"` or headers spanning groups, with no `aria-describedby`, nor a `summary` outside HTML5 |
| `office-document-link` | 13.3.1 | each link, `download` attribute, query-string value or form action naming a `.pdf`, `.epub`, `.rtf`, Word, Excel, PowerPoint or OpenDocument file |
| `scripted-components-review` | 7.1.1–7.1.3 | every scripted component on a page with script, listing the elements that look like one (widget roles, `tabindex`, inline handlers, `contenteditable`, `aria-expanded` and similar) |
| `data-table-headers-review` | 5.6.1, 5.6.2 | a table of two rows and two columns or more with no header cell at all: only a person can say whether it is a data table whose first row or column holds headers |
| `embedded-refresh-review` | 13.1.1 | each `<object>`, `<embed>` and `<canvas>`, and each `<svg>` with a `<script>`, which 13.1.1 lists as refresh methods; still images are left out |

Criterion 7.1 always asks for a manual check through `scripted-components-review`, unless the page contains no script at all: no executable script element, inline handler, `javascript:` URL or custom element. The engine cannot see behaviour attached from script files, so the absence of findings says nothing about the page's scripted components. A missing name on a widget is reported under 11.1 when RGAA counts it as a form field (`role="slider"`, `"searchbox"`, `"option"`) and under 11.9 for a button; on a tree, grid, tab, menu item or dialog it fails 7.1.1.

Where RGAA judges a check differently from WCAG, the WCAG rule keeps its behaviour and no longer links the RGAA test, and a separate opt-in rule reports that test with RGAA's verdict. One run under the profile can then show a WCAG rollup that passes and an RGAA rollup that fails for the same element, or the reverse, each right for its standard. These rules fail only where RGAA's text makes the failure certain, and ask otherwise:

| Rule | RGAA | Instead of | Fails when |
|---|---|---|---|
| `role-img-aria-name` | 1.1.1 | `role-img-text-alternative-present` | an element with `role="img"` has no `aria-labelledby` or `aria-label`; a `title` alone does not count |
| `area-alt-source` | 1.1.2 | `area-alt-present` (1.1.2 kept) | a linked `<area>` is named only by `title` or `aria-labelledby`, which 1.1.2 does not list |
| `svg-role-img` | 1.1.5 | `svg-text-alternative-present` (1.1.5 kept) | an `<svg>` with a text alternative has no `role="img"` |
| `object-image-role-img` | 1.1.6 | `object-text-alternative-present` | an `<object type="image/…">` has no alternative, no fallback content and no link or button after it |
| `embed-image-role-img` | 1.1.7 | `embed-text-alternative-present` | the same for `<embed type="image/…">` |
| `canvas-role-img` | 1.1.8 | `canvas-text-alternative-present` | a `<canvas role="img">` has no `aria-labelledby` or `aria-label`, or a canvas without the role has no fallback content |
| `img-decorative-no-alternative` | 1.2.1 | `presentation-role-conflict` | an `<img aria-hidden="true">` still carries `aria-label`, `aria-labelledby` or `title` |
| `canvas-decorative-aria-hidden` | 1.2.5 | – | a canvas marked decorative has no `aria-hidden="true"`, or still carries an alternative |
| `frame-title-attribute-present` | 2.1.1 | `iframe-name-present` | an `<iframe>` or `<frame>` has no `title` attribute, even when `aria-label` names it or it has `tabindex="-1"` |
| `frame-title-not-empty` | 2.2.1 | `identical-iframes-same-purpose` | a frame's `title` attribute is empty or only spaces |
| `contrast-minimum-rgaa` | 3.2.1–3.2.4 | `contrast-minimum` | text has less contrast than RGAA asks, with RGAA's sizes: bold text is large from 18.5px, where WCAG uses 14pt (about 18.67px) |
| `media-transcript-adjacent` | 4.1.1–4.1.3 | `media-alternative-transcript-evidence` | never fails: passes media with a transcript, or a link or button to one, right before or after it, and asks about the rest |
| `complex-table-summary-quality` | 5.2.1 | `table-duplicate-name` | never fails: asks whether a complex table's summary (its caption, its `aria-describedby`, or before HTML5 its `summary`) explains the table |
| `th-scope-row-col` | 5.7.2, 5.7.3 | – | never fails: asks about a `<th>` with `scope="rowgroup"` or `"colgroup"`, which RGAA 5.7.2 and 5.7.3 do not list |
| `link-context-review` | 6.1.1–6.1.4 | `link-name-quality` (kept) | never fails: asks about a generic link whose only context is an `aria-describedby` text or a `<dd>`, `<dt>`, `<blockquote>` or `<figcaption>`, which RGAA does not count as link context |
| `link-label-in-name-sources` | 6.1.5 | `label-in-name` | a link's `title`, `aria-label` or `aria-labelledby` text does not contain its visible text, even when that source is not the one that names it |
| `link-content-label-present` | 6.2.1 | `link-name-present` | a link has no text or image alternative in its content, even when `aria-label`, `aria-labelledby` or `title` names it |
| `widget-label-in-name` | 7.1.3 | `label-in-name` | a tab, menu item, tree item, grid cell or option has an accessible name that does not contain its visible text |
| `keyboard-only-event-handlers` | 7.3.1 | – | never fails: asks about an element with an inline key handler and no click or pointer handler, since RGAA also wants pointer access |
| `page-language-present` | 8.3.1 | `html-lang-attr-present` | some displayed text has no language on it or on a parent; `lang` on `<body>` is enough, and `xml:lang` alone passes on XHTML 1.1 and is asked about elsewhere |
| `html-lang-code-valid` | 8.4.1 | `html-lang-attr-present` | the code before the first hyphen of the page's `lang` or `xml:lang` is not an ISO 639 code; ISO 639-2 codes such as `fra` pass |
| `heading-content-present` | 9.1.2 | `empty-heading` | a heading has no text and no image alternative in its content |
| `heading-role-level-present` | 9.1.3 | – | an element with `role="heading"` has no numeric `aria-level` |
| `main-element-structure` | 9.2.1 | `landmark-one-main`, `landmark-no-duplicate-main` | on an HTML5 page, `role="main"` is used with no `<main>`, or a second `<main>` lacks the `hidden` attribute, even when CSS or `aria-hidden` hides it |
| `aria-list-item-roles` | 9.3.1, 9.3.2 | `aria-required-children`, `aria-required-parent`, `aria-prohibited-children` | never fails: asks about a `role="list"` whose children do not all have `role="listitem"` |
| `viewport-zoom-review` | 10.4.2 | `meta-viewport-zoom-enabled` | never fails: asks about a viewport that limits zoom, since RGAA also accepts the browser's text or page zoom or a zoom control on the site |
| `link-state-colors-review` | 10.6.1 | `link-in-text-block` (kept) | in a browser, a link shown only by colour has a visited, active, hover or focus state in another colour, with no other mark, below 3:1 against the surrounding text; it asks when the browser's own visited colour applies, and in jsdom it only asks |
| `focus-indicator-contrast` | 10.7.1 | – | an outline, border or box-shadow that a focus rule draws in place of the browser outline has less than 3:1 contrast with the colours next to it |
| `field-label-listed-source` | 11.1.1 | the field-name rules, `form-control-programmatic-label-present` | a form field, as RGAA's glossary lists them, has none of the label sources 11.1.1 lists: a placeholder, the field's own content or an `<output>`'s value do not count |
| `title-placeholder-identical` | 11.2.2 | – | never fails: asks about a field whose `title` and `placeholder` are both present but differ, since RGAA's glossary wants them identical |
| `field-label-in-name-sources` | 11.2.5 | `label-in-name` | a field's `aria-label`, `aria-labelledby` text, `title` or `<label>` does not contain its visible label |
| `listbox-option-groups-absent` | 11.8.1 | – | a `role="listbox"` groups its options with `role="group"`, which RGAA 11.8 does not accept in place of `<select>` and `<optgroup>` |
| `optgroup-label-not-empty` | 11.8.3 | – | an `<optgroup>` in a `<select>` has an empty `label` |
| `form-button-name-present` | 11.9.1 | `button-name-present` | a button inside a form has no label; a button outside any form is not applicable |
| `form-button-label-in-name-sources` | 11.9.2 | `label-in-name` | a button in a form has an accessible name that does not contain its visible label; another source that does not is asked about |
| `page-zones-reachable` | 12.6.1 | `bypass-blocks-present` | never fails: passes when the header, main navigation, main content, footer and search areas each have a landmark matching them, and asks about an area found from its id or class that has none, and about a page with no main landmark; WCAG 2.4.1 is met by one bypass mechanism for the whole page |
| `skip-link-present` | 12.7.1 | `bypass-blocks-present` | navigation comes before `<main>` with no working link to the main content, or a skip link points nowhere |
| `meta-refresh-no-url-timing` | 13.1.1 | `meta-refresh-timing-absent` | a meta refresh reloads the page more often than every 20 hours |
| `meta-redirect-immediate` | 13.1.2 | `meta-refresh-timing-absent` | never fails: an immediate redirect passes and a delayed one is asked about, since a redirect from an obsolete address is outside 13.1 |
| `orientation-content-parity` | 13.9.1 | – | in a browser, laid out as portrait and as landscape, content shown in one orientation is hidden in the other and its text is shown nowhere else there; it asks when what is hidden holds the main content or has no text, and in jsdom it asks about each element an orientation media query hides |

Under the profile, `rulesResults` also gets one rollup per RGAA criterion a rule is linked to, next to the WCAG ones: `rgaa-4.1.2-9.1` groups the heading rules, `rgaa-4.1.2-8.1` the doctype rule. Each has RGAA's wording as its title, `meta.standard: "RGAA"` and `data.details.criterion`, and follows the same outcome rules as a WCAG rollup, naming the RGAA tests of the rules that decided it. Some RGAA findings belong to no WCAG rollup at all (heading order, the doctype, presentational markup), so these rollups are the only place a consumer reading `rulesResults` alone sees them. Like RGAA-only rules they are opt-in: no default, WCAG or EN 301 549 run produces them, and `getRulesCatalog()` lists them only under options that ask for RGAA, or that unlock its rules with `optInRules` and select nothing else. Every check result also carries `rollupIds`, the rollups that group it in that run, so a finding with none can be spotted.

A test on a result means the rule checks part of it, never that the test is conforme: a `pass` is not an RGAA verdict, and most tests need a human. **The mapping has not yet been reviewed by an RGAA auditor.** Each row was checked against how other RGAA tools map and flag the same check, under one more rule: a rule that fails is linked to a test only when its usual failures really fail that test, and where that is uncertain the test is left off or the rule asks. Each row's note gives the reason for its tests. Corrections go in `src/coverage/rgaa-rule-map.js`, and `npm run rgaa-mapping-doc` regenerates [`RGAA_MAPPING.md`](./RGAA_MAPPING.md).

The table is generated from the criteria file DINUM publishes (`RGAA/criteres.json` in <https://github.com/DISIC/accessibilite.numerique.gouv.fr>, under Licence Ouverte 2.0), kept byte for byte in `scripts/data/rgaa/` with its provenance. Only the Markdown is removed: glossary links keep their words, and code spans lose their backticks. `npm run rgaa-map` regenerates `src/coverage/rgaa-map.js`, and a test fails if the committed file differs from what the source gives.

## Adding another standard

EN 301 549 and RGAA are entries in a registry, `src/coverage/standards.js`. The build, the runner, the rule catalog and the reporters read it, so a new standard goes the same way:

1. Put its table in `src/coverage/<name>-map.js`, taken from the published text, with a function that returns a rule's entries given the rule's id and WCAG criteria. Each entry is `{ standard, version, requirement, title, wcagSc }`, where `wcagSc` lists the WCAG criteria that requirement corresponds to. A standard that restates WCAG one criterion at a time, as EN 301 549 does, derives its entries from the criteria. One organised differently looks the rule up by id, as RGAA does in `src/coverage/rgaa-rule-map.js`.
2. Add an entry to `NORMATIVE_STANDARDS` with its `key` (what `engineOptions.mappings` accepts, and the SARIF tag prefix and JUnit property name), its `standard` (the name its entries carry and the report shows), its `versions`, and that function as `mappingsFor`.

The rest is optional, and the comment at the top of the registry describes each field:

- `profiles`: named conformance targets. Each gives the WCAG tags it runs and the version it targets, and switches that version's mappings on. With `mappedRules: true` it also runs every rule the standard maps, which matters when the standard requires things WCAG leaves to best practice.
- `ruleTag`: a tag for rules that check requirements only this standard makes. Those rules are opt-in (see [`RULE_AUTHORING.md`](./RULE_AUTHORING.md)), so a WCAG scan never runs them.
- `ruleMapped: true`: the entries come from each rule rather than from its WCAG criterion, so a WCAG rollup names only the entries of the rules that decided its outcome.
- `composites()`: rollups of the standard's own, such as RGAA's one per criterion. They carry the rule tag, so only a run that asks for the standard produces them, and the HTML report shows them in a section of their own.
- `report`: the dictionary key of the note above that section (`noteKey`), and the language of the rollup titles when it is not the scan's (`titleLang`).
- `validate(rules)`: checks the standard's own tables against the rules that exist. The build fails on any problem it returns.

`tests/coverage/standards.test.js` holds every registered standard to the contract. What stays per standard is its table, its tests, its rules, and a public export if tools need the reverse view, as `@surea11y/core/en301549` and `@surea11y/core/rgaa` do.

A standard is compiled into the engine. At run time, a custom rule (`engineOptions.customRules`) can name any standard in its own `normativeMappings`, and the result keeps those entries as written, but only registered standards get a profile, a `mappings` switch, opt-in rules, rollups, or a place in SARIF, JUnit and the HTML report.

## What this engine cannot tell you

No automated tool — this one included — can certify full WCAG conformance. That's not a limitation specific to surea11y; it's inherent to WCAG itself; a meaningful fraction of Success Criteria require human judgment (is this alt text *accurate*, not just *present*; is this error message *understandable*) or dynamic testing this engine's static-DOM-scan architecture cannot do at all (keyboard-trap detection, real layout/reflow at zoom). See [`LIMITATIONS.md`](./LIMITATIONS.md) for the full, explicit list of what's out of scope and why.

What surea11y *can* give you, honestly:
- Every `fail` is a real, deterministic, normative violation of the standard and version you targeted — never a guess. By default that standard is WCAG: a rule for a requirement only another standard makes (an RGAA-only rule, say) is opt-in and runs only when you target that standard ([`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#opt-in-rules)), so a WCAG scan never fails a page for something WCAG does not require. The one exception is a run that asks for every rule (`engineOptions.optInRules`): it targets no single standard, and says so in `engine.optInRules`.
- Every `cantTell` is an explicit flag for human review, not a swallowed uncertainty.
- The facet coverage table tells you exactly which parts of which SCs have zero automated coverage, so you know where a `pass` is silent rather than exhaustive.

A composite `pass` across every SC at your target level means: *every automatable check for that level came back clean.* It is the automatable subset of conformance, stated precisely — not a substitute for the manual review WCAG itself requires.
