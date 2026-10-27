// Can a display:contents element with tabindex take focus in this Chromium (by script and by Tab)?
// And which of the no-op onclick variants fail.
import { open, scan, show, serve } from './h.mjs';
const b = await open();
const ctx = await b.newContext(); const page = await ctx.newPage();
await page.goto(serve(`<button id=first>first</button><span id=s role=button tabindex=0 style="display:contents" onclick="document.title='clicked'">Go</span><button id=last>last</button>`));
const byScript = await page.evaluate(() => { s.focus(); return document.activeElement.id; });
await page.evaluate(() => first.focus());
await page.keyboard.press('Tab');
const byTab = await page.evaluate(() => document.activeElement.id);
const ax = await (await ctx.newCDPSession(page)).send('Accessibility.getFullAXTree');
const node = ax.nodes.find((n) => n.name?.value === 'Go');
console.log('version', b.version(), 'focus() ->', byScript, ' Tab from #first ->', byTab, ' AX focusable:', JSON.stringify(node?.properties?.find((p) => p.name === 'focusable')));
await ctx.close();
for (const v of ['javascript:void(0)', 'javascript:void(0);', 'void (0)', 'return false', 'return(false)', 'event.preventDefault(); return false;', 'javascript:return false']) {
  const r = await scan(b, `<span role=button onclick="${v}">Go</span>`, { runOnly: ['click-handler-keyboard-operable'] });
  console.log(JSON.stringify(v).padEnd(42), r.rules['click-handler-keyboard-operable'].outcome);
}
await b.close();
