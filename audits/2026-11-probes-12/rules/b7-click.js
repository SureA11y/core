const {run4,setMsg}=require('./h.js');setMsg(100);
const W=(b)=>`<!doctype html><html lang=en><head><title>t</title><style>body{margin:8px;font:16px/1.5 sans-serif;background:#fff}</style></head><body><main>${b}</main></body></html>`;
const R=['click-handler-keyboard-operable'];
const cases=[
 ['div-btn-bg','<div onclick="x()" style="display:inline-block;padding:8px 16px;background:#0a5;color:#fff">Add to cart</div>'],
 ['div-btn-border','<div onclick="x()" style="display:inline-block;padding:8px;border:1px solid #333">Load more</div>'],
 ['div-btn-gradient','<div onclick="x()" style="display:inline-block;padding:8px 16px;background-image:linear-gradient(#0a5,#083);color:#fff">Add to cart</div>'],
 ['div-btn-shadow-only','<div onclick="x()" style="display:inline-block;padding:8px 16px;box-shadow:0 0 0 1px #333">Subscribe</div>'],
 ['badge-span','<p>Status <span onclick="track()" style="padding:2px 6px;background:#eee;border-radius:4px">New</span></p>'],
 ['acc-header','<div class=acc onclick="t()" style="padding:12px;background:#f3f3f3">Shipping and returns</div><div>Panel</div>'],
 ['tr-row','<table><tr onclick="go()" style="background:#f9f9f9"><td style="padding:8px">Order 1</td><td>$5</td></tr></table>'],
 ['card-big','<div onclick="go()" style="padding:16px;border:1px solid #ccc"><h3>Title</h3><p>Some description text here.</p></div>'],
 ['hidden-text-long','<div onclick="x()" style="display:inline-block;padding:8px;border:1px solid">Buy<span style="display:none"> this is a very long hidden description that pushes the text count over forty chars</span></div>'],
 ['sr-text','<div onclick="x()" style="display:inline-block;padding:8px;border:1px solid">Buy <span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">the blue widget now today ok</span></div>'],
 ['same-bg-as-parent','<div style="background:#eee;padding:10px"><div onclick="x()" style="display:inline-block;padding:8px;background:#eee">Add</div></div>'],
 ['transparent-border','<div onclick="x()" style="display:inline-block;padding:8px;border:1px solid transparent">Add</div>'],
 ['label-inside-has-focusable','<div onclick="x()" style="display:inline-block;padding:8px;border:1px solid"><a href=#>Add</a></div>'],
 ['body-delegated','<div onclick="x()" style="padding:8px;border:1px solid">OK</div>'],
 ['in-button','<button><span onclick="x()" style="padding:2px;background:#eee">Go</span></button>'],
 ['cjk','<div onclick="x()" style="display:inline-block;padding:8px;background:#0a5;color:#fff" lang=ja>カートに入れる</div>'],
 ['emoji-only','<div onclick="x()" style="display:inline-block;padding:8px;background:#0a5">✕</div>'],
 ['aria-hidden','<div aria-hidden=true onclick="x()" style="display:inline-block;padding:8px;background:#0a5">Close</div>'],
 ['display-none','<div onclick="x()" style="display:none;padding:8px;background:#0a5">Close</div>'],
 ['role-presentation','<div role=presentation onclick="x()" style="display:inline-block;padding:8px;background:#0a5">Close</div>'],
 ['li-tab-like','<ul style="list-style:none;display:flex"><li onclick="s(1)" style="padding:8px;background:#ddd">Description</li><li onclick="s(2)" style="padding:8px;background:#ddd">Reviews (3)</li></ul>'],
];
run4(cases.map(([n,b])=>({name:n,rules:R,html:W(b)})));
