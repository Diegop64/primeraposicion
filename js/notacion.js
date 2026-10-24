/* Primera Posición: dibujo de pentagramas y del mástil (SVG) */
(function(){
'use strict';
const PP = window.PP;

const KEY_POS = {F:10, C:7, G:11, D:8};               // posiciones de los sostenidos de la armadura
const KEY_SIG = {'La':['F','C','G'], 'Re':['F','C'], 'Sol':['F'], 'Do':[]};
PP.KEY_SIG = KEY_SIG;

function sharp(x, y, G){
  const h = G * 1.35, w = G * 0.5;
  return `<g stroke="var(--ink)" fill="none">
    <line x1="${x - w * .45}" y1="${y - h}" x2="${x - w * .45}" y2="${y + h * 1.05}" stroke-width="${G * .1}"/>
    <line x1="${x + w * .45}" y1="${y - h * 1.08}" x2="${x + w * .45}" y2="${y + h * .97}" stroke-width="${G * .1}"/>
    <line x1="${x - w * 1.05}" y1="${y - G * .3}" x2="${x + w * 1.05}" y2="${y - G * .55}" stroke-width="${G * .32}"/>
    <line x1="${x - w * 1.05}" y1="${y + G * .55}" x2="${x + w * 1.05}" y2="${y + G * .3}" stroke-width="${G * .32}"/></g>`;
}
function natural(x, y, G){
  const h = G * 1.3, w = G * .38;
  return `<g stroke="var(--ink)" fill="none">
    <line x1="${x - w}" y1="${y - h}" x2="${x - w}" y2="${y + G * .55}" stroke-width="${G * .1}"/>
    <line x1="${x + w}" y1="${y - G * .55}" x2="${x + w}" y2="${y + h}" stroke-width="${G * .1}"/>
    <line x1="${x - w}" y1="${y - G * .3}" x2="${x + w}" y2="${y - G * .5}" stroke-width="${G * .3}"/>
    <line x1="${x - w}" y1="${y + G * .5}" x2="${x + w}" y2="${y + G * .3}" stroke-width="${G * .3}"/></g>`;
}
PP.sharpSVG = sharp;

const BEATS = {w:4, hd:3, h:2, qd:1.5, q:1, e:0.5};
PP.BEATS = BEATS;

/* ---------- Partituras en texto ----------
   Cada nota: id:duración y, separados por comas, sus signos. Ejemplo: "A4:h,D,mf,TA"
     ~ al final de la nota: ligada con la siguiente (mismo arco)
     D / U: arco abajo / arco arriba (si no se indica, se calcula)
     '  : levantar el arco y volver a empezar abajo
     .  staccato   >  acento   -  tenuto   ^  calderón
     pp p mp mf f ff: matiz       cresc / dim ... end: regulador
     TA MS MI M Pt Tal: qué parte del arco usar
     pizz / arco: pellizcar la cuerda o volver al arco */
const DYN = ['pp', 'p', 'mp', 'mf', 'f', 'ff'];
const REGION = {TA:'T.A.', MS:'M.S.', MI:'M.I.', M:'M.', Pt:'Pta.', Tal:'Tal.'};
PP.REGION = REGION;
PP.parseSong = function(str){
  const out = str.trim().split(/\s+/).map(tok => {
    const parts = tok.split(',');
    let head = parts.shift();
    const slur = head.endsWith('~'); if(slur) head = head.slice(0, -1);
    const [id, dur] = head.split(':');
    const it = id === 'r' ? {rest:true, dur:dur || 'q'} : {id, dur:dur || 'q', slur};
    parts.forEach(p => {
      if(p === 'D' || p === 'U') it.bowSet = p === 'D' ? 'd' : 'u';
      else if(p === "'") it.retake = true;
      else if(p === '.') it.art = 'stacc';
      else if(p === '>') it.art = 'acc';
      else if(p === '-') it.art = 'ten';
      else if(p === '^') it.ferm = true;
      else if(DYN.indexOf(p) >= 0) it.dyn = p;
      else if(p === 'cresc' || p === 'dim') it.hairStart = p === 'cresc' ? '<' : '>';
      else if(p === 'end') it.hairEnd = true;
      else if(REGION[p]) it.reg = p;
      else if(p === 'pizz' || p === 'arco') it.txt = p === 'pizz' ? 'pizz.' : 'arco';
    });
    return it;
  });
  for(let i = 1; i < out.length; i++){
    if(out[i - 1].slur && !out[i].rest){ out[i].slurIn = true; if(out[i - 1].id === out[i].id) out[i - 1].tie = true; }
  }
  let hs = -1;
  out.forEach((it, i) => {
    if(it.hairStart) hs = i;
    if(it.hairEnd && hs >= 0){
      for(let k = hs; k <= i; k++){ out[k].hairT = out[hs].hairStart; out[k].hairP = i === hs ? 1 : (k - hs) / (i - hs); }
      out[hs].hairS = true; out[i].hairE = true; hs = -1;
    }
  });
  return out;
};

/* Arcos: una nota (o un grupo ligado) por arco, alternando abajo y arriba.
   Empieza abajo si la primera nota cae en la parte fuerte. Después de un silencio,
   la nota que cae en el primer pulso del compás vuelve a empezar abajo.
   Si dos arcos seguidos van en la misma dirección se marca "levantar el arco". */
PP.bowing = function(notes, time, pickup){
  if(notes._bowed) return notes;
  const per = time ? +time.split('/')[0] : 4;
  let dir = null, pos = -(pickup || 0), prevRest = false;
  notes.forEach(it => {
    const onDown = Math.abs(((pos % per) + per) % per) < 1e-6;
    if(it.rest){ prevRest = true; }
    else if(!it.slurIn){
      let d;
      if(it.bowSet) d = it.bowSet;
      else if(dir === null) d = onDown ? 'd' : 'u';
      else if(it.retake || (prevRest && onDown)) d = 'd';
      else d = dir === 'd' ? 'u' : 'd';
      it.lift = !!(dir && d === dir && !prevRest);
      it.bow = d; dir = d; prevRest = false;
    }
    pos += BEATS[it.dur] || 1;
  });
  try{ Object.defineProperty(notes, '_bowed', {value:true}); }catch(e){}
  return notes;
};

/* Expresión para que la reproducción suene como está escrita: volumen y duración de cada nota */
PP.expression = function(notes){
  const VOL = {pp:.08, p:.11, mp:.15, mf:.18, f:.24, ff:.29};
  let cur = .18;
  const base = notes.map(it => { if(it.dyn) cur = VOL[it.dyn]; return cur; });
  // reguladores: van del matiz de partida al siguiente matiz escrito (o un escalón más)
  notes.forEach((it, i) => {
    if(!it.hairS) return;
    let e = i; while(e < notes.length && !notes[e].hairE) e++;
    let target = null; for(let k = e; k < Math.min(notes.length, e + 3); k++) if(notes[k].dyn && k > i){ target = VOL[notes[k].dyn]; break; }
    if(target == null) target = it.hairT === '<' ? base[i] * 1.45 : base[i] * .6;
    for(let k = i; k <= e && k < notes.length; k++) base[k] = base[i] + (target - base[i]) * (notes[k].hairP || 0);
  });
  return notes.map((it, i) => ({
    vol: base[i] * (it.art === 'acc' ? 1.35 : 1),
    len: it.art === 'stacc' ? .45 : it.slur || it.art === 'ten' ? 1 : .9,
    hold: it.ferm ? 1.6 : 1
  }));
};

/* ---------- Signos del violín (SVG) ---------- */
const SIGN = {
  down:(x, yb, G, c) => { const w = G * .62, h = G * 1.05; return `<g class="bow-d"><path d="M${x - w} ${yb} V${yb - h} H${x + w} V${yb}" fill="none" stroke="${c}" stroke-width="${G * .14}"/><rect x="${x - w - G * .07}" y="${yb - h - G * .07}" width="${2 * w + G * .14}" height="${G * .38}" fill="${c}"/></g>`; },
  up:(x, yb, G, c) => { const w = G * .52, h = G * 1.3; return `<path class="bow-u" d="M${x - w} ${yb - h} L${x} ${yb} L${x + w} ${yb - h}" fill="none" stroke="${c}" stroke-width="${G * .14}" stroke-linejoin="round"/>`; },
  lift:(x, yb, G, c) => `<path d="M${x + G * .1} ${yb - G * 1.05} q ${G * .42} ${G * .05} ${G * .2} ${G * .5} q ${-G * .15} ${G * .3} ${-G * .5} ${G * .55} q ${G * .3} ${-G * .35} ${G * .2} ${-G * .5} q ${-G * .3} ${-.05 * G} ${-G * .3} ${-G * .3} q 0 ${-G * .3} ${G * .4} ${-G * .25}z" fill="${c}"/>`,
  stacc:(x, y, G, c) => `<circle cx="${x}" cy="${y}" r="${G * .2}" fill="${c}"/>`,
  acc:(x, y, G, c) => `<path d="M${x - G * .6} ${y - G * .38} L${x + G * .6} ${y} L${x - G * .6} ${y + G * .38}" fill="none" stroke="${c}" stroke-width="${G * .13}"/>`,
  ten:(x, y, G, c) => `<line x1="${x - G * .6}" x2="${x + G * .6}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="${G * .16}"/>`,
  ferm:(x, yb, G, c) => `<path d="M${x - G * 1.1} ${yb} A ${G * 1.1} ${G * 1} 0 0 1 ${x + G * 1.1} ${yb} A ${G * 1.1} ${G * .8} 0 0 0 ${x - G * 1.1} ${yb}z" fill="${c}"/><circle cx="${x}" cy="${yb - G * .3}" r="${G * .2}" fill="${c}"/>`,
  dyn:(x, yb, G, t, c) => `<text x="${x}" y="${yb}" font-size="${G * 1.75}" font-style="italic" font-weight="700" fill="${c}" text-anchor="middle" style="font-family:Georgia,'Times New Roman',serif">${t}</text>`,
  word:(x, yb, G, t, c) => `<text x="${x}" y="${yb}" font-size="${G * 1.05}" font-weight="700" fill="${c}" text-anchor="middle">${t}</text>`
};
PP.SIGN = SIGN;

/* Glosario de signos (leyenda de cada partitura, chuleta y ejercicio de signos) */
PP.SIGNS = [
  {k:'down', t:'Arco abajo', d:'Del talón hacia la punta. El brazo se abre. Suele usarse en la parte fuerte del compás.'},
  {k:'up', t:'Arco arriba', d:'De la punta hacia el talón. El brazo se cierra. Suele usarse para la parte débil y para preparar el siguiente arco abajo.'},
  {k:'lift', t:'Levantar el arco', d:'Levanta el arco de la cuerda, llévalo por el aire al talón y vuelve a empezar arco abajo.'},
  {k:'slur', t:'Ligadura', d:'Todas las notas bajo la curva van en el mismo arco: la mano izquierda cambia de nota y el arco no se para.'},
  {k:'tie', t:'Ligadura de prolongación', d:'Une dos notas iguales: suenan como una sola nota larga, sin cambiar de arco.'},
  {k:'stacc', t:'Staccato', d:'Nota corta y separada. El arco se detiene un instante después de cada nota, sin levantarse.'},
  {k:'acc', t:'Acento', d:'Empieza la nota con más peso y más velocidad de arco, y luego suéltala.'},
  {k:'ten', t:'Tenuto', d:'Mantén la nota todo su valor, con el sonido pleno hasta el final.'},
  {k:'ferm', t:'Calderón', d:'Alarga la nota o el silencio más de lo escrito, lo que te pida la música.'},
  {k:'dyn', t:'Matices', d:'pp muy suave, p suave, mp medio suave, mf medio fuerte, f fuerte, ff muy fuerte. Para tocar más fuerte: más peso, más velocidad y el arco más cerca del puente.'},
  {k:'cresc', t:'Crescendo', d:'Cada vez más fuerte: añade peso y velocidad poco a poco.'},
  {k:'dim', t:'Diminuendo', d:'Cada vez más suave: quita peso y acerca el arco al diapasón.'},
  {k:'reg', t:'Parte del arco', d:'T.A. todo el arco, M.S. mitad superior (hacia la punta), M.I. mitad inferior (hacia el talón), M. el centro del arco, Pta. la punta, Tal. el talón.'},
  {k:'pizz', t:'pizz. y arco', d:'pizz.: pellizca la cuerda con el dedo índice de la mano derecha. arco: vuelve a tocar con el arco.'}
];
PP.signIcon = function(k, h){
  const G = 10, c = 'var(--ink)', cx = 20;
  const nh = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="4.3" ry="3" transform="rotate(-22 ${x} ${y})" fill="${c}"/>`;
  const lines = (a, b) => [a, b].map(y => `<line x1="0" x2="40" y1="${y}" y2="${y}" stroke="var(--muted)" stroke-width=".7"/>`).join('');
  const inner = {
    down: () => SIGN.down(cx, 21, G, c), up: () => SIGN.up(cx, 22, G, c), lift: () => SIGN.lift(cx - 2, 20, G * 1.2, c),
    slur: () => lines(8, 16) + nh(7, 16) + nh(20, 12) + nh(33, 16) + `<path d="M6 21 Q 20 31 34 21 Q 20 27 6 21z" fill="${c}"/>`,
    tie: () => lines(8, 16) + nh(8, 12) + nh(32, 12) + `<path d="M10 17 Q 20 25 30 17 Q 20 22 10 17z" fill="${c}"/>`,
    stacc: () => nh(cx, 10) + SIGN.stacc(cx, 22, G * 1.2, c),
    acc: () => nh(cx, 21) + SIGN.acc(cx, 9, G, c),
    ten: () => nh(cx, 21) + SIGN.ten(cx, 10, G, c),
    ferm: () => SIGN.ferm(cx, 22, G * 1.1, c),
    dyn: () => SIGN.dyn(cx, 22, G * 1.1, 'mf', c),
    cresc: () => `<path d="M36 7 L4 15 L36 23" fill="none" stroke="${c}" stroke-width="1.6"/>`,
    dim: () => `<path d="M4 7 L36 15 L4 23" fill="none" stroke="${c}" stroke-width="1.6"/>`,
    reg: () => SIGN.word(cx, 20, G * 1.15, 'T.A.', c),
    pizz: () => SIGN.word(cx, 20, G * 1.15, '<tspan font-style="italic">pizz.</tspan>', c)
  }[k];
  return `<svg class="sign-ico" viewBox="0 0 40 30" width="${(h || 30) * 4 / 3}" height="${h || 30}" aria-hidden="true">${inner ? inner() : ''}</svg>`;
};
/* Qué signos aparecen en una lista de notas */
PP.signsIn = function(notes, bows){
  const f = new Set();
  notes.forEach(it => {
    if(bows !== false && it.bow) f.add(it.bow === 'd' ? 'down' : 'up');
    if(bows !== false && (it.lift || it.retake)) f.add('lift');
    if(it.slur && !it.tie) f.add('slur'); if(it.tie) f.add('tie');
    if(it.art) f.add(it.art); if(it.ferm) f.add('ferm'); if(it.dyn) f.add('dyn');
    if(it.hairT) f.add(it.hairT === '<' ? 'cresc' : 'dim'); if(it.reg) f.add('reg'); if(it.txt) f.add('pizz');
  });
  return PP.SIGNS.filter(x => f.has(x.k));
};
/* Leyenda compacta: un botón por signo; al pulsarlo se explica debajo */
PP.signLegend = function(el, notes, bows){
  const list = PP.signsIn(notes, bows);
  if(!list.length){ el.innerHTML = ''; return; }
  el.innerHTML = `<div class="sign-legend"><span class="small muted">Signos:</span>${list.map(x => `<button type="button" class="sign-chip" data-sk="${x.k}" aria-expanded="false">${PP.signIcon(x.k, 22)}<span>${x.t}</span></button>`).join('')}</div><p class="small sign-desc" data-sdesc hidden></p>`;
  const desc = el.querySelector('[data-sdesc]');
  el.querySelectorAll('[data-sk]').forEach(b => b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') === 'true';
    el.querySelectorAll('[data-sk]').forEach(o => o.setAttribute('aria-expanded', 'false'));
    if(open){ desc.hidden = true; return; }
    const x = PP.SIGNS.find(s => s.k === b.dataset.sk);
    b.setAttribute('aria-expanded', 'true'); desc.hidden = false; desc.innerHTML = `<b>${x.t}.</b> ${x.d}`;
  }));
};
PP.signTable = function(){
  return `<div class="sign-table">${PP.SIGNS.map(x => `<div class="sign-row">${PP.signIcon(x.k, 30)}<div><b>${x.t}</b><span class="small muted">${x.d}</span></div></div>`).join('')}</div>`;
};

/* items: [{id, dur, slur, bow, art, dyn, ...}] o {rest:true, dur}
   opts: G, key ('Re'...), time ('4/4'), names, fingers, spacing, clickable, minWidth, color (colorear por cuerda),
         hideAcc, bows (false oculta los signos de arco), final */
PP.staff = function(items, opts){
  opts = opts || {};
  const G = opts.G || 10, sp = opts.spacing || G * 4.4;
  const top = G * 4.2;                                  // y de la quinta línea (Fa5)
  const yOf = d => top + (10 - d) * G / 2;
  const bottomLine = yOf(2);
  const keyAcc = (KEY_SIG[opts.key] || []);
  const showBows = opts.bows !== false;
  const INK = 'var(--ink)', MARK = 'var(--bow-ink, var(--ink))';
  let x = G * 1.2;
  const clefX = x; x += G * 3.6;
  const keyX = x; x += keyAcc.length * G * 1.1 + (keyAcc.length ? G * .6 : 0);
  const timeX = x; if(opts.time) x += G * 2.8;
  x += G * 1.2;
  const x0 = x;
  // posiciones x
  const per = opts.time ? +opts.time.split('/')[0] : 0;
  let beat = 0; const xs = [], bars = [];
  items.forEach((it, i) => {
    const b = BEATS[it.dur] || 1;
    xs.push(x);
    x += sp * (opts.proportional ? Math.max(0.7, Math.sqrt(b)) : (it.dur === 'e' ? 0.75 : 1));
    beat += b;
    if(per && Math.abs(beat - Math.round(beat)) < 1e-6 && Math.round(beat) % per === 0 && i < items.length - 1){ bars.push(x - sp * .35); x += G * .6; }
  });
  const W = Math.max(opts.minWidth || 0, x + G * .8);

  // grupos de corcheas (de dos en dos dentro del pulso) y dirección de las plicas
  const beam = {}; let pos = 0;
  items.forEach((it, i) => {
    if(it.dur === 'e' && !it.rest && items[i + 1] && items[i + 1].dur === 'e' && !items[i + 1].rest && Math.abs(pos % 1) < 1e-6){ beam[i] = i + 1; beam[i + 1] = -1; }
    pos += BEATS[it.dur] || 1;
  });
  const up = [], hy = [], has = [];
  items.forEach((it, i) => {
    const n = !it.rest && PP.NOTES[it.id]; has[i] = !!n; if(!n) return;
    hy[i] = yOf(n.d); up[i] = n.d < 6;
    if(beam[i] > 0){ const n2 = PP.NOTES[items[beam[i]].id]; up[i] = (n.d + n2.d) / 2 < 6; up[beam[i]] = up[i]; }
  });
  const stemmed = i => items[i].dur && items[i].dur !== 'w';
  const beamY = {};
  items.forEach((it, i) => { if(beam[i] > 0 && has[i]){ const y1 = hy[i], y2 = hy[beam[i]]; beamY[i] = beamY[beam[i]] = up[i] ? Math.min(y1, y2) - G * 3.2 : Math.max(y1, y2) + G * 3.2; } });
  const stemEnd = i => beamY[i] != null ? beamY[i] : hy[i] + (up[i] ? -G * 3.4 : G * 3.4);
  const noteTop = i => stemmed(i) && up[i] ? stemEnd(i) : hy[i] - G * .5;
  const noteBot = i => stemmed(i) && !up[i] ? stemEnd(i) : hy[i] + G * .5;

  // ligaduras: grupos [a..b] dentro de este trozo de partitura
  const slurs = [];
  for(let i = 0; i < items.length; i++){
    if(!has[i]) continue;
    const startHere = items[i].slur && !(i > 0 && items[i - 1].slur);
    const fromBefore = i === 0 && items[i].slurIn;
    if(!startHere && !fromBefore) continue;
    let b = i; while(items[b].slur && b + 1 < items.length && has[b + 1]) b++;
    const openL = fromBefore, openR = !!items[b].slur && b === items.length - 1;
    if(b === i && !openL && !openR){ continue; }
    const grp = []; for(let k = i; k <= b; k++) grp.push(k);
    const below = grp.every(k => up[k] && stemmed(k)) || grp.every(k => !stemmed(k) && hy[k] > yOf(6));
    const tie = b === i + 1 && items[i].id === items[b].id;
    const x1 = openL ? xs[i] - sp * .7 : xs[i] + G * .15, x2 = openR ? Math.min(W - G * .3, xs[b] + sp * .7) : xs[b] - G * .15;
    const off = G * .85;
    const y1 = hy[i] + (below ? off : -off), y2 = hy[b] + (below ? off : -off);
    let ext;
    if(below) ext = Math.max(...grp.map(k => hy[k])) + G * (tie ? 1.3 : 1.8);
    else ext = Math.min(...grp.map(k => k === i || k === b ? hy[k] : noteTop(k))) - G * (tie ? 1.3 : 1.7);
    slurs.push({x1, y1, x2, y2, ext, below});
    i = b - 1 >= i ? b - 1 : i;
  }

  // marcas encima de cada nota: articulación, arco, parte del arco, texto y calderón
  const above = {}; let minY = 0;
  items.forEach((it, i) => {
    if(!has[i]) return;
    const n = PP.NOTES[it.id], y = hy[i], xx = xs[i];
    let cur = Math.min(yOf(11.6), noteTop(i) - G * .9);
    slurs.forEach(sl => { if(!sl.below && xx >= sl.x1 - G && xx <= sl.x2 + G) cur = Math.min(cur, sl.ext - G * .5); });
    const parts = []; let topY = 0;
    const artAbove = it.art && (!stemmed(i) ? n.d >= 6 : !up[i]);
    if(artAbove){
      const ay = Math.min(y - G * 1.3, yOf(11) - (n.d >= 10 ? G * .4 : 0));
      parts.push(SIGN[it.art](xx, n.d >= 10 ? Math.min(ay, y - G * 1.3) : ay, G, INK)); cur = Math.min(cur, ay - G * .8); topY = Math.min(topY, ay - G * .5);
    }
    if(showBows && it.bow){
      if(it.lift || it.retake) parts.push(SIGN.lift(xx - sp * .5, cur, G, MARK));
      parts.push((it.bow === 'd' ? SIGN.down : SIGN.up)(xx, cur, G, MARK)); topY = Math.min(topY, cur - G * 1.4); cur -= G * 1.7;
    }
    if(it.reg){ parts.push(SIGN.word(xx, cur, G, REGION[it.reg], 'var(--muted)')); topY = Math.min(topY, cur - G * .9); cur -= G * 1.4; }
    if(it.txt){ parts.push(SIGN.word(xx, cur, G, `<tspan font-style="italic">${it.txt}</tspan>`, INK)); topY = Math.min(topY, cur - G * .9); cur -= G * 1.4; }
    if(it.ferm){ parts.push(SIGN.ferm(xx, cur, G, INK)); topY = Math.min(topY, cur - G * 1.2); cur -= G * 1.4; }
    above[i] = parts.join('');
    minY = Math.min(minY, topY);
  });
  slurs.forEach(sl => { if(!sl.below) minY = Math.min(minY, sl.ext - G * .4); });

  // altura: notas, ligaduras y articulaciones por debajo, matices y etiquetas
  let low = yOf(2) + G * .8;
  items.forEach((it, i) => { if(!has[i]) return; const d = PP.NOTES[it.id].d;
    low = Math.max(low, hy[i] + G * (d <= 0 ? .9 : .7));
    if(stemmed(i) && !up[i]) low = Math.max(low, stemEnd(i) + G * .2);
    if(it.art && !(!stemmed(i) ? d >= 6 : !up[i])) low = Math.max(low, Math.max(hy[i] + G * 1.3, yOf(1)) + G * .5);
  });
  slurs.forEach(sl => { if(sl.below) low = Math.max(low, sl.ext + G * .3); });
  const hasDyn = items.some(it => it.dyn || it.hairT);
  const dynY = low + G * 1.9;
  const labBase = hasDyn ? dynY + G * .5 : low + G * .3;
  const labelsH = (opts.names ? G * 1.7 : 0) + (opts.fingers ? G * 1.7 : 0);
  const H = labBase + labelsH + G * .7;

  let s = '';
  for(let k = 0; k < 5; k++){ const y = yOf(2 + k * 2); s += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="${INK}" stroke-width="${G * .1}"/>`; }
  s += `<line x1="${W - G * .1}" x2="${W - G * .1}" y1="${yOf(10)}" y2="${bottomLine}" stroke="${INK}" stroke-width="${opts.final ? G * .45 : G * .12}"/>`;
  if(opts.final) s += `<line x1="${W - G * .75}" x2="${W - G * .75}" y1="${yOf(10)}" y2="${bottomLine}" stroke="${INK}" stroke-width="${G * .12}"/>`;
  s += `<text x="${clefX}" y="${bottomLine + G * 1.05}" font-size="${G * 6}" fill="${INK}" style="font-family:var(--f-music)">\u{1D11E}</text>`;
  keyAcc.forEach((k, i) => { s += sharp(keyX + i * G * 1.1 + G * .5, yOf(KEY_POS[k]), G); });
  if(opts.time){
    const [a, b] = opts.time.split('/');
    const st = `font-size="${G * 2.75}" font-weight="800" fill="${INK}" text-anchor="middle" style="font-family:var(--f-display)"`;
    s += `<text x="${timeX + G}" y="${yOf(6) - G * .08}" ${st}>${a}</text><text x="${timeX + G}" y="${yOf(2) - G * .08}" ${st}>${b}</text>`;
  }
  bars.forEach(bx => { s += `<line x1="${bx}" x2="${bx}" y1="${yOf(10)}" y2="${bottomLine}" stroke="${INK}" stroke-width="${G * .12}"/>`; });

  items.forEach((it, i) => {
    const xx = xs[i];
    if(it.rest){ s += restSVG(it.dur, xx, yOf, G); if(it.ferm) s += SIGN.ferm(xx, yOf(11.6), G, INK); return; }
    const n = PP.NOTES[it.id]; if(!n) return;
    const y = hy[i];
    const col = opts.color ? `var(--${PP.STRING_CLASS[n.s]})` : INK;
    s += `<g class="${opts.clickable ? 'hit' : ''}" data-i="${i}" data-id="${n.id}"${opts.clickable ? ` tabindex="0" role="button" aria-label="${PP.name(n)}${it.bow ? (it.bow === 'd' ? ', arco abajo' : ', arco arriba') : ''}"` : ''}>`;
    if(opts.clickable) s += `<rect x="${xx - sp / 2}" y="${-G * 8}" width="${sp}" height="${H + G * 8}" fill="transparent"/>`;
    // líneas adicionales
    for(let k = 0; k >= n.d; k -= 2) s += `<line x1="${xx - G * 1.05}" x2="${xx + G * 1.05}" y1="${yOf(k)}" y2="${yOf(k)}" stroke="${INK}" stroke-width="${G * .1}"/>`;
    for(let k = 12; k <= n.d; k += 2) s += `<line x1="${xx - G * 1.05}" x2="${xx + G * 1.05}" y1="${yOf(k)}" y2="${yOf(k)}" stroke="${INK}" stroke-width="${G * .1}"/>`;
    // alteración accidental
    if(!opts.hideAcc){
      const letter = n.l[0], inKey = keyAcc.indexOf(letter) >= 0;
      if(n.acc === '#' && !inKey) s += sharp(xx - G * 1.75, y, G * .9);
      if(!n.acc && inKey) s += natural(xx - G * 1.6, y, G * .9);
    }
    const hollow = it.dur === 'w' || it.dur === 'h' || it.dur === 'hd';
    const rx = G * .66, ry = G * .46;
    s += `<ellipse class="nh" cx="${xx}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(-22 ${xx} ${y})" fill="${hollow ? 'none' : col}" stroke="${hollow ? col : 'none'}" stroke-width="${G * .2}"/>`;
    if(hollow) s += `<ellipse class="nh-in" cx="${xx}" cy="${y}" rx="${rx * .55}" ry="${ry * .5}" transform="rotate(-40 ${xx} ${y})" fill="none"/>`;
    if(it.dur === 'hd' || it.dur === 'qd'){ const dy = n.d % 2 === 0 ? -G / 2 : 0; s += `<circle cx="${xx + G * 1.15}" cy="${y + dy}" r="${G * .17}" fill="${col}"/>`; }
    // plica
    if(stemmed(i)){
      const u = up[i], sx = u ? xx + rx * .92 : xx - rx * .92, ey = stemEnd(i);
      s += `<line x1="${sx}" x2="${sx}" y1="${y + (u ? -G * .2 : G * .2)}" y2="${ey}" stroke="${col}" stroke-width="${G * .12}"/>`;
      if(beam[i] > 0){
        const x2 = xs[beam[i]] + (u ? rx * .92 : -rx * .92);
        s += `<line x1="${sx - G * .06}" x2="${x2 + G * .06}" y1="${ey + (u ? G * .22 : -G * .22)}" y2="${ey + (u ? G * .22 : -G * .22)}" stroke="${INK}" stroke-width="${G * .5}"/>`;
      }
      if(it.dur === 'e' && !(i in beam)){
        s += u ? `<path d="M${sx} ${ey} q ${G * .3} ${G * 1.3} ${G * 1.3} ${G * 2} q ${-G * .3} ${-G * .6} ${-G * 1.3} ${-G * 1.2}" fill="${col}"/>`
               : `<path d="M${sx} ${ey} q ${G * .3} ${-G * 1.3} ${G * 1.3} ${-G * 2} q ${-G * .3} ${G * .6} ${-G * 1.3} ${G * 1.2}" fill="${col}"/>`;
      }
    }
    // articulación por debajo de la nota
    if(it.art && !(!stemmed(i) ? n.d >= 6 : !up[i])) s += SIGN[it.art](xx, Math.max(y + G * 1.3, yOf(1)), G, INK);
    s += above[i] || '';
    if(it.dyn) s += SIGN.dyn(xx, dynY, G, it.dyn, INK);
    let ly = labBase;
    if(opts.names){ ly += G * 1.7; s += `<text class="lab" x="${xx}" y="${ly}" text-anchor="middle" font-size="${G * 1.3}" font-weight="700" fill="${INK}">${PP.name(n)}</text>`; }
    if(opts.fingers){ ly += G * 1.7; s += `<text x="${xx}" y="${ly}" text-anchor="middle" font-size="${G * 1.15}" fill="var(--${PP.STRING_CLASS[n.s]})" font-weight="700">${n.f === 0 ? '0' : n.f}</text>`; }
    if(it.label) s += `<text x="${xx}" y="${minY - G * .3}" text-anchor="middle" font-size="${G * 1.1}" fill="var(--muted)">${it.label}</text>`;
    s += `</g>`;
  });

  // ligaduras (forma de media luna, más gruesa en el centro)
  slurs.forEach(sl => {
    const cy = 2 * sl.ext - (sl.y1 + sl.y2) / 2, cx = (sl.x1 + sl.x2) / 2, th = G * (sl.below ? .45 : -.45);
    s += `<path class="slur" d="M${sl.x1} ${sl.y1} Q ${cx} ${cy} ${sl.x2} ${sl.y2} Q ${cx} ${cy - th} ${sl.x1} ${sl.y1}z" fill="${INK}"/>`;
  });
  // reguladores (crescendo y diminuendo), por tramos dentro de esta línea
  for(let i = 0; i < items.length; i++){
    if(!items[i].hairT) continue;
    let b = i; while(b + 1 < items.length && items[b + 1].hairT && !items[b].hairE) b++;
    const t = items[i].hairT, cyH = dynY - G * .55, hw = G * .6;
    const xa = items[i].hairS ? xs[i] + (items[i].dyn ? G * 1.7 : G * .2) : x0 - G * .8;
    const xb = items[b].hairE ? xs[b] - (items[b].dyn || (items[b + 1] && items[b + 1].dyn && xs[b + 1] - xs[b] < G * 3) ? G * 1.3 : -G * .3) : W - G * .6;
    const pa = items[i].hairS ? 0 : items[i].hairP, pb = items[b].hairE ? 1 : Math.min(1, items[b].hairP + .15);
    const wa = (t === '<' ? pa : 1 - pa) * hw, wb = (t === '<' ? pb : 1 - pb) * hw;
    if(xb > xa) s += `<path d="M${xb} ${cyH - wb} L${xa} ${cyH - wa} M${xa} ${cyH + wa} L${xb} ${cyH + wb}" fill="none" stroke="${INK}" stroke-width="${G * .13}"/>`;
    i = b;
  }

  const vy = minY < 0 ? minY - G * .4 : 0, VH = H - vy;
  return `<svg class="staff-svg" viewBox="0 ${vy} ${W} ${VH}" width="${W}" height="${VH}" role="img" aria-label="${opts.label || 'Pentagrama'}">` + s + '</svg>';
};
function restSVG(dur, x, yOf, G){
  if(dur === 'w') return `<rect x="${x - G * .7}" y="${yOf(8)}" width="${G * 1.4}" height="${G * .55}" fill="var(--ink)"/>`;
  if(dur === 'h') return `<rect x="${x - G * .7}" y="${yOf(6) - G * .55}" width="${G * 1.4}" height="${G * .55}" fill="var(--ink)"/>`;
  if(dur === 'e') return `<text x="${x}" y="${yOf(6)}" text-anchor="middle" font-size="${G * 4}" fill="var(--ink)" style="font-family:var(--f-music)">\u{1D13E}</text>`;
  return `<text x="${x}" y="${yOf(6)}" text-anchor="middle" font-size="${G * 4}" fill="var(--ink)" style="font-family:var(--f-music)">\u{1D13D}</text>`;
}

PP.bindStaff = function(el, fn){
  el.querySelectorAll('.hit').forEach(g => {
    g.addEventListener('click', () => fn(g));
    g.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fn(g); } });
  });
};
PP.lightStaff = function(el, i){ el.querySelectorAll('[data-i]').forEach(g => g.classList.toggle('on', +g.dataset.i === i)); };

