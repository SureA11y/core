const { cases, close } = require('./multi');
(async () => {
await cases([
 ['a:is(:focus)', `<style>a:is(:focus){outline:none}</style><a href="#">Link</a>`],
 [':is(a):focus', `<style>:is(a):focus{outline:none}</style><a href="#">Link</a>`],
 ['a:focus (control)', `<style>a:focus{outline:none}</style><a href="#">Link</a>`],
 ['a:where(:focus)', `<style>a:where(:focus){outline:none}</style><a href="#">Link</a>`],
 ['a:is(:focus,:hover)', `<style>a:is(:focus,:hover){outline:none}</style><a href="#">Link</a>`],
], ['css-focus-indicator-suppressed']);
const g = '#949494';
await cases([
 ['aria-disabled attr', `<div role="button" aria-disabled="true" style="color:${g}">Send</div>`],
 ['internals ariaDisabled', `<x-b>Send</x-b><script>customElements.define('x-b',class extends HTMLElement{constructor(){super();const i=this.attachInternals();i.role='button';i.ariaDisabled='true'}});document.querySelector('x-b').style.color='${g}'</script>`],
 ['internals role, aria-disabled attr', `<x-c aria-disabled="true">Send</x-c><script>customElements.define('x-c',class extends HTMLElement{constructor(){super();this.attachInternals().role='button'}});document.querySelector('x-c').style.color='${g}'</script>`],
], ['contrast-minimum']);
await close();
})();
