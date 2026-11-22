const {run4,setMsg}=require('./rh.js');setMsg(130);
const W=(b,head='',title='t')=>`<!doctype html><html lang=en><head><title>${title}</title>${head}</head><body><main><h1>h</h1>${b}</main></body></html>`;
const P=['p-as-heading'],PT=['page-title-patterns'],FG=['form-group-name-present'],DE=['deprecated-elements-not-used'],APC=['aria-prohibited-children'],TD=['td-has-header','table-th-has-data-cells'];
const filler='<p>'+'Lorem ipsum dolor sit amet consectetur. '.repeat(8)+'</p>';
const cases=[
 ['P1 bold label + colon alone',P,W('<p><strong>Ingredients</strong>:</p>'+filler)],
 ['P2 run-in bold label + colon + text (not a heading)',P,W('<p><strong>Note</strong>: orders placed after 2 pm ship the next working day.</p>'+filler)],
 ['P3 bold 9 words',P,W('<p><b>How to choose the right size for your new bike</b></p>'+filler)],
 ['P4 WP block bold line',P,W('<p class="wp-block-paragraph"><strong>Shipping and returns</strong></p>'+filler)],
 ['PT1 Yoast placeholder',PT,W('', '', '%%title%% %%sep%% %%sitename%%')],
 ['PT2 WP sample page',PT,W('', '', 'Sample Page – My Shop')],
 ['PT3 template braces',PT,W('', '', '{{ page.title }} | Acme')],
 ['PT4 Untitled document',PT,W('', '', 'Untitled document')],
 ['PT5 real title containing word Document',PT,W('', '', 'Document signing for small firms – Acme')],
 ['FG1 radios same name split over two fieldsets',FG,W('<fieldset><legend>Size</legend><label><input type=radio name=s>S</label><label><input type=radio name=s>M</label></fieldset><fieldset><legend>More sizes</legend><label><input type=radio name=s>L</label></fieldset>')],
 ['FG2 radios mixed: some in fieldset, some out',FG,W('<fieldset><legend>Pay</legend><label><input type=radio name=p>Card</label></fieldset><label><input type=radio name=p>Cash</label>')],
 ['FG3 combobox popup listbox with options',FG,W('<label for=c>Country</label><input id=c role=combobox aria-controls=lb aria-expanded=true><ul role=listbox id=lb><li role=option>Spain</li><li role=option>France</li></ul>')],
 ['FG4 WooCommerce shipping methods',FG,W('<table><tr><th>Shipping</th><td><ul id=shipping_method><li><input type=radio name="shipping_method[0]" id=a value=flat><label for=a>Flat rate</label></li><li><input type=radio name="shipping_method[0]" id=b value=free><label for=b>Free shipping</label></li></ul></td></tr></table>')],
 ['DE1 classic marquee onmouseover stop',DE,W('<marquee onmouseover="this.stop()" onmouseout="this.start()">News</marquee>')],
 ['DE2 hover script wrapped in DOMContentLoaded',DE,W('<marquee id=m>News</marquee><script>document.addEventListener("DOMContentLoaded",function(){var m=document.getElementById("m");m.addEventListener("mouseover",function(){m.stop()});m.addEventListener("mouseout",function(){m.start()})});</script>')],
 ['DE3 jQuery hover',DE,W('<marquee id=m>News</marquee><script>window.$&&$("#m").hover(function(){this.stop()},function(){this.start()});</script>')],
 ['APC1 button slotting a link (flat tree)',APC,W('<x-b id=x><a href=#>in</a></x-b><script>customElements.define("x-b",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<div role=button tabindex=0><slot></slot></div>"}})</script>')],
 ['APC2 role=img host whose shadow has a link',APC,W('<div role=img aria-label=i id=y></div><script>document.getElementById("y").attachShadow({mode:"open"}).innerHTML="<a href=#>l</a>"</script>')],
 ['TD1 colspan=0 and rowspan=0',TD,W('<table><tr><th>A</th><th>B</th></tr><tr><td colspan=0>x</td><td>y</td></tr><tr><td rowspan=0>p</td><td>q</td></tr><tr><td>r</td></tr></table>')],
 ['TD2 colspan=1001 header',TD,W('<table><tr><th colspan=2000>A</th></tr><tr><td>1</td><td>2</td></tr></table>')],
 ['TD3 colspan="2abc" and "-1"',TD,W('<table><tr><th colspan="2abc">A</th><th>B</th></tr><tr><td>1</td><td>2</td><td colspan=-1>3</td></tr></table>')],
];
run4(cases.map(([n,r,h])=>({name:n,rules:r,html:h})));
