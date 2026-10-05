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

    const errors = compile(
      `import type { ScanResult, CheckCatalogEntry, RuleCatalogEntry } from ${JSON.stringify(TYPES)};\n` +
        `export const results: ScanResult[] = ${JSON.stringify(results)};\n` +
        `export const checks: CheckCatalogEntry[] = ${JSON.stringify(core.getChecksCatalog())};\n` +
        `export const rules: RuleCatalogEntry[] = ${JSON.stringify(core.getRulesCatalog())};\n`
    );
    assert.deepEqual(errors, []);
  }
);

test(
  'the scan functions are typed as they are called',
  { skip: !ts && 'typescript not installed' },
  () => {
    const errors = compile(`
    import { runDomRulesInPage, runa11yCoreInPage, runa11yCoreAcrossFrames, a11yCoreEnableFrameResponder, getChecksCatalog, waitForPageReady } from ${JSON.stringify(TYPES)};
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
    void [b, p, off, width, reached, code, tags, unmatched, scanned, o];
  `);
    assert.deepEqual(errors, []);
  }
);

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
