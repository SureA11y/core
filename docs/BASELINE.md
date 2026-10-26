# Baseline / allowlist

A strict CI gate ("fail the build on any `fail` outcome") is an adoption blocker for a team scanning an existing, imperfect site for the first time — they can't ship anything until every pre-existing violation is fixed. A baseline lets a team say "these N are already known — don't gate on them, but fail the moment a genuinely new one appears."

```sh
# Once: record every current fail occurrence, does not fail the build.
surea11y scan ./dist/index.html --write-baseline baseline.json

# Commit baseline.json to git.

# From then on, in CI: only a NEW (not-yet-baselined) fail occurrence gates the build.
surea11y scan ./dist/index.html --baseline baseline.json
```

The baseline file is meant to be committed to git, so accepting more accessibility debt becomes an explicit, reviewable decision — a new violation shows up as a new row in the file's diff in a PR, not a silent change in a count.

## When this is useful

- **Adopting scanning on an existing site.** The motivating case above: a first scan on a mature site can turn up hundreds of pre-existing violations. Baselining them once unblocks gating immediately instead of requiring "fix everything first."
- **Incremental remediation with a visible burn-down.** Fix violations in batches, then periodically regenerate the baseline with `--write-baseline`. Each regeneration's git diff *shrinks* as entries disappear — the file itself becomes a progress tracker, and a PR that fixes a batch of issues shows exactly what got cleaned up.
- **Third-party/vendor content you don't control.** A page embeds a widget (chat bubble, ad unit, payment iframe) with known, unfixable-by-you violations. Baselining just those specific occurrences is more precise than excluding the whole subtree via `excludeSelectors` (see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md)) — new issues introduced anywhere else near it, including inside your own code, still gate normally.
- **Regression safety net during a large refactor.** Mid-migration, some rules may legitimately fail temporarily in ways already tracked and being fixed across many PRs. Baselining the known-in-progress set still catches *unrelated* new regressions from other PRs during the same window, instead of turning the gate off entirely or blocking every PR on it.
- **Staged rollout of a new or stricter rule.** Turning on a rule (or a whole WCAG level) the codebase isn't clean against yet: baseline the existing gaps, enable gating immediately, and prevent any *new* violations of that rule while the backlog is cleaned up separately — rather than waiting to enable the rule until the codebase is already compliant.

## How matching works

Nothing in an occurrence's shape is a perfect, page-position-independent identity (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)): `selector` and `structuralPath` are both derived from the element's position in the DOM, so either can shift when *unrelated* markup changes elsewhere on the page, even though the flagged element itself never changed.

Instead, a baseline entry's identity is:

```
ruleId + reasonCode + html
```

