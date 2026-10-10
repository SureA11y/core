'use strict';

/**
 * src/index.d.ts against what the engine really returns. Real scan results
 * are written into a TypeScript file as typed object literals and compiled
 * strictly. An object literal may not carry a field its type does not
 * declare, so this fails both when the engine reports a field the types do
 * not know and when the types require one the engine no longer reports.
 *
 * The scans are chosen to bring out the optional fields: a profile with
 * mappings, a timestamp, perfStats, a rule whose outcome the WCAG version
 * changed, and, in Chromium, a page with layout and measured findings.
 * Skipped when TypeScript is not installed; the Chromium part is skipped
 * without Playwright's Chromium.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml');
const core = require('../../src/index.js');

let ts;
try {
  ts = require('typescript');
} catch {
  ts = null;
}

let chromium;
try {
  ({ chromium } = require('playwright'));
  if (!fs.existsSync(chromium.executablePath())) chromium = null;
} catch {
  chromium = null;
}

const TYPES = path.join(__dirname, '../../src/index');
const BUNDLE = path.join(__dirname, '../../surea11y.browser.js');

function compile(source) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'surea11y-types-'));
  const file = path.join(dir, 'check.ts');
  fs.writeFileSync(file, source);
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
}

async function browserResults() {
  if (!chromium) return [];
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>t</title><style>body{margin:0;font:16px sans-serif}</style></head><body>
        <div id="clip" style="white-space:nowrap;overflow:hidden">Opening hours today</div>
        <button style="position:absolute;top:100px;left:10px;width:10px;height:10px;padding:0">A</button>
        <button style="position:absolute;top:100px;left:25px;width:10px;height:10px;padding:0">B</button>
        <a href="#gone">Skip to main content</a><main>x</main>
      </body></html>`
    );
    await page.evaluate(() => {
      const el = document.getElementById('clip');
      const probe = document.createElement('span');
      probe.textContent = el.textContent;
      probe.style.whiteSpace = 'nowrap';
      document.body.append(probe);
      el.style.width = probe.getBoundingClientRect().width + 2 + 'px';
      probe.remove();
    });
    await page.addScriptTag({ path: BUNDLE });
    return [
      await page.evaluate(() =>
        window.a11ycore.runa11yCoreInPage(null, null, { profile: 'wcag22-aa' }, null)
      )
    ];
  } finally {
    await browser.close();
  }
}

test(
  'the types describe real scan results',
  { skip: !ts && 'typescript not installed' },
  async () => {
    const results = [
      runa11yCoreOnHtml(
        '<!doctype html><html><body><img src="a.png"><button></button><p id="d"></p><p id="d"></p></body></html>',
        {
          engineOptions: {
            profile: 'en301549-v4.1.1',
            mappings: 'en301549',
            timestamp: '2026-10-03T00:00:00Z',
            perfStats: true
          }
        }
      ),
      // duplicate-id under the default 2.2 target: wcagVersionScope.
      runa11yCoreOnHtml('<!doctype html><html><body><p id="a"></p><p id="a"></p></body></html>'),
      runa11yCoreOnHtml('<!doctype html><html lang="en"><body><h1>Fine</h1></body></html>', {
        contextSelector: ['main', 'body'],
        engineOptions: { optInRules: 'all' }
      }),
      // A margin, from a rule that declares one.
      runa11yCoreOnHtml('<!doctype html><html><body><p id="a">x</p></body></html>', {
        runOnly: { includeRuleIds: ['typed-margin'] },
        engineOptions: {
          customRules: [
            {
              id: 'typed-margin',
              meta: { title: 't', margin: { measure: 'overflow-px', unit: 'px', limit: 'max' } },
              runInPage:
                "(ctx) => ({ outcome: 'pass', occurrences: [], marginCandidates: [{ el: ctx.document.getElementById('a'), value: 1.25, threshold: 7.5, context: { axis: 'x' } }] })"
            }
          ]
        }
      }),
      // A scope that matched nothing.
      runa11yCoreOnHtml('<!doctype html><html><body><p>x</p></body></html>', {
        contextSelector: '#missing'
      }),
      ...(await browserResults())
    ];
    const fields = new Set();
    for (const r of results)
      for (const c of r.checksResults)
        for (const o of c.occurrences) for (const k of Object.keys(o)) fields.add(k);
    assert.ok(fields.has('uncertainty'), 'the scans include a cantTell occurrence');
    assert.ok(
      results.some((r) => r.checksResults.some((c) => c.margin)),
      'the scans include a margin'
    );

    const errors = compile(
      `import type { ScanResult, CheckCatalogEntry, RuleCatalogEntry } from ${JSON.stringify(TYPES)};\n` +
        `export const results: ScanResult[] = ${JSON.stringify(results)};\n` +
        `export const checks: CheckCatalogEntry[] = ${JSON.stringify(core.getChecksCatalog())};\n` +
        `export const rules: RuleCatalogEntry[] = ${JSON.stringify(core.getRulesCatalog())};\n`
    );
    assert.deepEqual(errors, []);
  }
);

// What real results held that the types didn't describe (#37): a compact
// scan, a custom rule's meta.wcagSc mapping, and details: null.
test(
  'the types describe compact results, custom mappings and null details',
  { skip: !ts && 'typescript not installed' },
  () => {
    const page =
      '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png" alt="A dog runs along the beach"></main></body></html>';
    const compact = runa11yCoreOnHtml(page, {
      engineOptions: { output: { detail: 'findings' } }
    });
    const full = runa11yCoreOnHtml(page, {
      engineOptions: {
        customRules: [
          {
            id: 'typed-wcag',
            meta: { title: 't', wcagSc: ['1.1.1', '4.1.1'] },
            runInPage: "() => ({ outcome: 'pass', occurrences: [] })"
          }
        ]
      }
    });
    const custom = full.checksResults.find((c) => c.ruleId === 'typed-wcag');
    assert.deepEqual(
      custom.meta.normativeMappings.map((m) => [m.version, m.requirement, m.title]),
      [
        ['2.2', '1.1.1', 'Non-text Content'],
        ['2.1', '4.1.1', 'Parsing']
      ]
    );
    assert.ok(
      full.checksResults.some((c) => c.occurrences.some((o) => o.data && o.data.details === null)),
      'a result has details: null'
    );
    const errors = compile(
      `import type { ScanResult, CompactScanResult } from ${JSON.stringify(TYPES)};\n` +
        `export const compact: CompactScanResult = ${JSON.stringify(compact)};\n` +
        `export const full: ScanResult = ${JSON.stringify(full)};\n` +
        `import { getCheckDefById, getCompositeRuleById, getChecksForRunOnly } from ${JSON.stringify(TYPES)};\n` +
        `import type { CheckCatalogEntry, RuleCatalogEntry } from ${JSON.stringify(TYPES)};\n` +
        `export const one: CheckCatalogEntry | null = ${JSON.stringify(core.getCheckDefById('img-alt-present'))};\n` +
        `export const rollup: RuleCatalogEntry | null = ${JSON.stringify(core.getCompositeRuleById(core.getRulesCatalog()[0].ruleId))};\n` +
        `export const selected: CheckCatalogEntry[] = ${JSON.stringify(core.getChecksForRunOnly(['img-alt-present']))};\n` +
        `export const a: CheckCatalogEntry | null = getCheckDefById('x', { locale: 'fr' });\n` +
        `export const b: RuleCatalogEntry | null = getCompositeRuleById('x');\n` +
        `export const c: CheckCatalogEntry[] = getChecksForRunOnly({ tags: ['wcag2a'] });\n`
    );
    assert.deepEqual(errors, []);
  }
);

test(
  'the scan functions are typed as they are called',
  { skip: !ts && 'typescript not installed' },
  () => {
    const errors = compile(`
    import { runDomRulesInPage, runa11yCoreInPage, runa11yCoreAcrossFrames, a11yCoreEnableFrameResponder, getChecksCatalog, waitForPageReady, getMargins } from ${JSON.stringify(TYPES)};
    import type { ScanResult, CrossFrameResult, FrameEntry, PageReadyResult } from ${JSON.stringify(TYPES)};
    const a: ScanResult = runDomRulesInPage('https://example.test/', null, { profile: 'wcag22-aa' }, null);
    const b: ScanResult = runa11yCoreInPage(null, ['main', 'nav'], { rules: { include: 'img-alt-present', 'region': { excludeSelectors: ['.ad'] } } }, { includeRuleIds: ['img-alt-present'], includeMode: 'or' });
    runDomRulesInPage();
    runa11yCoreInPage(null, null, null, { type: 'tag', values: ['wcag2a'] });
    const p: Promise<CrossFrameResult> = runa11yCoreAcrossFrames(null, null, { frameWaitTime: 1000 }, null);
    const off: () => void = a11yCoreEnableFrameResponder();
    const width: number | undefined = a.engine.environment.viewport?.width;
    const reached = (f: FrameEntry) => ('topFrame' in f ? f.topFrame.checksResults.length : f.error.length);
    const code: string | undefined = b.checksResults[0]?.occurrences[0]?.uncertainty?.code;
    const tags: string[] = getChecksCatalog({ optInRules: 'all' })[0].tags;
    const unmatched: string[] = a.contextMatch ? a.contextMatch.unmatchedSelectors : [];
    const headroom: number | undefined = a.checksResults[0]?.margin?.headroom;
    const closest: string[] = getMargins(a).map((m) => m.ruleId + m.unit + m.limit);
    const declared: string | undefined = getChecksCatalog()[0].margin?.measure;
    const scanned: number | undefined = a.contextMatch?.elementCount;
    runDomRulesInPage(null, null, {}, ['img-alt-present']);
    const ready: Promise<PageReadyResult> = waitForPageReady({ timeoutMs: 3000, quietMs: 500 });
    void waitForPageReady();
    void ready.then((r) => r.ready && r.pending.images === 0 && r.pending.domChanging !== true);
    // @ts-expect-error timeoutMs is a number
    void waitForPageReady({ timeoutMs: '3000' });
    // @ts-expect-error a runOnly is not a number
    runDomRulesInPage(null, null, {}, 42);
    // @ts-expect-error outcomes are a closed set
    const o: typeof a.checksResults[number]['outcome'] = 'warning';
    void [b, p, off, width, reached, code, tags, unmatched, scanned, headroom, closest, declared, o];
  `);
    assert.deepEqual(errors, []);
  }
);

// The types for writing a rule were behind the docs: meta was required
// though every field has a default, ctx was unknown, and the legacy runOnly
// form took only type 'tag' and a list.
test(
  'a custom rule, its ctx and the legacy runOnly form are typed as documented',
  { skip: !ts && 'typescript not installed' },
  () => {
    const errors = compile(`
    import { runDomRulesInPage } from ${JSON.stringify(TYPES)};
    import type { CustomRule, RuleContext } from ${JSON.stringify(TYPES)};
    const bare: CustomRule = { id: 'acme-bare', runInPage: () => ({ outcome: 'pass' }) };
    const full: CustomRule = {
      id: 'acme-x',
      meta: { title: 'X', tags: 'acme, other', defaultSeverity: 'Serious', margin: { measure: 'overflow-px', unit: 'px', limit: 'max' } },
      runInPage(ctx: RuleContext) {
        const dom = ctx.helpers.dom;
        const els: unknown[] = ctx.helpers.queryAllSmart('[onclick]');
        const html: string = dom.outerHTML(els[0]);
        const title: string = dom.get(ctx.document, 'title');
        const ratio: number = ctx.helpers.contrast.contrastRatio([0, 0, 0], [255, 255, 255]);
        const key: string | undefined = ctx.standard?.key;
        return { ruleId: ctx.rule.ruleId, outcome: 'pass', html, title, ratio, key, probes: ctx.inputs.probes };
      },
      applicability: (ctx) => ctx.contextSelector === null
    };
    runDomRulesInPage(null, null, { customRules: [bare, full] }, { type: 'rules', values: 'acme-x, acme-bare', excludeTags: ['other'] });
    runDomRulesInPage(null, null, null, { type: 'tags', values: new Set(['wcag2a']) });
    const typo: CustomRule = {
      id: 'acme-typo',
      // @ts-expect-error a helper docs/RULE_HELPERS.md does not document
      runInPage: (ctx: RuleContext) => ctx.helpers.queryAllSmrt('a')
    };
    // @ts-expect-error a legacy type the engine does not take
    runDomRulesInPage(null, null, null, { type: 'test', values: ['x'] });
    void typo;
  `);
    assert.deepEqual(errors, []);
  }
);

// StrictEngineOptions has only the engine's own options (#162): a misspelt
// one doesn't compile, while EngineOptions still takes any key.
test(
  'StrictEngineOptions rejects an option the engine does not read',
  { skip: !ts && 'typescript not installed' },
  () => {
    const errors = compile(`
    import { runDomRulesInPage } from ${JSON.stringify(TYPES)};
    import type { EngineOptions, StrictEngineOptions, EngineErrorCode } from ${JSON.stringify(TYPES)};
    const strict: StrictEngineOptions = { strictOptions: true, locale: 'de', output: { includeHtml: false } };
    const lenient: EngineOptions = { lcoale: 'de', acmeSetting: 1 };
    runDomRulesInPage(null, null, strict, null);
    runDomRulesInPage(null, null, lenient, null);
    // @ts-expect-error a misspelt option
    const typo: StrictEngineOptions = { strictOptions: true, lcoale: 'de' };
    const code: EngineErrorCode = 'INVALID_ENGINE_OPTIONS';
    void [typo, code];
  `);
    assert.deepEqual(errors, []);
  }
);

// RuleHelpers lists the helpers docs/RULE_HELPERS.md documents, and only
// those, so a new documented helper has a type and an undocumented one none.
test('RuleHelpers lists exactly the documented helpers', () => {
  const { documentedHelpers } = require('../../scripts/lib/profile-contract');
  const source = fs.readFileSync(`${TYPES}.d.ts`, 'utf8');
  const start = source.indexOf('export interface RuleHelpers {');
  const body = source.slice(start, source.indexOf('\n}', start));
  const typed = [...body.matchAll(/^ {2}(\w+): RuleHelper;$/gm)].map((m) => m[1]);
  assert.deepEqual(typed.sort(), [...documentedHelpers().flat].sort());
});

test(
  'a TypeScript project finds the types through the package name',
  { skip: !ts && 'typescript not installed' },
  () => {
    // A project with @surea11y/core in its node_modules, as an install makes it.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'surea11y-types-consumer-'));
    fs.mkdirSync(path.join(dir, 'node_modules', '@surea11y'), { recursive: true });
    fs.symlinkSync(
      path.join(__dirname, '../..'),
      path.join(dir, 'node_modules', '@surea11y', 'core'),
      'dir'
    );
    const file = path.join(dir, 'use.ts');
    fs.writeFileSync(
      file,
      "import { runDomRulesInPage } from '@surea11y/core';\n" +
        "const fonts: 'loaded' | 'loading' | undefined = runDomRulesInPage().engine.environment.fonts;\n" +
        'void fonts;\n'
    );
    for (const [moduleResolution, module] of [
      [ts.ModuleResolutionKind.Node10, ts.ModuleKind.CommonJS],
      [ts.ModuleResolutionKind.Node16, ts.ModuleKind.Node16],
      [ts.ModuleResolutionKind.Bundler, ts.ModuleKind.ESNext]
    ]) {
      const program = ts.createProgram([file], {
        strict: true,
        noEmit: true,
        moduleResolution,
        module,
        types: []
      });
      const errors = ts
        .getPreEmitDiagnostics(program)
        .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
      assert.deepEqual(errors, [], ts.ModuleResolutionKind[moduleResolution]);
    }
  }
);

// Types for every subpath (#143): only the package root had any, so
// `@surea11y/core/sarif` and the rest were untyped imports. The pack's
// subpaths have theirs from the start.
test(
  'a TypeScript project finds the types of every subpath through the package name',
  { skip: !ts && 'typescript not installed' },
  () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'surea11y-types-subpaths-'));
    fs.mkdirSync(path.join(dir, 'node_modules', '@surea11y'), { recursive: true });
    fs.symlinkSync(
      path.join(__dirname, '../..'),
      path.join(dir, 'node_modules', '@surea11y', 'core'),
      'dir'
    );
    const file = path.join(dir, 'use.ts');
    fs.writeFileSync(
      file,
      [
        "import { runDomRulesInPage, runa11yCoreAcrossFrames, flattenCrossFrameResult } from '@surea11y/core';",
        "import { renderSarifReport } from '@surea11y/core/sarif';",
        "import { renderJunitReport } from '@surea11y/core/junit';",
        "import { renderHtmlReport } from '@surea11y/core/report';",
        "import { renderEarlReport, OUTCOME_TO_EARL } from '@surea11y/core/earl';",
        "import { buildBaselineEntries, matchBaseline } from '@surea11y/core/baseline';",
        "import { wcagCriteria, wcagCriterion, wcagTags, WCAG_CRITERIA } from '@surea11y/core/wcag';",
        "import { EN301549_VERSIONS, en301549ClausesForSc } from '@surea11y/core/en301549';",
        "import { runa11yCoreInPage as browserScan } from '@surea11y/core/browser';",
        "import { definePack, packScript } from '@surea11y/core/pack';",
        "import { runa11yCoreOnHtml, assertRule } from '@surea11y/core/testing';",
        "import { packDocs, ruleCatalog } from '@surea11y/core/pack-docs';",
        "type SafeDom = typeof import('@surea11y/core/eslint-plugin');",
        "const pack = definePack({ name: '@acme/a11y-pack', version: '1.0.0', namespace: 'acme', core: '^1.11.0' });",
        "const script: string = packScript([pack]) + ruleCatalog(pack, { rulesDir: 'rules' });",
        'void packDocs(pack, { check: true }).then((r) => r.problems.concat(r.written));',
        "const checked: string = assertRule(runa11yCoreOnHtml('<p>x</p>', { engineOptions: { packs: [pack] } }), 'acme-x', 'pass').ruleId;",
        'declare const safeDom: SafeDom;',
        "const lintRules: Record<string, 'error'> = safeDom.configs.recommended.rules;",
        'const result = runDomRulesInPage();',
        "const sarif: string = renderSarifReport(result, { category: 'a11y-1280/', toolVersion: '1.0.0' });",
        "const junit: string = renderJunitReport(result, { cantTellAs: 'failure', name: 'home' });",
        "const html: string = renderHtmlReport(result, { title: 'Home' });",
        "const outcome: string = renderEarlReport([result], { assertor: null })['@graph'][0].assertions[0].result.outcome + OUTCOME_TO_EARL.fail;",
        'const entries = buildBaselineEntries(result);',
        'const fresh: number = matchBaseline(result, entries).newCount;',
        "const level: 'A' | 'AA' | 'AAA' | undefined = wcagCriterion('1.4.3', '2.2')?.level;",
        "const tags: string[] = wcagTags('2.1', ['A', 'AA']).concat(WCAG_CRITERIA.map((c) => c.tag));",
        "const count: number = wcagCriteria('2.2', { levels: 'AA' }).length;",
        "const clause: string | undefined = en301549ClausesForSc('1.1.1')[0]?.clause + EN301549_VERSIONS[0].version;",
        "const inPage: number = browserScan(null, null, {}, ['img-alt-present']).checksResults.length;",
        '// A cross-frame result goes to the reporters as it is (#145).',
        'void runa11yCoreAcrossFrames().then((frames) => {',
        '  const text: string = renderSarifReport(frames) + renderJunitReport(frames) + renderHtmlReport(frames);',
        '  const path: string[] = buildBaselineEntries(frames)[0]?.frame ?? matchBaseline(frames, []).newOccurrences[0]?.frame ?? [];',
        "  const urls: Array<string | null> = flattenCrossFrameResult(frames).map((f) => ('result' in f ? f.result.url : f.error));",
        '  void [text, path, urls];',
        '});',
        '// @ts-expect-error cantTellAs is skipped or failure',
        "renderJunitReport(result, { cantTellAs: 'warning' });",
        '// @ts-expect-error no WCAG 3.0',
        "wcagCriteria('3.0');",
        'void [sarif, junit, html, outcome, fresh, level, tags, count, clause, inPage, script, checked, lintRules];',
        ''
      ].join('\n')
    );
    for (const [moduleResolution, module] of [
      [ts.ModuleResolutionKind.Node10, ts.ModuleKind.CommonJS],
      [ts.ModuleResolutionKind.Node16, ts.ModuleKind.Node16],
      [ts.ModuleResolutionKind.Bundler, ts.ModuleKind.ESNext]
    ]) {
      const program = ts.createProgram([file], {
        strict: true,
        noEmit: true,
        moduleResolution,
        module,
        types: []
      });
      const errors = ts
        .getPreEmitDiagnostics(program)
        .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
      assert.deepEqual(errors, [], ts.ModuleResolutionKind[moduleResolution]);
    }
  }
);

// Code written against 1.10.0's types keeps compiling: results built by hand
// (a reporter's fixtures, a binding's frame results) without the fields added
// since, contributors read as 1.10.0 typed them, and window.a11ycore declared
// by the project itself.
test(
  "code written for 1.10.0's types still compiles",
  { skip: !ts && 'typescript not installed' },
  () => {
    const BROWSER = path.join(__dirname, '../../surea11y.browser');
    const errors = compile(`
    import type { RuleMeta, CheckResult, ScanResult, ScannedFrame, UnreachableFrame, FrameEntry } from ${JSON.stringify(TYPES)};
    declare global {
      interface Window { a11ycore: { runa11yCoreInPage: Function } }
    }
    const meta: RuleMeta = {
      ruleId: 'img-alt-present', ruleInterfaceVersion: '1', ruleVersion: '1', normative: true,
      atomic: true, deprecated: false, deprecation: null, category: 'perceivable',
      normativeMappings: [], standard: null, applicability: '', expectation: '',
      references: [], requirements: null, mappings: null
    };
    declare const top: ScanResult;
    const scanned: ScannedFrame = { url: null, topFrame: top, frames: [] };
    const unreachable: UnreachableFrame = { url: 'https://example.test/', error: 'timeout' };
    const frames: FrameEntry[] = [scanned, unreachable];
    const severities: Array<string | null> = top.rulesResults.flatMap((r) =>
      r.data.details.contributors.map((c) => c.severity)
    );
    void [meta, frames, severities];
  `);
    assert.deepEqual(errors, []);
    // The bundle's types declare no window.a11ycore of their own to clash with.
    assert.doesNotMatch(fs.readFileSync(BROWSER + '.d.ts', 'utf8'), /^declare global/m);
  }
);
