'use strict';

/**
 * The types of the scan options that cut a result short or keep it small
 * (timeBudgetMs), and of the result fields that say so.
 * Skipped when TypeScript is not installed.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let ts;
try {
  ts = require('typescript');
} catch {
  ts = null;
}

const SRC = path.join(__dirname, '../../src');
const at = (name) => JSON.stringify(path.join(SRC, name));

function compile(source) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'surea11y-types-'));
  const file = path.join(dir, 'check.ts');
  fs.writeFileSync(file, source);
  try {
    const program = ts.createProgram([file], {
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      types: []
    });
    return ts
      .getPreEmitDiagnostics(program)
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n').slice(0, 400));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test(
  'timeBudgetMs is a number, and a result cut short says so (engine.incomplete, notRun)',
  { skip: !ts && 'typescript not installed' },
  () => {
    const errors = compile(`
    import { runDomRulesInPage } from ${at('index')};
    import type { ScanResult, ScanIncomplete, RuleNotRun, StrictEngineOptions } from ${at('index')};
    import { matchBaseline } from ${at('baseline')};
    const options: StrictEngineOptions = { strictOptions: true, timeBudgetMs: 2000 };
    // @ts-expect-error a time budget is a number of milliseconds
    const wrong: StrictEngineOptions = { strictOptions: true, timeBudgetMs: '2000' };
    const result: ScanResult = runDomRulesInPage('u', null, options, null);
    const incomplete: ScanIncomplete | undefined = result.engine.incomplete;
    const budget: number | undefined = incomplete && incomplete.timeBudgetMs;
    const count: number | undefined = incomplete && incomplete.rulesNotRun;
    const notRun: RuleNotRun[] = result.notRun || [];
    const ids: string[] = notRun.map((n) => n.ruleId + n.reason + (n.profile || ''));
    const reason: string | undefined = result.engine.profilesNotRun && result.engine.profilesNotRun[0].reason;
    const unchecked: string[] | undefined = matchBaseline(result, []).incomplete?.notRun;
    const missing = result.rulesResults[0].data.details.contributors[0].notRun;
    void [wrong, budget, count, ids, reason, unchecked, missing];
  `);
    assert.deepEqual(errors, []);
  }
);
