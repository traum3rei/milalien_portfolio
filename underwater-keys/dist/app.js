const ns = 'http://www.w3.org/2000/svg', svg = document.querySelector('#piano');
const links = [['Résumé', 'assets/resume.pdf'], ['Instagram', 'https://www.instagram.com/spiralminerva'], ['YouTube', 'https://www.youtube.com/@milalien'], ['Spotify', 'https://open.spotify.com/artist/6q5ndwXMAd7JB3DprBBMHG'], ['SoundCloud', 'https://soundcloud.com/marylou-milakim']];
function el(n, a, p) { let e = document.createElementNS(ns, n); for (let k in a) e.setAttribute(k, a[k]); p.append(e); return e }
function center(t) { return [75 + t * 1040, 295 + 105 * Math.sin(t * Math.PI * 2 - 1.1) - t * 75] }
const tracks = [['Plsmakesomethingoutofit', 'plsmakesomethingoutofit'], ['dreamland sleep beat', 'dreamland-sample-beat'], ['Blue Orbjuice','summer-orbjuice-prod-jayysoul'], ['sample 2022 "iii_dye"','sample-2022-iiii_dye'],['40 min brain food beat', '40-min-brain-food-beat'], ['drowned memories plopp up', 'drowned-memories-plopp-up'], ['Now is all we got in heaven', 'nowisallwegotinheaven-m4a'], ['Maleficent', 'maleficent'], ['my deep sea', 'my-deep-sea'], ['hi : you', 'just-like-the-others'], ['white light', 'white-light'], ['sample forest', 'sample-forest'], ['set october bln', 'set-october-bln'], ['virus (awaynherenaway)', 'virus-awaynherenaway'], ['noreallove/insects on my body beat Xeni', 'https://soundcloud.com/marylou-milakim/noreallove']];
const videos = [['Music video to Maleficent', '6PVTr6FTBgI'], ['yungg M', 'rRDNVbsChEM'], ['snipped of my soundcloud set', 'S-0IhAanff4'], ['Maleficent vor_Clip', '8CWzqIZ6b6M'], ['inhuman_ voices of soulfreezer', '8Qf68MdSrok'], ['samples summer 23', 'gUK1XV9gQw0'], ['aikomeoutisde, kitten shoes_design prjkt', 'IzmHS8NGzhk'], ['samples 2 buy from summer 23', 'sG4gzJZdU_I'], ['recap life+edits 20-22', 'bCeolKMKBoI'], ['m+m', 'OB51LBXweCg'], ['1', 'CutuaxBFO_4'], ['333', '3ABCO_vB0Tc'], ['Morgen routine & Musik hören mit mir', 'sOz5usXSvLQ'], ['us4 4us 4u', '69xVY4vqHvw'], ['🐇', 'YvRq3efqepc']];
let activeKey, currentAudio = null, currentKind = null;
const audioCache = new Map(), warmup = document.querySelector('#audio-players');
const trackUrl = item => item[1].startsWith('https://') ? item[1] : 'https://soundcloud.com/marylou-milakim/' + item[1];
function prepareAudio(index) {
    index %= tracks.length;
    if (audioCache.has(index)) return audioCache.get(index);
    const item = tracks[index], frame = document.createElement('iframe');
    frame.inert = true; frame.className = 'audio-frame'; frame.title = item[0]; frame.allow = 'autoplay'; frame.scrolling = 'no';
    frame.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(trackUrl(item)) + '&auto_play=false&color=%23bdd78e&visual=false&show_artwork=false&show_teaser=false';
    warmup.append(frame);
    const entry = {frame, widget: null, ready: false, wanted: false, retry: null};
    audioCache.set(index, entry);
    const connect = () => {
        if (!window.SC?.Widget || entry.widget) return;
        entry.widget = SC.Widget(frame);
        entry.widget.bind(SC.Widget.Events.READY, () => {
            entry.ready = true;
            if (entry.wanted && currentAudio === entry && currentKind === 'soundcloud') requestPlayback(entry);
        });
        entry.widget.bind(SC.Widget.Events.PLAY, () => {
            if (currentAudio !== entry || currentKind !== 'soundcloud') { entry.widget.pause(); return; }
            clearTimeout(entry.retry); entry.wanted = false;
            document.querySelector('#playing').textContent = item[0];
        });
        entry.widget.bind(SC.Widget.Events.ERROR, () => {
            clearTimeout(entry.retry);
            if (currentAudio === entry) document.querySelector('#playing').textContent = 'Track unavailable — try another key';
        });
        // Also covers a frame that finished loading before the API script arrived.
        entry.widget.isPaused(() => {
            entry.ready = true;
            if (entry.wanted && currentAudio === entry) requestPlayback(entry);
        });
        if (entry.wanted && currentAudio === entry) requestPlayback(entry);
    };
    connect();
    if (!entry.widget) document.querySelector('#soundcloud-api').addEventListener('load', connect, {once:true});
    return entry;
}
function requestPlayback(entry, attempt = 0) {
    clearTimeout(entry.retry);
    if (!entry.wanted || currentAudio !== entry || currentKind !== 'soundcloud' || !entry.widget) return;
    entry.widget.play();
    // READY alone does not mean the stream is buffered. Keep the original click
    // pending until PLAY, without retrying after a user pauses actual playback.
    if (attempt < 12) entry.retry = setTimeout(() => requestPlayback(entry, attempt + 1), 400);
    else document.querySelector('#playing').textContent = 'SoundCloud is taking longer — use the play button below';
}
function stopAudio() {
    if (currentAudio) { currentAudio.wanted = false; clearTimeout(currentAudio.retry); currentAudio.widget?.pause(); currentAudio.frame.classList.remove('current'); currentAudio.frame.inert = true; }
    currentAudio = null;
}
function play(kind, index, key) {
    const item = (kind === 'soundcloud' ? tracks : videos)[index % (kind === 'soundcloud' ? tracks : videos).length];
    const panel = document.querySelector('#player');
    panel.classList.remove('closed'); panel.inert = false; panel.classList.toggle('video', kind === 'youtube');
    document.querySelector('#playing').textContent = item[0];
    document.querySelector('#video-player').replaceChildren();
    const previous = currentAudio;
    if (kind !== 'soundcloud' || previous !== audioCache.get(index % tracks.length)) stopAudio();
    currentKind = kind;
    if (kind === 'soundcloud') {
        const entry = prepareAudio(index);
        if (entry) {
            currentAudio = entry; entry.wanted = true;
            entry.frame.classList.add('current'); entry.frame.inert = false;
            // Call play inside the key gesture, and again on READY for a cold player.
            requestPlayback(entry);
            if (!entry.ready) document.querySelector('#playing').textContent = 'Loading · ' + item[0];
        } else {
            document.querySelector('#playing').textContent = 'Connecting to SoundCloud… press the key again';
        }
    } else {
        const frame = document.createElement('iframe'); frame.title = item[0];
        frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture'; frame.allowFullscreen = true;
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        frame.src = 'https://www.youtube.com/embed/' + item[1] + '?autoplay=1&rel=0';
        document.querySelector('#video-player').append(frame);
    }
    activeKey?.classList.remove('active'); activeKey = key; key.classList.add('active');
}
document.querySelector('#close-player').onclick = () => {
    stopAudio(); currentKind = null; document.querySelector('#video-player').replaceChildren();
    document.querySelector('#player').classList.add('closed'); document.querySelector('#player').inert = true; activeKey?.classList.remove('active'); activeKey?.focus();
};
function bindKey(g, kind, i) {
    if (kind === 'soundcloud') {
        g.addEventListener('pointerenter', () => prepareAudio(i));
        g.addEventListener('focus', () => prepareAudio(i));
        g.addEventListener('pointerdown', () => prepareAudio(i));
    }
    g.addEventListener('click', () => play(kind, i, g));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(kind, i, g); } });
}
// Warm the first key immediately; other tracks warm on hover/focus and stay cached.
prepareAudio(0);
// Preconnect a second likely key without waiting for a hover.
setTimeout(() => prepareAudio(1), 350);
// Each key is an extruded quadrilateral following a sinuous spatial ribbon.
const N = 24; function corners(t, width = 1, black = false) { let c = center(t), a = center(t - .001), b = center(t + .001), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l; let h = black ? 83 : 138; let offset = black ? -52 : 0; return [[c[0] - dx / l * 22.3 * width + nx * (-h + offset), c[1] - dy / l * 22.3 * width + ny * (-h + offset) * .70], [c[0] + dx / l * 22.3 * width + nx * (-h + offset), c[1] + dy / l * 22.3 * width + ny * (-h + offset) * .70], [c[0] + dx / l * 22.3 * width + nx * (h + offset), c[1] + dy / l * 22.3 * width + ny * (h + offset) * .70], [c[0] - dx / l * 22.3 * width + nx * (h + offset), c[1] - dy / l * 22.3 * width + ny * (h + offset) * .70]] }
const defs = el('defs', {}, svg);
const wear = el('pattern', {id:'key-wear',width:43,height:67,patternUnits:'userSpaceOnUse'}, defs);
el('path', {d:'M4 9l2 19M30 40l1 17M12 61l8-2M39 4l-3 7',stroke:'#463e37','stroke-opacity':'.20','stroke-width':'.8'}, wear);
for (let i = 0; i < N; i++) { let p = corners(i / (N - 1)), g = el('g', { role: 'button', tabindex: 0, 'aria-label': 'Play SoundCloud: ' + tracks[i % tracks.length][0], class: 'key white-key' }, svg); el('title', {}, g).textContent = tracks[i % tracks.length][0]; el('polygon', { points: [p[3], p[2], [p[2][0], p[2][1] + 30], [p[3][0], p[3][1] + 30]].map(x => x.join(',')).join(' '), fill: '#8a9c9e', stroke: '#273f48', 'stroke-width': '.7' }, g); el('polygon', { points: p.map(x => x.join(',')).join(' '), fill: '#f0eee3', stroke: '#50626a', 'stroke-width': '.9', class: 'top' }, g); el('polygon', {points:p.map(x=>x.join(',')).join(' '),fill:'url(#key-wear)','pointer-events':'none'}, g); bindKey(g, 'soundcloud', i) }
let vi = 0; for (let i = 0; i < N - 1; i++) { if ([2, 6].includes(i % 7)) continue; let p = corners((i + .5) / (N - 1), .6, true), n = vi++, g = el('g', { role: 'button', tabindex: 0, class: 'key black-key', 'aria-label': 'Play YouTube: ' + videos[n % videos.length][0] }, svg); el('title', {}, g).textContent = videos[n % videos.length][0]; el('polygon', { points: [p[3], p[2], [p[2][0], p[2][1] + 20], [p[3][0], p[3][1] + 20]].map(x => x.join(',')).join(' '), fill: '#050f17' }, g); el('polygon', { points: p.map(x => x.join(',')).join(' '), fill: '#20313a', stroke: '#56656b', 'stroke-width': '.7', class: 'top' }, g); bindKey(g, 'youtube', n) }
const icons = [`<path d="M6 2h8l4 4v16H6zM14 2v5h5M9 12h6M9 16h6"/>`, `<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r=".7"/>`, `<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 6 3-6 3z" fill="currentColor" stroke="none"/>`, `<circle cx="12" cy="12" r="10"/><path d="M6 9q6-3 12 1M7 12q5-2 10 1M8 15q4-1 8 1"/>`, `<path d="M2 14v4m3-7v8m3-10v11m3-13v13h8a4 4 0 0 0 0-8 6 6 0 0 0-8-5"/>`]; document.querySelectorAll('nav a').forEach((a, i) => { a.setAttribute('aria-label', links[i][0]); a.title = links[i][0]; a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[i] + '</svg>' });
const canvas = document.querySelector('#ocean'), ctx = canvas.getContext('2d'), nearCanvas = document.querySelector('#near-water'), nearCtx = nearCanvas.getContext('2d');
let aimX=0, aimY=0, swimX=0, swimY=0;
addEventListener('pointermove', e => {aimX=(e.clientX/innerWidth-.5);aimY=(e.clientY/innerHeight-.5)});
addEventListener('pointerout',e=>{if(!e.relatedTarget){aimX=0;aimY=0}}); let w, h; function resize() { w = innerWidth; h = innerHeight; const dpr=Math.min(devicePixelRatio,1.5); for(const c of [canvas,nearCanvas]){c.width=w*dpr;c.height=h*dpr;c.getContext('2d').setTransform(dpr,0,0,dpr,0,0)} } addEventListener('resize', resize); resize();
let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; const jellies = [
{x:.86,y:.25,r:75,c:[134,128,242],s:1,z:.75},
{x:.13,y:.66,r:64,c:[133,130,250],s:2,z:.8},
{x:.72,y:.77,r:46,c:[105,163,242],s:3,z:.6},
{x:.43,y:.13,r:34,c:[144,185,246],s:4,z:.4},
{x:.97,y:.58,r:31,c:[159,137,242],s:5,z:.5},
{x:.28,y:.36,r:20,c:[153,184,247],s:6,z:.25},
{x:.65,y:.21,r:15,c:[163,185,251],s:7,z:.2},
{x:.52,y:.82,r:20,c:[133,175,240],s:8,z:.3},
{x:-.025,y:.23,r:133,c:[144,137,239],s:9,z:1.8,near:true},
{x:1.04,y:.78,r:150,c:[113,161,235],s:10,z:2,near:true}
]; function jelly(j, t, layer = ctx) { const ctx=layer; let x=j.x*w+Math.sin(t*.16+j.s)*25-swimX*j.z*38, y=j.y*h+Math.cos(t*.21+j.s)*28-swimY*j.z*30, r=j.r*Math.min(w/900,1)*(1+Math.sin(t*1.05+j.s)*.035), col=j.c.join(','); ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(j.s) * .22); let glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.8); glow.addColorStop(0, `rgba(${col},.16)`); glow.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = glow; ctx.fillRect(-r * 3, -r * 3, r * 6, r * 6); for (let k = 0; k < 16; k++) { ctx.beginPath(); let sx = (k / 15 - .5) * r * 1.6; ctx.moveTo(sx, 12); for (let n = 1; n < 18; n++) { let yy = n * r * .12, xx = sx + Math.sin(n * .45 + t * .8 + k) * n * 1.3; ctx.lineTo(xx, yy) } ctx.strokeStyle = `rgba(${col},${.12 + (k % 3) * .09})`; ctx.lineWidth = k % 4 === 0 ? 2.4 : .7; ctx.stroke() } let g = ctx.createRadialGradient(-r * .25, -r * .4, 2, 0, -r * .1, r * 1.1); g.addColorStop(0, `rgba(${col},.12)`); g.addColorStop(.7, `rgba(${col},.3)`); g.addColorStop(1, `rgba(${col},.65)`); ctx.beginPath(); ctx.moveTo(-r, 8); ctx.bezierCurveTo(-r, -r * 1.2, r, -r * 1.2, r, 8); ctx.bezierCurveTo(r * .5, 25, -r * .5, 25, -r, 8); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = `rgba(${col},.7)`; ctx.lineWidth = 1; ctx.stroke(); for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(0, -r * .8); ctx.quadraticCurveTo((k - 3) * r * .18, -r * .3, (k - 3) * r * .29, 10); ctx.strokeStyle = `rgba(${col},.2)`; ctx.stroke() } ctx.restore() }
function draw(ms) {
 const t=reduced?0:ms/1000;
 swimX+=(aimX-swimX)*.025;swimY+=(aimY-swimY)*.025;
 nearCtx.clearRect(0,0,w,h);
 const water=ctx.createLinearGradient(0,0,w*.25,h);
 water.addColorStop(0,'#c0f0f6');water.addColorStop(.28,'#76c8e5');water.addColorStop(.65,'#439cc8');water.addColorStop(1,'#266b9b');
 ctx.fillStyle=water;ctx.fillRect(0,0,w,h);
 const sunlight=ctx.createRadialGradient(w*.42,-h*.08,0,w*.42,0,h*.83);
 sunlight.addColorStop(0,'#f2ffff99');sunlight.addColorStop(.5,'#c2faff20');sunlight.addColorStop(1,'#a6f5ff00');ctx.fillStyle=sunlight;ctx.fillRect(0,0,w,h);
 // Wide, feathered shafts descend from the surface, rather than flat stripes.
 ctx.save();ctx.globalCompositeOperation='screen';
 for(let i=0;i<6;i++){
  const origin=w*(.12+i*.13)+Math.sin(t*.09+i)*20-swimX*12;
  const beam=ctx.createLinearGradient(origin-100,0,origin+210,0);
  beam.addColorStop(0,'#d8ffff00');beam.addColorStop(.5,'#d8ffff13');beam.addColorStop(1,'#d8ffff00');
  ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(origin-40,0);ctx.lineTo(origin+30,0);ctx.lineTo(origin+330,h);ctx.lineTo(origin-180,h);ctx.fill();
 }
 ctx.restore();
 jellies.filter(j=>!j.near).sort((a,b)=>a.z-b.z).forEach(j=>jelly(j,t));
 // Suspended particles pass at different depths as the viewpoint drifts.
 for(let i=0;i<95;i++){
  const depth=.25+(i%7)/5;
  const x=((Math.sin(i*127.1)*.5+.5)*w-swimX*depth*30+Math.sin(t*.1+i)*12+w)%w;
  const y=((i*137.3-t*(3+depth*4)-swimY*depth*25)%h+h)%h;
  ctx.fillStyle=`rgba(226,253,255,${.12+depth*.15})`;ctx.beginPath();ctx.arc(x,y,.4+depth*.8,0,Math.PI*2);ctx.fill();
 }
 jellies.filter(j=>j.near).forEach(j=>jelly(j,t,nearCtx));
 // Sparse transparent bubbles move past the viewer in the foreground.
 for(let i=0;i<9;i++){
  const x=(w*(.06+(i*.137)%1)+Math.sin(t*.3+i)*17-swimX*45+w)%w;
  const y=((i*193-t*(13+i%3*6))%h+h)%h,r=2+i%4*1.5;
  nearCtx.beginPath();nearCtx.arc(x,y,r,0,Math.PI*2);nearCtx.strokeStyle='#dbfaff55';nearCtx.lineWidth=.8;nearCtx.stroke();
  nearCtx.beginPath();nearCtx.arc(x-r*.25,y-r*.3,r*.23,0,Math.PI*2);nearCtx.fillStyle='#efffff80';nearCtx.fill();
 }
 if(!reduced){
  const bob=Math.sin(t*.4)*7;
  svg.style.transform=`translate(${-swimX*9}px,${bob-swimY*6}px) rotate(${Math.sin(t*.25)*.4}deg)`;
  requestAnimationFrame(draw);
 }
}
requestAnimationFrame(draw);
