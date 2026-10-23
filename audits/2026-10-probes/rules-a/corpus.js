// Corpus: {name, html | body, head?, expect: {ruleId: 'pass'|'fail'|'!fail'|'cantTell'|'notApplicable'|'!na'}, setup?: string}
const C = [];
const add = (name, body, expect, extra = {}) => C.push({ name, body, expect, ...extra });
const page = (name, html, expect, extra = {}) => C.push({ name, html, expect, ...extra });

// ---------- accessible name ----------
add('labelledby->hidden', '<span id=l hidden>Search</span><button aria-labelledby=l><svg aria-hidden="true"></svg></button>', { 'button-name-present': 'pass' });
add('labelledby->display-none', '<span id=l style="display:none">Search</span><button aria-labelledby=l><svg aria-hidden="true"></svg></button>', { 'button-name-present': 'pass' });
add('labelledby->aria-hidden', '<span id=l aria-hidden="true">Search</span><button aria-labelledby=l></button>', { 'button-name-present': 'pass' });
add('labelledby self-ref', '<button id=b aria-labelledby="b x"><span>Go</span></button><span id=x>now</span>', { 'button-name-present': 'pass' });
add('labelledby cycle', '<div id=a role=button tabindex=0 aria-labelledby=b>A</div><div id=b role=button tabindex=0 aria-labelledby=a>B</div>', { 'button-name-present': 'pass' });
add('labelledby missing', '<button aria-labelledby=nope></button>', { 'button-name-present': 'fail' });
add('labelledby missing + content', '<button aria-labelledby=nope>Save</button>', { 'button-name-present': 'pass' });
add('aria-label whitespace only', '<button aria-label="   "></button>', { 'button-name-present': 'fail' });
add('aria-label whitespace + content', '<button aria-label=" ">Save</button>', { 'button-name-present': 'pass' });
add('aria-label nbsp only', '<button aria-label="&nbsp;"></button>', { 'button-name-present': 'fail' });
add('button title only', '<button title="Close"><svg aria-hidden="true"></svg></button>', { 'button-name-present': 'pass' });
add('button css ::before', '<style>.i::before{content:"Close"}</style><button class=i></button>', { 'button-name-present': '!fail' });
add('button svg title', '<button><svg role=img><title>Close</title></svg></button>', { 'button-name-present': 'pass' });
add('button svg title no role', '<button><svg viewBox="0 0 1 1"><title>Close</title><path d="M0 0"/></svg></button>', { 'button-name-present': 'pass' });
add('button svg aria-hidden only', '<button><svg aria-hidden="true"><path d="M0 0"/></svg></button>', { 'button-name-present': 'fail' });
add('button img alt', '<button><img src=x.png alt="Delete"></button>', { 'button-name-present': 'pass' });
add('button img alt empty', '<button><img src=x.png alt=""></button>', { 'button-name-present': 'fail' });
add('button sr-only text', '<style>.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}</style><button><svg aria-hidden=true></svg><span class=sr>Close</span></button>', { 'button-name-present': 'pass' });
add('button display none text', '<button><span style="display:none">Close</span></button>', { 'button-name-present': 'fail' });
add('button visibility hidden text', '<button><span style="visibility:hidden">Close</span></button>', { 'button-name-present': 'fail' });
add('button nested aria-label span', '<button><span aria-label="Close"></span></button>', { 'button-name-present': '!fail' });
add('button nested role=img aria-label', '<button><span role=img aria-label="Close"></span></button>', { 'button-name-present': 'pass' });
add('button with input value in content', '<div role=button tabindex=0><input type=text value="7" aria-label="qty"> items</div>', { 'button-name-present': 'pass' });
add('role=button aria-labelledby to text in button', '<div role=button tabindex=0 aria-labelledby="t"><span id=t>Play</span></div>', { 'button-name-present': 'pass' });
add('input submit value empty', '<input type=submit value="">', { 'button-name-present': '!na' });
add('input button no value', '<input type=button>', { 'button-name-present': 'fail' });
add('input reset', '<input type=reset>', { 'button-name-present': 'pass' });
add('button role=none', '<button role=none>X</button>', { 'button-name-present': 'pass' });
add('button foo fallback role', '<div role="foo button" tabindex=0></div>', { 'button-name-present': 'fail', 'aria-roles-valid': '!fail' });
add('contenteditable', '<div contenteditable=true></div>', {});
add('button aria-hidden content but aria-label', '<button aria-label="Menu"><span aria-hidden="true">☰</span></button>', { 'button-name-present': 'pass', 'label-in-name': '!fail' });

// links
add('link empty', '<a href="/x"></a>', { 'link-name-present': 'fail' });
add('link no href', '<a>Text</a><a></a>', { 'link-name-present': 'notApplicable' });
add('link aria-label img noalt', '<a href="/" aria-label="Home"><img src=x.png alt=""></a>', { 'link-name-present': 'pass' });
add('link img alt', '<a href="/"><img src=x.png alt="Home"></a>', { 'link-name-present': 'pass' });
add('link img alt empty', '<a href="/"><img src=x.png alt=""></a>', { 'link-name-present': 'fail' });
add('link title only', '<a href="/" title="Home"></a>', { 'link-name-present': 'pass' });
add('link sr-only', '<style>.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}</style><a href="/"><span class=sr>Home</span></a>', { 'link-name-present': 'pass' });
add('link svg title', '<a href="/"><svg viewBox="0 0 1 1"><title>Home</title><path d="M0 0"/></svg></a>', { 'link-name-present': 'pass' });
add('link svg role img aria-label', '<a href="/"><svg role=img aria-label="Home"></svg></a>', { 'link-name-present': 'pass' });
add('link hidden span + aria-hidden icon', '<a href="/"><span hidden>x</span><i aria-hidden=true class=icon></i></a>', { 'link-name-present': 'fail' });
add('link role=button', '<a href="/" role=button>Go</a>', { 'link-name-present': '!fail', 'button-name-present': 'pass' });
add('link in svg', '<svg viewBox="0 0 10 10"><a href="/"><text x=0 y=5>Home</text></a></svg>', { 'link-name-present': '!fail' });
add('link with labelledby hidden', '<a href="/" aria-labelledby=h></a><div hidden id=h>Products</div>', { 'link-name-present': 'pass' });
add('area no alt', '<img src=m.png usemap="#m" alt="Map"><map name=m><area href="/a" shape=rect coords="0,0,1,1"></map>', { 'area-alt-present': 'fail' });
add('area aria-label', '<img src=m.png usemap="#m" alt="Map"><map name=m><area href="/a" aria-label="A" shape=rect coords="0,0,1,1"></map>', { 'area-alt-present': 'pass' });
add('area no href', '<img src=m.png usemap="#m" alt="Map"><map name=m><area shape=rect coords="0,0,1,1"></map>', { 'area-alt-present': '!fail' });