/* ---------- Mástil ----------
   Geometría real: la distancia a la cejilla crece como L·(1 − 2^(−s/12)).
   opts: notes (ids), label: 'name' | 'finger' | 'none', tapes, onPick, width */
PP.board = function(el, opts){
  opts = opts || {};
  const ids = opts.notes || PP.POOLS.alto;
  const state = {marks:{}, lit:null};
  const getView = () => opts.view || PP.store.get('vista-mastil', 'frente');
  function render(){
    const view = getView();
    const tog = opts.toggle === false ? '' : `<div class="seg board-toggle" role="group" aria-label="Vista del mástil"><button type="button" data-view="frente" aria-pressed="${view === 'frente'}" title="El mástil visto de frente, como en un esquema">De frente</button><button type="button" data-view="pov" aria-pressed="${view === 'pov'}" title="El mástil como lo ves tú con el violín apoyado en el hombro">Al tocar</button></div>`;
    el.innerHTML = `<div class="board-wrap">${tog}<div class="board-view">${view === 'pov' ? povSVG() : frontSVG()}</div></div>`;
    const pick = g => opts.onPick && opts.onPick(PP.NOTES[g.dataset.id], g);
    el.querySelectorAll('.bnote').forEach(g => {
      g.addEventListener('click', () => pick(g));
      g.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pick(g); } });
    });
    el.querySelectorAll('[data-view]').forEach(bt => bt.addEventListener('click', () => { PP.store.set('vista-mastil', bt.dataset.view); render(); }));
    Object.entries(state.marks).forEach(([id, col]) => { const c = el.querySelector(`.bnote[data-id="${id}"] circle`); if(c) c.style.fill = col; });
    if(state.lit) api.light(state.lit);
  }
  const label = n => opts.label === 'none' ? '' : opts.label === 'finger' ? String(n.f || '0') : PP.name(n);
  const noteG = (n, x, y, r, fs) => {
    const c = `var(--${PP.STRING_CLASS[n.s]})`, txt = label(n);
    return `<g class="bnote" data-id="${n.id}" tabindex="0" role="button" aria-label="${PP.name(n)}, cuerda ${n.s}, ${PP.fingerText(n)}" style="cursor:pointer">
      <circle cx="${x}" cy="${y}" r="${r}" fill="${n.f === 0 ? 'var(--paper)' : 'var(--ebony)'}" stroke="${c}" stroke-width="${Math.max(1.6, r * .17)}"/>
      <text x="${x}" y="${y + fs * .36}" text-anchor="middle" font-size="${txt.length > 3 ? fs * .87 : fs}" font-weight="700" fill="${n.f === 0 ? 'var(--ink)' : 'var(--ebony-ink)'}">${txt}</text></g>`;
  };
  /* Vista de frente: esquema plano, distancias reales L·(1 − 2^(−s/12)) */
  function frontSVG(){
    const W = 250, nut = 64, K = 640, H = nut + K * (1 - Math.pow(2, -8 / 12)) + 30;
    const yS = s => nut + K * (1 - Math.pow(2, -s / 12));
    const xS = (i, y) => { const spread = 40 + (y - nut) * .05; return W / 2 + (i - 1.5) * spread; };
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${opts.width || W}" role="img" aria-label="Mástil del violín visto de frente, primera posición">`;
    s += `<path d="M${xS(-.6, nut)} ${nut} L${xS(3.6, nut)} ${nut} L${xS(3.6, H)} ${H} L${xS(-.6, H)} ${H} Z" fill="var(--ebony)"/>`;
    s += `<rect x="${xS(-.65, nut)}" y="${nut - 7}" width="${xS(3.65, nut) - xS(-.65, nut)}" height="8" rx="2" fill="var(--gut)"/>`;
    if(opts.tapes !== false) [2, 4, 5, 7].forEach(st => { const y = yS(st); s += `<line x1="${xS(-.55, y)}" x2="${xS(3.55, y)}" y1="${y}" y2="${y}" stroke="var(--ebony-ink)" stroke-opacity=".28" stroke-width="3"/>`; });
    PP.STRINGS.forEach((name, i) => {
      s += `<line x1="${xS(i, nut)}" y1="${nut}" x2="${xS(i, H)}" y2="${H}" stroke="var(--${PP.STRING_CLASS[name]})" stroke-width="${3.2 - i * .55}" stroke-opacity=".9"/>`;
      s += `<text x="${xS(i, nut)}" y="${nut - 44}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--${PP.STRING_CLASS[name]})">${PP.strName(name)}</text>`;
    });
    ids.forEach(id => { const n = PP.NOTES[id]; if(!n || n.pos === 'pos3') return; const si = PP.STRINGS.indexOf(n.s);
      const y = n.f === 0 ? nut - 22 : yS(n.semi), x = xS(si, Math.max(nut, y)); s += noteG(n, x, y, 14, 12); });
    [[2, '1'], [4, '2'], [5, '3'], [7, '4']].forEach(([st, t]) => { s += `<text x="${W - 4}" y="${yS(st) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${t}</text>`; });
    return s + '</svg>';
  }
  /* Vista al tocar: mirando desde la mentonera hacia la voluta. Perspectiva:
     la cejilla y la voluta quedan lejos (arriba, pequeñas) y la zona de los dedos 3 y 4 cerca.
     El violín se inclina hacia la cuerda Mi, como cuando está apoyado en el hombro. */
  function povSVG(){
    const W = 260, H = 340, cx = 130, sp = 50;
    const vis = 1 - Math.pow(2, -8 / 12);
    const uOf = semi => (1 - Math.pow(2, -semi / 12)) / vis;           // 0 cejilla, 1 al final de la vista
    const sc = u => 1 / (1.9 - .9 * u);                                  // lejos ≈ 0,53, cerca 1
    const Y = u => -112 + 430 * sc(u);
    const X = (v, u) => cx + v * sp * sc(u);
    const P = (v, u) => `${X(v, u).toFixed(1)} ${Y(u).toFixed(1)}`;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${opts.width || W}" role="img" aria-label="Mástil del violín como lo ves al tocar, en perspectiva">`;
    s += `<g transform="rotate(7 ${cx} ${H / 2})">`;
    // cuerpo del violín asomando abajo
    s += `<ellipse cx="${cx}" cy="${H + 70}" rx="190" ry="120" fill="var(--la-bg)" stroke="var(--la)" stroke-opacity=".5" stroke-width="2"/>`;
    // clavijero y voluta, al fondo
    const nutY = Y(0) - 26, pw = sp * sc(0) * 1.7;
    s += `<path d="M${cx - pw} ${nutY} L${cx + pw} ${nutY} L${cx + pw * .75} ${nutY - 34} L${cx - pw * .75} ${nutY - 34} Z" fill="var(--la-bg)" stroke="var(--ink)" stroke-opacity=".5"/>`;
    [0, 1, 2, 3].forEach(k => { const y = nutY - 8 - (k % 2) * 13 - (k > 1 ? 4 : 0), left = k % 2 === 0; s += `<rect x="${left ? cx - pw - 16 : cx + pw - 2}" y="${y - 3}" width="18" height="6" rx="3" fill="var(--ebony)"/>`; });
    s += `<circle cx="${cx}" cy="${nutY - 46}" r="12" fill="var(--la-bg)" stroke="var(--ink)" stroke-opacity=".6" stroke-width="1.5"/><circle cx="${cx}" cy="${nutY - 46}" r="5" fill="none" stroke="var(--ink)" stroke-opacity=".6" stroke-width="1.5"/>`;
    // diapasón en perspectiva
    s += `<path d="M${P(-2.2, 0)} L${P(2.2, 0)} L${P(2.4, 1.15)} L${P(-2.4, 1.15)} Z" fill="var(--ebony)"/>`;
    s += `<path d="M${P(-2.25, 0)} L${P(2.25, 0)} L${P(2.25, .02)} L${P(-2.25, .02)} Z" fill="var(--gut)" stroke="var(--gut)" stroke-width="3"/>`;
    if(opts.tapes !== false) [2, 4, 5, 7].forEach(st => { const u = uOf(st); s += `<line x1="${X(-2.1, u)}" x2="${X(2.1, u)}" y1="${Y(u)}" y2="${Y(u)}" stroke="var(--ebony-ink)" stroke-opacity=".28" stroke-width="${3 * sc(u)}"/>`; });
    PP.STRINGS.forEach((name, i) => {
      const v = (i - 1.5) * 1.1;
      s += `<line x1="${X(v, 0)}" y1="${Y(0)}" x2="${X(v * 1.05, 1.15)}" y2="${Y(1.15)}" stroke="var(--${PP.STRING_CLASS[name]})" stroke-width="${(3.4 - i * .55)}" stroke-opacity=".9"/>`;
      s += `<text x="${X(v * 1.02, .99)}" y="${Y(.99)}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--${PP.STRING_CLASS[name]})">${PP.strName(name)}</text>`;
    });
    ids.forEach(id => {
      const n = PP.NOTES[id]; if(!n || n.pos === 'pos3') return;
      const v = (PP.STRINGS.indexOf(n.s) - 1.5) * 1.1;
      if(n.f === 0){ s += noteG(n, X(v, 0), Y(0) - 15, 11, 10); return; }
      const u = uOf(n.semi), k = sc(u);
      s += noteG(n, X(v, u), Y(u), 2 + 15 * k, 4 + 9 * k);
    });
    s += `</g>`;
    s += `<text x="${W - 6}" y="14" text-anchor="end" font-size="10" fill="var(--muted)">la voluta, al fondo</text>`;
    return s + '</svg>';
  }
  const api = {
    mark(id, color){ state.marks[id] = color; const c = el.querySelector(`.bnote[data-id="${id}"] circle`); if(c){ c.style.fill = color; } },
    reset(){ state.marks = {}; el.querySelectorAll('.bnote circle').forEach(c => c.style.fill = ''); },
    light(id){ state.lit = id; el.querySelectorAll('.bnote').forEach(g => { const on = g.dataset.id === id; g.querySelector('circle').style.fill = on ? `var(--${PP.STRING_CLASS[PP.NOTES[g.dataset.id].s]})` : (state.marks[g.dataset.id] || ''); }); }
  };
  render();
  return api;
};

