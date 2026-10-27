// inspect('headings'|'landmarks'|'names'|'focus-order') vs Chromium's AX tree and Tab order.
import { launch, open } from './h.mjs';
import { axCompare } from './axcmp.mjs';
const html = `<!doctype html><html lang=en><title>t</title><body>
<header id=hd><a href=/>Home</a></header>
<nav id=n1><a href=/x>X</a></nav>
<main id=mn><header id=mhd>in main</header><section id=s1><h2>sec</h2><aside id=as1>aside in section</aside></section>
<section id=s2 aria-label="Named section">.</section><form id=f1><input aria-label=q></form><form id=f2 aria-label="Search form"><input aria-label=q2></form>
<aside id=as2>top aside in main</aside><search id=srch><input aria-label=s></search>
<h1 role=none id=hn>Heading role none</h1>
<h2 aria-level=9 id=h9>level nine</h2><div role=heading id=hdef>default level</div><div role=heading aria-level=0 id=h0>level zero</div>
<h3 aria-level="2.7" id=h27>2.7</h3><h4 hidden>hidden</h4><h5 aria-hidden=true id=hah>aria-hidden heading</h5>
<h6><span aria-hidden=true>X</span>Ok<img alt="pic" src="data:,"></h6>
<button aria-labelledby=lb id=b1>content</button><span id=lb>Labelled</span>
<input type=button value="Value btn" id=ib><input type=submit id=is><input type=reset id=ir><input type=image src="data:," alt="Img btn" id=ii>
<input id=t1 title="Title only"><label>Wrapped <input id=t2></label><input id=t3 placeholder="Ph"><select id=sel aria-label=Pick><option>a</option></select>
<a href=/y title="Tip">  </a><a href=/z><img src="data:," alt=""></a><button><svg role=img aria-label="Icon"></svg></button>
<div role=checkbox aria-checked=false tabindex=0 id=cb>Agree <b>now</b></div>
<input type=radio name=g id=r1 aria-label=r1><input type=radio name=g id=r2 aria-label=r2 checked><input type=radio name=g id=r3 aria-label=r3>
<div aria-hidden=true><a href=/hidden id=ah>Hidden link still tabbable</a></div>
<a href=/p tabindex=2 id=p2>pos2</a><a href=/p1 tabindex=1 id=p1>pos1</a>
<div style="overflow:auto;height:40px" id=scroller><div style="height:200px">scroll</div></div>
<details><summary>Sum</summary>x</details><button disabled>dis</button><a href=/inert inert>inert</a>
<fieldset disabled><button id=fdb>in disabled fieldset</button></fieldset>
<button style="visibility:hidden">vh</button><button style="opacity:0" id=op>op</button>
</main><footer id=ft>f</footer></body></html>`;
const b = await launch();
const { page, ctx } = await open(b, html);
for (const kind of ['headings', 'landmarks', 'names', 'focus-order']) {
  const { out } = await axCompare(page, kind);
  console.log('==', kind);
  for (const { row, ax } of out) {
    const nameDiff = ax && (row.name || '') !== (ax.name || '');
    const levelDiff = kind === 'headings' && ax && row.level !== ax.level;
    const roleDiff = kind !== 'headings' && ax && row.role !== ax.role;
    console.log((nameDiff || levelDiff || roleDiff ? '!! ' : '   ') + JSON.stringify(row) + ' AX=' + JSON.stringify(ax));
  }
}
// Real Tab order
await page.evaluate(() => document.activeElement.blur());
await page.evaluate(() => { const a = document.createElement('div'); a.id='__start'; a.tabIndex=-1; document.body.prepend(a); a.focus(); });
const order = [];
for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); const id = await page.evaluate(() => { const e = document.activeElement; return e === document.body ? 'BODY' : (e.id || e.outerHTML.slice(0, 40)); }); if (order.includes(id) && id !== 'BODY') break; order.push(id); }
console.log('real Tab order', order.join(' , '));
await ctx.close(); await b.close();
