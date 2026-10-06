const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const cases = {
  docEl: '<img name="documentElement" src="logo.png" alt="Logo"><button></button><img src="x.png">',
  docElCtrl: '<img name="zdocumentElement" src="logo.png" alt="Logo"><button></button><img src="x.png">',
  title: '<form name="title" aria-label="Search"><input aria-label="q"></form>',
  qsa: '<img name="querySelectorAll" src="a.png" alt=""><label for="ok">Ok</label><input id="ok">',
  qsaCtrl: '<img name="zquerySelectorAll" src="a.png" alt=""><label for="ok">Ok</label><input id="ok">',
  gebi: '<img name="getElementById" src="a.png" alt=""><div role="button" tabindex="0" aria-labelledby="missing">x</div><input aria-describedby="nope" aria-label="q">',
  gebiCtrl: '<img name="zgetElementById" src="a.png" alt=""><div role="button" tabindex="0" aria-labelledby="missing">x</div><input aria-describedby="nope" aria-label="q">',
  attributes: '<form aria-label="s" aria-foo="bar" aria-hiddenx="1"><input name="attributes" aria-label="q"></form>',
  attributesCtrl: '<form aria-label="s" aria-foo="bar" aria-hiddenx="1"><input name="zattributes" aria-label="q"></form>',
  getAttribute: '<form aria-label="s"><input name="getAttribute" aria-label="q"><button></button></form>',
  assignedSlot: '<form aria-label="s"><input name="assignedSlot" aria-label="q"><img src="x.png"></form>',
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [k, body] of Object.entries(cases)) {
    const p = await b.newPage();
    await p.setContent(`<!doctype html><html lang="en"><head><title>Verify page</title></head><body><main><h1>Verify</h1>${body}</main></body></html>`);
    await p.evaluate(bundle + ';window.a11ycore=a11ycore;');
    const r = await p.evaluate(() => { const r = a11ycore.runa11yCoreInPage(location.href, null, {}, null); return { cm: r.contextMatch, res: r.checksResults.filter(c => c.outcome === 'fail' || c.error || /title|label|valid-attr|img-alt-present|button-name/.test(c.ruleId) && c.outcome !== 'notApplicable').map(c => c.ruleId + '=' + c.outcome + ':' + c.occurrences.map(o => o.selector).join('|') + (c.error ? ' !' + c.error.slice(0, 70) : '')) }; });
    console.log('==', k, JSON.stringify(r.cm)); console.log('  ' + r.res.join('\n  '));
    await p.close();
  }
  await b.close();
})();
