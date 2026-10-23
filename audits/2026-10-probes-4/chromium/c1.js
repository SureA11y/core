const {contrastRun,report}=require('./ch.js');const {close}=require('./h.js');
const T='Sample text here';
const page=(body,css='')=>`<!doctype html><html lang=en><head><title>c</title><style>html,body{background:#fff;color:#000;margin:0;font:16px/1.4 sans-serif} div,p{margin:6px} ${css}</style></head><body><main>${body}</main></body></html>`;
const cases=[
 ['ld_pass','pass','<p data-t id=ld_pass style="color-scheme:light;color:light-dark(#767676,#fff)">'+T+'</p>'],
 ['ld_fail','fail','<p data-t id=ld_fail style="color-scheme:light;color:light-dark(#999,#000)">'+T+'</p>'],
 ['ld_dark_pass','pass','<p data-t id=ld_dark_pass style="color-scheme:dark;background:light-dark(#fff,#121212);color:light-dark(#000,#ddd)">'+T+'</p>'],
 ['ld_dark_fail','fail','<p data-t id=ld_dark_fail style="color-scheme:dark;background:light-dark(#fff,#121212);color:light-dark(#000,#444)">'+T+'</p>'],
 ['mix_fail','fail','<p data-t id=mix_fail style="color:color-mix(in srgb,#000 50%,#fff)">'+T+'</p>'],
 ['mix_pass','pass','<p data-t id=mix_pass style="color:color-mix(in oklab,#000 80%,#fff)">'+T+'</p>'],
 ['mixbg_fail','fail','<p data-t id=mixbg_fail style="background:color-mix(in srgb,#000 70%,transparent);color:#555">'+T+'</p>'],
 ['rel_fail','fail','<p data-t id=rel_fail style="color:rgb(from #000 r g b / 0.4)">'+T+'</p>'],
 ['rel_pass','pass','<p data-t id=rel_pass style="color:oklch(from #333 l c h)">'+T+'</p>'],
 ['rel2_fail','fail','<p data-t id=rel2_fail style="color:hsl(from #000 h s calc(l + 65))">'+T+'</p>'],
 ['cur_fail','fail','<div style="color:#bbb"><p data-t id=cur_fail style="color:currentColor">'+T+'</p></div>'],
 ['cur2_pass','pass','<div style="color:#222"><p data-t id=cur2_pass style="-webkit-text-fill-color:currentColor;background:color-mix(in srgb,currentColor 5%,#fff)">'+T+'</p></div>'],
 ['cur3_fail','fail','<div style="color:#fff;background:#fff"><p data-t id=cur3_fail style="background:currentColor;color:#eee">'+T+'</p></div>'],
 ['blend_pass','pass','<p data-t id=blend_pass style="color:#fff;mix-blend-mode:difference">'+T+'</p>'],
 ['blend_fail','fail','<p data-t id=blend_fail style="color:#000;mix-blend-mode:screen;background:transparent">'+T+'</p>'],
 ['shadow_halo','pass/cantTell','<p data-t id=shadow_halo style="color:#fff;text-shadow:0 0 2px #000,0 0 2px #000,0 0 2px #000,0 0 2px #000;font-size:20px">'+T+'</p>'],
 ['stroke','pass/cantTell','<p data-t id=stroke style="color:#fff;-webkit-text-stroke:2px #000;font-size:24px;font-weight:bold">'+T+'</p>'],
 ['clip_text','cantTell','<p data-t id=clip_text style="background:linear-gradient(90deg,#000,#333);-webkit-background-clip:text;background-clip:text;color:transparent;font-size:24px;font-weight:bold">'+T+'</p>'],
 ['grad_pass','pass/cantTell','<p data-t id=grad_pass style="background:linear-gradient(#000,#111);color:#fff">'+T+'</p>'],
 ['grad_fail','fail/cantTell','<p data-t id=grad_fail style="background:linear-gradient(#fff,#eee);color:#ccc">'+T+'</p>'],
 ['backdrop_fail','fail/cantTell','<p data-t id=backdrop_fail style="backdrop-filter:invert(1);color:#000">'+T+'</p>'],
 ['filter_fail','fail/cantTell','<p data-t id=filter_fail style="filter:opacity(0.3);color:#000">'+T+'</p>'],
 ['filter_inv','pass/cantTell','<p data-t id=filter_inv style="filter:invert(1);color:#fff;background:#fff">'+T+'</p>'],
 ['marker_li','?','<ol><li data-t id=marker_li style="color:#000">'+T+'</li></ol>'],
 ['sel_css','pass','<p data-t id=sel_css class=sel>'+T+'</p>'],
 ['inp_fail','fail','<label>N <input data-t id=inp_fail value="Hello there" style="color:#aaa;background:#fff;border:1px solid #000"></label>'],
 ['inp_pass','pass','<label>N <input data-t id=inp_pass value="Hello there" style="color:#333;background:#fff;border:1px solid #000"></label>'],
 ['sel_fail','fail (documented gap)','<label>S <select data-t id=sel_fail style="color:#bbb;background:#fff"><option>Choose one</option></select></label>'],
 ['rem_large','pass','<p data-t id=rem_large style="color:#949494;font-size:1.5rem">'+T+'</p>'],
 ['em_large','pass','<div style="font-size:12px"><p data-t id=em_large style="color:#949494;font-size:2em">'+T+'</p></div>'],
 ['clamp_large','pass','<p data-t id=clamp_large style="color:#949494;font-size:clamp(1rem,5vw,1.5rem)">'+T+'</p>'],
 ['cqi_large','pass','<div style="container-type:inline-size;width:400px"><p data-t id=cqi_large style="color:#949494;font-size:6cqi;margin:0">'+T+'</p></div>'],
 ['cqi_small','fail','<div style="container-type:inline-size;width:200px"><p data-t id=cqi_small style="color:#949494;font-size:6cqi;margin:0">'+T+'</p></div>'],
 ['bold_large','pass','<p data-t id=bold_large style="color:#949494;font-size:19px;font-weight:700">'+T+'</p>'],
 ['bold_small','fail','<p data-t id=bold_small style="color:#949494;font-size:18px;font-weight:700">'+T+'</p>'],
 ['zoom_up','pass','<p data-t id=zoom_up style="color:#949494;font-size:12px;zoom:2">'+T+'</p>'],
 ['zoom_down','fail','<p data-t id=zoom_down style="color:#949494;font-size:24px;zoom:0.5">'+T+'</p>'],
 ['zoom_anc','pass','<div style="zoom:2"><p data-t id=zoom_anc style="color:#949494;font-size:12px">'+T+'</p></div>'],
];
(async()=>{
 const css='.sel::selection{color:#eee;background:#fff} li::marker{color:#ddd}';
 const html=page(cases.map(c=>c[2]).join('\n'),css);
 const exp=Object.fromEntries(cases.map(c=>[c[0],c[1]]));
 const r=await contrastRun(html);
 console.log(report('contrast basic',r,exp));
 await close();
})();
