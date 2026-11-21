const { run, show, close, shot } = require('./h');
(async () => {
 const html = `<div><label style="display:block"><input type="checkbox"> Accept terms</label><label style="display:block"><input type="checkbox"> News</label></div>`;
 const r = await run(html, ['target-size-minimum'], { eo: { } });
 console.log(JSON.stringify(r.res, null, 1).slice(0, 3000));
 const s = await shot(html, { eval: () => [...document.querySelectorAll('input,label')].map(e => JSON.stringify(e.getBoundingClientRect())) });
 console.log(s.ev);
 const html2 = `<div><input type="checkbox" aria-label="a" style="display:block"><input type="checkbox" aria-label="b" style="display:block"></div>`;
 const r2 = await run(html2, ['target-size-minimum']); show('stacked bare', r2, true);
 const html3 = `<ul style="list-style:none;padding:0;margin:0;line-height:18px"><li><a href="#">Home page</a></li><li><a href="#">About us</a></li><li><a href="#">Contact</a></li></ul>`;
 const r3 = await run(html3, ['target-size-minimum']); show('stacked nav', r3, true);
 await close();
})();
