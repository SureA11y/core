# Rule examples

Hand-authored `Passed`/`Failed` (or, for manual rules, `Flagged`/`Not applicable`)
example pairs for all 132 rules, meant to feed a future rule-page docs site the
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
The area has non-empty alt text in a used image map — worth confirming "Room 12" is accurate for that region.

**Not applicable**
```html
<map name="unused">
  <area href="/rooms/12" shape="rect" coords="0,0,40,24" alt="Room 12">
</map>
```
No `<img usemap>` references this map, so the area is never hit-tested or rendered — out of scope.

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
<p style="line-height:1.2 !important">Spaced text</p>
```
`!important` forces line-height below the 1.5 minimum, and the page's own styles can't override it.

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

## css-focus-indicator-suppressed

**Flagged (cantTell)**
```html
<style>.reset-only:focus { outline: none; }</style>
<a class="reset-only" href="/pricing">Pricing</a>
```
`:focus { outline: none; }` removes the focus indicator, and no other rule matching this link draws a replacement.

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
```
No `<blink>` or `<marquee>` element anywhere, which satisfies the rule outright — there is no separate not-applicable case.

**Failed**
```html
<marquee>Breaking news</marquee>
```
`<marquee>`'s auto-scrolling has no built-in way for a user to pause, stop, or hide it.

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

**Failed**
```html
<iframe title="Video player" src="a.html"></iframe>
<iframe title="Video player" src="b.html"></iframe>
```
Two frames on the same page share the identical title despite embedding different content.

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
Non-empty alt is present on this image button — worth confirming "Submit order" matches what the button actually does.

**Not applicable**
```html
<input type="image" src="submit.png" alt="" title="Submit order">
```
Empty alt on a functional control is `input-image-alt-decorative`'s question, not this rule's.

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

## manual-review

*This rule has no `notApplicable` branch at all — it returns `cantTell` unconditionally on every page, including an empty `<body>` — so there is only one example, not a pair.*

**Flagged (cantTell)**
```html
<body>
  <p>Any page content.</p>
</body>
```
Keyboard operability and focus order always need a person driving the page; this rule states that need on every run.

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
A client-side image map has no `ismap` attribute, which satisfies the rule outright — there is no separate not-applicable case.

**Failed**
```html
<a href="/map-handler">
  <img src="image.png" ismap alt="Site map">
</a>
```
`ismap` depends on the browser sending click coordinates to the server — there's no keyboard-operable equivalent.

## skip-link

**Flagged (cantTell)**
```html
<a href="#missing">Skip to main content</a>
```
The link's fragment target doesn't exist anywhere on the page, so activating it goes nowhere.

**Not applicable**
```html
<a href="#target">Skip to content</a>
<div id="target">Target content</div>
```
The fragment target exists and is usable.

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
No `<track>` element at all — no evidence of captions or subtitles.

**Not applicable**
```html
<video src="x.mp4"><track kind="captions" src="cap.vtt"></video>
```
A `kind="captions"` track with a real `src` is present.

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
