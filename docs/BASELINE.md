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

where `reasonCode` is the rule-specific code from `occurrence.data.details.reasonCode` (defaulting to `"DEFAULT"` when a rule doesn't set one), and `html` is the occurrence's outer-HTML snippet. This is content-based rather than position-based: it survives the flagged element moving around the page (a reorder, an unrelated sibling added/removed) as long as the flagged element's own markup doesn't change. `selector` is still recorded in the baseline file, but purely for human context when reading a diff — it is never used for matching.

**Known limitation**: an element whose *own* markup includes dynamic content (a timestamp, a live counter, a randomly-generated id) will never match itself across two scans, since its `html` snippet differs every time. If your pages hit this case, the baseline mechanism won't help for those specific rules/elements — see "Alternative" below.

Matching counts occurrences, not just presence: if a page has 3 elements that produce byte-identical `ruleId`+`reasonCode`+`html` (e.g. the same broken component repeated 3 times) and the baseline recorded only 1 of them, a fresh scan reports 1 known and 2 new — not all 3 as known.

Baseline entries that don't match anything in a fresh scan are reported as **stale** (the violation was presumably fixed) — this is informational only and never gates the build; regenerate the baseline with `--write-baseline` periodically to clean these up.

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

`--baseline <path>` rejects a file that isn't `{ version: 1, entries: [...] }` with a clear exit-2 error rather than guessing at an older/different format.

## Combining with `--json`

When `--baseline` or `--write-baseline` is used together with `--json`, the printed object gains a `baseline` key alongside the normal engine result (this is CLI-output-only — it is not part of the engine's own result contract described in `OUTPUT_SCHEMA.md`):

- `--write-baseline`: `{ mode: "write", path, entries: <number written> }`
- `--baseline`: `{ mode: "check", totalFail, knownCount, newCount, staleCount, newOccurrences: [...] }`

## Alternative: diff two scans yourself

If your pages don't fit this model (heavy dynamic content inside the flagged elements themselves), the always-available fallback is to diff two full `--json` outputs yourself — see [`INTEGRATION.md`](./INTEGRATION.md#ci-gating-a-build-on-the-result). That gives you full control over the identity/matching logic at the cost of writing it yourself.
