// aria-live="off" inside aria-live="polite": what does Chromium expose for the inner region,
// and what does the hook record?
import { open, serve, HOOKS } from './h.mjs';
import fs from 'node:fs';
const b = await open();
for (const html of [
  `<div id=o aria-live=polite><div id=s aria-live=off>x</div></div>`,
  `<div id=o aria-live=polite><div id=s role=status aria-live=off>x</div></div>`
]) {
  const ctx = await b.newContext(); const page = await ctx.newPage();
  await page.addInitScript({ content: HOOKS.live });
  await page.goto(serve(html + `<script>addEventListener('load',()=>setTimeout(()=>s.textContent='Saved',30))</script>`));
  await page.waitForTimeout(200);
  const cdp = await ctx.newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const pr = nodes.filter((n) => (n.properties || []).some((p) => /live/.test(p.name))).map((n) => `${n.role?.value}:${n.name?.value || ''}[${n.properties.filter((p) => /live|root|busy/.test(p.name)).map((p) => p.name + '=' + JSON.stringify(p.value.value)).join(' ')}]`);
  await page.addScriptTag({ content: fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8') });
  const ann = await page.evaluate(() => window.a11ycore.getAnnouncements().map((a) => a.politeness + ':' + a.text));
  console.log(html, '\n  AX:', pr.join(' | '), '\n  hook announcements:', JSON.stringify(ann));
  await ctx.close();
}
await b.close();
