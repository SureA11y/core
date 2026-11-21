const L=['list-children-valid','listitem-parent-valid'];
module.exports=[
{name:'ul-div-display-contents', rules:L, html:'<ul id=u><div style="display:contents"><li id=l>a</li></div></ul>', ax:['#u','#l']},
{name:'ul-div-plain', rules:L, html:'<ul id=u><div><li id=l>a</li></div></ul>', ax:['#u','#l']},
{name:'ul-div-role-presentation', rules:L, html:'<ul id=u><div role=presentation><li id=l>a</li><li>b</li></div></ul>', ax:['#u','#l']},
{name:'ul-span-role-none-li', rules:L, html:'<ul id=u><span role=none><li id=l>a</li></span></ul>', ax:['#u','#l']},
];
