// Re-runs the minimal repro of each LY finding (round 8, visual) and prints engine verdicts.
const { cases, close } = require('./multi');
const mk = (inner) => `<x-a></x-a><script>customElements.define('x-a',class extends HTMLElement{connectedCallback(){this.attachShadow({mode:'open'}).innerHTML=${JSON.stringify(inner)}}})</script>`;
(async () => {
 const CM = ['contrast-minimum','contrast-computable'];
 console.log('#LY-1 inset box-shadow'); await cases([
  ['card overlay (painted #555 on #606060 = 1.19:1)', `<a href="#" style="display:block;width:300px;height:120px;background:#fff;box-shadow:inset 0 0 0 100vmax rgba(0,0,0,.6)"><span style="color:#555">Card title over a darkening overlay</span></a>`],
  ['#333 on inset black (1.66:1)', `<div style="box-shadow:inset 0 0 0 1000px #000;padding:10px"><p style="color:#333">Dark on inset shadow</p></div>`],
  ['#fff on inset black (21:1)', `<div style="box-shadow:inset 0 0 0 1000px #000;padding:10px"><p style="color:#fff">White on inset shadow</p></div>`]], CM);
 console.log('#LY-2 mask-image'); await cases([
  ['20% mask, drawn #ccc on white (1.61:1)', `<div style="mask-image:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.2))"><p style="color:#000">Masked faint text</p></div>`]], CM);
 console.log('#LY-3 focus replacement that draws nothing'); await cases([
  ['box-shadow:none', `<style>button:focus{outline:none;box-shadow:none}</style><button>Go</button>`],
  ['background:transparent', `<style>a:focus{outline:none;background:transparent}</style><a href="#">Link</a>`],
  ['control: outline:none alone', `<style>button:focus{outline:none}</style><button>Go</button>`]], ['css-focus-indicator-suppressed']);
 console.log('#LY-4 text-spacing + shadow DOM'); await cases([
  ['text in open shadow root, clipped with spacing', mk('<div style="width:220px;height:20px;overflow:hidden;font-size:16px">Subscribe to our weekly news</div>')],
  ['light text slotted into clipping shadow box', `<div id="s">Subscribe to our weekly news</div><script>document.getElementById('s').attachShadow({mode:'open'}).innerHTML='<div style="width:220px;height:20px;overflow:hidden;line-height:18px;font-size:16px"><slot></slot></div>'</script>`],
  ['control: same box in light DOM', `<div style="width:220px;height:20px;overflow:hidden;line-height:18px;font-size:16px">Subscribe to our weekly news</div>`]], ['text-spacing-content-loss']);
 console.log('#LY-5 display:contents parent'); await cases([
  ['text in display:contents div (#ccc, 1.61:1)', `<div style="display:contents;color:#ccc">Direct text in a contents box</div>`],
  ['slot fallback text', mk('<slot style="color:#ccc">Fallback text</slot>')],
  ['link wrapped in display:contents span', `<p style="color:#333">Read the <span style="display:contents"><a href="#" style="color:#444;text-decoration:none">terms of service</a></span> before you go.</p>`, { rules: ['link-in-text-block'] }]], CM);
 console.log('#LY-6 widget roles'); await cases([
  ['16px role=tab x2', `<div role="tablist"><div role="tab" tabindex="0" style="display:inline-block;width:16px;height:16px">1</div><div role="tab" tabindex="-1" style="display:inline-block;width:16px;height:16px">2</div></div>`],
  ['16px role=switch + role=checkbox', `<span role="switch" aria-checked="false" tabindex="0" style="display:inline-block;width:16px;height:16px;background:#ccc"></span><span role="checkbox" aria-checked="false" tabindex="0" style="display:inline-block;width:16px;height:16px;background:#ccc"></span>`],
  ['control: 16px role=button x2', `<span role="button" tabindex="0" style="display:inline-block;width:16px;height:16px;background:#ccc"></span><span role="button" tabindex="0" style="display:inline-block;width:16px;height:16px;background:#ccc"></span>`]], ['target-size-minimum']);
 console.log('#LY-7/8 link-in-text-block'); await cases([
  ['surrounding text underlined too', `<p style="color:#333;text-decoration:underline">Read the <a href="#" style="color:#444">terms</a> before you continue.</p>`],
  ['control: surrounding text bold too', `<p style="color:#333;font-weight:bold">Read the <a href="#" style="color:#444;text-decoration:none;font-weight:bold">terms</a> before you continue.</p>`],
  ['transparent box-shadow as cue', `<p style="color:#333">Read the <a href="#" style="color:#444;text-decoration:none;box-shadow:0 1px 0 transparent">terms</a> before you continue.</p>`],
  ['font-weight 500 (drawn as 400)', `<p style="color:#333">Read the <a href="#" style="color:#444;text-decoration:none;font-weight:500">terms</a> before you continue.</p>`]], ['link-in-text-block']);
 console.log('#LY-10 forced colors'); for (const fc of [undefined, 'active']) await cases([
  ['UA placeholder ' + (fc || 'off'), `<input placeholder="Search here">`, { rules: ['contrast-enhanced'] }],
  ['select #999 ' + (fc || 'off'), `<select style="color:#999"><option>Choose</option></select>`, { rules: ['contrast-minimum'] }]], CM, { forcedColors: fc });
 console.log('#LY-12 :is(:focus)'); await cases([['a:is(:focus){outline:none}', `<style>a:is(:focus){outline:none}</style><a href="#">Link</a>`], ['a:where(:focus){outline:none}', `<style>a:where(:focus){outline:none}</style><a href="#">Link</a>`]], ['css-focus-indicator-suppressed']);
 console.log('#LY-13 transform scale vs zoom'); await cases([
  ['12px x zoom 2 (#888, 3.54:1)', `<p style="zoom:2;color:#888;font-size:12px">Zoomed</p>`],
  ['12px x scale(2) (#888, 3.54:1)', `<p style="transform:scale(2);transform-origin:0 0;color:#888;font-size:12px">Scaled</p>`]], ['contrast-minimum']);
 console.log('#LY-14 ElementInternals ariaDisabled'); await cases([
  ['aria-disabled attr', `<div role="button" aria-disabled="true" style="color:#949494">Send</div>`],
  ['internals.ariaDisabled', `<x-b>Send</x-b><script>customElements.define('x-b',class extends HTMLElement{constructor(){super();const i=this.attachInternals();i.role='button';i.ariaDisabled='true'}});document.querySelector('x-b').style.color='#949494'</script>`]], ['contrast-minimum']);
 console.log('#LY-15 clip-path box in text-spacing'); await cases([
  ['clip-path:inset(0) box', `<div style="width:220px;height:20px;clip-path:inset(0);line-height:18px;font-size:16px">Subscribe to our weekly news</div>`]], ['text-spacing-content-loss']);
 await close();
})();
