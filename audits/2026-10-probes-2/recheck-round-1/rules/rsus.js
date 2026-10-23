const {scan,show,close}=require('../../visual/h.js');
(async()=>{
 for (const vp of [{width:600,height:800},{width:800,height:600}]) {
 show('rotated 10x10 icon in portrait MQ '+vp.width, await scan(`<p>Text <span class="ic" style="display:inline-block;width:10px;height:10px;background:#000"></span></p>`,['css-orientation-lock'],{viewport:vp,head:'<style>@media (orientation:portrait){.ic{transform:rotate(90deg)}}</style>'}));
 show('rotated 10x10 icon in landscape MQ '+vp.width, await scan(`<p>Text <span class="ic" style="display:inline-block;width:10px;height:10px;background:#000"></span></p>`,['css-orientation-lock'],{viewport:vp,head:'<style>@media (orientation:landscape){.ic{transform:rotate(90deg)}}</style>'}));
 }
 await close();
})();
