/* Primera Posición: núcleo común (datos, audio, progreso, cabecera) */
(function(){
'use strict';
const PP = window.PP = window.PP || {};

/* ---------- Almacenamiento (solo en este navegador) ---------- */
PP.store = {
  get(k, d){ try{ const v = localStorage.getItem('pp:'+k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem('pp:'+k, JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem('pp:'+k); }catch(e){} },
  keys(){ const out=[]; try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k && k.indexOf('pp:')===0) out.push(k); } }catch(e){} return out; }
};

/* ---------- Notas de la primera posición ----------
   d: posición en el pentagrama (Do4 = 0, cada línea o espacio suma 1).
   m: número MIDI. s: cuerda. f: dedo. semi: semitonos sobre la cuerda al aire. */
const N = [
  ['G3','Sol','G',  -3,55,'Sol',0,0],
  ['A3','La','A',   -2,57,'Sol',1,2],
  ['B3','Si','B',   -1,59,'Sol',2,4,'alto'],
  ['C4','Do','C',    0,60,'Sol',3,5],
  ['D4f','Re','D',   1,62,'Sol',4,7],
  ['D4','Re','D',    1,62,'Re',0,0],
  ['E4','Mi','E',    2,64,'Re',1,2],
  ['F4','Fa','F',    3,65,'Re',2,3,'bajo'],
  ['Fs4','Fa♯','F♯', 3,66,'Re',2,4,'alto','#'],
  ['G4','Sol','G',   4,67,'Re',3,5],
  ['A4f','La','A',   5,69,'Re',4,7],
  ['A4','La','A',    5,69,'La',0,0],
  ['B4','Si','B',    6,71,'La',1,2],
  ['C5','Do','C',    7,72,'La',2,3,'bajo'],
  ['Cs5','Do♯','C♯', 7,73,'La',2,4,'alto','#'],
  ['D5','Re','D',    8,74,'La',3,5],
  ['E5f','Mi','E',   9,76,'La',4,7],
  ['E5','Mi','E',    9,76,'Mi',0,0],
  ['F5','Fa','F',   10,77,'Mi',1,1,'bajo'],
  ['Fs5','Fa♯','F♯',10,78,'Mi',1,2,null,'#'],
  ['G5','Sol','G',  11,79,'Mi',2,3,'bajo'],
  ['Gs5','Sol♯','G♯',11,80,'Mi',2,4,'alto','#'],
  ['A5','La','A',   12,81,'Mi',3,5],
  ['B5','Si','B',   13,83,'Mi',4,7],
  ['Cs4','Do♯','C♯', 0,61,'Sol',3,6,'alto','#'],
  ['C6','Do','C',   14,84,'Mi',3,8,'pos3'],
  ['D6','Re','D',   15,86,'Mi',4,10,'pos3']
];
PP.NOTES = {};
N.forEach(r => { PP.NOTES[r[0]] = {id:r[0], n:r[1], l:r[2], d:r[3], m:r[4], s:r[5], f:r[6], semi:r[7], pos:r[8]||null, acc:r[9]||null}; });
PP.STRINGS = ['Sol','Re','La','Mi'];
PP.STRING_CLASS = {Sol:'sol', Re:'re', La:'la', Mi:'mi'};
PP.STRING_LETTER = {Sol:'G', Re:'D', La:'A', Mi:'E'};
PP.POOLS = {
  open:      ['G3','D4','A4','E5'],
  naturales: ['G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5','C6','D6'],
  la_mi:     ['A4','B4','Cs5','D5','E5','Fs5','Gs5','A5'],
  re_la:     ['D4','E4','Fs4','G4','A4','B4','Cs5','D5'],
  sol_re:    ['G3','A3','B3','C4','D4','E4','Fs4','G4'],
  alto:      ['G3','A3','B3','C4','D4','E4','Fs4','G4','A4','B4','Cs5','D5','E5','Fs5','Gs5','A5'],
  bajo:      ['G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','Fs5','G5','A5'],
  mezcla:    ['G3','A3','B3','C4','D4','E4','F4','Fs4','G4','A4','B4','C5','Cs5','D5','E5','Fs5','G5','Gs5','A5'],
  cuarto:    ['G3','A3','B3','C4','D4f','E4','Fs4','G4','A4f','B4','Cs5','D5','E5f','Fs5','Gs5','A5','B5'],
  todas:     ['G3','A3','B3','C4','Cs4','D4','E4','F4','Fs4','G4','A4','B4','C5','Cs5','D5','E5','F5','Fs5','G5','Gs5','A5','B5','C6','D6'],
  // todos los dedos de la primera posición en las cuatro cuerdas: alto y bajo, cuarto dedo incluido
  completa:  ['G3','A3','B3','C4','Cs4','D4f','D4','E4','F4','Fs4','G4','A4f','A4','B4','C5','Cs5','D5','E5f','E5','F5','Fs5','G5','Gs5','A5','B5']
};
PP.POOL_NAMES = {
  open:'Cuerdas al aire', naturales:'Notas naturales, de Sol grave a Re agudo', la_mi:'Cuerdas La y Mi', re_la:'Cuerdas Re y La', sol_re:'Cuerdas Sol y Re',
  alto:'Primera posición, dedo 2 alto', bajo:'Primera posición, dedo 2 bajo', mezcla:'Dedo 2 alto y bajo mezclados', cuarto:'Con cuarto dedo', todas:'Todas las notas', completa:'Toda la primera posición, todos los dedos'
};
PP.READ_POOLS = ['naturales','todas','alto','mezcla','la_mi','re_la','sol_re','open'];
/* Selector de grupo de notas: recuerda la última elección de cada ejercicio */
PP.poolSelect = function(root, storeKey, keys, initial, onChange){
  let cur = PP.store.get('pool:' + storeKey, initial);
  if(keys.indexOf(cur) < 0) cur = initial;
  const id = 'ps' + Math.random().toString(36).slice(2, 8);
  const html = `<label class="field pool-field" for="${id}">Notas para practicar<select id="${id}" data-poolsel>${keys.map(k => `<option value="${k}"${k === cur ? ' selected' : ''}>${PP.POOL_NAMES[k]} (${new Set(PP.POOLS[k].map(i => PP.NOTES[i].m)).size} notas)</option>`).join('')}</select></label>`;
  return { html, get value(){ return cur; }, bind(){ const sel = root.querySelector('[data-poolsel]'); sel.addEventListener('change', () => { cur = sel.value; PP.store.set('pool:' + storeKey, cur); onChange(cur); }); } };
};
PP.pool = key => (PP.POOLS[key] || PP.POOLS.alto).map(id => PP.NOTES[id]);
PP.fingerText = n => n.pos === 'pos3' ? 'tercera posición, dedo ' + (n.f) : n.f === 0 ? 'cuerda al aire' : 'dedo ' + n.f + (n.pos ? ' ' + n.pos : '');
PP.useLetters = () => PP.store.get('letras', false);
PP.name = n => PP.useLetters() ? n.l : n.n;
PP.strName = s => PP.useLetters() ? PP.STRING_LETTER[s] : s;

/* ---------- Audio ---------- */
let ctx = null, master = null, volNode = null;
const volGain = v => v * v;  // curva perceptiva: el oído percibe el volumen de forma logarítmica
PP.ac = function(){
  if(!ctx){
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createDynamicsCompressor();
    master.threshold.value = -14; master.ratio.value = 3;
    volNode = ctx.createGain(); volNode.gain.value = volGain(PP.getVolume());
    master.connect(volNode); volNode.connect(ctx.destination);
  }
  if(ctx.state === 'suspended') ctx.resume();
  return ctx;
};
PP.getVolume = () => { const v = PP.store.get('volumen', 0.8); return PP.store.get('mudo', false) ? 0 : v; };
PP.out = () => { PP.ac(); return volNode; };
PP.setVolume = function(v, mute){
  if(v != null) PP.store.set('volumen', Math.max(0, Math.min(1, v)));
  if(mute != null) PP.store.set('mudo', mute);
  if(volNode){ const c = ctx; volNode.gain.cancelScheduledValues(c.currentTime); volNode.gain.setTargetAtTime(volGain(PP.getVolume()), c.currentTime, 0.03); }
  document.querySelectorAll('[data-vol]').forEach(i => { i.value = Math.round(PP.store.get('volumen', 0.8) * 100); });
  document.querySelectorAll('[data-mute]').forEach(b => { const m = PP.store.get('mudo', false); b.setAttribute('aria-pressed', String(m)); b.setAttribute('aria-label', m ? 'Activar sonido' : 'Silenciar'); b.innerHTML = speaker(m ? 0 : PP.store.get('volumen', 0.8)); });
};
function speaker(v){
  const waves = v === 0 ? '<path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' :
    '<path d="M16 9.5a4 4 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' + (v > .5 ? '<path d="M18.5 7a7.5 7.5 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' : '');
  return `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>${waves}</svg>`;
}
PP.hz = m => 440 * Math.pow(2, (m - 69) / 12);

/* Voz de violín sintetizada: dos sierras ligeramente desafinadas, vibrato tardío
   y dos resonancias de caja (aprox. 280 Hz y 2,8 kHz). opts.rough y opts.airy
   se usan en el laboratorio de sonido. */
PP.play = function(m, dur, when, opts){
  dur = dur || 0.9; when = when || 0; opts = opts || {};
  const c = PP.ac(), t = c.currentTime + when, f = opts.freq || PP.hz(m);
  const vol = opts.vol == null ? 0.2 : opts.vol;
  const out = c.createGain();
  const body1 = c.createBiquadFilter(); body1.type = 'peaking'; body1.frequency.value = 280; body1.Q.value = 1.4; body1.gain.value = 6;
  const body2 = c.createBiquadFilter(); body2.type = 'peaking'; body2.frequency.value = 2800; body2.Q.value = 1.2; body2.gain.value = opts.bright == null ? 4 : opts.bright;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = opts.cutoff || Math.min(6500, f * 9); lp.Q.value = 0.7;
  const mix = c.createGain(); mix.gain.value = 0.45;
  const o1 = c.createOscillator(), o2 = c.createOscillator();
  o1.type = o2.type = 'sawtooth'; o1.frequency.value = f; o2.frequency.value = f * 1.0035;
  const lfo = c.createOscillator(), lg = c.createGain();
  lfo.frequency.value = 5.3; lg.gain.setValueAtTime(0, t);
  if(opts.vibrato !== false) lg.gain.linearRampToValueAtTime(f * 0.0045, t + Math.min(0.5, dur * 0.6));
  lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
  o1.connect(mix); o2.connect(mix); mix.connect(body1); body1.connect(body2); body2.connect(lp); lp.connect(out);
  const nodes = [o1, o2, lfo];
  if(opts.rough || opts.airy){
    const len = Math.ceil(c.sampleRate * (dur + 0.1));
    const buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
    for(let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const ns = c.createBufferSource(); ns.buffer = buf;
    const nf = c.createBiquadFilter(), ng = c.createGain();
    if(opts.rough){ nf.type = 'bandpass'; nf.frequency.value = 900; nf.Q.value = 0.6; ng.gain.value = 0.55 * opts.rough;
      const am = c.createOscillator(), amg = c.createGain(); am.type = 'square'; am.frequency.value = 23; amg.gain.value = 0.5 * opts.rough;
      am.connect(amg); amg.connect(ng.gain); nodes.push(am); }
    else { nf.type = 'highpass'; nf.frequency.value = 3500; ng.gain.value = 0.35 * opts.airy; }
    ns.connect(nf); nf.connect(ng); ng.connect(out); nodes.push(ns);
  }
  out.connect(master);
  const atk = opts.attack || 0.06;
  out.gain.setValueAtTime(0.0001, t);
  out.gain.linearRampToValueAtTime(vol, t + atk);
  out.gain.setValueAtTime(vol, t + Math.max(atk + 0.02, dur - 0.1));
  out.gain.linearRampToValueAtTime(0.0001, t + dur);
  nodes.forEach(o => { o.start(t); o.stop(t + dur + 0.05); });
  if(PP.mic.stream && !opts.noMute) PP.markOut(when, dur);
  return { stop(){ try{ const n = c.currentTime; out.gain.cancelScheduledValues(n); out.gain.setValueAtTime(out.gain.value, n); out.gain.linearRampToValueAtTime(0.0001, n + 0.08); nodes.forEach(o => o.stop(n + 0.12)); }catch(e){} } };
};
PP.pluck = function(m, when){
  const c = PP.ac(), t = c.currentTime + (when || 0), f = PP.hz(m);
  const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
  o.type = 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 8, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.6);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
  o.connect(lp); lp.connect(g); g.connect(master); o.start(t); o.stop(t + 1.3);
  if(PP.mic.stream) PP.markOut(when, .9);
};
PP.click = function(when, accent){
  const c = PP.ac(), t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain();
  o.type = 'square'; o.frequency.value = accent ? 1650 : 1050;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(accent ? 0.3 : 0.16, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.06);
};

/* ---------- Detección de afinación (micrófono) ---------- */
/* Detector de altura de McLeod (MPM, "A smarter way to find pitch", 2005):
   función de diferencia cuadrada normalizada (NSDF) y elección del primer pico
   que supera el 86 % del máximo, lo que evita los errores de octava típicos de la
   autocorrelación simple. Devuelve {f, clarity} o null. Es una función pura para poder probarla. */
PP.detectPitch = function(b, sr, minF, maxF){
  minF = minF || 180; maxF = maxF || 1500;
  const N = b.length, maxLag = Math.min(N >> 1, Math.floor(sr / minF)), minLag = Math.max(2, Math.floor(sr / maxF)), W = N - maxLag;
  const sq = new Float64Array(N + 1);
  for(let i = 0; i < N; i++) sq[i + 1] = sq[i] + b[i] * b[i];
  const nsdf = new Float32Array(maxLag + 2), e0 = sq[W];
  for(let t = 0; t <= maxLag + 1 && t + W <= N; t++){
    let acf = 0; for(let j = 0; j < W; j++) acf += b[j] * b[j + t];
    const m = e0 + (sq[W + t] - sq[t]);
    nsdf[t] = m > 0 ? 2 * acf / m : 0;
  }
  let t = 1; while(t <= maxLag && nsdf[t] > 0) t++;
  if(t < minLag) t = minLag;
  const peaks = []; let inLobe = false, bt = -1, bv = -1;
  for(; t <= maxLag; t++){
    if(nsdf[t] > 0 && nsdf[t - 1] <= 0){ inLobe = true; bt = t; bv = nsdf[t]; }
    if(inLobe){ if(nsdf[t] > bv){ bv = nsdf[t]; bt = t; } if(nsdf[t] <= 0){ peaks.push([bt, bv]); inLobe = false; } }
  }
  if(inLobe && bt > 0) peaks.push([bt, bv]);
  if(!peaks.length) return null;
  const nmax = Math.max(...peaks.map(p => p[1]));
  const pk = peaks.find(p => p[1] >= .86 * nmax);
  const k = pk[0], y1 = nsdf[k - 1], y2 = nsdf[k], y3 = nsdf[k + 1];
  const den = y1 - 2 * y2 + y3, shift = den ? .5 * (y1 - y3) / den : 0;
  const f = sr / (k + shift);
  if(f < minF || f > maxF) return null;
  return {f, clarity:y2 - .25 * (y1 - y3) * shift};
};

/* Los sonidos de la propia web no deben confundirse con el violín */
PP._outUntil = 0;
PP.markOut = function(when, dur){ PP._outUntil = Math.max(PP._outUntil, performance.now() + ((when || 0) + (dur || 0)) * 1000 + 90); };

PP.mic = {
  stream:null, analyser:null, buf:null, rms:0, clarity:0, noise:.004,
  async start(){
    const c = PP.ac();
    if(this.stream) return true;
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Este navegador no permite usar el micrófono desde aquí. Prueba con Chrome, Edge o Firefox actualizados.');
    this.stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false, noiseSuppression:false, autoGainControl:false, channelCount:1}});
    const src = c.createMediaStreamSource(this.stream);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 120; hp.Q.value = .7;   // quita zumbidos y golpes graves
    this.analyser = c.createAnalyser(); this.analyser.fftSize = 2048;                                     // ~43 ms a 48 kHz
    src.connect(hp); hp.connect(this.analyser);
    this.buf = new Float32Array(this.analyser.fftSize);
    return true;
  },
  stop(){ if(this.stream){ this.stream.getTracks().forEach(t => t.stop()); } this.stream = null; this.analyser = null; },
  /* Un análisis: {ok, f, midi, clarity, rms, level} */
  analyze(){
    const out = {ok:false, f:-1, midi:0, clarity:0, rms:0, level:0};
    if(!this.analyser) return out;
    this.analyser.getFloatTimeDomainData(this.buf);
    const b = this.buf;
    let rms = 0; for(let i = 0; i < b.length; i++) rms += b[i] * b[i];
    rms = Math.sqrt(rms / b.length); this.rms = out.rms = rms;
    out.level = Math.max(0, Math.min(1, (20 * Math.log10(rms + 1e-9) + 62) / 50));
    if(performance.now() < PP._outUntil) return out;
    const thr = Math.max(.0015, this.noise * 2.2);
    if(rms < thr){ this.noise = Math.min(.05, this.noise < rms ? this.noise * 1.002 : this.noise * .7 + rms * .3); return out; }
    const r = PP.detectPitch(b, PP.ac().sampleRate);
    out.clarity = this.clarity = r ? r.clarity : 0;
    if(!r || r.clarity < .72){ this.noise = Math.min(.05, this.noise * .995 + rms * .005); return out; }
    out.ok = true; out.f = r.f; out.midi = 69 + 12 * Math.log2(r.f / 440);
    return out;
  },
  read(){ const a = this.analyze(); return a.ok ? a.f : -1; }
};

