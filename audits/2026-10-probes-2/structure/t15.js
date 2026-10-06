const p=require('./h.js');
const R=['iframe-focusable-content'];
const cases=[
 ['fieldset disabled','<fieldset disabled><button>x</button><input></fieldset>'],
 ['tabindex empty','<div tabindex="">x</div>'],
 ['tabindex abc','<div tabindex="abc">x</div>'],
 ['area no map','<map name="m"><area href="/x"></map>'],
 ['a no href control','<a>x</a>'],
 ['contenteditable empty','<div contenteditable="">x</div>'],
];
for (const [l,h] of cases) p(l,`<!doctype html><html lang="en"><head><title>t</title></head><body><iframe title="f" tabindex="-1" srcdoc='${h}'></iframe></body></html>`,R,{entryPointParity:false});
