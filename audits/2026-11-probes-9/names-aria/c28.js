const R=['duplicate-id-aria','duplicate-id','aria-owns-valid','aria-braille-equivalent','aria-text','focus-order-semantics','tabindex','accesskeys'];
module.exports=[
{name:'dup-id-labelledby', rules:R, html:'<span id=l>First</span><span id=l>Second</span><input aria-labelledby=l>'},
{name:'dup-id-shadow-separate', rules:R, html:'<span id=l>Light</span><x-a id=h></x-a><input aria-labelledby=l>', setup:()=>{document.getElementById('h').attachShadow({mode:'open'}).innerHTML='<span id=l>Shadow</span><input aria-labelledby=l>';}},
{name:'dup-id-label-for', rules:R, html:'<label for=x>A</label><input id=x><input id=x>'},
{name:'dup-id-in-template-svg', rules:R, html:'<template><div id=t></div></template><div id=t></div><svg><defs><linearGradient id=g></linearGradient></defs></svg><svg><defs><linearGradient id=g></linearGradient></defs></svg>'},
{name:'owns-cases', rules:R, html:'<div role=listbox aria-label=x aria-owns="o1 o2 missing"></div><div role=option id=o1>a</div><div role=option id=o2>b</div><div id=p aria-owns="p"></div><div id=q aria-owns="r"></div><div id=r aria-owns="q"></div>'},
{name:'braille', rules:R, html:'<button aria-brailleroledescription="btn">x</button><div role=img aria-label="Star" aria-braillelabel="*">x</div><button aria-braillelabel="go">Go</button><div aria-roledescription="slide" aria-brailleroledescription="sld" role=group>x</div>'},
{name:'aria-text', rules:R, html:'<p role=text>Hello <b>world</b></p><a href="/" role=text>link</a>'},
{name:'tabindex', rules:R, html:'<button tabindex=1>a</button><div tabindex=0>plain div</div><span tabindex="2abc">x</span><h2 tabindex=-1>H</h2>'},
{name:'accesskeys', rules:R, html:'<button accesskey=s>Save</button><a href="/" accesskey=S>Search</a><input accesskey="x y" aria-label=q>'},
];
