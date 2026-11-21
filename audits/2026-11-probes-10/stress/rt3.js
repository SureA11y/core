const { scan, rule, brief, close } = require('./harness.js');
const RO = ['resize-text-content-loss'];
const doc = b => `<!doctype html><html lang="en"><head><title>t</title></head><body>${b}</body></html>`;
const cases = {
 heroLH1: `<h1 style="font-size:48px;line-height:1;overflow:hidden;margin:0">Big launch</h1>`,
 titleClamp2LH1: `<h2 style="font-size:32px;line-height:1;max-height:2em;overflow:hidden;width:500px">Two lines of heading text that wrap here</h2>`,
 badge: `<span style="display:inline-block;font-size:12px;line-height:12px;height:12px;overflow:hidden;padding:2px 6px;background:#eee">New</span>`,
 navWrap: `<nav style="height:48px;overflow:hidden"><ul style="display:flex;flex-wrap:wrap;gap:24px;list-style:none;margin:0;padding:0">${['Home','Products','Solutions','Pricing','Resources','Customers','Partners','About us','Careers','Contact'].map(x=>`<li style="line-height:48px"><a href="#">${x}</a></li>`).join('')}</ul></nav>`,
 btnFixedH: `<button style="height:36px;width:120px;overflow:hidden">Download the annual report</button>`,
 animatedWordReveal: `<h2 style="font-size:40px;line-height:1.1"><span style="display:inline-block;overflow:hidden;vertical-align:bottom"><span style="display:inline-block">Reveal</span></span></h2>`,
};
(async () => {
  for (const [k, b] of Object.entries(cases)) {
    const { r } = await scan(doc(b), { runOnly: RO });
    console.log(k.padEnd(20), brief(rule(r, RO[0])).slice(0, 420));
  }
  await close();
})();
