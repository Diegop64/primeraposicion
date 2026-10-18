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

/* items: [{id, dur, label, fing, slur}] o {rest:true, dur}
   opts: G, key ('Re'...), time ('4/4'), names, fingers, letters, spacing, clickable, minWidth, color (colorear por cuerda), hideAcc */
PP.staff = function(items, opts){
  opts = opts || {};
  const G = opts.G || 10, sp = opts.spacing || G * 4.4;
  const top = G * 4.2;                                  // y de la quinta línea (Fa5)
  const yOf = d => top + (10 - d) * G / 2;
  const bottomLine = yOf(2);
  const keyAcc = (KEY_SIG[opts.key] || []);
  let x = G * 1.2;
  const clefX = x; x += G * 3.6;
  const keyX = x; x += keyAcc.length * G * 1.1 + (keyAcc.length ? G * .6 : 0);
  const timeX = x; if(opts.time) x += G * 2.8;
  x += G * 1.2;
  const labelsH = (opts.names ? G * 1.7 : 0) + (opts.fingers ? G * 1.7 : 0);
  let low = yOf(2) + G * .8;
  items.forEach(it => { if(it.rest || !PP.NOTES[it.id]) return; const d = PP.NOTES[it.id].d, y = yOf(d);
    low = Math.max(low, y + G * (d <= 0 ? .9 : .7)); if(it.dur && it.dur !== 'w' && d >= 6) low = Math.max(low, y + G * 3.5); });
  const labBase = low + G * .3;
  const H = labBase + labelsH + G * .7;
  // posiciones x
  const per = opts.time ? +opts.time.split('/')[0] : 0;
  let beat = 0; const xs = [], bars = [];
  items.forEach((it, i) => {
    const b = BEATS[it.dur] || 1;
    xs.push(x + (it.dur === 'e' ? 0 : 0));
    x += sp * (opts.proportional ? Math.max(0.7, Math.sqrt(b)) : (it.dur === 'e' ? 0.75 : 1));
    beat += b;
    if(per && Math.abs(beat - Math.round(beat)) < 1e-6 && Math.round(beat) % per === 0 && i < items.length - 1){ bars.push(x - sp * .35); x += G * .6; }
  });
  const W = Math.max(opts.minWidth || 0, x + G * .8);
  let s = `<svg class="staff-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${opts.label || 'Pentagrama'}">`;
  for(let k = 0; k < 5; k++){ const y = yOf(2 + k * 2); s += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="var(--ink)" stroke-width="${G * .1}"/>`; }
  s += `<line x1="${W - G * .1}" x2="${W - G * .1}" y1="${yOf(10)}" y2="${bottomLine}" stroke="var(--ink)" stroke-width="${opts.final ? G * .45 : G * .12}"/>`;
  if(opts.final) s += `<line x1="${W - G * .75}" x2="${W - G * .75}" y1="${yOf(10)}" y2="${bottomLine}" stroke="var(--ink)" stroke-width="${G * .12}"/>`;
  s += `<text x="${clefX}" y="${bottomLine + G * 1.05}" font-size="${G * 6}" fill="var(--ink)" style="font-family:var(--f-music)">\u{1D11E}</text>`;
  keyAcc.forEach((k, i) => { s += sharp(keyX + i * G * 1.1 + G * .5, yOf(KEY_POS[k]), G); });
  if(opts.time){
    const [a, b] = opts.time.split('/');
    const st = `font-size="${G * 2.75}" font-weight="800" fill="var(--ink)" text-anchor="middle" style="font-family:var(--f-display)"`;
    s += `<text x="${timeX + G}" y="${yOf(6) - G * .08}" ${st}>${a}</text><text x="${timeX + G}" y="${yOf(2) - G * .08}" ${st}>${b}</text>`;
  }
  bars.forEach(bx => { s += `<line x1="${bx}" x2="${bx}" y1="${yOf(10)}" y2="${bottomLine}" stroke="var(--ink)" stroke-width="${G * .12}"/>`; });

  // grupos de corcheas (de dos en dos dentro del pulso)
  const beam = {}; let pos = 0;
  items.forEach((it, i) => {
    if(it.dur === 'e' && !it.rest && items[i + 1] && items[i + 1].dur === 'e' && !items[i + 1].rest && Math.abs(pos % 1) < 1e-6){ beam[i] = i + 1; beam[i + 1] = -1; }
    pos += BEATS[it.dur] || 1;
  });

  const stems = {};
  items.forEach((it, i) => {
    const xx = xs[i];
    if(it.rest){ s += restSVG(it.dur, xx, yOf, G); return; }
    const n = PP.NOTES[it.id]; if(!n) return;
    const y = yOf(n.d);
    const col = opts.color ? `var(--${PP.STRING_CLASS[n.s]})` : 'var(--ink)';
    s += `<g class="${opts.clickable ? 'hit' : ''}" data-i="${i}" data-id="${n.id}"${opts.clickable ? ` tabindex="0" role="button" aria-label="${PP.name(n)}"` : ''}>`;
    if(opts.clickable) s += `<rect x="${xx - sp / 2}" y="0" width="${sp}" height="${H}" fill="transparent"/>`;
    // líneas adicionales
    for(let k = 0; k >= n.d; k -= 2) s += `<line x1="${xx - G * 1.05}" x2="${xx + G * 1.05}" y1="${yOf(k)}" y2="${yOf(k)}" stroke="var(--ink)" stroke-width="${G * .1}"/>`;
    for(let k = 12; k <= n.d; k += 2) s += `<line x1="${xx - G * 1.05}" x2="${xx + G * 1.05}" y1="${yOf(k)}" y2="${yOf(k)}" stroke="var(--ink)" stroke-width="${G * .1}"/>`;
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
    if(it.dur && it.dur !== 'w'){
      let up = n.d < 6;
      if(beam[i] > 0){ const n2 = PP.NOTES[items[beam[i]].id]; up = (n.d + n2.d) / 2 < 6; stems[i] = up; stems[beam[i]] = up; }
      if(beam[i] === -1) up = stems[i];
      const sx = up ? xx + rx * .92 : xx - rx * .92, sy = up ? y - G * 3.4 : y + G * 3.4;
      let ey = sy;
      if(beam[i] > 0){ const n2 = PP.NOTES[items[beam[i]].id]; const y2 = yOf(n2.d); ey = up ? Math.min(y, y2) - G * 3.2 : Math.max(y, y2) + G * 3.2; stems.y = ey; }
      if(beam[i] === -1) ey = stems.y;
      s += `<line x1="${sx}" x2="${sx}" y1="${y + (up ? -G * .2 : G * .2)}" y2="${ey}" stroke="${col}" stroke-width="${G * .12}"/>`;
      if(beam[i] > 0){
        const x2 = xs[beam[i]] + (up ? rx * .92 : -rx * .92);
        s += `<line x1="${sx - G * .06}" x2="${x2 + G * .06}" y1="${ey + (up ? G * .22 : -G * .22)}" y2="${ey + (up ? G * .22 : -G * .22)}" stroke="var(--ink)" stroke-width="${G * .5}"/>`;
      }
      if(it.dur === 'e' && !(i in beam)){
        s += up ? `<path d="M${sx} ${ey} q ${G * .3} ${G * 1.3} ${G * 1.3} ${G * 2} q ${-G * .3} ${-G * .6} ${-G * 1.3} ${-G * 1.2}" fill="${col}"/>`
                : `<path d="M${sx} ${ey} q ${G * .3} ${-G * 1.3} ${G * 1.3} ${-G * 2} q ${-G * .3} ${G * .6} ${-G * 1.3} ${G * 1.2}" fill="${col}"/>`;
      }
    }
    if(it.slur && items[i + 1]){
      const n2 = PP.NOTES[items[i + 1].id], y2 = yOf(n2.d), x2 = xs[i + 1];
      const yy = Math.max(y, y2) + G * 1.4;
      s += `<path d="M${xx} ${y + G} Q ${(xx + x2) / 2} ${yy + G * 1.2} ${x2} ${y2 + G}" fill="none" stroke="var(--ink)" stroke-width="${G * .14}"/>`;
    }
    let ly = labBase;
    if(opts.names){ ly += G * 1.7; s += `<text class="lab" x="${xx}" y="${ly}" text-anchor="middle" font-size="${G * 1.3}" font-weight="700" fill="var(--ink)">${PP.name(n)}</text>`; }
    if(opts.fingers){ ly += G * 1.7; s += `<text x="${xx}" y="${ly}" text-anchor="middle" font-size="${G * 1.15}" fill="var(--${PP.STRING_CLASS[n.s]})" font-weight="700">${n.f === 0 ? '0' : n.f}</text>`; }
    if(it.label) s += `<text x="${xx}" y="${yOf(14) - G * .5}" text-anchor="middle" font-size="${G * 1.1}" fill="var(--muted)">${it.label}</text>`;
    s += `</g>`;
  });
  return s + '</svg>';
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
