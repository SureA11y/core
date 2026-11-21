const S = (st, opt='x') => `<select aria-label=a style="${st}"><option>${opt}</select>`;
module.exports = [
 ['select 8px text', `<div style="margin:50px">${S('font-size:8px')}${S('font-size:8px','y')}</div>`],
 ['select 8px no text', `<div style="margin:50px">${S('font-size:8px','')}${S('font-size:8px','')}</div>`],
 ['select height 14 block flex', `<div style="margin:50px;display:flex">${S('height:14px;font-size:9px')}${S('height:14px;font-size:9px','y')}</div>`],
 ['datalist input small', `<div style="margin:50px;display:flex"><input aria-label=q style="height:12px;width:60px;font-size:8px;padding:0"><input aria-label=r style="height:12px;width:60px;font-size:8px;padding:0"></div>`],
 ['textarea small', `<div style="margin:50px;display:flex"><textarea aria-label=q style="height:12px;width:60px;font-size:8px;padding:0">abc</textarea><textarea aria-label=r style="height:12px;width:60px;font-size:8px;padding:0">abc</textarea></div>`],
 ['button with text small', `<div style="margin:50px;display:flex"><button style="all:unset;font-size:8px;height:12px">Go</button><button style="all:unset;font-size:8px;height:12px">Stop</button></div>`],
];
