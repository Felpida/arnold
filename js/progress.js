'use strict';

/* ═══════════════════ PROGRESO ═══════════════════
   Medidas con Navy · estadísticas (gym / running / cuerpo) ·
   motor de decisiones semanal · recordatorios · modo mínimos */

const KEY_LIFTS = ['sentadilla','press_banca','remo_barra','rdl','press_hombro_mancu','dominada_asist'];

const Progress = {
  nivel:1, altura:175,
  B:[], M:[], W:[], R:[],

  async init(){
    this.altura = (await DB.setting('altura')) || 175;
    this.nivel  = (await DB.setting('nivel'))  || 1;
    this.installLevelOverride();

    document.querySelectorAll('#statTabs button').forEach(b=>b.onclick = ()=>{
      document.querySelectorAll('#statTabs button').forEach(x=>x.classList.toggle('on',x===b));
      ['gym','run','body'].forEach(k=>el('st-'+k).classList.toggle('hide', k!==b.dataset.st));
    });

    el('bSaveMeas').onclick = ()=>this.saveMeasures();
    el('bCheckin').onclick  = ()=>this.checkin();
    el('mFecha').value = D.today();

    el('minMode').value = this.nivel;
    el('minMode').onchange = async ev=>{
      this.nivel = +ev.target.value;
      await DB.setting('nivel', this.nivel);
      flash(el('mMin'), this.levelMsg());
      el('sumMin').textContent = 'Nivel '+this.nivel;
      await Train.reload();
    };

    ['mCuello','mCintOmb'].forEach(id=>el(id).oninput = ()=>this.previewNavy());

    el('bExpAll').onclick  = async()=>flash(el('mExp'), await exportAll());
    el('bCsvDia').onclick  = async()=>flash(el('mExp'), await shareFiles([{name:'diario.csv',        text:await Export.diario()}]));
    el('bCsvEnt').onclick  = async()=>flash(el('mExp'), await shareFiles([{name:'entrenamiento.csv', text:await Export.entrenamiento()}]));
    el('bCsvRun').onclick  = async()=>flash(el('mExp'), await shareFiles([{name:'running.csv',       text:await Export.running()}]));
    el('bCsvMed').onclick  = async()=>flash(el('mExp'), await shareFiles([{name:'perimetros.csv',    text:await Export.perimetros()}]));
    el('bCsvDieta').onclick= async()=>flash(el('mExp'), await shareFiles([{name:'dieta.csv',         text:await Export.dieta()}]));
    el('bBackup').onclick  = async()=>{
      await DB.setting('last_export', D.today());
      flash(el('mExp'), await shareFiles([{name:'arnold-backup.json', text:await Export.backup(), mime:'application/json'}]));
      this.renderReminders();
    };
    el('fRestore').onchange = async ev=>{
      const f = ev.target.files[0]; if(!f)return;
      try{
        const r = await Export.restore(await f.text());
        flash(el('mRest'), `Restaurado: ${r.dias} días, ${r.sesiones} sesiones ✓`);
        await App.reloadAll();
      }catch(e){ flash(el('mRest'), e.message, true); }
      ev.target.value = '';
    };

    el('sumMin').textContent = 'Nivel '+this.nivel;
    await this.reload();
  },

  async reload(){
    this.B = await DB.getAll('body');
    this.M = await DB.getAll('measures');
    this.W = await DB.getAll('workouts');
    this.R = await DB.getAll('runs');
    this.renderMeasures();
    this.renderGym();
    this.renderRun();
    this.renderBody();
    this.renderReminders();
  },

  /* ═══ MODO MÍNIMOS ═══
     Sobrescribe la sesión planificada según el nivel activo.
     Se instala aquí, sobre Calc, porque es un ajuste transversal:
     afecta al calendario, al popup del día y a las estadísticas. */
  installLevelOverride(){
    if(Calc._planBase) return;
    Calc._planBase = Calc.plannedSession.bind(Calc);
    Calc.plannedSession = fecha=>{
      const n = Progress.nivel;
      if(n===1) return Calc._planBase(fecha);
      const dow = D.dow(fecha);
      if(n===2) return {1:'N2A', 3:'N2B', 5:'N2A'}[dow] || null;
      if(n===3) return {2:'N3A', 5:'N3B'}[dow] || null;
      return null;                                    // Nivel 4 · suelo
    };
  },

  levelMsg(){
    return {1:'Nivel 1 · Completo: 5 sesiones + running + dieta medida.',
      2:'Nivel 2 · Reducido: 3 full-body de 50 min, cargas al 90 %, dieta a mantenimiento.',
      3:'Nivel 3 · Mantenimiento: 2 sesiones de 35 min + 10.000 pasos + proteína alta.',
      4:'Nivel 4 · Suelo: solo proteína ≥ 150 g y 8.000 pasos. Cero gimnasio, cero culpa.'}[this.nivel];
  },

  /* ═══ MEDIDAS ═══ */
  previewNavy(){
    const c = parseFloat(el('mCintOmb').value), n = parseFloat(el('mCuello').value);
    const v = Calc.navy(c, n, this.altura);
    el('measNavy').innerHTML = v==null
      ? '<span class="hint">Introduce cintura y cuello para calcular el % de grasa.</span>'
      : `<strong>${v.toFixed(1)} %</strong> de grasa estimada (método Navy)`;
  },

  async saveMeasures(){
    const gv = id=>{const n=parseFloat(String(el(id).value).replace(',','.'));return isFinite(n)?n:null;};
    const rec = {fecha:el('mFecha').value || D.today(),
      cuello:gv('mCuello'), hombros:gv('mHombros'), pecho:gv('mPecho'),
      cintura_ombligo:gv('mCintOmb'), cintura_estrecha:gv('mCintEst'), cadera:gv('mCadera'),
      brazo_rel:gv('mBrazoRel'), brazo_con:gv('mBrazoCon'), muslo:gv('mMuslo'),
      gemelo:gv('mGemelo'), notas:el('mNotas').value.trim()||null};
    if(!rec.cintura_ombligo || !rec.cuello){
      flash(el('mMeas'),'Cintura al ombligo y cuello son obligatorias: sin ellas no hay % de grasa.',true);
      return;
    }
    await DB.put('measures', rec);
    if(el('fotoChk').checked){
      const b = await DB.get('body', rec.fecha) || {fecha:rec.fecha};
      b.foto = true; await DB.put('body', b);
      el('fotoChk').checked = false;
    }
    await this.reload();
    flash(el('mMeas'),'Medidas guardadas ✓');
  },

  renderMeasures(){
    const ms = this.M.sort((a,b)=>a.fecha<b.fecha?1:-1);
    if(!ms.length){ el('measHist').innerHTML = '<p class="hint">Sin medidas registradas. La primera toma es la línea base de los 12 meses.</p>'; return; }

    const pesoBy = {}; this.B.forEach(b=>{if(b.peso!=null)pesoBy[b.fecha]=b.peso;});
    const row = m=>{
      const navy = Calc.navy(m.cintura_ombligo, m.cuello, this.altura);
      const co = Calc.compo(pesoBy[m.fecha]??null, navy);
      return {...m, navy, ratio:Calc.ratioHC(m.hombros,m.cintura_ombligo),
        magra:co?co.magra:null, grasa:co?co.grasa:null};
    };
    const cur = row(ms[0]), base = row(ms[ms.length-1]);
    const d = (a,b,dec)=>{
      if(a==null||b==null) return '—';
      const v = a-b;
      return `<span class="${v>=0?'up':'down'}">${v>=0?'+':''}${v.toFixed(dec??1)}</span>`;
    };

    const F = [['cuello','Cuello'],['hombros','Hombros'],['pecho','Pecho'],
      ['cintura_ombligo','Cintura ombligo'],['cintura_estrecha','Cintura estrecha'],
      ['cadera','Cadera'],['brazo_rel','Brazo relajado'],['brazo_con','Brazo contraído'],
      ['muslo','Muslo'],['gemelo','Gemelo']];

    el('measHist').innerHTML = `
      <div class="kpi">
        <div><span>Grasa (Navy)</span><b>${cur.navy?cur.navy.toFixed(1)+' %':'—'}</b></div>
        <div><span>Ratio hombro/cintura</span><b>${cur.ratio?cur.ratio.toFixed(3):'—'}</b></div>
        <div><span>Masa magra</span><b>${cur.magra?cur.magra.toFixed(1)+' kg':'—'}</b></div>
        <div><span>Masa grasa</span><b>${cur.grasa?cur.grasa.toFixed(1)+' kg':'—'}</b></div>
      </div>
      <p class="note">El <strong>ratio hombro/cintura</strong> es el indicador que mide de
        verdad tu objetivo. Sube si vas bien, sin importar lo que haga la báscula: es
        literalmente "hombro redondo y cintura estrecha" en un número.</p>
      <table><tr><th>Medida</th><th class="n">Última</th><th class="n">Base</th><th class="n">Δ</th></tr>
        ${F.map(([k,lab])=>`<tr><td>${lab}</td>
          <td class="n">${cur[k]??'—'}</td><td class="n">${base[k]??'—'}</td>
          <td class="n">${d(cur[k],base[k])}</td></tr>`).join('')}
        <tr><td><strong>Ratio H/C</strong></td><td class="n">${cur.ratio?cur.ratio.toFixed(3):'—'}</td>
          <td class="n">${base.ratio?base.ratio.toFixed(3):'—'}</td>
          <td class="n">${d(cur.ratio,base.ratio,3)}</td></tr>
      </table>
      <p class="hint">${ms.length} tomas · base ${D.label(base.fecha)} · última ${D.label(cur.fecha)}</p>`;
  },

  /* ═══ ESTADÍSTICAS · GYM ═══ */
  renderGym(){
    const done = this.W.filter(w=>w.estado==='done').sort((a,b)=>a.fecha<b.fecha?-1:1);
    if(!done.length){ el('st-gym').innerHTML = '<p class="hint">Sin sesiones cerradas todavía.</p>'; return; }

    // e1RM por ejercicio clave
    const series = KEY_LIFTS.map(id=>{
      const pts = [];
      done.forEach(w=>(w.ex||[]).forEach(e=>{
        if((e.exReal||e.exPlan)!==id)return;
        const best = (e.sets||[]).filter(s=>s.carga>0&&s.reps>0)
          .sort((a,b)=>Calc.e1rm(b.carga,b.reps)-Calc.e1rm(a.carga,a.reps))[0];
        if(best) pts.push({x:w.fecha, y:Calc.e1rm(best.carga,best.reps)});
      }));
      return {id, n:EX[id]?.n||id, pts};
    }).filter(s=>s.pts.length);

    // Volumen de la semana en curso frente al objetivo de la fase
    const ws = D.weekStart(D.today());
    const vol = Calc.volumeByGroup(this.W, ws, D.add(ws,6));
    const ph = Calc.phaseFor(D.today());
    const tgt = VOL_TARGET[ph.id] || VOL_TARGET.A;

    // Adherencia de sesiones en las últimas 4 semanas
    let plan4 = 0, done4 = 0;
    for(let i=0;i<28;i++){
      const f = D.add(D.today(), -i);
      if(Calc.plannedSession(f)) plan4++;
      if(this.W.some(w=>w.fecha===f && w.estado==='done')) done4++;
    }

    const rpes = done.filter(w=>w.rpe!=null).slice(-8);
    const rirAll = done.flatMap(w=>(w.ex||[]).flatMap(e=>(e.sets||[]).map(s=>s.rir)))
      .filter(v=>v!=null);
    const mol = done.flatMap(w=>(w.molestias||[]).map(m=>({...m, fecha:w.fecha})))
      .sort((a,b)=>a.fecha<b.fecha?1:-1).slice(0,10);

        el('st-gym').innerHTML = `
      <div class="kpi">
        <div><span>Sesiones cerradas</span><b>${done.length}</b></div>
        <div><span>Adherencia 4 sem.</span><b>${plan4?Math.round(done4/plan4*100)+' %':'—'}</b></div>
        <div><span>RIR medio</span><b>${rirAll.length?(rirAll.reduce((a,b)=>a+b,0)/rirAll.length).toFixed(1):'—'}</b></div>
        <div><span>RPE medio (8 últ.)</span><b>${rpes.length?(rpes.reduce((s,w)=>s+w.rpe,0)/rpes.length).toFixed(1):'—'}</b></div>
      </div>

      ${acc('Volumen semanal por grupo', `
        ${Object.entries(tgt).map(([g,[lo,hi]])=>{
          const v = vol[g]||0;
          const pct = Math.min(100, v/hi*100);
          const cls = v<lo ? 'bad' : v>hi ? 'warn' : 'ok';
          return `<div class="bar"><span>${g}</span>
            <div class="track"><i class="${cls}" style="width:${pct}%"></i></div>
            <em class="${cls}">${v} / ${lo}-${hi}</em></div>`;
        }).join('')}
        <p class="hint">Rojo = por debajo del mínimo eficaz · verde = en rango ·
          ámbar = por encima del máximo adaptativo.</p>`,
        'a-gym', true, 'semana en curso')}

      ${acc('Progresión de 1RM estimado',
        series.length
          ? series.map(s=>`<h4 class="sub">${s.n}<em>${s.pts[s.pts.length-1].y.toFixed(1)} kg</em></h4>
              ${lineChart([{pts:s.pts, col:'var(--ac)', w:2.5}], 120)}`).join('')
          : '<p class="hint">Sin datos suficientes. Necesitas al menos 2 sesiones con el mismo ejercicio.</p>',
        'a-gym', false, series.length+' ejercicios')}

      ${mol.length ? acc('Historial de molestias', `
        <table><tr><th>Fecha</th><th>Ejercicio</th><th>Zona</th><th class="n">Nivel</th></tr>
        ${mol.map(m=>`<tr><td>${D.label(m.fecha)}</td><td>${EX[m.ex]?.n||m.ex}</td>
          <td>${m.zona}</td><td class="n">${m.nivel}</td></tr>`).join('')}</table>
        <p class="hint">Si una zona se repite con el mismo ejercicio, hay que sustituirlo.</p>`,
        'a-alert', false, mol.length+' registros') : ''}`;
  },

  /* ═══ ESTADÍSTICAS · RUNNING ═══ */
  renderRun(){
    const rs = this.R.sort((a,b)=>a.fecha<b.fecha?-1:1);
    if(!rs.length){ el('st-run').innerHTML = '<p class="hint">Sin carreras registradas.</p>'; return; }

    // km por semana
    const byWeek = {};
    rs.forEach(r=>{const k=D.weekStart(r.fecha); byWeek[k]=(byWeek[k]||0)+(r.km||0);});
    const wkPts = Object.entries(byWeek).sort().map(([f,v])=>({x:f, y:v}));

    // Ritmo en Z2 = proxy de forma aerobia. Bajar aquí es mejorar.
    const z2 = rs.filter(r=>['z2','largo'].includes(r.tipo) && r.km>0 && r.seg>0)
      .map(r=>({x:r.fecha, y:Calc.paceSec(r.km,r.seg)/60}));

    const total = rs.reduce((s,r)=>s+(r.km||0),0);
    const largo = rs.reduce((m,r)=>Math.max(m, r.km||0), 0);
    const km7 = rs.filter(r=>r.fecha>=D.add(D.today(),-6)).reduce((s,r)=>s+(r.km||0),0);
    const dias = D.diffDays(D.today(),'2027-02-14');

    const porTipo = {};
    rs.forEach(r=>{
      const t = porTipo[r.tipo] = porTipo[r.tipo] || {n:0, km:0, seg:0};
      t.n++; t.km += r.km||0; t.seg += r.seg||0;
    });

        el('st-run').innerHTML = `
      <div class="kpi">
        <div><span>Total acumulado</span><b>${total.toFixed(1)} km</b></div>
        <div><span>Últimos 7 días</span><b>${km7.toFixed(1)} km</b></div>
        <div><span>Carrera más larga</span><b>${largo.toFixed(1)} km</b></div>
        <div><span>Días al 10 K</span><b>${dias>0?dias:'—'}</b></div>
      </div>

      ${acc('Kilómetros por semana', `
        ${barChart(wkPts.slice(-12), 35)}
        <p class="hint">La línea roja discontinua son los 35 km/semana, el techo del plan
          antes del 10 K. Por encima, la interferencia con la hipertrofia se vuelve real.</p>`,
        'a-run', true, wkPts.length+' semanas')}

      ${acc('Ritmo en rodaje fácil (Z2)', `
        ${z2.length>1 ? lineChart([{pts:z2, col:'var(--info)', w:2.5}], 140, true)
          : '<p class="hint">Necesitas al menos 2 rodajes Z2 registrados.</p>'}
        <p class="hint">Aquí <strong>subir es mejorar</strong>: el eje está invertido, así
          que la línea sube cuando corres más rápido con el mismo esfuerzo cardiaco.
          Objetivo de la fase: 6:45-7:15/km.</p>`,
        'a-run', false)}

      ${acc('Por tipo de sesión', `
        <table><tr><th>Tipo</th><th class="n">Ses.</th><th class="n">km</th><th class="n">Ritmo medio</th></tr>
        ${Object.entries(porTipo).map(([k,t])=>`<tr><td>${RUN_TYPES[k]?.n||k}</td>
          <td class="n">${t.n}</td><td class="n">${t.km.toFixed(1)}</td>
          <td class="n">${Calc.pace(t.km,t.seg)||'—'}</td></tr>`).join('')}</table>`,
        'a-run', false)}`;
  },

  /* ═══ ESTADÍSTICAS · CUERPO ═══ */
  renderBody(){
    const ma = Calc.movAvg(this.B);
    const trend = this.weeklyTrend(ma);
    const ph = Calc.phaseFor(D.today());

    const cint = this.M.filter(m=>m.cintura_ombligo!=null)
      .sort((a,b)=>a.fecha<b.fecha?-1:1).map(m=>({x:m.fecha, y:m.cintura_ombligo}));
    const ratio = this.M.filter(m=>m.hombros&&m.cintura_ombligo)
      .sort((a,b)=>a.fecha<b.fecha?-1:1)
      .map(m=>({x:m.fecha, y:m.hombros/m.cintura_ombligo}));
    const navy = this.M.filter(m=>m.cintura_ombligo&&m.cuello)
      .sort((a,b)=>a.fecha<b.fecha?-1:1)
      .map(m=>({x:m.fecha, y:Calc.navy(m.cintura_ombligo,m.cuello,this.altura)}))
      .filter(p=>p.y!=null);

    const pasos = this.B.filter(b=>b.pasos!=null).slice(-14);
    const sueno = this.B.filter(b=>b.sueno!=null).slice(-14);
    const dispS = this.B.filter(b=>Calc.readiness(b)!=null).sort((a,b)=>a.fecha<b.fecha?-1:1).map(b=>({x:b.fecha, y:Calc.readiness(b)}));
    const esc = k=>this.B.filter(b=>b[k]!=null).sort((a,b)=>a.fecha<b.fecha?-1:1).map(b=>({x:b.fecha, y:b[k]}));

    el('st-body').innerHTML = `
      <div class="kpi">
        <div><span>Media móvil 7d</span><b>${ma.length&&ma[ma.length-1].ma?ma[ma.length-1].ma.toFixed(1)+' kg':'—'}</b></div>
        <div><span>Tendencia semanal</span><b class="${trend==null?'':trend<0?'down':'up'}">${trend==null?'—':(trend>0?'+':'')+trend.toFixed(2)+' %'}</b></div>
        <div><span>Pasos medios (14d)</span><b>${pasos.length?Math.round(pasos.reduce((s,b)=>s+b.pasos,0)/pasos.length):'—'}</b></div>
        <div><span>Sueño medio (14d)</span><b>${sueno.length?(sueno.reduce((s,b)=>s+b.sueno,0)/sueno.length).toFixed(1)+' h':'—'}</b></div>
      </div>
      <p class="hint">Objetivo de la fase ${ph.id}: ${ph.pasos} pasos · acostarse a ${ph.dormir}</p>

      ${acc('Peso — media móvil de 7 días', `
        ${lineChart([
          {pts:ma.filter(r=>r.peso!=null).map(r=>({x:r.fecha,y:r.peso})), col:'var(--tx3)', w:1.6},
          {pts:ma.filter(r=>r.ma!=null).map(r=>({x:r.fecha,y:r.ma})), col:'var(--ac)', w:3}
        ], 180)}
        <p class="hint">Línea gruesa = media móvil. <strong>Solo esa cuenta.</strong>
          Un déficit de 0,35 kg/semana es invisible dentro de la fluctuación diaria de 1-2 kg.</p>`,
        'a-body', true)}
      
      ${acc('Disposición · sueño, cansancio, ánimo y estrés', `
        ${dispS.length>1 ? lineChart([{pts:dispS.slice(-30), col:'var(--ac2)', w:2.5}],160)
          : '<p class="hint">Necesitas al menos 2 días con las cuatro escalas rellenas.</p>'}
        <p class="hint">Índice de 0 a 100 que combina horas de sueño, cansancio, ánimo y estrés.
          Por debajo de <strong>50 durante 4 días de una semana</strong> es criterio de descarga.</p>
        ${esc('cansancio').length>1 ? `<h4 class="sub">Cansancio<em>1 fresco → 5 agotado</em></h4>
          ${lineChart([{pts:esc('cansancio').slice(-30), col:'var(--bad)', w:2}],90)}`:''}
        ${esc('animo').length>1 ? `<h4 class="sub">Ánimo<em>1 muy bajo → 5 muy bien</em></h4>
          ${lineChart([{pts:esc('animo').slice(-30), col:'var(--ac)', w:2}],90)}`:''}
        ${esc('estres').length>1 ? `<h4 class="sub">Estrés<em>1 tranquilo → 5 desbordado</em></h4>
          ${lineChart([{pts:esc('estres').slice(-30), col:'var(--warn)', w:2}],90)}`:''}`,
        'a-body', false, dispS.length ? dispS[dispS.length-1].y : '—')}

      ${acc('Ratio hombro / cintura', `
        ${ratio.length>1?lineChart([{pts:ratio, col:'var(--ac)', w:2.5}],140)
          :'<p class="hint">Necesitas 2 tomas de perímetros.</p>'}
        <p class="hint">La métrica que corresponde literalmente a tu objetivo:
          hombro redondo y cintura estrecha en un número. <strong>Sube aunque el peso no se mueva.</strong></p>`,
        'a-body', true, ratio.length?ratio[ratio.length-1].y.toFixed(3):'—')}

      ${acc('Cintura al ombligo', `
        ${cint.length>1?lineChart([{pts:cint, col:'var(--warn)', w:2.5}],140)
          :'<p class="hint">Necesitas 2 tomas de perímetros.</p>'}`,
        'a-body', false, cint.length?cint[cint.length-1].y.toFixed(1)+' cm':'—')}

      ${acc('% de grasa estimado (Navy)', `
        ${navy.length>1?lineChart([{pts:navy, col:'var(--info)', w:2.5}],140)
          :'<p class="hint">Necesitas 2 tomas de perímetros.</p>'}`,
        'a-body', false, navy.length?navy[navy.length-1].y.toFixed(1)+' %':'—')}`;
  },

  /* Tendencia de la media móvil en %/semana */
  weeklyTrend(ma, days){
    days = days || 14;
    const w = ma.filter(r=>r.ma!=null);
    if(w.length<2) return null;
    const last = w[w.length-1], objetivo = D.add(last.fecha, -days);
    let ref = null;
    for(const r of w) if(r.fecha<=objetivo) ref = r;
    if(!ref) ref = w[0];
    const dd = D.diffDays(ref.fecha, last.fecha);
    if(dd < 7) return null;
    return ((last.ma - ref.ma)/ref.ma*100)/(dd/7);
  },

    /* Calorías efectivas del día: la anulación manual si existe, si no las del menú.
     Un día con menos de 5 comidas confirmadas NO es válido para calibrar:
     no es un día de pocas calorías, es un día sin dato. */
  kcalOf(b){
    if(b.kcal!=null) return {kcal:b.kcal, valido:true, fuente:'manual'};
    const n = MEAL_ORDER.filter(c=>Diet.intakeOf(b.fecha,c)).length;
    if(n<5) return {kcal:null, valido:false, fuente:'incompleto'};
    return {kcal:Diet.dayTotals(b.fecha).kcal, valido:true, fuente:'menu'};
  },

  validDays(desde){
    return this.B.filter(b=>(!desde || b.fecha>=desde) && this.kcalOf(b).valido).length;
  },

  /* Adherencia deducida del menú. Solo cuenta los días en los que hay
     algún registro de comida: un día sin ningún dato no es un
     incumplimiento, es ausencia de dato, y hundiría la media sin motivo. */
  adherence(desde){
    const dias = this.B.filter(b=>b.fecha>=desde).map(b=>b.fecha)
      .filter(f=>MEAL_ORDER.some(c=>Diet.intakeOf(f,c)));
    if(!dias.length) return null;
    const v = dias.reduce((s,f)=>{
      const a = Diet.adherenceOf(f);
      return s + (a==='completo' ? 1 : a==='parcial' ? 0.6 : 0.3);
    }, 0);
    return v/dias.length*100;
  },

  /* ═══ MOTOR DE DECISIONES SEMANAL ═══
     Aplica las reglas if/then del plan. La decisión no es intuición:
     es una regla con un umbral y una acción asociada. */
  checkin(){
    const hoy = D.today(), ph = Calc.phaseFor(hoy);
    const ma = Calc.movAvg(this.B);
    const trend = this.weeklyTrend(ma);
    const adh = this.adherence(D.add(hoy,-14));
    const deficit = ['B','D','G'].includes(ph.id);
    const superavit = ph.id==='F';

    const pasos = this.B.filter(b=>b.pasos!=null && b.fecha>=D.add(hoy,-14));
    const pasosMed = pasos.length ? pasos.reduce((s,b)=>s+b.pasos,0)/pasos.length : null;
    const sueno = this.B.filter(b=>b.sueno!=null && b.fecha>=D.add(hoy,-14));
    const suenoMed = sueno.length ? sueno.reduce((s,b)=>s+b.sueno,0)/sueno.length : null;

    // Cintura: si baja mientras el peso se estanca, es recomposición
    const ms = this.M.filter(m=>m.cintura_ombligo!=null).sort((a,b)=>a.fecha<b.fecha?-1:1);
    const dCint = ms.length>=2 ? ms[ms.length-1].cintura_ombligo - ms[ms.length-2].cintura_ombligo : null;

    const out = [], acc = [];
    const push = (t,txt)=>out.push({t,txt});

    if(trend==null) push('info','Aún no hay 2 semanas de media móvil. Sin ese dato no se toca nada: sería adivinar.');

    // ── Fase A: el entregable es el TDEE real, no el ajuste ──
    if(ph.id==='A' || ph.id==='S0'){
      const k = this.B.map(b=>this.kcalOf(b)).filter(x=>x.valido);
      const pesos = ma.filter(r=>r.ma!=null);
      if(k.length>=14 && pesos.length>=2){
        const kmed = k.reduce((s,x)=>s+x.kcal,0)/k.length;
        const dias = D.diffDays(pesos[0].fecha, pesos[pesos.length-1].fecha);
        const dPeso = pesos[pesos.length-1].ma - pesos[0].ma;
        const tdee = kmed + (dPeso*7700/dias);
        push('ok',`<strong>TDEE real estimado: ${Math.round(tdee)} kcal/día</strong><br>
          Media de ingesta ${Math.round(kmed)} kcal sobre <strong>${k.length} días válidos</strong> ·
          variación de peso ${dPeso>=0?'+':''}${dPeso.toFixed(2)} kg en ${dias} días.<br>
          Rango por fórmula: 2.610-2.760 kcal. Desviación: ${Math.round(tdee-2685)} kcal.`);
        acc.push(`Recalcular los macros de la Fase B sobre ${Math.round(tdee)} kcal.`);
      } else {
        const total = this.B.length;
        push('info',`Calibración en curso: <strong>${k.length} días válidos</strong> de ${total}
          registrados. Hacen falta 14 como mínimo.<br>
          Un día es válido si tiene las 5 comidas confirmadas, o si has anulado las
          calorías a mano en la pestaña Noche.`);
        if(total > k.length + 2)
          acc.push(`Tienes ${total-k.length} días con el menú a medias. Confirma las comidas
            que falten o anota las calorías a mano: si no, esos días no cuentan.`);
      }
    }

    // ── Reglas de déficit ──
    if(deficit && trend!=null){
      if(trend<=-0.3 && trend>=-0.5) push('ok',`Bajas ${Math.abs(trend).toFixed(2)} %/semana. Rango objetivo 0,3-0,5 %. No cambies nada.`);
      else if(trend>-0.3 && trend<0.1){
        if(dCint!=null && dCint<-0.3){
          push('ok','Peso estancado pero <strong>la cintura baja</strong>. Es recomposición en curso: el mejor resultado posible. <strong>No toques nada.</strong>');
        } else if(adh!=null && adh<90){
          push('warn',`Peso estancado y adherencia del ${adh.toFixed(0)} %. <strong>El problema no es la dieta, es el cumplimiento.</strong> No se ajustan calorías.`);
          acc.push('Cerrar la adherencia por encima del 90 % antes de tocar los macros.');
        } else {
          push('warn','Peso estancado 2 semanas con buena adherencia.');
          if(pasosMed!=null && pasosMed < ph.pasos){
            acc.push(`Subir pasos de ${Math.round(pasosMed)} a ${ph.pasos} antes de recortar comida. El plan prioriza pasos sobre calorías.`);
          } else {
            acc.push(`Recortar 150 kcal de hidratos: ${ph.kcal} → ${ph.kcal-150}.`);
          }
        }
      }
      else if(trend<-0.8){ push('bad',`Bajas ${Math.abs(trend).toFixed(2)} %/semana, por encima del 0,8 %. Riesgo de perder masa magra.`);
        acc.push(`Subir 200 kcal: ${ph.kcal} → ${ph.kcal+200}.`); }
      else if(trend>=0.1){ push('bad','Subes de peso estando en déficit.');
        acc.push('Auditar el registro antes de cambiar calorías: el fallo casi siempre está en aceites, salsas y fines de semana.'); }
    }

    // ── Reglas de superávit ──
    if(superavit && trend!=null){
      if(trend>=0.2 && trend<=0.3) push('ok',`Subes ${trend.toFixed(2)} %/semana. Rango objetivo 0,2-0,3 %. Nada que cambiar.`);
      else if(trend<0.2){ push('warn','Ganancia por debajo del objetivo.'); acc.push(`Subir 150 kcal: ${ph.kcal} → ${ph.kcal+150}.`); }
      else { push('bad',`Subes ${trend.toFixed(2)} %/semana. Por encima del 0,5 % la ganancia es grasa.`);
        acc.push(`Bajar 200 kcal: ${ph.kcal} → ${ph.kcal-200}.`); }
    }

    // ── Transversales ──
    if(suenoMed!=null && suenoMed<6.5) push('warn',`Sueño medio de ${suenoMed.toFixed(1)} h. Es el limitante nº1 del plan: por debajo de 6,5 h todo lo demás rinde menos.`);
    if(pasosMed!=null && pasosMed < ph.pasos*0.8) push('warn',`Pasos medios ${Math.round(pasosMed)} frente al objetivo de ${ph.pasos}. Son ~300 kcal/día de margen que estás dejando sin usar.`);
    if(adh!=null) push(adh>=90?'ok':'warn',`Adherencia de dieta: ${adh.toFixed(0)} % (14 días).`);

    const semana = Calc.weekNum(hoy);
    if(semana===5) acc.push('Semana 5: registrar las 7 marcas de referencia a RIR 2. Sin tests a 1RM.');
    if(semana>0 && semana%2===0) acc.push('Semana par: toca toma de perímetros.');

        /* ── Disposición ↔ rendimiento, agrupado por semanas ── */
    const sem = {};
    this.B.forEach(b=>{
      const r = Calc.readiness(b); if(r==null) return;
      const k = D.weekStart(b.fecha);
      (sem[k] = sem[k] || {disp:[], ton:0, rpe:[]}).disp.push(r);
    });
    this.W.filter(w=>w.estado==='done').forEach(w=>{
      const k = D.weekStart(w.fecha);
      if(!sem[k]) return;
      sem[k].ton += (w.ex||[]).reduce((s,e)=>s+Calc.tonnage(e.sets), 0);
      if(w.rpe!=null) sem[k].rpe.push(w.rpe);
    });
    const wks = Object.values(sem)
      .map(v=>({disp:v.disp.reduce((a,b)=>a+b,0)/v.disp.length, ton:v.ton,
        rpe:v.rpe.length ? v.rpe.reduce((a,b)=>a+b,0)/v.rpe.length : null}))
      .filter(x=>x.ton>0);

    if(wks.length>=4){
      const alto = wks.filter(x=>x.disp>=70), bajo = wks.filter(x=>x.disp<70);
      if(alto.length && bajo.length){
        const tA = alto.reduce((s,x)=>s+x.ton,0)/alto.length;
        const tB = bajo.reduce((s,x)=>s+x.ton,0)/bajo.length;
        const dt = (tA-tB)/tB*100;
        const rA = alto.filter(x=>x.rpe!=null), rB = bajo.filter(x=>x.rpe!=null);
        const rpeTxt = (rA.length && rB.length)
          ? ` y el RPE medio ${(rA.reduce((s,x)=>s+x.rpe,0)/rA.length -
              rB.reduce((s,x)=>s+x.rpe,0)/rB.length).toFixed(1)} puntos` : '';
        push('info',`<strong>Disposición y rendimiento:</strong> en las semanas con
          disposición media ≥ 70, tu tonelaje fue un
          <strong>${dt>=0?'+':''}${dt.toFixed(0)} %</strong>${rpeTxt} respecto a las semanas
          por debajo de 70. (${alto.length} semanas altas, ${bajo.length} bajas.)`);
      }
    }

    /* ── Estrés ↔ adherencia: tu umbral personal ── */
    const conE = this.B.filter(b=>b.estres!=null);
    if(conE.length>=10){
      const media = filtro=>{
        const arr = conE.filter(filtro).map(b=>{
          const a = Diet.adherenceOf(b.fecha);
          return a==='completo' ? 100 : a==='parcial' ? 60 : 30;
        });
        return arr.length>=3 ? arr.reduce((x,y)=>x+y,0)/arr.length : null;
      };
      const aAlto = media(b=>b.estres>=4), aBajo = media(b=>b.estres<=2);
      if(aAlto!=null && aBajo!=null)
        push(aAlto < aBajo-10 ? 'warn' : 'info',
          `<strong>Estrés y adherencia:</strong> con estrés alto (4-5) tu adherencia media es
           del <strong>${aAlto.toFixed(0)} %</strong>, frente al ${aBajo.toFixed(0)} % con
           estrés bajo (1-2).` +
          (aAlto < aBajo-10 ? ' Ese es tu umbral: a partir de estrés 4 no hay que apretar, hay que degradar a Nivel 2.' : ''));
    }

    /* ── Disposición baja sostenida: criterio de descarga ── */
    const d7 = this.B.filter(b=>b.fecha>=D.add(hoy,-6))
      .map(b=>Calc.readiness(b)).filter(v=>v!=null);
    const bajas = d7.filter(v=>v<50).length;
    if(bajas>=4){
      push('bad',`Disposición por debajo de 50 en ${bajas} de los últimos 7 días.`);
      acc.push('Semana de descarga: mismo peso, 50 % de las series, RIR 4.');
    }

    /* ── Estrés sostenido: activar el protocolo de mínimos ── */
    const e3 = conE.sort((a,b)=>a.fecha<b.fecha?1:-1).slice(0,3);
    if(e3.length===3 && e3.every(b=>b.estres>=4) && this.nivel===1){
      push('bad','<strong>Estrés alto tres días seguidos.</strong>');
      acc.push('Pasar a Nivel 2 esta semana: 3 sesiones full-body, cargas al 90 %, dieta a mantenimiento. En una semana mala no se abandona, se degrada.');
    }

    /* ── Pausa de dieta: solo si se cumplen los tres criterios ── */
    if(deficit){
      const semEnFase = Math.floor(D.diffDays(ph.desde, hoy)/7);
      const d14 = this.B.filter(b=>b.fecha>=D.add(hoy,-13))
        .map(b=>Calc.readiness(b)).filter(v=>v!=null);
      const dMed = d14.length>=7 ? d14.reduce((a,b)=>a+b,0)/d14.length : null;
      if(semEnFase>=6 && dMed!=null && dMed<55 && trend!=null && trend>-0.2){
        push('warn',`<strong>Criterios de pausa de dieta cumplidos:</strong> ${semEnFase} semanas
          en déficit, disposición media de ${dMed.toFixed(0)} y pérdida estancada.`);
        acc.push('Pausa de dieta de 7-10 días a mantenimiento. No es un fallo: es lo que hace que las 20 semanas se completen en lugar de abandonarse en la 14.');
      }
    }
    
    el('checkinBody').innerHTML = `
      <p class="hint">${ph.n} · Semana ${semana<1?0:semana} · ${D.labelLong(hoy)}</p>
      ${out.map(o=>`<p class="verdict ${o.t==='ok'?'ok':o.t==='bad'?'bad':o.t==='warn'?'warn':''}">${o.txt}</p>`).join('')}
      ${acc.length?`<div class="card hl"><h2>Acciones para esta semana</h2>
        ${acc.map(a=>`<p>→ ${a}</p>`).join('')}</div>`
        :'<p class="verdict ok">Sin acciones. Sigue igual.</p>'}`;
  },

  /* ═══ RECORDATORIOS ═══ */
    /* ═══ AVISOS ═══
     No se pintan en la página: se mandan a la campana de la cabecera. */
  async renderReminders(){
    const hoy = D.today(), av = [];

    const lastExp = await DB.setting('last_export');
    if(!lastExp || D.diffDays(lastExp,hoy)>=7)
      av.push(`<strong>Exportar backup</strong> — ${lastExp?`última copia hace ${D.diffDays(lastExp,hoy)} días`:'nunca exportado'}. Los datos viven solo en este móvil.`);

    const lastM = this.M.map(m=>m.fecha).sort().pop();
    if(!lastM || D.diffDays(lastM,hoy)>=14)
      av.push(`<strong>Tomar perímetros</strong> — ${lastM?`última toma hace ${D.diffDays(lastM,hoy)} días`:'sin línea base'}. Toca cada 14 días.`);

    const lastF = this.B.filter(b=>b.foto).map(b=>b.fecha).sort().pop();
    if(!lastF || D.diffDays(lastF,hoy)>=28)
      av.push(`<strong>Hacer las 5 fotos</strong> — ${lastF?`últimas hace ${D.diffDays(lastF,hoy)} días`:'sin fotos de referencia'}. Misma luz, mismo sitio, misma hora.`);

    const hoyB = this.B.find(b=>b.fecha===hoy);
    if(!hoyB || hoyB.peso==null)
      av.push('<strong>Pesarte y registrarlo</strong> — en ayunas, después del baño. El dato de hoy falta.');

    if(Calc.weekNum(hoy)===5)
      av.push('<strong>Semana 5</strong> — registrar las 7 marcas de referencia a RIR 2. Sin tests a 1RM.');

    if(D.dow(hoy)===0)
      av.push('<strong>Es domingo</strong> — revisión semanal, exportar backup y batch cooking de lunes a miércoles.');

    if(!hoyB || hoyB.pasos==null)
      av.push('<strong>Registrar pasos y estado</strong> — pestaña Noche del registro del día.');

    const inval = this.B.length - this.validDays();
    if(inval>=3)
      av.push(`<strong>${inval} días sin menú completo</strong> — no cuentan para calibrar el gasto. Confirma las comidas o anota las kcal a mano.`);

    const eu = this.B.filter(b=>b.estres!=null).sort((a,b)=>a.fecha<b.fecha?1:-1).slice(0,3);
    if(eu.length===3 && eu.every(b=>b.estres>=4) && this.nivel===1)
      av.push('<strong>Estrés alto sostenido</strong> — el plan indica pasar a Nivel 2 esta semana.');

    App.setPending(av);
    el('sumMeas').textContent = lastM ? `hace ${D.diffDays(lastM,hoy)} d` : 'sin datos';
  },
};

