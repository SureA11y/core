const doc = (htmlStyle, bodyStyle, inner) => `<!doctype html><html lang=en style="${htmlStyle}"><head><title>t</title></head><body style="${bodyStyle}">${inner}</body></html>`;
module.exports = [
 ['body bg propagates, text below body box', doc('', 'background:#000;margin:0;height:50px', '<p style="margin:0;color:#fff">top</p><p id=t style="position:absolute;top:300px;margin:0;color:#fff;font:16px Arial">Text far below the body box</p>')],
 ['html+body bg, text outside body box', doc('background:#000', 'background:#fff;margin:0;height:50px', '<p style="margin:0;color:#000">top</p><p id=t style="position:absolute;top:300px;margin:0;color:#222;font:16px Arial">Text far below the body box</p>')],
 ['body overflow into margin', doc('', 'background:#000;margin:40px;height:20px', '<p id=t style="margin:-30px 0 0 -30px;color:#fff;font:16px Arial">Text in the body margin</p>')],
 ['html bg only, body none', doc('background:#123', 'margin:0', '<p id=t style="color:#234;font:16px Arial">Dark on dark</p>')],
 ['body bg with html color-scheme dark, no bg', doc('color-scheme:dark', 'margin:0', '<p id=t style="color:#444;font:16px Arial">grey text on dark canvas</p>')],
 ['body bg-color transparent, bg-image none, html bg image gradient', doc('background:linear-gradient(#000,#111)', 'margin:0', '<p id=t style="color:#fff;font:16px Arial">white on dark gradient</p>')],
];
