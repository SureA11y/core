# Rule examples

Hand-authored `Passed`/`Failed` (or, for manual rules, `Flagged`/`Not applicable`)
example pairs for all 202 rules, meant to feed a future rule-page docs site the
way alfa.siteimprove.com/rules pages show worked examples alongside a rule's
description. Companion to [`RULE_CATALOG.md`](./RULE_CATALOG.md), which carries
each rule's title, WCAG mapping, applicability, and expectation — this file
adds one illustrative pair per rule.

Every example was verified against the built engine (`npm run build`, then
replayed through `tests/helpers/runa11yCoreOnHtml`), not just read off a
fixture's `.case-title` label or guessed from the rule's prose. Draft content:
hand-curated, not generated, and not yet checked by CI the way
`RULE_CATALOG.md` is. Once this feeds a real generator, it should get the
same treatment as the fixture-marker check (`scripts/generate-fixture-markers.js`):
a `--check` script wired into CI so a new or changed rule can't silently ship
without a matching example.

Manual rules (`type: 'manual'`) are capped at `cantTell`/`notApplicable` and
never return `pass`/`fail`; their pair below is `Flagged (cantTell)` /
`Not applicable` instead of `Passed`/`Failed`. A few automatic rules also
never reach `fail` in practice — each says so where it applies.

## accesskeys

**Flagged (cantTell)**
```html
<a href="/s1" accesskey="s">S1</a>
<a href="/s2" accesskey="s">S2</a>
```
Two elements share the same `accesskey` value ("s"), which most browsers resolve unpredictably.

**Not applicable**
```html
<a href="/a" accesskey="a">A</a>
<a href="/b" accesskey="b">B</a>
```
Every `accesskey` value on the page is unique.

## area-alt-present

**Passed**
```html
<img src="image.png" alt="" usemap="#nav">
<map name="nav">
  <area href="/x" shape="rect" coords="0,0,40,24" alt="Go to green">
</map>
```
The `<area>` is a link inside a used map and has a non-empty `alt`.

**Failed**
```html
<img src="image.png" alt="" usemap="#nav">
<map name="nav">
  <area href="/x" shape="rect" coords="0,0,40,24">
</map>
```
The `<area>` is a link (has `href`) in a used map but has no `alt`.

## area-alt-quality

*Manual, and like its siblings below, flags every applicable element with a detected text alternative for review — it isn't selective about which ones look wrong. The flagged example shows a case where review genuinely matters, not a case the rule specifically detected as bad.*

**Flagged (cantTell)**
```html
<img src="office-map.png" usemap="#floorplan">
<map name="floorplan">
  <area href="/rooms/12" shape="rect" coords="0,0,40,24" alt="Room 12">
</map>
```
The area has a non-empty text alternative in a used image map, worth confirming "Room 12" is accurate for that region. An `aria-label`, `aria-labelledby` or `title` is asked about the same way, and each occurrence lists the sources it found.

**Not applicable**
```html
<map name="unused">
  <area href="/rooms/12" shape="rect" coords="0,0,40,24" alt="Room 12">
</map>
```
No `<img usemap>` references this map, so the area is never hit-tested or rendered — out of scope.

## area-alt-source

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<img src="map.png" usemap="#m" alt="Carte de France">
<map name="m">
  <area href="/paris" coords="0,0,50,50" alt="Paris">
</map>
```
The linked area takes its text alternative from `alt`.

**Failed**
```html
<img src="map.png" usemap="#m" alt="Carte de France">
<map name="m">
  <area href="/paris" coords="0,0,50,50" title="Paris">
</map>
```
The area is named only by `title`, which RGAA 1.1.2 does not list for `<area>`.

## aria-allowed-attr

**Passed**
```html
<div role="checkbox" aria-checked="true"></div>
```
`aria-checked` is one of the states role="checkbox" supports.

**Failed**
```html
<div role="checkbox" aria-valuenow="1"></div>
```
`aria-valuenow` belongs to range widgets, not role="checkbox".

## aria-allowed-role

*Despite being `type: 'automatic'`, this rule never returns `fail` — no ACT rule and no WCAG mapping exist for it, so a disallowed role is raised for review rather than decided outright.*

**Passed**
```html
<nav role="navigation">...</nav>
```
`role="navigation"` is permitted on `<nav>` by the ARIA-in-HTML spec (it's also the element's implicit role).

**Flagged (cantTell)**
```html
<nav role="tab">...</nav>
```
`role="tab"` is not one of the roles ARIA-in-HTML permits on `<nav>`.

## aria-attribute-conformance

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<h2 aria-expanded="true">Delivery options</h2>
<button aria-describedby="help-text">Send</button>
```
The W3C validator accepts both: `aria-expanded` is allowed on a heading, and an `aria-describedby` that points to no element is not a validator error (only `aria-activedescendant` must resolve). WCAG rules may still flag them.

**Failed**
```html
<button aria-expanded="">Menu</button>
<div aria-label="Main menu">Menu</div>
<div role="heading">News</div>
```
Three validator errors under RGAA 8.2.1: an empty `aria-expanded` value, `aria-label` on a `<div>` with no role (which cannot be named), and `role="heading"` without `aria-level`, which the validator requires although WAI-ARIA gives a default level.

## aria-braille-equivalent

**Passed**
```html
<button aria-braillelabel="SAVE">Save changes</button>
```
The braille label supplements a real accessible name ("Save changes"); non-braille assistive technology still gets a name.

**Flagged (cantTell)**
```html
<button aria-braillelabel="SAVE"></button>
```
`aria-braillelabel` is the only naming mechanism present; non-braille assistive technology gets no accessible name at all.

## aria-checked-state-mismatch

**Flagged (cantTell)**
```html
<input type="checkbox" checked aria-checked="false">
```
The checkbox is actually checked, but `aria-checked="false"` tells assistive technology the opposite.

**Not applicable**
```html
<input type="checkbox" checked aria-checked="true">
```
`aria-checked` matches the control's real checked state.

## aria-conditional-attr

**Passed**
```html
<input type="text" aria-invalid="true" aria-errormessage="err1">
<span id="err1">Enter a valid email address.</span>
```
`aria-invalid="true"` means `aria-errormessage` is actually exposed to assistive technology.

**Flagged (cantTell)**
```html
<input type="text" aria-errormessage="err1">
<span id="err1">Enter a valid email address.</span>
```
Without `aria-invalid` set to a non-`"false"` value, `aria-errormessage` is never exposed — the reference is currently inert.

## aria-deprecated-role

**Passed**
```html
<ul role="list"><li>Item</li></ul>
```
`role="list"` is current, non-deprecated ARIA.

**Flagged (cantTell)**
```html
<div role="directory"><a href="/a">Item</a></div>
```
`role="directory"` is deprecated in WAI-ARIA in favor of `role="list"`; still valid markup, but discouraged.

## aria-hidden-body

**Passed**
```html
<body>Hi</body>
```
The document `<body>` is not `aria-hidden`.

**Failed**
```html
<body aria-hidden="true">Hi</body>
```
Hiding `<body>` removes the entire page from the accessibility tree at once.

## aria-hidden-focus

**Passed**
```html
<div aria-hidden="true">
  <p>Decorative text</p>
</div>
```
Nothing inside the hidden subtree is focusable, so hiding it from assistive tech leaves no dead focus stop.

**Failed**
```html
<div aria-hidden="true">
  <a href="/x">Link</a>
</div>
```
The link stays in the tab order even though `aria-hidden` removes it from the accessibility tree.

## aria-list-item-roles

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<div role="list">
  <div role="listitem">Home</div>
  <div role="listitem">Contact</div>
</div>
```
The list is built with `role="list"` and `role="listitem"`, one of the two structures RGAA 9.3.1 and 9.3.2 accept.

**Flagged (cantTell)**
```html
<div role="list">
  <li>Apples</li>
  <li>Pears</li>
</div>
```
The items are `<li>` elements without `role="listitem"`, so the list is neither `<ul>`/`<ol>` with `<li>` nor `role="list"` with `role="listitem"`. It is asked about, not failed: whether the content is visually a list, and an ordered or unordered one, is for a person. This rule never fails.

## aria-prohibited-attr

**Passed**
```html
<div role="generic"></div>
```
role="generic" cannot be named, and none of the naming attributes are present.

**Failed**
```html
<div role="generic" aria-label="Something"></div>
```
`aria-label` is set on a role that WAI-ARIA prohibits from being named.

## aria-prohibited-children

**Passed**
```html
<ul role="menubar">
  <li role="menuitem">File</li>
  <li role="menuitem">Edit</li>
</ul>
```
Both owned children are roles menubar's spec allows.

**Failed**
```html
<div role="table">
  <div role="row"><div role="cell">x</div></div>
  <div role="button">Not a valid table child</div>
</div>
```
role="table" only allows row (or rowgroup) children; the button is a disallowed owned child.

## aria-required-attr

**Passed**
```html
<div role="checkbox" aria-checked="true"></div>
```
role="checkbox" requires `aria-checked`, and it's present.

**Failed**
```html
<div role="checkbox"></div>
```
role="checkbox" requires `aria-checked`; it's missing entirely.

## aria-required-children

**Passed**
```html
<ul role="list"><li>Item</li></ul>
```
The list role owns at least one `listitem`-role child.

**Flagged (cantTell)**
```html
<div role="list"></div>
```
An empty `role="list"` owns no required child role — announced as a list with no items, which is what it is, but worth a look.

## aria-required-parent

**Passed**
```html
<div role="tablist">
  <div role="tab">Overview</div>
</div>
```
role="tab" requires an ancestor (or `aria-owns` owner) with role="tablist", and one is present.

**Failed**
```html
<nav role="tab"></nav>
```
role="tab" has no tablist ancestor or owner anywhere on the page.

## aria-role-conformance

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<div role="button" tabindex="0">Open</div>
<img src="play.png" alt="Play" role="button">
```
Both roles are ones the W3C validator accepts, and allowed on their elements; the image carrying a role has a text alternative.

