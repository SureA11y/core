const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const { renderSarifReport } = require('@surea11y/core/sarif');
const { renderJunitReport } = require('@surea11y/core/junit');
const { renderHtmlReport } = require('@surea11y/core/report');
const fs = require('fs');
const pack = require('./gen/acme-a11y'), city = require('./gen/city-standard');
const html = fs.readFileSync('/home/user/core-r9/tests/fixtures/all-pass.html','utf8') + fs.readFileSync('/home/user/core-r9/tests/fixtures/heading-order-all-scenarios.html','utf8');
const eo = () => ({ packs: [pack, city], profile: ['wcag22-aa','acme-policy','city-1.0'], timestamp: '2026-01-01T00:00:00Z', locale: 'fr' });
const outs = [];
for (let i = 0; i < 3; i++) {
  const r = runa11yCoreOnHtml(html, { engineOptions: eo(), entryPointParity: false });
  outs.push([JSON.stringify(r), renderSarifReport(r, {packs:[pack,city]}), renderJunitReport(r, {packs:[pack,city]}), renderHtmlReport(r, {packs:[pack,city]})]);
}
for (let k = 0; k < 4; k++) console.log(['json','sarif','junit','html'][k], outs.every(o=>o[k]===outs[0][k]) ? 'identical' : 'DIFFER', outs.map(o=>o[k].length));
