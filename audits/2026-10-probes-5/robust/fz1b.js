const { scan, sum } = require('./j.js');
const body = `<h2>Untitled</h2><label for=k>Label</label><input id=k><a href="/a">click here</a><img src=a.png alt="image">`;
for (const l of ['en','en-US','en-constructor','xx','constructor','fr','fr-toString']) {
  const r = scan(`<!doctype html><html lang="${l}"><head><title>Home</title></head><body><main>${body}</main></body></html>`, {runOnly:['heading-quality','link-name-quality','img-alt-quality','form-control-label-quality','page-title-patterns']});
  console.log('==', l); console.log(sum(r));
}