**Failed**
```html
<div role="bogus button" tabindex="0">Open</div>
<nav role="tab">Products</nav>
```
The validator reports the unknown token `bogus` even though `button` follows it as a fallback (WCAG's `aria-roles-valid` passes on one valid token), and `role="tab"` is not allowed on `<nav>`. Both fail RGAA 8.2.1. An `<img alt="" role="presentation">` is asked about instead: the validator reports it, but RGAA 1.2.1 names `role="presentation"` for decorative images.

## aria-role-name-present

**Passed**
```html
<div role="grid" aria-label="Orders"></div>
```
role="grid" requires an accessible name, and `aria-label` provides one.

**Failed**
```html
<div role="grid"></div>
```
role="grid" requires an accessible name; none is present.

## aria-roles-valid

**Passed**
```html
<div role="button">Click</div>
```
"button" is a real, concrete ARIA role.

**Failed**
```html
<div role="buton"></div>
```
"buton" isn't a defined ARIA role token (typo).

## aria-text

**Flagged (cantTell)**
```html
<span role="text">Some text with <a href="#">a link</a> inside it.</span>
```
`role="text"` tells assistive technology to treat this as a single flat string, but the nested link is still focusable and interactive underneath it.

**Not applicable**
```html
<span role="text">Plain text with no interactive content.</span>
```
No focusable descendant exists inside the `role="text"` element.

## aria-valid-attr

*Despite being `type: 'automatic'`, this rule never returns `fail` — an aria-* attribute the spec doesn't define is inert, so nothing about the element's exposed name, role, or value actually changes.*

**Passed**
```html
<button aria-label="Save">Save</button>
```
`aria-label` is a real, defined ARIA attribute.

**Flagged (cantTell)**
```html
<button aria-labeledby="x">Save</button>
```
`aria-labeledby` is a typo (the real attribute is `aria-labelledby`) and is silently ignored by assistive technology.

## aria-valid-attr-value

**Passed**
```html
<div aria-hidden="true"></div>
```
"true" is a valid value for the boolean-typed `aria-hidden`.

**Failed**
```html
<div aria-hidden="yes"></div>
```
`aria-hidden` is boolean-typed; "yes" isn't a valid boolean token.

## autocomplete-valid

**Passed**
```html
<input autocomplete="email">
```
"email" is a recognized autofill field-name token.

**Failed**
```html
<input autocomplete="emial">
```
"emial" is a typo, not a recognized autofill token.

## avoid-inline-spacing

**Passed**
```html
<p style="letter-spacing:2px !important">Spaced text</p>
```
The forced letter-spacing is above the WCAG 1.4.12 minimum metric.

**Failed**
```html
<p style="line-height:1.2 !important">The toy brought back fond memories of being lost in the rain forest.</p>
```
`!important` forces line-height below the 1.5 minimum, and the page's own styles can't override it.

**Flagged (cantTell)**
```html
<p style="line-height:1 !important">Opening hours</p>
```
The text is short enough to fit on one line, so it may never wrap, and the criterion applies only to text that wraps.

## binary-control-name-present

**Passed**
```html
<div role="switch" tabindex="0" aria-checked="false" aria-label="Bluetooth"></div>
```
`aria-label` gives the switch an accessible name.

**Failed**
```html
<div role="switch" tabindex="0" aria-checked="false"></div>
```
The switch has no name from any supported mechanism.

## button-name-present

**Passed**
```html
<button>Save</button>
```
The button's text content is its accessible name.

**Failed**
```html
<button></button>
```
The button has no text content, `aria-label`, or `aria-labelledby`.

## bypass-blocks-present

**Not applicable**
```html
<body>
  <nav>Site nav</nav>
  <main>Primary content</main>
</body>
```
A main landmark exists — a recognized bypass mechanism, so there's nothing to flag.

**Flagged (cantTell)**
```html
<body>
  <nav>Site nav</nav>
  <div>Primary content, no landmark, no heading, no skip link.</div>
</body>
```
No main landmark, working same-page anchor link, or visible heading was detected — a review prompt, not a fail, since the engine can't confirm from one snapshot whether the page truly lacks a bypass mechanism.

## canvas-decorative-aria-hidden

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<canvas aria-hidden="true" width="40" height="20"></canvas>
```
The decorative canvas is hidden and carries no alternative.

**Failed**
```html
<canvas role="presentation" width="40" height="20"></canvas>
```
The canvas is marked decorative by its role but has no `aria-hidden="true"`, which RGAA 1.2.5 requires.

**Flagged (cantTell)**
```html
<canvas role="none" width="40" height="20">Ventes 2024 : 10 000</canvas>
```
If the image carries information, the content is its alternative; if it is decorative, it needs `aria-hidden="true"` and no content.

## canvas-role-img

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<canvas role="img" aria-label="Ventes 2024" width="40" height="20"></canvas>
```
The canvas has `role="img"` and an `aria-label`.

**Failed**
```html
<canvas role="img" width="40" height="20">Ventes 2024 : 10 000</canvas>
```
With `role="img"`, only `aria-labelledby` or `aria-label` can provide the alternative; fallback content does not count.

**Flagged (cantTell)**
```html
<canvas width="40" height="20"></canvas>
<a href="/donnees">Données du graphique</a>
```
A person checks that the adjacent link leads to an alternative content.

## canvas-text-alternative-present

**Passed**
```html
<canvas>Chart summary</canvas>
```
Fallback content between the tags provides a text alternative.

**Failed**
```html
<canvas></canvas>
```
No fallback content and no accessible name.

## canvas-text-alternative-quality

*Manual; flags every applicable element with a detected text alternative for review, not only the ones that look wrong.*

**Flagged (cantTell)**
```html
<canvas width="400" height="200">Bar chart</canvas>
```
The fallback text "Bar chart" is present but generic — worth confirming it conveys the actual data, not just the chart type.

**Not applicable**
```html
<canvas width="400" height="200"></canvas>
```
No fallback content, ARIA name, or title exists to review; that's `canvas-text-alternative-present`'s failure instead.

## combobox-name-present

**Passed**
```html
<div role="combobox" tabindex="0" aria-label="Country"></div>
```
`aria-label` names the combobox.

**Failed**
```html
<div role="combobox" tabindex="0"></div>
```
No accessible name from any supported mechanism.

## complex-table-summary

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<table>
  <tr><td></td><th colspan="2">2025</th></tr>
  <tr><td></td><th>Q1</th><th>Q2</th></tr>
  <tr><th>North</th><td>10</td><td>12</td></tr>
</table>
```
Two rows of headers make the table complex, and nothing points to a summary of how it is organised.

**Not applicable**
```html
<table>
  <tr><th>Item</th><th>Price</th></tr>
  <tr><th>Tea</th><td>2</td></tr>
</table>
```
All headers are in the first row and first column: a simple table, which needs no summary.

## complex-table-summary-quality

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<table>
  <caption>Sales by year and quarter</caption>
  <tr><td></td><th colspan="2">2025</th></tr>
  <tr><td></td><th>Q1</th><th>Q2</th></tr>
  <tr><th>North</th><td>10</td><td>12</td></tr>
</table>
```
A complex table with a summary in its caption: a person checks that it explains the nature and structure of the table (RGAA 5.2.1), not only its title.

**Not applicable**
```html
<!doctype html>
<table summary="Sales by year and quarter">
  <tr><td></td><th colspan="2">2025</th></tr>
  <tr><td></td><th>Q1</th><th>Q2</th></tr>
  <tr><th>North</th><td>10</td><td>12</td></tr>
</table>
```
In an HTML5 document the `summary` attribute is not a summary, so the table has none to judge; complex-table-summary asks about it under 5.1.1. Under an HTML 4.01 doctype the same table is flagged.

## contrast-computable

*This rule is a computability gate: it never returns `fail`, only `pass` (a ratio was computed), `cantTell` (no ratio could be computed at all), or `notApplicable`.*

**Passed**
```html
<p style="background:#ffffff; color:#999999;">Body text</p>
```
Foreground and background are both flat, opaque colors, so a ratio can be computed (whether or not it later passes AA/AAA).

**Flagged (cantTell)**
```html
<p style="background-image:url(texture.png); color:#000000;">Body text</p>
```
A `background-image` behind the text is not a flat color, so no contrast ratio can be computed at all.

## contrast-enhanced

**Passed**
```html
<p style="background:#ffffff; color:#000000;">Body text</p>
```
Black on white is roughly 21:1, well above the AAA 7:1 threshold.

**Failed**
```html
<p style="background:#ffffff; color:#767676;">Body text</p>
```
Gray on white is about 4.6:1 — passes the AA minimum but fails the stricter 7:1 AAA threshold.

## contrast-minimum

**Passed**
```html
<p style="background:#ffffff; color:#767676;">Body text</p>
```
About 4.6:1, above the AA 4.5:1 minimum for normal text.

**Failed**
```html
<div style="opacity:0.5; background:#ffffff;">
  <p style="color:#000000;">Body text</p>
</div>
```
50% ancestor (group) opacity over white composites to a flat gray around 4:1, below the AA minimum.

## contrast-minimum-rgaa

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<p style="font-size:18.5px; font-weight:700; color:#888888; background:#ffffff">Opening hours</p>
```
Bold text of 18.5px is large for RGAA (3.2.4), so 3.54:1 is enough. WCAG makes bold text large only from 14pt (about 18.67px), so `contrast-minimum` fails the same text.

**Failed**
```html
<p style="font-size:18px; font-weight:700; color:#888888; background:#ffffff">Opening hours</p>
```
Bold text below 18.5px needs 4.5:1 (3.2.2); #888888 on white is 3.54:1.

## css-focus-indicator-suppressed

**Flagged (cantTell)**
```html
<style>.reset-only:focus { outline: none; }</style>
<a class="reset-only" href="/pricing">Pricing</a>
```
`:focus { outline: none; }` removes the focus indicator, and no other rule matching this link draws a replacement.

**Flagged (cantTell)**
```html
<style>a { outline: none; }</style>
<a href="/news">News</a>
```
A rule with no `:focus` still applies while the link has focus, and it outranks the browser's own focus outline (F78). No focus rule draws a replacement.

**Not applicable**
```html
<style>.reset-shadow:focus { outline: none; box-shadow: 0 0 0 3px navy; }</style>
<button class="reset-shadow" type="button">Send</button>
```
The same rule that removes the outline draws a `box-shadow` in its place.

## css-hidden-focus

**Flagged (cantTell)**
```html
<a href="/x" style="opacity:0;">Hidden but tabbable link</a>
```
The link stays in the tab order despite `opacity:0` making it invisible to sighted keyboard users.

**Not applicable**
```html
<a href="/x">Visible link</a>
```
The link is both focusable and visible — nothing to flag.

**Not applicable**
```html
<style>.skip { position: absolute; left: -9999px; } .skip:focus { left: 0; }</style>
<a class="skip" href="#main">Skip to content</a>
```
The link is off-screen at rest, but its `:focus` rule brings it back into view when it takes focus.

## css-orientation-lock

**Passed**
```html
<html>
  <head>
    <title>Page title</title>
    <style>body { background: #fff; }</style>
  </head>
  <body>Hi</body>
</html>
```
No orientation media query rotates the page.

**Failed**
```html
<html>
  <head>
    <title>Page title</title>
    <style>
      @media (orientation: landscape) {
        body { transform: rotate(90deg); }
      }
    </style>
  </head>
  <body>Hi</body>
</html>
```
A landscape media query forces a 90-degree rotation, locking the page to portrait regardless of device orientation.

## data-table-headers-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<table>
  <tr><td>Name</td><td>Age</td></tr>
  <tr><td>Ann</td><td>34</td></tr>
</table>
```
No cell is a header. If this is a data table, "Name" and "Age" are column headers and RGAA 5.6.1 wants them in `<th>`. Only a person can tell whether it is a data table.

**Not applicable**
```html
<table>
  <tr><th>Name</th><th>Age</th></tr>
  <tr><td>Ann</td><td>34</td></tr>
</table>
```
The table has header cells, so the question does not come up. A table with `role="presentation"` is not asked about either.

## definition-list-children-valid

**Passed**
```html
<dl>
  <dt>Term</dt>
  <dd>Definition</dd>
</dl>
```
`<dl>`'s only direct children are `dt`/`dd`.

**Failed**
```html
<dl>
  <dt>Term</dt>
  <dd>Definition</dd>
  <p>oops</p>
</dl>
```
The `<p>` is a direct child of `<dl>` that isn't `dt`/`dd` (or an allowed wrapper).

## deprecated-elements-not-used

**Passed**
```html
<p>Normal content</p>
<blink>Sale</blink>
```
No `<marquee>` anywhere, which satisfies the rule outright; there is no separate not-applicable case. `<blink>` is not reported, since no browser makes it blink.

**Flagged (cantTell)**
```html
<marquee>Breaking news</marquee>
```
`<marquee>` scrolls its content and gives the user no way to pause, stop, or hide it; whether the page adds its own control is for a person to check. This rule never fails.

## dialog-name-present

**Passed**
```html
<div role="dialog" aria-label="Confirm deletion">
  <p>Are you sure?</p>
</div>
```
`aria-label` names the dialog.

**Failed**
```html
<div role="dialog">
  <p>Body text only.</p>
</div>
```
No accessible name; visible body text doesn't count toward a dialog's name.

## dir-attribute-valid

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<p dir="rtl" lang="ar">مرحبا</p>
```
The direction is `rtl`, one of the two values RGAA accepts.

**Failed**
```html
<p dir="auto" lang="ar">مرحبا</p>
```
HTML allows `dir="auto"`, but RGAA accepts only `ltr` or `rtl` on text that reads in the reverse direction of the page. `dir="auto"` on text in the page's own direction is not applicable.

## dlitem-parent-valid

**Passed**
```html
<dl>
  <dt>Term</dt>
  <dd>Definition</dd>
</dl>
```
Both `dt` and `dd` are inside a `<dl>` ancestor.

**Failed**
```html
<div>
  <dt>orphan</dt>
</div>
```
`<dt>` has no `<dl>` ancestor at all.

## doctype-position

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<!DOCTYPE html>
<html lang="fr">…</html>
```
The doctype comes first. The parser keeps a doctype only there, so a doctype in the DOM is enough.

**Failed (with the `page.source` probe)**
```html
<html lang="fr">
<!DOCTYPE html>
…</html>
```
The source declares the doctype after the `<html>` tag, and browsers ignore it. Without the probe the parsed page simply has no doctype, so the rule asks; with it, RGAA 8.1.3 fails, and `doctype-present` counts the doctype as present for 8.1.1.

## doctype-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<!doctype html>
<html lang="en">
  <head><title>Quarterly report</title></head>
  <body>Hi</body>
</html>
```
The document starts with the HTML5 doctype.

**Failed**
```html
<html lang="en">
  <head><title>Quarterly report</title></head>
  <body>Hi</body>
</html>
```
No doctype, which RGAA 8.1.1 requires.

## doctype-valid

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html lang="en" xml:lang="en">
  <head><title>Quarterly report</title></head>
  <body><p>Hi</p></body>
</html>
```
XHTML 1.0 Strict is on the W3C list of recommended doctypes, so RGAA 8.1.2 accepts it.

**Failed**
```html
<!DOCTYPE html PUBLIC "-//Example//DTD Custom HTML//EN">
<html lang="en">
  <head><title>Quarterly report</title></head>
  <body><p>Hi</p></body>
</html>
```
The public identifier is neither HTML5's (none) nor a W3C recommended one. A page with no doctype is not applicable here: `doctype-present` fails it under 8.1.1.

## duplicate-id

*A duplicate id is a real defect under WCAG 2.0/2.1 (SC 4.1.1), but that criterion was removed in 2.2, so under this engine's default 2.2 target the same defect is coerced to `cantTell` (with a `wcagVersionScope` field) instead of `fail`. The failed example below targets `engineOptions.wcagVersion: '2.0'` to show the rule's underlying decision directly.*

**Passed**
```html
<div id="section-1">First</div>
<div id="section-2">Second</div>
```
Each element has a distinct id.

**Failed** (with `engineOptions.wcagVersion: '2.0'`)
```html
<div id="section-1">First</div>
<div id="section-1">Second</div>
```
The id `section-1` is used by two elements in the same tree, breaking `<label for>`, fragment links, and `getElementById`.

## duplicate-id-aria

*Despite being `type: 'automatic'`, this rule never returns `fail` — which element an `aria-labelledby`/`aria-describedby` reference resolves to first is well-defined, but whether that's the intended target depends on author intent, which markup doesn't carry.*

**Passed**
```html
<span id="lbl">Name</span>
<input type="text" aria-labelledby="lbl">
```
The id `lbl` is unique, so the reference resolves unambiguously.

**Flagged (cantTell)**
```html
<span id="lbl">Name</span>
<span id="lbl">Duplicate</span>
<input type="text" aria-labelledby="lbl">
```
`aria-labelledby="lbl"` resolves to the first element with that id — whether that's the intended target is an authoring question the markup can't answer.

## embed-image-role-img

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<embed type="image/svg+xml" src="chart.svg" role="img" aria-label="Ventes 2024">
```
The embedded image has `role="img"` and a text alternative.

**Failed**
```html
<embed type="image/svg+xml" src="chart.svg">
```
No text alternative, and no link or button to an alternative content after it.

**Flagged (cantTell)**
```html
<embed type="image/svg+xml" src="chart.svg" title="Ventes 2024">
```
A text alternative without `role="img"`: the test wording asks for both, the methodology for the alternative only.

## embed-text-alternative-present

**Passed**
```html
<embed src="report.pdf" type="application/pdf" aria-label="Quarterly report PDF">
```
`aria-label` gives the embed an accessible name.

**Failed**
```html
<embed src="report.pdf" type="application/pdf">
```
No accessible name and no fallback content.

## embed-text-alternative-quality

*Manual; flags every applicable element with a detected text alternative for review, not only the ones that look wrong.*

**Flagged (cantTell)**
```html
<embed src="report.pdf" type="application/pdf" title="Quarterly report PDF">
```
A `title` is present — worth confirming it identifies the document well enough for someone who can't see the embedded viewer.

**Not applicable**
```html
<embed src="report.pdf" type="application/pdf">
```
No aria-label, resolved aria-labelledby, or title exists to review; that's `embed-text-alternative-present`'s failure instead.

## embedded-refresh-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<object data="scores.html" type="text/html"></object>
```
The embedded page may reload itself. RGAA 13.1.1 lists `<object>`, `<embed>`, `<svg>` and `<canvas>` as refresh methods, and a person checks whether a refresh happens and whether the user can stop it, lengthen it or be warned of it.

**Not applicable**
```html
<svg viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4"/></svg>
```
An `<svg>` with no `<script>` cannot reload anything, and an `<object>` or `<embed>` that shows a still image is left out too.

## empty-heading

**Flagged (cantTell)**
```html
<h2></h2>
```
The heading has no accessible name at all — nothing for a screen reader to announce.

**Not applicable**
```html
<h2>Section title</h2>
```
The heading has visible text content.

## empty-table-header

**Flagged (cantTell)**
```html
<table><tr><th></th></tr></table>
```
The header cell has no text content and no accessible name.

**Not applicable**
```html
<table><tr><th>Name</th></tr></table>
```
The header cell has visible text content.

## fake-list

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<p>• Apples<br>• Pears<br>• Plums</p>
```
Three lines start with the same bullet, but screen readers get no list.

**Not applicable**
```html
<ul>
  <li>Apples</li>
  <li>Pears</li>
</ul>
```
A real list; nothing is laid out as one with text alone.

## field-group-legend

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<fieldset>
  <label>Street <input name="street"></label>
  <label>City <input name="city"></label>
</fieldset>
```
The address fields are grouped, but the group has no `<legend>` saying what it is.

**Not applicable**
```html
<fieldset>
  <legend>Address</legend>
  <label>Street <input name="street"></label>
</fieldset>
```
The group has a legend.

## field-label-in-name-sources

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<label for="mail">E-mail</label>
<input type="email" id="mail" title="E-mail (exemple : nom@domaine.fr)">
```
The title starts with the visible label "E-mail", so both label sources contain it.

**Failed**
```html
<label for="mail">E-mail</label>
<input type="email" id="mail" title="Adresse électronique">
```
RGAA 11.2.5 checks every label source present, and the title does not contain the visible label, although the `<label>` gives the accessible name. WCAG 2.5.3 compares only the accessible name, so `label-in-name` does not apply.

## field-label-listed-source

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<label for="name">Nom</label>
<input type="text" id="name">
```
A `<label>` with a `for` attribute that matches the field's `id`, one of the four sources RGAA 11.1.1 lists (with `aria-labelledby`, `aria-label` and `title`).

**Failed**
```html
<input type="text" placeholder="Nom">
```
A placeholder is not one of the sources 11.1.1 lists, so the field has no label under RGAA, although browsers use the placeholder as its accessible name. A field named only by a `<label>` that wraps it, without `for`, is asked about (cantTell) instead.

## figure-caption-structure

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<figure role="figure" aria-label="Sales in 2025">
  <img src="chart.png" alt="Bar chart of sales">
  <figcaption>Sales in 2025</figcaption>
</figure>
```
The figure has `role="figure"` and an `aria-label` repeating its caption.

**Failed**
```html
<figure>
  <img src="chart.png" alt="Bar chart of sales">
  <figcaption>Sales in 2025</figcaption>
</figure>
```
The figure has neither a role nor an `aria-label`.

## focus-indicator-contrast

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<style>body { background: #fff } a:focus { outline: 2px solid #000 }</style>
<a href="/hours">Opening hours</a>
```
The outline that replaces the browser's own is black on white, 21:1.

**Failed**
```html
<style>body { background: #fff } a:focus { outline: none; box-shadow: 0 0 0 2px #eee }</style>
<a href="/hours">Opening hours</a>
```
The box-shadow is visible, which is all WCAG 2.4.7 asks, but #eee on white is 1.16:1, below the 3:1 RGAA 10.7.1 requires. A focus style the engine cannot measure (a background image, a CSS variable, a background or text-color change) is asked about instead.

## focus-order-semantics

**Flagged (cantTell)**
```html
<div role="heading" tabindex="0">Fake focusable heading</div>
```
A heading role has no interactive behavior, so making it tabbable is unusual and worth a look.

**Not applicable**
```html
<div role="button" tabindex="0">Real custom button</div>
```
`role="button"` is an interactive role, so being tabbable is expected.

## form-button-label-in-name-sources

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<form action="/search">
  <input type="search" aria-label="Rechercher">
  <button aria-label="Rechercher sur le site">Rechercher</button>
</form>
```
The accessible name starts with the button's visible text.

**Failed**
```html
<form action="/send">
  <button aria-label="Fermer la fenêtre">Valider</button>
</form>
```
The accessible name does not contain the visible label "Valider" (RGAA 11.9.2). The same button outside any form is not applicable. A `title` that does not contain the visible label, on a button named by its text, is asked about (cantTell): the test's conditions list every source, but its methodology checks only the accessible name.

## form-button-name-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<form action="/search">
  <input type="search" aria-label="Rechercher">
  <button>Rechercher</button>
</form>
```
The button inside the form has a label, its content.

**Failed**
```html
<form action="/search">
  <input type="search" aria-label="Rechercher">
  <button><img src="loupe.svg" alt=""></button>
</form>
```
The button inside the form has no label, so RGAA 11.9.1 has nothing to judge. The same empty button outside any form is not applicable: 11.9.1 covers only the buttons in a `<form>` or `role="form"` element.

## form-control-label-quality

*This rule is scoped to fields that already have a visible programmatic label; a field with no visible label at all belongs to `form-control-programmatic-label-present`/`form-control-programmatic-label-quality` instead.*

**Flagged (cantTell)**
```html
<label>Label <input type="text" name="f1"></label>
```
The label text is the placeholder word "Label" itself, not a real description of the field.

**Not applicable**
```html
<label for="e">Email address:</label>
<input id="e" type="text">
```
The label text is a genuine, descriptive name for the field.

## form-control-programmatic-label-present

**Passed**
```html
<label for="email">Full name</label>
<input id="email" type="text">
```
The `<label for>` association gives the input a programmatic label.

**Failed**
```html
<input type="text">
```
No `<label>`, `aria-label`, or `aria-labelledby` — nothing programmatic names the field.

## form-control-programmatic-label-quality

**Flagged (cantTell)**
```html
<input type="text" placeholder="Email address">
```
The control's only name comes from `placeholder`, which disappears once the user starts typing.

**Not applicable**
```html
<label for="email">Email address</label>
<input type="text" id="email" placeholder="name@example.com">
```
A persistent `<label>` provides the name; `placeholder` is just a format hint here.

## form-control-single-label

**Passed**
```html
<label>Name <input type="text"></label>
```
A single wrapping label; only one labelling mechanism applies.

**Failed**
```html
<label for="address">Address</label>
<label for="address">Mailing address</label>
<input id="address" type="text">
```
Two separate `label[for]` elements both target the same control.

## frame-title-attribute-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<iframe src="map.html" title="Map of the city centre"></iframe>
```
The frame has a `title` attribute (RGAA 2.1.1).

**Failed**
```html
<iframe src="map.html" aria-label="Map of the city centre"></iframe>
```
The frame has an accessible name, which WCAG 4.1.2 accepts, but no `title` attribute, which RGAA 2.1.1 asks for. Only `aria-hidden="true"` takes a frame out of scope; `tabindex="-1"` does not.

## frame-title-not-empty

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<iframe src="weather.html" title="Weather forecast"></iframe>
```
The title is not empty. Whether it is relevant is for a person.

**Failed**
```html
<iframe src="map.html" title="" aria-label="Map"></iframe>
```
The title is empty, so it cannot be relevant (RGAA 2.2.1). The `aria-label` gives the frame a name for WCAG, but 2.2.1 judges the `title` attribute alone.

## heading-content-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<h2><img src="news.png" alt="News"></h2>
```
The heading's content is an image with a text alternative.

**Failed**
```html
<h2></h2>
```
The heading has no content at all, so RGAA 9.1.2 has nothing to judge. `<h2 title="News"></h2>` is asked about (cantTell) instead: its name comes from an attribute, not from its content.

## heading-order

**Flagged (cantTell)**
```html
<h1>Title</h1>
<h3>Subsection</h3>
```
The heading level jumps from 1 to 3, skipping level 2.

**Not applicable**
```html
<h1>Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
```
Each heading level increases by at most one at a time.

## heading-quality

*Headings with no accessible name at all belong to `empty-heading`, not this rule.*

**Flagged (cantTell)**
```html
<h3>Heading</h3>
<p>We are open Monday through Friday from 10 to 16.</p>
```
The heading text is the generic placeholder word "Heading" itself, not a description of the section.

**Not applicable**
```html
<h3>Opening hours</h3>
<p>We are open Monday through Friday from 10 to 16.</p>
```
The heading names its actual topic.

## heading-role-level-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<div role="heading" aria-level="2">News</div>
```
`role="heading"` comes with an `aria-level`, as RGAA's definition of a heading requires.

**Failed**
```html
<div role="heading">News</div>
```
No `aria-level`. WAI-ARIA gives the heading level 2 by default, which WCAG accepts, but RGAA 9.1.3 does not.

## html-elements-attributes-valid

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<table>
  <tr><th id="price" scope="col">Price</th></tr>
  <tr><td headers="price">10 €</td></tr>
</table>
<input type="email" autocomplete="shipping email" aria-label="Email">
```
`scope`, `headers` and `autocomplete` all hold values the W3C validator accepts.

**Failed**
```html
<div hidden><center>Welcome</center></div>
<p dir=" rtl " lang="ar">مرحبا</p>
<input disabled autocomplete="nom" aria-label="Name">
```
`<center>` is obsolete (hidden content counts for RGAA 8.2.1), `dir` has spaces around its value, and `nom` is not an autofill field name, disabled field or not. A page whose doctype is neither HTML5 nor missing is asked about instead.

## html-lang-attr-present

**Passed**
```html
<html lang="en">
  <head><title>Page title</title></head>
  <body>Hi</body>
</html>
```
A non-empty, syntactically valid language tag is declared.

**Failed**
```html
<html>
  <head><title>Page title</title></head>
  <body>Hi</body>
</html>
```
No `lang` attribute at all on `<html>`.

## html-lang-code-valid

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<html lang="fra">
  <head><title>Rapport annuel</title></head>
  <body><p>Bonjour</p></body>
</html>
```
`fra` is an ISO 639-2 code, which RGAA 8.4.1 accepts, although the IANA registry lists only `fr`.

**Failed**
```html
<html lang="english">
  <head><title>Annual report</title></head>
  <body><p>Hello</p></body>
</html>
```
`english` is not an ISO 639 language code.

## html-nesting-valid

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<dl>
  <div><dt>Apple</dt><dd>Fruit</dd></div>
  <div><dt>Leek</dt><dd>Vegetable</dd></div>
</dl>
<div role="button" tabindex="0"><a href="/help">Help</a></div>
```
Each `<div>` holds one `<dt>`/`<dd>` group. A link inside `role="button"` is only a validator warning, so RGAA 8.2.1 does not fail it.

**Failed**
```html
<ul><li>Apples</li><div role="listitem">Pears</div></ul>
<a href="/basket">Basket <button disabled>Empty</button></a>
```
A `<ul>` may only hold `<li>`, `<script>` and `<template>`, whatever role the child has, and a link may not contain a button, even a disabled one.

## html-xml-lang-mismatch

**Passed**
```html
<html lang="en-US" xml:lang="en-GB">
```
Primary subtags agree (`en`); regional subtags are allowed to differ.

**Failed**
```html
<html lang="en" xml:lang="fr">
```
`lang` and `xml:lang` declare different primary languages.

## identical-iframes-same-purpose

*Despite being `type: 'automatic'`, this rule never returns `fail` — frames sharing a name but resolving to different URLs can still be legitimately equivalent, and nothing in the markup settles that either way.*

**Passed**
```html
<iframe title="Weather widget" src="https://example.test/weather"></iframe>
<iframe title="Weather widget" src="https://example.test/weather"></iframe>
```
Both frames share the name "Weather widget" and embed the same resource.

**Flagged (cantTell)**
```html
<iframe title="Weather widget" src="https://example.test/weather?city=nyc"></iframe>
<iframe title="Weather widget" src="https://example.test/weather?city=sf"></iframe>
```
Both frames share the same name but resolve to different resources — possibly two legitimately equivalent widgets, possibly a mislabeled frame; the markup alone doesn't settle it.

## identical-links-same-purpose

**Flagged (cantTell)**
```html
<a href="/articles/1">Read more</a>
<a href="/articles/2">Read more</a>
```
Both links share the accessible name "Read more" but resolve to different destinations.

**Not applicable**
```html
<a href="/articles/1">Read more: Quarterly results</a>
<a href="/articles/2">Read more: Product launch</a>
```
Each link's accessible name is distinct, so there's no same-name group to compare destinations within.

## iframe-focusable-content

**Passed**
```html
<iframe tabindex="-1" width="300" height="150" srcdoc="<p>No focusable content</p>"></iframe>
```
`tabindex="-1"` removes the frame from the tab order, and nothing inside it is focusable either.

**Failed**
```html
<iframe tabindex="-1" width="300" height="150" srcdoc="<a href='/x'>Link inside</a>"></iframe>
```
The host frame is skipped by `tabindex="-1"`, but the link inside it is still reachable by Tab — the browser does not propagate the negative tabindex into the embedded document.

## iframe-name-present

**Passed**
```html
<iframe title="Video player" src="content.html"></iframe>
```
The `title` attribute names the frame.

**Failed**
```html
<iframe src="content.html"></iframe>
```
No `title`, `aria-label`, or `aria-labelledby`.

## iframe-title-unique

**Passed**
```html
<iframe title="Chat widget" src="content.html"></iframe>
```
No other frame on the page shares this title.

**Flagged (cantTell)**
```html
<iframe title="Video player" src="a.html"></iframe>
<iframe title="Video player" src="b.html"></iframe>
```
Two frames share the same title but load different content; a person checks whether they serve the same purpose. Two frames that share a title and load the same `src` pass.

## image-alt-long

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<img src="chart.png" alt="Bar chart showing the sales of each of our twelve regional shops month by month for 2025">
```
The text alternative runs to 88 characters; a person decides whether it should be shorter. The same question is asked of `aria-label`, `aria-labelledby`, `title` and an svg's `<title>`, on any kind of image.

**Not applicable**
```html
<img src="chart.png" alt="Sales by shop in 2025">
```
A short text alternative.

## image-redundant-alt

**Flagged (cantTell)**
```html
<a href="/"><img alt="Home" src="home.png">Home</a>
```
The image's `alt` text ("Home") duplicates the adjacent visible link text word for word — a screen reader announces it twice.

**Not applicable**
```html
<a href="/"><img alt="Home icon" src="home.png">Home</a>
```
The `alt` text ("Home icon") differs from the adjacent text ("Home").

## img-alt-decorative

*Manual; flags every applicable element with a detected text alternative for review, not only the ones that look wrong.*

**Flagged (cantTell)**
```html
<img src="quarterly-trend.png" alt="">
```
Marked decorative with `alt=""`, but a filename like "quarterly-trend" suggests this might actually be an informative chart, not decoration.

**Not applicable**
```html
<button aria-label="Close"><img src="x-icon.png" alt=""></button>
```
The button's own `aria-label` already provides the accessible name; the icon's exclusion isn't this element's decorative question to review.

## img-alt-present

**Passed**
```html
<img src="image.png" alt="Green rectangle">
```
A non-empty `alt` is present.

**Failed**
```html
<img src="image.png">
```
No `alt` attribute at all (an empty `alt=""` would instead pass as decorative).

## img-alt-quality

*Manual; flags every applicable element with a detected text alternative for review, not only the ones that look wrong.*

**Flagged (cantTell)**
```html
<img src="chart.png" alt="image">
```
Non-empty alt is present, but "image" restates the element type instead of describing what the chart shows — worth a reviewer's judgment.

**Not applicable**
```html
<img src="border.png" alt="">
```
Empty alt marks the image decorative; that's `img-alt-decorative`'s question, not this rule's.

## img-decorative-no-alternative

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<img src="filet.png" alt="">
```
The decorative image has no `aria-labelledby`, `aria-label` or `title`.

**Failed**
```html
<img src="filet.png" alt="" aria-hidden="true" aria-label="Décor">
```
The image is hidden from assistive technologies but has an `aria-label`.

**Flagged (cantTell)**
```html
<img src="logo.png" alt="" title="Logo">
```
The image may carry information, and then its `title` is its alternative; a person decides.

## input-image-alt-decorative

*Manual; flags every applicable element with a detected text alternative for review, not only the ones that look wrong.*

**Flagged (cantTell)**
```html
<input type="image" src="submit.png" alt="" title="Submit order">
```
Empty alt is unusual on a functional control; a `title` still names it, but worth confirming the empty alt was deliberate.

**Not applicable**
```html
<input type="image" src="submit.png" alt="Submit order">
```
Non-empty alt is `input-image-alt-quality`'s question, not this rule's.

## input-image-alt-present

**Passed**
```html
<input type="image" src="search.png" alt="Search">
```
A non-empty `alt` names the image button.

**Failed**
```html
<input type="image" src="search.png">
```
No `alt` attribute.

## input-image-alt-quality

*Manual; flags every applicable element with a detected text alternative for review, not only the ones that look wrong.*

**Flagged (cantTell)**
```html
<input type="image" src="submit.png" alt="Submit order">
```
Non-empty alt is present on this image button, worth confirming "Submit order" matches what the button actually does. An image button named only by `aria-label`, `aria-labelledby` or `title` is asked about too.

**Not applicable**
```html
<input type="image" src="submit.png" alt="" title="Submit order">
```
Empty alt on a functional control is `input-image-alt-decorative`'s question, not this rule's.

## keyboard-only-event-handlers

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<div tabindex="0" onkeydown="openMenu(event)">Menu</div>
```
The element reacts to the keyboard, but the markup shows no click or pointer handler. RGAA 7.3.1 also asks that the action works with a mouse, touch or stylus, here or on an equivalent element. WCAG 2.1.1 has nothing to ask here.

**Not applicable**
```html
<button type="button" onkeydown="openMenu(event)">Menu</button>
```
A button is activable with a pointer on its own, so the key handler needs no pointer twin.

## label-for-target-valid

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<label for="email">Email</label>
<input id="email" type="email">
```
The `for` value is the id of the field.

**Failed**
```html
<label for="e-mail">Email</label>
<input id="email" type="email">
```
No element has the id `e-mail`, so the label labels nothing.

## label-in-name

**Passed**
```html
<button aria-label="Save changes">Save</button>
```
The accessible name ("Save changes") contains the visible text ("Save").

**Failed**
```html
<button aria-label="Submit form">Save</button>
```
The accessible name doesn't contain the visible label text at all.

## label-title-only

**Flagged (cantTell)**
```html
<input title="Name">
```
The `title` attribute is the field's only naming mechanism — it shows as a tooltip, not a persistent visible label.

**Not applicable**
```html
<label>Name <input title="Enter your full name"></label>
```
A real `<label>` already names the field; `title` is just supplementary.

## landmark-banner-is-top-level

**Flagged (cantTell)**
```html
<div role="navigation">
  <div role="banner">Nested banner</div>
</div>
```
A banner landmark nested inside another landmark no longer functions as the page's single top-level header.

**Not applicable**
```html
<header>Site header</header>
```
The banner is not nested inside any other landmark.

## landmark-complementary-is-top-level

**Flagged (cantTell)**
```html
<nav aria-label="Section navigation">
  <div role="complementary">Related links</div>
</nav>
```
A complementary landmark nested inside a navigation landmark.

**Not applicable**
```html
<aside>Related links</aside>
```
The complementary landmark is not nested inside any other landmark.

## landmark-contentinfo-is-top-level

**Flagged (cantTell)**
```html
<div role="navigation">
  <div role="contentinfo">Nested contentinfo</div>
</div>
```
A contentinfo landmark nested inside another landmark no longer functions as the page's single top-level footer.

**Not applicable**
```html
<footer>Site footer</footer>
```
The contentinfo is not nested inside any other landmark.

## landmark-main-is-top-level

**Flagged (cantTell)**
```html
<div role="navigation">
  <main>Nested main</main>
</div>
```
The main landmark is nested inside a navigation landmark instead of being top-level.

**Not applicable**
```html
<main>Content</main>
```
The main landmark is not nested inside any other landmark.

## landmark-no-duplicate-banner

**Flagged (cantTell)**
```html
<body>
  <header>First</header>
  <header>Second</header>
</body>
```
Two top-level `<header>` elements both resolve to the banner role.

**Not applicable**
```html
<body>
  <header>Site header</header>
</body>
```
Only one banner landmark exists.

## landmark-no-duplicate-contentinfo

**Flagged (cantTell)**
```html
<body>
  <footer>First</footer>
  <footer>Second</footer>
</body>
```
Two top-level `<footer>` elements both resolve to the contentinfo role.

**Not applicable**
```html
<body>
  <footer>Site footer</footer>
</body>
```
Only one contentinfo landmark exists.

## landmark-no-duplicate-main

**Flagged (cantTell)**
```html
<body>
  <main>First</main>
  <main>Second</main>
</body>
```
Two `<main>` elements are both exposed to assistive technology as main landmarks.

**Not applicable**
```html
<body>
  <main>Only one</main>
</body>
```
Only one main landmark exists.

## landmark-one-main

**Flagged (cantTell)**
```html
<body>
  <header>Site</header>
  <p>Primary content, no landmark.</p>
</body>
```
No `<main>` or `role="main"` anywhere on the page.

**Not applicable**
```html
<body>
  <main>Primary content</main>
</body>
```
A `<main>` landmark exists, so there is nothing to flag.

## landmark-unique

**Flagged (cantTell)**
```html
<nav aria-label="Site">First</nav>
<nav aria-label="Site">Second</nav>
```
Two navigation landmarks share the identical accessible name, so a screen reader user can't tell them apart in the landmarks list.

**Not applicable**
```html
<nav aria-label="Primary">Primary nav</nav>
<nav aria-label="Footer">Footer nav</nav>
```
Each navigation landmark has a distinct accessible name.

## layout-table-no-data-markup

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<table role="presentation">
  <tr><td>Menu</td><td>Content</td></tr>
</table>
```
The layout table has only plain cells.

**Failed**
```html
<table role="presentation">
  <tr><th>Menu</th><td>Content</td></tr>
</table>
```
The layout table has a header cell.

## letters-spaced-with-spaces

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<h2>S O L D E S</h2>
```
A screen reader reads six separate letters instead of a word.

**Not applicable**
```html
<h2 style="letter-spacing: 0.5em">SOLDES</h2>
```
The same look, made with CSS, keeps the word whole.

## link-content-label-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<a href="/"><img src="logo.png" alt="Home"></a>
```
The link content is an image with a text alternative.

**Failed**
```html
<a href="/" aria-label="Home">
  <svg aria-hidden="true" width="16" height="16"><path d="M0 8 8 0 16 8"/></svg>
</a>
```
The link has an accessible name, from `aria-label`, but nothing between `<a>` and `</a>` gives it a label, which RGAA 6.2.1 requires.

## link-context-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<div>
  <a href="/rapport" aria-describedby="d">En savoir plus</a>
  <span id="d">sur le rapport annuel 2025</span>
</div>
```
The link text is generic, and its only context is the aria-describedby text, which WCAG accepts (technique ARIA1) but RGAA's glossary entry "Contexte du lien" does not list. A person checks whether the sentence, paragraph, list item, table cell or preceding heading makes it explicit.

**Not applicable**
```html
<p>Rapport annuel 2025 : <a href="/rapport">en savoir plus</a></p>
```
The paragraph is one of the contexts RGAA lists. A generic link with no context at all is `link-name-quality`'s question.

## link-in-text-block

**Passed**
```html
<p>Read <a href="#" style="text-decoration:underline">this underlined link</a> for more information.</p>
```
The link is underlined, distinguishing it from surrounding text by more than color.

**Failed**
```html
<p style="color:#222222;">Read <a href="#" style="text-decoration:none; color:#2a2a2a;">this link</a> for more information.</p>
```
The only difference from surrounding text is a color shift with about 1.1:1 contrast, well under the 3:1 minimum, and no underline or weight/style change.

**Flagged (cantTell)**
```html
<p style="color:#000000;">Read <a href="#" style="text-decoration:none; color:#d00000;">this link</a> for more information.</p>
```
The link's color contrasts with the text by more than 3:1, but color is its only cue. Technique G183 also needs a non-color cue on hover and focus, which a person checks.

## link-label-in-name-sources

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<a href="/contact" title="Contact - nouvelle fenêtre">Contact</a>
```
The title contains the link text. Punctuation and capital letters do not count (`title="CONTACT !"` passes too).

**Failed**
```html
<a href="/contact" title="Ouvre une nouvelle fenêtre">Contact</a>
```
RGAA 6.1.5 checks that the title, the aria-label and the aria-labelledby text each contain the visible label, and this title does not. The link's accessible name is its text, so `label-in-name` (WCAG 2.5.3) has nothing to report.

## link-name-present

**Passed**
```html
<a href="/x">Read more</a>
```
The link's text content is its accessible name.

**Failed**
```html
<a href="/x"></a>
```
No text content, `aria-label`, or `aria-labelledby`.

## link-name-quality

*A link with no accessible name at all is `link-name-present`'s concern, not this rule's.*

**Flagged (cantTell)**
```html
<a href="/x">Click here</a>
```
"Click here" is a known generic phrase that doesn't describe the link's destination out of context.

**Not applicable**
```html
<a href="/x">Download the 2026 pricing guide</a>
```
The link text is specific and descriptive.

## link-state-colors-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Fails (in a browser)**
```html
<style>
  p { color: #000; }
  p a { color: #b00000; text-decoration: none; }
  a:visited { color: #555; }
</style>
<p>Lire <a href="/article">la suite</a> de l'article.</p>
```
The link is shown only by its color, and its visited state has another color, #555, at 2.82:1 against the surrounding text. RGAA 10.6.1 step 3 asks for 3:1 in each state shown by another color. In a browser the rule puts the link in that state and measures it; in jsdom it can only ask.

**Flagged (cantTell)**
```html
<style>
  p a { text-decoration: none; }
</style>
<p>Lire <a href="/article">la suite</a> de l'article.</p>
```
No style rule sets the link's color, so the browser's own visited color applies, and browsers differ on it.

**Passes (in a browser)**
```html
<style>
  p { color: #000; }
  p a { color: #f60; text-decoration: none; }
  a:hover, a:focus { color: #09f; }
</style>
<p>Lire <a href="/article">la suite</a> de l'article.</p>
```
The hover and focus colors both contrast more than 3:1 with the surrounding text.

**Not applicable**
```html
<style>
  p a { color: #b00000; text-decoration: underline; }
  a:hover { color: #700000; }
</style>
<p>Lire <a href="/article">la suite</a> de l'article.</p>
```
The underline marks the link without color, so 10.6.1 does not apply to it.

## list-children-valid

**Passed**
```html
<ul>
  <li>Apple</li>
  <li>Banana</li>
</ul>
```
`<ul>`'s only direct children are `<li>`.

**Failed**
```html
<ul>
  <li>Elderberry</li>
  <div>wrapper</div>
</ul>
```
A `<div>` is a direct child of `<ul>` alongside the `<li>`.

## listbox-name-present

**Passed**
```html
<ul role="listbox" tabindex="0" aria-label="Fruit"></ul>
```
`aria-label` names the listbox.

**Failed**
```html
<ul role="listbox" tabindex="0"></ul>
```
No accessible name from any supported mechanism.

## listbox-option-groups-absent

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<div role="listbox" aria-label="Colour" tabindex="0">
  <div role="option" aria-selected="true">Red</div>
  <div role="option" aria-selected="false">Blue</div>
</div>
```
The listbox holds options only.

**Failed**
```html
<div role="listbox" aria-label="City" tabindex="0">
  <div role="group" aria-label="France">
    <div role="option" aria-selected="false">Paris</div>
  </div>
</div>
```
The options are grouped with `role="group"`. WAI-ARIA allows it, but RGAA 11.8's technical note says a list that needs grouping and is built with `role="listbox"` does not conform: use `<select>` and `<optgroup>`.

## listitem-parent-valid

**Passed**
```html
<ul>
  <li>Apple</li>
</ul>
```
`<li>` is inside a `<ul>`.

**Failed**
```html
<div>
  <li>Date</li>
</div>
```
`<li>` has no `<ul>`/`<ol>`/`role="list"` ancestor.

## main-element-structure

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<!doctype html>
<html lang="en">
  <head><title>Opening hours</title></head>
  <body>
    <main><h1>Opening hours</h1></main>
    <main hidden><h1>Holiday hours</h1></main>
  </body>
</html>
```
One `<main>` is visible; the other carries the `hidden` attribute (RGAA 9.2.1 step 5).

**Failed**
```html
<!doctype html>
<html lang="en">
  <head><title>Opening hours</title></head>
  <body>
    <main><h1>Opening hours</h1></main>
    <main style="display:none"><h1>Holiday hours</h1></main>
  </body>
</html>
```
The second `<main>` is hidden by CSS only; RGAA wants the `hidden` attribute. `role="main"` with no `<main>` element fails too. A page with neither is asked about, and a page without the HTML5 doctype is not applicable.

## manual-review

*This rule has no `notApplicable` branch at all — it returns `cantTell` unconditionally on every page, including an empty `<body>` — so there is only one example, not a pair.*

**Flagged (cantTell)**
```html
<body>
  <p>Any page content.</p>
</body>
```
Keyboard operability and focus order always need a person driving the page; this rule states that need on every run.

## markup-validation-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id. It has no `notApplicable` branch: RGAA 8.2 applies to every page.*

**Failed (with the `validator.report` probe)**
```html
<p class="intro" class="lead">Opening hours</p>
<!-- probe: { source: "generated", messages: [{ type: "error", lastLine: 1, message: "Duplicate attribute “class”." }] } -->
```
The W3C validator's report on the generated source lists an error, and each error it lists is a finding (RGAA 8.2.1). A report with no error, CSS messages and warnings aside, passes.

**Flagged (cantTell)**
```html
<p class="intro" class="lead">Opening hours: <span>Monday</p><p><b><i>9:00 to 17:00</b></i></p>
```
Without a report the page is asked about. Here the source repeats an attribute, leaves a `<span>` unclosed and misnests `<b>` and `<i>`: the browser repairs all three before the engine sees the page, so only the W3C validator can report them.

## media-alternative-transcript-evidence

**Not applicable**
```html
<video src="talk.mp4" controls aria-describedby="t1"></video>
<div id="t1">Transcript: Welcome to today's talk...</div>
```
`aria-describedby` binds to text explicitly identified as a transcript — strong evidence.

**Flagged (cantTell)**
```html
<video src="talk.mp4" controls></video>
```
No transcript or text-alternative evidence was found near the media element; the engine can't confirm one doesn't exist elsewhere on the page, so this is conservative, not a fail.

## media-transcript-adjacent

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<audio controls src="podcast-12.mp3"></audio>
<a href="/podcast/12/transcript">Transcript of episode 12</a>
```
The link to the transcript comes right after the audio, which is what RGAA 4.1 asks for (glossary "Lien ou bouton adjacent").

**Flagged (cantTell)**
```html
<video controls src="talk.mp4" aria-describedby="tr"></video>
<p>Recorded in March.</p>
<footer><div id="tr">Transcript: Hello and welcome…</div></footer>
```
`aria-describedby` ties a transcript to the video, which WCAG 1.2.1 accepts, but the transcript is not right before or after the video, so a person checks RGAA 4.1. The rule never fails: the media may not need a transcript, and a video may have audio description instead.

## menuitem-name-present

**Passed**
```html
<div role="menuitem" tabindex="0">Cut</div>
```
Visible text content is a valid name source for role="menuitem".

**Failed**
```html
<div role="menuitem" tabindex="0"></div>
```
No name and no content.

## meta-redirect-immediate

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<meta http-equiv="refresh" content="0; url=/new-address">
```
The redirect is immediate (RGAA 13.1.2).

**Flagged (cantTell)**
```html
<meta http-equiv="refresh" content="5; url=/new-address">
```
The redirect waits 5 seconds. That fails 13.1.2 unless it leaves an obsolete address for the new version of the page, which makes 13.1 not applicable; only a person can tell. The rule never fails.

## meta-refresh-no-exceptions

**Passed**
```html
<meta http-equiv="refresh" content="0; URL=/x">
```
A delay of exactly 0 is an immediate redirect; there's nothing to interrupt a user mid-read.

**Failed**
```html
<meta http-equiv="refresh" content="30; URL=/x">
```
At AAA, any positive delay fails, with no exemption for a long delay.

## meta-refresh-no-url-timing

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<meta http-equiv="refresh" content="72000">
```
The page reloads every 20 hours, the limit RGAA 13.1.1 accepts. WCAG 2.2.1 exempts only limits longer than 20 hours.

**Failed**
```html
<meta http-equiv="refresh" content="30">
```
The page reloads itself every 30 seconds. A redirect to another address is `meta-redirect-immediate`'s matter.

## meta-refresh-timing-absent

**Passed**
```html
<meta http-equiv="refresh" content="90000; URL=/x">
```
A delay over 20 hours (72000s) is exempt under WCAG 2.2.1 Exception 3.

**Failed**
```html
<meta http-equiv="refresh" content="30; URL=/x">
```
A 30-second delay refreshes the page on a timer the user cannot pause, stop, or extend.

## meta-viewport-large

**Flagged (cantTell)**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
```
`user-scalable=no` blocks zooming past whatever scale the page loads at, short of the AAA 500% best-practice target.

**Not applicable**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
```
`maximum-scale=5` (500%) already meets the best-practice ceiling this rule checks toward.

## meta-viewport-zoom-enabled

**Passed**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
```
`maximum-scale` of 5 (500%) still allows zooming well past the 200% WCAG 1.4.4 requires.

**Failed**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
```
`user-scalable=no` disables pinch-zoom entirely.

## meter-name-present

**Passed**
```html
<div role="meter" aria-valuenow="80" aria-label="Disk usage"></div>
```
`aria-label` names the meter.

**Failed**
```html
<div role="meter" aria-valuenow="80"></div>
```
No accessible name from any supported mechanism.

## mouse-only-event-handlers

**Flagged (cantTell)**
```html
<div onmouseover="show()" onmouseout="hide()">Hover-only tooltip trigger</div>
```
`onmouseover`/`onmouseout` have no `onfocus`/`onblur` counterpart, so a keyboard user can never trigger this behavior.

**Flagged (cantTell)**
```html
<div onmouseover="show()" onfocus="show()">Menu</div>
```
The `onfocus` handler never runs: the `<div>` cannot take focus.

**Not applicable**
```html
<div onmouseover="show()" onmouseout="hide()" onfocus="show()" onblur="hide()" tabindex="0">Hover + focus pair</div>
```
Each mouse handler is paired with a keyboard-equivalent focus handler.

## nested-interactive-controls-absent

**Passed**
```html
<button>Click me</button>
```
No nested interactive control.

**Failed**
```html
<button>
  <input type="checkbox"> Accept
</button>
```
A `<button>` contains a nested `<input type="checkbox">`, another focusable control.

## no-autoplay-audio

**Flagged (cantTell)**
```html
<audio autoplay src="x.mp3"></audio>
```
The audio autoplays unmuted with no `controls` attribute, giving the user no way to pause or stop it.

**Not applicable**
```html
<audio autoplay controls src="x.mp3"></audio>
```
Native `controls` gives the user a pause/volume mechanism.

**Flagged (cantTell)**
```html
<embed src="welcome.mp3">
```
An `<embed>` or `<object>` that loads sound or video, and any `<bgsound>`, may play as soon as the page loads, and it has no `controls` or `muted` to read. One with `autostart="false"` (or a `<param>` saying so) is not asked about.

## object-image-role-img

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<object type="image/png" data="chart.png" role="img" aria-label="Ventes 2024"></object>
```
The image object has `role="img"` and a text alternative.

**Failed**
```html
<object type="image/png" data="chart.png"></object>
```
No text alternative, no fallback content, and no link or button to an alternative content after it.

**Flagged (cantTell)**
```html
<object type="image/png" data="chart.png">Ventes 2024 : 10 000</object>
```
The content inside `<object>` is not a text alternative under RGAA 1.1.6; a person checks how the image is made accessible.

## object-text-alternative-present

**Passed**
```html
<object data="chart.svg" type="image/svg+xml">Sales chart for 2024</object>
```
Fallback content between the tags counts as a text alternative.

**Failed**
```html
<object data="chart.svg" type="image/svg+xml"></object>
```
No fallback content and no accessible name.

## object-text-alternative-quality

*Manual; flags every applicable element with a detected text alternative for review, not only the ones that look wrong.*

**Flagged (cantTell)**
```html
<object data="brochure.pdf" type="application/pdf">Product brochure (PDF)</object>
```
Fallback text is present — worth confirming "Product brochure (PDF)" is genuinely equivalent to the embedded document, not just a filler caption.

**Not applicable**
```html
<object data="brochure.pdf" type="application/pdf"></object>
```
No fallback content, ARIA name, or title exists to review; that's `object-text-alternative-present`'s failure instead.

## office-document-link

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<a href="/files/annual-report.pdf">Annual report</a>
```
The link downloads a PDF; a person checks the document or its accessible version.

**Flagged (cantTell)**
```html
<a href="/get?file=rapport.pdf">Rapport annuel</a>
```
The query string names a PDF, so the link downloads one even though its path has no extension.

**Not applicable**
```html
<a href="/annual-report.html">Annual report</a>
```
The link goes to a web page, not an office document.

## optgroup-label-not-empty

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<select aria-label="Destination">
  <optgroup label="Europe"><option>Paris</option></optgroup>
</select>
```
The label is not empty. Whether it is relevant is for a person.

**Failed**
```html
<select aria-label="Destination">
  <optgroup label=""><option>Paris</option></optgroup>
</select>
```
The label is empty, so it cannot be relevant (RGAA 11.8.3). optgroup-label-present passes it: 11.8.2 asks only whether the attribute exists.

## optgroup-label-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<select aria-label="City">
  <optgroup label="France"><option>Paris</option></optgroup>
</select>
```
The option group has a `label`.

**Failed**
```html
<select aria-label="City">
  <optgroup><option>Paris</option></optgroup>
</select>
```
The option group has no `label` attribute.

## option-name-present

**Passed**
```html
<div role="option" tabindex="0">Apple</div>
```
Visible text content is a valid name source for role="option".

**Failed**
```html
<div role="option" tabindex="0"></div>
```
No name and no content.

## orientation-content-parity

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Fails (in a browser)**
```html
<style>@media (orientation: portrait) { .prices { display: none } }</style>
<table class="prices"><tr><th>Adult</th><td>12 €</td></tr></table>
```
The price table disappears in portrait and its text is shown nowhere else there. The page still works in both orientations, so WCAG 1.3.4 passes, but RGAA 13.9.1 asks that the content stays the same. In jsdom, which cannot lay the page out, the rule asks about the table instead.

**Passes (in a browser)**
```html
<style>
  @media (orientation: portrait) { .wide { display: none } }
  @media (orientation: landscape) { .narrow { display: none } }
</style>
<nav class="wide"><a href="/">Home</a> <a href="/contact">Contact</a></nav>
<nav class="narrow"><a href="/">Home</a> <a href="/contact">Contact</a></nav>
```
Each orientation shows its own version of the same links, so the content stays the same.

**Not applicable**
```html
<style>@media (orientation: portrait) { .prices { width: 100% } }</style>
<table class="prices"><tr><th>Adult</th><td>12 €</td></tr></table>
```
The orientation query only changes the layout; it hides nothing.

## p-as-heading

**Flagged (cantTell)**
```html
<style>.fakeHeading { font-weight: bold; font-size: 22px; }</style>
<p class="fakeHeading">Section Title</p>
```
Bold, heading-sized, and short — visually a heading, but marked up as a plain `<p>` with no heading semantics.

**Not applicable**
```html
<p>Just a normal paragraph of body text that is not bold at all.</p>
```
Normal weight and size; nothing visually suggests a heading.

**Flagged (cantTell)**
```html
<div style="font-size: 24px"><span style="font-weight: bold">Our team</span></div>
```
A `<div>` holding only text is checked like a `<p>`, and the bold can come from a styled `<span>` inside it. A `<div>` that holds other blocks, and text inside a button, label or table header, is not asked about.

## page-has-heading-one

**Flagged (cantTell)**
```html
<body>
  <h2>Section</h2>
  <p>No top-level heading anywhere on the page.</p>
</body>
```
No `<h1>` or `role="heading" aria-level="1"` exists.

**Not applicable**
```html
<body>
  <h1>Page title</h1>
</body>
```
A level-one heading exists, so there is nothing to flag.

## page-language-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<html>
  <head><title>Annual report</title></head>
  <body lang="en"><p>Hello</p></body>
</html>
```
The language is on `<body>`, a parent of every text, which RGAA 8.3.1 accepts. WCAG 3.1.1 (`html-lang-attr-present`) fails this page.

**Failed**
```html
<html>
  <head><title>Annual report</title></head>
  <body><p lang="en">Hello</p><p>World</p></body>
</html>
```
"World" has no language: neither `<html>` nor any of its parents has `lang` or `xml:lang`.

## page-title-patterns

**Flagged (cantTell)**
```html
<title>Home</title>
```
"Home" is one of the conservative generic-title signals this rule reviews.

**Not applicable**
```html
<title>Quarterly Sales Report — Q3 2026</title>
```
The title is specific to the page's content, matching none of the low-descriptiveness patterns.

## page-title-present

**Passed**
```html
<html>
  <head><title>Quarterly report</title></head>
  <body>Hi</body>
</html>
```
The document has a non-empty `<title>`.

**Failed**
```html
<html>
  <head></head>
  <body>Hi</body>
</html>
```
No `<title>` element anywhere in the document.

## page-title-unique

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed (with the `crawl.pageTitles` probe)**
```html
<title>Horaires – Médiathèque de Lyon</title>
<!-- probe: { pages: [{ url: "/contact", title: "Contact – Médiathèque de Lyon" }] } -->
```
No other page of the site has this title.

**Failed (with the `crawl.pageTitles` probe)**
```html
<title>Médiathèque de Lyon</title>
<!-- probe: { pages: [{ url: "/contact", title: "Médiathèque de Lyon" }] } -->
```
The contact page has the same title, so the title does not identify the page « de manière claire, concise et unique », as RGAA 8.6.1's glossary asks. WCAG 2.4.2 does not ask for unique titles. Without the probe, the rule asks.

## page-zones-reachable

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<header><a href="/">Médiathèque</a></header>
<nav><a href="/agenda">Agenda</a></nav>
<main><h1>Actualités</h1></main>
<footer>Mentions légales</footer>
```
Each area has the landmark that matches it.

**Flagged (cantTell)**
```html
<div class="header"><a href="/">Médiathèque</a></div>
<main><h1>Actualités</h1></main>
```
The block named `header` has no landmark, heading, button or link to reach or skip it. Whether it is the page's header area is a person's call, so RGAA 12.6.1 is asked about rather than failed. WCAG 2.4.1 is met here by the `<main>` landmark alone.

## password-paste-enabled

*This rule never fails — every case is either raised for review or left alone. An `addEventListener`-attached paste handler leaves no trace in markup, so it can't be demonstrated in a static example.*

**Flagged (cantTell)**
```html
<label for="p">Password</label>
<input type="password" id="p" onpaste="return false">
```
The inline handler cancels paste outright, blocking a password manager or a copied one-time code.

**Not applicable**
```html
<label for="p">Password</label>
<input type="password" id="p" autocomplete="current-password">
```
No paste handler is attached at all.

## presentation-role-conflict

**Flagged (cantTell)**
```html
<div role="presentation" aria-label="Conflicting">Content</div>
```
`role="presentation"` asks assistive technology to skip this element, but `aria-label` supplies a name — per WAI-ARIA conflict resolution, the global attribute wins and the presentation role is dropped, so the element (and its name) come back into the tree unexpectedly.

**Not applicable**
```html
<div role="presentation">Decorative</div>
```
No conflicting naming attribute is present alongside the presentation role.

## presentational-attributes-absent

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<table class="prices"><tr><td>12 €</td></tr></table>
```
The presentation is left to CSS.

**Failed**
```html
<table border="1" cellpadding="4"><tr><td>12 €</td></tr></table>
```
`border` and `cellpadding` are on RGAA 10.1.2's list of presentational attributes.

## presentational-children-focusable-absent

**Passed**
```html
<button>Save</button>
```
No presentational content that also happens to be focusable.

**Failed**
```html
<button>
  Save
  <span role="button" aria-label="save options" aria-expanded="false" tabindex="0">▼</span>
</button>
```
The nested `<span>` carries its own interactive role and tab stop inside the button's presentational content.

## presentational-elements-absent

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<p class="centred">Welcome</p>
```
The centring is left to CSS.

**Failed**
```html
<center>Welcome</center>
```
`<center>` is on RGAA 10.1.1's list of presentational elements.

## progressbar-name-present

**Passed**
```html
<div role="progressbar" aria-valuenow="50" aria-label="Upload progress"></div>
```
`aria-label` names the progress bar.

**Failed**
```html
<div role="progressbar" aria-valuenow="50"></div>
```
No accessible name from any supported mechanism.

## radio-group-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<p>Delivery</p>
<label><input type="radio" name="delivery"> Standard</label>
<label><input type="radio" name="delivery"> Express</label>
```
The two choices are not grouped, so "Delivery" is not announced with them.

**Not applicable**
```html
<fieldset>
  <legend>Delivery</legend>
  <label><input type="radio" name="delivery"> Standard</label>
  <label><input type="radio" name="delivery"> Express</label>
</fieldset>
```
The choices are in a fieldset with a legend.

## region

**Flagged (cantTell)**
```html
<body>
  <p>Stray paragraph, not inside any landmark.</p>
</body>
```
This paragraph sits directly under `<body>`, outside every landmark.

**Not applicable**
```html
<body>
  <main>
    <p>Everything lives inside a landmark.</p>
  </main>
</body>
```
All page content is contained within a landmark region.

## role-img-aria-name

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<div role="img" aria-label="Note : 3 sur 5">★★★</div>
```
The text alternative comes from `aria-label`.

**Failed**
```html
<div role="img" title="Note : 3 sur 5">★★★</div>
```
A `title` is not one of the sources RGAA 1.1.1 accepts for `role="img"`.

## role-img-text-alternative-present

**Passed**
```html
<span role="img" aria-label="Notifications"></span>
```
`aria-label` provides the text alternative.

**Failed**
```html
<span role="img">notifications</span>
```
Text content is not a valid name source for an element with an explicit role="img".

## scope-attr-valid

**Flagged (cantTell)**
```html
<table><tr><th scope="column">Name</th></tr></table>
```
"column" is not a valid `scope` value (the correct token is "col").

**Not applicable**
```html
<table><tr><th scope="col">Name</th></tr></table>
```
"col" is a valid `scope` value.

## scripted-components-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<script src="/js/tabs.js"></script>
<div role="tablist">
  <div role="tab" aria-selected="true">Details</div>
</div>
```
The page has script, so a person checks every scripted component against RGAA 7.1. The two `role` elements are listed as candidates; `tabs.js` may attach behaviour to other elements that the markup does not show.

**Not applicable**
```html
<h1>Opening hours</h1>
<p>Monday to Friday, 9:00 to 17:00.</p>
```
The page has no script element, inline handler, `javascript:` URL or custom element, so nothing can create or control a scripted component.

## scrollable-region-focusable

**Flagged (cantTell)**
```html
<style>.scrollY { overflow-y: auto; height: 100px; }</style>
<div class="scrollY">Plain long text content with no interactive children at all.</div>
```
The region can scroll, but it has no `tabindex` of its own and contains no focusable descendant, so a keyboard user can never reach it to scroll it.

**Not applicable**
```html
<style>.scrollY { overflow-y: auto; height: 100px; }</style>
<div class="scrollY" tabindex="0">Long content, but the region itself is focusable.</div>
```
`tabindex="0"` makes the scrollable region itself reachable by keyboard.

## searchbox-name-present

**Passed**
```html
<div role="searchbox" tabindex="0" aria-label="Search the site"></div>
```
`aria-label` names the searchbox.

**Failed**
```html
<div role="searchbox" tabindex="0"></div>
```
No accessible name from any supported mechanism.

## server-side-image-map-absent

**Passed**
```html
<img src="image.png" usemap="#nav" alt="Site map">
<map name="nav">
  <area href="/x" shape="rect" coords="0,0,10,10" alt="Go">
</map>
```
A client-side image map has no `ismap` attribute, which satisfies the rule outright. (An `<img ismap>` outside a link does nothing and makes the rule not applicable.)

**Flagged (cantTell)**
```html
<a href="/map-handler">
  <img src="image.png" ismap alt="Site map">
</a>
```
`ismap` depends on the browser sending click coordinates to the server, so the map's regions cannot be reached from the keyboard; whether the page offers the same destinations as links is for a person to check. This rule never fails.

## skip-link

**Flagged (cantTell)**
```html
<a href="#missing">Skip to main content</a>
```
The link's fragment target doesn't exist anywhere on the page, so activating it goes nowhere.

**Flagged (cantTell)**
```html
<a href="#contenu">Aller au contenu</a>
```
French skip-link wording is recognised as well, and the target is missing.

**Not applicable**
```html
<a href="#target">Skip to content</a>
<div id="target">Target content</div>
```
The fragment target exists and is usable.

## skip-link-placement

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed (in a browser, with the `crawl.skipLinks` probe)**
```html
<style>
  .skip { position: absolute; left: -9999px; }
  .skip:focus { left: 8px; top: 8px; }
</style>
<a class="skip" href="#main">Aller au contenu</a>
<nav><a href="/">Accueil</a> <a href="/contact">Contact</a></nav>
<main id="main"><h1>Actualités</h1></main>
```
The link shows when it takes focus, and the other pages in the probe, measured at the same window width, show it at the same place and first in the focus order.

**Failed (in a browser)**
```html
<style>
  .skip { position: absolute; left: -9999px; }
</style>
<a class="skip" href="#main">Aller au contenu</a>
<nav><a href="/">Accueil</a> <a href="/contact">Contact</a></nav>
<main id="main"><h1>Actualités</h1></main>
```
The link stays off the page even when it has focus. RGAA 12.7.2 asks that it be visible, at least on focus. Without the probe the rule also asks whether the link sits at the same place on the other pages, and in jsdom it asks about its visibility too.

## skip-link-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<a href="#main">Skip to content</a>
<nav><a href="/">Home</a> <a href="/contact">Contact</a></nav>
<main id="main"><h1>News</h1></main>
```
A link before the navigation leads to `<main>`.

**Failed**
```html
<nav><a href="/">Home</a> <a href="/contact">Contact</a></nav>
<main><h1>News</h1></main>
```
Navigation comes before the main content and no link leads to it. WCAG 2.4.1 accepts the main landmark as a way to bypass the navigation; RGAA 12.7.1 needs a link. Without the `<nav>`, the rule asks instead, since a one-page site may not need a skip link.

## slider-name-present

**Passed**
```html
<input type="range" aria-label="Volume">
```
`aria-label` names the native range input acting as a slider.

**Failed**
```html
<div role="slider" tabindex="0" aria-valuenow="5" aria-valuemin="0" aria-valuemax="10"></div>
```
No accessible name from any supported mechanism.

## spinbutton-name-present

**Passed**
```html
<div role="spinbutton" tabindex="0" aria-label="Quantity"></div>
```
`aria-label` names the spinbutton.

**Failed**
```html
<div role="spinbutton" tabindex="0"></div>
```
No accessible name from any supported mechanism.

## summary-name-present

**Passed**
```html
<details>
  <summary>More details</summary>
  <p>Body</p>
</details>
```
Visible text content names the `<summary>`.

**Failed**
```html
<details>
  <summary></summary>
  <p>Body</p>
</details>
```
No text content and no accessible name.

## svg-hidden-no-alternative

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<svg aria-hidden="true" width="16" height="16">
  <circle cx="8" cy="8" r="6"/>
</svg>
```
The hidden SVG has no text alternative.

**Failed**
```html
<svg aria-hidden="true" width="16" height="16">
  <title>Star</title>
  <circle cx="8" cy="8" r="6"/>
</svg>
```
The SVG is hidden as decorative but has a `<title>`.

## svg-image-text-alternative-present

**Passed**
```html
<svg width="40" height="24">
  <image href="logo.png"><title>Logo</title></image>
</svg>
```
A `<title>` inside the SVG `<image>` provides the alternative.

**Failed**
```html
<svg width="40" height="24" aria-label="container">
  <image href="logo.png"></image>
</svg>
```
The `<image>` itself has no `<title>`/`<desc>`/ARIA name (the outer `<svg>`'s label doesn't transfer to it).

## svg-role-img

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<svg role="img" aria-label="Logo" width="20" height="20">
  <circle cx="10" cy="10" r="8"/>
</svg>
```
The SVG has `role="img"` and an `aria-label`.

**Failed**
```html
<svg width="20" height="20">
  <title>Logo</title>
  <circle cx="10" cy="10" r="8"/>
</svg>
```
The SVG has a text alternative but no `role="img"`.

**Flagged (cantTell)**
```html
<svg role="img" width="20" height="20">
  <title>Logo</title>
</svg>
```
Named only by `<title>`: RGAA 1.1.5 lists only the ARIA sources, while 1.3.6 treats `<title>` as the alternative.

## svg-text-alternative-present

**Passed**
```html
<svg role="img"><title>Close</title></svg>
```
`<title>` provides the accessible name for an SVG with an explicit img role.

**Failed**
```html
<svg role="img"></svg>
```
No `<title>`, `<desc>`, or ARIA name.

## svg-text-alternative-quality

*Manual; flags every applicable element with a detected text alternative for review, not only the ones that look wrong.*

**Flagged (cantTell)**
```html
<svg role="img" viewBox="0 0 24 24"><title>Growth chart</title><path d="M0 0h24v24H0z"/></svg>
```
A `<title>` is present — worth confirming "Growth chart" describes what the chart actually shows, not just that it's a chart.

**Not applicable**
```html
<svg role="img" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>
```
No `<title>`/`<desc>` text, aria-label, or resolved aria-labelledby exists to review; that's `svg-text-alternative-present`'s failure instead.

## tab-name-present

**Passed**
```html
<div role="tab" tabindex="0">Apple</div>
```
Visible text content names the tab.

**Failed**
```html
<div role="tab" tabindex="0"></div>
```
No name and no content.

## tabindex

**Flagged (cantTell)**
```html
<div tabindex="3">Reordered</div>
```
A positive `tabindex` pulls this element out of the document's natural tab order and ahead of everything else, which usually surprises keyboard users.

**Not applicable**
```html
<div tabindex="0">Focusable</div>
```
`tabindex="0"` places the element in the natural tab order without reordering anything.

## table-duplicate-name

**Flagged (cantTell)**
```html
<table summary="Sales data">
  <caption>Sales data</caption>
  <tr><td>1</td></tr>
</table>
```
The `summary` attribute repeats the caption text word for word instead of adding anything new.

**Not applicable**
```html
<table summary="Data collected in fiscal year 2025">
  <caption>Sales data</caption>
  <tr><td>1</td></tr>
</table>
```
`summary` provides information the caption doesn't.

## table-fake-caption

**Flagged (cantTell)**
```html
<table>
  <tr><td>Monthly Sales Report</td></tr>
  <tr><td>Jan</td><td>100</td></tr>
  <tr><td>Feb</td><td>200</td></tr>
</table>
```
A lone cell sits alone in the first row above rows that all have multiple cells, and there's no real `<caption>` — it looks like a caption pretending to be a data cell.

**Not applicable**
```html
<table>
  <caption>Monthly Sales Report</caption>
  <tr><td>Title cell</td></tr>
  <tr><td>Jan</td><td>100</td></tr>
</table>
```
The table has a real `<caption>` element.

## table-headers-attr-valid

**Passed**
```html
<table>
  <tr><th id="h1">Name</th></tr>
  <tr><td headers="h1">Apple</td></tr>
</table>
```
`headers="h1"` resolves to a real cell in the same table.

**Failed**
```html
<table>
  <tr><th id="h2">Name</th></tr>
  <tr><td headers="missing">Banana</td></tr>
</table>
```
`headers` references an id that doesn't exist in the table.

## table-th-has-data-cells

**Passed**
```html
<table>
  <tr><th>Name</th></tr>
  <tr><td>Apple</td></tr>
</table>
```
The table has at least one `<td>` for the `<th>` to head.

**Failed**
```html
<table>
  <tr><th>Name</th></tr>
</table>
```
The table has a `<th>` but zero `<td>` anywhere.

## target-size-minimum

*Confirmed against the engine's own geometry-testing harness (`patchTargetSizeEnv`), which encodes element size/position as a `data-rect` attribute rather than real CSS layout (JSDOM doesn't render). The CSS below is what a real browser would need to reproduce the same result; it isn't lifted from the fixture's own markup.*

**Passed**
```html
<button style="width:24px; height:24px;">+</button>
```
Meets the 24×24 CSS pixel minimum on its own.

**Failed**
```html
<button style="width:10px; height:10px;">A</button>
<button style="width:10px; height:10px; margin-left:5px;">B</button>
```
Both targets are under 24×24 and closer together than the spacing exception allows.

## td-has-header

**Passed**
```html
<table>
  <tr><th></th><th>Q1</th><th>Q2</th><th>Q3</th></tr>
  <tr><th>North</th><td>1</td><td>2</td><td>3</td></tr>
  <tr><th>South</th><td>4</td><td>5</td><td>6</td></tr>
  <tr><th>East</th><td>7</td><td>8</td><td>9</td></tr>
</table>
```
Every `<td>` has both an implicit row header (`<th>` earlier in its row) and column header (`<th>` earlier in its column). The 4x4 minimum size isn't optional — this rule is inapplicable to smaller tables.

**Failed**
```html
<table>
  <tr><td>a</td><td>b</td><td>c</td><td>d</td></tr>
  <tr><td>e</td><td>f</td><td>g</td><td>h</td></tr>
  <tr><td>i</td><td>j</td><td>k</td><td>l</td></tr>
  <tr><td>m</td><td>n</td><td>o</td><td>p</td></tr>
</table>
```
A 4x4 table with no `<th>` anywhere — no cell has a row, column, or `headers`-attribute association.

## text-spacing-content-loss

**Passed (in a browser)**
```html
<p>Opening hours today, and the rest of the week from nine to five.</p>
```
The paragraph has no fixed size, so the text grows with the spacing and nothing is lost.

**Failed (in a browser)**
```html
<style>
  .hours { width: 19ch; height: 20px; overflow: hidden; }
</style>
<div class="hours">Opening hours today</div>
```
With line height 1.5, letter spacing 0.12em and word spacing 0.16em, the text wraps to a second line that the box cuts off. In jsdom, which has no layout, the rule reads only the style sheets and asks about spacing forced with `!important`.

## textbox-name-present

**Passed**
```html
<div role="textbox" tabindex="0" aria-label="Search the site"></div>
```
`aria-label` names the textbox.

**Failed**
```html
<div role="textbox" tabindex="0"></div>
```
No accessible name from any supported mechanism.

## th-scope-row-col

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<table>
  <tr><td></td><th scope="colgroup" colspan="2">2025</th></tr>
  <tr><td></td><th scope="col">Q1</th><th scope="col">Q2</th></tr>
  <tr><th scope="row">North</th><td>10</td><td>12</td></tr>
</table>
```
RGAA accepts `scope="col"` or `"row"` on a header over a whole column or row (5.7.2), and no `scope`, with a unique `id`, on one over part of it (5.7.3). `scope="colgroup"` fails one of the two; which one depends on what the header covers, so a person decides.

**Not applicable**
```html
<table>
  <tr><th scope="col">Name</th><th scope="col">Age</th></tr>
  <tr><td>Ada</td><td>36</td></tr>
</table>
```
The headers use `scope="col"`.

## title-placeholder-identical

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id. It asks rather than fails: RGAA states the requirement in its glossary but names no test for it.*

**Passed**
```html
<input type="email" title="Adresse e-mail" placeholder="Adresse e-mail">
```
The title and the placeholder are identical.

**Flagged (cantTell)**
```html
<label for="nom">Nom</label>
<input type="text" id="nom" title="Nom de famille" placeholder="Dupont">
```
RGAA's glossary entry "Étiquette de champ de formulaire" says a placeholder may be read in place of the title, so the two must be identical when both are present.

## tooltip-name-present

**Passed**
```html
<div role="tooltip">Click to save your changes</div>
```
Visible text content names the tooltip.

**Failed**
```html
<div role="tooltip"></div>
```
No text content and no accessible name.

## treeitem-name-present

**Passed**
```html
<div role="treeitem" tabindex="0">Apple</div>
```
Visible text content names the tree item.

**Failed**
```html
<div role="treeitem" tabindex="0"></div>
```
No name and no content.

## valid-lang

**Passed**
```html
<p lang="fr">Bonjour</p>
```
"fr" is a syntactically valid BCP 47 language tag.

**Failed**
```html
<p lang="xyz123!!">???</p>
```
The value isn't valid BCP 47 syntax.

## video-caption

**Flagged (cantTell)**
```html
<video src="x.mp4"></video>
```
No `<track>` element at all, so no evidence of captions. A video whose only track is `kind="subtitles"` is asked about too, since subtitles may translate the dialogue without the sound information captions carry.

**Not applicable**
```html
<video src="x.mp4"><track kind="captions" src="cap.vtt"></video>
```
A `kind="captions"` track with a real `src` is present.

## video-captions-track-kind

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<video controls src="talk.mp4">
  <track src="talk.vtt" kind="captions" srclang="en" label="English">
</video>
```
The caption track has `kind="captions"`.

**Failed**
```html
<video controls src="talk.mp4">
  <track src="talk.vtt" kind="subtitles" srclang="en" label="English">
</video>
```
On a page with `lang="en"`, the only text track is marked as subtitles although it is in the video's language. Subtitles in another language, or without `srclang`, are asked about instead (cantTell), since they may be translations.

## video-poster-text-alternative-present

**Passed**
```html
<video poster="poster.png" aria-label="Product demo"></video>
```
`aria-label` names the video element that carries the poster image.

**Failed**
```html
<video poster="poster.png"></video>
```
No accessible name and no fallback; a poster attribute alone isn't a text alternative.

## viewport-zoom-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
```
The tag blocks pinch zoom, which WCAG 1.4.4 fails through `meta-viewport-zoom-enabled`. RGAA 10.4.2 passes if text still reaches 200% with the browser text zoom, the browser graphic zoom or a zoom control of the site, so a person checks those.

**Not applicable**
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```
The tag sets neither `user-scalable` nor `maximum-scale`, so it does not limit zoom.
## widget-label-in-name

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<div role="tablist">
  <div role="tab" tabindex="0" aria-selected="true" aria-label="Paramètres avancés">Paramètres</div>
</div>
```
The tab's accessible name contains its visible text.

**Failed**
```html
<div role="tablist">
  <div role="tab" tabindex="0" aria-selected="true" aria-label="Réglages">Paramètres</div>
</div>
```
The accessible name of this scripted component does not contain its visible label (RGAA 7.1.3). A single visible character, such as "B" in an editor's menu named "Mettre en gras", is asked about (cantTell): RGAA lets the name express what a symbol means.
