const {run4}=require('./h.js');
run4([{name:'smoke',rules:['p-as-heading','resize-text-content-loss'],base:'v117',html:'<html lang=en><body><p><b>Shipping:</b></p><p>Text here that is long.</p><div style="width:100px;height:20px;overflow:hidden">Some long text that is clipped badly here and more</div></body></html>',viewport:{width:640,height:800}}]);
