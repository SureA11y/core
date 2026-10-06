const p=require('./h');
const A=['aria-role-name-present','button-name-present','link-name-present','aria-roles-valid','aria-required-attr','aria-allowed-attr'];
p('role fallback list','<div role="foo button" tabindex="0"></div>',A);
p('uppercase role','<div role="BUTTON" tabindex="0"></div>',A);
p('uppercase role link','<span role="Link" tabindex="0"></span>',A);
p('uppercase checkbox','<span role="CHECKBOX" tabindex="0">x</span>',A);
