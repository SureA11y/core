const { run, show, close } = require('./h');
const R = ['focus-not-obscured-minimum','focus-not-obscured-enhanced'];
const links = Array.from({length: 80}, (_, i) => `<p><a href="#">Link ${i}</a></p>`).join('');
const cases = {
  fixedHdr: `<style>body{margin:0;padding-top:60px}</style><header style="position:fixed;top:0;left:0;right:0;height:60px;background:#fff">Site</header>${links}`,
  fixedFooter: `<style>body{margin:0}</style>${links}<div style="position:fixed;bottom:0;left:0;right:0;height:80px;background:#333;color:#fff">Cookies</div>`,
  stickyNoPad: `<style>body{margin:0}</style><header style="position:sticky;top:0;height:60px;background:#fff">Site</header>${links}`,
  stickyNoPadWrap: `<style>body{margin:0}</style><header style="position:sticky;top:0;height:60px;background:#fff">Site</header><main>${links}</main>`,
};
(async () => {
  for (const [k, h] of Object.entries(cases)) show(k, await run(h, R, { eo: { wcagLevel: 'AAA' } }), true);
  await close();
})();
