'use strict';

/* ═══════════════════ BASE DE ALIMENTOS ═══════════════════
   Todos los valores POR 100 g (o 100 ml en líquidos).
   Carnes, pescados, arroz y pasta: valores EN CRUDO.
   ud = peso de una unidad comestible, para poder contar en piezas.
   Esta tabla es la fuente única de verdad: los macros del menú se
   calculan desde aquí, nunca se escriben a mano. */
const FOODS = {

  /* ── Lácteos y huevo ──
     SKYR RETIRADO (19/08/2026, decisión del usuario). Su hueco lo cubre
     yogur_griego0, que ya estaba en la lista: cero líneas nuevas de compra. */
  queso_batido:  {n:'Queso batido 0 %',            m:'Hacendado', kcal:47,  p:10.5, c:4,    g:0.2,  fib:0},
  queso_cottage: {n:'Queso cottage',               m:'Hacendado', kcal:98,  p:11.5, c:3.5,  g:4.3,  fib:0,
                  nota:'11,7 g P/100 kcal: la mitad de densidad proteica que el queso batido (22,3). ' +
                       'Protagonista del desayuno por preferencia, no por eficiencia. Verificar etiqueta.'},
  yogur_griego0: {n:'Yogur griego 0 %',            m:'Hacendado', kcal:57,  p:10,   c:3.6,  g:0.4,  fib:0},
  leche_desn:    {n:'Leche desnatada',             m:'Hacendado', kcal:33,  p:3.3,  c:4.8,  g:0.1,  fib:0},
  huevo:         {n:'Huevo fresco',                m:'—',         kcal:143, p:12.6, c:0.7,  g:9.5,  fib:0, ud:55},
  claras:        {n:'Claras pasteurizadas',        m:'Hacendado', kcal:48,  p:11,   c:0.7,  g:0.2,  fib:0},
  queso_havarti: {n:'Queso havarti en lonchas',    m:'Hacendado', kcal:370, p:24,   c:0,    g:30,   fib:0},

  /* ── Carnes ──
     PICADA DE PAVO Y DE TERNERA RETIRADAS. Verificado en Mercadona:
     la de pavo no existe; la de ternera sale a 5,40 €/100 g de proteína y
     las "picadas" son preparado de carne (90 % carne + agua, fibra de
     guisante, maíz y sulfitos E-221). Su papel lo hacen los taquitos de cerdo. */
  muslo_pollo:   {n:'Muslo de pollo sin piel',     m:'—', kcal:130, p:20,   c:0, g:5.5, fib:0,
                  nota:'Comprar con hueso: 2,23 €/100 g de proteína (cuartos traseros), la más barata junto al lomo.'},
  pechuga_pollo: {n:'Pechuga de pollo',            m:'—', kcal:110, p:23,   c:0, g:1.8, fib:0},
  taquitos_cerdo:{n:'Taquitos de cerdo (magro)',   m:'Hacendado', kcal:135, p:21, c:0, g:5, fib:0,
                  nota:'2,52 €/100 g de proteína. Si te cansas de ellos, el lomo en pieza cortado en dados ' +
                       'es más barato (2,25 €) y menos grasa. Máximo 1 de los 2 tuppers de cada tanda.'},
  jamon_cocido:  {n:'Jamón cocido extra',          m:'Hacendado', kcal:105, p:19, c:1, g:2.5, fib:0},

  /* ── Pescados ── */
  merluza:       {n:'Merluza / pescadilla congelada', m:'Hacendado', kcal:72, p:16, c:0, g:0.8, fib:0,
                  nota:'CONGELADA: 3,28 €/100 g de proteína y 22,2 g P/100 kcal, de lo mejor del catálogo. ' +
                       'Va solo en cenas (CB, CN, CP), nunca en tupper. Sácala del congelador por la mañana ' +
                       'y descongélala en la nevera. Y SÉCALA con papel antes de cocinar: el agua que retiene ' +
                       'es lo que arruina el pescado congelado.'},
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
  pasta_integral:{n:'Pasta integral',              m:'Hacendado', kcal:350, p:13,  c:63, g:2.5, fib:8,
                  nota:'8 g de fibra por 100 g frente a 3 de la normal. Sin avena en la dieta, es el cambio ' +
                       'más rentable para sostener los 30-40 g de fibra diarios.'},
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
  /* LECHE DE COCO RETIRADA (decisión del usuario). El curry C4 va con nata_ligera,
     que ya se compra para el risotto CK: un solo brik cubre los dos platos.
     Leche evaporada y crema de soja quedan pendientes de verificar etiqueta y precio. */
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
                  nota:'DENSIDAD BUENA: 21,2 g P/100 kcal, por encima del muslo de pollo (15,4) y del lomo ' +
                       '(16,9). PRECIO SIN VERIFICAR: no está en la tabla de Mercadona del 19/08/2026. ' +
                       'La cifra de ~5,50 €/100 g de proteína que había aquí era una estimación, no un dato. ' +
                       'Si se confirma, sería la segunda proteína más cara del catálogo tras el atún (5,80) ' +
                       'y hay que limitarla a 1 tanda por rotación. COMPRUÉBALO EN TIENDA.'},
  guisantes:     {n:'Guisantes congelados',         m:'Hacendado', kcal:81, p:5.4, c:14,  g:0.4, fib:5},
  verdura_fresca:{n:'Verdura fresca de salteado (calabacín, zanahoria, cebolla, pimiento)',
                  m:'—', kcal:30, p:1.0, c:6.7, g:0.2, fib:1.8,
                  nota:'Mezcla a partes iguales. Cortar en la sesión de batch cooking: aguanta 3-4 días.'},
  brocoli:       {n:'Brócoli fresco', m:'—', kcal:34, p:2.8, c:7, g:0.4, fib:2.6,
                  nota:'Peso ya limpio, sin tronco. Al comprar, cuenta ~25 % de merma.'},
  salsa_worcester:{n:'Salsa Worcestershire (Perrins)', m:'—', kcal:78, p:0.4, c:19, g:0, fib:0},
  maicena:       {n:'Maicena (almidón de maíz)',   m:'Hacendado', kcal:350, p:0.5, c:85,  g:0.1, fib:0},
  aceite_sesamo: {n:'Aceite de sésamo',            m:'—', kcal:900, p:0,   c:0,   g:100, fib:0,
                  nota:'Aromático, no de cocinar: se usa en frío y al final, 3-5 g.'},
  vinagre:       {n:'Vinagre de vino o de manzana',m:'Hacendado', kcal:20, p:0, c:0.6, g:0, fib:0},
  limon:         {n:'Zumo de limón o lima',        m:'—', kcal:22, p:0.4, c:6.9, g:0.2, fib:0.3},
  vino_blanco:   {n:'Vino blanco (para cocinar)',  m:'—', kcal:83, p:0.1, c:2.6, g:0, fib:0,
                  nota:'Contado sin descontar el alcohol que evapora al reducir: sobrestima ~15 kcal por ración.'},
  caldo_pollo:   {n:'Caldo de pollo',              m:'Hacendado', kcal:6, p:1, c:0.5, g:0.2, fib:0}                  
};

/* Alimentos vetados. La app los bloquea al escanear o al añadir a una receta. */
const FOOD_VETO = ['chocolate','alcachofa','bollería','dulces','quinoa','chía','coliflor',
  'avena','muesli','cereales de desayuno','aguacate','cuscús','sémola','mermelada', 'tortitas de arroz'];

