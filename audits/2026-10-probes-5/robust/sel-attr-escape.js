// Does an attribute-value selector round-trip values with <, >, &, quotes?
const { createDom, runa11yCoreOnDom } = require('/home/user/core/src/testing.js'); console.warn = () => {};
for (const v of ['<b>', '&lt;b&gt;', 'a"b', "a'b", 'a&b', 'a\\b', 'a\nb', '日本']) {
  const esc = v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><input aria-label="${esc}" aria-invalid="true"><input aria-label="${esc}" aria-invalid="true" aria-errormessage="nope"><input aria-label="other"></main></body></html>`;
  const dom = createDom(html); const doc = dom.window.document;
  const r = runa11yCoreOnDom(dom, { entryPointParity: false, runOnly: ['invalid-field-error-message'] });
  for (const o of r.checksResults[0].occurrences) { let el; try { el = doc.querySelector(o.selector); } catch (e) { el = 'THROW ' + e.message; } console.log(JSON.stringify(v), '->', o.selector, el && el.getAttribute ? 'matches' : 'NO MATCH ' + el); }
}
