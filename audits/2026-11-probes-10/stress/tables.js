const { runa11yCoreOnHtml } = require('/home/user/core-r10/src/testing.js');
const ids = ['td-has-header','table-headers-attr-valid','table-th-has-data-cells','scope-attr-valid','empty-table-header'];
const cases = {
 headersOtherTable: `<table><tr><th id="h1">Name</th><th id="h2">Age</th></tr><tr><td>a</td><td>1</td></tr></table><table><tr><td headers="h1">x</td><td headers="h2">y</td></tr></table>`,
 headersSelf: `<table><tr><th id="h1">Name</th><th>Age</th></tr><tr><td id="c" headers="c">a</td><td>1</td></tr></table>`,
 headersToTd: `<table><tr><td id="t1">Name</td><td id="t2">Age</td></tr><tr><td headers="t1">a</td><td headers="t2">1</td></tr></table>`,
 rowheaders: `<table><tr><th scope="col">Item</th><th scope="col">Price</th></tr><tr><th scope="row">Apple</th><td>1</td></tr><tr><th scope="row">Pear</th><td>2</td></tr></table>`,
 rowgroup: `<table><thead><tr><th>Region</th><th>Q1</th></tr></thead><tbody><tr><th scope="rowgroup" rowspan="2">North</th><td>1</td></tr><tr><td>2</td></tr></tbody></table>`,
 roleColumnheader: `<table><tr><td role="columnheader">Name</td><td role="columnheader">Age</td></tr><tr><td>a</td><td>1</td></tr></table>`,
 scopeOnTd: `<table><tr><td scope="col">Name</td><td scope="col">Age</td></tr><tr><td>a</td><td>1</td></tr></table>`,
 scopeBad: `<table><tr><th scope="column">Name</th><th scope="cols">Age</th></tr><tr><td>a</td><td>1</td></tr></table>`,
 thNoData: `<table><tr><th>Name</th><th>Age</th><th>Notes</th></tr><tr><td>a</td><td>1</td></tr></table>`,
 colspanHeader: `<table><tr><th colspan="2">Totals</th></tr><tr><td>a</td><td>1</td></tr></table>`,
 headersMissingId: `<table><tr><th id="h1">Name</th><th id="h2">Age</th></tr><tr><td headers="h1 nope">a</td><td headers="h2">1</td></tr></table>`,
 headersHiddenTh: `<table><tr><th id="h1" hidden>Name</th><th id="h2">Age</th></tr><tr><td headers="h1">a</td><td headers="h2">1</td></tr></table>`,
 thEmptyCorner: `<table><tr><td></td><th scope="col">Q1</th></tr><tr><th scope="row">North</th><td>1</td></tr></table>`,
 thEmptyCornerTh: `<table><tr><th></th><th scope="col">Q1</th></tr><tr><th scope="row">North</th><td>1</td></tr></table>`,
 rolePresHasTh: `<table role="presentation"><tr><th>Name</th></tr><tr><td>a</td></tr></table>`,
 ariaTableGrid: `<div role="table"><div role="row"><span role="columnheader">Name</span></div><div role="row"><span role="cell">a</span></div></div>`,
};
const W = console.warn;
for (const [k, b] of Object.entries(cases)) {
  console.warn = () => {};
  const r = runa11yCoreOnHtml(`<!doctype html><html lang="en"><head><title>p</title></head><body><main><h1>h</h1>${b}</main></body></html>`, { entryPointParity:false, runOnly: ids });
  console.warn = W;
  console.log(k.padEnd(18), r.checksResults.map(c => c.ruleId.replace(/table-|-attr|-valid|-has/g,'') + '=' + c.outcome + (c.occurrences.length ? '[' + c.occurrences.map(o => (o.data && o.data.details && o.data.details.reasonCode || '?') + (o.lean ? '/' + o.lean.toward : '')).join(',') + ']' : '')).join(' '));
}
