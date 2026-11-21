const R=['aria-role-name-present','landmark-role-name-present','role-img-text-alternative-present'];
module.exports=[
{name:'roles-needing-names', rules:R, html:'<div id=a role=dialog>x</div><div id=b role=grid><div role=row><div role=gridcell>x</div></div></div><div id=c role=table><div role=row><div role=cell>x</div></div></div><div id=d role=tree><div role=treeitem>x</div></div><div id=e role=radiogroup></div><div id=f role=toolbar></div><div id=g role=tabpanel>x</div><div id=h role=region>x</div><div id=i role=form>x</div><div id=j role=application>x</div><div id=k role=marquee>x</div><div id=l role=log>x</div><div id=m role=group>x</div>'},
{name:'roles-name-from-content', rules:R, html:'<div id=a role=row>cell</div><div id=b role=heading aria-level=2></div><div id=c role=cell></div><div id=d role=link tabindex=0></div><div id=e role=img></div><div id=f role=img aria-labelledby="nope"></div><div id=g role=img title="T"></div><span id=h role=img>★</span>'},
{name:'tabpanel-labelledby-tab', rules:R, html:'<div role=tablist><button role=tab id=t aria-controls=p aria-selected=true>Tab A</button></div><div role=tabpanel id=p>content</div>'},
];
