const h=require('./h.js');
const html=`<!doctype html><html lang="en"><head><title>t</title><style>
button:focus{outline:none}
li:nth-child(2 of .x):focus{outline:none}
</style></head><body><main><div><a class="x" href="#a">One</a> <button type="button">Two</button> <a class="x" href="#c">Three</a></div><ul><li class="x" tabindex="0">a</li><li class="x" tabindex="0">b</li></ul></main></body></html>`;
h.run4([{name:'focus-nth-of',html,rules:['css-focus-indicator-suppressed']}],{verbose:true});
