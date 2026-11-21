// duplicate-id-aria on repeated cards (each card: id="title" + a link aria-labelledby="title"), time vs N; nested deeper cards too
const { runa11yCoreOnHtml } = require(process.env.CORE || '/home/user/core-r8/src/testing.js');
console.warn = () => {};
const depth = Number(process.argv[3] || 0);
for (const N of (process.argv[2] || '400,800,1600').split(',').map(Number)) {
  let s = '';
  const open = '<div>'.repeat(depth), close = '</div>'.repeat(depth);
  for (let i = 0; i < N; i++) s += `<div class="card">${open}<h3 id="title">Card ${i}</h3><a href="/p${i}" aria-labelledby="title">Open</a>${close}</div>`;
  const html = `<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1>${s}</main></body></html>`;
  const t = Date.now();
  const r = runa11yCoreOnHtml(html, { runOnly: ['duplicate-id-aria'] });
  const c = r.checksResults[0];
  console.log({ N, depth, ms: Date.now() - t, occ: c.occurrences.length, mb: +(JSON.stringify(c).length / 1048576).toFixed(2) });
}