/* ---------- Chuleta del mástil: disponible en todas las páginas ---------- */
PP.openSheet = function(){
  document.dispatchEvent(new CustomEvent('pp:chuleta'));
  let shade = document.querySelector('[data-sheet-shade]'), dr = document.querySelector('[data-sheet]');
  if(!dr){
    shade = document.createElement('div'); shade.className = 'shade'; shade.dataset.sheetShade = ''; shade.hidden = true;
    dr = document.createElement('aside'); dr.className = 'drawer sheet'; dr.dataset.sheet = ''; dr.hidden = true;
    dr.setAttribute('role', 'dialog'); dr.setAttribute('aria-modal', 'true'); dr.setAttribute('aria-labelledby', 'sheetTitle');
    document.body.appendChild(shade); document.body.appendChild(dr);
    shade.addEventListener('click', PP.closeSheet);
    document.addEventListener('keydown', e => { if(e.key === 'Escape' && !dr.hidden) PP.closeSheet(); });
  }
  const POOLS = [['alto', 'Dedo 2 alto'], ['bajo', 'Dedo 2 bajo'], ['cuarto', 'Con cuarto dedo']];
  let pool = PP.store.get('sheet-pool', 'alto'), sel = null, ordered = [];
  dr.innerHTML = `<div class="drawer-head"><div style="display:grid;gap:2px"><span class="muted small">Primera posición</span><h2 id="sheetTitle">Chuleta del mástil</h2></div>
      <button class="btn small primary" type="button" data-sheet-close>Cerrar</button></div>
    <div class="drawer-body">
      <div class="row between"><div class="seg" role="group" aria-label="Notas">${POOLS.map(([k, t]) => `<button type="button" data-sp="${k}">${t}</button>`).join('')}</div>
        <div class="seg" role="group" aria-label="Nombres"><button type="button" data-sl="0">Do Re Mi</button><button type="button" data-sl="1">C D E</button></div></div>
      <div class="sheet-map"><div class="scroll" data-sheet-staff></div>
        <p class="sheet-info" data-sheet-info aria-live="polite">Pulsa una nota en el pentagrama, en los mástiles o en la tabla: suena y se ilumina en los tres sitios.</p></div>
      <div class="sheet-boards"><figure><figcaption>De frente</figcaption><div data-b1></div></figure><figure><figcaption>Al tocar, desde la mentonera</figcaption><div data-b2></div></figure></div>
      <div class="table-wrap" data-sheet-table></div>
      <p class="small muted">Dedo 2 alto: pegado al 3 (Fa♯, Do♯, Sol♯). Dedo 2 bajo: pegado al 1 (Fa, Do, Sol). El cuarto dedo suena igual que la cuerda al aire siguiente.</p>
      <details class="sheet-signs"><summary>Signos del arco y de expresión</summary>${PP.signTable()}</details>
    </div>`;
  let b1, b2;
  const draw = () => {
    dr.querySelectorAll('[data-sp]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sp === pool)));
    dr.querySelectorAll('[data-sl]').forEach(b => b.setAttribute('aria-pressed', String(PP.useLetters() === (b.dataset.sl === '1'))));
    const ids = [...new Set([...PP.POOLS.open, ...PP.POOLS[pool]])];
    b1 = PP.board(dr.querySelector('[data-b1]'), {notes:ids, label:'name', view:'frente', toggle:false, width:230, onPick:show});
    b2 = PP.board(dr.querySelector('[data-b2]'), {notes:ids, label:'name', view:'pov', toggle:false, width:240, onPick:show});
    const notes = ids.map(id => PP.NOTES[id]);
    ordered = notes.slice().sort((a, b) => a.m - b.m || a.d - b.d);
    const stEl = dr.querySelector('[data-sheet-staff]');
    stEl.innerHTML = PP.staff(ordered.map(n => ({id:n.id, dur:'w'})), {G:11, spacing:46, clickable:true, color:true, names:true, fingers:true, label:'Pentagrama con todas las notas'});
    PP.bindStaff(stEl, g => show(PP.NOTES[g.dataset.id]));
    const fing = pool === 'cuarto' ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
    dr.querySelector('[data-sheet-table]').innerHTML = `<table><thead><tr><th>Cuerda</th>${fing.map(f => `<th>${f === 0 ? 'Al aire' : 'Dedo ' + f}</th>`).join('')}</tr></thead><tbody>${PP.STRINGS.map(st => `<tr><td><span class="str ${PP.STRING_CLASS[st]}">${PP.strName(st)}</span></td>${fing.map(f => { const n = notes.find(x => x.s === st && x.f === f); return `<td>${n ? `<button type="button" class="linkish" data-sn="${n.id}">${PP.name(n)}</button>` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
    dr.querySelectorAll('[data-sn]').forEach(b => b.addEventListener('click', () => show(PP.NOTES[b.dataset.sn])));
    if(sel && ids.indexOf(sel.id) >= 0) show(sel, true);
  };
  function show(n, quiet){
    sel = n; b1.light(n.id); b2.light(n.id);
    const stEl = dr.querySelector('[data-sheet-staff]'), idx = ordered.findIndex(x => x.id === n.id);
    PP.lightStaff(stEl, idx);
    const g = stEl.querySelector(`[data-i="${idx}"] .nh`);
    if(g){ const x = +g.getAttribute('cx'); stEl.scrollTo({left:Math.max(0, x - stEl.clientWidth / 2), behavior:'smooth'}); }
    dr.querySelector('[data-sheet-info]').innerHTML = `<span><b>${PP.name(n)}</b>: cuerda <span class="str ${PP.STRING_CLASS[n.s]}">${PP.strName(n.s)}</span>, ${PP.fingerText(n)}. En el pentagrama está ${PP.where ? PP.where(n) : ''}.</span>`;
    if(!quiet) PP.play(n.m, 1);
  }
  dr.querySelectorAll('[data-sp]').forEach(b => b.addEventListener('click', () => { pool = b.dataset.sp; PP.store.set('sheet-pool', pool); draw(); }));
  dr.querySelectorAll('[data-sl]').forEach(b => b.addEventListener('click', () => { PP.store.set('letras', b.dataset.sl === '1'); draw(); }));
  dr.querySelector('[data-sheet-close]').addEventListener('click', PP.closeSheet);
  draw();
  PP._sheetFocus = document.activeElement;
  shade.hidden = false; dr.hidden = false; document.body.style.overflow = 'hidden';
  dr.querySelector('[data-sheet-close]').focus();
};
PP.closeSheet = function(){
  const dr = document.querySelector('[data-sheet]'), sh = document.querySelector('[data-sheet-shade]');
  if(dr) dr.hidden = true; if(sh) sh.hidden = true;
  const other = document.querySelector('[data-drawer]');
  document.body.style.overflow = other && !other.hidden ? 'hidden' : '';
  if(PP._sheetFocus && document.contains(PP._sheetFocus)) PP._sheetFocus.focus();
};
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-chuleta]').forEach(b => b.addEventListener('click', () => PP.openSheet()));
});
})();
