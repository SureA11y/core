const N=['dialog-name-present','summary-name-present','tab-name-present','tooltip-name-present','treeitem-name-present','option-name-present','menuitem-name-present','meter-name-present','progressbar-name-present','listbox-name-present','combobox-name-present','slider-name-present','spinbutton-name-present','binary-control-name-present'];
module.exports=[
{name:'dialog-open-unnamed', rules:N, html:'<dialog id=d open><p>Hi</p></dialog><div id=e role=alertdialog aria-modal=true><p>x</p></div>', ax:['#d','#e']},
{name:'dialog-heading-labelledby', rules:N, html:'<dialog id=d open aria-labelledby=h><h2 id=h>Settings</h2></dialog>', ax:['#d']},
{name:'summary-empty', rules:N, html:'<details><summary id=s></summary>x</details><details id=d2>x</details><details><summary id=t><img src=x.png alt=""></summary>x</details>', ax:['#s','#t']},
{name:'summary-role-button', rules:N, html:'<details><summary id=s role=button></summary>x</details>', ax:['#s']},
{name:'tooltip-content', rules:N, html:'<div id=t role=tooltip>Helpful</div><div id=u role=tooltip></div>', ax:['#t','#u']},
{name:'native-option', rules:N, html:'<select aria-label=s><option id=o></option><option>B</option><optgroup label=""><option>C</option></optgroup></select>', ax:['#o']},
{name:'option-label-attr', rules:N, html:'<select aria-label=s><option id=o label="Alpha"></option></select>', ax:['#o']},
{name:'meter-native', rules:N, html:'<meter id=m value=.5></meter><label>Disk <meter id=n value=.5></meter></label><progress id=p value=1 max=2></progress>', ax:['#m','#n','#p']},
{name:'select-unlabelled', rules:N.concat(['form-control-programmatic-label-present']), html:'<select id=s><option>A</option></select><select id=m multiple><option>A</option></select>', ax:['#s','#m']},
{name:'datalist-input', rules:N.concat(['form-control-programmatic-label-present']), html:'<input id=i list=dl><datalist id=dl><option value=a></datalist>', ax:['#i']},
{name:'input-number-range', rules:N.concat(['form-control-programmatic-label-present']), html:'<input id=n type=number><input id=r type=range>', ax:['#n','#r']},
{name:'menuitem-native-hr', rules:N, html:'<div role=menu><div role=menuitem tabindex=-1 id=m><svg aria-hidden=true></svg></div><div role=menuitemcheckbox aria-checked=false id=c tabindex=-1></div></div>', ax:['#m','#c']},
{name:'treeitem-nested-name', rules:N, html:'<ul role=tree aria-label=t><li role=treeitem id=t aria-expanded=true><ul role=group><li role=treeitem>Child</li></ul></li></ul>', ax:['#t']},
{name:'tab-img', rules:N, html:'<div role=tablist><button role=tab id=t aria-selected=true><img src=x.png alt="Home"></button><button role=tab id=u><svg><title>Profile</title></svg></button></div>', ax:['#t','#u']},
{name:'switch-unnamed', rules:N, html:'<button id=s role=switch aria-checked=false></button><input type=checkbox id=c role=switch>', ax:['#s','#c']},
];
