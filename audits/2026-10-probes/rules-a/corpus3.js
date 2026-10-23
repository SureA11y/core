const C=[]; const add=(name,body,expect,extra={})=>C.push({name,body,expect,...extra});
const allowed = [
 '<a href="/" aria-expanded="false" aria-controls="m">Menu</a><ul id=m hidden></ul>',
 '<a href="#" role=button aria-pressed=false>Bold</a>',
 '<label><input type=checkbox aria-checked=mixed> All</label>',
 '<label>S <select aria-required=true aria-invalid=false><option>a</option></select></label>',
 '<table><tr><th aria-sort=ascending>A</th></tr><tr><td>1</td></tr></table>',
 '<table role=grid aria-label=g><tr aria-selected=true><td>1</td></tr></table>',
 '<ul><li aria-level=2 aria-posinset=1 aria-setsize=3>a</li></ul>',
 '<div role=feed aria-label=f aria-busy=false><article aria-posinset=1 aria-setsize=-1 aria-label=a>x</article></div>',
 '<label>V <input type=range aria-valuetext="Medium"></label>',
 '<div role=dialog aria-modal=true aria-label=d>x</div>',
 '<hr aria-orientation=vertical>',
 '<div role=checkbox aria-checked=false aria-readonly=true tabindex=0>c</div>',
 '<button aria-haspopup=menu aria-expanded=false>m</button>',
 '<label>E <input type=text aria-invalid=true aria-errormessage=em></label><p id=em>bad</p>',
 '<label>E <input type=text role=combobox aria-autocomplete=list aria-expanded=false aria-activedescendant=""></label>',
 '<div role=textbox contenteditable aria-placeholder="Type" aria-multiline=true aria-label=t></div>',
 '<table><tr><th>A</th></tr><tr><td aria-colindex=1>1</td></tr></table>',
 '<button aria-disabled=true aria-keyshortcuts="Alt+S" aria-details=dd>Save</button><p id=dd>d</p>',
 '<input type=text aria-label=n aria-required=true aria-readonly=true>',
 '<div role=separator aria-valuenow=50 aria-valuemin=0 aria-valuemax=100 tabindex=0 aria-label=s></div>',
 '<details><summary aria-expanded=true>More</summary>x</details>',
 '<h2 aria-describedby=dd2>Head</h2><p id=dd2>x</p>',
 '<img src=x.png alt="Chart" aria-describedby=dd3><p id=dd3>long</p>',
 '<nav aria-label=n aria-current=true><a href="/">x</a></nav>',
 '<div role=listbox aria-label=l aria-multiselectable=true aria-orientation=horizontal><div role=option aria-selected=true aria-checked=true>a</div></div>',
 '<div role=tree aria-label=t><div role=treeitem aria-expanded=false aria-level=1 aria-selected=false>a</div></div>',
 '<div role=row aria-rowindex=2></div>',
 '<input type=checkbox aria-label=x aria-pressed=true>',
 '<label>Q <input type=number aria-valuenow=3></label>',
 '<div role=tabpanel aria-label=p aria-expanded=true>x</div>',
];
allowed.forEach((h,i)=>add('allowed-attr '+i+' '+h.slice(0,60), h, {}));
add('menubar li none a menuitem', '<ul role=menubar aria-label=m><li role=none><a role=menuitem href="/">A</a></li></ul>', {'aria-required-children':'pass','aria-required-parent':'pass','aria-allowed-role':'!fail'});
add('table role=grid td', '<table role=grid aria-label=g><tr><th>A</th></tr><tr><td>1</td></tr></table>', {'aria-required-children':'!fail','aria-required-parent':'!fail'});
add('row outside table', '<div role=row><div role=cell>x</div></div>', {'aria-required-parent':'fail'});
add('select size listbox', '<select size=4><option>a</option></select>', {});
add('datalist options', '<label>B <input list=dl></label><datalist id=dl><option value="Chrome"><option value="Firefox"></datalist>', {'option-name-present':'!fail'});
add('option label attr', '<label>C <select><option label="United States" value=us></option></select></label>', {'option-name-present':'!fail'});
add('role option empty', '<div role=listbox aria-label=l><div role=option aria-selected=false></div></div>', {'option-name-present':'fail'});
add('output element', '<label for=o>Total</label><output id=o>5</output>', {});
add('link aria-label role=presentation', '<a href="/" role=presentation aria-label="Home"></a>', {'link-name-present':'pass'});
add('landmarks multi-token', '<div role="foo navigation"><a href="/">x</a></div><div role="foo navigation"><a href="/">y</a></div>', {});
add('iframe labelledby', '<p id=ifl>Map</p><iframe src="about:blank" aria-labelledby=ifl></iframe>', {'iframe-name-present':'pass'});
add('img alt empty + aria-label', '<img src=x.png alt="" aria-label="Cat">', {'img-alt-present':'pass'});
add('label for + aria-label', '<label for=lab></label><input id=lab type=text aria-label="Name">', {'form-control-programmatic-label-present':'pass'});
add('button in label', '<label>Search <button>Go</button></label>', {'button-name-present':'pass'});
add('input submit empty', '<input type=submit value="">', {});
add('treeitem group', '<ul role=tree aria-label=t><li role=treeitem aria-expanded=true>A<ul role=group><li role=treeitem>B</li></ul></li></ul>', {'aria-required-children':'pass','aria-required-parent':'pass','treeitem-name-present':'pass'});
add('treeitem name from content nested', '<ul role=tree aria-label=t><li role=treeitem aria-expanded=true><span>Parent</span><ul role=group><li role=treeitem>B</li></ul></li></ul>', {'treeitem-name-present':'pass'});
add('menuitem with icon + text', '<div role=menu aria-label=m><div role=menuitem tabindex=-1><svg aria-hidden=true></svg>Copy</div></div>', {'menuitem-name-present':'pass'});
add('tab with img alt', '<div role=tablist aria-label=t><div role=tab tabindex=0><img src=x.png alt="Home"></div></div>', {'tab-name-present':'pass'});
add('tooltip with text', '<button aria-describedby=tip>?</button><div role=tooltip id=tip>Help text</div>', {'tooltip-name-present':'pass'});
add('progress role labelledby', '<span id=pl>Loading</span><div role=progressbar aria-labelledby=pl aria-valuenow=10></div>', {'progressbar-name-present':'pass'});
add('heading in shadow order', '<div id=host></div>', {}, {setup:"document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<h4>Deep</h4>'"});
add('empty heading in shadow', '<div id=host></div>', {'empty-heading':'!pass'}, {setup:"document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<h2></h2>'"});
add('aria-hidden focus in shadow', '<div id=host aria-hidden=true></div>', {'aria-hidden-focus':'fail'}, {setup:"document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<a href=/>x</a>'"});
add('aria-hidden host slot focus', '<div id=host aria-hidden=true><a href="/">x</a></div>', {'aria-hidden-focus':'fail'}, {setup:"document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<slot></slot>'"});
add('slotted li into shadow ul', '<x-list id=host><li>a</li></x-list>', {'listitem-parent-valid':'pass'}, {setup:"document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<ul><slot></slot></ul>'"});
add('slotted listitem shadow role list', '<x-list id=host><div role=listitem>a</div></x-list>', {'aria-required-parent':'pass'}, {setup:"document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<div role=list><slot></slot></div>'"});
add('slotted option into shadow listbox', '<x-lb id=host><div role=option aria-selected=false>A</div></x-lb>', {'aria-required-parent':'pass'}, {setup:"document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<div role=listbox aria-label=l><slot></slot></div>'"});
add('slotted td into shadow table', '<x-t id=host><span slot=c>1</span></x-t>', {}, {setup:"document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<table><tr><th>A</th></tr><tr><td><slot name=c></slot></td></tr></table>'"});
add('nested interactive via shadow', '<x-b id=host><a href="/">in</a></x-b>', {'nested-interactive-controls-absent':'fail'}, {setup:"document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<button><slot></slot></button>'"});
add('shadow img alt via host label', '<x-i id=host aria-label="Logo" role=img></x-i>', {'role-img-text-alternative-present':'pass'}, {setup:"document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<img src=x.png alt=\"\">'"});
add('duplicate-id-aria shadow scoped', '<span id=l1>Light</span><div id=host></div>', {'duplicate-id-aria':'!cantTell','duplicate-id':'pass'}, {setup:"document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<span id=l1>Shadow</span><input aria-labelledby=l1>'"});
add('aria-valid-attr-value labelledby to light from shadow', '<span id=onlylight>Light</span><div id=host></div>', {'aria-valid-attr-value':'!pass'}, {setup:"document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<input aria-labelledby=onlylight>'"});
module.exports=C;
