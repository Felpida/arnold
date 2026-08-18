'use strict';

/* ═══════════════════ BASE DE ALIMENTOS ═══════════════════
   Todos los valores POR 100 g (o 100 ml en líquidos).
   Carnes, pescados, arroz y pasta: valores EN CRUDO.
   ud = peso de una unidad comestible, para poder contar en piezas.
   Esta tabla es la fuente única de verdad: los macros del menú se
   calculan desde aquí, nunca se escriben a mano. */
const FOODS = {

  /* ── Lácteos y huevo ── */
  queso_batido:  {n:'Queso batido 0 %',            m:'Hacendado', kcal:47,  p:10.5, c:4,    g:0.2,  fib:0},
  skyr:          {n:'Skyr natural',                m:'Hacendado', kcal:63,  p:11,   c:4,    g:0.2,  fib:0},
  yogur_griego0: {n:'Yogur griego 0 %',            m:'Hacendado', kcal:57,  p:10,   c:3.6,  g:0.4,  fib:0},
  leche_desn:    {n:'Leche desnatada',             m:'Hacendado', kcal:33,  p:3.3,  c:4.8,  g:0.1,  fib:0},
  huevo:         {n:'Huevo fresco',                m:'—',         kcal:143, p:12.6, c:0.7,  g:9.5,  fib:0, ud:55},
  claras:        {n:'Claras pasteurizadas',        m:'Hacendado', kcal:48,  p:11,   c:0.7,  g:0.2,  fib:0},
  queso_havarti: {n:'Queso havarti en lonchas',    m:'Hacendado', kcal:370, p:24,   c:0,    g:30,   fib:0},

  /* ── Carnes ── */
  muslo_pollo:   {n:'Muslo de pollo sin piel',     m:'—', kcal:130, p:20,   c:0, g:5.5, fib:0,
                  nota:'Comprar con hueso: 2,29 €/100 g de proteína, la fuente más barata del plan.'},
  pechuga_pollo: {n:'Pechuga de pollo',            m:'—', kcal:110, p:23,   c:0, g:1.8, fib:0},
  pavo_picado:   {n:'Pavo picado',                 m:'—', kcal:120, p:22,   c:0, g:3,   fib:0},
  ternera_5:     {n:'Ternera picada 5 % grasa',    m:'—', kcal:135, p:21,   c:0, g:5,   fib:0},
  jamon_cocido:  {n:'Jamón cocido extra',          m:'Hacendado', kcal:105, p:19, c:1, g:2.5, fib:0},

  /* ── Pescados ── */
  merluza:       {n:'Merluza congelada',           m:'Hacendado', kcal:72,  p:16, c:0, g:0.8, fib:0},
  lubina:        {n:'Lubina',                      m:'—',         kcal:97,  p:18, c:0, g:2.5, fib:0},
  salmon:        {n:'Salmón',                      m:'—',         kcal:200, p:20, c:0, g:13,  fib:0,
                  nota:'Racionado por coste: máximo 1 vez por semana.'},
  atun_natural:  {n:'Atún al natural, escurrido',  m:'Hacendado', kcal:108, p:25, c:0, g:1,   fib:0,
                  nota:'No es proteína barata: 5,80 €/100 g. Uso ocasional.'},

  /* ── Hidratos ── */
  pan_integral:  {n:'Pan integral',                m:'—',         kcal:250, p:9,   c:47, g:2,   fib:6.5},
  pan_molde_int: {n:'Pan de molde integral',       m:'Hacendado', kcal:240, p:10,  c:41, g:3.5, fib:6, ud:28},
  pan_pita:      {n:'Pan de pita integral',        m:'Hacendado', kcal:270, p:9,   c:50, g:2,   fib:5},
  arroz:         {n:'Arroz',                       m:'Hacendado', kcal:350, p:7,   c:78, g:0.6, fib:1.4},
  pasta:         {n:'Pasta',                       m:'Hacendado', kcal:355, p:12,  c:71, g:1.5, fib:3},
  patata:        {n:'Patata',                      m:'—',         kcal:77,  p:2,   c:17, g:0.1, fib:2.2},
  boniato:       {n:'Boniato',                     m:'—',         kcal:86,  p:1.6, c:20, g:0.1, fib:3},
  tortitas_arroz:{n:'Tortitas de arroz',           m:'Hacendado', kcal:380, p:8,   c:81, g:2.8, fib:2, ud:6},
  garbanzos_bote:{n:'Garbanzos cocidos, escurridos', m:'Hacendado', kcal:140, p:7.5, c:17, g:2.8, fib:7},
  alubias_bote:  {n:'Alubias blancas cocidas, escurridas', m:'Hacendado', kcal:110, p:7, c:15, g:0.6, fib:6},

  /* ── Fruta y verdura ── */
  platano:       {n:'Plátano, pelado',             m:'—', kcal:88, p:1.1, c:22.5, g:0.3, fib:2.1, ud:120},
  naranja:       {n:'Naranja, pelada',             m:'—', kcal:45, p:0.9, c:11,   g:0.1, fib:2.2, ud:200},
  manzana:       {n:'Manzana',                     m:'—', kcal:53, p:0.3, c:14,   g:0.2, fib:2.4, ud:180},
  pepino:        {n:'Pepino',                      m:'—', kcal:15, p:0.7, c:3,    g:0.1, fib:0.9},
  pimiento_asado:{n:'Pimiento asado',              m:'—', kcal:30, p:1,   c:5.5,  g:0.3, fib:1.6},
  verdura_cong:  {n:'Verdura congelada (judía / menestra / brócoli)', m:'Hacendado', kcal:40, p:2.5, c:5, g:0.4, fib:3},
  ensalada:      {n:'Ensalada y verdura fresca',   m:'—', kcal:20, p:1.3, c:2.7,  g:0.2, fib:1.8},

  /* ── Grasas y otros ── */
  aove:          {n:'Aceite de oliva virgen extra',m:'Hacendado', kcal:900, p:0,   c:0,  g:100, fib:0},
  nueces:        {n:'Nueces',                      m:'Hacendado', kcal:654, p:15,  c:7,  g:65,  fib:6.7},
  miel:          {n:'Miel',                        m:'Hacendado', kcal:320, p:0.3, c:80, g:0,   fib:0},
  tomate_frito:  {n:'Tomate frito',                m:'Hacendado', kcal:80,  p:1.5, c:9,  g:4,   fib:1.5}
};

