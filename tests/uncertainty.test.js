'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  UNCERTAINTY_CODE_VALUES,
  isUncertaintyCode,
  normalizeUncertainty
} = require('../src/core/uncertainty');
const { normalizeRuleResult } = require('../src/core.js').__internal;
const { resolvePolicy } = require('../src/policy/resolvePolicy');
const { POLICY_CONTRACTS } = require('../src/policy/contracts');
const { runa11yCoreOnHtml, createDom } = require('./helpers/runDomRulesOnHtml.js');
const { runa11yCoreInPage, runDomRulesInPage } = require('../src/index.js');
const fs = require('node:fs');
const path = require('node:path');

const AUTOMATIC_DIR = path.join(__dirname, '..', 'src', 'checks', 'automatic');

// Automatic rules that report cantTell without saying why. This must only ever
// go down: it is the remaining migration, not an allowance for new rules.
const RULES_WITHOUT_UNCERTAINTY = 0;

function reportsCantTell(src) {
  return (
    src.includes('cantTellOccurrences') ||
    src.includes("outcome: 'cantTell'") ||
    src.includes("occurrenceOutcome: 'cantTell'")
  );
}

const policy = resolvePolicy(POLICY_CONTRACTS, {});

const def = {
  ruleId: 'uncertainty-fixture',
  type: 'automatic',
  defaultSeverity: 'moderate',
  defaultConfidence: 'high',
  title: 't',
  description: 'd',
  ruleInterfaceVersion: '1',
  ruleVersion: '1',
  normative: true,
  atomic: true
};

function occurrence(extra) {
  return { selector: 'x', summary: 's', hint: 'h', html: '<x>', ...extra };
}

function normalize(raw) {
  return normalizeRuleResult(def, raw, '1.0.0', policy, null);
}

test('every code in the vocabulary is recognised', () => {
  assert.ok(UNCERTAINTY_CODE_VALUES.length > 0);
  for (const code of UNCERTAINTY_CODE_VALUES) {
    assert.strictEqual(isUncertaintyCode(code), true);
  }
  assert.strictEqual(isUncertaintyCode('invented'), false);
});

test('normalizeUncertainty keeps only the documented fields', () => {
  const out = normalizeUncertainty({
    code: 'spec-only',
    needed: '  what settles it  ',
    evidence: { role: 'listbox' },
    extra: 'dropped'
  });
  assert.deepStrictEqual(out, {
    code: 'spec-only',
    needed: 'what settles it',
    evidence: { role: 'listbox' }
  });
});

test('normalizeUncertainty rejects a payload with no usable code', () => {
  assert.strictEqual(normalizeUncertainty(null), null);
  assert.strictEqual(normalizeUncertainty({ code: 'invented' }), null);
  assert.strictEqual(normalizeUncertainty('spec-only'), null);
  assert.strictEqual(normalizeUncertainty([{ code: 'spec-only' }]), null);
});

test('an unusable payload costs the occurrence nothing', () => {
  const result = normalize({
    outcome: 'cantTell',
    occurrences: [occurrence({ uncertainty: { code: 'invented' } })]
  });
  assert.strictEqual(result.occurrences.length, 1);
  assert.strictEqual(result.occurrences[0].uncertainty, undefined);
  assert.strictEqual(result.occurrences[0].summary, 's');
});

test('a fail-tier occurrence does not carry uncertainty', () => {
  const result = normalize({
    outcome: 'fail',
    occurrences: [occurrence({ occurrenceOutcome: 'fail', uncertainty: { code: 'spec-only' } })]
  });
  assert.strictEqual(result.occurrences[0].uncertainty, undefined);
});

test('a cantTell-tier occurrence inside a fail result keeps its uncertainty', () => {
  const result = normalize({
    outcome: 'fail',
    occurrences: [
      occurrence({ occurrenceOutcome: 'fail' }),
      occurrence({ occurrenceOutcome: 'cantTell', uncertainty: { code: 'runtime-dependent' } })
    ]
  });
  assert.strictEqual(result.occurrences[0].uncertainty, undefined);
  assert.deepStrictEqual(result.occurrences[1].uncertainty, { code: 'runtime-dependent' });
});

test('aria-valid-attr-value reports a dangling reference as runtime-dependent', async () => {
  const html = '<main><button aria-controls="popup-1" aria-expanded="true">Open</button></main>';
  const res = await runa11yCoreOnHtml(html, {
    runOnly: { includeTestIds: ['aria-valid-attr-value'] }
  });
  const rule = res.checksResults.find((r) => r.ruleId.includes('aria-valid-attr-value'));

  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences[0].uncertainty.code, 'runtime-dependent');
  assert.strictEqual(rule.occurrences[0].uncertainty.evidence.referencedId, 'popup-1');
});

test('identical-iframes-same-purpose grades unresolved apart from differing', async () => {
  const html =
    '<main><iframe title="Ad" src="https://a.example/one"></iframe>' +
    '<iframe title="Ad" src="https://b.example/two"></iframe></main>';
  const res = await runa11yCoreOnHtml(html, {
    runOnly: { includeTestIds: ['identical-iframes-same-purpose'] }
  });
  const rule = res.checksResults.find((r) => r.ruleId.includes('identical-iframes-same-purpose'));

  assert.strictEqual(rule.outcome, 'cantTell');
  for (const occ of rule.occurrences) {
    assert.strictEqual(occ.uncertainty.code, 'equivalence-unknown');
    assert.ok(occ.uncertainty.evidence.otherResources.length > 0);
  }
});

