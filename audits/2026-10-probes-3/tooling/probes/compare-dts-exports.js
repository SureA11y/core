// Lists the exported names of each .d.ts in two unpacked packages and reports names removed.
const ts = require(process.env.TS || 'typescript');
const path = require('path'), fs = require('fs');
const [oldRoot, newRoot] = process.argv.slice(2).map((p) => path.resolve(p));
function exportsOf(file) {
  const prog = ts.createProgram([file], { strict: true, noEmit: true });
  const checker = prog.getTypeChecker();
  const sf = prog.getSourceFile(file);
  const sym = checker.getSymbolAtLocation(sf);
  if (!sym) return null;
  return checker.getExportsOfModule(sym).map((s) => s.name).sort();
}
const dts = ['src/index.d.ts', 'surea11y.browser.d.ts', 'src/baseline.d.ts', 'src/report.d.ts', 'src/sarif.d.ts', 'src/junit.d.ts', 'src/earl.d.ts', 'src/en301549.d.ts', 'src/wcag.d.ts'];
for (const f of dts) {
  const o = fs.existsSync(path.join(oldRoot, f)) ? exportsOf(path.join(oldRoot, f)) : null;
  const n = fs.existsSync(path.join(newRoot, f)) ? exportsOf(path.join(newRoot, f)) : null;
  if (!o) { console.log(`${f}: not in old (${n ? n.length + ' exports new' : 'absent'})`); continue; }
  const removed = o.filter((x) => !n || !n.includes(x));
  console.log(`${f}: old ${o.length}, new ${n ? n.length : 0}, removed: ${removed.join(', ') || 'none'}`);
}