/* Alimentos vetados. La app los bloquea al escanear o al añadir a una receta. */
const FOOD_VETO = ['chocolate','alcachofa','bollería','dulces','quinoa','chía','coliflor',
  'avena','muesli','cereales de desayuno','aguacate','cuscús','sémola','mermelada'];

/* Tomate natural: permitido pero desaconsejado por preferencia. Aviso, no bloqueo. */
const FOOD_WARN = {tomate_natural:'Preferencia: tomate natural muy poco o nada.'};

/* ═══════════════════ COMIDAS Y EQUIVALENCIAS ═══════════════════
   Cada franja tiene una opción base (la del plan) y alternativas
   con macros equivalentes. it = [idAlimento, gramos].
   La app calcula los macros de cada opción y muestra la desviación
   frente a la base, para que cambiar de plato no rompa el día. */

const MEALS = {

  /* ─────── DESAYUNO · 07:00 ─────── */
  desayuno:{hora:'07:00', n:'Desayuno', obj:{kcal:447,p:33,c:65,g:11},
    nota:'3 minutos, sin cocinar. Se ensambla. Existe por aritmética: 160 g de proteína en 4 comidas exigiría 40 g por comida con dos tuppers de trabajo.',
    op:[
      {id:'D1', n:'Queso batido, plátano y pan con miel', base:true,
       it:[['queso_batido',250],['platano',120],['pan_integral',40],['miel',10],['nueces',14]]},
      {id:'D2', n:'Skyr con pan de molde y plátano',
       it:[['skyr',250],['pan_molde_int',42],['miel',8],['nueces',12],['platano',120]]},
      {id:'D3', n:'Tortilla de huevo y claras con pan',
       it:[['huevo',110],['claras',100],['pan_integral',70],['naranja',200]],
       nota:'Requiere 4 min de sartén. Única opción del desayuno que se cocina.'},
      {id:'D4', n:'Yogur griego con tortitas y miel',
       it:[['yogur_griego0',300],['tortitas_arroz',25],['miel',12],['platano',120],['nueces',10]]}
    ]},

  /* ─────── ALMUERZO · 10:45 · TUPPER ─────── */
  almuerzo:{hora:'10:45', n:'Almuerzo (tupper)', obj:{kcal:499,p:32,c:56,g:16},
    nota:'Sustituye al bocadillo de fiambre de pavo: 32 g de proteína en lugar de 12, y más barato. Mismo formato para llevar al trabajo.',
    op:[
      {id:'A1', n:'Bocadillo de pollo a la plancha', base:true,
       it:[['pan_integral',70],['muslo_pollo',120],['pepino',40],['aove',8],['naranja',200]]},
      {id:'A2', n:'Bocadillo de atún y pimiento asado',
       it:[['pan_integral',70],['atun_natural',100],['pimiento_asado',40],['aove',12],['manzana',180]]},
      {id:'A3', n:'Bocadillo de huevo cocido y claras',
       it:[['pan_integral',55],['huevo',165],['claras',70],['pepino',40],['naranja',200]]},
      {id:'A4', n:'Sándwich de jamón cocido y havarti',
       it:[['pan_molde_int',84],['jamon_cocido',120],['queso_havarti',15],['pepino',40],['manzana',180]],
       nota:'Versión corregida de tu sándwich de fin de semana: 120 g de jamón en lugar de 2 lonchas.'}
    ]},

  /* ─────── COMIDA · 14:00 · TUPPER ─────── */
  comida:{hora:'14:00', n:'Comida (tupper)', obj:{kcal:645,p:41,c:63,g:23},
    op:[
      {id:'C1', n:'Arroz con muslo de pollo y verdura', base:true,
       it:[['arroz',60],['muslo_pollo',150],['verdura_cong',250],['tomate_frito',40],['aove',12]]},
      {id:'C2', n:'Pasta con ternera picada',
       it:[['pasta',60],['ternera_5',150],['verdura_cong',250],['tomate_frito',40],['aove',10]]},
      {id:'C3', n:'Patata con pechuga de pollo',
       it:[['patata',350],['pechuga_pollo',140],['verdura_cong',250],['aove',14]]},
      {id:'C4', n:'Arroz con merluza',
       it:[['arroz',55],['merluza',200],['verdura_cong',250],['aove',16],['nueces',6]]},
      {id:'C5', n:'Garbanzos con pollo',
       it:[['garbanzos_bote',220],['muslo_pollo',100],['verdura_cong',200],['aove',8],['pan_integral',20]],
       nota:'Cuenta como una de las 2 raciones semanales de legumbre obligatorias.'},
      {id:'C6', n:'Pasta con pavo picado',
       it:[['pasta',60],['pavo_picado',140],['verdura_cong',250],['tomate_frito',40],['aove',12]]}
    ]},

  /* ─────── PRE-ENTRENO · 17:00 ─────── */
  pre:{hora:'17:00', n:'Pre-entreno', obj:{kcal:302,p:20,c:59,g:2},
    nota:'30-45 min antes de entrenar. Grasa casi nula A PROPÓSITO: retrasaría la digestión. Estos hidratos son los que alimentan una sesión de 95 min — no se recortan nunca.',
    op:[
      {id:'P1', n:'Plátano, tortitas y queso batido', base:true,
       it:[['platano',120],['tortitas_arroz',20],['queso_batido',150],['pan_integral',20]]},
      {id:'P2', n:'Pan con miel y skyr',
       it:[['platano',120],['pan_integral',35],['miel',12],['skyr',150]]},
      {id:'P3', n:'Dos plátanos y queso batido',
       it:[['platano',240],['queso_batido',200]],
       nota:'La más rápida: cero preparación.'},
      {id:'P4', n:'Manzana, tortitas y queso batido',
       it:[['manzana',180],['tortitas_arroz',28],['queso_batido',180],['miel',10]]}
    ]},

  /* ─────── CENA · 20:45 · POST-ENTRENO ─────── */
  cena:{hora:'20:45', n:'Cena (post-entreno)', obj:{kcal:650,p:37,c:56,g:28},
    nota:'Mayor carga de hidratos del día, justo después de entrenar.',
    op:[
      {id:'CA', n:'Huevos con patata', base:true, rot:'A',
       it:[['patata',270],['huevo',220],['ensalada',150],['aove',12]]},
      {id:'CB', n:'Merluza con patata', rot:'B',
       it:[['patata',320],['merluza',200],['verdura_cong',150],['aove',23]]},
      {id:'CC', n:'Garbanzos con pollo', rot:'C',
       it:[['garbanzos_bote',200],['muslo_pollo',80],['verdura_cong',150],['pan_integral',50],['aove',8]],
       nota:'OBLIGATORIA 2 veces/semana. Sin avena, la legumbre es lo que sostiene los 30-35 g de fibra.'},
      {id:'CC2',n:'Alubias blancas con pollo', rot:'C',
       it:[['alubias_bote',250],['muslo_pollo',80],['verdura_cong',150],['pan_integral',45],['aove',12]],
       nota:'Variante de CC. Cuenta igual como ración de legumbre.'},
      {id:'CD', n:'Lubina con patata',
       it:[['patata',300],['lubina',160],['verdura_cong',150],['aove',18]]},
      {id:'CE', n:'Tortilla de patata con ensalada',
       it:[['patata',250],['huevo',165],['claras',100],['ensalada',150],['aove',14]]},
      {id:'CF', n:'Salmón con patata',
       it:[['patata',280],['salmon',140],['verdura_cong',150],['aove',6]],
       nota:'Máximo 1 vez por semana: es el plato más caro del recetario.'},
      {id:'CG', n:'Pasta con atún',
       it:[['pasta',65],['atun_natural',120],['verdura_cong',150],['tomate_frito',40],['aove',16]]}
    ]}
};

