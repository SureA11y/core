const R=['aria-allowed-role'];
module.exports=[
{name:'redundant', rules:R, html:'<nav role=navigation>x</nav><button role=button>x</button><ul role=list><li role=listitem>x</li></ul><main role=main>x</main><section role=region aria-label=s>x</section><section role=region>unnamed</section>'},
{name:'a-nohref', rules:R, html:'<a id=a role=button tabindex=0>x</a><a id=b role=heading aria-level=2>x</a>'},
{name:'img-alt-empty-roles', rules:R, html:'<img id=a src=x.png alt="" role=img><img id=b src=x.png alt="" role=button tabindex=0>'},
{name:'header-footer-roles', rules:R, html:'<header id=a role=group>x</header><footer id=b role=none>x</footer><aside id=c role=note>x</aside><article id=d role=feed>x</article>'},
{name:'input-text-roles', rules:R, html:'<input id=a type=text role=combobox aria-expanded=false aria-label=c><input id=b type=text role=searchbox aria-label=s><input id=c type=text role=spinbutton aria-label=s aria-valuenow=1><input id=d type=email role=combobox aria-expanded=false aria-label=e>'},
];
