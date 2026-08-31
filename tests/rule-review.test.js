'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { getChecksCatalog } = require('../src/index.js');
const { collect } = require('../scripts/lib/rule-review-data');

const ROOT = path.join(__dirname, '..');
const GENERATOR = path.join(ROOT, 'scripts', 'generate-rule-review.js');

// One collection for the whole file: it replays every fixture through the engine.
const { rules, stats } = collect({ repoRoot: ROOT });
const byId = new Map(rules.map((r) => [r.id, r]));

test('every catalog rule is in the review dataset', () => {
  const catalog = getChecksCatalog()
    .map((r) => r.ruleId)
    .sort();
  assert.deepStrictEqual(
    rules.map((r) => r.id).sort(),
    catalog,
    'a rule is missing from the review page -- check listRuleModules covers where it lives'
  );
});

test('every rule keeps the type the catalog gives it', () => {
  for (const entry of getChecksCatalog()) {
    assert.equal(byId.get(entry.ruleId).type, entry.type, entry.ruleId);
  }
});

test('every rule resolves the test file that exercises it', () => {
  for (const rule of rules) {
    assert.ok(rule.testFile, `${rule.id} resolved no test file`);
    assert.ok(fs.existsSync(path.join(ROOT, rule.testFile)), `${rule.id}: ${rule.testFile}`);
  }
});

test('a resolved fixture path exists on disk', () => {
  for (const rule of rules) {
    if (!rule.fixtureFile) continue;
    assert.ok(fs.existsSync(path.join(ROOT, rule.fixtureFile)), `${rule.id}: ${rule.fixtureFile}`);
  }
});

test('every rule states what it applies to and what it expects', () => {
  for (const rule of rules) {
    assert.ok(
      rule.applicability,
      `${rule.id} has no @applicability -- the header parser may have drifted`
    );
    assert.ok(rule.expectation, `${rule.id} has no @expectation`);
  }
});

test('every rule can emit at least one message', () => {
  for (const rule of rules) {
    const total = ['fail', 'cantTell', 'pass', 'notApplicable'].reduce(
      (n, o) => n + rule.messages[o].length,
      0
    );
    assert.ok(total > 0, `${rule.id} produced no messages -- check the i18n key prefix`);
  }
});

test('a message carrying an uncertainty block is filed as cantTell, never fail', () => {
  for (const rule of rules) {
    for (const message of rule.messages.fail) {
      assert.equal(
        message.uncertaintyCode,
        null,
        `${rule.id}: ${message.key} carries an uncertainty block but is filed under fail`
      );
    }
  }
});

test('a fail-named key on an uncertain occurrence is still filed as cantTell', () => {
  // aria-allowed-role names its key _summary_fail and reports cantTell; the
  // source decides the tier, not the key name.
  const keys = byId.get('aria-allowed-role').messages.cantTell.map((m) => m.key);
  assert.ok(keys.includes('ariaAllowedRole_summary_fail'), keys.join(', '));
  assert.equal(byId.get('aria-allowed-role').messages.fail.length, 0);
});

test('manual rules are capped at cantTell', () => {
  for (const rule of rules.filter((r) => r.type === 'manual')) {
    assert.equal(rule.messages.fail.length, 0, `${rule.id} has a fail message`);
    assert.ok(!rule.outcomes.includes('fail'), `${rule.id} claims a fail outcome`);
  }
});

test('every fixture replays through the engine without error', () => {
  assert.equal(stats.replayErrors, 0);
  assert.ok(stats.replayed > 0);
});

test('a whole-document fixture is settled against the rule-level outcome', () => {
  // page-title-present can only show one outcome per page: the page is the case.
  const rule = byId.get('page-title-present');
  assert.equal(rule.cases.length, 1);

  const [c] = rule.cases;
  assert.equal(c.scope, 'document');
  assert.equal(c.engineOutcome, rule.engineOutcome);
  assert.ok(c.agrees, `marked ${c.outcome}, rule reports ${c.engineOutcome}`);
});

test('document cases cover the rules whose fixture has no case blocks', () => {
  const documentScoped = rules.filter((r) => r.cases.some((c) => c.scope === 'document'));
  assert.ok(documentScoped.length > 0, 'no fixture was read as a whole-document case');
  for (const rule of documentScoped) {
    assert.equal(rule.cases.length, 1, `${rule.id} mixes a document case with element cases`);
  }
});

