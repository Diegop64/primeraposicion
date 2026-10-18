/* Primera Posición: módulo de entrenamiento auditivo.
   Los protocolos siguen lo que funcionó en los estudios citados en el módulo 13:
   notas añadidas poco a poco, avance al 90 % sin ayudas, ruido entre notas,
   timbres y octavas variados y práctica extra de la nota más débil. */
(function(){
'use strict';
const PP = window.PP, EX = PP.EX;
const $ = (s, el) => (el || document).querySelector(s);
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const nm12 = pc => (PP.useLetters() ? ['C','C♯','D','E♭','E','F','F♯','G','G♯','A','B♭','B'] : ['Do','Do♯','Re','Mi♭','Mi','Fa','Fa♯','Sol','Sol♯','La','Si♭','Si'])[((pc % 12) + 12) % 12];

/* ---------- Sonidos ---------- */
let master = null;
function out(){ const c = PP.ac(); if(!master){ master = c.createGain(); master.gain.value = .9; master.connect(PP.out()); } return master; }
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
PP.voice = function(m, dur, when, timbre, freq){
  const c = PP.ac(), t = c.currentTime + (when || 0), f = freq || hz(m);
  if(timbre === 'violin') return PP.play(m, dur, when, {freq:f, vibrato:false, vol:.17});
  if(timbre === 'pizz'){ PP.pluck(m, when); return; }
  const g = c.createGain(); g.connect(out());
  const parts = timbre === 'piano' ? [[1, .5], [2, .22], [3, .1], [4, .05]] : [[1, .55], [2, .05]];
  parts.forEach(([k, a]) => { const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.value = f * k; og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + .05); });
  g.gain.setValueAtTime(.0001, t);
  if(timbre === 'piano'){ g.gain.exponentialRampToValueAtTime(.35, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur); }
  else { g.gain.linearRampToValueAtTime(.3, t + .08); g.gain.setValueAtTime(.3, t + Math.max(.1, dur - .12)); g.gain.linearRampToValueAtTime(.0001, t + dur); }
};
/* Ruido para borrar la nota anterior de la memoria a corto plazo (como en Van Hedger et al., 2019) */
PP.noise = function(dur, when){
  const c = PP.ac(), t = c.currentTime + (when || 0), len = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for(let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(), g = c.createGain(), lp = c.createBiquadFilter();
  s.buffer = buf; lp.type = 'lowpass'; lp.frequency.value = 5000;
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.12, t + .05); g.gain.setValueAtTime(.12, t + dur - .08); g.gain.linearRampToValueAtTime(.0001, t + dur);
  s.connect(lp); lp.connect(g); g.connect(out()); s.start(t); s.stop(t + dur);
};
/* Tono sostenido con frecuencia ajustable */
function sustain(freq){
  const c = PP.ac(), o1 = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
  o1.type = 'sawtooth'; o2.type = 'sine'; lp.type = 'lowpass'; lp.frequency.value = 2400;
  const m1 = c.createGain(); m1.gain.value = .12; const m2 = c.createGain(); m2.gain.value = .4;
  o1.connect(m1); o2.connect(m2); m1.connect(lp); m2.connect(lp); lp.connect(g); g.connect(out());
  g.gain.setValueAtTime(.0001, c.currentTime); g.gain.linearRampToValueAtTime(.3, c.currentTime + .15);
  o1.frequency.value = o2.frequency.value = freq; o1.start(); o2.start();
  return { set(f){ o1.frequency.setTargetAtTime(f, c.currentTime, .02); o2.frequency.setTargetAtTime(f, c.currentTime, .02); },
    stop(){ const n = c.currentTime; g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.linearRampToValueAtTime(.0001, n + .12); o1.stop(n + .15); o2.stop(n + .15); } };
}
const fb = (root, html) => { $('[data-fb]', root).innerHTML = html; };

/* ---------- 1. Encuentra el La de memoria ---------- */
EX['la-memoria'] = function(root){
  const TG = {A4:'La', D4:'Re', E5:'Mi', G3:'Sol'};
  let target = PP.store.get('mem-target', 'A4'), tone = null, cents = 0, startOff = 0;
  root.innerHTML = `<div class="ex-head"><h3>Encuentra la nota de memoria</h3><span class="ex-kind">Memoria de la altura</span></div>
    <p class="small muted">Sonará un tono desafinado a propósito. Mueve el control hasta que creas que es la nota pedida, sin ninguna referencia. Es la misma memoria que usa la gente que canta una canción conocida en su tono original.</p>
    <div class="row"><div class="seg" role="group" aria-label="Nota">${Object.entries(TG).map(([k, t]) => `<button type="button" data-t="${k}">${t}</button>`).join('')}</div></div>
    <div class="row"><button class="btn primary" data-go type="button">Empezar</button><button class="btn" data-done type="button" disabled>Esta es la nota</button></div>
    <label class="field">Más grave &nbsp;←&nbsp; mueve &nbsp;→&nbsp; más aguda<input type="range" min="-600" max="600" step="1" value="0" data-sl disabled></label>
    <p class="feedback" data-fb aria-live="polite"></p>
    <p class="best" data-hist></p>`;
  const segs = () => root.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === target)));
  const hist = () => { const h = PP.store.get('mem-hist-' + target, []); $('[data-hist]', root).textContent = h.length ? `Tus últimos ${h.length} intentos: error medio de ${Math.round(h.reduce((a, b) => a + Math.abs(b), 0) / h.length)} cents. Un semitono son 100 cents.` : ''; };
  const sl = $('[data-sl]', root);
  const base = () => hz(PP.NOTES[target].m);
  sl.addEventListener('input', () => { cents = startOff + +sl.value; if(tone) tone.set(base() * Math.pow(2, cents / 1200)); });
  $('[data-go]', root).addEventListener('click', () => {
    if(tone){ tone.stop(); tone = null; }
    PP.noise(1.2);
    startOff = (Math.random() < .5 ? -1 : 1) * (150 + Math.random() * 350);
    sl.value = 0; cents = startOff; sl.disabled = false; $('[data-done]', root).disabled = false;
    fb(root, `Busca el <b>${TG[target]}</b>. Tómate tu tiempo.`);
    setTimeout(() => { tone = sustain(base() * Math.pow(2, cents / 1200)); }, 1300);
  });
  $('[data-done]', root).addEventListener('click', () => {
    if(!tone) return; tone.stop(); tone = null; sl.disabled = true; $('[data-done]', root).disabled = true;
    let err = ((cents % 1200) + 1800) % 1200 - 600; err = Math.round(err);
    const h = PP.store.get('mem-hist-' + target, []); h.push(err); PP.store.set('mem-hist-' + target, h.slice(-10));
    const a = Math.abs(err);
    const verdict = a <= 25 ? '<span class="ok">Excelente.</span>' : a <= 60 ? '<span class="ok">Muy cerca.</span>' : a <= 150 ? '<span class="bad">Cerca, pero a más de medio tono.</span>' : '<span class="bad">Lejos.</span>';
    fb(root, `${verdict} Te has quedado ${a} cents ${err > 0 ? 'por encima' : err < 0 ? 'por debajo' : ''}. <button class="btn small" type="button" data-real>Escuchar el ${TG[target]} real</button>`);
    $('[data-real]', root).addEventListener('click', () => PP.voice(PP.NOTES[target].m, 1.6, 0, 'violin'));
    PP.stat.update('mem', s => { s.tries++; if(a <= 50) s.ok++; });
    hist();
  });
  root.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { target = b.dataset.t; PP.store.set('mem-target', target); segs(); hist(); }));
  root._dispose = () => { if(tone){ tone.stop(); tone = null; } };
  segs(); hist();
};

