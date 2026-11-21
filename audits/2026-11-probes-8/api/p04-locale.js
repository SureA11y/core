const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const core = require('/home/user/core-r8/src/index.js');
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a"><a href="#"></a><div tabindex="0" accesskey="a">x</div><div accesskey="a">y</div></main></body></html>';
const locs = ['de', 'DE', 'de-AT', 'de_AT', 'De-at', 'ja-JP', 'fr-CA', 'es-419', 'EN', 'en-US', 'zh', '', '   ', ' de ', '__proto__', 'constructor', 'toString', 'hasOwnProperty', 'de-', '-de', 'x-de', 'i-klingon', 'de-DE-u-co-phonebk', 'ﬀ', 'İ', 'dE\u0000', 'ja-Latn'];
(async () => {
  console.warn = () => {};
  for (const l of locs) {
    try {
      const r = await runa11yCoreOnHtml(html, { engineOptions: { locale: l }, runOnly: ['img-alt-present', 'link-name-present', 'accesskeys'] });
      const c = r.checksResults.find(c => c.ruleId === 'img-alt-present');
      console.log(JSON.stringify(l).padEnd(24), JSON.stringify(r.engine.locale), '|', (c.meta.title || c.title || '').slice(0, 30), '|', (c.occurrences[0] && c.occurrences[0].message || '').slice(0, 50), '| htc', c.occurrences[0] && c.occurrences[0].howToCheck ? 'y' : 'n');
    } catch (e) { console.log(JSON.stringify(l), 'THROW', e.message.slice(0, 150)); }
  }
})();
