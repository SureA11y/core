const R=['contrast-minimum','contrast-computable'];
require('./h').run([
 ['native button', `<button>Click me</button>`],
 ['native select', `<select><option>First option</option><option>Second</option></select>`],
 ['input submit', `<input type=submit value="Send it">`],
 ['button dark bg via color-mix', `<button style="background:color-mix(in srgb, #000 50%, #fff);color:#fff;border:0">Mixed</button>`],
 ['light-dark()', `<div style="color-scheme:light;color:light-dark(#999,#fff)">Light dark text</div>`],
 ['canvastext systemcolor', `<div style="color:GrayText">System gray text</div>`],
 ['currentColor bg', `<div style="color:#000;background:currentColor"><span style="color:#fff">On currentcolor</span></div>`],
 ['details summary', `<details><summary style="color:#999">More info</summary>body</details>`],
 ['textarea content', `<textarea style="color:#ccc">Typed text</textarea>`],
 ['placeholder', `<input placeholder="Search here">`],
 ['legend over fieldset border', `<fieldset style="background:#000"><legend style="color:#fff">Legend text</legend>x</fieldset>`],
 ['mark default', `<p>Some <mark>highlighted words</mark> here</p>`],
 ['::selection n/a, ::marker list', `<ul style="color:#000"><li style="color:#000">Item</li></ul><style>li::marker{color:#eee}</style>`],
],R);