/* ---------- 2. Entrenador de notas absolutas ---------- */
const LEVELS = [
  {pcs:[9, 2, 4], t:'La, Re y Mi'},
  {pcs:[9, 2, 4, 7], t:'Las cuatro cuerdas al aire: Sol, Re, La y Mi'},
  {pcs:[9, 2, 4, 7, 0], t:'Añadimos Do'},
  {pcs:[9, 2, 4, 7, 0, 5], t:'Añadimos Fa'},
  {pcs:[9, 2, 4, 7, 0, 5, 11], t:'Las siete notas naturales'},
  {pcs:[9, 2, 4, 7, 0, 5, 11, 6], t:'Añadimos Fa♯'},
  {pcs:[9, 2, 4, 7, 0, 5, 11, 6, 1], t:'Añadimos Do♯'},
  {pcs:[9, 2, 4, 7, 0, 5, 11, 6, 1, 8], t:'Añadimos Sol♯'},
  {pcs:[9, 2, 4, 7, 0, 5, 11, 6, 1, 8, 10], t:'Añadimos Si♭'},
  {pcs:[9, 2, 4, 7, 0, 5, 11, 6, 1, 8, 10, 3], t:'Las doce notas'}
];
PP.ABS_LEVELS = LEVELS;
EX['entrenador-absoluto'] = function(root){
  let lv = Math.min(PP.store.get('abs-level', 0), LEVELS.length - 1), mode = 'train', vary = PP.store.get('abs-vary', true), weak = false;
  let cur = null, lock = false, test = null, timers = [];
  root.innerHTML = `<div class="ex-head"><h3>Entrenador de notas</h3><span class="ex-kind">Reconocer una nota sin referencia</span></div>
    <div class="row between"><div style="display:grid;gap:2px"><b style="font-family:var(--f-display);font-size:1.25rem" data-lvt></b><span class="small muted" data-lvd></span></div>
      <div class="row"><button class="btn small" data-prev type="button">Nivel anterior</button><button class="btn small" data-nextlv type="button">Nivel siguiente</button></div></div>
    <div class="row between"><div class="seg" role="group" aria-label="Modo"><button type="button" data-m="train">Entrenar con respuesta</button><button type="button" data-m="test">Prueba sin ayudas (20 notas)</button></div>
      <label class="row small" style="gap:8px;cursor:pointer"><input type="checkbox" data-vary ${vary ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--ink)">Variar sonido y octava</label></div>
    <div class="row"><button class="btn primary" data-go type="button">Empezar</button><button class="btn" data-again type="button">Repetir el sonido</button><button class="btn" data-weak type="button" aria-pressed="false">Practicar mi nota más débil</button></div>
    <div class="opts" data-opts></div>
    <p class="feedback" data-fb aria-live="polite"></p>
    <div data-stats></div>`;
  const stats = () => PP.store.get('abs-stats', {});
  function paint(){
    const L = LEVELS[lv];
    $('[data-lvt]', root).textContent = `Nivel ${lv + 1} de ${LEVELS.length}`;
    $('[data-lvd]', root).textContent = `${L.t}. Para subir de nivel: 90 % en la prueba sin ayudas.`;
    root.querySelectorAll('[data-m]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === mode)));
    $('[data-weak]', root).setAttribute('aria-pressed', String(weak)); $('[data-weak]', root).style.background = weak ? 'var(--soft)' : '';
    $('[data-opts]', root).innerHTML = L.pcs.slice().sort((a, b) => a - b).map(pc => `<button type="button" data-pc="${pc}">${nm12(pc)}</button>`).join('');
    root.querySelectorAll('[data-pc]').forEach(b => b.addEventListener('click', () => answer(+b.dataset.pc, b)));
    paintStats();
  }
  function paintStats(){
    const L = LEVELS[lv];
    const st = stats(), rows = L.pcs.map(pc => ({pc, ...(st[pc] || {ok:0, n:0})})).filter(r => r.n);
    $('[data-stats]', root).innerHTML = rows.length ? `<p class="small muted">Tu acierto por nota (últimos intentos):</p><div class="row" style="gap:6px">${rows.sort((a, b) => a.ok / a.n - b.ok / b.n).map(r => `<span class="kbd" style="background:${r.ok / r.n >= .9 ? 'var(--ok-bg)' : r.ok / r.n < .6 ? 'var(--bad-bg)' : 'var(--soft)'}">${nm12(r.pc)} ${Math.round(100 * r.ok / r.n)} %</span>`).join('')}</div>` : '';
  }
  function weakest(){ const st = stats(), L = LEVELS[lv].pcs; let w = L[0], wr = 2; L.forEach(pc => { const s = st[pc]; const r = s && s.n ? s.ok / s.n : .5; if(r < wr){ wr = r; w = pc; } }); return w; }
  function makeNote(){
    const L = LEVELS[lv].pcs;
    let pc = weak && mode === 'train' && Math.random() < .5 ? weakest() : pick(L);
    if(cur && L.length > 2 && pc === cur.pc && Math.random() < .7) pc = pick(L.filter(x => x !== pc));
    let m;
    if(vary){ const opts = []; for(let k = 55; k <= 84; k++) if(k % 12 === pc) opts.push(k); m = pick(opts); }
    else { m = 60 + pc; if(m < 64) m += 12; }
    return {pc, m, timbre: vary ? pick(['violin', 'piano', 'flauta', 'violin']) : 'violin'};
  }
  const sound = () => cur && PP.voice(cur.m, 1.3, 0, cur.timbre);
  function next(){
    timers.forEach(clearTimeout); timers = [];
    root.querySelectorAll('[data-pc]').forEach(b => b.className = '');
    cur = makeNote(); lock = true;
    PP.noise(1);
    timers.push(setTimeout(() => { sound(); lock = false; }, 1150));
  }
  function record(pc, ok){ const st = stats(); const s = st[pc] || {ok:0, n:0}; s.n++; if(ok) s.ok++; if(s.n > 30){ s.ok *= 30 / s.n; s.n = 30; } st[pc] = s; PP.store.set('abs-stats', st); }
  function answer(pc, b){
    if(!cur || lock) return;
    const ok = pc === cur.pc;
    record(cur.pc, ok);
    if(mode === 'test'){
      test.res.push(ok); test.n++;
      fb(root, `Nota ${test.n} de 20`);
      if(test.n >= 20) return finishTest();
      lock = true; timers.push(setTimeout(next, 250)); return;
    }
    lock = true;
    root.querySelectorAll('[data-pc]').forEach(x => { if(+x.dataset.pc === cur.pc) x.classList.add('right'); });
    if(ok){ fb(root, `<span class="ok">${nm12(cur.pc)}, correcto.</span>`); PP.stat.update('abs', s => { s.ok++; s.tries++; }); timers.push(setTimeout(next, 1100)); }
    else {
      b.classList.add('wrong'); PP.stat.update('abs', s => { s.tries++; });
      fb(root, `<span class="bad">Era ${nm12(cur.pc)}.</span> Escucha la diferencia: primero lo que has dicho, después la nota correcta.`);
      const wrongM = cur.m + ((pc - cur.pc + 18) % 12 - 6);
      timers.push(setTimeout(() => PP.voice(wrongM, .9, 0, cur.timbre), 500));
      timers.push(setTimeout(() => PP.voice(cur.m, 1.2, 0, cur.timbre), 1600));
      timers.push(setTimeout(next, 3400));
    }
    paintStats();
  }
  function finishTest(){
    const pct = Math.round(100 * test.res.filter(Boolean).length / test.res.length);
    const passed = pct >= 90; test = null; cur = null;
    let msg = `<span class="${passed ? 'ok' : 'bad'}">${pct} % de acierto sin ayudas.</span> `;
    if(passed && lv < LEVELS.length - 1){ lv++; PP.store.set('abs-level', Math.max(PP.store.get('abs-level', 0), lv)); msg += `Has subido al nivel ${lv + 1}: ${LEVELS[lv].t.toLowerCase()}.`; PP.pluck(81); }
    else if(passed) msg += 'Has completado el último nivel: reconoces las doce notas.';
    else msg += 'Sigue entrenando con respuesta unos días y vuelve a intentarlo. Lo normal es necesitar varias sesiones por nivel.';
    PP.stat.update('abs-best', s => { if(lv + 1 > s.best) s.best = lv + 1; });
    mode = 'train'; paint(); fb(root, msg);
    $('[data-go]', root).textContent = 'Empezar';
  }
  $('[data-go]', root).addEventListener('click', () => {
    PP.ac();
    if(mode === 'test'){ test = {n:0, res:[]}; fb(root, 'Prueba en marcha: 20 notas, sin respuesta hasta el final.'); }
    else fb(root, '');
    $('[data-go]', root).textContent = 'Nueva nota';
    next();
  });
  $('[data-again]', root).addEventListener('click', sound);
  $('[data-weak]', root).addEventListener('click', () => { weak = !weak; paint(); });
  $('[data-vary]', root).addEventListener('change', e => { vary = e.target.checked; PP.store.set('abs-vary', vary); });
  root.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.m; test = null; cur = null; timers.forEach(clearTimeout); fb(root, mode === 'test' ? 'Pulsa "Empezar" para comenzar la prueba.' : ''); $('[data-go]', root).textContent = 'Empezar'; paint(); }));
  $('[data-prev]', root).addEventListener('click', () => { if(lv > 0){ lv--; cur = null; paint(); fb(root, ''); } });
  $('[data-nextlv]', root).addEventListener('click', () => { if(lv < PP.store.get('abs-level', 0)){ lv++; cur = null; paint(); fb(root, ''); } else fb(root, 'Para desbloquear el siguiente nivel, consigue un 90 % en la prueba sin ayudas.'); });
  root._dispose = () => timers.forEach(clearTimeout);
  paint();
};

