const R=['svg-text-alternative-present','svg-text-alternative-quality','role-img-text-alternative-present','img-alt-decorative'];
module.exports=[
{name:'svg-img-text', rules:R, html:'<svg id=a role=img width=50 height=20><text x=0 y=15>Sales 2024</text></svg>', ax:['#a']},
{name:'svg-img-desc-only', rules:R, html:'<svg id=a role=img width=20 height=20><desc>A bar chart</desc><rect width=5 height=5 /></svg>', ax:['#a']},
{name:'svg-noroles-title-empty-then-label', rules:R, html:'<svg id=a role=img aria-label="Logo" width=20 height=20><title></title></svg>', ax:['#a']},
{name:'svg-graphics-document', rules:R, html:'<svg id=a role=graphics-document width=20 height=20><rect width=5 height=5 /></svg><svg id=b role=graphics-symbol width=20 height=20></svg>', ax:['#a','#b']},
{name:'svg-no-role-shapes', rules:R, html:'<svg id=a width=20 height=20><circle r=5 cx=5 cy=5 /></svg><svg id=b width=20 height=20 focusable=false><title>Search</title><circle r=5 cx=5 cy=5 /></svg>', ax:['#a','#b']},
{name:'svg-title-lang', rules:R, html:'<svg id=a role=img width=20 height=20><title lang=fr>Bonjour</title><title lang=en>Hello</title></svg>', ax:['#a']},
{name:'svg-use-title', rules:R, html:'<svg style="display:none"><symbol id=s><title>Cart</title><path d="M0 0h5v5z"/></symbol></svg><svg id=a role=img width=20 height=20><use href="#s"/></svg>', ax:['#a']},
];
