// W3C APG "Navigation Menubar" markup: a submenu <ul role="menu"> beside its menuitem in <li role="none">
const { jrun, jsum } = require('./jsd');
const html = `<nav aria-label="Mythical University"><ul role="menubar" aria-label="Mythical University">
 <li role="none"><a role="menuitem" aria-haspopup="true" aria-expanded="false" href="#about">About</a>
  <ul role="menu" aria-label="About"><li role="none"><a role="menuitem" href="#overview">Overview</a></li><li role="none"><a role="menuitem" href="#admin">Administration</a></li></ul></li>
 <li role="none"><a role="menuitem" href="#admissions">Admissions</a></li></ul></nav>`;
// APG "Editor Menubar"-like nested submenu inside a menu
const html2 = `<ul role="menu" aria-label="Edit"><li role="none"><span role="menuitem" aria-haspopup="true" aria-expanded="true" tabindex="-1">Share</span><ul role="menu" aria-label="Share"><li role="menuitem" tabindex="-1">Email</li></ul></li></ul>`;
(async()=>{ console.log(jsum('apg-menubar', await jrun(html, ['aria-prohibited-children','aria-required-children','aria-required-parent']))); console.log(jsum('submenu-in-menu', await jrun(html2, ['aria-prohibited-children']))); })();
