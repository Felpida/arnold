'use strict';

/* ═══════════════════ ALMACENAMIENTO ═══════════════════
   IndexedDB versión 2. Todo local en el móvil, sin servidores.

   MIGRACIÓN DESDE v1: el store 'daily' del MVP se copia a 'body'.
   'daily' NO se borra: se conserva como respaldo de solo lectura.
   Con esto, lo que registres desde el 19 de agosto no se pierde
   aunque la app siga creciendo. */

const DB_NAME = 'arnold';
const DB_VER  = 2;
let db = null;

const STORES = {
  body:     {keyPath:'fecha'},                          // registro diario
  measures: {keyPath:'fecha'},                          // perímetros
  workouts: {keyPath:'id', auto:true, idx:['fecha','estado']},
  runs:     {keyPath:'id', auto:true, idx:['fecha']},
  intake:   {keyPath:'id', idx:['fecha']},              // id = 'YYYY-MM-DD|comida'
  foods:    {keyPath:'id', idx:['barcode']},
  recipes:  {keyPath:'id', auto:true},
  settings: {keyPath:'k'}
};

function openDB(){
  return new Promise((res,rej)=>{
    const r = indexedDB.open(DB_NAME, DB_VER);

    r.onupgradeneeded = e=>{
      const d = e.target.result, tr = e.target.transaction, old = e.oldVersion;

      for(const [name,cfg] of Object.entries(STORES)){
        if(d.objectStoreNames.contains(name))continue;
        const st = d.createObjectStore(name, cfg.auto
          ? {keyPath:cfg.keyPath, autoIncrement:true}
          : {keyPath:cfg.keyPath});
        (cfg.idx||[]).forEach(k=>st.createIndex(k,k,{unique:false}));

        // Migración v1 → v2: 'daily' pasa a 'body'
        if(name==='body' && old>=1 && d.objectStoreNames.contains('daily')){
          const cur = tr.objectStore('daily').openCursor();
          cur.onsuccess = ev=>{
            const c = ev.target.result;
            if(!c)return;
            const o = c.value;
            st.put({fecha:o.fecha, peso:o.peso??null, pasos:o.pasos??null,
              sueno:o.sueno??null, dormir:o.dormir??null, kcal:o.kcal??null,
              prot:o.prot??null, hc:o.hc??null, grasa:o.grasa??null, fibra:null,
              adh:o.adh??null, notas:o.notas??null, foto:false, migrado:true});
            c.continue();
          };
        }
      }
    };

    r.onsuccess = ()=>{db = r.result; res(db);};
    r.onerror   = ()=>rej(r.error);
    r.onblocked = ()=>rej(new Error('Cierra las otras pestañas de la app y recarga.'));
  });
}

/* ── Operaciones básicas ── */
function _st(store,mode){return db.transaction(store,mode).objectStore(store);}
function _req(q){return new Promise((res,rej)=>{q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}

const DB = {
  get   : (s,k)=>_req(_st(s,'readonly').get(k)).then(v=>v||null),
  getAll: s=>_req(_st(s,'readonly').getAll()).then(v=>v||[]),
  put   : (s,v)=>_req(_st(s,'readwrite').put(v)),
  del   : (s,k)=>_req(_st(s,'readwrite').delete(k)),
  clear : s=>_req(_st(s,'readwrite').clear()),

  byIndex: (s,idx,val)=>_req(_st(s,'readonly').index(idx).getAll(val)).then(v=>v||[]),

  // Rango de fechas sobre un índice 'fecha' (o sobre keyPath 'fecha')
  async range(s,desde,hasta){
    const all = await DB.getAll(s);
    return all.filter(r=>r.fecha>=desde && r.fecha<=hasta);
  },

  async bulk(s,arr){
    const st = _st(s,'readwrite');
    await Promise.all(arr.map(v=>_req(st.put(v))));
  },

  async setting(k,v){
    if(v===undefined){const r = await DB.get('settings',k);return r?r.v:null;}
    return DB.put('settings',{k,v});
  }
};

/* ── Semilla de la base de alimentos ──
   Solo la primera vez. Los alimentos escaneados se añaden encima
   y nunca se sobrescriben con la semilla. */
async function seedFoods(){
  const done = await DB.setting('seed_foods');
  if(done)return;
  const arr = Object.entries(FOODS).map(([id,f])=>({
    id, n:f.n, marca:f.m||null, barcode:null, ud:f.ud||null,
    por100:{kcal:f.kcal, p:f.p, c:f.c, g:f.g, fib:f.fib||0},
    nota:f.nota||null, origen:'plan', favorito:true
  }));
  await DB.bulk('foods',arr);

  const rec = Object.entries(RECIPES).map(([rid,r])=>({
    rid, n:r.n, raciones:r.raciones, it:r.it, pasos:r.pasos, origen:'plan'
  }));
  await DB.bulk('recipes',rec);

  await DB.setting('seed_foods',true);
}

/* ═══════════════════ FECHAS ═══════════════════ */
const D = {
  iso:  d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),
  today:()=>D.iso(new Date()),
  parse:s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);},
  add:  (s,n)=>{const d=D.parse(s);d.setDate(d.getDate()+n);return D.iso(d);},
  dow:  s=>D.parse(s).getDay(),                       // 0 = domingo
  // Lunes de la semana a la que pertenece la fecha
  weekStart:s=>{const d=D.parse(s);const w=(d.getDay()+6)%7;d.setDate(d.getDate()-w);return D.iso(d);},
  diffDays:(a,b)=>Math.round((D.parse(b)-D.parse(a))/86400000),
  label:s=>D.parse(s).toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'}),
  labelLong:s=>D.parse(s).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'}),
  monthName:(y,m)=>new Date(y,m,1).toLocaleDateString('es-ES',{month:'long',year:'numeric'})
};

