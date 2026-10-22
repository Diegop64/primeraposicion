/* Primera Posición: responder con la voz ("sol", "la", "fa sostenido").
   Todo ocurre dentro del navegador: el sonido del micrófono se analiza en memoria,
   no se graba, no se guarda y no se envía a ningún sitio. Lo único que se puede
   guardar (si lo permites) son unos pocos números por palabra que describen tu voz,
   en este navegador, y se borran con un botón.

   Método: reconocimiento de palabras aisladas por comparación de patrones.
   Coeficientes cepstrales en escala mel (MFCC) y alineamiento temporal dinámico (DTW)
   contra tus propias muestras de calibración: el método clásico para vocabularios
   pequeños y un solo hablante. */
(function(){
'use strict';
const PP = window.PP = window.PP || {};
const SR = 16000, WIN = 400, HOP = 160, NFFT = 512, NMEL = 26, NCEP = 13;
const WORDS = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];
const SHARP = 'sostenido';
const PC = {do:0, re:2, mi:4, fa:5, sol:7, la:9, si:11};

/* ---------- Características (MFCC) ---------- */
const hamming = new Float32Array(WIN).map((_, i) => .54 - .46 * Math.cos(2 * Math.PI * i / (WIN - 1)));
const mel = f => 2595 * Math.log10(1 + f / 700), imel = m => 700 * (Math.pow(10, m / 2595) - 1);
const fbank = (() => {
  const lo = mel(80), hi = mel(7600), pts = [];
  for(let i = 0; i < NMEL + 2; i++) pts.push(Math.floor((NFFT + 1) * imel(lo + (hi - lo) * i / (NMEL + 1)) / SR));
  const fb = [];
  for(let m = 1; m <= NMEL; m++){
    const w = new Float32Array(NFFT / 2 + 1);
    for(let k = pts[m - 1]; k < pts[m]; k++) w[k] = (k - pts[m - 1]) / Math.max(1, pts[m] - pts[m - 1]);
    for(let k = pts[m]; k < pts[m + 1]; k++) w[k] = (pts[m + 1] - k) / Math.max(1, pts[m + 1] - pts[m]);
    fb.push(w);
  }
  return fb;
})();
const dct = (() => { const d = []; for(let c = 0; c < NCEP; c++){ const r = new Float32Array(NMEL); for(let m = 0; m < NMEL; m++) r[m] = Math.cos(Math.PI * c * (m + .5) / NMEL); d.push(r); } return d; })();
function fft(re, im){
  const n = re.length;
  for(let i = 1, j = 0; i < n; i++){ let bit = n >> 1; for(; j & bit; bit >>= 1) j ^= bit; j ^= bit; if(i < j){ [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for(let len = 2; len <= n; len <<= 1){
    const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for(let i = 0; i < n; i += len){
      let cr = 1, ci = 0;
      for(let k = 0; k < len / 2; k++){
        const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
const _re = new Float32Array(NFFT), _im = new Float32Array(NFFT);
/* Un fotograma de 25 ms (ya con preénfasis) → [energía, c1..c12] */
function frameFeat(x, off){
  let e = 0;
  for(let i = 0; i < NFFT; i++){ const v = i < WIN ? x[off + i] * hamming[i] : 0; _re[i] = v; _im[i] = 0; e += v * v; }
  fft(_re, _im);
  const pw = new Float32Array(NFFT / 2 + 1);
  for(let k = 0; k <= NFFT / 2; k++) pw[k] = _re[k] * _re[k] + _im[k] * _im[k];
  const lm = new Float32Array(NMEL);
  for(let m = 0; m < NMEL; m++){ let s = 0; const w = fbank[m]; for(let k = 0; k < w.length; k++) if(w[k]) s += w[k] * pw[k]; lm[m] = Math.log(s + 1e-10); }
  const f = new Float32Array(NCEP);
  f[0] = Math.log(e + 1e-10);
  for(let c = 1; c < NCEP; c++){ let s = 0; for(let m = 0; m < NMEL; m++) s += dct[c][m] * lm[m]; f[c] = s; }
  return f;
}
/* Prepara una secuencia para comparar: normalización de media cepstral, energía relativa y deltas */
function prep(seq){
  const n = seq.length, D = NCEP, out = [];
  const mean = new Float32Array(D); seq.forEach(f => { for(let d = 1; d < D; d++) mean[d] += f[d] / n; });
  const emax = Math.max(...seq.map(f => f[0]));
  const st = seq.map(f => { const g = new Float32Array(D); g[0] = (f[0] - emax) * .3; for(let d = 1; d < D; d++) g[d] = f[d] - mean[d]; return g; });
  for(let t = 0; t < n; t++){
    const g = new Float32Array(2 * D), a = st[Math.max(0, t - 2)], b = st[Math.max(0, t - 1)], c = st[Math.min(n - 1, t + 1)], d2 = st[Math.min(n - 1, t + 2)];
    for(let d = 0; d < D; d++){ g[d] = st[t][d]; g[D + d] = ((c[d] - b[d]) + 2 * (d2[d] - a[d])) / 10 * 1.5; }
    out.push(g);
  }
  return out;
}
/* Alineamiento temporal dinámico con banda de Sakoe-Chiba, normalizado por longitud */
function dtw(a, b){
  const n = a.length, m = b.length, band = Math.max(Math.abs(n - m) + 2, Math.ceil(.45 * Math.max(n, m)));
  let prev = new Float64Array(m + 1).fill(Infinity), cur = new Float64Array(m + 1).fill(Infinity); prev[0] = 0;
  const dist = (x, y) => { let s = 0; for(let d = 0; d < x.length; d++){ const v = x[d] - y[d]; s += v * v; } return Math.sqrt(s); };
  for(let i = 1; i <= n; i++){
    cur.fill(Infinity);
    const jc = Math.round(i * m / n), j0 = Math.max(1, jc - band), j1 = Math.min(m, jc + band);
    for(let j = j0; j <= j1; j++){ const c = dist(a[i - 1], b[j - 1]); cur[j] = c + Math.min(prev[j - 1], prev[j] + c * .0, cur[j - 1]); }
    [prev, cur] = [cur, prev];
  }
  return prev[m] / (n + m);
}
/* Extrae las características de una señal ya a 16 kHz (para pruebas y muestras guardadas) */
function featuresOf(sig){
  const x = new Float32Array(sig.length); x[0] = sig[0]; for(let i = 1; i < sig.length; i++) x[i] = sig[i] - .97 * sig[i - 1];
  const out = []; for(let off = 0; off + WIN <= x.length; off += HOP) out.push(frameFeat(x, off));
  return trim(out);
}
/* Recorta silencio al principio y al final según la energía */
function trim(seq){
  if(!seq.length) return seq;
  const emax = Math.max(...seq.map(f => f[0])), th = emax - 6.5;  // ~28 dB por debajo del máximo
  let a = 0, b = seq.length - 1;
  while(a < b && seq[a][0] < th) a++;
  while(b > a && seq[b][0] < th) b--;
  return seq.slice(Math.max(0, a - 2), Math.min(seq.length, b + 3));
}

/* ---------- Reconocedor ---------- */
function Recognizer(templates){
  this.t = templates || {};   // {palabra: [secuencia sin preparar, ...]}
}
Recognizer.prototype.ready = function(){ return WORDS.every(w => (this.t[w] || []).length >= 1); };
Recognizer.prototype.hasSharp = function(){ return (this.t[SHARP] || []).length >= 1; };
/* Devuelve {word, sharp, name, dist, margin} o null */
Recognizer.prototype.classify = function(seq){
  if(!this.ready() || seq.length < 6) return null;
  const u = prep(seq), res = [];
  const cache = {};
  WORDS.forEach(w => this.t[w].forEach(tp => {
    const k = w; const d = dtw(u, cache[w + tp.length] || (cache[w + tp.length] = prep(tp)));
    res.push({w, sharp:false, d});
  }));
  if(this.hasSharp() && seq.length > 22){
    WORDS.forEach(w => this.t[w].forEach(tp => this.t[SHARP].forEach(sp => {
      res.push({w, sharp:true, d:dtw(u, prep(tp.concat(sp)))});
    })));
  }
  const best = {};
  res.forEach(r => { const k = r.w + (r.sharp ? '#' : ''); if(!best[k] || r.d < best[k].d) best[k] = r; });
  const list = Object.values(best).sort((a, b) => a.d - b.d);
  const top = list[0], second = list.find(r => r.w !== top.w || r.sharp !== top.sharp);
  return {word:top.w, sharp:top.sharp, pc:(PC[top.w] + (top.sharp ? 1 : 0)) % 12, dist:top.d, margin:second ? second.d - top.d : 1};
};

/* ---------- Escucha continua con detección de voz ---------- */
const store = {
  load(){ try{ const raw = PP.store.get('voz-patrones', null); if(!raw) return {}; const t = {}; Object.entries(raw).forEach(([w, arr]) => { t[w] = arr.map(seq => seq.map(f => Float32Array.from(f))); }); return t; }catch(e){ return {}; } },
  save(t){ if(!PP.store.get('voz-guardar', true)) return; const raw = {}; Object.entries(t).forEach(([w, arr]) => { raw[w] = arr.map(seq => seq.map(f => Array.from(f, v => +v.toFixed(3)))); }); PP.store.set('voz-patrones', raw); },
  clear(){ PP.store.del('voz-patrones'); }
};
PP.voz = {
  WORDS, SHARP, PC, featuresOf, prep, dtw, Recognizer, store,
  templates:null,
  rec(){ if(!this.templates) this.templates = store.load(); return new Recognizer(this.templates); },
  calibrated(){ return this.rec().ready(); },
  forget(){ this.templates = {}; store.clear(); },
  /* Abre el micrófono y llama a onWord(resultado) por cada palabra; onLevel(0..1, hablando) para el medidor.
     Devuelve una función para parar. */
  async listen(onUtterance, onLevel){
    const c = PP.ac();
    const stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true, noiseSuppression:false, autoGainControl:true, channelCount:1}});
    const src = c.createMediaStreamSource(stream);
    const proc = c.createScriptProcessor(2048, 1, 1);
    const mute = c.createGain(); mute.gain.value = 0;
    src.connect(proc); proc.connect(mute); mute.connect(c.destination);
    const ratio = c.sampleRate / SR;
    let pos = 0, last = 0, pre = 0;
    const ring = new Float32Array(WIN + HOP * 4); let fill = 0;
    let noise = -9, peak = 0, speaking = false, onCount = 0, offCount = 0, frames = [], preroll = [];
    proc.onaudioprocess = ev => {
      const inp = ev.inputBuffer.getChannelData(0);
      const out16 = [];
      // remuestreo lineal a 16 kHz
      while(pos < inp.length){ const i = Math.floor(pos), f = pos - i; const a = i === 0 ? last : inp[i - 1], b = inp[i]; out16.push(a + (b - a) * f); pos += ratio; }
      pos -= inp.length; last = inp[inp.length - 1];
      for(const s of out16){
        const v = s - .97 * pre; pre = s;
        ring[fill++] = v;
        if(fill === WIN){
          const f = frameFeat(ring, 0);
          ring.copyWithin(0, HOP, WIN); fill = WIN - HOP;
          step(f);
        }
      }
    };
    function step(f){
      const own = performance.now() < (PP._outUntil || 0);
      const e = f[0];
      if(!speaking){
        if(!own) noise = e < noise + 1.2 ? noise * .96 + e * .04 : noise + .002;
        preroll.push(f); if(preroll.length > 12) preroll.shift();
        if(!own && e > noise + 2.6) onCount++; else onCount = 0;
        if(onCount >= 3){ speaking = true; frames = preroll.slice(); offCount = 0; peak = e; }
      } else {
        frames.push(f); if(e > peak) peak = e;
        // fin de la palabra: vuelve el ruido de fondo, o la energía cae muy por debajo del pico
        // (así no se queda "escuchando" si el ruido de la sala sube mientras hablas)
        if(e < noise + 1.4 || e < peak - 5.5) offCount++; else offCount = 0;
        if(offCount >= 22 || frames.length > 160){
          speaking = false; onCount = 0;
          const seq = trim(frames.slice(0, frames.length - Math.max(0, offCount - 3)));
          preroll = [];
          if(PP.voz._debug) PP.voz._debug({n: frames.length, seq: seq.length, noise, peak});
          if(seq.length >= 6 && seq.length <= 140) onUtterance(seq);
        }
      }
      if(onLevel) onLevel(Math.max(0, Math.min(1, (e - noise) / 6)), speaking);
    }
    return () => { proc.onaudioprocess = null; try{ src.disconnect(); proc.disconnect(); mute.disconnect(); }catch(e){} stream.getTracks().forEach(t => t.stop()); };
  }
};

/* Umbral de rechazo: distancia típica entre tus propias repeticiones de una palabra */
function threshold(t){
  const ds = [];
  WORDS.forEach(w => { const a = (t[w] || []).map(prep); for(let i = 0; i < a.length; i++) for(let j = i + 1; j < a.length; j++) ds.push(dtw(a[i], a[j])); });
  if(!ds.length) return Infinity;
  ds.sort((a, b) => a - b);
  return ds[Math.floor(ds.length * .9)] * 1.7;
}
PP.voz.classify = function(seq){
  const R = this.rec(), r = R.classify(seq); if(!r) return null;
  if(this._thr == null) this._thr = threshold(this.templates);
  // se descarta si se parece poco a todo (ruido, el violín, otra palabra) o si duda entre dos notas
  r.rejected = r.dist > this._thr * 1.45 || (r.dist > this._thr && (r.margin || 0) < 1.5);
  r.label = r.word.charAt(0).toUpperCase() + r.word.slice(1) + (r.sharp ? ' sostenido' : '');
  return r;
};

/* ---------- Calibración ---------- */
const $ = (s, el) => (el || document).querySelector(s);
const PRIV = `<div class="callout privacy"><b>Tu voz no sale de este ordenador</b>El reconocimiento funciona entero dentro de tu navegador. El sonido del micrófono se analiza en el momento y se descarta: no se graba, no se envía a ningún servidor y no se usa para nada más que para estos juegos. Si lo permites, se guardan en este navegador unos pocos números por palabra (no audio) para no tener que calibrar cada vez. Puedes borrarlos cuando quieras.</div>`;
PP.EX = PP.EX || {};
PP.EX['voz-calibrar'] = function(root){
  const steps = [...WORDS.map(w => [w, w.charAt(0).toUpperCase() + w.slice(1)]), [SHARP, 'Sostenido']];
  const REP = 3;
  let stop = null, tmp = null, k = 0, mode = 'idle';
  root.innerHTML = `<div class="ex-head"><h3>Tu voz para los juegos</h3><span class="ex-kind">Calibración, 1 minuto</span></div>
    ${PRIV}
    <p class="small muted">Di cada palabra tres veces cuando aparezca, con tu voz normal y una pequeña pausa entre repeticiones. Al final dirás "sostenido" para poder responder "fa sostenido", "do sostenido"... de corrido.</p>
    <label class="row small" style="gap:8px;cursor:pointer"><input type="checkbox" data-save ${PP.store.get('voz-guardar', true) ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--ink)">Recordar mi calibración en este navegador (solo números, nunca audio)</label>
    <div class="voz-stage" data-stage></div>
    <div class="row" data-btns></div>`;
  $('[data-save]', root).addEventListener('change', e => { PP.store.set('voz-guardar', e.target.checked); if(!e.target.checked) store.clear(); else if(PP.voz.calibrated()) store.save(PP.voz.templates); });
  const stage = $('[data-stage]', root), btns = $('[data-btns]', root);
  function idle(){
    mode = 'idle';
    const ok = PP.voz.calibrated();
    stage.innerHTML = ok ? `<p><span class="done-badge">✓ Voz calibrada</span>${PP.voz.rec().hasSharp() ? '' : ' (sin "sostenido")'}</p>` : '<p class="muted">Aún no has calibrado tu voz.</p>';
    btns.innerHTML = `<button class="btn primary" type="button" data-go>${ok ? 'Calibrar de nuevo' : 'Empezar la calibración'}</button>${ok ? '<button class="btn" type="button" data-test>Probar el reconocimiento</button><button class="btn" type="button" data-forget>Borrar mi voz</button>' : ''}`;
    $('[data-go]', btns).addEventListener('click', start);
    const t = $('[data-test]', btns); if(t) t.addEventListener('click', test);
    const f = $('[data-forget]', btns); if(f) f.addEventListener('click', () => { PP.voz.forget(); PP.voz._thr = null; idle(); document.dispatchEvent(new CustomEvent('pp:voz')); });
  }
  function prompt(){
    const [w, label] = steps[Math.floor(k / REP)], rep = k % REP + 1;
    stage.innerHTML = `<p class="muted small">Palabra ${Math.floor(k / REP) + 1} de ${steps.length}, repetición ${rep} de ${REP}</p><p class="voz-word">Di: <b>${label}</b></p>${PP.meterHTML()}<p class="small muted" data-vmsg></p>`;
  }
  async function start(){
    halt(); tmp = {}; k = 0; mode = 'cal';
    btns.innerHTML = `<button class="btn" type="button" data-undo>Repetir la anterior</button><button class="btn" type="button" data-skip>Saltar "sostenido"</button><button class="btn" type="button" data-cancel>Cancelar</button>`;
    $('[data-undo]', btns).addEventListener('click', () => { if(k > 0){ k--; const w = steps[Math.floor(k / REP)][0]; tmp[w].pop(); prompt(); } });
    $('[data-skip]', btns).addEventListener('click', () => { if(Math.floor(k / REP) >= WORDS.length) finish(); else { const m = $('[data-vmsg]', root); if(m) m.textContent = 'Este botón sirve cuando llegues a "sostenido". Primero di las siete notas.'; } });
    $('[data-cancel]', btns).addEventListener('click', () => { halt(); idle(); });
    prompt();
    try{ stop = await PP.voz.listen(seq => {
      if(mode !== 'cal') return;
      const w = steps[Math.floor(k / REP)][0];
      if(w !== SHARP && seq.length > 60){ const m = $('[data-vmsg]', root); if(m) m.textContent = 'Ha sido demasiado largo: di solo la palabra.'; return; }
      (tmp[w] = tmp[w] || []).push(seq); k++;
      PP.click(0, true); PP.markOut(0, .1);
      if(k >= steps.length * REP) finish(); else prompt();
    }, lv => PP.meter(root, lv, lv > .4)); }
    catch(err){ stage.innerHTML = `<p><span class="bad" style="color:var(--bad);font-weight:700">No se ha podido usar el micrófono.</span> ${err && err.name === 'NotAllowedError' ? 'Permite el micrófono en el candado de la barra de direcciones y recarga.' : (err.message || '')}</p>`; idle(); }
  }
  function finish(){
    halt();
    if(!WORDS.every(w => (tmp[w] || []).length)){ idle(); return; }
    PP.voz.templates = tmp; PP.voz._thr = null; store.save(tmp);
    document.dispatchEvent(new CustomEvent('pp:voz'));
    if(!document.contains(root)) return;   // el juego ya ha cerrado la calibración
    stage.innerHTML = '<p><span class="done-badge">✓ Calibración terminada</span> Ahora pruébalo: di cualquier nota.</p>';
    test();
  }
  async function test(){
    halt(); mode = 'test';
    stage.innerHTML = `<p class="voz-word" data-heard>Di una nota...</p>${PP.meterHTML()}<p class="small muted">Si alguna palabra falla a menudo, vuelve a calibrar hablando como lo harás al jugar.</p>`;
    btns.innerHTML = `<button class="btn" type="button" data-end>Terminar la prueba</button>`;
    $('[data-end]', btns).addEventListener('click', () => { halt(); idle(); });
    try{ stop = await PP.voz.listen(seq => { const r = PP.voz.classify(seq); const h = $('[data-heard]', root); if(h) h.innerHTML = !r ? 'No te he entendido' : r.rejected ? `No estoy seguro (¿<b>${r.label}</b>?)` : `Has dicho: <b>${r.label}</b>`; }, lv => PP.meter(root, lv, lv > .4)); }
    catch(err){ idle(); }
  }
  function halt(){ if(stop){ stop(); stop = null; } }
  root._dispose = halt;
  idle();
};
})();
