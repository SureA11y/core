---
name: New rule proposal
about: Propose a new accessibility check the engine doesn't currently cover
title: ""
labels: new-rule
---

**Before filing:** check `docs/LIMITATIONS.md`'s "Deliberately not attempted" section — some checks are intentionally excluded because no safe automated heuristic exists at this engine's confidence bar (`fail` must stay reserved for deterministic, high-confidence violations). If your proposal falls in that category, the useful discussion is whether the limitation still holds, not just "please add this."

## What should be checked

<!-- One normative decision, matching this engine's "every rule is atomic" principle (see CONTRIBUTING.md). If your idea bundles several distinct checks, consider whether it should be several rule proposals instead of one. -->

## WCAG Success Criterion (if applicable)

<!-- e.g. 1.1.1 Non-text Content, level A -->

## Proposed outcome logic

- **`fail` when:** <!-- the specific, objective, DOM-observable condition -->
- **`notApplicable` when:** <!-- e.g. no matching elements, hidden content, environment can't evaluate it -->
- **`cantTell` when (if ever):** <!-- only if some cases genuinely require human judgement -->

## Can this be decided objectively from the DOM/computed styles alone?

<!-- This engine's core constraint: no simulated interaction, no waiting for async state, no real layout outside a real browser (see docs/LIMITATIONS.md's "Structural" section). If the check needs any of that, say so — it may still be valuable as a `manual` rule capped at `cantTell`. -->

## Known false-positive risks

<!-- What legitimate markup pattern might this incorrectly flag? A rule proposal without at least one attempted answer here is hard to evaluate against this engine's "conservative by design" bar. -->

## Reference material

<!-- Link to the relevant WAI-ARIA / HTML-AAM spec section, an ACT rule, or how another engine handles this (see CONTRIBUTING.md's note on verifying against a primary source, not just "engine X has this rule"). -->
