// Compares the runtime exports of every subpath and the browser bundle's globals between two unpacked packages.
const path = require('path'), vm = require('vm'), fs = require('fs');
const [oldRoot, newRoot] = process.argv.slice(2).map((p) => path.resolve(p));
const subs = ['src/index.js', 'src/baseline.js', 'src/report.js', 'src/sarif.js', 'src/junit.js', 'src/earl.js', 'src/en301549.js', 'src/wcag.js'];
const shape = (m) => Object.keys(m).sort().map((k) => `${k}:${typeof m[k]}`);
for (const s of subs) {
  const o = shape(require(path.join(oldRoot, s))), n = shape(require(path.join(newRoot, s)));
  const removed = o.filter((x) => !n.includes(x));
  console.log(`${s}: old ${o.length} new ${n.length} removed/changed: ${removed.join(', ') || 'none'}`);
}
function globalsOf(root) {
  const ctx = { console: { log() {}, warn() {}, info() {}, error() {} } }; ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  const before = new Set(Object.keys(ctx));
  vm.runInContext(fs.readFileSync(path.join(root, 'surea11y.browser.js'), 'utf8'), ctx);
  const added = Object.keys(ctx).filter((k) => !before.has(k));
  const out = {};
  for (const g of added) out[g] = ctx[g] && typeof ctx[g] === 'object' ? shape(ctx[g]) : typeof ctx[g];
  return out;
}
const go = globalsOf(oldRoot), gn = globalsOf(newRoot);
for (const g of Object.keys(go)) {
  if (!(g in gn)) { console.log(`global ${g}: REMOVED`); continue; }
  if (Array.isArray(go[g])) { const r = go[g].filter((x) => !gn[g].includes(x)); console.log(`global ${g}: old ${go[g].length} new ${gn[g].length} removed: ${r.join(', ') || 'none'}`); }
  else console.log(`global ${g}: ${go[g]} -> ${gn[g]}`);
}
console.log('new globals:', Object.keys(gn).filter((g) => !(g in go)).join(', ') || 'none');
// i18n bundles
for (const f of fs.readdirSync(oldRoot).filter((f) => /^surea11y\.i18n\..*\.js$/.test(f))) console.log(f, fs.existsSync(path.join(newRoot, f)) ? 'present' : 'REMOVED');
