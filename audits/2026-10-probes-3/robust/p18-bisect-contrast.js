// Times contrast-computable on 50,000 flat <div>s in Chromium with the bundle
// built at each given commit (built from `git archive` in a scratch folder).
// usage: SCRATCH=... node p18-bisect-contrast.js <commit> [<commit> ...]
const h = require('./harness');
const { execSync } = require('child_process');
const fs = require('fs'), path = require('path');
const html = `<!doctype html><html lang="en"><head><title>s</title></head><body><main><h1>H</h1>${Array.from({ length: 50000 }, (_, i) => `<div>item ${i}</div>`).join('')}</main></body></html>`;
function build(commit) {
  const dir = path.join(process.env.SCRATCH, 'b', commit);
  if (!fs.existsSync(path.join(dir, 'surea11y.browser.js.built'))) {
    execSync(`rm -rf ${dir} && mkdir -p ${dir} && git -C ${h.ROOT} archive ${commit} | tar -x -C ${dir} && ln -s ${h.ROOT}/node_modules ${dir}/node_modules && cd ${dir} && node scripts/build-core.js >/dev/null && node scripts/build-browser.js >/dev/null && touch surea11y.browser.js.built`, { stdio: 'inherit' });
  }
  return path.join(dir, 'surea11y.browser.js');
}
(async () => {
  for (const c of process.argv.slice(2)) {
    const bundle = c === 'v1.10.0-npm' ? path.join(process.env.SCRATCH, 'pkg110/package/surea11y.browser.js') : build(c);
    const ms = [];
    for (let i = 0; i < 2; i++) {
      const r = await h.runChromium(html, { perfStats: true, profileRules: true }, { bundle, runOnly: { type: 'rule', values: ['contrast-computable'] } });
      ms.push(Math.round(r.r.perfStats.ruleTimings['contrast-computable']));
    }
    console.log(c, execSync(`git -C ${h.ROOT} log -1 --format=%s ${c === 'v1.10.0-npm' ? 'v1.10.0' : c}`).toString().trim().slice(0, 60), '| contrast-computable ms', ms.join(', '));
  }
  await h.closeBrowser();
})();
