const R=['binary-control-name-present','form-control-programmatic-label-present','textbox-name-present','combobox-name-present','listbox-name-present','slider-name-present','spinbutton-name-present','searchbox-name-present'];
module.exports=[
{name:'native-unlabelled-all', rules:R, html:'<input type=checkbox id=a><input type=radio id=b><input id=c><select id=d><option>x</option></select><select multiple id=e><option>x</option></select><input type=range id=f><input type=number id=g><input type=search id=h><textarea id=i></textarea>'},
{name:'aria-unlabelled-all', rules:R, html:'<div role=checkbox aria-checked=false tabindex=0 id=a></div><div role=textbox tabindex=0 id=c></div><div role=combobox aria-expanded=false tabindex=0 id=d></div><div role=listbox tabindex=0 id=e></div><div role=slider tabindex=0 aria-valuenow=1 id=f></div><div role=spinbutton tabindex=0 aria-valuenow=1 id=g></div>'},
];