/* Rotación semanal de cenas. Índice = día (0 = domingo). */
const CENA_ROT = {1:'A', 2:'C', 3:'A', 4:'B', 5:'C', 6:'B', 0:'A'};

/* ═══════════════════ TOLERANCIA DEL CAMBIO DE PLATO ═══════════════════
   Al elegir una alternativa, la app compara con la opción base y avisa.
   La proteína es el macro crítico; la grasa el más flexible. */
const SWAP_TOL = {
  ok:    {kcal:0.10, p:0.15},   // verde: no rompe la dieta
  warn:  {kcal:0.20, p:0.25},   // ámbar: aceptable, compensar en la siguiente comida
  // por encima de warn → rojo: desaconsejado
  msg:{
    ok:  'Equivalente. No rompe el día.',
    warn:'Desviación moderada. Ajusta ligeramente la siguiente comida.',
    bad: 'Desviación alta. Solo si no hay alternativa.'
  }
};

/* ═══════════════════ RECETAS DE BATCH COOKING ═══════════════════
   Preparaciones que rinden varias raciones. Sirven para pesar una vez
   el domingo y no tener que registrar nada de lunes a miércoles. */
const RECIPES = {
  bc_pollo_arroz:{
    n:'Tanda de pollo y arroz (3 tuppers de comida)', raciones:3,
    it:[['muslo_pollo',450],['arroz',180],['verdura_cong',750],['tomate_frito',120],['aove',36]],
    pasos:['Muslo de pollo deshuesado al horno, 200 °C, 35-40 min, en una sola bandeja.',
           'Arroz hervido: 180 g en crudo rinden ~470 g cocidos.',
           'Verdura congelada al vapor o salteada.',
           'Repartir en 3 tuppers PESANDO EN CRUDO antes de cocinar.',
           'El aceite en crudo y el tomate frito se añaden en el momento, no al tupper.']},

  bc_pollo_bocata:{
    n:'Pollo para los bocadillos (3 almuerzos)', raciones:3,
    it:[['muslo_pollo',360]],
    pasos:['A la plancha o al horno junto con la tanda de la comida.',
           '360 g en crudo → ~270 g cocinados → 90 g por bocadillo.',
           'El pan y el pepino se montan por la mañana, en 1 minuto.']},

  bc_patata:{
    n:'Patata cocida (3 cenas)', raciones:3,
    it:[['patata',850]],
    pasos:['Cocer con piel y pelar después: pierde menos agua y sabe mejor.',
           'Aguanta 3 días en nevera.']},

  tortilla_patata:{
    n:'Tortilla de patata para cena', raciones:1,
    it:[['patata',250],['huevo',165],['claras',100],['aove',14]],
    pasos:['Patata en rodajas finas, pochada en el aceite.',
           'Batir huevo entero + claras. Cuajar a fuego medio.']}
};

