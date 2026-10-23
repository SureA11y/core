const s=require('./sh');
const R=['form-control-programmatic-label-present','button-name-present','textbox-name-present','form-control-single-label','label-in-name'];
s('in-shadow labelledby', '<my-f></my-f>', d=>{
  const sr=d.querySelector('my-f').attachShadow({mode:'open'}); sr.innerHTML='<span id="l">Zip</span><input aria-labelledby="l"><button aria-labelledby="l"></button>';
}, R);
s('in-shadow label for', '<my-f></my-f>', d=>{
  const sr=d.querySelector('my-f').attachShadow({mode:'open'}); sr.innerHTML='<label for="z">Zip</label><input id="z"><label for="b">Go</label><button id="b"></button>';
}, R);
s('in-shadow label for + aria-label mismatch', '<my-f></my-f>', d=>{
  const sr=d.querySelector('my-f').attachShadow({mode:'open'}); sr.innerHTML='<label for="z">Zip code</label><input id="z" aria-label="Zip code">';
}, R);
