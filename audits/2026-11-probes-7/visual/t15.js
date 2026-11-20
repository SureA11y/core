const { run, show, close } = require('./h');
const R = ['focus-not-obscured-minimum'];
const links = Array.from({length: 80}, (_, i) => `<p><a href="#">Link ${i}</a></p>`).join('');
const cases = {
  stickyBrokenByOverflow: `<style>body{margin:0}</style><div style="overflow-x:hidden"><header style="position:sticky;top:0;height:60px;background:#fff">Site</header>${links}</div>`,
  fixedBgLayer: `<style>body{margin:0}</style><div style="position:fixed;inset:0;z-index:-1;background:linear-gradient(#eef,#fee)"></div>${links}`,
  stickyTh: `<style>body{margin:0}</style><table><thead><tr><th style="position:sticky;top:0;background:#fff;height:40px">Name</th></tr></thead><tbody>${Array.from({length:80},(_, i)=>`<tr><td><a href="#">Row ${i}</a></td></tr>`).join('')}</tbody></table>`,
  centeredContentFixedFab: `<style>body{margin:0}main{max-width:600px;margin:auto}</style><main>${links}</main><button style="position:fixed;right:16px;bottom:16px;width:56px;height:56px;border-radius:50%;background:#06c">?</button>`,
  stickyTopPct: `<style>body{margin:0}</style><header style="position:sticky;top:5%;height:60px;background:#fff">Site</header>${links}`,
};
(async () => {
  for (const [k, h] of Object.entries(cases)) show(k, await run(h, R), true);
  await close();
})();
