const { definePack } = require('/home/user/core-r8/src/pack.js');
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderHtmlReport } = require('/home/user/core-r8/src/report.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const X = '<img src=x onerror=alert(1)>{{a|v}}</textarea></script>';
const pack = definePack({ name: 'acme-pack', version: '1.0.0', namespace: 'acme', core: '*',
  rules: [{ id: 'acme-r', meta: { i18n: { titleKey: 'acme_r_title' }, title: 'T ' + X, description: 'D ' + X, tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'], reasonCodes: ['CODE'], helpUrl: 'javascript:alert(1)',
    review: { CODE: { steps: ['Step ' + X, 'Step 2 [link](javascript:alert(1)) **b**'], passWhen: 'P ' + X, failWhen: 'F ' + X } } },
    runInPage: function () { return { outcome: 'cantTell', occurrences: [{ selector: 'p', summary: 'S ' + '<b>x</b>', data: { details: { reasonCode: 'CODE' } } }] }; } }] });
(async () => {
  console.warn = (...a) => console.log('warn', String(a[0]).slice(0, 150));
  const r = await runa11yCoreOnHtml('<html lang="en"><head><title>t</title></head><body><p>x</p></body></html>', { engineOptions: { packs: [pack] }, runOnly: ['acme-r'] });
  const h = renderHtmlReport(r, { packs: [pack] });
  require('fs').writeFileSync('out-p29.html', h);
  console.log('raw <img onerror:', /<img src=x onerror/.test(h), '| javascript: href:', /href=["']?javascript:/i.test(h), '| raw </textarea>:', h.includes('</textarea></script>'), '| step shown:', h.includes('Step &lt;img'));
  const s = renderSarifReport(r, { packs: [pack] }); console.log('sarif helpUri', JSON.stringify(JSON.parse(s).runs[0].tool.driver.rules.map(x => x.helpUri)));
  console.log('sarif markdown?', /javascript:alert/.test(s) ? (s.match(/.{60}javascript:alert.{20}/g) || []).slice(0, 3) : 'none');
})();
;(async () => {
  const r = await runa11yCoreOnHtml('<html lang="en"><head><title>t</title></head><body><p>x</p></body></html>', { engineOptions: { packs: [pack] }, runOnly: ['acme-r'] });
  const s = JSON.parse(renderSarifReport(r, { packs: [pack] }));
  const walk = (o, p) => { if (typeof o === 'string') { if (o.includes('javascript:') || o.includes('<img')) console.log('PATH', p, JSON.stringify(o).slice(0, 200)); } else if (o && typeof o === 'object') for (const k of Object.keys(o)) walk(o[k], p + '.' + k); };
  walk(s, '$');
})();
