/* Primera Posición: ejercicios interactivos.
   Cada ejercicio se monta sobre un elemento con data-ex="tipo". */
(function(){
'use strict';
const PP = window.PP;
const $ = (s, el) => (el || document).querySelector(s);
const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const strTag = s => `<span class="str ${PP.STRING_CLASS[s]}">${PP.strName(s)}</span>`;

function namesToggle(onChange){
  const id = 'nm' + Math.random().toString(36).slice(2, 7);
  const html = `<div class="seg" role="group" aria-label="Nombres de las notas"><button type="button" data-nm="0">Do Re Mi</button><button type="button" data-nm="1">C D E</button></div>`;
  return { html, bind(root){ const sync = () => root.querySelectorAll('[data-nm]').forEach(b => b.setAttribute('aria-pressed', String(PP.useLetters() === (b.dataset.nm === '1'))));
    root.querySelectorAll('[data-nm]').forEach(b => b.addEventListener('click', () => { PP.store.set('letras', b.dataset.nm === '1'); sync(); onChange && onChange(); })); sync(); } };
}
function scoreBox(key){
  const s = PP.stat.get(key);
  return { html:`<div class="score"><span>Aciertos <b data-ok>0</b></span><span>Racha <b data-streak>0</b></span><span>Mejor racha <b data-best>${s.best}</b></span></div>`,
    ok:0, streak:0,
    hit(root){ this.ok++; this.streak++; const st = PP.stat.update(key, s => { s.ok++; s.tries++; if(this.streak > s.best) s.best = this.streak; }); this.paint(root, st); },
    miss(root){ this.streak = 0; const st = PP.stat.update(key, s => { s.tries++; }); this.paint(root, st); },
    paint(root, st){ $('[data-ok]', root).textContent = this.ok; $('[data-streak]', root).textContent = this.streak; $('[data-best]', root).textContent = (st || PP.stat.get(key)).best; } };
}

const EX = PP.EX = {};

/* ---------- 1. ¿Qué nota es? ---------- */
EX['quiz-nota'] = function(root){
  const keys = (root.dataset.pools || 'naturales,todas,alto,mezcla,la_mi,re_la,sol_re,open').split(',');
  const nt = namesToggle(() => next());
  const ps = PP.poolSelect(root, 'quiz', keys, root.dataset.pool || keys[0], () => { sc = scoreBox('quiz-' + ps.value); $('[data-sc]', root).innerHTML = sc.html; cur = null; next(); });
  let sc = scoreBox('quiz-' + ps.value);
  root.innerHTML = `<div class="ex-head"><h3>${root.dataset.title || '¿Qué nota es?'}</h3><span class="ex-kind">Lectura</span></div>
    <div class="row between">${ps.html}${nt.html}</div>
    <div data-sc>${sc.html}</div>
    <div class="scroll center" data-staff></div>
    <div class="opts" data-opts></div>
    <p class="feedback" data-fb aria-live="polite"></p>
    <div class="row"><button class="btn small" data-next type="button">Otra nota</button><button class="btn small" data-hear type="button">Oírla</button></div>`;
  nt.bind(root); ps.bind();
  let cur = null, done = false;
  function next(){
    const p = PP.pool(ps.value); let n; do{ n = pick(p); }while(cur && n.id === cur.id && p.length > 1);
    cur = n; done = false; $('[data-fb]', root).textContent = '';
    $('[data-staff]', root).innerHTML = PP.staff([{id:n.id, dur:'w'}], {G:13, spacing:80, minWidth:240, label:'Nota a identificar'});
    const names = [...new Set(p.map(PP.name))];
    const opts = shuffle([PP.name(n), ...shuffle(names.filter(x => x !== PP.name(n))).slice(0, Math.min(5, names.length - 1))]);
    $('[data-opts]', root).innerHTML = opts.map(o => `<button type="button">${o}</button>`).join('');
    root.querySelectorAll('[data-opts] button').forEach(b => b.addEventListener('click', () => answer(b)));
  }
  function answer(b){
    if(done) return; done = true;
    const right = b.textContent === PP.name(cur);
    root.querySelectorAll('[data-opts] button').forEach(x => { if(x.textContent === PP.name(cur)) x.classList.add('right'); });
    PP.tagNote($('[data-staff] [data-id]', root), cur, right);
    PP.play(cur.m, 0.9);
    const where = PP.where(cur);
    if(right){ sc.hit(root); $('[data-fb]', root).innerHTML = `<span class="ok">Correcto.</span> ${PP.name(cur)} está ${where}. Se toca en la cuerda ${strTag(cur.s)}, ${PP.fingerText(cur)}.`; setTimeout(() => { if(done) next(); }, 1700); }
    else { b.classList.add('wrong'); sc.miss(root); $('[data-fb]', root).innerHTML = `<span class="bad">Era ${PP.name(cur)}.</span> Está ${where}. Cuerda ${strTag(cur.s)}, ${PP.fingerText(cur)}.`; }
  }
  $('[data-next]', root).addEventListener('click', next);
  $('[data-hear]', root).addEventListener('click', () => cur && PP.play(cur.m, 1));
  next();
};

/* Dónde está una nota en el pentagrama, contado desde abajo */
PP.where = function(n){
  const ORD = ['primera','segunda','tercera','cuarta','quinta'], ORDm = ['primer','segundo','tercer','cuarto'];
  const d = n.d;
  if(d >= 2 && d <= 10) return d % 2 === 0 ? `en la ${ORD[(d - 2) / 2]} línea` : `en el ${ORDm[(d - 3) / 2]} espacio`;
  if(d === 1) return 'justo debajo de la primera línea';
  if(d === 11) return 'justo encima de la quinta línea';
  if(d <= 0) return d % 2 === 0 ? `en la ${ORD[-d / 2]} línea adicional de abajo` : `debajo de la ${ORD[(-1 - d) / 2]} línea adicional de abajo`;
  return d % 2 === 0 ? `en la ${ORD[(d - 12) / 2]} línea adicional de arriba` : `encima de la ${ORD[(d - 13) / 2]} línea adicional de arriba`;
};

/* ---------- 2. ¿Línea o espacio? ---------- */
EX['linea-espacio'] = function(root){
  const sc = scoreBox('linea-espacio');
  let range = PP.store.get('le-range', 'todo');
  const pool = () => PP.pool('naturales').filter(n => range === 'dentro' ? n.d >= 2 && n.d <= 10 : true);
  root.innerHTML = `<div class="ex-head"><h3>¿Línea o espacio?</h3><span class="ex-kind">Lectura</span></div>
    <div class="row between"><div class="seg" role="group" aria-label="Rango"><button type="button" data-r="dentro">Dentro del pentagrama</button><button type="button" data-r="todo">Con líneas adicionales</button></div>${sc.html}</div>
    <p class="muted small">Decide si la nota está atravesada por una línea (también las líneas adicionales) o metida en un hueco. Después te digo cuál es.</p>
    <div class="scroll center" data-staff></div>
    <div class="opts" data-opts style="grid-template-columns:repeat(2,minmax(0,1fr))"><button type="button" data-a="l">Línea</button><button type="button" data-a="e">Espacio</button></div>
    <p class="feedback" data-fb aria-live="polite"></p>
    <div class="row"><button class="btn small" data-next type="button">Otra nota</button></div>`;
  let cur = null, done = false;
  const seg = () => root.querySelectorAll('[data-r]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.r === range)));
  function next(){
    const P = pool(); let n; do{ n = pick(P); }while(cur && n.d === cur.d);
    cur = n; done = false; $('[data-fb]', root).textContent = '';
    root.querySelectorAll('[data-opts] button').forEach(b => b.className = '');
    $('[data-staff]', root).innerHTML = PP.staff([{id:n.id, dur:'w'}], {G:13, spacing:80, minWidth:240});
  }
  root.querySelectorAll('[data-opts] button').forEach(b => b.addEventListener('click', () => {
    if(done) return; done = true;
    const line = cur.d % 2 === 0, right = (b.dataset.a === 'l') === line;
    b.classList.add(right ? 'right' : 'wrong');
    PP.tagNote($('[data-staff] [data-id]', root), cur, right);
    const txt = `Está ${PP.where(cur)}${cur.d >= 2 && cur.d <= 10 ? ', contando desde abajo' : ''}: es ${PP.name(cur)}.`;
    if(right){ sc.hit(root); $('[data-fb]', root).innerHTML = `<span class="ok">Bien.</span> ${txt}`; setTimeout(() => { if(done) next(); }, 1700); }
    else { sc.miss(root); $('[data-fb]', root).innerHTML = `<span class="bad">No, es ${line ? 'línea' : 'espacio'}.</span> ${txt}`; }
    PP.play(cur.m, .8);
  }));
  root.querySelectorAll('[data-r]').forEach(b => b.addEventListener('click', () => { range = b.dataset.r; PP.store.set('le-range', range); seg(); next(); }));
  $('[data-next]', root).addEventListener('click', next);
  seg(); next();
};

/* ---------- 3. Asociación pentagrama ↔ mástil ---------- */
EX['asociacion'] = function(root){
  const pools = (root.dataset.pools || 'la_mi,re_la,alto').split(',');
  const PN = {open:'Cuerdas al aire', la_mi:'Cuerdas La y Mi', re_la:'Cuerdas Re y La', sol_re:'Cuerdas Sol y Re', alto:'Las cuatro (dedo 2 alto)', bajo:'Las cuatro (dedo 2 bajo)', mezcla:'Alto y bajo mezclados', cuarto:'Con cuarto dedo', completa:'Todos los dedos y sostenidos'};
  let poolKey = pools[0], mode = 1, target = null, done = false, count = PP.store.get('asoc-contar', false), tIdx = 0;
  const sc = scoreBox('asoc'), nt = namesToggle(() => next());
  root.innerHTML = `<div class="ex-head"><h3>Asociación: pentagrama y mástil</h3><span class="ex-kind">Lectura y mano izquierda</span></div>
    <div class="row between"><div class="seg" role="group" aria-label="Modo"><button type="button" data-mode="1">Del pentagrama al mástil</button><button type="button" data-mode="2">Del mástil al pentagrama</button></div>${nt.html}</div>
    <div class="row between"><div class="seg" role="group" aria-label="Notas">${pools.map(p => `<button type="button" data-pool="${p}">${PN[p]}</button>`).join('')}</div>${sc.html}</div>
    <div class="row"><button type="button" class="btn small" data-count aria-pressed="false">Contar desde la cuerda al aire</button></div>
    <div class="callout tip count-tip" data-count-tip hidden><p class="small"><b>El truco</b>En cada cuerda, sus cuatro notas son cuatro posiciones seguidas del pentagrama. Busca la cuerda al aire que hay debajo de la nota (Sol, Re, La o Mi) y cuenta los escalones, línea, espacio, línea...: cada escalón es un dedo. En el pentagrama, la nota con el color de su cuerda es la cuerda al aire y las grises son los escalones; al responder verás el número de cada escalón.</p></div>
    <div class="split"><div class="center" data-board></div>
      <div style="display:grid;gap:12px;align-content:start;min-width:0"><p data-prompt style="font-family:var(--f-display);font-size:1.25rem;font-weight:700"></p>
      <div class="scroll" data-staff></div><p class="feedback" data-fb aria-live="polite"></p>
      <div class="row"><button class="btn small" data-next type="button">Otra nota</button><button class="btn small" data-hear type="button">Oírla</button><button class="btn small" data-show type="button">Ver la solución</button></div></div></div>`;
  nt.bind(root);
  const seg = (sel, attr, val) => root.querySelectorAll(sel).forEach(b => b.setAttribute('aria-pressed', String(b.dataset[attr] === String(val))));
  let board;
  function next(){
    const p = PP.pool(poolKey); let n; do{ n = pick(p); }while(target && n.id === target.id && p.length > 1);
    target = n; done = false; $('[data-fb]', root).textContent = '';
    board = PP.board($('[data-board]', root), {notes:PP.POOLS[poolKey], label:'finger', width:230, onPick:pickBoard});
    $('[data-count-tip]', root).hidden = !count;
    $('[data-count]', root).setAttribute('aria-pressed', String(count));
    if(mode === 1){
      $('[data-prompt]', root).textContent = count ? 'Cuenta los escalones desde la cuerda al aire y pulsa en el mástil.' : 'Pulsa en el mástil dónde se toca esta nota.';
      if(count){
        // la cuerda al aire de esa nota, los escalones intermedios (en gris) y la nota
        const open = openOf(n), items = [];
        for(let d = open.d; d < n.d; d++){ const st = d === open.d ? open : Object.values(PP.NOTES).find(x => x.d === d && !x.acc && !/f$/.test(x.id)); items.push({id:st.id, dur:'w', under:d - open.d}); }
        items.push({id:n.id, dur:'w', under:n.d - open.d});
        tIdx = items.length - 1;
        $('[data-staff]', root).innerHTML = PP.staff(items, {G:13, spacing:58, minWidth:220});
        // la cuerda al aire, en el color de su cuerda; los escalones, en gris
        root.querySelectorAll('[data-staff] [data-i]').forEach(g => { const i = +g.dataset.i; if(i < tIdx) g.querySelectorAll('.nh').forEach(h => { if(i === 0){ h.style.stroke = `var(--${PP.STRING_CLASS[open.s]})`; h.style.strokeWidth = '3'; } else h.style.opacity = '.32'; }); });
        $('[data-staff]', root).classList.add('steps-hidden');
      } else {
        tIdx = 0;
        $('[data-staff]', root).innerHTML = PP.staff([{id:n.id, dur:'w'}], {G:13, spacing:80, minWidth:220});
      }
    } else {
      $('[data-prompt]', root).innerHTML = `¿Dónde se escribe la nota marcada? Cuerda ${strTag(n.s)}, ${PP.fingerText(n)}.`;
      const ord = p.slice().sort((a, b) => a.m - b.m || a.d - b.d).filter((x, i, arr) => !i || x.m !== arr[i - 1].m || x.d !== arr[i - 1].d);
      $('[data-staff]', root).innerHTML = PP.staff(ord.map(x => ({id:x.id, dur:'q'})), {G:10, spacing:54, clickable:true, hideAcc:false});
      root.querySelectorAll('[data-staff] .nh').forEach(e => e.style.opacity = '.35');
      PP.bindStaff($('[data-staff]', root), g => pickStaff(g));
      board.mark(n.id, `var(--${PP.STRING_CLASS[n.s]})`);
      if(count){ const open = openOf(n), g = $(`[data-staff] [data-id="${open.id}"]`, root);
        if(g && open.id !== n.id){ const h = g.querySelector('.nh'); h.style.opacity = '1'; h.style.fill = `var(--${PP.STRING_CLASS[open.s]})`; } }
    }
  }
  // nombre de la nota, pequeño, al lado de la nota del pentagrama (verde oscuro si aciertas, rojo oscuro si no)
  const openOf = n => Object.values(PP.NOTES).find(x => x.s === n.s && x.f === 0);
  function tag(g, n, ok, text){
    const h = g && g.querySelector('.nh'); if(!h) return;
    const old = g.querySelector('.note-tag'); if(old) old.remove();
    const cx = +h.getAttribute('cx'), cy = +h.getAttribute('cy'), rx = +h.getAttribute('rx'), G = rx / .66;
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('class', 'note-tag ' + (ok == null ? 'ref' : ok ? 'ok' : 'bad'));
    t.setAttribute('x', cx + rx + G * (mode === 1 ? .5 : .3)); t.setAttribute('y', cy + G * .4);
    t.setAttribute('font-size', G * (mode === 1 ? 1.15 : .95)); t.setAttribute('font-weight', '700');
    t.textContent = text || PP.name(n); g.appendChild(t);
  }
  const staffNote = id => mode === 1 ? $(`[data-staff] [data-i="${tIdx}"]`, root) : $(`[data-staff] [data-id="${id}"]`, root);
  const revealSteps = () => { const st = $('[data-staff]', root); if(st) st.classList.remove('steps-hidden'); };
  const stepText = () => { if(!count) return ''; const o = openOf(target), k = target.d - o.d; if(target.acc && k !== target.f){ const nat = Object.values(PP.NOTES).find(x => x.s === target.s && x.d === target.d && !x.acc);
      return ` Está en el sitio de ${nat ? PP.name(nat) : 'la nota natural'} (${k} ${k === 1 ? 'escalón' : 'escalones'} desde ${PP.name(o)} al aire), pero el sostenido la sube medio tono: dedo ${target.f} ${target.pos || ''}.`; }
    return k === 0 ? ' Es la cuerda al aire: 0 escalones.' : ` Desde ${PP.name(o)} al aire hay ${k} ${k === 1 ? 'escalón' : 'escalones'}: dedo ${target.f}.`; };
  function result(right, clicked){
    if(mode === 1){ tag(staffNote(target.id), target, right); revealSteps(); }
    if(right){ sc.hit(root); done = true; PP.play(target.m, .9);
      $('[data-fb]', root).innerHTML = `<span class="ok">Eso es.</span> ${PP.name(target)}: cuerda ${strTag(target.s)}, ${PP.fingerText(target)}.${stepText()}`;
      setTimeout(() => { if(done) next(); }, 1500); }
    else { sc.miss(root); PP.play(clicked.m, .6, 0, {vol:.12});
      $('[data-fb]', root).innerHTML = `<span class="bad">Esa es ${PP.name(clicked)}</span> (cuerda ${strTag(clicked.s)}, ${PP.fingerText(clicked)}). Prueba otra vez.${mode === 1 && count ? ' Fíjate en los números de debajo: son los escalones desde la cuerda al aire.' : ''}`; }
  }
  function pickBoard(n){ if(mode !== 1 || done) return; const r = n.id === target.id || (n.m === target.m && n.d === target.d); board.mark(n.id, r ? 'var(--ok)' : 'var(--bad)'); result(r, n); }
  function pickStaff(g){ if(mode !== 2 || done) return; const n = PP.NOTES[g.dataset.id], r = n.m === target.m && n.d === target.d; const h = g.querySelector('.nh'); h.style.opacity = '1'; h.style.fill = r ? 'var(--ok)' : 'var(--bad)'; tag(g, n, r); result(r, n); }
  root.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = +b.dataset.mode; seg('[data-mode]', 'mode', mode); next(); }));
  root.querySelectorAll('[data-pool]').forEach(b => b.addEventListener('click', () => { poolKey = b.dataset.pool; seg('[data-pool]', 'pool', poolKey); next(); }));
  $('[data-next]', root).addEventListener('click', next);
  $('[data-count]', root).addEventListener('click', () => { count = !count; PP.store.set('asoc-contar', count); next(); });
  $('[data-hear]', root).addEventListener('click', () => target && PP.play(target.m, 1));
  $('[data-show]', root).addEventListener('click', () => {
    if(!target) return; done = true; PP.play(target.m, 1); sc.miss(root);
    if(mode === 1) board.mark(target.id, 'var(--ok)');
    else { const h = $(`[data-staff] [data-id="${target.id}"] .nh`, root); if(h){ h.style.opacity = '1'; h.style.fill = 'var(--ok)'; } }
    tag(staffNote(target.id), target, true); revealSteps();
    $('[data-fb]', root).innerHTML = `Es ${PP.name(target)}: cuerda ${strTag(target.s)}, ${PP.fingerText(target)}.`;
  });
  seg('[data-mode]', 'mode', 1); seg('[data-pool]', 'pool', poolKey);
  next();
};