/* ═══════════════════ CONVERSIONES CRUDO → COCINADO ═══════════════════
   Todos los gramajes del plan son EN CRUDO. Esta tabla es solo informativa,
   para cuando toque pesar algo ya cocinado. */
const COOK_FACTOR = {
  muslo_pollo:0.75, pechuga_pollo:0.75, pavo_picado:0.78, ternera_5:0.78,
  merluza:0.80, lubina:0.80, salmon:0.80,
  arroz:2.60, pasta:2.40, patata:0.95,
  garbanzos_bote:1, alubias_bote:1
};

/* ═══════════════════ OBJETIVOS DIARIOS DE FIBRA E HIDRATACIÓN ═══════════════════ */
const DAILY_EXTRAS = {
  fibra:{min:30, max:40,
    nota:'Los días de cena A se quedan en ~30 g. Si notas peor digestión, sube la verdura de la cena de 150 a 250 g.'},
  agua:{min:3000, obj:3500, nota:'Ya lo haces bien: 3-4 L. No tocar.'},
  cafe:{max:2, corte:'16:00',
    nota:'Último café a las 16:00. Con el objetivo de acostarte a 23:30, más tarde sabotea el sueño, que es la prioridad nº1 de la fase.'},
  alcohol:{nota:'1-2 quintos/semana = 90-180 kcal. Irrelevante. Solo registrarlo.'},
  legumbre:{min_semana:2, nota:'Mínimo 2 raciones semanales. Obligatorio sin avena en la dieta.'}
};