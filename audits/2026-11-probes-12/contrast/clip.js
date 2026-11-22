const { cr, rule, brief, page, close } = require('./h.js');
(async()=>{ for (const [l,b] of [
 ['child box fully outside', '<div style="height:20px;overflow:hidden"><p style="margin:40px 0 0;color:#aaa">Clipped text</p></div>'],
 ['child box overlaps, text pushed out by padding', '<div style="height:20px;overflow:hidden"><div style="padding-top:40px;color:#aaa">Clipped text</div></div>'],
 ['text below a tall spacer in same block', '<div style="height:20px;overflow:hidden;color:#aaa"><div style="height:30px"></div>Clipped text</div>'],
 ['line-clamp: 3rd line hidden', '<p style="width:120px;height:1.2em;line-height:1.2em;overflow:hidden;color:#000">Visible first <span style="color:#aaa">second line hidden words here</span></p>'],
]) for (const root of ['main','br']) { const r=await cr(root,page(b),['contrast-minimum']); console.log(l.padEnd(48),root,brief(rule(r,'contrast-minimum')).replace(/html > body > main > /g,'')); } await close(); })();
