'use strict';

/* ═══════════════════ ENTRENO ═══════════════════
   Calendario · popup del día · registro ejercicio a ejercicio ·
   sustituciones · timer de descanso · resumen comparativo · running */

const el = id=>document.getElementById(id);

const Train = {
  cal:{y:0, m:0},          // mes visible en el calendario
  W:null,                  // sesión en curso (borrador)
  idx:0,                   // índice del ejercicio actual
  cacheW:[], cacheR:[], cacheB:[],

  async init(){
    const t = D.today();
    this.cal.y = D.parse(t).getFullYear();
    this.cal.m = D.parse(t).getMonth();

    el('calPrev').onclick = ()=>this.moveMonth(-1);
    el('calNext').onclick = ()=>this.moveMonth(1);
    el('dayModalClose').onclick = ()=>this.closeModal('dayModal');
    el('subModalClose').onclick = ()=>this.closeModal('subModal');
    el('bSaveRun').onclick = ()=>this.saveRun();
    el('logBack').onclick = ()=>this.exitLog();
    el('logDiscard').onclick = async()=>{
      if(!this.W) return;
      const ok = await this.deleteWorkout(this.W.id,
        'Se descartará esta sesión y todo lo que hayas registrado en ella.\n\n¿Continuar?');
      if(ok){
        this.W = null;
        el('logView').classList.add('hide');
        el('finishView').classList.add('hide');
        el('trainView').classList.remove('hide');
      }
    };

    el('runTipo').innerHTML = Object.entries(RUN_TYPES)
      .map(([k,v])=>`<option value="${k}">${v.n}</option>`).join('');

    await this.reload();
  },

  async reload(){
    this.cacheW = await DB.getAll('workouts');
    this.cacheR = await DB.getAll('runs');
    this.cacheB = await DB.getAll('body');
    this.renderCalendar();
    await this.renderRunPanel();
  },

  moveMonth(n){
    this.cal.m += n;
    if(this.cal.m<0){this.cal.m=11;this.cal.y--;}
    if(this.cal.m>11){this.cal.m=0;this.cal.y++;}
    this.renderCalendar();
  },

  /* ───────── CALENDARIO ───────── */
  renderCalendar(){
    const {y,m} = this.cal;
    el('calTitle').textContent = D.monthName(y,m);

    const first = new Date(y,m,1);
    const offset = (first.getDay()+6)%7;               // lunes primero
    const days = new Date(y,m+1,0).getDate();
    const t = D.today();

    const wByDate = {}, rByDate = {};
    this.cacheW.forEach(w=>{(wByDate[w.fecha]=wByDate[w.fecha]||[]).push(w);});
    this.cacheR.forEach(r=>{(rByDate[r.fecha]=rByDate[r.fecha]||[]).push(r);});

    let html = '<div class="cal-grid">' +
      ['L','M','X','J','V','S','D'].map(d=>`<div class="cal-h">${d}</div>`).join('') +
      '<div style="grid-column:span '+offset+'"></div>';

    for(let d=1; d<=days; d++){
      const f = D.iso(new Date(y,m,d));
      const plan = Calc.plannedSession(f);
      const done = (wByDate[f]||[]).some(w=>w.estado==='done');
      const draft = (wByDate[f]||[]).some(w=>w.estado==='draft');
      const runsDone = (rByDate[f]||[]).length>0;
      const runsPlan = Calc.plannedRuns(f).length>0;

      const cls = ['cal-d'];
      if(f===t) cls.push('is-today');
      if(f>t)   cls.push('is-future');

      let dots = '';
      if(done)        dots += '<i class="dot ok"></i>';
      else if(draft)  dots += '<i class="dot draft"></i>';
      else if(plan)   dots += '<i class="dot plan"></i>';
      if(runsDone)    dots += '<i class="dot run"></i>';
      else if(runsPlan) dots += '<i class="dot runplan"></i>';

      html += `<button class="${cls.join(' ')}" data-f="${f}">
        <span>${d}</span><div class="dots">${dots}</div>
        ${plan?`<em>${plan}</em>`:''}</button>`;
    }
    html += '</div>';
    el('trainCal').innerHTML = html;
    el('trainCal').querySelectorAll('.cal-d').forEach(b=>
      b.onclick = ()=>this.openDay(b.dataset.f));
  },

  /* ───────── POPUP DEL DÍA ───────── */
  async openDay(f){
    const plan = Calc.plannedSession(f);
    const S = plan ? SESSIONS[plan] : null;
    const ws = this.cacheW.filter(w=>w.fecha===f);
    const done = ws.find(w=>w.estado==='done');
    const draft = ws.find(w=>w.estado==='draft');
    const runs = this.cacheR.filter(r=>r.fecha===f);
    const runsPlan = Calc.plannedRuns(f);
    const ph = Calc.phaseFor(f), wk = Calc.weekNum(f), rir = Calc.rirFor(f);

    let h = `<h3>${D.labelLong(f)}</h3>
      <p class="hint">${ph.n} · Semana ${wk<1?0:wk} ·
        ${rir==='descarga'?'<strong>SEMANA DE DESCARGA</strong>':'RIR objetivo <strong>'+rir+'</strong>'}</p>`;

    if(S){
      h += `<div class="card2"><h4>${S.n}</h4>
        <p class="note">${S.nota}</p>
        <table><tr><th>Ejercicio</th><th class="n">Series</th><th class="n">Carga</th></tr>
        ${S.ex.map(([id,se,re,ca])=>{
          const e = EX[id];
          const last = this.lastFor(id, f);
          return `<tr><td>${e.n}<br><span class="tag">${e.g}</span>
            ${last?`<br><em class="hint">última: ${last.carga} kg × ${last.reps} · RIR ${last.rir??'—'}</em>`:''}</td>
            <td class="n">${se}×${re}${e.unidad==='seg'?'s':''}</td>
            <td class="n">${ca||'—'}</td></tr>`;
        }).join('')}</table></div>`;
    } else {
      h += '<p class="hint">Sin sesión de gimnasio planificada este día.</p>';
    }

    if(runsPlan.length) h += `<div class="card2"><h4>Running planificado</h4>
      ${runsPlan.map(r=>`<p>${RUN_TYPES[r.t].n} · ${r.min} min · ritmo ${RUN_TYPES[r.t].ritmo}</p>`).join('')}</div>`;
    if(runs.length) h += `<div class="card2"><h4>Carreras registradas</h4>
      ${runs.map(r=>`<p>${RUN_TYPES[r.tipo]?.n} · ${r.km} km · ${Calc.pace(r.km,r.seg)}/km</p>`).join('')}</div>`;

    h += '<div class="row c2" style="margin-top:14px">';
    if(done) h += `<button class="b-info" data-act="sum">Ver resumen</button>`;
    if(S && !done) h += `<button class="primary" data-act="${draft?'resume':'start'}">
      ${draft?'Continuar sesión':'Empezar sesión'}</button>`;
    if(S && done) h += `<button data-act="start">Registrar otra vez</button>`;
    h += '</div>';
    if(draft) h += `<button class="b-bad" data-act="deldraft" style="margin-top:8px">
      Descartar el borrador</button>`;
    if(done)  h += `<button class="b-bad" data-act="deldone" style="margin-top:8px">
      Borrar la sesión registrada</button>`;

    el('dayModalBody').innerHTML = h;
    el('dayModalBody').querySelectorAll('[data-act]').forEach(b=>b.onclick = async()=>{
      const a = b.dataset.act;

      if(a==='deldraft'){
        if(await this.deleteWorkout(draft.id,
          'Se descartará el borrador de esta sesión.\n\n¿Continuar?')) this.closeModal('dayModal');
        return;
      }
      if(a==='deldone'){
        if(await this.deleteWorkout(done.id,
          `Se borrará la sesión ${done.sesion} del ${D.label(done.fecha)} con todas sus series.\n\n` +
          'Dejará de contar para el volumen, las marcas y la progresión. ¿Continuar?'))
          this.closeModal('dayModal');
        return;
      }

      this.closeModal('dayModal');
      if(a==='sum') this.showSummary(done);
      else if(a==='resume') this.enterLog(draft);
      else this.startSession(f, plan);
    });
    el('dayModal').classList.add('on');
  },

  closeModal(id){el(id).classList.remove('on');},

  /* Última serie registrada de un ejercicio, antes de una fecha dada.
     Es la referencia de la doble progresión. */
  lastFor(exId, before){
    let best = null;
    this.cacheW.filter(w=>w.estado==='done' && (!before || w.fecha<before))
      .sort((a,b)=>a.fecha<b.fecha?-1:1)
      .forEach(w=>(w.ex||[]).forEach(e=>{
        if((e.exReal||e.exPlan)!==exId)return;
        const top = (e.sets||[]).filter(s=>s.carga>0&&s.reps>0)
          .sort((a,b)=>Calc.e1rm(b.carga,b.reps)-Calc.e1rm(a.carga,a.reps))[0];
        if(top) best = {...top, fecha:w.fecha};
      }));
    return best;
  },

  /* ───────── REGISTRO ───────── */
  async startSession(f, sesionId){
    const S = SESSIONS[sesionId];
    const W = {fecha:f, sesion:sesionId, estado:'draft', idx:0,
      ex:S.ex.map(([id,se,re,ca])=>({
        exPlan:id, exReal:id, grupo:EX[id].g, plan:{se,re,ca},
        sets:Array.from({length:se},()=>({carga:ca||null, reps:re, rir:null})),
        nota:null, hecho:false}))};
    W.id = await DB.put('workouts', W);
    await this.reload();
    this.enterLog(W);
  },

  enterLog(W){
    this.W = W;
    this.idx = W.idx || W.ex.findIndex(e=>!e.hecho);
    if(this.idx<0) this.idx = 0;
    el('trainView').classList.add('hide');
    el('finishView').classList.add('hide');
    el('logView').classList.remove('hide');
    this.renderExercise();
  },

  async exitLog(){
    const W = this.W;
    el('logView').classList.add('hide');
    el('finishView').classList.add('hide');
    el('trainView').classList.remove('hide');
    this.W = null;
    // Si abriste la sesión por error y no registraste nada, no deja rastro
    if(W && W.id && this.draftIsEmpty(W)) await DB.del('workouts', W.id);
    await this.reload();
    await App.renderHoy();
  },

  /* Un borrador se considera vacío si no se ha tocado nada: ningún ejercicio
     marcado como hecho, ningún RIR introducido y ninguna nota. Las cargas y
     reps no cuentan porque vienen precargadas de la plantilla. */
  draftIsEmpty(W){
    if(!W || W.estado!=='draft') return true;
    return !(W.ex||[]).some(e=>
      e.hecho || e.nota || (e.sets||[]).some(s=>s.rir!=null));
  },

  async deleteWorkout(id, aviso){
    if(!confirm(aviso)) return false;
    await DB.del('workouts', id);
    Timer && null;                       // sin efecto, evita referencias sueltas
    await this.reload();
    await App.renderHoy();
    return true;
  },

  renderExercise(){
    const W = this.W, S = SESSIONS[W.sesion];
    const e = W.ex[this.idx];
    const ex = EX[e.exReal];
    const rir = Calc.rirFor(W.fecha);
    const last = this.lastFor(e.exReal, W.fecha);
    const sub = e.exReal!==e.exPlan;
    const rango = this.repRange(e.plan.re);

    el('logHead').innerHTML = `<strong>${S.n}</strong><br>
      <span class="hint">${D.label(W.fecha)} · RIR objetivo ${rir}</span>`;
    el('logProgress').innerHTML = W.ex.map((x,i)=>
      `<i class="pip ${x.hecho?'ok':''} ${i===this.idx?'cur':''}"></i>`).join('') +
      `<span class="hint"> ${this.idx+1}/${W.ex.length}</span>`;

    el('logBody').innerHTML = `
      <div class="card">
        <h3 style="margin:0 0 4px">${ex.n}</h3>
        <p class="hint">${ex.g} · ${ex.p} · descanso ${Math.round(ex.r/60*10)/10} min
          ${sub?`<br><span class="tag warn">Sustituye a ${EX[e.exPlan].n}</span>`:''}</p>
        ${ex.tip?`<p class="note">${ex.tip}</p>`:''}
        <p class="hint">Objetivo <strong>${e.plan.se}×${e.plan.re}${ex.unidad==='seg'?'s':''}</strong>
          · rango de progresión ${rango[0]}-${rango[1]} reps
          ${last?`<br>Última vez: <strong>${last.carga} kg × ${last.reps}</strong> · RIR ${last.rir??'—'} · ${D.label(last.fecha)}`
                :'<br>Sin registro previo de este ejercicio.'}</p>

        <div class="setgrid">
          <div class="set-h"><i></i><span>${ex.unidad==='seg'?'kg':'kg'}</span><span>${ex.unidad==='seg'?'seg':'reps'}</span><span>RIR</span><span></span></div>
          ${e.sets.map((s,i)=>`<div class="set" data-s="${i}">
            <i>${i+1}</i>
            <input type="number" step="0.5" inputmode="decimal" data-f="carga" value="${s.carga??''}">
            <input type="number" inputmode="numeric" data-f="reps" value="${s.reps??''}">
            <input type="number" inputmode="numeric" data-f="rir" value="${s.rir??''}" placeholder="${rir==='descarga'?4:rir}">
            <button class="mini" data-done="${i}">✓</button>
          </div>`).join('')}
        </div>

        <div class="row c2" style="margin-top:10px">
          <button data-act="addset">+ serie</button>
          <button data-act="sub">Cambiar ejercicio</button>
        </div>
        <label style="margin-top:10px">Nota de este ejercicio</label>
        <input data-f="nota" value="${e.nota??''}" placeholder="Ej: 3ª serie con ayuda">
      </div>`;

    el('logNav').innerHTML = `
      <button ${this.idx===0?'disabled':''} data-nav="-1">← Anterior</button>
      ${this.idx===W.ex.length-1
        ? '<button class="primary" data-nav="end">Terminar sesión</button>'
        : '<button class="primary" data-nav="1">Guardar y siguiente →</button>'}`;

    // Listeners
    el('logBody').querySelectorAll('.set input').forEach(inp=>{
      inp.oninput = ()=>this.readInputs();
      inp.onblur  = ()=>this.persist();
    });
    el('logBody').querySelector('[data-f=nota]').onblur = ()=>{this.readInputs();this.persist();};
    el('logBody').querySelectorAll('[data-done]').forEach(b=>b.onclick = ()=>{
      this.readInputs(); this.persist();
      b.classList.add('ok');
    });
    el('logBody').querySelector('[data-act=addset]').onclick = ()=>{
      this.readInputs();
      const cur = this.W.ex[this.idx];
      const lastS = cur.sets[cur.sets.length-1] || {};
      cur.sets.push({carga:lastS.carga??null, reps:lastS.reps??null, rir:null});
      this.persist(); this.renderExercise();
    };
    el('logBody').querySelector('[data-act=sub]').onclick = ()=>this.openSub();
    el('logNav').querySelectorAll('[data-nav]').forEach(b=>b.onclick = ()=>{
      const v = b.dataset.nav;
      this.readInputs();
      if(v!=='-1') this.W.ex[this.idx].hecho = true;
      this.persist();
      if(v==='end'){ this.finish(); return; }
      this.idx = Math.min(Math.max(0,this.idx + (+v)), this.W.ex.length-1);
      this.W.idx = this.idx;
      this.renderExercise();
      window.scrollTo(0,0);
    });
  },

  readInputs(){
    const e = this.W.ex[this.idx];
    el('logBody').querySelectorAll('.set').forEach(node=>{
      const i = +node.dataset.s;
      const gv = f=>{const v=node.querySelector(`[data-f=${f}]`).value;
        const n=parseFloat(String(v).replace(',','.'));return isFinite(n)?n:null;};
      e.sets[i] = {carga:gv('carga'), reps:gv('reps'), rir:gv('rir')};
    });
    const nn = el('logBody').querySelector('[data-f=nota]');
    e.nota = nn && nn.value.trim() ? nn.value.trim() : null;
  },

  async persist(){
    if(!this.W)return;
    this.W.idx = this.idx;
    await DB.put('workouts', this.W);
  },

  /* Rango de progresión a partir de las reps objetivo */
  repRange(re){
    if(re<=6)  return [re, re+2];
    if(re<=12) return [re, re+4];
    return [re, re+5];
  },

  /* Incremento de carga sugerido según el grupo muscular */
  loadStep(exId){
    const g = EX[exId].g;
    if([G.CUA,G.ISQ].includes(g)) return 5;
    if([G.DOR,G.EM,G.PEC,G.DA].includes(g)) return 2.5;
    return 1.25;
  },

  /* ───────── SUSTITUCIÓN ───────── */
  openSub(){
    const e = this.W.ex[this.idx];
    const base = EX[e.exPlan];
    const opts = (base.sub||[]).filter(id=>EX[id] && !EX[id].veto);

    el('subModalBody').innerHTML = `
      <h3>Cambiar ejercicio</h3>
      <p class="hint">Planificado: <strong>${base.n}</strong> · ${base.g}<br>
        Los sustitutos comparten patrón y grupo muscular, así que el cómputo de
        volumen y la progresión no se rompen.</p>
      ${opts.map(id=>{
        const s = EX[id], last = this.lastFor(id, this.W.fecha);
        return `<button class="opt ${id===e.exReal?'sel':''}" data-id="${id}">
          <strong>${s.n}</strong><br><span class="hint">${s.p}
          ${last?` · última: ${last.carga} kg × ${last.reps}`:' · sin registro'}</span></button>`;
      }).join('')}
      ${e.exReal!==e.exPlan?`<button class="opt" data-id="${e.exPlan}">
        <strong>↩ Volver al planificado</strong><br><span class="hint">${base.n}</span></button>`:''}
      <div style="border-top:1px solid var(--line);margin:14px 0;padding-top:14px">
        <label>Otro ejercicio (escribir)</label>
        <input id="subFree" placeholder="Nombre del ejercicio">
        <label style="margin-top:8px">Grupo muscular — obligatorio</label>
        <select id="subGroup">${Object.values(G).filter(x=>x!==G.PRE)
          .map(x=>`<option ${x===base.g?'selected':''}>${x}</option>`).join('')}</select>
        <button style="margin-top:10px" id="subFreeGo">Usar este</button>
        <p class="hint">El grupo es obligatorio: sin él, estas series desaparecerían
          del cómputo de volumen semanal.</p>
      </div>`;

    el('subModalBody').querySelectorAll('.opt').forEach(b=>b.onclick = async()=>{
      const id = b.dataset.id;
      e.exReal = id; e.grupo = EX[id].g;
      const st = SESSIONS[this.W.sesion].ex[this.idx];
      const last = this.lastFor(id, this.W.fecha);
      e.sets = e.sets.map(s=>({...s, carga: last ? last.carga : (id===e.exPlan ? st[3]||null : null)}));
      await this.persist();
      this.closeModal('subModal');
      this.renderExercise();
    });

    el('subFreeGo').onclick = async()=>{
      const n = el('subFree').value.trim();
      if(!n)return;
      const gr = el('subGroup').value;
      const id = 'libre_'+n.toLowerCase().replace(/[^a-z0-9]+/g,'_');
      EX[id] = {n, g:gr, p:'libre', r:120, sub:[]};      // solo en memoria de sesión
      e.exReal = id; e.grupo = gr; e.libre = {n, g:gr};
      e.sets = e.sets.map(s=>({...s, carga:null}));
      await this.persist();
      this.closeModal('subModal');
      this.renderExercise();
    };

    el('subModal').classList.add('on');
  },

  /* ───────── CIERRE DE SESIÓN ───────── */
  finish(){
    const W = this.W;
    el('logView').classList.add('hide');
    el('finishView').classList.remove('hide');

    const hechos = W.ex.filter(e=>(e.sets||[]).some(s=>s.reps>0));

    el('finishBody').innerHTML = `
      <div class="card">
        <h2>Cerrar sesión</h2>
        <div class="row c2">
          <div><label>RPE de la sesión (1-10)</label>
            <input id="fiRpe" type="number" min="1" max="10" inputmode="numeric" value="${W.rpe??''}"></div>
          <div><label>Duración (min)</label>
            <input id="fiDur" type="number" inputmode="numeric" value="${W.dur??''}"></div>
        </div>
        <label style="margin-top:10px">Notas de la sesión</label>
        <textarea id="fiNotas">${W.notas??''}</textarea>
      </div>

      <div class="card">
        <h2>¿Algún ejercicio te ha dado molestias?</h2>
        <p class="hint">Marca solo los que hayan dado problema. Se registra como serie
          temporal, así que si un ejercicio te molesta de forma recurrente lo veremos.</p>
        ${hechos.map(e=>{
          const ex = EX[e.exReal];
          return `<div class="mol" data-ex="${e.exReal}">
            <label class="chk"><input type="checkbox" data-mc> ${ex.n}</label>
            <div class="mol-d hide">
              <div class="row c2">
                <div><label>Zona</label><select data-mz>
                  <option>Hombro derecho</option><option>Hombro izquierdo</option>
                  <option>Codo</option><option>Muñeca</option><option>Lumbar</option>
                  <option>Rodilla</option><option>Cadera</option><option>Cuello</option>
                  <option>Otra</option></select></div>
                <div><label>Nivel</label><select data-mn>
                  <option value="1">1 · Molestia leve</option>
                  <option value="2">2 · Molesta pero puedo seguir</option>
                  <option value="3">3 · He tenido que parar</option></select></div>
              </div>
            </div></div>`;
        }).join('')}
      </div>

      <button class="primary" id="fiSave">Guardar y ver resumen</button>
      <p class="ok-msg" id="mFi"></p>`;

    el('finishBody').querySelectorAll('.mol').forEach(node=>{
      node.querySelector('[data-mc]').onchange = ev=>
        node.querySelector('.mol-d').classList.toggle('hide', !ev.target.checked);
    });

    el('fiSave').onclick = async()=>{
      const gv = v=>{const n=parseFloat(v);return isFinite(n)?n:null;};
      W.rpe = gv(el('fiRpe').value);
      W.dur = gv(el('fiDur').value);
      W.notas = el('fiNotas').value.trim()||null;
      W.molestias = [...el('finishBody').querySelectorAll('.mol')]
        .filter(n=>n.querySelector('[data-mc]').checked)
        .map(n=>({ex:n.dataset.ex, zona:n.querySelector('[data-mz]').value,
                  nivel:+n.querySelector('[data-mn]').value}));
      W.estado = 'done';
      W.ex = W.ex.map(e=>({...e, sets:(e.sets||[]).filter(s=>s.reps>0)}))
                 .filter(e=>e.sets.length);
      W.cerrada = new Date().toISOString();
      await DB.put('workouts', W);
      await this.reload();
      this.showSummary(W);
    };
  },

  /* ───────── RESUMEN COMPARATIVO ───────── */
  showSummary(W){
    const prev = this.cacheW
      .filter(x=>x.estado==='done' && x.sesion===W.sesion && x.fecha<W.fecha && x.id!==W.id)
      .sort((a,b)=>a.fecha<b.fecha?1:-1)[0] || null;

    const key = e=>e.exReal||e.exPlan;
    const prevBy = {};
    if(prev)(prev.ex||[]).forEach(e=>{prevBy[key(e)] = e;});

    let tonNow = 0, tonPrev = 0, caidas = 0;
    const rows = (W.ex||[]).map(e=>{
      const ex = EX[key(e)] || {n:key(e), g:e.grupo};
      const best = s=>(s||[]).filter(x=>x.carga>0&&x.reps>0)
        .sort((a,b)=>Calc.e1rm(b.carga,b.reps)-Calc.e1rm(a.carga,a.reps))[0]||null;
      const bn = best(e.sets), tn = Calc.tonnage(e.sets);
      const p = prevBy[key(e)];
      const bp = p?best(p.sets):null, tp = p?Calc.tonnage(p.sets):null;
      tonNow += tn; if(tp) tonPrev += tp;

      const eN = bn?Calc.e1rm(bn.carga,bn.reps):null;
      const eP = bp?Calc.e1rm(bp.carga,bp.reps):null;
      const de = (eN!=null&&eP!=null)?(eN-eP)/eP*100:null;
      if(de!=null && de<-5) caidas++;

      // Doble progresión: todas las series en el tope del rango con el RIR objetivo
      const rango = this.repRange(e.plan?.re ?? 10);
      const rirObj = Calc.rirFor(W.fecha);
      const topeAlcanzado = e.sets.length>=(e.plan?.se??e.sets.length) &&
        e.sets.every(s=>s.reps>=rango[1] && (s.rir==null || s.rir>=(rirObj==='descarga'?4:rirObj)));

      return {ex, bn, eN, de, tn, tp, subst: e.exReal&&e.exPlan&&e.exReal!==e.exPlan,
        sube: topeAlcanzado ? (bn?.carga??0) + this.loadStep(key(e)) : null};
    });

    const dTon = tonPrev>0 ? (tonNow-tonPrev)/tonPrev*100 : null;
    let veredicto, vcls;
    if(dTon==null){ veredicto='Primera sesión de este tipo. Queda como línea base.'; vcls=''; }
    else if(caidas>=2){ veredicto='Retroceso: caída de e1RM superior al 5 % en '+caidas+' ejercicios.'; vcls='bad'; }
    else if(dTon>=3){ veredicto='Progresas. Tonelaje +'+dTon.toFixed(1)+' %.'; vcls='ok'; }
    else if(dTon>-3){ veredicto='Mantienes. Tonelaje '+dTon.toFixed(1)+' %.'; vcls='warn'; }
    else { veredicto='Retroceso. Tonelaje '+dTon.toFixed(1)+' %.'; vcls='bad'; }

    const subir = rows.filter(r=>r.sube!=null);
    const fatiga = this.fatigueCheck(W, caidas);

    el('finishView').classList.remove('hide');
    el('logView').classList.add('hide');
    el('finishBody').innerHTML = `
      <div class="card">
        <h2>${SESSIONS[W.sesion]?.n || W.sesion}</h2>
        <p class="hint">${D.labelLong(W.fecha)}
          ${prev?` · comparado con ${D.label(prev.fecha)}`:''}</p>
        <p class="verdict ${vcls}">${veredicto}</p>
        <div class="kpi">
          <div><span>Tonelaje</span><b>${Math.round(tonNow)} kg</b></div>
          <div><span>Series</span><b>${(W.ex||[]).reduce((s,e)=>s+e.sets.length,0)}</b></div>
          <div><span>RPE</span><b>${W.rpe??'—'}</b></div>
          <div><span>Duración</span><b>${W.dur?W.dur+' min':'—'}</b></div>
        </div>
      </div>

      ${subir.length?`<div class="card hl">
        <h2>Doble progresión — sube carga la próxima vez</h2>
        ${subir.map(r=>`<p>✔ <strong>${r.ex.n}</strong>: has completado el rango.
          Próxima sesión: <strong>${r.sube} kg</strong> y vuelve al fondo del rango.</p>`).join('')}
      </div>`:''}

      ${fatiga.length?`<div class="card warn-card">
        <h2>Aviso de fatiga</h2>
        ${fatiga.map(f=>`<p>⚠ ${f}</p>`).join('')}
        <p class="hint">Con dos o más criterios cumplidos, el plan indica descarga:
          misma carga, 50 % de las series, RIR 4.</p>
      </div>`:''}

      <div class="card">
        <h2>Detalle por ejercicio</h2>
        <table><tr><th>Ejercicio</th><th class="n">Mejor</th><th class="n">e1RM</th><th class="n">Δ</th></tr>
        ${rows.map(r=>`<tr>
          <td>${r.ex.n}${r.subst?' <span class="tag warn">sust.</span>':''}</td>
          <td class="n">${r.bn?`${r.bn.carga}×${r.bn.reps}`:'—'}</td>
          <td class="n">${r.eN!=null?r.eN.toFixed(1):'—'}</td>
          <td class="n ${r.de==null?'':r.de>=0?'up':'down'}">
            ${r.de==null?'—':(r.de>=0?'+':'')+r.de.toFixed(1)+' %'}</td>
        </tr>`).join('')}</table>
      </div>

      <button class="primary" onclick="Train.exitLog()">Volver al calendario</button>`;
  },

  /* Criterios de descarga del plan (§4.4). Dos o más → descarga. */
  fatigueCheck(W, caidas){
    const out = [];
    if(caidas>=2) out.push(`Caída de e1RM superior al 5 % en ${caidas} ejercicios distintos.`);

    const last3 = this.cacheW.filter(x=>x.estado==='done'&&x.rpe!=null)
      .sort((a,b)=>a.fecha<b.fecha?1:-1).slice(0,3);
    if(last3.length===3 && last3.every(x=>x.rpe>=9))
      out.push('RPE ≥ 9 en las tres últimas sesiones.');

    const week = this.cacheB.filter(b=>b.fecha>=D.add(W.fecha,-6) && b.fecha<=W.fecha);
    const malas = week.filter(b=>b.sueno!=null && b.sueno<6).length;
    if(malas>=4) out.push(`Sueño por debajo de 6 h en ${malas} noches de la última semana.`);

    const disp = week.map(b=>Calc.readiness(b)).filter(v=>v!=null);
    const bajas = disp.filter(v=>v<50).length;
    if(bajas>=4) out.push(`Disposición por debajo de 50 en ${bajas} días de la última semana.`);

    const mol = (W.molestias||[]).filter(m=>m.nivel>=2);
    if(mol.length) out.push(`Molestia de nivel ${Math.max(...mol.map(m=>m.nivel))} en ${mol.map(m=>m.zona).join(', ')}.`);

    return out.length>=2 ? out : (out.length===1 && caidas>=2 ? out : []);
  },

  /* ───────── RUNNING ───────── */
  async renderRunPanel(){
    const t = D.today();
    const plan = Calc.plannedRuns(t);
    el('runPlanned').innerHTML = plan.length
      ? plan.map(r=>{const T=RUN_TYPES[r.t];
          return `<p><strong>Hoy: ${T.n}</strong> · ${r.min} min · ritmo ${T.ritmo} · FC ${T.fc}
            ${T.tip?`</p><p class="note">${T.tip}`:''}</p>`;}).join('')
      : '<p class="hint">Hoy no hay carrera planificada.</p>';

    const rs = this.cacheR.sort((a,b)=>a.fecha<b.fecha?1:-1).slice(0,10);
    const km7 = this.cacheR.filter(r=>r.fecha>=D.add(t,-6))
      .reduce((s,r)=>s+(r.km||0),0);
    el('runHist').innerHTML = `<p class="hint">Últimos 7 días: <strong>${km7.toFixed(1)} km</strong>
      · techo del plan antes del 10 K: 35 km/semana</p>` +
      (rs.length?`<table><tr><th>Fecha</th><th>Tipo</th><th class="n">km</th>
        <th class="n">Ritmo</th><th class="n">FC</th><th></th></tr>
      ${rs.map(r=>`<tr><td>${D.label(r.fecha)}</td><td>${RUN_TYPES[r.tipo]?.n||r.tipo}</td>
        <td class="n">${(r.km||0).toFixed(2)}</td><td class="n">${Calc.pace(r.km,r.seg)||'—'}</td>
        <td class="n">${r.fcMedia??'—'}</td>
        <td class="n"><button class="mini" data-delrun="${r.id}">✕</button></td></tr>`).join('')}</table>`
      :'<p class="hint">Sin carreras registradas.</p>');

    el('runHist').querySelectorAll('[data-delrun]').forEach(b=>b.onclick = async()=>{
      if(!confirm('¿Borrar esta carrera?')) return;
      await DB.del('runs', +b.dataset.delrun);
      await this.reload();
    });
  },

  async saveRun(){
    const gv = id=>{const n=parseFloat(String(el(id).value).replace(',','.'));return isFinite(n)?n:null;};
    const km = gv('runKm'), min = gv('runMin')||0, seg = gv('runSeg')||0;
    if(!km || (min+seg)===0){
      flash(el('mRun'),'Faltan los kilómetros o el tiempo.',true); return;
    }
    await DB.put('runs',{fecha:el('runFecha').value||D.today(), tipo:el('runTipo').value,
      km, seg:min*60+seg, fcMedia:gv('runFc'), fcMax:gv('runFcMax'), rpe:gv('runRpe'),
      notas:el('runNotas').value.trim()||null});
    ['runKm','runMin','runSeg','runFc','runFcMax','runRpe','runNotas'].forEach(i=>el(i).value='');
    await this.reload();
    flash(el('mRun'),'Carrera guardada ✓');
  }
};

function flash(node,msg,bad){
  node.textContent = msg;
  node.style.color = bad ? 'var(--bad)' : 'var(--ac)';
  setTimeout(()=>{node.textContent='';}, 3500);
}