test('every automatic rule reporting cantTell says why', () => {
  const files = fs
    .readdirSync(AUTOMATIC_DIR)
    .filter((f) => f.endsWith('.js'))
    .map((f) => path.join(AUTOMATIC_DIR, f));

  assert.ok(files.length > 50, 'sanity: the rule files were found');

  const silent = files
    .map((f) => ({ file: path.basename(f), src: fs.readFileSync(f, 'utf8') }))
    .filter(({ src }) => reportsCantTell(src) && !src.includes('uncertainty'))
    .map(({ file }) => file);

  assert.ok(
    silent.length <= RULES_WITHOUT_UNCERTAINTY,
    `rules reporting cantTell with no uncertainty: ${silent.join(', ')}`
  );
});

test('the wcag-version coercion marks its occurrences out-of-scope', async () => {
  const html = '<main><p id="dup">a</p><p id="dup">b</p></main>';
  const res = await runa11yCoreOnHtml(html, { runOnly: { includeTestIds: ['duplicate-id'] } });
  const rule = res.checksResults.find(
    (r) => r.ruleId.includes('duplicate-id') && !r.ruleId.includes('aria')
  );

  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.wcagVersionScope.coercedFrom, 'fail');
  assert.strictEqual(rule.occurrences[0].uncertainty.code, 'out-of-scope');
  assert.deepStrictEqual(rule.occurrences[0].uncertainty.evidence.removedSc, ['4.1.1']);
});

// One fixture per code, so a code cannot quietly stop being reachable from a
// real scan while the vocabulary still lists it.
const CODE_FIXTURES = [
  [
    'not-computable',
    'link-in-text-block',
    '<main><p>Some surrounding sentence text <a href="/x">a link</a> and more words.</p></main>'
  ],
  [
    'runtime-dependent',
    'aria-valid-attr-value',
    '<main><button aria-controls="popup-1" aria-expanded="true">Open</button></main>'
  ],
  ['spec-only', 'aria-valid-attr', '<main><div role="button" aria-notathing="x">x</div></main>'],
  [
    'equivalence-unknown',
    'identical-iframes-same-purpose',
    '<main><iframe title="Ad" src="https://a.example/one"></iframe>' +
      '<iframe title="Ad" src="https://b.example/two"></iframe></main>'
  ],
  [
    'judgement-required',
    'duplicate-id-aria',
    '<main><span id="d">one</span><span id="d">two</span><input aria-labelledby="d"></main>'
  ],
  ['out-of-scope', 'duplicate-id', '<main><p id="dup">a</p><p id="dup">b</p></main>']
];

for (const [code, ruleId, html] of CODE_FIXTURES) {
  test(`${code} is reachable from a real scan, via ${ruleId}`, async () => {
    const res = await runa11yCoreOnHtml(html, { runOnly: { includeTestIds: [ruleId] } });
    const rule = res.checksResults.find((r) => r.ruleId === ruleId);

    assert.strictEqual(rule.outcome, 'cantTell');
    assert.ok(rule.occurrences.length > 0, 'the fixture produced no occurrences');
    for (const occ of rule.occurrences) {
      assert.strictEqual(occ.uncertainty.code, code);
      assert.ok(occ.uncertainty.needed.length > 0, 'needed must say what would settle it');
    }
  });
}

test('every code in the vocabulary has a fixture', () => {
  assert.deepStrictEqual(
    CODE_FIXTURES.map(([code]) => code).sort(),
    [...UNCERTAINTY_CODE_VALUES].sort()
  );
});

test('a manual rule reports cantTell without an uncertainty payload', async () => {
  const res = await runa11yCoreOnHtml('<main><p>Text on a page.</p></main>', {});
  const manual = res.checksResults.filter(
    (r) => r.type === 'manual' && r.outcome === 'cantTell' && r.occurrences.length
  );

  assert.ok(manual.length > 0, 'sanity: the scan produced manual findings');
  for (const rule of manual) {
    for (const occ of rule.occurrences) {
      assert.strictEqual(occ.uncertainty, undefined, `${rule.ruleId} carried an uncertainty`);
    }
  }
});

// The engine ships the rule logic twice, and the shared parity helper compares
// only outcome and occurrence counts, so the payload itself needs its own check.
test('both engine entry points report the same uncertainty', () => {
  const html = '<main><button aria-controls="popup-1" aria-expanded="true">Open</button></main>';
  const runOnly = { includeTestIds: ['aria-valid-attr-value'] };

  const dom = createDom(html);
  const url = dom.window.document.documentElement.baseURI;

  const payloads = [runa11yCoreInPage, runDomRulesInPage].map((run) => {
    const result = run(url, null, {}, runOnly);
    const rule = result.checksResults.find((r) => r.ruleId === 'aria-valid-attr-value');
    return rule.occurrences.map((o) => o.uncertainty);
  });

  assert.ok(payloads[0].length > 0, 'the fixture produced no occurrences');
  assert.strictEqual(payloads[0][0].code, 'runtime-dependent');
  assert.deepStrictEqual(payloads[0], payloads[1]);
});
