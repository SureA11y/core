'use strict';

/**
 * Code written against the 1.17 types still compiles: options typed
 * `EngineOptions | StrictEngineOptions` are taken by every scan, catalog
 * and testing function, and each returns the type it returned in 1.17.
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
  'options typed EngineOptions | StrictEngineOptions compile, as in 1.17',
  { skip: !ts && 'typescript not installed' },
  () => {
    const errors = compile(`
    import { runDomRulesInPage, runa11yCoreInPage, runa11yCoreAcrossFrames, getChecksCatalog, getRulesCatalog, getCheckDefById, getCompositeRuleById, getChecksForRunOnly, getRulesForRunOnly } from ${at('index')};
    import type { EngineOptions, StrictEngineOptions, ScanResult, CrossFrameResult } from ${at('index')};
    import { runa11yCoreOnHtml, runa11yCoreOnDom, createDom } from ${at('testing')};
    import type { ScanOptions } from ${at('testing')};
    import browser = require(${BROWSER});
    declare const maybe: EngineOptions | null;
    declare const either: EngineOptions | StrictEngineOptions | null;
    declare const both: EngineOptions | StrictEngineOptions;
    declare const strict: StrictEngineOptions;
    declare const loose: Record<string, unknown>;
    const a: ScanResult = runDomRulesInPage('u', null, maybe, null);
    const b: ScanResult = runDomRulesInPage('u', null, either, null);
    const c: ScanResult = runa11yCoreInPage('u', null, either, null);
    const d: Promise<CrossFrameResult> = runa11yCoreAcrossFrames('u', null, either, null);
    const e: ScanResult = runDomRulesInPage('u', null, loose as EngineOptions, null);
    const f: ScanResult = runDomRulesInPage('u', null, strict, null);
    getChecksCatalog(either);
    getRulesCatalog(either);
    getCheckDefById('img-alt-present', either);
    getCompositeRuleById('wcag-1.1.1', either);
    getChecksForRunOnly(null, either);
    getRulesForRunOnly(null, either);
    getRulesCatalog();
    getRulesCatalog(null);
    const g: ScanResult = runa11yCoreOnHtml('<p>', { engineOptions: both });
    const h: ScanResult = runa11yCoreOnDom(createDom('<p>'), { engineOptions: both });
    const options: ScanOptions = { engineOptions: both };
    const i: Promise<ScanResult> = browser.run(both);
    const j: Promise<ScanResult> = browser.runa11yCoreInPageAsync('u', null, either, null);
    void [a, b, c, d, e, f, g, h, i, j, options];
  `);
    assert.deepEqual(errors, []);
  }
);

test(
  'a scan returns a ScanResult, as in 1.17, whatever its options',
  { skip: !ts && 'typescript not installed' },
  () => {
    const errors = compile(`
    import { runDomRulesInPage, runa11yCoreInPage } from ${at('index')};
    import type { EngineOptions, ScanResult } from ${at('index')};
    import { runa11yCoreOnHtml } from ${at('testing')};
    import browser = require(${BROWSER});
    const a: ScanResult = runDomRulesInPage('u', null, { output: { detail: 'findings' } }, null);
    const b: ScanResult = runa11yCoreInPage('u', null, { locale: 'de', output: { detail: 'full' } }, null);
    const c: ScanResult = runa11yCoreOnHtml('<p>', { engineOptions: { output: { detail: 'findings' } } });
    const d: Promise<ScanResult> = browser.run({ output: { detail: 'findings' } });
    const opts = { strictOptions: true, locale: 'de' } as const;
    const e: ScanResult = runDomRulesInPage('u', null, opts, null);
    type P = Parameters<typeof runDomRulesInPage>;
    const p: P = ['u', null, {}, null];
    type R = ReturnType<typeof runa11yCoreInPage>;
    const r: R = a;
    const fn: (u: string, s: null, o: EngineOptions | null, ro: null) => ScanResult = runDomRulesInPage;
    declare function evaluate<A extends unknown[], T>(f: (...args: A) => T, ...args: A): Promise<T>;
    const q: Promise<ScanResult> = evaluate(runa11yCoreInPage, 'u', null, {}, null);
    void [b, c, d, e, p, r, fn, q];
  `);
    assert.deepEqual(errors, []);
  }
);
