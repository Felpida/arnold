'use strict';
const APP_VER = '2026.08.18-4';

/* ═══════════════════ ARRANQUE Y NAVEGACIÓN ═══════════════════ */

const App = {
  view:'hoy',

  async init(){
    try{ await openDB(); }
    catch(e){ return this.fatal(e.message); }

    if(!(await DB.setting('altura'))) await DB.setting('altura', 175);
    await seedFoods();

    document.querySelectorAll('nav button').forEach(b=>b.onclick = ()=>this.go(b.dataset.v));
        el('bSaveMorning').onclick = ()=>this.saveMorning();
    el('bSaveNight').onclick   = ()=>this.saveNight();

    // Sub-pestañas del registro diario: mañana / noche
    document.querySelectorAll('#dayTabs button').forEach(b=>b.onclick = ()=>{
      document.querySelectorAll('#dayTabs button').forEach(x=>x.classList.toggle('on', x===b));
      ['am','pm'].forEach(k=>el('day-'+k).classList.toggle('hide', k!==b.dataset.dp));
    });

    // Campana de avisos en la cabecera
    el('bPend').onclick = ()=>el('pendModal').classList.add('on');
    el('pendModalClose').onclick = ()=>el('pendModal').classList.remove('on');

    el('bHardUpdate').onclick  = ()=>this.hardUpdate();
    el('bHardUpdate2').onclick = ()=>this.hardUpdate();

    await Train.init();
    await Progress.init();
    await Diet.init();
    await this.renderHoy();

        /* Actualización automática: cuando el service worker nuevo toma el control,
       la página se recarga una sola vez. Sin esto hay que cerrar y reabrir la app
       dos veces para ver cada cambio. */
    if('serviceWorker' in navigator){
      let recargando = false;
      navigator.serviceWorker.addEventListener('controllerchange', ()=>{
        if(recargando) return;
        recargando = true;
        location.reload();
      });
      navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'})
        .then(reg=>reg.update())
        .catch(()=>{});
    }
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

  /* ═══ CAMPANA DE AVISOS ═══
     Progress.renderReminders() calcula la lista y llama aquí.
     Los avisos no ocupan sitio en la página: viven en la cabecera. */
  setPending(lista){
    const n = lista.length;
    el('pendCount').textContent = n;
    el('bPend').classList.toggle('has', n>0);
    el('pendBody').innerHTML = n
      ? lista.map(a=>`<div class="verdict warn">${a}</div>`).join('')
      : '<div class="verdict ok">Nada pendiente. Todo al día.</div>';
  },

  /* ═══ PESTAÑA HOY ═══ */
  async renderHoy(){
    const t = D.today(), ph = Calc.phaseFor(t), wk = Calc.weekNum(t);

    el('hDate').textContent = D.labelLong(t);
    el('hPhase').textContent = ph.id==='S0' ? 'Semana 0' : `${ph.id} · S${wk<1?0:wk}`;

    /* ── Registro del día: mañana y noche ── */
    const d = await DB.get('body', t) || {};
    const set = (id,v)=>{el(id).value = v ?? '';};
    set('fPeso',d.peso); set('fSueno',d.sueno); set('fDormir',d.dormir);
    set('fCalSueno',d.calSueno);
    set('fPasos',d.pasos); set('fCansancio',d.cansancio);
    set('fAnimo',d.animo); set('fEstres',d.estres);
    set('fNotas',d.notas); set('fKcal',d.kcal); set('fProt',d.prot);

    const disp  = Calc.readiness(d);
    const nConf = MEAL_ORDER.filter(c=>Diet.intakeOf(t,c)).length;
    const totD  = Diet.dayTotals(t);
    const adh   = Diet.adherenceOf(t);

    el('sumDay').textContent = [
      d.peso!=null ? 'peso ✓' : 'sin peso',
      d.pasos!=null ? 'pasos ✓' : null,
      disp!=null ? 'disp. '+disp : null
    ].filter(Boolean).join(' · ');

    el('dietAuto').innerHTML = `
      <p class="hint"><strong>${nConf}/5 comidas confirmadas</strong> · adherencia
        <span class="tag ${adh==='completo'?'ok':adh==='parcial'?'warn':'bad'}">${adh}</span></p>
      <p class="hint">${Math.round(totD.kcal)} kcal · ${totD.p.toFixed(0)} g P ·
        ${totD.c.toFixed(0)} g HC · ${totD.g.toFixed(0)} g G · ${totD.fib.toFixed(0)} g fibra</p>
      ${nConf<5?`<p class="note">Con menos de 5 comidas confirmadas el día <strong>no cuenta
        como válido para calibrar el gasto</strong>. Confírmalas en la pestaña Dieta.</p>`:''}`;

    /* ── KPI ── */
    const B = await DB.getAll('body');
    const ma = Calc.movAvg(B);
    const last = ma[ma.length-1];
    const trend = Progress.weeklyTrend(ma);
    el('kPeso').textContent  = d.peso!=null ? d.peso.toFixed(1)+' kg' : '—';
    el('kMedia').textContent = last && last.ma!=null ? last.ma.toFixed(1)+' kg' : '—';
    el('kTend').textContent  = trend==null ? '—' : (trend>0?'+':'')+trend.toFixed(2)+' %';
    el('kTend').className    = trend==null ? '' : (trend<0?'down':'up');
    const disp7 = B.filter(b=>b.fecha>=D.add(t,-6)).map(b=>Calc.readiness(b)).filter(v=>v!=null);
    el('kDisp').textContent = disp7.length
      ? Math.round(disp7.reduce((a,b)=>a+b,0)/disp7.length) : '—';

    el('hoyObj').innerHTML = `<p class="hint">Objetivo de hoy: <strong>${ph.kcal} kcal ·
      ${ph.prot} g proteína · ${ph.pasos} pasos · acostarse a ${ph.dormir}</strong></p>`;

    /* ── Gráfica de peso ── */
    const pts = ma.slice(-30);
    el('hoyChart').innerHTML = pts.length>1
      ? lineChart([
          {pts:pts.filter(r=>r.peso!=null).map(r=>({x:r.fecha,y:r.peso})), col:'var(--tx3)', w:1.6},
          {pts:pts.filter(r=>r.ma!=null).map(r=>({x:r.fecha,y:r.ma})),   col:'var(--ac)',  w:3}
        ], 170) +
        `<p class="hint">Línea gruesa = media móvil de 7 días. <strong>Solo esa cuenta.</strong>
          Un déficit de 0,35 kg/semana es invisible dentro de la fluctuación diaria de 1-2 kg.</p>`
      : '<p class="hint">Registra al menos 2 días para ver la gráfica.</p>';

    /* ── Sesión de gimnasio ── */
    const sid = Calc.plannedSession(t);
    const S = sid ? SESSIONS[sid] : null;
    const ws = await DB.getAll('workouts');
    const wToday = ws.filter(w=>w.fecha===t);
    const done  = wToday.find(w=>w.estado==='done');
    const draft = wToday.find(w=>w.estado==='draft');
    const rir = Calc.rirFor(t);

    el('sumSesion').textContent = !S ? 'descanso' : done ? '✓ hecha' : draft ? 'en curso' : sid;
    el('accSesion').open = !!S && !done;

    el('hoySesion').innerHTML = S ? `
      <h4>${S.n}</h4>
      <p class="hint">${S.ex.length} ejercicios · ~${S.dur} min ·
        ${rir==='descarga'?'<strong>SEMANA DE DESCARGA</strong>':'RIR objetivo <strong>'+rir+'</strong>'}</p>
      <p class="note">${S.nota}</p>
      ${done ? `<p class="verdict ok">Sesión completada.</p>
                <button class="b-info" data-go="sum">Ver resumen</button>`
             : `<button class="primary" data-go="${draft?'resume':'start'}">
                  ${draft?'Continuar sesión':'Empezar sesión'}</button>`}`
      : `<p class="hint">Hoy no hay sesión de gimnasio planificada.
           ${Progress.nivel>1?'<br>'+Progress.levelMsg():''}</p>`;

    el('hoySesion').querySelectorAll('[data-go]').forEach(b=>b.onclick = ()=>{
      const a = b.dataset.go;
      this.go('entreno');
      if(a==='sum') Train.showSummary(done);
      else if(a==='resume') Train.enterLog(draft);
      else Train.startSession(t, sid);
    });

    /* ── Running ── */
    const runs = Calc.plannedRuns(t);
    el('accRun').classList.toggle('hide', !runs.length);
    if(runs.length){
      el('sumRun').textContent = runs.map(r=>r.min+' min').join(' + ');
      el('hoyRun').innerHTML = runs.map(r=>{const T=RUN_TYPES[r.t];
        return `<h4>${T.n} · ${r.min} min</h4>
          <p class="hint">Ritmo ${T.ritmo} · FC ${T.fc}</p>
          ${T.tip?`<p class="note">${T.tip}</p>`:''}`;}).join('') +
        '<button class="b-info" data-run>Registrar carrera</button>';
      el('hoyRun').querySelector('[data-run]').onclick = ()=>{
        this.go('entreno');
        el('runFecha').value = t;
        el('runPanel').open = true;
        el('runPanel').scrollIntoView({behavior:'smooth'});
      };
    }

    /* ── Menú ── */
    const meals = MEAL_ORDER.map(c=>{
      const plan = Diet.plannedOp(t,c), rec = Diet.intakeOf(t,c);
      const op = rec ? (MEALS[c].op.find(o=>o.id===rec.opReal) || plan) : plan;
      return {hora:MEALS[c].hora, n:MEALS[c].n, plato:op?op.n:'Comida libre',
        ok:!!rec, mod: rec && rec.opReal!==rec.opPlan};
    });
    const tot = Diet.dayTotals(t);
    const hechas = meals.filter(m=>m.ok).length;
    el('sumMenu').textContent = `${hechas}/5 · ${Math.round(tot.kcal)} kcal`;
    el('hoyMenu').innerHTML = `
      <table>${meals.map(m=>`<tr><td>${m.hora}<br><span class="hint">${m.n}</span></td>
        <td>${m.plato}${m.mod?' <span class="tag warn">cambiado</span>':''}</td>
        <td class="n">${m.ok?'✓':'○'}</td></tr>`).join('')}</table>
      <p class="hint">Registrado: <strong>${Math.round(tot.kcal)} / ${ph.kcal} kcal ·
        ${tot.p.toFixed(0)} / ${ph.prot} g proteína</strong></p>
      <button class="b-warn" data-dieta>Ir al menú</button>`;
    el('hoyMenu').querySelector('[data-dieta]').onclick = ()=>{this.go('dieta'); Diet.openDay(t);};

    /* ── Próximo hito ── */
    const hito = MILESTONES.find(m=>m.f>=t);
    el('accHito').classList.toggle('hide', !hito);
    if(hito){
      el('sumHito').textContent = `${D.diffDays(t,hito.f)} días`;
      el('hoyHito').innerHTML = `<h4>${D.labelLong(hito.f)}</h4>
        <p class="hint">Faltan <strong>${D.diffDays(t,hito.f)} días</strong></p>
        <p class="note">${hito.t}</p>`;
    }

    el('appVer').textContent = `Arnold ${APP_VER} · build ${document.lastModified}`;
  
  },

    /* Mañana y noche se guardan por separado y sin pisarse: cada una
     escribe solo sus campos sobre el registro existente del día.
     Las escalas de 1-5 son opcionales; vacías se guardan como null. */
  async saveMorning(){
    const gv = id=>{const n=parseFloat(String(el(id).value).replace(',','.'));return isFinite(n)?n:null;};
    const prev = await DB.get('body', D.today()) || {};
    await DB.put('body', {...prev, fecha:D.today(),
      peso:gv('fPeso'), sueno:gv('fSueno'),
      dormir:el('fDormir').value||null, calSueno:gv('fCalSueno')});
    flash(el('mDay'),'Mañana guardada ✓');
    await this.reloadAll();
  },

  async saveNight(){
    const gv = id=>{const n=parseFloat(String(el(id).value).replace(',','.'));return isFinite(n)?n:null;};
    const prev = await DB.get('body', D.today()) || {};
    await DB.put('body', {...prev, fecha:D.today(),
      pasos:gv('fPasos'), cansancio:gv('fCansancio'),
      animo:gv('fAnimo'), estres:gv('fEstres'),
      notas:el('fNotas').value.trim()||null,
      kcal:gv('fKcal'), prot:gv('fProt')});
    flash(el('mNight'),'Noche guardada ✓');
    await this.reloadAll();
  },

    /* Purga service workers y cachés SIN tocar IndexedDB.
     Es la vía segura para forzar una actualización cuando un service
     worker antiguo se queda atascado. Los datos no se ven afectados. */
  async hardUpdate(){
    if(!confirm('Se borrarán las cachés y el service worker para forzar la versión más reciente.\n\nTus datos NO se tocan. ¿Continuar?')) return;
    try{
      if('serviceWorker' in navigator){
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r=>r.unregister()));
      }
      if('caches' in window){
        const keys = await caches.keys();
        await Promise.all(keys.map(k=>caches.delete(k)));
      }
    }catch(e){/* seguimos: la recarga es lo importante */}
    location.reload();
  }
};

document.addEventListener('DOMContentLoaded', ()=>App.init());