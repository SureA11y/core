const H = require('./h.js');
const html = H.page('<img src="a.png"><a href="/x"></a>');
const key = 'imgAltPresent_summary_fail_noAlt';
const en = require(H.ROOT + '/src/i18n/en.json'); const k = 'img_altPresent_summary_fail'; console.log('key', k);
for (const [n, eo] of [['de-AT plain', { locale: 'de-AT' }], ['de-AT + caller de-AT', { locale: 'de-AT', messages: { 'de-AT': { [k]: 'ÖSTERREICH' } } }], ['de-AT + caller de', { locale: 'de-AT', messages: { de: { [k]: 'DEUTSCH' } } }], ['DE-at case', { locale: 'DE-at', messages: { 'de-at': { [k]: 'LOWER' } } }], ['zh-Hant-TW', { locale: 'zh-Hant-TW' }], ['de-AT-x-foo', { locale: 'de-AT-x-foo' }], ['en-GB caller en', { locale: 'en-GB', messages: { en: { [k]: 'ENFALLBACK' } } }], ['empty', { locale: '' }], ['__proto__', { locale: '__proto__' }], ['constructor', { locale: 'constructor' }], ['toString', { locale: 'toString' }]]) {
  const { r, logs, err } = H.scan(html, eo, ['img-alt-present', 'link-name-present']);
  if (err) { console.log(n, 'ERR', err.message.slice(0, 200)); continue; }
  console.log(n, JSON.stringify(r.engine.locale), '|', r.checksResults.map(c => (c.occurrences[0] || {}).summary).map(s => String(s).slice(0, 50)).join(' || '), logs.slice(0, 2).map(x => x.slice(0, 150)));
}
