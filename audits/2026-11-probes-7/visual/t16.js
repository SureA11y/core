const { run, show, close } = require('./h');
const R = ['target-size-minimum'];
const links = Array.from({length: 40}, (_, i) => `<p><a href="#">Link ${i}</a></p>`).join('');
const cases = {
  searchForm: `<form><input type="search"> <button>Search</button></form>`,
  cookieOverLinks: `<style>body{margin:0}</style><div>${Array.from({length:30},(_, i)=>`<a href="#" style="display:inline-block;font-size:12px">t${i}</a> `).join('<br>')}</div><div style="position:fixed;left:0;right:0;top:0;height:300px;background:#333"><button style="all:unset;width:20px;height:20px;background:#fff;margin:4px">x</button></div>`,
  chatBubbleNearLinks: `<style>body{margin:0}</style>${links}<button style="all:unset;position:fixed;right:0;bottom:0;width:20px;height:20px;background:#06c"></button><a href="#" style="position:absolute;right:22px;bottom:0;width:10px;height:10px;display:block"></a>`,
  equivalent: `<div style="display:flex"><button style="all:unset;width:16px;height:16px">&lt;</button><button style="all:unset;width:16px;height:16px">&gt;</button></div><button style="padding:12px">Previous</button><button style="padding:12px">Next</button>`,
  labelAroundCustomCheckbox: `<label style="display:flex;align-items:center;gap:8px;padding:8px 0"><input type="checkbox" style="appearance:none;width:18px;height:18px;border:1px solid;margin:0"> Remember me</label><label style="display:flex;align-items:center;gap:8px;padding:8px 0"><input type="checkbox" style="appearance:none;width:18px;height:18px;border:1px solid;margin:0"> Newsletter</label>`,
};
(async () => {
  for (const [k, h] of Object.entries(cases)) show(k, await run(h, R), true);
  await close();
})();
