# RULE_TEMPLATE.md — Rule templates

The template to copy is [`RULE_TEMPLATE.js`](./RULE_TEMPLATE.js): a complete rule module with
the structured header, its `@reason-codes`, the meta keys every rule needs plus `review`, and a
`runInPage` that reads the DOM through `ctx.helpers.dom`, reports through
`helpers.reportOccurrence` and decides with `helpers.resolveTieredOutcome`. Its test is
[`RULE_TEMPLATE.test.js`](./RULE_TEMPLATE.test.js) ([`RULE_TEST_TEMPLATE.md`](./RULE_TEST_TEMPLATE.md)).
[`RULE_AUTHORING.md`](./RULE_AUTHORING.md) explains each part, and the optional meta keys the
template leaves out (`margin`, `reasonCodes`, `deprecated`).

---

## Steps

1. Copy `RULE_TEMPLATE.js` to `src/checks/automatic/<rule-id>.js`, or
   `src/checks/manual/<rule-id>.js` for a manual rule. A pack's rule goes in the pack's own
   rules folder ([`PACKS.md`](./PACKS.md)). The id is bare kebab-case (`RULE_AUTHORING.md` §3).
2. Replace every `<placeholder>`: the header tags, `meta`, the selector and the check itself.
   `meta.wcagSc`, `meta.normativeMappings`, the `wcag…` tags and `meta.coverage.facetsBySc`
   name the same criteria; facet ids come from `src/coverage/wcag-facets.js`, never a `macro`
   one, which is for coverage only.
3. List each reason code under `@reason-codes`, with its outcome, meaning and basis
   (`RULE_AUTHORING.md` §10.1), and give each `cantTell` code its steps in `src/procedures` (§8.6).
4. Add each message key and its English text to `src/i18n/en.json`, then run
   `npm run i18n:sync`. `meta.title` and `meta.description` must match the dictionary text.
   The steps' keys go in `src/i18n/procedures/en.json` and in each other locale there, by
   hand (`i18n:sync` doesn't cover that folder), each code under its facet in
   `src/procedures/registry.js`; then run `npm run procedures`.
5. Write the test and the scenario page (`RULE_AUTHORING.md` §11).
6. Run `npx eslint <file>`, then `npm run build` and `node scripts/validate-rule.js <file>`.
   The validator runs the rule through the built engine, so it needs the build.
7. Regenerate what describes the rule: `npm run finding-ids`, `npm run fixtures:index`,
   `npm run fixtures:markers` and `npm run docs:rule-catalog`, and add its section to
   [`RULE_EXAMPLES.md`](./RULE_EXAMPLES.md).

## The core of `runInPage`

```js
function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;
  const occurrences = []; // fail tier
  const questions = []; // cantTell tier
  let applicableCount = 0;

  for (const el of helpers.queryAllSmart('<css-selector>')) {
    if (!helpers.isIncludedInAccessibilityTree(el, ctx)) continue;
    applicableCount += 1;
    const tag = String(dom.localName(el) || '').toLowerCase();
    // ...decide; on a failure:
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: '<What is wrong>',
        hint: '<How to fix it>',
        i18n: {
          summaryKey: '<ruleName>_summary_fail',
          hintKey: '<ruleName>_hint_fail',
          params: { element: tag }
        },
        data: {
          details: { reasonCode: '<REASON_CODE>' },
          visibilityFilter: helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(occurrences, questions, rule.defaultSeverity || 'minor')
  };
}
```

`reportOccurrence` fills in `selector`, `html` and `structuralPath` from the element
(`RULE_AUTHORING.md` §4.3); don't build them by hand. `resolveTieredOutcome` returns `fail`
with both tiers when anything failed, `cantTell` when there are only questions and `pass`
otherwise, so a question is never dropped because something else failed
(`RULE_HELPERS.md` §6).

## Manual rules

A manual rule is the same module, except:

- `meta.type: 'manual'` and the `manual` tag in place of `automatic`.
- Outcomes: `cantTell` when something needs a person to judge, `notApplicable` when nothing
  applies, and `pass` when it applied and nothing found needs judgment (`RULE_AUTHORING.md`
  §8.3, `RULE_TAXONOMY.md` §1.1). Never `fail`: the engine turns a manual rule's `fail` into
  `cantTell` and notes it in `error`.
- Every finding goes in `questions`, so `occurrences` stays empty, and a question carries no
  `uncertainty`: `judgement-required` is what a manual rule means already
  ([`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#uncertainty-codes)).