/* ═══════════════════ GRÁFICAS SVG ═══════════════════
   Sin librerías externas: la app tiene que funcionar sin internet. */

function lineChart(datasets, h, invert){
  h = h || 150;
  const all = datasets.flatMap(d=>d.pts).filter(p=>p.y!=null);
  if(all.length<2) return '<p class="hint">Datos insuficientes para la gráfica.</p>';

  const W = 600, P = 34;
  const xs = [...new Set(all.map(p=>p.x))].sort();
  let lo = Math.min(...all.map(p=>p.y)), hi = Math.max(...all.map(p=>p.y));
  if(hi-lo < Math.abs(hi)*0.02 + 0.01){ lo -= 0.5; hi += 0.5; }
  const pad = (hi-lo)*0.15; lo -= pad; hi += pad;

  const X = f=>P + xs.indexOf(f)*(W-2*P)/Math.max(1,xs.length-1);
  const Y = v=>invert
    ? P + (hi-v)*(h-2*P)/(hi-lo)          // eje invertido: bajar = mejorar
    : h-P - (v-lo)*(h-2*P)/(hi-lo);

  const lines = datasets.map(d=>{
    const pts = d.pts.filter(p=>p.y!=null).map(p=>X(p.x)+','+Y(p.y)).join(' ');
    return pts ? `<polyline points="${pts}" fill="none" stroke="${d.col}"
      stroke-width="${d.w||2}" stroke-linejoin="round" stroke-linecap="round"
      opacity="${d.op??1}"/>` : '';
  }).join('');

  return `<svg viewBox="0 0 ${W} ${h}" class="chart">
    <line x1="${P}" y1="${h-P}" x2="${W-P}" y2="${h-P}" stroke="var(--line)"/>
    <text x="2" y="${Y(hi-pad)+4}" class="axis">${(hi-pad).toFixed(2)}</text>
    <text x="2" y="${Y(lo+pad)+4}" class="axis">${(lo+pad).toFixed(2)}</text>
    <text x="${P}" y="${h-8}" class="axis">${D.label(xs[0])}</text>
    <text x="${W-P}" y="${h-8}" class="axis" text-anchor="end">${D.label(xs[xs.length-1])}</text>
    ${lines}</svg>`;
}

