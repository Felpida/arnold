'use strict';

/* ═══════════════════ ARRANQUE Y NAVEGACIÓN ═══════════════════ */

const App = {
  view:'hoy',

  async init(){
    try{ await openDB(); }
    catch(e){ return this.fatal(e.message); }

    if(!(await DB.setting('altura'))) await DB.setting('altura', 175);
    await seedFoods();

    // Navegación de pestañas
    document.querySelectorAll('nav button').forEach(b=>b.onclick = ()=>this.go(b.dataset.v));

    // Formulario del día
    el('bSaveDay').onclick = ()=>this.saveDay();

    await Train.init();
    await Progress.init();
    await Diet.init();
    await this.renderHoy();

    if('serviceWorker' in navigator)
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
  },

  fatal(msg){
    document.body.insertAdjacentHTML('afterbegin',
      `<div class="card warn-card" style="margin:16px">
        <h2>No se pudo iniciar</h2><p>${msg}</p>
        <p class="hint">Si el problema persiste, cierra todas las pestañas de la app y vuelve a abrirla.</p>
      </div>`);
  },

  go(v){
    this.view = v;
    document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on', b.dataset.v===v));
    document.querySelectorAll('main > section').forEach(s=>s.classList.toggle('on', s.id==='v-'+v));
    el('hTitle').textContent = {hoy:'Hoy', entreno:'Entreno', dieta:'Dieta', progreso:'Progreso'}[v];
    window.scrollTo(0,0);
    if(v==='progreso') Progress.reload();
    if(v==='dieta')    Diet.reload();
  },

  async reloadAll(){
    await Train.reload();
    await Progress.reload();
    await Diet.reload();
    await this.renderHoy();
  },

  /* ═══ PESTAÑA HOY ═══ */
  async renderHoy(){
    const t = D.today(), ph = Calc.phaseFor(t), wk = Calc.weekNum(t);

    el('hDate').textContent = D.labelLong(t);
    el('hPhase').textContent = ph.id==='S0' ? 'Semana 0' : `${ph.id} · S${wk<1?0:wk}`;

    // Formulario del día
    const d = await DB.get('body', t) || {};
    const set = (id,v)=>{el(id).value = v ?? '';};
    set('fPeso',d.peso); set('fPasos',d.pasos); set('fSueno',d.sueno); set('fDormir',d.dormir);
    set('fKcal',d.kcal); set('fProt',d.prot); set('fHc',d.hc); set('fGrasa',d.grasa);
    set('fFibra',d.fibra); set('fAdh',d.adh); set('fNotas',d.notas);

    // KPI
    const B = await DB.getAll('body');
    const ma = Calc.movAvg(B);
    const last = ma[ma.length-1];
    const trend = Progress.weeklyTrend(ma);
    el('kPeso').textContent  = d.peso!=null ? d.peso.toFixed(1)+' kg' : '—';
    el('kMedia').textContent = last && last.ma!=null ? last.ma.toFixed(1)+' kg' : '—';
    el('kTend').textContent  = trend==null ? '—' : (trend>0?'+':'')+trend.toFixed(2)+' %';
    el('kTend').className    = trend==null ? '' : (trend<0?'down':'up');
    el('kDias').textContent  = B.length;

    // Objetivos de la fase
    el('hoyObj').innerHTML = `<p class="hint">Objetivo de hoy: <strong>${ph.kcal} kcal ·
      ${ph.prot} g proteína · ${ph.pasos} pasos · acostarse a ${ph.dormir}</strong></p>`;

    // Sesión de gimnasio de hoy
    const sid = Calc.plannedSession(t);
    const S = sid ? SESSIONS[sid] : null;
    const ws = await DB.getAll('workouts');
    const wToday = ws.filter(w=>w.fecha===t);
    const done  = wToday.find(w=>w.estado==='done');
    const draft = wToday.find(w=>w.estado==='draft');
    const rir = Calc.rirFor(t);

    el('hoySesion').innerHTML = S ? `
      <h2>Entrenamiento de hoy</h2>
      <h4>${S.n}</h4>
      <p class="hint">${S.ex.length} ejercicios · ~${S.dur} min ·
        ${rir==='descarga'?'<strong>SEMANA DE DESCARGA</strong>':'RIR objetivo <strong>'+rir+'</strong>'}</p>
      <p class="note">${S.nota}</p>
      ${done ? `<p class="verdict ok">Sesión completada.</p>
                <button data-go="sum">Ver resumen</button>`
             : `<button class="primary" data-go="${draft?'resume':'start'}">
                  ${draft?'Continuar sesión':'Empezar sesión'}</button>`}`
      : `<h2>Entrenamiento de hoy</h2>
         <p class="hint">Hoy no hay sesión de gimnasio planificada.
           ${Progress.nivel>1?'<br>'+Progress.levelMsg():''}</p>`;

    el('hoySesion').querySelectorAll('[data-go]').forEach(b=>b.onclick = ()=>{
      const a = b.dataset.go;
      this.go('entreno');
      if(a==='sum') Train.showSummary(done);
      else if(a==='resume') Train.enterLog(draft);
      else Train.startSession(t, sid);
    });

    // Running de hoy
    const runs = Calc.plannedRuns(t);
    el('hoyRun').innerHTML = runs.length
      ? `<h2>Running de hoy</h2>${runs.map(r=>{const T=RUN_TYPES[r.t];
          return `<h4>${T.n} · ${r.min} min</h4>
            <p class="hint">Ritmo ${T.ritmo} · FC ${T.fc}</p>
            ${T.tip?`<p class="note">${T.tip}</p>`:''}`;}).join('')}
         <button data-run>Registrar carrera</button>`
      : '';
    const rb = el('hoyRun').querySelector('[data-run]');
    if(rb) rb.onclick = ()=>{this.go('entreno'); el('runFecha').value = t;
      el('runPanel').scrollIntoView({behavior:'smooth'});};

    // Menú de hoy
    const meals = MEAL_ORDER.map(c=>{
      const plan = Diet.plannedOp(t,c), rec = Diet.intakeOf(t,c);
      const op = rec ? (MEALS[c].op.find(o=>o.id===rec.opReal) || plan) : plan;
      return {c, hora:MEALS[c].hora, n:MEALS[c].n, plato:op?op.n:'Comida libre',
        ok:!!rec, mod: rec && rec.opReal!==rec.opPlan};
    });
    const tot = Diet.dayTotals(t);
    el('hoyMenu').innerHTML = `<h2>Menú de hoy</h2>
      <table>${meals.map(m=>`<tr><td>${m.hora}<br><span class="hint">${m.n}</span></td>
        <td>${m.plato}${m.mod?' <span class="tag warn">cambiado</span>':''}</td>
        <td class="n">${m.ok?'✓':'○'}</td></tr>`).join('')}</table>
      <p class="hint">Registrado: <strong>${Math.round(tot.kcal)} / ${ph.kcal} kcal ·
        ${tot.p.toFixed(0)} / ${ph.prot} g proteína</strong></p>
      <button data-dieta>Ir al menú</button>`;
    el('hoyMenu').querySelector('[data-dieta]').onclick = ()=>{this.go('dieta'); Diet.openDay(t);};

    // Próximo hito
    const hito = MILESTONES.find(m=>m.f>=t);
    el('hoyHito').innerHTML = hito
      ? `<h2>Próximo hito</h2><h4>${D.labelLong(hito.f)}</h4>
         <p class="hint">Faltan <strong>${D.diffDays(t,hito.f)} días</strong></p>
         <p class="note">${hito.t}</p>` : '';
  },

  async saveDay(){
    const gv = id=>{const n=parseFloat(String(el(id).value).replace(',','.'));return isFinite(n)?n:null;};
    await DB.put('body',{
      fecha:D.today(), peso:gv('fPeso'), pasos:gv('fPasos'), sueno:gv('fSueno'),
      dormir:el('fDormir').value||null, kcal:gv('fKcal'), prot:gv('fProt'),
      hc:gv('fHc'), grasa:gv('fGrasa'), fibra:gv('fFibra'),
      adh:el('fAdh').value||null, notas:el('fNotas').value.trim()||null,
      foto:(await DB.get('body',D.today()))?.foto || false
    });
    flash(el('mDay'),'Guardado ✓');
    await this.reloadAll();
  }
};

document.addEventListener('DOMContentLoaded', ()=>App.init());