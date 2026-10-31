# Test procedures

How a person assesses each criterion by hand, criterion by criterion: what a scan can't decide, and what no rule tests at all. Core keeps these procedures in one place and gives them to whatever needs them:

- an undecided finding's `howToCheck` ([`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#how-to-check)), as it always has;
- a manual assessment with no scan at all: every criterion's procedures, the whole standard at once ([below](#listing-them)), or a checklist of what to do ([below](#a-checklist));
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

Some facets are one test a rule makes on one kind of element (`img-alt-attr-present`: an `<img>` has an alt attribute). Such a **technology facet** has no procedure of its own: `coveredBy` names the broader facet of the same criterion whose procedure a person follows to assess it (`text-alternative-mechanism`). A checklist lists what a person does, once: the facets without `coveredBy`.

Where a rule asks a narrower question about one element, the facet has a **variant** for that rule and reason code: the steps its undecided finding shows as `howToCheck`. A variant always wins over its facet's general procedure: a finding shows its variant, never the general text, and writing a general procedure never changes what a finding shows. Every reason code a core rule can report as `cantTell` is under exactly one facet.

What no criterion requires is kept apart, under `best-practice`, so a criterion's procedures never present advice as a failure.

A criterion whose every facet has a procedure, its own or its `coveredBy` facet's, is `complete`: every WCAG 2.2 criterion is ([below](#which-criteria-have-procedures)).

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

### A pack's standard

A pack's standard can say how a person assesses its requirements ([`PACKS.md`](./PACKS.md#how-a-person-assesses-it-procedures), `standard.procedures`). With the packs, `proceduresFor` and `proceduresFrom` read them:

```js
proceduresFor('9.1.4.3', { packs: [en301549], standard: 'en301549', version: 'V4.1.1', locale: 'fr' });
```

`standard` is the pack's standard by key or name (`'en301549'` or `'EN 301 549'`); without it, a WCAG criterion of that number wins, then the first pack that has the requirement. `version` defaults to the latest that has it. A requirement that restates a WCAG criterion gives that criterion's facets, with `wcag` naming it; one of the pack's own gives its facets, in English.

A requirement that restates a criterion may replace the general procedure of some of its facets with the pack's own, in English (`replace`, [`PACKS.md`](./PACKS.md#how-a-person-assesses-it-procedures)). Read as the requirement, such a facet has the pack's `procedure` and `tools`, and `procedureFrom` names the pack; its `rules` and `variants` are core's and the packs', as they are by criterion. Read as the WCAG criterion, it is core's: a pack never changes what `proceduresFor('1.4.3')` gives.

Read as a pack's requirement, the procedures carry the pack's identity: `standard` is the pack's standard's name, `id` the requirement as the standard numbers it, and `version` the standard's version; `wcag` names the criterion it restates, as a cross-reference. A general procedure says what fails as the requirement it is read as: "which fails WCAG 1.4.3" read as the criterion, "which fails EN 301 549 9.1.4.3" read as the clause that restates it. A variant, the steps of one rule's finding, keeps naming WCAG, as the finding does.

### A pack's rules

