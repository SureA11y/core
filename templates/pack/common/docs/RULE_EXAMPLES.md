# Rule examples

Examples of each rule's outcomes, a `## <rule id>` section per rule. Each example is a label (**Passed**, **Failed**, **Flagged (cantTell)** or **Not applicable**) over an `html` block. `npm run docs` runs every example in Chromium with the pack and records any that gives another outcome than its label in `scripts/data/rule-examples-outcomes.json`; `npm run docs:check` fails when that record, or the catalog, is stale.

## __NAMESPACE__-link-text-specific

**Passed**
```html
<a href="/report">The 2026 annual report</a>
```

**Failed**
```html
<a href="/report">Read more</a>
```

**Not applicable**
```html
<p>No links</p>
```

## __NAMESPACE__-contrast-enhanced

**Passed**
```html
<p style="color:#000;background:#fff">Black on white</p>
```

**Failed**
```html
<p style="color:#767676;background:#fff">Grey on white: 4.5:1, below 7:1</p>
```

## __NAMESPACE__-new-window-review

**Flagged (cantTell)**
```html
<a href="/report" target="_blank">Annual report</a>
```

**Not applicable**
```html
<a href="/report">Annual report</a>
```