/* ---------- 3. Intervalos ---------- */
const INTS = [
  {s:1, t:'Semitono (2ª menor)', ref:'el tema de la película Tiburón'},
  {s:2, t:'Tono (2ª mayor)', ref:'"cum-ple" en Cumpleaños feliz, de la segunda a la tercera nota'},
  {s:3, t:'3ª menor', ref:'el comienzo de Greensleeves'},
  {s:4, t:'3ª mayor', ref:'el comienzo de Oh When the Saints'},
  {s:5, t:'4ª justa', ref:'la marcha nupcial de Wagner, "Here comes the bride"'},
  {s:7, t:'5ª justa', ref:'el comienzo de Estrellita (Do, Do, Sol): las cuerdas del violín están afinadas en quintas'},
  {s:9, t:'6ª mayor', ref:'el comienzo de My Bonnie'},
  {s:12, t:'Octava', ref:'la misma nota más aguda: el dedo 3 en una cuerda y la cuerda al aire de debajo'}
];
EX['intervalos'] = function(root){
  const SETS = {basico:[5, 7, 12], terceras:[3, 4, 5, 7, 12], todos:[1, 2, 3, 4, 5, 7, 9, 12]};
  let set = PP.store.get('int-set', 'basico'), dir = PP.store.get('int-dir', 'up'), cur = null, done = false, streak = 0;
  root.innerHTML = `<div class="ex-head"><h3>Intervalos</h3><span class="ex-kind">Oído relativo</span></div>
    <p class="small muted">Un intervalo es la distancia entre dos notas. Reconocerlo es lo que te permite afinar un dedo respecto a otro, aunque no tengas oído absoluto. Cada respuesta te recuerda una canción para memorizarlo.</p>
    <div class="row"><div class="seg" role="group" aria-label="Intervalos"><button type="button" data-s="basico">4ª, 5ª y 8ª</button><button type="button" data-s="terceras">Con terceras</button><button type="button" data-s="todos">Todos</button></div>
      <div class="seg" role="group" aria-label="Dirección"><button type="button" data-d="up">Subiendo</button><button type="button" data-d="down">Bajando</button><button type="button" data-d="harm">A la vez</button></div></div>
    <div class="row"><button class="btn primary" data-go type="button">Escuchar</button><button class="btn" data-next type="button">Otro intervalo</button></div>
    <div class="opts" data-opts style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))"></div>
    <p class="feedback" data-fb aria-live="polite"></p><p class="best" data-best></p>`;
  const segs = () => { root.querySelectorAll('[data-s]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.s === set))); root.querySelectorAll('[data-d]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.d === dir))); };
  const best = () => { const s = PP.stat.get('int-' + set); $('[data-best]', root).textContent = s.best ? `Mejor racha en este grupo: ${s.best}` : ''; };
  function play(){ if(!cur) return; const a = cur.root, b = dir === 'down' ? cur.root - cur.s : cur.root + cur.s;
    if(dir === 'harm'){ PP.voice(a, 1.6, 0, 'piano'); PP.voice(b, 1.6, 0, 'piano'); } else { PP.voice(a, .9, 0, 'violin'); PP.voice(b, 1.1, .95, 'violin'); } }
  function next(){
    const S = SETS[set]; let s; do{ s = pick(S); }while(cur && s === cur.s && S.length > 1);
    cur = {s, root:(dir === 'down' ? 64 : 55) + Math.floor(Math.random() * 12)}; done = false; fb(root, '');
    $('[data-opts]', root).innerHTML = INTS.filter(i => S.indexOf(i.s) >= 0).map(i => `<button type="button" data-i="${i.s}" style="font-size:1rem">${i.t}</button>`).join('');
    root.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => answer(b)));
    play();
  }
  function answer(b){
    if(done) return; done = true;
    const ok = +b.dataset.i === cur.s, I = INTS.find(i => i.s === cur.s);
    root.querySelectorAll('[data-i]').forEach(x => { if(+x.dataset.i === cur.s) x.classList.add('right'); });
    if(ok){ streak++; PP.stat.update('int-' + set, s => { s.ok++; s.tries++; if(streak > s.best) s.best = streak; }); fb(root, `<span class="ok">${I.t}.</span> Para recordarlo: ${I.ref}.`); setTimeout(() => { if(done) next(); }, 2600); }
    else { streak = 0; b.classList.add('wrong'); PP.stat.update('int-' + set, s => { s.tries++; }); fb(root, `<span class="bad">Era ${I.t.toLowerCase()}.</span> Para recordarlo: ${I.ref}. Pulsa "Escuchar" para oírlo otra vez.`); }
    best();
  }
  root.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => { set = b.dataset.s; PP.store.set('int-set', set); segs(); best(); next(); }));
  root.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { dir = b.dataset.d; PP.store.set('int-dir', dir); segs(); next(); }));
  $('[data-go]', root).addEventListener('click', () => { if(!cur) next(); else play(); });
  $('[data-next]', root).addEventListener('click', next);
  segs(); best();
};

