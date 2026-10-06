const R=['contrast-minimum','contrast-computable'];
require('./h').run([
 ['abs dropdown below overflow:hidden non-positioned parent, low contrast', `<div style="position:relative"><div style="overflow:hidden;height:30px;background:#fff"><span style="color:#000">Menu</span><div style="position:absolute;top:40px;left:0;color:#ccc;background:#fff">Low contrast dropdown item</div></div></div>`],
],R);
