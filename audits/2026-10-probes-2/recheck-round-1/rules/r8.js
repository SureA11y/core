const {scan,show,close}=require('../../visual/h.js');
const L=['contrast-minimum','contrast-computable'];
const cases=[
 ['select closed', `<label>Pick <select><option style="color:#ccc">One</option><option style="color:#ccc;background:#fff">Unselected two</option></select></label>`],
 ['select closed fg only on unselected', `<label>Pick <select><option>One</option><option style="color:#ddd">Unselected two</option></select></label>`],
 ['left -9999', `<p style="position:absolute;left:-9999px;color:#ddd">offscreen text</p>`],
 ['h0 overflow hidden', `<div style="height:0;overflow:hidden"><p style="color:#ddd">hidden text</p></div>`],
 ['font-size 0', `<p style="font-size:0;color:#ddd">zero font text</p>`],
 ['color transparent', `<p style="color:transparent">transparent text</p>`],
 ['rgba .02', `<p style="color:rgba(0,0,0,.02)">nearly invisible text</p>`],
];
(async()=>{
 for (const vm of [undefined,'styleAndGeometry']) for (const [l,h] of cases) show(l+' vm='+vm, await scan(h,L,{engineOptions: vm?{visibilityMode:vm}:{}}));
 await close();
})();
