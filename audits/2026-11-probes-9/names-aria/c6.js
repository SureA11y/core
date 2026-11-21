const F=['form-control-programmatic-label-present','form-control-single-label','label-for-valid','label-title-only','textbox-name-present'];
module.exports=[
{name:'labelledby-whitespace', rules:F, html:'<span id=l> </span><input id=a aria-labelledby=l>', ax:['#a']},
{name:'label-two-inputs', rules:F, html:'<label>Name <input id=a> <input id=b></label>', ax:['#a','#b']},
{name:'label-for-shadow', rules:F, html:'<label for=x>Name</label><div id=h></div>', setup:()=>{const s=document.getElementById('h').attachShadow({mode:'open'});s.innerHTML='<input id=x>';}, ax:['input']},
{name:'two-labels', rules:F, html:'<label for=a>First</label><label for=a>Second</label><input id=a>', ax:['#a']},
{name:'label-hidden', rules:F, html:'<label for=a hidden>Name</label><input id=a><label for=b style="display:none">Name</label><input id=b>', ax:['#a','#b']},
{name:'label-for-points-to-button', rules:F, html:'<label for=a>Name</label><button id=a>Go</button><label for=z>Lost</label>', ax:['#a']},
{name:'textarea-title', rules:F, html:'<textarea id=a title="Comments"></textarea>', ax:['#a']},
{name:'contenteditable-textbox', rules:F, html:'<div id=a role=textbox contenteditable></div><div id=b contenteditable></div>', ax:['#a','#b']},
{name:'input-hidden-type', rules:F, html:'<input type=hidden id=a><input type=file id=b><input type=range id=c><input type=color id=d><input type=date id=e>', ax:['#b','#c','#d','#e']},
{name:'label-nested-label', rules:F, html:'<label>Outer <label>Inner <input id=a></label></label>', ax:['#a']},
{name:'label-with-select-inside', rules:F, html:'<label>Qty <select id=s><option>1</option></select> <input id=a></label>', ax:['#s','#a']},
{name:'fieldset-legend-only', rules:F, html:'<fieldset><legend>Address</legend><input id=a></fieldset>', ax:['#a']},
{name:'label-display-contents', rules:F, html:'<label for=a style="display:contents">Name</label><input id=a>', ax:['#a']},
{name:'label-visually-hidden-clip', rules:F, html:'<label for=a style="position:absolute;clip:rect(0 0 0 0);width:1px;height:1px;overflow:hidden">Name</label><input id=a>', ax:['#a']},
{name:'output-element', rules:F, html:'<output id=a></output><meter id=m value=0.5></meter><progress id=p value=1></progress>', ax:['#a','#m','#p']},
{name:'searchbox', rules:['searchbox-name-present','form-control-programmatic-label-present'], html:'<input id=a type=search><div id=b role=searchbox contenteditable></div>', ax:['#a','#b']},
];
