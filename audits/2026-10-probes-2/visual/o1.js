const R=['css-orientation-lock'];
require('./h').run([
 ['unmatched selector', `<p>Hello</p>`,{head:'<style>@media (orientation: portrait){ .does-not-exist{transform:rotate(90deg)} }</style>'}],
 ['chevron icon', `<p>Hello <span class="chev" aria-hidden="true">&gt;</span></p>`,{head:'<style>@media (orientation: portrait){ .chev{display:inline-block;transform:rotate(90deg)} }</style>'}],
 ['not (orientation:portrait)', `<p>Hello</p>`,{head:'<style>@media not all and (orientation: portrait){ html{transform:rotate(90deg)} }</style>'}],
 ['real lock html', `<p>Hello</p>`,{head:'<style>@media (orientation: portrait){ html{transform:rotate(90deg)} }</style>'}],
 ['rotate 90 then rotate -90 (net 0)', `<p>Hello</p>`,{head:'<style>@media (orientation: portrait){ body{transform:rotate(90deg) rotate(-90deg)} }</style>'}],
 ['rotate 90 then rotateX', `<p>Hello</p>`,{head:'<style>@media (orientation: portrait){ body{transform:rotateY(90deg)} }</style>'}],
],R);
