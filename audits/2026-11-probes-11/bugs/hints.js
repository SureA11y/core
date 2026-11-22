const { cr, js, rule, brief, page, close } = require('./h.js');
const ID = 'contrast-minimum';
const C = [
 ['font color attr', '<p><font color="#eeeeee">Old font tag text</font></p>'],
 ['font color named', '<p><font color="silver">Old font tag silver</font></p>'],
 ['body text attr', null, '<!doctype html><html lang="en"><head><title>Hints probe page</title></head><body text="#eeeeee"><main><h1 style="color:#000">T</h1><p>Body text attr</p></main></body></html>'],
 ['td bgcolor dark w/ black text', '<table><tr><td bgcolor="#222222">Dark cell with default text</td></tr></table>'],
 ['table bgcolor', '<table bgcolor="#111111"><tr><td>Dark table default text</td></tr></table>'],
 ['svg text fill attr', '<svg width="200" height="30"><text x="0" y="20" fill="#eee">SVG text label</text></svg>'],
 ['svg text style fill', '<svg width="200" height="30"><text x="0" y="20" style="fill:#eee">SVG text label</text></svg>'],
 ['svg g fill inherited', '<svg width="200" height="30"><g fill="#eee"><text x="0" y="20">SVG text label</text></g></svg>'],
];
(async () => {
  for (const [l, b, full] of C) {
    const h = full || page(b);
    const a = brief(rule(js(h, [ID]), ID)); const c = brief(rule(await cr(h, [ID]), ID));
    console.log('### ' + l + '\n  chrome: ' + c.slice(0, 200) + '\n  jsdom : ' + a.slice(0, 200));
  }
  await close();
})();
