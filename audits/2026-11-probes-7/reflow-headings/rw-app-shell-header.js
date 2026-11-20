// RW: an app shell whose scrolling <main> sits under an app bar (flex column) is not judged as the page:
// text that makes it scroll sideways is cantTell (SCROLLS_IN_CONTAINER) where the same shell without the bar fails.
const h = require('./harness');
const D = '<!doctype html><html><head><meta charset=utf-8><style>html,body{height:100%;overflow:hidden;margin:0}</style></head><body>';
const wide = '<div style="width:600px">Wide text content in the app</div>';
const cases = {
  'main fills viewport (no bar)': `<main style="height:100%;overflow:auto">${wide}</main>`,
  'sidebar of 0 + main (row)': `<div style="display:flex;height:100%"><aside style="flex:0 0 0"></aside><main style="flex:1;overflow:auto">${wide}</main></div>`,
  'app bar 56px + main (column)': `<div style="display:flex;flex-direction:column;height:100%"><header style="flex:0 0 56px">App</header><main style="flex:1;overflow:auto">${wide}</main></div>`,
  'app bar 56px + main + bottom nav 56px': `<div style="display:flex;flex-direction:column;height:100%"><header style="flex:0 0 56px">App</header><main style="flex:1;overflow:auto">${wide}</main><nav style="flex:0 0 56px">Tabs</nav></div>`,
};
(async () => {
  for (const [name, frag] of Object.entries(cases)) for (let i = 0; i < 2; i++) {
    const r = await h.runChromium(D + frag + '</body></html>', 'reflow-horizontal-scroll');
    console.log(name.padEnd(40), r.outcome, r.occ.map(o => `${o.o}:${o.code}:${o.lean||'-'}@${o.sel}`).join(','));
  }
  await h.close();
})();