function barChart(pts, ref){
  if(!pts.length) return '<p class="hint">Sin datos.</p>';
  const W = 600, h = 150, P = 30;
  const hi = Math.max(ref||0, ...pts.map(p=>p.y)) * 1.1;
  const bw = (W-2*P)/pts.length * 0.7;
  const X = i=>P + i*(W-2*P)/pts.length + ((W-2*P)/pts.length - bw)/2;
  const Y = v=>h-P - v*(h-2*P)/hi;

  return `<svg viewBox="0 0 ${W} ${h}" class="chart">
    <line x1="${P}" y1="${h-P}" x2="${W-P}" y2="${h-P}" stroke="var(--line)"/>
    ${ref?`<line x1="${P}" y1="${Y(ref)}" x2="${W-P}" y2="${Y(ref)}"
      stroke="var(--bad)" stroke-dasharray="5 4" opacity="0.7"/>
      <text x="${W-P}" y="${Y(ref)-5}" class="axis" text-anchor="end">${ref} km</text>`:''}
    ${pts.map((p,i)=>`<rect x="${X(i)}" y="${Y(p.y)}" width="${bw}"
      height="${h-P-Y(p.y)}" rx="3" fill="var(--ac2)" opacity="0.85"/>`).join('')}
    <text x="${P}" y="${h-8}" class="axis">${D.label(pts[0].x)}</text>
    <text x="${W-P}" y="${h-8}" class="axis" text-anchor="end">${D.label(pts[pts.length-1].x)}</text>
  </svg>`;
}

/* Acordeón reutilizable para las tarjetas generadas por JavaScript.
   Usa <details> nativo: sin estado en JS, no se puede desincronizar. */
function acc(title, body, cls, open, sum){
  return `<details class="acc ${cls||''}"${open?' open':''}>
    <summary><i class="lead"></i>${title}${sum?`<span class="sum">${sum}</span>`:''}</summary>
    <div class="acc-body">${body}</div></details>`;
}