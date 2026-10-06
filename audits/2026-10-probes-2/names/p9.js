const p=require('./h');
p('label for div role=button','<label for="x">Save</label><div role="button" id="x" tabindex="0"></div>',['button-name-present','aria-role-name-present']);
p('img in label no alt','<label><img src="icon.png"> Remember me <input type="checkbox"></label>',['img-alt-present','role-img-text-alternative-present']);
p('empty link in label','<label><input type="checkbox"> I agree to the <a href="/terms"><img src="t.png" alt=""></a></label>',['link-name-present']);
p('label for span role=checkbox','<label for="c">Agree</label><span role="checkbox" id="c" aria-checked="false" tabindex="0"></span>',['binary-control-name-present','aria-role-name-present']);
p('label for div role=slider','<label for="s">Vol</label><div role="slider" id="s" aria-valuenow="2" tabindex="0"></div>',['slider-name-present','aria-role-name-present']);
p('label for div role=textbox','<label for="t">Name</label><div role="textbox" id="t" contenteditable tabindex="0"></div>',['textbox-name-present','aria-role-name-present','form-control-programmatic-label-present']);
p('svg role img in label','<label><svg role="img"></svg> Remember <input type="checkbox"></label>',['svg-image-text-alternative-present','role-img-text-alternative-present']);
