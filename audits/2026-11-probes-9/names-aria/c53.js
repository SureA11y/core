const R=['button-name-present','img-alt-present','link-name-present','aria-hidden-body','aria-hidden-focus'];
module.exports=[
{name:'html-ah-unnamed', rules:R, html:'<!doctype html><html lang=en aria-hidden="true"><head><title>T</title></head><body><main><button id=b></button><img id=i src=x.png><a id=a href="/"></a></main></body></html>', ax:['#b','#i','#a']},
{name:'body-ah-unnamed', rules:R, html:'<!doctype html><html lang=en><head><title>T</title></head><body aria-hidden="true"><main><button id=b></button><img id=i src=x.png><a id=a href="/"></a></main></body></html>', ax:['#b','#i','#a']},
];
