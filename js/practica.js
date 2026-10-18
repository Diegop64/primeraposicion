/* Primera Posición: repertorio ampliado, ejercicios nuevos y panel de práctica */
(function(){
'use strict';
const PP = window.PP, EX = PP.EX, S = PP.parseSong;
const $ = (s, el) => (el || document).querySelector(s);
const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const strTag = s => `<span class="str ${PP.STRING_CLASS[s]}">${PP.strName(s)}</span>`;

/* ---------- Repertorio ampliado (todas las melodías son de dominio público) ---------- */
Object.assign(PP.SONGS, {
  'vals-aire': {t:'Vals de las cuerdas al aire', key:'Do', time:'3/4', bpm:80, notes:S('A4:h E5 A4:h E5 D4:h A4 D4:hd G3:h D4 A4:h E5 A4 E5 A4 A4:hd')},
  'mary': {t:'María tenía un corderito (canción popular)', key:'Re', time:'4/4', bpm:80, notes:S('Fs4 E4 D4 E4 Fs4 Fs4 Fs4:h E4 E4 E4:h Fs4 A4 A4:h Fs4 E4 D4 E4 Fs4 Fs4 Fs4 Fs4 E4 E4 Fs4 E4 D4:w')},
  'hanschen': {t:'Hänschen klein (canción popular alemana)', key:'La', time:'4/4', bpm:84, notes:S('E5 Cs5 Cs5:h D5 B4 B4:h A4 B4 Cs5 D5 E5 E5 E5:h E5 Cs5 Cs5:h D5 B4 B4:h A4 Cs5 E5 E5 Cs5:w B4 B4 B4 B4 B4 Cs5 D5:h Cs5 Cs5 Cs5 Cs5 Cs5 D5 E5:h E5 Cs5 Cs5:h D5 B4 B4:h A4 Cs5 E5 E5 A4:w')},
  'rhody': {t:'Go Tell Aunt Rhody (canción popular)', key:'Re', time:'4/4', bpm:84, notes:S('Fs4:h Fs4 E4 D4:h D4:h E4 E4 G4 Fs4 E4:h D4:h A4:h A4 G4 Fs4:h Fs4:h E4 D4 E4 Fs4 D4:w')},
  'jingle': {t:'Jingle Bells, estribillo (J. L. Pierpont)', key:'Re', time:'4/4', bpm:100, notes:S('Fs4 Fs4 Fs4:h Fs4 Fs4 Fs4:h Fs4 A4 D4 E4 Fs4:w G4 G4 G4 G4 G4 Fs4 Fs4 Fs4 Fs4 E4 E4 Fs4 E4:h A4:h Fs4 Fs4 Fs4:h Fs4 Fs4 Fs4:h Fs4 A4 D4 E4 Fs4:w G4 G4 G4 G4 G4 Fs4 Fs4 Fs4 A4 A4 G4 E4 D4:w')},
  'arpegios': {t:'Arpegios de La mayor y Re mayor', key:'La', time:'4/4', bpm:60, notes:S('A4 Cs5 E5 A5 E5 Cs5 A4:h D4 Fs4 A4 D5 A4 Fs4 D4:h')},
  'canon': {t:'Canon de Pachelbel, tema', key:'Re', time:'4/4', bpm:66, notes:S('Fs5:h E5:h D5:h Cs5:h B4:h A4:h B4:h Cs5:h D5:h Cs5:h B4:h A4:h G4:h Fs4:h G4:h E4:h D4:w')},
  'clair': {t:'Au clair de la lune (canción popular francesa)', key:'Sol', time:'4/4', bpm:80, notes:S('G4 G4 G4 A4 B4:h A4:h G4 B4 A4 A4 G4:w G4 G4 G4 A4 B4:h A4:h G4 B4 A4 A4 G4:w A4 A4 A4 A4 E4:h E4:h A4 G4 Fs4 E4 D4:w G4 G4 G4 A4 B4:h A4:h G4 B4 A4 A4 G4:w')},
  'minueto': {t:'Minueto en Sol (atribuido a C. Petzold)', key:'Sol', time:'3/4', bpm:88, notes:S('D5 G4:e A4:e B4:e C5:e D5 G4 G4 E5 C5:e D5:e E5:e Fs5:e G5 G4 G4 C5 D5:e C5:e B4:e A4:e B4 C5:e B4:e A4:e G4:e Fs4 G4:e A4:e B4:e G4:e A4:hd D5 G4:e A4:e B4:e C5:e D5 G4 G4 E5 C5:e D5:e E5:e Fs5:e G5 G4 G4 C5 D5:e C5:e B4:e A4:e B4 C5:e B4:e A4:e G4:e A4 B4:e A4:e G4:e Fs4:e G4:hd')},
  'do-mayor': {t:'Escala de Do mayor', key:'Do', time:'4/4', bpm:60, notes:S('C4 D4 E4 F4 G4 A4 B4 C5 B4 A4 G4 F4 E4 D4 C4:h')}
});
const META = {
  'aire-1':['estudio',4], 'aire-2':['estudio',4], 'aire-3':['estudio',6], 'vals-aire':['estudio',6],
  'dedos-la':['estudio',7], 'dedos-mi':['estudio',7], 'mary':['pieza',7], 'hanschen':['pieza',7], 'estrellita':['pieza',7],
  'dedos-re':['estudio',8], 'rhody':['pieza',8], 'jingle':['pieza',8],
  'la-mayor':['escala',9], 're-mayor':['escala',9], 'sol-mayor-1':['escala',9], 'arpegios':['escala',9], 'canon':['pieza',9], 'clair':['pieza',9],
  'alto-bajo':['estudio',10], 'dedo2-bajo':['estudio',10], 'cuarto-dedo':['estudio',10], 'sol-mayor':['escala',10], 'do-mayor':['escala',10],
  'corcheas':['estudio',11], 'ligados':['estudio',11], 'puntillo':['estudio',11], 'martinillo':['pieza',11], 'oda':['pieza',11], 'minueto':['pieza',12]
};
Object.keys(META).forEach(k => { if(PP.SONGS[k]){ PP.SONGS[k].kind = META[k][0]; PP.SONGS[k].mod = META[k][1]; } });

/* Melodía aleatoria por grados, útil para varios ejercicios */
const KEY_POOLS = {
  'La': ['A4','B4','Cs5','D5','E5','Fs5','Gs5','A5'],
  'Re': ['D4','E4','Fs4','G4','A4','B4','Cs5','D5'],
  'Sol': ['G3','A3','B3','C4','D4','E4','Fs4','G4','A4','B4','C5','D5']
};
PP.genMelody = function(key, bars){
  const P = KEY_POOLS[key].map(id => PP.NOTES[id]).sort((a, b) => a.m - b.m);
  let idx = Math.floor(P.length / 3) + Math.floor(Math.random() * 3); const out = [];
  for(let b = 0; b < bars; b++){
    let left = 4;
    while(left > 0){
      const dur = (b === bars - 1 && left === 2) ? 'h' : (left >= 2 && Math.random() < .2 ? 'h' : 'q');
      idx = Math.max(0, Math.min(P.length - 1, idx + pick([-1, -1, 1, 1, -2, 2, 0])));
      out.push({id:P[idx].id, dur}); left -= PP.BEATS[dur];
    }
  }
  return {items:out, P};
};

function scoreLine(key){
  const s = PP.stat.get(key);
  return { html:`<div class="score"><span>Aciertos <b data-ok>0</b></span><span>Racha <b data-streak>0</b></span><span>Mejor racha <b data-best>${s.best}</b></span></div>`,
    ok:0, streak:0,
    hit(root){ this.ok++; this.streak++; const st = PP.stat.update(key, s => { s.ok++; s.tries++; if(this.streak > s.best) s.best = this.streak; }); this.paint(root, st); },
    miss(root){ this.streak = 0; const st = PP.stat.update(key, s => { s.tries++; }); this.paint(root, st); },
    paint(root, st){ $('[data-ok]', root).textContent = this.ok; $('[data-streak]', root).textContent = this.streak; $('[data-best]', root).textContent = st.best; } };
}
const playSeq = (items, bpm, gap) => { const spb = 60 / (bpm || 80); let p = 0; items.forEach(it => { if(!it.rest) PP.play(PP.NOTES[it.id].m, PP.BEATS[it.dur] * spb * (gap || .88), .08 + p * spb, {vol:.18}); p += PP.BEATS[it.dur]; }); return p * spb; };

/* ---------- Dictado: escucha y elige la partitura ---------- */
EX['dictado'] = function(root){
  const ps = PP.poolSelect(root, 'dictado', ['open','la_mi','re_la','sol_re','alto','naturales','mezcla','todas'], root.dataset.pool || 'la_mi', () => next());
  let len = +(root.dataset.len || 1), target = null, opts = [], done = false;
  const sc = scoreLine('dictado');
  root.innerHTML = `<div class="ex-head"><h3>Dictado: ¿qué has oído?</h3><span class="ex-kind">Oído</span></div>
    <p class="small muted">Escucha y elige la partitura que corresponde. Si dudas, cántalo antes de elegir.</p>
    <div class="row between"><div class="row">${ps.html}
      <div class="seg" role="group" aria-label="Longitud"><button type="button" data-len="1">Una nota</button><button type="button" data-len="3">Tres notas</button></div></div>${sc.html}</div>
    <div class="row"><button class="btn primary" data-hear type="button">Escuchar</button><button class="btn" data-next type="button">Otro dictado</button></div>
    <div data-opts style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px"></div>
    <p class="feedback" data-fb aria-live="polite"></p>`;
  const segs = () => { root.querySelectorAll('[data-len]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.len === len))); };
  const key = it => it.map(x => x.id).join(' ');
  function motif(P){
    if(len === 1) return [{id:pick(P).id, dur:'q'}];
    const ord = P.slice().sort((a, b) => a.m - b.m); let i = Math.floor(Math.random() * ord.length); const out = [];
    for(let k = 0; k < 3; k++){ out.push({id:ord[i].id, dur:k === 2 ? 'h' : 'q'}); i = Math.max(0, Math.min(ord.length - 1, i + pick([-2, -1, 1, 2]))); }
    return out;
  }
  function next(){
    const P = PP.pool(ps.value); done = false; $('[data-fb]', root).textContent = '';
    target = motif(P);
    const set = [target], keys = new Set([key(target)]); let guard = 0;
    const want = len === 1 ? Math.min(4, P.length) : 3;
    while(set.length < want && guard++ < 80){
      let m;
      if(len === 1) m = [{id:pick(P).id, dur:'q'}];
      else { m = target.map(x => ({...x})); const ord = P.slice().sort((a, b) => a.m - b.m); const k = Math.floor(Math.random() * 3); const j = ord.findIndex(n => n.id === m[k].id); m[k].id = ord[Math.max(0, Math.min(ord.length - 1, j + pick([-1, 1, 2, -2])))].id; }
      if(!keys.has(key(m))){ keys.add(key(m)); set.push(m); }
    }
    opts = shuffle(set);
    $('[data-opts]', root).innerHTML = opts.map((o, i) => `<button type="button" data-o="${i}" style="border:1px solid var(--rule);background:var(--paper);border-radius:12px;padding:6px;display:grid;justify-items:center;gap:2px"><span class="small muted">Opción ${'ABCD'[i]}</span>${PP.staff(o.map(x => ({...x, dur:len === 1 ? 'w' : x.dur})), {G:len === 1 ? 9 : 8, spacing:len === 1 ? 46 : 34})}</button>`).join('');
    root.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => answer(b)));
    setTimeout(() => playSeq(target, 72), 150);
  }
  function answer(b){
    if(done) return; done = true;
    const o = opts[+b.dataset.o], right = key(o) === key(target);
    root.querySelectorAll('[data-o]').forEach(x => { if(key(opts[+x.dataset.o]) === key(target)) x.style.borderColor = 'var(--ok)', x.style.background = 'var(--ok-bg)'; });
    const names = target.map(x => PP.name(PP.NOTES[x.id])).join(', ');
    if(right){ sc.hit(root); $('[data-fb]', root).innerHTML = `<span class="ok">Muy bien.</span> Era ${names}.`; setTimeout(() => { if(done) next(); }, 1700); }
    else { b.style.borderColor = 'var(--bad)'; b.style.background = 'var(--bad-bg)'; sc.miss(root); $('[data-fb]', root).innerHTML = `<span class="bad">No era esa.</span> Era ${names}. Escúchalo otra vez comparando con la partitura correcta.`; }
  }
  root.querySelectorAll('[data-len]').forEach(b => b.addEventListener('click', () => { len = +b.dataset.len; segs(); next(); }));
  $('[data-hear]', root).addEventListener('click', () => target && playSeq(target, 72));
  $('[data-next]', root).addEventListener('click', next);
  ps.bind(); segs(); next();
};

/* ---------- Completa el compás ---------- */
const FIGS = {w:{b:4, t:'Redonda'}, hd:{b:3, t:'Blanca con puntillo'}, h:{b:2, t:'Blanca'}, q:{b:1, t:'Negra'}, e:{b:.5, t:'Corchea'}};
function figSVG(k){
  const x = 26, y = 34, hollow = k === 'w' || k === 'h' || k === 'hd';
  let s = `<svg viewBox="0 0 60 50" width="60" height="50" aria-hidden="true"><ellipse cx="${x}" cy="${y}" rx="7" ry="5" transform="rotate(-22 ${x} ${y})" fill="${hollow ? 'none' : 'var(--ink)'}" stroke="var(--ink)" stroke-width="${hollow ? 2.2 : 0}"/>`;
  if(k !== 'w') s += `<line x1="${x + 6.4}" x2="${x + 6.4}" y1="${y - 2}" y2="${y - 30}" stroke="var(--ink)" stroke-width="1.6"/>`;
  if(k === 'e') s += `<path d="M${x + 6.4} ${y - 30} q 3 13 13 20 q -3 -6 -13 -12" fill="var(--ink)"/>`;
  if(k === 'hd') s += `<circle cx="${x + 13}" cy="${y - 2}" r="2" fill="var(--ink)"/>`;
  return s + '</svg>';
}
EX['completa-compas'] = function(root){
  let level = +(root.dataset.level || 1), bar = [], gap = 0, done = false;
  const sc = scoreLine('completa' + level);
  root.innerHTML = `<div class="ex-head"><h3>Completa el compás</h3><span class="ex-kind">Ritmo</span></div>
    <p class="small muted">Cada compás de 4/4 tiene que sumar 4 pulsos. Suma lo que ya hay y elige la figura que falta en el hueco.</p>
    <div class="row between"><div class="seg" role="group" aria-label="Nivel"><button type="button" data-lv="1">Nivel 1</button><button type="button" data-lv="2">Nivel 2</button></div>${sc.html}</div>
    <div class="scroll" data-staff></div>
    <div class="opts" data-opts></div>
    <p class="feedback" data-fb aria-live="polite"></p>
    <div class="row"><button class="btn small" data-next type="button">Otro compás</button><button class="btn small" data-hear type="button">Escuchar el compás completo</button></div>`;
  const segs = () => root.querySelectorAll('[data-lv]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.lv === level)));
  function gen(){
    const set = level === 1 ? [['h', 2], ['q', 1], ['q', 1], ['qr', 1]] : [['h', 2], ['q', 1], ['hd', 3], ['ee', 1], ['qr', 1]];
    let ok = false, guard = 0;
    while(!ok && guard++ < 100){
      bar = []; let left = 4, rests = 0;
      while(left > 0){ const o = pick(set); if(o[1] > left) continue; if(o[0] === 'qr'){ if(rests) continue; rests++; bar.push({rest:true, dur:'q'}); }
        else if(o[0] === 'ee'){ bar.push({id:'A4', dur:'e'}, {id:'A4', dur:'e'}); } else bar.push({id:'A4', dur:o[0]}); left -= o[1]; }
      const cand = bar.map((it, i) => i).filter(i => !bar[i].rest && bar[i].dur !== 'e');
      if(cand.length && bar.length > 1){ gap = pick(cand); ok = true; }
    }
    done = false; $('[data-fb]', root).textContent = '';
    $('[data-staff]', root).innerHTML = PP.staff(bar, {G:12, time:'4/4', spacing:64, final:true, proportional:true});
    const g = $(`[data-staff] [data-i="${gap}"]`, root), h = g.querySelector('.nh'), cx = +h.getAttribute('cx');
    const G = 12, top = G * 4.2;
    g.innerHTML = `<rect x="${cx - 18}" y="${top - G * .8}" width="36" height="${G * 5.6}" rx="6" fill="var(--la-bg)" stroke="var(--la)" stroke-dasharray="5 4" stroke-width="2"/><text x="${cx}" y="${top + G * 2.5}" text-anchor="middle" font-size="22" font-weight="800" fill="var(--la)">?</text>`;
    const figs = level === 1 ? ['w', 'h', 'q'] : ['w', 'hd', 'h', 'q', 'e'];
    $('[data-opts]', root).innerHTML = figs.map(k => `<button type="button" data-f="${k}" style="display:grid;justify-items:center;gap:0;font-size:.95rem">${figSVG(k)}<span>${FIGS[k].t}</span></button>`).join('');
    root.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => answer(b)));
  }
  function answer(b){
    if(done) return; done = true;
    const need = PP.BEATS[bar[gap].dur], got = FIGS[b.dataset.f].b, right = Math.abs(need - got) < 1e-6;
    root.querySelectorAll('[data-f]').forEach(x => { if(Math.abs(FIGS[x.dataset.f].b - need) < 1e-6) x.classList.add('right'); });
    const pl = v => String(v).replace('.', ',') + (v === 1 ? ' pulso' : ' pulsos');
    const sum = bar.map((it, i) => i === gap ? '?' : String(PP.BEATS[it.dur]).replace('.', ',')).join(' + ');
    if(right){ sc.hit(root); $('[data-fb]', root).innerHTML = `<span class="ok">Exacto.</span> ${sum} = 4, así que ${need === 1 ? 'faltaba' : 'faltaban'} ${pl(need)}.`; setTimeout(() => { if(done) gen(); }, 2200); }
    else { b.classList.add('wrong'); sc.miss(root); $('[data-fb]', root).innerHTML = `<span class="bad">No cuadra.</span> ${sum} = 4. ${need === 1 ? 'Faltaba' : 'Faltaban'} ${pl(need)} y ${FIGS[b.dataset.f].t.toLowerCase()} dura ${pl(got)}.`; }
  }
  $('[data-hear]', root).addEventListener('click', () => { for(let k = 0; k < 4; k++) PP.click(.08 + k * .75, k === 0); playSeq(bar, 80); });
  $('[data-next]', root).addEventListener('click', gen);
  root.querySelectorAll('[data-lv]').forEach(b => b.addEventListener('click', () => { level = +b.dataset.lv; segs(); gen(); }));
  segs(); gen();
};

/* ---------- Encuentra el error ---------- */
EX['encuentra-error'] = function(root){
  const keys = (root.dataset.keys || 'La,Re,Sol').split(',');
  let key = keys[0], items = [], wrong = [], k = 0, done = false;
  const sc = scoreLine('error');
  root.innerHTML = `<div class="ex-head"><h3>Encuentra el error</h3><span class="ex-kind">Oído y lectura</span></div>
    <p class="small muted">Lo que suena tiene una nota distinta de lo que está escrito. Sigue la partitura con el dedo mientras escuchas y pulsa la nota que no coincide.</p>
    <div class="row between"><div class="seg" role="group" aria-label="Tonalidad">${keys.map(x => `<button type="button" data-k="${x}">${x} mayor</button>`).join('')}</div>${sc.html}</div>
    <div class="scroll" data-staff></div>
    <div class="row"><button class="btn primary" data-hear type="button">Escuchar</button><button class="btn" data-next type="button">Otro ejercicio</button><button class="btn" data-orig type="button" hidden>Escuchar lo escrito</button></div>
    <p class="feedback" data-fb aria-live="polite"></p>`;
  const segs = () => root.querySelectorAll('[data-k]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === key)));
  function gen(){
    const g = PP.genMelody(key, 2); items = g.items;
    k = 1 + Math.floor(Math.random() * (items.length - 2));
    const j = g.P.findIndex(n => n.id === items[k].id);
    let alt = j + pick([-1, 1]); if(alt < 0) alt = 1; if(alt >= g.P.length) alt = g.P.length - 2;
    wrong = items.map((x, i) => i === k ? {...x, id:g.P[alt].id} : x);
    done = false; $('[data-fb]', root).textContent = ''; $('[data-orig]', root).hidden = true;
    $('[data-staff]', root).innerHTML = PP.staff(items, {G:11, spacing:48, key, time:'4/4', clickable:true, final:true});
    PP.bindStaff($('[data-staff]', root), g2 => answer(+g2.dataset.i));
    setTimeout(() => playSeq(wrong, 76), 200);
  }
  function answer(i){
    if(done) return;
    const h = $(`[data-staff] [data-i="${i}"] .nh`, root);
    if(i === k){
      done = true; sc.hit(root);
      if(h){ if(h.getAttribute('fill') === 'none') h.style.stroke = 'var(--ok)'; else h.style.fill = 'var(--ok)'; }
      $('[data-fb]', root).innerHTML = `<span class="ok">Lo has encontrado.</span> Estaba escrito ${PP.name(PP.NOTES[items[k].id])} y sonó ${PP.name(PP.NOTES[wrong[k].id])}.`;
      $('[data-orig]', root).hidden = false;
    } else {
      sc.miss(root);
      if(h){ h.style.fill = 'var(--bad)'; setTimeout(() => { h.style.fill = ''; }, 700); }
      $('[data-fb]', root).innerHTML = `<span class="bad">Esa nota sonó bien.</span> Escucha otra vez y fíjate en las notas que suben o bajan de forma distinta a la partitura.`;
    }
  }
  root.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { key = b.dataset.k; segs(); gen(); }));
  $('[data-hear]', root).addEventListener('click', () => playSeq(wrong, 76));
  $('[data-orig]', root).addEventListener('click', () => playSeq(items, 76));
  $('[data-next]', root).addEventListener('click', gen);
  segs(); gen();
};

