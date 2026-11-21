// display: contents element holding text directly: its text is drawn but skipped by contrast; a link whose parent is display:contents skipped by link-in-text-block
const { cases, close } = require('./multi');
(async () => {
 await cases([
  ['text directly in display:contents div', `<div style="display:contents;color:#ccc">Direct text in a contents box</div>`],
  ['text directly in display:contents span inside p', `<p>Before <span style="display:contents;color:#ccc">contents span text</span> after</p>`],
  ['link in p via display:contents wrapper', `<p style="color:#333">Read the <span style="display:contents"><a href="#" style="color:#444;text-decoration:none">terms of service</a></span> before you go.</p>`],
 ], ['contrast-minimum','contrast-computable','link-in-text-block']);
 await close();
})();
