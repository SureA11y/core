const {run}=require('../visual/h.js');
const C=['contrast-minimum'];
(async()=>{
const cases=[
['1 opacity', '<span style="display:inline-block;opacity:.6;background:#000;color:#fff">New feature tag</span>',C],
['2 svg rect', '<svg width="200" height="40"><rect width="200" height="40" fill="#000"/><text x="10" y="25" fill="#ddd" font-size="16">Badge label</text></svg>',C],
['3 fill-color', '<p style="color:#eee;-webkit-text-fill-color:#000">Readable black text</p>',C],
['4 spacing', '<p style="font-size:11pt;line-height:1.5 !important">Some long paragraph text here that wraps around a bit and more.</p>',['avoid-inline-spacing']],
['5 tsc', '<div style="position:relative;width:400px"><div style="overflow:hidden;height:40px;width:200px"><span>Menu</span><div style="position:absolute;top:0;left:0;width:150px;border:1px solid #000;line-height:1.2">This dropdown tooltip text wraps on lines</div></div></div>',['text-spacing-content-loss']],
['6 zoom', '<p style="color:#888;font-size:12px;zoom:2">Zoomed text</p>',C],
['7 first-line', '<style>.f{color:#bbb}.f::first-line{color:#000}</style><p class="f">Single line paragraph black</p>',C],
['8 stroke', '<p style="color:#ddd;-webkit-text-stroke:2px #000;font-size:30px">Stroked text</p>',C],
['9 after-ul', '<style>a{color:#333;text-decoration:none;position:relative}a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:#333}</style><p>Read our <a href="/x">documentation page</a> for more details today.</p>',['link-in-text-block']],
['10 pipes', '<footer><p><a href="/p" style="color:#333;text-decoration:none">Privacy</a> | <a href="/t" style="color:#333;text-decoration:none">Terms</a></p></footer>',['link-in-text-block']],
['11 viewport', '<p>x</p>',['meta-viewport-zoom-enabled'],{head:'<meta name="viewport" content="user-scalable=yes maximum-scale=5">'}],
['12 orient', '<style>@media (orientation: portrait){ .does-not-exist{transform:rotate(90deg)} }</style><p>x</p>',['css-orientation-lock']],
['13 pager', '<ul style="display:flex;list-style:none"><li><a href="/1" style="font-size:12px">1</a></li><li><a href="/2" style="font-size:12px">2</a></li><li><a href="/3" style="font-size:12px">3</a></li></ul>',['target-size-minimum']],
];
const H=require("../visual/h.js"); for (const [l,h,r,o] of cases){ try{ H.show(l, await H.scan(h,r,o||{})); }catch(e){console.log(l,"ERR",e.message)} } await H.close();
})();
