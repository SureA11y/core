const { runa11yCoreOnHtml } = require('/home/user/core-r9/src/testing.js');
const cases = [
 'width=device-width, maximum-scale=1', 'width=device-width, maximum-scale=1.5', 'width=device-width, maximum-scale=2', 'user-scalable=no', 'user-scalable=0', 'user-scalable = no', 'user-scalable=false', 'user-scalable=yes, maximum-scale=1.0', 'width=device-width;user-scalable=no', 'maximum-scale=1e0', 'maximum-scale=.5', 'maximum-scale=10, user-scalable=NO', 'maximum-scale=-1', 'maximum-scale=device-width', 'maximum-scale=1.0px', 'initial-scale=1,maximum-scale=1 ', 'user-scalable=1', 'user-scalable=2', 'maximum-scale=0', 'user-scalable=no,user-scalable=yes', 'user-scalable=yes,user-scalable=no',
];
(async () => {
  for (const c of cases) {
    const html = `<!doctype html><html lang=en><head><title>t</title><meta name="viewport" content="${c}"></head><body><main><p>x</p></main></body></html>`;
    const r = await runa11yCoreOnHtml(html, { runOnly: ['meta-viewport-zoom-enabled', 'meta-viewport-large'] });
    const res = (r.checksResults || r.results || []).map(x => x.ruleId + ':' + x.outcome + ' ' + (x.occurrences || []).map(o => o.data && o.data.details && o.data.details.reasonCode || '').join());
    console.log(JSON.stringify(c).padEnd(45), res.join(' | '));
  }
})();
