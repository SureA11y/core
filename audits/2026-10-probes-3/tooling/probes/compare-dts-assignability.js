// For each exported type of the old index.d.ts, checks old->new and new->old assignability with tsc; prints the failures.
const ts = require(process.env.TS || 'typescript');
const path = require('path'), fs = require('fs');
const [oldRoot, newRoot, outDir] = process.argv.slice(2).map((p) => path.resolve(p));
const file = (r) => path.join(r, 'src/index.d.ts');
const prog = ts.createProgram([file(oldRoot)], { strict: true, noEmit: true });
const checker = prog.getTypeChecker();
const exps = checker.getExportsOfModule(checker.getSymbolAtLocation(prog.getSourceFile(file(oldRoot))));
const types = exps.filter((s) => s.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias)).map((s) => s.name);
const fns = exps.filter((s) => s.flags & ts.SymbolFlags.Function).map((s) => s.name);
const rel = (r) => './' + path.relative(outDir, path.join(r, 'src/index')).split(path.sep).join('/');
let src = `import type * as O from '${rel(oldRoot)}';\nimport type * as N from '${rel(newRoot)}';\nimport * as On from '${rel(oldRoot)}';\nimport * as Nn from '${rel(newRoot)}';\n`;
for (const t of types) {
  const generic = /<[^>]+>/.test('') ? '' : '';
  src += `// ${t}\nexport const r_${t} = (x: N.${t}): O.${t} => x;\nexport const c_${t} = (x: O.${t}): N.${t} => x;\n`;
}
for (const f of fns) src += `export const f_${f}: typeof On.${f} = Nn.${f};\n`;
const out = path.join(outDir, 'assignability.ts');
fs.writeFileSync(out, src);
const p2 = ts.createProgram([out], { strict: true, noEmit: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, skipLibCheck: true });
const diags = ts.getPreEmitDiagnostics(p2).filter((d) => d.file && d.file.fileName === out);
const lines = src.split('\n');
for (const d of diags) {
  const { line } = d.file.getLineAndCharacterOfPosition(d.start);
  console.log(lines[line].replace(/=>.*/, '').slice(0, 70), '::', ts.flattenDiagnosticMessageText(d.messageText, ' ').replace(/import\("[^"]*"\)\./g, '').slice(0, 900));
}
console.log(`${types.length} types, ${fns.length} functions checked, ${diags.length} diagnostics`);
