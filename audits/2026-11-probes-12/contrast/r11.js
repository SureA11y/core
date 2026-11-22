const { four, page, close } = require('./h.js');
const cm=['contrast-minimum'], lk=['link-in-text-block'];
const cases = [
 ['email <font color> on bgcolor table', `<table bgcolor="#336699"><tr><td><font color="#003366">Your order has shipped</font></td></tr></table>`, cm],
 ['email td bgcolor light, font color light', `<table><tr><td bgcolor="#ffffff"><font color="#bbbbbb" face="Arial">Unsubscribe here</font></td></tr></table>`, cm],
 ['<body text> legacy', `</main><script></script><main>x`, cm],
 ['bgcolor="transparent" / invalid', `<table bgcolor="#000"><tr><td bgcolor="transparent"><font color="#222">Dark on black</font></td></tr></table>`, cm],
 ['legacy color "chucknorris"', `<table bgcolor="chucknorris"><tr><td><font color="#600">Text</font></td></tr></table>`, cm],
 ['font color 3-digit legacy "fff" (no #)', `<div style="background:#fff"><font color="ddd">Pale words</font></div>`, cm],
 ['style wins over hint', `<table bgcolor="#000"><tr><td style="background:#fff"><font color="#eee" style="color:#000">Readable</font></td></tr></table>`, cm],
 ['color: revert on span inside dark', `<div style="background:#000;color:#fff">Intro <span style="color:revert">reverted</span></div>`, cm],
 ['color: revert on link', `<div style="background:#000;color:#fff">See <a href="#" style="color:revert">the link</a></div>`, cm],
 ['color: revert-layer', `<style>@layer a{span{color:#fff}}</style><div style="background:#000;color:#fff">Intro <span style="color:revert-layer">rl</span></div>`, cm],
 ['font color inside shadow (hint flat tree)', `<div><template shadowrootmode="open"><table bgcolor="#000"><tr><td><slot></slot></td></tr></table></template><font color="#111">Hidden in dark</font></div>`, cm],
 ['disabled fieldset legend control', `<fieldset disabled><legend><label><input type="checkbox"> <span style="color:#bbb">Enable all</span></label></legend><label style="color:#bbb">Other<input></label></fieldset>`, cm],
 ['link: default <u> underline in para', `<p style="color:#000">Read <a href="#" style="color:#333;text-decoration:none"><u>terms</u></a> now.</p>`, lk],
 ['link: underline !important removed', `<style>a{text-decoration:none!important}</style><p style="color:#000">Read <a href="#" style="color:#333;text-decoration:underline">terms</a> now.</p>`, lk],
 ['link: underline via var()', `<style>:root{--u:underline}a{text-decoration:var(--u)}</style><p style="color:#000">Read <a href="#" style="color:#333">terms</a> now.</p>`, lk],
 ['link: transparent underline colour', `<style>a{text-decoration:underline;text-decoration-color:transparent}</style><p style="color:#000">Read <a href="#" style="color:#333">terms</a> now.</p>`, lk],
 ['link: underline colour = rgba(0,0,0,0) via var', `<style>:root{--c:rgba(0,0,0,0)}a{text-decoration:underline var(--c)}</style><p style="color:#000">Read <a href="#" style="color:#333">terms</a> now.</p>`, lk],
 ['link: underline in @layer overridden by unlayered', `<style>@layer base{a{text-decoration:underline}} a{text-decoration:none}</style><p style="color:#000">Read <a href="#" style="color:#333">terms</a> now.</p>`, lk],
 ['link: border-bottom cue', `<style>a{text-decoration:none;border-bottom:1px solid currentColor}</style><p style="color:#000">Read <a href="#" style="color:#333">terms</a> now.</p>`, lk],
 ['link: <font color> legacy link color in para', `<p style="color:#000">Read <a href="#" style="text-decoration:none"><font color="#222">terms</font></a> now.</p>`, lk],
 ['body link= attr, no underline', `<style>a{text-decoration:none}</style><p>Read <a href="#">terms</a> now.</p><script>document.body.setAttribute('link','#111111')</script>`, lk],
];
(async () => { for (const [l, b, ids] of cases) await four(l, page(b), ids); await close(); })();