/* ---------- 4. Explorador del mástil ---------- */
EX['explorador'] = function(root){
  const poolKey = root.dataset.pool || 'alto';
  const nt = namesToggle(() => draw());
  root.innerHTML = `<div class="ex-head"><h3>${root.dataset.title || 'Explora el mástil'}</h3><span class="ex-kind">Pulsa una nota</span></div>
    <div class="row">${nt.html}</div>
    <div class="split"><div class="center" data-board></div>
    <div style="display:grid;gap:14px;align-content:start;min-width:0">
      <div class="row" style="gap:28px"><div><div class="muted small">Nota</div><b data-n style="font-family:var(--f-display);font-size:2rem"></b></div>
      <div><div class="muted small">Cuerda</div><b data-s style="font-family:var(--f-display);font-size:2rem"></b></div>
      <div><div class="muted small">Dedo</div><b data-f style="font-family:var(--f-display);font-size:2rem"></b></div></div>
      <p data-t class="muted"></p><div class="scroll" data-staff></div></div></div>`;
  nt.bind(root);
  let sel = PP.NOTES[root.dataset.start || 'A4'], board;
  const ord = PP.pool(poolKey).slice().sort((a, b) => a.m - b.m || a.d - b.d);
  function draw(){
    board = PP.board($('[data-board]', root), {notes:PP.POOLS[poolKey], label:'name', width:230, onPick:n => select(n, true)});
    $('[data-staff]', root).innerHTML = PP.staff(ord.map(x => ({id:x.id, dur:null})), {G:10, spacing:34, clickable:true, color:true});
    PP.bindStaff($('[data-staff]', root), g => select(PP.NOTES[g.dataset.id], true));
    select(sel, false);
  }
  function select(n, sound){
    sel = n; board.light(n.id);
    PP.lightStaff($('[data-staff]', root), ord.findIndex(x => x.id === n.id));
    $('[data-n]', root).textContent = PP.name(n);
    $('[data-s]', root).innerHTML = `<span style="color:var(--${PP.STRING_CLASS[n.s]})">${PP.strName(n.s)}</span>`;
    $('[data-f]', root).textContent = n.f;
    const extra = n.f === 0 ? 'Cuerda al aire: no pisas nada.' :
      n.f === 4 ? `Cuarto dedo (meñique). Suena igual que la cuerda ${n.s === 'Sol' ? 'Re' : n.s === 'Re' ? 'La' : 'Mi'} al aire: compáralas.` :
      n.pos === 'alto' ? 'Dedo 2 alto: pegado al dedo 3.' : n.pos === 'bajo' ? (n.f === 1 ? 'Dedo 1 bajo: muy cerca de la cejilla.' : 'Dedo 2 bajo: pegado al dedo 1.') : `Pisa con el dedo ${n.f}.`;
    $('[data-t]', root).textContent = extra;
    if(sound) PP.play(n.m, 1);
  }
  draw();
};

