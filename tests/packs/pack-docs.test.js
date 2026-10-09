'use strict';

/**
 * @surea11y/core/pack-docs (src/pack-docs.js) and `surea11y-pack docs`: a
 * pack's rule catalog lists its own rules with their source headers' prose
 * and its standard's rollups; the examples' records say which rules have no
 * section and which examples give another outcome than their label; --check
 * writes nothing and fails when one is stale.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { packDocs, ruleCatalog } = require('@surea11y/core/pack-docs');
const sample = require('../fixtures/packs/sample.js');

const RULES_DIR = path.join(__dirname, '..', 'fixtures', 'profiles', 'sample', 'rules');
const BIN = path.join(__dirname, '..', '..', 'bin', 'surea11y-pack.js');

let chromium = null;
try {
  ({ chromium } = require('playwright'));
} catch {}

const EXAMPLES = `# Examples

## sample-title-length

**Passed**
\`\`\`html
<title>A short title</title><p>Text</p>
\`\`\`

**Failed**
\`\`\`html
<title>Also short</title><p>Text</p>
\`\`\`

## sample-gone
`;

// A pack's folder: its rules (the sample profile's, linked) and its examples.
function packFolder() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-docs-'));
  fs.symlinkSync(RULES_DIR, path.join(root, 'rules'));
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'docs', 'RULE_EXAMPLES.md'), EXAMPLES);
  fs.writeFileSync(
    path.join(root, 'index.js'),
    `module.exports = require(${JSON.stringify(require.resolve('../fixtures/packs/sample.js'))});\n`
  );
  return root;
}

test("a pack's catalog lists its rules, their prose and its standard's rollups", () => {
  const md = ruleCatalog(sample, { rulesDir: RULES_DIR });
  assert.match(md, /^# Rule catalog: Sample Standard\n/);
  assert.match(md, /The rules of Sample Standard \(`sample-pack`\), a pack for `@surea11y\/core`/);
  assert.match(md, /Run `npx surea11y-pack docs` to regenerate this file/);
  for (const id of ['sample-contrast-enhanced', 'sample-statement-link', 'sample-title-length']) {
    assert.match(md, new RegExp(`### \`${id}\``));
  }
  assert.doesNotMatch(md, /### `img-alt-present`/, "core's rules are core's catalog's");
  assert.match(md, /\*\*Expectation\.\*\* The title, trimmed, is 60 characters or fewer\./);
  assert.match(md, /## Rollups \(\d+\)/);
  assert.match(
    md,
    /\]\(https:\/\/github\.com\/SureA11y\/core\/blob\/main\/docs\/RULE_CATALOG\.md\)/
  );
});

test('docs writes the catalog and the coverage record, and --check fails when one is stale', async () => {
  const root = packFolder();
  const first = await packDocs(sample, { root, examples: false });
  assert.deepEqual(first, {
    written: [
      path.join('docs', 'RULE_CATALOG.md'),
      path.join('scripts', 'data', 'rule-examples-coverage.json')
    ],
    problems: []
  });
  const coverage = JSON.parse(
    fs.readFileSync(path.join(root, 'scripts', 'data', 'rule-examples-coverage.json'), 'utf8')
  );
  assert.deepEqual(coverage, {
    missing: ['sample-contrast-enhanced', 'sample-statement-link'],
    stale: ['sample-gone']
  });
  assert.deepEqual(await packDocs(sample, { root, examples: false, check: true }), {
    written: [],
    problems: []
  });

  fs.appendFileSync(path.join(root, 'docs', 'RULE_CATALOG.md'), 'edited\n');
  fs.appendFileSync(path.join(root, 'docs', 'RULE_EXAMPLES.md'), '\n## sample-statement-link\n');
  const { problems } = await packDocs(sample, { root, examples: false, check: true });
  assert.match(problems[0], /RULE_CATALOG\.md is stale\. Run: npx surea11y-pack docs/);
  assert.match(
    problems.join('\n'),
    /recorded as missing now have a section:\n {2}sample-statement-link/
  );
});

test('a pack that is not valid is not documented', async () => {
  const { written, problems } = await packDocs(
    { name: 'bad', version: '1.0.0' },
    {
      root: os.tmpdir(),
      examples: false
    }
  );
  assert.deepEqual(written, []);
  assert.ok(problems.length > 0 && problems.every((p) => p.startsWith('bad: ')));
});

test('surea11y-pack docs runs in the pack folder and exits 1 on a stale check', () => {
  const root = packFolder();
  const run = (...args) =>
    execFileSync(process.execPath, [BIN, ...args], { cwd: root, encoding: 'utf8', stdio: 'pipe' });
  assert.match(run('docs', '--no-examples'), /wrote docs\/RULE_CATALOG\.md/);
  assert.match(run('docs', '--check', '--no-examples'), /docs are up to date/);
  fs.appendFileSync(path.join(root, 'docs', 'RULE_CATALOG.md'), 'edited\n');
  assert.throws(
    () => run('docs', '--check', '--no-examples'),
    (err) => {
      assert.equal(err.status, 1);
      assert.match(err.stderr, /RULE_CATALOG\.md is stale/);
      return true;
    }
  );
  assert.throws(
    () => run('nothing'),
    (err) => err.status === 1 && /Usage:/.test(err.stderr)
  );
});

test(
  'the examples run in Chromium with the pack, and a wrong label is recorded',
  { skip: chromium ? false : 'playwright not installed' },
  async () => {
    const root = packFolder();
    const { problems } = await packDocs(sample, { root });
    assert.deepEqual(problems, []);
    const record = JSON.parse(
      fs.readFileSync(path.join(root, 'scripts', 'data', 'rule-examples-outcomes.json'), 'utf8')
    );
    assert.deepEqual(record.disagreements, [
      {
        ruleId: 'sample-title-length',
        label: 'Failed',
        engine: 'pass',
        example: '<title>Also short</title><p>Text</p>'
      }
    ]);
    assert.deepEqual((await packDocs(sample, { root, check: true })).problems, []);
  }
);
