const { both, page, close } = require('./h.js');
(async () => {
  await both('submit value="" title', page('<form><input type="submit" value="" title="Send"></form>'), 'button-name-present');
  await both('submit value="" ', page('<form><input type="submit" value=""></form>'), 'button-name-present');
  await both('svg role=img text only', page('<svg role="img" width="50" height="20"><text x="0" y="15">Sales</text></svg>'), 'svg-image-text-alternative-present');
  await both('option label', page('<label for=s>Pick</label><select id=s><option label="">Text</option></select>'), 'select-name-present');
  await close();
})();