/* ---------- 5. Partitura de referencia (nombres encima) ---------- */
EX['referencia'] = function(root){
  const poolKey = root.dataset.pool || 'alto';
  const nt = namesToggle(() => draw());
  root.innerHTML = `<div class="ex-head"><h3>${root.dataset.title || 'Partitura de referencia'}</h3><span class="ex-kind">Pulsa una nota para oírla</span></div><div class="row">${nt.html}</div><div class="scroll" data-staff></div>
    <p class="small muted">Debajo de cada nota: si está en línea (L) o en espacio (E) y el dedo, con el color de su cuerda.</p>`;
  nt.bind(root);
  function draw(){
    const ord = PP.pool(poolKey).slice().sort((a, b) => a.m - b.m || a.d - b.d);
    const G = 12, sp = 54, maxD = Math.max(...ord.map(n => n.d));
    let svg = PP.staff(ord.map(x => ({id:x.id, dur:'w'})), {G, spacing:sp, clickable:true, fingers:true, color:true});
    // nombres encima de cada nota y L/E debajo
    const tmp = document.createElement('div'); tmp.innerHTML = svg; const el = tmp.firstChild;
    const top = G * 4.2, yOf = d => top + (10 - d) * G / 2;
    el.querySelectorAll('g[data-id]').forEach(g => {
      const n = PP.NOTES[g.dataset.id], x = +g.querySelector('.nh').getAttribute('cx'), y = yOf(n.d);
      const ny = yOf(Math.max(14.6, maxD + 2.4));
      const lab = PP.name(n), w = Math.max(30, lab.length * 9 + 12);
      g.insertAdjacentHTML('beforeend', `<line x1="${x}" x2="${x}" y1="${ny + 7}" y2="${y - G * .6}" stroke="var(--${PP.STRING_CLASS[n.s]})" stroke-opacity=".45" stroke-dasharray="2 3"/><rect x="${x - w / 2}" y="${ny - 14}" width="${w}" height="20" rx="10" fill="var(--paper)" stroke="var(--${PP.STRING_CLASS[n.s]})"/><text class="lab" x="${x}" y="${ny + 1}" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">${lab}</text>
        <text x="${x}" y="${+el.getAttribute('height') + G * 1.1}" text-anchor="middle" font-size="11" fill="var(--muted)">${n.d % 2 === 0 ? 'L' : 'E'}</text>`);
    });
    // desplazar dedos una línea más abajo
        const pad = G * 2.2 + Math.max(0, maxD + 2.4 - 14.6) * G / 2;
    el.setAttribute('height', +el.getAttribute('height') + G * 1.5 + pad);
    const vb = el.getAttribute('viewBox').split(' '); vb[1] = -pad; vb[3] = +vb[3] + G * 1.5 + pad; el.setAttribute('viewBox', vb.join(' '));
    $('[data-staff]', root).innerHTML = ''; $('[data-staff]', root).appendChild(el);
    PP.bindStaff(el, g => { PP.play(PP.NOTES[g.dataset.id].m, 1); PP.lightStaff(el, +g.dataset.i); });
  }
  draw();
};

