const {scan,show,close}=require('../../visual/h.js');
(async()=>{
 const C=['contrast-minimum','contrast-computable'];
 show('input value #ccc', await scan(`<label>Name <input value="Light value" style="color:#ccc;background:#fff"></label>`,C));
 show('input placeholder #ddd', await scan(`<label>Name <input placeholder="Light placeholder" style="background:#fff"></label><style>::placeholder{color:#ddd}</style>`,C));
 show('textarea #ccc', await scan(`<label>Note <textarea style="color:#ccc">Textarea value</textarea></label>`,C));
 show('select #ccc', await scan(`<label>Pick <select style="color:#ccc;background:#fff"><option>Option one</option></select></label>`,C));
 show('zoom:2 12px #767676->wait use 3.5:1 #888', await scan(`<p style="zoom:2;font-size:12px;color:#888">Zoomed text that is large</p>`,['contrast-minimum']));
 show('control 24px #888', await scan(`<p style="font-size:24px;color:#888">Big text that is large</p>`,['contrast-minimum']));
 const A=['img-alt-quality'];
 for (const alt of ['F-35','WD-40','★★★★☆','Photo.jpg']) show('alt '+alt, await scan(`<img alt="${alt}" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="50" height="50">`,A));
 let areas=''; for(let i=0;i<120;i++) areas+=`<area shape="rect" coords="${i},0,${i+1},1" href="#${i}" alt="image">`;
 let inps=''; for(let i=0;i<120;i++) inps+=`<input type="image" alt="image" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">`;
 let imgs=''; for(let i=0;i<120;i++) imgs+=`<img alt="image" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">`;
 for (const [r,h] of [['area-alt-quality',`<map name="m">${areas}</map><img usemap="#m" alt="map" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width=200 height=10>`],['input-image-alt-quality',`<form>${inps}</form>`],['img-alt-quality',imgs]]){
   const o=await scan(h,[r]); console.log(r,o[0].outcome,'occurrences:',o[0].occ.length);
 }
 await close();
})();
