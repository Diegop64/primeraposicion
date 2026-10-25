/* Primera Posición: juegos para aprender el pentagrama.
   Defiende la clave (arcade), Parejas (memoria) e insignias. */
(function(){
'use strict';
const PP = window.PP, EX = PP.EX;
const $ = (s, el) => (el || document).querySelector(s);
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Avisos e insignias ---------- */
PP.toast = function(html){
  let box = $('.toasts'); if(!box){ box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; box.appendChild(t);
  setTimeout(() => t.classList.add('out'), 3200); setTimeout(() => t.remove(), 3700);
};
PP.BADGES = [
  ['primera', 'Primera partida', 'Juega una partida de Defiende la clave'],
  ['combo10', 'En racha', 'Consigue un combo de 10 notas'],
  ['combo25', 'Imparable', 'Consigue un combo de 25 notas'],
  ['combo50', 'Leyenda del pentagrama', 'Consigue un combo de 50 notas'],
  ['p1000', 'Mil puntos', 'Haz 1.000 puntos en una partida'],
  ['p5000', 'Cinco mil', 'Haz 5.000 puntos en una partida'],
  ['estrellas3', 'Tres estrellas', 'Consigue las tres estrellas en un mundo'],
  ['mundo5', 'Todas las naturales', 'Desbloquea el mundo de las notas naturales'],
  ['final', 'El reto final', 'Consigue una estrella en el mundo final'],
  ['mastil20', 'Mapa en la cabeza', 'Acierta 20 notas en una partida en modo mástil'],
  ['violin10', 'Con el violín en la mano', 'Destruye 10 notas tocándolas con tu violín'],
  ['cien', 'Cien notas', 'Acierta 100 notas sumando todas tus partidas'],
  ['mil', 'Mil notas', 'Acierta 1.000 notas sumando todas tus partidas'],
  ['parejas', 'Buena memoria', 'Completa una partida de Parejas'],
  ['parejas60', 'Memoria de elefante', 'Completa Parejas de 8 en menos de 60 segundos'],
  ['sonido', 'Oído y vista', 'Completa Parejas en el modo sonido y pentagrama']
];
PP.badge = function(id){
  const got = PP.store.get('logros', []); if(got.indexOf(id) >= 0) return false;
  got.push(id); PP.store.set('logros', got);
  const b = PP.BADGES.find(x => x[0] === id);
  if(b){ PP.toast(`<b>Insignia nueva: ${b[1]}</b><span>${b[2]}</span>`); try{ PP.pluck(76); PP.pluck(81, .12); PP.pluck(88, .24); }catch(e){} }
  document.querySelectorAll('[data-ex="insignias"]').forEach(el => el._paint && el._paint());
  return true;
};

/* ---------- Mundos ---------- */
const WORLDS = [
  {pool:'open', t:'Las cuatro cuerdas', d:'Sol, Re, La y Mi al aire'},
  {pool:'la_mi', t:'Cuerdas La y Mi', d:'Ocho notas en la parte alta'},
  {pool:'re_la', t:'Cuerdas Re y La', d:'El centro del pentagrama'},
  {pool:'sol_re', t:'Cuerdas Sol y Re', d:'Las notas graves y sus líneas adicionales'},
  {pool:'naturales', t:'Todas las naturales', d:'De Sol grave a Re agudo'},
  {pool:'mezcla', t:'Con sostenidos', d:'Dedo 2 alto y bajo mezclados'},
  {pool:'todas', t:'El reto final', d:'Las veinticuatro notas'}
];
const STAR_AT = [10, 25, 45];  // notas acertadas en una misma partida para cada estrella
const ORD = ['primera', 'segunda', 'tercera'];
/* Partidas jugadas con la versión anterior (meta de 15 y guardado al final):
   si ya conseguiste el combo de 10 en el mundo 1, te damos su primera estrella. */
(function migrate(){
  const ws = PP.store.get('w-stars', {}), got = PP.store.get('logros', []);
  if(!Object.keys(ws).length && got.indexOf('combo10') >= 0){
    PP.store.set('w-stars', {0:1});
    const wh = PP.store.get('w-hits', {}); if(!wh[0]) PP.store.set('w-hits', {0:10});
  }
})();
const worldStars = i => PP.store.get('w-stars', {})[i] || 0;
const unlocked = i => i === 0 || worldStars(i - 1) > 0;

function cssVars(){
  const cs = getComputedStyle(document.documentElement), g = k => cs.getPropertyValue(k).trim();
  return {ink:g('--ink'), paper:g('--paper'), muted:g('--muted'), rule:g('--rule'), la:g('--la'), labg:g('--la-bg'), ok:g('--ok'), bad:g('--bad'), soft:g('--soft'),
    str:{Sol:g('--sol'), Re:g('--re'), La:g('--la'), Mi:g('--mi')}};
}

/* ---------- Defiende la clave ---------- */
EX['defiende'] = function(root){
  let world = Math.min(PP.store.get('def-world', 0), WORLDS.length - 1); if(!unlocked(world)) world = 0;
  let mode = PP.store.get('def-mode', 'nombre'), colors = PP.store.get('def-colors', false);
  let G = null, raf = 0, ro = null;
  root.innerHTML = `<div class="ex-head"><h3>Defiende la clave</h3><span class="ex-kind">Juego</span></div>
    <div class="game-menu" data-menu>
      <p class="muted">Las notas avanzan por el pentagrama hacia la clave de sol. Destrúyelas antes de que lleguen diciendo cuál es. Cada acierto seguido suma al combo y multiplica tus puntos. Si una nota llega a la clave, pierdes una vida.</p>
      <div class="callout teacher"><b>Cómo avanzar</b>Cada mundo tiene tres estrellas: se ganan acertando ${STAR_AT[0]}, ${STAR_AT[1]} y ${STAR_AT[2]} notas en una misma partida. Con la primera estrella de un mundo se abre el siguiente. La estrella se guarda en el momento en que la consigues, aunque luego pierdas.</div>
      <div class="worlds" data-worlds></div>
      <div class="row"><div class="seg" role="group" aria-label="Cómo responder"><button type="button" data-mode="nombre">Por su nombre</button><button type="button" data-mode="mastil">En el mástil</button><button type="button" data-mode="violin">Con mi violín</button><button type="button" data-mode="voz">Con mi voz</button></div>
        <label class="row small" style="gap:8px;cursor:pointer"><input type="checkbox" data-colors ${colors ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--ink)">Notas con el color de su cuerda (más fácil)</label></div>
      <p class="small muted" data-modehelp></p>
      <div data-vozcal hidden></div>
      <div class="row"><button class="btn primary" data-start type="button">Jugar</button><span class="best" data-best></span></div>
    </div>
    <div class="game" data-game hidden>
      <div class="hud"><span data-hearts aria-label="Vidas"></span><span>Puntos <b data-score>0</b></span><span>Combo <b data-combo>0</b> <small data-mult></small></span><span>Nivel <b data-level>1</b></span><span class="goal-chip" data-goal></span><button class="btn small" data-pause type="button">Pausa</button></div>
      <div class="stage" data-stage><canvas data-cv aria-label="Pentagrama con notas que avanzan"></canvas><div class="overlay" data-ov hidden></div></div>
      <div data-answer></div>
      <div class="results" data-res hidden></div>
    </div>`;
  const keysOf = () => [...new Set(PP.pool(WORLDS[world].pool).map(n => PP.name(n)))];
  function paintMenu(){
    const ws = PP.store.get('w-stars', {});
    $('[data-worlds]', root).innerHTML = WORLDS.map((w, i) => {
      const st = ws[i] || 0, lock = !unlocked(i), bh = (PP.store.get('w-hits', {})[i] || 0);
      const prevBest = PP.store.get('w-hits', {})[i - 1] || 0;
      const info = lock ? `Para abrirlo: acierta ${STAR_AT[0]} notas en una partida del mundo ${i} (tu mejor: ${prevBest})` :
        st >= 3 ? `${w.d}. Completado` : `${w.d}. ${bh ? `Tu mejor partida: ${bh} notas. ` : ''}${ORD[st].charAt(0).toUpperCase() + ORD[st].slice(1)} estrella: ${STAR_AT[st]} notas`;
      const pct = lock ? Math.min(100, 100 * prevBest / STAR_AT[0]) : st >= 3 ? 100 : Math.min(100, 100 * bh / STAR_AT[st]);
      return `<button type="button" class="world${i === world ? ' sel' : ''}" data-w="${i}" ${lock ? 'disabled' : ''} aria-pressed="${i === world}">
        <span class="wn">${i + 1}</span><span class="wt"><b>${w.t}</b><small>${info}</small><span class="wbar" aria-hidden="true"><i style="width:${pct}%"></i></span></span>
        <span class="stars" aria-label="${st} de 3 estrellas">${[0, 1, 2].map(k => `<i class="${k < st ? 'on' : ''}"></i>`).join('')}</span></button>`; }).join('');
    root.querySelectorAll('[data-w]').forEach(b => b.addEventListener('click', () => { world = +b.dataset.w; PP.store.set('def-world', world); paintMenu(); }));
    root.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    $('[data-modehelp]', root).textContent = mode === 'nombre' ? 'Pulsa el nombre de la nota marcada. En el teclado puedes usar los números del 1 en adelante.' :
      mode === 'mastil' ? 'Pulsa en el mástil el sitio donde se toca la nota marcada. Así unes lo que lees con lo que hacen tus dedos.' :
      mode === 'voz' ? 'Di el nombre de la nota marcada: "sol", "la", "fa sostenido"... Tu voz se reconoce dentro del navegador y no sale de este ordenador.' :
      'Toca la nota con tu violín y el micrófono la destruye si está afinada. Acerca el violín al ordenador.';
    const needCal = mode === 'voz' && !(PP.voz && PP.voz.calibrated());
    const vc = $('[data-vozcal]', root);
    if(needCal && !vc.dataset.mounted){ vc.innerHTML = '<div data-ex="voz-calibrar"></div>'; PP.mountAll(vc); vc.dataset.mounted = '1'; }
    if(!needCal && vc.dataset.mounted){ PP.unmountAll(vc); vc.innerHTML = ''; delete vc.dataset.mounted; }
    vc.hidden = !needCal;
    $('[data-start]', root).disabled = needCal;
    $('[data-start]', root).textContent = needCal ? 'Calibra tu voz para jugar' : 'Jugar';
    const b = PP.store.get('def-best', {})[world + mode] || 0;
    $('[data-best]', root).textContent = b ? `Tu récord en este mundo: ${b} puntos` : '';
  }
  root.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; PP.store.set('def-mode', mode); paintMenu(); }));
  $('[data-colors]', root).addEventListener('change', e => { colors = e.target.checked; PP.store.set('def-colors', colors); });

  const cv = $('[data-cv]', root), ctx = cv.getContext('2d');
  let W = 600, H = 250, dpr = 1, gap = 15;
  function size(){
    const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(280, r.width); H = Math.round(Math.min(300, Math.max(220, W * .42)));
    cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); gap = Math.round(H / 15);
  }
  const yTop = () => H / 2 - 2 * gap - gap * .4;
  const yOf = d => yTop() + (10 - d) * gap / 2;
  const defX = () => gap * 5.4;

  function start(){
    PP.ac();
    const pool = PP.pool(WORLDS[world].pool).filter(n => mode !== 'mastil' || n.pos !== 'pos3');
    G = {startStars:(PP.store.get('w-stars', {})[world] || 0), pool, notes:[], parts:[], floats:[], score:0, combo:0, maxCombo:0, hits:0, lives:3, level:1, t:0, spawnIn:.6, last:performance.now(), paused:false, over:false, misses:{}, banner:{t:1.6, txt:'Nivel 1'}, micT:0, lastId:null};
    $('[data-menu]', root).hidden = true; $('[data-game]', root).hidden = false; $('[data-ov]', root).hidden = true;
    $('[data-res]', root).hidden = true; $('[data-stage]', root).hidden = false; $('[data-answer]', root).hidden = false; $('[data-pause]', root).hidden = false;
    size(); buildAnswer(); hud();
    PP.badge('primera');
    if(mode === 'voz') PP.voz.listen(seq => onVoice(seq), lv => PP.meter(root, lv, lv > .4)).then(stop => { if(G && !G.over) G.stopVoz = stop; else stop(); }).catch(err => { G.paused = true; overlay(`<h3>No se ha podido usar el micrófono</h3><p>${err && err.name === 'NotAllowedError' ? 'Has bloqueado el permiso: actívalo en el candado de la barra de direcciones y recarga.' : (err.message || '')}</p><div class="row"><button class="btn primary" type="button" data-menu-back>Volver</button></div>`); });
    if(mode === 'violin') PP.mic.start().catch(err => { G.paused = true; overlay(`<h3>No se ha podido usar el micrófono</h3><p>${err && err.name === 'NotAllowedError' ? 'Has bloqueado el permiso: actívalo en el candado de la barra de direcciones y recarga.' : (err.message || '')}</p><div class="row"><button class="btn primary" type="button" data-menu-back>Volver</button></div>`); });
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function buildAnswer(){
    const box = $('[data-answer]', root);
    if(mode === 'nombre'){
      const names = keysOf();
      box.innerHTML = `<div class="opts game-keys">${names.map((n, i) => `<button type="button" data-n="${n}"><span>${n}</span><small>${i < 9 ? i + 1 : ''}</small></button>`).join('')}</div>`;
      box.querySelectorAll('[data-n]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); answerName(b.dataset.n, b); }));
    } else if(mode === 'mastil'){
      box.innerHTML = `<div class="center" data-board></div>`;
      PP.board($('[data-board]', box), {notes:G.pool.map(n => n.id), label:'finger', width:220, onPick:(n, g) => answerBoard(n, g)});
    } else if(mode === 'voz'){
      box.innerHTML = `<div class="listen-box"><p data-heard class="heard">Di el nombre de la nota marcada</p>${PP.meterHTML()}<p class="small muted">Para los sostenidos di, por ejemplo, "fa sostenido" seguido.</p></div>`;
    } else box.innerHTML = `<div class="listen-box"><p data-heard class="heard">Escuchando...</p>${PP.meterHTML()}<p class="small muted">Puedes tocar cualquier nota que esté en pantalla: se destruye la que coincida, empezando por la más cercana a la clave.</p></div>`;
  }
  const target = () => G.notes.filter(n => !n.dead).sort((a, b) => a.x - b.x)[0];
  function hit(n){
    n.dead = true; G.combo++; G.hits++; G.maxCombo = Math.max(G.maxCombo, G.combo);
    const mult = Math.min(5, 1 + Math.floor(G.combo / 5)), pts = 10 * mult + Math.round(Math.max(0, n.x - defX()) / 20);
    G.score += pts;
    const col = cssVars().str[n.note.s];
    if(!reduced()) for(let k = 0; k < 16; k++){ const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 160; G.parts.push({x:n.x, y:yOf(n.note.d), vx:Math.cos(a) * v, vy:Math.sin(a) * v, life:.7, col}); }
    G.floats.push({x:n.x, y:yOf(n.note.d) - gap, txt:`+${pts}`, life:1, col:null});
    G.floats.push({x:n.x, y:yOf(n.note.d) + gap * 1.8, txt:PP.name(n.note), life:1, col});
    try{ if(mode === 'violin' || mode === 'voz'){ PP.click(0, true); PP.markOut(0, .12); } else PP.pluck(n.note.m); }catch(e){}
    if(G.combo === 10) PP.badge('combo10'); if(G.combo === 25) PP.badge('combo25'); if(G.combo === 50) PP.badge('combo50');
    if(G.combo > 0 && G.combo % 20 === 0 && G.lives < 5){ G.lives++; G.floats.push({x:W / 2, y:gap * 2, txt:'+1 vida', life:1.4, col:cssVars().ok}); }
    if(G.hits % 10 === 0){ G.level++; G.banner = {t:1.4, txt:'Nivel ' + G.level}; }
    const wh = PP.store.get('w-hits', {}); if(G.hits > (wh[world] || 0)){ wh[world] = G.hits; PP.store.set('w-hits', wh); }
    const k = STAR_AT.indexOf(G.hits);
    if(k >= 0){
      const ws = PP.store.get('w-stars', {});
      if((ws[world] || 0) < k + 1){
        ws[world] = k + 1; PP.store.set('w-stars', ws);
        G.banner = {t:2, txt:`¡${ORD[k].charAt(0).toUpperCase() + ORD[k].slice(1)} estrella!`};
        PP.toast(`<b>${ORD[k].charAt(0).toUpperCase() + ORD[k].slice(1)} estrella en ${WORLDS[world].t}</b><span>${k === 0 && world < WORLDS.length - 1 ? `Has abierto el mundo ${world + 2}: ${WORLDS[world + 1].t}. Puedes seguir jugando aquí para más estrellas.` : 'Sigue jugando para conseguir la siguiente.'}</span>`);
        try{ PP.pluck(81); PP.pluck(88, .12); }catch(e){}
        if(k === 2) PP.badge('estrellas3'); if(k === 0 && world === 3) PP.badge('mundo5'); if(k === 0 && world === 6) PP.badge('final');
      }
    }
    if(mode === 'mastil' && G.hits === 20) PP.badge('mastil20');
    if(mode === 'violin' && G.hits === 10) PP.badge('violin10');
    const tot = PP.store.get('game-hits', 0) + 1; PP.store.set('game-hits', tot); if(tot >= 100) PP.badge('cien'); if(tot >= 1000) PP.badge('mil');
    hud();
  }
  function wrong(n, el){
    G.combo = 0; n.shake = .35; n.x -= gap * .8;
    G.misses[n.note.id] = (G.misses[n.note.id] || 0) + 1;
    if(el){ el.classList.add('wrong'); setTimeout(() => el.classList.remove('wrong'), 300); }
    try{ PP.voice ? PP.voice(40, .18, 0, 'piano') : PP.click(0, false); if(mode === 'voz') PP.markOut(0, .25); }catch(e){}
    hud();
  }
  function answerName(name, el){
    if(!G || G.paused || G.over) return; const n = target(); if(!n) return;
    if(PP.name(n.note) === name){ hit(n); if(el){ el.classList.add('right'); setTimeout(() => el.classList.remove('right'), 200); } } else wrong(n, el);
  }
  function answerBoard(note, g){
    if(!G || G.paused || G.over) return; const n = target(); if(!n) return;
    const c = g && g.querySelector('circle');
    if(note.m === n.note.m){ hit(n); if(c){ c.style.fill = 'var(--ok)'; setTimeout(() => c.style.fill = '', 250); } }
    else { wrong(n); if(c){ c.style.fill = 'var(--bad)'; setTimeout(() => c.style.fill = '', 300); } }
  }
  function onKey(e){
    if(!G || G.over || mode !== 'nombre' || !document.contains(root) || root.closest('[hidden]')) return;
    if(e.key === 'p' || e.key === 'Escape'){ togglePause(); return; }
    const k = parseInt(e.key, 10); if(!k) return;
    const names = keysOf(); if(k <= names.length){ e.preventDefault(); answerName(names[k - 1], root.querySelectorAll('[data-n]')[k - 1]); }
  }
  document.addEventListener('keydown', onKey);
  function hud(){
    $('[data-score]', root).textContent = G.score; $('[data-combo]', root).textContent = G.combo; $('[data-level]', root).textContent = G.level;
    const mult = Math.min(5, 1 + Math.floor(G.combo / 5)); $('[data-mult]', root).textContent = mult > 1 ? '×' + mult : '';
    const st = (PP.store.get('w-stars', {})[world] || 0), nextAt = STAR_AT.find(x => x > G.hits);
    $('[data-goal]', root).innerHTML = nextAt ? `Estrella: <b>${G.hits}/${nextAt}</b> notas` : '<b>Tres estrellas</b>';
    $('[data-hearts]', root).innerHTML = Array.from({length:Math.max(G.lives, 3)}, (_, i) => `<svg viewBox="0 0 24 22" width="22" height="20" aria-hidden="true"><path d="M12 21 C5 15 1 11 1 6.5 A5.5 5.5 0 0 1 12 4 A5.5 5.5 0 0 1 23 6.5 C23 11 19 15 12 21Z" fill="${i < G.lives ? 'var(--mi)' : 'none'}" stroke="var(--mi)" stroke-width="2"/></svg>`).join('') + `<span class="visually-hidden">${G.lives} vidas</span>`;
  }
  function overlay(html){ const o = $('[data-ov]', root); o.innerHTML = html; o.hidden = false; const b = $('[data-menu-back]', o); if(b) b.addEventListener('click', toMenu); const r = $('[data-again]', o); if(r) r.addEventListener('click', start); const c = $('[data-cont]', o); if(c) c.addEventListener('click', togglePause); }
  function results(html){
    const r = $('[data-res]', root); r.innerHTML = html; r.hidden = false;
    $('[data-stage]', root).hidden = true; $('[data-answer]', root).hidden = true; $('[data-pause]', root).hidden = true;
    $('[data-again]', r).addEventListener('click', start); $('[data-menu-back]', r).addEventListener('click', toMenu);
    r.scrollIntoView({behavior:reduced() ? 'auto' : 'smooth', block:'nearest'});
  }
  function togglePause(){
    if(!G || G.over) return; G.paused = !G.paused; G.last = performance.now();
    $('[data-pause]', root).textContent = G.paused ? 'Seguir' : 'Pausa';
    if(G.paused) overlay(`<h3>Pausa</h3><div class="row"><button class="btn primary" type="button" data-cont>Seguir jugando</button><button class="btn" type="button" data-menu-back>Salir al menú</button></div>`);
    else $('[data-ov]', root).hidden = true;
  }
  $('[data-pause]', root).addEventListener('click', togglePause);
  function stopVoice(){ if(G && G.stopVoz){ G.stopVoz(); G.stopVoz = null; } }
  function toMenu(){ stopVoice(); if(G){ G.over = true; } cancelAnimationFrame(raf); if(mode === 'violin') PP.mic.stop(); $('[data-game]', root).hidden = true; $('[data-menu]', root).hidden = false; paintMenu(); }
  function gameOver(){
    stopVoice(); G.over = true; if(mode === 'violin') PP.mic.stop();
    const stars = STAR_AT.filter(x => G.hits >= x).length, prev = G.startStars;
    if(G.score >= 1000) PP.badge('p1000'); if(G.score >= 5000) PP.badge('p5000');
    const best = PP.store.get('def-best', {}), key = world + mode, rec = G.score > (best[key] || 0); if(rec){ best[key] = G.score; PP.store.set('def-best', best); }
    const miss = Object.entries(G.misses).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => PP.NOTES[id]);
    const next = world < WORLDS.length - 1 && stars > 0 && prev === 0 ? `<p class="ok" style="font-weight:700">Has desbloqueado el mundo ${world + 2}: ${WORLDS[world + 1].t}.</p>` : '';
    results(`<h3>${rec ? '¡Nuevo récord!' : 'Fin de la partida'}</h3>
      <div class="row" style="gap:22px"><div><small class="muted">Puntos</small><div class="big">${G.score}</div></div><div><small class="muted">Notas</small><div class="big">${G.hits}</div></div><div><small class="muted">Mejor combo</small><div class="big">${G.maxCombo}</div></div>
      <div class="stars big-stars" aria-label="${stars} estrellas">${[0, 1, 2].map(k => `<i class="${k < stars ? 'on' : ''}"></i>`).join('')}</div></div>
      <p class="small">${stars < 3 ? `<b>Te faltaron ${STAR_AT[stars] - G.hits} notas</b> para la ${ORD[stars]} estrella (${STAR_AT[stars]} notas en una partida).` : 'Tres estrellas en este mundo.'} ${stars === 0 && world < WORLDS.length - 1 ? `Con ella se abre el mundo ${world + 2}.` : ''}</p>${next}
      ${stars === 0 && G.hits < 6 ? '<p class="small muted">Consejo: activa "Notas con el color de su cuerda" en el menú y juega con calma las primeras partidas. Mirar dónde está la nota antes de pulsar es más rápido que adivinar.</p>' : ''}
      ${miss.length ? `<div class="review"><p class="small"><b>Para repasar:</b> las notas que más se te han escapado.</p><div class="row" style="gap:10px">${miss.map(n => `<div class="rev-card">${PP.staff([{id:n.id, dur:'w'}], {G:7, spacing:40, minWidth:110})}<b>${PP.name(n)}</b><small>${PP.where(n)}</small></div>`).join('')}</div></div>` : ''}
      <div class="row"><button class="btn primary" type="button" data-again>Jugar otra vez</button><button class="btn" type="button" data-menu-back>Elegir mundo</button></div>`);
  }
  function spawn(){
    let n; do{ n = pick(G.pool); }while(G.pool.length > 1 && n.id === G.lastId);
    G.lastId = n.id; G.notes.push({note:n, x:W + gap * 2, shake:0, dead:false});
  }
  function loop(now){
    if(!G || G.over) return;
    const dt = Math.min(.05, (now - G.last) / 1000); G.last = now;
    if(!G.paused){
      G.t += dt;
      const slow = mode === 'violin' ? 1.35 : mode === 'voz' ? 1.25 : mode === 'mastil' ? 1.25 : 1;
      const cross = Math.max(3.1, 7.4 - G.level * .42) * slow, speed = (W - defX()) / cross;
      G.spawnIn -= dt;
      const alive = G.notes.filter(n => !n.dead).length;
      if(alive === 0 && G.spawnIn > .35) G.spawnIn = .35;   // sin tiempos muertos: si no hay notas, sale otra enseguida
      if(G.spawnIn <= 0 && alive < 5){ spawn(); G.spawnIn = Math.max(.85, 2.7 - G.level * .17) * slow; }
      G.notes.forEach(n => { if(n.dead) return; n.x -= speed * dt; if(n.shake > 0) n.shake -= dt;
        if(n.x <= defX()){ n.dead = true; G.lives--; G.combo = 0; G.misses[n.note.id] = (G.misses[n.note.id] || 0) + 1;
          G.floats.push({x:defX() + gap * 2, y:yOf(n.note.d), txt:'Era ' + PP.name(n.note), life:1.6, col:cssVars().bad});
          try{ PP.voice ? PP.voice(n.note.m - 12, .35, 0, 'piano') : PP.click(0, true); }catch(e){}
          hud(); if(G.lives <= 0){ draw(); gameOver(); return; } } });
      G.notes = G.notes.filter(n => !n.dead || false);
      G.parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.life -= dt; }); G.parts = G.parts.filter(p => p.life > 0);
      G.floats.forEach(f => { f.y -= 30 * dt; f.life -= dt; }); G.floats = G.floats.filter(f => f.life > 0);
      if(G.banner) { G.banner.t -= dt; if(G.banner.t <= 0) G.banner = null; }
      if(mode === 'violin') listen(dt);
    }
    draw();
    if(!G.over) raf = requestAnimationFrame(loop);
  }
  /* Escucha: en cuanto dos lecturas seguidas coinciden (unos 30 ms) destruye la nota
     visible que suene igual. Para repetir la misma nota hace falta un nuevo golpe de arco. */
  function listen(){
    if(!PP.mic.analyser) return;
    if(!G.tr) G.tr = PP.tracker();
    const r = G.tr.step(), el = $('[data-heard]', root);
    PP.meter(root, r.level, r.ok);
    if(!r.ok){ if(el && r.level < .15) el.textContent = 'Escuchando...'; return; }
    const near = Math.round(r.midi);
    if(el){ el.textContent = 'Oigo: ' + (PP.useLetters() ? PP.LETTERS12 : PP.NAMES12)[((near % 12) + 12) % 12]; }
    if(!r.stable) return;
    const alive = G.notes.filter(n => !n.dead).sort((a, b) => a.x - b.x);
    const match = alive.find(n => Math.abs(r.midi - n.note.m) * 100 <= 50);
    if(!match){ if(el) el.className = 'heard'; return; }
    if(G.lastHitM === match.note.m && !r.fresh) return;
    G.tr.consume(); G.lastHitM = match.note.m;
    if(el) el.className = 'heard ok';
    hit(match);
  }
  function draw(){
    const c = cssVars();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = c.paper; ctx.fillRect(0, 0, W, H);
    // pentagrama
    ctx.strokeStyle = c.ink; ctx.lineWidth = Math.max(1, gap * .08);
    for(let k = 0; k < 5; k++){ const y = Math.round(yOf(2 + k * 2)) + .5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = c.ink; ctx.font = `${gap * 6}px NotoMusic, "Segoe UI Symbol", serif`; ctx.textBaseline = 'alphabetic';
    ctx.fillText('\u{1D11E}', gap * .4, yOf(2) + gap * 1.05);
    // línea de defensa
    ctx.save(); ctx.strokeStyle = c.la; ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(defX(), yOf(15)); ctx.lineTo(defX(), yOf(-5)); ctx.stroke(); ctx.restore();
    // notas
    const tg = target();
    G.notes.forEach(n => {
      if(n.dead) return;
      const x = n.x + (n.shake > 0 ? Math.sin(n.shake * 60) * 4 : 0), y = yOf(n.note.d), col = colors ? c.str[n.note.s] : c.ink;
      if(n === tg){ ctx.fillStyle = c.labg; ctx.beginPath(); ctx.arc(x, y, gap * 1.35, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = c.la; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.strokeStyle = c.ink; ctx.lineWidth = Math.max(1, gap * .09);
      for(let k = 0; k >= n.note.d; k -= 2){ ctx.beginPath(); ctx.moveTo(x - gap * 1.05, yOf(k)); ctx.lineTo(x + gap * 1.05, yOf(k)); ctx.stroke(); }
      for(let k = 12; k <= n.note.d; k += 2){ ctx.beginPath(); ctx.moveTo(x - gap * 1.05, yOf(k)); ctx.lineTo(x + gap * 1.05, yOf(k)); ctx.stroke(); }
      if(n.note.acc === '#') drawSharp(x - gap * 1.8, y, gap * .9, c.ink);
      ctx.save(); ctx.translate(x, y); ctx.rotate(-22 * Math.PI / 180); ctx.strokeStyle = col; ctx.lineWidth = gap * .22;
      ctx.beginPath(); ctx.ellipse(0, 0, gap * .66, gap * .46, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    });
    G.parts.forEach(p => { ctx.globalAlpha = Math.max(0, p.life / .7); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    G.floats.forEach(f => { ctx.globalAlpha = Math.min(1, f.life); ctx.fillStyle = f.col || c.ink; ctx.font = `800 ${Math.round(gap * 1.1)}px Bricolage, sans-serif`; ctx.fillText(f.txt, f.x, f.y); });
    ctx.globalAlpha = 1;
    if(G.banner){ ctx.globalAlpha = Math.min(1, G.banner.t); ctx.fillStyle = c.la; ctx.font = `800 ${Math.round(gap * 2.2)}px Bricolage, sans-serif`; ctx.fillText(G.banner.txt, W / 2 + gap * 2, gap * 2.4); ctx.globalAlpha = 1; }
    ctx.textAlign = 'start';
  }
  function drawSharp(x, y, g, col){
    ctx.strokeStyle = col; ctx.lineWidth = g * .1;
    ctx.beginPath(); ctx.moveTo(x - g * .22, y - g * 1.3); ctx.lineTo(x - g * .22, y + g * 1.35); ctx.moveTo(x + g * .22, y - g * 1.4); ctx.lineTo(x + g * .22, y + g * 1.25); ctx.stroke();
    ctx.lineWidth = g * .3; ctx.beginPath(); ctx.moveTo(x - g * .55, y - g * .3); ctx.lineTo(x + g * .55, y - g * .55); ctx.moveTo(x - g * .55, y + g * .55); ctx.lineTo(x + g * .55, y + g * .3); ctx.stroke();
  }
  root._state = () => G;
  /* Respuesta por voz: se compara con la nota marcada (la más cercana a la clave) */
  function onVoice(seq){
    if(!G || G.over || G.paused) return;
    const r = PP.voz.classify(seq), el = $('[data-heard]', root), n = target();
    if(!r || r.rejected){ if(el){ el.textContent = 'No te he entendido, repítelo'; el.className = 'heard'; } return; }
    if(el){ el.textContent = 'Has dicho: ' + r.label; }
    if(!n) return;
    if(((n.note.m % 12) + 12) % 12 === r.pc){ if(el) el.className = 'heard ok'; hit(n); }
    else { if(el) el.className = 'heard'; wrong(n); }
  }
  document.addEventListener('pp:voz', () => { if($('[data-menu]', root) && !$('[data-menu]', root).hidden) paintMenu(); });
  $('[data-start]', root).addEventListener('click', start);
  if('ResizeObserver' in window){ ro = new ResizeObserver(() => { if(G && !$('[data-game]', root).hidden){ const old = W; size(); if(G) G.notes.forEach(n => n.x *= W / old); if(G.paused || G.over) draw(); } }); ro.observe(root); }
  const vis = () => { if(document.hidden && G && !G.over && !G.paused) togglePause(); };
  document.addEventListener('visibilitychange', vis);
  const onSheet = () => { if(G && !G.over && !G.paused && document.contains(root)) togglePause(); };
  document.addEventListener('pp:chuleta', onSheet);
  root._dispose = () => { stopVoice(); document.removeEventListener('pp:chuleta', onSheet); if(G) G.over = true; cancelAnimationFrame(raf); if(ro) ro.disconnect(); document.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', vis); if(mode === 'violin') PP.mic.stop(); };
  paintMenu();
};

/* ---------- Parejas ---------- */
EX['parejas'] = function(root){
  let mode = PP.store.get('par-mode', 'nombre'), size = PP.store.get('par-size', 6), world = PP.store.get('par-world', 4);
  let cards = [], open = [], lock = false, moves = 0, found = 0, t0 = 0, timer = 0;
  root.innerHTML = `<div class="ex-head"><h3>Parejas</h3><span class="ex-kind">Juego de memoria</span></div>
    <p class="small muted">Da la vuelta a dos cartas. Si son la misma nota, se quedan boca arriba. Las cartas de pentagrama suenan al girarlas, así unes lo que ves con lo que oyes.</p>
    <div class="row"><div class="seg" role="group" aria-label="Tipo de parejas"><button type="button" data-m="nombre">Pentagrama y nombre</button><button type="button" data-m="dedo">Pentagrama y dedo</button><button type="button" data-m="sonido">Sonido y pentagrama</button></div>
      <div class="seg" role="group" aria-label="Tamaño"><button type="button" data-s="6">6 parejas</button><button type="button" data-s="8">8 parejas</button></div></div>
    <div class="row between"><label class="field pool-field">Notas<select data-world>${WORLDS.map((w, i) => `<option value="${i}"${i === world ? ' selected' : ''}>${w.t}</option>`).join('')}</select></label>
      <div class="score"><span>Movimientos <b data-moves>0</b></span><span>Tiempo <b data-time>0:00</b></span><span data-pbest></span></div></div>
    <div class="cards" data-cards></div>
    <div class="row"><button class="btn" data-new type="button">Nueva partida</button></div>
    <p class="feedback" data-fb aria-live="polite"></p>`;
  const segs = () => { root.querySelectorAll('[data-m]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === mode))); root.querySelectorAll('[data-s]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.s === size))); };
  const bkey = () => `${mode}-${size}`;
  const showBest = () => { const b = PP.store.get('par-best', {})[bkey()]; $('[data-pbest]', root).innerHTML = b ? `Récord <b>${fmt(b.t)}, ${b.m} mov.</b>` : ''; };
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function deal(){
    clearInterval(timer); timer = 0; t0 = 0; moves = 0; found = 0; open = []; lock = false;
    $('[data-moves]', root).textContent = 0; $('[data-time]', root).textContent = '0:00'; $('[data-fb]', root).textContent = '';
    let pool = shuffle(PP.pool(WORLDS[world].pool));
    const seen = new Set(), chosen = [];
    pool.forEach(n => { const k = mode === 'nombre' ? PP.name(n) : mode === 'dedo' ? n.s + n.f + (n.pos || '') : n.m; if(!seen.has(k) && chosen.length < size){ seen.add(k); chosen.push(n); } });
    if(chosen.length < size){ const extra = shuffle(PP.pool('todas')); extra.forEach(n => { const k = mode === 'nombre' ? PP.name(n) : mode === 'dedo' ? n.s + n.f + (n.pos || '') : n.m; if(!seen.has(k) && chosen.length < size && n.pos !== 'pos3'){ seen.add(k); chosen.push(n); } }); }
    cards = [];
    chosen.forEach((n, i) => {
      cards.push({pair:i, kind:mode === 'sonido' ? 'sonido' : 'staff', n});
      cards.push({pair:i, kind:mode === 'sonido' ? 'staff' : mode, n});
    });
    cards = shuffle(cards);
    $('[data-cards]', root).className = 'cards c' + (size === 8 ? 4 : 4);
    $('[data-cards]', root).innerHTML = cards.map((c, i) => `<button type="button" class="card" data-i="${i}" aria-label="Carta ${i + 1}, boca abajo"><span class="card-in"><span class="card-back" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="card-front">${face(c)}</span></span></button>`).join('');
    root.querySelectorAll('.card').forEach(b => b.addEventListener('click', () => flip(+b.dataset.i)));
    showBest();
  }
  function face(c){
    const n = c.n;
    if(c.kind === 'staff') return PP.staff([{id:n.id, dur:'w'}], {G:7, spacing:36, minWidth:96});
    if(c.kind === 'nombre') return `<b class="card-name">${PP.name(n)}</b>`;
    if(c.kind === 'dedo') return `<span class="card-finger"><span class="str ${PP.STRING_CLASS[n.s]}">${PP.strName(n.s)}</span><b>${n.f === 0 ? 'al aire' : 'dedo ' + n.f}</b>${n.pos && n.pos !== 'pos3' ? `<small>${n.pos}</small>` : ''}</span>`;
    return `<span class="card-sound"><svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><small>Escucha</small></span>`;
  }
  function flip(i){
    const c = cards[i], el = root.querySelector(`.card[data-i="${i}"]`);
    if(lock || c.done || open.indexOf(i) >= 0) return;
    if(!t0){ t0 = performance.now(); timer = setInterval(() => { $('[data-time]', root).textContent = fmt((performance.now() - t0) / 1000); }, 250); }
    el.classList.add('up'); el.setAttribute('aria-label', 'Carta boca arriba');
    if(c.kind === 'staff' || c.kind === 'sonido') PP.play(c.n.m, .8, 0, {vol:.16});
    open.push(i);
    if(open.length === 2){
      moves++; $('[data-moves]', root).textContent = moves;
      const [a, b] = open.map(k => cards[k]);
      const same = a.pair === b.pair || (mode === 'nombre' && PP.name(a.n) === PP.name(b.n) && a.kind !== b.kind);
      if(same){
        a.done = b.done = true; found++;
        open.forEach(k => root.querySelector(`.card[data-i="${k}"]`).classList.add('done'));
        open = [];
        $('[data-fb]', root).innerHTML = `<span class="ok">${PP.name(a.n)}</span>: está ${PP.where(a.n)}, cuerda ${PP.strName(a.n.s)}, ${PP.fingerText(a.n)}.`;
        if(found === cards.length / 2) win();
      } else {
        lock = true;
        setTimeout(() => { open.forEach(k => { const e = root.querySelector(`.card[data-i="${k}"]`); e.classList.remove('up'); e.setAttribute('aria-label', 'Carta boca abajo'); }); open = []; lock = false; }, 1000);
      }
    }
  }
  function win(){
    clearInterval(timer); const secs = (performance.now() - t0) / 1000;
    const best = PP.store.get('par-best', {}), k = bkey(), b = best[k], rec = !b || secs < b.t;
    if(rec){ best[k] = {t:Math.round(secs), m:moves}; PP.store.set('par-best', best); }
    $('[data-fb]', root).innerHTML = `<span class="ok">¡Completado en ${fmt(secs)} y ${moves} movimientos!</span> ${rec ? 'Es tu nuevo récord.' : ''} ${moves <= size + 3 ? 'Memoria excelente.' : ''}`;
    PP.badge('parejas'); if(size === 8 && secs < 60) PP.badge('parejas60'); if(mode === 'sonido') PP.badge('sonido');
    try{ PP.pluck(69); PP.pluck(73, .1); PP.pluck(76, .2); PP.pluck(81, .3); }catch(e){}
    showBest();
  }
  root.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.m; PP.store.set('par-mode', mode); segs(); deal(); }));
  root.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => { size = +b.dataset.s; PP.store.set('par-size', size); segs(); deal(); }));
  $('[data-world]', root).addEventListener('change', e => { world = +e.target.value; PP.store.set('par-world', world); deal(); });
  $('[data-new]', root).addEventListener('click', deal);
  root._dispose = () => clearInterval(timer);
  segs(); deal();
};

