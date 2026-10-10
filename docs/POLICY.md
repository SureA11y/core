# Policy & contracts guide

A policy controls two things, independent of any individual rule's logic: **which outcome/confidence values are allowed to reach the result at all**, and **whether a `manual` rule's would-be `fail` gets coerced to `cantTell`**. It never changes what a rule decides — only how that decision is allowed to be represented.

## The two built-in contracts

```js
{
  a11y: {
    id: 'a11y',
    allowedOutcomes: ['fail', 'pass', 'cantTell', 'notApplicable'],
    allowedConfidence: ['high', 'medium', 'low'],
    coerceManualFailToCantTell: true   // ← the only difference
  },
  generic: {
    id: 'generic',
    allowedOutcomes: ['fail', 'pass', 'cantTell', 'notApplicable'],
    allowedConfidence: ['high', 'medium', 'low'],
    coerceManualFailToCantTell: false
  }
}
```

(Source of truth: `src/policy/contracts.js`.)

- **`a11y`** (the default): enforces the engine's core non-negotiable — a `type: 'manual'` rule (advisory/judgment-required, see [`RULE_CATALOG.md`](./RULE_CATALOG.md)) can never produce a `fail`. If a manual rule's own logic decides `fail`, the policy coerces it to `cantTell` and appends a note to the result's `error` field. Use this contract for anything where a `fail` result carries weight — CI gating, compliance reporting, anywhere someone might treat `fail` as "definitely broken."
- **`generic`**: identical outcome/confidence vocabulary, but does **not** coerce manual `fail`s. Only meaningful if you've deliberately reconfigured a manual rule to be more assertive than its default and want that respected — not a general-purpose "looser" mode.

## Selecting a contract

```js
runDomRulesInPage(url, null, { policyContract: 'a11y' }, null);   // default if omitted
runDomRulesInPage(url, null, { policyContract: 'generic' }, null);
```

Or supply an inline contract object instead of a name:

```js
runDomRulesInPage(url, null, {
  policyContract: {
    id: 'my-custom-policy',
    allowedOutcomes: ['fail', 'pass', 'cantTell', 'notApplicable'],
    allowedConfidence: ['high', 'medium'],   // a confidence outside this list falls back to the rule's default
    coerceManualFailToCantTell: true
  }
}, null);
```

Any field you omit from an inline contract object falls back to the `a11y` contract's value for that field — you're overriding, not replacing wholesale.

`allowedConfidence` filters the confidence a rule reports, not the outcome. A result whose confidence is not in the list gets the rule's default confidence instead (`defaultConfidence` in the rule catalog), which is not checked against the list again, so a rule whose default is `low` still reports `low`. The outcome is left as it is: dropping `'low'` does not turn low-confidence results into `cantTell`. `allowedOutcomes` is what changes an outcome: one outside the list becomes `cantTell`.

## Fine-grained overrides

`engineOptions.policy` overrides individual fields on top of whichever contract you selected, without defining a whole new contract:

```js
runDomRulesInPage(url, null, {
  policyContract: 'a11y',
  policy: { coerceManualFailToCantTell: false }   // keep everything else about 'a11y', just flip this one flag
}, null);
```

## What happens when a value isn't allowed

- **`outcome` not in `allowedOutcomes`**: reported as `cantTell`, with the outcome the rule found in `policyOutcome` (`"pass"`, say). The rule completed, so the result has no `error`, and the reporters show it as a result to review, not as a rule that did not complete. (In practice this only matters for custom contracts that narrow the outcome list — the two built-in contracts allow all four values.) A rule that returns something that is no outcome (`'passed'`) is `cantTell` with an `error` saying so.
- **`confidence` not in `allowedConfidence`**: replaced with the rule's own `defaultConfidence`.
- **A value the lists don't know** (`allowedOutcomes: ['passed']`): left out with a warning, and a list left with none (or given empty) is no list, so the contract's applies. Under `strictOptions` it throws `INVALID_ENGINE_OPTIONS`.

None of these throws unless `strictOptions` is on: policy resolution always produces a valid result, per the engine's "safe-by-default" principle.

## Why this exists as a separate layer

Keeping outcome-integrity rules (like "manual rules can't fail") in a policy layer — rather than hard-coded into every rule, or worse, left to each rule author's discretion — means the guarantee holds even if a rule's own logic has a bug, and means different consumers can have different appetites for risk (a CI gate vs. an internal audit dashboard) without forking the rule set itself. This protects the engine's core guarantee: `fail` must always mean "deterministic, normative violation," full stop — see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#severity-and-confidence-values) for why that is not the same as "high-confidence."
