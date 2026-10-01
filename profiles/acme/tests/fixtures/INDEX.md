# Fixture Index

This profile's rules and their scenario pages. Every rule should have a `tests/fixtures/<slug>-all-scenarios.html` scenario page (numbered `case_NN` blocks, each marked PASS/FAIL/CANTTELL in its `.case-title`) and a "fixture coverage" test in its `tests/rules/**/<rule>.test.js` asserting the exact expected ids. Paths are relative to the profile's folder. Core's rules have their own index, in core's `tests/fixtures/INDEX.md`.

## Summary

Total rules: **2**. With fixture: **2**. Without fixture: **0**.

## Rules WITHOUT a fixture (0)

None — every rule has a fixture.

## Rules WITH a fixture (2)

| Rule ID | Type | Fixture | Cases | PASS | FAIL | CANTTELL | OTHER |
|---|---|---|---:|---:|---:|---:|---:|
| acme-contrast-uniform | automatic | `tests/fixtures/acme-contrast-uniform-all-scenarios.html` | 3 | 1 | 2 | 0 | 0 |
| acme-statement-link | automatic | `tests/fixtures/acme-statement-link-all-scenarios.html` | 1 | 0 | 1 | 0 | 0 |

