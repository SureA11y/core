const {four,page,close}=require('./h.js');
const cases=[
 ['before overlay dark, white text', `<style>.h{position:relative;color:#fff}.h::before{content:"";position:absolute;inset:0;background:#000;z-index:-1}</style><div class=h>White on overlay</div>`],
 ['before display:none, light text', `<style>.h{position:relative;color:#eee}.h::before{content:"";display:none;position:absolute;inset:0;background:#000;z-index:-1}</style><div class=h>Light on white</div>`],
 ['before no content property, light text', `<style>.h{position:relative;color:#eee}.h::before{position:absolute;inset:0;background:#000;z-index:-1}</style><div class=h>Light on white</div>`],
 ['before content:none, light text', `<style>.h{position:relative;color:#eee}.h::before{content:none;position:absolute;inset:0;background:#000;z-index:-1}</style><div class=h>Light on white</div>`],
 ['before visibility:hidden, light text', `<style>.h{position:relative;color:#eee}.h::before{content:"";visibility:hidden;position:absolute;inset:0;background:#000;z-index:-1}</style><div class=h>Light on white</div>`],
 ['before small badge corner (does not cover), light text', `<style>.h{position:relative;color:#eee}.h::before{content:"";position:absolute;top:0;right:0;width:4px;height:4px;background:#000}</style><div class=h>Light on white</div>`],
 ['before over a different element (sibling), light text', `<style>.o{position:relative}.o::before{content:"";position:absolute;top:0;left:0;width:10px;height:10px;background:#000}</style><div class=o></div><p style="color:#eee">Light on white elsewhere</p>`],
 ['before on ancestor wraps text card', `<style>.card{position:relative;padding:1em}.card::after{content:"";position:absolute;inset:0;background:rgba(0,0,0,.6);z-index:-1}</style><div class=card><p style="color:#fff">White on scrim</p></div>`],
];
(async()=>{for(const [l,b] of cases)await four(l,page(b),['contrast-minimum','contrast-computable']);await close();})();