/* ---------- Reto de 60 segundos ---------- */
EX['reto-60'] = function(root){
  const ps = PP.poolSelect(root, 'reto', PP.READ_POOLS, root.dataset.pool || 'naturales', () => { if(timer) stop(false); best(); });
  let cur = null, ok = 0, bad = 0, end = 0, timer = 0;
  root.innerHTML = `<div class="ex-head"><h3>Reto de 60 segundos</h3><span class="ex-kind">Velocidad de lectura</span></div>
    <p class="small muted">Nombra todas las notas que puedas en un minuto. Los fallos no restan, pero te frenan: mejor seguro que rápido.</p>
    <div class="row between">${ps.html}<p class="best" data-best></p></div>
    <div class="row between"><button class="btn primary" data-go type="button">Empezar el reto</button><p style="font-family:var(--f-display);font-size:2.2rem;font-weight:800;font-variant-numeric:tabular-nums" data-t>1:00</p></div>
    <div class="progress"><i data-bar style="width:100%;background:var(--la)"></i></div>
    <div class="scroll center" data-staff></div><div class="opts" data-opts></div>
    <p class="feedback" data-fb aria-live="polite"></p>`;
  const best = () => { const s = PP.stat.get('reto-' + ps.value); $('[data-best]', root).textContent = s.best ? `Tu récord aquí: ${s.best} notas` : 'Aún sin récord'; };
  function next(){
    const P = PP.pool(ps.value); let n; do{ n = pick(P); }while(cur && n.id === cur.id && P.length > 1); cur = n;
    $('[data-staff]', root).innerHTML = PP.staff([{id:n.id, dur:'w'}], {G:13, spacing:80, minWidth:220});
    const names = [...new Set(P.map(PP.name))];
    const opts = shuffle([PP.name(n), ...shuffle(names.filter(x => x !== PP.name(n))).slice(0, 3)]);
    $('[data-opts]', root).innerHTML = opts.map(o => `<button type="button">${o}</button>`).join('');
    root.querySelectorAll('[data-opts] button').forEach(b => b.addEventListener('click', () => {
      if(!timer) return;
      if(b.textContent === PP.name(cur)){ ok++; next(); }
      else { bad++; b.classList.add('wrong'); root.querySelectorAll('[data-opts] button').forEach(x => { if(x.textContent === PP.name(cur)) x.classList.add('right'); }); setTimeout(next, 450); }
      $('[data-fb]', root).textContent = `Aciertos: ${ok}   Fallos: ${bad}`;
    }));
  }
  function stop(final){
    clearInterval(timer); timer = 0; $('[data-go]', root).textContent = 'Empezar otra vez';
    if(!final) return;
    $('[data-opts]', root).innerHTML = ''; $('[data-staff]', root).innerHTML = '';
    const prev = PP.stat.get('reto-' + ps.value).best;
    PP.stat.update('reto-' + ps.value, s => { s.tries++; if(ok > s.best) s.best = ok; });
    $('[data-fb]', root).innerHTML = `<span class="${ok > prev ? 'ok' : ''}" style="font-weight:700">${ok} notas en un minuto${ok > prev ? ', ¡nuevo récord!' : '.'}</span> Fallos: ${bad}. ${bad > ok / 4 ? 'Hay bastantes fallos: la próxima vez ve un poco más despacio.' : 'Buena precisión.'}`;
    PP.pluck(ok > prev ? 81 : 69); best();
  }
  $('[data-go]', root).addEventListener('click', () => {
    if(timer){ stop(false); return; }
    ok = 0; bad = 0; end = performance.now() + 60000; $('[data-fb]', root).textContent = ''; $('[data-go]', root).textContent = 'Parar';
    next();
    timer = setInterval(() => { const left = Math.max(0, end - performance.now()); $('[data-t]', root).textContent = `0:${String(Math.ceil(left / 1000)).padStart(2, '0')}`.replace('0:60', '1:00'); $('[data-bar]', root).style.width = (left / 600) + '%'; if(left <= 0) stop(true); }, 100);
  });
  root._dispose = () => clearInterval(timer);
  ps.bind(); best();
};

