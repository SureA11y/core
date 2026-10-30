# Test procedures

How a person assesses each criterion by hand, criterion by criterion: what a scan can't decide, and what no rule tests at all. Core keeps these procedures in one place and gives them to whatever needs them:

- an undecided finding's `howToCheck` ([`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#how-to-check)), as it always has;
- a checklist for a manual review, made from a run;
- the help a person needs to fill in a conformance report, criterion by criterion: what the scans covered, what is left, and how to check it;
- the explanation of a criterion whose rules found nothing but do not cover all of it.

Procedures are guidance, not part of a finding's identity: their wording may improve in any release, as a finding's steps may.

## What a procedure is

A criterion has **facets**, the test objectives a person checks to assess it ([`src/coverage/wcag-facets.js`](../src/coverage/wcag-facets.js)). A facet a rule decides is `full`, one rules decide part of is `partial`, and one only a person can judge is `manual`.

A facet has a **general procedure**: steps a person follows on a whole page, in a browser with its developer tools, a keyboard and, where it matters, a screen reader; then what they see if it passes and if it fails, naming the criterion it fails; and the **tools** it needs besides a browser:

| Tool | |
|---|---|
| `keyboard` | A keyboard |
| `pointer` | A mouse or other pointer |
| `screen-reader` | A screen reader |
| `zoom` | The browser's zoom |
| `contrast-theme` | A high-contrast theme (forced colors) |
| `devtools` | The browser's developer tools |

Where a rule asks a narrower question about one element, the facet has a **variant** for that rule and reason code: the steps its undecided finding shows as `howToCheck`. A variant always wins over its facet's general procedure: a finding shows its variant, never the general text, and writing a general procedure never changes what a finding shows. Every reason code a core rule can report as `cantTell` is under exactly one facet.

What no criterion requires is kept apart, under `best-practice`, so a criterion's procedures never present advice as a failure.

Core has general procedures for some criteria so far; [the rest](#which-criteria-have-procedures) follow. A facet without one has `procedure: null`.

## Reading them

| Where | How |
|---|---|
| Node | `proceduresFor(requirement, { locale })` from `@surea11y/core`, which reads the dictionaries from disk. |
| Code that runs in a browser | `proceduresFrom(dictionaries, requirement, { locale })` from `@surea11y/core/procedures`, with the dictionaries it imports as `@surea11y/core/procedures/<locale>` (`{ en, fr }`, or a function from a locale to its dictionary). It needs no file system and reaches none of the rules. |

`requirement` is a WCAG 2.2 criterion (`'1.4.13'`) or `'best-practice'`; a requirement core doesn't know gives `null`. `locale` is a tag (`'fr-CA'` reads `fr-ca`, then `fr`) or a list of tags, most wanted first; English is the fallback for every text a locale lacks, and says how many steps a procedure has. In a browser bundle, `proceduresFor` warns once and returns `null`.

```js
const { proceduresFor } = require('@surea11y/core');

proceduresFor('1.4.12', { locale: 'fr' });
```

```js
import { proceduresFrom } from '@surea11y/core/procedures';
import en from '@surea11y/core/procedures/en';
import fr from '@surea11y/core/procedures/fr';

proceduresFrom({ en, fr }, '1.4.12', { locale: 'fr' });
```

## The shape

```js
{
  standard: 'wcag',              // or 'best-practice'
  id: '1.4.12',                  // the criterion, or 'best-practice'
  title: 'Text Spacing',
  level: 'AA',                   // null for best practices
  complete: true,                // every facet has a general procedure
  rules: ['avoid-inline-spacing', 'text-spacing-content-loss'], // core rules that test it (wcagSc)
  facets: [
    {
      id: 'text-spacing-content-loss',
      label: 'With the 1.4.12 spacing applied, no text is cut off or made to overlap (measured in a browser)',
      automation: 'partial',     // 'full' | 'partial' | 'manual'
      rules: ['text-spacing-content-loss'], // core rules that claim the facet
      tools: [
        { id: 'devtools', label: "The browser's developer tools" },
        { id: 'keyboard', label: 'A keyboard' }
      ],
      procedure: { steps: ['…'], passWhen: '…', failWhen: '…' }, // or null
      variants: [
        { ruleId: 'text-spacing-content-loss', reasonCode: 'TEXT_OVERLAPS', steps: ['…'], passWhen: '…', failWhen: '…' }
      ]
    }
  ]
}
```

A facet broader than any one rule, kept for coverage reporting, has `macro: true`. A facet's `tools` is empty while it has no procedure. A variant's `steps`, `passWhen` and `failWhen` are exactly the `howToCheck` of that rule's finding for that code, in the same locale. Labels and titles are in English for now.

`@surea11y/core/procedures/<locale>` is plain JSON, key to text. Its keys are covered as `proceduresFrom` reads them; its wording is not.

## Which criteria have procedures

Every facet has a general procedure in: 1.4.12 Text Spacing, 1.4.13 Content on Hover or Focus, 2.4.3 Focus Order. Every other criterion has its facets and variants, without general procedures yet (`complete: false`).

## Where they live

| File | Holds |
|---|---|
| [`src/procedures/registry.js`](../src/procedures/registry.js) | By criterion and facet: the tools each general procedure needs, and the reason codes under it, by rule. |
| `src/i18n/procedures/<locale>.json` | The text: a general procedure under `wcag_<criterion>_<facet>_step<n>`, `_pass` and `_fail` (`best-practice_<facet>_…`), a variant under its rule's `<prefix>_review_<CODE>_…`, a tool under `tool_<id>`. |
| `src/i18n/review/<locale>.json` | Generated: the variants alone, the review dictionaries `howToCheck` reads (`@surea11y/core/review/<locale>`). |
| `src/procedures/rules.json` | Generated: each core rule's prefix, criteria and facets, so the browser form needs no rule. |

`npm run procedures` writes the generated files and `npm run procedures:check` fails on a stale one; `npm test` checks them too. Writing a rule's steps is [`RULE_AUTHORING.md`](./RULE_AUTHORING.md) §8.6; translating them, [`I18N.md`](./I18N.md#the-review-dictionaries).

## Writing a general procedure

As a variant is written (§8.6), in short imperative steps a person can follow in a browser, with what they see if it passes and if it fails, naming the criterion it fails. A general procedure is for the page ("Move the pointer over the page and note each element that shows extra content…"); a variant is for the element a finding names ("Find the text the report names…"). They must not contradict each other: where a variant is good, the general procedure starts from it. Refer to the criterion's Understanding document where it helps; don't copy it.
