const {dom}=require('./h.js');
const R=['definition-list-children-valid','dlitem-parent-valid','listitem-parent-valid','list-children-valid'];
const page=b=>`<!doctype html><html lang="en"><head><title>t</title></head><body>${b}</body></html>`;
dom('dl slot', page('<x-dl id="h"><dt>a</dt><dd>b</dd></x-dl>'), d=>{d.getElementById('h').attachShadow({mode:'open'}).innerHTML='<dl><slot></slot></dl>';}, R);
dom('ul slot', page('<x-ul id="h"><li>a</li></x-ul>'), d=>{d.getElementById('h').attachShadow({mode:'open'}).innerHTML='<ul><slot></slot></ul>';}, R);
dom('dl named slot div', page('<x-dl id="h"><div slot="s"><dt>a</dt><dd>b</dd></div></x-dl>'), d=>{d.getElementById('h').attachShadow({mode:'open'}).innerHTML='<dl><slot name="s"></slot></dl>';}, R);
