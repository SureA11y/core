const L=['list-children-valid','listitem-parent-valid'];
module.exports=[
{name:'div-none-li', rules:L, html:'<div role=none><li id=l>Item one</li><li>Item two</li></div>', ax:['#l']},
{name:'div-li', rules:L, html:'<div><li id=l>Item one</li><li>Item two</li></div>', ax:['#l']},
{name:'nav-presentation-li', rules:L, html:'<nav role=presentation><li id=l>Item one</li></nav>', ax:['#l']},
];
