module.exports=[
{name:'owns-cycle', rules:['aria-owns-valid'], html:'<div role=group aria-label=Q id=q aria-owns="r">Q</div><div role=group aria-label=R id=r aria-owns="q">R</div>', ax:['#q','#r']},
{name:'owns-indirect-ancestor', rules:['aria-owns-valid'], html:'<div role=group aria-label=A id=a aria-owns="c">A</div><div role=group aria-label=C id=c><div role=group aria-label=D id=d aria-owns="a">D</div></div>', ax:['#a','#c','#d']},
];
