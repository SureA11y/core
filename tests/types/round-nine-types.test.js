'use strict';

/**
 * The types as round 9 of the stress test called the functions: a compact
 * scan's result passed to everything the docs say reads it, and the scan
 * functions typed by the options they are given.
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
const BROWSER = JSON.stringify(path.join(__dirname, '../../surea11y.browser'));

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
  'a compact result is read by the reporters and the baseline, and a compact scan returns one (round 9, A9-2)',
  { skip: !ts && 'typescript not installed' },
  () => {
    const errors = compile(`
    import type { ScanResult, CompactScanResult } from ${at('index')};
    import { runDomRulesInPage, runa11yCoreInPage, addHowToCheck, leaningFailures, flattenCrossFrameResult, getMargins } from ${at('index')};
    import { renderSarifReport } from ${at('sarif')};
    import { renderJunitReport } from ${at('junit')};
    import { renderHtmlReport } from ${at('report')};
    import { renderEarlReport } from ${at('earl')};
    import { matchBaseline, buildBaselineEntries, migrateBaselineEntries } from ${at('baseline')};
    import { applyHowToCheck } from ${at('how-to-check-core')};
    import { runa11yCoreOnHtml, assertRule } from ${at('testing')};
    import browser = require(${BROWSER});
    declare const compact: CompactScanResult;
    renderSarifReport(compact);
    renderJunitReport(compact);
    renderHtmlReport(compact);
    renderEarlReport(compact);
    renderEarlReport([compact, compact]);
    matchBaseline(compact, null);
    const entries = buildBaselineEntries(compact);
    migrateBaselineEntries({ entries }, compact);
    const steps: CompactScanResult = addHowToCheck(compact);
    applyHowToCheck(compact, { en: {} });
    leaningFailures(compact);
    flattenCrossFrameResult(compact);
    getMargins(compact);
    browser.table(compact);
    assertRule(compact, 'img-alt-present', 'pass');

    const a: CompactScanResult = runDomRulesInPage('u', null, { output: { detail: 'findings' } });
    const b: CompactScanResult = runa11yCoreInPage(null, null, { output: { detail: 'findings' } }, null);
    const c: CompactScanResult = runa11yCoreOnHtml('<p>', { engineOptions: { output: { detail: 'findings' } } });
    const d: Promise<CompactScanResult> = browser.run({ output: { detail: 'findings' } });
    // A compact check result lists no occurrences, so they must be asked for.
    // @ts-expect-error a compact check result has no occurrences
    const n: number = a.checksResults[0].occurrences.length;
    // @ts-expect-error a compact scan's result is not typed as a full one
    const full: ScanResult = runDomRulesInPage('u', null, { output: { detail: 'findings' } });
    // Any other scan is a full result, as before.
    const e: ScanResult = runDomRulesInPage('u', null, { output: { detail: 'full' } });
    const f: ScanResult = runDomRulesInPage();
    const g: ScanResult = runa11yCoreOnHtml('<p>');
    const h: Promise<ScanResult> = browser.runa11yCoreInPageAsync(null, null, { locale: 'de' });
    void [steps, a, b, c, d, n, full, e, f, g, h];
  `);
    assert.deepEqual(errors, []);
  }
);
