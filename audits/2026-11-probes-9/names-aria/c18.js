const I=['iframe-name-present','iframe-title-unique','identical-iframes-same-purpose','iframe-focusable-content'];
const P=['page-title-present','page-title-patterns'];
const doc=(head,body='<main>x</main>')=>`<!doctype html><html lang="en"><head>${head}</head><body>${body}</body></html>`;
module.exports=[
{name:'iframe-title-space', rules:I, html:'<iframe id=a title=" " srcdoc="hi"></iframe><iframe id=b aria-label="Map" srcdoc="hi"></iframe><iframe id=c aria-hidden=true srcdoc="x"></iframe><iframe id=d role=presentation srcdoc="x"></iframe>', ax:['#a','#b','#d']},
{name:'iframe-display-none-hidden', rules:I, html:'<iframe id=a hidden srcdoc="x"></iframe><iframe id=b style="width:0;height:0;border:0" srcdoc="x"></iframe>', ax:['#b']},
{name:'iframe-same-title-diff-src', rules:I, html:'<iframe title="Video" src="https://www.youtube.com/embed/aaa"></iframe><iframe title="video" src="https://www.youtube.com/embed/bbb"></iframe>'},
{name:'iframe-title-labelledby', rules:I, html:'<h2 id=h>Map</h2><iframe id=a aria-labelledby=h srcdoc="x"></iframe>', ax:['#a']},
{name:'frame-frameset', rules:I, html:'<!doctype html><html lang=en><head><title>T</title></head><frameset><frame src="about:blank"><frame title="Nav" src="about:blank"></frameset></html>'},
{name:'title-space', rules:P, html:doc('<title> </title>')},
{name:'title-two-first-empty', rules:P, html:doc('<title></title><title>Real</title>')},
{name:'title-in-body-svg', rules:P, html:doc('','<svg><title>Icon</title></svg><main>x</main>')},
{name:'title-in-body', rules:P, html:'<!doctype html><html lang=en><head></head><body><title>In body</title><main>x</main></body></html>'},
{name:'title-patterns', rules:P, html:doc('<title>Home</title>')},
{name:'title-patterns2', rules:P, html:doc('<title>index.html</title>')},
{name:'title-patterns3', rules:P, html:doc('<title>Untitled Document</title>')},
{name:'title-patterns4', rules:P, html:doc('<title>React App</title>')},
{name:'title-zwsp', rules:P, html:doc('<title>&#8203;</title>')},
];