// images
add('img aria-label no alt', '<img src=x.png aria-label="Logo">', { 'img-alt-present': 'pass' });
add('img title no alt', '<img src=x.png title="Logo">', { 'img-alt-present': 'pass' });
add('img labelledby', '<img src=x.png aria-labelledby=c><span id=c>Logo</span>', { 'img-alt-present': 'pass' });
add('img role presentation no alt', '<img src=x.png role=presentation>', { 'img-alt-present': 'pass' });
add('img role none no alt', '<img src=x.png role=none>', { 'img-alt-present': 'pass' });
add('img aria-hidden', '<img src=x.png aria-hidden=true>', { 'img-alt-present': 'notApplicable' });
add('img alt boolean', '<img src=x.png alt>', { 'img-alt-present': 'pass' });
add('img alt space', '<img src=x.png alt=" ">', {});
add('img picture', '<picture><source srcset="x.webp" type="image/webp"><img src=x.png alt="Cat"></picture>', { 'img-alt-present': 'pass' });
add('img presentation with alt', '<img src=x.png role=presentation alt="Logo">', { 'img-alt-present': '!fail' });
add('img decorative alt="" x5', '<img src=a.png alt=""><img src=b.png alt=""><img src=c.png alt=""><img src=d.png alt=""><img src=e.png alt="">', { 'img-alt-present': 'pass' });
add('img ok alt', '<img src="cat.jpg" alt="A tabby cat asleep on a windowsill">', { 'img-alt-present': 'pass' });
add('img in button aria-label', '<button aria-label="Search"><img src=s.png></button>', { 'img-alt-present': '!fail' });
add('img in link aria-label', '<a href="/" aria-label="Home"><img src=s.png></a>', { 'img-alt-present': '!fail' });
add('input image no alt', '<input type=image src=go.png>', { 'input-image-alt-present': 'fail' });
add('input image alt', '<input type=image src=go.png alt="Search">', { 'input-image-alt-present': 'pass' });
add('input image title', '<input type=image src=go.png title="Search">', { 'input-image-alt-present': 'pass' });
add('input image aria-label', '<input type=image src=go.png aria-label="Search">', { 'input-image-alt-present': 'pass' });
add('input image label', '<label for=ii>Search</label><input id=ii type=image src=go.png>', {});
add('svg role img none', '<svg role=img viewBox="0 0 1 1"><path d="M0 0"/></svg>', { 'svg-image-text-alternative-present': 'fail' });
add('svg role img title', '<svg role=img viewBox="0 0 1 1"><title>Chart</title><path d="M0 0"/></svg>', { 'svg-image-text-alternative-present': 'pass', 'svg-text-alternative-present': '!fail' });
add('svg role img labelledby title', '<svg role=img aria-labelledby=t viewBox="0 0 1 1"><title id=t>Chart</title></svg>', { 'svg-image-text-alternative-present': 'pass' });
add('svg bare decorative', '<svg viewBox="0 0 10 10" width=10 height=10><circle cx=5 cy=5 r=5 /></svg>', { 'svg-image-text-alternative-present': '!fail', 'svg-text-alternative-present': '!fail', 'role-img-text-alternative-present': '!fail' });
add('svg graphics-document', '<svg role=graphics-document aria-label="Map" viewBox="0 0 1 1"></svg>', { 'aria-roles-valid': 'pass' });
add('svg graphics-symbol unnamed', '<svg viewBox="0 0 1 1"><g role=graphics-symbol><circle r=1 /></g></svg>', {});
add('role img span no name', '<span role=img>★★★</span>', { 'role-img-text-alternative-present': 'fail' });
add('role img span aria-label', '<span role=img aria-label="3 stars">★★★</span>', { 'role-img-text-alternative-present': 'pass' });
add('canvas no fallback', '<canvas width=10 height=10></canvas>', {});
add('canvas aria-label', '<canvas width=10 height=10 aria-label="Chart"></canvas>', { 'canvas-text-alternative-present': '!fail' });
add('canvas fallback', '<canvas width=10 height=10><p>Sales rose 10%</p></canvas>', { 'canvas-text-alternative-present': '!fail' });
add('object fallback', '<object data="r.pdf" type="application/pdf"><p>Annual report</p></object>', { 'object-text-alternative-present': '!fail' });
add('object no alt', '<object data="r.pdf" type="application/pdf"></object>', { 'object-text-alternative-present': 'fail' });
add('object aria-label', '<object data="r.pdf" type="application/pdf" aria-label="Report"></object>', { 'object-text-alternative-present': 'pass' });
add('embed title', '<embed src="x.swf" title="Game">', { 'embed-text-alternative-present': 'pass' });
add('embed none', '<embed src="x.swf">', { 'embed-text-alternative-present': 'fail' });
add('ismap', '<a href="/map"><img src=m.png ismap alt="Map"></a>', { 'server-side-image-map-absent': 'fail' });