/* ---------- ¿Qué tonalidad es? ---------- */
EX['tonalidad'] = function(root){
  const K = {
    'Do': {acc:'sin alteraciones', fingers:'Dedo 2 bajo en Re, La y Mi (Fa, Do y Sol naturales).', scale:'do-mayor'},
    'Sol': {acc:'Fa♯', fingers:'Dedo 2 alto en la cuerda Re (Fa♯); bajo en La y Mi (Do y Sol naturales).', scale:'sol-mayor-1'},
    'Re': {acc:'Fa♯ y Do♯', fingers:'Dedo 2 alto en Re y La (Fa♯ y Do♯); bajo en Mi (Sol natural).', scale:'re-mayor'},
    'La': {acc:'Fa♯, Do♯ y Sol♯', fingers:'Dedo 2 alto en Re, La y Mi (Fa♯, Do♯ y Sol♯).', scale:'la-mayor'}
  };
  let cur = null, done = false;
  const sc = scoreLine('tonalidad');
  root.innerHTML = `<div class="ex-head"><h3>¿Qué tonalidad es?</h3><span class="ex-kind">Armaduras</span></div>
    <div class="row between"><p class="small muted">Mira la armadura y elige la tonalidad mayor.</p>${sc.html}</div>
    <div class="scroll center" data-staff></div><div class="opts" data-opts></div>
    <p class="feedback" data-fb aria-live="polite"></p>
    <div class="row"><button class="btn small" data-next type="button">Otra armadura</button><button class="btn small" data-scale type="button" hidden>Escuchar la escala</button></div>`;
  function next(){
    let k; do{ k = pick(Object.keys(K)); }while(k === cur); cur = k; done = false;
    $('[data-fb]', root).textContent = ''; $('[data-scale]', root).hidden = true;
    $('[data-staff]', root).innerHTML = PP.staff([], {G:14, key:k, minWidth:220});
    $('[data-opts]', root).innerHTML = Object.keys(K).map(x => `<button type="button" data-k="${x}" style="font-size:1.05rem">${x} mayor</button>`).join('');
    root.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
      if(done) return; done = true; const right = b.dataset.k === cur;
      root.querySelectorAll('[data-k]').forEach(x => { if(x.dataset.k === cur) x.classList.add('right'); });
      if(right) sc.hit(root); else { b.classList.add('wrong'); sc.miss(root); }
      $('[data-fb]', root).innerHTML = `<span class="${right ? 'ok' : 'bad'}">${right ? 'Correcto' : 'Era ' + cur + ' mayor'}.</span> Armadura: ${K[cur].acc}. En el violín: ${K[cur].fingers}`;
      $('[data-scale]', root).hidden = false;
    }));
  }
  $('[data-next]', root).addEventListener('click', next);
  $('[data-scale]', root).addEventListener('click', () => playSeq(PP.SONGS[K[cur].scale].notes.slice(0, 8), 110));
  next();
};

