// Elements Chromium exposes as headings/landmarks that inspect() leaves out, and engine rule verdicts on input buttons.
import { launch, open } from './h.mjs';
import fs from 'node:fs';
const html = fs.readFileSync(new URL('./p05-inspect-vs-ax.mjs', import.meta.url), 'utf8').match(/const html = `([\s\S]*?)`;/)[1];
const b = await launch();
const { page, ctx } = await open(b, html);
const rows = await page.evaluate(async () => ({ h: await a11ycore.inspect('headings', { draw: false }), l: await a11ycore.inspect('landmarks', { draw: false }) }));
const cdp = await ctx.newCDPSession(page);
const { nodes } = await cdp.send('Accessibility.getFullAXTree');
const lm = new Set(['banner', 'navigation', 'main', 'region', 'form', 'complementary', 'search', 'contentinfo']);
console.log('Chromium headings:', nodes.filter((n) => !n.ignored && n.role?.value === 'heading').map((n) => n.name?.value).join(' | '));
console.log('inspect headings :', rows.h.map((r) => r.name).join(' | '));
console.log('Chromium landmarks:', nodes.filter((n) => !n.ignored && lm.has(n.role?.value)).map((n) => n.role.value + ':' + (n.name?.value || '')).join(' | '));
console.log('inspect landmarks :', rows.l.map((r) => r.role + ':' + r.name).join(' | '));
const r = await page.evaluate(() => a11ycore.runa11yCoreInPage(location.href, null, {}, null));
for (const c of r.checksResults) for (const o of c.occurrences || []) if (/#(ib|is|ir|t3|r1|r3|ah)\b/.test(o.selector)) console.log('engine', c.ruleId, c.outcome, o.tier || '', o.selector);
await ctx.close(); await b.close();