// forms
add('placeholder only', '<input type=text placeholder="Search">', { 'textbox-name-present': 'pass' });
add('textarea placeholder only', '<textarea placeholder="Comments"></textarea>', { 'textbox-name-present': 'pass' });
add('title only input', '<input type=text title="Search">', { 'textbox-name-present': 'pass', 'form-control-programmatic-label-present': '!fail' });
add('label wrap', '<label>Name <input type=text></label>', { 'textbox-name-present': 'pass', 'form-control-programmatic-label-present': 'pass' });
add('label for dup ids', '<label for=dup>Email</label><input id=dup type=text><input id=dup type=text>', { 'duplicate-id': 'fail' });
add('label for + wrap elsewhere', '<label for=x>A <input id=y type=text></label><input id=x type=text>', { 'textbox-name-present': 'fail' });
add('label for -> non-labelable', '<label for=d>Name</label><div id=d></div><input type=text aria-label="ok">', { 'textbox-name-present': 'pass' });
add('two labels', '<label for=a2>First</label><label for=a2>Name</label><input id=a2 type=text>', { 'textbox-name-present': 'pass' });
add('empty label', '<label for=e1></label><input id=e1 type=text>', { 'textbox-name-present': 'fail' });
add('label with img alt', '<label for=s1><img src=s.png alt="Search"></label><input id=s1 type=text>', { 'textbox-name-present': 'pass' });
add('labelledby to hidden label', '<input type=text aria-labelledby=hl><span id=hl hidden>Zip</span>', { 'textbox-name-present': 'pass' });
add('input describedby only', '<input type=text aria-describedby=dd><span id=dd>hint</span>', { 'textbox-name-present': 'fail' });
add('input type file no label', '<input type=file>', {});
add('input type file label', '<label>Upload <input type=file></label>', { 'form-control-programmatic-label-present': '!fail' });
add('input color label', '<label>Color <input type=color></label>', { 'form-control-programmatic-label-present': '!fail' });
add('input hidden', '<input type=hidden name=t value=1>', { 'form-control-programmatic-label-present': 'notApplicable' });
add('checkbox label', '<input type=checkbox id=c1><label for=c1>Agree</label>', { 'binary-control-name-present': 'pass' });
add('checkbox none', '<input type=checkbox>', { 'binary-control-name-present': 'fail' });
add('radio group fieldset w/labels', '<fieldset><legend>Size</legend><label><input type=radio name=s> S</label><label><input type=radio name=s> M</label></fieldset>', { 'binary-control-name-present': 'pass' });
add('switch role checkbox', '<input type=checkbox role=switch id=sw><label for=sw>Wifi</label>', { 'aria-allowed-role': 'pass', 'aria-required-attr': '!fail', 'binary-control-name-present': 'pass' });
add('select empty first option', '<label>Country <select><option value=""></option><option>US</option></select></label>', { 'option-name-present': '!fail' });
add('select optgroup', '<select aria-label="Car"><optgroup label="Swedish"><option>Volvo</option></optgroup></select>', { 'aria-required-children': '!fail', 'listbox-name-present': '!fail', 'combobox-name-present': '!fail' });
add('select no label', '<select><option>A</option></select>', {});
add('select multiple label', '<label>Pick <select multiple><option>A</option></select></label>', { 'listbox-name-present': '!fail' });
add('progress no label', '<progress value=5 max=10></progress>', {});
add('progress labelled', '<label>Upload <progress value=5 max=10></progress></label>', { 'progressbar-name-present': '!fail' });
add('meter labelled', '<label for=m1>Disk</label><meter id=m1 value=0.5></meter>', { 'meter-name-present': '!fail' });
add('range input label', '<label>Vol <input type=range></label>', { 'slider-name-present': '!fail' });
add('number input label', '<label>Qty <input type=number></label>', { 'spinbutton-name-present': '!fail' });
add('search input placeholder', '<input type=search placeholder="Search site">', { 'searchbox-name-present': '!fail' });
add('search input aria-label', '<input type=search aria-label="Search site">', { 'searchbox-name-present': 'pass' });
add('combobox input label', '<label for=cb>Fruit</label><input id=cb role=combobox aria-expanded=false aria-controls=lb><ul id=lb role=listbox hidden></ul>', { 'combobox-name-present': 'pass', 'aria-allowed-role': '!fail', 'aria-valid-attr-value': '!fail' });
add('combobox no expanded', '<label for=cb2>Fruit</label><input id=cb2 role=combobox>', {});
add('details summary empty', '<details><summary></summary>x</details>', { 'summary-name-present': 'fail' });
add('details summary ok', '<details><summary>More</summary>x</details>', { 'summary-name-present': 'pass' });
add('details no summary', '<details><p>x</p></details>', { 'summary-name-present': '!fail' });
add('summary with heading', '<details><summary><h3>FAQ</h3></summary>x</details>', { 'summary-name-present': 'pass' });

// autocomplete
const ac = (v, exp, type = 'text', extra = '') => add('autocomplete "' + v + '" ' + type + extra, `<label>F <input type=${type} autocomplete="${v}" ${extra}></label>`, { 'autocomplete-valid': exp });
ac('section-x shipping street-address', 'pass');
ac('webauthn', 'pass');
ac('username webauthn', 'pass');
ac('current-password webauthn', 'pass', 'password');
ac('billing email', 'pass', 'email');
ac('home tel', 'pass', 'tel');
ac('work email', 'pass', 'email');
ac('shipping tel-country-code', 'pass', 'tel');
ac('section-blue billing country-name', 'pass');
ac('one-time-code', 'pass');
ac('Email', 'pass', 'email');
ac('off', 'pass');
ac('on', 'pass');
ac('nickname', 'pass');
ac('transaction-amount', 'pass', 'number');
ac('bday-day', 'pass', 'number');
ac('cc-exp', 'pass', 'month');
ac(' email ', 'pass', 'email');
ac('foo', 'fail');
ac('email email', 'fail', 'email');
ac('home street-address', 'fail');
ac('section-x', 'fail');
ac('foo', '!fail', 'text', 'disabled');
ac('foo', '!fail', 'text', 'aria-disabled="true"');
ac('email', '!fail', 'hidden');
ac('tel', '!fail', 'email');
add('autocomplete select', '<label>Country <select autocomplete="country"><option>US</option></select></label>', { 'autocomplete-valid': 'pass' });
add('autocomplete textarea', '<label>Addr <textarea autocomplete="street-address"></textarea></label>', { 'autocomplete-valid': 'pass' });

