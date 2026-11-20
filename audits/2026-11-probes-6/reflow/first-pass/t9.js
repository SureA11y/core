const { chromium } = require('/home/user/core/node_modules/playwright');
const { scan, page } = require('./harness');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', ignoreDefaultArgs: ['--hide-scrollbars'] });
  const tall = '<div style="height:2000px">tall</div>';
  for (const [n, h] of [
    ['classic scrollbar, fluid content', page('', '<p>Fluid paragraph text that wraps fine.</p>' + tall)],
    ['classic scrollbar, 100vw element', page('', '<div id="v" style="width:100vw;margin-left:-8px">Full bleed</div>' + tall)],
    ['classic scrollbar, scrollbar-gutter stable both', page('html{scrollbar-gutter:stable both-edges}', '<p>Fluid</p>')],
    ['RTL page, element pushed off the RIGHT (unreachable)', page('', '<p id="r" style="position:relative;left:120px">نص مهم يبدأ هنا ويختفي جزء منه</p>', 'dir="rtl"')],
  ]) { const r = await scan(b, h); console.log(n, r.outcome, JSON.stringify(r.env), JSON.stringify(r.f)); }
  await b.close();
})();