With the packs, a criterion's facets also list the packs' own rules and variants ([`PACKS.md`](./PACKS.md#3-write-its-rules)), after core's:

- a rule that claims a facet, in `meta.coverage.facetsBySc` (`{ '2.4.4': ['link-text-descriptive-evidence'] }`), is in that facet's `rules`, and one whose `meta.wcagSc` names the criterion in the criterion's `rules`;
- the reason codes of its `meta.review` filed under the facet are variants there, with its `ruleId`, each exactly the `howToCheck` of its finding for that code. A rule that claims one facet files every code under it. One that claims several says where each code goes, with `facet` in the code's entry, and `criterion` where it claims that facet under more than one criterion; a code it doesn't file is under none.

A requirement of the pack's own standard lists, in the same way, the pack's rules that claim its facets in `meta.coverage.facetsByRequirement` (`{ '7.1': ['text-version'] }`), and the requirement's `rules` lists them all. A variant of a core rule (`from`) adds only the codes it writes steps for: the others show its base rule's, already listed under the base. An override is the core rule it replaces, listed as core has it.

A pack rule's steps are in English, or in a locale its pack's dictionary translates them to ([`PACKS.md`](./PACKS.md#6-messages-and-languages)), as its findings show them.

## Listing them

`proceduresFor` reads one requirement. `listProcedures` reads every requirement of a standard, in the standard's order, with the groups it puts them in:

```js
const { listProcedures } = require('@surea11y/core');

listProcedures();                                         // WCAG 2.2, every level
listProcedures({ version: '2.1', levels: ['A', 'AA'] });  // WCAG 2.1 A and AA
listProcedures({ standard: 'best-practice' });
listProcedures({ packs: [rgaa], standard: 'rgaa', locale: 'fr' }); // a pack's standard
```

| Option | |
|---|---|
| `standard` | `'wcag'` (the default), `'best-practice'`, or a pack's standard by key or name. |
| `version` | WCAG's (`'2.0'`, `'2.1'`, `'2.2'`, the default), or the pack's standard's (the latest that gives procedures, by default). |
| `levels` | WCAG only: `'A'`, `'AA'`, `'AAA'` or a list of them; every level by default. An unknown level throws. |
| `locale`, `packs` | As for `proceduresFor`. |
| `tools`, `automation`, `rules` | Filters ([below](#filters)). |

It gives `null` for a standard or version it doesn't know, and otherwise:

```js
{
  standard: 'wcag',          // or 'best-practice', or a pack's standard's name ('EN 301 549')
  // key: 'en301549',        a pack's standard's key
  version: '2.2',            // null for the best practices
  requirements: [ /* each as proceduresFor gives it */ ],
  groups: [
    {
      id: '1', title: 'Perceivable', requirements: [],
      groups: [{ id: '1.1', title: 'Text Alternatives', requirements: ['1.1.1'], groups: [] }]
    }
  ]
}
```

WCAG's criteria are those the version has, at its levels: 2.0 and 2.1 list 4.1.1 as a Level A criterion titled "Parsing", 2.2 doesn't list it. Each requirement is what `proceduresFor` gives for it, with the title and level of the version listed. A pack's requirements are those its standard's `procedures` give for the version, in number order (`1.9` before `1.10`).

### Groups

WCAG's criteria are grouped under their principles and guidelines, as WCAG numbers them; a group of a pack's standard is one its `standard.groups` gives for the version, such as a theme or a chapter ([`PACKS.md`](./PACKS.md#how-a-person-assesses-it-procedures)). Each group has the ids of its own requirements, in the standard's order, and the groups under it. A group with no requirement listed, and none under it with any, is left out. A pack's requirement that no group names is still in `requirements`.

### Filters

`tools`, `automation` and `rules` each take one value or a list of them, and keep only the facets that match, and the requirements left with any:

| Filter | Keeps a facet |
|---|---|
| `tools: 'screen-reader'` | whose procedure needs one of these tools; a technology facet by the tools of the facet it is covered by |
| `automation: ['manual', 'partial']` | with one of these automation levels: what is left for a person after a scan |
| `rules: 'img-alt-present'` | that one of these rules claims |

Given several filters, a facet must match each. A technology facet that matches keeps the facet it is covered by, whose procedure assesses it. A requirement's `complete` stays its own: whether every facet has a procedure, not only those listed.

## A checklist

`procedureChecklist` takes `listProcedures`' options and gives what a person does to assess the standard, once each: an item per general procedure, with no technology facet of its own, as these are assessed by the procedure of the facet they are covered by.

```js
const { procedureChecklist } = require('@surea11y/core');

procedureChecklist({ levels: ['A', 'AA'] }).items[0];
// {
//   key: '1.1.1/text-alternative-mechanism',
//   facet: 'text-alternative-mechanism',
//   label: 'Text alternative mechanism present',
//   automation: 'partial',
//   wcag: '1.1.1',
//   requirements: ['1.1.1'],
//   covers: ['img-alt-attr-present', 'role-img-text-alternative-present', …],
//   rules: ['img-alt-present', …],
//   tools: [{ id: 'devtools', label: "The browser's developer tools" }],
//   procedure: { steps: ['…'], passWhen: '…', failWhen: '… which fails WCAG 1.1.1.' }
// }
```

`covers` lists the technology facets the item assesses, and `rules` the rules that claim it or one of them. Core's procedure for a WCAG facet is one item however many of a pack's requirements restate that criterion: `requirements` lists them all, and its text names each ("which fails EN 301 549 9.1.4.3, 9.1.4.4"). A pack's own facet, or a facet whose procedure a requirement replaces, is an item of that requirement, keyed by it (`'7.1/text-version'`), with `procedureFrom` where it replaces core's. `groups` is the list's, so the items can be shown under them through their `requirements`.

## Related requirements

`relatedRequirements` goes between WCAG and the packs' standards:

```js
const { relatedRequirements } = require('@surea11y/core');

relatedRequirements('1.4.3', { packs: [en301549] });
// [{ standard: 'EN 301 549', key: 'en301549', id: '9.1.4.3', version: 'V4.1.1', title: '…', relation: 'restates' }]

relatedRequirements('9.1.4.3', { packs: [en301549], standard: 'en301549' });
// [{ standard: 'wcag', id: '1.4.3', title: 'Contrast (Minimum)', level: 'AA', relation: 'restates' }]
```

For a WCAG criterion, it gives each requirement of a pack's standard that restates it (`relation: 'restates'`, its `wcag`) or relates to it without restating it (`'relatesTo'`, its `relatesTo`), in the latest version of each standard that gives procedures. For a pack's requirement, with `standard` (and `version`, the latest that has it by default), it gives the WCAG criteria it restates or relates to. It is `[]` where there are none, and for a pack that gives no procedures.

### In a browser

`@surea11y/core/procedures` has the same, with the dictionaries passed in, as `proceduresFrom` takes them: `listProceduresFrom(dictionaries, options)`, `procedureChecklistFrom(dictionaries, options)`, and `relatedRequirements(requirement, options)`, which reads no dictionary.

### A pack with no procedures

A pack whose standard gives no `procedures` (one made for a core older than the procedures) changes nothing: `listProcedures` and `procedureChecklist` give `null` for its standard, `relatedRequirements` gives `[]`, and WCAG's procedures are the same with it as without it.

## The shape

```js
{
  standard: 'wcag',              // or 'best-practice', or a pack's standard ('EN 301 549')
  id: '1.4.12',                  // the criterion, 'best-practice', or a pack's requirement
  // version: 'V4.1.1', wcag: '1.4.3' on a pack's requirement that restates a criterion,
  // relatesTo: ['1.3.1'] on one of its own that relates to some
  title: 'Text Spacing',
  level: 'AA',                   // null for best practices
  complete: true,                // every facet has a general procedure
  rules: ['avoid-inline-spacing', 'text-spacing-content-loss'], // the rules that test it (wcagSc)
  facets: [
    {
      id: 'text-spacing-content-loss',
      label: 'With the 1.4.12 spacing applied, no text is cut off or made to overlap (measured in a browser)',
      automation: 'partial',     // 'full' | 'partial' | 'manual'
      rules: ['text-spacing-content-loss'], // the rules that claim the facet, core's then the packs'
      tools: [
        { id: 'devtools', label: "The browser's developer tools" },
        { id: 'keyboard', label: 'A keyboard' }
      ],
      procedure: { steps: ['…'], passWhen: '…', failWhen: '…' }, // or null
      // procedureFrom: '@acme/pack-city', where a pack's requirement replaces it
      // coveredBy: 'text-alternative-mechanism', on a technology facet
      variants: [
        { ruleId: 'text-spacing-content-loss', reasonCode: 'TEXT_OVERLAPS', steps: ['…'], passWhen: '…', failWhen: '…' }
      ]
    }
  ]
}
```

A facet broader than any one rule has `macro: true`. A facet with `coveredBy` has `procedure: null` and no `tools`: read them from the facet it names. A facet's `tools` is also empty while core has no procedure for it. A variant's `steps`, `passWhen` and `failWhen` are exactly the `howToCheck` of that rule's finding for that code, in the same locale. Labels and titles are in English for now.

`@surea11y/core/procedures/<locale>` is plain JSON, key to text. Its keys are covered as `proceduresFrom` reads them; its wording is not.

## Which criteria have procedures

Every WCAG 2.2 criterion, at levels A, AA and AAA, and 4.1.1 (removed in 2.2), has a procedure for every facet: 87 criteria, 226 facets, 110 procedures of their own and 116 technology facets covered by one of them. `complete` says so for each; a test keeps it so. EN 301 549's clauses come from its pack, `@surea11y/pack-en301549`, each taking the procedures of the criterion it restates.

## Where they live

| File | Holds |
|---|---|
| [`src/procedures/registry.js`](../src/procedures/registry.js) | By criterion and facet: the tools each general procedure needs, and the reason codes under it, by rule. |
| `src/i18n/procedures/<locale>.json` | The text: a general procedure under `wcag_<criterion>_<facet>_step<n>`, `_pass` and `_fail` (`best-practice_<facet>_…`), a variant under its rule's `<prefix>_review_<CODE>_…`, a tool under `tool_<id>`. |
| `src/i18n/review/<locale>.json` | Generated: the variants alone, the review dictionaries `howToCheck` reads (`@surea11y/core/review/<locale>`). |
| `src/procedures/rules.json` | Generated: each core rule's prefix, criteria and facets, so the browser form needs no rule. |

`npm run procedures` writes the generated files and `npm run procedures:check` fails on a stale one; `npm test` checks them too. Writing a rule's steps is [`RULE_AUTHORING.md`](./RULE_AUTHORING.md) §8.6; translating them, [`I18N.md`](./I18N.md#the-review-dictionaries).

## Writing a general procedure

As a variant is written (§8.6), in short imperative steps a person can follow in a browser, with what they see if it passes and if it fails, naming the criterion it fails as `{{requirement}}` ("…, which fails {{requirement}}."). It is filled in as the procedure is read: `WCAG 1.4.3` read as the criterion, the standard's name and the requirement (`EN 301 549 9.1.4.3`) read as a pack's requirement that restates it. A test holds every WCAG procedure's `failWhen` to it; another criterion it refers to is named as itself ("as for 1.4.3"). A general procedure is for the page ("Move the pointer over the page and note each element that shows extra content…"); a variant is for the element a finding names ("Find the text the report names…"). They must not contradict each other: where a variant is good, the general procedure starts from it. Refer to the criterion's Understanding document where it helps; don't copy it.
