const {dom}=require('./h.js');
const R=['table-headers-attr-valid','td-has-header','table-th-has-data-cells','duplicate-id','duplicate-id-aria'];
const page=b=>`<!doctype html><html lang="en"><head><title>t</title></head><body>${b}</body></html>`;
const tbl='<table><tr><th id="h1">Name</th><th id="h2">Age</th></tr><tr><td headers="h1">Al</td><td headers="h2">3</td></tr><tr><td headers="h1">Bo</td><td headers="h2">4</td></tr></table>';
dom('shadow table', page('<div id="h"></div>'), d=>{d.getElementById('h').attachShadow({mode:'open'}).innerHTML=tbl;}, R);
dom('two shadow tables same ids', page('<div id="h"></div><div id="g"></div>'), d=>{d.getElementById('h').attachShadow({mode:'open'}).innerHTML=tbl;d.getElementById('g').attachShadow({mode:'open'}).innerHTML=tbl;}, R);