// ---------- roles / ARIA ----------
add('abstract role', '<div role=widget>x</div>', { 'aria-roles-valid': 'fail' });
add('dpub role', '<section role=doc-chapter aria-label="Ch 1"><p>x</p></section>', { 'aria-roles-valid': 'pass', 'aria-allowed-role': '!fail' });
add('aria 1.3 roles', '<p><mark role=mark>a</mark> <span role=suggestion><ins role=insertion>b</ins></span></p>', { 'aria-roles-valid': '!fail' });
add('role uppercase', '<div role="BUTTON" tabindex=0>Go</div>', {});
add('role whitespace', '<div role="  button  " tabindex=0>Go</div>', { 'aria-roles-valid': 'pass' });
add('deprecated attr grabbed', '<div role=listitem aria-grabbed=false>x</div>', { 'aria-valid-attr': 'pass' });
add('aria 1.3 attrs', '<button aria-description="More" aria-braillelabel="btn" aria-brailleroledescription="bt">Go</button>', { 'aria-valid-attr': 'pass' });
add('aria invalid attr', '<div aria-lable="x">x</div>', { 'aria-valid-attr': 'fail' });
add('aria-controls missing collapsed', '<button aria-expanded=false aria-controls=menu1>Menu</button>', { 'aria-valid-attr-value': '!fail' });
add('aria-describedby missing', '<button aria-describedby=nope>Menu</button>', { 'aria-valid-attr-value': '!fail' });
add('aria-current page', '<a href="/" aria-current=page>Home</a>', { 'aria-valid-attr-value': 'pass' });
add('aria-current foo', '<a href="/" aria-current=foo>Home</a>', {});
add('aria-hidden TRUE', '<span aria-hidden="TRUE">x</span>', {});
add('aria-level 0', '<div role=heading aria-level=0>x</div>', { 'aria-valid-attr-value': 'fail' });
add('aria-valuenow 1e3', '<div role=slider tabindex=0 aria-label=v aria-valuenow="1e3" aria-valuemin=0 aria-valuemax=2000></div>', { 'aria-valid-attr-value': 'pass' });
add('aria-valuenow 1.5', '<div role=slider tabindex=0 aria-label=v aria-valuenow="1.5" aria-valuemin=0 aria-valuemax=2></div>', { 'aria-valid-attr-value': 'pass', 'aria-required-attr': 'pass' });
add('aria-haspopup dialog', '<button aria-haspopup=dialog>Open</button>', { 'aria-valid-attr-value': 'pass' });
add('aria-invalid grammar', '<input type=text aria-label=t aria-invalid=grammar>', { 'aria-valid-attr-value': 'pass' });
add('aria-relevant multi', '<div aria-live=polite aria-relevant="additions text">x</div>', { 'aria-valid-attr-value': 'pass' });
add('aria-relevant bad', '<div aria-live=polite aria-relevant="additions foo">x</div>', { 'aria-valid-attr-value': 'fail' });
add('aria-labelledby partial', '<input type=text aria-labelledby="a1 nope"><span id=a1>Name</span>', { 'aria-valid-attr-value': '!fail', 'textbox-name-present': 'pass' });
add('aria-owns multi', '<div role=listbox aria-label=x aria-owns="o1 o2"></div><div role=option id=o1>A</div><div role=option id=o2>B</div>', { 'aria-required-children': 'pass', 'aria-required-parent': 'pass' });
add('req children via role=none', '<div role=list><div role=none><div role=listitem>A</div></div></div>', { 'aria-required-children': 'pass', 'aria-required-parent': 'pass' });
add('req children via generic div', '<div role=list><div><div role=listitem>A</div></div></div>', { 'aria-required-children': 'pass', 'aria-required-parent': 'pass' });
add('tablist ok', '<div role=tablist aria-label=t><button role=tab aria-selected=true aria-controls=p1>A</button></div><div role=tabpanel id=p1 aria-label=A>x</div>', { 'aria-required-children': 'pass', 'aria-required-parent': 'pass', 'aria-allowed-role': '!fail', 'tab-name-present': 'pass' });
add('menu with group', '<ul role=menu aria-label=m><li role=group><ul role=none><li role=menuitem>A</li></ul></li><li role=separator></li></ul>', { 'aria-required-children': 'pass', 'aria-required-parent': 'pass' });
add('grid rowgroup', '<div role=grid aria-label=g><div role=rowgroup><div role=row><div role=gridcell>1</div></div></div></div>', { 'aria-required-children': 'pass', 'aria-required-parent': 'pass' });
add('tree empty busy', '<ul role=tree aria-label=t aria-busy=true></ul>', { 'aria-required-children': '!fail' });
add('listbox empty', '<div role=listbox aria-label=t></div>', {});
add('listbox with group', '<div role=listbox aria-label=t><div role=group aria-label=g><div role=option aria-selected=false>A</div></div></div>', { 'aria-required-children': 'pass', 'aria-required-parent': 'pass' });
add('combobox owns listbox', '<input role=combobox aria-label=f aria-expanded=true aria-controls=l2><ul id=l2 role=listbox aria-label=f><li role=option aria-selected=false>A</li></ul>', { 'aria-required-children': '!fail', 'aria-required-parent': 'pass' });
add('feed article', '<div role=feed aria-label=f><article aria-label=a>x</article></div>', { 'aria-required-children': '!fail' });
add('table role rows thead', '<div role=table aria-label=t><div role=rowgroup><div role=row><span role=columnheader>H</span></div></div></div>', { 'aria-required-children': 'pass', 'aria-required-parent': 'pass' });
add('listitem w/o list', '<div role=listitem>x</div>', { 'aria-required-parent': 'fail' });
add('heading no level', '<div role=heading>Title</div>', {});
add('checkbox role no aria-checked', '<div role=checkbox tabindex=0>Agree</div>', {});
add('separator focusable no value', '<div role=separator tabindex=0 aria-label=s></div>', {});
add('hr plain', '<hr>', { 'aria-required-attr': '!fail' });
add('scrollbar missing', '<div role=scrollbar></div>', { 'aria-required-attr': 'fail' });

// allowed role
add('a href role=button', '<a href="#" role=button>Go</a>', { 'aria-allowed-role': 'pass' });
add('a href role=switch', '<a href="#" role=switch aria-checked=false>Go</a>', { 'aria-allowed-role': 'pass' });
add('button role=tab in tablist', '<div role=tablist aria-label=t><button role=tab>A</button></div>', { 'aria-allowed-role': 'pass' });
add('ul role=tablist li role=tab', '<ul role=tablist aria-label=t><li role=tab>A</li></ul>', { 'aria-allowed-role': 'pass' });
add('nav role=navigation redundant', '<nav role=navigation aria-label=n><a href="/">x</a></nav>', { 'aria-allowed-role': '!fail' });
add('h1 role=tab', '<div role=tablist aria-label=t><h2 role=tab>A</h2></div>', { 'aria-allowed-role': '!fail' });
add('aside role=note', '<aside role=note>Hi</aside>', { 'aria-allowed-role': 'pass' });
add('fieldset radiogroup', '<fieldset role=radiogroup aria-label=r><label><input type=radio name=q> a</label></fieldset>', { 'aria-allowed-role': 'pass' });
add('dialog alertdialog', '<dialog open role=alertdialog aria-label=d>x</dialog>', { 'aria-allowed-role': 'pass' });
add('img alt role=button', '<img src=x.png alt="Go" role=button tabindex=0>', { 'aria-allowed-role': 'pass' });
add('section role=search', '<section role=search aria-label=s><input type=search aria-label=q></section>', { 'aria-allowed-role': '!fail' });
add('search element', '<search><form><input type=search aria-label=q></form></search>', { 'aria-allowed-role': '!fail' });
add('div role=main dup', '<div role=main2>x</div>', { 'aria-roles-valid': 'fail' });
add('li role=menuitem in menu', '<ul role=menu aria-label=m><li role=menuitem>A</li></ul>', { 'aria-allowed-role': 'pass' });
add('input text role=combobox', '<input type=text role=combobox aria-expanded=false aria-label=c>', { 'aria-allowed-role': 'pass' });
add('input text role=spinbutton', '<input type=text role=spinbutton aria-valuenow=1 aria-label=c>', { 'aria-allowed-role': 'pass' });
add('button role=menuitemradio', '<div role=menu aria-label=m><button role=menuitemradio aria-checked=false>A</button></div>', { 'aria-allowed-role': 'pass' });
add('svg role=presentation', '<svg role=presentation viewBox="0 0 1 1"></svg>', { 'aria-allowed-role': 'pass' });
add('ol role=list (safari fix)', '<ol role=list><li>a</li></ol>', { 'aria-allowed-role': '!fail' });
add('deprecated role directory', '<ul role=directory><li>a</li></ul>', { 'aria-deprecated-role': 'fail' });

