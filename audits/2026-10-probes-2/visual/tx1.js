const R=['text-spacing-content-loss'];
require('./h').run([
 ['abs popup escaping non-positioned overflow:hidden parent', `<div style="position:relative;width:400px"><div style="overflow:hidden;height:40px;width:200px;background:#eee"><span>Menu</span><div style="position:absolute;top:0;left:0;width:150px;background:#fff;border:1px solid #000;font-size:16px;line-height:1.2">This dropdown tooltip text wraps on lines</div></div></div>`],
 ['fixed toast inside overflow hidden', `<div style="overflow:hidden;height:30px;width:200px"><div style="position:fixed;top:0;left:300px;width:150px;line-height:1.1">Saved your changes to the document now</div></div>`],
 ['control: genuinely clipped', `<div style="overflow:hidden;height:40px;width:150px;line-height:1.1">This text is inside a box that clips it hard</div>`],
],R);
