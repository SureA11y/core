// Cases with an expected outcome; prints both runtimes, marks mismatches with !!
const { js, cr, rule, brief, page, close } = require('./h.js');
const C = [
 ['p-as-heading: "Note:" followed by text in same p', 'p-as-heading', '<p><strong>Note:</strong> the shop closes early.</p><p>More text here follows.</p>', ['notApplicable','pass'], ''],
 ['p-as-heading: bold label line "Phone:" then value p', 'p-as-heading', '<p><strong>Phone:</strong></p><p>+34 600 000 000</p>', ['cantTell','pass','notApplicable'], ''],
 ['p-as-heading: bold "Warning: do not touch:"', 'p-as-heading', '<p><b>Warning: the oven is hot, do not touch it:</b></p><p>Wear gloves when you open the door.</p>', ['notApplicable','pass','cantTell'], ''],
 ['p-as-heading: time "10:30"', 'p-as-heading', '<p><b>10:30</b></p><p>Coffee break in the hall.</p>', ['notApplicable','pass'], ''],
 ['p-as-heading: fullwidth colon CJK', 'p-as-heading', '<p lang="ja"><b>材料：</b></p><p lang="ja">米、水、塩を用意します。</p>', ['cantTell'], ''],
 ['p-as-heading: label for form in p', 'p-as-heading', '<p><b>Email:</b></p><p><input aria-label="Email"></p>', ['notApplicable','pass','cantTell'], ''],
 ['p-as-heading: question ending "?"', 'p-as-heading', '<p><b>How do I return an item?</b></p><p>Send it back within 30 days.</p>', ['cantTell','notApplicable','pass'], ''],
 ['p-as-heading: link only bold', 'p-as-heading', '<p><b><a href="/">Read more:</a></b></p><p>Text after it here.</p>', ['notApplicable','pass'], ''],
 ['p-as-heading: RTL arabic colon', 'p-as-heading', '<p dir="rtl" lang="ar"><b>المكونات:</b></p><p dir="rtl" lang="ar">أرز وماء وملح.</p>', ['cantTell'], ''],
 ['click-handler: bootstrap a.btn without href', 'click-handler-keyboard-operable', '<a class="btn btn-primary" onclick="go()" style="padding:6px 12px;background:#0d6efd;color:#fff;border:1px solid #0d6efd">Buy</a>', ['cantTell','fail'], ''],
 ['click-handler: label with onclick (native activation)', 'click-handler-keyboard-operable', '<label onclick="go()" style="padding:6px;border:1px solid">Pick <input type="checkbox"></label>', ['pass','notApplicable'], ''],
 ['click-handler: tr row onclick with link inside', 'click-handler-keyboard-operable', '<table><tr onclick="go()"><td><a href="/x">Order 12</a></td><td>$5</td></tr></table>', ['pass','notApplicable'], ''],
 ['click-handler: card onclick with button inside', 'click-handler-keyboard-operable', '<div onclick="go()" style="padding:16px;border:1px solid #ccc;background:#fff"><h3>Card</h3><button>Open</button></div>', ['pass','notApplicable'], ''],
 ['click-handler: body onclick', 'click-handler-keyboard-operable', '</main><div onclick="closeMenu()"><main><p>x</p>', ['notApplicable','pass'], ''],
 ['click-handler: tag span w padding (tags)', 'click-handler-keyboard-operable', '<span onclick="go()" style="padding:2px 6px;background:#eee;border-radius:3px">#css</span>', ['cantTell'], ''],
 ['click-handler: img onclick lightbox', 'click-handler-keyboard-operable', '<img src="a.png" alt="Photo" onclick="zoom()">', ['cantTell','fail'], ''],
 ['click-handler: overlay backdrop onclick', 'click-handler-keyboard-operable', '<div class="modal-backdrop" onclick="closeModal()" style="position:fixed;inset:0;background:rgba(0,0,0,.5)"></div>', ['notApplicable','pass','cantTell'], ''],
 ['click-handler: div role=button tabindex 0 no key handler', 'click-handler-keyboard-operable', '<div role="button" tabindex="0" onclick="go()">Go</div>', ['cantTell','fail'], ''],
 ['click-handler: summary onclick', 'click-handler-keyboard-operable', '<details><summary onclick="go()">S</summary>x</details>', ['pass','notApplicable'], ''],
 ['video poster: named via aria-label', 'video-poster-text-alternative-present', '<video poster="p.png" aria-label="Intro" controls></video>', ['pass'], ''],
 ['video poster: named via title', 'video-poster-text-alternative-present', '<video poster="p.png" title="Intro" controls></video>', ['pass'], ''],
 ['video poster: in figure with figcaption', 'video-poster-text-alternative-present', '<figure><video poster="p.png" controls></video><figcaption>Intro video</figcaption></figure>', ['cantTell','pass'], ''],
 ['video poster: aria-hidden', 'video-poster-text-alternative-present', '<video poster="p.png" aria-hidden="true"></video>', ['notApplicable'], ''],
 ['video poster: empty poster attr', 'video-poster-text-alternative-present', '<video poster="" controls></video>', ['notApplicable'], ''],
 ['prohibited children: radix tabs (div wrappers + buttons)', 'aria-prohibited-children', '<div dir="ltr" data-orientation="horizontal"><div role="tablist" aria-orientation="horizontal" tabindex="0" style="outline:none"><button type="button" role="tab" aria-selected="true">A</button><button type="button" role="tab" aria-selected="false" tabindex="-1">B</button></div></div>', ['pass'], ''],
 ['prohibited children: headless listbox w/ ul > li[role=option] + hidden input', 'aria-prohibited-children', '<ul role="listbox" aria-label="x" tabindex="0"><li role="option" aria-selected="true">A</li><input type="hidden" name="v"></ul>', ['pass'], ''],
 ['prohibited children: MUI menu (ul role=menu, li role=menuitem, hr)', 'aria-prohibited-children', '<ul role="menu" tabindex="-1"><li role="menuitem" tabindex="0">Profile</li><hr><li role="menuitem" tabindex="-1">Logout</li></ul>', ['pass'], ''],
 ['prohibited children: menu w/ li.divider role=separator + heading group', 'aria-prohibited-children', '<ul role="menu"><li role="presentation"><h6>Section</h6></li><li role="menuitem">A</li></ul>', ['fail','cantTell','pass'], ''],
 ['prohibited children: listbox with group label div', 'aria-prohibited-children', '<div role="listbox" aria-label="x"><div role="group" aria-labelledby="g"><div id="g" role="presentation">Fruits</div><div role="option">A</div></div></div>', ['pass'], ''],
 ['prohibited children: tablist with aria-owns to tab elsewhere', 'aria-prohibited-children', '<div role="tablist" aria-owns="t2"><div role="tab">A</div></div><div id="t2" role="tab">B</div>', ['pass'], ''],
 ['prohibited children: list with aria-owns to button', 'aria-prohibited-children', '<ul aria-owns="b"><li>a</li></ul><button id="b">x</button>', ['fail'], ''],
 ['prohibited children: owns with whitespace id list', 'aria-prohibited-children', '<div role="list" aria-owns=" a  b "></div><div id="a" role="listitem">1</div><div id="b" role="listitem">2</div>', ['pass'], ''],
 ['prohibited children: owns hidden button', 'aria-prohibited-children', '<div role="list" aria-owns="b"><div role="listitem">a</div></div><button id="b" hidden>x</button>', ['pass'], ''],
 ['prohibited children: listbox focusable wrapper div tabindex 0', 'aria-prohibited-children', '<div role="listbox" aria-label="x"><div tabindex="0"><div role="option">A</div></div></div>', ['fail','cantTell'], ''],
 ['embed: svg', 'embed-text-alternative-present', '<embed src="chart.svg" type="image/svg+xml">', ['fail'], ''],
 ['embed: src query .pdf?x', 'embed-text-alternative-present', '<embed src="doc.pdf?v=2">', ['notApplicable'], ''],
 ['embed: src fragment .pdf#page=2', 'embed-text-alternative-present', '<embed src="doc.pdf#page=2">', ['notApplicable'], ''],
 ['embed: PDF upper case', 'embed-text-alternative-present', '<embed src="DOC.PDF">', ['notApplicable'], ''],
 ['embed: type with params', 'embed-text-alternative-present', '<embed src="x" type="application/pdf; charset=utf-8">', ['notApplicable'], ''],
 ['embed: video mp4', 'embed-text-alternative-present', '<embed src="clip.mp4">', ['fail'], ''],
 ['embed: html page youtube', 'embed-text-alternative-present', '<embed src="https://www.youtube.com/embed/abc">', ['notApplicable','fail'], ''],
 ['embed: .html with query', 'embed-text-alternative-present', '<embed src="page.html?x=1">', ['notApplicable'], ''],
 ['marquee: stop via onmouseover', 'deprecated-elements-not-used', '<marquee onmouseover="this.stop()" onmouseout="this.start()">Sale</marquee>', ['cantTell','pass'], ''],
 ['marquee: script stops it by id', 'deprecated-elements-not-used', '<marquee id="m">Sale</marquee><button onclick="document.getElementById(\'m\').stop()">Pause</button>', ['cantTell'], ''],
 ['marquee: hidden', 'deprecated-elements-not-used', '<marquee hidden>x</marquee>', ['notApplicable','pass','cantTell','fail'], ''],
];
(async () => {
  for (const [label, id, body, exp, head] of C) {
    const html = `<!doctype html><html lang="en"><head><title>Probe page for tests</title>${head}</head><body><main><h1>T</h1>${body}</main></body></html>`;
    let a, b;
    try { a = rule(js(html, [id]), id); } catch (e) { a = { outcome: 'THROW ' + e.message.slice(0,100) }; }
    try { b = rule(await cr(html, [id]), id); } catch (e) { b = { outcome: 'THROW ' + e.message.slice(0,100) }; }
    const bad = !exp.includes(a.outcome) || !exp.includes(b.outcome) || a.outcome !== b.outcome;
    console.log((bad ? '!! ' : '   ') + label.padEnd(46) + ' exp ' + exp.join('|') + '  jsdom ' + brief(a).slice(0,160) + (a.outcome !== b.outcome ? '  CHROME ' + brief(b).slice(0,160) : ''));
  }
  await close();
})();
