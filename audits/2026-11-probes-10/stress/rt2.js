const { scan, rule, brief, close } = require('./harness.js');
const RO = ['resize-text-content-loss'];
const doc = b => `<!doctype html><html lang="en"><head><title>t</title></head><body>${b}</body></html>`;
(async () => {
  // vertical ellipsis clipCss + summary
  let { r } = await scan(doc(`<div style="writing-mode:vertical-rl;height:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">縦書きの長い見出しテキストがここにあります</div>`), { runOnly: RO });
  const o = rule(r, RO[0]).occurrences[0]; console.log('vertical', o.data.details.reasonCode, '|', o.data.details.clipCss, '|', o.summary);
  // vertical line clamp
  ({ r } = await scan(doc(`<div style="writing-mode:vertical-rl;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;height:120px">縦書きの長い見出しテキストがここにあります。縦書きの長い見出しテキストがここにあります。縦書きの長い見出しテキストがここにあります。</div>`), { runOnly: RO }));
  console.log('verticalClamp', brief(rule(r, RO[0])).slice(0,400));
  // svg text slightly past edge
  ({ r } = await scan(doc(`<svg width="100" height="40"><text x="10" y="25" font-size="16">Revenue 2026 by quarter</text></svg>`), { runOnly: RO }));
  console.log('svgText', brief(rule(r, RO[0])).slice(0,300));
  // hanging spaces pre-wrap realistic: chat message
  ({ r } = await scan(doc(`<div style="max-width:300px;overflow:hidden;white-space:pre-wrap;border:1px solid">Thanks!   \nSee you tomorrow.                                                        </div>`), { runOnly: RO }));
  console.log('chat', brief(rule(r, RO[0])).slice(0,300));
  ({ r } = await scan(doc(`<div style="width:200px;overflow:hidden;white-space:break-spaces">Hello world                                              </div>`), { runOnly: RO }));
  console.log('break-spaces', brief(rule(r, RO[0])).slice(0,300));
  await close();
})();
