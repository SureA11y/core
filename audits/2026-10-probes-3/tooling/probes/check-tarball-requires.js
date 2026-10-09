// Static check: every relative require() in the unpacked tarball resolves to a file in it.
const fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2]);
const missing = [];
function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (f.endsWith('.js')) scan(f); } }
function scan(f) {
  const src = fs.readFileSync(f, 'utf8');
  const re = /require\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g; let m;
  while ((m = re.exec(src))) {
    if (f.includes('/templates/')) continue;
    const base = path.resolve(path.dirname(f), m[1]);
    const ok = [base, base + '.js', base + '.json', path.join(base, 'index.js')].some((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!ok) missing.push(`${path.relative(root, f)} -> ${m[1]}`);
  }
}
walk(root);
console.log(missing.length ? missing.join('\n') : 'all relative requires resolve');
