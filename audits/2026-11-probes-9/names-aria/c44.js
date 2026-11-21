const R=['aria-required-children','aria-required-parent','list-children-valid','listitem-parent-valid','nested-interactive-controls-absent','aria-prohibited-children'];
module.exports=[
{name:'bootstrap-tabs', rules:R, html:'<ul class="nav nav-tabs" role=tablist><li class=nav-item role=presentation><button class=nav-link role=tab aria-selected=true aria-controls=p1>Home</button></li><li role=presentation><button role=tab aria-selected=false>Profile</button></li></ul><div role=tabpanel id=p1>x</div>'},
{name:'menubar-li-none', rules:R, html:'<ul role=menubar aria-label=m><li role=none><a role=menuitem href="/a">A</a></li><li role=none><a role=menuitem href="/b" aria-haspopup=true aria-expanded=false>B</a><ul role=menu aria-label=b><li role=none><a role=menuitem href="/c">C</a></li></ul></li></ul>'},
{name:'listbox-ul-li-option', rules:R, html:'<ul role=listbox aria-label=l><li role=option aria-selected=false>A</li><li role=option aria-selected=true>B</li></ul>'},
{name:'radiogroup-labels', rules:R, html:'<div role=radiogroup aria-label=r><label><input type=radio name=a> A</label><label><input type=radio name=a> B</label></div>'},
{name:'toolbar-ul', rules:R, html:'<ul role=toolbar aria-label=t><li><button>B</button></li><li><button>I</button></li></ul>'},
{name:'tree-ul-li', rules:R, html:'<ul role=tree aria-label=t><li role=treeitem aria-expanded=false>A</li><li>Stray</li></ul>'},
{name:'grid-native-tr-td-role-none', rules:R, html:'<table role=grid aria-label=g><tr role=row><td role=gridcell>1</td></tr></table>'},
{name:'combobox-listbox-popup', rules:R, html:'<input role=combobox aria-expanded=true aria-controls=lb aria-label=c><ul role=listbox id=lb aria-label=o><li role=option aria-selected=false>A</li></ul>'},
];
