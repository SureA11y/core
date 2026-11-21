// css-focus-indicator-suppressed: a "replacement" that paints nothing (box-shadow:none, background:transparent) — pixel diff focused vs not
const { chromium } = require('/home/user/core/node_modules/playwright');
(async () => {
 const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
 for (const css of ['button:focus{outline:none;box-shadow:none}', 'a:focus{outline:none;background:transparent}', 'a:focus{outline:0;text-decoration:none}', 'button:focus{outline:none}']) {
  const p = await b.newPage({ viewport: { width: 200, height: 60 } });
  await p.setContent(`<!doctype html><style>${css}</style><button>Go</button> <a href="#" style="text-decoration:none">Link</a>`);
  const a = await p.screenshot();
  await p.keyboard.press('Tab'); if (css.startsWith('a')) await p.keyboard.press('Tab');
  const tag = await p.evaluate(() => document.activeElement.tagName);
  const c = await p.screenshot();
  console.log(css, tag, 'pixels identical:', a.equals(c));
  await p.close();
 }
 await b.close();
})();
