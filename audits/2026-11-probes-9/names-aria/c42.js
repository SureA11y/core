const R=['aria-valid-attr','aria-valid-attr-value','aria-allowed-attr'];
module.exports=[
{name:'typos', rules:R, html:'<input id=a aria-labeledby="x" aria-label=q><span id=x>X</span><div id=b aria-hiden="true">y</div><button id=c aria-role="button">z</button>'},
{name:'aria13', rules:R, html:'<button id=a aria-description="Opens in new tab">Go</button><div role=table aria-label=t><div role=row><div role=cell id=c aria-colindextext="Column B" aria-rowindextext="Row 2">1</div></div></div><button id=k aria-keyshortcuts="Alt+S">Save</button>'},
{name:'uppercase-attr', rules:R, html:'<button id=a ARIA-LABEL="Save"></button><button id=b Aria-Pressed="true">t</button>'},
{name:'empty-values', rules:R, html:'<button id=a aria-pressed="">t</button><div id=b role=checkbox tabindex=0 aria-checked="">c</div><button id=c aria-expanded=" ">e</button><div id=d role=slider tabindex=0 aria-label=s aria-valuenow="">s</div>'},
{name:'idref-whitespace', rules:R, html:'<input id=a aria-label=q aria-errormessage="  " aria-invalid=true><input id=b aria-label=q aria-activedescendant="o1 o2">'},
];