/* ═══════════════════ CÁLCULOS ═══════════════════ */
const Calc = {

  /* 1RM estimado — fórmula de Epley */
  e1rm(carga,reps){
    return (carga>0 && reps>0) ? carga*(1+reps/30) : null;
  },

  /* Media móvil de 7 días del peso.
     Exige 3 datos mínimo en la ventana: con menos, la señal es ruido. */
  movAvg(rows){
    const w = rows.filter(r=>r.peso!=null).sort((a,b)=>a.fecha<b.fecha?-1:1);
    return w.map((r,i)=>{
      const from = D.add(r.fecha,-6);
      const win = w.slice(0,i+1).filter(x=>x.fecha>=from);
      return {fecha:r.fecha, peso:r.peso,
        ma: win.length>=3 ? win.reduce((s,x)=>s+x.peso,0)/win.length : null};
    });
  },

  /* % de grasa · método Navy (hombre). Medidas en cm. */
  navy(cintura,cuello,altura){
    if(!(cintura>0&&cuello>0&&altura>0)||cintura<=cuello)return null;
    const v = 495/(1.0324 - 0.19077*Math.log10(cintura-cuello) + 0.15456*Math.log10(altura)) - 450;
    return (v>2&&v<60) ? v : null;
  },

  /* Masa magra y masa grasa a partir del peso y el % */
  compo(peso,pct){
    if(peso==null||pct==null)return null;
    const grasa = peso*pct/100;
    return {grasa, magra:peso-grasa};
  },

  /* Ratio hombro/cintura — el indicador que mide de verdad el objetivo */
  ratioHC(hombros,cintura){
    return (hombros>0&&cintura>0) ? hombros/cintura : null;
  },

  /* Macros de una lista de items [[idAlimento, gramos], ...] */
  macros(items,foodsById){
    const t = {kcal:0,p:0,c:0,g:0,fib:0};
    (items||[]).forEach(([id,gr])=>{
      const f = foodsById[id]; if(!f)return;
      const k = gr/100, v = f.por100;
      t.kcal += v.kcal*k; t.p += v.p*k; t.c += v.c*k; t.g += v.g*k; t.fib += (v.fib||0)*k;
    });
    Object.keys(t).forEach(k=>t[k]=Math.round(t[k]*10)/10);
    return t;
  },

  /* Evaluación de un cambio de plato frente a la opción base */
  swapCheck(base,alt){
    const dk = Math.abs(alt.kcal-base.kcal)/base.kcal;
    const dp = Math.abs(alt.p-base.p)/base.p;
    let lvl = 'bad';
    if(dk<=SWAP_TOL.ok.kcal   && dp<=SWAP_TOL.ok.p)   lvl='ok';
    else if(dk<=SWAP_TOL.warn.kcal && dp<=SWAP_TOL.warn.p) lvl='warn';
    return {lvl, msg:SWAP_TOL.msg[lvl],
      dkcal:Math.round(alt.kcal-base.kcal), dp:Math.round((alt.p-base.p)*10)/10,
      dc:Math.round(alt.c-base.c), dg:Math.round(alt.g-base.g)};
  },

  /* Fase activa en una fecha */
  phaseFor(fecha){
    return PHASES.find(p=>fecha>=p.desde && fecha<=p.hasta) || PHASES[PHASES.length-1];
  },

  /* Semana del programa. Semana 1 = lunes 24 ago 2026. Negativa = Semana 0. */
  weekNum(fecha){
    const n = D.diffDays('2026-08-24', D.weekStart(fecha));
    return Math.floor(n/7)+1;
  },

  /* RIR objetivo según la semana dentro del mesociclo de 6 */
  rirFor(fecha){
    const w = Calc.weekNum(fecha);
    if(w<1)return 5;                        // Semana 0
    return RIR_WEEK[((w-1)%6)+1];
  },

  /* Sesión de gimnasio planificada para una fecha */
  plannedSession(fecha){
    const w = Calc.weekNum(fecha), dow = D.dow(fecha);
    if(w<1){                                // Semana 0: mié/jue/vie
      return {3:'S0A', 4:'S0B', 5:'S0C'}[dow] || null;
    }
    return WEEK_PLAN[dow] || null;
  },

  /* Sesiones de running planificadas para una fecha */
  plannedRuns(fecha){
    const w = Calc.weekNum(fecha), dow = D.dow(fecha);
    return (RUN_PLAN[Math.max(0,w)]||[]).filter(r=>r.d===dow);
  },

  /* Ritmo min/km a partir de km y segundos */
  pace(km,seg){
    if(!(km>0&&seg>0))return null;
    const s = seg/km, m = Math.floor(s/60);
    return m+':'+String(Math.round(s-m*60)).padStart(2,'0');
  },
  paceSec(km,seg){return (km>0&&seg>0)?seg/km:null;},

  /* Tonelaje de un ejercicio o de una sesión */
  tonnage(sets){
    return (sets||[]).reduce((s,x)=>s+((x.carga>0&&x.reps>0)?x.carga*x.reps:0),0);
  },

  /* Volumen semanal por grupo muscular. Prehab excluida. */
  volumeByGroup(workouts,desde,hasta){
    const v = {};
    workouts.filter(w=>w.estado==='done'&&w.fecha>=desde&&w.fecha<=hasta)
      .forEach(w=>(w.ex||[]).forEach(e=>{
        if(e.grupo===G.PRE)return;
        v[e.grupo] = (v[e.grupo]||0) + (e.sets||[]).filter(s=>s.reps>0).length;
      }));
    return v;
  }
};

