const p=require('./h');
const all=['button-name-present','link-name-present','label-in-name','form-control-programmatic-label-present','form-control-single-label','aria-valid-attr-value','aria-required-parent','aria-required-children','aria-prohibited-attr','aria-hidden-focus','nested-interactive-controls-absent','presentational-children-focusable-absent','aria-allowed-role','aria-allowed-attr','aria-role-name-present','textbox-name-present','combobox-name-present'];
p('weird ids','<span id="a&quot;b]\\">Save</span><button aria-labelledby="a&quot;b]\\"></button><label for="1x:y">L</label><input id="1x:y"><div role="list" aria-owns="z]&quot;"></div><div role="listitem" id="z]&quot;">i</div>',all);
let deep='<span id="d0">end</span>'; for(let i=1;i<300;i++) deep+=`<span id="d${i}" aria-labelledby="d${i-1}">x</span>`;
p('deep chain', deep+'<button aria-labelledby="d299"></button>',['button-name-present']);
let nest='Save'; for(let i=0;i<400;i++) nest=`<span>${nest}</span>`;
p('deep nesting', '<button>'+nest+'</button>',['button-name-present','label-in-name']);
p('cycle owns', '<div role="list" id="a" aria-owns="b"><div role="listitem" id="b" aria-owns="a">x</div></div>',all);
p('combobox with inner textbox', '<div role="combobox" aria-expanded="false" aria-controls="lb"><input aria-label="City"></div><div role="listbox" id="lb" aria-label="c"></div>',['combobox-name-present','nested-interactive-controls-absent','aria-required-attr']);
