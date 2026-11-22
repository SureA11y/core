const {run4,setMsg}=require('./h.js');setMsg(120);
const W=(b)=>`<!doctype html><html lang=en><head><title>t</title></head><body><main>${b}</main></body></html>`;
const FG=['form-group-name-present'];
const keys=['__proto__','constructor','toString','hasOwnProperty','valueOf'];
const cases=[];
for(const k of keys){cases.push([`fg-radio-${k}`,FG,`<input type=radio name="${k}" aria-label=a><input type=radio name="${k}" aria-label=b>`]);}
cases.push(['fg-mixed-proto-and-normal',FG,`<input type=radio name="__proto__" aria-label=a><input type=radio name="x" aria-label=b><input type=radio name="x" aria-label=c>`]);
cases.push(['fg-radio-and-checkbox-same-name',FG,`<input type=radio name="s" aria-label=a><input type=radio name="s" aria-label=b><input type=checkbox name="s" aria-label=c><input type=checkbox name="s" aria-label=d>`]);
for(const k of ['__proto__','constructor','toString']){
 cases.push([`li-role-${k}`,['listitem-parent-valid','aria-prohibited-children','aria-required-children'],`<ul role="${k} navigation"><li>a</li></ul><div role="tablist"><div role="${k}">x</div></div>`]);
 cases.push([`ts-role-${k}`,['target-size-minimum'],`<span role="${k}" style="display:inline-block;width:10px;height:10px"></span><span role="${k}" style="display:inline-block;width:10px;height:10px"></span>`]);
 cases.push([`lq-${k}`,['link-name-quality','link-name-quality-link-only','label-in-name'],`<p lang="${k}"><a href=#>${k}</a></p><button aria-label="${k} x">${k}</button>`]);
 cases.push([`pah-${k}`,['p-as-heading'],`<p lang="${k}"><b>${k}</b></p><p>text</p>`]);
 cases.push([`ti-${k}`,['tabindex'],`<div tabindex="${k}">x</div>`]);
}
run4(cases.map(([n,r,b])=>({name:n,rules:r,html:W(b),base:'none'})));