/* ---------- 6. Palmas: leer y marcar el ritmo ---------- */
EX['palmas'] = function(root){
  const levels = (root.dataset.levels || '1,2').split(',').map(Number);
  let level = levels[0], bpm = +(root.dataset.bpm || 66), items = [], running = false;
  root.innerHTML = `<div class="ex-head"><h3>Palmas: lee y marca el ritmo</h3><span class="ex-kind">Ritmo</span></div>
    <p class="small muted">Pulsa "Empezar". Oirás 4 clics de cuenta atrás y después, sin parar el pulso, marca cada nota pulsando la barra espaciadora o el botón grande. En los silencios no se marca nada.</p>
    <div class="row between"><div class="seg" role="group" aria-label="Nivel">${levels.map(l => `<button type="button" data-lv="${l}">Nivel ${l}</button>`).join('')}</div>
      <label class="field" style="min-width:200px">Velocidad: <span><b data-bpmv>${bpm}</b> pulsos por minuto</span><input type="range" min="50" max="100" step="2" value="${bpm}" data-bpm></label></div>
    <div class="scroll" data-staff></div>
    <div class="row"><button class="btn primary" data-go type="button">Empezar</button><button class="btn" data-listen type="button">Escucharlo primero</button><button class="btn" data-new type="button">Otro ritmo</button></div>
    <button type="button" data-tap style="height:110px;border-radius:14px;border:2px dashed var(--rule);background:var(--soft);font-family:var(--f-display);font-size:1.5rem;font-weight:800">Marca aquí</button>
    <p class="feedback" data-fb aria-live="polite"></p><p class="best" data-best></p>`;
  const seg = () => root.querySelectorAll('[data-lv]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.lv === level)));
  const showBest = () => { const s = PP.stat.get('palmas' + level); $('[data-best]', root).textContent = s.best ? `Tu mejor resultado en el nivel ${level}: ${s.best} %` : ''; };
  function gen(){
    const opts1 = [['w',4],['h',2],['h',2],['q',1],['q',1],['q',1],['qr',1]];
    const opts2 = [['h',2],['q',1],['q',1],['ee',1],['ee',1],['hd',3],['qr',1],['qd',1.5]];
    const bar = () => {
      let left = 4, out = [], rests = 0, guard = 0;
      while(left > 0 && guard++ < 50){
        const o = pick(level === 1 ? opts1 : opts2);
        if(o[1] > left) continue;
        if(o[0] === 'qr' && rests >= 1) continue;
        if(o[0] === 'qd'){ if(left < 2 || (4 - left) % 1 !== 0) continue; out.push({id:'A4', dur:'qd'}, {id:'A4', dur:'e'}); left -= 2; continue; }
        if(o[0] === 'ee'){ out.push({id:'A4', dur:'e'}, {id:'A4', dur:'e'}); left -= 1; continue; }
        if(o[0] === 'qr'){ out.push({rest:true, dur:'q'}); rests++; left -= 1; continue; }
        out.push({id:'A4', dur:o[0]}); left -= o[1];
      }
      return out;
    };
    items = bar().concat(bar());
    $('[data-staff]', root).innerHTML = PP.staff(items, {G:12, time:'4/4', spacing:58, final:true, proportional:true});
    $('[data-fb]', root).textContent = '';
  }
  const onsets = () => { let p = 0; const o = []; items.forEach((it, i) => { if(!it.rest) o.push({i, beat:p}); p += PP.BEATS[it.dur]; }); return o; };
  function schedule(withNotes){
    const c = PP.ac(), spb = 60 / bpm, t0 = c.currentTime + 0.25;
    for(let b = 0; b < 12; b++) PP.click(t0 - c.currentTime + b * spb, b % 4 === 0);
    if(withNotes){ let p = 0; items.forEach(it => { const d = PP.BEATS[it.dur] * spb; if(!it.rest) PP.play(69, Math.max(.15, d * .85), t0 - c.currentTime + (4 + p) * spb, {vol:.16}); p += PP.BEATS[it.dur]; }); }
    return {t0, spb};
  }
  let taps = [], timing = null;
  function tap(){
    if(!running) return;
    const c = PP.ac(); taps.push(c.currentTime - (c.outputLatency || c.baseLatency || 0));
    const pad = $('[data-tap]', root); pad.style.background = 'var(--la-bg)'; setTimeout(() => pad.style.background = 'var(--soft)', 90);
  }
  function start(withNotes){
    if(running) return; running = !withNotes; taps = [];
    timing = schedule(withNotes);
    const fb = $('[data-fb]', root), {t0, spb} = timing;
    if(withNotes){ fb.textContent = 'Escucha y sigue la partitura con los ojos.'; return; }
    fb.textContent = 'Cuenta conmigo: 1, 2, 3, 4...';
    const c = PP.ac();
    const iv = setInterval(() => { const b = Math.floor((c.currentTime - t0) / spb); if(b >= 0 && b < 4) fb.textContent = `Cuenta atrás: ${b + 1}`; else if(b >= 4) fb.textContent = '¡Ahora! Marca cada nota.'; }, 50);
    setTimeout(() => { clearInterval(iv); running = false; evaluate(); }, (t0 - c.currentTime + 12 * spb + .45) * 1000);
  }
  function evaluate(){
    const {t0, spb} = timing, exp = onsets(), used = new Set();
    let pts = 0;
    const res = exp.map(o => {
      const tt = t0 + (4 + o.beat) * spb; let best = -1, bd = 1e9;
      taps.forEach((t, k) => { if(!used.has(k) && Math.abs(t - tt) < bd){ bd = Math.abs(t - tt); best = k; } });
      const err = bd / spb;
      if(best >= 0 && err < .25){ used.add(best); const sgn = taps[best] - tt; const q = err < .12 ? 1 : .6; pts += q; return {i:o.i, q, early:sgn < 0, ms:Math.round(Math.abs(sgn) * 1000)}; }
      return {i:o.i, q:0};
    });
    const extra = taps.length - used.size;
    const pct = Math.max(0, Math.round(100 * (pts - extra * .25) / exp.length));
    const svg = $('[data-staff] svg', root);
    res.forEach(r => { const g = svg.querySelector(`[data-i="${r.i}"] .nh`); if(g){ const col = r.q === 1 ? 'var(--ok)' : r.q > 0 ? 'var(--la)' : 'var(--bad)'; if(g.getAttribute('fill') === 'none') g.setAttribute('stroke', col); else g.setAttribute('fill', col); } });
    const early = res.filter(r => r.q && r.q < 1 && r.early).length, late = res.filter(r => r.q && r.q < 1 && !r.early).length;
    let tip = pct >= 90 ? 'Muy preciso. Sube la velocidad 4 puntos o pasa al siguiente nivel.' : pct >= 80 ? 'Bien. Repite hasta que todas las notas salgan en verde.' : 'Escúchalo primero y cuenta en voz alta: "uno, dos, tres, cuatro".';
    if(early > late && early > 0) tip += ' Tiendes a adelantarte: espera al pulso.'; else if(late > early) tip += ' Tiendes a llegar tarde: prepara la mano antes del pulso.';
    if(extra > 0) tip += ` Has marcado ${extra} vez${extra > 1 ? 'es' : ''} de más, quizá en un silencio o en una nota larga.`;
    $('[data-fb]', root).innerHTML = `<span class="${pct >= 80 ? 'ok' : 'bad'}">${pct} % de precisión.</span> Verde: a tiempo. Ámbar: un poco desplazado. Rojo: no marcado. ${tip}`;
    PP.stat.update('palmas' + level, s => { s.tries++; if(pct > s.best) s.best = pct; });
    showBest();
  }
  root.querySelectorAll('[data-lv]').forEach(b => b.addEventListener('click', () => { level = +b.dataset.lv; seg(); gen(); showBest(); }));
  $('[data-bpm]', root).addEventListener('input', e => { bpm = +e.target.value; $('[data-bpmv]', root).textContent = bpm; });
  $('[data-go]', root).addEventListener('click', () => start(false));
  $('[data-listen]', root).addEventListener('click', () => start(true));
  $('[data-new]', root).addEventListener('click', gen);
  $('[data-tap]', root).addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
  document.addEventListener('keydown', e => { if(e.code === 'Space' && running && document.contains(root)){ e.preventDefault(); tap(); } });
  seg(); gen(); showBest();
};

/* ---------- 7. Laboratorio de sonido ---------- */
EX['lab-sonido'] = function(root){
  root.innerHTML = `<div class="ex-head"><h3>Laboratorio de sonido</h3><span class="ex-kind">Arco</span></div>
    <p class="small muted">Mueve los tres controles como si fueran tu brazo derecho y escucha el resultado. Busca la combinación que da un sonido redondo en cada carril.</p>
    <div class="two">
      <div style="display:grid;gap:14px">
        <label class="field">Punto de contacto: <b data-cpv></b><input type="range" min="1" max="5" step="1" value="3" data-cp></label>
        <label class="field">Velocidad del arco: <b data-spv></b><input type="range" min="0" max="100" value="45" data-sp></label>
        <label class="field">Peso del brazo: <b data-wv></b><input type="range" min="0" max="100" value="55" data-w></label>
        <div class="row"><button class="btn primary" data-play type="button">Escuchar este sonido</button><button class="btn" data-hint type="button">Ajustar el peso por mí</button></div>
      </div>
      <figure class="figure" style="margin:0"><svg viewBox="0 0 320 190" data-fig role="img" aria-label="Vista desde arriba: puente, carriles y diapasón"></svg>
        <figcaption data-res aria-live="polite"></figcaption></figure>
    </div>`;
  const cp = $('[data-cp]', root), sp = $('[data-sp]', root), w = $('[data-w]', root);
  const CPN = ['', 'Carril 1, pegado al puente', 'Carril 2', 'Carril 3, en el medio', 'Carril 4', 'Carril 5, junto al diapasón'];
  const ideal = () => { const c = +cp.value, s = +sp.value / 100; return Math.max(.08, Math.min(.95, (1 - (c - 1) * .19) * (.55 + .45 * s))); };
  function state(){
    const c = +cp.value, s = +sp.value / 100, wt = +w.value / 100, id = ideal(), diff = wt - id;
    let q, text, rough = 0, airy = 0;
    if(diff > .14){ q = 'bad'; rough = Math.min(1, (diff - .1) * 3); text = 'Rasposo y aplastado. Hay demasiado peso para esta velocidad y este carril. Quita peso o mueve el arco más rápido.'; }
    else if(diff < -.14){ q = 'bad'; airy = Math.min(1, (-diff - .1) * 3); text = 'Silbante y débil. El arco patina sobre la cuerda. Añade peso del brazo, o acércate al puente.'; }
    else { q = 'ok'; text = c <= 2 ? 'Sonido limpio y brillante. Cerca del puente hace falta arco más lento y más peso: es el carril del sonido fuerte.' : c >= 4 ? 'Sonido limpio y suave. Cerca del diapasón el arco va más rápido y ligero: es el carril del piano.' : 'Sonido redondo. Este es el carril de trabajo para empezar.'; }
    return {c, s, wt, q, text, rough, airy};
  }
  function paint(){
    const st = state();
    $('[data-cpv]', root).textContent = CPN[st.c];
    $('[data-spv]', root).textContent = st.s < .33 ? 'lenta' : st.s < .66 ? 'media' : 'rápida';
    $('[data-wv]', root).textContent = st.wt < .33 ? 'poco' : st.wt < .66 ? 'medio' : 'mucho';
    const laneY = c => 34 + (c - 1) * 26;
    let svg = `<rect x="10" y="10" width="300" height="14" rx="3" fill="var(--la)"/><text x="160" y="21" text-anchor="middle" font-size="10" fill="var(--paper)" font-weight="700">puente</text>`;
    for(let k = 1; k <= 5; k++) svg += `<rect x="10" y="${laneY(k) - 9}" width="300" height="18" fill="${k === st.c ? (st.q === 'ok' ? 'var(--ok-bg)' : 'var(--bad-bg)') : 'transparent'}"/><text x="4" y="${laneY(k) + 4}" font-size="10" fill="var(--muted)">${k}</text>`;
    svg += `<rect x="10" y="164" width="300" height="18" rx="3" fill="var(--ebony)"/><text x="160" y="177" text-anchor="middle" font-size="10" fill="var(--ebony-ink)">diapasón</text>`;
    [70, 130, 190, 250].forEach((x, i) => { svg += `<line x1="${x}" y1="10" x2="${x}" y2="182" stroke="var(--${['sol','re','la','mi'][i]})" stroke-width="2"/>`; });
    const y = laneY(st.c), thick = 3 + st.wt * 6;
    svg += `<line x1="20" y1="${y}" x2="300" y2="${y}" stroke="var(--ink)" stroke-width="${thick}" stroke-linecap="round"/>`;
    svg += `<path d="M ${300 - 30 - st.s * 40} ${y - 12} l ${30 + st.s * 40} 0 l -8 -5 m 8 5 l -8 5" fill="none" stroke="var(--muted)" stroke-width="1.6"/>`;
    $('[data-fig]', root).innerHTML = svg;
    $('[data-res]', root).innerHTML = `<b style="color:var(--${st.q === 'ok' ? 'ok' : 'bad'})">${st.q === 'ok' ? 'Suena bien.' : 'Suena mal.'}</b> ${st.text}`;
    return st;
  }
  [cp, sp, w].forEach(i => i.addEventListener('input', paint));
  $('[data-play]', root).addEventListener('click', () => { const st = paint(); PP.play(69, 1.6, 0, {vibrato:false, rough:st.rough, airy:st.airy, vol:st.airy ? .1 : .2, bright:st.c <= 2 ? 9 : st.c >= 4 ? -2 : 4, cutoff:st.c >= 4 ? 2500 : undefined, attack:.12}); });
  $('[data-hint]', root).addEventListener('click', () => { w.value = Math.round(ideal() * 100); paint(); });
  paint();
};

/* ---------- 8. Partituras que suenan ---------- */
const S = PP.parseSong;
PP.SONGS = {
  'aire-1': {t:'Cuerdas al aire en negras', key:'Do', time:'4/4', bpm:60, notes:S('A4,mf,M A4 A4 A4 E5 E5 E5 E5 A4 A4 A4 A4 D4 D4 D4 D4 G3 G3 G3 G3 D4 D4 D4 D4 A4 A4 E5 E5 A4:w')},
  'aire-2': {t:'Blancas, redondas y cambios de cuerda', key:'Do', time:'4/4', bpm:60, notes:S('A4:h,MS E5:h A4:h D4:h G3:h D4:h A4:w,TA E5:q,M E5:q A4:h D4:q D4:q G3:h D4:h A4:h A4:w')},
  'aire-3': {t:'Silencios: el arco se para', key:'Do', time:'4/4', bpm:66, notes:S('A4 r A4 r E5 E5 E5 r D4 r D4 r G3 G3 G3 r A4 A4 E5 E5 D4 D4 A4 r')},
  'dedos-la': {t:'Dedos 1 y 2 en la cuerda La', key:'La', time:'4/4', bpm:60, notes:S('A4 B4 A4 B4 A4 B4 Cs5:h A4 B4 Cs5 B4 A4:h r:h Cs5 B4 Cs5 D5 Cs5 B4 A4:h')},
  'dedos-mi': {t:'Dedos 1, 2 y 3 en la cuerda Mi', key:'La', time:'4/4', bpm:60, notes:S('E5 Fs5 Gs5 A5 Gs5 Fs5 E5:h E5 Fs5 E5 Fs5 Gs5:h r:h Gs5 A5 Gs5 Fs5 E5:w')},
  'dedos-re': {t:'Dedos de base en la cuerda Re', key:'Re', time:'4/4', bpm:60, notes:S('D4 E4 Fs4 G4 Fs4 E4 D4:h D4 E4 D4 E4 Fs4:h r:h Fs4 G4 Fs4 E4 D4:w')},
  'la-mayor': {t:'Escala de La mayor', key:'La', time:'4/4', bpm:60, notes:S('A4 B4 Cs5 D5 E5 Fs5 Gs5 A5 Gs5 Fs5 E5 D5 Cs5 B4 A4:h')},
  're-mayor': {t:'Escala de Re mayor', key:'Re', time:'4/4', bpm:60, notes:S('D4 E4 Fs4 G4 A4 B4 Cs5 D5 Cs5 B4 A4 G4 Fs4 E4 D4:h')},
  'sol-mayor-1': {t:'Escala de Sol mayor, una octava', key:'Sol', time:'4/4', bpm:60, notes:S('G3 A3 B3 C4 D4 E4 Fs4 G4 Fs4 E4 D4 C4 B3 A3 G3:h')},
  'sol-mayor': {t:'Escala de Sol mayor, dos octavas', key:'Sol', time:'4/4', bpm:60, notes:S('G3 A3 B3 C4 D4 E4 Fs4 G4 A4 B4 C5 D5 E5 Fs5 G5 Fs5 E5 D5 C5 B4 A4 G4 Fs4 E4 D4 C4 B3 A3 G3:w')},
  'dedo2-bajo': {t:'Dedo 2 bajo en La y Mi', key:'Sol', time:'4/4', bpm:60, notes:S('A4 B4 C5 B4 A4 B4 C5:h E5 Fs5 G5 Fs5 E5 Fs5 G5:h A4 B4 C5 D5 E5 Fs5 G5 A5 G5 Fs5 E5 D5 C5 B4 A4:h')},
  'alto-bajo': {t:'Alto o bajo: Do♯ y Do', key:'Re', time:'4/4', bpm:56, notes:S('A4 B4 Cs5 D5 A4 B4 C5 D5 E5 Fs5 G5 A5 E5 Fs5 Gs5 A5 A4:w')},
  'cuarto-dedo': {t:'Cuarto dedo: compara con la cuerda al aire', key:'Re', time:'4/4', bpm:56, notes:S('D4 E4 Fs4 G4 A4f:h A4:h A4 B4 Cs5 D5 E5f:h E5:h G3 A3 B3 C4 D4f:h D4:h')},
  'corcheas': {t:'Corcheas en cuerdas al aire y dedos', key:'La', time:'4/4', bpm:60, notes:S('A4:e,M A4:e A4:e A4:e A4:h E5:e E5:e E5:e E5:e E5:h A4:e B4:e Cs5:e D5:e E5 E5 D5:e Cs5:e B4:e Cs5:e A4:h')},
  'ligados': {t:'Détaché y ligado de dos notas', key:'La', time:'4/4', bpm:56, notes:S('A4 B4 Cs5 D5 A4~ B4 Cs5~ D5 E5~ Fs5 Gs5~ A5 A5~ Gs5 Fs5~ E5 D5~ Cs5 B4~ A4')},
  'puntillo': {t:'Negra con puntillo y corchea', key:'Re', time:'4/4', bpm:60, notes:S('D4:qd E4:e Fs4:h Fs4:qd G4:e A4:h A4:qd G4:e Fs4 E4 D4:hd r')},
  'estrellita': {t:'Estrellita', key:'La', time:'4/4', bpm:80, notes:S('A4,mf A4 E5 E5 Fs5 Fs5 E5:h D5 D5 Cs5 Cs5 B4 B4 A4:h E5,p E5 D5 D5 Cs5 Cs5 B4:h E5,cresc E5 D5 D5 Cs5 Cs5 B4:h,end A4,mf A4 E5 E5 Fs5 Fs5 E5:h D5,dim D5 Cs5 Cs5 B4 B4 A4:h,end')},
  'oda': {t:'Oda a la alegría (Beethoven)', key:'Re', time:'4/4', bpm:84, notes:S('Fs4,mf Fs4 G4 A4 A4 G4 Fs4 E4 D4 D4 E4 Fs4 Fs4:qd E4:e E4:h Fs4 Fs4 G4 A4 A4 G4 Fs4 E4 D4 D4 E4 Fs4 E4:qd D4:e D4:h E4,p,cresc E4 Fs4 D4 E4 Fs4:e~ G4:e Fs4 D4 E4 Fs4:e~ G4:e Fs4 E4 D4 E4 A3:h,end Fs4,f Fs4 G4 A4 A4 G4 Fs4 E4 D4 D4 E4 Fs4 E4:qd D4:e D4:h')},
  'martinillo': {t:'Martinillo (Frère Jacques)', key:'Re', time:'4/4', bpm:84, notes:S('D4,mf E4 Fs4 D4 D4 E4 Fs4 D4 Fs4 G4 A4:h Fs4 G4 A4:h A4:e B4:e A4:e G4:e Fs4 D4 A4:e B4:e A4:e G4:e Fs4 D4 D4 A3 D4:h D4 A3 D4:h')},
  'clair': {t:'Au clair de la lune', key:'Re', time:'4/4', bpm:80, notes:S('D4 D4 D4 E4 Fs4:h E4:h D4 Fs4 E4 E4 D4:w D4 D4 D4 E4 Fs4:h E4:h D4 Fs4 E4 E4 D4:w E4 E4 E4 E4 B3:h B3:h E4 D4 Cs4 B3 A3:w D4 D4 D4 E4 Fs4:h E4:h D4 Fs4 E4 E4 D4:w')}
};
// Do♯4 en la cuerda Sol (dedo 3 alto) para Au clair de la lune

EX['partitura'] = function(root){
  const songId = root.dataset.song, song = PP.SONGS[songId]; if(!song) return;
  PP.bowing(song.notes, song.time, song.pickup);
  const expr = PP.expression(song.notes);
  let bpm = +(root.dataset.bpm || song.bpm), names = root.dataset.names === '1', fingers = root.dataset.fingers !== '0', bows = PP.store.get('ver-arcos', true), playing = null, follow = null;
  const nt = namesToggle(() => draw());
  const st0 = PP.stat.get('pieza:' + songId);
  root.innerHTML = `<div class="ex-head"><h3>${root.dataset.title || song.t}</h3><span class="ex-kind">${song.key !== 'Do' ? (song.key + ' mayor, ') : ''}compás ${song.time}</span></div>
    <div class="row between"><div class="row"><button class="btn primary" data-play type="button">Escuchar</button><button class="btn" data-along type="button">Tocar con metrónomo</button><button class="btn" data-follow type="button">Seguir con micrófono</button></div>
      <label class="field" style="min-width:190px">Velocidad: <span><b data-bv>${bpm}</b> pulsos por minuto</span><input type="range" min="40" max="132" step="2" value="${bpm}" data-bpm></label></div>
    <div class="row"><div class="seg" role="group" aria-label="Ayudas"><button type="button" data-tg="names">Nombres</button><button type="button" data-tg="fingers">Dedos</button><button type="button" data-tg="bows" title="Arco abajo y arco arriba">Arcos</button></div>${nt.html}</div>
    <div data-lines style="display:grid;gap:6px"></div>
    <div data-legend></div>
    <p class="small muted" data-msg>Pulsa cualquier nota para oírla sola. Los números de debajo son los dedos, en el color de su cuerda.</p>
    <div class="follow-box" data-fbox hidden><div class="row between"><p class="heard" data-fheard>Escuchando...</p><button class="btn small" type="button" data-skip>Saltar esta nota</button></div>${PP.meterHTML()}</div>
    <p class="best" data-pstat>${st0.ok ? `Completada con el micrófono ${st0.ok} ${st0.ok === 1 ? 'vez' : 'veces'}.` : ''}</p>`;
  nt.bind(root);
  const lines = [];
  (function split(){
    const per = +song.time.split('/')[0], barsPerLine = +(root.dataset.bars || 4);
    let beat = 0, start = 0;
    song.notes.forEach((it, i) => { beat += PP.BEATS[it.dur]; if(Math.abs(beat - per * barsPerLine) < 1e-6 || i === song.notes.length - 1){ lines.push({start, end:i + 1}); start = i + 1; beat = 0; } });
  })();
  function draw(){
    const box = $('[data-lines]', root); box.innerHTML = '';
    lines.forEach((ln, k) => {
      const d = document.createElement('div'); d.className = 'scroll';
      d.innerHTML = PP.staff(song.notes.slice(ln.start, ln.end), {G:10, spacing:40, key:song.key, time:k === 0 ? song.time : null, names, fingers, bows, clickable:true, final:k === lines.length - 1});
      d.querySelectorAll('[data-i]').forEach(g => g.dataset.i = +g.dataset.i + ln.start);
      PP.bindStaff(d, g => { const n = PP.NOTES[g.dataset.id]; PP.play(n.m, .8); hl(+g.dataset.i); });
      box.appendChild(d);
    });
    root.querySelectorAll('[data-tg]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tg === 'names' ? names : b.dataset.tg === 'bows' ? bows : fingers)));
    PP.signLegend($('[data-legend]', root), song.notes, bows);
    if(follow) for(let k = 0; k < follow.i; k++) paintDone(k);
  }
  const hl = i => root.querySelectorAll('[data-lines] [data-i]').forEach(g => g.classList.toggle('on', +g.dataset.i === i));
  const paintDone = i => { const h = $(`[data-lines] [data-i="${i}"] .nh`, root); if(h){ if(h.getAttribute('fill') === 'none') h.style.stroke = 'var(--ok)'; else h.style.fill = 'var(--ok)'; } };
  function stop(){ if(playing){ playing.timers.forEach(clearTimeout); playing = null; hl(-1); $('[data-play]', root).textContent = 'Escuchar'; $('[data-along]', root).textContent = 'Tocar con metrónomo'; } }
  function play(along){
    if(playing){ stop(); return; }
    stopFollow();
    const spb = 60 / bpm, per = +song.time.split('/')[0];
    const lead = along ? per : 0, t0 = .15;
    PP.ac();
    playing = {timers:[]};
    (along ? $('[data-along]', root) : $('[data-play]', root)).textContent = 'Parar';
    let p = 0;
    if(along){
      const total = song.notes.reduce((a, it) => a + PP.BEATS[it.dur], 0) + per;
      for(let b = 0; b < total; b++) PP.click(t0 + b * spb, b % per === 0);
      $('[data-msg]', root).textContent = `Escucha ${per} clics de entrada y empieza a tocar. La nota que toca se ilumina.`;
    }
    song.notes.forEach((it, i) => {
      const at = t0 + (lead + p) * spb, d = PP.BEATS[it.dur] * spb;
      const ex = expr[i], hold = along ? 1 : ex.hold;
      if(!it.rest && !along) PP.play(PP.NOTES[it.id].m, d * ex.len * hold, at, {vol:ex.vol});
      playing.timers.push(setTimeout(() => hl(i), at * 1000));
      p += PP.BEATS[it.dur] * hold;
    });
    playing.timers.push(setTimeout(stop, (t0 + (lead + p) * spb + .3) * 1000));
  }
  /* Modo seguir: avanza cuando suena la nota correcta. Para notas repetidas
     espera a que el sonido baje un momento (un nuevo arco). */
  const bowText = it => it.slurIn ? ', en el mismo arco que la anterior' : it.bow === 'd' ? ', arco abajo' : it.bow === 'u' ? ', arco arriba' : '';
  function stopFollow(){
    if(!follow) return;
    cancelAnimationFrame(follow.raf); PP.mic.stop(); follow = null; $('[data-fbox]', root).hidden = true;
    $('[data-follow]', root).textContent = 'Seguir con micrófono'; hl(-1); draw();
  }
  async function startFollow(){
    if(follow){ stopFollow(); return; }
    stop();
    try{ await PP.mic.start(); }
    catch(err){ $('[data-msg]', root).innerHTML = `<span style="color:var(--bad);font-weight:700">No se ha podido usar el micrófono.</span> ${err && err.name === 'NotAllowedError' ? 'Actívalo en el candado de la barra de direcciones y recarga.' : (err.message || '')}`; return; }
    follow = {i:0, raf:0, tr:PP.tracker()};
    $('[data-follow]', root).textContent = 'Parar micrófono'; $('[data-fbox]', root).hidden = false;
    draw(); advance(0);
    loop();
  }
  function advance(i){
    while(i < song.notes.length && song.notes[i].rest) i++;
    follow.i = i;
    if(i >= song.notes.length){
      const st = PP.stat.update('pieza:' + songId, s => { s.ok++; });
      $('[data-msg]', root).innerHTML = `<span style="color:var(--ok);font-weight:700">Pieza completada.</span> Has tocado todas las notas afinadas. Prueba ahora con el metrónomo.`;
      $('[data-pstat]', root).textContent = `Completada con el micrófono ${st.ok} ${st.ok === 1 ? 'vez' : 'veces'}.`;
      const f = follow; follow = null; cancelAnimationFrame(f.raf); PP.mic.stop(); PP.pluck(81); $('[data-follow]', root).textContent = 'Seguir con micrófono'; $('[data-fbox]', root).hidden = true; hl(-1);
      return;
    }
    hl(i);
    const n = PP.NOTES[song.notes[i].id];
    const g = $(`[data-lines] [data-i="${i}"]`, root); if(g && g.scrollIntoView) g.closest('.scroll').scrollLeft = Math.max(0, +g.querySelector('.nh').getAttribute('cx') - 160);
    $('[data-msg]', root).innerHTML = `Nota ${i + 1} de ${song.notes.filter(x => !x.rest).length}: toca <b>${PP.name(n)}</b>, cuerda ${strTag(n.s)}, ${PP.fingerText(n)}${bowText(song.notes[i])}.`;
  }
  /* Avanza en cuanto la nota suena afinada (dos lecturas seguidas, unos 30 ms).
     Si la nota se repite, espera a un nuevo golpe de arco. */
  function loop(){
    if(!follow) return;
    const r = follow.tr.step(), it = song.notes[follow.i], n = PP.NOTES[it.id];
    PP.meter(root, r.level, r.ok);
    const hd = $('[data-fheard]', root);
    if(r.ok){
      const near = Math.round(r.midi), name = (PP.useLetters() ? PP.LETTERS12 : PP.NAMES12)[((near % 12) + 12) % 12];
      const cents = (r.midi - n.m) * 100;
      hd.textContent = Math.abs(cents) <= 45 ? `${name}, bien` : `Oigo ${name}`; hd.className = 'heard' + (Math.abs(cents) <= 45 ? ' ok' : '');
      const prev = song.notes[follow.i - 1], repeat = prev && !prev.rest && PP.NOTES[prev.id].m === n.m;
      if(r.stable && Math.abs(cents) <= 45 && (!repeat || r.fresh)){
        follow.tr.consume(); paintDone(follow.i); advance(follow.i + 1); if(!follow) return;
      }
    } else if(r.level < .15){ hd.textContent = 'Escuchando...'; hd.className = 'heard'; }
    follow.raf = requestAnimationFrame(loop);
  }
  $('[data-skip]', root).addEventListener('click', () => { if(follow){ follow.tr.consume(); advance(follow.i + 1); } });
  $('[data-play]', root).addEventListener('click', () => play(false));
  $('[data-along]', root).addEventListener('click', () => play(true));
  $('[data-follow]', root).addEventListener('click', startFollow);
  $('[data-bpm]', root).addEventListener('input', e => { bpm = +e.target.value; $('[data-bv]', root).textContent = bpm; });
  root.querySelectorAll('[data-tg]').forEach(b => b.addEventListener('click', () => { if(b.dataset.tg === 'names') names = !names; else if(b.dataset.tg === 'bows'){ bows = !bows; PP.store.set('ver-arcos', bows); } else fingers = !fingers; draw(); }));
  root._dispose = () => { stop(); stopFollow(); };
  draw();
};

/* ---------- 9. Toca la nota (micrófono) ---------- */
function needleSVG(){
  let s = `<svg viewBox="0 0 300 120" role="img" aria-label="Indicador de afinación" style="max-width:420px;width:100%">`;
  s += `<path d="M30 100 A120 120 0 0 1 270 100" fill="none" stroke="var(--rule)" stroke-width="14" stroke-linecap="round"/>`;
  s += `<path d="M131 25 A120 120 0 0 1 169 25" fill="none" stroke="var(--ok)" stroke-width="14"/>`;
  [-50, -25, 0, 25, 50].forEach(c => { const a = (c / 50) * 75 * Math.PI / 180; s += `<text x="${150 + Math.sin(a) * 100}" y="${108 - Math.cos(a) * 100 + 4}" text-anchor="middle" font-size="10" fill="var(--muted)">${c > 0 ? '+' + c : c}</text>`; });
  s += `<line data-needle x1="150" y1="108" x2="150" y2="10" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" style="transform-origin:150px 108px;transition:transform .08s"/><circle cx="150" cy="108" r="6" fill="var(--ink)"/>`;
  return s + `</svg>`;
}
function setNeedle(root, cents){ const n = $('[data-needle]', root); if(!n) return; const c = Math.max(-50, Math.min(50, cents)); n.style.transform = `rotate(${c / 50 * 75}deg)`; n.setAttribute('stroke', Math.abs(cents) <= 15 ? 'var(--ok)' : 'var(--ink)'); }
const MIC_HELP = 'Si no funciona: permite el micrófono en el aviso del navegador, acerca el violín a 30–50 cm del ordenador y toca con arco largo y sonido firme.';

EX['toca-nota'] = function(root){
  const ps = PP.poolSelect(root, 'mic', ['la_mi','re_la','sol_re','alto','mezcla','cuarto','todas'], root.dataset.pool || 'alto', () => next());
  const passed = new Set(PP.store.get('mic-ok', []));
  const nt = namesToggle(() => show());
  root.innerHTML = `<div class="ex-head"><h3>Toca la nota escrita</h3><span class="ex-kind">Micrófono y afinación</span></div>
    <p class="small muted">El ordenador te escucha y te dice si la nota está afinada. Mantenla en la zona verde un momento para conseguirla. ${MIC_HELP}</p>
    <div class="row between"><div class="row"><button class="btn primary" data-on type="button">Activar micrófono</button><button class="btn" data-hear type="button">Oír la nota</button><button class="btn" data-skip type="button">Otra nota</button></div>${nt.html}</div>
    <div class="row between">${ps.html}<div class="seg" role="group" aria-label="Exigencia"><button type="button" data-lvl="0">Principiante</button><button type="button" data-lvl="1">Intermedio</button><button type="button" data-lvl="2">Avanzado</button></div></div>
    <div class="two" style="align-items:center"><div style="display:grid;gap:8px"><div class="scroll center" data-staff></div><p data-info class="center"></p></div>
      <div style="display:grid;gap:6px;justify-items:center">${needleSVG()}<p data-heard style="font-family:var(--f-display);font-size:1.5rem;font-weight:700">Sin sonido</p>
        <div class="progress" style="width:min(260px,100%)" title="Mantén la nota afinada hasta llenar la barra"><i data-hold style="width:0"></i></div>
        <p data-fb class="feedback small center" aria-live="polite"></p>${PP.meterHTML()}</div></div>
    <p class="best">Notas distintas conseguidas: <b data-count>${passed.size}</b></p>`;
  nt.bind(root); ps.bind();
  const LV = [{tol:30, hold:220, t:'±30 cents'}, {tol:18, hold:350, t:'±18 cents'}, {tol:10, hold:500, t:'±10 cents'}];
  let lvl = PP.store.get('mic-lvl', 0), tr = PP.tracker(), smooth = null;
  const segL = () => root.querySelectorAll('[data-lvl]').forEach(b => { b.setAttribute('aria-pressed', String(+b.dataset.lvl === lvl)); b.title = LV[+b.dataset.lvl].t; });
  root.querySelectorAll('[data-lvl]').forEach(b => b.addEventListener('click', () => { lvl = +b.dataset.lvl; PP.store.set('mic-lvl', lvl); segL(); }));
  segL();
  let target = null, hold = 0, last = performance.now(), raf = 0, won = false;
  function show(){
    $('[data-staff]', root).innerHTML = PP.staff([{id:target.id, dur:'w'}], {G:13, spacing:80, minWidth:220});
    $('[data-info]', root).innerHTML = `Cuerda ${strTag(target.s)}, ${PP.fingerText(target)}`;
  }
  function next(){ const p = PP.pool(ps.value); let n; do{ n = pick(p); }while(target && n.id === target.id); target = n; hold = 0; won = false; smooth = null; tr.reset(); show(); $('[data-fb]', root).textContent = ''; const h = $('[data-hold]', root); if(h) h.style.width = '0'; }
  function loop(){
    const now = performance.now(), dt = now - last; last = now;
    const r = tr.step(), L = LV[lvl];
    PP.meter(root, r.level, r.ok);
    if(r.ok){
      const near = Math.round(r.midi), nm = (PP.useLetters() ? PP.LETTERS12 : PP.NAMES12)[((near % 12) + 12) % 12];
      $('[data-heard]', root).textContent = nm;
      const cents = (r.midi - target.m) * 100;
      if(Math.abs(cents) < 60){
        smooth = smooth == null ? cents : smooth * .6 + cents * .4;
        setNeedle(root, smooth);
        if(Math.abs(cents) <= L.tol) hold += dt; else hold = Math.max(0, hold - dt * .5);
        $('[data-fb]', root).textContent = Math.abs(cents) <= L.tol ? 'Afinada, mantenla.' : cents > 0 ? 'Un poco alta: baja el dedo hacia la voluta.' : 'Un poco baja: sube el dedo hacia el puente.';
      } else {
        smooth = null; setNeedle(root, cents > 0 ? 50 : -50); hold = Math.max(0, hold - dt);
        const off = Math.round(r.midi - target.m);
        $('[data-fb]', root).textContent = Math.abs(off) === 12 ? 'Es la nota correcta pero en otra octava: revisa la cuerda.' : `Estás tocando ${nm}. Buscamos ${PP.name(target)}.`;
      }
    } else { if(r.level < .15) $('[data-heard]', root).textContent = 'Sin sonido'; hold = Math.max(0, hold - dt * .3); }
    $('[data-hold]', root).style.width = Math.min(100, 100 * hold / L.hold) + '%';
    if(hold >= L.hold && !won){ won = true; passed.add(target.id); PP.store.set('mic-ok', [...passed]); $('[data-count]', root).textContent = passed.size;
      $('[data-fb]', root).innerHTML = `<span class="ok">¡Conseguida! ${PP.name(target)} afinada.</span>`; PP.click(0, true); setTimeout(next, 800); }
    raf = requestAnimationFrame(loop);
  }
  $('[data-on]', root).addEventListener('click', async e => {
    if(raf){ cancelAnimationFrame(raf); raf = 0; PP.mic.stop(); e.target.textContent = 'Activar micrófono'; return; }
    try{ await PP.mic.start(); e.target.textContent = 'Parar micrófono'; last = performance.now(); loop(); }
    catch(err){ $('[data-fb]', root).innerHTML = `<span class="bad">No se ha podido usar el micrófono.</span> ${err && err.name === 'NotAllowedError' ? 'Has bloqueado el permiso: actívalo en el candado de la barra de direcciones y recarga.' : (err.message || '')}`; }
  });
  $('[data-hear]', root).addEventListener('click', () => PP.play(target.m, 1.2));
  $('[data-skip]', root).addEventListener('click', next);
  root._dispose = () => { cancelAnimationFrame(raf); raf = 0; PP.mic.stop(); };
  next();
};

/* ---------- 10. Afinador ---------- */
EX['afinador'] = function(root){
  const OPEN = PP.POOLS.open.map(id => PP.NOTES[id]);
  root.innerHTML = `<div class="ex-head"><h3>Afinador</h3><span class="ex-kind">Micrófono</span></div>
    <p class="small muted">Toca una cuerda al aire con el arco o en pizzicato. La aguja te dice si está alta o baja. Afina primero el La. ${MIC_HELP}</p>
    <div class="two" style="align-items:center"><div style="display:grid;gap:6px;justify-items:center">${needleSVG()}<p data-heard style="font-family:var(--f-display);font-size:2.2rem;font-weight:800">–</p><p data-fb class="small muted center" aria-live="polite">Activa el micrófono para empezar.</p></div>
      <div style="display:grid;gap:12px"><button class="btn primary" data-on type="button">Activar micrófono</button>
      <p class="small muted">Notas de referencia: pulsa una para que suene sin parar y compárala de oído.</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px" data-drones>${OPEN.map(n => `<button class="btn" type="button" data-id="${n.id}" aria-pressed="false" style="display:grid;justify-items:center;gap:0;border-color:var(--${PP.STRING_CLASS[n.s]})"><b style="font-family:var(--f-display);font-size:1.4rem">${PP.name(n)}</b><span class="small muted">${PP.hz(n.m).toFixed(1)} Hz</span></button>`).join('')}</div></div></div>`;
  let raf = 0, hist = [], drone = null, droneBtn = null;
  function loop(){
    const a = PP.mic.analyze();
    if(a.ok){ hist.push(a.midi); if(hist.length > 5) hist.shift(); } else if(a.level < .1) hist = [];
    if(hist.length >= 3){
      const mm = hist.slice().sort((a, b) => a - b)[Math.floor(hist.length / 2)];
      const str = OPEN.reduce((a, b) => Math.abs(b.m - mm) < Math.abs(a.m - mm) ? b : a);
      const cents = (mm - str.m) * 100;
      $('[data-heard]', root).innerHTML = `<span style="color:var(--${PP.STRING_CLASS[str.s]})">${PP.name(str)}</span>`;
      setNeedle(root, cents);
      $('[data-fb]', root).textContent = Math.abs(cents) <= 5 ? 'Afinada.' : Math.abs(cents) > 60 ? 'Muy lejos de una cuerda al aire. ¿Estás pisando algún dedo?' : cents > 0 ? `Alta (${Math.round(cents)} cents). Afloja el tensor girando a la izquierda.` : `Baja (${Math.round(cents)} cents). Tensa el tensor girando a la derecha.`;
    }
    raf = requestAnimationFrame(loop);
  }
  $('[data-on]', root).addEventListener('click', async e => {
    if(raf){ cancelAnimationFrame(raf); raf = 0; PP.mic.stop(); e.target.textContent = 'Activar micrófono'; return; }
    try{ await PP.mic.start(); e.target.textContent = 'Parar micrófono'; loop(); }
    catch(err){ $('[data-fb]', root).innerHTML = `<span style="color:var(--bad);font-weight:700">No se ha podido usar el micrófono.</span> ${err && err.name === 'NotAllowedError' ? 'Has bloqueado el permiso: actívalo en el candado de la barra de direcciones y recarga.' : (err.message || '')}`; }
  });
  root._dispose = () => { cancelAnimationFrame(raf); raf = 0; PP.mic.stop(); if(drone){ drone.stop(); drone = null; } };
  root.querySelectorAll('[data-drones] button').forEach(b => b.addEventListener('click', () => {
    if(drone){ drone.stop(); drone = null; }
    if(droneBtn === b){ b.setAttribute('aria-pressed', 'false'); b.style.background = ''; droneBtn = null; return; }
    root.querySelectorAll('[data-drones] button').forEach(x => { x.setAttribute('aria-pressed', 'false'); x.style.background = ''; });
    b.setAttribute('aria-pressed', 'true'); b.style.background = 'var(--soft)'; droneBtn = b;
    drone = PP.play(PP.NOTES[b.dataset.id].m, 90, 0, {vol:.14, vibrato:false, noMute:true});
  }));
};

/* ---------- 11. Metrónomo ---------- */
EX['metronomo'] = function(root){
  let bpm = PP.store.get('bpm', 60), meter = 4, sub = false, on = false, timer = 0, nextT = 0, beatN = 0, taps = [];
  root.innerHTML = `<div class="ex-head"><h3>Metrónomo</h3><span class="ex-kind">Pulso</span></div>
    <div class="row between"><p style="font-family:var(--f-display);font-size:3.2rem;font-weight:800;line-height:1;font-variant-numeric:tabular-nums"><span data-v>${bpm}</span> <span class="small muted" style="font-family:var(--f-body);font-weight:400">pulsos por minuto</span></p>
      <div class="row" data-dots style="gap:10px"></div></div>
    <div class="row"><button class="btn" data-d="-4" type="button">−4</button><input type="range" min="40" max="160" step="1" value="${bpm}" data-r style="flex:1;min-width:140px" aria-label="Velocidad"><button class="btn" data-d="4" type="button">+4</button></div>
    <div class="row"><button class="btn primary" data-go type="button">Iniciar</button>
      <div class="seg" role="group" aria-label="Compás">${[2,3,4].map(m => `<button type="button" data-m="${m}">${m}/4</button>`).join('')}</div>
      <button class="btn" data-sub type="button" aria-pressed="false">Corcheas</button><button class="btn" data-tap type="button">Marcar tempo</button></div>`;
  const dots = () => { $('[data-dots]', root).innerHTML = Array.from({length:meter}, (_, i) => `<i style="width:20px;height:20px;border-radius:50%;background:var(--rule);display:block" data-b="${i}"></i>`).join(''); };
  const set = v => { bpm = Math.max(40, Math.min(160, Math.round(v))); $('[data-v]', root).textContent = bpm; $('[data-r]', root).value = bpm; PP.store.set('bpm', bpm); };
  const segM = () => root.querySelectorAll('[data-m]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.m === meter)));
  function tick(){
    const c = PP.ac();
    while(nextT < c.currentTime + .12){
      const spb = 60 / bpm, b = beatN % meter, d = nextT - c.currentTime;
      PP.click(Math.max(0, d), b === 0);
      if(sub) PP.click(Math.max(0, d + spb / 2), false);
      setTimeout(() => root.querySelectorAll('[data-b]').forEach(el => el.style.background = +el.dataset.b === b ? (b === 0 ? 'var(--ink)' : 'var(--la)') : 'var(--rule)'), Math.max(0, d * 1000));
      nextT += spb; beatN++;
    }
  }
  $('[data-go]', root).addEventListener('click', e => {
    on = !on; e.target.textContent = on ? 'Parar' : 'Iniciar';
    if(on){ nextT = PP.ac().currentTime + .05; beatN = 0; timer = setInterval(tick, 25); } else { clearInterval(timer); root.querySelectorAll('[data-b]').forEach(el => el.style.background = 'var(--rule)'); }
  });
  $('[data-r]', root).addEventListener('input', e => set(+e.target.value));
  root.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => set(bpm + +b.dataset.d)));
  root.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { meter = +b.dataset.m; beatN = 0; segM(); dots(); }));
  $('[data-sub]', root).addEventListener('click', e => { sub = !sub; e.target.setAttribute('aria-pressed', String(sub)); e.target.style.background = sub ? 'var(--soft)' : ''; });
  $('[data-tap]', root).addEventListener('click', () => { const t = performance.now(); taps = taps.filter(x => t - x < 3000); taps.push(t); if(taps.length >= 3){ const iv = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); set(60000 / iv); } });
  root._dispose = () => { clearInterval(timer); on = false; };
  segM(); dots();
};

