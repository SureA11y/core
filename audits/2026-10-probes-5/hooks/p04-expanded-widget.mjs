// aria-expanded-state-mismatch and widget-keyboard-focusable edge cases.
import { open, scan, show } from './h.mjs';
const R = ['aria-expanded-state-mismatch', 'widget-keyboard-focusable', 'click-handler-keyboard-operable'];
const t = (exp, panel, extra = '') => `<button aria-expanded="${exp}" aria-controls="p" ${extra}>Menu</button>${panel}`;
const cases = {
  exp_false_shown: t('false', '<div id=p>Panel</div>'),
  exp_false_hidden: t('false', '<div id=p hidden>Panel</div>'),
  exp_true_hidden: t('true', '<div id=p hidden>Panel</div>'),
  exp_false_visHidden: t('false', '<div id=p style="visibility:hidden">Panel</div>'),
  exp_false_opacity: t('false', '<div id=p style="opacity:0">Panel</div>'),
  exp_false_offscreen: t('false', '<div id=p style="position:absolute;left:-9999px">Panel</div>'),
  exp_false_height0: t('false', '<div id=p style="height:0;overflow:hidden">Panel</div>'),
  exp_false_maxheight0: t('false', '<div id=p style="max-height:0;overflow:hidden">Panel</div>'),
  exp_false_scaleY0: t('false', '<div id=p style="transform:scaleY(0)">Panel</div>'),
  exp_true_height0_paddingVisible: t('true', '<div id=p style="height:0;overflow:hidden;padding:20px">Panel</div>'),
  exp_true_ancestorDisplayNone: t('true', '<div style="display:none"><div id=p>Panel</div></div>'),
  exp_false_closedDetailsTarget: t('false', '<details id=p><summary>More</summary>Panel</details>'),
  exp_false_inClosedDetails: t('false', '<details><summary>More</summary><div id=p>Panel</div></details>'),
  exp_true_popoverClosed: t('true', '<div id=p popover>Panel</div>'),
  exp_false_popoverOpen: `<button aria-expanded="false" aria-controls="p">M</button><div id=p popover>Panel</div><script>p.showPopover()</script>`,
  exp_false_dialogClosed: t('false', '<dialog id=p>Panel</dialog>'),
  exp_true_cvHidden: t('true', '<div id=p style="content-visibility:hidden">Panel</div>'),
  exp_false_cvAuto_offscreen: t('false', '<div style="height:3000px"></div><div id=p style="content-visibility:auto">Panel</div>'),
  exp_twoIds_oneMissing: `<button aria-expanded="false" aria-controls="p q">M</button><div id=p hidden>Panel</div>`,
  exp_twoIds_mixed: `<button aria-expanded="true" aria-controls="p q">M</button><div id=p hidden>P</div><div id=q>Q</div>`,
  exp_missingIds: `<button aria-expanded="true" aria-controls="zz">M</button>`,
  exp_true_emptyPanel: t('true', '<div id=p></div>'),
  exp_true_zeroSizeEmpty: t('true', '<ul id=p style="overflow:hidden"></ul>'),
  exp_combobox: `<input role=combobox aria-label=c aria-expanded="false" aria-controls="p"><ul id=p role=listbox><li role=option>a</li></ul>`,
  exp_treeitem_selfgroup: `<ul role=tree aria-label=t><li role=treeitem aria-expanded="false" aria-controls="g" tabindex=0>A<ul id=g role=group><li role=treeitem>B</li></ul></li></ul>`,
  exp_true_inertPanel: t('true', '<div id=p inert>Panel</div>'),
  exp_true_ariaHiddenPanel: t('true', '<div id=p aria-hidden="true">Panel</div>'),
  // widget focus
  ad_host_notFocusable: `<div role=listbox aria-label=l aria-activedescendant="o1"><div role=option id=o1>a</div></div>`,
  ad_host_focusable: `<div role=listbox aria-label=l tabindex=0 aria-activedescendant="o1"><div role=option id=o1>a</div></div>`,
  ad_host_combobox_input: `<input role=combobox aria-label=c aria-expanded=true aria-controls=l aria-activedescendant=o1><div role=listbox id=l><div role=option id=o1>a</div></div>`,
  ad_host_disabled_input: `<input disabled role=combobox aria-label=c aria-activedescendant=o1><div role=listbox><div role=option id=o1>a</div></div>`,
  ad_host_delegatesFocus: `<x-h id=h aria-activedescendant=o1></x-h><div role=option id=o1>a</div><script>customElements.define('x-h',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open',delegatesFocus:true}).innerHTML='<input aria-label=q>'}})</script>`,
  ad_host_empty: `<div role=listbox aria-label=l aria-activedescendant=""><div role=option tabindex=0>a</div></div>`,
  ad_host_contenteditable: `<div contenteditable aria-activedescendant=o1></div><div id=o1>x</div>`,
  ad_host_ariahidden_parent: `<div aria-hidden=true><div role=listbox aria-label=l aria-activedescendant=o1><div role=option id=o1>a</div></div></div>`,
  ad_host_inert: `<div inert><div role=listbox aria-label=l aria-activedescendant=o1><div role=option id=o1>a</div></div></div>`,
  ad_on_generic_inside_focusable_textbox: `<div role=textbox tabindex=0 aria-label=t><span aria-activedescendant=x></span></div><div id=x>x</div>`,
  widget_div_button_noTab: `<div role=button>Go</div>`,
  widget_button_inside_toolbar_roving: `<div role=toolbar aria-label=t><div role=button tabindex=0>a</div><div role=button tabindex=-1>b</div></div>`,
  widget_toolbar_shadow_items: `<x-tb role=toolbar aria-label=t></x-tb><script>customElements.define('x-tb',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<div role=button tabindex=0>a</div><div role=button tabindex=-1>b</div>'}})</script>`,
  widget_link_nohref: `<a role=link>Go</a>`,
  widget_listbox_select: `<select aria-label=s role=listbox><option>a</option></select>`,
  widget_menu_controlled_by_owns: `<button aria-haspopup=menu aria-expanded=true aria-owns=m>Menu</button><div role=menu id=m aria-label=m><div role=menuitem tabindex=-1>a</div></div>`,
  widget_grid_noTab: `<div role=grid aria-label=g><div role=row><div role=gridcell>a</div></div></div>`,
  widget_slider_input_range: `<input type=range role=slider aria-label=s>`,
  widget_display_contents_button: `<button style="display:contents">Go</button>`,
  widget_summary_role_button: `<details><summary role=button>Go</summary>x</details>`,
  widget_iframe_role_button: `<iframe role=button title=x srcdoc="<p>x"></iframe>`
};
const b = await open();
for (const [name, html] of Object.entries(cases)) {
  const r = await scan(b, html, { runOnly: R });
  const rules = name.startsWith('exp') ? R.slice(0, 1) : R.slice(1);
  console.log(show(name, r, rules));
}
await b.close();