/* Seguidor de notas: estabiliza las lecturas y detecta cuándo empieza una nota nueva
   (cambio de arco, silencio breve, subida de volumen o salto de altura). */
PP.tracker = function(){
  return {
    prev:null, stable:null, gap:999, fresh:true, last:performance.now(), hist:[], consumedAt:0,
    step(){
      const now = performance.now(), dt = now - this.last; this.last = now;
      const a = PP.mic.analyze();
      this.hist.push([now, a.rms]); while(this.hist.length && now - this.hist[0][0] > 160) this.hist.shift();
      const res = {ok:false, stable:false, fresh:false, midi:0, rms:a.rms, level:a.level, clarity:a.clarity};
      if(!a.ok){ this.gap += dt; this.prev = null; if(this.gap > 40) this.fresh = true; if(this.peak && a.rms < this.peak * .5 && now - this.consumedAt > 90) this.dipped = true; return res; }
      // nuevo golpe de arco: un silencio breve, o el volumen cae a menos de la mitad
      // del máximo de la nota anterior (lo que ocurre al cambiar el arco de dirección)
      this.peak = Math.max(this.peak || 0, a.rms);
      if(now - this.consumedAt > 90 && a.rms < this.peak * .5) this.dipped = true;
      if(this.gap > 40 || (this.dipped && a.rms > this.peak * .6)) this.fresh = true;
      this.gap = 0;
      res.ok = true; res.midi = a.midi;
      if(this.prev != null && Math.abs(a.midi - this.prev) < .4){
        res.stable = true; res.midi = (a.midi + this.prev) / 2;
        if(this.stable != null && Math.abs(res.midi - this.stable) > .6) this.fresh = true;
        this.stable = res.midi;
      }
      this.prev = a.midi;
      res.fresh = this.fresh;
      return res;
    },
    consume(){ this.fresh = false; this.consumedAt = performance.now(); this.peak = 0; this.dipped = false; },
    reset(){ this.prev = null; this.stable = null; this.gap = 999; this.fresh = true; this.hist = []; this.peak = 0; this.dipped = false; this.last = performance.now(); }
  };
};
/* Medidor de entrada del micrófono */
PP.meterHTML = () => `<div class="mic-meter" aria-hidden="true"><i data-meter></i></div><p class="small muted" data-meter-tip></p>`;
PP.meter = function(root, level, ok){
  const m = root.querySelector('[data-meter]'); if(m){ m.style.width = Math.round(level * 100) + '%'; m.style.background = ok ? 'var(--ok)' : level > .25 ? 'var(--la)' : 'var(--rule)'; }
  const t = root.querySelector('[data-meter-tip]'); if(!t) return;
  root._lowT = level < .18 ? (root._lowT || performance.now()) : 0;
  t.textContent = root._lowT && performance.now() - root._lowT > 3000 ? 'Te oigo muy bajo: acerca el violín al micrófono o sube el volumen de entrada del micrófono en tu sistema.' : '';
};
PP.freqToMidi = f => 69 + 12 * Math.log2(f / 440);
PP.NAMES12 = ['Do','Do♯','Re','Re♯','Mi','Fa','Fa♯','Sol','Sol♯','La','La♯','Si'];
PP.LETTERS12 = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];

