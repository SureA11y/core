const { page, withBrowser, scan } = require('./harness');
(async () => { await withBrowser(async (b) => {
  const r = await scan(b, page('', '<div style="overflow-x:auto;width:280px"><nav id="n" style="margin-left:100px;width:200px">Menu links here</nav></div>'), { raw: true });
  const o = r.check.occurrences[0]; console.log(r.check.outcome, o && o.data.details.reasonCode, o && o.summary || o && o.message, o && o.data.details.widthPx);
}); })();
