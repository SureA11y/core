const P = s => `<p id=t style="margin:0;color:#888;background:#fff;font-family:Arial;${s}">Sample text here</p>`; // #888 on white 3.54
module.exports = [
 ['14pt bold', P('font-size:14pt;font-weight:bold')],
 ['18.66px bold', P('font-size:18.66px;font-weight:bold')],
 ['18.67px bold', P('font-size:18.67px;font-weight:bold')],
 ['18pt normal', P('font-size:18pt')],
 ['1.5em of 16 = 24px', P('font-size:1.5em')],
 ['24px via zoom 2 on 12px', `<div style="zoom:2">${P('font-size:12px')}</div>`],
 ['24px via rem with root 8px*3', P('font-size:3rem').replace('<p', '<style>html{font-size:8px}</style><p')],
 ['clamp vw', P('font-size:clamp(10px, 2.4vw, 40px)')],
 ['bold via b child', `<p id=t style="margin:0;color:#888;background:#fff;font:19px Arial"><b>Bold text</b></p>`],
 ['font shorthand 900', P('font:900 19px Arial')],
 ['synthetic: font-synthesis none bold', P('font-size:19px;font-weight:700;font-synthesis:none')],
 ['font-weight 700 + font-variation wght 300', P('font-size:19px;font-weight:700;font-variation-settings:"wght" 300')],
 ['small-caps 24px', P('font-size:24px;font-variant:small-caps')],
 ['24px with transform scaleY .3', P('font-size:24px;display:inline-block;transform:scaleY(.3)')],
 ['24px superscript', `<p style="margin:0;font:24px Arial;color:#000;background:#fff">x<sup id=t style="color:#888">2 squared value</sup></p>`],
];
