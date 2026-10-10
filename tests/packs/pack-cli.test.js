'use strict';

/**
 * `surea11y-pack`: its arguments are read strictly (an unknown flag, a value
 * missing or an argument too many is an error naming it), help is the same
 * however it is asked for, and `docs` runs every example even when one can't
 * be run, writes nothing then, and keeps the error of a rule that didn't
 * complete.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { packDocs } = require('@surea11y/core/pack-docs');
const { definePack } = require('@surea11y/core/pack');

const BIN = path.join(__dirname, '..', '..', 'bin', 'surea11y-pack.js');

let chromium = null;
try {
  ({ chromium } = require('playwright'));
} catch {}

function run(args, cwd = os.tmpdir()) {
  const r = spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8' });
  return { status: r.status, out: r.stdout, err: r.stderr };
}

test('help is printed, and exits 0, however it is asked for', () => {
  for (const args of [[], ['--help'], ['-h'], ['new', '--help'], ['docs', '-h']]) {
    const r = run(args);
    assert.equal(r.status, 0, args.join(' '));
    assert.match(r.out, /^Usage:/, args.join(' '));
  }
});

test('a wrong argument is named, with the usage, and exits 1', () => {
  const cases = [
    [['bogus'], /unknown command "bogus"/],
    [['new'], /new needs the folder/],
    [['new', 'a', 'b'], /new takes one folder, and was given a b/],
    [['new', 'x', '--kind'], /--kind needs a value/],
    [['new', 'x', '--name', '--kind', 'standard'], /--name needs a value/],
    [['new', 'x', '--nmae', 'y'], /new has no option --nmae/],
    [['docs', '--chek'], /docs has no option --chek/],
    [['docs', 'extra'], /docs takes no arguments, and was given extra/]
  ];
  for (const [args, message] of cases) {
    const r = run(args);
    assert.equal(r.status, 1, args.join(' '));
    assert.match(r.err, message, args.join(' '));
    assert.match(r.err, /Usage:/, args.join(' '));
  }
});

test('new reads --kind=standard as --kind standard, and quotes the folder it names', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-cli-'));
  const r = run(['new', 'my pack', '--kind=standard', '--name=@acme/my-pack'], cwd);
  assert.equal(r.status, 0, r.err);
  assert.match(r.out, /Next: cd 'my pack' && npm install/);
  const index = fs.readFileSync(path.join(cwd, 'my pack', 'index.js'), 'utf8');
  assert.match(index, /standard/);
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(cwd, 'my pack', 'package.json'))).name,
    '@acme/my-pack'
  );
});

test('docs says which pack it could not load, without a stack', () => {
  const r = run(['docs', '--no-examples', '--pack', 'nowhere.js']);
  assert.equal(r.status, 1);
  assert.match(r.err, /Could not load the pack .*nowhere\.js/);
  assert.doesNotMatch(r.err, /\n\s+at /);
});

// A pack whose rule throws on a page that has a <form>.
const pack = definePack({
  name: '@acme/docs-pack',
  version: '1.0.0',
  namespace: 'acme',
  core: '*',
  rules: [
    {
      id: 'acme-title',
      meta: { title: 'The page has a title', tags: ['best-practice'] },
      runInPage(ctx) {
        if (ctx.document.querySelector('form')) throw new Error('forms are not handled');
        return { outcome: ctx.document.title ? 'pass' : 'fail', occurrences: [] };
      }
    }
  ]
});

function folder(examples) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-cli-docs-'));
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'docs', 'RULE_EXAMPLES.md'), examples);
  return root;
}

const example = (label, html) => `**${label}**\n\`\`\`html\n${html}\n\`\`\`\n\n`;

test(
  "docs records a rule that didn't complete with its error",
  { skip: chromium ? false : 'playwright not installed' },
  async () => {
    const root = folder(
      '# Examples\n\n## acme-title\n\n' +
        example('Passed', '<title>T</title><p>x</p>') +
        example('Failed', '<title>T</title><form></form>')
    );
    const { problems } = await packDocs(pack, { root });
    assert.deepEqual(problems, []);
    const record = JSON.parse(
      fs.readFileSync(path.join(root, 'scripts', 'data', 'rule-examples-outcomes.json'), 'utf8')
    );
    assert.deepEqual(
      record.disagreements.map((d) => d.engine),
      ['cantTell (the rule did not complete: forms are not handled)']
    );
  }
);

test(
  "docs runs every example when one can't be run, names it, and writes nothing",
  { skip: chromium ? false : 'playwright not installed' },
  async () => {
    // The second example's page takes the engine away, so it can't run.
    const root = folder(
      '# Examples\n\n## acme-title\n\n' +
        example('Passed', '<title>T</title><p>x</p>') +
        example(
          'Failed',
          '<title>T</title><script>Object.defineProperty(window, "a11ycore", { value: null })</script>'
        ) +
        example('Passed', '<title>Another</title><p>y</p>')
    );
    const { written, problems } = await packDocs(pack, { root });
    assert.deepEqual(written, []);
    assert.match(
      problems[0],
      /^1 example\(s\) in docs\/RULE_EXAMPLES\.md could not be run, so nothing was written:/
    );
    assert.match(problems[1], /acme-title \[Failed\] .*a11ycore/);
    assert.equal(fs.existsSync(path.join(root, 'docs', 'RULE_CATALOG.md')), false);
    assert.equal(fs.existsSync(path.join(root, 'scripts')), false);
  }
);

test(
  'docs suggests --no-examples when Chromium is missing, and writes nothing',
  { skip: chromium ? false : 'playwright not installed' },
  () => {
    const root = folder(
      '# Examples\n\n## sample-title-length\n\n' + example('Passed', '<title>T</title>')
    );
    fs.writeFileSync(
      path.join(root, 'index.js'),
      `module.exports = require(${JSON.stringify(require.resolve('../fixtures/packs/sample.js'))});\n`
    );
    const r = spawnSync(process.execPath, [BIN, 'docs'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: path.join(root, 'no-browsers') }
    });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /needs Playwright's Chromium: .*--no-examples\. Nothing was written\./);
    assert.doesNotMatch(r.stderr, /\n\s+at /);
    assert.equal(fs.existsSync(path.join(root, 'docs', 'RULE_CATALOG.md')), false);
  }
);
