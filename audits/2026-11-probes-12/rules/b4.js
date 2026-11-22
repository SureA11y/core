const {run4,setMsg}=require('./h.js');setMsg(150);
const W=(b)=>`<!doctype html><html lang=en><head><title>t</title></head><body><main>${b}</main></body></html>`;
const PC=['aria-prohibited-children','aria-required-children','aria-required-parent'];
const HL=['heading-order','page-has-heading-one','aria-valid-attr-value'];
const LQ=['link-name-quality','link-name-quality-link-only'];
const sh=(host,inner)=>`<script>customElements.define('${host}',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML=${JSON.stringify(inner)};}})</script>`;
const cases=[
 ['pc-wrapper-button',PC,'<div role="tablist"><div><div role="tab" aria-selected=true>A</div><div role="button" tabindex=0>+</div></div></div>'],
 ['pc-wrapper-named',PC,'<div role="tablist"><div aria-label="grp"><div role="tab">A</div></div></div>'],
 ['pc-wrapper-focus',PC,'<div role="tablist"><div tabindex=0><div role="tab">A</div></div></div>'],
 ['pc-wrapper-title',PC,'<div role="tablist"><div title="x"><div role="tab">A</div></div></div>'],
 ['pc-owns',PC,'<div role="list" aria-owns="t"></div><div id="t" role="tab">x</div>'],
 ['pc-owns-ok',PC,'<div role="list" aria-owns="t"></div><div id="t" role="listitem">x</div>'],
 ['pc-menu-sub',PC,'<ul role="menubar"><li role="none"><a role="menuitem" href=#>File</a><ul role="menu"><li role="none"><a role=menuitem href=#>New</a></li></ul></li></ul>'],
 ['pc-radio-sep',PC,'<div role="radiogroup" aria-label="r"><div class="card"><div role="radio" aria-checked=false tabindex=0>A</div><hr></div></div>'],
 ['pc-listbox-group',PC,'<div role=listbox aria-label=x><div role=group aria-label=g><div role=option>a</div></div></div>'],
 ['pc-text-in-tablist',PC,'<div role="tablist"><div><span>Pick:</span><div role="tab">A</div></div></div>'],
 ['pc-img-in-list',PC,'<div role=list><div role=listitem>a</div><img src=x.png alt="deco"></div>'],
 ['pc-shadow-tab',PC,'<x-tabs role=tablist></x-tabs>'+sh('x-tabs','<div role=tab>A</div><div role=tab>B</div>')],
 ['pc-shadow-slot',PC,'<x-tl role=tablist><div role=tab>A</div></x-tl>'+sh('x-tl','<div class=w><slot></slot></div>')],
 ['pc-shadow-slot-button',PC,'<x-tl role=tablist><div role=tab>A</div></x-tl>'+sh('x-tl','<slot></slot><button>+</button>')],
 ['pc-shadow-unslotted',PC,'<x-tl role=tablist><div role=tab>A</div></x-tl>'+sh('x-tl','<div role=tab>Z</div>')],
 ['rc-empty-tablist-shadow',PC,'<x-tl2 role=tablist></x-tl2>'+sh('x-tl2','<div>x</div>')],
 ['rc-busy',PC,'<div role=list aria-busy=true></div>'],
 ['hl-h3role',HL,'<h1>A</h1><h3 role=heading>B</h3>'],
 ['hl-h3role-lvl',HL,'<h1>A</h1><h3 role=heading aria-level=2>B</h3>'],
 ['hl-arialevel-0',HL,'<h1>A</h1><div role=heading aria-level=0>B</div><h2>C</h2>'],
 ['hl-arialevel-big',HL,'<h1>A</h1><div role=heading aria-level=12>B</div>'],
 ['hl-arialevel-neg',HL,'<h1>A</h1><div role=heading aria-level=-3>B</div>'],
 ['hl-arialevel-float',HL,'<h1>A</h1><div role=heading aria-level="2.7">B</div>'],
 ['hl-arialevel-on-h2',HL,'<h1>A</h1><h2 aria-level=4>B</h2>'],
 ['hl-arialevel-ws',HL,'<h1>A</h1><div role=heading aria-level=" 3 ">B</div>'],
 ['lq-click-here',LQ,'<p>To read our report, <a href="/r">click here</a>.</p>'],
 ['lq-read-more-card',LQ,'<article><h2>Report 2025</h2><p>Summary of results.</p><a href="/r">Read more</a></article>'],
 ['lq-read-more-sr',LQ,'<article><h2>Report</h2><a href="/r">Read more<span class="screen-reader-text"> about Report</span></a></article><style>.screen-reader-text{position:absolute;clip:rect(1px,1px,1px,1px);width:1px;height:1px;overflow:hidden}</style>'],
 ['lq-aria-label',LQ,'<p><a href="/r" aria-label="Read more about the report">Read more</a></p>'],
 ['lq-es',LQ,'<p lang=es>Para ver el informe, <a href="/r">haga clic aquí</a>.</p>'],
 ['lq-ja',LQ,'<p lang=ja>詳しくは<a href="/r">こちら</a>をご覧ください。</p>'],
 ['lq-de',LQ,'<p lang=de>Den Bericht finden Sie <a href="/r">hier</a>.</p>'],
 ['lq-fr',LQ,'<p lang=fr>Pour le rapport, <a href="/r">cliquez ici</a>.</p>'],
 ['lq-alone',LQ,'<a href="/r">Click here</a>'],
 ['lq-url',LQ,'<p>See <a href="https://example.com/a">https://example.com/a</a></p>'],
 ['lq-more-li',LQ,'<ul><li>Annual report 2025 <a href="/r">more</a></li></ul>'],
 ['lq-td',LQ,'<table><tr><th>Doc</th><th>Link</th></tr><tr><td>Annual report</td><td><a href="/r">Download</a></td></tr></table>'],
];
run4(cases.map(([n,r,b])=>({name:n,rules:r,html:W(b)})));
