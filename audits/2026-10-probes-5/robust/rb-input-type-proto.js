// aria-allowed-attr on an <input> whose type attribute is "constructor" or "__proto__".
const { scan, sum } = require('./j.js');
for (const t of ['text', 'foo', 'constructor', '__proto__', 'CONSTRUCTOR', 'tostring', 'hasownproperty', 'valueof']) {
  for (const attr of ['aria-pressed="true"', 'aria-label="x"']) {
    const r = scan(`<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><label>Name <input type="${t}" ${attr}></label></main></body></html>`, { runOnly: ['aria-allowed-attr', 'aria-prohibited-attr', 'aria-conditional-attr'] });
    console.log(`type=${t} ${attr}:`, sum(r).replace(/\n/g, ' | '));
  }
}
