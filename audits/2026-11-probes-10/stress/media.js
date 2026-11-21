const { chromium } = require('/home/user/core-r10/node_modules/playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const pages = {
 autoplayAudio5: `<audio src="/a5.wav" autoplay></audio>`,
 autoplayAudio2: `<audio src="/a2.wav" autoplay></audio>`,
 autoplayAudio2loop: `<audio src="/a2.wav" autoplay loop></audio>`,
 autoplayVideoMuted: `<video src="/v6.webm" autoplay muted></video>`,
 autoplayVideoSound: `<video src="/v6.webm" autoplay></video>`,
 autoplayVideoSoundControls: `<video src="/v6.webm" autoplay controls></video>`,
 autoplayVideoSilentTrack: `<video src="/v6silent.webm" autoplay></video>`,
 videoCaptions: `<video src="/v6.webm" controls><track kind="captions" src="/c.vtt" srclang="en" label="English"></video>`,
 videoSubtitles: `<video src="/v6.webm" controls><track kind="subtitles" src="/c.vtt" srclang="en" label="English"></video>`,
 videoNoTrack: `<video src="/v6.webm" controls></video>`,
 videoSilentNoTrack: `<video src="/v6silent.webm" controls></video>`,
 videoTranscriptLink: `<video src="/v6.webm" controls></video><p><a href="/t">Read the transcript</a></p>`,
};
const RO = ['no-autoplay-audio','video-caption','media-alternative-transcript-evidence','video-poster-text-alternative-present','moving-content-pausable'];
const srv = http.createServer((q, s) => { const f = path.join(__dirname, q.url.split('?')[0]); if (q.url !== '/' && !q.url.startsWith('/p/') && fs.existsSync(f)) { s.setHeader('content-type', f.endsWith('.wav') ? 'audio/wav' : f.endsWith('.vtt') ? 'text/vtt' : 'video/webm'); return s.end(fs.readFileSync(f)); } const k = q.url.slice(3); s.setHeader('content-type','text/html'); s.end(`<!doctype html><html lang="en"><head><title>m</title></head><body><main><h1>Media</h1>${pages[k]}</main></body></html>`); }).listen(0, async () => {
  const port = srv.address().port;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const k of Object.keys(pages)) {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/p/${k}`, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    await page.addScriptTag({ path: '/home/user/core-r10/surea11y.browser.js' });
    const r = await page.evaluate(async (ro) => { await window.a11ycore.waitForPageReady && window.a11ycore.waitForPageReady(); return window.a11ycore.runa11yCoreInPage(null, null, {}, ro); }, RO.filter(x => true));
    console.log(k.padEnd(28), r.checksResults.map(c => c.ruleId.slice(0,14) + '=' + c.outcome + (c.occurrences.length ? '[' + c.occurrences.map(o => (o.data && o.data.details && o.data.details.reasonCode || '?') + (o.lean ? '/' + o.lean.toward : '')).join(',') + ']' : '')).join(' '));
    await page.close();
  }
  await browser.close(); srv.close();
});
