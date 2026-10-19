# Real-world component patterns

Common components, each built accessibly, and the states a person meets them in. No
rule may fail any of them: `tests/engine-checks/patterns-chromium.test.js` runs every
rule on every state in Chromium and fails on any `fail`. They catch what the scenario
fixtures can't: a rule that reasons about the layout and is wrong on a real page,
such as a menu scrolled so a button shows 16px at its edge (#181). See
`docs/RULE_AUTHORING.md` §8.4 and §12.

| Page | What it covers | States |
|---|---|---|
| `dialog-autocomplete.html` | An autocomplete panel in a modal dialog's overlay, over a dark page | open; list scrolled to the end |
| `menu-scroll-auto.html` | A menu longer than its box, scrolling with `overflow: auto` | fourth item showing 16px; scrolled 20px; scrolled to the end |
| `menu-scroll-hidden.html` | The same menu with `overflow: hidden`, as a custom scrollbar has it | the same |
| `carousel.html` | Slides on a track in a box hiding its overflow | first slide; second slide; half way between |
| `accordion.html` | Panels collapsed by `height: 0` and by `hidden` | one panel open |
| `sticky-header.html` | A sticky header and toolbar over scrolled content | top; scrolled 400px; scrolled to the end |
| `virtual-list.html` | Rows positioned by transforms in a box hiding its overflow | top; rows cut at both edges |
| `off-canvas.html` | A navigation drawer moved off screen and hidden | closed; open |
| `table-sticky-head.html` | A table with a sticky header in a scrolling region | top; scrolled 100px |
| `tabs.html` | Tabs with a hidden panel | first tab |
| `toast.html` | A fixed notification over scrolled content | top; scrolled 600px |
| `dark-scheme.html` | A page in `color-scheme: dark` with its own colors | default |
| `hero-scrim.html` | Text on a hero image with a gradient scrim | default |
| `tooltip.html` | A tooltip shown above its button | shown |
| `cookie-banner.html` | A consent banner that locks the page's scroll, its buttons filled by a `::before` image under their text | open, scroll locked; closed |
| `design-system-links.html` | Links underlined by a thin background layer, buttons with empty background layers, a header with a drop shadow, a pager (the French state's design system) | default |
| `header-strip-chart.html` | Links over a `::before` strip, and an SVG chart whose labels sit inside a stroked frame | default |
| `skip-link-breadcrumb.html` | A skip link to an empty anchor after a breadcrumb in `<main>` | default |
| `custom-controls.html` | A `span` button with a key handler, and a container delegating clicks to its button | default |

The last five come from a comparison with RGAA engines on audited French sites, where rules failed or asked about pages built this way. A pattern can list rules in `settled` in `index.js`: those rules must give a verdict on it, and asking about it (`cantTell`) fails the test too, so a rule that starts asking again where it once had an answer is caught.

The states are listed in `index.js`: each is a script run once the page has loaded.
The pages share `_base.css`, and the test serves them over https so the style sheet
can be read.

## Adding one

1. Build the component as a careful author would: names, roles, labels, enough
   contrast and target size. The pattern must pass the rules for real, so check it
   with other engines too.
2. Add the page and its states to `index.js`, and the row above.
3. Run the test. A `fail`, or a question from a rule the pattern lists in `settled`,
   is a bug in a rule, or in the page: tell them apart before going on. A rule's bug found this way gets an issue; until it is fixed, list the
   failure in `knownFailures` with the finding's id.
