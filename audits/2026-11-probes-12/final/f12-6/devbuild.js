// node devbuild.js <repo> <out.js> : unminified-identifier browser bundle for profiling
const fs = require('fs'); const [repo, out] = process.argv.slice(2);
let s = fs.readFileSync(repo + '/scripts/build-browser.js', 'utf8');
s = s.replace("require('esbuild')", "require('/home/user/core/node_modules/esbuild')"); s = s.split("require('../").join(`require('${repo}/`).replace("require('./build-core.js')", `require('${repo}/scripts/build-core.js')`).split('__dirname').join(JSON.stringify(repo + '/scripts'));
s = s.replace(/function minifyBundle\(source, label\) \{\n  const result = esbuild.transformSync\(source, \{\n    minify: true,/, 'function minifyBundle(source, label) {\n  const result = esbuild.transformSync(source, {\n    minifyWhitespace: true, minifySyntax: true,');
s = s.replace(/fs\.writeFileSync\(OUTPUT_FILE, `\$\{BANNER\}\\n\$\{bundle\}`, 'utf8'\);/, `fs.writeFileSync(${JSON.stringify(out)}, bundle); return;`);
if (!s.includes(JSON.stringify(out))) throw new Error('patch failed');
s = s.replace('require.main === module', 'true'); fs.writeFileSync(__dirname + '/_bb.js', s); require('./_bb.js');
