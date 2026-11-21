const H=['empty-heading','page-has-heading-one','heading-order','heading-quality','p-as-heading'];
module.exports=[
{name:'h1-role-presentation', rules:H, html:'<main><h1 role=presentation>Title</h1><h2>Sub</h2></main>'},
{name:'h2-aria-level-1', rules:H, html:'<main><h2 id=h aria-level=1>Title</h2></main>', ax:['#h']},
{name:'div-role-heading-1', rules:H, html:'<main><div role=heading aria-level=1>Title</div></main>'},
{name:'h1-in-shadow', rules:H, html:'<x-app id=h></x-app>', setup:()=>{document.getElementById('h').attachShadow({mode:'open'}).innerHTML='<h1>Title</h1>';}},
{name:'h1-img-empty-alt', rules:H, html:'<main><h1 id=h><img src=x.png alt=""></h1></main>', ax:['#h']},
{name:'h1-img-alt', rules:H, html:'<main><h1 id=h><img src=x.png alt="ACME"></h1></main>', ax:['#h']},
{name:'h-aria-level-7', rules:H, html:'<main><h1>A</h1><div id=h role=heading aria-level=7>Deep</div><h2 id=g aria-level=9>X</h2></main>', ax:['#h','#g']},
{name:'h-hgroup', rules:H, html:'<main><hgroup><h1>Title</h1><p>Subtitle</p></hgroup><h3>Skip</h3></main>'},
{name:'h-level-skip', rules:H, html:'<main><h1>A</h1><h3 id=x>C</h3><h2>B</h2><h4>D</h4></main>'},
{name:'h-empty-aria-label', rules:H, html:'<main><h1>A</h1><h2 id=h aria-label="Products"></h2><h2 id=g aria-hidden=true></h2><h2 id=k><span aria-hidden=true>x</span></h2></main>', ax:['#h','#k']},
{name:'h-only-whitespace-nbsp', rules:H, html:'<main><h1>A</h1><h2 id=h>&nbsp;</h2><h2 id=g>&#8203;</h2></main>', ax:['#h','#g']},
{name:'p-bold-heading', rules:H, html:'<main><h1>A</h1><p><b>Shipping</b></p><p>We ship things to many places in the world all year long.</p><p style="font-weight:bold;font-size:24px">Returns</p><p>Return policy text goes here with enough words.</p></main>'},
{name:'p-bold-cjk', rules:H, html:'<main lang=ja><h1>A</h1><p><strong>配送について</strong></p><p>当店では全国へ配送いたします。詳しくは以下をご覧ください。</p></main>'},
{name:'heading-quality-cases', rules:H, html:'<main><h1>Untitled</h1><h2>Heading</h2><h2>...</h2><h2>Lorem ipsum</h2><h2>FAQ</h2><h2>-</h2></main>'},
];