/* ---------- 4. Notas dentro de una tonalidad ---------- */
const KEYS = {
  'La': {tonic:57, names:['La','Si','Do♯','Re','Mi','Fa♯','Sol♯'], letters:['A','B','C♯','D','E','F♯','G♯']},
  'Re': {tonic:62, names:['Re','Mi','Fa♯','Sol','La','Si','Do♯'], letters:['D','E','F♯','G','A','B','C♯']},
  'Sol': {tonic:55, names:['Sol','La','Si','Do','Re','Mi','Fa♯'], letters:['G','A','B','C','D','E','F♯']}
};
const STEPS = [0, 2, 4, 5, 7, 9, 11];
const DEG = ['1ª, la tónica: el punto de reposo', '2ª: quiere bajar a la tónica', '3ª: da el carácter mayor, alegre', '4ª: tiende a bajar a la 3ª', '5ª, la dominante: estable, como una columna', '6ª: suave, tiende a bajar a la 5ª', '7ª, la sensible: muy tensa, quiere subir a la tónica'];
EX['grados'] = function(root){
  let key = PP.store.get('gr-key', 'Re'), only = PP.store.get('gr-only', 'arp'), cur = null, done = false, streak = 0;
  root.innerHTML = `<div class="ex-head"><h3>Notas dentro de una tonalidad</h3><span class="ex-kind">Oído tonal</span></div>
    <p class="small muted">Primero suenan unos acordes que fijan la tonalidad, como cuando oyes el principio de una pieza. Después, una nota sola. Di cuál es. Cada nota tiene un "color" propio dentro de la tonalidad: la tónica descansa, la sensible pide resolver.</p>
    <div class="row"><div class="seg" role="group" aria-label="Tonalidad">${Object.keys(KEYS).map(k => `<button type="button" data-k="${k}">${k} mayor</button>`).join('')}</div>
      <div class="seg" role="group" aria-label="Notas"><button type="button" data-o="arp">1ª, 3ª y 5ª</button><button type="button" data-o="all">Toda la escala</button></div></div>
    <div class="row"><button class="btn primary" data-go type="button">Escuchar</button><button class="btn" data-ctx type="button">Solo la tonalidad</button><button class="btn" data-again type="button">Solo la nota</button></div>
    <div class="opts" data-opts></div>
    <p class="feedback" data-fb aria-live="polite"></p><p class="best" data-best></p>`;
  const K = () => KEYS[key];
  const segs = () => { root.querySelectorAll('[data-k]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === key))); root.querySelectorAll('[data-o]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.o === only))); };
  const best = () => { const s = PP.stat.get('gr-' + only); $('[data-best]', root).textContent = s.best ? `Mejor racha: ${s.best}` : ''; };
  const name = i => (PP.useLetters() ? K().letters : K().names)[i];
  function cadence(){
    const t = K().tonic + 12, chords = [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]];
    chords.forEach((ch, i) => { ch.forEach(x => PP.voice(t + x - 12, .75, i * .7, 'piano')); PP.voice(t - 24 + ch[0], .75, i * .7, 'piano'); });
    return 4 * .7 + .35;
  }
  function note(when){ PP.voice(cur.m, 1.2, when || 0, 'violin'); }
  function next(){
    const pool = only === 'arp' ? [0, 2, 4] : [0, 1, 2, 3, 4, 5, 6];
    let d; do{ d = pick(pool); }while(cur && d === cur.d && pool.length > 1);
    const oct = pick([12, 12, 24]); let m = K().tonic + oct + STEPS[d]; if(m > 84) m -= 12;
    cur = {d, m}; done = false; fb(root, '');
    $('[data-opts]', root).innerHTML = pool.map(i => `<button type="button" data-d="${i}">${name(i)}</button>`).join('');
    root.querySelectorAll('[data-opts] [data-d]').forEach(b => b.addEventListener('click', () => answer(b)));
    note(cadence());
  }
  function answer(b){
    if(done) return; done = true; const ok = +b.dataset.d === cur.d;
    root.querySelectorAll('[data-opts] [data-d]').forEach(x => { if(+x.dataset.d === cur.d) x.classList.add('right'); });
    if(ok){ streak++; PP.stat.update('gr-' + only, s => { s.ok++; s.tries++; if(streak > s.best) s.best = streak; }); fb(root, `<span class="ok">${name(cur.d)}.</span> Es la ${DEG[cur.d]}.`); setTimeout(() => { if(done) next(); }, 2600); }
    else { streak = 0; b.classList.add('wrong'); PP.stat.update('gr-' + only, s => { s.tries++; }); fb(root, `<span class="bad">Era ${name(cur.d)}.</span> Es la ${DEG[cur.d]}. Escucha cómo se resuelve:`);
      const base = cur.m - STEPS[cur.d], path = cur.d === 0 ? [] : cur.d >= 4 ? STEPS.slice(cur.d + 1).concat([12]) : STEPS.slice(0, cur.d).reverse();
      let w = .3; note(w); w += 1.1; path.forEach(st => { PP.voice(base + st, .45, w, 'violin'); w += .45; }); }
    best();
  }
  root.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { key = b.dataset.k; PP.store.set('gr-key', key); segs(); cur = null; next(); }));
  root.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => { only = b.dataset.o; PP.store.set('gr-only', only); segs(); best(); cur = null; next(); }));
  $('[data-go]', root).addEventListener('click', () => { if(!cur) next(); else note(cadence()); });
  $('[data-ctx]', root).addEventListener('click', () => cadence());
  $('[data-again]', root).addEventListener('click', () => cur && note(0));
  segs(); best();
};

