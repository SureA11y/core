const { runAll } = require('./harness');
const R = ['button-name-present','link-name-present','label-in-name'];
const def = (n, inner) => `customElements.define('${n}', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML=${JSON.stringify(inner)};}});`;
const cases = [
 { id:'slot-fallback', setup:def('x-b','<button data-t="in"><slot>Default label</slot></button>'), html:`<x-b></x-b>` },
 { id:'slot-ws', setup:def('x-c','<button data-t="in"><slot>Default label</slot></button>'), html:`<x-c> </x-c>` },
 { id:'slot-comment', setup:def('x-c2','<button data-t="in"><slot>Default label</slot></button>'), html:`<x-c2><!-- c --></x-c2>` },
 { id:'named-slot-unassigned', setup:def('x-d','<button data-t="in"><slot name="lbl"></slot></button>'), html:`<x-d>Orphan text</x-d>` },
 { id:'named-slot-fallback-unassigned', setup:def('x-d2','<button data-t="in"><slot name="lbl">Fallback</slot></button>'), html:`<x-d2>Orphan</x-d2>` },
 { id:'slot-link', setup:def('x-link','<a href="#" data-t="in"><slot></slot></a>'), html:`<x-link>Docs</x-link>` },
 { id:'slot-hidden-host-child', setup:def('x-h','<button data-t="in"><slot></slot></button>'), html:`<x-h><span hidden>Secret</span></x-h>` },
 { id:'slot-display-contents', setup:def('x-dc','<button data-t="in"><slot style="display:none"></slot></button>'), html:`<x-dc>Text</x-dc>` },
 { id:'nested-slot', setup:def('x-in','<button data-t="in"><slot></slot></button>')+def('x-out','<x-in><slot></slot></x-in>'), html:`<x-out>Deep</x-out>` },
];
runAll(cases, R);
