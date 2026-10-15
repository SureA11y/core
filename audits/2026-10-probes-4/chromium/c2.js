const {contrastRun,report}=require('./ch.js');const {close}=require('./h.js');
const T='Sample text here';
(async()=>{
 // 1. root color-scheme dark, no explicit colours: canvas dark, text light
 let html=`<!doctype html><html lang=en style="color-scheme:dark"><head><title>c</title></head><body><main><p data-t id=cs_root>${T}</p><p data-t id=cs_root_link><a href="#x">a link here</a></p><p data-t id=cs_root_grey style="color:#666">${T}</p></main></body></html>`;
 console.log(report('root color-scheme dark (no explicit bg)',await contrastRun(html),{cs_root:'pass',cs_root_link:'pass',cs_root_grey:'fail'}));
 html=`<!doctype html><html lang=en><head><title>c</title><meta name=color-scheme content="dark"></head><body><main><p data-t id=meta_cs>${T}</p></main></body></html>`;
 console.log(report('meta color-scheme dark',await contrastRun(html),{meta_cs:'pass'}));
 // 2. element color-scheme dark on a non-root: CanvasText white on white body
 html=`<!doctype html><html lang=en><head><title>c</title><style>body{background:#fff}</style></head><body><main><p data-t id=cs_el style="color-scheme:dark">${T}</p><p data-t id=cs_el_canvas style="color-scheme:dark;background:Canvas;color:CanvasText">${T}</p></main></body></html>`;
 console.log(report('element color-scheme dark',await contrastRun(html),{cs_el:'pass (inherits #000? check px)',cs_el_canvas:'pass'}));
 // 3. prefers-color-scheme
 html=`<!doctype html><html lang=en><head><title>c</title><style>body{background:#fff;color:#000} .x{color:#333} @media (prefers-color-scheme:dark){body{background:#111;color:#eee} .x{color:#444}}</style></head><body><main><p data-t id=pcs class=x>${T}</p><p data-t id=pcs_plain>${T}</p></main></body></html>`;
 console.log(report('pcs light',await contrastRun(html,{colorScheme:'light'}),{pcs:'pass',pcs_plain:'pass'}));
 console.log(report('pcs dark',await contrastRun(html,{colorScheme:'dark'}),{pcs:'fail',pcs_plain:'pass'}));
 // 4. same colour fg==bg (invisible) vs near
 html=`<!doctype html><html lang=en><head><title>c</title><style>body{background:#fff}</style></head><body><main><p data-t id=same style="background:#eee;color:#eee">${T}</p><p data-t id=near style="background:#eee;color:#e4e4e4">${T}</p><div style="color:#000"><p data-t id=curbg style="background:currentColor;color:#ddd">${T}</p></div></main></body></html>`;
 console.log(report('near-invisible',await contrastRun(html),{same:'NA (invisible)?',near:'fail',curbg:'fail'}));
 await close();
})();
