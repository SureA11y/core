// The report's "no failure is not conformance" note, in five locales, on a page with no failure and on one with.
'use strict';
const fs = require('fs');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const pass = '<!doctype html><html lang=en><head><title>Fine</title></head><body><main><h1>Fine</h1><p>Text.</p></main></body></html>';
const failing = '<!doctype html><html lang=en><head><title>Bad</title></head><body><main><h1>Bad</h1><img src=x.png></main></body></html>';
for (const l of ['en', 'de', 'es', 'fr', 'ja']) {
  const key = 'report_hero_notConformance';
  const txt = require('/home/user/core/src/i18n/' + l + '.json')[key];
  for (const [n, h] of [['pass', pass], ['fail', failing]]) {
    const r = runa11yCoreOnHtml(h, { engineOptions: { locale: l } });
    const fails = r.checksResults.filter((c) => c.outcome === 'fail').length;
    const html = renderHtmlReport(r);
    const esc = String(txt).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    console.log(l, n, 'fails=' + fails, 'note shown=' + (html.includes(txt) || html.includes(esc)), 'key in dict=' + !!txt);
  }
}
