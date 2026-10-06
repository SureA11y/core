const { scanHtml, close } = require('./pw');
const names = ['id','attributes','children','childNodes','nodeName','tagName','localName','nodeType','getAttribute','hasAttribute','parentNode','parentElement','ownerDocument','textContent','innerText','firstChild','firstElementChild','nextSibling','nextElementSibling','previousElementSibling','lastChild','style','className','classList','shadowRoot','getRootNode','matches','closest','contains','getBoundingClientRect','getClientRects','namespaceURI','title','lang','dir','hidden','inert','role','ariaLabel','labels','elements','action','method','name','length','querySelector','querySelectorAll','assignedSlot','isConnected','offsetParent','tabIndex','focus','dataset','outerHTML','innerHTML','checkVisibility','computedStyleMap','getAttributeNode','attributeStyleMap','autocomplete','noValidate','target','enctype','acceptCharset','rel','part','slot','toString','valueOf','constructor','hasOwnProperty'];
function page(prefix) {
  return `<!doctype html><html lang="en"><head><title>Clobber test</title></head><body><main><h1>Form</h1>
<form id="f1" aria-label="Sign up" class="c" title="Sign up form" lang="en" role="form">
${names.map(n => `<input name="${prefix}${n}" type="text">`).join('\n')}
<label for="ok">Ok</label><input id="ok"><button></button><img src="x.png">
</form>
<form name="${prefix}id" aria-labelledby="h"><h2 id="h">Second</h2><input name="${prefix}tagName" aria-label="x"></form>
</main></body></html>`;
}
const summ = (r) => { const o = {}; for (const c of r.checksResults) o[c.ruleId] = c.outcome + ':' + c.occurrences.length; return o; };
(async () => {
  const a = await scanHtml(page('z'));
  const b = await scanHtml(page(''));
  if (a.err || b.err) console.log(a.err, b.err);
  const sa = summ(a.r), sb = summ(b.r);
  for (const k of Object.keys(sa)) if (sa[k] !== sb[k]) console.log('DIFF', k, sa[k], '->', sb[k]);
  const errs = b.r.checksResults.filter(c => c.error).map(c => c.ruleId + ': ' + c.error);
  console.log('errs', errs);
  // selectors pointing at form
  for (const c of b.r.checksResults) for (const o of c.occurrences) if (/form/.test(o.selector) && !/input|button|img|label/.test(o.selector)) console.log(c.ruleId, o.selector);
  await close();
})();
