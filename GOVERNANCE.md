# Governance

## The license commitment

`@surea11y/core` is, and will remain, licensed under [MPL-2.0](./LICENSE). This is permanent and applies to every future release of the engine in this repository.

Contributions are accepted under the DCO rather than a CLA (see [`CONTRIBUTING.md`](./CONTRIBUTING.md)), so no single party — the maintainer included — holds the rights that relicensing the existing code would require.

## Decision-making

Decisions currently rest with the maintainer, Jorge Rumoroso: what gets merged, what a rule does, and what ships in a release.

Contributors who sustain meaningful correctness and review work may be invited to join as maintainers. If that happens, this document will be updated to describe how decisions are made between them, rather than being written speculatively now.

## What guides those decisions

The engine's non-negotiables come first, and a change that weakens one is refused regardless of how useful it otherwise is: `fail` is reserved for deterministic, high-confidence, normative violations; output is deterministic; every rule makes one normative decision. Where the engine cannot determine something, it says so rather than guessing — that is the property the project exists to protect.

## Changes to this document

The license commitment above is not open to revision. Everything else can change as the project does, and this file's history is the record of that.
