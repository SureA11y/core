const {run}=require('./jsd');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const fs=require('fs');
const R=['img-alt-quality','link-name-quality','link-name-quality-link-only','form-control-label-quality','label-in-name','button-name-present','identical-links-same-purpose','dialog-name-present','form-control-programmatic-label-present','link-name-present'];
const payload = '"><img src=x onerror=alert(1)>';
const h=`<main>
<img src=a.png alt='${payload.replace(/'/g,'&#39;')}.png'>
<img src=a.png alt="&lt;/script&gt;&lt;script&gt;alert(2)&lt;/script&gt;.jpg">
<p>Report <a href="/r">click here</a></p>
<a href="/a">Read more</a><a href="/b">Read more</a>
<a href="javascript:alert(3)">Read more</a>
<label>Option <input type=checkbox></label><label>Option <input type=checkbox></label>
<button aria-label="&lt;b&gt;Bold&lt;/b&gt; ${'‮'}evil">Send</button>
<label style="display:none" for=q>&lt;svg onload=alert(4)&gt;</label><input id=q>
<dialog open><h2>&lt;img src=y onerror=alert(5)&gt;</h2></dialog>
</main>`;
(async()=>{ const r=await run(h,R);
 for (const c of r.checksResults) for (const o of c.occurrences||[]) console.log(c.ruleId, '|', o.summary, '|', (o.hint||'').slice(0,160));
 const html=renderHtmlReport(r,{});
 fs.writeFileSync('report-xss.html', html);
 const bad = [/<img src=x onerror/i, /<script>alert/i, /<svg onload/i, /<img src=y onerror/i, /<b>Bold<\/b>/, /href="javascript:/i];
 for (const b of bad) console.log('RAW', b, b.test(html));
 // also check ‮ in report
 console.log('RLO present', html.includes('‮'));
})();