/* ---------- Módulos y progreso ---------- */
PP.LEVELS = [
  {n:1, t:'Primeros pasos', d:'El cuerpo, el arco y el primer sonido limpio en las cuatro cuerdas al aire.'},
  {n:2, t:'Leer y colocar los dedos', d:'El pentagrama, el ritmo y el mapa completo de la primera posición con el dedo 2 alto.'},
  {n:3, t:'Tocar música', d:'Escalas, el dedo 2 bajo, el cuarto dedo, corcheas y tus primeras piezas leídas.'}
];
/* ---------- Versión (js/version.js, generado por herramientas-dev/nueva_version.py) ---------- */
PP.VERSION = window.PP_VERSION || null;
PP.fechaLarga = iso => { const [y, m, d] = iso.split('-').map(Number); return d + ' de ' + ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][m - 1] + ' de ' + y; };
function versionBadge(){
  const V = PP.VERSION; if(!V || document.querySelector('[data-ver]')) return;
  const seen = PP.store.get('version-vista', null), isNew = seen && seen !== V.version;
  const box = document.createElement('div'); box.className = 'ver-corner'; box.dataset.ver = '';
  box.innerHTML = `<button type="button" class="ver-badge${isNew ? ' new' : ''}" aria-expanded="false" aria-controls="verPanel" title="Novedades de esta versión">v${V.version}${isNew ? ' · nuevo' : ''}</button>
    <div class="ver-panel" id="verPanel" role="dialog" aria-label="Novedades" hidden>
      <div class="row between"><b>Novedades</b><button type="button" class="btn small" data-ver-close>Cerrar</button></div>
      ${V.historial.map(h => `<section><p class="small"><b>Versión ${h.version}</b> <span class="muted">· ${PP.fechaLarga(h.fecha)}</span></p><ul>${h.cambios.map(c => `<li>${c}</li>`).join('')}</ul></section>`).join('')}
    </div>`;
  document.body.appendChild(box);
  const btn = box.querySelector('.ver-badge'), panel = box.querySelector('.ver-panel');
  const set = open => { panel.hidden = !open; btn.setAttribute('aria-expanded', String(open));
    if(open){ PP.store.set('version-vista', V.version); btn.classList.remove('new'); btn.textContent = 'v' + V.version; } };
  btn.addEventListener('click', () => set(panel.hidden));
  box.querySelector('[data-ver-close]').addEventListener('click', () => { set(false); btn.focus(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !panel.hidden){ set(false); btn.focus(); } });
  document.addEventListener('click', e => { if(!panel.hidden && !box.contains(e.target)) set(false); });
  if(!seen) PP.store.set('version-vista', V.version);
}

