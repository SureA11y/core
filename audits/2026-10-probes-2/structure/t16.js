const {dom}=require('./h.js'); const p=require('./h.js');
const page=b=>`<!doctype html><html lang="en"><head><title>t</title></head><body>${b}</body></html>`;
dom('lang host unslotted text', page('<x-a id="h" lang="xx">secret</x-a>'), d=>{d.getElementById('h').attachShadow({mode:'open'}).innerHTML='<p>shown</p>';}, ['valid-lang']);
dom('lang host shadow text', page('<x-a id="h" lang="xx"></x-a>'), d=>{d.getElementById('h').attachShadow({mode:'open'}).innerHTML='<p>shown</p>';}, ['valid-lang']);
p('ul text', page('<ul>loose text<li>a</li></ul>'), ['list-children-valid']);
p('lang vis hidden', page('<p lang="xx" style="visibility:hidden">t</p>'), ['valid-lang']);
