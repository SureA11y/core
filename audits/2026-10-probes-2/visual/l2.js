const R=['link-in-text-block'];
const st='<style>a{color:#444;text-decoration:none}</style>';
require('./h').run([
 ['pipe separated footer nav', st+'<footer><p><a href="/p">Privacy</a> | <a href="/t">Terms</a> | <a href="/c">Contact</a></p></footer>'],
 ['breadcrumb with >', st+'<nav><div><a href="/">Home</a> &gt; <a href="/docs">Docs</a> &gt; Page</div></nav>'],
 ['::after underline with border', st+'<style>a.u{position:relative}a.u::after{content:"";position:absolute;left:0;right:0;bottom:-2px;border-bottom:2px solid currentColor}</style><p>Read the <a class=u href="/x">guide here</a> now.</p>'],
],R);
