const { runS, page } = require('./sc.js');
const ID='form-group-name-present';
const R2 = '<label><input type="radio" name="s"> S</label><label><input type="radio" name="s"> M</label>';
const at = (id, mode, inner) => `document.getElementById(${JSON.stringify(id)}).attachShadow({mode:${JSON.stringify(mode)}}).innerHTML=${JSON.stringify(inner)};`;
runS([
 ['open: slotted into shadow fieldset', page(`<x-g id=h>${R2}</x-g>`), ID, at('h','open','<fieldset><legend>Size</legend><slot></slot></fieldset>')],
 ['closed: slotted into shadow fieldset', page(`<x-g id=h>${R2}</x-g>`), ID, at('h','closed','<fieldset><legend>Size</legend><slot></slot></fieldset>')],
 ['closed: radios in closed root inside light fieldset', page(`<fieldset><legend>Size</legend><x-r id=h></x-r></fieldset>`), ID, at('h','closed',R2)],
 ['nested slots (2 levels)', page(`<x-outer id=o>${R2}</x-outer>`), ID, at('o','open','<x-inner id=i><slot></slot></x-inner>') + 'document.getElementById("o").shadowRoot.getElementById("i").attachShadow({mode:"open"}).innerHTML="<fieldset><legend>Size</legend><slot></slot></fieldset>";'],
 ['slotted into unnamed fieldset (should ask)', page(`<x-g id=h>${R2}</x-g>`), ID, at('h','open','<fieldset><slot></slot></fieldset>')],
 ['light fieldset, but radios slotted OUT into unnamed shadow (should ask?)', page(`<x-g id=h><fieldset><legend>Size</legend>${R2}</fieldset></x-g>`), ID, at('h','open','<div><slot></slot></div>')],
 ['unassigned light radios (not slotted, not drawn)', page(`<x-g id=h>${R2}</x-g>`), ID, at('h','open','<p>nothing</p>')],
 ['slot fallback radios, slot has assigned content', page(`<x-g id=h><span>x</span></x-g>`), ID, at('h','open','<slot>'+R2+'</slot>')],
 ['slot fallback radios rendered in shadow fieldset', page(`<x-g id=h></x-g>`), ID, at('h','open','<fieldset><legend>Size</legend><slot>'+R2+'</slot></fieldset>')],
 ['one radio slotted, one in shadow fieldset', page(`<x-g id=h><label><input type="radio" name="s"> S</label></x-g>`), ID, at('h','open','<fieldset><legend>Size</legend><slot></slot><label><input type="radio" name="s"> M</label></fieldset>')],
 ['named slot only one radio assigned', page(`<x-g id=h><label slot=a><input type="radio" name="s"> S</label><label><input type="radio" name="s"> M</label></x-g>`), ID, at('h','open','<fieldset><legend>Size</legend><slot name=a></slot></fieldset><slot></slot>')],
]);
