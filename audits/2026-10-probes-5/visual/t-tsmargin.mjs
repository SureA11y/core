// text-spacing margin band: box width set so that, with the spacing, the text ends N px inside the edge.
import { launch, run } from './probe.mjs';
const b = await launch();
const SP = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }';
for (const room of [-1, 1, 5.5, 6.5, 8]) {
  const html = `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px/1.2 Arial} #a{white-space:nowrap;overflow:hidden;display:block}</style></head><body><div id=a><span id=s>Label text</span></div></body></html>`;
  const o = await run(b, html, { rules: ['text-spacing-content-loss'], before: async (p) => {
    await p.evaluate(({ SP, room }) => { const st = document.createElement('style'); st.textContent = SP; document.head.append(st); const w = document.getElementById('s').getBoundingClientRect().width; st.remove(); document.getElementById('a').style.width = (w + room) + 'px'; }, { SP, room });
  } });
  const r = o.res[0];
  console.log('room', room, r.outcome, r.margin ? `margin value ${r.margin.value} headroom ${r.margin.headroom}` : 'no margin', r.occ.map((x) => x.reason).join(','));
}
await b.close();
