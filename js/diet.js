'use strict';

/* ═══════════════════ DIETA ═══════════════════
   Calendario de menús · cambio de plato con equivalencias ·
   recetas · base de alimentos · escáner de códigos de barras

   MODELO B: el menú de cada día lo genera la app desde la plantilla
   de la fase. Confirmas con un toque y solo detallas las desviaciones. */

const OFF_API = 'https://world.openfoodfacts.org/api/v2/product/';
const MEAL_ORDER = ['desayuno','almuerzo','comida','pre','cena'];

const Diet = {
  cal:{y:0, m:0},
  foods:{}, recipes:[], intake:[],
  scan:{stream:null, det:null, raf:null},
  recDraft:[],
  prefVerdura:'verdura_cong',
  selSauce:null,

  async init(){
    const t = D.today();
    this.cal.y = D.parse(t).getFullYear();
    this.cal.m = D.parse(t).getMonth();

    el('dietPrev').onclick = ()=>this.moveMonth(-1);
    el('dietNext').onclick = ()=>this.moveMonth(1);
    el('mealModalClose').onclick = ()=>el('mealModal').classList.remove('on');
    el('prepModalClose').onclick = ()=>el('prepModal').classList.remove('on');    

    document.querySelectorAll('#dietTabs button').forEach(b=>b.onclick = ()=>{
      document.querySelectorAll('#dietTabs button').forEach(x=>x.classList.toggle('on',x===b));
      ['cal','menu','shop','rec','food'].forEach(k=>el('dt-'+k).classList.toggle('hide', k!==b.dataset.dt));
      if(b.dataset.dt==='menu') this.renderMenuDoc();
    });

    /* ── Menú seguido ── */
    el('mnDesde').value = D.today();
    el('mnDesde').onchange = ()=>this.renderMenuDoc();
    el('mnDias').onchange  = ()=>this.renderMenuDoc();
    el('mnHoy').onclick    = ()=>{ el('mnDesde').value = D.today(); this.renderMenuDoc(); };
    el('mnTanda').onclick  = ()=>{
      const t = MENU_PLAN.tandaInfo(D.today());
      el('mnDesde').value = t.dias[0];
      el('mnDias').value  = String(t.dias.length);
      this.renderMenuDoc();
    };
    el('mnSemana').onclick = ()=>{
      el('mnDesde').value = D.weekStart(D.today());
      el('mnDias').value  = '7';
      this.renderMenuDoc();
    };

    el('bScan').onclick     = ()=>this.scanStart();
    el('bScanStop').onclick = ()=>this.scanStop();
    el('bBarcodeGo').onclick= ()=>this.lookup(el('barcodeManual').value.trim());
    el('foodSearch').oninput= ()=>this.renderFoods();
    el('bSaveFood').onclick = ()=>this.saveFood();
    el('bAddRecItem').onclick = ()=>this.addRecItem();
    el('bSaveRec').onclick  = ()=>this.saveRecipe();
    el('shDesde').value = this.nextMonday();
    el('bGenShop').onclick = ()=>this.genShop();
    el('shDesde').onchange = ()=>this.renderShop();
    el('shDias').onchange  = ()=>this.renderShop();
    el('shHoy').onclick    = ()=>{ el('shDesde').value = D.today();          this.renderShop(); };
    el('shManana').onclick = ()=>{ el('shDesde').value = D.add(D.today(),1);  this.renderShop(); };
    el('shLunes').onclick  = ()=>{ el('shDesde').value = this.nextMonday();   this.renderShop(); };

    this.prefVerdura = (await DB.setting('prefVerdura')) || 'verdura_cong';
    el('prefVerdura').value = this.prefVerdura;
    el('prefVerdura').onchange = async ev=>{
      this.prefVerdura = ev.target.value;
      await DB.setting('prefVerdura', this.prefVerdura);
      await this.reload();
    };

    await this.reload();
  },

  async reload(){
    const fs = await DB.getAll('foods');
    this.foods = {}; fs.forEach(f=>this.foods[f.id] = f);
    this.recipes = await DB.getAll('recipes');
    this.intake  = await DB.getAll('intake');
    this.renderCalendar();
    this.renderMenuDoc();
    this.renderFoods();
    this.renderRecipes();
    this.renderDishes();
    this.renderSauces();

    await this.renderShop();
  },

  moveMonth(n){
    this.cal.m += n;
    if(this.cal.m<0){this.cal.m=11;this.cal.y--;}
    if(this.cal.m>11){this.cal.m=0;this.cal.y++;}
    this.renderCalendar();
  },

  /* ═══ PLATO PLANIFICADO PARA UNA FECHA ═══
     Lo decide MENU_PLAN, que modela las TANDAS reales: el almuerzo y la
     comida son el mismo plato los tres días del bloque, y el desayuno, el
     pre-entreno y la cena cambian a diario.

     La versión anterior servía siempre la opción `base` en las cuatro
     franjas que no eran la cena, así que el desayuno y la comida no
     cambiaban nunca. Por eso el calendario mostraba el mismo menú todos
     los días del mes. */
  plannedOp(fecha, comida){
    const M = MEALS[comida];
    const id = MENU_PLAN.idFor(fecha, comida);
    return M.op.find(o=>o.id===id) || M.op.find(o=>o.base) || M.op[0];
  },

  /* Gramos de cottage PLANIFICADOS en un día, sumando las cinco franjas.
     No es una regla nutricional: es la línea que más sube de la cesta. */
  cottageOf(fecha){
    return MEAL_ORDER.reduce((s,c)=>{
      const it = this.opItems(this.plannedOp(fecha,c)) || [];
      const x = it.find(([id])=>id==='queso_cottage');
      return s + (x ? x[1] : 0);
    }, 0);
  },

    /* Sustituye la verdura de acompañamiento según la preferencia elegida.
     Afecta a los macros, a la lista de ingredientes y a la compra. */
  opItems(op){
    if(this.prefVerdura==='verdura_cong') return op.it;
    return op.it.map(([id,gr])=>id==='verdura_cong' ? [this.prefVerdura, gr] : [id,gr]);
  },

  macrosOf(op){ return Calc.macros(this.opItems(op), this.foods); },

  intakeOf(fecha, comida){
    return this.intake.find(i=>i.id === fecha+'|'+comida) || null;
  },

  /* Macros efectivos del día: lo registrado, no lo planificado */
  dayTotals(fecha){
    const t = {kcal:0,p:0,c:0,g:0,fib:0};
    MEAL_ORDER.forEach(c=>{
      const r = this.intakeOf(fecha,c);
      if(!r || !r.tot)return;
      ['kcal','p','c','g','fib'].forEach(k=>t[k] += r.tot[k]||0);
    });
    Object.keys(t).forEach(k=>t[k] = Math.round(t[k]*10)/10);
    return t;
  },

    /* Adherencia deducida del menú, sin campo manual.
     completo   = 5 comidas confirmadas y todos los cambios de plato equivalentes
     parcial    = 5 confirmadas pero con algún desvío o comida libre
     incompleto = menos de 5 → el día NO es válido para calibrar el gasto */
  adherenceOf(fecha){
    const recs = MEAL_ORDER.map(c=>this.intakeOf(fecha,c));
    if(recs.some(r=>!r)) return 'incompleto';
    const desvio = recs.some(r=>{
      if(r.opReal==='LIBRE') return true;
      const M = MEALS[r.comida];
      const plan = M.op.find(o=>o.id===r.opPlan) || M.op[0];
      const alt  = M.op.find(o=>o.id===r.opReal);
      if(!alt) return true;
      return Calc.swapCheck(this.macrosOf(plan), this.macrosOf(alt)).lvl !== 'ok';
    });
    return desvio ? 'parcial' : 'completo';
  },

  /* Raciones de legumbre de la semana. Sin avena en la dieta, el mínimo es 2. */
  legumeCount(fecha){
    const ws = D.weekStart(fecha);
    const LEG = ['CC','CC2','C5'];
    let n = 0;
    for(let i=0;i<7;i++){
      const f = D.add(ws,i);
      MEAL_ORDER.forEach(c=>{
        const r = this.intakeOf(f,c);
        if(r && LEG.includes(r.opReal)) n++;
      });
    }
    return n;
  },

  /* ═══════════════════ MENÚ SEGUIDO ═══════════════════
     Documento scrolleable: una hoja por día, una debajo de otra, con el
     menú que toca. Intervalo de 1 a 7 días. El encabezado fijo dice en
     qué día estás mientras bajas.

     Todo se calcula desde MENU_PLAN, que es función pura de la fecha, así
     que pintar 7 días no cuesta más que pintar uno. */

  menuRange(){
    const desde = el('mnDesde').value || D.today();
    const dias  = Math.min(7, Math.max(1, +el('mnDias').value || 3));
    return {desde, dias};
  },

  /* Nivel de desviación de un valor frente a su objetivo, con las
     tolerancias de SWAP_TOL: la proteína es más estricta que las kcal. */
  devLvl(v, obj, macro){
    if(!obj) return '';
    const d = Math.abs(v-obj)/obj;
    const t = macro==='p' ? [SWAP_TOL.ok.p, SWAP_TOL.warn.p] : [SWAP_TOL.ok.kcal, SWAP_TOL.warn.kcal];
    return d<=t[0] ? 'ok' : d<=t[1] ? 'warn' : 'bad';
  },

  /* Datos completos de un día: franjas, macros, totales y avisos */
  dayMenu(f){
    /* Fuera del macrociclo (antes del 19/08/2026 o después del 04/07/2027)
       phaseFor no devuelve nada. Sin este respaldo la hoja reventaría al
       leer ph.kcal, y el selector de fecha permite elegir cualquier día. */
    const ph  = Calc.phaseFor(f) ||
                {n:'Fuera de fase', kcal:2548, prot:162, hc:316, grasa:76};
    const t   = MENU_PLAN.tandaInfo(f);
    const tot = {kcal:0,p:0,c:0,g:0,fib:0};

    const franjas = MEAL_ORDER.map(c=>{
      const op  = this.plannedOp(f,c);
      const rec = this.intakeOf(f,c);
      const real= rec ? (MEALS[c].op.find(o=>o.id===rec.opReal) || null) : null;
      const m   = op.libre ? {kcal:0,p:0,c:0,g:0,fib:0} : this.macrosOf(op);
      const eff = rec?.tot || m;                 // lo registrado manda sobre lo planificado
      /* La comida libre sin registrar no suma: no sabemos qué fue.
         Registrada sí suma, porque ya son datos reales. */
      if(!op.libre || rec) ['kcal','p','c','g','fib'].forEach(k=>tot[k] += eff[k]||0);
      return {c, M:MEALS[c], op, m, rec, real, eff};
    });

    /* El hueco se calcula siempre que la franja PLANIFICADA sea libre.
       Si ya está registrada, el hueco pasa a ser informativo y el total
       del día ya incluye lo que se comió de verdad. */
    const libre = franjas.find(x=>x.op.libre);
    const base  = libre && libre.rec
      ? tot.kcal - (libre.eff.kcal||0)
      : tot.kcal;
    const baseP = libre && libre.rec
      ? tot.p - (libre.eff.p||0)
      : tot.p;

    return {
      f, ph, tanda:t, franjas, tot,
      cottage: this.cottageOf(f),
      libreRec: !!(libre && libre.rec),
      hueco:     libre ? Math.round(ph.kcal - base)  : null,
      techo:     libre ? (libre.op.techo || 900)     : null,
      protLibre: libre ? Math.round(ph.prot - baseP) : null
    };
  },

  /* Una hoja de día */
  sheetHtml(dm){
    const {f, ph, tanda, franjas, tot} = dm;
    const dom = D.dow(f)===0;
    const hoy = f===D.today();
    /* Día incompleto: domingo con la comida libre todavía sin registrar.
       Mientras lo esté, comparar el total con el objetivo no significa nada. */
    const parcial = dom && !dm.libreRec;

    const filas = op=>{
      const it = this.opItems(op) || [];
      if(!it.length) return '';
      return `<table>${it.map(([id,gr])=>{
        const fd = this.foods[id];
        const ud = (fd && fd.ud) ? ` <span class="hint" style="display:inline">≈ ${
          (gr/fd.ud).toFixed(1).replace('.0','')} ud</span>` : '';
        return `<tr><td>${fd?fd.n:id}</td><td class="n"><strong>${gr} g</strong>${ud}</td></tr>`;
      }).join('')}</table>`;
    };

    const frHtml = x=>{
      const o = x.op;
      const cambiado = x.rec && x.real && x.rec.opReal!==x.rec.opPlan;
      const mostrado = cambiado ? x.real : o;
      return `<div class="fr">
        <div class="fr-h">
          <div><span class="hora">${x.M.hora}</span>
            <strong style="display:block">${mostrado.n}</strong>
            <span class="hint" style="margin:1px 0 0">${x.M.n}${
              o.min ? ' · '+o.min+' min' : ''}${
              o.leg ? ' · <span class="tag ok">legumbre</span>' : ''}${
              cambiado ? ' · <span class="tag warn">cambiado por ti</span>' :
              x.rec ? ' · <span class="tag ok">cumplida</span>' : ''}</span>
          </div>
          <div class="fr-mac">${o.libre && !x.rec
            ? `<strong>${dm.hueco} kcal</strong><br><span class="hint">de hueco</span>`
            : `<strong>${Math.round(x.eff.kcal)} kcal</strong><br>${x.eff.p.toFixed(0)} P ·
               ${x.eff.c.toFixed(0)} HC · ${x.eff.g.toFixed(0)} G`}</div>
        </div>
        ${filas(mostrado)}
        ${o.nota?`<p class="note">${o.nota}</p>`:''}
        ${o.libre && !x.rec ? `<p class="note">Techo <strong>${dm.techo} kcal</strong> ·
          apunta <strong>~${dm.protLibre} g de proteína</strong> dentro de ella.
          Regístrala con <strong>Registro libre</strong> desde el calendario.</p>`:''}
      </div>`;
    };

    const cel = (lab,v,obj,macro,u)=>{
      const lvl = obj ? this.devLvl(v,obj,macro) : '';
      const pct = obj ? Math.round((v-obj)/obj*100) : null;
      return `<div class="${lvl}"><b>${Math.round(v)}${u||''}</b><span>${lab}</span>
        ${obj?`<span style="text-transform:none;letter-spacing:0">${pct>=0?'+':''}${pct} %</span>`:''}</div>`;
    };

    const cotLvl = dm.cottage > MENU_PLAN.cottageAviso ? 'warn' : '';
    const head = `${D.label(f)}${hoy?' · hoy':''} — ${Math.round(tot.kcal)} kcal · ${tot.p.toFixed(0)} g P`;

    return `<article class="sheet" data-head="${head.replace(/"/g,'&quot;')}">
      <div class="sheet-h">
        <div>
          <h3>${D.labelLong(f)}${hoy?' <span class="tag ok">hoy</span>':''}</h3>
          <p class="hint">${ph.n} · objetivo ${ph.kcal} kcal · ${ph.prot} g proteína</p>
        </div>
        <div style="text-align:right;flex:0 0 auto">
          ${dom ? '<span class="tag warn">comida libre</span>'
                : `<span class="tag">${tanda.n}</span>
                   <p class="hint" style="margin:4px 0 0">se cocina el<br>${tanda.cocinaTxt}</p>`}
        </div>
      </div>
      <div class="sheet-b">
        ${dom ? '' : `<p class="note">Almuerzo y comida son <strong>los mismos los tres días</strong>
          de esta tanda (${tanda.dias.map(d=>D.parse(d).getDate()).join(', ')}).</p>`}
        ${franjas.map(frHtml).join('')}
        <h4 class="sub">Total del día</h4>
        <div class="tot">
          ${cel('kcal', tot.kcal, parcial?null:ph.kcal, 'kcal')}
          ${cel('prot', tot.p,    parcial?null:ph.prot, 'p', ' g')}
          ${cel('hidr', tot.c,    parcial?null:ph.hc,   'kcal', ' g')}
          ${cel('grasa',tot.g,    parcial?null:ph.grasa,'kcal', ' g')}
          ${cel('fibra',tot.fib,  null, null, ' g')}
        </div>
        ${parcial?`<p class="hint">Los totales NO incluyen la comida libre: son las otras
          cuatro franjas. Con la libre en su techo de ${dm.techo} kcal el día cerraría en
          <strong>${Math.round(tot.kcal)+dm.techo} kcal</strong>. Sin comparación con el
          objetivo hasta que la registres.</p>`:''}
        <p class="hint">Cottage del día: <span class="tag ${cotLvl}">${dm.cottage} g</span>
          ${cotLvl?' — por encima del aviso de '+MENU_PLAN.cottageAviso+' g. Es coste, no salud.':''}
          &nbsp;·&nbsp; Fibra incluye la de legumbre y frutos secos, que la tabla del brief no listaba.</p>
      </div>
    </article>`;
  },

  renderMenuDoc(){
    if(!el('mnDoc')) return;
    const {desde, dias} = this.menuRange();

    /* Autocomprobación del plan. Si alguien edita las tablas y rompe una
       regla, sale aquí en lugar de pasar desapercibido durante semanas. */
    const malB = MENU_PLAN.checkBlocks();
    const malC = MENU_PLAN.checkCenas();
    const aviso = (malB.length || malC.length) ? `<div class="card warn-card">
      <h2>El plan incumple sus propias reglas</h2>
      ${malB.length?`<p><strong>${malB.length} bloque(s)</strong> emparejan almuerzo y comida
        con la misma proteína:</p>
        <p class="hint">${malB.map(b=>`bloque ${b.i}: ${b.a} + ${b.c} → ${b.choque.join(', ')}`).join('<br>')}</p>`:''}
      ${malC.length?`<p><strong>${malC.length} fallo(s)</strong> en los patrones de cena:</p>
        <p class="hint">${malC.map(e=>`semana ${e.w+1}: ${e.regla} — ${e.det}`).join('<br>')}</p>`:''}
    </div>` : '';

    const dms = [];
    for(let i=0;i<dias;i++) dms.push(this.dayMenu(D.add(desde,i)));

    /* Resumen del tramo */
    const s = dms.reduce((a,d)=>({
      kcal:a.kcal+d.tot.kcal, p:a.p+d.tot.p, fib:a.fib+d.tot.fib, cot:a.cot+d.cottage
    }), {kcal:0,p:0,fib:0,cot:0});
    const legum = dms.filter(d=>d.franjas.some(x=>x.op.leg)).length;
    const pesc  = dms.filter(d=>d.franjas.some(x=>x.op.pesc)).length;
    /* Merluza en crudo del tramo, para saber cuánto sacar del congelador */
    const merl  = dms.reduce((a,d)=>a + d.franjas.reduce((b,x)=>{
      const it = this.opItems(x.op) || [];
      const m  = it.find(([id])=>id==='merluza');
      return b + (m ? m[1] : 0);
    },0), 0);

    const resumen = `<div class="card2">
      <h4 class="sub">Media de los ${dias} ${dias===1?'día':'días'}<em>${
        D.label(desde)} → ${D.label(D.add(desde,dias-1))}</em></h4>
      <table>
        <tr><td>Calorías</td><td class="n"><strong>${Math.round(s.kcal/dias)} kcal</strong></td></tr>
        <tr><td>Proteína</td><td class="n"><strong>${(s.p/dias).toFixed(1)} g</strong></td></tr>
        <tr><td>Fibra</td><td class="n">${(s.fib/dias).toFixed(1)} g</td></tr>
        <tr><td>Cottage</td><td class="n">${Math.round(s.cot/dias)} g/día</td></tr>
        <tr><td>Días con legumbre</td><td class="n">${legum} de ${dias}</td></tr>
        <tr><td>Cenas de merluza</td><td class="n">${pesc} de ${dias}</td></tr>
        <tr><td><strong>Merluza a descongelar</strong></td>
            <td class="n"><strong>${merl} g</strong> en crudo</td></tr>
      </table>
      <p class="hint">Los domingos no suman la comida libre, así que bajan la media.
        La merluza es congelada: sácala del congelador la mañana del día que toque.</p>
    </div>`;

    el('mnDoc').innerHTML = aviso + resumen + dms.map(d=>this.sheetHtml(d)).join('');

    /* Encabezado fijo: la hoja más alta que esté visible */
    if(this._mnObs) this._mnObs.disconnect();
    const sheets = [...el('mnDoc').querySelectorAll('.sheet')];
    if(sheets.length){
      el('mnHead').innerHTML = `<span>${sheets[0].dataset.head}</span>
        <em>${dias} ${dias===1?'día':'días'}</em>`;
      this._mnObs = new IntersectionObserver(entries=>{
        const vis = sheets.filter(sh=>{
          const r = sh.getBoundingClientRect();
          return r.bottom > 170 && r.top < window.innerHeight;
        })[0];
        if(vis) el('mnHead').innerHTML = `<span>${vis.dataset.head}</span>
          <em>${dias} ${dias===1?'día':'días'}</em>`;
      }, {threshold:[0,.05,.5,1]});
      sheets.forEach(sh=>this._mnObs.observe(sh));
    }

    el('mnShare').onclick = ()=>this.shareMenu(dms);
  },

  /* Exportación en texto plano, para el móvil o para pegarlo donde sea */
  async shareMenu(dms){
    const txt = dms.map(d=>{
      const cab = `${D.labelLong(d.f).toUpperCase()}  ·  ${d.tanda.n}`;
      const fr = d.franjas.map(x=>{
        const it = (this.opItems(x.op)||[])
          .map(([id,gr])=>`     - ${this.foods[id]?.n||id}: ${gr} g`).join('\n');
        const mac = (x.op.libre && !x.rec)
          ? `hueco ${d.hueco} kcal (techo ${d.techo})`
          : `${Math.round(x.eff.kcal)} kcal · ${x.eff.p.toFixed(0)} P · ` +
            `${x.eff.c.toFixed(0)} HC · ${x.eff.g.toFixed(0)} G`;
        return `  ${x.M.hora} ${x.op.n}\n     [${mac}]${it?'\n'+it:''}`;
      }).join('\n');
      return `${cab}\n${'─'.repeat(cab.length)}\n${fr}\n\n  TOTAL: ${
        Math.round(d.tot.kcal)} kcal · ${d.tot.p.toFixed(0)} g P · ${
        d.tot.c.toFixed(0)} g HC · ${d.tot.g.toFixed(0)} g G · ${
        d.tot.fib.toFixed(0)} g fibra · cottage ${d.cottage} g`;
    }).join('\n\n\n');

    const full = `MENÚ · ${D.label(dms[0].f)} → ${D.label(dms[dms.length-1].f)}\n` +
      `Gramajes EN CRUDO para carnes, pescados, arroz y pasta.\n\n\n${txt}\n`;

    if(navigator.share){
      try{ await navigator.share({text:full, title:'Menú'}); return; }catch(e){}
    }
    await shareFiles([{name:'menu.txt', text:full, mime:'text/plain'}]);
  },

    /* ═══════════════════ SALSAS ═══════════════════ */

  saucesFor(opId){
    return Object.entries(SAUCES).filter(([,s])=>(s.para||[]).includes(opId));
  },

  /* Ingredientes de la salsa escalados a las raciones que se sirven */
  sauceItems(sid, rac){
    const s = SAUCES[sid]; if(!s) return [];
    const k = (rac||1)/s.raciones;
    return s.it.map(([id,gr])=>[id, Math.round(gr*k*10)/10]);
  },

  sauceMacros(sid, rac){
    return Calc.macros(this.sauceItems(sid, rac), this.foods);
  },

  /* Bloque de selección de salsa dentro del detalle de la comida */
  sauceBlock(op){
    const ss = this.saucesFor(op.id);
    if(!ss.length) return '';
    const base = this.macrosOf(op);

    return `<h4 class="sub">Salsa · opcional</h4>
      <p class="hint">Se suma al plato, no lo modifica. Pulsa para poner o quitar.
        El porcentaje es lo que añade sobre las calorías del plato.</p>
      ${ss.map(([sid,s])=>{
        const m = this.sauceMacros(sid,1);
        const sel = this.selSauce===sid;
        const pct = m.kcal/base.kcal*100;
        const lvl = pct<=10 ? 'ok' : pct<=20 ? 'warn' : 'bad';
        return `<button class="opt ${sel?'sel':''}" data-sauce="${sid}">
          <strong>${sel?'✓ ':''}${s.n}</strong>
          <span class="tag">${s.cocina}</span>
          <span class="tag ${lvl}">+${pct.toFixed(0)} %</span>
          <br><span class="hint">+${Math.round(m.kcal)} kcal · +${m.p.toFixed(1)} g P ·
            +${m.c.toFixed(1)} g HC · +${m.g.toFixed(1)} g G · rinde ${s.raciones} usos</span></button>
        <button class="mini b-info" data-sprep="${sid}" style="margin:-4px 0 12px">Ver receta</button>`;
      }).join('')}
      ${this.selSauce ? `<div class="verdict ok">Plato con salsa: <strong>${(()=>{
        const t = Calc.macros(
          this.opItems(op).concat(this.sauceItems(this.selSauce,1)), this.foods);
        return `${Math.round(t.kcal)} kcal · ${t.p.toFixed(0)} g P · ` +
               `${t.c.toFixed(0)} g HC · ${t.g.toFixed(0)} g G`;
      })()}</strong></div>` : ''}`;
  },

  /* Ficha de preparación de una salsa */
  showSaucePrep(sid){
    const s = SAUCES[sid]; if(!s || !s.prep) return;
    const p = s.prep;
    const tanda = Calc.macros(s.it, this.foods);
    const rac = this.sauceMacros(sid,1);

    el('prepModalBody').innerHTML = `
      <h3>${s.n}</h3>
      <p class="hint">${s.cocina} · <strong>${p.t}</strong> · ${p.dif} ·
        rinde <strong>${s.raciones} raciones</strong></p>
      <div class="verdict">Por ración: <strong>${Math.round(rac.kcal)} kcal ·
        ${rac.p.toFixed(1)} g P · ${rac.c.toFixed(1)} g HC · ${rac.g.toFixed(1)} g G</strong></div>

      <h4 class="sub">Ingredientes<em>tanda de ${s.raciones}</em></h4>
      <table>${s.it.map(([id,gr])=>{
        const f = this.foods[id];
        return `<tr><td>${f?f.n:id}</td><td class="n"><strong>${gr} g</strong></td></tr>`;
      }).join('')}</table>
      <p class="hint">Tanda completa: ${Math.round(tanda.kcal)} kcal ·
        ${tanda.p.toFixed(1)} g P · ${tanda.c.toFixed(1)} g HC · ${tanda.g.toFixed(1)} g G</p>

      <h4 class="sub">Utensilios</h4>
      <p class="hint">${p.ut.join(' · ')}</p>

      <h4 class="sub">Preparación</h4>
      <ol class="pasos">${p.pasos.map(x=>`<li>${x}</li>`).join('')}</ol>
      ${p.tip?`<p class="note"><strong>Clave:</strong> ${p.tip}</p>`:''}
      <p class="note"><strong>Conservación:</strong> ${s.conserva}</p>
      <h4 class="sub">Pega con</h4>
      <p class="hint">${(s.para||[]).map(id=>{
        for(const c of MEAL_ORDER){
          const o = MEALS[c].op.find(x=>x.id===id);
          if(o) return o.n;
        }
        return id;
      }).join(' · ')}</p>`;

    el('prepModal').classList.add('on');
  },

  /* Catálogo de salsas para la pestaña Recetas */
  renderSauces(){
    const box = el('sauceList');
    if(!box) return;
    box.innerHTML = Object.entries(SAUCES).map(([sid,s])=>{
      const m = this.sauceMacros(sid,1);
      return `<button class="opt" data-sprep="${sid}">
        <strong>${s.n}</strong> <span class="tag">${s.cocina}</span>
        <span class="tag">${s.prep.t}</span>
        <br><span class="hint">+${Math.round(m.kcal)} kcal · +${m.p.toFixed(1)} g P ·
          +${m.c.toFixed(1)} g HC · +${m.g.toFixed(1)} g G por ración ·
          rinde ${s.raciones} · pega con ${(s.para||[]).length} platos</span></button>`;
    }).join('');
    box.querySelectorAll('[data-sprep]').forEach(b=>b.onclick = ()=>
      this.showSaucePrep(b.dataset.sprep));
  },

  /* ═══ CALENDARIO ═══ */
  renderCalendar(){
    const {y,m} = this.cal;
    el('dietCalTitle').textContent = D.monthName(y,m);
    const first = new Date(y,m,1);
    const offset = (first.getDay()+6)%7;
    const days = new Date(y,m+1,0).getDate();
    const t = D.today();

    let html = '<div class="cal-grid">' +
      ['L','M','X','J','V','S','D'].map(d=>`<div class="cal-h">${d}</div>`).join('') +
      '<div style="grid-column:span '+offset+'"></div>';

    for(let d=1; d<=days; d++){
      const f = D.iso(new Date(y,m,d));
      const hechas = MEAL_ORDER.filter(c=>this.intakeOf(f,c)).length;
      const cena = this.plannedOp(f,'cena');
      const cls = ['cal-d'];
      if(f===t) cls.push('is-today');
      if(f>t)   cls.push('is-future');
      const full = hechas===5;
      html += `<button class="${cls.join(' ')}" data-f="${f}">
        <span>${d}</span>
        <div class="dots">${hechas?`<i class="dot ${full?'ok':'draft'}"></i>`:''}</div>
        <em>${cena.id||''}</em></button>`;
    }
    html += '</div>';
    el('dietCal').innerHTML = html;
    el('dietCal').querySelectorAll('.cal-d').forEach(b=>
      b.onclick = ()=>this.openDay(b.dataset.f));

    // Panel de hoy
    const tot = this.dayTotals(t), ph = Calc.phaseFor(t);
    const bar = (lab,v,obj,u)=>{
      const pct = Math.min(100, obj? v/obj*100 : 0);
      const cls = obj && v>=obj*0.9 ? 'ok' : v>=obj*0.6 ? 'warn' : 'bad';
      return `<div class="bar"><span>${lab}</span>
        <div class="track"><i class="${cls}" style="width:${pct}%"></i></div>
        <em>${Math.round(v)}/${obj}${u}</em></div>`;
    };
    const leg = this.legumeCount(t);
    el('dietToday').innerHTML = `
      <h2>Hoy · ${ph.n}</h2>
      ${bar('kcal',tot.kcal,ph.kcal,'')}
      ${bar('Proteína',tot.p,ph.prot,' g')}
      ${bar('Hidratos',tot.c,ph.hc,' g')}
      ${bar('Grasa',tot.g,ph.grasa,' g')}
      ${bar('Fibra',tot.fib,DAILY_EXTRAS.fibra.min,' g')}
      ${leg<2 ? `<p class="note">Legumbre esta semana: <strong>${leg}/2</strong>.
        ${DAILY_EXTRAS.legumbre.nota}</p>` : ''}`;
  },

  /* ═══ POPUP DEL DÍA ═══ */
  openDay(f){
    const ph = Calc.phaseFor(f), tot = this.dayTotals(f);
    let h = `<h3>${D.labelLong(f)}</h3>
      <p class="hint">${ph.n} · objetivo ${ph.kcal} kcal · ${ph.prot} g proteína<br>
        Registrado: <strong>${Math.round(tot.kcal)} kcal · ${tot.p.toFixed(0)} g P ·
        ${tot.c.toFixed(0)} g HC · ${tot.g.toFixed(0)} g G · ${tot.fib.toFixed(0)} g fibra</strong></p>`;

    MEAL_ORDER.forEach(c=>{
      const M = MEALS[c];
      const plan = this.plannedOp(f,c);
      const rec = this.intakeOf(f,c);
      const op = rec ? (MEALS[c].op.find(o=>o.id===rec.opReal) || null) : plan;
      const mac = rec?.tot || this.macrosOf(plan);
      const est = !rec ? 'pendiente' : rec.estado;
      h += `<button class="mealrow ${est}" data-c="${c}" data-f="${f}">
        <div><strong>${M.hora} · ${M.n}</strong><br>
          <span class="hint">${op ? op.n : (rec?.libre || 'Registro libre')}</span>
          ${rec && rec.opReal!==rec.opPlan ? '<br><span class="tag warn">plato cambiado</span>':''}
          ${rec && rec.salsa ? `<br><span class="tag ok">+ ${SAUCES[rec.salsa]?.n || rec.salsa}</span>`:''}
        </div>
        <div class="mealmac">${Math.round(mac.kcal)} kcal<br>
          <span class="hint">${mac.p.toFixed(0)} P</span></div>
        <div class="state">${est==='pendiente'?'○':est==='plan'?'✓':'≈'}</div>
      </button>`;
    });

    el('mealModalBody').innerHTML = h;
    el('mealModalBody').querySelectorAll('.mealrow').forEach(b=>
      b.onclick = ()=>this.openMeal(b.dataset.f, b.dataset.c));
    el('mealModal').classList.add('on');
  },

  /* ═══ DETALLE DE COMIDA · CONFIRMAR O CAMBIAR PLATO ═══ */
  openMeal(f, c, keepSauce){
    const M = MEALS[c];
    const plan = this.plannedOp(f,c);
    const rec = this.intakeOf(f,c);
    const actual = rec ? (M.op.find(o=>o.id===rec.opReal) || plan) : plan;
    const baseMac = this.macrosOf(plan);
    if(!keepSauce) this.selSauce = rec ? (rec.salsa || null) : null;

    const lista = op=>this.opItems(op).map(([id,gr])=>{      
        const fd = this.foods[id];
      return `<tr><td>${fd?fd.n:id}</td><td class="n">${gr} g</td></tr>`;
    }).join('');

    const alts = M.op.filter(o=>o.id!==actual.id);

    el('mealModalBody').innerHTML = `
      <button class="link" id="mBack">← ${D.label(f)}</button>
      <h3>${M.hora} · ${M.n}</h3>
      ${M.nota?`<p class="note">${M.nota}</p>`:''}

      <div class="card2">
        <h4>${actual.n} ${actual.id===plan.id?'<span class="tag">planificado</span>':'<span class="tag warn">cambiado</span>'}</h4>
        ${actual.nota?`<p class="note">${actual.nota}</p>`:''}
        <table>${lista(actual)}</table>
        <p class="hint">${(()=>{const m=this.macrosOf(actual);
          return `${Math.round(m.kcal)} kcal · ${m.p.toFixed(1)} g P · ${m.c.toFixed(1)} g HC · ${m.g.toFixed(1)} g G · ${m.fib.toFixed(1)} g fibra`;})()}</p>
        <button class="primary" id="mConfirm">
          ${rec?'Actualizar registro':'Cumplida'}
        </button>
        ${actual.prep?`<button class="b-info" id="mPrep" style="margin-top:8px">Ver preparación paso a paso</button>`:''}
      </div>

      ${this.sauceBlock(actual)}

      <h4 class="sub">Cambiar de plato</h4>
      <p class="hint">Cada alternativa muestra su desviación frente al plato planificado.
        La proteína lleva la tolerancia más estricta porque es el macro que decide
        cuánto músculo conservas.</p>
      ${alts.map(o=>{
        const m = this.macrosOf(o), ck = Calc.swapCheck(baseMac, m);
        return `<button class="opt swap ${ck.lvl}" data-op="${o.id}">
          <strong>${o.n}</strong>
          <span class="tag ${ck.lvl}">${ck.lvl==='ok'?'equivalente':ck.lvl==='warn'?'desvía':'no recomendado'}</span>
          <br><span class="hint">${Math.round(m.kcal)} kcal · ${m.p.toFixed(0)} g P
            &nbsp;|&nbsp; Δ ${ck.dkcal>=0?'+':''}${ck.dkcal} kcal ·
            ${ck.dp>=0?'+':''}${ck.dp} g P · ${ck.dc>=0?'+':''}${ck.dc} g HC ·
            ${ck.dg>=0?'+':''}${ck.dg} g G</span>
          <br><span class="hint">${ck.msg}</span>
          ${o.nota?`<br><span class="hint">${o.nota}</span>`:''}</button>
        ${o.prep?`<button class="mini b-info" data-prep="${o.id}"
          style="margin:-4px 0 12px">Ver receta paso a paso</button>`:''}`;
      }).join('')}

      <h4 class="sub">Registro libre</h4>
      <p class="hint">Para cuando comes fuera o algo que no está en el plan.
        Puedes escanear el código de barras desde la pestaña Alimentos.</p>
      <div id="freeBox"></div>
      <button id="mFree">Registrar comida libre</button>
      <p class="ok-msg" id="mMealMsg"></p>`;

    el('mBack').onclick = ()=>this.openDay(f);
    el('mConfirm').onclick = ()=>this.confirmMeal(f, c, actual.id, plan.id, actual.id===plan.id ? 'plan' : 'modificado');
    el('mealModalBody').querySelectorAll('.swap').forEach(b=>b.onclick = ()=>{
      const op = M.op.find(o=>o.id===b.dataset.op);
      if(this.selSauce && !this.saucesFor(op.id).some(([sid])=>sid===this.selSauce))
        this.selSauce = null;
      this.confirmMeal(f, c, op.id, plan.id, op.id===plan.id?'plan':'modificado');
    });
    el('mFree').onclick = ()=>this.freeMeal(f, c, plan.id);
    if(actual.prep) el('mPrep').onclick = ()=>this.showPrep(c, actual.id);
    el('mealModalBody').querySelectorAll('[data-prep]').forEach(b=>b.onclick = ()=>
      this.showPrep(c, b.dataset.prep));
    el('mealModalBody').querySelectorAll('[data-sauce]').forEach(b=>b.onclick = ()=>{
      this.selSauce = (this.selSauce===b.dataset.sauce) ? null : b.dataset.sauce;
      this.openMeal(f, c, true);
    });
    el('mealModalBody').querySelectorAll('[data-sprep]').forEach(b=>b.onclick = ()=>
      this.showSaucePrep(b.dataset.sprep));
  },

  async confirmMeal(f, c, opReal, opPlan, estado){
    const op = MEALS[c].op.find(o=>o.id===opReal);
    const sid = this.selSauce;
    const items = this.opItems(op).concat(sid ? this.sauceItems(sid,1) : []);
    await DB.put('intake',{id:f+'|'+c, fecha:f, comida:c, opPlan, opReal, estado,
      salsa:sid||null, items, tot:Calc.macros(items,this.foods), notas:null});
    this.selSauce = null;
    await this.reload();
    this.openDay(f);
  },

  /* Registro libre: alimentos de la base con gramaje */
  freeMeal(f, c, opPlan){
    const items = [];
    const box = el('freeBox');
    const render = ()=>{
      const tot = Calc.macros(items.map(i=>[i.id,i.g]), this.foods);
      box.innerHTML = `
        ${items.map((i,ix)=>`<div class="set">
          <i>${ix+1}</i>
          <span style="grid-column:span 2">${this.foods[i.id]?.n||i.id}</span>
          <input type="number" value="${i.g}" data-ix="${ix}">
          <button class="mini" data-del="${ix}">✕</button></div>`).join('')}
        <p class="hint">${Math.round(tot.kcal)} kcal · ${tot.p.toFixed(1)} g P ·
          ${tot.c.toFixed(1)} g HC · ${tot.g.toFixed(1)} g G</p>
        <div class="row c2">
          <select id="freePick">${Object.values(this.foods)
            .sort((a,b)=>a.n.localeCompare(b.n))
            .map(fd=>`<option value="${fd.id}">${fd.n}</option>`).join('')}</select>
          <button id="freeAdd">+ añadir</button>
        </div>
        <button class="primary" id="freeSave" ${items.length?'':'disabled'}>Guardar comida libre</button>`;

      box.querySelectorAll('[data-ix]').forEach(inp=>inp.oninput = ()=>{
        const v = parseFloat(inp.value); items[+inp.dataset.ix].g = isFinite(v)?v:0;
      });
      box.querySelectorAll('[data-del]').forEach(b=>b.onclick = ()=>{
        items.splice(+b.dataset.del,1); render();
      });
      el('freeAdd').onclick = ()=>{ items.push({id:el('freePick').value, g:100}); render(); };
      el('freeSave').onclick = async()=>{
        const it = items.filter(i=>i.g>0).map(i=>[i.id,i.g]);
        await DB.put('intake',{id:f+'|'+c, fecha:f, comida:c, opPlan, opReal:'LIBRE',
          estado:'modificado', libre:'Comida libre', items:it,
          tot:Calc.macros(it,this.foods), notas:null});
        await this.reload();
        this.openDay(f);
      };
    };
    render();
  },

  /* ═══ ALIMENTOS ═══ */
  renderFoods(){
    const q = (el('foodSearch').value||'').toLowerCase().trim();
    const falta = this.missingFoods();
    const fs = Object.values(this.foods)
      .filter(f=>!q || f.n.toLowerCase().includes(q) || (f.marca||'').toLowerCase().includes(q))
      .sort((a,b)=>(b.favorito?1:0)-(a.favorito?1:0) || a.n.localeCompare(b.n));

    el('foodList').innerHTML = `${falta.length?`<div class="card warn-card">
        <h2>Ingredientes sin datos</h2>
        <p>Hay ${falta.length} ingredientes usados en las recetas que no están en la base
          de datos, así que esos platos calculan menos calorías de las reales:</p>
        <p class="hint">${falta.join(', ')}</p>
        <p class="hint">Si ves esto, avísame: falta una entrada en la tabla de alimentos.</p>
      </div>`:''}
      
     <p class="hint">${fs.length} alimentos
      ${q?'que coinciden':'en la base'}</p>
      <table><tr><th>Alimento</th><th class="n">kcal</th><th class="n">P</th>
        <th class="n">HC</th><th class="n">G</th></tr>
      ${fs.slice(0,80).map(f=>`<tr><td>${f.n}
        ${f.marca?`<br><span class="hint">${f.marca}${f.barcode?' · '+f.barcode:''}</span>`:''}
        ${f.nota?`<br><span class="hint">${f.nota}</span>`:''}</td>
        <td class="n">${f.por100.kcal}</td><td class="n">${f.por100.p}</td>
        <td class="n">${f.por100.c}</td><td class="n">${f.por100.g}</td></tr>`).join('')}
      </table>
      <p class="hint">Valores por 100 g. Carnes, pescados, arroz y pasta: en crudo.</p>`;
  },

  /* ═══ ESCÁNER ═══ */
  async scanStart(){
    el('scanPanel').classList.remove('hide');
    el('scanMsg').textContent = 'Iniciando cámara…';
    try{
      this.scan.stream = await navigator.mediaDevices.getUserMedia({
        video:{facingMode:{ideal:'environment'}, width:{ideal:1280}}});
      const v = el('scanVideo');
      v.srcObject = this.scan.stream;
      await v.play();
    }catch(e){
      el('scanMsg').innerHTML = 'No se pudo abrir la cámara. Recuerda que la cámara ' +
        'solo funciona sobre HTTPS.<br>Usa el código a mano.';
      return;
    }

    if(!('BarcodeDetector' in window)){
      el('scanMsg').innerHTML = 'Este navegador no tiene detector de códigos nativo. ' +
        '<strong>Abre la app en Chrome</strong>, o teclea el código a mano abajo.';
      return;
    }

    this.scan.det = new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e']});
    el('scanMsg').textContent = 'Apunta al código de barras…';
    const loop = async()=>{
      if(!this.scan.stream)return;
      try{
        const codes = await this.scan.det.detect(el('scanVideo'));
        if(codes.length){
          const code = codes[0].rawValue;
          if(navigator.vibrate) navigator.vibrate(120);
          this.scanStop();
          this.lookup(code);
          return;
        }
      }catch(e){/* fotograma no válido, seguir */}
      this.scan.raf = requestAnimationFrame(loop);
    };
    loop();
  },

  scanStop(){
    if(this.scan.raf) cancelAnimationFrame(this.scan.raf);
    if(this.scan.stream) this.scan.stream.getTracks().forEach(t=>t.stop());
    this.scan = {stream:null, det:null, raf:null};
    el('scanPanel').classList.add('hide');
  },

  /* Consulta a Open Food Facts y precarga el formulario */
  async lookup(code){
    if(!/^\d{8,14}$/.test(code)){ flash(el('mFood'),'Código no válido.',true); return; }

    const known = Object.values(this.foods).find(f=>f.barcode===code);
    if(known){
      flash(el('mFood'),`Ya lo tienes guardado: ${known.n}`);
      el('foodSearch').value = known.n; this.renderFoods();
      return;
    }

    flash(el('mFood'),'Consultando…');
    try{
      const r = await fetch(OFF_API + code +
        '.json?fields=product_name,product_name_es,brands,nutriments,quantity');
      const j = await r.json();
      if(j.offline){ flash(el('mFood'),'Sin conexión. Rellena los datos a mano.',true); return; }
      if(j.status!==1){ flash(el('mFood'),'Producto no encontrado. Rellénalo a mano y quedará guardado.',true);
        el('fdNombre').value=''; el('fdBarcode').value=code; return; }

      const p = j.product, n = p.nutriments||{};
      el('fdBarcode').value = code;
      el('fdNombre').value  = p.product_name_es || p.product_name || '';
      el('fdMarca').value   = p.brands || '';
      el('fdKcal').value = Math.round(n['energy-kcal_100g'] ?? (n.energy_100g? n.energy_100g/4.184 : '')) || '';
      el('fdP').value    = n.proteins_100g ?? '';
      el('fdC').value    = n.carbohydrates_100g ?? '';
      el('fdG').value    = n.fat_100g ?? '';
      el('fdFib').value  = n.fiber_100g ?? '';

      const faltan = ['fdKcal','fdP','fdC','fdG'].filter(i=>!el(i).value);
      flash(el('mFood'), faltan.length
        ? 'Encontrado, pero Open Food Facts no tiene todos los macros. Complétalos antes de guardar.'
        : 'Encontrado. Revisa los valores y guarda.', faltan.length>0);
    }catch(e){
      flash(el('mFood'),'Error de consulta. Rellena los datos a mano.',true);
    }
  },

  async saveFood(){
    const gv = id=>{const n=parseFloat(String(el(id).value).replace(',','.'));return isFinite(n)?n:null;};
    const n = el('fdNombre').value.trim();
    if(!n){ flash(el('mFood'),'Falta el nombre.',true); return; }

    const veto = FOOD_VETO.find(v=>n.toLowerCase().includes(v));
    if(veto){ flash(el('mFood'),`"${veto}" está en tu lista de alimentos excluidos. No se guarda.`,true); return; }

    if(gv('fdKcal')==null || gv('fdP')==null || gv('fdC')==null || gv('fdG')==null){
      flash(el('mFood'),'Faltan macros: kcal, proteína, hidratos y grasa son obligatorios.',true); return;
    }

    const id = 'u_' + n.toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,40);
    await DB.put('foods',{id, n, marca:el('fdMarca').value.trim()||null,
      barcode:el('fdBarcode').value.trim()||null, ud:null,
      por100:{kcal:gv('fdKcal'), p:gv('fdP'), c:gv('fdC'), g:gv('fdG'), fib:gv('fdFib')||0},
      nota:null, origen:'escaneado', favorito:false});
    ['fdNombre','fdMarca','fdBarcode','fdKcal','fdP','fdC','fdG','fdFib'].forEach(i=>el(i).value='');
    await this.reload();
    flash(el('mFood'),`Guardado: ${n} ✓`);
  },

  /* ═══ RECETAS ═══ */
  renderRecipes(){
    el('recList').innerHTML = this.recipes.length
      ? this.recipes.sort((a,b)=>a.n.localeCompare(b.n)).map(r=>{
          const m = Calc.macros(r.it, this.foods);
          const por = k=>(m[k]/(r.raciones||1));
          return `<div class="card2">
            <h4>${r.n}</h4>
            <p class="hint">${r.raciones} ${r.raciones===1?'ración':'raciones'} ·
              por ración: <strong>${Math.round(por('kcal'))} kcal · ${por('p').toFixed(1)} g P ·
              ${por('c').toFixed(1)} g HC · ${por('g').toFixed(1)} g G</strong></p>
            <table>${r.it.map(([id,gr])=>`<tr><td>${this.foods[id]?.n||id}</td>
              <td class="n">${gr} g</td></tr>`).join('')}</table>
            ${(r.pasos||[]).length?`<ol class="pasos">${r.pasos.map(p=>`<li>${p}</li>`).join('')}</ol>`:''}
            ${r.origen==='propia'?`<button class="mini" data-delrec="${r.id}">Borrar</button>`:''}
          </div>`;
        }).join('')
      : '<p class="hint">Sin recetas.</p>';

    el('recList').querySelectorAll('[data-delrec]').forEach(b=>b.onclick = async()=>{
      await DB.del('recipes', +b.dataset.delrec);
      await this.reload();
    });
    this.renderRecDraft();
  },

  renderRecDraft(){
    const tot = Calc.macros(this.recDraft.map(i=>[i.id,i.g]), this.foods);
    const rac = parseFloat(el('recRaciones').value) || 1;
    el('recItems').innerHTML = `
      ${this.recDraft.map((i,ix)=>`<div class="set">
        <i>${ix+1}</i>
        <span style="grid-column:span 2">${this.foods[i.id]?.n||i.id}</span>
        <input type="number" value="${i.g}" data-rix="${ix}">
        <button class="mini" data-rdel="${ix}">✕</button></div>`).join('')}
      ${this.recDraft.length?`<p class="hint">Total: ${Math.round(tot.kcal)} kcal ·
        ${tot.p.toFixed(1)} g P · ${tot.c.toFixed(1)} g HC · ${tot.g.toFixed(1)} g G<br>
        Por ración (${rac}): <strong>${Math.round(tot.kcal/rac)} kcal ·
        ${(tot.p/rac).toFixed(1)} g P</strong></p>`:''}
      <div class="row c2">
        <select id="recPick">${Object.values(this.foods)
          .sort((a,b)=>a.n.localeCompare(b.n))
          .map(f=>`<option value="${f.id}">${f.n}</option>`).join('')}</select>
        <input id="recGr" type="number" placeholder="gramos" value="100">
      </div>`;

    el('recItems').querySelectorAll('[data-rix]').forEach(inp=>inp.oninput = ()=>{
      const v = parseFloat(inp.value);
      this.recDraft[+inp.dataset.rix].g = isFinite(v)?v:0;
      this.renderRecDraft();
    });
    el('recItems').querySelectorAll('[data-rdel]').forEach(b=>b.onclick = ()=>{
      this.recDraft.splice(+b.dataset.rdel,1); this.renderRecDraft();
    });
  },

  addRecItem(){
    const id = el('recPick')?.value;
    const g = parseFloat(el('recGr')?.value) || 100;
    if(!id)return;
    this.recDraft.push({id, g});
    this.renderRecDraft();
  },

  async saveRecipe(){
    const n = el('recNombre').value.trim();
    if(!n || !this.recDraft.length){
      flash(el('mRec'),'Falta el nombre o los ingredientes.',true); return;
    }
    await DB.put('recipes',{n, raciones:parseFloat(el('recRaciones').value)||1,
      it:this.recDraft.filter(i=>i.g>0).map(i=>[i.id,i.g]),
      pasos:el('recPasos').value.split('\n').map(s=>s.trim()).filter(Boolean),
      origen:'propia'});
    el('recNombre').value=''; el('recPasos').value=''; el('recRaciones').value='1';
    this.recDraft = [];
    await this.reload();
    flash(el('mRec'),`Receta guardada: ${n} ✓`);
  },

    /* ═══════════════════ LISTA DE LA COMPRA ═══════════════════ */

  /* Lunes de la próxima semana, que es cuando empieza cualquier compra útil */
  nextMonday(){
    const t = D.today();
    const ws = D.weekStart(t);
    return D.dow(t)===0 ? D.add(ws,7) : D.add(ws,7);
  },

  shopRange(){
    const desde = el('shDesde').value || this.nextMonday();
    const dias  = +el('shDias').value || 7;
    return {desde, hasta:D.add(desde, dias-1), dias};
  },

  /* Agrega todos los ingredientes del rango.
     Usa el plato REGISTRADO si el día ya está confirmado, y el
     PLANIFICADO si aún no lo está. */
  buildShop(desde, hasta){
    const g = {};
    for(let f=desde; f<=hasta; f=D.add(f,1)){
      MEAL_ORDER.forEach(c=>{
        const rec = this.intakeOf(f,c);
        const items = rec ? rec.items : this.opItems(this.plannedOp(f,c));
        (items||[]).forEach(([id,gr])=>{ g[id] = (g[id]||0) + gr; });
      });
    }
    return g;
  },

  /* Convierte gramos del plan en unidades de compra.
     Con rangos de 3 días o menos devuelve gramos exactos, porque
     redondear a envases enteros en una compra de un día no sirve. */
  toPurchase(id, gr, dias){
    const s = SHOP[id] || {sec:5, un:'g', granel:true};
    const bruto = gr * (s.factor || 1);
    const corto = (dias || 7) <= 3;

    if(s.ud){
      const n = Math.ceil(bruto / s.ud);
      const extra = s.pack_ud
        ? ` (${Math.ceil(n/s.pack_ud)} ${s.pack_ud===12?'docena(s)':'pack(s)'})` : '';
      return {sec:s.sec, txt:`${n} ${s.un}${extra}`, nota:s.nota, raw:bruto};
    }

    if(s.pack){
      if(corto){
        const r = Math.ceil(bruto/10)*10;
        return {sec:s.sec,
          txt:`${r>=1000 ? (r/1000).toFixed(2)+' kg' : r+' g'} · ${s.un}`,
          nota:s.nota, raw:bruto};
      }
      const n = Math.ceil(bruto / s.pack);
      const kg = s.pack >= 1000;
      return {sec:s.sec,
        txt:`${n} ${s.un}` + (n>1 ? ` · ${kg?(n*s.pack/1000).toFixed(1)+' kg':(n*s.pack)+' g'}` : ''),
        nota:s.nota, raw:bruto};
    }

    // A granel: 10 g de precisión en rangos cortos, 50 g en semanales
    const paso = corto ? 10 : 50;
    const r = Math.ceil(bruto/paso)*paso;
    return {sec:s.sec, txt: r>=1000 ? (r/1000).toFixed(2)+' kg' : r+' g',
      nota:s.nota, raw:bruto};
  },

  async genShop(){
    const {desde, hasta, dias} = this.shopRange();
    const g = this.buildShop(desde, hasta);
    const items = Object.entries(g)
      .filter(([,gr])=>gr>0)
      .map(([id,gr])=>{
        const p = this.toPurchase(id, gr, dias);
        return {id, n:this.foods[id]?.n || id, gr:Math.round(gr),
          sec:p.sec, txt:p.txt, nota:p.nota, ok:false};
      });
    await DB.put('shopping',{id:desde+'|'+hasta, desde, hasta, dias, items,
      creado:new Date().toISOString()});
    await this.renderShop();
  },

  async renderShop(){
    const {desde, hasta} = this.shopRange();
    el('shTitle').textContent = `${D.label(desde)} → ${D.label(hasta)}`;
    const L = await DB.get('shopping', desde+'|'+hasta);

    if(!L){
      const d = this.shopRange().dias;
      el('shList').innerHTML = `<p class="hint">Sin lista generada para este rango.
        Pulsa <strong>Generar lista</strong> y la app sumará todos los ingredientes
        ${d===1 ? 'del día' : `de los ${d} días`}.</p>`;
      return;
    }

    const porSec = {};
    L.items.forEach(it=>{ (porSec[it.sec] = porSec[it.sec] || []).push(it); });
    // Los fijos solo en compras de 4 días o más: en una de un día son ruido
    if((L.dias||7) >= 4) SHOP_FIJOS.forEach(f=>{
      (porSec[f.sec] = porSec[f.sec] || []).push({fijo:true, n:f.n, txt:f.cant, ok:false});
    });

    const total = L.items.length, hechos = L.items.filter(i=>i.ok).length;

    el('shList').innerHTML = `
      <p class="hint">Generada el ${D.label(L.creado.slice(0,10))} ·
        ${L.dias===1 ? '1 día' : L.dias+' días'} ·
        <strong>${hechos}/${total}</strong> productos marcados</p>
      ${SEC.map((sn,si)=>{
        const its = porSec[si]; if(!its || !its.length) return '';
        return `<h4 class="sub">${sn}</h4>
          ${its.map(it=>`<label class="chk shitem ${it.ok?'done':''}">
            <input type="checkbox" ${it.ok?'checked':''}
              ${it.fijo?'disabled':`data-sh="${it.id}"`}>
            <span><strong>${it.n}</strong> — ${it.txt}
            ${it.gr?`<br><span class="hint">${it.gr} g en el plan</span>`:''}
            ${it.nota?`<br><span class="hint">${it.nota}</span>`:''}</span>
          </label>`).join('')}`;
      }).join('')}
      <div class="row c2" style="margin-top:14px">
        <button class="b-info" id="shShare">Compartir lista</button>
        <button class="b-bad" id="shReset">Desmarcar todo</button>
      </div>`;

    el('shList').querySelectorAll('[data-sh]').forEach(cb=>cb.onchange = async()=>{
      const L2 = await DB.get('shopping', desde+'|'+hasta);
      const it = L2.items.find(x=>x.id===cb.dataset.sh);
      if(it) it.ok = cb.checked;
      await DB.put('shopping', L2);
      await this.renderShop();
    });

    el('shShare').onclick = async()=>{
      const txt = `LISTA DE LA COMPRA · ${D.label(desde)} → ${D.label(hasta)}\n\n` +
        SEC.map((sn,si)=>{
          const its = porSec[si]; if(!its || !its.length) return '';
          return sn.toUpperCase()+'\n' + its.map(i=>`  [ ] ${i.n} — ${i.txt}`).join('\n');
        }).filter(Boolean).join('\n\n');
      if(navigator.share){ try{ await navigator.share({text:txt, title:'Lista de la compra'}); return; }catch(e){} }
      await shareFiles([{name:'compra.txt', text:txt, mime:'text/plain'}]);
    };

    el('shReset').onclick = async()=>{
      const L2 = await DB.get('shopping', desde+'|'+hasta);
      L2.items.forEach(i=>i.ok = false);
      await DB.put('shopping', L2);
      await this.renderShop();
    };
  },

    /* Ingredientes que las recetas usan y no existen en la base de datos.
     Si esta lista no está vacía, hay platos calculando macros a la baja. */
  missingFoods(){
    const falta = new Set();
    Object.values(MEALS).forEach(M=>M.op.forEach(o=>
      o.it.forEach(([id])=>{ if(!this.foods[id]) falta.add(id); })));
    return [...falta];
  },

    /* ═══ FICHA DE PREPARACIÓN ═══
     Los gramajes salen de opItems(), así que respetan la preferencia
     de verdura fresca o congelada sin duplicar datos. */
  showPrep(comida, opId){
    const M = MEALS[comida];
    const op = (M.op||[]).find(o=>o.id===opId);
    if(!op || !op.prep) return;
    const p = op.prep, m = this.macrosOf(op);

    el('prepModalBody').innerHTML = `
      <h3>${op.n}</h3>
      <p class="hint">${M.hora} · ${M.n} · <strong>${p.t}</strong> · ${p.dif}</p>
      <div class="verdict">${Math.round(m.kcal)} kcal · ${m.p.toFixed(0)} g P ·
        ${m.c.toFixed(0)} g HC · ${m.g.toFixed(0)} g G · ${m.fib.toFixed(0)} g fibra</div>

      <h4 class="sub">Ingredientes</h4>
      <table>${this.opItems(op).map(([id,gr])=>{
        const f = this.foods[id];
        const ud = (f && f.ud) ? ` <span class="hint">≈ ${(gr/f.ud).toFixed(1).replace('.0','')} ud</span>` : '';
        return `<tr><td>${f?f.n:id}</td><td class="n"><strong>${gr} g</strong>${ud}</td></tr>`;
      }).join('')}</table>
      <p class="hint">Carnes, pescados, arroz y pasta: <strong>gramaje en crudo</strong>.</p>

      <h4 class="sub">Utensilios</h4>
      <p class="hint">${p.ut.join(' · ')}</p>

      <h4 class="sub">Preparación</h4>
      <ol class="pasos">${p.pasos.map(s=>`<li>${s}</li>`).join('')}</ol>
      ${p.tip?`<p class="note"><strong>Clave:</strong> ${p.tip}</p>`:''}`;

    el('prepModal').classList.add('on');
  },

  /* Catálogo de platos con ficha, para la pestaña Recetas */
  renderDishes(){
    const html = MEAL_ORDER.map(c=>{
      const M = MEALS[c];
      const con = (M.op||[]).filter(o=>o.prep);
      if(!con.length) return '';
      return `<h4 class="sub">${M.hora} · ${M.n}</h4>
        ${con.map(o=>{
          const m = this.macrosOf(o);
          return `<button class="opt" data-dish="${c}|${o.id}">
            <strong>${o.n}</strong> <span class="tag">${o.prep.t}</span>
            <br><span class="hint">${Math.round(m.kcal)} kcal · ${m.p.toFixed(0)} g P ·
            ${o.prep.pasos.length} pasos · ${o.prep.ut.length} utensilios</span></button>`;
        }).join('')}`;
    }).join('');

    el('dishList').innerHTML = html ||
      '<p class="hint">Sin fichas de preparación cargadas.</p>';
    el('dishList').querySelectorAll('[data-dish]').forEach(b=>b.onclick = ()=>{
      const [c,id] = b.dataset.dish.split('|');
      this.showPrep(c, id);
    });
  }
};