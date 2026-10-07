# JUnit report

`@surea11y/core/junit` renders a scan result as JUnit XML, the test report format CI dashboards read natively: GitLab's merge request test widget, Azure DevOps' Tests tab, Jenkins and CircleCI.

```js
const { renderJunitReport } = require('@surea11y/core/junit');
const { runDomRulesInPage } = require('@surea11y/core');

const result = runDomRulesInPage(url, null, { profile: 'wcag22-aa' }, null);
require('fs').writeFileSync('surea11y.junit.xml', renderJunitReport(result));
```

`renderJunitReport(result, options)` is a pure function: it returns the XML as a string and never touches the filesystem. It works just as well on a result saved as JSON earlier, such as the output of `surea11y scan <target> --json` from [`@surea11y/cli`](https://github.com/SureA11y/cli#readme) — see [`CI_INTEGRATIONS.md`](./CI_INTEGRATIONS.md#junit-test-reports).

## Shape

One `<testsuite>` per WCAG Success Criterion, one `<testcase>` per rule mapped to it:

```xml
<testsuites name="surea11y" tests="14" failures="2" errors="0" skipped="4" time="0">
  <testsuite name="WCAG 1.1.1 Non-text content: text alternatives" tests="1" failures="1" errors="0" skipped="0" time="0">
    <properties>
      <property name="wcagCriterion" value="1.1.1"/>
      <property name="wcagLevel" value="A"/>
      <property name="en301549" value="9.1.1.1"/>
      <property name="criterionOutcome" value="fail"/>
      <property name="engine" value="a11ycore"/>
      <property name="schemaVersion" value="1.0.0"/>
      <property name="wcagVersion" value="2.2"/>
      <property name="profile" value="wcag22-aa"/>
      <property name="layout" value="false"/>
      <property name="locale" value="en"/>
      <property name="url" value="https://example.test/"/>
    </properties>
    <testcase classname="wcag-1.1.1" name="img-alt-present" time="0">
      <failure type="fail" message="1 failing occurrence: Missing alt attribute on &lt;img&gt;.">- Missing alt attribute on &lt;img&gt;. Add an alt attribute (use alt=&quot;&quot; only for decorative images).
  selector: html &gt; body &gt; main &gt; img
  html: &lt;img src=&quot;a.png&quot;&gt;</failure>
    </testcase>
  </testsuite>
</testsuites>
```

- **Suites follow the criterion**, because that is what people track, and **testcases follow the rule** rather than the occurrence, so a defect repeated forty times on a page is one failing test whose body lists all forty, and test counts stay stable between runs.
- Suites come from each rule's own WCAG mappings, not from the composites, so every rule that ran is reported even when composites were excluded. The composite, when it ran, supplies the suite's title and the `criterionOutcome` property. A criterion checked by several composites (4.1.2: its accessible name and its ARIA validity) takes the worst of their outcomes, since one part failing fails the criterion, and the name their titles share (`WCAG 4.1.2 Name, role, value`). A rule mapped to two criteria appears in both suites. A rule mapped to no criterion goes into a final `Other checks` suite with `classname="other"`.
- The run's `engine`, `schemaVersion`, `wcagVersion`, `profile`, `optInRules` (comma-separated tags, when `engineOptions.optInRules` added rules), the rendering conditions from `engine.environment` (`layout`, and in a browser `viewport` as `1280x720`, `devicePixelRatio`, `colorScheme` and `fonts`), `locale` and `url` are repeated as properties on every suite, each only when the result has it. A failure that comes and goes with the viewport width can be traced to the width the run used. The example above is a jsdom scan, which has no layout.
- Suites are ordered by criterion, numerically (1.4.3 before 1.4.10), and testcases by rule id.
- A page scanned at several viewport widths gives the same suite and test names at each width, and a CI test view may merge them. Write one file per width, and name or group the files by width in the CI's report settings; the `viewport` property records which width a file describes.
- `en301549` properties name the EN 301 549 clause that restates the criterion, where there is one and the scan asked for EN 301 549 clauses (see [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md#en-301-549)).

## Outcomes

| Rule outcome | JUnit | Why |
|---|---|---|
| `fail` | `<failure type="fail">`, one line per failing occurrence (message, hint, selector, markup), then `help: <url>` when the rule has an `http(s)` help link (`meta.helpUrl`), or else its first WCAG criterion's Understanding document | The deterministic, gating case. |
| `cantTell` | `<skipped>` saying how many occurrences need manual review | JUnit has no "could not tell". Skipped surfaces it without turning a build red, the same line SARIF draws with `warning`. |
| `pass` | a bare `<testcase>` | |
| `notApplicable` | left out | A page has hundreds; none says anything. `includeNotApplicable: true` adds them as `<skipped message="Not applicable">`. |
| a rule that did not complete (`cantTell` with no occurrences and an `error`: it threw) | `<error type="ruleError">` with the error, counted in `errors` | JUnit's element for a test that could not run. The page was not checked against the rule, which is neither a pass nor something to review. |

A `fail` rule that also has `cantTell` occurrences reports the failures in `<failure>` and the undecided ones in `<system-out>`, where dashboards show test output. A skipped `cantTell` rule does the same.

## Options

| Option | Default | Effect |
|---|---|---|
| `cantTellAs` | `'skipped'` | `'failure'` reports `cantTell` rules as `<failure type="cantTell">`, for a pipeline that must not pass while anything is undecided. |
| `includeNotApplicable` | `false` | Include `notApplicable` rules as skipped tests. |
| `baselineEntries` | none | Entries from [`BASELINE.md`](./BASELINE.md)'s `buildBaselineEntries()`. Fail occurrences recorded there are dropped, exactly as in SARIF. A rule whose every failure is already known is `<skipped message="N known failures recorded in the baseline">`, not passing: it did not pass. |
| `name` | `'surea11y'` | The `name` of the root `<testsuites>`, for telling several pages' reports apart in one dashboard. |

## Determinism

The engine has no clock, and this report does not invent one: every `time` is `"0"`, and a `timestamp` attribute appears on each suite only when the result carries one (`engineOptions.timestamp`). The same scan always renders byte-identical XML, so a report can be committed or diffed.

Text is escaped for XML, and characters XML 1.0 forbids even when escaped (most control characters, lone surrogates) are dropped, since markup captured from a page can contain them.
