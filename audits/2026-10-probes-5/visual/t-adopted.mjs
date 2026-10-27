import { launch, run, serve, base2 } from './probe.mjs';
const lock = '@media (orientation: portrait) { html { transform: rotate(-90deg); transform-origin: top left; } }';
const skip = '.skip{position:absolute;top:-40px} .skip:focus{top:0}';
const b = await launch();
const page = (head, body = '') => `<!doctype html><html lang=en><head><title>t</title>${head}</head><body>${body}<main id=main><p>Hello</p></main></body></html>`;
const adopt = (css) => `<script>const s=new CSSStyleSheet();s.replaceSync(${JSON.stringify(css)});document.adoptedStyleSheets=[s]</script>`;
serve('/nocors/skip.css', skip);
for (const [k, html, rules, eo] of [
  ['adopted lock', page(adopt(lock)), ['css-orientation-lock']],
  ['adopted skip focus', page('<style>.skip{position:absolute;top:-40px}</style>' + adopt('.skip:focus{top:0}'), '<a class=skip href=#main>Skip</a>'), ['css-hidden-focus']],
  ['xorigin skip focus no texts', page(`<link rel=stylesheet href="${base2}/nocors/skip.css">`, '<a class=skip href=#main>Skip</a>'), ['css-hidden-focus']],
  ['xorigin skip focus with texts', page(`<link rel=stylesheet href="${base2}/nocors/skip.css">`, '<a class=skip href=#main>Skip</a>'), ['css-hidden-focus'], { styleSheetTexts: [{ href: base2 + '/nocors/skip.css', text: skip }] }],
]) {
  const o = await run(b, '', { url: serve('/ad' + k.replace(/\W/g, ''), html), rules, engineOptions: eo, viewport: { width: 400, height: 800 } });
  console.log(k.padEnd(32), o.res.map((r) => r.outcome + ' ' + r.occ.map((x) => x.reason || '').join(',')).join(' | '));
}
await b.close();
