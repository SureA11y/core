const { computeBaselineKey } = require('@surea11y/core/baseline');
const k = (h)=>computeBaselineKey('r','C',h);
console.log('nbsp class == space class:', k('<img class="a b">')===k('<img class="a b">'));
console.log('ideographic sp:', k('<img class="a　b">')===k('<img class="a b">'));
// truncated start tag (data URL > 2000) with reordered attributes
const data = 'data:image/png;base64,' + 'A'.repeat(2100);
const h1 = ('<img src="'+data+'" class="logo">').slice(0,2000)+'…';
const h2 = ('<img class="logo" src="'+data+'">').slice(0,2000)+'…';
console.log('truncated reorder match:', k(h1)===k(h2));
console.log('uppercase attr names (svg viewBox order):', k('<svg viewBox="0 0 1 1" class="x">')===k('<svg class="x" viewBox="0 0 1 1">'));
console.log('single-quoted / unquoted attr left unnormalised:', k("<img src='a' alt=''>")===k("<img alt='' src='a'>"));