// prohibited
add('aria-label on div', '<div aria-label="x">text</div>', {});
add('aria-label on span role=img', '<span role=img aria-label="x">★</span>', { 'aria-prohibited-attr': 'pass' });
add('aria-label on section', '<section aria-label="Intro"><p>x</p></section>', { 'aria-prohibited-attr': 'pass' });
add('aria-label on code', '<code aria-label="x">a</code>', {});
add('aria-label on td', '<table><tr><th>H</th></tr><tr><td aria-label="c">1</td></tr></table>', { 'aria-prohibited-attr': '!fail' });
add('aria-label on label', '<label aria-label="x">Name <input type=text></label>', {});
add('aria-label on div tabindex', '<div tabindex=0 aria-label="scroll region" style="overflow:auto;height:20px">a<br>b<br>c</div>', {});

// aria-hidden/inert
add('aria-hidden link', '<div aria-hidden=true><a href="/">x</a></div>', { 'aria-hidden-focus': 'fail' });
add('aria-hidden link tabindex -1', '<div aria-hidden=true><a href="/" tabindex=-1>x</a></div>', { 'aria-hidden-focus': 'pass' });
add('aria-hidden disabled btn', '<div aria-hidden=true><button disabled>x</button></div>', { 'aria-hidden-focus': 'pass' });
add('aria-hidden fieldset disabled', '<div aria-hidden=true><fieldset disabled><input type=text></fieldset></div>', { 'aria-hidden-focus': 'pass' });
add('aria-hidden inert', '<div aria-hidden=true inert><a href="/">x</a></div>', { 'aria-hidden-focus': 'pass' });
add('aria-hidden display none child', '<div aria-hidden=true><a href="/" style="display:none">x</a></div>', { 'aria-hidden-focus': 'pass' });
add('aria-hidden summary', '<div aria-hidden=true><details><summary>x</summary></details></div>', { 'aria-hidden-focus': 'fail' });
add('aria-hidden input hidden', '<div aria-hidden=true><input type=hidden></div>', { 'aria-hidden-focus': '!fail' });
add('aria-hidden contenteditable', '<div aria-hidden=true><div contenteditable>x</div></div>', { 'aria-hidden-focus': 'fail' });
add('aria-hidden a no href', '<div aria-hidden=true><a>x</a></div>', { 'aria-hidden-focus': '!fail' });
add('aria-hidden iframe', '<div aria-hidden=true><iframe src="about:blank" title="t"></iframe></div>', {});
add('aria-hidden=false inside', '<div aria-hidden=true><div aria-hidden=false><a href="/">x</a></div></div>', { 'aria-hidden-focus': 'fail' });
add('aria-hidden svg focusable=false', '<button>Go <svg aria-hidden=true focusable=false></svg></button>', { 'aria-hidden-focus': '!fail' });
add('inert img noalt', '<div inert><img src=x.png></div>', {});
add('body aria-hidden false', null, { 'aria-hidden-body': '!fail' }, { html: '<!doctype html><html lang=en><head><title>T</title></head><body aria-hidden="false"><main><h1>x</h1></main></body></html>' });

// dialog / popover
add('dialog open no name', '<dialog open><p>Hello</p><button>OK</button></dialog>', {});
add('dialog closed noalt', '<dialog><img src=x.png></dialog>', { 'img-alt-present': 'notApplicable' });
add('popover closed noalt', '<div popover id=pp><img src=x.png></div><button popovertarget=pp>Open</button>', { 'img-alt-present': 'notApplicable', 'aria-valid-attr': '!fail' });
add('role dialog no name', '<div role=dialog><p>Hi</p></div>', { 'dialog-name-present': 'fail' });
add('role dialog name', '<div role=dialog aria-labelledby=dh><h2 id=dh>Settings</h2></div>', { 'dialog-name-present': 'pass' });
add('tooltip no name', '<div role=tooltip id=tt></div>', {});

// presentation conflict
add('presentation + focusable', '<span role=presentation tabindex=0>x</span>', {});
add('presentation + global aria', '<img src=x.png alt="" role=presentation aria-describedby=d><p id=d>d</p>', {});

// nested interactive
add('a > button', '<a href="/"><button>x</button></a>', { 'nested-interactive-controls-absent': 'fail' });
add('button > a', '<button><a href="/">x</a></button>', { 'nested-interactive-controls-absent': 'fail' });
add('label > input', '<label>Name <input type=text></label>', { 'nested-interactive-controls-absent': '!fail' });
add('summary > a', '<details><summary>More <a href="/">link</a></summary>x</details>', {});
add('a > img', '<a href="/"><img src=x.png alt=Home></a>', { 'nested-interactive-controls-absent': '!fail' });
add('option > checkbox', '<div role=listbox aria-label=l><div role=option aria-selected=false><input type=checkbox aria-label=c>A</div></div>', { 'nested-interactive-controls-absent': 'fail' });
add('button > span tabindex -1', '<button>Go <span tabindex=-1>x</span></button>', {});
add('tab with close button', '<div role=tablist aria-label=t><div role=tab tabindex=0 aria-selected=true>Doc <button aria-label="Close">x</button></div></div>', { 'presentational-children-focusable-absent': 'fail' });
add('role img with link', '<div role=img aria-label="i"><a href="/">x</a></div>', { 'presentational-children-focusable-absent': 'fail' });
add('button > svg focusable', '<button>Go <svg viewBox="0 0 1 1"></svg></button>', { 'presentational-children-focusable-absent': '!fail', 'nested-interactive-controls-absent': '!fail' });