/* ═══════════════════ EXPORTACIÓN CSV ═══════════════════
   Separador ';' y BOM UTF-8 para que Excel en español lo abra bien
   sin pasar por el asistente de importación. */

function csvCell(v){
  if(v==null)return '';
  const s = String(v).replace(/\r?\n/g,' ');
  return /[";]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
}
function csvNum(v,d){
  return v==null ? '' : String(Number(v).toFixed(d==null?1:d)).replace('.',',');
}
function toCsv(head,rows){
  return [head.join(';'), ...rows.map(r=>r.map(csvCell).join(';'))].join('\r\n');
}

const Export = {

  async diario(){
    const rows = await DB.getAll('body');
    const ma = {}; Calc.movAvg(rows).forEach(r=>ma[r.fecha]=r.ma);
    const out = rows.sort((a,b)=>a.fecha<b.fecha?-1:1).map(r=>{
      const ph = Calc.phaseFor(r.fecha);
      return [r.fecha, ph.id, Calc.weekNum(r.fecha),
        csvNum(r.peso), csvNum(ma[r.fecha],2),
        r.kcal, r.prot, r.hc, r.grasa, csvNum(r.fibra),
        r.pasos, csvNum(r.sueno), r.dormir, r.adh, r.notas];
    });
    return toCsv(['fecha','fase','semana','peso_kg','media_movil_7d','kcal','proteina_g',
      'hidratos_g','grasa_g','fibra_g','pasos','sueno_h','hora_dormir',
      'adherencia_menu','notas'], out);
  },

  async entrenamiento(){
    const ws = (await DB.getAll('workouts')).sort((a,b)=>a.fecha<b.fecha?-1:1);
    const out = [];
    ws.forEach(w=>(w.ex||[]).forEach(e=>{
      const mol = (w.molestias||[]).find(m=>m.ex===(e.exReal||e.exPlan));
      (e.sets||[]).forEach((s,i)=>{
        out.push([w.fecha, Calc.phaseFor(w.fecha).id, Calc.weekNum(w.fecha),
          w.sesion, w.estado,
          EX[e.exPlan]?.n || e.exPlan,
          EX[e.exReal]?.n || e.exReal || '',
          e.exReal && e.exReal!==e.exPlan ? 'SI' : '',
          e.grupo, i+1, csvNum(s.carga), s.reps, s.rir,
          csvNum(Calc.e1rm(s.carga,s.reps)),
          w.rpe, mol?mol.zona:'', mol?mol.nivel:'', e.nota||'', w.notas||'']);
      });
    }));
    return toCsv(['fecha','fase','semana','sesion','estado','ejercicio_planificado',
      'ejercicio_realizado','sustituido','grupo_muscular','n_serie','carga_kg','reps','rir',
      'e1rm_kg','rpe_sesion','molestia_zona','molestia_nivel','nota_ejercicio',
      'notas_sesion'], out);
  },

  async running(){
    const rs = (await DB.getAll('runs')).sort((a,b)=>a.fecha<b.fecha?-1:1);
    const out = rs.map(r=>[r.fecha, Calc.phaseFor(r.fecha).id, Calc.weekNum(r.fecha),
      r.tipo, RUN_TYPES[r.tipo]?.n||r.tipo,
      csvNum(r.km,2), csvNum(r.seg/60,1), Calc.pace(r.km,r.seg),
      r.fcMedia, r.fcMax, r.rpe, r.notas]);
    return toCsv(['fecha','fase','semana','tipo','tipo_nombre','km','minutos',
      'ritmo_min_km','fc_media','fc_max','rpe','notas'], out);
  },

  async perimetros(){
    const ms = (await DB.getAll('measures')).sort((a,b)=>a.fecha<b.fecha?-1:1);
    const body = await DB.getAll('body');
    const pesoBy = {}; body.forEach(b=>{if(b.peso!=null)pesoBy[b.fecha]=b.peso;});
    const altura = (await DB.setting('altura')) || 175;
    const out = ms.map(m=>{
      const navy = Calc.navy(m.cintura_ombligo, m.cuello, altura);
      const peso = pesoBy[m.fecha] ?? null;
      const co = Calc.compo(peso,navy);
      return [m.fecha, csvNum(m.cuello), csvNum(m.hombros), csvNum(m.pecho),
        csvNum(m.cintura_ombligo), csvNum(m.cintura_estrecha), csvNum(m.cadera),
        csvNum(m.brazo_rel), csvNum(m.brazo_con), csvNum(m.muslo), csvNum(m.gemelo),
        csvNum(peso), csvNum(navy), csvNum(co?co.magra:null), csvNum(co?co.grasa:null),
        csvNum(Calc.ratioHC(m.hombros,m.cintura_ombligo),3), m.notas];
    });
    return toCsv(['fecha','cuello','hombros','pecho','cintura_ombligo','cintura_estrecha',
      'cadera','brazo_relajado','brazo_contraido','muslo','gemelo','peso_kg',
      'grasa_navy_pct','masa_magra_kg','masa_grasa_kg','ratio_hombro_cintura','notas'], out);
  },

  async dieta(){
    const ins = (await DB.getAll('intake')).sort((a,b)=>a.id<b.id?-1:1);
    const out = ins.map(r=>[r.fecha, r.comida, r.opPlan, r.opReal, r.estado,
      csvNum(r.tot?.kcal,0), csvNum(r.tot?.p), csvNum(r.tot?.c),
      csvNum(r.tot?.g), csvNum(r.tot?.fib), r.notas]);
    return toCsv(['fecha','comida','opcion_planificada','opcion_realizada','estado',
      'kcal','proteina_g','hidratos_g','grasa_g','fibra_g','notas'], out);
  },

  async backup(){
    const data = {v:DB_VER, exportado:new Date().toISOString()};
    for(const s of ['body','measures','workouts','runs','intake','foods','recipes','settings'])
      data[s] = await DB.getAll(s);
    return JSON.stringify(data);
  },

  async restore(json){
    const data = JSON.parse(json);
    if(typeof data!=='object' || !Array.isArray(data.body))
      throw new Error('El fichero no es un backup de Arnold.');
    for(const s of ['body','measures','workouts','runs','intake','foods','recipes','settings']){
      if(!Array.isArray(data[s]))continue;
      await DB.clear(s);
      const arr = data[s].map(r=>{
        if(STORES[s].auto) {const c={...r}; delete c.id; return c;}
        return r;
      });
      await DB.bulk(s,arr);
    }
    return {dias:data.body.length, sesiones:(data.workouts||[]).length};
  }
};

/* ═══════════════════ COMPARTIR / DESCARGAR ═══════════════════
   Prioriza el menú de compartir de Android (va directo a Gmail).
   Si no está disponible, descarga el fichero. */
async function shareFiles(files){
  const fs = files.map(f=>new File(['\ufeff'+f.text], f.name, {type:f.mime||'text/csv'}));
  if(navigator.canShare && navigator.canShare({files:fs})){
    try{ await navigator.share({files:fs, title:'Arnold — datos'}); return 'compartido'; }
    catch(err){ if(err.name==='AbortError') return 'cancelado'; }
  }
  fs.forEach(f=>{
    const url = URL.createObjectURL(f);
    const a = document.createElement('a');
    a.href = url; a.download = f.name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 5000);
  });
  return 'descargado';
}

async function exportAll(){
  return shareFiles([
    {name:'diario.csv',        text:await Export.diario()},
    {name:'entrenamiento.csv', text:await Export.entrenamiento()},
    {name:'running.csv',       text:await Export.running()},
    {name:'perimetros.csv',    text:await Export.perimetros()},
    {name:'dieta.csv',         text:await Export.dieta()}
  ]);
}