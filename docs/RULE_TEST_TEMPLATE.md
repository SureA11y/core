# RULE_TEST_TEMPLATE.md — Rule test template

The test template to copy is [`RULE_TEMPLATE.test.js`](./RULE_TEMPLATE.test.js), the test of a
rule made from [`RULE_TEMPLATE.js`](./RULE_TEMPLATE.js). Copy it to
`tests/engine-checks/automatic/<rule-id>.test.js` (manual rules: `tests/engine-checks/manual/`)
and replace every `<placeholder>`. It has a case for each outcome: `notApplicable`, `pass`,
`fail` and, for a rule that can report it, `cantTell`. A manual rule drops the `fail` case.

Then add what the template leaves to you:

- the fixture-coverage test of [`RULE_AUTHORING.md`](./RULE_AUTHORING.md) §11.3;
- for each lean, a case that leans, with its `toward` and `whyKey`, and for a conditional lean
  a case of the same code with none (§8.5).

A pack's test imports the same helpers from `@surea11y/core/testing` and passes its pack in
`engineOptions.packs`; see [`RULE_TEST_AUTHORING.md`](./RULE_TEST_AUTHORING.md).