// ---------- tables ----------
add('layout table no th 3x3', '<table><tr><td>a</td><td>b</td><td>c</td></tr><tr><td>a</td><td>b</td><td>c</td></tr><tr><td>a</td><td>b</td><td>c</td></tr></table>', { 'td-has-header': '!fail' });
add('table role presentation', '<table role=presentation><tr><td>a</td><td>b</td><td>c</td></tr><tr><td>a</td><td>b</td><td>c</td></tr><tr><td>a</td><td>b</td><td>c</td></tr></table>', { 'td-has-header': 'notApplicable' });
add('table row headers implicit', '<table><tr><th>N</th><th>A</th><th>B</th></tr><tr><th>x</th><td>1</td><td>2</td></tr><tr><th>y</th><td>3</td><td>4</td></tr></table>', { 'td-has-header': 'pass', 'table-th-has-data-cells': 'pass' });
add('table th scope col/row', '<table><thead><tr><td></td><th scope=col>A</th><th scope=col>B</th></tr></thead><tbody><tr><th scope=row>x</th><td>1</td><td>2</td></tr><tr><th scope=row>y</th><td>3</td><td>4</td></tr></tbody></table>', { 'td-has-header': 'pass', 'table-th-has-data-cells': 'pass', 'scope-attr-valid': '!fail' });
add('table headers attr ok', '<table><tr><th id=h1>A</th><th id=h2>B</th></tr><tr><td headers=h1>1</td><td headers="h2">2</td></tr></table>', { 'table-headers-attr-valid': 'pass' });
add('table headers outside', '<p id=hx>x</p><table><tr><th>A</th></tr><tr><td headers=hx>1</td></tr></table>', { 'table-headers-attr-valid': 'fail' });
add('table headers self', '<table><tr><th>A</th></tr><tr><td id=me headers=me>1</td></tr></table>', { 'table-headers-attr-valid': 'fail' });
add('table headers td-as-header', '<table><tr><td id=c1>A</td><td>B</td></tr><tr><td headers=c1>1</td><td>2</td></tr></table>', { 'table-headers-attr-valid': 'pass' });
add('table th colspan', '<table><tr><th colspan=2>Group</th></tr><tr><td>1</td><td>2</td></tr></table>', { 'td-has-header': 'pass', 'table-th-has-data-cells': 'pass' });
add('table th rowspan + caption', '<table><caption>Sales</caption><tr><th rowspan=2>Q1</th><td>1</td></tr><tr><td>2</td></tr></table>', { 'td-has-header': 'pass', 'table-th-has-data-cells': 'pass' });
add('table th empty column', '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td></td></tr></table>', { 'table-th-has-data-cells': '!fail' });
add('table th no data (header row only)', '<table><tr><th>A</th><th>B</th></tr></table>', {});
add('table empty td corner', '<table><tr><td></td><th>A</th></tr><tr><th>x</th><td>1</td></tr></table>', { 'empty-table-header': '!fail', 'td-has-header': 'pass' });
add('role grid aria cells', '<div role=grid aria-label=g><div role=row><div role=columnheader>A</div></div><div role=row><div role=gridcell>1</div></div></div>', { 'td-has-header': '!fail' });
add('nested tables', '<table><tr><th>A</th></tr><tr><td><table><tr><td>x</td></tr></table></td></tr></table>', {});

// lists
add('ul template script', '<ul><li>a</li><template><li>b</li></template><script>1</script></ul>', { 'list-children-valid': 'pass' });
add('ul div child', '<ul><div>x</div></ul>', { 'list-children-valid': 'fail' });
add('ul role list', '<ul role=list><li>a</li></ul>', { 'list-children-valid': 'pass', 'listitem-parent-valid': 'pass' });
add('li in div role list', '<div role=list><li>a</li></div>', { 'listitem-parent-valid': 'pass' });
add('menu li', '<menu><li><button>A</button></li></menu>', { 'listitem-parent-valid': 'pass', 'list-children-valid': 'pass' });
add('li orphan', '<div><li>a</li></div>', { 'listitem-parent-valid': 'fail' });
add('ul li role none parent', '<ul role=none><li>a</li></ul>', {});
add('ul li hidden', '<ul><li hidden>a</li><li>b</li></ul>', { 'list-children-valid': 'pass' });
add('ul with li role=listitem div', '<ul><div role=listitem>a</div></ul>', { 'list-children-valid': '!fail' });
add('ol li role=tab', '<ul role=tablist aria-label=t><li role=tab>a</li></ul>', { 'listitem-parent-valid': '!fail' });
add('ul li aria-hidden', '<ul><li aria-hidden=true>x</li><li>y</li></ul>', { 'list-children-valid': 'pass' });
add('ul text node', '<ul>stray<li>a</li></ul>', {});
add('dl div groups', '<dl><div><dt>a</dt><dd>b</dd></div><div><dt>c</dt><dd>d</dd></div></dl>', { 'definition-list-children-valid': 'pass', 'dlitem-parent-valid': 'pass' });
add('dl template script', '<dl><dt>a</dt><dd>b</dd><template><dt>x</dt></template><script></script></dl>', { 'definition-list-children-valid': 'pass' });
add('dl div p', '<dl><div><p>x</p></div></dl>', { 'definition-list-children-valid': 'fail' });
add('dt orphan', '<div><dt>a</dt></div>', { 'dlitem-parent-valid': 'fail' });
add('dl role=list', '<dl role=list><div role=listitem>x</div></dl>', {});

// headings
add('aria-level heading', '<div role=heading aria-level=2>Sub</div>', { 'empty-heading': '!fail', 'heading-order': '!fail' });
add('heading skip', '<h3>Skip</h3>', {});
add('heading img alt', '<h2><img src=x.png alt="Logo"></h2>', { 'empty-heading': '!fail' });
add('heading img empty alt', '<h2><img src=x.png alt=""></h2>', {});
add('heading aria-label', '<h2 aria-label="Products"></h2>', { 'empty-heading': '!fail' });
add('heading aria-hidden', '<h2 aria-hidden=true></h2>', { 'empty-heading': '!fail' });
add('h2 aria-level=1', '<h2 aria-level=1>X</h2>', {});

// iframes
add('iframe title', '<iframe src="about:blank" title="Map"></iframe>', { 'iframe-name-present': 'pass' });
add('iframe no title', '<iframe src="about:blank"></iframe>', { 'iframe-name-present': 'fail' });
add('iframe title space', '<iframe src="about:blank" title=" "></iframe>', { 'iframe-name-present': 'fail' });
add('iframe aria-label', '<iframe src="about:blank" aria-label="Map"></iframe>', { 'iframe-name-present': 'pass' });
add('iframe hidden', '<iframe src="about:blank" hidden></iframe>', { 'iframe-name-present': 'notApplicable' });
add('iframe aria-hidden tabindex -1', '<iframe src="about:blank" aria-hidden=true tabindex=-1></iframe>', { 'iframe-name-present': '!fail' });
add('iframe role presentation', '<iframe src="about:blank" role=presentation></iframe>', {});
add('iframes same title diff src', '<iframe src="/a" title="Video"></iframe><iframe src="/b" title="Video"></iframe>', {});
add('iframe srcdoc', '<iframe srcdoc="<p>hi</p>" title="x"></iframe>', { 'iframe-name-present': 'pass' });

