module.exports = `<!doctype html><html lang="en"><head><title>T</title><style>.lc{color:#999;background:#fff}</style></head><body>
<header><a href="#m">Skip</a><nav><a href="/a">click here</a><a href="/b"></a></nav></header>
<main id="m"><h1>Title</h1><h3>Skipped</h3>
<img src="a.png"><img src="b.png" alt="image">
<button></button><div role="button">x</div><div role="grid"></div><div role="table"></div>
<input type="text"><label>Name <input type="text"></label>
<p class="lc">low contrast text</p>
<table><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>
<p><b>Opening hours</b></p><p>Mon to Fri 9 to 5 and more text here to read.</p>
<div id="dup"></div><div id="dup"></div>
<ul><div>bad</div></ul>
<a href="/c" aria-label="x">Y</a>
<input type="checkbox" aria-checked="maybe">
<svg role="img"></svg>
</main></body></html>`;
