const ts = require('typescript');
const path=require('path');
const pkg = require('@surea11y/core/package.json');
const subs = Object.entries(pkg.exports).filter(([k,v])=>typeof v==='object' && v.types && !k.includes('*'));
const prog = ts.createProgram(subs.map(([k,v])=>path.join('/home/user/core-r9',v.types)), {strict:true, noEmit:true});
const checker = prog.getTypeChecker();
for (const [k,v] of subs) {
  const sf = prog.getSourceFile(path.join('/home/user/core-r9',v.types));
  const sym = checker.getSymbolAtLocation(sf);
  const typeNames = new Set((sym? checker.getExportsOfModule(sym):[]).filter(s=>s.flags & (ts.SymbolFlags.Value|ts.SymbolFlags.Alias)).map(s=>s.name));
  let mod; try { mod = require('@surea11y/core'+k.slice(1)); } catch(e){ console.log(k,'REQUIRE FAIL',e.message); continue;}
  const runtime = new Set(Object.keys(mod));
  const missingTypes=[...runtime].filter(n=>!typeNames.has(n));
  const missingRuntime=[...typeNames].filter(n=>!runtime.has(n) && n!=='default');
  console.log(k, 'runtime-not-typed:', missingTypes.join(','), '| typed-not-runtime:', missingRuntime.join(','));
}
