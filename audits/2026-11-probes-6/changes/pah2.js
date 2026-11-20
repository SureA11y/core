const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const page = (b) => `<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>P</h1>${b}</main></body></html>`;
function go(name, body) {
  const r = runa11yCoreOnHtml(page(body), { runOnly: ['p-as-heading'] }).checksResults[0];
  console.log('## ' + name + ': ' + r.outcome + ' ' + JSON.stringify(r.occurrences.map(o => [o.html.slice(0, 60), o.data.details.reasonCode, o.data.details.fontSizePx, o.summary])));
}
go('address block', '<p><b>Acme Ltd</b></p><p><b>1 Main St</b></p><p>Phone 123</p>');
go('address block 3 bold lines', '<p><b>Acme Ltd</b></p><p><b>1 Main St</b></p><p><b>Springfield</b></p><p>Open daily from nine.</p>');
go('24px p with semibold span', '<p style="font-size:24px"><span style="font-weight:600">Opening hours</span></p><p>Monday to Friday.</p>');
go('30px p with 600 span', '<p style="font-size:30px"><span style="font-weight:600">Opening hours</span></p><p>Monday to Friday.</p>');
