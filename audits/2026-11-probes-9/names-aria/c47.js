const R=['link-name-present','button-name-present','image-redundant-alt','img-alt-present'];
module.exports=[
{name:'link-role-none-focusable', rules:R, html:'<a id=a href="/" role=presentation></a><button id=b role=none></button>', ax:['#a','#b']},
{name:'link-tabindex-neg-unnamed', rules:R, html:'<a id=a href="/" tabindex=-1></a>', ax:['#a']},
{name:'link-aria-hidden-unnamed', rules:R, html:'<a id=a href="/" aria-hidden=true></a>', ax:['#a']},
{name:'link-inert', rules:R, html:'<div inert><a id=a href="/"></a></div>'},
{name:'link-role-button', rules:R, html:'<a id=a href="/" role=button></a>', ax:['#a']},
{name:'link-name-only-in-hidden-label-elsewhere', rules:R, html:'<a id=a href="/" aria-labelledby="t"></a><template id=t>Templ</template>', ax:['#a']},
{name:'link-labelledby-script', rules:R, html:'<a id=a href="/" aria-labelledby="s"></a><script id=s>Script text</script><a id=b href="/" aria-labelledby="st"></a><style id=st>Style text</style>', ax:['#a','#b']},
{name:'link-labelledby-input', rules:R, html:'<a id=a href="/" aria-labelledby="i"></a><input id=i value="Typed" aria-label="lbl">', ax:['#a']},
{name:'link-labelledby-select', rules:R, html:'<a id=a href="/" aria-labelledby="s"></a><select id=s aria-label="x"><option>One</option><option selected>Two</option></select>', ax:['#a']},
{name:'link-labelledby-textarea', rules:R, html:'<a id=a href="/" aria-labelledby="t"></a><textarea id=t>TA</textarea>', ax:['#a']},
{name:'link-labelledby-img', rules:R, html:'<a id=a href="/" aria-labelledby="i"></a><img id=i src=x.png alt="Pic">', ax:['#a']},
{name:'link-labelledby-native-button', rules:R, html:'<a id=a href="/" aria-labelledby="b"></a><button id=b aria-label="BL">BT</button>', ax:['#a']},
{name:'link-labelledby-hidden-with-hidden-child', rules:R, html:'<a id=a href="/" aria-labelledby="h"></a><div id=h hidden>Visible-in-hidden <span style="display:none">dn</span><span aria-hidden=true>ah</span></div>', ax:['#a']},
];
