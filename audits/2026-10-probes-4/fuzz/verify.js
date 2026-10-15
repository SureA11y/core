const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const page = l => `<!doctype html><html lang="${l}"><head><title>Cats and dogs</title></head><body><main><h1>Overview of cats</h1><label for=i>Your name</label><input id=i><a href=/x>Cat food guide</a><img src=a.png alt="image"></main></body></html>`;
for (const l of ['en','constructor']) {
  const r = runa11yCoreOnHtml(page(l), { runOnly: ['heading-quality','link-name-quality','page-title-patterns','img-alt-quality'], entryPointParity:false });
  console.log(l, r.checksResults.map(c=>`${c.ruleId}:${c.outcome}${c.error?' ERR '+String(c.error.message||c.error).slice(0,50):''}`).join(' | '));
}
const deep = n => `<!doctype html><html lang=en><head><title>t</title></head><body><main>${'<div>'.repeat(n)}x${'</div>'.repeat(n)}</main></body></html>`;
for (const n of [100,200]) { const t=Date.now(); runa11yCoreOnHtml(deep(n),{runOnly:['p-as-heading'],entryPointParity:false}); console.log('p-as-heading depth',n,Date.now()-t,'ms'); }
