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
  tomate_frito:  {n:'Tomate frito',                m:'Hacendado', kcal:80,  p:1.5, c:9,  g:4,   fib:1.5},

  /* ── Carnes añadidas ── */
  lomo_cerdo:    {n:'Lomo de cerdo',                m:'—', kcal:130, p:22,  c:0,  g:4.5, fib:0},

  /* ── Lácteos y quesos de cocina ── */
  parmesano:     {n:'Queso parmesano / grana padano', m:'Hacendado', kcal:400, p:33, c:0,   g:29,  fib:0},
  mozzarella:    {n:'Mozzarella fresca',            m:'Hacendado', kcal:250, p:18, c:1,   g:19,  fib:0},
  nata_ligera:   {n:'Nata ligera para cocinar 15 %',m:'Hacendado', kcal:160, p:2.5, c:4,  g:15,  fib:0},

  /* ── Base asiática ── */
  salsa_soja:    {n:'Salsa de soja',                m:'Hacendado', kcal:60,  p:6,   c:5.6, g:0.1, fib:0},
  leche_coco:    {n:'Leche de coco ligera',         m:'Hacendado', kcal:73,  p:0.8, c:2,   g:7,   fib:0},
  curry_polvo:   {n:'Curry en polvo',               m:'Hacendado', kcal:325, p:14,  c:25,  g:14,  fib:33},
  jengibre:      {n:'Jengibre fresco',              m:'—', kcal:80,  p:1.8, c:18,  g:0.8, fib:2},
  sesamo:        {n:'Semillas de sésamo',           m:'Hacendado', kcal:573, p:17,  c:23,  g:50,  fib:12},
  noodles:       {n:'Fideos chinos / noodles',      m:'Hacendado', kcal:348, p:12,  c:71,  g:1.4, fib:2.5},

  /* ── Base italiana ── */
  tomate_triturado:{n:'Tomate triturado',           m:'Hacendado', kcal:30,  p:1.3, c:4.5, g:0.2, fib:1.2,
                    nota:'Base de cocción, como el tomate frito. No es tomate natural en crudo.'},
  pesto:         {n:'Pesto genovés',                m:'Hacendado', kcal:450, p:5,   c:6,   g:45,  fib:2},

  /* ── Empanados ── */
  panko:         {n:'Pan rallado panko',            m:'Hacendado', kcal:380, p:12,  c:72,  g:3,   fib:3},
  harina:        {n:'Harina de trigo',              m:'Hacendado', kcal:350, p:10,  c:72,  g:1.2, fib:2.7},

  /* ── Verduras y hortalizas añadidas ── */
  cebolla:       {n:'Cebolla',                      m:'—', kcal:40,  p:1.1, c:9,   g:0.1, fib:1.7},
  ajo:           {n:'Ajo',                          m:'—', kcal:149, p:6.4, c:33,  g:0.5, fib:2.1},
  zanahoria:     {n:'Zanahoria',                    m:'—', kcal:41,  p:0.9, c:10,  g:0.2, fib:2.8},
  pimiento_verde:{n:'Pimiento verde o rojo',        m:'—', kcal:20,  p:0.9, c:4.6, g:0.2, fib:1.7},
  champinones:   {n:'Champiñones',                  m:'—', kcal:22,  p:3.1, c:3.3, g:0.3, fib:1},
  calabacin:     {n:'Calabacín',                    m:'—', kcal:17,  p:1.2, c:3.1, g:0.3, fib:1.1},
  espinacas:     {n:'Espinacas (congeladas)',       m:'Hacendado', kcal:23, p:2.9, c:3.6, g:0.4, fib:2.2},
  maiz_dulce:    {n:'Maíz dulce en conserva',       m:'Hacendado', kcal:86,  p:3.2, c:19,  g:1.2, fib:2.5},

  gambas:        {n:'Gambas peladas congeladas',    m:'Hacendado', kcal:85, p:18,  c:0.5, g:1,   fib:0,
                  nota:'~5,50 €/100 g de proteína. Máximo 1-2 veces por semana, como el salmón.'},
  guisantes:     {n:'Guisantes congelados',         m:'Hacendado', kcal:81, p:5.4, c:14,  g:0.4, fib:5}
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
       nota:'Versión corregida de tu sándwich de fin de semana: 120 g de jamón en lugar de 2 lonchas.'},
      {id:'A5', n:'Bocadillo de pollo teriyaki',
       it:[['pan_integral',70],['muslo_pollo',110],['salsa_soja',10],['miel',5],
           ['pepino',30],['aove',5],['manzana',180]],
       nota:'Marina el pollo la noche antes con la soja y la miel: se hace en 6 min a la plancha.'},
      {id:'A6', n:'Sándwich caprese con pollo',
       it:[['pan_molde_int',84],['pechuga_pollo',70],['mozzarella',40],['pesto',8],['naranja',200]],
       nota:'En frío. Se monta en 2 minutos por la mañana.'}
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
       it:[['pasta',60],['pavo_picado',140],['verdura_cong',250],['tomate_frito',40],['aove',12]]},
      {id:'C7', n:'Pollo katsu con arroz',
       it:[['pechuga_pollo',130],['panko',25],['huevo',25],['harina',8],
           ['arroz',50],['verdura_cong',150],['aove',14]],
       nota:'Al horno o freidora de aire, no frito: mismo panko crujiente con una fracción del aceite. 200 °C, 18 min, dándole la vuelta a mitad.'},
      {id:'C8', n:'Ternera con soja y miel y arroz',
       it:[['ternera_5',150],['salsa_soja',20],['miel',12],['arroz',60],
           ['cebolla',50],['pimiento_verde',80],['zanahoria',50],['aove',12],['sesamo',5]],
       nota:'Sella la carne a fuego fuerte, retírala, saltea la verdura y devuélvela con la soja y la miel al final. Si la miel entra antes, se quema.'},
      {id:'C9', n:'Pollo teriyaki con noodles',
       it:[['muslo_pollo',150],['salsa_soja',20],['miel',10],['noodles',55],
           ['verdura_cong',200],['jengibre',5],['aove',10],['sesamo',5]],
       nota:'Reduce la soja con la miel y el jengibre hasta que espese antes de mezclar.'},
      {id:'C10', n:'Curry de pollo con arroz',
       it:[['muslo_pollo',140],['leche_coco',80],['curry_polvo',8],['arroz',60],
           ['cebolla',60],['zanahoria',60],['espinacas',80],['aove',8]],
       nota:'Tuesta el curry en polvo 30 s en el aceite antes de añadir nada más: cambia por completo el resultado.'},
      {id:'C11', n:'Pasta a la boloñesa',
       it:[['pasta',60],['ternera_5',150],['tomate_triturado',150],['cebolla',50],
           ['zanahoria',50],['aove',10],['parmesano',10]],
       nota:'La zanahoria rallada en el sofrito es lo que da el dulzor sin azúcar.'},
      {id:'C12', n:'Pollo a la milanesa con pasta',
       it:[['pechuga_pollo',120],['panko',25],['huevo',25],['pasta',45],
           ['tomate_triturado',100],['ensalada',100],['aove',14],['parmesano',8]],
       nota:'Al horno, igual que el katsu.'},
      {id:'C13', n:'Pasta al pesto con pollo',
       it:[['pasta',70],['muslo_pollo',140],['pesto',20],['calabacin',100],
           ['parmesano',10],['aove',5]],
       nota:'El pesto no se cocina: se mezcla fuera del fuego con un poco del agua de la pasta.'},
      {id:'C14', n:'Bowl de pollo, maíz y alubias',
       it:[['arroz',55],['pechuga_pollo',130],['maiz_dulce',60],['pimiento_verde',80],
           ['cebolla',40],['alubias_bote',80],['aove',14]],
       nota:'Se come frío o templado, así que aguanta bien como tupper.'},
      {id:'C15', n:'Arroz frito con gambas y huevo',
       it:[['arroz',60],['gambas',150],['huevo',55],['guisantes',60],['zanahoria',50],
           ['cebolla',40],['salsa_soja',15],['aove',10],['sesamo',4]],
       nota:'Con arroz del día anterior sale mucho mejor: el recién hecho suelta almidón y se empasta. Cuaja el huevo aparte y mézclalo al final.'},
      {id:'C16', n:'Yakisoba de gambas',
       it:[['noodles',60],['gambas',160],['verdura_cong',200],['pimiento_verde',80],
           ['salsa_soja',18],['jengibre',5],['aove',16],['sesamo',5]],
       nota:'Las gambas se hacen en 2 minutos. Échalas al final o quedan gomosas.'}
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
       it:[['pasta',65],['atun_natural',120],['verdura_cong',150],['tomate_frito',40],['aove',16]]},
      {id:'CH', n:'Salteado de cerdo con arroz',
       it:[['lomo_cerdo',130],['arroz',60],['verdura_cong',200],['salsa_soja',15],
           ['ajo',5],['aove',14],['sesamo',4]],
       nota:'Sartén muy caliente y poca cantidad cada vez: si abarrotas la sartén, el cerdo cuece en vez de saltearse.'},
      {id:'CJ', n:'Lasaña de calabacín y ternera',
       it:[['ternera_5',100],['calabacin',250],['tomate_triturado',150],['mozzarella',40],
           ['patata',200],['aove',12],['parmesano',8]],
       nota:'Láminas de calabacín en lugar de placas de pasta, con la patata en rodajas de base. Menos hidratos por volumen, así que llena mucho.'},
      {id:'CK', n:'Risotto de champiñones con pollo',
       it:[['arroz',60],['muslo_pollo',115],['champinones',200],['nata_ligera',40],
           ['parmesano',12],['cebolla',50],['aove',10]],
       nota:'No hace falta arroz arborio: con el redondo normal y removiendo sale cremoso.'},
      {id:'CL', n:'Gambas al ajillo con arroz',
       it:[['gambas',165],['arroz',60],['ajo',8],['verdura_cong',150],['aove',25]],
       nota:'Los 25 g de aceite son parte del plato, no un extra: es donde se cocina el ajo y lo que hace la salsa. Aceite a fuego medio, ajo laminado hasta que empiece a dorar, gambas 2 min y fuera.'}
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

