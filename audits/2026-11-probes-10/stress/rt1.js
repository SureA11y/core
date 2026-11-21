const { scan, rule, brief, close } = require('./harness.js');
const RO = ['resize-text-content-loss'];
const cases = {
 hangingSpaces: `<div style="width:200px;overflow:hidden;white-space:pre-wrap">Hello world                                              </div>`,
 clipMargin: `<div style="width:200px;overflow:clip;overflow-clip-margin:40px;white-space:nowrap;font-size:16px">Hello world this is lon</div>`,
 cjkLineHeight1: `<div style="width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1;font-family:'WenQuanYi Zen Hei'">東京の天気</div>`,
 cjkLH1b: `<div style="height:16px;line-height:16px;font-size:16px;overflow:hidden;font-family:'WenQuanYi Zen Hei'">東京の天気</div>`,
 verticalEllipsis: `<div style="writing-mode:vertical-rl;height:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">縦書きの長い見出しテキストがここにあります</div>`,
 carouselPeek: `<div style="width:600px;overflow:hidden"><div style="display:flex;gap:16px;width:max-content">${Array.from({length:4},(_, i)=>`<div style="width:260px;flex:none;border:1px solid"><h3>Card ${i} title</h3><p>Some description for card ${i}.</p></div>`).join('')}</div></div>`,
 italicOverhang: `<div style="width:max-content;overflow:hidden;font-style:italic;font-size:40px">fff</div>`,
 rtlEllipsis: `<div dir="rtl" style="width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">שלום עולם זה טקסט ארוך מאוד</div>`,
 lineClampFits: `<p style="display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;width:300px">Short.</p>`,
 detailsClosed: `<details><summary>More</summary><div style="overflow:hidden">Hidden text</div></details>`,
 roundAvatarInitials: `<span style="display:inline-block;width:32px;height:32px;border-radius:50%;overflow:hidden;text-align:center;line-height:32px;font-size:14px">AB</span>`,
 iconFont: `<button style="width:24px;height:24px;overflow:hidden;padding:0;font-size:12px">✕</button>`,
};
(async () => {
  for (const [k, body] of Object.entries(cases)) {
    const { r } = await scan(`<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`, { runOnly: RO });
    console.log(k.padEnd(20), brief(rule(r, RO[0])));
  }
  await close();
})();
