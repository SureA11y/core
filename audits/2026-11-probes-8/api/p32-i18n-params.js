const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const html = '<html lang="en"><head><title>t</title></head><body><p id="a">x</p></body></html>';
const rule = { id: 'org-i', meta: { title: 'T', description: 'd', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] },
  runInPage: `function(ctx){ return { outcome: 'fail', occurrences: [{ selector: '#a', i18n: { summaryKey: 'org_i_summary', hintKey: 'org_i_hint', params: { a: '{{b}}', b: 'BEE', c: '$&$1$$', d: '__proto__', e: { toString(){ return 'obj'; } }, f: null, g: 5 } } }] }; }` };
(async () => {
  console.warn = (...a) => console.log('warn', String(a[0]).slice(0, 150));
  for (const messages of [
    { en: { org_i_summary: 'A={{a}} B={{b}} C={{c}}', org_i_hint: 'D={{d}} E={{e}} F={{f}} G={{g}} H={{h}} P={{__proto__}} T={{toString}} C2={{constructor}}' } },
    { de: { org_i_summary: 'DE {{a}}' } },
    { en: { org_i_summary: 5, org_i_hint: null } },
    { en: JSON.parse('{"__proto__": {"org_i_summary": "polluted {{b}}"}}') },
  ]) {
    for (const locale of ['en', 'de']) {
      try {
        const r = await runa11yCoreOnHtml(html, { engineOptions: { customRules: [rule], messages, locale }, runOnly: ['org-i'] });
        const o = r.checksResults[0].occurrences[0];
        console.log(locale, JSON.stringify(messages).slice(0, 60).padEnd(60), '=>', JSON.stringify(o.summary), '|', JSON.stringify(o.hint));
      } catch (e) { console.log('THROW', e.message.slice(0, 150)); }
    }
  }
  console.log('proto polluted?', ({}).org_i_summary);
})();