// ids
add('dup id template', '<div id=a1>x</div><template><div id=a1>y</div></template>', { 'duplicate-id': 'pass' });
add('dup id svg symbols', '<svg style="display:none"><symbol id=s1></symbol><symbol id=s1></symbol></svg>', {});
add('dup id aria referenced', '<span id=lbl>A</span><span id=lbl>B</span><input type=text aria-labelledby=lbl>', { 'duplicate-id-aria': 'fail' });
add('dup id shadow vs light', '<div id=host></div><div id=sh>x</div>', { 'duplicate-id': 'pass' }, { setup: "const r=document.getElementById('host').attachShadow({mode:'open'}); r.innerHTML='<div id=sh>y</div>';" });
add('dup id within shadow', '<div id=host></div>', { 'duplicate-id': 'fail' }, { setup: "const r=document.getElementById('host').attachShadow({mode:'open'}); r.innerHTML='<div id=q>y</div><div id=q>z</div>';" });
add('shadow label for', '<div id=host></div>', { 'textbox-name-present': 'pass' }, { setup: "const r=document.getElementById('host').attachShadow({mode:'open'}); r.innerHTML='<label for=i>Name</label><input id=i type=text>';" });
add('light label -> shadow input', '<label for=i2>Name</label><div id=host></div>', { 'textbox-name-present': 'fail' }, { setup: "const r=document.getElementById('host').attachShadow({mode:'open'}); r.innerHTML='<input id=i2 type=text>';" });
add('labelledby across shadow', '<span id=lb>Name</span><div id=host></div>', { 'textbox-name-present': 'fail' }, { setup: "const r=document.getElementById('host').attachShadow({mode:'open'}); r.innerHTML='<input aria-labelledby=lb type=text>';" });
add('shadow slot label', '<x-field id=host><span slot=l>Email</span></x-field>', { 'textbox-name-present': '!fail' }, { setup: "const r=document.getElementById('host').attachShadow({mode:'open'}); r.innerHTML='<label><slot name=l></slot><input type=text></label>';" });
add('shadow button slotted text', '<div id=host>Save</div>', { 'button-name-present': 'pass' }, { setup: "const r=document.getElementById('host').attachShadow({mode:'open'}); r.innerHTML='<button><slot></slot></button>';" });
add('shadow img noalt', '<div id=host></div>', { 'img-alt-present': 'fail' }, { setup: "const r=document.getElementById('host').attachShadow({mode:'open'}); r.innerHTML='<img src=x.png>';" });
add('custom el internals role', '<x-btn id=xb></x-btn>', { 'button-name-present': '!fail' }, { setup: "try{customElements.define('x-btn',class extends HTMLElement{constructor(){super();try{const i=this.attachInternals();i.role='button';i.ariaLabel='Save';}catch(e){}}}); }catch(e){}" });
add('custom el FACE label', '<label for=fe>Rating</label><x-rate id=fe tabindex=0 role=slider aria-valuenow=3></x-rate>', { 'slider-name-present': '!fail' }, { setup: "try{customElements.define('x-rate',class extends HTMLElement{static formAssociated=true;constructor(){super();this.attachInternals();}});}catch(e){}" });

// tabindex / keyboard
add('tabindex 1', '<a href="/" tabindex=1>x</a>', {});
add('tabindex 0 only', '<div tabindex=0 role=button>x</div>', { 'tabindex': '!fail' });
add('accesskey dup', '<a href="/a" accesskey=s>a</a><a href="/b" accesskey=s>b</a>', {});
add('scrollable region', '<div style="overflow:auto;height:30px"><p>a</p><p>b</p><p>c</p><p>d</p></div>', {});

// media
add('video captions', '<video controls src="v.mp4"><track kind=captions src="c.vtt" srclang=en label=English></video>', { 'video-caption': '!fail' });
add('video muted autoplay', '<video src="v.mp4" muted autoplay loop playsinline></video>', { 'no-autoplay-audio': '!fail' });
add('audio autoplay', '<audio src="a.mp3" autoplay></audio>', {});
add('video poster', '<video controls poster="p.jpg" src="v.mp4"></video>', {});
add('video no track', '<video controls src="v.mp4"></video>', {});
add('audio controls', '<audio controls src="a.mp3"></audio>', {});

// lang
const langPage = (n, attrs, exp, body = '') => page('lang ' + n, `<!doctype html><html ${attrs}><head><title>T</title></head><body><main><h1>x</h1>${body}</main></body></html>`, exp);
langPage('EN', 'lang="EN"', { 'valid-lang': 'pass', 'html-lang-attr-present': 'pass' });
langPage('en-US', 'lang="en-US"', { 'valid-lang': 'pass' });
langPage('zh-Hant-TW', 'lang="zh-Hant-TW"', { 'valid-lang': 'pass' });
langPage('es-419', 'lang="es-419"', { 'valid-lang': 'pass' });
langPage('de-CH-1996', 'lang="de-CH-1996"', { 'valid-lang': 'pass' });
langPage('sgn-BE-FR', 'lang="sgn-BE-FR"', { 'valid-lang': '!fail' });
langPage('i-klingon', 'lang="i-klingon"', {});
langPage('qaa', 'lang="qaa"', { 'valid-lang': '!fail' });
langPage('cmn-Hans-CN', 'lang="cmn-Hans-CN"', { 'valid-lang': 'pass' });
langPage('en-GB-oxendict', 'lang="en-GB-oxendict"', { 'valid-lang': 'pass' });
langPage('fil', 'lang="fil"', { 'valid-lang': 'pass' });
langPage('yue-HK', 'lang="yue-HK"', { 'valid-lang': 'pass' });
langPage('zz', 'lang="zz"', { 'valid-lang': 'fail' });
langPage('english', 'lang="english"', { 'valid-lang': 'fail' });
langPage('en_US', 'lang="en_US"', {});
langPage('empty', 'lang=""', { 'html-lang-attr-present': 'fail' });
langPage('whitespace', 'lang="  "', { 'html-lang-attr-present': 'fail' });
langPage('none', '', { 'html-lang-attr-present': 'fail' });
langPage('xml:lang mismatch primary same', 'lang="en" xml:lang="en-US"', { 'html-xml-lang-mismatch': '!fail' });
langPage('xml:lang mismatch', 'lang="en" xml:lang="fr"', {});
langPage('element lang empty', 'lang="en"', { 'valid-lang': '!fail' }, '<p lang="">x</p>');
langPage('element lang bad', 'lang="en"', { 'valid-lang': 'fail' }, '<p lang="xyzzy">x</p>');
langPage('element lang on empty el', 'lang="en"', {}, '<span lang="xyzzy"></span>');
langPage('svg xml:lang', 'lang="en"', {}, '<svg xml:lang="fr" viewBox="0 0 1 1"><text>bonjour</text></svg>');
langPage('lang en-US-x-twain', 'lang="en-US-x-twain"', { 'valid-lang': 'pass' });