where `reasonCode` is the rule-specific code from `occurrence.data.details.reasonCode` (defaulting to `"DEFAULT"` when a rule doesn't set one, or sets anything but a non-empty string), and `html` is the occurrence's outer-HTML snippet. This is content-based rather than position-based: it survives the flagged element moving around the page (a reorder, an unrelated sibling added/removed) as long as the flagged element's own markup doesn't change. For a finding about the page itself, reported on `<html>` or `<body>` (`html-lang-attr-present`, `bypass-blocks-present`, `landmark-one-main`), the snippet is the start tag alone, so editing the page's content doesn't make it new. The snippet is compared with each tag's attributes in name order and its class names sorted, so a build that writes `class="b a" src` where the last one wrote `src class="a b"` matches; baseline files written before this keep matching, since the comparison is made at match time. `selector` is still recorded in the baseline file, but purely for human context when reading a diff — it is never used for matching.

**Known limitation**: an element whose *own* markup includes dynamic content (a timestamp, a live counter, a randomly-generated id) will never match itself across two scans, since its `html` snippet differs every time. If your pages hit this case, the baseline mechanism won't help for those specific rules/elements — see "Alternative" below.

Matching counts occurrences, not just presence: if a page has 3 elements that produce byte-identical `ruleId`+`reasonCode`+`html` (e.g. the same broken component repeated 3 times) and the baseline recorded only 1 of them, a fresh scan reports 1 known and 2 new — not all 3 as known.

A finding inside a frame of a cross-frame result (`runa11yCoreAcrossFrames`) is told apart by its frame too: its entry records the frame's **path**, the selectors of the frame elements leading to it (`"frame": ["#checkout"]`), and matches only a finding in the frame at that path. The same broken component in the page and in a frame is two findings. Entries without `frame` are the page's own, so a baseline written from a single-document scan keeps matching the page.

A compact result (`engineOptions.output.detail: 'findings'`, see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#top-level-result)) is read as the full result it stands for, so it is reported the same.

Baseline entries that don't match anything in a fresh scan are reported as **stale**: the violation may have been fixed, or the element's markup changed, or the scan didn't reach it (another viewport, scope or set of rules). This is informational only and never gates the build; look at them, then regenerate the baseline with `--write-baseline` periodically to clean them up.

## Upgrading

A finding's identity includes its reason code, and a minor release may give a finding a new one: a rule that gave none (`DEFAULT`) now gives one, or one code is split in two by cause ([`API_STABILITY.md`](./API_STABILITY.md#finding-identity)). The finding is the same, and a baseline written before the upgrade still matches it: each move is listed in [`src/baseline-moves.json`](../src/baseline-moves.json) (rule, old code, new codes), and an entry under the old code matches the finding under a new one when the rest of its identity, the rule, the markup and the frame, is the same. `matchBaseline`, and the `baselineEntries` option of the SARIF and JUnit reporters, all read it. An entry is looked up under the finding's own code first, so it never goes to a moved finding when another finding has that exact identity.

1.14 moves these, from 1.13:

| Rule | Old code | New code |
|---|---|---|
| `img-alt-present`, `embed-text-alternative-present`, `object-text-alternative-present`, `svg-image-text-alternative-present`, `svg-text-alternative-present`, `video-poster-text-alternative-present` | `DEFAULT` | `TEXT_ALTERNATIVE_MISSING` |
| `area-alt-present` | `DEFAULT` | `TEXT_ALTERNATIVE_MISSING`, `TEXT_ALTERNATIVE_EMPTY` |
| `canvas-text-alternative-present` | `DEFAULT` | `TEXT_ALTERNATIVE_MISSING`, `ROLE_IMG_NAME_MISSING` |
| `area-alt-quality`, `canvas-text-alternative-quality`, `embed-text-alternative-quality`, `input-image-alt-quality`, `object-text-alternative-quality` | `DEFAULT` | `TEXT_ALTERNATIVE_REVIEW` |
| `img-alt-quality`, `svg-text-alternative-quality` | `DEFAULT` | `TEXT_ALTERNATIVE_REVIEW`, `IMAGE_ONLY_CONTROL_CONTENT` |
| `img-alt-decorative` | `EXCLUDED_ELEMENT_REVIEW` | `IMAGE_ONLY_CONTROL_CONTENT` |
| `input-image-alt-decorative` | `DEFAULT` | `NAME_FROM_ELSEWHERE_REVIEW` |
| `manual-review` | `DEFAULT` | `KEYBOARD_REVIEW` |
| `list-children-valid` | `LIST_INVALID_CHILD` | `LIST_ITEM_ROLE_OVERRIDDEN` |
| `listitem-parent-valid` | `LISTITEM_INVALID_PARENT` | `LIST_ROLE_OVERRIDDEN` |
| `aria-prohibited-children` | `ARIA_PROHIBITED_CHILD_ROLELESS` | `ARIA_PROHIBITED_CHILD` |
| `duplicate-id` | `DUPLICATE_ID` | `DUPLICATE_ID_IN_SHADOW_TREE` |
| `valid-lang` | `ELEMENT_LANG_INVALID` | `DEFAULT_LANG_INVALID` |
| `p-as-heading` | `BOLD_LARGE_PARAGRAPH`, `BOLD_LARGE_DIV` | `HEADING_LIKE_NUMBER`, `HEADING_LIKE_LINK` |

The table covers one minor release: a move is listed from the release it shipped in until the next minor release, which drops it when its finding identities are frozen (`npm run finding-ids:release`, as the `retired` list of `released-finding-ids.json` is emptied). So a baseline written by 1.13 keeps matching under 1.14.x, and needs regenerating before 1.15.

Regenerating the baseline with `--write-baseline` (or `buildBaselineEntries`) after an upgrade writes every finding under its current code, and removes the need for the table. It also accepts any finding the upgrade newly reports, so look at its diff. To bring the codes up to date without accepting anything new, rewrite the file with `migrateBaselineEntries` from `@surea11y/core/baseline`:

```js
const { migrateBaselineEntries } = require('@surea11y/core/baseline');

const file = JSON.parse(fs.readFileSync('baseline.json', 'utf8'));
// With the scan's result, an entry for a split code takes the code its finding has now.
file.entries = migrateBaselineEntries(file, result);
fs.writeFileSync('baseline.json', JSON.stringify(file, null, 2) + '\n');
```

It returns a copy of the entries with each moved one under its new code, and every other entry as it was. Without a result, it rewrites only the moves it can tell without the finding: a code the rule no longer gives that moved to a single new one (`img-alt-present`'s `DEFAULT`), not a split.

A finding whose outcome changed with the upgrade is another matter: a rule that now fails what it asked about, or asks about what it failed, gives a finding the baseline did not hold, or no longer gives one it held, and the changelog says why.

## Scanning at several viewport widths

A baseline entry does not record the viewport, and matching does not use it (see [`API_STABILITY.md`](./API_STABILITY.md#finding-identity)): the same element with the same defect matches at any width. That suits a page whose findings do not depend on its layout. A layout-dependent rule, such as `text-spacing-content-loss` or `target-size-minimum`, can fail at one width and not at another, so for a page scanned at several widths, keep **one baseline per width**: `a11y-baseline-390.json`, `a11y-baseline-1280.json`.

A single baseline written from every width still gates correctly, since a finding is new only when no entry matches it. But each run then reports the other widths' findings as stale, so the stale count stops telling you what was fixed.

## File format

```json
{
  "version": 1,
  "generatedAt": "2026-07-30T12:00:00.000Z",
  "entries": [
    { "ruleId": "img-alt-present", "reasonCode": "DEFAULT", "selector": "html > body > img", "html": "<img src=\"logo.png\">" }
  ]
}
```

`matchBaseline`, and the `baselineEntries` option of the SARIF and JUnit reporters, take the file as saved (`JSON.parse` of it) or its `entries` list.

`--baseline <path>` rejects a file that isn't `{ version: 1, entries: [...] }` with a clear exit-2 error rather than guessing at an older/different format.

## Combining with `--json`

When `--baseline` or `--write-baseline` is used together with `--json`, the printed object gains a `baseline` key alongside the normal engine result (this is CLI-output-only — it is not part of the engine's own result contract described in `OUTPUT_SCHEMA.md`):

- `--write-baseline`: `{ mode: "write", path, entries: <number written> }`
- `--baseline`: `{ mode: "check", totalFail, knownCount, newCount, staleCount, newOccurrences: [...] }`

## Alternative: diff two scans yourself

If your pages don't fit this model (heavy dynamic content inside the flagged elements themselves), the always-available fallback is to diff two full `--json` outputs yourself — see [`INTEGRATION.md`](./INTEGRATION.md#ci-gating-a-build-on-the-result). That gives you full control over the identity/matching logic at the cost of writing it yourself.
