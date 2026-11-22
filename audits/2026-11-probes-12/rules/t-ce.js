const {run4,setMsg}=require('./h.js');setMsg(120);
const W=(b)=>`<!doctype html><html lang=en><head><title>t</title></head><body><main>${b}</main></body></html>`;
const def=(role,disp)=>`<script>customElements.define("x-${role}",class extends HTMLElement{constructor(){super();this._internals=this.attachInternals();this._internals.role="${role}";}})</script><style>x-${role}{display:inline-block;width:16px;height:16px;background:#ccc}</style>`;
run4([
 ['ce-checkbox',def('checkbox')+'<x-checkbox tabindex=0></x-checkbox><x-checkbox tabindex=0></x-checkbox>'],
 ['ce-button',def('button')+'<x-button tabindex=0></x-button><x-button tabindex=0></x-button>'],
 ['ce-button-first',def('button')+'<x-button tabindex=0></x-button><x-button tabindex=0></x-button>'],
 ['ce-tab',def('tab')+'<x-tab tabindex=0></x-tab><x-tab tabindex=0></x-tab>'],
].map(([n,b])=>({name:n,rules:['target-size-minimum'],html:W(b)})),{modes:['chrome']});
