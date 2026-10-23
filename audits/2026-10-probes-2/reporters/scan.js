const run = require('/home/user/core/tests/helpers/runa11yCoreOnHtml.js');
const fs = require('fs');
const html = `<!doctype html><html lang="en"><head><title>T</title></head><body>
<img src="a.png"><img src="b.png" alt="x</script><script>alert(1)</script>">
<a href="javascript:alert(1)"></a>
<button onclick="x" class="a&quot;b"></button>
<input type="text">
<p style="color:#777;background:#888">low contrast</p>
<div id="d"></div><div id="d"></div>
<div role="button">x\u0001\u0008y ]]> ￾</div>
<video src="v.mp4"></video>
<a href="#">click here</a>
</body></html>`;
for (const loc of ['en','de','fr','es','ja']) {
  const r = run(html, { url: 'https://example.test/a b?x="1"&y=<z>', engineOptions: { locale: loc, timestamp: '2026-01-01T00:00:00.000Z' } });
  fs.writeFileSync(`result.${loc}.json`, JSON.stringify(r, null, 1));
}