/* ---------- 12. Lectura a primera vista ---------- */
EX['primera-vista'] = function(root){
  const KEYS = {
    'La': {pool:['A4','B4','Cs5','D5','E5','Fs5','Gs5','A5'], tonic:['A4','A5'], t:'La mayor (La y Mi)'},
    'Re': {pool:['D4','E4','Fs4','G4','A4','B4','Cs5','D5'], tonic:['D4','D5'], t:'Re mayor (Re y La)'},
    'Sol': {pool:['G3','A3','B3','C4','D4','E4','Fs4','G4','A4','B4','C5','D5'], tonic:['G3','G4'], t:'Sol mayor (Sol, Re y La)'}
  };
  const keys = (root.dataset.keys || 'La,Re,Sol').split(',');
  let key = keys[0], items = [], shown = false, eighths = root.dataset.eighths === '1';
  let count = PP.store.get('pv-count', 0);
  root.innerHTML = `<div class="ex-head"><h3>Lectura a primera vista</h3><span class="ex-kind">Ejercicio nuevo cada vez</span></div>
    <p class="small muted">Antes de tocar: mira la armadura, busca la nota más aguda y la más grave y cuenta el ritmo con los ojos. Toca sin parar aunque falles. Después compara escuchando.</p>
    <div class="row"><div class="seg" role="group" aria-label="Tonalidad">${keys.map(k => `<button type="button" data-k="${k}">${KEYS[k].t}</button>`).join('')}</div></div>
    <div class="scroll" data-staff></div>
    <div class="row"><button class="btn primary" data-new type="button">Nuevo ejercicio</button><button class="btn" data-play type="button">Escuchar cómo suena</button><button class="btn" data-names type="button">Mostrar nombres</button></div>
    <p class="best">Ejercicios leídos: <b data-c>${count}</b></p>`;
  const seg = () => root.querySelectorAll('[data-k]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === key)));
  function gen(){
    const K = KEYS[key], P = K.pool.map(id => PP.NOTES[id]).sort((a, b) => a.m - b.m);
    let idx = P.findIndex(n => n.id === pick(K.tonic)); if(idx < 0) idx = 0;
    items = [];
    for(let bar = 0; bar < 4; bar++){
      let left = 4;
      while(left > 0){
        let dur = 'q';
        const r = Math.random();
        if(bar === 3 && left === 2){ dur = 'h'; }
        else if(left >= 2 && r < .22) dur = 'h';
        else if(eighths && r > .78) dur = 'ee';
        const step = pick([-1, -1, 1, 1, 0, -2, 2, 1, -1]);
        idx = Math.max(0, Math.min(P.length - 1, idx + step));
        if(dur === 'ee'){ items.push({id:P[idx].id, dur:'e'}); idx = Math.max(0, Math.min(P.length - 1, idx + pick([-1, 1]))); items.push({id:P[idx].id, dur:'e'}); left -= 1; }
        else { items.push({id:P[idx].id, dur}); left -= PP.BEATS[dur]; }
      }
    }
    // termina en la tónica más cercana
    const last = items[items.length - 1], tn = K.tonic.map(id => PP.NOTES[id]);
    last.id = tn.reduce((a, b) => Math.abs(b.m - PP.NOTES[last.id].m) < Math.abs(a.m - PP.NOTES[last.id].m) ? b : a).id;
    shown = false; draw();
    count++; PP.store.set('pv-count', count); $('[data-c]', root).textContent = count;
  }
  function draw(){ PP.bowing(items, '4/4'); $('[data-staff]', root).innerHTML = PP.staff(items, {G:11, spacing:46, key, time:'4/4', names:shown, fingers:shown, bows:PP.store.get('ver-arcos', true), final:true}); $('[data-names]', root).textContent = shown ? 'Ocultar nombres' : 'Mostrar nombres'; }
  root.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { key = b.dataset.k; seg(); gen(); }));
  $('[data-new]', root).addEventListener('click', gen);
  $('[data-names]', root).addEventListener('click', () => { shown = !shown; draw(); });
  $('[data-play]', root).addEventListener('click', () => { const spb = 60 / 72; let p = 0; items.forEach(it => { PP.play(PP.NOTES[it.id].m, PP.BEATS[it.dur] * spb * .9, .1 + p * spb, {vol:.17}); p += PP.BEATS[it.dur]; }); });
  seg(); gen(); count--; PP.store.set('pv-count', count); $('[data-c]', root).textContent = count;
};

