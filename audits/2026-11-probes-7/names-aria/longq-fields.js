// Which fields of a result carry a long page value (round 7, AN-3).
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const X = 'x'.repeat(200000);
const pages = {
  'identical-links-same-purpose': `<a href="/${X}">Read more</a><a href="/b">Read more</a>`,
  'image-redundant-alt': `<figure><img src="a.png" alt="${X}"><figcaption>${X}</figcaption></figure>`,
  'label-in-name': `<button aria-label="${X}">Send</button>`
};
function big(o, path, out) {
  if (typeof o === 'string') { if (o.length > 5000) out.push(`${path} ${o.length}`); return; }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) big(v, `${path}.${k}`, out);
}
for (const [id, body] of Object.entries(pages)) {
  const r = runa11yCoreOnHtml(`<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>h</h1>${body}</main></body></html>`, { rules: { include: id } });
  const c = r.checksResults.find((x) => x.ruleId === id);
  const out = []; big(c, id, out); console.log(out.join('\n') || `${id}: nothing over 5000`);
}
