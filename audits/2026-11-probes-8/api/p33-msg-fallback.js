// A custom rule's message keys given in engineOptions.messages.en only, scanned in another locale.
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const html = '<html lang="en"><head><title>t</title></head><body><p id="a">x</p></body></html>';
const rule = (withLiteral) => ({ id: 'org-i', meta: { title: 'Org title', description: 'd', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'], i18n: { titleKey: 'org_i_title' } },
  runInPage: `function(ctx){ return { outcome: 'fail', occurrences: [{ selector: '#a', ${withLiteral ? "summary: 'literal summary'," : ''} i18n: { summaryKey: 'org_i_summary', params: { n: 3 } } }] }; }` });
const messages = { en: { org_i_summary: 'English summary {{n}}', org_i_title: 'English title' } };
(async () => {
  console.warn = () => {};
  for (const withLiteral of [false, true]) for (const locale of ['en', 'en-GB', 'de', 'fr-CA', 'ko']) {
    const r = await runa11yCoreOnHtml(html, { engineOptions: { customRules: [rule(withLiteral)], messages, locale }, runOnly: ['org-i'] });
    const c = r.checksResults[0], o = c.occurrences[0];
    const s = JSON.parse(renderSarifReport(r)).runs[0].results[0].message.text;
    console.log('literal=' + withLiteral, locale.padEnd(6), JSON.stringify(r.engine.locale.resolved), 'title', JSON.stringify(c.title), 'summary', JSON.stringify(o.summary), 'sarif', JSON.stringify(s.slice(0, 40)));
  }
})();
