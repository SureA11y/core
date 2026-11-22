const { run, page } = require('./sc.js');
const ID='form-group-name-present';
const R2 = '<label><input type="radio" name="s"> S</label><label><input type="radio" name="s"> M</label>';
run([
 ['legend aria-hidden text', page(`<fieldset><legend><span aria-hidden="true">Size</span></legend>${R2}</fieldset>`), ID],
 ['legend img alt=""', page(`<fieldset><legend><img alt="" src="x.png"></legend>${R2}</fieldset>`), ID],
 ['legend display:none text', page(`<fieldset><legend><span style="display:none">Size</span></legend>${R2}</fieldset>`), ID],
 ['legend visually-hidden text', page(`<fieldset><legend><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Size</span></legend>${R2}</fieldset>`), ID],
 ['legend aria-label only, empty content', page(`<fieldset><legend aria-label="Size"></legend>${R2}</fieldset>`), ID],
 ['legend whitespace + nbsp', page(`<fieldset><legend>&nbsp;</legend>${R2}</fieldset>`), ID],
 ['legend with CSS ::before content only', page(`<fieldset><legend class=l></legend>${R2}</fieldset>`, '<style>.l::before{content:"Size"}</style>'), ID],
 ['legend hidden attr', page(`<fieldset><legend hidden>Size</legend>${R2}</fieldset>`), ID],
 ['second legend named, first empty', page(`<fieldset><legend></legend><legend>Size</legend>${R2}</fieldset>`), ID],
 ['legend role=presentation', page(`<fieldset><legend role="presentation">Size</legend>${R2}</fieldset>`), ID],
 ['radios under aria-hidden, focusable', page(`<div aria-hidden="true">${R2}</div>`), ID],
 ['one of 3 radios aria-hidden', page(`<div aria-hidden="true"><input type=radio name=s aria-label=a></div><input type=radio name=s aria-label=b><input type=radio name=s aria-label=c>`), ID],
 ['radios inert', page(`<div inert>${R2}</div>`), ID],
 ['radios visibility:hidden', page(`<div style="visibility:hidden">${R2}</div>`), ID],
 ['radios opacity 0 custom', page(`<label><input type="radio" name="s" style="opacity:0;position:absolute"> S</label><label><input type="radio" name="s" style="opacity:0;position:absolute"> M</label>`), ID],
 ['radios role=none on input (conflict)', page(`<input type=radio name=s role=none aria-label=a><input type=radio name=s role=none aria-label=b>`), ID],
 ['radios aria-hidden=false inside aria-hidden', page(`<div aria-hidden="true"><div aria-hidden="false">${R2}</div></div>`), ID],
]);