/* ═══════════════════ LISTA DE LA COMPRA ═══════════════════
   sec    = sección del supermercado, para ordenar la lista
   factor = multiplicador de gramos del plan → gramos a comprar
            (ej. muslo de pollo: pesas 100 g sin hueso, compras 143 g con hueso)
   pack   = tamaño del envase en g/ml, para redondear hacia arriba
   ud     = peso de una pieza, para contar en unidades en lugar de gramos
   un     = etiqueta de la unidad de compra */

const SEC = ['Frutería y verdulería','Carnicería','Pescadería y congelados',
  'Huevos y lácteos','Panadería','Despensa','Aceites y frutos secos'];

const SHOP = {
  /* ── Frutería y verdulería ── */
  platano:       {sec:0, ud:120, un:'ud'},
  naranja:       {sec:0, ud:200, un:'ud'},
  manzana:       {sec:0, ud:180, un:'ud'},
  pepino:        {sec:0, ud:300, un:'ud'},
  patata:        {sec:0, un:'g', granel:true},
  boniato:       {sec:0, un:'g', granel:true},
  ensalada:      {sec:0, pack:250, un:'bolsas de 250 g'},
  pimiento_asado:{sec:0, pack:300, un:'frascos de 300 g'},

  /* ── Carnicería ── */
  muslo_pollo:   {sec:1, factor:1.43, un:'g con hueso', granel:true,
                  nota:'Jamoncitos o muslos con hueso. Deshuesar en casa: 10 min por tanda y sale a 2,29 €/100 g de proteína.'},
  pechuga_pollo: {sec:1, un:'g', granel:true},
  pavo_picado:   {sec:1, pack:500, un:'bandejas de 500 g'},
  ternera_5:     {sec:1, pack:500, un:'bandejas de 500 g'},
  jamon_cocido:  {sec:1, pack:200, un:'paquetes de 200 g'},

  /* ── Pescadería y congelados ── */
  merluza:       {sec:2, pack:700, un:'bolsas de 700 g (congelada)'},
  lubina:        {sec:2, un:'g', granel:true},
  salmon:        {sec:2, un:'g', granel:true,
                  nota:'Máximo 1 vez por semana: es el plato más caro del recetario.'},
  atun_natural:  {sec:2, ud:52, un:'latas',
                  nota:'52 g escurridos por lata. Compra el pack, sale más barato.'},
  verdura_cong:  {sec:2, pack:1000, un:'bolsas de 1 kg'},

  /* ── Huevos y lácteos ── */
  huevo:         {sec:3, ud:55, un:'huevos', pack_ud:12},
  claras:        {sec:3, pack:1000, un:'briks de 1 L'},
  queso_batido:  {sec:3, pack:500, un:'envases de 500 g'},
  skyr:          {sec:3, pack:450, un:'envases de 450 g'},
  yogur_griego0: {sec:3, pack:500, un:'packs de 4×125 g'},
  leche_desn:    {sec:3, pack:1000, un:'litros'},
  queso_havarti: {sec:3, pack:200, un:'paquetes de 200 g'},

  /* ── Panadería ── */
  pan_integral:  {sec:4, pack:400, un:'barras de 400 g'},
  pan_molde_int: {sec:4, pack:460, un:'bolsas de 460 g'},
  pan_pita:      {sec:4, pack:320, un:'paquetes de 4'},

  /* ── Despensa ── */
  arroz:         {sec:5, pack:1000, un:'kg'},
  pasta:         {sec:5, pack:500, un:'paquetes de 500 g'},
  garbanzos_bote:{sec:5, ud:250, un:'botes',
                  nota:'250 g escurridos por bote de 400 g.'},
  alubias_bote:  {sec:5, ud:250, un:'botes'},
  tortitas_arroz:{sec:5, pack:130, un:'paquetes de 130 g'},
  tomate_frito:  {sec:5, pack:400, un:'briks de 400 g'},
  miel:          {sec:5, pack:500, un:'tarros de 500 g'},

  /* ── Aceites y frutos secos ── */
  aove:          {sec:6, pack:1000, un:'litros'},
  nueces:        {sec:6, pack:200, un:'paquetes de 200 g'},

    /* ── Frutería ── */
  cebolla:         {sec:0, un:'g', granel:true},
  ajo:             {sec:0, pack:100, un:'cabezas'},
  zanahoria:       {sec:0, un:'g', granel:true},
  pimiento_verde:  {sec:0, un:'g', granel:true},
  champinones:     {sec:0, pack:250, un:'bandejas de 250 g'},
  calabacin:       {sec:0, un:'g', granel:true},
  jengibre:        {sec:0, pack:100, un:'trozos'},

  /* ── Carnicería ── */
  lomo_cerdo:      {sec:1, un:'g', granel:true},

  /* ── Congelados ── */
  espinacas:       {sec:2, pack:400, un:'bolsas de 400 g'},

  /* ── Lácteos ── */
  parmesano:       {sec:3, pack:150, un:'cuñas de 150 g'},
  mozzarella:      {sec:3, pack:125, un:'bolas de 125 g'},
  nata_ligera:     {sec:3, pack:200, un:'briks de 200 ml'},

  /* ── Despensa ── */
  salsa_soja:      {sec:5, pack:150, un:'botellas de 150 ml'},
  leche_coco:      {sec:5, pack:400, un:'latas de 400 ml'},
  curry_polvo:     {sec:5, pack:50,  un:'botes'},
  noodles:         {sec:5, pack:250, un:'paquetes de 250 g'},
  tomate_triturado:{sec:5, pack:400, un:'briks de 400 g'},
  pesto:           {sec:5, pack:190, un:'tarros de 190 g'},
  panko:           {sec:5, pack:200, un:'paquetes de 200 g'},
  harina:          {sec:5, pack:1000,un:'kg'},
  maiz_dulce:      {sec:5, pack:150, un:'latas de 150 g'},

  /* ── Frutos secos ── */
  sesamo:          {sec:6, pack:150, un:'paquetes de 150 g'},

  gambas:          {sec:2, pack:400,  un:'bolsas de 400 g (peladas, congeladas)'},
  guisantes:       {sec:2, pack:1000, un:'bolsas de 1 kg'}
};

/* Extras que no salen del menú pero hay que comprar igual */
const SHOP_FIJOS = [
  {sec:5, n:'Café', cant:'1 paquete'},
  {sec:5, n:'Sal, especias, vinagre', cant:'según necesites'},
  {sec:6, n:'Aceite de girasol (para cocinar)', cant:'opcional, abarata el AOVE'}
];