PP.MODULES = [
  {n:1, lv:1, t:'Conoce tu violín', d:'Partes del violín y del arco, cuidados y afinación', goals:[
    'Sé nombrar voluta, clavijas, diapasón, puente, cordal, mentonera y tensores',
    'Sé poner colofonia al arco y tensar y destensar la crin',
    'Reconozco de oído las cuatro cuerdas al aire: Sol, Re, La, Mi',
    'He hecho el ejercicio de partes del violín sin fallos']},
  {n:2, lv:1, t:'Postura y sujeción', d:'Cómo sostener el violín sin tensión', goals:[
    'Sostengo el violín con la cabeza y el hombro 30 segundos sin la mano izquierda',
    'Mi muñeca izquierda queda recta y el pulgar suelto',
    'Puedo tocar pizzicato en las cuatro cuerdas con buena postura',
    'He completado la rutina guiada de postura tres días distintos']},
  {n:3, lv:1, t:'La mano del arco', d:'Un agarre redondo, flexible y natural', goals:[
    'Formo el agarre sin mirar: pulgar doblado frente al dedo medio',
    'Hago los ejercicios del lápiz (limpiaparabrisas y arañita) sin tensión',
    'Sostengo el arco en vertical 30 segundos con la mano blanda',
    'He completado la rutina guiada del arco tres días distintos']},
  {n:4, lv:1, t:'Primer sonido', d:'Velocidad, peso y punto de contacto en cuerdas al aire', goals:[
    'Mi arco va paralelo al puente en la mitad del arco',
    'Sé qué cambiar si suena rasposo o si silba',
    'Cambio de cuerda moviendo el codo, sin tocar dos cuerdas',
    'Toco el ejercicio de cuerdas al aire a 60 con sonido limpio']},
  {n:5, lv:2, t:'El pentagrama', d:'Clave de sol, líneas, espacios y todas las notas del violín', goals:[
    'Me sé las líneas (Mi Sol Si Re Fa) y los espacios (Fa La Do Mi)',
    'Reconozco las cuatro cuerdas al aire escritas',
    'Reconozco todas las notas naturales, de Sol grave a Re agudo, con una racha de 15',
    'Consigo una racha de 15 en el juego de línea o espacio']},
  {n:6, lv:2, t:'Ritmo y pulso', d:'Redonda, blanca, negra, silencios y compás', goals:[
    'Sé cuántos pulsos dura cada figura',
    'Cuento en voz alta mientras toco con el metrónomo a 60',
    'Supero el nivel 1 del ejercicio de palmas con 80 % o más',
    'Toco cuerdas al aire leyendo el ritmo, sin parar']},
  {n:7, lv:2, t:'Dedos 1, 2 y 3', d:'La forma de la mano y el patrón 0‑1‑23', goals:[
    'Mi mano izquierda queda redonda y pisa con la yema',
    'Toco La, Si, Do♯, Re y Mi, Fa♯, Sol♯, La con dedos de base',
    'Asocio sin fallos las notas de las cuerdas La y Mi',
    'El ejercicio de micrófono me da verde en Si y Do♯']},
  {n:8, lv:2, t:'Primera posición completa', d:'Las cuatro cuerdas con el dedo 2 alto', goals:[
    'Sé dónde se escribe y dónde se toca cada nota de la primera posición',
    'Consigo una racha de 20 en la asociación con las cuatro cuerdas',
    'Leo una nota y la toco en menos de 3 segundos',
    'El ejercicio de micrófono me da verde en 8 notas distintas']},
  {n:9, lv:3, t:'Escalas y armaduras', d:'La mayor, Re mayor y Sol mayor', goals:[
    'Entiendo qué es una armadura y qué notas altera',
    'Toco la escala de La mayor y la de Re mayor, una octava, a 60',
    'Toco la escala de Sol mayor de una octava en las cuerdas Sol y Re',
    'Mantengo los dedos de base al subir la escala']},
  {n:10, lv:3, t:'Dedo 2 bajo y cuarto dedo', d:'El patrón 0‑12‑3 y el meñique', goals:[
    'Distingo el patrón 0‑1‑23 del 0‑12‑3',
    'Toco Do natural y Sol natural con el dedo 2 bajo',
    'Mi cuarto dedo suena igual que la cuerda al aire siguiente',
    'Supero la asociación con dedo 2 bajo con una racha de 15',
    'Toco la escala de Sol mayor de dos octavas despacio']},
  {n:11, lv:3, t:'Corcheas y arcos', d:'Subdividir el pulso, puntillo, détaché y ligado', goals:[
    'Cuento "1 y 2 y" con el metrónomo en corcheas',
    'Supero el nivel 2 del ejercicio de palmas con 80 % o más',
    'Toco détaché con arcos iguales y ligo dos notas en un arco',
    'Leo una blanca con puntillo y una negra con puntillo']},
  {n:12, lv:3, t:'Repertorio y lectura', d:'Piezas completas y lectura a primera vista', goals:[
    'Toco Estrellita y Oda a la alegría enteras sin parar',
    'Toco Martinillo y Au clair de la lune leyendo la partitura',
    'Leo a primera vista cinco ejercicios generados',
    'Me he grabado tocando una pieza y la he escuchado']}
];
PP.modFile = n => 'modulo-' + String(n).padStart(2, '0') + '.html';
PP.goalState = n => PP.store.get('mod' + n, []);
PP.modProgress = n => { const m = PP.MODULES[n - 1], s = PP.goalState(n); return s.filter(Boolean).length / m.goals.length; };
PP.stat = {
  get(k){ return PP.store.get('ex:' + k, {best:0, ok:0, tries:0}); },
  update(k, fn){ const s = PP.stat.get(k); fn(s); PP.store.set('ex:' + k, s); return s; }
};

