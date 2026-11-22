const {four,page,close}=require('./h.js');
const list=(t)=>`<fieldset><legend>Size</legend>${[1,2,3,4].map(i=>`<label style="display:block;line-height:16px"><input type=${t} name=s> Opt ${i}</label>`).join('')}</fieldset>`;
const cases=[
 ['no reset, checkboxes stacked', '', list('checkbox')],
 ['normalize.css font-size:100%;line-height:1.15 on input', '<style>button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}</style>', list('checkbox')],
 ['universal reset *{margin:0;padding:0}', '<style>*{margin:0;padding:0}</style>', list('checkbox')],
 ['radios, input{max-width:100%}', '<style>input{max-width:100%}</style>', list('radio')],
 ['checkboxes min-width:0', '<style>input{min-width:0}</style>', list('checkbox')],
 ['checkbox padding:0 only', '<style>input{padding:0}</style>', list('checkbox')],
 ['checkbox width:13px (UA size)', '<style>input{width:13px;height:13px}</style>', list('checkbox')],
 ['checkbox transform:translateY(2px)', '<style>input{transform:translateY(2px)}</style>', list('checkbox')],
];
(async()=>{for(const [l,h,b] of cases)await four(l,page(b,h),['target-size-minimum']);await close();})();
