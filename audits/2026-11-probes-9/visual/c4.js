const show = id => p => p.evaluate(id => { const e = document.getElementById(id); e.showModal ? e.showModal() : e.showPopover(); }, id);
const DARKPAGE = '<div style="background:#000;height:2000px;color:#fff">Page content behind</div>';
module.exports = [
 ['modal dialog transparent over dark page', `<style>body{margin:0}</style>${DARKPAGE}<dialog id=d style="background:transparent;border:0;color:#222"><p id=t style="font:16px Arial">Dialog text over dark page</p></dialog>`, { before: show('d') }],
 ['modal dialog backdrop dark, transparent dialog, white page', `<style>dialog::backdrop{background:rgba(0,0,0,.85)}</style><p>page</p><dialog id=d style="background:transparent;border:0;color:#333"><p id=t style="font:16px Arial">Dialog text over backdrop</p></dialog>`, { before: show('d') }],
 ['popover transparent over dark page', `<style>body{margin:0}</style>${DARKPAGE}<div id=d popover style="background:transparent;border:0;color:#222"><p id=t style="font:16px Arial">Popover text over dark page</p></div>`, { before: show('d') }],
 ['popover default bg', `<style>body{margin:0;background:#000}</style><div id=d popover style="color:#ddd"><p id=t style="font:16px Arial">Popover text default bg</p></div>`, { before: show('d') }],
 ['dialog default bg dark scheme', `<style>:root{color-scheme:dark}</style><dialog id=d><p id=t style="font:16px Arial;color:#333">Dialog text default bg</p></dialog>`, { before: show('d') }],
 ['fixed overlay text over dark page', `<style>body{margin:0}</style>${DARKPAGE}<div style="position:fixed;top:100px;left:0;color:#222"><p id=t style="font:16px Arial">Fixed text over dark page</p></div>`],
 ['abs text over sibling dark', `<style>body{margin:0}</style><div style="position:relative"><div style="background:#000;height:200px"></div><p id=t style="position:absolute;top:50px;margin:0;color:#222;font:16px Arial">Abs text over dark sibling</p></div>`],
];
