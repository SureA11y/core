// Re-check of round 2's RB-3 (image-redundant-alt quadratic) and RB-4
// (selector building over wide sibling lists) on HEAD, in Chromium.
const h = require('./harness');
(async () => {
  for (const n of [2000, 4000, 8000]) {
    const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>H</h1><div>some text ${Array.from({ length: n }, () => '<img src="a.png" alt="photo">').join('')}</div></main></body></html>`;
    const r = await h.runChromium(html, { perfStats: true, profileRules: true }, { runOnly: { type: 'rule', values: ['image-redundant-alt'] }, timeoutMs: 300000 });
    console.log('RB-3 image-redundant-alt N=' + n, Math.round(r.r.perfStats.ruleTimings['image-redundant-alt']), 'ms');
  }
  for (const n of [4000, 8000, 16000]) {
    const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>H</h1><div>${Array.from({ length: n }, () => '<img src="a.png"><span>x</span>').join('')}</div></main></body></html>`;
    const r = await h.runChromium(html, { perfStats: true, profileRules: true }, { runOnly: { type: 'rule', values: ['img-alt-present'] }, timeoutMs: 300000 });
    console.log('RB-4 img-alt-present interleaved N=' + n, Math.round(r.r.perfStats.ruleTimings['img-alt-present']), 'ms');
  }
  await h.closeBrowser();
})();
