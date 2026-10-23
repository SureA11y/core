const s=require('./sh');
const R=['button-name-present'];
s('labelledby cross-tree (verbose)', '<span id="lbl">Save</span><my-btn></my-btn>', d=>{
  const sr=d.querySelector('my-btn').attachShadow({mode:'open'}); sr.innerHTML='<button aria-labelledby="lbl"></button>';
}, R);
s('labelledby cross-tree with includeShadow false', '<span id="lbl">Save</span><my-btn></my-btn>', d=>{
  const sr=d.querySelector('my-btn').attachShadow({mode:'open'}); sr.innerHTML='<button aria-labelledby="lbl"></button>';
}, R, {includeShadowDom:false});
s('light button labelledby shadow id', '<button aria-labelledby="lbl"></button><my-x></my-x>', d=>{
  const sr=d.querySelector('my-x').attachShadow({mode:'open'}); sr.innerHTML='<span id="lbl">Save</span>';
}, R);
