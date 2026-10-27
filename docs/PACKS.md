# Packs: your own rules, profiles and standards

A **pack** brings rules, profiles and a standard to `@surea11y/core` from a package of its own, without a fork or a build of core. A scan takes it in `engineOptions.packs`, and it runs as core's own rules and standards do: in Node and in a browser, from the CLI and the bindings, with results the reporters (HTML, SARIF, JUnit, baselines) read as they read core's.

This guide goes from an empty folder to a published pack. [`ENGINE_OPTIONS.md`, "Packs"](./ENGINE_OPTIONS.md#packs--rules-and-standards-from-outside-core) is the reference for every field.

- [Which kind of pack](#which-kind-of-pack)
- [1. Create it](#1-create-it)
- [2. Name it](#2-name-it)
- [3. Write its rules](#3-write-its-rules)
- [4. Choose what runs: profiles](#4-choose-what-runs-profiles)
- [5. Group results: checklist items or requirements](#5-group-results-checklist-items-or-requirements)
- [6. Messages and languages](#6-messages-and-languages)
- [7. Test, lint and document it](#7-test-lint-and-document-it)
- [8. Use it](#8-use-it)
- [9. Publish it](#9-publish-it)

## Which kind of pack

| You have | Kind | What it holds |
|---|---|---|
| An organisation's accessibility policy: "WCAG 2.2 AA, plus these rules, minus that one, with these items in our report" | **checklist** | Profiles choosing core's rules and your own, and rollups as the checklist's items. |
| A standard with requirements of its own (a national standard, a sector's): numbered requirements, each checked by some rules | **standard** | A requirements table, the rules that check each requirement, a result per requirement, and profiles. |
| A few rules to add to every scan, with no profile | rules only | Rules (and variants or overrides of core's). Start from a checklist and delete its profiles and rollups. |

A pack's rules and profiles can use any of core's rules: a checklist or a standard is mostly core's rules, chosen and grouped, plus the few rules core doesn't have.

## 1. Create it

```sh
npx -p @surea11y/core surea11y-pack new acme-a11y --name @acme/a11y-pack
# or, for a standard:
npx -p @surea11y/core surea11y-pack new city-standard --name @city/a11y-standard --kind standard --title "City Standard"

cd acme-a11y
npm install
npx playwright install chromium   # once, for npm run docs
npm test && npm run lint && npm run docs
```

The pack works as generated: its tests pass, its rules lint clean, its examples agree with its rules. `new` checks the pack as a scan would before writing anything, and refuses a name, namespace or title that would make it invalid (a title of `WCAG` names its standard as one of core's), saying why. Change it step by step from there, running `npm test` as you go. What it holds:

| File | Both kinds |
|---|---|
| `index.js` | The pack, written with `definePack()` from `@surea11y/core/pack`. |
| `rules/automatic/<ns>-link-text-specific.js` | A rule that decides, using core's helpers. |
| `rules/automatic/<ns>-contrast-enhanced.js` | A variant of core's `contrast-minimum` at 7:1. |
| `rules/manual/<ns>-new-window-review.js` | A manual rule that asks a person. |
| `i18n/en.json` | The messages. |
| `tests/rules/*.test.js`, `tests/profiles.test.js` | A test per rule, and what each profile runs. |
| `docs/RULE_EXAMPLES.md` | Examples of each rule's outcomes. |
| `eslint.config.js` | Core's lint rules for rules. |
| `requirements.js`, `rule-map.js` | Standard only: the requirements and the rules that check each. |
| `package.json` | `private`, with `@surea11y/core` as a peer dependency at the version that wrote it (`^1.14.0`), and eslint, jsdom and Playwright as development dependencies. |
| `README.md`, `.gitignore` | The pack's own guide to these files, and what git leaves out. |

Its README walks through each file. The rest of this guide explains the choices behind them.

## 2. Name it

- **The package name** is an npm package name (lowercase, with a scope or without, no spaces), and **the version** a whole version (`1.0.0`, `1.0.0-rc.1`). A scan reports them in `engine.packs` (`@acme/a11y-pack@0.1.0`).
- **The namespace** (`namespace: 'acme'`) keeps the pack's ids apart from core's and other packs': every rule, rollup and profile id starts with it and `-`. It is also the tag of the pack's rules (see [opt-in](#the-namespace-tag-makes-the-packs-rules-opt-in)). It may be a word core's rules use as a tag (`forms`, `best-practice`): the tag still makes only the pack's own rules opt-in. It may not start core's rule ids (`img`, `aria`, `link`), since the pack's ids would then sit among core's, where core could add the same one; such a pack is invalid. Core doesn't start a new rule id with a namespace a published pack uses. Two packs in one scan can't share a namespace, or have one that starts the other's (`city` and `city-parks`): the first by name runs, and the other is skipped. `new` takes the package scope or first word; `--namespace` chooses another.
- **Ids** have core's shape: lowercase letters and digits in parts joined by `-` (`acme-link-text-specific`), dots allowed within a part (`acme-1.0`); a rollup id may keep the capitals of a requirement's number (`city-1.0-S1`). Rule, rollup and profile ids, and a standard's `key`, start with the namespace and `-` (the key may be the namespace itself), a standard's `ruleTag` is the namespace, and a rule's `meta.wcagSc` names WCAG criteria. A pack that breaks one of these is invalid.
- **`core`** is the range of core versions the pack works with (`'^1.11.0'`), read as npm reads the ranges in a `package.json` (`1.x`, `~1.11`, `>=1.11 <2`, `1.11.0 - 2.x`, `||`), so a prerelease core matches only a range that names a prerelease of that version. An empty range, or an empty alternative (`'^1.11.0 ||'`), which npm takes for any version, is no range here. `definePack` takes a pack whatever core is installed, so a host can still load it; a scan with a core outside the range skips the pack, with the reason in `skippedPacks`. A range that can't be read is a mistake in the pack, and `definePack` throws. `new` writes the version that generated the pack (`^1.14.0`); keep a range that starts at 1.14 if the pack uses what 1.14 added: `meta.review`, `reasonCodes` and `findings` rows, `meta.contributions`, `applicability`, `partial` or `keepsParsing`.
- **`description`** is a sentence on what the pack checks, for tools that let their users choose packs (`describePacks` returns it).
- **`title`** is what results and reports call a checklist (a standard has its own `standard` name). Reports tell standards apart by name, so it can't be one another standard of the scan has (`WCAG`, another pack's, such as `EN 301 549`): such a pack is invalid.

## 3. Write its rules

A rule is a module: `{ id, meta, runInPage }`, and `applicability` when it applies only sometimes. Core's rules are written the same way; [`RULE_AUTHORING.md`](./RULE_AUTHORING.md) describes every field.

```js
const id = 'acme-link-text-specific';
const meta = {
  title: 'Links say where they go',                 // English text
  description: 'Checks that no link is named only "click here"…',
  i18n: { titleKey: 'acmeLinkTextSpecific_title', descriptionKey: 'acmeLinkTextSpecific_description' },
  tags: ['acme', 'links', 'atomic', 'automatic'],    // the namespace tag first
  wcagSc: [],                                       // the WCAG criteria it checks, if any (see below)
  defaultSeverity: 'moderate',                      // minor, moderate, serious, critical
  type: 'automatic',                                // or 'manual'
  defaultConfidence: 'high'
};
function runInPage(ctx) { /* ... */ }
module.exports = { id, meta, runInPage };
```

A rule tagged with the namespace is the pack's own: it runs under the pack's profiles, or when named, and counts only in the pack's own rollups. Its `wcagSc` says which WCAG criteria it checks, for the reporters; no other standard claims it, not even one that maps every rule by its WCAG criteria.

**`runInPage(ctx)` runs in the page.** In a browser the engine writes the function into the page, so it uses only `ctx`, never a variable or module from outside it:

- `ctx.document`, `ctx.window`, and `ctx.rule` (its `ruleId` and `defaultSeverity`);
- `ctx.helpers`, core's helpers ([`RULE_HELPERS.md`](./RULE_HELPERS.md)): `queryAllSmart(selector)` finds elements in the scanned part of the page, shadow roots included; `isIncludedInAccessibilityTree(el, ctx)`, `getAccessibleNameInfo(el, ctx)` and `getContentNameInfo(el, ctx)` answer accessibility questions as core's rules do; `helpers.aria.getExplicitRole(el)` reads a role; `helpers.contrast` measures colors;
- `ctx.helpers.dom` reads DOM properties (`dom.getAttribute(el, 'target')`, `dom.parentNode(el)`) where a page's markup can't redirect them. `npm run lint` says where a rule reads the DOM directly.

**It only reads, by rule rather than by sandbox.** A pack's rules run after core's, and `ctx.helpers`, `ctx.engineOptions` and `ctx.inputs.probes` are read-only for them: setting or deleting anything on them throws, and the rule is reported as `cantTell` with that error, so one rule can't change what another sees. A rule must not change the page either: core can't undo a change, so a rule that makes one, in the document or inside an open shadow root, is named in a warning, and the rules after it and the page keep the change. Nothing stops a rule's code from doing more: load only packs you trust ([`SECURITY.md`](../SECURITY.md)). Whatever a rule throws or returns, the scan returns a result: a thrown value that can't be turned into text, or a result that can't be read (a getter or a Proxy that throws), makes that rule alone `cantTell` with an error saying so. Its result is made plain data, as probes are, so the scan's result can be written as JSON and cloned: a BigInt becomes its digits, an element its tag (`"<body>"`), a Map its entries, a Set its values, a Date what `toJSON` gives, a circular reference `"[circular]"`, and functions and Symbols are left out.

**What it reads from the host.** A rule may read evidence the host application passes in `engineOptions.probes`, such as the titles of the site's other pages, from `ctx.inputs.probes`. The pack's `probes` field documents each path its rules read, `{ 'crawl.pageTitles': { description, readBy: ['acme-title-unique'] } }`; `describePacks` and the pack's docs list them. See `probes` in [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md).

**It returns an outcome** with an occurrence per element:

| Outcome | When |
|---|---|
| `fail` | An automatic rule found a failure. |
| `pass` | It applied, and nothing failed (a manual rule: nothing needs a person). |
| `cantTell` | A person must judge: a manual rule's answer, or an automatic rule unsure. |
| `notApplicable` | Nothing on the page for it to check. |

```js
const occurrences = [];
occurrences.push(
  helpers.reportOccurrence(el, {
    summary: 'The link is named only "read more".',     // English text
    hint: 'Name the link by where it goes.',
    i18n: { summaryKey: 'acmeLinkTextSpecific_summary_fail', hintKey: '…', params: { name } },
    data: { details: { reasonCode: 'GENERIC_LINK_NAME', name } }
  })
);
return { outcome: occurrences.length ? 'fail' : 'pass', occurrences };
```

**How a person checks a `cantTell`.** A rule that can leave a finding undecided may say, per reason code, how a person answers it, as core's rules do (`howToCheck` in [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#how-to-check)): a few steps starting from the element the finding names, then what they see if it passes and if it fails.

```js
meta.review = {
  GENERIC_LINK_NAME: {
    steps: ['Find the link the report names.', 'Read the text around it.'],
    passWhen: 'The text around the link says where it goes.',
    failWhen: 'Nothing near the link says where it goes, which fails WCAG 2.4.4.'
  }
};
```

`definePack` checks its shape as core's rules are checked: an object of reason codes, each with 1 to 6 steps and a non-empty `passWhen` and `failWhen`, on a rule with a `meta.i18n.titleKey`. A rule that declares its reason codes in `meta.reasonCodes` (`['GENERIC_LINK_NAME']`) gives steps only for a code it declares there or names in its `runInPage`, so a mistyped code is refused; a rule that declares none is checked for shape alone, so a code a helper builds need not be written into `runInPage`. Declaring them is worth it for that check. The steps are English, whatever the scan's locale, and stay out of the page: `runDomRulesInPage` with `engineOptions.packs` adds them to the result, and for a result from a page `addHowToCheck(result, { packs })` does (or `applyHowToCheck(result, dictionaries, { packs })` from `@surea11y/core/how-to-check` in a browser bundle). A variant has its base rule's steps, translated where the base is core's, so it needs none; steps it gives for one of its base's codes replace the base's. An override, like a custom rule, has none.

`reportOccurrence` returns the occurrence; the rule lists it in `occurrences` itself. A `fail` that lists none is reported on the whole page, "failed for the page without naming an element". The engine fills in the element's selector, HTML and path. `reasonCode` is part of a finding's identity in baselines and SARIF: keep it stable once the pack is released.

**Three shortcuts to a rule:**

- **A variant** runs a core rule at other settings, with no code of its own: `{ id, from: 'contrast-minimum', config: { normalTextRatio: 7, largeTextRatio: 4.5 }, meta }`. [`RULE_SETTINGS.md`](./RULE_SETTINGS.md) lists every setting core's rules offer, with its default, the values it takes and what it changes; `getChecksCatalog()` gives the same as each rule's `variantSettings`. A core rule that can be varied declares its `settings` (see [`RULE_AUTHORING.md`, "Rule variants"](./RULE_AUTHORING.md#rule-variants)); a threshold takes a finite number above 0, a choice one of its listed values, and `definePack` refuses anything else. A fix to the core rule reaches the variant.
- **An override** replaces a core rule: list its id in `overrides` and give a rule with that id. It runs where the core rule ran, keeps its texts, mapping and tags unless it gives its own, and results list it in `overriddenBuiltinIds`.
- **A core rule as it is** needs nothing: name it in a profile or a rollup.

List every rule (and variant) in `rules` in `index.js`.

### The namespace tag makes the pack's rules opt-in

A rule tagged with the pack's namespace runs only when a scan asks for it: under one of the pack's profiles, by its id (`runOnly: ['acme-link-text-specific']`), or by the tag (`optInRules: ['acme']`). A scan that targets WCAG never reports a failure only your policy defines. A rule that should run in every scan with the pack leaves the namespace tag out. Only the pack's own rules are opt-in: a core rule that carries a tag of the same name runs as before, and an override, which takes a core rule's place, runs where that rule ran, whatever its tags. Asked for by tag in `runOnly` (`tags: ['forms']`), a name core also uses selects core's rules with that tag as well as the pack's.

## 4. Choose what runs: profiles

A profile is a named selection, run with `engineOptions.profile: 'acme-policy'`:

```js
profiles: {
  'acme-policy': {
    tags: wcagTags('2.2', ['A', 'AA']),               // core's WCAG 2.2 A and AA rules
    rules: ['region', 'heading-order'],               // and these, by id
    exclude: { rules: ['contrast-minimum'] },         // but not this one
    severity: { 'img-alt-present': 'critical' }       // and this one is critical here
  },
  'acme-quick': {
    tags: [],
    rules: ['img-alt-present', 'link-name-present', 'page-title-present']   // these, and the pack's own rules
  }
}
```

A rule runs under the profile when it carries one of its `tags` **or** its id is in `rules`, and is not in `exclude`. The pack's rules tagged with its namespace run under every profile of the pack (a checklist adds its namespace to the tags; a standard's profile lists it). A pack rule without the namespace tag runs in every scan, and under one of the pack's profiles only when the profile selects it like any other rule, by a tag it carries or by its id in `rules`: a profile with `tags: []` runs what it lists and the pack's namespace-tagged rules, and a checklist item grouping a rule it doesn't run comes back `cantTell`. Tag such a rule with the namespace, or list it in `rules`. In a profile, the namespace selects the pack's own rules and items only, not core rules that carry a tag of the same name. Every field:

| Field | What it does |
|---|---|
| `tags` | Rules carrying any of these tags. `wcagTags(version, levels)` from `@surea11y/core/pack` gives core's WCAG tags (`wcagTags('2.1')` is 2.0 and 2.1, A and AA). |
| `rules` | Rules by id, core's or the pack's: a best-practice rule no WCAG tag selects, or, with `tags: []`, the core rules the profile runs besides the pack's own. |
| `exclude` | `{ rules: [...] }` leaves rules out; `{ criteria: ['2.5.8'] }` waives WCAG criteria: their rollups go, and so does each rule whose every criterion is waived; a rule that also checks a criterion the profile keeps still runs. |
| `severity` | `{ ruleId: level }`: another severity under the profile. Results show it and keep the rule's own as `ruleSeverity`; baselines and finding ids don't change. |
| `wcagVersion` | `'2.0'`, `'2.1'` or `'2.2'`: the WCAG version the profile's scans are judged by (`engine.wcagVersion`). Without it, the WCAG tags in `tags` imply the version, and a profile with none is judged by 2.2. A scan's own `engineOptions.wcagVersion` still wins. |
| `keepsParsing` | `true` when the standard requires 4.1.1 Parsing as written, as EN 301 549 V3.2.1 does. A failure of it then stays a failure under a 2.0 or 2.1 target; under a profile without it, the 2023 errata to WCAG 2.0 and 2.1 count 4.1.1 as satisfied for HTML and XML, and `duplicate-id` asks instead (under 2.2, which removed 4.1.1, it asks whatever the profile says). Only the profile's own field counts: a pack's profile that takes the place of one of core's (a standard moving out of core, such as `en301549-v3.2.1`) doesn't inherit it, and core warns once when the profile it replaces kept 4.1.1 and the pack's doesn't say so. It is a profile's field only: `engineOptions.mappings` names a standard's requirements and never changes an outcome, so a scan judged by a standard that keeps 4.1.1 runs its profile. |
| `version`, `mappedRules` | A standard's profile only: the standard's version it targets, and `mappedRules: true` to run every rule the standard maps for that version. |

**A profile that runs only what its standard asks for.** A standard's profile with `tags: [<ns>]` and `mappedRules: true` runs the pack's own rules and the core rules its map links to a requirement, and nothing else: no rule checks what the standard doesn't, and results hold no WCAG criteria. With no WCAG tag, though, nothing says which WCAG version the standard is built on, and the run is judged by 2.2. For a standard built on 2.1 that is wrong: the run reports 2.2's criteria, such as 2.5.8, which the standard doesn't have. Give the version, and `keepsParsing: true` if the standard still requires 4.1.1 Parsing. The scaffold's `index.js` reads it from `requirements.js`, where each version of the standard names the WCAG version it is built on (`{ version: '1.0', wcagVersion: '2.2' }`, see [section 5](#5-group-results-checklist-items-or-requirements)):

```js
'city-1.0': {
  version: '1.0',
  tags: ['city'],                      // the pack's own rules
  mappedRules: true,                   // and the core rules its map links to a requirement
  wcagVersion: wcagVersionOf('1.0')    // judged by the WCAG version requirements.js gives for 1.0
}
```

Core's rules, with their ids, tags and what each checks, are in [`RULE_CATALOG.md`](./RULE_CATALOG.md). After `npm run docs`, the pack's own `docs/RULE_CATALOG.md` has a table of its profiles.

## 5. Group results: checklist items or requirements

**A checklist's items** are its `rollups`: each groups rules, core's or the pack's, into one result.

```js
rollups: [
  { id: 'acme-links', title: 'Links say where they go',
    checksIds: ['link-name-present', 'acme-link-text-specific', 'acme-new-window-review'] }
]
```

An item fails when one of its rules fails, asks (`cantTell`) when one asks, and passes when they pass. Under the checklist's profiles, results list the items in `rulesResults`; the HTML report shows them under the checklist's title, SARIF tags each rule with the items it belongs to (`acme-images`), JUnit lists them as properties of each rule's criterion (`<property name="acme" value="acme-images"/>`), and `result.standards` names the checklist. Each rule's `meta.normativeMappings` has an entry for each item, under the checklist's name.

**A standard's requirements** come from two tables (generated in `requirements.js` and `rule-map.js`):

```js
// requirements.js: per version, each requirement's number, wording and WCAG criteria
const VERSIONS = [{ version: '1.0', wcagVersion: '2.2' }];
const REQUIREMENTS = { '1.0': { 1: { title: 'Images have a text alternative', wcagSc: ['1.1.1'] }, /* ... */ } };

// rule-map.js: which requirements each rule checks, and why
const RULE_REQUIREMENTS = { '1.0': {
  'img-alt-present': { requirements: ['1'], note: 'An image with no alternative fails 1.' },
  'city-link-text-specific': { requirements: ['2'], note: 'A link named "read more" fails 2.' }
} };
```

`ruleMappedStandard({ standard, tag, versions, requirements, ruleMap })` from `@surea11y/core/pack` turns them into the standard's functions: a rollup per requirement (`<ns>-<version>-<requirement>`), the requirements each rule's result names (in `meta.normativeMappings`, under the standard's profiles or with `engineOptions.mappings: ['<key>']`), and checks of both tables when the pack is prepared. The standard's entry (`standard: { key, standard, versions, profiles, ruleTag, ruleMapped, mappingsFor, composites, validate, report }`) is generated in `index.js`; `report.noteKey` names the message above its results in the HTML report. A standard whose requirements relate to WCAG in a way the two tables can't say writes those functions itself (ENTRY SHAPE in `src/coverage/standards.js`).

A row can also send a rule's findings of one reason code elsewhere, with `reasonCodes: { [code]: { requirements, outcome } }`: `requirements` (default: the row's) are the ones those findings count toward, `[]` for none, and `outcome: 'cantTell'` makes a failing one a question there. A requirement's rollup then judges the rule by the findings that count toward it, so a standard can ask about one cause where WCAG fails it, or file two causes under two tests:

```js
'list-children-valid': {
  requirements: ['9.3.1'],
  reasonCodes: { LIST_ITEM_ROLE_OVERRIDDEN: { requirements: ['9.3.1', '9.3.2'], outcome: 'cantTell' } }
}
```

A row can send findings by what they record as well, with `findings: [{ when, requirements, outcome }]`: `when` gives values that fields of a finding's `data.details` must equal, named by dotted path, and `requirements` and `outcome` work as in `reasonCodes`. A finding goes by the first entry it matches, else by its reason code, else by the row. So a standard can file one rule's failures under the test for their text size, though they share a reason code:

```js
'contrast-minimum': {
  requirements: ['3.1', '3.2'],
  findings: [
    { when: { 'typography.isLargeText': false }, requirements: ['3.1'] },
    { when: { 'typography.isLargeText': true }, requirements: ['3.2'] }
  ]
}
```

Match only fields a rule keeps stable: `reasonCode` on every rule, and those [`API_STABILITY.md`](./API_STABILITY.md) names (`contrast-minimum`'s ratio, threshold and typography, the list rules' `element` and `parentElement`, `aria-role-name-present`'s `role`). A field that changes or disappears matches nothing, and the finding goes by its code or the row.

Each rollup's contributors then say `byReasonCode: true`, with the rule's own outcome in `checkOutcome`.

**A standard that writes its own rollups** routes findings the same way, in each rollup's `meta.contributions`: `{ [ruleId]: { default, codes, findings } }`, one entry for each of its `checksIds` it judges by findings (the others it judges whole). An act, in `default`, in `codes[code]` or in a `findings` entry's `act`, is `'count'`, `'cantTell'` (a failing finding is a question there) or `'ignore'` (the finding doesn't count there), and a finding goes by the first `findings` entry whose `when` it matches, else by its reason code, else by `default`, as above. That is what `ruleMappedStandard` writes. A rollup that groups several requirements, a criterion and its tests say, can also say which of them a finding counts toward, with an act `{ act, requirements }`: the rollup then names, in its `meta.normativeMappings`, only the requirements of the findings that decided it, rather than every requirement of every rule that did, and the contributor lists them in `requirements`. So a contrast failure in small text names the test for small text, not the one for large text beside it:

```js
// One rollup for criterion 3.2, whose tests 3.2.1 and 3.2.3 are for regular and large text
{
  id: 'city-1.0-3.2',
  checksIds: ['contrast-minimum'],
  meta: {
    contributions: {
      'contrast-minimum': {
        default: 'count',
        findings: [
          { when: { 'typography.isLargeText': false }, act: { act: 'count', requirements: ['3.2.1'] } },
          { when: { 'typography.isLargeText': true }, act: { act: 'count', requirements: ['3.2.3'] } }
        ]
      }
    },
    standardMappings: [/* the entries for 3.2.1 and 3.2.3 */]
    // title, standard, version, criterion, tags…
  }
}
```

An act without `requirements` names the rule's own requirements, as before. Only a standard with `ruleMapped: true` has its rollups narrowed this way: for any other, the contributor still lists `requirements`, but the rollup names all its requirements. A rollup names each rule by its outcome in that rollup: a rule whose findings all go elsewhere is a `pass` there, so a rollup another rule fails doesn't name it. `definePack` refuses contributions it can't use: a rule that isn't one of the rollup's `checksIds`, an act it doesn't know, a `when` with no field or with a value that isn't a string, number, boolean or null, and `requirements` that are empty or name one the rollup's `standardMappings` don't. `StandardRollup` in `pack.d.ts` gives the shape.

A standard whose requirements restate WCAG criteria one for one (EN 301 549's chapter 9, say) passes `applicability: 'wcag'` to `ruleMappedStandard`: a requirement's rollup is then `notApplicable` only where the WCAG rollup of its criteria would be, and `cantTell` (`composite.rollup.cantTell.partialCoverage`) where core's rules don't see every case the criterion applies to; it passes only where the WCAG rollup would, and is otherwise `cantTell` (`composite.rollup.cantTell.partialCheck`) ([`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md)), so the two agree in one report. A standard whose requirements are narrower than a criterion leaves it out and judges its own. A requirement that core's rules don't check in full, though it doesn't restate a criterion, says `partial: true` in the requirements table: its rollup is then `cantTell` (`partialCoverage`) where its rules are all `notApplicable`, since they only found none of the cases they look for, and `cantTell` (`composite.rollup.cantTell.partialCheck`) where they all pass, since they checked only part of it, as for a WCAG criterion. The rollup's `data.details.partial` is `true`. A rule's reason codes are in its "What a finding reports" in [`RULE_CATALOG.md`](./RULE_CATALOG.md), and `scripts/data/finding-ids.json` lists every one.

**A standard that writes its own rollups** says both in each rollup's `meta`, as `ruleMappedStandard` writes them: `applicability: 'wcag'` on a rollup that restates WCAG criteria, which are then the `wcagSc` of its `meta.standardMappings` entries, judged as above (a rollup whose entries name no criterion is judged as a requirement of its own); and `partial: true` on one whose rules don't check all its requirement asks. A rollup with neither passes where all its rules pass, and `definePack` refuses any other value of either (an `applicability` that isn't `'wcag'`, a `partial` that isn't `true` or `false`), as `ruleMappedStandard` does its own. The result's `data.details` carries `restatesWcag` (the criteria) and `partial`, by which a stored result read back is judged again. With `meta.contributions` (above), these are the fields of `StandardRollup` in `pack.d.ts` that change how a rollup is judged:

```js
{
  id: 'city-1.0-4.2',
  checksIds: ['img-alt-present', 'img-alt-quality'],
  meta: {
    title: 'Images have a text alternative',
    standard: 'City Standard',
    version: '1.0',
    criterion: '4.2',
    tags: ['city'],
    applicability: 'wcag',                   // restates 1.1.1: judged as WCAG's rollup of it
    standardMappings: [{ standard: 'City Standard', version: '1.0', requirement: '4.2', title: 'Images have a text alternative', wcagSc: ['1.1.1'] }]
  }
}
```

## 6. Messages and languages

Each text a rule shows has a key: `meta.i18n.titleKey` and `descriptionKey`, and the `summaryKey` and `hintKey` of its occurrences (with `{{name}}` placeholders filled from `params`; a single brace is shown as written). `i18n/<locale>.json` holds them per locale, and `dictionaries` in `index.js` lists the files:

```js
dictionaries: { en: require('./i18n/en.json'), fr: require('./i18n/fr.json') }
```

A scan with `engineOptions.locale: 'fr'` shows the French ones; a locale with no dictionary shows English. The pack's keys are its own: start them with the namespace in camel case (`acmeLinkTextSpecific_title`). A pack can't change a core message in a locale core ships; for a locale core doesn't ship (`pt`), its dictionary may also give core's keys, which translates core's rules there. A variant's messages are its own keys under its prefix (`acmeContrastEnhanced_fail_belowThreshold` for core's `contrastMinimum_fail_belowThreshold`); one its pack doesn't define reads the core rule's text in the scan's language, so a variant needs only its title and description.

## 7. Test, lint and document it

- **Tests** use `@surea11y/core/testing`, what core's own rule tests use: `runa11yCoreOnHtml(html, { engineOptions: { packs: [pack], profile }, runOnly })` scans an HTML string in jsdom, and `assertRule(result, ruleId, outcome, { minOccurrences, maxOccurrences })` checks a rule. With packs, the scan runs them as a page has them, registered by `packScript`'s script, and from the pack objects, and fails when the two disagree: a rule that reads a variable from outside its function, which passes in Node and fails in every browser, fails its test, naming the variable. Ask for an opt-in rule by id in `runOnly`, or run a profile. A rule that measures layout (sizes, positions, visibility on screen) needs a real browser: test it in Chromium with Playwright, `packScript([pack])` injected after core's bundle (see [8](#8-use-it)).
- **Lint** (`npm run lint`) holds the rules to core's rules for rules (`@surea11y/core/eslint-plugin`): DOM reads through `ctx.helpers.dom`, roles through `helpers.aria.getExplicitRole`, IDs looked up in the element's own tree, and nothing read in `runInPage` or `applicability` that is defined outside them (`self-contained`): a page gets each of them alone, as its source. A read they flag that is right says why in an `eslint-disable-next-line` comment.
- **Docs** (`npm run docs`, `surea11y-pack docs`; `--pack <file>` for a pack that is not the module `package.json` names as its `main`) write `docs/RULE_CATALOG.md` (rules, with the `@applicability`, `@expectation` and `@reports` of their source headers, profiles and rollups) and run every example of `docs/RULE_EXAMPLES.md` in Chromium, recording any that gives another outcome than its label (and, for a rule that didn't complete, its error). An example that can't be run (it doesn't load within 15 seconds, or its page breaks the engine) is named, the others still run, and nothing is written. `--no-examples` leaves the examples out, where Chromium isn't installed; where another Chromium build is, `CHROMIUM_EXECUTABLE_PATH` names it. `npm run docs:check` fails when either is stale: run it in CI.

## 8. Use it

**In Node:**

```js
const { runDomRulesInPage } = require('@surea11y/core');
const policy = require('@acme/a11y-pack');

const result = runDomRulesInPage(url, null, { packs: [policy], profile: 'acme-policy' });
result.engine.packs;   // ['@acme/a11y-pack@0.1.0']
```

The pack is prepared once and kept for the next scan with the same pack object, so a pack must not change once made: `definePack` freezes it, with its lists and objects, and a change throws. A pack made without `definePack` isn't frozen, and a change to it after a scan goes unseen.

**From the CLI** ([`@surea11y/cli`](https://github.com/SureA11y/cli)): `surea11y scan <url> --pack @acme/a11y-pack --profile acme-policy`.

**With a browser binding** (Playwright, Puppeteer, Selenium, WebdriverIO), which registers the pack in every frame it scans:

```js
await new A11yCoreBuilder({ page }).withPacks(policy).options({ profile: 'acme-policy' }).analyze();
```

In Cypress, `withPacks()` takes the module name, and the binding's plugin prepares the pack in Node.

**In a page of your own** (an extension, a `page.evaluate`): inject `packScript([policy])` from `@surea11y/core/pack` after core's browser bundle, or ship one file built with `buildBrowserBundle({ packs: [policy] })`, and name the pack as `name@version`. The script runs only with the core that wrote it, so a page with another core's bundle skips the pack (`skippedPacks` names the two versions): a page with no driver, which loads its scripts as files, is best served by one file from `buildBrowserBundle`, which can't fall out of step. Packs a scan uses together go in one `packScript` call, named together: the page runs exactly the set one call registered, with the core it was prepared with, and lists any other in `skippedPacks`. The script holds your rules' code as you wrote it, so a rule may not contain `</script` (write `'<' + '/script'`), and a rule given as a bound function can't be written into it:

```js
const fs = require('node:fs');
await page.evaluate(fs.readFileSync(require.resolve('@surea11y/core/browser'), 'utf8'));
await page.evaluate(packScript([policy]));
await page.evaluate(() =>
  a11ycore.runa11yCoreInPage(null, null, { packs: ['@acme/a11y-pack@0.1.0'], profile: 'acme-policy' })
);
```

In a `<script>` tag, with the file `buildBrowserBundle` wrote (`fs.writeFileSync('surea11y-acme.js', buildBrowserBundle({ packs: [policy] }))`), built again for each release of core or of the pack:

```html
<script src="surea11y-acme.js"></script>
<script>
  const result = a11ycore.runa11yCoreInPage(location.href, null, { packs: ['@acme/a11y-pack@0.1.0'], profile: 'acme-policy' }, null);
</script>
```

The rules' code is written into the script as functions, so it runs where a Content Security Policy forbids `eval`. See [Packs in a page](./INTEGRATION.md#packs-in-a-page).

**When a pack is wrong**, `definePack` throws, naming each problem, so its own tests fail; `checkPack(pack)` returns the same list without throwing, and with the installed core's version checked too. Both run a standard's own checks of its tables (`validate`, which `ruleMappedStandard` makes) against core's rules and the pack's, as a scan does: a version without its `wcagVersion`, or a finding sent to a requirement the table lacks, is refused there rather than make every scan skip the pack. What only a scan can find (a profile naming a rule that doesn't exist, a core version outside the pack's range, an invalid pack never passed through `definePack`) makes the scan run without the pack, warn, and list it in `skippedPacks` with the reason; under `strictOptions` it throws, with `code: 'INVALID_ENGINE_OPTIONS'` as every error in `engineOptions.packs` has. So a scan can finish without the checks you added the pack for: a tool that depends on a pack should check `skippedPacks` before treating the scan as complete. `describePacks([policy])` lists what a pack brings: its rules, profiles, rollups, locales and the probes its rules read.

## 9. Publish it

The generated package is `private`. Choose its licence, set `license` and remove `private` in `package.json`, and `npm publish`. Keep `@surea11y/core` a peer dependency, with the range in `core`.

Semver covers what a pack builds on ([`API_STABILITY.md`](./API_STABILITY.md#extending-the-engine)): the pack's shape, the rule contract, core's helpers, and the settings a core rule declares for its variants. A pack written for core 1.11 keeps working with later 1.x versions. For your own users, a rule's id and its reason codes are what their baselines hold: rename or remove one only in a major version of the pack.