/* ---------- Cabecera y pie ---------- */
PP.chrome = function(){
  const page = document.body.dataset.page || '';
  const h = document.querySelector('[data-header]');
  if(h){
    const link = (href, t, key) => `<a href="${href}"${page === key ? ' aria-current="page"' : ''}>${t}</a>`;
    h.outerHTML = `<header class="site-head"><div class="wrap">
      <a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Primera Posición</a>
      <nav class="site-nav" aria-label="Principal">
        ${link('index.html', 'Módulos', 'inicio')}
        ${link('practicar.html', 'Practicar', 'practicar')}
        ${link('juegos.html', 'Juegos', 'juegos')}
        ${link('herramientas.html', 'Afinador y metrónomo', 'herramientas')}
        ${link('como-estudiar.html', 'Cómo estudiar', 'estudiar')}
      </nav>
      <div class="vol" role="group" aria-label="Chuleta y volumen">
        <button type="button" class="btn small chuleta-btn" data-chuleta aria-haspopup="dialog"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 3h10l1 18H6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 3v18M14 3v18" stroke="currentColor" stroke-width="1.5"/></svg>Chuleta</button>
        <button type="button" class="vol-btn" data-mute aria-pressed="false"></button>
        <input type="range" min="0" max="100" step="1" data-vol aria-label="Volumen general">
      </div></div></header>`;
    document.querySelectorAll('[data-vol]').forEach(i => i.addEventListener('input', () => { const v = +i.value / 100; PP.setVolume(v, v === 0 ? true : false); }));
    document.querySelectorAll('[data-mute]').forEach(b => b.addEventListener('click', () => { const m = !PP.store.get('mudo', false); if(!m && PP.store.get('volumen', 0.8) === 0) PP.store.set('volumen', 0.6); PP.setVolume(null, m); if(!m) PP.pluck(69); }));
    PP.setVolume();
  }
  versionBadge();
  const f = document.querySelector('[data-footer]');
  if(f){
    f.outerHTML = `<footer class="site-foot"><div class="wrap">
      <p>Primera Posición. Un curso de violín para empezar desde cero.</p>
      <p>Tu progreso se guarda solo en este navegador. <button class="btn small" id="resetAll" type="button">Borrar mi progreso</button></p>
      ${PP.VERSION ? `<p class="small muted">Versión ${PP.VERSION.version}, ${PP.fechaLarga(PP.VERSION.fecha)}.</p>` : ''}
    </div></footer>`;
    const r = document.getElementById('resetAll');
    if(r){
      let armed = false;
      r.addEventListener('click', () => {
        if(!armed){ armed = true; r.textContent = 'Pulsa otra vez para borrar todo'; setTimeout(() => { armed = false; r.textContent = 'Borrar mi progreso'; }, 4000); return; }
        PP.store.keys().forEach(k => { try{ localStorage.removeItem(k); }catch(e){} });
        location.reload();
      });
    }
  }
};