// meta refresh / viewport
const metaPage = (n, meta, exp) => page('meta ' + n, `<!doctype html><html lang=en><head><title>T</title>${meta}</head><body><main><h1>x</h1></main></body></html>`, exp);
metaPage('refresh 0 url', '<meta http-equiv="refresh" content="0; url=/new">', { 'meta-refresh-timing-absent': '!fail', 'meta-refresh-no-exceptions': '!fail' });
metaPage('refresh 0', '<meta http-equiv="refresh" content="0">', { 'meta-refresh-timing-absent': '!fail' });
metaPage('refresh 5', '<meta http-equiv="refresh" content="5">', { 'meta-refresh-timing-absent': 'fail' });
metaPage('refresh 5 url', '<meta http-equiv="refresh" content="5; URL=\'/x\'">', { 'meta-refresh-timing-absent': 'fail' });
metaPage('refresh 72001', '<meta http-equiv="refresh" content="72001">', { 'meta-refresh-timing-absent': '!fail' });
metaPage('refresh abc', '<meta http-equiv="refresh" content="abc">', { 'meta-refresh-timing-absent': '!fail' });
metaPage('refresh 1.5', '<meta http-equiv="refresh" content="1.5">', { 'meta-refresh-timing-absent': 'fail' });
metaPage('refresh REFRESH case', '<meta http-equiv="REFRESH" content="30">', { 'meta-refresh-timing-absent': 'fail' });
metaPage('refresh in body', '', {});
metaPage('vp no zoom', '<meta name=viewport content="width=device-width, user-scalable=no">', { 'meta-viewport-zoom-enabled': 'fail' });
metaPage('vp max 1', '<meta name=viewport content="width=device-width, maximum-scale=1.0">', { 'meta-viewport-zoom-enabled': 'fail' });
metaPage('vp max 2', '<meta name=viewport content="width=device-width, maximum-scale=2">', { 'meta-viewport-zoom-enabled': '!fail' });
metaPage('vp max 5', '<meta name=viewport content="width=device-width, initial-scale=1, maximum-scale=5">', { 'meta-viewport-zoom-enabled': 'pass' });
metaPage('vp us yes', '<meta name=viewport content="width=device-width, user-scalable=yes">', { 'meta-viewport-zoom-enabled': 'pass' });
metaPage('vp us 1', '<meta name=viewport content="user-scalable=1">', { 'meta-viewport-zoom-enabled': 'pass' });
metaPage('vp us 0', '<meta name=viewport content="user-scalable=0">', { 'meta-viewport-zoom-enabled': 'fail' });
metaPage('vp case', '<meta name="Viewport" content="User-Scalable=NO">', { 'meta-viewport-zoom-enabled': 'fail' });
metaPage('vp semicolon', '<meta name=viewport content="width=device-width; user-scalable=no">', { 'meta-viewport-zoom-enabled': 'fail' });
metaPage('vp min 1', '<meta name=viewport content="width=device-width, initial-scale=1, minimum-scale=1">', { 'meta-viewport-zoom-enabled': 'pass' });
metaPage('vp max 10', '<meta name=viewport content="maximum-scale=10">', { 'meta-viewport-zoom-enabled': 'pass' });
metaPage('vp max 1.5', '<meta name=viewport content="maximum-scale=1.5">', { 'meta-viewport-zoom-enabled': 'fail' });
metaPage('vp max yes', '<meta name=viewport content="maximum-scale=yes">', {});
metaPage('vp interactive-widget', '<meta name=viewport content="width=device-width, initial-scale=1, interactive-widget=resizes-content, viewport-fit=cover">', { 'meta-viewport-zoom-enabled': 'pass' });

// page-level
page('title whitespace', '<!doctype html><html lang=en><head><title>  </title></head><body><main><h1>x</h1></main></body></html>', { 'page-title-present': 'fail' });
page('title only svg', '<!doctype html><html lang=en><head></head><body><main><h1>x</h1><svg><title>Logo</title></svg></main></body></html>', { 'page-title-present': 'fail' });
page('title in body', '<!doctype html><html lang=en><head></head><body><title>Real</title><main><h1>x</h1></main></body></html>', {});
page('clean page', '<!doctype html><html lang=en><head><title>Clean page</title></head><body><a href="#m" class=skip>Skip to content</a><header><nav aria-label="Main"><a href="/">Home</a></nav></header><main id=m><h1>Clean</h1><p>Text <a href="/x">link</a>.</p><img src="a.png" alt=""></main><footer><p>c</p></footer><script>1</script><noscript><p>JS</p></noscript></body></html>', {});
page('article header footer', '<!doctype html><html lang=en><head><title>Blog</title></head><body><header>Site</header><main><h1>Blog</h1><article><header><h2>Post</h2></header><p>x</p><footer>By me</footer></article><article><header><h2>Post2</h2></header><footer>by you</footer></article><aside><section><header>a</header></section></aside></main><footer>Copyright</footer></body></html>', { 'landmark-no-duplicate-banner': '!fail', 'landmark-no-duplicate-contentinfo': '!fail', 'landmark-banner-is-top-level': '!fail', 'landmark-contentinfo-is-top-level': '!fail' });
page('two navs unnamed', '<!doctype html><html lang=en><head><title>T</title></head><body><nav><a href="/">a</a></nav><main><h1>x</h1></main><nav><a href="/b">b</a></nav></body></html>', {});
page('aside in main', '<!doctype html><html lang=en><head><title>T</title></head><body><main><h1>x</h1><aside><p>Note</p></aside></main></body></html>', {});
page('header in section', '<!doctype html><html lang=en><head><title>T</title></head><body><main><h1>x</h1><section><header>Section header</header></section></main><section><footer>f</footer></section></body></html>', { 'landmark-banner-is-top-level': '!fail', 'landmark-no-duplicate-banner': '!fail' });
page('main hidden second', '<!doctype html><html lang=en><head><title>T</title></head><body><main><h1>x</h1></main><main hidden><p>y</p></main></body></html>', { 'landmark-no-duplicate-main': '!fail' });
page('no landmarks', '<!doctype html><html lang=en><head><title>T</title></head><body><h1>x</h1><p>Hello</p></body></html>', {});
page('empty body', '<!doctype html><html lang=en><head><title>T</title></head><body></body></html>', {});
page('deprecated marquee', '<!doctype html><html lang=en><head><title>T</title></head><body><main><h1>x</h1><marquee>hi</marquee><center>c</center><font>f</font></main></body></html>', {});
page('blink', '<!doctype html><html lang=en><head><title>T</title></head><body><main><h1>x</h1><blink>hi</blink></main></body></html>', {});

module.exports = C;
