const { both, page, close } = require('./h.js');
const ID='form-control-label-quality';
(async () => {
  await both('APG select-only combobox, expanded', page(`<label id="cl">Favorite fruit</label><div role="combobox" aria-expanded="true" aria-haspopup="listbox" aria-labelledby="cl" aria-controls="lb" tabindex="0">Apple</div><div role="listbox" id="lb" aria-labelledby="cl" tabindex="-1"><div role="option" aria-selected="true">Apple</div><div role="option">Pear</div></div>`), ID);
  await both('APG editable combobox (input + label for), expanded', page(`<label for="cb">State</label><input id="cb" type="text" role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="lb2"><ul id="lb2" role="listbox" aria-labelledby="cb-l"><li role="option">Alabama</li></ul><span id="cb-l" hidden>State</span>`), ID);
  await both('collapsed (listbox display none)', page(`<label id="cl">Favorite fruit</label><div role="combobox" aria-expanded="false" aria-haspopup="listbox" aria-labelledby="cl" aria-controls="lb" tabindex="0">Apple</div><div role="listbox" id="lb" aria-labelledby="cl" style="display:none"><div role="option">Apple</div></div>`), ID);
  await close();
})();