/* ---------- 13. Partes del violín ---------- */
const PARTS = {
  voluta:{t:'Voluta', d:'La espiral tallada al final del mástil. Es decorativa: no la uses para colgar el violín.'},
  clavijas:{t:'Clavijas', d:'Tensan las cuerdas para la afinación gruesa. Al principio, que las mueva tu profesor o un adulto.'},
  cejilla:{t:'Cejilla', d:'La pieza donde las cuerdas se apoyan antes de entrar al clavijero. Marca el principio de la parte que vibra.'},
  diapason:{t:'Diapasón', d:'La tabla negra (de ébano) sobre la que pisas las cuerdas. No tiene trastes: la afinación la pone tu oído.'},
  cuerdas:{t:'Cuerdas', d:'De la más grave a la más aguda: Sol, Re, La, Mi. Mirando el violín de frente, Sol queda a la izquierda.'},
  puente:{t:'Puente', d:'Transmite la vibración de las cuerdas a la caja. Se sostiene solo por la presión de las cuerdas: revisa que no se incline.'},
  efes:{t:'Efes', d:'Las aberturas con forma de f. Por ellas sale el sonido de la caja de resonancia.'},
  cordal:{t:'Cordal', d:'Donde se sujetan las cuerdas por abajo.'},
  tensores:{t:'Tensores', d:'Tornillos pequeños para la afinación fina. Son los que usarás tú para afinar.'},
  mentonera:{t:'Mentonera', d:'Donde apoyas la mandíbula. Sirve para sujetar el violín sin apretar.'}
};
function violinSVG(){
  const g = (k, inner) => `<g data-part="${k}" style="cursor:pointer">${inner}</g>`;
  return `<svg viewBox="0 0 300 600" role="img" aria-label="Violín visto de frente" style="max-height:560px;width:100%">
  ${g('voluta', `<circle cx="150" cy="30" r="20" fill="var(--la-bg)" stroke="var(--ink)" stroke-width="2"/><circle cx="150" cy="30" r="11" fill="none" stroke="var(--ink)" stroke-width="2"/><circle cx="150" cy="30" r="4" fill="var(--ink)"/>`)}
  ${g('clavijas', `<rect x="139" y="48" width="22" height="50" rx="4" fill="var(--la-bg)" stroke="var(--ink)" stroke-width="2"/>${[56,68,80,92].map((y, i) => i % 2 ? `<rect x="161" y="${y - 4}" width="28" height="8" rx="4" fill="var(--ebony)"/>` : `<rect x="111" y="${y - 4}" width="28" height="8" rx="4" fill="var(--ebony)"/>`).join('')}`)}
  <rect x="140" y="98" width="20" height="150" fill="var(--la-bg)" stroke="var(--ink)" stroke-width="2"/>
  <path d="M150 245 C200 243 246 258 246 300 C246 335 222 352 214 362 C205 372 205 405 214 415 C226 428 262 450 262 500 C262 555 215 578 150 578 C85 578 38 555 38 500 C38 450 74 428 86 415 C95 405 95 372 86 362 C78 352 54 335 54 300 C54 258 100 243 150 245 Z" fill="var(--la-bg)" stroke="var(--ink)" stroke-width="2.5"/>
  ${g('efes', `<path d="M108 392 c-10 6 -4 16 4 10 c-6 22 -6 46 0 70 c-8 -6 -14 4 -4 10" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/><path d="M192 392 c10 6 4 16 -4 10 c6 22 6 46 0 70 c8 -6 14 4 4 10" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>`)}
  ${g('diapason', `<path d="M137 100 L163 100 L171 385 L129 385 Z" fill="var(--ebony)"/>`)}
  ${g('cejilla', `<rect x="135" y="96" width="30" height="7" rx="2" fill="var(--gut)" stroke="var(--ink)" stroke-width="1"/>`)}
  ${g('puente', `<path d="M118 436 L182 436 L178 446 L122 446 Z" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/>`)}
  ${g('cordal', `<path d="M126 470 L174 470 C172 520 166 545 162 560 L138 560 C134 545 128 520 126 470 Z" fill="var(--ebony)"/>`)}
  ${g('tensores', [134, 145, 155, 166].map(x => `<circle cx="${x}" cy="482" r="4.5" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/>`).join(''))}
  ${g('cuerdas', [0, 1, 2, 3].map(i => `<line x1="${144 + i * 4}" y1="100" x2="${134 + i * 10.6}" y2="478" stroke="var(--${['sol','re','la','mi'][i]})" stroke-width="${2.4 - i * .4}"/>`).join('') + `<rect x="130" y="100" width="44" height="370" fill="transparent"/>`)}
  ${g('mentonera', `<path d="M60 520 C70 588 150 600 160 584 C140 590 104 572 96 536 Z" fill="var(--ebony)" opacity=".85"/>`)}
  <g data-callout></g></svg>`;
}
EX['partes-violin'] = function(root){
  root.innerHTML = `<div class="ex-head"><h3>Partes del violín</h3><span class="ex-kind">Conoce tu instrumento</span></div>
    <div class="row"><div class="seg" role="group" aria-label="Modo"><button type="button" data-mode="explore" aria-pressed="true">Explorar</button><button type="button" data-mode="quiz" aria-pressed="false">Ponme a prueba</button></div></div>
    <div class="split" style="grid-template-columns:minmax(200px,300px) 1fr"><div class="center" data-v>${violinSVG()}</div>
    <div style="display:grid;gap:12px;align-content:start;min-width:0" data-side></div></div>`;
  let mode = 'explore', target = null, done = false, streak = 0;
  const svg = $('[data-v] svg', root);
  const hl = k => svg.querySelectorAll('[data-part]').forEach(p => { p.style.filter = p.dataset.part === k ? 'drop-shadow(0 0 4px var(--re)) drop-shadow(0 0 2px var(--re))' : ''; p.style.opacity = !k || p.dataset.part === k ? '1' : '.55'; });
  function explore(){
    $('[data-side]', root).innerHTML = `<p class="muted small">Pulsa una parte del dibujo o un nombre de la lista.</p><div class="row" style="gap:6px">${Object.entries(PARTS).map(([k, p]) => `<button class="btn small" type="button" data-k="${k}">${p.t}</button>`).join('')}</div><div data-desc class="callout" style="min-height:4.5em"></div>`;
    const show = k => { hl(k); $('[data-desc]', root).innerHTML = `<b>${PARTS[k].t}</b>${PARTS[k].d}`; };
    root.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => show(b.dataset.k)));
    svg.querySelectorAll('[data-part]').forEach(p => p.onclick = () => { if(mode === 'explore') show(p.dataset.part); });
    show('puente');
  }
  function quiz(){
    let k; do{ k = pick(Object.keys(PARTS)); }while(k === target);
    target = k; done = false; hl(k);
    const opts = shuffle([k, ...shuffle(Object.keys(PARTS).filter(x => x !== k)).slice(0, 3)]);
    $('[data-side]', root).innerHTML = `<p style="font-family:var(--f-display);font-size:1.2rem;font-weight:700">¿Cómo se llama la parte iluminada?</p><div class="opts">${opts.map(o => `<button type="button" data-o="${o}" style="font-size:1.05rem">${PARTS[o].t}</button>`).join('')}</div><p class="feedback" data-fb aria-live="polite"></p><p class="best">Racha: <b data-s>${streak}</b></p>`;
    root.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => {
      if(done) return; done = true; const right = b.dataset.o === target;
      root.querySelectorAll('[data-o]').forEach(x => { if(x.dataset.o === target) x.classList.add('right'); });
      if(right){ streak++; PP.stat.update('partes', s => { if(streak > s.best) s.best = streak; }); $('[data-fb]', root).innerHTML = `<span class="ok">Correcto.</span> ${PARTS[target].d}`; setTimeout(() => { if(done && mode === 'quiz') quiz(); }, 2200); }
      else { streak = 0; b.classList.add('wrong'); $('[data-fb]', root).innerHTML = `<span class="bad">La respuesta era: ${PARTS[target].t}.</span> ${PARTS[target].d} <button class="btn small" type="button" data-again>Siguiente</button>`; $('[data-again]', root).onclick = quiz; }
      $('[data-s]', root).textContent = streak;
    }));
  }
  root.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; root.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); mode === 'quiz' ? quiz() : explore(); }));
  explore();
};

