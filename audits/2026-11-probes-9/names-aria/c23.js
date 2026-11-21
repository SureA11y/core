const R=['aria-allowed-role','aria-allowed-attr','presentation-role-conflict'];
module.exports=[
{name:'allowed-roles-ok', rules:R, html:'<a href="/" role=button>x</a><a href="/" role=menuitem>x</a><button role=tab>x</button><img src=x.png alt="" role=none><ul role=menu><li role=menuitem>x</li></ul><input type=checkbox role=switch aria-label=s><input type=checkbox role=menuitemcheckbox aria-label=s><section role=doc-chapter aria-label=c>x</section><nav role=doc-toc>x</nav><h2 role=tab>x</h2><li role=tab>x</li>'},
{name:'allowed-roles-bad', rules:R, html:'<button id=a role=heading>x</button><a id=b href="/" role=heading>x</a><input id=c type=text role=button><main id=d role=navigation>x</main><nav id=e role=main>x</nav><select id=f role=menu><option>1</option></select><label id=g role=button>x</label>'},
{name:'img-alt-role', rules:R, html:'<img id=a src=x.png alt="Logo" role=presentation><img id=b src=x.png alt="Logo" role=link><img id=c src=x.png alt="" role=img><img id=d src=x.png role=button>'},
{name:'svg-roles', rules:R, html:'<svg id=a role=button tabindex=0 aria-label=x></svg><svg id=b role=presentation></svg><svg id=c role=none><title>x</title></svg>'},
{name:'body-html-role', rules:R, html:'<!doctype html><html lang=en role=application><head><title>T</title></head><body role=document><p>x</p></body></html>'},
{name:'custom-element-role', rules:R, html:'<x-tab role=tab>x</x-tab><x-foo role=heading aria-level=2>x</x-foo>'},
{name:'input-button-role', rules:R, html:'<input type=button value=x role=menuitemradio aria-checked=false><input type=image alt=x role=link src=x.png><input type=search role=combobox aria-expanded=false aria-label=s>'},
{name:'aria-attr-on-native', rules:R, html:'<input id=a type=checkbox aria-checked=true aria-label=x><input id=b type=text aria-valuenow=3 aria-label=x><button id=c aria-selected=true>x</button><h2 id=d aria-expanded=true>x</h2><a id=e href="/" aria-pressed=true>x</a><td id=f aria-sort=ascending>x</td>'},
{name:'aria-attr-role-mismatch', rules:R, html:'<div role=link tabindex=0 aria-checked=true>x</div><div role=row aria-expanded=true><div role=gridcell>x</div></div><div role=tab aria-required=true tabindex=0>x</div>'},
];
