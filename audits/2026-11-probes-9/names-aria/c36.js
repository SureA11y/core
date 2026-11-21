const R=['aria-conditional-attr','aria-checked-state-mismatch','aria-expanded-state-mismatch','aria-allowed-attr'];
module.exports=[
{name:'checkbox-aria-checked', rules:R, html:'<input id=a type=checkbox aria-checked=true aria-label=a><input id=b type=checkbox checked aria-checked=true aria-label=b><input id=c type=checkbox aria-checked=mixed aria-label=c><input id=d type=radio aria-checked=false aria-label=d checked>', ax:['#a','#b','#c','#d']},
{name:'switch-native-aria-checked', rules:R, html:'<input id=a type=checkbox role=switch aria-checked=true aria-label=a>', ax:['#a']},
{name:'tr-aria-expanded', rules:R, html:'<table><tr id=r aria-expanded=true><td>x</td></tr></table><table role=treegrid><tr id=s aria-expanded=true><td>x</td></tr></table>', ax:['#r','#s']},
{name:'summary-aria-expanded', rules:R, html:'<details open><summary id=s aria-expanded=false>S</summary>x</details><details><summary id=t aria-expanded=true>T</summary>y</details>', ax:['#s','#t']},
{name:'button-popover-expanded', rules:R, html:'<button id=b popovertarget=p aria-expanded=true>Menu</button><div popover id=p>x</div>', ax:['#b']},
{name:'select-aria-expanded', rules:R, html:'<select id=s aria-label=s aria-expanded=true><option>a</option></select>', ax:['#s']},
{name:'disabled-aria-disabled', rules:R, html:'<button id=b disabled aria-disabled=false>x</button><input id=i required aria-required=false aria-label=i><input id=j readonly aria-readonly=false aria-label=j><input id=k type=checkbox aria-checked=false checked aria-label=k>', ax:['#b','#i','#j','#k']},
{name:'hidden-aria-hidden-false', rules:R, html:'<div id=d hidden aria-hidden=false>x</div>'},
{name:'placeholder-both', rules:R, html:'<input id=a placeholder="Name" aria-placeholder="Your name" aria-label=a>', ax:['#a']},
{name:'level-heading', rules:R, html:'<h2 id=h aria-level=3>x</h2>', ax:['#h']},
{name:'colspan', rules:R, html:'<table><tr><td id=c colspan=2 aria-colspan=3>x</td></tr></table>'},
];
