// Loads a page in Chromium with the engine's dom-helpers (bundled from src,
// as scripts/ax-tree-differential.js does) as window.__h, then runs fn.
const esbuild = require('/home/user/core/node_modules/esbuild');
const { chromium } = require('/home/user/core/node_modules/playwright');
const bundle = esbuild.buildSync({ stdin: { contents: "const { createDomHelpers } = require('./src/core/dom-helpers.js'); globalThis.__mk = createDomHelpers;", resolveDir: '/home/user/core' }, bundle: true, format: 'iife', platform: 'browser', write: false, logLevel: 'error' }).outputFiles[0].text;
module.exports = async function evalOn(html, fn, arg) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  try {
    const p = await b.newPage();
    await p.setContent(html);
    await p.addScriptTag({ content: bundle + ';window.__h=__mk({window,document,root:document});' });
    return await p.evaluate(fn, arg);
  } finally { await b.close(); }
};
if (require.main === module) {
  (async () => {
    const html = '<button id="b" aria-labelledby="l">x</button><span id="l" aria-hidden="true">AH <span id="c">child</span></span>';
    console.log(await module.exports(html, () => {
      const h = window.__h; const l = document.getElementById('l'), c = document.getElementById('c');
      return { lElig: h.isAccTreeEligible(l), cElig: h.isAccTreeEligible(c), name: h.getAccessibleNameInfo(document.getElementById('b')) };
    }));
  })();
}