/* Tomate natural: permitido pero desaconsejado por preferencia. Aviso, no bloqueo. */
const FOOD_WARN = {tomate_natural:'Preferencia: tomate natural muy poco o nada.'};

/* ═══════════════════ SALSAS ═══════════════════
   Se preparan una vez y duran varios usos. `para` lista los platos
   con los que encajan. Los macros se SUMAN al plato sin modificarlo:
   las siete caben dentro o al borde de la tolerancia del ±10 %. */
const SAUCES = {

  /* SIN MIEL. Reformulada: el tomate frito sube de 60 a 70 g y el dulzor lo
     pone la Worcestershire, que trae 19 g de HC por 100 g. Baja de 28 a 20 kcal
     por ración y pierde 0,3 g de proteína. Funciona igual en el katsu. */
  tonkatsu:{n:'Salsa tonkatsu', cocina:'Japonesa', raciones:4, sin_miel:true,
    it:[['tomate_frito',70],['salsa_soja',20],['salsa_worcester',15]],
    para:['C3','C7'],
    conserva:'2 semanas en nevera, en tarro cerrado',
    prep:{t:'5 min', dif:'Muy fácil', ut:['Bol','Varillas o tenedor','Tarro con tapa'],
      pasos:[
        'Mezcla en el bol el tomate frito, la soja y la Worcestershire.',
        'Bate hasta que quede homogéneo.',
        'Prueba: si te sabe plana, un chorro más de Worcestershire, que es de donde sale el dulzor ahora que no hay miel. Si muy fuerte, más tomate frito.',
        'Al tarro. No necesita cocción.'],
      tip:'La versión sin miel necesita la Worcestershire completa: es el único ingrediente dulce que queda. No la recortes.'}},

  /* CONSERVA LA MIEL. Es soja + dulce + espesante: sin el dulce no hay teriyaki,
     y en §7 no existe azúcar, mirin ni sirope que la sustituya. Si la miel sale
     también de aquí, esta salsa y la asiática desaparecen del catálogo. */
  teriyaki:{n:'Salsa teriyaki', cocina:'Japonesa', raciones:4, con_miel:true,
    it:[['salsa_soja',40],['miel',24],['jengibre',8],['maicena',4]],
    para:['C3','C7','C8','CH'],
    conserva:'1 semana en nevera. Espesa en frío: templa antes de usar',
    prep:{t:'8 min', dif:'Fácil', ut:['Cazo pequeño','Rallador fino','Cuchara'],
      pasos:[
        'Ralla el jengibre muy fino.',
        'En el cazo, mezcla soja, miel y jengibre. Fuego medio.',
        'Disuelve la maicena en una cucharada de agua FRÍA aparte, y añádela cuando empiece a borbotear.',
        'Remueve 1-2 minutos hasta que espese y cubra el dorso de la cuchara.',
        'Fuera del fuego. Espesará más al enfriarse.'],
      tip:'La maicena siempre se disuelve en agua fría antes de entrar. En polvo sobre líquido caliente hace grumos que ya no se van.'}},

  /* CONSERVA LA MIEL: lo dice el nombre. Muere si la miel sale del todo. */
  asiatica:{n:'Salsa asiática de miel y ajo', cocina:'Asiática', raciones:4, con_miel:true,
    it:[['salsa_soja',45],['miel',25],['ajo',10],['maicena',5]],
    para:['C3','C7','C8','CH','A4'],
    conserva:'1 semana en nevera',
    prep:{t:'8 min', dif:'Fácil', ut:['Cazo pequeño','Prensa de ajo','Cuchara'],
      pasos:[
        'Pica o machaca el ajo muy fino. Que no queden trozos: al reducir se amargan.',
        'Cazo a fuego medio-bajo con un hilo de aceite. Sofríe el ajo 30-40 segundos SIN que coja color.',
        'Añade la soja y la miel. Remueve y deja que borbotee suave.',
        'Disuelve la maicena en una cucharada de agua fría y añádela. Remueve 1-2 min hasta que espese.',
        'Fuera del fuego.'],
      tip:'El ajo dorado amarga toda la salsa. En cuanto huela y antes de que coja color, entra el líquido.'}},

  yogur_ajo:{n:'Salsa de yogur y ajo', cocina:'Mediterránea', raciones:4,
    it:[['yogur_griego0',160],['ajo',6],['limon',10],['aove',5]],
    para:['C3','C7','C10','CB','CE'],
    conserva:'4 días en nevera',
    prep:{t:'5 min', dif:'Muy fácil', ut:['Bol','Prensa de ajo o rallador','Cuchara'],
      pasos:[
        'Machaca o ralla el ajo muy fino. En trozos, el picor se concentra en un bocado.',
        'Mezcla el yogur con el ajo, el zumo de limón y el aceite.',
        'Sal, pimienta y perejil picado si tienes.',
        'Reposa 15 minutos en nevera: el ajo necesita ese tiempo para integrarse.'],
      tip:'La única que SUMA proteína: +4 g por ración. La que menos descuadra la dieta.'}},

  argelina:{n:'Salsa argelina ligera', cocina:'Magrebí', raciones:4,
    it:[['yogur_griego0',120],['tomate_frito',60],['ajo',4],['aove',8]],
    para:['C3','C7','C8','CE'],
    conserva:'4 días en nevera',
    prep:{t:'5 min', dif:'Muy fácil', ut:['Bol','Prensa de ajo','Varillas'],
      pasos:[
        'Mezcla el yogur con el tomate frito hasta un naranja uniforme.',
        'Añade el ajo machacado, el aceite, una cucharadita de pimentón dulce, media de comino y cayena al gusto.',
        'Bate bien y reposa 20 minutos.'],
      tip:'Base de yogur en lugar de mayonesa. La original tiene el triple de calorías; esta te deja el sabor por 49 kcal.'}},

  /* SIN MIEL. Sobrevive sin retocar nada más: los 6 g de miel eran 19 kcal
     de 200. Queda más punzante, que en un aliño de vinagre no es un problema. */
  soja_sesamo:{n:'Aliño de soja y sésamo', cocina:'Asiática', raciones:4, sin_miel:true,
    it:[['salsa_soja',40],['aceite_sesamo',12],['vinagre',15],['sesamo',8]],
    para:['C8','CH','A4'],
    conserva:'2 semanas en nevera. Agitar antes de usar',
    prep:{t:'5 min', dif:'Muy fácil', ut:['Tarro con tapa','Sartén pequeña'],
      pasos:[
        'Tuesta el sésamo en la sartén sin aceite, 2 minutos a fuego medio removiendo. Cuando salte y huela, fuera.',
        'Todos los ingredientes al tarro, tapa y agita 20 segundos.',
        'Se separa al reposar: agita antes de cada uso.'],
      tip:'Sin la miel queda más ácido. Si te resulta agresivo, baja el vinagre de 15 a 10 g antes de pensar en volver a endulzarlo.'}},

  espanola:{n:'Salsa española', cocina:'Española', raciones:6,
    it:[['cebolla',150],['pimiento_verde',150],['zanahoria',160],['vino_blanco',150],
        ['harina',10],['caldo_pollo',500],['aove',12]],
    para:['C1','C7','C9','C10','CA','CB','CH'],
    conserva:'5 días en nevera · 3 meses congelada en porciones',
    prep:{t:'45 min', dif:'Media', ut:['Cazuela','Batidora de mano','Tabla y cuchillo','Colador (opcional)'],
      pasos:[
        'Corta cebolla, pimiento y zanahorias en trozos medianos. No hace falta finura: se va a triturar.',
        'Aceite en la cazuela a fuego medio. Pocha la cebolla 6-8 min hasta transparente.',
        'Añade pimiento y zanahoria y sofríe 8-10 min más. Que la verdura coja algo de color: ahí está el sabor.',
        'Espolvorea la harina y remueve 1-2 minutos para tostarla. Si no la tuestas, la salsa sabrá a crudo.',
        'Añade el vino y sube el fuego. Reduce 3-4 minutos hasta que se vaya el olor a alcohol.',
        'Añade el caldo, sal, pimienta y una hoja de laurel. Fuego bajo, 20 minutos destapado.',
        'Retira el laurel y tritura hasta que quede fina. Si la quieres de restaurante, pásala por el colador.',
        'Si queda espesa, más caldo. Si clara, 5 minutos más al fuego.'],
      tip:'Los dos minutos de tostado de la harina son el paso que no se salta. Es lo que separa una salsa española de un puré de verduras.'}}
};

