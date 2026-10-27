import { launch } from './probe.mjs';
const b = await launch();
const p = await b.newPage();
await p.setContent(`<style>#a,#a::picker(select){appearance:base-select} #a{color:#aaa}</style><select id=a aria-label=x><option>First choice</option><option>Second</option></select>`);
console.log(await p.evaluate(() => [...document.querySelectorAll('option')].map((o) => { const r = o.getBoundingClientRect(); return [getComputedStyle(o).color, getComputedStyle(o).backgroundColor, r.width, r.height, o.checkVisibility()]; })));
await b.close();
