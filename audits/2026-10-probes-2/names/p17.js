const s=require('./sh');
s('shadow cross-tree for', '<label for="q">Search site</label><input id="q"><my-field></my-field>', d=>{
  const sr=d.querySelector('my-field').attachShadow({mode:'open'}); sr.innerHTML='<label>Zip <input id="q"></label>';
}, ['form-control-single-label','form-control-programmatic-label-present','label-in-name']);
s('shadow label for inside shadow', '<my-field></my-field>', d=>{
  const sr=d.querySelector('my-field').attachShadow({mode:'open'}); sr.innerHTML='<label for="z">Zip</label><input id="z">';
}, ['form-control-single-label','form-control-programmatic-label-present']);
s('slotted text in button', '<my-btn><span>Save</span></my-btn>', d=>{
  const sr=d.querySelector('my-btn').attachShadow({mode:'open'}); sr.innerHTML='<button><slot></slot></button>';
}, ['button-name-present']);
s('slotted fallback content', '<my-btn></my-btn>', d=>{
  const sr=d.querySelector('my-btn').attachShadow({mode:'open'}); sr.innerHTML='<button><slot>Default</slot></button>';
}, ['button-name-present']);
s('slot fallback ignored when slotted', '<my-btn><span></span></my-btn>', d=>{
  const sr=d.querySelector('my-btn').attachShadow({mode:'open'}); sr.innerHTML='<button><slot>Default</slot></button>';
}, ['button-name-present']);
s('aria-labelledby across shadow boundary', '<span id="lbl">Save</span><my-btn></my-btn>', d=>{
  const sr=d.querySelector('my-btn').attachShadow({mode:'open'}); sr.innerHTML='<button aria-labelledby="lbl"></button>';
}, ['button-name-present']);
s('named slot', '<my-btn><span slot="label">Save</span><span>ignored</span></my-btn>', d=>{
  const sr=d.querySelector('my-btn').attachShadow({mode:'open'}); sr.innerHTML='<button><slot name="label"></slot></button>';
}, ['button-name-present','label-in-name']);
s('link with slot whose slotted is aria-hidden', '<my-link><span aria-hidden="true">Home</span></my-link>', d=>{
  const sr=d.querySelector('my-link').attachShadow({mode:'open'}); sr.innerHTML='<a href="/"><slot></slot></a>';
}, ['link-name-present']);
s('host aria-hidden containing focusable in shadow', '<my-x aria-hidden="true"></my-x>', d=>{
  const sr=d.querySelector('my-x').attachShadow({mode:'open'}); sr.innerHTML='<button>Go</button>';
}, ['aria-hidden-focus']);
s('nested interactive across slot', '<my-btn><a href="/x">Link</a></my-btn>', d=>{
  const sr=d.querySelector('my-btn').attachShadow({mode:'open'}); sr.innerHTML='<button><slot></slot></button>';
}, ['nested-interactive-controls-absent']);