/* ═══════════════════ COMIDAS Y EQUIVALENCIAS ═══════════════════
   Cada franja tiene un objetivo de macros (obj) y un catálogo de platos.
   it  = [idAlimento, gramos] · gramaje EN CRUDO para carnes, pescados,
         arroz y pasta.
   pro = claves de proteína del plato. Regla §8.2: el almuerzo y la comida
         del mismo día NO pueden compartir clave. Muslo y pechuga son
         claves distintas; taquitos y lomo también.
   min = minutos de elaboración (solo cenas: entre semana el techo son 30).
   leg = cuenta como ración de legumbre.

   REVISIÓN 20/08/2026 — reescrito por completo. Cambios:
   · Skyr fuera de todo el catálogo.
   · Desayunos simplificados a 4-5 ingredientes, con el cottage como
     lácteo protagonista en 4 de los 5 y yogur griego en el alterno.
   · Miel fuera de los tres pre-entrenos (compensada con pan).
   · Curry con nata ligera en lugar de leche de coco.
   · Objetivos por franja recalibrados: la tabla antigua sumaba 2.565 kcal
     y 172 g de proteína frente a un objetivo de 2.548 y 162. Ese exceso de
     10 g de proteína, más el que arrastraba cada plato, ponía los días
     reales en ~182 g y era la causa del volumen de los tuppers.
   · Volúmenes recortados: la media de las comidas baja de ~523 a ~486 g
     de plato cocinado, y los tres peores (C1, C2, C9) entre 62 y 82 g. */

