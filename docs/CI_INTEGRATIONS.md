# CI/CD pipeline integrations

Ready-to-paste templates wrapping the [CLI](./CLI.md) (`npx @surea11y/core scan ...`) in GitHub Actions and Bitbucket Pipelines. If you're calling the library directly from your own Node script instead of the CLI, see [`INTEGRATION.md`](./INTEGRATION.md#ci-gating-a-build-on-the-result) instead — this page is specifically about the CLI as a pipeline step.

All of these rely on the CLI's own exit codes (`0` clean, `1` at least one — or one *new*, with `--baseline` — `fail` outcome, `2` a usage/scan error) to gate the pipeline; no extra scripting is required for basic pass/fail gating.

## GitHub Actions

### Basic: gate on exit code

```yaml
name: Accessibility scan
on: [pull_request]

jobs:
  a11y-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci && npm run build   # produce whatever static HTML you're scanning
      - run: npx @surea11y/core scan ./dist/index.html
```

This fails the job the moment any `fail` outcome is found. For an existing site with pre-existing violations, see the baseline variant below instead of disabling the step.

### With a baseline (existing site, gate only on new violations)

```sh
# Once, locally: record every current fail occurrence, commit the file.
npx @surea11y/core scan ./dist/index.html --write-baseline a11y-baseline.json
git add a11y-baseline.json
```

```yaml
      - run: npm ci && npm run build
      - run: npx @surea11y/core scan ./dist/index.html --baseline a11y-baseline.json
```

See [`BASELINE.md`](./BASELINE.md) for what counts as "known" vs. "new", and how to regenerate the file as violations get fixed.

### Uploading SARIF to GitHub Code Scanning

`upload-sarif` needs `security-events: write` permission and does not fail the job itself — pair it with a separate gating step (or `continue-on-error` + your own check) if you also want the build to fail on new violations.

```yaml
name: Accessibility scan
on: [pull_request]

permissions:
  contents: read
  security-events: write

jobs:
  a11y-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci && npm run build
      - name: Scan (report, don't fail the job here)
        run: npx @surea11y/core scan ./dist/index.html --baseline a11y-baseline.json --sarif results.sarif
        continue-on-error: true
        id: scan
      - name: Upload SARIF to Code Scanning
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
      - name: Fail the job on new violations
        if: steps.scan.outcome == 'failure'
        run: exit 1
```

See [`SARIF.md`](./SARIF.md) for the output format and a known limitation: a scan of a **local file** in your checkout gets inline annotations in the Code Scanning UI; a scan of a **live URL** doesn't (SARIF/Code Scanning can only associate a finding with a real file in the repository).

## Bitbucket Pipelines

Bitbucket Pipelines has no built-in SARIF-consuming dashboard equivalent to GitHub Code Scanning, so the CLI's exit code (plus, optionally, `--html` as a downloadable pipeline artifact) is the practical integration point rather than `--sarif`.

```yaml
pipelines:
  pull-requests:
    '**':
      - step:
          name: Accessibility scan
          image: node:20
          script:
            - npm ci
            - npm run build
            - npx @surea11y/core scan ./dist/index.html --baseline a11y-baseline.json --html a11y-report.html
          artifacts:
            - a11y-report.html
```

The step fails the pipeline on the CLI's exit code exactly like any other `script` entry; `a11y-report.html` (see [`REPORT.md`](./REPORT.md)) is attached as a downloadable build artifact so a reviewer can open it without re-running the scan locally.

## Free-tier/private-repo minute limits

If your pipeline provider's free tier is minute-limited (Bitbucket Pipelines' free tier is 50 build-minutes/month on private workspaces, for example), a `jsdom`-based scan of static/server-rendered HTML (what the CLI does) is far cheaper than driving a real browser — see [`CLI.md`](./CLI.md#what-it-can-and-cant-scan) for what that trades away (no client-rendered content, no real CSS layout).
