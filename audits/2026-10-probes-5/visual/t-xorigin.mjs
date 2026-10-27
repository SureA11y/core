// Cross-origin CSS: served from localhost (other origin), with and without CORS; and via styleSheetTexts.
import { launch, serve, base2 } from './probe.mjs';
import fs from 'node:fs';
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const lock = '@media (orientation: portrait) { html { transform: rotate(-90deg); transform-origin: top left; } }';
const lockNested = '@media screen { @media (orientation: landscape) { body { transform: rotate(90deg) } } }';
const hideFocus = '.menu{position:absolute;left:-9999px} .menu a:focus{left:0}';
serve('/nocors/lock.css', lock); serve('/cors/lock.css', lock);
serve('/cors/imp.css', `@import url("${base2}/cors/lock.css");`);
serve('/nocors/imp-of-cors.css', `@import url("${base2}/cors/lock.css");`);
serve('/cors/layer.css', `@layer base { ${lock} }`);
serve('/cors/supports.css', `@supports (display:grid) { ${lock} }`);
serve('/cors/nested.css', lockNested);
serve('/cors/container.css', `@container (min-width: 1px) { ${lock} }`);
const page = (link) => `<!doctype html><html lang=en><head><title>t</title>${link}</head><body><main><p>Hello content here</p></main></body></html>`;
const cases = {
  noCors: `<link rel=stylesheet href="${base2}/nocors/lock.css">`,
  cors: `<link rel=stylesheet href="${base2}/cors/lock.css" crossorigin>`,
  corsNoAttr: `<link rel=stylesheet href="${base2}/cors/lock.css">`,
  corsImport: `<link rel=stylesheet href="${base2}/cors/imp.css">`,
  nocorsImportOfCors: `<link rel=stylesheet href="${base2}/nocors/imp-of-cors.css">`,
  layer: `<link rel=stylesheet href="${base2}/cors/layer.css">`,
  supports: `<link rel=stylesheet href="${base2}/cors/supports.css">`,
  nested: `<link rel=stylesheet href="${base2}/cors/nested.css">`,
  inlineLayer: `<style>@layer x { ${lock} }</style>`,
  inlineNested: `<style>${lockNested}</style>`,
  inlineSupports: `<style>@supports (display:grid) { ${lock} }</style>`,
  inlineCssNesting: `<style>html { @media (orientation: portrait) { transform: rotate(90deg); } }</style>`,
  adopted: `<script>const s=new CSSStyleSheet();s.replaceSync(${JSON.stringify(lock)});document.adoptedStyleSheets=[s]</script>`,
};
const b = await launch();
for (const [k, link] of Object.entries(cases)) {
  const ctx = await b.newContext({ viewport: { width: 400, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(serve('/x-' + k, page(link)));
  await p.addScriptTag({ content: BUNDLE });
  const r = await p.evaluate(async () => { const r = await window.a11ycore.runa11yCoreInPageAsync(location.href, null, {}, ['css-orientation-lock']); const c = r.checksResults[0]; return c.outcome + ' ' + c.occurrences.map((o) => o.data?.details?.reasonCode || o.i18n?.params?.reasonCode || '').join(','); });
  console.log(k.padEnd(20), r);
  await ctx.close();
}
// styleSheetTexts given
{
  const ctx = await b.newContext({ viewport: { width: 400, height: 800 } }); const p = await ctx.newPage();
  await p.goto(serve('/x-texts', page(`<link rel=stylesheet href="${base2}/nocors/lock.css">`)));
  await p.addScriptTag({ content: BUNDLE });
  const r = await p.evaluate(async (args) => { const r = await window.a11ycore.runa11yCoreInPageAsync(location.href, null, { styleSheetTexts: [{ href: args.href, text: args.text }] }, ['css-orientation-lock']); const c = r.checksResults[0]; return c.outcome + ' ' + c.occurrences.map((o) => o.data?.details?.reasonCode || '').join(','); }, { href: base2 + '/nocors/lock.css', text: lock });
  console.log('styleSheetTexts'.padEnd(20), r);
  const r2 = await p.evaluate(async (args) => { const r = await window.a11ycore.runa11yCoreInPageAsync(location.href, null, { styleSheetTexts: [{ href: args.href, text: '' }] }, ['css-orientation-lock']); const c = r.checksResults[0]; return c.outcome + ' ' + c.occurrences.map((o) => o.data?.details?.reasonCode || '').join(','); }, { href: base2 + '/nocors/lock.css' });
  console.log('styleSheetTexts lie'.padEnd(20), r2);
  await ctx.close();
}
await b.close();
