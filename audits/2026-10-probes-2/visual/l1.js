const R=['link-in-text-block'];
const st='<style>a{color:#333;text-decoration:none} p{color:#000}</style>';
require('./h').run([
 ['baseline color only', st+'<p>Read the <a href="/x">guide here</a> now.</p>'],
 ['sup wrapper', st+'<p>A claim<sup><a href="#fn1">1</a></sup> more text.</p>'],
 ['sup inside link', st+'<p>A claim<a href="#fn1"><sup>1</sup></a> more text.</p>'],
 ['link valign super', st+'<p>A claim<a href="#fn1" style="vertical-align:super;font-size:smaller">1</a> more text.</p>'],
 ['code chip inside link', st+'<p>Call <a href="/x"><code style="background:#ddd;padding:2px">fetch()</code></a> to load.</p>'],
 ['mark inside link', st+'<p>See <a href="/x"><mark>this note</mark></a> for more.</p>'],
 ['overline', st+'<p>Read the <a href="/x" style="text-decoration:overline">guide here</a> now.</p>'],
 ['underline transparent color', st+'<p>Read the <a href="/x" style="text-decoration:underline;text-decoration-color:transparent">guide here</a> now.</p>'],
 ['link inline-block bg same', st+'<p style="background:#fff">Read the <a href="/x" style="background:#fff">guide</a> now.</p>'],
 ['link uppercase', st+'<p>Read the <a href="/x" style="text-transform:uppercase">guide here</a> now.</p>'],
 ['link font-size bigger', st+'<p>Read the <a href="/x" style="font-size:2em">guide here</a> now.</p>'],
 ['link underline via ::after border pseudo (no content)', st+'<style>a.u{position:relative}a.u::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:#333}</style><p>Read the <a class=u href="/x">guide here</a> now.</p>'],
 ['link role=link span', st+'<p>Read the <span role=link tabindex=0 style="color:#333">guide</span> now.</p>'],
 ['parent bold link bold (same)', st+'<p style="font-weight:bold">Read the <a href="/x">guide</a> now.</p>'],
 ['link outline 0px solid', st+'<p>Read the <a href="/x" style="outline:0px solid red">guide</a> now.</p>'],
 ['link box-shadow transparent', st+'<p>Read the <a href="/x" style="box-shadow:0 0 0 transparent">guide</a> now.</p>'],
],R);