test('a shared fixture gives each rule its own marker', () => {
  // One contrast case passes AA and fails AAA, which one shared marker cannot say.
  const shared = ['contrast-minimum', 'contrast-enhanced', 'contrast-computable'].map((id) =>
    byId.get(id)
  );
  for (const rule of shared) {
    assert.equal(rule.fixtureFile, 'tests/fixtures/contrast-all-scenarios.html');
    assert.ok(rule.cases.length > 0, `${rule.id} read no cases`);
  }

  const [minimum, enhanced] = shared;
  const pick = (rule) => rule.cases.find((c) => c.id === 'case-pass-aa-fail-aaa');
  assert.equal(pick(minimum).outcome, 'pass');
  assert.equal(pick(enhanced).outcome, 'fail');
});

test('every fixture case is filed under a known outcome', () => {
  const allowed = new Set(['fail', 'cantTell', 'pass', 'notApplicable', 'other']);
  for (const rule of rules) {
    for (const c of rule.cases) {
      assert.ok(allowed.has(c.outcome), `${rule.id} ${c.id}: ${c.outcome}`);
      assert.ok(
        c.engineOutcome === 'notFlagged' || allowed.has(c.engineOutcome),
        `${rule.id} ${c.id}: ${c.engineOutcome}`
      );
    }
  }
});

test('a case the engine flags at the marked tier is not reported as a disagreement', () => {
  for (const rule of rules) {
    for (const c of rule.cases) {
      if (c.outcome === c.engineOutcome) assert.ok(c.agrees, `${rule.id} ${c.id}`);
    }
  }
});

test('the generated page embeds the whole dataset', () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rule-review-')), 'page.html');
  execFileSync(process.execPath, [GENERATOR, '--out', out], { cwd: ROOT, stdio: 'pipe' });

  const html = fs.readFileSync(out, 'utf8');
  assert.match(html, /<title>SureA11y Rule Review<\/title>/);

  const block = /<script type="application\/json" id="data">([\s\S]*?)<\/script>/.exec(html);
  assert.ok(block, 'no embedded data block');

  const embedded = JSON.parse(block[1]);
  assert.equal(embedded.rules.length, rules.length);
  assert.deepStrictEqual(
    embedded.rules.map((r) => r.id),
    rules.map((r) => r.id)
  );
  fs.rmSync(path.dirname(out), { recursive: true, force: true });
});

test('the embedded data carries the fields the page renders', () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rule-review-')), 'page.html');
  execFileSync(process.execPath, [GENERATOR, '--out', out], { cwd: ROOT, stdio: 'pipe' });

  const block = /<script type="application\/json" id="data">([\s\S]*?)<\/script>/.exec(
    fs.readFileSync(out, 'utf8')
  );
  const embedded = JSON.parse(block[1]);

  for (const rule of embedded.rules) {
    for (const field of [
      'id',
      'type',
      'title',
      'applicability',
      'expectation',
      'messages',
      'cases'
    ]) {
      assert.ok(field in rule, `${rule.id} lost ${field}`);
    }
    for (const c of rule.cases) {
      for (const field of ['id', 'label', 'outcome', 'engine', 'hits', 'agrees']) {
        assert.ok(field in c, `${rule.id} case lost ${field}`);
      }
    }
  }

  const flagged = embedded.rules
    .flatMap((r) => r.cases)
    .filter((c) => c.engine && c.engine !== 'notFlagged');
  assert.ok(flagged.length > 0, 'no case carries an engine verdict');
  fs.rmSync(path.dirname(out), { recursive: true, force: true });
});

test('--types narrows the page to one kind of rule', () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rule-review-')), 'page.html');
  execFileSync(process.execPath, [GENERATOR, '--out', out, '--types', 'manual'], {
    cwd: ROOT,
    stdio: 'pipe'
  });

  const block = /<script type="application\/json" id="data">([\s\S]*?)<\/script>/.exec(
    fs.readFileSync(out, 'utf8')
  );
  const embedded = JSON.parse(block[1]);
  assert.ok(embedded.rules.length > 0);
  assert.ok(embedded.rules.every((r) => r.type === 'manual'));
  fs.rmSync(path.dirname(out), { recursive: true, force: true });
});
