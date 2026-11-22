const h=require('./h.js');
const html=`<!doctype html><html lang="en"><head><title>t</title><style>
button:-moz-focusring { outline: none }
button:focus { outline: none }
</style></head><body><main><button type="button">Save</button></main></body></html>`;
h.run4([{name:'R11P moz-focusring poisons list',html,rules:['css-focus-indicator-suppressed']}],{verbose:true});
