// Realistic native-extending libraries loaded before the scan (download into
// ./vendor first: cdnjs prototype 1.7.3 and 1.6.1, mootools-core 1.6.0, sugar
// 2.0.6, and zone.js 0.14.4 fesm2015 from jsdelivr, named as in V below), plus single
// Object.prototype pollution keys. Compared to the clean page.
const h = require('./harness');
const BODY = `<main><h1>T</h1><button></button><img src="a.png"><label>Name <input></label>
<a href="/x">Go</a><p style="color:#777;background:#fff">low contrast text</p>
<div role="button" tabindex="0"></div><input aria-labelledby="nope"><ul><div>bad</div></ul></main>`;
const page = (head) => `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body>${BODY}</body></html>`;
const V = {
  clean: '',
  prototype173: '<script src="../vendor/1.7.3-prototype.js"></script>',
  prototype161: '<script src="../vendor/1.6.1-prototype.js"></script>',
  mootools16: '<script src="../vendor/1.6.0-mootools-core.min.js"></script>',
  sugarExtended: '<script src="../vendor/2.0.6-sugar.min.js"></script><script>Sugar.extend()</script>',
  zonejs: '<script src="../vendor/fesm2015-zone.js"></script>',
  objProtoThen: '<script>Object.prototype.then=function(){}</script>',
  objProtoRole: '<script>Object.prototype.role="button"</script>',
  objProtoLength: '<script>Object.prototype.length=3</script>',
  objProtoOutcome: '<script>Object.prototype.outcome="pass"</script>',
  objProtoSelector: '<script>Object.prototype.selector="#zz"</script>',
  objProtoEnumerableFn: '<script>Object.prototype.each=function(){}</script>',
  objProtoToJSON: '<script>Object.prototype.toJSON=function(){return 1}</script>',
  arrayFilterIdentity: '<script>Array.prototype.filter=function(){return this}</script>',
};
(async () => {
  const base = h.summarize((await h.runChromium(page(''))).r);
  for (const [name, head] of Object.entries(V)) {
    const res = await h.runChromium(page(head), {}, { timeoutMs: 60000 });
    if (res.err) { console.log(JSON.stringify({ name, status: 'THROW', err: res.err.split('\n').slice(0, 3).join(' | ') })); continue; }
    const r = res.r || {};
    const s = h.summarize(r);
    const diffs = Object.keys(base).filter((k) => s[k] !== base[k]).map((k) => `${k}: ${base[k]} -> ${s[k]}`);
    console.log(JSON.stringify({ name, ms: Math.round(res.ms), nRules: (r.checksResults || []).length, resultKeys: Object.keys(r).length, ndiff: diffs.length, sample: diffs.slice(0, 5), pageErrors: res.pageErrors.slice(0, 2) }));
  }
  await h.closeBrowser();
})();
