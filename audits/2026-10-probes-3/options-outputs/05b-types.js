'use strict';
// The saved samples of 05 (one result per option combination), plus a
// cross-frame result, a pack scan and catalogs, compiled strictly against
// src/index.d.ts as typed object literals: an undeclared field or a wrong
// type is a compile error.
const fs = require('fs');
const os = require('os');
const path = require('path');
const h = require('./h.js');
const ts = require(path.join(h.ROOT, 'node_modules/typescript'));
const { main } = h.load();
const samples = JSON.parse(fs.readFileSync(path.join(__dirname, 'out-05-samples.json'), 'utf8'));
const pack = require(h.ROOT + '/tests/fixtures/packs/sample.js');
h.setDom(h.fixture('img-alt-present-all-scenarios.html'));
samples['pack profile'] = main.runDomRulesInPage('https://e.test/', null, { packs: [pack], profile: 'sample-1.0' }, null);
samples['pack severity'] = (() => { try { return main.runDomRulesInPage('https://e.test/', null, { packs: [pack, { name: 'bad' }] }, null); } catch (e) { return null; } })();
if (!samples['pack severity']) delete samples['pack severity'];
function compile(source) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oo-types-'));
  const file = path.join(dir, 'check.ts');
  fs.writeFileSync(file, source);
  const program = ts.createProgram([file], { strict: true, noEmit: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, moduleResolution: ts.ModuleResolutionKind.Node10, types: [] });
  return ts.getPreEmitDiagnostics(program).map((d) => {
    const pos = d.file && d.start != null ? d.file.getLineAndCharacterOfPosition(d.start) : null;
    return (pos ? `L${pos.line + 1}: ` : '') + ts.flattenDiagnosticMessageText(d.messageText, ' ').slice(0, 300);
  });
}
const TYPES = JSON.stringify(path.join(h.ROOT, 'src/index'));
for (const [name, r] of Object.entries(samples)) {
  const errs = compile(`import type { ScanResult } from ${TYPES};\nexport const r: ScanResult = ${JSON.stringify(r)};\n`);
  console.log(`## ${name}: ${errs.length ? errs.length + ' error(s)' : 'compiles'}`);
  for (const e of [...new Set(errs.map((x) => x.replace(/^L\d+: /, '')))].slice(0, 4)) console.log('   ' + e);
}
const catErrs = compile(`import type { CheckCatalogEntry, RuleCatalogEntry } from ${TYPES};\nexport const a: CheckCatalogEntry[] = ${JSON.stringify(main.getChecksCatalog({ profile: 'en301549-v4.1.1', locale: 'ja' }))};\nexport const b: RuleCatalogEntry[] = ${JSON.stringify(main.getRulesCatalog({ packs: [pack], profile: 'sample-1.0' }))};\n`);
console.log('## catalogs:', catErrs.length ? catErrs.slice(0, 4) : 'compile');
process.exit(0);