/* ---------- Insignias ---------- */
EX['insignias'] = function(root){
  root._paint = function(){
    const got = PP.store.get('logros', []);
    root.innerHTML = `<div class="ex-head"><h3>Tus insignias</h3><span class="ex-kind">${got.length} de ${PP.BADGES.length}</span></div>
      <div class="badges">${PP.BADGES.map(([id, t, d]) => { const on = got.indexOf(id) >= 0; return `<div class="badge${on ? ' on' : ''}">
        <svg viewBox="0 0 40 48" width="34" height="41" aria-hidden="true"><path d="M12 28 L8 46 L20 40 L32 46 L28 28" fill="${on ? 'var(--re)' : 'var(--soft)'}"/><circle cx="20" cy="18" r="15" fill="${on ? 'var(--la)' : 'var(--soft)'}" stroke="${on ? 'var(--ink)' : 'var(--rule)'}" stroke-width="2"/>${on ? '<path d="M13 18 l5 5 l9 -10" fill="none" stroke="var(--paper)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>' : ''}</svg>
        <span><b>${t}</b><small>${d}</small></span></div>`; }).join('')}</div>
      <p class="small muted">Notas acertadas en todos los juegos: <b>${PP.store.get('game-hits', 0)}</b></p>`;
  };
  root._paint();
};

/* ---------- Registro en el panel ---------- */
if(PP.TYPES && PP.TYPES.indexOf('Juegos') < 0) PP.TYPES.unshift('Juegos');
if(PP.CATALOG){
  PP.CATALOG.push({m:5, id:'m5-defiende', t:'Defiende la clave', type:'Juegos', ex:'defiende', attrs:{}},
    {m:5, id:'m5-parejas', t:'Parejas', type:'Juegos', ex:'parejas', attrs:{}},
    {m:8, id:'m8-defiende', t:'Defiende la clave en el mástil', type:'Juegos', ex:'defiende', attrs:{}},
    {m:5, id:'m5-voz', t:'Calibra tu voz para los juegos', type:'Juegos', ex:'voz-calibrar', attrs:{}},
    {m:8, id:'m8-asoc-juego', t:'Asociación: pentagrama y mástil', type:'Juegos', ex:'asociacion', attrs:{pools:'alto,la_mi,re_la,sol_re,bajo,mezcla,cuarto,completa'}});
}
})();
