const p=require('./h');
p('upper OPTION empty','<div role="listbox" aria-label="F"><div role="OPTION"></div></div>',['option-name-present','aria-role-name-present']);
p('upper Checkbox empty','<div role="Checkbox" aria-checked="false" tabindex="0"></div>',['binary-control-name-present','aria-role-name-present']);
p('lower checkbox empty','<div role="checkbox" aria-checked="false" tabindex="0"></div>',['binary-control-name-present','aria-role-name-present']);
p('upper Dialog','<div role="Dialog"><p>hi</p></div>',['dialog-name-present']);
p('upper Img','<div role="Img"></div>',['role-img-text-alternative-present']);
p('upper Link','<span role="Link" tabindex="0"></span>',['link-name-present']);
