const { cases, close } = require('./multi');
(async () => {
await cases([
 ['col background', `<table style="border-collapse:collapse"><colgroup><col style="background:#000"></colgroup><tr><td style="color:#fff;padding:8px">Cell text on black column</td></tr></table>`],
 ['colgroup background', `<table><colgroup style="background:#000"><col></colgroup><tr><td style="color:#fff">Cell text on black colgroup</td></tr></table>`],
 ['col bg light text dark (should fail?)', `<body style="background:#000"><table><colgroup><col style="background:#fff"></colgroup><tr><td style="color:#aaa">Grey on white col</td></tr></table></body>`],
 ['inset box-shadow as bg', `<div style="box-shadow:inset 0 0 0 1000px #000;padding:10px"><p style="color:#fff">White on inset shadow</p></div>`],
 ['inset box-shadow, dark text', `<div style="box-shadow:inset 0 0 0 1000px #000;padding:10px"><p style="color:#333">Dark on inset shadow</p></div>`],
 ['html bg black, body white short, text overflow body', `<html style="background:#000"><body style="background:#fff;margin:0;height:20px"><div style="height:20px"></div><p style="color:#fff;margin:0">White text below body box</p></body></html>`],
 ['body bg propagates', `<body style="background:#000;margin:0;height:10px"><p style="position:absolute;top:300px;color:#fff">White on canvas from body</p></body>`],
 ['border-image', `<div style="border:30px solid;border-image:linear-gradient(#000,#000) 30;color:#fff;font-size:20px"><span style="display:block;margin:-25px 0 0 0">On border image</span></div>`],
 ['mark default', `<p>Some <mark>highlighted</mark> text</p>`],
 ['filter brightness on text', `<p style="color:#777;filter:brightness(0.3)">Filtered</p>`],
 ['background-blend-mode', `<div style="background-color:#fff;background-image:linear-gradient(#000,#000);background-blend-mode:screen"><p style="color:#eee">Blend bg</p></div>`],
 ['dialog modal top layer', `<p style="color:#000">Page</p><dialog id=d style="background:#000;color:#fff">Dialog text</dialog><script>document.getElementById('d').showModal()</script>`],
 ['popover top layer', `<div popover id=pp style="background:#000;color:#fff;border:0">Popover text</div><div style="position:fixed;inset:0;background:#fff;z-index:2147483647"></div><script>document.getElementById('pp').showPopover()</script>`],
], undefined);
await close();
})();