/* ---------- 14. Rutina guiada con temporizador ---------- */
const ROUTINES = {
  postura: {t:'Rutina de postura (5 minutos)', steps:[
    [30, 'Sacude brazos y hombros', 'De pie, pies al ancho de los hombros. Suelta los brazos y mueve los hombros en círculos.'],
    [45, 'Coloca el violín', 'Violín sobre la clavícula izquierda, mandíbula en la mentonera, voluta a la altura de la nariz.'],
    [30, 'Prueba de soltar', 'Suelta la mano izquierda. El violín se sostiene solo con la cabeza y el hombro. Respira normal.'],
    [30, 'Descansa', 'Baja el violín. Mueve el cuello despacio a un lado y a otro.'],
    [45, 'Mano izquierda', 'Vuelve a colocarlo. Muñeca recta, pulgar suelto frente al dedo 1, mano como si sujetaras una pelota pequeña.'],
    [60, 'Pizzicato lento', 'Pellizca Sol, Re, La, Mi con el índice derecho diciendo el nombre de cada cuerda. Sin mover la postura.'],
    [30, 'Mira al espejo', 'Comprueba: hombros bajos, codo izquierdo debajo del violín, cabeza sin apretar.'],
    [30, 'Descansa y sacude', 'Baja el violín y sacude las manos. Has terminado.']]},
  arco: {t:'Rutina de la mano del arco (5 minutos)', steps:[
    [30, 'Conejito con lápiz', 'Pulgar con medio y anular forman la boca; índice y meñique, las orejas. Coloca el lápiz entre la boca y relaja las orejas.'],
    [45, 'Limpiaparabrisas', 'Lápiz vertical. Muévelo a izquierda y derecha solo con los dedos, como un limpiaparabrisas.'],
    [45, 'Arañita', 'Sube los dedos por el lápiz hasta arriba y bájalos otra vez, sin que se caiga.'],
    [30, 'Descansa', 'Sacude la mano derecha. Comprueba que el pulgar no se ha quedado rígido.'],
    [45, 'Agarre con el arco', 'Mismo agarre en el arco: pulgar doblado entre la nuez y la vara, meñique curvado encima.'],
    [30, 'Arco vertical', 'Sostén el arco en vertical delante de ti. La mano está blanda y redonda.'],
    [60, 'Arco sobre la cuerda La', 'Arcos lentos en la mitad del arco, carril 3. Cuenta 4 pulsos por arco.'],
    [15, 'Fin', 'Sacude la mano. Has terminado.']]}
};
EX['rutina'] = function(root){
  const R = ROUTINES[root.dataset.rutina]; if(!R) return;
  const key = 'rut-' + root.dataset.rutina, days = PP.store.get(key, []);
  const total = R.steps.reduce((a, s) => a + s[0], 0);
  root.innerHTML = `<div class="ex-head"><h3>${R.t}</h3><span class="ex-kind">Temporizador guiado</span></div>
    <p class="small muted">Pulsa "Empezar" y sigue las instrucciones. Sonará un aviso al cambiar de paso.</p>
    <div style="display:grid;gap:8px"><p data-step class="muted small"></p><p data-title style="font-family:var(--f-display);font-size:1.6rem;font-weight:800;line-height:1.15"></p><p data-desc style="max-width:62ch"></p>
    <p data-time style="font-family:var(--f-display);font-size:2.6rem;font-weight:800;font-variant-numeric:tabular-nums;line-height:1"></p><div class="progress"><i data-bar style="width:0"></i></div></div>
    <div class="row"><button class="btn primary" data-go type="button">Empezar</button><button class="btn" data-skip type="button">Saltar paso</button></div>
    <p class="best" data-days></p>`;
  let i = 0, left = R.steps[0][0], timer = 0, elapsed = 0;
  const paintDays = () => { const d = PP.store.get(key, []); $('[data-days]', root).textContent = d.length ? `Rutina completada ${d.length} día${d.length > 1 ? 's' : ''} distinto${d.length > 1 ? 's' : ''}.` : 'Aún no has completado esta rutina.'; };
  function paint(){
    const st = R.steps[i];
    $('[data-step]', root).textContent = `Paso ${i + 1} de ${R.steps.length}`;
    $('[data-title]', root).textContent = st[1]; $('[data-desc]', root).textContent = st[2];
    $('[data-time]', root).textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    $('[data-bar]', root).style.width = (100 * elapsed / total) + '%';
  }
  function go(n){ i = n; if(i >= R.steps.length){ finish(); return; } left = R.steps[i][0]; PP.pluck(i % 2 ? 76 : 69); paint(); }
  function finish(){
    clearInterval(timer); timer = 0; $('[data-go]', root).textContent = 'Empezar otra vez';
    $('[data-title]', root).textContent = 'Rutina completada'; $('[data-desc]', root).textContent = 'Buen trabajo. Hacerla un poco cada día vale más que mucho un solo día.'; $('[data-time]', root).textContent = ''; $('[data-bar]', root).style.width = '100%';
    const today = new Date().toISOString().slice(0, 10), d = PP.store.get(key, []); if(d.indexOf(today) < 0){ d.push(today); PP.store.set(key, d); }
    PP.pluck(81); paintDays(); i = 0; left = R.steps[0][0]; elapsed = 0;
  }
  $('[data-go]', root).addEventListener('click', e => {
    if(timer){ clearInterval(timer); timer = 0; e.target.textContent = 'Continuar'; return; }
    PP.ac(); e.target.textContent = 'Pausa';
    if(i === 0 && elapsed === 0) go(0);
    timer = setInterval(() => { left--; elapsed++; if(left <= 0) go(i + 1); else paint(); }, 1000);
  });
  $('[data-skip]', root).addEventListener('click', () => { elapsed += left; go(i + 1); });
  root._dispose = () => { clearInterval(timer); timer = 0; };
  paint(); paintDays();
};

