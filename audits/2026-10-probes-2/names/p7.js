const p=require('./h');
const A=['aria-prohibited-attr','aria-required-parent','aria-required-children','aria-allowed-attr','textbox-name-present','searchbox-name-present','aria-role-name-present','listbox-name-present','option-name-present'];
p('searchfield searchbox','<div role="searchfield searchbox" contenteditable="true" aria-label="Search"></div>',A);
p('listbox fallback','<div role="selectlist listbox" aria-label="Fruit"><div role="option">Apple</div></div>',A);
p('upper OPTION in listbox','<div role="listbox" aria-label="Fruit"><div role="OPTION">Apple</div></div>',A);
p('upper LISTBOX','<div role="LISTBOX" aria-label="Fruit"><div role="option">Apple</div></div>',A);
