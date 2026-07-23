'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { explain } = require('../../src/explain');
const { makeOccurrence, makeCheckResult, makeScanResult } = require('./fake-result');

test('explain: throws synchronously if options.provider is missing or not a function', async () => {
  const result = makeScanResult([makeCheckResult({})]);
  await assert.rejects(() => explain(result, {}), TypeError);
  await assert.rejects(() => explain(result, { provider: 'not a function' }), TypeError);
});

test('explain: throws synchronously on a malformed result (not a finished scan result)', async () => {
  await assert.rejects(() => explain({ notAScanResult: true }, { provider: async () => [] }), TypeError);
});

test('explain: happy path -- array-of-{groupKey,text} provider output attaches explanation to every occurrence in the group', async () => {
  const check = makeCheckResult({
    occurrences: [
      makeOccurrence({ selector: 'main > ul > li:nth-child(1) > img' }),
      makeOccurrence({ selector: 'main > ul > li:nth-child(2) > img' })
    ]
  });
  const result = makeScanResult([check]);

  const provider = async (groups) => groups.map((g) => ({ groupKey: g.groupKey, text: 'Because AT users need this.' }));
  const augmented = await explain(result, { provider });

  const occs = augmented.checksResults[0].occurrences;
  assert.strictEqual(occs.length, 2);
  for (const occ of occs) {
    assert.deepStrictEqual(occ.explanation, {
      present: true,
      text: 'Because AT users need this.',
      provider: 'unknown',
      generatedAt: occ.explanation.generatedAt,
      groupKey: occ.explanation.groupKey,
      advisory: true
    });
    assert.match(occ.explanation.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  }
});

test('explain: object-map provider output ({ [groupKey]: text }) works identically to the array shape', async () => {
  const result = makeScanResult([makeCheckResult({})]);
  const provider = async (groups) => ({ [groups[0].groupKey]: 'A plain-string explanation.' });

  const augmented = await explain(result, { provider });
  assert.strictEqual(augmented.checksResults[0].occurrences[0].explanation.text, 'A plain-string explanation.');
});

test('explain: a per-entry provider tag wins over options.providerName, which wins over the "unknown" default', async () => {
  const result = makeScanResult([makeCheckResult({})]);

  const withEntryTag = await explain(result, {
    provider: async (groups) => groups.map((g) => ({ groupKey: g.groupKey, text: 'x', provider: 'claude-sonnet-5' })),
    providerName: 'should-be-overridden'
  });
  assert.strictEqual(withEntryTag.checksResults[0].occurrences[0].explanation.provider, 'claude-sonnet-5');

  const withCallLevelName = await explain(result, {
    provider: async (groups) => groups.map((g) => ({ groupKey: g.groupKey, text: 'x' })),
    providerName: 'my-gemini-adapter'
  });
  assert.strictEqual(withCallLevelName.checksResults[0].occurrences[0].explanation.provider, 'my-gemini-adapter');
});

test('explain: budget caps the number of groups sent to the provider; ungrouped occurrences get no explanation', async () => {
  const checks = [
    makeCheckResult({ ruleId: 'rule-a', occurrences: [makeOccurrence({ selector: 'a' })] }),
    makeCheckResult({ ruleId: 'rule-b', occurrences: [makeOccurrence({ selector: 'b' })] }),
    makeCheckResult({ ruleId: 'rule-c', occurrences: [makeOccurrence({ selector: 'c' })] })
  ];
  const result = makeScanResult(checks);

  let receivedCount = 0;
  const provider = async (groups) => {
    receivedCount = groups.length;
    return groups.map((g) => ({ groupKey: g.groupKey, text: 'x' }));
  };

  const augmented = await explain(result, { provider, budget: 2 });

  assert.strictEqual(receivedCount, 2, 'provider only ever sees the budgeted subset');
  const explained = augmented.checksResults.filter((c) => c.occurrences[0].explanation).length;
  const unexplained = augmented.checksResults.filter((c) => !c.occurrences[0].explanation).length;
  assert.strictEqual(explained, 2);
  assert.strictEqual(unexplained, 1);
});

test('explain: redactHtml propagates into what the provider receives (no html, selector still present)', async () => {
  const result = makeScanResult([makeCheckResult({})]);
  let seenInput;
  const provider = async (groups) => {
    seenInput = groups[0];
    return [];
  };

  await explain(result, { provider, redactHtml: true });
  assert.strictEqual(seenInput.html, undefined);
  assert.ok(seenInput.selector);
});

test('explain: no fail/cantTell occurrences at all -- provider is never called, result comes back as an (unchanged) clone', async () => {
  const check = makeCheckResult({ outcome: 'pass', occurrences: [] });
  const result = makeScanResult([check]);

  let called = false;
  const provider = async () => {
    called = true;
    return [];
  };

  const augmented = await explain(result, { provider });
  assert.strictEqual(called, false);
  assert.deepStrictEqual(augmented, result);
  assert.notStrictEqual(augmented, result, 'still a copy, not the same reference, even when nothing changed');
});

test('explain: a throwing provider degrades invisibly -- no throw, no explanation attached, rest of result intact', async () => {
  const result = makeScanResult([makeCheckResult({})]);
  const provider = async () => {
    throw new Error('network timeout');
  };

  const augmented = await explain(result, { provider });
  assert.strictEqual(augmented.checksResults[0].occurrences[0].explanation, undefined);
  assert.strictEqual(augmented.checksResults[0].ruleId, result.checksResults[0].ruleId);
});

test('explain: a malformed provider response (wrong shape entirely) degrades the same way as a throw', async () => {
  const result = makeScanResult([makeCheckResult({})]);
  const provider = async () => 'just a plain string, not the documented shape';

  const augmented = await explain(result, { provider });
  assert.strictEqual(augmented.checksResults[0].occurrences[0].explanation, undefined);
});

test('explain: a partial provider response only explains the groups it actually covered, never fabricates the rest', async () => {
  const checks = [
    makeCheckResult({ ruleId: 'rule-a', occurrences: [makeOccurrence({ selector: 'a' })] }),
    makeCheckResult({ ruleId: 'rule-b', occurrences: [makeOccurrence({ selector: 'b' })] })
  ];
  const result = makeScanResult(checks);

  const provider = async (groups) => [{ groupKey: groups[0].groupKey, text: 'explained' }];
  const augmented = await explain(result, { provider });

  assert.ok(augmented.checksResults[0].occurrences[0].explanation);
  assert.strictEqual(augmented.checksResults[1].occurrences[0].explanation, undefined);
});

test('explain: never mutates the input result -- the original is untouched, only the returned copy gains explanations', async () => {
  const result = makeScanResult([makeCheckResult({})]);
  const before = JSON.stringify(result);

  const provider = async (groups) => groups.map((g) => ({ groupKey: g.groupKey, text: 'x' }));
  const augmented = await explain(result, { provider });

  assert.strictEqual(JSON.stringify(result), before, 'input result is byte-for-byte unchanged');
  assert.ok(augmented.checksResults[0].occurrences[0].explanation, 'the returned copy did get the explanation');
});

test('explain: is safe against engineOptions.customRules holding a live function reference (structuredClone would throw on this)', async () => {
  const check = makeCheckResult({
    engineOptions: { customRules: [{ id: 'x', runInPage() { return { outcome: 'pass', occurrences: [] }; } }] }
  });
  const result = makeScanResult([check]);

  const provider = async (groups) => groups.map((g) => ({ groupKey: g.groupKey, text: 'x' }));
  const augmented = await explain(result, { provider });

  assert.ok(augmented.checksResults[0].occurrences[0].explanation);
  assert.strictEqual(typeof augmented.checksResults[0].engineOptions.customRules[0].runInPage, 'function');
});

test('explain: calls the provider exactly once per invocation, batched, regardless of group count (§5 "batch, don\'t loop")', async () => {
  const checks = Array.from({ length: 5 }, (_, i) =>
    makeCheckResult({ ruleId: `rule-${i}`, occurrences: [makeOccurrence({ selector: `sel-${i}` })] })
  );
  const result = makeScanResult(checks);

  let callCount = 0;
  const provider = async (groups) => {
    callCount += 1;
    return groups.map((g) => ({ groupKey: g.groupKey, text: 'x' }));
  };

  await explain(result, { provider });
  assert.strictEqual(callCount, 1);
});