/* ---------- 15. Figuras rítmicas que suenan ---------- */
EX['figuras'] = function(root){
  const F = [
    {t:'Redonda', b:'4 pulsos', items:[{id:'A4', dur:'w'}], pat:[4]},
    {t:'Blanca', b:'2 pulsos', items:[{id:'A4', dur:'h'}, {id:'A4', dur:'h'}], pat:[2, 2]},
    {t:'Negra', b:'1 pulso', items:[{id:'A4', dur:'q'}, {id:'A4', dur:'q'}, {id:'A4', dur:'q'}, {id:'A4', dur:'q'}], pat:[1, 1, 1, 1]},
    {t:'Silencio de negra', b:'1 pulso sin sonar', items:[{id:'A4', dur:'q'}, {rest:true, dur:'q'}, {id:'A4', dur:'q'}, {rest:true, dur:'q'}], pat:[1, -1, 1, -1]},
    {t:'Blanca con puntillo', b:'3 pulsos', items:[{id:'A4', dur:'hd'}, {id:'A4', dur:'q'}], pat:[3, 1]},
    {t:'Corcheas', b:'medio pulso cada una', items:[{id:'A4', dur:'e'}, {id:'A4', dur:'e'}, {id:'A4', dur:'e'}, {id:'A4', dur:'e'}, {id:'A4', dur:'h'}], pat:[.5, .5, .5, .5, 2]}
  ].slice(0, +(root.dataset.count || 6));
  root.innerHTML = `<div class="ex-head"><h3>Escucha cada figura</h3><span class="ex-kind">Un compás de 4/4 a 60, en la cuerda La</span></div>
    <div style="display:grid;gap:10px">${F.map((f, i) => `<div class="row" style="border-top:1px solid var(--rule);padding-top:10px;gap:16px"><button class="btn small" type="button" data-i="${i}">Escuchar</button><div style="min-width:150px"><b>${f.t}</b><div class="small muted">${f.b}</div></div><div class="scroll" style="flex:1">${PP.staff(f.items, {G:8, time:'4/4', spacing:38, final:true})}</div></div>`).join('')}</div>`;
  root.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => {
    const f = F[+b.dataset.i]; let t = .1;
    for(let k = 0; k < 4; k++) PP.click(.1 + k, k === 0);
    f.pat.forEach(p => { const d = Math.abs(p); if(p > 0) PP.play(69, d * .9, t, {vol:.15}); t += d; });
  }));
};

/* ---------- Montaje ---------- */
PP.unmountAll = function(scope){
  (scope || document).querySelectorAll('[data-ex]').forEach(el => { try{ el._dispose && el._dispose(); }catch(e){} });
};
PP.mountAll = function(scope){
  (scope || document).querySelectorAll('[data-ex]').forEach(el => {
    if(el.dataset.mounted) return; el.dataset.mounted = '1';
    el.classList.add('ex');
    const fn = EX[el.dataset.ex];
    if(fn){ try{ fn(el); }catch(e){ console.error('Ejercicio ' + el.dataset.ex, e); el.innerHTML = '<p class="muted">Este ejercicio no se ha podido cargar.</p>'; } }
  });
};
document.addEventListener('DOMContentLoaded', () => PP.mountAll());
})();
