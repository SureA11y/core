// Runtime keys of window.a11ycore vs the .d.ts; version vs package.json.
import { launch, open } from './h.mjs';
import fs from 'node:fs';
const b = await launch();
const { page, ctx } = await open(b, '<!doctype html><html lang=en><title>t</title><main><h1>x</h1></main>');
const keys = await page.evaluate(() => Object.keys(window.a11ycore).sort());
console.log('runtime keys', keys.join(' '));
const dts = fs.readFileSync('/home/user/core/surea11y.browser.d.ts', 'utf8');
const declared = [...dts.matchAll(/^\s*(?:const|function)\s+(\w+)/gm)].map((m) => m[1]);
console.log('declared not at runtime', declared.filter((k) => !keys.includes(k)));
console.log('runtime not declared', keys.filter((k) => !declared.includes(k)));
console.log('version', await page.evaluate(() => window.a11ycore.version), JSON.parse(fs.readFileSync('/home/user/core/package.json')).version);
console.log('sync return of runa11yCoreInPage is promise?', await page.evaluate(() => { const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, ['img-alt-present']); return typeof r.then; }));
await ctx.close(); await b.close();
