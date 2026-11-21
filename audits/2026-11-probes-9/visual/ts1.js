const B = (s, t='') => `<button style="all:unset;display:inline-block;background:#ccc;${s}">${t}</button>`;
module.exports = [
 ['two 20px buttons adjacent', `<div style="margin:50px">${B('width:20px;height:20px','a')}${B('width:20px;height:20px','b')}</div>`],
 ['pseudo enlarges hit area', `<style>.x{position:relative}.x::before{content:"";position:absolute;inset:-10px}</style><div style="margin:50px">${B('width:16px;height:16px','').replace('style','class=x style')}${B('width:16px;height:16px;margin-left:4px','').replace('style','class=x style')}</div>`],
 ['zoom 0.5 on 40px', `<div style="margin:50px;zoom:.5">${B('width:40px;height:40px','a')}${B('width:40px;height:40px','b')}</div>`],
 ['scale .5 parent on 40px', `<div style="margin:50px;transform:scale(.5);transform-origin:0 0">${B('width:40px;height:40px','a')}${B('width:40px;height:40px','b')}</div>`],
 ['24 at fractional pos', `<div style="margin:50.5px 50.3px">${B('width:24px;height:24px','a')}${B('width:24px;height:24px','b')}</div>`],
 ['opacity 0 small', `<div style="margin:50px">${B('width:16px;height:16px;opacity:0','a')}${B('width:16px;height:16px','b')}</div>`],
 ['disabled small', `<div style="margin:50px"><button disabled style="all:unset;width:16px;height:16px;display:inline-block">a</button><button disabled style="all:unset;width:16px;height:16px;display:inline-block">b</button></div>`],
 ['range default', `<div style="margin:50px"><input type=range aria-label=v><input type=range aria-label=w></div>`],
 ['checkbox accent-color', `<div style="margin:50px"><input type=checkbox aria-label=a style="accent-color:red"><input type=checkbox aria-label=b style="accent-color:red"></div>`],
 ['checkbox width set', `<div style="margin:50px"><input type=checkbox aria-label=a style="width:12px;height:12px;margin:0"><input type=checkbox aria-label=b style="width:12px;height:12px;margin:0"></div>`],
 ['vertical-rl inline links in sentence', `<p style="writing-mode:vertical-rl;height:300px;font-size:12px">Read the <a href=#>terms</a> and <a href=#>privacy</a> notice.</p>`],
 ['label wrapping small checkbox', `<div style="margin:50px"><label style="display:inline-block;padding:10px"><input type=checkbox style="appearance:none;width:10px;height:10px;border:1px solid;margin:0">Accept terms</label> <label style="display:inline-block;padding:10px"><input type=checkbox style="appearance:none;width:10px;height:10px;border:1px solid;margin:0">News</label></div>`],
 ['select tiny font', `<div style="margin:50px"><select aria-label=a style="font-size:8px"><option>x</select><select aria-label=b style="font-size:8px"><option>y</select></div>`],
 ['rtl icon buttons', `<div dir=rtl style="margin:50px">${B('width:20px;height:20px','a')}${B('width:20px;height:20px','b')}</div>`],
 ['svg icon link', `<div style="margin:50px"><a href=#a aria-label=a style="display:inline-block;line-height:0"><svg width=16 height=16><rect width=16 height=16/></svg></a><a href=#b aria-label=b style="display:inline-block;line-height:0"><svg width=16 height=16><rect width=16 height=16/></svg></a></div>`],
];
