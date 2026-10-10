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

The pack works as generated: its tests pass, its rules lint clean, its examples agree with its rules. Change it step by step from there, running `npm test` as you go. What it holds:

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

Its README walks through each file. The rest of this guide explains the choices behind them.

## 2. Name it

- **The package name** is an npm package name (lowercase, with a scope or without, no spaces), and **the version** a whole version (`1.0.0`, `1.0.0-rc.1`). A scan reports them in `engine.packs` (`@acme/a11y-pack@1.0.0`).
- **The namespace** (`namespace: 'acme'`) keeps the pack's ids apart from core's and other packs': every rule, rollup and profile id starts with it and `-`. It is also the tag of the pack's rules (see [opt-in](#the-namespace-tag-makes-the-packs-rules-opt-in)). It may be a word core's rules use as a tag (`forms`, `best-practice`): the tag still makes only the pack's own rules opt-in. It may not start core's rule ids (`img`, `aria`, `link`), since the pack's ids would then sit among core's, where core could add the same one; such a pack is invalid. Core doesn't start a new rule id with a namespace a published pack uses. Two packs in one scan can't share a namespace, or have one that starts the other's (`city` and `city-parks`): the first by name runs, and the other is skipped. `new` takes the package scope or first word; `--namespace` chooses another.
- **Ids** have core's shape: lowercase letters and digits in parts joined by `-` (`acme-link-text-specific`), dots allowed within a part (`acme-1.0`); a rollup id may keep the capitals of a requirement's number (`city-1.0-S1`). Rule, rollup and profile ids, and a standard's `key`, start with the namespace and `-` (the key may be the namespace itself), a standard's `ruleTag` is the namespace, and a rule's `meta.wcagSc` names WCAG criteria. A pack that breaks one of these is invalid.
- **`core`** is the range of core versions the pack works with (`'^1.11.0'`), read as npm reads the ranges in a `package.json` (`1.x`, `~1.11`, `>=1.11 <2`, `1.11.0 - 2.x`, `||`), so a prerelease core matches only a range that names a prerelease of that version. An empty range, or an empty alternative (`'^1.11.0 ||'`), which npm takes for any version, is no range here. A scan with a core outside it skips the pack, with the reason in `skippedPacks`; one whose range can't be read says so.
- **`title`** is what results and reports call a checklist (a standard has its own `standard` name).

## 3. Write its rules

A rule is a module: `{ id, meta, runInPage }`, and `applicability` when it applies only sometimes. Core's rules are written the same way; [`RULE_AUTHORING.md`](./RULE_AUTHORING.md) describes every field.

```js
const id = 'acme-link-text-specific';
const meta = {
  title: 'Links say where they go',                 // English text
  description: 'Checks that no link is named only "click here"…',
  i18n: { titleKey: 'acmeLinkTextSpecific_title', descriptionKey: 'acmeLinkTextSpecific_description' },
  tags: ['acme', 'links', 'atomic', 'automatic'],    // the namespace tag first
  wcagSc: [],                                       // the WCAG criteria it checks, if any
  defaultSeverity: 'moderate',                      // minor, moderate, serious, critical
  type: 'automatic',                                // or 'manual'
  defaultConfidence: 'high'
};
function runInPage(ctx) { /* ... */ }
module.exports = { id, meta, runInPage };
```

**`runInPage(ctx)` runs in the page.** In a browser the engine writes the function into the page, so it uses only `ctx`, never a variable or module from outside it:

- `ctx.document`, `ctx.window`, and `ctx.rule` (its id and default severity);
- `ctx.helpers`, core's helpers ([`RULE_HELPERS.md`](./RULE_HELPERS.md)): `queryAllSmart(selector)` finds elements in the scanned part of the page, shadow roots included; `isIncludedInAccessibilityTree(el, ctx)`, `getAccessibleNameInfo(el, ctx)` and `getContentNameInfo(el, ctx)` answer accessibility questions as core's rules do; `helpers.aria.getExplicitRole(el)` reads a role; `helpers.contrast` measures colours;
- `ctx.helpers.dom` reads DOM properties (`dom.getAttribute(el, 'target')`, `dom.parentNode(el)`) where a page's markup can't redirect them. `npm run lint` says where a rule reads the DOM directly.

**It only reads.** A pack's rules run after core's, and `ctx.helpers`, `ctx.engineOptions` and `ctx.inputs.probes` are read-only for them: setting or deleting anything on them throws, and the rule is reported as `cantTell` with that error, so one rule can't change what another sees. A rule must not change the page either: core can't undo a change, so a rule that makes one is named in a warning, and the rules after it and the page keep the change. Whatever a rule throws or returns, the scan returns a result: a thrown value that can't be turned into text, or a result that can't be read (a getter or a Proxy that throws), makes that rule alone `cantTell` with an error saying so. Its result is made plain data, as probes are, so the scan's result can be written as JSON and cloned: a BigInt becomes its digits, an element its tag (`"<body>"`), a Map its entries, a Set its values, a Date what `toJSON` gives, a circular reference `"[circular]"`, and functions and Symbols are left out.

**It returns an outcome** with an occurrence per element:

| Outcome | When |
|---|---|
| `fail` | An automatic rule found a failure. |
| `pass` | It applied, and nothing failed (a manual rule: nothing needs a person). |
| `cantTell` | A person must judge: a manual rule's answer, or an automatic rule unsure. |
| `notApplicable` | Nothing on the page for it to check. |

```js
helpers.reportOccurrence(el, {
  summary: 'The link is named only "read more".',     // English text
  hint: 'Name the link by where it goes.',
  i18n: { summaryKey: 'acmeLinkTextSpecific_summary_fail', hintKey: '…', params: { name } },
  data: { details: { reasonCode: 'GENERIC_LINK_NAME', name } }
});
```

The engine fills in the element's selector, HTML and path. `reasonCode` is part of a finding's identity in baselines and SARIF: keep it stable once the pack is released.

**Three shortcuts to a rule:**

- **A variant** runs a core rule at other settings, with no code of its own: `{ id, from: 'contrast-minimum', config: { normalTextRatio: 7, largeTextRatio: 4.5 }, meta }`. A core rule that can be varied declares its `settings` (see its source and [`RULE_AUTHORING.md`, "Rule variants"](./RULE_AUTHORING.md#rule-variants)). A fix to the core rule reaches the variant.
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
    rules: ['img-alt-present', 'link-name-present', 'page-title-present']   // exactly these
  }
}
```

A rule runs under the profile when it carries one of its `tags` **or** its id is in `rules`, and is not in `exclude`. The pack's own rules run under every profile of the pack (a checklist adds its namespace to the tags; a standard's profile lists it). In a profile, the namespace selects the pack's own rules and items only, not core rules that carry a tag of the same name. Every field:

| Field | What it does |
|---|---|
| `tags` | Rules carrying any of these tags. `wcagTags(version, levels)` from `@surea11y/core/pack` gives core's WCAG tags (`wcagTags('2.1')` is 2.0 and 2.1, A and AA). |
| `rules` | Rules by id, core's or the pack's: a best-practice rule no WCAG tag selects, or, with `tags: []`, exactly a list. |
| `exclude` | `{ rules: [...] }` leaves rules out; `{ criteria: ['2.5.8'] }` waives WCAG criteria, and their rules and rollups go. |
| `severity` | `{ ruleId: level }`: another severity under the profile. Results show it and keep the rule's own as `ruleSeverity`; baselines and finding ids don't change. |
| `version`, `mappedRules` | A standard's profile only: the standard's version it targets, and `mappedRules: true` to run every rule the standard maps for that version. |

Core's rules, with their ids, tags and what each checks, are in [`RULE_CATALOG.md`](./RULE_CATALOG.md). After `npm run docs`, the pack's own `docs/RULE_CATALOG.md` has a table of its profiles.

## 5. Group results: checklist items or requirements

**A checklist's items** are its `rollups`: each groups rules, core's or the pack's, into one result.

```js
rollups: [
  { id: 'acme-links', title: 'Links say where they go',
    checksIds: ['link-name-present', 'acme-link-text-specific', 'acme-new-window-review'] }
]
```

An item fails when one of its rules fails, asks (`cantTell`) when one asks, and passes when they pass. Under the checklist's profiles, results list the items in `rulesResults`; the HTML report shows them under the checklist's title, SARIF tags each rule with the items it belongs to (`city-images`), JUnit lists them as properties of each rule's criterion (`<property name="city" value="city-images"/>`), and `result.standards` names the checklist. Each rule's `meta.normativeMappings` has an entry for each item, under the checklist's name.

**A standard's requirements** come from two tables (generated in `requirements.js` and `rule-map.js`):

```js
// requirements.js: per version, each requirement's number, wording and WCAG criteria
const VERSIONS = [{ version: '1.0', wcagVersion: '2.2' }];
const REQUIREMENTS = { '1.0': { 1: { title: 'Images have a text alternative', wcagSc: ['1.1.1'] }, /* ... */ } };

// rule-map.js: which requirements each rule checks, and why
const RULE_REQUIREMENTS = { '1.0': {
  'img-alt-present': { requirements: ['1'], note: 'An image with no alternative fails 1.' },
  'acme-link-text-specific': { requirements: ['2'], note: 'A link named "read more" fails 2.' }
} };
```

`ruleMappedStandard({ standard, tag, versions, requirements, ruleMap })` from `@surea11y/core/pack` turns them into the standard's functions: a rollup per requirement (`<ns>-<version>-<requirement>`), the requirements each rule's result names (in `meta.normativeMappings`, under the standard's profiles or with `engineOptions.mappings: ['<key>']`), and checks of both tables when the pack is prepared. The standard's entry (`standard: { key, standard, versions, profiles, ruleTag, ruleMapped, mappingsFor, composites, validate, report }`) is generated in `index.js`; `report.noteKey` names the message above its results in the HTML report. A standard whose requirements relate to WCAG in a way the two tables can't say writes those functions itself (ENTRY SHAPE in `src/coverage/standards.js`).

## 6. Messages and languages

Each text a rule shows has a key: `meta.i18n.titleKey` and `descriptionKey`, and the `summaryKey` and `hintKey` of its occurrences (with `{name}` placeholders filled from `params`). `i18n/<locale>.json` holds them per locale, and `dictionaries` in `index.js` lists the files:

```js
dictionaries: { en: require('./i18n/en.json'), fr: require('./i18n/fr.json') }
```

A scan with `engineOptions.locale: 'fr'` shows the French ones; a locale with no dictionary shows English. Keys must be the pack's own: start them with the namespace in camel case (`acmeLinkTextSpecific_title`). A variant's messages are its own keys under its prefix.

## 7. Test, lint and document it

- **Tests** use `@surea11y/core/testing`, what core's own rule tests use: `runa11yCoreOnHtml(html, { engineOptions: { packs: [pack], profile }, runOnly })` scans an HTML string in jsdom, and `assertRule(result, ruleId, outcome, { minOccurrences, maxOccurrences })` checks a rule. With packs, the scan runs them as a page has them, registered by `packScript`'s script, and from the pack objects, and fails when the two disagree: a rule that reads a variable from outside its function, which passes in Node and fails in every browser, fails its test, naming the variable. Ask for an opt-in rule by id in `runOnly`, or run a profile. A rule that measures layout (sizes, positions, visibility on screen) needs a real browser: test it in Chromium with Playwright, `packScript([pack])` injected after core's bundle (see [8](#8-use-it)).
- **Lint** (`npm run lint`) holds the rules to core's rules for rules (`@surea11y/core/eslint-plugin`): DOM reads through `ctx.helpers.dom`, roles through `helpers.aria.getExplicitRole`, IDs looked up in the element's own tree, and nothing read in `runInPage` or `applicability` that is defined outside them (`self-contained`): a page gets each of them alone, as its source. A read they flag that is right says why in an `eslint-disable-next-line` comment.
- **Docs** (`npm run docs`, `surea11y-pack docs`) write `docs/RULE_CATALOG.md` (rules, with the `@applicability`, `@expectation` and `@reports` of their source headers, profiles and rollups) and run every example of `docs/RULE_EXAMPLES.md` in Chromium, recording any that gives another outcome than its label. `npm run docs:check` fails when either is stale: run it in CI.

## 8. Use it

**In Node:**

```js
const { runDomRulesInPage } = require('@surea11y/core');
const policy = require('@acme/a11y-pack');

const result = runDomRulesInPage(url, null, { packs: [policy], profile: 'acme-policy' });
result.engine.packs;   // ['@acme/a11y-pack@1.0.0']
```

The pack is prepared once and kept for the next scan with the same pack object, so a pack must not change once made: `definePack` freezes it, with its lists and objects, and a change throws. A pack made without `definePack` isn't frozen, and a change to it after a scan goes unseen.

**From the CLI** ([`@surea11y/cli`](https://github.com/SureA11y/cli)): `surea11y scan <url> --pack @acme/a11y-pack --profile acme-policy`.

**With a browser binding** (Playwright, Puppeteer, Selenium, WebdriverIO), which registers the pack in every frame it scans:

```js
await new A11yCoreBuilder({ page }).withPacks(policy).options({ profile: 'acme-policy' }).analyze();
```

In Cypress, `withPacks()` takes the module name, and the binding's plugin prepares the pack in Node.

**In a page of your own** (an extension, a `page.evaluate`): inject `packScript([policy])` from `@surea11y/core/pack` after core's browser bundle, or ship one file built with `buildBrowserBundle({ packs: [policy] })`, and name the pack as `name@version`. Packs a scan uses together go in one `packScript` call, named together: the page runs exactly the set one call registered, with the core it was prepared with, and lists any other in `skippedPacks`. The script holds your rules' code as you wrote it, so a rule may not contain `</script` (write `'<' + '/script'`), and a rule given as a bound function can't be written into it:

```js
await page.addScriptTag({ path: require.resolve('@surea11y/core/browser') });
await page.addScriptTag({ content: packScript([policy]) });
await page.evaluate(() =>
  a11ycore.runa11yCoreInPage(null, null, { packs: ['@acme/a11y-pack@1.0.0'], profile: 'acme-policy' })
);
```

The rules' code is written into the script as functions, so it runs where a Content Security Policy forbids `eval`.

**When a pack is wrong** (an id without the namespace, a profile naming a rule that doesn't exist, a core version outside its range), the scan runs without it, warns, and lists it in `skippedPacks` with the reason; under `strictOptions` it throws. `describePacks([policy])` lists what a pack brings: its rules, profiles, rollups, locales and the probes its rules read.

## 9. Publish it

The generated package is `private`. Choose its licence, set `license` and remove `private` in `package.json`, and `npm publish`. Keep `@surea11y/core` a peer dependency, with the range in `core`.

Semver covers what a pack builds on ([`API_STABILITY.md`](./API_STABILITY.md#extending-the-engine)): the pack's shape, the rule contract, core's helpers, and the settings a core rule declares for its variants. A pack written for core 1.11 keeps working with later 1.x versions. For your own users, a rule's id and its reason codes are what their baselines hold: rename or remove one only in a major version of the pack.