/* ---------- Página de módulo ---------- */
PP.modulePage = function(){
  const n = +document.body.dataset.module; if(!n) return;
  const m = PP.MODULES[n - 1], lv = PP.LEVELS[m.lv - 1];
  PP.store.set('last', n);
  const meta = document.querySelector('[data-mod-meta]');
  if(meta) meta.innerHTML = `<span>Nivel ${lv.n}: ${lv.t}</span><span>Módulo ${n} de ${PP.MODULES.length}</span><span data-mod-status></span>`;
  const g = document.querySelector('[data-goals]');
  const status = () => {
    const p = PP.modProgress(n), el = document.querySelector('[data-mod-status]');
    if(el) el.innerHTML = p === 1 ? '<span class="done-badge">✓ Módulo completado</span>' : (p > 0 ? `${Math.round(p * 100)} % completado` : 'Sin empezar');
    const bar = document.querySelector('[data-goal-bar]'); if(bar) bar.style.width = (p * 100) + '%';
    const msg = document.querySelector('[data-goal-msg]');
    if(msg) msg.textContent = p === 1 ? 'Has cumplido todos los objetivos. Puedes pasar al siguiente módulo cuando quieras, y volver aquí a repasar.' : 'Marca cada objetivo cuando te salga bien de verdad, no la primera vez que lo intentas.';
  };
  if(g){
    const st = PP.goalState(n);
    g.innerHTML = `<div class="row between"><h2>Objetivos del módulo</h2></div>
      <p class="muted" data-goal-msg></p>
      <div class="progress" aria-hidden="true"><i data-goal-bar style="width:0"></i></div>
      <div style="display:grid;gap:10px">${m.goals.map((t, i) => `<label class="goal" for="goal${i}"><input type="checkbox" id="goal${i}" ${st[i] ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div>`;
    g.querySelectorAll('input').forEach((cb, i) => cb.addEventListener('change', () => { const s = PP.goalState(n); s[i] = cb.checked; PP.store.set('mod' + n, s); status(); }));
  }
  status();
  const pager = document.querySelector('[data-pager]');
  if(pager){
    const prev = PP.MODULES[n - 2], next = PP.MODULES[n];
    pager.innerHTML = (prev ? `<a href="${PP.modFile(prev.n)}"><small>Módulo anterior</small><b>${prev.n}. ${prev.t}</b></a>` : `<a href="index.html"><small>Volver</small><b>Mapa de módulos</b></a>`) +
      (next ? `<a class="next" href="${PP.modFile(next.n)}"><small>Siguiente módulo</small><b>${next.n}. ${next.t}</b></a>` : `<a class="next" href="index.html"><small>Has llegado al final</small><b>Mapa de módulos</b></a>`);
  }
  // Índice lateral: marca la lección visible
  const links = [...document.querySelectorAll('.mod-toc a')];
  if(links.length && 'IntersectionObserver' in window){
    const io = new IntersectionObserver(es => { es.forEach(e => { if(e.isIntersecting){ links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)); } }); }, {rootMargin:'-30% 0px -60% 0px'});
    document.querySelectorAll('.lesson[id]').forEach(s => io.observe(s));
  }
};

document.addEventListener('DOMContentLoaded', () => { PP.chrome(); PP.modulePage(); });
})();
