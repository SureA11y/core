// highlight()/inspect() with iframes, shadow DOM, hostile names; do boxes land on the right element?
import { launch, open, serve } from './h.mjs';
const inner = serve(`<!doctype html><html lang=en><title>f</title><body><img src="data:," id=frameimg style="width:50px;height:50px"><button id=fb></button></body>`, { path: '/inner.html' });
const html = `<!doctype html><html lang=en><title>t</title><body><main>
<h2 aria-label="<img src=x onerror=alert(1)>">Visible</h2>
<button id=topb style="margin-left:400px">ok</button>
<img id=topimg src="data:," style="width:30px;height:30px;margin-left:700px">
<iframe src="/inner.html" title="frame" style="width:300px;height:200px"></iframe>
<div id=host></div>
<script>const r=document.getElementById('host').attachShadow({mode:'open'}); r.innerHTML='<button id=sb></button><h3>Shadow heading</h3>';</script>
</main></body></html>`;
const b = await launch();
const { page, ctx } = await open(b, html);
const out = await page.evaluate(async () => {
  window.alerted = 0; window.alert = () => window.alerted++;
  const r = await a11ycore.run();
  const occ = [];
  for (const c of r.checksResults) if (c.outcome === 'fail' || c.outcome === 'cantTell') for (const o of c.occurrences || []) occ.push({ rule: c.ruleId, sel: o.selector, hosts: o.shadowHostSelectors, frame: o.frameSelector || o.framePath || o.frameUrl || o.frame || null, keys: Object.keys(o).join(',') });
  const n = a11ycore.highlight(r);
  const boxes = [...document.querySelector('[data-surea11y-highlights]').shadowRoot.querySelectorAll('.box')].map((b) => ({ l: b.style.left, t: b.style.top, w: b.style.width, label: b.textContent }));
  const rect = (el) => { const q = el.getBoundingClientRect(); return [q.left, q.top + scrollY, q.width]; };
  const head = await a11ycore.inspect('headings');
  const names = await a11ycore.inspect('names');
  return { n, boxes, occ: occ.filter((o) => /img|button|name/.test(o.rule)), rects: { topb: rect(topb), topimg: rect(topimg), sb: rect(host.shadowRoot.getElementById('sb')) }, head, names, alerted: window.alerted, tagHTML: document.querySelector('[data-surea11y-highlights]').shadowRoot.innerHTML.slice(0, 600) };
});
console.log(JSON.stringify(out, null, 1));
await ctx.close(); await b.close();
