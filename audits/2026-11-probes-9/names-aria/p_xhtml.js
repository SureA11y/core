const { runa11yCoreOnHtml } = require('/home/user/core-r9/src/testing.js');
const x=(attrs)=>`<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" ${attrs}><head><title>T</title></head><body><p>Hello world</p></body></html>`;
for (const a of ['xml:lang="en"','lang="en"','xml:lang="en" lang="fr"','xml:lang="fr" lang="en"']) {
  const r=runa11yCoreOnHtml(x(a),{contentType:'application/xhtml+xml',runOnly:['html-lang-attr-present','html-xml-lang-mismatch','valid-lang'],entryPointParity:false}).checksResults;
  console.log(a.padEnd(28), r.map(c=>c.ruleId+'='+c.outcome+(c.occurrences.length?'['+c.occurrences.map(o=>o.data.details.reasonCode).join(',')+']':'')).join('  '));
}
