// Selector of the same element in jsdom vs Chromium (no-autoplay-audio).
const h = require('./harness');
const V = {
  audioNoControls: '<div id="c"><audio id="a1" autoplay src="x.mp3"></audio></div>',
  audioControls: '<div id="c"><audio id="a1" autoplay controls src="x.mp3"></audio></div>',
  audioNoControlsOnlyCase: '<audio id="a1" autoplay src="x.mp3"></audio>',
  videoNoControls: '<div id="c"><video id="a1" autoplay src="x.mp4"></video></div>',
};
(async () => {
  for (const [n, body] of Object.entries(V)) {
    const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>H</h1>${body}</main></body></html>`;
    const sel = (r) => (r.checksResults.find((x) => x.ruleId === 'no-autoplay-audio').occurrences || []).map((o) => o.selector).join(',');
    const j = h.runJsdom(html).r; const c = (await h.runChromium(html)).r;
    console.log(n, '| jsdom:', sel(j), '| chromium:', sel(c));
  }
  await h.closeBrowser();
})();