const MEALS = {

  /* ─────── DESAYUNO · 07:00 ─────── */
  desayuno:{hora:'07:00', n:'Desayuno', obj:{kcal:500,p:33,c:70,g:12},
    nota:'Simple y sin báscula de precisión: un lácteo, pan, fruta y nueces. Solo D3 se cocina. ' +
         'El cottage no puede ser la única proteína del desayuno: con 11,7 g P/100 kcal harían falta ' +
         '230 g para 33 g de proteína y ya no cabrían los 70 g de hidratos. Va siempre con un compañero magro.',
    op:[
      {id:'D1', n:'Cottage y queso batido con plátano', base:true,
       it:[['queso_cottage',130],['queso_batido',90],['pan_integral',75],['platano',120],['nueces',8]]},
      {id:'D2', n:'Yogur griego con manzana',
       it:[['yogur_griego0',220],['pan_integral',80],['manzana',180],['nueces',14]],
       nota:'El día alterno, sin cottage. Es el desayuno que empareja con las cenas CL y CM, que llevan 50 g.'},
      {id:'D3', n:'Revuelto de claras con cottage',
       it:[['claras',110],['queso_cottage',130],['pan_integral',85],['naranja',200],['aove',4]],
       nota:'El salado. 6 min de sartén: las claras a fuego medio y el cottage fuera del fuego, al final.'},
      {id:'D4', n:'Sándwich de jamón y cottage',
       it:[['pan_molde_int',90],['queso_cottage',120],['jamon_cocido',40],['platano',120],['nueces',6]]},
      {id:'D5', n:'Cottage con huevo y pan',
       it:[['pan_integral',90],['huevo',55],['queso_cottage',140],['platano',100]],
       nota:'El más simple del catálogo: 4 ingredientes. La grasa del cottage sustituye a las nueces.'}
    ]},

  /* ─────── ALMUERZO · 10:45 · TUPPER ─────── */
  almuerzo:{hora:'10:45', n:'Almuerzo (tupper)', obj:{kcal:505,p:32,c:60,g:16},
    nota:'Tupper, se calienta en microondas o se come templado. SIN FRUTA (§4). ' +
         'Aguanta 3 días en nevera: es el mismo plato los tres días de cada tanda.',
    op:[
      {id:'A1', n:'Arroz con taquitos de cerdo', base:true, pro:['cerdo_taquitos'],
       it:[['arroz',65],['taquitos_cerdo',120],['verdura_cong',100],['tomate_frito',30],['aove',8]]},
      {id:'A2', n:'Pasta integral con lomo de cerdo', pro:['cerdo_lomo'],
       it:[['pasta_integral',70],['lomo_cerdo',90],['tomate_triturado',100],['cebolla',40],
           ['aove',10],['parmesano',8]],
       nota:'Pasta al dente MENOS 1 minuto: se termina de hacer al recalentar.'},
      {id:'A3', n:'Patata con pechuga y huevo', pro:['pollo_pechuga','huevo'],
       it:[['patata',250],['pechuga_pollo',80],['huevo',55],['guisantes',60],['aove',10]]},
      {id:'A4', n:'Noodles con cerdo y verdura', pro:['cerdo_taquitos'],
       it:[['noodles',60],['taquitos_cerdo',100],['verdura_cong',120],['salsa_soja',12],
           ['aove',10],['sesamo',5]]},
      {id:'A5', n:'Arroz frío con gambas y maíz', pro:['gambas'], frio:true,
       it:[['arroz',60],['gambas',130],['guisantes',70],['maiz_dulce',40],
           ['limon',10],['aove',13]],
       nota:'SE COME TEMPLADO O FRÍO, NO SE CALIENTA. Es la razón de que sea un bowl y no un ' +
            'salteado: la gamba recalentada en microondas se vuelve goma. Cuécelas 90 segundos, ' +
            'córtalas del calor con agua fría y móntalas en frío sobre el arroz.'},
      {id:'A6', n:'Boniato con muslo de pollo', pro:['pollo_muslo'],
       it:[['boniato',250],['muslo_pollo',130],['espinacas',100],['aove',9]]},
      {id:'AR', n:'Almuerzo relajado del domingo', pro:['cerdo_jamon'], dom:true,
       it:[['pan_integral',40],['jamon_cocido',50],['queso_batido',100],['nueces',6]],
       nota:'Solo domingos. Ligero a propósito: deja hueco para la comida libre. Sin fruta, como el resto.'}
    ]},

  /* ─────── COMIDA · 14:00 · TUPPER ─────── */
  comida:{hora:'14:00', n:'Comida (tupper)', obj:{kcal:600,p:40,c:64,g:21},
    nota:'Tupper de la tanda: el mismo plato los tres días. La pasta, al dente menos 1 minuto.',
    op:[
      {id:'C1', n:'Arroz con pechuga y verdura', base:true, pro:['pollo_pechuga'],
       it:[['arroz',70],['pechuga_pollo',130],['verdura_cong',180],['tomate_frito',30],['aove',13]]},

      {id:'C2', n:'Pasta integral con muslo de pollo', pro:['pollo_muslo'],
       it:[['pasta_integral',70],['muslo_pollo',130],['verdura_cong',170],['tomate_frito',35],['aove',10]],
       nota:'La pasta integral aquí no es capricho: sube el plato a 10,7 g de fibra, el segundo más alto del catálogo.'},

      {id:'C3', n:'Pollo katsu con arroz', pro:['pollo_pechuga'],
       it:[['pechuga_pollo',115],['panko',22],['huevo',25],['harina',7],
           ['arroz',50],['verdura_cong',150],['aove',11]],
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

      {id:'C4', n:'Curry de pollo con arroz', pro:['pollo_muslo'],
       it:[['muslo_pollo',145],['nata_ligera',45],['curry_polvo',8],['arroz',60],
           ['cebolla',50],['zanahoria',50],['espinacas',80],['aove',5]],
       nota:'Va con NATA LIGERA, no con leche de coco. Un solo brik cubre este plato y el risotto CK. ' +
            'El aceite baja de 8 a 5 g porque la nata ya aporta 6,75 g de grasa.',
       prep:{t:'30 min', dif:'Fácil',
         ut:['Sartén honda o cazuela','Cazo','Tabla y cuchillo'],
         pasos:[
           'Arroz a cocer.',
           'Cebolla en dados pequeños, zanahoria en rodajas finas, muslo en trozos de 3 cm.',
           'Aceite a fuego medio. Añade el curry en polvo y tuéstalo 30 segundos removiendo, hasta que huela. Este paso cambia el plato por completo.',
           'Añade la cebolla y pochala 4-5 min. Después la zanahoria, 3 min más.',
           'Sube el fuego, añade el pollo y séllalo 4 min.',
           'BAJA a fuego medio-bajo y añade la nata. A diferencia de la leche de coco, la nata se corta si hierve fuerte: que solo tiemble, 6-8 min destapado.',
           'Los últimos 2 minutos, las espinacas congeladas, removiendo hasta que se integren.',
           'Sal al final. Si queda espeso, un par de cucharadas de agua caliente.'],
         tip:'Tostar el curry en el aceite antes de añadir nada más. Echado en seco o al final sabe a polvo; tostado sabe a curry. ' +
             'Y la nata a fuego bajo: es lo único que cambia respecto a la versión con coco.'}},

      {id:'C5', n:'Garbanzos con pollo', pro:['pollo_muslo','legumbre'], leg:true,
       it:[['garbanzos_bote',200],['muslo_pollo',90],['verdura_cong',150],['pan_integral',25],['aove',8]],
       nota:'Cuenta como una de las 2 raciones semanales de legumbre obligatorias. El plato con más fibra del catálogo.'},

      {id:'C6', n:'Boloñesa de cerdo con pasta integral', pro:['cerdo_taquitos'],
       it:[['pasta_integral',65],['taquitos_cerdo',125],['tomate_triturado',130],['cebolla',45],
           ['zanahoria',45],['aove',10],['parmesano',8]],
       prep:{t:'35 min', dif:'Fácil',
         ut:['Sartén honda o cazuela','Olla','Rallador','Tabla y cuchillo'],
         pasos:[
           'Ralla la zanahoria y pica la cebolla muy fina.',
           'Pica los taquitos de cerdo a cuchillo, en trozos de medio centímetro. No hace falta picadora: quedan mejor con algo de mordida.',
           'Aceite a fuego medio. Pocha cebolla y zanahoria 6-8 min, hasta que la cebolla esté transparente. No lo aceleres: aquí se construye el sabor.',
           'Sube el fuego, añade el cerdo y dóralo sin tocarlo 2 minutos. Luego remueve y termina de hacerlo.',
           'Añade el tomate triturado, sal y pimienta. Fuego mínimo, 15-20 min destapado, removiendo de vez en cuando.',
           'Cuece la pasta integral 1 minuto menos de lo que diga el paquete. Reserva un vaso del agua de cocción ANTES de escurrir.',
           'Mezcla la pasta con la salsa a fuego medio, con 2-3 cucharadas del agua de cocción. Un minuto removiendo.',
           'Parmesano rallado fuera del fuego.'],
         tip:'La zanahoria rallada en el sofrito es lo que da el dulzor. Sin ella la boloñesa sabe ácida y se compensa con azúcar, que aquí no queremos.'}},

      {id:'C7', n:'Pollo a la milanesa con pasta', pro:['pollo_pechuga'],
       it:[['pechuga_pollo',100],['panko',22],['huevo',25],['pasta',45],
           ['tomate_triturado',120],['verdura_cong',120],['aove',11],['parmesano',8]],
       nota:'La ensalada de la versión anterior está fuera: 100 g de hoja no aguantan 3 días en tupper ' +
            'y menos recalentada. La sustituye verdura congelada, que sí.',
       prep:{t:'30 min', dif:'Media',
         ut:['Horno o freidora de aire','Bandeja con rejilla','2 platos hondos','Mazo o rodillo','Olla','Sartén pequeña'],
         pasos:[
           'Horno a 200 °C.',
           'Abre la pechuga y aplánala a 1 cm con el mazo.',
           'Bate el huevo en un plato. En otro, mezcla el panko con la MITAD del parmesano rallado y una pizca de sal.',
           'Pasa el pollo por huevo y luego por la mezcla de panko, presionando bien por las dos caras.',
           'Sobre la rejilla, pincela con la mitad del aceite. 9 min, vuelta, resto del aceite, 9 min más.',
           'Cuece la pasta. Aparte, calienta el tomate triturado 5 min con sal y orégano, y saltea la verdura congelada 5-6 min a fuego fuerte sin tapar.',
           'Mezcla pasta y tomate. Sirve con el pollo en tiras, la verdura y el resto del parmesano.'],
         tip:'El parmesano dentro del panko es lo que separa una milanesa de un empanado soso. Solo la mitad ahí: el resto va al plato.'}},

      {id:'C8', n:'Arroz frito con pollo y huevo', pro:['pollo_pechuga','huevo'],
       it:[['arroz',60],['pechuga_pollo',105],['huevo',55],['guisantes',60],['zanahoria',45],
           ['salsa_soja',15],['aove',11],['sesamo',4]],
       prep:{t:'20 min · requiere arroz del día anterior', dif:'Media',
         ut:['Wok o sartén grande','Espátula','Bol pequeño','Tabla y cuchillo'],
         pasos:[
           'IDEAL: arroz cocido el día anterior y guardado en nevera. Si lo haces al momento, cuécelo, extiéndelo en un plato y déjalo enfriar 20 min.',
           'Zanahoria en dados muy pequeños. Pechuga en dados de 1,5 cm.',
           'Bate el huevo. Wok a fuego fuerte con un poco del aceite, cuájalo removiendo, sácalo y resérvalo.',
           'Más aceite, fuego máximo. Pollo 4-5 min hasta que dore, con sal y pimienta. Fuera.',
           'Resto del aceite: zanahoria 2 min, guisantes 2 min.',
           'Añade el arroz frío y aplástalo contra el fondo con la espátula, dejándolo quieto 30 segundos entre removidas. Eso es lo que le da el punto salteado.',
           'Devuelve huevo y pollo, añade la soja por el borde del wok y remueve todo 1 minuto.',
           'Sésamo fuera del fuego.'],
         tip:'Arroz del día anterior, sin excepción. El recién hecho tiene demasiada humedad y almidón: se empasta y sale un arroz con cosas, no un arroz frito.'}},

      {id:'C9', n:'Lomo de cerdo con patata y champiñones', pro:['cerdo_lomo'],
       it:[['lomo_cerdo',140],['patata',260],['champinones',120],['cebolla',40],
           ['aove',13],['pan_integral',20]],
       nota:'El pan va aparte, para mojar. La patata puede venir ya cocida de la tanda.'},

      {id:'C10', n:'Muslo de pollo al horno con boniato', pro:['pollo_muslo'],
       it:[['muslo_pollo',150],['boniato',260],['verdura_cong',150],['aove',10]],
       nota:'Sustituye a la merluza con arroz: el pescado congelado se ha ido entero a las cenas. ' +
            'Es el tupper con más fibra del catálogo (12,3 g) por el boniato. Todo en la misma bandeja, ' +
            '200 °C, 35-40 min.'},

      {id:'CLIBRE', n:'Comida libre del domingo', libre:true, techo:900, dom:true, pro:[],
       it:[],
       nota:'Solo domingos y ESTABA EN EL PLAN: no cuenta como incumplimiento. Techo de 900 kcal. ' +
            'Apunta ~42 g de proteína dentro de ella (un segundo a la plancha lo cubre) o el día ' +
            'se queda corto en el único macro que no se puede fallar. Regístrala con "Registro libre".'}
    ]},

  /* ─────── PRE-ENTRENO · 17:00 ─────── */
  pre:{hora:'17:00', n:'Pre-entreno', obj:{kcal:330,p:24,c:57,g:2},
    nota:'30-45 min antes de entrenar. Grasa casi nula A PROPÓSITO: retrasaría la digestión. ' +
         'SIN MIEL: eran 5-6 g, o sea 16-19 kcal. Al quitarla solo P1 se caía a ámbar, y se ha ' +
         'compensado con 5-7 g más de pan en P1, P2 y P4. Los cinco siguen en verde.',
    op:[
      {id:'P1', n:'Pan integral con queso batido', base:true,
       it:[['pan_integral',92],['queso_batido',170]]},
      {id:'P2', n:'Plátano, pan y yogur griego',
       it:[['platano',120],['pan_integral',45],['yogur_griego0',170]]},
      {id:'P3', n:'Dos plátanos y queso batido',
       it:[['platano',240],['queso_batido',200]],
       nota:'La más rápida: cero preparación.'},
      {id:'P4', n:'Manzana, pan y queso batido',
       it:[['manzana',180],['pan_integral',57],['queso_batido',180]]},
      {id:'P5', n:'Leche, queso batido y plátano',
       it:[['leche_desn',250],['queso_batido',100],['platano',120],['pan_integral',35]]}
    ]},

  /* ─────── CENA · 20:45 · POST-ENTRENO ─────── */
  cena:{hora:'20:45', n:'Cena (post-entreno)', obj:{kcal:615,p:34,c:62,g:26},
    nota:'Se cocinan al momento. Entre semana, TECHO DE 30 MINUTOS: sales del gimnasio a 19:30 y ' +
         'cenas a 20:45. Fin de semana pueden ser de 35-50 min. La patata y el arroz pueden venir ' +
         'ya cocidos de la tanda.',
    op:[
      {id:'CA', n:'Huevos con patata', base:true, rot:'A', min:15, pro:['huevo'],
       it:[['huevo',220],['patata',300],['ensalada',130],['aove',7]],
       nota:'4 huevos ya traen 20,9 g de grasa: 7 g de aceite bastan. Al horno o con sartén antiadherente.'},
      /* ── Las tres merluzas ──
         La merluza es CONGELADA, así que vive en la cena: se saca del congelador
         por la mañana y descongela en la nevera durante el día.
         Tres técnicas distintas a propósito, y en este orden de calidad para
         pescado congelado:
           CN guisada  → la mejor. La textura da igual, la salsa la arregla.
           CP rebozada → muy buena. El rebozado sella el agua que suelta.
           CB al horno → buena. Calor seco y envolvente.
         Lo que NO hay es merluza a la plancha: el congelado suelta agua en la
         sartén y se cuece en su jugo en lugar de dorarse. La versión anterior de
         CB era a la plancha y era el peor uso posible del producto. */

      {id:'CB', n:'Merluza al horno con patata', rot:'B', min:25, pro:['merluza'], pesc:true,
       it:[['merluza',165],['patata',300],['verdura_cong',150],['aove',20]],
       prep:{t:'25 min', dif:'Fácil',
         ut:['Bandeja de horno','Papel de cocina','Tabla y cuchillo'],
         pasos:[
           'Horno a 200 °C, calor arriba y abajo.',
           'SECA LOS LOMOS CON PAPEL DE COCINA, por las dos caras y con insistencia. El congelado ' +
           'retiene mucha agua y es lo único que separa un pescado al horno de un pescado hervido.',
           'Patata en rodajas de 3 mm. Si viene ya cocida de la tanda, sáltate esto y solo la doras.',
           'Extiende la patata en la bandeja con la mitad del aceite, sal y pimienta. 12 min al horno sola.',
           'Saca la bandeja, coloca los lomos encima, riega con el resto del aceite y sal.',
           'Otros 10-12 min, según el grosor. Está listo cuando la carne se separa en láminas al presionar.',
           'La verdura congelada, en sartén aparte 5-6 min a fuego fuerte y sin tapar.'],
         tip:'La patata entra 12 minutos antes que el pescado. Si los metes juntos, o la patata queda cruda o la merluza queda seca.'}},

      {id:'CN', n:'Merluza en salsa verde con patata', min:25, pro:['merluza'], pesc:true,
       it:[['merluza',150],['patata',300],['guisantes',80],['ajo',6],
           ['harina',6],['caldo_pollo',100],['aove',20]],
       nota:'LA MEJOR OPCIÓN PARA MERLUZA CONGELADA: al ir guisada, el agua que suelta se ' +
            'integra en la salsa en lugar de arruinar la textura. Perejil abundante, que no pesa.',
       prep:{t:'25 min', dif:'Fácil',
         ut:['Cazuela ancha y baja','Tabla y cuchillo','Cuchara de madera'],
         pasos:[
           'Seca los lomos con papel y sálalos. Lamina el ajo muy fino.',
           'Cazuela a fuego medio-bajo con el aceite. Ajo laminado 1 minuto, SIN que coja color: dorado amarga la salsa.',
           'Añade la harina y remueve 1-2 minutos para tostarla. Este paso es el que evita que la salsa sepa a crudo.',
           'Añade el caldo poco a poco removiendo en círculos, y un puñado grande de perejil picado.',
           'Cuando espese ligeramente, mete los lomos con la piel hacia abajo y los guisantes.',
           'Fuego bajo, 8-10 minutos. NO REMUEVAS con la cuchara: mueve la cazuela en vaivén cada minuto. ' +
           'Es lo que emulsiona la salsa y lo que evita que el pescado se deshaga.',
           'La patata cocida de la tanda, en rodajas, los últimos 3 minutos dentro de la salsa.'],
         tip:'El vaivén de la cazuela en lugar de la cuchara. La gelatina del pescado es la que liga la salsa verde, y removiendo la rompes.'}},

      {id:'CP', n:'Merluza rebozada con arroz', min:25, pro:['merluza'], pesc:true,
       it:[['merluza',150],['harina',12],['huevo',30],['arroz',60],
           ['verdura_cong',150],['limon',10],['aove',17]],
       nota:'El rebozado sella el agua del congelado, así que es la segunda mejor técnica ' +
            'para este producto. A la romana: harina y huevo, sin pan rallado.',
       prep:{t:'25 min', dif:'Fácil',
         ut:['Sartén honda','2 platos hondos','Papel de cocina','Cazo','Pinzas'],
         pasos:[
           'Arroz a cocer, o usa el de la tanda.',
           'SECA LOS LOMOS A CONCIENCIA y córtalos en tacos de 4-5 cm. Sal y pimienta.',
           'Harina en un plato, huevo batido en otro.',
           'Aceite en la sartén a fuego medio-alto. Está listo cuando una pizca de harina burbujea al caer.',
           'Pasa cada taco por harina —sacudiendo el exceso— y luego por huevo. En ese orden: al revés no agarra.',
           'A la sartén sin abarrotar, 2 minutos por cara. Salen cuando el rebozado está dorado y firme.',
           'A papel de cocina 30 segundos para que suelte el aceite de fuera.',
           'Verdura congelada aparte, 5-6 min a fuego fuerte. Limón al servir.'],
         tip:'Harina primero y huevo después, nunca al revés, y el pescado bien seco. Sobre pescado húmedo el rebozado se despega en la sartén y te quedas con la merluza desnuda y una sartén sucia.'}},
      {id:'CC', n:'Garbanzos con pollo', rot:'C', min:15, leg:true, pro:['pollo_muslo','legumbre'],
       it:[['garbanzos_bote',200],['muslo_pollo',65],['verdura_cong',150],['pan_integral',45],['aove',8]],
       nota:'OBLIGATORIA 2 veces/semana junto a CC2. Sin avena, la legumbre es lo que sostiene los 30-40 g de fibra.'},
      {id:'CC2',n:'Alubias blancas con pollo', rot:'C', min:15, leg:true, pro:['pollo_muslo','legumbre'],
       it:[['alubias_bote',250],['muslo_pollo',65],['verdura_cong',150],['pan_integral',40],['aove',12]],
       nota:'Variante de CC. Cuenta igual como ración de legumbre.'},
      {id:'CE', n:'Tortilla de patata con ensalada', min:30, pro:['huevo'],
       it:[['patata',250],['huevo',165],['claras',70],['ensalada',130],['aove',12]],
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
      {id:'CH', n:'Salteado de cerdo con arroz', min:20, pro:['cerdo_lomo'],
       it:[['lomo_cerdo',110],['arroz',65],['verdura_cong',170],['salsa_soja',15],
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

      {id:'CJ', n:'Lasaña de calabacín y cerdo', min:50, fds:true, pro:['cerdo_taquitos'],
       it:[['taquitos_cerdo',85],['calabacin',250],['tomate_triturado',150],['mozzarella',40],
           ['patata',200],['aove',12],['parmesano',8]],
       nota:'50 min: SOLO sábado o domingo. Va con taquitos de cerdo picados a cuchillo, ' +
            'no con picada de ternera (5,40 €/100 g de proteína y preparado de carne).',
       prep:{t:'50 min', dif:'Media-alta',
         ut:['Horno','Fuente para horno','Sartén','Mandolina o cuchillo bien afilado','Papel de cocina'],
         pasos:[
           'Horno a 190 °C.',
           'Corta el calabacín a lo largo en láminas de 3 mm. Extiéndelas sobre papel de cocina, sal por encima, y déjalas 10 minutos. Después sécalas bien.',
           'Corta la patata en rodajas de 3 mm y dales 6 min de microondas, o cuécelas 8 min. Tienen que quedar casi hechas: en el horno no se cocinan solas.',
           'Pica los taquitos de cerdo a cuchillo en trozos de medio centímetro. Sartén con la mitad del aceite: dóralos 3-4 min, añade el tomate triturado, sal, pimienta y orégano, y reduce 8 min a fuego bajo.',
           'Monta en la fuente: base de patata, mitad de la carne, capa de calabacín, resto de la carne, otra capa de calabacín.',
           'Mozzarella en trozos y parmesano rallado por encima. Riega con el resto del aceite.',
           'Horno 25 min. Los últimos 5 con gratinador si lo tienes.',
           'Deja reposar 10 minutos antes de cortar, o se desmonta.'],
         tip:'El paso de la sal en el calabacín no se salta. Sin él suelta toda el agua dentro del horno y acabas con una sopa en la fuente.'}},

      {id:'CK', n:'Risotto de champiñones con pollo', min:35, fds:true, pro:['pollo_muslo'],
       it:[['arroz',60],['muslo_pollo',110],['champinones',180],['nata_ligera',40],
           ['parmesano',12],['cebolla',45],['aove',8]],
       nota:'35 min: sábado o domingo. Es la cena con MENOS FIBRA del catálogo (3,4 g). Si el día se ' +
            'queda cerca de 30 g, cambia los 45 g de cebolla por 60 g de guisantes congelados: ' +
            '+3 g de fibra por 12 kcal.',
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
      {id:'CL', n:'Patata con jamón y cottage', min:5, pro:['cerdo_jamon'],
       it:[['patata',320],['jamon_cocido',100],['queso_cottage',50],['ensalada',150],
           ['aove',12],['nueces',8]],
       nota:'La cena de 5 minutos, con la patata ya cocida de la tanda. Cero fuego. ' +
            'REESCRITA: la versión anterior llevaba 250 g de cottage, cinco veces el límite. ' +
            'Ahora la proteína la pone el jamón cocido y el cottage vuelve a ser el acento (50 g).'},

      {id:'CM', n:'Pan con huevo, jamón y cottage', min:10, pro:['huevo','cerdo_jamon'],
       it:[['pan_integral',100],['huevo',110],['jamon_cocido',40],['queso_cottage',50],
           ['ensalada',150],['aove',8]],
       nota:'10 minutos. REESCRITA igual que CL: llevaba 200 g de cottage, ahora 50. ' +
            'Dos huevos a la plancha sobre el pan, jamón y el cottage por encima fuera del fuego.'}
    ]}
};

/* Rotación de cenas por letra, heredada. Se conserva porque el calendario
   la muestra como pista, pero el planificador real es MENU_PLAN. */
const CENA_ROT = {1:'A', 2:'C', 3:'A', 4:'B', 5:'C', 6:'B', 0:'A'};

/* ═══════════════════ PLANIFICADOR DE MENÚ ═══════════════════
   Modelo de TANDAS, no de rotación por día de la semana. Es la diferencia
   de fondo con la versión anterior de la app, que servía siempre el mismo
   desayuno, almuerzo y comida y solo rotaba la cena.

   Estructura real (§10):
   · Domingo tarde  → tanda que cubre L-M-X
   · Miércoles noche → tanda que cubre J-V-S
   · El almuerzo y la comida son EL MISMO PLATO los tres días del bloque.
   · Desayuno, pre-entreno y cena cambian a diario.
   · Domingo: almuerzo relajado + comida libre con techo de 900 kcal.

   Todo es función pura de la fecha: no hay estado que arrastrar, así que
   la vista de varios días se calcula de golpe sin recorrer el calendario. */
const MENU_PLAN = {

  /* Primer día de la primera tanda: jueves 20 de agosto de 2026, cocinada
     la noche del miércoles 19. anchorWeek es el lunes de esa semana. */
  anchor:'2026-08-20',
  anchorWeek:'2026-08-17',

  /* Ciclo diario de 5. Desayuno y pre-entreno avanzan un puesto cada día. */
  des:['D1','D2','D3','D4','D5'],
  pre:['P1','P2','P3','P4','P5'],

  /* 30 bloques de 3 días = 15 semanas sin repetir pareja almuerzo+comida,
     que es exactamente lo que salía de 6 almuerzos y 10 comidas.
     LAS 30 PAREJAS ESTÁN VALIDADAS CONTRA §8.2: ninguna comparte clave de
     proteína entre el almuerzo y la comida del mismo día. Si tocas esta
     tabla, la vista de menú te avisa en rojo del bloque que rompe la regla
     (checkBlocks() más abajo). */
  blocks:[
    ['A5','C6'],  ['A3','C10'], ['A2','C1'],  ['A6','C7'],  ['A1','C2'],
    ['A4','C9'],  ['A2','C3'],  ['A5','C8'],  ['A3','C4'],  ['A6','C6'],
    ['A1','C10'], ['A4','C7'],  ['A2','C4'],  ['A6','C1'],  ['A5','C5'],
    ['A3','C2'],  ['A1','C3'],  ['A4','C8'],  ['A2','C5'],  ['A6','C3'],
    ['A5','C9'],  ['A1','C4'],  ['A3','C5'],  ['A4','C10'], ['A6','C8'],
    ['A2','C6'],  ['A5','C7'],  ['A1','C1'],  ['A3','C9'],  ['A4','C2']
  ],

  /* Cenas: CUATRO patrones semanales que rotan. Índice = día (0 = domingo).
     Los cuatro cumplen las cuatro reglas a la vez:
       · 3 cenas de MERLUZA por semana (CB horno · CN salsa verde · CP rebozada)
       · 2 cenas de legumbre (CC, CC2), mínimo obligatorio sin avena
       · las siete cenas de la semana, distintas
       · CJ (50 min), CK (35) y CE (30) solo en sábado o domingo; de lunes a
         viernes nada por encima de 30 min

     POR QUÉ CUATRO Y NO DOS: 3 merluzas + 2 legumbres son 5 de las 7 cenas
     fijas. Solo quedan 2 huecos por semana para las otras siete recetas
     (CA, CE, CH, CJ, CK, CL, CM), así que con un ciclo de 2 semanas la mitad
     no aparecería nunca. Con 4 semanas cada una sale al menos una vez. */
  cenas:[
    {1:'CB', 2:'CC',  3:'CN', 4:'CC2', 5:'CP',  6:'CK', 0:'CA'},
    {1:'CH', 2:'CN',  3:'CC', 4:'CB',  5:'CC2', 6:'CJ', 0:'CP'},
    {1:'CP', 2:'CC2', 3:'CB', 4:'CC',  5:'CN',  6:'CE', 0:'CL'},
    {1:'CM', 2:'CB',  3:'CC2',4:'CP',  5:'CC',  6:'CJ', 0:'CN'}
  ],

  domAlmuerzo:'AR',
  domComida:'CLIBRE',

  /* Umbral de aviso de cottage por día. NO es una regla nutricional: es
     coste. Con el cottage como protagonista de 4 de los 5 desayunos el
     consumo medio sube a ~111 g/día, o sea ~12 tarrinas de 300 g al mes
     frente a las ~3,4 de antes. Por encima de este valor el día sale en
     ámbar para que la cifra esté delante y no escondida. */
  cottageAviso:150,

  /* ── Índices, todos derivados de la fecha ── */

  /* Número de bloque de 3 días. -1 los domingos, que no tienen bloque. */
  blockSeq(f){
    if(D.dow(f)===0) return -1;
    const semanas = Math.round(D.diffDays(this.anchorWeek, D.weekStart(f)) / 7);
    return semanas*2 + (D.dow(f)>=4 ? 1 : 0) - 1;
  },

  /* Puesto del ciclo diario. Módulo positivo, para que funcione también
     con fechas anteriores al ancla. */
  daySeq(f){
    const n = D.diffDays(this.anchor, f);
    return ((n % 5) + 5) % 5;
  },

  weekSeq(f){
    const n = this.cenas.length;
    const s = Math.round(D.diffDays(this.anchorWeek, D.weekStart(f)) / 7);
    return ((s % n) + n) % n;
  },

  /* Id de plato planificado para una fecha y una franja */
  idFor(f, comida){
    const dom = D.dow(f)===0;
    switch(comida){
      case 'desayuno': return this.des[this.daySeq(f)];
      case 'pre':      return this.pre[this.daySeq(f)];
      case 'cena':     return this.cenas[this.weekSeq(f)][D.dow(f)];
      case 'almuerzo': {
        if(dom) return this.domAlmuerzo;
        const b = this.blockSeq(f);
        return this.blocks[((b % this.blocks.length) + this.blocks.length) % this.blocks.length][0];
      }
      case 'comida': {
        if(dom) return this.domComida;
        const b = this.blockSeq(f);
        return this.blocks[((b % this.blocks.length) + this.blocks.length) % this.blocks.length][1];
      }
    }
    return null;
  },

  /* Fecha de la sesión de batch cooking que cubre esta fecha */
  tandaInfo(f){
    const dw = D.dow(f);
    if(dw===0) return {n:'Domingo · comida libre', cocina:null, dias:[f]};
    const esJVS = dw>=4;
    const lunes = D.weekStart(f);
    const ini = esJVS ? D.add(lunes,3) : lunes;
    return {
      n: esJVS ? 'Tanda J-V-S' : 'Tanda L-M-X',
      cocina: esJVS ? D.add(lunes,2) : D.add(lunes,-1),   // miércoles noche / domingo tarde
      cocinaTxt: esJVS ? 'miércoles por la noche' : 'domingo por la tarde',
      dias: [ini, D.add(ini,1), D.add(ini,2)],
      seq: this.blockSeq(f)
    };
  },

  /* Comprobación de la tabla de bloques contra §8.2. Devuelve los bloques
     en los que el almuerzo y la comida comparten proteína. Debe salir vacío. */
  checkBlocks(){
    const pro = id=>{
      for(const c of ['almuerzo','comida']){
        const o = MEALS[c].op.find(x=>x.id===id);
        if(o) return o.pro || [];
      }
      return [];
    };
    return this.blocks
      .map((b,i)=>({i, a:b[0], c:b[1], choque:pro(b[0]).filter(k=>pro(b[1]).includes(k))}))
      .filter(x=>x.choque.length);
  },

  /* Comprobación de los patrones de cena. Devuelve un fallo por regla
     incumplida, con la semana y el detalle. Debe salir vacío.
     Existe porque las cuatro reglas se contradicen con facilidad: al meter
     la tercera merluza, la mitad de las recetas se quedaron sin hueco y no
     me di cuenta hasta contarlas. */
  checkCenas(){
    const op  = id=>MEALS.cena.op.find(o=>o.id===id);
    const err = [];

    this.cenas.forEach((pat,w)=>{
      const ids  = Object.values(pat);
      const ops  = ids.map(op);

      if(ops.some(o=>!o))
        err.push({w, regla:'plato inexistente',
          det:ids.filter(id=>!op(id)).join(', ')});

      const dup = ids.filter((x,i)=>ids.indexOf(x)!==i);
      if(dup.length)
        err.push({w, regla:'cenas repetidas en la semana', det:[...new Set(dup)].join(', ')});

      const pesc = ops.filter(o=>o && o.pesc).length;
      if(pesc !== 3)
        err.push({w, regla:'cenas de merluza ≠ 3', det:pesc+' esta semana'});

      const leg = ops.filter(o=>o && o.leg).length;
      if(leg < 2)
        err.push({w, regla:'menos de 2 legumbres', det:leg+' esta semana'});

      /* Techo de 30 min de lunes a viernes */
      const largos = [1,2,3,4,5]
        .map(d=>op(pat[d]))
        .filter(o=>o && o.min > 30)
        .map(o=>`${o.id} (${o.min} min)`);
      if(largos.length)
        err.push({w, regla:'cena de más de 30 min entre semana', det:largos.join(', ')});
    });

    return err;
  }
};

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
  bc_base:{
    n:'Guarnición base de la tanda (3 días)', raciones:3,
    it:[['arroz',200],['patata',900]],
    pasos:['El arroz y la patata de los tres días, de una vez. Son la mitad del trabajo de la tanda.',
           'Arroz hervido: 200 g en crudo rinden ~520 g cocidos.',
           'Patata cocida CON PIEL y pelada después: pierde menos agua y sabe mejor.',
           'Aguantan 3 días en nevera. La patata cocida es lo que hace que CL sea una cena de 5 minutos ' +
           'y que CA, CB y C9 bajen de 30.',
           'PESAR EN CRUDO antes de cocinar y repartir por raciones.']},

  bc_proteina:{
    n:'Proteína de la tanda (3 almuerzos + 3 comidas)', raciones:3,
    it:[],
    pasos:['El gramaje sale de los dos platos que toquen en el bloque: míralos en la vista de Menú ' +
           'y multiplica por 3. La pestaña Compra ya te lo hace sumado si eliges 3 días.',
           'Carne al horno en UNA sola bandeja, 200 °C, 35-40 min. Pescado aparte, 12-15 min.',
           'El aceite en crudo, el tomate frito y el parmesano se añaden en el momento, no al tupper.',
           'Etiqueta cada tupper con el día. Suena excesivo hasta la primera vez que te comes ' +
           'el del viernes un lunes.']},

  bc_pasta:{
    n:'Pasta de la tanda', raciones:3,
    it:[['pasta_integral',210]],
    pasos:['AL DENTE MENOS 1 MINUTO. Se termina de hacer al recalentar en el microondas.',
           'Escurrir, enfriar con un hilo de agua y mezclar con un poco de aceite para que no se pegue.',
           'La salsa, en un compartimento aparte si el tupper lo tiene: la pasta la absorbe en 3 días.']},

  tortilla_patata:{
    n:'Tortilla de patata para cena (CE)', raciones:1,
    it:[['patata',250],['huevo',165],['claras',70],['aove',12]],
    pasos:['Patata en rodajas finas, pochada en el aceite a fuego medio-bajo 12-15 min.',
           'Batir huevo entero + claras. Reposar la patata 5 min dentro del huevo.',
           'Cuajar a fuego medio 3-4 min por cara.']}
};

/* ═══════════════════ CONVERSIONES CRUDO → COCINADO ═══════════════════
   Todos los gramajes del plan son EN CRUDO. Esta tabla es solo informativa,
   para cuando toque pesar algo ya cocinado. */
const COOK_FACTOR = {
  muslo_pollo:0.75, pechuga_pollo:0.75,
  lomo_cerdo:0.75, taquitos_cerdo:0.75,
  merluza:0.80, lubina:0.80, salmon:0.80,
  arroz:2.60, pasta:2.40, pasta_integral:2.40, patata:0.95, boniato:0.95,
  garbanzos_bote:1, alubias_bote:1
};

/* ═══════════════════ OBJETIVOS DIARIOS DE FIBRA E HIDRATACIÓN ═══════════════════ */
const DAILY_EXTRAS = {
  fibra:{min:30, max:40,
    nota:'El día más flojo es el que lleva risotto CK (3,4 g en la cena). Arreglo dentro de §7: ' +
         'cambia los 45 g de cebolla del risotto por 60 g de guisantes congelados, +3 g de fibra por 12 kcal.'},
  cottage:{aviso:150,
    nota:'Con el cottage protagonista de 4 de los 5 desayunos el consumo medio es ~111 g/día: ' +
         '~12 tarrinas de 300 g al mes frente a ~3,4 antes. Es preferencia, no eficiencia ' +
         '(11,7 g P/100 kcal frente a 22,3 del queso batido). Los días por encima de 150 g salen en ámbar.'},
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
  taquitos_cerdo:{sec:1, pack:400, un:'bandejas de 400 g',
                  nota:'Si te cansas de ellos: lomo en pieza a 4,95 €/kg cortado en dados. Más barato y más magro.'},
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
  queso_cottage: {sec:3, pack:300, un:'tarrinas de 300 g',
                  nota:'A ~111 g/día son unas 12 tarrinas al mes. Es la línea que más sube de la cesta ' +
                       'con los desayunos nuevos.'},
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
  pasta_integral:{sec:5, pack:500, un:'paquetes de 500 g',
                  nota:'8 g de fibra/100 g frente a 3 de la normal. Es la que llevan A2, C2 y C6.'},
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
  brocoli:         {sec:0, factor:1.33, un:'g con tronco', granel:true},
  salsa_worcester: {sec:5, pack:150,  un:'botellas de 150 ml'},
  maicena:         {sec:5, pack:400,  un:'paquetes de 400 g'},
  vinagre:         {sec:5, pack:750,  un:'botellas de 750 ml'},
  vino_blanco:     {sec:5, pack:750,  un:'botellas de 750 ml'},
  caldo_pollo:     {sec:5, pack:1000, un:'briks de 1 L'},
  aceite_sesamo:   {sec:6, pack:250,  un:'botellas de 250 ml'},
  limon:           {sec:0, ud:40,     un:'limones', nota:'Un limón da unos 40 ml de zumo.'}  
};

/* Extras que no salen del menú pero hay que comprar igual */
const SHOP_FIJOS = [
  {sec:5, n:'Café', cant:'1 paquete'},
  {sec:5, n:'Sal, especias, vinagre', cant:'según necesites'},
  {sec:6, n:'Aceite de girasol (para cocinar)', cant:'opcional, abarata el AOVE'}
];