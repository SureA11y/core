const { scanHtml, close } = require('./pw');
const html = `<!doctype html><html lang="en"><head><title>Tooltips page</title></head><body><main><h1>Shop</h1>
<p>Some text.</p>
<a href="/a" class="tip" data-tip="Opens account settings">Account</a>
<a href="/b" class="tip" data-tip="Opens cart">Cart</a>
<button class="tip" data-tip="Search the store">Search</button>
</main>
<script>
document.querySelectorAll('.tip').forEach((el) => {
  el.addEventListener('focus', () => {
    const t = document.createElement('div');
    t.className = 'tooltip'; t.setAttribute('role','tooltip'); t.id = 'tooltip';
    t.style.cssText = 'position:absolute;top:0;left:0;color:#bbb;background:#fff;font-size:12px';
    t.innerHTML = '<div class="tooltip-inner">' + el.dataset.tip + '</div>';
    document.body.appendChild(t); el.setAttribute('aria-describedby','tooltip'); el._tip = t;
  });
  el.addEventListener('blur', () => { const t = el._tip; el.removeAttribute('aria-describedby'); setTimeout(() => t.remove(), 400); });
});
</script></body></html>`;
(async () => {
  const a = await scanHtml(html);
  const b = await scanHtml(html);
  for (const c of a.r.checksResults) if (c.occurrences.length && c.outcome !== 'pass') console.log(c.ruleId, c.outcome, c.occurrences.map(o => o.selector + ' ' + (o.html||'').slice(0,60)).join(' | '));
  await close();
})();