/* ---------- 5. Afinación fina: ¿más alta o más baja? ---------- */
EX['afinacion-fina'] = function(root){
  let delta = 50, streakOK = 0, rev = [], lastDir = 0, cur = null, n = 0, lock = false;
  root.innerHTML = `<div class="ex-head"><h3>Afinación fina</h3><span class="ex-kind">Discriminación de altura</span></div>
    <p class="small muted">Oirás dos notas casi iguales. ¿La segunda es más alta o más baja? Cuando aciertas dos veces seguidas la diferencia se reduce; cuando fallas, crece. Así el ejercicio encuentra tu umbral: la diferencia más pequeña que eres capaz de oír.</p>
    <div class="row"><button class="btn primary" data-go type="button">Escuchar</button><button class="btn" data-reset type="button">Empezar de cero</button></div>
    <div class="opts" style="grid-template-columns:repeat(2,minmax(0,1fr))"><button type="button" data-a="-1">Más baja</button><button type="button" data-a="1">Más alta</button></div>
    <div class="row" style="gap:28px"><div><div class="muted small">Diferencia actual</div><b data-delta style="font-family:var(--f-display);font-size:2rem;font-variant-numeric:tabular-nums"></b></div>
      <div><div class="muted small">Tu umbral estimado</div><b data-th style="font-family:var(--f-display);font-size:2rem;font-variant-numeric:tabular-nums">–</b></div>
      <div><div class="muted small">Mejor umbral</div><b data-bt style="font-family:var(--f-display);font-size:2rem;font-variant-numeric:tabular-nums"></b></div></div>
    <p class="feedback" data-fb aria-live="polite"></p>
    <p class="small muted">Referencia: un semitono son 100 cents. Una persona sin formación musical suele empezar entre 20 y 50 cents; los músicos entrenados distinguen unos pocos cents.</p>`;
  const paint = () => { $('[data-delta]', root).textContent = (delta < 10 ? delta.toFixed(1) : Math.round(delta)) + ' cents'; const b = PP.stat.get('fino').best; $('[data-bt]', root).textContent = b ? (b / 10).toFixed(1) + ' cents' : '–'; };
  function trial(){
    if(lock) return; lock = true;
    const base = 330 + Math.random() * 330, dir = Math.random() < .5 ? -1 : 1;
    cur = {dir}; const f2 = base * Math.pow(2, dir * delta / 1200);
    PP.voice(0, .55, 0, 'flauta', base); PP.voice(0, .55, .85, 'flauta', f2);
    setTimeout(() => { lock = false; }, 1300);
  }
  root.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
    if(!cur || lock) return;
    const ok = +b.dataset.a === cur.dir; n++; cur = null;
    let move = 0;
    if(ok){ streakOK++; if(streakOK >= 2){ streakOK = 0; move = -1; } } else { streakOK = 0; move = 1; }
    if(move){ if(lastDir && move !== lastDir) rev.push(delta); lastDir = move; delta = Math.max(1, Math.min(100, move < 0 ? delta * .79 : delta / .79)); }
    const th = rev.length >= 4 ? Math.exp(rev.slice(-6).reduce((a, x) => a + Math.log(x), 0) / Math.min(6, rev.length)) : null;
    if(th){ $('[data-th]', root).textContent = th.toFixed(1) + ' cents'; if(rev.length >= 6) PP.stat.update('fino', s => { const v = Math.round(th * 10); if(!s.best || v < s.best) s.best = v; s.tries++; }); }
    fb(root, ok ? '<span class="ok">Correcto.</span>' : `<span class="bad">Era ${+b.dataset.a > 0 ? 'más baja' : 'más alta'}.</span>`);
    paint(); setTimeout(trial, 700);
  }));
  $('[data-go]', root).addEventListener('click', () => { if(!cur) trial(); });
  $('[data-reset]', root).addEventListener('click', () => { delta = 50; streakOK = 0; rev = []; lastDir = 0; cur = null; $('[data-th]', root).textContent = '–'; fb(root, ''); paint(); });
  paint();
};

