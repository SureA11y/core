const { cases, close } = require('./multi');
(async () => {
await cases([
 ['mask-image fade on text block', `<div style="-webkit-mask-image:linear-gradient(#000 30%,transparent);mask-image:linear-gradient(#000 30%,transparent);height:120px;overflow:hidden"><p style="color:#000">Line one of an excerpt</p><p style="color:#000">Line two of an excerpt</p><p style="color:#000">Line three fading away</p></div>`],
 ['mask on ancestor solid 20% alpha', `<div style="mask-image:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.2))"><p style="color:#000">Masked faint text</p></div>`],
 ['ancestor clip-path ok', `<div style="clip-path:inset(0)"><p style="color:#777">clip path text</p></div>`],
 ['ancestor mix-blend multiply on white', `<div style="mix-blend-mode:multiply;background:#fff"><p style="color:#000">multiply</p></div>`],
 ['ancestor filter grayscale', `<div style="filter:grayscale(1)"><p style="color:#f00;background:#fff">red grayscaled</p></div>`],
 ['ancestor filter drop-shadow only, no bg', `<div style="filter:drop-shadow(0 0 4px #000)"><p style="color:#777">drop shadow text</p></div>`],
 ['opacity animation mid (paused at 50%)', `<style>@keyframes f{from{opacity:0}to{opacity:1}}</style><p style="color:#000;animation:f 10s linear infinite;animation-play-state:paused;animation-delay:-5s">paused half</p>`],
 ['color transition mid', `<style>p{transition:color 100s linear}</style><p id=t style="color:#000">transition</p><script>document.body.offsetWidth;document.getElementById('t').style.color='#eee'</script>`],
], undefined);
await close();
})();