/* ---------- Cancionero ---------- */
EX['cancionero'] = function(root){
  const KN = {pieza:'Piezas', estudio:'Estudios', escala:'Escalas'};
  let kind = root.dataset.kind || 'pieza', sel = null;
  const ids = Object.keys(PP.SONGS).filter(k => PP.SONGS[k].kind).sort((a, b) => PP.SONGS[a].mod - PP.SONGS[b].mod || PP.SONGS[a].t.localeCompare(PP.SONGS[b].t));
  root.innerHTML = `<div class="ex-head"><h3>Cancionero</h3><span class="ex-kind">${ids.length} partituras</span></div>
    <p class="small muted">Elige una partitura. Cada una indica desde qué módulo puedes tocarla. Las que hayas completado con el micrófono llevan una marca.</p>
    <div class="row"><div class="seg" role="group" aria-label="Tipo">${Object.entries(KN).map(([k, t]) => `<button type="button" data-kind="${k}">${t}</button>`).join('')}<button type="button" data-kind="all">Todas</button></div></div>
    <div data-list style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px"></div>
    <div data-stage></div>`;
  function list(){
    root.querySelectorAll('[data-kind]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.kind === kind)));
    $('[data-list]', root).innerHTML = ids.filter(id => kind === 'all' || PP.SONGS[id].kind === kind).map(id => {
      const s = PP.SONGS[id], done = PP.stat.get('pieza:' + id).ok > 0;
      return `<button type="button" data-song="${id}" aria-pressed="${id === sel}" style="text-align:left;border:1px solid ${id === sel ? 'var(--ink)' : 'var(--rule)'};background:var(--paper);border-radius:10px;padding:10px 12px;display:grid;gap:2px">
        <b style="font-family:var(--f-display)">${done ? '<span style="color:var(--ok)">✓</span> ' : ''}${s.t}</b><span class="small muted">Módulo ${s.mod}, ${s.key === 'Do' ? 'sin armadura' : s.key + ' mayor'}, ${s.time}</span></button>`; }).join('');
    root.querySelectorAll('[data-list] [data-song]').forEach(b => b.addEventListener('click', () => open(b.dataset.song)));
  }
  function open(id){
    sel = id; list();
    const st = $('[data-stage]', root); PP.unmountAll(st);
    st.innerHTML = `<div data-ex="partitura" data-song="${id}" style="margin-top:8px"></div>`;
    PP.mountAll(st);
    st.firstChild.scrollIntoView({behavior:'smooth', block:'nearest'});
  }
  root.querySelectorAll('[data-kind]').forEach(b => b.addEventListener('click', () => { kind = b.dataset.kind; list(); }));
  root._dispose = () => PP.unmountAll($('[data-stage]', root));
  list();
};

/* ---------- Catálogo para el panel de práctica ---------- */
const C = (m, id, t, type, ex, attrs) => ({m, id:'m' + m + '-' + id, t, type, ex, attrs:attrs || {}});
const P = (m, song, type) => C(m, song, PP.SONGS[song].t, type || (PP.SONGS[song].kind === 'pieza' ? 'Piezas' : PP.SONGS[song].kind === 'escala' ? 'Escalas' : 'Partituras'), 'partitura', {song});
PP.TYPES = ['Lectura', 'Ritmo', 'Oído', 'Mano izquierda', 'Arco y sonido', 'Escalas', 'Partituras', 'Piezas', 'Cuerpo', 'Herramientas'];
PP.CATALOG = [
  C(1,'partes','Partes del violín','Cuerpo','partes-violin'), C(1,'afinador','Afinador','Herramientas','afinador'),
  C(2,'postura','Rutina de postura','Cuerpo','rutina',{rutina:'postura'}),
  C(3,'arco','Rutina de la mano del arco','Arco y sonido','rutina',{rutina:'arco'}),
  C(4,'lab','Laboratorio de sonido','Arco y sonido','lab-sonido'), P(4,'aire-1','Arco y sonido'), P(4,'aire-2','Arco y sonido'),
  C(5,'linea','¿Línea o espacio?','Lectura','linea-espacio'), C(5,'quiz','¿Qué nota es? Todas las notas naturales','Lectura','quiz-nota',{pool:'naturales'}),
  C(5,'dictado','Dictado de notas','Oído','dictado',{pool:'naturales'}), C(5,'reto','Reto de 60 segundos','Lectura','reto-60',{pool:'naturales'}),
  C(6,'figuras','Escucha cada figura','Ritmo','figuras',{count:'4'}), C(6,'palmas','Palmas, nivel 1','Ritmo','palmas',{levels:'1'}),
  C(6,'completa','Completa el compás','Ritmo','completa-compas',{level:'1'}), P(6,'aire-3','Ritmo'), P(6,'vals-aire','Ritmo'), C(6,'metro','Metrónomo','Herramientas','metronomo'),
  C(7,'explora','Explora las cuerdas La y Mi','Mano izquierda','explorador',{pool:'la_mi', title:'Cuerdas La y Mi'}), P(7,'dedos-la','Mano izquierda'), P(7,'dedos-mi','Mano izquierda'),
  C(7,'asoc','Asociación: La, Mi y Re','Lectura','asociacion',{pools:'la_mi,re_la,sol_re'}), C(7,'dictado','Dictado en La y Mi','Oído','dictado',{pool:'la_mi'}),
  C(7,'mic','Toca la nota (La y Mi)','Oído','toca-nota',{pool:'la_mi'}), P(7,'mary'), P(7,'hanschen'), P(7,'estrellita'),
  C(8,'explora','Mapa de la primera posición','Mano izquierda','explorador',{pool:'alto', start:'B3', title:'Primera posición'}), C(8,'ref','Partitura de referencia','Lectura','referencia',{pool:'alto'}),
  C(8,'quiz','¿Qué nota es?','Lectura','quiz-nota',{pool:'alto'}), C(8,'asoc','Asociación con las cuatro cuerdas','Lectura','asociacion',{pools:'alto,sol_re,re_la,la_mi'}),
  C(8,'reto','Reto de 60 segundos','Lectura','reto-60',{pool:'alto'}), C(8,'mic','Toca la nota (todas)','Oído','toca-nota',{pool:'alto'}),
  C(8,'error','Encuentra el error','Oído','encuentra-error',{keys:'Re,La'}), P(8,'dedos-re','Mano izquierda'), P(8,'rhody'), P(8,'jingle'),
  P(9,'la-mayor'), P(9,'re-mayor'), P(9,'sol-mayor-1'), P(9,'arpegios'), C(9,'tonalidad','¿Qué tonalidad es?','Lectura','tonalidad'),
  C(9,'vista','Lectura a primera vista','Lectura','primera-vista',{keys:'La,Re'}), P(9,'canon'), P(9,'clair'),
  P(10,'alto-bajo','Mano izquierda'), P(10,'dedo2-bajo','Mano izquierda'), C(10,'asoc','Asociación con dedo 2 bajo','Lectura','asociacion',{pools:'bajo,mezcla'}),
  C(10,'quiz','¿Qué nota es? Alto y bajo','Lectura','quiz-nota',{pool:'mezcla'}), C(10,'reto','Reto de 60 segundos: todas las notas','Lectura','reto-60',{pool:'todas'}), P(10,'sol-mayor'), P(10,'do-mayor'),
  C(10,'cuarto','Explora el cuarto dedo','Mano izquierda','explorador',{pool:'cuarto', start:'A4f', title:'Con cuarto dedo'}), P(10,'cuarto-dedo','Mano izquierda'),
  C(10,'error','Encuentra el error en Sol','Oído','encuentra-error',{keys:'Sol,Re'}),
  C(11,'figuras','Todas las figuras','Ritmo','figuras'), C(11,'palmas','Palmas, nivel 2','Ritmo','palmas',{levels:'2,1'}), C(11,'completa','Completa el compás, nivel 2','Ritmo','completa-compas',{level:'2'}),
  P(11,'puntillo','Ritmo'), P(11,'corcheas','Ritmo'), P(11,'ligados','Arco y sonido'), P(11,'martinillo'), P(11,'oda'),
  C(12,'cancionero','Cancionero completo','Piezas','cancionero',{kind:'all'}), P(12,'minueto'),
  C(12,'vista','Lectura a primera vista con corcheas','Lectura','primera-vista',{keys:'La,Re,Sol', eighths:'1'}),
  C(12,'dictado','Dictado de tres notas','Oído','dictado',{pool:'alto', len:'3'}), C(12,'error','Encuentra el error','Oído','encuentra-error',{keys:'La,Re,Sol'})
];

/* ---------- Panel de práctica ---------- */
PP.panel = function(){
  const root = $('[data-panel]'); if(!root) return;
  let type = PP.store.get('panel-type', 'Todo');
  const recent = () => PP.store.get('recent', []);
  const exStat = it => {
    const a = it.attrs;
    if(it.ex === 'partitura') return PP.stat.get('pieza:' + a.song).ok ? 'completada' : '';
    if(it.ex === 'rutina'){ const d = PP.store.get('rut-' + a.rutina, []); return d.length ? d.length + (d.length > 1 ? ' días' : ' día') : ''; }
    if(it.ex === 'palmas'){ const s = PP.stat.get('palmas' + a.levels.split(',')[0]); return s.best ? s.best + ' %' : ''; }
    if(it.ex === 'reto-60'){ const b = Math.max(...PP.READ_POOLS.map(p => PP.stat.get('reto-' + p).best)); return b ? 'récord ' + b : ''; }
    const map = {'quiz-nota':'quiz-' + (PP.store.get('pool:quiz', a.pool)), 'linea-espacio':'linea-espacio', 'asociacion':'asoc', 'dictado':'dictado', 'completa-compas':'completa' + a.level, 'encuentra-error':'error', 'tonalidad':'tonalidad', 'partes-violin':'partes'};
    if(map[it.ex]){ const s = PP.stat.get(map[it.ex]); return s.best ? 'racha ' + s.best : ''; }
    return '';
  };
  function render(){
    const chips = ['Todo', ...PP.TYPES];
    $('[data-chips]', root).innerHTML = chips.map(t => `<button type="button" data-type="${t}" aria-pressed="${t === type}">${t}</button>`).join('');
    root.querySelectorAll('[data-type]').forEach(b => b.addEventListener('click', () => { type = b.dataset.type; PP.store.set('panel-type', type); render(); }));
    const rec = recent().map(id => PP.CATALOG.find(c => c.id === id)).filter(Boolean);
    $('[data-recent]', root).innerHTML = rec.length ? `<p class="muted small">Seguir practicando</p><div class="row" style="gap:8px">${rec.map(it => `<button class="btn small" type="button" data-open="${it.id}">${it.t}</button>`).join('')}</div>` : '';
    let html = '';
    PP.LEVELS.forEach(lv => {
      html += `<div class="pn-level"><h2 class="pn-level-t">Nivel ${lv.n}: ${lv.t}</h2><div class="pn-grid">`;
      PP.MODULES.filter(m => m.lv === lv.n).forEach(m => {
        const items = PP.CATALOG.filter(c => c.m === m.n && (type === 'Todo' || c.type === type));
        const p = PP.modProgress(m.n);
        html += `<section class="pn-mod${items.length ? '' : ' empty'}" aria-labelledby="pnm${m.n}">
          <header><span class="mod-n${p === 1 ? ' full' : ''}">${m.n}</span><div><h3 id="pnm${m.n}">${m.t}</h3><a class="small" href="${PP.modFile(m.n)}">Ver la lección</a></div></header>
          <div class="progress" title="Objetivos del módulo"><i style="width:${p * 100}%"></i></div>
          <ul>${items.map(it => { const st = exStat(it); return `<li><button type="button" data-open="${it.id}"><span>${it.t}</span><small>${it.type}${st ? ', ' + st : ''}</small></button></li>`; }).join('') || '<li class="muted small">Nada de este tipo en este módulo.</li>'}</ul></section>`;
      });
      html += `</div></div>`;
    });
    $('[data-grid]', root).innerHTML = html;
    root.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => open(b.dataset.open)));
    const total = PP.MODULES.filter(m => PP.modProgress(m.n) === 1).length;
    $('[data-sum]', root).textContent = `${PP.CATALOG.length} ejercicios en ${PP.MODULES.length} módulos. ${total ? total + ' módulos completados.' : ''}`;
  }
  const drawer = $('[data-drawer]'), body = $('[data-drawer-body]'), shade = $('[data-shade]');
  let lastFocus = null;
  function open(id){
    const it = PP.CATALOG.find(c => c.id === id); if(!it) return;
    const m = PP.MODULES[it.m - 1];
    PP.unmountAll(body);
    $('[data-drawer-mod]').innerHTML = `Módulo ${m.n}: ${m.t}`;
    $('[data-drawer-title]').textContent = it.t;
    $('[data-drawer-link]').href = PP.modFile(m.n);
    const el = document.createElement('div'); el.dataset.ex = it.ex;
    Object.entries(it.attrs).forEach(([k, v]) => el.dataset[k] = v);
    if(it.attrs.title === undefined && it.ex !== 'partitura') el.dataset.title = it.t;
    body.innerHTML = ''; body.appendChild(el); PP.mountAll(body);
    lastFocus = document.activeElement;
    drawer.hidden = false; shade.hidden = false; document.body.style.overflow = 'hidden';
    $('[data-close]').focus();
    const r = recent().filter(x => x !== id); r.unshift(id); PP.store.set('recent', r.slice(0, 5));
    try{ history.replaceState(null, '', '#' + id); }catch(e){}
  }
  function close(){
    PP.unmountAll(body); body.innerHTML = '';
    drawer.hidden = true; shade.hidden = true; document.body.style.overflow = '';
    try{ history.replaceState(null, '', location.pathname); }catch(e){}
    render(); if(lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  $('[data-close]').addEventListener('click', close);
  shade.addEventListener('click', close);
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !drawer.hidden) close(); });
  $('[data-random]', root).addEventListener('click', () => {
    const upto = Math.max(PP.store.get('last', 1), ...PP.MODULES.filter(m => PP.modProgress(m.n) > 0).map(m => m.n), 1);
    const pool = PP.CATALOG.filter(c => c.m <= upto && (type === 'Todo' || c.type === type) && c.type !== 'Herramientas');
    open(pick(pool.length ? pool : PP.CATALOG).id);
  });
  render();
  const h = location.hash.slice(1); if(h && PP.CATALOG.some(c => c.id === h)) open(h);
};
document.addEventListener('DOMContentLoaded', () => { if(document.body.dataset.page === 'practicar') PP.panel(); });
})();