/* ---------- Módulo 13 en el registro y en el panel ---------- */
if(!PP.LEVELS.some(l => l.n === 4)) PP.LEVELS.push({n:4, t:'Oído musical', d:'Reconocer notas e intervalos solo escuchando. Puedes trabajarlo en paralelo a cualquier otro módulo.'});
if(!PP.MODULES.some(m => m.n === 13)) PP.MODULES.push({n:13, lv:4, t:'Reconocer notas de oído', d:'Oído absoluto y relativo, con ejercicios basados en la investigación', goals:[
  'Encuentro el La de memoria con un error medio menor de 50 cents',
  'Supero la prueba del nivel 2 del entrenador: reconozco las cuatro cuerdas al aire sin referencia',
  'Llego al nivel 5 del entrenador: las siete notas naturales',
  'Reconozco 4ª, 5ª y 8ª subiendo y bajando con una racha de 10',
  'Reconozco las notas 1ª, 3ª y 5ª en Re mayor con una racha de 10',
  'Mi umbral de afinación fina está por debajo de 15 cents']});
const C = (id, t, ex, attrs) => ({m:13, id:'m13-' + id, t, type:'Oído', ex, attrs:attrs || {}});
PP.CATALOG.push(C('memoria', 'Encuentra la nota de memoria', 'la-memoria'), C('absoluto', 'Entrenador de notas', 'entrenador-absoluto'),
  C('intervalos', 'Intervalos', 'intervalos'), C('grados', 'Notas dentro de una tonalidad', 'grados'), C('fino', 'Afinación fina', 'afinacion-fina'));
})();
