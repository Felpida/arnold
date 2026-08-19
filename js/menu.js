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
  guisantes:     {n:'Guisantes congelados',         m:'Hacendado', kcal:81, p:5.4, c:14,  g:0.4, fib:5},
  verdura_fresca:{n:'Verdura fresca de salteado (calabacín, zanahoria, cebolla, pimiento)',
                  m:'—', kcal:30, p:1.0, c:6.7, g:0.2, fib:1.8,
                  nota:'Mezcla a partes iguales. Cortar en la sesión de batch cooking: aguanta 3-4 días.'},
  brocoli:       {n:'Brócoli fresco', m:'—', kcal:34, p:2.8, c:7, g:0.4, fib:2.6,
                  nota:'Peso ya limpio, sin tronco. Al comprar, cuenta ~25 % de merma.'}
};

/* Alimentos vetados. La app los bloquea al escanear o al añadir a una receta. */
const FOOD_VETO = ['chocolate','alcachofa','bollería','dulces','quinoa','chía','coliflor',
  'avena','muesli','cereales de desayuno','aguacate','cuscús','sémola','mermelada', 'tortitas de arroz'];

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
      {id:'D4', n:'Yogur griego con pan, miel y plátano',
       it:[['yogur_griego0',300],['pan_integral',40],['miel',12],['platano',120],['nueces',10]]}
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
       nota:'Al horno o freidora de aire, no frito: mismo panko crujiente con una fracción del aceite.',
       prep:{t:'30 min', dif:'Media',
         ut:['Horno o freidora de aire','Bandeja con rejilla','3 platos hondos','Mazo de cocina o rodillo','Cazo'],
         pasos:[
           'Precalienta el horno a 200 °C, calor arriba y abajo.',
           'Abre la pechuga por la mitad a lo largo y aplánala con el mazo hasta dejarla de 1 cm. Es lo que consigue que se haga por dentro antes de quemarse por fuera.',
           'Prepara tres platos: harina en el primero, huevo batido en el segundo, panko en el tercero.',
           'Sal y pimienta al pollo. Pásalo por harina sacudiendo el exceso, luego por huevo, y por último presiónalo bien contra el panko por las dos caras.',
           'Ponlo en la rejilla sobre la bandeja, para que circule el aire por debajo. Pincela o rocía con la mitad del aceite.',
           'Al horno 9 minutos. Dale la vuelta, pincela con el resto del aceite y 9 minutos más.',
           'Mientras: arroz al agua con sal (50 g en crudo, 15 min) y la verdura al vapor o salteada 6-8 min.',
           'Corta el pollo en tiras de 2 cm antes de servir.'],
         tip:'La rejilla no es opcional. Sobre la bandeja lisa, el panko de la cara inferior se humedece y pierdes la mitad del crujiente.'}},

      {id:'C8', n:'Ternera con soja y miel y arroz',
       it:[['ternera_5',150],['salsa_soja',20],['miel',12],['arroz',60],
           ['cebolla',50],['pimiento_verde',80],['zanahoria',50],['aove',12],['sesamo',5]],
       prep:{t:'25 min', dif:'Fácil',
         ut:['Sartén amplia o wok','Cazo','Tabla y cuchillo','Bol pequeño'],
         pasos:[
           'Pon el arroz a cocer (60 g en crudo, 15 min).',
           'Corta la cebolla en juliana, el pimiento en tiras y la zanahoria en bastones finos o rodajas al sesgo.',
           'Mezcla en el bol la salsa de soja con la miel. Reserva.',
           'Sartén a fuego fuerte con la mitad del aceite. Echa la ternera y NO la toques durante 90 segundos: deja que se dore. Después deshaz los grumos y termina de hacerla. Retírala a un plato.',
           'Con el resto del aceite y la sartén todavía fuerte: zanahoria 2 min, añade cebolla 2 min, añade pimiento 2 min. Que queden al dente.',
           'Devuelve la carne, BAJA a fuego medio y añade la mezcla de soja y miel. Remueve 60-90 segundos hasta que espese y lo glasee todo.',
           'Fuera del fuego, sésamo por encima. Sirve sobre el arroz.'],
         tip:'La soja y la miel entran al final y a fuego medio. Si las echas antes o con la sartén al máximo, la miel se quema y amarga el plato entero.'}},

      {id:'C9', n:'Pollo teriyaki con noodles',
       it:[['muslo_pollo',150],['salsa_soja',20],['miel',10],['noodles',55],
           ['verdura_cong',200],['jengibre',5],['aove',10],['sesamo',5]],
       prep:{t:'25 min', dif:'Fácil',
         ut:['Sartén amplia o wok','Olla','Rallador fino','Bol pequeño'],
         pasos:[
           'Ralla el jengibre y mézclalo en el bol con la soja y la miel.',
           'Corta el muslo en trozos de 3 cm.',
           'Sartén a fuego fuerte con el aceite. Dora el pollo 5-6 min sin moverlo demasiado, hasta que tenga costra. Retíralo.',
           'Echa la verdura congelada directamente, sin descongelar, 5-6 min a fuego fuerte y sin tapar, para que evapore el agua en lugar de cocerse.',
           'Aparta la verdura a un lado de la sartén y vierte la mezcla de soja, miel y jengibre en el hueco. Deja que borbotee 1-2 min hasta que se convierta en un jarabe.',
           'Devuelve el pollo y mézclalo todo con la salsa 1 minuto.',
           'Cuece los noodles según el paquete (3-4 min), escúrrelos y mézclalos en la sartén.',
           'Sésamo fuera del fuego.'],
         tip:'La verdura congelada suelta mucha agua. Fuego fuerte y sin tapar, o acabas cociéndola y queda blanda.'}},

      {id:'C10', n:'Curry de pollo con arroz',
       it:[['muslo_pollo',140],['leche_coco',80],['curry_polvo',8],['arroz',60],
           ['cebolla',60],['zanahoria',60],['espinacas',80],['aove',8]],
       prep:{t:'30 min', dif:'Fácil',
         ut:['Sartén honda o cazuela','Cazo','Tabla y cuchillo'],
         pasos:[
           'Arroz a cocer.',
           'Cebolla en dados pequeños, zanahoria en rodajas finas, muslo en trozos de 3 cm.',
           'Aceite a fuego medio. Añade el curry en polvo y tuéstalo 30 segundos removiendo, hasta que huela. Este paso cambia el plato por completo.',
           'Añade la cebolla y pochala 4-5 min. Después la zanahoria, 3 min más.',
           'Sube el fuego, añade el pollo y séllalo 4 min.',
           'Baja a fuego medio-bajo, añade la leche de coco y deja reducir 8-10 min destapado, removiendo de vez en cuando.',
           'Los últimos 2 minutos, las espinacas congeladas, removiendo hasta que se integren.',
           'Sal al final, nunca antes: la leche de coco reduce y concentra.'],
         tip:'Tostar el curry en el aceite antes de añadir nada más. Echado en seco o al final sabe a polvo; tostado sabe a curry.'}},

      {id:'C11', n:'Pasta a la boloñesa',
       it:[['pasta',60],['ternera_5',150],['tomate_triturado',150],['cebolla',50],
           ['zanahoria',50],['aove',10],['parmesano',10]],
       prep:{t:'35 min', dif:'Fácil',
         ut:['Sartén honda o cazuela','Olla','Rallador','Tabla y cuchillo'],
         pasos:[
           'Ralla la zanahoria y pica la cebolla muy fina.',
           'Aceite a fuego medio. Pocha cebolla y zanahoria 6-8 min, hasta que la cebolla esté transparente. No lo aceleres: aquí se construye el sabor.',
           'Sube el fuego, añade la ternera y dórala sin tocarla 2 minutos. Luego deshaz los grumos.',
           'Añade el tomate triturado, sal y pimienta. Fuego mínimo, 15-20 min destapado, removiendo de vez en cuando.',
           'Cuece la pasta 1 minuto menos de lo que diga el paquete. Reserva un vaso del agua de cocción ANTES de escurrir.',
           'Mezcla la pasta con la salsa en la sartén a fuego medio, con 2-3 cucharadas del agua de cocción. Un minuto removiendo.',
           'Parmesano rallado fuera del fuego.'],
         tip:'La zanahoria rallada en el sofrito es lo que da el dulzor. Sin ella la boloñesa sabe ácida y la gente lo compensa con azúcar, que aquí no queremos.'}},

      {id:'C12', n:'Pollo a la milanesa con pasta',
       it:[['pechuga_pollo',120],['panko',25],['huevo',25],['pasta',45],
           ['tomate_triturado',100],['ensalada',100],['aove',14],['parmesano',8]],
       prep:{t:'30 min', dif:'Media',
         ut:['Horno o freidora de aire','Bandeja con rejilla','2 platos hondos','Mazo o rodillo','Olla','Sartén pequeña'],
         pasos:[
           'Horno a 200 °C.',
           'Abre la pechuga y aplánala a 1 cm con el mazo.',
           'Bate el huevo en un plato. En otro, mezcla el panko con la MITAD del parmesano rallado y una pizca de sal.',
           'Pasa el pollo por huevo y luego por la mezcla de panko, presionando bien por las dos caras.',
           'Sobre la rejilla, pincela con la mitad del aceite. 9 min, vuelta, resto del aceite, 9 min más.',
           'Cuece la pasta. Aparte, calienta el tomate triturado 5 min con sal y orégano.',
           'Mezcla pasta y tomate. Sirve con el pollo en tiras, la ensalada aliñada y el resto del parmesano.'],
         tip:'El parmesano dentro del panko es lo que separa una milanesa de un empanado soso. Solo la mitad ahí: el resto va al plato.'}},

      {id:'C13', n:'Pasta al pesto con pollo',
       it:[['pasta',70],['muslo_pollo',140],['pesto',20],['calabacin',100],
           ['parmesano',10],['aove',5]],
       prep:{t:'25 min', dif:'Fácil',
         ut:['Sartén amplia','Olla','Tabla y cuchillo','Rallador'],
         pasos:[
           'Corta el muslo en tiras y el calabacín en medias lunas de medio centímetro.',
           'Pon la pasta a cocer.',
           'Sartén a fuego fuerte con el aceite. Dora el pollo 5-6 min. Retíralo.',
           'En la misma sartén, saltea el calabacín 4-5 min a fuego fuerte: dorado por fuera y firme por dentro.',
           'Escurre la pasta reservando medio vaso del agua de cocción.',
           'APAGA EL FUEGO. Añade pasta y pollo a la sartén, el pesto y 3-4 cucharadas del agua de cocción. Remueve hasta que quede una crema que envuelva la pasta.',
           'Parmesano por encima.'],
         tip:'El pesto no se cocina. Si lo calientas, la albahaca se oxida, amarga y pierde el color. Fuego apagado y el agua de cocción para emulsionarlo.'}},

      {id:'C14', n:'Bowl de pollo, maíz y alubias',
       it:[['arroz',55],['pechuga_pollo',130],['maiz_dulce',60],['pimiento_verde',80],
           ['cebolla',40],['alubias_bote',80],['aove',14]],
       prep:{t:'25 min', dif:'Fácil',
         ut:['Sartén','Cazo','Colador','Tabla y cuchillo'],
         pasos:[
           'Arroz a cocer. Escurre y enjuaga las alubias y el maíz.',
           'Pollo en dados de 2 cm, pimiento en tiras, cebolla en juliana fina.',
           'Sartén fuerte con la mitad del aceite. Sella el pollo 5-6 min con sal, pimienta y una pizca de pimentón. Retíralo.',
           'Con el resto del aceite: cebolla 2 min, pimiento 3 min. Que queden crujientes.',
           'Maíz y alubias solo 1-2 minutos, lo justo para templarlos. Las alubias ya están cocidas y se deshacen enseguida.',
           'Monta el tupper por capas: arroz abajo, verdura y legumbre en medio, pollo arriba.'],
         tip:'Se come frío o templado, así que es el mejor plato para llevar. Monta por capas y no lo mezcles: aguanta mucho mejor.'}},

      {id:'C15', n:'Arroz frito con gambas y huevo',
       it:[['arroz',60],['gambas',150],['huevo',55],['guisantes',60],['zanahoria',50],
           ['cebolla',40],['salsa_soja',15],['aove',10],['sesamo',4]],
       prep:{t:'20 min · requiere arroz del día anterior', dif:'Media',
         ut:['Wok o sartén grande','Espátula','Bol pequeño','Tabla y cuchillo','Papel de cocina'],
         pasos:[
           'IDEAL: arroz cocido el día anterior y guardado en nevera. Si lo haces al momento, cuécelo, extiéndelo en un plato y déjalo enfriar 20 min.',
           'Zanahoria en dados muy pequeños, cebolla picada fina. Seca las gambas con papel de cocina.',
           'Bate el huevo. Wok a fuego fuerte con un poco del aceite, cuájalo removiendo, sácalo y resérvalo.',
           'Más aceite, fuego máximo. Gambas 90 segundos por cada lado, no más. Fuera.',
           'Resto del aceite: zanahoria 2 min, cebolla 2 min, guisantes 2 min.',
           'Añade el arroz frío y aplástalo contra el fondo con la espátula, dejándolo quieto 30 segundos entre removidas. Eso es lo que le da el punto salteado.',
           'Devuelve huevo y gambas, añade la soja por el borde del wok y remueve todo 1 minuto.',
           'Sésamo fuera del fuego.'],
         tip:'Arroz del día anterior, sin excepción. El recién hecho tiene demasiada humedad y almidón: se empasta y sale un arroz con cosas, no un arroz frito.'}},

      {id:'C16', n:'Yakisoba de gambas',
       it:[['noodles',60],['gambas',160],['verdura_cong',200],['pimiento_verde',80],
           ['salsa_soja',18],['jengibre',5],['aove',16],['sesamo',5]],
       prep:{t:'20 min', dif:'Fácil',
         ut:['Wok o sartén grande','Olla','Rallador fino','Papel de cocina'],
         pasos:[
           'Seca bien las gambas con papel de cocina. El agua es lo que impide que se doren.',
           'Ralla el jengibre. Corta el pimiento en tiras finas.',
           'Pon agua a hervir para los noodles, pero no los cuezas todavía.',
           'Wok a fuego máximo con un tercio del aceite. Gambas 90 segundos por lado y fuera: se terminarán al final.',
           'Más aceite. Verdura congelada 5-6 min a fuego fuerte sin tapar. Añade el pimiento 2 min.',
           'Ahora sí, cuece los noodles (3-4 min) y escúrrelos.',
           'Todo al wok: noodles, gambas, jengibre y la soja vertida por el borde. Remueve 1 minuto a fuego fuerte.',
           'Sésamo al servir.'],
         tip:'Las gambas se hacen en 3 minutos en total. Si las dejas con el resto desde el principio salen gomosas. Entran, salen, y vuelven al final.'}}
    ]},

  /* ─────── PRE-ENTRENO · 17:00 ─────── */
  pre:{hora:'17:00', n:'Pre-entreno', obj:{kcal:302,p:20,c:59,g:2},
    nota:'30-45 min antes de entrenar. Grasa casi nula A PROPÓSITO: retrasaría la digestión. Estos hidratos son los que alimentan una sesión de 95 min — no se recortan nunca.',
    op:[
      {id:'P1', n:'Plátano, pan con miel y queso batido', base:true,
       it:[['platano',120],['pan_integral',45],['queso_batido',150],['miel',8]]},
      {id:'P2', n:'Pan con miel y skyr',
       it:[['platano',120],['pan_integral',35],['miel',12],['skyr',150]]},
      {id:'P3', n:'Dos plátanos y queso batido',
       it:[['platano',240],['queso_batido',200]],
       nota:'La más rápida: cero preparación.'},
      {id:'P4', n:'Manzana, pan con miel y queso batido',
       it:[['manzana',180],['pan_integral',50],['queso_batido',180],['miel',10]]}
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
       it:[['patata',250],['huevo',165],['claras',100],['ensalada',150],['aove',14]],
       prep:{t:'30 min', dif:'Media',
         ut:['Sartén antiadherente de 20-22 cm','Plato llano para dar la vuelta','Bol grande','Espumadera'],
         pasos:[
           'Pela la patata y córtala en rodajas finas de 2-3 mm. Sálalas en un bol.',
           'Sartén a fuego medio-bajo con el aceite. Pocha la patata 12-15 min removiendo de vez en cuando. NO debe dorarse: debe quedar tierna. Está lista cuando se aplasta con la espumadera sin resistencia.',
           'Bate el huevo entero con las claras y sal en el bol grande.',
           'Escurre la patata del aceite y échala al huevo batido. Deja reposar 5 MINUTOS.',
           'Vuelve a la sartén a fuego medio con una gota del aceite escurrido. Vierte la mezcla y cuaja 3-4 min separando los bordes con la espumadera.',
           'Tapa con el plato, dale la vuelta con decisión y cuaja 2-3 min más.',
           'Sirve con la ensalada aliñada.'],
         tip:'Los 5 minutos de reposo de la patata dentro del huevo son lo que diferencia una tortilla jugosa y ligada de una tortilla con patatas dentro.'}},
      {id:'CF', n:'Salmón con patata',
       it:[['patata',280],['salmon',140],['verdura_cong',150],['aove',6]],
       nota:'Máximo 1 vez por semana: es el plato más caro del recetario.'},
      {id:'CG', n:'Pasta con atún',
       it:[['pasta',65],['atun_natural',120],['verdura_cong',150],['tomate_frito',40],['aove',16]]},
      {id:'CH', n:'Salteado de cerdo con arroz',
       it:[['lomo_cerdo',130],['arroz',60],['verdura_cong',200],['salsa_soja',15],
           ['ajo',5],['aove',14],['sesamo',4]],
       prep:{t:'20 min', dif:'Fácil',
         ut:['Sartén grande o wok','Cazo','Tabla y cuchillo'],
         pasos:[
           'Arroz a cocer.',
           'Corta el lomo en tiras finas de medio centímetro, CONTRA la fibra. Lamina el ajo.',
           'Sartén a fuego muy fuerte con la mitad del aceite. Echa el cerdo en DOS TANDAS de 2 min cada una. Retíralo.',
           'Resto del aceite, fuego fuerte. Ajo laminado 30 segundos, sin que se queme.',
           'Verdura congelada 5-6 min sin tapar, fuego fuerte.',
           'Devuelve el cerdo, añade la soja por el borde de la sartén y remueve 1 minuto.',
           'Sésamo y sirve sobre el arroz.'],
         tip:'Dos tandas, no una. Si abarrotas la sartén, se enfría y el cerdo cuece en su jugo: es la diferencia entre un salteado y un guiso. Y corta contra la fibra o queda duro.'}},

      {id:'CJ', n:'Lasaña de calabacín y ternera',
       it:[['ternera_5',100],['calabacin',250],['tomate_triturado',150],['mozzarella',40],
           ['patata',200],['aove',12],['parmesano',8]],
       prep:{t:'50 min', dif:'Media-alta',
         ut:['Horno','Fuente para horno','Sartén','Mandolina o cuchillo bien afilado','Papel de cocina'],
         pasos:[
           'Horno a 190 °C.',
           'Corta el calabacín a lo largo en láminas de 3 mm. Extiéndelas sobre papel de cocina, sal por encima, y déjalas 10 minutos. Después sécalas bien.',
           'Corta la patata en rodajas de 3 mm y dales 6 min de microondas, o cuécelas 8 min. Tienen que quedar casi hechas: en el horno no se cocinan solas.',
           'Sartén con la mitad del aceite. Dora la ternera 3-4 min, añade el tomate triturado, sal, pimienta y orégano, y reduce 8 min a fuego bajo.',
           'Monta en la fuente: base de patata, mitad de la carne, capa de calabacín, resto de la carne, otra capa de calabacín.',
           'Mozzarella en trozos y parmesano rallado por encima. Riega con el resto del aceite.',
           'Horno 25 min. Los últimos 5 con gratinador si lo tienes.',
           'Deja reposar 10 minutos antes de cortar, o se desmonta.'],
         tip:'El paso de la sal en el calabacín no se salta. Sin él suelta toda el agua dentro del horno y acabas con una sopa en la fuente.'}},

      {id:'CK', n:'Risotto de champiñones con pollo',
       it:[['arroz',60],['muslo_pollo',115],['champinones',200],['nata_ligera',40],
           ['parmesano',12],['cebolla',50],['aove',10]],
       prep:{t:'35 min', dif:'Media',
         ut:['Sartén honda o cazuela ancha','Cazo para el caldo','Cucharón','Tabla y cuchillo','Rallador'],
         pasos:[
           'Pon medio litro de agua o caldo a calentar en el cazo y mantenlo CALIENTE todo el rato.',
           'Cebolla picada muy fina. Champiñones en láminas. Muslo en trozos de 2 cm.',
           'Sartén con la mitad del aceite a fuego fuerte. Dora el pollo 5 min y retíralo.',
           'Resto del aceite, fuego fuerte. Champiñones sin remover 2 min, luego 4 min salteando hasta que estén dorados y hayan evaporado el agua. Retira la mitad y resérvala.',
           'Baja a fuego medio. Pocha la cebolla 4 min con los champiñones que quedan.',
           'Añade el arroz en seco y remueve 1 minuto para que se nacare.',
           'Añade el caldo caliente cucharón a cucharón, removiendo, y no eches el siguiente hasta que haya absorbido el anterior. Unos 18 minutos en total.',
           'Fuera del fuego: nata, parmesano, el pollo y los champiñones reservados. Remueve fuerte 30 segundos y reposa 2 min tapado.'],
         tip:'No hace falta arroz arborio: el redondo normal suelta almidón de sobra si remueves. Lo que no se puede saltar es el caldo caliente y añadido poco a poco.'}},
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
  guisantes:       {sec:2, pack:1000, un:'bolsas de 1 kg'},
  verdura_fresca:  {sec:0, un:'g', granel:true,
                    nota:'Reparte a partes iguales entre calabacín, zanahoria, cebolla y pimiento.'},
  brocoli:         {sec:0, factor:1.33, un:'g con tronco', granel:true}
};

/* Extras que no salen del menú pero hay que comprar igual */
const SHOP_FIJOS = [
  {sec:5, n:'Café', cant:'1 paquete'},
  {sec:5, n:'Sal, especias, vinagre', cant:'según necesites'},
  {sec:6, n:'Aceite de girasol (para cocinar)', cant:'opcional, abarata el AOVE'}
];