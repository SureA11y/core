const G=['html-lang-attr-present','valid-lang','html-xml-lang-mismatch'];
const doc=(attrs,body='<p>Hello world</p>')=>`<!doctype html><html ${attrs}><head><title>T</title></head><body>${body}</body></html>`;
module.exports=[
{name:'lang-empty-xml', rules:G, html:doc('lang="" xml:lang="en"')},
{name:'lang-space', rules:G, html:doc('lang="  "')},
{name:'lang-underscore', rules:G, html:doc('lang="en_US"')},
{name:'lang-grandfathered', rules:G, html:doc('lang="i-klingon"')},
{name:'lang-x-private', rules:G, html:doc('lang="x-pig-latin"')},
{name:'lang-zh-hant', rules:G, html:doc('lang="zh-Hant-TW"')},
{name:'lang-3letter', rules:G, html:doc('lang="yue"')},
{name:'lang-4letter', rules:G, html:doc('lang="abcd"')},
{name:'lang-xmllang-mismatch-region', rules:G, html:doc('lang="en" xml:lang="en-GB"')},
{name:'lang-xmllang-mismatch', rules:G, html:doc('lang="fr" xml:lang="en"')},
{name:'lang-xmllang-invalid', rules:G, html:doc('lang="en" xml:lang="english"')},
{name:'elem-lang-invalid-empty-text', rules:G, html:doc('lang="en"','<p>Hi</p><span lang="xx-invalid-zz"></span><p lang="english">Text</p><p lang="">Text</p>')},
{name:'elem-lang-hidden', rules:G, html:doc('lang="en"','<p>Hi</p><p lang="english" hidden>Text</p><p lang="english" aria-hidden=true>Text</p>')},
{name:'elem-lang-img-alt', rules:G, html:doc('lang="en"','<p>Hi</p><img lang="frrr" src=x.png alt="Bonjour">')},
{name:'elem-lang-whitespace-trim', rules:G, html:doc('lang=" en "')},
{name:'lang-iw', rules:G, html:doc('lang="iw"')},
{name:'lang-uppercase', rules:G, html:doc('lang="EN-us"')},
{name:'lang-numeric-region', rules:G, html:doc('lang="es-419"')},
{name:'lang-svg-xmllang', rules:G, html:doc('lang="en"','<p>Hi</p><svg xml:lang="zzzzzzzzz"><text>Hello</text></svg>')},
];
