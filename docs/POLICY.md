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
    allowedConfidence: ['high', 'medium'],   // drop 'low' — anything low-confidence becomes cantTell
    coerceManualFailToCantTell: true
  }
}, null);
```

Any field you omit from an inline contract object falls back to the `a11y` contract's value for that field — you're overriding, not replacing wholesale.

## Fine-grained overrides

`engineOptions.policy` overrides individual fields on top of whichever contract you selected, without defining a whole new contract:

```js
runDomRulesInPage(url, null, {
  policyContract: 'a11y',
  policy: { coerceManualFailToCantTell: false }   // keep everything else about 'a11y', just flip this one flag
}, null);
```

## What happens when a value isn't allowed

- **`outcome` not in `allowedOutcomes`**: silently coerced to `cantTell`. (In practice this only matters for custom contracts that narrow the outcome list — the two built-in contracts allow all four values.)
- **`confidence` not in `allowedConfidence`**: silently replaced with the rule's own `defaultConfidence`.

Neither of these ever throws — policy resolution is designed to always produce a valid result, per the engine's "safe-by-default" principle.

## Why this exists as a separate layer

Keeping outcome-integrity rules (like "manual rules can't fail") in a policy layer — rather than hard-coded into every rule, or worse, left to each rule author's discretion — means the guarantee holds even if a rule's own logic has a bug, and means different consumers can have different appetites for risk (a CI gate vs. an internal audit dashboard) without forking the rule set itself. This protects the engine's core guarantee: `fail` must always mean "deterministic, high-confidence, normative violation," full stop.
